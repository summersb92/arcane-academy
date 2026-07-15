// Svelte store bridge — the thin UI adapter over the framework-agnostic engine.
// It owns the live GameState, drives the fixed-timestep tick from an rAF loop
// (the only DOM the sim touches lives HERE, never in src/engine), and republishes
// a derived UiState to the panels at a throttled rate.

import { writable } from 'svelte/store';
import { createAccumulator } from '../engine/tick';
import { newGame, type GameState, ELEMENTS, type ElementId } from '../engine/state';
import { AMOUNT_LABEL, TASKS, type TaskDef, type TaskType } from '../content/tasks';
import {
  listTaskInfo,
  taskRates,
  slotsUsed,
  activitySlots,
  doTask,
  startTask,
  stopTask,
  toggleRepeat as engineToggleRepeat,
  type TaskInfo,
} from '../engine/systems/tasks';
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
  type: TaskType;
  kind: string; // chip label ("Instant", "Running · 15s", "Perpetual", "Upgrade")
  cls: string; // coloured left-edge / element class
  tag: string; // category (+ "Max n · c/n" for Limited)
  io: string; // cost → output line
  active: boolean;
  locked: boolean; // requirements unmet or Limited maxed → dim & non-clickable
  paused: boolean;
  progress: number; // 0..1 (timed tasks)
  timed: boolean; // running/limited → show a progress meter
  affordable: boolean; // startCost payable now
  startable: boolean; // can start/do this instant
  payoff: string; // Card Payoff Preview: net "/s" (continuous) or per-action (instant)
  atText?: string; // At-N repeat-scaling chip
  pausedReason?: string; // "needs ⚡ Stamina" when auto-paused
  slotNote?: string; // "No free Activity slot"
  lockText?: string; // requirement/maxed hint when locked
  repeat: boolean; // ↻ toggle state (running)
  canRepeat: boolean; // running tasks expose the ↻ toggle
  count: number; // completions
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
  slots: { used: number; total: number };
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

// ---- task display helpers (glyphs + cost/output/payoff strings) ----
const GLYPH: Record<string, string> = {
  gold: '⦿', insight: '◈', renown: '★',
  moonpetal: '⚘', ironOre: '⛏', spiritDust: '✧',
  life: '✚', stamina: '⚡', mana: '✦',
  prism: '❖', fire: '▲', water: '▼', earth: '⬢', air: '≈', dark: '☾', light: '☀',
};
const g = (id: string): string => GLYPH[id] ?? '';
const numStr = (x: number): string => String(+x.toFixed(2));
const signStr = (x: number): string => (x < 0 ? '-' : '+');

