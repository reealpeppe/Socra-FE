import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function compile(relativePath, globals, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require: name => imports[name] || require(name), ...globals });
  return exports;
}

function handler(action, upstreamBody, status = 200) {
  const globals = {
    process: { env: { NODE_ENV: "production", SOCRA_API_BASE_URL: "https://backend.example" } },
    AbortSignal, setTimeout, clearTimeout,
    fetch: async () => new Response(JSON.stringify(upstreamBody), { status, headers: { "Content-Type": "application/json" } }),
  };
  const server = compile("../lib/server.ts", globals);
  return compile(`../app/api/auth/${action}/route.ts`, globals, { "@/lib/server": server }).POST;
}

for (const action of ["login", "register"]) {
  test(`${action} keeps bearer exclusively in an HttpOnly cookie`, async () => {
    const post = handler(action, { access_token: "fixture-session-bearer", token_type: "bearer", user_id: "user-1" });
    const response = await post({ json: async () => ({ email: "local@example.com", password: "Password123" }) });
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
    const response = await post({ json: async () => ({}) });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { detail: "Invalid credentials" });
    assert.equal(response.headers.get("set-cookie"), null);
  });
}
