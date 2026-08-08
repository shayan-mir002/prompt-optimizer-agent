# AI Prompt Optimization Agent

A full-stack AI agent that analyzes a raw prompt, selects the best prompt-engineering framework, rewrites the prompt for clarity and precision, and produces a quantified report of the token and cost savings compared with doing the work manually.

The project ships as **three integrated components**: a FastAPI backend (all AI logic runs here), a React web UI, and an installable terminal CLI. The backend is the only place that holds the AI provider API key — the CLI and web UI are thin clients.

---

## Architecture

```
                       ┌──────────────────────┐
   Browser / UI ──────▶│  Frontend (React)    │
                       │  served by nginx     │
                       └──────────┬───────────┘
                                  │ /api/*
                                  ▼
                       ┌──────────────────────┐
   prompt-optimizer ──▶│  Backend (FastAPI)   │────▶ Groq / OpenAI-compatible
   (terminal CLI)      │  :8080               │      chat completions API
                       └──────────────────────┘
```

- **Backend** — FastAPI + uvicorn. Owns the API key, runs every optimization stage, streams progress over SSE, and computes all token/cost analytics. **No business logic or credentials exist in the CLI or the UI.**
- **Frontend** — React + Vite + Tailwind, served by nginx which proxies `/api/*` to the backend.
- **CLI** — `prompt-optimizer`, a thin Typer client that streams from the backend and renders a professional terminal report.

### Optimization pipeline

```
Raw Prompt
    ↓
Validation
    ↓
Skill Selection
    ↓
Prompt Optimization
    ↓
Optimized Prompt
    ↓
Estimated Execution
```

The pipeline runs one-shot (`POST /optimize/run`) or as a live SSE stream (`POST /optimize/run/stream`) with per-stage token usage, cost estimates, and a manual-workflow comparison.

---

## Repository structure

```
├── backend/                  # FastAPI application (all AI logic + API key)
│   ├── app/
│   │   ├── api/routes/       # /api/v1/optimize endpoints (analyze, run, run/stream)
│   │   ├── core/             # settings, logging, security
│   │   ├── schemas/          # request/response models
│   │   ├── services/         # validator, analyzer, skill selector, optimizer,
│   │   │                     #   cost calculator, manual projection, orchestrator
│   │   └── skills/           # prompt-engineering framework definitions
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                 # React + Vite web UI
│   ├── src/components/       # analysis, diff, skill, report, comparison, cost views
│   ├── src/api/              # axios + SSE client
│   ├── Dockerfile            # multi-stage build → nginx
│   ├── nginx.conf.template   # serves SPA + proxies /api/* to the backend
│   └── entrypoint.sh         # injects $BACKEND_URL and $PORT at runtime
├── cli/                      # installable terminal client
│   ├── prompt_optimizer_cli/ # main, client (SSE + fallback), formatter, config
│   ├── pyproject.toml        # console script: `prompt-optimizer`
│   └── README.md
├── docker-compose.yml        # backend + frontend, one command
├── .gitignore
└── .gitattributes
```

---

## Features

- **Smart skill selection** — chooses the best prompt framework (SCOPE, ICIO, CO-STAR, RACE, CREATE, AIDA, and more) for the detected prompt type, with a clear reason.
- **Token & cost analytics** — actual per-stage LLM token usage and estimated costs for both the optimizer and the manual workflow.
- **Manual-workflow comparison** — estimates what a human would consume (clarifying questions, decisions, iteration) vs. what the optimizer uses, including % reduction and money saved.
- **Streaming output** — the web UI and CLI show live progress phases and a streaming optimized prompt.
- **Prompt diff** — word-level diff between the raw and optimized prompts.
- **Docker-first** — run the whole stack with `docker compose up -d`; deploy to any Docker-capable cloud (Railway, Render, Fly.io, VPS).
- **Key stays server-side** — users of the UI or CLI never need the AI provider key.

---

## Getting started

