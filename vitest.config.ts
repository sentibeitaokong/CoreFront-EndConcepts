import {fileURLToPath, URL} from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default {
    plugins: [vue(), vueJsx()],
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/apps/docs/.vitepress/**',
        ],
    },
    resolve: {
        alias: {
            //fileURLToPath(new URL(相对路径，基准点))：获取绝对路径
            '@': fileURLToPath(new URL('./packages/xbElement/src', import.meta.url)),
            '@xunbei-vue/shared': fileURLToPath(
                new URL('./packages/vue/shared/src/index.ts', import.meta.url),
            ),
            '@xunbei-vue/reactivity': fileURLToPath(
                new URL('./packages/vue/reactivity/src/index.ts', import.meta.url),
            ),
            '@xunbei-vue/runtime-core': fileURLToPath(
                new URL('./packages/vue/runtime-core/src/index.ts', import.meta.url),
            ),
            '@xunbei-vue/runtime-dom': fileURLToPath(
                new URL('./packages/vue/runtime-dom/src/index.ts', import.meta.url),
            ),
            '@xunbei-vue/compiler-core': fileURLToPath(
                new URL('./packages/vue/compiler-core/src/index.ts', import.meta.url),
            ),
        },
    },
}
