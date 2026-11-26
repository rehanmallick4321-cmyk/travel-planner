"""TripCraft AI — Streamlit Edition (Optimized for Streamlit Community Cloud)."""

from datetime import date, timedelta
import json
import os
import re

import streamlit as st
from supabase import Client, create_client

st.set_page_config(
    page_title="TripCraft AI - Smart Travel Planner",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom Styling ───────────────────────────────────────────────────────────

st.markdown(
    """
    <style>
    .trip-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    }
    .activity-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #2563eb;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-bottom: 0.85rem;
    }
    .badge {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 0.4rem;
    }
    .badge-morning { background: #fef3c7; color: #92400e; }
    .badge-afternoon { background: #e0f2fe; color: #075985; }
    .badge-evening { background: #f3e8ff; color: #6b21a8; }
    .badge-night { background: #e0e7ff; color: #3730a3; }
    .badge-cat { background: #f1f5f9; color: #334155; }
    </style>
    """,
    unsafe_allow_html=True,
)


# ── Configuration & Clients ──────────────────────────────────────────────────


@st.cache_data(ttl=3600)
def get_secret(key: str, default: str = "") -> str:
    """Read a secret from st.secrets first, then fall back to environment vars."""
    try:
        if key in st.secrets:
            return str(st.secrets[key])
    except Exception:
        pass
    if not os.getenv(key):
        from dotenv import load_dotenv
        load_dotenv()
    return os.getenv(key, default)


@st.cache_resource
def _base_supabase_client(url: str, key: str) -> Client:
    """Cache base Supabase client initialization."""
    return create_client(url, key)


def get_supabase() -> Client:
    """Return a Supabase client authenticated with the user's current session."""
    url = get_secret("SUPABASE_URL")
    key = get_secret("SUPABASE_KEY")
    if not url or not key:
        st.error(
            "Missing `SUPABASE_URL` or `SUPABASE_KEY`. "
            "Add them in Streamlit Cloud Secrets or `.streamlit/secrets.toml`."
        )
        st.stop()

    client = _base_supabase_client(url, key)
    session = st.session_state.get("session")
    if session and getattr(session, "access_token", None):
        client.postgrest.auth(session.access_token)
    return client


@st.cache_resource
def get_gemini_model(api_key: str):
    """Lazy-load and cache the Gemini model instance once."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={"response_mime_type": "application/json"},
    )


def generate_itinerary_with_gemini(trip_data: dict, feedback: str = "") -> dict:
    """Generate a structured day-by-day itinerary using Google Gemini."""
    api_key = get_secret("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY. Add it in Streamlit Cloud Secrets or .streamlit/secrets.toml."
        )

    model = get_gemini_model(api_key)

    destination = trip_data.get("destination", "Unknown")
    country = trip_data.get("country") or ""
    num_days = trip_data.get("num_days") or 3
    start_date = trip_data.get("start_date") or ""
    end_date = trip_data.get("end_date") or ""
    budget_level = trip_data.get("budget_level") or "mid-range"
    travel_style = trip_data.get("travel_style") or "cultural"
    num_travelers = trip_data.get("num_travelers") or 1
    special_requests = trip_data.get("special_requests") or ""

    prompt = f"""You are an expert travel planner. Create a detailed {num_days}-day travel itinerary for {destination}{f', {country}' if country else ''}.

TRIP DETAILS:
- Destination: {destination}{f', {country}' if country else ''}
- Duration: {num_days} days ({start_date} to {end_date})
- Budget Level: {budget_level}
- Travel Style: {travel_style}
- Number of Travelers: {num_travelers}
{f'- Special Requests: {special_requests}' if special_requests else ''}
{f'- Feedback to incorporate: {feedback}' if feedback else ''}

Return JSON matching this exact schema:
{{
  "days": [
    {{
      "day_number": 1,
      "date": "{start_date}",
      "title": "Catchy day title",
      "summary": "2-3 sentence overview of the day.",
      "activities": [
        {{
          "time_slot": "morning",
          "start_time": "09:00",
          "end_time": "11:00",
          "title": "Activity name",
          "description": "2-3 sentence description.",
          "category": "attraction",
          "location_name": "Place name",
          "location_address": "Address or neighborhood",
          "estimated_cost": 25.0,
          "currency": "USD",
          "notes": "Helpful tip"
        }}
      ]
    }}
  ]
}}

Rules:
- time_slot must be one of: "morning", "afternoon", "evening", "night"
- category must be one of: "attraction", "dining", "accommodation", "transportation", "shopping", "entertainment", "nature", "culture"
- Provide 4-6 activities per day with realistic places and USD cost estimates"""

    response = model.generate_content(prompt)
    cleaned = response.text.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group())
        raise RuntimeError("Could not parse Gemini response as JSON.")


# ── Database Helpers (Batched & Cached) ──────────────────────────────────────


def save_generated_itinerary(supabase: Client, trip_id: str, ai_result: dict) -> None:
    """Persist AI-generated days and activities using bulk inserts (3 queries total instead of 30+)."""
    supabase.table("itinerary_days").delete().eq("trip_id", trip_id).execute()

    days_list = ai_result.get("days", [])
    if not days_list:
        return

    # 1. Bulk insert all days in a single network call
    days_payload = [
        {
            "trip_id": trip_id,
            "day_number": day.get("day_number"),
            "date": day.get("date") or None,
            "title": day.get("title"),
            "summary": day.get("summary"),
        }
        for day in days_list
    ]
    day_res = supabase.table("itinerary_days").insert(days_payload).execute()
    day_id_by_num = {row["day_number"]: row["id"] for row in day_res.data}

    # 2. Bulk insert all activities across all days in a single network call
    activities_payload = []
    for day in days_list:
        day_id = day_id_by_num.get(day.get("day_number"))
        if not day_id:
            continue
        for idx, act in enumerate(day.get("activities", [])):
            activities_payload.append(
                {
                    "day_id": day_id,
                    "time_slot": act.get("time_slot"),
                    "start_time": act.get("start_time") or None,
                    "end_time": act.get("end_time") or None,
                    "title": act.get("title") or "Activity",
                    "description": act.get("description"),
                    "category": act.get("category"),
                    "location_name": act.get("location_name"),
                    "location_address": act.get("location_address"),
                    "estimated_cost": act.get("estimated_cost"),
                    "currency": act.get("currency", "USD"),
                    "notes": act.get("notes"),
                    "sort_order": idx,
                }
            )

    if activities_payload:
        supabase.table("activities").insert(activities_payload).execute()

    # 3. Update trip status & clear cached reads
    supabase.table("trips").update({"status": "generated"}).eq("id", trip_id).execute()
    fetch_itinerary.clear()
    fetch_user_trips.clear()


@st.cache_data(ttl=120, max_entries=50)
def fetch_user_trips(user_id: str, access_token: str) -> list[dict]:
    """Fetch and cache all trips for a user."""
    supabase = get_supabase()
    return (
        supabase.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
        .data
    )


@st.cache_data(ttl=300, max_entries=50)
def fetch_itinerary(trip_id: str, access_token: str) -> list[dict]:
    """Fetch all days and nested activities in a SINGLE Supabase join query."""
    supabase = get_supabase()
    days = (
        supabase.table("itinerary_days")
        .select("*, activities(*)")
        .eq("trip_id", trip_id)
        .order("day_number")
        .execute()
        .data
    )
    for day in days:
        day["activities"] = sorted(
            day.get("activities") or [], key=lambda a: a.get("sort_order", 0)
        )
    return days


# ── Auth Views ───────────────────────────────────────────────────────────────


def render_auth_page() -> None:
    """Render Sign In and Sign Up tabs."""
    st.title("✈️ TripCraft AI")
    st.caption("Personalized AI-Powered Travel Itinerary Planner")

    col1, _ = st.columns([1.2, 1])
    with col1:
        tab_login, tab_signup = st.tabs(["Sign In", "Create Account"])

        with tab_login:
            with st.form("login_form"):
                email = st.text_input("Email", placeholder="you@example.com")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Sign In", type="primary", use_container_width=True)

            if submitted:
                try:
                    supabase = get_supabase()
                    res = res = supabase.auth.sign_in_with_password(
    {"email": email, "password": password}
)
