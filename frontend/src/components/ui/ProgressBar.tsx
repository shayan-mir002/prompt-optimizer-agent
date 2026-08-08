// src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  value: number;      // 0–100
  max?: number;
  label?: string;
  color?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
  showValue?: boolean;
  animated?: boolean;
}

const colorMap = {
  indigo:  'from-indigo-500 to-indigo-400',
  cyan:    'from-cyan-500 to-cyan-400',
  emerald: 'from-emerald-500 to-emerald-400',
  amber:   'from-amber-500 to-amber-400',
  rose:    'from-rose-500 to-rose-400',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, color = 'indigo', showValue = true, animated = true,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-slate-300">{value.toFixed(1)}{max === 100 ? '%' : ''}</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]} ${animated ? 'progress-bar-fill' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
