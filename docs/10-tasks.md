# 10 — Tasks (the Main window)

The **Main** window is the **Activity** screen: it shows the **Tasks** your mage is doing and the tasks
available to start. Tasks are the game's core verb — *"actions the player can take that represent what your
wizard will do."* This system is modeled closely on **Arcanum: Theory of Magic**'s Tasks page; the *layout*
and the *type taxonomy* here are meant to be copied faithfully, then re-tuned/renamed for our world later.

> **Status:** structure & types are locked to Arcanum's model on purpose. The specific task list below is a
> first-pass port into our terms (elements, vitals, essence, Home/Academy, Bestiary) and **will be altered**.
> Arcanum-specific concepts we haven't decided on yet (alignment, Tiers, its exact skill list) are flagged.

## 1. What a Task is
An action the mage performs. Every task **consumes** resources and **produces** resources, XP, items, skill
progress, or unlocks. A task is either **continuous** (runs over time, tick by tick, occupying an Activity
slot) or an **instant** one-time action. Tasks unify everything the player *does*: labor, study, gather,
craft, scribe, brew, **hunt** (Bestiary), **fulfil a contract**, rest, and build. (Contracts & Bestiary
hunts from earlier docs are simply task *types* on this screen.)

## 2. The type taxonomy (copy this)
Two top-level divisions, each with sub-types:

### A. Unlimited tasks (repeatable forever)
1. **Instant** — a one-time action with **no length**; pay cost → get output immediately. *(e.g. Clean
   Stables, Scribe Scroll, Sell Gem, Imbue Gem, Focus.)*
2. **Running** — **timed**; has a **Length** (seconds) and typically a per-second running cost; completes,
   pays out, and (if set to repeat) restarts. *(e.g. Smith, Mine, Brew Potion, Hunt, Fulfil Contract.)*
3. **Perpetual** — runs **indefinitely** with no fixed length until you stop it or a cost can't be paid.
   *(e.g. Rest, Study, Meditate, Offer Services.)*

### B. Limited tasks (capped by a **Max** count — these are "upgrades")
4. **Upgrade** — completable a fixed number of times (Max 1…999); usually grants **permanent skill Max/Rate
   raises** or **unlocks** (a tab, a feature, a spell) rather than resources. *(e.g. Bind Spellbook, unlock
   the Bestiary, tool upgrades, "study" cap-raisers, body/transformation perks.)*
5. **Equipment** — craft a piece of gear into your **Inventory** (Equipment tab). *(e.g. forge a Focus, weave
   Robes.)* Often has a cheap "re-make if lost" companion task.
6. **Housing / Building** — upgrade your **Home**, and later **Academy** buildings; trades resources for
   **Floor Space** (room capacity) and unlocks. **The Founding is a Housing task.** *(e.g. Furnish Study,
   Found the Academy, Headmaster Promotion, expand a hall.)*

## 3. Layout of the Main / Activity window — a **card grid**
Every task is a **card**. Cards flow into a **responsive grid** (CSS `grid-template-columns:
repeat(auto-fill, minmax(~186px, 1fr))`), so they reflow to the window width and can be arranged/filtered/
(later) drag-reordered. The Main window has two grids:
- **Active** — the continuous tasks currently running (one per Activity slot); each card shows a **progress
  fill**. Header reads `Active — slots 2 / 3`.
- **Available** — every task you *could* start, with a **tag / type / search** filter bar above the grid.

### Task-card anatomy
**The whole card is the button** — there is *no* Do/Start/Stop button. **Click an Available card to start
(or instantly do) it; click an Active card to stop it.** Cards show a hover/pressed state to signal they're
clickable; locked cards aren't clickable.
```
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│ Smith         [Running·15s]│   │ Study           [perpetual]│   │ 🔒 Found the Academy [Housing]
│ Craftwork · ↻ repeat       │   │ ▓▓▓▓▓▓░░  (progress)       │   │ Max 1 · 0/1                │
│ ⚡0.4/s → ⦿5               │   │ Research · running         │   │ needs ⦿500 ★30 Charter Site│
│  (click card to start)     │   │ ⚡0.2/s → ◈ +0.55/s        │   │            (can't start)   │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
   available — click to start       active (in a slot) — click to stop   locked (requirements shown)
```
A card carries, à la Arcanum: **name · type chip · tag(s) · length (or instant/perpetual) · startup +
running cost → output · repeat toggle ↻**; Limited tasks also show **Max / completed** (e.g. `3/5`) and any
**"At N"** repeat-bonus hint; Active cards show a **progress fill**. A **coloured left edge** encodes the
task's element/tag (Fire ▲ red, Dark ☾ violet, Contract gold, Research blue…). This card format is what lets
tasks be grouped, filtered, and arranged on the grid. *(The repeat toggle ↻ is the one small in-card control;
everything else is the card click.)*

