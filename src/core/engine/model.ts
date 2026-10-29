/**
 * Turns a situation (map, side, sites, rank) into the numbers the search scores teams with:
 * how much each strength matters, how much of each agent's kit a team at the rank gets out of it,
 * each agent's own fit, each pair's synergy and each role count's cost. "Any map" and "Both
 * sides" are the average of the situations they cover.
 */
import { AGENTS, agentById, earlyStats, type Agent } from '../kb/agents.ts';
import { MAPS, POOL, mapById, parseNeeds, type MapInfo, type Side, type SiteId } from '../kb/maps.ts';
import { PRO, proKnown, proPick, proRoleMix } from '../kb/pro.ts';
import { ALL_RANKS_T, rankOf, type RankId } from '../kb/ranks.ts';
import { DIMS, ROLE_IDS, type Dim, type Role } from '../kb/roles.ts';
import { PAIRS } from '../kb/synergy.ts';
import { rulesFor, type ParsedRule } from '../kb/kitfit.ts';
import { THREATS, type Threat } from '../kb/counters.ts';
import { BASE, BY_RANK, EXEC, FIT, NEW_WIN_SHARE, PAIR_STEP, PRO_GAMES, PRO_RISE, ROLE_COST, ROLE_MIX, WIN_CAP, WIN_RANKS } from './weights.ts';

export type MapPick = string; // a map id, or 'any'
export type SidePick = Side | 'both';
export type RankPick = RankId | 'any';

/**
 * One situation to plan for. `sites` is empty for all of the map's sites; `enemy` is the other
 * team's agents, as far as they're known (none, or left out, when they aren't).
 */
export interface Situation { map: MapPick; side: SidePick; sites: readonly SiteId[]; rank: RankPick; enemy?: readonly string[] }

export const N = AGENTS.length;
export const D = DIMS.length;
export const ROLES_N = ROLE_IDS.length;
export const roleIndex = (r: Role): number => ROLE_IDS.indexOf(r);

/** Each agent's role, as an index into ROLE_IDS. */
export const ROLE_OF = new Uint8Array(N);
for (const a of AGENTS) ROLE_OF[a.index] = roleIndex(a.role);

export interface Model {
  situation: Situation;
  /** How much each strength matters (sums to 1). */
  weight: Float64Array;
  /**
   * Per agent and strength: 1 − the strength a team at this rank gets out of the agent, which the
   * search multiplies to find a team's coverage: miss[a * D + d].
   */
  miss: Float64Array;
  /** Each agent's own fit. */
  base: Float64Array;
  /** Pair synergy, both ways: pair[a * N + b]. */
  pair: Float64Array;
  /** The cost of `c` agents of role `r`: roleCost[r * 5 + min(c, 4)]. */
  roleCost: Float64Array;
  /** The parts that make up each agent's own fit, for the explanations. */
  fitParts: { pro: Float64Array; rank: Float64Array; win: Float64Array };
  /**
   * How many of each role pro teams run in the situation (by ROLE_IDS index; NaN without pro
   * numbers), the part of each role count's cost that comes from straying from it, and how much of
   * the cost of having none of a role is forgiven because pro teams there mostly play without it.
   */
  mix: { want: Float64Array; cost: Float64Array; relax: Float64Array };
  /**
   * The kit rules (kb/kitfit.ts) that change each agent's strengths here, by agent index, with how
   * much each adds to (or takes from) a team's score on its own, averaged over the situations covered.
   */
  kit: { rule: ParsedRule; gain: number }[][];
  /**
   * What the other team's agents make you play around (kb/counters.ts), most first: how far each
   * threat goes (0 to 1, averaged over the situations covered) and their agents behind it, most first.
   */
  threats: ThreatAt[];
}

export interface ThreatAt { threat: Threat; level: number; who: string[] }

const t = (rank: RankPick) => (rank === 'any' ? ALL_RANKS_T : rankOf(rank).t);

