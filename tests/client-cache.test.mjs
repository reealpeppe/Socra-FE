import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function client() {
  let now = 100;
  const window = new EventTarget(), document = new EventTarget();
  document.visibilityState = 'visible';
  const requests = [];
  const globals = { window, document, Date: { now: () => now }, Event, AbortController, setTimeout, clearTimeout,
    fetch: async (url, init) => { requests.push({ url, method: init.method || 'GET' }); return new Response(JSON.stringify(url.endsWith('/skills/me') ? null : { version: requests.length }), { status: 200 }); } };
  function compile(file, modules = {}) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    runInNewContext(code, { ...globals, exports, require: name => { if (!(name in modules)) throw new Error(name); return modules[name]; } });
    return exports;
  }
  const cache = compile('../lib/request-cache.ts');
  const api = compile('../lib/api.ts', { '@/lib/request-cache': cache });
  return { api, requests, advance: ms => { now += ms; }, visible: () => document.dispatchEvent(new Event('visibilitychange')) };
}

test('operational reads reuse valid browser data and expire after five seconds', async () => {
  const { api, requests, advance } = client();
  for (const path of ['/wallet/me', '/wallet/me/transactions', '/paths/me', '/skills/me', '/profiles/me', '/profiles/person', '/matching/requests/me?role=all']) {
    await api.clientGet(path); await api.clientGet(path);
  }
  assert.equal(requests.length, 7);
  assert.equal(api.hasCachedClientValues('/wallet/me', '/skills/me'), true, 'a verified null profile is valid cached data');
  advance(5001);
  assert.equal(api.hasCachedClientValues('/wallet/me', '/skills/me'), false);
  await api.clientGet('/wallet/me'); assert.equal(requests.length, 8);
});

test('a mutation invalidates operational data before the next navigation', async () => {
  const { api, requests } = client();
  const old = await api.clientGet('/wallet/me');
  await api.clientPost('/matching/requests/request/respond', { accept: true });
  assert.equal(api.cachedClientValue('/wallet/me'), undefined);
  assert.notEqual((await api.clientGet('/wallet/me')).version, old.version);
  assert.equal(requests.filter(r => r.url.endsWith('/wallet/me')).length, 2);
});

test('logout and login cannot reuse another account’s operational data', async () => {
  const { api } = client();
  await api.clientGet('/wallet/me'); await api.authPost('logout');
  assert.equal(api.cachedClientValue('/wallet/me'), undefined);
  await api.clientGet('/paths/me'); await api.authPost('login', { identifier: 'other' });
  assert.equal(api.cachedClientValue('/paths/me'), undefined);
});

test('returning to a visible tab invalidates the operational snapshot', async () => {
  const { api, visible } = client();
  await api.clientGet('/paths/me'); visible();
  assert.equal(api.hasCachedClientValues('/paths/me'), false);
});
