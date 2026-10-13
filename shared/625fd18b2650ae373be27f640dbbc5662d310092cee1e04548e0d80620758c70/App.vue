<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'

const selectedRange = {
  start: new CalendarDate(1980, 1, 20),
  end: new CalendarDate(1980, 1, 25),
}
</script>

<template>
  <main>
    <h1>RangeCalendar aria attributes</h1>
    <RangeCalendarRoot v-slot="{ weekDays, grid }" :model-value="selectedRange" data-testid="calendar" class="calendar">
      <RangeCalendarHeader>
        <RangeCalendarPrev data-testid="prev" />
        <RangeCalendarHeading data-testid="heading" />
        <RangeCalendarNext data-testid="next" />
      </RangeCalendarHeader>
      <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell v-for="day in weekDays" :key="day">{{ day }}</RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="index">
            <RangeCalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
              <RangeCalendarCellTrigger :day="weekDate" :month="month.value" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </RangeCalendarRoot>
  </main>
</template>
