"""
prompt_optimizer_cli.main
Typer entry point for the ``prompt-optimizer`` command.

Usage:
    prompt-optimizer "your prompt here"
    prompt-optimizer                  # interactive mode
    prompt-optimizer --help
    prompt-optimizer --version

Configuration comes from environment variables (PROMPT_OPTIMIZER_API_URL,
PROMPT_OPTIMIZER_TIMEOUT). Progress is streamed to stderr so the final report
(stdout) stays clean and can be redirected or piped.
"""

from __future__ import annotations

import sys
from typing import Optional

import typer

from prompt_optimizer_cli import __version__
from prompt_optimizer_cli.client import (
    CliError,
    OptimizeClient,
)
from prompt_optimizer_cli.config import load_config
from prompt_optimizer_cli.formatter import render_report

# Windows consoles default to cp1252, which cannot encode the bullet/dash
# glyphs used in the report. Force UTF-8 (with a safe fallback) so piping and
# modern terminals both work — never crash on exotic Unicode from the backend.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

app = typer.Typer(
    name="prompt-optimizer",
    help=(
        "Optimize a prompt using the Prompt Optimization Agent backend. "
        "The CLI is a thin client: all optimization runs on the backend "
        "(see PROMPT_OPTIMIZER_API_URL)."
    ),
    add_completion=False,
    pretty_exceptions_show_locals=False,
    no_args_is_help=False,
    invoke_without_command=True,
)

_PROGRESS_LABELS = {
    "start": "Analyzing prompt…",
    "skill": "Selecting optimization skill…",
    "optimize": "Optimizing prompt…",
    "analytics": "Calculating token analysis…",
    "complete": "Generating final report…",
}


@app.callback()
def main(
    prompt: Optional[str] = typer.Argument(
        None,
        metavar="PROMPT",
        help=(
            "The prompt to optimize. Omit to run in interactive mode, or "
            "set PROMPT_OPTIMIZER_API_URL / PROMPT_OPTIMIZER_TIMEOUT in the "
            "environment to configure the backend."
        ),
    ),
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-v",
        help="Show the CLI version and exit.",
        is_eager=True,
    ),
) -> None:
    """Run the prompt optimizer against the backend."""
    if version:
        typer.echo(f"prompt-optimizer {__version__}")
        raise typer.Exit()

    text = prompt if prompt is not None else _read_interactive_prompt()
    text = text.strip()
    if not text:
        typer.secho(
            "Error: no prompt entered — provide a prompt or omit it for "
            "interactive mode.",
            fg=typer.colors.RED,
            err=True,
        )
        raise typer.Exit(code=1)

    client = OptimizeClient(load_config())

    def on_phase(label: str) -> None:
        friendly = _PROGRESS_LABELS.get(label) or label
        typer.echo(f"  {friendly}", err=True)

    def on_delta(text: str) -> None:
        typer.echo(text, err=True, nl=False)

    try:
        result = client.run(text, on_phase=on_phase, on_delta=on_delta)
    except CliError as exc:
        typer.secho(f"Error: {exc}", fg=typer.colors.RED, err=True)
        raise typer.Exit(code=exc.exit_code)
    except KeyboardInterrupt:
        typer.secho("\nInterrupted.", fg=typer.colors.YELLOW, err=True)
        raise typer.Exit(code=130)

    report = render_report(result)
    typer.echo(report)


def _read_interactive_prompt() -> str:
    """Read a single-line prompt in interactive mode."""
    try:
        text = typer.prompt("Enter your prompt")
    except (EOFError, KeyboardInterrupt, typer.Abort):
        typer.echo("")
        raise typer.Exit(code=130)
    return text


if __name__ == "__main__":
    app()
