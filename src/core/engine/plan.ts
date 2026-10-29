/**
 * Answers a query: for each situation it covers, the best comps (or party picks, for a duo or
 * trio) and how every agent ranks. Scores become fits on a 0 to 100 scale against all possible
 * teams for the same situation, so a 90 means the same thing on every map.
 */
import { AGENTS, agentById } from '../kb/agents.ts';
import { rankOf } from '../kb/ranks.ts';
import { ROLE_IDS } from '../kb/roles.ts';
import { clamp } from '../util.ts';
import { modelFor, situationKey, type Model, type Situation } from './model.ts';
import { askFor, searchParties, type PartyRules } from './party.ts';
import type { Query } from './query.ts';
import { anyRoles, scoreTeam, searchTeams, type Rules } from './search.ts';
import { AGENT_STRETCH, FIT_MID, tierOf } from './weights.ts';

export interface Reference { best: number; mid: number }

const refs = new Map<string, Reference>();
/** The best and middle scores of all teams for a situation, the yardstick for fits. */
export function referenceFor(m: Model, newAgents: boolean): Reference {
  const key = `${situationKey(m.situation)}|${newAgents}`;
  const hit = refs.get(key);
  if (hit) return hit;
  const r = searchTeams(m, { include: [], roles: anyRoles(), allowed: (i) => newAgents || !AGENTS[i]!.estimate }, 1);
  const ref = { best: r.best, mid: r.mid };
  if (refs.size > 300) refs.clear();
  refs.set(key, ref);
  return ref;
}

/** A team score as a fit: 100 for the best possible team, 50 for the middle of all teams. */
export function fitOf(score: number, ref: Reference): number {
  const span = ref.best - ref.mid;
  if (span <= 0) return 100;
  return clamp(FIT_MID + (100 - FIT_MID) * ((score - ref.mid) / span), 0, 100);
}

/**
 * An agent's fit: from the best team it fits into, spread out so agents are easier to tell apart
 * (the other four can make up for a lot, so best-team fits sit close together).
 */
export function agentFitOf(bestScore: number, ref: Reference): number {
  const span = ref.best - ref.mid;
  if (span <= 0) return 100;
  return clamp(100 - AGENT_STRETCH * ((ref.best - bestScore) / span) * (100 - FIT_MID), 0, 100);
}

export interface CompAnswer {
  /**
   * The team (five-stack), or for a duo or trio, your party with the best agents for your random
   * teammates to pick. Agent ids.
   */
  team: string[];
  /** Your party, for a duo or trio (empty for a five-stack). */
  party: string[];
  fit: number;
  tier: string;
  score: number;
  /**
   * Duo or trio: the fit of the team you'd expect with random teammates, against the best possible
   * five-stack (`fit` then ranks the party against the best party for the situation).
   */
  expected?: number;
  /** Duo or trio: how much the fit swings with random teammates. */
  spread?: number;
  /** Duo or trio: the fit of `team`, your party with the best picks for your random teammates. */
  pickFit?: number;
  /** Duo or trio: other good picks for your random teammates (the full teams, next best first), with their fits. */
  others?: { team: string[]; fit: number }[];
  /** Duo or trio: the team you'd most likely get if your teammates pick on their own, and its fit. */
  likely?: { team: string[]; fit: number };
}

export interface AgentAnswer { id: string; fit: number; tier: string; team: string[] }

export interface SituationAnswer {
  situation: Situation;
  ref: Reference;
  comps: CompAnswer[];
  agents: AgentAnswer[];
  /** How many teams (or parties) the rules allowed. */
  count: number;
  /**
   * Duo or trio: the roles to hope random teammates pick, best first. Only roles the best party's
   * picks play, so the role to ask for is never one the picks leave out.
   */
  askFor?: { role: string; fit: number; chance: number }[];
}

const index = (id: string) => agentById(id)!.index;
const idsOf = (xs: readonly number[]) => xs.map((i) => AGENTS[i]!.id);

/**
 * Whether each player can take a different agent of `team` from their own pool (an empty pool
 * takes anyone): a matching of players to agents, found by trying each player in turn.
 */
export function poolsFit(pools: readonly (readonly number[])[]): ((team: Int32Array | readonly number[], size: number) => boolean) | undefined {
  if (!pools.length) return undefined;
  const sets = pools.map((p) => (p.length ? new Set(p) : null));
  return (team, size) => {
    const used = new Array(size).fill(false);
    const place = (player: number): boolean => {
      if (player === sets.length) return true;
      const pool = sets[player];
      for (let k = 0; k < size; k++) {
        if (used[k] || (pool && !pool.has(team[k]!))) continue;
        used[k] = true;
        if (place(player + 1)) return true;
        used[k] = false;
      }
      return false;
    };
    return place(0);
  };
}

