import react from "/tooling/node_modules/@vitejs/plugin-react/dist/index.js";
import {defineConfig} from "/tooling/node_modules/vite/dist/node/index.js";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: "/subject/node_modules/react",
      "react-dom": "/subject/node_modules/react-dom",
      ariakit: "/subject/packages/ariakit/src",
      "ariakit-utils": "/subject/packages/ariakit-utils/src",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    fs: {allow: ["/subject", "/oracle-src", "/tooling"]},
  },
  build: {outDir: "/state-cache/dist", emptyOutDir: true},
});
