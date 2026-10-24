/**
 * Why a team scores as it does, in plain words: its strengths and gaps for the situation, the
 * pairs that help or clash, role counts, rank and how close it is to what pros play. Everything
 * here comes from the same numbers the score does, so the reasons always match the ranking.
 */
import { AGENTS, agentById, type Agent } from '../kb/agents.ts';
import { abilityNames } from '../kb/kits.ts';
import { mapById, type Side } from '../kb/maps.ts';
import { PRO } from '../kb/pro.ts';
import { ALL_RANKS_T, rankOf } from '../kb/ranks.ts';
import { DIMS, DIM_INFO, ROLE_IDS, type Dim, type Role } from '../kb/roles.ts';
import { pairOf } from '../kb/synergy.ts';
import { listJoin } from '../text.ts';
import { D, MISS, needsFor, type Model } from './model.ts';

export interface StrengthRow {
  dim: Dim;
  /** How much the situation needs it, relative to an even share (1 = average). */
  need: number;
  /** How well the team covers it, 0 to 1. */
  cover: number;
  /** The agents who bring it, strongest first. */
  by: { id: string; value: number; abilities: string[] }[];
}

export interface Explanation {
  strengths: StrengthRow[];
  pros: string[];
  cons: string[];
  /** Things worth knowing that aren't good or bad (a new agent's numbers, say). */
  notes: string[];
}

/** How to play around a gap, by strength. */
const MAKE_UP: Record<Dim, string> = {
  smoke: 'take fights from cover and avoid crossing open ground',
  wall: 'cross long sightlines one at a time, or smoke them off',
  flash: 'jiggle-peek for information and trade each other closely',
  recon: 'clear corners together and don’t rush in blind',
  entry: 'use utility to take space instead of the first fight',
  clear: 'check close corners one by one before planting',
  disrupt: 'lean on flashes and trades to win the first fight',
  stall: 'play a little further back so a rush can’t run you over',
  anchor: 'hold sites in pairs and rotate early',
  flank: 'leave one player to watch the flank',
  retake: 'save utility for the retake and retake together',
  postplant: 'play crossfires on the Spike after planting',
  sustain: 'play for trades so no one is left low on health',
  duel: 'play together and trade every fight',
  mobility: 'commit to sites early instead of late rotations',
};

const ROLE_GAP: Record<Role, { none: string; many: string }> = {
  controller: { none: 'No controller: nobody can smoke off sightlines, so every push walks into open angles.', many: 'Three or more controllers leave little firepower or information.' },
  duelist: { none: 'No duelist: someone has to take the first fight without the tools for it.', many: 'Three or more duelists bring plenty of firepower but little utility.' },
  initiator: { none: 'No initiator: there are no flashes or information to set up fights.', many: 'Three or more initiators overlap: the utility outweighs the firepower.' },
  sentinel: { none: 'No sentinel: nobody watches the flank or holds a site alone.', many: 'Three or more sentinels play too passively to take space.' },
};

const nameOf = (a: Agent) => a.name;
const sideWord = (s: Side) => (s === 'attack' ? 'attack' : 'defense');

function agentWithAbility(a: Agent, dim: Dim): string {
  const names = abilityNames(a.id, a.via[dim] ?? '');
  return names.length ? `${a.name} (${listJoin(names)})` : a.name;
}

