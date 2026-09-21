import { expect, test } from "@playwright/test";
import { goalOptionsByLevelTopic, topicOptions } from "../../lib/options";

const discussionTypes = [
  ["start_from_basics", "Partire dalle basi"], ["deepen_topic", "Approfondire un argomento"],
  ["concrete_case", "Confrontarmi su un caso concreto"], ["learn_by_doing", "Imparare facendo"],
  ["understand_method", "Capire il metodo"], ["clarify_doubts", "Chiarire dubbi"],
  ["compare_approaches", "Confrontare approcci diversi"], ["organize_knowledge", "Mettere ordine nelle mie conoscenze"],
  ["check_understanding", "Verificare ciò che ho capito"],
].map(([code, label]) => ({ code, label, description: `Preferenza: ${label}.` }));

test.beforeEach(async ({ baseURL, context, page }) => {
  await page.route("**/api/backend/calls/capabilities", route => route.fulfill({ json: { google_meet_available: true } }));
  await page.route("**/api/backend/surveys/goal/catalog", (route) => route.fulfill({ json: {
    discussion_types: discussionTypes, max_discussion_types: 3,
    topics: topicOptions.filter((topic) => !["planning", "taxation", "undefined"].includes(topic.value)).map((topic) => ({
      code: topic.value, label: topic.label,
      goals: Array.from(new Map(Object.values(goalOptionsByLevelTopic).flatMap((matrix) => matrix[topic.value] || []).map((goal) => [goal.value, { code: goal.value, label: goal.label }])).values()),
    })),
  } }));
  await page.route("**/api/backend/matching/alternatives?**", (route) => route.fulfill({ json: [] }));
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: { id: "u1", username: "mentee", email: "mentee@example.com", nickname: "Apprendista", level: "L1", is_coach: true, role: "user", account_status: "active" } }));
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
  await page.route("**/api/backend/surveys/competences-v2/me", async (route) => route.fulfill({ json: {
    instruments: [],
    eligible_mentor_topics: [],
    is_coach: true
  } }));
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
    nickname: "Apprendista",
    level: "L1",
    is_coach: true,
    completed_paths: 0,
    public_badges: ["Chiaro"],
    top_topics: ["ETF e fondi"],
    aggregate_metrics: {}
  } }));
});

test("auth forms keep credentials out of the URL before hydration", async ({ context, page }) => {
  await context.clearCookies();

  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("method", "post");

  await page.goto("/register");
  await expect(page.getByRole("form", { name: "Crea il tuo account" })).toHaveAttribute("method", "post");
});

test("backend proxy accepts the V2 preference PUT method", async ({ page }) => {
  const response = await page.request.put("/api/backend/surveys/competences-v2/me/mentor-topics", {
    data: { topics: [] },
  });
  expect(response.status()).not.toBe(405);
});

test("dashboard renders responsive operational state", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Ciao Apprendista/ })).toBeVisible();
  await expect(page.getByRole("main").getByText("Crediti").first()).toBeVisible();
  await expect(page.getByRole("main").getByText("10").first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Trova un mentor", exact: true })).toBeVisible();
  await expect(page.getByLabel("Topic di competenza").getByText("ETF e fondi")).toBeVisible();
  await expect(page.getByLabel("Badge qualitativi più ricevuti").getByText("Chiaro")).toBeVisible();
});

test("dashboard routes a completed apprendista path to goal review before matching", async ({ page }) => {
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

test("dashboard treats an active apprendista path as progress, not a matching error", async ({ page }) => {
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
  await expect(page.getByText("Hai già un percorso attivo come apprendista.")).toBeVisible();
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
    nickname: "Apprendista",
    level: "L0",
    is_coach: false,
    role: "user",
    account_status: "active"
  } }));

  await page.goto("/dashboard");

  await expect(page.getByText("Dalle impostazioni puoi verificare gli argomenti su cui renderti disponibile.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Gestisci ruolo mentor" })).toBeVisible();
  await expect(page.getByText(/si sblocca|come crescere|soglia/i)).toHaveCount(0);
  await expect(page.getByText("Puoi ricevere richieste")).toHaveCount(0);
});

