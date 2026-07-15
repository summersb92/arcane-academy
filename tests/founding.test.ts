// T-006a — the Act I goal loop: contracts (Renown), Home fixtures (sinks), the
// Founding finale, and the tabs-as-eras unfold. Pure engine; no DOM (toView is the
// pure view-model mapper, safe to call in a test).

import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import { startTask, listTaskInfo } from '../src/engine/systems/tasks';
import { essenceBase, essenceRates } from '../src/engine/systems/essence';
import {
  buyItem,
  equipItem,
  moveHome,
  homeResourceRates,
  effectiveCap,
} from '../src/engine/systems/home';
import { learnCantrip } from '../src/engine/systems/skills';
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
// Home items & tiers (v0.1.1) — buy/equip Modifiers that raise production/caps
// ---------------------------------------------------------------------------
describe('home items & tiers', () => {
  it('equipping a Hearth Stone awakens ▲ Fire and adds its trickle via essenceBase()', () => {
    const s = newGame(5); // fresh: no Spark, Fire asleep
    s.run.resources.gold = 25;
    s.run.resources.ironOre = 2;
    expect(s.run.essence.fire.awakened).toBe(false);

    expect(buyItem(s, 'hearth-stone')).toBe(true);
    expect(s.run.resources.gold).toBe(0); // cost 25 paid
    expect(s.run.resources.ironOre).toBe(0); // cost 2 paid
    expect(equipItem(s, 'hearth-stone')).toBe(true); // awakens Fire on equip

    expect(s.run.essence.fire.awakened).toBe(true);
    expect(essenceBase(s).fire).toBeCloseTo(0.15, 6);
    expect(essenceRates(s).fire).toBeCloseTo(0.15, 6); // ×1.0 output mult
  });

  it('equipping a Focusing Lens adds passive Insight/s (produced by runHome, before the cap clamp)', () => {
    const s = newGame(6);
    s.run.resources.gold = 30;
    s.run.resources.spiritDust = 2;
    expect(homeResourceRates(s).insight ?? 0).toBe(0);

    expect(buyItem(s, 'focusing-lens')).toBe(true);
    expect(equipItem(s, 'focusing-lens')).toBe(true);
    expect(homeResourceRates(s).insight).toBeCloseTo(0.12, 6);

    s.run.resources.insight = 0;
    step(s, 10);
    expect(s.run.resources.insight).toBeCloseTo(0.12 * 10, 5); // +0.12/s for 10s
  });

  it('a Coin Pouch raises the effective Gold cap, and a Warded Chest raises material caps', () => {
    const s = newGame(7);
    s.run.resources.gold = 70; // enough for both (30 + 40)
    expect(effectiveCap(s, 'gold')).toBe(50);
    expect(effectiveCap(s, 'moonpetal')).toBe(50);

    buyItem(s, 'coin-pouch');
    equipItem(s, 'coin-pouch');
    expect(effectiveCap(s, 'gold')).toBe(100); // 50 + 50

    buyItem(s, 'warded-chest');
    equipItem(s, 'warded-chest'); // vagrant only has 1 slot…
    // …so the second equip fails until we move up; the Coin Pouch stays equipped.
    expect(s.run.home.equipped).toEqual(['coin-pouch']);
  });

  it('the Mana Crystal is gated on Inner Wellspring; Inn move is gated on the lair', () => {
    const s = newGame(8);
    s.run.resources.gold = 100;
    // Mana Crystal needs the Inner Wellspring cantrip first.
    expect(buyItem(s, 'mana-crystal')).toBe(false);
    s.run.resources.insight = 100;
    learnCantrip(s, 'read-the-page');
    learnCantrip(s, 'inner-wellspring');
    expect(buyItem(s, 'mana-crystal')).toBe(true);

    // Inn requires the lair beat.
    expect(moveHome(s, 'inn')).toBe(false);
    s.run.flags.lairFounded = true;
    expect(moveHome(s, 'inn')).toBe(true);
    expect(s.run.home.tier).toBe('inn');
  });
});

// ---------------------------------------------------------------------------
// The view-model reflects EQUIPPED items (regen/rate readouts, sourced tooltips)
// ---------------------------------------------------------------------------
describe('view-model reflects equipped items', () => {
  it('a Charm of Vigor moves the Character panel Life regen (effective, not base)', () => {
    const s = newGame(30);
    const baseLifeRegen = s.run.vitals.life.regen; // 0.1 base
    s.run.resources.gold = 20;
    expect(buyItem(s, 'charm-of-vigor')).toBe(true);
    expect(equipItem(s, 'charm-of-vigor')).toBe(true); // vagrant's single slot

    // The published view shows base + item mod (0.1 + 0.05); the raw vital is untouched.
    expect(toView(s).vitals.life.regen).toBeCloseTo(baseLifeRegen + 0.05, 6);
    expect(s.run.vitals.life.regen).toBeCloseTo(baseLifeRegen, 6);
  });

  it('a Focusing Lens shows in the Insight rate AND its sourced-number tooltip', () => {
    const s = newGame(31);
    s.run.resources.gold = 30;
    s.run.resources.spiritDust = 2;
    expect(buyItem(s, 'focusing-lens')).toBe(true);
    expect(equipItem(s, 'focusing-lens')).toBe(true);

    const insight = toView(s).resources.insight;
    expect(insight.rate).toBeCloseTo(0.12, 6); // home production folds into the shown rate
    expect(insight.rateTip).toContain('Focusing Lens'); // …and the breakdown names it
    expect(insight.rateTip).toContain('0.12');
  });

  it('a Hearth Stone shows in the Fire essence rate AND its sourced-number tooltip', () => {
    const s = newGame(32);
    s.run.resources.gold = 25;
    s.run.resources.ironOre = 2;
    expect(buyItem(s, 'hearth-stone')).toBe(true);
    expect(equipItem(s, 'hearth-stone')).toBe(true); // awakens Fire on equip

    const fire = toView(s).essence.find((e) => e.id === 'fire')!;
    expect(fire.awakened).toBe(true);
    expect(fire.rate).toBeCloseTo(0.15, 6);
    expect(fire.rateTip).toContain('Hearth Stone');
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
