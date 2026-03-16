"""
Database Module - MongoDB async connection using Motor
Handles connection lifecycle and provides collection accessors
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# ─────────────────────────────────────────────────────────
# Global client reference
# ─────────────────────────────────────────────────────────
class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

db_instance = Database()


# ─────────────────────────────────────────────────────────
# Connection Management
# ─────────────────────────────────────────────────────────
async def connect_to_mongo():
    """Establish MongoDB connection on application startup."""
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name   = os.getenv("MONGODB_DB",  "career_advisor")

    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.db     = db_instance.client[db_name]
    print(f"✅ Connected to MongoDB: {db_name}")

    # Seed the careers and courses collections if empty
    await _seed_initial_data()


async def close_mongo_connection():
    """Close MongoDB connection on application shutdown."""
    if db_instance.client:
        db_instance.client.close()
        print("🔴 MongoDB connection closed")


# ─────────────────────────────────────────────────────────
# Collection Accessors
# ─────────────────────────────────────────────────────────
def get_students_collection():
    return db_instance.db["students"]

def get_careers_collection():
    return db_instance.db["careers"]

def get_courses_collection():
    return db_instance.db["courses"]

def get_chat_history_collection():
    return db_instance.db["chat_history"]


# ─────────────────────────────────────────────────────────
# Seed Initial Data from JSON files
# ─────────────────────────────────────────────────────────
async def _seed_initial_data():
    """Load careers.json and courses.json into MongoDB if collections are empty."""
    import json
    import pathlib

    data_dir = pathlib.Path(__file__).parent.parent / "data"

    careers_col = get_careers_collection()
    if await careers_col.count_documents({}) == 0:
        with open(data_dir / "careers.json") as f:
            careers = json.load(f)
        await careers_col.insert_many(careers)
        print(f"📚 Seeded {len(careers)} careers into MongoDB")

    courses_col = get_courses_collection()
    if await courses_col.count_documents({}) == 0:
        with open(data_dir / "courses.json") as f:
            courses = json.load(f)
        await courses_col.insert_many(courses)
        print(f"🎓 Seeded {len(courses)} courses into MongoDB")
