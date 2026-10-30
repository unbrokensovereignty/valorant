# How Playbook is built

Playbook is a TypeScript and Preact app that `tools/build.mjs` bundles with esbuild into one HTML file. Scripts, styles, fonts, icons and the game's art are all inlined, so the file opens straight from disk with no server and no network.

## Layers

The code is in three layers, and `npm run lint` enforces the direction they depend on:

| Folder | What it holds | May use |
| --- | --- | --- |
| `src/core/` | Pure logic: the knowledge base about the game (`kb/`), the engine that scores teams (`engine/`), settings, saved records and their sanitizers, backups, themes. No DOM, no storage. | nothing else |
| `src/data/` | Saving: tables, transactions with undo, IndexedDB with fallbacks, one writing tab at a time, and the typed repository every screen goes through. | core |
| `src/ui/` | Screens, components, sound, themes and styles. | core and data |

Because `core` is plain data in and plain data out, the unit tests and the scenario checks run the engine directly in Node.

## The knowledge base (`src/core/kb/`)

Everything the app knows about the game, as data with a comment at the top of each file saying where it came from and how it's written:

- `agents.ts`: every agent's role, strengths (`caps`, from 0 to 1 per strength, with the abilities behind each), how well they work alone (`solo`), how hard they are (`skill`), ranked pick rate (`pop`) and pro pick rate (`pro`). `new-agents.ts` holds agents revealed but too new for real numbers (none right now), marked `estimate`, with the steps to update them.
- `roles.ts`: the four roles and the fifteen strengths ("dims") everything is measured by: smokes, walls, flashes, information, entry, clearing, crowd control, delay, site hold, flank watch, retake, post-plant, healing, firepower and speed. Each has its name and its words for pros and cons in `DIM_INFO`.
- `maps.ts`: the maps, the competitive pool, sites, and what each map, side and site needs on top of a side's usual needs (`wall +.5`). How many of each role pro teams run on a map comes from its pro picks (`proRoleMix` in `pro.ts`).
- `ranks.ts`: the nine ranks, each placed between Iron (0) and Radiant (1).
- `pro.ts`: what pro teams pick on each map, and typical pro comps. `PRO_CUTOFF` is when the last of those events began: an agent released after it (Hush, for now) isn't pulled either way by pro play, since pros haven't had the chance to pick them (`proKnown`).
- `synergy.ts`: pairs that work well together or clash, from −3 to 3, with the reason in words.
- `plays.ts`: plays for every map (hits, splits, fakes, defaults, setups and retakes), written as jobs and routes over the game's own callouts, so any comp can run them. A typo in a job or callout throws, so a bad edit fails the tests.
- `tips.ts`: short advice for each agent, map side, rank, party size and doubled-up role.
- `content.gen.ts`: the game's own ability text, agent colors and map callouts, made by `npm run art` (see `CONTRIBUTING.md`). Don't edit it by hand. `kits.ts` reads it, falling back to a new agent's revealed kit in `new-agents.ts`. The game places some callouts badly (in a wall, or on the edge of a site), so `places` in `maps.ts` moves them, each checked by hand against the minimap.
- `floor.gen.ts` and `floor.ts`: where you can walk on each minimap, read from the minimap images by `tools/floor.mjs`, and `walk()`, the way along the floor from one spot to another, so a play's route goes round walls instead of through them. The specs check that every callout stands on the floor and every route keeps to it.

## The engine (`src/core/engine/`)

A question becomes one or more situations, each situation becomes a model, and the model scores every team the question allows.

