<script setup lang="ts">
import { ref } from 'vue'
import { CalendarDateTime } from '@internationalized/date'
import DatePicker from '/subject/packages/core/src/DatePicker/story/_DatePicker.vue'
const model = ref<CalendarDateTime | undefined>(new CalendarDateTime(1980, 1, 20, 12, 30, 45, 123))
declare global { interface Window { __lastValue?: Record<string, unknown> | null } }
window.__lastValue = null
function onUpdate(value: any) {
  window.__lastValue = value ? {hour: value.hour, minute: value.minute, second: value.second, millisecond: value.millisecond, timeZone: value.timeZone ?? null} : null
}
</script>

<template>
  <main><div class="card">
    <h1>DatePicker cleared-model time</h1>
    <p>After clearing the model, selecting a date must not retain the old time.</p>
    <button class="action" @click="model = undefined">Clear model</button>
    <div class="demo"><DatePicker :date-picker-props="{ modelValue: model, granularity: 'minute' }" :emits="{ 'onUpdate:modelValue': onUpdate }" /></div>
  </div></main>
</template>
