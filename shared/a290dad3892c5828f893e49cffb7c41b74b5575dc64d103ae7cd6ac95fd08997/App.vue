<script setup>
import { ref } from 'vue'
import MultiSelect from '/subject/packages/primevue/src/multiselect/MultiSelect.vue'
const selected = ref([])
const options = [{name:'New York',code:'NY'},{name:'Rome',code:'RM'},{name:'London',code:'LDN'}]
</script><template><main><span id="oracle-ready"/><h1>PrimeVue option-group validation</h1>
<MultiSelect v-model="selected" :options="options" option-label="name" option-value="code" option-group-label="category" option-group-children="items" placeholder="Select cities" />
<p id="selection">{{ selected.map(code => options.find(item => item.code === code)?.name).filter(Boolean).join(', ') }}</p>
</main></template>
