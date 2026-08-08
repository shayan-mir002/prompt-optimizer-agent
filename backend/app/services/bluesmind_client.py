"""
app/services/bluesmind_client.py
Async HTTP client wrapping the BluesMind OpenAI-compatible Chat Completions API.
"""
from __future__ import annotations
import asyncio
import json
import httpx
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Transient status codes worth retrying (gateway timeouts, overload, rate limits)
_RETRYABLE_STATUS = {429, 500, 502, 503, 504}
_RETRY_ATTEMPTS = 4
_RETRY_BASE_DELAY = 3.0
_RETRY_MAX_DELAY = 20.0


@dataclass
class LLMResponse:
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


@dataclass
class LLMUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class BluesmindClient:
    """
    Thin async wrapper around the BluesMind Chat Completions endpoint.
    Reads credentials exclusively from Settings — nothing is hardcoded.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base_url = settings.API_BASE_URL.rstrip("/")
        self._model = settings.API_MODEL
        self._headers = {
            "Authorization": f"Bearer {settings.API_KEY}",
            "Content-Type": "application/json",
        }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> LLMResponse:
        """
        Call the chat completions endpoint and return content + token usage.
        Raises httpx.HTTPStatusError on non-2xx responses.
        """
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        url = f"{self._base_url}/chat/completions"
        logger.debug("POST %s  model=%s  messages=%d", url, self._model, len(messages))

        last_error: Optional[Exception] = None
        async with httpx.AsyncClient(timeout=180.0) as client:
            for attempt in range(1, _RETRY_ATTEMPTS + 1):
                try:
                    response = await client.post(url, json=payload, headers=self._headers)
                    if response.status_code not in _RETRYABLE_STATUS:
                        response.raise_for_status()
                        break
                    last_error = httpx.HTTPStatusError(
                        f"Server error {response.status_code}",
                        request=response.request,
                        response=response,
                    )
                except (httpx.HTTPStatusError, httpx.TransportError) as exc:
                    last_error = exc
                    status = getattr(getattr(exc, "response", None), "status_code", None)
                    if status is not None and status not in _RETRYABLE_STATUS:
                        raise

                if attempt < _RETRY_ATTEMPTS:
                    delay = min(_RETRY_BASE_DELAY * (2 ** (attempt - 1)), _RETRY_MAX_DELAY)
                    resp = getattr(last_error, "response", None)
                    reason = resp.status_code if resp is not None else type(last_error).__name__
                    logger.warning(
                        "LLM call attempt %d/%d failed (%s) — retrying in %.1fs",
                        attempt, _RETRY_ATTEMPTS, reason, delay,
                    )
                    await asyncio.sleep(delay)

        if last_error is not None:
            raise last_error

        data = response.json()

        choice = data["choices"][0]
        content: str = choice["message"]["content"]
        usage = data.get("usage", {})

        llm_response = LLMResponse(
            content=content,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )
        logger.debug(
            "LLM response received  prompt_tokens=%d  completion_tokens=%d",
            llm_response.prompt_tokens,
            llm_response.completion_tokens,
        )
        return llm_response

    async def stream_chat_completion(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[Tuple[str, Optional[LLMUsage]], None]:
        """
        Stream a chat completion as an async generator of (delta, usage) tuples.

        *delta* is the incremental text chunk (may be an empty string),
        *usage* is an LLMUsage instance delivered on the final metadata chunk
        (or None). Retries transient errors only while no content has been
        received yet — once streaming starts, failures propagate immediately so
        partial text is never duplicated.
        """
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "stream_options": {"include_usage": True},
        }

        url = f"{self._base_url}/chat/completions"
        logger.debug(
            "POST %s (stream)  model=%s  messages=%d", url, self._model, len(messages)
        )

        last_error: Optional[Exception] = None
        received_any = False

        timeout = httpx.Timeout(30.0, read=300.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(1, _RETRY_ATTEMPTS + 1):
                try:
                    async with client.stream(
                        "POST", url, json=payload, headers=self._headers
                    ) as response:
                        if response.status_code in _RETRYABLE_STATUS:
                            await response.aread()
                            raise httpx.HTTPStatusError(
                                f"Server error {response.status_code}",
                                request=response.request,
                                response=response,
                            )
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line.startswith("data:"):
                                continue
                            data = line[len("data:"):].strip()
                            if not data or data == "[DONE]":
                                continue
                            try:
                                chunk = json.loads(data)
                            except json.JSONDecodeError:
                                continue
                            choices = chunk.get("choices") or []
                            if choices:
                                delta = (choices[0].get("delta") or {})
                                content = delta.get("content")
                                if content:
                                    received_any = True
                                    yield content, None
                            usage = chunk.get("usage")
                            if usage:
                                yield "", LLMUsage(
                                    prompt_tokens=usage.get("prompt_tokens", 0),
                                    completion_tokens=usage.get("completion_tokens", 0),
                                    total_tokens=usage.get("total_tokens", 0),
                                )
                    return  # stream completed cleanly
                except (httpx.HTTPStatusError, httpx.TransportError) as exc:
                    last_error = exc
                    if received_any:
                        raise
                    status = getattr(getattr(exc, "response", None), "status_code", None)
                    if status is not None and status not in _RETRYABLE_STATUS:
                        raise
                    if attempt < _RETRY_ATTEMPTS:
                        delay = min(_RETRY_BASE_DELAY * (2 ** (attempt - 1)), _RETRY_MAX_DELAY)
                        reason = status if status is not None else type(exc).__name__
                        logger.warning(
                            "LLM stream attempt %d/%d failed (%s) — retrying in %.1fs",
                            attempt, _RETRY_ATTEMPTS, reason, delay,
                        )
                        await asyncio.sleep(delay)

        if last_error is not None:
            raise last_error
