from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import random

from database import init_db, get_db, SpinLog
from restaurants import (
    get_restaurants_by_categories, 
    get_all_categories, 
    get_restaurant_by_name,
    get_available_malls,
    get_mall_info
)

app = FastAPI(title="WheelEat API", version="1.0.0")

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",  # Allow Swagger UI
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()


class SpinRequest(BaseModel):
    dietary_need: str
    selected_categories: List[str]
    mall_id: Optional[str] = None


class SpinResponse(BaseModel):
    restaurant_name: str
    restaurant_unit: str
    restaurant_floor: str
    category: str
    timestamp: str
    spin_id: int
    logo: Optional[str] = None


class SpinStats(BaseModel):
    total_spins: int
    category_counts: dict


@app.get("/")
def read_root():
    return {"message": "WheelEat API is running", "status": "ok"}


@app.get("/api/malls")
def get_malls():
    """Get all available shopping malls"""
    malls = []
    for mall_id in get_available_malls():
        info = get_mall_info(mall_id)
        malls.append({
            "id": mall_id,
            "name": info["name"],
            "display_name": info["display_name"]
        })
    return {"malls": malls}


@app.get("/api/categories")
def get_categories(mall_id: Optional[str] = "sunway_square"):
    """Get all available restaurant categories for a specific mall"""
    return {"categories": get_all_categories(mall_id)}


@app.get("/api/restaurants")
def get_restaurants(categories: Optional[str] = None, mall_id: Optional[str] = "sunway_square"):
    """Get restaurants, optionally filtered by categories (comma-separated) and mall"""
    if categories:
        category_list = [c.strip() for c in categories.split(",")]
        restaurants = get_restaurants_by_categories(category_list, mall_id)
    else:
        restaurants = get_restaurants_by_categories(get_all_categories(mall_id), mall_id)
    return {"restaurants": restaurants, "count": len(restaurants)}


@app.post("/api/spin", response_model=SpinResponse)
def spin_wheel(request: SpinRequest, db: Session = Depends(get_db)):
    """
    Spin the wheel and return a random restaurant from selected categories.
    Each restaurant has equal probability.
    """
    if not request.selected_categories:
        raise HTTPException(status_code=400, detail="At least one category must be selected")
    
    # Get mall_id from request or default to sunway_square
    mall_id = request.mall_id or "sunway_square"
    
    # Get all restaurants in the selected categories for the specified mall
    available_restaurants = get_restaurants_by_categories(request.selected_categories, mall_id)
    
    if not available_restaurants:
        raise HTTPException(status_code=400, detail="No restaurants found in selected categories")
    
    # Random selection with equal probability
    selected_restaurant = random.choice(available_restaurants)
    
    # Log the spin to database
    spin_log = SpinLog(
        restaurant_name=selected_restaurant["name"],
        restaurant_unit=selected_restaurant["unit"],
        restaurant_floor=selected_restaurant["floor"],
        category=selected_restaurant["category"],
        dietary_need=request.dietary_need,
        timestamp=datetime.utcnow(),
        mall_id=mall_id,
        selected_categories=json.dumps(request.selected_categories)
    )
    db.add(spin_log)
    db.commit()
    db.refresh(spin_log)
    
    return SpinResponse(
        restaurant_name=selected_restaurant["name"],
        restaurant_unit=selected_restaurant["unit"],
        restaurant_floor=selected_restaurant["floor"],
        category=selected_restaurant["category"],
        timestamp=spin_log.timestamp.isoformat(),
        spin_id=spin_log.id,
        logo=selected_restaurant.get("logo")
    )


@app.get("/api/stats", response_model=SpinStats)
def get_stats(db: Session = Depends(get_db)):
    """Get statistics about spins"""
    total_spins = db.query(SpinLog).count()
    
    # Count spins by category
    category_counts = {}
    spins = db.query(SpinLog).all()
    for spin in spins:
        category_counts[spin.category] = category_counts.get(spin.category, 0) + 1
    
    return SpinStats(
        total_spins=total_spins,
        category_counts=category_counts
    )


@app.get("/api/spins/export")
def export_spins(db: Session = Depends(get_db)):
    """Export all spin data for analytics"""
    spins = db.query(SpinLog).order_by(SpinLog.timestamp.desc()).all()
    
    return [
        {
            "id": spin.id,
            "restaurant_name": spin.restaurant_name,
            "restaurant_unit": spin.restaurant_unit,
            "restaurant_floor": spin.restaurant_floor,
            "category": spin.category,
            "dietary_need": spin.dietary_need,
            "timestamp": spin.timestamp.isoformat(),
            "mall_id": spin.mall_id,
            "selected_categories": json.loads(spin.selected_categories) if spin.selected_categories else []
        }
        for spin in spins
    ]
