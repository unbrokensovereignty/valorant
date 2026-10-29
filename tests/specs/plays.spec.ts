import { describe, spec, eq, ok } from './harness.ts';
import { AGENTS } from '../../src/core/kb/agents.ts';
import { abilityOn } from '../../src/core/kb/kits.ts';
import { MAPS, mapById } from '../../src/core/kb/maps.ts';
import { JOBS, PLAYS, playsOn } from '../../src/core/kb/plays.ts';
import { AGENT_TIPS, ATTACK_TIPS, DEFENSE_TIPS, MAP_TIPS, RANK_TIPS, PARTY_TIPS, DOUBLE_TIPS } from '../../src/core/kb/tips.ts';
import { ROLE_IDS } from '../../src/core/kb/roles.ts';
import { JOB_SKILLS, fillPlay, jobSkill, playsFor, WEAK_JOB } from '../../src/core/engine/plays.ts';
import { agentTips, tipsFor } from '../../src/core/engine/tips.ts';
import { summaryText } from '../../src/core/engine/summary.ts';
import { explainTeam } from '../../src/core/engine/explain.ts';
import { modelFor } from '../../src/core/engine/model.ts';

const plain = (s: string) => /[.?]$/.test(s) && !s.includes('!');

describe('plays', () => {
  spec('every map has plays for both sides and every site, five jobs each', () => {
    eq(new Set(PLAYS.map((p) => p.id)).size, PLAYS.length, 'ids are unique');
    for (const m of MAPS) {
      for (const s of m.sites) {
        ok(playsOn(m.id, 'attack', [s.id]).some((p) => p.site === s.id), `${m.name}: an attack play for ${s.id}`);
        ok(playsOn(m.id, 'defense', [s.id]).some((p) => p.site === s.id && p.kind === 'retake'), `${m.name}: a retake for ${s.id}`);
      }
      ok(playsOn(m.id, 'defense').some((p) => p.kind === 'setup'), `${m.name}: a defense setup`);
      ok(playsOn(m.id, 'attack').some((p) => !p.site), `${m.name}: a play for the whole map`);
    }
    for (const p of PLAYS) {
      eq(p.steps.reduce((n, s) => n + s.jobs.length, 0), 5, `${p.name}: five jobs`);
      ok(plain(p.about), `${p.name}: a plain line about it`);
      const map = mapById(p.map)!;
      for (const s of p.steps) {
        ok(plain(s.text), `${p.name}: “${s.text}” is a plain sentence`);
        for (const c of s.route) ok(map.callouts.some((x) => x.name === c), `${p.name}: ${c} is a callout`);
      }
    }
  });
  spec('an attack play never smokes the way a teammate comes in or the spot they hold', () => {
    for (const p of PLAYS.filter((x) => x.side === 'attack')) {
      const names = mapById(p.map)!.callouts.map((c) => c.name).filter((c) => !c.endsWith(' Site'));
      for (const s of p.steps.filter((x) => x.jobs.includes('smoke'))) {
        // the callouts the smoke goes on: those its text names, up to anything it says to leave open
        const on = names.filter((c) => s.text.replace(/\bleave .*$/i, '').includes(c) && !s.route.includes(c));
        for (const o of p.steps) if (o !== s) for (const c of o.route) ok(!on.includes(c), `${p.map}, ${p.name}: the smoke on ${c} is on a teammate’s way`);
      }
    }
  });
  spec('only the chosen sites’ plays come, with the whole-map ones', () => {
    const c = playsOn('haven', 'attack', ['C']);
    ok(c.every((p) => p.site === 'C' || p.site === null));
    ok(c.some((p) => p.site === 'C') && c.some((p) => p.site === null));
    ok(playsOn('haven', 'attack').some((p) => p.site === 'A'));
  });
});

