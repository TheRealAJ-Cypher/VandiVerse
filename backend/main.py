import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import ai, geocoding, weather

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VandiVerse API",
    description="AI-powered family road-trip companion",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(weather.router, prefix="/api")
app.include_router(geocoding.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

_frontend = Path(__file__).parent.parent / "frontend"

for _path, _subdir, _name in [
    ("/css", "css", "css"),
    ("/js", "js", "js"),
    ("/assets", "assets", "assets"),
]:
    _d = _frontend / _subdir
    if _d.exists():
        app.mount(_path, StaticFiles(directory=str(_d)), name=_name)


@app.get("/", include_in_schema=False)
async def serve_index():
    f = _frontend / "index.html"
    if f.exists():
        return FileResponse(str(f))
    return {"message": "VandiVerse API running. See /api/docs"}


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found.")
    f = _frontend / "index.html"
    if f.exists():
        return FileResponse(str(f))
    raise HTTPException(status_code=404, detail="Not found.")
