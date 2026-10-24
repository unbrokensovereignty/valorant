/**
 * The maps: sites, the current competitive pool, and what each map, side and site needs.
 *
 * Needs are written like agent strengths, as bumps over the usual needs of a side: `wall +.5`
 * means long walls count half again as much here. `both` applies to either side; `attack` and
 * `defense` only to that side; `sites` only when planning for that site. Callouts and their places
 * on the minimap come from the game's own content (content.gen.ts).
 */
import { isDim, type Dim } from './roles.ts';
import { CALLOUTS } from './content.gen.ts';

export type Side = 'attack' | 'defense';
export const SIDES: readonly { id: Side; name: string }[] = [{ id: 'attack', name: 'Attack' }, { id: 'defense', name: 'Defense' }];
export type SiteId = 'A' | 'B' | 'C';

export interface SiteDef {
  id: SiteId;
  /** What the site is like, in a sentence or two. */
  about: string;
  needs: { both?: string; attack?: string; defense?: string };
}

export interface MapDef {
  id: string;
  name: string;
  /** In the current competitive pool. */
  pool: boolean;
  about: string;
  /** What wins on this map, in a sentence. */
  keys: string;
  needs: { both?: string; attack?: string; defense?: string };
  /** Pro teams run two controllers here, so a team with one gives up a little (SECOND_CONTROLLER in engine/weights.ts). */
  twoControllers?: boolean;
  sites: readonly SiteDef[];
  /** Other names players use for a callout: the game's name → what people also call it. */
  aka?: Record<string, string>;
  /** Where a callout really sits on the minimap, for the few the game's content places badly. */
  places?: Record<string, readonly [x: number, y: number]>;
}

/** The game's patch that the numbers (pick rates, the map pool) were taken at. */
export const PATCH = '13.08';
/** The competitive pool since that patch (13 October 2026); it changes next on 6 January 2027. */
export const POOL_SINCE = '2026-10-13';

