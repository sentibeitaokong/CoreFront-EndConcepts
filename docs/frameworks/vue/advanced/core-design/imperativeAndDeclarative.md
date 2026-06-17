# 声明式编程与命令式编程

## 1. 概念概述

在 Vue 3 开发中，我们经常会接触到两种编程范式：**声明式编程** 和 **命令式编程**。

- **声明式编程**：关注“做什么”（What），描述最终想要的结果，不关心具体实现步骤。Vue 的模板语法和响应式系统就是典型的声明式风格。
- **命令式编程**：关注“如何做”（How），通过一步步的指令精确控制程序执行的每一个细节。原生 JavaScript 操作 DOM 就属于命令式风格。

## 2. 声明式vs命令式

| 维度         | 声明式编程                                        | 命令式编程                                                                   |
| ------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| **关注点**   | 结果（What）                                      | 步骤（How）                                                                  |
| **代码形式** | 描述状态与 UI 的映射关系，如模板、计算属性        | 逐条指令，如循环、条件判断、DOM 方法调用                                     |
| **数据流**   | 单向数据流 + 自动响应                             | 手动追踪状态变化，手动更新 UI                                                |
| **可维护性** | 高，逻辑集中，易于理解和修改                      | 低，随逻辑复杂而膨胀，容易出错                                               |
| **性能控制** | 低，框架负责优化，大多数场景足够好                | 高，可以极致优化，但容易出错                                                 |
| **适用场景** | UI 渲染、数据流管理、业务逻辑描述                 | 底层算法、性能关键路径、特殊交互                                             |
| **Vue 体现** | 模板、`ref`/`reactive`、`computed`、`watchEffect` | `ref` 的 `.value` 赋值、生命周期钩子中的 DOM 操作、`v-on` 回调中的命令式代码 |

Vue 选择声明式为主，是因为**它完美契合了 UI 开发的本质——状态驱动视图**。通过将开发者从繁琐的 DOM 操作中解放出来，Vue 让构建复杂的交互式应用变得简单、可靠且高效。同时，通过提供有限的命令式出口，保证了灵活性。这正是 Vue 成为主流前端框架的重要原因之一。

## 3. 为什么 Vue 内部封装命令式逻辑、对外暴露声明式接口？

Vue 是一个典型的声明式 UI 框架。它的核心设计是：**内部以命令式的方式高效管理 DOM 和状态变化，对外提供声明式的接口**。这种封装并非偶然，而是基于对开发者体验、应用性能、可维护性等多方面的深思熟虑。

### 3.1 关注点分离与开发效率

Vue 的核心目标之一是让开发者**专注于业务状态和 UI 之间的关系**，而不是“如何创建元素、添加事件、更新属性”。声明式模板（`{{ }}`、`v-bind`、`v-on`）天然表达了这种映射，开发者只需声明“数据应该显示在哪里”，Vue 自动处理 DOM 操作。这极大提升了开发效率和代码可维护性。

### 3.2 响应式系统自动管理依赖

Vue 的响应式系统（`ref`/`reactive`）与声明式范式完美配合。当状态变化时，Vue 能够自动追踪依赖并重新渲染相关的 UI 部分。如果使用命令式，开发者需要手动监听所有数据变化并更新 DOM——这不仅繁琐，还容易产生性能问题和遗漏。

### 3.3 虚拟 DOM + 高效更新策略

声明式渲染使得 Vue 可以在内部使用虚拟 DOM 和 diff 算法，以最小的代价将新状态映射到真实 DOM。开发者完全不需要关心 diff 和 patch 的细节，Vue 在幕后做了优化。如果采用命令式，开发者必须自行实现这些优化逻辑，几乎不可能做到比框架更好。

### 3.4 组件化与可组合性

声明式风格天然适合组件化：一个组件就是声明自己依赖的 props、响应式状态以及渲染结果。组件之间通过声明式接口通信，清晰且易于测试。命令式组件会变得复杂且难以复用。

### 3.5 减少副作用和 bug

