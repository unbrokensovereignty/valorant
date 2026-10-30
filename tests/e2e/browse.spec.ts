import { expect, go, open, reload, test } from './app.ts';
import AxeBuilder from '@axe-core/playwright';
import { AGENTS, agentById } from '../../src/core/kb/agents.ts';
import { SINCE_FROM } from '../../src/core/engine/since.ts';

const hush = agentById('hush')!;

test('Rankings: tier lists move with the rank, comps open, and the by-map table fills in', async ({ page, errors }) => {
  await open(page, 'rankings');
  const tierS = page.getByRole('list', { name: /^Tier S: / });
  await page.getByRole('combobox', { name: 'Rank' }).selectOption({ label: 'Iron' });
  await expect(page.locator('.rank-where')).toContainText('Iron');
  const iron = await tierS.getAttribute('aria-label');
  await page.getByRole('combobox', { name: 'Rank' }).selectOption({ label: 'Radiant' });
  await expect(page.locator('.rank-where')).toContainText('Radiant');
  await expect(tierS).not.toHaveAttribute('aria-label', iron ?? '');
  // agents with the same fit are told apart by what they add over the next best of their role
  await expect(page.locator('.tier-agent').first()).toHaveAttribute('data-tip', /, (\d+ ahead of [A-Z/]+, the next best [a-z]+,|about as good as [A-Z/]+) in their best comp\./i);
  // every agent is in exactly one tier
  const tiers = await page.locator('.tier-agents').evaluateAll((uls) => uls.map((u) => u.querySelectorAll('.tier-agent').length));
  expect(tiers.reduce((a, b) => a + b, 0)).toBe(AGENTS.length);
  // a role filter keeps only that role
  await page.getByRole('group', { name: 'Role' }).getByRole('button', { name: 'Controllers' }).click();
  expect(await page.locator('.tier-agent').count()).toBeLessThanOrEqual(8);
  await page.getByRole('group', { name: 'Role' }).getByRole('button', { name: 'All' }).click();
  // a map changes the list's heading
  await page.getByRole('combobox', { name: 'Map' }).selectOption({ label: 'Lotus' });
  await expect(page.locator('.rank-where')).toHaveText('Lotus, both sides, Radiant');
  await page.getByRole('tab', { name: 'Comps' }).click();
  await expect(page.locator('.comps > li').first().getByRole('heading', { name: 'Pros' })).toBeVisible();
  await page.getByRole('tab', { name: 'Agents by map' }).click();
  // every cell is worked out in the background, then shows a tier
  await expect(page.getByRole('cell', { name: 'Working it out' })).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByRole('cell', { name: /^Sova on Abyss: tier [SABCD], fit \d+$/ })).toBeVisible();
  // an agent opens its page
  await page.getByRole('button', { name: 'Sova', exact: true }).first().click();
  await expect(page.locator('main h1')).toHaveText('Sova');
  expect(errors).toEqual([]);
});

test(`Rankings and an agent’s page mark the tiers that moved since ${SINCE_FROM}, and say why`, async ({ page, errors }) => {
  // at Immortal, where the pros' role mix now comes in with their second controller
  await open(page, 'rankings', { setup: true });
  const setup = page.getByRole('dialog', { name: 'Welcome to Playbook' });
  await setup.getByRole('combobox', { name: 'Your rank' }).selectOption({ label: 'Immortal' });
  await setup.getByRole('button', { name: 'Done' }).click();
  await expect(setup).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Map' }).selectOption({ label: 'Bind' });
  await page.getByRole('group', { name: 'Side' }).getByRole('button', { name: 'Both sides' }).click();
  await expect(page.locator('.rank-where')).toHaveText('Bind, both sides, Immortal');
  // comps built like the pros' now lead Bind at Immortal: Raze rises, with why in her tooltip and her name for screen readers
  const raze = page.locator('.tier-agent', { hasText: 'Raze' });
  await expect(raze.locator('.since-up')).toBeVisible();
  await expect(raze).toHaveAccessibleName(new RegExp(`^Raze \\(up from A since ${SINCE_FROM.replaceAll('.', '\\.')}\\)`));
  await expect(raze).toHaveAttribute('data-tip', /role mix pro teams play on Bind/);
  await raze.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tooltip')).toContainText('role mix pro teams play on Bind');
  // every move, with why, once for those that moved together
  const moves = page.getByRole('button', { name: /moved a tier since/ });
  await expect(moves).toHaveAttribute('aria-expanded', 'false');
  await moves.click();
  await expect(moves).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#since-moves')).toContainText('Yoru');
  await expect(page.locator('#since-moves')).toContainText('in full from Immortal');
  const a11y = await new AxeBuilder({ page }).include('.since-list').include('.tier-list').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations.map((v) => v.id)).toEqual([]);
  // Raze's page marks Bind among her best maps at your rank
  await go(page, 'agents/raze');
  await expect(page.getByLabel('Working it out')).toHaveCount(0, { timeout: 20_000 });
  const bind = page.locator('.best-maps .list-row', { hasText: 'Bind' });
  await expect(bind.locator('.since-up')).toBeVisible();
  await expect(bind).toHaveAttribute('data-tip', new RegExp(`^Up from A since ${SINCE_FROM.replaceAll('.', '\\.')}: The role mix pro teams play on Bind`));
  expect(errors).toEqual([]);
});

