import { expect, test, type Page } from "@playwright/test";

async function setup(page: Page, baseURL: string, role: "mentee" | "mentor" = "mentee", completed = false) {
  const userId = role === "mentee" ? "learner" : "mentor";
  await page.context().addCookies([{ name: "socra_session", value: "local-test", url: baseURL, httpOnly: true }]);
  let closed = completed;
  const path = () => ({
    id: "flow-path", mentor_id: "mentor", mentee_id: "learner", goal_id: "g1",
    status: completed ? "completed" : closed ? "feedback_pending" : "open",
    first_call_completed: false, [`${role}_closed_at`]: closed ? "2026-10-22T10:00:00Z" : null,
    mentor: { user_id: "mentor", nickname: "Anna" }, mentee: { user_id: "learner", nickname: "Luca" },
    goal: { id: "g1", topic: "ETF", goal_tag: "Comprendere gli ETF" },
    contact_sharing: { self_accepted: true, other_accepted: true },
    contacts: { mentor: { display_name: "Anna", email: "anna@example.com" }, mentee: { display_name: "Luca", email: "luca@example.com" } },
    mentee_feedback_submitted: completed, mentor_feedback_submitted: completed, goal_review_completed: completed,
  });
  await page.route("**/api/backend/**", route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace("/api/backend", "");
    if (endpoint === "/auth/me") return route.fulfill({ json: { id: userId, username: role, nickname: "Luca", email: "luca@example.com", role: "user", is_coach: true, account_status: "active", email_verified: true, email_delivery_enabled: true } });
    if (endpoint === "/surveys/onboarding/me") return route.fulfill({ json: { latest_answer_id: "a1" } });
    if (endpoint.startsWith("/skills/")) return route.fulfill({ status: 404, json: { detail: "Not Found" } });
    if (endpoint === "/surveys/competences-v2/me") return route.fulfill({ json: null });
    if (endpoint === "/wallet/me") return route.fulfill({ json: { balance: 2, available_balance: 2, advance_available: 0, advance_used: 0, currency_label: "crediti" } });
    if (endpoint === "/goals/me") return route.fulfill({ json: { current: path().goal, goals: [path().goal] } });
    if (endpoint === "/paths/flow-path") return route.fulfill({ json: path() });
    if (endpoint === "/paths/flow-path/close-side") { closed = true; return route.fulfill({ json: path() }); }
    if (endpoint === "/calls/capabilities") return route.fulfill({ json: { google_meet_available: true } });
    if (endpoint === "/calls/first-session/room") return route.fulfill({ status: 404, json: { detail: "Call room not found" } });
    return route.fulfill({ json: [] });
  });
}

for (const role of ["mentee", "mentor"] as const) {
  test(`${role} can close before the first meeting and reach own feedback`, async ({ page, baseURL }) => {
    await setup(page, baseURL!, role);
    await page.goto("/paths/flow-path");
    await page.getByRole("button", { name: "Chiudi il percorso", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Conferma", exact: true }).click();
    await expect(page.getByRole("link", { name: /Lascia feedback/ })).toHaveAttribute("href", `/feedback/flow-path/${role}`);
  });
}

test("missing Meet link is prepared automatically once and displayed as a usable link", async ({ page, baseURL }) => {
  await setup(page, baseURL!);
  let creates = 0;
  const room = { id: "room1", path_id: "flow-path", status: "active", join_url: "https://meet.google.com/abc-defg-hij" };
  await page.route("**/api/backend/calls/first-session/room**", route => {
    if (route.request().method() === "POST") { creates++; return route.fulfill({ json: room }); }
    return route.fulfill(creates ? { json: room } : { status: 404, json: { detail: "Call room not found" } });
  });
  await page.goto("/paths/flow-path");
  await expect(page.getByRole("link", { name: "Apri Google Meet", exact: true })).toHaveAttribute("href", room.join_url);
  expect(creates).toBe(1);
  await page.reload();
  await expect(page.getByRole("link", { name: "Apri Google Meet", exact: true })).toBeVisible();
  expect(creates).toBe(1);
  expect(page.context().pages()).toHaveLength(1);
});

test("Meet failure leaves closure and contacts usable and offers a retry", async ({ page, baseURL }) => {
  await setup(page, baseURL!);
  await page.route("**/api/backend/calls/first-session/room", route => route.fulfill({ status: 503, json: { detail: "Meet unavailable" } }));
  await page.goto("/paths/flow-path");
  await expect(page.getByRole("button", { name: "Riprova link Meet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chiudi il percorso", exact: true })).toBeEnabled();
  await expect(page.locator('a[href="mailto:anna@example.com"]')).toBeVisible();
});

test("completed paths never create a new Meet room", async ({ page, baseURL }) => {
  await setup(page, baseURL!, "mentee", true);
  let creates = 0;
  await page.route("**/api/backend/calls/first-session/room**", route => {
    if (route.request().method() === "POST") creates++;
    return route.fulfill({ status: 404, json: { detail: "Call room not found" } });
  });
  await page.goto("/paths/flow-path");
  await expect(page.getByText("Riunione chiusa", { exact: true })).toBeVisible();
  expect(creates).toBe(0);
});
