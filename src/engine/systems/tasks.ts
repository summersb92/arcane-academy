// Task/Activity system — the core game loop. Pure engine (NO DOM/Svelte): the same
// code runs in the browser tick, in `simulate()`, offline catch-up, and the CLI.
//
// Responsibilities:
//   • runTasks(dt)                     — advance every active task one step (called by tick.step)
//   • doTask / startTask / stopTask    — player/CLI/UI actions
//   • toggleRepeat                     — the in-card ↻ toggle for Running tasks
//   • startup cost + per-second running cost, with AUTO-PAUSE when a run cost can't
//     be paid and AUTO-RESUME when it can again
//   • "At N" repeat-scaling, Limited (Max) caps + completion effects, Activity slots
//   • derived read models for the UI/CLI: listTaskInfo, taskRates, slotsUsed, activitySlots
//
// The runtime (active/progress/paused/count/repeat) lives in state.run.tasks[id];
// the definitions live in src/content/tasks.ts. Read paths never mutate state.

import { STARTING } from '../../content/config';
import {
  TASKS,
  TASK_BY_ID,
  AMOUNT_LABEL,
  isContinuous,
  type Amount,
  type AmountId,
  type Pool,
  type Requirement,
  type TaskDef,
  type TaskEffect,
  type VitalId,
} from '../../content/tasks';
import { ELEMENTS, type ElementId, type GameState, type ResourceId, type TaskRuntime } from '../state';
import { logEvent } from './chronicle';

const RESOURCE_IDS: ResourceId[] = ['gold', 'insight', 'renown', 'moonpetal', 'ironOre', 'spiritDust'];
const EPS = 1e-9;

// ---- derived read model (no display strings — the UI/CLI format these) ----
export interface TaskInfo {
  id: string;
  active: boolean;
  paused: boolean;
  progress: number; // 0..1
  count: number; // completions
  repeat: boolean;
  locked: boolean; // requirements unmet OR Limited maxed → dim & non-clickable
  maxed: boolean; // Limited && count >= max
  affordable: boolean; // startCost payable right now (ignores slots)
  slotFull: boolean; // continuous, not active, and no free Activity slot
  startable: boolean; // can start/do this instant
  pausedResourceId?: AmountId; // the starved pool when paused (Auto-Pause Explained)
  net: Partial<Record<AmountId, number>>; // per-second net while running (payoff preview + rates)
}

// ---- pool access ----
function poolCur(state: GameState, pool: Pool, id: AmountId): number {
  switch (pool) {
    case 'resource':
      return state.run.resources[id as ResourceId] ?? 0;
    case 'vital':
      return state.run.vitals[id as VitalId].cur;
    case 'essence':
      return state.run.essence[id as ElementId].amount;
  }
}

/** Add `a.amount * scale` to its pool. Negative scale = spend; positive = gain. Vitals clamp to [0,max]. */
function addPool(state: GameState, a: Amount, scale: number): void {
  const delta = a.amount * scale;
  switch (a.pool) {
    case 'resource':
      state.run.resources[a.id as ResourceId] += delta;
      break;
    case 'vital': {
      const v = state.run.vitals[a.id as VitalId];
      v.cur = Math.max(0, Math.min(v.max, v.cur + delta));
      break;
    }
    case 'essence':
      state.run.essence[a.id as ElementId].amount += delta;
      break;
  }
}

function applyAmounts(state: GameState, list: Amount[] | undefined, scale: number): void {
  if (!list) return;
  for (const a of list) addPool(state, a, scale);
}

/** Can every cost be paid at `scale` (scale = dt for per-second costs, 1 for lump)? */
function canAfford(state: GameState, costs: Amount[] | undefined, scale: number): boolean {
  if (!costs) return true;
  for (const c of costs) {
    if (poolCur(state, c.pool, c.id) < c.amount * scale - EPS) return false;
  }
  return true;
}

// ---- runtime helpers ----
function freshRuntime(): TaskRuntime {
  return { active: false, progress: 0, paused: false, count: 0, repeat: false };
}
/** Read-only view of a runtime — never mutates state (safe during render).
 *  `tasks?.` guards the render path: toView() can run on a freshly-loaded save
 *  before the first tick's self-heal, and a legacy/partial save may lack run.tasks. */
function peekRuntime(state: GameState, id: string): TaskRuntime {
  return state.run.tasks?.[id] ?? freshRuntime();
}
/** Get-or-create the stored runtime — for action paths only. */
function getRuntime(state: GameState, id: string): TaskRuntime {
  let rt = state.run.tasks[id];
  if (!rt) {
    rt = freshRuntime();
    state.run.tasks[id] = rt;
  }
  return rt;
}

// ---- requirements / effects / scaling ----
function requirementsMet(state: GameState, def: TaskDef): boolean {
  if (!def.requires) return true;
  for (const r of def.requires as Requirement[]) {
    switch (r.kind) {
      case 'flag':
        if (state.run.flags[r.flag] !== true) return false;
        break;
      case 'resource':
        if ((state.run.resources[r.id] ?? 0) < r.atLeast) return false;
        break;
      case 'skill':
        if (!state.run.skills.includes(r.id)) return false;
        break;
      case 'taskCount':
        if (peekRuntime(state, r.id).count < r.atLeast) return false;
        break;
    }
  }
  return true;
}

