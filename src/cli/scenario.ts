// Scenario runner: executes a scripted list of commands + assertions over the
// engine and reports pass/fail. Imports ONLY the engine (never src/ui). Used by
// `cli run <scenario.json>` so scenarios double as CI-able regression/balance tests.

import { newGame, type GameState } from '../engine/state';
import { simulate } from '../engine/tick';
import { doTask, startTask, stopTask } from '../engine/systems/tasks';
import { learnCantrip } from '../engine/systems/skills';

export type Op = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface Scenario {
  name?: string;
  seed?: number;
  steps: Step[];
}

export type Step =
  | { sim: number }
  | { do: string }
  | { start: string }
  | { stop: string }
  | { learn: string }
  | { assert: { path: string; op: Op; value: number | boolean | string } }
  | { note: string };

export interface StepResult {
  ok: boolean;
  desc: string;
  detail?: string;
}

export interface ScenarioResult {
  ok: boolean;
  name: string;
  results: StepResult[];
  state: GameState;
}

/** Resolve a dotted path like "run.resources.gold" against the state. */
export function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function compare(actual: unknown, op: Op, expected: number | boolean | string): boolean {
  if (typeof expected === 'boolean') {
    const a = Boolean(actual);
    if (op === '==') return a === expected;
    if (op === '!=') return a !== expected;
    return false; // ordering ops are meaningless for booleans
  }
  if (typeof expected === 'string') {
    // String state (e.g. run.phase === 'founded') — equality only.
    if (op === '==') return actual === expected;
    if (op === '!=') return actual !== expected;
    return false; // ordering ops are meaningless for strings
  }
  const a = typeof actual === 'number' ? actual : NaN;
  switch (op) {
    case '>=':
      return a >= expected;
    case '<=':
      return a <= expected;
    case '>':
      return a > expected;
    case '<':
      return a < expected;
    case '==':
      return a === expected;
    case '!=':
      return a !== expected;
    default:
      return false;
  }
}

function fmtActual(raw: unknown): string {
  return typeof raw === 'number' ? raw.toFixed(4) : String(raw);
}

export function runScenario(spec: Scenario): ScenarioResult {
  const state = newGame(spec.seed ?? 1);
  const results: StepResult[] = [];

  for (const step of spec.steps) {
    if ('sim' in step) {
      simulate(state, step.sim);
      results.push({ ok: true, desc: `sim ${step.sim}s`, detail: `playtime=${state.playtime.toFixed(1)}s` });
    } else if ('do' in step) {
      const ok = doTask(state, step.do);
      results.push({ ok: true, desc: `do ${step.do}`, detail: ok ? 'ok' : 'refused' });
    } else if ('start' in step) {
      const ok = startTask(state, step.start);
      results.push({ ok: true, desc: `start ${step.start}`, detail: ok ? 'ok' : 'refused' });
    } else if ('stop' in step) {
      const ok = stopTask(state, step.stop);
      results.push({ ok: true, desc: `stop ${step.stop}`, detail: ok ? 'ok' : 'refused' });
    } else if ('learn' in step) {
      const ok = learnCantrip(state, step.learn);
      results.push({ ok: true, desc: `learn ${step.learn}`, detail: ok ? 'ok' : 'refused' });
    } else if ('assert' in step) {
      const { path, op, value } = step.assert;
      const raw = resolvePath(state, path);
      const ok = compare(raw, op, value);
      results.push({ ok, desc: `assert ${path} ${op} ${value}`, detail: `actual=${fmtActual(raw)}` });
    } else if ('note' in step) {
      results.push({ ok: true, desc: `note: ${step.note}` });
    } else {
      results.push({ ok: false, desc: `unknown step: ${JSON.stringify(step)}` });
    }
  }

  return {
    ok: results.every((r) => r.ok),
    name: spec.name ?? 'scenario',
    results,
    state,
  };
}
