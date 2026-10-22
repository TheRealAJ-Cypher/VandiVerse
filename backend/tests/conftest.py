import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture()
def app():
    from backend.main import app as fastapi_app
    return fastapi_app


@pytest.fixture()
async def async_client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        yield client
