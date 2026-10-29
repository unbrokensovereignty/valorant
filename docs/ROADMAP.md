# Roadmap

What's planned, what the owner has approved, and what's done. Update it as work lands. Items marked **proposed** wait for the owner's OK before they're built. Small fixes don't need to be listed here.

## Next: keeping the numbers current (approved)

The owner asked for Hush's numbers to stay placeholders that are easy to change later.

1. **Hush's real numbers and art.** Once the patch notes and a few weeks of play are in, replace the estimates in `src/core/kb/new-agents.ts` (the steps are at the top of that file and in `CONTRIBUTING.md`), take out `estimate: true`, and refresh the game's content for Hush's portrait, ability icons and ability text.
2. **Each new patch or event.** Refresh ranked pick rates (`pop` in `agents.ts`), pro picks and comps (`pro.ts`) and the map pool (`maps.ts`; the pool changes next on 6 January 2027), and note the patch and events in each file's sources.

## Ideas (proposed, for the owner to pick)

1. **Your own agents.** Say how well you play each agent (or just your mains), and the Planner leans toward comps you can actually play, not only toward what fits on paper. Parties already hold each player's agents; this would weigh them too.
2. **Against a known team.** Enter the other team's comp (from the last map of a series, or after the first round) and see which of your comps and plays answer it best.
3. **A plan sheet to print.** One page per plan with the minimap, who does what in each play, and the tips, for a team that reviews before playing.
4. **More plays per map.** Pistol-round and eco plays, and more fakes (there are hits, splits, defaults, setups and a retake for every site now).

## 0.1.0: the first version (released 2026-10-29)

The owner asked for an offline program that picks team comps and agents for a situation and explains them: plays, pros and cons, tips, and general rankings of comps and agents, with research into which agents and comps work together, Hush included. Any input can be an output (map, rank, side and sites, party with must-play agents and role rules). The owner then decided, on the plan: the name Playbook; all rights reserved; plays for all 13 maps; the game's own agent portraits and art; and to start at once with Hush's numbers as placeholders that are easy to change. Live match data was looked into: a file opened from disk can't fetch it, so the numbers are built in and refreshed with each version.

- **Built:** the knowledge base (every agent's strengths and numbers, every map's needs and sites, pro picks and comps, pairs, plays for all 13 maps, tips), the engine (every team scored for the situation, fits and tiers, duos and trios over likely random teammates, reasons read off the score), and the screens: Home, the Planner, Rankings, Agents, Maps, Saved plans and parties, Settings, Themes and Help. Then rounds of testing and improvement against pro play, ranked play and common sense, until two rounds in a row found nothing significant.
