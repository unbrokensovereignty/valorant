/**
 * The Planner's answers: how the question went, the situations it compared (when it asked for the
 * best map, side or rank), and for the chosen one its comps and agents.
 */
import { useEffect, useState } from 'preact/hooks';
import { agentById } from '../../core/kb/agents.ts';
import { ROLES, type Role } from '../../core/kb/roles.ts';
import type { AgentAnswer, SituationAnswer } from '../../core/engine/plan.ts';
import { asksBest, nothingFixed, type Query } from '../../core/engine/query.ts';
import { tierOf } from '../../core/engine/weights.ts';
import { listJoin } from '../../core/text.ts';
import { AgentIcon, MapThumb, RoleIcon } from '../art.tsx';
import { Button, Empty, Segmented, Tabs } from '../components/controls.tsx';
import { Icon } from '../icons.tsx';
import { go, useView } from '../state.ts';
import { play } from '../sound.ts';
import { CompRow, Fit, TeamIcons } from './comp.tsx';
import { ask, bestOf, run } from './store.ts';
import { askedLine, askedTitle, partyWord, situationWord } from './words.ts';

type Tab = 'comps' | 'agents';

export function Answers() {
  const r = run.value;
  const [pick, setPick] = useState(0);
  const [open, setOpen] = useState(0);
  const [tab, setTab] = useView<Tab>('planner.tab', 'comps', (v) => v === 'comps' || v === 'agents');
  const key = r ? JSON.stringify(r.query) : '';
  // a new question starts on its best situation with the best comp open
  useEffect(() => { setPick(0); setOpen(0); }, [key]);
  if (!r) return <div class="answers"><Working text="Getting ready" /></div>;
  if (r.status === 'error') {
    return <div class="answers"><Empty title="Something went wrong" actions={<Button onClick={() => ask({}, true)}>Try again</Button>}>The Planner couldn’t answer this question. The details are under Help, About.</Empty></div>;
  }
  if (r.status === 'working' && !r.answers.length) return <div class="answers"><Working text={r.total > 1 ? `Comparing ${r.total} situations` : 'Finding comps'} done={r.done} total={r.total} /></div>;
  const vary = asksBest(r.query);
  const answers = r.answers;
  const ans = answers[Math.min(pick, answers.length - 1)];
  if (!ans) return null;
  const none = !ans.comps.length;
  return (
    <div class={`answers${r.status === 'working' ? ' stale' : ''}`} aria-busy={r.status === 'working'}>
      <header class="answers-head">
        <div class="grow">
          <h2>{vary.length ? `Best ${listJoin(vary.map((v) => (v === 'map' ? 'maps' : v === 'side' ? 'sides' : 'ranks')))} for you` : askedTitle(r.query)}</h2>
          <p class="muted small">{askedLine(r.query)} · {ans.count.toLocaleString('en-US')} {r.query.party === 5 ? 'possible comps' : `possible ${partyWord(r.query.party).toLowerCase()}s`} checked</p>
        </div>
        {r.status === 'working' && <span class="row muted small"><span class="spinner" aria-hidden="true" />Updating</span>}
      </header>

      {vary.length > 0 && <Situations answers={answers} vary={vary} pick={pick} setPick={(i) => { setPick(i); setOpen(0); }} same={nothingFixed(r.query)} />}

      {vary.length > 0 && <h2 class="answers-sub">{situationWord(ans.situation, vary)}</h2>}
      <Tabs<Tab> label="Answers" value={tab} onChange={setTab} tabs={[['comps', r.query.party === 5 ? 'Comps' : `${partyWord(r.query.party)} picks`], ['agents', 'Agents']]} />
      {none ? (
        <Empty title="No comp fits all of these choices" actions={<Button onClick={() => ask({ include: [], exclude: [], roles: {}, locked: [] }, true)}>Clear the agent and role choices</Button>}>
          {whyNone(r.query)}
        </Empty>
      ) : tab === 'comps' ? (
        <ol class="comps">
          {ans.comps.map((c, i) => <CompRow key={c.team.join()} c={c} i={i} ans={ans} q={r.query} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
        </ol>
      ) : (
        <AgentList agents={ans.agents} plan={(id) => ask({ include: [...new Set([...r.query.include, id])].slice(0, r.query.party) }, true)} />
      )}
    </div>
  );
}

function Working({ text, done, total }: { text: string; done?: number; total?: number }) {
  return (
    <div class="working" role="status">
      <span class="spinner" aria-hidden="true" />
      <span>{text}{total && total > 1 ? ` (${done ?? 0} of ${total})` : ''}…</span>
    </div>
  );
}

/** Why nothing fits, in a sentence that points at the likely cause. */
function whyNone(q: Query): string {
  const roles = Object.values(q.roles).reduce((a, b) => a + (b ?? 0), 0);
  if (q.pools.length) return 'Your party’s agents can’t make a comp with these choices. Try fewer must-plays or role counts.';
  if (roles === q.party && q.include.length) return 'The role counts and must-play agents leave no room for a comp. Loosen one of them.';
  if (q.exclude.length > 15) return 'So many agents are left out that the role counts can’t be met. Let some back in.';
  return 'Try removing a must-play agent, a role count or some of the agents you left out.';
}

/** The situations compared, best first: pick one to see its comps. */
function Situations({ answers, vary, pick, setPick, same }: { answers: readonly SituationAnswer[]; vary: ('map' | 'side' | 'rank')[]; pick: number; setPick: (i: number) => void; same: boolean }) {
  return (
    <section class="situations" aria-label="Situations">
      {same && <p class="note"><Icon name="info" size={16} />With nothing else chosen, every situation has a comp that fits it fully, so this list ranks nothing. Choose agents, roles or a party to compare.</p>}
      <div class="situation-list" role="listbox" aria-label="Situations, best first">
        {answers.map((a, i) => {
          const best = bestOf(a);
          return (
            <button type="button" role="option" key={situationWord(a.situation, vary)} aria-selected={i === pick} class="situation" onClick={() => { play('tick'); setPick(i); }}>
              {vary.includes('map') && <MapThumb id={a.situation.map} />}
              <span class="situation-name">{situationWord(a.situation, vary)}</span>
              {a.comps.length ? <Fit fit={best} tier={tierOf(best)} label={a.comps[0]!.party.length ? 'Expected fit' : 'Best fit'} compact /> : <span class="muted small">No comp fits</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Agents ranked for the situation, with a role filter; each opens to the best comp it fits into. */
export function AgentList({ agents, plan }: { agents: readonly AgentAnswer[]; plan?: (id: string) => void }) {
  const [role, setRole] = useView<Role | 'all'>('planner.role', 'all', (v) => v === 'all' || ROLES.some((r) => r.id === v));
  const [open, setOpen] = useState('');
  const shown = agents.filter((a) => role === 'all' || agentById(a.id)?.role === role);
  return (
    <div class="agent-list">
      <Segmented<Role | 'all'> label="Role" value={role} onChange={setRole} options={[['all', 'All'], ...ROLES.map((r) => [r.id, r.plural] as const)]} />
      <ol class="agent-rows">
        {shown.map((a) => {
          const ag = agentById(a.id)!;
          const on = open === a.id;
          return (
            <li key={a.id} class={on ? 'open' : ''}>
              <button type="button" class="agent-row" aria-expanded={on} onClick={() => { play('tick'); setOpen(on ? '' : a.id); }}>
                <span class="agent-rank num">{agents.indexOf(a) + 1}</span>
                <AgentIcon id={a.id} size={34} />
                <span class="agent-name"><b>{ag.name}</b><span class="muted small row"><RoleIcon role={ag.role} size={14} />{ROLES.find((r) => r.id === ag.role)!.name}</span></span>
                <Fit fit={a.fit} tier={a.tier} label={`${ag.name}’s fit`} />
              </button>
              {on && (
                <div class="agent-more">
                  <p class="muted">{ag.line}</p>
                  <div class="row wrap"><span class="muted small">Best comp with {ag.name}:</span><TeamIcons team={a.team} size={28} /></div>
                  <div class="row wrap">
                    {plan && <Button size="sm" kind="soft" icon="planner" onClick={() => plan(a.id)}>Plan with {ag.name}</Button>}
                    <Button size="sm" kind="quiet" iconRight="arrow-right" onClick={() => go('agents', a.id)}>About {ag.name}</Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!shown.length && <p class="muted">No agents of this role are in the answers.</p>}
    </div>
  );
}
