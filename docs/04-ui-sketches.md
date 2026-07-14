# 04 — UI Sketches (text-based, Arcanum-style)

Layout is a fixed **three-zone frame**: **Resources on the left**, **tabs across the top**, **the character
on the right**, with the active tab's content in the center. Monospace, tabular, tooltip-rich; text + a few
glyph icons. A rendered HTML version is in [../sketches/ui-mockup.html](../sketches/ui-mockup.html).
Systems behind each tab are defined in [09-magic-and-personal-systems.md](09-magic-and-personal-systems.md).

## Global frame

```
┌ ARCANE ACADEMY  · working title ─────────────────────────  Vael the Adept · Lv 7 · 3rd Era ┐
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  Main   Skills   Player   Home   Spell Craft   Equipment   Potions   Bestiary   Academy       │
├───────────────┬─────────────────────────────────────────────────┬───────────────────────────┤
│  RESOURCES    │                                                 │  CHARACTER                │
│  ⦿ Gold  4.10K│                                                 │  ✚ Life     142/160       │
│  ◈ Insight1.9K│              MAIN  PANEL  (active tab)           │  ⚡ Stamina   58/80        │
│  ★ Renown 214 │                                                 │  ✦ Mana     210/300       │
│               │                                                 │                           │
│  MATERIALS    │                                                 │  ESSENCE                  │
│  ⚘ Moonpetal12│                                                 │  ❖ Prismatic  12 (+0.1)   │
│  ⛏ Iron    30 │                                                 │  ▲ Fire      340 (+2.1)   │
│  ✧ SpiritDust8│                                                 │  ▼ Water     120 (+0.9)   │
│  …            │                                                 │  ⬢ Earth     260 (+1.4)   │
│               │                                                 │  ≈ Air        90 (+0.6)   │
│  META         │                                                 │  ☾ Dark      410 (+3.0)   │
│  ∞ Aeon 87    │                                                 │  ☀ Light     150 (+1.1)   │
│  ⌛ Legacy 4.2K│                                                 │  (Fire↔Water Earth↔Air … )│
└───────────────┴─────────────────────────────────────────────────┴───────────────────────────┘
```

- **Left = Resources (physical):** Gold, Insight, Renown, crafting Materials, meta currencies. What you *have*.
- **Right = Character (properties):** Vitals (Life/Stamina/Mana, current/max bars) + Essence (7 elements,
  amount + rate). Always visible so every decision reads against your body and your power.
- **Top = Tabs.** In **Act I** the rail is short (Main · Skills · Player · Home, then Spell Craft/Equipment/
  Potions/Bestiary as they unlock); **Academy** is greyed until the Founding (doc 08). No Blight anywhere.

