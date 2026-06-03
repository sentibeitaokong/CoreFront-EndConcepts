import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 1. 引入插件

export default defineConfig({
  plugins: [
    vue(), // 2. 将插件添加到 plugins 数组中
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 提高超大块警告门槛（可选，默认是 500KB）
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 核心优化：自定义底层代码分割策略
        manualChunks(id) {
          // 仅处理 node_modules 中的依赖
          if (id.includes('node_modules')) {
            // 1. Vue 全家桶及核心渲染库（更新频率极低，优先强缓存）
            if (
              id.includes('/vue/') ||
              id.includes('/@vue/') ||
              id.includes('/vue-router/')
            ) {
              return 'vue-core'
            }

            // 2. 独立抽离 FontAwesome（图标库体积通常较大，且基本不更新）
            if (id.includes('/@fortawesome/')) {
              return 'fontawesome-vendor'
            }

            // 3. UI 组件与浮动定位引擎（xb-element 及其底层依赖）
            if (id.includes('/xb-element/') || id.includes('/@floating-ui/')) {
              return 'ui-vendor'
            }

            // 4. 工具函数与校验逻辑
            if (
              id.includes('/lodash-es/') ||
              id.includes('/async-validator/') ||
              id.includes('/viewerjs/')
            ) {
              return 'utils-vendor'
            }

            // 5. 兜底方案：其他所有未被命名的第三方包打入通用 vendor
            return 'vendor'
          }
        },
        // 优化输出产物的文件结构，让 dist 目录更清爽
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
})