function applyEffect(state: GameState, e: TaskEffect): void {
  switch (e.kind) {
    case 'activitySlot':
      state.run.activitySlots = activitySlots(state) + e.amount;
      logEvent(state, `Activity slots widened to ${state.run.activitySlots}.`, 'ev');
      break;
    case 'flag':
      state.run.flags[e.flag] = e.value ?? true;
      break;
    case 'raiseInsightCap':
      state.run.caps.insight += e.amount;
      break;
  }
}

/** Output for the next completion, with "At N" bonuses folded into the primary output. */
function effectiveOutput(def: TaskDef, completionsSoFar: number): Amount[] {
  if (!def.output) return [];
  const bonus = def.atN
    ? def.atN.reduce((sum, t) => (completionsSoFar >= t.at ? sum + t.bonus : sum), 0)
    : 0;
  if (!bonus) return def.output;
  return def.output.map((o, i) => (i === 0 ? { ...o, amount: o.amount + bonus } : o));
}

function numStr(x: number): string {
  return String(+x.toFixed(2));
}
function completionText(def: TaskDef, outs: Amount[]): string {
  if (!outs.length) return `Completed: ${def.name}.`;
  const parts = outs.map((o) => `+${numStr(o.amount)} ${AMOUNT_LABEL[o.id] ?? o.id}`);
  return `${def.name}: ${parts.join(', ')}.`;
}

// ---- per-step advance ----
/** Grant one cycle's output, bump count, run completion effects, chronicle it. */
function completeCycle(state: GameState, def: TaskDef, rt: TaskRuntime): void {
  const outs = effectiveOutput(def, rt.count);
  applyAmounts(state, outs, 1);
  rt.count += 1;
  if (def.effects) for (const e of def.effects) applyEffect(state, e);
  logEvent(state, completionText(def, outs), 'ev');
}

/** After a completion, decide whether the task keeps running. Returns true to carry on. */
function continueAfterCompletion(state: GameState, def: TaskDef, rt: TaskRuntime): boolean {
  if (def.type === 'limited') {
    // One start = one cycle. Re-startable until Max; stays stopped here.
    rt.active = false;
    rt.progress = 0;
    return false;
  }
  // running
  if (rt.repeat && canAfford(state, def.startCost, 1)) {
    applyAmounts(state, def.startCost, -1);
    return true;
  }
  if (rt.repeat) logEvent(state, `${def.name} stopped — can't afford to repeat.`);
  rt.active = false;
  rt.progress = 0;
  return false;
}

function stepTask(state: GameState, def: TaskDef, rt: TaskRuntime, dt: number): void {
  // Per-second running cost → auto-pause when it can't be paid, auto-resume when it can.
  if (def.runCost && def.runCost.length) {
    if (!canAfford(state, def.runCost, dt)) {
      rt.paused = true;
      return; // no charge, no progress, no output while starved
    }
    rt.paused = false;
    applyAmounts(state, def.runCost, -dt);
  } else {
    rt.paused = false;
  }

  if (def.type === 'perpetual') {
    applyAmounts(state, def.output, dt);
    return;
  }

  // running / limited (timed)
  const length = def.length && def.length > 0 ? def.length : 0;
  if (length === 0) {
    completeCycle(state, def, rt);
    continueAfterCompletion(state, def, rt);
    return;
  }
  rt.progress += dt / length;
  let guard = 0;
  while (rt.progress >= 1 && guard++ < 1000) {
    completeCycle(state, def, rt);
    if (!continueAfterCompletion(state, def, rt)) break;
    rt.progress -= 1;
  }
  if (rt.progress < 0) rt.progress = 0;
}

/** Advance every active task by `dt`. Called by tick.step (before caps clamp output). */
export function runTasks(state: GameState, dt: number): void {
  const run = state.run;
  if (typeof run.activitySlots !== 'number') run.activitySlots = STARTING.activitySlots; // heal legacy saves
  if (!run.tasks) run.tasks = {};
  for (const def of TASKS) {
    const rt = run.tasks[def.id];
    if (rt && rt.active) stepTask(state, def, rt, dt);
  }
}

// ---- actions (player / UI / CLI) ----
/** Instant one-shot: pay → gain, once. Returns false if gated or unaffordable. */
export function doTask(state: GameState, id: string): boolean {
  const def = TASK_BY_ID[id];
  if (!def || def.type !== 'instant') return false;
  if (!requirementsMet(state, def)) return false;
  if (!canAfford(state, def.startCost, 1)) return false;
  const rt = getRuntime(state, id);
  applyAmounts(state, def.startCost, -1);
  const outs = effectiveOutput(def, rt.count);
  applyAmounts(state, outs, 1);
  rt.count += 1;
  if (def.effects) for (const e of def.effects) applyEffect(state, e);
  logEvent(state, completionText(def, outs), 'ev');
  return true;
}

