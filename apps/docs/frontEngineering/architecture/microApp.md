---
outline: [2, 3]
---

# Micro-app 微前端方案

`Micro-app` 是基于 Web Components 的微前端框架，目标是降低子应用接入成本。它通过自定义元素承载子应用，并提供资源加载、沙箱、样式隔离、通信和预加载能力。

## 1. 核心定位

Micro-app 的使用方式接近一个普通组件：

```html
<micro-app name="order" url="http://localhost:7101/"></micro-app>
```

主应用不需要手写复杂生命周期调度，子应用也通常不需要暴露 `bootstrap`、`mount`、`unmount`。这让它适合希望快速把已有项目接入微前端体系的团队。

## 2. 主应用接入

```ts
import microApp from '@micro-zoe/micro-app'

microApp.start({
  iframe: false,
  'disable-sandbox': false,
})
```

Vue 页面中使用：

```vue
<template>
  <micro-app
    name="order"
    url="http://localhost:7101/"
    baseroute="/order"
    :data="microData"
  />
</template>

<script setup>
const microData = {
  token: 'access-token',
  theme: 'light',
}
</script>
```

## 3. 子应用适配

子应用最重要的是配置基础路由和资源路径，保证在主应用的路由前缀下可以正常运行。

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/'),
  routes,
})
```

Vite 子应用还要注意开发环境 CORS：

```ts
export default defineConfig({
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
```

## 4. 运行机制

Micro-app 大致做了这些事：

```text
注册自定义元素 micro-app
    ↓
根据 url 拉取子应用 HTML
    ↓
解析 JS 和 CSS 资源
    ↓
构造子应用运行环境
    ↓
把 DOM 挂载到 Web Component 容器
    ↓
路由切换时卸载或保活
```

它的优势是把复杂度封装在自定义元素里；代价是一些边界问题需要理解 Web Components、沙箱和样式隔离的交互。

## 5. 沙箱与样式隔离

| 能力        | 说明                               |
| ----------- | ---------------------------------- |
| JS 沙箱     | 拦截子应用对全局对象的访问和修改   |
| 样式隔离    | 对样式作用域做约束，降低跨应用污染 |
| iframe 沙箱 | 可选开启，更强隔离但成本更高       |
| 元素隔离    | 通过 Web Components 承载子应用 DOM |

对于复杂组件库，弹窗、Tooltip、Select 下拉层这类默认挂到 `body` 的浮层最容易突破隔离边界。建议统一配置挂载容器。

## 6. 通信方式

### 6.1 主应用下发数据

```html
<micro-app
  name="order"
  url="http://localhost:7101/"
  :data="{ user, permissions }"
></micro-app>
```

### 6.2 子应用获取数据

```ts
const data = window.microApp?.getData()

window.microApp?.addDataListener(data => {
  console.log('data changed', data)
})
```

### 6.3 子应用发送数据

```ts
window.microApp?.dispatch({
  type: 'ORDER_CREATED',
  payload: {
    id: '10001',
  },
})
```

通信仍应保持低频。业务数据不要在多个前端应用之间来回同步，优先交给后端接口和 URL 状态。

## 7. 生命周期事件

主应用可以监听子应用加载和卸载状态，用于骨架屏、错误兜底和埋点。

```html
<micro-app
  name="order"
  url="http://localhost:7101/"
  @created="onCreated"
  @mounted="onMounted"
  @unmount="onUnmount"
  @error="onError"
></micro-app>
```

## 8. 常见问题

| 问题                   | 处理方式                                    |
| ---------------------- | ------------------------------------------- |
| 子应用静态资源路径错误 | 检查 Vite `base` 或 Webpack `publicPath`    |
| 刷新后 404             | 主应用和子应用服务都要配置 history fallback |
| 样式污染               | 开启样式隔离，同时使用应用级 class 前缀     |
| 弹窗挂载异常           | 组件库 Portal/Teleport 指向子应用根容器     |
| 数据监听重复           | 子应用卸载时移除监听器                      |

## 9. 适用场景

- 希望以接近组件的方式快速嵌入子应用。
- 中小团队没有能力维护复杂微前端基建。
- 子应用改造空间有限，但可以调整路由和资源路径。
- 对 Vite 支持、样式隔离和低接入成本都有要求。

## 10. 不适用场景

- 需要非常成熟的大规模案例和长期社区沉淀。
- 对隔离安全性要求达到浏览器物理隔离级别。
- 对运行时机制可控性要求很高，希望自行管理生命周期。

## 11. 落地建议

Micro-app 的价值在“低接入成本”。但微前端真正的长期成本仍在规范：路由前缀、资源路径、通信协议、公共依赖、样式边界和卸载清理都要提前约定。
