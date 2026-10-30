# Contributing to Playbook

How to set up, make a change, test it and release it. Read `CLAUDE.md` first for the rules that are easy to break, `docs/ARCHITECTURE.md` for how the code fits together, and `docs/PRODUCT.md` for how the app should look, read and answer.

## Setup

You need Node 22 or newer and git.

```sh
git clone https://github.com/unbrokensovereignty/valorant.git
cd valorant
npm ci
npm run check                        # should pass on a fresh clone
npx playwright install chromium      # once, for the browser tests (skip if Chromium is preinstalled)
```

If Chromium is already installed somewhere else (a cloud container often has one), point the browser tests at it instead: `PW_CHROMIUM=/path/to/chromium npx playwright test`.

## The everyday loop

1. Branch off `main`.
2. Change the code under `src/` (and the tests next to it).
3. `npm run build` and open `dist/Playbook By Sovereign v<version>.html` in a browser. `npm run dev` makes a readable build with source maps for debugging. Look at the change in a light and a dark theme.
4. `npm run check` (typecheck, project lint, unit tests and specs, build). Add `npm run test:tz` if you touched dates, and `npx playwright test` if you touched screens.
5. Add a line to `CHANGELOG.md` under the version in progress if people will notice the change.
6. Commit, push and open a pull request. CI (`.github/workflows/check.yml`) runs the same checks plus the browser tests in Chromium, Firefox and WebKit.

Your data while testing: files opened from disk can share saved data with the real app in the same browser. To keep test data apart, build with `node tools/build.mjs --preview --out <file>`, which saves under a separate database name.

## Where things are

| You want to change… | Look in |
| --- | --- |
| How much anything counts in a team's score | `src/core/engine/weights.ts` (every number, each with a comment) |
| What a situation needs, an agent's own fit at a rank, each map's pro role mix | `src/core/engine/model.ts` |
| How teams are scored and searched | `src/core/engine/search.ts` |
| Duos and trios, and how random teammates pick | `src/core/engine/party.ts`, `FILL_*` in `weights.ts` |
| Fits, tiers and the answer to a question | `src/core/engine/plan.ts` |
| What can be asked, and how a bad question is repaired | `src/core/engine/query.ts` |
| Pros, cons and notes, how a comp wins, why one ranks below another | `src/core/engine/explain.ts` (words for each strength in `DIM_INFO`, `src/core/kb/roles.ts`) |
| How a kit plays on a map, side or site | `src/core/kb/kitfit.ts` |
| What the other team's agents make you play around | `src/core/kb/counters.ts`, `threatsOf` in `src/core/engine/model.ts` |
| The arrows for tiers that moved since the version compared with | `src/core/engine/since.ts` (the words), `src/core/engine/since.gen.ts` (made by `tools/since.mjs`), `src/ui/since.tsx` |
| Who does what in a play, and a play's fit | `src/core/engine/plays.ts` |
| Which tips a plan gets | `src/core/engine/tips.ts`; the tips themselves in `src/core/kb/tips.ts` |
| The text Copy makes | `src/core/engine/summary.ts` |
| An agent's numbers and strengths | `src/core/kb/agents.ts`; a new agent's in `src/core/kb/new-agents.ts` |
| A map's needs, sites, pool, patch | `src/core/kb/maps.ts` |
| Pro picks and comps per map | `src/core/kb/pro.ts` |
| Pairs that help or clash | `src/core/kb/synergy.ts` |
| Plays | `src/core/kb/plays.ts` |
| Abilities, agent colors, callouts, art | `src/core/kb/content.gen.ts` and `assets/`, both made by `npm run art` (below) |
| A callout in the wrong spot on a minimap | `places` for its map in `src/core/kb/maps.ts` |
| Where routes can go on a minimap | `src/core/kb/floor.gen.ts`, read from the minimaps by `node tools/floor.mjs` (`npm run art` runs it too) |
| Saved plans, parties and flags | `src/core/saved.ts` (records and sanitizers), `src/data/repo.ts` (changes), `src/ui/pages/saved.tsx`, `src/ui/flags.ts` |
| Backups | `src/core/backup.ts`, `src/ui/backup.tsx` |
| Settings | `src/core/settings.ts` (the schema), `src/ui/pages/settings.tsx` (drawn from it) |
| Themes | `src/core/theme.ts` (generation, built-ins, theme codes), `src/ui/theme.ts` (applying, switching), `src/ui/pages/themes.tsx` |
| The Planner's screen | `src/ui/pages/planner.tsx`, `src/ui/planner/` (question, answers, comp, plays, store) |
| Pages that show many situations (Rankings by map, best maps, best comps) | `src/ui/solved.ts` |
| Saving, undo, tabs | `src/data/db.ts`, `src/data/backends.ts`, `src/data/tabs.ts`, `src/data/repo.ts`, `src/ui/undo.ts` |
| The frame, sidebar, search, shortcuts | `src/ui/shell.tsx`, `src/ui/components/palette.tsx` |
| Shared buttons, fields, dialogs, toasts | `src/ui/components/controls.tsx`, `src/ui/components/overlays.tsx` |
| Agent and map pickers, the minimap | `src/ui/components/pickers.tsx`, `src/ui/components/minimap.tsx` |
| Styles | `src/ui/styles/` (base tokens in `base.css`, one file per area) |
| Sounds | `src/ui/sound.ts` |
| Icons | `src/ui/icons.tsx`; the game's art through `src/ui/art.tsx` |
| The in-app guide and About | `src/ui/pages/help.tsx` |
| What's new in a version | `src/core/whatsnew.ts` |
| The guided tours | `src/ui/tours/` (`list.ts` the steps, `engine.tsx` the spotlight and keys, `place.ts` where the card goes) |

