import { createApp, h, ref } from 'vue'
import { ElDatePickerPanel } from '/subject/packages/components/date-picker-panel'

const formatDate = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : ''

const app = createApp({
  setup() {
    const value = ref([new Date(2026, 3, 1, 1), new Date(2026, 4, 1)])
    return () => h('main', { class: 'fixture' }, [
      h(ElDatePickerPanel, {
        modelValue: value.value,
        'onUpdate:modelValue': (next) => { value.value = next },
        type: 'datetimerange',
      }),
      h('output', { id: 'model-start' }, formatDate(value.value[0])),
      h('output', { id: 'model-end' }, formatDate(value.value[1])),
    ])
  },
})

app.mount('#app')
