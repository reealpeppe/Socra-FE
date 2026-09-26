import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

const require = createRequire(import.meta.url);
function compile(path, globals, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require: name => imports[name] || require(name), ...globals });
  return exports;
}

function fixture(action, body = { access_token: 'private-fixture-token', user_id: 'fixture-user' }, status = 200, proxyPath = ['profiles', 'me']) {
  let calls = 0;
  const globals = {
    process: { env: { NODE_ENV: 'production', SOCRA_PUBLIC_ORIGINS: 'https://www.socra.it,https://socra.it', SOCRA_API_BASE_URL: 'https://backend.invalid' } },
    AbortSignal, AbortController, setTimeout, clearTimeout, Headers, Response, TextDecoder, Uint8Array, Buffer,
    fetch: async () => { calls++; return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); },
  };
  const securityPath = new URL('../lib/web-security.ts', import.meta.url);
  const security = existsSync(securityPath) ? compile('../lib/web-security.ts', globals) : {};
  const server = compile('../lib/server.ts', globals, { '@/lib/web-security': security });
  const accountServer = compile('../lib/account-server.ts', globals, { '@/lib/server': server, '@/lib/web-security': security });
  const route = action === 'proxy' ? null : compile(`../app/api/auth/${action}/route.ts`, globals, {
    '@/lib/server': server, '@/lib/web-security': security, '@/lib/account-server': accountServer,
  });
  return { invoke: request => action === 'proxy' ? server.proxyBackend(request, proxyPath) : route.POST(request), calls: () => calls };
}

function request({ origin = 'https://www.socra.it', type = 'application/json', body = '{}', cookie = '', fetchSite, method = 'POST' } = {}) {
  const headers = new Headers();
  if (origin !== null) headers.set('Origin', origin);
  if (type !== null) headers.set('Content-Type', type);
  if (cookie) headers.set('Cookie', cookie);
  if (fetchSite) headers.set('Sec-Fetch-Site', fetchSite);
  return new NextRequest('https://www.socra.it/api/test', { method, headers, body: method === 'GET' ? undefined : body });
}

for (const action of ['login', 'register', 'logout', 'proxy', 'password-reset/request', 'password-reset/confirm', 'email-verification/confirm', 'email-verification/request']) {
  for (const origin of ['https://evil.invalid', 'https://www.socra.it.evil.invalid', null, 'null']) {
    test(`${action} rejects untrusted or missing Origin before touching upstream`, async () => {
      const f = fixture(action);
      const result = await f.invoke(request({ origin, cookie: 'socra_session=fixture' }));
      assert.equal(result.status, 403);
      assert.equal(f.calls(), 0);
      assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
    });
  }
}

for (const action of ['login', 'register', 'proxy', 'password-reset/request', 'password-reset/confirm', 'email-verification/confirm', 'email-verification/request']) {
  test(`${action} rejects text/plain forms, invalid JSON and oversized bodies`, async () => {
    for (const [params, wanted] of [
      [{ type: 'text/plain' }, 415], [{ body: '{' }, 400],
      [{ body: JSON.stringify({ padding: 'x'.repeat(action === 'proxy' ? 262144 : 16384) }) }, 413],
    ]) {
      const f = fixture(action);
      const result = await f.invoke(request({ ...params, cookie: 'socra_session=fixture' }));
      assert.equal(result.status, wanted);
      assert.equal(f.calls(), 0);
    }
  });
}

for (const action of ['login', 'register']) {
  test(`${action} keeps bearer exclusively in a secure HttpOnly cookie`, async () => {
    const result = await fixture(action).invoke(request());
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { user_id: 'fixture-user' });
    const cookie = result.headers.get('set-cookie');
    assert.match(cookie, /socra_session=private-fixture-token/);
    assert.match(cookie, /httponly/i);
    assert.match(cookie, /secure/i);
    assert.match(cookie, /samesite=lax/i);
    assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
  });

  test(`${action} preserves a safe credential error without issuing a cookie`, async () => {
    const result = await fixture(action, { detail: 'Invalid credentials' }, 401).invoke(request());
    assert.equal(result.status, 401);
    assert.deepEqual(await result.json(), { detail: 'Invalid credentials' });
    assert.equal(result.headers.get('set-cookie'), null);
    assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
  });

  test(`${action} rejects cross-site fetch metadata even for an allowlisted Origin`, async () => {
    const f = fixture(action);
    const result = await f.invoke(request({ fetchSite: 'cross-site' }));
    assert.equal(result.status, 403);
    assert.equal(f.calls(), 0);
  });
}

test('logout accepts a same-origin empty body and clears the cookie', async () => {
  const result = await fixture('logout').invoke(request({ type: null, body: undefined }));
  assert.equal(result.status, 200);
  assert.match(result.headers.get('set-cookie'), /Max-Age=0/i);
  assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
});

test('anonymous GET remains readable only as a noncacheable 401', async () => {
  const f = fixture('proxy');
  const result = await f.invoke(request({ method: 'GET', origin: null }));
  assert.equal(result.status, 401);
  assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(f.calls(), 0);
});

test('body limit counts bytes from a chunked stream without trusting Content-Length', async () => {
  const f = fixture('login');
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('x'.repeat(10000)));
    controller.enqueue(new TextEncoder().encode('x'.repeat(10000)));
    controller.close();
  } });
  const r = new NextRequest('https://www.socra.it/api/auth/login', {
    method: 'POST', headers: { Origin: 'https://www.socra.it', 'Content-Type': 'application/json' }, body: stream, duplex: 'half',
  });
  assert.equal((await f.invoke(r)).status, 413);
  assert.equal(f.calls(), 0);
});

for (const path of [ ['auth','login'], ['auth','register'], ['auth','logout'], ['auth','me','extra'],
  ['profiles','..','auth','register'], ['auth/register'], ['auth%2fregister'], ['auth\\register'], ['%61uth','register'] ]) {
  test(`generic proxy cannot bypass auth cookie contract: ${path.join('/')}`, async () => {
    const f = fixture('proxy', undefined, 200, path);
    const response = await f.invoke(request({ cookie: 'socra_session=dummy' }));
    assert.equal(response.status, 404);
    assert.equal(f.calls(), 0);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  });
}

test('proxy retains the authenticated GET auth/me contract', async () => {
  const f = fixture('proxy', { id: 'fixture-user' }, 200, ['auth', 'me']);
  const response = await f.invoke(request({ method: 'GET', origin: null, cookie: 'socra_session=fixture' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 'fixture-user' });
  assert.equal(f.calls(), 1);
});
