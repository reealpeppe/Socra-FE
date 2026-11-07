import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

const require = createRequire(import.meta.url);
function fixture(env) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../lib/prelaunch-source.ts', import.meta.url), 'utf8'), {
    compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  runInNewContext(code, {exports,require,process:{env}});
  return exports.prelaunchSourceHeaders;
}

test('proxy identity is private, per client and bound to the exact body and endpoint', () => {
  const secret = 'test-proxy-secret-'.repeat(3);
  const headers = fixture({RAILWAY_ENVIRONMENT_ID:'synthetic',SOCRA_PRELAUNCH_PROXY_SECRET:secret});
  const request = ip => new NextRequest('https://www.socra.it/api/prelaunch/reserve', {
    method:'POST',headers:{'x-real-ip':ip,'X-Socra-Prelaunch-Source':'forged-client-value'},body:'{}',
  });
  const body = JSON.stringify({email:'synthetic@example.test'});
  const proof = headers(request('192.0.2.1'),'/prelaunch/reserve',body)['X-Socra-Prelaunch-Source'];
  const [stamp,client,signature] = proof.split('.');
  const expected = createHmac('sha256',secret).update([
    stamp,client,'POST','/prelaunch/reserve',createHash('sha256').update(body).digest('hex'),
  ].join('\n')).digest('hex');
  assert.equal(signature,expected);
  assert.doesNotMatch(proof,/192\.0\.2\.1/);
  assert.equal(headers(request('192.0.2.1'),'/prelaunch/reserve',body)['X-Socra-Prelaunch-Source'].split('.')[1],client);
  assert.notEqual(headers(request('192.0.2.2'),'/prelaunch/reserve',body)['X-Socra-Prelaunch-Source'].split('.')[1],client);
  assert.notEqual(headers(request('192.0.2.1'),'/prelaunch/join',body)['X-Socra-Prelaunch-Source'].split('.')[2],signature);
});

test('untrusted deployments and malformed addresses never create proxy attestations', () => {
  for (const env of [{},{SOCRA_PRELAUNCH_PROXY_SECRET:'s'.repeat(48)}]) {
    assert.equal(Object.keys(fixture(env)(new NextRequest('https://www.socra.it',{headers:{'x-real-ip':'192.0.2.1'}}),'/prelaunch/reserve','{}')).length,0);
  }
  const headers = fixture({RAILWAY_ENVIRONMENT_ID:'synthetic',SOCRA_PRELAUNCH_PROXY_SECRET:'s'.repeat(48)});
  assert.equal(Object.keys(headers(new NextRequest('https://www.socra.it',{headers:{'x-real-ip':'forged, 192.0.2.1'}}),'/prelaunch/reserve','{}')).length,0);
});
