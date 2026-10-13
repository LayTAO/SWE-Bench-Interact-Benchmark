import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^motion-utils$/, replacement: "/subject/packages/motion-utils/src/index.ts" },
            { find: /^react$/, replacement: "/oracle/node_modules/react" },
            { find: /^react-dom$/, replacement: "/oracle/node_modules/react-dom" },
            { find: /^react-dom\/client$/, replacement: "/oracle/node_modules/react-dom/client.js" },
        ],
    },
    server: { fs: { allow: ["/subject", "/oracle"] } },
})
