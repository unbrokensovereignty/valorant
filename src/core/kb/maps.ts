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

/**
 * How open a map or site is. On a tight one, fights happen at chokes and close corners, where
 * utility that needs walls (a concuss on impact, a trap strung between two walls, a wall across a
 * choke) works best; on an open one, fights happen across long sightlines and wide ground.
 */
export type Space = 'tight' | 'mixed' | 'open';

export const SPACE_INFO: Record<Space, { name: string; blurb: string }> = {
  tight: { name: 'Tight', blurb: 'Fights happen at chokes and close corners, where stuns, traps and walls across a way in do the most.' },
  mixed: { name: 'Mixed', blurb: 'Some long sightlines and some close corners, so most kits work.' },
  open: { name: 'Open', blurb: 'Fights happen across long sightlines and wide ground, where long walls, the Operator and information do the most.' },
};

/** Things on a map that change how a round is played, and that some kits use (kb/kitfit.ts). */
export type Mechanic = 'doors' | 'teleporters' | 'ropes' | 'ziplines' | 'breakable';
export const MECHANICS: Record<Mechanic, { name: string; blurb: string }> = {
  doors: { name: 'Doors', blurb: 'Doors worked by a switch, which open, shut or turn and can be heard across the map.' },
  teleporters: { name: 'Teleporters', blurb: 'One-way teleporters that move a player between sites in a moment, with a sound both teams hear.' },
  ropes: { name: 'Ropes', blurb: 'Ropes up to high ground, which a player climbs slowly and in the open.' },
  ziplines: { name: 'Ziplines', blurb: 'Ziplines that carry a player across a gap; the player can shoot while riding.' },
  breakable: { name: 'Breakable walls', blurb: 'Walls or doors that can be shot or blown open, which opens a new way in for the rest of the round.' },
};

export interface SiteDef {
  id: SiteId;
  /** What the site is like, in a sentence or two. */
  about: string;
  /** How open the site is, when it differs from the map. */
  space?: Space;
  needs: { both?: string; attack?: string; defense?: string };
}

export interface MapDef {
  id: string;
  name: string;
  /** In the current competitive pool. */
  pool: boolean;
  about: string;
  /** How open the map is, on the whole. */
  space: Space;
  /** Its mechanics, each with a sentence on where they are and what they change. */
  mechanics?: readonly { id: Mechanic; about: string }[];
  /** What wins on this map, in a sentence. */
  keys: string;
  needs: { both?: string; attack?: string; defense?: string };
  sites: readonly SiteDef[];
  /** Other names players use for a callout: the game's name → what people also call it. */
  aka?: Record<string, string>;
  /**
   * Where a callout really sits on the minimap, when the game's content places it badly: in a wall,
   * on the edge of its site or outside its own area. Each spot is the middle of the area the name
   * covers, where the game's own minimap labels and at least one other callout map put it (laid over
   * this minimap to line them up), and a site's spot is the middle of where the spike can be planted.
   * The specs check that every callout stands on the floor.
   */
  places?: Record<string, readonly [x: number, y: number]>;
}

/** The game's patch that the numbers (pick rates, the map pool) were taken at. */
export const PATCH = '13.09';
/** The competitive pool since patch 13.08 (13 October 2026); it changes next on 6 January 2027. */
export const POOL_SINCE = '2026-10-13';

