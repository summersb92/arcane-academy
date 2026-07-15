// Home system (spec §3.10 / §5) — turns built Home fixtures into their passive
// bonuses. Pure engine (NO DOM/Svelte): runs in the browser tick, offline catch-up,
// the CLI, and tests. A fixture's LEVEL is the completion `count` of its Limited
// build-task (single source of truth — no separate stored level to drift), so this
// system only READS state; the Task system owns the mutation on completion.
//
// Two derived contributions, both folded into the ONE place their kind already sums:
//   • essence  → homeEssenceBase() is merged by essence.ts into essenceBase()
//   • Insight  → runHome() adds the Study Desk's +Insight/s each tick (before the cap
//     clamp in tick.step), mirroring how tasks feed production.

import { FIXTURES } from '../../content/home';
import type { ElementId, GameState } from '../state';
import { outputMult } from './skills';

/** A fixture's level = its build-task's completion count (0 if never built). */
export function fixtureLevel(state: GameState, id: string): number {
  return state.run.tasks?.[id]?.count ?? 0;
}

/**
 * Pre-multiplier per-element trickle contributed by Home fixtures (Hearth → Fire,
 * Ossuary → Dark), summed by level. essence.ts merges this into essenceBase() so
 * the Character panel readout and the actual production come from one source.
 */
export function homeEssenceBase(state: GameState): Partial<Record<ElementId, number>> {
  const base: Partial<Record<ElementId, number>> = {};
  for (const f of FIXTURES) {
    if (!f.essencePerLevel) continue;
    const lvl = fixtureLevel(state, f.id);
    if (lvl > 0) {
      const el = f.essencePerLevel.element;
      base[el] = (base[el] ?? 0) + f.essencePerLevel.amount * lvl;
    }
  }
  return base;
}

/** Per-second Insight from Home fixtures (Study Desk), with the global output
 *  multiplier folded in — consistent with task output and the essence trickle. */
export function homeInsightPerSec(state: GameState): number {
  let base = 0;
  for (const f of FIXTURES) {
    if (f.insightPerLevel) base += f.insightPerLevel * fixtureLevel(state, f.id);
  }
  return base * outputMult(state);
}

/** Advance Home's passive Insight production by dt. Called by tick.step BEFORE the
 *  Insight cap clamp, so a Study Desk honours the cap exactly like Study does. */
export function runHome(state: GameState, dt: number): void {
  const add = homeInsightPerSec(state) * dt;
  if (add > 0) state.run.resources.insight += add;
}
