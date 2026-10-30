/**
 * What moved since the version this one is compared with (SINCE_FROM): for each situation Rankings
 * shows, the agents whose tier moved, the tier they had then and why, from since.gen.ts. That file is
 * made by tools/since.mjs, which finds the reason by undoing each of this version's changes in turn
 * and seeing which takes the fit back; the words for each reason are here, read off the same numbers
 * the score uses. The reasons, and REVIEWED, are rewritten for each version along with CHANGES in the tool.
 */
import { AGENTS, agentById, type Agent } from '../kb/agents.ts';
import { ruleApplies, ruleWhyAt, type ParsedRule } from '../kb/kitfit.ts';
import { mapById, POOL, type Side } from '../kb/maps.ts';
import { RANKS, rankOf } from '../kb/ranks.ts';
import { listJoin } from '../text.ts';
import { whereWords as where } from './explain.ts';
import { modelFor, type Situation } from './model.ts';
import type { AgentAnswer } from './plan.ts';
import { SINCE, SINCE_FROM } from './since.gen.ts';
import { KIT_RULE_NOTE, PRO_RISE, TIERS } from './weights.ts';

export { SINCE_FROM };

/** A tier counts as moved when it changed and the fit moved at least this much. */
export const SINCE_MOVE = 8;
/** A change is the reason a tier moved when undoing it takes back at least this share of the move. */
export const SINCE_SHARE = 0.4;

/** A tier that moved: the tier then, whether it went up, and why. */
export interface Since { from: string; up: boolean; why: string }

/** A short check of a situation's tiers, one letter per agent in AGENTS order, so a stale since.gen.ts shows. */
export function tierSignature(tiers: string): string {
  let h = 2166136261;
  for (const ch of tiers) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h.toString(36).padStart(7, '0');
}

/** The situations since.gen.ts covers: those Rankings shows, for a five-stack with nothing else fixed. */
export const sinceKey = (s: Situation): string | undefined => (s.sites.length || s.enemy?.length ? undefined : `${s.map}|${s.side}|${s.rank}`);

/** The mark since.gen.ts keeps for an agent in a situation, when their tier moved. */
function markOf(s: Situation, ans: AgentAnswer): { a: Agent; from: string; up: boolean; code: string } | undefined {
  const key = sinceKey(s);
  const mark = key ? SINCE[key]?.split(' ').slice(1).find((x) => x.startsWith(`${ans.id}:`)) : undefined;
  const a = agentById(ans.id);
  if (!mark || !a) return undefined;
  const from = mark.charAt(ans.id.length + 1), code = mark.slice(ans.id.length + 2);
  const order = TIERS.map((t) => t.id);
  if (from === ans.tier || !order.includes(from)) return undefined;
  return { a, from, up: order.indexOf(ans.tier) < order.indexOf(from), code };
}

/** How an agent's tier in a situation moved since SINCE_FROM, from their answer there; undefined when it didn't. */
export function sinceOf(s: Situation, ans: AgentAnswer): Since | undefined {
  const k = markOf(s, ans);
  return k && { from: k.from, up: k.up, why: whyOf(k.code, s, k.a, ans.team, k.up, false) };
}

/** A situation's moves, in the agents' order, with those that moved the same way for the same reason told once. */
export function sinceMoves(s: Situation, agents: readonly AgentAnswer[]): { agents: { ans: AgentAnswer; since: Since }[]; why: string }[] {
  const groups = new Map<string, { agents: { ans: AgentAnswer; since: Since }[]; why: string }>();
  for (const ans of agents) {
    const k = markOf(s, ans);
    if (!k) continue;
    const since = { from: k.from, up: k.up, why: whyOf(k.code, s, k.a, ans.team, k.up, false) };
    const many = whyOf(k.code, s, k.a, ans.team, k.up, true);
    const g = groups.get(many);
    if (g) g.agents.push({ ans, since });
    else groups.set(many, { agents: [{ ans, since }], why: many });
  }
  return [...groups.values()].map((g) => (g.agents.length === 1 ? { ...g, why: g.agents[0]!.since.why } : g));
}

/**
 * Agents whose own numbers changed in this version (agents.ts), and how, as a clause. tools/since.mjs
 * finds them by comparing agents.ts with the release it compares with; each one needs a line here.
 */
export const REVIEWED: Record<string, string> = {};

