// Checks the engine against numbers from outside it, and checks that what it says is true.
//
// The benchmarks: pro play at Champions 2026 and Masters Santiago 2026 (kb/pro.ts) for the high
// ranks, and ranked win rates and low-rank tier lists (metabot.gg, winio.ai, October 2026) for the
// low ones. The truth checks read every pro, con and note the explanations give for hundreds of
// random teams and situations, and check each claim against the numbers behind it. Node only (too
// slow for the in-app self-test); the random teams are the same on every run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, teamFit } from '../../src/core/engine/plan.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { kitShare, modelFor, type RankPick, type Situation } from '../../src/core/engine/model.ts';
import { explainTeam } from '../../src/core/engine/explain.ts';
import { KIT_NOTE, tierOf, TIERS } from '../../src/core/engine/weights.ts';
import { AGENTS, agentById } from '../../src/core/kb/agents.ts';
import { MAPS, POOL } from '../../src/core/kb/maps.ts';
import { PRO, RECORDED } from '../../src/core/kb/pro.ts';
import { RANK_IDS, rankOf, ALL_RANKS_T } from '../../src/core/kb/ranks.ts';
import { DIMS, DIM_INFO, ROLES, ROLE_IDS, type Role } from '../../src/core/kb/roles.ts';

const name = (id: string) => agentById(id)!.name;
const none = (problems: string[]) => assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
const answers = new Map<string, ReturnType<typeof solve>>();
function answer(map: string, rank: RankPick, side: Situation['side'] = 'both', keep = 3) {
  const key = [map, rank, side, keep].join('|');
  let a = answers.get(key);
  if (!a) answers.set(key, (a = solve({ ...newQuery(rank, true), map, side }, { map, side, rank, sites: [] }, keep)));
  return a;
}
const overlap = (map: string, team: readonly string[]) => Math.max(0, ...PRO[map]!.comps.map((c) => c.filter((id) => team.includes(id)).length));

test('at Immortal and Radiant, the best comp on each pool map is close to a comp pros play', () => {
  const problems: string[] = [];
  for (const rank of ['immortal', 'radiant'] as const) {
    let sum = 0;
    for (const m of POOL) {
      const best = answer(m.id, rank).comps[0]!.team;
      const shared = overlap(m.id, best);
      sum += shared;
      if (shared < 4) problems.push(`${rank} ${m.name}: ${best.map(name).join(', ')} shares only ${shared} with a pro comp`);
      // an agent pros pick on nearly every map of it belongs in the best comp at Radiant
      if (rank === 'radiant') for (const [id, pct] of Object.entries(PRO[m.id]!.picks)) if (pct >= 90 && !best.includes(id)) problems.push(`radiant ${m.name}: no ${name(id)} (picked on ${pct}%)`);
    }
    const mean = sum / POOL.length;
    if (mean < 4.4) problems.push(`${rank}: the best comps share ${mean.toFixed(2)} agents with a pro comp on average`);
  }
  none(problems);
});

test('at Radiant, the Operator players and the controller counts follow pro play', () => {
  const problems: string[] = [];
  // Chamber was picked on 57–69% of these maps at Champions 2026, Jett on 56% of Breeze's at Santiago
  for (const [map, id] of [['summit', 'chamber'], ['sunset', 'chamber'], ['haven', 'chamber'], ['lotus', 'chamber'], ['breeze', 'jett']] as const) {
    if (!answer(map, 'radiant').comps.slice(0, 3).some((c) => c.team.includes(id))) problems.push(`${map}: no ${name(id)} in the top three`);
  }
  // pros ran one controller on Sunset and Summit, and two on Lotus and Abyss
  for (const [map, n] of [['sunset', 1], ['summit', 1], ['lotus', 2], ['abyss', 2]] as const) {
    const best = answer(map, 'radiant').comps[0]!.team;
    const got = best.filter((id) => agentById(id)!.role === 'controller').length;
    if (got !== n) problems.push(`${map}: ${got} controllers in ${best.map(name).join(', ')}, where pros run ${n}`);
  }
  none(problems);
});

test('the comps pros played most at Masters Santiago fit well on their best map at Radiant', () => {
  const problems: string[] = [];
  const a = TIERS.find((x) => x.id === 'A')!.min;
  for (const r of RECORDED) {
    const best = Math.max(...MAPS.map((m) => teamFit({ map: m.id, side: 'both', rank: 'radiant', sites: [] }, r.agents, true).fit));
    if (best < a) problems.push(`${r.agents.map(name).join(', ')}: ${Math.round(best)} at best`);
  }
  none(problems);
});

