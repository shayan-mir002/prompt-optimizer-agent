// src/api/optimizerApi.ts
import axios from 'axios';
import type { OptimizeResponse, PreOptimizationResponse } from '../types/optimizer';

export interface StreamCallbacks {
  onPhase: (label: string) => void;
  onDelta: (text: string) => void;
}

interface StreamMessage {
  type: 'phase' | 'delta' | 'complete' | 'error';
  label?: string;
  text?: string;
  data?: OptimizeResponse;
  message?: string;
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 600_000,
});

// Stage 1 — validate, analyze clarity, plan/generate questions, project
// the before-optimization (manual) token cost. Runs NO optimization.
export async function analyzePrompt(prompt: string): Promise<PreOptimizationResponse> {
  const response = await api.post<PreOptimizationResponse>('/optimize/analyze', { prompt });
  return response.data;
}

// Stage 2 — reuse the stage-1 analysis and optimize the prompt.
export async function runOptimization(
  prompt: string,
  preAnalysis: PreOptimizationResponse,
): Promise<OptimizeResponse> {
  const response = await api.post<OptimizeResponse>('/optimize/run', {
    prompt,
    pre_analysis: preAnalysis,
  });
  return response.data;
}

// Stage 2 — streaming variant. Consumes the /optimize/run/stream SSE endpoint
// via fetch + ReadableStream, invoking the callbacks as events arrive.
export async function runOptimizationStream(
  prompt: string,
  preAnalysis: PreOptimizationResponse,
  callbacks: StreamCallbacks,
): Promise<OptimizeResponse> {
  const res = await fetch('/api/v1/optimize/run/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, pre_analysis: preAnalysis }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Optimization request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let splitAt: number;
    while ((splitAt = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 2);
      const dataLine = frame.split('\n').find(l => l.startsWith('data:'));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      if (!raw) continue;

      let msg: StreamMessage;
      try {
        msg = JSON.parse(raw) as StreamMessage;
      } catch {
        continue;
      }

      if (msg.type === 'phase' && msg.label) {
        callbacks.onPhase(msg.label);
      } else if (msg.type === 'delta' && msg.text) {
        callbacks.onDelta(msg.text);
      } else if (msg.type === 'complete' && msg.data) {
        return msg.data;
      } else if (msg.type === 'error') {
        throw new Error(msg.message || 'Optimization failed');
      }
    }
  }

  throw new Error('Stream ended before the optimization completed');
}
