import logging
from datetime import datetime, timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query

from backend.services import open_meteo

try:
    from datetime import UTC
except ImportError:
    UTC = timezone.utc

logger = logging.getLogger(__name__)

router = APIRouter(tags=["geocoding"])


@router.get("/geocode")
async def get_geocode(
    q: Annotated[str, Query(min_length=1, max_length=200, description="City or place name to search")],
    count: Annotated[int, Query(ge=1, le=10, description="Number of results to return")] = 5,
):
    """Search for matching geographical locations by name."""
    clean_query = q.strip()
    if not clean_query:
        raise HTTPException(status_code=422, detail="Search query cannot be empty.")

    try:
        results = await open_meteo.geocode(name=clean_query, count=count)
        return {
            "results": results,
            "fetched_at": datetime.now(UTC).isoformat(),
        }
    except httpx.TimeoutException:
        logger.warning("Geocoding service timed out for query: %s", clean_query)
        raise HTTPException(
            status_code=503,
            detail="Geocoding service timed out. Please try again later.",
        )
    except httpx.HTTPStatusError as exc:
        logger.warning("Geocoding upstream error: %s", exc.response.status_code)
        raise HTTPException(
            status_code=503,
            detail="Geocoding service is unavailable. Please try again later.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in geocoding: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Unable to geocode location.",
        )
