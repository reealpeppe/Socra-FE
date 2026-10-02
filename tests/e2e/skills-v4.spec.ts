import { expect, test, type Locator, type Page } from "@playwright/test";
import type { OwnProfile, UserMe } from "../../lib/types";

const user: UserMe = { id: "u1", username: "giulia_skills", email: "giulia@example.com", nickname: "Giulia", level: "L0", is_coach: true, role: "user", account_status: "active", email_verified: true, email_verification_required: true, email_delivery_enabled: false };
const ownProfile: OwnProfile = { user_id: "u1", username: user.username, first_name: "Giulia", last_name: "Rossi", nickname: "Giulia", bio: null, avatar_url: null };

const catalog = {
  version: "skills-v1", max_objectives: 3,
  topics: [{ code: "etf_funds", label: "ETF", skills: [
    { code: "etf_read", label: "Leggere la scheda di un ETF" },
    { code: "etf_compare", label: "Confrontare due ETF" },
    { code: "etf_plan", label: "Costruire un piano periodico" },
    { code: "etf_rebalance", label: "Ribilanciare un portafoglio" },
  ] }, { code: "stocks", label: "Azioni", skills: [{ code: "stock_read", label: "Leggere un bilancio" }] }],
  discussion_modes: [
    { code: "step_by_step", label: "Guidami passo passo", description: "Un passaggio alla volta." },
    { code: "concrete_case", label: "Lavoriamo su un caso concreto", description: "Partiamo da un esempio." },
    { code: "review_work", label: "Rivediamo quello che ho già fatto", description: "Rileggiamo il tuo lavoro." },
  ],
};
const context = { D1: "undisclosed", D2: "undisclosed", D3: "undisclosed", D4: "undisclosed", D5: "undisclosed" };
const goal = { id: "g1", topic: "ETF", topic_code: "etf_funds", goal_tag: "Leggere la scheda di un ETF", is_active: true, skill_model: true,
  objective_codes: ["etf_read", "etf_compare", "etf_plan"], objective_labels: ["Leggere la scheda di un ETF", "Confrontare due ETF", "Costruire un piano periodico"], discussion_mode: "step_by_step", discussion_mode_label: "Guidami passo passo" };
const candidate = { mentor_id: "mentor", nickname: "Marta", path_cost: 1, is_recommended: true, match_score: 84, reason_summary: "Due attività in comune.", skill_model: true,
  availability_fallback: true, covered_objective_codes: ["etf_read", "etf_compare"], covered_objective_labels: goal.objective_labels.slice(0, 2), missing_objective_codes: ["etf_plan"], missing_objective_labels: [goal.objective_labels[2]], coverage_count: 2, requested_count: 3 };
const preparation = { topic: "etf_funds", label: "ETF", known_count: 3, confirmed_count: 1, preparation_percent: 75, offered_count: 2, total_count: 4, coverage_percent: 50, skills: [{ code: "etf_read", label: "Leggere la scheda di un ETF", source: "path" }, { code: "etf_compare", label: "Confrontare due ETF", source: "declared" }] };
const path = { id: "p1", status: "feedback_pending", mentee_id: "u1", mentor_id: "mentor", goal_id: "g1", first_call_completed: true, mentee_closed_at: "2026-10-01T10:00:00Z", mentor_closed_at: null,
  goal, skill_model: true, agreed_objective_codes: ["etf_read", "etf_compare"], agreed_objective_labels: goal.objective_labels.slice(0, 2), discussion_mode_label: "Guidami passo passo" };

