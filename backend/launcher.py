"""
backend/launcher.py
Desktop entry point. Bundles the FastAPI backend and the built web UI into
one local process (no external server), then opens the default browser.

Build the single-file Windows executable with:
    powershell -ExecutionPolicy Bypass -File backend/build_desktop.ps1

Optional env vars:
    PROMPT_OPTIMIZER_PORT        fixed port (default: a random free port)
    PROMPT_OPTIMIZER_NO_BROWSER  set to "1" to skip auto-opening the browser
"""
import os
import socket
import threading
import time
import webbrowser
from pathlib import Path

import uvicorn
from fastapi.responses import FileResponse, JSONResponse

from app.core.logging import setup_logging
from app.main import app

WEB_DIR = Path(__file__).resolve().parent / "app" / "web"


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _register_spa_routes() -> None:
    @app.get("/{full_path:path}", include_in_schema=False)
    async def _spa(full_path: str):
        if full_path.startswith("api/") or full_path == "health":
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = WEB_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        index = WEB_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)
        return JSONResponse({"detail": "Web UI missing - run the build script."}, status_code=404)


def _wait_for_server(port: int, attempts: int = 100) -> bool:
    for _ in range(attempts):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def main() -> None:
    setup_logging("WARNING")

    _register_spa_routes()

    port = int(os.environ.get("PROMPT_OPTIMIZER_PORT", "0") or 0)
    if port <= 0:
        port = _find_free_port()
    url = f"http://127.0.0.1:{port}"

    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()

    if not _wait_for_server(port):
        print("Server failed to start.")
        raise SystemExit(1)

    print(f"AI Prompt Optimization Agent is running at {url}")
    print("Press Ctrl+C to stop.")
    if os.environ.get("PROMPT_OPTIMIZER_NO_BROWSER") != "1":
        webbrowser.open(url)

    try:
        while not server.should_exit:
            time.sleep(1)
    except KeyboardInterrupt:
        server.should_exit = True


if __name__ == "__main__":
    main()
