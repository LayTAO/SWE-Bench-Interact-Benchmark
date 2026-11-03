import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const requireRepo = createRequire('/workspace/repo/package.json');
const {playwright} = await import(pathToFileURL(requireRepo.resolve('@vitest/browser-playwright')));
export default {
  root: '/workspace/repo',
  test: {
    include: ['packages/components/select/src/select.spec.ts'],
    setupFiles: ['/workspace/repo/vitest.setup.ts'],
    browser: {
      enabled: true, headless: true,
      provider: playwright({launchOptions: {args: ['--no-sandbox']}, contextOptions: {locale: 'en', reducedMotion: 'reduce'}}),
      instances: [{browser: 'chromium'}], viewport: {width: 1024, height: 768}
    }
  }
};
