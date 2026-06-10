# Vue 3 同构渲染

## 1. 什么是同构渲染？

**同构渲染（Isomorphic Rendering）** 是指同一套 Vue 组件代码既可以在**服务端（Node.js）** 运行并渲染为 HTML 字符串，又可以在**客户端（浏览器）** 运行并接管交互。它的核心理念是“一套代码，两端运行”。

同构渲染的完整生命周期分为两大阶段：

- **首次渲染（服务端 SSR）**：用户请求页面 → 服务端执行组件逻辑，生成完整 HTML → 浏览器收到 HTML，立即展示内容。
- **客户端激活（Hydration）**：浏览器加载 JS 文件 → Vue 在客户端“激活”已有的 DOM 节点，挂载事件监听和响应式绑定 → 后续交互和页面切换完全由客户端接管（SPA 模式）。

## 2. 同构渲染的优势

| 优势               | 说明                                                             |
| ------------------ | ---------------------------------------------------------------- |
| **SEO 友好**       | 服务端返回的 HTML 包含完整的页面内容，搜索引擎爬虫可以直接抓取。 |
| **首屏加载更快**   | 浏览器收到 HTML 后可以立即渲染内容，无需等待 JS 下载和执行。     |
| **更好的用户体验** | 用户看到完整页面结构的时间大幅缩短，尤其在弱网环境下优势明显。   |
| **代码复用**       | 同一套组件代码在服务端和客户端共享，减少重复开发。               |

## 3. 核心流程：首次渲染 + 客户端激活

### 3.1 服务端渲染阶段

服务端调用 `renderToString(App)` 后，Vue 会：

- 创建 `createSSRApp()` 实例。
- 执行组件的 `setup()` 和 `render()` 函数。
- 将组件树转换为 HTML 字符串。
- 返回完整的 HTML，包含 `<head>` 中的资源链接和 `<body>` 中的页面内容。

### 3.2 客户端激活阶段

客户端加载 JS 后调用 `app.mount('#app')`，Vue 进入 **Hydration** 模式：

- **复用已有 DOM**：不重新创建 DOM 节点，而是“接管”服务端渲染的 HTML 结构。
- **建立响应式绑定**：将组件实例与已有 DOM 关联，建立响应式系统。
- **挂载事件监听**：为已有的 DOM 元素绑定事件处理器（如 `@click`）。
- **激活完成后**：页面进入纯 CSR 模式，后续路由切换和交互完全由客户端处理。

### 3.3 完整流程图

![Logo](/img/createSSRApp.png)

## 5. 客户端激活原理详解

### 5.1 激活的核心：`hydrate` 与 `mount` 的区别

在客户端渲染中，`mount` 会创建全新的 DOM 节点。而在同构渲染中，使用 `hydrate` 替代 `mount`：

:::code-group

```typescript [hydration.ts]
export function hydrate(vnode, container) {
  // 1. 从容器中获取已有的 DOM 节点
  const el = container.firstChild
  // 2. 将 vnode.el 指向已有 DOM（而非创建新 DOM）
  vnode.el = el
  // 3. 递归处理子节点
  hydrateNode(el, vnode, container)
}
```

:::

### 5.2 vnode.el 的复用机制

在 SSR 中，服务端生成的 HTML 中没有 VNode 信息，只有纯 DOM。激活时，Vue 的 `patch` 流程会**跳过 DOM 创建步骤**，直接使用已有 DOM。这一机制在组件挂载函数中体现：

:::code-group

```typescript [renderer.ts]
const mountComponent = (initialVNode, container, ...) => {
  // 如果该组件已经从缓存中激活（KeepAlive 场景），复用实例
  if (initialVNode.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    // 激活缓存的组件
    ;(instance.ctx as KeepAliveContext).activate(vnode, container, anchor)
    return
  }

  // 创建新的组件实例
  const instance = (initialVNode.component = createComponentInstance(...))
  setupComponent(instance)
  setupRenderEffect(instance, initialVNode, container, anchor)
}
```

:::

首次激活时走“创建新组件实例”的分支，但由于 `vnode.el` 已经指向服务端渲染的 DOM，所以 `setupRenderEffect` 中的 `patch` 过程会“匹配”已有结构，而不是重新创建。

### 5.3 事件激活：`$setup` 与事件追踪

服务端不会处理事件绑定（如 `@click`），因此激活时需要进行**事件激活**。Vue 通过编译时的 `v-on` 转换和运行时的 `_track` 函数实现：

```typescript
// 编译后的代码示例
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _createElementVNode(
        'button',
        {
          onClick: $setup.handleClick, // 通过 $setup 访问事件处理函数
        },
        'Click Me',
      ),
    ])
  )
}
```

