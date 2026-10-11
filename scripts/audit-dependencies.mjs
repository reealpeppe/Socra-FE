import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
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

export function evaluateAudits({ full, runtime, nextRootDir }) {
  const runtimeReport = parseAudit(runtime, 'runtime');
  requireCondition(runtimeReport.metadata.vulnerabilities.total === 0, 'The runtime audit must have zero vulnerabilities');
  const fullReport = parseAudit(full, 'full');
  requireCondition(fullReport.metadata.vulnerabilities.total === 0, 'The full audit must have zero vulnerabilities');
  // tinyglobby has different directory expansion/absolute-path defaults. The
  // scoped alias is reviewed only for Socra's existing single-project config.
  requireCondition(nextRootDir === undefined, 'Reviewed lint replacement requires settings.next.rootDir to remain unset');
  return { fullVulnerabilities: 0, runtimeVulnerabilities: 0, knownExceptions: [], message: 'Dependency audit: full 0 vulnerabilities; runtime 0 vulnerabilities; 0 known exceptions.' };
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
    const config = await new ESLint({ cwd }).calculateConfigForFile(resolve(cwd, 'app/(public)/page.tsx'));
    requireCondition(config, 'Unable to inspect effective ESLint configuration');
    const summary = evaluateAudits({ full, runtime, nextRootDir: config.settings?.next?.rootDir });
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
