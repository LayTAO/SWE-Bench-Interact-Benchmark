<script setup lang="ts">
import { ref } from 'vue'
import { Time } from '@internationalized/date'
import { TimeFieldInput, TimeFieldRoot } from 'reka-ui'

const value = ref(new Time(0, 30, 0))
</script>

<template>
  <main>
    <h1>24-hour TimeField input</h1>
    <p>Click the hour segment and type 14.</p>
    <TimeFieldRoot v-model="value" locale="en-US" :hour-cycle="24" granularity="minute" v-slot="{ segments }" class="segments" data-testid="time-field">
      <TimeFieldInput v-for="segment in segments" :key="segment.part" :part="segment.part" :data-testid="segment.part === 'hour' ? 'hour' : undefined" :class="segment.part === 'literal' ? '' : 'segment'">{{ segment.value }}</TimeFieldInput>
    </TimeFieldRoot>
    <output data-testid="value">{{ value.toString() }}</output>
  </main>
</template>
