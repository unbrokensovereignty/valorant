/** Each agent's abilities: the game's own text, or a new agent's revealed kit until that's in. */
import { KITS, type Kit, type KitAbility } from './content.gen.ts';
import { NEW_KITS } from './new-agents.ts';

export type { Kit, KitAbility };

export const kitOf = (id: string): Kit | undefined => KITS[id] ?? NEW_KITS[id];

/** The ability on a key ("C", "Q", "E", "X"). */
export const abilityOn = (id: string, key: string): KitAbility | undefined => kitOf(id)?.abilities.find((a) => a.key === key);

/** "Dark Cover" for Omen's E, or "their gun" for G (gun play). */
export function abilityNames(id: string, keys: string): string[] {
  const out: string[] = [];
  for (const k of keys) {
    if (k === 'G') continue;
    const a = abilityOn(id, k);
    if (a) out.push(a.name.replace(/\s*\/.*$/, ''));
  }
  return out;
}
