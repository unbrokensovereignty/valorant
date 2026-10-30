/**
 * Every number the engine weighs teams by, in one place. Tuning the engine means changing these
 * (and running `npm run check`, whose scenario tests say if the answers still make sense).
 */
import type { Dim, Role } from '../kb/roles.ts';
import type { Side } from '../kb/maps.ts';
import type { RankId } from '../kb/ranks.ts';

/** How much each strength matters on a side before the map, site and rank change it. */
export const BASE: Record<Side, Record<Dim, number>> = {
  attack: {
    smoke: 1, wall: 0.2, flash: 0.7, recon: 0.75, entry: 0.85, clear: 0.6, disrupt: 0.55, stall: 0.1,
    anchor: 0.05, flank: 0.35, retake: 0.05, postplant: 0.6, sustain: 0.25, duel: 0.7, angles: 0.2, mobility: 0.3,
  },
  defense: {
    smoke: 0.7, wall: 0.15, flash: 0.45, recon: 0.7, entry: 0.2, clear: 0.3, disrupt: 0.45, stall: 0.8,
    anchor: 0.8, flank: 0.55, retake: 0.7, postplant: 0.05, sustain: 0.35, duel: 0.7, angles: 0.45, mobility: 0.3,
  },
};

/**
 * How much each strength counts at Iron (first) and at Radiant (second), as a factor; ranks in
 * between are in proportion. Low ranks win on aim and simple, selfish utility; high ranks get the
 * most out of coordinated utility such as lineups and walls.
 */
export const BY_RANK: Record<Dim, readonly [number, number]> = {
  smoke: [0.85, 1.1], wall: [0.75, 1.15], flash: [0.8, 1.05], recon: [0.7, 1.1], entry: [1, 1], clear: [0.9, 1],
  disrupt: [0.8, 1.1], stall: [0.8, 1.05], anchor: [1.05, 0.95], flank: [1, 0.9], retake: [0.8, 1.05],
  postplant: [0.6, 1.15], sustain: [1.2, 0.8], duel: [1.5, 1], angles: [1, 1], mobility: [0.9, 1.05],
};

/**
 * How much of an agent's kit a team gets out of it, by rank. At Iron, each point of `skill` (how
 * hard the agent is to play well) costs `skill` of the kit, and each point the agent depends on
 * the team (1 − `solo`) costs `team`; both fade to nothing at Radiant. Strengths that come only
 * from gun play (the G key in kb/agents.ts) count in full at every rank, and those that come
 * partly from it, halfway between.
 */
export const EXEC = { skill: 0.4, team: 0.3 };

/**
 * Agent fit beyond the team's strengths. `pro`: the pull toward what pros play on the map, at
 * Radiant (see PRO_RISE for lower ranks). `solo` and `skill`: at Iron, the reward for agents who
 * work alone and the cost of hard agents (both fade to nothing at Radiant; EXEC does most of the
 * work for hard agents). `win`: the reward per point of ranked win rate above 50% (and the cost
 * per point below), where win rates count fully (WIN_RANKS).
 */
export const FIT = { pro: 0.07, solo: 0.06, skill: 0.01, win: 0.004 };

/**
 * How the pull toward pro play grows with rank: `low` of the full pull at Iron, rising with the
 * rank's place on the way up to `until` (kb/ranks.ts) to the power `power`, so it stays small through
 * the middle ranks, grows fast from Diamond up and is full from `until`. The same goes for each map's
 * pro role mix. `until` is where a second controller stops costing (SECOND_CONTROLLER), so the pros'
 * role mix and their second controller come in together: when they came in at different ranks, the
 * best comps at Immortal took the pros' two controllers but kept the sentinel they play without,
 * a team neither ranked players nor pros play, and ratings jumped there and back.
 */
export const PRO_RISE: { low: number; power: number; until: RankId } = { low: 0.1, power: 2, until: 'immortal' };

/**
 * Ranked games are played with and against players of the ranks next to yours, so each rank's
 * answers take in this share of each neighboring rank's (Iron and Radiant, with one neighbor, keep
 * the rest for themselves). It also keeps a rating from jumping between two ranks and back.
 */
