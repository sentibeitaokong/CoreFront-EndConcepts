---
outline: [2, 3]
---

# Wujie 微前端方案

Wujie（无界）是一套基于 `Web Components + iframe` 的微前端方案。它利用 iframe 提供 JS 运行环境隔离，同时通过 Web Components 承载和隔离页面结构，在隔离能力与用户体验之间取得平衡。

## 1. 核心原理

Wujie 的关键设计是：

- iframe 负责提供独立的 `window` 和 JS 执行环境。
- Web Component 负责在主应用页面中承载子应用 DOM。
- 子应用资源可以保活，切换回来时恢复更快。
- 对原生 ESM 和 Vite 项目更友好。

```text
主应用页面
    ↓
Web Component 容器
    ↓
子应用 DOM 渲染区域
    ↓
iframe 内部执行 JS，代理 DOM 操作到容器
```

它不是传统 iframe 的简单嵌入，视觉上更接近无 iframe 的微前端集成。

## 2. 主应用接入

Vue 主应用通常使用 `wujie-vue3`：

```ts
import { createApp } from 'vue'
import WujieVue from 'wujie-vue3'
import App from './App.vue'

createApp(App).use(WujieVue).mount('#app')
```

页面中挂载子应用：

```vue
<template>
  <WujieVue
    width="100%"
    height="100%"
    name="order"
    url="http://localhost:7101/"
    :sync="true"
    :alive="true"
    :props="props"
  />
</template>

<script setup>
const props = {
  token: 'access-token',
  theme: 'light',
}
</script>
```

## 3. 子应用适配

多数情况下，Vite 子应用不需要像 qiankun 一样强制改成 UMD 输出。子应用只要能作为独立页面访问即可。

如果子应用需要感知运行环境，可以读取 Wujie 注入的上下文：

```ts
const isInWujie = Boolean(window.__POWERED_BY_WUJIE__)

if (isInWujie) {
  const props = window.$wujie?.props
  console.log(props?.token)
}
```

子应用仍然要做好卸载清理，尤其是全局事件、定时器、WebSocket 和未完成请求。

## 4. 通信机制

### 4.1 Props

主应用向子应用传递稳定上下文：

```vue
<WujieVue
  name="order"
  url="http://localhost:7101/"
  :props="{ user, permissions, theme }"
/>
```

子应用读取：

```ts
const { user, permissions, theme } = window.$wujie?.props || {}
```

### 4.2 Event Bus

低频事件可通过事件总线通信：

```ts
// 主应用
window.$wujie?.bus.$emit('theme-change', 'dark')

// 子应用
window.$wujie?.bus.$on('theme-change', theme => {
  updateTheme(theme)
})
```

事件要在卸载时解绑，避免保活场景下重复监听。

## 5. 路由同步

开启 `sync` 后，Wujie 可以把子应用路径同步到主应用 URL 中，方便刷新恢复和复制链接。

```vue
<WujieVue name="order" url="http://localhost:7101/" :sync="true" />
```

实际项目中仍建议为每个子应用分配稳定一级前缀，例如 `/order`、`/goods`，避免主应用和子应用路由规则互相覆盖。

## 6. 保活与预加载

Wujie 支持保活模式，适合后台系统的多标签页和高频切换场景。

```vue
<WujieVue name="order" url="http://localhost:7101/" :alive="true" />
```

保活能提升切换速度，但会保留内存、订阅和页面状态。对低频页面、大型报表或内存敏感页面不要无脑开启。

## 7. 优势与边界

| 维度       | 表现                                         |
| ---------- | -------------------------------------------- |
| Vite 兼容  | 对原生 ESM 更友好，改造成本低                |
| 隔离能力   | iframe 级 JS 隔离，强于纯 Proxy 沙箱         |
| 用户体验   | 比传统 iframe 更接近一体化页面               |
| 性能       | 支持预加载和保活，但 iframe 环境仍有内存成本 |
| 调试复杂度 | 跨上下文调试比普通 SPA 更复杂                |

## 8. 常见问题

| 问题               | 处理方式                                      |
| ------------------ | --------------------------------------------- |
| 弹窗层级不符合预期 | 统一弹窗容器，检查组件库 Portal/Teleport 配置 |
| 页面内存持续增长   | 检查保活策略和全局副作用清理                  |
| 子应用刷新丢状态   | 配置路由同步，关键状态放 URL 或后端           |
| 跨域资源加载失败   | 子应用服务配置 CORS 和正确资源路径            |

## 9. 适用场景

- 新旧系统混合，且新系统大量使用 Vite。
- 需要比 qiankun 更强的 JS 隔离。
- 后台系统多页签、高频切换，适合保活。
- 子应用希望保持独立开发、独立访问和低侵入接入。

## 10. 不适用场景

- 要求极低内存占用，且会同时挂载大量子应用。
- 需要非常透明的同上下文调试体验。
- 主子应用需要共享大量组件实例或运行时对象。

## 11. 落地建议

Wujie 更适合作为 Vite 时代的运行时隔离方案。选它时要重点设计保活策略、路由同步、弹窗挂载、事件解绑和资源缓存，避免把强隔离优势变成排查复杂度。
