# 08 — The Origin Arc & Founding

The game is played in **two acts**. Act I is a personal journey — one nobody, alone, learning magic and
making a living by it. Act II is the academy management game (docs 01–07). The bridge between them is
**the Founding**, a one-time milestone transition (not a reset) where the person becomes the Headmaster.

> This arc replaces a "you begin already running a school" cold-start. It's the tutorial *and* the story:
> Arcanum's "rise from a lowly stable-hand to Archmage," expressed as the opening hour(s) of play.

```
ACT I — THE LONG ROAD  (solo)                          ACT II — THE ACADEMY  (management)
  Phase 1  Origin      — a nobody, laboring for coin        rooms · students · faculty
  Phase 2  Awakening   — a spark; first study & cantrips     research web · contracts at scale
  Phase 3  Hedge-Mage  — solo lair, scrolls, contracts   ─►  FOUNDING  ─►  (everything in docs 01–07)
                          reputation & skills grow
```

## Design goals of Act I
- **Start from nothing.** No mana, no magic, barely any coin. The first minutes are humble and human.
- **Earn every capability.** Magic is *discovered*, then *studied*, then *practiced for a living* — each
  step unlocks a mechanic, so Act I teaches the whole vocabulary the academy later scales up.
- **Same systems, smaller.** The solo loop uses the *same* resources and verbs as the academy (Gold,
  Stamina, mana, Insight, Renown, Contracts, a "room" that is your lair) so nothing is throwaway tutorial.
- **Idle-first even here.** A job trickles coin while away; study and practice tick on their own. Act I is
  short but honest — target ~15–40 min on a first, unassisted playthrough.

## Phase 1 — Origin ("The Nobody")
You are a stable-hand / scullion / field-hand (flavor set at start or by Founder Archetype). You have
**Stamina** (flavored *Vigor*) and can take **menial labor** for a trickle of **Gold** (flavored *coin*).

- **Loop:** labor ticks Gold; Stamina caps how hard you can push (an optional active "work a double" spends
  Stamina for a coin burst).
- **The inciting spark:** a scripted early beat — you find a torn **grimoire page** / witness a hedge-witch /
  are handed a cracked focus. This unlocks **Insight (◈)** and Phase 2. (Cheap to reach — a few minutes.)

## Phase 2 — Awakening ("The Apprentice")
You can now **Study** (generate a trickle of Insight) and learn your first **Cantrips** on a small personal
skill tree — the seed of the full Research web.

- **First cantrips (examples):** *Spark* (unlocks ▲ Fire essence), *Mend* (unlocks a Stamina-regen bonus &
  the Light path later), *Read Aura* (reveals hidden info / better contract previews), *Kindle Focus*
  (small global production bump).
- Learning a cantrip that "opens an element" starts a **tiny personal trickle of that essence** as you
  practice — your first ▲/☾/etc. You typically open **1–2 elements** in Act I; the rest wait for the academy.
- Insight here is scarce; each cantrip is a real choice. This is Act I's "just one more node" hook in miniature.

## Phase 3 — Hedge-Mage ("The Practitioner")
You set up a **lair** — a single upgradeable space (the direct precursor to a Room; at Founding it becomes
your academy's first room). Now you make a *living* by magic through three solo livelihoods:

1. **Scribe scrolls** (Arcanum's scribing) — spend essence + Materials + time → sell for Gold, or keep as a
   one-shot buff. Your first reliable income.
2. **Take Contracts** (see below) — the outside world's small jobs: ward a barn, mend a broken cart-axle,
   brew a tonic, chase off crows. Dispatch → wait → get paid in Gold + **Renown**.
3. **Brew & craft** — potions/charms for income and self-buffs.

As you practice, your **skills** rise and your **Renown** spreads ("there's a mage in the valley who…").
Renown is the reputation that will later *attract students*. Stamina, mana, and Insight all now flow — the
full resource set is live, just small.

## The Founding (Act I → Act II transition)
When you meet the founding requirements, the **Found an Academy** action unlocks. Requirements (tunable):

| Requirement | Why |
|---|---|
| **Gold ≥ threshold** | you must be able to afford a site/charter |
| **Renown ≥ threshold** | the world must know your name enough to send students |
| **A Charter** | bought from a guild, or granted by a choice-event/contract reward |
| **A Site** | buy land / claim a ruined tower (a big Gold sink that becomes your Grounds) |

**What happens on Founding (a transition, not a reset):**
- Your **lair becomes the academy's first room**; your **cantrips/skills become the Headmaster's kit**
  (the Spells tab); your Gold, Renown, Insight, and mana **carry over**.
- New systems switch on: **students arrive**, **faculty** can be hired, **Grounds capacity** appears, the
  full **Research web** opens, and **Contracts scale up** (now fulfilled by dispatching students/graduates,
  not just you).
- The Chronicle marks it as the defining moment of the run. The UI's tab rail expands from the few Act I
  tabs to the full set (doc 04).

## How Act I interacts with prestige (doc 03)
- **First run:** play the full Act I — it's the story and the tutorial.
- **Later runs & new Archmages:** the personal arc is *the founder's origin story*, so it fits the
  **Archmage Roster** perfectly — each Archmage is a person who once started from nothing. To avoid tedium,
  the **meta-tree** sells **"Legacy of Learning"** upgrades that **compress or skip Act I** on repeat runs:
  - tier 1: start Phase 3 with a lair and seed Gold,
  - tier 2: start at the Founding threshold (Act I auto-completes in seconds with a summary),
  - tier 3: found instantly with bonus starting rooms.
- A dedicated **Challenge — "The Recluse"** inverts this: *never* found an academy; see how powerful a lone
  hedge-mage can become. Grants a unique solo-only unlock.

## New/changed UI for Act I (see doc 04/09 for the full frame)
The frame is always **Resources (left) · tabs (top) · Character (right)**. Act I shows a **reduced tab
rail** — only what exists yet:
- **Main** — overview: what you're doing, the Chronicle, and (from Phase 3) the Contracts & Hunts board.
- **Skills** — the first cantrips (Phase 2), growing into the full progression web.
- **Player** — your character sheet (level, attributes, resistances) — live from the start.
- **Home** — where you labor (Phase 1) and set up your dwelling/livelihoods (Phase 3); holds the Founding card.
- **Spell Craft · Potions · Equipment · Bestiary** grey in as their mechanics come online.
- **Academy** stays locked until the Founding; **Codex/System** live in the header.

The right-hand **Character** panel starts tiny — ✚ Life, ⚡ Stamina, and (once you learn Spark) a single
element's essence — and fills in as you open more elements. A persistent **"Founding" progress card** on
**Home** (Phase 3) shows the four requirements ticking toward the transition, so the goal is always visible.
