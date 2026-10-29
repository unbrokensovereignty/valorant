/**
 * How a kit plays on a particular map, side or site: the part of an agent's strength that depends
 * on where they are. An agent's strengths in agents.ts are the same everywhere; these raise or
 * lower them where the kit does more or less, for a reason a coach would give.
 *
 * Each rule names the agent, where it applies and the change, written like agent strengths with a
 * sign (`disrupt +.15; clear -.1`), and says why in one sentence. The sentence is what a comp's pros
 * (for a rule that helps) or cons (for one that hurts) say when the rule matters to its score, so
 * it has to stand on its own; `{map}` becomes the map's name. Where a rule applies:
 * - `map`: one map (and `site`, one of its sites);
 * - `mechanic`: every map with that mechanic (Lotus's and Ascent's doors, say; see maps.ts);
 * - `space`: every map, or chosen site, that open or that tight (see maps.ts);
 * - none of these: every map.
 * `side` limits a rule to attack or defense. A strength never goes below 0 or above 1.
 *
 * Sources: the game's own ability text (content.gen.ts) for what each kit can do, and how pro
 * teams use the agents on each map (pro.ts). Every rule is judgment, kept small: a few hundredths
 * to two tenths of a strength. A typo in a rule throws, so a bad edit fails the tests.
 */
import { MAPS, mapById, type Mechanic, type Side, type SiteId, type Space } from './maps.ts';
import { isDim, type Dim } from './roles.ts';

export interface KitRule {
  agent: string;
  map?: string;
  site?: SiteId;
  mechanic?: Mechanic;
  space?: Space;
  side?: Side;
  /** The change, as "dim ±value; …". */
  caps: string;
  why: string;
}

export const KIT_RULES: readonly KitRule[] = [
  // ------------------------------------------------ Hush
  {
    agent: 'hush', mechanic: 'doors', side: 'attack', caps: 'entry +.25; disrupt +.2; postplant +.15; flash +.05',
    why: 'Hush’s Telekinesis works switches from range, so she can turn {map}’s doors to fake a hit, split the defenders or shut a retake path without standing in the doorway.',
  },
  {
    agent: 'hush', mechanic: 'doors', side: 'defense', caps: 'stall +.1; retake +.05',
    why: 'Hush’s Telekinesis works switches from range, so she can work {map}’s doors from cover to slow a push or open a retake path.',
  },
  {
    agent: 'hush', space: 'tight', caps: 'disrupt +.15; clear +.1',
    why: 'Hush’s Displacement concusses anyone it pulls into a wall, and {map}’s tight spaces are full of them.',
  },
  {
    agent: 'hush', space: 'open', caps: 'disrupt -.2; clear -.15',
    why: 'Hush’s Displacement only concusses enemies it pulls into a wall or into each other, and {map} is mostly open ground.',
  },
  {
    agent: 'hush', space: 'open', side: 'attack', caps: 'entry -.1; mobility -.1',
    why: 'Hush’s Flow is a slow, delayed move, which leaves her exposed crossing {map}’s open ground.',
  },
  {
    agent: 'hush', side: 'attack', caps: 'postplant +.05',
    why: 'Hush’s Telekinesis picks up a dropped Spike from range, so the team can save it from a crossfire.',
  },
  // ------------------------------------------------ utility that needs walls and chokes
  {
    agent: 'raze', space: 'open', caps: 'clear -.2; entry -.1',
    why: 'Raze’s Paint Shells and Boom Bot need corners to clear, and {map}’s wide sites give them little to do.',
  },
  {
    agent: 'raze', map: 'split', caps: 'mobility +.15; entry +.1',
    why: 'Raze’s Blast Pack jumps reach Split’s high ground, A Rafters and B Tower, faster than the ropes.',
  },
  {
    agent: 'breach', space: 'tight', caps: 'clear +.1; disrupt +.05; flash +.05',
    why: 'Breach’s stuns and flashes go through walls, which works best on {map}’s narrow ways in.',
  },
  {
    agent: 'breach', space: 'open', caps: 'disrupt -.15; clear -.1',
    why: 'Breach’s Fault Line and Aftershock cover a narrow lane, and {map}’s wide spaces leave room to get out of them.',
  },
  {
    agent: 'phoenix', space: 'open', caps: 'flash -.2; entry -.15; clear -.1',
    why: 'Phoenix’s Curveball and Hot Hands work at close range, and {map}’s long sightlines keep most fights out of their reach.',
  },
  {
    agent: 'phoenix', space: 'tight', caps: 'entry +.05; clear +.05',
    why: 'Phoenix’s Curveball and Hot Hands win {map}’s close-range fights around corners.',
  },
  {
    agent: 'iso', space: 'open', caps: 'entry -.15',
    why: 'Iso’s Contingency covers only a short crossing, too short for {map}’s open ground.',
  },
  {
    agent: 'skye', space: 'tight', caps: 'clear +.1',
    why: 'Skye’s Trailblazer clears {map}’s close corners before anyone has to peek them.',
  },
  {
    agent: 'gekko', space: 'tight', caps: 'clear +.05; postplant +.05',
    why: 'Gekko’s Mosh Pit and Wingman are at their best in {map}’s small plant spots and close corners.',
  },
  {
    agent: 'kayo', space: 'tight', caps: 'clear +.05',
    why: 'KAY/O’s FRAG/ment clears the close corners {map} is full of.',
  },
  {
    agent: 'deadlock', space: 'tight', caps: 'stall +.1; anchor +.05',
    why: 'Deadlock’s Barrier Mesh closes a whole choke on {map}, so one player can stop a rush.',
  },
  {
    agent: 'deadlock', space: 'open', caps: 'stall -.2; anchor -.1',
    why: 'Deadlock’s Barrier Mesh can’t close {map}’s wide ways in.',
  },
  {
    agent: 'sage', space: 'tight', side: 'defense', caps: 'stall +.1',
    why: 'Sage’s Barrier Orb walls off a whole choke on {map} for the first seconds of a push.',
  },
  {
    agent: 'sage', space: 'open', caps: 'stall -.1',
    why: 'Sage’s Barrier Orb can’t wall off {map}’s wide ways in.',
  },
  {
    agent: 'cypher', space: 'open', caps: 'flank -.15; anchor -.15',
    why: 'Cypher’s Trapwires need two walls close together, and {map}’s wide lanes have few.',
  },
  {
    agent: 'cypher', space: 'tight', caps: 'flank +.05; anchor +.05',
    why: 'Cypher’s Trapwires fit {map}’s narrow doorways, where nobody gets past them unseen.',
  },
  {
    agent: 'brimstone', space: 'open', caps: 'smoke -.15; postplant -.1',
    why: 'Brimstone’s Sky Smoke and Incendiary only reach so far from him, and {map}’s sites are wide and far apart.',
  },
  {
    agent: 'vyse', space: 'tight', caps: 'stall +.05; anchor +.05',
    why: 'Vyse’s Shear and Razorvine shut {map}’s narrow chokes on whoever walks in first.',
  },
  {
    agent: 'sova', space: 'tight', caps: 'recon -.1; postplant -.05',
    why: 'Sova’s Recon Bolt sees little in {map}’s small, walled-in spaces, where it’s easy to shoot or hide from.',
  },
  // ------------------------------------------------ map mechanics
  {
    agent: 'yoru', mechanic: 'teleporters', side: 'attack', caps: 'entry +.1; flank +.1',
    why: 'Yoru’s Gatecrash and {map}’s teleporters together make fakes that pull the defenders to the wrong site.',
  },
  {
    agent: 'cypher', mechanic: 'teleporters', caps: 'flank +.1',
    why: 'A Cypher Trapwire on a teleporter exit catches anyone who comes through it on {map}.',
  },
  {
    agent: 'killjoy', mechanic: 'teleporters', caps: 'flank +.1',
    why: 'A Killjoy Alarmbot by a teleporter exit catches anyone who comes through it on {map}.',
  },
  {
    agent: 'deadlock', mechanic: 'teleporters', caps: 'flank +.1',
    why: 'A Deadlock Sonic Sensor by a teleporter exit catches anyone who comes through it on {map}.',
  },
  {
    agent: 'jett', mechanic: 'ropes', caps: 'mobility +.1; angles +.05',
    why: 'Jett’s Updraft takes her to {map}’s high ground without a slow climb up a rope.',
  },
  {
    agent: 'waylay', mechanic: 'ropes', caps: 'mobility +.1',
    why: 'Waylay’s Lightspeed can launch her up to {map}’s high ground without a slow climb up a rope.',
  },
];

