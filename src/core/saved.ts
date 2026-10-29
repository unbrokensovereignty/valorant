/**
 * What you keep: saved plans (a planner question, with the comp you picked if you picked one) and
 * party presets (your usual duo, trio or five-stack, with the agents each of you plays). Every
 * record read back from storage, a backup or an import goes through a sanitizer here, so old or
 * damaged data just works: a new field only needs a default.
 */
import { isAgent } from './kb/agents.ts';
import { sanitizeQuery, type Query } from './engine/query.ts';
import { clean } from './text.ts';
import { isRecord } from './util.ts';

export const LIMITS = { name: 60, note: 600, plans: 500, parties: 50, players: 5, pool: 30 };

export interface SavedPlan {
  id: string;
  name: string;
  note: string;
  query: Query;
  /** The comp picked from the answers, as agent ids (empty when none was picked). */
  team: string[];
  starred: boolean;
  created: number;
  updated: number;
}

export interface Player {
  name: string;
  /** The agents this player plays; empty for anyone. */
  agents: string[];
}

export interface Party {
  id: string;
  name: string;
  players: Player[];
  created: number;
  updated: number;
}

const text = (v: unknown, max: number): string => clean(typeof v === 'string' ? v : '').slice(0, max);
const time = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);
const goodId = (v: unknown): v is string => typeof v === 'string' && /^[a-z]{1,3}_[a-z0-9]{4,24}$/.test(v);
const agents = (v: unknown, max: number): string[] => (Array.isArray(v) ? [...new Set(v.filter(isAgent))].slice(0, max) : []);

export function sanitizePlan(x: unknown, now = 0): SavedPlan | null {
  if (!isRecord(x) || !goodId(x.id)) return null;
  const query = sanitizeQuery(x.query);
  return {
    id: x.id,
    name: text(x.name, LIMITS.name) || 'Saved plan',
    note: text(x.note, LIMITS.note),
    query,
    team: agents(x.team, 5),
    starred: x.starred === true,
    created: time(x.created, now),
    updated: time(x.updated, time(x.created, now)),
  };
}

export function sanitizeParty(x: unknown, now = 0): Party | null {
  if (!isRecord(x) || !goodId(x.id)) return null;
  const players = (Array.isArray(x.players) ? x.players : []).slice(0, LIMITS.players).map((p, i): Player => ({
    name: text(isRecord(p) ? p.name : '', LIMITS.name) || `Player ${i + 1}`,
    agents: agents(isRecord(p) ? p.agents : [], LIMITS.pool),
  }));
  // a party is two, three or five players
  if (players.length < 2 || players.length === 4) return null;
  return { id: x.id, name: text(x.name, LIMITS.name) || 'My party', players, created: time(x.created, now), updated: time(x.updated, time(x.created, now)) };
}

/** A party's agent pools in player order, as the planner takes them. */
export const poolsOf = (p: Party): string[][] => p.players.map((x) => [...x.agents]);
