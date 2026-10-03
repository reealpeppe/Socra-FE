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
const lockfile = readJson('../package-lock.json');
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

test('the captured npm report passes only with five high findings and one explicit temporary exception', () => {
  const result = evaluateAudits(input());
  assert.equal(result.fullVulnerabilities, 5);
  assert.equal(result.runtimeVulnerabilities, 0);
  assert.deepEqual(result.knownExceptions, ['GHSA-vfj7-8cjw-p6xm']);
  assert.match(result.message, /5 high/);
  assert.match(result.message, /1 known exception/);
  assert.match(result.message, /2026-10-10T00:00:00.000Z/);
});

test('a genuinely clean full report needs no exception even after its expiry', () => {
  const value = input();
  value.full = processResult(runtimeReport, 0);
  value.now = new Date('2026-10-11T00:00:00Z');
  const result = evaluateAudits(value);
  assert.equal(result.fullVulnerabilities, 0);
  assert.deepEqual(result.knownExceptions, []);
});

const invalidCases = [
  ['expires at the first instant of October 10 UTC', (v) => { v.now = new Date('2026-10-10T00:00:00Z'); }, /expired/],
  ['rejects an invalid clock', (v) => { v.now = new Date('invalid'); }, /clock/],
  ['rejects the same advisory in the runtime audit', (v) => { v.runtime = processResult(fullReport, 1); }, /runtime/],
  ['rejects missing runtime output', (v) => { v.runtime.stdout = ''; }, /runtime.*JSON/],
  ['rejects a network error report', (v) => { v.full = processResult({ error: { code: 'ENOTFOUND' } }, 1); }, /error|schema/],
  ['rejects a killed audit process', (v) => { v.full.status = null; v.full.signal = 'SIGTERM'; }, /process/],
  ['rejects a failed process even with a cached valid report', (v) => { v.full.error = new Error('ETIMEDOUT'); }, /process/],
  ['rejects unexpected exit codes', (v) => { v.full.status = 2; }, /process/],
  ['rejects invalid full JSON', (v) => { v.full.stdout = 'registry unavailable'; }, /JSON/],
  ['rejects an unknown report schema', (v) => changeReport(v, 'full', (r) => { r.auditReportVersion = 3; }), /schema/],
  ['rejects missing severity counts', (v) => changeReport(v, 'full', (r) => { delete r.metadata.vulnerabilities.high; }), /metadata/],
  ['rejects counts that hide findings', (v) => changeReport(v, 'full', (r) => { r.metadata.vulnerabilities.total = 0; }), /metadata/],
  ['rejects a severity downgrade in one transitive record', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.braces.severity = 'moderate'; }), /metadata|chain/],
  ['rejects a new advisory on an already exempted package', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.braces.via.push({ ...r.vulnerabilities.braces.via[0], url: 'https://github.com/advisories/GHSA-new-advisory', source: 999999 }); }), /advisory/],
  ['rejects replacement of the allowed advisory', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.braces.via[0].url = 'https://github.com/advisories/GHSA-other'; }), /advisory/],
  ['rejects another high dependency', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.other = { ...r.vulnerabilities.braces, name: 'other' }; r.metadata.vulnerabilities.high++; r.metadata.vulnerabilities.total++; }), /chain/],
  ['rejects a new low advisory rather than silently widening the exception', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.other = { ...r.vulnerabilities.braces, name: 'other', severity: 'low' }; r.metadata.vulnerabilities.low++; r.metadata.vulnerabilities.total++; }), /chain/],
  ['rejects an extra affected install path', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities.braces.nodes.push('node_modules/other/node_modules/braces'); }), /chain/],
  ['rejects an alternate transitive route', (v) => changeReport(v, 'full', (r) => { r.vulnerabilities['fast-glob'].via = ['braces']; }), /chain/],
  ['rejects a lockfile package that is no longer dev-only', (v) => { delete v.lockfile.packages['node_modules/braces'].dev; }, /dev-only/],
  ['rejects an unreviewed chain version', (v) => { v.lockfile.packages['node_modules/micromatch'].version = '4.0.9'; }, /version/],
  ['rejects a nested copy of the package in the lockfile', (v) => { v.lockfile.packages['node_modules/other/node_modules/braces'] = { ...v.lockfile.packages['node_modules/braces'] }; }, /chain/],
  ['rejects an additional consumer even when dev-only', (v) => { v.lockfile.packages['node_modules/another-tool'] = { version: '1.0.0', dev: true, dependencies: { braces: '^3.0.3' } }; }, /chain/],
  ['rejects a root runtime dependency on the affected package', (v) => { v.lockfile.packages[''].dependencies.braces = '3.0.3'; }, /chain/],
  ['rejects a changed declared chain edge', (v) => { v.lockfile.packages['node_modules/fast-glob'].dependencies.micromatch = '*'; }, /chain/],
  ['rejects malformed lock metadata', (v) => { delete v.lockfile.packages; }, /lockfile/],
  ['rejects newly configured Next root globs', (v) => { v.nextRootDir = ['apps/**']; }, /rootDir/],
];

for (const [name, mutate, message] of invalidCases) {
  test(name, () => {
    const value = input();
    mutate(value);
    assert.throws(() => evaluateAudits(value), message);
  });
}

// Only the npm registry/process boundary is simulated. These tests execute the
// real CLI, effective ESLint configuration, lock validation and artifact writes.
function runCli(t, full, runtime) {
  const directory = mkdtempSync(join(tmpdir(), 'socra-audit-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'app'));
  writeFileSync(join(directory, 'app/page.tsx'), 'export default function Page() { return null; }');
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
