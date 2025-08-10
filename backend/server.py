from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import base64
import uuid
import requests
import asyncio
import re
from datetime import datetime, timedelta
import litellm
# Commented out emergentintegrations imports for deployment
# from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Fire Extinguisher Inspection API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
users_collection = db["users"]
sessions_collection = db["sessions"]
inspections_collection = db["inspections"]

# Environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

# Models
class User(BaseModel):
    id: str
    email: str
    name: str
    picture: str

class Session(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime

class InspectionRequest(BaseModel):
    image_base64: str
    location: str
    notes: Optional[str] = None
    gps_data: Optional[Dict[str, Any]] = None
    business_name: Optional[str] = None

class InspectionResult(BaseModel):
    id: str
    user_id: str
    location: str
    image_base64: str
    inspection_date: datetime
    due_date: Optional[datetime] = None
    status: str
    gemini_response: str
    notes: Optional[str] = None

class InspectionDateUpdate(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    extracted_text: Optional[str] = None

class InspectionUpdate(BaseModel):
    last_inspection_date: Optional[InspectionDateUpdate] = None
    next_due_date: Optional[InspectionDateUpdate] = None
    extinguisher_type: Optional[str] = None
    maintenance_notes: Optional[str] = None
    condition: Optional[str] = None
    requires_attention: Optional[bool] = None
    location: Optional[str] = None
    notes: Optional[str] = None


# AI Analysis Helper Functions
async def analyze_image_layer(prompt: str, data_url: str) -> str:
    """Generic helper to call the AI model with a specific prompt and image."""
    try:
        print(f"🔍 AI Analysis Starting...")
        print(f"🔑 API Key: {OPENROUTER_API_KEY[:20]}...")
        print(f"📝 Prompt: {prompt[:100]}...")
        print(f"🖼️ Image URL length: {len(data_url)}")
        
        # Use OpenRouter Gemini 2.5 Pro by default; can be overridden via MODEL_ID
        model_id = os.getenv("MODEL_ID", "openrouter/google/gemini-2.5-pro")
        request_timeout = int(os.getenv("LLM_TIMEOUT", "240"))
        response = await litellm.acompletion(
            model=model_id,
            api_key=OPENROUTER_API_KEY,
            api_base="https://openrouter.ai/api/v1",
            timeout=request_timeout,
            max_tokens=1000,  # Increased from default to avoid truncation
            temperature=0.1,  # Low temperature for consistent analysis
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an NFPA-10–savvy fire safety expert analyzing hole-punched extinguisher tags. "
                        "Infer the most recent year/month/day from punches; prefer the newest complete combo. "
                        "If multiple days are punched, choose the lowest; if unreadable, answer 'unknown'. "
                        "Always respond with only the exact value requested by the user message (no prose)."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": { "url": data_url }
                        }
                    ]
                }
            ]
        )
        # Handle response - check content first, then reasoning if content is empty
        message = response.choices[0].message
        result = message.content.strip() if message.content else ""
        
        # If content is empty but reasoning exists, use reasoning
        if not result and hasattr(message, 'reasoning') and message.reasoning:
            result = message.reasoning.strip()
            print(f"📝 Using reasoning field as content was empty")
            
        print(f"✅ AI Response Success: {result}")
        return result
    except Exception as e:
        # Enhanced error logging for debugging
        print(f"❌ AI Analysis Error - Model: {os.getenv('MODEL_ID', 'openrouter/google/gemini-2.5-pro')}")
        print(f"❌ AI Analysis Error - API Key: {OPENROUTER_API_KEY[:20]}...")
        print(f"❌ AI Analysis Error - Error Type: {type(e).__name__}")
        print(f"❌ AI Analysis Error - Full Error: {str(e)}")
        print(f"❌ AI Analysis Error - Prompt: {prompt[:100]}...")
        return "unknown"

async def extract_raw_text(data_url: str) -> str:
    """Layer 1: Performs OCR to get all visible text."""
    prompt = "Look at this fire extinguisher inspection tag and extract ALL visible text exactly as it appears. Include numbers, dates, punched holes, and any written text. Return only the raw text with no commentary."
    return await analyze_image_layer(prompt, data_url)

