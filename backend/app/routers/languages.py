from fastapi import APIRouter
from app.services.language_pairs import get_sources, get_labels, ALL_TARGETS

router = APIRouter(prefix="/api/languages", tags=["languages"])


@router.get("/pairs")
def language_pairs():
    return {
        "sources": get_sources(),
        "targets": ALL_TARGETS,
        "labels": get_labels(),
    }
