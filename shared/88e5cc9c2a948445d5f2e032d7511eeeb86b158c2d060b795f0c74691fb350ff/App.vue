<script setup lang="ts">
import Autocomplete from '/subject/packages/core/src/Autocomplete/story/_Autocomplete.vue'
declare global { interface Window { __updates?: unknown[] } }
window.__updates = []
const onUpdate = (value: unknown) => window.__updates?.push(value)
</script>

<template>
  <main><div class="card">
    <h1>Autocomplete IME composition</h1>
    <p>Composition input must not filter or commit until composition ends.</p>
    <div class="demo"><Autocomplete @update:model-value="onUpdate" /></div>
  </div></main>
</template>
