// Autoplay bot (spec §3.15 / §4 DoD #10) — a SIMPLE heuristic that drives the SAME
// engine actions the UI/CLI expose toward a goal (v0.1: the Founding) and reports
// whether/when it got there. Pure engine + content imports (NO Svelte/DOM), like the
// rest of src/cli — the clean import is itself proof of the "no DOM in the engine"
// rule. Deterministic via a seed: same seed → same playthrough → same minute mark,
// so it doubles as a headless pacing/regression check for the §4 target.
//
// The policy is a greedy priority ladder re-evaluated every decision tick:
//   labour → spark → Study (for Insight) → cantrips → a contract (Renown + Gold)
//   → the Founding sinks (Charter, then Site) → Found the Academy.
// It never rebalances content — it only plays the numbers already in src/content.

import { newGame, type GameState } from '../engine/state';
import { advanceFixed } from '../engine/tick';
import {
  doTask,
  startTask,
  stopTask,
  taskInfo,
  slotsUsed,
  activitySlots,
} from '../engine/systems/tasks';
import { learnCantrip } from '../engine/systems/skills';
import { canFound, foundingSummaryLine } from '../engine/systems/founding';
import { TASK_BY_ID } from '../content/tasks';
import { CANTRIP_BY_ID } from '../content/cantrips';
import { FOUNDING } from '../content/config';

export interface AutoplayOptions {
  goal: 'founding';
  maxMin: number; // hard cap on simulated minutes before giving up
  seed?: number;
  stepSeconds?: number; // decision cadence (default 1s of sim time per decision)
}

export interface AutoplayEvent {
  atSec: number; // simulated-time seconds when the beat fired
  text: string;
}

export interface AutoplayResult {
  reached: boolean;
  atSec?: number; // sim-seconds at which `founded` flipped (undefined if never)
  timeline: AutoplayEvent[];
  finalState: GameState;
  simSeconds: number; // total simulated time elapsed
}

// The cantrips the bot pursues, cheapest → dearest. `umbral-whisper` is omitted: it
// costs more Insight than the starting cap holds (the `*` case) and Dark is not on
// the Founding path, so a lean run never needs it.
const WISHLIST = ['read-the-page', 'spark', 'mend', 'kindle-focus'];

// The continuous "engine" tasks the bot juggles across its Activity slots. Founding
// builds (charter/site/found) and fixtures are transient and managed separately.
const ENGINES = ['study', 'ward-a-barn', 'smith'];

// One-time, Gold-only upgrades the bot builds as lair setup before founding: Widen
// the Study (Activity slots 2→3) and the Grand Library (raises the Insight cap —
// exercises the caps mechanic). Both are material-free so setup never stalls.
const UPGRADES = ['widen-study', 'grand-library'];

const owned = (s: GameState, id: string): boolean => (s.run.skills ?? []).includes(id);
const built = (s: GameState, id: string): boolean => (s.run.tasks[id]?.count ?? 0) >= 1;

/** Still Insight-bound cantrips we can eventually afford (cost within the current cap)? */
function needsInsight(s: GameState): boolean {
  return WISHLIST.some((id) => !owned(s, id) && CANTRIP_BY_ID[id].cost <= s.run.caps.insight);
}

/** Lair setup finished — upgrades built and the wishlist cantrips learned. The bot
 *  only spends on the Founding once its lair is properly furnished. */
function setupComplete(s: GameState): boolean {
  return s.run.flags.lairFounded === true && UPGRADES.every((id) => built(s, id)) && !needsInsight(s);
}

/** Build the next affordable setup upgrade (one per tick, freeing a slot if needed). */
function buildUpgrades(s: GameState): void {
  for (const id of UPGRADES) {
    if (built(s, id)) continue;
    const info = taskInfo(s, TASK_BY_ID[id]);
    if (info.active) return; // one build in flight — let it finish
    if (info.locked || !info.affordable) continue; // gated or can't afford it yet
    if (ensureFreeSlot(s)) startTask(s, id);
    return;
  }
}

/** Free one Activity slot for a Founding build by stopping the least-valuable engine. */
function ensureFreeSlot(s: GameState): boolean {
  if (activitySlots(s) - slotsUsed(s) > 0) return true;
  for (const id of ['smith', 'study', 'ward-a-barn']) {
    if (s.run.tasks[id]?.active) {
      stopTask(s, id);
      return true;
    }
  }
  return false;
}

/** Keep the right engines running for the current phase, freeing slots by stopping
 *  ones we no longer want (Study once the cantrips are bought). */
function ensureEngines(s: GameState): void {
  const insightWanted = s.run.flags.awakened === true && needsInsight(s);
  const fireOn = s.run.essence.fire.awakened === true;
  // Smith only once we're not racing for Insight (it competes for Stamina with Study
  // before Mend lands); ward-a-barn is our best Gold engine AND the only Renown source.
  const wantSmith = !insightWanted || fireOn;

  const desired: string[] = [];
  if (fireOn) desired.push('ward-a-barn');
  if (insightWanted) desired.push('study');
  if (wantSmith) desired.push('smith');

  // Stop any active engine we no longer want, freeing its slot for a desired one.
  for (const id of ENGINES) {
    if (s.run.tasks[id]?.active && !desired.includes(id)) stopTask(s, id);
  }
  // Start desired engines in priority order while slots (and affordability) allow.
  for (const id of desired) {
    const info = taskInfo(s, TASK_BY_ID[id]);
    if (!info.active && info.startable) startTask(s, id);
  }
}