describe('filling plays', () => {
  spec('every job draws on real strengths', () => {
    for (const j of JOBS) ok(JOB_SKILLS[j].length > 0, `${j} has a way to be done`);
  });
  spec('each job goes to a different agent, the best overall', () => {
    const team = ['omen', 'sova', 'jett', 'killjoy', 'breach'];
    for (const p of playsOn('haven', 'attack')) {
      const f = fillPlay(p, team);
      const who = f.steps.flatMap((s) => s.who.map((d) => d.id));
      eq(new Set(who).size, 5, `${p.name}: five different agents`);
      ok(f.fit > 0 && f.fit <= 1, `${p.name}: a fit from 0 to 1`);
      for (const s of f.steps) for (const d of s.who) ok(s.jobs.includes(d.job), `${p.name}: ${d.id} does a job of their step`);
    }
    const hit = fillPlay(playsOn('haven', 'attack', ['C']).find((p) => p.kind === 'hit')!, team);
    const jobOf = (id: string) => hit.steps.flatMap((s) => s.who).find((d) => d.id === id)?.job;
    eq(jobOf('omen'), 'smoke');
    eq(jobOf('sova'), 'recon');
    eq(jobOf('jett'), 'entry');
  });
  spec('no assignment beats the one chosen', () => {
    const team = ['viper', 'fade', 'raze', 'cypher', 'harbor'];
    const p = playsOn('breeze', 'attack')[0]!;
    const f = fillPlay(p, team);
    const slots = p.steps.flatMap((s) => s.jobs);
    let best = 0;
    const perm = (left: string[], k: number, sum: number) => {
      if (k === slots.length) { best = Math.max(best, sum); return; }
      left.forEach((id, i) => perm(left.filter((_, j) => j !== i), k + 1, sum + jobSkill(AGENTS.find((a) => a.id === id)!, slots[k]!).value));
    };
    perm(team, 0, 0);
    ok(Math.abs(f.fit * 5 - best) < 1e-9, 'the best total');
  });
  spec('a job nobody can do well is flagged, and a team that suits the play fits it better', () => {
    const p = playsOn('ascent', 'attack', ['A']).find((x) => x.kind === 'hit')!;
    const duelists = fillPlay(p, ['jett', 'reyna', 'raze', 'phoenix', 'iso']);
    const usual = fillPlay(p, ['omen', 'sova', 'jett', 'killjoy', 'kayo']);
    ok(duelists.weak.length > 0 && duelists.weak.every((d) => d.value < WEAK_JOB));
    eq(usual.weak.length, 0);
    ok(usual.fit > duelists.fit + 0.15);
  });
  spec('the abilities named are the agent’s own', () => {
    const f = fillPlay(playsOn('breeze', 'attack')[0]!, ['viper', 'fade', 'raze', 'cypher', 'harbor']);
    for (const s of f.steps) for (const d of s.who) for (const name of d.abilities) {
      ok(['C', 'Q', 'E', 'X'].some((k) => abilityOn(d.id, k)?.name.startsWith(name)), `${d.id}: ${name}`);
    }
  });
  spec('plays come best fit first', () => {
    const list = playsFor(['omen', 'sova', 'jett', 'killjoy', 'breach'], 'haven', 'defense');
    for (let i = 1; i < list.length; i++) ok(list[i - 1]!.fit >= list[i]!.fit);
  });
  spec('with sites chosen, their plays come first, then the whole map’s, each best fit first', () => {
    const team = ['yoru', 'neon', 'fade', 'astra', 'killjoy'];
    for (const side of ['attack', 'defense'] as const) {
      const list = playsFor(team, 'pearl', side, ['B']);
      const first = list.findIndex((p) => !p.play.site);
      ok(list[0]!.play.site === 'B', `${side}: a B play first`);
      ok(first < 0 || list.slice(first).every((p) => !p.play.site), `${side}: then the whole map’s`);
      for (let i = 1; i < list.length; i++) if (!list[i - 1]!.play.site === !list[i]!.play.site) ok(list[i - 1]!.fit >= list[i]!.fit, `${side}: best fit first`);
    }
  });
});

