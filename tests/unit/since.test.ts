// Checks the arrows for tiers that moved since the version this one is compared with: that
// since.gen.ts covers every situation Rankings shows and still matches the engine (run
// `node --experimental-strip-types tools/since.mjs <commit>` again when it doesn't), and that every
// move says why in words that match it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AGENTS } from '../../src/core/kb/agents.ts';
import { MAPS } from '../../src/core/kb/maps.ts';
import { RANK_IDS, type RankId } from '../../src/core/kb/ranks.ts';
import type { SidePick, Situation } from '../../src/core/engine/model.ts';
import { solve } from '../../src/core/engine/plan.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { SINCE } from '../../src/core/engine/since.gen.ts';
import { REVIEWED, SINCE_FROM, sinceKey, sinceOf, tierSignature } from '../../src/core/engine/since.ts';
import { TIERS } from '../../src/core/engine/weights.ts';

const none = (problems: string[]) => assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
const SIDES: SidePick[] = ['both', 'attack', 'defense'];
const situations: Situation[] = ['any', ...MAPS.map((m) => m.id)].flatMap((map) => SIDES.flatMap((side) => RANK_IDS.map((rank): Situation => ({ map, side, rank, sites: [] }))));
const answerOf = (s: Situation) => solve({ ...newQuery(s.rank as RankId, false), map: s.map, side: s.side, sites: [] }, s, 10);
const fresh = 'Run `node --experimental-strip-types tools/since.mjs <commit of the release compared with>` again.';

test('it compares with a released version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.notEqual(SINCE_FROM, pkg.version);
  assert.match(readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8'), new RegExp(`^## ${SINCE_FROM.replaceAll('.', '\\.')} \\(\\d{4}-\\d\\d-\\d\\d\\)`, 'm'));
});

test('since.gen.ts covers every situation Rankings shows, and every mark reads', () => {
  const problems: string[] = [];
  const keys = situations.map((s) => sinceKey(s)!);
  for (const k of keys) if (!SINCE[k]) problems.push(`${k}: missing. ${fresh}`);
  for (const k of Object.keys(SINCE)) if (!keys.includes(k)) problems.push(`${k}: not a situation Rankings shows`);
  const tiers = TIERS.map((t) => t.id);
  for (const [k, v] of Object.entries(SINCE)) {
    for (const mark of v.split(' ').slice(1)) {
      const m = /^([a-z]+):([A-Z])(.+)$/.exec(mark);
      if (!m) { problems.push(`${k}: can't read "${mark}"`); continue; }
      const [, id, from, why] = m;
      if (!AGENTS.some((a) => a.id === id)) problems.push(`${k}: no agent "${id}"`);
      if (!tiers.includes(from!)) problems.push(`${k} ${id}: no tier "${from}"`);
      // one change, two of them, another agent's numbers, or several
      if (!/^([rpkn]{1,2}|n[+-][a-z]+|\+)$/.test(why!)) problems.push(`${k} ${id}: can't read why "${why}"`);
      const other = /^n[+-]([a-z]+)$/.exec(why!)?.[1];
      if (other && !REVIEWED[other]) problems.push(`${k} ${id}: ${other}’s numbers didn’t change, says REVIEWED`);
    }
  }
  none(problems);
});

test('since.gen.ts still matches the engine', () => {
  // a spread of situations: every map, side and rank turns up
  const problems: string[] = [];
  for (const s of situations.filter((_, i) => i % 19 === 0)) {
    const ans = answerOf(s);
    const tiers = AGENTS.map((a) => ans.agents.find((x) => x.id === a.id)?.tier ?? '-').join('');
    if (SINCE[sinceKey(s)!]?.split(' ')[0] !== tierSignature(tiers)) problems.push(`${sinceKey(s)}: the tiers changed. ${fresh}`);
  }
  none(problems);
});

test('every move says why, in a sentence that fits the move', () => {
  const problems: string[] = [];
  for (const s of situations.filter((_, i) => i % 7 === 3)) {
    const ans = answerOf(s);
    const marked = SINCE[sinceKey(s)!]!.split(' ').slice(1).map((x) => x.split(':')[0]!);
    for (const a of ans.agents) {
      const m = sinceOf(s, a);
      if (marked.includes(a.id) !== !!m) { problems.push(`${sinceKey(s)} ${a.id}: marked ${marked.includes(a.id)}, but sinceOf says ${!!m}`); continue; }
      if (!m) continue;
      const order = TIERS.map((t) => t.id);
      if (m.up !== order.indexOf(a.tier) < order.indexOf(m.from)) problems.push(`${sinceKey(s)} ${a.id}: up is ${m.up} from ${m.from} to ${a.tier}`);
      if (!/^[A-Z].*[^ .]\.$/.test(m.why) || /undefined|NaN|\{|\}/.test(m.why)) problems.push(`${sinceKey(s)} ${a.id}: "${m.why}"`);
    }
  }
  none(problems);
});

test('the big moves since 0.2.5 say what a coach would', () => {
  const why = (map: string, side: SidePick, rank: RankId, id: string) => {
    const s: Situation = { map, side, rank, sites: [] };
    const a = answerOf(s).agents.find((x) => x.id === id)!;
    return sinceOf(s, a);
  };
  // Bind at Immortal: the pros' two controllers and two duelists come in together, so Hush, Yoru
  // and Raze no longer drop there between Ascendant and Radiant
  for (const id of ['hush', 'yoru', 'raze']) {
    const m = why('bind', 'both', 'immortal', id);
    assert.ok(m?.up, `${id} rises on Bind at Immortal`);
    assert.match(m.why, /role mix pro teams play on Bind/);
  }
});
