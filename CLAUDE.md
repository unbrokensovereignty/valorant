# Working on Playbook

Read this first. It's written so that anyone, human or AI, can pick the project up from a fresh clone with no other notes. Details live in the files it links to.

## What this is

**Playbook By Sovereign**: an offline team comp planner for VALORANT. You tell it the situation (map, side, sites, rank, who you're queuing with, agents you must or won't play, role counts) and it ranks the comps and agents that fit, with pros, cons, plays and tips. The whole app ships as **one HTML file** (`Playbook By Sovereign v<version>.html`) that people download and open from disk in a desktop browser. There's no server, no account and no network; everything is saved in the browser (IndexedDB).

- Owner: Sovereign (GitHub `unbrokensovereignty`). All rights reserved (see `LICENSE`): Sovereign shares the app only with people they choose. The bundled third-party parts keep their own licenses, listed under Help → About. The game's art and ability text belong to Riot Games and are used under its fan content policy (also in `LICENSE`).
- **Credits:** the app and docs say "Designed and directed by Sovereign". Sovereign came up with the ideas and design and directs the work; never say or imply Sovereign wrote the code, and don't describe how the code was written either.
- Desktop browsers only (the page is built for 760 px and wider). Chrome, Edge, Firefox and Safari.
- Written in TypeScript + Preact (with signals) under `src/`, bundled by esbuild (`tools/build.mjs`) into the single file.

## Start here

1. `README.md`: what users get.
2. `docs/ARCHITECTURE.md`: the three layers, the engine, the knowledge base, saving, tests.
3. `docs/PRODUCT.md`: what the app should feel like, the owner's standing decisions, and the design rules (look, wording, motion, sound).
4. `CONTRIBUTING.md`: setup, the everyday loop, recipes (tune the engine, update a new agent, add a map, a play, a setting, a page…), testing and releasing.
5. `docs/ROADMAP.md`: what's planned next and what the owner has approved.
6. `CHANGELOG.md`: what each version changed.

## Commands

```sh
npm ci              # install (Node 22+)
npm run check       # typecheck + project lint + unit tests/specs + build. Run before every commit.
npm run test:tz     # the unit tests in ten time zones (date bugs)
npm run build       # → dist/Playbook By Sovereign v<version>.html
npm run dev         # same, readable, with inline source maps
npx playwright test # browser tests on the built file, light and dark (build first)
node tools/build.mjs --preview --out <file>   # a build that keeps its data apart from the real app's
npm run fetch-art -- <folder> && npm run art -- <folder>   # refresh agents, abilities, maps and art from the game's content
```

In a cloud container, Chromium is usually preinstalled: don't run `playwright install` there. If Playwright can't find its browser, point it at the one that's there with `PW_CHROMIUM=/opt/pw-browsers/chromium npx playwright test`.

## Rules that are easy to break

- **Layers.** `src/core` is pure logic (no DOM, no storage, no Preact); `src/data` may use core; `src/ui` may use both. `npm run lint` enforces this.
- **One place for each rule.** Every number the engine weighs is in `core/engine/weights.ts`; what a situation needs is `core/engine/model.ts`; scoring and the search are `core/engine/search.ts`; duos and trios are `core/engine/party.ts`; fits and tiers are `core/engine/plan.ts` (`fitOf`, `tierOf`); reasons are `core/engine/explain.ts`; the question and its sanitizer are `core/engine/query.ts`; settings are `core/settings.ts`. Facts about the game live in `core/kb/`. Never recompute these in a screen.
- **Reasons come from the score.** Pros, cons and notes are read off the same numbers the score uses, so they always agree with the ranking. A new reason goes in `explain.ts` and must be backed by a number there, not by a guess in a screen.
- **Numbers on screen come from constants.** If a sentence quotes a rule ("S from 95", "the middle team is 50"), build it from the constant (`TIERS`, `FIT_MID` and the rest, as `ui/pages/help.tsx` does) so the words can't drift from the code.
- **The app only knows its own versions.** Code, docs, tests and in-app text mention only versions that have a heading in `CHANGELOG.md` (or the one in `package.json`), and never words that hint at test builds or earlier editions. The product started fresh at 0.1.0: nothing may refer to anything before it or to any predecessor project. `npm run lint` checks this. (Game patch numbers like 13.08 have two parts, so they're fine.)
- **Anything read back is sanitized.** Stored records, backups and saved questions pass through the sanitizers in `core/saved.ts`, `core/backup.ts` and `core/engine/query.ts`. A new field needs a default in its sanitizer; then old data just works, with no migration.
- **New agents are estimates, kept apart.** An agent revealed but too new for real numbers (none right now) lives in `core/kb/new-agents.ts` with `estimate: true`, and the app says so wherever it shows them. The steps to update one are at the top of that file. An agent released after the last pro event (Hush, for now) is a full agent, but pro play counts neither for nor against them (`proKnown` in `core/kb/pro.ts`).
- **Specs run in the browser too.** `tests/specs/` is bundled into the app's hidden self-test page (`#/selftest`), so specs can't import Node modules.
- **Desktop only, keyboard friendly, both themes.** Every change should work in light and dark themes, with the keyboard, at every text size, and with motion set to Reduced or Off.
- **The scenario tests are the engine's referee.** After any change to `weights.ts`, `model.ts`, agent numbers or map needs, `npm test` must still pass `tests/unit/scenarios.test.ts` (a sound mix of roles everywhere, comps close to what pros play at Immortal and Radiant, each map's signature agents, easy agents who work alone at Iron, best comps that vary by map, new agents that don't take over) and `tests/unit/questions.test.ts` (hundreds of random questions keep their rules).

## How the owner likes to work

- Double-check and polish everything: run the checks, look at the result in a browser (both themes), and read your own diff before calling it done.
- Work on your own branch and open a pull request against `main`; commit in checkpoints with clear messages.
- Destructive GitHub actions (force-pushing `main`, deleting branches, PRs or repositories) need the owner's explicit go-ahead first. Touch only this repository unless the owner asks otherwise.
- Record every user-visible change in `CHANGELOG.md` under the version being worked on.
- Bigger features start as a short plan the owner approves (see `docs/ROADMAP.md`); small fixes can just be done.
- Plain, friendly wording in the app. No jargon, no exclamation-mark hype.

## Releasing a version

The version being worked on is in `package.json` and has a heading in `CHANGELOG.md` marked "in progress". To release it:

1. Finish its `CHANGELOG.md` entry (date it, drop "in progress"), and its lines in `core/whatsnew.ts`.
2. `npm run check && npm run test:tz && npx playwright test`, all green.
3. `npm run build`, then replace the HTML file in the repository root with the new `dist/` file (`git rm` the old one, so the root holds exactly one app file), and update the file name in `README.md`.
4. Merge the PR. To start the next version, bump `package.json` (`npm version <x.y.z> --no-git-tag-version`) and add its "in progress" heading.

See `CONTRIBUTING.md` for more detail.
