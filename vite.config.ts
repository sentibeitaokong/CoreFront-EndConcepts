import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 1. 引入插件

export default defineConfig({
  plugins: [
    vue(), // 2. 将插件添加到 plugins 数组中
  ],
  resolve: {
    alias: {
      'xb-element/dist/types/components/Collapse/type':
        'xb-element/es/components/Collapse/type', // 或你的本地类型文件
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
