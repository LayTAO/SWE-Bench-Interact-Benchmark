import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^framer-motion$/, replacement: "/subject/packages/framer-motion/src/index.ts" },
            { find: /^motion-dom$/, replacement: "/subject/packages/motion-dom/src/index.ts" },
            { find: /^motion-utils$/, replacement: "/subject/packages/motion-utils/src/index.ts" },
            { find: /^react$/, replacement: "/oracle/node_modules/react" },
            { find: /^react\/jsx-runtime$/, replacement: "/oracle/node_modules/react/jsx-runtime.js" },
            { find: /^react\/jsx-dev-runtime$/, replacement: "/oracle/node_modules/react/jsx-dev-runtime.js" },
            { find: /^react-dom$/, replacement: "/oracle/node_modules/react-dom" },
            { find: /^react-dom\/client$/, replacement: "/oracle/node_modules/react-dom/client.js" },
        ],
    },
    server: { fs: { allow: ["/subject", "/oracle"] } },
})