`$setup` 变量作为编译后的渲染函数参数，统一管理组件上下文中的事件处理函数，使得激活时的注册更加高效。

### 5.4 KeepAlive 组件的激活处理

当服务端渲染的 HTML 中包含 `<KeepAlive>` 包裹的组件时，客户端激活需要特殊处理：

```typescript
// 在 renderer.ts 中
if (initialVNode.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
  // 通过 KeepAlive 注入的 activate 函数处理
  ;(instance.ctx as KeepAliveContext).activate(vnode, container, anchor)
}
```

KeepAlive 组件在服务端没有缓存行为（每次请求都是新的），但在客户端激活时，需要正确建立缓存状态和激活钩子。

### 5.5 激活不匹配 (Hydration Mismatch) 的容错处理

当服务端渲染的 HTML 与客户端期望的 VNode 结构不一致时，会发生 hydration mismatch。Vue 3 对此有完善的容错机制：

- **类型不匹配**：如果服务端渲染的是 `<div>`，但客户端期望的是 `<span>`，Vue 会警告并替换整个节点。
- **属性不匹配**：如果 class、style 等不一致，Vue 会更新属性以匹配客户端期望。
- **文本内容不匹配**：文本差异会被 patch 更新。

在开发环境下，Vue 会输出详细的 hydration mismatch 警告，帮助开发者定位问题。

### 5.6 激活流程图

![Logo](/img/client.png)

## 6. 如何使用 Vue 3 同构渲染

### 6.1 最简示例：从零实现 SSR

以下是一个不依赖 Vite 的 Node.js 示例，展示 SSR 的核心流程：

**目录结构**：

```
ssr-demo/
├── server.js          # Node.js 服务端
├── client.js          # 客户端入口
├── App.vue            # 共享组件
└── package.json
```

**步骤一：创建共享组件**：

:::code-group

```vue [App.vue]
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Hello SSR!')
const count = ref(0)
</script>
```

:::

**步骤二：创建服务端入口**：

:::code-group

```javascript [server.js]
import express from 'express'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import App from './App.vue'

const app = express()

app.use(express.static('dist')) // 提供客户端 JS 文件

app.get('*', async (req, res) => {
  // 1. 创建 SSR 应用实例
  const vueApp = createSSRApp(App)
  // 2. 将组件渲染为 HTML 字符串
  const html = await renderToString(vueApp)
  // 3. 返回完整 HTML
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>SSR Demo</title></head>
    <body>
      <div id="app">${html}</div>
      <script src="/client.js"></script>
    </body>
    </html>
  `)
})

app.listen(3000)
```

:::

**步骤三：创建客户端入口**：

:::code-group

```javascript [client.js]
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
app.mount('#app')
```

:::

### 6.2 使用 Vite + vite-plugin-ssr 构建 SSR 应用

在生产环境中，推荐使用 Vite + 官方 SSR 支持来构建完整的同构渲染应用。以下是一个完整的 Vite SSR 项目结构：

**项目目录**：

```
vite-ssr-app/
├── src/
│   ├── App.vue            # 根组件
│   ├── main.js            # 客户端入口
│   ├── entry-server.js    # 服务端入口
│   └── router.js          # 共享路由
├── index.html             # HTML 模板
├── server.js              # Node.js 服务端
├── vite.config.js         # Vite 配置
└── package.json
```

:::code-group

```javascript [vite.config.js]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    ssr: 'src/entry-server.js', // 服务端构建入口
    outDir: 'dist',
    rollupOptions: {
      output: {
        format: 'esm', // 服务端使用 ESM 格式
      },
    },
  },
})
```

:::

### 6.3 路由配置（SSR + SPA）

在 SSR 应用中，路由需要在**服务端和客户端共享**，确保同一 URL 在两端渲染出相同的内容。通常在服务端使用 `createMemoryHistory`，在客户端使用 `createWebHistory`：

:::code-group

```javascript [router.js]
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'

export function createAppRouter(isServer) {
  return createRouter({
    history: isServer ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: '/', component: () => import('./pages/Home.vue') },
      { path: '/about', component: () => import('./pages/About.vue') },
    ],
  })
}
```

:::

### 6.4 状态管理（Pinia SSR 适配）

Pinia 在 SSR 场景下需要做状态序列化与注入，以下是核心适配模式：

- **服务端**：渲染完成后，将 pinia.state.value 通过 `JSON.stringify` 序列化，注入到 HTML 的 `<script>` 标签中。
- **客户端**：在创建 Pinia 实例后，通过 `pinia.state.value` 还原服务端传递的初始状态。

:::code-group

```javascript [server.js]
const pinia = createPinia()
const vueApp = createSSRApp(App)
vueApp.use(pinia)

