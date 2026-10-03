import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ADVISORY = 'GHSA-vfj7-8cjw-p6xm';
const EXPIRES = new Date('2026-10-10T00:00:00.000Z');
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
// This is one reviewed dependency graph, not an advisory-wide allowlist.
const CHAIN = [
  ['eslint-config-next', '16.3.6', '^16.3.6'],
  ['@next/eslint-plugin-next', '16.3.6', '16.3.6'],
  ['fast-glob', '3.3.1', '3.3.1'],
  ['micromatch', '4.0.8', '^4.0.4'],
  ['braces', '3.0.3', '^3.0.3'],
];

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function parseAudit(result, label) {
  requireCondition(result && !result.error && !result.signal && [0, 1].includes(result.status), `${label}: audit process failed`);
  let report;
  try { report = JSON.parse(result.stdout); } catch { throw new Error(`${label}: invalid audit JSON`); }
  requireCondition(object(report) && !report.error && report.auditReportVersion === 2 && object(report.vulnerabilities), `${label}: invalid audit schema or registry error`);
  const counts = report.metadata?.vulnerabilities;
  requireCondition(object(counts), `${label}: missing audit metadata`);
  const actualCounts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const [name, value] of Object.entries(report.vulnerabilities)) {
    requireCondition(object(value) && value.name === name && SEVERITIES.includes(value.severity)
      && Array.isArray(value.via) && value.via.length > 0 && Array.isArray(value.nodes) && value.nodes.length > 0
      && Array.isArray(value.effects) && typeof value.isDirect === 'boolean', `${label}: invalid vulnerability schema`);
    actualCounts[value.severity]++;
  }
  const total = Object.keys(report.vulnerabilities).length;
  requireCondition(SEVERITIES.every((severity) => Number.isInteger(counts[severity]) && counts[severity] === actualCounts[severity])
    && counts.total === total, `${label}: inconsistent audit metadata`);
  requireCondition(result.status === (total > 0 ? 1 : 0), `${label}: audit process status disagrees with report`);
  return report;
}

function verifyLockfile(lockfile) {
  requireCondition(lockfile?.lockfileVersion === 3 && object(lockfile.packages) && object(lockfile.packages['']), 'Invalid lockfile schema');
  const packages = lockfile.packages;
  const expectedConsumers = new Set();
  for (const [index, [name, version, range]] of CHAIN.entries()) {
    const location = `node_modules/${name}`;
    const entry = packages[location];
    requireCondition(entry?.dev === true, `Exception requires dev-only package: ${name}`);
    requireCondition(entry.version === version, `Unreviewed chain version: ${name}`);
    const locations = Object.keys(packages).filter((key) => key === location || key.endsWith(`/${location}`));
    requireCondition(equal(locations, [location]), `Unreviewed chain install location: ${name}`);
    const parent = index === 0 ? '' : `node_modules/${CHAIN[index - 1][0]}`;
    const type = index === 0 ? 'devDependencies' : 'dependencies';
    requireCondition(packages[parent]?.[type]?.[name] === range, `Unreviewed chain edge: ${parent} -> ${name}`);
    expectedConsumers.add(`${parent}|${type}|${name}`);
  }
  for (const [location, entry] of Object.entries(packages)) {
    for (const type of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [name] of CHAIN) {
        if (entry[type]?.[name] !== undefined) {
          requireCondition(expectedConsumers.has(`${location}|${type}|${name}`), `Unreviewed chain consumer: ${location || 'root'} -> ${name}`);
        }
      }
    }
  }
}

