import esbuild from 'rollup-plugin-esbuild'
import resolve from '@rollup/plugin-node-resolve'
import alias from '@rollup/plugin-alias'
import path from 'path'
import {fileURLToPath} from 'url'

//获取当前文件目录地址
const vueRoot = path.dirname(fileURLToPath(import.meta.url))

export default {
    input: path.resolve(vueRoot, 'vue/src/index.ts'),
    //获取绝对路径并输出
    output: [
        {file: path.resolve(vueRoot, 'vue/dist/XunBei-Vue.cjs.js'), format: 'cjs'},
        {file: path.resolve(vueRoot, 'vue/dist/XunBei-Vue.esm.js'), format: 'es'},
    ],
    plugins: [
        // 2. 必须把 alias 插件放在 resolve 插件的前面！
        alias({
            entries: [
                {
                    find: '@xunbei-vue/shared',
                    replacement: path.resolve(
                        vueRoot,
                        'shared/src/index.ts',
                    ),
                },
                {
                    find: '@xunbei-vue/reactivity',
                    replacement: path.resolve(
                        vueRoot,
                        'reactivity/src/index.ts',
                    ),
                },
                {
                    find: '@xunbei-vue/runtime-core',
                    replacement: path.resolve(
                        vueRoot,
                        'runtime-core/src/index.ts',
                    ),
                },
                {
                    find: '@xunbei-vue/runtime-dom',
                    replacement: path.resolve(
                        vueRoot,
                        'runtime-dom/src/index.ts',
                    ),
                },
                {
                    find: '@xunbei-vue/compiler-core',
                    replacement: path.resolve(
                        vueRoot,
                        'compiler-core/src/index.ts',
                    ),
                },
            ],
        }),
        // 1. 解析 Node 模块和后缀
        resolve({
            extensions: ['.js', '.ts', '.json'],
        }),

        // 2. 替代原本的 typescript 插件，实现降维打击
        esbuild({
            target: 'esnext',
            // esbuild 根本不在乎你有没有 allowImportingTsExtensions，直接强行编译！
            include: /\.[jt]sx?$/,
        }),
    ],
    // 4. 静音控制：拦截并忽略掉循环依赖的黄字警告
    onwarn: (msg, warn) => {
        if (msg.code === 'CIRCULAR_DEPENDENCY') {
            return // 遇到循环依赖，直接跳过不打印
        }
        warn(msg) // 其他类型的警告正常打印
    },
}
