# Vue 3 `watch` 源码级解析

`watch` 是 Vue 3 响应式系统中用于**侦听响应式数据变化**并执行副作用的核心 API。与 `watchEffect` 不同，`watch` 需要**明确指定侦听的数据源**，并且可以获取变化前后的值，支持懒执行（默认不立即执行）。本文将从源码层面，深度剖析 `watch` 的实现机制、依赖追踪、调度策略以及与 `effect` 系统的协作。

## 1. `watch` 的作用与设计动机

### 1.1 为什么需要 `watch`？

- **精准侦听**：只关注指定的数据源，避免不必要的依赖收集。
- **获取新旧值**：在回调中可以同时获取变化前后的值，便于处理差异逻辑。
- **懒执行**：默认仅在数据变化时执行，也可通过 `immediate` 选项立即执行。
- **清理副作用**：支持注册 `onCleanup`，用于取消上一次未完成的异步操作（如防抖、取消请求）。

### 1.2 与 `watchEffect` 的对比

| 特性 | `watch` | `watchEffect` |
|------|---------|---------------|
| 数据源 | 显式指定（ref、reactive、getter、数组） | 自动收集函数内访问的响应式数据 |
| 获取新旧值 | 是（回调参数） | 否 |
| 懒执行 | 是（默认） | 否（立即执行） |
| 回调触发时机 | 依赖变化后 | 依赖变化后（或立即） |
| 适用场景 | 需要新旧值对比、精确控制依赖 | 简单副作用，无需旧值 |

## 2. 核心实现：`doWatch` 函数

源码位于 `packages/runtime-core/src/apiWatch.ts`

Vue 3 中的 `watch` 和 `watchEffect` 最终都由一个内部函数 `doWatch` 统一实现。`doWatch` 负责解析数据源、创建副作用、处理回调、调度执行。

### 2.1 `watch` 函数入口

```typescript
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStopHandle {
  return doWatch(source as any, cb, options)
}
```

- `source`：侦听的数据源，可以是 `ref`、`reactive` 对象、`getter` 函数、或以上类型的数组。
- `cb`：数据变化时执行的回调函数，接收 `(newValue, oldValue, onCleanup)`。
- `options`：配置选项，如 `immediate`、`deep`、`flush`、`once` 等。

### 2.2 `doWatch` 函数的主要流程

```typescript
function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect,
  cb: WatchCallback | null,
  { immediate, deep, flush, once, onTrack, onTrigger } = {}
): WatchStopHandle {
  // 1. 标准化数据源，返回 getter 函数
  let getter: () => any
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true  // reactive 对象默认深度侦听
  } else if (isFunction(source)) {
    getter = source as () => any
  } else if (isArray(source)) {
    getter = () => source.map(s => {
      if (isRef(s)) return s.value
      if (isReactive(s)) return traverse(s)
      if (isFunction(s)) return s()
      return s
    })
  }

  // 2. 处理深度侦听（traverse）
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  // 3. 创建清理副作用函数（onCleanup 注册器）
  let cleanup: () => void
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = () => {
      fn()
      cleanup = undefined
    }
  }

  // 4. 创建旧值存储变量
  let oldValue: any = undefined

  // 5. 定义调度器 scheduler
  const job = () => {
    if (!effect.active) return
    if (cb) {
      // 有回调：执行 watcher 回调
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        // 执行清理函数（如果有）
        if (cleanup) cleanup()
        cb(newValue, oldValue, onCleanup)
        oldValue = newValue
      }
    } else {
      // 无回调（watchEffect 模式）：直接运行副作用
      effect.run()
    }
  }

  // 6. 根据 flush 选项，决定调度方式
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job  // 同步执行
  } else if (flush === 'post') {
    scheduler = () => queuePostRenderEffect(job)  // 组件更新后执行
  } else {
    scheduler = () => queuePreFlushCb(job)  // 默认 'pre'，组件更新前执行
  }

  // 7. 创建 ReactiveEffect
  const effect = new ReactiveEffect(getter, scheduler)

  // 8. 立即执行（immediate 或 watchEffect 模式）
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()  // 首次收集依赖，但不触发回调
    }
  } else {
    effect.run()  // watchEffect 立即执行
  }

  // 9. 返回 stop 函数
  return () => {
    effect.stop()
  }
}
```

## 3. 数据源标准化与依赖收集

### 3.1 数据源类型处理

`doWatch` 支持多种数据源类型，统一转换为 `getter` 函数：

| 数据源类型 | 转换后的 `getter` | 说明 |
|-----------|------------------|------|
| `ref` | `() => source.value` | 订阅 `.value` 变化 |
| `reactive` | `() => source` | 自动 `deep = true`，遍历所有属性 |
| `getter 函数` | `source` | 直接使用，可访问多个响应式数据 |
| 数组 | `() => source.map(item => ...)` | 侦听多个数据源，返回数组 |

### 3.2 深度侦听的实现

