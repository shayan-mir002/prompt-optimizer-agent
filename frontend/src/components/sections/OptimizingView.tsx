// src/components/sections/OptimizingView.tsx
import React, { useEffect, useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface OptimizingViewProps {
  phase: string;
  streamText: string;
}

export const OptimizingView: React.FC<OptimizingViewProps> = ({ phase, streamText }) => {
  const boxRef = useRef<HTMLPreElement>(null);
  const streaming = streamText.length > 0;

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [streamText]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-violet-400 animate-spin" style={{ animationDuration: '1s' }} />
          <div className="absolute inset-3 rounded-full border-2 border-fuchsia-500/20" />
          <div className="absolute inset-3 rounded-full border-b-2 border-fuchsia-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={20} className="text-violet-300 animate-pulse-slow" />
          </div>
        </div>

        <span className="tag-pill bg-violet-500/15 text-violet-300 border border-violet-500/25 mb-3">
          Step 2 of 2 — Live Optimization
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">{phase}</h2>
        <p className="text-sm text-slate-500">
          {streaming
            ? 'Streaming the optimized prompt as it is generated…'
            : 'The optimized prompt will appear here the moment the model starts writing it.'}
        </p>
      </div>

      {/* Live prompt terminal */}
      <div className="gradient-border-violet rounded-2xl animate-slide-up">
        <div className="glass-strong rounded-2xl overflow-hidden">
          {/* Terminal bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/8">
            <span className="w-3 h-3 rounded-full bg-rose-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs font-mono text-slate-400">optimized-prompt.txt</span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-violet-300 font-semibold uppercase tracking-wider">
              {streaming ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> streaming</>
              ) : (
                <><Loader2 size={11} className="animate-spin" /> connecting…</>
              )}
            </span>
          </div>

          {/* Streamed content */}
          <pre
            ref={boxRef}
            className="optimized-prompt-text p-5 max-h-80 overflow-y-auto"
          >
            {streamText}
            <span className="streaming-caret">▌</span>
          </pre>
        </div>
      </div>
    </div>
  );
};
