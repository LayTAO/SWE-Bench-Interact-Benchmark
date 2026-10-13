<script setup lang="ts">
import { computed, ref } from 'vue';
import DatePickerPanel from '@element-plus/components/date-picker-panel';
const kind = new URLSearchParams(location.search).get('kind') || 'start';
const date = (text: string) => new Date(text + 'T00:00:00');
const value = ref(kind === 'end'
  ? [date('2026-07-10'), date('2026-08-15')]
  : [date('2026-07-15'), date('2026-08-10')]);
const bound = date(kind === 'end' ? '2026-06-05' : kind === 'converge' ? '2026-08-20' : '2026-09-17');
const disabledDate = (d: Date) => kind === 'end' ? d < bound : d > bound;
const format = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const selected = computed(() => value.value.map(format));
const commits = ref(0);
</script>

<template>
  <main id="oracle-ready">
    <h1>Date range</h1>
    <DatePickerPanel v-model="value" type="datetimerange" :disabled-date="disabledDate" @update:model-value="commits++" />
    <output data-testid="start-date">{{ selected[0] }}</output>
    <output data-testid="end-date">{{ selected[1] }}</output>
    <output data-testid="commits">{{ commits }}</output>
  </main>
</template>

<style>
body { margin: 30px; font: 16px sans-serif; }
output { display: block; margin: 8px; }
</style>