/**
 * How much of a strength a team at rank `rankT` gets out of an agent, as a share (see EXEC):
 * all of it at Radiant, less of a hard or team-dependent kit lower down, and all of gun play.
 */
export function execShare(a: Agent, dim: Dim, rankT: number): number {
  const keys = a.via[dim] ?? '';
  const gun = keys.includes('G') ? (keys.length === 1 ? 1 : 0.5) : 0;
  return gun + (1 - gun) * kitShare(a, rankT);
}

/** How much of an agent's abilities (gun play aside) a team at rank `rankT` gets out of them. */
export const kitShare = (a: { skill: number; solo: number }, rankT: number): number => 1 - (1 - rankT) * (EXEC.skill * a.skill + EXEC.team * (1 - a.solo));

/** The bumps a map, side and set of sites add to each strength. */
export function needsFor(map: MapInfo, side: Side, sites: readonly SiteId[]): Record<Dim, number> {
  const out = Object.fromEntries(DIMS.map((d) => [d, 0])) as Record<Dim, number>;
  const add = (spec: string | undefined, share: number) => {
    for (const [d, v] of Object.entries(parseNeeds(spec, map.name)) as [Dim, number][]) out[d] += v * share;
  };
  add(map.needs.both, 1);
  add(map.needs[side], 1);
  const chosen = map.sites.filter((s) => !sites.length || sites.includes(s.id));
  for (const s of chosen) {
    add(s.needs.both, 1 / chosen.length);
    add(s.needs[side], 1 / chosen.length);
  }
  return out;
}

/** How much a rank leans on pro play, from PRO_RISE.low at Iron to 1 at Radiant. */
export const proLean = (rankT: number): number => PRO_RISE.low + (1 - PRO_RISE.low) * rankT ** PRO_RISE.power;

/** How much a map's pro numbers count: less for a small sample or an earlier year's play (PRO_GAMES). */
export function proShare(map: string): number {
  const p = PRO[map];
  if (!p) return 0;
  if (p.dated) return PRO_GAMES.dated;
  return Math.max(PRO_GAMES.least, Math.min(1, (p.games ?? 0) / PRO_GAMES.full));
}

/** −0.3 for an agent pros don't pick, about 0 at 9%, 0.7 for one picked every time. */
const proCurve = (pct: number) => Math.sqrt(pct / 100) - 0.3;

/** How much ranked win rates count at a rank (0 Iron to 1 Radiant): fully between WIN_RANKS.from and .to. */
export function winShare(rankT: number): number {
  const { iron, from, to, radiant } = WIN_RANKS;
  if (rankT < from) return iron + (1 - iron) * (rankT / from);
  if (rankT <= to) return 1;
  return 1 - (1 - radiant) * ((rankT - to) / (1 - to));
}

/** How far an agent's ranked win rate is from 50%, in points, as far as it counts (WIN_CAP, NEW_WIN_SHARE). */
export const winEdge = (a: Agent): number => Math.max(-WIN_CAP, Math.min(WIN_CAP, a.win - 50)) * (earlyStats(a) ? NEW_WIN_SHARE : 1);

/** The agent fit parts for one map and rank. */
function agentFit(a: Agent, map: string, rankT: number): { pro: number; rank: number; win: number } {
  // a new agent's map and rank fit start neutral: there's no play to go on yet
  if (a.estimate) return { pro: 0, rank: 0, win: 0 };
  // and an agent pros haven't had the chance to pick isn't pulled either way by pro play
  const pro = proKnown(a) ? FIT.pro * proLean(rankT) * proCurve(proPick(map, a.id)) * proShare(map) : 0;
  const rank = (1 - rankT) * (FIT.solo * (a.solo - 0.55) - FIT.skill * (a.skill - 0.5));
  const win = FIT.win * winShare(rankT) * winEdge(a);
  return { pro, rank, win };
}

/**
 * How far each threat of the other team's agents goes on a map, with you on `side`: each agent adds
 * what their kit brings to the threat's strength there above its `from` (only those after the
 * strongest, for a `second` threat), and `full` of that is the whole threat. Their kits count at
 * full strength, whatever the rank: you plan for the other team playing them well.
 */
