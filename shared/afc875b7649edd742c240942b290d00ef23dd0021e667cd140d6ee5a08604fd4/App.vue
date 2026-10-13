<script setup>
import { ref } from 'vue'
import { VApp } from '/subject/packages/vuetify/src/components/VApp/VApp.tsx'
import { VAutocomplete } from '/subject/packages/vuetify/src/components/VAutocomplete/VAutocomplete.tsx'
import { VMain } from '/subject/packages/vuetify/src/components/VMain/VMain.tsx'

const value = ref(null)
const items = Array.from({ length: 200 }, (_, index) => `Item ${index + 1}`)
const menuProps = { transition: false, maxHeight: 180 }
</script>

<template>
  <VApp>
    <VMain>
      <main class="benchmark-shell">
        <span id="oracle-ready" aria-hidden="true" />
        <h1>VAutocomplete scroll interaction</h1>
        <p>Open the dropdown and scroll its virtualized list.</p>
        <VAutocomplete
          v-model="value"
          data-testid="autocomplete"
          label="Items"
          :items="items"
          :menu-props="menuProps"
        />
      </main>
    </VMain>
  </VApp>
</template>
