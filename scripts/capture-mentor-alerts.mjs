// Real local APIs and synthetic accounts; no provider calls or production data.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.resolve(process.env.UX_BACKEND_DIR || '');
assert.ok(process.env.UX_BACKEND_DIR, 'UX_BACKEND_DIR must select the isolated backend checkout');
const python = path.join(backend, '.venv', 'Scripts', 'python.exe');
const baseURL = 'http://127.0.0.1:3178', apiURL = 'http://127.0.0.1:8178';
const env = { ...process.env, SOCRA_ENV: 'test', SOCRA_EMAIL_ENABLED: 'false', SOCRA_EMAIL_VERIFICATION_REQUIRED: 'false',
  SOCRA_GOOGLE_MEET_ENABLED: 'false', SOCRA_GOOGLE_MEET_TRANSCRIPTS_ENABLED: 'false',
  SOCRA_DATABASE_URL: `sqlite:///${path.join(backend, '.local', 'mentor-alerts-preview.sqlite3').replaceAll('\\', '/')}`,
  SOCRA_API_BASE_URL: apiURL, SOCRA_PUBLIC_APP_URL: baseURL, SOCRA_PUBLIC_ORIGINS: baseURL };
const fixture = JSON.parse(execFileSync(python, ['scripts/seed_mentor_alerts.py'], { cwd: backend, env, encoding: 'utf8', windowsHide: true }));
const output = path.join(root, 'output', 'playwright', 'mentor-alerts', new Date().toISOString().replaceAll(':', '-'));
await mkdir(output, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { fixture: fixture.fixture, backend_base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: backend, encoding: 'utf8' }).trim(),
  frontend_base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  build: (await readFile(path.join(root, '.next', 'BUILD_ID'), 'utf8')).trim(), artifacts: [], checks: [], technical_status: 'running',
  limitations: ['Local SQLite fixture, no PostgreSQL evidence', 'No email provider or notification job', 'Desktop and mobile only'], review_status: 'pending' };
async function sourceFingerprint() {
  const hashes = [];
  for (const dir of [root, backend]) {
    const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: dir, encoding: 'utf8' }).trim().split(/\r?\n/)
      .filter(file => /^(app|components|lib)\//.test(file));
    for (const file of [...new Set(files)].sort()) hashes.push([dir === root ? 'frontend' : 'backend', file, digest(await readFile(path.join(dir, file)))]);
  }
  return digest(JSON.stringify(hashes));
}
manifest.source_fingerprint = await sourceFingerprint();
const children = [];
async function start(command, args, cwd, health) {
  // Refuse occupied ports; never attach this fixture to somebody else's server.
  if (await fetch(health).then(() => true).catch(() => false)) throw new Error(`Port already occupied: ${health}`);
  const child = spawn(command, args, { cwd, env, windowsHide: true, stdio: 'ignore' });
  children.push(child);
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(`Preview process exited: ${child.exitCode}`);
    if (await fetch(health).then(response => response.ok).catch(() => false)) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Preview did not start: ${health}`);
}
let browser;
try {
  await start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8178'], backend, `${apiURL}/health`);
  await start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3178'], root, `${baseURL}/login`);
  browser = await chromium.launch({ channel: 'chrome' });
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, baseURL });
    const page = await context.newPage();
    const api = async endpoint => {
      const result = await page.evaluate(async endpoint => { const response = await fetch(`/api/backend${endpoint}`, { credentials: 'same-origin', cache: 'no-store' }); return { status: response.status, body: await response.json() }; }, endpoint);
      assert.equal(result.status, 200); return result.body;
    };
    const capture = async stage => {
      const file = `${name}-${stage}.png`;
      const bytes = await page.screenshot({ path: path.join(output, file) });
      manifest.artifacts.push({ file, sha256: digest(bytes), viewport: name });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    };
    await page.goto('/login');
    await page.getByLabel('Username o email', { exact: true }).fill(fixture.users[name].username);
    await page.getByLabel('Password', { exact: true }).fill('SocraAlertsDemo2026!');
    await page.getByRole('button', { name: 'Accedi', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    assert.equal((await api('/auth/me')).id, fixture.users[name].id);
    await page.goto('/matching');
    await expect(page.getByRole('button', { name: 'Avvisami via email', exact: true })).toBeEnabled();
    await capture('empty');
    await page.getByRole('button', { name: 'Avvisami via email', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Le notifiche sono attive' })).toBeVisible();
    assert.equal((await api('/mentor-alerts/me')).enabled, true);
    await capture('active');
    await page.reload();
    await expect(page.getByRole('status').filter({ hasText: 'Le notifiche sono attive' })).toBeVisible();
    await page.getByRole('link', { name: 'Gestisci gli avvisi nelle impostazioni' }).click();
    await expect(page).toHaveURL(/\/settings#mentor-alerts$/);
    const toggle = page.getByRole('switch', { name: 'Avvisi sui mentor via email', exact: true });
    await expect(toggle).toBeChecked();
    await page.locator('#mentor-alerts').evaluate(element => element.scrollIntoView({ block: 'start' }));
    await capture('settings');
    await toggle.click();
    await expect(page.getByRole('status').filter({ hasText: 'Avvisi sui mentor disattivati' })).toBeVisible();
    await expect(toggle).not.toBeChecked();
    assert.equal((await api('/mentor-alerts/me')).enabled, false);
    await toggle.click();
    await expect(page.getByRole('status').filter({ hasText: 'Avvisi sui mentor attivati' })).toBeVisible();
    const linkCode = "from sqlalchemy import select; from app.db.session import get_session_factory; from app.models import User; from app.services.mentor_alert_service import MentorAlertService; import sys; db=get_session_factory()(); user=db.scalar(select(User).where(User.username==sys.argv[1])); print(MentorAlertService(db).unsubscribe_url(user.id)); db.close()";
    const link = execFileSync(python, ['-c', linkCode, fixture.users[name].username], { cwd: backend, env, encoding: 'utf8', windowsHide: true }).trim();
    await page.goto(link);
    await expect.poll(() => new URL(page.url()).hash).toBe('');
    assert.equal((await api('/mentor-alerts/me')).enabled, true);
    await capture('unsubscribe');
    await page.getByRole('button', { name: 'Disattiva gli avvisi sui mentor', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Avvisi sui mentor disattivati');
    assert.equal((await api('/mentor-alerts/me')).enabled, false);
    await capture('unsubscribed');
    manifest.checks.push({ viewport: name, real_login: true, matching_empty: true, opted_in: true, reload_persisted: true,
      settings_destination: '/settings#mentor-alerts', settings_revoked: true, email_link_requires_confirmation: true, email_link_revoked: true });
    await context.close();
  }
  assert.equal(await sourceFingerprint(), manifest.source_fingerprint, 'Product sources changed during capture');
  manifest.technical_status = 'passed';
} catch (error) { manifest.technical_status = 'failed'; manifest.error = error.message; throw error; }
finally {
  if (browser) await browser.close();
  for (const child of children.reverse()) child.kill();
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ output, technical_status: manifest.technical_status, screenshots: manifest.artifacts.length }));
}
