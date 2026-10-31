/**
 * What each map has besides its callouts, for the minimap's layers: where the ultimate orbs lie,
 * and the features that change how you move or what you see (doors, walls you can break or drop,
 * teleporters, ropes, ziplines and silent drops). Spots are fractions of the minimap's width and height, as
 * callouts are, placed by hand against the minimap and checked against several callout maps and
 * map guides; the specs check that each one stands on the floor. A feature with two ends (a
 * teleporter, rope or zipline) has `to` for the other end, and a mark can be turned (`angle`) to lie
 * the way its door or wall does.
 */
import type { Spot } from './floor.ts';

export type FeatureKind = 'orb' | 'door' | 'breakable' | 'wall' | 'teleporter' | 'rope' | 'zipline' | 'drop';

export interface MapFeature {
  kind: FeatureKind;
  at: Spot;
  /** The other end, for a teleporter, rope or zipline. */
  to?: Spot;
  /** What it is, in a few words: "Rotating door between A Main and A Rubble". */
  about: string;
  /** How far its mark is turned, in degrees clockwise (a door or wall that lies across the map's lines). */
  angle?: number;
}

/** Each kind in words, for the legend, in the order the legend lists them. */
export const FEATURE_KINDS: readonly { kind: FeatureKind; name: string; layer: 'orbs' | 'features' }[] = [
  { kind: 'orb', name: 'Ultimate orb', layer: 'orbs' },
  { kind: 'door', name: 'Door', layer: 'features' },
  { kind: 'breakable', name: 'Breakable wall', layer: 'features' },
  { kind: 'wall', name: 'Droppable wall', layer: 'features' },
  { kind: 'teleporter', name: 'Teleporter', layer: 'features' },
  { kind: 'rope', name: 'Rope', layer: 'features' },
  { kind: 'zipline', name: 'Zipline', layer: 'features' },
  { kind: 'drop', name: 'Silent drop', layer: 'features' },
];

