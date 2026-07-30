import { expect, test } from "@playwright/test";

test.beforeEach(async ({ baseURL, context, page }) => {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
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
  await page.route("**/api/backend/matching/requests/me?role=mentee", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/matching/candidates", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/profiles/u1", async (route) => route.fulfill({ json: {
    user_id: "u1",
    nickname: "Mentee",
    level: "L1",
    is_coach: true,
    completed_paths: 0,
    public_badges: ["Chiaro"],
    top_topics: ["ETF e fondi"],
    aggregate_metrics: {}
  } }));
});

test("dashboard renders responsive operational state", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Ciao Mentee/ })).toBeVisible();
  await expect(page.getByRole("main").getByText("Crediti").first()).toBeVisible();
  await expect(page.getByRole("main").getByText("10").first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Trova un mentor", exact: true })).toBeVisible();
  await expect(page.getByLabel("Topic di competenza").getByText("ETF e fondi")).toBeVisible();
  await expect(page.getByLabel("Badge qualitativi più ricevuti").getByText("Chiaro")).toBeVisible();
});

test("dashboard routes a completed mentee path to goal review before matching", async ({ page }) => {
  let candidatesCalled = false;
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [{
    id: "path-review",
    status: "completed",
    mentee_id: "u1",
    mentor_id: "mentor1",
    goal_id: "g1",
    goal_review_completed: false,
    mentor: { user_id: "mentor1", nickname: "Anna", level: "L2", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  }] }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    candidatesCalled = true;
    await route.fulfill({ json: [] });
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("alert").getByRole("link", { name: "Rivedi obiettivo" })).toHaveAttribute("href", "/goal?pathId=path-review");
  await expect(page.getByRole("main").getByRole("link", { name: "Rivedi obiettivo" })).toHaveCount(2);
  await expect(page.getByRole("main").getByText("Mentor compatibili", { exact: true })).toHaveCount(0);
  expect(candidatesCalled).toBe(false);
});

test("dashboard treats an active mentee path as progress, not a matching error", async ({ page }) => {
  let candidatesCalled = false;
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [{
    id: "path-active",
    status: "open",
    mentee_id: "u1",
    mentor_id: "mentor1",
    goal_id: "g1",
    goal_review_completed: false,
    mentor: { user_id: "mentor1", nickname: "Anna", level: "L2", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  }] }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    candidatesCalled = true;
    await route.fulfill({ json: [] });
  });

  await page.goto("/dashboard");

  await expect(page.getByText("Percorso in corso", { exact: true })).toBeVisible();
  await expect(page.getByText("Hai già un percorso attivo come mentee.")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Apri il percorso", exact: true })).toHaveAttribute("href", "/paths/path-active");
  await expect(page.locator(".topbar-shortcut")).toHaveAttribute("href", "/paths/path-active");
  await expect(page.getByText("Non riusciamo ad aggiornare i mentor compatibili.")).toHaveCount(0);
  expect(candidatesCalled).toBe(false);
});

test("L0 dashboard explains mentor eligibility without promising requests", async ({ page }) => {
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: {
    id: "u1",
    username: "mentee",
    email: "mentee@example.com",
    nickname: "Mentee",
    level: "L0",
    is_coach: false,
    role: "user",
    account_status: "active"
  } }));

  await page.goto("/dashboard");

  await expect(page.getByText("Al momento il tuo profilo non può ricevere richieste come mentor.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Informazioni sui livelli" })).toBeVisible();
  await expect(page.getByText(/si sblocca|come crescere|soglia/i)).toHaveCount(0);
  await expect(page.getByText("Puoi ricevere richieste")).toHaveCount(0);
});

test("global header shows user and notifications", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator(".topbar-brand:visible, .sidebar-brand-link:visible").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Notifiche" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mentee" })).toBeVisible();
  await page.getByRole("button", { name: "Notifiche" }).click();
  await expect(page.getByText("Percorso aperto.")).toBeVisible();
  await page.getByRole("button", { name: "Mentee" }).click();
  await expect(page.getByRole("button", { name: "Esci" })).toBeVisible();
});

