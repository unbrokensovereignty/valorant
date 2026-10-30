import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, go, open, reload, saved, test } from './app.ts';

/** Waits for the Planner's answers to settle. */
async function answered(page: Page) {
  await page.waitForTimeout(300);
  await expect(page.locator('.answers[aria-busy=true], .working')).toHaveCount(0, { timeout: 30_000 });
}

/** Saves the Planner's open comp under `name`. */
async function savePlan(page: Page, name: string) {
  await page.locator('.comp.open').getByRole('button', { name: 'Save plan' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save this plan' });
  await dialog.getByRole('textbox').fill(name);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: `Saved “${name}”.` })).toBeVisible();
}

const a11y = async (page: Page, where: string) => {
  const r = await new AxeBuilder({ page }).include(where).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test('a saved plan keeps its comp, fit and note, and can be starred, renamed, deleted and brought back', async ({ page, errors }) => {
  await open(page, 'maps/haven');
  await page.getByRole('button', { name: 'Plan for Haven' }).click();
  await answered(page);
  const team = await page.locator('.comp.open .comp-names').textContent();
  const fit = await page.locator('.comp.open .comp-head .fit-num').textContent();
  await savePlan(page, 'Haven default');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByLabel('1 saved')).toBeVisible();
  // it opens from the toast's Open, or from the Saved page
  await go(page, 'saved');
  const row = page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Haven default/ });
  await row.click();
  const plan = page.getByRole('article', { name: 'Haven default' });
  await expect(plan).toBeVisible();
  // the same team and fit the Planner gave it
  for (const name of (team ?? '').split(', ')) await expect(plan.locator('.plan-team').getByRole('img', { name, exact: true })).toBeVisible();
  await expect(plan.locator('.plan-team .fit-num')).toHaveText(fit ?? '');
  await expect(plan.getByRole('heading', { name: 'Pros' })).toBeVisible();
  await plan.getByRole('tab', { name: 'Plays' }).click();
  await expect(plan.locator('.minimap').first()).toBeVisible();
  expect(await a11y(page, '.saved-layout')).toEqual([]);
  // a note, a star and a new name are kept through a reload
  await plan.getByRole('textbox', { name: 'Note' }).fill('Jett ops from A Long.');
  await plan.getByRole('button', { name: 'Star' }).click();
  await plan.getByRole('button', { name: 'Rename' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Haven attack, default');
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click();
  await saved(page);
  await reload(page);
  const again = page.getByRole('article', { name: 'Haven attack, default' });
  await expect(again.getByRole('textbox', { name: 'Note' })).toHaveValue('Jett ops from A Long.');
  await expect(again.getByRole('button', { name: 'Star' })).toHaveAttribute('aria-pressed', 'true');
  // printed, it carries its name and note, and a play for each side
  await page.evaluate(() => { window.print = () => {}; });
  await again.getByRole('button', { name: 'Print' }).click();
  const sheet = page.locator('#print-sheet');
  await expect(sheet.locator('h1')).toHaveText('Haven attack, default');
  await expect(sheet.locator('.sheet-own')).toHaveText('Jett ops from A Long.');
  await expect(sheet.locator('h2').filter({ hasText: /^On attack: / })).toHaveCount(1);
  await expect(sheet.locator('h2').filter({ hasText: /^On defense: / })).toHaveCount(1);
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  // Open in the Planner asks the same question again
  await again.getByRole('button', { name: 'Open in the Planner' }).click();
  await answered(page);
  await expect(page.locator('.answers-head h2')).toHaveText('Haven');
  // deleted, and brought back with Undo
  await go(page, 'saved');
  await page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Haven attack, default/ }).click();
  await page.getByRole('article').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'No saved plans yet' })).toBeVisible();
  await page.getByRole('status').filter({ hasText: 'Deleted' }).getByRole('button', { name: /Undo/ }).click();
  await expect(page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Haven attack, default/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an answer that looks wrong is flagged with a note, kept on the Saved page and in backups, and opens its question again', async ({ page, errors }) => {
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t: string) => { copied.push(t); } } });
  });
  await open(page, 'maps/lotus');
  await page.getByRole('button', { name: 'Plan for Lotus' }).click();
  await answered(page);
  const team = (await page.locator('.comp.open .comp-names').textContent())!;
  await page.locator('.comp.open').getByRole('button', { name: 'This looks wrong' }).click();
  const dialog = page.getByRole('dialog', { name: 'What looks wrong?' });
  await dialog.getByRole('textbox').fill('Two controllers at this rank?');
  await dialog.getByRole('button', { name: 'Keep the note' }).click();
  await page.getByRole('status').filter({ hasText: 'Noted.' }).getByRole('button', { name: 'Open' }).click();
  // on the Saved page, with what it's about and the question
  const list = page.getByRole('list', { name: 'Flagged answers' });
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('Two controllers at this rank?');
  await expect(list).toContainText(`Comp: ${team}`);
  await expect(list).toContainText('Lotus');
  await page.getByRole('button', { name: 'Copy all' }).click();
  const text = await page.evaluate(() => (window as unknown as { copied: string[] }).copied[0] ?? '');
  expect(text).toMatch(/^Playbook \d+\.\d+\.\d+: 1 flagged answer\n\n1\. Lotus/);
  expect(text).toContain('Note: Two controllers at this rank?');
  expect(await a11y(page, '.flag-list')).toEqual([]);
  // kept through a reload, and it opens its question again
  await saved(page);
  await reload(page);
  await page.getByRole('list', { name: 'Flagged answers' }).getByRole('button', { name: 'Open in the Planner' }).click();
  await answered(page);
  await expect(page.locator('.answers-head h2')).toHaveText('Lotus');
  // an agent's rating can be flagged too
  await page.getByRole('tab', { name: 'Agents' }).click();
  await page.locator('.agent-row').first().click();
  await page.getByRole('button', { name: 'This looks wrong' }).click();
  await page.getByRole('dialog', { name: 'What looks wrong?' }).getByRole('textbox').fill('Too high');
  await page.getByRole('dialog', { name: 'What looks wrong?' }).getByRole('button', { name: 'Keep the note' }).click();
  await go(page, 'saved/flagged');
  await expect(page.getByRole('list', { name: 'Flagged answers' }).getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('list', { name: 'Flagged answers' }).getByRole('listitem').first()).toContainText('Agent: ');
  // and deleted, with undo
  await page.getByRole('list', { name: 'Flagged answers' }).getByRole('button', { name: 'Delete this flag' }).first().click();
  await expect(page.getByRole('list', { name: 'Flagged answers' }).getByRole('listitem')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a party plans with the agents each player plays, and says when they can’t make a comp', async ({ page, errors }) => {
  await open(page, 'saved/parties');
  await page.getByRole('button', { name: 'Make a party' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Make a party' });
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Friday trio');
  await dialog.getByRole('group', { name: 'Party size' }).getByRole('button', { name: 'Trio' }).click();
  const pools: string[][] = [['Jett', 'Raze'], ['Omen'], ['Sova', 'Fade']];
  for (const [i, agents] of pools.entries()) {
    await dialog.locator('.party-player').nth(i).getByRole('button', { name: /: choose$/ }).click();
    const picker = page.getByRole('dialog').last();
    for (const a of agents) await picker.getByRole('button', { name: a, exact: true }).click();
    await picker.getByRole('button', { name: 'Done' }).click();
  }
  expect(await a11y(page, '[role=dialog]')).toEqual([]);
  await dialog.getByRole('button', { name: 'Make the party' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const party = page.locator('.party-row').filter({ hasText: 'Friday trio' });
  await expect(party).toContainText('Trio');
  await party.getByRole('button', { name: 'Plan' }).click();
  await answered(page);
  await expect(page.getByText('Only agents Friday trio plays')).toBeVisible();
  // every pick gives each player one of their own agents
  for (const names of await page.locator('.comps .comp-names b').allTextContents()) {
    expect(names).toMatch(/Jett|Raze/);
    expect(names).toContain('Omen');
    expect(names).toMatch(/Sova|Fade/);
  }
  // a party whose players all play only the same agent can't make a comp, and the page says why
  await go(page, 'saved/parties');
  await party.getByRole('button', { name: 'Edit Friday trio' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit the party' });
  for (let i = 0; i < 3; i++) {
    await edit.locator('.party-player').nth(i).getByRole('button', { name: /: change$/ }).click();
    const picker = page.getByRole('dialog').last();
    await picker.getByRole('button', { name: 'Clear' }).click();
    await picker.getByRole('button', { name: 'Jett', exact: true }).click();
    await picker.getByRole('button', { name: 'Done' }).click();
  }
  await edit.getByRole('button', { name: 'Save', exact: true }).click();
  await party.getByRole('button', { name: 'Plan' }).click();
  await answered(page);
  await expect(page.getByRole('heading', { name: 'No comp fits all of these choices' })).toBeVisible();
  await expect(page.getByText('Your party’s agents can’t make a comp with these choices.')).toBeVisible();
  expect(errors).toEqual([]);
});
