import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

try:
    from datetime import UTC
except ImportError:
    UTC = timezone.utc

logger = logging.getLogger(__name__)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = 10.0

WMO_DESCRIPTIONS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _wmo_description(code: Optional[int]) -> str:
    """Return descriptive text for a WMO weather interpretation code."""
    if code is None:
        return "Unknown"
    return WMO_DESCRIPTIONS.get(code, "Unknown")


def _safe_list_get(lst: Any, i: int, default: Any = None) -> Any:
    """Safely return element at index i from list, or default if out of bounds."""
    try:
        if lst is not None and 0 <= i < len(lst):
            return lst[i]
        return default
    except (IndexError, TypeError):
        return default


async def geocode(name: str, count: int = 5) -> list[dict]:
    """Search for locations matching name using Open-Meteo Geocoding API."""
    params = {
        "name": name,
        "count": count,
        "language": "en",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(GEOCODING_URL, params=params)
        response.raise_for_status()
        data = response.json()

    results = data.get("results") or []
    return [
        {
            "name": item.get("name"),
            "country": item.get("country"),
            "admin1": item.get("admin1"),
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
            "timezone": item.get("timezone"),
        }
        for item in results
    ]


async def get_forecast(latitude: float, longitude: float, timezone: str = "auto") -> dict:
    """Fetch 7-day weather forecast and current weather for given coordinates."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,precipitation_probability,precipitation,weathercode,windspeed_10m",
        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
        "current_weather": "true",
        "forecast_days": 7,
        "wind_speed_unit": "kmh",
        "timezone": timezone,
    }

    fetched_at = datetime.now(UTC).isoformat()

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(FORECAST_URL, params=params)
        response.raise_for_status()
        data = response.json()

    daily_raw = data.get("daily") or {}
    daily_times = daily_raw.get("time") or []
    daily: list[dict] = []
    for i, date_str in enumerate(daily_times):
        code = _safe_list_get(daily_raw.get("weathercode"), i)
        daily.append(
            {
                "date": date_str,
                "weather_code": code,
                "description": _wmo_description(code),
                "temp_max": _safe_list_get(daily_raw.get("temperature_2m_max"), i),
                "temp_min": _safe_list_get(daily_raw.get("temperature_2m_min"), i),
                "precipitation_sum": _safe_list_get(daily_raw.get("precipitation_sum"), i),
                "precipitation_probability_max": _safe_list_get(
                    daily_raw.get("precipitation_probability_max"), i
                ),
            }
        )

    hourly_raw = data.get("hourly") or {}
    hourly_times = hourly_raw.get("time") or []
    first_date = daily[0]["date"] if daily else (daily_times[0] if daily_times else "")
    hourly_today: list[dict] = []
    for i, t in enumerate(hourly_times):
        if first_date and str(t).startswith(first_date):
            code = _safe_list_get(hourly_raw.get("weathercode"), i)
            hourly_today.append(
                {
                    "time": t,
                    "temperature": _safe_list_get(hourly_raw.get("temperature_2m"), i),
                    "precipitation_probability": _safe_list_get(
                        hourly_raw.get("precipitation_probability"), i
                    ),
                    "precipitation": _safe_list_get(hourly_raw.get("precipitation"), i),
                    "weather_code": code,
                    "description": _wmo_description(code),
                    "windspeed": _safe_list_get(hourly_raw.get("windspeed_10m"), i),
                }
            )

    cw = data.get("current_weather")
    current = None
    if cw is not None:
        code = cw.get("weathercode")
        current = {
            "temperature": cw.get("temperature"),
            "windspeed": cw.get("windspeed"),
            "weather_code": code,
            "description": _wmo_description(code),
            "time": cw.get("time"),
            "is_day": cw.get("is_day"),
        }

    return {
        "fetched_at": fetched_at,
        "forecast_timezone": data.get("timezone"),
        "latitude": data.get("latitude", latitude),
        "longitude": data.get("longitude", longitude),
        "daily": daily,
        "hourly_today": hourly_today,
        "current": current,
    }
