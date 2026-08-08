"""
app/api/routes/optimize.py
Two-stage orchestration endpoints:

  POST /api/v1/optimize/analyze — Stage 1: validate, analyze clarity, plan &
       generate questions, and project the before-optimization token cost.
       The full pipeline is NOT run here.

  POST /api/v1/optimize/run     — Stage 2: skill selection, prompt
       optimization, execution estimation, after-optimization analytics and
       the before-vs-after comparison.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.schemas.request import OptimizeRequest, OptimizeRunRequest
from app.schemas.response import OptimizeResponse, PreOptimizationResponse
from app.services.orchestrator import OptimizationOrchestrator
from app.api.dependencies import get_orchestrator
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/optimize", tags=["Optimization"])


@router.post(
    "/analyze",
    response_model=PreOptimizationResponse,
    summary="Stage 1 — validate and analyze a prompt (no optimization)",
    response_description="Validity, clarity analysis, questions and before-optimization token projection",
)
async def analyze_prompt(
    body: OptimizeRequest,
    orchestrator: OptimizationOrchestrator = Depends(get_orchestrator),
) -> PreOptimizationResponse:
    """
    Stage 1 only. Checks whether the prompt is valid, analyzes clarity,
    plans/generates the clarification questions and reports the total tokens
    & cost that would be consumed if the whole process were done manually.
    """
    logger.info("Stage 1 request (prompt length=%d)", len(body.prompt))
    try:
        return await orchestrator.analyze(body.prompt)
    except Exception as exc:
        logger.exception("Unexpected error in stage-1 analysis: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(exc)}",
        )


@router.post(
    "/run",
    response_model=OptimizeResponse,
    summary="Stage 2 — optimize the prompt and compare before vs after",
    response_description="Complete optimization report with analytics and comparison",
)
async def run_optimization(
    body: OptimizeRunRequest,
    orchestrator: OptimizationOrchestrator = Depends(get_orchestrator),
) -> OptimizeResponse:
    """
    Stage 2. Reuses the stage-1 analysis (if provided) so the questions and
    before-optimization totals stay identical to what the user approved, then
    selects the best skill, generates the optimized prompt, estimates its
    execution cost and reports how many tokens/cost were saved.
    """
    logger.info("Stage 2 request (prompt length=%d)", len(body.prompt))
    try:
        return await orchestrator.optimize(body.prompt, body.pre_analysis)
    except Exception as exc:
        logger.exception("Unexpected error in optimization pipeline: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(exc)}",
        )


@router.post(
    "/run/stream",
    summary="Stage 2 — stream the optimization pipeline (SSE)",
    response_description="Server-Sent Events: phase progress, streamed prompt deltas and the final OptimizeResponse",
)
async def run_optimization_stream(
    body: OptimizeRunRequest,
    orchestrator: OptimizationOrchestrator = Depends(get_orchestrator),
) -> StreamingResponse:
    """
    Same pipeline as /run but streamed as Server-Sent Events so the frontend
    can show live progress and the optimized prompt while it is generated.
    """
    logger.info("Stage 2 stream request (prompt length=%d)", len(body.prompt))

    async def event_stream():
        try:
            async for event in orchestrator.stream_optimize(
                body.prompt, body.pre_analysis
            ):
                yield event
        except Exception as exc:
            logger.exception("Unexpected error in streamed optimization: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'message': f'Optimization failed: {exc}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
