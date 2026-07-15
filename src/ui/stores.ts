// Svelte store bridge — the thin UI adapter over the framework-agnostic engine.
// It owns the live GameState, drives the fixed-timestep tick from an rAF loop
// (the only DOM the sim touches lives HERE, never in src/engine), and republishes
// a derived UiState to the panels at a throttled rate.

import { writable } from 'svelte/store';
import { createAccumulator } from '../engine/tick';
import { newGame, type GameState, ELEMENTS, type ElementId, type ResourceId } from '../engine/state';
import { AMOUNT_LABEL, TASKS, type Amount, type TaskDef, type TaskType } from '../content/tasks';
import { CANTRIP_BY_ID } from '../content/cantrips';
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
import { learnCantrip as engineLearnCantrip, listCantripInfo, outputMult } from '../engine/systems/skills';
import { essenceRates } from '../engine/systems/essence';
import { setNotation } from './format';

// ---- UiState: the stable view contract the panels read ----
export interface ResourceView {
  amount: number;
  rate: number;
  cap?: number;
  atCap?: boolean; // amount is at/over the cap → gains are wasted (dim the rate)
  rateTip?: string; // sourced-number tooltip: "+0.61/s = Study 0.55 × Kindle ×1.10"
}
export interface VitalView {
  cur: number;
  max: number;
  regen: number; // per-second recovery toward max
}
export interface EssenceView {
  id: string;
  label: string;
  glyph: string;
  cls: string;
  amount: number;
  rate: number;
  awakened: boolean;
  rateTip?: string; // sourced-number tooltip on the trickle rate
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
  capMark?: string; // "*" when an Insight cost exceeds the Insight cap
  capNote?: string; // hover text for the `*` marker
}
export interface CantripView {
  id: string;
  name: string;
  blurb: string;
  cls: string; // left-edge colour class (awakened element, else insight)
  cost: string; // formatted "◈20"
  status: 'owned' | 'available' | 'locked';
  affordable: boolean; // Insight ≥ cost right now (and within the cap)
  learnable: boolean; // available + affordable + within cap → clickable
  effectText: string; // what learning it does
  prereqNote?: string; // "needs: Read the Page" when locked on a prereq
  capMark?: string; // "*" when cost exceeds the Insight cap
  capNote?: string; // hover text for the `*` marker
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
  cantrips: CantripView[];
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
  // Bonus applies once completions reach `at`. Read as a plain goal → reward.
  if (count < t.at) return `At ${t.at} done → +${t.bonus} (${count}/${t.at})`;
  return `At ${t.at} done → +${t.bonus} ✓ (×${count})`;
}
function lockTextFor(def: TaskDef, info: TaskInfo): string | undefined {
  if (info.maxed) return `done · ${info.count}/${def.max ?? 1}`;
  if (info.locked) return 'requirements unmet';
  return undefined;
}
function buildTaskView(state: GameState, def: TaskDef, info: TaskInfo): TaskView {
  const pausedReason =
    info.paused && info.pausedResourceId
      ? `needs ${g(info.pausedResourceId)} ${AMOUNT_LABEL[info.pausedResourceId] ?? info.pausedResourceId}`
      : undefined;
  const cap = costCapMark(state, def.startCost);
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
    capMark: cap.capMark,
    capNote: cap.capNote,
  };
}

// ---- caps + sourced-number tooltips (the §3.14 QoL layer) ----
/** Name of the task whose effect raises the Insight cap (for the `*` marker hover). */
function capRaiserName(): string | undefined {
  return TASKS.find((d) => d.effects?.some((e) => e.kind === 'raiseInsightCap'))?.name;
}

/** A `*` marker + hover when any Insight cost in the list exceeds the current Insight cap. */
function costCapMark(state: GameState, cost: Amount[] | undefined): { capMark?: string; capNote?: string } {
  const over = (cost ?? []).some((c) => c.pool === 'resource' && c.id === 'insight' && c.amount > state.run.caps.insight);
  if (!over) return {};
  const raiser = capRaiserName();
  return { capMark: '*', capNote: `exceeds Insight Max${raiser ? ` — build ${raiser} to raise it` : ''}` };
}

/** Sourced-number tooltip for a left-panel resource rate: "+0.61/s = Study 0.55 × Kindle ×1.10". */
function resourceRateTip(state: GameState, id: ResourceId, atCap: boolean): string {
  const mult = outputMult(state);
  const parts: { name: string; base: number }[] = [];
  for (const def of TASKS) {
    const rt = state.run.tasks[def.id];
    if (!rt?.active || rt.paused) continue;
    let base = 0;
    if (def.type === 'perpetual') {
      for (const o of def.output ?? []) if (o.id === id) base += o.amount;
    } else if (def.type === 'running' || def.type === 'limited') {
      const len = def.length && def.length > 0 ? def.length : 1;
      for (const o of def.output ?? []) if (o.id === id) base += o.amount / len;
    }
    if (base > 0) parts.push({ name: def.name, base });
  }
  if (!parts.length) return '';
  const base = parts.reduce((s, p) => s + p.base, 0);
  const src = parts.map((p) => `${p.name} ${numStr(p.base)}`).join(' + ');
  const multStr = mult !== 1 ? ` × Kindle ×${mult.toFixed(2)}` : '';
  const capStr = atCap ? ' — at cap, no gain' : '';
  return `+${numStr(base * mult)}/s = ${src}${multStr}${capStr}`;
}

