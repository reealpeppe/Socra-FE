import { expect, test, type Page } from "@playwright/test";

const recipient = {
  id: "freshness-recipient", username: "recipient", email: "recipient@socra.test",
  nickname: "Sofia", level: "L2", is_coach: true, role: "user", account_status: "active",
  email_verified: true, email_verification_required: true, email_delivery_enabled: false,
};

const rejectedRequest = {
  id: "previous-request", status: "rejected", mentee_id: recipient.id, mentor_id: "previous-mentor",
  goal_id: "goal-1", initiator_role: "mentor", expires_at: "2099-01-01T00:00:00Z",
  created_at: "2026-10-12T10:00:00Z", updated_at: "2026-10-12T11:00:00Z",
  path_id: null, cost_at_request: 1, email_sharing_accepted: true,
  alignment_message: null, goal: { id: "goal-1", topic: "etf_funds", goal_tag: "understand_etf" },
  mentor: { user_id: "previous-mentor", nickname: "Marco" },
  mentee: { user_id: recipient.id, nickname: recipient.nickname },
};

const newRequest = {
  ...rejectedRequest, id: "new-request", status: "pending", mentor_id: "new-mentor",
  mentor: { user_id: "new-mentor", nickname: "Jacopo" },
};

const newNotification = {
  id: "new-notification", type: "mentor_proposal_received", read_at: null,
  created_at: "2026-10-13T10:00:00Z", payload: {
    request_id: newRequest.id, mentee_id: recipient.id, mentor_id: newRequest.mentor_id,
    goal_id: "goal-1", message: "Hai ricevuto una nuova proposta di percorso.", link: "/requests",
  },
};

async function setupRequests(page: Page) {
  let hasNewRequest = false;
  let requestsReads = 0;
  await page.route("**/api/backend/**", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: recipient }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: {
    user_id: recipient.id, level: "L2", is_coach: true, latest_answer_id: "answer-1",
  } }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: {
    balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: "coin",
  } }));
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: hasNewRequest ? [newNotification] : [] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => {
    requestsReads += 1;
    return route.fulfill({ json: hasNewRequest ? [rejectedRequest, newRequest] : [rejectedRequest] });
  });
  return {
    receiveProposal: () => { hasNewRequest = true; },
    reads: () => requestsReads,
  };
}

