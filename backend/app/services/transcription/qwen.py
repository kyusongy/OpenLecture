"""Qwen3 ASR Flash Realtime transcription provider."""

import asyncio
import base64
import json
import logging
import time

import websockets

from app.config import settings
from .base import TranscriptionProvider

logger = logging.getLogger(__name__)

WS_URL_PATH = "/api-ws/v1/realtime"
MODEL = "qwen3-asr-flash-realtime"


class QwenProvider(TranscriptionProvider):
    def __init__(self, source_lang: str, api_key: str):
        super().__init__()
        self._source_lang = source_lang.lower()
        self._api_key = api_key
        self._speech_start_ms: int = 0

    async def start(self) -> None:
        url = f"{settings.dashscope_ws_base}{WS_URL_PATH}?model={MODEL}"
        try:
            self._ws = await websockets.connect(
                url,
                additional_headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "OpenAI-Beta": "realtime=v1",
                },
            )
        except websockets.InvalidStatus as e:
            raise ConnectionError(
                f"Qwen ASR rejected connection: {e.response.status_code}"
            ) from e
        self._start_time = time.monotonic()

        await self._ws.send(
            json.dumps(
                {
                    "event_id": "cfg_001",
                    "type": "session.update",
                    "session": {
                        "modalities": ["text"],
                        "input_audio_format": "pcm",
                        "sample_rate": 16000,
                        "input_audio_transcription": {"language": self._source_lang},
                        "turn_detection": {
                            "type": "server_vad",
                            "threshold": 0.0,
                            "silence_duration_ms": 400,
                        },
                    },
                }
            )
        )

        self._recv_task = asyncio.create_task(self._receive_loop())
        logger.info("qwen asr started: lang=%s", self._source_lang)

    async def _receive_loop(self) -> None:
        try:
            async for raw in self._ws:
                try:
                    event = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    continue

                etype = event.get("type", "")

                if etype == "input_audio_buffer.speech_started":
                    self._speech_start_ms = self._elapsed_ms()

                elif etype == "conversation.item.input_audio_transcription.text":
                    text = event.get("text", "") or event.get("stash", "")
                    if text:
                        self._put(
                            {
                                "type": "transcript",
                                "text": text,
                                "isFinal": False,
                                "sentenceId": str(self._sentence_id),
                                "timestampMs": self._speech_start_ms
                                or self._elapsed_ms(),
                            }
                        )

                elif etype == "conversation.item.input_audio_transcription.completed":
                    text = event.get("transcript", "")
                    if text:
                        self._put(
                            {
                                "type": "transcript",
                                "text": text,
                                "isFinal": True,
                                "sentenceId": str(self._sentence_id),
                                "timestampMs": self._speech_start_ms
                                or self._elapsed_ms(),
                            }
                        )
                        self._sentence_id += 1

                elif etype == "error":
                    msg = event.get("error", {}).get("message", str(event))
                    logger.error("qwen asr error: %s", msg)
                    self._put({"type": "error", "message": msg})

        except websockets.ConnectionClosed:
            logger.debug("qwen asr ws closed")
        except Exception:
            logger.exception("qwen asr receive loop error")
        finally:
            self._put(None)

    async def send_audio(self, data: bytes) -> None:
        if self._ws:
            b64 = base64.b64encode(data).decode("ascii")
            try:
                await self._ws.send(
                    json.dumps(
                        {
                            "type": "input_audio_buffer.append",
                            "audio": b64,
                        }
                    )
                )
            except websockets.ConnectionClosed:
                pass

    async def _close_upstream(self) -> None:
        await self._ws.send(
            json.dumps(
                {
                    "type": "session.finish",
                    "event_id": "fin_001",
                }
            )
        )
