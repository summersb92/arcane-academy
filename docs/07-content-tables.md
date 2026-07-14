# 07 — Starter Content Tables

Seed content for the first playable build. Numbers are first-pass guesses (tune later). This is the raw
material the data tables in `src/content/*` are built from. Not exhaustive — enough to prove each system
and show the flavor.

> **Element migration (per doc 09):** the magic model is now **Arcanum's 6 elements + Prismatic**, not the
> old 5 Spellcaster schools. Mapping: **Arcane→Air/Prismatic · Nature→Earth · Light→Light · Shadow→Dark ·
> Alchemy→Fire/Water + the Potions system.** Room/research/trait rows below are illustrative and being
> renamed element-ward (e.g. "Shadow"→"Dark", Umbral Hall→Ossuary Hall). Vitals & essence live on the
> Character panel (doc 04/09); this file lists the physical/academy content.

## Elements (the six + Prismatic)
| Element | Glyph | Opposes | Signature niche |
|---|---|---|---|
| **Fire** | ▲ | Water | damage, forging, haste |
| **Water** | ▼ | Fire | healing-over-time, cold, control |
| **Earth** | ⬢ | Air | defense, materials, wealth, endurance |
| **Air** | ≈ | Earth | speed, insight, evasion, lightning |
| **Light** | ☀ | Dark | healing, wards, morale, mishap reduction |
| **Dark** | ☾ | Light | necromancy, lifesteal, high yield, secrets |
| **Prismatic** | ❖ | — | all elements at once; endgame; needs all six balanced |
| *(Neutral)* | ◈ | — | Insight/Skills, capacity, global mults (not an element) |

## Act I — Origin arc content (doc 08)
**Menial jobs (Phase 1):** Muck the Stables (idle ⦿) · Haul Water · Work a Double (⚡ → ⦿ burst).
**Spark triggers (any unlocks Phase 2):** find a torn grimoire page · glimpse the hedge-witch's rite ·
inherit a cracked focus.
**First cantrips (Phase 2 mini-tree):**
| Cantrip | Cost | Effect |
|---|---|---|
| Read the Page | ◈2 | opens the tree (prereq for the rest) |
| Spark | ◈4 | begin a slow ▲ Fire essence trickle |
| Mend | ◈4 | +Vigor/Stamina regen; opens the Light path later |
| Kindle Focus | ◈6 | +10% to everything you produce |
| Read Aura | ◈5 | better Contract previews; reveals hidden event info |

**Livelihoods (Phase 3, at your lair):** Scribe a Scroll (⚗+time→⦿ or keep) · Brew a Tonic (❦+time→⦿+buff) ·
take **Contracts** (below).
**Founding requirements:** Gold ≥ ~500 · Renown ≥ ~30 · a **Charter** (guild contract reward, or buy ~⦿300) ·
a **Site** (e.g., ruined Thornwatch Tower ~⦿400 → becomes your Grounds). The lair carries over as room #1.

## Rooms (starter set)
| Room | School | Size | Base yield/s | Base cost | Teaches | Unlock |
|---|---|---|---|---|---|---|
| Candle Study | Arcane | 1 | ✦0.5 | ⦿20 | Arcane | start |
| Arcane Atheneum | Arcane | 2 | ✦1.4 | ⦿70 ✦10 | Arcane | research: arcane_basics |
| Umbral Lecture Hall | Shadow | 2 | ☾1.2 | ⦿60 ☾10 | Shadow | research: shadow_basics |
| Crypt | Shadow | 2 | ☾0.6 | ⦿90 ☾20 | Shadow (Necro) | research: necromancy_1 |
| Greenhouse | Nature | 2 | ❦1.0 | ⦿60 | Nature | research: nature_basics |
| Solar Chancel | Light | 2 | ☀1.0 | ⦿70 | Light | research: light_basics |
| Alchemy Lab | Alchemy | 2 | ⚗0.8 | ⦿80 | Alchemy | research: alchemy_basics |
| **Grand Library** | Utility | 2 | ◈ + student cap? no → ◈ yield, +cap via upgrade | ⦿100 | — | research: theory_1 |
| **Dormitory** | Utility | 2 | +beds (cap) | ⦿80 | — | start |
| **Refectory** | Utility | 1 | +morale, enables upkeep | ⦿60 | — | research: welfare |
| **Vault** | Utility | 1 | +gold storage & +gold/s | ⦿120 | — | research: endowment |
| **Sanctum** | Light | 2 | +morale, −mishap chance | ⦿280 ☀50 | Light | research: sanctum_1 |
| Moonlit Garden | Ambiance | 1 | morale +0.12 | ⦿150 ❦60 | — | research: nature_basics |
| Statue of the Founder | Ambiance | 1 | morale +0.06, Renown +% | ⦿250 | — | research: repute |
| Portal Nexus | Arcane | 3 | mana conversion | ⦿ big ✦ big | — | research: spatial_2 |

