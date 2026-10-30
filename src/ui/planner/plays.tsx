/**
 * The plays a comp can run, filled with its agents: a list to choose from (best fit first) and the
 * chosen play's steps beside its routes on the minimap. Pointing at a step (or focusing it) brings its route forward.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { agentById } from '../../core/kb/agents.ts';
import { mapById, POOL, spotName, type Side, type SiteId } from '../../core/kb/maps.ts';
import { KIND_NAMES, playTitle, roundOf } from '../../core/kb/plays.ts';
import { JOB_NAMES, jobWords, playFitLabel, playsFor, WEAK_JOB, type FilledPlay } from '../../core/engine/plays.ts';
import { listJoin } from '../../core/text.ts';
import { AgentIcon } from '../art.tsx';
import { Badge, Segmented, Select } from '../components/controls.tsx';
import { Minimap, ROUTE_COLORS } from '../components/minimap.tsx';
import { Icon } from '../icons.tsx';
import { play } from '../sound.ts';

const fitTone = (fit: number) => ({ 'Fits well': 'good', Works: undefined, 'A stretch': 'warn' } as const)[playFitLabel(fit)];

/**
 * Plays for a team on a map. With no map (any map), a map to look at is chosen here. `onPick` hears
 * of the play on show, so a printed plan can carry the one you chose.
 */
export function PlaysPanel({ team, map: mapId, side: sidePick, sites, onPick }: { team: readonly string[]; map: string; side: Side | 'both'; sites: readonly SiteId[]; onPick?: (f: FilledPlay) => void }) {
  const [own, setOwn] = useState(POOL[0]!.id);
  const [sideOwn, setSide] = useState<Side>('attack');
  const map = mapById(mapId) ?? mapById(own)!;
  const side: Side = sidePick === 'both' ? sideOwn : sidePick;
  // the plays for a bought round, then those for the pistol round and an eco
  const [bought, low] = useMemo(() => [playsFor(team, map.id, side, mapById(mapId) ? sites : []), playsFor(team, map.id, side, [], true)], [team.join(), map.id, side, sites.join()]);
  const list = [...bought, ...low];
  const [pick, setPick] = useState(0);
  useEffect(() => setPick(0), [team.join(), map.id, side]);
  const chosen = list[Math.min(pick, list.length - 1)];
  useEffect(() => { if (chosen) onPick?.(chosen); }, [chosen?.play.id]);
  const rows = (fs: readonly FilledPlay[], from: number) => fs.map((f, i) => (
    <button type="button" role="option" key={f.play.id} aria-selected={f === chosen} class="play-row" onClick={() => { play('tick'); setPick(from + i); }}>
      <span class="play-kind">{KIND_NAMES[f.play.kind]}{f.play.site ? ` ${f.play.site}` : ''}</span>
      <span class="play-name">{f.play.name}</span>
      <Badge tone={fitTone(f.fit)}>{playFitLabel(f.fit)}</Badge>
    </button>
  ));
  return (
    <div class="plays">
      {(!mapById(mapId) || sidePick === 'both') && (
        <div class="row wrap plays-tools">
          {!mapById(mapId) && <Select label="Map for the plays" value={own} onChange={setOwn} options={POOL.map((m) => [m.id, m.name] as const)} />}
          {sidePick === 'both' && <Segmented label="Side for the plays" value={sideOwn} onChange={setSide} options={[['attack', 'Attack'], ['defense', 'Defense']]} />}
          {!mapById(mapId) && <span class="muted small">Plays are for one map; choose one to look at.</span>}
        </div>
      )}
      <div class="play-list" role="listbox" aria-label={`Plays on ${map.name}`}>{rows(bought, 0)}</div>
      {low.length > 0 && <>
        <h3 class="play-group" id={`low-${map.id}-${side}`}>Pistol and eco rounds</h3>
        <div class="play-list" role="listbox" aria-labelledby={`low-${map.id}-${side}`}>{rows(low, bought.length)}</div>
      </>}
      {chosen && <PlayCard f={chosen} key={chosen.play.id} />}
    </div>
  );
}

/** One play: what it is, its steps with who does what, and the routes on the minimap. */
export function PlayCard({ f }: { f: FilledPlay }) {
  const [focus, setFocus] = useState(-1);
  const map = mapById(f.play.map)!;
  const round = roundOf(f.play);
  return (
    <article class="play-card" aria-label={playTitle(f.play)}>
      <div class="play-map">
        <Minimap map={map.id} zoomable routes={f.steps.map((s) => ({ route: s.route }))} focus={focus} onFocus={setFocus} label={`${f.play.name} on the ${map.name} minimap`} />
      </div>
      <div class="play-body">
        <h3>{playTitle(f.play)}</h3>
        <p class="muted">{f.play.about}</p>
        <ol class="play-steps">
          {f.steps.map((s, i) => (
            <li key={i} class={focus === i ? 'focus' : ''} tabIndex={0} onMouseEnter={() => setFocus(i)} onMouseLeave={() => setFocus(-1)} onFocus={() => setFocus(i)} onBlur={() => setFocus(-1)}>
              <span class={`step-dot r${i % ROUTE_COLORS}`} aria-hidden="true">{i + 1}</span>
              <div class="step-text">
                <div class="step-who">
                  {s.who.map((d) => (
                    <span key={d.id} class="step-agent">
                      <AgentIcon id={d.id} size={22} />
                      <b>{agentById(d.id)?.name}</b>
                      <span class="muted">{jobWords(d)}</span>
                      {d.value < WEAK_JOB && <span class="step-weak" data-tip="A stretch: nobody free in this comp is good at this job"><Icon name="warning" size={14} label="A stretch for this comp" /></span>}
                    </span>
                  ))}
                </div>
                <div class="step-route">{s.route.map(spotName).join(' → ')}</div>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        {round && <p class="note"><Icon name="info" size={16} /><span><b>{round.name}.</b> {round.text}</span></p>}
        {f.weak.length > 0 && (
          <p class="play-note"><Icon name="info" size={16} />This comp is light on {listJoin([...new Set(f.weak.map((d) => JOB_NAMES[d.job].toLowerCase()))])} for this play; the steps marked with a warning are a stretch.</p>
        )}
      </div>
    </article>
  );
}
