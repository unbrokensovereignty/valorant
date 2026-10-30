// Project rules that the type checker can't see. Run with `npm run lint`.
//  1. Layers: src/core is pure logic (no DOM, no storage, no UI); src/data may use core; src/ui may use both.
//  2. The app only knows its own versions: the one in package.json and those with a heading in CHANGELOG.md.
//     No other version numbers, no "beta" or the like, and no other app's name.
//  3. No stray console.log, debugger or focused tests.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const report = (file, line, msg) => problems.push(`${relative(root, file)}:${line}  ${msg}`);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

const version = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8').catch(() => '');
const known = new Set([version, ...[...changelog.matchAll(/^## (\d+\.\d+\.\d+)\b/gm)].map((m) => m[1])]);
const VERSIONISH = /\bv?\d+\.\d+\.\d+\b/g;
const WORDS = /\b(beta|legacy|previous version|older version|earlier version|old version|pre-release|flashcards?)\b/i;

const files = [];
for (const d of ['src', 'tests', 'tools', 'docs', '.github']) {
  try { for await (const f of walk(join(root, d))) files.push(f); } catch { /* folder may not exist yet */ }
}
for (const f of ['README.md', 'CHANGELOG.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'LICENSE']) files.push(join(root, f));

for (const file of files) {
  if (!/\.(ts|tsx|mjs|js|css|html|md|txt|yml|json)$/.test(file) && !file.endsWith('LICENSE')) continue;
  let text; try { text = await readFile(file, 'utf8'); } catch { continue; }
  const rel = relative(root, file);
  const lines = text.split('\n');
  const inCore = rel.startsWith('src/core/');
  const inData = rel.startsWith('src/data/');
  lines.forEach((line, i) => {
    const n = i + 1;
    // SVG path data ("a1.2.9 ...") is full of number runs that only look like versions
    const svgPath = /\bp\(['`]|\bd=["{`]/.test(line);
    if (!rel.startsWith('tools/lint.mjs')) {
      for (const m of svgPath ? [] : line.matchAll(VERSIONISH)) {
        const v = m[0].replace(/^v/, '');
        // dates and CDN/tool versions in CI config are fine; anything else must be one of the app's own versions
        if (known.has(v) || /^\d{4}\./.test(v) || rel.startsWith('.github/')) continue;
        report(file, n, `mentions version "${m[0]}" (the app only knows ${[...known].join(', ')}; add a CHANGELOG.md heading for a new one)`);
      }
      // (the Greek letters, as named in HTML: "alpha, beta" is the alphabet, not a test build)
      const words = line.replace(/\balpha\W+beta\b/gi, '');
      if (WORDS.test(words)) report(file, n, `wording about other versions: "${words.match(WORDS)[0]}"`);
    }
    if (/\.(ts|tsx)$/.test(rel)) {
      const imp = line.match(/from\s+['"]([^'"]+)['"]/);
      if (imp) {
        const spec = imp[1];
        if (inCore && (spec.includes('/ui/') || spec.includes('/data/') || spec.startsWith('preact'))) report(file, n, `core must not import "${spec}"`);
        if (inData && (spec.includes('/ui/') || spec.startsWith('preact'))) report(file, n, `data must not import "${spec}"`);
        if (spec.startsWith('.') && !/\.(ts|tsx|mjs|css|svg|txt|woff2|json)$/.test(spec)) report(file, n, `relative import needs its file extension: "${spec}"`);
      }
      if (inCore && /\b(document|window|localStorage|indexedDB|navigator)\./.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) report(file, n, 'core must not touch the DOM or browser storage');
      if (/\bconsole\.log\(/.test(line)) report(file, n, 'console.log left in');
      if (/\bdebugger\b/.test(line)) report(file, n, 'debugger left in');
      if (/\b(test|it|describe)\.only\(/.test(line)) report(file, n, 'focused test left in');
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`Lint passed (${files.length} files).`);