test("global navigation exposes the requests area", async ({ page }) => {
  await page.goto("/dashboard");

  const requestsLink = page.locator('a[href="/requests"]:visible').first();
  await expect(requestsLink).toBeVisible();
  await requestsLink.click();

  await expect(page).toHaveURL(/\/requests/);
  await expect(page.getByRole("heading", { name: "Proposte di percorso" })).toBeVisible();
});

test("onboarding submits score and links to goal", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L0", is_coach: false, latest_answer_id: null } }));
  let submittedPayload: { section: string; answers: Record<string, unknown> } = { section: "", answers: {} };
  await page.route("**/api/backend/surveys/onboarding/me/answers", async (route) => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({ json: { answer_id: "a1", total_score: 19.6, derived_level: "L2", is_coach: true } });
  });

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "La tua esperienza" })).toBeVisible();
  await page.getByRole("button", { name: "Sì, investo regolarmente" }).click();
  await page.getByLabel("Da quanto tempo investi?").selectOption("gt_5y");
  await page.getByLabel("Come prendi le decisioni di investimento?").selectOption("independent");
  await page.getByLabel("Ordine di grandezza del capitale investito?").selectOption("gt_50k");
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Strumenti utilizzati" })).toBeVisible();
  const instrumentSelects = page.locator(".survey-matrix select");
  await expect(instrumentSelects).toHaveCount(7);
  for (const select of await instrumentSelects.all()) {
    await select.selectOption("3");
  }
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Conoscenze di base" })).toBeVisible();
  const knowledgeSelects = page.locator(".survey-matrix select");
  await expect(knowledgeSelects).toHaveCount(6);
  for (const select of await knowledgeSelects.all()) {
    await select.selectOption("2");
  }
  await expect(page.locator(".progress-steps")).toHaveCount(1);
  await expect(page.locator(".progress-step")).toHaveCount(6);
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Scelte in situazioni concrete" })).toBeVisible();
  const situationSelects = page.locator(".survey-situations select");
  await expect(situationSelects).toHaveCount(3);
  for (const select of await situationSelects.all()) {
    await select.selectOption("excellent");
  }
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Contesto personale" })).toBeVisible();
  const contextSelects = page.locator("#context-D1, #context-D2, #context-D3, #context-D4, #context-D5");
  await expect(contextSelects).toHaveCount(5);
  for (const select of await contextSelects.all()) {
    await select.selectOption("undisclosed");
  }
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Rivedi e conferma" })).toBeVisible();
  const experienceReview = page.locator(".review-row").filter({ hasText: "Esperienza" });
  const instrumentsReview = page.locator(".review-row").filter({ hasText: "Strumenti" });
  const knowledgeReview = page.locator(".review-row").filter({ hasText: "Conoscenze" });
  const situationsReview = page.locator(".review-row").filter({ hasText: "Scenari" });
  await expect(experienceReview.getByText("Più di 5 anni")).toBeVisible();
  await expect(instrumentsReview.getByText("Uso con autonomia").first()).toBeVisible();
  await expect(knowledgeReview.getByText("Lo conosco bene").first()).toBeVisible();
  await expect(situationsReview.getByText("Dipende dal resto della sua situazione finanziaria e orizzonte")).toBeVisible();

  const contextReview = page.locator(".review-row").filter({ hasText: "Contesto personale" });
  await expect(contextReview.getByText("Preferisco non rispondere").first()).toBeVisible();
  await contextReview.getByRole("button", { name: "Modifica contesto personale" }).click();
  await expect(page.getByRole("heading", { name: "Contesto personale" })).toBeVisible();
  await expect(page.getByLabel("Situazione professionale")).toHaveValue("undisclosed");
  await page.getByRole("button", { name: "Continua", exact: true }).click();

  await page.getByRole("button", { name: "Scopri il tuo livello" }).click();

  expect(submittedPayload.section).toBe("onboarding");
  expect(Object.keys((submittedPayload.answers.D3 as Record<string, number>) || {})).toHaveLength(7);
  expect(Object.keys((submittedPayload.answers.D4 as Record<string, number>) || {})).toHaveLength(6);
  expect(submittedPayload.answers).toMatchObject({ D1: "regular", D2: "gt_5y", D5: "independent", D6: "gt_50k", D7: "excellent", D8: "excellent", D9: "excellent" });
  expect(submittedPayload.answers.section_d).toEqual({
    D1: "undisclosed",
    D2: "undisclosed",
    D3: "undisclosed",
    D4: "undisclosed",
    D5: "undisclosed"
  });
  await expect(page.getByLabel("Livello L2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Scegli cosa imparare" })).toBeVisible();
});

