import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, open, overlaps, reload, saved, tabTo, test } from './app.ts';

const answers = (page: Page) => page.locator('.answers:not(.stale)');
const comps = (page: Page) => page.locator('.comps > li');
const question = (page: Page) => page.getByRole('region', { name: 'Your situation' });

/** Picks a map in the map dialog. */
async function chooseMap(page: Page, name: string) {
  await page.getByRole('button', { name: /^Map: .*\. Change$/ }).click();
  await page.getByRole('listbox', { name: 'Maps' }).getByRole('option', { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Opens an agent picker by its title, picks the agents named, and presses Done. */
async function chooseAgents(page: Page, title: string, names: string[]) {
  await page.getByRole('button', { name: `${title}: choose` }).click();
  const dialog = page.getByRole('dialog', { name: title });
  for (const n of names) await dialog.getByRole('button', { name: n, exact: true }).click();
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Waits for the answers to a question: its line under the title (when given) and no work left. */
const settledAnswers = async (page: Page, line?: string) => {
  if (line) await expect(page.locator('.answers-head')).toContainText(line, { timeout: 10_000 });
  await expect(page.locator('.answers[aria-busy=true], .working')).toHaveCount(0, { timeout: 30_000 });
  await expect(comps(page).first()).toBeVisible();
};

test('ask for a map, side and rank, and get comps with pros and cons, plays and tips', async ({ page, errors }) => {
  await open(page, 'planner');
  await chooseMap(page, 'Haven');
  await question(page).getByRole('group', { name: 'Side' }).getByRole('button', { name: 'Attack' }).click();
  await question(page).getByRole('combobox', { name: 'Rank' }).selectOption({ label: 'Diamond' });
  await settledAnswers(page);
  await expect(answers(page).locator('h2').first()).toHaveText('Haven, attack');
  await expect(answers(page)).toContainText('Diamond · five-stack');
  expect(await comps(page).count()).toBeGreaterThanOrEqual(5);
  // the best comp starts open, with its reasons
  const first = comps(page).first();
  await expect(first.locator('.comp-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(first.getByRole('heading', { name: 'Pros' })).toBeVisible();
  await expect(first.getByRole('heading', { name: 'Cons' })).toBeVisible();
  // its plays draw on the minimap, and every job goes to someone on the team
  await first.getByRole('tab', { name: 'Plays' }).click();
  await expect(first.locator('.minimap').first()).toBeVisible();
  await first.getByRole('tab', { name: 'Tips' }).click();
  await expect(first.locator('.tips li').first()).toBeVisible();
  // another comp opens, and the first one closes
  await comps(page).nth(2).locator('.comp-head').click();
  await expect(comps(page).nth(2).locator('.comp-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(first.locator('.comp-head')).toHaveAttribute('aria-expanded', 'false');
  // a site narrows the question
  await question(page).getByRole('button', { name: 'C site' }).click();
  await settledAnswers(page);
  await expect(answers(page).locator('h2').first()).toHaveText('Haven, attack, C site');
  const r = await new AxeBuilder({ page }).include('.answers').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  expect(await overlaps(page, '.answers-head')).toEqual([]);
  expect(errors).toEqual([]);
});

test('must-play agents are in every comp, and role counts are kept', async ({ page, errors }) => {
  await open(page, 'planner');
  await chooseMap(page, 'Bind');
  await chooseAgents(page, 'Agents the team must play', ['Jett', 'Omen']);
  await settledAnswers(page, 'with Jett and Omen');
  for (const names of await page.locator('.comps .comp-names').allTextContents()) {
    expect(names).toContain('Jett');
    expect(names).toContain('Omen');
  }
  // two controllers: Omen and one more in every comp
  await question(page).getByRole('group', { name: 'Controllers: how many' }).getByRole('button', { name: '2' }).click();
  await settledAnswers(page, 'two controllers');
  const controllers = ['Astra', 'Brimstone', 'Clove', 'Harbor', 'Miks', 'Viper'];
  for (const names of await page.locator('.comps .comp-names').allTextContents()) expect(controllers.filter((c) => names.includes(c))).toHaveLength(1);
  // a count that no longer fits gives way to the one just set
  await question(page).getByRole('group', { name: 'Sentinels: how many' }).getByRole('button', { name: '3' }).click();
  await expect(question(page).getByRole('group', { name: 'Controllers: how many' }).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true');
  await expect(question(page).getByRole('group', { name: 'Sentinels: how many' }).getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true');
  await settledAnswers(page, 'three sentinels');
  // a third must-play agent leaves no room for three sentinels, and asking for them again says so
  await page.getByRole('button', { name: 'Agents the team must play: change' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sova', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
  await settledAnswers(page, 'with Jett, Omen and Sova');
  await expect(answers(page)).not.toContainText('sentinels');
  await expect(question(page).getByRole('group', { name: 'Sentinels: how many' }).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true');
  await question(page).getByRole('group', { name: 'Sentinels: how many' }).getByRole('button', { name: '3' }).click();
  await expect(page.getByText('3 sentinels won’t fit beside the agents who must play.')).toBeVisible();
  await expect(question(page).getByRole('group', { name: 'Sentinels: how many' }).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true');
  // a left-out agent is never suggested, and Start over clears it all
  await chooseAgents(page, 'Agents to leave out', ['Sage']);
  await page.waitForTimeout(400);
  await settledAnswers(page);
  for (const names of await page.locator('.comps .comp-names').allTextContents()) expect(names).not.toContain('Sage');
  await question(page).getByRole('button', { name: 'Start over' }).click();
  await settledAnswers(page);
  await expect(question(page).getByRole('button', { name: 'Start over' })).toBeDisabled();
  await expect(answers(page).locator('h2').first()).toHaveText('Any map');
  expect(errors).toEqual([]);
});

test('their team: each comp says how it stands against the agents they play, and they can still be picked', async ({ page, errors }) => {
  await open(page, 'planner');
  await chooseMap(page, 'Breeze');
  await question(page).getByRole('group', { name: 'Side' }).getByRole('button', { name: 'Attack' }).click();
  await question(page).getByRole('combobox', { name: 'Rank' }).selectOption({ label: 'Immortal' });
  await chooseAgents(page, 'Agents the other team plays', ['Chamber', 'Jett', 'Viper']);
  await settledAnswers(page, 'against Chamber, Jett and Viper');
  const first = comps(page).first();
  await expect(first.getByRole('heading', { name: 'Against their team' })).toBeVisible();
  await expect(first.locator('.against-row').first()).toContainText('Their Chamber and Jett hold long angles with the Operator.');
  // both teams can play the same agent: Viper is still in the comps
  expect((await page.locator('.comps .comp-names').allTextContents()).some((n) => n.includes('Viper'))).toBe(true);
  const r = await new AxeBuilder({ page }).include('.against').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  // without their agents, the comps don't speak of them
  for (const name of ['Chamber', 'Jett', 'Viper']) await question(page).getByRole('button', { name: `Remove ${name}` }).click();
  await settledAnswers(page);
  await expect(page.locator('.answers-head')).not.toContainText('against');
  await expect(page.locator('.against')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a duo finds its best map: the maps are ranked and each one opens its picks', async ({ page, errors }) => {
  test.setTimeout(90_000);
  await open(page, 'planner');
  await question(page).getByRole('group', { name: 'Party size' }).getByRole('button', { name: 'Duo' }).click();
  await chooseMap(page, 'Find the best map');
  await settledAnswers(page);
  await expect(answers(page).locator('h2').first()).toHaveText('Best maps for you');
  const options = page.getByRole('listbox', { name: 'Situations, best first' }).getByRole('option');
  await expect(options).toHaveCount(7);
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  const sub = answers(page).locator('h2.answers-sub');
  const before = await sub.textContent();
  await options.nth(3).click();
  await expect(options.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(sub).not.toHaveText(before ?? '');
  // a duo's pick names the two of you and the picks for your random teammates
  await expect(comps(page).first().locator('.comp-names')).toContainText(' with ');
  await expect(page.getByRole('tab', { name: 'Duo picks' })).toBeVisible();
  // the agents tab ranks every agent for the situation
  await page.getByRole('tab', { name: 'Agents' }).click();
  expect(await page.locator('.agent-row').count()).toBeGreaterThanOrEqual(25);
  expect(errors).toEqual([]);
});

test('a duo’s best pick says which role to ask random teammates for, and how often they pick one', async ({ page, errors }) => {
  await open(page, 'planner');
  await question(page).getByRole('group', { name: 'Party size' }).getByRole('button', { name: 'Duo' }).click();
  await chooseMap(page, 'Ascent');
  await settledAnswers(page);
  // the picks for your random teammates, then what to expect if they pick on their own
  await expect(comps(page).first().locator('.party-box p').first()).toHaveText(/^Your party: .+\. If your random teammates play .+, the team fits \d+ out of 100 \(the best five-stack is 100\)\. If they pick on their own, expect a team that fits about \d+, give or take \d+\.$/);
  const ask = comps(page).first().locator('.party-box p').nth(1);
  await expect(ask).toHaveText(/^Ask your teammates for (?:a (?:duelist|controller|sentinel)|an initiator) first: they pick one on their own (?:in about \d+ of 10 games|in nearly every game|hardly ever), and with one, expect about \d+\./);
  expect(await ask.textContent()).not.toMatch(/\ba [aeiou]/i);
  expect(errors).toEqual([]);
});

test('teammates already locked in are part of every team and never in your party', async ({ page, errors }) => {
  await open(page, 'planner');
  // the first answers in place, so nothing moves under the click
  await settledAnswers(page, 'Any map');
  await question(page).getByRole('group', { name: 'Party size' }).getByRole('button', { name: 'Trio' }).click();
  await chooseAgents(page, 'Agents your teammates locked in', ['Jett', 'Omen']);
  await page.waitForTimeout(400);
  await settledAnswers(page);
  for (const li of await comps(page).all()) {
    const names = (await li.locator('.comp-names').textContent()) ?? '';
    const [party, rest] = names.split(' with ');
    expect(party).not.toMatch(/Jett|Omen/);
    expect(rest).toContain('Jett');
    expect(rest).toContain('Omen');
  }
  expect(errors).toEqual([]);
});

test('the question is kept: a reload brings back the same question and answers', async ({ page, errors }) => {
  await open(page, 'planner');
  await chooseMap(page, 'Lotus');
  await question(page).getByRole('group', { name: 'Side' }).getByRole('button', { name: 'Defense' }).click();
  await settledAnswers(page, 'Lotus, defense');
  const best = await comps(page).first().locator('.comp-names').textContent();
  await saved(page);
  await reload(page);
  await settledAnswers(page);
  await expect(answers(page).locator('h2').first()).toHaveText('Lotus, defense');
  await expect(comps(page).first().locator('.comp-names')).toHaveText(best ?? '');
  expect(errors).toEqual([]);
});

test('the Planner works from the keyboard alone', async ({ page, errors }) => {
  await open(page, 'planner');
  const mapButton = page.getByRole('button', { name: /^Map: .*\. Change$/ });
  await tabTo(page, mapButton);
  await page.keyboard.press('Enter');
  const listbox = page.getByRole('listbox', { name: 'Maps' });
  await expect(listbox).toBeVisible();
  const ascent = listbox.getByRole('option', { name: /^Ascent/ });
  await ascent.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // focus goes back to the button that opened the dialog
  await expect(mapButton).toBeFocused();
  await expect(mapButton).toHaveAccessibleName('Map: Ascent. Change');
  await settledAnswers(page, 'Ascent');
  // a comp opens and closes with Enter
  const head = comps(page).nth(1).locator('.comp-head');
  await head.focus();
  await page.keyboard.press('Enter');
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Enter');
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  // Escape closes the agent picker without changing anything
  await page.getByRole('button', { name: 'Agents the team must play: choose' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Agents the team must play: choose' })).toBeFocused();
  expect(errors).toEqual([]);
});
