import { expect, test } from '@playwright/test';

const launch = { phase: 'prelaunch', campaign_enabled: true, email_delivery_enabled: false,
  email_bonus: 1, registration_bonus: 2, redemption_days: 30, redeem_until: null };
const user = { id: 'recovery-user', username: 'recovery-reader', email: 'reader@example.test', role: 'user',
  account_status: 'active', email_verified: true, email_verification_required: true, prelaunch_blocked: true };
const area = { ...launch, credits: 2, reserved_bonus: 2, referrals: { code: null, accepted: 0, ready: 0 },
  preparation: { first_name: 'Arianna', next_step: 'intent', intent: null, email_verified: true,
    experience_saved: false, goal: null, verification_delivery: null } };

test('expired access has Socra navigation and preserves the local return without fragments', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'socra_session', value: 'expired', url: baseURL! }]);
  await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
  let privateReads = 0;
  await page.route('**/api/backend/**', route => {
    if (new URL(route.request().url()).pathname.endsWith('/auth/me'))
      return route.fulfill({ status: 401, json: { detail: 'Authentication required' } });
    privateReads++;
    return route.fulfill({ status: 500, json: { detail: 'Must not load private data' } });
  });
  await page.goto('/dashboard?tab=profile#local-section');
  await expect(page.getByRole('heading', { name: 'La sessione è scaduta', exact: true })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('img', { name: 'Socra', exact: true })).toBeVisible();
  const login = page.getByRole('link', { name: 'Accedi per continuare', exact: true });
  const target = new URL((await login.getAttribute('href'))!, page.url());
  expect(target.pathname).toBe('/login');
  expect(target.searchParams.get('next')).toBe('/dashboard?tab=profile');
  await expect(page.getByRole('link', { name: 'Torna alla home', exact: true })).toHaveAttribute('href', '/');
  expect(privateReads).toBe(0);
  expect(await page.locator('body').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  await login.click();
  await expect(page.getByLabel('Username o email')).toBeVisible();
});

test('an expired open page replaces private content with the branded recovery screen', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'socra_session', value: 'later-expired', url: baseURL! }]);
  let authenticated = true;
  await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
  await page.route('**/api/backend/auth/me', route => authenticated
    ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: { detail: 'Expired' } }));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({ json: area }));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Ciao Arianna, ci sei.' })).toBeVisible();
  authenticated = false;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByRole('heading', { name: 'La sessione è scaduta', exact: true })).toBeVisible();
  await expect(page.getByText('Arianna', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('main')).toHaveCount(1);
  await page.getByRole('link', { name: 'Torna alla home', exact: true }).click();
  await expect(page).toHaveURL(baseURL! + '/');
});

test('temporary verification errors retain branded home and retry actions', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'socra_session', value: 'unavailable', url: baseURL! }]);
  let unavailable = true;
  await page.route('**/api/backend/auth/me', route => unavailable
    ? route.fulfill({ status: 503, json: { detail: 'Unavailable' } }) : route.fulfill({ json: user }));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({ json: area }));
  await page.goto('/dashboard');
  await expect(page.getByRole('banner').getByRole('img', { name: 'Socra', exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Torna alla home', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accedi per continuare', exact: true })).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ciao Arianna, ci sei.' })).toBeVisible();
});
