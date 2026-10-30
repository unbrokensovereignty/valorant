/**
 * The tips that fit a plan: the map and side, the team's doubled-up roles, each agent, the rank
 * and the party. Every tip says what it's about, so a list of them reads clearly.
 */
import { agentById, type Agent } from '../kb/agents.ts';
import { abilityNames } from '../kb/kits.ts';
import { mapById, SIDES, type Side } from '../kb/maps.ts';
import { rankOf } from '../kb/ranks.ts';
import { ROLES, ROLE_IDS, type Dim } from '../kb/roles.ts';
import { AGENT_MAP_TIPS, AGENT_TIPS, ATTACK_TIPS, DEFENSE_TIPS, DOUBLE_TIPS, MAP_TIPS, PARTY_TIPS, RANK_TIPS, agentMapTip, rankBand } from '../kb/tips.ts';
import type { Situation } from './model.ts';
import { partyOf, type PartySize } from './query.ts';

/** A tip and what it's about ("Haven, attack", "Gold" or an agent's name); an agent's own tip also has their id. */
export interface Tip { about: string; text: string; agent?: string }

const sideName = (s: Side) => SIDES.find((x) => x.id === s)!.name;

/** How much of a strength makes an initiator the one for that job, in a tip for two of them. */
const DOES = 0.5;
const ability = (a: Agent, d: Dim) => abilityNames(a.id, a.via[d] ?? '')[0];

/**
 * The tip for two initiators, from their kits: one finds the enemies and the other flashes or stops
 * them, or, when both do the same job, how to share it. It never gives a job to a kit without the
 * tools for it (KAY/O has no drone to find anyone with, Sova no flash).
 */
function twoInitiators(a: Agent, b: Agent): string {
  const finds = (x: Agent) => x.caps.recon, hits = (x: Agent) => Math.max(x.caps.flash, x.caps.disrupt);
  const [f, h] = finds(a) - hits(a) >= finds(b) - hits(b) ? [a, b] : [b, a];
  if (finds(f) >= DOES && hits(h) >= DOES) {
    const how = h.caps.flash >= h.caps.disrupt ? `flashes them with ${ability(h, 'flash')}` : `stops them with ${ability(h, 'disrupt')}`;
    return `${f.name} finds the enemies with ${ability(f, 'recon')} and ${h.name} ${how}; don’t spend both on the same angle.`;
  }
  if (finds(f) >= DOES && finds(h) >= DOES) return `${f.name} and ${h.name} both find enemies: send their utility to different places, so you learn twice as much.`;
  return `${f.name} and ${h.name} both set up fights: take turns, so one still has utility for the next fight.`;
}

/**
 * Tips for a team in a situation; `party` is your party's size, and only your party's agents get agent
 * tips. `locked` counts the teammates already locked in: once every other spot is taken, there's no one
 * left to ask for a role.
 */
export function tipsFor(team: readonly string[], s: Situation, party: PartySize = 5, partyAgents: readonly string[] = [], locked = 0): Tip[] {
  const out: Tip[] = [];
  const map = mapById(s.map);
  if (map) {
    const sides: Side[] = s.side === 'both' ? ['attack', 'defense'] : [s.side];
    for (const side of sides) {
      const tips = MAP_TIPS[map.id]?.[side] ?? [];
      // with both sides, one tip each keeps the list short
      for (const text of sides.length > 1 ? tips.slice(0, 1) : tips) out.push({ about: `${map.name}, ${sideName(side).toLowerCase()}`, text });
    }
  }
  const agents = team.map((id) => agentById(id)).filter((a) => !!a);
  for (const r of ROLE_IDS) {
    const two = agents.filter((a) => a.role === r);
    if (two.length !== 2) continue;
    out.push({ about: `Two ${ROLES.find((x) => x.id === r)!.plural.toLowerCase()}`, text: r === 'initiator' ? twoInitiators(two[0]!, two[1]!) : DOUBLE_TIPS[r][s.side] });
  }
  const yours = party < 5 && partyAgents.length ? agents.filter((a) => partyAgents.includes(a.id)) : agents;
  for (const a of yours) {
    const tips = AGENT_TIPS[a.id];
    // what the agent does on this map comes first, then what they do on this side anywhere
    const text = (map ? agentMapTip(a.id, map.id, s.side) : undefined)
      ?? (s.side === 'defense' ? DEFENSE_TIPS[a.id] : s.side === 'attack' ? ATTACK_TIPS[a.id] : undefined) ?? tips?.[0];
    if (text) out.push({ about: a.name, text, agent: a.id });
  }
  const r = rankOf(s.rank);
  for (const text of RANK_TIPS[rankBand(r.t)].slice(0, 2)) out.push({ about: r.name, text });
  if (party !== 5) {
    const about = partyOf(party).name;
    out.push({ about, text: PARTY_TIPS[party].play });
    if (party + locked < 5) out.push({ about, text: PARTY_TIPS[party].ask });
  }
  return out;
}

/** An agent's tips for their own page: both of them, and the ones for attack and defense when they're others. */
export function agentTips(id: string): readonly string[] {
  const tips: readonly string[] = AGENT_TIPS[id] ?? [];
  return [...tips, ...[ATTACK_TIPS[id], DEFENSE_TIPS[id]].filter((t): t is string => !!t && !tips.includes(t))];
}

/** A map tip for an agent: the map, the side it's for (none for both) and the tip. */
export interface MapTip { map: string; agent: string; side?: Side; text: string }

function mapTipsWhere(keep: (map: string, agent: string) => boolean): MapTip[] {
  const out: MapTip[] = [];
  for (const [map, byAgent] of Object.entries(AGENT_MAP_TIPS)) {
    for (const [agent, t] of Object.entries(byAgent)) {
      if (!keep(map, agent)) continue;
      if (typeof t === 'string') out.push({ map, agent, text: t });
      else for (const side of ['attack', 'defense'] as const) if (t[side]) out.push({ map, agent, side, text: t[side]! });
    }
  }
  return out;
}

/** An agent's tips for each map, for their own page, in map order. */
export const agentMapTips = (agent: string): MapTip[] => mapTipsWhere((_, a) => a === agent);

/** The agent tips for a map, for its page. */
export const mapAgentTips = (map: string): MapTip[] => mapTipsWhere((m) => m === map);
