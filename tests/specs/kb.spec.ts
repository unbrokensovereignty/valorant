import { describe, spec, eq, ok, throws } from './harness.ts';
import { AGENTS, agentById, parseCaps } from '../../src/core/kb/agents.ts';
import { kitOf, abilityOn, abilityNames, plainText, textParts } from '../../src/core/kb/kits.ts';
import { MAPS, POOL, mapById, parseNeeds, calloutLabel } from '../../src/core/kb/maps.ts';
import { PRO, proKnown, proPick } from '../../src/core/kb/pro.ts';
import { PAIRS, pairOf } from '../../src/core/kb/synergy.ts';
import { RANKS } from '../../src/core/kb/ranks.ts';
import { DIMS, DIM_INFO, ROLE_IDS } from '../../src/core/kb/roles.ts';
import { NEW_AGENTS } from '../../src/core/kb/new-agents.ts';

describe('agents', () => {
  spec('every agent has a role, strengths from 0 to 1, and fair numbers', () => {
    ok(AGENTS.length >= 29, 'all the agents are in');
    eq(new Set(AGENTS.map((a) => a.id)).size, AGENTS.length, 'ids are unique');
    for (const a of AGENTS) {
      ok(ROLE_IDS.includes(a.role), `${a.name}: a known role`);
      for (const d of DIMS) ok(a.caps[d] >= 0 && a.caps[d] <= 1, `${a.name}: ${d} between 0 and 1`);
      ok(a.solo >= 0 && a.solo <= 1 && a.skill >= 0 && a.skill <= 1, `${a.name}: solo and skill between 0 and 1`);
      ok(a.pop >= 0 && a.pop <= 100 && a.pro >= 0 && a.pro <= 100, `${a.name}: pick rates are percents`);
      ok(/^\d{4}-\d\d-\d\d$/.test(a.released), `${a.name}: a release date`);
      ok(a.line.length > 20 && !a.line.includes('!'), `${a.name}: a plain line about them`);
      eq(agentById(a.id), a);
    }
  });
  spec('each role has agents, and the ranked pick shares add up to about everything', () => {
    for (const r of ROLE_IDS) ok(AGENTS.filter((a) => a.role === r).length >= 4, `${r}: at least four agents`);
    const total = AGENTS.reduce((s, a) => s + a.pop, 0);
    ok(total > 90 && total < 110, `pick shares add to ${total}`);
  });
  spec('strengths name abilities the agent really has', () => {
    for (const a of AGENTS) {
      for (const [dim, keys] of Object.entries(a.via)) {
        for (const k of keys!) if (k !== 'G') ok(abilityOn(a.id, k), `${a.name}: ${dim} names ${k}, an ability they have`);
      }
    }
  });
  spec('a typo in a strength fails loudly', () => {
    throws(() => parseCaps('smok .5 Q', 'x'));
    throws(() => parseCaps('smoke 1.5 Q', 'x'));
    throws(() => parseCaps('smoke .5 Z', 'x'));
    eq(parseCaps('smoke .5 Q; wall .25', 'x'), { caps: { smoke: 0.5, wall: 0.25 }, via: { smoke: 'Q' } });
  });
  spec('new agents are in, with their numbers marked as estimates', () => {
    for (const d of NEW_AGENTS) ok(agentById(d.id)?.name === d.name && agentById(d.id)?.estimate, `${d.name} is an agent, marked as an estimate`);
    for (const a of AGENTS) if (a.estimate) ok(NEW_AGENTS.some((d) => d.id === a.id), `${a.name} is kept with the new agents`);
  });
  spec('Hush is a full agent now that she’s out', () => {
    const hush = agentById('hush')!;
    ok(!hush.estimate, 'not an estimate');
    ok(!proKnown(hush), 'released after the pro events, so pro play doesn’t count for her yet');
    eq(['C', 'Q', 'E', 'X'].map((k) => abilityOn('hush', k)?.name), ['Flow', 'Flashbulb', 'Displacement', 'Suspension']);
  });
  spec('agents released before the pro events count their pro picks', () => {
    for (const a of AGENTS) if (a.id !== 'hush') ok(proKnown(a), a.name);
  });
});

describe('kits', () => {
  spec('every agent has a kit with an ability on each key', () => {
    for (const a of AGENTS) {
      const kit = kitOf(a.id);
      ok(kit, `${a.name} has a kit`);
      for (const k of ['C', 'Q', 'E', 'X']) ok(abilityOn(a.id, k)?.name, `${a.name}: an ability on ${k}`);
      ok(kit!.about.length > 20, `${a.name}: a line about them`);
    }
  });
  spec('ability names leave out gun play and alternate names', () => {
    eq(abilityNames('omen', 'EG'), ['Dark Cover']);
    eq(abilityNames('jett', 'G'), []);
    eq(abilityNames('kayo', 'Q'), ['FLASH/drive']);
    eq(abilityNames('astra', 'X'), ['Cosmic Divide']);
  });
  spec('abilities sit on the keys players press, with names in normal case', () => {
    eq(abilityOn('phoenix', 'Q')?.name, 'Curveball');
    eq(abilityOn('phoenix', 'E')?.name, 'Hot Hands');
    eq(abilityOn('deadlock', 'C')?.name, 'GravNet');
    eq(abilityOn('deadlock', 'E')?.name, 'Barrier Mesh');
    for (const a of AGENTS) for (const x of kitOf(a.id)!.abilities) ok(/[a-z]/.test(x.name), `${a.name}: “${x.name}”`);
  });
  spec('the game’s marks in ability text are all known, so none shows as code', () => {
    eq(textParts('EQUIP <whitebold>Flashbulb</>. Explodes, <debuffred>flashing</> all players.'), [
      { kind: 'plain', text: 'EQUIP ' }, { kind: 'name', text: 'Flashbulb' }, { kind: 'plain', text: '. Explodes, ' },
      { kind: 'enemy', text: 'flashing' }, { kind: 'plain', text: ' all players.' },
    ]);
    eq(plainText('grants <teal>haste</> to allies'), 'grants haste to allies');
    for (const a of AGENTS) for (const x of kitOf(a.id)!.abilities) {
      ok(!/[<>]/.test(plainText(x.text)), `${a.name}: ${x.name} has no stray marks`);
      ok(textParts(x.text).every((p) => p.kind !== 'plain' || !p.text.includes('</>')), `${a.name}: ${x.name}`);
    }
  });
});

