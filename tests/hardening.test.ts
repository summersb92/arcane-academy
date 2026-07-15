// Hardening pass (pre-T-005): regression tests for the two code reviews' findings —
// simulate() fixed-timestep unification, save normalize/validate robustness, the
// foreground offline catch-up, the migrate ladder, and RNG write-back plumbing.

import { describe, it, expect } from 'vitest';
import { newGame, ELEMENTS, SAVE_VERSION } from '../src/engine/state';
import { simulate, step, createAccumulator, TICK } from '../src/engine/tick';
import { applyOffline } from '../src/engine/offline';
import { serialize, deserialize, safeLoad, SAVE_MAGIC } from '../src/engine/save';
import { startTask } from '../src/engine/systems/tasks';
import { drawRng } from '../src/engine/rng';
import { STARTING } from '../src/content/config';
import { toView } from '../src/ui/stores';

// ---------------------------------------------------------------------------
// Fix 1 — simulate() leftover-time bug + unification with offline.ts
// ---------------------------------------------------------------------------
describe('simulate() fixed-timestep consistency', () => {
  it('a 3h fast-forward equals fine-grained 0.1s ticking (perpetual + timed + regen)', () => {
    const mk = () => {
      const s = newGame(7);
      s.run.caps.insight = 1e9; // lift the cap so Study output stays observable
      startTask(s, 'study'); // perpetual (exercises per-second output + runCost)
      startTask(s, 'smith'); // running/timed (exercises the completion path)
      return s;
    };
    const SECONDS = 3 * 3600; // 10800s — well past the OLD MAX_CATCHUP_STEPS*TICK (=10000s)

    const viaSimulate = mk();
    simulate(viaSimulate, SECONDS);

    const viaTicks = mk();
    const n = Math.round(SECONDS / TICK);
    for (let i = 0; i < n; i++) step(viaTicks, TICK);

    expect(viaSimulate.run.resources.gold).toBeCloseTo(viaTicks.run.resources.gold, 6);
    expect(viaSimulate.run.resources.insight).toBeCloseTo(viaTicks.run.resources.insight, 6);
    expect(viaSimulate.run.vitals.stamina.cur).toBeCloseTo(viaTicks.run.vitals.stamina.cur, 6);
    expect(viaSimulate.playtime).toBeCloseTo(viaTicks.playtime, 6);
    expect(viaSimulate.run.tasks.smith.count).toBe(viaTicks.run.tasks.smith.count);
  });

  it('does NOT collapse the past-cap remainder into one oversized step', () => {
    const s = newGame(1);
    s.run.caps.insight = 1e9;
    startTask(s, 'study'); // drain 0.2/s < regen 0.5/s → never pauses; output is linear
    const SECONDS = 3 * 3600;
    simulate(s, SECONDS);
    // Correct fixed-stepping runs Study the whole time: ~0.55 * 10800 = 5940.
    expect(s.run.resources.insight).toBeCloseTo(0.55 * SECONDS, 1);
    // The OLD code applied ~800s in ONE step, auto-pausing Study (couldn't pay
    // 0.2/s * 800s at once) → only ~5500, far below this floor.
    expect(s.run.resources.insight).toBeGreaterThan(5900);
  });

  it('offline catch-up uses the same TICK-granular routine as simulate', () => {
    const off = newGame(2);
    off.run.caps.insight = 1e9;
    startTask(off, 'study');
    const now = off.lastSaved + 3600_000; // 1h later
    off.lastSaved = now - 3600_000;
    applyOffline(off, now);

    const sim = newGame(2);
    sim.run.caps.insight = 1e9;
    startTask(sim, 'study');
    simulate(sim, 3600);

    expect(off.run.resources.insight).toBeCloseTo(sim.run.resources.insight, 6);
  });
});

