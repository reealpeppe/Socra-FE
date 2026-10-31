import { createRequire } from 'node:module';

// Lint-only adapter: older ESLint plugins call the CommonJS export directly.
// Keep the patched implementation and all named helpers without restoring v3.
const require = createRequire(import.meta.url);
const resolved = require.resolve('minimatch');
const implementation = require(resolved);
if (typeof implementation !== 'function') {
  require.cache[resolved].exports = Object.assign(implementation.minimatch, implementation);
}
