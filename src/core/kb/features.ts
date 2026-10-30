/**
 * What each map has besides its callouts, for the minimap's layers: where the ultimate orbs lie,
 * and the features that change how you move or what you see (doors, walls you can break,
 * teleporters, ropes and ziplines). Spots are fractions of the minimap's width and height, as
 * callouts are, placed by hand against the minimap and checked against several callout maps and
 * map guides; the specs check that each one stands on the floor. A feature with two ends (a
 * teleporter, rope or zipline) has `to` for the other end.
 */
import type { Spot } from './floor.ts';

export type FeatureKind = 'orb' | 'door' | 'breakable' | 'teleporter' | 'rope' | 'zipline';

export interface MapFeature {
  kind: FeatureKind;
  at: Spot;
  /** The other end, for a teleporter, rope or zipline. */
  to?: Spot;
  /** What it is, in a few words: "Rotating door between A Main and A Rubble". */
  about: string;
}

/** Each kind in words, for the legend, in the order the legend lists them. */
export const FEATURE_KINDS: readonly { kind: FeatureKind; name: string; layer: 'orbs' | 'features' }[] = [
  { kind: 'orb', name: 'Ultimate orb', layer: 'orbs' },
  { kind: 'door', name: 'Door', layer: 'features' },
  { kind: 'breakable', name: 'Breakable wall', layer: 'features' },
  { kind: 'teleporter', name: 'Teleporter', layer: 'features' },
  { kind: 'rope', name: 'Rope', layer: 'features' },
  { kind: 'zipline', name: 'Zipline', layer: 'features' },
];

export const FEATURES: Record<string, readonly MapFeature[]> = {
  ascent: [
    { kind: 'orb', at: [0.49, 0.24], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.41, 0.74], about: 'Ultimate orb in B Main' },
    { kind: 'door', at: [0.39, 0.24], about: 'A door, between A Link and the site: a switch by it shuts or opens it, and it breaks after enough damage' },
    { kind: 'door', at: [0.3, 0.605], about: 'B door, between Mid Market and the site: a switch in the site shuts or opens it, and it breaks after enough damage' },
    { kind: 'breakable', at: [0.255, 0.31], about: 'Glass pane in A Window, looking into A Garden: it breaks at the first shot' },
  ],
  bind: [
    { kind: 'orb', at: [0.85, 0.46], about: 'Ultimate orb at the back of A Bath' },
    { kind: 'orb', at: [0.19, 0.47], about: 'Ultimate orb in B Long, in front of the B teleporter' },
    { kind: 'teleporter', at: [0.14, 0.445], to: [0.935, 0.535], about: 'One-way teleporter from B Long to A Exit, loud at both ends; the exit room door opens only from inside' },
    { kind: 'teleporter', at: [0.605, 0.395], to: [0.493, 0.438], about: 'One-way teleporter from A Short to B Exit, loud at both ends; the exit room door opens only from inside' },
  ],
  breeze: [
    { kind: 'orb', at: [0.765, 0.611], about: 'Ultimate orb in A Shop' },
    { kind: 'orb', at: [0.16, 0.55], about: 'Ultimate orb in B Main' },
    { kind: 'breakable', at: [0.6, 0.445], about: 'Mid Wood Doors: shoot them open for a quicker way through mid' },
  ],
  fracture: [
    { kind: 'orb', at: [0.76, 0.77], about: 'Ultimate orb in A Hall' },
    { kind: 'orb', at: [0.7, 0.28], about: 'Ultimate orb in A Dish' },
    { kind: 'orb', at: [0.25, 0.82], about: 'Ultimate orb in B Tree' },
    { kind: 'orb', at: [0.22, 0.37], about: 'Ultimate orb in B Arcade' },
    { kind: 'zipline', at: [0.481, 0.2], to: [0.481, 0.765], about: 'One-way zipline under Defender Side Spawn, from the Attacker Side Bridge to Attacker Side Spawn' },
    { kind: 'zipline', at: [0.516, 0.765], to: [0.516, 0.2], about: 'One-way zipline under Defender Side Spawn, from Attacker Side Spawn to the Attacker Side Bridge' },
    { kind: 'rope', at: [0.615, 0.655], about: 'A Rope, up from A Hall toward A Link' },
    { kind: 'door', at: [0.705, 0.725], about: 'A Door, between A Hall and A Main: it opens by itself, loudly, when anyone comes near' },
  ],
  haven: [
    { kind: 'orb', at: [0.6, 0.21], about: 'Ultimate orb in A Long' },
    { kind: 'orb', at: [0.66, 0.86], about: 'Ultimate orb in C Long' },
    { kind: 'breakable', at: [0.52, 0.6], about: 'Panels over the C Garage doors, from Mid Courtyard: they stop bullets until broken' },
    { kind: 'breakable', at: [0.68, 0.52], about: 'Panel over part of the wall at Mid Window: it stops bullets until broken' },
  ],
  icebox: [
    { kind: 'orb', at: [0.55, 0.84], about: 'Ultimate orb in front of A Nest' },
    { kind: 'orb', at: [0.36, 0.43], about: 'Ultimate orb just outside B Garage' },
    { kind: 'zipline', at: [0.575, 0.808], to: [0.705, 0.808], about: 'Zipline across A Site, from A Nest to the site' },
  ],
  lotus: [
    { kind: 'orb', at: [0.76, 0.53], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.285, 0.645], about: 'Ultimate orb on C Mound' },
    { kind: 'door', at: [0.8, 0.535], about: 'A Door: a button on either side turns it, slowly and loudly, and it lets players through as it turns' },
    { kind: 'door', at: [0.33, 0.59], about: 'C Door: a button on either side turns it, slowly and loudly, and it lets players through as it turns' },
    { kind: 'breakable', at: [0.645, 0.5], about: 'Wall in A Link: break it to open a second way toward A for the rest of the round' },
    { kind: 'rope', at: [0.83, 0.31], to: [0.8, 0.245], about: 'Rope from A Site up to A Top' },
  ],
  pearl: [
    { kind: 'orb', at: [0.88, 0.52], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.1, 0.66], about: 'Ultimate orb in B Ramp' },
  ],
  split: [
    { kind: 'orb', at: [0.52, 0.22], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.52, 0.87], about: 'Ultimate orb by B Garage' },
    { kind: 'rope', at: [0.33, 0.36], about: 'Rope up to A Tower (Heaven)' },
    { kind: 'rope', at: [0.42, 0.705], about: 'Rope up to B Tower (Heaven)' },
  ],
  summit: [
    { kind: 'orb', at: [0.72, 0.6], about: 'Ultimate orb in A Main' },
    { kind: 'orb', at: [0.15, 0.52], about: 'Ultimate orb in B Main' },
  ],
  sunset: [
    { kind: 'door', at: [0.37, 0.455], about: 'Door between B Market and Mid Courtyard: a switch on the Market side shuts or opens it, and it breaks after enough damage' },
  ],
  abyss: [
    { kind: 'breakable', at: [0.457, 0.29], about: 'Door at the A Tower end of A Vent: it stops bullets until broken' },
    { kind: 'breakable', at: [0.477, 0.437], about: 'Door at the mid end of A Vent: it stops bullets until broken' },
    { kind: 'rope', at: [0.47, 0.22], about: 'Rope from A Site up to A Tower' },
    { kind: 'rope', at: [0.63, 0.69], about: 'Rope from B Main up to Mid Bend' },
  ],
};

/** A map's features (none for a map that hasn't been placed). */
export const featuresOf = (map: string): readonly MapFeature[] => FEATURES[map] ?? [];
