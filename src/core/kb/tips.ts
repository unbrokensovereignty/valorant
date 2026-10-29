/**
 * Tips: short, plain advice for an agent, a map's side, a rank, a party and a team's role counts.
 * The planner picks the ones that fit a situation (engine/tips.ts). Each tip is one or two
 * sentences that end in a full stop; callouts are the game's own (see maps.ts).
 */
import type { Side } from './maps.ts';
import type { Role } from './roles.ts';

/** Two tips per agent, about playing them with a team. */
export const AGENT_TIPS: Record<string, readonly [string, string]> = {
  jett: ['Dash in right after a flash or smoke lands; a Jett who enters alone just gives away the site.', 'With the Operator, take one shot and dash out instead of holding the same angle twice.'],
  phoenix: ['Throw Curveball around a corner and swing as it pops; it is your own flash, so you time it.', 'Run it Back makes the first fight on site free: take it to find where the defenders are.'],
  raze: ['Throw Paint Shells and Boom Bot into the close corners before the team walks past them.', 'Blast Pack onto site only once its close angles are cleared or flashed.'],
  reyna: ['Reyna brings almost no utility, so the other four have to cover information and flashes.', 'Take the first fight behind Leer, then Dismiss out or Devour to stay in the round.'],
  yoru: ['Gatecrash behind the defenders during a fake to pull their rotations the wrong way.', 'Fakeout and Blindside work best when the team hits right behind them.'],
  neon: ['Fast Lane lets the team cross wide lanes; run in right behind the walls.', 'Neon’s speed wins fast hits: commit before the defenders can rotate.'],
  iso: ['Double Tap’s shield wins the first duel; take fights where only one enemy can see you.', 'Contingency only covers a short crossing; the team still needs smokes.'],
  waylay: ['Lightspeed in, and Refract back to safety if the fight goes wrong.', 'Saturate slows a group on site; pair it with a flash for the entry.'],
  hush: ['Steer Displacement next to a wall, a box or a teammate: it only concusses enemies who hit something, so it does little in the open.', 'Let the main entry go first and set them up with Flashbulb and Displacement; Flow is too slow to dash in alone.'],
  sova: ['Use Recon Bolt before the hit, not during it, so the team knows where to go.', 'Save Shock Bolt and Hunter’s Fury for after the plant to stop the defuse.'],
  breach: ['Call your Flashpoint before throwing it so the entry swings as it pops.', 'Fault Line and Aftershock clear close spots so the entry doesn’t have to fight them.'],
  skye: ['Guiding Light tells you if it hit; call it so the entry knows when to swing.', 'Trailblazer clears a corner on its own; send it before anyone peeks.'],
  kayo: ['Throw ZERO/point before the hit: it shows who is there and shuts off their utility.', 'NULL/cmd makes a hit or a retake much safer; use it when the whole team commits.'],
  fade: ['Follow your Prowler in: it finds and blinds the enemy in the corner for you.', 'After the plant, throw Seize onto the Spike: anyone who goes to defuse is held there, deafened and weakened.'],
  gekko: ['Pick Wingman and Dizzy back up after they land; you get them again for free.', 'Let Wingman plant or defuse while you hold the angle that matters.'],
  tejo: ['Send the Stealth Drone ahead and push while the enemies are suppressed.', 'Guided Salvo and Armageddon stop a defuse from far away; save them for after the plant.'],
  brimstone: ['Place Sky Smokes before the hit so the whole team crosses at once.', 'Keep Incendiary and Orbital Strike for the post-plant.'],
  viper: ['Toxic Screen cuts a whole site in two; set it up before the team crosses.', 'Viper’s Pit lets two or three players hold a site or a plant against many.'],
  omen: ['Dark Cover can be placed from almost anywhere; smoke from safety.', 'Shrouded Step and From the Shadows are good for lurks, but don’t leave the hit without smokes.'],
  astra: ['Place stars in the buy phase and use them when the team needs them.', 'Cosmic Divide cuts the map in two for a hit or a retake.'],
  harbor: ['High Tide cuts long sightlines; walk the team behind it.', 'Shield Cove for a plant or defuse that bullets can’t reach.'],
  clove: ['Clove can still smoke after dying, so you can take early fights.', 'Pick-me-up after a kill gives speed and health to take the next fight quickly.'],
  miks: ['Toggle M-pulse to heal the team after a fight, or to concuss a corner before one.', 'Harmonize an entry player so you both push faster with a combat stim.'],
  sage: ['Barrier Orb blocks a choke for a long time: wall a rush, or a fast rotation.', 'Save Resurrection for the teammate who matters most to the round.'],
  cypher: ['Trapwire the flank and a site entrance, and check Spycam before the hit comes.', 'Neural Theft on a kill shows where the whole enemy team is.'],
  killjoy: ['Nanoswarm, Alarmbot and Turret stop working when you go too far away; stay near them.', 'Lockdown wins a retake or stops a hit; use it as the team commits.'],
  chamber: ['Take one shot and Rendezvous out before the enemy can trade.', 'Trademark watches the flank so you can hold the site.'],
  deadlock: ['GravNet stops a rush in place; follow it with a molly or a spray.', 'Barrier Mesh blocks a choke and buys time for the rotation.'],
  vyse: ['Razorvine and Shear stop a rush; Arc Rose blinds through walls for the retake.', 'Steel Garden jams primary weapons in an area: use it to retake or to stop a hit.'],
  veto: ['Interceptor destroys thrown utility; place it where the enemy throws theirs.', 'Chokehold holds a push in place; Crosscut lets you get back to the fight fast.'],
};