test("global header shows user and notifications", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator(".topbar-brand:visible, .sidebar-brand-link:visible").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Notifiche" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apprendista" })).toBeVisible();
  await page.getByRole("button", { name: "Notifiche" }).click();
  await expect(page.getByText("Percorso aperto.")).toBeVisible();
  await page.getByRole("button", { name: "Apprendista" }).click();
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

test("settings updates mentor topics and requires the Forex safety scenario", async ({ page }) => {
  const topicCodes = ["savings_first_steps", "mutual_funds", "etf_funds", "stocks", "bonds", "crypto", "forex", "derivatives"];
  let currentItems: Array<{
    topic: string;
    knowledge_level: string;
    invested_amount_band: string;
    wants_to_mentor: boolean;
    mentor_eligible: boolean;
    mentor_enabled: boolean;
    safety_scenario_answer: string | null;
    safety_scenario_passed: boolean | null;
  }> = topicCodes.map((topic) => ({
    topic,
    knowledge_level: "K2",
    invested_amount_band: "A3",
    wants_to_mentor: topic === "etf_funds",
    mentor_eligible: topic !== "forex" && topic !== "derivatives",
    mentor_enabled: topic === "etf_funds",
    safety_scenario_answer: null,
    safety_scenario_passed: null
  }));
  let lastPutTopics: Array<Record<string, unknown>> = [];
  await page.route("**/api/backend/surveys/competences-v2/me", async (route) => {
    await route.fulfill({ json: { instruments: currentItems, is_coach: true } });
  });
  await page.route("**/api/backend/surveys/competences-v2/me/mentor-topics", async (route) => {
    const body = route.request().postDataJSON() as { topics: Array<Record<string, unknown>> };
    lastPutTopics = body.topics;
    currentItems = currentItems.map((item) => {
      const update = lastPutTopics.find((candidate) => candidate.topic === item.topic);
      const answer = typeof update?.safety_scenario_answer === "string" ? update.safety_scenario_answer : null;
      const wants = update?.wants_to_mentor === true;
      const safetyPassed = item.topic === "forex"
        ? answer === "leverage_can_exhaust_capital"
        : item.topic === "derivatives"
          ? answer === "risk_depends_on_position_and_can_exceed_premium"
          : null;
      const mentorEligible = safetyPassed === null ? true : safetyPassed;
      return {
        ...item,
        wants_to_mentor: wants,
        safety_scenario_answer: answer,
        safety_scenario_passed: safetyPassed,
        mentor_eligible: mentorEligible,
        mentor_enabled: wants && mentorEligible
      };
    });
    await route.fulfill({ json: { instruments: currentItems, consistency_flags: [], is_coach: true } });
  });

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Disponibilità come mentor" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Mentorship su ETF" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Mentorship su Forex" })).toBeEnabled();
  await expect(page.getByText("Non risultano ancora strumenti disponibili per la mentorship.")).toHaveCount(0);
  await page.locator('label[for="mentor-topic-forex"]').click();
  await expect(page.getByText("Prima di renderti disponibile sul Forex")).toBeVisible();
  expect(lastPutTopics).toHaveLength(0);
  await page.getByLabel("La leva può amplificare le perdite fino a esaurire il capitale esposto.").check();
  await expect.poll(() => lastPutTopics.length).toBe(8);
  expect(lastPutTopics.find((item) => item.topic === "forex")).toMatchObject({
    wants_to_mentor: true,
    safety_scenario_answer: "leverage_can_exhaust_capital"
  });
  await expect(page.getByText("Disponibilità per strumento aggiornata.")).toBeVisible();
  await expect(page.getByText(/1\.000|9\.999|capitale investito/i)).toHaveCount(0);
});

