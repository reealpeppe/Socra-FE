import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const backend = path.resolve(process.env.UX_BACKEND_DIR || path.join(root, "..", "backend"));
export const criteria = ["objectives", "private-context", "experience-save", "goal-hierarchy", "matching-score", "partial-agreement", "mentor-paths", "preparation", "mentor-removal"];
export const scenarios = ["dashboard", "mentor-paths", "experience", "experience-saved", "private-context", "matching", "partial-details", "agreement", "request-saved", "mentor-profile", "mentor-removal-settings", "mentor-removal-settings-saved", "mentor-removal-experience", "mentor-removal-experience-saved"];
export function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
async function tree(directory, prefix = "") {
  const rows = [];
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (["__pycache__", ".DS_Store"].includes(item.name) || item.name.endsWith(".pyc")) continue;
    const name = `${prefix}${item.name}`;
    if (item.isDirectory()) rows.push(...await tree(path.join(directory, item.name), `${name}/`));
    else rows.push(`${name}:${hash(await readFile(path.join(directory, item.name)))}`);
  }
  return rows;
}
export async function fingerprint() {
  const entries = [];
  for (const name of ["app", "components", "lib"]) entries.push(...(await tree(path.join(root, name), `frontend/${name}/`)));
  entries.push(...await tree(path.join(backend, "app"), "backend/app/"));
  entries.push(...await tree(path.join(backend, "migrations"), "backend/migrations/"));
  entries.push(`backend/requirements.txt:${hash(await readFile(path.join(backend, "requirements.txt")))}`);
  for (const name of ["package.json", "package-lock.json", "next.config.ts", "next.config.mjs", "tsconfig.json", "tsconfig.ux.json", "proxy.ts"]) {
    try { entries.push(`frontend/${name}:${hash(await readFile(path.join(root, name)))}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  for (const name of ["run-ux-review.mjs", "capture-ux-review.mjs", "ux-review-common.mjs", "verify-ux-review.mjs"]) entries.push(`frontend/scripts/${name}:${hash(await readFile(path.join(root, "scripts", name)))}`);
  entries.push(`backend/ux-seed:${hash(await readFile(path.join(backend, "scripts", "seed_ux_review.py")))}`);
  return hash(entries.join("\n"));
}
export function loopback(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("UX capture requires an HTTP loopback preview");
  return url.origin;
}
export async function validateReview(manifest, review, directory, currentFingerprint) {
  const errors = [];
  if (manifest.source_fingerprint !== currentFingerprint) errors.push("Sources changed: capture again");
  if (review.run_id !== manifest.run_id || review.source_fingerprint !== manifest.source_fingerprint) errors.push("Review belongs to another run/source");
  if (review.status !== "passed" || review.reviewer?.kind !== "llm" || !review.reviewer?.name) errors.push("Independent LLM review is missing or pending");
  if (manifest.technical_status !== "passed") errors.push("Flow capture failed");
  if (manifest.runtime?.kind !== "managed_fresh" || manifest.runtime?.source_fingerprint !== manifest.source_fingerprint || !manifest.runtime?.next_build_id) errors.push("Runtime is not bound to a fresh managed build");
  if (review.issues?.some(issue => issue.severity === "blocking")) errors.push("Blocking UX issues remain");
  const evidence = new Set();
  for (const artifact of manifest.artifacts || []) {
    const resolved = path.resolve(directory, artifact.file);
    if (!resolved.startsWith(`${path.resolve(directory)}${path.sep}`)) { errors.push("Artifact outside evidence directory"); continue; }
    try {
      if (hash(await readFile(resolved)) !== artifact.sha256) errors.push(`Changed evidence: ${artifact.file}`);
      else evidence.add(artifact.file);
    } catch { errors.push(`Missing evidence: ${artifact.file}`); }
  }
  for (const viewport of ["desktop", "mobile"]) {
    for (const scenario of scenarios) {
      for (const extension of ["png", "json"]) if (!evidence.has(`${viewport}-${scenario}.${extension}`)) errors.push(`Missing ${viewport}/${scenario} ${extension}`);
    }
    for (const id of criteria) {
      const rows = review.criteria?.filter(row => row.id === id && row.viewport === viewport) || [];
      if (rows.length !== 1 || rows[0].score !== 2 || !rows[0].rationale?.trim() || !rows[0].evidence?.length || rows[0].evidence.some(file => !evidence.has(file))) errors.push(`Unresolved or unsupported criterion: ${viewport}/${id}`);
    }
  }
  return errors;
}
