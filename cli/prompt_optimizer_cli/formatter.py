"""
prompt_optimizer_cli.formatter
Builds the professional terminal report from the backend's ``OptimizeResponse``.

Every number printed here is read directly from the backend JSON payload —
the CLI never recomputes token counts, costs or reductions. Values are
tagged so it is always clear which are measured by the backend (actual) and
which are projections (estimated).
"""

from __future__ import annotations

from io import StringIO
from typing import Any, Dict, List, Optional

from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

from prompt_optimizer_cli.client import InvalidPromptError

# ── Formatting helpers ─────────────────────────────────────────────────────────

_TAG_ACTUAL = "[green]• actual[/green]"
_TAG_ESTIMATED = "[yellow]~ estimated[/yellow]"

_LEGEND = (
    "Legend: " + _TAG_ACTUAL + " = measured by the backend LLM · "
    + _TAG_ESTIMATED + " = calculated projection"
)


def _tokens(value: Any) -> str:
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return str(value)


def _money(value: Any) -> str:
    try:
        return f"${float(value):,.4f}"
    except (TypeError, ValueError):
        return str(value)


def _pct(value: Any) -> str:
    try:
        return f"{float(value):.2f}%"
    except (TypeError, ValueError):
        return str(value)


def _score(value: Any) -> str:
    try:
        return f"{float(value):.1f}"
    except (TypeError, ValueError):
        return str(value)


def _tagged_row(table: Table, label: str, value: str, tag: str) -> None:
    """Add a row whose value carries an actual/estimated tag."""
    cell = Text(value)
    if tag == "estimated":
        cell.stylize("yellow")
        marker = "~"
    else:
        cell.stylize("green")
        marker = "•"
    table.add_row(label, cell, marker + " " + ("estimated" if tag == "estimated" else "actual"))


def _sub_header(console: Console, title: str) -> None:
    console.print(Rule(style="dim"))
    console.print(Text(title.upper(), style="bold cyan"))


# ── Report sections ────────────────────────────────────────────────────────────

def _section_analysis(console: Console, result: Dict[str, Any]) -> None:
    analysis = result.get("analysis")
    if not isinstance(analysis, dict):
        return
    _sub_header(console, "PROMPT ANALYSIS")

    table = Table.grid(padding=(0, 2))
    table.add_row("Intent", str(analysis.get("intent", "—")))
    table.add_row("Prompt type", str(analysis.get("prompt_type", "—")))
    table.add_row("Complexity", str(analysis.get("complexity", "—")))
    table.add_row("Ambiguity level", str(analysis.get("ambiguity_level", "—")))
    table.add_row("Quality score", _score(analysis.get("quality_score")) + " / 10", _TAG_ACTUAL)
    table.add_row(
        "Completeness score",
        _score(analysis.get("completeness_score")) + " %",
        _TAG_ACTUAL,
    )

    missing = analysis.get("missing_information")
    if isinstance(missing, list) and missing:
        table.add_row(
            "Missing information",
            Text(", ".join(str(item) for item in missing)),
        )
    console.print(table)


def _section_skill(console: Console, result: Dict[str, Any]) -> None:
    skill = result.get("skill")
    if not isinstance(skill, dict):
        return
    _sub_header(console, "SELECTED SKILL")

    table = Table.grid(padding=(0, 2))
    name = skill.get("name", "")
    full_name = skill.get("full_name", "")
    table.add_row("Skill", f"{name}" + (f" — {full_name}" if full_name and full_name != name else ""))
    reason = skill.get("reason")
    if reason:
        table.add_row("Reason", str(reason))
    table.add_row(
        "Skill selection tokens",
        _tokens(skill.get("tokens_used")) + " tokens",
        _TAG_ACTUAL,
    )
    console.print(table)


def _section_optimized_prompt(console: Console, result: Dict[str, Any]) -> None:
    optimized = result.get("optimized_prompt")
    if not isinstance(optimized, dict):
        return
    _sub_header(console, "OPTIMIZED PROMPT")

    text = str(optimized.get("text", ""))
    console.print(Panel(text, border_style="green", expand=False))

    meta = Table.grid(padding=(0, 2))
    meta.add_row(
        "Optimized prompt tokens",
        _tokens(optimized.get("tokens")) + " tokens",
        _TAG_ACTUAL,
    )
    meta.add_row(
        "Optimization LLM tokens used",
        _tokens(optimized.get("optimization_tokens_used")) + " tokens",
        _TAG_ACTUAL,
    )
    console.print(meta)


