// src/components/sections/OptimizingView.tsx
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="surface p-6 text-center mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <span className="pulse-dot w-2 h-2 rounded-full bg-[#4F7CFF]" />
          <Loader2 size={18} className="animate-spin text-[#4F7CFF]" />
        </div>
        <h2 className="text-xl font-bold text-[#E6EAF2] mb-1">{phase}</h2>
        <p className="text-xs text-[#6B7686]">Step 2 of 2 — streaming the optimized prompt</p>
      </div>

      <div className="surface overflow-hidden animate-slide-up">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161C26] border-b border-[#232A36]">
          <span className="w-3 h-3 rounded-full bg-[#E5677E]/70" />
          <span className="w-3 h-3 rounded-full bg-[#E0A93B]/70" />
          <span className="w-3 h-3 rounded-full bg-[#2FB67B]/70" />
          <span className="ml-2 text-xs font-mono text-[#6B7686]">optimized-prompt.txt</span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#59C99A] font-semibold uppercase tracking-wider">
            {streaming ? (
              <>
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#2FB67B]" />
                streaming
              </>
            ) : (
              <>connecting…</>
            )}
          </span>
        </div>

        <pre
          ref={boxRef}
          className="prompt-mono p-5 max-h-80 overflow-y-auto"
        >
          {streamText || (
            <span className="text-[#6B7686]">The optimized prompt will appear here as it streams…</span>
          )}
          <span className="stream-caret text-[#4F7CFF]">▌</span>
        </pre>
      </div>
    </div>
  );
};
