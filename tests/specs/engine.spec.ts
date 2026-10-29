import { describe, spec, eq, ok, near } from './harness.ts';
import { AGENTS, agentById } from '../../src/core/kb/agents.ts';
import { NEW_AGENTS } from '../../src/core/kb/new-agents.ts';
import { POOL, MAPS } from '../../src/core/kb/maps.ts';
import { RANK_IDS } from '../../src/core/kb/ranks.ts';
import { ROLE_IDS } from '../../src/core/kb/roles.ts';
import { D, N, ROLE_OF, kitShare, modelFor, proMixOf, proShare, roleIndex, type Situation } from '../../src/core/engine/model.ts';
import { anyRoles, scoreTeam, searchTeams, TopK, walkTeams, type Rules } from '../../src/core/engine/search.ts';
import { askFor, fillLikelihood, pickWeight, searchParties, type PartyRules } from '../../src/core/engine/party.ts';
import { newQuery, placesTaken, sanitizeQuery, situationsOf, asksBest, nothingFixed, type Query } from '../../src/core/engine/query.ts';
import { agentFitOf, fitOf, poolsFit, referenceFor, rulesOf, solve, teamFit } from '../../src/core/engine/plan.ts';
import { explainTeam } from '../../src/core/engine/explain.ts';
import { ROLE_COST, TIERS, tierOf } from '../../src/core/engine/weights.ts';

const at = (map: string, side: Situation['side'] = 'both', rank: Situation['rank'] = 'gold', sites: Situation['sites'] = []): Situation => ({ map, side, rank, sites });
const ix = (id: string) => agentById(id)!.index;
const ids = (xs: readonly number[]) => xs.map((i) => AGENTS[i]!.id);
const anyone: Rules = { include: [], allowed: () => true, roles: anyRoles() };
const q = (patch: Partial<Query>): Query => sanitizeQuery({ ...newQuery(), ...patch });
const choose = (n: number, k: number): number => (k === 0 ? 1 : (n * choose(n - 1, k - 1)) / k);

