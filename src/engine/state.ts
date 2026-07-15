// The canonical GameState — one serializable object is the whole game.
// No DOM, no Svelte. Everything the sim, save, and CLI touch lives here.

import { STARTING } from '../content/config';
import { seedFrom } from './rng';

export const SAVE_VERSION = 1;

export type ElementId = 'prism' | 'fire' | 'water' | 'earth' | 'air' | 'dark' | 'light';

export type ResourceId = 'gold' | 'insight' | 'renown' | 'moonpetal' | 'ironOre' | 'spiritDust';

export type Phase = 'origin' | 'awakened' | 'lair' | 'founded';

export interface Vital {
  cur: number;
  max: number;
  regen: number; // per second
}

export interface EssenceState {
  amount: number;
  awakened: boolean;
}

export interface TaskRuntime {
  active: boolean;
  progress: number; // 0..1 for timed tasks
  paused: boolean;
  count: number; // completions (for At-N scaling, T-004)
  repeat: boolean; // running tasks: restart on completion (the in-card ↻ toggle)
}

export interface ChronicleEntry {
  at: number; // simulated-playtime seconds
  text: string;
  kind?: 'ev' | 'found';
}

export interface RunState {
  act: number;
  phase: Phase;
  resources: Record<ResourceId, number>;
  caps: { insight: number };
  vitals: { life: Vital; stamina: Vital; mana: Vital };
  essence: Record<ElementId, EssenceState>;
  tasks: Record<string, TaskRuntime>; // T-004
  activitySlots: number; // continuous-task capacity (starts 2; "Widen the Study" raises to 3) — T-004
  skills: string[]; // learned cantrip ids (T-005)
  home: Record<string, number>; // fixture levels (T-006)
  flags: Record<string, boolean>;
  chronicle: ChronicleEntry[];
}

export interface Settings {
  notation: 'suffix' | 'full' | 'scientific';
  theme: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  run: RunState;
  settings: Settings;
  playtime: number; // seconds of simulated time
  lastSaved: number; // epoch ms
}

const ELEMENTS: ElementId[] = ['prism', 'fire', 'water', 'earth', 'air', 'dark', 'light'];

function freshEssence(): Record<ElementId, EssenceState> {
  const e = {} as Record<ElementId, EssenceState>;
  for (const id of ELEMENTS) e[id] = { amount: 0, awakened: false };
  return e;
}

/** A brand-new Act I save: a penniless stable-hand at the Origin. */
export function newGame(seed: number = seedFrom(Date.now())): GameState {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    seed,
    rngState: seed >>> 0,
    run: {
      act: 1,
      phase: 'origin',
      resources: {
        gold: STARTING.gold,
        insight: STARTING.insight,
        renown: STARTING.renown,
        moonpetal: STARTING.moonpetal,
        ironOre: STARTING.ironOre,
        spiritDust: STARTING.spiritDust,
      },
      caps: { insight: STARTING.insightCap },
      vitals: {
        life: { ...STARTING.life },
        stamina: { ...STARTING.stamina },
        mana: { ...STARTING.mana },
      },
      essence: freshEssence(),
      tasks: {},
      activitySlots: STARTING.activitySlots,
      skills: [],
      home: {},
      flags: {},
      chronicle: [{ at: 0, text: 'You awaken, penniless, in the stable straw.' }],
    },
    settings: { notation: 'suffix', theme: 'system' },
    playtime: 0,
    lastSaved: now,
  };
}

export { ELEMENTS };
