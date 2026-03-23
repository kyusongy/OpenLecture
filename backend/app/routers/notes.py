from fastapi import APIRouter
from app.models import NotesResponse, NotesUpdate
from app.storage import StorageService
from app.config import settings

router = APIRouter(prefix="/api/lectures", tags=["notes"])


def _store() -> StorageService:
    return StorageService(settings.data_dir)


@router.get("/{lecture_id}/notes")
def get_notes(lecture_id: str) -> NotesResponse:
    return NotesResponse(content=_store().get_notes(lecture_id))


@router.put("/{lecture_id}/notes")
def update_notes(lecture_id: str, body: NotesUpdate) -> NotesResponse:
    _store().save_notes(lecture_id, body.content)
    return NotesResponse(content=body.content)
