import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

const pluginRequire = createRequire(import.meta.resolve('@next/eslint-plugin-next'));
const { getRootDirs } = pluginRequire('./utils/get-root-dirs.js');
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('Next lint resolves the reviewed replacement and contains no vulnerable braces chain', () => {
  const globPackage = pluginRequire('fast-glob/package.json');
  assert.equal(globPackage.name, 'tinyglobby');
  assert.equal(globPackage.version, '0.2.16');
  for (const [location, metadata] of Object.entries(lock.packages)) {
    assert.ok(!/(^|\/)(braces|micromatch)$/.test(location), `Vulnerable parser retained: ${location}`);
    assert.notEqual(metadata.name, 'braces');
  }
});

test('Next root lookup preserves the default single-project directory', t => {
  const directory = mkdtempSync(join(tmpdir(), 'socra-lint-glob-'));
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('socra-lint-glob-'));
    rmSync(directory, { recursive: true, force: true });
  });
  const context = settings => ({ cwd: directory, settings });
  assert.deepEqual(getRootDirs(context({})), [directory]);
  assert.deepEqual(getRootDirs(context({next:{}})), [directory]);
});

test('effective lint still enforces Next core-web-vitals, React hooks and TypeScript rules', async () => {
  const eslint = new ESLint();
  const config = await eslint.calculateConfigForFile('app/page.tsx');
  assert.equal(config.settings?.next?.rootDir, undefined);
  assert.equal(config.rules['@next/next/no-html-link-for-pages'][0], 2);
  assert.equal(config.rules['react-hooks/rules-of-hooks'][0], 2);
  assert.ok(config.rules['@typescript-eslint/no-unused-vars'][0] > 0);
  const [result] = await eslint.lintText('export default function Page() { return <><img src="/test.png" alt="" /><a href="/">Home</a></>; }', { filePath: 'app/page.tsx' });
  assert.ok(result.messages.some(message => message.ruleId === '@next/next/no-img-element'));
  assert.ok(result.messages.some(message => message.ruleId === '@next/next/no-html-link-for-pages'));
});

test('patched minimatch preserves callable matching in legacy lint plugins', async () => {
  const eslint = new ESLint({ overrideConfig: [{ rules: {
    'react/no-danger': ['error', { customComponentNames: ['Html*'] }],
  } }] });
  const [result] = await eslint.lintText('export default function Page() { return <HtmlBlock dangerouslySetInnerHTML={{__html: "test"}} />; }', { filePath: 'app/page.tsx' });
  assert.ok(result.messages.some(message => message.ruleId === 'react/no-danger'));
});
