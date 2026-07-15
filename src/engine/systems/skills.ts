// Cantrip / Skills system — the Insight-bought DAG (spec §5). Pure engine
// (NO DOM/Svelte): the same code runs in the browser, the CLI, and tests.
//
// Responsibilities:
//   • learnCantrip(id)                 — player/CLI/UI action: spend Insight → own it → apply effects
//   • outputMult(state)                — the global "+X% all output" multiplier from owned cantrips
//   • derived read model               — cantripInfo / listCantripInfo for the UI/CLI (no display strings)
//
// Owned cantrip ids live in state.run.skills (a plain string[]); the definitions
// live in src/content/cantrips.ts. Awakening an element flips essence[id].awakened
// and, from then on, essence.ts derives that element's trickle from the owned cantrip.

import { CANTRIPS, CANTRIP_BY_ID, type Cantrip } from '../../content/cantrips';
import { AMOUNT_LABEL } from '../../content/tasks';
import type { ElementId, GameState } from '../state';
import { logEvent } from './chronicle';

const EPS = 1e-9;

/** Is this cantrip already owned? */
export function isLearned(state: GameState, id: string): boolean {
  return (state.run.skills ?? []).includes(id);
}

/** Are every prerequisite cantrip owned (the DAG gate)? */
function prereqsMet(state: GameState, def: Cantrip): boolean {
  return def.requires.every((r) => isLearned(state, r));
}

/** The cost sits above the current Insight cap → it can never be afforded until the cap rises. */
export function exceedsCap(state: GameState, def: Cantrip): boolean {
  return def.cost > state.run.caps.insight + EPS;
}

/** Global output multiplier: 1 + Σ(owned outputMult cantrips). Applied to task output AND essence trickle. */
export function outputMult(state: GameState): number {
  let m = 1;
  for (const id of state.run.skills ?? []) {
    const def = CANTRIP_BY_ID[id];
    if (!def) continue;
    for (const e of def.effects) if (e.kind === 'outputMult') m += e.add;
  }
  return m;
}

function applyCantripEffect(state: GameState, e: Cantrip['effects'][number]): void {
  switch (e.kind) {
    case 'awaken': {
      const ess = state.run.essence[e.element];
      if (ess) ess.awakened = true;
      logEvent(state, `${AMOUNT_LABEL[e.element] ?? e.element} essence awakens — it begins to trickle.`, 'ev');
      break;
    }
    case 'vitalRegen':
      state.run.vitals[e.vital].regen += e.amount;
      break;
    case 'flag':
      state.run.flags[e.flag] = true;
      break;
    // outputMult + openTree are derived/flavour — nothing to persist at learn time.
    case 'outputMult':
    case 'openTree':
      break;
  }
}

/**
 * Learn a cantrip: DAG prereqs met, not already owned, and enough Insight (which by
 * definition fits under the cap). Spends the Insight, records the id, applies effects.
 * Returns false (no mutation) if refused.
 */
export function learnCantrip(state: GameState, id: string): boolean {
  const def = CANTRIP_BY_ID[id];
  if (!def) return false;
  if (isLearned(state, id)) return false;
  if (!prereqsMet(state, def)) return false;
  if (state.run.resources.insight < def.cost - EPS) return false;

  state.run.resources.insight -= def.cost;
  if (!state.run.skills) state.run.skills = [];
  state.run.skills.push(id);
  for (const e of def.effects) applyCantripEffect(state, e);
  logEvent(state, `Learned cantrip: ${def.name}.`, 'ev');
  return true;
}

// ---- derived read model (no display glyphs — the UI/CLI format these) ----
export type CantripStatus = 'owned' | 'available' | 'locked';

export interface CantripInfo {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  requires: string[];
  status: CantripStatus;
  affordable: boolean; // Insight ≥ cost right now
  exceedsCap: boolean; // cost > Insight cap → wears the `*` marker
  missingPrereqs: string[]; // unmet prereq ids (names resolved by the UI)
  awakensElement?: ElementId; // set when an effect awakens an essence
  effectText: string; // engine-side human summary ("awakens Fire essence (+0.2/s)")
}

function effectText(def: Cantrip): string {
  const parts = def.effects
    .map((e) => {
      switch (e.kind) {
        case 'awaken':
          return `awakens ${AMOUNT_LABEL[e.element] ?? e.element} essence (+${e.trickle}/s)`;
        case 'vitalRegen':
          return `+${e.amount} ${AMOUNT_LABEL[e.vital] ?? e.vital} regen`;
        case 'outputMult':
          return `+${Math.round(e.add * 100)}% all output`;
        case 'openTree':
          return 'opens the cantrip web';
        case 'flag':
          return `unlocks ${e.flag}`;
      }
    })
    .filter(Boolean);
  return parts.join(' · ');
}

export function cantripInfo(state: GameState, def: Cantrip): CantripInfo {
  const owned = isLearned(state, def.id);
  const missingPrereqs = def.requires.filter((r) => !isLearned(state, r));
  const status: CantripStatus = owned ? 'owned' : missingPrereqs.length ? 'locked' : 'available';
  const awakensElement = def.effects.find((e) => e.kind === 'awaken') as
    | { kind: 'awaken'; element: ElementId; trickle: number }
    | undefined;
  return {
    id: def.id,
    name: def.name,
    blurb: def.blurb,
    cost: def.cost,
    requires: def.requires,
    status,
    affordable: state.run.resources.insight >= def.cost - EPS,
    exceedsCap: exceedsCap(state, def),
    missingPrereqs,
    awakensElement: awakensElement?.element,
    effectText: effectText(def),
  };
}

export function listCantripInfo(state: GameState): CantripInfo[] {
  return CANTRIPS.map((def) => cantripInfo(state, def));
}
