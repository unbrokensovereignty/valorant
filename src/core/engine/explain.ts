/**
 * Why a team scores as it does, in plain words: its strengths and gaps for the situation, the
 * pairs that help or clash, role counts, rank and how close it is to what pros play. Everything
 * here comes from the same numbers the score does, so the reasons always match the ranking.
 */
import { AGENTS, agentById, type Agent } from '../kb/agents.ts';
import { abilityNames } from '../kb/kits.ts';
import { mapById, type Side } from '../kb/maps.ts';
import { PRO } from '../kb/pro.ts';
import { rankOf } from '../kb/ranks.ts';
import { DIMS, DIM_INFO, ROLE_IDS, roleOf, type Dim, type Role } from '../kb/roles.ts';
import { pairOf } from '../kb/synergy.ts';
import { listJoin } from '../text.ts';
import { D, N, atRank, kitShare, needsFor, viaIn, type Model, type Situation } from './model.ts';
import { BELOW_NOTE, KIT_NOTE, KIT_RULE_NOTE, MIX_NOTE, PLAN_NOTE, SECOND_CONTROLLER, THREAT_NOTE, WIN_NOTE } from './weights.ts';
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
  /** How the comp wins, in a line, from the strengths it covers best ("Wins by …"), or '' when nothing stands out. */
  plan: string;
  strengths: StrengthRow[];
  pros: string[];
  cons: string[];
  /** Things worth knowing that aren't good or bad (a new agent's numbers, say). */
  notes: string[];
  /** What the other team makes you play around, most first (empty when their agents aren't known). */
  against: AgainstRow[];
}

/**
 * How to play around a gap, by strength. It's for a team short of that strength, so it never asks
 * for it. Advice that leans on another strength (`with`) has a second form for a team that's short
 * of that one too (`or`), so a comp with no flashes is never told to lean on them. `{with}` names the
 * ability of the team's that brings the most of it ("Omen’s Paranoia"), so the advice says what to use.
 * Advice that only makes sense on one side has a form for each (`attack`, `defense`, and `both` for a
 * question about both sides).
 */
type Advice = string | { text: string; with: Dim; or: string };
const MAKE_UP: Record<Dim, Advice | { attack: Advice; defense: Advice; both: Advice }> = {
  smoke: 'take fights from cover and avoid crossing open ground',
  wall: { text: 'cross long sightlines one at a time, or block them with {with}', with: 'smoke', or: 'cross long sightlines one at a time, or take another way in' },
  flash: 'jiggle-peek for information and trade each other closely',
  recon: 'clear corners together and don’t rush in blind',
  entry: { text: 'use {with} to take space instead of taking the first fight', with: 'flash', or: 'take space together, a step at a time, instead of one player rushing in' },
  clear: {
    attack: 'check close corners one by one before planting', defense: 'check close corners one by one when you retake',
    both: 'check close corners one by one when you take a site',
  },
  disrupt: { text: 'lean on {with} and close trades to win the first fight', with: 'flash', or: 'play close enough together to trade the first fight' },
  stall: {
    attack: 'hold the planted Spike from further back so a retake can’t run you over', defense: 'play a little further back so a rush can’t run you over',
    both: 'play a little further back so a rush can’t run you over',
  },
  anchor: { attack: 'hold the planted Spike in pairs', defense: 'hold sites in pairs and rotate early', both: 'hold sites in pairs' },
  flank: 'leave one player to watch the flank',
  retake: {
    attack: 'fight as a group when you have to take ground back', defense: 'stop the plant where you can, and retake together with the numbers on your side',
    both: 'fight as a group when you have to take a site back',
  },
  postplant: 'play crossfires on the Spike after planting',
  sustain: 'play for trades so no one is left low on health',
  duel: 'play together and trade every fight',
  angles: { text: 'take long fights with a rifle from cover, or block the long sightlines with {with}', with: 'smoke', or: 'take long fights with a rifle from cover, or keep off the longest sightlines' },
  mobility: { attack: 'commit to a site early instead of rotating late', defense: 'rotate early on information instead of late', both: 'commit early instead of moving late' },
};

