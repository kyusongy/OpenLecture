from app.config import settings
from .base import TranscriptionProvider
from .qwen import QwenProvider

__all__ = ["TranscriptionProvider", "create_provider"]


def create_provider(source_lang: str) -> TranscriptionProvider:
    return QwenProvider(source_lang, settings.dashscope_api_key)
