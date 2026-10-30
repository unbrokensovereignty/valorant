/**
 * Flagging an answer that looks wrong: a short note, kept with the question that gave the answer and
 * what it showed then (Saved → Flagged, and backups), so it can be checked later.
 */
import { LIMITS, type Flag } from '../core/saved.ts';
import { prompt } from './components/overlays.tsx';
import { data, go, safely, toast } from './state.ts';
import { play } from './sound.ts';

/** Asks what looks wrong about `what` ("this comp", "Astra’s rating") and keeps the note. */
export async function flagAnswer(f: Omit<Flag, 'id' | 'created' | 'note'>, what: string): Promise<void> {
  const note = await prompt({
    title: 'What looks wrong?', label: `About ${what}`, yes: 'Keep the note', maxLength: LIMITS.flag,
    help: 'It’s kept with this question and what Playbook shows for it now, on the Saved page and in backups, so it can be checked later.',
  });
  if (!note) return;
  const kept = safely(() => data().addFlag({ ...f, note }));
  if (kept) { play('saved'); toast('Noted. It’s on the Saved page, under Flagged.', { tone: 'good', undo: true, action: { label: 'Open', run: () => go('saved', 'flagged') } }); }
  else if (kept === null) toast(`You can keep up to ${LIMITS.flags} flags. Delete some on the Saved page first.`, { tone: 'bad' });
}