命令式代码中，UI 更新散布在各种回调、生命周期和条件分支中，很容易出现状态与 UI 不同步的 bug。Vue 通过声明式绑定，使得 UI 始终是状态的“纯函数”映射（忽略副作用），大大降低了这类 bug 的发生率。

### 3.6 渐进式框架的定位

Vue 虽然主要采用声明式，但并未完全禁止命令式。在需要直接操作 DOM（如焦点管理、第三方库集成）时，提供了 `ref` 和生命周期钩子等命令式逃生舱。这体现了 Vue “渐进式”的哲学：优先推荐声明式，但在必要时允许命令式。

## 4. Vue 3 中的声明式编程

### 4.1 模板语法

通过声明式模板描述 UI 与状态的绑定关系：

```vue
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="count++">点击次数：{{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello Vue 3')
const count = ref(0)
</script>
```

- 你只需声明 `message` 和 `count` 与 DOM 的关联。
- 当 `count` 变化时，Vue 自动重新渲染按钮文本，无需手动操作 DOM。

### 4.2 响应式系统

`ref` 和 `reactive` 让数据变化自动触发视图更新：

```javascript
import { reactive, computed } from 'vue'

const state = reactive({ firstName: 'John', lastName: 'Doe' })
const fullName = computed(() => `${state.firstName} ${state.lastName}`)
```

- `computed` 声明了派生状态，依赖变化时自动重新计算。
- 你不需要写代码去监听 `firstName` 变化并手动更新 `fullName`。

### 4.3 `watchEffect` 自动收集依赖

```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
watchEffect(() => {
  console.log(`count is ${count.value}`)
})
```

- 你只需声明“副作用应该做什么”，Vue 自动追踪依赖，并在依赖变化时重新执行。

## 5. Vue 3 中的命令式编程场景

尽管 Vue 推荐声明式开发，但在某些场景下必须使用命令式代码。

### 5.1 模板引用（`ref`）操作原生 DOM

```vue
<template>
  <input ref="inputEl" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
const inputEl = ref(null)

onMounted(() => {
  // 命令式调用 DOM 方法
  inputEl.value.focus()
})
</script>
```

### 5.2 在侦听器中执行命令式操作

```javascript
import { ref, watch } from 'vue'

const searchQuery = ref('')
watch(searchQuery, async (newQuery, oldQuery) => {
  // 命令式发起网络请求
  const data = await fetch(`/api/search?q=${newQuery}`)
  // 手动更新其他响应式状态
  searchResults.value = data
})
```

### 5.3 手动渲染函数（`h`）

虽然 `h` 函数创建 VNode 属于声明式描述 UI，但调用过程仍具有命令式色彩：

```javascript
import { h, ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    // 命令式地返回渲染结果
    return () => h('button', { onClick: () => count.value++ }, count.value)
  },
}
```

### 5.4 手动停止副作用

```javascript
import { watchEffect } from 'vue'

const stop = watchEffect(() => {
  // 副作用逻辑
})
// 命令式地停止侦听
stop()
```

## 6. 实现计数器

### 6.1 命令式风格（原生 JS）

```javascript
let count = 0
const button = document.getElementById('counter')
const span = document.getElementById('value')

function render() {
  span.textContent = count
}
button.addEventListener('click', () => {
  count++
  render() // 手动调用渲染
})
render()
```

### 6.2 声明式风格（Vue 3）

```vue
<template>
  <div>
    <span>{{ count }}</span>
    <button @click="count++">+1</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

声明式版本消除了手动 DOM 操作和手动渲染调用，代码更简洁、不易出错。

## 7. 总结

- **Vue 3 本质是声明式框架**：通过模板、响应式数据、计算属性等机制，让开发者聚焦于“状态与 UI 的映射关系”，极大地提升了开发效率和可维护性。
- **命令式编程并未消失**：在需要直接操作 DOM、处理异步流程、手动控制副作用生命周期时，Vue 提供了必要的命令式 API（如模板引用、`watch` 回调、手动停止等）。
- **最佳实践**：优先使用声明式方式实现 UI 和状态逻辑；只有在必须突破声明式边界（如聚焦输入框、集成第三方库、性能优化等）时才使用命令式代码。
