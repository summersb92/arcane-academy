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

/**
 * The lair beat (Awakening → Hedge-Mage, spec §3.12): a DISTINCT beat AFTER the
 * spark — once you've begun practising (learned your first cantrip) OR earned a
 * purse beyond the spark's threshold, you claim a corner as a lair, revealing the
 * Home tab (fixtures + the Founding card). The Gold arm sits above SPARK.goldThreshold
 * (25) so crossing the spark can't also trip the lair in the same tick; a purely
 * idle player who only studies trips the cantrip arm instead. Guaranteed either way.
 */
export const LAIR = {
  goldThreshold: 40,
};

/**
 * The Founding (spec §3.11 / §5) — the v0.1 finale gate. Four requirements: hold
 * enough Gold and Renown, and have acquired a Charter and a Site (each bought
 * in-run as its own Housing task). The Site is the big Gold sink; the Charter needs
 * a name (Renown) behind it. Tuned toward the ~15–40 min target — balance freely.
 */
export const FOUNDING = {
  goldHeld: 100, // ⦿ you must still hold at the moment of Founding
  renown: 25, // ★ the world must know your name
  charterCost: 60, // ⦿ to secure a Guild Charter
  charterRenown: 8, // ★ before a guild will charter you
  siteCost: 120, // ⦿ to claim the Ruined Tower (the big Gold sink → your Grounds)
};

export const STARTING = {
  gold: 0,
  insight: 0,
  renown: 0,
  moonpetal: 0,
  ironOre: 0,
  spiritDust: 0,
  goldCap: 50, // BASE Gold cap — raised by equipping Coin Pouch / Strongbox (effectiveCap)
  insightCap: 100,
  materialCap: 50, // BASE cap on each material (moonpetal / ironOre / spiritDust) — raised by Warded Chest
  activitySlots: 2, // continuous-task capacity at the Origin (raised to 3 by "Widen the Study")
  // Vitals rework (v0.1.1): tighter Life/Stamina, and Mana LOCKED (max 0 / regen 0)
  // until the "Inner Wellspring" cantrip unlocks it.
  life: { cur: 10, max: 10, regen: 0.1 },
  stamina: { cur: 5, max: 5, regen: 0.15 },
  mana: { cur: 0, max: 0, regen: 0 },
};

// (The T-002 placeholder generator was retired in T-004 — production now flows
// entirely from the Task/Activity system in src/engine/systems/tasks.ts.)
