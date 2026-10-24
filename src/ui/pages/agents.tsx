/**
 * Agents: every agent by role, and for each one their kit, what they're strong at, the maps they
 * fit best, who they pair well with (and clash with), tips, and how often they're picked.
 */
import { PageHead } from '../shell.tsx';
import { Badge, Bar, Button, Segmented, Empty } from '../components/controls.tsx';
import { Icon } from '../icons.tsx';
import { AbilityIcon, AgentIcon, MapThumb, RoleIcon } from '../art.tsx';
import { go, useSettings, useView } from '../state.ts';
import { play } from '../sound.ts';
import { answerFor } from '../solved.ts';
import { planWith } from '../planner/store.ts';
import { Fit } from '../planner/comp.tsx';
import { rankWord } from '../planner/words.ts';
import { agentById, AGENTS_BY_NAME, type Agent } from '../../core/kb/agents.ts';
import { kitOf, abilityNames } from '../../core/kb/kits.ts';
import { POOL } from '../../core/kb/maps.ts';
import { PRO } from '../../core/kb/pro.ts';
import { DIM_INFO, DIMS, ROLES, roleOf, type Role } from '../../core/kb/roles.ts';
import { PAIRS, type Pair } from '../../core/kb/synergy.ts';
import { agentTips } from '../../core/engine/tips.ts';
import type { RankPick } from '../../core/engine/model.ts';
import { tierOf } from '../../core/engine/weights.ts';
import { fmtLongDay } from '../../core/dates.ts';
import { listJoin } from '../../core/text.ts';
import type { PageProps } from './index.ts';

type RoleFilter = Role | 'all';

