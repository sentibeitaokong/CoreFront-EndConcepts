---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 组合式函数(Composables)

## 1. 核心概念与演进史

在前端开发中，“组件化”解决了 **UI（视图+基础逻辑）的复用**，但一直以来，**纯状态逻辑的复用** 都是一个巨大的痛点。

想象一个场景：你需要获取用户的鼠标坐标（x, y），并在窗口大小改变时监听重置。这个纯逻辑可能在首页、详情页、画板页中都会用到。我们该如何优雅地把它抽离出来？

| 逻辑复用方案 | 时代与背景 | 核心痛点 |
| :--- | :--- | :--- |
| **Mixins (混入)** | Vue 2 时代的标配。将多个组件的 `data/methods/生命周期` 提取到一个 JS 对象中混合。 | 1. **命名冲突**（两个 Mixin 有同名变量会互相覆盖）。<br>2. **来源不明**（模板里的一个变量，你根本不知道是从哪个 Mixin 里飞进来的）。 |
| **Renderless Components / HOC** | 借用 React 社区的概念，通过没有 UI 的高阶组件传递数据。 | 会生成大量无意义的组件实例，导致组件树极度深层嵌套（Wrapper Hell），性能损耗大。 |
| **Composables (组合式函数)** | **Vue 3 的破局之作**。借助 Composition API，将逻辑封装为普通的 JS 函数返回 `ref`。 | **终极解法**。解决了命名冲突、数据来源绝对清晰、天然支持 TypeScript，且无任何额外的组件实例开销。 |

> **业界约定：** 为了与普通的 JS 工具函数区分，组合式函数通常以 **`use`** 开头命名，例如 `useMouse`, `useFetch`, `usePagination`。

## 2. 核心架构与实战范例

一个优秀的 Composable 函数，必须是一个**独立闭环的逻辑体**。它应该自己管理状态（ref/reactive），自己绑定和卸载生命周期。

### 2.1 基础范例：追踪鼠标位置 (useMouse)

```js
// src/composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  // 1. 内部管理的状态
  const x = ref(0)
  const y = ref(0)

  // 2. 核心业务逻辑
  const update = (event) => {
    x.value = event.pageX
    y.value = event.pageY
  }

  // 3. 将副作用与 Vue 生命周期绑定
  onMounted(() => {
    window.addEventListener('mousemove', update)
  })
  
  // 🚨 极其重要：在卸载时物理清理！防内存泄漏
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  // 4. 返回状态 (强烈推荐返回包含 ref 的对象，方便外部解构)
  return { x, y }
}
```

在任何组件中使用它：

```vue
<!-- MyComponent.vue -->
<script setup>
// 数据来源清晰可见，不会有命名冲突的担忧 (可以起别名)
import { useMouse } from '@/composables/useMouse'

const { x, y } = useMouse()
// 如果有冲突，可以随意重命名：const { x: mouseX, y: mouseY } = useMouse()
</script>

<template>
  <p>鼠标位置: X: {{ x }}, Y: {{ y }}</p>
</template>
```

### 2.2 进阶范例：接收响应式参数与 `unref` 处理 (useFetch)

真正的业务级 Composable 需要接收外部传来的参数，并且这个参数可能是写死的字符串，也可能是动态响应式的 `ref`。

```js
// src/composables/useFetch.js
import { ref, isRef, unref, watchEffect } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const isFetching = ref(true)

  const fetchData = () => {
    data.value = null
    error.value = null
    isFetching.value = true

    // 🌟 核心技巧：使用 unref 扒掉可能存在的 ref 外衣
    // 无论外部传的是 '/api' 还是 ref('/api')，这里都能安全拿到字符串
    const urlValue = unref(url)

    fetch(urlValue)
      .then(res => res.json())
      .then(json => (data.value = json))
      .catch(err => (error.value = err))
      .finally(() => (isFetching.value = false))
  }

  // 🌟 核心技巧：如果传入的是 ref，一旦 URL 改变，自动重新请求
  if (isRef(url)) {
    // 也可以使用 watch(url, fetchData)
    watchEffect(fetchData) 
  } else {
    // 如果传入的是死字符串，只请求一次即可
    fetchData()
  }

  return { data, error, isFetching }
}
```

使用示例：
```vue
<script setup>
import { ref } from 'vue'
import { useFetch } from './useFetch'

const userId = ref(1)
// 传入 computed 也是一种 ref。当 userId 改变时，API 会自动重新触发。
const { data, isFetching } = useFetch(computed(() => `/api/user/${userId.value}`))
</script>
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么官方强烈建议 Composable 返回带有 `ref` 的对象，而不是返回 `reactive` 对象？
*   **答**：这是为了**保证结构赋值时的响应式安全**。
    *   **如果返回 `reactive`**：`return reactive({ x, y })`。当调用者执行解构 `const { x, y } = useMouse()` 时，`x` 和 `y` 会瞬间变成普通的值传递，彻底断开 Proxy 拦截，**永久失去响应式**。
    *   **如果返回 `{ refX, refY }`**：由于里面包装的都是 `ref`，调用者执行 `const { x, y } = useMouse()` 解构后，拿到的 `x` 和 `y` 依然是独立的 `ref` 盒子，完美保持响应式。
    *   如果你非要返回 reactive 也可以，但调用者必须老老实实写 `const mouse = useMouse(); console.log(mouse.x)`，这显然不符合大家爱用解构的习惯。

### 3.2 组合式函数 (Composables) 和普通的 JS 工具函数 (Utils) 到底有什么区别？
*   **答**：这是一个面试高频考点。
    *   **Utils (工具函数)**：通常是**无状态**的纯函数。比如 `formatDate(date)`、`deepClone(obj)`。给它一个输入，立刻得到一个输出，和 Vue 的响应式系统、生命周期没有任何关系。
    *   **Composables (组合式函数)**：是**有状态 (Stateful)** 且紧密**耦合 Vue 核心机制**的。它的内部一定会用到 Vue 的 API（如 `ref`, `watch`, `onMounted` 等）。它主要用于封装带有副作用的响应式状态逻辑。

### 3.3 我把定时器写在了 Composable 里，复用这个 Composable 的多个组件同时渲染，会导致定时器疯狂翻倍吗？
*   **答**：**绝对不会。这是 Composable 最伟大的物理特性。**
    *   每一次在不同的组件中调用 `useTimer()` 时，实际上都是在内存中执行了一遍那个闭包函数，生成了一套**全新的、相互独立的内部变量（ref）和全新的钩子注册**。
    *   组件 A 里调用的 `useTimer` 有它自己的定时器 ID 和数据，组件 B 的 `useTimer` 是另一个独立的宇宙。它们互不干扰，组件被销毁时也会各自触发自己的 `onUnmounted`。

### 3.4 为什么有时我的 Composable 在生命周期钩子里获取不到正确的 DOM 或触发了奇怪的报错？
*   **答**：**警惕异步调用陷阱。**
    *   **原则**：你必须在组件的 `setup()` 的**顶层**同步地调用 Composable 函数！
    *   **错误示范**：
        ```js
        setTimeout(() => {
          // ❌ 灾难：在异步回调里调用 Composable
          // 此时 setup 的同步执行期早过了，当前激活的 Vue 组件实例已经丢失（currentInstance 为空）
          // 内部的 onMounted 等生命周期钩子将完全失效，甚至直接报错。
          const { data } = useFetch('/api') 
        }, 1000)
        ```
    *   **正确规范**：组合式函数必须在顶级作用域立即执行，确保 Vue 能正确捕获当前的组件上下文 (Context) 来注册生命周期。