export const RANK_NEAR = 0.25;

/**
 * Pro numbers from fewer than this many maps of play pull less, in proportion, but never under
 * half; numbers from an earlier year's play pull `dated` of the full amount.
 */
export const PRO_GAMES = { full: 10, least: 0.5, dated: 0.7 };

/**
 * Each map's role mix in pro play (how many of each role a pro team runs there, from kb/pro.ts):
 * at Radiant, a team gives up this much per role, times the square of how far it is from that mix.
 * Being one agent off costs the full amount, half an agent off a quarter of it.
 */
export const ROLE_MIX = 0.08;

/**
 * Ranked win rates are taken across all ranks, so they mostly come from games between Silver and
 * Diamond. They count fully from `from` to `to` (a rank's place from 0 at Iron to 1 at Radiant)
 * and fade in a straight line to `iron` of that at Iron and to `radiant` at Radiant.
 */
export const WIN_RANKS = { iron: 0.5, from: 0.25, to: 0.625, radiant: 0.2 };

/**
 * Ranked win rates on each map (kb/mapwins.ts). An agent's rate on a map, moved so the map's average
 * game is won 50%, counts as far as it differs from their rate across all the maps, and only for the
 * share games / (games + `games`) of that difference: with fewer games than that, most of it is
 * chance. (Across the maps, the differences beyond chance come to about a third of a point for the
 * agents with thousands of games, so it takes this many to trust half of one.)
 */
export const MAP_WIN = { games: 15000 };

/** A win rate also says who plays the agent, so only this many points either side of 50% count. */
export const WIN_CAP = 3;

/**
 * An agent's first weeks are played by people still learning them, which drags the win rate down:
 * within NEW_DAYS of release (kb/agents.ts), only this share of the gap from 50% counts.
 */
export const NEW_WIN_SHARE = 0.5;

/** How much an agent's win rate has to add to (or take from) its fit before a comp's pros (or cons) say so. */
export const WIN_NOTE = { more: 0.005, fewer: 0.006 };

/**
 * When a comp's role count is this far from the map's pro mix, and costs at least `cost`, its cons
 * say so (so only from the middle ranks up, where the pro mix starts to count). When at least
 * `relax` of the cost of having none of a role is forgiven (pro teams on the map mostly play
 * without it), the con for the missing role says that pro teams play that way too.
 */
export const MIX_NOTE = { off: 0.7, cost: 0.03, relax: 0.3 };

/**
 * A comp's cons say an agent takes practice to play well when a team at Iron would get less than
 * `hard` of the kit (engine/model.ts, kitShare): the agents notably harder than most, not every
 * agent who isn't the easiest. They say so at ranks up to `upTo` on the climb from Iron (0) to
 * Radiant (1), with the share a team at that rank gets.
 */
export const KIT_NOTE = { hard: 0.6, upTo: 0.5 };

/**
 * How much a kit rule (kb/kitfit.ts) has to add to (or take from) a team's score on its own before
 * a comp's pros (or cons) give its reason, and how many such reasons each list gets at most.
 */
export const KIT_RULE_NOTE = { gain: 0.006, most: 2 };

/**
 * How a comp wins, in a line (explain.ts): the strengths it plays through are those the situation
 * needs at least `need` (1 = an average share) and the comp covers at least `cover`, each named by
 * the ability of an agent who brings at least `brings` of it, at most `most` before the plant or
 * retake and one after.
 */
export const PLAN_NOTE = { need: 0.8, cover: 0.6, brings: 0.45, most: 3 };

/**
 * Why one comp ranks below another (explain.ts): a part of the score counts as a reason when it
 * moves the score at least `part`, and at most `most` of what it gives up and `gains` of what it
 * gains are said.
 */
export const BELOW_NOTE = { part: 0.004, most: 3, gains: 2 };

/**
 * Map pick help (mappick.ts): up to `most` maps to play and `most` to ban, each with up to `why`
 * reasons. A map is worth banning only when its fit is at least `gap` points below the best map's
 * (and worth playing only when it's that far above the worst); maps all within `gap` of each other
 * fit about the same.
 */
