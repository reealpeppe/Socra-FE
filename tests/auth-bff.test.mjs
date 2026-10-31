import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);
function compile(relativePath, globals, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require: name => imports[name] || require(name), ...globals });
  return exports;
}

function handler(action, upstreamBody, status = 200, onFetch = () => {}) {
  const globals = {
    process: { env: { NODE_ENV: "production", SOCRA_API_BASE_URL: "https://backend.example" } },
    AbortSignal, AbortController, setTimeout, clearTimeout, Headers, Response, TextDecoder, Uint8Array, Buffer,
    fetch: async (url, options) => { onFetch(url, options); return new Response(JSON.stringify(upstreamBody), { status, headers: { "Content-Type": "application/json" } }); },
  };
  const security = compile("../lib/web-security.ts", globals);
  const server = compile("../lib/server.ts", globals, { "@/lib/web-security": security });
  return compile(`../app/api/auth/${action}/route.ts`, globals, { "@/lib/server": server }).POST;
}

function request(body, cookie) {
  return new NextRequest("https://www.socra.it/api/auth/login", {
    method: "POST", headers: { Origin: "https://www.socra.it", "Content-Type": "application/json", ...(cookie ? {Cookie:cookie} : {}) },
    body: JSON.stringify(body),
  });
}

test('invited registration obtains email proof only from the HttpOnly context',async()=>{
  let submitted;
  const token='s'.repeat(43);
  const post=handler('register',{access_token:'bearer',user_id:'new-user'},200,(_url,options)=>{submitted=JSON.parse(options.body);});
  const response=await post(request({email:'invitee@example.com',password:'StrongPass123',invitation_context:true,invitation_token:'forged-browser-value'},'socra_invitation='+token));
  assert.equal(response.status,200);
  assert.equal(submitted.invitation_token,token);
  assert.equal(Object.hasOwn(submitted,'invitation_context'),false);
  assert.deepEqual(await response.json(),{user_id:'new-user'});
  assert.ok(!response.headers.get('set-cookie').includes(token));
});

test('ordinary registration never trusts an invitation token supplied by the form',async()=>{
  let submitted;
  const post=handler('register',{access_token:'bearer',user_id:'new-user'},200,(_url,options)=>{submitted=JSON.parse(options.body);});
  await post(request({email:'invitee@example.com',invitation_token:'s'.repeat(43)}));
  assert.equal(Object.hasOwn(submitted,'invitation_token'),false);
});

test('malformed invitation context refuses registration before forwarding credentials',async()=>{
  let calls=0;
  const post=handler('register',{},200,()=>{calls++;});
  const response=await post(request({email:'invitee@example.com',password:'StrongPass123',invitation_context:true},'socra_invitation=invalid'));
  assert.equal(response.status,400);
  assert.equal(calls,0);
  assert.equal(response.headers.get('set-cookie'),null);
});

test('ordinary registration ignores a residual invitation context from another visit',async()=>{
  for(const cookie of ['socra_invitation='+ 's'.repeat(43),'socra_invitation=invalid']){
    let submitted;
    const post=handler('register',{access_token:'bearer',user_id:'ordinary-user'},200,(_url,options)=>{submitted=JSON.parse(options.body);});
    const response=await post(request({email:'ordinary@example.com',password:'StrongPass123'},cookie));
    assert.equal(response.status,200);
    assert.equal(Object.hasOwn(submitted,'invitation_token'),false);
    assert.equal(Object.hasOwn(submitted,'invitation_context'),false);
  }
});

for (const action of ["login", "register", "prelaunch-register"]) {
  test(`${action} keeps bearer exclusively in an HttpOnly cookie`, async () => {
    const post = handler(action, { access_token: "fixture-session-bearer", token_type: "bearer", user_id: "user-1" });
    const response = await post(request({ email: "local@example.com", password: "Password123" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { user_id: "user-1" });
    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /socra_session=fixture-session-bearer/);
    assert.match(cookie, /httponly/i);
    assert.match(cookie, /secure/i);
    assert.match(cookie, /samesite=lax/i);
  });

  test(`${action} preserves upstream errors without establishing a session`, async () => {
    const post = handler(action, { detail: "Invalid credentials" }, 401);
    const response = await post(request({}));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { detail: "Invalid credentials" });
    assert.equal(response.headers.get("set-cookie"), null);
  });
}

test('prelaunch registration uses a fixed endpoint and ignores invitation context',async()=>{
  let target,submitted;
  const post=handler('prelaunch-register',{access_token:'private',user_id:'new'},200,(url,options)=>{target=url;submitted=JSON.parse(options.body);});
  const response=await post(request({token:'personal-link-token',email:'lead@example.test',invitation_token:'forged',invitation_context:true}));
  assert.equal(target,'https://backend.example/prelaunch/register');
  assert.equal(submitted.token,'personal-link-token');
  assert.equal(Object.hasOwn(submitted,'invitation_token'),false);
  assert.equal(Object.hasOwn(submitted,'invitation_context'),false);
  assert.deepEqual(await response.json(),{user_id:'new'});
});


test('login preserves server-authorized eight-hour session and caps oversized expiry',async()=>{
  for(const seconds of [28800,999999]){
    const post=handler('login',{access_token:'fixture-session-bearer',user_id:'user-1',expires_in:seconds});
    const result=await post(request({}));
    assert.match(result.headers.get('set-cookie'),/socra_session=fixture-session-bearer/);
    assert.match(result.headers.get('set-cookie'),/Max-Age=28800/i);
    assert.deepEqual(await result.json(),{user_id:'user-1'});
  }
});
