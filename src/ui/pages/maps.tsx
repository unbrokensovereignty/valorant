/**
 * Maps: every map, and for each one its minimap with callouts, sites, what wins there, what pros
 * play, the best comps for each side and the plays they run.
 */
import { useState } from 'preact/hooks';
import { PageHead } from '../shell.tsx';
import { Badge, Button, Empty, Segmented, Toggle } from '../components/controls.tsx';
import { Minimap } from '../components/minimap.tsx';
import { Icon } from '../icons.tsx';
import { AgentIcon, MapThumb } from '../art.tsx';
import { go, useSettings, useView } from '../state.ts';
import { play } from '../sound.ts';
import { answerFor } from '../solved.ts';
import { planWith } from '../planner/store.ts';
import { CompRow, TeamIcons } from '../planner/comp.tsx';
import { PlaysPanel } from '../planner/plays.tsx';
import { rankWord } from '../planner/words.ts';
import { agentById } from '../../core/kb/agents.ts';
import { mapById, MAPS, type MapInfo, type Side } from '../../core/kb/maps.ts';
import { PRO } from '../../core/kb/pro.ts';
import { DIM_INFO, DIMS, type Dim } from '../../core/kb/roles.ts';
import { MAP_TIPS } from '../../core/kb/tips.ts';
import { needsFor, proMixOf, type RankPick } from '../../core/engine/model.ts';
import { newQuery } from '../../core/engine/query.ts';
import { listJoin } from '../../core/text.ts';
import type { PageProps } from './index.ts';

