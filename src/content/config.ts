// Gameplay tuning constants (data, not code). Balance lives here; systems read it.
// Framework-agnostic — imported by the engine and the CLI.

export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000; // 12h catch-up cap (spec §3.4)
export const AUTOSAVE_INTERVAL_MS = 30_000;

export const STARTING = {
  gold: 0,
  insight: 0,
  renown: 0,
  moonpetal: 0,
  ironOre: 0,
  spiritDust: 0,
  insightCap: 100,
  life: { cur: 20, max: 20, regen: 0.2 },
  stamina: { cur: 10, max: 10, regen: 0.5 },
  mana: { cur: 0, max: 10, regen: 0.2 },
};

// T-002 stub: a single hard-coded generator so a resource visibly ticks.
// Replaced by the Task/Activity system in T-004 (this is the "found coins in
// the straw" trickle that proves the tick + offline + save loop end-to-end).
export const PLACEHOLDER_GENERATOR = {
  resource: 'gold' as const,
  rate: 0.5, // gold per second
};
