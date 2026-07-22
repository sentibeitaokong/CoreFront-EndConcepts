# Vue 3 源码目录结构

Vue 3 源码采用 **monorepo** 架构管理，所有核心模块都放在 `packages/` 目录下，每个模块都是一个独立的 npm 包，可以单独发布和使用。这种架构使得职责划分清晰，也方便贡献者理解和维护。

本文基于 Vue 3 官方仓库 [`vuejs/core`](https://github.com/vuejs/core) 的目录结构进行说明。

## 1. 根目录结构概览

```markdown
vue-core/
├── packages/ # 核心模块（monorepo 子包）
├── scripts/ # 构建、开发、发布等脚本
├── test-dts/ # TypeScript 类型定义测试
├── .github/ # GitHub 相关配置（CI、Issue 模板等）
├── .vscode/ # VSCode 推荐配置
├── rollup.config.js # Rollup 构建配置
├── vitest.config.ts # Vitest 单元测试配置
├── package.json # 根 package.json
├── pnpm-workspace.yaml # pnpm workspace 配置
├── tsconfig.json # 基础 TypeScript 配置
├── api-extractor.json # API Extractor 配置（生成 d.ts 汇总）
├── vitest.workspace.ts # Vitest 工作区配置
├── CHANGELOG.md
├── README.md
└── ... # 其他配置文件
```

## 2. packages/ 目录：核心模块

`packages/` 是 Vue 3 源码的核心，每个子目录对应一个独立的 npm 包（可通过 `@vue/xxx` 安装）。

```markdown
packages/
├── reactivity/ # 响应式系统（独立使用）
├── runtime-core/ # 运行时核心（平台无关）
├── runtime-dom/ # 浏览器 DOM 运行时（基于 runtime-core）
├── runtime-test/ # 测试用的轻量运行时
├── server-renderer/ # 服务端渲染（SSR）
├── compiler-core/ # 编译器核心（平台无关）
├── compiler-dom/ # 浏览器 DOM 编译器（基于 compiler-core）
├── compiler-ssr/ # SSR 专用编译器
├── shared/ # 内部共享工具函数
├── vue/ # 完整 Vue 入口（整合运行时+编译器）
├── vue-compat/ # Vue 2 兼容层
├── template-explorer/ # 模板编译探索工具（开发调试用）
├── dts-built-test/ # 类型定义构建测试
├── global.d.ts # 全局类型声明
└── ... # 其他辅助包
```

### 2.1 `reactivity` – 响应式系统

**作用**：提供独立于框架的响应式 API，可用于任何 JavaScript 项目。

**核心文件**：

- `src/index.ts` – 入口，导出 `ref`, `reactive`, `effect`, `computed` 等
- `src/effect.ts` – `effect` 副作用实现，依赖收集与触发
- `src/reactive.ts` – `reactive` 和 `readonly` 的 Proxy 实现
- `src/ref.ts` – `ref` 实现，包括 `.value` 访问
- `src/computed.ts` – 计算属性
- `src/dep.ts` – 依赖管理数据结构（`targetMap`）

**特点**：纯响应式，无虚拟 DOM 相关代码。

### 2.2 `runtime-core` – 平台无关运行时

**作用**：虚拟 DOM、组件系统、生命周期、渲染器等核心逻辑，与具体平台（浏览器、Native 等）无关。

**核心文件**：

- `src/index.ts` – 导出 `h`, `createVNode`, `render`, `createApp` 等
- `src/renderer.ts` – `createRenderer` 工厂函数，核心 diff 算法（`patch`）
- `src/component.ts` – 组件实例创建、生命周期、`setup` 函数执行
- `src/vnode.ts` – 虚拟节点（VNode）定义及辅助函数
- `src/apiCreateApp.ts` – `createApp` 实现
- `src/apiWatch.ts` – `watch` / `watchEffect`
- `src/scheduler.ts` – 异步任务调度器（`queueJob`, `nextTick`）
- `src/hydration.ts` – 服务端渲染水合（hydrate）逻辑

**特点**：不依赖浏览器 DOM API，所有 DOM 操作通过 `RendererOptions` 接口注入。

### 2.3 `runtime-dom` – 浏览器 DOM 运行时

**作用**：针对浏览器的实现，封装 DOM API 和特定属性/事件处理。

**核心文件**：

- `src/index.ts` – 导出 DOM 版本的 `createApp`, `render` 等
- `src/nodeOps.ts` – DOM 节点操作（`insert`, `remove`, `createElement` 等）
- `src/patchProp.ts` – DOM 属性更新逻辑（class, style, event 等）
- `src/modules/` – 分类的 prop 处理模块（`class.ts`, `style.ts`, `events.ts` 等）
- `src/directives/` – 内置指令的 DOM 实现（`vModel`, `vShow` 等）

**依赖**：`runtime-core` + `compiler-dom`（可选）。

### 2.4 `runtime-test` – 测试运行时

**作用**：用于单元测试的轻量级运行时，模拟 DOM 行为但不依赖真实浏览器。

**核心文件**：

- `src/index.ts` – 导出一个 `createRenderer` 实例，使用内存节点表示 DOM
- 用于 `runtime-core` 和 `compiler-core` 的测试。

### 2.5 `server-renderer` – 服务端渲染

**作用**：提供服务端渲染（SSR）能力，将 Vue 组件渲染为 HTML 字符串。

**核心文件**：

- `src/index.ts` – 导出 `renderToString`, `renderToNodeStream` 等
- `src/render.ts` – SSR 渲染逻辑（同步/异步）
- `src/helpers/` – SSR 辅助函数（如 `ssrRenderAttrs`）

**注意**：SSR 编译器在 `compiler-ssr` 包中。

### 2.6 `compiler-core` – 平台无关编译器

**作用**：模板编译核心，将模板字符串解析为 AST，转换并生成 JavaScript 代码。

**核心文件**：

- `src/index.ts` – 导出 `baseCompile`, `compile`, `parse`, `transform` 等
- `src/parse.ts` – 模板 → AST（有限状态机）
- `src/transform.ts` – AST 转换（包括静态提升、PatchFlag 标记等）
- `src/codegen.ts` – 生成渲染函数代码
- `src/ast.ts` – AST 节点类型定义
- `src/transforms/` – 各类转换插件（`transformIf`, `transformFor`, `transformElement` 等）

**特点**：不依赖 HTML 或 DOM 特定语法，可扩展用于非浏览器平台。

### 2.7 `compiler-dom` – 浏览器 DOM 编译器

**作用**：基于 `compiler-core`，添加 DOM 特定指令和语法（`v-html`, `v-text`, `v-model` 等）。

**核心文件**：

- `src/index.ts` – 导出 DOM 版 `compile`
- `src/transforms/` – DOM 专用转换（如 `transformStyle`, `transformVHtml`）
- `src/parserOptions.ts` – DOM 解析选项（区分标签、属性等）

### 2.8 `compiler-ssr` – SSR 编译器

**作用**：生成 SSR 专用的渲染函数代码（直接拼接字符串，不创建 VNode）。

**核心文件**：

- `src/index.ts` – `compile` 函数
- `src/ssrCodegen.ts` – 生成 `ssrRender` 相关代码

### 2.9 `shared` – 共享工具函数

**作用**：内部通用的工具方法，不依赖其他模块，可被所有包使用。

**核心文件**：

- `src/index.ts` – 导出各种工具函数
- `src/domTagConfig.ts` – DOM 标签相关配置
- `src/codeframe.ts` – 错误代码帧生成
- `src/escapeHtml.ts` – HTML 转义
- `src/makeMap.ts` – 快速字符串匹配工具

### 2.10 `vue` – 完整 Vue 入口

**作用**：整合运行时和编译器，导出完整的 Vue API（既包含运行时也包含编译器）。

**核心文件**：

- `src/index.ts` – 入口，导出所有公共 API
- `src/runtime.ts` – 仅运行时导出
- `src/runtimeWithCompiler.ts` – 包含编译器的版本

**构建产物**：

- `vue.global.js` – 完整版（包含编译器）
- `vue.runtime.global.js` – 运行时版（不含编译器）
- `vue.esm-bundler.js` – 供打包工具使用的 ESM 版本

## 3. 测试目录与类型测试

Vue 3 的测试分为单元测试（`__tests__`）和类型测试（`test-dts`），分布在各个包内。

- `packages/reactivity/__tests__/` – 响应式单元测试
- `packages/runtime-core/__tests__/` – 运行时核心测试
- `packages/compiler-core/__tests__/` – 编译器测试
- `test-dts/` – 类型定义正确性测试（使用 `tsd`）

## 4. 模块依赖关系

![Logo](/img/vueCatalog.png)
