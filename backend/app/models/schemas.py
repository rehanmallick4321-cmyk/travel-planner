from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    travel_style: Optional[str] = None


# ── Trips ─────────────────────────────────────────────

class TripCreate(BaseModel):
    destination: str
    country: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    num_days: Optional[int] = None
    budget_level: Optional[str] = Field(None, pattern="^(budget|mid-range|luxury)$")
    travel_style: Optional[str] = Field(
        None,
        pattern="^(adventure|relaxation|cultural|foodie|family|solo|romantic)$",
    )
    num_travelers: int = 1
    special_requests: Optional[str] = None


class TripUpdate(BaseModel):
    destination: Optional[str] = None
    country: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    num_days: Optional[int] = None
    budget_level: Optional[str] = None
    travel_style: Optional[str] = None
    num_travelers: Optional[int] = None
    special_requests: Optional[str] = None
    status: Optional[str] = None


class TripResponse(BaseModel):
    id: str
    user_id: str
    destination: str
    country: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    num_days: Optional[int] = None
    budget_level: Optional[str] = None
    travel_style: Optional[str] = None
    num_travelers: Optional[int] = 1
    special_requests: Optional[str] = None
    status: Optional[str] = "draft"
    cover_image_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Itinerary ─────────────────────────────────────────

class ActivitySchema(BaseModel):
    time_slot: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    estimated_cost: Optional[float] = None
    currency: Optional[str] = "USD"
    notes: Optional[str] = None
    sort_order: Optional[int] = 0


class ItineraryDaySchema(BaseModel):
    day_number: int
    date: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    activities: list[ActivitySchema] = []


class ItineraryResponse(BaseModel):
    trip_id: str
    days: list[ItineraryDaySchema] = []


class GenerateRequest(BaseModel):
    trip_id: str


class RegenerateRequest(BaseModel):
    trip_id: str
    feedback: Optional[str] = None
