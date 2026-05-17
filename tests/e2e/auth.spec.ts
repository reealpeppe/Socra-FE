import { expect, test } from "@playwright/test";

test("registration form keeps V1 password auth explicit", async ({ page }) => {
  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "Crea il tuo account" })).toBeVisible();
  await expect(page.getByText("Nessun invio email o SMS in V1.")).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByLabel("Accetto il trattamento essenziale per usare Socra.")).toBeChecked();
});

test("protected route redirects anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("login posts through BFF and reaches dashboard", async ({ page }) => {
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
  await page.route("**/api/backend/auth/me", async (route) => route.fulfill({ json: { id: "u1", username: "user", email: "user@example.com", nickname: "User", level: "L1", is_coach: true, role: "user", account_status: "active" } }));
  await page.route("**/api/backend/wallet/me", async (route) => route.fulfill({ json: { balance: 10, debt: 0, currency_label: "coin" } }));
  await page.route("**/api/backend/goals/me", async (route) => route.fulfill({ json: { current: null, goals: [], history: [] } }));
  await page.route("**/api/backend/matching/requests/me?role=all", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/backend/notifications/me", async (route) => route.fulfill({ json: [] }));

  await page.goto("/login");
  await page.getByLabel("Username o email").fill("user");
  await page.getByLabel("Password").fill("StrongPass123");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Livello")).toBeVisible();
});
