// T-006a — the Act I goal loop: contracts (Renown), Home fixtures (sinks), the
// Founding finale, and the tabs-as-eras unfold. Pure engine; no DOM (toView is the
// pure view-model mapper, safe to call in a test).

import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import { startTask, listTaskInfo } from '../src/engine/systems/tasks';
import { essenceBase, essenceRates } from '../src/engine/systems/essence';
import { homeInsightPerSec, fixtureLevel } from '../src/engine/systems/home';
import { foundingStatus, canFound } from '../src/engine/systems/founding';
import { runProgression, isAwakened } from '../src/engine/systems/progression';
import { FOUNDING, LAIR } from '../src/content/config';
import { toView } from '../src/ui/stores';

/** A Phase-3 hedge-mage: awakened, Fire open + stocked, lair claimed, funds on hand. */
function hedgeMage(seed = 1) {
  const s = newGame(seed);
  s.run.flags.awakened = true;
  s.run.flags.lairFounded = true;
  s.run.phase = 'lair';
  s.run.skills = ['read-the-page', 'spark'];
  s.run.essence.fire.awakened = true;
  s.run.essence.fire.amount = 100;
  return s;
}

// ---------------------------------------------------------------------------
// Contracts — the Renown source
// ---------------------------------------------------------------------------
describe('contracts (Renown source)', () => {
  it('a fulfilled contract pays Renown ★ and Gold (nothing else generates Renown)', () => {
    const s = hedgeMage(1);
    expect(s.run.resources.renown).toBe(0);

    expect(startTask(s, 'ward-a-barn')).toBe(true); // Running, length 12, repeatable
    simulate(s, 13); // one full cycle

    expect(s.run.tasks['ward-a-barn'].count).toBeGreaterThanOrEqual(1);
    expect(s.run.resources.renown).toBeGreaterThan(0); // Renown accrued
    expect(s.run.resources.gold).toBeGreaterThanOrEqual(10);
    expect(s.run.resources.ironOre).toBeGreaterThanOrEqual(2); // material drop for fixtures
  });

  it('a contract is gated behind the spark (needs Fire) — refused before awakening', () => {
    const s = newGame(2); // fresh: no skills, no Fire
    expect(startTask(s, 'ward-a-barn')).toBe(false);
    expect(s.run.tasks['ward-a-barn']?.active ?? false).toBe(false);
    expect(s.run.resources.renown).toBe(0);
  });

  it('the bigger contract gates on a little Renown first', () => {
    const s = hedgeMage(3);
    expect(startTask(s, 'cleanse-the-old-well')).toBe(false); // renown 0 < 6
    s.run.resources.renown = 6;
    expect(startTask(s, 'cleanse-the-old-well')).toBe(true);
  });

  it('contract Fire drain auto-pauses when essence runs out (opt-in, never a hard fail)', () => {
    const s = hedgeMage(4);
    s.run.essence.fire.amount = 0.1; // barely any Fire
    startTask(s, 'ward-a-barn');
    step(s, 1); // Fire 0.15/s can't be paid → pause, no Renown
    expect(s.run.tasks['ward-a-barn'].paused).toBe(true);
    expect(s.run.resources.renown).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Home fixtures — sinks that raise production (via essenceBase / homeInsight)
// ---------------------------------------------------------------------------
describe('home fixtures (sinks)', () => {
  it('building a Hearth raises Fire essence via essenceBase() and consumes Gold + material', () => {
    const s = hedgeMage(5);
    s.run.resources.gold = 100;
    s.run.resources.ironOre = 10;
    const beforeFire = essenceBase(s).fire ?? 0; // Spark's 0.2
    const goldBefore = s.run.resources.gold;

    expect(startTask(s, 'hearth')).toBe(true);
    expect(s.run.resources.gold).toBe(goldBefore - 25); // startCost paid
    expect(s.run.resources.ironOre).toBe(8);
    simulate(s, 7); // length 6 → level 1

    expect(fixtureLevel(s, 'hearth')).toBe(1);
    const afterFire = essenceBase(s).fire ?? 0;
    expect(afterFire).toBeGreaterThan(beforeFire);
    expect(afterFire).toBeCloseTo(0.2 + 0.15, 6); // Spark + Hearth L1
    expect(essenceRates(s).fire).toBeCloseTo(0.35, 6); // ×1.0 output mult
  });

  it('building a Study Desk adds passive Insight/s (folded in before the cap clamp)', () => {
    const s = hedgeMage(6);
    s.run.resources.gold = 100;
    s.run.resources.insight = 50;
    s.run.resources.spiritDust = 10;
    s.run.caps.insight = 1e9; // observe the rate cleanly
    expect(homeInsightPerSec(s)).toBe(0);

    expect(startTask(s, 'study-desk')).toBe(true);
    expect(s.run.resources.insight).toBe(25); // 50 - 25 insight cost (Insight IS a sink)
    simulate(s, 6); // length 5 → level 1
    expect(fixtureLevel(s, 'study-desk')).toBe(1);
    expect(homeInsightPerSec(s)).toBeCloseTo(0.12, 6);

    const before = s.run.resources.insight;
    step(s, 10);
    expect(s.run.resources.insight).toBeCloseTo(before + 0.12 * 10, 5);
  });

  it('the Ossuary awakens ☾ Dark on build, then trickles it', () => {
    const s = hedgeMage(7);
    s.run.resources.gold = 100;
    s.run.resources.spiritDust = 10;
    expect(s.run.essence.dark.awakened).toBe(false);

    startTask(s, 'ossuary');
    simulate(s, 9); // length 8 → level 1
    expect(fixtureLevel(s, 'ossuary')).toBe(1);
    expect(s.run.essence.dark.awakened).toBe(true);
    expect(essenceBase(s).dark).toBeCloseTo(0.12, 6);
  });
});

// ---------------------------------------------------------------------------
// The Founding gate — opens only when ALL four requirements are met
// ---------------------------------------------------------------------------
describe('the Founding gate', () => {
  it('canFound() is false until Gold + Renown + Charter + Site are ALL satisfied', () => {
    const s = newGame(8);
    s.run.flags.lairFounded = true;
    expect(canFound(s)).toBe(false);

    s.run.resources.gold = FOUNDING.goldHeld; // 1/4
    expect(foundingStatus(s).metCount).toBe(1);
    expect(canFound(s)).toBe(false);

    s.run.resources.renown = FOUNDING.renown; // 2/4
    expect(canFound(s)).toBe(false);

    s.run.flags.hasCharter = true; // 3/4
    expect(canFound(s)).toBe(false);

    s.run.flags.hasSite = true; // 4/4
    expect(foundingStatus(s).allMet).toBe(true);
    expect(canFound(s)).toBe(true);

    // …and the found-academy task itself unlocks in lockstep with the gate.
    const found = listTaskInfo(s).find((i) => i.id === 'found-academy')!;
    expect(found.locked).toBe(false);
    expect(found.startable).toBe(true);
  });

  it('a missing Charter or Site alone keeps the gate shut', () => {
    const s = newGame(9);
    s.run.flags.lairFounded = true;
    s.run.resources.gold = FOUNDING.goldHeld;
    s.run.resources.renown = FOUNDING.renown;
    s.run.flags.hasSite = true; // charter still missing
    expect(canFound(s)).toBe(false);
    expect(listTaskInfo(s).find((i) => i.id === 'found-academy')!.locked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The Founding finale — flips the phase and un-greys the Academy tab
// ---------------------------------------------------------------------------
describe('the Founding finale', () => {
  it('completing found-academy sets phase=founded and flips the Academy tab open', () => {
    const s = hedgeMage(10);
    s.run.resources.gold = FOUNDING.goldHeld + 50;
    s.run.resources.renown = FOUNDING.renown + 5;
    s.run.flags.hasCharter = true;
    s.run.flags.hasSite = true;

    // Before: Academy is the greyed beacon.
    const academyBefore = toView(s).tabs.find((t) => t.id === 'academy')!;
    expect(academyBefore.locked).toBe(true);
    expect(s.run.phase).toBe('lair');

    expect(startTask(s, 'found-academy')).toBe(true); // Limited, length 8
    simulate(s, 9);

    expect(s.run.flags.founded).toBe(true);
    expect(s.run.phase).toBe('founded');

    // After: the tab un-greys, and the view-model reports the finale.
    const view = toView(s);
    const academyAfter = view.tabs.find((t) => t.id === 'academy')!;
    expect(academyAfter.locked).toBe(false);
    expect(academyAfter.label).toContain('Academy');
    expect(view.founding.founded).toBe(true);
    // A celebratory 'found'-kind Chronicle line marks the moment.
    expect(s.run.chronicle.some((c) => c.kind === 'found' && /found your Academy/i.test(c.text))).toBe(true);
  });

  it('found-academy is refused while any requirement is unmet (no accidental founding)', () => {
    const s = hedgeMage(11);
    s.run.resources.gold = FOUNDING.goldHeld + 50;
    s.run.resources.renown = FOUNDING.renown + 5;
    s.run.flags.hasCharter = true; // no Site
    expect(startTask(s, 'found-academy')).toBe(false);
    expect(s.run.flags.founded ?? false).toBe(false);
    expect(s.run.phase).toBe('lair');
  });
});

// ---------------------------------------------------------------------------
// Tabs-as-eras unfold — the lair beat reveals Home
// ---------------------------------------------------------------------------
describe('the lair beat (Home reveal)', () => {
  it('post-spark, earning a purse claims the lair and reveals the Home tab', () => {
    const s = newGame(12);
    s.run.flags.awakened = true; // spark already fired
    s.run.phase = 'awakened';
    expect(s.run.flags.lairFounded ?? false).toBe(false);
    expect(toView(s).tabs.find((t) => t.id === 'home')!.visible).toBe(false);

    s.run.resources.gold = LAIR.goldThreshold; // trip the Gold arm (above the spark threshold)
    runProgression(s);
    expect(s.run.flags.lairFounded).toBe(true);
    expect(s.run.phase).toBe('lair');
    expect(toView(s).tabs.find((t) => t.id === 'home')!.visible).toBe(true);
  });

  it('an idle player who only studied (has a cantrip) still claims the lair', () => {
    const s = newGame(13);
    s.run.flags.awakened = true;
    s.run.phase = 'awakened';
    s.run.skills = ['read-the-page']; // learned a cantrip, no Gold
    runProgression(s);
    expect(s.run.flags.lairFounded).toBe(true);
    expect(s.run.phase).toBe('lair');
  });

  it('neither the spark nor the lair fires before their triggers', () => {
    const s = newGame(14);
    s.run.resources.gold = 20; // below the spark threshold (25); timer not elapsed
    runProgression(s);
    expect(isAwakened(s)).toBe(false);
    expect(s.run.flags.lairFounded ?? false).toBe(false);
  });
});