/**
 * The tip a comp shows for an agent on defense, for the agents whose first tip above is about
 * attacking: their second tip when it fits defense, or one of its own (shown on their page too).
 */
export const DEFENSE_TIPS: Record<string, string> = {
  jett: 'With the Operator, take one shot and dash out instead of holding the same angle twice.',
  raze: 'Boom Bot and Paint Shells punish a push through a choke; throw them at the first sound of a rush.',
  yoru: 'Place Gatecrash early on defense, so you can rotate or come in behind the push the moment the hit comes.',
  neon: 'Relay Bolt concusses a group coming through a choke; peek as it goes off.',
  sova: 'A Recon Bolt early in the round finds a fast push; keep the drone for the retake.',
  kayo: 'Throw ZERO/point onto a choke as the push comes so the attackers can’t use their utility, and save NULL/cmd for the retake.',
  fade: 'Hold Seize until the attackers commit and use it to stop the entry, then throw Haunt over the site to start the retake.',
  tejo: 'Guided Salvo stops a push at a choke from safety; fire it as the enemies commit.',
  brimstone: 'Smoke the choke the enemies push through, and save Orbital Strike to drive the attackers off the Spike on the retake.',
  viper: 'Put Toxic Screen across the choke the attackers come through, and save Viper’s Pit to take the site back on a retake.',
  harbor: 'Storm Surge and High Tide slow a push through a choke; keep Cove to shield the defuse on the retake.',
};

/** The tip a comp shows for an agent on attack, for the sentinels whose first tip above is about defending (shown on their page too). */
export const ATTACK_TIPS: Record<string, string> = {
  sage: 'Put Barrier Orb across an angle the defenders hold, so the team can cross or plant behind it.',
  cypher: 'Trapwire the flank behind the team, and watch the Spike with Spycam after the plant.',
  deadlock: 'After the plant, put Barrier Mesh across a way into the site, so the retake has to break it or go around.',
  vyse: 'After the plant, put Razorvine on the Spike and Shear across a way in, so the retake comes in slow and split up.',
};

/** Two tips for each map and side. */
export const MAP_TIPS: Record<string, Record<Side, readonly [string, string]>> = {
  abyss: {
    attack: ['Win Mid Bend and Mid Catwalk, then split either site from two directions.', 'There are no walls at the edges: a stun or a careless dash near them is a free kill.'],
    defense: ['A Tower and B Tower watch most of each site; hold them with information and fall back when utility comes.', 'Stay away from the edges in fights; anyone knocked off dies.'],
  },
  ascent: {
    attack: ['Win mid first: Mid Catwalk opens A through A Tree, and Mid Market opens B.', 'Defenders can shut the doors on each site; listen for them and plan the other way in.'],
    defense: ['An Operator on mid or A Main wins rounds; play it with information.', 'Holding Mid Market stops B splits and keeps your rotations short.'],
  },
  bind: {
    attack: ['There is no mid: use the teleporters to fake one site and hit the other.', 'A Bath (Showers) and B Window (Hookah) are the fights that open each site.'],
    defense: ['Listen for the teleporter: its sound means a rotation or a fake.', 'Bind’s ways in are narrow, so one molly or trap slows a whole push.'],
  },
  breeze: {
    attack: ['Cross open ground only behind a wall or smokes; Breeze’s long angles punish dry peeks.', 'Take mid through Mid Top or Mid Hall to split A or reach B Tunnel.'],
    defense: ['An Operator is worth a lot here: the sightlines are the longest in the game.', 'Mid Wood Doors and B Tunnel are the fast rotations; keep an eye on both.'],
  },
  corrode: {
    attack: ['Clear the close corners (A Yard, A Pocket, A Elbow) with utility before planting.', 'Take one lane of mid to split a site through A Link or B Link.'],
    defense: ['Slow the hit early in the lobbies, then wait for help instead of fighting alone.', 'Long walls and smokes cut the lobbies off; a sentinel can hold the other site.'],
  },
  fracture: {
    attack: ['You can reach each site from both ends; split so the defenders face two ways.', 'Time both groups together: the far side arrives later than you think.'],
    defense: ['Watch both ends of the site: a trip or alarm on the far side saves rounds.', 'Defenders spawn in the middle, close to both sites, so retakes are strong here.'],
  },
  haven: {
    attack: ['Three sites stretch the defense thin; find information early and hit the weakest.', 'C Garage and mid lead to more than one site, so control there sets up splits.'],
    defense: ['With three sites to cover, the floating players must rotate early.', 'Hold C Garage or Mid Window to see which way the attackers are going.'],
  },
  icebox: {
    attack: ['Clear high angles: both sites have tall boxes and ziplines to hold from above.', 'A long wall splits a site in two; take one half at a time.'],
    defense: ['Don’t hold a lost site alone: stall the hit and retake together.', 'B Kitchen and mid let you see a B hit early; hold them with information.'],
  },
  lotus: {
    attack: ['The rotating doors are loud; use the noise to fake a site.', 'Hit fast: three close sites let defenders rotate quickly once they hear you.'],
    defense: ['Use the rotating doors to rotate between sites quickly.', 'One player per site plus two floaters covers all three sites best.'],
  },
  pearl: {
    attack: ['Mid control (Mid Plaza, Mid Doors) opens splits to both sites.', 'B Main is very long; cross it behind smokes or a wall.'],
    defense: ['B Main and A Main are long sightlines where an Operator or a long wall pays off.', 'Mid gives fast rotations; hold it with a smoke ready for either site.'],
  },
  split: {
    attack: ['Ropes let defenders hold high ground: smoke A Rafters (Heaven) and B Tower first.', 'Take mid (Mid Vent, Mid Mail) to pinch either site.'],
    defense: ['Narrow ways in favor defenders: slow the hit with utility and trade from close angles.', 'Hold mid with a smoke ready; the ropes let you rotate quickly.'],
  },
  summit: {
    attack: ['Mid Fountain and Mid Tiles link to both sites; fast entries do well from there.', 'Both sites have lots of cover, so clear them with utility instead of peeking each spot.'],
    defense: ['Hold close angles on site and stall until the rotation arrives.', 'Mid Window watches mid; information there tells you which site is coming.'],
  },
  sunset: {
    attack: ['Mid connects to both sites; win Mid Courtyard before committing.', 'B Market is a close fight: clear it with utility, not your face.'],
    defense: ['A Elbow and B Market are close-range fights where close angles pay off.', 'Hold mid with information so a split doesn’t catch you out.'],
  },
};

