// src/utils/diff.ts
// Lightweight word-level LCS diff for the raw vs optimized prompt view.

export type DiffTokenType = 'common' | 'added' | 'removed';

export interface DiffToken {
  text: string;
  type: DiffTokenType;
}

export interface WordDiff {
  removed: DiffToken[];
  added: DiffToken[];
}

function tokenize(text: string): string[] {
  // Keep whitespace tokens so word boundaries and line breaks survive.
  return text.split(/(\s+)/).filter(Boolean);
}

export function diffWords(before: string, after: string): WordDiff {
  const A = tokenize(before);
  const B = tokenize(after);
  const m = A.length;
  const n = B.length;

  // LCS dynamic-programming table (bottom-up).
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const removed: DiffToken[] = [];
  const added: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      removed.push({ text: A[i], type: 'common' });
      added.push({ text: B[j], type: 'common' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removed.push({ text: A[i], type: 'removed' });
      i++;
    } else {
      added.push({ text: B[j], type: 'added' });
      j++;
    }
  }
  while (i < m) {
    removed.push({ text: A[i], type: 'removed' });
    i++;
  }
  while (j < n) {
    added.push({ text: B[j], type: 'added' });
    j++;
  }

  return { removed, added };
}