### Prerequisites

- Python 3.10+ (backend & CLI)
- Node.js 18+ (frontend build)
- Docker + Docker Compose (recommended path)
- A Groq (or OpenAI-compatible) API key

### Option A — Docker (recommended)

```bash
# 1. configure your key
cp backend/.env.example backend/.env   # then edit backend/.env and set API_KEY

# 2. build & start both services
docker compose up --build -d

# 3. verify
curl http://localhost:8080/health
# → {"status":"ok","service":"AI Prompt Optimization Agent"}
```

- Web UI: http://localhost
- Backend: http://localhost:8080

### Option B — Run without Docker

**Backend**

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env                            # set API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

**Frontend**

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to :8080)
```

**CLI**

```bash
cd cli
pip install .
prompt-optimizer --version
prompt-optimizer "Generate an e-commerce website"
```

---

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `API_KEY` | — | Your AI provider key (required). |
| `API_BASE_URL` | `https://api.groq.com/openai/v1` | OpenAI-compatible chat completions endpoint. |
| `API_MODEL` | `llama-3.3-70b-versatile` | Model used for every optimization stage. |

### CLI (environment)

| Variable | Default | Description |
| --- | --- | --- |
| `PROMPT_OPTIMIZER_API_URL` | `http://localhost:8080` | Backend base URL. |
| `PROMPT_OPTIMIZER_TIMEOUT` | `600` | Stream timeout in seconds. |

---

## Usage

### Web UI

Open the app, paste a prompt, and follow the live pipeline: analysis, selected skill, streamed optimized prompt with diff, execution forecast, token comparison, and cost analysis.

### CLI

```bash
prompt-optimizer "Generate an e-commerce website"   # positional
prompt-optimizer                                    # interactive mode
prompt-optimizer --help
prompt-optimizer --version
prompt-optimizer "your prompt" > report.txt         # progress on stderr, report on stdout
```

The report includes **PROMPT ANALYSIS**, **SELECTED SKILL**, **OPTIMIZED PROMPT**, **MANUAL WORKFLOW SIMULATION**, **OPTIMIZER WORKFLOW**, **EXECUTION FORECAST**, **TOKEN COMPARISON**, and **COST ANALYSIS**, with every value tagged as `• actual` (measured) or `~ estimated` (projected).

See [`cli/README.md`](cli/README.md) for full CLI documentation.

---

## API

All endpoints are under the `/api/v1` prefix.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/optimize/analyze` | Run the analysis stage only. |
| `POST` | `/api/v1/optimize/run` | Run the full pipeline, return the complete result. |
| `POST` | `/api/v1/optimize/run/stream` | Run the full pipeline as an SSE stream (`phase`, `delta`, `complete`, `error` events). |
| `GET` | `/health` | Liveness check. |

---

## Deployment

### Railway (or any Docker PaaS)

1. Push this repository to GitHub.
2. **Backend service** — root directory `backend`; add `API_KEY`, `API_BASE_URL`, `API_MODEL` variables; generate a public domain.
3. **Frontend service** — root directory `frontend`; add `BACKEND_URL=https://<backend-domain>`; generate a public domain.
4. The images listen on Railway's injected `$PORT` automatically.

### VPS

```bash
docker compose up --build -d
```

Then share the server URL. For the CLI, other users only need `PROMPT_OPTIMIZER_API_URL=http://<host>:8080`.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Python, FastAPI, uvicorn, pydantic-settings, httpx, tiktoken |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, axios (SSE) |
| CLI | Python, Typer, httpx, Rich |
| Infra | Docker, Docker Compose, nginx |

---

## Security notes

- The AI provider API key lives **only** in the backend (`.env` / platform secrets) and is excluded from Docker images and git (`backend/.env` is gitignored).
- The CLI and web UI require no credentials and contain no business logic — they consume the backend only.
- Never commit `.env` files or expose them in public images.

---

## License

Proprietary. All rights reserved.
