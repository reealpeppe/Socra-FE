import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:3160';
assert.match(baseURL, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const round = process.env.DESIGN_ROUND || 'round-1';
const directory = path.resolve('output/playwright/design', round);
await mkdir(directory, { recursive: true });
const fixturePath = process.env.DESIGN_FIXTURE_PATH || path.resolve('../backend/.local/ux-review-fixture.json');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const report = { baseURL, round, screenshots: [], checks: [], errors: [] };
async function capture(page, name) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('status').filter({ hasText: /Caricamento|Verifica sessione/ })).toHaveCount(0);
  await expect(page.getByRole('status', { name: /Caricamento/ })).toHaveCount(0);
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  if (new URL(page.url()).pathname === '/matching') {
    await expect(page.getByText(fixture.users.mentor.nickname, { exact: true }).first()).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.locator('body').evaluate(el => { el.scrollTop = 0; });
  await page.evaluate(() => scrollTo(0, 0));
  const overflow = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(overflow.content <= overflow.viewport + 1, `${name}: horizontal overflow ${JSON.stringify(overflow)}`);
  const font = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  assert.match(font, /manrope/i, `${name}: local font not active`);
  await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: path.join(directory, `${name}-viewport.png`), animations: 'disabled' });
  report.screenshots.push(`${name}.png`, `${name}-viewport.png`);
  const visibleText = await page.locator('main').innerText();
  await writeFile(path.join(directory, `${name}-content.txt`), visibleText);
  report.checks.push({ name, overflow, font, url: page.url(), ready: true });
  console.log(`PASS ${name}`);
}
try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ baseURL, viewport, hasTouch: device === 'mobile', isMobile: device === 'mobile' });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Inizia ora', exact: true })).toBeVisible();
    await expect(page.locator('main img')).toBeVisible();
    await expect(page.locator('main img')).toHaveJSProperty('complete', true);
    await capture(page, `${device}-home`);
    if (device === 'mobile') {
      await page.getByRole('button', { name: 'Apri menu' }).click();
      await expect(page.locator('#public-mobile-menu')).toBeVisible();
      await capture(page, `${device}-public-menu`);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Apri menu' })).toBeFocused();
    }
    for (const route of ['community', 'come-funziona', 'sicurezza', 'faq', 'register', 'login']) {
      await page.goto(`/${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await capture(page, `${device}-${route}`);
    }
    await page.getByLabel('Username o email', { exact: true }).fill(fixture.users.learner.username);
    await page.getByLabel('Password', { exact: true }).fill('SocraDemo2026!');
    await page.getByRole('button', { name: 'Accedi', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Ciao/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trova un mentor', exact: true })).toBeVisible();
    await capture(page, `${device}-dashboard`);
    for (const route of ['matching', 'goal', 'competenze', 'paths?tab=mentor', 'settings', 'requests', 'wallet']) {
      await page.goto(`/${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0, { timeout: 30000 });
      await capture(page, `${device}-${route.split('?')[0]}`);
    }
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Ciao/ })).toBeVisible();
    await page.getByRole('button', { name: /Apri il menu account/ }).click();
    await expect(page.getByRole('dialog', { name: fixture.users.learner.nickname, exact: true })).toBeVisible();
    await capture(page, `${device}-account-menu`);
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await page.locator('.account-button').evaluate(el => getComputedStyle(el).transitionDuration);
    assert.equal(duration, '0s', `${device}: reduced motion not honored`);
    report.checks.push({ name: `${device}-reduced-motion`, duration });
    await context.close();
  }
  assert.deepEqual(report.errors, [], 'Uncaught browser errors');
} catch (error) { report.errors.push(error.stack || String(error)); process.exitCode = 1; }
finally {
  await browser.close();
  await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Evidence: ${directory}`);
  if (report.errors.length) console.error(report.errors.join('\n'));
}