export function evaluateAudits({ full, runtime, lockfile, now = new Date(), nextRootDir }) {
  requireCondition(now instanceof Date && Number.isFinite(now.getTime()), 'Invalid audit clock');
  const runtimeReport = parseAudit(runtime, 'runtime');
  requireCondition(runtimeReport.metadata.vulnerabilities.total === 0, 'The runtime audit must have zero vulnerabilities');
  const report = parseAudit(full, 'full');
  if (report.metadata.vulnerabilities.total === 0) {
    return { fullVulnerabilities: 0, runtimeVulnerabilities: 0, knownExceptions: [], message: 'Dependency audit: full 0 vulnerabilities; runtime 0 vulnerabilities; 0 known exceptions.' };
  }
  requireCondition(now < EXPIRES, `Known exception ${ADVISORY} expired at ${EXPIRES.toISOString()}`);
  requireCondition(nextRootDir === undefined, 'Exception requires settings.next.rootDir to remain unset');
  requireCondition(equal(Object.keys(report.vulnerabilities).sort(), CHAIN.map(([name]) => name).sort()), 'Unreviewed vulnerability chain');
  for (const [index, [name]] of CHAIN.entries()) {
    const item = report.vulnerabilities[name];
    requireCondition(item.severity === 'high' && item.isDirect === (index === 0)
      && equal(item.nodes, [`node_modules/${name}`])
      && equal(item.effects, index === 0 ? [] : [CHAIN[index - 1][0]]), `Unreviewed chain record: ${name}`);
    if (name === 'braces') {
      const advisory = item.via[0];
      requireCondition(item.via.length === 1 && object(advisory) && advisory.source === 1240992
        && advisory.name === 'braces' && advisory.dependency === 'braces' && advisory.severity === 'high'
        && advisory.url === `https://github.com/advisories/${ADVISORY}` && advisory.range === '<=3.0.3', 'Unreviewed braces advisory');
    } else {
      requireCondition(equal(item.via, [CHAIN[index + 1][0]]), `Unreviewed chain advisory route: ${name}`);
    }
  }
  verifyLockfile(lockfile);
  return {
    fullVulnerabilities: 5,
    runtimeVulnerabilities: 0,
    knownExceptions: [ADVISORY],
    expiresAt: EXPIRES.toISOString(),
    message: `Dependency audit: full 5 high findings; runtime 0 vulnerabilities; 1 known exception (${ADVISORY}, reviewed dev-only chain), expires ${EXPIRES.toISOString()}.`,
  };
}

async function main() {
  const cwd = process.cwd();
  const artifactDirectory = resolve(cwd, '.local/security-audit');
  mkdirSync(artifactDirectory, { recursive: true });
  try {
    // npm run supplies its own CLI path on Windows and Linux; no shell command interpolation.
    requireCondition(process.env.npm_execpath, 'Run this gate with npm run audit:security');
    const run = (omitDev) => spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--json', '--audit-level=low', omitDev ? '--omit=dev' : '--include=dev'], {
      cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: 5 * 1024 * 1024,
    });
    const full = run(false);
    const runtime = run(true);
    for (const [name, result] of Object.entries({ full, runtime })) {
      writeFileSync(resolve(artifactDirectory, `${name}.json`), result.stdout || '');
      writeFileSync(resolve(artifactDirectory, `${name}-process.json`), JSON.stringify({ status: result.status, signal: result.signal, error: result.error?.message, stderr: result.stderr }, null, 2));
    }
    const { ESLint } = await import('eslint');
    const config = await new ESLint({ cwd }).calculateConfigForFile(resolve(cwd, 'app/page.tsx'));
    requireCondition(config, 'Unable to inspect effective ESLint configuration');
    const summary = evaluateAudits({
      full, runtime,
      lockfile: JSON.parse(readFileSync(resolve(cwd, 'package-lock.json'), 'utf8')),
      nextRootDir: config.settings?.next?.rootDir,
    });
    writeFileSync(resolve(artifactDirectory, 'summary.json'), JSON.stringify({ status: 'passed', ...summary }, null, 2));
    console.log(summary.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeFileSync(resolve(artifactDirectory, 'summary.json'), JSON.stringify({ status: 'failed', message }, null, 2));
    console.error(`Dependency audit blocked: ${message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