test.beforeEach(async ({ page, context: browser, baseURL }) => {
  await browser.addCookies([{ name: "socra_session", value: "skills-test", url: baseURL!, httpOnly: true }]);
  await page.route("**/api/backend/**", async route => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace("/api/backend", "");
    const data: Record<string, unknown> = {
      "/auth/me": user, "/profiles/me": ownProfile,
      "/skills/catalog": catalog, "/skills/me": { version: 1, known_skills: [], mentor_skills: [], section_d: context, mentor_available: true },
      "/surveys/onboarding/me": { user_id: "u1", latest_answer_id: "done" },
      "/surveys/onboarding/me/draft": null, "/notifications/me": [], "/wallet/me": { balance: 2, debt: 0 },
      "/goals/me": { current: goal, goals: [goal] }, "/paths/me": [], "/paths/p1": path,
      "/matching/candidates": [candidate], "/matching/requests/me": [],
      "/calls/capabilities": { google_meet_available: false },
      "/profiles/u1": { skill_model: true, user_id: "u1", nickname: "Giulia", completed_paths: 0, public_badges: [], top_topics: ["ETF"], aggregate_metrics: {}, path_cost: 1, is_coach: true, skill_groups: [preparation], public_reviews: [], mentor_started_paths: 0, mentor_completion_rate: null },
      "/profiles/mentor": { skill_model: true, user_id: "mentor", nickname: "Marta", completed_paths: 2, public_badges: [], top_topics: ["ETF"], aggregate_metrics: {}, path_cost: 1, is_coach: true,
        skill_groups: [preparation],
        mentor_completion_rate: 50, mentor_started_paths: 4,
        public_reviews: [{ id: "r1", author_id: "learner", author_name: "Luca", comment: "Avrei preferito più esempi <script>alert(1)</script>", created_at: "2026-10-01T10:00:00Z", topic_label: "ETF", objective_labels: ["Leggere la scheda di un ETF"] }] },
    };
    await route.fulfill({ json: Object.hasOwn(data, p) ? data[p] : [] });
  });
});

async function privateContext(page: Page) {
  for (const key of ["D1", "D2", "D3", "D4", "D5"]) await page.locator(`select[name="${key}"]`).selectOption("undisclosed");
}

test("survey removes offered skill when knowledge is removed and submits explicit empty profile", async ({ page }, testInfo) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/skills/me", route => {
    if (route.request().method() === "PUT") { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...sent, version: 1, mentor_available: false } }); }
    return route.fulfill({ json: null });
  });
  await page.goto("/onboarding");
  await page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true }).check();
  await page.getByRole("checkbox", { name: "Posso aiutare: Leggere la scheda di un ETF", exact: true }).check();
  await page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Posso aiutare: Leggere la scheda di un ETF", exact: true })).not.toBeChecked();
  await expect(page.locator('select[name="D1"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("survey.png"), fullPage: true });
  await page.getByRole("checkbox", { name: "Confermo le attività indicate, anche se non ne ho selezionata nessuna." }).check();
  await page.getByRole("button", { name: "Conferma le risposte" }).click();
  await expect(page.getByRole("link", { name: "Scegli cosa imparare" })).toBeVisible();
  expect(sent).toMatchObject({ known_skills: [], mentor_skills: [] });
  expect(sent).not.toHaveProperty("section_d");
});

test("goal limits objectives to three, clears them when topic changes and submits one mode", async ({ page }, testInfo) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: null, goals: [] } }));
  await page.route("**/api/backend/surveys/goal/me", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...goal, id: "new" } }); });
  await page.goto("/goal");
  await page.getByLabel("Tema", { exact: true }).selectOption("etf_funds");
  for (const text of goal.objective_labels) await page.getByRole("checkbox", { name: text, exact: true }).check();
  await page.getByRole("checkbox", { name: "Ribilanciare un portafoglio", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Ribilanciare un portafoglio", exact: true })).not.toBeChecked();
  await page.getByLabel("Tema", { exact: true }).selectOption("stocks");
  await page.getByRole("checkbox", { name: "Leggere un bilancio", exact: true }).check();
  await page.getByRole("radio", { name: "Guidami passo passo", exact: true }).check();
  await page.getByRole("radio", { name: "Lavoriamo su un caso concreto", exact: true }).check();
  await page.screenshot({ path: testInfo.outputPath("obiettivi.png"), fullPage: true });
  await page.getByRole("button", { name: "Salva e continua" }).click();
  await expect(page).toHaveURL(/tour/);
  expect(sent).toEqual({ topic: "stocks", objective_codes: ["stock_read"], discussion_mode: "concrete_case" });
});

