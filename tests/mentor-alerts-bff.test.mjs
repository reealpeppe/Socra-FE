import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);
function compile(file, globals, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require: name => imports[name] || require(name), ...globals });
  return exports;
}
function fixture(streamFailure = false) {
  const calls = [];
  const globals = { process: { env: { NODE_ENV: "production" } }, TextDecoder, Uint8Array, AbortSignal,
    fetch: async (url, init) => { calls.push({ url, init }); return streamFailure ? new Response(new ReadableStream({ start(controller) { controller.error(new Error("Stream interrupted")); } })) : Response.json({ status: "ok" }); } };
  const security = compile("../lib/web-security.ts", globals);
  const { POST } = compile("../app/api/mentor-alerts/unsubscribe/route.ts", globals, {
    "@/lib/web-security": security, "@/lib/server": { getBackendUrl: path => `https://backend.example${path}` },
  });
  const request = (body, headers = {}) => new NextRequest("https://www.socra.it/api/mentor-alerts/unsubscribe", {
    method: "POST", headers: { Origin: "https://www.socra.it", "Content-Type": "application/json", ...headers }, body,
  });
  return { POST, calls, request };
}
test("unsubscribe uses a fixed public upstream without forwarding session credentials", async () => {
  const { POST, calls, request } = fixture();
  const response = await POST(request(JSON.stringify({ token: "synthetic-token" }), { Cookie: "socra_session=private" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://backend.example/mentor-alerts/unsubscribe");
  assert.deepEqual(Object.keys(calls[0].init.headers), ["Content-Type"]);
});
test("unsubscribe rejects cross-site requests, wrong content types and oversized bodies before upstream", async () => {
  const { POST, calls, request } = fixture();
  for (const [body, headers, status] of [
    ['{}', { Origin: 'https://external.example' }, 403],
    ['{}', { 'Sec-Fetch-Site': 'cross-site' }, 403],
    ['{}', { 'Content-Type': 'text/plain' }, 415],
    ['invalid', {}, 400],
    [JSON.stringify({ token: 'x'.repeat(5000) }), {}, 413],
  ]) assert.equal((await POST(request(body, headers))).status, status);
  assert.equal(calls.length, 0);
});
test("unsubscribe returns private JSON when upstream body streaming fails after headers", async () => {
  const { POST, request } = fixture(true);
  const response = await POST(request(JSON.stringify({ token: "synthetic-token" })));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match((await response.json()).detail, /Riprova/);
});
