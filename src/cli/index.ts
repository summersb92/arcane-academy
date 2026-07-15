#!/usr/bin/env node
// Arcane Academy — headless CLI over the SAME engine the UI uses.
// Imports ONLY src/engine + src/content (never src/ui): the clean import is
// itself the proof of the "no Svelte/DOM in the engine" rule.
//
//   npm run cli -- state [--json]
//   npm run cli -- sim <seconds> [--seed N] [--json]
//   npm run cli -- export
//   npm run cli -- import <string>
//   npm run cli -- save <path>
//   npm run cli -- load <path>
//   npm run cli -- run <scenario.json>
//   npm run cli -- repl

import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { newGame, type GameState } from '../engine/state';
import { simulate } from '../engine/tick';
import { serialize, exportString, importString, toFileString, safeLoad } from '../engine/save';
import { formatNumber } from '../engine/format';
import { doTask, startTask, stopTask, listTaskInfo } from '../engine/systems/tasks';
import { TASK_BY_ID } from '../content/tasks';
import { runScenario, type Scenario } from './scenario';

interface Args {
  cmd: string;
  positional: string[];
  json: boolean;
  seed?: number;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let json = false;
  let seed: number | undefined;
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--seed') seed = Number(argv[++i]);
    else positional.push(a);
  }
  return { cmd: argv[0] ?? 'help', positional, json, seed };
}

function freshState(seed?: number): GameState {
  return seed === undefined || Number.isNaN(seed) ? newGame() : newGame(seed);
}

function renderState(state: GameState): string {
  const r = state.run.resources;
  const v = state.run.vitals;
  const awakened = Object.entries(state.run.essence)
    .filter(([, e]) => e.awakened)
    .map(([id, e]) => `${id}=${formatNumber(e.amount)}`)
    .join(' ');
  return [
    `phase=${state.run.phase} act=${state.run.act} playtime=${state.playtime.toFixed(1)}s seed=${state.seed}`,
    `gold=${formatNumber(r.gold)} insight=${formatNumber(r.insight)}/${formatNumber(state.run.caps.insight)} renown=${formatNumber(r.renown)}`,
    `materials: moonpetal=${r.moonpetal} ironOre=${r.ironOre} spiritDust=${r.spiritDust}`,
    `vitals: life=${v.life.cur.toFixed(1)}/${v.life.max} stamina=${v.stamina.cur.toFixed(1)}/${v.stamina.max} mana=${v.mana.cur.toFixed(1)}/${v.mana.max}`,
    `essence(awakened): ${awakened || '(none)'}`,
    `skills: ${state.run.skills.length ? state.run.skills.join(', ') : '(none)'}`,
  ].join('\n');
}

function printState(state: GameState, json: boolean): void {
  console.log(json ? JSON.stringify(state, null, 2) : renderState(state));
}

function renderTasks(state: GameState): string {
  return listTaskInfo(state)
    .map((info) => {
      const def = TASK_BY_ID[info.id];
      const marks =
        [info.active && 'active', info.paused && 'paused', info.locked && 'locked'].filter(Boolean).join(',') || '-';
      const prog = def.length ? ` ${Math.round(info.progress * 100)}%` : '';
      return `  ${info.id.padEnd(14)} ${def.type.padEnd(9)} ${marks}${prog}  ${def.name}`;
    })
    .join('\n');
}

type TaskVerb = 'do' | 'start' | 'stop';
const TASK_FN: Record<TaskVerb, (s: GameState, id: string) => boolean> = {
  do: doTask,
  start: startTask,
  stop: stopTask,
};

// ---- command pipeline ----
// The whole argv is one pipeline of verbs threaded through a SINGLE in-memory
// state, so `load <p> sim <s> save <p>` loads → fast-forwards → persists the SAME
// state (and `state`/`export` reflect the loaded+simmed result). A lone verb is
// just a pipeline of length 1, so every prior single-command usage still works.
const PIPE_VERBS = new Set([
  'state', 'sim', 'tasks', 'do', 'start', 'stop', 'export', 'import', 'save', 'load', 'help', '--help', '-h',
]);

