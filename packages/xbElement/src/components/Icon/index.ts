import Icon from './Icon.vue'
import type {App } from 'vue'

Icon.install=(app: App): void => {
  app.component(Icon.name||'VkIcon', Icon)
}
export default Icon
export * from './type'
