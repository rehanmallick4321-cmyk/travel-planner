"""AI service for generating travel itineraries using Google Gemini."""

import json
import re
import google.generativeai as genai

from app.config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")


def generate_itinerary(trip_data: dict, feedback: str = None) -> dict:
    """Generate a day-by-day travel itinerary using Google Gemini.

    Args:
        trip_data: Trip details from the database.
        feedback: Optional user feedback for regeneration.

    Returns:
        Dictionary with 'days' key containing the itinerary.
    """
    prompt = _build_prompt(trip_data, feedback)

    try:
        response = model.generate_content(prompt)
        raw_text = response.text

        # Extract JSON from the response
        json_data = _parse_json_response(raw_text)
        return json_data

    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")


def _build_prompt(trip_data: dict, feedback: str = None) -> str:
    """Build a detailed prompt for Gemini."""
    destination = trip_data.get("destination", "Unknown")
    country = trip_data.get("country", "")
    num_days = trip_data.get("num_days", 3)
    start_date = trip_data.get("start_date", "")
    end_date = trip_data.get("end_date", "")
    budget_level = trip_data.get("budget_level", "mid-range")
    travel_style = trip_data.get("travel_style", "cultural")
    num_travelers = trip_data.get("num_travelers", 1)
    special_requests = trip_data.get("special_requests", "")

    prompt = f"""You are an expert travel planner. Create a detailed {num_days}-day travel itinerary for {destination}{f', {country}' if country else ''}.

TRIP DETAILS:
- Destination: {destination}{f', {country}' if country else ''}
- Duration: {num_days} days ({start_date} to {end_date})
- Budget Level: {budget_level}
- Travel Style: {travel_style}
- Number of Travelers: {num_travelers}
{f'- Special Requests: {special_requests}' if special_requests else ''}

{"FEEDBACK FROM PREVIOUS ITINERARY (please incorporate this): " + feedback if feedback else ""}

BUDGET GUIDELINES:
- Budget: Focus on affordable options, street food, public transport, hostels/budget hotels
- Mid-range: Comfortable hotels, mix of local and mid-tier restaurants, some tours
- Luxury: Premium hotels, fine dining, private tours, first-class transport

INSTRUCTIONS:
Create a comprehensive day-by-day itinerary. For each day, provide 4-6 activities spread across morning, afternoon, evening, and optionally night.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{{
  "days": [
    {{
      "day_number": 1,
      "date": "{start_date}",
      "title": "A catchy title for this day (e.g., 'Exploring Historic Old Town')",
      "summary": "A brief 2-3 sentence overview of the day's highlights.",
      "activities": [
        {{
          "time_slot": "morning",
          "start_time": "08:00",
          "end_time": "10:00",
          "title": "Activity name",
          "description": "Detailed description of the activity (2-3 sentences).",
          "category": "attraction",
          "location_name": "Place name",
          "location_address": "Address or area",
          "estimated_cost": 25.00,
          "currency": "USD",
          "notes": "Any tips or useful info"
        }}
      ]
    }}
  ]
}}

IMPORTANT RULES:
- time_slot must be one of: "morning", "afternoon", "evening", "night"
- category must be one of: "attraction", "dining", "accommodation", "transportation", "shopping", "entertainment", "nature", "culture"
- Include a mix of categories each day
- Include realistic estimated costs in USD
- Include actual real places, restaurants, and attractions
- Each day should have 4-6 activities
- Make the itinerary flow logically (nearby activities grouped together)
- Include transportation between major areas
- Include at least one dining activity per meal time
- Respond ONLY with the JSON, no markdown formatting or code blocks"""

    return prompt


def _parse_json_response(raw_text: str) -> dict:
    """Parse JSON from Gemini's response, handling markdown code blocks."""
    # Remove markdown code block wrappers if present
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Try to find JSON object in the response
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        raise RuntimeError(
            f"Failed to parse AI response as JSON: {str(e)}\nRaw: {raw_text[:500]}"
        )
