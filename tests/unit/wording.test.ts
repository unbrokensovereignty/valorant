// Checks that nothing the app says about a comp contradicts the kits in it, over many questions:
// the best comps and random ones, on every pool map, side and a spread of ranks, some against a
// known team. Every agent a line names is in the comp, every ability it names belongs to that
// agent (and the kit word it uses, "Omen’s smokes", is one the kit has), a play gives a job to an
// agent with the tools for it or says the agent stands in, and the other team's answers are named
// by the abilities that answer them. Pros, cons and notes have their own checks in benchmarks.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../../src/core/engine/plan.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { explainTeam } from '../../src/core/engine/explain.ts';
import { D, modelFor, viaIn, type Model, type RankPick, type SidePick, type Situation } from '../../src/core/engine/model.ts';
import { JOB_SKILLS, jobWords, playsFor } from '../../src/core/engine/plays.ts';
import { tipsFor } from '../../src/core/engine/tips.ts';
import { AGENTS, agentById, type Agent } from '../../src/core/kb/agents.ts';
import { abilityNames, kitOf } from '../../src/core/kb/kits.ts';
import { POOL } from '../../src/core/kb/maps.ts';
import { THREATS } from '../../src/core/kb/counters.ts';
import { DIMS, type Dim } from '../../src/core/kb/roles.ts';

const none = (problems: string[]) => assert.deepEqual([...new Set(problems)].slice(0, 40), [], `\n${[...new Set(problems)].slice(0, 40).join('\n')}`);

/**
 * Words a line may use for part of an agent's kit ("Omen’s smokes"), and the strengths the kit must
 * have for them to be true. A word not listed here, and not an ability's name, fails the test, so a
 * new way of saying it gets checked once.
 */
const KIT_WORDS: Record<string, readonly Dim[] | 'any'> = {
  smokes: ['smoke'], stars: ['smoke'], flash: ['flash'], flashes: ['flash'], stuns: ['disrupt'], pull: ['disrupt'], pulls: ['disrupt'], concussive: ['disrupt'],
  wall: ['wall', 'stall'], walls: ['wall', 'stall'], slows: ['stall'], mollies: ['clear', 'postplant', 'stall'], fire: ['clear', 'postplant', 'stall'],
  grenade: ['clear', 'disrupt'], thorns: ['stall', 'anchor'], reveals: ['recon'], information: ['recon'], darts: ['recon'], dog: ['recon'],
  trips: ['flank', 'anchor'], setup: ['anchor'], speed: ['mobility', 'entry'], dash: ['mobility', 'entry'], slide: ['mobility', 'entry'],
  stim: ['entry', 'mobility'], entry: ['entry'], Operator: ['angles'], gun: ['duel'], kit: 'any', ultimate: 'any', best: 'any',
};

/** What's wrong with each "Agent’s …" in a line, given who's in the comp and the situation. */
function possessives(line: string, team: readonly string[], m: Model): string[] {
  const bad: string[] = [];
  for (const x of line.matchAll(/(?<![A-Za-z])([A-Z][\w/]*)’s ([^,.:;()]+)/g)) {
    const a = AGENTS.find((y) => y.name === x[1]);
    if (!a) continue; // a map's name ("Lotus’s doors")
    const rest = x[2]!;
    if (!team.includes(a.id)) bad.push(`"${line}": ${a.name} isn't in the comp`);
    // one of a list ("about 40% of Astra’s and about 60% of Hush’s kits"): the word comes later
    if (!rest.trim() || rest.startsWith('and ')) continue;
    // an ability's name, which can start with the agent's own ("Viper’s Pit")
    const said = `${a.name}’s ${rest}`.replaceAll('’', "'");
    if (kitOf(a.id)!.abilities.some((k) => rest.startsWith(k.name.replace(/\s+\/\s.*$/, '')) || said.startsWith(k.name.replaceAll('’', "'")))) continue;
    const word = rest.split(' ')[0]!;
    const dims = KIT_WORDS[word];
    // what the agent brings here, kit rules and all
    const brings = (d: Dim) => 1 - m.miss[a.index * D + DIMS.indexOf(d)]! > 1e-9;
    if (!dims) bad.push(`"${line}": "${a.name}’s ${word}" is neither an ability nor a kit word`);
    else if (dims !== 'any' && !dims.some(brings)) bad.push(`"${line}": ${a.name} has no ${word}`);
  }
  return bad;
}
/** A small, seeded random number source, so a failure can be run again. */
function random(seed: number) {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return { next, some: <T>(xs: readonly T[], n: number): T[] => [...xs].sort(() => next() - 0.5).slice(0, n) };
}

