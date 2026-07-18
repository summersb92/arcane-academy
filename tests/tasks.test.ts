import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import { applyOffline } from '../src/engine/offline';
import {
  doTask,
  startTask,
  stopTask,
  toggleRepeat,
  slotsUsed,
  activitySlots,
  taskRates,
  listTaskInfo,
  taskInfo,
} from '../src/engine/systems/tasks';
import { buyItem, equipItem, moveHome, effectiveCap } from '../src/engine/systems/home';
import { learnCantrip } from '../src/engine/systems/skills';
import { TASK_BY_ID } from '../src/content/tasks';

describe('instant tasks', () => {
  it('Clean Stables pays Stamina and grants Gold, once per do', () => {
    const s = newGame(1);
    expect(doTask(s, 'clean-stables')).toBe(true);
    expect(s.run.resources.gold).toBeCloseTo(0.25, 6); // v0.1.1: 0.25 (was 2.5)
    expect(s.run.vitals.stamina.cur).toBeCloseTo(4, 6); // Stamina max 5, cost 1

    doTask(s, 'clean-stables');
    expect(s.run.resources.gold).toBeCloseTo(0.5, 6);
    expect(s.run.tasks['clean-stables'].count).toBe(2);
  });

  it('an instant task is refused when its cost is unaffordable', () => {
    const s = newGame(1);
    s.run.vitals.stamina.cur = 0;
    expect(doTask(s, 'clean-stables')).toBe(false);
    expect(s.run.resources.gold).toBe(0);
  });

  it('instant tasks never occupy an Activity slot', () => {
    const s = newGame(1);
    doTask(s, 'clean-stables');
    expect(slotsUsed(s)).toBe(0);
  });
});

describe('activity slots', () => {
  it('starting a continuous task occupies a slot; stopping frees it', () => {
    const s = newGame(1);
    s.run.flags.awakened = true; // Study is gated behind the spark (T-005)
    expect(slotsUsed(s)).toBe(0);

    expect(startTask(s, 'study')).toBe(true);
    expect(s.run.tasks['study'].active).toBe(true);
    expect(slotsUsed(s)).toBe(1);

    expect(stopTask(s, 'study')).toBe(true);
    expect(s.run.tasks['study'].active).toBe(false);
    expect(slotsUsed(s)).toBe(0);
  });

  it('cannot start more continuous tasks than there are slots (start = 2)', () => {
    const s = newGame(1);
    s.run.flags.awakened = true; // Study is gated behind the spark (T-005)
    expect(startTask(s, 'study')).toBe(true);
    expect(startTask(s, 'smith')).toBe(true);
    expect(slotsUsed(s)).toBe(2);
    expect(startTask(s, 'rest')).toBe(false); // no free slot
    expect(slotsUsed(s)).toBe(2);
  });

  it('the Limited "Widen the Study" upgrade raises slots 2 -> 3 and then locks (maxed)', () => {
    const s = newGame(1);
    s.run.resources.gold = 100;
    expect(activitySlots(s)).toBe(2);

    expect(startTask(s, 'widen-study')).toBe(true); // pays Gold 40, occupies a slot while building
    expect(s.run.resources.gold).toBeCloseTo(60, 6);
    expect(slotsUsed(s)).toBe(1);

    simulate(s, 7); // length is 6s
    expect(activitySlots(s)).toBe(3);
    expect(s.run.tasks['widen-study'].count).toBe(1);
    expect(s.run.tasks['widen-study'].active).toBe(false); // freed its slot on completion
    expect(slotsUsed(s)).toBe(0);

    expect(startTask(s, 'widen-study')).toBe(false); // Max reached → locked
  });
});

describe('auto-pause / auto-resume', () => {
  it('a running task pauses when its per-second cost cannot be paid, then resumes', () => {
    const s = newGame(1);
    s.run.flags.awakened = true; // Study is gated behind the spark (T-005)
    startTask(s, 'study'); // Study drains Stamina 0.2/s
    s.run.vitals.stamina.cur = 0;
    s.run.vitals.stamina.regen = 0; // starve it deterministically

    step(s, 1);
    expect(s.run.tasks['study'].paused).toBe(true);
    expect(s.run.resources.insight).toBe(0); // no output while paused

    s.run.vitals.stamina.cur = 10; // resource is available again
    step(s, 1);
    expect(s.run.tasks['study'].paused).toBe(false);
    expect(s.run.resources.insight).toBeCloseTo(0.55, 6); // resumed producing
  });
});

