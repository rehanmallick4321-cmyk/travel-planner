from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, trips, itinerary

app = FastAPI(
    title="TripCraft AI",
    description="AI-powered Travel Itinerary Planner API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itinerary.router)


@app.get("/")
async def root():
    return {
        "app": "TripCraft AI",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