test('low-rank tiers follow ranked results: easy winners high, hard team agents low', () => {
  const problems: string[] = [];
  const tiers = (rank: RankPick) => new Map(answer('any', rank, 'both', 1).agents.map((x) => [x.id, x]));
  const order = TIERS.map((x) => x.id);
  const at = (rank: RankPick, ids: string[], test: (place: number) => boolean, want: string) => {
    const t = tiers(rank);
    for (const id of ids) {
      const x = t.get(id)!;
      if (!test(order.indexOf(x.tier))) problems.push(`${rank}: ${name(id)} is ${x.tier} (${Math.round(x.fit)}), not ${want}`);
    }
  };
  // easy agents with the best ranked win rates
  at('iron', ['reyna', 'phoenix', 'sage', 'clove'], (p) => p <= order.indexOf('A'), 'A or better');
  at('gold', ['clove', 'jett', 'sage', 'phoenix'], (p) => p <= order.indexOf('B'), 'B or better');
  // hard or team-dependent kits with low ranked win rates
  at('gold', ['kayo', 'breach', 'harbor', 'astra'], (p) => p >= order.indexOf('C'), 'C or lower');
  at('iron', ['astra', 'harbor'], (p) => p >= order.indexOf('C'), 'C or lower');
  none(problems);
});

/** A small, seeded random number source, so a failure can be run again. */
function random(seed: number) {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)]!;
  const some = <T>(xs: readonly T[], n: number): T[] => [...xs].sort(() => next() - 0.5).slice(0, n);
  return { next, pick, some };
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five'];
const pct = (x: number) => `${Math.round(x)}%`;