当 `deep` 为 `true` 时，`traverse` 函数会递归访问对象的所有属性，确保任何嵌套属性的变化都能被追踪。

```typescript
function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value)) return value
  seen = seen || new Set()
  if (seen.has(value)) return value
  seen.add(value)
  if (isRef(value)) traverse(value.value, seen)
  else if (isArray(value)) value.forEach(v => traverse(v, seen))
  else if (isMap(value) || isSet(value)) value.forEach((v, k) => { traverse(k, seen); traverse(v, seen) })
  else if (isPlainObject(value)) Object.keys(value).forEach(k => traverse((value as any)[k], seen))
  return value
}
```

- **递归访问**：深度遍历所有子属性，触发它们的 `getter`，从而建立依赖。
- **去重**：使用 `Set` 避免循环引用导致的无限递归。

## 4. 清理副作用（`onCleanup`）

`watch` 的回调函数第三个参数 `onCleanup` 用于注册清理函数，常见于异步场景（如防抖、取消请求）。

### 4.1 使用示例

```javascript
watch(keyword, async (newKeyword, oldKeyword, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  const result = await fetch(`/api?q=${newKeyword}`)
  if (active) {
    data.value = result
  }
})
```

### 4.2 源码实现

- `onCleanup` 接收一个清理函数，内部将其赋值给 `cleanup` 变量。
- 在下一次回调执行前，如果存在 `cleanup`，会先执行它。
- 这样确保了过期的异步操作被取消，避免竞态条件。

## 5. 调度策略：`flush` 选项

`flush` 决定回调的执行时机，对应三种模式：

| 值 | 调度函数 | 执行时机 |
|----|----------|----------|
| `'pre'`（默认） | `queuePreFlushCb(job)` | 组件更新前，DOM 尚未更新 |
| `'post'` | `queuePostRenderEffect(job)` | 组件更新后，DOM 已更新 |
| `'sync'` | 直接 `job()` | 同步执行，依赖变化立即触发 |

```typescript
// pre 模式：使用 queuePreFlushCb
const queuePreFlushCb = (cb: Function) => {
  queueJob(cb)  // 用于渲染前的任务
}

// post 模式：使用 queuePostRenderEffect
export function queuePostRenderEffect(effect: Function) {
  queueEffectWithSuspense(effect, postFlushQueue)
}
```

- 默认 `pre` 模式确保在组件重新渲染前执行，可以访问旧 DOM。
- `post` 模式常用于需要操作更新后 DOM 的场景。
- `sync` 模式效率较低，应谨慎使用。

## 6. 一次性侦听：`once` 选项（Vue 3.4+）

`once` 选项使 `watch` 在回调执行一次后自动停止。

```typescript
if (once && cb) {
  const _stop = stop
  stop = () => {
    _stop()
    effect.stop()
  }
}
```

- 内部将 `stop` 函数包装，先执行用户停止逻辑，再停止 `effect`。

## 7. `watchEffect` 与 `watch` 的关联

`watchEffect` 是 `doWatch` 的一个特例：不传入 `cb`（回调），且 `immediate` 为 `true`。

```typescript
export function watchEffect(effect: WatchEffect, options?: WatchOptionsBase): WatchStopHandle {
  return doWatch(effect, null, options)
}
```

- `effect` 本身就是副作用函数，没有新旧值回调。
- 立即执行一次，自动收集依赖。

## 8. 完整流程图

![Logo](/watch.png)

## 9. 关键源码位置速查

| 文件路径 | 核心内容 |
|----------|----------|
| `packages/runtime-core/src/apiWatch.ts` | `watch`, `watchEffect`, `doWatch` 实现 |
| `packages/runtime-core/src/scheduler.ts` | `queuePreFlushCb`, `queuePostRenderEffect` |
| `packages/reactivity/src/effect.ts` | `ReactiveEffect`, `track`, `trigger` |
| `packages/shared/src/index.ts` | `hasChanged`, `isObject`, `traverse` |

## 10. 总结

| 模块 | 核心实现 | 关键特性 |
|------|----------|----------|
| 数据源标准化 | 统一转换为 `getter` | 支持 `ref`, `reactive`, `getter`, 数组 |
| 依赖收集 | 通过 `ReactiveEffect` 执行 `getter` | 自动追踪依赖 |
| 深度侦听 | `traverse` 递归访问嵌套属性 | 内置去重，避免循环 |
| 新旧值比较 | `hasChanged` 严格比较 | NaN 特殊处理 |
| 清理副作用 | `onCleanup` 注册清理函数 | 避免竞态 |
| 调度策略 | `flush` 选项 | `pre`, `post`, `sync` |
| 一次性侦听 | `once` 选项 | 回调执行后自动停止 |

Vue 3 的 `watch` 通过 `doWatch` 统一处理数据源标准化、依赖收集、调度执行和清理机制，既提供了灵活的侦听能力，又与 `watchEffect`、`effect` 系统无缝集成。理解其源码有助于编写更加精准、高效的侦听逻辑，并掌握异步副作用的管理技巧。