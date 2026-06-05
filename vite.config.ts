import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Vite 8 默认使用 'oxc' 压缩器（基于 Rust，极快）
    // 如果你仍想使用 esbuild，保持 'esbuild' 即可（需安装 esbuild 依赖）
    minify: 'oxc', // 推荐使用 oxc，性能更好
    chunkSizeWarningLimit: 800,
    // Vite 8 推荐使用 rolldownOptions 代替 rollupOptions
    rolldownOptions: {
      output: {
        // 使用新的 codeSplitting API 替代 manualChunks
        codeSplitting: {
          // 可选的全局 minSize / maxSize（单位字节）
          // minSize: 20000,
          // maxSize: 50000,
          groups: [
            // 1. Vue 全家桶
            {
              name: 'vue-core',
              test: (id: string) => {
                return /[\\/]node_modules[\\/](vue|@vue|vue-router)[\\/]/.test(
                  id,
                )
              },
              // 优先级越高，越先匹配
              priority: 30,
            },
            // 2. FontAwesome 图标库
            {
              name: 'fontawesome-vendor',
              test: (id: string) =>
                /[\\/]node_modules[\\/]@fortawesome[\\/]/.test(id),
              priority: 20,
            },
            // 3. UI 组件库及其依赖
            {
              name: 'ui-vendor',
              test: (id: string) =>
                /[\\/]node_modules[\\/](xb-element|@floating-ui)[\\/]/.test(id),
              priority: 20,
            },
            // 4. 工具库
            {
              name: 'utils-vendor',
              test: (id: string) =>
                /[\\/]node_modules[\\/](lodash-es|async-validator|viewerjs)[\\/]/.test(
                  id,
                ),
              priority: 20,
            },
            // 5. 其余所有 node_modules 依赖
            {
              name: 'vendor',
              test: (id: string) => /[\\/]node_modules[\\/]/.test(id),
              // 对于未匹配的 vendor，可以设置较低的优先级，确保前面的规则先执行
              priority: 10,
            },
          ],
        },
        // 自定义输出文件结构（与原来一致）
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
})
