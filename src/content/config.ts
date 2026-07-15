// Gameplay tuning constants (data, not code). Balance lives here; systems read it.
// Framework-agnostic — imported by the engine and the CLI.

export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000; // 12h catch-up cap (spec §3.4)
export const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * The spark / Awakening trigger (spec §5): fires when Gold reaches the threshold
 * OR a short timer elapses — whichever comes first — so even a purely idle player
 * who never labours still awakens and unlocks Study + the cantrip web.
 */
export const SPARK = {
  goldThreshold: 25, // ⦿ that earns the page's attention
  timerSeconds: 45, // …or this many seconds of simulated play, guaranteed
};

export const STARTING = {
  gold: 0,
  insight: 0,
  renown: 0,
  moonpetal: 0,
  ironOre: 0,
  spiritDust: 0,
  insightCap: 100,
  activitySlots: 2, // continuous-task capacity at the Origin (raised to 3 by "Widen the Study")
  life: { cur: 20, max: 20, regen: 0.2 },
  stamina: { cur: 10, max: 10, regen: 0.5 },
  mana: { cur: 0, max: 10, regen: 0.2 },
};

// (The T-002 placeholder generator was retired in T-004 — production now flows
// entirely from the Task/Activity system in src/engine/systems/tasks.ts.)
