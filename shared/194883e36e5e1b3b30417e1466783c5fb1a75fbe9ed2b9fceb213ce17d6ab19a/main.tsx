import { motion } from "framer-motion"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
    const [expanded, setExpanded] = useState(false)
    const box = (id: string, anchor?: { x: number; y: number }) => (
        <motion.div
            id={id}
            layout
            layoutAnchor={anchor}
            style={{ width: 50, height: 50, background: id.includes("anchored") ? "green" : "red" }}
            transition={{ type: "tween", ease: "linear", duration: 20 }}
        />
    )
    return (
        <main style={{ display: "flex", gap: 80, padding: 20 }}>
            <span id="oracle-ready" />
            <button id="toggle" onClick={() => setExpanded((value) => !value)}>Toggle layout</button>
            <motion.div
                id="parent"
                layout
                onClick={() => setExpanded((value) => !value)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: expanded ? 400 : 200, height: expanded ? 400 : 200, background: "#eee", position: "absolute", top: 0, left: 0 }}
                transition={{ type: "tween", ease: "linear", duration: 10 }}
            >
                {box("child-anchored", { x: 0.5, y: 0.5 })}
            </motion.div>
            <motion.div
                id="parent-no-anchor"
                layout
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: expanded ? 400 : 200, height: expanded ? 400 : 200, background: "#eee", position: "absolute", top: 0, left: 500 }}
                transition={{ type: "tween", ease: "linear", duration: 10 }}
            >
                {box("child-no-anchor")}
            </motion.div>
        </main>
    )
}

createRoot(document.getElementById("root")!).render(<App />)
