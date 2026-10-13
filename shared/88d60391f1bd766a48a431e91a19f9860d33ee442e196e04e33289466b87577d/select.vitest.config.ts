import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    onConsoleLog: log => !(log.startsWith('Lit is in dev mode') || log === 'null'),
    include: ['packages/components/select/src/select.spec.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: {
          locale: 'en',
          reducedMotion: 'reduce'
        }
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1024, height: 768 }
    },
    setupFiles: 'vitest.setup.ts'
  }
});