test("partial matching requires an explicit covered subset in the request", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/matching/requests", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { id: "r2" } }); });
  await page.goto("/matching");
  const goalSummary = page.getByRole("complementary").filter({ hasText: "Obiettivo attivo" });
  await expect(goalSummary.getByRole("heading", { name: "ETF", exact: true })).toBeVisible();
  await expect(goalSummary.getByText("Cosa vuoi imparare", { exact: true })).toBeVisible();
  await expect(goalSummary.getByText("Come vuoi lavorare", { exact: true })).toBeVisible();
  await expect(page.getByText("84%", { exact: true })).toBeVisible();
  await expect(page.getByText("Disponibilità limitata", { exact: true })).toHaveCount(0);
  await page.getByText("Su cosa potete lavorare", { exact: true }).click();
  await expect(page.getByText("2 di 3 obiettivi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Invia richiesta al mentor", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("checkbox", { name: "Leggere la scheda di un ETF", exact: true })).not.toBeChecked();
  await dialog.getByRole("checkbox", { name: "Confrontare due ETF", exact: true }).check();
  await dialog.getByLabel("Il tuo messaggio").fill("Vorrei confrontare questi due ETF insieme a te.");
  await dialog.getByRole("checkbox", { name: /email/ }).check();
  await dialog.getByRole("button", { name: "Invia", exact: true }).click();
  await expect(page.getByText(/Richiesta inviata/).first()).toBeVisible();
  expect(sent).toMatchObject({ agreed_objective_codes: ["etf_compare"], goal_id: "g1" });
});

test("learner feedback records every objective and keeps public comment separate", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/feedback/p1/mentee", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: {} }); });
  await page.goto("/feedback/p1/mentee");
  await page.getByLabel("Risultato: Leggere la scheda di un ETF", { exact: true }).selectOption("yes");
  await page.getByLabel("Sai aiutare: Leggere la scheda di un ETF", { exact: true }).selectOption("yes");
  await page.getByRole("checkbox", { name: "Offri: Leggere la scheda di un ETF", exact: true }).check();
  await page.getByLabel("Risultato: Confrontare due ETF", { exact: true }).selectOption("partly");
  await page.getByLabel("Chiarezza del confronto").selectOption("clear");
  await page.getByLabel("Rifaresti questo percorso?").selectOption("yes");
  await page.getByLabel("Hai ricevuto proposte commerciali esterne?").selectOption("no");
  await page.getByLabel("Commento pubblico facoltativo").fill("Utile, ma avrei voluto più esempi pratici.");
  await page.getByRole("button", { name: "Invia feedback" }).click();
  await expect(page).toHaveURL(/paths\/p1/);
  expect(sent).toMatchObject({ answers: { objective_outcomes: [{ code: "etf_read", result: "yes", can_help: "yes", share_skill: true }, { code: "etf_compare", result: "partly", can_help: null, share_skill: false }], clarity: "clear", would_repeat: "yes", external_promotion: false }, public_comment: "Utile, ma avrei voluto più esempi pratici." });
});

test("profile separates preparation from offered skills and displays critical reviews", async ({ page }, testInfo) => {
  let reason = "";
  await page.route("**/api/backend/skills/reviews/r1/report", route => { reason = route.request().postDataJSON().reason; return route.fulfill({ json: {} }); });
  await page.goto("/profiles/mentor");
  await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "3");
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await expect(page.getByText("2 dichiarate · 1 confermata nei percorsi", { exact: true })).toBeVisible();
  await expect(page.getByText("2 attività offerte", { exact: true })).toBeVisible();
  await expect(page.getByText("84%", { exact: true })).toBeVisible();
  await expect(page.getByText("Avrei preferito più esempi <script>alert(1)</script>", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("profilo.png"), fullPage: true });
  await page.getByRole("button", { name: "Segnala commento" }).click();
  await page.getByLabel("Motivo della segnalazione").fill("Contiene informazioni che preferirei venissero verificate.");
  await page.getByRole("button", { name: "Invia segnalazione" }).click();
  await expect(page.getByText("Segnalazione inviata.", { exact: true })).toBeVisible();
  expect(reason).toContain("informazioni");
});

test("settings changes offered skills while retaining a global pause", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  const profile = { version: 1, known_skills: ["etf_read", "etf_compare"], mentor_skills: ["etf_read"], section_d: context, mentor_available: false };
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { ...user, is_coach: false } }));
  await page.route("**/api/backend/skills/me", route => {
    if (route.request().method() === "PUT") { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...profile, ...sent, version: 2 } }); }
    return route.fulfill({ json: profile });
  });
  await page.goto("/settings");
  await page.getByRole("checkbox", { name: "Offri: Confrontare due ETF", exact: true }).check();
  await page.getByRole("button", { name: "Salva capacità offerte" }).click();
  await expect(page.getByRole("switch", { name: "Disponibilità come mentor", exact: true })).not.toBeChecked();
  await expect(page.getByText("Capacità offerte aggiornate.", { exact: true })).toBeVisible();
  expect(sent).toMatchObject({ known_skills: ["etf_read", "etf_compare"], mentor_skills: ["etf_read", "etf_compare"] });
  expect(sent).not.toHaveProperty("section_d");
});

