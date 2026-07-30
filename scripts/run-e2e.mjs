import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PLAYWRIGHT_PORT || "3100";
const baseURL = `http://127.0.0.1:${port}`;
const nextCli = path.join(frontendRoot, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(frontendRoot, "node_modules", "@playwright", "test", "cli.js");
const playwrightArgs = process.argv.slice(2);

const server = spawn(process.execPath, [nextCli, "start", "-p", port], {
  cwd: frontendRoot,
  env: { ...process.env, PORT: port },
  shell: false,
  stdio: "inherit",
  windowsHide: true,
});

function runTests() {
  return new Promise((resolve, reject) => {
    const tests = spawn(process.execPath, [playwrightCli, "test", ...playwrightArgs], {
      cwd: frontendRoot,
      env: {
        ...process.env,
        PLAYWRIGHT_EXTERNAL_SERVER: "1",
        PLAYWRIGHT_PORT: port,
      },
      shell: false,
      stdio: "inherit",
      windowsHide: true,
    });
    tests.once("error", reject);
    tests.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Playwright terminated by ${signal}`));
      else resolve(code ?? 1);
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js test server exited with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(baseURL, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Next.js test server did not become ready at ${baseURL}`);
}

function stopServer() {
  if (server.exitCode !== null || !server.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      shell: false,
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  server.kill("SIGTERM");
}

let exitCode = 1;
try {
  await waitForServer();
  exitCode = await runTests();
} finally {
  stopServer();
}

process.exit(exitCode);