/** Tips by rank: low (Iron to Silver), middle (Gold to Diamond) and high (Ascendant and up). */
export const RANK_TIPS: Record<'low' | 'middle' | 'high', readonly string[]> = {
  low: [
    'Pick agents you can aim with: at these ranks, winning your own fights matters more than complex utility.',
    'Teammates rarely follow a plan, so agents who work on their own are safer picks.',
    'Simple utility wins rounds: one smoke in the right place and a flash before a fight go a long way.',
  ],
  middle: [
    'Play close enough to a teammate that you can trade their death straight away.',
    'Use utility before the fight, not after it.',
    'A short plan said at the start of the round beats five players doing their own thing.',
  ],
  high: [
    'Team utility decides rounds: initiators and controllers do more than raw aim.',
    'Enemies play around your setups, so change them from round to round.',
    'Save some utility for the retake or the post-plant instead of spending it all on the entry.',
  ],
};

export const rankBand = (t: number): 'low' | 'middle' | 'high' => (t < 0.3 ? 'low' : t < 0.7 ? 'middle' : 'high');

/** Tips for a duo or a trio, whose other players are random: how to play, and what to ask the others for (while some haven't locked in). */
export const PARTY_TIPS: Record<2 | 3, { play: string; ask: string }> = {
  2: {
    play: 'Pick two agents that work together, like a flash and an entry; the other three are random.',
    ask: 'Ask your random teammates for the roles the planner suggests before they lock in.',
  },
  3: {
    play: 'Play your three together and let the random teammates take the other site or lane.',
    ask: 'Three of you can cover most of a comp; ask the other two for the roles that are missing.',
  },
};

/**
 * Tips for a team with two of a role (what doubling up asks of the team), shown under "Two duelists"
 * and so on: one for each side, and one for a question about both.
 */
export const DOUBLE_TIPS: Record<Role, Record<Side | 'both', string>> = {
  duelist: {
    attack: 'Go in one right after the other, so the second can trade the first.',
    defense: 'Split them up: one takes early fights for information, and the other stays back to trade or retake.',
    both: 'On attack, go in one right after the other so the second can trade the first; on defense, one takes early fights and the other stays back.',
  },
  initiator: {
    attack: 'One finds the enemies and the other flashes them; don’t spend both on the same angle.',
    defense: 'One finds the enemies and the other flashes them; don’t spend both on the same angle.',
    both: 'One finds the enemies and the other flashes them; don’t spend both on the same angle.',
  },
  controller: {
    attack: 'One smokes the hit and the other plays mid or saves smokes for after the plant.',
    defense: 'One slows the hit with smokes, and the other keeps some back for the retake.',
    both: 'One smokes the fight that’s on and the other keeps some back: for after the plant on attack, for the retake on defense.',
  },
  sentinel: {
    attack: 'One watches the flank, and the other locks down the site after the plant.',
    defense: 'One holds each site with a setup, so neither site falls without a fight.',
    both: 'On defense, one holds each site with a setup; on attack, one watches the flank and the other locks down the plant.',
  },
};