test("settings keeps saved topic preferences neutral when the global mentor switch is off", async ({ page }) => {
  const instruments = ["savings_first_steps", "mutual_funds", "etf_funds", "stocks", "bonds", "crypto", "forex", "derivatives"]
    .map((topic) => ({
      topic,
      knowledge_level: "K2",
      invested_amount_band: "A3",
      wants_to_mentor: topic === "etf_funds",
      mentor_eligible: true,
      mentor_enabled: false,
      safety_scenario_answer: null,
      safety_scenario_passed: null
    }));
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: {
    id: "u1", username: "mentee", email: "mentee@example.com", nickname: "Apprendista",
    level: "L2", is_coach: false, role: "user", account_status: "active"
  } }));
  await page.route("**/api/backend/surveys/competences-v2/me", async (route) => route.fulfill({
    json: { instruments, is_coach: false }
  }));

  await page.goto("/settings");

  await expect(page.getByRole("switch", { name: "Mentorship su ETF" })).toBeChecked();
  await expect(page.getByText("Non attiva con la risposta indicata")).toHaveCount(0);
  await expect(page.getByText("Attivala per ricevere richieste sugli strumenti che hai selezionato.")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Disponibilità come mentor" })).toBeEnabled();
});

test("settings keeps high-risk topics read-only when a general guardrail blocks mentorship", async ({ page }) => {
  const instruments = ["savings_first_steps", "mutual_funds", "etf_funds", "stocks", "bonds", "crypto", "forex", "derivatives"]
    .map((topic) => ({
      topic,
      knowledge_level: "K2",
      invested_amount_band: "A3",
      wants_to_mentor: false,
      mentor_eligible: false,
      mentor_enabled: false,
      safety_scenario_answer: null,
      safety_scenario_passed: null
    }));
  await page.route("**/api/backend/surveys/competences-v2/me", async (route) => route.fulfill({ json: {
    instruments,
    consistency_flags: ["delegated_autonomy_caps_initial_level_and_mentor_eligibility"],
    is_coach: false
  } }));

  await page.goto("/settings");

  const forexBlock = page.locator(".settings-topic-block").filter({ hasText: "Forex" });
  await expect(forexBlock.getByRole("switch", { name: "Mentorship su Forex" })).toBeDisabled();
  await expect(forexBlock.getByText("Non disponibile per il profilo attuale")).toBeVisible();
});

test("settings treats a missing Forex safety answer as a completable preference", async ({ page }) => {
  const instruments = ["savings_first_steps", "mutual_funds", "etf_funds", "stocks", "bonds", "crypto", "forex", "derivatives"]
    .map((topic) => ({
      topic,
      knowledge_level: topic === "forex" ? "K2" : "K1",
      invested_amount_band: topic === "forex" ? "A3" : "A0",
      wants_to_mentor: false,
      mentor_eligible: false,
      mentor_enabled: false,
      safety_scenario_answer: null,
      safety_scenario_passed: null
    }));
  await page.route("**/api/backend/surveys/competences-v2/me", async (route) => route.fulfill({ json: {
    instruments,
    consistency_flags: [],
    is_coach: false
  } }));

  await page.goto("/settings");

  await expect(page.getByRole("switch", { name: "Mentorship su Forex" })).toBeEnabled();
  await expect(page.getByText("Non risultano ancora strumenti disponibili per la mentorship.")).toHaveCount(0);
});

type EssentialSubmission = { onboarding_policy?: string; D5?: string; section_d?: Record<string, string>; topic_competences_v2?: { instruments: Array<{ topic: string; knowledge_level: string; invested_amount_band: string; wants_to_mentor: boolean }> } };

async function completeContext(page: import("@playwright/test").Page, privateAnswers = false) {
  const responses = { D1: "employee_permanent", D2: "25k_35k", D3: "100_300", D4: "mortgage", D5: "partial" };
  for (const [key, value] of Object.entries(responses)) {
    await page.locator(`input[name="context-${key}"][value="${privateAnswers ? "undisclosed" : value}"]`).check();
    await page.getByRole("button", { name: "Continua", exact: true }).click();
  }
}

