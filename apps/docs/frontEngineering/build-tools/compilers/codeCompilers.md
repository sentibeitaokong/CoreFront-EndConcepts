---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 编译与打包引擎

## 1. 核心概念与特性

在现代前端工程化中，随着项目规模的极速膨胀，传统的由 JavaScript 编写的构建工具已经触及了 Node.js 单线程的性能天花板。前端基建正在经历一场轰轰烈烈的“**底层语言大换血（Rust/Go 革命）**”。

我们需要将这些底层引擎明确划分为两类：**编译器（Compiler/Transpiler，负责单个文件的代码降级与转换）** 和 **打包器（Bundler，负责依赖图谱分析与代码拼接）**。

[width(15,13,13,59)]

| 引擎核心     | 编写语言   | 引擎定位                 | 核心特性与行业地位                                                                                                                                                 |
| ------------ | ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Babel**    | JavaScript | **纯编译器**             | **前端编译界的泰斗。** 拥有无敌的插件生态（Plugin），能实现最深度的 AST 定制操作。缺点是受限于 JS 单线程，处理巨型项目时编译极其缓慢。                             |
| **SWC**      | Rust       | **编译器 (+轻量打包)**   | **极速编译的新世代王者。** 核心目标是 100% 替换 Babel。利用 Rust 多线程极限压榨 CPU，速度比 Babel 快 20-70 倍。已被 Next.js 选为默认引擎，也是 Rspack 的底层核心。 |
| **tsc**      | TypeScript | **类型检查器**           | **不可替代的类型警察。** 它是唯一能做到跨文件、全量且绝对精准进行 TS 类型推导的工具。在现代工程中，它的“**代码生成权**”已被剥离，退化为纯粹的静态检查工具。        |
| **esbuild**  | Go         | **极速打包器 (+编译器)** | **开启原生基建时代的破壁者。** 快到反直觉（比 Webpack 快 100 倍）。它是 Vite 能够实现毫秒级冷启动的绝对核心（负责依赖预构建和 TS/JSX 单文件极速转译）。            |
| **Rolldown** | Rust       | **终极打包器**           | **Vite 未来的终极武器。** 由 Vite 团队（尤雨溪牵头）主导开发。旨在同时拥有 esbuild 的极速性能，以及 100% 兼容 Rollup 极其庞大的高级打包插件生态。                  |

## 2. 核心工作原理与机制

### 2.1 编译器与打包器的本质边界

- **编译器 (如 Babel, SWC, tsc)**：
  - **视角是局部的。** 它们通常执行“**1对1**”的文件转换。它们读取一个源文件，解析出 AST（抽象语法树），擦除类型、降级语法，然后输出一个 JS 文件。它们**不关心**这个文件引用了谁，也不负责把多个文件合并。

- **打包器 (如 esbuild, Rolldown, Webpack)**：
  - **视角是全局的。** 它们从入口文件（Entry）出发，通过静态分析 `import/require` 语句，抓取并构建出一张巨大的**依赖关系图（Dependency Graph）**。然后，它们运用 Tree-shaking 剔除死代码，最终将成百上千个模块智能拼接、拆分成少数几个 Chunk 产物。

### 2.2 现代构建流水线的“**职责分离**”

现代优秀的工程化架构（如 Vite）不再依赖单一的“**全能工具**”，而是将不同引擎的优势拼装到了极致：

- **类型检查**：完全交给 `tsc`（在独立进程中运行，不阻塞主线程）。
- **开发环境编译**：交给 `esbuild`（瞬间将 TS/JSX 转为 JS 返回给浏览器）。
- **第三方依赖处理**：交给 `esbuild`（毫秒级将庞大的 node_modules 预构建为 ESM 模块）。
- **生产环境打包**：交给 `Rollup` 或 `Rolldown`（进行极其精细的产物切片、CSS 提取和极端场景的 Tree-shaking）。

## 3. 实战配置与工程化应用

### 3.1 Babel 的标准降级配置 (`babel.config.js`)

Babel 的核心设计是“**微内核**”，依靠 Presets（预设）和 Plugins（插件）实现功能的按需组装。

```js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: '> 0.25%, not dead', // 智能浏览器兼容性降级
        useBuiltIns: 'usage', // 极其重要：按实际使用情况自动注入 Polyfill 垫片
        corejs: 3,
      },
    ],
    '@babel/preset-typescript', // 仅暴力擦除 TS 类型，不做检查
    '@babel/preset-react',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime'], // 提取辅助函数，缩减代码体积
  ],
}
```

### 3.2 SWC 的极速替代配置 (`.swcrc`)