/** Explains a team (agent ids) in a situation's model. */
export function explainTeam(m: Model, ids: readonly string[]): Explanation {
  const team = ids.map((id) => agentById(id)).filter((a): a is Agent => !!a);
  const s = m.situation;
  const t = s.rank === 'any' ? ALL_RANKS_T : rankOf(s.rank).t;
  const map = mapById(s.map);
  const sides: Side[] = s.side === 'both' ? ['attack', 'defense'] : [s.side];
  // what this map, side and site ask for beyond the usual
  const bumps = map ? sides.map((side) => needsFor(map, side, s.sites)) : [];
  const bump = (d: Dim) => (bumps.length ? bumps.reduce((acc, b) => acc + b[d], 0) / bumps.length : 0);

  const strengths: StrengthRow[] = DIMS.map((dim, j) => {
    let miss = 1;
    for (const a of team) miss *= MISS[a.index * D + j]!;
    const by = team.filter((a) => a.caps[dim] >= 0.3).sort((x, y) => y.caps[dim] - x.caps[dim])
      .map((a) => ({ id: a.id, value: a.caps[dim], abilities: abilityNames(a.id, a.via[dim] ?? '') }));
    return { dim, need: m.weight[j]! * D, cover: 1 - miss, by };
  });

  const pros: string[] = [], cons: string[] = [], notes: string[] = [];
  const where = map ? map.name : 'most maps';
  // role counts first: missing a controller matters more than anything else
  const counts = Object.fromEntries(ROLE_IDS.map((r) => [r, team.filter((a) => a.role === r).length])) as Record<Role, number>;
  for (const r of ROLE_IDS) {
    if (counts[r] === 0 && (r !== 'sentinel' || s.side !== 'attack') && (r !== 'duelist' || s.side !== 'defense')) cons.push(ROLE_GAP[r].none);
    else if (counts[r] >= 3) cons.push(ROLE_GAP[r].many);
  }
  // strengths the situation needs and the team has
  for (const row of strengths.filter((r) => r.need >= 1 && r.cover >= 0.8).sort((a, b) => b.need * b.cover - a.need * a.cover).slice(0, 3)) {
    const who = row.by.filter((b) => b.value >= 0.45).slice(0, 2).map((b) => agentWithAbility(agentById(b.id)!, row.dim));
    const rewarded = bump(row.dim) >= 0.15 ? `, which ${where} rewards` : '';
    pros.push(`Strong ${DIM_INFO[row.dim].has}${rewarded}${who.length ? `: ${listJoin(who)}` : ''}.`);
  }
  // gaps the situation would punish
  for (const row of strengths.filter((r) => r.need >= 0.9 && r.cover < 0.55).sort((a, b) => b.need * (1 - b.cover) - a.need * (1 - a.cover)).slice(0, 3)) {
    const info = DIM_INFO[row.dim];
    const lead = row.cover < 0.25 ? 'No' : info.few ? 'Few' : 'Little';
    cons.push(`${lead} ${info.lacks}${bump(row.dim) >= 0.15 ? `, which ${where} needs` : ''}: ${MAKE_UP[row.dim]}.`);
  }
  // pairs
  const pairs: { strength: number; why: string }[] = [];
  for (let i = 0; i < team.length; i++) {
    for (let k = i + 1; k < team.length; k++) {
      const p = pairOf(team[i]!.id, team[k]!.id);
      if (!p || (p.side !== 'both' && !sides.includes(p.side))) continue;
      pairs.push({ strength: p.strength, why: p.side === 'both' || sides.length === 1 ? p.why : `On ${sideWord(p.side)}: ${p.why}` });
    }
  }
  for (const p of pairs.filter((x) => x.strength > 0).sort((a, b) => b.strength - a.strength).slice(0, 2)) pros.push(p.why);
  for (const p of pairs.filter((x) => x.strength < 0).sort((a, b) => a.strength - b.strength).slice(0, 1)) cons.push(p.why);
  // rank
  const rankName = s.rank === 'any' ? '' : rankOf(s.rank).name;
  if (rankName && t <= 0.4) {
    const hard = team.filter((a) => a.skill >= 0.75 && !a.estimate);
    if (hard.length) cons.push(`${listJoin(hard.map(nameOf))} ${hard.length === 1 ? 'takes' : 'take'} practice to play well at ${rankName}: worth it only if someone plays ${hard.length === 1 ? 'that agent' : 'those agents'} often.`);
    const easy = team.filter((a) => a.solo >= 0.8 && !a.estimate);
    if (easy.length) pros.push(`${listJoin(easy.map(nameOf))} ${easy.length === 1 ? 'works' : 'work'} well without much teamwork, which suits ${rankName}.`);
  }
  if (rankName && t >= 0.75) {
    const selfish = team.filter((a) => a.solo >= 0.85 && a.role === 'duelist' && a.caps.flash + a.caps.disrupt + a.caps.smoke < 0.5);
    if (selfish.length) cons.push(`${listJoin(selfish.map(nameOf))} ${selfish.length === 1 ? 'brings' : 'bring'} little utility, and teams at ${rankName} punish that.`);
  }
  // pro play
  const pro = map ? PRO[map.id] : undefined;
  if (pro) {
    const set = new Set(team.map((a) => a.id));
    const overlap = Math.max(0, ...pro.comps.map((c) => c.filter((x) => set.has(x)).length));
    if (overlap === 5) pros.push(`Pro teams play this comp on ${map!.name}.`);
    else if (overlap === 4) pros.push(`Four of these five are a comp pro teams play on ${map!.name}.`);
  }
  for (const a of team.filter((x) => x.estimate)) notes.push(`${a.name} is new, so ${a.name}’s numbers are early estimates and will change once there’s more play to go on.`);
  return { strengths, pros, cons, notes };
}

/** The agents in a team: indices to ids. */
export const teamIds = (team: readonly number[]): string[] => team.map((i) => AGENTS[i]!.id);
