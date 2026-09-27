import { expect, test } from '@playwright/test';

test('CSP protects scripts and framing while the login page hydrates', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /content security policy|refused to/i.test(message.text())) violations.push(message.text());
  });
  const response = await page.goto('/login');
  const headers = response!.headers();
  const csp = headers['content-security-policy'];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['cache-control']).toContain('no-store');
  const inlineNonces = await page.locator('script:not([src])').evaluateAll(scripts => scripts.map(s => (s as HTMLScriptElement).nonce));
  expect(inlineNonces.length).toBeGreaterThan(0);
  expect(inlineNonces.every(value => value === nonce)).toBe(true);
  await page.getByLabel('Password', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Mostra password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Nascondi password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  const nextResponse = await page.reload();
  expect(nextResponse!.headers()['content-security-policy']).not.toBe(csp);
  expect(violations).toEqual([]);
});

test('real auth handler rejects cross-origin requests before unavailable upstream', async ({ request, baseURL }) => {
  const hostile = await request.post(`${baseURL}/api/auth/login`, {
    headers: { Origin: 'https://evil.invalid' }, data: { identifier: 'fixture', password: 'FixturePassword123' },
  });
  expect(hostile.status()).toBe(403);
  expect(hostile.headers()['cache-control']).toBe('private, no-store');
  const form = await request.post(`${baseURL}/api/auth/login`, {
    headers: { Origin: baseURL!, 'Content-Type': 'text/plain' }, data: '{"identifier":"fixture"}',
  });
  expect(form.status()).toBe(415);
});

test('generic BFF cannot expose an auth token through direct or encoded paths', async ({ request, baseURL }) => {
  for (const path of ['auth/login', 'auth/register', 'auth%2Fregister', '%61uth/register', 'profiles/%2e%2e/auth/register']) {
    const response = await request.post(`${baseURL}/api/backend/${path}`, {
      headers: { Origin: baseURL!, Cookie: 'socra_session=dummy' },
      data: { username: 'fixture', password: 'FixturePassword123', consent_essential: true },
    });
    expect(response.status()).toBe(404);
    expect(response.headers()['cache-control']).toBe('private, no-store');
    expect(await response.text()).not.toContain('access_token');
  }
});