const html = await renderToString(vueApp)
// 将 Pinia 状态序列化注入 HTML
const stateScript = `<script>window.__INITIAL_STATE__ = ${JSON.stringify(pinia.state.value)}</script>`
res.send(`
  <!DOCTYPE html>
  <html>
  <body>
    <div id="app">${html}</div>
    ${stateScript}
    <script src="/client.js"></script>
  </body>
  </html>
`)
```

```typescript [client.js]
const pinia = createPinia()
if (window.__INITIAL_STATE__) {
  pinia.state.value = window.__INITIAL_STATE__
}
const app = createSSRApp(App)
app.use(pinia)
app.mount('#app')
```

:::

### 6.5 开发与构建脚本

```json
{
  "scripts": {
    "dev": "node server.js", // 开发模式（需手动构建客户端）
    "build:client": "vite build --outDir dist/client", // 构建客户端
    "build:server": "vite build --ssr src/entry-server.js --outDir dist/server", // 构建服务端
    "build": "npm run build:client && npm run build:server", // 完整构建
    "start": "cross-env NODE_ENV=production node server.js"
  }
}
```

## 7. 同构渲染的注意事项与最佳实践

### 7.1 服务端环境差异

| 差异点                 | 说明                               | 解决方案                                                         |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| 没有 DOM API           | 服务端没有 `window`、`document` 等 | 使用 `import.meta.env.SSR` 判断环境，或在 `onMounted` 中访问 DOM |
| 没有浏览器事件         | 没有 `resize`、`scroll` 等事件     | 将事件监听放在 `onMounted` 中                                    |
| 每个请求都是新上下文   | 服务端为每个请求创建新的应用实例   | 使用工厂函数 `createApp()` 而非直接创建实例                      |
| 不能使用 `setInterval` | 服务端计时器会阻塞请求             | 避免在服务端使用计时器                                           |

### 7.2 避免状态污染

**绝对不要使用全局状态**。在服务端，多个请求共享同一个 Node.js 进程，如果使用全局变量存储状态，会导致**跨请求状态污染**：

```javascript
// ❌ 错误做法：全局状态会在多个请求间共享
const state = reactive({ count: 0 })

// ✅ 正确做法：每个请求创建新的应用实例
function createApp() {
  const state = reactive({ count: 0 })
  return createSSRApp({
    setup() {
      return { state }
    },
  })
}
```

### 7.3 Hydration Mismatch 的常见原因

| 原因                    | 示例                             | 解决方法                                        |
| ----------------------- | -------------------------------- | ----------------------------------------------- |
| 模板中使用随机值        | `<div>{{ Math.random() }}</div>` | 确保服务端和客户端渲染结果一致                  |
| 模板中使用 `Date.now()` | `<span>{{ Date.now() }}</span>`  | 使用 `onMounted` 中赋值                         |
| 条件渲染依赖浏览器特性  | `v-if="isMobile"`                | 使用 CSS 媒体查询替代，或使用 `ClientOnly` 包裹 |
| 异步数据未等待          | 服务端渲染时数据未加载完成       | 使用 `async setup` 或路由守卫等待数据           |

### 7.4 最佳实践

- **使用工厂函数创建应用实例**：确保每个请求有独立的应用上下文。
- **使用 `import.meta.env.SSR` 判断环境**：在需要访问浏览器 API 的地方进行环境判断。
- **使用 `<ClientOnly>` 组件**：对于纯客户端功能（如富文本编辑器），可以用 `<ClientOnly>` 包裹，使其只在客户端渲染。
- **预取数据**：在路由守卫或 `async setup` 中预取数据，确保服务端渲染时数据已就绪。
- **使用流式渲染（Streaming SSR）**：对于大型页面，使用 `renderToStream` 替代 `renderToString`，可以更早地向浏览器发送 HTML 内容。

## 8. 总结

| 对比维度   | CSR（客户端渲染）        | SSR（同构渲染）                 |
| ---------- | ------------------------ | ------------------------------- |
| SEO 友好度 | 差（内容由 JS 动态生成） | 好（HTML 直接包含完整内容）     |
| 首屏速度   | 慢（需下载 + 执行 JS）   | 快（直接渲染 HTML）             |
| 服务器负载 | 低（静态文件服务）       | 高（需执行 Vue 渲染）           |
| 开发复杂度 | 低                       | 中等（需处理服务端/客户端差异） |
| 交互体验   | 好（SPA 模式）           | 好（激活后转为 SPA）            |
| 适用场景   | 后台管理系统、工具类应用 | 内容型网站、电商、博客等        |
