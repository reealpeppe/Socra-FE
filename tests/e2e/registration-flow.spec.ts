import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: "socra_session", value: "test", url: baseURL!, httpOnly: true }]);
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { id: "registration-user", account_status: "active" } }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "registration-user", latest_answer_id: null } }));
  await page.route("**/api/backend/surveys/onboarding/me/draft", route => route.fulfill({ json: null }));
});

test("sharing without capital or quiz can be edited and returned directly to review", async ({ page }, testInfo) => {
  let submission: Record<string, unknown> = {};
  await page.route("**/api/backend/surveys/onboarding/me/answers", route => {
    submission = route.request().postDataJSON().answers;
    return route.fulfill({ json: {} });
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Cominciamo" }).click();
  await page.getByRole("checkbox", { name: "Forex", exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.locator('input[name="knowledge-forex"][value="K1"]').check();
  await page.locator('input[name="investment-forex"][value="A0"]').check();
  await page.locator('input[name="duration-forex"][value="1y_3y"]').check();
  await page.locator('input[name="mentor-forex"][value="yes"]').check();
  await expect(page.locator('.topic-safety-scenario')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('strumento.png'), fullPage: true });
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.getByLabel("Non ho ancora preso decisioni di investimento", { exact: true }).check();
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  for (const key of ["D1", "D2", "D3", "D4", "D5"]) {
    await expect(page.getByText("Privato · Facoltativo · Non influenza il matching", { exact: true })).toBeVisible();
    if (key === 'D1') await page.screenshot({ path: testInfo.outputPath('contesto.png'), fullPage: true });
    await page.locator(`input[name="context-${key}"][value="undisclosed"]`).check();
    await page.getByRole("button", { name: "Continua", exact: true }).click();
  }
  await page.getByRole("button", { name: "Modifica Forex", exact: true }).click();
  await page.locator('input[name="duration-forex"][value="3y_5y"]').check();
  await page.reload();
  await expect(page.locator('input[name="duration-forex"][value="3y_5y"]')).toBeChecked();
  await page.getByRole("button", { name: "Torna al riepilogo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ti riconosci in queste risposte?" })).toBeVisible();
  await expect(page.getByText("3–5 anni", { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('riepilogo.png'), fullPage: true });
  await page.getByRole("button", { name: "Conferma le risposte" }).click();
  await expect(page.getByRole("heading", { name: "Il tuo punto di partenza è chiaro" })).toBeVisible();
  expect(submission).toMatchObject({ D5: "not_yet", topic_competences_v2: { instruments: expect.arrayContaining([
    expect.objectContaining({ topic: "forex", wants_to_mentor: true, experience_duration: "3y_5y" }),
  ]) } });
});

test("new sharing preferences can enable a basic Forex topic without an exam in settings", async ({ page }) => {
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { user_id: "registration-user", latest_answer_id: "done" } }));
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { id: "registration-user", nickname: "Giulia", is_coach: false, account_status: "active" } }));
  await page.route("**/api/backend/profiles/me", route => route.fulfill({ json: { user_id: "registration-user", nickname: "Giulia" } }));
  const snapshot = { onboarding_policy: "onboarding-sharing-2026-09-26", is_coach: false, instruments: [
    { topic: "forex", knowledge_level: "K1", invested_amount_band: "A0", wants_to_mentor: false, mentor_eligible: true, experience_duration: "lt_6m" },
  ] };
  await page.route("**/api/backend/surveys/competences-v2/me", route => route.fulfill({ json: snapshot }));
  let requested: { topics: Array<{ topic: string; wants_to_mentor: boolean; safety_scenario_answer: null }> } | undefined;
  await page.route("**/api/backend/surveys/competences-v2/me/mentor-topics", route => {
    requested = route.request().postDataJSON();
    return route.fulfill({ json: { ...snapshot, instruments: snapshot.instruments.map(row => ({ ...row, wants_to_mentor: true })) } });
  });
  await page.goto("/settings");
  await page.locator('label[for="mentor-topic-forex"]').click();
  await expect(page.getByRole("switch", { name: "Mentorship su Forex", exact: true })).toBeChecked();
  await expect(page.getByText("Disponibilità per strumento aggiornata.", { exact: true })).toBeVisible();
  await expect(page.locator('.topic-safety-scenario')).toHaveCount(0);
  expect(requested?.topics.find(row => row.topic === 'forex')).toMatchObject({ wants_to_mentor: true, safety_scenario_answer: null });
});