test("onboarding draft survives navigation", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: { user_id: "u1", level: "L0", is_coach: false, latest_answer_id: null } }));
  let savedDraft: {
    id: string;
    current_step: number;
    scores: Record<string, number>;
    answers: Record<string, unknown>;
    include_section_d: boolean;
    d_never_invested: boolean;
    updated_at: string;
  } | null = null;
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
  await page.getByRole("button", { name: "Sì, investo regolarmente" }).click();
  await page.getByLabel("Da quanto tempo investi?").selectOption("2y_5y");
  await page.getByLabel("Come prendi le decisioni di investimento?").selectOption("guided");
  await page.getByLabel("Ordine di grandezza del capitale investito?").selectOption("10k_50k");
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Strumenti utilizzati" })).toBeVisible();
  await expect.poll(() => savedDraft?.current_step).toBe(1);

  await page.goto("/come-funziona");
  await expect(page.getByRole("heading", { name: /Come funziona SOCRA/i })).toBeVisible();

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Strumenti utilizzati" })).toBeVisible();
  await page.getByRole("button", { name: "Indietro" }).click();
  await expect(page.getByRole("button", { name: "Sì, investo regolarmente" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Da quanto tempo investi?")).toHaveValue("2y_5y");
  await expect(page.getByLabel("Come prendi le decisioni di investimento?")).toHaveValue("guided");
  await expect(page.getByLabel("Ordine di grandezza del capitale investito?")).toHaveValue("10k_50k");
});

test("onboarding never restores a draft from another account", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({
    json: {
      user_id: "account-b",
      level: "L0",
      is_coach: false,
      latest_answer_id: null
    }
  }));
  await page.route("**/api/backend/surveys/onboarding/me/draft", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: null });
      return;
    }
    await route.fulfill({ json: route.request().postDataJSON() });
  });

  await page.goto("/dashboard");
  await page.evaluate(() => {
    window.sessionStorage.setItem("socra_onboarding_draft", JSON.stringify({
      step: 3,
      answers: {
        D1: "none",
        D4: {},
        section_d: {
          D1: "employed_permanent",
          D2: "gt_75k",
          D3: "gt_1k",
          D4: "mortgage_and_other_debt",
          D5: "no"
        }
      }
    }));
  });

  await page.goto("/onboarding");

  await expect(page.getByRole("heading", { name: "La tua esperienza" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contesto personale" })).toHaveCount(0);
});

test("completed onboarding cannot be restarted", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Survey già completata")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Basi operative" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Gestisci obiettivo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "La tua esperienza" })).toHaveCount(0);
});

test("goal route preloads the current goal without requiring a special query", async ({ page }) => {
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({ json: {
    current: {
      id: "g-current",
      topic: "ETF e fondi",
      topic_code: "etf_funds",
      goal_tag: "Capire cosa sono gli ETF e come funzionano",
      goal_tag_code: "understand_etf",
      capital_goal: "500_5k",
      risk: "balanced",
      is_active: true
    },
    goals: [],
    history: []
  } }));

  await page.goto("/goal");

  await expect(page.getByRole("heading", { name: "Aggiorna cosa vuoi imparare" })).toBeVisible();
  await expect(page.getByLabel("Tema")).toHaveValue("etf_funds");
  await expect(page.getByLabel("Risultato di apprendimento")).toHaveValue("understand_etf");
  await expect(page.getByLabel("Contesto di partenza (privato)")).toHaveValue("500_5k");
  await expect(page.getByLabel("Stile del confronto (privato)")).toHaveValue("balanced");
  const contextLabels = await page.getByLabel("Contesto di partenza (privato)").locator("option").allTextContents();
  expect(contextLabels.join(" ")).not.toMatch(/EUR|€/);
});