/** Every team of `size` from `pool`, the plain way. */
function combos(pool: readonly number[], size: number): number[][] {
  const out: number[][] = [];
  const rec = (start: number, cur: number[]) => {
    if (cur.length === size) { out.push(cur.slice()); return; }
    for (let i = start; i < pool.length; i++) { cur.push(pool[i]!); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  return out;
}

describe('the model', () => {
  spec('strength weights add up to one for every situation, and both sides or any map are the average', () => {
    for (const m of MAPS) for (const side of ['attack', 'defense', 'both'] as const) {
      const w = modelFor(at(m.id, side)).weight;
      near(w.reduce((a, b) => a + b, 0), 1, 1e-9, `${m.name} ${side}`);
      ok(w.every((x) => x > 0), `${m.name} ${side}: every strength counts a little`);
    }
    const a = modelFor(at('haven', 'attack')).weight, d = modelFor(at('haven', 'defense')).weight, b = modelFor(at('haven', 'both')).weight;
    for (let j = 0; j < D; j++) near(b[j]!, (a[j]! + d[j]!) / 2, 1e-12);
    const any = modelFor(at('any', 'attack')).weight;
    for (let j = 0; j < D; j++) near(any[j]!, POOL.reduce((s, m) => s + modelFor(at(m.id, 'attack')).weight[j]!, 0) / POOL.length, 1e-12);
  });
  spec('a model is kept and handed back for the same situation, whatever order its sites came in', () => {
    eq(modelFor(at('haven', 'attack', 'gold', ['A', 'C'])), modelFor(at('haven', 'attack', 'gold', ['C', 'A'])));
  });
  spec('a team far from the map’s pro role mix gives up a little, more so at high ranks', () => {
    const cost = (map: string, rank: Situation['rank'], c: number) => modelFor(at(map, 'attack', rank)).mix.cost[roleIndex('controller') * 5 + c]!;
    // pros run about two controllers on Lotus and about one on Sunset
    near(proMixOf('lotus')!.controller, 1.77, 0.01);
    near(proMixOf('sunset')!.controller, 1.08, 0.01);
    ok(cost('lotus', 'radiant', 2) > cost('lotus', 'radiant', 1));
    ok(cost('sunset', 'radiant', 1) > cost('sunset', 'radiant', 2));
    ok(cost('lotus', 'radiant', 2) - cost('lotus', 'radiant', 1) > cost('lotus', 'iron', 2) - cost('lotus', 'iron', 1));
    // a small sample pulls less: Bind's numbers come from five maps
    ok(proShare('bind') < proShare('lotus') && proShare('bind') >= 0.5);
    // the role costs hold the mix's part on top of the hard rules
    const m = modelFor(at('lotus', 'attack', 'radiant'));
    for (let c = 0; c < 5; c++) near(m.roleCost[roleIndex('controller') * 5 + c]!, ROLE_COST.controller.attack[c]! + m.mix.cost[roleIndex('controller') * 5 + c]!, 1e-12);
    // any map is the average of the pool
    near(cost('any', 'radiant', 1), POOL.reduce((acc, p) => acc + cost(p.id, 'radiant', 1), 0) / POOL.length, 1e-12);
    const cons = (team: string[], map: string) => explainTeam(modelFor(at(map, 'attack', 'radiant')), team).cons.join(' ');
    ok(/One controller, where pro teams on Lotus usually run two/.test(cons(['omen', 'sova', 'fade', 'raze', 'killjoy'], 'lotus')));
    ok(!/controller/i.test(cons(['omen', 'sova', 'fade', 'raze', 'killjoy'], 'sunset')));
    ok(/Two controllers, where pro teams on Sunset usually run one/.test(cons(['omen', 'viper', 'fade', 'neon', 'chamber'], 'sunset')));
    ok(!/where pro teams/.test(cons(['omen', 'viper', 'fade', 'raze', 'chamber'], 'lotus')));
    // at Iron the pro mix hardly counts, so the cons leave it out
    ok(!/where pro teams/.test(explainTeam(modelFor(at('lotus', 'attack', 'iron')), ['omen', 'sova', 'fade', 'raze', 'killjoy']).cons.join(' ')));
  });
  spec('where pro teams mostly play without a role, having none of it costs less at high ranks, and the con says why', () => {
    const none = (rank: Situation['rank']) => modelFor(at('abyss', 'defense', rank)).roleCost[roleIndex('sentinel') * 5]!;
    // pros on Abyss hardly ever run a sentinel
    ok(proMixOf('abyss')!.sentinel < 0.5);
    ok(none('radiant') > none('iron'));
    ok(none('radiant') < 0, 'still a cost: a defense without one gives something up');
    const con = (rank: Situation['rank']) => explainTeam(modelFor(at('abyss', 'defense', rank)), ['yoru', 'waylay', 'sova', 'astra', 'harbor']).cons[0]!;
    eq(con('radiant').startsWith('No sentinel, as most pro teams play Abyss: '), true, con('radiant'));
    eq(con('iron').startsWith('No sentinel: '), true, con('iron'));
    // the gaps it leaves are said once, with how to play around them
    ok(!explainTeam(modelFor(at('abyss', 'defense', 'iron')), ['yoru', 'waylay', 'sova', 'astra', 'harbor']).cons.some((c) => /^(No|Little) (site setups|flank watch)/.test(c)));
    // on a map where pros run one, nothing changes
    const lotus = modelFor(at('lotus', 'defense', 'radiant'));
    near(lotus.mix.relax[roleIndex('sentinel')]!, 0, 1e-12);
  });
  spec('pair synergy is the same both ways', () => {
    const m = modelFor(at('bind'));
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) eq(m.pair[a * N + b], m.pair[b * N + a]);
  });
});

describe('searching teams', () => {
  spec('every five-agent team is scored when nothing is fixed', () => {
    const r = searchTeams(modelFor(at('ascent')), anyone, 5);
    eq(r.count, choose(N, 5));
    ok(r.best >= r.top[0]!.score - 1e-12 && r.best <= r.top[0]!.score + 1e-12);
    ok(r.mid < r.best);
  });
  spec('the fast search scores teams exactly as the plain sum does', () => {
    for (const s of [at('haven', 'attack', 'iron'), at('lotus', 'defense', 'radiant'), at('any', 'both', 'any')]) {
      const m = modelFor(s);
      const r = searchTeams(m, anyone, 30);
      for (const t of r.top) near(t.score, scoreTeam(m, t.agents), 1e-9, ids(t.agents).join(','));
      for (let a = 0; a < N; a++) near(r.bestWith[a]!.score, scoreTeam(m, r.bestWith[a]!.agents), 1e-9);
    }
  });
  spec('with a few agents to choose from, the search finds the same best teams as trying them all', () => {
    const m = modelFor(at('split', 'attack', 'diamond'));
    const pool = ['omen', 'viper', 'sova', 'fade', 'raze', 'jett', 'killjoy', 'cypher', 'skye', 'brimstone'].map(ix);
    const include = [ix('omen'), ix('raze')];
    const rules: Rules = { include, allowed: (i) => pool.includes(i), roles: anyRoles() };
    const r = searchTeams(m, rules, 200);
    const plain = combos(pool.filter((i) => !include.includes(i)), 3).map((c) => [...include, ...c]).map((t) => ({ t: [...t].sort((a, b) => a - b), s: scoreTeam(m, t) })).sort((a, b) => b.s - a.s);
    eq(r.count, plain.length);
    eq(r.top.length, plain.length);
    r.top.forEach((t, i) => near(t.score, plain[i]!.s, 1e-9, `team ${i + 1}`));
    eq(r.top[0]!.agents, plain[0]!.t);
  });
  spec('included agents are always in, left-out agents never, and role counts are exact', () => {
    const m = modelFor(at('haven', 'both', 'gold'));
    const rules: Rules = { include: [ix('sage')], allowed: (i) => i !== ix('omen') && i !== ix('jett'), roles: ROLE_IDS.map((r) => (r === 'controller' ? 2 : r === 'duelist' ? 0 : -1)) };
    const r = searchTeams(m, rules, 40);
    ok(r.top.length === 40);
    for (const t of r.top) {
      ok(t.agents.includes(ix('sage')), 'Sage is in');
      ok(!t.agents.includes(ix('omen')) && !t.agents.includes(ix('jett')), 'Omen and Jett are out');
      eq(t.agents.filter((a) => AGENTS[a]!.role === 'controller').length, 2, 'two controllers');
      eq(t.agents.filter((a) => AGENTS[a]!.role === 'duelist').length, 0, 'no duelist');
    }
    for (let a = 0; a < N; a++) if (r.bestWith[a]) ok(r.bestWith[a]!.agents.includes(ix('sage')));
    eq(r.bestWith[ix('omen')], null, 'no team has a left-out agent');
  });
  spec('rules that can’t be met give no teams rather than wrong ones', () => {
    const m = modelFor(at('bind'));
    eq(searchTeams(m, { include: [ix('omen'), ix('viper'), ix('brimstone')], allowed: () => true, roles: ROLE_IDS.map((r) => (r === 'controller' ? 2 : -1)) }).count, 0);
    eq(searchTeams(m, { include: [], allowed: () => true, roles: ROLE_IDS.map(() => 2) }).count, 0, 'eight role slots in a team of five');
    const none = searchTeams(m, { include: [], allowed: (i) => i < 3, roles: anyRoles() });
    eq([none.count, none.top.length, none.best, none.mid], [0, 0, 0, 0]);
  });
  spec('keeping the best few keeps exactly the best few', () => {
    const k = new TopK(3);
    for (const s of [5, 1, 9, 3, 7, 2, 8]) k.push(s, [s, 0, 0, 0, 0]);
    eq(k.list().map((t) => t.score), [9, 8, 7]);
  });
  spec('walking teams of fewer than five, for a party, counts them all', () => {
    eq(walkTeams(modelFor(at('pearl')), anyone, 2, () => {}), choose(N, 2));
    eq(walkTeams(modelFor(at('pearl')), anyone, 3, () => {}), choose(N, 3));
  });
});

describe('fits and tiers', () => {
  spec('the best team fits 100, the middle team 50, and fits stay between 0 and 100', () => {
    const ref = { best: 2, mid: 1 };
    eq([fitOf(2, ref), fitOf(1, ref), fitOf(1.5, ref), fitOf(9, ref), fitOf(-9, ref)], [100, 50, 75, 100, 0]);
    eq(fitOf(1, { best: 1, mid: 1 }), 100, 'all teams equal');
    eq(agentFitOf(2, ref), 100);
    ok(agentFitOf(1.9, ref) < fitOf(1.9, ref), 'agent fits are spread out more');
  });
  spec('tiers go from S down, and every fit has one', () => {
    eq(TIERS.map((t) => t.id), ['S', 'A', 'B', 'C', 'D']);
    eq([tierOf(100), tierOf(TIERS[0]!.min), tierOf(TIERS[0]!.min - 0.6), tierOf(0)], ['S', 'S', 'A', 'D']);
  });
  spec('a tier goes by the fit as shown, so comps that show the same number share a tier', () => {
    const min = TIERS[0]!.min;
    eq([tierOf(min - 0.4), tierOf(min - 0.5), tierOf(min - 0.51)], ['S', 'S', 'A']);
  });
  spec('the yardstick for a situation is all teams, whatever a question fixes', () => {
    const m = modelFor(at('icebox'));
    const ref = referenceFor(m, true);
    const r = searchTeams(m, anyone, 1);
    near(ref.best, r.best, 1e-12);
    const answer = solve(q({ map: 'icebox', include: ['sage', 'reyna'] }), at('icebox'), 5);
    eq(answer.ref, ref);
    ok(answer.comps[0]!.fit < 100, 'a fixed pick fits less than the best team');
  });
  spec('a saved team gets the same fit the answers gave it', () => {
    const s = at('lotus', 'attack', 'platinum', ['A']);
    const answer = solve(q({ map: 'lotus', side: 'attack', rank: 'platinum', sites: ['A'] }), s, 3);
    for (const c of answer.comps) {
      const t = teamFit(s, [...c.team].reverse(), true);
      near(t.fit, c.fit, 1e-9, c.team.join());
      eq(t.tier, c.tier);
    }
  });
});

describe('questions', () => {
  spec('a damaged question falls back to the defaults, and parts that clash are dropped', () => {
    eq(sanitizeQuery(null), newQuery());
    eq(sanitizeQuery({ map: 'nowhere', side: 'up', rank: 'gold 2', party: 4 }), newQuery());
    const x = sanitizeQuery({ map: 'haven', sites: ['A', 'A', 'D', 'C'], party: 3, include: ['jett', 'jett', 'sova', 'omen', 'sage'], locked: ['jett', 'viper', 'nobody'], exclude: ['viper', 'reyna'] });
    eq(x.sites, ['A', 'C']);
    eq(x.include, ['jett', 'sova', 'omen'], 'no more than the party');
    eq(x.locked, ['viper'], 'locked agents aren’t also yours');
    eq(x.exclude, ['reyna'], 'left-out agents aren’t yours or locked');
    eq(sanitizeQuery({ map: 'haven', sites: ['A', 'B', 'C'] }).sites, [], 'every site is the same as none');
    eq(sanitizeQuery({ map: 'any', sites: ['A'] }).sites, [], 'sites need a map');
    eq(sanitizeQuery({ party: 5, locked: ['jett'] }).locked, [], 'a five-stack has no random teammates');
  });
  spec('role counts that can’t add up are dropped', () => {
    eq(sanitizeQuery({ roles: { duelist: 2, controller: 2, initiator: 2 } }).roles, {}, 'six in a team of five');
    eq(sanitizeQuery({ party: 2, roles: { duelist: 3 } }).roles, {}, 'three in a duo');
    eq(sanitizeQuery({ include: ['jett', 'raze'], roles: { duelist: 1, controller: 2 } }).roles, { controller: 2 }, 'fewer duelists than included');
    eq(sanitizeQuery({ roles: { duelist: 1.5, sentinel: -1, controller: 1 } }).roles, { controller: 1 });
    eq(sanitizeQuery({ include: ['jett', 'omen', 'sova'], roles: { sentinel: 3 } }).roles, {}, 'no room beside three must-play agents');
    eq(sanitizeQuery({ include: ['jett', 'omen'], roles: { sentinel: 3 } }).roles, { sentinel: 3 }, 'room for exactly three');
    eq(placesTaken(['jett', 'omen', 'viper'], { controller: 1, sentinel: 2 }), 5, 'two controllers must play though one was asked for');
  });
  spec('pools come one per player, or not at all', () => {
    eq(sanitizeQuery({ party: 2, pools: [['jett'], ['omen'], ['sova']] }).pools, []);
    eq(sanitizeQuery({ party: 2, pools: [['jett', 'nobody'], []] }).pools, [['jett'], []]);
    eq(sanitizeQuery({ party: 2, pools: [[], []] }).pools, [], 'nobody restricted');
  });
  spec('“find the best” asks about every value of that field', () => {
    eq(situationsOf(newQuery()).length, 1);
    eq(situationsOf(q({ map: 'best' })).length, POOL.length);
    eq(situationsOf(q({ map: 'best', allMaps: true })).length, MAPS.length);
    eq(situationsOf(q({ map: 'best', side: 'best' })).length, POOL.length * 2);
    eq(situationsOf(q({ rank: 'best' })).map((s) => s.rank), [...RANK_IDS]);
    eq(situationsOf(q({ map: 'haven', sites: ['C'] }))[0]!.sites, ['C']);
    eq(asksBest(q({ map: 'best', rank: 'best' })), ['map', 'rank']);
    ok(nothingFixed(newQuery()) && !nothingFixed(q({ include: ['jett'] })) && !nothingFixed(q({ party: 2 })));
  });
});

describe('answers', () => {
  spec('a five-stack question gives comps best first, and every agent a fit', () => {
    const a = solve(q({ map: 'ascent' }), at('ascent'), 10);
    eq(a.comps.length, 10);
    for (let i = 1; i < a.comps.length; i++) ok(a.comps[i - 1]!.score >= a.comps[i]!.score);
    eq(a.comps[0]!.fit, 100);
    eq(a.agents.length, N);
    for (const x of a.agents) ok(x.team.includes(x.id) && x.fit >= 0 && x.fit <= 100, x.id);
    eq(a.agents[0]!.fit, 100, 'the best team’s agents fit 100');
    eq(new Set(a.comps.map((c) => c.team.join())).size, 10, 'no comp twice');
  });
  spec('leaving out new agents leaves them out of every answer', () => {
    const a = solve(q({ map: 'haven', newAgents: false }), at('haven'), 30);
    for (const d of NEW_AGENTS) {
      ok(!a.comps.some((c) => c.team.includes(d.id)), d.name);
      ok(!a.agents.some((x) => x.id === d.id), d.name);
    }
    ok(a.agents.some((x) => x.id === 'hush'), 'Hush is a full agent now, so she stays in');
  });
  spec('saved party pools: each player gets an agent they play', () => {
    const pools = [['jett', 'reyna'], ['omen'], ['sova', 'fade'], [], ['killjoy', 'cypher', 'jett']];
    const a = solve(q({ map: 'bind', pools }), at('bind'), 20);
    ok(a.comps.length > 0);
    const fits = poolsFit(pools.map((p) => p.map(ix)))!;
    for (const c of a.comps) ok(fits(c.team.map(ix), 5), c.team.join(', '));
    ok(a.comps.every((c) => c.team.includes('omen')), 'the one-agent player plays Omen');
  });
  spec('matching players to agents tries every way round', () => {
    const f = poolsFit([[1, 2], [1]])!;
    ok(f([1, 2], 2), 'the first player takes 2 so the second can take 1');
    ok(!poolsFit([[1], [1]])!([1, 2], 2), 'two players can’t both play 1');
    ok(poolsFit([[], [3]])!([3, 7], 2));
    eq(poolsFit([]), undefined);
  });
  spec('the rules of a question: left out, locked and new agents can’t be picked', () => {
    const r = rulesOf(q({ party: 3, exclude: ['reyna'], locked: ['jett'], newAgents: false }));
    ok(!r.allowed(ix('reyna')) && !r.allowed(ix('jett')) && r.allowed(ix('omen')) && r.allowed(ix('hush')));
    for (const d of NEW_AGENTS) ok(!r.allowed(ix(d.id)), d.name);
    const pooled = rulesOf(q({ party: 2, pools: [['omen'], ['sova']] }));
    ok(pooled.allowed(ix('omen')) && !pooled.allowed(ix('jett')), 'only agents someone plays');
    ok(rulesOf(q({ party: 2, pools: [['omen'], []] })).allowed(ix('jett')), 'a player who plays anyone can take anyone');
  });
});

describe('duos and trios', () => {
  spec('random teammates favour popular agents, and teams without a controller are rare', () => {
    const t = 0.5;
    ok(pickWeight(ix('jett'), t) > pickWeight(ix('harbor'), t));
    const counts = (roles: Record<string, number>) => ROLE_IDS.map((r) => roles[r] ?? 0);
    ok(fillLikelihood(counts({ duelist: 2, initiator: 2, sentinel: 1 })) < fillLikelihood(counts({ duelist: 1, initiator: 2, sentinel: 1, controller: 1 })));
    ok(fillLikelihood(counts({ duelist: 3, controller: 1, initiator: 1 })) < fillLikelihood(counts({ duelist: 2, controller: 1, initiator: 1, sentinel: 1 })));
  });
  spec('a duo’s expected score is the weighted average over every fill', () => {
    const m = modelFor(at('sunset', 'attack', 'platinum'));
    const rules: PartyRules = { include: [ix('omen'), ix('sova')], allowed: () => true, roles: anyRoles(), locked: [ix('jett')], fillable: () => true };
    const r = searchParties(m, rules, 2, 0.5, 1);
    eq(r.count, 1);
    const pick = r.top[0]!;
    const fixed = [ix('omen'), ix('sova'), ix('jett')];
    let sw = 0, sws = 0, best = -Infinity;
    for (const fill of combos([...Array(N).keys()].filter((i) => !fixed.includes(i)), 2)) {
      const team = [...fixed, ...fill];
      const c = new Array(ROLE_IDS.length).fill(0);
      for (const a of team) c[ROLE_OF[a]!]++;
      const w = pickWeight(fill[0]!, 0.5) * pickWeight(fill[1]!, 0.5) * fillLikelihood(c);
      const s = scoreTeam(m, team);
      sw += w; sws += w * s;
      best = Math.max(best, s);
    }
    near(pick.expected, sws / sw, 1e-9);
    near(pick.best.score, best, 1e-9);
    ok(pick.spread > 0);
    ok(pick.likely.agents.length === 5 && fixed.every((a) => pick.likely.agents.includes(a)));
  });
  spec('a trio answer keeps the party in every comp and says which roles to hope for', () => {
    const a = solve(q({ map: 'lotus', party: 3, include: ['viper'] }), at('lotus'), 5);
    eq(a.comps.length, 5);
    for (const c of a.comps) {
      eq(c.party.length, 3);
      ok(c.party.includes('viper') && c.team.includes('viper'));
      // the comp shown is the party with the best picks for the random teammates
      ok(c.pickFit! >= c.expected!, 'the best picks are at least what to expect');
      ok(c.others!.every((o) => o.fit <= c.pickFit! + 1e-9 && o.team.includes('viper')), 'other picks come after the best, with the party');
      ok(c.likely!.fit <= c.pickFit! + 1e-9 && c.party.every((id) => c.likely!.team.includes(id)), 'the likeliest team keeps the party');
      ok(c.fit <= 100 && c.expected! <= c.fit + 1e-9, 'ranked against the best party, which a five-stack beats');
      eq(c.team.length, 5);
    }
    // only roles the best party's picks play, so the role to ask for is one the picks have
    const picked: string[] = a.comps[0]!.team.filter((id) => !a.comps[0]!.party.includes(id)).map((id) => agentById(id)!.role);
    ok(a.askFor && a.askFor.length >= 1 && a.askFor.every((x) => picked.includes(x.role)), 'roles the picks play');
    for (let i = 1; i < a.askFor!.length; i++) ok(a.askFor![i - 1]!.fit >= a.askFor![i]!.fit);
  });
  spec('asking for a role compares teams where a random teammate plays it', () => {
    const m = modelFor(at('haven'));
    const rules: PartyRules = { include: [], allowed: () => true, roles: anyRoles(), locked: [], fillable: () => true };
    const party = [ix('jett'), ix('raze'), ix('reyna')];
    const ask = askFor(m, party, rules, 0.5);
    eq(ask[0]!.role, 'controller', 'three duelists want a controller most');
    ok(ask.every((x) => x.chance > 0 && x.chance < 1), 'random teammates bring each role in some games, not all');
    // the two random teammates play two agents, so the chances of the four roles add up to between one and two
    const total = ask.reduce((n, x) => n + x.chance, 0);
    ok(total >= 1 - 1e-9 && total <= 2 + 1e-9, `the chances add up to ${total}`);
  });
});

describe('explanations', () => {
  spec('a team without a controller hears it first', () => {
    const e = explainTeam(modelFor(at('ascent', 'attack')), ['jett', 'raze', 'sova', 'killjoy', 'breach']);
    ok(e.cons[0]!.startsWith('No controller'));
  });
  spec('strengths are credited to the agents who bring them, with their abilities', () => {
    const e = explainTeam(modelFor(at('bind', 'attack', 'diamond')), ['raze', 'breach', 'brimstone', 'viper', 'cypher']);
    for (const row of e.strengths) {
      for (const b of row.by) ok(['raze', 'breach', 'brimstone', 'viper', 'cypher'].includes(b.id));
      ok(row.cover >= 0 && row.cover <= 1);
    }
    ok(e.pros.some((p) => p.includes('Breach’s stuns')), 'the Breach and Raze combo is a pro');
    ok([...e.pros, ...e.cons].every((x) => /[.]$/.test(x) && !x.includes('!') && !x.includes('  ')), 'plain sentences');
  });
  spec('a comp with no real gap still names its thinnest spot, and how to play around it', () => {
    const s = at('lotus', 'attack', 'immortal');
    const best = solve({ ...newQuery('immortal'), map: 'lotus', side: 'attack' }, s, 1).comps[0]!.team;
    const e = explainTeam(modelFor(s), best);
    ok(e.cons.length > 0);
    const thin = e.cons.find((c) => c.startsWith('Its thinnest spot is '));
    if (thin) ok(!e.cons.some((c) => /^(No|Few|Little) /.test(c)), 'only when there is no real gap');
    ok(e.cons.every((x) => /[.]$/.test(x)));
  });
  spec('a new agent gets a note that the numbers are estimates', () => {
    for (const d of NEW_AGENTS) {
      const e = explainTeam(modelFor(at('pearl')), [d.id, 'omen', 'sova', 'killjoy', 'fade']);
      ok(e.notes.some((n) => n.includes(`${d.name} is new`)), d.name);
    }
    const e = explainTeam(modelFor(at('pearl')), ['hush', 'omen', 'sova', 'killjoy', 'fade']);
    ok(!e.notes.some((n) => n.includes('estimate')), 'Hush’s numbers aren’t estimates any more');
  });
  spec('pro play doesn’t pull an agent who came out after the pro events either way', () => {
    for (const rank of ['iron', 'radiant'] as const) {
      const m = modelFor(at('haven', 'attack', rank));
      eq(m.fitParts.pro[ix('hush')], 0, rank);
    }
    // her hard kit still costs at low ranks, and nothing at Radiant
    const hush = agentById('hush')!;
    ok(kitShare(hush, 0) < 0.75, 'a team at Iron gets less of her kit');
    eq(kitShare(hush, 1), 1);
    eq(modelFor(at('haven', 'attack', 'radiant')).fitParts.rank[ix('hush')], 0);
  });
});
