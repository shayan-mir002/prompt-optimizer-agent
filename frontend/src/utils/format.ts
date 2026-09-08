// src/utils/format.ts
// Shared formatting helpers for the SaaS UI.

/** Format an integer with thousands separators. */
export function fmt(num: number | null | undefined): string {
  return (num ?? 0).toLocaleString('en-US');
}

/** Format a small dollar figure with 4-6 significant decimals. */
export function fmtMoney(num: number | null | undefined): string {
  const v = num ?? 0;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

/** Format a percentage. */
export function fmtPct(num: number | null | undefined): string {
  const v = num ?? 0;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}