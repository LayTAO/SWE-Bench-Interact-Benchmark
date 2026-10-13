import * as Ariakit from "@ariakit/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [value, setValue] = useState("");

  return (
    <main className="page">
      <h1>Combobox modifier shortcuts</h1>
      <p className="instructions">
        With virtual focus disabled, Ctrl/Cmd character shortcuts should not
        move focus away from the focused item or commit its autocomplete value.
      </p>
      <Ariakit.ComboboxProvider
        virtualFocus={false}
        value={value}
        setValue={setValue}
      >
        <Ariakit.ComboboxLabel>Fruit</Ariakit.ComboboxLabel>
        <Ariakit.Combobox autoComplete="inline" />
        <Ariakit.ComboboxPopover>
          <Ariakit.ComboboxItem value="Apple" />
          <Ariakit.ComboboxItem value="Banana" />
          <Ariakit.ComboboxItem value="Cherry" />
        </Ariakit.ComboboxPopover>
      </Ariakit.ComboboxProvider>
      <output id="status" aria-label="Controlled value">{value}</output>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
