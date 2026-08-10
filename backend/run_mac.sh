#!/usr/bin/env bash
# backend/run_mac.sh
# Quick way to test the Agent on a Mac WITHOUT compiling a binary.
# Just needs: Python 3.12 (macOS) and optionally Node.js (to build the UI).
# It starts the backend + embedded web UI locally and opens the browser —
# identical behavior to the desktop app, minus the packaging.
#
# Usage:
#   bash backend/run_mac.sh
#
# Env overrides:
#   SKIP_FRONTEND=1   reuse an existing frontend/dist (no Node needed)
#   PROMPT_OPTIMIZER_PORT  fixed port (default: a random free port)
set -euo pipefail

backend="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$backend/.." && pwd)"
frontend="$root/frontend"
webDir="$backend/app/web"
venvDir="$backend/.venv"

PY="${PYTHON:-python3}"

echo "== 1/3 Setting up Python environment =="
if [ ! -x "$venvDir/bin/python" ]; then
    "$PY" -m venv "$venvDir"
fi
"$venvDir/bin/python" -m pip install --quiet --upgrade pip
"$venvDir/bin/python" -m pip install --quiet -r "$backend/requirements.txt"

echo "== 2/3 Preparing web UI =="
if [ "${SKIP_FRONTEND:-0}" = "1" ]; then
    if [ ! -f "$frontend/dist/index.html" ]; then
        echo "SKIP_FRONTEND=1 but frontend/dist/index.html is missing." >&2
        exit 1
    fi
elif [ -f "$frontend/dist/index.html" ]; then
    echo "Reusing existing frontend/dist (set SKIP_FRONTEND=1 to force)."
else
    if ! command -v npm >/dev/null 2>&1; then
        echo "Node.js not found and frontend/dist is missing." >&2
        echo "Either install Node.js, or build the UI elsewhere and copy frontend/dist." >&2
        exit 1
    fi
    (
        cd "$frontend"
        [ -d node_modules ] || npm install
        npm run build
    )
fi
rm -rf "$webDir"
cp -R "$frontend/dist" "$webDir"

echo "== 3/3 Starting the Agent =="
echo "API key: read from backend/.env (set API_KEY there if needed)."
cd "$backend"
exec "$venvDir/bin/python" launcher.py
