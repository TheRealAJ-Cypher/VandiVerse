import httpx
import pytest
import respx


@pytest.mark.asyncio
async def test_geocode_success(async_client):
    mock_data = {
        "results": [
            {
                "name": "London",
                "country": "United Kingdom",
                "admin1": "England",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "timezone": "Europe/London",
            }
        ]
    }
    with respx.mock:
        respx.get("https://geocoding-api.open-meteo.com/v1/search").mock(
            return_value=httpx.Response(200, json=mock_data)
        )
        response = await async_client.get("/api/geocode?q=London")
        assert response.status_code == 200
        data = response.json()
        assert "fetched_at" in data
        assert len(data["results"]) == 1
        assert data["results"][0]["name"] == "London"


@pytest.mark.asyncio
async def test_geocode_multiple_results(async_client):
    mock_data = {
        "results": [
            {
                "name": "Springfield",
                "country": "United States",
                "admin1": "Illinois",
                "latitude": 39.7817,
                "longitude": -89.6501,
                "timezone": "America/Chicago",
            },
            {
                "name": "Springfield",
                "country": "United States",
                "admin1": "Missouri",
                "latitude": 37.2090,
                "longitude": -93.2923,
                "timezone": "America/Chicago",
            },
        ]
    }
    with respx.mock:
        respx.get("https://geocoding-api.open-meteo.com/v1/search").mock(
            return_value=httpx.Response(200, json=mock_data)
        )
        response = await async_client.get("/api/geocode?q=Springfield")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2
        admin1s = [r["admin1"] for r in data["results"]]
        assert "Illinois" in admin1s
        assert "Missouri" in admin1s


@pytest.mark.asyncio
async def test_geocode_no_results(async_client):
    mock_data = {"results": []}
    with respx.mock:
        respx.get("https://geocoding-api.open-meteo.com/v1/search").mock(
            return_value=httpx.Response(200, json=mock_data)
        )
        response = await async_client.get("/api/geocode?q=NonexistentPlace1234567")
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []


@pytest.mark.asyncio
async def test_geocode_empty_query(async_client):
    response = await async_client.get("/api/geocode?q=")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_geocode_upstream_error(async_client):
    with respx.mock:
        respx.get("https://geocoding-api.open-meteo.com/v1/search").mock(
            return_value=httpx.Response(503, text="Service Unavailable")
        )
        response = await async_client.get("/api/geocode?q=London")
        assert response.status_code == 503
        data = response.json()
        assert "Service Unavailable" not in data.get("detail", "")


@pytest.mark.asyncio
async def test_geocode_timeout(async_client):
    with respx.mock:
        respx.get("https://geocoding-api.open-meteo.com/v1/search").mock(
            side_effect=httpx.TimeoutException("Connection timed out")
        )
        response = await async_client.get("/api/geocode?q=London")
        assert response.status_code == 503
        data = response.json()
        assert "timed out" in data.get("detail", "").lower()