/** How much of a strength a team needs before advice can lean on it: the most a "few" gap covers. */
const LEANS_ON = 0.55;

/**
 * What having none of a role costs a team (`none`, and `so`, what follows when there's no advice to
 * give instead), the strengths whose gaps that already covers, and what three or more of it costs.
 */
const ROLE_GAP: Record<Role, { none: string; so?: string; dims: readonly Dim[]; many: string }> = {
  controller: {
    none: 'there are no controller smokes to cut sightlines', so: 'pushes walk into open angles', dims: ['smoke', 'wall'],
    many: 'leave the rest of the team short of firepower and information',
  },
  duelist: { none: 'someone has to take the first fight without the tools for it', dims: ['entry'], many: 'leave the rest of the team short of smokes and information' },
  initiator: { none: 'nobody’s job is to set up fights with flashes and information', dims: ['flash', 'recon'], many: 'leave the rest of the team short of smokes and entry' },
  sentinel: { none: 'nobody’s job is to watch the flank or hold a site alone', dims: ['anchor', 'flank'], many: 'make the team slow to take space' },
};

const nameOf = (a: Agent) => a.name;
const sideWord = (s: Side) => (s === 'attack' ? 'attack' : 'defense');

/** Where a situation is, after other words: "on Lotus attack", "on Lotus", "on the maps in the pool". */
export function whereWords(s: Situation): string {
  const map = mapById(s.map);
  return map ? `on ${map.name}${s.side === 'both' ? '' : ` ${s.side}`}` : 'on the maps in the pool';
}

/** An agent's main ability for a strength here, as the game names it: "Omen’s Paranoia" (or "Jett’s gun play"). */
export function abilityOf(m: Model, a: Agent, dim: Dim): string {
  const keys = viaIn(m, a, dim);
  return `${a.name}’s ${abilityNames(a.id, keys)[0] ?? (keys.includes('G') ? 'gun play' : DIM_INFO[dim].has)}`;
}

