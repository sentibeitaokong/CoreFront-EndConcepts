---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 异步组件(Async Components)

## 1. 核心概念与应用场景

在大型单页应用 (SPA) 中，如果我们把所有的组件都在应用初始化时一股脑儿地打包进主 JavaScript 文件中，会导致首屏加载极其缓慢。

**异步组件 (Async Components)** 是 Vue 提供的一种强大的性能优化机制。它的核心理念是：**“按需加载，懒执行”**。只有当这个组件真正需要被渲染到页面上时，Vue 才会去服务器请求下载包含该组件代码的 JS 文件。

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **路由懒加载** | 最常见的场景。用户访问首页时，绝不需要下载“个人中心”页面的代码。配合 Vue Router 实现页面级别的切片。 |
| **重型/低频组件切片** | 比如一个包含了富文本编辑器、复杂 3D 模型、或巨型 ECharts 图表的弹窗组件。用户可能一辈子都不会点开那个弹窗，没必要让它拖慢首屏。 |
| **条件渲染组件** | 隐藏在 `v-if="false"` 后面的大型组件，或者针对不同用户权限动态展示的管理面板。 |

## 2. 核心 API 实战 (`defineAsyncComponent`)

在 Vue 3 中，我们必须使用官方提供的全局 API `defineAsyncComponent` 来显式地定义一个异步组件。

```js
import { defineAsyncComponent } from 'vue'

const AsyncComp = defineAsyncComponent(() => {
  return new Promise((resolve, reject) => {
    // ...从服务器获取组件
    resolve(/* 获取到的组件 */)
  })
})
// ... 像使用其他一般组件一样使用 `AsyncComp`
```

### 2.1 基础用法：极简懒加载

它接收一个返回 Promise 的工厂函数。结合 ES6 的动态 `import()` 语法，Webpack 或 Vite 会自动将该文件切分为一个独立的 Chunk (代码块)。

```vue
<script setup>
import { defineAsyncComponent, ref } from 'vue'

// 1. 定义异步组件
const AsyncHeavyChart = defineAsyncComponent(() => 
  import('./components/HeavyChart.vue')
)

const showChart = ref(false)
</script>

<template>
  <button @click="showChart = true">加载图表</button>
  
  <!-- 2. 只有当 showChart 变为 true 时，浏览器才会发起网络请求去下载 HeavyChart.vue 的代码 -->
  <AsyncHeavyChart v-if="showChart" />
</template>
```

**全局注册**
```js
app.component('MyComponent', defineAsyncComponent(() =>
  import('./components/MyComponent.vue')
))
```

### 2.2 高阶用法：优雅地处理加载状态与错误

网络请求是不稳定的。组件在下载的过程中，用户可能会看到白屏；如果网络断开，组件可能下载失败。`defineAsyncComponent` 提供了一个对象配置项，用于优雅地处理这些边缘情况。

```js
import { defineAsyncComponent } from 'vue'
import LoadingComponent from './Loading.vue'
import ErrorComponent from './Error.vue'

const AsyncModal = defineAsyncComponent({
  // 1. 核心加载器函数
  loader: () => import('./components/ComplexModal.vue'),

  // 2. 加载异步组件时展示的占位组件 (如 Loading 动画)
  loadingComponent: LoadingComponent,
  
  // 3. 延迟展示 loading 的时间。避免如果网络极快，loading 一闪而过导致视觉闪烁。默认 200ms
  delay: 200,

  // 4. 加载失败时展示的错误组件 (如断网或代码内部抛错)
  errorComponent: ErrorComponent,
  
  // 5. 超时时间。如果过了 3000ms 还没加载完，直接展示错误组件。默认值：Infinity
  timeout: 3000,

  // 6. 进阶：失败重试机制（拦截错误并自行决定是否重试）
  onError(error, retry, fail, attempts) {
    if (error.message.match(/fetch/) && attempts <= 3) {
      // 遇到网络请求错误，且重试次数小于 3 次，则在 1秒后重试
      setTimeout(() => {
        retry()
      }, 1000)
    } else {
      // 否则彻底宣布失败，渲染 errorComponent
      fail()
    }
  }
})
```

### 2.3 惰性激活(**`Vue 3.5+`**)

在 `Vue 3.5+` 中，异步组件可以通过提供激活策略来控制何时进行激活。

**在空闲时进行激活**

通过 `requestIdleCallback` 进行激活：

```js
import { defineAsyncComponent, hydrateOnIdle } from 'vue'

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Comp.vue'),
  hydrate: hydrateOnIdle(/* 传递可选的最大超时 */)
})
```

**在可见时激活**

通过 `IntersectionObserver` 在元素变为可见时进行激活。

```js
import { defineAsyncComponent, hydrateOnVisible } from 'vue'

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Comp.vue'),
  hydrate: hydrateOnVisible()
})
```

可以选择传递一个侦听器的选项对象值：

```js
hydrateOnVisible({ rootMargin: '100px' })
```

**在媒体查询匹配时进行激活**

