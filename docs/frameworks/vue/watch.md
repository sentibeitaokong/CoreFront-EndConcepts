# Watch

`watch` 是 Vue 3 响应式系统中用于侦听响应式数据变化，并在数据变化时执行特定副作用（如异步请求、DOM 操作、复杂业务逻辑等）的核心 API。与 `computed` 注重计算和缓存派生值不同，`watch` 更侧重于“观察”和“响应”动作，它底层依赖 `ReactiveEffect` 和强大的调度器（`scheduler`）机制。

## 1. `watch` 的作用与设计动机

### 1.1 为什么需要 `watch`？

- **处理副作用**：在状态变化时执行非渲染类的操作（例如网络请求、本地存储同步、定时器）。
- **获取变化前后的值**：很多业务场景不仅需要新值，还需要旧值进行对比。
- **精确控制执行时机**：通过 `flush` 配置（`pre`、`post`、`sync`）精确控制回调函数在 Vue 更新 DOM 之前、之后还是同步执行。

### 1.2 `watch` 与 `watchEffect` 的简单对比

| 特性         | `watch`                                 | `watchEffect`                  |
| ------------ | --------------------------------------- | ------------------------------ |
| 依赖收集方式 | 显式指定数据源（精确控制）              | 自动收集回调内部的依赖         |
| 首次执行     | 默认懒执行（`immediate: false`）        | 创建时立即执行一次             |
| 获取旧值     | 支持（回调参数提供 `newVal`, `oldVal`） | 不支持                         |
| 适用场景     | 需明确侦听特定数据，或需旧值时          | 多个依赖项共同触发一个副作用时 |

## 2. 核心实现：数据源标准化与 `doWatch`

### 2.1 `watch` 函数入口

:::code-group

```typescript [apiWatch.ts]
// watch 接收三个参数：数据源、回调函数、配置项
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>,
) {
  // 核心逻辑交由 doWatch 处理
  return doWatch(source as any, cb, options)
}
```

:::

### 2.2 `doWatch` 核心逻辑（构建 getter）

`watch` 支持多种数据源（ref、reactive、getter 函数、数组），`doWatch` 首先需要将它们统一转化为一个 `getter` 函数，以便供底层的 `effect` 进行依赖收集。

:::code-group

```typescript [apiWatch.ts]
export const EMPTY_OBJ = {}
export const NOOP = () => {}
function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ,
) {
  //forceTrigger是Vue内部留下的一个“通行证”。它是专门为了配合shallowRef+triggerRef这种边缘场景设计的
  // 只要依赖被触发（即使对象的引用地址没有变，新旧值全等），依然能够无条件地执行 watch 的回调函数。
  let getter: () => any //空函数
  let forceTrigger = false //强制触发
  let isMultiSource = false //多数据源

  // 1. 标准化数据源，将其统一包装为一个 getter 函数
  if (isRef(source)) {
    // 来源是 ref，直接读取 .value
    getter = () => source.value
    //做一个标识，当source的值变了，由于地址没变，不会触发更新，因此加个标识强制更新
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    // 来源是 reactive，直接返回对象，并默认开启深度侦听
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    // 来源是数组（多数据源）
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) return s.value
        if (isReactive(s)) return traverse(s)
        if (isFunction(s)) return s()
        return s
      })
  } else if (isFunction(source)) {
    // 来源是 getter 函数
    getter = () => source()
  } else {
    getter = NOOP
  }

  // 2. 如果 deep 为 true，包裹 traverse 函数递归读取以收集深层依赖
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }
  // ... 构建 job 和 effect 逻辑（见下节）
}
```

```typescript [reactive.ts]
//判断一个数据是否为 Reactive
export function isReactive(value): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
//判断一个数据是否为 Shallow
export function isShallow(value: unknown): boolean {
  // 核心逻辑：只要 value 是个真值，并且它上面有 '__v_isShallow' 属性且为真，就返回 true
  return !!(value && (value as any)[ReactiveFlags.IS_SHALLOW])
}
```

```typescript [ref.ts]
//判断是否是ref值
export function isRef(ref: any) {
  return !!ref.__v_isRef
}
```

```typescript [shared/index.ts]
//是否为一个 function
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
```

