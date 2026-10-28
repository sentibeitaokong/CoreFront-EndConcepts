---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# **自定义 Ref (`customRef`)**

## 1. 核心概念与应用边界

**`customRef` (自定义 Ref)** 的诞生，赋予了开发者**直接篡改、拦截、推迟 Vue 底层依赖收集和更新触发机制的最高权限。**

[width(28,72)]

| 典型应用场景                 | 详细说明                                                                                                 |
| :--------------------------- | :------------------------------------------------------------------------------------------------------- |
| **异步更新延迟 (防抖/节流)** | 创建带有防抖功能的 `useDebouncedRef`，极大地简化高频输入框、滚动监听的状态管理。                         |
| **异步数据获取拉取**         | 创建一个 `ref`，当它被“**第一次读取**”时，才在底层悄悄发起一个极其耗时的 Ajax 请求去拉取数据。           |
| **强类型转换与过滤**         | 拦截写入操作，在存入数据前强制进行复杂的格式化（如把用户输入的字符串强制按正则过滤掉特殊字符后再存入）。 |

## 2. 核心 API 实战：从解剖到重构

`customRef`是一个极其底层的API。它接收一个工厂函数，并**必须返回一个带有`get()`和`set()`方法的对象**。

```js
// customRef 的核心函数签名
import { customRef } from 'vue'

const myRef = customRef((track, trigger) => {
  return {
    get() {
      // 1. 在这里做你想做的拦截逻辑 (如发起请求)
      track() // 2. 必须调用！告诉 Vue："把我记入你的依赖名单里，以后有人改了请通知我"
      return 真实的值
    },
    set(newValue) {
      // 1. 在这里做你想做的拦截逻辑 (如延时、防抖、数据清洗)
      // 2. 将修改后的新值存起来
      trigger() // 3. 必须调用！告诉 Vue："我变了！快去刷新依赖我的所有视图！"
    },
  }
})
```

[width(21,24,23,32)]

| 属性 / 选项          | 常用取值                             | 适用场景                 | 注意点                          |
| -------------------- | ------------------------------------ | ------------------------ | ------------------------------- |
| `customRef(factory)` | `(track, trigger) => ({ get, set })` | 需要拦截读写行为的 ref   | 工厂函数必须返回 `get` / `set`  |
| `track()`            | 无参数                               | `get()` 中声明依赖       | 漏调用则视图不会响应更新        |
| `trigger()`          | 无参数                               | `set()` 中通知视图更新   | 只应在值真正变化后调用          |
| `get()`              | 返回内部值                           | 读取时做懒加载、只读派生 | 不要在这里调用 `trigger()`      |
| `set(newValue)`      | 写入的新值                           | 防抖、节流、校验、格式化 | 对象/数组内部变更不会触发 `set` |

### 2.1 企业级实战：打造一个自带防抖的 Ref

:::code-group

```js [src/composables/useDebouncedRef.js]
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

          // 最关键的一步：延迟时间到了，才大喊一声 "去更新视图！"
          trigger()
        }, delay)
      },
    }
  })
}
```

```vue [MyComponent.vue]
<script setup>
import { watch } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

// 只需要 1 行代码，这个 text 就拥有了 1000ms 的防抖灵魂！
const text = useDebouncedRef('Hello', 1000)

// 当 text 最终(延迟后)变化时，才触发极其消耗性能的网络请求
watch(text, newVal => {
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

:::

[width(18,51,31)]

| 业务场景               | 推荐写法                                       | 为什么                                     |
| ---------------------- | ---------------------------------------------- | ------------------------------------------ |
| 搜索框、滚动等高频写入 | `useDebouncedRef(value, 500)` + `watch`        | 停止操作后才真正更新，减少请求和渲染       |
| 首屏不必加载的远程数据 | `get()` 首次读取时 `fetch`，完成后 `trigger()` | 变量不被使用就不发请求，实现按需加载       |
| 表单写入校验/格式化    | 在 `set()` 中清洗后再赋值并 `trigger()`        | 所有写入走同一入口，视图与存储值保持一致   |
| 数字/字符串的双向绑定  | 直接用 `customRef` 包一层                      | 只适合基本类型；对象、数组内部变更拦截不到 |

### 2.2 高频用法：节流、异步校验与脏检查

- **节流**：在 `set()` 中记录上次写入时间，未到间隔就只更新内部值，定时器结束后再 `trigger()`。

```js
import { customRef } from 'vue'

export function useThrottledRef(initialValue, interval = 500) {
  let value = initialValue
  let lastTime = 0
  let timer = null

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      value = newValue // 内部值立刻更新
      const remaining = interval - (Date.now() - lastTime)

      if (remaining <= 0) {
        lastTime = Date.now()
        trigger() // 已过间隔，立即通知视图
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null
          lastTime = Date.now()
          trigger() // 间隔内的多次写入合并成一次刷新
        }, remaining)
      }
    },
  }))
}
```

- **异步校验**：`set()` 先保存待提交值并做校验，成功后才更新真实值并 `trigger()`；失败时保留旧值，把错误暴露给调用方。

```js
import { customRef, ref } from 'vue'

