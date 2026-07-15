// Progression system — the tabs-as-eras unfold (spec §3.12). Pure engine, NO
// DOM/Svelte, so every beat fires identically in the live loop, offline catch-up,
// the CLI, and tests (all route through tick.step → runProgression).
//
// The Act I beats, in order (each idempotent — a cheap flag-guarded no-op once done):
//   1. the spark   (Origin → Awakening)  — reveals Skills + un-gates Study
//   2. the lair    (Awakening → Hedge-Mage) — reveals the Home tab (fixtures + Founding)
//   3. the Founding (Hedge-Mage → Founded)  — set by the found-academy task; flips phase
//                                             + writes the celebratory finale, un-greys Academy
// Plus a couple of one-shot Chronicle NUDGES (spec §3.14 light guidance — no tutorial).

import { LAIR, SPARK } from '../../content/config';
import type { GameState } from '../state';
import { logEvent } from './chronicle';
import { foundingStatus, foundingSummaryLine } from './founding';

const EPS = 1e-9;

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

/** The spark fires the first moment EITHER trigger is met — Gold threshold OR the
 *  timer — guaranteeing a purely idle player still awakens. */
function checkSpark(state: GameState): void {
  if ((state.run.resources.gold ?? 0) >= SPARK.goldThreshold || state.playtime >= SPARK.timerSeconds) {
    fireSpark(state);
  }
}

/** The lair beat: post-spark, once you have a little coin OR your first cantrip, you
 *  claim a corner as a lair — revealing the Home tab (fixtures + the Founding card). */
function checkLair(state: GameState): void {
  if (state.run.flags.lairFounded) return;
  const earnedSomething = (state.run.resources.gold ?? 0) >= LAIR.goldThreshold || (state.run.skills?.length ?? 0) >= 1;
  if (!earnedSomething) return;
  state.run.flags.lairFounded = true;
  if (state.run.phase === 'awakened') state.run.phase = 'lair';
  logEvent(
    state,
    'You sweep out a corner of the hay-loft and call it a lair. (Home unlocked — furnish it, take contracts, and one day found an Academy.)',
    'found',
  );
}

/** The Founding finale: the found-academy task sets `founded`; here we flip the phase
 *  and write the defining beat, which un-greys the Academy tab (per toView). */
function checkFounding(state: GameState): void {
  if (state.run.flags.founded === true && state.run.phase !== 'founded') {
    state.run.phase = 'founded';
    logEvent(
      state,
      'By charter and by will, you found your Academy. The valley has a school of magic — and you are its Headmaster. (Act II arrives in v0.2.)',
      'found',
    );
  }
}

/** One-shot Chronicle nudges (spec §3.14 — minimal, never nagging). Each is guarded
 *  by its own flag so it appears exactly once; the always-visible Home Founding card
 *  carries the live progress. */
function runHints(state: GameState): void {
  const f = state.run.flags;

  // Insight pinned at its cap with things to spend it on → point at the sinks.
  if (
    !f.hintInsightFull &&
    isAwakened(state) &&
    state.run.caps.insight > 0 &&
    (state.run.resources.insight ?? 0) >= state.run.caps.insight - EPS
  ) {
    f.hintInsightFull = true;
    logEvent(state, 'Insight is full — spend it: learn a cantrip, or raise the cap with the Grand Library.', 'ev');
  }

  // Founding partly met → surface the one-line "what's left" (once).
  if (!f.hintFounding && f.lairFounded === true) {
    const st = foundingStatus(state);
    if (st.metCount >= 1 && !st.allMet) {
      f.hintFounding = true;
      logEvent(state, `Toward the Founding — ${foundingSummaryLine(state)}. (Track it on Home.)`, 'ev');
    }
  }
}

/**
 * Run once per tick. Spark only checked while unawakened; the later beats + hints
 * carry their own guards, so this stays a cheap no-op once each has fired.
 */
export function runProgression(state: GameState): void {
  if (!isAwakened(state)) checkSpark(state);
  checkLair(state);
  checkFounding(state);
  runHints(state);
}