test("essential onboarding asks only chosen instruments and submits no generic quiz", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  let submitted: EssentialSubmission = {};
  await page.route("**/api/backend/surveys/onboarding/me/answers", route => {
    submitted = route.request().postDataJSON().answers;
    return route.fulfill({ json: { is_coach: true } });
  });
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Partiamo da te" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.locator(".progress-step")).toHaveCount(0);
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByRole("checkbox", { name: "ETF", exact: true }).check();
  await page.getByRole("checkbox", { name: "Forex", exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  for (const topic of ["etf_funds", "forex"]) {
    await page.locator('input[name="knowledge-' + topic + '"][value="K3"]').check();
    await page.locator('input[name="investment-' + topic + '"][value="A3"]').check();
    await page.locator('input[name="mentor-' + topic + '"][value="yes"]').check();
    if (topic === "forex") await page.getByLabel("La leva può amplificare le perdite fino a esaurire il capitale esposto.").check();
    await page.getByRole("button", { name: "Continua", exact: true }).click();
  }
  await page.getByLabel("Decido in autonomia dopo ricerche personali").check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await completeContext(page);
  await expect(page.getByRole("heading", { name: "Ti riconosci in queste risposte?" })).toBeVisible();
  await page.getByRole("button", { name: "Conferma le risposte" }).click();
  await expect(page.getByRole("heading", { name: "Il tuo punto di partenza è pronto" })).toBeVisible();
  expect(submitted.onboarding_policy).toBe("onboarding-essential-context-2026-09");
  expect(submitted.D5).toBe("independent");
  for (const key of ["D4", "D7", "D8", "D9"]) expect(submitted).not.toHaveProperty(key);
  expect(submitted.section_d).toEqual({ D1: "employee_permanent", D2: "25k_35k", D3: "100_300", D4: "mortgage", D5: "partial" });
  expect(submitted.topic_competences_v2?.instruments).toHaveLength(8);
  expect(submitted.topic_competences_v2?.instruments.find(row => row.topic === "stocks")).toMatchObject({ knowledge_level: "K0", invested_amount_band: "A0", wants_to_mentor: false });
});

test("onboarding zero-experience route has no autonomy or quiz", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  let submitted: EssentialSubmission = {};
  await page.route("**/api/backend/surveys/onboarding/me/answers", route => {
    submitted = route.request().postDataJSON().answers;
    return route.fulfill({ json: { is_coach: false } });
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Scegli almeno" })).toBeVisible();
  await page.getByLabel("Non conosco e non ho mai usato questi strumenti", { exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Situazione professionale" })).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Preferisco non rispondere" })).toBeVisible();
  await completeContext(page, true);
  await expect(page.getByRole("heading", { name: "Ti riconosci in queste risposte?" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "Conferma le risposte" }).click();
  await expect(page.getByRole("heading", { name: "Il tuo punto di partenza è pronto" })).toBeVisible();
  expect(submitted).not.toHaveProperty("D5");
  expect(submitted.section_d).toEqual({ D1: "undisclosed", D2: "undisclosed", D3: "undisclosed", D4: "undisclosed", D5: "undisclosed" });
  expect(submitted.topic_competences_v2?.instruments.every(row => row.knowledge_level === "K0" && row.invested_amount_band === "A0" && !row.wants_to_mentor)).toBe(true);
});

test("onboarding draft survives navigation and never replays retired fields", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  let draft: { answers?: { essential_flow?: { screen?: string } }; updated_at: string } | null = null;
  await page.route("**/api/backend/surveys/onboarding/me/draft", route => {
    if (route.request().method() === "POST") draft = { ...route.request().postDataJSON(), updated_at: new Date().toISOString() };
    return route.fulfill({ json: draft });
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByRole("checkbox", { name: "ETF", exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.locator('input[name="knowledge-etf_funds"][value="K2"]').check();
  await expect.poll(() => draft?.answers?.essential_flow?.screen).toBe("topic:etf_funds");
  await page.goto("/come-funziona");
  await page.goto("/onboarding");
  await expect(page.locator('input[name="knowledge-etf_funds"][value="K2"]')).toBeChecked();
  await expect(page.locator('input[name="investment-etf_funds"]:checked')).toHaveCount(0);
});

test("old essential draft must collect context before final confirmation", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  await page.route("**/api/backend/surveys/onboarding/me/draft", route => route.fulfill({ json: {
    answers: { onboarding_policy: "onboarding-essential-2026-09", essential_flow: {
      answers: { topics: {}, selected: [], selectionConfirmed: true, none: true }, screen: "review",
    } },
  } }));
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Situazione professionale" })).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Conferma le risposte" })).toHaveCount(0);
});

test("financial context draft survives reload without replacing answers with undisclosed", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  let draft: unknown = null;
  await page.route("**/api/backend/surveys/onboarding/me/draft", route => {
    if (route.request().method() === "POST") draft = { ...route.request().postDataJSON(), updated_at: new Date().toISOString() };
    return route.fulfill({ json: draft });
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByLabel("Non conosco e non ho mai usato questi strumenti", { exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.getByLabel("Lavoratore autonomo / freelance", { exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.getByLabel("Tra 25.000 EUR e 35.000 EUR", { exact: true }).check();
  await expect(page.getByRole("status").filter({ hasText: "Bozza salvata" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Tra 25.000 EUR e 35.000 EUR", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Indietro", exact: true }).click();
  await expect(page.getByLabel("Lavoratore autonomo / freelance", { exact: true })).toBeChecked();
});

test("onboarding clears an opt-in after competence becomes ineligible", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "u1", latest_answer_id: null } }));
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByRole("checkbox", { name: "ETF", exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.locator('input[name="knowledge-etf_funds"][value="K2"]').check();
  await page.locator('input[name="investment-etf_funds"][value="A3"]').check();
  await page.locator('input[name="mentor-etf_funds"][value="yes"]').check();
  await page.locator('input[name="knowledge-etf_funds"][value="K1"]').check();
  await expect(page.locator('input[name="mentor-etf_funds"]')).toHaveCount(0);
  await page.locator('input[name="knowledge-etf_funds"][value="K2"]').check();
  await expect(page.locator('input[name="mentor-etf_funds"]:checked')).toHaveCount(0);
});

test("onboarding never restores a draft from another account", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "account-b", latest_answer_id: null } }));
  await page.goto("/dashboard");
  await page.evaluate(() => {
    const old = JSON.stringify({ answers: { D4: {}, section_d: { D2: "gt_75k" } } });
    sessionStorage.setItem("socra_onboarding_draft", old);
    sessionStorage.setItem("socra_onboarding_draft:account-a", old);
  });
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Partiamo da te" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
});

