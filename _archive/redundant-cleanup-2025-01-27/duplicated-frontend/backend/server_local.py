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
from datetime import datetime, timedelta
import litellm
# Commented out emergentintegrations imports for local development
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

# Models
class User(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    subscription_active: bool = False

class Session(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime

class InspectionRequest(BaseModel):
    image_base64: str
    location: str
    notes: Optional[str] = None

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

class InspectionUpdate(BaseModel):
    last_inspection_date: Optional[str] = None
    next_due_date: Optional[str] = None
    extinguisher_type: Optional[str] = None
    maintenance_notes: Optional[str] = None
    condition: Optional[str] = None
    requires_attention: Optional[bool] = None
    location: Optional[str] = None
    notes: Optional[str] = None


# Authentication helper
async def get_current_user(session_token: str = Header(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Session token required")
    
    session = sessions_collection.find_one({"session_token": session_token})
    if not session or session["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    user = users_collection.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# MOCK AUTH ENDPOINT FOR LOCAL DEVELOPMENT
@app.post("/api/auth/session")
async def create_session(session_id: str = Form(...)):
    try:
        # Mock user data for local development
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
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
                "picture": user_data["picture"],
            }
        else:
            user_id = existing_user["id"]
            user_response = {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "picture": existing_user["picture"],
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
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"],
    }

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Fire Safety Scanner API is running (Local Development Mode)"}


# Inspection routes (simplified for local development)
@app.post("/api/inspections")
async def create_inspection(
    inspection_request: InspectionRequest,
    user: dict = Depends(get_current_user)
):
    
    try:
        # Use litellm directly with OpenRouter for real AI analysis
        response = await litellm.acompletion(
            model="openrouter/google/gemini-2.5-pro",
            api_key=OPENROUTER_API_KEY,
            api_base="https://openrouter.ai/api/v1",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert fire safety inspector. Analyze fire extinguisher inspection tags and extract the following information:
                    1. Last inspection date
                    2. Next due date
                    3. Type of fire extinguisher
                    4. Any maintenance notes or issues
                    5. Overall condition assessment
                    
                    Please provide the response in JSON format with these fields:
                    {
                        "last_inspection_date": "YYYY-MM-DD",
                        "next_due_date": "YYYY-MM-DD", 
                        "extinguisher_type": "string",
                        "maintenance_notes": "string",
                        "condition": "Good/Fair/Poor",
                        "requires_attention": true/false
                    }
                    
                    If any date information is unclear or missing, indicate this in your response."""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Please analyze this fire extinguisher inspection tag and extract the required information."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{inspection_request.image_base64}"
                            }
                        }
                    ]
                }
            ]
        )
        
        gemini_response = response.choices[0].message.content
        
        # Try to parse the JSON response, handling markdown code blocks
        try:
            # Remove markdown code block formatting if present
            clean_response = gemini_response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]  # Remove ```json
            if clean_response.startswith('```'):
                clean_response = clean_response[3:]   # Remove ```
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]  # Remove closing ```
            
            clean_response = clean_response.strip()
            analysis_data = json.loads(clean_response)
        except json.JSONDecodeError:
            # If JSON parsing still fails, try to extract JSON from the response
            try:
                import re
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', gemini_response)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    raise json.JSONDecodeError("No JSON found", "", 0)
            except json.JSONDecodeError:
                # Final fallback - create structure with raw response
                analysis_data = {
                    "last_inspection_date": "Unable to determine",
                    "next_due_date": "Unable to determine", 
                    "extinguisher_type": "Unable to determine",
                    "condition": "Unable to determine",
                    "maintenance_notes": gemini_response,
                    "requires_attention": True
                }
        
        # Parse due date if available
        due_date = None
        if analysis_data.get("next_due_date") and analysis_data["next_due_date"] != "Unable to determine":
            try:
                due_date = datetime.strptime(analysis_data["next_due_date"], "%Y-%m-%d")
            except ValueError:
                due_date = None
        
        # Create inspection record
        inspection_id = str(uuid.uuid4())
        inspection = {
            "id": inspection_id,
            "user_id": user["id"],
            "location": inspection_request.location,
            "image_base64": inspection_request.image_base64,
            "inspection_date": datetime.utcnow(),
            "due_date": due_date,
            "status": "analyzed",
            "gemini_response": json.dumps(analysis_data),
            "notes": inspection_request.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        inspections_collection.insert_one(inspection)
        
        # Send to N8n webhook if configured
        if N8N_WEBHOOK_URL:
            try:
                webhook_data = {
                    "inspection_id": inspection_id,
                    "user_email": user["email"],
                    "location": inspection_request.location,
                    "analysis": analysis_data,
                    "timestamp": datetime.utcnow().isoformat()
                }
                requests.post(N8N_WEBHOOK_URL, json=webhook_data, timeout=5)
            except:
                pass  # Don't fail if webhook fails
        
        return {
            "id": inspection_id,
            "analysis": analysis_data,
            "message": "Inspection completed successfully using Gemini 2.5 Pro"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inspections")
async def get_inspections(user: dict = Depends(get_current_user)):
    inspections = list(inspections_collection.find({"user_id": user["id"]}).sort("created_at", -1))
    
    # Convert ObjectId to string and format dates
    for inspection in inspections:
        inspection["_id"] = str(inspection["_id"])
        if "inspection_date" in inspection:
            inspection["inspection_date"] = inspection["inspection_date"].isoformat()
        if "due_date" in inspection and inspection["due_date"]:
            inspection["due_date"] = inspection["due_date"].isoformat()
        if "created_at" in inspection:
            inspection["created_at"] = inspection["created_at"].isoformat()
        if "updated_at" in inspection:
            inspection["updated_at"] = inspection["updated_at"].isoformat()
    
    return inspections

@app.get("/api/inspections/due")
async def get_due_inspections(user: dict = Depends(get_current_user)):
    # Get inspections due within 30 days
    thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
    
    due_inspections = list(inspections_collection.find({
        "user_id": user["id"],
        "due_date": {"$lte": thirty_days_from_now}
    }).sort("due_date", 1))
    
    # Convert ObjectId to string and format dates
    for inspection in due_inspections:
        inspection["_id"] = str(inspection["_id"])
        if "inspection_date" in inspection:
            inspection["inspection_date"] = inspection["inspection_date"].isoformat()
        if "due_date" in inspection and inspection["due_date"]:
            inspection["due_date"] = inspection["due_date"].isoformat()
        if "created_at" in inspection:
            inspection["created_at"] = inspection["created_at"].isoformat()
        if "updated_at" in inspection:
            inspection["updated_at"] = inspection["updated_at"].isoformat()
    
    return due_inspections

@app.put("/api/inspections/{inspection_id}")
async def update_inspection(
    inspection_id: str,
    update_data: InspectionUpdate,
    user: dict = Depends(get_current_user)
):
    # Find the inspection
    inspection = inspections_collection.find_one({
        "id": inspection_id,
        "user_id": user["id"]
    })
    
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Parse existing gemini_response
    try:
        analysis = json.loads(inspection["gemini_response"])
    except:
        analysis = {}
    
    # Update analysis with new data
    update_dict = {}
    if update_data.last_inspection_date is not None:
        analysis["last_inspection_date"] = update_data.last_inspection_date
    if update_data.next_due_date is not None:
        analysis["next_due_date"] = update_data.next_due_date
        # Also update the due_date field
        try:
            update_dict["due_date"] = datetime.strptime(update_data.next_due_date, "%Y-%m-%d")
        except:
            pass
    if update_data.extinguisher_type is not None:
        analysis["extinguisher_type"] = update_data.extinguisher_type
    if update_data.maintenance_notes is not None:
        analysis["maintenance_notes"] = update_data.maintenance_notes
    if update_data.condition is not None:
        analysis["condition"] = update_data.condition
    if update_data.requires_attention is not None:
        analysis["requires_attention"] = update_data.requires_attention
    if update_data.location is not None:
        update_dict["location"] = update_data.location
    if update_data.notes is not None:
        update_dict["notes"] = update_data.notes
    
    # Update the inspection
    update_dict["gemini_response"] = json.dumps(analysis)
    update_dict["updated_at"] = datetime.utcnow()
    
    inspections_collection.update_one(
        {"id": inspection_id},
        {"$set": update_dict}
    )
    
    return {"message": "Inspection updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)