test("tour keeps the current step in the URL", async ({ page }) => {
  await page.goto("/tour?goalId=g1");
  await expect(page.getByRole("heading", { name: "Scegli tra mentor compatibili" })).toBeVisible();

  await page.getByRole("button", { name: "Continua" }).click();
  await expect(page).toHaveURL(/goalId=g1.*step=2|step=2.*goalId=g1/);
  await expect(page.getByRole("heading", { name: "Il mentor ha 48 ore per rispondere" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Il mentor ha 48 ore per rispondere" })).toBeVisible();
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
  let requestPayload: { mentor_id: string; goal_id: string } = { mentor_id: "", goal_id: "" };
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
  await page.route("**/api/backend/matching/requests", async (route) => {
    requestPayload = route.request().postDataJSON();
    await route.fulfill({ json: { id: "r1", status: "pending", mentor_id: "mentor1", mentee_id: "u1", expires_at: new Date().toISOString() } });
  });

  await page.goto("/matching?goalId=g1");
  await expect(page.getByText("In linea con il tuo obiettivo")).toBeVisible();
  await expect(page.getByText("90/100")).toHaveCount(0);
  await page.getByRole("button", { name: "Invia richiesta al mentor" }).click();
  expect(requestPayload).toEqual({ mentor_id: "mentor1", goal_id: "g1" });
  await expect(page.getByRole("status")).toContainText("48 ore per rispondere");
});

test("matching restores a pending request after reload", async ({ page }) => {
  await page.route("**/api/backend/matching/requests/me?role=mentee", async (route) => route.fulfill({ json: [{
    id: "pending-1",
    status: "pending",
    mentor_id: "mentor1",
    mentee_id: "u1",
    goal_id: "g1",
    expires_at: "2026-07-27T12:00:00Z"
  }] }));
  await page.route("**/api/backend/matching/candidates", async (route) => route.fulfill({ json: [{
    mentor_id: "mentor1",
    nickname: "Anna",
    level: "L2",
    match_score: 84,
    is_recommended: true,
    reason_summary: "In linea con il tuo obiettivo.",
    public_badges: []
  }] }));

  await page.goto("/matching?goalId=g1");

  const requested = page.getByRole("button", { name: "Richiesta inviata" });
  await expect(requested).toBeVisible();
  await expect(requested).toBeDisabled();
});

test("matching ignores an inactive goal passed in the URL", async ({ page }) => {
  let matchedGoalId = "";
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({ json: {
    current: { id: "g-active", topic: "etf_funds", goal_tag: "active_goal", is_active: true },
    goals: [
      { id: "g-old", topic: "stocks", goal_tag: "old_goal", is_active: false },
      { id: "g-active", topic: "etf_funds", goal_tag: "active_goal", is_active: true }
    ]
  } }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    matchedGoalId = route.request().postDataJSON().goal_id;
    await route.fulfill({ json: [] });
  });

  await page.goto("/matching?goalId=g-old");

  await expect.poll(() => matchedGoalId).toBe("g-active");
  await expect(page.getByText("old_goal")).toHaveCount(0);
});

test("dashboard distinguishes a matching outage and retries", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/backend/matching/candidates", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, json: { detail: "Servizio temporaneamente non disponibile" } });
      return;
    }
    await route.fulfill({ json: [{
      mentor_id: "mentor1",
      nickname: "Anna",
      level: "L2",
      match_score: 84,
      is_recommended: true,
      reason_summary: "Compatibile con il tuo obiettivo."
    }] });
  });

  await page.goto("/dashboard");
  await expect(page.getByText("Non riusciamo ad aggiornare i mentor compatibili.")).toBeVisible();
  await expect(page.getByText("Nessun mentor compatibile è disponibile ora.")).toHaveCount(0);
  await page.getByRole("button", { name: "Riprova" }).click();
  await expect(page.getByText("Anna")).toBeVisible();
  expect(attempts).toBe(2);
});

test("request expiry during accept never reports an opened path", async ({ page }) => {
  let status = "pending";
  const request = {
    id: "request-1",
    status,
    mentor_id: "u1",
    mentee_id: "u2",
    goal_id: "g1",
    expires_at: "2026-07-27T12:00:00Z",
    mentee: { user_id: "u2", nickname: "Luca", level: "L1", is_coach: true },
    mentor: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  };
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => {
    await route.fulfill({ json: [{ ...request, status }] });
  });
  await page.route("**/api/backend/matching/requests/request-1/respond", async (route) => {
    status = "expired_by_timeout";
    await route.fulfill({ status: 409, json: {
      detail: "La richiesta è scaduta (expired_by_timeout) e non può più ricevere una risposta.",
      request_id: request.id,
      status,
    } });
  });

  await page.goto("/requests?tab=received");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Vuoi accettare e aprire questo percorso?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Accetta" }).click();

  const outcome = page.getByText(/Nessun percorso è stato aperto/);
  await expect(outcome).toBeVisible();
  await expect(outcome).not.toContainText("percorso è aperto");
});

