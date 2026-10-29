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
import { DIMS, DIM_INFO, ROLE_IDS, roleOf, type Dim, type Role } from '../kb/roles.ts';
import { pairOf } from '../kb/synergy.ts';
import { listJoin } from '../text.ts';
import { D, kitShare, needsFor, type Model } from './model.ts';
import { KIT_NOTE, KIT_RULE_NOTE, MIX_NOTE, THREAT_NOTE, WIN_NOTE } from './weights.ts';
import { ruleWhy } from '../kb/kitfit.ts';
import { threatLine } from '../kb/counters.ts';

export interface StrengthRow {
  dim: Dim;
  /** How much the situation needs it, relative to an even share (1 = average). */
  need: number;
  /** How well the team covers it, 0 to 1. */
  cover: number;
  /** The agents who bring it, strongest first. */
  by: { id: string; value: number; abilities: string[] }[];
}

/** One thing the other team makes you play around, and how much of the answer a comp has. */
export interface AgainstRow {
  id: string;
  /** "Their Chamber holds long angles with the Operator". */
  threat: string;
  /** How far the threat goes, 0 to 1. */
  level: number;
  /** How much of what answers it the comp covers, 0 to 1, as much as each strength counts. */
  answered: number;
  /** answered, as a word: the comp has the answer, part of it or little of it (see THREAT_NOTE). */
  verdict: 'answered' | 'partly' | 'little';
  /** Who in the comp answers it, by the ability that does: "Omen’s Dark Cover", strongest first. */
  by: string[];
  /** How to play around it. */
  advice: string;
}

export interface Explanation {
  strengths: StrengthRow[];
  pros: string[];
  cons: string[];
  /** Things worth knowing that aren't good or bad (a new agent's numbers, say). */
  notes: string[];
  /** What the other team makes you play around, most first (empty when their agents aren't known). */
  against: AgainstRow[];
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
  angles: 'take long fights with a rifle from cover, or smoke the long sightlines off',
  mobility: 'commit to sites early instead of late rotations',
};

/**
 * What having none of a role costs a team (`none`, and `so`, what follows when there's no advice to
 * give instead), the strengths whose gaps that already covers, and what three or more of it costs.
 */
const ROLE_GAP: Record<Role, { none: string; so?: string; dims: readonly Dim[]; many: string }> = {
  controller: {
    none: 'nobody can smoke off sightlines', so: 'every push walks into open angles', dims: ['smoke', 'wall'],
    many: 'Three or more controllers leave little firepower or information.',
  },
  duelist: { none: 'someone has to take the first fight without the tools for it', dims: ['entry'], many: 'Three or more duelists bring plenty of firepower but little utility.' },
  initiator: { none: 'there are no flashes or information to set up fights', dims: ['flash', 'recon'], many: 'Three or more initiators overlap: the utility outweighs the firepower.' },
  sentinel: { none: 'nobody watches the flank or holds a site alone', dims: ['anchor', 'flank'], many: 'Three or more sentinels play too passively to take space.' },
};

const nameOf = (a: Agent) => a.name;
const sideWord = (s: Side) => (s === 'attack' ? 'attack' : 'defense');