export const FEATURES: Record<string, readonly MapFeature[]> = {
  ascent: [
    { kind: 'orb', at: [0.478, 0.265], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.381, 0.747], about: 'Ultimate orb in B Main' },
    { kind: 'door', at: [0.396, 0.235], about: 'A door, between A Link and the site: a switch by it shuts or opens it, and it breaks after enough damage' },
    { kind: 'door', at: [0.288, 0.598], about: 'B door, between Mid Market and the site: a switch in the site shuts or opens it, and it breaks after enough damage' },
    { kind: 'breakable', at: [0.267, 0.284], about: 'Glass pane in A Window, looking into A Garden: it breaks at the first shot' },
    { kind: 'breakable', at: [0.5, 0.554], about: 'Panel on the wall between Mid Courtyard and Mid Link: it stops bullets until broken, then they go through the wall' },
    { kind: 'breakable', at: [0.55, 0.554], about: 'Panel on the other wall between Mid Courtyard and Mid Link: it stops bullets until broken, then they go through the wall' },
  ],
  bind: [
    { kind: 'orb', at: [0.84, 0.476], about: 'Ultimate orb at the back of A Bath' },
    { kind: 'orb', at: [0.192, 0.425], about: 'Ultimate orb in B Long, in front of the B teleporter' },
    { kind: 'teleporter', at: [0.143, 0.433], to: [0.921, 0.516], about: 'One-way teleporter from B Long to A Exit, by A Bath: loud at both ends' },
    { kind: 'teleporter', at: [0.604, 0.408], to: [0.474, 0.444], about: 'One-way teleporter from A Short to B Exit, by B Window: loud at both ends' },
    { kind: 'door', at: [0.877, 0.515], about: 'A Exit door: it opens by itself only for someone inside the exit room, and bullets go through it' },
    { kind: 'door', at: [0.431, 0.443], about: 'B Exit door: it opens by itself only for someone inside the exit room, and bullets go through it' },
  ],
  breeze: [
    { kind: 'orb', at: [0.768, 0.619], about: 'Ultimate orb in A Shop' },
    { kind: 'orb', at: [0.141, 0.475], about: 'Ultimate orb in B Main' },
    { kind: 'door', at: [0.582, 0.564], about: 'Door at the mid end of Mid Hall: it opens by itself, loudly, for anyone or anything that comes near, from either side' },
    { kind: 'rope', at: [0.752, 0.217], about: 'Rope from the back of A Site up to A Bridge' },
  ],
  corrode: [
    { kind: 'orb', at: [0.613, 0.193], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.528, 0.701], about: 'Ultimate orb at the top of B Main, on the way from B Lobby' },
  ],
  fracture: [
    { kind: 'orb', at: [0.762, 0.786], about: 'Ultimate orb in A Hall' },
    { kind: 'orb', at: [0.715, 0.321], about: 'Ultimate orb by A Dish' },
    { kind: 'orb', at: [0.181, 0.753], about: 'Ultimate orb between B Main and B Tree' },
    { kind: 'orb', at: [0.284, 0.341], about: 'Ultimate orb in B Arcade' },
    { kind: 'zipline', at: [0.481, 0.2], to: [0.481, 0.765], about: 'One-way zipline under Defender Side Spawn, from the Attacker Side Bridge to Attacker Side Spawn' },
    { kind: 'zipline', at: [0.516, 0.765], to: [0.516, 0.2], about: 'One-way zipline under Defender Side Spawn, from Attacker Side Spawn to the Attacker Side Bridge' },
    { kind: 'rope', at: [0.617, 0.64], about: 'A Rope, up from A Hall toward A Link' },
    { kind: 'rope', at: [0.152, 0.373], about: 'Rope up to B Tower' },
    { kind: 'door', at: [0.709, 0.702], about: 'A Door, between A Hall and A Main: it opens by itself, loudly, when anyone comes near' },
  ],
  haven: [
    { kind: 'orb', at: [0.56, 0.135], about: 'Ultimate orb in A Long' },
    { kind: 'orb', at: [0.701, 0.845], about: 'Ultimate orb in C Long' },
    { kind: 'breakable', at: [0.553, 0.62], about: 'Panel over one of the double doors between Mid Doors and C Garage: it stops bullets until broken' },
    { kind: 'breakable', at: [0.544, 0.643], about: 'Panel over the other double door between Mid Doors and C Garage: it stops bullets until broken' },
    { kind: 'breakable', at: [0.653, 0.455], about: 'Panel over part of the wall at Mid Window: it stops bullets until broken' },
  ],
  icebox: [
    { kind: 'orb', at: [0.585, 0.826], about: 'Ultimate orb between A Nest and A Pipes' },
    { kind: 'orb', at: [0.421, 0.339], about: 'Ultimate orb in B Green, by the way out of B Garage' },
    { kind: 'zipline', at: [0.538, 0.814], to: [0.703, 0.814], about: 'Zipline across A Site, from A Nest to the site' },
    { kind: 'rope', at: [0.523, 0.749], about: 'Rope up to the top of A Nest' },
    { kind: 'rope', at: [0.72, 0.744], about: 'Rope up to the high ground on A Site, at its mid end' },
    { kind: 'rope', at: [0.719, 0.834], about: 'Rope up to the high ground on A Site, at its far end' },
    { kind: 'rope', at: [0.599, 0.192], about: 'Rope up to the high ground on B Site' },
  ],
  lotus: [
    { kind: 'orb', at: [0.783, 0.492], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.236, 0.651], about: 'Ultimate orb on C Mound' },
    { kind: 'door', at: [0.831, 0.517], about: 'A Door, between A Main and A Tree: a button on either side turns it, slowly and loudly, and it lets players through as it turns' },
    { kind: 'door', at: [0.336, 0.571], about: 'C Door, between C Mound and B Main: a button on either side turns it, slowly and loudly, and it lets players through as it turns' },
    { kind: 'breakable', at: [0.657, 0.455], about: 'Wall between A Main and A Link: break it to open a second way toward A for the rest of the round' },
    { kind: 'rope', at: [0.811, 0.287], about: 'Rope from A Site up to A Top' },
    { kind: 'drop', at: [0.88, 0.232], about: 'Silent drop from A Top down to A Drop: walk off it and nobody hears you land' },
  ],
  pearl: [
    { kind: 'orb', at: [0.91, 0.544], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.089, 0.714], about: 'Ultimate orb in B Ramp' },
  ],
  split: [
    { kind: 'orb', at: [0.492, 0.216], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.541, 0.913], about: 'Ultimate orb in B Garage' },
    { kind: 'rope', at: [0.608, 0.22], about: 'Two ropes between A Sewer and A Main' },
    { kind: 'rope', at: [0.421, 0.446], about: 'Two ropes from mid up into Mid Vent' },
    { kind: 'rope', at: [0.366, 0.412], about: 'Two ropes from Mid Vent up toward A Tower (Heaven)' },
    { kind: 'rope', at: [0.42, 0.717], about: 'Rope from B Site up to B Tower (Heaven)' },
  ],
  summit: [
    { kind: 'orb', at: [0.778, 0.549], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.122, 0.505], about: 'Ultimate orb in B Main' },
    { kind: 'wall', at: [0.808, 0.318], about: 'A wall, between A Art and A Garden: shoot its switch and it drops, shutting the way for the rest of the round' },
    { kind: 'wall', at: [0.484, 0.353], about: 'Mid wall, between Mid Window and Mid Bottom: shoot its switch and it drops, shutting the way for the rest of the round' },
    { kind: 'wall', at: [0.138, 0.244], about: 'B wall, between B Tower and B Site: shoot its switch and it drops, shutting the way for the rest of the round' },
    { kind: 'rope', at: [0.205, 0.23], about: 'Rope from B Gym up to B Tower' },
    { kind: 'drop', at: [0.071, 0.213], about: 'Silent drop from B Tower down to B Drop: walk off it and nobody hears you land' },
  ],
  sunset: [
    { kind: 'orb', at: [0.793, 0.477], about: 'Ultimate orb in A Main, by the site' },
    { kind: 'orb', at: [0.186, 0.659], about: 'Ultimate orb in B Main' },
    { kind: 'door', at: [0.37, 0.455], about: 'Door between B Market and Mid Courtyard: a switch on the Market side shuts or opens it, and it breaks after enough damage' },
  ],
  abyss: [
    { kind: 'breakable', at: [0.444, 0.291], about: 'Door at the A Tower end of A Vent: it stops bullets until broken' },
    { kind: 'breakable', at: [0.5, 0.435], about: 'Door at the mid end of A Vent: it stops bullets until broken' },
    { kind: 'rope', at: [0.5, 0.204], about: 'Rope from A Site up to A Tower' },
    { kind: 'rope', at: [0.614, 0.683], about: 'Rope from B Main up to Mid Bend' },
    { kind: 'rope', at: [0.839, 0.523], about: 'Rope in Attack spawn' },
    { kind: 'rope', at: [0.452, 0.452], about: 'Rope up to Mid Catwalk, reached by jumping the drop from Mid Top or Mid Library' },
    { kind: 'orb', at: [0.631, 0.193], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.629, 0.823], about: 'Ultimate orb in B Main' },
  ],
};

/** A map's features (none for a map that hasn't been placed). */
export const featuresOf = (map: string): readonly MapFeature[] => FEATURES[map] ?? [];
