from fastapi import APIRouter
from app.models import SettingsResponse, SettingsUpdate
from app.storage import StorageService
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _store() -> StorageService:
    return StorageService(settings.data_dir)


@router.get("/")
def get_settings() -> SettingsResponse:
    stored = _store().get_settings()
    return SettingsResponse(
        api_key_configured=bool(settings.dashscope_api_key),
        default_source_language=stored.get("default_source_language", "EN"),
        default_target_language=stored.get("default_target_language", "ZH"),
    )


@router.put("/")
def update_settings(body: SettingsUpdate) -> SettingsResponse:
    store = _store()
    updates = {}
    if body.default_source_language is not None:
        updates["default_source_language"] = body.default_source_language
    if body.default_target_language is not None:
        updates["default_target_language"] = body.default_target_language
    if updates:
        store.update_settings(updates)

    # Hot-reload API key and endpoint into the running settings singleton
    if body.dashscope_api_key:
        settings.dashscope_api_key = body.dashscope_api_key
    if body.dashscope_endpoint:
        settings.dashscope_endpoint = body.dashscope_endpoint

    return get_settings()
