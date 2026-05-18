import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: "http://127.0.0.1:3000", httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: { id: "u1", username: "mentee", email: "mentee@example.com", nickname: "Mentee", level: "L1", is_coach: true, role: "user", account_status: "active" } }));
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L1", is_coach: true, latest_answer_id: "a1" } }));
  await page.route("**/api/backend/surveys/onboarding/me/draft", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: null });
      return;
    }
    const body = route.request().postDataJSON();
    await route.fulfill({
      json: {
        id: "draft1",
        current_step: body.current_step,
        scores: body.scores,
        answers: body.answers,
        include_section_d: body.include_section_d,
        d_never_invested: body.d_never_invested,
        updated_at: new Date().toISOString()
      }
    });
  });
  await page.route("**/api/backend/wallet/me", async (route) => route.fulfill({ json: { balance: 10, debt: 0, currency_label: "coin" } }));
  await page.route("**/api/backend/wallet/me/transactions", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/notifications/me", async (route) => route.fulfill({ json: [
    { id: "n1", type: "path_opened", payload: { message: "Percorso aperto.", link: "/paths/p1" }, read_at: null, created_at: new Date().toISOString() }
  ] }));
  await page.route("**/api/backend/notifications/*/read", async (route) => route.fulfill({ json: { id: "n1", type: "path_opened", payload: { message: "Percorso aperto.", link: "/paths/p1" }, read_at: new Date().toISOString(), created_at: new Date().toISOString() } }));
  await page.route("**/api/backend/notifications/read-all", async (route) => route.fulfill({ json: { updated: 1 } }));
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({ json: { current: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }, goals: [], history: [] } }));
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [] }));
});

test("dashboard renders responsive operational state", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Ciao Mentee/ })).toBeVisible();
  await expect(page.getByRole("main").getByText("Crediti").first()).toBeVisible();
  await expect(page.getByRole("main").getByText("10").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Trova mentor" })).toBeVisible();
});

test("global header shows user and notifications", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator(".topbar-brand:visible, .sidebar-brand-link:visible").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Notifiche" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mentee" })).toBeVisible();
  await page.getByRole("button", { name: "Notifiche" }).click();
  await expect(page.getByText("Percorso aperto.")).toBeVisible();
  await page.getByRole("button", { name: "Mentee" }).click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("onboarding submits score and links to goal", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L0", is_coach: false, latest_answer_id: null } }));
  await page.route("**/api/backend/surveys/onboarding/me/answers", async (route) => {
    await route.fulfill({ json: { answer_id: "a1", total_score: 19.6, derived_level: "L2", is_coach: true } });
  });

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Si, investo regolarmente" }).click();
  await page.getByRole("button", { name: "Piu di 5 anni" }).click();
  for (let i = 0; i < 7; i++) {
    await page.getByRole("button", { name: "Uso con autonomia" }).click();
  }
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Lo conosco bene" }).click();
  }
  await page.getByRole("button", { name: "Decido in autonomia dopo ricerche personali" }).click();
  await page.getByRole("button", { name: "Piu di 50.000 EUR" }).click();
  await page.getByRole("button", { name: "Salta questa sezione" }).click();
  await page.getByRole("button", { name: "Non ne sono sicuro/a" }).click();
  await page.getByRole("button", { name: "Non saprei, ci devo pensare" }).click();
  await page.getByRole("button", { name: "Non ci ho mai pensato" }).click();
  await page.getByRole("button", { name: "Scopri il tuo livello" }).click();

  await expect(page.getByRole("heading", { name: "Livello L2" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Definisci obiettivo" })).toBeVisible();
});

test("onboarding draft survives navigation", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L0", is_coach: false, latest_answer_id: null } }));
  let savedDraft: unknown = null;
  await page.route("**/api/backend/surveys/onboarding/me/draft", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: savedDraft });
      return;
    }
    const body = route.request().postDataJSON();
    savedDraft = {
      id: "draft1",
      current_step: body.current_step,
      scores: body.scores,
      answers: body.answers,
      include_section_d: body.include_section_d,
      d_never_invested: body.d_never_invested,
      updated_at: new Date().toISOString()
    };
    await route.fulfill({ json: savedDraft });
  });

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Si, investo regolarmente" }).click();
  await expect(page.getByRole("heading", { name: "Tempo di esperienza" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Ciao Mentee/ })).toBeVisible();

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Tempo di esperienza" })).toBeVisible();
});

