/**
 * What pro teams play on each map: how often each agent was picked (percent of maps played),
 * how many maps that comes from, and a few typical comps built from the agents picked most there.
 * The engine leans on this a little at high ranks and hardly at all at low ranks, where pro
 * coordination doesn't carry over.
 *
 * Sources (vlr.gg, agent pick rates per map), newest event first:
 * - Champions 2026 (24 September to 18 October, patch 13.05): Abyss, Ascent, Haven, Lotus, Split,
 *   Summit and Sunset, 86 maps. Checked against a second reading of the same tables
 *   (valorant-spind.de, 28 October 2026).
 * - Masters Santiago 2026: Bind, Breeze, Corrode and Pearl, which weren't in the Champions pool.
 * - Icebox and Fracture weren't in the 2026 pool, so their numbers come from 2025 play and the
 *   newer agents' picks are estimates (`dated`).
 * An agent missing from a map's list was picked rarely there. Each map's numbers add up to about
 * 500%, five agents a team.
 *
 * The comps counted at Masters Santiago (thespike.gg) are in RECORDED: which five agents, how
 * many maps they were played on and how many they won. The event didn't say which maps.
 */
import type { Role } from './roles.ts';

export interface ProMap {
  /** Agent → percent of maps picked. */
  picks: Record<string, number>;
  /** How many maps of pro play the picks come from (left out for an earlier year's numbers). */
  games?: number;
  /** Typical comps, as agent ids, built from the picks above. */
  comps: readonly (readonly string[])[];
  /** The numbers are from an earlier year's play. */
  dated?: boolean;
}

export const PRO: Record<string, ProMap> = {
  abyss: {
    games: 8,
    picks: { sova: 100, harbor: 81, yoru: 69, waylay: 69, astra: 56, omen: 38, neon: 31, jett: 25, cypher: 19, phoenix: 6 },
    comps: [['sova', 'harbor', 'astra', 'yoru', 'waylay'], ['sova', 'harbor', 'omen', 'waylay', 'neon'], ['sova', 'harbor', 'astra', 'yoru', 'cypher']],
  },
  ascent: {
    games: 13,
    picks: { omen: 100, sova: 100, chamber: 54, cypher: 46, sage: 42, neon: 38, phoenix: 38, jett: 35, yoru: 27, vyse: 12, waylay: 4 },
    comps: [['omen', 'sova', 'chamber', 'cypher', 'neon'], ['omen', 'sova', 'jett', 'sage', 'cypher'], ['omen', 'sova', 'phoenix', 'chamber', 'sage']],
  },
  bind: {
    games: 5,
    picks: { viper: 90, brimstone: 80, yoru: 70, fade: 70, waylay: 40, raze: 40, neon: 30, skye: 30, astra: 20, chamber: 10, harbor: 10, gekko: 10 },
    comps: [['viper', 'brimstone', 'yoru', 'raze', 'fade'], ['viper', 'brimstone', 'waylay', 'yoru', 'fade'], ['viper', 'brimstone', 'neon', 'yoru', 'skye']],
  },
  breeze: {
    games: 8,
    picks: { yoru: 100, viper: 100, sova: 100, omen: 56, jett: 56, neon: 44, astra: 31, cypher: 13 },
    comps: [['viper', 'omen', 'sova', 'yoru', 'jett'], ['viper', 'omen', 'sova', 'yoru', 'neon'], ['viper', 'astra', 'sova', 'yoru', 'cypher']],
  },
  corrode: {
    games: 7,
    picks: { viper: 86, omen: 71, fade: 71, waylay: 57, neon: 43, vyse: 43, yoru: 29, astra: 29, skye: 21, sova: 14, veto: 14, chamber: 7, phoenix: 7, iso: 7, deadlock: 7 },
    comps: [['viper', 'omen', 'fade', 'waylay', 'vyse'], ['viper', 'omen', 'fade', 'neon', 'yoru'], ['viper', 'astra', 'skye', 'waylay', 'vyse']],
  },
  fracture: {
    dated: true,
    picks: { breach: 85, brimstone: 70, raze: 50, neon: 45, fade: 50, cypher: 40, vyse: 30, tejo: 25, viper: 30, chamber: 20, yoru: 15, killjoy: 15 },
    comps: [['breach', 'brimstone', 'raze', 'fade', 'cypher'], ['breach', 'brimstone', 'neon', 'tejo', 'vyse'], ['breach', 'viper', 'brimstone', 'raze', 'fade']],
  },
  haven: {
    games: 10,
    picks: { neon: 85, sova: 80, omen: 70, chamber: 60, phoenix: 45, yoru: 45, astra: 25, fade: 20, cypher: 20, killjoy: 20, viper: 15, harbor: 5, raze: 5, waylay: 5 },
    comps: [['omen', 'sova', 'neon', 'chamber', 'yoru'], ['omen', 'sova', 'neon', 'chamber', 'phoenix'], ['astra', 'sova', 'neon', 'yoru', 'killjoy']],
  },
  icebox: {
    dated: true,
    picks: { viper: 95, sova: 80, killjoy: 50, jett: 40, yoru: 40, gekko: 30, kayo: 30, harbor: 25, chamber: 25, neon: 20, omen: 20, waylay: 15 },
    comps: [['viper', 'sova', 'killjoy', 'jett', 'kayo'], ['viper', 'sova', 'yoru', 'gekko', 'killjoy'], ['viper', 'harbor', 'sova', 'jett', 'chamber']],
  },
  lotus: {
    games: 15,
    picks: { omen: 100, viper: 77, fade: 77, chamber: 57, neon: 50, raze: 50, vyse: 37, kayo: 23, yoru: 17, cypher: 10, skye: 3 },
    comps: [['omen', 'viper', 'fade', 'raze', 'chamber'], ['omen', 'viper', 'fade', 'neon', 'vyse'], ['omen', 'viper', 'kayo', 'raze', 'chamber']],
  },
  pearl: {
    games: 8,
    picks: { astra: 94, yoru: 69, sova: 56, neon: 56, killjoy: 44, fade: 38, waylay: 38, cypher: 25, tejo: 25, vyse: 19, viper: 6, raze: 6, skye: 6, phoenix: 6, kayo: 6, clove: 6 },
    comps: [['astra', 'sova', 'neon', 'yoru', 'killjoy'], ['astra', 'fade', 'waylay', 'yoru', 'cypher'], ['astra', 'sova', 'tejo', 'neon', 'vyse']],
  },
  split: {
    games: 10,
    picks: { viper: 100, omen: 90, neon: 75, fade: 70, yoru: 60, raze: 35, skye: 30, chamber: 25, jett: 10, kayo: 5 },
    comps: [['viper', 'omen', 'neon', 'yoru', 'fade'], ['viper', 'omen', 'raze', 'yoru', 'skye'], ['viper', 'omen', 'neon', 'fade', 'chamber']],
  },
  summit: {
    games: 18,
    picks: {
      neon: 83, fade: 83, chamber: 69, sage: 53, harbor: 44, omen: 42, cypher: 19, phoenix: 19, sova: 11, waylay: 11, viper: 8, brimstone: 8, yoru: 8,
      kayo: 8, raze: 6, astra: 6, vyse: 6, tejo: 6, skye: 3, breach: 3, veto: 3,
    },
    comps: [['neon', 'fade', 'chamber', 'sage', 'omen'], ['neon', 'fade', 'chamber', 'sage', 'harbor'], ['neon', 'phoenix', 'fade', 'omen', 'chamber']],
  },
  sunset: {
    games: 12,
    picks: { omen: 100, neon: 79, fade: 71, chamber: 67, sage: 33, cypher: 33, yoru: 29, sova: 25, waylay: 21, kayo: 17, viper: 8, phoenix: 8, raze: 4, skye: 4 },
    comps: [['omen', 'neon', 'fade', 'chamber', 'cypher'], ['omen', 'neon', 'fade', 'chamber', 'sage'], ['omen', 'neon', 'yoru', 'fade', 'cypher']],
  },
};

