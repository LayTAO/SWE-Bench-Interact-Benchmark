<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot,
  ComboboxViewport,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

const comboboxValue = ref('')
const selectValue = ref('')
</script>

<template>
  <main>
    <h1>Combobox openOnFocus with neighboring Select</h1>
    <p>Focus the Combobox input, then click the Select trigger.</p>
    <div class="controls">
      <section>
        <label for="fruit-search">Fruit search</label>
        <ComboboxRoot v-model="comboboxValue" :open-on-focus="true">
          <ComboboxAnchor class="anchor">
            <ComboboxInput
              id="fruit-search"
              class="input"
              data-testid="combobox-input"
              placeholder="Choose fruit"
            />
          </ComboboxAnchor>
          <ComboboxContent class="popup" data-testid="combobox-content">
            <ComboboxViewport>
              <ComboboxItem class="option" value="Apple">Apple</ComboboxItem>
              <ComboboxItem class="option" value="Banana">Banana</ComboboxItem>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxRoot>
      </section>

      <section>
        <label>Country</label>
        <SelectRoot v-model="selectValue">
          <SelectTrigger class="select-trigger" data-testid="select-trigger">
            <SelectValue placeholder="Choose country" />
          </SelectTrigger>
          <SelectPortal>
            <SelectContent class="select-popup" data-testid="select-content" position="popper">
              <SelectViewport>
                <SelectItem class="option" value="Spain"><SelectItemText>Spain</SelectItemText></SelectItem>
                <SelectItem class="option" value="Japan"><SelectItemText>Japan</SelectItemText></SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </section>
    </div>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f6f7fb;
  color: #182230;
}
main { padding: 48px; }
.controls {
  display: flex;
  align-items: flex-start;
  gap: 120px;
  margin-top: 40px;
}
section {
  position: relative;
  min-width: 250px;
}
label {
  display: block;
  margin-bottom: 8px;
  font-weight: 650;
}
.anchor,
.select-trigger {
  display: inline-flex;
  min-width: 220px;
  border: 2px solid #3659d9;
  border-radius: 8px;
  background: white;
  padding: 11px 14px;
  font: inherit;
}
.input {
  width: 100%;
  border: 0;
  outline: 0;
  font: inherit;
}
.popup,
.select-popup {
  z-index: 20;
  min-width: 220px;
  border: 1px solid #9aa7bd;
  border-radius: 8px;
  background: white;
  padding: 6px;
  box-shadow: 0 10px 28px rgb(30 50 80 / 18%);
}
.option {
  border-radius: 5px;
  padding: 9px 12px;
  outline: none;
}
.option[data-highlighted] { background: #e9eeff; }
:focus-visible {
  outline: 4px solid #f59e0b;
  outline-offset: 3px;
}
</style>