interface PipeCommand {
  verb: string;
  args: string[];
}

function parsePipeline(argv: string[]): { commands: PipeCommand[]; json: boolean; seed?: number } {
  const commands: PipeCommand[] = [];
  let json = false;
  let seed: number | undefined;
  let cur: PipeCommand | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--seed') seed = Number(argv[++i]);
    else if (PIPE_VERBS.has(a)) commands.push((cur = { verb: a, args: [] }));
    else if (cur) cur.args.push(a);
    else commands.push((cur = { verb: a, args: [] })); // leading unknown → unknown command
  }
  if (commands.length === 0) commands.push({ verb: 'help', args: [] });
  return { commands, json, seed };
}

function printHelp(): void {
  console.log(
    [
      'Arcane Academy CLI',
      'Usage: npm run cli -- <command> [args]   (commands chain, threading one state)',
      '',
      '  state [--json] [--seed N]      dump resources, vitals, essence, phase',
      '  tasks [--seed N]               list task ids, types, and status',
      '  do|start|stop <id> [--seed N]  drive a task action, then print state (exit 0 ok / 1 refused)',
      '  sim <seconds> [--seed N] [--json]   fast-forward the deterministic tick loop',
      '  export [--seed N]              print a portable save string (clipboard format)',
      '  import <string> [--json]       load a save string and print state',
      '  save <path> [--seed N]         write a .aasave file (same format the browser downloads)',
      '  load <path> [--json]           read a .aasave file (browser saves load here too)',
      '  run <scenario.json>            run a scenario; exit 0/1 on its assertions',
      '  repl [--seed N]                interactive loop',
      '',
      '  e.g.  load run.aasave sim 3600 save run.aasave   (load → fast-forward 1h → persist)',
    ].join('\n'),
  );
}

/** Execute the parsed pipeline against ONE threaded state. */
function runPipeline(commands: PipeCommand[], json: boolean, seed?: number): number {
  let state: GameState | null = null;
  const ensure = (): GameState => (state ??= freshState(seed));
  let code = 0;

  for (const { verb, args } of commands) {
    switch (verb) {
      case 'state':
        printState(ensure(), json);
        break;

      case 'tasks':
        console.log(renderTasks(ensure()));
        break;

      case 'sim': {
        const seconds = Number(args[0]);
        if (!Number.isFinite(seconds) || seconds < 0) {
          console.error('usage: sim <seconds> [--seed N] [--json]');
          return 1;
        }
        const s = ensure();
        const before = { ...s.run.resources };
        simulate(s, seconds);
        if (json) {
          printState(s, true);
        } else {
          console.log(`# simulated ${seconds}s (seed ${s.seed})`);
          for (const [k, v] of Object.entries(s.run.resources)) {
            const delta = v - (before[k as keyof typeof before] ?? 0);
            if (Math.abs(delta) > 1e-9)
              console.log(
                `  ${k}: ${formatNumber(before[k as keyof typeof before])} -> ${formatNumber(v)}  (${delta >= 0 ? '+' : ''}${formatNumber(delta)})`,
              );
          }
          console.log(renderState(s));
        }
        break;
      }

      case 'do':
      case 'start':
      case 'stop': {
        const id = args[0];
        if (!id) {
          console.error(`usage: ${verb} <taskId>   (see 'tasks' for ids)`);
          return 1;
        }
        const s = ensure();
        const ok = TASK_FN[verb as TaskVerb](s, id);
        console.log(`# ${verb} ${id}: ${ok ? 'ok' : 'refused'} (seed ${s.seed})`);
        printState(s, json);
        if (!ok) code = 1;
        break;
      }

      case 'export':
        console.log(exportString(ensure()));
        break;

      case 'import': {
        const text = args[0];
        if (!text) {
          console.error('usage: import <string>');
          return 1;
        }
        try {
          state = importString(text); // becomes the threaded state
          printState(state, json);
        } catch (e) {
          console.error(`import failed: ${e instanceof Error ? e.message : String(e)}`);
          return 1;
        }
        break;
      }

      case 'save': {
        const path = args[0];
        if (!path) {
          console.error('usage: save <path>');
          return 1;
        }
        // Persist the CURRENT threaded state (loaded+simmed), NOT a fresh game.
        writeFileSync(path, toFileString(ensure()), 'utf8');
        console.log(`saved -> ${path}`);
        break;
      }

      case 'load': {
        const path = args[0];
        if (!path) {
          console.error('usage: load <path>');
          return 1;
        }
        let text: string;
        try {
          text = readFileSync(path, 'utf8');
        } catch (e) {
          console.error(`could not read file: ${e instanceof Error ? e.message : String(e)}`);
          return 1;
        }
        const res = safeLoad(text);
        if (!res.ok || !res.state) {
          console.error(`load failed (save left intact): ${res.error}`);
          return 1;
        }
        void serialize(res.state); // prove it re-serializes with the same engine
        state = res.state; // thread the loaded state forward through the pipeline
        console.log(`loaded <- ${path}`);
        printState(state, json);
        break;
      }

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        printHelp();
        code = 1; // unknown command
    }
  }
  return code;
}