/** "entry +.15; disrupt -.1" → changes by strength. Throws on a typo, so a bad edit fails the tests. */
export function parseBumps(spec: string, who: string): Partial<Record<Dim, number>> {
  const out: Partial<Record<Dim, number>> = {};
  for (const part of spec.split(';').map((p) => p.trim()).filter(Boolean)) {
    const [dim, value] = part.split(/\s+/);
    const v = Number(value);
    if (!isDim(dim) || !/^[+-]/.test(value ?? '') || !Number.isFinite(v) || Math.abs(v) > 0.3) throw new Error(`${who}: can't read the change "${part}"`);
    out[dim] = (out[dim] ?? 0) + v;
  }
  return out;
}

export interface ParsedRule extends KitRule { bumps: Partial<Record<Dim, number>> }

export const RULES: readonly ParsedRule[] = KIT_RULES.map((r, i) => {
  const who = `kit rule ${i + 1} (${r.agent})`;
  if (r.map && !mapById(r.map)) throw new Error(`${who}: no map "${r.map}"`);
  if (r.site && !(r.map && mapById(r.map)!.sites.some((s) => s.id === r.site))) throw new Error(`${who}: no site ${r.site} on its map`);
  if (r.mechanic && !MAPS.some((m) => m.mechanics?.some((x) => x.id === r.mechanic))) throw new Error(`${who}: no map has ${r.mechanic}`);
  return { ...r, bumps: parseBumps(r.caps, who) };
});

/** How open a map is where the team plays: the chosen site's own space when there's one chosen and it has one. */
export function spaceOf(mapId: string, sites: readonly SiteId[]): Space | undefined {
  const map = mapById(mapId);
  if (!map) return undefined;
  if (sites.length === 1) return map.sites.find((s) => s.id === sites[0])?.space ?? map.space;
  return map.space;
}

/** Whether a rule applies on a map and side, for the chosen sites (empty for all). */
export function ruleApplies(r: KitRule, mapId: string, side: Side, sites: readonly SiteId[]): boolean {
  if (r.side && r.side !== side) return false;
  if (r.map && r.map !== mapId) return false;
  if (r.site && sites.length && !sites.includes(r.site)) return false;
  if (r.mechanic && !mapById(mapId)?.mechanics?.some((m) => m.id === r.mechanic)) return false;
  if (r.space && spaceOf(mapId, sites) !== r.space) return false;
  return true;
}

/** The rules for an agent on a map and side. */
export const rulesFor = (agent: string, mapId: string, side: Side, sites: readonly SiteId[]): ParsedRule[] =>
  RULES.filter((r) => r.agent === agent && ruleApplies(r, mapId, side, sites));

/** A rule's reason for a map: "{map}" filled in. */
export const ruleWhy = (r: KitRule, mapId: string): string => r.why.replaceAll('{map}', mapById(mapId)?.name ?? 'this map');
