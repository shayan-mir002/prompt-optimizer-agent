"""
app/services/skill_manager.py
Loads all prompt engineering framework Markdown files at startup and
provides lookup/query methods. No framework is ever hardcoded.

Each skill is a `.md` file with a fixed structure:

    # <Name>
    > <Full Name>
    ## Metadata        (ID, Name, Full Name, Complexity, Best For)
    ## Description
    ## Template       (fenced code block)
    ## Variables      (markdown table: Name | Description | Required)
    ## Example        (fenced code block)
    ## When to Use
"""
from __future__ import annotations
import re
from pathlib import Path
from typing import Dict, List, Optional

from app.core.logging import get_logger

logger = get_logger(__name__)

_META_RE = re.compile(
    r"^\s*(?:-\s+)?\*\*(?P<key>[^*:]+?):?\*\*:?\s*(?P<value>.*)$"
)


class SkillModel:
    """Lightweight wrapper around a single skill JSON file."""

    __slots__ = (
        "id", "name", "full_name", "description",
        "complexity", "best_for", "template",
        "variables", "example", "when_to_use",
    )

    def __init__(self, data: dict) -> None:
        self.id: str = data["id"]
        self.name: str = data["name"]
        self.full_name: str = data.get("full_name", data["name"])
        self.description: str = data.get("description", "")
        self.complexity: str = data.get("complexity", "moderate")
        self.best_for: List[str] = data.get("best_for", [])
        self.template: str = data.get("template", "")
        self.variables: List[dict] = data.get("variables", [])
        self.example: str = data.get("example", "")
        self.when_to_use: str = data.get("when_to_use", "")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "full_name": self.full_name,
            "description": self.description,
            "complexity": self.complexity,
            "best_for": self.best_for,
            "template": self.template,
            "variables": self.variables,
            "example": self.example,
            "when_to_use": self.when_to_use,
        }

    def summary_for_llm(self) -> str:
        """A compact text representation sent to the LLM for selection."""
        best_for_str = ", ".join(self.best_for)
        return (
            f"ID: {self.id} | Name: {self.name} ({self.full_name})\n"
            f"Complexity: {self.complexity} | Best for: {best_for_str}\n"
            f"When to use: {self.when_to_use}"
        )


class SkillManager:
    """
    Scans *skills_dir* for *.md files at startup and keeps them in memory.
    Thread-safe for reads (no mutation after init).
    """

    def __init__(self, skills_dir: str) -> None:
        self._dir = Path(skills_dir)
        self._skills: Dict[str, SkillModel] = {}
        self._load()

    def _load(self) -> None:
        if not self._dir.exists():
            logger.error("Skills directory not found: %s", self._dir)
            return

        for path in sorted(self._dir.glob("*.md")):
            try:
                with open(path, encoding="utf-8") as fh:
                    text = fh.read()
                data = self._parse_markdown(text)
                if data is None:
                    logger.warning("Skipped skill %s: missing required fields", path.name)
                    continue
                skill = SkillModel(data)
                self._skills[skill.id] = skill
                logger.info("Loaded skill: %s (%s)", skill.id, skill.name)
            except Exception as exc:
                logger.warning("Failed to load skill %s: %s", path.name, exc)

        logger.info("SkillManager: %d skills loaded", len(self._skills))

    # ── Markdown parsing ──────────────────────────────────────────────────────

    @staticmethod
    def _split_sections(text: str) -> Dict[str, str]:
        """Split a markdown document into `## Section -> body` chunks."""
        sections: Dict[str, str] = {}
        current: Optional[str] = None
        buffer: List[str] = []
        for line in text.splitlines():
            if line.startswith("## "):
                if current is not None:
                    sections[current] = "\n".join(buffer).strip()
                current = line[3:].strip()
                buffer = []
            elif current is not None:
                buffer.append(line)
        if current is not None:
            sections[current] = "\n".join(buffer).strip()
        return sections

    @staticmethod
    def _strip_fence(body: str) -> str:
        """Remove the ```lang ... ``` wrapper from a fenced code block body."""
        body = body.strip()
        lines = body.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()

    @staticmethod
    def _parse_table(body: str) -> List[dict]:
        """Parse a `| Name | Description | Required |` markdown table."""
        rows: List[dict] = []
        for raw in body.splitlines():
            line = raw.strip()
            if not line.startswith("|") or not line.endswith("|"):
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            if len(cells) != 3:
                continue
            name, desc, req = cells
            if name.lower() == "name":
                continue
            if not name or all(ch in "-: " for ch in name):
                continue
            rows.append(
                {"name": name, "description": desc, "required": req.lower() == "yes"}
            )
        return rows

    @staticmethod
    def _clean_text(body: str) -> str:
        """Collapse runs of blank lines to a single blank line."""
        return re.sub(r"\n{3,}", "\n\n", body.strip())

    @classmethod
    def _parse_markdown(cls, text: str) -> Optional[dict]:
        """Rebuild the skill dict (same shape as the old JSON) from a .md file."""
        sections = cls._split_sections(text)
        meta = sections.get("Metadata", "")

        data: dict = {}
        for line in meta.splitlines():
            m = _META_RE.match(line.strip())
            if not m:
                continue
            key = m.group("key").strip().lower().replace(" ", "_")
            value = m.group("value").strip()
            if key in ("id", "name", "full_name", "complexity"):
                data[key] = value
            elif key == "best_for":
                data["best_for"] = [x.strip() for x in value.split(",") if x.strip()]

        if "id" not in data or "name" not in data:
            return None

        data.setdefault("best_for", [])
        data.setdefault("full_name", data["name"])
        data.setdefault("complexity", "moderate")
        data["description"] = cls._clean_text(sections.get("Description", ""))
        data["template"] = cls._strip_fence(sections.get("Template", ""))
        data["variables"] = cls._parse_table(sections.get("Variables", ""))
        data["example"] = cls._strip_fence(sections.get("Example", ""))
        data["when_to_use"] = cls._clean_text(sections.get("When to Use", ""))
        return data

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_all(self) -> List[SkillModel]:
        return list(self._skills.values())

    def get_by_id(self, skill_id: str) -> Optional[SkillModel]:
        return self._skills.get(skill_id)

    def all_summaries_for_llm(self) -> str:
        """Concatenated summaries of every skill, used in LLM prompts."""
        return "\n\n".join(s.summary_for_llm() for s in self._skills.values())

    def compact_list_for_llm(self) -> str:
        """A compact, low-token list (id + name + one-liner) of every skill.
        Keeps the selector input small instead of sending full templates."""
        lines = []
        for s in self._skills.values():
            hint = s.when_to_use or s.complexity
            lines.append(f"- {s.id}: {s.name} ({s.full_name}) — {hint}")
        return "\n".join(lines)

    @property
    def count(self) -> int:
        return len(self._skills)
