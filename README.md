# Playbook — By Sovereign

An offline team comp planner for VALORANT, for desktop browsers. Designed and directed by Sovereign.

Download `Playbook By Sovereign v0.2.0.html` from this repository and open it in Chrome, Edge, Firefox or Safari. There's nothing to install, no account and no network: everything is saved in your browser.

## What it does

- **The Planner.** Tell it the map, side, sites and rank, and who you're queuing with: a five-stack, a trio, a duo or solo. Add agents you must play or won't play, teammates who've already locked in, the other team's agents if you know them, and how many of each role you want. Leave anything open, or ask for the best map, side or rank instead. You get the comps that fit best, each with a fit from 0 to 100 and a tier, how it wins, its pros and cons for that situation, how it compares with what pro teams play, plays it can run with who does what on the minimap, and tips. Copy a plan into your team chat or print it on one sheet.
- **How you play.** Your rank, how you queue and the agents you play, asked the first time it opens, so every plan starts from you.
- **Rankings.** Tier lists of agents and comps for any map, side and rank, and a table of every agent on every map.
- **Agents and Maps.** Every agent's kit, strengths, best maps and best partners; every map's sites, callouts, plays and best comps.
- **Saved.** Keep plans you like, with a note, and your usual party with the agents each of you plays, so planning for it is one click.
- **Guided tours.** Short tours under Help → Tours show you each page on the real screens, one thing at a time.
- **Your way.** Light and dark themes (or your own), text size, motion and sound settings, full keyboard use, undo for every change, and backups to a file.

The numbers come from ranked and pro play up to the patch named on the Home page. Hush, the newest agent, came out after the year's top pro events, so her numbers come from her first days in ranked and from her kit, and pro play counts neither for nor against her yet.

## Working on it

The app is written in TypeScript under `src/` and built into that single HTML file. After a change, `npm run build` rebuilds it into `dist/`; copy it over the one in the repository root when releasing.

```sh
npm ci
npm run check         # type check, project rules, tests, build
npm run build         # → dist/Playbook By Sovereign v<version>.html
npm run test:tz       # the tests in ten time zones
npx playwright test   # browser tests (build first)
```

Start with [CLAUDE.md](CLAUDE.md), which lists the project's rules and points to the rest: [CONTRIBUTING.md](CONTRIBUTING.md) (setup, recipes, testing, releasing), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (how the code and the engine are organized), [docs/PRODUCT.md](docs/PRODUCT.md) (how the app should look, read and answer) and [docs/ROADMAP.md](docs/ROADMAP.md) (what's next).

## License

© 2026 Sovereign. All rights reserved. Playbook is shared privately with people Sovereign chooses; see [LICENSE](LICENSE).

Playbook was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.
