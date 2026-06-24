import Input from './Input.vue'
import type {App } from 'vue'

Input.install=(app: App): void => {
  app.component(Input.name||'VkInput', Input)
}
export default Input
export * from './types'
