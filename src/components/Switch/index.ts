import Switch from './Switch.vue'
import type {App } from 'vue'

Switch.install=(app: App): void => {
  app.component(Switch.name||'VkSwitch', Switch)
}
export default Switch
export * from './types'
