// Copied to the prepared subject root by the hidden verifier, never the Agent.
import { readFileSync, existsSync } from 'node:fs';
import { playwright } from '@vitest/browser-playwright';
import upstream from './packages/react/vitest.config.mts';

const files: string[] = JSON.parse(readFileSync('/tests/verifier/base_ui_test_files.json', 'utf8'));
if (!files.length || files.some(file => !/^packages\/react\/src\/[\w/.-]+\.test\.tsx?$/.test(file))) {
  throw new Error('Invalid Accepted official test file manifest');
}
const aliases = upstream.resolve?.alias;
if (!aliases || Array.isArray(aliases)) {
  throw new Error('Unexpected Base UI upstream alias configuration');
}
const browserAliases = { ...aliases };
const acceptedExecutable = process.env.HARBOR_ACCEPTED_CHROMIUM_EXECUTABLE;
if (acceptedExecutable && !existsSync(acceptedExecutable)) {
  throw new Error('The Accepted Chromium executable is missing');
}
// Empty-string Node builtin aliases are invalid in the pinned Vite 8 resolver.
// Let Vite apply its normal browser externalization instead. No polyfill or
// production module substitution is introduced.
for (const builtin of ['stream', 'zlib']) {
  if (browserAliases[builtin] === '') delete browserAliases[builtin];
}

export default {
  ...upstream,
  resolve: { ...upstream.resolve, alias: browserAliases },
  test: {
    ...upstream.test,
    // Vitest's browser optimizer scans globTestFiles() without CLI filters.
    // Use the same files already selected by the Accepted official command.
    include: files,
    exclude: [...(upstream.test?.exclude || []), '**/node_modules/**'],
    maxWorkers: 1,
    retry: 0,
    browser: upstream.test?.browser?.enabled && acceptedExecutable
      ? { ...upstream.test.browser, provider: playwright({ launchOptions: { executablePath: acceptedExecutable } }) }
      : upstream.test?.browser,
  },
};
