import Tooltip from './Tooltip.vue'
import type {App } from 'vue'

Tooltip.install=(app: App): void => {
  app.component(Tooltip.name||'VkTooltip', Tooltip)
}
export default Tooltip
export * from './type'
