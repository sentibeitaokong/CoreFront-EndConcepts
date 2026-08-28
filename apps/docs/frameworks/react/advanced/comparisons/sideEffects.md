# 副作用时序与清理机制

副作用（Side Effects）是前端框架连接“**状态驱动 UI**”与“**外部世界**”的桥梁——无论是操作 DOM、发起网络请求、订阅外部数据源，还是操作计时器。然而，副作用在组件生命周期中的**执行时机**直接决定了应用的性能、一致性和用户体验。React 和 Vue 3 分别基于各自的渲染机制，设计了不同的副作用调度模型。

## 1. React 的副作用时序模型

React 将渲染过程严格划分为**Render 阶段（可中断、可重试）** 和 **Commit 阶段（不可中断、同步执行）**。副作用（Effect）的执行完全锚定在 Commit 阶段的不同子阶段，从而提供了精确的控制。

### 1.1 渲染流水线概览

```markdown
触发更新（setState/useReducer/context 变化）
↓
Render 阶段（beginWork → completeWork）

- 构建/更新 Fiber 树
- 纯计算，无 DOM 操作，可被更高优先级中断
- 标记副作用 flags（Placement、Update、Deletion、Passive 等）
  ↓
  Commit 阶段（同步执行，不可中断）
  ├── 1. Before Mutation：执行 getSnapshotBeforeUpdate（类组件）
  ├── 2. Mutation：应用 DOM 变更（增删改）
  │ └── 执行 useInsertionEffect 的 setup（仅限此阶段）
  ├── 3. Layout：执行 useLayoutEffect 的 setup（同步阻塞）
  ↓
  浏览器绘制（Paint）
  ↓
  调度执行 useEffect 的 setup（异步，不阻塞绘制）
```

### 1.2 Effect解析

| Effect 类型          | 执行时机                                  | 典型用途                                                    | 注意事项                                                                  |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useInsertionEffect` | Mutation 阶段完成、Layout 之前            | CSS-in-JS 动态插入样式（如 `styled-components`、`emotion`） | 极少数场景使用，通常应使用 `useLayoutEffect` 或 `useEffect`               |
| `useLayoutEffect`    | Layout 子阶段，**同步阻塞**在浏览器绘制前 | 测量 DOM 尺寸、同步修改 DOM（如滚动到某位置）、避免闪烁     | 会阻塞页面绘制，避免执行耗时操作；服务端渲染需跳过（用 `useEffect` 替代） |
| `useEffect`          | 浏览器绘制**完成之后异步执行**            | 数据获取、订阅外部事件、操作非 DOM 的第三方库               | 默认在每轮渲染后异步执行，依赖数组控制执行频率                            |

### 1.3 清理机制

React 的 `useEffect`、`useLayoutEffect`、`useInsertionEffect` 都通过 **Effect 回调返回一个 cleanup 函数** 来注册清理：

- **首次挂载**：只执行 setup，不执行 cleanup。
- **更新时**：先执行上一次的 cleanup，再执行新的 setup。
- **卸载时**：只执行 cleanup，不再执行 setup。
- **执行窗口与 Effect 类型一致**：`useEffect` 的 cleanup 在浏览器绘制后异步执行；`useLayoutEffect` 的 cleanup 在 DOM 变更后、绘制前同步执行。

```jsx
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(timer) // 下一次 setup 前 / 卸载时执行
}, [])
```

## 2. Vue 3 的副作用时序模型

Vue 3 的响应式系统基于 `ReactiveEffect` 和调度器（Scheduler）。组件自身的渲染也是一个 Effect，而 `watch`/`watchEffect` 则是独立于渲染流程的副作用，其执行时机通过 `flush` 选项控制。

### 2.1 组件更新流水线

```markdown
响应式数据变化（如 count.value++）
↓
触发组件更新的 Effect（scheduler 将更新任务入队）
↓
（微任务队列）flush 队列处理开始
├── 1. flush: 'pre' 队列（默认）
│ - 执行所有 `watch`（默认 flush: 'pre'）的回调
│ - 执行 `watchEffect`（默认）的回调
│ - 此时 DOM 尚未更新，可访问旧 DOM，但不应修改数据（避免循环）
├── 2. 组件渲染：执行 render 函数 → 生成新的 VNode 树 → patch（更新 DOM）
├── 3. flush: 'post' 队列
│ - 执行 flush: 'post' 的 `watch` 回调
│ - 执行 `onUpdated` 钩子（所有子组件更新后）
│ - 此时 DOM 已更新，可安全访问新 DOM
↓
浏览器绘制
```

### 2.2 `flush` 选项详解

| `flush` 值      | 执行时机                                                   | 典型用途                                                 | 注意事项                                            |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `'pre'`（默认） | 组件更新**之前**，即 DOM 更新前                            | 在数据变化后、DOM 更新前执行逻辑（如取消请求、记录旧值） | 在此回调中修改数据可能触发无限循环（需小心）        |
| `'post'`        | 组件更新**之后**，DOM 已更新，但在浏览器绘制前（同微任务） | 访问/操作已更新的 DOM（类似 `onUpdated`）                | 与 `onUpdated` 相比，`watch` 可更精确地监听特定数据 |
| `'sync'`        | 数据变化后**立即同步**执行（在当前宏任务中）               | 需要立即响应数据变化，不等待批处理或渲染                 | 性能开销大，可能导致频繁执行，仅用于极少数场景      |

Vue 3 没有直接等价于 `useLayoutEffect` 的 API，因为渲染流程是同步的（数据变化 → 组件 Effect 重新执行 → patch DOM），且 DOM 更新发生在当前微任务完成之前。若需要在 DOM 更新后、浏览器绘制前**同步读取布局**，通常使用：

- `onUpdated` 钩子
- `watch` 配合 `flush: 'post'` + `nextTick`（确保 DOM 已应用）

```vue
<script setup>
import { ref, watch, onUpdated, nextTick } from 'vue'

