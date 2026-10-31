# Roadmap

What's planned, what the owner has approved, and what's done. Update it as work lands. Items marked **proposed** wait for the owner's OK before they're built. Small fixes don't need to be listed here.

## 0.3.2: maps placed by hand, clearer plays, more room (released 2026-10-31)

The owner placed every map's callouts and marks by hand in the map editor (31 October 2026) and asked for: breakable walls as an orange line, smaller ultimate orbs, silent drops as a square, every mark about the same size; small fixes to their placements where needed; a focus on the plays; layouts that use more of a wide screen with larger minimaps everywhere; and no smoothing when moving the map.

- **Built:** the owner's edits for every map (two Abyss rope descriptions and Ascent's mid panels, which older kept work in the editor had dropped, stay as they were); the new marks; one placement tweak (Haven's C Long callout off its orb); a map that stays locked to the cursor; wider pages and larger minimaps; players' faces where their routes end, stepping through a play, plays listed in columns, and a fake on Abyss, Corrode, Lotus, Summit and Sunset; and an editor that matches kept or older edits to the right marks.

## 0.3.1: map accuracy (released 2026-10-30)

The owner asked (30 October 2026) for a version about the maps only: everything on each minimap where it really is, nothing missing, and callout names that zoom with the map and sit close to their dots. The owner placed Abyss's and Ascent's callouts and marks by hand in the map editor, as the model for the rest.

- **Built:** the owner's Abyss and Ascent edits; every other map's ultimate orbs, ropes, doors, walls, ziplines and teleporters placed from both VALORANT wikis' interactive maps (which line up with the game's minimaps) and checked by eye, with droppable walls and silent drops as marks of their own; callout names that scale with the zoom, sit closer to their dots and keep off the marks, in the app and the map editor.
- **Left for a version that may move tiers:** the kit rules still count ropes only on Split (Jett's Updraft, Waylay's Lightspeed) and switch doors only on Ascent and Lotus (Hush's Telekinesis). Abyss, Breeze, Fracture, Icebox, Lotus and Summit have ropes and Sunset has a switch door too, but counting them would move ratings, which this version leaves alone.

## 0.3.0: picking the map, and a better minimap (released 2026-10-30)

The owner approved (30 October 2026) three things for this version, from the ideas below and what 0.2.5 taught: ranked win rates for each map, ratings that move steadily between neighboring ranks, and help picking a map. The owner then made the minimap the main focus: every callout on all 13 maps placed from several sources, a dot at the center of each callout (on by default), callout text that can be made bigger or smaller, zoom and pan, and optional layers for ultimate orbs and map features such as doors, breakable walls and Bind's teleporters.

- **Planned:** steadier ratings first (the pro role mix and the second controller coming in at the same rank, and each rank taking in some of its neighbors' games), then the minimap, ranked win rates for each map (gathered on the owner's computer, since this one can't reach stats sites), and map pick help built on both. Then rounds of testing and fixing until two rounds in a row find nothing significant.
- **Built:** steadier ratings between ranks; the minimap (zoom and pan, callout name sizes and dots, every callout checked against the game's labels and other callout maps, and layers for ultimate orbs, doors, breakable walls, teleporters, ziplines and ropes); map pick help (maps to play and to ban for a five-stack, with why); and ranked win rates for each map (read from metabot.gg's public pages, so the owner's computer wasn't needed), counted only as far as they're more than chance, with each side's share of rounds on the map pages. Then four rounds of testing and fixing in both themes, until two rounds in a row found nothing significant.

## 0.2.5: game sense (released 2026-10-30)

The owner asked for game sense above all: what the app says should match what a pro would recommend for the inputs, with thought behind the numbers, not just numbers, and a lot of time spent improving, testing and fixing the information and the engine's inconsistencies. The example: agent ratings should follow how a kit plays on each map and side (Hush strong on Lotus attack, working the doors from range), not only win rates. Feedback relayed during the work: a double controller shouldn't lead Lotus at Platinum, duos and trios should be shown picks for their random teammates, All ranks should go, the first launch should ask how you play, and minimaps should be accurate. The owner added "Against a known team" and the printable plan sheet to this version.

- **Built:** kit rules by map, side and site with the reasons a coach would give; maps described by how open they are and their mechanics; against a known team; a second controller costing a comp below Immortal; picks for random teammates; solo planning; first-launch setup and your own agents; a rank for every answer; minimaps and routes checked against the game; words that match the kit; how each comp wins; why an agent's best comp ranks lower; a printed plan; plays that need missing utility no longer reading "Fits well"; pistol and eco plays with a buy guide; Compare; This looks wrong; arrows for tiers that moved since 0.2.0, with why; agents with the same fit told apart by what they add over the next best of their role; fits marked less sure where they rest on very little, with why; and a patch checklist (`tools/patch.mjs`) that lists what changed in the game's content since a release and what in the app leans on it. A fairer pro-play neutral for agents pros haven't played yet was tried and dropped: the role's usual pull is about zero on every map already, and a role average only added noise from the other agents' picks. Then rounds of testing and fixing in both themes, until two rounds in a row found nothing significant. Ranked win rates for each map, also in the plan, moved to the ideas below.

## 0.2.0: more reliable answers, and a guided tour (released 2026-10-29)

The owner asked (29 October 2026) for the next version to make the engine and the knowledge base much more reliable and accurate, and to expand what they cover: think about what's missing, crosscheck the answers against what pro teams play and what experts say, and test that what the app says is actually good advice, not just numbers that look right. Ranked win rates are part of it. Also a guided tour of the app, checked in every round of testing. The detailed plan comes first, then rounds of testing and fixing until two rounds in a row find nothing significant. The owner asked for this to go ahead without waiting on them.

- **Planned:** an audit against Champions 2026 pro picks, ranked win rates and expert tier lists found that no top comp had an Operator player (Chamber, picked by pros on 52% of maps, was in none) and that agent tiers below Immortal followed pro play more than ranked results. The engine will count a kit for what a team at the rank gets out of it, weigh ranked win rates, pull toward pro picks mostly from Diamond up, measure long angles for the Operator, and read each map's role mix from pro play, all checked by benchmark tests. Agent pages show an agent's tier at each rank and their win rate, Help says where the numbers come from, and six guided tours show the app on its real screens.
- **Built:** kits counted for what a team at each rank gets out of them, ranked win rates weighed most in the middle ranks, this year's pro picks and role mixes pulling mostly from Diamond up, long angles for the Operator, map lines and agent pages from this year's pro play, each agent's tier at every rank, clearer cons (one line for a missing role, gaps that name who partly covers them, hard kits with what a team at the rank gets of them), plays checked so no smoke lands on a teammate's way, tips that fit each side, how often random teammates pick the role to ask for, and six guided tours. Then twelve rounds of testing and fixing, until two rounds in a row found nothing significant.

## Keeping the numbers current (approved, every version)

1. **Each new patch or event.** Refresh ranked pick rates (`pop` in `agents.ts`), pro picks and comps (`pro.ts`, and `PRO_CUTOFF` once there's a new event) and the map pool (`maps.ts`; the pool changes next on 6 January 2027), and note the patch and events in each file's sources.
2. **Each new agent.** While revealed but not out, add them as an estimate in `src/core/kb/new-agents.ts`; once out, move them into `agents.ts` with numbers from their first days and refresh the game's content for their art and ability text (the steps are at the top of `new-agents.ts` and in `CONTRIBUTING.md`).

## Ideas (proposed, for the owner to pick)

1. **How well you play each agent.** Say how well you play each of your agents (or just your mains), and the Planner leans toward comps you can actually play. The agents you play already count (0.2.5); this would weigh them by how well.
2. **More fakes.** Every pool map has a fake now (0.3.2); the six maps out of the pool don't yet.

### Ideas for the next bigger version (proposed)

3. **Plays in time.** Each step of a play gets a moment (before the hit, on the hit, after the plant), and the minimap plays them in order, like a replay, with the smokes, walls and flashes drawn where they land.
4. **Your own plays.** Draw a play on the minimap (routes, jobs and a line each), save it with your plans, and have the Planner fill it with the agents of any comp, like the built-in ones.
5. **A map's plays on its page.** Browse every play for a map from its page, filled with the pros' usual comp, without asking the Planner first.
6. **Ropes and doors in the kit rules.** Count the ropes on Abyss, Breeze, Fracture, Icebox, Lotus and Summit and Sunset's switch door in the kit rules (the follow-up left from 0.3.1). It moves ratings, so it belongs in a version that may.
7. **Defense setups by site.** A stack, a retake setup and an aggressive early fight for each site, so defense has as many choices as attack.

## 0.1.5: Hush and a tidier layout (released 2026-10-29)

The owner asked for Hush to be added fully now that she's out, with extra research to make up for how few stats there are yet, and for a review of the whole layout for inconsistencies (the role counts in the Planner were one), with rounds of testing and fixing until two rounds in a row found nothing significant. The heavier engine and knowledge work moved to the next version.

- **Built:** Hush as a full agent (the game's 13.09 text and art, numbers from her first days in ranked and from reviews of her kit, partners and tips, with pro play neutral until pros can pick her), the game's text marks for ability names and effects, Clove's 13.09 change, and layout fixes across the Planner, Settings, Rankings, agent pages and dialogs, with browser tests that catch labels that wrap and role counts that don't line up.

## 0.1.0: the first version (released 2026-10-29)

The owner asked for an offline program that picks team comps and agents for a situation and explains them: plays, pros and cons, tips, and general rankings of comps and agents, with research into which agents and comps work together, Hush included. Any input can be an output (map, rank, side and sites, party with must-play agents and role rules). The owner then decided, on the plan: the name Playbook; all rights reserved; plays for all 13 maps; the game's own agent portraits and art; and to start at once with Hush's numbers as placeholders that are easy to change. Live match data was looked into: a file opened from disk can't fetch it, so the numbers are built in and refreshed with each version.

- **Built:** the knowledge base (every agent's strengths and numbers, every map's needs and sites, pro picks and comps, pairs, plays for all 13 maps, tips), the engine (every team scored for the situation, fits and tiers, duos and trios over likely random teammates, reasons read off the score), and the screens: Home, the Planner, Rankings, Agents, Maps, Saved plans and parties, Settings, Themes and Help. Then rounds of testing and improvement against pro play, ranked play and common sense, until two rounds in a row found nothing significant.
