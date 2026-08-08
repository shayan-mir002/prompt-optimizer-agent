"""
prompt_optimizer_cli
Terminal client for the Prompt Optimization Agent.

The CLI is a thin client layer only — it talks to the existing FastAPI
backend and formats the backend's results. It never runs the optimization
pipeline itself and never holds any AI provider credentials.
"""

__version__ = "1.0.0"
