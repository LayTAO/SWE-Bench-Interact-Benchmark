<script setup lang="ts">
import { Time } from '@internationalized/date'
import { ref } from 'vue'
import { TimeFieldInput, TimeFieldRoot } from 'reka-ui'
const value = ref(new Time(9, 15, 29))
</script>

<template>
  <main><div class="card">
    <h1>Edit a TimeField segment after entering zero</h1>
    <p>Set the minute to zero, leave it, return, and type one digit.</p>
    <TimeFieldRoot v-model="value" v-slot="{ segments }" locale="en-US" granularity="second" class="segments">
      <TimeFieldInput v-for="item in segments" :key="item.part" :part="item.part"
        :data-testid="item.part === 'literal' ? undefined : item.part"
        :class="item.part === 'literal' ? '' : 'segment'">{{ item.value }}</TimeFieldInput>
    </TimeFieldRoot>
  </div></main>
</template>