/** A comp counted at a pro event: its agents, how many maps it was played on and how many it won. */
export interface RecordedComp { agents: readonly string[]; maps: number; won: number; event: string }

/** The most played comps at Masters Santiago 2026 (thespike.gg). */
export const RECORDED: readonly RecordedComp[] = [
  { agents: ['omen', 'viper', 'sova', 'killjoy', 'neon'], maps: 7, won: 3, event: 'Masters Santiago 2026' },
  { agents: ['raze', 'omen', 'viper', 'yoru', 'fade'], maps: 7, won: 5, event: 'Masters Santiago 2026' },
  { agents: ['omen', 'viper', 'yoru', 'neon', 'fade'], maps: 6, won: 5, event: 'Masters Santiago 2026' },
  { agents: ['omen', 'viper', 'fade', 'vyse', 'waylay'], maps: 5, won: 3, event: 'Masters Santiago 2026' },
  { agents: ['omen', 'viper', 'sova', 'jett', 'yoru'], maps: 5, won: 4, event: 'Masters Santiago 2026' },
];

/**
 * Champions 2026, the last event these numbers come from, began on 24 September 2026. An agent
 * released after that hasn't had the chance to be picked by pro teams yet.
 */
export const PRO_CUTOFF = '2026-09-24';
/** Pro teams have had the chance to pick the agent (it isn't new since the events above). */
export const proKnown = (a: { released: string; estimate?: boolean }): boolean => !a.estimate && a.released < PRO_CUTOFF;

/** How often pro teams pick an agent on a map, in percent (0 when rarely). */
export const proPick = (map: string, agent: string): number => PRO[map]?.picks[agent] ?? 0;

/**
 * How many agents of each role a pro team runs on a map, on average: each role's picks over all
 * the map's picks, times five. `roleOf` names each agent's role (kept out of here so this file
 * doesn't need the agent list).
 */
export function proRoleMix(map: string, roleOf: (id: string) => Role | undefined): Record<Role, number> | undefined {
  const p = PRO[map];
  if (!p) return undefined;
  const mix: Record<Role, number> = { duelist: 0, initiator: 0, controller: 0, sentinel: 0 };
  let all = 0;
  for (const [id, pct] of Object.entries(p.picks)) {
    const r = roleOf(id);
    if (!r) continue;
    mix[r] += pct;
    all += pct;
  }
  if (!all) return undefined;
  for (const r of Object.keys(mix) as Role[]) mix[r] = (5 * mix[r]) / all;
  return mix;
}