export function threatsOf(enemy: readonly string[], map: MapInfo, side: Side, sites: readonly SiteId[]): ThreatAt[] {
  const them = enemy.map((id) => agentById(id)).filter((a): a is Agent => !!a);
  if (!them.length) return [];
  const theirSide: Side = side === 'attack' ? 'defense' : 'attack';
  const rules = them.map((a) => rulesFor(a.id, map.id, theirSide, sites));
  const out: ThreatAt[] = [];
  for (const t of THREATS) {
    if (t.side && t.side !== side) continue;
    const brings = them.map((a, i) => ({ id: a.id, over: capWith(a, t.dim, rules[i]!) - t.from })).filter((x) => x.over > 0).sort((a, b) => b.over - a.over);
    const counted = t.second ? brings.slice(1) : brings;
    const level = Math.min(1, counted.reduce((acc, x) => acc + x.over, 0) / t.full);
    if (level > 0) out.push({ threat: t, level, who: brings.map((x) => x.id) });
  }
  return out;
}

function single(map: MapInfo, side: Side, sites: readonly SiteId[], rankT: number, enemy: readonly string[]) {
  const needs = needsFor(map, side, sites);
  // what the other team makes you play around, as far as it goes
  const threats = threatsOf(enemy, map, side, sites);
  for (const { threat, level } of threats) for (const [d, v] of Object.entries(threat.needs) as [Dim, number][]) needs[d] += v * level;
  const weight = new Float64Array(D);
  let sum = 0;
  DIMS.forEach((d, j) => {
    const [lo, hi] = BY_RANK[d];
    weight[j] = BASE[side][d] * Math.max(0.05, 1 + needs[d]) * (lo + (hi - lo) * rankT);
    sum += weight[j]!;
  });
  for (let j = 0; j < D; j++) weight[j]! /= sum;
  const pro = new Float64Array(N), rank = new Float64Array(N), win = new Float64Array(N);
  for (const a of AGENTS) {
    const f = agentFit(a, map.id, rankT);
    pro[a.index] = f.pro;
    rank[a.index] = f.rank;
    win[a.index] = f.win;
  }
  // how this map, side and site change each agent's strengths (kb/kitfit.ts)
  const rules = AGENTS.map((a) => rulesFor(a.id, map.id, side, sites));
  return { weight, pro, rank, win, rules, threats };
}

/** An agent's strength once the kit rules that apply have changed it. */
const capWith = (a: Agent, d: Dim, rules: readonly ParsedRule[]): number =>
  Math.max(0, Math.min(1, rules.reduce((v, r) => v + (r.bumps[d] ?? 0), a.caps[d])));

const roleOfId = (id: string) => agentById(id)?.role;
/** How many of each role pro teams run on a map, on average (see proRoleMix in kb/pro.ts). */
export const proMixOf = (map: string) => proRoleMix(map, roleOfId);

const cache = new Map<string, Model>();
export const situationKey = (s: Situation) => `${s.map}|${s.side}|${[...s.sites].sort().join('')}|${s.rank}|${[...(s.enemy ?? [])].sort().join()}`;

