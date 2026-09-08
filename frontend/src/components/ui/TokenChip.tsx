// src/components/ui/TokenChip.tsx
import React from 'react';
import { Hash, Layers } from 'lucide-react';
import { fmt } from '../../utils/format';

/**
 * A labelled token-count chip. `kind` distinguishes the two meanings:
 *  - "prompt"  → tokens in the actual prompt text
 *  - "compute" → tokens the LLM consumed generating things (work cost)
 */
interface TokenChipProps {
  count: number;
  label?: string;
  kind?: 'prompt' | 'compute';
}

export const TokenChip: React.FC<TokenChipProps> = ({ count, label, kind = 'prompt' }) => {
  const Icon = kind === 'compute' ? Layers : Hash;
  return (
    <span
      className="badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]"
      title={kind === 'compute'
        ? 'Tokens the optimizer model consumed to produce the result'
        : 'Tokens that make up the prompt text itself'}
    >
      <Icon size={11} />
      {label && <span className="text-[#6B7686] font-medium">{label}</span>}
      <span className="font-mono text-[#C6CDD9] font-semibold">{fmt(count)}</span>
    </span>
  );
};