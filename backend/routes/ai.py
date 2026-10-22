import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services import groq_client, safety_agent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai"])
@router.get("/ai/status")
async def ai_status():
    configured = groq_client.is_configured()

    return {
        "configured": configured,
        "model": groq_client.get_model() if configured else None,
    }

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="User question for the AI road-trip companion")
    context: Optional[dict[str, Any]] = Field(default=None, description="Optional trip context including origin, destination, etc.")


@router.post("/ask")
async def ask_ai(payload: AskRequest):
    """Ask the road-trip AI assistant for packing tips, games, safety, and recommendations."""
    if not groq_client.is_configured():
        raise HTTPException(
            status_code=503,
            detail="AI assistant is not available. Add GROQ_API_KEY to .env and restart the server. See README.md for instructions.",
        )

    # Deterministic safety pre-check runs before the language model.
    safety_assessment = safety_agent.assess_trip_safety(
        question=payload.question,
        context=payload.context,
    )
    agent_trace = [
        {
            "stage": "context_intake",
            "status": "completed",
            "detail": "Question and optional trip context received.",
        },
        {
            "stage": "safety_precheck",
            "status": "completed",
            "detail": safety_assessment["title"],
        },
        {
            "stage": "travel_planner",
            "status": "pending",
            "detail": "Waiting for the configured Groq model.",
        },
    ]

    try:
        result = await groq_client.ask(question=payload.question, context=payload.context)
        agent_trace[-1]["status"] = "completed"
        agent_trace[-1]["detail"] = "AI travel guidance generated; it is not verified road-safety information."
        result["safety_assessment"] = safety_assessment
        result["agent_trace"] = agent_trace
        return result
    except ValueError as exc:
        logger.warning("Configuration error in AI service: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI assistant is not configured properly.",
        )
    except TimeoutError as exc:
        logger.warning("AI request timed out: %s", exc)
        raise HTTPException(
            status_code=504,
            detail="AI assistant request timed out. Please try again later.",
        )
    except RuntimeError as exc:
        logger.warning("AI runtime error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during AI query: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while communicating with the AI assistant.",
        )
