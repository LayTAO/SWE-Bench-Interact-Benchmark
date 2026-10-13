import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    threads: false,
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    include: ["**/*test.{ts,tsx}"],
  },
});
