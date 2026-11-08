import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

test('prelaunch routes explicitly distinguish personal preparation from operational URLs', () => {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../lib/prelaunch-navigation.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports });
  for (const path of ['/dashboard', '/settings', '/goal', '/onboarding', '/competenze', '/prelancio/prepara', '/prelancio/profilo-pronto']) {
    assert.equal(exports.prelaunchPrivateDestination(path), path);
  }
  for (const path of ['/matching', '/paths/other', '/profiles/other', '/requests', '/tour', '/wallet', '/inviti', '/settings/other']) {
    assert.equal(exports.prelaunchPrivateDestination(path), '/dashboard');
  }
  for (const path of ['/prelancio', '/prelancio/grazie', '/prelancio/dati', '/register', '/login']) {
    assert.equal(exports.isPrelaunchEntryPage(path), true);
  }
  for (const path of ['/verify-email', '/prelancio/completa-profilo', '/privacy', '/prelancio/revoca', '/']) {
    assert.equal(exports.isPrelaunchEntryPage(path), false);
  }
});
