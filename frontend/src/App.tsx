// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { OptimizingView } from './components/sections/OptimizingView';
import { RawPromptSection } from './components/sections/RawPromptSection';
import { PromptDiffSection } from './components/sections/PromptDiffSection';
import { AnalysisSection } from './components/sections/AnalysisSection';
import { ClarificationSection } from './components/sections/ClarificationSection';
import { SkillSection } from './components/sections/SkillSection';
import { OptimizedPromptSection } from './components/sections/OptimizedPromptSection';
import { ManualWorkflowSection } from './components/sections/ManualWorkflowSection';
import { OptimizerWorkflowSection } from './components/sections/OptimizerWorkflowSection';
import { TokenAnalyticsSection } from './components/sections/TokenAnalyticsSection';
import { CostAnalysisSection } from './components/sections/CostAnalysisSection';
import { ComparisonSection } from './components/sections/ComparisonSection';
import { FinalReportSection } from './components/sections/FinalReportSection';
import { PreOptimizationView } from './components/sections/PreOptimizationView';
import { useOptimizer } from './hooks/useOptimizer';
import { Zap, Sparkles, Hash, AlertTriangle, ChevronRight } from 'lucide-react';

const SECTION_IDS = [
  'raw-prompt', 'prompt-diff', 'analysis', 'clarification', 'skill', 'optimized-prompt',
  'manual-workflow', 'optimizer-workflow', 'token-analytics', 'cost-analysis',
  'comparison', 'final-report',
];

function useActiveSection(): string {
  const [active, setActive] = useState(SECTION_IDS[0]);
  useEffect(() => {
    const observers = SECTION_IDS.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      return obs;
    }).filter(Boolean);
    return () => observers.forEach(obs => obs?.disconnect());
  });
  return active;
}

function TokenBadge({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1">
      <Hash size={11} />
      {count} tokens
    </span>
  );
}

// ── Input view ──────────────────────────────────────────────────────────────
function InputView({
  prompt, setPrompt, onAnalyze, tokenCount,
}: {
  prompt: string;
  setPrompt: (p: string) => void;
  onAnalyze: () => void;
  tokenCount: number;
}) {
  const examples = [
    'Write a blog post about machine learning',
    'Create a Python script to scrape web data',
    'Help me design a mobile app for fitness tracking',
    'Write a marketing email for our new SaaS product',
  ];

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-fuchsia-500/20 mb-6">
          <Sparkles size={13} className="text-fuchsia-400" />
          <span className="text-xs text-fuchsia-300 font-medium">Two-Step AI Optimization Pipeline</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
          Transform Your Prompts
          <br />
          <span className="gradient-text-vivid">Into Masterpieces</span>
        </h1>
        <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Step 1 validates your prompt, checks clarity and projects the manual
          token cost. Step 2 selects the best framework from 21 skills, optimizes
          the prompt and compares tokens saved — before vs after.
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-3xl animate-slide-up">
        <div className="glass-strong rounded-2xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Your Prompt</span>
            {prompt.trim() && <TokenBadge count={tokenCount} />}
          </div>

          <textarea
            id="prompt-input"
            className="prompt-textarea min-h-40 mb-4"
            placeholder="Enter your raw prompt here… e.g. 'Write a blog post about AI trends in 2025'"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) onAnalyze();
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600 hidden sm:block">Step 1 of 2 — Ctrl+Enter to analyze</p>
            <button
              id="optimize-btn"
              onClick={onAnalyze}
              disabled={!prompt.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ml-auto
                ${prompt.trim()
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 text-white hover:from-violet-500 hover:to-fuchsia-400 glow-indigo hover:scale-[1.02]'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
            >
              <Zap size={15} className={prompt.trim() ? 'text-white' : 'text-slate-600'} />
              Analyze Prompt
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-4">
          <p className="text-xs text-slate-600 mb-2.5 text-center">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs text-slate-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-10 animate-fade-in">
        {['Step 1: Validate + Clarity', 'Step 2: Optimize', '21 Skill Frameworks', 'Token & Cost Comparison'].map(f => (
          <span key={f} className="tag-pill bg-white/3 border border-white/5 text-slate-400">{f}</span>
        ))}
      </div>
    </main>
  );
}

