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

export const FEATURES: Record<string, readonly MapFeature[]> = {};

/** A map's features (none for a map that hasn't been placed). */
export const featuresOf = (map: string): readonly MapFeature[] => FEATURES[map] ?? [];
