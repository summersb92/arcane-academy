// Fixed-timestep simulation. Pure functions over GameState — NO DOM, NO Svelte,
// so the same step() runs in the browser rAF loop, in `simulate()` for tests, and
// in the CLI headlessly. The real-time driver (requestAnimationFrame) lives in the UI.

import type { GameState } from './state';
import { runTasks } from './systems/tasks';
import { runEssence } from './systems/essence';
import { runProgression } from './systems/progression';

export const TICK = 0.1; // seconds per fixed step
export const MAX_CATCHUP_STEPS = 100_000; // bounds a single advance()

/**
 * Advance the whole game by `dt` seconds. Systems run in order and scale by dt,
 * so a 0.1s live tick, a coarse 1s offline step, and a test step all stay consistent.
 */
export function step(state: GameState, dt: number): void {
  const run = state.run;

  // --- tasks (the Task/Activity system drives all production; runs before caps) ---
  runTasks(state, dt);

  // --- essence (cantrip-awakened per-element trickle; not capped in v0.1) ---
  runEssence(state, dt);

  // --- caps ---
  if (run.resources.insight > run.caps.insight) run.resources.insight = run.caps.insight;

  // --- vital regen ---
  regen(run.vitals.stamina, dt);
  regen(run.vitals.mana, dt);
  regen(run.vitals.life, dt);

  state.playtime += dt;

  // --- progression (the spark & later era beats; checked after time advances) ---
  runProgression(state);
}

function regen(v: { cur: number; max: number; regen: number }, dt: number): void {
  if (v.cur < v.max) v.cur = Math.min(v.max, v.cur + v.regen * dt);
}

/**
 * THE non-realtime stepping routine. Advances `state` by exactly `seconds` in
 * fixed TICK-sized steps (plus a final sub-TICK remainder), so a long advance is
 * NEVER collapsed into one oversized step — timed tasks, auto-pause, and regen all
 * behave identically to fine-grained live play. Both `simulate()` (test/CLI
 * fast-forward) and offline catch-up route through here, keeping them bit-for-bit
 * consistent (see offline.ts).
 *
 * There is NO iteration cap here: this is the *intentional* fast-forward, not the
 * live-loop spiral guard (that lives in createAccumulator's MAX_CATCHUP_STEPS).
 * Callers bound the DURATION instead — offline by OFFLINE_CAP_MS, the CLI by its arg.
 */
export function advanceFixed(state: GameState, seconds: number): void {
  if (seconds <= 0 || !Number.isFinite(seconds)) return;
  // +epsilon so a clean multiple (e.g. 10800/0.1) floors to the exact tick count
  // instead of one-short from 0.1's binary representation.
  const whole = Math.floor(seconds / TICK + 1e-9);
  for (let i = 0; i < whole; i++) step(state, TICK);
  const remainder = seconds - whole * TICK;
  if (remainder > 1e-9) step(state, remainder);
}

/**
 * Headless deterministic fast-forward: run `seconds` in exact TICK increments.
 * Returns the same state object (mutated) for convenience.
 */
export function simulate(state: GameState, seconds: number): GameState {
  advanceFixed(state, seconds);
  return state;
}

/**
 * A DOM-agnostic fixed-timestep accumulator. The caller feeds elapsed wall-seconds
 * (e.g. from performance.now() in an rAF loop); it dispatches whole TICK steps.
 */
export function createAccumulator(): { advance(state: GameState, elapsedSeconds: number): number } {
  let acc = 0;
  return {
    advance(state: GameState, elapsedSeconds: number): number {
      acc += elapsedSeconds;
      let n = 0;
      while (acc >= TICK && n < MAX_CATCHUP_STEPS) {
        step(state, TICK);
        acc -= TICK;
        n++;
      }
      return n;
    },
  };
}