test("skill draft restores on reload and is isolated from another account", async ({ page }) => {
  await page.route("**/api/backend/skills/me", route => route.fulfill({ json: null }));
  await page.goto("/onboarding");
  await page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true }).check();
  await page.getByRole("checkbox", { name: "Posso aiutare: Leggere la scheda di un ETF", exact: true }).check();
  await expect(page.getByText("Bozza salvata", { exact: true })).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Posso aiutare: Leggere la scheda di un ETF", exact: true })).toBeChecked();
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "other-account", latest_answer_id: null } }));
  page.once("dialog", dialog => dialog.accept());
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true })).not.toBeChecked();
  await expect(page.locator('select[name="D1"]')).toHaveCount(0);
});

test("mentor proposal sends only the explicitly selected covered objectives", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/matching/mentee-candidates", route => route.fulfill({ json: [{ ...candidate, mentee_id: "learner", goal_id: "g1", goal_topic: "ETF", goal_tag: goal.goal_tag, objective_labels: goal.objective_labels, discussion_mode_label: goal.discussion_mode_label }] }));
  await page.route("**/api/backend/matching/proposals", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...sent, id: "offer", status: "pending", initiator_role: "mentor" } }); });
  await page.goto("/matching/mentees");
  await expect(page.getByText("84%", { exact: true })).toBeVisible();
  await expect(page.getByText("Disponibilità limitata", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Proponi un percorso", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Leggere la scheda di un ETF", exact: true }).check();
  await dialog.getByLabel("Il tuo messaggio").fill("Ti propongo di leggere insieme una scheda ETF.");
  await dialog.getByRole("checkbox", { name: /email/ }).check();
  await dialog.getByRole("button", { name: "Invia", exact: true }).click();
  await expect(page.getByText(/Proposta inviata a/)).toBeVisible();
  expect(sent).toMatchObject({ agreed_objective_codes: ["etf_read"], mentee_id: "learner" });
});

