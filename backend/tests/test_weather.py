import httpx
import pytest
import respx

MOCK_WEATHER = {
    "latitude": 51.5,
    "longitude": -0.12,
    "timezone": "Europe/London",
    "daily": {
        "time": ["2024-06-01"],
        "weathercode": [0],
        "temperature_2m_max": [22.0],
        "temperature_2m_min": [14.0],
        "precipitation_sum": [0.0],
        "precipitation_probability_max": [5],
    },
    "hourly": {
        "time": ["2024-06-01T00:00", "2024-06-01T01:00"],
        "temperature_2m": [16.0, 15.5],
        "precipitation_probability": [5, 5],
        "precipitation": [0.0, 0.0],
        "weathercode": [0, 1],
        "windspeed_10m": [8.0, 7.5],
    },
    "current_weather": {
        "temperature": 20.0,
        "windspeed": 10.0,
        "weathercode": 0,
        "time": "2024-06-01T14:00",
        "is_day": 1,
    },
}


@pytest.mark.asyncio
async def test_weather_success(async_client):
    with respx.mock:
        respx.get("https://api.open-meteo.com/v1/forecast").mock(
            return_value=httpx.Response(200, json=MOCK_WEATHER)
        )
        response = await async_client.get("/api/weather?latitude=51.5&longitude=-0.12")
        assert response.status_code == 200
        data = response.json()
        assert "fetched_at" in data
        assert data["forecast_timezone"] == "Europe/London"
        assert len(data["daily"]) > 0
        assert data["daily"][0]["description"] == "Clear sky"
        assert data["current"] is not None


@pytest.mark.asyncio
async def test_weather_fetched_at_is_string(async_client):
    with respx.mock:
        respx.get("https://api.open-meteo.com/v1/forecast").mock(
            return_value=httpx.Response(200, json=MOCK_WEATHER)
        )
        response = await async_client.get("/api/weather?latitude=51.5&longitude=-0.12")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data.get("fetched_at"), str)
        assert len(data["fetched_at"]) > 0


@pytest.mark.asyncio
async def test_weather_invalid_latitude(async_client):
    response = await async_client.get("/api/weather?latitude=200&longitude=-0.12")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_weather_invalid_longitude(async_client):
    response = await async_client.get("/api/weather?latitude=51.5&longitude=200")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_weather_missing_params(async_client):
    response = await async_client.get("/api/weather")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_weather_upstream_500(async_client):
    with respx.mock:
        respx.get("https://api.open-meteo.com/v1/forecast").mock(
            return_value=httpx.Response(500, text="Internal Server Error: Database failure")
        )
        response = await async_client.get("/api/weather?latitude=51.5&longitude=-0.12")
        assert response.status_code == 503
        data = response.json()
        detail = data.get("detail", "")
        assert "Database failure" not in detail
        assert "Internal Server Error" not in detail


@pytest.mark.asyncio
async def test_weather_timeout(async_client):
    with respx.mock:
        respx.get("https://api.open-meteo.com/v1/forecast").mock(
            side_effect=httpx.TimeoutException("Connection timed out")
        )
        response = await async_client.get("/api/weather?latitude=51.5&longitude=-0.12")
        assert response.status_code == 503
        data = response.json()
        assert "timed out" in data.get("detail", "").lower()
