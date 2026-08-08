// src/components/sections/OptimizedPromptSection.tsx
import React, { useState, useCallback } from 'react';
import { Wand2, Copy, Check, Hash, Layers, Zap } from 'lucide-react';
import type { OptimizedPromptResult, SkillResult } from '../../types/optimizer';

interface OptimizedPromptSectionProps {
  optimizedPrompt: OptimizedPromptResult;
  skill: SkillResult;
}

export const OptimizedPromptSection: React.FC<OptimizedPromptSectionProps> = ({
  optimizedPrompt, skill,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = optimizedPrompt.text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [optimizedPrompt.text]);

  return (
    <section id="optimized-prompt" className="animate-slide-up">
      <div className="gradient-border-vivid rounded-2xl glow-prompt">
        {/* Inner vivid gradient frame */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500">
          <div className="relative rounded-2xl overflow-hidden bg-[#0B1022]">
            {/* Colorful glow blobs */}
            <div className="pointer-events-none absolute -top-28 -right-20 w-80 h-80 rounded-full bg-fuchsia-500/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-cyan-500/35 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 left-1/2 w-56 h-56 rounded-full bg-violet-500/35 blur-3xl" />
            {/* Shine sweep */}
            <div className="pointer-events-none absolute inset-0 shine-sweep" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-fuchsia-500/40">
                    <Wand2 size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold gradient-text-vivid leading-tight">
                      Optimized Prompt
                    </h2>
                    <p className="text-xs text-slate-400">
                      Phase 6 · {skill.name} Framework · {skill.full_name}
                    </p>
                  </div>
                </div>
                <button
                  id="copy-optimized-prompt"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-400 hover:to-fuchsia-400 hover:scale-[1.03] shadow-lg shadow-fuchsia-500/30'
                  }`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>

              {/* Terminal panel */}
              <div className="rounded-xl border border-white/15 overflow-hidden shadow-2xl shadow-fuchsia-500/10 bg-black/30 backdrop-blur-sm">
                {/* Rainbow title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600">
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                  <span className="ml-2 text-xs font-mono font-semibold text-white">
                    optimized-prompt.txt
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] text-white font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    ready to use
                  </span>
                </div>
                <div className="p-5">
                  <pre className="optimized-prompt-text">{optimizedPrompt.text}</pre>
                </div>
              </div>

              {/* Token breakdown chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-xs font-semibold text-violet-200">
                  <Hash size={12} />
                  {optimizedPrompt.tokens.toLocaleString()} prompt tokens
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 text-xs font-semibold text-fuchsia-200">
                  <Layers size={12} />
                  {optimizedPrompt.optimization_tokens_used.toLocaleString()} LLM tokens consumed
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-xs font-semibold text-cyan-200">
                  <Zap size={12} />
                  Ready to paste into any AI chat interface
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
