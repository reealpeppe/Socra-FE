import { expect, test, type Page } from '@playwright/test';
import { fixture } from './multi-goal-fixture';

const launch = { phase: 'prelaunch', campaign_enabled: true, email_delivery_enabled: true,
  email_bonus: 1, registration_bonus: 2, redemption_days: 30, redeem_until: null };

async function preparationFixture(page: Page, baseURL: string, nextStep = 'ready', intent = 'learn', empty = false) {
  const state = await fixture(page, baseURL, { empty });
  const operational: string[] = [];
  page.on('request', request => {
    if (/\/api\/backend\/(matching|paths|notifications|wallet|invitations|profiles\/u1)/.test(request.url())) operational.push(request.url());
  });
  await page.route('**/api/prelaunch/status', route => route.fulfill({ json: launch }));
  await page.route('**/api/backend/auth/me', route => route.fulfill({ json: {
    id: 'u1', username: 'test_user', nickname: 'Giulia', email: 'test@example.com',
    role: 'user', account_status: 'active', email_verified: true, prelaunch_blocked: true,
  } }));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({ json: {
    ...launch, preparation: { first_name: 'Giulia', intent, next_step: nextStep, experience_saved: true,
      email_verified: true, goal: 'Leggere un ETF', verification_delivery: null },
    referrals: { code: null, accepted: 0, ready: 0 }, credits: 3, reserved_bonus: 2,
  } }));
  return { state, operational, setNextStep: (step: string) => { nextStep = step; } };
}