test('a fit that rests on very little says it’s less sure, and why', async ({ page, errors }) => {
  await open(page, 'rankings');
  await page.getByRole('combobox', { name: 'Map' }).selectOption({ label: 'Lotus' });
  await page.getByRole('group', { name: 'Side' }).getByRole('button', { name: 'Attack' }).click();
  await page.getByRole('combobox', { name: 'Rank' }).selectOption({ label: 'Gold' });
  await expect(page.locator('.rank-where')).toHaveText('Lotus, attack, Gold');
  // Hush's ranked numbers are from her first days, and her kit on Lotus has no play to check it yet
  const hush = page.locator('.tier-agent', { hasText: 'Hush' });
  await expect(hush.locator('.tier-agent-unsure')).toHaveText('less sure');
  for (const why of [/ Less sure: this fit could be off by about \d+, since /, /kit does on Lotus attack is judged from the abilities alone/, /from Hush’s first days/]) await expect(hush).toHaveAttribute('data-tip', why);
  // an agent with settled numbers isn't
  await expect(page.locator('.tier-agent-unsure')).toHaveCount(1);
  // Hush's page marks the fits too
  await go(page, 'agents/hush');
  await expect(page.getByLabel('Working it out')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('.by-rank-cell .fit.unsure').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('marked less sure');
  // and so does the Planner's Agents tab, on the row and, opened, with why
  await page.getByRole('button', { name: 'Plan with Hush' }).click();
  await expect(page.locator('.answers[aria-busy=true], .working')).toHaveCount(0, { timeout: 30_000 });
  await page.getByRole('tab', { name: 'Agents' }).click();
  const row = page.locator('.agent-row', { hasText: 'Hush' });
  await expect(row.locator('.unsure-tag')).toHaveText('less sure');
  await expect(row.locator('.tier')).toHaveAttribute('aria-label', /^Tier [SABCD], less sure$/);
  expect(await page.locator('.agent-row .unsure-tag').count()).toBe(1);
  await row.click();
  await expect(page.locator('.agent-rows li.open .agent-more')).toContainText(/Less sure: this fit could be off by about \d+, since /);
  expect(errors).toEqual([]);
});

test('Agents: each agent’s page has the kit, strengths, best maps and partners, and plans with them', async ({ page, errors }) => {
  await open(page, 'agents');
  for (const role of ['Duelists', 'Initiators', 'Controllers', 'Sentinels']) await expect(page.getByRole('heading', { name: new RegExp(`^${role}`) })).toBeVisible();
  await page.getByRole('button', { name: /^Killjoy/ }).click();
  await expect(page.locator('main h1')).toHaveText('Killjoy');
  for (const h of ['Abilities', 'Strengths', 'Best maps', 'Partners']) await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
  await expect(page.locator('.kit li')).toHaveCount(4);
  await expect(page.getByLabel('Working it out')).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Plan with Killjoy' }).click();
  await expect(page.locator('main h1')).toHaveText('Planner');
  await expect(page.locator('.answers-head')).toContainText('with Killjoy');
  // Hush's page has her kit in the game's words, with its marks shown, and says where her numbers come from
  await go(page, 'agents/hush');
  await expect(page.locator('.kit li')).toHaveCount(5);
  await expect(page.locator('.kit')).toContainText('Displacement');
  await expect(page.locator('.kit .kit-fx.enemy').first()).toBeVisible();
  await expect(page.locator('.kit')).not.toContainText('</>');
  await expect(page.locator('main')).toContainText('first days');
  await expect(page.locator('main')).toContainText('None yet');
  await expect(page.locator('main')).not.toContainText('estimate');
  expect(errors).toEqual([]);
});

test('Maps: the minimap zooms and moves, its callouts can be hidden, and each side has its tips, best comps and plays', async ({ page, errors }) => {
  await open(page, 'maps');
  await expect(page.getByRole('heading', { name: 'In the pool' })).toBeVisible();
  await page.getByRole('button', { name: /^Ascent/ }).click();
  await expect(page.locator('main h1')).toHaveText('Ascent');
  const map = page.getByRole('group', { name: /^Minimap of Ascent/ });
  await expect(map).toHaveAccessibleName(/^Minimap of Ascent with callouts\. Zoom with plus and minus/);
  await expect(map.locator('.minimap-label').first()).toBeVisible();
  // a dot on every callout, on by default
  const dots = map.locator('.minimap-dot');
  await expect(dots).toHaveCount(await map.locator('.minimap-label').count());
  await page.locator('label.toggle', { hasText: 'Dots on callouts' }).click();
  await expect(dots).toHaveCount(0);
  await page.locator('label.toggle', { hasText: 'Dots on callouts' }).click();
  await expect(dots.first()).toBeVisible();
  // the names grow with their size
  const label = map.locator('.minimap-label').first();
  const before = (await label.boundingBox())!.height;
  await page.getByRole('group', { name: 'Callout name size' }).getByRole('button', { name: 'Extra large' }).click();
  await expect.poll(async () => (await label.boundingBox())!.height).toBeGreaterThan(before * 1.3);
  await page.getByRole('group', { name: 'Callout name size' }).getByRole('button', { name: 'Medium' }).click();
  // zoom with the buttons and the keys, move with the arrows, and back out
  const stage = map.locator('.minimap-stage');
  await page.getByRole('button', { name: 'Zoom in' }).first().click();
  await expect(map).toHaveClass(/zoomed/);
  await map.focus();
  await page.keyboard.press('0');
  await expect(map).not.toHaveClass(/zoomed/);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  await expect(map).toHaveClass(/zoomed/);
  const at = await stage.getAttribute('style');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => stage.getAttribute('style')).not.toBe(at);
  await page.getByRole('button', { name: 'Show the whole map' }).first().click();
  await expect(map).not.toHaveClass(/zoomed/);
  await page.locator('label.toggle', { hasText: 'Show callouts' }).click();
  await expect(page.getByRole('switch', { name: 'Show callouts' })).not.toBeChecked();
  await expect(map).toHaveAccessibleName(/^Minimap of Ascent\. /);
  await expect(map.locator('.minimap-label')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Tips for attack' })).toBeVisible();
  await expect(page.locator('.comps > li')).toHaveCount(5, { timeout: 20_000 });
  await page.locator('.map-side').getByRole('button', { name: 'Defense' }).click();
  await expect(page.getByRole('list', { name: 'Tips for defense' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plays', exact: true })).toBeVisible();
  // a site's Plan button asks about that site
  await page.getByRole('button', { name: 'Plan for B site' }).click();
  await expect(page.locator('.answers-head h2')).toHaveText('Ascent, B site');
  expect(errors).toEqual([]);
});

test(`Home tells of ${hush.name} before the release day, and that ${hush.name} is new after it`, async ({ page, errors }) => {
  const day = (key: string, add: number) => {
    const d = new Date(`${key}T12:00:00`);
    d.setDate(d.getDate() + add);
    return d;
  };
  await page.clock.setFixedTime(day(hush.released, -3));
  await open(page, 'home');
  await expect(page.getByRole('heading', { name: new RegExp(`^${hush.name} arrives on `) })).toBeVisible();
  await page.clock.setFixedTime(day(hush.released, 2));
  await reload(page);
  await expect(page.getByRole('heading', { name: `${hush.name} is new` })).toBeVisible();
  await page.getByRole('button', { name: `About ${hush.name}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: hush.name, exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Settings: light or dark is applied at once and kept, and a theme of your own can be made', async ({ page, errors }) => {
  await open(page, 'settings');
  const html = page.locator('html');
  await page.getByRole('combobox', { name: 'Light or dark' }).selectOption({ label: 'Always dark' });
  await expect(html).toHaveAttribute('data-base', 'dark');
  await page.getByRole('combobox', { name: 'Light or dark' }).selectOption({ label: 'Always light' });
  await expect(html).toHaveAttribute('data-base', 'light');
  await reload(page);
  await expect(html).toHaveAttribute('data-base', 'light');
  await go(page, 'themes');
  await page.getByRole('button', { name: 'New theme' }).click();
  const dialog = page.getByRole('dialog', { name: 'Theme editor' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Night market');
  await dialog.getByRole('group', { name: 'Light or dark' }).getByRole('button', { name: 'Dark' }).click();
  await dialog.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Yours' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Night market In use' })).toHaveAttribute('aria-pressed', 'true');
  await expect(html).toHaveAttribute('data-base', 'dark');
  expect(errors).toEqual([]);
});
