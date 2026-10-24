/**
 * Agents too new for their numbers to be known, kept apart so they're easy to update.
 *
 * Hush was revealed as a Duelist arriving on 27 October 2026. Only the kit the game's makers showed
 * is used: Telekinesis (passive: picks up weapons and the Spike, and uses switches, from farther
 * away), Displacement (a thrown blast that pulls players to its center and concusses anyone who hits
 * a surface or another player), Flashbulb (a flash), Flow (an anchor she pulls herself toward) and
 * Suspension (ultimate: lifts the players caught in it into the air).
 *
 * To update her once the patch notes and a few weeks of play are in:
 * 1. Change the numbers below (what each one means is explained at the top of agents.ts), and
 *    take out `estimate: true` once they're based on real play.
 * 2. Put her ability names and text in content.gen.ts by running `npm run art` on a fresh
 *    download (see CONTRIBUTING.md), which also adds her portrait and ability icons.
 * 3. Add her pairs to synergy.ts and her map picks to pro.ts if they've become clear.
 * 4. Run `npm run check`: the tests say if anything doesn't fit.
 */
import type { AgentDef } from './agents.ts';
import type { Kit } from './content.gen.ts';

export const NEW_AGENTS: readonly AgentDef[] = [
  {
    id: 'hush', name: 'Hush', role: 'duelist', released: '2026-10-27', solo: 0.65, skill: 0.65, pop: 6, pro: 0,
    // early estimates from the revealed kit: an entry who pulls enemies together and flashes them
    caps: 'entry .6 E; mobility .6 E; flash .5 Q; disrupt .6 C; clear .35 C; retake .4 X; postplant .2 C; duel .6 G',
    line: 'Pulls enemies together with Displacement, flashes them, and lifts them helpless with her ultimate.',
    estimate: true,
  },
];

/**
 * Hush's abilities as revealed, until a fresh download puts the game's own text in content.gen.ts
 * (which then takes over). The keys follow the usual order of a reveal and may change.
 */
export const NEW_KITS: Record<string, Kit> = {
  hush: {
    about: 'A new Duelist who moves enemies, and herself, with telekinesis. Her numbers are early estimates until she has been played for a while.',
    colors: ['#3a2f5c', '#0f1923', '#5c4a8f'],
    abilities: [
      { key: 'C', slot: 'grenade', name: 'Displacement', text: 'Throw a blast that pulls players to its center. Anyone pulled into a surface or another player is Concussed.' },
      { key: 'Q', slot: 'ability1', name: 'Flashbulb', text: 'A flash that Blinds players looking at it.' },
      { key: 'E', slot: 'ability2', name: 'Flow', text: 'Place an anchor and pull yourself toward it to move quickly.' },
      { key: 'X', slot: 'ultimate', name: 'Suspension', text: 'Lift the players caught in its area into the air.' },
      { key: 'Passive', slot: 'passive', name: 'Telekinesis', text: 'Pick up weapons and the Spike, and use switches, from farther away.' },
    ],
  },
};