function AgentGrid() {
  const [role, setRole] = useView<RoleFilter>('agents.role', 'all', (v) => v === 'all' || ROLES.some((r) => r.id === v));
  const groups = ROLES.filter((r) => role === 'all' || r.id === role);
  return (
    <>
      <Segmented<RoleFilter> label="Role" value={role} onChange={setRole} options={[['all', 'All'], ...ROLES.map((r) => [r.id, r.plural] as const)]} />
      {groups.map((r) => (
        <section key={r.id} class="agent-role-group">
          <h2 class="row"><RoleIcon role={r.id} size={20} />{r.plural}<span class="muted small">{r.blurb}</span></h2>
          <ul class="agent-cards">
            {AGENTS_BY_NAME.filter((a) => a.role === r.id).map((a) => (
              <li key={a.id}>
                <button type="button" class="agent-card" onClick={() => { play('page'); go('agents', a.id); }}>
                  <AgentIcon id={a.id} size={64} />
                  <span class="agent-card-text">
                    <b>{a.name}</b>
                    <small class="muted">{a.line}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Kit({ a }: { a: Agent }) {
  const kit = kitOf(a.id);
  if (!kit) return null;
  return (
    <section class="panel stack">
      <h2>Abilities</h2>
      <ul class="kit">
        {kit.abilities.map((k) => (
          <li key={k.key + k.name}>
            <span class="kit-icon">{k.key === 'Passive' ? <Icon name="sparkle" size={22} /> : <AbilityIcon agent={a.id} k={k.key} size={30} />}</span>
            <div>
              <b>{k.name}</b> <span class="kit-key">{k.key === 'Passive' ? 'Passive' : k.key}</span>
              <p class="muted small">{k.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Strengths({ a }: { a: Agent }) {
  const rows = DIMS.map((d) => ({ d, v: a.caps[d] })).filter((x) => x.v >= 0.15).sort((x, y) => y.v - x.v);
  return (
    <section class="panel stack">
      <h2>Strengths</h2>
      <table class="agent-strengths">
        <tbody>
          {rows.map(({ d, v }) => {
            const via = abilityNames(a.id, a.via[d] ?? '');
            return (
              <tr key={d}>
                <th scope="row" data-tip={DIM_INFO[d].blurb}>{DIM_INFO[d].name}</th>
                <td><Bar value={v} size="thin" tone={v >= 0.75 ? 'good' : undefined} label={`${DIM_INFO[d].name}: ${Math.round(v * 100)} out of 100`} /></td>
                <td class="muted small">{via.length ? listJoin(via) : (a.via[d] ?? '').includes('G') ? 'Gun play' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p class="small muted">From 0 (none) to the best in the game at it. {a.estimate ? 'These are early estimates.' : ''}</p>
    </section>
  );
}

function BestMaps({ a, rank, newAgents }: { a: Agent; rank: RankPick; newAgents: boolean }) {
  const rows = POOL.map((m) => {
    const ans = answerFor({ map: m.id, side: 'both', rank, sites: [] }, newAgents);
    return { m, fit: ans?.agents.find((x) => x.id === a.id)?.fit };
  });
  const ready = rows.every((r) => r.fit !== undefined);
  const sorted = ready ? [...rows].sort((x, y) => y.fit! - x.fit!) : rows;
  return (
    <section class="panel stack">
      <div class="row-between"><h2>Best maps</h2>{!ready && <span class="spinner" aria-label="Working it out" />}</div>
      <ul class="plain-list best-maps">
        {sorted.map(({ m, fit }) => (
          <li key={m.id}>
            <button type="button" class="list-row" onClick={() => planWith({ map: m.id, include: [a.id], newAgents: newAgents || !!a.estimate })}>
              <MapThumb id={m.id} class="small" />
              <span class="list-row-text"><b>{m.name}</b>{(PRO[m.id]?.picks[a.id] ?? 0) >= 30 && <small class="muted">Pros pick {a.name} in {PRO[m.id]!.picks[a.id]}% of games here</small>}</span>
              {fit !== undefined ? <Fit fit={fit} tier={tierOf(fit)} label={`${a.name} on ${m.name}`} compact /> : <span class="faint small">…</span>}
            </button>
          </li>
        ))}
      </ul>
      <p class="small muted">For a five-stack, both sides, at {rank === 'any' ? 'all ranks' : rankWord(rank)}. Pick a map to plan with {a.name} there.</p>
    </section>
  );
}

function Partners({ a }: { a: Agent }) {
  const mine = PAIRS.filter((p) => p.a === a.id || p.b === a.id);
  const other = (p: Pair) => (p.a === a.id ? p.b : p.a);
  const good = mine.filter((p) => p.strength > 0).sort((x, y) => y.strength - x.strength);
  const bad = mine.filter((p) => p.strength < 0).sort((x, y) => x.strength - y.strength);
  const row = (p: Pair) => {
    const o = agentById(other(p));
    if (!o) return null;
    return (
      <li key={o.id}>
        <button type="button" class="pair-row" onClick={() => go('agents', o.id)}>
          <AgentIcon id={o.id} size={32} />
          <span><b>{o.name}</b>{p.side !== 'both' && <span class="muted small"> · on {p.side}</span>}<small class="muted">{p.why}</small></span>
        </button>
      </li>
    );
  };
  if (!mine.length) return null;
  return (
    <section class="panel stack">
      <h2>Partners</h2>
      {good.length > 0 && <><h3 class="row good-text"><Icon name="check" size={16} />Works well with</h3><ul class="plain-list pairs">{good.map(row)}</ul></>}
      {bad.length > 0 && <><h3 class="row bad-text"><Icon name="warning" size={16} />Gets in the way of</h3><ul class="plain-list pairs">{bad.map(row)}</ul></>}
    </section>
  );
}

function AgentPage({ a }: { a: Agent }) {
  const s = useSettings();
  const rank = s.defaultRank as RankPick;
  const tips = agentTips(a.id);
  const kit = kitOf(a.id);
  const newAgents = s.includeNew || !!a.estimate;
  return (
    <>
      <PageHead
        eyebrow={<a href="#/agents" class="row"><Icon name="chevron-left" size={16} />Agents</a>}
        title={<span class="row agent-title"><AgentIcon id={a.id} size={56} />{a.name}</span>}
        actions={<Button kind="primary" icon="planner" onClick={() => planWith({ include: [a.id], newAgents })}>Plan with {a.name}</Button>}>
        <span class="row wrap agent-sub">
          <span class="row"><RoleIcon role={a.role} size={16} />{roleOf(a.role).name}</span>
          {a.estimate && <Badge tone="accent" icon="sparkle">New: early estimates</Badge>}
          <span class="muted">{a.line}</span>
        </span>
      </PageHead>
      <div class="agent-detail">
        <div class="stack">
          {kit?.about && <p class="agent-about">{kit.about}</p>}
          <Kit a={a} />
          <Strengths a={a} />
        </div>
        <div class="stack">
          <BestMaps a={a} rank={rank} newAgents={newAgents} />
          <Partners a={a} />
          {tips.length > 0 && (
            <section class="panel stack">
              <h2>Tips</h2>
              <ul class="tips">{tips.map((t) => <li key={t}><span>{t}</span></li>)}</ul>
            </section>
          )}
          <section class="panel stack">
            <h2>How often they’re picked</h2>
            <dl class="facts">
              <dt>In ranked</dt><dd>{a.estimate ? 'Not known yet' : `${a.pop}% of all picks`}</dd>
              <dt>By pros</dt><dd>{a.estimate ? 'Not known yet' : `${a.pro}% of maps at the year’s top events`}</dd>
              <dt>Released</dt><dd>{fmtLongDay(a.released)}</dd>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

export function AgentsPage({ arg }: PageProps) {
  if (arg) {
    const a = agentById(arg);
    if (a) return <AgentPage a={a} />;
    return (
      <>
        <PageHead title="Agents" />
        <Empty title="There’s no such agent" actions={<Button onClick={() => go('agents')}>See all agents</Button>}>The link may be from a newer version of Playbook.</Empty>
      </>
    );
  }
  return (
    <>
      <PageHead title="Agents">Every agent’s kit, strengths, best maps and partners.</PageHead>
      <div class="stack agents-page"><AgentGrid /></div>
    </>
  );
}
