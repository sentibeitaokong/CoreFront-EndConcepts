# 调度器（Scheduler）

调度器（Scheduler）是 Vue 3 运行时核心中负责**异步批量更新**和**任务调度**的关键模块。它解决了多个响应式数据变化时如何高效、有序地触发组件更新和用户回调的问题。

## 1. 调度器的作用与设计动机

### 1.1 为什么需要调度器？

- **批量更新**：当同一个响应式数据在同一轮事件循环中被多次修改，调度器可以将多次更新合并为一次，避免重复渲染。
- **异步执行**：将所有同步代码执行完毕后再统一刷新，避免中间状态导致界面闪烁。
- **执行顺序控制**：支持在组件更新前（`pre`）、更新后（`post`）或同步（`sync`）执行副作用，保证 DOM 访问的时机正确。
- **去重**：同一个组件的更新任务只入队一次，避免重复计算。

### 1.2 调度器与 `effect` 的关系

* 每个 `effect` 可以配置一个自定义 `scheduler`。
* 当响应式数据变化触发 `trigger` 时，若 `effect.scheduler` 存在，则调用它而非直接执行 `effect.run()`。
* 调度器内部通常会将真正的更新任务（`effect.run`）包装后推入队列。


## 2. 核心数据结构

### 2.1 任务队列

调度器维护了三个任务队列，分别用于不同的执行时机：

| 队列 | 变量名 | 用途 |
|------|--------|------|
| 前置队列（pre） | `pendingPreFlushCbs` | 存储需要在组件更新前执行的任务（如 `watch` 的 `flush: 'pre'`） |
| 主队列（job） | `queue` | 存储组件的渲染任务（`instance.update`）等普通任务 |
| 后置队列（post） | `pendingPostFlushCbs` | 存储需要在组件更新后执行的任务（如 `watch` 的 `flush: 'post'`） |

### 2.2 刷新状态标志

- `isFlushPending`：是否已经有刷新任务正在等待（微任务已注册）。
- `isFlushing`：是否正在执行刷新（遍历队列中）。
- `flushIndex`：当前执行到队列的哪个位置（用于去重和停止传播）。

## 3. 核心功能实现

### 3.1 添加普通任务

:::code-group
```typescript [scheduler.ts]
const queue: Function[] = []                   //主队列
const pendingPreFlushCbs: Function[] = []     //前置队列
const pendingPostFlushCbs: Function[] = []   //后置队列

//将渲染任务或普通副作用推入主队列。
export function queueJob(job: Function) {
    //去重
    if (!queue.length || !queue.includes(job)) {
        queue.push(job)
        queueFlush()
    }
}

//添加前置任务。
export function queuePreFlushCb(cb: Function) {
    if (!isFlushing && !pendingPreFlushCbs.includes(cb)) {
        pendingPreFlushCbs.push(cb)
        queueFlush()
    }
}

//添加后置任务
export function queuePostFlushCb(cb: Function) {
    if (!isFlushing && !pendingPostFlushCbs.includes(cb)) {
        pendingPostFlushCbs.push(cb)
        queueFlush()
    }
}
```
:::

### 3.2 注册微任务

`queueFlush` 负责在下一个微任务中执行刷新函数。

:::code-group
```typescript [scheduler.ts]
//对应 promise 的 pending 状态，保证同时只有一个微任务被注册
let isFlushPending = false
//当前的执行任务
let currentFlushPromise: Promise<void> | null = null
const resolvedPromise = Promise.resolve() as Promise<any>
function queueFlush() {
    //当队列已经在处理时，则不进入
    if (!isFlushPending) {
        isFlushPending = true
        //调度器更新期间持有的 Promis
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}
```
:::

### 3.3 核心刷新函数

`flushJobs` 按顺序执行所有队列中的任务。

:::code-group
```typescript [scheduler.ts]
type CountMap = Map<Function, number>
const queue: Function[] = []                   //主队列
const pendingPreFlushCbs: Function[] = []     //前置队列
const pendingPostFlushCbs: Function[] = []   //后置队列

function flushJobs(seen?: CountMap) {
    isFlushPending = false
    isFlushing = true

    // 1. 执行前置队列（pre）
    flushPreFlushCbs(seen)

    // 2. 执行主队列（job），遍历时可能会新增任务，所以要 while 循环
    let job
    while ((job = queue.shift())) {
        if (job) {
            //执行任务
            job()
        }
    }

    // 3. 执行后置队列（post），同样可能新增
    flushPostFlushCbs(seen)

    isFlushing = false
    
    //
    currentFlushPromise = null
    // 4. 如果刷新过程中又有新任务加入，继续递归刷新
    if (queue.length || pendingPostFlushCbs.length) {
        flushJobs()
    }
}

//依次处理前置队列中的任务
function flushPreFlushCbs(seen?: CountMap) {
    if (pendingPreFlushCbs.length) {
        // 去重
        let activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
        // 清空就数据
        pendingPreFlushCbs.length = 0
        // 循环处理
        for (let i = 0; i < activePreFlushCbs.length; i++) {
            activePreFlushCbs[i]()
        }
    }
}
//依次处理后置队列中的任务
function flushPostFlushCbs() {
    if (pendingPostFlushCbs.length) {
        // 1. 复制并去重当前队列
        const activePostFlushCbs = [...new Set(pendingPostFlushCbs)]
        // 2. 立即清空原队列
        pendingPostFlushCbs.length = 0
        // 3. 执行复制后的回调
        for (let i = 0; i < activePostFlushCbs.length; i++) {
            activePostFlushCbs[i]()
        }
    }
}
```
:::

## 4. 调度策略与 `watch` 的 `flush` 选项

调度器的三个队列对应 `watch` 的三种 `flush` 模式：

| `flush` 选项 | 调度函数 | 队列 |
|--------------|----------|------|
| `'pre'`（默认） | `queuePreFlushCb` | `pendingPreFlushCbs` |
| `'post'` | `queuePostFlushCb` | `pendingPostFlushCbs` |
| `'sync'` | 不经过调度器，直接执行 | 无 |

在 `doWatch` 中创建 `ReactiveEffect` 时，会根据 `flush` 选项设置 `scheduler`：

```typescript
if (flush === 'sync') {
    //同步执行，适用于需要立即响应的场景（效率较低）。
  scheduler = job as any
} else if (flush === 'post') {
    //组件更新后执行，可以访问新 DOM。
  scheduler = () => queuePostRenderEffect(job)
} else {
    //组件更新前执行，可以访问旧 DOM。
  scheduler = () => queuePreFlushCb(job)
}
```

## 5. 组件渲染与调度器的整合

在组件初始化时，会创建一个渲染 `effect`，其 `scheduler` 为 `queueJob(instance.update)`。

```typescript
//当响应式数据变化，`trigger` 调用该 `scheduler`，将 `instance.update` 加入主队列。
//在 `flushJobs` 执行主队列时，`instance.update` 会调用 `patch` 更新 DOM。
const effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(instance.update)
)
```

## 6. 完整流程图

![Logo](/scheduler.png)

## 7. 总结

| 模块 | 核心实现 | 关键特性 |
|------|----------|----------|
| 任务队列 | `queue`, `pendingPreFlushCbs`, `pendingPostFlushCbs` | 分优先级执行 |
| 入队函数 | `queueJob`, `queuePreFlushCb`, `queuePostFlushCb` | 去重、防递归 |
| 刷新函数 | `flushJobs` | 顺序执行三部曲 |
| 微任务注册 | `queueFlush` + `nextTick` | 异步批量 |
| 公共 API | `nextTick` | 等待 DOM 更新 |