test("completed onboarding cannot be restarted", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Survey completata" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Si, investo regolarmente" })).toHaveCount(0);
});

test("important actions are blocked until onboarding is complete", async ({ page }) => {
  let candidatesCalled = false;
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L0", is_coach: false, latest_answer_id: null } }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    candidatesCalled = true;
    await route.fulfill({ json: [] });
  });

  await page.goto("/matching?goalId=g1");
  await expect(page.getByRole("heading", { name: "Completa la survey prima di continuare" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Riprendi survey" })).toBeVisible();
  expect(candidatesCalled).toBe(false);
});

test("matching shows reasons and can create request", async ({ page }) => {
  await page.route("**/api/backend/matching/candidates", async (route) => {
    await route.fulfill({
      json: [
        {
          mentor_id: "mentor1",
          nickname: "Anna",
          level: "L2",
          match_score: 84,
          is_recommended: true,
          reason_summary: "In linea con il tuo obiettivo su ETF e con il tuo livello.",
          public_badges: ["Chiarezza"]
        }
      ]
    });
  });
  await page.route("**/api/backend/matching/requests", async (route) => route.fulfill({ json: { id: "r1", status: "pending", mentor_id: "mentor1", mentee_id: "u1", expires_at: new Date().toISOString() } }));

  await page.goto("/matching?goalId=g1");
  await expect(page.getByText("In linea con il tuo obiettivo")).toBeVisible();
  await expect(page.getByText("90/100")).toHaveCount(0);
  await page.getByRole("button", { name: "Invia richiesta al mentor" }).click();
  await expect(page.getByRole("status")).toContainText("attendi la risposta del mentor");
});

test("wallet hides monetization language and shows internal credits", async ({ page }) => {
  await page.goto("/wallet");
  await expect(page.getByRole("heading", { name: "Crediti Socra" })).toBeVisible();
  await expect(page.getByText("Valuta interna non monetizzabile")).toBeVisible();
});

test("paths are grouped by current user role", async ({ page }) => {
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [
    {
      id: "mentor-path",
      status: "open",
      mentee_id: "u2",
      mentor_id: "u1",
      goal_id: "g1",
      goal: { id: "g1", topic: "etf_funds", goal_tag: "mentor_goal", is_active: true },
      mentee: { user_id: "u2", nickname: "Luca", level: "L1", is_coach: true },
      mentor: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true }
    },
    {
      id: "mentee-path",
      status: "feedback_pending",
      mentee_id: "u1",
      mentor_id: "u3",
      goal_id: "g2",
      goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
      mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
      mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true }
    }
  ] }));

  await page.goto("/paths?tab=mentee");
  await expect(page.getByRole("button", { name: /Come mentee/ })).toBeVisible();
  await expect(page.getByText("mentee_goal")).toBeVisible();
  await expect(page.getByText("mentor_goal")).toHaveCount(0);

  await page.getByRole("button", { name: /Come mentor/ }).click();
  await expect(page.getByText("mentor_goal")).toBeVisible();
});

test("path detail shows only role-specific feedback action", async ({ page }) => {
  await page.route("**/api/backend/paths/path-1", async (route) => route.fulfill({ json: {
    id: "path-1",
    status: "feedback_pending",
    mentee_id: "u1",
    mentor_id: "u3",
    goal_id: "g2",
    goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true }
  } }));

  await page.goto("/paths/path-1");
  await expect(page.getByRole("link", { name: "Feedback mentee" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Feedback mentor" })).toHaveCount(0);
});
