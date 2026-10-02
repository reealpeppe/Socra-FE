import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { criteria, hash, loopback, scenarios, validateReview } from "./ux-review-common.mjs";

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "socra-ux-gate-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = { run_id: "run", source_fingerprint: "source", technical_status: "passed", runtime: { kind: "managed_fresh", source_fingerprint: "source", next_build_id: "build" }, artifacts: [] };
  for (const viewport of ["desktop", "mobile"]) for (const scenario of scenarios) for (const extension of ["png", "json"]) {
    const file = `${viewport}-${scenario}.${extension}`;
    await writeFile(path.join(directory, file), "fixture");
    manifest.artifacts.push({ file, sha256: hash("fixture") });
  }
  const review = { run_id: "run", source_fingerprint: "source", status: "passed", reviewer: { kind: "llm", name: "Test reviewer" }, issues: [],
    criteria: ["desktop", "mobile"].flatMap(viewport => criteria.map(id => ({ id, viewport, score: 2, rationale: "Observed result", evidence: [`${viewport}-dashboard.png`] }))) };
  return { manifest, review, directory, check: (source = "source") => validateReview(manifest, review, directory, source) };
}
test("complete current review passes", async t => { assert.deepEqual(await (await fixture(t)).check(), []); });
test("technical success cannot substitute for pending LLM review", async t => {
  const f = await fixture(t); f.review.status = "pending"; f.review.reviewer.name = "";
  assert.match((await f.check()).join(" "), /missing or pending/);
});
test("changed sources invalidate earlier visual review", async t => {
  const f = await fixture(t); assert.match((await f.check("new-source")).join(" "), /Sources changed/);
});
test("an unbound external server cannot certify current sources", async t => {
  const f = await fixture(t); delete f.manifest.runtime;
  assert.match((await f.check()).join(" "), /fresh managed build/);
});
test("changed or missing screenshots invalidate evidence", async t => {
  const f = await fixture(t); await writeFile(path.join(f.directory, "mobile-dashboard.png"), "changed");
  await rm(path.join(f.directory, "desktop-matching.png"));
  const errors = (await f.check()).join(" "); assert.match(errors, /Changed evidence/); assert.match(errors, /Missing evidence/);
});
test("a low semantic score or missing mobile criterion blocks delivery", async t => {
  const f = await fixture(t); f.review.criteria[0].score = 1; f.review.criteria.pop();
  const errors = await f.check(); assert.equal(errors.filter(message => message.startsWith("Unresolved")).length, 2);
});
test("unsupported references and blocking findings cannot pass", async t => {
  const f = await fixture(t); f.review.criteria[0].evidence = ["nonexistent.png"]; f.review.issues.push({ severity: "blocking" });
  const errors = (await f.check()).join(" "); assert.match(errors, /Blocking/); assert.match(errors, /unsupported/);
});
test("remote URLs are rejected before capture", () => {
  assert.equal(loopback("http://localhost:3133/login"), "http://localhost:3133");
  for (const url of ["https://socra.app", "http://localhost.example.com", "file:///tmp/page"]) assert.throws(() => loopback(url));
});
