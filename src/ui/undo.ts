/**
 * Undo and redo from anywhere: Ctrl Z, the sidebar buttons, the command palette and a message's
 * Undo button. A screen with undo of its own (a study session taking back answers) can take undo
 * and redo while it's open.
 */
import { signal } from '@preact/signals';
import type { Action } from '../data/db.ts';
import { data, safely, toast } from './state.ts';
import { play } from './sound.ts';

let local: ((kind: 'undo' | 'redo') => boolean) | null = null;
/** Whether the screen holding undo keeps a message's Undo button from taking back a change now. */
let blocked: (() => boolean) | null = null;
/** Changes when a screen takes or lets go of undo, so a message's Undo button shows or hides with it. */
const claims = signal(0);
/**
 * While a screen is open, undo and redo ask it first; it returns true when it dealt with them (took
 * something back, or said why it can't). `blocks` says when the screen would turn an undo down, so a
 * message's Undo button isn't offered then. Returns the way to let go.
 */
export function claimUndo(fn: (kind: 'undo' | 'redo') => boolean, blocks?: () => boolean): () => void {
  local = fn; blocked = blocks ?? null; claims.value++;
  return () => { if (local === fn) { local = null; blocked = null; claims.value++; } };
}

function report(a: Action | null | undefined, kind: 'undo' | 'redo') {
  if (a === undefined) return; // an error, already reported
  if (!a) { toast(kind === 'undo' ? 'Nothing to undo.' : 'Nothing to redo.'); return; }
  if (a.stale) { toast(`Couldn’t ${kind}: ${a.label}. It has changed since.`); return; }
  play('undo');
  // the message's Redo is for this change only, while it's still the one a redo would bring back
  const back = data().db.redoStack.at(-1);
  if (kind === 'undo') toast(`Undone: ${a.label}.`, { action: { label: 'Redo', run: () => { if (canRedoThis(back)) redo(); }, live: () => canRedoThis(back) } });
  else toast(`Redone: ${a.label}.`);
}

const lookOnly = () => {
  if (!data().db.readOnly) return false;
  toast('This tab can only look, so it can’t undo or redo.');
  return true;
};

export function undo() {
  if (local?.('undo') || lookOnly()) return;
  report(safely(() => data().undo()), 'undo');
}

export function redo() {
  if (local?.('redo') || lookOnly()) return;
  report(safely(() => data().redo()), 'redo');
}

/** Whether `a` is still the change an undo would take back (a message's Undo button is about that one change). */
export const canUndoThis = (a: Action | null): boolean => {
  void claims.value;
  return !!a && !data().db.readOnly && data().db.undoStack.at(-1) === a && !blocked?.();
};

const canRedoThis = (a: Action | undefined): boolean => !!a && !data().db.readOnly && data().db.redoStack.at(-1) === a;

/** Undoes `a` if it's still the latest change. */
export function undoThis(a: Action | null) {
  if (!canUndoThis(a)) return;
  report(safely(() => data().undo()), 'undo');
}
