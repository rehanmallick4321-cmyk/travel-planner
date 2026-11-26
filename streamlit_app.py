"""TripCraft AI — Streamlit Edition.

A full-stack AI-powered Personalized Travel Itinerary Planner built with
Streamlit, Supabase (Auth + PostgreSQL with RLS), and Google Gemini.
"""

from datetime import date, timedelta
import json
import os
import re

from dotenv import load_dotenv
import google.generativeai as genai
import streamlit as st
from supabase import Client, create_client

load_dotenv()

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


def get_secret(key: str, default: str = "") -> str:
    """Read a secret from st.secrets first, then fall back to environment vars."""
    try:
        if key in st.secrets:
            return str(st.secrets[key])
    except Exception:
        pass
    return os.getenv(key, default)


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

    client = create_client(url, key)
    session = st.session_state.get("session")
    if session and getattr(session, "access_token", None):
        client.postgrest.auth(session.access_token)
    return client


def generate_itinerary_with_gemini(trip_data: dict, feedback: str = "") -> dict:
    """Generate a structured day-by-day itinerary using Google Gemini."""
    api_key = get_secret("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY. Add it in Streamlit Cloud Secrets or .streamlit/secrets.toml."
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

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

Respond ONLY with valid JSON in this exact format:
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
- Provide 4-6 activities per day with realistic places and USD cost estimates
- Do not wrap the response in markdown code fences."""

    response = model.generate_content(prompt)
    cleaned = response.text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group())
        raise RuntimeError("Could not parse Gemini response as JSON.")


# ── Database Helpers ─────────────────────────────────────────────────────────


def save_generated_itinerary(supabase: Client, trip_id: str, ai_result: dict) -> None:
    """Persist AI-generated days and activities to Supabase."""
    supabase.table("itinerary_days").delete().eq("trip_id", trip_id).execute()

    for day in ai_result.get("days", []):
        day_insert = {
            "trip_id": trip_id,
            "day_number": day.get("day_number"),
            "date": day.get("date") or None,
            "title": day.get("title"),
            "summary": day.get("summary"),
        }
        day_res = supabase.table("itinerary_days").insert(day_insert).execute()
        day_id = day_res.data[0]["id"]

        for idx, act in enumerate(day.get("activities", [])):
            act_insert = {
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
            supabase.table("activities").insert(act_insert).execute()

    supabase.table("trips").update({"status": "generated"}).eq("id", trip_id).execute()


def fetch_itinerary(supabase: Client, trip_id: str) -> list[dict]:
    """Fetch all days and their ordered activities for a trip."""
    days = (
        supabase.table("itinerary_days")
        .select("*")
        .eq("trip_id", trip_id)
        .order("day_number")
        .execute()
        .data
    )
    for day in days:
        day["activities"] = (
            supabase.table("activities")
            .select("*")
            .eq("day_id", day["id"])
            .order("sort_order")
            .execute()
            .data
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
                    res = supabase.auth.sign_in_with_password(
                        {"email": email, "password": password}
                    )
                    st.session_state["user"] = res.user
                    st.session_state["session"] = res.session
                    st.success("Welcome back!")
                    st.rerun()
                except Exception as exc:
                    st.error(f"Sign in failed: {exc}")

        with tab_signup:
            with st.form("signup_form"):
                full_name = st.text_input("Full Name", placeholder="Jane Doe")
                email = st.text_input("Email", placeholder="you@example.com")
                password = st.text_input("Password", type="password", help="Minimum 6 characters")
                confirm = st.text_input("Confirm Password", type="password")
                submitted = st.form_submit_button(
                    "Create Account", type="primary", use_container_width=True
                )

            if submitted:
                if len(password) < 6:
                    st.error("Password must be at least 6 characters.")
                elif password != confirm:
                    st.error("Passwords do not match.")
                else:
                    try:
                        supabase = get_supabase()
                        res = supabase.auth.sign_up(
                            {
                                "email": email,
                                "password": password,
                                "options": {"data": {"full_name": full_name}},
                            }
                        )
                        if res.session:
                            st.session_state["user"] = res.user
                            st.session_state["session"] = res.session
                            st.success("Account created!")
                            st.rerun()
                        else:
                            st.info(
                                "Account created! Check your email to confirm, then sign in."
                            )
                    except Exception as exc:
                        st.error(f"Sign up failed: {exc}")


# ── App Pages ────────────────────────────────────────────────────────────────


def render_dashboard(supabase: Client, user_id: str) -> None:
    """Render the user's trip dashboard."""
    st.title("🗺️ My Travel Dashboard")

    trips = (
        supabase.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
        .data
    )

    today_str = date.today().isoformat()
    upcoming = sum(1 for t in trips if t.get("start_date") and t["start_date"] >= today_str)
    countries = len({t["country"].strip() for t in trips if t.get("country")})
    total_days = sum(int(t.get("num_days") or 0) for t in trips)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Trips", len(trips))
    c2.metric("Upcoming", upcoming)
    c3.metric("Countries", countries)
    c4.metric("Days Planned", total_days)

    st.divider()

    if not trips:
        st.info("No trips yet! Use **Plan New Trip** in the sidebar to create your first adventure.")
        return

    status_filter = st.selectbox("Filter by status", ["all", "draft", "generated", "saved"])
    filtered = trips if status_filter == "all" else [t for t in trips if t.get("status") == status_filter]

    for trip in filtered:
        with st.container(border=True):
            left, right = st.columns([3, 1])
            with left:
                st.subheader(f"📍 {trip['destination']}" + (f", {trip['country']}" if trip.get("country") else ""))
                st.caption(
                    f"📅 {trip.get('start_date') or 'Flexible'} → {trip.get('end_date') or 'Flexible'} "
                    f"• {trip.get('num_days') or '?'} days • "
                    f"💰 {trip.get('budget_level', 'mid-range')} • "
                    f"🧭 {trip.get('travel_style', 'cultural')} • "
                    f"Status: **{trip.get('status', 'draft').upper()}**"
                )
            with right:
                if st.button("Open Trip", key=f"open_{trip['id']}", use_container_width=True):
                    st.session_state["selected_trip_id"] = trip["id"]
                    st.session_state["page"] = "Trip Detail"
                    st.rerun()


def render_trip_builder(supabase: Client, user_id: str) -> None:
    """Render the smart trip builder form."""
    st.title("✨ Plan a New Trip")

    with st.form("trip_builder_form"):
        col1, col2 = st.columns(2)
        destination = col1.text_input("Destination City / Region *", placeholder="e.g., Tokyo, Paris, Bali")
        country = col2.text_input("Country", placeholder="e.g., Japan, France, Indonesia")

        d1, d2 = st.columns(2)
        start_date = d1.date_input("Start Date", value=date.today() + timedelta(days=14))
        end_date = d2.date_input("End Date", value=date.today() + timedelta(days=18))

        p1, p2, p3 = st.columns(3)
        budget_level = p1.selectbox("Budget Level", ["budget", "mid-range", "luxury"], index=1)
        travel_style = p2.selectbox(
            "Travel Style",
            ["adventure", "relaxation", "cultural", "foodie", "family", "solo", "romantic"],
            index=2,
        )
        num_travelers = p3.number_input("Travelers", min_value=1, max_value=20, value=2)

        special_requests = st.text_area(
            "Special Requests (optional)",
            placeholder="e.g., Vegetarian dining, kid-friendly activities, day trip to Kyoto...",
        )

        submitted = st.form_submit_button("Create Trip", type="primary", use_container_width=True)

    if submitted:
        if not destination.strip():
            st.error("Destination is required.")
            return
        if end_date < start_date:
            st.error("End date must be on or after start date.")
            return

        num_days = (end_date - start_date).days + 1
        payload = {
            "user_id": user_id,
            "destination": destination.strip(),
            "country": country.strip() or None,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "num_days": num_days,
            "budget_level": budget_level,
            "travel_style": travel_style,
            "num_travelers": int(num_travelers),
            "special_requests": special_requests.strip() or None,
            "status": "draft",
        }
        res = supabase.table("trips").insert(payload).execute()
        st.session_state["selected_trip_id"] = res.data[0]["id"]
        st.session_state["page"] = "Trip Detail"
        st.success("Trip created!")
        st.rerun()


def render_trip_detail(supabase: Client, user_id: str) -> None:
    """Render trip details, AI generation, regeneration, and day-by-day itinerary."""
    trip_id = st.session_state.get("selected_trip_id")
    if not trip_id:
        st.info("Select a trip from the Dashboard first.")
        return

    res = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    trip = res.data

    if st.button("← Back to Dashboard"):
        st.session_state["page"] = "Dashboard"
        st.rerun()

    st.title(f"📍 {trip['destination']}" + (f", {trip['country']}" if trip.get("country") else ""))
    st.caption(
        f"📅 {trip.get('start_date') or 'Flexible'} → {trip.get('end_date') or 'Flexible'} "
        f"({trip.get('num_days') or '?'} days) • 💰 {trip.get('budget_level')} • "
        f"🧭 {trip.get('travel_style')} • 👥 {trip.get('num_travelers', 1)} traveler(s)"
    )

    if trip.get("special_requests"):
        st.info(f"**Special Requests:** {trip['special_requests']}")

    days = fetch_itinerary(supabase, trip_id)

    col_gen, col_del = st.columns([3, 1])
    with col_gen:
        if not days:
            if st.button("✨ Generate Itinerary with AI", type="primary", use_container_width=True):
                with st.spinner("Crafting your personalized itinerary with Google Gemini..."):
                    try:
                        ai_result = generate_itinerary_with_gemini(trip)
                        save_generated_itinerary(supabase, trip_id, ai_result)
                        st.success("Itinerary generated!")
                        st.rerun()
                    except Exception as exc:
                        st.error(f"Generation failed: {exc}")
        else:
            with st.expander("🔄 Regenerate Itinerary with Feedback"):
                feedback = st.text_area(
                    "What would you like to adjust?",
                    placeholder="e.g., More outdoor spots, fewer museums, cheaper dining...",
                )
                if st.button("Regenerate Now", type="primary"):
                    with st.spinner("Regenerating itinerary with your feedback..."):
                        try:
                            ai_result = generate_itinerary_with_gemini(trip, feedback=feedback)
                            save_generated_itinerary(supabase, trip_id, ai_result)
                            st.success("Itinerary updated!")
                            st.rerun()
                        except Exception as exc:
                            st.error(f"Regeneration failed: {exc}")

    with col_del:
        if st.button("🗑️ Delete Trip", use_container_width=True):
            supabase.table("trips").delete().eq("id", trip_id).eq("user_id", user_id).execute()
            st.session_state.pop("selected_trip_id", None)
            st.session_state["page"] = "Dashboard"
            st.success("Trip deleted.")
            st.rerun()

    if days:
        st.divider()
        st.subheader("🗓️ Day-by-Day Itinerary")
        tabs = st.tabs([f"Day {d['day_number']}" for d in days])

        for tab, day in zip(tabs, days):
            with tab:
                day_title = day.get("title") or f"Day {day['day_number']}"
                st.markdown(f"### {day_title}")
                if day.get("summary"):
                    st.write(f"*{day['summary']}*")

                for act in day.get("activities", []):
                    slot = act.get("time_slot") or "morning"
                    cat = act.get("category") or "attraction"
                    time_range = " – ".join(
                        [t for t in [act.get("start_time"), act.get("end_time")] if t]
                    )
                    cost = (
                        f"💵 {act['estimated_cost']} {act.get('currency', 'USD')}"
                        if act.get("estimated_cost") is not None
                        else ""
                    )
                    loc = act.get("location_name") or ""
                    if act.get("location_address"):
                        loc = f"{loc} ({act['location_address']})" if loc else act["location_address"]

                    st.markdown(
                        f"""
                        <div class="activity-card">
                            <div>
                                <span class="badge badge-{slot}">{slot.upper()}</span>
                                <span class="badge badge-cat">{cat.upper()}</span>
                                <span style="color:#64748b;font-size:0.85rem;">{time_range}</span>
                            </div>
                            <h4 style="margin:0.5rem 0 0.25rem 0;color:#0f172a;">{act.get('title')}</h4>
                            <p style="margin:0 0 0.5rem 0;color:#475569;font-size:0.92rem;">{act.get('description') or ''}</p>
                            <div style="font-size:0.85rem;color:#334155;">
                                {f'📍 {loc} &nbsp;&nbsp;' if loc else ''}{cost}
                            </div>
                            {f'<div style="margin-top:0.5rem;padding:0.4rem 0.6rem;background:#f8fafc;border-radius:6px;font-size:0.82rem;color:#475569;">💡 {act["notes"]}</div>' if act.get("notes") else ''}
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )


# ── Main Router ──────────────────────────────────────────────────────────────


def main() -> None:
    user = st.session_state.get("user")
    if not user:
        render_auth_page()
        return

    supabase = get_supabase()
    user_id = str(user.id)

    with st.sidebar:
        st.title("✈️ TripCraft AI")
        display_name = (user.user_metadata or {}).get("full_name") or user.email
        st.caption(f"Signed in as **{display_name}**")
        st.divider()

        current_page = st.session_state.get("page", "Dashboard")
        nav_options = ["Dashboard", "Plan New Trip"]
        if st.session_state.get("selected_trip_id"):
            nav_options.append("Trip Detail")

        choice = st.radio(
            "Navigation",
            nav_options,
            index=nav_options.index(current_page) if current_page in nav_options else 0,
        )
        if choice != current_page:
            st.session_state["page"] = choice
            st.rerun()

        st.divider()
        if st.button("Sign Out", use_container_width=True):
            try:
                supabase.auth.sign_out()
            except Exception:
                pass
            st.session_state.clear()
            st.rerun()

    page = st.session_state.get("page", "Dashboard")
    if page == "Dashboard":
        render_dashboard(supabase, user_id)
    elif page == "Plan New Trip":
        render_trip_builder(supabase, user_id)
    elif page == "Trip Detail":
        render_trip_detail(supabase, user_id)


if __name__ == "__main__":
    main()
