db = db.getSiblingDB('fire_safety_db');

// Sample users
db.users.insertMany([
  {
    "id": "sample-user-1",
    "email": "demo@example.com", 
    "name": "Demo User",
    "picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    "created_at": new Date("2024-01-15T10:00:00Z")
  },
  {
    "id": "sample-user-2", 
    "email": "inspector@firecompany.com",
    "name": "Fire Inspector",
    "picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    "created_at": new Date("2024-02-01T08:30:00Z")
  }
]);

// Sample sessions (for demo purposes)
db.sessions.insertMany([
  {
    "session_id": "demo-session-1",
    "user_id": "sample-user-1", 
    "session_token": "demo-token-1",
    "expires_at": new Date("2025-12-31T23:59:59Z"),
    "created_at": new Date("2024-12-01T10:00:00Z")
  }
]);

// Sample inspections with variety of data
db.inspections.insertMany([
  {
    "id": "inspection-1",
    "user_id": "sample-user-1",
    "location": "Building A - 1st Floor Main Entrance",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "inspection_date": new Date("2024-12-15T14:30:00Z"),
    "due_date": new Date("2025-12-15T00:00:00Z"),
    "status": "analyzed",
    "gemini_response": "{\"last_inspection_date\": \"2024-12-15\", \"next_due_date\": \"2025-12-15\", \"extinguisher_type\": \"ABC Dry Chemical\", \"maintenance_notes\": \"Pressure gauge in green zone, pin intact, hose in good condition\", \"condition\": \"Good\", \"requires_attention\": false}",
    "notes": "Located near main entrance for easy access",
    "created_at": new Date("2024-12-15T14:30:00Z")
  },
  {
    "id": "inspection-2", 
    "user_id": "sample-user-1",
    "location": "Building A - 2nd Floor Kitchen Area",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "inspection_date": new Date("2024-11-28T09:15:00Z"),
    "due_date": new Date("2025-05-28T00:00:00Z"),
    "status": "analyzed",
    "gemini_response": "{\"last_inspection_date\": \"2024-05-28\", \"next_due_date\": \"2025-05-28\", \"extinguisher_type\": \"Class K Wet Chemical\", \"maintenance_notes\": \"Requires recharge - pressure low, need to inspect nozzle\", \"condition\": \"Fair\", \"requires_attention\": true}",
    "notes": "Kitchen area - specialized wet chemical system for grease fires",
    "created_at": new Date("2024-11-28T09:15:00Z")
  },
  {
    "id": "inspection-3",
    "user_id": "sample-user-1", 
    "location": "Warehouse - Loading Dock",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "inspection_date": new Date("2024-12-10T16:45:00Z"),
    "due_date": new Date("2025-06-10T00:00:00Z"),
    "status": "analyzed", 
    "gemini_response": "{\"last_inspection_date\": \"2024-06-10\", \"next_due_date\": \"2025-06-10\", \"extinguisher_type\": \"CO2 Carbon Dioxide\", \"maintenance_notes\": \"Good condition, weight within acceptable range, horn clear\", \"condition\": \"Good\", \"requires_attention\": false}",
    "notes": "High traffic area - checked monthly",
    "created_at": new Date("2024-12-10T16:45:00Z")
  },
  {
    "id": "inspection-4",
    "user_id": "sample-user-2",
    "location": "Office Building - Electrical Room",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "inspection_date": new Date("2024-12-01T11:20:00Z"),
    "due_date": new Date("2025-01-15T00:00:00Z"),
    "status": "analyzed",
    "gemini_response": "{\"last_inspection_date\": \"2024-01-15\", \"next_due_date\": \"2025-01-15\", \"extinguisher_type\": \"ABC Dry Chemical\", \"maintenance_notes\": \"Tag is faded and hard to read, pressure gauge needle in red zone - immediate service required\", \"condition\": \"Poor\", \"requires_attention\": true}",
    "notes": "Critical area - electrical equipment present. URGENT: Needs immediate service!",
    "created_at": new Date("2024-12-01T11:20:00Z")
  },
  {
    "id": "inspection-5",
    "user_id": "sample-user-2",
    "location": "Parking Garage - Level B1",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "inspection_date": new Date("2024-12-12T13:10:00Z"),
    "due_date": new Date("2025-12-12T00:00:00Z"),
    "status": "analyzed",
    "gemini_response": "{\"last_inspection_date\": \"2024-12-12\", \"next_due_date\": \"2025-12-12\", \"extinguisher_type\": \"Foam AFFF\", \"maintenance_notes\": \"Recently serviced, all components working properly, clear access path\", \"condition\": \"Good\", \"requires_attention\": false}",
    "notes": "Underground parking - climate controlled environment",
    "created_at": new Date("2024-12-12T13:10:00Z")
  }
]);

print("Sample data inserted successfully!");