/** The numbers for a situation (kept, since the same ones are asked for again and again). */
export function modelFor(s: Situation): Model {
  const key = situationKey(s);
  const hit = cache.get(key);
  if (hit) return hit;
  const maps = s.map === 'any' ? POOL : [mapById(s.map) ?? MAPS[0]!];
  const sides: Side[] = s.side === 'both' ? ['attack', 'defense'] : [s.side];
  const rankT = t(s.rank);
  const weight = new Float64Array(D), pro = new Float64Array(N), rank = new Float64Array(N), win = new Float64Array(N);
  const parts = maps.length * sides.length;
  const miss = new Float64Array(N * D);
  const kit: { rule: ParsedRule; gain: number }[][] = AGENTS.map(() => []);
  const threats: ThreatAt[] = [];
  for (const m of maps) {
    for (const side of sides) {
      const one = single(m, side, s.map === 'any' ? [] : s.sites, rankT, s.enemy ?? []);
      for (const x of one.threats) {
        const had = threats.find((y) => y.threat === x.threat);
        if (had) { had.level += x.level / parts; had.who = [...new Set([...had.who, ...x.who])]; }
        else threats.push({ ...x, level: x.level / parts });
      }
      for (let j = 0; j < D; j++) weight[j]! += one.weight[j]! / parts;
      for (let i = 0; i < N; i++) { pro[i]! += one.pro[i]! / parts; rank[i]! += one.rank[i]! / parts; win[i]! += one.win[i]! / parts; }
      for (const a of AGENTS) {
        const rules = one.rules[a.index]!;
        DIMS.forEach((d, j) => { miss[a.index * D + j]! += (1 - capWith(a, d, rules) * execShare(a, d, rankT)) / parts; });
        for (const rule of rules) {
          // what the rule adds on its own: each strength it changes, as the score weighs it here
          const gain = DIMS.reduce((acc, d, j) => acc + one.weight[j]! * (capWith(a, d, [rule]) - a.caps[d]) * execShare(a, d, rankT), 0) / parts;
          const had = kit[a.index]!.find((k) => k.rule === rule);
          if (had) had.gain += gain;
          else kit[a.index]!.push({ rule, gain });
        }
      }
    }
  }
  const base = new Float64Array(N);
  for (let i = 0; i < N; i++) base[i] = pro[i]! + rank[i]! + win[i]!;
  const pair = new Float64Array(N * N);
  const index = new Map(AGENTS.map((a) => [a.id, a.index]));
  for (const p of PAIRS) {
    const a = index.get(p.a), b = index.get(p.b);
    if (a === undefined || b === undefined) continue;
    const share = p.side === 'both' ? 1 : sides.filter((x) => x === p.side).length / sides.length;
    const v = p.strength * PAIR_STEP * share;
    pair[a * N + b] = v;
    pair[b * N + a] = v;
  }
  // the hard rules for role counts (ROLE_COST), and straying from each map's pro role mix (ROLE_MIX)
  const roleCost = new Float64Array(ROLES_N * 5), want = new Float64Array(ROLES_N), mixCost = new Float64Array(ROLES_N * 5), relaxed = new Float64Array(ROLES_N);
  let mixed = 0;
  const lean = proLean(rankT);
  for (const m of maps) {
    const mix = proRoleMix(m.id, roleOfId);
    const share = proShare(m.id);
    if (mix) mixed++;
    ROLE_IDS.forEach((r, ri) => {
      // where pros on the map mostly play without a role, the rule that a team needs one relaxes at high ranks
      const relax = mix ? lean * share * Math.max(0, 1 - mix[r]) : 0;
      relaxed[ri]! += relax / maps.length;
      for (let c = 0; c < 5; c++) {
        const hard = sides.reduce((acc, side) => acc + ROLE_COST[r][side][c]!, 0) / sides.length;
        roleCost[ri * 5 + c]! += (c === 0 ? hard * (1 - relax) : hard) / maps.length;
        if (mix) mixCost[ri * 5 + c]! -= (ROLE_MIX * lean * share * (c - mix[r]) ** 2) / maps.length;
      }
      if (mix) want[ri]! += mix[r];
    });
  }
  for (let ri = 0; ri < ROLES_N; ri++) want[ri] = mixed ? want[ri]! / mixed : Number.NaN;
  for (let i = 0; i < roleCost.length; i++) roleCost[i]! += mixCost[i]!;
  const model: Model = {
    situation: { ...s, sites: [...s.sites], enemy: [...(s.enemy ?? [])] }, weight, miss, base, pair, roleCost, fitParts: { pro, rank, win }, mix: { want, cost: mixCost, relax: relaxed }, kit,
    threats: threats.sort((a, b) => b.level - a.level),
  };
  if (cache.size > 200) cache.clear();
  cache.set(key, model);
  return model;
}
