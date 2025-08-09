#!/usr/bin/env python3
"""
Database optimization script to create indexes for better performance.
Fixes the slow query issues identified in MongoDB logs.
"""

import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

def create_indexes():
    """Create database indexes to improve query performance."""
    try:
        # Connect to MongoDB
        mongo_url = os.getenv("MONGO_URL", "mongodb://admin:password@mongo:27017/production_database?authSource=admin")
        db_name = os.getenv("DB_NAME", "production_database")
        
        print(f"🔗 Connecting to MongoDB: {mongo_url}")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Get collections
        inspections_collection = db["inspections"]
        users_collection = db["users"]
        sessions_collection = db["sessions"]
        
        print("📊 Creating database indexes for performance optimization...")
        
        # 1. Create index on user_id (most important - fixes the slow queries)
        print("📍 Creating index: inspections.user_id")
        inspections_collection.create_index([("user_id", ASCENDING)])
        
        # 2. Create compound index for due dates
        print("📍 Creating index: inspections.user_id + due_date")
        inspections_collection.create_index([("user_id", ASCENDING), ("due_date", ASCENDING)])
        
        # 3. Create index on inspection_date for sorting
        print("📍 Creating index: inspections.inspection_date")
        inspections_collection.create_index([("inspection_date", ASCENDING)])
        
        # 4. Create index on email for users collection
        print("📍 Creating index: users.email")
        users_collection.create_index([("email", ASCENDING)], unique=True)
        
        # 5. Create index on session_token for sessions
        print("📍 Creating index: sessions.session_token")
        sessions_collection.create_index([("session_token", ASCENDING)], unique=True)
        
        # 6. Create index on user_id for sessions
        print("📍 Creating index: sessions.user_id")
        sessions_collection.create_index([("user_id", ASCENDING)])
        
        print("✅ Database indexes created successfully!")
        
        # Display index information
        print("\n📋 Current indexes:")
        for collection_name, collection in [("inspections", inspections_collection), ("users", users_collection), ("sessions", sessions_collection)]:
            indexes = list(collection.list_indexes())
            print(f"\n🗂️ {collection_name} collection:")
            for idx in indexes:
                name = idx.get('name', 'unknown')
                key = idx.get('key', {})
                print(f"  - {name}: {dict(key)}")
        
        # Test query performance
        print("\n🧪 Testing query performance...")
        import time
        
        start_time = time.time()
        result = list(inspections_collection.find({"user_id": "demo-user"}))
        end_time = time.time()
        
        print(f"✅ Query completed in {(end_time - start_time)*1000:.1f}ms")
        print(f"📊 Found {len(result)} inspection records")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error creating indexes: {str(e)}")
        raise

if __name__ == "__main__":
    create_indexes()
