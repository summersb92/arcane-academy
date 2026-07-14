# 06 — Roadmap

Incremental milestones. Each is playable/testable on its own; the game tells a story from **M1** (the solo
origin), is a *full loop* by **M4**, and is *replayable* by **M6**. Everything deploys to GitHub Pages from
M0 so it's always shippable.

## M0 — Skeleton & pipeline  *(foundation)*
- Vite + TS + Svelte project; `base` set for Pages; GitHub Action deploys `dist/` on push.
- Global frame: resource header, tab rail, main/context panels (static data). Tab rail reads `run.act`.
- Engine skeleton: `GameState` (with `run.act`/`phase`), fixed-timestep tick loop, seeded RNG, `formatNum`.
- Save/load to localStorage + export/import string + autosave.
- **Exit check:** a blank state loads, one hard-coded generator ticks a resource, reload restores state.

## M1 — Act I: the solo mage  *(the vertical slice — establishes the frame, the Task engine & doc 09 systems)*
- The three-zone frame: **Resources (left) · tabs (top) · Character (right)** with Vitals (Life/Stamina/Mana)
  and Essence (first 1–2 elements).
- **The Task / Activity engine (doc 10) — the core loop mechanic everything plugs into:** instant / running /
  perpetual tasks; **Activity slots**; **startup + running costs** with **auto-pause**; repeat toggle &
  **"At N"** scaling; Limited-task **Max**; tag/type filtering. The **Main** tab renders it.
- Phase 1 Origin: labor (Home) for Gold, the scripted "spark" trigger. **Player** sheet live from the start.
- Phase 2 Awakening: **Skills** (cantrip tree) → Insight; first element essence.
- Phase 3 Hedge-Mage: furnish **Home**; **Spell Craft** (compose/cast); **Bestiary** (first low hunts — Life
  at stake, essence/material drops); **Potions**/**Equipment** basics; a **minimal Contracts** board.
- The **Founding**: requirements card on Home (Gold/Renown/Charter/Site) → flips `act = 2`, converts Home to
  the academy's first hall, and greys in the **Academy** tab.
- **Exit check:** a new player goes nobody → hedge-mage (casts a spell, wins a hunt) → founds an academy in
  ~15–40 min and it *feels* like a journey.

## M2 — Core academy economy
- Rooms system: build, upgrade, yield, upkeep, Grounds capacity from the Site (data-driven `content/rooms.ts`).
- Two elements live (Fire + Dark) with several halls each; gold + 2 essences + Insight at academy scale.
- Grounds tab interactive; Academy tab shows live rates with sourced tooltips.
- **Exit check:** post-Founding, you can meaningfully build/upgrade for 10+ minutes and feel progression.

## M3 — Students & faculty
- Student arrivals, auto-enroll, traits/races, skill learning, Dormitory cap.
- Enrollment Policy; Students tab with roster + progress bars.
- Faculty candidate pool, hire/assign/upkeep; Faculty tab.
- **Exit check:** students visibly accelerate production; hiring a professor is a clear good decision.

## M4 — Research + Futures + Contracts  *(full loop & first real FUN)*
- Skills web (Fire+Dark elementalism branches) that literally continues the Act I cantrip tree.
- Futures: requirements, graduation queue, Renown + per-run boons; wire into Students tab.
- **Contracts at scale**: dispatch students/graduates; dispatched-power & rewards; the board grows with Renown.
- Chronicle log. Offline catch-up + "While you were away…" report (contracts complete, events deferred).
- **Exit check:** the full short/medium loop is present; a fresh player is engaged ~60+ min across both acts.

## M5 — Spell Craft, Events, Morale & all six elements
- Spell Craft (element × shape × component + inscribe); rituals + active casts (Surge/Hasten/Inspire/Quell) + scrolls.
- Morale + light **Mishap** choice-events (the only negative pressure); Sanctum/Refectory/Ambiance feed it.
- Choice events (merchant, orphan, rival…) + the remaining four elements (Water/Earth/Air/Light) + Prismatic capstone online.
- **Exit check:** runs have texture and gentle stakes; active play rewarding but never mandatory. **No Blight anywhere.**

## M6 — Ascension + meta-tree  *(replayable)*
- Ascension flow: payout preview, reset boundary, Aeon meta-tree (persist correctly through reset).
- **Legacy of Learning** meta branch: fast-forward/skip Act I on repeat runs (t1 lair → t2 Founding → t3 instant).
- Era Doctrines (start with ~5) and the Doctrine picker on ascend.
- Codex begins (auto-populates unlocked content); basic achievements with tiny mults.
- **Exit check:** first ascension ~1–3h; run 2 is faster (Act I compressed) *and* different; players want run 3.

## M7 — Deep prestige & content breadth
- Founder Archetypes (start with ~4), each reshaping Act I's flavor and Act II's strategy.
- Archmage Roster + Legacy banking + Pantheon tree + Council Concord (each Archmage has its own origin).
- Ley Attunement endgame layer + a 6th-tier content unlock.
- Challenges (start with ~4, incl. **The Recluse** — never found an academy) granting unique unlocks; Daily Doctrine seed.
- **Exit check:** a dedicated player has days of goals and several distinct viable strategies.

## M8 — Polish, balance, feel
- Balance passes via the headless sim harness (curve targets per milestone, incl. Act I length).
- Number-format options, themes (dark/light), keyboard nav, mobile/responsive drawer.
- Sound-optional micro-feedback; onboarding hints; tooltip/breakdown coverage everywhere.
- PWA/service worker for offline + installable; save-corruption safeguards; migration tests.
- **Exit check:** a stranger from a link is hooked in 5 min (by the origin), founds an academy, and returns the next day.

## Definition of "1.0"
M0–M7 complete + one full M8 polish pass: the full Act I solo mage, the Founding, six elements + Prismatic, all five
prestige layers, ~5 doctrines, ~4 archetypes, ~4 challenges, a Contracts board, a populated Codex, honest
offline, safe saves, and it's *fun to restart*.

## Rough sequencing note
M1–M4 is the biggest risk-reducer (proves both the solo origin *and* the academy loop are fun before
building prestige on top). Resist adding breadth (more schools/rooms) before M4's loop feels good — content
is cheap later precisely because it's data.
