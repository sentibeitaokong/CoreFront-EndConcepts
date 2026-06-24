import Select from './Select.vue'
import type {App } from 'vue'

Select.install=(app: App): void => {
  app.component(Select.name||'VkSelect', Select)
}
export default Select
export * from './types'
