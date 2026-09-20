import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Real authenticated reads: never use a production account or a reset seed.
const base = process.env.SOCRA_PERF_BASE_URL;
const username = process.env.SOCRA_PERF_USERNAME;
const password = process.env.SOCRA_PERF_PASSWORD;
const readyText = process.env.SOCRA_PERF_READY_TEXT || 'Nessun mentor disponibile ora';
const output = resolve(process.env.SOCRA_PERF_OUTPUT || 'test-results/performance.json');
if (!base || !username || !password) throw new Error('Set SOCRA_PERF_BASE_URL, SOCRA_PERF_USERNAME and SOCRA_PERF_PASSWORD for a test account.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  const context = await browser.newContext();
  await context.addInitScript(({ readyText }) => {
    window.__measurement = { started: 0, ready: null, globalLoader: false, longTasks: [] };
    new PerformanceObserver(list => {
      window.__measurement.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })));
    }).observe({ type: 'longtask', buffered: true });
    addEventListener('DOMContentLoaded', () => {
      const observe = () => {
        const m = window.__measurement;
        if (document.body.innerText.includes('Stiamo preparando Socra')) m.globalLoader = true;
        if (m.ready === null && Array.from(document.querySelectorAll('strong,h1,h2,h3,p')).some(e => e.textContent.trim() === readyText)) {
          requestAnimationFrame(() => { if (m.ready === null) m.ready = performance.now(); });
        }
      };
      new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
      observe();
    });
  }, { readyText });
  const page = await context.newPage();
  await page.goto(base + '/login');
  await page.getByRole('textbox', { name: 'Username o email' }).fill(username);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Accedi', exact: true }).click();
  await page.waitForURL('**/dashboard');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  for (const profile of ['desktop', 'mobile-slow']) {
    await page.setViewportSize(profile === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: profile === 'desktop' ? 0 : 150,
      downloadThroughput: profile === 'desktop' ? -1 : 200000, uploadThroughput: profile === 'desktop' ? -1 : 90000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile === 'desktop' ? 1 : 4 });
    for (let run = 1; run <= 5; run++) {
      for (const kind of ['hard', 'client-navigation']) {
        if (kind === 'hard') {
          await page.goto(base + '/matching');
        } else {
          await page.goto(base + '/dashboard');
          await page.locator('.dash-page[aria-busy="false"]').waitFor();
          await page.evaluate(() => {
            window.__measurement = { started: performance.now(), ready: null, globalLoader: false, longTasks: [] };
            window.__oldShell = document.querySelector('header');
          });
          await page.getByRole('link', { name: profile === 'desktop' ? 'Matching' : 'Match', exact: true }).click();
        }
        await page.getByText(readyText, { exact: true }).waitFor({ timeout: 45000 });
        await page.waitForFunction(() => window.__measurement.ready !== null);
        const metrics = await page.evaluate(() => {
          const m = window.__measurement;
          const nav = performance.getEntriesByType('navigation')[0];
          return { readyMs: Math.round(m.ready - m.started), globalLoader: m.globalLoader,
            frameRetained: m.started ? window.__oldShell === document.querySelector('header') : null,
            ttfbMs: Math.round(nav.responseStart), overflow: document.documentElement.scrollWidth > innerWidth,
            longTasks: m.longTasks.filter(t => t.start >= m.started && t.start <= m.ready),
            api: performance.getEntriesByType('resource').filter(e => e.name.includes('/api/') && e.startTime >= m.started && e.startTime <= m.ready)
              .map(e => ({ path: new URL(e.name).pathname, start: Math.round(e.startTime - m.started), duration: Math.round(e.duration), bytes: e.transferSize })),
          };
        });
        results.push({ profile, run, kind, ...metrics });
      }
    }
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ measuredAt: new Date().toISOString(), base, revision: process.env.SOCRA_PERF_REVISION, protocol: 'browser-clock-v2', results }, null, 2));
  console.log(JSON.stringify({ output, samples: results.length }));
} finally { await browser.close(); }
