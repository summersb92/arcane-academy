// Display formatting for the UI. T-002 introduces the canonical notation engine
// in src/engine/format.ts (shared with the CLI); this module re-points to it then.

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** Compact suffix notation, e.g. 1900 -> "1.9K". */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const neg = n < 0;
  let v = Math.abs(n);
  if (v < 1000) {
    const s = v >= 100 || Number.isInteger(v) ? Math.round(v).toString() : v.toFixed(1);
    return neg ? `-${s}` : s;
  }
  let tier = 0;
  while (v >= 1000 && tier < SUFFIXES.length - 1) {
    v /= 1000;
    tier++;
  }
  const s = `${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)}${SUFFIXES[tier]}`;
  return neg ? `-${s}` : s;
}

/** Signed per-second rate, e.g. "+2.1/s". Empty string when zero. */
export function fmtRate(n: number): string {
  if (!n) return '';
  return `${n > 0 ? '+' : ''}${fmt(n)}/s`;
}
