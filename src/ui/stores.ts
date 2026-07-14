// Svelte store bridge — the thin UI adapter over the framework-agnostic engine.
// It owns the live GameState, drives the fixed-timestep tick from an rAF loop
// (the only DOM the sim touches lives HERE, never in src/engine), and republishes
// a derived UiState to the panels at a throttled rate.

import { writable } from 'svelte/store';
import { createAccumulator } from '../engine/tick';
import { newGame, type GameState, ELEMENTS, type ElementId } from '../engine/state';
import { setNotation } from './format';

// ---- UiState: the stable view contract the panels read ----
export interface ResourceView {
  amount: number;
  rate: number;
  cap?: number;
}
export interface VitalView {
  cur: number;
  max: number;
}
export interface EssenceView {
  id: string;
  label: string;
  glyph: string;
  cls: string;
  amount: number;
  rate: number;
  awakened: boolean;
}
export interface TaskView {
  id: string;
  name: string;
  kind: string;
  cls: string;
  io: string;
  tag: string;
  active: boolean;
  locked: boolean;
  paused: boolean;
  progress: number;
  lockText?: string;
}
export interface TabView {
  id: string;
  label: string;
  visible: boolean;
  locked: boolean;
}
export interface ChronicleView {
  t: string;
  text: string;
  kind?: 'ev' | 'found';
}
export interface UiState {
  resources: { gold: ResourceView; insight: ResourceView; renown: ResourceView };
  materials: { moonpetal: number; ironOre: number; spiritDust: number };
  vitals: { life: VitalView; stamina: VitalView; mana: VitalView };
  essence: EssenceView[];
  tabs: TabView[];
  tasks: TaskView[];
  chronicle: ChronicleView[];
}

const ELEMENT_META: Record<ElementId, { label: string; glyph: string; cls: string }> = {
  prism: { label: 'Prismatic', glyph: '❖', cls: 'prism' },
  fire: { label: 'Fire', glyph: '▲', cls: 'fire' },
  water: { label: 'Water', glyph: '▼', cls: 'water' },
  earth: { label: 'Earth', glyph: '⬢', cls: 'earth' },
  air: { label: 'Air', glyph: '≈', cls: 'air' },
  dark: { label: 'Dark', glyph: '☾', cls: 'dark' },
  light: { label: 'Light', glyph: '☀', cls: 'lightc' },
};

function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Derive the panel view-model from canonical state. (Rates are wired up in T-004.) */
export function toView(state: GameState): UiState {
  const r = state.run.resources;
  return {
    resources: {
      gold: { amount: r.gold, rate: 0 },
      insight: { amount: r.insight, rate: 0, cap: state.run.caps.insight },
      renown: { amount: r.renown, rate: 0 },
    },
    materials: { moonpetal: r.moonpetal, ironOre: r.ironOre, spiritDust: r.spiritDust },
    vitals: {
      life: { cur: state.run.vitals.life.cur, max: state.run.vitals.life.max },
      stamina: { cur: state.run.vitals.stamina.cur, max: state.run.vitals.stamina.max },
      mana: { cur: state.run.vitals.mana.cur, max: state.run.vitals.mana.max },
    },
    essence: ELEMENTS.map((id) => {
      const e = state.run.essence[id];
      const meta = ELEMENT_META[id];
      return { id, ...meta, amount: e.amount, rate: 0, awakened: e.awakened };
    }),
    tabs: [
      { id: 'main', label: 'Main', visible: true, locked: false },
      { id: 'skills', label: 'Skills', visible: state.run.phase !== 'origin', locked: false },
      { id: 'home', label: 'Home', visible: state.run.flags.lairFounded === true, locked: false },
      { id: 'academy', label: 'Academy', visible: true, locked: state.run.phase !== 'founded' },
    ],
    tasks: [], // populated by the Task system in T-004
    chronicle: state.run.chronicle
      .slice(-12)
      .reverse()
      .map((c) => ({ t: mmss(c.at), text: c.text, kind: c.kind })),
  };
}

// ---- live state + stores ----
let state: GameState = newGame();

export const game = writable<UiState>(toView(state));
export const activeTab = writable<string>('main');

export function getState(): GameState {
  return state;
}

export function setState(next: GameState): void {
  state = next;
  setNotation(state.settings.notation);
  publish();
}

/** Push the current engine state into the Svelte store (throttled by the loop). */
export function publish(): void {
  game.set(toView(state));
}

let running = false;

/** Start the real-time loop: rAF feeds wall-time into the engine accumulator. */
export function startLoop(): void {
  if (running || typeof requestAnimationFrame === 'undefined') return;
  running = true;
  setNotation(state.settings.notation);

  const acc = createAccumulator();
  let last = performance.now();
  let sincePublish = 0;

  const frame = (now: number): void => {
    const elapsed = (now - last) / 1000;
    last = now;
    acc.advance(state, Math.min(elapsed, 1)); // clamp huge gaps (tab was backgrounded)
    sincePublish += elapsed;
    if (sincePublish >= 0.1) {
      // ~10 Hz UI publish, decoupled from the 0.1s sim step
      publish();
      sincePublish = 0;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
