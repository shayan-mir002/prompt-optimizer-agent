// src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  value: number;      // raw value
  max?: number;       // scale (default 100)
  label?: string;
  tone?: 'accent' | 'emerald' | 'amber' | 'rose' | 'neutral';
  showValue?: boolean;
  suffix?: string;
}

const fillMap = {
  accent:  'linear-gradient(90deg, #4F7CFF, #7BA2FF)',
  emerald: 'linear-gradient(90deg, #1E9B64, #2FB67B)',
  amber:   'linear-gradient(90deg, #C7912E, #E0A93B)',
  rose:    'linear-gradient(90deg, #C54B63, #E5677E)',
  neutral: 'linear-gradient(90deg, #3A4659, #546179)',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, tone = 'accent', showValue = true, suffix = '',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-[0.8rem] text-[#9AA4B2]">{label}</span>}
          {showValue && (
            <span className="text-[0.8rem] font-semibold text-[#E6EAF2] metric-number">
              {value.toFixed(1)}{suffix || (max === 100 ? '%' : '')}
            </span>
          )}
        </div>
      )}
      <div className="track">
        <div className="track-fill" style={{ width: `${pct}%`, background: fillMap[tone] }} />
      </div>
    </div>
  );
};