async def analyze_year(raw_text: str, data_url: str) -> str:
    """Layer 2a: Analyzes and extracts the inspection year."""
    prompt = f"This is a fire extinguisher inspection tag. Look for the most recent inspection year - this could be punched holes, handwritten numbers, or printed dates. The year should be between 2020-2025. From this text: '{raw_text}' and the image, what is the inspection YEAR? Respond with only the 4-digit year (e.g., 2024) or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_month(raw_text: str, data_url: str) -> str:
    """Layer 2b: Analyzes and extracts the inspection month."""
    prompt = f"This is a fire extinguisher inspection tag. Look for the most recent inspection month - this could be punched holes, handwritten numbers, or printed dates. From this text: '{raw_text}' and the image, what is the inspection MONTH? Respond with only the month number (1-12) or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_day(raw_text: str, data_url: str) -> str:
    """Layer 2c: Analyzes and extracts the inspection day."""
    prompt = f"This is a fire extinguisher inspection tag. Look for the most recent inspection day - this could be punched holes, handwritten numbers, or printed dates. From this text: '{raw_text}' and the image, what is the inspection DAY? Respond with only the day number (1-31) or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_extinguisher_type(raw_text: str, data_url: str) -> str:
    """Layer 3a: Analyzes and extracts the extinguisher type."""
    prompt = f"This is a fire extinguisher inspection tag. Look for the extinguisher type classification (like ABC, BC, CO2, Class A, Class B, Class C, Class K, Water, Foam, etc.). From this text: '{raw_text}' and the image, what is the extinguisher TYPE? Respond with only the type (e.g., 'ABC', 'CO2') or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_condition(raw_text: str, data_url: str) -> str:
    """Layer 3b: Analyzes and assesses the extinguisher condition."""
    prompt = f"This is a fire extinguisher inspection tag. Based on the inspection information, assess the overall condition. Look for any indicators of problems, maintenance needs, or good condition. From this text: '{raw_text}' and the image, what is the overall CONDITION? Respond with only 'Good', 'Fair', 'Poor', or 'unknown'."
    return await analyze_image_layer(prompt, data_url)

async def analyze_company_info(raw_text: str, data_url: str) -> str:
    """Layer 3c: Extracts service company information."""
    prompt = f"This is a fire extinguisher inspection tag. Look for the service company information including company name, address, phone number, and website. From this text: '{raw_text}' and the image, extract the COMPANY INFO. Respond with a JSON object like {{'name': 'Company Name', 'address': 'Full Address', 'phone': 'Phone Number', 'website': 'Website'}} or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_equipment_numbers(raw_text: str, data_url: str) -> str:
    """Layer 3d: Extracts equipment identification numbers."""
    prompt = f"This is a fire extinguisher inspection tag. Look for equipment identification numbers like AE#, HE#, EE#, FE# or similar asset/equipment numbers. From this text: '{raw_text}' and the image, extract the EQUIPMENT NUMBERS. Respond with a JSON object like {{'ae_number': 'value', 'he_number': 'value', 'ee_number': 'value', 'fe_number': 'value'}} or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

async def analyze_service_details(raw_text: str, data_url: str) -> str:
    """Layer 3e: Extracts service type and details performed."""
    prompt = f"This is a fire extinguisher inspection tag. Look for service type checkboxes or markings like ANNUAL INSP, SEMI ANNUAL INSP, QUARTERLY INSP, REPAIR, RECHARGE, NEW INSTALL, HYDRO, F/A, P/A, C/A, etc. From this text: '{raw_text}' and the image, extract the SERVICE DETAILS. Respond with a JSON object like {{'service_type': 'Annual Inspection', 'additional_services': ['Recharge', 'Repair']}} or 'unknown' if not found."
    return await analyze_image_layer(prompt, data_url)