test("accepting a mentor proposal confirms both path cost and available credits", async ({ page }) => {
  let responseCalled = false;
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [{
    id: "mentor-proposal",
    status: "pending",
    initiator_role: "mentor",
    mentor_id: "mentor1",
    mentee_id: "u1",
    goal_id: "g1",
    cost_at_request: 2,
    expires_at: "2026-08-02T12:00:00Z",
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "mentor1", nickname: "Anna", level: "L2", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  }] }));
  await page.route("**/api/backend/matching/requests/mentor-proposal/respond", async (route) => {
    responseCalled = true;
    await route.fulfill({ json: { id: "mentor-proposal", status: "open" } });
  });

  await page.goto("/requests?tab=received");
  await expect(page.getByText(/Costo all.accettazione: 2 crediti/)).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Il percorso costerà 2 crediti");
    expect(dialog.message()).toContain("Crediti disponibili: 10");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Accetta" }).click();
  expect(responseCalled).toBe(false);
});

test("mentor opt-out blocks pending response actions", async ({ page }) => {
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: {
    id: "u1",
    username: "mentee",
    email: "mentee@example.com",
    nickname: "Mentee",
    level: "L1",
    is_coach: false,
    role: "user",
    account_status: "active"
  } }));
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [{
    id: "request-1",
    status: "pending",
    mentor_id: "u1",
    mentee_id: "u2",
    goal_id: "g1",
    expires_at: "2026-07-27T12:00:00Z",
    mentee: { user_id: "u2", nickname: "Luca", level: "L1", is_coach: true },
    mentor: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: false }
  }] }));

  await page.goto("/requests?tab=received");

  await expect(page.getByText("La disponibilità come mentor è disattivata.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Gestisci ruolo mentor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accetta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Rifiuta" })).toHaveCount(0);
});

test("terminal requests show their outcome date instead of a response deadline", async ({ page }) => {
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [{
    id: "request-rejected",
    status: "rejected",
    mentor_id: "mentor1",
    mentee_id: "u1",
    goal_id: "g1",
    expires_at: "2026-07-27T12:00:00Z",
    updated_at: "2026-07-25T12:00:00Z",
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "mentor1", nickname: "Anna", level: "L2", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  }] }));

  await page.goto("/requests?tab=sent");

  await expect(page.getByText("Rifiutata il:", { exact: false })).toBeVisible();
  await expect(page.getByText("Scade il:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Rispondi entro:", { exact: false })).toHaveCount(0);
});

test("non-admin users see an access-denied state without admin queue metrics", async ({ page }) => {
  await page.route("**/api/backend/admin/review-queue", async (route) => route.fulfill({
    status: 403,
    json: { detail: "Admin role required" }
  }));

  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Area riservata" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Amministrazione" })).toHaveCount(0);
  await expect(page.getByText("Verifiche attive")).toHaveCount(0);
});

test("profile restores a pending request without requiring candidate reload", async ({ page }) => {
  await page.route("**/api/backend/profiles/mentor1", async (route) => route.fulfill({ json: {
    user_id: "mentor1",
    nickname: "Anna",
    level: "L2",
    is_coach: true,
    completed_paths: 2,
    public_badges: [],
    top_topics: ["ETF"],
    aggregate_metrics: {}
  } }));
  await page.route("**/api/backend/matching/requests/me?role=mentee", async (route) => route.fulfill({ json: [{
    id: "pending-1",
    status: "pending",
    mentor_id: "mentor1",
    mentee_id: "u1",
    goal_id: "g1",
    expires_at: "2026-07-27T12:00:00Z"
  }] }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    await route.fulfill({ status: 503, json: { detail: "Matching non disponibile" } });
  });

  await page.goto("/profiles/mentor1");

  await expect(page.getByText("Richiesta inviata").first()).toBeVisible();
  await expect(page.getByText("Verifica compatibilità non disponibile")).toHaveCount(0);
});