## 4. Mechanics attached to tasks (copy these)
- **Two cost types:** **Startup Cost** (paid once when the task begins) and **Running Cost** (paid every
  tick while it runs). A task can have either or both.
- **Auto-suspend / auto-resume:** if the running cost can't be paid, the task **pauses** and resumes when the
  resource is available again. (No failure — a soft throttle. Stamina/Mana/essence are the usual drains.)
- **Activity slots:** continuous (Running/Perpetual) tasks each occupy one **Activity slot**; slots are
  limited and are themselves a progression axis (some tasks grant **+Max Activity Slots**). Instant tasks
  don't take a slot.
- **Length & repeat:** Running tasks show a **Length** (s). A **repeat toggle (↻)** re-starts on completion.
- **Cooldown:** independent of length; some tasks are short but gated by a cooldown before re-use.
- **Repeat-scaling ("At N"):** completing a task N times permanently improves it — usually **+output**
  (additive), sometimes **−cost** or **−length**; a few *raise* their cost per completion (training tasks).
- **Max (Limited):** how many times a task can ever be done (1…999). `Max 0` = visible but not yet doable.
- **Lock / replace:** tasks disappear when obsolete or a milestone hits (early labor locks; a task upgrades
  into a stronger successor; Housing locks the old tier and unlocks the next).
- **Outputs can be random:** value ranges (`⦿0.5–1/s`) and **percentage-chance drops** (`Gemstone 40%`).
- **Cap-raising rewards:** many Upgrade tasks give **no resources** — they raise a skill's **Max** (level
  ceiling) and **Rate** (progress speed) or **unlock a tab/feature** (Bestiary, Spellbook, Familiars).