// ── Results view (Stage 2) ──────────────────────────────────────────────────
function ResultsView({
  result,
  rawPrompt,
  activeSection,
}: {
  result: NonNullable<ReturnType<typeof useOptimizer>['result']>;
  rawPrompt: string;
  activeSection: string;
}) {
  return (
    <div className="flex gap-6 max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        <RawPromptSection prompt={rawPrompt} tokens={result.raw_prompt_tokens} />

        {result.optimized_prompt && (
          <PromptDiffSection
            raw={rawPrompt}
            optimized={result.optimized_prompt.text}
            rawTokens={result.raw_prompt_tokens}
            optimizedTokens={result.optimized_prompt.tokens}
          />
        )}

        {result.analysis && <AnalysisSection analysis={result.analysis} />}

        {result.clarification && <ClarificationSection clarification={result.clarification} />}

        {result.skill && <SkillSection skill={result.skill} />}

        {result.optimized_prompt && result.skill && (
          <OptimizedPromptSection optimizedPrompt={result.optimized_prompt} skill={result.skill} />
        )}

        {result.manual_projection && result.clarification && (
          <ManualWorkflowSection manual={result.manual_projection} clarification={result.clarification} beforeOptimization={false} />
        )}

        {result.optimizer_analytics && result.execution_estimation && (
          <OptimizerWorkflowSection analytics={result.optimizer_analytics} execution={result.execution_estimation} />
        )}

        {result.optimizer_analytics && <TokenAnalyticsSection analytics={result.optimizer_analytics} />}

        {result.optimizer_analytics && result.execution_estimation && (
          <CostAnalysisSection analytics={result.optimizer_analytics} execution={result.execution_estimation} />
        )}

        {result.comparison && <ComparisonSection comparison={result.comparison} />}

        {result.final_report && <FinalReportSection report={result.final_report} />}
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const {
    status, preResult, result, error,
    rawPrompt, setRawPrompt, runAnalyze, runOptimize, reset,
    streamPhase, streamText,
  } = useOptimizer();
  const activeSection = useActiveSection();

  // Simple token estimate for display
  const [localTokenCount, setLocalTokenCount] = useState(0);
  useEffect(() => {
    const words = rawPrompt.trim().split(/\s+/).filter(Boolean).length;
    setLocalTokenCount(Math.max(0, Math.round(words / 0.75)));
  }, [rawPrompt]);

  // Scroll to top on new results
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== status && (status === 'analyzed' || status === 'success')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevStatus.current = status;
  }, [status]);

  return (
    <div className="min-h-screen">
      <Header onReset={reset} hasResult={status === 'analyzed' || status === 'success'} />

      {status === 'idle' && (
        <InputView
          prompt={rawPrompt}
          setPrompt={setRawPrompt}
          onAnalyze={runAnalyze}
          tokenCount={localTokenCount}
        />
      )}

      {status === 'analyzing' && <LoadingSpinner stage="analyze" />}
      {status === 'optimizing' && <OptimizingView phase={streamPhase} streamText={streamText} />}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
          <div className="p-4 rounded-full bg-rose-500/15 mb-5">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Optimization Failed</h2>
          <p className="text-sm text-slate-400 max-w-md text-center mb-6">{error}</p>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {status === 'analyzed' && preResult && (
        preResult.validation.is_valid ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <PreOptimizationView
              pre={preResult}
              rawPrompt={rawPrompt}
              onProceed={runOptimize}
              onBack={reset}
              loading={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
            <div className="glass rounded-2xl border border-rose-500/25 p-8 max-w-md w-full text-center">
              <div className="p-4 rounded-full bg-rose-500/15 mb-5 inline-flex">
                <AlertTriangle size={26} className="text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {preResult.validation.errors[0] || 'Please enter an appropriate prompt to optimize'}
              </h2>
              {preResult.validation.errors.length > 1 && (
                <ul className="space-y-1.5 mb-5 text-left">
                  {preResult.validation.errors.slice(1).map((e, i) => (
                    <li key={i} className="text-sm text-rose-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500 mb-6">
                Enter a task you want the AI to perform — writing, coding, analysis,
                marketing and more — and we'll sharpen it for you.
              </p>
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-medium hover:from-violet-500 hover:to-fuchsia-400 glow-indigo transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      )}

      {status === 'success' && result && (
        <ResultsView result={result} rawPrompt={rawPrompt} activeSection={activeSection} />
      )}
    </div>
  );
}
