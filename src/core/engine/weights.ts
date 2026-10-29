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
    anchor: 0.05, flank: 0.35, retake: 0.05, postplant: 0.6, sustain: 0.25, duel: 0.7, mobility: 0.3,
  },
  defense: {
    smoke: 0.7, wall: 0.15, flash: 0.45, recon: 0.7, entry: 0.2, clear: 0.3, disrupt: 0.45, stall: 0.8,
    anchor: 0.8, flank: 0.55, retake: 0.7, postplant: 0.05, sustain: 0.35, duel: 0.7, mobility: 0.3,
  },
};

/**
 * How much each strength counts at Iron (first) and at Radiant (second), as a factor; ranks in
 * between are in proportion. Low ranks win on aim and simple, selfish utility; high ranks get the
 * most out of coordinated utility such as lineups and walls.
 */
export const BY_RANK: Record<Dim, readonly [number, number]> = {
  smoke: [0.85, 1.1], wall: [0.6, 1.15], flash: [0.8, 1.05], recon: [0.8, 1.1], entry: [1, 1], clear: [0.9, 1],
  disrupt: [0.8, 1.1], stall: [0.8, 1.05], anchor: [1.05, 0.95], flank: [1, 0.9], retake: [0.8, 1.05],
  postplant: [0.6, 1.15], sustain: [1.2, 0.8], duel: [1.5, 1], mobility: [0.9, 1.05],
};

/**
 * Agent fit beyond the team's strengths. `pro`: the pull toward what pros play on the map, at
 * Radiant (it fades to `proLow` of that at Iron). `solo` and `skill`: at Iron, the reward for
 * agents who work alone and the cost of hard agents (both fade to nothing at Radiant).
 */
export const FIT = { pro: 0.07, proLow: 0.1, solo: 0.06, skill: 0.035 };

/**
 * On maps where pro teams run two controllers (`twoControllers` in kb/maps.ts), what a team with
 * only one gives up at Radiant. Like the pull toward pro picks, it fades to `FIT.proLow` of that at Iron.
 */
export const SECOND_CONTROLLER = 0.03;

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
