import { expect, test, type Page } from '@playwright/test';
import { etf, stock, match } from './multi-goal-fixture';

const learnerEtf = { ...etf, id: 'learner-etf', objective_codes: ['etf_read', 'etf_compare'], objective_labels: ['Leggere la scheda di un ETF', 'Confrontare due ETF'] };
const learnerStock = { ...stock, id: 'learner-stock' };
const partialEtf = { ...match(learnerEtf), covered_objective_codes: ['etf_read'], covered_objective_labels: ['Leggere la scheda di un ETF'], missing_objective_codes: ['etf_compare'], missing_objective_labels: ['Confrontare due ETF'], coverage_count: 1, requested_count: 2 };
const learner = { ...partialEtf, mentee_id: 'learner', nickname: 'Davide', level: 'L0', goal_id: 'learner-etf', goal_topic: 'ETF', goal_tag: 'Leggere la scheda di un ETF', is_recommended: true, goal_matches: [partialEtf, match(learnerStock)] };
const mentor = { ...match(etf), mentor_id: 'mentor', nickname: 'Marta', level: 'L0', path_cost: 1, public_badges: [], is_recommended: true, goal_matches: [match(etf), match(stock)] };

async function profileFixture(page: Page, baseURL: string, options: { ownGoals?: boolean; paginated?: boolean; unavailable?: boolean; pending?: boolean } = {}) {
  await page.context().addCookies([{ name: 'socra_session', value: 'profile-direction-test', url: baseURL, httpOnly: true }]);
  const state = { sent: null as { endpoint: string; body: Record<string, unknown> } | null, menteePages: [] as Record<string, unknown>[] };
  const me = { id: 'u1', username: 'jacopo', nickname: 'Jacopo', email: 'jacopo@example.test', level: 'L0', role: 'user', account_status: 'active', is_coach: true, email_verified: true };
  const publicProfile = { skill_model: true, completed_paths: 0, public_badges: [], top_topics: [], aggregate_metrics: {}, path_cost: 1, skill_groups: [], public_reviews: [], mentor_started_paths: 0, mentor_completion_rate: null, bio: null, avatar_url: null };
  const pending = { id: 'pending', mentor_id: 'u1', mentee_id: 'learner', goal_id: 'learner-etf', status: 'pending', initiator_role: 'mentor', created_at: '2026-10-13T10:00:00Z', expires_at: '2026-10-15T10:00:00Z' };
  await page.route('**/api/backend/**', async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace('/api/backend', '');
    const body = route.request().method() === 'GET' ? null : route.request().postDataJSON();
    if (endpoint === '/matching/mentees/all') state.menteePages.push(body);
    if (['/matching/requests', '/matching/proposals'].includes(endpoint) && route.request().method() === 'POST') state.sent = { endpoint, body };
    const data: Record<string, unknown> = {
      '/auth/me': me, '/profiles/me': { ...me, user_id: 'u1', first_name: 'Jacopo', last_name: 'Rossi' },
      '/skills/me': { version: 1, known_skills: ['etf_read', 'stock_fundamentals'], mentor_skills: ['etf_read', 'stock_fundamentals'], section_d: {}, mentor_available: true },
      '/surveys/onboarding/me': { latest_answer_id: 'done', user_id: 'u1' }, '/surveys/onboarding/me/draft': null,
      '/goals/me': { current: options.ownGoals === false ? null : etf, active_goals: options.ownGoals === false ? [] : [etf, stock], goals: options.ownGoals === false ? [] : [etf, stock] },
      '/paths/me': [], '/notifications/me': [], '/wallet/me': { balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: 'crediti' },
      '/profiles/learner': { ...publicProfile, user_id: 'learner', nickname: 'Davide', is_coach: false },
      '/profiles/mentor': { ...publicProfile, user_id: 'mentor', nickname: 'Marta', is_coach: true },
      '/profiles/u1': { ...publicProfile, user_id: 'u1', nickname: 'Jacopo', is_coach: true },
      '/matching/requests/me': options.pending ? [pending] : [],
      '/matching/candidates/all': { items: [mentor], next_cursor: null },
      '/matching/mentees/all': options.unavailable || options.pending ? { items: [], next_cursor: null } : options.paginated && !body?.cursor ? { items: [{ ...learner, mentee_id: 'other', nickname: 'Altra persona' }], next_cursor: 'page-two' } : { items: [learner], next_cursor: null },
      '/matching/proposals': { ...pending, id: 'new-request', ...body },
      '/matching/requests': { ...pending, id: 'new-request', mentee_id: 'u1', mentor_id: 'mentor', initiator_role: 'mentee', ...body },
    };
    await route.fulfill({ json: Object.hasOwn(data, endpoint) ? data[endpoint] : [] });
  });
  return state;
}

