import { expect, test, type Page } from "@playwright/test";

const user = { id: "u1", username: "utente", email: "demo@example.test", nickname: "Giulia",
  level: "L0", is_coach: true, role: "user", account_status: "active",
  email_verified: true, email_verification_required: false, email_delivery_enabled: false };
const goal = { id: "g1", topic: "ETF e fondi", goal_tag: "Capire gli ETF", is_active: true };
const proposal = { id: "r1", status: "pending", mentor_id: "u2", mentee_id: "u1",
  initiator_role: "mentor", goal_id: "g1", expires_at: "2099-10-12T12:00:00Z",
  mentor: { user_id: "u2", nickname: "Anna", is_coach: true }, mentee: { user_id: "u1", nickname: "Giulia" },
  goal, alignment_message: "Posso aiutarti a capire le basi degli ETF.", cost_at_request: 1,
  email_sharing_accepted: true };

async function fixture(page: Page, state: "normal" | "available" | "used", requests = false) {
  const balance = state === "normal" ? 2 : 0;
  const wallet = { balance, available_balance: state === "available" ? 1 : balance,
    advance_available: state === "available" ? 1 : 0, advance_used: state === "used" ? 1 : 0,
    currency_label: "crediti" };
  const responses: Record<string, unknown> = {
    "/auth/me": user, "/notifications/me": [],
    "/surveys/onboarding/me": { latest_answer_id: "a1" },
    "/wallet/me": wallet,
    "/wallet/me/transactions": state === "used" ? [{ id: "t1", type: "spend", amount: -1,
      balance_after: 0, advance_after: 1, description: "Credito anticipato utilizzato",
      reason: "credit_advance_used", path_id: "p1", created_at: "2026-10-11T12:00:00Z" }] : [],
    "/matching/requests/me": requests ? [proposal] : [],
    "/paths/me": [], "/goals/me": { current: goal, goals: [goal] },
    "/profiles/me": { user_id: "u1", nickname: "Giulia", bio: null, avatar_url: null },
    "/surveys/competences-v2/me": null,
  };
  await page.route("**/api/backend/**", route => {
    const path = new URL(route.request().url()).pathname.replace("/api/backend", "");
    return path in responses ? route.fulfill({ json: responses[path] })
      : route.fulfill({ status: 404, json: { detail: "Not Found" } });
  });
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL!, httpOnly: true }]);
});

test("ordinary balance has no separate margin or anticipation box", async ({ page }) => {
  await fixture(page, "normal");
  await page.goto("/wallet");
  const balance = page.locator(".wallet-stat-card");
  await expect(balance).toHaveCount(1);
  await expect(balance).toContainText("2");
  await expect(page.getByText("Margine utilizzato", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Anticipato", { exact: true })).toHaveCount(0);
});

test("available advance is a labelled spendable credit inside the balance", async ({ page }) => {
  await fixture(page, "available");
  await page.goto("/wallet");
  const balance = page.locator(".wallet-stat-card");
  await expect(balance).toHaveCount(1);
  await expect(balance.locator(".wallet-stat-value")).toHaveText("1");
  await expect(balance.getByText("Anticipato", { exact: true })).toBeVisible();
  await expect(balance).toContainText("puoi usare un credito in anticipo");
  await expect(balance).toContainText("Se lo utilizzi, il prossimo credito guadagnato come mentor compenserà l’anticipo.");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Crediti: 1.*anticipato/i })).toBeVisible();
});

test("used advance keeps zero spendable credits and explains compensation", async ({ page }) => {
  await fixture(page, "used");
  await page.goto("/wallet");
  const balance = page.locator(".wallet-stat-card");
  await expect(balance).toHaveCount(1);
  await expect(balance.locator(".wallet-stat-value")).toHaveText("0");
  await expect(balance).toContainText("Il prossimo credito guadagnato come mentor compenserà l’anticipo.");
  await expect(page.getByText("Credito anticipato utilizzato", { exact: true })).toBeVisible();
  await expect(page.getByText(/margine/i)).toHaveCount(0);
});

test("acceptance explains that an advance is charged only after both feedbacks", async ({ page }) => {
  await fixture(page, "available", true);
  await page.goto("/requests");
  await page.getByRole("button", { name: "Accetta", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(/addebitati dopo i feedback di entrambi/i);
  await expect(page.getByRole("dialog")).toContainText(/credito anticipato potrà coprire questo costo/i);
  await expect(page.getByRole("dialog")).toContainText("Crediti disponibili: 1");
});
