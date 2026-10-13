<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem,
  ComboboxRoot, ComboboxViewport, TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot,
} from 'reka-ui'
const query = ref('')
const values = ref<string[]>([])
const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const filteredOptions = computed(() => options.filter(option => option.toLowerCase().includes(query.value.toLowerCase()) && !values.value.includes(option)))
</script>

<template>
  <main><div class="card">
    <h1>Combobox tags add-on-blur</h1>
    <p>Type a matching value, choose the option, and observe the committed tag and focus.</p>
    <div class="demo">
      <ComboboxRoot v-model="values" multiple>
        <ComboboxAnchor>
          <TagsInputRoot v-slot="{ modelValue: tags }" v-model="values" :add-on-blur="true" delimiter="" class="tags-field">
            <TagsInputItem v-for="(item, index) in tags" :key="index" :value="item" class="tag"><TagsInputItemText /></TagsInputItem>
            <ComboboxInput v-model="query" as-child>
              <TagsInputInput placeholder="Fruits..." @keydown.enter.prevent />
            </ComboboxInput>
          </TagsInputRoot>
        </ComboboxAnchor>
        <ComboboxContent class="popup"><ComboboxViewport><ComboboxGroup>
          <ComboboxItem v-for="(option, index) in filteredOptions" :key="index" :value="option" class="option"><span>{{ option }}</span></ComboboxItem>
        </ComboboxGroup></ComboboxViewport></ComboboxContent>
      </ComboboxRoot>
    </div>
  </div></main>
</template>
