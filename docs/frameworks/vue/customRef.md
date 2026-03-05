---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **自定义 Ref (`customRef`)**

## 1. 核心概念与应用边界

**`customRef` (自定义 Ref)** 的诞生，赋予了开发者**直接篡改、拦截、推迟 Vue 底层依赖收集和更新触发机制的最高权限。**

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **异步更新延迟 (防抖/节流)** | 创建带有防抖功能的 `useDebouncedRef`，极大地简化高频输入框、滚动监听的状态管理。 |
| **异步数据获取拉取** | 创建一个 `ref`，当它被“第一次读取”时，才在底层悄悄发起一个极其耗时的 Ajax 请求去拉取数据。 |
| **强类型转换与过滤** | 拦截写入操作，在存入数据前强制进行复杂的格式化（如把用户输入的字符串强制按正则过滤掉特殊字符后再存入）。 |

## 2. 核心 API 实战：从解剖到重构

`customRef` 是一个极其底层的 API。它接收一个工厂函数，并**必须返回一个带有 `get()` 和 `set()` 方法的对象**。

```javascript
// customRef 的核心函数签名
import { customRef } from 'vue'

const myRef = customRef((track, trigger) => {
  return {
    get() {
      // 1. 在这里做你想做的拦截逻辑 (如发起请求)
      track() // 2. 🚨 必须调用！告诉 Vue："把我记入你的依赖名单里，以后有人改了请通知我"
      return 真实的值
    },
    set(newValue) {
      // 1. 在这里做你想做的拦截逻辑 (如延时、防抖、数据清洗)
      // 2. 将修改后的新值存起来
      trigger() // 3. 🚨 必须调用！告诉 Vue："我变了！快去刷新依赖我的所有视图！"
    }
  }
})
```

### 2.1 企业级实战：打造一个自带防抖的 Ref

这是一个面试常考的手撕代码题，也是各大组件库（如 VueUse）中最常用到底层特性。

**第一步：编写 `useDebouncedRef` 组合式函数**

```javascript
// src/composables/useDebouncedRef.js
import { customRef } from 'vue'

/**
 * 创建一个带有防抖功能的 ref
 * @param {*} initialValue 初始值
 * @param {number} delay 延迟毫秒数
 */
export function useDebouncedRef(initialValue, delay = 500) {
  let timeoutId = null // 用于保存定时器的闭包变量
  let value = initialValue // 保存真实的内部值

  return customRef((track, trigger) => {
    return {
      // 触发读取行为 (模板渲染时会调)
      get() {
        track() // 将当前正在渲染的组件记录为依赖
        return value // 返回真实值
      },
      // 触发修改行为 (用户在输入框打字时会调)
      set(newValue) {
        // 核心拦截：清空上一次还没来得及执行的定时器 (防抖的核心)
        clearTimeout(timeoutId)
        
        // 开启一个新的定时器
        timeoutId = setTimeout(() => {
          value = newValue // 真正修改内部的值
          
          // 🚨 最关键的一步：延迟时间到了，才大喊一声 "去更新视图！"
          trigger() 
        }, delay)
      }
    }
  })
}
```

**第二步：在组件中丝滑使用**

```vue
<script setup>
import { watch } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

// 只需要 1 行代码，这个 text 就拥有了 1000ms 的防抖灵魂！
const text = useDebouncedRef('Hello', 1000)

// 当 text 最终(延迟后)变化时，才触发极其消耗性能的网络请求
watch(text, (newVal) => {
  console.log('发起 Ajax 搜索请求：', newVal)
})
</script>

<template>
  <div class="search-box">
    <!-- 用户疯狂敲击键盘，页面不仅不会卡，而且 v-model 绑定的文字要等 1 秒后才会更新 -->
    <input v-model="text" placeholder="疯狂打字试试..." />
    <p>搜索词 (延迟同步): {{ text }}</p>
  </div>
</template>
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么我的 `customRef` 在页面上根本不更新，或者修改后报错了？
*   **答**：初学者最容易犯的错误：**忘记调用 `track()` 或 `trigger()`**。
    *   **没有 `track()`**：当模板初次渲染读取数据时，如果你在 `get()` 里没写 `track()`，Vue 的响应式系统压根不知道模板用了这个变量。之后就算你调了一万次 `trigger()`，页面也不会有任何反应。
    *   **没有 `trigger()`**：如果你在 `set()` 里赋值了，但没写 `trigger()`，数据在内存里确实变了，但 Vue 不知道，依然是一潭死水。
    *   **金科玉律**：`get()` 里面必须执行 `track()`，`set()` 里面必须在适当的时机执行 `trigger()`。两者缺一不可。

### 3.2 我能在 `get()` 里面调用 `trigger()` 或者在 `set()` 里面调用 `track()` 吗？
*   **答**：**绝对禁止！这会导致灾难性的死循环 (Maximum call stack size exceeded)。**
    *   如果你在 `get()` (读取时) 去触发更新 (`trigger`)，触发更新会导致页面重新渲染，重新渲染又会去读取数据 (`get`)，再次触发更新…… 瞬间把浏览器的调用栈撑爆。
    *   必须各司其职。

### 3.3 我写了一个处理数组的 `customRef`，为什么我调用 `arr.value.push()` 时，没有触发我写的延迟防抖效果？
*   **答**：这涉及到了 `ref` 底层劫持机制的边界问题。
    *   **原因剖析**：`customRef` 本质上和普通的 `ref` 一样，**它的拦截网只架设在 `.value` 这一层**。
    *   当你执行 `arr.value.push()` 时，你**并没有对 `.value` 本身进行重新赋值**（你没有写 `arr.value = newArray`），你只是修改了它内部的元素。因此，它根本不会触发你写在 `customRef` 里的 `set(newValue)` 拦截器！
    *   （更诡异的是，由于数组是个对象，普通 `ref` 在这种情况下会自动帮你把数组包一层深度的 `reactive`，所以 `push` 会更新页面。但你自己手写的 `customRef` 里面如果没有手动加上 `reactive` 包装，它连页面都不会更新。）
    *   **解决方案**：`customRef` **极其不适合用来处理需要深度监听内部属性变化的对象或数组**。它的最佳主战场是拦截并控制**基本数据类型**（如 `v-model` 绑定的字符串、数字）的整体赋值。

### 3.4 怎么写一个“只执行一次”的 lazy-load ref？
*   **答**：利用 `customRef` 的按需拦截特性。
    *   你可以在 `get()` 被第一次调用时，去 `fetch` 网络请求。拿到数据后再 `trigger()` 通知页面更新。这样只要这个变量没被用到，就永远不会发请求，节省极大带宽。
```javascript
export function useLazyFetch(url) {
  let value = null;
  let fetched = false;

  return customRef((track, trigger) => {
    return {
      get() {
        track(); // 先收集依赖
        if (!fetched) { // 如果是第一次读取
          fetched = true;
          fetch(url).then(res => res.json()).then(data => {
            value = data;
            trigger(); // 数据回来了，再去喊视图更新
          });
        }
        return value; // 第一次会返回 null，等请求完 trigger 后会重绘返回数据
      },
      set(newVal) {
        value = newVal;
        trigger();
      }
    };
  });
}
```