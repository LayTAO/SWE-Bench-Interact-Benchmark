<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
</script>

<template>
  <main><div class="card">
    <h1>Native select inside a Dialog</h1>
    <DialogRoot>
      <DialogTrigger data-testid="dialog-trigger">Open dialog</DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="overlay" data-testid="overlay">
          <DialogContent class="dialog" data-testid="dialog-content">
            <DialogTitle>Choose a framework</DialogTitle>
            <label for="framework">Framework</label>
            <select id="framework" data-testid="native-select">
              <option value="vue">Vue</option><option value="svelte">Svelte</option>
            </select>
          </DialogContent>
        </DialogOverlay>
      </DialogPortal>
    </DialogRoot>
  </div></main>
</template>
