/**
 * One comp in the answers: a row with its agents and fit, which opens into why it works (pros,
 * cons and strengths), the plays it can run, and tips. A duo or trio's row shows your party first
 * and the teammates you'd likely get after it.
 */
import { useState } from 'preact/hooks';
import { agentById } from '../../core/kb/agents.ts';
import { mapById } from '../../core/kb/maps.ts';
import { DIM_INFO, ROLES } from '../../core/kb/roles.ts';
import { explainTeam, type StrengthRow } from '../../core/engine/explain.ts';
import { modelFor } from '../../core/engine/model.ts';
import type { CompAnswer, SituationAnswer } from '../../core/engine/plan.ts';
import { playsFor } from '../../core/engine/plays.ts';
import type { Query } from '../../core/engine/query.ts';
import { summaryText } from '../../core/engine/summary.ts';
import { tipsFor } from '../../core/engine/tips.ts';
import { listJoin } from '../../core/text.ts';
import { AgentIcon } from '../art.tsx';
import { Bar, Button, Tabs } from '../components/controls.tsx';
import { prompt } from '../components/overlays.tsx';
import { copyWithToast } from '../files.ts';
import { Icon } from '../icons.tsx';
import { data, go, safely, toast, useSettings } from '../state.ts';
import { play } from '../sound.ts';
import { tourHook } from '../tours/now.ts';
import { PlaysPanel } from './plays.tsx';
import { askedLine, askedTitle, howOften } from './words.ts';

const nameOf = (id: string) => agentById(id)?.name ?? id;

/** A fit as a number and a bar (or only the bar, when numbers are off in Settings). */
export function Fit({ fit, tier, label, compact }: { fit: number; tier: string; label: string; compact?: boolean }) {
  const numbers = useSettings().showNumbers;
  return (
    <span class={`fit${compact ? ' compact' : ''}`}>
      <span class={`tier tier-${tier.toLowerCase()}`} data-tip={`Tier ${tier}`} aria-label={`Tier ${tier}`}>{tier}</span>
      {!(compact && numbers) && <Bar value={fit / 100} size="thin" label={`${label}: ${Math.round(fit)} out of 100`} />}
      {numbers && <span class="fit-num num" aria-label={compact ? `${label}: ${Math.round(fit)} out of 100` : undefined} aria-hidden={compact ? undefined : 'true'}>{Math.round(fit)}</span>}
    </span>
  );
}

/** The agents of a team as portraits, your party's first and marked. */
export function TeamIcons({ team, party = [], size = 40 }: { team: readonly string[]; party?: readonly string[]; size?: number }) {
  const order = [...party, ...team.filter((id) => !party.includes(id))];
  return (
    <span class="team-icons">
      {order.map((id) => (
        <span key={id} class={`team-icon${party.length && !party.includes(id) ? ' other' : ''}`} data-tip={`${nameOf(id)}${party.length ? (party.includes(id) ? ' (your party)' : ' (a likely teammate)') : ''}`}>
          <AgentIcon id={id} size={size} label />
        </span>
      ))}
    </span>
  );
}

export function CompRow({ c, i, ans, q, open, onToggle }: { c: CompAnswer; i: number; ans: SituationAnswer; q: Query; open: boolean; onToggle: () => void }) {
  const party = c.party;
  const names = party.length
    ? <><b>{listJoin(party.map(nameOf))}</b><span class="muted"> with {listJoin(c.team.filter((x) => !party.includes(x)).map(nameOf))} likely</span></>
    : <b>{c.team.map(nameOf).join(', ')}</b>;
  const id = `comp-${i}`;
  return (
    <li class={`comp${open ? ' open' : ''}`}>
      <button type="button" class="comp-head" data-tour={i === 0 ? 'comp-first' : undefined} aria-expanded={open} aria-controls={id} onClick={() => { play(open ? 'close' : 'open'); onToggle(); }}>
        <span class="comp-rank num">{i + 1}</span>
        <TeamIcons team={c.team} party={party} />
        <span class="comp-names">{names}</span>
        <Fit fit={c.fit} tier={c.tier} label={party.length ? `Fit among ${party.length === 2 ? 'duos' : 'trios'}` : 'Fit'} />
        <Icon name="chevron-down" size={18} class="comp-chev" />
      </button>
      {open && <div class="comp-body" id={id}><CompDetail c={c} i={i} ans={ans} q={q} /></div>}
    </li>
  );
}

type Tab = 'why' | 'plays' | 'tips';

