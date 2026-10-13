<script setup lang="ts">
import { defineComponent, h, ref, watchPostEffect } from 'vue'
import { Primitive } from 'reka-ui'
import { useForwardExpose } from '/subject/packages/core/src/shared/useForwardExpose.ts'
const swapped = ref(false)
const observedTag = ref('unknown')
const ForwardedTrigger = defineComponent({
  props: { swapped: Boolean },
  setup(props) {
    const { forwardRef, currentElement } = useForwardExpose()
    watchPostEffect(() => { observedTag.value = currentElement.value?.nodeName.toLowerCase() ?? 'none' })
    return () => h(Primitive, { ref: forwardRef, asChild: true }, {
      default: () => [props.swapped
        ? h('span', { class: 'mixer trigger-b', 'data-testid': 'mixer-b', role: 'button', tabindex: 0 }, 'Replacement span')
        : h('button', { class: 'mixer trigger-a', 'data-testid': 'mixer-a' }, 'Initial button')],
    })
  },
})
</script>

<template>
  <main><div class="card">
    <h1>Conditional as-child current element</h1>
    <p>Swap the rendered trigger root and observe the element tracked by the forwarding hook.</p>
    <button class="action" data-testid="reload" @click="swapped = !swapped">Reload trigger</button>
    <output data-testid="observed-tag">Forwarded element: {{ observedTag }}</output>
    <div class="swap-stage"><ForwardedTrigger :swapped="swapped" /></div>
  </div></main>
</template>
