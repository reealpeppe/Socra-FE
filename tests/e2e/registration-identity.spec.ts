import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "identity-user", username: "giulia_etf", email: "giulia@example.com", nickname: "giulia_etf",
  level: "L0", role: "user", is_coach: false, account_status: "active",
  email_verified: false, email_verification_required: true, email_delivery_enabled: true,
};

async function session(page: Page, baseURL: string, verified = false) {
  await page.context().addCookies([{ name: "socra_session", value: "identity-test", url: baseURL, httpOnly: true }]);
  const state = { ...user, email_verified: verified };
  await page.route("**/api/backend/auth/me", r => r.fulfill({ json: state }));
  await page.route("**/api/backend/notifications/me", r => r.fulfill({ json: [] }));
  await page.route("**/api/backend/surveys/onboarding/me", r => r.fulfill({ json: { latest_answer_id: "saved-survey" } }));
  await page.route("**/api/backend/surveys/competences-v2/me", r => r.fulfill({ json: null }));
  await page.route("**/api/backend/goals/me", r => r.fulfill({ json: { goals: [], current: null } }));
  await page.route("**/api/backend/wallet/me", r => r.fulfill({ json: { balance: 2, debt: 0 } }));
  await page.route("**/api/backend/matching/requests/me?**", r => r.fulfill({ json: [] }));
  return state;
}

test("complete registration rejects mismatched passwords before submitting and explains privacy", async ({ page, baseURL }) => {
  await session(page, baseURL!);
  let calls = 0;
  let payload: Record<string, unknown> = {};
  await page.route("**/api/auth/register", r => {
    calls++; payload = r.request().postDataJSON();
    return r.fulfill({ json: { user_id: user.id } });
  });
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Giulia");
  await page.getByLabel("Cognome", { exact: true }).fill("Rossi");
  await page.getByLabel("Username", { exact: true }).fill("giulia_etf");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Conferma password", { exact: true }).fill("DifferentPass123");
  await page.getByLabel(/almeno 18 anni/).check();
  await page.getByRole("button", { name: "Crea account", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /password.*coincid/i })).toBeVisible();
  expect(calls).toBe(0);
  await expect(page.getByText(/nome e cognome.*privati/i)).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("registrazione.png"), fullPage: true });
  await page.getByLabel("Conferma password", { exact: true }).fill("StrongPass123");
  await page.getByRole("button", { name: "Crea account", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  expect(payload).toEqual({
    first_name: "Giulia", last_name: "Rossi", username: "giulia_etf",
    email: user.email, password: "StrongPass123", password_confirmation: "StrongPass123", consent_essential: true,
  });
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("StrongPass123");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("unverified matching never loads candidates and offers survey and verification recovery", async ({ page, baseURL }) => {
  await session(page, baseURL!);
  let candidateCalls = 0;
  await page.route("**/api/backend/matching/candidates", r => {
    candidateCalls++; return r.fulfill({ json: [] });
  });
  await page.goto("/matching");
  await expect(page.getByRole("heading", { name: "Conferma la tua email", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Riprendi survey", exact: true })).toHaveAttribute("href", "/onboarding");
  expect(candidateCalls).toBe(0);
  await page.route("**/api/auth/email-verification/request", r => r.fulfill({ json: { status: "ok", email_delivery_enabled: true } }));
  await page.getByRole("button", { name: "Invia link di verifica", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /link.*verifica|richiesta.*verifica/i })).toBeVisible();
  await page.getByRole("button", { name: "Correggi email", exact: true }).click();
  await page.getByLabel("Email corretta", { exact: true }).fill("corrected@example.com");
  await page.route("**/api/auth/email", r => {
    expect(r.request().method()).toBe("PATCH");
    expect(r.request().postDataJSON()).toEqual({ email: "corrected@example.com" });
    return r.fulfill({ json: { status: "ok", email_delivery_enabled: true } });
  });
  await page.getByRole("button", { name: "Salva email e invia verifica", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /email.*aggiornata/i })).toBeVisible();
});

test("verification in another tab unlocks the page without losing the survey", async ({ page, baseURL }) => {
  const state = await session(page, baseURL!);
  await page.goto("/matching");
  await expect(page.getByRole("heading", { name: "Conferma la tua email", exact: true })).toBeVisible();
  const confirmation = await page.context().newPage();
  await confirmation.route("**/api/auth/email-verification/confirm", r => {
    state.email_verified = true;
    return r.fulfill({ json: { status: "ok" } });
  });
  await confirmation.goto("/verify-email#token=identity-local-token");
  await confirmation.getByRole("button", { name: "Conferma email", exact: true }).click();
  await expect(confirmation.getByRole("status").filter({ hasText: "Email verificata" })).toBeVisible();
  await expect(confirmation.getByRole("link", { name: "Riprendi survey", exact: true })).toHaveCount(0);
  await expect(confirmation.getByRole("link", { name: "Vai al tuo account", exact: true })).toHaveAttribute("href", "/settings");
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("heading", { name: "Conferma la tua email", exact: true })).toHaveCount(0);
  await expect(page.getByRole("main")).toContainText(/obiettivo/i);
});

test("unverified profile navigation does not fetch another member's profile", async ({ page, baseURL }) => {
  await session(page, baseURL!);
  let calls = 0;
  await page.route("**/api/backend/profiles/other", r => { calls++; return r.fulfill({ json: {} }); });
  await page.goto("/profiles/other");
  await expect(page.getByRole("heading", { name: "Conferma la tua email", exact: true })).toBeVisible();
  expect(calls).toBe(0);
});
