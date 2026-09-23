import { expect, test } from "@playwright/test";

const discussionTypes = Array.from({ length: 9 }, (_, index) => ({
  code: `discussion_${index + 1}`,
  label: `Modalità ${index + 1}`,
  description: `Descrizione della modalità ${index + 1}`,
}));

const catalog = {
  topics: [{
    code: "etf_funds", label: "ETF e fondi", goals: [
      { code: "basics", label: "Comprendere le basi degli ETF", recommended: true },
      { code: "compare", label: "Confrontare due ETF", recommended: false },
      { code: "advanced", label: "Analizzare ETF avanzati", recommended: false },
    ],
  }],
  discussion_types: discussionTypes,
  max_discussion_types: 3,
};

test.beforeEach(async ({ baseURL, context, page }) => {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: {
    id: "u1", username: "utente", email: "private@example.com", nickname: "Giulia",
    level: "L1", is_coach: true, role: "user", account_status: "active",
  } }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: {
    user_id: "u1", level: "L1", is_coach: true, latest_answer_id: "answer-1",
  } }));
  await page.route("**/api/backend/surveys/onboarding/me/draft", route => route.fulfill({ json: null }));
  await page.route("**/api/backend/surveys/goal/catalog", route => route.fulfill({ json: catalog }));
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: null, goals: [] } }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/matching/requests/me?role=mentee", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: { balance: 2, debt: 0, currency_label: "crediti" } }));
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", route => route.fulfill({ json: [] }));
});

test("completed onboarding has one next action", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("link", { name: "Scegli cosa vuoi imparare" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Gestisci la disponibilità come mentor" })).toHaveCount(0);
});

test("new goal starts with recommended results, permits all, and omits private context", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/backend/surveys/goal/me", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: "new-goal", ...payload } });
  });
  await page.goto("/goal");
  await page.getByLabel("Tema").selectOption("etf_funds");
  const result = page.getByLabel("Risultato di apprendimento");
  await expect(result.locator("option[value=basics]")).toHaveCount(1);
  await expect(result.locator("option[value=compare]")).toHaveCount(0);
  await expect(page.getByLabel("Contesto di partenza (privato)")).toHaveCount(0);
  await page.getByRole("button", { name: "Mostra tutti i risultati" }).click();
  await expect(result.locator("option[value=compare]")).toHaveCount(1);
  await result.selectOption("compare");
  await expect(page.getByTestId("goal-selection-summary")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Modalità 1" }).check();
  await page.getByRole("button", { name: "Salva e continua" }).click();
  await expect(page).toHaveURL(/tour.*new-goal/);
  expect(payload).toMatchObject({ topic: "etf_funds", goal_tag: "compare", discussion_types: ["discussion_1"] });
  expect(payload?.capital_goal ?? null).toBeNull();
  expect(payload?.amount_range ?? null).toBeNull();
  expect(payload?.risk ?? null).toBeNull();
});

test("editing preserves historical private values and selected nonrecommended result", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: {
    id: "old-goal", topic: "ETF e fondi", topic_code: "etf_funds", goal_tag: "Confrontare due ETF",
    goal_tag_code: "compare", capital_goal: "500_5k", amount_range: "500_5k", risk: "balanced",
    discussion_types: ["discussion_1"], is_active: true,
  }, goals: [] } }));
  await page.route("**/api/backend/surveys/goal/me", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: "updated-goal", ...payload } });
  });
  await page.goto("/goal");
  const result = page.getByLabel("Risultato di apprendimento");
  await expect(result).toHaveValue("compare");
  await expect(result.locator("option[value=compare]")).toHaveCount(1);
  await expect(page.getByLabel("Contesto di partenza (privato)")).toHaveCount(0);
  await page.getByRole("button", { name: "Aggiorna e vedi i mentor" }).click();
  await expect(page).toHaveURL(/matching.*updated-goal/);
  expect(payload).toMatchObject({ capital_goal: "500_5k", amount_range: "500_5k", risk: "balanced" });
});

