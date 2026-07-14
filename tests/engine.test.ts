import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine/state';
import { simulate, step } from '../src/engine/tick';
import { serialize, deserialize, safeLoad, exportString, importString } from '../src/engine/save';
import { applyOffline } from '../src/engine/offline';
import { PLACEHOLDER_GENERATOR, OFFLINE_CAP_MS } from '../src/content/config';
import { formatNumber } from '../src/engine/format';

describe('production math', () => {
  it('generator advances the resource by rate * seconds', () => {
    const s = newGame(123);
    const start = s.run.resources[PLACEHOLDER_GENERATOR.resource];
    simulate(s, 60);
    const got = s.run.resources[PLACEHOLDER_GENERATOR.resource] - start;
    expect(got).toBeCloseTo(PLACEHOLDER_GENERATOR.rate * 60, 4);
    expect(s.playtime).toBeCloseTo(60, 4);
  });

  it('a single step scales by dt', () => {
    const s = newGame(1);
    step(s, 2);
    expect(s.run.resources.gold).toBeCloseTo(PLACEHOLDER_GENERATOR.rate * 2, 6);
  });

  it('vitals regen toward max and never overshoot', () => {
    const s = newGame(1);
    s.run.vitals.stamina.cur = 0;
    simulate(s, 10_000);
    expect(s.run.vitals.stamina.cur).toBe(s.run.vitals.stamina.max);
  });
});

describe('save round-trip', () => {
  it('serialize -> deserialize preserves state', () => {
    const s = newGame(42);
    simulate(s, 30);
    const round = deserialize(serialize(s));
    expect(round).toEqual(s);
  });

  it('clipboard export -> import round-trips', () => {
    const s = newGame(7);
    simulate(s, 5);
    expect(importString(exportString(s))).toEqual(s);
  });

  it('safeLoad rejects corrupt data without throwing', () => {
    expect(safeLoad('{ not json').ok).toBe(false);
    expect(safeLoad('').ok).toBe(false);
    expect(safeLoad(null).ok).toBe(false);
    expect(safeLoad('{"foo":1}').ok).toBe(false); // valid JSON, wrong shape
  });

  it('safeLoad accepts a good save', () => {
    const s = newGame(9);
    const res = safeLoad(serialize(s));
    expect(res.ok).toBe(true);
    expect(res.state?.seed).toBe(9);
  });
});

describe('offline catch-up', () => {
  it('advances resources for elapsed time', () => {
    const s = newGame(1);
    s.lastSaved = Date.now() - 60_000; // 60s ago
    const summary = applyOffline(s, Date.now());
    expect(summary.gains.gold).toBeCloseTo(PLACEHOLDER_GENERATOR.rate * 60, 2);
    expect(summary.capped).toBe(false);
  });

  it('caps very long absences at the offline cap', () => {
    const s = newGame(1);
    s.lastSaved = Date.now() - OFFLINE_CAP_MS * 3;
    const summary = applyOffline(s, Date.now());
    expect(summary.capped).toBe(true);
    expect(summary.appliedMs).toBe(OFFLINE_CAP_MS);
    expect(Number.isFinite(s.run.resources.gold)).toBe(true);
    expect(s.run.resources.gold).toBeGreaterThan(0);
  });
});

describe('number notation', () => {
  it('formats suffix / full / scientific', () => {
    expect(formatNumber(1900, 'suffix')).toBe('1.90K');
    expect(formatNumber(1900, 'full')).toBe('1,900');
    expect(formatNumber(1900, 'scientific')).toBe('1.90e3');
    expect(formatNumber(0, 'suffix')).toBe('0');
  });
});
