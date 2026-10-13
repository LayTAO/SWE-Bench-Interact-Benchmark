<script setup lang="ts">
import { ref } from 'vue'
import { PinInputInput, PinInputRoot } from 'reka-ui'
const value = ref<string[]>([])
</script>
<template>
  <main>
    <h1>PinInput placeholder</h1>
    <p>Focus each position and observe the placeholder.</p>
    <PinInputRoot v-model="value" :length="5" placeholder="*" data-testid="pin-root" class="pin">
      <PinInputInput v-for="index in 5" :key="index" :index="index - 1" :data-testid="`pin-${index - 1}`" />
    </PinInputRoot>
  </main>
</template>
