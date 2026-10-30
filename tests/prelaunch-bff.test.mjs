import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';
const require = createRequire(import.meta.url);
function fixture(upstreamStatus = 200) {
  const calls = [];
  const globals = { process: { env: { NODE_ENV: 'production' } }, TextDecoder, Uint8Array, AbortController,
    setTimeout, clearTimeout, Response,
    fetch: async (url, options) => { calls.push({url, options}); return Response.json({status:'ok'}, {status:upstreamStatus}); } };
  function compile(path, imports = {}) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
      compilerOptions: {module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}
    }).outputText;
    runInNewContext(code, {exports, require: name => imports[name] || require(name), ...globals});
    return exports;
  }
  const security = compile('../lib/web-security.ts');
  const api = compile('../lib/prelaunch-server.ts', {
    '@/lib/web-security': security, '@/lib/server': {getBackendUrl: path => 'https://backend.invalid' + path}
  });
  const request = (body, headers={}) => new NextRequest('https://www.socra.it/api/prelaunch/subscribe', {
    method:'POST', headers: {'Origin':'https://www.socra.it','Content-Type':'application/json', ...headers}, body
  });
  return {api, calls, request};
}
test('public subscription forwards a bounded body without cookies or credentials', async () => {
  const {api, calls, request} = fixture();
  const response = await api.prelaunchMutation(request(JSON.stringify({email:'lead@example.com',accepted:true}), {Cookie:'socra_session=secret'}), 'subscribe');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(calls[0].url, 'https://backend.invalid/prelaunch/subscribe');
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[0].options.headers.Cookie, undefined);
});
test('cross-site requests and oversized bodies are rejected before contacting backend', async () => {
  const {api, calls, request} = fixture();
  assert.equal((await api.prelaunchMutation(request('{}', {Origin:'https://other.invalid'}), 'subscribe')).status, 403);
  assert.equal((await api.prelaunchMutation(request(JSON.stringify({email:'x'.repeat(5000)})), 'subscribe')).status, 413);
  assert.equal(calls.length, 0);
});
test('upstream failure never echoes token or arbitrary upstream content', async () => {
  const {api, request} = fixture(500);
  const response = await api.prelaunchMutation(request(JSON.stringify({token:'private-token'})), 'confirm');
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private-token/);
});
