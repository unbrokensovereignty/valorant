/**
 * What pro teams play on each map: how often each agent was picked (percent of maps played) and
 * a few typical comps, put together from the agents picked most there. The engine leans on this a little at high ranks and hardly
 * at all at low ranks, where pro coordination doesn't carry over.
 *
 * Sources (vlr.gg): Champions 2026, Masters Santiago 2026, and the China league's Kickoff and Stage 2
 * of 2026. Breeze and Pearl come mostly from Santiago. Icebox and Fracture weren't in the 2026 pool,
 * so their numbers come from 2025 play and the newer agents' picks are estimates (`dated`).
 * An agent missing from a map's list was picked rarely there.
 */

export interface ProMap {
  /** Agent → percent of maps picked. */
  picks: Record<string, number>;
  /** Typical comps, as agent ids. */
  comps: readonly (readonly string[])[];
  /** The numbers are from an earlier year's play. */
  dated?: boolean;
}

export const PRO: Record<string, ProMap> = {
  abyss: {
    picks: { sova: 100, harbor: 81, yoru: 69, waylay: 69, astra: 56, omen: 40, cypher: 35, chamber: 30, vyse: 25, neon: 20, fade: 15, viper: 10 },
    comps: [['sova', 'harbor', 'astra', 'yoru', 'cypher'], ['sova', 'harbor', 'omen', 'waylay', 'chamber'], ['sova', 'harbor', 'astra', 'waylay', 'vyse']],
  },
  ascent: {
    picks: { omen: 100, sova: 100, chamber: 54, cypher: 46, sage: 42, jett: 35, neon: 30, killjoy: 25, kayo: 20, yoru: 15, vyse: 10 },
    comps: [['omen', 'sova', 'jett', 'killjoy', 'kayo'], ['omen', 'sova', 'chamber', 'sage', 'neon'], ['omen', 'sova', 'cypher', 'jett', 'kayo']],
  },
  bind: {
    picks: { viper: 92, fade: 70, yoru: 60, brimstone: 50, raze: 50, waylay: 40, omen: 30, cypher: 25, skye: 15, astra: 15, gekko: 10, kayo: 10 },
    comps: [['viper', 'brimstone', 'raze', 'fade', 'yoru'], ['viper', 'omen', 'fade', 'yoru', 'cypher'], ['viper', 'brimstone', 'waylay', 'fade', 'cypher']],
  },
  breeze: {
    picks: { yoru: 100, viper: 100, sova: 100, omen: 56, chamber: 40, cypher: 30, kayo: 30, harbor: 25, jett: 20, killjoy: 15, astra: 10 },
    comps: [['viper', 'sova', 'yoru', 'omen', 'chamber'], ['viper', 'sova', 'yoru', 'harbor', 'cypher'], ['viper', 'sova', 'yoru', 'kayo', 'omen']],
  },
  corrode: {
    picks: { viper: 86, omen: 75, fade: 70, waylay: 57, yoru: 50, neon: 45, vyse: 43, sova: 30, cypher: 25, chamber: 20, astra: 15 },
    comps: [['viper', 'omen', 'fade', 'waylay', 'vyse'], ['viper', 'omen', 'fade', 'yoru', 'neon'], ['viper', 'omen', 'sova', 'neon', 'cypher']],
  },
  fracture: {
    dated: true,
    picks: { breach: 85, brimstone: 70, raze: 50, neon: 45, fade: 50, cypher: 40, vyse: 30, tejo: 25, viper: 30, chamber: 20, yoru: 15, killjoy: 15 },
    comps: [['breach', 'brimstone', 'raze', 'fade', 'cypher'], ['breach', 'brimstone', 'neon', 'tejo', 'vyse'], ['breach', 'viper', 'brimstone', 'raze', 'fade']],
  },
  haven: {
    picks: { neon: 85, sova: 80, omen: 70, chamber: 60, yoru: 45, phoenix: 45, breach: 30, kayo: 25, cypher: 25, viper: 20, astra: 15, killjoy: 15, fade: 15 },
    comps: [['omen', 'sova', 'neon', 'chamber', 'yoru'], ['omen', 'sova', 'neon', 'chamber', 'breach'], ['omen', 'sova', 'neon', 'phoenix', 'cypher']],
  },
  icebox: {
    dated: true,
    picks: { viper: 95, sova: 80, killjoy: 50, jett: 40, yoru: 40, gekko: 30, kayo: 30, harbor: 25, chamber: 25, neon: 20, omen: 20, waylay: 15 },
    comps: [['viper', 'sova', 'killjoy', 'jett', 'kayo'], ['viper', 'sova', 'yoru', 'gekko', 'killjoy'], ['viper', 'harbor', 'sova', 'jett', 'chamber']],
  },
  lotus: {
    picks: { omen: 100, fade: 80, viper: 77, raze: 65, chamber: 57, neon: 50, jett: 50, vyse: 40, killjoy: 37, waylay: 35, cypher: 20, breach: 15 },
    comps: [['omen', 'viper', 'fade', 'raze', 'chamber'], ['omen', 'viper', 'fade', 'neon', 'killjoy'], ['omen', 'viper', 'fade', 'raze', 'vyse']],
  },
  pearl: {
    picks: { astra: 94, yoru: 69, sova: 56, neon: 56, killjoy: 44, viper: 40, cypher: 30, fade: 30, chamber: 20, omen: 20, harbor: 15 },
    comps: [['astra', 'sova', 'neon', 'yoru', 'killjoy'], ['astra', 'viper', 'fade', 'neon', 'cypher'], ['astra', 'sova', 'yoru', 'killjoy', 'viper']],
  },
  split: {
    picks: { viper: 100, omen: 90, neon: 75, fade: 70, yoru: 60, raze: 35, cypher: 35, breach: 20, skye: 15, killjoy: 10, sage: 10 },
    comps: [['viper', 'omen', 'neon', 'fade', 'yoru'], ['viper', 'omen', 'raze', 'fade', 'cypher'], ['viper', 'omen', 'neon', 'breach', 'cypher']],
  },
  summit: {
    picks: { neon: 80, fade: 80, chamber: 65, cypher: 50, omen: 55, sage: 50, harbor: 44, waylay: 35, raze: 30, sova: 25, viper: 20, astra: 15 },
    comps: [['neon', 'fade', 'chamber', 'omen', 'sage'], ['neon', 'fade', 'harbor', 'cypher', 'omen'], ['neon', 'fade', 'chamber', 'harbor', 'sage']],
  },
  sunset: {
    picks: { omen: 100, neon: 85, fade: 70, chamber: 60, cypher: 50, sova: 45, breach: 25, raze: 25, yoru: 20, viper: 15, killjoy: 15, waylay: 15 },
    comps: [['omen', 'neon', 'fade', 'chamber', 'sova'], ['omen', 'neon', 'fade', 'cypher', 'breach'], ['omen', 'neon', 'sova', 'cypher', 'raze']],
  },
};

/**
 * Champions 2026, the last event these numbers come from, began on 24 September 2026. An agent
 * released after that hasn't had the chance to be picked by pro teams yet.
 */
export const PRO_CUTOFF = '2026-09-24';
/** Pro teams have had the chance to pick the agent (it isn't new since the events above). */
export const proKnown = (a: { released: string; estimate?: boolean }): boolean => !a.estimate && a.released < PRO_CUTOFF;

/** How often pro teams pick an agent on a map, in percent (0 when rarely). */
export const proPick = (map: string, agent: string): number => PRO[map]?.picks[agent] ?? 0;
