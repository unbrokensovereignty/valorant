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
    if (a) out.push(a.name.replace(/\s+\/\s.*$/, ''));
  }
  return out;
}

/** A piece of an ability's text: plain words, a name (of an ability or what it makes), an effect on enemies, or a help to the agent's side. */
export interface TextPart { kind: 'plain' | 'name' | 'enemy' | 'ally'; text: string }
/** The game's marks in its ability text: `<debuffred>flashing</>`. */
const MARKS: Record<string, TextPart['kind']> = { whitebold: 'name', debuffred: 'enemy', teal: 'ally' };

/** Splits an ability's text at the game's marks, so a screen can show them; an unknown mark is shown as plain words. */
export function textParts(text: string): TextPart[] {
  const out: TextPart[] = [];
  let at = 0;
  for (const m of text.matchAll(/<(\w+)>(.*?)<\/>/g)) {
    if (m.index > at) out.push({ kind: 'plain', text: text.slice(at, m.index) });
    out.push({ kind: MARKS[m[1]!] ?? 'plain', text: m[2]! });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ kind: 'plain', text: text.slice(at) });
  return out;
}

/** An ability's text without the game's marks. */
export const plainText = (text: string): string => textParts(text).map((p) => p.text).join('');

