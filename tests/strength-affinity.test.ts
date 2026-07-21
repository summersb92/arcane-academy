// v0.1.4 — the Odd-Jobs ladder reorder, the Strength stat, hidden elemental affinity +
// the awaken-affinity spark, the Gold-only contracts, and the save v5 round-trip /
// migration. Pure engine + the store bridge (toView is DOM-free), like the sibling suites.

import { describe, it, expect } from 'vitest';
import { newGame, ELEMENTS, SAVE_VERSION, type GameState } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import { doTask, startTask } from '../src/engine/systems/tasks';
import { learnCantrip } from '../src/engine/systems/skills';
import { essenceRates } from '../src/engine/systems/essence';
import { breakdown } from '../src/engine/systems/breakdown';
import {
  strength,
  strengthLevel,
  strengthXpForLevel,
  addStrengthXp,
  dominantAffinity,
} from '../src/engine/systems/player';
import { serialize, deserialize, safeLoad, SAVE_MAGIC } from '../src/engine/save';
import { TASK_BY_ID } from '../src/content/tasks';
import { toView } from '../src/ui/stores';

/** A runtime with a given completion count, for gating tests. */
const runtimeWithCount = (count: number) => ({ active: false, progress: 0, paused: false, count, repeat: false });
/** Unlock Clean Stables' gate (Find Work ×20). */
function unlockCleanStables(s: GameState): void {
  s.run.tasks['find-work'] = runtimeWithCount(20);
}
/** Big Stamina headroom so a labour loop is never the thing under test. */
function staminaHeadroom(s: GameState): void {
  s.run.vitals.stamina.max = 1000;
  s.run.vitals.stamina.cur = 1000;
  s.run.vitals.stamina.regen = 0;
}

