import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateAudits } from '../scripts/audit-dependencies.mjs';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const fullReport = readJson('./fixtures/dependency-audit/full-2026-10-03.json');
const runtimeReport = readJson('./fixtures/dependency-audit/runtime-2026-10-03.json');
// This graph accompanies the stored historical report; the current gate grants no exception.
const lockfile = readJson('./fixtures/dependency-audit/lock-2026-10-03-chain.json');
const processResult = (report, status) => ({ stdout: JSON.stringify(report), stderr: '', status, signal: null });

function input() {
  return {
    full: processResult(structuredClone(fullReport), 1),
    runtime: processResult(structuredClone(runtimeReport), 0),
    lockfile: structuredClone(lockfile),
    now: new Date('2026-10-09T23:59:59.999Z'),
    nextRootDir: undefined,
  };
}

function changeReport(value, kind, mutate) {
  const report = JSON.parse(value[kind].stdout);
  mutate(report);
  value[kind].stdout = JSON.stringify(report);
}

test('the retired advisory is blocked even before the former exception deadline', () => {
  assert.throws(() => evaluateAudits(input()), /full audit must have zero/);
});

test('a genuinely clean report passes with no exception', () => {
  const value = input();
  value.full = processResult(runtimeReport, 0);
  const result = evaluateAudits(value);
  assert.equal(result.fullVulnerabilities, 0);
  assert.equal(result.runtimeVulnerabilities, 0);
  assert.deepEqual(result.knownExceptions, []);
  assert.equal(result.expiresAt, undefined);
});

test('new root-directory glob configuration requires review even with clean audits', () => {
  const value=input(); value.full=processResult(runtimeReport,0); value.nextRootDir=['apps/**'];
  assert.throws(()=>evaluateAudits(value),/rootDir/);
});

test('the current graph cannot exempt the historical finding at any date', () => {
  const value = input();
  value.lockfile = readJson('../package-lock.json');
  assert.throws(() => evaluateAudits(value), /full audit must have zero/);
  value.now = new Date('2026-10-11T00:00:00Z');
  assert.throws(() => evaluateAudits(value), /full audit must have zero/);
});

const invalidCases = [
  ['rejects the former exception after its original deadline', v => { v.now = new Date('2026-10-11T00:00:00Z'); }, /full audit must have zero/],
  ['rejects the same advisory in the runtime audit', v => { v.runtime = processResult(fullReport, 1); }, /runtime/],
  ['rejects missing runtime output', v => { v.runtime.stdout = ''; }, /runtime.*JSON/],
  ['rejects a network error report', v => { v.full = processResult({error:{code:'ENOTFOUND'}},1); }, /error|schema/],
  ['rejects a killed audit process', v => { v.full.status = null; v.full.signal = 'SIGTERM'; }, /process/],
  ['rejects a failed process even with a cached valid report', v => { v.full.error = new Error('ETIMEDOUT'); }, /process/],
  ['rejects unexpected exit codes', v => { v.full.status = 2; }, /process/],
  ['rejects invalid full JSON', v => { v.full.stdout = 'registry unavailable'; }, /JSON/],
  ['rejects unknown report schema', v => changeReport(v,'full',r=>{r.auditReportVersion=3;}), /schema/],
  ['rejects missing severity counts', v => changeReport(v,'full',r=>{delete r.metadata.vulnerabilities.high;}), /metadata/],
  ['rejects counts that hide findings', v => changeReport(v,'full',r=>{r.metadata.vulnerabilities.total=0;}), /metadata/],
  ['rejects inconsistent severities', v => changeReport(v,'full',r=>{r.vulnerabilities.braces.severity='moderate';}), /metadata/],
  ['rejects a clean report with a failed process status', v => {v.full=processResult(runtimeReport,1);}, /status/],
];
for (const [name, mutate, message] of invalidCases) {
  test(name, () => { const value=input(); mutate(value); assert.throws(()=>evaluateAudits(value),message); });
}
for (const severity of ['info','low','moderate','high','critical']) {
  test('rejects a new '+severity+' advisory with otherwise consistent metadata',()=>{
    const value=input();
    const report=structuredClone(runtimeReport);
    report.vulnerabilities.other={...structuredClone(fullReport.vulnerabilities.braces),name:'other',severity};
    report.metadata.vulnerabilities[severity]=1;report.metadata.vulnerabilities.total=1;
    value.full=processResult(report,1);
    assert.throws(()=>evaluateAudits(value),/full audit must have zero/);
  });
}

// Only the npm registry/process boundary is simulated. These tests execute the
// real CLI, effective ESLint configuration, lock validation and artifact writes.
function runCli(t, full, runtime) {
  const directory = mkdtempSync(join(tmpdir(), 'socra-audit-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'app/(public)'), { recursive: true });
  writeFileSync(join(directory, 'app/(public)/page.tsx'), 'export default function Page() { return null; }');
  writeFileSync(join(directory, 'eslint.config.mjs'), 'export default [{ files: ["**/*.tsx"], settings: {} }];');
  writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(lockfile));
  writeFileSync(join(directory, 'responses.json'), JSON.stringify({ full, runtime }));
  const npmCli = join(directory, 'npm-cli.cjs');
  writeFileSync(npmCli, `
    const fs = require('node:fs');
    const args = process.argv.slice(2);
    fs.appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
    const response = JSON.parse(fs.readFileSync('responses.json', 'utf8'))[args.includes('--omit=dev') ? 'runtime' : 'full'];
    process.stdout.write(response.stdout);
    process.stderr.write(response.stderr);
    process.exit(response.status);
  `);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/audit-dependencies.mjs', import.meta.url))], {
    cwd: directory, env: { ...process.env, npm_execpath: npmCli }, encoding: 'utf8', timeout: 15_000,
  });
  const artifacts = join(directory, '.local/security-audit');
  return {
    result,
    summary: JSON.parse(readFileSync(join(artifacts, 'summary.json'), 'utf8')),
    full: readFileSync(join(artifacts, 'full.json'), 'utf8'),
    runtime: readFileSync(join(artifacts, 'runtime.json'), 'utf8'),
    calls: readFileSync(join(directory, 'calls.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line)),
  };
}

test('the CLI audits both scopes and persists the genuine clean result', (t) => {
  const { result, summary, calls } = runCli(t, processResult(runtimeReport, 0), processResult(runtimeReport, 0));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(summary.status, 'passed');
  assert.equal(summary.fullVulnerabilities, 0);
  assert.deepEqual(calls, [
    ['audit', '--json', '--audit-level=low', '--include=dev'],
    ['audit', '--json', '--audit-level=low', '--omit=dev'],
  ]);
});

test('the CLI exits nonzero on malformed registry output and keeps evidence', (t) => {
  const { result, summary, full } = runCli(t, { stdout: 'not JSON', stderr: 'registry failed', status: 1 }, processResult(runtimeReport, 0));
  assert.equal(result.status, 1);
  assert.equal(summary.status, 'failed');
  assert.match(result.stderr, /invalid audit JSON/);
  assert.equal(full, 'not JSON');
});

test('the CLI cannot exempt the same advisory returned by the runtime audit', (t) => {
  const { result, summary, runtime } = runCli(t, processResult(fullReport, 1), processResult(fullReport, 1));
  assert.equal(result.status, 1);
  assert.equal(summary.status, 'failed');
  assert.match(result.stderr, /runtime audit must have zero/);
  assert.equal(JSON.parse(runtime).metadata.vulnerabilities.high, 5);
});