def _section_manual(console: Console, result: Dict[str, Any]) -> None:
    manual = result.get("manual_projection")
    if not isinstance(manual, dict):
        return
    _sub_header(console, "MANUAL WORKFLOW SIMULATION")

    table = Table.grid(padding=(0, 2))
    _tagged_row(table, "Raw prompt tokens", _tokens(manual.get("raw_prompt_tokens")) + " tokens", "actual")
    _tagged_row(table, "Decision-making tokens", _tokens(manual.get("decision_making_tokens")) + " tokens", "actual")
    _tagged_row(table, "Question generation tokens", _tokens(manual.get("question_generation_tokens")) + " tokens", "actual")
    _tagged_row(table, "Estimated answer tokens", _tokens(manual.get("estimated_answer_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Estimated answer analysis tokens", _tokens(manual.get("estimated_answer_analysis_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Estimated execution tokens", _tokens(manual.get("estimated_execution_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Total estimated manual tokens", _tokens(manual.get("total_estimated_manual_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Estimated manual cost", _money(manual.get("estimated_manual_cost")), "estimated")
    console.print(table)


def _section_optimizer(console: Console, result: Dict[str, Any]) -> None:
    analytics = result.get("optimizer_analytics")
    if not isinstance(analytics, dict):
        return
    _sub_header(console, "OPTIMIZER WORKFLOW")

    steps = [
        ("Raw Prompt", _tokens(analytics.get("raw_prompt_tokens")) + " tokens", "actual"),
        ("Skill Selection", _tokens(analytics.get("skill_selection_tokens")) + " tokens", "actual"),
        ("Prompt Optimization", _tokens(analytics.get("optimization_tokens")) + " tokens", "actual"),
        ("Optimized Prompt", _tokens(analytics.get("optimized_prompt_tokens")) + " tokens", "actual"),
        ("Estimated Execution", _tokens(analytics.get("estimated_execution_tokens")) + " tokens", "estimated"),
    ]

    for index, (name, value, tag) in enumerate(steps):
        line = Text()
        line.append(f"{name}: ", style="bold cyan")
        cell = Text(value)
        cell.stylize("yellow" if tag == "estimated" else "green")
        line.append_text(cell)
        line.append(
            "   " + ("~" if tag == "estimated" else "•") + " "
            + ("estimated" if tag == "estimated" else "actual"),
            style="dim",
        )
        console.print(line)
        if index < len(steps) - 1:
            console.print(Text("    ↓", style="dim"))


def _section_execution(console: Console, result: Dict[str, Any]) -> None:
    forecast = result.get("execution_estimation")
    if not isinstance(forecast, dict):
        return
    _sub_header(console, "EXECUTION FORECAST")

    table = Table.grid(padding=(0, 2))
    _tagged_row(table, "Input tokens", _tokens(forecast.get("input_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Estimated output tokens", _tokens(forecast.get("estimated_output_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Total estimated tokens", _tokens(forecast.get("total_estimated_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Estimated input cost", _money(forecast.get("estimated_input_cost")), "estimated")
    _tagged_row(table, "Estimated output cost", _money(forecast.get("estimated_output_cost")), "estimated")
    _tagged_row(table, "Estimated total cost", _money(forecast.get("estimated_total_cost")), "estimated")
    console.print(table)


def _section_comparison(console: Console, result: Dict[str, Any]) -> None:
    comparison = result.get("comparison")
    if not isinstance(comparison, dict):
        return
    _sub_header(console, "TOKEN COMPARISON")

    table = Table.grid(padding=(0, 2))
    _tagged_row(table, "Manual workflow tokens", _tokens(comparison.get("manual_tokens")) + " tokens", "estimated")
    _tagged_row(table, "Optimizer workflow tokens", _tokens(comparison.get("optimizer_tokens")) + " tokens", "actual")
    _tagged_row(table, "Tokens saved", _tokens(comparison.get("tokens_saved")) + " tokens", "estimated")
    _tagged_row(table, "Reduction", _pct(comparison.get("percentage_reduction")), "estimated")
    _tagged_row(table, "Estimated cost saved", _money(comparison.get("estimated_cost_saved")), "estimated")
    console.print(table)


def _section_cost(console: Console, result: Dict[str, Any]) -> None:
    comparison = result.get("comparison")
    manual = result.get("manual_projection")
    analytics = result.get("optimizer_analytics")
    if not isinstance(comparison, dict) or not isinstance(manual, dict):
        return
    _sub_header(console, "COST ANALYSIS")

    table = Table.grid(padding=(0, 2))
    _tagged_row(table, "Manual workflow cost", _money(manual.get("estimated_manual_cost")), "estimated")
    _tagged_row(table, "Optimizer workflow cost", _money(comparison.get("optimizer_cost")), "estimated")
    _tagged_row(table, "Estimated execution cost", _money(analytics.get("estimated_execution_cost")), "estimated")
    _tagged_row(table, "Estimated cost saved", _money(comparison.get("estimated_cost_saved")), "estimated")

    manual_cost = float(comparison.get("manual_cost") or 0)
    optimizer_cost = float(comparison.get("optimizer_cost") or 0)
    if manual_cost > 0:
        saving_pct = (1 - (optimizer_cost / manual_cost)) * 100
        _tagged_row(table, "Cost saving", f"{saving_pct:.1f}%", "estimated")
    console.print(table)


# ── Top-level entry ────────────────────────────────────────────────────────────

def render_report(result: Dict[str, Any]) -> str:
    """Render the full terminal report for a backend ``OptimizeResponse``.

    Returns plain text (Rich styling is auto-disabled when the output is not a
    terminal), so it is safe to redirect to a file or pipe.
    """
    stream = StringIO()
    console = Console(file=stream, force_terminal=False)

    validation = result.get("validation") or {}
    if validation.get("is_valid") is False:
        errors = validation.get("errors") or []
        message = (
            "The backend rejected this prompt as invalid:\n"
            + "\n".join(f"  - {err}" for err in errors)
            if errors else
            "The backend rejected this prompt as invalid."
        )
        raise InvalidPromptError(message)

    console.print(Rule(style="bold"))
    console.print(Text("PROMPT OPTIMIZATION REPORT", style="bold white"), justify="center")
    console.print(_LEGEND, style="dim", justify="center")
    console.print(Rule(style="bold"))

    _section_analysis(console, result)
    _section_skill(console, result)
    _section_optimized_prompt(console, result)
    _section_manual(console, result)
    _section_optimizer(console, result)
    _section_execution(console, result)
    _section_comparison(console, result)
    _section_cost(console, result)

    console.print()
    console.print(
        Text(
            "Cost and execution figures are estimates produced by the backend "
            "token model; token counts are measured during the optimization run.",
            style="dim",
        )
    )

    return stream.getvalue()
