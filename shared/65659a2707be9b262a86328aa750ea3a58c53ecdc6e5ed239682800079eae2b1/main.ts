import { createApp, defineComponent, h, ref } from 'vue'
import { ElTimePicker } from '/subject/packages/components/time-picker'
import '/subject/packages/theme-chalk/src/index.scss'

const pad = (value: number) => String(value).padStart(2, '0')

const App = defineComponent({
  setup() {
    const value = ref<[Date, Date]>([
      new Date(2016, 9, 10, 8, 40),
      new Date(2016, 9, 10, 9, 40),
    ])
    return () =>
      h('section', { class: 'fixture' }, [
        h(ElTimePicker, {
          modelValue: value.value,
          'onUpdate:modelValue': (next: [Date, Date]) => {
            value.value = next
          },
          isRange: true,
          rangeSeparator: 'To',
          startPlaceholder: 'Start time',
          endPlaceholder: 'End time',
        }),
        h(
          'button',
          { id: 'outside', type: 'button' },
          'Move focus outside',
        ),
        h(
          'output',
          { id: 'model-end' },
          `${pad(value.value[1].getHours())}:${pad(value.value[1].getMinutes())}:${pad(
            value.value[1].getSeconds(),
          )}`,
        ),
      ])
  },
})

createApp(App).mount('#app')