async function prepareProposal(page: Page, topic: 'ETF' | 'Azioni', objective: string) {
  const dialog = page.getByRole('dialog');
  const topicChoice = dialog.getByRole('radio', { name: new RegExp(topic) });
  if (await topicChoice.count()) await topicChoice.check();
  else await expect(dialog.getByText(topic, { exact: true })).toBeVisible();
  await dialog.getByRole('checkbox', { name: objective, exact: true }).check();
  await dialog.getByLabel('Il tuo messaggio').fill('Possiamo lavorare insieme su un esempio concreto per questo obiettivo.');
  await expect(dialog.getByRole('button', { name: 'Invia richiesta', exact: true })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: /Accetto.*email/ }).check();
  await dialog.getByRole('button', { name: 'Invia richiesta', exact: true }).click();
}

test('mentor opens learner profile and proposes only covered objectives without own goals', async ({ page, baseURL }, testInfo) => {
  const state = await profileFixture(page, baseURL!, { ownGoals: false });
  await page.goto('/matching/mentees');
  await page.locator('[data-person-id="learner"]').getByRole('link', { name: 'Vedi profilo' }).click();
  await expect(page.getByRole('heading', { name: 'Davide', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Torna alla lista degli apprendisti', exact: true })).toHaveAttribute('href', '/matching/mentees');
  await expect(page.getByText('Questa persona non è disponibile come mentor in questo momento.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Proponi un confronto', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: /ETF/ }).check();
  await expect(dialog).toContainText('Confrontare due ETF');
  await expect(dialog.getByRole('checkbox', { name: 'Confrontare due ETF', exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('checkbox', { name: /Accetto.*email/ })).not.toBeChecked();
  await prepareProposal(page, 'ETF', 'Leggere la scheda di un ETF');
  await expect.poll(() => state.sent).toEqual({ endpoint: '/matching/proposals', body: { mentee_id: 'learner', goal_id: 'learner-etf', agreed_objective_codes: ['etf_read'], alignment_message: 'Possiamo lavorare insieme su un esempio concreto per questo obiettivo.', email_sharing_accepted: true } });
  await expect(page.getByText('Proposta inviata', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proponi un confronto', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('mentor-profile-proposal.png'), fullPage: true });
  await page.getByRole('link', { name: 'Torna alla lista degli apprendisti', exact: true }).click();
  await expect(page).toHaveURL(/\/matching\/mentees$/);
});

test('mentor profile finds paginated learner and sends selected second theme', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!, { ownGoals: false, paginated: true });
  await page.goto('/matching/mentees');
  await page.getByRole('button', { name: 'Mostra altri', exact: true }).click();
  await page.locator('[data-person-id="learner"]').getByRole('link', { name: 'Vedi profilo' }).click();
  await expect(page).toHaveURL(/\/profiles\/learner\?from=matching&role=mentor$/);
  await page.getByRole('button', { name: 'Proponi un confronto', exact: true }).click();
  await prepareProposal(page, 'Azioni', 'Leggere i dati fondamentali di un’azienda');
  await expect.poll(() => state.sent?.body.goal_id).toBe('learner-stock');
  expect(state.sent?.body.agreed_objective_codes).toEqual(['stock_fundamentals']);
  expect(state.sent?.endpoint).toBe('/matching/proposals');
  expect(state.menteePages.filter(body => body.cursor === 'page-two').length).toBeGreaterThanOrEqual(2);
});

test('learner opens mentor profile and sends selected own theme', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  await page.goto('/matching');
  await page.locator('[data-person-id="mentor"]').getByRole('link', { name: 'Vedi profilo' }).click();
  await expect(page.getByRole('link', { name: 'Torna alla lista dei mentor', exact: true })).toHaveAttribute('href', '/matching');
  await page.getByRole('button', { name: 'Invia richiesta al mentor', exact: true }).click();
  await prepareProposal(page, 'Azioni', 'Leggere i dati fondamentali di un’azienda');
  await expect.poll(() => state.sent?.body.goal_id).toBe('g-stock');
  expect(state.sent?.endpoint).toBe('/matching/requests');
  expect(state.sent?.body.mentor_id).toBe('mentor');
  expect(state.sent?.body.agreed_objective_codes).toEqual(['stock_fundamentals']);
});

test('own profile keeps dashboard return and cannot propose to itself', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  await page.goto('/profiles/u1?from=matching&role=mentor');
  await expect(page.getByRole('link', { name: 'Torna alla dashboard', exact: true })).toHaveAttribute('href', '/dashboard');
  await expect(page.getByText('Questo è il tuo profilo', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Proponi un confronto|Invia richiesta al mentor/ })).toHaveCount(0);
  expect(state.menteePages).toHaveLength(0);
});

for (const tab of ['received', 'sent']) {
  test(`profile entered from ${tab} requests returns to the same tab`, async ({ page, baseURL }) => {
    await profileFixture(page, baseURL!);
    await page.goto(`/profiles/learner?from=requests&tab=${tab}&role=mentor`);
    await expect(page.locator('.profile-back')).toHaveAttribute('href', `/requests?tab=${tab}`);
    await expect(page.locator('.profile-back')).toHaveText('Torna alle proposte');
    await expect(page.getByRole('button', { name: 'Proponi un confronto', exact: true })).toHaveCount(0);
  });
}

test('mentor cannot propose when current compatibility no longer includes learner', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!, { unavailable: true });
  await page.goto('/profiles/learner?from=matching&role=mentor');
  await expect(page.getByText('Questa persona non è disponibile per una proposta in questo momento.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proponi un confronto', exact: true })).toHaveCount(0);
  expect(state.sent).toBeNull();
});

