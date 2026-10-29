/**
 * Fills a play with a team: every job goes to an agent so the team as a whole is as good at the
 * play as it can be, and the play's fit says how well the team can run it. Jobs draw on the same
 * strengths the engine measures agents by (kb/roles.ts), so a play's fit agrees with the team's.
 */
import { agentById, type Agent } from '../kb/agents.ts';
import { abilityNames } from '../kb/kits.ts';
import type { Side, SiteId } from '../kb/maps.ts';
import { playsOn, type Job, type Play } from '../kb/plays.ts';
import type { Dim } from '../kb/roles.ts';
import { listJoin } from '../text.ts';

/**
 * What each job draws on. Each line is one way to do the job, as strengths and how much each
 * counts; an agent does the job the best way they can. Stand-ins count for less: a smoke can
 * cover for a missing wall, but not as well.
 */
export const JOB_SKILLS: Record<Job, readonly Partial<Record<Dim, number>>[]> = {
  smoke: [{ smoke: 1 }, { wall: 0.6 }],
  wall: [{ wall: 1 }, { smoke: 0.5 }],
  flash: [{ flash: 1 }, { disrupt: 0.75 }],
  recon: [{ recon: 1 }, { flank: 0.4 }],
  entry: [{ entry: 1 }, { duel: 0.6 }],
  clear: [{ clear: 1 }, { recon: 0.6 }, { disrupt: 0.5 }],
  anchor: [{ anchor: 1 }, { stall: 0.6 }],
  stall: [{ stall: 1 }, { anchor: 0.7 }, { wall: 0.5 }],
  flank: [{ flank: 1 }, { anchor: 0.6 }],
  lurk: [{ duel: 0.55, mobility: 0.45 }, { flank: 0.5, duel: 0.4 }],
  postplant: [{ postplant: 1 }, { stall: 0.6 }],
  retake: [{ retake: 1 }, { flash: 0.6 }, { disrupt: 0.6 }],
  duel: [{ duel: 1 }],
};

/** What each job is called in a sentence: "Omen smokes". */
export const JOB_NAMES: Record<Job, string> = {
  smoke: 'Smokes', wall: 'Wall', flash: 'Flashes', recon: 'Information', entry: 'Entry', clear: 'Clearing',
  anchor: 'Anchor', stall: 'Delay', flank: 'Flank watch', lurk: 'Lurk', postplant: 'Post-plant', retake: 'Retake', duel: 'Duels',
};

/** Below this, a job is a stretch for whoever gets it. */
export const WEAK_JOB = 0.3;

/**
 * How good an agent is at a job (0 to 1), the strengths they'd use, and whether that's a stand-in
 * (any way but a job's first: a smoke for a missing wall, a stun for a missing flash).
 */
export function jobSkill(a: Agent, job: Job): { value: number; dims: Dim[]; standIn: boolean } {
  let best = { value: 0, dims: [] as Dim[], standIn: false };
  JOB_SKILLS[job].forEach((way, i) => {
    let value = 0;
    for (const [d, w] of Object.entries(way) as [Dim, number][]) value += w * a.caps[d];
    if (value > best.value + 1e-9) best = { value, dims: (Object.keys(way) as Dim[]).filter((d) => a.caps[d] > 0), standIn: i > 0 };
  });
  return best;
}

/** The abilities an agent uses for a job: "Dark Cover" (and "gun play" when the gun is all there is). */
function abilitiesFor(a: Agent, dims: readonly Dim[]): string[] {
  const out: string[] = [];
  for (const d of dims) for (const n of abilityNames(a.id, a.via[d] ?? '')) if (!out.includes(n)) out.push(n);
  if (!out.length && dims.some((d) => a.via[d]?.includes('G'))) out.push('gun play');
  return out;
}

/**
 * Someone's job in a play. `standIn` is set when they do it another way than the job asks, so the
 * job isn't named for what they don't have: Veto has no flash, so his Chokehold stands in for one.
 */