// ---------------------------------------------------------------------------
// The Odd-Jobs ladder reorder: begging → find-work (timed) → clean-stables / run-errands
// ---------------------------------------------------------------------------
describe('Odd-Jobs ladder reorder (v0.1.4)', () => {
  it('Find Work is now a timed running job gated on Begging ×20', () => {
    const s = newGame(1);
    const def = TASK_BY_ID['find-work'];
    expect(def.type).toBe('running');
    expect(def.length).toBe(8);

    staminaHeadroom(s);
    expect(startTask(s, 'find-work')).toBe(false); // Begging ×20 not met
    s.run.tasks['begging'] = runtimeWithCount(20);
    expect(startTask(s, 'find-work')).toBe(true);

    simulate(s, 9); // one 8s cycle completes
    expect(s.run.tasks['find-work'].count).toBeGreaterThanOrEqual(1);
    expect(s.run.resources.gold).toBeGreaterThanOrEqual(3); // +3 Gold per cycle
  });

  it('Clean Stables is gated on Find Work ×20 (now AFTER Find Work)', () => {
    const s = newGame(1);
    staminaHeadroom(s);
    expect(doTask(s, 'clean-stables')).toBe(false); // Find Work ×20 not met
    unlockCleanStables(s);
    expect(doTask(s, 'clean-stables')).toBe(true);
  });

  it('Run Errands shares the Find Work ×20 gate and costs less Stamina than Clean Stables', () => {
    expect((TASK_BY_ID['run-errands'].startCost ?? [])[0].amount).toBeLessThan(
      (TASK_BY_ID['clean-stables'].startCost ?? [])[0].amount,
    );
    const s = newGame(1);
    staminaHeadroom(s);
    expect(doTask(s, 'run-errands')).toBe(false); // gated
    s.run.tasks['find-work'] = runtimeWithCount(20);
    expect(doTask(s, 'run-errands')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Strength — the diminishing-returns curve, growth from Clean Stables, and scaling
// ---------------------------------------------------------------------------
describe('Strength stat (v0.1.4)', () => {
  it('levels on the triangular curve at 10/30/60 cumulative XP (diminishing returns)', () => {
    expect(strengthXpForLevel(1)).toBe(10);
    expect(strengthXpForLevel(2)).toBe(30);
    expect(strengthXpForLevel(3)).toBe(60);

    const s = newGame(1);
    const at = (xp: number) => {
      s.run.strengthXp = xp;
      return { level: strengthLevel(s), mult: strength(s) };
    };
    expect(at(0)).toEqual({ level: 0, mult: 1 });
    expect(at(9).level).toBe(0);
    expect(at(10)).toEqual({ level: 1, mult: 1.1 });
    expect(at(29).level).toBe(1);
    expect(at(30).level).toBe(2);
    expect(strength(s)).toBeCloseTo(1.2, 6);
    expect(at(60).level).toBe(3);
    expect(strength(s)).toBeCloseTo(1.3, 6);
  });

  it('addStrengthXp clamps to a finite, non-negative total', () => {
    const s = newGame(1);
    addStrengthXp(s, 5);
    expect(s.run.strengthXp).toBe(5);
    addStrengthXp(s, -100); // cannot go negative
    expect(s.run.strengthXp).toBe(0);
    addStrengthXp(s, NaN); // ignored
    expect(s.run.strengthXp).toBe(0);
  });

  it('each Clean Stables completion trains Strength (+1 XP); its Gold scales by Strength', () => {
    const s = newGame(1);
    unlockCleanStables(s);
    staminaHeadroom(s);
    expect(strength(s)).toBe(1);

    // First 10 completions all pay at Strength 1.0 (XP is granted AFTER output each time),
    // so Gold = 10 × (base 2 × 1.0) = 20, and XP reaches 10 → level 1.
    for (let i = 0; i < 10; i++) expect(doTask(s, 'clean-stables')).toBe(true);
    expect(s.run.strengthXp).toBe(10);
    expect(strengthLevel(s)).toBe(1);
    expect(strength(s)).toBeCloseTo(1.1, 6);
    expect(s.run.resources.gold).toBeCloseTo(20, 6);

    // The 11th completion now pays base 2 × Strength 1.1 = 2.2.
    const before = s.run.resources.gold;
    doTask(s, 'clean-stables');
    expect(s.run.resources.gold - before).toBeCloseTo(2.2, 6);
    expect(s.run.strengthXp).toBe(11);
  });

  it('Run Errands is NOT strength-scaled (flat Gold regardless of Strength)', () => {
    const s = newGame(1);
    s.run.tasks['find-work'] = runtimeWithCount(20);
    s.run.strengthXp = 60; // Strength ×1.3
    staminaHeadroom(s);
    expect(doTask(s, 'run-errands')).toBe(true);
    expect(s.run.resources.gold).toBeCloseTo(1.6, 6); // NOT ×1.3
  });

  it('the Player view exposes Strength for the Character panel', () => {
    const s = newGame(1);
    s.run.strengthXp = 30;
    const p = toView(s).player;
    expect(p.strengthXp).toBe(30);
    expect(p.strengthLevel).toBe(2);
    expect(p.strength).toBeCloseTo(1.2, 6);
  });
});

// ---------------------------------------------------------------------------
// Hidden elemental affinity + the awaken-affinity spark
// ---------------------------------------------------------------------------
describe('elemental affinity (v0.1.4)', () => {
  it('completing an element task raises that element affinity; dominantAffinity tracks the max', () => {
    const s = newGame(1);
    expect(dominantAffinity(s)).toBe('fire'); // all-zero ledger → Fire default
    expect(TASK_BY_ID['haul-the-catch'].element).toBe('water');

    s.run.vitals.stamina.max = 1000;
    s.run.vitals.stamina.cur = 1000;
    s.run.vitals.stamina.regen = 5; // never pauses the 0.4/s drain
    expect(startTask(s, 'haul-the-catch')).toBe(true); // Water, running 13s
    simulate(s, 14); // one cycle
    expect(s.run.affinity.water).toBeGreaterThanOrEqual(1);
    expect(dominantAffinity(s)).toBe('water');
  });

  it('Smith feeds Fire affinity (kept id, now element-tagged)', () => {
    const s = newGame(1);
    expect(TASK_BY_ID['smith'].element).toBe('fire');
    s.run.vitals.stamina.max = 1000;
    s.run.vitals.stamina.cur = 1000;
    s.run.vitals.stamina.regen = 5;
    startTask(s, 'smith');
    simulate(s, 16); // one 15s cycle
    expect(s.run.affinity.fire).toBeGreaterThanOrEqual(1);
  });

  it('learning Spark awakens the DOMINANT affinity element and sets affinityElement (once)', () => {
    const s = newGame(1);
    s.run.affinity.water = 3; // Water is now dominant
    s.run.flags.awakened = true;
    s.run.resources.insight = 100;
    s.run.resources.scroll = 1; // Spark needs a Scroll
    expect(learnCantrip(s, 'read-the-page')).toBe(true);
    expect(learnCantrip(s, 'spark')).toBe(true);

    expect(s.run.affinityElement).toBe('water');
    expect(s.run.essence.water.awakened).toBe(true);
    expect(s.run.essence.fire.awakened).toBe(false); // Fire NOT awakened
    expect(essenceRates(s).water).toBeCloseTo(0.2, 6); // trickle feeds Water
  });

  it('with no element work, Spark awakens Fire (back-compat default)', () => {
    const s = newGame(1);
    s.run.flags.awakened = true;
    s.run.resources.insight = 100;
    s.run.resources.scroll = 1;
    learnCantrip(s, 'read-the-page');
    learnCantrip(s, 'spark');
    expect(s.run.affinityElement).toBe('fire');
    expect(s.run.essence.fire.awakened).toBe(true);
    expect(essenceRates(s).fire).toBeCloseTo(0.2, 6);
  });
});

// ---------------------------------------------------------------------------
// Contracts: Gold-only, and their essence cost follows the awakened affinity element
// ---------------------------------------------------------------------------
describe('contracts follow the affinity essence (v0.1.4)', () => {
  it('a contract costs the awakened element essence and auto-pauses when it runs out', () => {
    const s = newGame(1);
    s.run.affinity.water = 5; // Water dominant
    s.run.flags.awakened = true;
    s.run.resources.insight = 100;
    s.run.resources.scroll = 1;
    learnCantrip(s, 'read-the-page');
    learnCantrip(s, 'spark'); // awakens Water, affinityElement = 'water'
    expect(s.run.affinityElement).toBe('water');

    s.run.essence.water.amount = 100; // fuel the contract
    s.run.vitals.stamina.max = 100;
    s.run.vitals.stamina.cur = 100;
    expect(startTask(s, 'ward-a-barn')).toBe(true);

    step(s, 1); // burns Water 0.15/s (resolved from the 'affinity' sentinel), trickles +0.2
    expect(s.run.essence.water.amount).toBeCloseTo(100 - 0.15 + 0.2, 6);
    expect(s.run.essence.fire.amount).toBe(0); // Fire is never touched

    // While it runs, the essence breakdown attributes the drain to Water (sentinel resolved).
    const b = breakdown(s, { kind: 'essence', id: 'water' });
    expect(b.consumes.some((c) => c.name === 'Fulfil: Ward a Barn')).toBe(true);

    // Starve Water below the per-second cost → auto-pause on the next step.
    s.run.essence.water.amount = 0.1;
    step(s, 1);
    expect(s.run.tasks['ward-a-barn'].paused).toBe(true);
  });

  it('contracts pay Gold only — no Renown, no material drops', () => {
    for (const id of ['ward-a-barn', 'cleanse-the-old-well']) {
      const out = TASK_BY_ID[id].output ?? [];
      expect(out.every((o) => o.pool === 'resource' && o.id === 'gold')).toBe(true);
    }
    // Cleanse's gate is now Ward-a-Barn ×5 (no Renown requirement).
    const reqs = TASK_BY_ID['cleanse-the-old-well'].requires ?? [];
    expect(reqs.some((r) => r.kind === 'taskCount' && r.id === 'ward-a-barn' && r.atLeast === 5)).toBe(true);
    expect(reqs.some((r) => r.kind === 'resource' && r.id === 'renown')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Save v5 — round-trip + v4→v5 migration backfill
// ---------------------------------------------------------------------------
describe('save v5 (strength + affinity)', () => {
  it('round-trips strengthXp / affinity / affinityElement', () => {
    const s = newGame(42);
    s.run.strengthXp = 35;
    s.run.affinity.water = 7;
    s.run.affinity.earth = 2;
    s.run.affinityElement = 'water';
    const round = deserialize(serialize(s));
    expect(round).toEqual(s);
    expect(round.run.strengthXp).toBe(35);
    expect(round.run.affinity.water).toBe(7);
    expect(round.run.affinityElement).toBe('water');
  });

  it('a v4 save (no strength/affinity) migrates to v5 with backfilled defaults', () => {
    const base = newGame(10) as unknown as { run: Record<string, unknown> };
    delete base.run.strengthXp;
    delete base.run.affinity;
    delete base.run.affinityElement;
    const envelope = { magic: SAVE_MAGIC, version: 4, state: base };

    const res = safeLoad(JSON.stringify(envelope));
    expect(res.ok).toBe(true);
    expect(res.migratedFrom).toBe(4);
    expect(res.state!.version).toBe(SAVE_VERSION);
    expect(res.state!.run.strengthXp).toBe(0);
    expect(res.state!.run.affinityElement).toBe(null);
    expect(Object.keys(res.state!.run.affinity)).toHaveLength(ELEMENTS.length);
    expect(() => toView(res.state!)).not.toThrow();
  });

  it('normalize repairs an out-of-domain affinityElement back to null', () => {
    const s = newGame(11) as unknown as { run: { affinityElement: unknown } };
    s.run.affinityElement = 'not-an-element';
    const res = safeLoad(serialize(s as never));
    expect(res.ok).toBe(true);
    expect(res.state!.run.affinityElement).toBe(null);
  });
});
