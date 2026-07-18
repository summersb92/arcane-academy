// Contract content (spec §3.6 / §5) — the outside world's small jobs and the ONLY
// source of Renown ★ in v0.1, so they're the pull toward the Founding. Pure data
// (type-only import of the task types → no runtime cycle with tasks.ts, which
// spreads these into TASKS). A contract is just a Running task tagged 'Contract':
// it spends the mage (Stamina + Fire essence + time) and pays Gold + Renown (+ a
// material drop, so fixtures have something to consume). Opt-in — ignoring them
// costs nothing; they simply gate the Founding's Renown requirement.

import type { Amount, TaskDef } from './tasks';

const A = (pool: Amount['pool'], id: Amount['id'], amount: number): Amount => ({ pool, id, amount });

export const CONTRACTS: TaskDef[] = [
  {
    // Ward a Barn — the first solo livelihood. Needs Fire awakened (Spark) to lay
    // the ward; drains a trickle of Fire so it's SUSTAINABLE on Spark's 0.2/s alone,
    // with a little headroom. Drops Iron Ore (the Hearth's material).
    id: 'ward-a-barn',
    name: 'Fulfil: Ward a Barn',
    type: 'running',
    tag: 'Contract',
    cls: 'renown',
    blurb: 'Trace a Fire-ward across the beams so the farmer sleeps and the rats do not.',
    length: 12,
    repeatable: true,
    requires: [{ kind: 'skill', id: 'spark' }],
    runCost: [A('vital', 'stamina', 0.3), A('essence', 'fire', 0.15)],
    output: [A('resource', 'gold', 10), A('resource', 'renown', 3), A('resource', 'ironOre', 2)],
  },
  {
    // Cleanse the Old Well — a bigger job, unlocked once you have a bit of a name.
    // Its Fire drain (0.2/s) exactly matches Spark's bare trickle, so it slowly
    // starves UNLESS you build a Hearth (+Fire) or learn Kindle Focus — a deliberate
    // pull toward the Home fixtures. Pays more, drops Moonpetal (the Alembic's reagent).
    id: 'cleanse-the-old-well',
    name: 'Fulfil: Cleanse the Old Well',
    type: 'running',
    tag: 'Contract',
    cls: 'renown',
    blurb: 'Something foul festers in the dark water. Burn it out and the village remembers your name.',
    length: 20,
    repeatable: true,
    requires: [
      { kind: 'skill', id: 'spark' },
      { kind: 'resource', id: 'renown', atLeast: 6 },
    ],
    runCost: [A('vital', 'stamina', 0.4), A('essence', 'fire', 0.2)],
    output: [A('resource', 'gold', 24), A('resource', 'renown', 7), A('resource', 'moonpetal', 2)],
  },
];
