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
} from '../src/engine/systems/tasks';

describe('instant tasks', () => {
  it('Clean Stables pays Stamina and grants Gold, once per do', () => {
    const s = newGame(1);
    expect(doTask(s, 'clean-stables')).toBe(true);
    expect(s.run.resources.gold).toBeCloseTo(2.5, 6);
    expect(s.run.vitals.stamina.cur).toBeCloseTo(9, 6);

    doTask(s, 'clean-stables');
    expect(s.run.resources.gold).toBeCloseTo(5, 6);
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
  it('Scribe Scroll gains +1 output once it has been completed 5 times', () => {
    const s = newGame(1);
    s.run.resources.insight = 1000; // plenty to afford 6 scribes (10 each)

    for (let i = 0; i < 5; i++) doTask(s, 'scribe-scroll');
    expect(s.run.tasks['scribe-scroll'].count).toBe(5);
    expect(s.run.resources.spiritDust).toBeCloseTo(5, 6); // first 5 are base output (1 each)

    doTask(s, 'scribe-scroll'); // 6th completion is boosted: +1
    expect(s.run.resources.spiritDust).toBeCloseTo(7, 6); // 5 + 2
    expect(s.run.resources.insight).toBeCloseTo(940, 6); // 6 × 10 spent
  });
});

describe('running tasks', () => {
  it('Smith completes a timed cycle, pays a Gold lump, and repeats', () => {
    const s = newGame(1);
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
    s.run.flags.awakened = true; // Grand Library requires the spark
    s.run.resources.gold = 100;
    expect(startTask(s, 'grand-library')).toBe(true); // length 8; raiseInsightCap 150
    expect(slotsUsed(s)).toBe(1);

    // Pre-fix, progress lands at 0.9999999999999984 at t=8 and the task never completes,
    // stranding its slot + spent Gold until an extra tick. It must complete AT 8s.
    simulate(s, 8);

    expect(s.run.tasks['grand-library'].count).toBe(1);
    expect(s.run.tasks['grand-library'].active).toBe(false); // slot freed on completion
    expect(slotsUsed(s)).toBe(0);
    expect(s.run.caps.insight).toBe(250); // 100 → 250 effect applied
  });

  it('the exact-duration completion is identical via offline catch-up (advanceFixed path)', () => {
    const s = newGame(1);
    s.run.flags.awakened = true;
    s.run.resources.gold = 100;
    startTask(s, 'grand-library');
    s.lastSaved = Date.now() - 8000; // exactly 8s away
    applyOffline(s, Date.now());
    expect(s.run.tasks['grand-library'].count).toBe(1);
    expect(s.run.caps.insight).toBe(250);
  });

  it('a perpetual + running mix still behaves across the fix', () => {
    const s = newGame(1);
    s.run.flags.awakened = true;
    s.run.caps.insight = 1e9; // keep Study output observable
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
    s.run.flags.awakened = true;
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
