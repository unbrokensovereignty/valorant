// Checks that the engine's answers make sense as a whole: against pro play, ranked play and
// common sense. Each check covers many situations, so these run in Node only (they are too slow
// for the in-app self-test). When tuning engine/weights.ts or the knowledge base, run these.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, type SituationAnswer } from '../../src/core/engine/plan.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { proMixOf, type SidePick } from '../../src/core/engine/model.ts';
import type { RankId } from '../../src/core/kb/ranks.ts';
import { agentById } from '../../src/core/kb/agents.ts';
import { MAPS, POOL, type Side } from '../../src/core/kb/maps.ts';
import { PRO } from '../../src/core/kb/pro.ts';
import type { Role } from '../../src/core/kb/roles.ts';

const SIDES: readonly Side[] = ['attack', 'defense'];
const name = (id: string) => agentById(id)!.name;
const roleOf = (id: string) => agentById(id)!.role;
const solved = new Map<string, SituationAnswer>();
function answer(map: string, side: SidePick, rank: RankId, keep = 3): SituationAnswer {
  const key = [map, side, rank, keep].join('|');
  let a = solved.get(key);
  if (!a) solved.set(key, (a = solve({ ...newQuery(rank, true), map, side }, { map, side, rank, sites: [] }, keep)));
  return a;
}
const top = (map: string, side: SidePick, rank: RankId) => answer(map, side, rank).comps[0]!.team;
/** Fails once, listing every situation that went wrong. */
const none = (problems: string[]) => assert.deepEqual(problems, [], `\n${problems.join('\n')}`);

test('the best comp on every map, side and rank has a sound mix of roles', () => {
  const problems: string[] = [];
  for (const rank of ['iron', 'gold', 'diamond', 'radiant'] as const) for (const m of MAPS) for (const side of SIDES) {
    const t = top(m.id, side, rank);
    const n = (r: Role) => t.filter((id) => roleOf(id) === r).length;
    // a defense needs a sentinel, except at Radiant on a map where pro teams mostly play without one
    const noSentinel = side === 'attack' || (rank === 'radiant' && (proMixOf(m.id)?.sentinel ?? 1) < 0.5);
    const sound = n('controller') >= 1 && n('controller') <= 2 && n('duelist') <= 2 && n('initiator') >= 1 && (noSentinel || n('sentinel') >= 1);
    if (!sound) problems.push(`${m.name} ${side} at ${rank}: ${t.map(name).join(', ')}`);
  }
  none(problems);
});

test('at Immortal and Radiant, one of the top three comps shares four agents with a comp pros play (three on a defense pros play without a sentinel)', () => {
  const problems: string[] = [];
  for (const rank of ['immortal', 'radiant'] as const) for (const m of MAPS) for (const side of SIDES) {
    const pro = PRO[m.id];
    if (!pro) continue;
    const teams = answer(m.id, side, rank).comps.map((c) => c.team);
    const overlap = Math.max(...teams.flatMap((t) => pro.comps.map((pc) => pc.filter((id) => t.includes(id)).length)));
    // below Radiant a defense keeps its sentinel where pro teams play without one (see the first
    // test), so on those maps it can share one agent fewer
    const least = rank !== 'radiant' && side === 'defense' && (proMixOf(m.id)?.sentinel ?? 1) < 0.5 ? 3 : 4;
    if (overlap < least) problems.push(`${m.name} ${side} at ${rank}: at most ${overlap} in common, best is ${teams[0]!.map(name).join(', ')}`);
  }
  none(problems);
});

test('the agents pro teams pick on at least half of a map’s games show up in its top five comps at Immortal or Radiant', () => {
  const problems: string[] = [];
  for (const [map, pro] of Object.entries(PRO)) for (const [id, pct] of Object.entries(pro.picks)) {
    if (pct < 50) continue;
    const seen = ['immortal', 'radiant'].some((rank) => SIDES.some((side) => answer(map, side, rank as RankId, 5).comps.some((c) => c.team.includes(id))));
    if (!seen) problems.push(`${map}: no ${name(id)} (picked on ${pct}%)`);
  }
  none(problems);
});

/** Agent fits over every map and side at a rank, with their middle. */
function fitsAt(rank: RankId) {
  const agents = answer('any', 'both', rank, 1).agents;
  const fit = (id: string) => agents.find((a) => a.id === id)!.fit;
  const mid = [...agents].sort((a, b) => a.fit - b.fit)[Math.floor(agents.length / 2)]!.fit;
  return { fit, mid, place: (id: string) => agents.findIndex((a) => a.id === id) + 1 };
}

test('at Iron, easy agents who work alone fit better than most, and hard team-play agents worse', () => {
  const { fit, mid, place } = fitsAt('iron');
  const problems: string[] = [];
  for (const id of ['reyna', 'jett', 'sage', 'phoenix', 'brimstone']) if (fit(id) < mid) problems.push(`${name(id)} ${Math.round(fit(id))} is under the middle ${Math.round(mid)} (#${place(id)})`);
  for (const id of ['astra', 'harbor', 'iso']) if (fit(id) > mid) problems.push(`${name(id)} ${Math.round(fit(id))} is over the middle ${Math.round(mid)} (#${place(id)})`);
  none(problems);
});

test('at Radiant, the pro staples fit better than most, and selfish agents worse', () => {
  const { fit, mid, place } = fitsAt('radiant');
  const problems: string[] = [];
  for (const id of ['sova', 'viper', 'omen', 'fade', 'neon', 'yoru', 'chamber']) if (fit(id) < mid) problems.push(`${name(id)} ${Math.round(fit(id))} is under the middle ${Math.round(mid)} (#${place(id)})`);
  // (not Phoenix: pro teams picked him on 45% of Haven's games and 38% of Ascent's at Champions 2026)
  for (const id of ['reyna', 'iso']) if (fit(id) > mid) problems.push(`${name(id)} ${Math.round(fit(id))} is over the middle ${Math.round(mid)} (#${place(id)})`);
  none(problems);
});

test('the best comps vary from map to map, and new agents don’t take over', () => {
  const problems: string[] = [];
  for (const rank of ['iron', 'gold', 'radiant'] as const) {
    const tops = POOL.flatMap((m) => SIDES.map((side) => top(m.id, side, rank)));
    const count = new Map<string, number>();
    for (const t of tops) for (const id of t) count.set(id, (count.get(id) ?? 0) + 1);
    // at Iron the easiest agents who work alone win most places, so fewer different agents lead
    const least = rank === 'iron' ? { agents: 10, controllers: 2 } : { agents: 12, controllers: 3 };
    if (count.size < least.agents) problems.push(`${rank}: only ${count.size} different agents`);
    // controllers come back on every map, since every team needs one; anyone else shouldn't
    const others = [...count].filter(([id]) => roleOf(id) !== 'controller').sort((a, b) => b[1] - a[1]);
    const [most, times] = others[0]!;
    if (times / tops.length > 0.86) problems.push(`${rank}: ${name(most)} is in ${times} of ${tops.length}`);
    const controllers = [...count.keys()].filter((id) => roleOf(id) === 'controller');
    if (controllers.length < least.controllers) problems.push(`${rank}: only ${controllers.map(name).join(' and ')} as controllers`);
    const early = tops.filter((t) => t.some((id) => agentById(id)!.estimate)).length;
    if (early / tops.length > 0.25) problems.push(`${rank}: a new agent leads ${early} of ${tops.length}`);
  }
  none(problems);
});
