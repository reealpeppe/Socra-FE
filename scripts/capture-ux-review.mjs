import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { backend, criteria, fingerprint, hash, loopback, root } from "./ux-review-common.mjs";

const baseURL = loopback(process.env.UX_BASE_URL || "http://localhost:3133");
assert.ok(process.env.UX_RUNTIME_RECEIPT, "Use npm run test:ux:capture to build and launch fresh managed servers");
const runtime = JSON.parse(await readFile(process.env.UX_RUNTIME_RECEIPT, "utf8"));
assert.equal(runtime.kind, "managed_fresh");
assert.equal(runtime.frontend_url, baseURL);
assert.equal(runtime.source_fingerprint, await fingerprint());
const fixture = JSON.parse(await readFile(path.join(backend, ".local", "ux-review-fixture.json"), "utf8"));
assert.equal(fixture.fixture, "socra-local-ux-v2-long-names");
assert.equal(path.resolve(fixture.database), path.join(backend, ".local", "skills-preview.sqlite3"));
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const directory = path.join(root, "output", "playwright", "ux-review", runId);
await mkdir(directory, { recursive: true });
const manifest = { run_id: runId, created_at: new Date().toISOString(), base_url: baseURL,
  source_fingerprint: await fingerprint(), technical_status: "running", fixture: fixture.fixture,
  limitations: ["Local SQLite fixture; no real email/call provider; no production verification", "Technical capture does not constitute a semantic UX pass"],
  runtime, artifacts: [], checks: [], errors: [] };
const review = { run_id: runId, source_fingerprint: manifest.source_fingerprint, status: "pending",
  reviewer: { kind: "llm", name: "" }, criteria: ["desktop", "mobile"].flatMap(viewport => criteria.map(id => ({ id, viewport, score: null, rationale: "", evidence: [] }))), issues: [] };
