---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Rollup (下一代 ES 模块打包器)

## 1. 核心概念与配置全景

Rollup 的设计哲学是**“小即是美”**。它的核心配置文件（通常是 `rollup.config.js`）导出一个对象或对象数组。

掌握 Rollup 核心配置，实质上就是吃透以下五大顶层属性：

| 核心配置项 | 英文名称 | 核心职责与工程意义 |
| :--- | :--- | :--- |
| **入口** | **`input`** | 定义打包的起点。可以是单个字符串、数组或对象（用于多入口和代码分割）。 |
| **出口** | **`output`** | （极其重要）定义打包产物的结构、格式（ESM/CJS/UMD）、存放路径、变量命名以及分包策略。 |
| **外部依赖** | **`external`** | 告诉 Rollup 哪些模块是“外部的”。这些模块**不会被打包进最终产物中**，而是保留 `import` 语句。 |
| **插件体系** | **`plugins`** | 扩展 Rollup 能力的唯一途径。用于处理非 JS 文件、解析 Node 模块、转译 TS/Babel 等。 |
| **摇树优化** | **`treeshake`** | （高级）细粒度控制 Rollup 的静态分析算法。默认开启，通常不需要手动修改。 |

## 2. 核心配置深度拆解

Rollup 的配置文件通常命名为 `rollup.config.js`（或 `.mjs`）。它的结构比 Webpack 简单得多，最核心的属性只有 `input`、`output`、`plugins` 和 `external`。

### 2.1 `input` 与 `external` (源头与剔除)

`external` 是开发类库时最关键的配置，它支持字符串数组、正则表达式或函数。

```javascript
// rollup.config.js
export default {
  // 1. input: 单入口
  input: 'src/main.js',
  
  // 1. input: 多入口 (对象形式，有利于后续保持目录结构)
  // input: {
  //   index: 'src/index.js',
  //   utils: 'src/utils.js'
  // },

  // 2. external: 将第三方依赖剥离，防止将 React/Vue 源码打包进你的组件库
  external: [
    'react', 
    'react-dom', 
    // 使用正则：忽略所有的 lodash 子模块引入 (如 lodash/map)
    /^lodash\/.*/, 
    // 终极杀招：把 package.json 中的 dependencies 全设为外部依赖
    // ...Object.keys(require('./package.json').dependencies)
  ],
  
  output: { /* ... */ }
};
```

### 2.2 `output` 核心属性详解 (产物控制)

Rollup 的 `output` 可以是一个对象（输出一种格式），也可以是一个数组（同时输出多种格式）。

```javascript
export default {
  input: 'src/index.js',
  output: [
    {
      // 1. 产物路径 (单文件输出)
      file: 'dist/bundle.cjs.js', 
      
      // 2. 模块格式 (极度重要)
      // 'es': ES Module (给 Vite/Webpack 使用)
      // 'cjs': CommonJS (给 Node.js 使用)
      // 'iife': 立即执行函数 (通过 <script> 标签直接引入浏览器)
      // 'umd': 兼容前三者 (支持 AMD, CJS, 全局变量)
      format: 'cjs', 
      
      // 3. 生成 Source Map 方便调试
      sourcemap: true,
      
      // 4. 清理旧注释并生成文件头注释
      banner: '/* My Library v1.0.0 */' 
    },
    {
      file: 'dist/bundle.umd.js',
      format: 'umd',
      
      // 5. name: 当 format 为 iife 或 umd 时必须配置！
      // 决定了你的库在全局 window 对象上的变量名 (如 window.$ 或 window.Vue)
      name: 'MyUtils',
      
      // 6. globals: 与 external 配合使用，仅针对 iife/umd 格式
      // 告诉 Rollup："由于我把 react 设为了外部依赖，在浏览器环境(UMD)下，
      // 请去全局 window.React 变量上去寻找它"
      globals: {
        react: 'React',
        lodash: '_'
      }
    }
  ]
};
```

## 3. 企业级类库开发高阶配置

原生的 Rollup “非常挑食”，它**只认识 ES Modules 语法的相对路径导入**。如果你直接引入 npm 包、CommonJS 包或 TypeScript，它会直接报错。

因此，开发一个企业级组件库或工具库，必须依赖官方的 `@rollup/plugin-*` 插件全家桶。

