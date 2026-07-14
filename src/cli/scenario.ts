// Scenario runner: executes a scripted list of commands + assertions over the
// engine and reports pass/fail. Imports ONLY the engine (never src/ui). Used by
// `cli run <scenario.json>` so scenarios double as CI-able regression/balance tests.

import { newGame, type GameState } from '../engine/state';
import { simulate } from '../engine/tick';

export type Op = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface Scenario {
  name?: string;
  seed?: number;
  steps: Step[];
}

export type Step =
  | { sim: number }
  | { assert: { path: string; op: Op; value: number } }
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

function compare(actual: number, op: Op, expected: number): boolean {
  switch (op) {
    case '>=':
      return actual >= expected;
    case '<=':
      return actual <= expected;
    case '>':
      return actual > expected;
    case '<':
      return actual < expected;
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    default:
      return false;
  }
}

export function runScenario(spec: Scenario): ScenarioResult {
  const state = newGame(spec.seed ?? 1);
  const results: StepResult[] = [];

  for (const step of spec.steps) {
    if ('sim' in step) {
      simulate(state, step.sim);
      results.push({ ok: true, desc: `sim ${step.sim}s`, detail: `playtime=${state.playtime.toFixed(1)}s` });
    } else if ('assert' in step) {
      const { path, op, value } = step.assert;
      const raw = resolvePath(state, path);
      const actual = typeof raw === 'number' ? raw : NaN;
      const ok = compare(actual, op, value);
      results.push({
        ok,
        desc: `assert ${path} ${op} ${value}`,
        detail: `actual=${Number.isFinite(actual) ? actual.toFixed(4) : String(raw)}`,
      });
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
