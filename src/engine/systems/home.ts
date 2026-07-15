// Home system (spec §3.10 / §5) — v0.1.1 rewrite. The lair is a HOUSING TIER (which
// sets item slots + optional rent/innate mods) plus EQUIPPABLE ITEMS. Pure engine
// (NO DOM/Svelte): runs in the browser tick, offline catch-up, the CLI, and tests.
//
// Everything a fixture used to do now flows through a single Modifier abstraction:
//   • kind 'max'  → effectiveCap(id)   = base cap + Σ matching max mods   (used EVERYWHERE a cap is read)
//   • kind 'rate' → effectiveRegen()   for vitals · homeEssenceBase() for elements · jobOutputMult() for jobs
//
// Circular note: this module and systems/tasks call each other (effectiveCap/jobOutputMult
// ← tasks; canAfford/applyAmounts/meetsRequirements ← home). Both sides only call across
// the boundary at RUNTIME (never at module top level), and the shared functions are
// hoisted declarations, so the ESM cycle resolves cleanly.

import {
  HOME_ITEM_BY_ID,
  HOME_TIER_BY_ID,
  type HomeTier,
  type Modifier,
  type ModTarget,
} from '../../content/home';
import { AMOUNT_LABEL, type VitalId } from '../../content/tasks';
import { ELEMENTS, type ElementId, type GameState, type ResourceId } from '../state';
import { logEvent } from './chronicle';
import { canAfford, applyAmounts, meetsRequirements } from './tasks';
import { outputMult } from './skills';

// Resources a `rate` Modifier may PRODUCE per second (Focusing Lens → insight, Homestead
// → ironOre/moonpetal, Mentor's Loft → insight). Renown is never a Modifier target.
const RESOURCE_TARGETS: ResourceId[] = ['gold', 'insight', 'moonpetal', 'ironOre', 'spiritDust'];

const VAGRANT: HomeTier = {
  id: 'vagrant',
  name: 'Vagrant',
  blurb: 'A patch of stable straw.',
  slots: 1,
  from: [],
};

/** The current housing tier (defaults to Vagrant for a partial/legacy save). */
export function homeTier(state: GameState): HomeTier {
  return HOME_TIER_BY_ID[state.run.home?.tier ?? 'vagrant'] ?? VAGRANT;
}

/** Item slots the current tier provides. */
export function homeSlots(state: GameState): number {
  return homeTier(state).slots;
}

/** Item slots currently occupied. */
export function homeSlotsUsed(state: GameState): number {
  return state.run.home?.equipped?.length ?? 0;
}

/** Every active Modifier right now: the current tier's innate mods + every equipped item's mods. */
export function activeMods(state: GameState): Modifier[] {
  const mods: Modifier[] = [];
  const tier = homeTier(state);
  if (tier.innate) mods.push(...tier.innate);
  for (const id of state.run.home?.equipped ?? []) {
    const item = HOME_ITEM_BY_ID[id];
    if (item) mods.push(...item.mods);
  }
  return mods;
}

/** Sum of active modifiers matching a target + kind. */
export function sumMods(state: GameState, target: ModTarget, kind: 'max' | 'rate'): number {
  let sum = 0;
  for (const m of activeMods(state)) {
    if (m.target === target && m.kind === kind) sum += m.amount;
  }
  return sum;
}

/** The EFFECTIVE storage cap for a resource: base cap + Σ matching `max` mods. Renown
 *  (and anything without a base cap) is uncapped → Infinity. This is THE cap read by
 *  tick.ts, systems/tasks.ts resourceCap(), and stores.ts — one source of truth. */
export function effectiveCap(state: GameState, id: ResourceId): number {
  const caps = state.run.caps as unknown as Record<string, number | undefined>;
  const base = caps?.[id];
  if (typeof base !== 'number') return Infinity; // Renown (no base cap) → uncapped
  return base + sumMods(state, id as ModTarget, 'max');
}

