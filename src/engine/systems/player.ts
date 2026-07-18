// Character model (v0.1.2) — the mage's chosen name + earned title. Pure engine (NO
// DOM/Svelte): the same action runs in the browser, the CLI, and tests. The name lives
// in run.name (RunState); '' means "not yet named" (the character-creation trigger the
// UI reads via UiState.player.needsNaming). Titles are display-only honorifics for now.

import type { GameState } from '../state';

/** Longest name we store — clamps a pasted essay to something the panels can render. */
export const MAX_NAME_LEN = 24;

/**
 * Set the player's name: trimmed and clamped to MAX_NAME_LEN. An empty (or whitespace-
 * only) name is IGNORED — returns false with no mutation, so a blank submit can't wipe
 * an existing name or "name" a fresh mage the empty string.
 */
export function setName(state: GameState, name: string): boolean {
  const trimmed = name.trim().slice(0, MAX_NAME_LEN).trim();
  if (!trimmed) return false;
  state.run.name = trimmed;
  return true;
}
