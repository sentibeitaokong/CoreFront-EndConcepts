# [tsup](https://tsup.egoist.dev/) (基于 esbuild 的极速 TS 打包器)

## 1. tsup 的作用和设计动机

### 1.1 为什么选择 tsup？

如果说 Rollup 是“**极致精细的工匠**”，那么 **tsup** 就是“**简单粗暴的极速专家**”。它是基于 `esbuild` 封装的零配置打包工具，专门为了**解决 TypeScript 类库打包的繁琐配置**而生。

- **真正的零配置**：无需编写复杂的 `rollup.config.js`，它能自动识别入口、处理依赖、生成 TS 类型声明。
- **极致的速度**：底层使用 Go 语言编写的 `esbuild`，构建速度比 Rollup 快 10-100 倍。
- **开箱即用的特性**：内置支持 TypeScript、JSX、CSS 模块化、代码压缩，并能自动处理 `peerDependencies`。

### 1.2 核心设计哲学

`tsup` 的口号是 **“**Bundle your TypeScript library with no config**”**（无需配置打包你的 TS 类库）。它假设你正在开发一个类库，因此自动为你配置好了最佳实践，让你能专注于源码编写。

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

### 3.1 高频配置项速查

[width(18,29,53)]

| 配置项       | 常见取值                             | 工程用途                                                        |
| :----------- | :----------------------------------- | :-------------------------------------------------------------- |
| `entry`      | `['src/index.ts']` / 对象            | 打包入口，多个入口用数组或对象                                  |
| `format`     | `['cjs', 'esm']` / `['iife']`        | 输出格式，类库通常是 `cjs` + `esm` 各一份                       |
| `dts`        | `true` / `{ entry }`                 | 生成 `.d.ts`，底层走 `tsc` / API Extractor，会明显拖慢构建      |
| `splitting`  | `true` / `false`                     | 代码分割，仅对 `esm` 生效，`cjs` / `iife` 不支持                |
| `external`   | 字符串 / 正则数组                    | 手动外置依赖；`peerDependencies` 默认已自动外置                 |
| `noExternal` | 数组                                 | 反向操作：强制把某个依赖打进产物                                |
| `minify`     | `true` / `false`                     | 压缩混淆，排查产物问题时建议临时关掉                            |
| `target`     | `'es2015'` / `'node18'`              | 语法降级目标，避免老浏览器报 `SyntaxError`                      |
| `clean`      | `true`                               | 构建前清空 `outDir`                                             |
| `sourcemap`  | `true` / `'inline'`                  | 生成 Source Map                                                 |
| `outDir`     | `'dist'`                             | 产物输出目录                                                    |
| `platform`   | `'node'` / `'browser'` / `'neutral'` | 目标运行环境，打包 CLI 时必须设为 `node`                        |
| `shims`      | `true`                               | 为 CJS / ESM 互相引用注入 `__dirname`、`import.meta.url` 等垫片 |
| `banner`     | `{ js: '#!/usr/bin/env node' }`      | 往产物头部注入文本，CLI 包用它写 shebang                        |
| `onSuccess`  | 命令字符串 / 函数                    | 构建成功后执行收尾动作（拷贝样式、启动本地示例）                |
| `watch`      | `true` / 路径数组                    | 监听模式，开发类库时配合 `--watch` 使用                         |

## 4. 为什么企业级类库开发选 tsup？

在现代前端工程化中，`tsup` 已经成为轻量级类库的首选。

### 4.1 无缝的 TS 与 DTS 处理

- **痛点**：传统 Rollup 想要生成 `.d.ts` 需要配合极其繁琐的 `rollup-plugin-typescript2` 和 `rollup-plugin-dts`，且配置极其容易冲突。
- **tsup 的优势**：只需设置 `--dts`，它会自动调用内部的 `api-extractor` 或 `tsc` 生成完美兼容的类型声明文件。

### 4.2 智能处理 `peerDependencies`

- `tsup` 默认会自动将 `package.json` 中的 `peerDependencies` 标记为 `external`（外部依赖），避免了手动配置 `external` 的繁琐，彻底杜绝了“**打包宿主 React 源码**”导致的组件库崩溃问题。

### 4.3 优雅的代码分割 (Code Splitting)

- 虽然 `esbuild` 在大工程的代码分割上较弱，但 `tsup` 针对类库场景优化了代码分割逻辑。它能根据你的 `entry` 配置，智能地将代码拆分为多个 chunk，非常适合那些支持“**按需引入**”的组件库。

### 4.4 高频落地场景

