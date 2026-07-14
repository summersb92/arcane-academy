# Arcane Academy *(working title)*

> A text-based **idle RPG** about rising from a nobody to an Archmage — and eventually founding a magical
> academy. The solo-mage depth, elemental magic, and prestige philosophy of **Arcanum: Theory of Magic**,
> wearing the university-builder systems of **Spellcaster University** as its late game.

You are a **character**: Life, Stamina, Mana, and seven elemental essences (Fire · Water · Earth · Air ·
Light · Dark · Prismatic), with tabs for your Skills, Spell Craft, Equipment, Potions, and a Bestiary to
hunt. The **Academy** is one tab you unlock once you've made your name.

You start as a penniless stable-hand who finds a torn grimoire page. You learn magic, scrape together a
living scribing scrolls and taking odd jobs, and eventually **found your own academy** — which grows into
a sprawling university whose graduates reshape the world. Then you pass it on, again and again, growing
more powerful with each generation.

There's **no enemy, no war, no doomsday clock** — the only outside pressure is an *opt-in* board of
Contracts (people asking your mages for help). It's a cozy, hopeful, numbers-deep idler.

- **Idle-first, management-deep.** Resources tick while you're away; active play is about *decisions*
  (what to build, whom to hire, what to research, which futures to steer students toward) — not clicking.
- **Text-based UI.** Panels, tables, numbers, tooltips, and a running chronicle — Arcanum's aesthetic.
- **100% static / no server.** Pure client-side. Hosts on GitHub Pages. Saves live in your browser
  with an export/import string.
- **Built to replay.** A multi-layered prestige system (Ascension → Era Doctrines → Archmage roster →
  Ley Attunement) keeps giving you new reasons to start over stronger.

## Status

📋 **Planning phase.** No game code yet — this repo currently holds the design.

## Read the design

| Doc | What's in it |
|-----|--------------|
| [docs/00-vision.md](docs/00-vision.md) | The pitch, pillars, and tone |
| [docs/01-game-design.md](docs/01-game-design.md) | Full GDD: resources, core loop, screens, the merge map |
| [docs/02-mechanics-and-formulas.md](docs/02-mechanics-and-formulas.md) | How each system actually works + starter formulas |
| [docs/03-prestige-and-replayability.md](docs/03-prestige-and-replayability.md) | The five prestige layers |
| [docs/04-ui-sketches.md](docs/04-ui-sketches.md) | ASCII wireframes — the 3-zone frame (resources left · tabs top · character right) |
| [docs/05-tech-architecture.md](docs/05-tech-architecture.md) | TypeScript + Vite + Svelte, tick loop, saves, GH Pages |
| [docs/06-roadmap.md](docs/06-roadmap.md) | MVP → full game milestones |
| [docs/07-content-tables.md](docs/07-content-tables.md) | Starter data: schools, rooms, faculty, students, research, futures, contracts, origin arc |
| [docs/08-origin-and-founding.md](docs/08-origin-and-founding.md) | **Act I** — the person-to-academy journey and the Founding transition |
| [docs/09-magic-and-personal-systems.md](docs/09-magic-and-personal-systems.md) | **The elements, vitals & the solo-mage tabs** (Skills, Player, Home, Spell Craft, Equipment, Potions, Bestiary) |
| [docs/10-tasks.md](docs/10-tasks.md) | **Tasks** — the Main window's action economy (types, layout, mechanics), modeled on Arcanum's Tasks page |
| [docs/ideas/](docs/ideas/roundtable.md) | **Design roundtables** — designer-persona idea contests: [round 1](docs/ideas/roundtable.md) · [round 2 (Fable) + UI panel](docs/ideas/roundtable-2.md) · [round 3: Longevity Council, Kittens Game × Evolve](docs/ideas/roundtable-3.md) · [accepted](docs/ideas/accepted.md) · [poor](docs/ideas/poor-ideas.md) · [rejected](docs/ideas/rejected.md) |
| [sketches/ui-mockup.html](sketches/ui-mockup.html) | A static, rendered mockup — 3-zone layout; **Main = Tasks/Activity** |

## Tech (planned)

TypeScript · Vite · Svelte · localStorage saves · GitHub Pages. No backend, ever.

## Inspirations & credit

- **Arcanum: Theory of Magic** by Mathias Hjelm — <https://mathiashjelm.gitlab.io/arcanum/> ·
  [wiki](https://theoryofmagic.miraheze.org/wiki/Main_Page)
- **Spellcaster University** by Sneaky Yak Studio —
  [Steam](https://store.steampowered.com/app/895620/Spellcaster_University/) ·
  [guide](https://ackadia.com/games/spellcaster-university-guide/)

This is a fan-inspired original work — it borrows *design ideas*, not assets, text, or code.