test("completed onboarding cannot be restarted", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Il tuo punto di partenza è pronto" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scegli cosa vuoi imparare" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cominciamo" })).toHaveCount(0);
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
  await expect(page.getByLabel("Stile del confronto (privato)")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(9);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  const contextLabels = await page.getByLabel("Contesto di partenza (privato)").locator("option").allTextContents();
  expect(contextLabels.join(" ")).not.toMatch(/EUR|€/);
});

test("discussion preferences require one choice, cap at three and preserve private legacy context", async ({ page }) => {
  let payload: Record<string, unknown> | null = null;
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: {
    id: "goal-pref", topic_code: "etf_funds", goal_tag_code: "understand_etf", capital_goal: "500_5k",
    risk: "balanced", discussion_types: [],
  }, goals: [], history: [] } }));
  await page.route("**/api/backend/surveys/goal/me", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: "saved-pref", ...payload } });
  });
  await page.goto("/goal");
  await expect(page.getByTestId("goal-selection-summary").first()).toBeVisible();
  await expect(page.getByTestId("goal-selection-summary").first()).not.toBeEmpty();
  await page.getByRole("button", { name: "Aggiorna e vedi i mentor" }).click();
  await expect(page.getByText("Completa tutte le scelte prima di continuare.")).toBeVisible();
  expect(payload).toBeNull();
  for (const name of ["Approfondire un argomento", "Capire il metodo", "Verificare ciò che ho capito"]) {
    await page.getByRole("checkbox", { name, exact: true }).check();
  }
  await expect(page.getByRole("checkbox", { name: "Partire dalle basi", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Capire il metodo", exact: true }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Partire dalle basi", exact: true })).toBeEnabled();
  await page.getByRole("checkbox", { name: "Confrontare approcci diversi", exact: true }).check();
  await page.getByRole("button", { name: "Aggiorna e vedi i mentor" }).click();
  await expect(page).toHaveURL(/matching.*saved-pref/);
  expect(payload).toMatchObject({ discussion_types: ["deepen_topic", "check_understanding", "compare_approaches"], risk: "balanced" });
});

