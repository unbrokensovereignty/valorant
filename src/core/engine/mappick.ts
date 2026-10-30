/**
 * Map pick help: from the answers to "Find the best map", the maps a team should play and the ones
 * it should ban, each with why. A map to play says what the team's best comp there does well; a map
 * to ban says what that comp is short of next to the best comp for the map. Both are read off the
 * same score as the fits (explain.ts), so the reasons always match the ranking.
 */
import { mapById } from '../kb/maps.ts';
import { belowParts, explainTeam } from './explain.ts';
import { modelFor, type Situation } from './model.ts';
import { bestTeamFor, type SituationAnswer } from './plan.ts';
import { nothingFixed, type Query } from './query.ts';
import { BELOW_NOTE, MAP_PICK, tierOf } from './weights.ts';

export interface MapPick {
  map: string;
  /** The map's fit as the list of maps shows it: the best comp's, or a party's expected fit (both sides' average when the answers cover each side). */
  fit: number;
  tier: string;
  /** The side the reasons are about, when the answers cover each side. */
  side?: 'attack' | 'defense';
  /** The team's best comp on the map, and the best comp for the map (agent ids; empty when no comp fits). */
  team: string[];
  best: string[];
  /** A sentence before the reasons ('' for none). */
  lead: string;
  /** The reasons, biggest first. */
  why: string[];
}

export interface MapPicks {
  /** True when every map fits within MAP_PICK.gap of the others, so the pick makes little difference. */
  even: boolean;
  play: MapPick[];
  ban: MapPick[];
}

/**
 * Whether a question gets map pick help: a five-stack (only teams pick and ban maps, in Premier)
 * asking for the best map at one rank, with something chosen to tell the maps apart.
 */
export const asksMapPicks = (q: Query): boolean => q.party === 5 && q.map === 'best' && q.rank !== 'best' && !nothingFixed(q);

const fitOfAnswer = (a: SituationAnswer): number => a.comps[0]?.expected ?? a.comps[0]?.fit ?? -1;

/**
 * The maps to play and to ban, from one answer per situation (all at one rank). When the answers
 * cover each side of a map, the map's fit is the two sides' average, and its reasons come from the
 * side that decides it: the better side for a map to play, the worse for one to ban.
 */
export function mapPicks(answers: readonly SituationAnswer[], newAgents: boolean): MapPicks {
  const byMap = new Map<string, SituationAnswer[]>();
  for (const a of answers) byMap.set(a.situation.map, [...(byMap.get(a.situation.map) ?? []), a]);
  const maps = [...byMap].map(([map, list]) => ({ map, list, fit: list.reduce((t, a) => t + Math.max(0, fitOfAnswer(a)), 0) / list.length }))
    .sort((a, b) => b.fit - a.fit || a.map.localeCompare(b.map));
  const top = maps[0]?.fit ?? 0, bottom = maps[maps.length - 1]?.fit ?? 0;
  if (maps.length < 2 || top - bottom < MAP_PICK.gap) return { even: true, play: [], ban: [] };
  const sides = (list: readonly SituationAnswer[]) => list.length > 1;
  const play = maps.filter((x) => x.fit >= bottom + MAP_PICK.gap).slice(0, MAP_PICK.most).map((x): MapPick => {
    const a = [...x.list].sort((p, q) => fitOfAnswer(q) - fitOfAnswer(p))[0]!;
    return { map: x.map, fit: x.fit, tier: tierOf(x.fit), side: sides(x.list) ? side(a.situation) : undefined, ...toPlay(a, newAgents) };
  });
  const ban = maps.filter((x) => x.fit <= top - MAP_PICK.gap && !play.some((p) => p.map === x.map)).slice(-MAP_PICK.most).reverse().map((x): MapPick => {
    const a = [...x.list].sort((p, q) => fitOfAnswer(p) - fitOfAnswer(q))[0]!;
    return { map: x.map, fit: x.fit, tier: tierOf(x.fit), side: sides(x.list) ? side(a.situation) : undefined, ...toBan(a, answers, newAgents) };
  });
  return { even: false, play, ban };
}

/** The parts of the score that are the agents' own (see toBan). */
const AGENTS_OWN = ['win', 'rank'];

const side = (s: Situation): 'attack' | 'defense' => (s.side === 'defense' ? 'defense' : 'attack');

/** Why a map is worth playing: what the team's best comp there does well, on this map first. */
function toPlay(a: SituationAnswer, newAgents: boolean): { team: string[]; best: string[]; lead: string; why: string[] } {
  const c = a.comps[0]!, m = modelFor(a.situation);
  const best = bestTeamFor(m, newAgents);
  const same = best.length === c.team.length && best.every((id) => c.team.includes(id));
  const mapName = mapById(a.situation.map)?.name ?? a.situation.map;
  const lead = same ? `Your agents can play the comp that fits ${mapName} best.` : '';
  // the pros about this map in particular (its kit rules, what it rewards, its pro comps) come first
  const pros = explainTeam(m, c.team).pros;
  const why = [...pros.filter((p) => p.includes(mapName)), ...pros.filter((p) => !p.includes(mapName))];
  return { team: c.team, best, lead, why: why.slice(0, MAP_PICK.why) };
}

/**
 * Why a map is worth banning: where the team's best comp there falls further short of the best
 * comp for the map than it does on the other maps. Parts of the score that cost about the same on
 * every map say nothing about the map, so each part counts by how much more it costs here than on
 * the average map (`all`); and how hard the agents are to play and how often they win ranked games
 * are the agents' own, the same on every map, so they're left out.
 */
function toBan(a: SituationAnswer, all: readonly SituationAnswer[], newAgents: boolean): { team: string[]; best: string[]; lead: string; why: string[] } {
  const c = a.comps[0];
  if (!c) return { team: [], best: [], lead: `No comp fits all of your choices on ${mapById(a.situation.map)?.name ?? a.situation.map}.`, why: [] };
  const m = modelFor(a.situation), best = bestTeamFor(m, newAgents);
  const usual = new Map<string, number>();
  const others = all.filter((x) => x.comps[0]);
  for (const x of others) {
    const mx = modelFor(x.situation);
    for (const p of belowParts(mx, bestTeamFor(mx, newAgents), x.comps[0]!.team)) usual.set(p.key, (usual.get(p.key) ?? 0) + p.size / others.length);
  }
  const here = belowParts(m, best, c.team).map((p) => ({ ...p, more: p.size - (usual.get(p.key) ?? 0) }))
    .filter((p) => p.size < 0 && p.more <= -BELOW_NOTE.part && !AGENTS_OWN.includes(p.key)).sort((x, y) => x.more - y.more);
  // a map that costs no one part much more than the others gets the comp's biggest con there instead
  const why = here.length ? here.map((p) => p.words) : explainTeam(m, c.team).cons.slice(0, 1);
  return { team: c.team, best, lead: '', why: why.slice(0, MAP_PICK.why) };
}
