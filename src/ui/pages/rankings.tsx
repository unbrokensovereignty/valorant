/**
 * Rankings: tier lists of agents, the top comps, and every agent's fit on every map, for a map,
 * side and rank of your choosing (a five-stack with nothing else fixed).
 */
import { useState } from 'preact/hooks';
import { PageHead } from '../shell.tsx';
import { Segmented, Select, Tabs, Toggle } from '../components/controls.tsx';
import { AgentIcon, MapThumb, RoleIcon } from '../art.tsx';
import { go, useSettings, useView } from '../state.ts';
import { play } from '../sound.ts';
import { answerFor, answerNow } from '../solved.ts';
import { CompRow } from '../planner/comp.tsx';
import { mapWord, rankWord, sideWord } from '../planner/words.ts';
import { agentById, AGENTS_BY_NAME } from '../../core/kb/agents.ts';
import { isMap, MAPS, POOL } from '../../core/kb/maps.ts';
import { NEW_AGENTS } from '../../core/kb/new-agents.ts';
import { isRank, RANKS, type RankId } from '../../core/kb/ranks.ts';
import { ROLES, type Role } from '../../core/kb/roles.ts';
import type { RankPick, SidePick, Situation } from '../../core/engine/model.ts';
import type { AgentAnswer } from '../../core/engine/plan.ts';
import { newQuery } from '../../core/engine/query.ts';
import { TIERS, tierOf } from '../../core/engine/weights.ts';
import { listJoin } from '../../core/text.ts';
import { mean } from '../../core/util.ts';
import type { PageProps } from './index.ts';

type Tab = 'agents' | 'comps' | 'maps';
type RoleFilter = Role | 'all';

const isSide = (v: string): v is SidePick => v === 'both' || v === 'attack' || v === 'defense';
const nameOf = (id: string) => agentById(id)?.name ?? id;