test("request from public profile retains explicit task agreement", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/matching/requests", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { id: "profile-request" } }); });
  await page.goto("/profiles/mentor");
  await page.getByRole("button", { name: "Invia richiesta al mentor", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Invia", exact: true })).toBeDisabled();
  await dialog.getByRole("checkbox", { name: "Confrontare due ETF", exact: true }).check();
  await dialog.getByLabel("Il tuo messaggio").fill("Vorrei approfondire con te i costi dei due ETF.");
  await dialog.getByRole("checkbox", { name: /email/ }).check();
  await dialog.getByRole("button", { name: "Invia", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(sent).toMatchObject({ agreed_objective_codes: ["etf_compare"], mentor_id: "mentor" });
});

test("requests and path render agreed snapshots rather than current goal objectives", async ({ page }) => {
  const snapshot = { skill_model: true, agreed_objective_codes: ["etf_read"], agreed_objective_labels: ["Attività concordata in precedenza"], discussion_mode_label: "Guidami passo passo" };
  await page.route("**/api/backend/matching/requests/me?**", route => route.fulfill({ json: [{ ...snapshot, id: "accepted", status: "accepted", mentor_id: "mentor", mentee_id: "u1", initiator_role: "mentee", goal_id: "g1", path_id: "p1", goal, expires_at: "2099-01-01T00:00:00Z", mentor: { nickname: "Marta" }, email_sharing_accepted: true }] }));
  await page.route("**/api/backend/paths/p1", route => route.fulfill({ json: { ...path, ...snapshot } }));
  await page.goto("/requests?tab=sent");
  await expect(page.getByText("Attività concordata in precedenza", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Apri il percorso", exact: true }).click();
  await expect(page.getByText("Attività concordata in precedenza", { exact: true })).toBeVisible();
  await expect(page.getByText("Confrontare due ETF", { exact: true })).toHaveCount(0);
});

test("request agreement copy follows recipient role and request state", async ({ page }) => {
  const base = { skill_model: true, agreed_objective_codes: ["etf_read"], agreed_objective_labels: ["Leggere la scheda di un ETF"], discussion_mode_label: "Guidami passo passo", mentor_id: "mentor", mentee_id: "u1", initiator_role: "mentee", goal_id: "g1", goal, expires_at: "2099-01-01T00:00:00Z", email_sharing_accepted: true };
  await page.route("**/api/backend/matching/requests/me?**", route => route.fulfill({ json: [
    ...["pending", "accepted", "rejected", "expired"].map(status => ({ ...base, id: status, status, mentor: { nickname: status } })),
    { ...base, id: "received", status: "pending", initiator_role: "mentor", mentor: { nickname: "Proposta ricevuta" } },
  ] }));
  await page.goto("/requests?tab=sent");
  const row = (name: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(row("pending").getByText("Hai proposto queste attività. Il destinatario potrà accettare l’intero elenco.", { exact: true })).toBeVisible();
  await expect(row("accepted").getByText("La richiesta è stata accettata: queste sono le attività concordate per il percorso.", { exact: true })).toBeVisible();
  await expect(row("rejected").getByText("La richiesta è stata rifiutata. Questo elenco conserva le attività proposte.", { exact: true })).toBeVisible();
  await expect(row("expired").getByText("La richiesta è scaduta. Questo elenco conserva le attività proposte.", { exact: true })).toBeVisible();
  await expect(page.getByText("Accettando confermi tutte le attività di questo elenco.", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: /Ricevute/ }).click();
  await expect(page.getByText("Accettando confermi tutte le attività di questo elenco.", { exact: true })).toBeVisible();
});

test("mentor feedback sends outcomes without learner growth or public review fields", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { ...user, id: "mentor", username: "marta_skills", email: "marta@example.com", nickname: "Marta" } }));
  await page.route("**/api/backend/paths/p1", route => route.fulfill({ json: { ...path, mentor_closed_at: "2026-10-02T10:00:00Z" } }));
  await page.route("**/api/backend/feedback/p1/mentor", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: {} }); });
  await page.goto("/feedback/p1/mentor");
  await page.getByLabel("Risultato: Leggere la scheda di un ETF", { exact: true }).selectOption("yes");
  await page.getByLabel("Risultato: Confrontare due ETF", { exact: true }).selectOption("partly");
  await page.getByLabel("Partecipazione dell’apprendista").selectOption("active");
  await page.getByLabel("Nota privata facoltativa").fill("Ottima partecipazione alla sessione.");
  await page.getByRole("button", { name: "Invia feedback" }).click();
  await expect(page).toHaveURL(/paths\/p1/);
  expect(sent).toEqual({ answers: { objective_outcomes: [{ code: "etf_read", result: "yes" }, { code: "etf_compare", result: "partly" }], engagement: "active" }, text_note: "Ottima partecipazione alla sessione." });
});

test("experience saves only skills and returns to dashboard with confirmation", async ({ page }) => {
  let sent: Record<string, unknown> | undefined;
  const profile = { version: 1, known_skills: ["etf_read", "etf_compare", "etf_plan"], mentor_skills: ["etf_read"], section_d: context, mentor_available: false };
  await page.route("**/api/backend/skills/me", route => {
    if (route.request().method() === "PUT") { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...profile, ...sent, version: 2 } }); }
    return route.fulfill({ json: profile });
  });
  await page.goto("/competenze");
  await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "3");
  await expect(page.getByText("2 dichiarate · 1 confermata nei percorsi", { exact: true })).toBeVisible();
  await expect(page.locator('select[name="D1"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "So: Costruire un piano periodico", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Confermo le attività indicate, anche se non ne ho selezionata nessuna." }).check();
  await page.getByRole("button", { name: "Conferma le risposte" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("status").filter({ hasText: "La tua esperienza è stata aggiornata." })).toBeVisible();
  expect(sent).toMatchObject({ known_skills: ["etf_read", "etf_compare"], mentor_skills: ["etf_read"] });
  expect(sent).not.toHaveProperty("section_d");
});

test("personal context is optional and saves through its own endpoint", async ({ page }) => {
  const profile = { version: 1, known_skills: ["etf_read"], mentor_skills: [], section_d: {}, mentor_available: false };
  let sent: Record<string, unknown> | undefined;
  let skillWrites = 0;
  await page.route("**/api/backend/skills/me", route => {
    if (route.request().method() !== "GET") skillWrites++;
    return route.fulfill({ json: profile });
  });
  await page.route("**/api/backend/skills/me/context", route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { ...profile, section_d: context, version: 2 } }); });
  await page.goto("/settings");
  await page.getByText("Contesto personale", { exact: true }).click();
  await expect(page.locator('select[name="D1"]')).toHaveValue("");
  await expect(page.getByRole("button", { name: "Salva contesto personale" })).toBeDisabled();
  await privateContext(page);
  await page.getByRole("button", { name: "Salva contesto personale" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Contesto personale aggiornato." })).toBeVisible();
  expect(sent).toEqual({ section_d: context, idempotency_key: expect.any(String) });
  expect(skillWrites).toBe(0);
});