function agentWithAbility(a: Agent, dim: Dim): string {
  const keys = a.via[dim] ?? '';
  const names = [...abilityNames(a.id, keys), ...(keys.includes('G') ? ['gun play'] : [])];
  return names.length ? `${a.name} (${listJoin(names)})` : a.name;
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** What fewer or more of a role than pros run on a map costs a team. */
const MIX_GAP: Record<Role, { fewer: string; more: string }> = {
  controller: { fewer: 'there are fewer smokes to go around', more: 'the extra smokes cost firepower or information' },
  duelist: { fewer: 'there’s less firepower to take space', more: 'the extra duelist costs utility' },
  initiator: { fewer: 'there’s less information and fewer flashes to set up fights', more: 'the extra initiator costs firepower' },
  sentinel: { fewer: 'nobody is free to watch the flank or hold a site alone', more: 'the extra sentinel makes the team slower to take space' },
};

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
    for (const a of team) miss *= m.miss[a.index * D + j]!;
    // what each agent brings to it at this rank, as the score counts it
    const by = team.map((a) => ({ a, value: 1 - m.miss[a.index * D + j]! })).filter((x) => x.value >= 0.3).sort((x, y) => y.value - x.value)
      .map(({ a, value }) => ({ id: a.id, value, abilities: abilityNames(a.id, a.via[dim] ?? '') }));
    return { dim, need: m.weight[j]! * D, cover: 1 - miss, by };
  });

  const pros: string[] = [], cons: string[] = [], notes: string[] = [];
  const where = map ? map.name : 'most maps';
  // gaps the situation would punish, biggest first
  const gaps = strengths.filter((r) => r.need >= 0.9 && r.cover < 0.55).sort((a, b) => b.need * (1 - b.cover) - a.need * (1 - a.cover));
  // role counts first: missing a controller matters more than anything else
  const counts = Object.fromEntries(ROLE_IDS.map((r) => [r, team.filter((a) => a.role === r).length])) as Record<Role, number>;
  ROLE_IDS.forEach((r, ri) => {
    const gap = ROLE_GAP[r];
    if (counts[r] === 0 && (r !== 'sentinel' || s.side !== 'attack') && (r !== 'duelist' || s.side !== 'defense')) {
      // where pro teams on the map mostly play without the role, say so (see the relaxed cost in model.ts)
      const asPros = map && m.mix.relax[ri]! >= MIX_NOTE.relax ? `, as most pro teams play ${map.name}` : '';
      // the gaps this leaves are said here once, with how to play around them
      const left = gaps.filter((g) => gap.dims.includes(g.dim));
      for (const g of left) gaps.splice(gaps.indexOf(g), 1);
      const so = left.length ? left.map((g) => MAKE_UP[g.dim]).join(', and ') : gap.so;
      cons.push(`No ${roleOf(r).name.toLowerCase()}${asPros}: ${gap.none}${so ? `, so ${so}` : ''}.`);
    } else if (counts[r] >= 3) cons.push(gap.many);
  });
  // straying from the map's pro role mix, where it costs enough to matter (see ROLE_MIX)
  if (map) {
    ROLE_IDS.forEach((r, ri) => {
      const want = m.mix.want[ri]!, c = counts[r];
      // (none, or three or more, has its own con above)
      if (Number.isNaN(want) || c === 0 || c >= 3 || Math.abs(c - want) < MIX_NOTE.off) return;
      const costs = Array.from(m.mix.cost.subarray(ri * 5, ri * 5 + 5));
      if (Math.max(...costs) - costs[Math.min(c, 4)]! < MIX_NOTE.cost) return;
      const role = roleOf(r);
      const what = `${capital(numberWord(c))} ${(c === 1 ? role.name : role.plural).toLowerCase()}`;
      const pros = want < 0.5 ? `pro teams on ${map.name} rarely run one` : `pro teams on ${map.name} usually run ${numberWord(Math.round(want))}`;
      cons.push(`${what}, where ${pros}: ${c < want ? MIX_GAP[r].fewer : MIX_GAP[r].more}.`);
    });
  }
  // what these kits do on this map, side or site in particular (kb/kitfit.ts), biggest first
  if (map) {
    const rules = team.flatMap((a) => m.kit[a.index]!).filter((k) => Math.abs(k.gain) >= KIT_RULE_NOTE.gain);
    for (const k of rules.filter((x) => x.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, KIT_RULE_NOTE.most)) pros.push(ruleWhy(k.rule, map.id));
    for (const k of rules.filter((x) => x.gain < 0).sort((a, b) => a.gain - b.gain).slice(0, KIT_RULE_NOTE.most)) cons.push(ruleWhy(k.rule, map.id));
  }
  // strengths the situation needs and the team has
  for (const row of strengths.filter((r) => r.need >= 1 && r.cover >= 0.8).sort((a, b) => b.need * b.cover - a.need * a.cover).slice(0, 3)) {
    const who = row.by.filter((b) => b.value >= 0.45).slice(0, 2).map((b) => agentWithAbility(agentById(b.id)!, row.dim));
    const rewarded = bump(row.dim) >= 0.15 ? `, which ${where} rewards` : '';
    pros.push(`Strong ${DIM_INFO[row.dim].has}${rewarded}${who.length ? `: ${listJoin(who)}` : ''}.`);
  }
  // the other gaps
  for (const row of gaps.slice(0, 3)) {
    const info = DIM_INFO[row.dim];
    const lead = row.cover < 0.25 ? 'No' : info.few ? 'Few' : 'Little';
    // who brings what there is of it, so a team with a little doesn't read as having none
    const some = row.by.slice(0, 2).map((b) => `${agentById(b.id)!.name}’s`);
    const besides = lead !== 'No' && some.length ? ` other than ${listJoin(some)}` : '';
    cons.push(`${lead} ${info.lacks}${besides}${bump(row.dim) >= 0.15 ? `, which ${where} needs` : ''}: ${MAKE_UP[row.dim]}.`);
  }
  // a comp with no real gap still has a thinnest spot worth playing around
  if (!cons.length) {
    const thin = strengths.filter((r) => r.need >= 1).sort((a, b) => a.cover - b.cover)[0];
    if (thin && thin.cover < 0.8) cons.push(`Its thinnest spot is ${DIM_INFO[thin.dim].lacks}: ${MAKE_UP[thin.dim]}.`);
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
  let hard: Agent[] = [];
  if (rankName && t <= KIT_NOTE.upTo) {
    // how much of each kit's utility a team at this rank gets (gun play aside), as the score counts it
    const kit = (a: Agent) => kitShare(a, t);
    hard = team.filter((a) => kitShare(a, 0) < KIT_NOTE.hard && !a.estimate).sort((x, y) => kit(x) - kit(y));
    const pct = (a: Agent) => Math.round(kit(a) * 20) * 5;
    const shares = new Set(hard.map(pct)).size === 1 ? `about ${pct(hard[0]!)}% of each kit` : `${listJoin(hard.map((a) => `about ${pct(a)}% of ${a.name}’s`))} kits`;
    if (hard.length === 1) cons.push(`${hard[0]!.name} takes practice to play well: a team at ${rankName} gets about ${pct(hard[0]!)}% of ${hard[0]!.name}’s kit, so the pick is worth it only if someone plays that agent often.`);
    else if (hard.length) cons.push(`${listJoin(hard.map(nameOf))} take practice to play well: a team at ${rankName} gets ${shares}, so they’re worth it only if someone plays them often.`);
    const easy = team.filter((a) => a.solo >= 0.8 && !a.estimate);
    if (easy.length) pros.push(`${listJoin(easy.map(nameOf))} ${easy.length === 1 ? 'works' : 'work'} well without much teamwork, which suits ${rankName}.`);
  }
  // ranked win rates, where they count (see WIN_RANKS)
  const winOf = (a: Agent) => m.fitParts.win[a.index]!;
  const winners = team.filter((a) => winOf(a) >= WIN_NOTE.more), losers = team.filter((a) => winOf(a) <= -WIN_NOTE.fewer);
  const rates = (list: Agent[]) => (list.length === 1 ? `${Math.round(list[0]!.win)}% of games` : listJoin(list.map((a) => `${a.name} ${Math.round(a.win)}%`)));
  if (winners.length) pros.push(`${listJoin(winners.map(nameOf))} ${winners.length === 1 ? 'wins' : 'win'} more ranked games than most agents (${rates(winners)}).`);
  // agents the line before already says to pick only if someone plays them often just add their rate
  if (losers.length && losers.every((a) => hard.includes(a))) cons.push(`${listJoin(losers.map(nameOf))} also ${losers.length === 1 ? 'wins' : 'win'} fewer ranked games than most agents (${rates(losers)}).`);
  else if (losers.length) {
    // the advice to know the agent well is for agents who take practice; an easy agent's rate is just said
    const hardOnes = losers.filter((a) => a.skill >= 0.55);
    const advice = hardOnes.length === losers.length ? `: best played by someone who knows ${losers.length === 1 ? 'that agent' : 'them'} well` : '';
    cons.push(`${listJoin(losers.map(nameOf))} ${losers.length === 1 ? 'wins' : 'win'} fewer ranked games than most agents (${rates(losers)})${advice}.`);
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
    else if (overlap === 4) pros.push(`Four of these five are in a comp pro teams play on ${map!.name}.`);
  }
  for (const a of team.filter((x) => x.estimate)) notes.push(`${a.name} is new, so this comp’s fit is an early estimate and will change once there’s more play to go on.`);
  return { strengths, pros, cons, notes, against: againstOf(m, strengths) };
}

