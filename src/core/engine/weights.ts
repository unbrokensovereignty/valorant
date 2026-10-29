/**
 * Every number the engine weighs teams by, in one place. Tuning the engine means changing these
 * (and running `npm run check`, whose scenario tests say if the answers still make sense).
 */
import type { Dim, Role } from '../kb/roles.ts';
import type { Side } from '../kb/maps.ts';

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
  smoke: [0.85, 1.1], wall: [0.6, 1.15], flash: [0.8, 1.05], recon: [0.7, 1.1], entry: [1, 1], clear: [0.9, 1],
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
 * rank's place (0 Iron to 1 Radiant, kb/ranks.ts) to the power `power`, so it stays small through
 * the middle ranks and grows fast from Diamond up. The same goes for each map's pro role mix.
 */
export const PRO_RISE = { low: 0.1, power: 2 };

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

/** Tiers by fit. */
export const TIERS: readonly { id: string; min: number }[] = [
  { id: 'S', min: 95 }, { id: 'A', min: 88 }, { id: 'B', min: 78 }, { id: 'C', min: 65 }, { id: 'D', min: 0 },
];
/** A fit's tier, going by the whole number shown, so two comps that both show 95 share a tier. */
export const tierOf = (fit: number): string => TIERS.find((t) => Math.round(fit) >= t.min)!.id;
