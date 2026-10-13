import { createApp, h, ref, withDirectives } from 'vue'
import { vRepeatClick } from '/subject/packages/directives/repeat-click'

const app = createApp({
  setup() {
    const count = ref(0)
    return () =>
      h('main', { class: 'fixture' }, [
        withDirectives(
          h('button', { id: 'target', type: 'button' }, 'Hold to repeat'),
          [[vRepeatClick, { delay: 50, interval: 25, handler: () => count.value++ }]],
        ),
        h('output', { id: 'count', 'aria-live': 'polite' }, String(count.value)),
        h('p', { id: 'status' }, 'Release the button after it starts repeating.'),
      ])
  },
})

app.directive('repeat-click', vRepeatClick)
app.mount('#app')
