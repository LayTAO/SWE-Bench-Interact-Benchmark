import { motion } from "framer-motion"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [expanded, setExpanded] = useState(false)
  const box = (id: string, anchor?: { x: number; y: number }) => (
    <motion.div id={id} layout layoutAnchor={anchor} style={{ width: 50, height: 50, background: id.includes("anchored") ? "green" : "red" }} transition={{ type: "tween", ease: "linear", duration: 2 }} />
  )
  return <main style={{ display: "flex", gap: 80 }}>
    <button id="toggle" onClick={() => setExpanded((v) => !v)}>Toggle layout</button>
    <motion.div id="parent" layout onClick={() => setExpanded((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: expanded ? 400 : 200, height: expanded ? 400 : 200, background: "#eee" }} transition={{ type: "tween", ease: "linear", duration: 1 }}>{box("child-anchored", { x: 0.5, y: 0.5 })}</motion.div>
    <motion.div id="parent-no-anchor" layout style={{ display: "flex", alignItems: "center", justifyContent: "center", width: expanded ? 400 : 200, height: expanded ? 400 : 200, background: "#eee" }} transition={{ type: "tween", ease: "linear", duration: 1 }}>{box("child-no-anchor")}</motion.div>
  </main>
}

createRoot(document.getElementById("root")!).render(<App />)