## Student races & traits (idle modifiers)
| Race | Perk | Quirk |
|---|---|---|
| Human | balanced; +5% Renown on grad | — |
| Elf | +learning speed | slower arrivals (picky) |
| Vampire | ×2 Umbra output while studying | −morale nearby (Frail) |
| Werewolf | −disruption (fewer bad events) | volatile skill gains |
| Deepfolk | +Contract power (sturdy on expeditions) | slower learning |
| Half-orc | +gold (tuition) | −Light affinity |

Trait examples (roll 0–2 per student): *Diligent* (+learn), *Gifted* (+all skills), *Aloof* (−morale
contribution), *Bully* (gate for some Futures, −morale), *Prodigy* (rare, big learn), *Frail*, *Loyal*
(chance to become faculty on grad).

## Faculty (candidate archetypes)
| Type | Effect | Salary/s |
|---|---|---|
| Professor (per school) | +teach% and +that-school mana% in assigned room | ⦿5–12 (by quality) |
| Mentor | +10% learning (global) | ⦿6 |
| Priest | +morale, +Lumen% | ⦿6 |
| Steward | −mishap chance, +upkeep efficiency | ⦿8 |
| Archmage (rare) | big single-school teach + mana | ⦿12+ |

Quality ★–★★★★ scales effect and salary; pool refreshes with Renown; reroll costs gold.

## Research — "Spell Theory" (starter nodes)
| Node | Trunk | Cost | Effect | Prereq |
|---|---|---|---|---|
| arcane_basics | Arcane | ◈40 | unlock Arcane Atheneum; ✦ ×1.2 | — |
| shadow_basics | Shadow | ◈40 | unlock Umbral Hall; ☾ ×1.2 | — |
| nature_basics | Nature | ◈60 | unlock Greenhouse, Moonlit Garden | theory_1 |
| light_basics | Light | ◈60 | unlock Solar Chancel | theory_1 |
| alchemy_basics | Alchemy | ◈60 | unlock Alchemy Lab; scrolls | theory_1 |
| theory_1 | Neutral | ◈30 | unlock Grand Library | — |
| welfare | Neutral | ◈50 | unlock Refectory; morale cap + | theory_1 |
| endowment | Neutral | ◈80 | unlock Vault; +gold storage | theory_1 |
| necromancy_1 | Shadow | ◈120 ☾30 | unlock Crypt; revenant cap +1 | shadow_basics |
| necromancy_2 | Shadow | ◈900 ☾200 | ☾ ×1.5; Bone Choir room | necromancy_1 |
| sanctum_1 | Light | ◈150 | unlock Sanctum; morale cap + | light_basics |
| discipline | Shadow | ◈100 | −disruption; +learn in Shadow rooms | shadow_basics |
| spatial_1 | Arcane | ◈200 ✦40 | +Grounds slots | arcane_basics |
| spatial_2 | Arcane | ◈700 ✦150 | unlock Portal Nexus (conversion) | spatial_1 |
| repute | Neutral | ◈120 | unlock Statue; Renown ×1.1 | theory_1 |

