import { expect, test, type Page } from "@playwright/test";
import { fixture } from "./multi-goal-fixture";

async function alerts(page: Page, baseURL: string, initial = false) {
  await fixture(page, baseURL);
  const state = { enabled: initial, writes: 0, failWrite: false, failRead: false, uncertain: false };
  await page.route("**/api/backend/matching/candidates/all", route => route.fulfill({ json: { items: [], next_cursor: null } }));
  await page.route("**/api/backend/mentor-alerts/me", route => {
    if (route.request().method() === "PUT") {
      state.writes++;
      if (!state.failWrite || state.uncertain) state.enabled = route.request().postDataJSON().enabled;
      if (state.failWrite) return route.fulfill({ status: 503, json: { detail: "Salvataggio non disponibile. Riprova." } });
    }
    if (state.failRead) return route.fulfill({ status: 503, json: { detail: "Preferenze non disponibili." } });
    return route.fulfill({ json: { enabled: state.enabled, subscribed_at: state.enabled ? "2026-10-17T10:00:00Z" : null, updated_at: null } });
  });
  return state;
}

test("empty matching saves alert preference and keeps it after reload", async ({ page, baseURL }) => {
  const state = await alerts(page, baseURL!);
  await page.goto("/matching");
  await expect(page.getByRole("heading", { name: "Nessun mentor giusto per te, per ora" })).toBeVisible();
  await page.getByRole("button", { name: "Avvisami via email", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Le notifiche sono attive" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avvisami via email", exact: true })).toHaveCount(0);
  expect(state.writes).toBe(1);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: "Le notifiche sono attive" })).toBeVisible();
  expect(state.writes).toBe(1);
});

test("settings can revoke alerts and matching offers opt in again", async ({ page, baseURL }) => {
  const state = await alerts(page, baseURL!, true);
  await page.goto("/settings");
  const toggle = page.getByRole("switch", { name: "Avvisi sui mentor via email", exact: true });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "Avvisi sui mentor disattivati" })).toBeVisible();
  expect(state.enabled).toBe(false);
  await page.goto("/matching");
  await expect(page.getByRole("button", { name: "Avvisami via email", exact: true })).toBeVisible();
});

test("failed saves remain retryable and uncertain successes are verified by rereading", async ({ page, baseURL }) => {
  const state = await alerts(page, baseURL!);
  state.failWrite = true;
  await page.goto("/matching");
  const button = page.getByRole("button", { name: "Avvisami via email", exact: true });
  await button.click();
  await expect(page.getByRole("alert").filter({ hasText: /Socra non è momentaneamente raggiungibile/ })).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(page.getByText("Le notifiche sono attive", { exact: true })).toHaveCount(0);
  state.uncertain = true;
  await button.click();
  await expect(page.getByRole("status").filter({ hasText: "Le notifiche sono attive" })).toBeVisible();
  expect(state.writes).toBe(2);
});

test("unavailable preference is distinct from disabled and supports retry", async ({ page, baseURL }) => {
  const state = await alerts(page, baseURL!);
  state.failRead = true;
  await page.goto("/matching");
  await expect(page.getByRole("button", { name: "Riprova preferenza", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avvisami via email", exact: true })).toHaveCount(0);
  state.failRead = false;
  await page.getByRole("button", { name: "Riprova preferenza", exact: true }).click();
  await expect(page.getByRole("button", { name: "Avvisami via email", exact: true })).toBeEnabled();
});

test("matching failures never present an empty mentor opt in", async ({ page, baseURL }) => {
  await alerts(page, baseURL!);
  await page.route("**/api/backend/matching/candidates/all", route => route.fulfill({ status: 503, json: { detail: "Ricerca temporaneamente non disponibile" } }));
  await page.goto("/matching");
  await expect(page.getByRole("alert").filter({ hasText: "Socra non è momentaneamente raggiungibile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avvisami via email", exact: true })).toHaveCount(0);
});

test("public unsubscribe keeps token in memory and waits for explicit confirmation", async ({ page }) => {
  const calls: unknown[] = [];
  await page.route("**/api/mentor-alerts/unsubscribe", route => {
    calls.push(route.request().postDataJSON());
    return route.fulfill({ json: { status: "ok" } });
  });
  await page.goto("/avvisi-email#token=personal-unsubscribe-token");
  await expect.poll(() => new URL(page.url()).hash).toBe("");
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: "Disattiva gli avvisi sui mentor", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Avvisi sui mentor disattivati");
  expect(calls).toEqual([{ token: "personal-unsubscribe-token" }]);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("personal-unsubscribe-token");
  await expect(page.locator("body")).toContainText("email relative al tuo account e ai percorsi");
});
test("changing session invalidates the old account preference before any new write", async ({ page, baseURL }) => {
  const state = await alerts(page, baseURL!, true);
  await page.goto("/settings");
  await expect(page.getByRole("switch", { name: "Avvisi sui mentor via email", exact: true })).toBeEnabled();
  await page.evaluate(() => {
    localStorage.setItem("socra-session-change", "new-account-session");
    window.dispatchEvent(new Event("socra:session-refresh"));
  });
  await expect(page.getByText("La sessione è cambiata. Ricarica la pagina per gestire gli avvisi.", { exact: true })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Avvisi sui mentor via email", exact: true })).toHaveCount(0);
  expect(state.writes).toBe(0);
});
