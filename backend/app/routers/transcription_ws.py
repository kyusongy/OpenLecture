"""WebSocket endpoint for real-time transcription.

Translation is handled asynchronously via Qwen MT Lite -- only when enabled
at session start. Transcription results are sent immediately; translations
arrive as separate messages.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services.language_pairs import validate_source, validate_target
from app.services.qwen_mt import translate_texts
from app.services.transcription import TranscriptionProvider, create_provider

router = APIRouter(prefix="/api/transcription", tags=["transcription"])
logger = logging.getLogger(__name__)

CONFIG_TIMEOUT = 10  # seconds to wait for initial config message


@router.websocket("/stream")
async def transcription_stream(ws: WebSocket) -> None:
    await ws.accept()

    # 1) Wait for config message with language settings
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=CONFIG_TIMEOUT)
        config = json.loads(raw)
    except (asyncio.TimeoutError, json.JSONDecodeError, WebSocketDisconnect):
        await _close(ws, 4000, "Expected JSON config message")
        return

    if config.get("type") != "config":
        await _close(ws, 4001, "First message must be type 'config'")
        return

    source = config.get("source_language", "EN").upper()
    target = config.get("target_language", "ZH").upper()
    translation_enabled = config.get("translation_enabled", True)

    # 2) Check API key is configured
    if not settings.dashscope_api_key:
        await _close(ws, 4003, "DashScope API key not configured")
        return

    # 3) Validate source language
    if not validate_source(source):
        await _close(ws, 4004, f"Unsupported source language: {source}")
        return

    # 4) Validate translation target if enabled
    if translation_enabled and not validate_target(target):
        await _close(ws, 4004, f"Unsupported translation target: {target}")
        return

    logger.info(
        "transcription ws: source=%s, translate=%s",
        source,
        f"{source}->{target}" if translation_enabled else "OFF",
    )

    # 5) Start ASR session via configured provider
    session = create_provider(source)
    try:
        await session.start()
    except ConnectionError as e:
        logger.error("failed to start transcription session: %s", e)
        await _close(ws, 4005, str(e))
        return
    except Exception:
        logger.exception("failed to start transcription session")
        await _close(ws, 4005, "Transcription service unavailable")
        return

    await ws.send_json({"type": "connected"})

    # 6) Run receive + send loops concurrently
    translation_tasks: set[asyncio.Task] = set()
    recv_task = asyncio.create_task(_recv_loop(ws, session))
    send_task = asyncio.create_task(
        _send_loop(ws, session, translation_enabled, target, translation_tasks)
    )

    try:
        done, pending = await asyncio.wait(
            [recv_task, send_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for t in pending:
            t.cancel()
        for t in done:
            if t.exception():
                raise t.exception()
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        logger.exception("transcription ws error")
    finally:
        for t in translation_tasks:
            t.cancel()
        await session.stop()
        recv_task.cancel()
        send_task.cancel()


async def _recv_loop(ws: WebSocket, session: TranscriptionProvider) -> None:
    """Read audio frames from the client and forward to the ASR provider."""
    while True:
        msg = await ws.receive()
        if msg["type"] == "websocket.disconnect":
            break
        if "bytes" in msg and msg["bytes"]:
            await session.send_audio(msg["bytes"])
        elif "text" in msg and msg["text"]:
            try:
                data = json.loads(msg["text"])
            except json.JSONDecodeError:
                logger.warning("ignoring malformed JSON from client")
                continue
            if data.get("type") == "stop":
                break


INTERIM_TRANSLATE_DELAY = 3.0  # seconds into a sentence before first interim translate
INTERIM_TRANSLATE_INTERVAL = 3.0  # seconds between subsequent interim translates
INTERIM_MIN_WORDS = 3  # space-separated tokens
INTERIM_MIN_CHARS = 8  # fallback for CJK (no spaces between words)


def _spawn_translate(
    tasks: set[asyncio.Task], ws: WebSocket, text: str, sid: str, target: str
) -> None:
    task = asyncio.create_task(_translate_and_send(ws, text, sid, target))
    tasks.add(task)
    task.add_done_callback(tasks.discard)


async def _send_loop(
    ws: WebSocket,
    session: TranscriptionProvider,
    translation_enabled: bool,
    target_lang: str,
    translation_tasks: set[asyncio.Task],
) -> None:
    """Forward transcription results and spawn translation tasks.

    Per-sentence interim translation: resets when a new sentence starts,
    first fires after INTERIM_TRANSLATE_DELAY, then every INTERVAL.
    """
    loop = asyncio.get_running_loop()
    sentence_start: float = 0
    last_interim_time: float = 0
    last_interim_text: str = ""
    current_sid: str = ""

    async for result in session.results():
        await ws.send_json(result)

        if not translation_enabled or not result.get("text"):
            continue

        sid = result.get("sentenceId", "")
        text = result["text"]
        now = loop.time()

        if result.get("isFinal"):
            _spawn_translate(translation_tasks, ws, text, sid, target_lang)
            sentence_start = 0
            last_interim_time = 0
            last_interim_text = ""
            current_sid = ""
        else:
            if sid != current_sid:
                current_sid = sid
                sentence_start = now
                last_interim_time = 0
                last_interim_text = ""

            sentence_age = now - sentence_start
            since_last = now - last_interim_time if last_interim_time else sentence_age

            long_enough = (
                len(text.split()) >= INTERIM_MIN_WORDS or len(text) >= INTERIM_MIN_CHARS
            )
            if (
                long_enough
                and sentence_age >= INTERIM_TRANSLATE_DELAY
                and since_last >= INTERIM_TRANSLATE_INTERVAL
                and text != last_interim_text
            ):
                last_interim_time = now
                last_interim_text = text
                _spawn_translate(translation_tasks, ws, text, sid, target_lang)


async def _translate_and_send(
    ws: WebSocket,
    text: str,
    sentence_id: str,
    target_lang: str,
) -> None:
    """Translate a single sentence and send result via WebSocket."""
    try:
        results = await translate_texts([text], target_lang)
        if results and results[0]:
            await ws.send_json(
                {
                    "type": "translation",
                    "sentenceId": sentence_id,
                    "translatedText": results[0],
                }
            )
    except Exception:
        logger.warning("translation failed for sentence %s", sentence_id, exc_info=True)


async def _close(ws: WebSocket, code: int, reason: str) -> None:
    try:
        await ws.send_json({"type": "error", "message": reason})
        await ws.close(code, reason)
    except Exception:
        pass
