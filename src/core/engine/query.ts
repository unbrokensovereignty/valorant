/**
 * What you ask the planner. Every field can be given ("Haven"), left open ("Any map", "Both
 * sides") or asked for ("Find the best map"), which is what lets any input be an output too: fix a
 * trio and ask for the best map, or fix the map and ask for the best trio. The rank is always given
 * or asked for: a team plays differently at each rank, so no one answer fits them all.
 */
import { isAgent, agentById } from '../kb/agents.ts';
import { isMap, mapById, MAPS, POOL, type SiteId } from '../kb/maps.ts';
import { isRank, RANK_IDS, type RankId } from '../kb/ranks.ts';
import { ROLE_IDS, type Role } from '../kb/roles.ts';
import { isRecord } from '../util.ts';
import type { Situation, SidePick } from './model.ts';

export type PartySize = 2 | 3 | 5;
export const PARTY_SIZES: readonly { id: PartySize; name: string }[] = [{ id: 5, name: 'Five-stack' }, { id: 3, name: 'Trio' }, { id: 2, name: 'Duo' }];

export interface Query {
  /** A map id, 'any' or 'best'. */
  map: string;
  side: SidePick | 'best';
  /** Sites to plan for on the chosen map; none means all of them. */
  sites: SiteId[];
  rank: RankId | 'best';
  party: PartySize;
  /** Agents that must be in your party (or team, for a five-stack). */
  include: string[];
  /** Agents your party won't play. */
  exclude: string[];
  /** Teammates' agents already locked in (duo and trio). */
  locked: string[];
  /** An exact count for a role, in your party (or team, for a five-stack). */
  roles: Partial<Record<Role, number>>;
  /**
   * The agents each player in your party plays, one list per player (an empty list: anyone).
   * Empty when not planning for a saved party.
   */
  pools: string[][];
  /** Include agents too new for much play (their numbers are early estimates). */
  newAgents: boolean;
  /** "Any map" and "Find the best map" cover all maps, not just the competitive pool. */
  allMaps: boolean;
  /** The other team's agents, as far as they're known (kb/counters.ts says what they make you play around). */
  enemy: string[];
}

export const newQuery = (rank: RankId = 'gold', newAgents = true): Query => ({
  map: 'any', side: 'both', sites: [], rank, party: 5, include: [], exclude: [], locked: [], roles: {}, pools: [], newAgents, allMaps: false, enemy: [],
});

const ids = (v: unknown, ok: (x: unknown) => boolean, max: number): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && ok(x)))].slice(0, max) : [];

/** A query made safe: unknown values fall back to the defaults, and the parts that clash are dropped. */
export function sanitizeQuery(x: unknown): Query {
  const q = newQuery();
  if (!isRecord(x)) return q;
  if (x.map === 'any' || x.map === 'best' || isMap(x.map)) q.map = x.map as string;
  if (x.side === 'attack' || x.side === 'defense' || x.side === 'both' || x.side === 'best') q.side = x.side;
  if (x.rank === 'best' || isRank(x.rank)) q.rank = x.rank;
  // a question from 0.2.0 or before could be for all ranks, which planned as Platinum does
  else if (x.rank === 'any') q.rank = 'platinum';
  if (x.party === 2 || x.party === 3 || x.party === 5) q.party = x.party;
  q.newAgents = x.newAgents !== false;
  q.allMaps = x.allMaps === true;
  const map = mapById(q.map);
  q.sites = map ? ids(x.sites, (s) => map.sites.some((m) => m.id === s), 3) as SiteId[] : [];
  if (map && q.sites.length === map.sites.length) q.sites = [];
  q.include = ids(x.include, isAgent, q.party);
  q.locked = q.party === 5 ? [] : ids(x.locked, (a) => isAgent(a) && !q.include.includes(a as string), 5 - q.party);
  q.exclude = ids(x.exclude, (a) => isAgent(a) && !q.include.includes(a as string) && !q.locked.includes(a as string), 25);
  if (isRecord(x.roles)) {
    for (const r of ROLE_IDS) {
      const n = x.roles[r];
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= q.party) q.roles[r] = n;
    }
  }
  // one pool per player, or none at all
  if (Array.isArray(x.pools) && x.pools.length === q.party) q.pools = x.pools.map((p) => ids(p, isAgent, 30));
  if (q.pools.every((p) => !p.length)) q.pools = [];
  // both teams can play the same agent, so theirs don't limit yours
  q.enemy = ids(x.enemy, isAgent, 5);
  return fixRoles(q);
}

/**
 * The places that role counts and must-play agents take up together: each role with a count takes
 * that many, or more if more of its agents must play, and each other must-play agent takes one.
 */
export function placesTaken(include: readonly string[], roles: Query['roles']): number {
  let n = 0;
  for (const r of ROLE_IDS) {
    const have = include.filter((a) => agentById(a)?.role === r).length;
    n += Math.max(roles[r] ?? 0, have);
  }
  return n;
}

/** Role counts that can't add up (below what's already included, or more than the party has room for) are dropped. */
function fixRoles(q: Query): Query {
  for (const r of ROLE_IDS) {
    const want = q.roles[r];
    if (want === undefined) continue;
    const have = q.include.filter((a) => agentById(a)?.role === r).length;
    if (have > want) delete q.roles[r];
  }
  if (placesTaken(q.include, q.roles) > q.party) q.roles = {};
  return q;
}

/** The maps "Any map" and "Find the best map" cover. */
export const mapsFor = (q: Pick<Query, 'allMaps'>) => (q.allMaps ? MAPS : POOL);

/** Each situation the query asks about: one, or one for every value of a field it asks the best of. */
export function situationsOf(q: Query): Situation[] {
  const maps = q.map === 'best' ? mapsFor(q).map((m) => m.id) : [q.map];
  const sides: SidePick[] = q.side === 'best' ? ['attack', 'defense'] : [q.side];
  const ranks: RankId[] = q.rank === 'best' ? [...RANK_IDS] : [q.rank];
  const out: Situation[] = [];
  for (const map of maps) for (const side of sides) for (const rank of ranks) out.push({ map, side, rank, sites: maps.length === 1 && map !== 'any' ? q.sites : [], enemy: q.enemy });
  return out;
}

/** Fields the query asks the best of. */
export const asksBest = (q: Query): ('map' | 'side' | 'rank')[] =>
  (['map', 'side', 'rank'] as const).filter((k) => q[k] === 'best');

/** True when nothing is fixed, so every situation has a comp that fits it fully (comparing them says nothing). */
export const nothingFixed = (q: Query): boolean =>
  q.party === 5 && !q.include.length && !q.exclude.length && !Object.keys(q.roles).length && !q.pools.length;

