import * as Ariakit from "@ariakit/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const form = Ariakit.useFormStore({
    defaultValues: {tags: ["React"], emails: [] as string[]},
  });
  const tags = Ariakit.useStoreState(form, (state) => state.values.tags);
  const emails = Ariakit.useStoreState(form, (state) => state.values.emails);
  const [focused, setFocused] = useState("none");

  return (
    <main className="page">
      <h1>FormPush autofocus</h1>
      <p className="instructions">
        Each push should focus the input it creates, including the first input
        in an initially empty array.
      </p>
      <Ariakit.Form store={form} className="form">
        <output data-testid="focused-field">Focused field: {focused}</output>
        <fieldset>
          <legend>Tags</legend>
          {tags.map((_, index) => {
            const name = `tags.${index}`;
            return (
              <Ariakit.FormInput key={index} name={name} aria-label={name} onFocus={() => setFocused(name)} />
            );
          })}
          <Ariakit.FormPush name="tags" value="">Add tag</Ariakit.FormPush>
        </fieldset>
        <fieldset>
          <legend>Emails</legend>
          {emails.map((_, index) => {
            const name = `emails.${index}`;
            return (
              <Ariakit.FormInput key={index} name={name} aria-label={name} onFocus={() => setFocused(name)} />
            );
          })}
          <Ariakit.FormPush name="emails" value="">Add email</Ariakit.FormPush>
        </fieldset>
      </Ariakit.Form>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
