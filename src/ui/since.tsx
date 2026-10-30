/**
 * Tiers that moved since the version this one is compared with (core/engine/since.ts): an arrow on
 * an agent, the words for its tooltip and for screen readers, and a list of a situation's moves
 * with why each one happened.
 */
import { agentById } from '../core/kb/agents.ts';
import type { Situation } from '../core/engine/model.ts';
import type { AgentAnswer } from '../core/engine/plan.ts';
import { SINCE_FROM, sinceMoves, type Since } from '../core/engine/since.ts';
import { listJoin } from '../core/text.ts';
import { plural } from '../core/util.ts';
import { AgentIcon } from './art.tsx';
import { Icon } from './icons.tsx';
import { play } from './sound.ts';
import { useView } from './state.ts';

/** "Up from C since 0.2.0", or "up from C since 0.2.0" to go after other words. */
export const sinceWords = (m: Since, start = true): string => `${m.up ? (start ? 'Up' : 'up') : (start ? 'Down' : 'down')} from ${m.from} since ${SINCE_FROM}`;

/** "Up from C since 0.2.0: why." for a tooltip. */
export const sinceTip = (m: Since): string => `${sinceWords(m)}: ${m.why}`;

/** The arrow beside an agent whose tier moved (its words go in the tooltip and the label of what it's on). */
export const SinceArrow = ({ m }: { m: Since }) => (
  <span class={`since since-${m.up ? 'up' : 'down'}`} aria-hidden="true"><Icon name={m.up ? 'move-up' : 'move-down'} size={12} /></span>
);

/** Every agent whose tier moved in a situation, and why (once for those that moved together), behind a button that shows them. */
export function SinceList({ s, agents }: { s: Situation; agents: readonly AgentAnswer[] }) {
  const [open, setOpen] = useView<'yes' | 'no'>('since.open', 'no', (v) => v === 'yes' || v === 'no');
  const groups = sinceMoves(s, agents);
  if (!groups.length) return null;
  const on = open === 'yes';
  const count = groups.reduce((n, g) => n + g.agents.length, 0);
  return (
    <section class="since-list" aria-label={`Since ${SINCE_FROM}`}>
      <button type="button" class="btn quiet sm" aria-expanded={on} aria-controls="since-moves" onClick={() => { play(on ? 'close' : 'open'); setOpen(on ? 'no' : 'yes'); }}>
        <Icon name={on ? 'chevron-down' : 'chevron-right'} size={16} />
        {plural(count, 'agent')} moved a tier since {SINCE_FROM}
      </button>
      {on && (
        <ul id="since-moves" class="plain-list since-rows">
          {groups.map((g) => (
            <li key={g.agents[0]!.ans.id} class="since-row">
              <ul class="since-agents" aria-label={listJoin(g.agents.map(({ ans }) => agentById(ans.id)?.name ?? ans.id))}>
                {g.agents.map(({ ans, since }) => (
                  <li key={ans.id} class="since-agent">
                    <AgentIcon id={ans.id} size={26} />
                    <b>{agentById(ans.id)?.name ?? ans.id}</b>
                    <span class="since-tiers" role="img" aria-label={`Tier ${since.from} then, ${ans.tier} now`}>
                      <span class={`tier tier-${since.from.toLowerCase()}`} aria-hidden="true">{since.from}</span>
                      <SinceArrow m={since} />
                      <span class={`tier tier-${ans.tier.toLowerCase()}`} aria-hidden="true">{ans.tier}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p class="since-why small">{g.why}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
