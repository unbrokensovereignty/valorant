// Checks tools/map-edits.mjs, which puts a file of edits from the map editor into maps.ts and
// features.ts: moves land in `places`, marks are written out whole, and names are left to a hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyEdits, type EditsMap } from '../../tools/map-edits.mjs';
import { CALLOUTS } from '../../src/core/kb/content.gen.ts';
import { FEATURES } from '../../src/core/kb/features.ts';
import { MAPS } from '../../src/core/kb/maps.ts';
import { PLAYS } from '../../src/core/kb/plays.ts';

const mapsTs = await readFile(new URL('../../src/core/kb/maps.ts', import.meta.url), 'utf8');
const featuresTs = await readFile(new URL('../../src/core/kb/features.ts', import.meta.url), 'utf8');
const maps: EditsMap[] = MAPS.map((m) => ({
  id: m.id,
  name: m.name,
  callouts: m.callouts.map((c) => ({ name: c.name, at: [c.x, c.y] as [number, number] })),
  game: Object.fromEntries((CALLOUTS[m.id] ?? []).map(([name, x, y]) => [name, [x, y] as [number, number]])),
  inPlays: [...new Set(PLAYS.filter((p) => p.map === m.id).flatMap((p) => p.steps.flatMap((s) => s.route)))],
}));

/** A map's edits as the editor saves them, from the app's data as it is now. */
function editsOf(id: string) {
  const m = MAPS.find((x) => x.id === id)!;
  return {
    name: m.name,
    callouts: m.callouts.map((c) => ({ name: c.name, x: c.x, y: c.y })) as { name: string; x: number; y: number; from?: string; new?: boolean }[],
    removedCallouts: [] as string[],
    features: (FEATURES[id] ?? []).map((f, ref) => ({ ...f, at: [...f.at], ref })) as { kind: string; at: number[]; to?: readonly number[]; about: string }[],
  };
}
const file = (maps: Record<string, unknown>) => ({ format: 'playbook-map-edits', madeFrom: 'x', savedAt: '', maps });

test('a file with nothing changed changes nothing, on any map (the marks are written out just as they are now)', () => {
  const out = applyEdits(file(Object.fromEntries(MAPS.map((m) => [m.id, editsOf(m.id)]))), { mapsTs, featuresTs, maps });
  assert.equal(out.mapsTs, mapsTs);
  assert.equal(out.featuresTs, featuresTs);
  assert.deepEqual(out.done, []);
  assert.deepEqual(out.todo, []);
});

test('moves go into places, a move back to the game’s spot leaves places, and marks are written out', () => {
  const e = editsOf('ascent');
  e.callouts.find((c) => c.name === 'A Main')!.x = 0.5;
  const game = CALLOUTS['ascent']!.find(([n]) => n === 'B Site')!;
  Object.assign(e.callouts.find((c) => c.name === 'B Site')!, { x: game[1], y: game[2] });
  e.features[0]!.at = [0.5, 0.25];
  e.features.push({ kind: 'door', at: [0.4, 0.4], about: 'A test door, it’s by mid.' });
  e.features = e.features.filter((f) => f.kind !== 'breakable');
  const out = applyEdits(file({ ascent: e }), { mapsTs, featuresTs, maps });
  const places = out.mapsTs.match(/\n {4}places: \{.*\},\n/g)!.find((l) => l.includes("'Mid Market'"))!;
  assert.match(places, /'A Main': \[0\.5, 0\.201\]/);
  assert.doesNotMatch(places, /'B Site'/);
  assert.match(places, /'A Site': \[0\.311, 0\.148\]/, 'the places that didn’t move stay');
  assert.match(out.featuresTs, /\{ kind: 'orb', at: \[0\.5, 0\.25\], about: 'Ultimate orb in A Main' \},/);
  assert.match(out.featuresTs, /\{ kind: 'door', at: \[0\.4, 0\.4\], about: 'A test door, it’s by mid' \},/, 'without the full stop');
  assert.doesNotMatch(out.featuresTs, /Glass pane in A Window/);
  assert.ok(out.featuresTs.includes("  bind: [\n    { kind: 'orb', at: [0.85, 0.46]"), 'the other maps are left as they were');
  assert.equal(out.done.length, 2);
  assert.deepEqual(out.todo, []);
});

test('new, renamed and removed callouts are left to a hand, saying when plays use them', () => {
  const e = editsOf('ascent');
  e.callouts.find((c) => c.name === 'A Main')!.name = 'A Long';
  e.callouts.find((c) => c.name === 'A Long')!.from = 'A Main';
  e.callouts.push({ name: 'Mid Test', x: 0.4, y: 0.5, new: true });
  e.callouts = e.callouts.filter((c) => c.name !== 'B Lobby');
  e.removedCallouts = ['B Lobby'];
  const out = applyEdits(file({ ascent: e }), { mapsTs, featuresTs, maps });
  assert.equal(out.mapsTs, mapsTs);
  assert.equal(out.todo.length, 3);
  assert.match(out.todo[0]!, /rename "A Main" to "A Long" \(plays use it\)/);
  assert.match(out.todo[1]!, /add the new callout "Mid Test" at \[0\.4, 0\.5\]/);
  assert.match(out.todo[2]!, /remove the callout "B Lobby"/);
});

test('a file that isn’t one is refused', () => {
  assert.throws(() => applyEdits({ maps: {} }, { mapsTs, featuresTs, maps }));
  assert.throws(() => applyEdits(file({ ascent: { callouts: [{ name: 'A Site', x: 'left', y: 0 }], features: [] } }), { mapsTs, featuresTs, maps }));
});
