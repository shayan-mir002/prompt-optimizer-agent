// src/components/ui/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  stage: 'analyze' | 'optimize';
}

const STAGES: Record<'analyze' | 'optimize', { title: string; phases: string[] }> = {
  analyze: {
    title: 'Stage 1 — Pre-Optimization Analysis',
    phases: [
      'Counting raw prompt tokens...',
      'Validating the prompt...',
      'Analyzing clarity & intent...',
      'Deciding how many questions are required...',
      'Generating the clarification questions...',
      'Projecting before-optimization tokens & cost...',
    ],
  },
  optimize: {
    title: 'Stage 2 — Optimization',
    phases: [
      'Selecting the best skill framework...',
      'Generating the optimized prompt...',
      'Estimating execution tokens & cost...',
      'Calculating after-optimization analytics...',
      'Comparing before vs after...',
      'Assembling the final report...',
    ],
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ stage }) => {
  const [phaseIdx, setPhaseIdx] = React.useState(0);
  const { title, phases } = STAGES[stage];

  React.useEffect(() => {
    setPhaseIdx(0);
    const interval = setInterval(() => {
      setPhaseIdx(prev => (prev + 1) % phases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [stage, phases.length]);

  const phase = phases[phaseIdx];

  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 animate-fade-in">
      {/* Orbital spinner */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" style={{ animationDuration: '1s' }} />
        <div className="absolute inset-3 rounded-full border-2 border-cyan-500/20" />
        <div className="absolute inset-3 rounded-full border-b-2 border-cyan-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 animate-pulse-slow" />
        </div>
      </div>

      {/* Phase indicator */}
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="tag-pill bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {stage === 'analyze' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
        </div>
        <p className="text-lg font-semibold text-white mb-2">{phase}</p>
        <p className="text-sm text-slate-500">{title}</p>
      </div>

      {/* Mini phase dots */}
      <div className="flex gap-1.5 mt-8">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= phaseIdx ? 'bg-indigo-400 scale-110' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