test("context with no skill profile directs to experience without creating a profile", async ({ page }) => {
  await page.route("**/api/backend/skills/me", route => route.fulfill({ json: null }));
  await page.goto("/settings");
  await page.getByText("Contesto personale", { exact: true }).click();
  await expect(page.getByText(/Prima completa la tua esperienza/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Salva contesto personale" })).toHaveCount(0);
});

test("dashboard shows explicit objectives, preparation and mentor paths while paused", async ({ page }) => {
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { ...user, is_coach: false } }));
  await page.goto("/dashboard");
  const learning = page.getByRole("region", { name: "Il tuo percorso di apprendimento" });
  await expect(learning.getByText("ETF", { exact: true })).toBeVisible();
  await expect(learning.getByText("3 obiettivi", { exact: true })).toBeVisible();
  for (const label of goal.objective_labels) await expect(learning.getByText(label, { exact: true })).toBeVisible();
  const smallGoal = page.getByRole("region", { name: "Il tuo obiettivo" });
  await expect(smallGoal.getByText("3 obiettivi", { exact: true })).toBeVisible();
  await expect(smallGoal.getByText("e altri 2 obiettivi", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "3");
  await expect(page.getByRole("link", { name: "Vedi i percorsi" })).toHaveAttribute("href", "/paths?tab=mentor");
});

async function expectHorizontalContainment(locator: Locator) {
  const clipped = await locator.evaluateAll(elements => elements.flatMap(element => {
    let left = 0;
    let right = document.documentElement.clientWidth;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (["hidden", "clip", "auto", "scroll"].includes(getComputedStyle(parent).overflowX)) {
        const box = parent.getBoundingClientRect();
        left = Math.max(left, box.left); right = Math.min(right, box.right);
      }
    }
    const boxes = [element.getBoundingClientRect()];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent?.trim() || walker.currentNode.parentElement?.closest('[aria-hidden="true"]')) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      boxes.push(...Array.from(range.getClientRects()));
    }
    return boxes.some(box => box.width > 0 && (box.left < left - 1 || box.right > right + 1))
      ? [`${element.tagName}: ${element.textContent?.trim().slice(0, 90)}`] : [];
  }));
  expect(clipped, "Elements and text must fit the viewport and clipping ancestors").toEqual([]);
}

for (const username of ["qa.release.6f51e4f909ba", "q".repeat(80)]) {
  test(`long identity remains readable on dashboard and settings (${username.length} characters)`, async ({ page }) => {
    const email = `${username.slice(0, 64)}@example.invalid`;
    await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { ...user, username, nickname: username, email, is_coach: false } }));
    await page.route("**/api/backend/profiles/me", route => route.fulfill({ json: { ...ownProfile, username, nickname: username } }));
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(username);
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expectHorizontalContainment(page.locator("main h1, main header > div, main section[aria-labelledby], main section a, main progress, main progress + small"));
    await page.goto("/settings");
    await expect(page.getByRole("textbox", { name: "Username", exact: true })).toHaveValue(username);
    await page.getByText("Contesto personale", { exact: true }).click();
    await expect(page.locator('select[name="D1"]')).toBeVisible();
    await expectHorizontalContainment(page.locator(".settings-page > .card, .settings-profile-name, .settings-field-value, #personal-context, #personal-context select"));
  });
}