- **纯 TS 工具库 / 函数库**：一条 `tsup src/index.ts --format cjs,esm --dts` 就能同时拿到双格式产物和类型声明，这是替代手写 Rollup 配置的最典型案例。
- **React / Vue Hooks 库**：把 `react`、`vue` 这类宿主依赖留在 `peerDependencies`（tsup 会自动外置），避免使用者的项目里出现两份框架实例。
- **CLI 命令行工具**：配置 `platform: 'node'` + `format: ['cjs']`，再用 `banner` 注入 `#!/usr/bin/env node` shebang，产物即可直接作为 `bin` 入口。
- **组件库的“先跑起来”**：团队还没精力维护完整 Rollup 配置时，先用 tsup 零配置产出可用包，后续再按需迁移到更精细的方案。
- **本地开发联调**：`tsup --watch` 配合 `onSuccess` 触发本地示例或测试脚本，改一行源码就能立刻看到重建结果。

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 tsup 和 Rollup/esbuild 的区别是什么？怎么选？

[width(15,25,23,37)]

| 工具      | 定位                                 | 核心优势                                         | 适用场景                                                     |
| :-------- | :----------------------------------- | :----------------------------------------------- | :----------------------------------------------------------- |
| `tsup`    | 更高阶的抽象工具，底层基于 `esbuild` | 少写配置，快速打出 TS 类库                       | 轻量级工具库、Hooks 库、小型组件库                           |
| `esbuild` | 底层构建引擎                         | 构建速度最快                                     | 追求极致速度且产物简单的场景；复杂分包与精细产物控制能力较弱 |
| `Rollup`  | 精细化的打包器                       | 多种格式输出、复杂 Tree-shaking、精细的 CSS 提取 | 超大型复杂组件库（ElementPlus、Antd），需要逐行控制产物      |

**选型结论**：开发轻量级工具库、Hooks 库、小型组件库时**首选 tsup**；开发超大型复杂组件库（如 ElementPlus、Antd）时**首选 Rollup**，因为它们需要对每一行代码进行极度精细的控制。

### 5.2 tsup 构建后，为什么我的 CSS 文件没有被打包进去？

- **原因**：`tsup` 本质上是一个 JS 打包器，它的核心是处理 JS/TS。虽然它支持 CSS，但它默认将 CSS 处理为 JS 逻辑（通过 import 注入）。
- **避坑指南**：如果你希望输出独立的 CSS 文件，建议使用 `onSuccess` 钩子手动拷贝，或者配合 `PostCSS` 插件使用。如果 CSS 逻辑极其复杂（包含大量 Sass 变量），请果断放弃用打包工具处理 CSS，改用 Gulp 或脚本单独编译样式。

### 5.3 为什么 `tsup` 构建出来的代码在老版本浏览器里报错 `SyntaxError`？

- **原因**：`esbuild` 默认的编译目标（Target）通常比较高（如 `es2020`）。如果你的用户群体依然在使用 IE11 或较旧的 Chrome，这些高阶语法无法被浏览器识别。
- **避坑指南**：在 `tsup.config.ts` 中明确指定 `target`，例如 `target: 'es6'` 或 `target: 'es2015'`。esbuild 会根据此目标自动进行语法降级。

### 5.4 遇到 `tsup` 生成的 `.d.ts` 类型定义文件路径错误怎么办？

- **原因**：这是 `tsup`类型生成机制的常见限制,尤其是在Monorepo架构下,类型引用的相对路径容易解析混乱。
- **避坑指南**：检查你的 `tsconfig.json` 中的 `declarationDir` 和 `rootDir`。如果问题依旧，可以在 `tsup.config.ts` 中使用 `dts: { entry: 'src/index.ts' }` 明确指定入口，或使用 `--dts-resolve` 参数强制解析依赖路径。

### 5.5 `splitting` 要不要开？为什么 `cjs` 格式下代码分割不生效？

- **原因**：代码分割依赖原生的动态 `import()`，而CommonJS没有对应的运行时机制，所以 `esbuild` 只对 `esm` 输出实现 `splitting`，对 `cjs` / `iife` 会直接忽略。
- **避坑指南**：库如果需要按需加载能力，就把 `splitting` 开在 `esm` 产物上；`cjs` 的使用者本就跑在 Node / SSR 环境，通常不依赖拆分。多入口场景下，在 `entry` 里声明多个文件同样是拆分的天然手段。

### 5.6 用 tsup 打包 CLI 工具要注意什么？

- **`platform`**：必须显式设为 `'node'`，否则默认的浏览器假设会让 `node:` 内置模块的处理出错。
- **shebang**：用 `banner: { js: '#!/usr/bin/env node' }` 注入，避免每次构建后手动补第一行。
- **依赖策略**：命令行工具的依赖一般随包安装（放在 `dependencies` 而非 `peerDependencies`），必要时再用 `noExternal` 强制把某些依赖内联进产物，减少使用者的安装体积。

### 5.7 为什么开启 `dts` 后构建突然变得很慢？

- **原因**：类型声明生成并不走 `esbuild`，而是交给 `tsc`（或 `rollup-plugin-dts`）重新跑一遍类型推导，它天生就是单线程的慢活儿，和 esbuild 的毫秒级速度不是一回事。
- **优化方向**：把 `dts` 拆到独立的 `tsup --dts-only` 或单独的 `tsc` 脚本中，与 JS 打包并行执行；同时收紧 `tsconfig.json` 的 `include`，别让类型解析扫到大目录。