test("incoming request names roles and links to the learner public profile", async ({ page }) => {
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{
    id: "request-1", status: "pending", mentor_id: "u1", mentee_id: "learner-1",
    initiator_role: "mentee", goal_id: "goal-1", expires_at: "2026-09-25T12:00:00Z",
    mentor: { user_id: "u1", nickname: "Giulia" }, mentee: { user_id: "learner-1", nickname: "Luca" },
    goal: { id: "goal-1", topic: "ETF e fondi", goal_tag: "Comprendere le basi degli ETF",
      discussion_type_labels: ["Partire dalle basi"] },
    alignment_message: "Vorrei capire come partire con gli ETF.",
  }] }));
  await page.goto("/requests?tab=received");
  await expect(page.getByText("Ti chiede di essere il suo mentor")).toBeVisible();
  await expect(page.getByRole("link", { name: /Profilo di Luca/ })).toHaveAttribute("href", "/profiles/learner-1?from=requests");
  await expect(page.getByText("ETF e fondi", { exact: true })).toBeVisible();
  await expect(page.getByText("Comprendere le basi degli ETF", { exact: true })).toBeVisible();
  await expect(page.getByText("Partire dalle basi", { exact: true })).toBeVisible();
  await expect(page.getByText("Vorrei capire come partire con gli ETF.")).toBeVisible();
  await expect(page.getByText(/Scade il:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Accetta" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rifiuta" })).toBeVisible();
  await expect(page.locator(".requests-list").getByText("private@example.com")).toHaveCount(0);
});

test("incoming mentor offer links to the mentor public profile", async ({ page }) => {
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{
    id: "offer-1", status: "pending", mentor_id: "mentor-1", mentee_id: "u1",
    initiator_role: "mentor", goal_id: "goal-1", expires_at: "2026-09-25T12:00:00Z",
    mentor: { user_id: "mentor-1", nickname: "Anna" }, mentee: { user_id: "u1", nickname: "Giulia" },
    goal: { id: "goal-1", topic: "ETF e fondi", goal_tag: "Comprendere le basi degli ETF" },
    alignment_message: "Posso aiutarti a capire le basi.", cost_at_request: 1,
  }] }));
  await page.goto("/requests?tab=received");
  await expect(page.getByText("Ti propone di essere il tuo mentor")).toBeVisible();
  await expect(page.getByRole("link", { name: /Profilo di Anna/ })).toHaveAttribute("href", "/profiles/mentor-1?from=requests");
  await expect(page.getByText(/Costo all.accettazione: 1 credito/)).toBeVisible();
});

test("a learner profile opened from a proposal stays public and returns to proposals", async ({ page }) => {
  await page.route("**/api/backend/profiles/learner-1", route => route.fulfill({ json: {
    user_id: "learner-1", nickname: "Luca", is_coach: false, completed_paths: 0,
    public_badges: [], top_topics: [], aggregate_metrics: {},
  } }));
  await page.goto("/profiles/learner-1?from=requests");
  await expect(page.getByRole("heading", { name: "Luca" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Torna alle proposte" }).first()).toHaveAttribute("href", "/requests");
  await expect(page.getByRole("button", { name: "Invia richiesta al mentor" })).toHaveCount(0);
  await expect(page.locator(".profile-page").getByText("private@example.com")).toHaveCount(0);
});

test("a catalog without recommendation flags remains fully selectable", async ({ page }) => {
  await page.route("**/api/backend/surveys/goal/catalog", route => route.fulfill({ json: {
    ...catalog,
    topics: [{ ...catalog.topics[0], goals: catalog.topics[0].goals.map(({ code, label }) => ({ code, label })) }],
  } }));
  await page.goto("/goal");
  await page.getByLabel("Tema").selectOption("etf_funds");
  await expect(page.getByLabel("Risultato di apprendimento").locator("option[value=compare]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Mostra tutti i risultati" })).toHaveCount(0);
});
