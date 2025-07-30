# Simple authentication bypass for local development
from fastapi import HTTPException
from datetime import datetime, timedelta
import uuid

def create_mock_session(email: str = "test@example.com", name: str = "Test User"):
    """Create a mock session for local development"""
    return {
        "session_token": str(uuid.uuid4()),
        "user": {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "picture": "https://via.placeholder.com/150",
            "subscription_active": True,
            "inspections_remaining": 50
        }
    }

def mock_auth_endpoint():
    """Mock authentication endpoint for local development"""
    return create_mock_session()