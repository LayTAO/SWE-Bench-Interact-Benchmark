<script setup lang="ts">
import { Time } from '@internationalized/date'
import { ref } from 'vue'
import { TimeFieldInput, TimeFieldRoot } from 'reka-ui'
const value = ref(new Time(12, 30, 0))
</script>

<template>
  <main><div class="card">
    <h1>Repeated zero in a 12-hour TimeField</h1>
    <p>Press zero twice in the hour segment and observe focus progression.</p>
    <TimeFieldRoot v-model="value" v-slot="{ segments }" locale="en-US" :hour-cycle="12" granularity="second" class="segments">
      <TimeFieldInput v-for="item in segments" :key="item.part" :part="item.part"
        :data-testid="item.part === 'literal' ? undefined : item.part"
        :class="item.part === 'literal' ? '' : 'segment'">{{ item.value }}</TimeFieldInput>
    </TimeFieldRoot>
  </div></main>
</template>