/** The comps the checks look at: each situation's best three and three random ones. */
function cases(): { s: Situation; team: string[] }[] {
  const r = random(17);
  const ids = AGENTS.map((a) => a.id);
  const out: { s: Situation; team: string[] }[] = [];
  for (const map of [...POOL.map((m) => m.id), 'any']) {
    for (const side of ['attack', 'defense', 'both'] as SidePick[]) {
      for (const rank of ['iron', 'gold', 'platinum', 'immortal'] as RankPick[]) {
        // some questions know the other team
        const enemy = r.next() < 0.35 ? r.some(ids, 5) : [];
        const s: Situation = { map, side, rank, sites: [], enemy };
        const a = solve({ ...newQuery(rank, true), map, side, enemy }, s, 3);
        for (const c of a.comps) out.push({ s, team: c.team });
        for (let i = 0; i < 3; i++) out.push({ s, team: r.some(ids, 5) });
      }
    }
  }
  return out;
}
const CASES = cases();

test('every agent and ability a comp’s pros, cons, notes and tips name is the comp’s own, in kit words that are true', () => {
  const problems: string[] = [];
  for (const { s, team } of CASES) {
    const m = modelFor(s);
    const e = explainTeam(m, team);
    const tips = tipsFor(team, s).map((t) => t.text);
    for (const line of [...e.pros, ...e.cons, ...e.notes, ...tips]) {
      problems.push(...possessives(line, team, m));
      // a comp that has only one of something has nothing "other than" it
      if (/\bother than\b/i.test(line)) problems.push(`"${line}": "other than"`);
    }
  }
  none(problems);
});

test('advice only leans on utility the comp has, named by the ability to use', () => {
  const problems: string[] = [];
  // the advice forms that lean on another strength, and that strength
  const LEANS: [RegExp, Dim][] = [[/lean on (.+?) and close trades/, 'flash'], [/use (.+?) to take space/, 'flash'], [/block (?:them|the long sightlines) with (.+?)[.,]/, 'smoke']];
  for (const { s, team } of CASES) {
    const m = modelFor(s);
    const e = explainTeam(m, team);
    for (const line of e.cons) {
      for (const [re, d] of LEANS) {
        const said = re.exec(line)?.[1];
        if (!said) continue;
        const [who, what] = said.split('’s ');
        const a = team.map((id) => agentById(id)!).find((x) => x.name === who);
        if (!a || !what || !abilityNames(a.id, viaIn(m, a, d)).includes(what)) problems.push(`"${line}": ${said} isn't a ${d} in the comp`);
        else if (e.strengths.find((r) => r.dim === d)!.cover < 0.55) problems.push(`"${line}": leans on ${d} the comp is short of`);
      }
      if (/\blean on (?:flashes|smokes|utility)\b|\bsmoke (?:them|the long sightlines) off\b|\buse utility\b/.test(line)) problems.push(`"${line}": leans on utility without naming it`);
    }
  }
  none(problems);
});

test('a play gives each job to an agent with the tools for it, or says what stands in', () => {
  const problems: string[] = [];
  for (const { s, team } of CASES) {
    if (s.map === 'any' || s.side === 'both') continue;
    for (const p of playsFor(team, s.map, s.side)) for (const step of p.steps) for (const d of step.who) {
      const a = agentById(d.id)!;
      const words = jobWords(d);
      const first = Object.keys(JOB_SKILLS[d.job][0]!) as Dim[];
      // nothing at all for the job says so
      if (d.value <= 0) { if (!words.endsWith(', without the utility for it')) problems.push(`${p.play.name}: ${a.name} "${words}" with nothing for it`); continue; }
      if (!d.standIn && !first.some((x) => a.caps[x] > 0)) problems.push(`${p.play.name}: ${a.name} "${words}" without any ${first.join(' or ')}`);
      if (d.standIn !== words.includes(' in place of ')) problems.push(`${p.play.name}: ${a.name} "${words}"`);
      const own = new Set(Object.values(a.via).flatMap((k) => abilityNames(a.id, k ?? '')));
      for (const n of d.abilities) if (n !== 'gun play' && !own.has(n)) problems.push(`${p.play.name}: ${a.name} has no ${n}`);
      if (/\bother than\b/i.test(words)) problems.push(`${p.play.name}: "${words}"`);
    }
  }
  none(problems);
});

test('against a known team, who answers each threat is named by an ability of theirs that answers it', () => {
  const problems: string[] = [];
  for (const { s, team } of CASES) {
    if (!s.enemy?.length) continue;
    const m = modelFor(s);
    for (const r of explainTeam(m, team).against) {
      const t = THREATS.find((x) => x.id === r.id)!;
      for (const b of r.by) {
        const [who, what] = b.split('’s ');
        const a: Agent | undefined = team.map((id) => agentById(id)!).find((x) => x.name === who);
        if (!a) { problems.push(`${r.id}: ${b} isn't in the comp`); continue; }
        const answers = (Object.keys(t.needs) as Dim[]).flatMap((d) => abilityNames(a.id, viaIn(m, a, d)));
        if (!answers.includes(what!) && !(what === 'gun play')) problems.push(`${r.id}: ${b} doesn't answer it (${answers.join(', ')})`);
      }
    }
  }
  none(problems);
});