const count = ref(0)
const el = ref(null)

watch(
  count,
  newVal => {
    // flush: 'pre'（默认） → DOM 尚未更新，el.value 仍为旧 DOM
    console.log('pre flush:', el.value.textContent)
  },
  { flush: 'pre' },
)

watch(
  count,
  async newVal => {
    // flush: 'post' → DOM 已更新，但尚未绘制
    await nextTick() // 确保所有 DOM 更新已应用
    console.log('post flush:', el.value.textContent)
  },
  { flush: 'post' },
)

onUpdated(() => {
  // DOM 更新后执行，等价于 flush: 'post'
  console.log('onUpdated:', el.value.textContent)
})
</script>

<template>
  <div ref="el">{{ count }}</div>
  <button @click="count++">Increment</button>
</template>
```

### 2.3 清理机制

Vue 的 `watch` 和 `watchEffect` 也支持清理回调：

- **`watch`**：通过回调函数的第三个参数 `onCleanup` 注册清理。
- **`watchEffect`**：通过 `onCleanup` 注册，在下次 effect 执行前或组件卸载时调用。

```javascript
watchEffect(onCleanup => {
  const timer = setInterval(() => console.log('tick'), 1000)
  onCleanup(() => clearInterval(timer))
})
```

## 3. 核心差异对比

| 维度                   | React                                                          | Vue 3                                                                             |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **副作用载体**         | `useEffect`、`useLayoutEffect`、`useInsertionEffect`           | `watch`、`watchEffect`、`onUpdated` 等生命周期钩子                                |
| **执行时机的控制方式** | 通过选择不同的 Effect 类型（`useEffect` vs `useLayoutEffect`） | 通过 `flush` 选项（`'pre'` / `'post'` / `'sync'`）                                |
| **清理函数**           | Effect 返回 cleanup 函数                                       | 通过 `onCleanup` 注册（watch/watchEffect）                                        |
| **阻塞绘制**           | `useLayoutEffect` 同步阻塞                                     | 无直接等价，但 `flush: 'sync'` 会阻塞当前宏任务（但那是同步执行，不涉及绘制时机） |
| **依赖管理**           | 显式传入依赖数组（或依赖变化检测）                             | 自动追踪响应式依赖（watchEffect）或显式指定源（watch）                            |
| **严格模式**           | 开发环境额外执行 setup+cleanup 循环                            | 无类似机制，但存在提示（如 `watch` 重复执行）                                     |

- **React** 通过“**Effect 类型 + Commit 阶段划分**”提供强时序保障，尤其适合需要精确控制绘制前后行为的复杂场景，代价是开发者需要理解不同 Effect 的区别。
- **Vue 3** 通过“**flush 队列 + 微任务调度**”提供足够的灵活性，将副作用纳入统一的响应式任务调度系统，学习曲线更平缓，且自动依赖追踪减少了手动管理负担。