/** Each change in a few words, for a move two of them share. */
const SHORT: Record<string, string> = {
  r: 'each rank taking in the games of the ranks next to it',
  p: `pro teams’ role mix counting in full from ${rankOf(PRO_RISE.until).name}`,
  k: 'reviewed kit rules',
  n: 'reviewed numbers for some agents',
};

const sidesOf = (s: Situation): Side[] => (s.side === 'both' ? ['attack', 'defense'] : [s.side]);

/** The maps a kit rule applies on in a situation, for its reason. */
const mapsOf = (r: ParsedRule, s: Situation): string[] =>
  (s.map === 'any' ? POOL.map((m) => m.id) : [s.map]).filter((map) => sidesOf(s).some((side) => ruleApplies(r, map, side, [])));

/** Why an agent's tier moved, from its code in since.gen.ts; `many` words it for several agents that moved together. */
function whyOf(code: string, s: Situation, a: Agent, team: readonly string[], up: boolean, many: boolean): string {
  const m = modelFor(s);
  const sign = up ? 1 : -1;
  const who = many ? 'them' : a.name, theirs = many ? 'theirs' : `${a.name}’s`;
  // an agent's own numbers, or another's that came out stronger (n+) or weaker (n-) here
  if (code === 'n' || /^n[+-]/.test(code)) {
    const other = agentById(code.slice(2));
    if (!other || other.id === a.id) return REVIEWED[a.id] ? `${REVIEWED[a.id]}.` : `Some agents’ numbers were reviewed, which moved the comps ${a.name} fits into.`;
    const what = REVIEWED[other.id] ?? `${other.name}’s numbers were reviewed`;
    const stronger = code.charAt(1) === '+';
    // stronger and up, or weaker and down: they go together; otherwise one makes room for the other
    if (stronger === up) return `${what}, which ${up ? `lifts ${who}` : `takes ${who} down`} with ${other.name}.`;
    return up ? `${what}, which makes room for ${who}.` : `${what}, so comps with ${other.name} pull ahead of ${theirs}.`;
  }
  switch (code) {
    case 'r': {
      const r = RANKS.findIndex((x) => x.id === s.rank);
      const near = [RANKS[r - 1], RANKS[r + 1]].filter((x) => !!x).map((x) => x!.name);
      return `Ranked games mix players of neighboring ranks, so the answers at ${RANKS[r]!.name} now take in some games at ${listJoin(near)} too, where ${many ? 'they fit' : `${a.name} fits`} ${up ? 'better' : 'less well'}.`;
    }
    case 'p': {
      const from = rankOf(PRO_RISE.until).name, map = mapById(s.map);
      const mix = `The role mix pro teams play ${map ? `on ${map.name}` : 'on each map'} counts for more with each rank up now, in full from ${from} like their second controller`;
      return up ? `${mix}, so comps built like theirs lift ${who}.` : `${mix}, so comps built like theirs pull ahead of ${theirs}.`;
    }
    case 'k': {
      // the agent's own kit rule here that pushes the way they moved, or the other agents' that push them out (or let them in)
      const own = m.kit[a.index]!.filter((k) => k.gain * sign >= KIT_RULE_NOTE.gain).sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain))[0];
      if (own) return ruleWhyAt(own.rule, mapsOf(own.rule, s));
      // (never someone in their own best comp: those go up and down with them)
      const others = AGENTS.filter((o) => o.index !== a.index && !o.estimate && !team.includes(o.id))
        .map((o) => ({ o, gain: m.kit[o.index]!.reduce((acc, k) => acc + k.gain, 0) }))
        .filter((x) => -x.gain * sign >= KIT_RULE_NOTE.gain).sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain)).slice(0, 2);
      if (!others.length) return `Some kit rules were reviewed, and the comps that gain from it ${up ? 'fall behind' : 'pull ahead of'} ${theirs} ${where(s)}.`;
      const whose = `${listJoin(others.map((x) => `${x.o.name}’s`))} ${others.length > 1 ? 'kits do' : 'kit does'}`;
      return up
        ? `Some kit rules were reviewed, and ${whose} less ${where(s)}, which makes room for ${who}.`
        : `Some kit rules were reviewed, and ${whose} more ${where(s)}, so comps with ${listJoin(others.map((x) => x.o.name), 'or')} pull ahead of ${theirs}.`;
    }
    default: {
      const two = [...code].map((c) => SHORT[c]).filter((x): x is string => !!x);
      return two.length
        ? `Several changes add up here, most of all ${listJoin(two)}.`
        : 'Several changes moved it together, none of them on its own.';
    }
  }
}