test("discussion selections preload and remain visible in received requests", async ({ page }) => {
  const preferences = { discussion_types: ["clarify_doubts", "concrete_case"], discussion_type_labels: ["Chiarire dubbi", "Confrontarmi su un caso concreto"] };
  const goal = { id: "g1", topic_code: "etf_funds", topic: "ETF", goal_tag_code: "understand_etf", goal_tag: "Capire gli ETF", ...preferences };
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: goal, goals: [], history: [] } }));
  await page.goto("/goal");
  await expect(page.getByRole("checkbox", { name: "Chiarire dubbi", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{
    id: "r-discussion", status: "pending", mentor_id: "u1", mentee_id: "other", initiator_role: "mentee",
    mentor: { user_id: "u1", nickname: "Mentor" }, mentee: { user_id: "other", nickname: "Luca" },
    goal_id: "g1", goal, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString(),
    alignment_message: "Vorrei chiarire i costi confrontando due esempi concreti.",
  }] }));
  await page.goto("/requests");
  await expect(page.getByText("Chiarire dubbi", { exact: true })).toBeVisible();
  await expect(page.getByText("Confrontarmi su un caso concreto", { exact: true })).toBeVisible();
});

test("L4 goal flow uses the advanced catalog and keeps V2 topics coherent", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => route.fulfill({ json: {
    user_id: "u-l4",
    level: "L4",
    is_coach: true,
    latest_answer_id: "a-l4",
    competence_v2_completed: true
  } }));
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({ json: {
    current: null,
    active_goal: null,
    goals: [],
    history: []
  } }));

  await page.goto("/goal");
  await expect(page.getByText("L4", { exact: true })).toHaveCount(0);
  const topic = page.getByLabel("Tema");
  await expect(topic).toBeVisible();
  const topicValues = await topic.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(topicValues).toContain("mutual_funds");
  expect(topicValues).toContain("forex");
  expect(topicValues).toContain("derivatives");
  expect(topicValues).not.toContain("planning");
  expect(topicValues).not.toContain("taxation");

  await topic.selectOption("mutual_funds");
  await expect(page.getByLabel("Risultato di apprendimento").locator('option[value="analyze_mutual_funds"]')).toHaveText("Approfondire criteri di analisi dei fondi comuni");
  await topic.selectOption("forex");
  await expect(page.getByLabel("Risultato di apprendimento").locator('option[value="forex_risk_management"]')).toHaveText("Studiare il rischio operativo nel Forex");
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
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invia", exact: true })).toBeDisabled();
  await page.getByLabel("Il tuo messaggio", { exact: true }).fill("Vorrei capire come funziona un primo PAC in ETF.");
  await page.getByRole("button", { name: "Invia", exact: true }).click();
  expect(requestPayload).toEqual({ mentor_id: "mentor1", goal_id: "g1", alignment_message: "Vorrei capire come funziona un primo PAC in ETF." });
  await expect(page.getByRole("status").filter({ hasText: "48 ore per rispondere" })).toBeVisible();
});

