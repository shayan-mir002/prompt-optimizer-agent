// src/components/layout/Header.tsx
import React from 'react';
import { Zap, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasResult }) => (
  <header className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur border-b border-[#1D242F]">
    <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#4F7CFF] flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <div>
          <span className="text-[13px] font-bold text-[#E6EAF2]">PromptForge</span>
          <p className="text-[10px] text-[#6B7686] leading-none mt-0.5">AI Prompt Optimization Agent</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {hasResult && (
          <button
            onClick={onReset}
            className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
          >
            <RotateCcw size={13} />
            New Prompt
          </button>
        )}
      </div>
    </div>
  </header>
);