test('pending mentor proposal remains visible when learner is excluded from new search', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!, { pending: true });
  await page.goto('/profiles/learner?from=matching&role=mentor');
  await expect(page.getByText('Proposta in attesa', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proponi un confronto', exact: true })).toHaveCount(0);
  expect(state.sent).toBeNull();
});

test('incoming learner request directs mentor to received proposals', async ({ page, baseURL }) => {
  await profileFixture(page, baseURL!, { pending: true });
  await page.route('**/api/backend/matching/requests/me?role=mentor', route => route.fulfill({ json: [{ id: 'incoming', mentor_id: 'u1', mentee_id: 'learner', goal_id: 'learner-etf', status: 'pending', initiator_role: 'mentee', created_at: '2026-10-13T10:00:00Z', expires_at: '2026-10-15T10:00:00Z' }] }));
  await page.goto('/profiles/learner?from=matching&role=mentor');
  await expect(page.getByText('Proposta in attesa', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vedi le proposte', exact: true })).toHaveAttribute('href', '/requests?tab=received');
  await expect(page.getByText('Rispondi alla proposta dell’apprendista.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proponi un confronto', exact: true })).toHaveCount(0);
});

async function learnerPending(page: Page, initiatorRole: 'mentor' | 'mentee', mentorId = 'mentor') {
  const pending = { id: 'learner-pending', mentor_id: mentorId, mentee_id: 'u1', goal_id: 'g-etf', status: 'pending', initiator_role: initiatorRole,
    created_at: '2026-10-13T10:00:00Z', expires_at: '2026-10-15T10:00:00Z', skill_model: true, goal: etf, email_sharing_accepted: true,
    requested_objective_codes: ['etf_read'], requested_objective_labels: ['Leggere la scheda di un ETF'], agreed_objective_codes: ['etf_read'], agreed_objective_labels: ['Leggere la scheda di un ETF'], discussion_mode_label: 'Guidami passo passo',
    mentor: { id: mentorId, nickname: mentorId === 'mentor' ? 'Marta' : 'Altra mentor', is_coach: true, level: 'L0' }, mentee: { id: 'u1', nickname: 'Jacopo', is_coach: true, level: 'L0' } };
  await page.route('**/api/backend/matching/requests/me?**', route => route.fulfill({ json: [pending] }));
}

test('learner enters mentor profile from incoming request and can return to respond', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  await learnerPending(page, 'mentor');
  await page.goto('/requests?tab=received');
  await page.getByRole('link', { name: 'Profilo di Marta', exact: true }).click();
  await expect(page).toHaveURL(/\/profiles\/mentor\?/);
  const card = page.locator('.profile-right .profile-request-card');
  await expect(card).toContainText('Proposta ricevuta');
  await expect(card).not.toContainText('Attendi la risposta del mentor.');
  await expect(card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true })).toHaveCount(0);
  await expect(card.getByRole('link', { name: 'Vedi le proposte', exact: true })).toHaveAttribute('href', '/requests?tab=received');
  await card.getByRole('link', { name: 'Vedi le proposte', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\?tab=received$/);
  await expect(page.locator('.requests-row').getByRole('button', { name: 'Accetta', exact: true })).toBeEnabled();
  expect(state.sent).toBeNull();
});