/** The EFFECTIVE per-second regen for a vital: base regen + Σ matching `rate` mods. */
export function effectiveRegen(state: GameState, vital: VitalId): number {
  return state.run.vitals[vital].regen + sumMods(state, vital, 'rate');
}

/** The Odd-Jobs output multiplier: 1 + Σ jobOutput `rate` mods (Tool Belt). */
export function jobOutputMult(state: GameState): number {
  return 1 + sumMods(state, 'jobOutput', 'rate');
}

function isElement(t: ModTarget): t is ElementId {
  return (ELEMENTS as string[]).includes(t);
}
function isResourceTarget(t: ModTarget): boolean {
  return (RESOURCE_TARGETS as string[]).includes(t);
}

/** Pre-multiplier per-second resource PRODUCTION contributed by Home (item/tier `rate`
 *  mods whose target is a resource — Focusing Lens → Insight, Homestead → ore/moonpetal). */
export function homeResourceRates(state: GameState): Partial<Record<ResourceId, number>> {
  const rates: Partial<Record<ResourceId, number>> = {};
  for (const m of activeMods(state)) {
    if (m.kind === 'rate' && isResourceTarget(m.target)) {
      const id = m.target as ResourceId;
      rates[id] = (rates[id] ?? 0) + m.amount;
    }
  }
  return rates;
}

/** A single named per-second `rate` contribution from Home, tagged with the NAME of its
 *  source (housing tier or equipped item). Used by the UI's sourced-number tooltips so a
 *  rate's "= A + B" breakdown reconciles with the shown total (which folds in home rates). */
export interface HomeRateContribution {
  name: string; // source label (tier name or item name)
  target: ModTarget;
  amount: number; // pre-multiplier per-second amount
}

/** Every active `rate` Modifier (tier innate + each equipped item) with its source name,
 *  for sourced-number tooltips. Sums identically to homeResourceRates/homeEssenceBase for
 *  a given target — same underlying mods — so tooltip parts reconcile with the header. */
export function homeRateContribs(state: GameState): HomeRateContribution[] {
  const out: HomeRateContribution[] = [];
  const tier = homeTier(state);
  if (tier.innate) {
    for (const m of tier.innate) if (m.kind === 'rate') out.push({ name: tier.name, target: m.target, amount: m.amount });
  }
  for (const id of state.run.home?.equipped ?? []) {
    const item = HOME_ITEM_BY_ID[id];
    if (!item) continue;
    for (const m of item.mods) if (m.kind === 'rate') out.push({ name: item.name, target: m.target, amount: m.amount });
  }
  return out;
}

/**
 * Pre-multiplier per-element essence trickle contributed by Home (tier innate + equipped
 * items whose mod target is an element — e.g. Hearth Stone → Fire). essence.ts merges
 * this into essenceBase() so the readout and the actual production share one source.
 */
export function homeEssenceBase(state: GameState): Partial<Record<ElementId, number>> {
  const base: Partial<Record<ElementId, number>> = {};
  for (const m of activeMods(state)) {
    if (m.kind === 'rate' && isElement(m.target)) {
      base[m.target] = (base[m.target] ?? 0) + m.amount;
    }
  }
  return base;
}

/** Awaken any element that now has a positive Home essence rate (equipped item or tier
 *  innate), logging each the first time. Idempotent — a re-call on an already-awakened
 *  element is a no-op. Called from equip/move actions AND defensively each tick. */
export function awakenHomeEssence(state: GameState): void {
  const base = homeEssenceBase(state);
  for (const el of Object.keys(base) as ElementId[]) {
    if ((base[el] ?? 0) > 0) {
      const ess = state.run.essence[el];
      if (ess && !ess.awakened) {
        ess.awakened = true;
        logEvent(state, `${AMOUNT_LABEL[el] ?? el} essence awakens — it begins to trickle.`, 'ev');
      }
    }
  }
}

