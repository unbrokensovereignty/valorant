// Checks that the ratings follow how each kit plays on each map and side, the way a coach would
// reason about it, and not only the numbers behind them. Each test is a claim a good player would
// make ("Displacement is better in tight spaces", "Brimstone's smokes don't reach across Breeze"),
// checked against the fits the app shows. The kit rules behind most of them are in kb/kitfit.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../../src/core/engine/plan.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { explainTeam } from '../../src/core/engine/explain.ts';
import { modelFor, type RankPick } from '../../src/core/engine/model.ts';
import { TIERS } from '../../src/core/engine/weights.ts';
import { agentById } from '../../src/core/kb/agents.ts';
import { abilityNames } from '../../src/core/kb/kits.ts';
import { MAPS, type Side, type Space } from '../../src/core/kb/maps.ts';
import { KIT_RULES, RULES, ruleWhy, ruleWhyAt } from '../../src/core/kb/kitfit.ts';

const none = (problems: string[]) => assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
const name = (id: string) => agentById(id)!.name;
const min = (tier: string) => TIERS.find((t) => t.id === tier)!.min;
const SIDES: Side[] = ['attack', 'defense'];

const answers = new Map<string, ReturnType<typeof solve>>();
function answer(map: string, side: Side, rank: RankPick) {
  const key = `${map}|${side}|${rank}`;
  let a = answers.get(key);
  if (!a) answers.set(key, (a = solve({ ...newQuery(rank, true), map, side }, { map, side, rank, sites: [] }, 3)));
  return a;
}
const fit = (agent: string, map: string, side: Side, rank: RankPick) => answer(map, side, rank).agents.find((x) => x.id === agent)!.fit;
/** An agent's average fit over the maps of a space, on both sides. */
function spaceFit(agent: string, space: Space, rank: RankPick): number {
  const maps = MAPS.filter((m) => m.space === space);
  let sum = 0;
  for (const m of maps) for (const side of SIDES) sum += fit(agent, m.id, side, rank);
  return sum / (maps.length * SIDES.length);
}

test('utility that needs walls is rated higher on tight maps than on open ones', () => {
  const problems: string[] = [];
  // Displacement only concusses on impact, Paint Shells and Boom Bot clear corners, Breach stuns
  // through walls, Phoenix's flash and molly are short range, Trapwires and Barrier Mesh need chokes
  // (Phoenix only below Diamond: near the top, pro teams pick him on the in-between maps instead,
  // and pro play counts most there)
  for (const agent of ['hush', 'raze', 'breach', 'phoenix', 'cypher', 'deadlock']) {
    for (const rank of agent === 'phoenix' ? ['silver', 'gold', 'platinum'] as const : ['gold', 'immortal'] as const) {
      const tight = spaceFit(agent, 'tight', rank), open = spaceFit(agent, 'open', rank);
      if (tight <= open) problems.push(`${name(agent)} at ${rank}: ${tight.toFixed(0)} on tight maps, ${open.toFixed(0)} on open ones`);
    }
  }
  none(problems);
});

test('Sova’s darts are rated higher on open maps than on tight ones', () => {
  const problems: string[] = [];
  for (const rank of ['gold', 'immortal'] as const) {
    const tight = spaceFit('sova', 'tight', rank), open = spaceFit('sova', 'open', rank);
    if (open <= tight) problems.push(`${rank}: ${open.toFixed(0)} on open maps, ${tight.toFixed(0)} on tight ones`);
  }
  none(problems);
});

test('Hush is strong on Lotus attack, where she works the doors from range', () => {
  const problems: string[] = [];
  // her place among the duelists: fits are measured within a situation, so this is how her pick
  // compares with the other duelists' there
  const place = (map: string, rank: RankPick) => {
    const own = fit('hush', map, 'attack', rank);
    return 1 + answer(map, 'attack', rank).agents.filter((x) => agentById(x.id)!.role === 'duelist' && x.fit > own).length;
  };
  for (const rank of ['gold', 'diamond', 'immortal', 'radiant'] as const) {
    const f = fit('hush', 'lotus', 'attack', rank);
    if ((rank === 'immortal' || rank === 'radiant') && f < min('A')) problems.push(`${rank}: ${f.toFixed(0)}, below A`);
    for (const m of MAPS.filter((x) => x.space === 'open')) {
      if (place('lotus', rank) >= place(m.id, rank)) problems.push(`${rank}: duelist number ${place('lotus', rank)} on Lotus attack, ${place(m.id, rank)} on ${m.name}`);
    }
  }
  // and a comp with her there says why
  const team = answer('lotus', 'attack', 'immortal').agents.find((x) => x.id === 'hush')!.team;
  const why = explainTeam(modelFor({ map: 'lotus', side: 'attack', rank: 'immortal', sites: [] }), team);
  if (!why.pros.some((p) => p.includes('Telekinesis'))) problems.push(`no word of the doors in ${team.map(name).join(', ')}: ${why.pros.join(' ')}`);
  none(problems);
});

