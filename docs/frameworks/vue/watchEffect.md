# WatchEffect

`watchEffect` 是 Vue 3 响应式系统中用于自动追踪副作用依赖的核心 API。与 `watch` 需要显式指定数据源不同，`watchEffect` 会在执行其回调函数时，**自动收集**内部访问到的所有响应式数据作为依赖。当这些依赖发生变化时，它会自动重新执行该回调。

## 1. `watchEffect` 的作用与设计动机

### 1.1 为什么需要 `watchEffect`？

- **自动依赖收集**：开发者无需手动维护庞大的依赖数组或显式声明数据源，极大简化了复杂业务逻辑的代码量。
- **立即执行**：在组件创建时（或调用时）会默认立即执行一次，以完成依赖的初始化收集。
- **生命周期绑定**：与 `watch` 一样，在组件 `setup()` 中同步调用时，会自动绑定到当前组件实例，组件卸载时自动停止侦听。

### 1.2 `watchEffect` 与 `watch` 的简单对比

| 特性           | `watchEffect`                  | `watch`                                  |
| :------------- | :----------------------------- | :--------------------------------------- |
| **依赖收集**   | 自动收集回调内部访问的依赖     | 显式声明侦听的数据源                     |
| **首次执行**   | 创建时立刻执行一次（收集依赖） | 默认懒执行（除非配置 `immediate: true`） |
| **新旧值比对** | 无法获取变化前后的旧值         | 回调提供 `newVal` 和 `oldVal` 参数       |
| **适用场景**   | 多个依赖项共同触发同一个副作用 | 针对明确目标触发特定副作用               |

---

## 2. 核心实现：入口函数与数据源构建

在 Vue 3 中，`watchEffect` 以及它的衍生版本（`watchPostEffect`、`watchSyncEffect`）都是对 `doWatch` 的轻量封装。

### 2.1 `watchEffect` 函数入口

:::code-group

```typescript [apiWatch.ts]
import { doWatch } from './apiWatch'

// 基础的 watchEffect (默认 flush: 'pre')
export function watchEffect(
  effect: WatchEffect,
  options?: WatchOptionsBase,
): WatchStopHandle {
  // 注意第二个参数 cb 传入的是 null，这是区分 watch 和 watchEffect 的关键
  return doWatch(effect, null, options)
}

// 衍生版本：DOM 更新后执行 (等同于 flush: 'post')
export function watchPostEffect(
  effect: WatchEffect,
  options?: DebuggerOptions,
) {
  return doWatch(
    effect,
    null,
    (__DEV__
      ? { ...options, flush: 'post' }
      : { flush: 'post' }) as WatchOptionsBase,
  )
}

// 衍生版本：同步执行 (等同于 flush: 'sync')
export function watchSyncEffect(
  effect: WatchEffect,
  options?: DebuggerOptions,
) {
  return doWatch(
    effect,
    null,
    (__DEV__
      ? { ...options, flush: 'sync' }
      : { flush: 'sync' }) as WatchOptionsBase,
  )
}
```

:::

### 2.2 `doWatch` 核心逻辑（针对 `watchEffect`）

在 `doWatch` 的内部逻辑中，由于 `watchEffect` 没有单独的 `cb`，也没有单独的 `source`，它的数据源其实就是用户传入的副作用函数本身。

:::code-group

```typescript [apiWatch.ts]
export const EMPTY_OBJ = {}

function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null, // 对于 watchEffect，cb 为 null
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ,
) {
  let getter: () => any
  // 内部维护的清理函数引用
  let cleanup: (() => void) | undefined

  // 暴露给开发者的注册函数
  const onCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      fn()
      cleanup = undefined
    }
  }
  if (isFunction(source)) {
    if (cb) {
      // watch 的处理逻辑...
    } else {
      // watchEffect 的逻辑：source 本身就是副作用函数
      // 包装一个 getter，在执行时传入 onCleanup 钩子，以供用户注册清理逻辑
      getter = () => {
        // 组件卸载防护
        if (instance && instance.isUnmounted) {
          return
        }
        // 在执行前，先调用上一次注册的清理函数 (处理竞态条件)
        if (cleanup) {
          cleanup()
        }
        // 执行用户传入的 source (即 effect 函数)，并将 onCleanup 传递进去
        return source(onCleanup)
      }
    }
  }
  // ... 构建 job 和 effect 逻辑（见下节）
}
```

```typescript [shared/index.ts]
//是否为一个 function
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
```

:::

## 3. 依赖调度与 Job 执行机制

因为 `watchEffect` 没有 `cb`，它的 `job` 执行逻辑远比 `watch` 简单：不需要比对新旧值，也不需要判断 `deep`，只需要让底层的 `ReactiveEffect` 重新运行即可。

### 3.1 实例化 Effect 与生命周期

:::code-group

