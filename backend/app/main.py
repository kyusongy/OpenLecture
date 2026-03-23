import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    courses,
    lectures,
    transcripts,
    notes,
    languages,
    translate,
    settings_router,
    transcription_ws,
)

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)-5s %(name)s: %(message)s"
    if settings.debug
    else "%(message)s",
    datefmt="%H:%M:%S",
)
for lib in ("httpx", "httpcore", "websockets"):
    logging.getLogger(lib).setLevel(logging.WARNING)

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.debug else None,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in [
    courses,
    lectures,
    transcripts,
    notes,
    languages,
    translate,
    settings_router,
    transcription_ws,
]:
    app.include_router(r.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "api_key_configured": bool(settings.dashscope_api_key)}