test('prelaunch ignores operational pathId and next when editing learning goals', async ({ page, baseURL }) => {
  const { operational, state } = await preparationFixture(page, baseURL!);
  await page.goto('/goal?pathId=foreign-path&next=%2Fmatching');
  await expect(page.getByRole('heading', { name: 'I tuoi obiettivi' })).toBeVisible();
  expect(operational).toEqual([]);
  await page.getByRole('button', { name: 'Salva e continua', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.selectionWrites).toBe(1);
  expect(operational).toEqual([]);
});

for (const intent of ['learn', 'teach', 'both']) {
  test(`goal saving follows authoritative missing experience for ${intent}`, async ({ page, baseURL }) => {
    await preparationFixture(page, baseURL!, 'experience', intent);
    await page.goto('/goal');
    await page.getByRole('button', { name: 'Salva e continua', exact: true }).click();
    await expect(page).toHaveURL(/\/competenze$/);
  });
}

test('removing every goal follows server preparation instead of returning to area', async ({ page, baseURL }) => {
  await preparationFixture(page, baseURL!, 'goal');
  await page.goto('/goal');
  await page.getByRole('checkbox', { name: 'Leggere la scheda di un ETF', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Leggere i dati fondamentali di un’azienda', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Salva e continua', exact: true }).click();
  await expect(page).toHaveURL(/\/goal$/);
  await expect(page.getByRole('heading', { name: 'I tuoi obiettivi' })).toBeVisible();
});

test('completed experience edit returns to area without restarting optional onboarding', async ({ page, baseURL }) => {
  const { operational } = await preparationFixture(page, baseURL!);
  await page.goto('/competenze?next=%2Finviti%2F00000000-0000-4000-8000-000000000001');
  await page.getByRole('button', { name: 'Conferma le risposte', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(operational).toEqual([]);
});

test('newly completed goals lead to profile confirmation', async ({ page, baseURL }) => {
  const { setNextStep } = await preparationFixture(page, baseURL!, 'goal');
  await page.goto('/goal');
  await expect(page.getByRole('heading', { name: 'I tuoi obiettivi' })).toBeVisible();
  setNextStep('ready');
  await page.getByRole('button', { name: 'Salva e continua', exact: true }).click();
  await expect(page).toHaveURL(/\/prelancio\/profilo-pronto$/);
});

test('teaching preparation stays on experience while the server still requires an offer', async ({ page, baseURL }) => {
  const { state, operational } = await preparationFixture(page, baseURL!, 'experience', 'teach');
  state.profile.mentor_skills = [];
  await page.goto('/competenze');
  await page.getByRole('button', { name: 'Conferma le risposte', exact: true }).click();
  await expect.poll(() => state.profile.version).toBe(2);
  await expect(page).toHaveURL(/\/competenze$/);
  await expect(page.getByRole('button', { name: 'Conferma le risposte', exact: true })).toBeEnabled();
  expect(operational).toEqual([]);
});

test('first experience save skips optional context and resumes the required goal', async ({ page, baseURL }) => {
  const { setNextStep } = await preparationFixture(page, baseURL!, 'experience');
  let saved = false;
  await page.route('**/api/backend/skills/me', route => {
    if (route.request().method() === 'GET' && !saved) return route.fulfill({ json: null });
    if (route.request().method() === 'PUT') { saved = true; setNextStep('goal'); }
    return route.fallback();
  });
  await page.goto('/onboarding?next=%2Fmatching');
  await page.getByRole('button', { name: 'Conferma le risposte', exact: true }).click();
  await expect(page).toHaveURL(/\/goal$/);
  await expect(page.getByRole('heading', { name: 'Aggiungi il tuo contesto personale' })).toHaveCount(0);
});

test('settings keeps editable personal details and experience without operational controls', async ({ page, baseURL }) => {
  const { operational } = await preparationFixture(page, baseURL!);
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Il tuo account', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aggiorna la tua esperienza', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toBeEditable();
  await expect(page.getByRole('textbox', { name: 'Cognome', exact: true })).toBeEditable();
  await expect(page.getByRole('link', { name: /profilo pubblico/i })).toHaveCount(0);
  await expect(page.getByRole('switch', { name: 'Disponibilità come mentor' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Avvisi email' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Torna alla tua area', exact: true })).toBeVisible();
  await expect(page.getByText('Email confermata', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Verifica o correggi la tua email', exact: true })).toHaveCount(0);
  expect(operational).toEqual([]);
});

test('incomplete prelaunch profile corrects email inline and refreshes the account address', async ({ page, baseURL }) => {
  const { operational } = await preparationFixture(page, baseURL!, 'details');
  let email = 'mistyped@example.com';
  let submitted: unknown;
  await page.route('**/api/backend/auth/me', route => route.fulfill({ json: {
    id: 'u1', username: 'test_user', nickname: 'Giulia', email, role: 'user', account_status: 'active',
    email_verified: false, email_verification_required: true, email_delivery_enabled: true, prelaunch_blocked: true,
  } }));
  await page.route('**/api/auth/email', route => {
    submitted = route.request().postDataJSON();
    email = 'corrected@example.com';
    return route.fulfill({ json: { status: 'ok', email_delivery_enabled: true } });
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Correggi email', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email corretta', exact: true }).fill('corrected@example.com');
  await page.getByRole('button', { name: 'Salva email e invia verifica', exact: true }).click();
  await expect(page.locator('.settings-field-value', { hasText: 'corrected@example.com' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Verifica email', exact: true })).toContainText('corrected@example.com');
  await expect(page.getByText(/mistyped@example.com/)).toHaveCount(0);
  await expect(page.getByText(/per cercare profili e usare il matching/)).toHaveCount(0);
  await expect(page).toHaveURL(/\/settings$/);
  expect(submitted).toEqual({ email: 'corrected@example.com' });
  expect(operational).toEqual([]);
});

test('saving missing personal details resumes the first missing preparation step', async ({ page, baseURL }) => {
  await preparationFixture(page, baseURL!, 'intent');
  let saved: Record<string, unknown> | null = null;
  await page.route('**/api/backend/profiles/me', route => {
    const profile = { user_id: 'u1', username: 'test_user', nickname: 'Giulia', first_name: null, last_name: null, bio: null, avatar_url: null };
    if (route.request().method() === 'PATCH') {
      saved = route.request().postDataJSON();
      return route.fulfill({ json: { ...profile, ...saved } });
    }
    return route.fulfill({ json: profile });
  });
  await page.goto('/settings');
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Giulia');
  await page.getByRole('textbox', { name: 'Cognome', exact: true }).fill('Rossi');
  await page.getByRole('button', { name: 'Salva dati', exact: true }).click();
  await expect(page).toHaveURL(/\/prelancio\/prepara$/);
  expect(saved).toEqual({ first_name: 'Giulia', last_name: 'Rossi', username: 'test_user' });
});

test('open community keeps path-specific goal editing', async ({ page, baseURL }) => {
  await fixture(page, baseURL!);
  let pathReads = 0;
  await page.route('**/api/backend/paths/existing-path', route => { pathReads++; return route.fulfill({ json: { goal: null } }); });
  await page.goto('/goal?pathId=existing-path');
  await expect(page.getByRole('heading', { name: 'Cosa vuoi approfondire adesso?' })).toBeVisible();
  expect(pathReads).toBe(1);
});
