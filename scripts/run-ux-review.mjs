import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { backend, fingerprint, root } from "./ux-review-common.mjs";

const frontendPort = Number(process.env.UX_FRONTEND_PORT || 3141);
const backendPort = Number(process.env.UX_BACKEND_PORT || 8141);
for (const port of [frontendPort, backendPort]) assert.ok(Number.isInteger(port) && port > 1024 && port < 65536);
assert.notEqual(frontendPort, backendPort);
const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
const python = process.env.UX_PYTHON || path.join(backend, "venv", ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]));
const env = { ...process.env, SOCRA_UX_CAPTURE: "1", NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
  SOCRA_API_BASE_URL: `http://127.0.0.1:${backendPort}`, SOCRA_ENV: "development",
  SOCRA_APP_ORIGIN: `http://127.0.0.1:${frontendPort}`, SOCRA_PUBLIC_ORIGINS: `http://127.0.0.1:${frontendPort}`,
  SOCRA_DATABASE_URL: `sqlite:///${path.join(backend, ".local", "skills-preview.sqlite3").replaceAll("\\", "/")}`,
  SOCRA_EMAIL_ENABLED: "false", SOCRA_EMAIL_VERIFICATION_REQUIRED: "false", SOCRA_GOOGLE_MEET_ENABLED: "false", SOCRA_GOOGLE_MEET_TRANSCRIPTS_ENABLED: "false" };
const children = [];
function launch(command, args, cwd, extra = {}) {
  const child = spawn(command, args, { cwd, env: { ...env, ...extra }, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", data => process.stdout.write(data));
  child.stderr.on("data", data => process.stderr.write(data));
  children.push(child);
  return child;
}
async function finish(child) {
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error(`Managed process failed: ${code}`)));
  });
}
async function free(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once("error", reject);
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}
async function ready(child, pattern) {
  await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => done(new Error("Managed preview startup timed out")), 60000);
    function done(error) { clearTimeout(timeout); child.stdout.off("data", inspect); child.stderr.off("data", inspect); child.off("error", fail); child.off("exit", ended); if (error) reject(error); else resolve(); }
    function inspect(bytes) { output += bytes; if (pattern.test(output)) done(); }
    function fail(error) { done(error); }
    function ended(code) { done(new Error(`Managed preview exited: ${code}`)); }
    child.stdout.on("data", inspect); child.stderr.on("data", inspect); child.once("error", fail); child.once("exit", ended);
  });
}
function stop() {
  for (const child of children.reverse()) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { shell: false, windowsHide: true, stdio: "ignore" });
    else child.kill("SIGTERM");
  }
}
process.once("SIGINT", () => { stop(); process.exit(130); });
process.once("SIGTERM", () => { stop(); process.exit(143); });
try {
  // An existing listener is an error: never certify somebody else's old runtime.
  await free(frontendPort); await free(backendPort);
  await finish(launch(python, ["scripts/seed_ux_review.py"], backend));
  const source = await fingerprint();
  await finish(launch(process.execPath, [next, "build"], root));
  assert.equal(await fingerprint(), source, "Sources changed during managed build");
  const api = launch(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(backendPort)], backend);
  await ready(api, /Uvicorn running on/);
  const web = launch(process.execPath, [next, "start", "-H", "127.0.0.1", "-p", String(frontendPort)], root);
  await ready(web, /Ready in/);
  const runtime = { kind: "managed_fresh", source_fingerprint: source, frontend_pid: web.pid, backend_pid: api.pid,
    next_build_id: (await readFile(path.join(root, ".next-ux", "BUILD_ID"), "utf8")).trim(),
    frontend_url: `http://127.0.0.1:${frontendPort}`, backend_url: `http://127.0.0.1:${backendPort}`, started_at: new Date().toISOString() };
  const receipt = path.join(backend, ".local", "ux-review-runtime.json");
  await writeFile(receipt, JSON.stringify(runtime, null, 2));
  await finish(launch(process.execPath, [path.join(root, "scripts", "capture-ux-review.mjs")], root,
    { UX_BASE_URL: runtime.frontend_url, UX_RUNTIME_RECEIPT: receipt }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { stop(); }