describe('maps', () => {
  spec('every map has sites, a minimap with callouts, and needs that read', () => {
    eq(MAPS.length, 13);
    eq(POOL.length, 7, 'seven maps in the pool');
    for (const m of MAPS) {
      ok(m.sites.length >= 2 && m.sites.length <= 3, `${m.name}: two or three sites`);
      ok(m.callouts.length >= 15, `${m.name}: callouts`);
      ok(m.spawns.attack && m.spawns.defense, `${m.name}: both spawns`);
      for (const c of m.callouts) ok(c.x >= 0 && c.x <= 1 && c.y >= 0 && c.y <= 1, `${m.name}: ${c.name} on the minimap`);
      for (const s of m.sites) ok(m.callouts.some((c) => c.name === `${s.id} Site`), `${m.name}: ${s.id} Site is a callout`);
      for (const n of [m.needs.both, m.needs.attack, m.needs.defense]) parseNeeds(n, m.name);
      for (const s of m.sites) for (const n of [s.needs.both, s.needs.attack, s.needs.defense]) parseNeeds(n, `${m.name} ${s.id}`);
      for (const name of Object.keys(m.aka ?? {})) ok(m.callouts.some((c) => c.name === name), `${m.name}: “${name}” is a callout`);
      for (const name of Object.keys(m.places ?? {})) ok(m.callouts.some((c) => c.name === name), `${m.name}: “${name}” is a callout to move`);
      eq(mapById(m.id), m);
    }
  });
  spec('a typo in a need fails loudly', () => {
    throws(() => parseNeeds('smok +.5', 'x'));
    throws(() => parseNeeds('smoke +2', 'x'));
    eq(parseNeeds('smoke +.5; smoke -.25; wall .1', 'x'), { smoke: 0.25, wall: 0.1 });
  });
  spec('callouts show what players also call them', () => {
    const haven = mapById('haven')!;
    eq(calloutLabel(haven, 'Nowhere'), 'Nowhere');
    const named = MAPS.find((m) => m.aka && Object.keys(m.aka).length);
    if (named) {
      const [name, aka] = Object.entries(named.aka!)[0]!;
      eq(calloutLabel(named, name), `${name} (${aka})`);
    }
  });
});

describe('pro play', () => {
  spec('every map has pro picks and typical comps of five real agents, one of each role at least where pros play it', () => {
    for (const m of MAPS) {
      const p = PRO[m.id];
      ok(p, `${m.name} has pro picks`);
      for (const [id, pct] of Object.entries(p!.picks)) ok(agentById(id) && pct > 0 && pct <= 100, `${m.name}: ${id} at ${pct}%`);
      ok(p!.comps.length >= 2, `${m.name}: typical comps`);
      for (const c of p!.comps) {
        eq(new Set(c).size, 5, `${m.name}: five different agents`);
        for (const id of c) ok(agentById(id), `${m.name}: ${id} is an agent`);
        ok(c.some((id) => agentById(id)!.role === 'controller'), `${m.name}: a controller in ${c.join(', ')}`);
      }
    }
    eq(proPick('nowhere', 'jett'), 0);
  });
});

describe('pairs', () => {
  spec('pairs are two different agents, listed once, with a reason', () => {
    const seen = new Set<string>();
    for (const p of PAIRS) {
      ok(agentById(p.a) && agentById(p.b) && p.a !== p.b, `${p.a} and ${p.b}`);
      const k = [p.a, p.b].sort().join('|');
      ok(!seen.has(k), `${k} is listed once`);
      seen.add(k);
      ok(p.strength >= -3 && p.strength <= 3 && p.strength !== 0, `${k}: strength ${p.strength}`);
      ok(p.why.endsWith('.') && !p.why.includes('!'), `${k}: a plain reason`);
      eq(pairOf(p.b, p.a), p, 'either order finds it');
    }
  });
});

describe('ranks and strengths', () => {
  spec('ranks climb from Iron to Radiant, and every strength is described', () => {
    eq(RANKS.map((r) => r.id), ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'ascendant', 'immortal', 'radiant']);
    for (let i = 1; i < RANKS.length; i++) ok(RANKS[i]!.t > RANKS[i - 1]!.t);
    for (const d of DIMS) ok(DIM_INFO[d].name && DIM_INFO[d].has && DIM_INFO[d].lacks && DIM_INFO[d].blurb, `${d} is described`);
  });
});