export function useValidatedRef(initialValue, validate) {
  let value = initialValue
  const error = ref(null) // 把校验错误暴露给调用方

  const state = customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    async set(newValue) {
      try {
        await validate(newValue) // 校验通过才提交
        value = newValue
        error.value = null
        trigger()
      } catch (e) {
        // 校验失败：保留旧值，只记录错误
        error.value = e
      }
    },
  }))

  return { state, error }
}
```

- **脏检查**：闭包里保存初始值，`get()` 或额外的 `computed` 对比当前值即可得到 `isDirty`。

```js
import { computed, customRef } from 'vue'

export function useDirtyRef(initialValue) {
  const initial = initialValue
  let value = initialValue

  const state = customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      value = newValue
      trigger()
    },
  }))

  // 与闭包里的初始值对比，得到是否被改过的标记
  const isDirty = computed(() => state.value !== initial)
  return { state, isDirty }
}
```

- **与`computed`的分工**：`computed`用于**由其他状态派生一个值**;`customRef`用于拦截某一个值的读写时机。

```js
import { computed, customRef, ref } from 'vue'

const firstName = ref('Tao')
const lastName = ref('Kong')

// computed：由其他状态派生，本身只读
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// customRef：拦截某个值的写入时机，比如统一去掉首尾空格
let value = ''
const trimmed = customRef((track, trigger) => ({
  get() {
    track()
    return value
  },
  set(newValue) {
    value = newValue.trim()
    trigger()
  },
}))
```

- **注意**：`customRef` 只拦截 `.value` 这一层，对象/数组的内部变更不会触发 `set()`。

```js
import { customRef } from 'vue'

let value = []
const list = customRef((track, trigger) => ({
  get() {
    track()
    return value
  },
  set(newValue) {
    value = newValue // 只有给 .value 整体赋值才会进来
    trigger()
  },
}))

list.value = [1, 2, 3] // 触发 set()
list.value.push(4) // 不触发 set()，数组内部变更拦不住
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么我的 `customRef` 在页面上根本不更新，或者修改后报错了？

- **没有 `track()`**：当模板初次渲染读取数据时，如果你在 `get()` 里没写 `track()`，Vue 的响应式系统压根不知道模板用了这个变量。之后就算你调了一万次 `trigger()`，页面也不会有任何反应。
- **没有 `trigger()`**：如果你在 `set()` 里赋值了，但没写 `trigger()`，数据在内存里确实变了，但 Vue 不知道，依然是一潭死水。
- **金科玉律**：`get()` 里面必须执行 `track()`，`set()` 里面必须在适当的时机执行 `trigger()`。两者缺一不可。

### 3.2 我能在 `get()` 里面调用 `trigger()` 或者在 `set()` 里面调用 `track()` 吗？

**绝对禁止！这会导致灾难性的死循环 (Maximum call stack size exceeded)**，如果你在 `get()` (读取时) 去触发更新 (`trigger`)，触发更新会导致页面重新渲染，重新渲染又会去读取数据 (`get`)，再次触发更新…… 瞬间把浏览器的调用栈撑爆。

### 3.3 我写了一个处理数组的 `customRef`，为什么我调用 `arr.value.push()` 时，没有触发我写的延迟防抖效果？

- **原因剖析**：`customRef` 本质上和普通的 `ref` 一样，**它的拦截网只架设在 `.value` 这一层**。
- 当你执行 `arr.value.push()` 时，你**并没有对 `.value` 本身进行重新赋值**（你没有写 `arr.value = newArray`），你只是修改了它内部的元素。因此，它根本不会触发你写在 `customRef` 里的 `set(newValue)` 拦截器！
- **解决方案**：`customRef` **极其不适合用来处理需要深度监听内部属性变化的对象或数组**。它的最佳主战场是拦截并控制**基本数据类型**（如 `v-model` 绑定的字符串、数字）的整体赋值。

### 3.4 怎么写一个“只执行一次”的 lazy-load ref？

你可以在 `get()` 被第一次调用时，去 `fetch` 网络请求。拿到数据后再 `trigger()` 通知页面更新。这样只要这个变量没被用到，就永远不会发请求，节省极大带宽。

```js
export function useLazyFetch(url) {
  let value = null
  let fetched = false

  return customRef((track, trigger) => {
    return {
      get() {
        track() // 先收集依赖
        if (!fetched) {
          // 如果是第一次读取
          fetched = true
          fetch(url)
            .then(res => res.json())
            .then(data => {
              value = data
              trigger() // 数据回来了，再去喊视图更新
            })
        }
        return value // 第一次会返回 null，等请求完 trigger 后会重绘返回数据
      },
      set(newVal) {
        value = newVal
        trigger()
      },
    }
  })
}
```
