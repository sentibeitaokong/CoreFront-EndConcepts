import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import dts from 'unplugin-dts/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      processor: 'vue',
      entryRoot: 'src',
      outDirs: 'dist/types'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build:{
    outDir:'dist/es',
    lib:{
      entry: 'src/index.ts',
      name:'XBElement',
      fileName:'x-element',
      formats:['es']
    },
    rollupOptions:{
      external:[
        'vue',
        '@floating-ui/vue',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/vue-fontawesome',
        '@vue/test-utils',
        'async-validator',
        'axios',
      ],
      output:{
        //修改输出css文件的名称
        // assetFileNames:(chunkInfo)=>{
        //   if (chunkInfo.names.includes("x-element.css")) {
        //     return 'index.css'
        //   }
        //   return chunkInfo.names
        // }
      },
    }
  }
})
