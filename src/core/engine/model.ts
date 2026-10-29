/**
 * Turns a situation (map, side, sites, rank) into the numbers the search scores teams with:
 * how much each strength matters, each agent's own fit, each pair's synergy and each role
 * count's cost. "Any map" and "Both sides" are the average of the situations they cover.
 */
import { AGENTS, type Agent } from '../kb/agents.ts';
import { MAPS, POOL, mapById, parseNeeds, type MapInfo, type Side, type SiteId } from '../kb/maps.ts';
import { PRO, proKnown, proPick } from '../kb/pro.ts';
import { ALL_RANKS_T, rankOf, type RankId } from '../kb/ranks.ts';
import { DIMS, ROLE_IDS, type Dim, type Role } from '../kb/roles.ts';
import { PAIRS } from '../kb/synergy.ts';
import { BASE, BY_RANK, FIT, PAIR_STEP, ROLE_COST, SECOND_CONTROLLER } from './weights.ts';

export type MapPick = string; // a map id, or 'any'
export type SidePick = Side | 'both';
export type RankPick = RankId | 'any';

/** One situation to plan for. `sites` is empty for all of the map's sites. */
export interface Situation { map: MapPick; side: SidePick; sites: readonly SiteId[]; rank: RankPick }

export const N = AGENTS.length;
export const D = DIMS.length;
export const ROLES_N = ROLE_IDS.length;
export const roleIndex = (r: Role): number => ROLE_IDS.indexOf(r);

/** Per agent and strength: 1 − strength, which the search multiplies to find a team's coverage. */
export const MISS = new Float64Array(N * D);
/** Each agent's role, as an index into ROLE_IDS. */
export const ROLE_OF = new Uint8Array(N);
for (const a of AGENTS) {
  DIMS.forEach((d, j) => { MISS[a.index * D + j] = 1 - a.caps[d]; });
  ROLE_OF[a.index] = roleIndex(a.role);
}

export interface Model {
  situation: Situation;
  /** How much each strength matters (sums to 1). */
  weight: Float64Array;
  /** Each agent's own fit. */
  base: Float64Array;
  /** Pair synergy, both ways: pair[a * N + b]. */
  pair: Float64Array;
  /** The cost of `c` agents of role `r`: roleCost[r * 5 + min(c, 4)]. */
  roleCost: Float64Array;
  /** The parts that make up each agent's own fit, for the explanations. */
  fitParts: { pro: Float64Array; rank: Float64Array };
}

const t = (rank: RankPick) => (rank === 'any' ? ALL_RANKS_T : rankOf(rank).t);

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

/** Pro picks only count for a map whose numbers are from this year's play at full strength. */
const proShare = (map: string) => (PRO[map]?.dated ? 0.7 : 1);
/** −0.3 for an agent pros don't pick, about 0 at 9%, 0.7 for one picked every time. */
const proCurve = (pct: number) => Math.sqrt(pct / 100) - 0.3;

/** The agent fit parts for one map and rank. */
function agentFit(a: Agent, map: string, rankT: number): { pro: number; rank: number } {
  // a new agent's map and rank fit start neutral: there's no play to go on yet
  if (a.estimate) return { pro: 0, rank: 0 };
  // and an agent pros haven't had the chance to pick isn't pulled either way by pro play
  const pro = proKnown(a) ? FIT.pro * (FIT.proLow + (1 - FIT.proLow) * rankT) * proCurve(proPick(map, a.id)) * proShare(map) : 0;
  const rank = (1 - rankT) * (FIT.solo * (a.solo - 0.55) - FIT.skill * (a.skill - 0.5));
  return { pro, rank };
}

function single(map: MapInfo, side: Side, sites: readonly SiteId[], rankT: number) {
  const needs = needsFor(map, side, sites);
  const weight = new Float64Array(D);
  let sum = 0;
  DIMS.forEach((d, j) => {
    const [lo, hi] = BY_RANK[d];
    weight[j] = BASE[side][d] * Math.max(0.05, 1 + needs[d]) * (lo + (hi - lo) * rankT);
    sum += weight[j]!;
  });
  for (let j = 0; j < D; j++) weight[j]! /= sum;
  const pro = new Float64Array(N), rank = new Float64Array(N);
  for (const a of AGENTS) {
    const f = agentFit(a, map.id, rankT);
    pro[a.index] = f.pro;
    rank[a.index] = f.rank;
  }
  return { weight, pro, rank };
}

const cache = new Map<string, Model>();
export const situationKey = (s: Situation) => `${s.map}|${s.side}|${[...s.sites].sort().join('')}|${s.rank}`;

/** The numbers for a situation (kept, since the same ones are asked for again and again). */
export function modelFor(s: Situation): Model {
  const key = situationKey(s);
  const hit = cache.get(key);
  if (hit) return hit;
  const maps = s.map === 'any' ? POOL : [mapById(s.map) ?? MAPS[0]!];
  const sides: Side[] = s.side === 'both' ? ['attack', 'defense'] : [s.side];
  const rankT = t(s.rank);
  const weight = new Float64Array(D), pro = new Float64Array(N), rank = new Float64Array(N);
  const parts = maps.length * sides.length;
  for (const m of maps) {
    for (const side of sides) {
      const one = single(m, side, s.map === 'any' ? [] : s.sites, rankT);
      for (let j = 0; j < D; j++) weight[j]! += one.weight[j]! / parts;
      for (let i = 0; i < N; i++) { pro[i]! += one.pro[i]! / parts; rank[i]! += one.rank[i]! / parts; }
    }
  }
  const base = new Float64Array(N);
  for (let i = 0; i < N; i++) base[i] = pro[i]! + rank[i]!;
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
  const roleCost = new Float64Array(ROLES_N * 5);
  ROLE_IDS.forEach((r, ri) => {
    for (let c = 0; c < 5; c++) roleCost[ri * 5 + c] = sides.reduce((acc, side) => acc + ROLE_COST[r][side][c]!, 0) / sides.length;
  });
  const two = maps.filter((m) => m.twoControllers).length / maps.length;
  roleCost[roleIndex('controller') * 5 + 1]! -= two * SECOND_CONTROLLER * (FIT.proLow + (1 - FIT.proLow) * rankT);
  const model: Model = { situation: { ...s, sites: [...s.sites] }, weight, base, pair, roleCost, fitParts: { pro, rank } };
  if (cache.size > 200) cache.clear();
  cache.set(key, model);
  return model;
}
