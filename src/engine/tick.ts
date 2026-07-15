// Fixed-timestep simulation. Pure functions over GameState — NO DOM, NO Svelte,
// so the same step() runs in the browser rAF loop, in `simulate()` for tests, and
// in the CLI headlessly. The real-time driver (requestAnimationFrame) lives in the UI.

import type { GameState } from './state';
import { runTasks } from './systems/tasks';

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

  // --- caps ---
  if (run.resources.insight > run.caps.insight) run.resources.insight = run.caps.insight;

  // --- vital regen ---
  regen(run.vitals.stamina, dt);
  regen(run.vitals.mana, dt);
  regen(run.vitals.life, dt);

  state.playtime += dt;
}

function regen(v: { cur: number; max: number; regen: number }, dt: number): void {
  if (v.cur < v.max) v.cur = Math.min(v.max, v.cur + v.regen * dt);
}

/**
 * Headless deterministic fast-forward: run `seconds` in exact TICK increments.
 * Returns the same state object (mutated) for convenience.
 */
export function simulate(state: GameState, seconds: number): GameState {
  if (seconds <= 0) return state;
  let steps = Math.floor(seconds / TICK);
  if (steps > MAX_CATCHUP_STEPS) steps = MAX_CATCHUP_STEPS;
  for (let i = 0; i < steps; i++) step(state, TICK);
  const remainder = seconds - steps * TICK;
  if (remainder > 1e-9) step(state, remainder);
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
