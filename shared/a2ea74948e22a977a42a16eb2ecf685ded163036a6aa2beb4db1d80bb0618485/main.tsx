import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [runs, setRuns] = useState(0)
  const values = ["calc(var(--spacing) / 5)", "calc(20% + 200px / 2)", "calc(20% + 200px * 2)"]
  return <main style={{ padding: 24, fontFamily: "sans-serif" }}>
    <h1>CSS calc division transition</h1>
    <button id="rerun" onClick={() => setRuns((n) => n + 1)}>Re-run ({runs})</button>
    <ul>{values.map((value) => <li key={value}><code>{value}</code><span> — inspect the generated animatable-none value in the exact-base oracle</span></li>)}</ul>
  </main>
}

createRoot(document.getElementById("root")!).render(<App />)