作为 Babel 的挑战者，SWC 的配置在结构上高度对标 Babel，但由于底层是 Rust，编译速度有质的飞跃。

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true
    },
    "transform": {
      "react": { "runtime": "automatic" }
    },
    "target": "es2015"
  },
  "env": {
    "targets": "> 0.25%, not dead",
    "mode": "usage",
    "coreJs": "3"
  },
  "minify": true // SWC 内置了极速的压缩引擎，可直接替代 Terser
}
```

### 3.3 esbuild 的原生调用指令

在大部分情况下，我们不需要手动配置 esbuild，Vite 会在底层静默调用它。但如果在编写 Node 脚本或小工具时，你可以体会到它极简的 API：

```js
// build.js
const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true, // 开启打包模式，合并依赖
    minify: true, // 极速压缩
    sourcemap: true,
    target: ['es2020'],
    outfile: 'dist/out.js',
  })
  .catch(() => process.exit(1))
```

### 3.4 tsc 在现代工程中的职能剥离 (`tsconfig.json`)

在现代工程化中，`tsc` 已经被剥夺了输出代码的权力。

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "isolatedModules": true, // 单文件编译模式，配合 SWC/esbuild 必须开启
    "noEmit": true, // 🌟 核心：只做静态类型检查，禁止输出任何 JS 文件
    "strict": true
  }
}
```

### 3.5 rolldown的代码分割配置

```js
// rolldown.config.js
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/main.js',
  output: {
    dir: 'dist',
    format: 'esm',
    codeSplitting: {
      groups: [
        // 将 node_modules 中的第三方库分到 vendor chunk
        {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          entriesAware: true, // 按入口感知合并
        },
        // 将 UI 库单独拆分
        {
          name: 'ui-lib',
          test: /[\\/]node_modules[\\/](element-plus|ant-design-vue)[\\/]/,
          priority: 10,
        },
        // 将 Vue 全家桶单独拆分
        {
          name: 'vue-vendor',
          test: /[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/,
          priority: 20,
        },
      ],
      // 低于此阈值的 chunk 合并到主块
      minSize: 20000,
      maxSize: 50000,
    },
  },
})
```

### 3.6 高频配置项速查（Babel 与 tsconfig）

#### 3.6.1 **Babel（`.babelrc` / `babel.config.js`）**

[width(15,36,49)]

| 配置项        | 常见取值                                                   | 工程用途                                      |
| ------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `presets`     | `@babel/preset-env` / `preset-typescript` / `preset-react` | 打包好的插件集合，按需组合                    |
| `plugins`     | `@babel/plugin-transform-runtime` 等                       | 单个 AST 转换点，执行顺序早于 `presets`       |
| `targets`     | `'> 0.25%, not dead'` / `{ chrome: '80' }`                 | 兼容目标，决定语法降级范围                    |
| `useBuiltIns` | `'usage'` / `'entry'` / `false`                            | Polyfill 注入策略，`usage` 按实际调用自动导入 |
| `corejs`      | `3`                                                        | 配合 `useBuiltIns` 指定 core-js 主版本        |
| `loose`       | `true` / `false`                                           | 宽松模式，产物更小但与规范有偏差，谨慎开启    |

#### 3.6.2 **tsconfig（`compilerOptions`）**

[width(15,38,47)]

| 配置项             | 常见取值                           | 工程用途                                           |
| ------------------ | ---------------------------------- | -------------------------------------------------- |
| `target`           | `ESNext` / `ES2015` / `ES5`        | 输出 JS 的语法版本，只管语法不管 API               |
| `module`           | `ESNext` / `CommonJS` / `Preserve` | 输出模块规范，交给打包器时写 `ESNext`              |
| `moduleResolution` | `node` / `node16` / `bundler`      | 模块解析策略，配合 `module: ESNext` 推荐 `bundler` |
| `paths`            | `{ "@/*": ["src/*"] }`             | 路径别名，只影响类型解析，不改写运行时导入         |
| `isolatedModules`  | `true`                             | 强制单文件可编译，配合 SWC / esbuild 必须开启      |
| `noEmit`           | `true`                             | 只做类型检查不产出文件（现代工程默认）             |

### 3.7 高频落地场景

- **浏览器兼容降级**：历史项目用 `@babel/preset-env` + `useBuiltIns: 'usage'`；现代项目直接交给 SWC 或 esbuild 的 `target`，按语法目标自动降级。
- **装饰器与 JSX 转译**：React 项目配置 `runtime: 'automatic'` 即可免去手写 `import React`；装饰器要么走 Babel 的 `legacy` 实现（配 `experimentalDecorators`），要么走新版标准装饰器，三者必须与 TS 配置对齐，否则产物行为会不一致。
- **类型检查与转译分离**：CI 里跑 `tsc --noEmit` 卡类型，构建流水线交给 SWC / esbuild 只管出代码，两类任务互不阻塞。
- **Polyfill 按需注入**：把 `core-js` 交给 `useBuiltIns: 'usage'` 自动引入，避免整包注入导致的体积膨胀。
- **Monorepo 里的共享 tsconfig**：把 `target` / `module` / `moduleResolution` 收敛到根 `tsconfig.base.json`，各子包只覆盖 `paths` 这类差异项。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然 Vite (esbuild) 那么快，为什么生产环境打包还要用速度较慢的 Rollup，而不直接全用 esbuild？