describe('At-N repeat scaling', () => {
  it('Scribe Scroll gains +1 Scroll once it has been completed 5 times', () => {
    const s = newGame(1);
    s.run.skills = ['read-the-page']; // gated ONLY on Read the Page now (v0.1.2)
    s.run.resources.insight = 1000; // plenty to afford 6 scribes (3 each)
    s.run.vitals.stamina.max = 100; // headroom: each scribe costs 1 Stamina
    s.run.vitals.stamina.cur = 100;

    for (let i = 0; i < 5; i++) doTask(s, 'scribe-scroll');
    expect(s.run.tasks['scribe-scroll'].count).toBe(5);
    expect(s.run.resources.scroll).toBeCloseTo(5, 6); // first 5 are base output (1 each)

    doTask(s, 'scribe-scroll'); // 6th completion is boosted: +1
    expect(s.run.resources.scroll).toBeCloseTo(7, 6); // 5 + 2
    expect(s.run.resources.insight).toBeCloseTo(982, 6); // 6 × 3 spent
  });
});

describe('running tasks', () => {
  it('Smith completes a timed cycle, pays a Gold lump, and repeats', () => {
    const s = newGame(1);
    // Smith drains Stamina 0.4/s; give it headroom so the mechanic (not the tight
    // v0.1.1 Stamina budget) is what this test observes.
    s.run.vitals.stamina.max = 100;
    s.run.vitals.stamina.cur = 100;
    s.run.vitals.stamina.regen = 5;
    expect(startTask(s, 'smith')).toBe(true); // repeatable by default
    expect(s.run.tasks['smith'].repeat).toBe(true);

    simulate(s, 16); // one 15s cycle done, into the next
    expect(s.run.resources.gold).toBeCloseTo(5, 6);
    expect(s.run.tasks['smith'].count).toBe(1);
    expect(s.run.tasks['smith'].active).toBe(true); // still running (repeat on)

    simulate(s, 15); // second cycle completes
    expect(s.run.resources.gold).toBeCloseTo(10, 6);
    expect(s.run.tasks['smith'].count).toBe(2);
  });

  it('toggleRepeat flips the ↻ flag on a running task', () => {
    const s = newGame(1);
    startTask(s, 'smith');
    expect(s.run.tasks['smith'].repeat).toBe(true);
    expect(toggleRepeat(s, 'smith')).toBe(false);
    expect(s.run.tasks['smith'].repeat).toBe(false);
  });
});

describe('timed completion epsilon (playtest fix)', () => {
  it('a length:8 Limited task completes at EXACTLY its duration — no one-tick-late strand', () => {
    const s = newGame(1);
    s.run.flags.lairFounded = true; // Grand Library is now gated on the lair (v0.1.1)
    s.run.resources.gold = 100;
    expect(startTask(s, 'grand-library')).toBe(true); // length 8; raiseInsightCap 150
    expect(slotsUsed(s)).toBe(1);

    // Pre-fix, progress lands at 0.9999999999999984 at t=8 and the task never completes,
    // stranding its slot + spent Gold until an extra tick. It must complete AT 8s.
    simulate(s, 8);

    expect(s.run.tasks['grand-library'].count).toBe(1);
    expect(s.run.tasks['grand-library'].active).toBe(false); // slot freed on completion
    expect(slotsUsed(s)).toBe(0);
    expect(s.run.caps.insight).toBe(155); // 5 → 155 effect applied (base 5 + 150)
  });

  it('the exact-duration completion is identical via offline catch-up (advanceFixed path)', () => {
    const s = newGame(1);
    s.run.flags.lairFounded = true;
    s.run.resources.gold = 100;
    startTask(s, 'grand-library');
    s.lastSaved = Date.now() - 8000; // exactly 8s away
    applyOffline(s, Date.now());
    expect(s.run.tasks['grand-library'].count).toBe(1);
    expect(s.run.caps.insight).toBe(155);
  });

  it('a perpetual + running mix still behaves across the fix', () => {
    const s = newGame(1);
    s.run.flags.awakened = true;
    s.run.caps.insight = 1e9; // keep Study output observable
    // Give Stamina headroom so Study (0.2/s) + Smith (0.4/s) don't auto-pause under the
    // tight v0.1.1 budget — this test is about the timestep math, not scarcity.
    s.run.vitals.stamina.max = 1000;
    s.run.vitals.stamina.cur = 1000;
    s.run.vitals.stamina.regen = 50;
    startTask(s, 'study'); // perpetual (Insight +0.55/s)
    startTask(s, 'smith'); // running, length 15, repeatable
    simulate(s, 46); // 3 Smith cycles (15/30/45), Study trickles the whole time
    expect(s.run.tasks['smith'].count).toBe(3);
    expect(s.run.tasks['smith'].active).toBe(true); // repeat keeps it running
    expect(s.run.resources.insight).toBeCloseTo(0.55 * 46, 4);
  });
});

