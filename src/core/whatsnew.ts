/**
 * What each version brought, in a few lines: shown once, the first time that version opens, and
 * any time from Help → About. Every version listed needs a heading in CHANGELOG.md.
 */

export interface NewThing {
  /** An icon name from ui/icons.tsx. */
  icon: string;
  title: string;
  text: string;
  /** Where "Show me" goes ("planner"), if anywhere. */
  page?: string;
}

export interface VersionNotes { version: string; items: readonly NewThing[] }

/** Newest first. */
export const WHATS_NEW: readonly VersionNotes[] = [
  {
    version: '0.3.2',
    items: [
      { icon: 'map', title: 'Every map placed by hand', text: 'Callouts and marks on every map were placed by hand, doors and walls lie the way they do in the game, and every mark is about the same small size. Map pages give the minimap more room.', page: 'maps/lotus' },
      { icon: 'play', title: 'Plays you can follow', text: 'Each player’s face shows where they end up, and you can step through a play one route at a time. Five more maps have a fake.', page: 'planner' },
    ],
  },
  {
    version: '0.3.1',
    items: [
      { icon: 'map', title: 'Maps that match the game', text: 'Every map’s ultimate orbs, ropes, doors, walls, ziplines and teleporters sit where they really are, with Summit’s droppable walls and the silent drops on Lotus and Summit added. Names, dots and marks now zoom with the map, names are smaller, and the map can fill the screen.', page: 'maps/summit' },
    ],
  },
  {
    version: '0.3.0',
    items: [
      { icon: 'map', title: 'A better minimap', text: 'Zoom in, drag it around and choose how big the callout names are, with a dot at the middle of each callout. Every callout was checked against the game’s own labels, and the ultimate orbs, doors, walls, teleporters and ziplines can be shown.', page: 'maps/bind' },
      { icon: 'trophy', title: 'Maps to play and to ban', text: 'A five-stack that asks for its best map sees which maps to play and which to ban, each with why. A five-player party on the Saved page has a button for it.', page: 'saved/parties' },
      { icon: 'target', title: 'Steadier ratings, win rates by map', text: 'Ratings move steadily between neighboring ranks, and ranked win rates count map by map, as far as they’re more than chance. Each map’s page says which side wins more rounds.', page: 'rankings' },
    ],
  },
  {
    version: '0.2.5',
    items: [
      { icon: 'map', title: 'Kits by map and side', text: 'A kit counts for more or less on each map and side, for the reasons a coach would give, like Hush working Lotus’s doors from range. Each map’s page says how it plays.', page: 'maps/lotus' },
      { icon: 'users', title: 'How you play', text: 'Your rank, how you queue and the agents you play shape every plan. Solo works too, and a duo or trio sees the best picks for its random teammates.', page: 'settings/you' },
      { icon: 'shield', title: 'Against their team', text: 'Add the other team’s agents, and the comps that answer them rank higher, each saying how it stands against what they bring.', page: 'planner' },
      { icon: 'columns', title: 'Compare, print and flag', text: 'Set two comps side by side, put a plan on one sheet of paper, and flag an answer that looks wrong.', page: 'planner' },
      { icon: 'move-up', title: 'What moved, and how sure', text: 'Arrows mark the tiers that moved since 0.2.0 and say why, and a fit that rests on very little says it’s less sure.', page: 'rankings' },
    ],
  },
  {
    version: '0.2.0',
    items: [
      { icon: 'target', title: 'Answers that fit your rank', text: 'Hard kits count for less low down, ranked win rates count most in the middle ranks, and what pro teams play counts most near the top.', page: 'planner' },
      { icon: 'trophy', title: 'This year’s pro play', text: 'Pro picks from Champions and Masters Santiago 2026, and how many of each role pros run on each map, like two controllers on Lotus.', page: 'maps/lotus' },
      { icon: 'agents', title: 'Agents by rank', text: 'Each agent’s page shows their tier at every rank, from Iron to Radiant, and a click plans with them there.', page: 'agents/sova' },
      { icon: 'compass', title: 'Guided tours', text: 'Short tours light up one thing at a time on the real screens, from the first steps to every page.', page: 'help/tours' },
    ],
  },
  {
    version: '0.1.5',
    items: [
      { icon: 'agents', title: 'Hush, for real', text: 'Hush is out, so she’s in as a full agent: her abilities in the game’s own words, her portrait and icons, numbers from her first days in ranked, her best partners and tips.', page: 'agents/hush' },
      { icon: 'sparkle', title: 'Ability text you can scan', text: 'Ability names stand out, and what an ability does to enemies or for your side is colored, as in the game.', page: 'agents' },
      { icon: 'grid', title: 'Tidier pages', text: 'The role counts in the Planner line up, dialogs keep their buttons in view, and Settings and Rankings fit better when the window is narrow.' },
    ],
  },
  {
    version: '0.1.0',
    items: [
      { icon: 'planner', title: 'The Planner', text: 'Pick a map, rank, side and sites, add your party and rules, and get the comps that fit best, with pros, cons, tips and plays.', page: 'planner' },
      { icon: 'rankings', title: 'Rankings', text: 'Tier lists of agents and comps for any situation.', page: 'rankings' },
      { icon: 'agents', title: 'Agents and Maps', text: 'Every agent’s kit, strengths and best partners, and every map’s sites, callouts and plays.', page: 'agents' },
      { icon: 'users', title: 'Parties', text: 'Save your usual duo, trio or five-stack with the agents each of you plays, and plan for it in one click.', page: 'saved' },
    ],
  },
];

/** Compares "x.y.z" versions: below 0 when a is older than b, 0 when the same, above 0 when newer. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0), pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/**
 * The notes to show on opening `current` after last seeing the notes of `seen` ('' when none were
 * seen yet): every version newer than `seen` up to `current`, newest first. Having seen none, only
 * the current version's.
 */
export function notesFor(seen: string, current: string): VersionNotes[] {
  if (!seen) return WHATS_NEW.filter((n) => n.version === current);
  return WHATS_NEW.filter((n) => compareVersions(n.version, seen) > 0 && compareVersions(n.version, current) <= 0);
}