- **esbuild 的短板**：esbuild 追求的是绝对的速度，它的内部架构导致其在生产环境非常需要的 **代码分割（Code Splitting）**、**CSS 处理边界**、以及 **高级别 Tree-shaking** 方面，目前仍然无法做到像 Rollup 那样成熟和精细。此外，esbuild 的插件 API 设计非常底层且克制，无法支撑前端极其庞大复杂的打包定制需求。
- **Vite 的妥协**：为了保证生产环境产物（Bundle）的极度优化和稳定，Vite 选择了在生产环境切换回 Rollup。这就导致了目前的“**开发/生产不一致**”问题。

### 4.2 Rolldown 究竟是为了解决什么痛点诞生的？

- **痛点**：正是上一题提到的“**Vite 开发环境用 esbuild，生产环境用 Rollup**”导致的“**精神分裂**”。偶尔会出现本地开发没问题，上线打包却报错的诡异 Bug。
- **Rolldown 的使命**：Vite 团队用 Rust 重新编写了一个打包器。它的目标是：**速度上对标 esbuild，API 和插件生态上 100% 兼容 Rollup**。一旦 Rolldown 成熟，它将彻底替换掉 Vite 底层的 esbuild 和 Rollup，实现前端基建真正的底层大一统。

### 4.3 `tsc`、Babel、SWC、esbuild 都能编译 TypeScript，我到底该怎么选？

- **类型检查**：不管你用什么工具编译代码，**类型检查永远只能交给 `tsc`**（运行 `tsc --noEmit`）。因为 Babel/SWC/esbuild 采取的都是“**暴力擦除**”策略，它们根本不认识类型对错，只会把 TS 类型当成注释删掉然后转换代码。
- **代码生成选型**：
  - 新项目、大项目：**优先选择SWC或esbuild**(通常通过接入Vite/Rspack间接使用），享受极致的构建速度。
  - 沉重的历史老项目：**继续使用 Babel**。老项目中往往写了大量强依赖 JS AST 的自定义 Babel 插件，要用 Rust 重写这些插件的成本极高，不要盲目跟风替换。

### 4.4 什么是 `isolatedModules: true`？为什么用 Babel/SWC/esbuild 编译 TS 时必须在 `tsconfig.json` 中开启它？

- **原因**：Babel、SWC 和 esbuild 都是**单文件编译器**，它们在编译一个文件时，是看不到其他文件长什么样的。如果你写了 `export { MyType } from './types'`，单文件编译器根本无法判断 `MyType` 是一个应该保留的值，还是一个必须删掉的 TS 类型。
- **避坑指南**：开启 `isolatedModules: true` 后，TS 会强迫你在代码里显式写清楚 `export type { MyType }`。这样 SWC/esbuild 一看到 `type` 关键字，就能安全且毫无歧义地把它擦除掉了。

### 4.5 tsconfig 里的 `target` 和 `module` 到底该怎么配？

- **`target` 只管语法**：它负责把高阶语法降级到目标版本（如可选链、类字段），**不负责补 API 层的 Polyfill**（`Promise.allSettled` 之类的缺失要靠 `core-js`）。
- **`module` 决定模块规范**：交给打包器处理时应写 `ESNext`，让 Tree-shaking 有迹可循；直接产出给 Node 运行（如 CLI）才写 `CommonJS`。
- **该由谁降级**：如果链路上已经有 SWC / esbuild，`tsc` 只做检查（`noEmit: true`），此时 `target` 写 `ESNext` 也无妨，真正的降级目标由打包器的 `target` 决定。

### 4.6 为什么装饰器（Decorator）在不同引擎下配置对不上？

- **存在两套实现**：TypeScript 长期使用 `experimentalDecorators: true` 的“**旧版装饰器**”，而 Babel / SWC 默认走 TC39 的新标准装饰器，两者语义并不相同。
- **对齐方式**：如果项目用的是 TS 旧版装饰器（Angular、NestJS 风格），Babel 侧要打开对应的 `legacy` 选项；SWC 则需要同步开启 `jsc.parser.decorators`、`jsc.transform.legacyDecorator` 与 `decoratorMetadata`。

### 4.7 为什么 `tsconfig` 的 `paths` 别名在 tsc 里能过，运行时却报模块找不到？

- **原因**：`paths` 只影响 TypeScript 的**类型解析**，它不会去改写产物里的 `import` 路径。编译后代码里写的仍然是 `@/utils`，Node 或浏览器自然找不到。
- **解决**：运行时别名必须交给打包器处理——Vite 的 `resolve.alias`、Webpack 的 `resolve.alias`，或使用 `vite-tsconfig-paths` 一类插件让打包器直接读取 `paths` 配置。
