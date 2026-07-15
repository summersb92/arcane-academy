// Home content (spec §3.10 / §5) — v0.1.1 rewrite. The lair is no longer a set of
// build-tasks ("fixtures"); it is a HOUSING TIER (which sets your Activity-adjacent
// item SLOTS, and may carry rent or innate bonuses) plus EQUIPPABLE ITEMS you buy
// once and slot in for passive Modifiers. Pure data; framework-agnostic (type-only
// imports of the task + state ids, so there is no runtime cycle). systems/home.ts
// interprets these; the UI/CLI only format them.
//
// A Modifier is the single knob every bonus flows through:
//   • kind 'max'  → raises the EFFECTIVE cap of its target  (Coin Pouch → +50 Gold cap)
//   • kind 'rate' → adds to a per-second rate               (Charm of Vigor → +0.05 Life/s;
//                    an ElementId target awakens + trickles that essence; 'jobOutput' scales Odd Jobs)

import type { ElementId } from '../engine/state';
import type { Amount, Requirement } from './tasks';

const A = (pool: Amount['pool'], id: Amount['id'], amount: number): Amount => ({ pool, id, amount });

/** The six housing tiers, from a penniless Vagrant to a self-sufficient Homestead. */
export type HomeTierId = 'vagrant' | 'inn' | 'tent' | 'mentor' | 'house' | 'homestead';

/** What a Modifier acts on: a resource cap, a vital rate, an essence rate (ElementId),
 *  or the Odd-Jobs output multiplier. */
export type ModTarget =
  | 'gold'
  | 'insight'
  | 'moonpetal'
  | 'ironOre'
  | 'spiritDust'
  | 'life'
  | 'stamina'
  | 'mana'
  | ElementId
  | 'jobOutput';

export interface Modifier {
  target: ModTarget;
  kind: 'max' | 'rate';
  amount: number;
}

export interface HomeTier {
  id: HomeTierId;
  name: string;
  blurb: string;
  slots: number; // how many items can be equipped at this tier
  from: HomeTierId[]; // tiers you may move here FROM (the from-chain)
  requires?: Requirement[]; // gate to move in
  moveCost?: Amount[]; // one-off cost to move in
  rent?: Amount[]; // per-second upkeep while living here (spent by runHome)
  innate?: Modifier[]; // always-on bonuses this tier grants (no slot needed)
}

export interface HomeItem {
  id: string;
  name: string;
  blurb: string;
  cost: Amount[]; // one-off purchase price
  requires?: Requirement[]; // gate to buy
  mods: Modifier[]; // bonuses applied only while EQUIPPED (occupies a slot)
}

export const HOME_TIERS: HomeTier[] = [
  {
    id: 'vagrant',
    name: 'Vagrant',
    blurb: 'A patch of stable straw. Free, but there is barely room for a single keepsake.',
    slots: 1,
    from: [],
  },
  {
    id: 'inn',
    name: 'Inn Room',
    blurb: 'A rented room over the tavern — a real bed, a lockable chest. The keeper wants coin nightly.',
    slots: 2,
    from: ['vagrant'],
    requires: [{ kind: 'flag', flag: 'lairFounded' }],
    rent: [A('resource', 'gold', 0.1)],
  },
  {
    id: 'tent',
    name: 'Wayfarer Tent',
    blurb: 'A canvas tent pitched on the ridge. Free-standing and airy — the wind itself begins to answer.',
    slots: 2,
    from: ['inn'],
    moveCost: [A('resource', 'gold', 30)],
    innate: [{ target: 'air', kind: 'rate', amount: 0.05 }],
  },
  {
    id: 'mentor',
    name: "Mentor's Loft",
    blurb: 'A scholar takes you in. Cramped, but the shelves and the conversation sharpen your Insight.',
    slots: 3,
    from: ['inn'],
    requires: [{ kind: 'resource', id: 'renown', atLeast: 12 }],
    innate: [{ target: 'insight', kind: 'rate', amount: 0.1 }],
  },
  {
    id: 'house',
    name: 'Town House',
    blurb: 'A narrow house of your own on a quiet lane. Four rooms to furnish, and no landlord.',
    slots: 4,
    // Reachable from the Inn OR either spoke (Tent/Mentor) so a branch is never a dead-end.
    from: ['inn', 'tent', 'mentor'],
    moveCost: [A('resource', 'gold', 120)],
  },
  {
    id: 'homestead',
    name: 'Hill Homestead',
    blurb: 'Land, a forge-shed, and a herb garden. Self-sufficient — ore and moonpetal accrue on their own.',
    slots: 5,
    // The top of the chain: reachable from the Inn, either spoke, or the Town House.
    from: ['inn', 'tent', 'mentor', 'house'],
    moveCost: [A('resource', 'gold', 200), A('resource', 'ironOre', 5)],
    innate: [
      { target: 'ironOre', kind: 'rate', amount: 0.05 },
      { target: 'moonpetal', kind: 'rate', amount: 0.05 },
    ],
  },
];

