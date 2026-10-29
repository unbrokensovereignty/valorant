# What Playbook should be

The product intent behind the code: who it's for, what it should feel like, and the standing decisions the owner has made. Read it before changing how anything looks, reads or answers. `docs/ARCHITECTURE.md` covers how the code is built.

## Who it's for

VALORANT players, from Iron to Radiant, deciding what to play: a five-stack picking a comp for tonight's map, a duo or trio who want picks that hold up whatever random teammates lock in, or one player wondering which agents suit a map, a side or their rank. They open one file on a laptop or desktop, ask a question in a few clicks, and want an answer they can trust and act on in agent select: the comp, why it works, what it's missing, a play to run and a few tips.

## Standing decisions

The owner made these. Don't reverse one without asking.

- **The name** is Playbook By Sovereign ("Playbook" in the app's frame).
- **One offline file.** Everything (code, styles, fonts, icons, the game's art, sounds) is inside the HTML file. Sounds are synthesized, not recorded. Nothing is fetched from the network, ever. Live match data can't be fetched by a file opened from disk, so the app never claims to be live: its numbers come from the knowledge base, which says where they came from, and are refreshed by releasing a new version.
- **Your data stays in your browser.** Saved in IndexedDB, with localStorage or memory as fallbacks (and a banner when falling back). Backups are JSON files people download. Nothing is sent anywhere.
- **Desktop browsers only.** No phone layouts.
- **Any input can be an output.** Map, side, sites, rank, party size, must-play and won't-play agents, locked-in teammates, role counts and each player's agents can all be given, left open or (for map, side and rank) asked for, and combined freely.
- **Plays for all 13 maps**, in and out of the pool, written over the game's own callouts.
- **The game's art, used directly.** Agent portraits, ability and role icons, map banners and minimaps come from the game's own content, under Riot Games' fan content policy (the notice is in `LICENSE` and Help → About). The app isn't sold or distributed widely.
- **New agents are honest estimates.** An agent too new for real play (Hush, released 27 October 2026) gets numbers estimated from the kit that was shown, kept in one file (`core/kb/new-agents.ts`) so they're easy to replace once there's play to go on. The app says they're estimates wherever it shows them, and people can leave new agents out of a question or of every question (Settings → Planner).
- **A fresh product from 0.1.0.** The app, its docs and its history never refer to anything before 0.1.0. Saved data has its own format with no imports from anything earlier.
- **All rights reserved, shared privately.** Sovereign shares the app with people they choose; it is not public or open source. No legal machinery beyond the notice in `LICENSE` and Help → About.
- **Credits.** Wherever the app or docs credit someone, it reads "Designed and directed by Sovereign". Sovereign came up with the ideas and design and directs the work, but doesn't claim to have written the code, and nothing says how the code was written.

## Answers people can trust

- **A fit means the same everywhere.** Fits run from 0 to 100 against every possible team for the same situation: the best is 100 and the middle one is 50. Tiers go by the fit shown (S, A, B, C, D), so two comps that show the same number share a tier.
- **Reasons match the ranking.** Every pro, con and note is read off the numbers that ranked the comp. No reason is written by hand for a single comp.
- **Rank changes the answer.** Low ranks reward aim and simple, selfish utility and agents who work alone; high ranks reward coordinated utility and lean toward what pro teams play. The tests check both ends.
- **Parties plan for real lobbies.** A duo or trio is scored over the teammates they're likely to get at their rank, not over a perfect five.
- **Say what can't be done, and why.** When no comp fits the choices, the page points at the likely cause and offers to clear the agent and role choices. When a role count can't fit the party, it says so instead of quietly changing it.
- **Sensible, not stale.** The scenario tests (`tests/unit/scenarios.test.ts`) keep the answers sound across maps and ranks: every top comp has a controller and a sound mix of roles, high-rank answers stay close to pro play, each map's signature agents show up, and new agents don't take over.

## Look

"A coach's clipboard on a quiet desk": calm surfaces, clear type, and the game's own art doing the color.

- **Type:** Literata (serif) for headings; Atkinson Hyperlegible Next for the interface; Atkinson Hyperlegible Mono for keyboard keys. All bundled.
- **Themes:** Paper (light) and Lamp (dark) are the defaults. There are ten built-in themes plus a theme editor with shareable theme codes. Every theme is generated from five picks by `core/theme.ts`, which nudges colors until text is readable on every shade it sits on.
- **Light or dark** follows the computer by default. Switching cross-fades the whole page as one snapshot (`ui/theme.ts`); keep it smooth and never animate element by element.
- **Tiers and roles** have their own colors in every theme, but a fit is never shown by color alone: it has its tier letter and a bar, and its number unless that's turned off in Settings.
- **Components:** everything shared is in `ui/components/controls.tsx`, and the hidden gallery page (`#/gallery`) shows every control in the current theme. Check it after style changes.
- **Icons:** one hand-drawn set in `ui/icons.tsx` (24 px, rounded strokes), beside the game's own ability and role icons.
- **Space:** tokens in `ui/styles/base.css` (`--sp-*`, `--r-*`, `--dur-*`, `--ease*`). Use them instead of one-off values.

## Motion and sound

- Motion has three levels (Settings → Appearance): Full; Reduced (fades only); Off. `html[data-motion]` carries the level, and base.css enforces Reduced and Off globally. Anything new must look right at all three.
- Durations come from `--dur-quick` (120 ms), `--dur-base` (220 ms), `--dur-page` (320 ms) and `--dur-flip` (450 ms). Prefer transforms and opacity, which animate cheaply.
- Sounds are named cues in `ui/sound.ts`, grouped as interface and results, each with its own volume. Three sound sets: Desk, Chimes and Kalimba. Sound is quiet by design and can be turned off.

## Wording

- Plain, warm and short, like a teammate who knows the game. Sentences, not fragments. No exclamation-mark hype.
- Say what happens and why: "Sage keeps Reyna alive long enough to snowball", not "Synergy +2".
- Use the game's own names for agents, abilities and callouts, and players' own words for the rest (comp, entry, retake, post-plant, lurk). Avoid anything only the code uses.
- Numbers that describe a rule come from its constant (see `CLAUDE.md`).
- Typographic quotes and apostrophes (’ “ ”) in shown text.

## Quality bar

- Works in light and dark, at every text size, and with the keyboard alone. Nothing is cut off or pushed off screen (an e2e test sweeps every page for this), and tooltips never clip.
- Passes an automated accessibility check (WCAG AA) on every page.
- No errors in the console. The e2e tests fail on any page error.
- Never freezes: long questions are answered a situation at a time, with progress on screen.
- Damaged data never breaks the app: it's set aside and shown under Help → About.
- Undo (Ctrl Z) for every change to saved data.
