import { defineConfig, type Project } from '@playwright/test';

/**
 * End-to-end checks run against the built single file, just as people open it: in Chromium in a
 * light and a dark theme. `E2E_BROWSERS=others` runs Firefox (light) and WebKit, Safari's engine
 * (dark), instead, and `all` runs everything (those browsers need `npx playwright install firefox webkit`).
 */
const which = process.env['E2E_BROWSERS'] ?? 'chromium';
const chromium: Project[] = [
  { name: 'light', use: { colorScheme: 'light' } },
  { name: 'dark', use: { colorScheme: 'dark' } },
];
const others: Project[] = [
  { name: 'firefox', use: { browserName: 'firefox', colorScheme: 'light' } },
  { name: 'webkit', use: { browserName: 'webkit', colorScheme: 'dark' } },
];

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { viewport: { width: 1280, height: 820 }, browserName: 'chromium' },
  projects: which === 'others' ? others : which === 'all' ? [...chromium, ...others] : chromium,
});
