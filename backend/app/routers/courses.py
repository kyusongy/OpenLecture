from fastapi import APIRouter, HTTPException
from app.models import CourseCreate, CourseUpdate, CourseResponse
from app.storage import StorageService
from app.config import settings

router = APIRouter(prefix="/api/courses", tags=["courses"])


def _store() -> StorageService:
    return StorageService(settings.data_dir)


@router.get("/")
def list_courses() -> list[CourseResponse]:
    return [CourseResponse(**c) for c in _store().list_courses()]


@router.post("/", status_code=201)
def create_course(body: CourseCreate) -> CourseResponse:
    return CourseResponse(**_store().create_course(body.name))


@router.put("/{course_id}")
def update_course(course_id: str, body: CourseUpdate) -> CourseResponse:
    result = _store().update_course(course_id, body.name)
    if not result:
        raise HTTPException(404, "Course not found")
    return CourseResponse(**result)


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: str):
    _store().delete_course(course_id)
