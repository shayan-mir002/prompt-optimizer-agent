"""
prompt_optimizer_cli.config
Environment-driven configuration.

Only the FastAPI backend URL is needed — the CLI never talks to the AI
provider directly, so no API key is ever required here.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

# The backend runs on port 8080 by default (see the project's run command).
DEFAULT_API_URL = "http://localhost:8080"
DEFAULT_TIMEOUT_SECONDS = 600.0

ENV_API_URL = "PROMPT_OPTIMIZER_API_URL"
ENV_TIMEOUT = "PROMPT_OPTIMIZER_TIMEOUT"


@dataclass(frozen=True)
class CliConfig:
    """Resolved CLI settings."""

    api_url: str
    timeout_seconds: float


def load_config() -> CliConfig:
    """Build a CliConfig from environment variables, falling back to sane
    defaults. The backend URL is not hardcoded in the calling code paths —
    it comes from ``PROMPT_OPTIMIZER_API_URL`` when set."""
    url = os.environ.get(ENV_API_URL, "").strip().rstrip("/") or DEFAULT_API_URL

    timeout = DEFAULT_TIMEOUT_SECONDS
    raw_timeout = os.environ.get(ENV_TIMEOUT, "").strip()
    if raw_timeout:
        try:
            parsed = float(raw_timeout)
            if parsed > 0:
                timeout = parsed
        except ValueError:
            pass  # ignore malformed value, keep the default

    return CliConfig(api_url=url, timeout_seconds=timeout)
