"""
Careers Router
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database import get_careers_collection

router = APIRouter()

@router.get("/")
async def get_all_careers(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(default=20, le=50)
):
    col = get_careers_collection()
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if difficulty:
        query["difficulty"] = difficulty

    cursor = col.find(query, {"_id": 0}).limit(limit)
    careers = await cursor.to_list(length=limit)
    return {"careers": careers, "count": len(careers)}


@router.get("/{career_name}")
async def get_career(career_name: str):
    col = get_careers_collection()
    career = await col.find_one(
        {"career_name": {"$regex": career_name, "$options": "i"}},
        {"_id": 0}
    )
    if not career:
        raise HTTPException(status_code=404, detail=f"Career '{career_name}' not found")
    return career


@router.get("/search/{query}")
async def search_careers(query: str):
    col = get_careers_collection()
    cursor = col.find(
        {"$or": [
            {"career_name": {"$regex": query, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": query, "$options": "i"}}},
            {"required_skills": {"$elemMatch": {"$regex": query, "$options": "i"}}},
        ]},
        {"_id": 0}
    ).limit(10)
    results = await cursor.to_list(length=10)
    return {"results": results, "query": query}
