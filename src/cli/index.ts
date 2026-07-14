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
import {
  serialize,
  exportString,
  importString,
  toFileString,
  fromFileString,
  safeLoad,
} from '../engine/save';
import { formatNumber } from '../engine/format';
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

function cmdSim(args: Args): number {
  const seconds = Number(args.positional[0]);
  if (!Number.isFinite(seconds) || seconds < 0) {
    console.error('usage: sim <seconds> [--seed N] [--json]');
    return 1;
  }
  const state = freshState(args.seed);
  const before = { ...state.run.resources };
  simulate(state, seconds);
  if (args.json) {
    printState(state, true);
  } else {
    console.log(`# simulated ${seconds}s (seed ${state.seed})`);
    for (const [k, v] of Object.entries(state.run.resources)) {
      const delta = v - (before[k as keyof typeof before] ?? 0);
      if (Math.abs(delta) > 1e-9) console.log(`  ${k}: ${formatNumber(before[k as keyof typeof before])} -> ${formatNumber(v)}  (${delta >= 0 ? '+' : ''}${formatNumber(delta)})`);
    }
    console.log(renderState(state));
  }
  return 0;
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
  console.log('Arcane Academy REPL — commands: state, sim <sec>, export, help, quit');
  rl.prompt();
  rl.on('line', (line) => {
    const [c, arg] = line.trim().split(/\s+/);
    switch (c) {
      case '':
        break;
      case 'state':
        console.log(renderState(state));
        break;
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
        console.log('state | sim <sec> | export | quit');
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
  const args = parseArgs(process.argv.slice(2));

  switch (args.cmd) {
    case 'state':
      printState(freshState(args.seed), args.json);
      return 0;

    case 'sim':
      return cmdSim(args);

    case 'export':
      console.log(exportString(freshState(args.seed)));
      return 0;

    case 'import': {
      const text = args.positional[0];
      if (!text) {
        console.error('usage: import <string>');
        return 1;
      }
      try {
        printState(importString(text), args.json);
        return 0;
      } catch (e) {
        console.error(`import failed: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
      }
    }

    case 'save': {
      const path = args.positional[0];
      if (!path) {
        console.error('usage: save <path>');
        return 1;
      }
      const state = freshState(args.seed);
      writeFileSync(path, toFileString(state), 'utf8');
      console.log(`saved -> ${path}`);
      return 0;
    }

    case 'load': {
      const path = args.positional[0];
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
      // prove it re-serializes with the same engine (cross-transport check)
      void fromFileString(text);
      void serialize(res.state);
      console.log(`loaded <- ${path}`);
      printState(res.state, args.json);
      return 0;
    }

    case 'run':
      return cmdRun(args);

    case 'repl':
      return cmdRepl(args);

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(
        [
          'Arcane Academy CLI',
          'Usage: npm run cli -- <command> [args]',
          '',
          '  state [--json] [--seed N]      dump resources, vitals, essence, phase',
          '  sim <seconds> [--seed N] [--json]   fast-forward the deterministic tick loop',
          '  export [--seed N]              print a portable save string (clipboard format)',
          '  import <string> [--json]       load a save string and print state',
          '  save <path> [--seed N]         write a .aasave file (same format the browser downloads)',
          '  load <path> [--json]           read a .aasave file (browser saves load here too)',
          '  run <scenario.json>            run a scenario; exit 0/1 on its assertions',
          '  repl [--seed N]                interactive loop',
        ].join('\n'),
      );
      return args.cmd === 'help' || args.cmd.startsWith('-') ? 0 : 1;
  }
}

// repl manages its own lifecycle; everything else exits on the returned code.
const code = main();
if (parseArgs(process.argv.slice(2)).cmd !== 'repl') process.exit(code);
