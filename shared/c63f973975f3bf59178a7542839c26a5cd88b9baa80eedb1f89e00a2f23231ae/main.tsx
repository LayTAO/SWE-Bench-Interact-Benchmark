import { complex } from "/subject/packages/motion-dom/src/value/types/complex/index.ts"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
    const [runs, setRuns] = useState(0)
    const values = [
        ["variable-division", "calc(var(--spacing) / 5)"],
        ["numeric-division", "calc(20% + 200px / 2)"],
        ["multiplication", "calc(20% + 200px * 2)"],
    ] as const
    return (
        <main style={{ padding: 24, fontFamily: "sans-serif" }}>
            <span id="oracle-ready" />
            <h1>CSS calc division transition</h1>
            <button id="rerun" onClick={() => setRuns((value) => value + 1)}>Re-run ({runs})</button>
            <ul>
                {values.map(([id, value]) => (
                    <li key={id} data-testid={id}>{complex.getAnimatableNone(value)}</li>
                ))}
            </ul>
        </main>
    )
}

createRoot(document.getElementById("root")!).render(<App />)
