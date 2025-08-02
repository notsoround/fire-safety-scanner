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
    
    # Bypass authentication for demo session token
    if session_token == "demo-session-token":
        return {
            "id": "demo-user",
            "email": "admin@firesafety.com",
            "name": "Fire Safety Admin",
            "picture": "https://via.placeholder.com/150"
        }
    
    session = sessions_collection.find_one({"session_token": session_token})
    if not session or session["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    user = users_collection.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

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
    inspection_request: InspectionRequest,
    user: dict = Depends(get_current_user)
):
    
    try:
        # Detect image format from base64 content and create proper data URL
        image_base64 = inspection_request.image_base64
        
        # Try to detect image format from base64 header
        image_format = "jpeg"  # default
        try:
            import base64
            decoded = base64.b64decode(image_base64[:50])  # decode first few bytes to check format
            if decoded.startswith(b'\x89PNG'):
                image_format = "png"
            elif decoded.startswith(b'GIF'):
                image_format = "gif"
            elif decoded.startswith(b'\xff\xd8\xff'):
                image_format = "jpeg"
            elif decoded.startswith(b'RIFF') and b'WEBP' in decoded[:20]:
                image_format = "webp"
        except:
            pass  # keep default jpeg
        
        data_url = f"data:image/{image_format};base64,{image_base64}"
        
        # Use litellm directly with OpenRouter
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
                                "url": data_url
                            }
                        }
                    ]
                }
            ]
        )
        
        gemini_response = response.choices[0].message.content
        
        # Use the original base64 content for storage
        
        # Create inspection record
        inspection_id = str(uuid.uuid4())
        inspection = {
            "id": inspection_id,
            "user_id": user["id"],
            "location": inspection_request.location,
            "image_base64": image_base64,
            "inspection_date": datetime.utcnow(),
            "status": "analyzed",
            "gemini_response": gemini_response,
            "notes": inspection_request.notes,
            "created_at": datetime.utcnow()
        }
        
        # Try to parse the response and extract due date
        try:
            response_data = json.loads(gemini_response)
            if "next_due_date" in response_data:
                inspection["due_date"] = datetime.fromisoformat(response_data["next_due_date"])
        except:
            pass
        
        inspections_collection.insert_one(inspection)
        
        # Send data to N8n webhook
        webhook_data = {
            "inspection_id": inspection_id,
            "user_id": user["id"],
            "location": inspection_request.location,
            "analysis": gemini_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        requests.post(N8N_WEBHOOK_URL, json=webhook_data)
        
        
        return {"inspection_id": inspection_id, "analysis": gemini_response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/inspections/{inspection_id}")
async def update_inspection(
    inspection_id: str,
    inspection_update: InspectionUpdate,
    user: dict = Depends(get_current_user)
):
    # Find the inspection
    inspection = inspections_collection.find_one({
        "id": inspection_id,
        "user_id": user["id"]
    })
    
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Parse current gemini_response if it's JSON
    current_data = {}
    try:
        current_data = json.loads(inspection.get("gemini_response", "{}"))
    except:
        current_data = {}
    
    # Update the fields
    update_data = {}
    if inspection_update.last_inspection_date is not None:
        current_data["last_inspection_date"] = inspection_update.last_inspection_date
    if inspection_update.next_due_date is not None:
        current_data["next_due_date"] = inspection_update.next_due_date
        try:
            # Update the due_date field for alerts
            update_data["due_date"] = datetime.fromisoformat(inspection_update.next_due_date)
        except:
            pass
    if inspection_update.extinguisher_type is not None:
        current_data["extinguisher_type"] = inspection_update.extinguisher_type
    if inspection_update.maintenance_notes is not None:
        current_data["maintenance_notes"] = inspection_update.maintenance_notes
    if inspection_update.condition is not None:
        current_data["condition"] = inspection_update.condition
    if inspection_update.requires_attention is not None:
        current_data["requires_attention"] = inspection_update.requires_attention
    
    # Update basic fields
    if inspection_update.location is not None:
        update_data["location"] = inspection_update.location
    if inspection_update.notes is not None:
        update_data["notes"] = inspection_update.notes
    
    # Update gemini_response with new data
    update_data["gemini_response"] = json.dumps(current_data)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    result = inspections_collection.update_one(
        {"id": inspection_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update inspection")
    
    return {"message": "Inspection updated successfully"}

@app.get("/api/inspections")
async def get_inspections(user: dict = Depends(get_current_user)):
    inspections = list(inspections_collection.find({"user_id": user["id"]}))
    
    # Convert ObjectId to string and format dates
    for inspection in inspections:
        inspection["_id"] = str(inspection["_id"])
        if "inspection_date" in inspection:
            inspection["inspection_date"] = inspection["inspection_date"].isoformat()
        if "due_date" in inspection:
            inspection["due_date"] = inspection["due_date"].isoformat()
    
    return inspections

@app.get("/api/inspections/due")
async def get_due_inspections(user: dict = Depends(get_current_user)):
    # Find inspections that are due within the next 30 days
    due_date = datetime.utcnow() + timedelta(days=30)
    due_inspections = list(inspections_collection.find({
        "user_id": user["id"],
        "due_date": {"$lte": due_date}
    }))
    
    # Format dates
    for inspection in due_inspections:
        inspection["_id"] = str(inspection["_id"])
        if "inspection_date" in inspection:
            inspection["inspection_date"] = inspection["inspection_date"].isoformat()
        if "due_date" in inspection:
            inspection["due_date"] = inspection["due_date"].isoformat()
    
    return due_inspections


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)