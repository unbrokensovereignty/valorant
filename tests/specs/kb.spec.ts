import { describe, spec, eq, ok, throws } from './harness.ts';
import { AGENTS, agentById, isNew, parseCaps } from '../../src/core/kb/agents.ts';
import { kitOf, abilityOn, abilityNames, plainText, textParts } from '../../src/core/kb/kits.ts';
import { MAPS, MECHANICS, POOL, mapById, parseNeeds, calloutLabel } from '../../src/core/kb/maps.ts';
import { hasFloor, onFloor, walk, type Spot } from '../../src/core/kb/floor.ts';
import { PLAYS } from '../../src/core/kb/plays.ts';
import { AGENT_MAP_TIPS, MAP_TIPS } from '../../src/core/kb/tips.ts';
import { PRO, PRO_MAPS_COUNTED, RECORDED, proKnown, proOverall, proPick, proRoleMix } from '../../src/core/kb/pro.ts';
import { PAIRS, pairOf } from '../../src/core/kb/synergy.ts';
import { RANKS } from '../../src/core/kb/ranks.ts';
import { DIMS, DIM_INFO, ROLE_IDS } from '../../src/core/kb/roles.ts';
import { NEW_AGENTS } from '../../src/core/kb/new-agents.ts';
import { inUse } from '../../src/core/settings.ts';

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
    eq(inUse('includeNew'), NEW_AGENTS.length > 0, '“Include new agents” is offered only while there are some');
  });
  spec('Hush is a full agent now that she’s out', () => {
    const hush = agentById('hush')!;
    ok(!hush.estimate, 'not an estimate');
    ok(isNew(hush, '2026-10-26') && isNew(hush, '2026-10-29') && isNew(hush, '2026-12-26'), 'new from just before her release to two months after');
    ok(!isNew(hush, '2026-12-27') && !isNew(agentById('jett')!, '2026-10-29'), 'and not after that, nor an agent out for years');
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
  spec('every callout stands on its minimap’s floor', () => {
    for (const m of MAPS) {
      ok(hasFloor(m.id), `${m.name}: the floor was read from its minimap`);
      for (const c of m.callouts) ok(onFloor(m.id, [c.x, c.y]), `${m.name}: ${c.name} is on the floor, not in a wall`);
    }
  });
  spec('every route in a play keeps to the floor, and goes no long way round', () => {
    const length = (ps: readonly Spot[]) => ps.slice(1).reduce((t, q, k) => t + Math.hypot(q[0] - ps[k]![0], q[1] - ps[k]![1]), 0);
    for (const p of PLAYS) {
      const m = mapById(p.map)!;
      for (const s of p.steps) {
        const spots = s.route.map((n) => m.callouts.find((c) => c.name === n)!).map((c): Spot => [c.x, c.y]);
        for (let i = 1; i < spots.length; i++) {
          const a = spots[i - 1]!, b = spots[i]!, line = walk(m.id, a, b);
          const where = `${m.name}: ${s.route[i - 1]} to ${s.route[i]}`;
          // a spot every half a percent of the minimap along the line
          for (let k = 1; k < line.length; k++) {
            const [x0, y0] = line[k - 1]!, [x1, y1] = line[k]!;
            const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 200);
            for (let j = 0; j <= n; j++) ok(onFloor(m.id, [x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n]), `${where} goes through a wall`);
          }
          ok(length(line) <= 2.2 * length([a, b]) + 0.05, `${where} goes a long way round`);
        }
      }
    }
  });
  spec('a route goes round a wall rather than through it', () => {
    // Lotus: from C Mound to B Main there's a wall in the straight line, so the route bends
    const lotus = mapById('lotus')!, at = (n: string): Spot => { const c = lotus.callouts.find((x) => x.name === n)!; return [c.x, c.y]; };
    const line = walk('lotus', at('C Mound'), at('B Main'));
    ok(line.length > 2, 'it has a corner');
    eq(line[0], at('C Mound'));
    eq(line[line.length - 1], at('B Main'));
    eq(walk('nowhere', [0.1, 0.1], [0.9, 0.9]), [[0.1, 0.1], [0.9, 0.9]], 'a map without a floor gets the straight line');
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
  spec('each map’s picks add up to about five agents a team, from a count of maps or marked as an earlier year’s', () => {
    for (const [id, p] of Object.entries(PRO)) {
      const sum = Object.values(p.picks).reduce((a, b) => a + b, 0);
      ok(sum >= 440 && sum <= 530, `${id}: picks add to ${sum}%`);
      if (p.dated) eq(p.games, undefined, `${id}: an earlier year’s numbers have no count of maps`);
      else ok(Number.isInteger(p.games) && p.games! >= 1, `${id}: picks from a number of maps`);
      for (const c of p.comps) for (const a of c) ok(proPick(id, a) > 0, `${id}: ${a} is in a typical comp, so pros picked them there`);
      const mix = proRoleMix(id, (x) => agentById(x)?.role)!;
      ok(Math.abs(Object.values(mix).reduce((a, b) => a + b, 0) - 5) < 1e-9, `${id}: the role mix is five agents`);
    }
  });
  spec('a map’s line about what wins there names only agents pros often pick on it', () => {
    for (const m of MAPS) {
      for (const a of AGENTS) {
        if (!new RegExp(`(?<![A-Za-z])${a.name.replace('/', '\\/')}(?![A-Za-z])`).test(m.keys)) continue;
        ok(proPick(m.id, a.id) >= 40, `${m.name} names ${a.name}, picked on ${proPick(m.id, a.id)}% of its pro maps`);
      }
    }
  });
  spec('an agent’s pro share is their picks over every map counted', () => {
    eq(PRO_MAPS_COUNTED, Object.values(PRO).reduce((sum, p) => sum + (p.games ?? 0), 0));
    const games = (a: string) => Object.values(PRO).reduce((sum, p) => sum + ((p.picks[a] ?? 0) / 100) * (p.games ?? 0), 0);
    for (const a of AGENTS) {
      eq(a.pro, proOverall(a.id));
      ok(Math.abs(a.pro - (100 * games(a.id)) / PRO_MAPS_COUNTED) <= 0.5, `${a.name}: ${a.pro}%`);
    }
    eq(agentById('hush')!.pro, 0, 'none yet for an agent released after the events');
  });
  spec('the recorded comps are five real agents, won no more often than played', () => {
    ok(RECORDED.length >= 3);
    for (const r of RECORDED) {
      eq(new Set(r.agents).size, 5, r.agents.join(', '));
      for (const id of r.agents) ok(agentById(id) && proKnown(agentById(id)!), `${id} is an agent pros could pick`);
      ok(Number.isInteger(r.maps) && Number.isInteger(r.won) && r.won >= 0 && r.won <= r.maps && r.maps >= 1, `${r.agents.join(', ')}: ${r.won} of ${r.maps}`);
      ok(r.event.length > 0);
    }
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

describe('map tips and mechanics', () => {
  // words that start an ability's or agent's name ("A Toxic Screen", "A Killjoy Alarmbot"), not a callout
  const names = new Set(AGENTS.flatMap((a) => [a.name, ...(kitOf(a.id)?.abilities.map((x) => x.name) ?? [])]).flatMap((n) => n.split(/[\s/]+/)));
  /** "A Main", "Mid Market" and the like in a text that aren't callouts on the map. */
  const unknownCallouts = (mapId: string, text: string): string[] => {
    const map = mapById(mapId)!;
    const has = (name: string) => map.callouts.some((c) => c.name === name);
    const out: string[] = [];
    for (const m of text.matchAll(/\b(A|B|C|Mid) ([A-Z][a-z]+)(?: ([A-Z][a-z]+))?/g)) {
      if (names.has(m[2]!) || (m[1] === 'A' && m.index === 0)) continue;
      if (!has(`${m[1]} ${m[2]}`) && !(m[3] && has(`${m[1]} ${m[2]} ${m[3]}`))) out.push(m[0]);
    }
    return out;
  };
  spec('every callout named in a map’s tips, agent tips and mechanics is one of the map’s own', () => {
    for (const m of MAPS) {
      const texts = [...(MAP_TIPS[m.id]?.attack ?? []), ...(MAP_TIPS[m.id]?.defense ?? []), ...(m.mechanics ?? []).map((x) => x.about)];
      for (const t of Object.values(AGENT_MAP_TIPS[m.id] ?? {})) texts.push(...(typeof t === 'string' ? [t] : Object.values(t)));
      for (const t of texts) eq(unknownCallouts(m.id, t), [], `${m.name}: “${t}”`);
    }
  });
  spec('agent tips are for real agents on real maps, and each is a full sentence', () => {
    for (const [map, byAgent] of Object.entries(AGENT_MAP_TIPS)) {
      ok(mapById(map), `${map} is a map`);
      for (const [agent, t] of Object.entries(byAgent)) {
        ok(agentById(agent), `${agent} is an agent`);
        for (const text of typeof t === 'string' ? [t] : Object.values(t)) ok(/^[A-Z].*[.]$/.test(text) && !text.includes('!'), `${map} ${agent}: “${text}”`);
      }
    }
  });
  spec('every map says how open it is, and only names mechanics it has once', () => {
    for (const m of MAPS) {
      ok(['tight', 'mixed', 'open'].includes(m.space), `${m.name}: space`);
      const ids = (m.mechanics ?? []).map((x) => x.id);
      eq(new Set(ids).size, ids.length, `${m.name}: mechanics listed once`);
      for (const x of m.mechanics ?? []) ok(MECHANICS[x.id] && /[.]$/.test(x.about), `${m.name}: ${x.id}`);
    }
  });
});