test("V3 discovery acknowledges visible receipts, not every fetched profile", async ({ page }) => {
  const seen: string[] = [];
  await page.route("**/api/backend/matching/candidates", (route) => route.fulfill({ json: Array.from({ length: 10 }, (_, index) => ({
    mentor_id: `visible-${index}`, nickname: `Mentor ${index}`, level: "L2", path_cost: 1,
    match_score: 84, is_recommended: true, reason_summary: "Esperienza pertinente al tuo obiettivo.", discovery_offer_id: `receipt-${index}`,
  })) }));
  await page.route("**/api/backend/matching/discovery/impressions", (route) => {
    seen.push(...route.request().postDataJSON().offer_ids);
    return route.fulfill({ json: { recorded: 1, expired: 0, already_recorded: 0 } });
  });
  await page.goto("/matching");
  await page.locator('[data-discovery-offer="receipt-0"]').scrollIntoViewIfNeeded();
  await expect.poll(() => seen.includes("receipt-0")).toBe(true);
  expect(seen).not.toContain("receipt-9");
  await page.locator('[data-discovery-offer="receipt-9"]').scrollIntoViewIfNeeded();
  await expect.poll(() => seen.includes("receipt-9")).toBe(true);
  expect(seen.filter((id) => id === "receipt-0")).toHaveLength(1);
});

test("V3 mentor proposal requires the same alignment message", async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await page.route("**/api/backend/matching/requests/me?role=mentor", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/matching/mentee-candidates", (route) => route.fulfill({ json: [{
    mentee_id: "learner", nickname: "Luca", goal_id: "learn", goal_tag: "Capire gli ETF", goal_topic: "ETF",
    level: "L0", match_score: 79, is_recommended: false, reason_summary: "Puoi condividere la tua esperienza su ETF.",
  }] }));
  await page.route("**/api/backend/matching/proposals", (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({ json: { id: "proposal", status: "pending", initiator_role: "mentor", goal_id: "learn" } });
  });
  await page.goto("/matching/mentees");
  await page.getByRole("button", { name: "Proponi un percorso" }).click();
  await page.getByLabel("Il tuo messaggio", { exact: true }).fill("Posso condividere i miei primi passi con un PAC in ETF.");
  await page.getByRole("button", { name: "Invia", exact: true }).click();
  await expect(page.getByRole("button", { name: "Proposta inviata" })).toBeVisible();
  expect(sent).toMatchObject({ mentee_id: "learner", goal_id: "learn", alignment_message: "Posso condividere i miei primi passi con un PAC in ETF." });
});

