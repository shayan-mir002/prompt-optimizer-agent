"""
prompt_optimizer_cli.client
HTTP client for the Prompt Optimization Agent backend.

The CLI calls the backend's streaming optimization endpoint
(``POST /api/v1/optimize/run/stream``) and falls back to the standard
endpoint (``POST /api/v1/optimize/run``) when the backend does not expose the
streaming route. Both return the same ``OptimizeResponse`` JSON payload —
all optimization logic, token math and cost calculation stay on the backend.

All failure modes are mapped to user-friendly ``CliError`` exceptions so the
CLI never prints raw stack traces.
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, Optional

import httpx

from prompt_optimizer_cli.config import CliConfig

# ── Typed, user-friendly errors ───────────────────────────────────────────────

class CliError(Exception):
    """Base class for all errors shown to the user."""

    def __init__(self, message: str, exit_code: int = 1) -> None:
        super().__init__(message)
        self.exit_code = exit_code


class BackendUnavailableError(CliError):
    """The backend could not be reached (connection refused / DNS / timeout)."""


class RequestTimeoutError(CliError):
    """The request exceeded the configured timeout."""


class NetworkError(CliError):
    """A generic network failure while talking to the backend."""


class ApiError(CliError):
    """The backend answered with a non-2xx HTTP status."""

    def __init__(self, message: str, status_code: int, exit_code: int = 1) -> None:
        super().__init__(message, exit_code=exit_code)
        self.status_code = status_code


class InvalidPromptError(CliError):
    """The backend rejected the prompt (4xx validation)."""


class StreamClosedError(CliError):
    """The backend closed the stream before sending a complete result."""


# ── SSE event names ───────────────────────────────────────────────────────────

_PHASE_EVENT = "phase"
_DELTA_EVENT = "delta"
_COMPLETE_EVENT = "complete"
_ERROR_EVENT = "error"

_STREAM_PATH = "/api/v1/optimize/run/stream"
_RUN_PATH = "/api/v1/optimize/run"


def _detail_from_response(response: httpx.Response) -> str:
    """Best-effort extraction of a human-readable detail message."""
    # A streaming (SSE) response body is not read yet — read it before
    # inspecting .json()/.text to avoid httpx.ResponseNotRead.
    try:
        response.read()
    except Exception:
        pass
    try:
        data = response.json()
        if isinstance(data, dict):
            detail = data.get("detail")
            if detail is not None:
                return str(detail)
        return str(data)
    except Exception:
        text = (response.text or "").strip()
        return text[:300] if text else f"HTTP {response.status_code}"


class OptimizeClient:
    """Thin client for the backend's optimization endpoints."""

    def __init__(self, config: CliConfig) -> None:
        self._config = config
        self._timeout = httpx.Timeout(
            connect=15.0,
            read=config.timeout_seconds,
            write=30.0,
            pool=15.0,
        )

    # ── Public API ───────────────────────────────────────────────────────────

    def run(
        self,
        prompt: str,
        on_phase: Optional[Callable[[str], None]] = None,
        on_delta: Optional[Callable[[str], None]] = None,
    ) -> Dict[str, Any]:
        """Optimize *prompt* via the backend and return the result dict.

        Progress is reported through the optional callbacks. The returned dict
        is the backend's ``OptimizeResponse`` — never recalculated locally.
        """
        try:
            try:
                return self._run_stream(prompt, on_phase, on_delta)
            except ApiError as exc:
                # Older/alternative backend without the streaming route → fall
                # back to the standard single-response endpoint.
                if exc.status_code in (404, 405):
                    return self._run_plain(prompt)
                raise
        except httpx.TransportError as exc:
            raise self._map_network_error(exc) from None

    # ── Streaming endpoint ───────────────────────────────────────────────────

    def _run_stream(
        self,
        prompt: str,
        on_phase: Optional[Callable[[str], None]],
        on_delta: Optional[Callable[[str], None]],
    ) -> Dict[str, Any]:
        url = f"{self._config.api_url}{_STREAM_PATH}"
        payload = {"prompt": prompt}

        with httpx.Client(timeout=self._timeout) as client:
            with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    raise self._map_status_error(response)
                response.raise_for_status()
                return self._consume_sse(response, on_phase, on_delta)

    def _consume_sse(
        self,
        response: httpx.Response,
        on_phase: Optional[Callable[[str], None]],
        on_delta: Optional[Callable[[str], None]],
    ) -> Dict[str, Any]:
        for line in response.iter_lines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            raw = line[len("data:"):].strip()
            if not raw or raw == "[DONE]":
                continue

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = message.get("type")
            if event_type == _PHASE_EVENT:
                label = message.get("label")
                if label and on_phase:
                    on_phase(label)
            elif event_type == _DELTA_EVENT:
                text = message.get("text")
                if text and on_delta:
                    on_delta(text)
            elif event_type == _COMPLETE_EVENT:
                data = message.get("data")
                if isinstance(data, dict):
                    return data
                raise StreamClosedError(
                    "The backend returned an empty optimization result."
                )
            elif event_type == _ERROR_EVENT:
                message_text = message.get("message") or "Optimization failed."
                raise ApiError(message_text, status_code=500)

        raise StreamClosedError(
            "The backend closed the connection before the optimization finished. "
            "Try again — the provider may be rate-limited."
        )

    # ── Standard endpoint (fallback) ─────────────────────────────────────────

    def _run_plain(self, prompt: str) -> Dict[str, Any]:
        url = f"{self._config.api_url}{_RUN_PATH}"
        payload = {"prompt": prompt}

        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(url, json=payload)
            if response.status_code != 200:
                raise self._map_status_error(response)
            return response.json()

    # ── Error mapping ────────────────────────────────────────────────────────

    @staticmethod
    def _map_status_error(response: httpx.Response) -> CliError:
        status = response.status_code
        detail = _detail_from_response(response)

        if status in (400, 422):
            return InvalidPromptError(
                f"Invalid prompt ({status}): {detail}"
            )
        if status in (401, 403):
            return ApiError(
                f"Backend rejected the request ({status}) — check the backend's "
                f"API key configuration: {detail}",
                status_code=status,
            )
        if status in (404, 405):
            return ApiError(
                f"Optimization endpoint not found ({status}) — is this a "
                f"Prompt Optimization Agent backend? {detail}",
                status_code=status,
            )
        if status == 429:
            return ApiError(
                "The backend (AI provider) is rate-limited (429). "
                "Wait about a minute and try again.",
                status_code=status,
            )
        if 500 <= status < 600:
            return ApiError(
                f"Backend server error ({status}): {detail}",
                status_code=status,
            )
        return ApiError(
            f"Unexpected HTTP {status}: {detail}",
            status_code=status,
        )

    @staticmethod
    def _map_network_error(exc: httpx.TransportError) -> CliError:
        request = getattr(exc, "request", None)
        url = request.url if request is not None else "backend"

        if isinstance(exc, httpx.ConnectTimeout):
            return BackendUnavailableError(
                f"Cannot reach the backend at {url} (connection timed out). "
                "Is the server running?"
            )
        if isinstance(exc, httpx.ConnectError):
            return BackendUnavailableError(
                f"Cannot reach the backend at {url}. "
                "Is the server running and is PROMPT_OPTIMIZER_API_URL correct?"
            )
        if isinstance(exc, httpx.TimeoutException):
            return RequestTimeoutError(
                "The backend took too long to respond. It may be busy or "
                "rate-limited — try again in a minute."
            )
        return NetworkError(
            f"Network error while talking to {url}: {type(exc).__name__}"
        )