def consolidate_analysis(
    year: str, month: str, day: str,
    extinguisher_type: str, condition: str,
    company_info: str, equipment_numbers: str, service_details: str,
    raw_text: str
) -> dict:
    """Layer 4: Consolidates results into the final JSON object."""
    # Basic date parsing
    try:
        year_int = int(year) if year.isdigit() else None
    except (ValueError, TypeError):
        year_int = None
    
    try:
        month_int = int(month) if month.isdigit() else None
    except (ValueError, TypeError):
        month_int = None
        
    try:
        day_int = int(day) if day.isdigit() else None
    except (ValueError, TypeError):
        day_int = None

    # Calculate next due date (simple +1 year logic)
    next_due_date_obj = None
    if year_int and month_int and day_int:
        try:
            last_date = datetime(year_int, month_int, day_int)
            # Due date is one year from the last inspection
            next_due_date = last_date.replace(year=last_date.year + 1)
            next_due_date_obj = {
                "year": next_due_date.year,
                "month": next_due_date.month,
                "day": next_due_date.day,
                "extracted_text": f"Calculated as 1 year after {year}-{month}-{day}"
            }
        except ValueError:
            next_due_date_obj = None

    # Determine `requires_attention`
    requires_attention = (
        condition.lower() == "poor" or
        any(keyword in raw_text.lower() for keyword in ["recharge", "service", "replace", "fail"])
    )

    # Parse enhanced data (safely handle JSON responses with markdown support)
    def safe_parse_json(text, fallback):
        if text == "unknown" or not text:
            return fallback
        try:
            # Handle markdown code blocks
            if text.startswith("```json") or text.startswith("```"):
                # Extract JSON from markdown code block
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
                if json_match:
                    text = json_match.group(1)
                else:
                    # Fallback for malformed markdown
                    text = text.replace("```json", "").replace("```", "").strip()
            
            # Try to parse the cleaned text
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            return fallback

    company_data = safe_parse_json(company_info, {"name": "unknown", "address": "unknown", "phone": "unknown", "website": "unknown"})
    equipment_data = safe_parse_json(equipment_numbers, {"ae_number": "unknown", "he_number": "unknown", "ee_number": "unknown", "fe_number": "unknown"})
    service_data = safe_parse_json(service_details, {"service_type": "unknown", "additional_services": []})

    # Calculate confidence score (simple heuristic)
    fields = [year, month, day, extinguisher_type, condition]
    valid_fields = sum(1 for f in fields if f and f != "error" and f.lower() != 'null' and f.lower() != 'n/a')
    confidence_score = valid_fields / len(fields)

    # Assemble final JSON with enhanced data
    final_json = {
        "last_inspection_date": {
            "year": year_int,
            "month": month_int,
            "day": day_int,
            "extracted_text": f"Year: {year}, Month: {month}, Day: {day}"
        },
        "next_due_date": next_due_date_obj,
        "extinguisher_type": extinguisher_type,
        "condition": condition,
        "requires_attention": requires_attention,
        "maintenance_notes": "", # Placeholder, can be a separate analysis layer if needed
        "confidence_score": round(confidence_score, 2),
        "raw_text_analysis": raw_text,
        # Enhanced data fields
        "service_company": company_data,
        "equipment_numbers": equipment_data,
        "service_details": service_data
    }
    return final_json
    
# Authentication helper
async def get_current_user(session_token: str = Header(None, alias="Session-Token")):
    # Bypass authentication entirely for production demo
    return {
        "id": "demo-user",
        "email": "admin@firesafety.com",
        "name": "Fire Safety Admin",
        "picture": "https://via.placeholder.com/150"
    }

