from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_supabase_admin, get_current_user
from app.models.schemas import TripCreate, TripUpdate, TripResponse

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.get("/", response_model=list[TripResponse])
async def list_trips(user_id: str = Depends(get_current_user)):
    """List all trips for the authenticated user."""
    try:
        supabase = get_supabase_admin()
        result = (
            supabase.table("trips")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return [TripResponse(**trip) for trip in result.data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new trip."""
    try:
        supabase = get_supabase_admin()
        trip_data = trip.model_dump(exclude_none=True)
        trip_data["user_id"] = user_id

        # Convert date objects to strings
        for key in ["start_date", "end_date"]:
            if key in trip_data and trip_data[key] is not None:
                trip_data[key] = str(trip_data[key])

        result = (
            supabase.table("trips")
            .insert(trip_data)
            .execute()
        )
        return TripResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get a single trip by ID."""
    try:
        supabase = get_supabase_admin()
        result = (
            supabase.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return TripResponse(**result.data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip: TripUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update a trip."""
    try:
        supabase = get_supabase_admin()

        # Verify ownership
        existing = (
            supabase.table("trips")
            .select("id")
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        update_data = trip.model_dump(exclude_none=True)
        for key in ["start_date", "end_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = str(update_data[key])

        result = (
            supabase.table("trips")
            .update(update_data)
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .execute()
        )
        return TripResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or update failed",
        )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a trip and all associated itinerary data."""
    try:
        supabase = get_supabase_admin()
        supabase.table("trips").delete().eq("id", trip_id).eq(
            "user_id", user_id
        ).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
