import { readFile } from "node:fs/promises";
import path from "node:path";
import { criteria, fingerprint, validateReview } from "./ux-review-common.mjs";

const directory = process.argv[2];
if (!directory) throw new Error("Usage: npm run test:ux:verify -- output/playwright/ux-review/<run>");
const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
const review = JSON.parse(await readFile(path.join(directory, "review.json"), "utf8"));
const errors = await validateReview(manifest, review, directory, await fingerprint());
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`UX review passed: ${manifest.run_id}; ${criteria.length} criteria × desktop/mobile, evidence hashes verified.`);