## Recipes

**Tune the engine.** Change the numbers in `src/core/engine/weights.ts` (or a map's needs, or an agent's strengths), then run `npm test`. The scenario checks in `tests/unit/scenarios.test.ts` say if the answers still make sense across every map, side and rank, and `tests/unit/questions.test.ts` asks hundreds of random questions. If a check fails, look at what changed before loosening it: the checks stand for what players and pros would call a sensible answer. Then look at the Planner and Rankings in the browser at a low and a high rank.

**Update a new agent once they're out.** Follow the steps at the top of `src/core/kb/new-agents.ts`: change the numbers (what each means is at the top of `agents.ts`, with the sources), take out `estimate: true` and move the entry into `agents.ts`; refresh the game's content (below) so the abilities and portrait come from the game; add pairs to `synergy.ts`, and pro picks to `pro.ts` once pros play them (until `PRO_CUTOFF` in `pro.ts` is moved past their release, pro play counts neither for nor against them); then `npm run check`. Add a line to `CHANGELOG.md`.

**Refresh the game's content and art.** On a computer that can reach valorant-api.com (a free community copy of the game's content, no key needed):

```sh
npm run fetch-art -- ~/playbook-content   # downloads agents.json, maps.json and the images
npm run art -- ~/playbook-content         # → assets/ and src/core/kb/content.gen.ts
```

`fetch-art` lists anything the API doesn't have yet (a new agent's art, say); the app shows the agent's initial until it's there. `art` resizes the images to WebP in `assets/` and writes every agent's abilities and every map's callouts into `content.gen.ts`. If the game files a new agent's ability under a different slot from the key players press, add it to `KEY_FIXES` in `tools/prepare-art.mjs` (the specs check that every agent has an ability on each key). Check the diff of `content.gen.ts` for changed callout names: plays and tips name callouts, and a renamed one fails the specs until it's updated there. `art` also reads where you can walk on each minimap into `floor.gen.ts`; a new minimap can leave a callout in a wall, which the specs report, and `places` in `maps.ts` moves it. Look at the map's page with Show callouts on to check every name sits where players stand. Keep the build under its size budget (`SIZE_BUDGET` in `tools/build.mjs`).

