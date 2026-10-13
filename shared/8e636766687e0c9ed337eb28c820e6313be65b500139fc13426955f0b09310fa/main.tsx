import * as Ariakit from "@ariakit/react";
import {createRoot} from "react-dom/client";
function App(){return <main><h1>Combobox IME</h1><Ariakit.ComboboxProvider defaultValue=""><Ariakit.ComboboxLabel>Fruit</Ariakit.ComboboxLabel><Ariakit.Combobox autoSelect aria-label="Fruit"/><Ariakit.ComboboxPopover><Ariakit.ComboboxItem value="사과"/><Ariakit.ComboboxItem value="사고"/></Ariakit.ComboboxPopover></Ariakit.ComboboxProvider></main>}
createRoot(document.getElementById("root")!).render(<App/>);
