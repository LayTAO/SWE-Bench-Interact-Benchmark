import {
  Combobox,
  ComboboxCancel,
  ComboboxItem,
  ComboboxPopover,
  useComboboxState,
} from "ariakit/combobox";
import {createRoot} from "react-dom/client";
import "./styles.css";

function Example() {
  const combobox = useComboboxState({gutter: 8, sameWidth: true});
  const list = ["Apple", "Bacon", "Banana", "Broccoli", "Burger", "Cake", "Candy"];
  return (
    <main className="page">
      <h1>Combobox cancel</h1>
      <label htmlFor="food-combobox">Your favorite food</label>
      <div className="combobox-wrapper">
        <Combobox id="food-combobox" state={combobox} autoSelect placeholder="e.g., Apple" className="combobox" />
        <ComboboxCancel state={combobox} className="clear-button" />
      </div>
      <ComboboxPopover state={combobox} className="popover">
        {list.map((value) => <ComboboxItem key={value} value={value} className="combobox-item" />)}
      </ComboboxPopover>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Example />);