# Auth routes
@app.post("/api/auth/session")
async def create_session(session_id: str = Form(...)):
    try:
        # For deployment, use a simple mock auth system
        # In production, this would connect to your actual auth provider
        user_data = {
            "email": "admin@firesafety.com",
            "name": "Fire Safety Admin",
            "picture": "https://via.placeholder.com/150"
        }
        
        # Skip external auth API call for deployment
        # response = requests.get(
        #     "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        #     headers={"X-Session-ID": session_id}
        # )
        # 
        # if response.status_code != 200:
        #     raise HTTPException(status_code=400, detail="Invalid session ID")
        
        # user_data = response.json()  # Commented out for deployment
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": user_data["email"]})
        if not existing_user:
            # Create new user
            user_id = str(uuid.uuid4())
            user = {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"],
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(user)
            
            # Return user data without ObjectId
            user_response = {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"]
            }
        else:
            user_id = existing_user["id"]
            user_response = {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "picture": existing_user["picture"]
            }
        
        # Create session
        session_token = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.utcnow() + timedelta(days=7),
            "created_at": datetime.utcnow()
        }
        sessions_collection.insert_one(session)
        
        return {"session_token": session_token, "user": user_response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    # Return user data without ObjectId
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"]
    }

# Simple auth endpoint for quick login (development/demo)
@app.post("/api/auth/demo-login")
async def demo_login():
    """Simple demo login endpoint that doesn't require external auth"""
    try:
        user_data = {
            "email": "admin@firesafety.com",
            "name": "Fire Safety Admin",
            "picture": "https://via.placeholder.com/150"
        }
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": user_data["email"]})
        if not existing_user:
            # Create new user
            user_id = str(uuid.uuid4())
            user = {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"],
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(user)
            
            user_response = {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"]
            }
        else:
            user_response = {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "picture": existing_user["picture"]
            }
        
        # Create session
        session_token = str(uuid.uuid4())
        session = {
            "session_id": "demo-session",
            "user_id": user_response["id"],
            "session_token": session_token,
            "expires_at": datetime.utcnow() + timedelta(days=30),
            "created_at": datetime.utcnow()
        }
        sessions_collection.insert_one(session)
        
        return {
            "session_token": session_token,
            "user": user_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Inspection routes
@app.post("/api/inspections")
async def create_inspection(
    inspection_request: InspectionRequest
):
    # Bypass authentication for demo - use demo user
    user = {
        "id": "demo-user",
        "email": "admin@firesafety.com",
        "name": "Fire Safety Admin",
        "picture": "https://via.placeholder.com/150"
    }
    
    try:
        start_time = datetime.utcnow()
        # Detect image format from base64 content and create proper data URL
        image_base64 = inspection_request.image_base64
        
        image_format = "jpeg"  # default
        try:
            decoded = base64.b64decode(image_base64[:50])
            if decoded.startswith(b'\x89PNG'):
                image_format = "png"
            elif decoded.startswith(b'GIF'):
                image_format = "gif"
            elif decoded.startswith(b'\xff\xd8\xff'):
                image_format = "jpeg"
            elif decoded.startswith(b'RIFF') and b'WEBP' in decoded[:20]:
                image_format = "webp"
        except Exception:
            pass
        
        data_url = f"data:image/{image_format};base64,{image_base64}"

        # --- START REFACTORED AI ANALYSIS ---
        # Layer 1: OCR
        raw_text = await extract_raw_text(data_url)

        # Layer 2 & 3: Parallel Analysis (Enhanced)
        year_task = analyze_year(raw_text, data_url)
        month_task = analyze_month(raw_text, data_url)
        day_task = analyze_day(raw_text, data_url)
        type_task = analyze_extinguisher_type(raw_text, data_url)
        condition_task = analyze_condition(raw_text, data_url)
        company_task = analyze_company_info(raw_text, data_url)
        equipment_task = analyze_equipment_numbers(raw_text, data_url)
        service_task = analyze_service_details(raw_text, data_url)

        results = await asyncio.gather(
            year_task, month_task, day_task, type_task, condition_task,
            company_task, equipment_task, service_task
        )
        year, month, day, extinguisher_type, condition, company_info, equipment_numbers, service_details = results

        # Layer 4: Consolidation (Enhanced)
        final_analysis_json = consolidate_analysis(
            year=year,
            month=month,
            day=day,
            extinguisher_type=extinguisher_type,
            condition=condition,
            company_info=company_info,
            equipment_numbers=equipment_numbers,
            service_details=service_details,
            raw_text=raw_text
        )
        
        gemini_response = json.dumps(final_analysis_json, indent=2)
        # --- END REFACTORED AI ANALYSIS ---

        print(f"🔍 Creating inspection record...")
        print(f"📊 Analysis result: {final_analysis_json}")

        # Create inspection record
        inspection_id = str(uuid.uuid4())
        inspection = {
            "id": inspection_id,
            "user_id": user["id"],
            "location": inspection_request.location,
            "image_base64": image_base64, # Storing original base64
            "inspection_date": datetime.utcnow(),
            "status": "analyzed",
            "gemini_response": gemini_response,
            "notes": inspection_request.notes,
            "created_at": datetime.utcnow()
        }
        
        # Add GPS data if provided (Quick Shot mode)
        if inspection_request.gps_data:
            inspection["gps_data"] = inspection_request.gps_data
            print(f"📍 GPS data saved: {inspection_request.gps_data}")
            
        # Add business name if provided (Quick Shot mode)
        if inspection_request.business_name:
            inspection["business_name"] = inspection_request.business_name
            print(f"🏢 Business name saved: {inspection_request.business_name}")
        
        print(f"💾 Attempting to save to database...")
        
        # Extract due date from the structured JSON for alerts
        try:
            if final_analysis_json.get("next_due_date"):
                due_date_info = final_analysis_json["next_due_date"]
                if all(due_date_info.get(k) for k in ["year", "month", "day"]):
                    inspection["due_date"] = datetime(
                        due_date_info["year"],
                        due_date_info["month"],
                        due_date_info["day"]
                    )
        except (ValueError, TypeError):
            pass
        
        # Insert into database
        try:
            print(f"💾 Inserting into collection: {inspections_collection.name}")
            result = inspections_collection.insert_one(inspection)
            print(f"✅ Database insert successful! ID: {result.inserted_id}")
        except Exception as e:
            print(f"❌ Database insert failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # Send comprehensive data to N8n webhook for email notifications
        webhook_data = {
            "inspection_id": inspection_id,
            "user_id": user["id"],
            "location": inspection_request.location,
            "notes": getattr(inspection_request, 'notes', ''),
            "submitted_by": getattr(inspection_request, 'submitted_by', 'Anonymous'),
            "business_name": getattr(inspection_request, 'business_name', ''),
            "mode": getattr(inspection_request, 'mode', 'standard'),
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": final_analysis_json,
            "image_base64": inspection_request.image_base64,
            "gps_data": getattr(inspection_request, 'gps_data', None),
            
            # Email-friendly formatted data
            "email_subject": f"🔥 Fire Safety Inspection - {inspection_request.location}",
            "email_summary": {
                "location": inspection_request.location,
                "inspector": getattr(inspection_request, 'submitted_by', 'Anonymous'),
                "business": getattr(inspection_request, 'business_name', 'N/A'),
                "date": datetime.utcnow().strftime("%B %d, %Y at %I:%M %p"),
                "condition": final_analysis_json.get("condition", "Unknown"),
                "requires_attention": final_analysis_json.get("requires_attention", False),
                "extinguisher_type": final_analysis_json.get("extinguisher_type", "Unknown"),
                "last_inspection": final_analysis_json.get("last_inspection_date", "Unknown"),
                "next_due": final_analysis_json.get("next_due_date", "Unknown"),
                "equipment_numbers": final_analysis_json.get("equipment_numbers", {}),
                "service_company": final_analysis_json.get("service_company", {}),
                "maintenance_notes": final_analysis_json.get("maintenance_notes", ""),
                "gps_coordinates": None
            }
        }
        
        # Format GPS data for email
        if hasattr(inspection_request, 'gps_data') and inspection_request.gps_data:
            try:
                gps_data = inspection_request.gps_data
                if isinstance(gps_data, str):
                    gps_data = json.loads(gps_data)
                if gps_data and 'latitude' in gps_data and 'longitude' in gps_data:
                    webhook_data["email_summary"]["gps_coordinates"] = f"{gps_data['latitude']:.6f}, {gps_data['longitude']:.6f}"
                    webhook_data["email_summary"]["google_maps_link"] = f"https://maps.google.com?q={gps_data['latitude']},{gps_data['longitude']}"
            except (json.JSONDecodeError, TypeError, KeyError):
                pass
        
        # Send webhook if URL is configured
        if N8N_WEBHOOK_URL:
            try:
                print(f"📧 Sending webhook notification to N8N...")
                response = requests.post(N8N_WEBHOOK_URL, json=webhook_data, timeout=10)
                if response.status_code == 200:
                    print(f"✅ Webhook sent successfully")
                else:
                    print(f"⚠️ Webhook response: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Error sending webhook: {e}")
        else:
            print("⚠️ N8N_WEBHOOK_URL not configured, skipping webhook")

        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        return {
            "success": True,
            "inspection_id": inspection_id,
            "analysis": final_analysis_json,
            "duration_ms": duration_ms,
            "model": os.getenv("MODEL_ID", "openrouter/google/gemini-2.5-pro")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/inspections/{inspection_id}")
async def update_inspection(
    inspection_id: str,
    inspection_update: InspectionUpdate,
    user: dict = Depends(get_current_user)
):
    inspection = inspections_collection.find_one({
        "id": inspection_id,
        "user_id": user["id"]
    })
    
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Parse current gemini_response; it should always be valid JSON
    try:
        current_data = json.loads(inspection.get("gemini_response", "{}"))
    except json.JSONDecodeError:
        # Fallback for corrupted data
        current_data = {}
    
    # Create the update object for MongoDB
    update_data = {}
    update_payload = inspection_update.dict(exclude_unset=True)

    # Directly update top-level fields
    for field in ["extinguisher_type", "maintenance_notes", "condition", "requires_attention"]:
        if field in update_payload:
            current_data[field] = update_payload[field]
            
    # Handle nested date objects
    if "last_inspection_date" in update_payload:
        if "last_inspection_date" not in current_data:
            current_data["last_inspection_date"] = {}
        current_data["last_inspection_date"].update(update_payload["last_inspection_date"])

    if "next_due_date" in update_payload:
        if "next_due_date" not in current_data:
            current_data["next_due_date"] = {}
        current_data["next_due_date"].update(update_payload["next_due_date"])
        
        # Also update the top-level due_date for alerts
        try:
            next_due_info = current_data["next_due_date"]
            if all(next_due_info.get(k) for k in ["year", "month", "day"]):
                update_data["due_date"] = datetime(
                    next_due_info["year"],
                    next_due_info["month"],
                    next_due_info["day"]
                )
        except (ValueError, TypeError):
            pass # Ignore if date is incomplete

    # Update basic inspection fields
    if "location" in update_payload:
        update_data["location"] = update_payload["location"]
    if "notes" in update_payload:
        update_data["notes"] = update_payload["notes"]
    
    # Store the modified JSON back into gemini_response
    update_data["gemini_response"] = json.dumps(current_data, indent=2)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    result = inspections_collection.update_one(
        {"id": inspection_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0 and not update_payload:
         return {"message": "No changes provided"}

    if result.modified_count == 0:
        # This can happen if the data is the same, but to be safe:
        pass # Not necessarily an error

    return {"message": "Inspection updated successfully"}

@app.delete("/api/inspections/{inspection_id}")
async def delete_inspection(
    inspection_id: str,
    user: dict = Depends(get_current_user)
):
    """Deletes an inspection record."""
    try:
        # Find the inspection to delete
        inspection = inspections_collection.find_one({
            "id": inspection_id,
            "user_id": user["id"]
        })
        
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")
        
        # Delete the inspection
        result = inspections_collection.delete_one({
            "id": inspection_id,
            "user_id": user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Inspection not found")
        
        return {"message": "Inspection deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

async def _get_mongo_inspections(query: dict):
    """Helper to fetch and process inspections from MongoDB."""
    inspections = list(inspections_collection.find(query))
    
    for item in inspections:
        item["_id"] = str(item["_id"]) # Convert ObjectId
        # Format datetime objects to ISO strings
        for date_field in ["inspection_date", "due_date", "created_at", "updated_at"]:
            if date_field in item and isinstance(item[date_field], datetime):
                item[date_field] = item[date_field].isoformat()
        
        # Parse the gemini_response from a JSON string into a dictionary
        if "gemini_response" in item:
            try:
                item["gemini_response"] = json.loads(item["gemini_response"])
            except (json.JSONDecodeError, TypeError):
                 # If parsing fails, return the raw string or a default error structure
                item["gemini_response"] = {"error": "Could not parse AI analysis JSON."}

    return inspections

@app.get("/api/inspections")
async def get_inspections():
    """Fetches all inspections for the current user."""
    try:
        # Bypass authentication for demo - use demo user
        demo_user = {
            "id": "demo-user",
            "email": "admin@firesafety.com",
            "name": "Fire Safety Admin",
            "picture": "https://via.placeholder.com/150"
        }
        print(f"Attempting to get inspections for user: {demo_user['id']}")
        result = await _get_mongo_inspections({"user_id": demo_user["id"]})
        print(f"Successfully retrieved {len(result)} inspections")
        return result
    except Exception as e:
        print(f"Error in get_inspections: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/inspections/due")
async def get_due_inspections():
    """Fetches inspections that are due within the next 30 days."""
    try:
        # Bypass authentication for demo - use demo user
        demo_user = {
            "id": "demo-user",
            "email": "demo@example.com"
        }
        
        due_date_threshold = datetime.utcnow() + timedelta(days=30)
        query = {
            "user_id": demo_user["id"],
            "due_date": {"$lte": due_date_threshold}
        }
        return await _get_mongo_inspections(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/places/nearby")
async def get_nearby_places(lat: float, lng: float, radius: int = 1000):
    """
    Get nearby businesses using Google Places API based on GPS coordinates.
    """
    try:
        if not GOOGLE_PLACES_API_KEY:
            # Return mock data if no API key is configured
            print("⚠️ No Google Places API key configured, returning mock data")
            return {
                "success": True,
                "places": [
                    {
                        "name": "ABC Fire Safety Services",
                        "address": "123 Safety St, Business District",
                        "rating": 4.5,
                        "place_id": "mock_place_1",
                        "types": ["fire_safety", "business"]
                    },
                    {
                        "name": "Professional Fire Protection",
                        "address": "456 Protection Ave, Industrial Area", 
                        "rating": 4.2,
                        "place_id": "mock_place_2",
                        "types": ["fire_safety", "business"]
                    },
                    {
                        "name": "Metro Business Center",
                        "address": "789 Commerce Blvd, Downtown",
                        "rating": 4.0,
                        "place_id": "mock_place_3",
                        "types": ["business", "office_building"]
                    }
                ]
            }
        
        # Google Places Nearby Search API
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{lat},{lng}",
            'radius': radius,
            'type': 'establishment',  # General business establishments
            'key': GOOGLE_PLACES_API_KEY
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"❌ Google Places API error: {response.status_code}")
            raise HTTPException(status_code=500, detail="Google Places API error")
        
        data = response.json()
        
        if data.get('status') != 'OK':
            print(f"❌ Google Places API status: {data.get('status')}")
            if data.get('status') == 'ZERO_RESULTS':
                return {"success": True, "places": []}
            raise HTTPException(status_code=500, detail=f"Google Places API: {data.get('status')}")
        
        # Process and filter results
        places = []
        for place in data.get('results', []):
            if place.get('business_status') == 'OPERATIONAL':
                places.append({
                    "name": place.get('name', 'Unknown Business'),
                    "address": place.get('vicinity', 'Address not available'),
                    "rating": place.get('rating', 0),
                    "place_id": place.get('place_id'),
                    "types": place.get('types', [])
                })
        
        # Sort by rating (highest first) and limit to top 10
        places.sort(key=lambda x: x['rating'], reverse=True)
        places = places[:10]
        
        print(f"✅ Found {len(places)} nearby businesses")
        return {"success": True, "places": places}
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error calling Google Places API: {str(e)}")
        raise HTTPException(status_code=500, detail="Network error accessing Google Places API")
    except Exception as e:
        print(f"❌ Error in get_nearby_places: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)