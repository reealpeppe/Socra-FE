import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Rome" });

async function walletFixture(page: Page, createdAt: string) {
  const responses: Record<string, unknown> = {
    "/auth/me": { id: "wallet-date-user", username: "datautente", email: "date@socra.test", role: "user", is_coach: false,
      account_status: "active", email_verified: true, email_verification_required: false },
    "/surveys/onboarding/me": { latest_answer_id: "answer" },
    "/notifications/me": [], "/matching/requests/me": [], "/paths/me": [],
    "/wallet/me": { balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: "crediti" },
    "/wallet/me/transactions": [{ id: "date-tx", type: "earn", amount: 2, balance_after: 2, advance_after: 0,
      description: "Dotazione iniziale Socra", reason: "initial_grant", created_at: createdAt }],
  };
  await page.route("**/api/backend/**", route => {
    const path = new URL(route.request().url()).pathname.replace("/api/backend", "");
    return path in responses ? route.fulfill({ json: responses[path] }) : route.fulfill({ status: 404, json: { detail: "Not Found" } });
  });
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "socra_session", value: "date-test", url: baseURL!, httpOnly: true }]);
});

test("wallet interprets offset-free API timestamps as UTC across the Rome midnight", async ({ page }) => {
  await walletFixture(page, "2026-10-12T22:30:23.189517");
  await page.goto("/wallet");
  await expect(page.locator(".wallet-tx-date")).toContainText("13 ott, 00:30");
});

test("wallet preserves explicit UTC offsets when formatting local transaction dates", async ({ page }) => {
  await walletFixture(page, "2026-10-13T02:30:23+04:00");
  await page.goto("/wallet");
  await expect(page.locator(".wallet-tx-date")).toContainText("13 ott, 00:30");
});

test("wallet handles an invalid transaction timestamp without breaking the ledger", async ({ page }) => {
  await walletFixture(page, "invalid-date");
  await page.goto("/wallet");
  await expect(page.locator(".wallet-tx-date")).toContainText("Data non disponibile");
  await expect(page.getByText("Dotazione iniziale Socra", { exact: true })).toBeVisible();
});
