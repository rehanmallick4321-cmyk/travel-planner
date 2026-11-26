from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_supabase_admin, get_current_user
from app.models.schemas import (
    GenerateRequest,
    RegenerateRequest,
    ItineraryResponse,
    ItineraryDaySchema,
    ActivitySchema,
)
from app.services.ai_service import generate_itinerary

router = APIRouter(prefix="/api/itinerary", tags=["itinerary"])


@router.post("/generate", response_model=ItineraryResponse)
async def generate(
    request: GenerateRequest,
    user_id: str = Depends(get_current_user),
):
    """Generate an AI-powered itinerary for a trip."""
    supabase = get_supabase_admin()

    # Fetch trip and verify ownership
    try:
        trip_result = (
            supabase.table("trips")
            .select("*")
            .eq("id", request.trip_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        trip_data = trip_result.data
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )

    # Generate itinerary with AI
    try:
        ai_result = generate_itinerary(trip_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}",
        )

    # Save itinerary to database
    try:
        days_data = ai_result.get("days", [])
        saved_days = []

        for day in days_data:
            # Insert day
            day_insert = {
                "trip_id": request.trip_id,
                "day_number": day.get("day_number"),
                "date": day.get("date"),
                "title": day.get("title"),
                "summary": day.get("summary"),
            }
            day_result = (
                supabase.table("itinerary_days")
                .insert(day_insert)
                .execute()
            )
            day_id = day_result.data[0]["id"]

            # Insert activities for this day
            activities = day.get("activities", [])
            saved_activities = []
            for idx, activity in enumerate(activities):
                activity_insert = {
                    "day_id": day_id,
                    "time_slot": activity.get("time_slot"),
                    "start_time": activity.get("start_time"),
                    "end_time": activity.get("end_time"),
                    "title": activity.get("title"),
                    "description": activity.get("description"),
                    "category": activity.get("category"),
                    "location_name": activity.get("location_name"),
                    "location_address": activity.get("location_address"),
                    "estimated_cost": activity.get("estimated_cost"),
                    "currency": activity.get("currency", "USD"),
                    "notes": activity.get("notes"),
                    "sort_order": idx,
                }
                supabase.table("activities").insert(activity_insert).execute()
                saved_activities.append(ActivitySchema(**activity_insert))

            saved_days.append(
                ItineraryDaySchema(
                    day_number=day.get("day_number"),
                    date=day.get("date"),
                    title=day.get("title"),
                    summary=day.get("summary"),
                    activities=saved_activities,
                )
            )

        # Update trip status to 'generated'
        supabase.table("trips").update({"status": "generated"}).eq(
            "id", request.trip_id
        ).execute()

        return ItineraryResponse(trip_id=request.trip_id, days=saved_days)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save itinerary: {str(e)}",
        )


@router.post("/regenerate", response_model=ItineraryResponse)
async def regenerate(
    request: RegenerateRequest,
    user_id: str = Depends(get_current_user),
):
    """Regenerate an itinerary with optional feedback."""
    supabase = get_supabase_admin()

    # Fetch trip and verify ownership
    try:
        trip_result = (
            supabase.table("trips")
            .select("*")
            .eq("id", request.trip_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        trip_data = trip_result.data
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )

    # Delete existing itinerary days (cascade deletes activities)
    try:
        supabase.table("itinerary_days").delete().eq(
            "trip_id", request.trip_id
        ).execute()
    except Exception:
        pass  # No existing days to delete

    # Re-generate with feedback
    try:
        ai_result = generate_itinerary(trip_data, feedback=request.feedback)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI regeneration failed: {str(e)}",
        )

    # Save new itinerary (same logic as generate)
    try:
        days_data = ai_result.get("days", [])
        saved_days = []

        for day in days_data:
            day_insert = {
                "trip_id": request.trip_id,
                "day_number": day.get("day_number"),
                "date": day.get("date"),
                "title": day.get("title"),
                "summary": day.get("summary"),
            }
            day_result = (
                supabase.table("itinerary_days")
                .insert(day_insert)
                .execute()
            )
            day_id = day_result.data[0]["id"]

            activities = day.get("activities", [])
            saved_activities = []
            for idx, activity in enumerate(activities):
                activity_insert = {
                    "day_id": day_id,
                    "time_slot": activity.get("time_slot"),
                    "start_time": activity.get("start_time"),
                    "end_time": activity.get("end_time"),
                    "title": activity.get("title"),
                    "description": activity.get("description"),
                    "category": activity.get("category"),
                    "location_name": activity.get("location_name"),
                    "location_address": activity.get("location_address"),
                    "estimated_cost": activity.get("estimated_cost"),
                    "currency": activity.get("currency", "USD"),
                    "notes": activity.get("notes"),
                    "sort_order": idx,
                }
                supabase.table("activities").insert(activity_insert).execute()
                saved_activities.append(ActivitySchema(**activity_insert))

            saved_days.append(
                ItineraryDaySchema(
                    day_number=day.get("day_number"),
                    date=day.get("date"),
                    title=day.get("title"),
                    summary=day.get("summary"),
                    activities=saved_activities,
                )
            )

        return ItineraryResponse(trip_id=request.trip_id, days=saved_days)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save itinerary: {str(e)}",
        )


@router.get("/{trip_id}", response_model=ItineraryResponse)
async def get_itinerary(
    trip_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get the full itinerary for a trip."""
    supabase = get_supabase_admin()

    # Verify trip ownership
    try:
        supabase.table("trips").select("id").eq("id", trip_id).eq(
            "user_id", user_id
        ).single().execute()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )

    # Fetch days
    days_result = (
        supabase.table("itinerary_days")
        .select("*")
        .eq("trip_id", trip_id)
        .order("day_number")
        .execute()
    )

    days = []
    for day_data in days_result.data:
        # Fetch activities for each day
        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("day_id", day_data["id"])
            .order("sort_order")
            .execute()
        )

        activities = [ActivitySchema(**act) for act in activities_result.data]
        days.append(
            ItineraryDaySchema(
                day_number=day_data["day_number"],
                date=day_data.get("date"),
                title=day_data.get("title"),
                summary=day_data.get("summary"),
                activities=activities,
            )
        )

    return ItineraryResponse(trip_id=trip_id, days=days)