for (const { initiator, tab, title } of [
  { initiator: 'mentor' as const, tab: 'received', title: 'Proposta ricevuta' },
  { initiator: 'mentee' as const, tab: 'sent', title: 'Proposta in attesa' },
]) {
  test(`learner pending ${tab} proposal with another mentor blocks globally without attributing it to visited profile`, async ({ page, baseURL }) => {
    const state = await profileFixture(page, baseURL!);
    await learnerPending(page, initiator, 'other-mentor');
    await page.goto('/profiles/mentor?from=matching&role=mentee');
    await expect(page.getByRole('heading', { name: 'Marta', exact: true })).toBeVisible();
    const card = page.locator('.profile-right .profile-request-card');
    await expect(card).toContainText(title);
    await expect(card).not.toContainText('Richiesta inviata');
    await expect(card).not.toContainText('Attendi la risposta del mentor.');
    await expect(card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true })).toHaveCount(0);
    await expect(card.getByRole('link', { name: 'Vedi le proposte', exact: true })).toHaveAttribute('href', `/requests?tab=${tab}`);
    await card.getByRole('link', { name: 'Vedi le proposte', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/requests\\?tab=${tab}$`));
    await expect(page.locator('.requests-row').getByRole('heading', { name: 'Altra mentor', exact: true })).toBeVisible();
    expect(state.sent).toBeNull();
  });
}

test('V4 unavailable profile cannot emit a generic request without agreed activities and can recheck availability', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  let available = false;
  await page.route('**/api/backend/matching/candidates/all', route => route.fulfill({ json: { items: available ? [mentor] : [], next_cursor: null } }));
  await page.route('**/api/backend/matching/requests', route => {
    if (available) return route.fallback();
    state.sent = { endpoint: '/matching/requests', body: route.request().postDataJSON() };
    return route.fulfill({ status: 409, json: { detail: 'Mentor is not a valid candidate' } });
  });
  const matchingRead = page.waitForResponse(response => new URL(response.url()).pathname === '/api/backend/matching/candidates/all');
  await page.goto('/profiles/mentor?from=matching&role=mentee');
  await matchingRead;
  const card = page.locator('.profile-right .profile-request-card');
  await expect(card).not.toContainText('Verifica compatibilità…');
  const requestButton = card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true });
  if (await requestButton.isVisible() && await requestButton.isEnabled()) {
    await requestButton.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Il tuo messaggio').fill('Vorrei capire insieme un esempio concreto per questo obiettivo.');
    await dialog.getByRole('checkbox', { name: /Accetto.*email/ }).check();
    await dialog.getByRole('button', { name: 'Invia richiesta', exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
  }
  expect(state.sent, 'An unavailable authoritative V4 match must not emit a request').toBeNull();
  await expect(requestButton).toHaveCount(0);
  await expect(card).toContainText('Questa persona non è disponibile per una proposta in questo momento.');
  await expect(card.getByRole('link', { name: 'Torna ai mentor', exact: true })).toHaveAttribute('href', '/matching');
  available = true;
  await card.getByRole('button', { name: 'Riprova', exact: true }).click();
  await requestButton.click();
  await expect(page.getByRole('dialog').getByRole('radio', { name: /Azioni/ })).toBeVisible();
});

test('V4 unavailable profile with schema-valid empty goal matches does not open a dead-end dialog', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  await page.route('**/api/backend/matching/candidates/all', route => route.fulfill({ json: { items: [{ ...mentor, goal_matches: [] }], next_cursor: null } }));
  const matchingRead = page.waitForResponse(response => new URL(response.url()).pathname === '/api/backend/matching/candidates/all');
  await page.goto('/profiles/mentor?from=matching&role=mentee');
  await matchingRead;
  const card = page.locator('.profile-right .profile-request-card');
  await expect(card).not.toContainText('Verifica compatibilità…');
  await expect(card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true })).toHaveCount(0);
  await expect(card).toContainText('Questa persona non è disponibile per una proposta in questo momento.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.sent).toBeNull();
});

test('V4 compatibility error remains retryable and restores multi-goal agreement instead of claiming unavailability', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  let fail = true;
  await page.route('**/api/backend/matching/candidates/all', route => fail ? route.fulfill({ status: 503, json: { detail: 'Temporary failure' } }) : route.fallback());
  await page.goto('/profiles/mentor?from=matching&role=mentee');
  const card = page.locator('.profile-right .profile-request-card');
  await expect(card.getByText('Verifica compatibilità non disponibile', { exact: true })).toBeVisible();
  await expect(card).not.toContainText('Questa persona non è disponibile per una proposta in questo momento.');
  await expect(card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true })).toHaveCount(0);
  fail = false;
  await card.getByRole('button', { name: 'Riprova', exact: true }).click();
  await card.getByRole('button', { name: 'Invia richiesta al mentor', exact: true }).click();
  await prepareProposal(page, 'Azioni', 'Leggere i dati fondamentali di un’azienda');
  await expect.poll(() => state.sent?.body.goal_id).toBe('g-stock');
  expect(state.sent?.body.agreed_objective_codes).toEqual(['stock_fundamentals']);
});

test('legacy mentor profile keeps its message and explicit consent flow without V4 activity selection', async ({ page, baseURL }) => {
  const state = await profileFixture(page, baseURL!);
  const legacyGoal = { id: 'legacy-goal', topic: 'ETF', goal_tag: 'Comprendere gli ETF', is_active: true, skill_model: false };
  await page.route('**/api/backend/goals/me', route => route.fulfill({ json: { current: legacyGoal, active_goal: legacyGoal, goals: [legacyGoal] } }));
  await page.route('**/api/backend/matching/candidates', route => route.fulfill({ json: [{ mentor_id: 'mentor', nickname: 'Marta', level: 'L0', path_cost: 1, match_score: 82, reason_summary: 'Obiettivo compatibile.', public_badges: [], is_recommended: true, skill_model: false }] }));
  await page.goto('/profiles/mentor');
  await page.getByRole('button', { name: 'Invia richiesta al mentor', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('radio')).toHaveCount(0);
  await dialog.getByLabel('Il tuo messaggio').fill('Vorrei capire insieme un esempio concreto su questi strumenti.');
  await expect(dialog.getByRole('button', { name: 'Invia richiesta', exact: true })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: /Accetto.*email/ }).check();
  await dialog.getByRole('button', { name: 'Invia richiesta', exact: true }).click();
  await expect.poll(() => state.sent?.body.goal_id).toBe('legacy-goal');
  expect(state.sent?.body.email_sharing_accepted).toBe(true);
  expect(state.sent?.body).not.toHaveProperty('agreed_objective_codes');
});
