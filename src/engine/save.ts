// Save system — ONE portable, versioned JSON format used by every transport:
// localStorage autosave, clipboard export/import string, and save-to-file /
// load-from-file (.aasave). The browser and the CLI reuse these exact functions,
// so a file the browser downloads loads via `cli load` and vice-versa.
// No DOM, no Svelte — the DOM download/upload is a thin UI adapter over this.

import { STARTING } from '../content/config';
import { ELEMENTS, SAVE_VERSION, type ElementId, type GameState, type ResourceId } from './state';

export const SAVE_MAGIC = 'arcane-academy-save';
export const SAVE_FILE_EXT = '.aasave';
export const LOCALSTORAGE_KEY = 'aa-save';

interface SaveEnvelope {
  magic: string;
  version: number;
  state: GameState;
}

export interface LoadResult {
  ok: boolean;
  state?: GameState;
  error?: string;
  migratedFrom?: number;
}

/** Serialize to the portable string. `pretty` for human-readable files. */
export function serialize(state: GameState, pretty = false): string {
  const envelope: SaveEnvelope = { magic: SAVE_MAGIC, version: state.version, state };
  return JSON.stringify(envelope, null, pretty ? 2 : 0);
}

/**
 * Parse + validate + migrate. THROWS on any corruption — callers that must not
 * lose the existing save should use `safeLoad` instead.
 */
export function deserialize(text: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Save is not valid JSON.');
  }
  if (!isEnvelope(parsed)) throw new Error('Unrecognized save format (missing magic/state).');

  let state = parsed.state;
  if (parsed.version < SAVE_VERSION) state = migrate(state, parsed.version);
  else if (parsed.version > SAVE_VERSION) {
    throw new Error(`Save is from a newer version (${parsed.version} > ${SAVE_VERSION}).`);
  }

  // Backfill missing structure FIRST (so read models never see `undefined`), then
  // reject anything left that is structurally present but garbage (NaN / wrong type).
  normalize(state);
  validate(state);
  return state;
}

