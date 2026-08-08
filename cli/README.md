# prompt-optimizer (CLI)

Terminal client for the **Prompt Optimization Agent** backend.

The CLI is a **thin client** — it never runs the optimization pipeline and
holds no AI provider credentials. It streams the optimization progress from the
backend's `/api/v1/optimize/run/stream` endpoint (with automatic fallback to
`/api/v1/optimize/run`) and renders the backend's `OptimizeResponse` as a
professional terminal report. Every number shown comes from the backend — the
CLI never recomputes token counts, costs, or reductions.

## Requirements

- Python 3.10+
- The Prompt Optimization Agent backend running on port `8080`:

  ```bash
  cd backend
  uvicorn app.main:app --host 0.0.0.0 --port 8080
  ```

## Installation

From the `cli/` directory:

```bash
pip install -e .        # editable install (picks up code changes instantly)
# or
pip install .           # regular install
```

This installs the `prompt-optimizer` command plus the `typer`, `httpx`, and
`rich` dependencies.

## Usage

### Positional prompt

```bash
prompt-optimizer "Generate an e-commerce website"
```

### Interactive mode

```bash
prompt-optimizer
# Enter your prompt: Generate an e-commerce website
```

### Help / version

```bash
prompt-optimizer --help
prompt-optimizer --version
```

## Configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `PROMPT_OPTIMIZER_API_URL` | `http://localhost:8080` | Backend base URL. |
| `PROMPT_OPTIMIZER_TIMEOUT` | `600` | Timeout (seconds) waiting for the stream. |

Example:

```bash
PROMPT_OPTIMIZER_API_URL=http://localhost:9000 prompt-optimizer "your prompt"
```

## Output

Progress phases stream to **stderr**; the final report goes to **stdout**, so it
stays clean for redirection and piping:

```bash
prompt-optimizer "Generate an e-commerce website" > report.txt
```

The report sections (all values read from the backend JSON):

1. **PROMPT ANALYSIS** — intent, type, complexity, ambiguity, quality/completeness scores
2. **SELECTED SKILL** — chosen skill framework and the reason
3. **OPTIMIZED PROMPT** — the optimized text plus its token usage
4. **MANUAL WORKFLOW SIMULATION** — what doing this by hand would cost
5. **OPTIMIZER WORKFLOW** — what the optimizer actually consumed
6. **EXECUTION FORECAST** — estimated execution tokens/costs
7. **TOKEN COMPARISON** — tokens saved and reduction %
8. **COST ANALYSIS** — estimated cost savings

Each value is tagged `● actual` (measured by the backend LLM) or
`~ estimated` (calculated projection) so estimates are never mistaken for
measurements.

## Error handling

The CLI never prints raw stack traces:

- **Backend not running / wrong URL** → `Cannot reach the backend at …`
- **Blank or invalid prompt** → `Invalid prompt` / `no prompt entered`
- **Rate limited (429)** → a friendly wait-and-retry message
- **Timeout** → a friendly timeout message

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot reach the backend` | Start uvicorn on `:8080`, or point `PROMPT_OPTIMIZER_API_URL` at the running server. |
| `Backend rejected the request` | Check the backend's `GROQ_API_KEY` configuration. |
| `Backend server error` | Look at the backend logs; the provider may be rate-limited. |

## Development

```bash
cd cli
pip install -e ".[dev]"
```
