from fastapi import APIRouter
from app.models import TranslateRequest, TranslateResponse
from app.services.qwen_mt import translate_texts

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate")
async def translate(body: TranslateRequest) -> TranslateResponse:
    results = await translate_texts(body.texts, body.target_lang)
    return TranslateResponse(translations=results)
