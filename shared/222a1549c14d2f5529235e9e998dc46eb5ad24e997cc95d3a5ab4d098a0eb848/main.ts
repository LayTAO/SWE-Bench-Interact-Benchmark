import { createApp, h, ref } from 'vue'
import { ElTable, ElTableColumn } from '/subject/packages/components/table'

const app = createApp({
  setup() {
    const filteredValue = ref([])
    const payload = ref('')
    return () => h('main', { class: 'fixture' }, [
      h(ElTable, {
        data: [{ director: 'John Lasseter' }],
        onFilterChange: (filters) => { payload.value = JSON.stringify(filters) },
      }, {
        default: () => h(ElTableColumn, {
          prop: 'director',
          label: 'director',
          filters: [{ text: 'John Lasseter', value: 'John Lasseter' }],
          filterMultiple: false,
          filteredValue: filteredValue.value,
        }),
      }),
      h('output', { id: 'filtered' }, JSON.stringify(filteredValue.value)),
      h('output', { id: 'payload' }, payload.value),
    ])
  },
})

app.mount('#app')