/** Start a continuous task (occupies a slot). Instant ids route to doTask for convenience. */
export function startTask(state: GameState, id: string): boolean {
  const def = TASK_BY_ID[id];
  if (!def) return false;
  if (def.type === 'instant') return doTask(state, id);
  const rt = getRuntime(state, id);
  if (rt.active) return false;
  if (def.type === 'limited' && rt.count >= (def.max ?? 1)) return false;
  if (!requirementsMet(state, def)) return false;
  if (slotsUsed(state) >= activitySlots(state)) return false; // no free Activity slot
  if (!canAfford(state, def.startCost, 1)) return false;
  applyAmounts(state, def.startCost, -1);
  rt.active = true;
  rt.paused = false;
  rt.progress = 0;
  rt.repeat = def.repeatable ?? false;
  logEvent(state, `Began ${def.name}.`, 'ev');
  return true;
}

/** Stop a running continuous task, freeing its slot. */
export function stopTask(state: GameState, id: string): boolean {
  const def = TASK_BY_ID[id];
  const rt = state.run.tasks[id];
  if (!def || !rt || !rt.active) return false;
  rt.active = false;
  rt.paused = false;
  rt.progress = 0;
  logEvent(state, `Stopped ${def.name}.`);
  return true;
}

/** Flip the ↻ repeat toggle on a Running task. Returns the new state. */
export function toggleRepeat(state: GameState, id: string): boolean {
  const def = TASK_BY_ID[id];
  if (!def || def.type !== 'running') return false;
  const rt = getRuntime(state, id);
  rt.repeat = !rt.repeat;
  return rt.repeat;
}

// ---- derived read models ----
export function activitySlots(state: GameState): number {
  return typeof state.run.activitySlots === 'number' ? state.run.activitySlots : STARTING.activitySlots;
}
export function slotsUsed(state: GameState): number {
  let n = 0;
  for (const def of TASKS) {
    if (isContinuous(def) && peekRuntime(state, def.id).active) n++;
  }
  return n;
}

/** Per-second net contribution of a task *while running* (resources + vitals + essence). */
function netPerSecond(def: TaskDef): Partial<Record<AmountId, number>> {
  const net: Partial<Record<AmountId, number>> = {};
  const add = (id: AmountId, v: number): void => {
    net[id] = (net[id] ?? 0) + v;
  };
  if (def.type === 'perpetual') {
    for (const o of def.output ?? []) add(o.id, o.amount);
    for (const c of def.runCost ?? []) add(c.id, -c.amount);
  } else if (def.type === 'running' || def.type === 'limited') {
    const len = def.length && def.length > 0 ? def.length : 1;
    for (const o of def.output ?? []) add(o.id, o.amount / len);
    for (const c of def.startCost ?? []) add(c.id, -c.amount / len);
    for (const c of def.runCost ?? []) add(c.id, -c.amount);
  }
  return net; // instant → {} (no per-second rate; UI shows per-action output instead)
}

export function taskInfo(state: GameState, def: TaskDef): TaskInfo {
  const rt = peekRuntime(state, def.id);
  const maxed = def.type === 'limited' && rt.count >= (def.max ?? 1);
  const locked = !requirementsMet(state, def) || maxed;
  const affordable = canAfford(state, def.startCost, 1);
  const cont = isContinuous(def);
  const freeSlots = activitySlots(state) - slotsUsed(state);
  const slotFull = cont && !rt.active && freeSlots <= 0;
  const startable = !locked && affordable && (!cont || rt.active || freeSlots > 0);

  let pausedResourceId: AmountId | undefined;
  if (rt.active && rt.paused && def.runCost) {
    const bad = def.runCost.find((c) => poolCur(state, c.pool, c.id) < c.amount - EPS);
    pausedResourceId = bad?.id;
  }

  return {
    id: def.id,
    active: rt.active,
    paused: rt.paused,
    progress: rt.progress,
    count: rt.count,
    repeat: rt.repeat,
    locked,
    maxed,
    affordable,
    slotFull,
    startable,
    pausedResourceId,
    net: netPerSecond(def),
  };
}

export function listTaskInfo(state: GameState): TaskInfo[] {
  return TASKS.map((def) => taskInfo(state, def));
}

/** Sum of per-second resource & essence production from active, non-paused tasks
 *  (for the left/right panel rate readouts). Vitals are excluded from the readout. */
export function taskRates(state: GameState): {
  resources: Partial<Record<ResourceId, number>>;
  essence: Partial<Record<ElementId, number>>;
} {
  const resources: Partial<Record<ResourceId, number>> = {};
  const essence: Partial<Record<ElementId, number>> = {};
  for (const def of TASKS) {
    const rt = peekRuntime(state, def.id);
    if (!rt.active || rt.paused) continue;
    const net = netPerSecond(def);
    for (const key of Object.keys(net) as AmountId[]) {
      const v = net[key];
      if (v === undefined) continue;
      if (RESOURCE_IDS.includes(key as ResourceId)) {
        resources[key as ResourceId] = (resources[key as ResourceId] ?? 0) + v;
      } else if ((ELEMENTS as string[]).includes(key)) {
        essence[key as ElementId] = (essence[key as ElementId] ?? 0) + v;
      }
    }
  }
  return { resources, essence };
}
