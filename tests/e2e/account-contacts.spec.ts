import { expect, test, type Page, type BrowserContext } from "@playwright/test";

const user = {
  id: "u1", username: "internal-user", email: "giulia@example.com", nickname: "Giulia",
  level: "L1", is_coach: true, role: "user", account_status: "active",
  email_verified: false, email_verification_required: false, email_delivery_enabled: false,
};
const goal = { id: "g1", topic: "ETF e fondi", goal_tag: "Capire gli ETF", is_active: true };
const path = {
  id: "p1", status: "open", mentor_id: "u2", mentee_id: "u1", goal_id: "g1", goal,
  mentor: { user_id: "u2", nickname: "Anna", level: "L2", is_coach: true },
  mentee: { user_id: "u1", nickname: "Giulia", level: "L1", is_coach: true },
  contacts: null, contact_sharing: { self_accepted: false, other_accepted: false },
};

async function session(page: Page, context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: "socra_session", value: "test-token", url: baseURL, httpOnly: true }]);
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: user }));
  await page.route("**/api/backend/surveys/onboarding/me", route => route.fulfill({ json: { latest_answer_id: "a1" } }));
  await page.route("**/api/backend/surveys/competences-v2/me", route => route.fulfill({ json: null }));
  await page.route("**/api/backend/notifications/me", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/wallet/me", route => route.fulfill({ json: { balance: 10, debt: 0, currency_label: "crediti" } }));
  await page.route("**/api/backend/goals/me", route => route.fulfill({ json: { current: goal, goals: [goal] } }));
  await page.route("**/api/backend/matching/requests/me?**", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/paths/me", route => route.fulfill({ json: [] }));
  await page.route("**/api/backend/calls/capabilities", route => route.fulfill({ json: { google_meet_available: false } }));
  await page.route("**/api/backend/calls/first-session/room?**", route => route.fulfill({ status: 404, json: { detail: "Call room not found" } }));
}

test("registration collects only email password and essential consent", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let posted: unknown;
  await page.route("**/api/auth/register", route => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { user_id: "u1" } });
  });
  await page.goto("/register");
  await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel(/Nome visibile/)).toHaveCount(0);
  await page.getByLabel("Email", { exact: true }).fill("giulia@example.com");
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel(/almeno 18 anni/).check();
  await page.getByRole("button", { name: "Crea account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  expect(posted).toEqual({ email: "giulia@example.com", password: "StrongPass123", consent_essential: true });
});

test("verification uses fragment in memory and removes it before confirming", async ({ page }) => {
  let posted: unknown;
  await page.route("**/api/auth/email-verification/confirm", route => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { status: "ok" } });
  });
  await page.goto("/verify-email#token=local-verification-token");
  await expect.poll(() => new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: "Conferma email" }).click();
  await expect(page.getByRole("status")).toContainText("Email verificata");
  expect(posted).toEqual({ token: "local-verification-token" });
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("local-verification-token");
});