当指定的媒体查询匹配时进行激活。

```js
import { defineAsyncComponent, hydrateOnMediaQuery } from 'vue'

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Comp.vue'),
  hydrate: hydrateOnMediaQuery('(max-width:500px)')
})
```

**交互时激活**

当组件元素上触发指定事件时进行激活。完成激活后，触发激活的事件也将被重放

```js
import { defineAsyncComponent, hydrateOnInteraction } from 'vue'

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Comp.vue'),
  hydrate: hydrateOnInteraction('click')
})
```

也可以是多个事件类型的列表：

```js
hydrateOnInteraction(['wheel', 'mouseover'])
```

**自定义策略**

```ts
import { defineAsyncComponent, type HydrationStrategy } from 'vue'

const myStrategy: HydrationStrategy = (hydrate, forEachElement) => {
  // forEachElement 是一个遍历组件未激活的 DOM 中所有根元素的辅助函数，
  // 因为根元素可能是一个片段而非单个元素
  forEachElement(el => {
    // ...
  })
  // 准备好时调用 `hydrate`
  hydrate()
  return () => {
    // 如必要，返回一个销毁函数
  }
}

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Comp.vue'),
  hydrate: myStrategy
})
```

## 3. 结合 `<Suspense>` 的现代化处理方案

除了使用对象配置，Vue 3 还提供了一个受到 React 启发的内置组件 `<Suspense>`。它能在组件树的更高层级统一协调和编排多个异步组件（或异步依赖）的加载状态。

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncAdminDashboard = defineAsyncComponent(() => import('./AdminDashboard.vue'))
const AsyncChart = defineAsyncComponent(() => import('./Chart.vue'))
</script>

<template>
  <!-- Suspense 必须包含两个插槽：#default 和 #fallback -->
  <Suspense>
    <!-- 默认插槽：放置你的异步组件 -->
    <template #default>
      <div>
        <AsyncAdminDashboard />
        <AsyncChart />
      </div>
    </template>
    
    <!-- 后备插槽：在上面所有的异步组件代码完全下载完之前，展示这个插槽的内容 -->
    <template #fallback>
      <div class="skeleton-loading">
        正在拼命加载整个面板代码...
      </div>
    </template>
  </Suspense>
</template>
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 Vue 2 和 Vue 3 的异步组件写法有什么区别？
*   **答**：差异很大，迁移时极易报错。
    *   **Vue 2 写法**：直接返回一个 `import()` 的工厂函数即可。
        ```js
        const AsyncComponent = () => import('./MyComponent.vue')
        ```
    *   **Vue 3 的改变**：Vue 3 内部处理普通函数和异步组件的逻辑发生了分歧。必须使用 **`defineAsyncComponent`** 包裹，否则 Vue 3 会把这个工厂函数当成一个普通的 setup 渲染函数，从而在控制台报出无法解析组件的警告。

### 4.2 为什么我的异步组件在构建打包后，文件根本没有被分割（Code Splitting 失败）？
*   **答**：通常是因为不小心混用了“同步引入”和“异步引入”。
    *   **致命错误**：如果你在代码的某个地方写了 `import HeavyChart from './HeavyChart.vue'` (静态同步引入)，同时又在另一个地方用 `defineAsyncComponent` 异步引入了它。
    *   **结果**：构建工具（Webpack/Vite）的静态分析器只要发现哪怕只有一次静态引入，就会认定它是首屏必须的强依赖，从而把它强行打包进主 `bundle.js` 中，你的懒加载就彻底失效了。
    *   **排查方案**：全局搜索该组件名，确保它在整个项目中**只被动态 `import()` 调用**。

### 4.3 在 Vue Router 中，还需要使用 `defineAsyncComponent` 吗？
*   **答**：**强烈建议不要用！**
    *   Vue Router 本身在底层已经完美集成了对动态 `import()` 的支持。
    *   在配置路由表时，你**只需要直接写返回 `import` 的工厂函数即可**，Router 会自己处理懒加载的调度。如果你画蛇添足地加上 `defineAsyncComponent`，反而可能会导致路由钩子（如 `beforeEnter`）行为异常。
    ```js
    // ✅ 正确的路由懒加载写法 (不需要 defineAsyncComponent)
    const routes = [
      {
        path: '/admin',
        component: () => import('./views/Admin.vue')
      }
    ]
    ```

### 4.4 把一个组件改成了异步组件，会导致它内部的生命周期发生变化吗？
*   **答**：内部生命周期的**执行顺序**没有变化，但**触发的时机被推迟了**。
    *   只有当浏览器通过网络下载完了该组件的 JS 文件，并且 Vue 完成了解析后，该组件才会开始执行 `setup` 和 `onMounted`。
    *   如果你在父组件的 `onMounted` 中试图通过 `ref` 获取这个异步子组件的实例或 DOM 节点，你极有可能拿到 `null`，因为它还没下载完！必须等待子组件自己触发特定的 `@loaded` 事件，或者结合 `<Suspense>` 的解析完成钩子来安全获取。
