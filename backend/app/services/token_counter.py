"""
app/services/token_counter.py
Token counting using tiktoken with cl100k_base encoding.
"""
import tiktoken
from app.core.logging import get_logger

logger = get_logger(__name__)

_ENCODING_NAME = "cl100k_base"


class TokenCounter:
    """
    Counts tokens in text strings using the cl100k_base encoding,
    which is compatible with GPT-4 / GPT-4o class models.
    """

    def __init__(self) -> None:
        try:
            self._enc = tiktoken.get_encoding(_ENCODING_NAME)
        except Exception as exc:
            logger.warning("tiktoken encoding load failed: %s — falling back to word estimate", exc)
            self._enc = None

    def count(self, text: str) -> int:
        """Return the number of tokens in *text*."""
        if not text:
            return 0
        if self._enc is not None:
            try:
                return len(self._enc.encode(text))
            except Exception:
                pass
        # Fallback: rough word-based estimate (1 token ≈ 0.75 words)
        return max(1, int(len(text.split()) / 0.75))

    def count_messages(self, messages: list) -> int:
        """Estimate token count for a list of chat messages."""
        total = 0
        for msg in messages:
            total += 4  # every message overhead
            total += self.count(msg.get("content", ""))
            total += self.count(msg.get("role", ""))
        total += 2  # reply priming
        return total
