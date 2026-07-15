// Home fixture content (spec §3.10 / §5) — the mage's lair furnishings, and the
// Gold / essence / Insight SINKS the back-half of Act I was missing. Each fixture
// is a Limited "Housing" task (reusing the engine's Limited machinery, NOT a new
// system): building/upgrading it completes one cycle, and the fixture's LEVEL is
// simply that task's completion `count` — no parallel state to drift.
//
// The passive bonus each level grants is DERIVED from the level by systems/home.ts:
//   • insightPerLevel   → +Insight/s (folded in via runHome, before the cap clamp)
//   • essencePerLevel   → +element/s (folded into essenceBase(), the ONE trickle sum)
// Pure data; type-only import of the task types (tasks.ts spreads HOME_TASKS in).

import type { ElementId } from '../engine/state';
import type { Amount, TaskDef } from './tasks';

const A = (pool: Amount['pool'], id: Amount['id'], amount: number): Amount => ({ pool, id, amount });

export interface Fixture {
  id: string; // fixture identity === its build-task id (level = tasks[id].count)
  insightPerLevel?: number; // Study Desk: +Insight/s per level
  essencePerLevel?: { element: ElementId; amount: number }; // Hearth → Fire, Ossuary → Dark
  task: TaskDef;
}

/** All fixtures live on the Home tab, gated behind the lair beat (`lairFounded`). */
export const FIXTURES: Fixture[] = [
  {
    // Study Desk — an Insight rate bump AND an Insight sink: it costs Insight to
    // inscribe, so a player pinned at the Insight cap finally has somewhere to spend.
    id: 'study-desk',
    insightPerLevel: 0.12,
    task: {
      id: 'study-desk',
      name: 'Study Desk',
      type: 'limited',
      tag: 'Fixture',
      cls: 'insight',
      chip: 'Fixture',
      panel: 'home',
      length: 5,
      max: 3,
      requires: [{ kind: 'flag', flag: 'lairFounded' }],
      startCost: [A('resource', 'gold', 20), A('resource', 'insight', 25), A('resource', 'spiritDust', 2)],
    },
  },
  {
    // Hearth — a Fire-essence generator (feeds essenceBase), so contracts that burn
    // Fire become comfortably sustainable. Needs Spark first (Fire must be awake).
    id: 'hearth',
    essencePerLevel: { element: 'fire', amount: 0.15 },
    task: {
      id: 'hearth',
      name: 'Hearth',
      type: 'limited',
      tag: 'Fixture',
      cls: 'fire',
      chip: 'Fixture',
      panel: 'home',
      length: 6,
      max: 3,
      requires: [{ kind: 'flag', flag: 'lairFounded' }, { kind: 'skill', id: 'spark' }],
      startCost: [A('resource', 'gold', 25), A('resource', 'ironOre', 2)],
    },
  },
  {
    // Ossuary — the solo mage's cheap door to ☾ Dark essence: building it AWAKENS
    // Dark (no need for the pricey Umbral Whisper cantrip), then trickles it.
    id: 'ossuary',
    essencePerLevel: { element: 'dark', amount: 0.12 },
    task: {
      id: 'ossuary',
      name: 'Ossuary',
      type: 'limited',
      tag: 'Fixture',
      cls: 'dark',
      chip: 'Fixture',
      panel: 'home',
      length: 8,
      max: 3,
      requires: [{ kind: 'flag', flag: 'lairFounded' }],
      startCost: [A('resource', 'gold', 30), A('resource', 'spiritDust', 3)],
      effects: [{ kind: 'awakenElement', element: 'dark' }],
    },
  },
  {
    // Alembic — flavour/placeholder for v0.1, but a real Fire-essence sink (so Fire
    // has somewhere to go beyond contracts). Distilling consumes stored Fire.
    id: 'alembic',
    task: {
      id: 'alembic',
      name: 'Alembic',
      type: 'limited',
      tag: 'Fixture',
      cls: 'water',
      chip: 'Fixture',
      panel: 'home',
      length: 5,
      max: 1,
      requires: [{ kind: 'flag', flag: 'lairFounded' }, { kind: 'skill', id: 'spark' }],
      startCost: [A('resource', 'gold', 40), A('resource', 'moonpetal', 3), A('essence', 'fire', 5)],
    },
  },
];

export const HOME_TASKS: TaskDef[] = FIXTURES.map((f) => f.task);
export const FIXTURE_BY_ID: Record<string, Fixture> = Object.fromEntries(FIXTURES.map((f) => [f.id, f]));
