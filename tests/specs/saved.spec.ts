import { describe, spec, eq, ok } from './harness.ts';
import { LIMITS, poolsOf, sanitizeParty, sanitizePlan } from '../../src/core/saved.ts';
import { BACKUP_FORMAT, BACKUP_KIND, backupText, countsOf, emptyBackup, mergeBackup, readBackup, type BackupData } from '../../src/core/backup.ts';
import { newQuery } from '../../src/core/engine/query.ts';
import { defaultSettings, resolveSettings, sanitizeSetting, sanitizeSettings, SETTINGS, SETTING_KEYS } from '../../src/core/settings.ts';
import { clean, fold, listJoin } from '../../src/core/text.ts';

const T = 1_790_000_000_000;
const plan = (over: Record<string, unknown> = {}) => ({ id: 'p_abcd1234', name: 'Haven attack', note: '', query: { ...newQuery(), map: 'haven' }, team: ['omen', 'sova', 'jett', 'killjoy', 'breach'], starred: false, created: T, updated: T, ...over });
const party = (over: Record<string, unknown> = {}) => ({ id: 'y_abcd1234', name: 'Duo', players: [{ name: 'Me', agents: ['omen'] }, { name: 'Sam', agents: [] }], created: T, updated: T, ...over });

describe('saved plans and parties', () => {
  spec('a good plan reads back as it was', () => {
    eq(sanitizePlan(plan()), plan() as unknown);
  });
  spec('a damaged plan is mended where it can be, and refused where it can’t', () => {
    eq(sanitizePlan({ ...plan(), id: 'bad id' }), null);
    eq(sanitizePlan('junk'), null);
    const p = sanitizePlan(plan({ name: '  ', note: 5, query: 'x', team: ['omen', 'omen', 'nobody'], starred: 'yes', created: -1, updated: 'never' }), T)!;
    eq([p.name, p.note, p.team, p.starred, p.created, p.updated], ['Saved plan', '', ['omen'], false, T, T]);
    eq(p.query, newQuery());
    eq(sanitizePlan(plan({ name: 'x'.repeat(200) }))!.name.length, LIMITS.name);
  });
  spec('a party is two, three or five players, each with agents they play', () => {
    eq(sanitizeParty(party()), party() as unknown);
    eq(sanitizeParty(party({ players: [{ name: 'Solo', agents: [] }] })), null, 'one player is no party');
    eq(sanitizeParty(party({ players: [1, 2, 3, 4].map((n) => ({ name: `P${n}`, agents: [] })) })), null, 'four players');
    const p = sanitizeParty(party({ name: '', players: [{ agents: ['jett', 'jett', 'nope'] }, { name: 'B', agents: 'all' }, {}] }))!;
    eq(p.name, 'My party');
    eq(p.players, [{ name: 'Player 1', agents: ['jett'] }, { name: 'B', agents: [] }, { name: 'Player 3', agents: [] }]);
    eq(poolsOf(p), [['jett'], [], []]);
  });
});

describe('backups', () => {
  const data = (): BackupData => ({ settings: { resultCount: 15 }, themes: [], plans: [sanitizePlan(plan())!], parties: [sanitizeParty(party())!] });
  spec('a backup reads back whole', () => {
    const text = backupText(data(), '0.1.0', new Date(T));
    const r = readBackup(text);
    ok(r.ok);
    if (!r.ok) return;
    eq(r.data, data());
    eq(r.saved, new Date(T).toISOString());
    const raw = JSON.parse(text);
    eq([raw.kind, raw.format, raw.app], [BACKUP_KIND, BACKUP_FORMAT, '0.1.0']);
    eq(countsOf(r.data), { plans: 1, parties: 1, themes: 0 });
  });
  spec('files that aren’t backups are refused, and damaged parts of one are dropped', () => {
    ok(!readBackup('{nope').ok);
    ok(!readBackup('{"kind":"something-else"}').ok);
    ok(!readBackup(JSON.stringify({ kind: BACKUP_KIND, format: BACKUP_FORMAT + 1 })).ok, 'from a newer layout');
    const r = readBackup(JSON.stringify({ kind: BACKUP_KIND, format: 1, settings: { resultCount: 'lots', sound: false }, plans: [plan(), plan(), { id: 'x' }, 7], parties: 'none', themes: [{}] }));
    ok(r.ok);
    if (!r.ok) return;
    eq(r.data.settings, { sound: false });
    eq(r.data.plans.length, 1, 'the copy and the damaged ones are dropped');
    eq([r.data.parties, r.data.themes], [[], []]);
  });
  spec('merging keeps the newer copy of each plan and the settings here', () => {
    const here = data();
    const from = data();
    from.plans = [{ ...from.plans[0]!, name: 'Newer', updated: T + 1 }, { ...from.plans[0]!, id: 'p_other999', name: 'Other' }];
    from.settings = { resultCount: 5, sound: false };
    const m = mergeBackup(here, from);
    eq(m.plans.map((p) => p.name), ['Newer', 'Other']);
    eq(m.settings, { resultCount: 15, sound: false });
    eq(mergeBackup(emptyBackup(), emptyBackup()), emptyBackup());
  });
});

describe('settings', () => {
  spec('every setting has a default that passes its own check', () => {
    const d = defaultSettings();
    for (const k of SETTING_KEYS) {
      eq(sanitizeSetting(k, d[k]), d[k], k);
      ok(SETTINGS[k].label, `${k} has a label`);
    }
    eq(resolveSettings({}), d);
  });
  spec('values of the wrong kind are refused, and numbers kept in range', () => {
    eq(sanitizeSetting('resultCount', 1000), SETTINGS.resultCount.max);
    eq(sanitizeSetting('resultCount', '12'), undefined);
    eq(sanitizeSetting('defaultRank', 'gold 3'), undefined);
    eq(sanitizeSetting('defaultRank', 'radiant'), 'radiant');
    eq(sanitizeSettings({ resultCount: 12, sound: 'on', nothing: 1 }), { resultCount: 12 });
  });
});

describe('text', () => {
  spec('names are tidied, compared loosely and listed in plain English', () => {
    eq(clean('  Haven  attack​ '), 'Haven attack');
    eq(fold('KAY/O’s'), fold("kay/o's"));
    eq([listJoin([]), listJoin(['Omen']), listJoin(['Omen', 'Sova']), listJoin(['Omen', 'Sova', 'Jett'])], ['', 'Omen', 'Omen and Sova', 'Omen, Sova and Jett']);
  });
});
