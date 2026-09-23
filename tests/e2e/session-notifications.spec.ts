import { expect, test } from "@playwright/test";

const account = {
  id: "recipient-1", username: "recipient", email: "recipient@example.com",
  nickname: "Sofia", level: "L2", is_coach: true, role: "user", account_status: "active",
};

const incomingProposal = {
  id: "proposal-1", type: "mentor_proposal_received",
  payload: {
    request_id: "request-1", mentee_id: "recipient-1", mentor_id: "mentor-1",
    goal_id: "goal-1", message: "Hai ricevuto una nuova proposta di percorso.", link: "/requests",
  },
  read_at: null, created_at: "2026-09-23T10:00:00Z",
};

const pendingRequest = {
  id: "request-1", status: "pending", mentee_id: "recipient-1", mentor_id: "mentor-1",
  goal_id: "goal-1", initiator_role: "mentor", expires_at: "2099-01-01T00:00:00Z",
  created_at: "2026-09-23T10:00:00Z", updated_at: "2026-09-23T10:00:00Z",
  cost_at_request: 2, goal: { id: "goal-1", topic: "etf_funds", goal_tag: "understand_etf" },
  mentor: { user_id: "mentor-1", nickname: "Marco" }, mentee: { user_id: "recipient-1", nickname: "Sofia" },
};

test.beforeEach(async ({ baseURL, context, page }) => {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/backend/**", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: account }));
});

test("public navigation returns an authenticated visitor to the community", async ({ page }) => {
  await page.goto("/come-funziona");
  const nav = page.getByRole("navigation", { name: "Navigazione pubblica" });
  await expect(nav.getByRole("link", { name: "Torna alla community" })).toHaveAttribute("href", "/dashboard");
  await expect(nav.getByRole("link", { name: "Accedi" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Inizia ora" })).toHaveCount(0);
});

test("public navigation shows anonymous actions only after a 401", async ({ page, isMobile }) => {
  await page.route("**/api/backend/auth/me", route => route.fulfill({ status: 401, json: { detail: "Authentication required" } }));
  await page.goto("/come-funziona");
  const nav = page.getByRole("navigation", { name: "Navigazione pubblica" });
  await expect(nav.getByRole("link", { name: "Inizia ora" })).toBeVisible();
  if (isMobile) {
    await nav.getByRole("button", { name: "Apri menu" }).click();
    await expect(nav.getByRole("link", { name: "Accedi al tuo account" })).toBeVisible();
  } else {
    await expect(nav.getByRole("link", { name: "Accedi" })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Torna alla community" })).toHaveCount(0);
});

test("temporary session failure offers retry without presenting the visitor as logged out", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/backend/auth/me", route => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, json: { detail: "Backend unavailable" } })
      : route.fulfill({ json: account });
  });
  await page.goto("/come-funziona");
  const nav = page.getByRole("navigation", { name: "Navigazione pubblica" });
  await expect(nav.getByRole("button", { name: "Riprova" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Accedi" })).toHaveCount(0);
  await nav.getByRole("button", { name: "Riprova" }).click();
  await expect(nav.getByRole("link", { name: "Torna alla community" })).toBeVisible();
});

test("two anonymous public tabs do not broadcast session changes or reload one another", async ({ context, page }) => {
  const otherTab = await context.newPage();
  let firstTabLoads = 0;
  let secondTabLoads = 0;
  page.on("load", () => { firstTabLoads += 1; });
  otherTab.on("load", () => { secondTabLoads += 1; });
  await page.route("**/api/backend/auth/me", route => route.fulfill({ status: 401, json: { detail: "Authentication required" } }));
  await otherTab.route("**/api/backend/auth/me", route => route.fulfill({ status: 401, json: { detail: "Authentication required" } }));
  await page.goto("/come-funziona");
  await otherTab.goto("/come-funziona");
  await expect(page.getByRole("navigation", { name: "Navigazione pubblica" }).getByRole("link", { name: "Inizia ora" })).toBeVisible();
  await expect(otherTab.getByRole("navigation", { name: "Navigazione pubblica" }).getByRole("link", { name: "Inizia ora" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("socra-session-change"))).toBeNull();
  expect(await otherTab.evaluate(() => localStorage.getItem("socra-session-change"))).toBeNull();
  expect(firstTabLoads).toBe(1);
  expect(secondTabLoads).toBe(1);
  await otherTab.close();
});

test("successful login and logout broadcast a real session change", async ({ page }) => {
  let loginAttempts = 0;
  await page.route("**/api/auth/login", route => {
    loginAttempts += 1;
    return loginAttempts === 1
      ? route.fulfill({ status: 401, json: { detail: "Invalid credentials" } })
      : route.fulfill({ json: { access_token: "new-token", token_type: "bearer", user_id: "recipient-1" } });
  });
  await page.route("**/api/auth/logout", route => route.fulfill({ json: { status: "ok" } }));
  await page.goto("/login");
  await page.getByLabel("Username o email").fill("recipient");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("main").getByRole("button", { name: "Accedi" }).click();
  await expect(page.locator("#login-error")).toContainText("Username, email o password non corretti");
  expect(await page.evaluate(() => localStorage.getItem("socra-session-change"))).toBeNull();
  await page.getByRole("main").getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const loginChange = await page.evaluate(() => localStorage.getItem("socra-session-change"));
  expect(loginChange).toBeTruthy();
  await page.getByRole("button", { name: /Apri il menu account di Sofia/ }).click();
  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login/);
  const logoutChange = await page.evaluate(() => localStorage.getItem("socra-session-change"));
  expect(logoutChange).toBeTruthy();
  expect(logoutChange).not.toBe(loginChange);
});

test("an incoming proposal is actionable and dismissible without being marked read", async ({ page }) => {
  let readCalls = 0;
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [pendingRequest] }));
  await page.route("**/api/backend/notifications/*/read", route => {
    readCalls += 1;
    return route.fulfill({ json: { ...incomingProposal, read_at: "2026-09-23T10:01:00Z" } });
  });
  await page.goto("/dashboard");
  const banner = page.getByRole("status", { name: "Nuova proposta" });
  await expect(banner.getByRole("link", { name: "Vedi proposte" })).toHaveAttribute("href", "/requests");
  expect(readCalls).toBe(0);
  await banner.getByRole("button", { name: "Chiudi avviso" }).click();
  await expect(banner).toHaveCount(0);
  await page.getByRole("link", { name: "Richieste", exact: true }).first().click();
  await expect(page).toHaveURL(/\/requests/);
  await expect(banner).toHaveCount(0);
  expect(readCalls).toBe(0);
});

