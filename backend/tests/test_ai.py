from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _mock_completion(content="Pack sunscreen!"):
    msg = MagicMock()
    msg.content = content
    choice = MagicMock()
    choice.message = msg
    comp = MagicMock()
    comp.choices = [choice]
    return comp


@pytest.mark.asyncio
async def test_ai_no_key(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    response = await async_client.post(
        "/api/ask",
        json={"question": "What should we do on the road?"},
    )
    assert response.status_code == 503
    detail = response.json().get("detail", "").lower()
    assert any(k in detail for k in ["not available", "groq_api_key", "not configured"])


@pytest.mark.asyncio
async def test_ai_placeholder_key(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "your_groq_api_key_here")
    response = await async_client.post(
        "/api/ask",
        json={"question": "What should we do?"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_ai_empty_question(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123")
    response = await async_client.post(
        "/api/ask",
        json={"question": ""},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ai_question_too_long(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123")
    response = await async_client.post(
        "/api/ask",
        json={"question": "x" * 1001},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ai_success(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123")
    mock_instance = AsyncMock()
    mock_instance.chat.completions.create = AsyncMock(
        return_value=_mock_completion("Pack sunscreen!")
    )
    mock_instance.close = AsyncMock()

    with patch("backend.services.groq_client.AsyncGroq", return_value=mock_instance):
        response = await async_client.post(
            "/api/ask",
            json={"question": "What should I pack for the road trip?"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["answer"] == "Pack sunscreen!"
        assert "model_used" in data
        assert "disclaimer" in data


@pytest.mark.asyncio
async def test_ai_success_with_context(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123")
    mock_instance = AsyncMock()
    mock_instance.chat.completions.create = AsyncMock(
        return_value=_mock_completion("Bring rain gear and card games.")
    )
    mock_instance.close = AsyncMock()

    with patch("backend.services.groq_client.AsyncGroq", return_value=mock_instance):
        payload = {
            "question": "What games and gear should we bring?",
            "context": {
                "origin": "Chicago",
                "destination": "Yellowstone",
                "departure_date": "2024-07-15",
                "weather_summary": "Scattered rain and 18C",
            },
        }
        response = await async_client.post("/api/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["answer"] == "Bring rain gear and card games."
        assert "model_used" in data
        assert "disclaimer" in data



@pytest.mark.asyncio
async def test_ai_status_does_not_call_model(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    response = await async_client.get("/api/ai/status")
    assert response.status_code == 200
    assert response.json()["configured"] is False
    assert response.json()["model"] is None


@pytest.mark.asyncio
async def test_ai_success_includes_safety_gate_and_trace(async_client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123")
    mock_instance = AsyncMock()
    mock_instance.chat.completions.create = AsyncMock(
        return_value=_mock_completion("Please check official advisories before departure.")
    )
    mock_instance.close = AsyncMock()

    with patch("backend.services.groq_client.AsyncGroq", return_value=mock_instance):
        response = await async_client.post(
            "/api/ask",
            json={"question": "Can we drive through floodwater?"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["safety_assessment"]["level"] == "critical"
    assert data["safety_assessment"]["live_road_data_checked"] is False
    assert [step["stage"] for step in data["agent_trace"]] == [
        "context_intake", "safety_precheck", "travel_planner"
    ]
