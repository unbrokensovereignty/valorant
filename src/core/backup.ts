/**
 * Backup files: everything you've saved (settings, themes, plans and parties) as one JSON file,
 * and reading one back. Whatever a file holds goes through the same sanitizers as stored data,
 * so a damaged or hand-edited file can't break anything.
 */
import { sanitizeParty, sanitizePlan, type Party, type SavedPlan } from './saved.ts';
import { sanitizeSettings, type Settings } from './settings.ts';
import { MAX_THEMES, sanitizeTheme, type ThemePicks } from './theme.ts';
import { isRecord } from './util.ts';

export interface BackupData {
  settings: Partial<Settings>;
  themes: ThemePicks[];
  plans: SavedPlan[];
  parties: Party[];
}

/** What the file says it is. */
export const BACKUP_KIND = 'playbook-backup';
/** The file layout's own number (not the app's version): raised only if the layout ever changes. */
export const BACKUP_FORMAT = 1;

export const emptyBackup = (): BackupData => ({ settings: {}, themes: [], plans: [], parties: [] });

export function backupText(d: BackupData, appVersion: string, now = new Date()): string {
  return JSON.stringify({ kind: BACKUP_KIND, format: BACKUP_FORMAT, app: appVersion, saved: now.toISOString(), ...d }, null, 1);
}

export type ReadResult = { ok: true; data: BackupData; saved: string } | { ok: false; error: string };

/** Reads a backup file's text. Anything damaged inside is dropped; a file that isn't a backup at all is refused. */
export function readBackup(text: string): ReadResult {
  let x: unknown;
  try { x = JSON.parse(text); } catch { return { ok: false, error: 'That file isn’t a Playbook backup (it isn’t JSON).' }; }
  if (!isRecord(x) || x.kind !== BACKUP_KIND) return { ok: false, error: 'That file isn’t a Playbook backup.' };
  if (typeof x.format === 'number' && x.format > BACKUP_FORMAT) return { ok: false, error: 'That backup was made by a newer Playbook. Open it there, or update this one.' };
  const list = <T>(v: unknown, fn: (y: unknown) => T | null): T[] => (Array.isArray(v) ? v.map(fn).filter((y): y is T => !!y) : []);
  const seen = new Set<string>();
  const unique = <T extends { id: string }>(xs: T[]) => xs.filter((y) => !seen.has(y.id) && !!seen.add(y.id));
  return {
    ok: true,
    saved: typeof x.saved === 'string' ? x.saved : '',
    data: {
      settings: sanitizeSettings(x.settings),
      themes: unique(list(x.themes, sanitizeTheme).filter((t) => !!t.id)).slice(0, MAX_THEMES),
      plans: unique(list(x.plans, (p) => sanitizePlan(p))),
      parties: unique(list(x.parties, (p) => sanitizeParty(p))),
    },
  };
}

/** A backup merged into what's here: the newer of two copies of a plan or party wins, and settings from the backup fill in. */
export function mergeBackup(here: BackupData, from: BackupData): BackupData {
  const merge = <T extends { id: string; updated: number }>(a: T[], b: T[]): T[] => {
    const out = new Map(a.map((x) => [x.id, x]));
    for (const x of b) { const was = out.get(x.id); if (!was || x.updated > was.updated) out.set(x.id, x); }
    return [...out.values()];
  };
  const themes = new Map(here.themes.map((t) => [t.id, t]));
  for (const t of from.themes) if (!themes.has(t.id) && themes.size < MAX_THEMES) themes.set(t.id, t);
  return { settings: { ...from.settings, ...here.settings }, themes: [...themes.values()], plans: merge(here.plans, from.plans), parties: merge(here.parties, from.parties) };
}

/** How much a backup holds, in words: "4 plans, 1 party and 2 themes". */
export function countsOf(d: BackupData): { plans: number; parties: number; themes: number } {
  return { plans: d.plans.length, parties: d.parties.length, themes: d.themes.length };
}
