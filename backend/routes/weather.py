import logging
from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query

from backend.services import open_meteo

logger = logging.getLogger(__name__)

router = APIRouter(tags=["weather"])


@router.get("/weather")
async def get_weather(
    latitude: Annotated[float, Query(ge=-90.0, le=90.0, description="Latitude between -90 and 90")],
    longitude: Annotated[float, Query(ge=-180.0, le=180.0, description="Longitude between -180 and 180")],
    timezone: Annotated[str, Query(max_length=50, description="Timezone name or 'auto'")] = "auto",
):
    """Retrieve 7-day weather forecast and current weather for specific coordinates."""
    try:
        return await open_meteo.get_forecast(
            latitude=latitude,
            longitude=longitude,
            timezone=timezone,
        )
    except httpx.TimeoutException:
        logger.warning("Weather service timed out for lat=%s, lon=%s", latitude, longitude)
        raise HTTPException(
            status_code=503,
            detail="Weather service timed out. Please try again later.",
        )
    except httpx.HTTPStatusError as exc:
        logger.warning("Weather upstream error: %s", exc.response.status_code)
        raise HTTPException(
            status_code=503,
            detail="Weather service is currently unavailable. Please try again later.",
        )
    except Exception as exc:
        logger.exception("Unexpected error fetching weather: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch weather forecast.",
        )
