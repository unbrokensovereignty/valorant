/**
 * Pairs of agents that work especially well together, or get in each other's way. Each pair has
 * a strength from -3 (clash) to 3 (a classic combo), the side it matters on, and the reason in
 * plain words (it becomes a pro or a con). Pairs not listed are neutral.
 */
import type { Side } from './maps.ts';

export interface Pair {
  a: string;
  b: string;
  strength: number;
  side: Side | 'both';
  why: string;
}

const P = (a: string, b: string, strength: number, side: Pair['side'], why: string): Pair => ({ a, b, strength, side, why });

export const PAIRS: readonly Pair[] = [
  // set-ups for an entry
  P('breach', 'raze', 3, 'attack', 'Breach’s stuns and flashes go through walls just before Raze blasts in.'),
  P('breach', 'neon', 3, 'attack', 'Neon runs in while defenders are still stunned by Breach’s Fault Line.'),
  P('breach', 'jett', 2, 'attack', 'Breach’s flashes let Jett dash onto site without being traded.'),
  P('breach', 'waylay', 2, 'attack', 'Waylay dashes into enemies stunned by Breach.'),
  P('kayo', 'neon', 2, 'attack', 'KAY/O’s flash and suppression clear the way for Neon’s slide.'),
  P('kayo', 'raze', 2, 'attack', 'Suppressed defenders can’t answer Raze’s entry with utility.'),
  P('kayo', 'jett', 2, 'attack', 'KAY/O’s flashes pop for Jett’s dash, the classic entry pair.'),
  P('skye', 'raze', 2, 'attack', 'Skye’s flashes and dog lead Raze onto site.'),
  P('skye', 'jett', 2, 'attack', 'Skye’s Guiding Light flashes for Jett’s entry.'),
  P('fade', 'raze', 2, 'attack', 'Fade’s Haunt shows where defenders stand, so Raze knows where to throw.'),
  P('fade', 'neon', 2, 'attack', 'Fade’s reveals tell Neon which space is safe to run into.'),
  P('fade', 'waylay', 2, 'attack', 'Fade reveals and tethers; Waylay dashes in on the marked enemies.'),
  P('sova', 'jett', 2, 'attack', 'Sova’s darts find defenders before Jett dashes in.'),
  P('sova', 'neon', 2, 'attack', 'Sova’s information lets Neon pick the open lane.'),
  P('gekko', 'raze', 2, 'attack', 'Wingman’s stun and Dizzy’s flash set Raze up.'),
  P('gekko', 'neon', 1, 'attack', 'Dizzy flashes for Neon’s slide onto site.'),
  P('tejo', 'raze', 2, 'attack', 'Tejo’s Guided Salvo forces defenders out of their spots for Raze to take.'),
  P('tejo', 'neon', 1, 'attack', 'Tejo’s concussive grenade softens a corner for Neon.'),
  P('yoru', 'fade', 1, 'attack', 'Fade’s information tells Yoru where a teleport will catch defenders unaware.'),
  P('hush', 'brimstone', 2, 'both', 'Hush’s Displacement pulls enemies together into Brimstone’s fire and Orbital Strike.'),
  P('hush', 'raze', 2, 'both', 'Hush’s Displacement groups enemies up for Raze’s Paint Shells.'),
  P('hush', 'viper', 1, 'both', 'Hush’s Displacement drags enemies into Viper’s Snake Bite.'),
  P('hush', 'breach', 1, 'attack', 'Displacement and Fault Line chain concussions, leaving defenders helpless.'),
  P('hush', 'astra', 1, 'both', 'Gravity Well and Displacement pull twice, so enemies crash into each other and are concussed.'),
  P('hush', 'sova', 1, 'both', 'Sova’s darts show where to steer Displacement, and enemies lifted by Suspension are easy Shock Bolt targets.'),
  P('hush', 'neon', 1, 'attack', 'Neon goes in first and Hush’s flash and pull back her up, the second-duelist job Hush suits best.'),
  // post-plant and lineups
  P('viper', 'brimstone', 2, 'attack', 'Two sets of mollies make defusing nearly impossible, the classic Bind pair.'),
  P('viper', 'sova', 2, 'attack', 'Shock Bolts and Snake Bites stop the defuse from a distance.'),
  P('brimstone', 'sova', 2, 'attack', 'Sova’s Shock Bolts and Brimstone’s mollies stop defuses without peeking.'),
  P('viper', 'killjoy', 2, 'both', 'A Viper wall plus Killjoy’s Nanoswarms lock a site down, before or after the plant.'),
  P('tejo', 'viper', 1, 'attack', 'Guided Salvo and Snake Bite deny a defuse from two directions.'),
  P('gekko', 'brimstone', 1, 'attack', 'Mosh Pit and Brimstone’s fire overlap on the Spike.'),
  // smokes, walls and executes
  P('omen', 'viper', 2, 'both', 'A wall and dome smokes together cut a site off completely, the standard double controller.'),
  P('brimstone', 'breach', 2, 'attack', 'Brimstone’s Stim Beacon and smokes plus Breach’s stuns make a fast, hard execute.'),
  P('brimstone', 'raze', 1, 'attack', 'Brimstone’s stim and smokes speed up Raze’s entry.'),
  P('harbor', 'sova', 1, 'both', 'Harbor’s walls let Sova reach spots to shoot his darts safely.'),
  P('astra', 'sova', 1, 'both', 'Astra’s pulls and stuns hit enemies Sova has found.'),
  P('astra', 'raze', 1, 'attack', 'Gravity Well pulls defenders into Raze’s grenade.'),
  P('harbor', 'astra', 1, 'both', 'A long wall and smokes anywhere on the map, the usual pairing on open maps.'),
  P('omen', 'yoru', 1, 'attack', 'Both teleport to flank or fake, so defenders can’t tell where the hit is.'),
  P('omen', 'chamber', 1, 'defense', 'Omen’s smokes let Chamber reposition between Operator shots.'),
  P('miks', 'neon', 1, 'attack', 'Harmonize stims Neon, and refreshes on every kill she gets.'),
  P('miks', 'raze', 1, 'attack', 'Harmonize stims Raze for a faster, steadier entry.'),
  // site holds and retakes
  P('cypher', 'viper', 1, 'defense', 'Cypher’s trips watch the flank while Viper’s wall slows the site.'),
  P('sage', 'reyna', 1, 'both', 'Sage keeps Reyna alive long enough to snowball.'),
  P('sage', 'chamber', 1, 'defense', 'Sage’s wall and slows back up an Operator hold.'),
  P('kayo', 'killjoy', 1, 'defense', 'KAY/O’s ultimate and Killjoy’s Lockdown take a site back together.'),
  P('breach', 'killjoy', 1, 'defense', 'Rolling Thunder plus Lockdown is a near-certain retake.'),
  P('fade', 'chamber', 1, 'defense', 'Fade’s reveals give Chamber’s Operator a target.'),
  P('vyse', 'viper', 1, 'defense', 'Vyse’s thorns and Viper’s mollies wreck a slow push.'),
  // clashes
  P('reyna', 'iso', -2, 'both', 'Two selfish duelists: lots of firepower, little help for the team.'),
  P('reyna', 'yoru', -1, 'both', 'Both play for themselves, leaving the team short of set-ups.'),
  P('jett', 'chamber', -1, 'both', 'Two Operator players compete for the same role and the same credits.'),
  P('sage', 'skye', -1, 'both', 'Two healers duplicate each other’s job.'),
  P('cypher', 'killjoy', -1, 'attack', 'Two setup sentinels add little on attack.'),
  P('deadlock', 'vyse', -1, 'attack', 'Two wall-based sentinels add little on attack.'),
];

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const BY_KEY = new Map(PAIRS.map((p) => [key(p.a, p.b), p]));
export const pairOf = (a: string, b: string): Pair | undefined => BY_KEY.get(key(a, b));
