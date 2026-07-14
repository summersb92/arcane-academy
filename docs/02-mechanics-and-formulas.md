# 02 — Mechanics & Starter Formulas

Concrete, tunable math for a first playable build. All constants are **starting guesses** meant to be
balanced later; they live in data tables (doc 05) so tuning never touches logic.

## 1. The tick

- Simulation runs on a **fixed timestep**: `TICK = 0.1s` (10 ticks/second) via an accumulator, so the
  economy is deterministic regardless of frame rate.
- The UI reads state and re-renders on a throttled cadence (~4–10 Hz) — decoupled from the sim.
- **Offline progress:** on load, `elapsed = now - lastSaved`, clamped to `OFFLINE_CAP` (default **12h**,
  raisable via meta-tree). Simulate in coarse **1s** steps (or closed-form where possible) and show a
  "While you were away…" report. Offline efficiency starts at **100%** for pure generation; **Contract
  timers advance** and complete offline, but **choice-events are deferred** to the first online tick (so you
  never miss a decision). No offline losses.

> **Terminology (post-pivot):** in the formulas below, `school` now means **element** (Fire/Water/Earth/
> Air/Dark/Light/Prismatic, doc 09) and typed `mana` means **essence**. `Mana` as a vital is the general
> casting pool. Variable names will be renamed `element*` in code.

## 2. Room / generator production

For a generator `g` (a room in Act II, or your **person + lair** in Act I) at level `L`:

```
baseYield(g)          // per-second at L1, per resource, from data table
levelMult(L)     = LEVEL_GROWTH ^ (L - 1)          // LEVEL_GROWTH ≈ 1.15
facultyMult(g)   = 1 + Σ(assigned professor bonuses)   // Act I: your own skill instead
moraleMult       = f(global morale)                // see §5
schoolMult(s)    = product of research/meta multipliers for school s
studentMult(g)   = 1 + STUDENT_YIELD * (students studying in g, weighted by skill)   // Act I: 1

yield(g, res) = baseYield(g,res) * levelMult(L) * facultyMult(g)
                * moraleMult * schoolMult(school(g)) * studentMult(g)
```

Total per-resource rate = Σ over all generators + flat sources (meta, events, patrons) − upkeep drains.

### Upgrade cost
```
cost(g, L→L+1, res) = baseCost(g,res) * COST_GROWTH ^ L        // COST_GROWTH ≈ 1.6–1.9
```
Geometric cost (`~1.7`) vs. geometric yield (`1.15`) ⇒ each level returns less per gold, so growth comes
from *unlocking new rooms/tech*, not spamming one room. Healthy idle pacing.

### Grounds capacity (Act II spatial budget)
```
usedSlots = Σ room.size
maxSlots  = siteBaseSlots + Σ(capacity research) + Σ(meta capacity)
```
Ambiance rooms cost slots too — decoration vs. production is a real trade. Your **Site** (bought at the
Founding) sets `siteBaseSlots`; a bigger site later is a major Gold sink.

## 3. Act I — the Origin Arc math (doc 08)

- **Labor (Phase 1):** `gold/s = LABOR_RATE * (1 + laborUpgrades)`; an active "work a double" spends
  `WORK_STAM` Stamina for a `WORK_BURST` Gold lump on a short cooldown.
- **Spark trigger:** unlocks when `gold ≥ SPARK_GOLD` **or** a scripted timer elapses (whichever first) —
  guarantees Phase 2 arrives even for a purely idle player.
- **Study (Phase 2):** `insight/s = STUDY_RATE * moraleMult`; cantrips are cheap research nodes (§4) that
  each open a mechanic or an essence trickle `= CANTRIP_TRICKLE` for that element.
- **Founding gate (Phase 3→Act II):** the **Found** action lights up when
  `gold ≥ FOUND_GOLD  AND  renown ≥ FOUND_RENOWN  AND  hasCharter  AND  hasSite`.
  Founding spends the Site cost, converts the lair to room #1, and flips `state.act = 2`.

## 4. Research (Insight) — cantrips → the web

- One DAG. The first ~4 nodes are the Act I **cantrips**; the rest are the Act II trunks. A node is
  available when prerequisites are owned and you can pay.
- `cost = node.insight (+ optional mana)`. One-time purchase; effects permanent for the run (unless a
  repeatable "study" with `cost *= REPEAT_GROWTH ^ owned`).
- Effect types: `unlockRoom`, `unlockSpell`, `unlockFuture`, `unlockContract`, `mult(school|resource|global, x)`,
  `add(capacity|slots|cap)`, `openSchool`, `unlockMechanic(...)`. Data-driven.

## 5. Morale & Mishaps (the only negative pressure)

