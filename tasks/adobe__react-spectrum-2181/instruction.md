# 🐛 Bug Report

After typing in anything in the ComboBox, as long as it shrinks the menu a bit, and while still not having anything selected, click anywhere below the menu (anywhere that was within the previous menu height)
The field will clear, then the full menu of items will reappear and then the item in the area you clicked will be selected

i noticed this occurs when i add the loadingState prop to the ComboBox

https://user-images.githubusercontent.com/12926470/127585004-63e616e0-9984-4dbe-9e10-1023f95710ce.mov



## 🤔 Expected Behavior

- Menu will close without it re-opening

## 😯 Current Behavior

- On mouse down Menu closes > Field clears > Menu re-opens > On mouse up, if mouse cursor is within the menu space, an item will be selected


## 🔦 Context

- Steps to Reproduce
1. In the ComboBox input field, type in anything, we just want to filter the options in the menu so the menu height reduces
2. Do not select anything in the menu
3. Hover you mouse to anywhere below the menu (the area where the menu use to cover before it was filtered)
4. Click there
5. Immediately the ComboBox field will clear and the menu will undo the filter, and the item where the click was, will be selected

## 💻 Code Sample

```
import React from "react";
import { Provider, defaultTheme, ComboBox, Item } from "@adobe/react-spectrum";
import "./styles.css";

let options = [
  { id: 1, name: 'Aerospace' },
  { id: 2, name: 'Mechanical' },
  { id: 3, name: 'Civil' },
  { id: 4, name: 'Biomedical' },
  { id: 5, name: 'Nuclear' },
  { id: 6, name: 'Industrial' },
  { id: 7, name: 'Chemical' },
  { id: 8, name: 'Agricultural' },
  { id: 9, name: 'Electrical' },
];

export default function App() {
  return (
    <Provider theme={defaultTheme}>
        <ComboBox
          label='Pick a engineering major'
          defaultItems={ options }
          loadingState>
          {(item) => <Item>{item.name}</Item>}
        </ComboBox>
    </Provider>
  );
}

```