/** How a comp stands against one threat, after the threat itself: "This comp has the answer: …". */
export function againstWords(r: AgainstRow): string {
  if (r.verdict === 'answered') return `This comp has the answer${r.by.length ? `: ${listJoin(r.by)}` : ''}.`;
  if (r.verdict === 'partly') return r.by.length ? `Part of the answer: ${listJoin(r.by)}. Beyond that, ${r.advice}.` : `Only part of the answer, so ${r.advice}.`;
  return `Little to answer it, so ${r.advice}.`;
}

/**
 * What the other team makes you play around (kb/counters.ts), for a comp with these strengths:
 * for each threat that goes far enough, how much the comp covers of the strengths that answer it,
 * as much as each counts, and who brings them.
 */
function againstOf(m: Model, strengths: readonly StrengthRow[]): AgainstRow[] {
  const row = (d: Dim) => strengths.find((r) => r.dim === d)!;
  return m.threats.filter((x) => x.level >= THREAT_NOTE.level).map((x): AgainstRow => {
    const asks = (Object.entries(x.threat.needs) as [Dim, number][]).sort((a, b) => b[1] - a[1]);
    const answered = asks.reduce((acc, [d, v]) => acc + v * row(d).cover, 0) / asks.reduce((acc, [, v]) => acc + v, 0);
    // who answers it most: each agent by the ability of theirs that answers it most, as much as the
    // threat asks for it, named as the game names it (an agent's "flashes" could be one blind)
    const best = new Map<string, { d: Dim; v: number; ability?: string }>();
    for (const [d, ask] of asks) {
      for (const b of row(d).by) {
        if (b.value < THREAT_NOTE.brings || (best.get(b.id)?.v ?? 0) >= ask * b.value) continue;
        best.set(b.id, { d, v: ask * b.value, ability: b.abilities[0] });
      }
    }
    const by = [...best].sort((a, b) => b[1].v - a[1].v).slice(0, THREAT_NOTE.by).map(([id, x]) => `${agentById(id)!.name}’s ${x.ability ?? DIM_INFO[x.d].has}`);
    return {
      id: x.threat.id, threat: threatLine(x.threat, x.who.slice(0, 2).map((id) => agentById(id)!.name), listJoin), level: x.level, answered,
      verdict: answered >= THREAT_NOTE.answered ? 'answered' : answered >= THREAT_NOTE.little ? 'partly' : 'little', by, advice: x.threat.advice,
    };
  });
}

/** The agents in a team: indices to ids. */
export const teamIds = (team: readonly number[]): string[] => team.map((i) => AGENTS[i]!.id);
