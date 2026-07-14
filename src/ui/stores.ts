// Svelte store bridge.
//
// T-001: holds a hard-coded placeholder UiState so the frame renders.
// T-002 replaces the internals with a selector over the engine's GameState
// (`toView(state)`) driven by the tick loop — the UiState shape below is the
// stable contract the panels read, so the panels do not change.

import { writable } from 'svelte/store';

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
  progress: number; // 0..1
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

const PLACEHOLDER: UiState = {
  resources: {
    gold: { amount: 12, rate: 0 },
    insight: { amount: 0, rate: 0, cap: 100 },
    renown: { amount: 0, rate: 0 },
  },
  materials: { moonpetal: 0, ironOre: 0, spiritDust: 0 },
  vitals: {
    life: { cur: 20, max: 20 },
    stamina: { cur: 10, max: 10 },
    mana: { cur: 0, max: 10 },
  },
  essence: [
    { id: 'prism', label: 'Prismatic', glyph: '❖', cls: 'prism', amount: 0, rate: 0, awakened: false },
    { id: 'fire', label: 'Fire', glyph: '▲', cls: 'fire', amount: 0, rate: 0, awakened: false },
    { id: 'water', label: 'Water', glyph: '▼', cls: 'water', amount: 0, rate: 0, awakened: false },
    { id: 'earth', label: 'Earth', glyph: '⬢', cls: 'earth', amount: 0, rate: 0, awakened: false },
    { id: 'air', label: 'Air', glyph: '≈', cls: 'air', amount: 0, rate: 0, awakened: false },
    { id: 'dark', label: 'Dark', glyph: '☾', cls: 'dark', amount: 0, rate: 0, awakened: false },
    { id: 'light', label: 'Light', glyph: '☀', cls: 'lightc', amount: 0, rate: 0, awakened: false },
  ],
  tabs: [
    { id: 'main', label: 'Main', visible: true, locked: false },
    { id: 'skills', label: 'Skills', visible: false, locked: false },
    { id: 'home', label: 'Home', visible: false, locked: false },
    { id: 'academy', label: 'Academy', visible: true, locked: true },
  ],
  tasks: [
    {
      id: 'clean_stables',
      name: 'Clean Stables',
      kind: 'Instant',
      cls: 'gold',
      io: '⚡1 → ⦿2.5',
      tag: 'Starting Out',
      active: false,
      locked: false,
      paused: false,
      progress: 0,
    },
  ],
  chronicle: [{ t: '00:00', text: 'You awaken, penniless, in the stable straw.' }],
};

/** The whole-game view the UI reads. Replaced by the engine bridge in T-002. */
export const game = writable<UiState>(PLACEHOLDER);

/** Currently selected tab id. */
export const activeTab = writable<string>('main');
