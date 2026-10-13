<script setup lang="ts">
import {
  ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal,
  ComboboxRoot, ComboboxTrigger, ComboboxViewport,
  DialogContent, DialogRoot, DialogTitle, DialogTrigger,
} from 'reka-ui'
</script>

<template>
  <main><div class="card"><h1>Combobox inside a Dialog</h1>
    <DialogRoot>
      <DialogTrigger data-testid="dialog-trigger">Open Dialog</DialogTrigger>
      <DialogContent class="dialog" data-testid="dialog-content">
        <DialogTitle>Select framework</DialogTitle>
        <ComboboxRoot>
          <ComboboxAnchor as-child><ComboboxTrigger data-testid="combobox-trigger">Select framework</ComboboxTrigger></ComboboxAnchor>
          <ComboboxPortal>
            <ComboboxContent class="popup" data-testid="combobox-content" position="popper">
              <ComboboxViewport>
                <ComboboxInput class="field" data-testid="combobox-input" />
                <ComboboxItem class="item" value="Vue">Vue</ComboboxItem>
                <ComboboxItem class="item" value="Svelte">Svelte</ComboboxItem>
              </ComboboxViewport>
            </ComboboxContent>
          </ComboboxPortal>
        </ComboboxRoot>
      </DialogContent>
    </DialogRoot>
  </div></main>
</template>