function chipText(def: TaskDef): string {
  if (def.chip) return def.chip;
  switch (def.type) {
    case 'instant':
      return 'Instant';
    case 'running':
      return `Running · ${def.length ?? 0}s`;
    case 'perpetual':
      return 'Perpetual';
    case 'limited':
      return 'Limited';
  }
}
function tagText(def: TaskDef, info: TaskInfo): string {
  if (def.type === 'limited') return `${def.tag} · Max ${def.max ?? 1} · ${info.count}/${def.max ?? 1}`;
  return def.tag;
}
function tokens(list: { id: string; amount: number }[] | undefined, perSec: boolean): string {
  return (list ?? []).map((a) => `${g(a.id)}${numStr(a.amount)}${perSec ? '/s' : ''}`).join(' ');
}
function effectSummary(def: TaskDef): string {
  return (def.effects ?? [])
    .map((e) => {
      if (e.kind === 'activitySlot') return `+${e.amount} Activity slot${e.amount === 1 ? '' : 's'}`;
      if (e.kind === 'raiseInsightCap') return `+${e.amount} ◈ cap`;
      if (e.kind === 'flag') return `unlocks ${e.flag}`;
      return '';
    })
    .filter(Boolean)
    .join(', ');
}
function costLine(def: TaskDef): string {
  let cost: string;
  if (def.type === 'instant') cost = tokens(def.startCost, false);
  else if (def.type === 'perpetual') cost = tokens(def.runCost, true);
  else cost = [tokens(def.startCost, false), tokens(def.runCost, true)].filter(Boolean).join(' + ');
  const out = def.output && def.output.length ? tokens(def.output, def.type === 'perpetual') : effectSummary(def);
  const left = cost || '—';
  return out ? `${left} → ${out}` : left;
}
function payoffText(def: TaskDef, info: TaskInfo): string {
  if (def.type === 'instant') {
    if (def.output && def.output.length) {
      const o = def.output[0];
      return `+${numStr(o.amount)} ${g(o.id)}/action`;
    }
    return effectSummary(def);
  }
  if (def.output && def.output.length) {
    const id = def.output[0].id;
    const net = info.net[id] ?? 0;
    return `net ${signStr(net)}${numStr(Math.abs(net))} ${g(id)}/s`;
  }
  return effectSummary(def);
}
function atNText(def: TaskDef, count: number): string | undefined {
  if (!def.atN || !def.atN.length) return undefined;
  const t = def.atN.find((x) => count < x.at) ?? def.atN[def.atN.length - 1];
  if (count < t.at) return `At ${t.at}: +${t.bonus} (${count}/${t.at})`;
  return `At ${t.at}: +${t.bonus} ✓ · ×${count}`;
}
function lockTextFor(def: TaskDef, info: TaskInfo): string | undefined {
  if (info.maxed) return `done · ${info.count}/${def.max ?? 1}`;
  if (info.locked) return 'requirements unmet';
  return undefined;
}
function buildTaskView(def: TaskDef, info: TaskInfo): TaskView {
  const pausedReason =
    info.paused && info.pausedResourceId
      ? `needs ${g(info.pausedResourceId)} ${AMOUNT_LABEL[info.pausedResourceId] ?? info.pausedResourceId}`
      : undefined;
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    kind: chipText(def),
    cls: def.cls,
    tag: tagText(def, info),
    io: costLine(def),
    active: info.active,
    locked: info.locked,
    paused: info.paused,
    progress: info.progress,
    timed: def.type === 'running' || def.type === 'limited',
    affordable: info.affordable,
    startable: info.startable,
    payoff: payoffText(def, info),
    atText: atNText(def, info.count),
    pausedReason,
    slotNote: info.slotFull ? 'No free Activity slot' : undefined,
    lockText: lockTextFor(def, info),
    repeat: info.repeat,
    canRepeat: def.type === 'running',
    count: info.count,
  };
}

/** Derive the panel view-model from canonical state. */
export function toView(state: GameState): UiState {
  const r = state.run.resources;
  const rates = taskRates(state);
  const infos = listTaskInfo(state);
  return {
    resources: {
      gold: { amount: r.gold, rate: rates.resources.gold ?? 0 },
      insight: { amount: r.insight, rate: rates.resources.insight ?? 0, cap: state.run.caps.insight },
      renown: { amount: r.renown, rate: rates.resources.renown ?? 0 },
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
      return { id, ...meta, amount: e.amount, rate: rates.essence[id] ?? 0, awakened: e.awakened };
    }),
    tabs: [
      { id: 'main', label: 'Main', visible: true, locked: false },
      { id: 'skills', label: 'Skills', visible: state.run.phase !== 'origin', locked: false },
      { id: 'home', label: 'Home', visible: state.run.flags.lairFounded === true, locked: false },
      { id: 'academy', label: 'Academy', visible: true, locked: state.run.phase !== 'founded' },
    ],
    tasks: TASKS.map((def, i) => buildTaskView(def, infos[i])),
    slots: { used: slotsUsed(state), total: activitySlots(state) },
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

/** Whole-card click: Active→stop, instant→do, continuous→start. Locked cards no-op. */
export function dispatchTask(view: TaskView): void {
  if (view.locked) return;
  if (view.active) stopTask(state, view.id);
  else if (view.type === 'instant') doTask(state, view.id);
  else startTask(state, view.id);
  publish();
}

/** The in-card ↻ toggle for Running tasks. */
export function toggleTaskRepeat(id: string): void {
  engineToggleRepeat(state, id);
  publish();
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