/** Advance Home economy by dt (BEFORE the caps clamp, so production honours caps just
 *  like tasks do): first per-second resource PRODUCTION from `rate` mods (× the global
 *  output mult), then the current tier's RENT (clamped ≥0, no eviction). */
export function runHome(state: GameState, dt: number): void {
  const mult = outputMult(state);
  const rates = homeResourceRates(state);
  for (const id of Object.keys(rates) as ResourceId[]) {
    state.run.resources[id] = (state.run.resources[id] ?? 0) + (rates[id] ?? 0) * mult * dt;
  }
  const tier = homeTier(state);
  if (tier.rent) {
    for (const c of tier.rent) {
      if (c.pool !== 'resource') continue;
      const cur = state.run.resources[c.id as ResourceId] ?? 0;
      state.run.resources[c.id as ResourceId] = Math.max(0, cur - c.amount * dt);
    }
  }
}

// ---- actions (player / UI / CLI) ----
function ensureHome(state: GameState): GameState['run']['home'] {
  const run = state.run;
  if (!run.home || typeof run.home !== 'object') run.home = { tier: 'vagrant', owned: [], equipped: [] };
  if (!Array.isArray(run.home.owned)) run.home.owned = [];
  if (!Array.isArray(run.home.equipped)) run.home.equipped = [];
  return run.home;
}

/** Move to a housing tier: validate the from-chain + requirements + moveCost, pay it,
 *  set the tier, auto-unequip any items beyond the (possibly smaller) slot count, and
 *  awaken any tier-innate essence. Returns false (no mutation) if refused. */
export function moveHome(state: GameState, tierId: string): boolean {
  const home = ensureHome(state);
  const tier = HOME_TIER_BY_ID[tierId];
  if (!tier) return false;
  if (home.tier === tierId) return false;
  if (!tier.from.includes(home.tier)) return false; // from-chain gate
  if (!meetsRequirements(state, tier.requires)) return false;
  if (!canAfford(state, tier.moveCost, 1)) return false;

  applyAmounts(state, tier.moveCost, -1);
  home.tier = tier.id;
  if (home.equipped.length > tier.slots) home.equipped = home.equipped.slice(0, tier.slots);
  awakenHomeEssence(state);
  logEvent(state, `You move up in the world: ${tier.name}.`, 'ev');
  return true;
}

/** Buy an item (validate requirements + afford → pay → add to owned). */
export function buyItem(state: GameState, itemId: string): boolean {
  const home = ensureHome(state);
  const item = HOME_ITEM_BY_ID[itemId];
  if (!item) return false;
  if (home.owned.includes(itemId)) return false;
  if (!meetsRequirements(state, item.requires)) return false;
  if (!canAfford(state, item.cost, 1)) return false;

  applyAmounts(state, item.cost, -1);
  home.owned.push(itemId);
  logEvent(state, `Acquired: ${item.name}.`, 'ev');
  return true;
}

/** Equip an owned, not-yet-equipped item into a free slot; awaken essence if it grants
 *  an essence rate (Hearth Stone → Fire). */
export function equipItem(state: GameState, itemId: string): boolean {
  const home = ensureHome(state);
  const item = HOME_ITEM_BY_ID[itemId];
  if (!item) return false;
  if (!home.owned.includes(itemId)) return false;
  if (home.equipped.includes(itemId)) return false;
  if (home.equipped.length >= homeSlots(state)) return false; // no free slot

  home.equipped.push(itemId);
  awakenHomeEssence(state);
  logEvent(state, `Equipped: ${item.name}.`, 'ev');
  return true;
}

/** Unequip an equipped item, freeing its slot. */
export function unequipItem(state: GameState, itemId: string): boolean {
  const home = ensureHome(state);
  const i = home.equipped.indexOf(itemId);
  if (i < 0) return false;
  home.equipped.splice(i, 1);
  logEvent(state, `Unequipped: ${HOME_ITEM_BY_ID[itemId]?.name ?? itemId}.`);
  return true;
}
