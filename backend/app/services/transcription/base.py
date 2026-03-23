"""Base class for transcription providers."""

import asyncio
import logging
import time
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

import websockets

logger = logging.getLogger(__name__)


class TranscriptionProvider(ABC):
    """Streams audio to a speech-to-text service and yields results.

    Output contract — each yielded dict is one of:
      {"type": "transcript", "text": str, "isFinal": bool,
       "sentenceId": str, "timestampMs": int}
      {"type": "error", "message": str}
    """

    def __init__(self) -> None:
        self._ws: websockets.ClientConnection | None = None
        self._queue: asyncio.Queue[dict | None] = asyncio.Queue(maxsize=500)
        self._recv_task: asyncio.Task | None = None
        self._start_time: float = 0
        self._sentence_id: int = 0

    def _elapsed_ms(self) -> int:
        return int((time.monotonic() - self._start_time) * 1000)

    def _put(self, item: dict | None) -> None:
        try:
            self._queue.put_nowait(item)
        except asyncio.QueueFull:
            logger.warning("transcript queue full, dropping event")

    async def results(self) -> AsyncGenerator[dict, None]:
        while True:
            item = await self._queue.get()
            if item is None:
                break
            yield item

    @abstractmethod
    async def start(self) -> None:
        """Open connection to the upstream ASR service."""

    @abstractmethod
    async def send_audio(self, data: bytes) -> None:
        """Forward a chunk of PCM16/16kHz audio."""

    @abstractmethod
    async def _receive_loop(self) -> None:
        """Read events from upstream and push to queue. Must put None on exit."""

    @abstractmethod
    async def _close_upstream(self) -> None:
        """Send provider-specific close/terminate message."""

    async def stop(self) -> None:
        if self._ws:
            try:
                await self._close_upstream()
                await self._ws.close()
            except Exception:
                logger.exception("error closing upstream ws")
        if self._recv_task:
            self._recv_task.cancel()
            try:
                await self._recv_task
            except asyncio.CancelledError:
                pass
        # Safety net: ensure results() terminates even if _receive_loop
        # didn't run or was cancelled before its finally block
        self._put(None)
