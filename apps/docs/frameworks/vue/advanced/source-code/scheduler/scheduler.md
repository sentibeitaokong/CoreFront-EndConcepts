# 调度器（Scheduler）

调度器（Scheduler）是 Vue 3 运行时核心中负责**异步批量更新**和**任务调度**的关键模块。它解决了多个响应式数据变化时如何高效、有序地触发组件更新和用户回调的问题。

## 1. 调度器的作用与设计动机

### 1.1 为什么需要调度器？

- **批量更新**：当同一个响应式数据在同一轮事件循环中被多次修改，调度器可以将多次更新合并为一次，避免重复渲染。
- **异步执行**：将所有同步代码执行完毕后再统一刷新，避免中间状态导致界面闪烁。
- **执行顺序控制**：支持在组件更新前（`pre`）、更新后（`post`）或同步（`sync`）执行副作用，保证 DOM 访问的时机正确。
- **去重**：同一个组件的更新任务只入队一次，避免重复计算。

### 1.2 调度器与 `effect` 的关系

- 每个 `effect` 可以配置一个自定义 `scheduler`。
- 当响应式数据变化触发 `trigger` 时，若 `effect.scheduler` 存在，则调用它而非直接执行 `effect.run()`。
- 调度器内部通常会将真正的更新任务（`effect.run`）包装后推入队列。

## 2. 核心数据结构

### 2.1 任务队列

Vue 3 的调度器只有主队列和后置队列两个队列，并没有独立的 pre 队列：

[width(21,17,62)]

| 队列             | 变量名                | 用途                                                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| 主队列（job）    | `queue`               | 存储组件渲染任务（`instance.update`）、`pre` watcher 回调（`job.pre = true`）等，刷新前按 id 排序 |
| 后置队列（post） | `pendingPostFlushCbs` | 存储需要在组件更新后执行的任务（如 `watch` 的 `flush: 'post'`、生命周期钩子）                     |

`flush: 'pre'` 的回调并不是进入单独的队列，而是给任务打上 `job.pre = true`、`job.id = instance.uid` 后走普通的 `queueJob` 进入主队列；随后由 renderer 在组件 props 更新后、render 之前调用 `flushPreFlushCbs`，从主队列中挑出这些 `pre` 任务执行。

### 2.2 刷新状态标志

- `isFlushPending`：是否已经有刷新任务正在等待（微任务已注册）。
- `isFlushing`：是否正在执行刷新（遍历队列中）。
- `flushIndex`：当前执行到队列的哪个位置（用于去重和停止传播）。

## 3. 核心功能实现

### 3.1 添加普通任务

:::code-group

```typescript [scheduler.ts]
const queue: SchedulerJob[] = [] //主队列
let flushIndex = 0
const pendingPostFlushCbs: SchedulerJob[] = [] //后置队列
let activePostFlushCbs: SchedulerJob[] | null = null
let postFlushIndex = 0
let isFlushing = false
let isFlushPending = false

const getId = (job: SchedulerJob): number =>
  job.id == null ? Infinity : job.id

//按 id 升序排序；id 相同时 pre 回调排在普通任务前
const comparator = (a: SchedulerJob, b: SchedulerJob): number => {
  const diff = getId(a) - getId(b)
  if (diff === 0) {
    if (a.pre && !b.pre) return -1
    if (b.pre && !a.pre) return 1
  }
  return diff
}

//二分查找插入位置，保证主队列始终按 id 递增
function findInsertionIndex(id: number) {
  let start = flushIndex + 1
  let end = queue.length
  while (start < end) {
    const middle = (start + end) >>> 1
    const middleJobId = getId(queue[middle])
    middleJobId < id ? (start = middle + 1) : (end = middle)
  }
  return start
}

//将渲染任务或普通副作用推入主队列。
export function queueJob(job: SchedulerJob) {
  //去重：从 flushIndex 开始查找，正在执行的任务不会递归触发自身；
  //allowRecurse 的任务（组件更新、watch 回调）从 flushIndex + 1 开始，允许递归
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex,
    )
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      //有 id 的任务按 id 插入，保证父组件（id 更小）先于子组件执行
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}

//添加后置任务
export function queuePostFlushCb(cb: SchedulerJobs) {
  if (!isArray(cb)) {
    //去重对象是正在执行的后置队列 activePostFlushCbs，而不是 pendingPostFlushCbs
    if (
      !activePostFlushCbs ||
      !activePostFlushCbs.includes(
        cb,
        cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex,
      )
    ) {
      pendingPostFlushCbs.push(cb)
    }
  } else {
    //数组是组件生命周期钩子，已由主队列的任务去重，无需再查重
    pendingPostFlushCbs.push(...cb)
  }
  queueFlush()
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
  //正在刷新或已有微任务在等待时，不重复注册
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    //调度器更新期间持有的 Promise
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

:::

### 3.3 核心刷新函数

`flushJobs` 先排序主队列，再依次执行主队列与后置队列中的任务。

:::code-group

```typescript [scheduler.ts]
type CountMap = Map<SchedulerJob, number>
let isFlushing = false

