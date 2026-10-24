/**
 * The Planner's question and its answers. Changing the question answers it again a moment later,
 * a situation at a time with a pause for the screen in between, so even "find the best map for a
 * duo" (a few seconds of work) never freezes the page. A newer question cancels an older one.
 */
import { signal } from '@preact/signals';
import { newQuery, sanitizeQuery, situationsOf, type Query } from '../../core/engine/query.ts';
import { solve, type SituationAnswer } from '../../core/engine/plan.ts';
import type { RankId } from '../../core/kb/ranks.ts';
import { data, go, reportError, route } from '../state.ts';
import { play } from '../sound.ts';

export interface Run {
  /** The question these answers are for. */
  query: Query;
  status: 'working' | 'done' | 'error';
  done: number;
  total: number;
  answers: SituationAnswer[];
  ms: number;
}

/** The question on the Planner (null until the app has loaded it). */
export const question = signal<Query | null>(null);
export const run = signal<Run | null>(null);

/** The question as last left, or a fresh one with your usual rank. */
export function currentQuestion(): Query {
  if (question.peek()) return question.peek()!;
  const r = data();
  const s = r.settings();
  const q = r.app().draft ?? newQuery(s.defaultRank as RankId, s.includeNew);
  question.value = q;
  return q;
}

let token = 0, timer = 0, recentTimer = 0;
/** How long a question must stay the same after it's answered before it counts as asked (for Recent). */
const SETTLED_MS = 4000;

/** Changes the question (merging `patch` into it) and answers it again shortly. */
export function ask(patch: Partial<Query>, now = false) {
  const q = sanitizeQuery({ ...currentQuestion(), ...patch });
  question.value = q;
  const r = data();
  if (!r.db.readOnly) r.setDraft(q);
  clearTimeout(timer);
  timer = window.setTimeout(() => void answer(), now ? 0 : 140);
}

/** Answers the current question now. */
export async function answer(): Promise<void> {
  const mine = ++token;
  clearTimeout(recentTimer);
  const q = currentQuestion();
  const situations = situationsOf(q);
  const keep = data().settings().resultCount;
  const started = performance.now();
  const answers: SituationAnswer[] = [];
  run.value = { query: q, status: 'working', done: 0, total: situations.length, answers: run.peek()?.answers ?? [], ms: 0 };
  try {
    for (const s of situations) {
      if (mine !== token) return;
      answers.push(solve(q, s, keep));
      run.value = { ...run.value!, done: answers.length };
      // let the screen draw and other questions cancel this one
      await new Promise((r) => setTimeout(r, 0));
    }
    if (mine !== token) return;
    // the best situations first, when there are several
    answers.sort((a, b) => (b.comps[0]?.fit ?? -1) - (a.comps[0]?.fit ?? -1));
    const ms = performance.now() - started;
    run.value = { query: q, status: 'done', done: answers.length, total: answers.length, answers, ms };
    // a sound only when there was a wait to end
    if (ms > 350) play('ready');
    recentTimer = window.setTimeout(() => {
      const r = data();
      if (mine === token && !r.db.readOnly) r.addRecent(q);
    }, SETTLED_MS);
  } catch (e) {
    if (mine !== token) return;
    reportError(e);
    run.value = { query: q, status: 'error', done: answers.length, total: situations.length, answers, ms: 0 };
  }
}

/** Opens the Planner on a question (a recent one, a saved plan's). */
export function openPlanner(q: Query) {
  question.value = sanitizeQuery(q);
  ask({}, true);
  if (route.peek().page !== 'planner') go('planner');
}

/** Opens the Planner on a fresh question with `patch` filled in ("Plan for Haven"). */
export function planWith(patch: Partial<Query>) {
  const s = data().settings();
  openPlanner({ ...newQuery(s.defaultRank as RankId, s.includeNew), ...patch });
}
