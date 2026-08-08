// src/components/layout/Header.tsx
import React from 'react';
import { Zap, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasResult }) => (
  <header className="sticky top-0 z-50 glass border-b border-white/5">
    <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 blur opacity-30 -z-10" />
        </div>
        <div>
          <span className="text-base font-bold gradient-text">PromptForge</span>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">AI Prompt Optimization Agent</p>
        </div>
      </div>

      {/* Status + Reset */}
      <div className="flex items-center gap-4">
        {hasResult && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <RotateCcw size={13} />
            New Prompt
          </button>
        )}
      </div>
    </div>
  </header>
);