function cmdRun(args: Args): number {
  const path = args.positional[0];
  if (!path) {
    console.error('usage: run <scenario.json>');
    return 1;
  }
  let spec: Scenario;
  try {
    spec = JSON.parse(readFileSync(path, 'utf8')) as Scenario;
  } catch (e) {
    console.error(`could not read scenario: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
  const result = runScenario(spec);
  console.log(`# scenario: ${result.name}`);
  for (const r of result.results) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.desc}${r.detail ? `  [${r.detail}]` : ''}`);
  }
  console.log(result.ok ? `OK — ${result.results.length} steps passed` : 'FAILED');
  return result.ok ? 0 : 1;
}

function cmdRepl(args: Args): number {
  const state = freshState(args.seed);
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: 'aa> ' });
  console.log('Arcane Academy REPL — commands: state, tasks, do/start/stop <id>, sim <sec>, export, help, quit');
  rl.prompt();
  rl.on('line', (line) => {
    const [c, arg] = line.trim().split(/\s+/);
    switch (c) {
      case '':
        break;
      case 'state':
        console.log(renderState(state));
        break;
      case 'tasks':
        console.log(renderTasks(state));
        break;
      case 'do':
      case 'start':
      case 'stop': {
        if (!arg) {
          console.log(`usage: ${c} <taskId>`);
          break;
        }
        console.log(`${c} ${arg}: ${TASK_FN[c](state, arg) ? 'ok' : 'refused'}`);
        break;
      }
      case 'sim': {
        const secs = Number(arg);
        if (Number.isFinite(secs)) {
          simulate(state, secs);
          console.log(`simulated ${secs}s`);
        } else console.log('usage: sim <seconds>');
        break;
      }
      case 'export':
        console.log(exportString(state));
        break;
      case 'help':
        console.log('state | tasks | do/start/stop <id> | sim <sec> | export | quit');
        break;
      case 'quit':
      case 'exit':
        rl.close();
        return;
      default:
        console.log(`unknown: ${c} (try 'help')`);
    }
    rl.prompt();
  });
  rl.on('close', () => process.exit(0));
  return 0;
}

function main(): number {
  const argv = process.argv.slice(2);
  const cmd0 = argv[0] ?? 'help';

  // `run` and `repl` are standalone: `run` owns its assertion-driven exit code and
  // `repl` is interactive (manages its own lifecycle) — neither composes with the
  // state-threading pipeline, so they're dispatched here directly.
  if (cmd0 === 'run') return cmdRun(parseArgs(argv));
  if (cmd0 === 'repl') return cmdRepl(parseArgs(argv));

  const { commands, json, seed } = parsePipeline(argv);
  return runPipeline(commands, json, seed);
}

// repl manages its own lifecycle; everything else exits on the returned code.
const code = main();
if ((process.argv[2] ?? 'help') !== 'repl') process.exit(code);