/** Agents grouped into tiers, S first. */
function TierList({ agents }: { agents: readonly AgentAnswer[] }) {
  const numbers = useSettings().showNumbers;
  return (
    <div class="tier-list">
      {TIERS.map((t) => {
        const here = agents.filter((a) => a.tier === t.id);
        return (
          <div key={t.id} class="tier-row">
            <span class={`tier tier-${t.id.toLowerCase()} tier-big`} aria-label={`Tier ${t.id}`}>{t.id}</span>
            <ul class="tier-agents" aria-label={`Tier ${t.id}: ${here.length ? listJoin(here.map((a) => nameOf(a.id))) : 'nobody'}`}>
              {here.map((a) => (
                <li key={a.id}>
                  <button type="button" class="tier-agent" data-tip={`${nameOf(a.id)}: fit ${Math.round(a.fit)}`} onClick={() => { play('page'); go('agents', a.id); }}>
                    <AgentIcon id={a.id} size={48} />
                    <span class="tier-agent-name">{nameOf(a.id)}</span>
                    {numbers && <span class="muted small num">{Math.round(a.fit)}</span>}
                  </button>
                </li>
              ))}
              {!here.length && <li class="faint small tier-empty">Nobody</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Every agent's fit on every map, as a table colored by tier. */
function ByMap({ side, rank, newAgents, all, role }: { side: SidePick; rank: RankPick; newAgents: boolean; all: boolean; role: RoleFilter }) {
  const numbers = useSettings().showNumbers;
  const maps = all ? MAPS : POOL;
  const answers = maps.map((m) => answerFor({ map: m.id, side, rank, sites: [] }, newAgents));
  const ready = answers.filter((a) => !!a).length;
  const fitOn = (k: number, id: string) => answers[k]?.agents.find((a) => a.id === id)?.fit;
  const rows = AGENTS_BY_NAME
    .filter((a) => (newAgents || !a.estimate) && (role === 'all' || a.role === role))
    .map((a) => {
      const fits = maps.map((_, k) => fitOn(k, a.id));
      const known = fits.filter((f): f is number => f !== undefined);
      return { a, fits, avg: known.length ? mean(known) : -1 };
    })
    .sort((x, y) => y.avg - x.avg || x.a.name.localeCompare(y.a.name));
  return (
    <div class="stack">
      {ready < maps.length && <p class="row muted small" role="status"><span class="spinner" aria-hidden="true" />Working out {maps.length - ready} of {maps.length} maps…</p>}
      <div class="heat-wrap">
        <table class="heat">
          <thead>
            <tr>
              <th scope="col" class="heat-agent">Agent</th>
              {maps.map((m) => <th key={m.id} scope="col"><button type="button" class="heat-map" onClick={() => go('maps', m.id)} data-tip={`About ${m.name}`}><MapThumb id={m.id} class="tiny" /><span>{m.name}</span></button></th>)}
              <th scope="col">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, fits, avg }) => (
              <tr key={a.id}>
                <th scope="row" class="heat-agent">
                  <button type="button" class="heat-name" onClick={() => go('agents', a.id)}><AgentIcon id={a.id} size={26} /><span>{a.name}</span><RoleIcon role={a.role} size={14} /></button>
                </th>
                {fits.map((f, k) => (
                  <td key={maps[k]!.id} class={f === undefined ? 'heat-cell wait' : `heat-cell heat-${tierOf(f).toLowerCase()}`}
                    aria-label={f === undefined ? 'Working it out' : `${a.name} on ${maps[k]!.name}: tier ${tierOf(f)}, fit ${Math.round(f)}`}>
                    {f === undefined ? '' : numbers ? Math.round(f) : tierOf(f)}
                  </td>
                ))}
                <td class="heat-avg num">{avg < 0 ? '' : numbers ? Math.round(avg) : tierOf(avg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="small muted">An agent’s fit on a map comes from the best comp they fit into there. Pick an agent or a map for more.</p>
    </div>
  );
}

export function RankingsPage(_p: PageProps) {
  const s = useSettings();
  const [tab, setTab] = useView<Tab>('rankings.tab', 'agents', (v) => v === 'agents' || v === 'comps' || v === 'maps');
  const [map, setMap] = useView<string>('rankings.map', 'any', (v) => v === 'any' || isMap(v));
  const [side, setSide] = useView<SidePick>('rankings.side', 'both', isSide);
  const [rank, setRank] = useView<string>('rankings.rank', s.defaultRank, (v) => v === 'any' || isRank(v));
  const [role, setRole] = useView<RoleFilter>('rankings.role', 'all', (v) => v === 'all' || ROLES.some((r) => r.id === v));
  const [fresh, setFresh] = useView<string>('rankings.new', s.includeNew ? 'yes' : 'no', (v) => v === 'yes' || v === 'no');
  const [allMaps, setAllMaps] = useView<string>('rankings.all', 'no', (v) => v === 'yes' || v === 'no');
  const [open, setOpen] = useState(0);
  const newAgents = fresh === 'yes';
  const situation: Situation = { map, side, rank: rank as RankPick, sites: [] };
  // the by-map table works its maps out in the background; the rest is one situation, answered now
  const ans = tab === 'maps' ? undefined : answerNow(situation, newAgents);
  const q = { ...newQuery(rank as RankPick, newAgents), map, side };
  const agents = ans ? ans.agents.filter((a) => role === 'all' || agentById(a.id)?.role === role) : [];
  const where = `${tab === 'maps' ? 'Every map' : mapWord(map)}, ${sideWord(side).toLowerCase()}, ${rankWord(rank)}`;
  return (
    <>
      <PageHead title="Rankings">Tier lists for a five-stack. Change the map, side or rank to see how they move.</PageHead>
      <div class="rank-controls panel">
        {tab !== 'maps' && (
          <Select label="Map" value={map} onChange={(v) => { setMap(v); setOpen(0); }}
            options={[['any', 'Any map in the pool'], ...POOL.map((m) => [m.id, m.name] as const), ...MAPS.filter((m) => !m.pool).map((m) => [m.id, `${m.name} (out of the pool)`] as const)]} />
        )}
        <Segmented<SidePick> label="Side" value={side} onChange={(v) => { setSide(v); setOpen(0); }} options={[['both', 'Both sides'], ['attack', 'Attack'], ['defense', 'Defense']]} />
        <Select label="Rank" value={rank} onChange={(v) => { setRank(v); setOpen(0); }} options={[['any', 'All ranks'], ...RANKS.map((r) => [r.id, r.name] as [RankId, string])]} />
        {NEW_AGENTS.length > 0 && <Toggle checked={newAgents} onChange={(v) => setFresh(v ? 'yes' : 'no')} label={`Include ${listJoin(NEW_AGENTS.map((a) => a.name))}`} />}
        {tab === 'maps' && <Toggle checked={allMaps === 'yes'} onChange={(v) => setAllMaps(v ? 'yes' : 'no')} label={`All ${MAPS.length} maps`} />}
      </div>
      <div class="row-between wrap rank-tabs">
        <Tabs<Tab> label="Rankings" value={tab} onChange={setTab} tabs={[['agents', 'Agents'], ['comps', 'Comps'], ['maps', 'Agents by map']]} />
        {tab !== 'comps' && <Segmented<RoleFilter> label="Role" value={role} onChange={setRole} options={[['all', 'All'], ...ROLES.map((r) => [r.id, r.plural] as const)]} />}
      </div>
      <h2 class="rank-where">{where}</h2>
      <div class="tab-body" key={tab}>
        {tab === 'agents' && ans && <TierList agents={agents} />}
        {tab === 'comps' && ans && (
          <ol class="comps">
            {ans.comps.map((c, i) => <CompRow key={c.team.join()} c={c} i={i} ans={ans} q={q} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
          </ol>
        )}
        {tab === 'maps' && <ByMap side={side} rank={rank as RankPick} newAgents={newAgents} all={allMaps === 'yes'} role={role} />}
      </div>
    </>
  );
}

