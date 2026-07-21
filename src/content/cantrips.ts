// Cantrip content — the Skills DAG (spec §5), bought with Insight ◈. Pure data,
// framework-agnostic (imported by the engine + CLI; only a type-only import of the
// state ids, so there is no runtime cycle). The engine system in
// src/engine/systems/skills.ts interprets these; the UI/CLI only format them.
//
// A cantrip is a node in a directed acyclic graph: `requires` lists prerequisite
// cantrip ids that must be owned first. Learning one spends `cost` Insight (which
// must fit under the current Insight cap — a cost above the cap shows the `*`
// marker until the Grand Library raises it) and applies its `effects` once.

import type { ElementId } from '../engine/state';
import type { VitalId } from './tasks';

/** One applied consequence of learning a cantrip. */
export type CantripEffect =
  | { kind: 'openTree' } // Read the Page — flavour node that opens the web (no mechanical payload)
  | { kind: 'awaken'; element: ElementId; trickle: number } // awaken a FIXED essence + start its per-second trickle
  | { kind: 'awakenAffinity'; trickle: number } // awaken your DOMINANT affinity element (v0.1.4) + start its trickle
  | { kind: 'vitalRegen'; vital: VitalId; amount: number } // permanent +regen to a vital
  | { kind: 'unlockVital'; vital: VitalId; max: number; regen: number } // unlock a locked vital (sets its max + regen)
  | { kind: 'outputMult'; add: number } // global output multiplier (+0.10 = +10% all output)
  | { kind: 'flag'; flag: string }; // set a run flag

export interface Cantrip {
  id: string;
  name: string;
  blurb: string;
  cost: number; // Insight ◈ spent to learn
  scrollCost?: number; // Scrolls 📜 spent to learn (v0.1.2) — 0 for the free opener, 1 for the rest
  requires: string[]; // prerequisite cantrip ids (DAG edges)
  effects: CantripEffect[];
}

/**
 * v0.1 cantrip web (spec §5). A shallow DAG rooted at "Read the Page":
 *
 *                    read-the-page
 *                   /   |     |    \
 *               spark  mend  umbral-whisper
 *                 |
 *            kindle-focus
 *
 * `umbral-whisper` is deliberately priced above the starting Insight cap (100) so
 * it wears the `*` "exceeds Insight Max" marker until the Grand Library raises the
 * cap — the skills tree is where the caps mechanic first bites.
 */
export const CANTRIPS: Cantrip[] = [
  {
    id: 'read-the-page',
    name: 'Read the Page',
    blurb: 'The torn grimoire page settles into meaning. The cantrip web opens.',
    cost: 5,
    scrollCost: 0, // the free opener — Insight only; learning it unlocks scribing Scrolls
    requires: [],
    effects: [{ kind: 'openTree' }],
  },
  {
    id: 'spark',
    name: 'Spark',
    // v0.1.4: the first spark follows your DOMINANT affinity (the element you've laboured
    // at most). With no element work done it defaults to ▲ Fire, so the classic path is
    // unchanged; a water-hauler awakens ▼ Water instead, and so on.
    blurb: 'A word of ignition. The essence you have leaned toward begins to trickle into you.',
    cost: 20,
    scrollCost: 1,
    requires: ['read-the-page'],
    effects: [{ kind: 'awakenAffinity', trickle: 0.2 }],
  },
  {
    id: 'mend',
    name: 'Mend',
    blurb: 'Knit small hurts closed — your Stamina recovers faster.',
    cost: 15,
    scrollCost: 1,
    requires: ['read-the-page'],
    effects: [{ kind: 'vitalRegen', vital: 'stamina', amount: 0.3 }],
  },
  {
    id: 'inner-wellspring',
    name: 'Inner Wellspring',
    blurb: 'A hidden font opens within — Mana unlocks and begins to pool.',
    cost: 15,
    scrollCost: 1,
    requires: ['read-the-page'],
    effects: [{ kind: 'unlockVital', vital: 'mana', max: 10, regen: 0.1 }],
  },
  {
    id: 'kindle-focus',
    name: 'Kindle Focus',
    blurb: 'Hold the flame steady in the mind. +10% to all output.',
    cost: 40,
    scrollCost: 1,
    requires: ['spark'],
    effects: [{ kind: 'outputMult', add: 0.1 }],
  },
  {
    id: 'umbral-whisper',
    name: 'Umbral Whisper',
    blurb: 'Speak to the dark between the stars. ☾ Dark essence trickles — but the words demand more Insight than you can yet hold.',
    cost: 120,
    scrollCost: 1,
    requires: ['read-the-page'],
    effects: [{ kind: 'awaken', element: 'dark', trickle: 0.15 }],
  },
];

export const CANTRIP_BY_ID: Record<string, Cantrip> = Object.fromEntries(CANTRIPS.map((c) => [c.id, c]));
