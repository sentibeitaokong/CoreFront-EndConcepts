# `nextTick`

`nextTick` 是 Vue 3 提供的用于**等待下一次 DOM 更新后执行回调**的核心工具函数。它利用 `JavaScript` 的微任务机制，将延迟操作注册到当前任务队列的末尾，确保在数据变更引起的 `DOM` 更新完成后才执行传入的回调。

## 1. 概述

在 Vue 3 中，响应式数据变化后并不会立即同步更新 DOM，而是将更新任务推入异步队列（`queueJob`），再通过 `nextTick` 在下一次微任务中统一刷新。`nextTick` 作为调度器与用户代码之间的桥梁，提供了两种常见用法：

- **无回调**：返回 `Promise`，可配合 `async/await` 使用。
- **有回调**：将回调推迟到 DOM 更新后执行。

## 2. 核心实现

`nextTick` 是调度器的公共 API，用于在下一次 DOM 更新后执行回调。

```typescript
//支持传入方法以及使用await的方式   nextTick(()=>{})  await nextTick()
const resolvedPromise = Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null

export function nextTick<T = void>(this: T, fn?: (this: T) => void): Promise<void> {
    //如果当前正在刷新（`currentFlushPromise` 存在），则等待刷新完成；否则直接使用 `resolvedPromise`。
    const p = currentFlushPromise || resolvedPromise
    return fn ? p.then(this ? fn.bind(this) : fn) : p
}
```

## 3. 与调度器的协作

调度器 `queueFlush` 利用 `nextTick` 来异步触发 `flushJobs`,负责在下一个微任务中执行刷新函数。

```typescript
//对应 promise 的 pending 状态，保证同时只有一个微任务被注册
let isFlushPending = false
//当前的执行任务
let currentFlushPromise: Promise<void> | null = null
const resolvedPromise = Promise.resolve() as Promise<any>
function queueFlush() {
    //当队列已经在处理时，则不进入
    if (!isFlushPending) {
        isFlushPending = true
        //返回执行结果
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}
```

## 4. 使用示例

### 4.1 回调函数形式

```javascript
import { nextTick } from 'vue'

setup() {
  const count = ref(0)
  count.value++

  nextTick(() => {
    console.log('DOM 已更新')
    // 操作 DOM 元素
  })
}
```

### 4.2 Promise 形式

```javascript
import { nextTick } from 'vue'

async function handleClick() {
  count.value++
  await nextTick()
  console.log('DOM 更新已完成')
}
```

## 5. 完整调度流程图（含 `nextTick` 位置）

![Logo](/nextTick.png)

## 6. 与 Vue 2 的 `nextTick` 对比

| 方面 | Vue 2 | Vue 3 |
|------|-------|-------|
| 底层 API | 优先 `Promise` → `MutationObserver` → `setImmediate` → `setTimeout` | 仅依赖 `Promise`（要求现代环境） |
| 返回 Promise | 支持（但需手动处理） | 原生支持 `async/await` |
| 调度器集成 | 通过 `queueWatcher` + `nextTick` 触发 | 通过 `queueFlush` + `currentFlushPromise` 精准等待 |

## 7. 总结

| 组件 | 实现核心 | 作用 |
|------|----------|------|
| `nextTick` | `Promise.resolve().then` + 共享 `currentFlushPromise` | 在 DOM 更新后执行回调 |
| `resolvedPromise` | 立即 resolve 的 Promise | 作为默认微任务生成器 |
| `currentFlushPromise` | 调度器更新期间持有的 Promise | 确保回调等待完整的 `flushJobs` 完成 |
| 降级策略 | 无（要求原生 Promise） | 通过 polyfill 支持旧浏览器 |