/** Sourced-number tooltip for an essence trickle rate. */
function essenceRateTip(state: GameState, id: ElementId): string {
  const mult = outputMult(state);
  const parts: { name: string; base: number }[] = [];
  for (const sid of state.run.skills ?? []) {
    const def = CANTRIP_BY_ID[sid];
    if (!def) continue;
    for (const e of def.effects) if (e.kind === 'awaken' && e.element === id) parts.push({ name: def.name, base: e.trickle });
  }
  if (!parts.length) return '';
  const base = parts.reduce((s, p) => s + p.base, 0);
  const src = parts.map((p) => `${p.name} ${numStr(p.base)}`).join(' + ');
  const multStr = mult !== 1 ? ` × Kindle ×${mult.toFixed(2)}` : '';
  return `+${numStr(base * mult)}/s = ${src}${multStr}`;
}

/** Map an engine CantripInfo → the panel's CantripView (adds glyphs, formatting, cap marker). */
function buildCantripView(info: ReturnType<typeof listCantripInfo>[number]): CantripView {
  const cls = info.awakensElement ? ELEMENT_META[info.awakensElement].cls : 'insight';
  const raiser = capRaiserName();
  const prereqNote =
    info.status === 'locked' && info.missingPrereqs.length
      ? `needs: ${info.missingPrereqs.map((r) => CANTRIP_BY_ID[r]?.name ?? r).join(', ')}`
      : undefined;
  return {
    id: info.id,
    name: info.name,
    blurb: info.blurb,
    cls,
    cost: `${g('insight')}${numStr(info.cost)}`,
    status: info.status,
    affordable: info.affordable && !info.exceedsCap,
    learnable: info.status === 'available' && info.affordable && !info.exceedsCap,
    effectText: info.effectText,
    prereqNote,
    capMark: info.exceedsCap ? '*' : undefined,
    capNote: info.exceedsCap ? `exceeds Insight Max${raiser ? ` — build ${raiser} to raise it` : ''}` : undefined,
  };
}

/** Derive the panel view-model from canonical state. */
export function toView(state: GameState): UiState {
  const r = state.run.resources;
  const rates = taskRates(state);
  const eRates = essenceRates(state); // cantrip-awakened trickle (adds to any task-granted essence)
  const infos = listTaskInfo(state);
  const insightAtCap = r.insight >= state.run.caps.insight - 1e-9;
  return {
    resources: {
      gold: { amount: r.gold, rate: rates.resources.gold ?? 0, rateTip: resourceRateTip(state, 'gold', false) },
      insight: {
        amount: r.insight,
        rate: rates.resources.insight ?? 0,
        cap: state.run.caps.insight,
        atCap: insightAtCap,
        rateTip: resourceRateTip(state, 'insight', insightAtCap),
      },
      renown: { amount: r.renown, rate: rates.resources.renown ?? 0, rateTip: resourceRateTip(state, 'renown', false) },
    },
    materials: { moonpetal: r.moonpetal, ironOre: r.ironOre, spiritDust: r.spiritDust },
    vitals: {
      life: { cur: state.run.vitals.life.cur, max: state.run.vitals.life.max, regen: state.run.vitals.life.regen },
      stamina: {
        cur: state.run.vitals.stamina.cur,
        max: state.run.vitals.stamina.max,
        regen: state.run.vitals.stamina.regen,
      },
      mana: { cur: state.run.vitals.mana.cur, max: state.run.vitals.mana.max, regen: state.run.vitals.mana.regen },
    },
    essence: ELEMENTS.map((id) => {
      const e = state.run.essence[id];
      const meta = ELEMENT_META[id];
      const rate = (rates.essence[id] ?? 0) + (eRates[id] ?? 0);
      return {
        id,
        ...meta,
        amount: e.amount,
        rate,
        awakened: e.awakened,
        rateTip: e.awakened ? essenceRateTip(state, id) : undefined,
      };
    }),
    tabs: [
      { id: 'main', label: 'Main', visible: true, locked: false },
      // The spark reveals Skills (the `awakened` flag is the canonical trigger — T-005).
      { id: 'skills', label: 'Skills', visible: state.run.flags.awakened === true, locked: false },
      { id: 'home', label: 'Home', visible: state.run.flags.lairFounded === true, locked: false },
      { id: 'academy', label: 'Academy', visible: true, locked: state.run.phase !== 'founded' },
    ],
    tasks: TASKS.map((def, i) => buildTaskView(state, def, infos[i])),
    cantrips: listCantripInfo(state).map((info) => buildCantripView(info)),
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

/** Learn a cantrip from the Skills tab: spends Insight, applies its effect (awaken / +regen / global mult). */
export function learnCantrip(id: string): void {
  engineLearnCantrip(state, id);
  publish();
}

let running = false;
let lastFrame = 0; // performance.now() timebase for the rAF loop (module-scoped so it can be re-seeded)

/** Start the real-time loop: rAF feeds wall-time into the engine accumulator. */
export function startLoop(): void {
  if (running || typeof requestAnimationFrame === 'undefined') return;
  running = true;
  setNotation(state.settings.notation);

  const acc = createAccumulator();
  lastFrame = performance.now();
  let sincePublish = 0;

  const frame = (now: number): void => {
    const elapsed = (now - lastFrame) / 1000;
    lastFrame = now;
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

/**
 * Re-seed the rAF timebase to "now" so the next frame measures ~0 elapsed.
 * Call this right after a foreground offline catch-up (main.ts visibilitychange):
 * while the tab was hidden rAF was paused and `lastFrame` froze, so without this
 * the first resumed frame would see the whole idle gap and (even clamped to ≤1s)
 * double-count time the catch-up already replayed.
 */
export function resumeTimebase(): void {
  if (typeof performance !== 'undefined') lastFrame = performance.now();
}