```
morale = clamp(BASE_MORALE
             + Σ ambianceMoraleBonus
             + refectoryBonus            // food/upkeep coverage
             + lumenComfort              // Light/Sanctum contribution
             - overcrowdPenalty,         // students near cap w/o amenities
             MORALE_MIN, MORALE_MAX)
moraleMult = 0.5 + morale                // morale 0.5 → ×1.0 ; morale 1.0 → ×1.5
```

**Mishaps:** each `MISHAP_INTERVAL`, roll `P(mishap) = clamp(MISHAP_BASE + overcrowd - discipline - lumen, 0, MISHAP_MAX)`.
On a hit, surface a small negative **choice-event** (spend a little to fix, or eat a minor temporary
penalty). Werewolf trait / Steward faculty / Discipline research all lower the chance. Never catastrophic.

## 6. Person / Headmaster: stamina, rituals, spells

```
stamina regen/s = STAM_REGEN * (1 + meta/research bonuses)
stamina max     = STAM_MAX  + bonuses
```
- **Rituals** (toggles): while ON, apply a modifier and drain `cost/s` (stamina and/or mana). Auto-off if a
  resource can't cover the drain.
- **Active spells**: pay a lump `stamina (+mana)` for an instant effect + short cooldown. Examples:
  *Surge* (×3 one school for 30s), *Inspire* (force a queued graduation), *Hasten* (cut a Contract's
  remaining time), *Quell* (cancel a mishap/negative event), *Transmute* (convert mana).
- **Scrolls**: craft with Quintessence (+time); consumable stored effects.

## 7. Contracts (the outside-world objective system)

A contract `c` on the board has: `reqSkills` / `reqMana`, `duration`, `rewards {gold, renown, mats, unlock?}`,
and a `risk` (chance of partial failure, reduced by dispatched skill & Lumen).

```
board refresh: every CONTRACT_REFRESH, or on completion; size scales with Renown & research.
Act I (self):     start → pay reqMana + START_STAM → wait duration → collect rewards.
Act II (dispatch): assign N students/graduates meeting reqSkills → they are BUSY (produce no mana while away)
                   → wait (duration reduced by dispatched power) → collect; small XP to dispatched students.
successChance = clamp(BASE_SUCCESS + dispatchedPower/reqPower * K + lumenBonus, MIN, 0.99)
reward payout  = rewards * (success ? 1 : PARTIAL)
```
Contracts are **opt-in**: an empty board or ignored contracts cost nothing but forgone rewards. Combat/
adventuring Futures contribute the most `dispatchedPower` to dangerous contracts — their reason to exist.

## 8. Ascension payout (bridge to doc 03)

```
Aeon gained = floor( AEON_K * sqrt( lifetimeRenownThisRun )
                     * (1 + graduatesThisRun / GRAD_SOFT)
                     * doctrineMult )
```
- Square-root keeps early ascensions rewarding and late ones diminishing (encourages ascending, not hoarding).
- You only *gain* if `Aeon gained > 0`; the UI always previews the exact number before you commit.
- **Act I on repeat runs:** meta-tree "Legacy of Learning" tiers auto-complete or skip Act I (doc 08) so
  ascension-to-academy takes seconds, not the full origin.

## 9. Number formatting
- Start with JS `number` (double) — safe well past 1e15, plenty for MVP.
- Format with a suffix scale: `K, M, B, T, aa, ab, …` (like Arcanum). Toggle scientific notation in settings.
- Isolate arithmetic behind a `BigNum` facade so a later swap to big-number math is contained (doc 05).

## 10. Tunable constants (first-pass, all in `content/config.ts`)
| Const | Value | Const | Value |
|---|---|---|---|
| `TICK` | 0.1s | `LEVEL_GROWTH` | 1.15 |
| `COST_GROWTH` | 1.6–1.9 | `OFFLINE_CAP` | 12h |
| `LABOR_RATE` | 0.2 gold/s | `SPARK_GOLD` | 25 |
| `STUDY_RATE` | 0.3 ◈/s | `CANTRIP_TRICKLE` | 0.05 mana/s |
| `FOUND_GOLD` | ~500 | `FOUND_RENOWN` | ~30 |
| `BASE_ARRIVAL` | 0.5/min | `RENOWN_PULL` | 0.4 |
| `LEARN_RATE` | 1.0/s | `STUDENT_YIELD` | 0.05 |
| `BASE_MORALE` | 0.5 | `MORALE_MAX` | 1.0 |
| `MISHAP_BASE` | low | `MISHAP_INTERVAL` | tune |
| `STAM_MAX` | 100 | `STAM_REGEN` | 2/s |
| `CONTRACT_REFRESH` | tune | `BASE_SUCCESS` | 0.6 |
| `AEON_K` | tune | `GRAD_SOFT` | 25 |

> Everything here is a **starting point**. The whole game is a balancing exercise; the data-driven design
> (doc 05) means balancing is editing tables, never rewriting systems.
