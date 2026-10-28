---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 异步依赖边界管理器 (`<Suspense>`)

> [!IMPORTANT] 注意
> 截至目前，`<Suspense>` 仍是一项**实验性特性 (Experimental)**，其 API 在未来版本中可能会发生微调，但在生态中已被广泛使用。)\_

## 1. 核心概念

**`<Suspense>` 的降维打击：**
它是一个**用于处理组件树中深层异步依赖的“统筹司令部”**。
它能在组件树的高层级（比如页面最外层），统一捕获其内部**所有直系后代**的异步等待状态。只要里面还有任何一个子孙组件没准备好，`<Suspense>` 就会统一在顶层展示一套**后备 UI（Fallback，如全局骨架屏）**；等所有子孙全部搞定，它再瞬间切换出完整的真实 DOM 树。

## 2. 核心插槽 API 与触发条件

`<Suspense>` 本身不渲染任何额外的DOM节点，它仅仅是一个边界控制器，内部提供了两个固定的具名插槽。

[width(23,31,20,26)]

| 属性 / 插槽 / 事件 | 常用写法                          | 适用场景                   | 注意点                         |
| ------------------ | --------------------------------- | -------------------------- | ------------------------------ |
| `#default`         | `<template #default>`             | 放置异步组件树             | 必须提供                       |
| `#fallback`        | `<template #fallback>`            | 骨架屏、loading 占位       | 异步依赖未就绪时显示           |
| `@pending`         | `@pending="onPending"`            | 进入等待状态时埋点 / 切 UI | 每次等待都会触发               |
| `@resolve`         | `@resolve="onResolve"`            | 首次加载完成后的初始化     | 内层异步依赖全部完成后才触发   |
| `@fallback`        | `@fallback="onFallback"`          | 降级、错误提示             | 与 `#fallback` 的渲染时机对应  |
| `timeout`          | `:timeout="1000"`                 | 超时后仍显示 fallback      | 实验性 API，行为可能随版本调整 |
| `suspensible`      | 异步组件上设 `suspensible: false` | 让该组件自己管理 loading   | 会脱离最近 `<Suspense>` 的控制 |

[width(29,41,30)]

| 业务场景                 | 推荐写法                                             | 为什么                                |
| ------------------------ | ---------------------------------------------------- | ------------------------------------- |
| 路由级异步页面           | `<Suspense>` 包 `<router-view>` + `#fallback` 骨架屏 | 首屏统一等待，避免多个 loading 闪烁   |
| 局部 Widget 懒加载       | 只在 Widget 外包一层 `<Suspense>`                    | 控制粒度，失败不影响整页              |
| 多个异步组件统一 loading | 一个 `<Suspense>` 包住多个异步子组件                 | 等所有依赖完成后再一起显示            |
| 异步数据预取             | 子组件 `<script setup>` 顶层 `await`                 | 数据就绪前不渲染，避免空状态闪烁      |
| 加载失败兜底             | `onErrorCaptured` + `#fallback`                      | Suspense 本身不处理错误，需要错误边界 |

### 2.1 基础结构

```vue
<template>
  <!-- <Suspense> 能够统一协调它内部所有的异步任务 -->
  <Suspense>
    <!-- 1. 默认插槽 (必须写)：放置你真正想要渲染的复杂异步组件树 -->
    <template #default>
      <AsyncUserProfile />
      <AsyncDashboard />
    </template>

    <!-- 2. 后备插槽 (必须写)：在 default 插槽没准备好之前，展示这个占位符 -->
    <template #fallback>
      <div class="skeleton-screen">正在拼命加载整个面板，请稍候...</div>
    </template>
  </Suspense>
</template>
```

### 2.2 触发 `<Suspense>` 的两大异步条件

`<Suspense>` 会自动去寻找其 `default` 插槽内部的**异步依赖**。什么算异步依赖？

- **它是异步组件 (`defineAsyncComponent`)**：代码需要动态 `import` 才能下载。

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 异步组件本身就是 Suspense 的异步依赖
const UserProfile = defineAsyncComponent(() => import('./UserProfile.vue'))
</script>

<template>
  <Suspense>
    <UserProfile />
    <template #fallback>加载中...</template>
  </Suspense>
</template>
```

- **带有顶层 `await` 的 `<script setup>`**
  如果一个组件在 `<script setup>` 的最外层（不包裹在任何函数中）直接写了 `await fetch(...)`，这个组件就会**立刻被标记为一个“异步组件”**。

```vue
<script setup>
// 注意：这里没有把请求包在 onMounted 或者自定义函数里！
// 这种带有顶层 await 的写法，只有当它被父级的 <Suspense> 包裹时，才能被正确渲染！
const res = await fetch('https://api.example.com/user/1')
const user = await res.json()
</script>

<template>
  <div class="profile">
    <h1>{{ user.name }}</h1>
  </div>
</template>
```

## 3. 生命周期与嵌套机制

### 3.1 `<Suspense>` 专属钩子

由于`<Suspense>`在底层的状态切换非常复杂,Vue为它提供了几个专属事件钩子，方便你在特定时机处理逻辑：

```vue
<template>
  <Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
    <!-- ... -->
  </Suspense>