test("expired verification link explains how to recover without revealing the token", async ({ page }) => {
  await page.route("**/api/auth/email-verification/confirm", route => route.fulfill({ status: 400, json: { detail: "Invalid or expired token" } }));
  await page.goto("/verify-email#token=expired-local-token");
  await page.getByRole("button", { name: "Conferma email" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/link.*scaduto/i);
  await expect(page.getByRole("link", { name: "Vai al tuo account" })).toHaveAttribute("href", "/settings");
  await expect(page.locator("body")).not.toContainText("expired-local-token");
});

test("password recovery is nonenumerating and reset consumes only fragment token", async ({ page }) => {
  let reset: unknown;
  await page.route("**/api/auth/password-reset/request", route => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/api/auth/password-reset/confirm", route => {
    reset = route.request().postDataJSON();
    return route.fulfill({ json: { status: "ok" } });
  });
  await page.goto("/login");
  await page.getByRole("link", { name: "Password dimenticata?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("unknown@example.com");
  await page.getByRole("button", { name: "Richiedi recupero" }).click();
  await expect(page.getByRole("status")).toContainText("Se esiste un account");
  await page.goto("/reset-password#token=local-reset-token");
  await expect.poll(() => new URL(page.url()).hash).toBe("");
  await page.getByLabel("Nuova password", { exact: true }).fill("ChangedPass123");
  await page.getByRole("button", { name: "Salva nuova password" }).click();
  await expect(page.getByRole("status")).toContainText("Password aggiornata");
  expect(reset).toEqual({ token: "local-reset-token", password: "ChangedPass123" });
});

test("profile edits name bio and optional photo without claiming a disabled email was sent", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let profile = { user_id: "u1", nickname: "Giulia", bio: "", avatar_url: null as string | null };
  let patch: unknown;
  let avatar: unknown;
  await page.route("**/api/backend/profiles/me", route => {
    if (route.request().method() === "PATCH") {
      patch = route.request().postDataJSON();
      profile = { ...profile, ...(patch as { nickname: string; bio: string }) };
    }
    return route.fulfill({ json: profile });
  });
  await page.route("**/api/backend/profiles/me/avatar", route => {
    avatar = route.request().method() === "PUT" ? route.request().postDataJSON() : null;
    profile = { ...profile, avatar_url: route.request().method() === "PUT" ? "/api/backend/profiles/u1/avatar" : null };
    return route.fulfill({ json: profile });
  });
  await page.goto("/settings");
  await page.getByLabel("Nome nella community").fill("Giulia ETF");
  await page.getByLabel("Presentazione breve").fill("Imparo confrontandomi con la community.");
  await page.getByRole("button", { name: "Salva profilo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profilo aggiornato" })).toBeVisible();
  expect(patch).toEqual({ nickname: "Giulia ETF", bio: "Imparo confrontandomi con la community." });
  await page.getByLabel("Foto del profilo").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: Buffer.from("image-test") });
  await expect(page.getByRole("button", { name: "Rimuovi foto" })).toBeVisible();
  expect(avatar).toEqual({ image_data_url: "data:image/png;base64,aW1hZ2UtdGVzdA==" });
  await page.getByRole("button", { name: "Rimuovi foto" }).click();
  await expect(page.getByRole("button", { name: "Rimuovi foto" })).toHaveCount(0);
  await expect(page.getByText(/invio email è disattivato/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Invia link di verifica" })).toBeDisabled();
});

test("sending a request requires a separate email sharing checkbox", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let posted: unknown;
  await page.route("**/api/backend/matching/candidates", route => route.fulfill({ json: [{
    mentor_id: "u2", nickname: "Anna", level: "L2", path_cost: 1, match_score: 80,
    is_recommended: true, reason_summary: "Esperienza sugli ETF.",
  }] }));
  await page.route("**/api/backend/matching/requests", route => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { id: "r1", status: "pending" } });
  });
  await page.goto("/matching?goalId=g1");
  await page.getByRole("button", { name: "Invia richiesta al mentor" }).click();
  await page.getByLabel("Il tuo messaggio", { exact: true }).fill("Vorrei capire come scegliere un primo ETF.");
  const send = page.getByRole("button", { name: "Invia", exact: true });
  await expect(send).toBeDisabled();
  await page.getByRole("checkbox", { name: /condivisione.*email/i }).check();
  await send.click();
  await expect(page.getByRole("status").filter({ hasText: "48 ore" })).toBeVisible();
  expect(posted).toEqual({ mentor_id: "u2", goal_id: "g1", alignment_message: "Vorrei capire come scegliere un primo ETF.", email_sharing_accepted: true });
});

test("acceptance requires recipient consent and blocks legacy sender missing consent", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let accepted: unknown;
  let senderAccepted = false;
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{
    id: "r1", status: "pending", mentor_id: "u2", mentee_id: "u1", initiator_role: "mentor",
    goal_id: "g1", goal, expires_at: "2026-09-30T12:00:00Z", email_sharing_accepted: senderAccepted,
    mentor: path.mentor, mentee: path.mentee, cost_at_request: 1,
  }] }));
  await page.route("**/api/backend/matching/requests/r1/respond", route => {
    accepted = route.request().postDataJSON();
    return route.fulfill({ json: { id: "p1", status: "open" } });
  });
  await page.goto("/requests");
  await expect(page.getByRole("button", { name: "Accetta", exact: true })).toBeDisabled();
  await expect(page.getByText(/mittente deve confermare/i)).toBeVisible();
  senderAccepted = true;
  await page.reload();
  await page.getByRole("button", { name: "Accetta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Conferma", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /condivisione.*email/i }).check();
  await page.getByRole("button", { name: "Conferma", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "percorso è aperto" })).toBeVisible();
  expect(accepted).toEqual({ accept: true, email_sharing_accepted: true });
});