### 3.1 完备的组件库打包配置示例

假设我们要打包一个基于 React 的 UI 组件库，并支持 TypeScript 和代码压缩：

```javascript
// rollup.config.mjs
import resolve from '@rollup/plugin-node-resolve'; // 使得 Rollup 能找到 node_modules 里的包
import commonjs from '@rollup/plugin-commonjs';   // 将 CommonJS 模块转换为 ES6
import typescript from '@rollup/plugin-typescript'; // 处理 TS
import { babel } from '@rollup/plugin-babel';     // 语法降级 (处理 React JSX)
import terser from '@rollup/plugin-terser';       // 代码压缩

export default {
    input: 'src/components/index.ts',

    output: [
        {
            dir: 'dist/esm',
            format: 'esm',
            preserveModules: true, // 核心技巧：保留原始的模块目录结构，有利于使用者的 Tree-shaking
            sourcemap: true
        },
        {
            file: 'dist/umd/index.min.js',
            format: 'umd',
            name: 'MyUI', // UMD 格式必须指定一个全局变量名 (挂载在 window.MyUI 下)
            globals: {
                react: 'React', // 告诉 UMD 环境：外部传入的 react 对应全局变量 React
            },
            // 动态控制生成的 chunk 文件命名规则
            chunkFileNames: 'chunk-[hash].js',
            // 🔥 杀手锏属性：preserveModules (保留模块目录结构)
            // 开启后，Rollup 不会把所有代码揉成一团，而是严格保留你在 src 下的文件目录结构。
            // 这对于组件库实现基于物理路径的按需加载（Tree-shaking）起着决定性作用！
            preserveModules: true,
            // 配合 preserveModules 使用，指定根目录，防止产物中出现 src 层级
            preserveModulesRoot: 'src'
        },
    ],

    // 绝不打包 react 和 react-dom，要求使用者自己提供 (Peer Dependencies)
    external: ['react', 'react-dom'],

    plugins: [
        resolve(),
        commonjs(),
        typescript({tsconfig: './tsconfig.json'}),
        babel({
            babelHelpers: 'bundled',
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            exclude: 'node_modules/**'
        }),
        terser() // 仅生产环境压缩
    ]
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 经典面试题：Webpack 和 Rollup 到底该怎么选？
*   **答**：行业内有一句公认的黄金准则：**"App 选 Webpack (Vite)，Library 选 Rollup"**。
    *   **开发业务应用 (App)**：你需要处理极其复杂的路由、海量的图片/CSS、代码分割，以及极其依赖开发时的热更新 (HMR)。这些是 Webpack 和 Vite 的绝对强项，Rollup 处理这些会非常吃力。
    *   **开发类库 (Library)**：比如写一个 Vue 组件库、一个工具函数包。你的代码最终会被别人 `npm install` 并用 Webpack/Vite 再次打包。你需要的仅仅是极其干净的、支持按需引入的纯 JS 产物。这时候如果用 Webpack，产物里塞满的闭包函数会恶心死使用者，**Rollup 才是绝对的王者**。

### 4.2 为什么 Rollup 提示 `Unresolved dependencies` (找不到 npm 包)？
*   **答**：
    *   **原因**：与 Webpack 默认会去 `node_modules` 里找包不同，Rollup 默认情况下**极其“清高”**。它只认识像 `import { a } from './utils.js'` 这种相对路径。如果你写了 `import _ from 'lodash'`，它根本不知道去哪找，会将其视作外部依赖并抛出警告。
    *   **避坑指南**：必须安装并配置官方插件 `@rollup/plugin-node-resolve`。它赋予了 Rollup 像 Node.js 一样去 `node_modules` 目录下寻址的能力。

### 4.3 为什么引入了 npm 包后，Rollup 报错 `Does not export xyz` 或报语法错误？
*   **答**：
    *   **原因**：Rollup 只支持 ES Modules (即 `import/export`)。但是 `node_modules` 里面的历史遗留包，大约有 70% 是使用 CommonJS (`require/module.exports`) 导出的（比如老版本的 React）。Rollup 拿到这些代码直接懵了。
    *   **避坑指南**：必须紧接着 resolve 插件之后，配置 `@rollup/plugin-commonjs` 插件。它的唯一作用就是将第三方库底层的 CommonJS 语法动态转换为 ESM 语法，从而让 Rollup 能继续愉快地进行 Tree-shaking 静态分析。

### 4.4 `external` 属性到底有多重要？如果不配置会引发什么灾难？
*   **答**：在类库开发中，它是**生死攸关**的属性。
    *   假设你开发了一个 React 组件库，你依赖了 `react`。如果你不把 `'react'` 加入 `external` 数组，Rollup 会非常敬业地**把整个 React 的源码打包进你的组件库产物中**！
    *   **灾难后果**：
        1. 你的组件库体积直接暴增几百 KB。
        2. 当别人安装你的组件库时，别人自己的项目里有一个 React，你的库里也夹带了一个私货 React。由于 React 的底层机制限制，**如果同一个页面运行着两个不同实例的 React，会导致严重的不可预知 Bug（如 Hooks 报错崩溃）**。
    *   **正解**：将所有在 `package.json` 的 `peerDependencies` 中的包，全部声明在 `external` 数组中。告诉 Rollup：“别管它，假定运行环境中已经存在这个包了”。

### 4.5 `output.file` 和 `output.dir` 有什么区别？什么时候用哪个？
*   **答**：
    *   **`file`**：用于输出**单一**文件。如果你的 `input` 只有一个起点，且代码中没有任何动态导入（`import()`），Rollup 默认会把所有代码打包进这一个文件中，此时必须使用 `file`。
    *   **`dir`**：用于输出**目录**。只要你的配置涉及了**多入口 (Multiple inputs)** 或者**代码分割 (Code splitting 动态导入)**，Rollup 会产出多个 chunk 文件，此时配置 `file` 会直接报错，必须配置 `dir` 指定输出文件夹。

### 4.6 开发 UMD 格式时，控制台疯狂警告 `Missing global variable name` 是怎么回事？
*   **答**：
    *   **原因**：UMD 和 IIFE 格式旨在直接运行在浏览器中。如果你配置了 `external: ['react']`，Rollup 知道不打包 React，但浏览器运行时根本没有 `require` 或 `import` 机制，它怎么去找到 React 呢？它只能去全局变量 `window` 上找。
    *   **解决方案**：必须在 `output` 中配置 `globals` 映射对象。比如 `globals: { react: 'React' }`。这句话的意思是：将代码中引入的 `react` 模块，映射并替换为浏览器全局变量 `window.React`。如果不配，Rollup 就会抛出上述警告，且你的库在浏览器里会报错崩溃。

### 4.7 `output.exports` 属性是干什么用的？为什么有时候会报 "mixed exports" 警告？
*   **答**：这主要发生在你将包含 ES6 `export default` 的代码打包成 CommonJS (`cjs`) 格式时。
    *   **背景**：ES Modules 允许同时存在**具名导出** (`export const a`) 和**默认导出** (`export default b`)。但在 Node.js 的 CommonJS 中，只有单一的 `module.exports`。
    *   **警告原因**：Rollup 不知道该如何完美地将混合导出映射到 `module.exports` 上。如果它强行映射，可能会改变代码的使用方式（比如使用者必须写 `require('lib').default` 才能拿到默认导出）。
    *   **解决方案**：显式配置 `output: { exports: 'named' }`。这告诉 Rollup：“我知道有混合导出，请把它们统一挂载为 `module.exports.xxx` 和 `module.exports.default`”。或者重构你的源码，尽量只使用具名导出。

### 4.8 为什么我的 Rollup 连 CSS 和图片都打包不了？
*   **答**：
    *   **理念差异**：Webpack 认为“万物皆模块”，而 Rollup 坚持“我就是一个纯粹的 JavaScript 打包器”。它原生在解析阶段完全不认识 `.css` 或 `.png` 等静态资源。
    *   **避坑指南**：如果你在开发组件库时必须引入 CSS，你需要安装并配置相关的 Rollup 插件（如 `rollup-plugin-postcss`）。但这其实并不是 Rollup 的强项。现代组件库（如 VueUse 或某些 React 库）往往建议**将 CSS 和 JS 分离编译**（例如用 Gulp 单独处理 Less/Sass），以保持 JS 逻辑包的绝对纯净。


