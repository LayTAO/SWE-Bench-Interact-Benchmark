import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Retain the upstream test runtime and setup, excluding the documentation
// search plugin: pagefind tries to deploy the website while loading tests.
export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.spec.{js,ts}'],
    globals: true, environment: 'jsdom',
    includeSource: ['src/**/*.{js,ts,svelte}'],
    setupFiles: ['./scripts/setupTest.ts'],
    coverage: { exclude: ['setupTest.ts'] },
    alias: [{ find: /^svelte$/, replacement: 'svelte/internal' }],
    deps: { inline: ['clsx'] },
    retry: 0, threads: false,
  },
});
