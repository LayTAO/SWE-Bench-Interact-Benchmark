<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <main>
    <h1>Non-modal DropdownMenu focus exit</h1>
    <p>Open the menu with Enter, then press Tab from the menu item.</p>
    <div class="focus-row">
      <button data-testid="before">Before</button>
      <DropdownMenuRoot :modal="false">
        <DropdownMenuTrigger data-testid="trigger">Open menu</DropdownMenuTrigger>
        <DropdownMenuContent class="menu" data-testid="menu">
          <DropdownMenuItem class="item" data-testid="item">Menu item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <button data-testid="after">After</button>
    </div>
    <output data-testid="active">Focus is shown by the browser outline.</output>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f6f7fb;
  color: #182230;
}
main {
  padding: 48px;
}
.focus-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-top: 32px;
}
.focus-row + output {
  display: block;
  margin-top: 96px;
}
.focus-row button,
.item {
  border: 2px solid #3659d9;
  border-radius: 8px;
  background: white;
  padding: 12px 18px;
  font: inherit;
}
.menu {
  z-index: 10;
  min-width: 150px;
  border: 1px solid #9aa7bd;
  border-radius: 8px;
  background: white;
  padding: 6px;
  box-shadow: 0 8px 24px rgb(30 50 80 / 18%);
}
.item {
  outline: none;
}
.item[data-highlighted] {
  background: #e9eeff;
}
:focus-visible {
  outline: 4px solid #f59e0b;
  outline-offset: 3px;
}
</style>
