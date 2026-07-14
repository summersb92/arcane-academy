# 05 — Technical Architecture

Stack chosen: **TypeScript + Vite + Svelte**, pure client-side, deployed to **GitHub Pages**. No backend.

## 1. Why this stack
- **TypeScript** — a numbers-heavy idler lives or dies by state integrity; static types catch balance/logic
  bugs and make the data tables self-documenting.
- **Vite** — instant dev server + tiny optimized static build; trivial GitHub Pages output.
- **Svelte** — the UI is many reactive panels/tables reading one state store. Svelte's reactive stores map
  perfectly and keep bundle/overhead small (fits the text-UI, no-bloat aesthetic). Components stay thin;
  the game is logic + data, not a component zoo.
- **No server** — everything (sim, saves, content) runs in the browser. Aligns with "host on GitHub, no
  server logic."

## 2. High-level shape

```
┌───────────────────────────── Browser ─────────────────────────────┐
│                                                                     │
│  ENGINE (framework-agnostic TS)          UI (Svelte)                │
│   ├─ state.ts     canonical GameState     ├─ App.svelte  (frame)     │
│   ├─ tick.ts      fixed-step simulation   ├─ panels/*.svelte (tabs)  │
│   ├─ systems/*    rooms, students, …      ├─ stores.ts (bridge)      │
│   ├─ formulas.ts  pure math (doc 02)      └─ components/* (tables…)  │
│   ├─ save.ts      serialize/migrate                                  │
│   ├─ offline.ts   catch-up on load        CONTENT (data, TS)         │
│   ├─ bignum.ts    number facade           ├─ elements.ts rooms.ts    │
│   └─ rng.ts       seeded RNG              ├─ skills.ts futures.ts    │
│                                            ├─ faculty.ts events.ts    │
│  PERSISTENCE                               ├─ doctrines.ts …          │
│   └─ localStorage  (+ export/import str)   └─ config.ts (constants)   │
└─────────────────────────────────────────────────────────────────────┘
```

