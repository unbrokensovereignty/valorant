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
import { MAPS, type Side, type Space } from '../../src/core/kb/maps.ts';
import { KIT_RULES, RULES, ruleWhy } from '../../src/core/kb/kitfit.ts';

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
  for (const agent of ['hush', 'raze', 'breach', 'phoenix', 'cypher', 'deadlock']) {
    for (const rank of ['gold', 'immortal'] as const) {
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
  });
  if (KIT_RULES.length !== RULES.length) problems.push('a rule was dropped');
  none(problems);
});
