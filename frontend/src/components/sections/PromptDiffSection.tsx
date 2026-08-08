// src/components/sections/PromptDiffSection.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { GitCompare, Copy, Check, Hash } from 'lucide-react';
import { diffWords, type DiffToken } from '../../utils/diff';

interface PromptDiffSectionProps {
  raw: string;
  optimized: string;
  rawTokens: number;
  optimizedTokens: number;
}

const DiffText: React.FC<{ tokens: DiffToken[] }> = ({ tokens }) => (
  <>
    {tokens.map((tok, idx) => {
      const isWhitespace = tok.text.trim().length === 0;
      if (tok.type === 'removed' && !isWhitespace) {
        return (
          <span key={idx} className="bg-rose-500/20 text-rose-300 line-through rounded px-0.5">
            {tok.text}
          </span>
        );
      }
      if (tok.type === 'added' && !isWhitespace) {
        return (
          <span key={idx} className="bg-emerald-500/25 text-emerald-200 rounded px-0.5">
            {tok.text}
          </span>
        );
      }
      return <span key={idx} className="text-slate-300">{tok.text}</span>;
    })}
  </>
);

export const PromptDiffSection: React.FC<PromptDiffSectionProps> = ({
  raw, optimized, rawTokens, optimizedTokens,
}) => {
  const { removed, added } = useMemo(() => diffWords(raw, optimized), [raw, optimized]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [optimized]);

  return (
    <section id="prompt-diff" className="section-card glass border border-white/5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <GitCompare size={16} className="text-violet-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Prompt Diff — Before vs After</h2>
            <p className="text-xs text-slate-500">Side-by-side comparison of what the optimization changed</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/40" /> removed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" /> added
        </span>
        <span className="ml-auto text-[11px] text-slate-500">Word-level LCS diff</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Raw prompt */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/8">
            <span className="text-xs font-semibold text-slate-300">Before — Raw Prompt</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-xs text-slate-400">
              <Hash size={11} /> {rawTokens} tokens
            </span>
          </div>
          <div className="bg-black/20 p-4">
            <pre className="font-mono text-[0.875rem] leading-7 whitespace-pre-wrap break-words">
              <DiffText tokens={removed} />
            </pre>
          </div>
        </div>

        {/* Optimized prompt */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/8">
            <span className="text-xs font-semibold text-violet-200">After — Optimized Prompt</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                <Hash size={11} /> {optimizedTokens} tokens
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${
                  copied
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                    : 'bg-white/5 text-slate-300 border-white/8 hover:border-violet-500/30'
                }`}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="bg-black/20 p-4">
            <pre className="font-mono text-[0.875rem] leading-7 whitespace-pre-wrap break-words">
              <DiffText tokens={added} />
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