export const HOME_ITEMS: HomeItem[] = [
  {
    id: 'coin-pouch',
    name: 'Coin Pouch',
    blurb: 'A stout leather purse. Hold a little more Gold before it spills.',
    cost: [A('resource', 'gold', 30)],
    mods: [{ target: 'gold', kind: 'max', amount: 50 }],
  },
  {
    id: 'strongbox',
    name: 'Strongbox',
    blurb: 'An iron-banded coffer. Serious storage for a serious purse.',
    // 90 (not 100) so it's affordable with headroom under the 100 cap the Coin Pouch
    // grants — no exact at-cap knife-edge while Inn rent nibbles the last coin.
    cost: [A('resource', 'gold', 90), A('resource', 'ironOre', 3)],
    mods: [{ target: 'gold', kind: 'max', amount: 150 }],
  },
  {
    id: 'tool-belt',
    name: 'Tool Belt',
    blurb: 'Every implement to hand — your Odd Jobs pay noticeably better.',
    cost: [A('resource', 'gold', 40)],
    mods: [{ target: 'jobOutput', kind: 'rate', amount: 0.2 }],
  },
  {
    id: 'herbalist-kit',
    name: 'Herbalist Kit',
    blurb: 'Salves and tonics — you recover Stamina faster.',
    cost: [A('resource', 'gold', 25)],
    mods: [{ target: 'stamina', kind: 'rate', amount: 0.1 }],
  },
  {
    id: 'charm-of-vigor',
    name: 'Charm of Vigor',
    blurb: 'A warm little talisman — your Life mends a touch quicker.',
    cost: [A('resource', 'gold', 20)],
    mods: [{ target: 'life', kind: 'rate', amount: 0.05 }],
  },
  {
    id: 'mana-crystal',
    name: 'Mana Crystal',
    blurb: 'A humming shard that feeds the wellspring within — Mana regenerates faster.',
    cost: [A('resource', 'gold', 35)],
    requires: [{ kind: 'skill', id: 'inner-wellspring' }],
    mods: [{ target: 'mana', kind: 'rate', amount: 0.1 }],
  },
  {
    id: 'hearth-stone',
    name: 'Hearth Stone',
    blurb: 'A rune-warmed stone. Equipping it awakens ▲ Fire essence and keeps it trickling.',
    cost: [A('resource', 'gold', 25), A('resource', 'ironOre', 2)],
    mods: [{ target: 'fire', kind: 'rate', amount: 0.15 }],
  },
  {
    id: 'focusing-lens',
    name: 'Focusing Lens',
    blurb: 'Ground crystal that clarifies study — a steady bump to Insight.',
    cost: [A('resource', 'gold', 30), A('resource', 'spiritDust', 2)],
    mods: [{ target: 'insight', kind: 'rate', amount: 0.12 }],
  },
  {
    id: 'warded-chest',
    name: 'Warded Chest',
    blurb: 'A preservation-warded chest — store far more of every raw material.',
    cost: [A('resource', 'gold', 40)],
    mods: [
      { target: 'moonpetal', kind: 'max', amount: 50 },
      { target: 'ironOre', kind: 'max', amount: 50 },
      { target: 'spiritDust', kind: 'max', amount: 50 },
    ],
  },
];

export const HOME_TIER_BY_ID: Record<string, HomeTier> = Object.fromEntries(HOME_TIERS.map((t) => [t.id, t]));
export const HOME_ITEM_BY_ID: Record<string, HomeItem> = Object.fromEntries(HOME_ITEMS.map((i) => [i.id, i]));