:::

## 3. 依赖调度与回调执行机制

`watch` 的核心是通过 `ReactiveEffect` 收集依赖，并通过 `scheduler` 调度器控制回调 `cb` 的执行。

### 3.1 实例化 Effect 与生命周期

:::code-group

```typescript [apiWatch.ts]
  // 3. 配置 scheduler (处理 flush 选项)
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job // 同步立即执行
  } else if (flush === 'post') {
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense) // 组件 DOM 更新后执行
  } else {
    // 默认是 'pre'
    scheduler = () => queueJob(job) // 放入异步更新队列，在 DOM 更新前执行
  }

  // 4. 实例化底层的 ReactiveEffect
  const effect = new ReactiveEffect(getter, scheduler)

  // 5. 初始化执行 (处理 immediate 选项)
  if (cb) {
    if (immediate) {
      // 立即执行一次 job，触发用户回调
      job()
    } else {
      // 否则仅执行一次 getter 收集依赖，并保存旧值
      oldValue = effect.run()
    }
  }

  // 返回停止侦听的函数
  return () => {
    effect.stop()
  }
}
```

:::

### 3.2 定义 Job（回调包装器）

:::code-group

```typescript [apiWatch.ts]
let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE
// 1. 定义内部的 cleanup 变量，初始为空
let cleanup: (() => void) | undefined

// 2. 定义暴露给开发者的 onCleanup 函数
const onCleanup = (fn: () => void) => {
  // 当开发者调用 onCleanup(fn) 时，Vue 会做两件事：
  // a. 将 fn 赋值给内部的 cleanup 变量
  // b. 将 fn 挂载到底层 effect.onStop 上（确保侦听器被停止/组件卸载时也能触发）
  cleanup = effect.onStop = () => {
    // 执行开发者传入的清理逻辑
    fn()
    // 执行完毕后重置清理函数，避免重复调用
    cleanup = undefined
  }
}
// job 是当数据变化时，真正推入调度队列执行的函数
const job: Function = () => {
  //不是响应式数据直接返回
  if (!effect.active) return
  if (cb) {
    // 1. 执行 effect.run() 获取新值，并重新收集依赖
    const newValue = effect.run()

    // 2. 比较新旧值，或者由于 deep/forceTrigger 强制触发
    if (deep || forceTrigger || hasChanged(newValue, oldValue)) {
      // 3. 触发清理函数 (处理竞态条件)
      if (cleanup) {
        cleanup()
      }

      // 4. 执行用户传入的 cb 回调，传入新值、旧值和 onCleanup 钩子
      cb(
        newValue,
        oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
        onCleanup,
      )

      // 5. 更新旧值
      oldValue = newValue
    }
  } else {
    // watchEffect 的处理分支
    effect.run()
  }
}
```

:::

## 4. 深度侦听实现（`traverse`）

当侦听 `reactive` 对象或配置了 `deep: true` 时，必须触发对象内部所有属性的 `getter`，这样才能将当前的 `effect` 绑定到所有深层属性的 `dep` 上。

:::code-group

```typescript [apiWatch.ts]
export function traverse(value: unknown, seen?: Set<unknown>) {
  // 如果不是对象，或者没有被代理，则直接返回
  if (!isObject(value)) {
    return value
  }
  // 使用 Set 避免循环引用导致死循环（如 obj.self = obj）
  seen = seen || new Set()
  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else if (isObject(value)) {
    for (const key in value) {
      // 核心：读取对象的属性，触发 Proxy 的 get，进行依赖收集
      traverse((value as any)[key], seen)
    }
  }
  return value
}
```

```typescript [ref.ts]
//判断是否是ref值
export function isRef(ref: any) {
  return !!ref.__v_isRef
}
```

```typescript [shared/index.ts]
//判断传入的值是否为数组
export const isArray = Array.isArray

//判断传入的值是否为原生的非空对象
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

//转string
export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

//判断是否是map对象
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'

//判断是否是set对象
export const isSet = (val: unknown): val is Set<any, any> =>
  toTypeString(val) === '[object Set]'
```

:::

## 5. 完整流程示例

### 5.1 基础使用示例

