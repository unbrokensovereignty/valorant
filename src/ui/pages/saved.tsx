/**
 * Saved: your saved plans (each opens to its comp's pros and cons, plays and tips, with a note
 * of your own), your parties (the people you queue with and the agents each of them plays), and
 * the answers you flagged as looking wrong.
 */
import { useState } from 'preact/hooks';
import { PageHead } from '../shell.tsx';
import { Button, CancelButton, Empty, Field, IconButton, Segmented, Tabs, TextInput } from '../components/controls.tsx';
import { confirm, DialogLayout, prompt, UNDO_NOTE } from '../components/overlays.tsx';
import { AgentChips } from '../components/pickers.tsx';
import { Icon } from '../icons.tsx';
import { AgentIcon } from '../art.tsx';
import { data, go, openDialog, safely, toast, watch } from '../state.ts';
import { copyWithToast } from '../files.ts';
import { play } from '../sound.ts';
import { openPlanner, planWith } from '../planner/store.ts';
import { CompDetail, Fit, TeamIcons } from '../planner/comp.tsx';
import { askedLine, askedTitle, partyWord } from '../planner/words.ts';
import { agentById } from '../../core/kb/agents.ts';
import type { RankId } from '../../core/kb/ranks.ts';
import { LIMITS, poolsOf, type Flag, type Party, type Player, type SavedPlan } from '../../core/saved.ts';
import type { Situation } from '../../core/engine/model.ts';
import { teamFit, type CompAnswer, type SituationAnswer } from '../../core/engine/plan.ts';
import type { PartySize } from '../../core/engine/query.ts';
import { fmtDay, fmtLongDay, keyOf } from '../../core/dates.ts';
import { listJoin } from '../../core/text.ts';
import { plural } from '../../core/util.ts';
import type { PageProps } from './index.ts';

type Tab = 'plans' | 'parties' | 'flagged';

/** The one situation a saved plan is about (a plan saved from "the best map" keeps the map it picked). */
function situationOf(p: SavedPlan): Situation {
  const q = p.query;
  const rank = q.rank === 'best' ? data().settings().defaultRank as RankId : q.rank;
  return { map: q.map === 'best' ? 'any' : q.map, side: q.side === 'best' ? 'both' : q.side, rank, sites: q.sites, enemy: q.enemy };
}

// ---------------------------------------------------------------- plans

function PlanDetail({ p }: { p: SavedPlan }) {
  const [note, setNote] = useState(p.note);
  const s = situationOf(p);
  const r = data();
  const rename = async () => {
    const name = await prompt({ title: 'Rename this plan', label: 'Name', yes: 'Rename', value: p.name, maxLength: LIMITS.name });
    if (name && name !== p.name) safely(() => r.updatePlan(p.id, { name }));
  };
  const remove = () => safely(() => {
    r.deletePlans([p.id]);
    go('saved');
    toast(`Deleted “${p.name}”.`, { undo: true });
  });
  const comp = (): { c: CompAnswer; ans: SituationAnswer } => {
    const { fit, tier } = teamFit(s, p.team, p.query.newAgents || p.team.some((id) => agentById(id)?.estimate));
    const c: CompAnswer = { team: p.team, party: [], fit, tier, score: 0 };
    return { c, ans: { situation: s, ref: { best: 0, mid: 0 }, comps: [c], agents: [], count: 1 } };
  };
  const filled = p.team.length === 5 ? comp() : null;
  return (
    <article class="panel stack plan-detail" aria-label={p.name}>
      <div class="row-between plan-head">
        <div class="grow">
          <h2>{p.name}</h2>
          <p class="muted small">{askedTitle(s)} · {askedLine(p.query)} · saved {fmtDay(keyOf(new Date(p.created)), keyOf(new Date()))}</p>
        </div>
        <div class="row">
          <IconButton icon="star" label="Star" pressed={p.starred} class="star-toggle" onClick={() => safely(() => r.updatePlan(p.id, { starred: !p.starred }))} />
          <IconButton icon="edit" label="Rename" onClick={() => void rename()} />
          <IconButton icon="trash" label="Delete" onClick={remove} />
        </div>
      </div>
      {filled && (
        <div class="row wrap plan-team">
          <TeamIcons team={p.team} size={40} />
          <Fit fit={filled.c.fit} tier={filled.c.tier} label="Fit" />
        </div>
      )}
      <div class="row wrap">
        <Button kind="soft" icon="planner" onClick={() => openPlanner(p.query)}>Open in the Planner</Button>
      </div>
      <Field label="Note" for={`note-${p.id}`} help="Who plays what, the lineups you use, anything to remember.">
        <textarea id={`note-${p.id}`} class="input" value={note} maxLength={LIMITS.note} rows={3}
          onInput={(e) => { const v = (e.target as HTMLTextAreaElement).value; setNote(v); safely(() => r.updatePlan(p.id, { note: v })); }} />
      </Field>
      {filled && <CompDetail c={filled.c} i={0} ans={filled.ans} q={p.query} saveable={false} plan={{ name: p.name, note }} />}
    </article>
  );
}

