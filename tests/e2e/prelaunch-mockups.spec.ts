import { expect, test, type Page } from '@playwright/test';

const launch = { phase: 'prelaunch', campaign_enabled: true, email_delivery_enabled: true,
  email_bonus: 1, registration_bonus: 2, redemption_days: 30, redeem_until: null, expected_launch_at: null };

async function publicPage(page: Page) {
  await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
  await page.route('**/api/backend/auth/me', route => route.fulfill({ status: 401, json: { detail: 'Authentication required' } }));
}

test('a reservation receipt shows the mockup confirmation and two choices', async ({ page }) => {
  await publicPage(page);
  await page.route('**/api/prelaunch/reservation', route => route.fulfill({ json: { email: 'lead@example.test' } }));
  await page.goto('/prelancio/grazie');
  await expect(page.getByText('Il primo passo è fatto', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sei dentro. Il tuo posto è riservato.' })).toBeVisible();
  await expect(page.getByText('lead@example.test', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Completa ora' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuerò più tardi' })).toBeVisible();
  await expect(page.getByText(/gennaio|prioritario|\[N\]/i)).toHaveCount(0);
  expect(await page.locator('body').evaluate(el => el.scrollWidth <= innerWidth)).toBe(true);
});

test('return without a receipt offers inline login without account disclosure', async ({ page }) => {
  await publicPage(page);
  await page.route('**/api/prelaunch/reservation', route => route.fulfill({ status: 410, json: { detail: 'Expired' } }));
  await page.goto('/prelancio/grazie');
  await expect(page.getByRole('heading', { name: 'Il tuo posto è già riservato.' })).toBeVisible();
  await expect(page.getByLabel('Username o email')).toHaveValue('');
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Completa ora' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Richiedi un nuovo link' })).toHaveAttribute('href', '/prelancio');
});

for (const verified of [false, true]) {
  test(`founder badge requires both a ready profile and verified email (${verified})`, async ({ page }) => {
    await page.context().addCookies([{ name: 'socra_session', value: 'mockup-test', domain: '127.0.0.1', path: '/' }]);
    await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
    await page.route('**/api/backend/auth/me', route => route.fulfill({ json: { id: 'u1', username: 'reader', email: 'reader@example.test', role: 'user',
      account_status: 'active', email_verified: verified, email_verification_required: true, prelaunch_blocked: true } }));
    await page.route('**/api/backend/prelaunch/me', route => route.fulfill({ json: { ...launch, credits: 3, reserved_bonus: 2,
      preparation: { next_step: 'ready', first_name: 'Reader', intent: 'learn', email_verified: verified,
        experience_saved: true, goal: 'Confrontare due ETF', verification_delivery: 'sent' },
      referrals: { code: verified ? 'invitation-code' : null, accepted: 0, ready: 0 } } }));
    await page.goto('/prelancio/profilo-pronto');
    await expect(page.getByText('Membro fondatore', { exact: true })).toHaveCount(verified ? 1 : 0);
    await expect(page.getByRole('heading', { name: verified ? 'Profilo pronto. Ci vediamo su Socra.' : 'Profilo pronto. Come ultimo passo, conferma la tua email' })).toBeVisible();
    await expect(page.getByText(/Apertura in preparazione|Fase di pre-lancio|gennaio|\[N\]/i)).toHaveCount(0);
    expect(await page.locator('body').evaluate(el => el.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Il tuo profilo', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'I tuoi inviti', exact: true })).toBeVisible();
    await expect(page.getByText('Membro fondatore', { exact: true })).toHaveCount(verified ? 1 : 0);
    await expect(page.getByText(/Apertura in preparazione|Fase di pre-lancio/i)).toHaveCount(0);
  });
}