- **Requirement gating (multi-dimensional):** skill level · character level/title · building/room ownership ·
  a one-time **Purchase** · a dwelling type · **completing a prerequisite task** (incl. "complete X ≥N
  times"). *(Arcanum also gates on **alignment** and **Tier** — see §7, TBD for us.)*

## 5. Tags (category labels — adapt freely)
Every task carries one or more **Tags** used to group/filter the Available list. Arcanum's set, lightly
re-flavored for us:
**Starting Out · Livelihood (was Affluence) · Crafting · Craftwork · Materials · Imbuement · Research ·
Knowledge · Contemplation · Spellcasting · Body · Martial · Minions · Rest · Storage · Bulk Sales ·
Transformation · Housing · Contract · Hunt** — plus per-element tags (Pyromancy→**Fire**, etc.). *(Arcanum's
Good/Evil/Vile Acts tags map to an optional alignment system, §7.)*

## 6. Starter task list (first-pass port — WILL be tuned)
Costs use our resources: ⦿ Gold · ◈ Insight · ✚ Life · ⚡ Stamina · ✦ Mana · essences ▲▼⬢≈☀☾❖ · ★ Renown ·
Materials (Moonpetal, Iron, Spirit Dust, Wyrm Scale, Ash Salt, Scroll, Codex, Gem, Rune). `I:`=startup,
`R:`=running/s.

### Unlimited · Instant
| Task | Cost | Output | Req | Tag |
|---|---|---|---|---|
| Clean Stables | ⚡1 | ⦿2.5 | — | Starting Out |
| Do Chores | ⚡1.7 | ⦿2.5 (At 5: +1) | title Apprentice | Livelihood |
| Scribe Scroll | ◈10 ✦1 | Scroll×1, Scribing xp | — | Crafting |
| Bind Codex | ◈20 ✦3 Scroll×10 | Codex×1, +Insight Max | — | Crafting |
| Sell Scroll | Scroll×1 | ⦿5 | Scribe Scroll ≥1 | Bulk Sales |
| Gather Herbs | ⚡3 | Moonpetal×2, Alchemy xp | — | Materials |
| Imbue Gem (Fire) | Gem×1 ▲5 | Fire Gem×1 | Fire skill 3 | Imbuement |
| …one Imbue per element (▼⬢≈☀☾❖) | Gem×1 + that essence | that element's Gem | that element skill | Imbuement |
| Focus | ✦0.02 | +0.02 to a chosen skill's progress | ≥1 skill at Lv1 | — |
| Sell Gem | Gem×1 | ⦿35 | — | Livelihood |

### Unlimited · Running
| Task | Length | Cost | Output | Req | Tag |
|---|---|---|---|---|---|
| Smith | 15s | R: ⚡0.4/s | ⦿5 (Length −0.1/s at 20&50) | Crafting 8 | Craftwork |
| Mine | 40s | R: ⚡0.5/s ⬢0.2/s | ⦿0.5–1/s, Gem 20/150/2000 | own a Mineshaft | Livelihood |
| Brew Potion | 25s | I: Moonpetal×5; R: ⚡0.5/s | Insight, ⦿2, Elixir 5% | Alchemy master | Crafting |
| Hunt: Cinder Imp | 12s | R: ⚡0.5/s (bring ▼) | ▲ essence, Emberroot; risks ✚ | Bestiary unlocked | Hunt |
| Fulfil: Ward a Barn | 120s | needs ☀Light 10 **or** 1 student | ⦿60 ★4 | — | Contract |
| Fulfil: Escort Caravan | 8m | combat power ≥40 | ⦿500 ★30 | — | Contract |
| Craft Rune | 10s | I: ◈300 Codex Gem×4; R: ⚡1/s ✦0.75/s | Rune×1 | Scribing 14, own Workspace | Craftwork |

### Unlimited · Perpetual
| Task | Cost | Output | Req | Tag |
|---|---|---|---|---|
| Rest | — | ✚+1/s, essence +0.5/s, ⚡+0.8/s, −Stress | — | Rest |
| Study | R: ⚡0.2/s | Insight +0.55/s (+0.05 per 100) | own a Scroll | Research |
| Meditate / Pace | R: ⚡0.4/s | Insight +1.75/s | title Neophyte+ | Contemplation |
| Offer Services | R: ⚡0.35/s ✦0.1/s | ⦿1.6/s | title Adept | Livelihood |
| Attune to Elements | R: ⚡0.5/s + each of ▲▼⬢≈ 0.1/s | raises those element Maxes | Master of Elements | Research |

### Limited · Upgrade (Max)
| Task | Length | Max | Effect | Req |
|---|---|---|---|---|
| Bind Spellbook | 50s | 1 | unlock **Spell Craft** memorization | Scholarship 2, Scribing 2 |
| Unlock Bestiary | 75s | 1 | unlock the **Bestiary** tab | Combat/Handling 3 |
| Basic Tools | 20s | 1 | Smith length −3s | Crafting 10 |
| Firegazing | 10s | 5 | **Fire** skill Max + | Fire 1, own a Firesource |
| …one "gaze/study" cap-raiser per element | 10s | 3–5 | that element's Max/Rate + | that element + a source |
| Sanguine Rite | 20s | 1 | Life Max +15 (Body) | own Potions room, title Tier-2 |
| Prismatic Attunement | 60s | 1 | unlock **Prismatic** spells | all six elements at II |

### Limited · Equipment
| Task | Length | Cost | Effect | Req |
|---|---|---|---|---|
| Forge a Focus (wand) | 60s | I: Iron×10 ▲Gem×3; R: ⚡1/s | Focus → Inventory | Crafting 7 |
| Weave Robes | 60s | I: Moonpetal×8; R: ⚡1/s | Robes → Inventory | Alchemy 5 |
| Re-make (if lost) | 10s | cheap subset | re-adds the item | completed the craft once |

### Limited · Housing / Building
| Task | Length | Max | Effect | Req |
|---|---|---|---|---|
| Furnish Study Desk | 20s | 1 | Home: Insight +/s | — |
| Build Hearth / Ossuary… | 20s | 1 | Home: that element +/s | that element opened |
| **FOUND THE ACADEMY** | 120s | 1 | Home → academy first hall; unlock **Academy** tab | ⦿≥500, ★≥30, Charter, Site |
| Headmaster Promotion | 120s | 1 | Academy Floor Space +; Renown | title Magician, post-Founding |
| Expand a Hall | 120s | 3 | +Floor Space / element cap | per-element master |

## 7. Deferred decisions (flag for later, per "altered later")
- **Alignment** (Arcanum's Virtue/Evil/Vile and Good/Evil Acts tags) — do we want a morality axis? It gates
  many Arcanum tasks. Default: **omit for now**, keep the hook.
- **Tiers** (Arcanum's Tier 0–6 gate) — we already have **titles/level** (doc 09); map Tier→title.
- **Arcanum-specific skills** (Umbramancy, Debitomancy, Chronomancy, Puppetry, Mechamancy…) — port only the
  ones that fit our six elements + Focus/Scribing/Alchemy/Combat/Scholarship; drop or theme the rest.
- **Stress / Vigor** (secondary vitals in Arcanum's Rest tasks) — decide whether Stress and a slow "Vigor"
  meter join Life/Stamina/Mana, or fold into morale.
- Exact **numbers** everywhere are placeholders (doc 02 balancing).

## 8. Where tasks connect to other systems
- **Skills (doc 09 §4)** — most tasks give skill XP and are gated by skill level; Upgrade tasks raise skill Max/Rate.
- **Spell Craft / Potions / Equipment / Bestiary** tabs are **composers/catalogs**; pressing "make"/"hunt"
  there **starts a task** that runs here in Main.
- **Home / Academy (doc 09 §5, doc 01)** — Housing tasks build them; the Academy adds student-run tasks & dispatch.
- **Prestige (doc 03)** — Ascension resets task progress; meta-tree can pre-complete early tasks (Legacy of
  Learning) and grant starting Activity slots.
