import { expect, test, type Page } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

test.skip(process.env.SOCRA_CREDIT_ADVANCE_LIVE !== "1", "Requires the dedicated local credit advance fixture");
test("credit advance lifecycle with real APIs and screenshots", async ({ page, browser, baseURL }, testInfo) => {
  test.setTimeout(90_000);
  const backend = process.env.CREDIT_ADVANCE_BACKEND_DIR!;
  const runId = process.env.CREDIT_ADVANCE_RUN_ID || "";
  if (runId && !/^[a-z0-9-]{1,40}$/.test(runId)) throw new Error("Invalid fixture run ID");
  const fixtureName = `credit-advance-review${runId ? `-${runId}` : ""}.json`;
  const fixture = JSON.parse(await readFile(path.join(backend, ".local", fixtureName), "utf8"));
  const viewport = testInfo.project.name === "mobile" ? "mobile" : "desktop";
  await page.setViewportSize(viewport === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  const scenario = fixture.scenarios[viewport];
  const output = path.resolve(process.env.CREDIT_ADVANCE_EVIDENCE_DIR || "output/playwright/credit-advance");
  await mkdir(output, { recursive: true });
  const observations: Record<string, unknown>[] = [];
  async function capture(name: string) {
    await page.screenshot({ path: path.join(output, `${viewport}-${name}.png`), fullPage: true });
    await page.screenshot({ path: path.join(output, `${viewport}-${name}-viewport.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    observations.push({ screenshot: `${viewport}-${name}.png`, url: new URL(page.url()).pathname });
  }
  async function api(target: Page, endpoint: string, data?: unknown) {
    // Exercise the browser's actual BFF cookies, including Secure on loopback.
    return target.evaluate(async ({ endpoint, data }) => {
      const response = await fetch(`/api/backend${endpoint}`, {
        credentials: "include", cache: "no-store", method: data ? "POST" : "GET",
        ...(data ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } : {}),
      });
      return { status: response.status, body: await response.json() };
    }, { endpoint, data });
  }
  async function login(handle: string, target: Page = page) {
    await target.goto(`${baseURL}/login`);
    await target.getByLabel("Username o email").fill(fixture.users[handle].username);
    await target.getByLabel("Password", { exact: true }).fill("SocraAdvanceDemo2026!");
    await target.getByRole("button", { name: "Accedi", exact: true }).click();
    await expect(target).toHaveURL(/dashboard/);
    const identity = await api(target, "/auth/me");
    expect(identity.status).toBe(200);
    expect(identity.body.id).toBe(fixture.users[handle].id);
  }
  async function wallet() {
    const response = await api(page, "/wallet/me");
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    return response.body;
  }
  await login("mentor");
  await page.goto("/wallet");
  await expect(page.locator(".wallet-stat-value")).toHaveText("2");
  await capture("ordinary");
  await page.locator('button[aria-controls="account-menu"]').click();
  await page.getByRole("button", { name: /Esci/ }).click();
  await login(viewport);
  expect(await wallet()).toMatchObject({ balance: 0, available_balance: 1, advance_available: 1, advance_used: 0 });
  await page.goto("/wallet");
  await expect(page.getByText("Anticipato", { exact: true })).toBeVisible();
  await capture("available");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Crediti: 1.*anticipato/i })).toBeVisible();
  await capture("dashboard");
  await page.getByRole("link", { name: /Crediti: 1.*anticipato/i }).click();
  await expect(page).toHaveURL(/\/wallet$/);
  await expect(page.getByText("Anticipato", { exact: true })).toBeVisible();
  observations.push({ action: "click dashboard credit 1 anticipato", destination: "/wallet", displayed_available_credit: 1 });
  await page.goto("/requests");
  await page.getByRole("button", { name: "Accetta", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Questo percorso utilizzerà il tuo credito anticipato.");
  await capture("confirmation");
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Conferma", exact: true }).click();
  await expect(page.getByText("Proposta accettata. Il percorso è aperto.", { exact: true })).toBeVisible();
  expect(await wallet()).toMatchObject({ balance: 0, available_balance: 0, advance_available: 0, advance_used: 1 });
  await page.goto("/wallet");
  await expect(page.getByText("Credito anticipato utilizzato", { exact: true })).toBeVisible();
  await capture("used");
  const mentorFeedback = await api(page, `/feedback/${scenario.mentor_path_id}/mentor`, {
    answers: { objective_outcomes: [{ code: "etf_read", result: "yes" }], engagement: "active" },
  });
  expect(mentorFeedback.status, JSON.stringify(mentorFeedback.body)).toBe(200);
  expect((await wallet()).advance_used).toBe(1);
  const peer = await browser.newContext();
  try {
    const peerPage = await peer.newPage();
    await login(`peer.${viewport}`, peerPage);
    const feedback = await api(peerPage, `/feedback/${scenario.mentor_path_id}/mentee`, {
      answers: { objective_outcomes: [{ code: "etf_read", result: "yes", can_help: "yes", share_skill: false }], clarity: "mixed", would_repeat: "no", external_promotion: false },
    });
    expect(feedback.status, JSON.stringify(feedback.body)).toBe(200);
  } finally { await peer.close(); }
  expect(await wallet()).toMatchObject({ balance: 0, available_balance: 0, advance_used: 0 });
  await page.reload();
  await expect(page.getByText("Anticipo compensato", { exact: true })).toBeVisible();
  await capture("settled");
  observations.push({ result: "accepted once, compensated only after bilateral feedback", final_wallet: await wallet() });
  await writeFile(path.join(output, `${viewport}-observations.json`), JSON.stringify(observations, null, 2));
});
