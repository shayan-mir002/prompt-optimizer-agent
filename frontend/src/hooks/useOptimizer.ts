// src/hooks/useOptimizer.ts
import { useState, useCallback } from 'react';
import { analyzePrompt, runOptimizationStream } from '../api/optimizerApi';
import type {
  OptimizeResponse,
  PreOptimizationResponse,
  OptimizationStatus,
} from '../types/optimizer';

interface UseOptimizerReturn {
  status: OptimizationStatus;
  preResult: PreOptimizationResponse | null;
  result: OptimizeResponse | null;
  error: string | null;
  rawPrompt: string;
  setRawPrompt: (p: string) => void;
  runAnalyze: () => Promise<void>;
  runOptimize: () => Promise<void>;
  reset: () => void;
  streamPhase: string;
  streamText: string;
}

export function useOptimizer(): UseOptimizerReturn {
  const [status, setStatus] = useState<OptimizationStatus>('idle');
  const [preResult, setPreResult] = useState<PreOptimizationResponse | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawPrompt, setRawPrompt] = useState('');
  const [streamPhase, setStreamPhase] = useState('Starting optimization pipeline…');
  const [streamText, setStreamText] = useState('');

  // Stage 1 — analyze validity, clarity and before-optimization token cost.
  const runAnalyze = useCallback(async () => {
    if (!rawPrompt.trim()) return;
    setStatus('analyzing');
    setError(null);
    setResult(null);
    setPreResult(null);
    try {
      const data = await analyzePrompt(rawPrompt);
      setPreResult(data);
      setStatus('analyzed');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      setStatus('error');
    }
  }, [rawPrompt]);

  // Stage 2 — run the optimizer using the approved stage-1 analysis.
  // The pipeline is streamed over SSE: phase labels and prompt deltas update
  // live, and the full result arrives in the final "complete" event.
  const runOptimize = useCallback(async () => {
    if (!rawPrompt.trim() || !preResult) return;
    setStatus('optimizing');
    setError(null);
    setStreamText('');
    setStreamPhase('Starting optimization pipeline…');
    try {
      const data = await runOptimizationStream(rawPrompt, preResult, {
        onPhase: (label) => setStreamPhase(label),
        onDelta: (text) => setStreamText(prev => prev + text),
      });
      setResult(data);
      setStatus('success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      setStatus('error');
    }
  }, [rawPrompt, preResult]);

  const reset = useCallback(() => {
    setStatus('idle');
    setPreResult(null);
    setResult(null);
    setError(null);
    setRawPrompt('');
    setStreamText('');
    setStreamPhase('Starting optimization pipeline…');
  }, []);

  return {
    status, preResult, result, error, rawPrompt, setRawPrompt,
    runAnalyze, runOptimize, reset, streamPhase, streamText,
  };
}