function Plans({ open }: { open: string }) {
  const r = watch('plans');
  const plans = r.plans();
  const chosen = plans.find((p) => p.id === open);
  if (!plans.length) {
    return (
      <Empty level={2} title="No saved plans yet" actions={<Button kind="primary" icon="planner" onClick={() => go('planner')}>Open the Planner</Button>}>
        Open a comp on the Planner and press Save plan to keep it here, with its plays, tips and a note of your own.
      </Empty>
    );
  }
  return (
    <div class="saved-layout">
      <ul class="plain-list saved-list" aria-label="Saved plans">
        {plans.map((p) => (
          <li key={p.id}>
            <button type="button" class={`list-row${p.id === open ? ' current' : ''}`} aria-current={p.id === open ? 'true' : undefined} onClick={() => { play('tick'); go('saved', p.id); }}>
              <span class="list-row-text">
                <b>{p.starred && <Icon name="star" size={14} class="star-on" />}{p.name}</b>
                <small class="muted">{askedTitle(situationOf(p))} · {askedLine(p.query)}</small>
                {p.team.length > 0 && <TeamIcons team={p.team} size={22} />}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {chosen ? <PlanDetail key={chosen.id} p={chosen} /> : <p class="muted saved-pick">Pick a plan to see its comp, plays and tips.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- parties

const sizeOf = (n: number): PartySize => (n === 2 ? 2 : n === 3 ? 3 : 5);

function PartyEditor({ initial, close }: { initial: Party | null; close: (v?: unknown) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  // a new party starts with you, playing the agents you play (Settings → You)
  const [players, setPlayers] = useState<Player[]>(initial?.players.map((x) => ({ ...x, agents: [...x.agents] })) ?? [{ name: 'Me', agents: [...data().settings().myAgents] }, { name: 'Player 2', agents: [] }]);
  const resize = (n: PartySize) => setPlayers((ps) => Array.from({ length: n }, (_, i) => ps[i] ?? { name: `Player ${i + 1}`, agents: [] }));
  const set = (i: number, patch: Partial<Player>) => setPlayers((ps) => ps.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const save = () => {
    const out = safely(() => data().saveParty({ id: initial?.id, name: name.trim() || 'My party', players }));
    if (out === null) { toast(`You can keep up to ${LIMITS.parties} parties. Delete one first.`, { tone: 'bad' }); return; }
    if (out) { play('saved'); toast(initial ? `Saved “${out.name}”.` : `Made the party “${out.name}”.`, { tone: 'good', undo: true }); close(out); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }}>
      <DialogLayout title={initial ? 'Edit the party' : 'Make a party'} icon="users" close={() => close()} foot={<>
        <CancelButton onClick={() => close()} />
        <Button kind="primary" type="submit" sound={false}>{initial ? 'Save' : 'Make the party'}</Button>
      </>}>
        <div class="stack party-editor">
          <Field label="Name" for="party-name">
            <TextInput id="party-name" value={name} onInput={setName} placeholder="Friday squad" maxLength={LIMITS.name} autoFocus />
          </Field>
          <Field label="How many of you">
            <Segmented<string> label="Party size" value={String(players.length)} onChange={(v) => resize(Number(v) as PartySize)} options={[['2', 'Duo'], ['3', 'Trio'], ['5', 'Five-stack']]} />
          </Field>
          <div class="stack">
            {players.map((x, i) => (
              <div key={i} class="party-player">
                <TextInput value={x.name} onInput={(v) => set(i, { name: v })} label={`Player ${i + 1}’s name`} maxLength={LIMITS.name} />
                <AgentChips ids={x.agents} empty="Choose agents" onChange={(agents) => set(i, { agents })}
                  o={{ title: `Agents ${x.name || `player ${i + 1}`} plays`, max: LIMITS.pool, line: 'Plans for the party only give each player one of their agents. Leave it empty for anyone.' }} />
              </div>
            ))}
          </div>
          <p class="small muted">A player with no agents chosen can play anyone.</p>
        </div>
      </DialogLayout>
    </form>
  );
}

export const editParty = (p: Party | null) => openDialog<Party>(p ? 'Edit the party' : 'Make a party', (close) => <PartyEditor initial={p} close={close} />, { wide: true });

function Parties() {
  const r = watch('parties');
  const parties = r.parties();
  const remove = async (p: Party) => {
    const yes = await confirm({ title: `Delete “${p.name}”?`, yes: 'Delete', danger: true, body: <p>Saved plans made for this party keep their agents. {UNDO_NOTE}</p> });
    if (yes) safely(() => { r.deleteParty(p.id); toast(`Deleted “${p.name}”.`, { undo: true }); });
  };
  return (
    <div class="stack">
      <div><Button kind="primary" icon="plus" tour="party-make" onClick={() => void editParty(null)}>Make a party</Button></div>
      {parties.length ? (
        <ul class="plain-list party-list">
          {parties.map((p) => (
            <li key={p.id} class="panel party-row">
              <div class="grow stack" style={{ gap: '8px' }}>
                <div><b>{p.name}</b> <span class="muted small">{partyWord(sizeOf(p.players.length))}</span></div>
                <ul class="plain-list party-players">
                  {p.players.map((x, i) => (
                    <li key={i}>
                      <span class="party-player-name">{x.name}</span>
                      {x.agents.length
                        ? <span class="row wrap" style={{ gap: '4px' }} aria-label={listJoin(x.agents.map((id) => agentById(id)?.name ?? id))}>{x.agents.map((id) => <AgentIcon key={id} id={id} size={26} />)}</span>
                        : <span class="muted small">Any agent</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div class="row party-actions">
                <Button size="sm" kind="soft" icon="planner" onClick={() => planWith({ party: sizeOf(p.players.length), pools: poolsOf(p) })}>Plan</Button>
                <IconButton icon="edit" label={`Edit ${p.name}`} onClick={() => void editParty(p)} />
                <IconButton icon="trash" label={`Delete ${p.name}`} onClick={() => void remove(p)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p class="muted">Save the people you queue with, and the agents each of you plays. Plans for the party then give each player one of their own agents.</p>
      )}
      <p class="small muted">{plural(parties.length, 'party', 'parties')} of {LIMITS.parties} at most.</p>
    </div>
  );
}

// ---------------------------------------------------------------- flagged

/** What a flag is about, and the question it came from: "Comp: Raze, Fade, Viper, Omen, Chamber". */
const aboutOf = (f: Flag) => (f.agent ? `Agent: ${agentById(f.agent)?.name ?? f.agent}` : `Comp: ${f.team.map((id) => agentById(id)?.name ?? id).join(', ')}`);
const askedOf = (f: Flag) => `${askedTitle(f.query)} · ${askedLine(f.query)}`;

/** Every flag as plain text, to send on. */
function flagsText(flags: readonly Flag[]): string {
  const lines = [`Playbook ${__APP_VERSION__}: ${plural(flags.length, 'flagged answer')}`];
  flags.forEach((f, i) => lines.push('', `${i + 1}. ${askedOf(f)}`, `${aboutOf(f)} (${f.shown})`, `Note: ${f.note}`, `Flagged ${fmtLongDay(keyOf(new Date(f.created)))}`));
  return lines.join('\n');
}

function Flagged() {
  const r = watch('meta');
  const flags = r.flags();
  const remove = (f: Flag) => safely(() => { r.deleteFlag(f.id); toast('Deleted the flag.', { undo: true }); });
  if (!flags.length) {
    return (
      <Empty level={2} title="Nothing flagged yet" actions={<Button kind="primary" icon="planner" onClick={() => go('planner')}>Open the Planner</Button>}>
        When a comp or an agent’s rating looks wrong, press This looks wrong on it and say why. The note is kept here with the question and what Playbook showed, and goes into backups.
      </Empty>
    );
  }
  return (
    <div class="stack">
      <div class="row wrap">
        <Button icon="copy" onClick={() => void copyWithToast(flagsText(flags), `Copied ${plural(flags.length, 'flag')}.`)}>Copy all</Button>
        <span class="muted small">Paste them into a message, or send a backup (Settings → Data), to have them checked.</span>
      </div>
      <ul class="plain-list flag-list" aria-label="Flagged answers">
        {flags.map((f) => (
          <li key={f.id} class="panel flag-row">
            <div class="grow stack" style={{ gap: '6px' }}>
              <p><b>{f.note}</b></p>
              <div class="row wrap flag-about">
                {f.agent ? <AgentIcon id={f.agent} size={26} /> : <TeamIcons team={f.team} size={26} />}
                <span class="muted small">{aboutOf(f)} · {f.shown}</span>
              </div>
              <p class="muted small">{askedOf(f)} · flagged {fmtDay(keyOf(new Date(f.created)), keyOf(new Date()))}</p>
            </div>
            <div class="row flag-actions">
              <Button size="sm" kind="soft" icon="planner" onClick={() => openPlanner(f.query)}>Open in the Planner</Button>
              <IconButton icon="trash" label="Delete this flag" onClick={() => remove(f)} />
            </div>
          </li>
        ))}
      </ul>
      <p class="small muted">{plural(flags.length, 'flag')} of {LIMITS.flags} at most.</p>
    </div>
  );
}

export function SavedPage({ arg }: PageProps) {
  const tab: Tab = arg === 'parties' ? 'parties' : arg === 'flagged' ? 'flagged' : 'plans';
  return (
    <>
      <PageHead title="Saved">Your saved plans, the parties you play with, and answers you flagged.</PageHead>
      <Tabs<Tab> label="Saved" tour="saved-tabs" value={tab} onChange={(t) => go('saved', t === 'plans' ? '' : t)} tabs={[['plans', 'Plans'], ['parties', 'Parties'], ['flagged', 'Flagged']]} />
      <div class="tab-body" key={tab}>
        {tab === 'plans' ? <Plans open={arg} /> : tab === 'parties' ? <Parties /> : <Flagged />}
      </div>
    </>
  );
}
