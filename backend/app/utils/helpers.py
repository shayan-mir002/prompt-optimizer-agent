"""
app/utils/helpers.py
Shared utilities: JSON extraction from LLM responses.
"""
import json
import re
from typing import Any


def extract_json(text: str) -> Any:
    """
    Extract and parse a JSON object or array from an LLM response.

    Handles:
    - Plain JSON
    - JSON wrapped in ```json ... ``` markdown code blocks
    - JSON wrapped in ``` ... ``` code blocks
    """
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    patterns = [
        r"```json\s*([\s\S]*?)\s*```",
        r"```\s*([\s\S]*?)\s*```",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                continue

    # Last resort: find first { ... } or [ ... ] block
    for opener, closer in [('{', '}'), ('[', ']')]:
        start = text.find(opener)
        end = text.rfind(closer)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not extract JSON from LLM response: {text[:200]}")


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert a value to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert a value to int."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def extract_int(text: str, default: int = 0) -> int:
    """
    Extract the first integer found in an LLM response.
    Tolerates plain integers, JSON, and prose such as "3 questions".
    """
    if not text:
        return default
    # Try parsing the whole text as JSON first (covers bare integers)
    try:
        return safe_int(json.loads(text.strip()), default)
    except json.JSONDecodeError:
        pass
    # Fall back to the first integer found anywhere in the text
    match = re.search(r"-?\d+", text)
    if match:
        return safe_int(match.group(0), default)
    return default
