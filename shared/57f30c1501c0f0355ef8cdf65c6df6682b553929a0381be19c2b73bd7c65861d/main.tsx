import * as Ariakit from "@ariakit/react";
import {useRef} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

function Example() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <main className="page">
      <h1>Attachments</h1>
      <Ariakit.PopoverProvider>
        <Ariakit.PopoverDisclosure>Attachments</Ariakit.PopoverDisclosure>
        <Ariakit.Popover portal aria-label="Attachments" className="popover">
          <input ref={fileInputRef} type="file" style={{display: "none"}} />
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose file
          </button>
        </Ariakit.Popover>
      </Ariakit.PopoverProvider>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Example />);
