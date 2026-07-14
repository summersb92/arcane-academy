// Offline catch-up. On load, simulate the elapsed time (capped) and report the
// gains for a "While you were away…" summary. No DOM, no Svelte.

import { OFFLINE_CAP_MS } from '../content/config';
import type { GameState, ResourceId } from './state';
import { step } from './tick';

export interface OfflineSummary {
  elapsedMs: number; // real time elapsed since lastSaved
  appliedMs: number; // time actually simulated (after the cap)
  capped: boolean;
  gains: Partial<Record<ResourceId, number>>;
}

const COARSE_DT = 1; // 1s steps: linear generators are exact, and 12h stays fast

/**
 * Advance `state` by the (capped) time since `lastSaved`. Mutates state, bumps
 * lastSaved to `now`, and returns a summary. Safe for zero/negative elapsed.
 */
export function applyOffline(state: GameState, now: number = Date.now()): OfflineSummary {
  const rawElapsed = Math.max(0, now - state.lastSaved);
  const appliedMs = Math.min(rawElapsed, OFFLINE_CAP_MS);
  const before = { ...state.run.resources };

  let remaining = appliedMs / 1000;
  while (remaining > 1e-9) {
    const dt = Math.min(COARSE_DT, remaining);
    step(state, dt);
    remaining -= dt;
  }
  state.lastSaved = now;

  const gains: Partial<Record<ResourceId, number>> = {};
  for (const key of Object.keys(before) as ResourceId[]) {
    const delta = state.run.resources[key] - before[key];
    if (Math.abs(delta) > 1e-9) gains[key] = delta;
  }

  return {
    elapsedMs: rawElapsed,
    appliedMs,
    capped: rawElapsed > OFFLINE_CAP_MS,
    gains,
  };
}
