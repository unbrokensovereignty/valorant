/**
 * Help: a guide to how the Planner thinks and where its numbers come from, the guided tours, every
 * keyboard shortcut, and About (version, storage, problems, licenses and the notice for the game's art).
 */
import { PageHead } from '../shell.tsx';
import { Button, Kbd, Tabs } from '../components/controls.tsx';
import { Icon } from '../icons.tsx';
import { startTour, tourDone } from '../tours/engine.tsx';
import { TOURS, type TourGroup } from '../tours/list.ts';
import { backendKind, errors, go, tabRole, watch } from '../state.ts';
import { copyWithToast, download, datedName } from '../files.ts';
import { openWhatsNew } from '../components/whatsnew.tsx';
import { AGENTS, STATS_ON } from '../../core/kb/agents.ts';
import { MAPS, PATCH, POOL, POOL_SINCE, mapById } from '../../core/kb/maps.ts';
import { NEW_AGENTS } from '../../core/kb/new-agents.ts';
import { PRO, PRO_MAPS_COUNTED, proKnown } from '../../core/kb/pro.ts';
import { BUY_GUIDE, PLAYS, isLowBuy } from '../../core/kb/plays.ts';
import { RANKS, rankOf } from '../../core/kb/ranks.ts';
import { kitShare, proLean } from '../../core/engine/model.ts';
import { SINCE_FROM, SINCE_MOVE } from '../../core/engine/since.ts';
import { UNSETTLED } from '../../core/engine/sure.ts';
import { FIT_MID, PRO_GAMES, SECOND_CONTROLLER, SURE, WIN_CAP, WIN_RANKS } from '../../core/engine/weights.ts';
import { tierWords } from '../planner/words.ts';
import { fmtLongDay } from '../../core/dates.ts';
import { listJoin } from '../../core/text.ts';
import { plural } from '../../core/util.ts';
import type { PageProps } from './index.ts';

type Tab = 'guide' | 'tours' | 'keys' | 'about';

const GLOBAL_KEYS: readonly [string, string][] = [
  ['ctrl+k', 'Search pages, agents, maps, saved plans, settings and actions'],
  ['/', 'Search'],
  ['ctrl+z', 'Undo'],
  ['ctrl+shift+z', 'Redo (Ctrl Y works too)'],
  ['ctrl+\\', 'Narrow or widen the sidebar'],
  ['?', 'This list'],
  ['escape', 'Close a dialog or menu'],
];

const LIST_KEYS: readonly [string, string][] = [
  ['tab', 'Move to the next control; Shift Tab goes back'],
  ['enter', 'Press the button or open the row that has focus (Space works too)'],
  ['arrowdown', 'Move through a menu, a set of choices or the search results; the up arrow goes back'],
  ['home', 'The first item of a menu; End the last'],
  ['arrowright', 'The next tab or choice in a row of them; the left arrow goes back'],
];

const TOUR_GROUPS: readonly [TourGroup, string][] = [['basics', 'Start here'], ['pages', 'The pages']];

