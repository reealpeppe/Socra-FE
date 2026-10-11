import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:3160';
assert.match(baseURL, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const fixture = JSON.parse(await readFile(process.env.DESIGN_FIXTURE_PATH || path.resolve('../backend/.local/ux-review-fixture.json'), 'utf8'));
const directory = path.resolve('output/playwright/design', process.env.DESIGN_ROUND || 'dashboard-priority');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { captures: [], checks: [], errors: [] };
async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  assert.ok(sizes.content <= sizes.width + 1, `${name}: horizontal overflow ${JSON.stringify(sizes)}`);
  await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: path.join(directory, `${name}-viewport.png`), animations: 'disabled' });
  report.captures.push(name);
}
try {
  for (const [name, viewport, zoom] of [
    ['desktop', { width: 1440, height: 1000 }, 1],
    ['intermediate', { width: 1024, height: 900 }, 1],
    ['mobile', { width: 390, height: 844 }, 1],
    ['zoom125', { width: 1440, height: 1000 }, 1.25],
  ]) {
    const context = await browser.newContext({ viewport, baseURL });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('/login');
    await page.getByLabel('Username o email', { exact: true }).fill(fixture.users.learner.username);
    await page.getByLabel('Password', { exact: true }).fill('SocraDemo2026!');
    await page.getByRole('button', { name: 'Accedi', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
    if (zoom !== 1) await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
    const nextStep = page.getByRole('link', { name: 'Trova un mentor', exact: true });
    await expect(nextStep).toHaveAttribute('href', /\/matching\?goalId=/);
    const actionBox = await nextStep.boundingBox();
    assert.ok(actionBox.y + actionBox.height < viewport.height - (name === 'mobile' ? 64 : 0), `${name}: next step below first viewport`);
    const help = page.locator('summary').filter({ hasText: 'Cos’è un ETF?' });
    const definition = page.getByText('ETF significa Exchange Traded Fund: un fondo quotato in borsa.', { exact: true });
    await expect(definition).not.toBeVisible();
    await help.press('Enter');
    await expect(definition).toBeVisible();
    await definition.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const definitionBox = await definition.boundingBox();
    assert.ok(definitionBox.y >= 0 && definitionBox.y + definitionBox.height < viewport.height - (name === 'mobile' ? 64 : 0), `${name}: definition obscured in viewport`);
    await capture(page, `${name}-etf-help`);
    await help.press('Enter');
    await expect(definition).not.toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    await capture(page, `${name}-dashboard`);
    await page.getByRole('button', { name: /Notifiche/ }).click();
    await expect(page.locator('.notification-item').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture(page, `${name}-notifications`);
    const metrics = await page.locator('.notification-item').evaluateAll(items => items.map(item => {
      const box = item.getBoundingClientRect();
      const children = [...item.children].map(child => { const r = child.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; });
      const cs = getComputedStyle(item);
      return { height: box.height, top: box.top, bottom: box.bottom, left: box.left, right: box.right, children, display: cs.display, flexShrink: cs.flexShrink };
    }));
    const failures = metrics.filter(item => item.children.some(child => child.top < item.top || child.bottom > item.bottom + 1 || child.left < item.left || child.right > item.right + 1));
    report.checks.push({ name, zoom, metrics, failures, keyboardHelp: 'Enter opens/closes native details', keyboardMenu: 'Escape returns focus to notification trigger', nextStep: { action: 'Trova un mentor', firstViewport: true, bounds: actionBox }, definition: { closedInitially: true, visibleWhenOpened: true, viewportBounds: definitionBox }, horizontalOverflow: false });
    assert.equal(failures.length, 0, `${name}: notification content escapes ${failures.length} buttons`);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Notifiche/ })).toBeFocused();
    if (name === 'desktop' || name === 'mobile') {
      const goals = await (await page.request.get('/api/backend/goals/me')).json();
      const actualPaths = await (await page.request.get('/api/backend/paths/me')).json();
      const openPath = actualPaths.find(item => item.status === 'open');
      assert.ok(openPath, 'Fixture requires an open path');
      const syntheticPath = { ...openPath, mentor_id: fixture.users.mentor.id, mentor: { ...openPath.mentor, id: fixture.users.mentor.id, nickname: fixture.users.mentor.nickname } };
      for (const [state, mockedGoals, mockedPaths, action, destination] of [
        ['empty', { ...goals, active_goal: null, current: null }, [], 'Definisci obiettivo', '/goal'],
        ['active', goals, [{ ...syntheticPath, mentee_id: fixture.users.learner.id, status: 'open' }], 'Apri il percorso', `/paths/${syntheticPath.id}`],
        ['review', goals, [{ ...syntheticPath, mentee_id: fixture.users.learner.id, status: 'completed', goal_review_completed: false }], 'Rivedi obiettivo', `/goal?pathId=${encodeURIComponent(syntheticPath.id)}`],
      ]) {
        await page.route('**/api/backend/goals/me', route => route.fulfill({ json: mockedGoals }));
        await page.route('**/api/backend/paths/me', route => route.fulfill({ json: mockedPaths }));
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
        const actionLink = page.locator('section[aria-labelledby="learning-title"]').getByRole('link', { name: action, exact: true });
        await expect(actionLink).toBeVisible();
        await expect(actionLink).toHaveAttribute('href', destination);
        await capture(page, `${name}-${state}`);
        report.checks.push({ name: `${name}-${state}`, kind: 'mocked API presentation state', action, destination });
        await page.unroute('**/api/backend/goals/me');
        await page.unroute('**/api/backend/paths/me');
      }
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []);
} catch (error) { report.errors.push(error.stack || String(error)); process.exitCode = 1; }
finally { await browser.close(); await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ directory, checks: report.checks.length, errors: report.errors })); }
