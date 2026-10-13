import Vue from 'vue'
import Vuetify from '/subject/packages/vuetify/src/framework'
import VApp from '/subject/packages/vuetify/src/components/VApp/VApp'
import VAutocomplete from '/subject/packages/vuetify/src/components/VAutocomplete/VAutocomplete'

Vue.use(Vuetify)

new Vue({
  vuetify: new Vuetify(),
  data: () => ({ items: ['One', 'Two', 'Three'] }),
  methods: {
    focusAutocomplete () {
      this.$refs.autocomplete.focus()
    },
  },
  render (h) {
    return h(VApp, [h('main', { class: 'benchmark-shell' }, [
      h('span', { attrs: { id: 'oracle-ready' } }),
      h('h1', 'VAutocomplete repeated focus'),
      h('button', {
        attrs: { type: 'button', 'data-testid': 'focus-button' },
        on: { click: this.focusAutocomplete },
      }, 'Focus autocomplete'),
      h(VAutocomplete, {
        ref: 'autocomplete',
        props: { items: this.items, label: 'Choice' },
      }),
    ])])
  },
}).$mount('#app')