function agentWithAbility(m: Model, a: Agent, dim: Dim): string {
  const keys = viaIn(m, a, dim);
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
  const t = rankOf(s.rank).t;
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
      .map(({ a, value }) => {
        const keys = viaIn(m, a, dim);
        return { id: a.id, value, abilities: [...abilityNames(a.id, keys), ...(keys.includes('G') ? ['gun play'] : [])] };
      });
    return { dim, need: m.weight[j]! * D, cover: 1 - miss, by };
  });

  const pros: string[] = [], cons: string[] = [], notes: string[] = [];
  const where = map ? map.name : 'most maps';
  // how to play around a gap, for the side, without leaning on a strength the team is short of too
  const makeUp = (d: Dim): string => {
    const entry = MAKE_UP[d];
    const x = typeof entry === 'object' && 'both' in entry ? entry[s.side] : entry;
    if (typeof x === 'string') return x;
    const row = strengths.find((r) => r.dim === x.with)!;
    if (row.cover < LEANS_ON || !row.by.length) return x.or;
    return x.text.replace('{with}', abilityOf(m, agentById(row.by[0]!.id)!, x.with));
  };
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
      const so = left.length ? left.map((g) => makeUp(g.dim)).join(', and ') : gap.so;
      cons.push(`No ${roleOf(r).name.toLowerCase()}${asPros}: ${gap.none}${so ? `, so ${so}` : ''}.`);
    } else if (counts[r] >= 3) cons.push(`${capital(numberWord(counts[r]))} ${roleOf(r).plural.toLowerCase()} ${gap.many}.`);
  });
  // a second controller needs teamwork that most teams below the top ranks don't bring (see SECOND_CONTROLLER)
  if (counts.controller === 2 && m.secondController >= SECOND_CONTROLLER.note) {
    cons.push(`Two controllers pay off only when the team plays its smokes together, which most teams at ${rankOf(s.rank).name} don’t: the second one costs firepower or information.`);
  }
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
    const who = row.by.filter((b) => b.value >= 0.45).slice(0, 2).map((b) => agentWithAbility(m, agentById(b.id)!, row.dim));
    const rewarded = bump(row.dim) >= 0.15 ? `, which ${where} rewards` : '';
    pros.push(`Strong ${DIM_INFO[row.dim].has}${rewarded}${who.length ? `: ${listJoin(who)}` : ''}.`);
  }
  // the other gaps
  for (const row of gaps.slice(0, 3)) {
    const info = DIM_INFO[row.dim];
    // everyone who brings any of it, by the ability that does, so a team with a little doesn't read
    // as having none, nor as having more than it does ("only Omen’s Paranoia")
    const j = DIMS.indexOf(row.dim), brings = (a: Agent) => 1 - m.miss[a.index * D + j]!;
    const some = team.filter((a) => brings(a) > 1e-9).sort((a, b) => brings(b) - brings(a)).slice(0, 3).map((a) => abilityOf(m, a, row.dim));
    const lead = !some.length ? 'No' : info.few ? 'Few' : 'Little';
    const only = some.length ? ` (only ${listJoin(some)})` : '';
    cons.push(`${lead} ${info.lacks}${only}${bump(row.dim) >= 0.15 ? `, which ${where} needs` : ''}: ${makeUp(row.dim)}.`);
  }
  // a comp with no real gap still has a thinnest spot worth playing around
  if (!cons.length) {
    const thin = strengths.filter((r) => r.need >= 1).sort((a, b) => a.cover - b.cover)[0];
    if (thin && thin.cover < 0.8) cons.push(`Its thinnest spot is ${DIM_INFO[thin.dim].lacks}: ${makeUp(thin.dim)}.`);
  }
  // pairs, by what each adds to the score here (two controllers' pair counts less where teams don't play together)
  const pairs: { strength: number; why: string }[] = [];
  for (let i = 0; i < team.length; i++) {
    for (let k = i + 1; k < team.length; k++) {
      const p = pairOf(team[i]!.id, team[k]!.id);
      const v = m.pair[team[i]!.index * N + team[k]!.index]!;
      if (!p || Math.abs(v) < 1e-9 || (p.side !== 'both' && !sides.includes(p.side))) continue;
      pairs.push({ strength: v, why: p.side === 'both' || sides.length === 1 ? p.why : `On ${sideWord(p.side)}: ${p.why}` });
    }
  }
  for (const p of pairs.filter((x) => x.strength > 0).sort((a, b) => b.strength - a.strength).slice(0, 2)) pros.push(p.why);
  for (const p of pairs.filter((x) => x.strength < 0).sort((a, b) => a.strength - b.strength).slice(0, 1)) cons.push(p.why);
  // rank
  const rankName = rankOf(s.rank).name;
  let hard: Agent[] = [];
  if (t <= KIT_NOTE.upTo) {
    // how much of each kit's utility a team at this rank gets (gun play aside), as the score counts it
    const kit = (a: Agent) => atRank(s.rank, (x) => kitShare(a, x));
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
  if (t >= 0.75) {
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
  return { plan: planOf(m, strengths), strengths, pros, cons, notes, against: againstOf(m, strengths) };
}

/**
 * What a comp does with each strength, by phase of a round: taking a site and then holding the
 * plant on attack, holding and then retaking on defense. `{ab}` is the ability that does it.
 */
export const PHASES: Record<'take' | 'plant' | 'hold' | 'retake', Partial<Record<Dim, string>>> = {
  take: {
    smoke: 'smoking off angles with {ab}', wall: 'cutting off long sightlines with {ab}', flash: 'flashing the first fight with {ab}',
    recon: 'finding defenders with {ab}', entry: 'taking space with {ab}', clear: 'clearing close corners with {ab}',
    disrupt: 'breaking up the defense with {ab}', duel: 'winning fights with {ab}', angles: 'picking from long range with {ab}', mobility: 'hitting fast with {ab}',
  },
  plant: { postplant: 'stopping the defuse with {ab}', stall: 'slowing the retake with {ab}', anchor: 'holding the planted Spike with {ab}', flank: 'watching the flank with {ab}' },
  hold: {
    anchor: 'holding a site alone with {ab}', stall: 'slowing pushes with {ab}', recon: 'spotting pushes early with {ab}', angles: 'holding long angles with {ab}',
    disrupt: 'stopping pushes with {ab}', wall: 'cutting off long sightlines with {ab}', smoke: 'smoking off the way in with {ab}', flank: 'watching the flank with {ab}', duel: 'winning fights with {ab}',
  },
  retake: { retake: 'retaking together with {ab}', flash: 'flashing back onto the site with {ab}', clear: 'clearing the planted site with {ab}', mobility: 'rotating fast with {ab}', sustain: 'staying in the fight with {ab}' },
};

/**
 * How a comp wins, in a line: the strengths the situation needs that the comp covers best, by
 * phase of the round, each named by the ability that brings the most of it. It reads off the same
 * strengths as the score, and never names one the comp is short of (see PLAN_NOTE).
 */
function planOf(m: Model, strengths: readonly StrengthRow[]): string {
  const named = new Set<string>();
  const phase = (verbs: Partial<Record<Dim, string>>, most: number): string[] => {
    const out: string[] = [];
    const rows = strengths.filter((r) => verbs[r.dim] && r.need >= PLAN_NOTE.need && r.cover >= PLAN_NOTE.cover && (r.by[0]?.value ?? 0) >= PLAN_NOTE.brings);
    for (const r of [...rows].sort((a, b) => b.need * b.cover - a.need * a.cover)) {
      if (out.length >= most) break;
      const ability = abilityOf(m, agentById(r.by[0]!.id)!, r.dim);
      if (named.has(ability)) continue;
      named.add(ability);
      out.push(verbs[r.dim]!.replace('{ab}', ability));
    }
    return out;
  };
  const line = (first: string[], then: string[]) => (first.length ? `${listJoin(first)}${then.length ? `, then ${then[0]}` : ''}` : then[0] ?? '');
  const attack = () => line(phase(PHASES.take, PLAN_NOTE.most), phase(PHASES.plant, 1));
  const defense = () => line(phase(PHASES.hold, PLAN_NOTE.most), phase(PHASES.retake, 1));
  const side = m.situation.side;
  if (side !== 'both') {
    const how = side === 'attack' ? attack() : defense();
    return how ? `Wins by ${how}.` : '';
  }
  const a = attack(), d = defense();
  return [a && `On attack, it wins by ${a}.`, d && `On defense, ${a ? 'by' : 'it wins by'} ${d}.`].filter(Boolean).join(' ');
}

/** "Fewer flashes", "less information" (and "more …"): how much of a strength one comp has against another. */
const less = (d: Dim) => (d === 'disrupt' ? 'Less crowd control' : `${DIM_INFO[d].few ? 'Fewer' : 'Less'} ${DIM_INFO[d].has}`);
const more = (d: Dim) => (d === 'disrupt' ? 'More crowd control' : `More ${DIM_INFO[d].has}`);

/** Why a comp ranks below the best one: the agents it swaps, and what that gives up and gains. */
export interface Below {
  /** The best comp's agents it doesn't have, and the ones it plays instead. */
  out: string[];
  in: string[];
  /** Where it falls short and where it's better, biggest first: "Less information (Sova’s Recon Bolt)". */
  loses: string[];
  gains: string[];
}

/**
 * Why `other` scores below `best`, read off the parts of the score (see search.ts): each strength's
 * coverage, what pros pick here, ranked win rates, how the kits play at this rank, the pairs and the
 * role counts. Each part that moves the score at least BELOW_NOTE.part is a reason, the biggest first.
 */
export function whyBelow(m: Model, best: readonly string[], other: readonly string[]): Below {
  const agents = (ids: readonly string[]) => ids.map((id) => agentById(id)).filter((a): a is Agent => !!a);
  const A = agents(best), B = agents(other);
  const outs = A.filter((a) => !other.includes(a.id)), ins = B.filter((a) => !best.includes(a.id));
  const names = (list: readonly Agent[]) => listJoin(list.map(nameOf));
  const verb = (list: readonly Agent[], one: string, many: string) => (list.length === 1 ? one : many);
  const rankName = rankOf(m.situation.rank).name;
  const map = mapById(m.situation.map);
  const parts: { size: number; words: string }[] = [];
  // each strength's coverage, as the score weighs it
  DIMS.forEach((d, j) => {
    const cover = (team: readonly Agent[]) => 1 - team.reduce((p, a) => p * m.miss[a.index * D + j]!, 1);
    const size = m.weight[j]! * (cover(B) - cover(A));
    if (Math.abs(size) < BELOW_NOTE.part) return;
    // named by the ability of the agent who brought (or brings) the most of it
    const from = (size < 0 ? outs : ins).map((a) => ({ a, v: 1 - m.miss[a.index * D + j]! })).sort((x, y) => y.v - x.v)[0];
    const by = from && from.v >= 0.3 ? ` (${abilityOf(m, from.a, d)})` : '';
    parts.push({ size, words: `${size < 0 ? less(d) : more(d)}${by}` });
  });
  const sum = (arr: Float64Array, team: readonly Agent[]) => team.reduce((t, a) => t + arr[a.index]!, 0);
  const pro = sum(m.fitParts.pro, ins) - sum(m.fitParts.pro, outs);
  const where = map ? `on ${map.name}` : 'across the pool';
  if (Math.abs(pro) >= BELOW_NOTE.part) parts.push({ size: pro, words: `Pro teams pick ${pro < 0 ? names(outs) : names(ins)} more ${where}` });
  const win = sum(m.fitParts.win, ins) - sum(m.fitParts.win, outs);
  if (Math.abs(win) >= BELOW_NOTE.part) {
    const who = win < 0 ? outs : ins;
    parts.push({ size: win, words: `${names(who)} ${verb(who, 'wins', 'win')} more ranked games` });
  }
  const rank = sum(m.fitParts.rank, ins) - sum(m.fitParts.rank, outs);
  if (Math.abs(rank) >= BELOW_NOTE.part) {
    parts.push({ size: rank, words: rank < 0 ? `${names(ins)} ${verb(ins, 'is', 'are')} harder to play well at ${rankName}` : `${names(ins)} ${verb(ins, 'is', 'are')} easier to play well at ${rankName}` });
  }
  const pairs = (team: readonly Agent[]) => team.reduce((t, a, i) => t + team.slice(0, i).reduce((u, b) => u + m.pair[a.index * N + b.index]!, 0), 0);
  const pair = pairs(B) - pairs(A);
  if (Math.abs(pair) >= BELOW_NOTE.part) parts.push({ size: pair, words: pair < 0 ? 'The agents work less well together' : 'The agents work better together' });
  const roles = (team: readonly Agent[]) => ROLE_IDS.reduce((t, r, ri) => t + m.roleCost[ri * 5 + Math.min(4, team.filter((a) => a.role === r).length)]!, 0);
  const role = roles(B) - roles(A);
  if (Math.abs(role) >= BELOW_NOTE.part) parts.push({ size: role, words: role < 0 ? `Its mix of roles suits ${map ? map.name : 'the situation'} less well` : `Its mix of roles suits ${map ? map.name : 'the situation'} better` });
  return {
    out: outs.map((a) => a.id), in: ins.map((a) => a.id),
    loses: parts.filter((p) => p.size < 0).sort((x, y) => x.size - y.size).slice(0, BELOW_NOTE.most).map((p) => p.words),
    gains: parts.filter((p) => p.size > 0).sort((x, y) => y.size - x.size).slice(0, BELOW_NOTE.gains).map((p) => p.words),
  };
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