function MapGrid() {
  const groups: [string, MapInfo[]][] = [['In the pool', MAPS.filter((m) => m.pool)], ['Out of the pool', MAPS.filter((m) => !m.pool)]];
  return (
    <div class="stack">
      {groups.map(([title, maps]) => (
        <section key={title} class="stack">
          <h2>{title}</h2>
          <div class="map-grid map-cards">
            {maps.map((m) => (
              <button type="button" key={m.id} class="map-tile" onClick={() => { play('page'); go('maps', m.id); }}>
                <MapThumb id={m.id} />
                <span class="map-tile-text"><b>{m.name}</b><small>{m.about}</small></span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The strengths a side of the map asks for more than most maps do. */
function extraNeeds(m: MapInfo, side: Side): Dim[] {
  const n = needsFor(m, side, []);
  return DIMS.filter((d) => n[d] >= 0.15).sort((a, b) => n[b] - n[a]).slice(0, 4);
}

function Pro({ m }: { m: MapInfo }) {
  const pro = PRO[m.id];
  if (!pro) return null;
  const picks = Object.entries(pro.picks).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <section class="panel stack">
      <h2>What pros play</h2>
      <ul class="pro-picks">
        {picks.map(([id, pct]) => (
          <li key={id} data-tip={`${agentById(id)?.name ?? id}: picked in ${pct}% of games`}>
            <AgentIcon id={id} size={36} label />
            <span class="num small">{pct}%</span>
          </li>
        ))}
      </ul>
      <h3>Typical comps</h3>
      <ul class="plain-list pro-comps">
        {pro.comps.map((c) => <li key={c.join()}><TeamIcons team={c} size={28} /></li>)}
      </ul>
      <p class="small muted">{pro.dated ? `${m.name} wasn’t in this year’s pro pool, so these are from last year’s play.` : 'From this year’s top events.'}</p>
    </section>
  );
}

function BestComps({ m, side, rank, newAgents }: { m: MapInfo; side: Side; rank: RankPick; newAgents: boolean }) {
  const [open, setOpen] = useState(-1);
  const ans = answerFor({ map: m.id, side, rank, sites: [] }, newAgents);
  if (!ans) return <p class="row muted"><span class="spinner" aria-hidden="true" />Finding the best comps…</p>;
  const q = { ...newQuery(rank, newAgents), map: m.id, side };
  return (
    <ol class="comps">
      {ans.comps.slice(0, 5).map((c, i) => <CompRow key={c.team.join()} c={c} i={i} ans={ans} q={q} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
    </ol>
  );
}

function Plays({ m, side, rank, newAgents }: { m: MapInfo; side: Side; rank: RankPick; newAgents: boolean }) {
  const ans = answerFor({ map: m.id, side, rank, sites: [] }, newAgents);
  const team = ans?.comps[0]?.team;
  if (!team) return null;
  return (
    <section class="stack">
      <div class="row wrap"><h2>Plays</h2><span class="muted small">with the best comp:</span><TeamIcons team={team} size={26} /></div>
      <PlaysPanel team={team} map={m.id} side={side} sites={[]} />
    </section>
  );
}

function MapPage({ m }: { m: MapInfo }) {
  const s = useSettings();
  const [side, setSide] = useView<Side>('maps.side', 'attack', (v) => v === 'attack' || v === 'defense');
  const [names, setNames] = useView<string>('maps.names', 'yes', (v) => v === 'yes' || v === 'no');
  const rank = s.defaultRank as RankPick;
  const tips = MAP_TIPS[m.id]?.[side] ?? [];
  return (
    <>
      <PageHead
        eyebrow={<a href="#/maps" class="row"><Icon name="chevron-left" size={16} />Maps</a>}
        title={m.name}
        actions={<Button kind="primary" icon="planner" onClick={() => planWith({ map: m.id })}>Plan for {m.name}</Button>}>
        <span class="row wrap">{m.pool ? <Badge tone="good">In the pool</Badge> : <Badge>Out of the pool</Badge>}<span class="muted">{m.about}</span></span>
      </PageHead>
      <div class="map-detail">
        <div class="stack">
          <div class="map-big">
            <Minimap map={m.id} labels={names === 'yes' ? 'all' : 'none'} label={`Minimap of ${m.name}${names === 'yes' ? ' with callouts' : ''}`} />
          </div>
          <Toggle checked={names === 'yes'} onChange={(v) => setNames(v ? 'yes' : 'no')} label="Show callouts" />
        </div>
        <div class="stack">
          <section class="panel stack">
            <h2>What wins here</h2>
            <p>{m.keys}</p>
            <dl class="facts">
              {(['attack', 'defense'] as const).map((sd) => {
                const extra = extraNeeds(m, sd);
                return [<dt key={sd + 't'}>{sd === 'attack' ? 'Attack' : 'Defense'} needs</dt>, <dd key={sd + 'd'}>{extra.length ? listJoin(extra.map((d) => DIM_INFO[d].name.toLowerCase())) : 'The usual mix'}</dd>];
              })}
              <dt>Controllers</dt><dd>{Math.round(proMixOf(m.id)?.controller ?? 1) >= 2 ? 'Pros usually run two' : 'Pros usually run one'}</dd>
            </dl>
          </section>
          <section class="panel stack">
            <h2>Sites</h2>
            <ul class="plain-list sites">
              {m.sites.map((site) => (
                <li key={site.id}>
                  <span class="site-id">{site.id}</span>
                  <div class="grow"><p>{site.about}</p></div>
                  <Button size="sm" kind="quiet" onClick={() => planWith({ map: m.id, sites: [site.id] })} label={`Plan for ${site.id} site`}>Plan</Button>
                </li>
              ))}
            </ul>
          </section>
          <Pro m={m} />
        </div>
      </div>

      <div class="row-between wrap map-side">
        <h2>Best comps at {rank === 'any' ? 'all ranks' : rankWord(rank)}</h2>
        <Segmented<Side> label="Side" value={side} onChange={setSide} options={[['attack', 'Attack'], ['defense', 'Defense']]} />
      </div>
      {tips.length > 0 && (
        <ul class="tips map-tips" aria-label={`Tips for ${side === 'attack' ? 'attack' : 'defense'}`}>{tips.map((t) => <li key={t}><span>{t}</span></li>)}</ul>
      )}
      <BestComps m={m} side={side} rank={rank} newAgents={s.includeNew} />
      <Plays m={m} side={side} rank={rank} newAgents={s.includeNew} />
    </>
  );
}

export function MapsPage({ arg }: PageProps) {
  if (arg) {
    const m = mapById(arg);
    if (m) return <MapPage m={m} />;
    return (
      <>
        <PageHead title="Maps" />
        <Empty level={2} title="There’s no such map" actions={<Button onClick={() => go('maps')}>See all maps</Button>}>The link may be from a newer version of Playbook.</Empty>
      </>
    );
  }
  return (
    <>
      <PageHead title="Maps">Callouts, sites, what wins on each map, and the plays to run there.</PageHead>
      <MapGrid />
    </>
  );
}
