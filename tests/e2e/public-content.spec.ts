import { expect, test } from "@playwright/test";

test("homepage presents the community without release jargon or fabricated metrics", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Impara con chi ha esperienza/i })).toBeVisible();
  await expect(page.getByText("Matching spiegabile").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/10\.000|2\.500|18\.547|4\.8\/5|78%|92%/);
  await expect(page.locator("body")).not.toContainText(/\bMVP\b|private beta|soglia consigliata/i);
  await expect(page.getByRole("link", { name: /Guarda il video/i })).toHaveCount(0);
});

test("levels and community keep internal product mechanics out of the user experience", async ({ page }) => {
  await page.goto("/livelli");

  await expect(page.getByRole("heading", { name: /Un livello che orienta, non giudica/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tre modi di entrare nel percorso/i })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /soglie? di progressione|L0\s*→\s*L1|reputazione\s*≥|verifica admin|approvazione admin|\bMVP\b|private beta/i,
  );

  await page.goto("/community");
  await expect(page.getByRole("heading", { name: /La community nasce nei percorsi/i })).toBeVisible();
  await expect(page.getByText(/Il valore nasce dal confronto diretto/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\bMVP\b|private beta|presto disponibile/i);
});

test("safety and FAQ do not promise recordings, instant moderation, chat or an SLA", async ({ page }) => {
  await page.goto("/sicurezza");

  await expect(page.getByText("Nessuna registrazione audio o video")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revisione manuale" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/senza consenso esplicito|rimossi immediatamente|sempre disponibile/i);

  await page.goto("/faq");
  await expect(page.getByText(/non hanno tempi di risposta garantiti/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\bMVP\b|private beta|parametri provvisori|almeno tre persone/i);
  await expect(page.locator("body")).not.toContainText(/risposta entro 24 ore|risposta in pochi minuti|avvia chat/i);
});

test("public pages contain no placeholder hash links or unsupported population claims", async ({ page }) => {
  for (const path of ["/", "/come-funziona", "/community", "/livelli", "/sicurezza", "/faq"]) {
    await page.goto(path);
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/oltre 10\.000|18\.547 percorsi/i);
    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  }
});
