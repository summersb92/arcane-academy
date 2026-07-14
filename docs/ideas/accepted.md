# Accepted Ideas (add these)

From the [roundtable](roundtable.md). **Consensus (3/3)** and **majority (2/3)** both pass. Referee notes
scope the contested majority calls so they respect the dissenting designer's concern. Not yet folded into
the canonical design docs (04/09/10) — that's the next step, per-idea vetoable.

---

## MAIN SCREEN

### ✅ Consensus (3/3)
- **M1 · Slot Overclock** — a per-slot dial: pour extra running-cost/s (Stamina or the task's element) for an output/XP multiplier on a diminishing curve; auto-pause is the natural ceiling. *Idle-safe optimization knob.*
- **M4 · Momentum / Rote vs. Attunement** *(Vex+Rook)* — repeating one task builds heat (cheaper/faster) but decays its XP; switching banks that heat as one-time Insight and surges growth. *Grind-vs-diversify, shown on the card.*
- **M6 · Now/Next Slot Rail** — Activity slots as clickable pips; empty pip → "what can I run here?" shortlist; a paused slot shows the blocking-resource glyph. *Surfaces the scarcest early decision.*
- **M7 · Card Payoff Preview** — hover an Available card → ghost progress fill + "per cycle −⚡6 → +⦿5, ~0.8/s net" + affordability. *The single biggest "no mystery math" win.*
- **M8 · Auto-Pause Explained** — a paused card wears a "waiting on ⚡" banner; hover shows the exact resource + recovery estimate. *Turns a silent throttle into a teaching moment.*
- **M9 · Chronicle Filterable Feed** — collapsible, type-colored log (completions, At-N, unlocks, downs) + one-click "pin to Available" the task that just fired. *The "what happened while I was away" payoff.*
- **M10 · At-N Progress Chips** — repeatable tasks show "At 5: +1 ⦿ · 3/5" filling toward the next breakpoint. *Free dopamine from an existing mechanic.*

### 🟢 Majority (2/3)
- **M2 · Adjacency Synergies** *(Vex, Rook — Mira dissented)* — draggable Active cards buff neighbors (Fire beside Water cancels the opposition penalty; Research beside labor siphons byproduct to Insight).
  *Referee: keep effects few and surfaced as a badge on the card; make dragging optional (auto-arrange fallback) so it never becomes mandatory micromanagement — that answers Mira. Pairs with S2.*
- **M5 · Contract Ledger** *(Mira, Rook — Vex dissented as anti-cozy)* — hold several timed contracts at once; matching elemental tasks fill them faster.
  *Referee: deadlines must be generous & pausable, framed as cozy "petitions," never a doom clock — that answers Vex. It's the "hold several at once" layer over the existing Contract task type (doc 10).*
- **M14 · Chronicle Writes Back** *(Vex, Mira — Rook self-cut as redundant)* — the log occasionally emits a "hook" that spawns a limited, expiring bonus card in Available.
  *Referee: make it rare and opt-in — the flavor layer on top of M9's feed; ignoring it costs nothing.*

---

## SKILL PROGRESSION

### ✅ Consensus (3/3)
- **S2 · Opposition Tax & Reconciliation** *(Vex+Rook)* — deep investment in one element raises cost / slows its opposite; owning both sides reveals hidden "reconciliation" nodes; Prismatic requires paying the tax. *Bakes the element pairs into the tree itself.*
- **S3 · Mastery Overflow** — XP past a skill's Max converts to Mastery points that raise soft caps / bank toward prestige. *No wasted numbers; clean prestige feed.*
- **S6 · "Path to…" Highlighter** — click a locked node → dim all but the cheapest prerequisite chain, with a running Insight total. *Turns DAG paralysis into a plan.*
- **S7 · Effect-First Node Cards** — the node panel leads with the concrete before/after from your *actual* current rates. *The "numbers always sourced" pillar.*
- **S10 · Insight Budget Line** — persistent "◈ 1,900 (+9/s) · next affordable node in ~3m." *Quiet, honest idle pacing.*
- **S13 · Forgetting Rites (respec)** — unlearn a node for partial Insight; it leaves a "scar" that permanently cheapens re-learning it (and slightly boosts a random adjacent node). *Convenience that generates depth.*
- **S14 · Prismatic Keystone** — the capstone isn't bought; it auto-ignites the instant all six element branches hit tier II, with a flourish. *An earned, unmissable "you did it."*

### 🟢 Majority (2/3)
- **S1 · Empowered Loadout** *(Vex, Rook — Mira dissented as fiddly)* — some nodes drain ◈/s to stay "empowered," limited number lit at once → a live, re-swappable loadout.
  *Referee: present it as a small "Attunements" panel with a few explicit slots (not constant fiddling); default-ignorable — answers Mira.*
- **S4 · Cross-Branch Hybrids** *(Mira, Rook — Vex dissented as redundant)* — hidden nodes appear only when you own prereqs in two branches (Scribing+Fire → "Ember Runes").
  *Referee: **reveal** the hybrid node once both prereqs are owned (not a wiki-only secret) — Mira's condition. Keep the count small so it doesn't become a third web (Vex's worry).*
- **S8 · Branch Progress Ribbons** *(Vex, Mira — Rook dissented as "a stat, not a decision")* — each branch tab shows an owned/available/locked ribbon (Elementalism 7/12).
  *Referee: accepted as cheap orientation UI — it's QoL, not a mechanic; Rook judged it as a mechanic.*

---

## SPELL CRAFT

### ✅ Consensus (3/3)
- **C2 · Multi-Component Composition** — allow a 2nd/3rd Component at rising essence cost with interaction rules (Siphon+Rend = "Devour"; same-family conflicts misfire). *The combinatorial sandbox.*
- **C5 · Prismatic Ratio Lock** — Prismatic spells demand a specific six-essence ratio at cast time; Home fixtures + an "elixir of balance" dial the mix. *Ties Prismatic to Home, Potions & essence gen.*
- **C6 · Live Composition Readout** — dropdowns instantly update name / cast cost / effect / inscribe cost; unaffordable essence shown red. *Composing feels like play, not a form.*
- **C7 · Part Glossary Chips** — each Component/Shape carries a one-word plain-language tooltip, shown inline the first few times. *Onboards jargon at the point of choice.*
- **C8 · Prismatic Readiness Gauge** — the locked Prismatic entry shows a six-segment "5/6 — Water low" gauge instead of a flat 🔒. *Beckons instead of denying; feeds C5.*
- **C9 · Inscribe-as-Main-Task Toast** — clicking Inscribe shows "started in Main: Inscribe Umbral Bolt (50s)" with click-through. *Keeps the two-screen model coherent.*
- **C10 · Known-Spell Cast Affordability** — gray out spells you can't currently pay Mana for; show "✦18 / 210" inline. *The catalog always tells the truth.*
- **C13 · Word Roots / Runic Prefixes** — a 4th composition slot of prefixes ("Twin-", "Echoing-") that mutate the auto-generated spell name and its numbers. *Player-coined names = cheap, deep ownership.*

### 🟢 Majority (2/3)
- **C3 · Stability vs. Overload** *(Vex, Rook — Mira dissented as a punish)* — each spell has a Stability rating from your skills; overloading risks a miscast.
  *Referee: a miscast should **fizzle** (partial/refund), never "vent/steal" essence — that answers Mira's "the game ate my resources." Reframe as reliability tuning, not loss.*
- **C4 · Resonance Chains** *(Vex, Rook — Mira dissented as active-timing)* — casting in sequence builds a resonance meter (same-element stacks, opposites fizzle + refund Mana, off-axis unlock combos).
  *Referee: scope to the **active Bestiary/hunt casting layer**, not the idle loop — it enriches manual casting, optional; never required to idle. Answers Mira.*
- **C11 · The Grimoire is your Loadout** *(Vex, Mira — Rook self-cut as drag-on-text)* — inscribed spells occupy a limited page budget; spells facing each other on a spread grant adjacency bonuses.
  *Referee: implement as selectable page **slots** (no literal dragging), keeping it text-friendly — answers Rook's own objection.*
- **C15 · Prismatic is a Chord** *(Mira, Rook — Vex dissented as spectacle)* — a Prismatic cast fires whichever six single-element spells you've slotted, simultaneously.
  *Referee: accepted **composed with C5 + C8** — you must curate six good single-element spells **and** meet the ratio lock, so it carries a real build decision, not just fireworks. That directly answers Vex.*

---

### Cross-cutting referee note
The consensus set is dominated by **legibility/QoL** (M6–M10, S6/S7/S10, C6–C10) — cheap, high-value, and
safe to build early (fits roadmap M4–M5). The majority set adds the **depth/identity** layers (M2, S1/S2/S4,
C2–C5/C11/C13/C15) — all accepted with the scoping notes above so depth never costs the cozy/idle-first
pillar. Suggested next step: fold the consensus QoL items into **doc 04/10** and the mechanics into
**doc 09/10** on your go-ahead.

---
---

# ROUND 2 (Fable) — Accepted

From [roundtable-2.md](roundtable-2.md). R2 ideas mostly *compose existing systems together*; IDs are R2's
own (no relation to round 1 IDs).

## MAIN SCREEN (R2)

### ✅ Consensus (3/3)
- **R2-M3 · Internalization** — a task at its final "At N" tier can be **retired forever** into a small
  permanent slotless passive. *Grind terminates in infrastructure; the board prunes itself.*
- **R2-M4 · Understudy Assignment** — post-Founding, attach a student to an Active card: task multiplier +
  the student earns XP toward that tag's Future; graduation leaves a permanent "taught" bonus on the card.
  *The Act I↔II bridge — your daily choices shape who your students become.*
- **R2-M6 · Night Watch** — a "before you go" forecast of the Active set: when each slot will auto-pause,
  the total you'll wake up to, one-click suggested swap. *The anti-FOMO bedtime feature.*
- **R2-M8 · Heartbeat Strip** — a slim always-visible strip under the tabs on every tab: slot progress pips
  (paused pips wear their blocking glyph); click to jump. *Cross-tab coherence in 24px.*
- **R2-M9 · Deep Grooves (Heirloom Tasks)** — tasks track **lifetime** completions across the Archmage
  Roster; at milestones the card earns an epithet ("Stables, Ancestral") and starts new runs pre-warmed a
  few At-N steps. *Prestige polishes the humble card smooth.*
- **R2-M12 · Journeyman's Fork** — at big At-N milestones (25/100) a one-time either/or specialization
  (Efficient −length vs. Bountiful +output) stamps a suffix on the card's name. *Your Smith ≠ anyone else's.*

### 🟢 Majority (2/3)
- **R2-M1 · Seasoned Slots** *(Mira dissented: invisible state, punishes rearranging)* — Activity slots
  accrue permanent affinity XP for the element/tag they run most; growing multiplier for matching tasks.
  *Referee: affinity is bonus-only (mismatches are never penalized) and shown visibly on the slot pip
  (composes with R1's Slot Rail).*
- **R2-M5 · Morning Ledger** *(Vex dissented: redundant with Chronicle)* — offline return opens one curated
  interstitial (3 headline gains, what paused & why, one suggested action), then folds into the Chronicle.
  *Referee: it's a skin over Chronicle data — dismissible, optional; pairs with UI-U18.*
- **R2-M7 · Deal Me In** *(Vex dissented: theater)* — new Available cards deal in one at a time with a
  flavor beat + "new" sheen, throttled in the first session. *Referee: presentation-only pacing; never
  delays actual availability more than a beat; settings toggle.*
- **R2-M10 · Familiar Foremen** *(Vex dissented: duplicates M4)* — a tamed Bestiary creature assigned to one
  task as a slotless phantom worker at reduced rate, with personality quirks in the Chronicle.
  *Referee: per Rook's merge note — one "assistant on a card" framework; familiars pre-Founding, students
  (R2-M4) post-Founding. That answers the duplication.*
- **R2-M11 · The Archmage Still Sweeps** *(Mira dissented: grid clutter)* — obsolete early tasks re-unlock
  post-Founding as "Humility" variants with new outputs (Renown, student morale). *Referee: few in number
  and behind a tag/filter so the grid stays clean.*

## SKILL PROGRESSION (R2)

### ✅ Consensus (3/3)
- **R2-S2 · Palimpsest Tree** — after Ascension, previously-owned nodes show as **discounted echoes**;
  never-owned nodes carry a one-time **first-discovery rebate**. *Comfort route and virgin route both pay,
  differently — replay as route-planning against your own history.*
- **R2-S6 · Study Intent** — bookmark exactly one locked node: the budget line counts down to *it*, the
  path stays lit, gentle chime when affordable (auto-learn toggle, off by default). *A promise to come back to.*
- **R2-S7 · Ripple Receipt** — on buying a node, every affected task card glows once with its new numbers;
  the Chronicle logs the concrete deltas. *Closes the honesty loop R1's Effect-First opened.*
- **R2-S8 · Index of Studies** — an alternate linear list view of the whole web (owned / affordable / next,
  plain text), keyboard & screen-reader friendly; default on narrow screens. *The accessibility floor.*
- **R2-S10 · Unbroken Thread** — at Ascension pass exactly **one** node to your successor as an Heirloom
  that compounds +1% per consecutive generation and accrues a lineage name. *A story told in a stat — with a
  streak you can break.*
- **R2-S11 · Witnessed Lore** — price-less nodes that **auto-ignite from lived experience**, trigger shown
  up front ("get Downed by a Frost Wyrm → Lesson of the Ice"; "50 contracts → The Common Touch"). *The
  game's only failure state becomes a teacher.*

### 🟢 Majority (2/3)
- **R2-S4 · Lore Sockets** *(Mira dissented: second loadout system)* — Bestiary study milestones award Lore
  fragments that socket into matching skill nodes as swappable permanent modifiers. *Referee: sockets stay
  scarce (2–3) and fragments few — it's the Bestiary→Skills payoff, not another web.*
- **R2-S5 · Candlelight Reveal** *(Vex dissented: can't plan through fog)* — the web starts as one lit
  cantrip and blooms outward; the ring beyond shows as silhouettes. *Referee: fog is visual only —
  silhouetted nodes remain searchable and fully visible via Path-to (R1) and the Index (R2-S8).*
- **R2-S9 · Teacher Learns Twice** *(Rook self-cut into it)* — set an owned node as curriculum; students
  studying it earn it "Pedagogy" pips that raise its effect, capped per run. *Referee: the surviving
  teaching-cluster winner — absorbs S3's kernel (drop the tithe bookkeeping; keep the visible pips).*
- **R2-S12 · Marginalia** *(Vex dissented: exploitable sticker)* — a node pushed deep into Mastery Overflow
  unlocks a one-sentence player annotation; annotated nodes gain a small bonus; all annotations compile into
  an exportable "Treatise." *Referee: bonus is fixed & trivial — the Treatise is the reward; answers Vex.*

## SPELL CRAFT (R2)

### ✅ Consensus (3/3)
- **R2-C2 · Hearth-Binding** — an inscribed Aura/Ward spell can be **installed into a Home fixture slot**
  instead of cast: combat numbers map deterministically to passive economy; opportunity cost only, no drain.
  *A battle-ward becomes furniture — Spell Craft talks to Home. (Fold C11's coined-name plaques into its
  fixture labels, per Rook.)*
- **R2-C7 · Margin Notes** — when a draft resembles a known spell, show the side-by-side delta ("vs. your
  Umbral Bolt: +3 dmg, +✦2") and offer "overwrite that page?". *Answers the question players actually ask;
  keeps the page-budget Grimoire from silting up.*
- **R2-C8 · Incantation Line** — render the composer as a tappable fill-in-the-blank sentence — "Inscribe a
  [Twin-] [Dark ☾] [Bolt] that [Siphons]" — chips open pickers; the name assembles as you speak it. *The
  text pillar, embodied; scales to a phone.*
- **R2-C9 · The Long Name** — cast-count milestones grant a spell free extra Word-Root slots; veteran spells
  accrete ever-longer names ("Twin-Echoing Umbral Bolt"). *Ownership that compounds; composes with R1 Word Roots.*
- **R2-C10 · Wyrmwords** — Bestiary Study rank 3 teaches a Component/Shape only that creature could teach,
  stamped with the beast's glyph in the composer. *Hunt for language, not loot.*

### 🟢 Majority (2/3)
- **R2-C1 · Trophy Reagents** *(Mira dissented: slot cockpit)* — an optional Reagent slot at inscribe
  accepts rare Bestiary drops, adding a creature-derived rider and marking the spell as a counter to that
  family. *Referee: the slot is collapsed by default and appears only after your first rare drop.*
- **R2-C3 · Catalyzed Inscription** *(Rook dissented: double-dips C1)* — spend Materials as consumable
  catalysts at inscribe to permanently bend that copy's curve (Gem −cost, Rune +Stability, Dust +echo).
  *Referee: C3 = generic numeric catalysts, C1 = creature-story riders — distinct, but share ONE "additives"
  UI section so the composer never becomes a cockpit.*
- **R2-C5 · Your First Word** *(Mira self-cut it as "just a tutorial")* — a guided first composition:
  Element preset, Shape fixed, you choose only the Component; the game speaks the name back as a ceremony.
  *Referee: implement as the Incantation Line's first-run state — exactly Mira's own suggestion.*
- **R2-C6 · Chalk Trace** *(Vex dissented: readout already tells all)* — cast an uninscribed draft once at
  reduced power against a practice mark for token Mana. *Referee: kept for behavior-feel (procs, riders)
  that a stat line can't convey; one small "practice" button in the composer.*
- **R2-C12 · The School Spell** *(Rook self-cut C4 into it)* — slot one inscribed spell as the academy's
  Signature Curriculum: matching students study faster, recitals appear in the Chronicle, student practice
  feeds its cast-count while you're away. *Referee: absorbs Thesis Defense's per-spell-Mastery kernel — ONE
  teaching-a-spell system.*

---
---

# UI PANEL — Accepted (Serif × Flux)

From [roundtable-2.md](roundtable-2.md). Rule: 2/2 add; splits refereed. All motion respects
`prefers-reduced-motion`; everything is plain CSS/JS on the static site.

### ✅ Unanimous (2/2)
- **U1 · Rescue the faint tier** — add a `--label` token (≈4.6:1 contrast) for section headers/tags;
  reserve `--faint` for decoration. *(The current `--faint` fails contrast on all the words that name the zones.)*
- **U2 · Break the gold/light/stamina hue collision** — `--stam` is byte-identical to `--gold` and `--light`
  is a notch away; give ⚡ / ⦿ / ☀ unmistakably distinct swatches.
- **U3 · Element glyph on the card edge** — render the element glyph in a small gutter atop the coloured
  left edge, so cards are colorblind-safe (the design's own stated promise).
- **U4 · Honest rate signs** — colour rates by sign (+green / −amber), always show `+`/`−` and `/s`
  uniformly across both side panels.
- **U5 · Focus-visible layer** — `:focus-visible` rings on tabs/cards/buttons + numeric prefixes (1–9) in
  tab labels. *(A "keyboard-first" spec with no visible focus is fiction.)*
- **U6 · Right-aligned number column + 4-step type scale** — two-column grid rows with right-aligned
  tabular values; collapse the 13.5/12.5/12/11.5/11 px ramp to 14/12.5/11/10.
- **U7 · Time-remaining on active meters** — a right-aligned "· 7s" readout keyed to the progress fill.
  *(Both designers independently called this the best idea on the ballot.)*
- **U8 · Prismatic balance mini-chart** — a compact six-cell bar under the Essence header showing
  normalized balance; the game's convergence goal at a glance.
- **U10 · Card commit-pulse + FLIP move** — 160ms edge-coloured flash on click; the card animates from
  Available into Active (FLIP). Reduced-motion: instant reparent, keep the flash.
- **U14 · At-N milestone moment** — gold ring pulse + temporary "★ At 15!" chip; visibly rarer/bigger than a
  normal completion. *(Rarity encoding, not juice.)*
- **U15 · Auto-pause "held-breath"** — `.paused`: ~70% desaturate, dashed left edge, "⏸ waiting: ⚡" chip;
  smooth resume. *(Serif: "best idea on either slate — every pixel is state communication.")*
- **U16 · Unlock reveal** — lock fades out, dim lifts, the requirement line crossfades into cost→output.
  Drop the settle-bounce (per Serif). Grandest version reserved for the Founding card.
- **U17 · The Founding full-frame beat** — one-time gold radial bloom, Academy-tab unlock sweep, large gold
  Chronicle line. "One sanctioned firework per lifetime." Reduced-motion: flash + line.
- **U18 · Welcome-back count-up** — offline yield replays as a capped ~1.2s count-up + dismissible "While
  away…" banner. *(Composes with R2-M5 Morning Ledger.)*
- **U19 · Touch-tuned cards** — ≥44px targets, press-ripple replaces hover on coarse pointers, sticky
  filter bar on narrow widths.

### ⚖ Referee-decided splits
- **U11 · Stepped tick progress → add, scoped.** Keep the per-tick stepped fill (it *encodes the tick
  economy* — informative); **drop the overshoot/brightness garnish** (Serif's objection); completion
  emphasis belongs to U14.
- **U12 · Delta chips + count-up → add, scoped.** Keep the ~300ms count-up on value changes (core idle
  feel); **chips only for discrete windfalls** (task payouts, offline return) — never per-tick income, which
  answers Serif's "chartjunk echo."
- **U13 · Chronicle slide-in → add, reduced.** Both effectively converged: **drop the card scale-pulse**
  (duplicates U11); keep the new-log-line slide-in + highlight sweep as a detail of U14/U17.

---
---

# ROUND 3 — The Longevity Council (Kittens Game × Evolve) — Accepted

From [roundtable-3.md](roundtable-3.md). Every idea cites its source mechanic in the studied games.

## ✅ Consensus (3/3)

### Economy & systems
- **K1 · Brimming Vessels** *(KG: caps & storage)* — visible per-resource caps raised by storage fixtures;
  income past a full cap **condenses at ~10%** into a rarer "distilled" form used by top recipes. *Caps
  drive decisions; the condensation valve keeps away-time cozy. Scope (Atlas): one distilled form per
  resource family.*
- **K2 · The Golden Proportion** *(KG: price ratios)* — every repeatable purchase prints its cost-growth
  ratio ("×1.15/ea"); rare Aeon meta-nodes permanently **bend ratios down** game-wide. *The genre's most
  exciting purchase, made honest math.*
- **K5 · Terms & the Almanac** *(KG: seasons)* — multi-hour academy Terms with a **bonus-only** emphasis
  (+X% to one element/tag, never a penalty), forecast in an Almanac panel that Night Watch reads.
  *Referee (2:1): the **player-chosen** emphasis variant — a calendar that rotates without you edges FOMO.*
- **K6 · Lineages of the Roster** *(Evolve: species)* — each new Archmage drafts 1-of-3 rolled Lineages
  bundling a perk, a **real flaw**, and a quirk that rewires which Act I tasks are efficient. *Runs diverge
  at minute one. Absorbs K15's spark-variant kernel (which element wakes first can be a quirk axis).*
- **K16 · Founding Sites** *(Evolve: planets)* — each Ascension offers a draft of Sites for the next
  academy (Grounds capacity, room costs, one ambient essence bias); Sites collect in the Codex. *New
  terrain re-prices old build orders with zero new content.*
- **K25 · Grand Works** *(Evolve: ARPA)* — post-Founding mega-projects built in purchasable **increments**
  (1%/10%/25% segments) with persistent progress bars. *Any session length moves the monument; the long-arc
  bar between "next node" and "next Ascension."*

### Pacing
- **K11 · Doors in the Dark / Tabs-as-Eras** *(KG: the unfold)* — the tab rail starts with **only Main**;
  every tab is absent until its inciting beat summons it with a one-line ceremony — except **Academy**,
  visible-but-greyed all Act I as the single beacon. *The rail is the game's progress bar.*
- **K12 · Named Thresholds** *(KG: walls)* — 3–4 deliberate, telegraphed walls in Act I/early II, each a
  named card answerable only by adopting the newest system, stating what *kind* of answer it wants. *Walls
  that teach are chapters; walls that stall are paywalls.*
- **K13 · The Astronomer's Counsel** *(KG/Evolve: reset-timing wikis)* — an honest in-game advisory:
  current Aeon/hour vs projected fresh-run Aeon/hour, with a gentle in-world line when the curves cross.
  *Puts the genre's most important decision in the game instead of on a wiki.*
- **K17 · The Queue (merged K10+K17)** *(Evolve: build queue)* — **one queue idiom, two lanes**: each
  Activity slot holds 2–3 queued follow-on tasks ("then: Smith" + ETA on the pip), plus a purchase lane
  that auto-buys queued Limited upgrades/fixtures when affordable. Night Watch reads the whole docket.
  *Turns a 2-minute check-in into 40 minutes of intent.*
- **K19 · The Ledger Speaks** *(KG: flavor prose)* — magnitude prose that re-describes as numbers grow
  ("a pouch of coin" → "a vault the mice whisper about"); the mage's title line quietly upgrades. *The
  UI's language gets a progression curve; zero mechanics.*

### UI / information architecture (the tab-set verdict)
- **K20 · Satchel** *(KG: sub-tabs)* — merge Equipment + Potions into one **Satchel** tab (Gear/Potions
  sub-tabs). *Trims the rail; rehearses the sub-tab pattern.*
- **K21 · Player Tab Dissolves** *(KG: the column is the interface)* — the right Character panel expands
  into the full sheet (attributes, resistances, titles) as a drawer; **retire the Player tab**.
- **K22 · Academy Sub-Tab Row** *(KG/Evolve: sub-tabs)* — a real second-level tab row (Halls · Students ·
  Faculty · Contracts · Ascension), each sub-tab unlocking as the institution grows.
- **K23 · Caps in the Left Column** *(KG: resource column)* — show `amount / cap`, amber at ~90%, dim the
  +rate at cap; Storage tasks are the visible cure. **Includes K24 as a clause:** a `*` marker on any cost
  that **exceeds current caps** ("◈2,400\* — exceeds Insight Max"), hover names the cap-raising task.
- **K26 · Every Noun is a Codex Link** *(Evolve: in-game wiki)* — any resource/creature/term in a tooltip
  or Chronicle line is tappable → opens that Codex entry in place, breadcrumb back. *The explanation is
  always one tap from the confusion.*
- **K27 · Notation & Density** *(Evolve: settings)* — number-notation choice (1.9K / 1,900 / 1.9e3) and a
  compact-density toggle, persisted to the save.

**Resulting tab set** (consensus direction, pending integration): `Main · Skills · Home · Spell Craft ·
Satchel · Bestiary · Academy` — 7 tabs, appearing one by one; Player → Character-panel drawer; Codex &
System in the header.

## 🟢 Majority (2/3)
- **K3 · The Wispery** *(KG: unicorns — Atlas dissented: tab sprawl)* — a self-contained devotional
  side-chain (tame Spirit Wisps → Motes; release batches at a Shrine → Glimmer Tears → shrine tiers →
  Seraph Wisps → late Ascension bonus). *Referee: lives **inside an existing tab** (Home, or an Academy
  sub-tab post-Founding); one screen, no new tab, one new resource pair — answers Atlas.*
- **K8 · The Sworn Run (Vows)** *(Evolve: challenge genes; KG: Iron Will — Tempo dissented: redundant with
  roadmap Challenges)* — opt-in Vows declared at Ascension constraining the next run, multiplying Aeon
  payout, each unlocking a Vow-exclusive Doctrine. *Referee: this **is** the implementation spec for the
  roadmap's M7 "Challenges" — an upgrade to planned content, not a parallel system. That answers Tempo.*
- **K24 · Star of Insufficient Capacity** — accepted as a **clause of K23** (see above), per Atlas's own
  self-cut; Marrow and Tempo both endorsed the mechanic itself.

*(K10 was accepted by merger into K17 — recorded there.)*