test("dashboard active paths show agreed snapshots even when the goal changes", async ({ page }) => {
  await page.route("**/api/backend/paths/me", route => route.fulfill({ json: [{ ...path, agreed_objective_labels: ["Obiettivo già concordato"] }] }));
  await page.goto("/dashboard");
  const learning = page.getByRole("region", { name: "Il tuo percorso di apprendimento" });
  await expect(learning.getByText("Obiettivo già concordato", { exact: true })).toBeVisible();
  await expect(learning.getByText("Confrontare due ETF", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Vedi i percorsi" }).click();
  await expect(page.getByRole("tab", { name: "Come mentor (0)" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Come apprendista (1)" }).click();
  await expect(page.getByRole("link").filter({ hasText: "Obiettivo già concordato" })).toBeVisible();
  await expect(page.getByText("Confrontare due ETF", { exact: true })).toHaveCount(0);
});

test("preparation remains visible when no known skills are offered", async ({ page }) => {
  await page.route("**/api/backend/profiles/mentor", route => route.fulfill({ json: { skill_model: true, user_id: "mentor", nickname: "Marta", completed_paths: 0, public_badges: [], top_topics: [], aggregate_metrics: {}, is_coach: false, skill_groups: [{ ...preparation, offered_count: 0, coverage_percent: 0, skills: [] }], public_reviews: [], mentor_started_paths: 0, mentor_completion_rate: null } }));
  await page.goto("/profiles/mentor");
  await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "3");
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await expect(page.getByText("Nessuna attività offerta su questo argomento.", { exact: true })).toBeVisible();
});

for (const boundary of ["unmount", "session-change", "final-submit"] as const) {
  test(`queued skill writes are discarded after ${boundary}`, async ({ page, context: browser, baseURL }) => {
    await page.route("**/api/backend/skills/me", route => route.fulfill({ json: null }));
    await page.route("**/api/backend/surveys/competences-v2/me", route => route.fulfill({ json: null }));
    let releaseFirst!: () => void;
    const pendingFirst = new Promise<void>(resolve => { releaseFirst = resolve; });
    const writes: Array<{ cookie: string; method: string; body: unknown }> = [];
    await page.route("**/api/backend/surveys/onboarding/me/draft", async route => {
      if (route.request().method() !== "POST") return route.fulfill({ json: null });
      const headers = await route.request().allHeaders();
      writes.push({ cookie: headers.cookie || "", method: "POST", body: route.request().postDataJSON() });
      if (writes.length === 1) await pendingFirst;
      await route.fulfill({ json: {} });
    });
    await page.route("**/api/backend/skills/me", async route => {
      if (route.request().method() === "PUT") {
        const headers = await route.request().allHeaders();
        writes.push({ cookie: headers.cookie || "", method: "PUT", body: route.request().postDataJSON() });
        return route.fulfill({ json: { version: 1, known_skills: [], mentor_skills: [], section_d: context, mentor_available: false } });
      }
      return route.fulfill({ json: null });
    });
    await page.goto("/onboarding");
    await expect(page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true })).toBeVisible();
    await page.clock.install();
    await page.getByRole("checkbox", { name: "So: Leggere la scheda di un ETF", exact: true }).check();
    await page.clock.fastForward(750);
    await expect.poll(() => writes.length).toBe(1);
    await page.getByRole("checkbox", { name: "So: Confrontare due ETF", exact: true }).check();
    await page.clock.fastForward(750);
    if (boundary === "final-submit") {
      await page.getByRole("checkbox", { name: "Confermo le attività indicate, anche se non ne ho selezionata nessuna." }).check();
      await page.getByRole("button", { name: "Conferma le risposte" }).click();
    }
    if (boundary !== "session-change") {
      if (boundary !== "final-submit") page.once("dialog", dialog => dialog.accept());
      await page.getByRole("link", { name: "Account", exact: true }).click();
      await expect(page).toHaveURL(/settings/);
    }
    await browser.addCookies([{ name: "socra_session", value: "account-b", url: baseURL!, httpOnly: true }]);
    // Cover session invalidation while mounted separately from unmount cleanup,
    // which must also work when storage is unavailable and no marker is written.
    if (boundary === "session-change") await page.evaluate(() => localStorage.setItem("socra-session-change", "account-b"));
    const firstResponse = page.waitForResponse(response => response.url().endsWith("/surveys/onboarding/me/draft") && response.request().method() === "POST");
    releaseFirst();
    await firstResponse;
    await page.clock.runFor(250);
    expect(writes.map(write => write.method)).toEqual(["POST"]);
    expect(writes.filter(write => write.cookie.includes("account-b"))).toEqual([]);
    if (boundary === "session-change") await expect(page.getByText("Bozza salvata", { exact: true })).toHaveCount(0);
  });
}