test('Brimstone’s smokes reach across Bind but not across the open maps', () => {
  const problems: string[] = [];
  for (const rank of ['gold', 'immortal'] as const) {
    for (const side of SIDES) {
      const bind = fit('brimstone', 'bind', side, rank);
      for (const open of ['breeze', 'abyss']) if (fit('brimstone', open, side, rank) >= bind) problems.push(`${rank} ${side}: ${open} as good as Bind`);
    }
  }
  none(problems);
});

test('long walls are in the best comp on Breeze from Gold up, and on Icebox from Diamond up', () => {
  const problems: string[] = [];
  const walls = new Set(['viper', 'harbor']);
  for (const side of SIDES) {
    for (const rank of ['gold', 'platinum', 'diamond', 'ascendant', 'immortal', 'radiant'] as const) {
      const best = answer('breeze', side, rank).comps[0]!.team;
      if (!best.some((id) => walls.has(id))) problems.push(`Breeze ${side} at ${rank}: ${best.map(name).join(', ')}`);
    }
    for (const rank of ['diamond', 'ascendant', 'immortal', 'radiant'] as const) {
      const best = answer('icebox', side, rank).comps[0]!.team;
      if (!best.some((id) => walls.has(id))) problems.push(`Icebox ${side} at ${rank}: ${best.map(name).join(', ')}`);
    }
  }
  none(problems);
});

test('an Operator sentinel stays a fair defense pick where pros mostly skip sentinels', () => {
  const problems: string[] = [];
  // Breeze has the longest sightlines in the game; Chamber holds them and teleports out
  // (at Radiant, where pro play counts most, a little lower)
  for (const [rank, tier] of [['diamond', 'B'], ['immortal', 'B'], ['radiant', 'C']] as const) {
    const f = fit('chamber', 'breeze', 'defense', rank);
    if (f < min(tier)) problems.push(`Chamber on Breeze defense at ${rank}: ${f.toFixed(0)}, below ${tier}`);
  }
  none(problems);
});

test('every kit rule applies somewhere, and its reason reads as a full sentence on every map it covers', () => {
  const problems: string[] = [];
  RULES.forEach((r, i) => {
    const where = MAPS.filter((m) => SIDES.some((side) => modelFor({ map: m.id, side, rank: 'gold', sites: [] }).kit[agentById(r.agent)!.index]!.some((k) => k.rule === r)));
    if (!where.length) problems.push(`rule ${i + 1} (${name(r.agent)}) applies nowhere`);
    for (const m of where) {
      const why = ruleWhy(r, m.id);
      if (!/^[A-Z].*\.$/.test(why) || why.includes('{')) problems.push(`rule ${i + 1} on ${m.name}: "${why}"`);
      if (!why.includes(name(r.agent))) problems.push(`rule ${i + 1}: the reason doesn't name ${name(r.agent)}`);
    }
    // the agent page says it once for all the maps it covers
    const many = ruleWhyAt(r, where.map((m) => m.id));
    if (where.length > 1 && (/these maps (?:is|has|was)\b/.test(many) || many.includes('{'))) problems.push(`rule ${i + 1} for several maps: "${many}"`);
  });
  if (KIT_RULES.length !== RULES.length) problems.push('a rule was dropped');
  none(problems);
});

