"""Small deterministic safety gate for VandiVerse AI responses.

This is a keyword-based pre-check, not a road-condition detector. It only evaluates
the user's question and explicitly supplied trip context.
"""
from typing import Any, Optional

FLOOD_TERMS = (
    "floodwater", "flood water", "flooded road", "flooded roads",
    "water over the road", "drive through water", "cross flood",
    "flash flood", "flooding", "waterlogging", "waterlogged",
)
ADVERSE_WEATHER_TERMS = (
    "heavy rain", "severe rain", "thunderstorm", "cyclone", "landslide",
    "low visibility", "dense fog", "strong wind", "extreme heat",
    "severe weather", "red alert", "orange alert",
)


def assess_trip_safety(question: str, context: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    """Return a conservative, explainable safety assessment based on supplied text."""
    context = context or {}
    weather_summary = str(context.get("weather_summary") or "")
    combined = f"{question or ''} {weather_summary}".casefold()

    flood_detected = any(term in combined for term in FLOOD_TERMS)
    adverse_detected = any(term in combined for term in ADVERSE_WEATHER_TERMS)

    if flood_detected:
        level = "critical"
        title = "Flood-related risk mentioned"
        guidance = (
            "Do not drive through floodwater or water covering a road. Turn around, "
            "choose another route, and follow official local warnings."
        )
        reason = "Flood-related wording was detected in the question or supplied weather summary."
    elif adverse_detected:
        level = "caution"
        title = "Adverse weather mentioned"
        guidance = (
            "Check current official weather and local road advisories before departure. "
            "Delay travel or stop somewhere safe if conditions deteriorate."
        )
        reason = "Adverse-weather wording was detected in the question or supplied weather summary."
    else:
        level = "unverified"
        title = "Road safety not verified"
        guidance = (
            "This check has no verified live road-condition data. Review official forecasts "
            "and local advisories; a weather forecast alone cannot establish road safety."
        )
        reason = (
            "No matching hazard keywords were detected. This does not mean the route is safe."
        )

    return {
        "level": level,
        "title": title,
        "guidance": guidance,
        "reason": reason,
        "method": "deterministic_keyword_precheck",
        "live_road_data_checked": False,
    }
