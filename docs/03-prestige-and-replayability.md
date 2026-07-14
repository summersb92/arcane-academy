# 03 — Prestige & Replayability

The user asked specifically for a rich, replayable prestige system. This is the design's centerpiece.
It's built as **five nested layers**, each unlocking later and running slower than the last, so there's
always a longer horizon to chase.

```
Layer 1  ASCENSION          minutes→hours   — the bread-and-butter reset (Aeon)
Layer 2  ERA DOCTRINES      per ascension   — run mutators that change *how* you play
Layer 3  FOUNDER ARCHETYPES per ascension   — pick who you are this run (playstyle identity)
Layer 4  ARCHMAGE ROSTER    hours→days      — Arcanum's Wizard's Hall: multiple academies, idle Legacy
Layer 5  LEY ATTUNEMENT     days+           — prestige-of-prestige: collapse everything, raise the ceiling
Ambient  ACHIEVEMENTS + CHALLENGES          — permanent tiny boosts & constrained unlock runs
```

---

## Layer 1 — Ascension (soft prestige)
*"Graduate a generation and pass the academy on."*

- **What resets:** rooms, gold, mana, students, faculty, per-run boons, the contract board, this run's Renown.
  (You start a fresh Act I — usually fast-forwarded; see *Legacy of Learning* below.)
- **What persists:** **Aeon** (the payout), the **Meta-Tree** you buy with it, **Codex** unlocks,
  **achievements**, your **Archmage roster** (Layer 4), and settings.
- **Payout:** `Aeon ∝ sqrt(lifetimeRenown) · (1 + graduates/GRAD_SOFT) · doctrineMult` (doc 02 §8).
- **Meta-Tree** (permanent, spend Aeon) — example branches:
  - *Endowment* — start each run with gold / a prebuilt room / faculty slot.
  - *Tenure* — global production & learning multipliers.
  - *Amphitheater* — higher student cap, faster arrivals, higher offline cap.
  - *Legacy of Learning* — **compress or skip Act I** on repeat runs (tier 1: start as a hedge-mage with a
    lair + seed gold · tier 2: start at the Founding threshold · tier 3: found instantly with bonus rooms).
  - *Patronage* — better Contract rewards & a larger board; reduce Mishap chance.
  - *Prescience* — cheaper research, start with N nodes pre-owned.
  - *Unlocks* — permanently open a new school, a new Doctrine slot, a new Founder Archetype.
- **When it unlocks:** after the first meaningful plateau (target ~1–3h run 1); each subsequent run is faster.

**Why it's fun:** the classic incremental dopamine — reset, and immediately feel the meta-tree make run *n+1*
noticeably snappier, letting you reach *new* content you couldn't before.

---

## Layer 2 — Era Doctrines (run mutators / roguelite spice)
*"Every age of the academy has a character."*

On each Ascension you choose an **Era Doctrine** — a global modifier that reshapes the optimal strategy.
Doctrines unlock via the meta-tree and Codex progress. Examples:

| Doctrine | Effect | Creates the fantasy of… |
|---|---|---|
| **Age of Dark** | Dark ×3, Light disabled, Mishap chance +50% | a dark, forbidden academy |
| **The Lean Years** | No faculty upkeep, but all essence ×0.5 | a scrappy, poor school |
| **Prodigy Cohort** | Students learn ×2 & graduate faster, but student cap 50 | quality over quantity |
| **Endless Enrollment** | Cap ×3, arrivals ×2, morale harder to maintain | a crowded mega-university |
| **Ivory Tower** | Contracts & Bestiary disabled, but Insight & essence ×2 | a pure-research sabbatical |
| **Prismatic Path** | Balancing all six elements grants a huge bonus; single-element mults halved | forces diversification toward ❖ |
| **Guild Charter** | Contract rewards ×3 & bigger board, but tuition halved | an adventurers' guild-academy |

Doctrines can later be **stacked** (2–3 slots via meta-tree) for combinatorial variety and score-chasing.

**Why it's fun:** each run *feels* different, not just faster. This is the Spellcaster "what kind of school
am I building this time?" question, formalized as a repeatable choice.

---

## Layer 3 — Founder Archetypes (identity)
*"Who is the Archmage this time?"*

At run start (unlocked via meta-tree) you pick a **Founder Archetype** — a starting identity with a passive,
a signature mechanic, and a bias. Composable with Doctrines.