1. **The question** (`query.ts`). Map, side, sites, rank, party size, must-play and won't-play agents, teammates already locked in, role counts, each player's agent pool, and whether to include new agents. Each of map, side and rank can be given, left open ("Any map", "Both sides") or asked for ("Find the best map"), so any input can also be an output. `sanitizeQuery` repairs anything that can't work (too many agents for the party, role counts that don't add up) and `situationsOf` lists the situations a question covers.
2. **The model** (`model.ts`). For a situation, how much each strength matters (the side's usual needs in `weights.ts`, plus the map's and sites' bumps, scaled by rank), each agent's own fit (a pull toward pro picks that grows with rank, and at low ranks a reward for agents who work alone and a cost for hard ones), each pair's synergy, and what each role count costs. "Any map" and "Both sides" average the situations they cover.
3. **The search** (`search.ts`). A team's score is how well its strengths cover the needs (coverage is the chance at least one agent brings a strength, so a second smoker adds less than the first), plus its agents' own fits, its pairs and its role costs. `searchTeams` scores every team the rules allow, all 142,506 of them when nothing is fixed, building each team one agent at a time so no work repeats.
4. **Parties** (`party.ts`). For a duo or trio, the picks that keep the team strong whatever random teammates lock in: each party's expected score over every way the rest could fill, each fill weighted by how likely players at your rank are to pick it (popular agents more often, and a missing role usually filled).
5. **Fits and tiers** (`plan.ts`). `solve` answers a question for one situation: the best comps or party picks, and how every agent ranks. Scores become fits against every possible team for the same situation (`referenceFor`): the best team is 100 and the middle one is 50, so a fit means the same on every map. An agent's fit comes from the best team it fits into, spread out by `AGENT_STRETCH`. `tierOf` turns a fit into S to D by the whole number shown. `teamFit` gives a saved team the same fit the answers gave it.
6. **Reasons** (`explain.ts`). Pros, cons and notes in plain words, read off the same numbers as the score: the strengths the team covers and lacks for the situation, its pairs, its role counts, its rank fit, how close it is to a pro comp, and its thinnest spot. So the reasons always agree with the ranking.
7. **Plays and tips** (`plays.ts`, `tips.ts`). A play's jobs go to the comp's agents so the team as a whole runs it as well as it can, and the play gets its own fit. Tips are picked for the map, side, team, rank and party.
8. **Copy** (`summary.ts`) turns a plan into plain text for a chat. **Print** draws the same parts as one sheet of paper (`ui/planner/sheet.tsx`), through `printSheet` in `ui/files.ts`, which makes the sheet the only thing on the paper and gives it the light theme's colors.

All of the engine's numbers are in `weights.ts`, each with a comment on what it does.

## Answering without freezing the page

The engine is fast, but some questions cover many situations: a duo asking for the best map, side and rank at once covers over a hundred. `ui/planner/store.ts` answers the Planner's question a situation at a time with a pause for the screen in between, so the page never freezes, and a newer question cancels an older one. `ui/solved.ts` does the same for pages that show many single situations at once (Rankings by map, an agent's best maps, a map's best comps): they're worked out one at a time after the page has drawn, newest asked first, and kept so going back is instant.

## Saving

There are three stores (`data/tables.ts`): `meta` (settings, themes, the app's own state), `plans` (saved plans) and `parties` (saved parties). `data/db.ts` runs every change as a transaction. The transaction updates the tables in memory, tells the screens what changed, records how to undo it, and queues the save in the background, retrying on failure, so a click never waits for storage. `data/repo.ts` is the typed way in: screens read through its getters and change data only through its methods, each one undoable transaction with a label in plain words. `ui/undo.ts` is the one place screens undo from: Ctrl Z, the sidebar buttons, the command palette and a message's Undo button.

`data/backends.ts` stores the data in IndexedDB. If the browser won't allow that, it falls back to localStorage, and failing that to memory, with a banner in either case. `data/tabs.ts` lets only one tab write at a time; other tabs follow its saves read-only and can ask to take over. `data/rescue.ts` covers closing mid-save by keeping a quick copy of unwritten changes in localStorage for the next tab to put back.

Anything read back goes through a sanitizer first (`core/saved.ts` for plans and parties, `core/engine/query.ts` for the question inside a plan, `core/settings.ts` for settings, `core/backup.ts` for backup files), so a damaged record or a hand-edited backup can't break the app. A stored record that can't be read at all is set aside, with a banner, and listed under Help → About.

## The screens (`src/ui/`)

- `shell.tsx`: the frame, sidebar (with the current question and Saved count), search (`components/palette.tsx`) and global keys.
- `pages/`: Home, Planner, Rankings, Agents, Maps, Saved (plans and parties), Settings, Themes, Help, and two hidden pages: the gallery (`#/gallery`, every control in the current theme) and the self-test (`#/selftest`, which runs the specs in the browser).
- `planner/`: the question (`question.tsx`), the answers (`answers.tsx`), a comp with its pros, cons, plays and tips (`comp.tsx`, `plays.tsx`), and the question in words (`words.ts`).
- `components/`: shared controls and overlays, agent and map pickers, the minimap with callouts (its routes follow `core/kb/floor.ts`).
- `tours/`: the guided tours. `list.ts` holds every tour's steps, each pointing at a `data-tour` hook in a screen (never at a styling class), with its words built from the engine's constants; `engine.tsx` draws the spotlight and card, waits for each target to arrive and settle, and handles the keys; `place.ts` works out where the card goes; `now.ts` is the tour on screen, which a screen can read to show what a step points at (the first comp opened, the Pros and cons tab) without saving anything. Tours remember only which ones you finished, in the app's `tips`.
- `art.tsx`: agent portraits, ability and role icons, map banners and minimaps from `assets/`, each falling back to plain text when an image is missing (a new agent's portrait, say).
- `theme.ts`, `sound.ts`, `styles/`: themes, synthesized sounds and styles (tokens in `styles/base.css`).

## Tests

```sh
npm run check    # type check, project rules, unit tests and specs, build
npm run test:tz  # the tests in ten time zones
npx playwright test   # browser tests, light and dark (build first)
```

- `tests/specs/` holds the behaviour specs for the engine, the knowledge base, plays, saved records and data. They also run inside the app, on the hidden self-test page.
- `tests/unit/scenarios.test.ts` checks the engine's answers as a whole against pro play, ranked play and common sense; `benchmarks.test.ts` measures how close the best comps come to what pros play, checks tiers at low ranks against ranked play, and checks that every reason a comp gives is true of it; `questions.test.ts` asks hundreds of random questions and checks every answer keeps the question's rules. All three are Node only (too slow for the self-test). `tours.test.ts` checks that every hook and page a tour names exists, and where the card goes.
- `tests/e2e/` drives the built file in a real browser: the Planner, Rankings, Agents, Maps, Saved plans and parties, search, copy, backups, settings, themes, a layout sweep of every page (at three widths and with extra-large text), an automated accessibility check, and every guided tour run from the keyboard (each step lit, its card clear of it, in a small window too).
