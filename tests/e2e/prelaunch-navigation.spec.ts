import { expect, test, type Page } from '@playwright/test';

const launch = { phase: 'prelaunch', campaign_enabled: true, email_delivery_enabled: true,
  email_bonus: 1, registration_bonus: 2, redemption_days: 30, redeem_until: null, expected_launch_at: null };
const user = { id: 'u-navigation', username: 'reader', email: 'reader@example.com', nickname: 'Reader',
  role: 'user', account_status: 'active', email_verified: false, email_verification_required: true, prelaunch_blocked: true };
const area = { ...launch, blocked: true, reserved_bonus: 2, credits: 3,
  preparation: { next_step: 'ready', first_name: 'Reader', intent: 'learn', email_verified: false,
    experience_saved: true, goal: 'Confrontare due ETF', verification_delivery: 'sent' },
  referrals: { code: null, accepted: 0, ready: 0 } };

async function setup(page: Page, authenticated = false) {
  if (authenticated) await page.context().addCookies([{ name: 'socra_session', value: 'test-session', domain: '127.0.0.1', path: '/' }]);
  await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
  await page.route('**/api/backend/auth/me', route => authenticated
    ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: { detail: 'Authentication required' } }));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({ json: area }));
  return () => { authenticated = true; };
}

test('Accedi opens real credentials without requiring an accesso query parameter', async ({ page }) => {
  await setup(page);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bentornato su Socra' })).toBeVisible();
  await expect(page.getByLabel('Username o email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Riservami un posto', exact: true })).toHaveCount(0);
});

test('registered visitor sees access form when a new browser cannot resume reservation', async ({ page }) => {
  await setup(page);
  await page.route('**/api/prelaunch/reservation', route => route.fulfill({ status: 400, json: { detail: 'Open email link' } }));
  await page.goto('/prelancio/grazie');
  await expect(page.getByRole('heading', { name: 'Il tuo posto è già riservato.' })).toBeVisible();
  await expect(page.getByLabel('Username o email')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Completa il profilo ora' })).toHaveCount(0);
});

test('private operational URLs canonicalize to prelaunch area before mounting community content', async ({ page }) => {
  await setup(page, true);
  const operational: string[] = [];
  page.on('request', request => { if (/\/api\/backend\/(matching|paths|wallet|notifications)/.test(request.url())) operational.push(request.url()); });
  for (const path of ['/matching?goalId=other', '/paths/unowned', '/profiles/unowned', '/tour', '/requests', '/wallet']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Ciao Reader/ })).toBeVisible();
  }
  expect(operational).toEqual([]);
});

test('logged in entry pages lead to private area instead of another signup', async ({ page }) => {
  await setup(page, true);
  for (const path of ['/prelancio', '/register', '/login', '/prelancio/grazie', '/prelancio/dati']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard$/);
  }
});

test('email link in a fresh browser offers access and resumes verification on the same page', async ({ page }) => {
  const login = await setup(page);
  const token = 'a'.repeat(43);
  let confirmed = false;
  await page.route('**/api/auth/email-verification/context', route => route.fulfill({ json: {
    email: user.email, requires_login: true, verified: false, prelaunch: true,
  } }));
  await page.route('**/api/auth/login', route => { login(); return route.fulfill({ json: { user_id: user.id } }); });
  await page.route('**/api/auth/email-verification/confirm', route => {
    confirmed = true; return route.fulfill({ json: { status: 'ok', prelaunch: true } });
  });
  await page.goto('/verify-email#token=' + token);
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('ExamplePassword12');
  await page.getByRole('button', { name: 'Accedi e conferma', exact: true }).click();
  await expect(page.getByText('Email confermata.', { exact: false })).toBeVisible();
  expect(confirmed).toBe(true);
  expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(token);
  await expect(page.getByRole('main').getByRole('link', { name: 'Vai alla tua area', exact: true })).toBeVisible();
});

test('E01 session expiry offers inline access and reuses the retained proof', async ({ page }) => {
  const loggedIn = await setup(page, true);
  const token = 'b'.repeat(43);
  let attempts = 0;
  await page.route('**/api/prelaunch/profile-link', route => route.fulfill({ json: { mode: 'confirm', email: user.email } }));
  await page.route('**/api/prelaunch/profile-confirm', route => {
    expect(route.request().postDataJSON().token).toBe(token);
    attempts++;
    return attempts === 1 ? route.fulfill({ status: 401, json: { detail: 'Authentication required' } })
      : route.fulfill({ json: { status: 'ok' } });
  });
  await page.route('**/api/auth/login', route => { loggedIn(); return route.fulfill({ json: { user_id: user.id } }); });
  await page.goto('/prelancio/completa-profilo#token=' + token);
  await page.getByRole('button', { name: 'Conferma email', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('ExamplePassword12');
  await page.getByRole('button', { name: 'Accedi e conferma', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Email confermata.', exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test('another tab completing the proof is a recoverable success', async ({ page }) => {
  await setup(page, true);
  let reads=0;
  await page.route('**/api/auth/email-verification/context', route => route.fulfill({json:{
    email:user.email,requires_login:false,verified:++reads>1,prelaunch:true,
  }}));
  await page.route('**/api/auth/email-verification/confirm', route => route.fulfill({status:400,json:{detail:'Invalid or expired token'}}));
  await page.goto('/verify-email#token='+'c'.repeat(43));
  await page.getByRole('button',{name:'Conferma email',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Email confermata.',exact:true})).toBeVisible();
  expect(reads).toBe(2);
});

test('a temporary reservation failure never claims that a place already exists', async ({ page }) => {
  await setup(page);
  await page.route('**/api/prelaunch/reservation', route => route.fulfill({status:503,json:{detail:'Unavailable'}}));
  await page.goto('/prelancio/grazie');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Non riusciamo a recuperare la tua prenotazione');
  await expect(page.getByRole('heading',{name:'Il tuo posto è già riservato.'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Riprova',exact:true})).toBeVisible();
});
