import inspect
import logging
import os
from typing import Optional

from groq import APIConnectionError, APIStatusError, APITimeoutError, AsyncGroq

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are Vandi, a friendly, helpful, and safety-focused road-trip assistant for families. "
    "Help parents and kids plan engaging, safe, and stress-free road trips.\n\n"
    "Safety Guidelines:\n"
    "1. Always prioritize family safety, driver rest breaks, child comfort, and emergency preparedness.\n"
    "2. Be completely honest that you do not have live, real-time traffic or dynamic road closure data.\n"
    "3. Remind users that all weather information provided is forecast only and can change rapidly.\n"
    "4. If severe weather or flooding is mentioned, always emphasize: 'Turn around, don't drown!'\n"
    "5. Keep responses concise, warm, practical, and age-appropriate."
)

_DISCLAIMER = (
    "AI-generated advice for planning purposes only. "
    "Always verify road conditions with official sources before travelling. "
    "Do not read or interact with this app while driving."
)


def is_configured() -> bool:
    """Check if a valid Groq API key is present in environment."""
    key = os.environ.get("GROQ_API_KEY", "").strip()
    return bool(key) and key != "your_groq_api_key_here"


def get_model() -> str:
    """Return configured Groq model or default llama-3.1-8b-instant."""
    return os.environ.get("GROQ_MODEL", "").strip() or "llama-3.1-8b-instant"


def _build_user_message(question: str, context: Optional[dict] = None) -> str:
    """Prepend trip context (origin, destination, date, weather) to user question if provided."""
    if not context:
        return question

    parts = ["Trip Context:"]
    if context.get("origin"):
        parts.append(f"- Origin: {context['origin']}")
    if context.get("destination"):
        parts.append(f"- Destination: {context['destination']}")
    if context.get("departure_date"):
        parts.append(f"- Departure Date: {context['departure_date']}")
    if context.get("weather_summary"):
        parts.append(f"- Weather Summary: {context['weather_summary']}")

    if len(parts) == 1:
        return question

    parts.append(f"\nUser Question:\n{question}")
    return "\n".join(parts)


async def ask(question: str, context: Optional[dict] = None) -> dict:
    """Query Groq AI model with road-trip safety prompt and user context."""
    if not is_configured():
        raise ValueError("Groq API is not configured")

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model = get_model()
    client = AsyncGroq(api_key=api_key)

    try:
        user_content = _build_user_message(question, context)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            max_tokens=600,
            temperature=0.7,
        )

        content = ""
        if response and response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content or ""

        return {
            "answer": content,
            "model_used": model,
            "disclaimer": _DISCLAIMER,
        }
    except APITimeoutError as err:
        logger.warning("Groq API request timed out: %s", err)
        raise TimeoutError("AI request timed out") from err
    except APIStatusError as err:
        logger.warning("Groq API status error: %s (%s)", err.status_code, err.message)
        if err.status_code == 401:
            raise RuntimeError("Invalid Groq API key") from err
        if err.status_code == 429:
            raise RuntimeError("Rate limit exceeded") from err
        raise RuntimeError("AI service error") from err
    except APIConnectionError as err:
        logger.warning("Groq connection error: %s", err)
        raise RuntimeError("Could not connect to AI service") from err
    finally:
        if hasattr(client, "close"):
            res = client.close()
            if inspect.isawaitable(res):
                await res