/** The rules a query sets for the agents you pick. */
export function rulesOf(q: Query): Rules {
  const include = q.include.filter((a) => agentById(a)).map(index);
  const banned = new Set([...q.exclude, ...q.locked].filter((a) => agentById(a)).map(index));
  const pools = q.pools.length === q.party ? q.pools.map((p) => p.filter((a) => agentById(a)).map(index)) : [];
  // with pools, only agents someone plays can be picked (unless a player plays anyone)
  const played = !pools.length || pools.some((p) => !p.length) ? null : new Set(pools.flat());
  return {
    include,
    roles: ROLE_IDS.map((r) => q.roles[r] ?? -1),
    allowed: (i) => !banned.has(i) && (q.newAgents || !AGENTS[i]!.estimate) && (!played || played.has(i)),
    fits: poolsFit(pools),
  };
}

const rankT = (s: Situation) => rankOf(s.rank).t;

/** Answers one situation of a query. `keep` is how many comps to return. */
export function solve(q: Query, s: Situation, keep: number): SituationAnswer {
  const m = modelFor(s);
  const ref = referenceFor(m, q.newAgents);
  const rules = rulesOf(q);
  /** Agents ranked by the best team (or party) they're in, against `top` (the best of those). */
  const agentAnswers = (best: readonly ({ score: number; team: number[] } | null)[], top: Reference): AgentAnswer[] =>
    best.flatMap((b, i) => {
      if (!b) return [];
      const fit = agentFitOf(b.score, top);
      return [{ id: AGENTS[i]!.id, fit, tier: tierOf(fit), team: idsOf(b.team) }];
    }).sort((a, b) => b.fit - a.fit || a.id.localeCompare(b.id));
  if (q.party === 5) {
    const r = searchTeams(m, rules, Math.max(keep, 1));
    const comps = r.top.slice(0, keep).map((t): CompAnswer => {
      const fit = fitOf(t.score, ref);
      return { team: idsOf(t.agents), party: [], fit, tier: tierOf(fit), score: t.score };
    });
    return { situation: s, ref, comps, agents: agentAnswers(r.bestWith.map((t) => t && { score: t.score, team: t.agents }), ref), count: r.count };
  }
  const prules: PartyRules = {
    ...rules,
    locked: q.locked.filter((a) => agentById(a)).map(index),
    // random teammates may pick anyone not already locked, except agents left out as too new
    fillable: (i) => q.newAgents || !AGENTS[i]!.estimate,
  };
  const r = searchParties(m, prules, q.party, rankT(s), Math.max(keep, 1));
  const top = r.top[0];
  // random teammates keep every party below the best five-stack, so parties are ranked against the best party
  const partyRef = { best: top?.expected ?? ref.best, mid: ref.mid };
  const comps = r.top.slice(0, keep).map((p): CompAnswer => {
    const fit = fitOf(p.expected, partyRef);
    return {
      team: idsOf(p.best.agents), party: idsOf(p.party), fit, tier: tierOf(fit), score: p.expected, expected: fitOf(p.expected, ref),
      spread: (p.spread / Math.max(1e-9, ref.best - ref.mid)) * (100 - FIT_MID), pickFit: fitOf(p.best.score, ref),
      others: p.others.map((t) => ({ team: idsOf(t.agents), fit: fitOf(t.score, ref) })),
      likely: { team: idsOf(p.likely.agents), fit: fitOf(p.likely.score, ref) },
    };
  });
  const picked = new Set<string>(top ? top.best.agents.filter((a) => !top.party.includes(a) && !prules.locked.includes(a)).map((a) => AGENTS[a]!.role) : []);
  const ask = top ? askFor(m, top.party, prules, rankT(s)).filter((x) => picked.has(x.role)).map((x) => ({ role: x.role, fit: fitOf(x.expected, ref), chance: x.chance })) : undefined;
  return {
    situation: s, ref, comps, count: r.count, askFor: ask,
    agents: agentAnswers(r.bestWith.map((p) => p && { score: p.expected, team: p.best.agents }), partyRef),
  };
}

/** The fit of one given team (agent ids) in a situation, as the answers would show it. */
export function teamFit(s: Situation, ids: readonly string[], newAgents: boolean): { fit: number; tier: string } {
  const m = modelFor(s);
  const team = ids.filter((id) => agentById(id)).map(index);
  const fit = fitOf(scoreTeam(m, team), referenceFor(m, newAgents));
  return { fit, tier: tierOf(fit) };
}
