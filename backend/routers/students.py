"""Students Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from database import get_students_collection
from datetime import datetime

router = APIRouter()

class StudentCreate(BaseModel):
    name: str
    email: str
    skills: List[str] = []
    interests: List[str] = []
    education: str = "bachelor"
    career_goal: Optional[str] = None

class StudentUpdate(BaseModel):
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    education: Optional[str] = None
    career_goal: Optional[str] = None

@router.post("/")
async def create_student(student: StudentCreate):
    col = get_students_collection()
    if await col.find_one({"email": student.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    data = {**student.dict(), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
    result = await col.insert_one(data)
    return {"message": "Student created", "id": str(result.inserted_id), "email": student.email}

@router.get("/{email}")
async def get_student(email: str):
    col = get_students_collection()
    student = await col.find_one({"email": email}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{email}")
async def update_student(email: str, update: StudentUpdate):
    col = get_students_collection()
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    result = await col.update_one({"email": email}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student updated successfully"}