## Futures (graduation outcomes)
| Future | Requirements | Reward |
|---|---|---|
| Hedge-Mage | any school ≥ 15 | +8 ★, small boon |
| Battlemage | Arcane ≥ 40 | +18 ★, strong Contract-runner (high dispatch power) |
| Healer | Light ≥ 35 | +15 ★, +morale, boosts restoration Contracts |
| Artificer | Alchemy ≥ 35 | +15 ★, +gold patron |
| Beastwarden | Nature ≥ 35 | +15 ★, +Verdant patron |
| Necromancer | Shadow ≥ 40 & Alchemy ≥ 15 | +22 ★, leaves a revenant |
| Assassin | Shadow ≥ 35 & trait Bully | +20 ★, elite on risky Contracts, big one-time gold |
| Lich (rare) | Shadow ≥ 60 & Vampire/Deepfolk | +40 ★, permanent ☾ patron |
| Diplomat | Renown-favored + any ≥ 30 | +25 ★, +Renown mult, better Contract terms |
| Archmage (rare) | two schools ≥ 50 | +50 ★, chance → faculty |

## Contracts (starter board — doc 01 §3.6)
Opt-in petitions from the world. Act I: fulfill yourself. Act II: dispatch students/graduates (they stop
producing mana while away). Ignoring the board costs nothing.
| Contract | Needs | Time | Reward |
|---|---|---|---|
| Ward a Barn | Light 10 **or** self (⚡+☀) | 2m | ⦿60 ★4 |
| Chase Off Crows | any student | 1m | ⦿30 ★2 |
| Cleanse the Old Well | Light 30 or 2 students | 4m | ⦿240 ★18 +moonpetal |
| Royal Tonic (rush) | ⚗60 self-brew | 2m | ⦿180 ★8 |
| Escort a Caravan | combat pwr ≥ 40 | 8m | ⦿500 ★30 |
| Tame a Wyvern | Nature 40 + risk | 10m | ⦿700 ★40 +beast egg |
| Recover the Sunken Codex | Arcane 45 + risk 30% | 12m | ⦿900 ★50 **+Charter** |

Rewards scale with Renown/research; rare mats feed scroll/potion crafting; some contracts grant a Charter,
blueprint, or rare student. `risk` = chance of partial payout, reduced by dispatched skill & Lumen.

## Era Doctrines (starter — see doc 03 for the fantasy)
Age of Shadow · The Lean Years · Prodigy Cohort · Endless Enrollment · Ivory Tower · Convergence · Guild Charter.

## Founder Archetypes (starter)
The Alchemist · The Necromancer · The Diplomat · The Elementalist · The Archivist · The Adventurer.

## Choice events (starter flavor)
| Event | Options (effect) |
|---|---|
| Hooded Merchant | Buy relic (⦿ → permanent room boon) · Haggle (RNG) · Refuse |
| Student Scandal | Expel (−1 student, +morale) · Cover up (⦿ cost) · Ignore (−morale, risk) |
| Ley Tremor | Brace (⚡ cost, no loss) · Ride it (RNG mana burst or room damage) |
| Rival Academy | Compete (Renown race) · Poach faculty (⦿) · Ignore |
| Guild Envoy | Sign charter (grants Charter for Founding, +standing) · Negotiate (⦿ better terms) · Decline |
| Gifted Orphan | Admit (rare Prodigy student) · Decline (+small gold) |
| Mishap: Botched Experiment | Clean up (⦿ or ⚡) · Let it slide (−morale, temp) · Study the mess (RNG Insight) |

## Achievements (sampler — each grants a tiny permanent mult)
The Spark (learn a first cantrip) · A Roof of One's Own (build a lair) · **The Founding** (found an academy) ·
First Graduate · Full House (hit student cap) · Ten Contracts · One-School Wonder · First Ascension ·
Ascend 5× · Found a 2nd Archmage · Council of Three · Fill the Codex 50%.

## Challenges (sampler — unique unlocks on completion)
Monastic (≤3 rooms) · **The Recluse** (never found an academy — stay a lone hedge-mage) ·
Speedrun (<30 min to Ascension) · Single-School · No-Faculty · Rags (found with minimal gold ever banked).

---
*All of the above compiles down to typed arrays in `src/content/`. Adding a room, node, future, doctrine,
or event is a data edit — no engine changes (doc 05 §5).*
