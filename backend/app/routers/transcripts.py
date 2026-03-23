from fastapi import APIRouter
from app.models import TranscriptBatch
from app.storage import StorageService
from app.config import settings

router = APIRouter(prefix="/api/lectures", tags=["transcripts"])


def _store() -> StorageService:
    return StorageService(settings.data_dir)


@router.get("/{lecture_id}/transcript")
def get_transcript(lecture_id: str) -> list[dict]:
    return _store().get_transcript(lecture_id)


@router.post("/{lecture_id}/transcript", status_code=201)
def append_transcript(lecture_id: str, body: TranscriptBatch):
    _store().append_transcript(lecture_id, [l.model_dump() for l in body.lines])
    return {"ok": True}