/** A comp opened up: pros and cons, plays and tips, with Copy and (unless it's saved already) Save plan. */
export function CompDetail({ c, i, ans, q, saveable = true }: { c: CompAnswer; i: number; ans: SituationAnswer; q: Query; saveable?: boolean }) {
  const [chosen, setTab] = useState<Tab>('why');
  // a tour step about the pros and cons or the strengths shows them
  const tab = tourHook.value === 'comp-reasons' || tourHook.value === 'comp-strengths' ? 'why' : chosen;
  const s = ans.situation;
  const why = explainTeam(modelFor(s), c.team);
  const tips = tipsFor(c.team, s, q.party, c.party);
  const save = async () => {
    const name = await prompt({ title: 'Save this plan', label: 'Name', yes: 'Save', value: `${askedTitle(s)}: ${c.team.map(nameOf).join(', ')}`.slice(0, 60), maxLength: 60 });
    if (!name) return;
    // the plan keeps this situation, even when the question asked for the best map, side or rank
    const saved = safely(() => data().savePlan({ name, query: { ...q, map: s.map, side: s.side, rank: s.rank, sites: [...s.sites] }, team: c.team }));
    if (saved) { play('saved'); toast(`Saved “${saved.name}”.`, { tone: 'good', undo: true, action: { label: 'Open', run: () => go('saved', saved.id) } }); }
    else if (saved === null) toast('There are too many saved plans. Delete some on the Saved page first.', { tone: 'bad' });
  };
  const copy = () => {
    const map = mapById(s.map);
    const side = s.side === 'both' ? 'attack' : s.side;
    const best = map ? playsFor(c.team, map.id, side, s.sites)[0] : undefined;
    void copyWithToast(summaryText({ title: `${askedTitle(s)} · ${askedLine({ ...q, rank: s.rank })}`, team: c.team, party: c.party, fit: c.fit, tier: c.tier, why, play: best, tips }), 'Copied the plan.');
  };
  return (
    <>
      <div class="row-between comp-tools" data-tour="comp-tools">
        <Tabs<Tab> label="About this comp" value={tab} onChange={setTab} tabs={[['why', 'Pros and cons'], ['plays', 'Plays'], ['tips', 'Tips']]} />
        <div class="row">
          <Button size="sm" icon="copy" onClick={copy}>Copy</Button>
          {saveable && <Button size="sm" icon="bookmark" kind="soft" onClick={() => void save()}>Save plan</Button>}
        </div>
      </div>
      {tab === 'why' && <>
        {c.party.length > 0 && <PartyBox c={c} i={i} ans={ans} />}
        <div class="pros-cons" data-tour="comp-reasons">
          <div>
            <h3 class="row good-text"><Icon name="check" size={18} />Pros</h3>
            {why.pros.length ? <ul class="reasons">{why.pros.map((x) => <li key={x}>{x}</li>)}</ul> : <p class="muted">Nothing stands out; it’s a steady, all-round comp.</p>}
          </div>
          <div>
            <h3 class="row bad-text"><Icon name="warning" size={18} />Cons</h3>
            {why.cons.length ? <ul class="reasons">{why.cons.map((x) => <li key={x}>{x}</li>)}</ul> : <p class="muted">No real weak spots for this situation.</p>}
          </div>
        </div>
        {why.notes.map((n) => <p key={n} class="note"><Icon name="info" size={16} />{n}</p>)}
        <Strengths rows={why.strengths} />
      </>}
      {tab === 'plays' && <PlaysPanel team={c.team} map={s.map} side={s.side} sites={s.sites} />}
      {tab === 'tips' && (
        <ul class="tips">
          {tips.map((t) => <li key={t.about + t.text}><b>{t.about}</b><span>{t.text}</span></li>)}
        </ul>
      )}
    </>
  );
}

function PartyBox({ c, i, ans }: { c: CompAnswer; i: number; ans: SituationAnswer }) {
  const expected = c.expected ?? c.fit;
  // only the roles that would lift the team above what you'd expect anyway
  const ask = (i === 0 ? ans.askFor ?? [] : []).filter((a) => a.fit > expected).slice(0, 2);
  const role = (id: string) => ROLES.find((r) => r.id === id)?.name.toLowerCase() ?? id;
  return (
    <div class="party-box">
      <p>
        Your party: <b>{listJoin(c.party.map(nameOf))}</b>. With random teammates, expect a team that fits about <b class="num">{Math.round(expected)}</b> out of 100
        (the best five-stack is 100), give or take {Math.round(c.spread ?? 0)}.
      </p>
      {ask.length > 0 && (
        <p>
          Ask your teammates for a <b>{role(ask[0]!.role)}</b> first: they pick one on their own {howOften(ask[0]!.chance)}, and with one, expect about <span class="num">{Math.round(ask[0]!.fit)}</span>.
          {ask[1] && <> A <b>{role(ask[1].role)}</b> helps next (<span class="num">{Math.round(ask[1].fit)}</span>).</>}
        </p>
      )}
      {c.bestTeam && (
        <div class="row wrap party-best">
          <span class="muted">At best they’d pick</span>
          <TeamIcons team={c.bestTeam} party={c.party} size={28} />
          <span class="muted num">fit {Math.round(c.bestFit ?? 0)}</span>
        </div>
      )}
    </div>
  );
}

/** What the situation needs most and how well the comp covers it. */
function Strengths({ rows }: { rows: readonly StrengthRow[] }) {
  const top = [...rows].sort((a, b) => b.need - a.need).slice(0, 8);
  return (
    <div class="strengths" data-tour="comp-strengths">
      <h3>What this situation needs</h3>
      <table class="strength-table">
        <thead><tr><th scope="col">Need</th><th scope="col">How much</th><th scope="col">Covered</th><th scope="col">By</th></tr></thead>
        <tbody>
          {top.map((r) => (
            <tr key={r.dim}>
              <th scope="row" data-tip={DIM_INFO[r.dim].blurb}>{DIM_INFO[r.dim].name}</th>
              <td><span class="need">{r.need >= 1.4 ? 'A lot' : r.need >= 1 ? 'Some' : 'A little'}</span></td>
              <td><Bar value={r.cover} size="thin" tone={r.cover >= 0.8 ? 'good' : undefined} label={`${DIM_INFO[r.dim].name} covered`} /></td>
              <td class="by">{r.by.length ? r.by.slice(0, 3).map((b) => nameOf(b.id) + (b.abilities.length ? ` (${listJoin(b.abilities)})` : '')).join(', ') : <span class="faint">Nobody</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

