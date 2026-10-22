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
assert.equal(fixture.fixture, "socra-local-ux-v3-multi-goals");
assert.equal(path.resolve(fixture.database), path.join(backend, ".local", "skills-preview.sqlite3"));
fixture.users.learner_original = fixture.users.learner;
fixture.users.peer_original = fixture.users.peer;
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
    fixture.users.learner = viewportName === "mobile" ? fixture.users.learner_mobile : fixture.users.learner_original;
    fixture.users.peer = viewportName === "mobile" ? fixture.users.peer_mobile : fixture.users.peer_original;
    const context = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
    await login(context, "learner");
    const page = context.pages()[0];
    page.setDefaultTimeout(20000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const trace = [];
    async function capture(scenario, intent, facts = {}, targetPage = page) {
      await targetPage.evaluate(() => document.fonts.ready);
      if (scenario === 'context-four' || scenario === 'context-ready') {
        await targetPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await targetPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      }
      const file = `${viewportName}-${scenario}`;
      const bytes = await targetPage.screenshot({ fullPage: true, animations: "disabled" });
      await writeFile(path.join(directory, `${file}.png`), bytes);
      manifest.artifacts.push({ file: `${file}.png`, sha256: hash(bytes) });
      const viewportBytes = await targetPage.screenshot({ animations: "disabled" });
      await writeFile(path.join(directory, `${file}-viewport.png`), viewportBytes);
      manifest.artifacts.push({ file: `${file}-viewport.png`, sha256: hash(viewportBytes) });
      const overflow = await targetPage.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      const clipped = await targetPage.evaluate(() => {
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
      const entry = { scenario, intent, viewport, url: targetPage.url(), facts, actions: [...trace], overflow,
        clipped_elements: clipped,
        visible_text: await targetPage.locator("body").innerText(), accessibility: await targetPage.locator("body").ariaSnapshot() };
      await json(`${file}.json`, entry);
      assert.ok(overflow.content <= overflow.viewport + 1, `Horizontal overflow: ${file}`);
      assert.deepEqual(clipped, [], `Clipped content despite hidden document overflow: ${file}`);
      manifest.checks.push({ viewport: viewportName, scenario, status: "passed" });
      console.log(`${viewportName}: ${scenario}`);
    }
    const publicContext = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`${baseURL}/`);
    await expect(publicPage.getByRole("link", { name: "Accedi", exact: true }).first()).toBeVisible();
    await capture("public-entry", "L’accesso resta evidente e raggiungibile anche su schermo stretto.",
      { login_visible: true }, publicPage);
    await publicContext.close();
    const lockedContext = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
    await login(lockedContext, `profile_locked_${viewportName}`);
    const lockedPage = lockedContext.pages()[0];
    lockedPage.setDefaultTimeout(20000);
    lockedPage.on("pageerror", error => pageErrors.push(error.message));
    assert.equal(await api(lockedContext, "/skills/me"), null, "Locked persona must have no V4 experience profile");
    assert.ok((await api(lockedContext, "/surveys/onboarding/me")).latest_answer_id,
      "Locked persona must have completed the legacy onboarding survey");
    for (const [route, scenario] of [["/dashboard", "profile-locked-dashboard"], ["/settings", "profile-locked-settings"]]) {
      await lockedPage.goto(route);
      const banner = lockedPage.getByRole("complementary", { name: "Completa il tuo profilo" });
      await expect(banner).toBeVisible();
      await expect(banner.getByRole("button", { name: "Completa il profilo · 0/5" })).toBeVisible();
      await expect(banner.getByRole("button", { name: "Completa il profilo · 0/5" })).toBeDisabled();
      await expect(banner.getByRole("link", { name: "Prima completa la tua esperienza" })).toHaveAttribute("href", "/competenze");
      await capture(scenario, "Il contesto resta visibile ma non disponibile prima dell’esperienza; il passo richiesto è chiaro.",
        { onboarding_completed: true, skill_profile: null, context_button_disabled: true,
          experience_link: "/competenze" }, lockedPage);
    }
    await lockedContext.close();
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
    const help=page.getByRole('button',{name:'Cosa significa Posso aiutare?',exact:true});
    const beforeHelp=await api(context,'/skills/me');
    const selectedBefore=await page.getByRole('checkbox').evaluateAll(nodes=>nodes.map(node=>({name:node.getAttribute('aria-label'),checked:node.checked,disabled:node.disabled})));
    if(viewportName==='mobile')await help.tap();else{await help.focus();await help.press('Enter');}
    await expect(help).toHaveAttribute('aria-expanded','true');
    await expect(page.getByText(/Potrai ricevere richieste compatibili/)).toBeVisible();
    const afterHelp=await api(context,'/skills/me');
    const selectedAfter=await page.getByRole('checkbox').evaluateAll(nodes=>nodes.map(node=>({name:node.getAttribute('aria-label'),checked:node.checked,disabled:node.disabled})));
    assert.deepEqual(afterHelp,beforeHelp);assert.deepEqual(selectedAfter,selectedBefore);
    trace.push({action:'Cosa significa Posso aiutare → apertura spiegazione',interaction:viewportName==='mobile'?'touch':'keyboard Enter',aria_expanded:true,profile_unchanged:true,ui_selections_unchanged:true});
    await capture('offer-help','Spiegazione accessibile senza cambiare capacità o offerte.',{interaction:viewportName==='mobile'?'touch':'keyboard Enter',before_profile_version:beforeHelp.version,after_profile_version:afterHelp.version,mentor_available:afterHelp.mentor_available});
    // Capture the incomplete state before any optional context answers are saved.
    await page.goto('/dashboard');await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toBeVisible();
    await capture('profile-incomplete','Richiamo privato prima delle cinque risposte esplicite.');
    await page.goto('/competenze');await expect(page.getByRole('heading',{name:'Rivedi ciò che sai fare'})).toBeVisible();
    await capture("experience", "Ritrovare le risposte precompilate, barre per argomento e offerte distinte; nessuna domanda economica nel compito.", { known_skills: before.known_skills, mentor_skills: before.mentor_skills });
    // A real edit, persisted and subsequently reopened; alternate to keep reruns useful.
    const change = page.getByRole("checkbox", { name: "So: Impostare un PAC con ETF", exact: true });
    await change.setChecked(!before.known_skills.includes("etf_pac"));
    await page.getByRole("button", { name: "Conferma le risposte", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("status").filter({ hasText: /esperienza.*aggiornata/i })).toBeVisible();
    const saved = await api(context, "/skills/me");
    assert.equal(saved.known_skills.includes("etf_pac"), !before.known_skills.includes("etf_pac"));
    assert.equal(saved.mentor_available, false);
    assert.deepEqual(saved.section_d,before.section_d);
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", String(saved.known_skills.filter(code => code.startsWith("etf_")).length));
    trace.push({ action: "Modifica esperienza → Conferma le risposte", actual_url: page.url(), persisted: true, private_context_preserved: true, mentor_paused: true });
    await capture("experience-saved", "Conferma visibile e ritorno diretto alla dashboard dopo il salvataggio, senza ripetere il contesto.");
    await page.goto("/competenze");
    await expect(page.getByRole("heading", { name: "Rivedi ciò che sai fare" })).toBeVisible();
    assert.equal(await change.isChecked(), saved.known_skills.includes("etf_pac"));
    trace.push({ action: "Riapertura esperienza", saved_selection_still_checked: true });

    await page.goto('/onboarding');
    await expect(page.getByRole('heading', {name:'Aggiungi il tuo contesto personale'})).toBeVisible();
    const contextSection=page.locator('#personal-context');
    await expect(contextSection.getByText(/Conoscere la tua situazione economica e professionale/)).toBeVisible();
    await expect(contextSection.getByText('Le risposte sono facoltative e riservate. Non saranno visibili agli altri utenti.')).toBeVisible();
    await expect(contextSection).not.toContainText('Preferisco non rispondere');
    await expect(page.getByRole('button',{name:'Salva e continua',exact:true})).toBeDisabled();
    await expect(page.getByRole('button',{name:'Salta',exact:true})).toBeEnabled();
    trace.push({action:'Contesto privato facoltativo',answered_count:0,save_enabled:false,skip_enabled:true,disclaimer_visible:true});
    await capture('survey-context', 'Finalità e riservatezza sempre visibili; Salta disponibile e Salva e continua grigio senza risposte.');
    await page.getByRole('button',{name:'Salta',exact:true}).click();
    await expect(page).toHaveURL(/\/goal$/);
    assert.deepEqual((await api(context,'/skills/me')).section_d,before.section_d);
    trace.push({action:'Salta contesto → obiettivi',context_unchanged:true});
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', {name:'Aggiungi il tuo contesto personale'})).toBeVisible();
    await page.locator('select[name=D1]').selectOption('student');
    await expect(page.getByRole('button',{name:'Salva e continua',exact:true})).toBeEnabled();
    await capture('context-ready','Una risposta effettiva abilita Salva e continua; Salta resta disponibile.',{answered_count:1,save_enabled:true});
    await page.locator('select[name=D2]').selectOption('lt_15k');
    await page.locator('select[name=D3]').selectOption('none');
    await page.locator('select[name=D4]').selectOption('none');
    await capture('context-four','Quattro risposte effettive sono parziali e possono essere salvate.',{answered_count:4,save_enabled:true});
    await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
    await expect(page).toHaveURL(/\/goal$/);
    const partial=await api(context,'/skills/me');
    assert.deepEqual(partial.section_d,{D1:'student',D2:'lt_15k',D3:'none',D4:'none'});
    assert.equal(partial.profile_completion.context_answered_count,4);
    trace.push({action:'Quattro risposte → Salva e continua',persisted:true,answered_count:4});

    await page.goto('/dashboard');
    const partialBanner = page.getByRole('complementary', { name: 'Completa il tuo profilo' });
    await expect(partialBanner).toBeVisible();
    await expect(partialBanner.getByRole('link', { name: 'Completa il profilo · 4/5' })).toBeVisible();
    const persistedPartial = await api(context, '/skills/me');
    assert.equal(persistedPartial.profile_completion.context_answered_count, 4);
    assert.equal(persistedPartial.profile_completion.context_completed, false);
    await capture('profile-partial-saved', 'Dopo il salvataggio di quattro risposte effettive il richiamo resta presente con conteggio 4/5.',
      { profile_completion: persistedPartial.profile_completion, section_d: persistedPartial.section_d });

    await page.goto('/goal');await expect(page.getByRole('heading',{name:'I tuoi obiettivi',exact:true})).toBeVisible();
    await capture('goal-selection','Temi e attività separate con modalità propria.');
    await page.goto("/settings");
    await page.getByText("Contesto personale", { exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Qual è la tua situazione professionale?", exact: true })).toBeVisible();
    const select = page.getByRole("combobox", { name: "Qual è la tua situazione professionale?", exact: true });
    const choices = await select.locator("option").evaluateAll(options => options.map(option => option.value).filter(Boolean));
    assert.ok(choices.every(value => value !== 'undisclosed'));
    await expect(select).toHaveValue('student');
    await page.locator('select[name=D5]').selectOption('adequate');
    await page.getByRole("button", { name: "Salva contesto personale", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Contesto personale aggiornato." })).toBeVisible();
    const withContext = await api(context, "/skills/me");
    assert.deepEqual(withContext.known_skills, saved.known_skills);
    assert.deepEqual(withContext.mentor_skills, saved.mentor_skills);
    assert.equal(withContext.mentor_available, false);
    assert.deepEqual(withContext.section_d,{...partial.section_d,D5:'adequate'});
    trace.push({ action: "Impostazioni → Contesto personale → Salva", skills_and_pause_preserved: true, answered_count:5 });
    await capture("private-context", "Dati privati facoltativi in una sezione distinta delle impostazioni, salvataggio indipendente.");

    await page.goto('/dashboard');
    await expect(page.getByRole('heading',{name:'I tuoi obiettivi',exact:true})).toBeVisible();
    await expect(page.getByRole('progressbar',{name:'Preparazione su ETF'})).toHaveAttribute('value',String(withContext.known_skills.filter(code=>code.startsWith('etf_')).length));
    await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toHaveCount(0);
    const completion=(await api(context,'/skills/me')).profile_completion;
    assert.equal(completion.context_completed,true);assert.equal(completion.context_answered_count,5);
    trace.push({action:'Riapertura dashboard dopo contesto salvato',dashboard_loaded:true,profile_completion:completion,banner_visible:false});
    await capture('profile-complete','Il richiamo scompare dopo salvataggio e rilettura delle cinque risposte.',{dashboard_loaded:true,profile_completion:completion});
    const verification=new URL(fixture.verification_links[viewportName==='mobile'?'learner_mobile':'learner']);
    await page.goto('/verify-email'+verification.hash);
    await expect.poll(()=>new URL(page.url()).hash).toBe('');
    await page.getByRole('button',{name:'Conferma email',exact:true}).click();
    await expect(page.getByRole('status').filter({hasText:'Email verificata'})).toBeVisible();
    await expect(page.getByRole('link',{name:/Riprendi.*survey/i})).toHaveCount(0);
    const verified=await api(context,'/auth/me');assert.equal(verified.email_verified,true);
    trace.push({action:'Conferma email con token locale valido',email_verified:true,fragment_removed:true,survey_resume_link:false});
    await capture('verification-success','Conferma riuscita senza riportare alla survey già compilata.',{email_verified:true,context_completed:true});
    await page.getByRole('link',{name:'Vai al tuo account',exact:true}).click();
    await expect(page).toHaveURL(/\/settings$/);
    trace.push({action:'Email confermata → Vai al tuo account',actual_url:page.url(),context_preserved:true});
    await page.goto("/matching");
    const card = page.getByRole("article").filter({ hasText: fixture.users.mentor.nickname });
    await expect(card).toBeVisible();
    const candidates = (await api(context, "/matching/candidates/all", { method: "POST", data: {} })).items;
    const candidate = candidates.find(item => item.mentor_id === fixture.users.mentor.id);
    assert.ok(candidate);
    assert.equal(candidate.coverage_count, 2);
    assert.equal(candidate.requested_count, 3);
    assert.notEqual(Math.round(candidate.match_score), Math.round(100 * 2 / 3));
    await expect(card.getByRole("region", {name:"Obiettivi su ETF",exact:true}).getByText(`${Math.round(candidate.match_score)}%`, {exact:true})).toBeVisible();
    await capture("matching", "Confrontare compatibilità e copertura; capire tema, obiettivi e modalità.", { candidate: { nickname: candidate.nickname, match_score: candidate.match_score, coverage_count: 2, requested_count: 3 } });
    const firstPeople=await page.locator('[data-person-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.personId));
    assert.equal(firstPeople.length,10);
    await page.getByRole('button', {name:'Mostra altri',exact:true}).click();
    await expect(page.locator('[data-person-id]')).toHaveCount(13);
    const allPeople=await page.locator('[data-person-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.personId));
    assert.equal(new Set(allPeople).size,13);
    await expect(card).toContainText('ETF');await expect(card).toContainText('Azioni');
    trace.push({action:'Mostra altri → tutte le persone compatibili',before_person_ids:firstPeople,after_person_ids:allPeople,no_duplicates:true,mentor_themes_preserved:['ETF','Azioni']});
    await capture('matching-pagination','Tutte le persone compatibili raggiungibili senza duplicati.',{person_ids:await page.locator('[data-person-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.personId))});
    await card.getByRole('region',{name:'Obiettivi su ETF',exact:true}).locator('details summary').click();
    await capture("partial-details", "Scoprire le attività affrontabili e quella esclusa senza scambiare copertura per disponibilità.");
    await card.getByRole("button", { name: "Chiedi un confronto", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const sendRequest = dialog.getByRole("button", { name: "Invia richiesta", exact: true });
    await expect(sendRequest).toBeDisabled();
    const disabledBackground = await sendRequest.evaluate(element => getComputedStyle(element).backgroundColor);
    assert.equal(disabledBackground, "rgb(230, 232, 233)", "Unavailable request action must use neutral gray");
    await dialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await capture("agreement-disabled", "Messaggio obbligatorio e azione non disponibile chiaramente riconoscibili.",
      { send_disabled: true, background: disabledBackground });
    await dialog.evaluate(element => { element.scrollTop = 0; });
    await dialog.getByRole("radio", {name:/ETF/}).check();
    await dialog.getByRole("checkbox", { name: "Leggere e comprendere un ETF", exact: true }).check();
    await dialog.getByLabel("Il tuo messaggio").fill("Vorrei leggere insieme una scheda ETF e comprendere i suoi dati principali.");
    await dialog.getByRole("checkbox", { name: /email/ }).check();
    const controlsBytes = await page.screenshot({ animations: "disabled" });
    const controlsFile = `${viewportName}-agreement-controls.png`;
    await writeFile(path.join(directory, controlsFile), controlsBytes);
    manifest.artifacts.push({ file: controlsFile, sha256: hash(controlsBytes) });
    await dialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const footerBytes = await page.screenshot({ animations: "disabled" });
    const footerFile = `${viewportName}-agreement-footer.png`;
    await writeFile(path.join(directory, footerFile), footerBytes);
    manifest.artifacts.push({ file: footerFile, sha256: hash(footerBytes) });
    await dialog.evaluate(element => { element.scrollTop = 0; });
    await capture("agreement", "Proporre esplicitamente una sola attività del sottoinsieme compatibile.", { chosen: ["etf_read"] });
    await dialog.getByRole("button", { name: "Invia richiesta", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const requests = await api(context, "/matching/requests/me?role=mentee");
    const sent = requests.find(item => item.mentor_id === fixture.users.mentor.id && item.status === "pending");
    assert.ok(sent, "Request was not persisted");
    assert.deepEqual(sent.agreed_objective_codes, ["etf_read"]);
    await page.goto("/requests?tab=sent");
    await expect(page.getByText(fixture.users.mentor.nickname, { exact: false }).first()).toBeVisible();
    trace.push({ action: "Invia proposta parziale → Richieste inviate", request_id: sent.id, agreed_objective_codes: sent.agreed_objective_codes, persisted: true });
    await capture("request-saved", "La richiesta salvata mantiene il sottoinsieme proposto e rende leggibile l'attività concordata.");
    const goalsBeforeEdit=(await api(context,'/goals/me')).active_goals;
    const stocksBeforeEdit=goalsBeforeEdit.find(goal=>goal.topic_code==='stocks');
    await page.goto('/goal');
    const selectedTopic = page.locator('details').filter({has:page.getByText('ETF',{exact:true})});
    await selectedTopic.getByRole('checkbox',{name:'Confrontare ETF simili con criteri chiari',exact:true}).uncheck();
    await page.getByRole('button',{name:'Aggiorna e vedi i mentor',exact:true}).click();
    const changeDialog=page.getByRole('dialog');await expect(changeDialog).toContainText('proposta');
    await capture('goal-cancellation','Conseguenza della modifica spiegata prima del salvataggio.');
    await changeDialog.getByRole('button',{name:'Conferma',exact:true}).click();
    await expect(page).toHaveURL(/\/matching$/);
    assert.equal((await api(context,'/matching/requests/me?role=mentee')).find(r=>r.id===sent.id).status,'cancelled_by_goal_change');
    const goalsAfterEdit=(await api(context,'/goals/me')).active_goals;
    const stocksAfterEdit=goalsAfterEdit.find(goal=>goal.topic_code==='stocks');
    assert.deepEqual(stocksAfterEdit,stocksBeforeEdit);
    trace.push({action:'Modifica ETF → conferma → proposta annullata',request_id:sent.id,status:'cancelled_by_goal_change',other_theme_unchanged:true,stocks_goal_id:stocksAfterEdit.id});
    await page.goto('/requests?tab=sent');await expect(page.getByText('Annullata per modifica dell’obiettivo',{exact:true}).first()).toBeVisible();
    await capture('goal-cancelled','Stato terminale leggibile; nessun percorso aperto.');
    await page.goto(`/profiles/${fixture.users.mentor.id}`);
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Preparazione su ETF" })).toHaveAttribute("value", "4");
    await expect(page.getByText("Verifica compatibilità…", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Invia richiesta al mentor", exact: true })).toBeVisible();
    await capture("mentor-profile", "Leggere preparazione su due temi (4/6 e 2/6), distinta dalle due offerte ETF e dall’offerta Azioni.");
    // Only this local learner fixture is changed; restore offers for the next viewport.
    try {
      await page.goto("/settings");
      const availability = page.getByRole("switch", { name: "Disponibilità come mentor" });
      await availability.focus();
      await availability.press("Space");
      await expect(availability).toBeChecked();
      await expect(page.getByRole("status").filter({ hasText: "Disponibilità come mentor attivata." })).toBeVisible();
      await page.getByRole("checkbox", { name: "Offri: Leggere e comprendere un ETF", exact: true }).uncheck();
      const saveOffers = page.getByRole("button", { name: "Salva capacità offerte", exact: true });
      await saveOffers.click();
      const removal = page.getByRole("dialog", { name: "Conferma la scelta" });
      await expect(removal).toContainText("La tua disponibilità come mentor verrà disattivata");
      await capture("mentor-removal-settings", "Comprendere le conseguenze della rimozione dell'ultima attività e poter annullare.");
      await removal.getByRole("button", { name: "Annulla", exact: true }).click();
      const cancelled = await api(context, "/skills/me");
      assert.deepEqual(cancelled.mentor_skills, withContext.mentor_skills);
      assert.equal(cancelled.mentor_available, true);
      await saveOffers.click();
      await removal.getByRole("button", { name: "Conferma", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Capacità offerte aggiornate." })).toBeVisible();
      await expect(page.getByText("Disponibilità come mentor attivata.", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Disponibilità come mentor disattivata.", { exact: true })).toBeVisible();
      await expect(availability).not.toBeChecked();
      await expect(availability).toBeDisabled();
      const removedOffers = await api(context, "/skills/me");
      assert.deepEqual(removedOffers.mentor_skills, []);
      assert.equal(removedOffers.mentor_available, false);
      assert.deepEqual(removedOffers.known_skills, withContext.known_skills);
      assert.deepEqual(removedOffers.section_d, withContext.section_d);
      trace.push({ action: "Rimuovi ultima offerta nelle impostazioni", cancel_preserved_profile: true, saved: true, mentor_available: false });
      await capture("mentor-removal-settings-saved", "Disponibilità disattivata dopo conferma; capacità conosciute e contesto conservati.");
      await api(context, "/skills/me", { method: "PUT", data: { known_skills: withContext.known_skills, mentor_skills: withContext.mentor_skills, idempotency_key: crypto.randomUUID() } });
      await page.reload();
      await availability.focus();
      await availability.press("Space");
      await expect(availability).toBeChecked();
      await expect(page.getByRole("status").filter({ hasText: "Disponibilità come mentor attivata." })).toBeVisible();
      await page.goto("/competenze");
      await page.getByRole("checkbox", { name: "So: Leggere e comprendere un ETF", exact: true }).uncheck();
      const saveExperience = page.getByRole("button", { name: "Conferma le risposte", exact: true });
      await saveExperience.click();
      await expect(removal).toContainText("I percorsi già aperti continueranno");
      await capture("mentor-removal-experience", "Rimuovere l'ultima capacità offerta dall'esperienza richiede la stessa conferma.");
      await removal.getByRole("button", { name: "Annulla", exact: true }).click();
      const cancelledExperience = await api(context, "/skills/me");
      assert.deepEqual(cancelledExperience.known_skills, withContext.known_skills);
      assert.equal(cancelledExperience.mentor_available, true);
      await saveExperience.click();
      await removal.getByRole("button", { name: "Conferma", exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("status").filter({ hasText: /esperienza.*aggiornata/i })).toBeVisible();
      await expect(page.getByRole("region", { name: "I tuoi percorsi come mentor", exact: true }).getByText("Disponibilità mentor disattivata", { exact: true })).toBeVisible();
      const removedKnowledge = await api(context, "/skills/me");
      assert.deepEqual(removedKnowledge.mentor_skills, []);
      assert.equal(removedKnowledge.mentor_available, false);
      assert.equal(removedKnowledge.known_skills.includes("etf_read"), false);
      assert.deepEqual(removedKnowledge.section_d, withContext.section_d);
      const paths = await api(context, "/paths/me");
      assert.ok(paths.some(item => item.mentor_id === fixture.users.learner.id && item.status === "open"));
      trace.push({ action: "Rimuovi ultima capacità offerta dall'esperienza", cancel_preserved_profile: true, saved: true, mentor_available: false, existing_mentor_path_preserved: true });
      await capture("mentor-removal-experience-saved", "Dashboard coerente con la pausa automatica; i percorsi mentor già aperti restano accessibili.");
    } finally {
      await api(context, "/skills/me", { method: "PUT", data: { known_skills: withContext.known_skills, mentor_skills: withContext.mentor_skills, idempotency_key: crypto.randomUUID() } });
      await api(context, "/profiles/me/mentor-status", { method: "PATCH", data: { is_coach: false } });
    }
    const lifecycle = fixture.lifecycle[viewportName];
    const lifecycleContexts = {};
    for (const role of ["mentee", "mentor"]) {
      const actorContext = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
      await login(actorContext, `lifecycle_${viewportName}_${role}`);
      const actorPage = actorContext.pages()[0];
      actorPage.setDefaultTimeout(20000);
      actorPage.on("pageerror", error => pageErrors.push(error.message));
      lifecycleContexts[role] = actorContext;
    }
    const menteeContext = lifecycleContexts.mentee;
    const mentorContext = lifecycleContexts.mentor;
    const menteePage = menteeContext.pages()[0];
    const mentorPage = mentorContext.pages()[0];
    const pathEndpoint = `/paths/${lifecycle.path_id}`;
    const walletSnapshot = async () => ({
      mentee: { wallet: await api(menteeContext, "/wallet/me"), transactions: await api(menteeContext, "/wallet/me/transactions") },
      mentor: { wallet: await api(mentorContext, "/wallet/me"), transactions: await api(mentorContext, "/wallet/me/transactions") },
    });
    const opened = await api(menteeContext, pathEndpoint);
    assert.equal(opened.status, "open");
    assert.equal(opened.first_call_completed, false);
    assert.equal(opened.skill_model, true);
    const starting = await walletSnapshot();
    for (const role of ["mentee", "mentor"]) {
      assert.deepEqual(starting[role].wallet, lifecycle.wallet_before_open[role]);
      assert.equal(starting[role].transactions.length, lifecycle.transaction_count_before_open[role]);
    }
    await menteePage.goto(pathEndpoint);
    await expect(menteePage.getByRole("button", { name: "Chiudi il percorso" })).toBeVisible();
    await capture("path-lifecycle-open", "Il percorso è aperto, senza prima call e senza movimento crediti.",
      { path_id: lifecycle.path_id, request_id: lifecycle.request_id, first_call_completed: false,
        cost_at_request: lifecycle.cost_at_request, mentor_reward_at_request: lifecycle.mentor_reward_at_request,
        wallet: starting }, menteePage);
    await menteePage.getByRole("button", { name: "Chiudi il percorso" }).click();
    await menteePage.getByRole("dialog", { name: "Conferma la scelta" }).getByRole("button", { name: "Conferma" }).click();
    await expect(menteePage.getByRole("link", { name: "Lascia feedback sul mentor" })).toBeVisible();
    await menteePage.getByRole("link", { name: "Lascia feedback sul mentor" }).click();
    await expect(menteePage.getByRole("heading", { name: "Cosa porti con te?" })).toBeVisible();
    await menteePage.getByRole("combobox", { name: /Risultato:/ }).selectOption("partly");
    await menteePage.getByRole("combobox", { name: "Chiarezza del confronto" }).selectOption("clear");
    await menteePage.getByRole("combobox", { name: "Rifaresti questo percorso?" }).selectOption("yes");
    await menteePage.getByRole("combobox", { name: "Hai ricevuto proposte commerciali esterne?" }).selectOption("no");
    await menteePage.getByRole("button", { name: "Invia feedback" }).click();
    await expect(menteePage).toHaveURL(new RegExp(`/paths/${lifecycle.path_id}`));
    const waiting = await api(menteeContext, pathEndpoint);
    assert.equal(waiting.status, "feedback_pending");
    assert.equal(waiting.mentee_feedback_submitted, true);
    assert.equal(waiting.mentor_feedback_submitted, false);
    const afterFirst = await walletSnapshot();
    for (const role of ["mentee", "mentor"]) {
      assert.deepEqual(afterFirst[role].wallet, starting[role].wallet);
      assert.equal(afterFirst[role].transactions.length, starting[role].transactions.length);
    }
    await capture("path-lifecycle-waiting", "Il primo feedback non muove i crediti; manca ancora il mentor.",
      { path_id: lifecycle.path_id, status: waiting.status, wallet: afterFirst }, menteePage);
    await mentorPage.goto(pathEndpoint);
    await expect(mentorPage.getByRole("button", { name: "Chiudi il percorso" })).toBeVisible();
    await mentorPage.getByRole("button", { name: "Chiudi il percorso" }).click();
    await mentorPage.getByRole("dialog", { name: "Conferma la scelta" }).getByRole("button", { name: "Conferma" }).click();
    await expect(mentorPage.getByRole("link", { name: "Lascia feedback sull’apprendista" })).toBeVisible();
    await mentorPage.getByRole("link", { name: "Lascia feedback sull’apprendista" }).click();
    await expect(mentorPage.getByRole("heading", { name: "Com’è andato il percorso?" })).toBeVisible();
    await mentorPage.getByRole("combobox", { name: /Risultato:/ }).selectOption("partly");
    await mentorPage.getByRole("combobox", { name: "Partecipazione dell’apprendista" }).selectOption("active");
    await mentorPage.getByRole("button", { name: "Invia feedback" }).click();
    await expect(mentorPage).toHaveURL(new RegExp(`/paths/${lifecycle.path_id}`));
    const completed = await api(mentorContext, pathEndpoint);
    assert.equal(completed.status, "completed");
    const finalWallet = await walletSnapshot();
    assert.equal(finalWallet.mentee.wallet.balance,
      starting.mentee.wallet.balance - lifecycle.cost_at_request);
    assert.equal(finalWallet.mentor.wallet.balance,
      starting.mentor.wallet.balance + lifecycle.mentor_reward_at_request);
    assert.equal(finalWallet.mentee.transactions.length,
      starting.mentee.transactions.length + (lifecycle.cost_at_request > 0 ? 1 : 0));
    assert.equal(finalWallet.mentor.transactions.length,
      starting.mentor.transactions.length + (lifecycle.mentor_reward_at_request > 0 ? 1 : 0));
    await capture("path-lifecycle-completed", "Solo il secondo feedback completa il percorso e applica costo e compenso fotografati nella richiesta.",
      { path_id: lifecycle.path_id, status: completed.status, wallet: finalWallet }, mentorPage);
    const reportText = `${lifecycle.report_marker}: segnalazione sintetica del percorso completato per verificare la coda admin.`;
    await menteePage.goto(pathEndpoint);
    await menteePage.getByText("Segnala un problema", { exact: true }).click();
    await menteePage.getByLabel("Descrizione", { exact: true }).fill(reportText);
    await menteePage.getByRole("button", { name: "Invia segnalazione" }).click();
    await expect(menteePage.getByText("Segnalazione inviata al team Socra.")).toBeVisible();
    const adminContext = await browser.newContext({ baseURL, viewport, isMobile: viewportName === "mobile", hasTouch: viewportName === "mobile" });
    await login(adminContext, `lifecycle_${viewportName}_admin`);
    const adminPage = adminContext.pages()[0];
    adminPage.setDefaultTimeout(20000);
    adminPage.on("pageerror", error => pageErrors.push(error.message));
    const adminMe = await api(adminContext, "/auth/me");
    assert.equal(adminMe.role, "admin");
    assert.equal(adminMe.id, lifecycle.admin_id);
    const queue = await api(adminContext, "/admin/review-queue");
    const ownReviews = queue.filter(item => item.source_type === "report"
      && item.payload?.path_id === lifecycle.path_id && item.payload?.reporter_id === lifecycle.mentee_id);
    assert.equal(ownReviews.length, 1, "Fresh path must identify exactly one own report among retained fixture history");
    const ownReview = ownReviews[0];
    await adminPage.goto("/admin");
    await expect(adminPage.getByRole("heading", { name: "Amministrazione" })).toBeVisible();
    const reportCard = adminPage.getByText(ownReview.source_id, { exact: true }).first().locator("xpath=../../..");
    await reportCard.getByRole("button", { name: "Esamina segnalazione" }).click();
    await expect(reportCard.getByText(reportText, { exact: true })).toBeVisible();
    const reportDetail = await api(adminContext, `/admin/review-queue/${ownReview.id}/report`);
    assert.equal(reportDetail.details, reportText);
    assert.equal(reportDetail.reporter_id, lifecycle.mentee_id);
    assert.equal(reportDetail.path_id, lifecycle.path_id);
    assert.equal(reportDetail.status, "open");
    await capture("admin-report", "L’admin trova e legge il testo della segnalazione del percorso reale.",
      { path_id: lifecycle.path_id, report_id: reportDetail.id, review_id: ownReview.id,
        marker: lifecycle.report_marker, report_detail: reportDetail }, adminPage);
    await reportCard.getByLabel("Motivazione della decisione").fill("Verifica sintetica conclusa senza violazione.");
    await reportCard.getByRole("button", { name: "Archivia senza violazione" }).click();
    await expect(adminPage.getByText(ownReview.source_id, { exact: true })).toHaveCount(0);
    const resolved = await api(adminContext, `/admin/review-queue/${ownReview.id}/report`);
    assert.equal(resolved.status, "dismissed");
    assert.equal(resolved.resolution, "Verifica sintetica conclusa senza violazione.");
    assert.ok(!(await api(adminContext, "/admin/review-queue")).some(item => item.id === ownReview.id));
    await capture("admin-report-resolved", "La segnalazione archiviata esce dalla coda e conserva la motivazione.",
      { path_id: lifecycle.path_id, report_id: resolved.id, review_id: ownReview.id,
        report_status: resolved.status, resolution: resolved.resolution }, adminPage);
    await adminContext.close();
    await menteeContext.close();
    await mentorContext.close();
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