test('a kit rule that names its abilities names ones the agent has, and the comp names them for that strength', () => {
  const problems: string[] = [];
  RULES.forEach((r, i) => {
    if (r.via === undefined) return;
    const names = abilityNames(r.agent, r.via);
    if (names.length !== r.via.length) problems.push(`rule ${i + 1} (${name(r.agent)}): no ability on every key of "${r.via}"`);
  });
  // on Breeze, Viper's Toxic Screen is what makes her smokes count for more
  const m = modelFor({ map: 'breeze', side: 'attack', rank: 'immortal', sites: [] });
  const smoke = explainTeam(m, ['jett', 'yoru', 'sova', 'viper', 'omen']).strengths.find((s) => s.dim === 'smoke')!;
  const viper = smoke.by.find((b) => b.id === 'viper');
  if (viper?.abilities[0] !== 'Toxic Screen') problems.push(`Viper's smokes on Breeze come from ${viper?.abilities.join(', ')}`);
  none(problems);
});

test('below Immortal one controller leads, since two pay off only when a team plays its smokes together', () => {
  const problems: string[] = [];
  const controllers = (team: readonly string[]) => team.filter((id) => agentById(id)!.role === 'controller').length;
  // Lotus at Platinum: pro teams run Omen and Viper there, but a Platinum team gets more from one
  for (const side of SIDES) {
    for (const c of answer('lotus', side, 'platinum').comps) if (controllers(c.team) !== 1) problems.push(`Lotus ${side} at Platinum: ${c.team.map(name).join(', ')}`);
  }
  // up to Gold everywhere; at Platinum nearly everywhere (a map pros always play with two, like
  // Split, can still lead with them)
  for (const rank of ['silver', 'gold', 'platinum'] as const) {
    const two: string[] = [];
    for (const map of MAPS) for (const side of SIDES) {
      const best = answer(map.id, side, rank).comps[0]!.team;
      if (controllers(best) !== 1) two.push(`${map.name} ${side} at ${rank}: ${best.map(name).join(', ')}`);
    }
    if (two.length > (rank === 'platinum' ? 3 : 0)) problems.push(...two);
  }
  // from Immortal up, the pro comps with two lead again where pros play them
  for (const side of SIDES) {
    const best = answer('lotus', side, 'immortal').comps[0]!.team;
    if (controllers(best) !== 2) problems.push(`Lotus ${side} at Immortal: ${best.map(name).join(', ')}`);
  }
  // and a comp with two says what the second one costs, where it costs
  const said = (rank: RankPick) => explainTeam(modelFor({ map: 'lotus', side: 'attack', rank, sites: [] }), ['raze', 'fade', 'viper', 'omen', 'chamber']).cons.some((c) => c.startsWith('Two controllers pay off only'));
  if (!said('gold')) problems.push('no word at Gold of what the second controller costs');
  if (said('immortal')) problems.push('a word at Immortal of what the second controller costs');
  none(problems);
});

test('a duo or trio is shown with the best agents for its random teammates, around the party’s own', () => {
  const problems: string[] = [];
  const controllers = (team: readonly string[]) => team.filter((id) => agentById(id)!.role === 'controller').length;
  const party = (map: string, side: Side, rank: RankPick, size: 2 | 3, include: string[]) =>
    solve({ ...newQuery(rank, true), map, side, party: size, include }, { map, side, rank, sites: [] }, 3);
  // a Chamber and Omen duo already has its controller: its teammates aren't told to play Clove
  for (const side of SIDES) {
    const c = party('lotus', side, 'platinum', 2, ['chamber', 'omen']).comps[0]!;
    if (c.team.includes('clove') || controllers(c.team) !== 1) problems.push(`Chamber and Omen on Lotus ${side}: ${c.team.map(name).join(', ')}`);
    if (!c.team.includes('chamber') || !c.team.includes('omen')) problems.push(`the duo isn't in ${c.team.map(name).join(', ')}`);
  }
  // and in general, below Immortal, a party with a full smoker gets no second controller to ask for
  // (Viper isn't one: her single smoke leaves a site short, so a Viper party can be told to add one)
  for (const [include, size] of [[['omen', 'jett'], 2], [['clove', 'sova'], 2], [['brimstone', 'killjoy', 'raze'], 3]] as const) {
    for (const m of MAPS.filter((x) => x.pool)) for (const rank of ['gold', 'platinum'] as const) {
      const c = party(m.id, 'attack', rank, size, [...include]).comps[0]!;
      if (controllers(c.team) !== 1) problems.push(`${include.map(name).join(' and ')} on ${m.name} at ${rank}: ${c.team.map(name).join(', ')}`);
    }
  }
  none(problems);
});
