/**
 * The tips that fit a plan: the map and side, the team's doubled-up roles, each agent, the rank
 * and the party. Every tip says what it's about, so a list of them reads clearly.
 */
import { agentById } from '../kb/agents.ts';
import { mapById, SIDES, type Side } from '../kb/maps.ts';
import { rankOf } from '../kb/ranks.ts';
import { ROLES, ROLE_IDS } from '../kb/roles.ts';
import { AGENT_TIPS, DOUBLE_TIPS, MAP_TIPS, PARTY_TIPS, RANK_TIPS, rankBand } from '../kb/tips.ts';
import type { Situation } from './model.ts';
import type { PartySize } from './query.ts';

export interface Tip { about: string; text: string }

const sideName = (s: Side) => SIDES.find((x) => x.id === s)!.name;

/** Tips for a team in a situation; `party` is your party's size, and only your party's agents get agent tips. */
export function tipsFor(team: readonly string[], s: Situation, party: PartySize = 5, partyAgents: readonly string[] = []): Tip[] {
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
    if (agents.filter((a) => a.role === r).length === 2) out.push({ about: `Two ${ROLES.find((x) => x.id === r)!.plural.toLowerCase()}`, text: DOUBLE_TIPS[r] });
  }
  const yours = party < 5 && partyAgents.length ? agents.filter((a) => partyAgents.includes(a.id)) : agents;
  for (const a of yours) {
    const tips = AGENT_TIPS[a.id];
    if (tips) out.push({ about: a.name, text: tips[0] });
  }
  if (s.rank !== 'any') {
    const r = rankOf(s.rank);
    for (const text of RANK_TIPS[rankBand(r.t)].slice(0, 2)) out.push({ about: r.name, text });
  }
  if (party === 2 || party === 3) for (const text of PARTY_TIPS[party]) out.push({ about: party === 2 ? 'Duo' : 'Trio', text });
  return out;
}

/** Both of an agent's tips, for their own page. */
export const agentTips = (id: string): readonly string[] => AGENT_TIPS[id] ?? [];