async function json(file, data) {
  const bytes = Buffer.from(JSON.stringify(data, null, 2));
  await writeFile(path.join(directory, file), bytes);
  manifest.artifacts.push({ file, sha256: hash(bytes) });
}
async function api(context, endpoint, options = {}) {
  const response = await context.pages()[0].evaluate(async ({ endpoint, options }) => {
    const result = await fetch(`/api/backend${endpoint}`, { method: options.method || "GET", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, ...(options.data ? { body: JSON.stringify(options.data) } : {}) });
    return { ok: result.ok, status: result.status, body: await result.json() };
  }, { endpoint, options });
  assert.ok(response.ok, `${endpoint}: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body;
}
async function login(context, actor) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Username o email", { exact: true }).fill(fixture.users[actor].username);
  await page.getByLabel("Password", { exact: true }).fill("SocraDemo2026!");
  await page.getByRole("button", { name: "Accedi", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const user = await api(context, "/auth/me");
  assert.equal(user.id, fixture.users[actor].id, "BFF is not connected to the seeded local fixture; refusing mutations");
}
const browser = await chromium.launch({ channel: "chrome" });
const mentor = await browser.newContext({ baseURL });
try {
  await login(mentor, "mentor");
  // Recover only this fixture's pending requests left by an interrupted capture.
  for (const request of await api(mentor, "/matching/requests/me?role=mentor")) {
    if (request.status === "pending" && request.mentee_id === fixture.users.learner.id) await api(mentor, `/matching/requests/${request.id}/respond`, { method: "POST", data: { accept: false, reason: "Chiusura della richiesta sintetica UX locale." } });
  }
  for (const [viewportName, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
    await login(context, "learner");
    const page = context.pages()[0];
    page.setDefaultTimeout(20000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const trace = [];
    async function capture(scenario, intent, facts = {}) {
      await page.evaluate(() => document.fonts.ready);
      const file = `${viewportName}-${scenario}`;
      const bytes = await page.screenshot({ fullPage: true, animations: "disabled" });
      await writeFile(path.join(directory, `${file}.png`), bytes);
      manifest.artifacts.push({ file: `${file}.png`, sha256: hash(bytes) });
      const viewportBytes = await page.screenshot({ animations: "disabled" });
      await writeFile(path.join(directory, `${file}-viewport.png`), viewportBytes);
      manifest.artifacts.push({ file: `${file}-viewport.png`, sha256: hash(viewportBytes) });
      const overflow = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      const clipped = await page.evaluate(() => {
        const issues = [];
        const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden" && !element.closest('[aria-hidden="true"]');
        for (const element of document.querySelectorAll('main h1, main section, main article, main form, main details, main .card, main button, main a.button, main progress, main input, main select, main textarea, main .settings-field-value')) {
          if (!visible(element)) continue;
          const rect = element.getBoundingClientRect();
          if (rect.left < -1 || rect.right > innerWidth + 1) issues.push({ element: element.tagName, label: element.textContent?.trim().slice(0, 80), left: rect.left, right: rect.right });
        }
        for (const heading of document.querySelectorAll('main h1, main h2, main h3')) {
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim() || !visible(node.parentElement)) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const rect of range.getClientRects()) if (rect.left < -1 || rect.right > innerWidth + 1) issues.push({ element: 'heading-text', left: rect.left, right: rect.right });
          }
        }
        return issues;
      });
      const entry = { scenario, intent, viewport, url: page.url(), facts, actions: [...trace], overflow,
        clipped_elements: clipped,
        visible_text: await page.locator("body").innerText(), accessibility: await page.locator("body").ariaSnapshot() };
      await json(`${file}.json`, entry);
      assert.ok(overflow.content <= overflow.viewport + 1, `Horizontal overflow: ${file}`);
      assert.deepEqual(clipped, [], `Clipped content despite hidden document overflow: ${file}`);
      manifest.checks.push({ viewport: viewportName, scenario, status: "passed" });
      console.log(`${viewportName}: ${scenario}`);
    }
    const before = await api(context, "/skills/me");
    assert.equal(before.mentor_available, false);
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Vedi i percorsi", exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", String(before.known_skills.filter(code => code.startsWith("etf_")).length));
    await capture("dashboard", "Comprendere i tre obiettivi e distinguere apprendimento, percorsi come mentor e preparazione senza sovraccarico.");
    await page.getByRole("link", { name: "Vedi i percorsi", exact: true }).click();
    await expect(page).toHaveURL(/\/paths\?tab=mentor$/);
    await expect(page.getByText(fixture.users.peer.nickname, { exact: false }).first()).toBeVisible();
    trace.push({ action: "Dashboard → Vedi i percorsi", actual_url: page.url(), mentor_paused: true });
    await capture("mentor-paths", "Consultare un percorso già esistente come mentor in pausa.");

    await page.goto("/competenze");
    await expect(page.getByRole("heading", { name: "Rivedi ciò che sai fare" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "So: Leggere e comprendere un ETF", exact: true })).toBeChecked();
    await expect(page.getByText("Qual è la tua situazione professionale?", { exact: true })).toHaveCount(0);
    await capture("experience", "Ritrovare le risposte precompilate, barre per argomento e offerte distinte; nessuna domanda economica nel compito.", { known_skills: before.known_skills, mentor_skills: before.mentor_skills });
    // A real edit, persisted and subsequently reopened; alternate to keep reruns useful.
    const change = page.getByRole("checkbox", { name: "So: Impostare un PAC con ETF", exact: true });
    await change.setChecked(!before.known_skills.includes("etf_pac"));
    await page.getByRole("checkbox", { name: "Confermo le attività indicate, anche se non ne ho selezionata nessuna." }).check();
    await page.getByRole("button", { name: "Conferma le risposte", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("status").filter({ hasText: /esperienza.*aggiornata/i })).toBeVisible();
    const saved = await api(context, "/skills/me");
    assert.equal(saved.known_skills.includes("etf_pac"), !before.known_skills.includes("etf_pac"));
    assert.equal(saved.mentor_available, false);
    assert.deepEqual(saved.section_d, before.section_d);
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", String(saved.known_skills.filter(code => code.startsWith("etf_")).length));
    trace.push({ action: "Modifica esperienza → Conferma le risposte", actual_url: page.url(), persisted: true, private_context_preserved: true, mentor_paused: true });
    await capture("experience-saved", "Conferma visibile e ritorno alla dashboard dopo il salvataggio.");
    await page.goto("/competenze");
    await expect(page.getByRole("heading", { name: "Rivedi ciò che sai fare" })).toBeVisible();
    assert.equal(await change.isChecked(), saved.known_skills.includes("etf_pac"));
    trace.push({ action: "Riapertura esperienza", saved_selection_still_checked: true });

    await page.goto("/settings");
    await page.getByText("Contesto personale", { exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Qual è la tua situazione professionale?", exact: true })).toBeVisible();
    const select = page.getByRole("combobox", { name: "Qual è la tua situazione professionale?", exact: true });
    const choices = await select.locator("option").evaluateAll(options => options.map(option => option.value).filter(Boolean));
    const next = choices.find(value => value !== saved.section_d.D1);
    await select.selectOption(next);
    for (let i = 2; i <= 5; i++) await page.locator(`select[name=D${i}]`).selectOption("undisclosed");
    await page.getByRole("button", { name: "Salva contesto personale", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Contesto personale aggiornato." })).toBeVisible();
    const withContext = await api(context, "/skills/me");
    assert.deepEqual(withContext.known_skills, saved.known_skills);
    assert.deepEqual(withContext.mentor_skills, saved.mentor_skills);
    assert.equal(withContext.mentor_available, false);
    assert.equal(withContext.section_d.D1, next);
    trace.push({ action: "Impostazioni → Contesto personale → Salva", skills_and_pause_preserved: true });
    await capture("private-context", "Dati privati facoltativi in una sezione distinta delle impostazioni, salvataggio indipendente.");

    await page.goto("/matching");
    const card = page.getByRole("article").filter({ hasText: fixture.users.mentor.nickname });
    await expect(card).toBeVisible();
    const candidates = await api(context, "/matching/candidates", { method: "POST", data: { goal_id: fixture.goal_id } });
    const candidate = candidates.find(item => item.mentor_id === fixture.users.mentor.id);
    assert.ok(candidate);
    assert.equal(candidate.coverage_count, 2);
    assert.equal(candidate.requested_count, 3);
    assert.notEqual(Math.round(candidate.match_score), Math.round(100 * 2 / 3));
    await expect(card.getByText(`${Math.round(candidate.match_score)}%`, { exact: true })).toBeVisible();
    await capture("matching", "Confrontare compatibilità e copertura; capire tema, obiettivi e modalità.", { candidate: { nickname: candidate.nickname, match_score: candidate.match_score, coverage_count: 2, requested_count: 3 } });
    await card.getByText("Su cosa potete lavorare", { exact: true }).click();
    await capture("partial-details", "Scoprire le attività affrontabili e quella esclusa senza scambiare copertura per disponibilità.");
    await card.getByRole("button", { name: "Invia richiesta al mentor", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("checkbox", { name: "Leggere e comprendere un ETF", exact: true }).check();
    await dialog.getByLabel("Il tuo messaggio").fill("Vorrei leggere insieme una scheda ETF e comprendere i suoi dati principali.");
    await dialog.getByRole("checkbox", { name: /email/ }).check();
    const controlsBytes = await page.screenshot({ animations: "disabled" });
    const controlsFile = `${viewportName}-agreement-controls.png`;
    await writeFile(path.join(directory, controlsFile), controlsBytes);
    manifest.artifacts.push({ file: controlsFile, sha256: hash(controlsBytes) });
    await dialog.evaluate(element => { element.scrollTop = 0; });
    await capture("agreement", "Proporre esplicitamente una sola attività del sottoinsieme compatibile.", { chosen: ["etf_read"] });
    await dialog.getByRole("button", { name: "Invia", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const requests = await api(context, "/matching/requests/me?role=mentee");
    const sent = requests.find(item => item.mentor_id === fixture.users.mentor.id && item.status === "pending");
    assert.ok(sent, "Request was not persisted");
    assert.deepEqual(sent.agreed_objective_codes, ["etf_read"]);
    await page.goto("/requests?tab=sent");
    await expect(page.getByText(fixture.users.mentor.nickname, { exact: false }).first()).toBeVisible();
    trace.push({ action: "Invia proposta parziale → Richieste inviate", request_id: sent.id, agreed_objective_codes: sent.agreed_objective_codes, persisted: true });
    await capture("request-saved", "La richiesta salvata mantiene il sottoinsieme proposto e rende leggibile l'attività concordata.");
    await api(mentor, `/matching/requests/${sent.id}/respond`, { method: "POST", data: { accept: false, reason: "Fine della richiesta sintetica UX locale." } });
    await page.goto(`/profiles/${fixture.users.mentor.id}`);
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "4");
    await expect(page.getByText("Verifica compatibilità…", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Invia richiesta al mentor", exact: true })).toBeVisible();
    await capture("mentor-profile", "Leggere preparazione su due temi (4/6 e 2/6), distinta dalle due attività offerte.");
    assert.deepEqual(pageErrors, [], "Uncaught browser errors");
    await context.close();
  }
  assert.equal(await fingerprint(), manifest.source_fingerprint, "Sources changed during capture; repeat this run");
  manifest.technical_status = "passed";
} catch (error) {
  manifest.technical_status = "failed";
  manifest.errors.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(directory, "review.json"), JSON.stringify(review, null, 2));
  console.log(`Evidence: ${directory}\nSemantic review: pending (read docs/testing/ux-review.md)`);
}
