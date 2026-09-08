// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  stage: 'analyze' | 'optimize';
}

const STAGES: Record<'analyze' | 'optimize', { title: string; subtitle: string; phases: string[] }> = {
  analyze: {
    title: 'Analyzing your prompt',
    subtitle: 'Step 1 of 2 — Pre-optimization analysis',
    phases: [
      'Counting raw prompt tokens...',
      'Validating the prompt...',
      'Analyzing clarity and intent...',
      'Deciding how many questions are required...',
      'Generating clarification questions...',
      'Projecting before-optimization tokens and cost...',
    ],
  },
  optimize: {
    title: 'Optimizing your prompt',
    subtitle: 'Step 2 of 2 — Optimization',
    phases: [
      'Selecting the best skill framework...',
      'Generating the optimized prompt...',
      'Estimating execution tokens and cost...',
      'Calculating after-optimization analytics...',
      'Comparing before vs after...',
      'Assembling the final report...',
    ],
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ stage }) => {
  const [phaseIdx, setPhaseIdx] = React.useState(0);
  const { title, subtitle, phases } = STAGES[stage];

  React.useEffect(() => {
    setPhaseIdx(0);
    const interval = setInterval(() => {
      setPhaseIdx(prev => (prev + 1) % phases.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [stage, phases.length]);

  const phase = phases[phaseIdx];

  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 animate-fade-in">
      <div className="surface px-8 py-7 flex flex-col items-center max-w-md w-full">
        <div className="relative w-12 h-12 mb-5">
          <Loader2 size={48} className="text-[#4F7CFF] animate-spin" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-[#6B7686] uppercase tracking-wider mb-2">{subtitle}</p>
        <h3 className="text-lg font-bold text-[#E6EAF2] mb-2">{title}</h3>
        <p className="text-sm text-[#9AA4B2] mb-6 text-center h-5">{phase}</p>

        {/* Phase dots */}
        <div className="flex gap-1.5">
          {phases.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i <= phaseIdx ? 'bg-[#4F7CFF] scale-110' : 'bg-[#232A36]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};