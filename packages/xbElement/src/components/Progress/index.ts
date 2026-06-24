import type { App } from 'vue'
import Progress from '@/components/Progress/Progress.vue'
Progress.install = (app: App) => {
  app.component(Progress.name||'VkProgress', Progress)
}

export default Progress
export * from './type'