function flushJobs(seen?: CountMap) {
  isFlushPending = false
  isFlushing = true

  // 1. 刷新前先排序：id 小的父组件先于子组件执行，
  //    同一 id 时 pre 回调优先；父组件更新中卸载的子组件任务会被跳过
  queue.sort(comparator)

  try {
    // 2. 执行主队列（job）。pre 回调也在主队列中，
    //    但通常在 renderer 中被 flushPreFlushCbs 提前取走执行
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        job()
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    // 3. 执行后置队列（post），执行过程中新增的回调会增补进当前批次
    flushPostFlushCbs(seen)

    isFlushing = false
    currentFlushPromise = null

    // 4. 如果刷新过程中又有新任务加入，继续递归刷新
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen)
    }
  }
}

//由 renderer 在组件 props 更新后、render 之前调用：
//遍历主队列，挑出 pre: true 的任务执行并从队列中移除
export function flushPreFlushCbs(
  seen?: CountMap,
  //正在刷新时跳过当前任务自身
  i = isFlushing ? flushIndex + 1 : 0,
) {
  for (; i < queue.length; i++) {
    const cb = queue[i]
    if (cb && cb.pre) {
      queue.splice(i, 1)
      i--
      cb()
    }
  }
}

//依次处理后置队列中的任务
function flushPostFlushCbs(seen?: CountMap) {
  if (pendingPostFlushCbs.length) {
    // 1. 复制并去重当前队列
    const deduped = [...new Set(pendingPostFlushCbs)]
    // 2. 立即清空原队列
    pendingPostFlushCbs.length = 0

    // 3. 已有嵌套的 flushPostFlushCbs 正在执行时，合并进当前批次
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }

    activePostFlushCbs = deduped
    // 4. 后置回调也按 id 排序，保证父子组件的 post 钩子顺序
    activePostFlushCbs.sort((a, b) => getId(a) - getId(b))

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      activePostFlushCbs[postFlushIndex]()
    }
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}
```

:::

注意 `flushJobs` 本身**不执行 pre 队列**。pre 回调由 renderer 在组件 props 更新后、render 之前调用 `flushPreFlushCbs` 触发（`renderer.ts:1585`）；根级 `render` 结束时也会再调用一次（`renderer.ts:2326`），随后才执行 `flushPostFlushCbs`。

## 4. 调度策略与 `watch` 的 `flush` 选项

`watch` 的三种 `flush` 模式与调度器的对应关系如下：

[width(17,55,28)]

| `flush` 选项    | 调度函数                                         | 队列                  |
| --------------- | ------------------------------------------------ | --------------------- |
| `'pre'`（默认） | `queueJob`（先把 `job.pre` 设为 `true`）         | 主队列 `queue`        |
| `'post'`        | `queuePostFlushCb`（经 `queuePostRenderEffect`） | `pendingPostFlushCbs` |
| `'sync'`        | 不经过调度器，直接执行                           | 无                    |

在 `doWatch` 中创建 `ReactiveEffect` 时，会根据 `flush` 选项设置 `scheduler`：

```typescript
if (flush === 'sync') {
  //同步执行，适用于需要立即响应的场景（效率较低）。
  scheduler = job as any
} else if (flush === 'post') {
  //组件更新后执行，可以访问新 DOM。
  scheduler = () => queuePostRenderEffect(job)
} else {
  //pre：标记任务并复用组件 uid 作为排序 id，之后与组件更新任务共用主队列。
  job.pre = true
  if (instance) job.id = instance.uid
  scheduler = () => queueJob(job)
}
```

## 5. 组件渲染与调度器的整合

在组件初始化时，会创建一个渲染 `effect`，其 `scheduler` 为 `queueJob(instance.update)`。

```typescript
//当响应式数据变化，`trigger` 调用该 `scheduler`，将 `instance.update` 加入主队列。
//在 `flushJobs` 执行主队列时，`instance.update` 会调用 `patch` 更新 DOM。
const effect = new ReactiveEffect(componentUpdateFn, () =>
  queueJob(instance.update),
)
```

## 6. 完整流程图

![Logo](/img/scheduler.png)

## 7. 总结

[width(15,36,49)]

| 模块       | 核心实现                       | 关键特性                         |
| ---------- | ------------------------------ | -------------------------------- |
| 任务队列   | `queue`, `pendingPostFlushCbs` | 主队列按 id 排序，pre 优先       |
| 入队函数   | `queueJob`, `queuePostFlushCb` | 二分插入、去重、防递归           |
| 刷新函数   | `flushJobs`                    | 排序后遍历主队列，再执行后置队列 |
| 微任务注册 | `queueFlush` + `nextTick`      | 异步批量                         |
| 公共 API   | `nextTick`                     | 等待 DOM 更新                    |
