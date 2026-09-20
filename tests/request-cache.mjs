import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
function cache(browser = true) {
  const exports = {};
  let now = 100;
  const code = ts.transpileModule(readFileSync(new URL('../lib/request-cache.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, window: browser ? {} : undefined, Date: { now: () => now } });
  return { ...exports, advance: ms => { now += ms; } };
}
test('concurrent consumers share one request and a finite TTL', async () => {
  const c = cache(); let calls = 0; let resolve;
  const load = () => { calls++; return new Promise(r => { resolve = r; }); };
  const first = c.cachedRequest('/auth/me', 30, load);
  const second = c.cachedRequest('/auth/me', 30, load);
  resolve({ id: 'a' });
  assert.equal((await first).id, 'a'); assert.equal((await second).id, 'a'); assert.equal(calls, 1);
  await c.cachedRequest('/auth/me', 30, load); assert.equal(calls, 1);
  c.advance(31); assert.equal(c.peekRequestCache('/auth/me'), undefined);
  const third = c.cachedRequest('/auth/me', 30, load); resolve({ id: 'b' }); await third;
  assert.equal(calls, 2);
});
test('failed requests are not cached', async () => {
  const c = cache();
  await assert.rejects(c.cachedRequest('/x', 50, () => Promise.reject(new Error('offline'))));
  assert.equal(await c.cachedRequest('/x', 50, () => Promise.resolve('ok')), 'ok');
});
test('session changes reject old in-flight private payloads', async () => {
  const c = cache(); let resolve;
  const old = c.cachedRequest('/auth/me', 50, () => new Promise(r => { resolve = r; }));
  c.clearRequestCache(true); resolve({ id: 'old-account' });
  await assert.rejects(old, /sessione/);
  assert.equal(c.peekRequestCache('/auth/me'), undefined);
  assert.equal((await c.cachedRequest('/auth/me', 50, () => Promise.resolve({ id: 'new-account' }))).id, 'new-account');
});
test('mutation invalidation prevents an old request from repopulating the cache', async () => {
  const c = cache(); let resolve;
  const old = c.cachedRequest('/auth/me', 50, () => new Promise(r => { resolve = r; }));
  c.clearRequestCache(); resolve({ id: 'old-value' }); await old;
  assert.equal(c.peekRequestCache('/auth/me'), undefined);
});
test('server calls never share user data', async () => {
  const c = cache(false); let calls = 0;
  const load = () => Promise.resolve(++calls);
  assert.equal(await c.cachedRequest('/auth/me', 500, load), 1);
  assert.equal(await c.cachedRequest('/auth/me', 500, load), 2);
  assert.equal(c.peekRequestCache('/auth/me'), undefined);
});
