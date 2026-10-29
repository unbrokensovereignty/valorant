/** A planner question in words, for menus, lists and saved plans: "Haven, attack, C site" and "Gold · trio · with Jett". */
import { agentById } from '../../core/kb/agents.ts';
import { mapById } from '../../core/kb/maps.ts';
import { rankOf, type RankId } from '../../core/kb/ranks.ts';
import { ROLES } from '../../core/kb/roles.ts';
import type { Query } from '../../core/engine/query.ts';
import type { Situation } from '../../core/engine/model.ts';
import { TIERS } from '../../core/engine/weights.ts';
import { listJoin } from '../../core/text.ts';

/** "S from 95, A from 88, …": the tiers as the engine sets them. */
export const tierWords = (): string => listJoin(TIERS.map((t, i) => (t.min > 0 ? `${t.id} from ${t.min}` : `${t.id} below ${TIERS[i - 1]?.min ?? 0}`)));

/** How often something happens, out of ten games: "in about 6 of 10 games", "in nearly every game", "hardly ever". */
export function howOften(x: number): string {
  const n = Math.round(x * 10);
  return n >= 10 ? 'in nearly every game' : n <= 0 ? 'hardly ever' : `in about ${n} of 10 games`;
}

const COUNT = ['no', 'one', 'two', 'three', 'four', 'five'];

export const mapWord = (map: string): string => (map === 'best' ? 'Best map' : map === 'any' ? 'Any map' : mapById(map)?.name ?? 'Any map');
export const sideWord = (side: string): string => (side === 'attack' ? 'Attack' : side === 'defense' ? 'Defense' : side === 'best' ? 'Best side' : 'Both sides');
export const rankWord = (rank: RankId | 'best'): string => (rank === 'best' ? 'Best rank' : rankOf(rank).name);
export const partyWord = (n: number): string => (n === 2 ? 'Duo' : n === 3 ? 'Trio' : 'Five-stack');
export const sitesWord = (sites: readonly string[]): string => (sites.length ? `${listJoin(sites)} site${sites.length > 1 ? 's' : ''}` : '');
const names = (ids: readonly string[]) => listJoin(ids.map((id) => agentById(id)?.name ?? id));

/** "Haven, attack, C site". */
export function askedTitle(q: { map: string; side: string; sites: readonly string[] }): string {
  const parts = [mapWord(q.map)];
  if (q.side !== 'both') parts.push(sideWord(q.side).toLowerCase());
  if (q.sites.length && q.map !== 'any' && q.map !== 'best') parts.push(sitesWord(q.sites));
  return parts.join(', ');
}

/** "Gold · trio · with Jett · two controllers · against Chamber and Sova". */
export function askedLine(q: Query): string {
  const parts = [rankWord(q.rank), partyWord(q.party).toLowerCase()];
  if (q.include.length) parts.push(`with ${names(q.include)}`);
  const roles = ROLES.filter((r) => q.roles[r.id] !== undefined).map((r) => `${COUNT[q.roles[r.id]!]} ${(q.roles[r.id] === 1 ? r.name : r.plural).toLowerCase()}`);
  if (roles.length) parts.push(listJoin(roles));
  if (q.pools.length) parts.push('your party’s agents');
  if (q.enemy.length) parts.push(`against ${names(q.enemy)}`);
  return parts.join(' · ');
}

/** One situation the answers cover: "Haven, attack" or "Haven, attack, Gold" (whichever parts vary). */
export function situationWord(s: Situation, vary: readonly ('map' | 'side' | 'rank')[]): string {
  const parts: string[] = [];
  if (vary.includes('map')) parts.push(mapWord(s.map));
  if (vary.includes('side')) parts.push(sideWord(s.side));
  if (vary.includes('rank')) parts.push(rankWord(s.rank));
  return parts.join(', ');
}