/** Never throws. On failure returns ok:false and leaves the caller's save intact. */
export function safeLoad(text: string | null | undefined): LoadResult {
  if (!text || !text.trim()) return { ok: false, error: 'No save data.' };
  try {
    const parsedVersion = peekVersion(text);
    const state = deserialize(text);
    return {
      ok: true,
      state,
      migratedFrom: parsedVersion !== undefined && parsedVersion < SAVE_VERSION ? parsedVersion : undefined,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Versioned migration ladder — one `vN → vN+1` step per rung, applied in order.
 * Real (not a no-op) even though only v1 ships today: a pre-current (v0) envelope
 * upgrades through migrate0to1. `normalize()` runs AFTER this to backfill anything
 * a step didn't touch, so each rung only needs to handle its own shape delta.
 */
export function migrate(state: GameState, fromVersion: number): GameState {
  let s = state;
  let v = fromVersion;
  if (v < 1) {
    s = migrate0to1(s);
    v = 1;
  }
  // future: if (v === 1) { s = migrate1to2(s); v = 2; }
  void v;
  s.version = SAVE_VERSION;
  return s;
}

/** v0 → v1: the pre-release format predates the Task/Activity system (T-004).
 *  Establish its containers so v1 read models resolve; normalize() fills the rest. */
function migrate0to1(s: GameState): GameState {
  const run = (s.run ??= {} as GameState['run']);
  run.tasks ??= {};
  if (typeof run.activitySlots !== 'number') run.activitySlots = STARTING.activitySlots;
  return s;
}

// --- clipboard export/import (same portable format, compact) ---
export const exportString = (state: GameState): string => serialize(state, false);
export const importString = (text: string): GameState => deserialize(text);

// --- file helpers the UI download/upload and the CLI both reuse (pretty JSON) ---
export const toFileString = (state: GameState): string => serialize(state, true);
export const fromFileString = (text: string): GameState => deserialize(text);

// --- internals ---
function isEnvelope(v: unknown): v is SaveEnvelope {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as SaveEnvelope).magic === SAVE_MAGIC &&
    typeof (v as SaveEnvelope).version === 'number' &&
    typeof (v as SaveEnvelope).state === 'object' &&
    (v as SaveEnvelope).state !== null
  );
}

function peekVersion(text: string): number | undefined {
  try {
    const p = JSON.parse(text) as { version?: unknown };
    return typeof p.version === 'number' ? p.version : undefined;
  } catch {
    return undefined;
  }
}

const RESOURCE_IDS: ResourceId[] = ['gold', 'insight', 'renown', 'moonpetal', 'ironOre', 'spiritDust'];
const VITAL_IDS = ['life', 'stamina', 'mana'] as const;

/**
 * Fill defaults for every `run.*` field a read model touches, so `toView()` (which
 * runs on the initial setState/publish, BEFORE the first tick's self-heal) never
 * dereferences `undefined`. Only fills *absent* containers/keys — a present-but-
 * malformed value (e.g. a `{}` vital) is left for `validate()` to reject, never
 * silently guessed. Idempotent on a complete save. Exported for the migrate ladder
 * and tests.
 */
export function normalize(state: GameState): void {
  const run = state?.run;
  if (!run || typeof run !== 'object') return; // validate() will reject a missing run

  // containers the read models iterate/spread — undefined here would throw on render
  run.tasks ??= {};
  run.flags ??= {};
  run.home ??= {};
  run.skills ??= [];
  run.chronicle ??= [];
  if (run.phase === undefined) run.phase = 'origin';
  if (typeof run.act !== 'number') run.act = 1;
  if (typeof run.activitySlots !== 'number') run.activitySlots = STARTING.activitySlots;

  run.caps ??= { insight: STARTING.insightCap };

  run.resources ??= {} as GameState['run']['resources'];
  for (const id of RESOURCE_IDS) run.resources[id] ??= 0;

  if (!run.vitals || typeof run.vitals !== 'object') {
    run.vitals = { life: { ...STARTING.life }, stamina: { ...STARTING.stamina }, mana: { ...STARTING.mana } };
  } else {
    run.vitals.life ??= { ...STARTING.life };
    run.vitals.stamina ??= { ...STARTING.stamina };
    run.vitals.mana ??= { ...STARTING.mana };
  }

  if (!run.essence || typeof run.essence !== 'object') {
    run.essence = {} as GameState['run']['essence'];
  }
  for (const id of ELEMENTS as ElementId[]) {
    if (!run.essence[id] || typeof run.essence[id] !== 'object') {
      run.essence[id] = { amount: 0, awakened: false };
    }
  }
}

/** Structural + finiteness check — guards against NaN/garbage silently loading. */
function validate(state: GameState): void {
  const run = state?.run;
  if (!run || typeof run !== 'object') throw new Error('Save missing run state.');

  if (!run.resources || typeof run.resources !== 'object') throw new Error('Save missing resources.');
  for (const [k, val] of Object.entries(run.resources)) {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Resource "${k}" is not a finite number.`);
    }
  }

  if (!run.vitals?.life || !run.vitals?.stamina || !run.vitals?.mana) {
    throw new Error('Save missing vitals.');
  }
  for (const key of VITAL_IDS) {
    const v = run.vitals[key];
    for (const field of ['cur', 'max', 'regen'] as const) {
      if (typeof v[field] !== 'number' || !Number.isFinite(v[field])) {
        throw new Error(`Vital "${key}.${field}" is not a finite number.`);
      }
    }
  }

  if (!run.caps || typeof run.caps.insight !== 'number' || !Number.isFinite(run.caps.insight)) {
    throw new Error('Save has an invalid insight cap.');
  }

  if (run.essence && typeof run.essence === 'object') {
    for (const [id, e] of Object.entries(run.essence)) {
      if (!e || typeof e.amount !== 'number' || !Number.isFinite(e.amount)) {
        throw new Error(`Essence "${id}" amount is not a finite number.`);
      }
    }
  }

  if (typeof state.playtime !== 'number' || !Number.isFinite(state.playtime)) {
    throw new Error('Save has invalid playtime.');
  }
  if (typeof state.lastSaved !== 'number' || !Number.isFinite(state.lastSaved)) {
    throw new Error('Save has invalid lastSaved.');
  }
}