/** Every claim in a team's explanation that doesn't hold, in words. */
function untrue(s: Situation, team: readonly string[]): string[] {
  const m = modelFor(s);
  const e = explainTeam(m, team);
  const agents = team.map((id) => agentById(id)!);
  const row = (d: string) => e.strengths.find((r) => r.dim === d)!;
  const count = (r: Role) => agents.filter((a) => a.role === r).length;
  const t = s.rank === 'any' ? ALL_RANKS_T : rankOf(s.rank).t;
  const map = MAPS.find((x) => x.id === s.map);
  const bad: string[] = [];
  type Kind = 'pro' | 'con' | 'note';
  const tag = (kind: Kind) => (l: string): [Kind, string] => [kind, l];
  const lines = [...e.pros.map(tag('pro')), ...e.cons.map(tag('con')), ...e.notes.map(tag('note'))];
  for (const [kind, line] of lines) {
    const no = (why: string) => bad.push(`${kind} "${line}": ${why}`);
    if (!/[.]$/.test(line) || line.includes('!') || /undefined|NaN|\$\{/.test(line)) no('not a plain sentence');
    // only the team's own agents are named
    for (const a of AGENTS) if (!team.includes(a.id) && new RegExp(`(?<![A-Za-z])${a.name.replace('/', '\\/')}(?![A-Za-z])`).test(line)) no(`names ${a.name}, who isn't in the team`);
    for (const d of DIMS) {
      const info = DIM_INFO[d], r = row(d);
      const after = (lead: string) => line.startsWith(`${lead} ${info.has}`) && /^[,:.]/.test(line.slice(lead.length + info.has.length + 1));
      if (kind === 'pro' && after('Strong')) {
        if (r.cover < 0.8 || r.need < 1) no(`${d} covers ${r.cover.toFixed(2)} at need ${r.need.toFixed(2)}`);
        const who = line.split(': ')[1] ?? '';
        for (const a of agents) if (who.includes(a.name) && !r.by.some((b) => b.id === a.id && b.value >= 0.45)) no(`${a.name} doesn't bring ${d}`);
      }
      for (const lead of ['No', 'Few', 'Little']) {
        if (kind !== 'con' || !(line.startsWith(`${lead} ${info.lacks}`) && /^[,:.]/.test(line.slice(lead.length + info.lacks.length + 1)))) continue;
        if (r.cover >= (lead === 'No' ? 0.25 : 0.55) || r.need < 0.9) no(`${d} covers ${r.cover.toFixed(2)} at need ${r.need.toFixed(2)}`);
      }
      if (line.startsWith(`Its thinnest spot is ${info.lacks}:`) && (r.cover >= 0.8 || r.need < 1)) no(`${d} covers ${r.cover.toFixed(2)}`);
    }
    for (const role of ROLES) {
      if (line.startsWith(`No ${role.name.toLowerCase()}`) && count(role.id) !== 0) no(`the team has ${count(role.id)}`);
      if (line.startsWith(`Three or more ${role.plural.toLowerCase()}`) && count(role.id) < 3) no(`the team has ${count(role.id)}`);
      const mix = new RegExp(`^(\\w+) (?:${role.name}|${role.plural}), where pro teams on (.+?) (?:usually run (\\w+)|rarely run one)`, 'i').exec(line);
      if (mix) {
        if (NUMBERS.indexOf(mix[1]!.toLowerCase()) !== count(role.id)) no(`the team has ${count(role.id)}`);
        const want = m.mix.want[ROLE_IDS.indexOf(role.id)]!;
        if (mix[2] !== map?.name) no('another map');
        if (mix[3] ? NUMBERS.indexOf(mix[3]) !== Math.round(want) : want >= 0.5) no(`pros run ${want.toFixed(2)}`);
      }
    }
    if (line === `Pro teams play this comp on ${map?.name}.` && overlap(map!.id, team) !== 5) no('not a pro comp');
    if (line === `Four of these five are in a comp pro teams play on ${map?.name}.` && overlap(map!.id, team) !== 4) no(`${overlap(map!.id, team)} in common`);
    // ranked win rates: the right way round, and the numbers the knowledge base has
    const win = /win(?:s)? (more|fewer) ranked games than most agents \((.+?)\)/.exec(line);
    if (win) {
      const named = agents.filter((a) => line.split(' win')[0]!.includes(a.name));
      if (!named.length) no('names nobody');
      for (const a of named) {
        if (win[1] === 'more' ? a.win <= 50 : a.win >= 50) no(`${a.name} wins ${a.win}%`);
        if (!win[2]!.includes(pct(a.win))) no(`${a.name}'s rate is ${pct(a.win)}`);
      }
    }
    // the practice a kit takes, as the score counts it
    if (/takes? practice to play well/.test(line)) {
      for (const a of agents.filter((x) => line.split(' take')[0]!.includes(x.name))) {
        const k = kitShare(a, t);
        if (kitShare(a, 0) >= KIT_NOTE.hard || t > KIT_NOTE.upTo) no(`${a.name} isn’t one of the hard kits, keeping ${pct(100 * k)} of it`);
        if (!line.includes(`about ${Math.round(k * 20) * 5}% of ${line.includes('of each kit') ? 'each kit' : `${a.name}’s`}`)) no(`${a.name} keeps about ${Math.round(k * 20) * 5}%`);
      }
    }
    if (/work(?:s)? well without much teamwork/.test(line)) for (const a of agents.filter((x) => line.split(' work')[0]!.includes(x.name))) if (a.solo < 0.8) no(`${a.name} needs the team`);
  }
  return bad;
}

test('what the explanations say is true, for random teams and for the best comps', () => {
  const r = random(20261029);
  const ids = AGENTS.map((a) => a.id);
  const problems: string[] = [];
  const check = (s: Situation, team: readonly string[]) => {
    for (const p of untrue(s, team)) problems.push(`${s.map} ${s.side} ${s.rank} [${team.map(name).join(', ')}] ${p}`);
  };
  for (let n = 0; n < 400; n++) {
    const map = r.pick(['any', ...MAPS.map((m) => m.id)]);
    const m = MAPS.find((x) => x.id === map);
    const s: Situation = { map, side: r.pick(['attack', 'defense', 'both'] as const), rank: r.pick([...RANK_IDS, 'any'] as const), sites: m && r.next() < 0.3 ? [r.pick(m.sites).id] : [] };
    check(s, r.some(ids, 5));
    if (n % 8 === 0) check(s, solve({ ...newQuery(s.rank, true), map: s.map, side: s.side, sites: [...s.sites] }, s, 1).comps[0]!.team);
  }
  none(problems.slice(0, 40));
});

test('the tiers on screen come from the fit the rankings sort by', () => {
  const problems: string[] = [];
  for (const rank of ['iron', 'gold', 'radiant'] as const) {
    for (const x of answer('any', rank, 'both', 1).agents) if (x.tier !== tierOf(x.fit)) problems.push(`${rank} ${name(x.id)}: ${x.tier} at ${x.fit}`);
  }
  none(problems);
});