**Add an agent.** Give it an entry in `src/core/kb/agents.ts` (or `new-agents.ts` with `estimate: true` while it's new): id, name, role, release date, strengths as `dim value keys`, `solo`, `skill`, `pop` and `win` (its pro pick rate is worked out from `pro.ts`). Refresh the game's content for its abilities and art. Give it two tips in `src/core/kb/tips.ts`, any pairs in `synergy.ts`, and pro picks in `pro.ts` once pros play it. Plays need nothing: their jobs go to whoever in the comp is best at them. `npm run check` tells you if anything's missing.

**Change the map pool.** Set `pool: true` or `false` on the maps in `src/core/kb/maps.ts`, and update `PATCH` and `POOL_SINCE` (with the date of the next change in the comment). Pick rates in `agents.ts` and `pro.ts` name the patch and events they came from; update those comments when you update the numbers.

**Add a map.** Add it to `DEFS` in `src/core/kb/maps.ts` with its sites, needs (as bumps over a side's usual needs), and `aka` for callouts players call something else. Refresh the game's content for its minimap, banner, callouts and floor, and move any callout the game places badly with `places`. Add its plays to `src/core/kb/plays.ts` (both sides, every site), its tips to `tips.ts` and its pro picks to `pro.ts` (the engine reads the map's pro role mix from them). The specs check each of these.

**Add or change a play.** Plays are in `src/core/kb/plays.ts`, written as `jobs: route | what to do`, five steps a play (one per player), over the map's own callouts. The comment at the top of the file explains the format. A typo in a job or callout throws, so `npm test` catches it. Look at the play on the map's page in both themes: its routes are drawn on the minimap.

**Add a kit rule.** When a kit does more or less on a map, side or site than its strengths in `agents.ts` say, add a rule to `KIT_RULES` in `src/core/kb/kitfit.ts`: the agent, where it applies, the change (`disrupt +.15; clear -.1`, a few hundredths to two tenths) and why in one sentence a coach would say, which shows as a pro or a con. Add a claim to `tests/unit/gamesense.test.ts` that the fits follow it.

**Add a pair.** Add a `P(a, b, strength, side, reason)` line to `src/core/kb/synergy.ts`: strength from −3 (they clash) to 3 (a classic combo), and the reason as one plain sentence; it's shown as a pro or a con.

**Add a reason (pro, con or note).** Add it to `explainTeam` in `src/core/engine/explain.ts`, backed by the numbers the score uses, and a spec in `tests/specs/engine.spec.ts` that it shows when it should and not otherwise.

**Add a setting.** Add an entry to `SETTINGS` in `src/core/settings.ts` with its section, type, default and label. The Settings page and the command palette pick it up automatically. Read it through `useSettings()` in a screen. Saved settings are sanitized against the schema, so an existing profile gets the default.

**Add a field to saved data.** Add it to the type in `src/core/saved.ts` (or to `Query` in `src/core/engine/query.ts` for something a question holds) and give it a default in that record's sanitizer. Records saved before the change then read back with the default; no migration is needed. Add a spec in `tests/specs/` that a record without the field still loads.

**Add a page.** Add its name to `Page` and `PAGES` in `src/ui/state.ts`, write the component in `src/ui/pages/`, register it in `PAGE_VIEWS` (`src/ui/pages/index.ts`), add it to the sidebar and the command list in `src/ui/shell.tsx` if it belongs there, and add it to `PAGES` in `tests/e2e/pages.spec.ts` so the layout sweep and the accessibility check cover it.

**Make a change undoable.** Change saved data only through a method on `Repo` (`src/data/repo.ts`) that runs one transaction with a label in plain words ("Delete “Haven default”"). That label is what Undo and Redo name. Show its message with `toast(text, { undo: true })` to give the message an Undo button for that change.

**Add or change a tour.** Tours are in `src/ui/tours/list.ts`. A step names the page to be on (or stays on the one before), a `data-tour` hook to light up, a title and a line or two of text, and the side the card should go. Put the hook on the thing itself in the screen (`data-tour="…"`, or the `tour` prop on `Button`, `Tabs` and the Planner's question parts), on something small enough to leave room for the card. Build any number a step quotes from the engine's constants, as `fitWords()` does. If a step points at something a screen hides by default (a closed comp, another tab), have the screen show it while the step is on, by reading `tourHook` from `src/ui/tours/now.ts`, without saving anything. `tests/unit/tours.test.ts` checks the hooks and pages, and `tests/e2e/tours.spec.ts` runs every tour from the keyboard and fails if a step's card covers what it points at.

**Add a sound.** Add its name and group to `SOUNDS` in `src/ui/sound.ts` and a case built from the helpers there. Keep it short and quiet; it follows the volume sliders and every sound set.

**Add an icon.** Add it to `ICONS` in `src/ui/icons.tsx`, drawn on the 24 px grid with the same stroke. Use it through `<Icon name="…" />`.

**Add a theme color (token).** Add it to the tokens in `generateTheme()` in `src/core/theme.ts`, derived from the picks (and checked for contrast if text sits on it). It then exists as `var(--name)` in every theme.

## Tests

| Where | What | Run with |
| --- | --- | --- |
| `tests/specs/` | Behaviour specs for the engine, the knowledge base, plays and tips, saved records, backups, settings and data. They also run in the browser on the hidden `#/selftest` page, so no Node imports. List new files in `tests/specs/index.ts`. | `npm test` |
| `tests/unit/` | The scenario checks (the engine's answers against pro play, ranked play and common sense), the benchmarks (how close the best comps come to pro comps, low-rank tiers against ranked play, and that every reason a comp gives is true), the random-question check, and the tour checks. Node only. | `npm test` |
| `tests/e2e/` | Playwright on the built file for the version in `package.json`, in Chromium light and dark (`E2E_BROWSERS=others` runs Firefox and WebKit instead, `all` runs every browser; CI runs both). Every test fails on a console error. `pages.spec.ts` sweeps every page for cut-off text and runs an automated accessibility check (axe); helpers are in `app.ts` (`open`, `go`, `saved`). | `npm run build && npx playwright test` |
| `tools/test-timezones.mjs` | `npm test` in ten tricky time zones. | `npm run test:tz` |

Write a test for every bug fixed and every rule added. Prefer a spec (fast, runs everywhere) and add an e2e test when the bug is about the screen.

## Project lint

`npm run lint` (`tools/lint.mjs`) checks what TypeScript can't: layer imports, file extensions on relative imports, no `console.log`, `debugger` or `.only`, and version mentions. A version number anywhere in `src/`, `tests/`, `tools/`, `docs/` or the top-level docs must be the one in `package.json` or have a heading in `CHANGELOG.md`.

## Code style

- TypeScript strict, ES modules, relative imports with their extension (`./x.ts`).
- Small pure functions in `core`, with a comment above anything that encodes a rule, saying why.
- Knowledge-base files say where their facts came from at the top. Keep that up to date when you change the facts.
- Comments and in-app text in plain English, with typographic quotes (’ “ ”) in shown text.
- Match the surrounding code: its comment density, naming and one-line style for small helpers.
- No new runtime dependencies without a good reason. The file must stay offline and under the size budget in `tools/build.mjs`.

## Releasing

1. Everything for the version is merged or in the release PR, and its `CHANGELOG.md` entry is complete and dated (drop "in progress"). Its lines in `src/core/whatsnew.ts` say what's new in a few words.
2. The tiers that moved are up to date: `node --experimental-strip-types tools/since.mjs --check` (the unit tests check a sample; run `tools/since.mjs <commit>` again with the commit of the release compared with when it says so).
3. `npm run check && npm run test:tz && npx playwright test` all pass.
4. `npm run build`. Replace the app file in the repository root with the new one from `dist/` (`git rm` the old file so the root holds exactly one), and update the file name in `README.md`.
5. Open the root file in a browser, run the self-test from Help → About, and click through Home, the Planner (a five-stack and a duo), Rankings, an agent, a map, Saved and Settings in both themes.
6. Merge. Then bump `package.json` for the next version (`npm version <x.y.z> --no-git-tag-version`) and add its "in progress" heading to `CHANGELOG.md`. For the arrows to compare with the release just made, rewrite `CHANGES` in `tools/since.mjs` for the new version's changes to scoring as they land (and `REVIEWED` and the reasons in `src/core/engine/since.ts`), and run `node --experimental-strip-types tools/since.mjs <the release's merge commit>`.

Versions go major.minor.patch: big changes, new features, fixes.
