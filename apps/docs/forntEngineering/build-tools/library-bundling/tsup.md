# [tsup](https://tsup.egoist.dev/) (基于 esbuild 的极速 TS 打包器)

## 1. tsup 的作用和设计动机

### 1.1 为什么选择 tsup？

如果说 Rollup 是“极致精细的工匠”，那么 **tsup** 就是“简单粗暴的极速专家”。它是基于 `esbuild` 封装的零配置打包工具，专门为了**解决 TypeScript 类库打包的繁琐配置**而生。

- **真正的零配置**：无需编写复杂的 `rollup.config.js`，它能自动识别入口、处理依赖、生成 TS 类型声明。
- **极致的速度**：底层使用 Go 语言编写的 `esbuild`，构建速度比 Rollup 快 10-100 倍。
- **开箱即用的特性**：内置支持 TypeScript、JSX、CSS 模块化、代码压缩，并能自动处理 `peerDependencies`。

### 1.2 核心设计哲学

`tsup` 的口号是 **"Bundle your TypeScript library with no config"**（无需配置打包你的 TS 类库）。它假设你正在开发一个类库，因此自动为你配置好了最佳实践，让你能专注于源码编写。

## 2. 核心功能与使用

### 2.1 快速上手

**安装**

```bash
pnpm add -D tsup

```

**在 `package.json` 中配置**

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --minify"
  }
}
```

## 3. 核心配置深度拆解

虽然 `tsup` 强调零配置，但通过 `tsup.config.ts` 文件，你可以获得完全的控制权。

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  // 1. 入口文件
  entry: ['src/index.ts'],

  // 2. 输出格式 (cjs, esm, iife)
  format: ['cjs', 'esm'],

  // 3. 自动生成 .d.ts 类型文件 (基于 API Extractor)
  dts: true,

  // 4. 代码压缩
  minify: true,

  // 5. sourcemap 支持
  sourcemap: true,

  // 6. 清理 dist 目录
  clean: true,

  // 7. 处理环境变量
  env: {
    NODE_ENV: 'production',
  },

  // 8. 扩展能力：处理样式文件
  onSuccess: 'cp src/index.css dist/index.css',
})
```

## 4. 为什么企业级类库开发选 tsup？

在现代前端工程化中，`tsup` 已经成为轻量级类库的首选。

### 4.1 无缝的 TS 与 DTS 处理

- **痛点**：传统 Rollup 想要生成 `.d.ts` 需要配合极其繁琐的 `rollup-plugin-typescript2` 和 `rollup-plugin-dts`，且配置极其容易冲突。
- **tsup 的优势**：只需设置 `--dts`，它会自动调用内部的 `api-extractor` 或 `tsc` 生成完美兼容的类型声明文件。

### 4.2 智能处理 `peerDependencies`

- `tsup` 默认会自动将 `package.json` 中的 `peerDependencies` 标记为 `external`（外部依赖），避免了手动配置 `external` 的繁琐，彻底杜绝了“打包宿主 React 源码”导致的组件库崩溃问题。

### 4.3 优雅的代码分割 (Code Splitting)

- 虽然 `esbuild` 在大工程的代码分割上较弱，但 `tsup` 针对类库场景优化了代码分割逻辑。它能根据你的 `entry` 配置，智能地将代码拆分为多个 chunk，非常适合那些支持“**按需引入**”的组件库。

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 tsup 和 Rollup/esbuild 的区别是什么？怎么选？

- **答**：
  - **tsup**：是一个**更高阶的抽象工具**。它是为了“**快速交付 TS 类库**”设计的，底层用的是 `esbuild`。它的目标是：少写配置，快速打出包。
  - **esbuild**：是底层的**构建引擎**。它速度最快，但缺乏插件生态，产物控制能力（如复杂的代码分包）较弱。
  - **Rollup**：是**精细化的打包器**。它处理复杂产物（多种格式、复杂的 Tree-shaking、精细的 CSS 提取）的能力依然无可替代。

- **选型结论**：
  - 开发轻量级工具库、Hooks 库、小型组件库：**首选 tsup**。
  - 开发超大型复杂组件库（如 ElementPlus, Antd）：**首选 Rollup**，因为它们需要对每一行代码进行极度精细的控制。

### 5.2 tsup 构建后，为什么我的 CSS 文件没有被打包进去？

- **答**：
  - **原因**：`tsup` 本质上是一个 JS 打包器，它的核心是处理 JS/TS。虽然它支持 CSS，但它默认将 CSS 处理为 JS 逻辑（通过 import 注入）。
  - **避坑指南**：如果你希望输出独立的 CSS 文件，建议使用 `onSuccess` 钩子手动拷贝，或者配合 `PostCSS` 插件使用。如果 CSS 逻辑极其复杂（包含大量 Sass 变量），请果断放弃用打包工具处理 CSS，改用 Gulp 或脚本单独编译样式。

### 5.3 为什么 `tsup` 构建出来的代码在老版本浏览器里报错 `SyntaxError`？

- **答**：
  - **原因**：`esbuild` 默认的编译目标（Target）通常比较高（如 `es2020`）。如果你的用户群体依然在使用 IE11 或较旧的 Chrome，这些高阶语法无法被浏览器识别。
  - **避坑指南**：在 `tsup.config.ts` 中明确指定 `target`，例如 `target: 'es6'` 或 `target: 'es2015'`。esbuild 会根据此目标自动进行语法降级。

### 5.4 遇到 `tsup` 生成的 `.d.ts` 类型定义文件路径错误怎么办？

- **答**：
  - **原因**：这是 `tsup` 类型生成机制的常见限制，尤其是在 Monorepo 架构下，类型引用的相对路径容易解析混乱。
  - **避坑指南**：检查你的 `tsconfig.json` 中的 `declarationDir` 和 `rootDir`。如果问题依旧，可以在 `tsup.config.ts` 中使用 `dts: { entry: 'src/index.ts' }` 明确指定入口，或使用 `--dts-resolve` 参数强制解析依赖路径。
