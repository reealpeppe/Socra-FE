import { expect, test, type Page } from "@playwright/test";

const user = { id: "perf-user", username: "perf-user", nickname: "Ada", email: "ada@example.test", level: "L2", is_coach: false, role: "user", account_status: "active", email_verified: true, email_verification_required: true };
const goals = { current: null, active_goals: [], goals: [] };

async function publicLink(page: Page, name: string) {
  if (await page.getByRole("button", { name: "Apri menu", exact: true }).isVisible())
    await page.getByRole("button", { name: "Apri menu", exact: true }).click();
  return page.getByRole("link", { name, exact: true }).filter({ visible: true }).first();
}

test("public navigation keeps its frame and content while the route is pending", async ({ page }) => {
  await page.route("**/api/backend/auth/me", route => route.fulfill({ status: 401, json: { detail: "Authentication required" } }));
  let release!: () => void;
  let pendingRequests = 0;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/faq?*", async route => { pendingRequests++; await pending; await route.continue(); });
  await page.goto("/come-funziona");
  await expect(page.getByRole("link", { name: "Inizia ora", exact: true })).toBeVisible();
  const heading = await page.locator("main h1").innerText();
  await page.evaluate(() => { const nav = document.querySelector('nav[aria-label="Navigazione pubblica"]')!; nav.setAttribute("data-frame-probe", "persisted"); });
  // Fetch on click as well as prefetch must keep the current page usable.
  const click = (await publicLink(page, "FAQ")).click();
  try {
    await expect.poll(() => pendingRequests).toBeGreaterThan(0);
    await page.waitForTimeout(400);
    await expect(page.locator('nav[data-frame-probe="persisted"]')).toBeVisible();
    await expect(page.locator("main h1")).toHaveText(heading);
  } finally { release!(); }
  await click;
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator('nav[data-frame-probe="persisted"]')).toBeVisible();
});

test("returning to a warm dashboard reuses verified data without blocking", async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: "socra_session", value: "perf-session", url: baseURL!, httpOnly: true }]);
  let pathReads = 0;
  await page.route("**/api/backend/**", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: user }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { latest_answer_id: "done" } }));
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: goals }));
  await page.route("**/api/backend/skills/me", route => route.fulfill({ json: null }));
  await page.route("**/api/backend/profiles/perf-user", route => route.fulfill({ json: { user_id: user.id, nickname: "Ada", top_topics: [] } }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: { balance: 2, debt: 0 } }));
  await page.route("**/api/backend/paths/me", route => { pathReads++; return route.fulfill({ json: [] }); });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Definisci obiettiv/ }).first()).toBeVisible();
  await page.locator('a[href="/wallet"]:visible').first().click();
  await expect(page).toHaveURL(/\/wallet$/);
  await expect(page.getByRole("heading", { name: "Crediti Socra", exact: true })).toBeVisible();
  await page.locator('a[href="/dashboard"]:visible').first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: /Definisci obiettiv/ }).first()).toBeVisible();
  expect(pathReads).toBe(1);
});

test("public pages share their session check across navigation", async ({ page }) => {
  let checks = 0;
  await page.route("**/api/backend/auth/me", route => { checks++; return route.fulfill({ status: 401, json: { detail: "Authentication required" } }); });
  await page.goto("/come-funziona");
  await expect(page.getByRole("link", { name: "Inizia ora", exact: true }).first()).toBeVisible();
  const initialChecks = checks;
  await (await publicLink(page, "FAQ")).click();
  await expect(page).toHaveURL(/\/faq$/);
  await (await publicLink(page, "Community")).click();
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByRole("link", { name: "Inizia ora", exact: true }).first()).toBeVisible();
  expect(checks).toBe(initialChecks);
});

test("public session refresh supersedes an earlier in-flight session check", async ({ page }) => {
  let checks = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/backend/auth/me", async route => {
    const check = ++checks;
    if (check === 1) {
      await pending;
      await route.fulfill({ json: user });
    } else {
      await route.fulfill({ status: 401, json: { detail: "Authentication required" } });
    }
  });
  await page.goto("/come-funziona");
  try {
    await expect.poll(() => checks).toBe(1);
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect.poll(() => checks).toBeGreaterThan(1);
    await expect(page.getByRole("link", { name: "Inizia ora", exact: true })).toBeVisible();
  } finally { release(); }
  await expect(page.getByRole("link", { name: "Inizia ora", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Torna alla community", exact: true })).toHaveCount(0);
});

test("a slow optional public profile does not block the dashboard", async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: "socra_session", value: "perf-session", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/backend/**", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: user }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { latest_answer_id: "done" } }));
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: goals }));
  await page.route("**/api/backend/skills/me", route => route.fulfill({ json: null }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: { balance: 2, debt: 0 } }));
  let release: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/backend/profiles/perf-user", async route => { await pending; await route.fulfill({ json: { user_id: user.id, nickname: "Ada", top_topics: [] } }); });
  await page.goto("/dashboard");
  try {
    await expect(page.getByRole("link", { name: /Definisci obiettiv/ }).first()).toBeVisible({ timeout: 1500 });
    await expect(page.getByRole("status").filter({ hasText: "Caricamento dashboard" })).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Caricamento esperienza" })).toBeVisible();
    await expect(page.getByText("Nessun argomento ancora disponibile.", { exact: true })).toHaveCount(0);
  } finally { release!(); }
});