export const MAP_PICK = { most: 2, why: 2, gap: 3 };

/**
 * How a comp's answers to the other team are told (kb/counters.ts, explain.ts): threats that go at
 * least `level` of the way are listed; a comp covering at least `answered` of what answers one has
 * the answer, below `little` it has little of it; and it names up to `by` agents who bring at least
 * `brings` of a strength that answers it.
 */
export const THREAT_NOTE = { level: 0.3, answered: 0.75, little: 0.5, by: 2, brings: 0.45 };

/** Points per step of a pair's strength (−3 to 3, see kb/synergy.ts). */
export const PAIR_STEP = 0.006;

/**
 * Role counts. Each role's entry lists the cost of having 0, 1, 2, 3 and 4 or more of it, on
 * attack and on defense. Strengths already reward a balanced team; these add the hard rules
 * every team needs, such as having a controller.
 */
export const ROLE_COST: Record<Role, Record<Side, readonly [number, number, number, number, number]>> = {
  controller: { attack: [-0.3, 0, 0, -0.15, -0.4], defense: [-0.25, 0, 0, -0.15, -0.4] },
  duelist: { attack: [-0.05, 0, 0, -0.08, -0.3], defense: [-0.015, 0, -0.01, -0.1, -0.3] },
  initiator: { attack: [-0.05, 0, 0, -0.06, -0.25], defense: [-0.04, 0, 0, -0.06, -0.25] },
  sentinel: { attack: [-0.015, 0, -0.01, -0.12, -0.3], defense: [-0.07, 0, -0.01, -0.1, -0.3] },
};

/**
 * A second controller pays off only for a team that plays its smokes together, the way pro teams
 * layer smokes and walls for a hit. How far teams do grows with the square of the way up to `until`
 * (a third of the way at Platinum, about half at Diamond, all of it from `until` up), so a team gives
 * up `cost` for a second controller at Iron, less at each rank up, and nothing from `until` up. Two
 * controllers' pair (synergy.ts) is that same teamwork, so it counts as far as teams play together,
 * and so does the second controller in a map's pro role mix (ROLE_MIX). From `note` up, the comp's
 * cons say so.
 */
export const SECOND_CONTROLLER: { cost: number; until: RankId; note: number } = { cost: 0.06, until: 'immortal', note: 0.02 };

/**
 * Random teammates, for a duo or trio. They pick roughly as often as players at your rank do,
 * and they usually fill a role the team is missing: a fill that leaves the team without one of
 * these roles is that much less likely.
 */
export const FILL_MISSING: Record<Role, number> = { controller: 0.35, initiator: 0.8, sentinel: 0.8, duelist: 0.9 };
/** A fill that makes three or more duelists is this much less likely. */
export const FILL_TOO_MANY_DUELISTS = 0.7;

/** Fit on screen: the best team for the situation is 100 and the middle of all possible teams is 50. */
export const FIT_MID = 50;

/**
 * Agent fits come from the best team each agent fits into. Those sit close together (the other
 * four make up for a lot), so the gap below the best team counts this many times over.
 */
export const AGENT_STRETCH = 5;

/**
 * How sure a fit is (sure.ts). An agent who came out after the year's top events could have been
 * picked by pros anywhere from never to about a third of maps, which moves their pull by up to `pro`
 * either way (proCurve in model.ts); each kit rule of an agent with early numbers could be off by
 * `kit` of what it adds. A fit that could be off by `less` points or more is less sure, and the
 * reasons named are those that make up at least `part` of that.
 */
export const SURE = { pro: 0.3, kit: 0.5, less: 8, part: 0.25 };

/** Tiers by fit. */
export const TIERS: readonly { id: string; min: number }[] = [
  { id: 'S', min: 95 }, { id: 'A', min: 88 }, { id: 'B', min: 78 }, { id: 'C', min: 65 }, { id: 'D', min: 0 },
];
/** A fit's tier, going by the whole number shown, so two comps that both show 95 share a tier. */
export const tierOf = (fit: number): string => TIERS.find((t) => Math.round(fit) >= t.min)!.id;