## 1. Main = Activity / Tasks (the core screen — full spec in [10-tasks.md](10-tasks.md))
Tasks are what your mage *does*. Continuous tasks run in **Activity slots**; instant tasks fire once.
Everything — labor, study, craft, **hunt**, **fulfil a contract**, rest, build — is a task here.
Every task is a **card**; cards flow into a **responsive grid** (Active grid + Available grid). **The whole
card is the button** — no Do/Start/Stop controls: click an Available card to start/do it, click an Active
card to stop it.
```
┌ MAIN · ACTIVITY ─────────────────────────────────────────────────────────────────────────────┐
│  ACTIVE — slots 2 / 3                                          (click a card to stop it)        │
│   ┌─────────────────────┐  ┌─────────────────────┐                                             │
│   │ Study    [perpetual]│  │ Hunt: Cinder Imp[12s↻]                                            │
│   │ ▓▓▓▓▓▓░░             │  │ ▓▓▓░░░░░             │   ← progress fill                          │
│   │ Research · running  │  │ Hunt                │                                             │
│   │ ⚡0.2/s → ◈+0.55/s   │  │ ⚡0.5/s → ▲ess ·✚    │                                             │
│   └─────────────────────┘  └─────────────────────┘                                             │
│                                                                                                │
│  AVAILABLE                          [tag ▾] [type ▾] [search] · click a card to start it        │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐                   │
│   │ Clean Stables[Instant] │ Smith    [Running·15s]  │ Fulfil: Ward a Barn[Contract·120s]      │
│   │ Starting Out        │  │ Craftwork · ↻ repeat│  │ Contract            │                   │
│   │ ⚡1 → ⦿2.5           │  │ ⚡0.4/s → ⦿5         │  │ ☀10/1 stu → ⦿60 ★18 │                   │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘                   │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐                   │
│   │ Rest     [perpetual]│  │ Unlock Bestiary[Upg] │  │ 🔒 Found Academy[Housing]               │
│   │ Rest                │  │ Knowledge·75s·Max1·0/1  │ Max 1 · 0/1         │                   │
│   │ — → ✚+1/s ⚡+0.8/s   │  │ → opens Bestiary tab│  │ needs ⦿500 ★30 …    │                   │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  (locked: dimmed)  │
│  CHRONICLE   14:02 Task complete: Scribe Scroll (×15 — At-15 bonus)  ·  11:48 ★ THE FOUNDING…   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
Card anatomy (per doc 10 §3): **name · type chip · tag(s) · length/instant/perpetual · startup + running
cost → output · repeat ↻**; the **whole card is the click target** (no buttons). Limited cards also show
**Max / completed** (`0/1`) and any **"At N"** hint; Active cards show a **progress fill**; a **coloured left
edge** encodes element/tag. Locked cards are dimmed and non-clickable with the unmet requirement shown; a
task that can't pay its running cost **auto-pauses**.

## 2. Player (character sheet)
```
┌ PLAYER ──────────────────────────────────────────────────────────────────────────────────────┐
│  Vael · Adept (Lv 7)   XP ▓▓▓▓▓▓░░ 6.2K / 9K        Attribute points: 2 unspent                │
│  Might 14  [+]    Focus 21  [+]    Attunement 18  [+]                                           │
│                                                                                                │
│  DERIVED           RESISTANCES (by element)                                                    │
│   Life max 160      ▲ Fire  +12%   ▼ Water +4%   ⬢ Earth +8%                                    │
│   Mana max 300      ≈ Air   +2%    ☾ Dark −5% (vuln)  ☀ Light +6%                               │
│   Cast power ×1.4                                                                               │
│  TITLES:  Stable-hand ✔ · Apprentice ✔ · Adept ✔ · … · Archmage 🔒                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Skills (the progression web)
```
┌ SKILLS ────────────────────────────────────────  ◈ Insight 1.9K (+9/s) ───────────────────────┐
│  Branch: [Elementalism] Focus  Scribing  Alchemy  Combat  Scholarship                          │
│                                                                                                │
│   ● Spark ✔ (cantrip)──● Fire I ✔──◌ Fire II            ☾ Dark I ✔──◌ Dark II (◈900 ☾200)       │
│   ● Mend ✔ (cantrip)───● Light I ✔─◌ Ward Shapes         └──● Discipline ✔──◌ Wraith Studies    │
│                                     ◌ Prismatic Attunement 🔒 (needs Fire/Water/Earth/Air II)   │
│   ◌ available   ● owned   ✔ done   🔒 locked (hover for prereqs)                                 │
│                                                                                                │
│  SELECTED — “Dark II”:  ☾ essence ×1.5; new spell shape; +1 revenant cap.  ◈900 ☾200 [Learn]   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Home (dwelling → academy seed)
```
┌ HOME ──────────────────────────────────────────────  fixtures 6/9 ─────────────────────────────┐
│  FIXTURE        Lv   EFFECT                    NEXT                                             │
│  Study Desk      3   ◈ +9/s                     ⦿300      [Upgrade]                              │
│  Alembic         2   potion brewing +20%        ⦿200 ⚗    [Upgrade]                              │
│  Hearth          2   ▲ Fire +2.1/s              ⦿150      [Upgrade]                              │
│  Ossuary         1   ☾ Dark +3.0/s              ⦿90  ☾    [Upgrade]                              │
│  Ward Stones     1   +resist all               ⦿180      [Upgrade]                              │
│                                                                                                │
│  ┌ FOUNDING (Act I → Academy) ─── Gold 500✔ · Renown 30✔ · Charter ✔ · Site ✔ ───────────────┐ │
│  │  Your Home becomes the academy's first hall.        [ FOUND THE ACADEMY ]                   │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 5. Spell Craft
```
┌ SPELL CRAFT ────────────────────────────────────────────  ✦ Mana 210/300 ─────────────────────┐
│  COMPOSE   Element:[☾ Dark ▾]  Shape:[Bolt ▾]  Component:[Siphon ▾]                             │
│    → “Umbral Bolt (Siphon)”  · cast 18 ✦ · Dark dmg, heals 20% · inscribe cost ☾40             │
│      [Inscribe]   [Preview]                                                                     │
│                                                                                                │
│  KNOWN SPELLS                 ELEMENT     CAST   EFFECT                                          │
│   Spark                        ▲ Fire      6 ✦    minor Fire dmg (cantrip)                       │
│   Mend                         ☀ Light    10 ✦    heal Life                                      │
│   Umbral Bolt                  ☾ Dark     18 ✦    Dark dmg + lifesteal                           │
│   🔒 Prismatic Nova            ❖ Prismatic  —     needs all six essences balanced                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 6. Bestiary
```
┌ BESTIARY ───────────────────────────────────────────────────────────────────────────────────┐
│  Hunt for essence & materials — Life is at stake. Bring a creature's OPPOSITE element.         │
│  CREATURE       AFFINITY     THREAT  DROPS                       ACTION                         │
│  Cinder Imp      ▲ Fire       Low     ▲ essence, Emberroot        [Hunt]  (use ▼ Water)          │
│  Marsh Drake     ▼ Water      Med     ▼ essence, Wyrm Scale       [Hunt]  (use ▲ Fire)           │
│  Grave Wight     ☾ Dark       Med     ☾ essence, Spirit Dust      [Hunt]  (use ☀ Light)          │
│  🔒 Prism Wyrm   ❖ Prismatic  High    ❖ essence (rare)            [Study more]                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 7. Equipment & Potions (compact)
```
┌ EQUIPMENT ─────────────────────────────┐   ┌ POTIONS ───────────────────────────────┐
│  Focus   Bonewood Wand   +cast, ☾+10%  │   │  BREW (at Alembic, from Materials)       │
│  Robes   Ashen Cloak     +8% Fire res  │   │   Elixir of Life   Moonpetal×2 → +Life   │
│  Ring    Ring of Focus   +Mana regen   │   │   Mana Draught     Spirit Dust×1 → +Mana │
│  Amulet  (empty)         [Equip]       │   │   Ember Tonic      Emberroot×2 → ▲ burst │
│  INVENTORY: Iron Dagger, Traveler Robe │   │  HELD: Elixir ×3, Mana ×2   [Use]        │
└─────────────────────────────────────────┘   └──────────────────────────────────────────┘
```

