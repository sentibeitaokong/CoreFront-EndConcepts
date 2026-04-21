# Tree Shaking

## 1. 什么是 Tree Shaking？

Tree Shaking 是一个术语，通常用于描述移除 JavaScript 上下文中未引用的代码（dead-code）。它依赖于 ES2015 模块系统的静态结构特性，即 `import` 和 `export` 语句在编译时就能确定模块间的依赖关系，而无需执行代码。

**核心思想**：像摇晃一棵树一样，让枯枝落叶（未使用的代码）掉落，只留下活着的枝条（实际使用的代码）。

## 2. Tree Shaking 的工作原理

### 2.1 静态分析

ES 模块是静态的，`import` 和 `export` 必须在模块顶层，且模块路径不能动态计算。这种设计使得构建工具（如 Webpack、Rollup、Vite）可以在不运行代码的情况下，分析出哪些导出被使用了，哪些没有被使用。

### 2.2 标记未使用代码

构建工具在解析模块时，会建立依赖图，并为每个导出打上“使用”或“未使用”的标记。未使用的导出在后续的压缩阶段（如 Terser）会被删除。

### 2.3 副作用检测

有些代码虽然没有被直接使用，但执行时会产生副作用（如修改全局变量、polyfill 等）。如果构建工具错误地删除了这些代码，可能导致程序运行错误。因此，Tree Shaking 需要配合 `sideEffects` 配置来告知哪些文件是“安全的”。

## 3. Tree Shaking 在 Vue 3 中的应用

Vue 3 从设计之初就将 Tree Shaking 作为一等公民，整个框架采用模块化架构，大部分 API 都可以按需引入。

### 3.1 Vue 3 的可 Tree Shaking API

Vue 3 的许多 API 都是独立导出的，如果项目中没有使用它们，构建工具会将其从最终 bundle 中移除。

```javascript
// 仅导入使用的 API
import { ref, computed, watchEffect } from 'vue'

// 未使用的 API 不会被打包
// 例如：reactive, readonly, shallowRef, effectScope 等
```

Vue 3 中支持 Tree Shaking 的主要功能包括：

- 响应式 API：`ref`、`reactive`、`computed`、`watch`、`watchEffect`、`effectScope` 等。
- 生命周期钩子：`onMounted`、`onUpdated`、`onUnmounted` 等。
- 内置组件：`<Transition>`、`<TransitionGroup>`、`<KeepAlive>`、`<Teleport>`、`<Suspense>`。
- 指令：`v-model`、`v-pre` 等（部分指令需要特殊处理）。
- 工具函数：`nextTick`、`defineAsyncComponent`、`h` 等。

### 3.2 编译时优化与 Tree Shaking

Vue 3 的模板编译器会生成带有 `import` 语句的渲染函数，只引入实际使用的运行时辅助函数。例如：

```vue
<template>
  <div>{{ msg }}</div>
</template>
```

编译输出（简化）：

```javascript
import { toDisplayString as _toDisplayString, createVNode as _createVNode, openBlock as _openBlock, createBlock as _createBlock } from "vue"

// 只引入了 toDisplayString、createVNode、openBlock、createBlock
```

如果模板中没有使用 `v-model`，则 `vModelText` 等指令相关的代码不会被引入。

### 3.3 内置组件的 Tree Shaking

Vue 3 的内置组件也是独立导出的。如果你没有在模板中使用 `<Transition>`，该组件的代码就不会出现在最终产物中。

```javascript
// 只有在模板中使用了 <Transition> 时，才会导入 Transition 组件
import { Transition } from 'vue'
```

### 3.4 `sideEffects` 配置

Vue 3 的 `package.json` 中声明了 `"sideEffects": false`，表示所有模块都没有副作用（除了特定的文件，如 `sideEffects: ["*.css"]`）。这告诉构建工具可以安全地对 Vue 的模块进行 Tree Shaking。

## 4. 如何启用 Tree Shaking？

### 4.1 使用支持 ES 模块的构建工具

- **Webpack 4+**：在生产模式（`mode: 'production'`）下自动启用。
- **Rollup**：默认支持 Tree Shaking。
- **Vite**：基于 Rollup，生产构建自动启用。
- **esbuild**：支持 Tree Shaking（但不如 Rollup 精细）。

### 4.2 确保代码使用 ES 模块语法

- 使用 `import` / `export`，而不是 `require` / `module.exports`。
- 避免动态导入（除非必要），因为动态导入在编译时无法分析。

### 4.3 配置 `sideEffects`

在项目的 `package.json` 中声明：

```json
{
  "name": "my-project",
  "sideEffects": false   // 表示所有文件都没有副作用
}
```

如果某些文件有副作用（如 polyfill、全局样式），可以指定数组：

```json
{
  "sideEffects": ["./src/polyfill.js", "*.css"]
}
```

### 4.4 使用支持 Tree Shaking 的库

确保依赖的库也使用 ES 模块且标记了 `sideEffects`。Vue 3、React 17+、Lodash-es 等都是良好的例子。

### 4.5 避免编写有副作用的代码

```javascript
// ❌ 模块顶层执行副作用，可能阻止 Tree Shaking
console.log('module loaded')

// ✅ 将副作用放在函数内，仅在调用时执行
export function init() {
  console.log('module loaded')
}
```

## 5. Tree Shaking 的局限性

### 5.1 无法处理 CommonJS

CommonJS 模块是动态的（`require` 可以在运行时计算模块路径），构建工具很难静态分析哪些导出被使用了。因此，Tree Shaking 对 CommonJS 基本无效。

### 5.2 依赖的副作用

即使你的代码没有副作用，依赖的库如果未正确标记 `sideEffects`，也可能阻止 Tree Shaking。

### 5.3 动态导入的模块

虽然动态导入（`import()`）有助于代码分割，但会破坏 Tree Shaking 的静态分析能力。

### 5.4 部分模式难以分析

```javascript
// 通过变量访问导出，构建工具无法确定是否使用
const api = Math.random() > 0.5 ? 'methodA' : 'methodB'
import * as utils from './utils'
utils[api]()  // 无法静态分析
```

## 6. 验证 Tree Shaking 效果

### 6.1 使用 Webpack Bundle Analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

在 Webpack 配置中添加插件，生成可视化报告。

### 6.2 使用 Rollup 的 `@rollup/plugin-visualizer`

```bash
npm install --save-dev @rollup/plugin-visualizer
```

### 6.3 手动检查构建输出

查看构建后的 bundle，搜索未被使用的 API 名称，确认它们没有被包含。


## 7. 总结

| 要点                     | 说明                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| **核心依赖**             | ES 模块的静态结构 + `sideEffects` 配置                               |
| **Vue 3 支持程度**       | 所有响应式 API、生命周期、内置组件均支持 Tree Shaking                |
| **主要好处**             | 减少最终 bundle 体积，加快加载速度，提升性能                         |
| **常见问题**             | CommonJS 模块、未标记 sideEffects 的依赖、有副作用的模块顶层代码     |
| **最佳实践**             | 使用 ES 模块、配置 sideEffects、避免不必要的顶层副作用、使用分析工具 |