test("profile distinguishes a matching outage from an incompatible mentor", async ({ page }) => {
  await page.route("**/api/backend/profiles/mentor1", async (route) => route.fulfill({ json: {
    user_id: "mentor1",
    nickname: "Anna",
    level: "L2",
    is_coach: true,
    completed_paths: 2,
    public_badges: [],
    top_topics: ["ETF"],
    aggregate_metrics: {}
  } }));
  await page.route("**/api/backend/matching/candidates", async (route) => {
    await route.fulfill({ status: 503, json: { detail: "Matching non disponibile" } });
  });

  await page.goto("/profiles/mentor1");

  await expect(page.getByText("Verifica compatibilità non disponibile")).toBeVisible();
  await expect(page.getByText("Non disponibile per questo obiettivo")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Riprova" })).toBeVisible();
});

test("goal form warns before discarding unsaved choices", async ({ page }) => {
  await page.goto("/goal");
  await page.locator("form select").first().selectOption({ index: 1 });

  let warning = "";
  page.once("dialog", async (dialog) => {
    warning = dialog.message();
    await dialog.dismiss();
  });
  await page.locator('a[href="/dashboard"]:visible').first().click();

  expect(warning).toContain("modifiche non salvate");
  await expect(page).toHaveURL(/\/goal$/);
});

test("wallet hides monetization language and shows internal credits", async ({ page }) => {
  await page.goto("/wallet");
  await expect(page.getByRole("heading", { name: "Crediti Socra" })).toBeVisible();
  await expect(page.getByText("Unità interna di partecipazione, non monetizzabile, usata solo nei percorsi Socra.")).toBeVisible();
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
  await expect(page.getByRole("tab", { name: /Come mentee/ })).toBeVisible();
  await expect(page.getByText("mentee_goal")).toBeVisible();
  await expect(page.getByText("mentor_goal")).toHaveCount(0);

  await page.getByRole("tab", { name: /Come mentor/ }).click();
  await expect(page.getByText("mentor_goal")).toBeVisible();
});

test("first-session verification uses user-safe provider states", async ({ page }) => {
  let verificationStatus: "verified" | "pending_provider_metadata" | "insufficient_participants" = "pending_provider_metadata";
  let firstCallCompleted = false;
  const path = {
    id: "path-sync",
    status: "open",
    mentee_id: "u1",
    mentor_id: "u3",
    goal_id: "g2",
    goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true },
    mentee_closed_at: null,
    mentor_closed_at: null,
    mentee_feedback_submitted: false,
    mentor_feedback_submitted: false,
    goal_review_completed: false
  };
  await page.route("**/api/backend/paths/path-sync", async (route) => {
    await route.fulfill({ json: { ...path, first_call_completed: firstCallCompleted } });
  });
  await page.route("**/api/backend/calls/first-session/room?path_id=path-sync", async (route) => {
    await route.fulfill({ json: {
      id: "room-1",
      path_id: "path-sync",
      provider: "google_meet",
      provider_space_name: "spaces/room-1",
      provider_meeting_code: "abc-defg-hij",
      join_url: "https://meet.google.com/abc-defg-hij",
      conference_record_name: null,
      status: "active",
      replaced_at: null,
      closed_at: null,
      closed_reason: null,
      superseded_by_room_id: null,
      created_at: "2026-07-25T12:00:00Z",
      updated_at: "2026-07-25T12:00:00Z"
    } });
  });
  await page.route("**/api/backend/calls/first-session/sync-metadata", async (route) => {
    if (verificationStatus === "verified") firstCallCompleted = true;
    await route.fulfill({ json: {
      metadata_id: verificationStatus === "verified" ? "metadata-1" : null,
      verification_status: verificationStatus,
      transcripts_enabled: false,
      anomaly_flags: [],
      conference_record_name: null,
      active_participants_count: verificationStatus === "verified" ? 2 : 1,
      conferences_synced: 0,
      participant_sessions_synced: 0,
      transcripts_synced: 0,
      transcript_entries_synced: 0
    } });
  });

  await page.goto("/paths/path-sync");
  await page.getByRole("button", { name: "Verifica prima sessione" }).click();
  await expect(page.getByRole("status")).toContainText("Google sta ancora elaborando");

  verificationStatus = "insufficient_participants";
  await page.getByRole("button", { name: "Verifica prima sessione" }).click();
  await expect(page.getByText(/Non risultano almeno due partecipanti alla prima sessione/)).toBeVisible();

  verificationStatus = "verified";
  await page.getByRole("button", { name: "Verifica prima sessione" }).click();
  await expect(page.getByRole("status")).toContainText("Prima sessione verificata");
  await expect(page.getByRole("button", { name: "Verifica prima sessione" })).toHaveCount(0);
});

