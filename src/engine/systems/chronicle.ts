// Chronicle — the Main-tab event log (task completions, unlocks, the Founding).
// Pure engine, no DOM. Entries are stamped with simulated playtime and the stored
// list is bounded so a long session can't bloat the save.

import type { ChronicleEntry, GameState } from '../state';

const MAX_STORED = 60;

/** Append an event to the chronicle, stamped at the current playtime. Trims to MAX_STORED. */
export function logEvent(state: GameState, text: string, kind?: ChronicleEntry['kind']): void {
  state.run.chronicle.push({ at: state.playtime, text, kind });
  if (state.run.chronicle.length > MAX_STORED) {
    state.run.chronicle.splice(0, state.run.chronicle.length - MAX_STORED);
  }
}