test.beforeEach(async ({ baseURL, context }) => {
  await context.addCookies([{ name: "socra_session", value: "freshness-test", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
});

test("the proposal banner opens fresh received requests after the existing shell poll", async ({ page }) => {
  const backend = await setupRequests(page);
  let documentLoads = 0;
  page.on("load", () => { documentLoads += 1; });
  await page.clock.install();
  await page.goto("/requests?tab=sent");
  await expect(page.getByRole("tab", { name: "Inviate (0)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Ricevute (1)" })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText("Nessuna richiesta");
  const readsBeforeProposal = backend.reads();

  backend.receiveProposal();
  await page.clock.fastForward(60_000);
  const banner = page.getByRole("status", { name: "Nuova proposta" });
  await expect(banner).toBeVisible();
  await banner.getByRole("link", { name: "Vedi proposte" }).click();

  await expect(page.getByRole("tab", { name: "Ricevute (2)" })).toHaveAttribute("aria-selected", "true");
  const requests = page.getByRole("tabpanel");
  await expect(requests.getByRole("heading", { name: "Jacopo" })).toBeVisible();
  await expect(requests.getByRole("heading", { name: "Marco" })).toBeVisible();
  await expect(requests.getByRole("button", { name: "Accetta" })).toBeEnabled();
  await expect(requests.getByRole("button", { name: "Rifiuta" })).toBeEnabled();
  expect(documentLoads).toBe(1);
  expect(backend.reads()).toBe(readsBeforeProposal + 1);
});

test("returning to the visible tab updates a mounted received list without another poller", async ({ page }) => {
  const backend = await setupRequests(page);
  await page.goto("/requests");
  await expect(page.getByRole("heading", { name: "Marco" })).toBeVisible();
  const readsBeforeProposal = backend.reads();

  backend.receiveProposal();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("status", { name: "Nuova proposta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jacopo" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Ricevute (2)" })).toHaveAttribute("aria-selected", "true");
  expect(backend.reads()).toBe(readsBeforeProposal + 1);
});

test("pending proposals in legacy matching open the sent tab", async ({ page }) => {
  await setupRequests(page);
  const sentRequest = { ...newRequest, initiator_role: "mentee" };
  const goal = { ...rejectedRequest.goal, is_active: true };
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: goal, goals: [goal] } }));
  await page.route("**/api/backend/matching/requests/me?role=mentee", route => route.fulfill({ json: [sentRequest] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [sentRequest] }));
  await page.route("**/api/backend/matching/candidates", route => route.fulfill({ json: [] }));
  await page.goto("/matching?goalId=goal-1");

  const manageProposal = page.getByRole("link", { name: "Gestisci la proposta" });
  await expect(manageProposal).toHaveAttribute("href", "/requests?tab=sent");
  await expect(page.getByRole("link", { name: "Vedi la richiesta in attesa" })).toHaveAttribute("href", "/requests?tab=sent");
  await manageProposal.click();
  await expect(page.getByRole("tab", { name: "Inviate (1)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Jacopo" })).toBeVisible();
});

test("a pending mentor offer in legacy matching opens the received tab", async ({ page }) => {
  await setupRequests(page);
  const goal = { ...rejectedRequest.goal, is_active: true };
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: goal, goals: [goal] } }));
  await page.route("**/api/backend/matching/requests/me?role=mentee", route => route.fulfill({ json: [newRequest] }));
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [newRequest] }));
  await page.route("**/api/backend/matching/candidates", route => route.fulfill({ json: [] }));
  await page.goto("/matching?goalId=goal-1");

  const manageProposal = page.getByRole("link", { name: "Gestisci la proposta" });
  await expect(manageProposal).toHaveAttribute("href", "/requests?tab=received");
  await expect(page.getByRole("link", { name: "Vedi la richiesta in attesa" })).toHaveAttribute("href", "/requests?tab=received");
  await manageProposal.click();
  await expect(page.getByRole("tab", { name: "Ricevute (1)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("button", { name: "Accetta" })).toBeEnabled();
});

test("a slow initial wallet read cannot restore requests superseded after refocus", async ({ page }) => {
  const backend = await setupRequests(page);
  let releaseWallet!: () => void;
  const walletReady = new Promise<void>(resolve => { releaseWallet = resolve; });
  await page.route("**/api/backend/wallet/me", async route => {
    await walletReady;
    await route.fulfill({ json: {
      balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: "coin",
    } });
  });
  await page.goto("/requests");
  try {
    await expect(page.getByRole("tab", { name: "Ricevute (1)" })).toBeVisible();
    backend.receiveProposal();
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByRole("status", { name: "Nuova proposta" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Ricevute (2)" })).toBeVisible();
  } finally {
    releaseWallet();
  }
  await expect(page.getByRole("heading", { name: "Jacopo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Marco" })).toBeVisible();
});

test("opening a sent request profile preserves the sent tab on return", async ({ page }) => {
  await setupRequests(page);
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [
    { ...newRequest, initiator_role: "mentee" },
  ] }));
  await page.route("**/api/backend/profiles/new-mentor", route => route.fulfill({ json: {
    user_id: "new-mentor", nickname: "Jacopo", path_cost: 1, is_coach: true,
    completed_paths: 0, public_badges: [], top_topics: [], aggregate_metrics: {},
  } }));
  await page.goto("/requests?tab=sent");
  await expect(page.getByRole("tab", { name: "Inviate (1)" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Profilo di Jacopo" }).click();
  await expect(page.getByRole("heading", { name: "Jacopo", exact: true, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Torna alle proposte", exact: true }).first().click();

  await expect(page.getByRole("tab", { name: "Inviate (1)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Jacopo" })).toBeVisible();
});

test("a cold request mount keeps the newest snapshot when auth settles before a slow wallet", async ({ page }) => {
  const backend = await setupRequests(page);
  let holdAuth = false;
  let holdWallet = false;
  let heldAuthReads = 0;
  let heldWalletReads = 0;
  let releaseAuth!: () => void;
  let releaseWallet!: () => void;
  const authReady = new Promise<void>(resolve => { releaseAuth = resolve; });
  const walletReady = new Promise<void>(resolve => { releaseWallet = resolve; });
  await page.route("**/api/backend/auth/me", async route => {
    if (holdAuth) { heldAuthReads += 1; await authReady; }
    await route.fulfill({ json: recipient });
  });
  await page.route("**/api/backend/wallet/me", async route => {
    if (holdWallet) { heldWalletReads += 1; await walletReady; }
    await route.fulfill({ json: {
      balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: "coin",
    } });
  });
  await page.goto("/requests");
  await expect(page.getByRole("heading", { name: "Marco" })).toBeVisible();
  // Keep the verified layout mounted, then invalidate its cache before mounting Requests again.
  await page.locator('a[href="/wallet"]:visible').first().click();
  await expect(page.getByRole("heading", { name: "Crediti Socra" })).toBeVisible();
  holdAuth = true;
  holdWallet = true;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect.poll(() => heldAuthReads).toBe(1);
  await page.getByRole("link", { name: "Richieste", exact: true }).filter({ visible: true }).first().click();

  try {
    await expect.poll(() => heldWalletReads).toBe(1);
    await expect(page.getByRole("tab", { name: "Ricevute (0)" })).toBeVisible();
    await expect(page.getByText("Caricamento richieste…", { exact: true })).toBeVisible();
    await page.evaluate(() => {
      const snapshots: Array<{ userId: string; requestIds: string[] }> = [];
      Reflect.set(window, "requestFreshnessSnapshots", snapshots);
      window.addEventListener("socra:requests-updated", event => {
        const snapshot = (event as CustomEvent<{ userId: string; requests: Array<{ id: string }> }>).detail;
        snapshots.push({ userId: snapshot.userId, requestIds: snapshot.requests.map(request => request.id) });
      });
    });
    holdAuth = false;
    releaseAuth();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, "requestFreshnessSnapshots"))).toContainEqual({
      userId: recipient.id, requestIds: [rejectedRequest.id],
    });
    backend.receiveProposal();
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect.poll(() => page.evaluate(() => Reflect.get(window, "requestFreshnessSnapshots"))).toContainEqual({
      userId: recipient.id, requestIds: [rejectedRequest.id, newRequest.id],
    });
    await expect(page.getByRole("status", { name: "Nuova proposta" })).toBeVisible();
  } finally {
    releaseAuth();
    releaseWallet();
  }
  await expect(page.getByText("Caricamento richieste…", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Jacopo" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Ricevute (2)" })).toHaveAttribute("aria-selected", "true");
});
