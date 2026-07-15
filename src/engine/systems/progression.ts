// Progression system — the tabs-as-eras unfold (spec §3.12). Pure engine, NO
// DOM/Svelte, so the spark fires identically in the live loop, offline catch-up,
// the CLI, and tests (all route through tick.step → runProgression).
//
// v0.1 owns exactly ONE beat: the spark (Origin → Awakening). It sets the
// `awakened` flag (which reveals the Skills tab and un-gates Study + the cantrip
// web) and advances the phase. T-006 EXTENDS this file with the later transitions
// (lair → the Founding) — add them as sibling checks in runProgression().

import { SPARK } from '../../content/config';
import type { GameState } from '../state';
import { logEvent } from './chronicle';

/** Has the mage awakened? The canonical gate the UI + Study requirement read. */
export function isAwakened(state: GameState): boolean {
  return state.run.flags.awakened === true;
}

/** Fire the spark: flip the flag, advance the phase, and mark the moment in the Chronicle. */
function fireSpark(state: GameState): void {
  state.run.flags.awakened = true;
  if (state.run.phase === 'origin') state.run.phase = 'awakened';
  logEvent(state, 'You sound out the torn page by candlelight. The words… move.', 'found');
}

/**
 * Run once per tick. The spark fires the first moment EITHER trigger is met —
 * Gold reaches the threshold OR the timer elapses — guaranteeing a purely idle
 * player still awakens. Idempotent: once `awakened`, this is a cheap no-op.
 */
export function runProgression(state: GameState): void {
  if (isAwakened(state)) return;
  if ((state.run.resources.gold ?? 0) >= SPARK.goldThreshold || state.playtime >= SPARK.timerSeconds) {
    fireSpark(state);
  }
}