| Archetype | Passive | Signature |
|---|---|---|
| **The Alchemist** | Potion potency ×2; crafting costs −50% | Transmute: convert any essence → any essence |
| **The Necromancer** | Graduated students leave a "revenant" giving partial ongoing yield | Undeath: population can exceed cap (as revenants) |
| **The Diplomat** | Renown ×1.5; better Contract terms | Treaty: instantly complete a Contract for a Renown/gold price |
| **The Elementalist** | All six elements ×1.5; faster Prismatic | Attune: rotate a ×3 buff across the elements |
| **The Archivist** | Insight ×2; research 20% cheaper | Recall: refund a research node to re-spec |
| **The Adventurer** | Contract rewards ×2; dispatched power ×1.5 | Expedition: send a party on a lucrative multi-reward quest |

**Why it's fun:** archetypes change the *verbs*, not just the numbers — the deepest source of replay variety.

---

## Layer 4 — The Archmage Roster (Arcanum's Wizard's Hall)
*"You are not one wizard. You are a lineage."*

This is the direct homage to Arcanum's signature prestige idea, and the reason there's **no punishing hard reset**.

- Instead of a single save, you maintain a **roster of Archmages** (academies). Unlock extra slots via meta-tree/Attunement.
- **Each Archmage has their own origin story** — a person who began from nothing (doc 08). Founding a *new*
  Archmage replays Act I; *Legacy of Learning* (above) fast-forwards it so it stays a flavorful beat, not a chore.
- **Only one is "active"** (the one you're playing). **Inactive Archmages bank `Legacy` (⌛) passively**
  — Arcanum's "Stored Time" — at a rate based on the state they were parked in (their production & meta-tree).
- **Switch freely** between Archmages at any time (a short cooldown prevents thrashing).
- **Legacy** is a cross-run currency you spend on a **shared Pantheon tree**: bonuses that apply to *all*
  Archmages (e.g., "+X% to whichever school an Archmage specializes in," faster Legacy banking, roster slots).
- **Synergy:** Archmages can be built as **specialists** (one per school). A "council" of diverse specialists
  grants an escalating **Concord** bonus, rewarding you for developing several instead of tunneling one.

**Why it's fun:** it turns "prestige" from *lose everything* into *build a stable of characters that make each
other stronger* — the exact twist that makes Arcanum's prestige beloved, ported into a management frame.

---

## Layer 5 — Ley Line Attunement (prestige-of-prestige / endgame)
*"Collapse the whole lineage into a single point of power."*

The rarest reset, for the long haul. When you've grown the roster and banked large Legacy:

- **Collapse** the entire Pantheon (all Archmages, their Legacy and meta-progress) into **Attunement (◊)**.
- Attunement is spent on the **Ley Nexus** — a small, potent tree that:
  - unlocks **new tiers of content** (a "Prismatic-True" element tier, tier-2 rooms, tier-2 Doctrines),
  - grants huge global multipliers that make the *next* whole cycle dramatically faster,
  - raises structural caps (roster slots, doctrine slots, offline cap, number ceiling).
- You then rebuild — but every earlier layer now runs faster and reaches higher.

**Why it's fun:** it's the "there's a bigger board" reveal — the moment a good incremental game earns its
long tail. It gates the *widest* content behind the *slowest* loop, so dedicated players always have a summit.

---

## Ambient replay systems

- **Achievements** → each grants a tiny permanent multiplier (Arcanum/incremental staple). Hundreds of small ones.
- **Challenges** → optional constrained runs with fixed rules that grant *unique* unlocks on completion:
  - *Monastic* (max 3 rooms), *The Recluse* (**never found an academy** — stay a lone hedge-mage the whole run),
    *Speedrun* (reach Ascension < 30 min), *Single-School*, *No-Faculty*. Each completion → a permanent perk
    or a new Doctrine/Archetype. (*The Recluse* grants a solo-only unlock — see doc 08.)
- **Codex completion** → filling out the encyclopedia grants milestone bonuses, so exploring content pays off.
- **Seasonal/Daily Doctrine** (optional, still offline): a deterministic daily seed from the date → a fixed
  Doctrine+Archetype combo for a leaderboard-free "puzzle of the day," no server needed.

## How the layers reinforce each other
- **Ascension** feeds **Aeon** → the meta-tree that unlocks **Doctrines** and **Archetypes**.
- Playing varied Doctrines/Archetypes fills the **Codex** and **achievements** → more multipliers.
- Parking specialized Archmages banks **Legacy** → the Pantheon tree → faster everything.
- Enough Legacy → **Attunement** → new content tiers → the cycle restarts at a higher altitude.

Every layer answers "why start over?" with a *different* reward: raw speed (Ascension), novelty (Doctrines),
identity (Archetypes), passive growth + synergy (Roster), and a raised ceiling (Attunement).