test("path closure and feedback actions follow first-call and actor state", async ({ page }) => {
  let pathState = {
    id: "path-1",
    status: "open",
    mentee_id: "u1",
    mentor_id: "u3",
    goal_id: "g2",
    goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true },
    first_call_completed: false,
    mentee_closed_at: null as string | null,
    mentor_closed_at: null as string | null,
    mentee_feedback_submitted: false,
    mentor_feedback_submitted: false,
    goal_review_completed: false
  };
  await page.route("**/api/backend/paths/path-1", async (route) => route.fulfill({ json: pathState }));
  await page.route("**/api/backend/calls/first-session/room?path_id=path-1", async (route) => {
    await route.fulfill({ status: 404, json: { detail: "Call non preparata" } });
  });

  await page.goto("/paths/path-1");
  await expect(page.getByText(/Puoi chiudere il tuo lato dopo che la prima sessione/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Chiudi il mio lato" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Lascia feedback sul mentor" })).toHaveCount(0);

  pathState = { ...pathState, first_call_completed: true };
  await page.reload();
  await expect(page.getByRole("button", { name: "Chiudi il mio lato" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lascia feedback sul mentor" })).toHaveCount(0);

  pathState = {
    ...pathState,
    status: "feedback_pending",
    mentee_closed_at: "2026-07-25T12:00:00Z"
  };
  await page.reload();
  await expect(page.getByRole("link", { name: "Lascia feedback sul mentor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chiudi il mio lato" })).toHaveCount(0);

  pathState = { ...pathState, mentee_feedback_submitted: true };
  await page.reload();
  await expect(page.getByText(/Feedback inviato/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Lascia feedback sul mentor" })).toHaveCount(0);

  pathState = {
    ...pathState,
    status: "completed",
    mentor_closed_at: "2026-07-25T12:05:00Z",
    mentor_feedback_submitted: true
  };
  await page.reload();
  await expect(page.getByRole("heading", { name: "Percorso completato" })).toBeVisible();
  await expect(page.getByText("Entrambe le persone hanno chiuso il percorso e inviato il feedback.")).toBeVisible();
});

test("feedback note visibility is explicit and path success banners are restored", async ({ page }) => {
  const feedbackPath = {
    id: "path-feedback",
    status: "feedback_pending",
    mentee_id: "u1",
    mentor_id: "u3",
    goal_id: "g2",
    goal: { id: "g2", topic: "ETF e fondi", topic_code: "etf_funds", goal_tag: "Capire gli ETF", is_active: true },
    mentee: { user_id: "u1", nickname: "Mentee", level: "L1", is_coach: true },
    mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true },
    first_call_completed: true,
    mentee_closed_at: "2026-07-25T12:00:00Z",
    mentor_closed_at: null,
    mentee_feedback_submitted: false,
    mentor_feedback_submitted: false,
    goal_review_completed: false
  };
  await page.route("**/api/backend/paths/path-feedback", async (route) => route.fulfill({ json: feedbackPath }));
  await page.route("**/api/backend/calls/first-session/room?path_id=path-feedback", async (route) => {
    await route.fulfill({ status: 404, json: { detail: "Call non preparata" } });
  });

  await page.goto("/feedback/path-feedback/mentee");
  await expect(page.getByText("L’eventuale nota testuale sarà visibile solo a voi due e agli admin, dopo che entrambi avrete inviato il feedback.")).toBeVisible();
  await expect(page.getByText("Non comparirà sul profilo pubblico.")).toBeVisible();

  await page.goto("/paths/path-feedback?feedback=sent");
  await expect(page.getByText("Feedback inviato correttamente.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/paths\/path-feedback$/);
});