const DEFS: readonly MapDef[] = [
  {
    id: 'abyss', name: 'Abyss', pool: true, twoControllers: true,
    about: 'An open map with no walls at its edges: fall off and you die. Long sightlines, a contested mid and two wide sites.',
    keys: 'Information and long walls. Pros run Sova with two controllers, often Harbor and Astra.',
    needs: { both: 'wall +.6; smoke +.15; recon +.35; mobility +.1', attack: 'entry +.1', defense: 'anchor +.1; retake +.1' },
    sites: [
      { id: 'A', about: 'A large site reached from A Main and A Lobby, overlooked by A Tower and the bridge, with A Secret and A Security behind it.', needs: { both: 'recon +.15', attack: 'flash +.1' } },
      { id: 'B', about: 'Reached down B Main past B Danger and B Nest; B Tower looks over the site and B Link joins it to mid.', needs: { both: 'wall +.2', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'ascent', name: 'Ascent', pool: false,
    about: 'A classic two-site map won in mid: control Market and Catwalk and both sites open up. Doors on each site can be shut.',
    keys: 'Mid control with information and an Operator; Sova and Killjoy are staples.',
    needs: { both: 'recon +.3; smoke +.1; duel +.15', attack: 'flash +.1', defense: 'anchor +.2; retake +.1' },
    aka: { 'A Tree': 'Tree', 'A Rafters': 'Heaven', 'Mid Bottom': 'Mid', 'Mid Courtyard': 'Mid' },
    sites: [
      { id: 'A', about: 'Entered through A Main (from A Lobby) or from mid through A Garden and Tree; A Rafters (Heaven) and A Wine overlook it.', needs: { both: 'clear +.1', attack: 'smoke +.1' } },
      { id: 'B', about: 'Entered through B Main or from mid through Market; B Boat House sits at the back of a deep site.', needs: { both: 'disrupt +.1', defense: 'stall +.1' } },
    ],
  },
  {
    id: 'bind', name: 'Bind', pool: true, twoControllers: true,
    about: 'No mid, but two one-way teleporters move players between sites fast. Narrow entrances make utility on each choke decisive.',
    keys: 'Clearing tight chokes and stopping defuses: Viper, Brimstone and Raze shine.',
    needs: { both: 'clear +.3; flash +.15; smoke +.15; wall +.4; flank +.25; postplant +.15', defense: 'stall +.2; flank +.1' },
    aka: { 'A Bath': 'Showers', 'A Short': 'A Short', 'B Window': 'Hookah', 'A Tower': 'Heaven' },
    sites: [
      { id: 'A', about: 'Hit through A Short and A Bath (Showers); A Lamps and A Tower (Heaven) look down on it, and the teleporter exits in A Short.', needs: { both: 'clear +.2; flash +.1' } },
      { id: 'B', about: 'Hit down B Long or through B Window (Hookah); B Garden and B Elbow give defenders close angles.', needs: { both: 'wall +.15; smoke +.1', defense: 'stall +.1' } },
    ],
  },
  {
    id: 'breeze', name: 'Breeze', pool: false, twoControllers: true,
    about: 'A huge, open map with very long sightlines and wide sites. Crossing open ground is the whole fight.',
    keys: 'Long walls and an Operator: Viper is close to a must, with Sova for information.',
    needs: { both: 'wall +1; smoke +.15; duel +.3; recon +.25; mobility +.2; flank +.1', defense: 'anchor +.15' },
    aka: { 'A Pyramids': 'Pyramids', 'Mid Nest': 'Nest', 'B Elbow': 'Elbow' },
    places: { 'A Lobby': [0.66, 0.8] },
    sites: [
      { id: 'A', about: 'A big site with the Pyramids in the middle, reached through A Shop or from mid through Mid Hall; A Bridge links it to defender spawn.', needs: { both: 'wall +.2', attack: 'smoke +.1' } },
      { id: 'B', about: 'Reached through B Main and B Window, or from mid through B Tunnel; tighter than A, with B Wall and B Back to clear.', needs: { both: 'clear +.1; smoke +.1' } },
    ],
  },
  {
    id: 'corrode', name: 'Corrode', pool: true, twoControllers: true,
    about: 'A newer two-site map with a three-lane mid. Sites are reached through lobbies with many corners near the plant spots.',
    keys: 'Two controllers with Viper, plus Fade for information; Waylay or Neon to take space.',
    needs: { both: 'wall +.6; smoke +.15; recon +.2', attack: 'entry +.1', defense: 'stall +.15' },
    places: { 'A Main': [0.59, 0.21], 'A Lobby': [0.71, 0.29] },
    sites: [
      { id: 'A', about: 'Reached through A Main or from mid through A Link; A Yard, A Pocket, A Elbow and A Crane give defenders many corners.', needs: { both: 'clear +.15; recon +.1' } },
      { id: 'B', about: 'Reached through B Main or from mid through B Link; B Tower and B Arch overlook the plant.', needs: { both: 'smoke +.1', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'fracture', name: 'Fracture', pool: false,
    about: 'Attackers spawn on both ends and can hit a site from two sides at once; defenders start in the middle.',
    keys: 'Stuns and flank watch: Breach, Brimstone and a sentinel who covers the back.',
    needs: { both: 'flank +.35; disrupt +.25; clear +.15; smoke +.1; mobility +.15', defense: 'stall +.2; retake +.15; recon +.15; flank +.2' },
    sites: [
      { id: 'A', about: 'Hit from A Main and A Door on one end, or from the other side down A Rope; A Dish and A Drop look over it.', needs: { both: 'disrupt +.15' } },
      { id: 'B', about: 'Hit from B Main and B Tree, or through B Arcade from the far side; B Tower and B Canteen hold over it.', needs: { both: 'clear +.15' } },
    ],
  },
  {
    id: 'haven', name: 'Haven', pool: true,
    about: 'Three sites, so defenders spread thin and rotate far. Mid control through Mid Doors and C Garage opens splits.',
    keys: 'Information and speed: Sova and Neon are favorites, and every defender must hold alone at times.',
    needs: { both: 'recon +.3; mobility +.2; duel +.1', attack: 'entry +.1', defense: 'anchor +.2; retake +.15; mobility +.1' },
    aka: { 'A Tower': 'Heaven', 'A Long': 'A Long', 'C Garage': 'Garage' },
    sites: [
      { id: 'A', about: 'Hit through A Long or A Sewer (Short); A Tower (Heaven) and A Link let defenders hold from above and behind.', needs: { both: 'flash +.1; clear +.1' } },
      { id: 'B', about: 'The small middle site, open to Mid Window and Mid Doors; quick to take and quick to retake.', needs: { both: 'disrupt +.1', attack: 'postplant +.1' } },
      { id: 'C', about: 'Hit down C Long or from C Garage; C Cubby, C Window and C Link give defenders angles across the site.', needs: { both: 'smoke +.1; wall +.1', attack: 'postplant +.15' } },
    ],
  },
  {
    id: 'icebox', name: 'Icebox', pool: false,
    about: 'Vertical sites full of boxes and ziplines, with long open lanes into each site.',
    keys: 'Long walls and an Operator, with information to clear the many high spots.',
    needs: { both: 'wall +.8; recon +.25; duel +.2; clear +.15', attack: 'postplant +.2', defense: 'anchor +.15' },
    sites: [
      { id: 'A', about: 'Entered past A Belt and A Nest; A Pipes, A Rafters and A Screen give defenders high and close spots.', needs: { both: 'clear +.2; recon +.1' } },
      { id: 'B', about: 'Entered through B Yellow and B Green; defenders hold from B Snowman, B Back, B Hall and B Kitchen.', needs: { both: 'wall +.2', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'lotus', name: 'Lotus', pool: true, twoControllers: true,
    about: 'Three sites linked by rotating doors, with a breakable wall on A. Tight entrances and many corners on every site.',
    keys: 'Clearing corners and smoking chokes: pros always play Omen, usually with Viper, Fade and Raze.',
    needs: { both: 'clear +.3; recon +.2; smoke +.2; wall +.3; flash +.1; mobility +.15', attack: 'postplant +.1', defense: 'anchor +.1' },
    sites: [
      { id: 'A', about: 'Hit through A Main and A Root or A Rubble; A Hut, A Tree, A Stairs and A Drop give defenders close angles.', needs: { both: 'clear +.15; flash +.1' } },
      { id: 'B', about: 'The small center site, through B Main and B Pillars; B Upper overlooks it.', needs: { both: 'disrupt +.1', attack: 'postplant +.1' } },
      { id: 'C', about: 'Hit through C Main and C Mound; defenders hold from C Hall, C Gravel and C Waterfall.', needs: { both: 'recon +.1; wall +.1' } },
    ],
  },
  {
    id: 'pearl', name: 'Pearl', pool: false, twoControllers: true,
    about: 'A long, layered mid and two sites with long main entrances; no tricks, just space to take and hold.',
    keys: 'Smokes placed anywhere and information: Astra is the pro pick.',
    needs: { both: 'smoke +.2; recon +.25; wall +.2; mobility +.1', defense: 'anchor +.15' },
    aka: { 'B Main': 'B Long' },
    sites: [
      { id: 'A', about: 'Hit through A Main or from A Art and A Link; A Flowers, A Secret and A Dugout give defenders cover.', needs: { both: 'smoke +.1' } },
      { id: 'B', about: 'Hit down the long B Main from B Ramp, with B Screen, B Tower and B Hall to clear.', needs: { both: 'wall +.15; duel +.1' } },
    ],
  },
  {
    id: 'split', name: 'Split', pool: false, twoControllers: true,
    about: 'Tight, vertical sites with ropes up to high ground, and a mid that leads to both. Chokes everywhere.',
    keys: 'Smokes and clearing: Viper and Omen together, with Raze and a stun-heavy initiator.',
    needs: { both: 'clear +.3; smoke +.25; disrupt +.15; flank +.2; wall +.4; recon +.1', defense: 'stall +.15' },
    aka: { 'A Tower': 'A Heaven', 'B Tower': 'B Heaven', 'Mid Vent': 'Vents' },
    sites: [
      { id: 'A', about: 'Hit through A Main and up A Ramps, with A Rafters, A Screens and A Tower (Heaven) above the site.', needs: { both: 'flash +.1' } },
      { id: 'B', about: 'Hit through B Garage or from mid down B Link; B Tower (Heaven), B Rafters and B Alley overlook the site.', needs: { both: 'clear +.15; disrupt +.1' } },
    ],
  },
  {
    id: 'summit', name: 'Summit', pool: true,
    about: 'A newer two-site map with a wide mid around Mid Fountain and Mid Tiles; both sites have lots of cover.',
    keys: 'Fast entry and information: Neon and Fade are the pro picks, with Chamber holding angles.',
    needs: { both: 'entry +.15; recon +.25; duel +.15; wall +.15; mobility +.1', defense: 'stall +.15' },
    places: { 'Attacker Side Spawn': [0.49, 0.92] },
    sites: [
      { id: 'A', about: 'Hit through A Main or from mid through A Link; A Garden, A Art, A Hall and A Cave surround the site.', needs: { both: 'clear +.1', attack: 'flash +.1' } },
      { id: 'B', about: 'Hit through B Main or from mid through B Link; B Tower, B Gym, B Trophy and B Drop overlook the plant.', needs: { both: 'smoke +.1', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'sunset', name: 'Sunset', pool: true,
    about: 'A compact city map with a busy mid; B Market and A Elbow are tight, close-range fights.',
    keys: 'Information and fast entry: Omen, Neon and Fade, with Chamber or Cypher.',
    needs: { both: 'recon +.25; entry +.15; clear +.15; smoke +.1; flank +.1' },
    sites: [
      { id: 'A', about: 'Hit through A Main and A Lobby, or from A Link; A Elbow and A Alley hold close angles.', needs: { both: 'clear +.1' } },
      { id: 'B', about: 'Hit through B Main or from mid through B Market; B Boba overlooks the site.', needs: { both: 'smoke +.1; disrupt +.1' } },
    ],
  },
];

export interface Callout { name: string; x: number; y: number }
export interface MapInfo extends MapDef {
  callouts: readonly Callout[];
  /** Spawn points on the minimap. */
  spawns: Record<Side, Callout | undefined>;
}

/** "wall +.4; smoke +.15" → bumps by strength. Throws on a typo, so a bad edit fails the tests. */
export function parseNeeds(spec: string | undefined, who: string): Partial<Record<Dim, number>> {
  const out: Partial<Record<Dim, number>> = {};
  for (const part of (spec ?? '').split(';').map((p) => p.trim()).filter(Boolean)) {
    const [dim, value] = part.split(/\s+/);
    const v = Number(value);
    if (!isDim(dim) || !Number.isFinite(v) || Math.abs(v) > 1) throw new Error(`${who}: can't read the need "${part}"`);
    out[dim] = (out[dim] ?? 0) + v;
  }
  return out;
}

export const MAPS: readonly MapInfo[] = DEFS.map((m) => {
  const callouts = (CALLOUTS[m.id] ?? []).map(([name, x, y]) => {
    const [px, py] = m.places?.[name] ?? [x, y];
    return { name, x: px, y: py };
  });
  const find = (name: string) => callouts.find((c) => c.name === name);
  return { ...m, callouts, spawns: { attack: find('Attacker Side Spawn'), defense: find('Defender Side Spawn') } };
});

export type MapId = string;
const BY_ID = new Map(MAPS.map((m) => [m.id, m]));
export const mapById = (id: string): MapInfo | undefined => BY_ID.get(id);
export const isMap = (v: unknown): v is MapId => typeof v === 'string' && BY_ID.has(v);
export const POOL: readonly MapInfo[] = MAPS.filter((m) => m.pool);
/** A callout as players say it: the spawns are "Attack spawn" and "Defense spawn". */
export const spotName = (name: string): string => (name === 'Attacker Side Spawn' ? 'Attack spawn' : name === 'Defender Side Spawn' ? 'Defense spawn' : name);

/** A callout's name with what players also call it: "A Tower (Heaven)". */
export function calloutLabel(map: MapInfo, name: string): string {
  const aka = map.aka?.[name];
  return aka && aka !== name ? `${name} (${aka})` : name;
}