test("V3 alternative needs an explicit goal replacement confirmation", async ({ page }) => {
  let chosen: Record<string, unknown> | null = null;
  await page.route("**/api/backend/matching/alternatives?**", (route) => route.fulfill({ json: [{
    topic: "mutual_funds", goal_tag: "understand_mutual_funds", topic_label: "Fondi comuni", goal_label: "Capire i fondi comuni",
    message: "È un obiettivo diverso: non soddisfa il bisogno originale.",
  }] }));
  await page.route("**/api/backend/matching/alternatives/choose", (route) => {
    chosen = route.request().postDataJSON();
    return route.fulfill({ json: { goal_id: "new-goal" } });
  });
  await page.goto("/matching");
  await page.getByRole("button", { name: "Capire i fondi comuni · Fondi comuni" }).click();
  await expect(page.getByRole("button", { name: "Conferma nuovo obiettivo" })).toBeDisabled();
  expect(chosen).toBeNull();
  await page.getByRole("checkbox", { name: /Voglio sostituire/ }).check();
  await page.getByRole("button", { name: "Conferma nuovo obiettivo" }).click();
  await expect(page).toHaveURL(/goalId=new-goal/);
  expect(chosen).toMatchObject({ goal_id: "g1", topic: "mutual_funds", confirm: true });
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
  }, {
    mentor_id: "mentor-other", nickname: "Altro mentor", match_score: 76,
    is_recommended: false, reason_summary: "In linea con il tuo obiettivo.", public_badges: []
  }] }));

  await page.goto("/matching?goalId=g1");

  const requested = page.getByRole("button", { name: "Richiesta inviata" });
  await expect(requested).toBeVisible();
  await expect(requested).toBeDisabled();
  await expect(page.getByRole("button", { name: "Un’altra proposta è in attesa" })).toBeDisabled();
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
    mentor: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
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
  await page.getByRole("button", { name: "Accetta" }).click();
  await expect(page.getByRole("dialog")).toContainText("Vuoi accettare e aprire questo percorso?");
  await page.getByRole("button", { name: "Conferma", exact: true }).click();

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
    mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
    mentor: { user_id: "mentor1", nickname: "Anna", level: "L2", is_coach: true },
    goal: { id: "g1", topic: "etf_funds", goal_tag: "understand_etf", is_active: true }
  }] }));
  await page.route("**/api/backend/matching/requests/mentor-proposal/respond", async (route) => {
    responseCalled = true;
    await route.fulfill({ json: { id: "mentor-proposal", status: "open" } });
  });

  await page.goto("/requests?tab=received");
  await expect(page.getByText(/Costo all.accettazione: 2 crediti/)).toBeVisible();
  await page.getByRole("button", { name: "Accetta" }).click();
  await expect(page.getByRole("dialog")).toContainText("Il percorso costerà 2 crediti");
  await expect(page.getByRole("dialog")).toContainText("Crediti disponibili: 10");
  await page.getByRole("button", { name: "Annulla", exact: true }).click();
  expect(responseCalled).toBe(false);
});

test("mentor opt-out blocks pending response actions", async ({ page }) => {
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: {
    id: "u1",
    username: "mentee",
    email: "mentee@example.com",
    nickname: "Apprendista",
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
    mentor: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: false }
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
    mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
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

  await expect(page.getByText("Argomenti su cui può aiutare", { exact: true })).toBeVisible();
  await expect(page.getByText("Competenze principali", { exact: true })).toHaveCount(0);
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
      mentor: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true }
    },
    {
      id: "mentee-path",
      status: "feedback_pending",
      mentee_id: "u1",
      mentor_id: "u3",
      goal_id: "g2",
      goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
      mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
      mentor: { user_id: "u3", nickname: "Anna", level: "L2", is_coach: true }
    }
  ] }));

  await page.goto("/paths?tab=mentee");
  await expect(page.getByRole("tab", { name: /Come apprendista/ })).toBeVisible();
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
    mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
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
  await page.route("**/api/backend/calls/capabilities", route => route.fulfill({ json: { google_meet_available: false } }));
  let pathState = {
    id: "path-1",
    status: "open",
    mentee_id: "u1",
    mentor_id: "u3",
    goal_id: "g2",
    goal: { id: "g2", topic: "etf_funds", goal_tag: "mentee_goal", is_active: true },
    mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
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
  await expect(page.getByText(/Google Meet integrato non è disponibile/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepara Google Meet" })).toHaveCount(0);
  await expect(page.getByText(/Puoi chiudere il tuo lato dopo che la prima sessione/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Chiudi il mio lato" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Lascia feedback sul mentor" })).toHaveCount(0);

  pathState = { ...pathState, first_call_completed: true };
  await page.reload();
  await expect(page.getByRole("button", { name: "Chiudi il mio lato" })).toBeVisible();
  await expect(page.getByText(/Non sono necessarie altre azioni per questa verifica/)).toBeVisible();
  await expect(page.getByText(/Google Meet integrato non è disponibile/)).toHaveCount(0);
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
    mentee: { user_id: "u1", nickname: "Apprendista", level: "L1", is_coach: true },
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