/** One decision tick: greedy priority ladder over the existing engine actions. */
function act(s: GameState): void {
  const f = s.run.flags;

  // 1. Found the moment the gate is open (freeing a slot for the finale build).
  if (canFound(s)) {
    if (ensureFreeSlot(s)) startTask(s, 'found-academy');
    return;
  }

  // 2. Learn wishlist cantrips (each call is a no-op if prereqs/Insight aren't ready).
  for (const id of WISHLIST) if (!owned(s, id)) learnCantrip(s, id);

  // 3. Furnish the lair: build the setup upgrades before spending on the Founding.
  if (f.lairFounded) buildUpgrades(s);

  // 4. Once set up, buy the Founding sinks — Charter first (cheaper, needs a little
  //    Renown), then the Site (the big Gold sink). Each briefly needs a free slot.
  const gold = s.run.resources.gold;
  const renown = s.run.resources.renown;
  if (setupComplete(s)) {
    const charter = taskInfo(s, TASK_BY_ID['secure-charter']);
    if (!f.hasCharter && !charter.active && renown >= FOUNDING.charterRenown && gold >= FOUNDING.charterCost) {
      if (ensureFreeSlot(s)) startTask(s, 'secure-charter');
    }
    const site = taskInfo(s, TASK_BY_ID['claim-site']);
    if (f.hasCharter && !f.hasSite && !site.active && gold >= FOUNDING.siteCost) {
      if (ensureFreeSlot(s)) startTask(s, 'claim-site');
    }
  }

  // 5. Keep the phase-appropriate engines running.
  ensureEngines(s);

  // 6. Instant Gold filler: clean stables while Stamina has headroom (never starving
  //    the per-second running costs of the continuous engines).
  if (s.run.vitals.stamina.cur >= 4 && taskInfo(s, TASK_BY_ID['clean-stables']).startable) {
    doTask(s, 'clean-stables');
  }
}

/** Emit one-shot milestone beats as flags/skills/essence transition. */
function recordBeats(s: GameState, seen: Set<string>, timeline: AutoplayEvent[]): void {
  const push = (key: string, text: string): void => {
    if (!seen.has(key)) {
      seen.add(key);
      // Round off the 0.1s-tick summation noise so the timeline reads cleanly.
      timeline.push({ atSec: +s.playtime.toFixed(1), text });
    }
  };
  if (s.run.flags.awakened) push('spark', 'The spark — you awaken; Study opens.');
  for (const id of s.run.skills ?? []) push(`learn:${id}`, `Learned ${CANTRIP_BY_ID[id]?.name ?? id}.`);
  if (s.run.essence.fire.awakened) push('fire', 'Fire essence awakens — contracts become possible.');
  if (s.run.flags.lairFounded) push('lair', 'Claimed a lair — Home opens (fixtures + the Founding).');
  if (s.run.tasks['ward-a-barn']?.active) push('ward', 'Took a contract: Ward a Barn (Renown + Gold).');
  if (built(s, 'widen-study')) push('widen', 'Widened the Study — a 3rd Activity slot.');
  if (built(s, 'grand-library')) push('library', 'Raised the Grand Library — Insight cap lifts.');
  if (s.run.resources.renown >= FOUNDING.renown) push('renown', `Renown reaches ${FOUNDING.renown}.`);
  if (s.run.flags.hasCharter) push('charter', 'Secured a Guild Charter.');
  if (s.run.flags.hasSite) push('site', 'Claimed the Ruined Tower (Site).');
  if (s.run.flags.founded) push('founded', 'FOUNDED — the Academy stands. Act I complete.');
}

/**
 * Run the bot to the goal (or the time cap). Deterministic for a given seed +
 * stepSeconds. Advances in fixed TICK steps between decisions (via advanceFixed), so
 * the bot's sim is bit-for-bit consistent with live play, offline catch-up, and tests.
 */
export function autoplay(opts: AutoplayOptions): AutoplayResult {
  const s = opts.seed === undefined || Number.isNaN(opts.seed) ? newGame() : newGame(opts.seed);
  const dt = opts.stepSeconds && opts.stepSeconds > 0 ? opts.stepSeconds : 1;
  const maxSec = opts.maxMin * 60;
  const timeline: AutoplayEvent[] = [];
  const seen = new Set<string>();

  recordBeats(s, seen, timeline); // capture any t=0 beats (e.g. starting chronicle)
  while (s.playtime < maxSec && s.run.flags.founded !== true) {
    act(s);
    advanceFixed(s, dt);
    recordBeats(s, seen, timeline);
  }

  const reached = s.run.flags.founded === true;
  const founding = timeline.find((e) => e.text.startsWith('FOUNDED'));
  return {
    reached,
    atSec: reached ? founding?.atSec ?? s.playtime : undefined,
    timeline,
    finalState: s,
    simSeconds: s.playtime,
  };
}

/** A one-line status when the bot fails to reach the goal (for the CLI + tests). */
export function autoplayFailLine(res: AutoplayResult): string {
  return `stalled at ${(res.simSeconds / 60).toFixed(1)} min — ${foundingSummaryLine(res.finalState)}`;
}
