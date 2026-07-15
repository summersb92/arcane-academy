// Task/Activity content — pure data, the source of truth for what the mage can DO.
// Framework-agnostic (imported by the engine + CLI; type-only import of state ids
// so there is no runtime cycle). The engine system in src/engine/systems/tasks.ts
// interprets these definitions; the UI/CLI only format them for display.
//
// The four task types (spec §3.6 / docs/10 §2):
//   instant   — one-shot: pay startCost → gain output immediately (no slot)
//   running   — timed Length: per-second runCost, lump output on completion, ↻ repeat
//   perpetual — runs until stopped: per-second runCost → per-second output
//   limited   — Max-capped "upgrade": completes a fixed number of times, applies effects
// Continuous tasks (running/perpetual/limited) each occupy an Activity slot; instant don't.

import type { ElementId, ResourceId } from '../engine/state';
import { CONTRACTS } from './contracts';
import { HOME_TASKS } from './home';
import { FOUNDING_TASKS } from './founding';

export type TaskType = 'instant' | 'running' | 'perpetual' | 'limited';

/** Which store an Amount reads/writes. */
export type Pool = 'resource' | 'vital' | 'essence';
export type VitalId = 'life' | 'stamina' | 'mana';
export type AmountId = ResourceId | VitalId | ElementId;

/** A signed quantity against a pool. Flat for instant/lump; per-second for run costs & perpetual output. */
export interface Amount {
  pool: Pool;
  id: AmountId;
  amount: number;
}

/** Multi-dimensional start gate (spec §3.6 / docs/10 §4). Starter tasks use none;
 *  the evaluator exists so T-005 (skills) and T-006 (the Founding) can gate on it. */
export type Requirement =
  | { kind: 'flag'; flag: string }
  | { kind: 'resource'; id: ResourceId; atLeast: number }
  | { kind: 'skill'; id: string }
  | { kind: 'taskCount'; id: string; atLeast: number };

/** Applied once when a running/limited task completes a cycle. */
export type TaskEffect =
  | { kind: 'activitySlot'; amount: number }
  | { kind: 'flag'; flag: string; value?: boolean }
  | { kind: 'raiseInsightCap'; amount: number }
  | { kind: 'awakenElement'; element: ElementId }; // Home Ossuary awakens ☾ Dark on build (T-006)

/** "At N" repeat-scaling: once completions reach `at`, each completion's primary
 *  output gains `bonus` (additive; multiple thresholds stack). docs/10 §4. */
export interface AtN {
  at: number;
  bonus: number;
}

export interface TaskDef {
  id: string;
  name: string;
  type: TaskType;
  tag: string; // category label (docs/10 §5) — also the raw group the UI splits on (Contract/Fixture/Founding)
  cls: string; // coloured left-edge / element class — matches a CSS var name (gold, insight, fire, dark…)
  panel?: 'main' | 'home'; // which tab hosts the card (default 'main'; fixtures + the Founding → 'home') — T-006
  chip?: string; // chip label override; defaults from type
  length?: number; // seconds — running & timed-limited
  max?: number; // limited: how many times it can ever complete
  repeatable?: boolean; // running: default state of the ↻ repeat toggle
  startCost?: Amount[]; // paid once per start / per instant "do" / per running cycle restart
  runCost?: Amount[]; // paid every second while active (drives auto-pause)
  output?: Amount[]; // instant→on do · running/limited→lump on completion · perpetual→per second
  atN?: AtN[];
  requires?: Requirement[];
  effects?: TaskEffect[];
}

const A = (pool: Pool, id: AmountId, amount: number): Amount => ({ pool, id, amount });

/** v0.1 core tasks (spec §5 — first-pass numbers, tuned toward the ~15–40 min target).
 *  Contracts, Home fixtures, and the Founding are composed onto the end (see TASKS). */
const CORE_TASKS: TaskDef[] = [
  {
    id: 'clean-stables',
    name: 'Clean Stables',
    type: 'instant',
    tag: 'Starting Out',
    cls: 'gold',
    startCost: [A('vital', 'stamina', 1)],
    output: [A('resource', 'gold', 2.5)],
  },
  {
    id: 'scribe-scroll',
    name: 'Scribe Scroll',
    type: 'instant',
    tag: 'Crafting',
    cls: 'insight',
    startCost: [A('resource', 'insight', 10)],
    output: [A('resource', 'spiritDust', 1)],
    atN: [{ at: 5, bonus: 1 }], // At 5: +1 Spirit Dust per scribe
  },
  {
    id: 'smith',
    name: 'Smith',
    type: 'running',
    tag: 'Craftwork',
    cls: 'gold',
    length: 15,
    repeatable: true,
    runCost: [A('vital', 'stamina', 0.4)],
    output: [A('resource', 'gold', 5)],
  },
  {
    id: 'study',
    name: 'Study',
    type: 'perpetual',
    tag: 'Research',
    cls: 'insight',
    runCost: [A('vital', 'stamina', 0.2)],
    output: [A('resource', 'insight', 0.55)],
    requires: [{ kind: 'flag', flag: 'awakened' }], // the spark un-gates Study (T-005)
  },
  {
    id: 'rest',
    name: 'Rest',
    type: 'perpetual',
    tag: 'Rest',
    cls: 'mana',
    output: [A('vital', 'stamina', 0.8), A('vital', 'mana', 0.5), A('vital', 'life', 0.5)],
  },
  {
    id: 'widen-study',
    name: 'Widen the Study',
    type: 'limited',
    tag: 'Storage',
    cls: 'earth',
    chip: 'Upgrade',
    length: 6,
    max: 1,
    startCost: [A('resource', 'gold', 40)],
    effects: [{ kind: 'activitySlot', amount: 1 }], // Activity slots 2 → 3
  },
  {
    id: 'grand-library',
    name: 'Grand Library',
    type: 'limited',
    tag: 'Storage',
    cls: 'insight',
    chip: 'Upgrade',
    length: 8,
    max: 1,
    startCost: [A('resource', 'gold', 60)],
    requires: [{ kind: 'flag', flag: 'awakened' }],
    effects: [{ kind: 'raiseInsightCap', amount: 150 }], // Insight cap 100 → 250 (exercises caps + the `*` marker)
  },
];

/** The full task table the engine iterates: core loop + Renown contracts + Home
 *  fixtures + the Founding finale. Composed here so content stays split by concern
 *  while there remains ONE source of truth the systems + CLI + UI all read. */
export const TASKS: TaskDef[] = [...CORE_TASKS, ...CONTRACTS, ...HOME_TASKS, ...FOUNDING_TASKS];

export const TASK_BY_ID: Record<string, TaskDef> = Object.fromEntries(TASKS.map((t) => [t.id, t]));

/** Short human labels for chronicle text (engine-side, display-glyph-free). */
export const AMOUNT_LABEL: Record<string, string> = {
  gold: 'Gold',
  insight: 'Insight',
  renown: 'Renown',
  moonpetal: 'Moonpetal',
  ironOre: 'Iron Ore',
  spiritDust: 'Spirit Dust',
  life: 'Life',
  stamina: 'Stamina',
  mana: 'Mana',
  prism: 'Prismatic',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
  dark: 'Dark',
  light: 'Light',
};

/** True for tasks that occupy an Activity slot while active (everything but instant). */
export function isContinuous(def: TaskDef): boolean {
  return def.type !== 'instant';
}