```typescript [apiWatch.ts]
  // 3. 配置 scheduler（根据 flush 配置放入微任务队列）
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job
  } else if (flush === 'post') {
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
  } else {
    scheduler = () => queueJob(job)
  }

  // 4. 实例化底层的 ReactiveEffect
  const effect = new ReactiveEffect(getter, scheduler)

  // 5. 初始化执行 (watchEffect 强制立即执行)
  if (cb) {
    // ... watch 的 immediate 处理
  } else {
    // watchEffect 的标志性行为：无论有没有 explicit 的 immediate 配置，
    // 在创建时都会立即执行一次以收集依赖
    if (flush === 'post') {
      queuePostRenderEffect(effect.run.bind(effect), instance && instance.suspense)
    } else {
      effect.run()
    }
  }

  // 返回停止侦听的函数
  return () => {
    effect.stop()
  }
}
```

:::

### 3.2 极简的 Job 触发机制

:::code-group

```typescript [apiWatch.ts]
// 此时的 effect 是通过 ReactiveEffect 实例化的对象
// 它的执行(run) 会触发依赖收集
const job: SchedulerJob = () => {
  //不是响应式，直接返回
  if (!effect.active) return

  if (cb) {
    // ... watch 的处理分支（获取新旧值并比较） ...
  } else {
    // watchEffect 的处理分支：直接执行底层的 effect.run()
    // 内部实际上会调用我们上面包装好的 getter，从而重新收集依赖并执行回调
    effect.run()
  }
}
```

:::

## 4. 副作用清理 (`onCleanup`) 机制

在 `watchEffect` 中，我们非常依赖 `onCleanup` 来清除上一次未完成的异步任务或定时器。每次底层的 `effect.run()` 触发包装好的 `getter` 时，都会先执行 `if (cleanup) { cleanup() }`。

:::code-group

```typescript [apiWatch.ts]
// 内部维护的清理函数引用
let cleanup: (() => void) | undefined

// 暴露给开发者的注册函数
const onCleanup = (fn: () => void) => {
  cleanup = effect.onStop = () => {
    fn()
    cleanup = undefined
  }
}
```

:::

## 5. 完整流程示例

### 5.1 基础使用示例

```typescript
//1. 自动追踪依赖并立即执行
import { ref, reactive, watchEffect } from 'vue'
const count = ref(0)
const user = reactive({ name: 'Alice' })
// 1. 创建时会立即执行一次，打印：当前 count 为 0，用户名为 Alice
watchEffect(() => {
  // Vue 会自动收集这里的 count.value 和 user.name 作为依赖
  console.log(`当前 count 为 ${count.value}，用户名为 ${user.name}`)
})
// 2. 修改任意一个依赖，都会触发回调重新执行
count.value++ // 打印：当前 count 为 1，用户名为 Alice
user.name = 'Bob' // 打印：当前 count 为 1，用户名为 Bob

//2. 处理异步逻辑与竞态条件（使用 onCleanup）
const keyword = ref('Vue')
watchEffect(async onCleanup => {
  // 1. 创建一个中止控制器
  const controller = new AbortController()
  // 2. 注册清理函数：当 keyword 再次改变，或者组件卸载时，会优先执行这里的逻辑
  onCleanup(() => {
    console.log(`中止之前关于 ${keyword.value} 的请求`)
    controller.abort()
  })
  try {
    console.log(`开始请求 ${keyword.value} 的数据...`)
    const res = await fetch(
      `https://api.example.com/search?q=${keyword.value}`,
      {
        signal: controller.signal,
      },
    )
    const data = await res.json()
    console.log('请求成功:', data)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('请求已被安全中断')
    }
  }
})
// 如果在短时间内连续修改，上一次未完成的请求会被 onCleanup 准确中断
setTimeout(() => {
  keyword.value = 'React'
}, 100)
setTimeout(() => {
  keyword.value = 'Angular'
}, 200)

//3. 停止侦听器
const anothercount = ref(0)
// watchEffect 会返回一个专门用于停止它的函数
const stop = watchEffect(() => {
  console.log('侦听中，当前 count:', count.value)
})
// 模拟条件触发，停止侦听
setInterval(() => {
  count.value++
  if (count.value === 3) {
    console.log('满足条件，停止侦听！')
    stop() // 停止后，后续 count 再怎么变化，回调也不会再执行了
  }
}, 1000)
```

### 5.2 完整流程图

![Logo](/watchEffect.png)

## 6. 总结

基于上述源码分析，`watchEffect` 具备以下核心特性：

- **极简的入参约定**：将用户的回调直接作为 `ReactiveEffect` 的 `getter`，省略了繁琐的数据源声明步骤。
- **强制立即执行**：由于没有 `cb` 且没有明确的依赖目标，唯一能知道依赖是什么的方法就是**立即执行一次回调**，利用 Vue 的 `Proxy` 和 `track` 机制“摸排”出所有被访问到的响应式对象。
- **单纯的重新运行**：触发更新时，它的 `job` 中不包含任何条件判断（如比对新旧值），而是直截了当地调用 `effect.run()` 重新求值并触发依赖数据的再次收集。
- **内置竞态处理**：通过回调函数参数原生提供的 `onCleanup` 钩子，优雅地解决了异步操作（如快速连续发起的网络请求）中极易出现的竞态条件问题，有效防止内存泄漏和旧数据覆盖新数据。
