// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { OptimizingView } from './components/sections/OptimizingView';
import { OptimizedPromptSection } from './components/sections/OptimizedPromptSection';
import { ComparisonSection } from './components/sections/ComparisonSection';
import { PreOptimizationView } from './components/sections/PreOptimizationView';
import { ResultsSummary } from './components/sections/ResultsSummary';
import { useOptimizer } from './hooks/useOptimizer';
import { fetchConfig, type BackendConfig } from './api/optimizerApi';
import { Zap, Sparkles, AlertTriangle, ChevronRight, Hash } from 'lucide-react';
import { fmt } from './utils/format';

const SECTION_IDS = ['optimized-prompt', 'comparison'];

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
    <span className="badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]">
      <Hash size={11} />
      <span className="font-mono font-semibold text-[#C6CDD9]">{fmt(count)}</span> tokens
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
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge text-[#8FB0FF] border-[#4F7CFF]/30 bg-[#4F7CFF]/10 mb-6">
          <Sparkles size={13} />
          <span className="font-medium">Two-step AI prompt optimization</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
          Sharpen your prompts,
          <br />
          <span className="text-[#7BA2FF]">before you ship them</span>
        </h1>
        <p className="text-base text-[#9AA4B2] max-w-xl mx-auto leading-relaxed">
          Step 1 validates your prompt, checks clarity and projects the manual
          token cost. Step 2 selects the best framework from 21 skills, optimizes
          the prompt and compares tokens saved — before vs after.
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-3xl animate-slide-up">
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9AA4B2]">Your Prompt</span>
            {prompt.trim() && <TokenBadge count={tokenCount} />}
          </div>

          <textarea
            id="prompt-input"
            className="prompt-textarea min-h-40 mb-4"
            placeholder="Enter your raw prompt here… e.g. 'Write a blog post about AI trends in 2026'"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) onAnalyze();
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#6B7686] hidden sm:block">Ctrl + Enter to analyze</p>
            <button
              id="optimize-btn"
              onClick={onAnalyze}
              disabled={!prompt.trim()}
              className={`btn-primary ml-auto ${prompt.trim() ? '' : '!text-[#6B7686]'}`}
            >
              <Zap size={15} />
              Analyze Prompt
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-4">
          <p className="text-xs text-[#6B7686] mb-2.5 text-center">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs text-[#9AA4B2] hover:text-[#C6CDD9] px-3 py-1.5 rounded-lg border border-[#232A36] hover:border-[#4F7CFF]/40 transition-colors bg-[#10141C]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-10 animate-fade-in">
        {['Step 1: Validate + clarity', 'Step 2: Optimize', '21 skill frameworks', 'Token & cost comparison'].map(f => (
          <span key={f} className="badge text-[#6B7686] border-[#232A36] bg-[#161C26]">{f}</span>
        ))}
      </div>
    </main>
  );
}

// ── Results view (Step 2) ──────────────────────────────────────────────────
function ResultsView({
  result,
  activeSection,
  modelName,
}: {
  result: NonNullable<ReturnType<typeof useOptimizer>['result']>;
  activeSection: string;
  modelName?: string;
}) {
  return (
    <div className="flex gap-6 max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {result.comparison && (
          <ResultsSummary
            comparison={result.comparison}
            skillName={result.skill?.name}
            modelName={modelName}
          />
        )}

        {result.optimized_prompt && result.skill && (
          <OptimizedPromptSection
            optimizedPrompt={result.optimized_prompt}
            skill={result.skill}
            analytics={result.optimizer_analytics}
          />
        )}

        {result.comparison && <ComparisonSection comparison={result.comparison} />}
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
  const [config, setConfig] = useState<BackendConfig | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

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
          <div className="surface p-8 max-w-md w-full flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-[#E5677E]/10 border border-[#E5677E]/25 mb-5">
              <AlertTriangle size={26} className="text-[#F09AA8]" />
            </div>
            <h2 className="text-lg font-bold mb-2">Optimization failed</h2>
            <p className="text-sm text-[#9AA4B2] mb-6">{error}</p>
            <button onClick={reset} className="btn-primary">
              Try Again
            </button>
          </div>
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
            <div className="surface p-8 max-w-md w-full text-center">
              <div className="p-3 rounded-full bg-[#E5677E]/10 border border-[#E5677E]/25 mb-5 inline-flex">
                <AlertTriangle size={26} className="text-[#F09AA8]" />
              </div>
              <h2 className="text-lg font-bold mb-2">
                {preResult.validation.errors[0] || 'Please enter an appropriate prompt to optimize'}
              </h2>
              {preResult.validation.errors.length > 1 && (
                <ul className="space-y-1.5 mb-5 text-left">
                  {preResult.validation.errors.slice(1).map((e, i) => (
                    <li key={i} className="text-sm text-[#9AA4B2] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5677E] mt-1.5 shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-[#6B7686] mb-6">
                Enter a task you want the AI to perform — writing, coding, analysis,
                marketing and more — and we'll sharpen it for you.
              </p>
              <button onClick={reset} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        )
      )}

      {status === 'success' && result && (
        <ResultsView result={result} activeSection={activeSection} modelName={config?.model} />
      )}
    </div>
  );
}