**Golden rule:** the **engine never imports Svelte**, and the **UI never mutates state directly** — it
calls engine *actions* and reads via stores. This keeps the sim testable in plain Node and lets the UI be
swapped/embedded later. (Matches the author's portability preference — an embed-friendly core.)

## 3. State & the tick loop

```ts
// engine/state.ts — one serializable object is the whole game.
interface GameState {
  version: number;
  meta: MetaState;                 // Aeon, meta-tree, roster, Legacy, Attunement, codex, achievements
  run: RunState;                   // act (1|2) + phase, resources, lair/rooms, students, faculty,
                                   //   research, contracts, morale, doctrine, founder archetype…
  settings: Settings;
  lastSaved: number;               // epoch ms
}
```

```ts
// engine/tick.ts — fixed timestep accumulator (deterministic sim, decoupled render)
const TICK = 0.1; // seconds
let acc = 0, last = performance.now();

function frame(now: number) {
  acc += (now - last) / 1000; last = now;
  let steps = 0;
  while (acc >= TICK && steps++ < MAX_CATCHUP) { step(state, TICK); acc -= TICK; }
  requestAnimationFrame(frame);
}
// step() runs each system in order: production → students → research effects
//         → contracts (timers/completion) → morale/mishaps → events → phase/founding
//         checks → derived-rate cache. Pure functions over state; gated by run.act.
```

- UI re-render is **throttled** (a store "pulse" ~6–10 Hz), independent of the sim rate.
- `MAX_CATCHUP` bounds a single frame; large gaps go through **offline** catch-up instead.

## 4. Offline progression
```ts
// engine/offline.ts
const elapsed = Math.min(now - state.lastSaved, OFFLINE_CAP_MS);
```
- Simulate in coarse **1s** steps (or closed-form for pure exponential/linear generators) for speed.
- **Contract timers advance and complete** offline (they're just timers); **choice-events are deferred** to
  the first online tick so no decision is auto-made. No unfair offline losses.
- Produce a **report** object → the "While you were away…" panel (doc 04 §11).

## 5. Content is data, not code
All balance/content lives in typed tables so adding content = editing data, and balancing never touches
systems (doc 02 §10).

```ts
// content/rooms.ts
export const ROOMS: RoomDef[] = [
  { id: 'ember_hall', name: 'Ember Forge Hall', element: 'fire', size: 1,
    baseYield: { fire: 0.5 }, baseCost: { gold: 20 },
    teaches: 'fire', unlock: { type: 'start' } },
  { id: 'ossuary_hall', name: 'Ossuary Lecture Hall', element: 'dark', size: 2,
    baseYield: { dark: 1.2 }, baseCost: { gold: 60, dark: 10 },
    teaches: 'dark', unlock: { skill: 'dark_basics' } },
  // …
];
```
Research nodes, futures, faculty, doctrines, archetypes, events, achievements follow the same pattern.
Effects are declarative (`{ kind: 'mult', target: 'element:dark', value: 1.5 }`) and applied by a small
interpreter — new content types are added rarely, new content instances constantly.

## 6. Saves & migration
- **Autosave** to `localStorage` every ~30s and on `visibilitychange`/`beforeunload`.
- **Export/Import**: JSON → (optional LZ compress) → base64 string the player can copy/paste or back up.
  (No server = the string *is* the cloud save.)
- **Versioned migrations**: `save.ts` holds `migrate(from → to)` steps so old saves survive content updates.
- **Integrity**: light checksum + try/catch load with a "save looks corrupt — keep backup?" path. Never
  silently wipe a player's progress.

## 7. Numbers
- MVP: native `number` + a suffix formatter (`formatNum`).
- `bignum.ts` is a thin facade (`add/mul/pow/cmp/format`) wrapping `number` now; if deep prestige pushes
  past ~1e300 later, swap the impl for `break_infinity.js`-style big numbers **without touching systems**.

## 7b. Theming
All color is CSS custom-property **tokens**; a theme = one token block (see doc 04 "Theming"). Structure:
`:root {…candlelight defaults…}` → `@media (prefers-color-scheme: light) { :root:not([data-theme]) {…manuscript…} }`
→ `:root[data-theme="…"] {…}` per explicit theme, so a user's choice always beats the OS preference.
The choice persists in settings/localStorage. Ship themes: Candlelight (default dark), Manuscript (light),
Umbral (dark), High Contrast. New/unlockable themes are pure data — a token block + a settings entry.
(Prototyped and verified in `sketches/ui-mockup.html`.)

## 8. Determinism & RNG
- Seeded RNG (`rng.ts`, e.g. mulberry32) stored in state → reproducible events, testable sim, and enables
  the optional "Daily Doctrine" seed-from-date feature (doc 03) with no server.

## 9. Testing
- **Vitest** unit tests on pure functions: `formulas`, offline catch-up, save round-trip + migrations,
  ascension payout, contract resolution, the Founding transition. The engine's framework independence makes this straightforward.
- A tiny **headless sim harness** (`simulate(state, seconds)`) for balance experiments and regression
  (e.g., "run 2 should reach Ascension in < 45 min under default meta").

## 10. Deployment (GitHub Pages)
- `vite build` → static `dist/`. Set `base` in `vite.config.ts` to the repo name for project pages.
- **GitHub Actions**: on push to `main`, build and publish `dist/` to Pages. Zero manual steps.
- Optionally register a **service worker** for offline play + "installable" PWA feel (nice for an idler you
  leave open). Not required for MVP.

## 11. Suggested repo layout
```
arcane-academy/
├─ index.html
├─ vite.config.ts   tsconfig.json   package.json
├─ src/
│  ├─ main.ts                 # boot: load save → offline catch-up → start tick → mount UI
│  ├─ engine/  (state, tick, systems/, formulas, save, offline, bignum, rng)
│  ├─ content/ (config, elements, rooms, faculty, students, skills, futures,
│  │            spells, bestiary, equipment, potions, home, contracts, origin,
│  │            doctrines, archetypes, events, achievements)
│  └─ ui/      (App.svelte, stores.ts, panels/, components/)
├─ tests/                     # vitest
├─ docs/                      # these design docs
└─ .github/workflows/deploy.yml
```

## 12. Open technical questions (decide during build)
- **Contract/event resolution while offline** — completing timers offline but deferring events is the plan;
  confirm it *feels* fair in playtest.
- **Act I ↔ Act II in one state shape** — a single `run.act`/`phase` flag gating systems (chosen) vs. two
  distinct state schemas. The flag keeps carry-over trivial (the lair *is* room #1); confirm it stays clean.
- **Persisting idle Archmages' economies** — store a snapshot rate vs. re-simulate on switch? Start with a
  banked-rate snapshot (cheap, honest); revisit if it feels too static.
- **Save size** — hundreds of students could bloat saves; store students compactly (typed arrays / packed
  fields) and cap roster history.