// ---------------------------------------------------------------------------
// Fix 2 — normalize() + complete validate()
// ---------------------------------------------------------------------------
describe('save robustness: normalize + validate', () => {
  it('a save MISSING run.tasks loads and renders via toView() without throwing', () => {
    // The exact root-cause shape: passes the old validate() but toView() (which runs
    // on the initial publish, before the first-tick self-heal) dereferences run.tasks.
    const s = newGame(3) as unknown as { run: Record<string, unknown> };
    delete s.run.tasks;
    const res = safeLoad(serialize(s as never));
    expect(res.ok).toBe(true);
    expect(res.state!.run.tasks).toEqual({}); // normalize backfilled it
    expect(() => toView(res.state!)).not.toThrow();
  });

  it('normalize backfills every read-model field a partial save omits', () => {
    const s = newGame(4) as unknown as { run: Record<string, unknown> };
    delete s.run.activitySlots;
    delete s.run.essence;
    delete s.run.chronicle;
    delete s.run.skills;
    delete s.run.caps;
    const res = safeLoad(serialize(s as never));
    expect(res.ok).toBe(true);
    expect(res.state!.run.activitySlots).toBe(STARTING.activitySlots);
    expect(Object.keys(res.state!.run.essence)).toHaveLength(ELEMENTS.length);
    expect(Array.isArray(res.state!.run.chronicle)).toBe(true);
    expect(res.state!.run.caps.insight).toBe(STARTING.insightCap);
    expect(() => toView(res.state!)).not.toThrow();
  });

  it('rejects a save whose vital regen is "x" (would NaN-poison the sim)', () => {
    const s = newGame(5) as unknown as { run: { vitals: { stamina: { regen: unknown } } } };
    s.run.vitals.stamina.regen = 'x';
    const res = safeLoad(serialize(s as never));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/regen/i);
  });

  it('rejects a save with an empty {} vital', () => {
    const s = newGame(6) as unknown as { run: { vitals: { life: unknown } } };
    s.run.vitals.life = {};
    expect(safeLoad(serialize(s as never)).ok).toBe(false);
  });

  it('rejects a save with a missing lastSaved', () => {
    const s = newGame(7) as unknown as Record<string, unknown>;
    delete s.lastSaved;
    const res = safeLoad(serialize(s as never));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/lastSaved/i);
  });

  it('rejects a save with a non-finite essence amount', () => {
    const s = newGame(8);
    s.run.essence.fire.amount = NaN; // serializes to null → validate rejects
    expect(safeLoad(serialize(s)).ok).toBe(false);
  });

  it('rejects a save with a non-finite insight cap', () => {
    const s = newGame(9) as unknown as { run: { caps: { insight: unknown } } };
    s.run.caps.insight = Infinity; // serializes to null → validate rejects
    expect(safeLoad(serialize(s as never)).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Fix 3 — foreground offline catch-up (tab-background idle), no double-count
// ---------------------------------------------------------------------------
describe('foreground offline catch-up', () => {
  it('applies the idle gap once and does not double-count with the live-loop frame clamp', () => {
    const s = newGame(1);
    s.run.caps.insight = 1e9;
    startTask(s, 'study'); // 0.55/s
    const AWAY_MS = 10 * 60 * 1000; // 10 min backgrounded (rAF paused)
    const now = s.lastSaved + AWAY_MS;
    s.lastSaved = now - AWAY_MS;
    const before = s.run.resources.insight;

    // main.ts visibilitychange→visible replays the gap ONCE.
    const summary = applyOffline(s, now);
    const afterCatchUp = s.run.resources.insight;
    expect(summary.appliedMs).toBe(AWAY_MS);
    expect(afterCatchUp - before).toBeCloseTo(0.55 * 600, 1);
    expect(s.lastSaved).toBe(now); // gap consumed

    // stores.resumeTimebase() re-seeds the rAF clock, so the first resumed frame
    // measures ~0 elapsed and adds NOTHING of the 600s gap back.
    const acc = createAccumulator();
    acc.advance(s, Math.min(0.016, 1));
    expect(s.run.resources.insight).toBeCloseTo(afterCatchUp, 6);

    // Safety net: even WITHOUT a re-seed, the ≤1s frame clamp bounds a double-count
    // to ~1s (0.55), never the whole 600s gap (~330).
    const s2 = newGame(1);
    s2.run.caps.insight = 1e9;
    startTask(s2, 'study');
    s2.lastSaved = now - AWAY_MS;
    applyOffline(s2, now);
    const base2 = s2.run.resources.insight;
    const acc2 = createAccumulator();
    acc2.advance(s2, Math.min(AWAY_MS / 1000, 1)); // unclamped=600s → clamped to 1s
    expect(s2.run.resources.insight - base2).toBeLessThan(0.6);
  });
});

// ---------------------------------------------------------------------------
// Fix 4 — migrate() ladder (version 0 → current)
// ---------------------------------------------------------------------------
describe('migrate ladder', () => {
  it('upgrades a version:0 envelope, then normalizes + validates', () => {
    const base = newGame(11) as unknown as { run: Record<string, unknown> };
    delete base.run.tasks; // v0 predates the Task/Activity system (T-004)
    delete base.run.activitySlots;
    const envelope = { magic: SAVE_MAGIC, version: 0, state: base };

    const res = safeLoad(JSON.stringify(envelope));
    expect(res.ok).toBe(true);
    expect(res.migratedFrom).toBe(0);
    expect(res.state!.version).toBe(SAVE_VERSION);
    expect(res.state!.run.tasks).toEqual({}); // migrate0to1 established it
    expect(res.state!.run.activitySlots).toBe(STARTING.activitySlots);
    expect(() => toView(res.state!)).not.toThrow(); // and it renders
  });
});

// ---------------------------------------------------------------------------
// Fix 5 — RNG write-back plumbing (T-005/T-006 will draw)
// ---------------------------------------------------------------------------
describe('rng write-back plumbing', () => {
  it('rngState round-trips through save/load', () => {
    const s = newGame(12345);
    s.rngState = 0x0abcdef1; // pretend prior draws advanced it
    expect(deserialize(serialize(s)).rngState).toBe(0x0abcdef1);
  });

  it('drawRng advances + persists rngState and reproduces the stream across a save boundary', () => {
    const a = newGame(999);
    const start = a.rngState;
    const roll = drawRng(a, (r) => r.int(1, 100));
    expect(roll).toBeGreaterThanOrEqual(1);
    expect(roll).toBeLessThanOrEqual(100);
    expect(a.rngState).not.toBe(start); // write-back happened

    const b = deserialize(serialize(a)); // reload from the persisted state
    expect(b.rngState).toBe(a.rngState);

    // Continuing the stream from the reloaded save matches continuing the live one.
    const nextA = drawRng(a, (r) => r.next());
    const nextB = drawRng(b, (r) => r.next());
    expect(nextB).toBe(nextA);
    expect(b.rngState).toBe(a.rngState);
  });
});
