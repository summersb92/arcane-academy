// Save system — ONE portable, versioned JSON format used by every transport:
// localStorage autosave, clipboard export/import string, and save-to-file /
// load-from-file (.aasave). The browser and the CLI reuse these exact functions,
// so a file the browser downloads loads via `cli load` and vice-versa.
// No DOM, no Svelte — the DOM download/upload is a thin UI adapter over this.

import { SAVE_VERSION, type GameState } from './state';

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

/** Versioned migration ladder. Stub for v0.1 (only version 1 exists). */
export function migrate(state: GameState, fromVersion: number): GameState {
  let s = state;
  let v = fromVersion;
  // while (v === 0) { s = migrate0to1(s); v = 1; }  // example future step
  void v;
  s.version = SAVE_VERSION;
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

/** Light structural + finiteness check — guards against NaN/garbage silently loading. */
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
  if (typeof state.playtime !== 'number' || !Number.isFinite(state.playtime)) {
    throw new Error('Save has invalid playtime.');
  }
}
