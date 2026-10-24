import { expect, go, open, test } from './app.ts';
import { agentById } from '../../src/core/kb/agents.ts';

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
  // every agent is in exactly one tier
  const tiers = await page.locator('.tier-agents').evaluateAll((uls) => uls.map((u) => u.querySelectorAll('.tier-agent').length));
  expect(tiers.reduce((a, b) => a + b, 0)).toBe(30);
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
  // the new agent's page says the numbers are early estimates
  await go(page, 'agents/hush');
  await expect(page.locator('main')).toContainText('estimate');
  expect(errors).toEqual([]);
});

test('Maps: the minimap’s callouts can be hidden, and each side has its tips, best comps and plays', async ({ page, errors }) => {
  await open(page, 'maps');
  await expect(page.getByRole('heading', { name: 'In the pool' })).toBeVisible();
  await page.getByRole('button', { name: /^Ascent/ }).click();
  await expect(page.locator('main h1')).toHaveText('Ascent');
  const map = page.getByRole('img', { name: /^Minimap of Ascent/ });
  await expect(map).toHaveAccessibleName('Minimap of Ascent with callouts');
  await expect(map.locator('.minimap-label').first()).toBeVisible();
  await page.locator('label.toggle', { hasText: 'Show callouts' }).click();
  await expect(page.getByRole('switch', { name: 'Show callouts' })).not.toBeChecked();
  await expect(map).toHaveAccessibleName('Minimap of Ascent');
  await expect(map.locator('.minimap-label')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Tips for attack' })).toBeVisible();
  await expect(page.locator('.comps > li')).toHaveCount(5, { timeout: 20_000 });
  await page.locator('.map-side').getByRole('button', { name: 'Defense' }).click();
  await expect(page.getByRole('list', { name: 'Tips for defense' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plays' })).toBeVisible();
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
  await page.reload();
  await page.waitForSelector('.shell');
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
  await page.reload();
  await page.waitForSelector('.shell');
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
