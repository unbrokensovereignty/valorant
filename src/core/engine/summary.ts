/**
 * A plan as plain text, for copying into a chat: the situation, the comp and its fit, pros and
 * cons, the best play with who does what, and tips.
 */
import { agentById } from '../kb/agents.ts';
import { spotName } from '../kb/maps.ts';
import { listJoin } from '../text.ts';
import type { Explanation } from './explain.ts';
import { JOB_NAMES, playFitLabel, type FilledPlay } from './plays.ts';
import type { Tip } from './tips.ts';

const name = (id: string) => agentById(id)?.name ?? id;

export interface SummaryParts {
  /** "Haven, attack, C site · Gold · five-stack". */
  title: string;
  team: readonly string[];
  /** Your party, for a duo or trio. */
  party?: readonly string[];
  fit: number;
  tier: string;
  why: Explanation;
  play?: FilledPlay;
  tips: readonly Tip[];
}

export function summaryText(p: SummaryParts): string {
  const lines: string[] = [`Playbook: ${p.title}`];
  const yours = p.party?.length ? ` (your party: ${listJoin(p.party.map(name))})` : '';
  lines.push(`Comp: ${p.team.map(name).join(', ')}${yours}. Fit ${Math.round(p.fit)}, tier ${p.tier}.`);
  const list = (head: string, items: readonly string[]) => {
    if (!items.length) return;
    lines.push('', head, ...items.map((x) => `- ${x}`));
  };
  list('Pros', p.why.pros);
  list('Cons', p.why.cons);
  list('Notes', p.why.notes);
  if (p.play) {
    lines.push('', `Play: ${p.play.play.name} (${playFitLabel(p.play.fit).toLowerCase()})`, p.play.play.about);
    p.play.steps.forEach((s, i) => {
      const who = s.who.map((d) => `${name(d.id)} (${JOB_NAMES[d.job].toLowerCase()}${d.abilities.length ? `: ${listJoin(d.abilities)}` : ''})`);
      lines.push(`${i + 1}. ${listJoin(who)}: ${s.route.map(spotName).join(' → ')}. ${s.text}`);
    });
  }
  list('Tips', p.tips.map((t) => `${t.about}: ${t.text}`));
  return lines.join('\n');
}
