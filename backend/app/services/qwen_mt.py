import asyncio
import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ENDPOINT_PATH = "/compatible-mode/v1/chat/completions"
MODEL = "qwen-mt-lite"

# Language code mapping
LANG_MAP = {
    "ZH": "Chinese",
    "EN": "English",
    "JA": "Japanese",
    "KO": "Korean",
    "FR": "French",
    "DE": "German",
    "ES": "Spanish",
    "PT": "Portuguese",
    "RU": "Russian",
    "AR": "Arabic",
}

# Concurrency limit for API calls
_semaphore = asyncio.Semaphore(3)
_DELIMITER_RE = re.compile(r"\[(\d+)\]")


def _map_lang(code: str) -> str:
    return LANG_MAP.get(code.upper(), code)


async def _translate_one(client: httpx.AsyncClient, text: str, target_lang: str) -> str:
    """Single text translation with semaphore + retry on 429."""
    async with _semaphore:
        for attempt in range(4):
            try:
                resp = await client.post(
                    f"{settings.dashscope_http_base}{ENDPOINT_PATH}",
                    headers={
                        "Authorization": f"Bearer {settings.dashscope_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": MODEL,
                        "messages": [{"role": "user", "content": text}],
                        "translation_options": {
                            "source_lang": "auto",
                            "target_lang": _map_lang(target_lang),
                        },
                    },
                )
                if resp.status_code == 429:
                    wait = 2**attempt
                    logger.warning(
                        f"Qwen MT 429, retrying in {wait}s (attempt {attempt + 1})"
                    )
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError:
                raise
            except Exception as e:
                if attempt == 3:
                    raise
                logger.warning(f"Qwen MT error, retrying: {e}")
                await asyncio.sleep(2**attempt)
    raise RuntimeError("Qwen MT: max retries exceeded")


def _build_batches(
    texts: list[str], max_items: int = 10, max_words: int = 1000
) -> list[list[int]]:
    """Group text indices into batches by item count and word count."""
    batches: list[list[int]] = []
    batch: list[int] = []
    words = 0
    for i, t in enumerate(texts):
        w = len(t.split())
        if batch and (len(batch) >= max_items or words + w > max_words):
            batches.append(batch)
            batch = []
            words = 0
        batch.append(i)
        words += w
    if batch:
        batches.append(batch)
    return batches


def _join_batch(texts: list[str], indices: list[int]) -> str:
    """Join texts with numbered delimiters: [1]\ntext\n\n[2]\ntext..."""
    parts = []
    for n, idx in enumerate(indices, 1):
        parts.append(f"[{n}]\n{texts[idx]}")
    return "\n\n".join(parts)


def _parse_batch(response: str, count: int) -> list[str] | None:
    """Parse delimiter-tagged response back into individual translations."""
    # Try regex-based splitting on [1], [2], etc.
    splits = _DELIMITER_RE.split(response)
    # splits looks like: ['', '1', 'text1', '2', 'text2', ...]
    if len(splits) >= count * 2 + 1:
        results = {}
        for i in range(1, len(splits) - 1, 2):
            num = int(splits[i])
            text = splits[i + 1].strip()
            results[num] = text
        if len(results) == count:
            return [results[n] for n in range(1, count + 1)]

    # Fallback: double-newline positional split
    chunks = [c.strip() for c in response.split("\n\n") if c.strip()]
    # Strip any leading [N] from chunks
    cleaned = []
    for c in chunks:
        m = re.match(r"^\[\d+\]\s*", c)
        cleaned.append(c[m.end() :] if m else c)
    if len(cleaned) == count:
        return cleaned

    return None


async def translate_texts(texts: list[str], target_lang: str = "ZH") -> list[str]:
    """Translate texts using delimiter-based batching to reduce API calls."""
    if not texts:
        return []

    results: list[str | None] = [None] * len(texts)
    batches = _build_batches(texts)

    async with httpx.AsyncClient(timeout=60) as client:

        async def _process_batch(indices: list[int]):
            if len(indices) == 1:
                results[indices[0]] = await _translate_one(
                    client, texts[indices[0]], target_lang
                )
                return

            batch_text = _join_batch(texts, indices)
            try:
                raw = await _translate_one(client, batch_text, target_lang)
                parsed = _parse_batch(raw, len(indices))
                if parsed:
                    for idx, translation in zip(indices, parsed):
                        results[idx] = translation
                    return
                logger.warning(
                    f"Batch parse failed ({len(indices)} items), falling back to individual"
                )
            except Exception:
                logger.warning(
                    "Batch translation failed, falling back to individual",
                    exc_info=True,
                )

            # Individual fallback — concurrent (semaphore limits to 3)
            async def _fallback(idx):
                results[idx] = await _translate_one(client, texts[idx], target_lang)

            await asyncio.gather(*[_fallback(idx) for idx in indices])

        await asyncio.gather(*[_process_batch(b) for b in batches])

    return results  # type: ignore[return-value]