</template>
```

### 3.2 多层嵌套的冒泡机制

如果在巨大的应用中，出现了 `<Suspense>` 嵌套 `<Suspense>` 的情况怎么办？

- **默认向上冒泡**：如果内层的组件抛出了一个异步等待状态，它会被**离它最近**的那个上级 `<Suspense>` 拦截并处理（展示内层的 fallback）。如果外层的 `<Suspense>` 也有自己的直接异步子组件，大家各管各的。
- 这给了开发者极其细腻的控制权：你可以选择用最顶层的 App 包一个巨大的 Suspense 做全屏骨架屏，也可以在页面的局部 Widget 里包一个小 Suspense 做局部 loading。

### 3.3 错误处理、路由集成与渲染边界

- **`Suspense` 不捕获错误**：异步组件失败时用 `onErrorCaptured` 做错误边界，或给 `defineAsyncComponent` 配 `errorComponent`。

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue'

const error = ref(null)

// Suspense 本身不捕获错误，用错误边界兜底
onErrorCaptured(err => {
  error.value = err
  return false // 阻止错误继续向上冒泡
})
</script>

<template>
  <Suspense>
    <AsyncChart />
    <template #fallback>加载中...</template>
  </Suspense>

  <p v-if="error">加载失败：{{ error.message }}</p>
</template>
```

- **路由集成**：`<router-view v-slot="{ Component }"><Suspense><component :is="Component" /></Suspense></router-view>`。

```vue
<router-view v-slot="{ Component }">
  <Suspense>
    <component :is="Component" />
    <template #fallback>页面加载中...</template>
  </Suspense>
</router-view>
```

- **局部而非全局**:只在路由出口、布局或大Widget外包`Suspense`;每个小按钮都包会让整页fallback频繁闪烁。

```vue
<template>
  <!-- 推荐：在路由出口 / 布局层包一次 -->
  <Suspense>
    <RouterView />
    <template #fallback>加载中...</template>
  </Suspense>

  <!-- 避免：每个小按钮都各包一层，fallback 会频繁闪烁 -->
  <Suspense>
    <LikeButton />
  </Suspense>
</template>
```

- **`timeout`**：设为 `0` 可在切换时立即显示 fallback；设大一些可减少快速加载时的闪烁。

```vue
<!-- timeout 越小 fallback 出现越快；0 表示切换时立刻展示 -->
<Suspense :timeout="0">
  <component :is="Component" />
  <template #fallback>加载中...</template>
</Suspense>
```

- **SSR**：服务端渲染器会等待异步 `setup`，确保 `setup` 中没有浏览器专属 API。

```ts
import { onMounted } from 'vue'

// 服务端没有 window / document，需要 DOM 的逻辑放进 onMounted
onMounted(() => {
  window.addEventListener('resize', onResize)
})

// 也可以用 Vite 的 SSR 标记做分支判断
if (!import.meta.env.SSR) {
  // 仅在客户端执行的逻辑
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我的组件里写了 `await fetch` 报错：“`Top-level await is not available...`” 或者干脆白屏没反应？

这是使用顶层 `await` 的两大铁律：

- **构建环境支持**：顶层 `await` 是较新的 ES 规范，如果你的 Vite/Webpack 配置的 Target 过于古老，打包工具会无法识别并报错。
- **必须有 `<Suspense>`**：如果你在一个组件里写了顶层 `await`，那么**调用这个组件的地方（它的父级或祖先级），绝对、必须用 `<Suspense>` 把这个组件包裹起来！** 如果你忘了包，Vue 会不知道在等待请求的这段时间里页面该展示什么，从而直接报错中断渲染。

### 4.2 我已经用 `<Suspense>` 包裹了子组件，但里面的异步请求还是没等数据回来，页面就闪现了？

```vue
<!-- 错误写法：请求被包在生命周期里，这不会触发 Suspense 的挂起状态 -->
<script setup>
import { onMounted, ref } from 'vue'

const data = ref(null)
onMounted(async () => {
  data.value = await fetch('/api').then(r => r.json())
})
</script>

<!-- 正确写法：await 裸露在 <script setup> 最顶层，Suspense 会等待它结束 -->
<script setup>
const data = await fetch('/api').then(r => r.json())
</script>
```

### 4.3 `<Suspense>` 可以和 Vue Router 以及 `<KeepAlive>` 一起使用吗？顺序是什么？

**可以，而且这是构建企业级后台的“终极护城河写法”，但顺序极其严苛，写错一个标签就会导致整个应用崩溃。**

由于它们三个都是内置的特殊组件，并且都在试图控制组件的挂载与缓存，官方给出的**绝对标准嵌套顺序**如下：

```vue
<router-view v-slot="{ Component }">
  <!-- 1. 最外层：过渡动画 (如有需要) -->
  <transition name="fade" mode="out-in">
    <!-- 2. 第二层：缓存管理器 (如有需要) -->
    <keep-alive :include="['UserList']">
      <!-- 3. 第三层：异步边界控制器 -->
      <suspense>
        <!-- 主要内容 -->
        <template #default>
          <component :is="Component" />
        </template>
        <!-- 加载状态 -->
        <template #fallback>
          <div>全局路由切换 Loading...</div>
        </template>
      </suspense>
    </keep-alive>
  </transition>
</router-view>
```
