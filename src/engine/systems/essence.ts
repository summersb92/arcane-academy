// Essence system — the passive per-element trickle that awakening a cantrip starts
// (spec §3.8 / §5). Pure engine (NO DOM/Svelte). Runs each tick alongside the Task
// system: tasks can also grant essence on completion (runTasks), while THIS supplies
// the always-on trickle owned via cantrips (and, in T-006, Home fixtures).
//
// Rates are DERIVED from owned cantrips, not stored — so a reload replays the exact
// same trickle, and the Character panel's readout and the actual production come from
// one source of truth (essenceRates), keeping them impossible to drift apart.

import { CANTRIP_BY_ID } from '../../content/cantrips';
import type { ElementId, GameState } from '../state';
import { outputMult } from './skills';

/**
 * Pre-multiplier trickle each awakened element receives, summed from the owned
 * cantrips that awakened it. Only awakened elements appear. (T-006 adds Home
 * fixture contributions here — Hearth → fire, Ossuary → dark.)
 */
export function essenceBase(state: GameState): Partial<Record<ElementId, number>> {
  const base: Partial<Record<ElementId, number>> = {};
  for (const id of state.run.skills ?? []) {
    const def = CANTRIP_BY_ID[id];
    if (!def) continue;
    for (const e of def.effects) {
      if (e.kind === 'awaken' && state.run.essence[e.element]?.awakened) {
        base[e.element] = (base[e.element] ?? 0) + e.trickle;
      }
    }
  }
  return base;
}

/** Per-second essence production per element, with the global output multiplier folded in. */
export function essenceRates(state: GameState): Partial<Record<ElementId, number>> {
  const mult = outputMult(state);
  const base = essenceBase(state);
  const rates: Partial<Record<ElementId, number>> = {};
  for (const key of Object.keys(base) as ElementId[]) {
    rates[key] = (base[key] ?? 0) * mult;
  }
  return rates;
}

/** Advance every awakened element's essence by its trickle × dt. Called by tick.step. */
export function runEssence(state: GameState, dt: number): void {
  const rates = essenceRates(state);
  for (const key of Object.keys(rates) as ElementId[]) {
    state.run.essence[key].amount += (rates[key] ?? 0) * dt;
  }
}
