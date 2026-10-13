<script setup lang="ts">
import { ref } from 'vue'
import { ListboxItem, ListboxRoot } from 'reka-ui'
const disabled = ref(false)
</script>

<template>
  <main><div class="card">
    <h1>Reactive Listbox disabled state</h1>
    <p>Toggling the prop must immediately update the option's DOM state.</p>
    <button class="action" @click="disabled = !disabled">Toggle disabled (current: {{ disabled }})</button>
    <ListboxRoot class="listbox">
      <ListboxItem class="option" :value="{id: 1}" :disabled="disabled">toggleable</ListboxItem>
      <ListboxItem class="option" :value="{id: 2}">other</ListboxItem>
    </ListboxRoot>
  </div></main>
</template>