test("dismissal survives leaving the community and returning in the same tab", async ({ page }) => {
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [pendingRequest] }));
  await page.goto("/dashboard");
  const banner = page.getByRole("status", { name: "Nuova proposta" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Chiudi avviso" }).click();
  await page.goto("/come-funziona");
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /Notifiche: 1 non letta/ })).toBeVisible();
  await expect(banner).toHaveCount(0);
});

test("an unread notification for a resolved or expired request does not advertise a new proposal", async ({ page }) => {
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{ ...pendingRequest, status: "accepted" }] }));
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /Notifiche: 1 non letta/ })).toBeVisible();
  await expect(page.getByRole("status", { name: "Nuova proposta" })).toHaveCount(0);
});

test("responding to an incoming request removes its banner while the notification stays unread", async ({ page }) => {
  let requestStatus = "pending";
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: {
    user_id: "recipient-1", level: "L2", is_coach: true, latest_answer_id: "answer-1",
  } }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: { balance: 10, debt: 0, currency_label: "coin" } }));
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{ ...pendingRequest, status: requestStatus }] }));
  await page.route("**/api/backend/matching/requests/request-1/respond", route => {
    requestStatus = "rejected";
    return route.fulfill({ json: { id: "request-1", status: "rejected" } });
  });
  await page.goto("/requests");
  const banner = page.getByRole("status", { name: "Nuova proposta" });
  await expect(banner).toBeVisible();
  await page.getByRole("button", { name: "Rifiuta" }).click();
  await page.getByRole("dialog", { name: "Conferma la scelta" }).getByRole("button", { name: "Conferma" }).click();
  await expect(page.getByText("Richiesta rifiutata.")).toBeVisible();
  await expect(banner).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Notifiche: 1 non letta/ })).toBeVisible();
});

test.describe("UTC-naive API expiry in Europe/Rome", () => {
  test.use({ timezoneId: "Europe/Rome" });

  test("a proposal expiring in 30 minutes is still actionable", async ({ page }) => {
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString().replace(/Z$/, "");
    await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
    await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{ ...pendingRequest, expires_at: expiresAt }] }));
    await page.goto("/dashboard");
    await expect(page.getByRole("status", { name: "Nuova proposta" })).toBeVisible();
  });

  test("a proposal expired one minute ago is not advertised", async ({ page }) => {
    const expiresAt = new Date(Date.now() - 60_000).toISOString().replace(/Z$/, "");
    await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [incomingProposal] }));
    await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{ ...pendingRequest, expires_at: expiresAt }] }));
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /Notifiche: 1 non letta/ })).toBeVisible();
    await expect(page.getByRole("status", { name: "Nuova proposta" })).toHaveCount(0);
  });
});

test("a newly received proposal appears after returning to the visible tab", async ({ page }) => {
  let notifications = [] as typeof incomingProposal[];
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: notifications }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [pendingRequest] }));
  await page.goto("/dashboard");
  const banner = page.getByRole("status", { name: "Nuova proposta" });
  await expect(banner).toHaveCount(0);
  notifications = [incomingProposal];
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(banner).toBeVisible();
});
