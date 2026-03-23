from fastapi import APIRouter, HTTPException
from app.models import LectureCreate, LectureStop, LectureResponse
from app.storage import StorageService
from app.config import settings

router = APIRouter(prefix="/api", tags=["lectures"])


def _store() -> StorageService:
    return StorageService(settings.data_dir)


@router.get("/courses/{course_id}/lectures")
def list_lectures(course_id: str) -> list[LectureResponse]:
    return [LectureResponse(**l) for l in _store().list_lectures(course_id)]


@router.get("/lectures/{lecture_id}")
def get_lecture(lecture_id: str) -> LectureResponse:
    result = _store().get_lecture(lecture_id)
    if not result:
        raise HTTPException(404, "Lecture not found")
    return LectureResponse(**result)


@router.post("/lectures/", status_code=201)
def create_lecture(body: LectureCreate) -> LectureResponse:
    store = _store()
    course = store.get_course(body.course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    return LectureResponse(
        **store.create_lecture(
            body.course_id, body.title, body.source_language, body.target_language
        )
    )


@router.post("/lectures/{lecture_id}/stop")
def stop_lecture(lecture_id: str, body: LectureStop) -> LectureResponse:
    result = _store().stop_lecture(lecture_id, body.active_seconds)
    if not result:
        raise HTTPException(404, "Lecture not found")
    return LectureResponse(**result)


@router.delete("/lectures/{lecture_id}", status_code=204)
def delete_lecture(lecture_id: str):
    _store().delete_lecture(lecture_id)
