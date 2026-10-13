import { createApp } from 'vue'
import { createVuetify } from '/subject/packages/vuetify/src/framework.ts'
import App from './App.vue'

createApp(App).use(createVuetify()).mount('#app')
