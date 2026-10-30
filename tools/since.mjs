// Which agents' tiers moved since the version this one is compared with, and why, for the arrows on
// Rankings and the agent pages. Writes src/core/engine/since.gen.ts (core/engine/since.ts reads it):
//
//   node --experimental-strip-types tools/since.mjs <commit>    compares with the release at <commit>
//                                                                (its merge into main) and writes the file
//   node --experimental-strip-types tools/since.mjs --check     fails if the file is out of date with the engine
//
// It answers every situation Rankings can show (each map and any map in the pool, each side and both,
// each rank, for a five-stack with nothing else fixed) with that release's engine and with this one.
// An agent's tier counts as moved when it changed and the fit moved at least SINCE_MOVE. Why it moved
// is found by undoing each of this version's changes in turn (CHANGES, written for each version): the
// change whose undoing takes the fit back the most is the reason, as long as it takes back at least
// SINCE_SHARE of the move; when none does, it's several changes together (the two that take back most).
//
// It takes a few minutes. Run it again whenever the tiers change (the unit tests say when), and before
// a release.
import { execFile, execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/core/engine/since.gen.ts');
const run = promisify(execFile);

/**
 * This version's changes to how five-stacks are scored, each with the edits that undo it in a copy of
 * src/ (a [file, find, replace] edit, or [file] for the file as it was in the release compared with).
 * The ids are the reasons whyOf in since.ts words; an edit that no longer finds its text stops the tool.
 */
const CHANGES = [
  { id: 'k', edits: [['core/engine/model.ts', 'const rules = AGENTS.map((a) => rulesFor(a.id, map.id, side, sites));', 'const rules = AGENTS.map((): ParsedRule[] => []);']] },
  { id: 'c', edits: [['core/engine/model.ts', /const together = .*;/, 'const together = 1;']] },
  { id: 'm', edits: [['core/engine/weights.ts', 'export const ROLE_MIX = 0.08;', 'export const ROLE_MIX = 0.15;']] },
  // each agent whose numbers changed is also undone on their own (n-<id>), to tell whose moved a tier
  { id: 'n', edits: [['core/kb/agents.ts']] },
  { id: 'w', edits: [['core/engine/weights.ts', 'wall: [0.75, 1.15]', 'wall: [0.6, 1.15]']] },
];

/** The situations, as Rankings asks them. */
async function situations(src) {
  const { MAPS } = await import(join(src, 'core/kb/maps.ts'));
  const { RANK_IDS } = await import(join(src, 'core/kb/ranks.ts'));
  const list = [];
  for (const map of ['any', ...MAPS.map((m) => m.id)]) for (const side of ['both', 'attack', 'defense']) for (const rank of RANK_IDS) list.push({ map, side, rank, sites: [] });
  return list;
}

const keyOf = (s) => `${s.map}|${s.side}|${s.rank}`;

/** Every agent's fit in every situation, answered by the engine in `src`. */
async function fitsOf(src, list) {
  const { solve } = await import(join(src, 'core/engine/plan.ts'));
  const { newQuery } = await import(join(src, 'core/engine/query.ts'));
  const fits = {};
  for (const s of list) {
    const a = solve({ ...newQuery(s.rank, false), map: s.map, side: s.side, sites: [] }, s, 10);
    fits[keyOf(s)] = Object.fromEntries(a.agents.map((x) => [x.id, x.fit]));
  }
  return fits;
}

/**
 * What an agent brings on their own in a situation, by the engine in `dir`: their share of every
 * strength it weighs, and their pick and win numbers. It says which way a change to their numbers went.
 */
async function valueOf(dir, s, id) {
  const { modelFor } = await import(join(dir, 'src/core/engine/model.ts'));
  const { agentById } = await import(join(dir, 'src/core/kb/agents.ts'));
  const m = modelFor(s), i = agentById(id).index, D = m.weight.length;
  let v = m.base[i];
  for (let j = 0; j < D; j++) v += m.weight[j] * (1 - m.miss[i * D + j]);
  return v;
}

/** The same, in a separate process (so several engines can run at once without sharing modules). */
async function fitsIn(src) {
  const { stdout } = await run(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', fileURLToPath(import.meta.url), '--fits', src], { maxBuffer: 64 << 20 });
  return JSON.parse(stdout);
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--fits') {
    const src = process.argv[3];
    process.stdout.write(JSON.stringify(await fitsOf(src, await situations(join(root, 'src')))));
    return;
  }
  const { AGENTS } = await import(join(root, 'src/core/kb/agents.ts'));
  const { tierOf, TIERS } = await import(join(root, 'src/core/engine/weights.ts'));
  const { SINCE_MOVE, SINCE_SHARE, tierSignature } = await import(join(root, 'src/core/engine/since.ts'));
  const list = await situations(join(root, 'src'));
  const ids = AGENTS.map((a) => a.id);
  const tiersOf = (fits, s) => ids.map((id) => (fits[keyOf(s)][id] === undefined ? '-' : tierOf(fits[keyOf(s)][id]))).join('');

  if (arg === '--check') {
    const { SINCE } = await import(join(root, 'src/core/engine/since.gen.ts'));
    const now = await fitsOf(join(root, 'src'), list);
    const stale = list.filter((s) => SINCE[keyOf(s)]?.split(' ')[0] !== tierSignature(tiersOf(now, s)));
    if (stale.length) { console.error(`since.gen.ts is out of date in ${stale.length} situations (${keyOf(stale[0])}, …): run tools/since.mjs <commit> again.`); process.exit(1); }
    console.error('since.gen.ts is up to date.');
    return;
  }
  if (!arg) { console.error('Give the commit of the release to compare with: node --experimental-strip-types tools/since.mjs <commit>'); process.exit(1); }

  const from = JSON.parse(execFileSync('git', ['show', `${arg}:package.json`], { cwd: root, encoding: 'utf8' })).version;
  const tmp = await mkdtemp(join(tmpdir(), 'since-'));
  try {
    // the release, and this version with each change undone
    const then = join(tmp, 'then');
    execFileSync('sh', ['-c', `mkdir -p "${then}" && git archive "${arg}" src | tar -x -C "${then}"`], { cwd: root });
    const undone = {};
    for (const c of CHANGES) {
      const dir = join(tmp, c.id);
      await cp(join(root, 'src'), join(dir, 'src'), { recursive: true });
      for (const [file, find, replace] of c.edits) {
        const at = join(dir, 'src', file);
        if (find === undefined) { await cp(join(then, 'src', file), at); continue; }
        const text = await readFile(at, 'utf8');
        const next = text.replace(find, replace);
        if (next === text) throw new Error(`Undoing change ${c.id}: "${find}" isn't in ${file} any more. Update CHANGES in tools/since.mjs.`);
        await writeFile(at, next);
      }
      undone[c.id] = join(dir, 'src');
    }
    // the agents whose numbers changed, each undone on their own
    const { AGENTS: before } = await import(join(then, 'src/core/kb/agents.ts'));
    const { REVIEWED } = await import(join(root, 'src/core/engine/since.ts'));
    const numbers = (a) => JSON.stringify([a.caps, a.solo, a.skill, a.pop, a.win]);
    const reviewed = AGENTS.filter((a) => { const b = before.find((x) => x.id === a.id); return b && numbers(a) !== numbers(b); }).map((a) => a.id);
    const missing = reviewed.filter((id) => !REVIEWED[id]);
    if (missing.length) throw new Error(`${missing.join(', ')}: numbers changed since ${from}, but REVIEWED in since.ts doesn't say how.`);
    const defOf = (text, id) => {
      const at = text.indexOf(`id: '${id}'`), start = text.lastIndexOf('{', at), end = text.indexOf('\n  },', at);
      if (at < 0 || start < 0 || end < 0) throw new Error(`Can't find ${id} in agents.ts`);
      return text.slice(start, end + 5);
    };
    const agentsNow = await readFile(join(root, 'src/core/kb/agents.ts'), 'utf8'), agentsThen = await readFile(join(then, 'src/core/kb/agents.ts'), 'utf8');
    for (const id of reviewed) {
      const dir = join(tmp, `n-${id}`);
      await cp(join(root, 'src'), join(dir, 'src'), { recursive: true });
      await writeFile(join(dir, 'src/core/kb/agents.ts'), agentsNow.replace(defOf(agentsNow, id), defOf(agentsThen, id)));
      undone[`n-${id}`] = join(dir, 'src');
    }
    const variants = Object.keys(undone);
    console.error(`Answering ${list.length} situations with ${2 + variants.length} engines…`);
    const [fThen, fNow, ...fVariants] = await Promise.all([fitsIn(join(then, 'src')), fitsIn(join(root, 'src')), ...variants.map((v) => fitsIn(undone[v]))]);
    const fUndone = CHANGES.map((c) => fVariants[variants.indexOf(c.id)]);
    const fAgent = Object.fromEntries(reviewed.map((id) => [id, fVariants[variants.indexOf(`n-${id}`)]]));
    const order = TIERS.map((t) => t.id);
    const counts = {};
    const lines = [];
    for (const s of list) {
      const k = keyOf(s);
      const marks = [];
      for (const id of ids) {
        const was = fThen[k][id], is = fNow[k][id];
        if (was === undefined || is === undefined) continue;
        if (tierOf(was) === tierOf(is) || Math.abs(is - was) < SINCE_MOVE) continue;
        const sign = Math.sign(is - was);
        // how much of the move each change accounts for: the fit it takes back when undone
        const back = CHANGES.map((c, i) => ({ id: c.id, back: (is - fUndone[i][k][id]) * sign })).sort((a, b) => b.back - a.back);
        // one change, or the two that take back the most, or '+' when none takes back any
        const some = back.filter((x) => x.back > 0).slice(0, 2).map((x) => x.id).join('');
        let why = back[0].back >= SINCE_SHARE * Math.abs(is - was) ? back[0].id : some || '+';
        // numbers: whose, when it isn't the agent's own
        if (why === 'n') {
          const whose = reviewed.map((r) => ({ r, back: (is - fAgent[r][k][id]) * sign })).sort((a, b) => b.back - a.back)[0];
          // with whether that agent came out stronger (+) or weaker (-) here
          if (whose && whose.back > 0 && whose.r !== id) why = `n${(await valueOf(root, s, whose.r)) >= (await valueOf(join(undone[`n-${whose.r}`], '..'), s, whose.r)) ? '+' : '-'}${whose.r}`;
        }
        counts[why] = (counts[why] ?? 0) + 1;
        marks.push(`${id}:${tierOf(was)}${why}`);
        if (!order.includes(tierOf(was))) throw new Error(`Unknown tier ${tierOf(was)}`);
      }
      lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify([tierSignature(tiersOf(fNow, s)), ...marks].join(' '))},`);
    }
    await writeFile(out, `// Made by tools/since.mjs, comparing with ${from}: don't edit by hand.
// For each situation Rankings can show ("map|side|rank", a five-stack with nothing else fixed): a check
// of this version's tiers there in agent order (so the tests can tell when the file is out of date),
// then each agent whose tier moved since ${from}, as "id:" with the tier then and why it moved: the
// change that moved it (CHANGES in tools/since.mjs, worded by whyOf in since.ts), "n+" or "n-" and the
// agent whose numbers moved it (coming out stronger or weaker there), the two changes that moved it
// most, or "+" for several.

export const SINCE_FROM = ${JSON.stringify(from)};

export const SINCE: Record<string, string> = {
${lines.join('\n')}
};
`);
    console.error(`Wrote ${out}: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

await main();
