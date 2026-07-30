import { expect, test, type Page } from "@playwright/test";

async function mockSuccessfulSession(page: Page) {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "socra_session=test-token; Path=/; HttpOnly; SameSite=Lax"
      },
      body: JSON.stringify({ access_token: "test-token", token_type: "bearer", user_id: "u1" })
    });
  });
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => {
    await route.fulfill({ json: { latest_answer_id: "answer-1" } });
  });
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({
    json: {
      id: "u1",
      username: "user",
      email: "user@example.com",
      nickname: "User",
      level: "L1",
      is_coach: true,
      role: "user",
      account_status: "active"
    }
  }));
  await page.route("**/api/backend/wallet/me", async (route) => route.fulfill({
    json: { balance: 10, debt: 0, currency_label: "coin" }
  }));
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({
    json: { current: null, goals: [], history: [] }
  }));
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/notifications/me", async (route) => route.fulfill({ json: [] }));
}

async function submitLogin(page: Page) {
  await page.getByLabel("Username o email").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByRole("button", { name: "Accedi" }).click();
}

function currentLocalPath(page: Page) {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}${url.hash}`;
}

test("registration form keeps legal documents available before acceptance", async ({ page }) => {
  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "Crea il tuo account" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/per ora|codici SMS|\bV1\b/i);
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  const form = page.getByRole("form", { name: "Crea il tuo account" });
  const essentialConsent = page.getByLabel(/almeno 18 anni.*Termini.*privacy/i);
  const submit = page.getByRole("button", { name: "Crea account" });

  await expect(page.locator('input[type="checkbox"]')).toHaveCount(1);
  await expect(page.getByText(/consensi facoltativi in anticipo/i)).toBeVisible();
  await expect(essentialConsent).not.toBeChecked();
  await expect(form.getByRole("link", { name: "Termini", exact: true })).toHaveAttribute("href", "/termini");
  await expect(form.getByRole("link", { name: "informativa privacy", exact: true })).toHaveAttribute("href", "/privacy");
  await expect(submit).toBeEnabled();
  await submit.click();
  expect(await essentialConsent.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await essentialConsent.check();
  await expect(submit).toBeEnabled();
});

test("login offers honest account assistance and a route back to the public site", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("link", { name: /Torna alla pagina iniziale/i })).toHaveAttribute("href", "/");
  await page.getByText("Non riesci ad accedere?").click();
  await expect(page.getByText(/recupero automatico della password non è ancora disponibile/i)).toBeVisible();
  await expect(page.getByText(/mai la password/i)).toBeVisible();
});

test("protected route redirects anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("login posts through BFF and reaches dashboard", async ({ page }) => {
  await mockSuccessfulSession(page);

  await page.goto("/login");
  await submitLogin(page);

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Ciao User/ })).toBeVisible();
});

test("login preserves query and hash for an allowed protected route", async ({ page }) => {
  await mockSuccessfulSession(page);
  const next = "/requests?tab=sent#pending";

  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await submitLogin(page);

  await expect.poll(() => currentLocalPath(page)).toBe(next);
});

test("login rejects external, protocol-relative and executable next values", async ({ page }) => {
  await mockSuccessfulSession(page);
  const unsafeTargets = [
    "https://evil.example/phish",
    "https://socra.local/dashboard",
    "//evil.example/phish",
    "javascript:alert(1)",
    "/\\evil.example/phish",
    "/dashboard.evil.example"
  ];

  for (const target of unsafeTargets) {
    await page.goto(`/login?next=${encodeURIComponent(target)}`);
    await submitLogin(page);
    await expect.poll(() => currentLocalPath(page)).toBe("/dashboard");
  }
});

test("onboarding gate keeps pathname and search in the expired-session login link", async ({ context, page }) => {
  await context.addCookies([{
    name: "socra_session",
    value: "stale-token",
    domain: "127.0.0.1",
    path: "/"
  }]);
  await page.route("**/api/backend/surveys/onboarding/me", async (route) => {
    await route.fulfill({ status: 401, json: { detail: "Invalid session" } });
  });
  await page.route("**/api/backend/auth/me", async (route) => {
    await route.fulfill({ status: 401, json: { detail: "Invalid session" } });
  });
  await page.route("**/api/backend/notifications/me", async (route) => route.fulfill({ json: [] }));

  await page.goto("/requests?tab=sent#local-section");
  const loginLink = page.getByRole("link", { name: "Vai all'accesso" });
  await expect(loginLink).toBeVisible();

  const href = await loginLink.getAttribute("href");
  expect(href).not.toBeNull();
  expect(new URL(href!, page.url()).searchParams.get("next")).toBe("/requests?tab=sent");

  await loginLink.click();
  await expect.poll(() => {
    const url = new URL(page.url());
    return { pathname: url.pathname, next: url.searchParams.get("next") };
  }).toEqual({ pathname: "/login", next: "/requests?tab=sent" });
});