function Tours() {
  watch('meta');
  return (
    <div class="stack">
      <p class="muted tours-intro">Each tour lights up one thing at a time on the real screens. Press <Kbd k=" " /> for the next step, <Kbd k="arrowleft" /> to go back and <Kbd k="escape" /> to stop.</p>
      {TOUR_GROUPS.map(([g, title]) => (
        <section class="panel" key={g} data-tour={g === 'pages' ? 'tours-list' : undefined}>
          <h2>{title}</h2>
          <ul class="tour-list">
            {TOURS.filter((t) => t.group === g).map((t) => {
              const done = tourDone(t.id);
              return (
                <li key={t.id} class="tour-row">
                  <span class={`tour-done${done ? ' on' : ''}`} aria-hidden="true">{done && <Icon name="check" size={14} />}</span>
                  <div class="grow">
                    <b>{t.name}</b>{done && <span class="visually-hidden"> (taken)</span>}
                    <small class="muted">{t.blurb}</small>
                  </div>
                  <Button id={`start-tour-${t.id}`} size="sm" kind={done ? 'secondary' : 'primary'} icon="play" onClick={() => startTour(t.id)}
                    label={`${done ? 'Replay' : 'Start'} the ${t.name} tour`}>{done ? 'Replay' : 'Start'}</Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function KeyCombo({ k }: { k: string }) {
  return <span class="row" style={{ gap: '4px' }}>{k.split('+').map((p, i) => <Kbd key={i} k={p} />)}</span>;
}

function Keys() {
  return (
    <div class="grid-2">
      <section class="panel">
        <h2>Everywhere</h2>
        <table class="key-table"><tbody>
          {GLOBAL_KEYS.map(([k, what]) => <tr key={k}><td><KeyCombo k={k} /></td><td>{what}</td></tr>)}
        </tbody></table>
        <p class="small muted" style={{ marginTop: '12px' }}>On a Mac, use Command where these say Ctrl. While you type in a box, its letters and Ctrl Z stay with the box.</p>
      </section>
      <section class="panel">
        <h2>Menus, lists and choices</h2>
        <table class="key-table"><tbody>
          {LIST_KEYS.map(([k, what]) => <tr key={k}><td><KeyCombo k={k} /></td><td>{what}</td></tr>)}
        </tbody></table>
        <p class="small muted" style={{ marginTop: '12px' }}>Everything in Playbook can be reached with the keyboard: the Planner’s choices, the comps and their tabs, and the agent and map pickers.</p>
      </section>
    </div>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
/** To the nearest 5%, as the comps' cons say it. */
const about = (x: number) => `${Math.round(x * 20) * 5}%`;
/** The rank at a place on the climb from Iron (0) to Radiant (1). */
const rankAt = (t: number) => RANKS.reduce((best, r) => (Math.abs(r.t - t) < Math.abs(best.t - t) ? r : best)).name;

/** How a rank changes the answers, in words built from the engine's own numbers. */
function RankHelp() {
  const known = AGENTS.filter((a) => !a.estimate);
  const atIron = (a: (typeof known)[number]) => kitShare(a, 0);
  const hardest = known.reduce((x, y) => (atIron(y) < atIron(x) ? y : x));
  const easiest = known.reduce((x, y) => (atIron(y) > atIron(x) ? y : x));
  const [iron, radiant] = [RANKS[0]!, RANKS[RANKS.length - 1]!];
  return (
    <section class="panel stack">
      <h2>How your rank changes the answers</h2>
      <p><b>Kits.</b> A hard kit, or one that needs the team to play around it, is worth less until players have learned it. At {iron.name} a team gets about {about(atIron(hardest))} of {hardest.name}’s kit and {about(atIron(easiest))} of {easiest.name}’s; at {radiant.name} it gets all of every kit. Gun play counts the same at every rank.</p>
      <p><b>Ranked results.</b> Agents who win more ranked games fit a little better, and those who win fewer a little worse. Most of those games are played between {rankAt(WIN_RANKS.from)} and {rankAt(WIN_RANKS.to)}, so win rates count in full there, {pct(WIN_RANKS.iron)} as much at {iron.name} and {pct(WIN_RANKS.radiant)} at {radiant.name}. Only {WIN_CAP} points either side of 50% count, since a win rate says who plays an agent as well as how strong the agent is.</p>
      <p><b>Pro play.</b> What pro teams pick on a map, and how many of each role they run there, counts {pct(proLean(0))} as much at {iron.name} as at {radiant.name}, {pct(proLean(rankOf('gold').t))} at {rankOf('gold').name} and {pct(proLean(rankOf('diamond').t))} at {rankOf('diamond').name}, rising fastest near the top. A map with fewer than {PRO_GAMES.full} pro games behind it counts less{PRO_GAMES.dated < 1 ? ', and so does one whose numbers are from an earlier year' : ''}.</p>
    </section>
  );
}

function Guide() {
  const fresh = NEW_AGENTS.map((a) => a.name);
  const latest = AGENTS.filter((a) => !a.estimate && !proKnown(a)).map((a) => a.name);
  const dated = Object.entries(PRO).filter(([, p]) => p.dated).map(([id]) => mapById(id)?.name ?? id);
  return (
    <div class="stack guide">
      <section class="panel">
        <h2>Getting started</h2>
        <ol>
          <li><b>Ask a question</b> on the Planner: a map, your side, your rank and who you’re queuing with. Leave any of them open, or ask for the best one.</li>
          <li><b>Read the answers:</b> the comps that fit best, each with how it wins, its pros and cons, the plays it can run on the map, and tips. Under Agents, open any agent to see why their best comp ranks below the best one.</li>
          <li><b>Look things up</b> on Rankings (tier lists of agents and comps), Agents (kits, strengths and partners) and Maps (sites, callouts and plays).</li>
          <li><b>Save</b> a plan you like (or copy or print it), and your usual party with the agents each of you plays, so they’re a click away next time.</li>
        </ol>
        <p>Playbook starts from how you play: your rank, how you queue and the agents you play. It asks when you first open it, and you can change any of it in <a href="#/settings/you">Settings → You</a>. Every plan then gives you one of your agents, Rankings marks them with a star, and Home shows how each fits at your rank.</p>
        <p class="muted">Rather be shown? <a href="#/help/tours">Tours</a> walk you through each page on the real screens.</p>
      </section>
      <div class="guide-cols">
        <section class="panel stack">
          <h2>The question</h2>
          <p><b>Map, side, sites and rank</b> describe the game you’re about to play. Choose “Best” for the side or “Find the best rank” and the Planner compares them all for you; leave the map open to plan across the pool ({plural(POOL.length, 'map')}), or turn on all {MAPS.length}.</p>
          <p><b>Sites</b> narrow a plan to the sites you’ll play: say B and C on Haven to plan a hit or a hold there. Plays then come from those sites first.</p>
          <p><b>Must play</b> keeps agents in every comp. <b>Won’t play</b> leaves them out. <b>Roles</b> set how many of a role the team has, like two controllers or no sentinel.</p>
          <p><b>Their team</b> takes the other team’s agents, if you know them. Comps that answer them rank higher, and each comp says how it stands against them. Both teams can play the same agent, so these don’t limit your picks.</p>
          <p>Every change answers again straight away. <b>Start over</b> goes back to how you play (your rank, how you queue and your agents) with nothing else chosen, and recent questions are on Home.</p>
        </section>
        <section class="panel stack">
          <h2>Fit and tiers</h2>
          <p>A comp’s <b>fit</b> compares it with every possible team for the same situation: the best team is 100 and the middle one is {FIT_MID}. So a fit means the same on every map, side and rank.</p>
          <p>Tiers follow the fit: {tierWords()}. An agent’s fit comes from the best comp they fit into, so a high one means “easy to build around here”, not “strong alone”. The other four can make several agents look the same, so each is also measured by what they add to that comp over the next best agent of their role in their place (“ahead of Skye, the next best initiator”): agents with the same fit are listed by it, and an agent’s tooltip on Rankings and their row on the Planner’s Agents tab say it.</p>
          <p>On Rankings and an agent’s page, an arrow on an agent means their tier moved since {SINCE_FROM} by {SINCE_MOVE} points of fit or more. Point at it, or Tab to it, to see why: the change in this version that did the most to move it, found by undoing each change in turn. Under a tier list, <b>moved a tier since {SINCE_FROM}</b> lists every move there with its reason.</p>
          <p>A fit marked <b>less sure</b>, with a dashed ring on its tier, could be off by {SURE.less} points or more: about a tier. That happens when parts of it rest on very little: ranked numbers from an agent’s first days, which can still change a lot as players learn the agent; what their kit does on the map, judged from the abilities alone with no play to check it yet; or pro play, for an agent who came out after the year’s top events. Point at it, or Tab to it, to see which. {UNSETTLED.length ? `Right now that’s ${listJoin(UNSETTLED.map((a) => a.name))}.` : 'No agent is that new right now.'}</p>
          <p>Fit weighs what the situation needs (smokes, flashes, information, a strong anchor and so on) against what the team brings, how well the agents work together, and the role counts every team needs. Your rank changes the mix: low down, aim and simple utility win; near the top, coordinated utility and what pros play on the map count for more. A second controller pays off only when the team plays its smokes together, so below {rankOf(SECOND_CONTROLLER.until).name} it costs a comp a little, less at each rank up; from {rankOf(SECOND_CONTROLLER.until).name} on, two controllers can lead again on the maps where pros run two.</p>
        </section>
        <RankHelp />
        <section class="panel stack">
          <h2>Solo, duos and trios</h2>
          <p>Solo or in a duo or trio, the others are random teammates. The Planner counts on what players at your rank usually pick, and on teammates filling a role the team is missing, then ranks your picks by every team you could end up with, each weighed by how likely it is. A row shows your agent, or your party, with the best agents for your random teammates to play around it.</p>
          <p>A row’s fit is among other picks for the same number of players. Open it to see how the team fits if your teammates play those picks, and what to expect if they pick on their own (both against the best five-stack), the role worth asking them for (and how often they pick it on their own), other good picks for them, and the team they’d most likely pick.</p>
          <p>Already know what they locked in? Add it under <b>Teammates locked in</b>, and the Planner fills in around them. To plan around the agents your party plays, save it on the Saved page and choose it under <b>Saved party</b>.</p>
        </section>
        <section class="panel stack">
          <h2>Plays</h2>
          <p>Each map has plays for attack and defense ({plural(PLAYS.filter((p) => !isLowBuy(p.kind)).length, 'play')} in all): hits, splits, fakes, defaults, setups and retakes. A play has a job for each player, like smoking a choke, flashing the entry or watching the flank. The {plural(POOL.length, 'map')} in the pool also have a play for the pistol round and one for an eco on each side ({plural(PLAYS.filter((p) => isLowBuy(p.kind)).length, 'play')}), listed under the others: with little to spend, close fights and playing together make up for what you can’t buy.</p>
          <p>The Planner gives each job to the agent on the team who does it best, and names the abilities they’d use. A play <b>fits well</b>, <b>works</b> or is <b>a stretch</b>, from how good the players are at their jobs; a warning sign marks a job nobody on the team is good at. A play with one of those never fits well, and with two it’s a stretch, so the plays your comp can run in full come first.</p>
          <p>The minimap draws each player’s route in their own color, along the corridors and through the doorways they’d really take. Point at a step, or Tab to it, to bring its route forward. A dashed start is the walk out of spawn, and a ring is a spot to hold.</p>
          <h3>What to buy</h3>
          <dl class="buy-guide">
            {BUY_GUIDE.map((r) => <div key={r.id}><dt>{r.name}</dt><dd>{r.text}</dd></div>)}
          </dl>
        </section>
        <section class="panel stack">
          <h2>Using an answer</h2>
          <p><b>Copy</b> on a comp puts the plan into words you can paste into a chat with your team, and <b>Print</b> puts it on one sheet of paper: each agent with their tip, how the comp wins, its pros and cons, the play you chose on its Plays tab drawn on the minimap (one for each side when the plan is for both), and the other tips. A saved plan prints with its name and note.</p>
          <p><b>Compare</b> sets a comp beside any other the Planner found for a five-stack: their fits, how each wins, their best plays, how well each covers what the situation needs, and where the lower one falls short or does better.</p>
          <p>When a comp or an agent’s rating looks wrong to you, the flag beside it (<b>This looks wrong</b>) keeps a short note of why, with the question and what Playbook showed. Your notes are on the Saved page under Flagged, ready to copy, and go into backups, so they can be checked and fixed.</p>
        </section>
        <section class="panel stack">
          <h2>Where the numbers come from</h2>
          <p>Playbook knows {plural(AGENTS.length, 'agent')} and {plural(MAPS.length, 'map')}, as of patch {PATCH}. Each agent’s strengths are judged from their kit and how they’re played. Pick rates in ranked come from metabot.gg, and win rates from metabot.gg and winio.ai, across all ranks as of {fmtLongDay(STATS_ON)}. Pro picks come from vlr.gg: Champions 2026 for the maps it played and Masters Santiago 2026 for the rest, {PRO_MAPS_COUNTED} maps in all{dated.length ? `; ${listJoin(dated)} weren’t played at this year’s events, so their numbers are from the year before` : ''}. The map pool is the one since {fmtLongDay(POOL_SINCE)}.</p>
          {latest.length > 0 && <p>{listJoin(latest)} came out after those events, so pro play doesn’t count for or against {listJoin(latest)} yet, and the pick rate in ranked is from the first days of play (op.gg).</p>}
          {fresh.length > 0 && <p>{listJoin(fresh)} {fresh.length === 1 ? 'is' : 'are'} too new for real numbers, so the scores are early estimates from the kit that was shown. Leave {listJoin(fresh)} out of a question under Options, or out of every new one in <a href="#/settings/includeNew">Settings → Planner</a>.</p>}
          <p>Playbook works offline, so it doesn’t fetch match stats while you use it; a new version brings new numbers.</p>
        </section>
        <section class="panel stack">
          <h2>Your data</h2>
          <p>Everything stays on this computer, in this browser. Nothing is sent anywhere. Back up from <a href="#/settings/data">Settings → Your data</a> to move to another computer or keep a copy safe.</p>
          <p>Almost anything can be undone with Ctrl Z. With Playbook open in two tabs, only one saves; the other follows it.</p>
        </section>
      </div>
    </div>
  );
}

const LICENSES: readonly [string, string][] = [
  ['Preact and Preact Signals', 'MIT License, © Jason Miller and contributors'],
  ['Literata', 'SIL Open Font License 1.1, © The Literata Project Authors'],
  ['Atkinson Hyperlegible Next and Mono', 'SIL Open Font License 1.1, © Braille Institute of America'],
];

function About() {
  const r = watch('meta', 'plans', 'parties');
  const bad = r.quarantine();
  const storage = { indexeddb: 'Browser database (IndexedDB)', local: 'Basic browser storage (localStorage)', memory: 'Not saving (this tab only)' }[backendKind.value];
  return (
    <div class="grid-2">
      <section class="panel stack">
        <h2>Playbook By Sovereign</h2>
        <p class="muted">Designed and directed by Sovereign.</p>
        <dl class="facts">
          <dt>Version</dt><dd>{__APP_VERSION__}</dd>
          <dt>Game data</dt><dd>Patch {PATCH}</dd>
          <dt>Saving to</dt><dd>{storage}{tabRole.value === 'reader' ? ' (read-only in this tab)' : ''}</dd>
          <dt>Stored</dt><dd>{plural(r.plans().length, 'saved plan')} · {plural(r.parties().length, 'party', 'parties')} · {plural(r.flags().length, 'flagged answer')} · {plural(r.themes().length, 'theme')} of your own</dd>
        </dl>
        <div class="row wrap">
          <Button icon="sparkle" onClick={() => void openWhatsNew()}>What’s new</Button>
          <Button icon="check" onClick={() => go('selftest')}>Run the self-test</Button>
          <Button kind="quiet" icon="grid" onClick={() => go('gallery')}>Component gallery</Button>
        </div>
      </section>
      <section class="panel stack">
        <h2>Problems</h2>
        {errors.value.length === 0 && bad.length === 0 && <p class="muted">No problems since Playbook opened.</p>}
        {bad.length > 0 && (
          <div class="stack" style={{ gap: '6px' }}>
            <p>{plural(bad.length, 'damaged record')} {bad.length === 1 ? 'was' : 'were'} set aside when opening. They’re kept here in case they’re needed.</p>
            <div><Button size="sm" icon="export" onClick={() => download(datedName('Playbook damaged records', 'json'), JSON.stringify(bad, null, 1))}>Download them</Button></div>
          </div>
        )}
        {errors.value.length > 0 && (
          <>
            <pre class="error-log">{errors.value.join('\n')}</pre>
            <div><Button size="sm" icon="copy" onClick={() => void copyWithToast(`Playbook ${__APP_VERSION__}\n${errors.value.join('\n')}`, 'Copied the problems.')}>Copy</Button></div>
          </>
        )}
      </section>
      <section class="panel stack" style={{ gridColumn: '1 / -1' }}>
        <h2>Made with</h2>
        <ul class="licenses">{LICENSES.map(([what, lic]) => <li key={what}><b>{what}</b> <span class="muted">{lic}</span></li>)}</ul>
        <p class="small muted">
          Playbook By Sovereign was created under Riot Games’ “Legal Jibber Jabber” policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.
          The agent portraits, ability icons, minimaps and ability text are Riot Games’ own, from valorant-api.com.
        </p>
        <p class="small muted">Playbook is © 2026 Sovereign. All rights reserved.</p>
      </section>
    </div>
  );
}

export function HelpPage({ arg }: PageProps) {
  const tab: Tab = arg === 'tours' || arg === 'keys' || arg === 'about' ? arg : 'guide';
  return (
    <>
      <PageHead title="Help" />
      <Tabs value={tab} label="Help" onChange={(t) => go('help', t === 'guide' ? '' : t)} tabs={[['guide', 'Guide'], ['tours', 'Tours'], ['keys', 'Keyboard'], ['about', 'About']]} />
      <div class="tab-body" key={tab}>
        {tab === 'guide' && <Guide />}
        {tab === 'tours' && <Tours />}
        {tab === 'keys' && <Keys />}
        {tab === 'about' && <About />}
      </div>
    </>
  );
}