describe('tips', () => {
  spec('every agent and map has plain tips', () => {
    for (const a of AGENTS) {
      const t = AGENT_TIPS[a.id];
      ok(t, `${a.name} has tips`);
      for (const s of t!) ok(plain(s), `${a.name}: “${s}”`);
    }
    for (const m of MAPS) for (const side of ['attack', 'defense'] as const) {
      for (const s of MAP_TIPS[m.id]![side]) ok(plain(s), `${m.name}: “${s}”`);
    }
    for (const [id, s] of [...Object.entries(ATTACK_TIPS), ...Object.entries(DEFENSE_TIPS)]) ok(AGENTS.some((a) => a.id === id) && plain(s), `${id}: “${s}”`);
    for (const s of [...Object.values(RANK_TIPS).flat(), ...Object.values(PARTY_TIPS).flatMap((t) => [t.play, t.ask]), ...ROLE_IDS.flatMap((r) => Object.values(DOUBLE_TIPS[r]))]) ok(plain(s), s);
  });
  spec('tips name only the map’s own callouts', () => {
    for (const m of MAPS) {
      const names = new Set(m.callouts.map((c) => c.name));
      for (const s of [...MAP_TIPS[m.id]!.attack, ...MAP_TIPS[m.id]!.defense]) {
        for (const c of s.match(/\b(?:A|B|C|Mid) [A-Z][a-z]+(?: [A-Z][a-z]+)?/g) ?? []) {
          ok(names.has(c) || names.has(c.split(' ').slice(0, 2).join(' ')), `${m.name}: ${c}`);
        }
      }
    }
  });
  spec('a plan gets tips for its map, side, doubled roles, agents, rank and party', () => {
    const team = ['omen', 'viper', 'sova', 'jett', 'killjoy'];
    const t = tipsFor(team, { map: 'haven', side: 'attack', sites: [], rank: 'gold' });
    ok(t.some((x) => x.about === 'Haven, attack'));
    ok(t.some((x) => x.about === 'Two controllers'));
    // doubling up asks for something else on defense
    const two = (side: 'attack' | 'defense' | 'both') => tipsFor(team, { map: 'haven', side, sites: [], rank: 'gold' }).find((x) => x.about === 'Two controllers')!.text;
    ok(two('attack') !== two('defense') && two('defense') !== two('both'), 'a tip for each side');
    ok(!/plant/.test(two('defense')), 'defenders don’t plant');
    for (const name of ['Omen', 'Viper', 'Sova', 'Jett', 'Killjoy']) ok(t.some((x) => x.about === name), name);
    // and every agent's tip on defense is about defending
    for (const a of AGENTS) {
      const tip = tipsFor([a.id], { map: 'haven', side: 'defense', sites: [], rank: 'any' }).find((x) => x.about === a.name)!.text;
      ok(!/after the plant|post-plant|before the hit(?! comes)|the team crosses|walk the team|enters alone|(?:stop|or) the defuse|a hit\b/.test(tip), `${a.name} on defense: “${tip}”`);
      // and on attack, about attacking
      const attack = tipsFor([a.id], { map: 'haven', side: 'attack', sites: [], rank: 'any' }).find((x) => x.about === a.name)!.text;
      ok(!/\ba rush\b|the hit comes|for the retake|site entrance/.test(attack), `${a.name} on attack: “${attack}”`);
      // an agent's page has every tip once
      eq(new Set(agentTips(a.id)).size, agentTips(a.id).length, `${a.name}: no tip twice`);
    }
    ok(t.some((x) => x.about === 'Gold'));
    const duo = tipsFor(team, { map: 'any', side: 'both', sites: [], rank: 'any' }, 2, ['sova', 'jett']);
    ok(!duo.some((x) => x.about === 'Omen'), 'only your party’s agents');
    ok(duo.some((x) => x.about === 'Duo'));
    ok(!duo.some((x) => x.about.startsWith('Haven')));
    // once teammates have locked in every other spot, there's no one left to ask for a role
    const trio = (locked: number) => tipsFor(team, { map: 'any', side: 'both', sites: [], rank: 'any' }, 3, ['sova', 'jett', 'omen'], locked).filter((x) => x.about === 'Trio').map((x) => x.text);
    ok(trio(1).includes(PARTY_TIPS[3].ask) && !trio(2).includes(PARTY_TIPS[3].ask) && trio(2).includes(PARTY_TIPS[3].play));
  });
});

describe('copying a plan', () => {
  spec('a party’s plan says what its fit means, what to expect, and the role to ask random teammates for', () => {
    const team = ['sova', 'clove', 'jett', 'reyna', 'chamber'];
    const s = { map: 'haven', side: 'attack', sites: [], rank: 'gold' } as const;
    const parts = { title: 'Haven, attack · Gold · duo', team, party: ['sova', 'clove'], fit: 100, tier: 'S', why: explainTeam(modelFor(s), team), tips: tipsFor(team, s, 2, ['sova', 'clove']) };
    const text = summaryText({ ...parts, ask: 'sentinel', expected: 77.4 });
    ok(text.includes('Comp: Sova, Clove, Jett, Reyna, Chamber (your party: Sova and Clove). Fit 100 among duos, tier S.\nWith random teammates, expect a team that fits about 77 out of 100.\nAsk your random teammates for a sentinel first.'), text);
    ok(summaryText({ ...parts, party: [] }).includes('. Fit 100, tier S.'), 'a five-stack’s fit is just its fit');
    ok(!summaryText(parts).includes('teammates for a sentinel first'), 'nothing to ask, no line');
  });
});
