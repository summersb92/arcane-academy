# 00 — Vision

## One-line pitch
*Rise from a penniless stable-hand to an Archmage — learn magic from a torn page, make a living by it,
found an academy, watch it thrive while you sleep, and hand it down through the ages, each generation
more powerful than the last.*

## The fantasy
You begin as a **nobody** — a stable-hand with calloused hands and a stubborn curiosity. You find a torn
grimoire page, sound out the words, and something *sparks*. You study by candlelight, scribe scrolls for
coin, take small jobs from frightened villagers, and slowly become the mage everyone in the valley whispers
about. Then, one day, you have enough gold and enough name to do the unthinkable: **found your own academy.**

From there it becomes a living institution: lecture halls humming with the six elements, a faculty of
eccentric professors, students who arrive as frightened villagers and graduate as battle-mages, diplomats,
and liches — and a rotating board of petitions from a world that has learned to come to *you* for help.
(The full personal arc that opens the game is detailed in [08-origin-and-founding.md](08-origin-and-founding.md).)

## Why merge these two games?
- **Arcanum: Theory of Magic** is a *fantastic engine* — deep, satisfying numbers; a sprawling research
  web; and a genuinely original prestige idea (the Wizard's Hall: you don't wipe progress, you found
  *new characters* that bank time while idle). But its theme is a solitary wizard.
- **Spellcaster University** is a *fantastic world* — a magic school full of personality: five schools of
  magic, rooms and faculty and student traits, graduation outcomes, and an encroaching evil. But it's a
  hands-on RTS-ish builder, not an idler.

Merge them and you get: **the cozy, always-progressing idle engine of Arcanum expressing the charming,
decision-rich university of Spellcaster** — in a pure text UI.

## Design pillars
1. **Respect the player's time.** Idle-first. Progress happens while away (capped, honest). A session
   should be about a handful of *good decisions*, then closing the tab feeling ahead.
2. **Numbers you can read.** Every rate, multiplier, and source is inspectable. Tooltips explain *why*
   a number is what it is. No hidden math.
3. **Decisions over clicks.** No cookie to click 10,000 times. The "clicks" are choices: build this or
   that, specialize or diversify, chase contracts or turn inward, found now or grow as a hedge-mage, ascend now or push further.
4. **Always a next thing.** Short loop (build/upgrade), medium loop (graduate a cohort, fulfill a contract),
   long loop (found the academy, then ascend), meta loop (Archmage roster, Ley Attunement). Something is
   always ~minutes away.
5. **Replay is the point.** The systems assume you'll restart many times; each restart should feel
   *different* (doctrines, founder archetypes, challenges), not just *faster*.
6. **Static & self-contained.** No account, no server, no telemetry. Your save is yours; export it as a string.

## Tone & aesthetic
- **Cozy-scholarly and hopeful.** Warm library lamplight; ink and parchment; a humble-beginnings underdog
  story that grows into quiet grandeur. Pressure is gentle (morale, upkeep, opt-in contracts) — never a
  looming enemy. No war, no doomsday clock.
- **Text-forward.** Monospace-ish, tabular, tooltip-rich. Think a beautiful terminal / illuminated
  manuscript hybrid. Minimal art; maybe a few glyphs/emoji-as-icons and ASCII flourishes.
- **Flavor everywhere.** Rooms, students, faculty, and events have short evocative descriptions. The
  Codex rewards curiosity.

## What success looks like (for a fun personal project)
- A stranger can open the GitHub Pages link, understand the first screen in 30 seconds, and be hooked
  within 5 minutes — the humble stable-hand opening does the hooking.
- The **Founding** (Act I → academy) lands in the first ~15–40 min and feels like the game "opening up."
- The first prestige (Ascension) lands within the first ~1–3 hours and *visibly* changes the next run.
- You (the author) want to keep adding schools, doctrines, and events because the data-driven content
  system makes it easy.

## Explicit non-goals
- No multiplayer, no server, no monetization, no accounts.
- **No combat/base-defense, no enemy invasion, no doomsday clock.** Outside pressure is only the *opt-in*
  Contracts board — help the world if you want the rewards, ignore it with no penalty.
- Not photorealistic or heavily animated — text and numbers are the medium, on purpose.