## 8. Academy (the institution — one tab, unlocks at the Founding)
```
┌ ACADEMY ──────────────────────────────────  Slots 22/30 · Students 38/45 (3 dispatched) ───────┐
│  HALL                   ELEMENT   Lv   YIELD/s      NEXT                                        │
│  Ossuary Lecture Hall    ☾ Dark    7    ☾ +11.0      ⦿520 ☾90   [Upgrade]                        │
│  Ember Forge Hall        ▲ Fire    4    ▲ +5.2       ⦿300 ▲40   [Upgrade]                        │
│  Grand Library           Utility   3    ◈ +9         ⦿300       [Upgrade]                        │
│  Dormitory               Utility   4    beds 45      ⦿400       [Upgrade]                        │
│  Sanctum                 ☀ Light   2    morale/mishap ⦿280 ☀50  [Upgrade]                        │
│                                                                                                │
│  [Students ▸]   [Faculty ▸]   [Enrollment: Toward Dark ▾]   [Contracts ▸]   [ Ascend ▸ ]        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
Sub-panels (Students, Faculty, Ascension/meta-tree, Roster) open from the Academy tab; their detailed
wireframes are unchanged from the management design (rooms/students/faculty/futures now keyed to the six
elements instead of the old five schools).

## Interaction & accessibility notes
- **Keyboard-first:** number keys jump tabs; arrows navigate rows; Enter = primary action. Hover *and*
  focus both open a tooltip/breakdown ("✦ +2.1 Fire = Hearth 1.2 × Attunement 1.4 × …").
- **Responsive:** below ~860px the three columns stack — Resources and Character collapse into
  top/bottom drawers; tabs become a horizontal scroll strip. Readable at phone width.
- **Numbers always sourced:** every rate expands to its full breakdown. No mystery math.
- **Color is secondary:** each element has a distinct glyph (▲▼⬢≈☾☀❖) as well as a color, so it works
  colorblind and near-monochrome.

## Theming (multi-theme by design)
All color lives in **CSS custom-property tokens** (~30 tokens: surfaces, four text tiers incl. the
≥4.5:1 `--label`, semantics, the 7 element colors, `--accent`); **a theme is one token block** — no
component styles change. Implemented and proven in the mockup.

| Theme | Mode | Status | Character |
|---|---|---|---|
| **Candlelight** *(default)* | dark | **mainstay** | warm violet-black; the cozy library lamplight look |
| **Manuscript** | light | **mainstay** | parchment & iron-gall ink; element colors re-tuned for paper contrast |
| **High Contrast** | dark | **mainstay** | pure black / white / saturated brights; accessibility |
| **Umbral** | dark | flavor | moonlit near-black; cooler, ☾-leaning — candidate unlockable |
| *(System)* | — | default | follows `prefers-color-scheme`: light → Manuscript, dark → Candlelight |

**Mainstay themes** (Candlelight, Manuscript, High Contrast — per author decision) ship always-available
from day one and are maintained first-class through every UI change. Flavor themes (Umbral etc.) may be
unlockables and can lag.

Selection: a **Theme picker** (header in the mockup; the System tab in the real game) sets
`data-theme` on `<html>` and persists to the save/localStorage; picking "System" removes it so the
`prefers-color-scheme` media query decides. Explicit choice always beats the media query. Adding a
theme = adding a token block, so **themes are cheap content** — future flavor themes (e.g. per-element
looks) can be **unlockables** (Witnessed Lore / achievement rewards, per the roundtable).
