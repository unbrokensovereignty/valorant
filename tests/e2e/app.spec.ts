import type { Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, go, open, saved, test } from './app.ts';

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

test('Search finds agents, maps and help from the keyboard', async ({ page, errors }) => {
  await open(page, 'home');
  await page.keyboard.press('Control+k');
  const box = page.getByRole('dialog', { name: 'Search commands' });
  await expect(box.getByRole('combobox', { name: 'Search' })).toBeFocused();
  await page.keyboard.type('harb');
  await expect(box.getByRole('option').first()).toContainText('Harbor');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Harbor');
  // "/" opens it too, and a map takes you to its page
  await page.keyboard.press('/');
  await page.keyboard.type('icebox');
  await page.keyboard.press('Enter');
  await expect(page.locator('main h1')).toHaveText('Icebox');
  // Escape closes it and gives focus back
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog', { name: 'Search commands' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // "?" shows the keys
  await page.keyboard.press('?');
  await expect(page.getByRole('tab', { name: 'Keyboard' })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('Copy puts the whole plan into words: the comp, its reasons, a play and tips', async ({ page, errors }) => {
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t: string) => { copied.push(t); } } });
  });
  await open(page, 'maps/split');
  await page.getByRole('button', { name: 'Plan for Split' }).click();
  await answered(page);
  await page.locator('.comp.open').getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied the plan.' })).toBeVisible();
  const text = await page.evaluate(() => (window as unknown as { copied: string[] }).copied[0] ?? '');
  const team = (await page.locator('.comp.open .comp-names').textContent()) ?? '';
  expect(text).toMatch(/^Playbook: Split · /);
  expect(text).toContain(`Comp: ${team}. Fit `);
  expect(text).toMatch(/\nPros\n- /);
  expect(text).toMatch(/\nPlay: .+\n/);
  expect(text).toMatch(/\n1\. .+: .+ → .+\./);
  expect(text).toMatch(/\nTips\n- /);
  expect(errors).toEqual([]);
});

test('a backup brings a deleted plan back, a file that isn’t one is refused, and Ctrl Z undoes a delete', async ({ page, errors }, info) => {
  await open(page, 'maps/bind');
  await page.getByRole('button', { name: 'Plan for Bind' }).click();
  await answered(page);
  await savePlan(page, 'Bind retakes');
  await saved(page);
  // back up
  await go(page, 'settings/data');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Back up now' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^Playbook backup \d{4}-\d{2}-\d{2}\.json$/);
  const file = info.outputPath('backup.json');
  await download.saveAs(file);
  expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ app: expect.any(String) });
  // delete the plan, and Ctrl Z brings it back
  await go(page, 'saved');
  await page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Bind retakes/ }).click();
  await page.getByRole('article').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'No saved plans yet' })).toBeVisible();
  await page.locator('main h1').click();
  await page.keyboard.press('Control+z');
  await expect(page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Bind retakes/ })).toBeVisible();
  // delete it again, then restore the backup
  await page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Bind retakes/ }).click();
  await page.getByRole('article').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'No saved plans yet' })).toBeVisible();
  await go(page, 'settings/data');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Restore…' }).click()]);
  await chooser.setFiles(file);
  const dialog = page.getByRole('dialog', { name: 'Restore this backup?' });
  await expect(dialog).toContainText('1 saved plan');
  await dialog.getByRole('button', { name: 'Merge' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Backup merged in.' })).toBeVisible();
  await go(page, 'saved');
  await expect(page.getByRole('list', { name: 'Saved plans' }).getByRole('button', { name: /Bind retakes/ })).toBeVisible();
  // a file that isn't a backup is refused with a reason
  await go(page, 'settings/data');
  const bad = info.outputPath('not-a-backup.json');
  writeFileSync(bad, '{"hello": 1}');
  const [chooser2] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Restore…' }).click()]);
  await chooser2.setFiles(bad);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});