```typescript
import { ref, watch, reactive } from 'vue'

//1.监听ref对象
const count = ref(0)
watch(count, (newVal, oldVal) => {
  console.log(`count 发生变化：从 ${oldVal} 变成了 ${newVal}`)
})
// 触发侦听
count.value++

//2.侦听 reactive 对象的特定属性（使用 Getter 函数）
const state = reactive({ count: 0, name: 'Vue' })
watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(`state.count 发生变化：${oldVal} -> ${newVal}`)
  },
)
state.count++ // 触发侦听
state.name = 'React' // 不会触发侦听

//3.深度侦听 reactive 对象
const deepState = reactive({
  user: { name: 'Alice', age: 20 },
})
watch(deepState, (newVal, oldVal) => {
  console.log('对象发生了突变！', newVal === oldVal) // true
})
// 触发侦听
deepState.user.age = 21

//4.侦听多个数据源（数组形式）
const title = ref('Hello')
const anotherState = reactive({ count: 0 })
watch(
  [title, () => anotherState.count],
  ([newTitle, newCount], [oldTitle, oldCount]) => {
    console.log(`新的 title 是 ${newTitle}，新的 count 是 ${newCount}`)
  },
)
title.value = 'World' // 触发侦听

//5.立即执行
const id = ref(123)
watch(
  id,
  newId => {
    console.log(`立刻执行，并且每次 id 变化时也执行，当前 id: ${newId}`)
  },
  { immediate: true }, // 开启立即执行
)

//6. 处理异步竞态条件
const keyword = ref('')
watch(keyword, async (newVal, oldVal, onCleanup) => {
  // 利用 AbortController 中断 Fetch 请求
  const controller = new AbortController()
  // 注册清理逻辑：当 keyword 再次变化时，会先执行这里的代码 [cite: 43]
  onCleanup(() => {
    console.log(`取消对 ${oldVal} 的网络请求`)
    controller.abort()
  })
  try {
    const res = await fetch(`https://api.example.com/search?q=${newVal}`, {
      signal: controller.signal,
    })
    const data = await res.json()
    console.log('请求成功:', data)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('请求已被安全中断')
    }
  }
})
```

### 5.2 完整流程图

![Watch Flow](/watch.png)

## 6. `watch` 与 `computed` 对比

| 对比维度     | `watch`                               | `computed`                             |
| ------------ | ------------------------------------- | -------------------------------------- |
| **核心机制** | `ReactiveEffect` + 自定义 `Scheduler` | `ReactiveEffect` + 懒计算标志 `_dirty` |
| **执行时机** | 数据变化时被动触发（异步/同步）       | 依赖变化且被读取 `.value` 时触发计算   |
| **主要用途** | 包含副作用（请求、操作 DOM）          | 根据现有状态计算派生数据               |
| **返回值**   | 返回一个取消侦听的函数 `stop`         | 返回一个只读（或可写）的 `Ref` 对象    |

## 7. 总结

基于上述源码分析，`watch` 具备以下核心特性：

- **懒执行 (Lazy by default)**：默认情况下，`watch` 不会立即执行回调，仅在被侦听的数据源发生实际变化时才会触发回调。可以通过配置 `{ immediate: true }` 改变此行为。
- **多态数据源支持**：支持侦听 `Ref`、`Reactive` 对象、`Getter` 函数，甚至是由上述类型组成的数组（批量侦听）。
- **深层侦听 (Deep Watching)**：对于 `reactive` 对象默认开启深层侦听；对于普通对象或包含复杂结构的 `ref`，可通过 `{ deep: true }` 强制递归收集依赖。
- **获取旧值**：回调函数中可以明确拿到变化前的 `oldValue` 和变化后的 `newValue`。
- **副作用清理 (onCleanup)**：回调的第三个参数提供了一个注册清理函数的钩子，特别适合处理竞态条件（如节流防抖、取消过期的网络请求）。
- **可配置刷新时机 (flush)**：
  - `'pre'` (默认)：在组件 DOM 更新前执行副作用。
  - `'post'`：在组件 DOM 更新后执行（如需要获取更新后的 DOM 节点）。
  - `'sync'`：同步执行，数据变化后立即触发（可能会造成性能问题，需慎用）。