test("legacy path never exposes contacts until both accept and then renders mailto links", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let selfAccepted = false;
  let otherAccepted = false;
  await page.route("**/api/backend/paths/p1", route => route.fulfill({ json: {
    ...path, contact_sharing: { self_accepted: selfAccepted, other_accepted: otherAccepted },
    contacts: selfAccepted && otherAccepted ? {
      mentor: { user_id: "u2", display_name: "Anna", email: "anna@example.com" },
      mentee: { user_id: "u1", display_name: "Giulia", email: "giulia@example.com" }, shared_at: "2026-09-26T12:00:00Z",
    } : null,
  } }));
  await page.route("**/api/backend/paths/p1/email-sharing", route => {
    expect(route.request().postDataJSON()).toEqual({ accepted: true });
    selfAccepted = true;
    return route.fulfill({ json: { status: "ok" } });
  });
  await page.goto("/paths/p1");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: /condivisione.*email/i }).check();
  await page.getByRole("button", { name: "Conferma condivisione" }).click();
  await expect(page.getByText(/attesa della conferma dell’altra persona/i)).toBeVisible();
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  otherAccepted = true;
  await page.reload();
  await expect(page.getByRole("link", { name: "anna@example.com" })).toHaveAttribute("href", "mailto:anna@example.com");
  await expect(page.getByRole("link", { name: "giulia@example.com" })).toHaveAttribute("href", "mailto:giulia@example.com");
});

test("accounts without a community name never display their internal username", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  await page.route("**/api/backend/auth/me", route => route.fulfill({ json: { ...user, nickname: null } }));
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Ciao utente Socra/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("internal-user");
  await expect(page.getByRole("link", { name: "Completa il tuo profilo" })).toHaveAttribute("href", "/settings");
});

test("public authenticated profile renders only community bio and sanitized photo", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  const avatar = "data:image/jpeg;base64,/9j/2Q==";
  await page.route("**/api/backend/profiles/u2", route => route.fulfill({ json: {
    user_id: "u2", nickname: "Anna", bio: "Condivido la mia esperienza con gli ETF.", avatar_url: avatar,
    path_cost: 1, is_coach: false, completed_paths: 0, public_badges: [], top_topics: [], aggregate_metrics: {},
  } }));
  await page.goto("/profiles/u2?from=requests");
  await expect(page.getByText("Condivido la mia esperienza con gli ETF.")).toBeVisible();
  await expect(page.locator(".profile-hero img")).toHaveAttribute("src", avatar);
  await expect(page.locator(".profile-page")).not.toContainText(user.email);
});

test("own legacy pending proposal asks for sender consent without sharing an address", async ({ page, context, baseURL }) => {
  await session(page, context, baseURL!);
  let senderAccepted = false;
  await page.route("**/api/backend/matching/requests/me?role=all", route => route.fulfill({ json: [{
    id: "r1", status: "pending", mentor_id: "u1", mentee_id: "u2", initiator_role: "mentor",
    goal_id: "g1", goal, expires_at: "2026-09-30T12:00:00Z", email_sharing_accepted: senderAccepted,
    mentor: path.mentee, mentee: path.mentor,
  }] }));
  await page.route("**/api/backend/matching/requests/r1/email-sharing", route => {
    expect(route.request().postDataJSON()).toEqual({ accepted: true });
    senderAccepted = true; return route.fulfill({ json: { status: "ok" } });
  });
  await page.goto("/requests?tab=sent");
  await page.getByRole("button", { name: "Conferma condivisione email" }).click();
  await expect(page.getByRole("button", { name: "Conferma", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /condivisione.*email/i }).check();
  await page.getByRole("button", { name: "Conferma", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Condivisione email confermata");
  await expect(page.locator(".requests-list")).not.toContainText(user.email);
});