export interface Doer { id: string; job: Job; value: number; abilities: string[]; standIn: boolean }

/**
 * A job as said beside the agent: "Smokes with Dark Cover", "Chokehold in place of flashes", or, for
 * an agent with nothing for the job, "Smokes, without the utility for it".
 */
export function jobWords(d: Doer): string {
  if (d.value <= 0) return `${JOB_NAMES[d.job]}, without the utility for it`;
  if (d.standIn) return `${d.abilities.length ? listJoin(d.abilities) : 'Nothing'} in place of ${JOB_NAMES[d.job].toLowerCase()}`;
  return `${JOB_NAMES[d.job]}${d.abilities.length ? ` with ${listJoin(d.abilities)}` : ''}`;
}
export interface FilledStep { jobs: Job[]; route: string[]; text: string; who: Doer[] }
export interface FilledPlay {
  play: Play;
  /** How well the team can run it, 0 to 1: the average of how good each player is at their job. */
  fit: number;
  steps: FilledStep[];
  /** Jobs nobody on the team is good at. */
  weak: Doer[];
}

/**
 * Gives each job of a play to a different agent of the team, so the jobs are done as well as
 * they can be overall (all ways of sharing out five jobs are tried, which is quick).
 */
export function fillPlay(play: Play, team: readonly string[]): FilledPlay {
  const agents = team.map((id) => agentById(id)).filter((a): a is Agent => !!a);
  const slots = play.steps.flatMap((s, step) => s.jobs.map((job) => ({ step, job })));
  const skill = slots.map((s) => agents.map((a) => jobSkill(a, s.job)));
  let best: number[] = [], bestSum = -1;
  const pick: number[] = [], used = new Array<boolean>(agents.length).fill(false);
  const place = (k: number, sum: number) => {
    if (k === slots.length || pick.length === agents.length) {
      if (sum > bestSum + 1e-9) { bestSum = sum; best = pick.slice(); }
      return;
    }
    for (let i = 0; i < agents.length; i++) {
      if (used[i]) continue;
      used[i] = true; pick.push(i);
      place(k + 1, sum + skill[k]![i]!.value);
      used[i] = false; pick.pop();
    }
  };
  place(0, 0);
  const steps: FilledStep[] = play.steps.map((s) => ({ jobs: s.jobs, route: s.route, text: s.text, who: [] }));
  const weak: Doer[] = [];
  best.forEach((i, k) => {
    const a = agents[i]!, { job } = slots[k]!, sk = skill[k]![i]!;
    const doer: Doer = { id: a.id, job, value: sk.value, abilities: abilitiesFor(a, sk.dims), standIn: sk.standIn };
    steps[slots[k]!.step]!.who.push(doer);
    if (sk.value < WEAK_JOB) weak.push(doer);
  });
  return { play, fit: slots.length ? Math.max(0, bestSum) / slots.length : 0, steps, weak };
}

/**
 * The plays a team can run on a map and side, best fit first. With sites, only plays for those
 * sites and plays for the whole map, the sites' own first (they're what was asked about); without,
 * site plays come before whole-map ones at equal fit.
 */
export function playsFor(team: readonly string[], map: string, side: Side, sites: readonly SiteId[] = []): FilledPlay[] {
  const wide = (f: FilledPlay) => Number(!f.play.site);
  return playsOn(map, side, sites)
    .map((p) => fillPlay(p, team))
    .sort((a, b) => (sites.length ? wide(a) - wide(b) : 0) || b.fit - a.fit || wide(a) - wide(b) || a.play.name.localeCompare(b.play.name));
}

/** A fit in words, for a play. */
export function playFitLabel(fit: number): 'Fits well' | 'Works' | 'A stretch' {
  return fit >= 0.62 ? 'Fits well' : fit >= 0.45 ? 'Works' : 'A stretch';
}
