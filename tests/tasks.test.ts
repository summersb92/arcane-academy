import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import {
  doTask,
  startTask,
  stopTask,
  toggleRepeat,
  slotsUsed,
  activitySlots,
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