const DEFS: readonly MapDef[] = [
  {
    id: 'abyss', name: 'Abyss', pool: true, space: 'open',
    about: 'An open map with no walls at its edges: fall off and you die. Long sightlines, a contested mid and two wide sites.',
    keys: 'Information and long walls. Pros run Sova with two controllers, often Harbor and Astra.',
    needs: { both: 'wall +.6; smoke +.15; recon +.35; mobility +.1; angles +.4', attack: 'entry +.1', defense: 'anchor +.1; retake +.1' },
    places: { 'A Bridge': [0.465, 0.041], 'A Link': [0.299, 0.273], 'A Lobby': [0.802, 0.244], 'A Main': [0.63, 0.114], 'A Secret': [0.183, 0.262], 'A Security': [0.257, 0.104], 'A Site': [0.415, 0.097], 'A Tower': [0.487, 0.255], 'A Vent': [0.471, 0.361], 'Attacker Side Spawn': [0.835, 0.485], 'B Danger': [0.625, 0.94], 'B Link': [0.307, 0.659], 'B Lobby': [0.823, 0.793], 'B Main': [0.618, 0.749], 'B Nest': [0.67, 0.899], 'B Site': [0.363, 0.904], 'B Tower': [0.277, 0.808], 'Defender Side Spawn': [0.07, 0.448], 'Mid Bend': [0.636, 0.634], 'Mid Bottom': [0.646, 0.514], 'Mid Catwalk': [0.539, 0.451], 'Mid Library': [0.449, 0.523], 'Mid Top': [0.305, 0.435] },
    sites: [
      { id: 'A', about: 'A large site reached from A Main and A Lobby, overlooked by A Tower and the bridge, with A Secret and A Security behind it.', needs: { both: 'recon +.15', attack: 'flash +.1' } },
      { id: 'B', about: 'Reached down B Main past B Danger and B Nest; B Tower looks over the site and B Link joins it to mid.', needs: { both: 'wall +.2', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'ascent', name: 'Ascent', pool: false, space: 'mixed',
    mechanics: [{ id: 'doors', about: 'Each site has a door that a switch shuts or opens, so one way onto that site can be closed for a while.' }],
    about: 'A classic two-site map won in mid: control Market and Catwalk and both sites open up. Doors on each site can be shut.',
    keys: 'Mid control with information and an Operator: pros always play Omen and Sova, often with Chamber.',
    needs: { both: 'recon +.3; smoke +.1; duel +.15; angles +.4', attack: 'flash +.1', defense: 'anchor +.2; retake +.1; angles +.2' },
    aka: { 'A Tree': 'Tree', 'A Rafters': 'Heaven', 'Mid Bottom': 'Mid', 'Mid Courtyard': 'Mid' },
    places: { 'A Site': [0.311, 0.148], 'B Lobby': [0.57, 0.71], 'B Site': [0.272, 0.793], 'Mid Market': [0.3, 0.545] },
    sites: [
      { id: 'A', about: 'Entered through A Main (from A Lobby) or from mid through A Garden and Tree; A Rafters (Heaven) and A Wine overlook it.', needs: { both: 'clear +.1', attack: 'smoke +.1' } },
      { id: 'B', about: 'Entered through B Main or from mid through Market; B Boat House sits at the back of a deep site.', needs: { both: 'disrupt +.1', defense: 'stall +.1' } },
    ],
  },
  {
    id: 'bind', name: 'Bind', pool: true, space: 'tight',
    mechanics: [{ id: 'teleporters', about: 'Two one-way teleporters, one by each site, send a player to the other site in a moment; both are loud, so they make fakes and fast rotations.' }],
    about: 'No mid, but two one-way teleporters move players between sites fast. Narrow entrances make utility on each choke decisive.',
    keys: 'Clearing tight chokes and stopping defuses: pros pair Viper with Brimstone, plus Fade for information and Yoru to take space.',
    needs: { both: 'clear +.3; flash +.15; smoke +.15; wall +.4; flank +.25; postplant +.15; angles -.6', defense: 'stall +.2; flank +.1' },
    aka: { 'A Bath': 'Showers', 'A Short': 'A Short', 'B Window': 'Hookah', 'A Tower': 'Heaven' },
    places: { 'A Lamps': [0.64, 0.325], 'A Short': [0.645, 0.515], 'A Site': [0.725, 0.327], 'Attacker Side Spawn': [0.6, 0.9], 'B Site': [0.292, 0.272] },
    sites: [
      { id: 'A', about: 'Hit through A Short and A Bath (Showers); A Lamps and A Tower (Heaven) look down on it, and the teleporter exits in A Short.', needs: { both: 'clear +.2; flash +.1' } },
      { id: 'B', about: 'Hit down B Long or through B Window (Hookah); B Garden and B Elbow give defenders close angles.', needs: { both: 'wall +.15; smoke +.1', defense: 'stall +.1' } },
    ],
  },
  {
    id: 'breeze', name: 'Breeze', pool: false, space: 'open',
    mechanics: [{ id: 'breakable', about: 'Mid Wood Doors can be shot open, which opens a quicker way through mid.' }],
    about: 'A huge, open map with very long sightlines and wide sites. Crossing open ground is the whole fight.',
    keys: 'Long walls and an Operator: Viper is close to a must, with Sova for information.',
    needs: { both: 'wall +1; smoke +.15; duel +.3; recon +.25; mobility +.2; flank +.1; angles +.6', defense: 'anchor +.15' },
    aka: { 'A Pyramids': 'Pyramids', 'Mid Nest': 'Nest', 'B Elbow': 'Elbow' },
    places: { 'A Bridge': [0.71, 0.235], 'A Lobby': [0.66, 0.83], 'A Pyramids': [0.835, 0.46], 'A Ramp': [0.63, 0.27], 'A Shop': [0.742, 0.629], 'A Site': [0.9, 0.444], 'Attacker Side Spawn': [0.45, 0.88], 'B Back': [0.065, 0.29], 'B Elbow': [0.262, 0.439], 'B Main': [0.17, 0.51], 'B Site': [0.13, 0.284], 'B Tunnel': [0.33, 0.297], 'B Wall': [0.25, 0.235], 'B Window': [0.16, 0.65], 'Defender Side Arches': [0.38, 0.12], 'Defender Side Spawn': [0.6, 0.085], 'Mid Bottom': [0.48, 0.6], 'Mid Cannon': [0.33, 0.62], 'Mid Hall': [0.645, 0.565], 'Mid Nest': [0.42, 0.225], 'Mid Pillar': [0.48, 0.48], 'Mid Top': [0.479, 0.339], 'Mid Wood Doors': [0.64, 0.475] },
    sites: [
      { id: 'A', about: 'A big site with the Pyramids in the middle, reached through A Shop or from mid through Mid Hall; A Bridge links it to defender spawn.', needs: { both: 'wall +.2', attack: 'smoke +.1' } },
      { id: 'B', space: 'mixed', about: 'Reached through B Main and B Window, or from mid through B Tunnel; tighter than A, with B Wall and B Back to clear.', needs: { both: 'clear +.1; smoke +.1' } },
    ],
  },
  {
    id: 'corrode', name: 'Corrode', pool: true, space: 'tight',
    about: 'A newer two-site map with a three-lane mid. Sites are reached through lobbies with many corners near the plant spots.',
    keys: 'Two controllers with Viper, plus Fade for information; Waylay or Neon to take space.',
    needs: { both: 'wall +.6; smoke +.15; recon +.2; angles -.3', attack: 'entry +.1', defense: 'stall +.15' },
    places: { 'A Crane': [0.188, 0.239], 'A Elbow': [0.341, 0.113], 'A Link': [0.452, 0.408], 'A Lobby': [0.713, 0.304], 'A Main': [0.608, 0.228], 'A Pocket': [0.471, 0.13], 'A Site': [0.397, 0.194], 'A Yard': [0.475, 0.219], 'Attacker Side Spawn': [0.881, 0.499], 'B Arch': [0.174, 0.815], 'B Elbow': [0.33, 0.874], 'B Link': [0.41, 0.61], 'B Lobby': [0.682, 0.721], 'B Main': [0.532, 0.807], 'B Site': [0.401, 0.768], 'B Tower': [0.292, 0.729], 'Defender Side Spawn': [0.13, 0.508], 'Mid Bottom': [0.711, 0.487], 'Mid Stairs': [0.54, 0.493], 'Mid Top': [0.386, 0.504], 'Mid Window': [0.322, 0.497] },
    sites: [
      { id: 'A', about: 'Reached through A Main or from mid through A Link; A Yard, A Pocket, A Elbow and A Crane give defenders many corners.', needs: { both: 'clear +.15; recon +.1' } },
      { id: 'B', about: 'Reached through B Main or from mid through B Link; B Tower and B Arch overlook the plant.', needs: { both: 'smoke +.1', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'fracture', name: 'Fracture', pool: false, space: 'mixed',
    mechanics: [{ id: 'ziplines', about: 'A zipline joins the two attacker sides across the map, so attackers can switch ends quickly.' }],
    about: 'Attackers spawn on both ends and can hit a site from two sides at once; defenders start in the middle.',
    keys: 'Stuns and flank watch: Breach, Brimstone and a sentinel who covers the back.',
    needs: { both: 'flank +.35; disrupt +.25; clear +.15; smoke +.1; mobility +.15; angles -.3', defense: 'stall +.2; retake +.15; recon +.15; flank +.2' },
    places: { 'A Dish': [0.686, 0.258], 'A Door': [0.706, 0.705], 'A Drop': [0.777, 0.415], 'A Gate': [0.681, 0.136], 'A Hall': [0.734, 0.756], 'A Link': [0.671, 0.452], 'A Main': [0.822, 0.651], 'A Rope': [0.636, 0.643], 'A Site': [0.877, 0.507], 'Attacker Side Bridge': [0.503, 0.153], 'Attacker Side Spawn': [0.495, 0.866], 'B Arcade': [0.243, 0.342], 'B Bench': [0.331, 0.29], 'B Canteen': [0.351, 0.572], 'B Generator': [0.3, 0.525], 'B Link': [0.321, 0.42], 'B Main': [0.138, 0.692], 'B Site': [0.099, 0.522], 'B Tower': [0.097, 0.445], 'B Tree': [0.284, 0.805], 'B Tunnel': [0.244, 0.677] },
    sites: [
      { id: 'A', about: 'Hit from A Main and A Door on one end, or from the other side down A Rope; A Dish and A Drop look over it.', needs: { both: 'disrupt +.15' } },
      { id: 'B', about: 'Hit from B Main and B Tree, or through B Arcade from the far side; B Tower and B Canteen hold over it.', needs: { both: 'clear +.15' } },
    ],
  },
  {
    id: 'haven', name: 'Haven', pool: true, space: 'mixed',
    about: 'Three sites, so defenders spread thin and rotate far. Mid control through Mid Doors and C Garage opens splits.',
    keys: 'Information and speed: Sova and Neon are favorites, and every defender must hold alone at times.',
    needs: { both: 'recon +.3; mobility +.2; duel +.1; angles +.3', attack: 'entry +.1', defense: 'anchor +.2; retake +.15; mobility +.1' },
    aka: { 'A Tower': 'Heaven', 'A Long': 'A Long', 'C Garage': 'Garage' },
    places: { 'A Garden': [0.748, 0.387], 'A Link': [0.373, 0.345], 'A Lobby': [0.62, 0.363], 'A Long': [0.567, 0.174], 'A Sewer': [0.48, 0.384], 'A Site': [0.376, 0.14], 'A Tower': [0.299, 0.142], 'Attacker Side Spawn': [0.891, 0.516], 'B Back': [0.29, 0.499], 'B Site': [0.394, 0.499], 'C Cubby': [0.603, 0.805], 'C Garage': [0.505, 0.625], 'C Link': [0.317, 0.662], 'C Lobby': [0.735, 0.726], 'C Long': [0.691, 0.841], 'C Site': [0.357, 0.84], 'C Window': [0.417, 0.627], 'Defender Side Spawn': [0.137, 0.437], 'Mid Courtyard': [0.567, 0.493], 'Mid Doors': [0.623, 0.63], 'Mid Window': [0.679, 0.496] },
    sites: [
      { id: 'A', about: 'Hit through A Long or A Sewer (Short); A Tower (Heaven) and A Link let defenders hold from above and behind.', needs: { both: 'flash +.1; clear +.1' } },
      { id: 'B', space: 'tight', about: 'The small middle site, open to Mid Window and Mid Doors; quick to take and quick to retake.', needs: { both: 'disrupt +.1', attack: 'postplant +.1' } },
      { id: 'C', about: 'Hit down C Long or from C Garage; C Cubby, C Window and C Link give defenders angles across the site.', needs: { both: 'smoke +.1; wall +.1', attack: 'postplant +.15' } },
    ],
  },
  {
    id: 'icebox', name: 'Icebox', pool: false, space: 'mixed',
    mechanics: [{ id: 'ziplines', about: 'Ziplines on both sites let players reach high spots fast.' }],
    about: 'Vertical sites full of boxes and ziplines, with long open lanes into each site.',
    keys: 'Long walls and an Operator, with information to clear the many high spots.',
    needs: { both: 'wall +.8; recon +.25; duel +.2; clear +.15; angles +.4', attack: 'postplant +.2', defense: 'anchor +.15' },
    places: { 'A Belt': [0.433, 0.85], 'A Nest': [0.52, 0.812], 'A Pipes': [0.581, 0.783], 'A Rafters': [0.762, 0.813], 'A Screen': [0.676, 0.692], 'A Site': [0.727, 0.807], 'Attacker Side Spawn': [0.261, 0.636], 'B Back': [0.814, 0.261], 'B Cubby': [0.398, 0.235], 'B Fence': [0.755, 0.33], 'B Garage': [0.345, 0.398], 'B Green': [0.444, 0.357], 'B Hall': [0.68, 0.353], 'B Hut': [0.779, 0.419], 'B Kitchen': [0.724, 0.471], 'B Orange': [0.578, 0.395], 'B Site': [0.614, 0.216], 'B Snow Pile': [0.642, 0.433], 'B Snowman': [0.779, 0.166], 'B Tube': [0.546, 0.486], 'B Yellow': [0.468, 0.159], 'Defender Side Spawn': [0.855, 0.553], 'Mid Blue': [0.422, 0.534], 'Mid Boiler': [0.675, 0.544], 'Mid Pallet': [0.59, 0.623] },
    sites: [
      { id: 'A', about: 'Entered past A Belt and A Nest; A Pipes, A Rafters and A Screen give defenders high and close spots.', needs: { both: 'clear +.2; recon +.1' } },
      { id: 'B', about: 'Entered through B Yellow and B Green; defenders hold from B Snowman, B Back, B Hall and B Kitchen.', needs: { both: 'wall +.2', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'lotus', name: 'Lotus', pool: true, space: 'tight',
    mechanics: [{ id: 'doors', about: 'A Door and C Door are worked by a switch and turn slowly and loudly, which changes the ways between the sites while they move.' }, { id: 'breakable', about: 'A wall on the way into A can be broken, which opens a second way onto the site for the rest of the round.' }],
    about: 'Three sites linked by rotating doors, with a breakable wall on A. Tight entrances and many corners on every site.',
    keys: 'Clearing corners and smoking chokes: pros always play Omen, usually with Viper and Fade, and often Chamber.',
    needs: { both: 'clear +.3; recon +.2; smoke +.2; wall +.3; flash +.1; mobility +.15; angles +.1', attack: 'postplant +.1', defense: 'anchor +.1' },
    places: { 'A Hut': [0.872, 0.331], 'A Main': [0.74, 0.487], 'A Site': [0.9, 0.29], 'A Top': [0.795, 0.226], 'Attacker Side Spawn': [0.5, 0.82], 'B Site': [0.469, 0.43], 'C Gravel': [0.385, 0.262], 'C Hall': [0.185, 0.336], 'C Link': [0.335, 0.378], 'C Lobby': [0.315, 0.763], 'C Mound': [0.275, 0.62], 'C Site': [0.117, 0.463], 'C Waterfall': [0.285, 0.455], 'Defender Side Spawn': [0.605, 0.17] },
    sites: [
      { id: 'A', about: 'Hit through A Main and A Root or A Rubble; A Hut, A Tree, A Stairs and A Drop give defenders close angles.', needs: { both: 'clear +.15; flash +.1' } },
      { id: 'B', about: 'The small center site, through B Main and B Pillars; B Upper overlooks it.', needs: { both: 'disrupt +.1', attack: 'postplant +.1' } },
      { id: 'C', about: 'Hit through C Main and C Mound; defenders hold from C Hall, C Gravel and C Waterfall.', needs: { both: 'recon +.1; wall +.1' } },
    ],
  },
  {
    id: 'pearl', name: 'Pearl', pool: false, space: 'mixed',
    about: 'A long, layered mid and two sites with long main entrances; no tricks, just space to take and hold.',
    keys: 'Smokes placed anywhere and information: Astra is the pro pick.',
    needs: { both: 'smoke +.2; recon +.25; wall +.2; mobility +.1; angles +.1', defense: 'anchor +.15' },
    aka: { 'B Main': 'B Long' },
    places: { 'A Art': [0.695, 0.512], 'A Dugout': [0.926, 0.298], 'A Flowers': [0.743, 0.216], 'A Link': [0.69, 0.362], 'A Main': [0.909, 0.499], 'A Restaurant': [0.746, 0.683], 'A Secret': [0.848, 0.186], 'A Site': [0.849, 0.315], 'Attacker Side Spawn': [0.538, 0.871], 'B Club': [0.282, 0.773], 'B Hall': [0.179, 0.29], 'B Link': [0.337, 0.522], 'B Main': [0.087, 0.545], 'B Ramp': [0.087, 0.688], 'B Screen': [0.057, 0.374], 'B Site': [0.185, 0.4], 'B Tower': [0.288, 0.397], 'B Tunnel': [0.342, 0.357], 'Defender Side Records': [0.46, 0.224], 'Defender Side Spawn': [0.57, 0.08], 'Defender Side Water': [0.57, 0.293], 'Mid Connector': [0.516, 0.367], 'Mid Doors': [0.506, 0.539], 'Mid Plaza': [0.544, 0.637], 'Mid Shops': [0.406, 0.736], 'Mid Top': [0.598, 0.732] },
    sites: [
      { id: 'A', about: 'Hit through A Main or from A Art and A Link; A Flowers, A Secret and A Dugout give defenders cover.', needs: { both: 'smoke +.1' } },
      { id: 'B', space: 'open', about: 'Hit down the long B Main from B Ramp, with B Screen, B Tower and B Hall to clear.', needs: { both: 'wall +.15; duel +.1' } },
    ],
  },
  {
    id: 'split', name: 'Split', pool: false, space: 'tight',
    mechanics: [{ id: 'ropes', about: 'Ropes lead up to high ground on each site (A Tower and B Tower, both called Heaven), which defenders use to hold from above.' }],
    about: 'Tight, vertical sites with ropes up to high ground, and a mid that leads to both. Chokes everywhere.',
    keys: 'Smokes and clearing: Viper and Omen together, with Neon to take space and Fade for information.',
    needs: { both: 'clear +.3; smoke +.25; disrupt +.15; flank +.2; wall +.4; recon +.1; angles -.5', defense: 'stall +.15' },
    aka: { 'A Tower': 'A Heaven', 'B Tower': 'B Heaven', 'Mid Vent': 'Vents' },
    places: { 'A Rafters': [0.353, 0.268], 'A Site': [0.327, 0.093], 'B Rafters': [0.368, 0.751], 'B Site': [0.321, 0.819] },
    sites: [
      { id: 'A', about: 'Hit through A Main and up A Ramps, with A Rafters, A Screens and A Tower (Heaven) above the site.', needs: { both: 'flash +.1' } },
      { id: 'B', about: 'Hit through B Garage or from mid down B Link; B Tower (Heaven), B Rafters and B Alley overlook the site.', needs: { both: 'clear +.15; disrupt +.1' } },
    ],
  },
  {
    id: 'summit', name: 'Summit', pool: true, space: 'mixed',
    about: 'A newer two-site map with a wide mid around Mid Fountain and Mid Tiles; both sites have lots of cover.',
    keys: 'Fast entry and information: Neon and Fade are the pro picks, with Chamber holding angles.',
    needs: { both: 'entry +.15; recon +.25; duel +.15; wall +.15; mobility +.1; angles +.4', defense: 'stall +.15' },
    places: { 'A Art': [0.773, 0.256], 'A Cave': [0.94, 0.245], 'A Garden': [0.809, 0.376], 'A Hall': [0.616, 0.225], 'A Link': [0.663, 0.369], 'A Lobby': [0.727, 0.761], 'A Main': [0.74, 0.568], 'A Site': [0.919, 0.44], 'Attacker Side Spawn': [0.49, 0.903], 'B Drop': [0.075, 0.234], 'B Gym': [0.257, 0.172], 'B Link': [0.323, 0.4], 'B Lobby': [0.266, 0.688], 'B Main': [0.128, 0.497], 'B Site': [0.132, 0.301], 'B Tower': [0.179, 0.212], 'B Trophy': [0.343, 0.267], 'Defender Side Spawn': [0.51, 0.081], 'Mid Bend': [0.627, 0.495], 'Mid Bottom': [0.474, 0.429], 'Mid Fountain': [0.534, 0.548], 'Mid Tiles': [0.366, 0.597], 'Mid Top': [0.527, 0.688], 'Mid Window': [0.485, 0.329] },
    sites: [
      { id: 'A', about: 'Hit through A Main or from mid through A Link; A Garden, A Art, A Hall and A Cave surround the site.', needs: { both: 'clear +.1', attack: 'flash +.1' } },
      { id: 'B', about: 'Hit through B Main or from mid through B Link; B Tower, B Gym, B Trophy and B Drop overlook the plant.', needs: { both: 'smoke +.1', attack: 'postplant +.1' } },
    ],
  },
  {
    id: 'sunset', name: 'Sunset', pool: true, space: 'tight',
    about: 'A compact city map with a busy mid; B Market and A Elbow are tight, close-range fights.',
    keys: 'Information and fast entry: Omen, Neon and Fade, with Chamber as the sentinel.',
    needs: { both: 'recon +.25; entry +.15; clear +.15; smoke +.1; flank +.1; angles +.3' },
    places: { 'A Alley': [0.801, 0.178], 'A Elbow': [0.923, 0.373], 'A Link': [0.647, 0.275], 'A Lobby': [0.752, 0.627], 'A Main': [0.759, 0.5], 'A Site': [0.82, 0.375], 'Attacker Side Spawn': [0.55, 0.895], 'B Boba': [0.209, 0.275], 'B Lobby': [0.367, 0.744], 'B Main': [0.237, 0.618], 'B Market': [0.306, 0.483], 'B Site': [0.126, 0.403], 'Defender Side Spawn': [0.505, 0.068], 'Mid Bottom': [0.486, 0.614], 'Mid Courtyard': [0.45, 0.439], 'Mid Tiles': [0.572, 0.549], 'Mid Top': [0.488, 0.316] },
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
