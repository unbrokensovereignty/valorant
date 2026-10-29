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