describe('limited start-cost rate (display fix)', () => {
  it('a building Limited task shows no phantom per-second start-cost drain', () => {
    const s = newGame(1);
    s.run.flags.lairFounded = true;
    s.run.resources.gold = 100;
    expect(startTask(s, 'grand-library')).toBe(true); // pays Gold 60 ONCE at start
    expect(s.run.resources.gold).toBeCloseTo(40, 6);

    // The one-time start-cost must NOT amortize as a per-second drain while it builds:
    // Gold stays flat (the 60 was already paid), unlike a repeating Running cycle.
    expect(taskRates(s).resources.gold ?? 0).toBe(0);
    const gl = listTaskInfo(s).find((i) => i.id === 'grand-library')!;
    expect(gl.net.gold ?? 0).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// v0.1.1 — Odd Jobs ladder + card reveal + Home items/caps + learnable Mana
// ---------------------------------------------------------------------------
describe('card reveal (display-only)', () => {
  it('a far-locked task is hidden; a one-away task is revealed', () => {
    const s = newGame(1);
    // Cleanse the Old Well needs BOTH Spark AND Renown ≥ 6 — 2 unmet reqs at the
    // Origin → far-locked → hidden.
    expect(taskInfo(s, TASK_BY_ID['cleanse-the-old-well']).revealed).toBe(false);

    // Satisfy one of the two (Renown) → now exactly one requirement away → revealed.
    s.run.resources.renown = 6;
    expect(taskInfo(s, TASK_BY_ID['cleanse-the-old-well']).revealed).toBe(true);

    // Scribe Scroll has ONE requirement now (Read the Page) → one-away → revealed
    // even at the Origin (v0.1.2).
    expect(taskInfo(s, TASK_BY_ID['scribe-scroll']).revealed).toBe(true);

    // find-work has ONE requirement (clean-stables ×20) → one-away → revealed even
    // before it's actually unlocked.
    expect(taskInfo(s, TASK_BY_ID['find-work']).revealed).toBe(true);

    // begging has no requirements → always revealed.
    expect(taskInfo(s, TASK_BY_ID['begging']).revealed).toBe(true);
  });

  it('reveal never changes gating: a revealed-but-locked task is still not startable', () => {
    const s = newGame(1);
    const info = taskInfo(s, TASK_BY_ID['find-work']);
    expect(info.revealed).toBe(true);
    expect(info.locked).toBe(true); // clean-stables ×20 not met
    expect(doTask(s, 'find-work')).toBe(false); // gating unchanged
  });
});

describe('Storage upgrades: Coin Pouch (gold cap) & Notebook (insight cap)', () => {
  it('building a Coin Pouch raises the Gold cap 25 → 50, and the tick clamps to it', () => {
    const s = newGame(1);
    expect(effectiveCap(s, 'gold')).toBe(25); // base cap (v0.1.2)
    s.run.resources.gold = 100; // fund the build (direct; not yet clamped by a tick)
    expect(startTask(s, 'coin-pouch')).toBe(true); // Limited, length 3, pays Gold 20
    expect(slotsUsed(s)).toBe(1);

    simulate(s, 4); // completes the 3s build
    expect(s.run.tasks['coin-pouch'].count).toBe(1);
    expect(s.run.caps.gold).toBe(50); // 25 + 25
    expect(slotsUsed(s)).toBe(0); // slot freed on completion

    s.run.resources.gold = 200; // over the new cap
    step(s, 0.1);
    expect(s.run.resources.gold).toBe(50); // clamped to the raised cap (excess lost)
  });

  it('building a Notebook raises the Insight cap 5 → 10', () => {
    const s = newGame(1);
    expect(s.run.caps.insight).toBe(5); // base cap (v0.1.2)
    s.run.resources.gold = 100;
    expect(startTask(s, 'notebook')).toBe(true); // pays Gold 20, length 3
    simulate(s, 4);
    expect(s.run.caps.insight).toBe(10); // 5 + 5
  });

  it('Coin Pouch is Limited to 3 builds → Gold cap 25 → 100, then locks (maxed)', () => {
    const s = newGame(1);
    for (let i = 0; i < 3; i++) {
      s.run.resources.gold = 100; // fund each build (and dodge the cap clamp between builds)
      expect(startTask(s, 'coin-pouch')).toBe(true);
      simulate(s, 4);
    }
    expect(s.run.caps.gold).toBe(100); // 25 + 25 × 3
    s.run.resources.gold = 100;
    expect(startTask(s, 'coin-pouch')).toBe(false); // Max 3 reached → locked
  });
});

describe('Scrolls: scribe-scroll crafting (v0.1.2)', () => {
  it('is gated on Read the Page and crafts a Scroll from Insight + Stamina', () => {
    const s = newGame(1);
    // No lair gate anymore — but it needs the Read the Page cantrip.
    expect(doTask(s, 'scribe-scroll')).toBe(false); // no cantrip yet
    s.run.skills = ['read-the-page'];
    s.run.resources.insight = 5; // costs Insight 3 + Stamina 1

    expect(doTask(s, 'scribe-scroll')).toBe(true);
    expect(s.run.resources.scroll).toBe(1);
    expect(s.run.resources.insight).toBeCloseTo(2, 6); // 5 − 3
    expect(s.run.vitals.stamina.cur).toBeCloseTo(4, 6); // 5 − 1
  });
});

describe('Odd Jobs: Tool Belt job-output multiplier', () => {
  it('equipping the Tool Belt scales a job task output (×1.2), non-jobs unaffected', () => {
    const s = newGame(1);
    s.run.resources.gold = 40;
    expect(buyItem(s, 'tool-belt')).toBe(true);
    expect(equipItem(s, 'tool-belt')).toBe(true); // vagrant has 1 slot

    // Begging is a job (base +0.1 Gold) → ×1.2 = 0.12.
    s.run.resources.gold = 0;
    expect(doTask(s, 'begging')).toBe(true);
    expect(s.run.resources.gold).toBeCloseTo(0.12, 6);
  });
});

describe('Scavenge: deterministic random loot', () => {
  it('grants exactly one material, picked deterministically for a fixed seed', () => {
    const run = () => {
      const s = newGame(4242);
      s.run.tasks['clean-stables'] = { active: false, progress: 0, paused: false, count: 32, repeat: false };
      expect(doTask(s, 'scavenge')).toBe(true); // stamina 5 ≥ 2
      const { moonpetal, ironOre, spiritDust } = s.run.resources;
      return { moonpetal, ironOre, spiritDust, rng: s.rngState };
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b); // same seed → same draw → same material (deterministic)

    // Exactly one material got +1, and the RNG state advanced.
    const total = a.moonpetal + a.ironOre + a.spiritDust;
    expect(total).toBe(1);
    expect(a.rng).not.toBe(newGame(4242).rngState);
  });
});

describe('learnable Mana (Inner Wellspring)', () => {
  it('unlocks Mana: sets max 10 / regen 0.1, and it then regenerates', () => {
    const s = newGame(1);
    expect(s.run.vitals.mana.max).toBe(0); // locked at the start
    s.run.resources.insight = 100;
    s.run.resources.scroll = 1; // Inner Wellspring costs a Scroll (v0.1.2)
    expect(learnCantrip(s, 'read-the-page')).toBe(true);
    expect(learnCantrip(s, 'inner-wellspring')).toBe(true);
    expect(s.run.vitals.mana.max).toBe(10);
    expect(s.run.vitals.mana.regen).toBeCloseTo(0.1, 6);

    const before = s.run.vitals.mana.cur;
    step(s, 1);
    expect(s.run.vitals.mana.cur).toBeCloseTo(before + 0.1, 6);
  });
});

describe('Inn rent', () => {
  it('living at the Inn drains Gold each second (no eviction, floored at 0)', () => {
    const s = newGame(1);
    s.run.flags.lairFounded = true; // Inn requires the lair beat
    expect(moveHome(s, 'inn')).toBe(true);
    s.run.resources.gold = 10;
    step(s, 1); // rent 0.1/s
    expect(s.run.resources.gold).toBeCloseTo(9.9, 6);
  });
});
