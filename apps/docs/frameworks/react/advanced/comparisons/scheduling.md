# React 调度与 Vue 3 调度器：优先级抢占与微任务合并的分野

调度（Scheduling）回答的是框架最底层的问题：**状态变化之后，更新任务在什么时候、以什么顺序、以多大粒度获得主线程的执行权。** React 和 Vue 3 在这里走向两条相反的路：React 引入 **Lane 位掩码 + Scheduler 时间切片**，把更新拆成可抢占、可中断、可重放的工作单元，用「**让出主线程**」换取交互的流畅；Vue 3 则基于 **微任务（microtask）队列**做批处理，把同一轮事件循环内的重复更新合并成一次渲染，用「**去重 + 排序 + 时序**」换取简单与可预测。前者解决的是「**长时间工作的执行权分配**」，后者解决的是「**同一轮循环内的重复更新合并**」。

## 1. [React：Lane 模型与优先级](../core-design/schedulingAndLanes.md)

### 1.1 Lane 位掩码

React 用 **31 位二进制数**表示更新优先级，每一种更新来源占用不同的位（bit）。一个 Fiber 上可以同时存在多个待处理更新，它们通过「**按位或**」合并成一个 `lanes` 集合：

```javascript
// Lane 使用 31 位二进制表示——每种更新来源占用不同位
const SyncLane: Lane =            0b0000000000000000000000000000001  // 1（同步，最高优先级）
const InputContinuousLane: Lane = 0b0000000000000000000000000000100  // 4（连续输入）
const DefaultLane: Lane =         0b0000000000000000000000000010000  // 16（默认）
const TransitionLane1: Lane =     0b0000000000000000000001000000000  // 512（startTransition）
const IdleLane: Lane =            0b0100000000000000000000000000000  // 2^30（空闲）
```

Lane 模型之所以用「**位掩码**」而非枚举数值，是为了用**单条 CPU 指令**完成优先级集合的合并、判断、取最高与剔除：

```javascript
// Lane 位运算——用单次 CPU 指令实现高效优先级操作
const lanes = SyncLane | DefaultLane // 合并多个更新来源
const isSync = (lanes & SyncLane) !== NoLanes // 判断是否包含同步更新
const highest = getHighestPriorityLane(lanes) // clz32 取最高优先级的位
lanes &= ~completedLane // 剔除已完成的 Lane
const remaining = lanes & ~entangledLanes // 跳过纠缠 Lane
```

> [!NOTE]
> Lane 之间存在**纠缠（Entanglement）**：某些 Lane 必须成组处理——例如 `TransitionLane` 与它对应的 `RetryLane` 纠缠，对前者工作时必须连同后者一起合并到 `lanes` 中，否则会破坏更新的一致性。

### 1.2 不同更新来源分配不同 Lane

更新来源决定优先级，优先级决定是否可被打断。React 通过「**事件类型 → Lane 映射**」自动分配，开发者通常无需手动指定：

```jsx
// 点击事件 → SyncLane（最高优先级，同步执行、不可中断）
<button onClick={() => setCount(c => c + 1)}>+1</button>

// 输入事件 → InputContinuousLane（高优先级，连续交互需尽快响应）
<input onChange={e => setQuery(e.target.value)} />

// startTransition → TransitionLane（低优先级，可被高优先级打断）
startTransition(() => {
  setSearchResults(search(query)) // 查询结果标记为非紧急，渲染让位给输入
})
```

| 更新来源           | 对应 Lane             | 优先级 | 可被中断 | 典型场景           |
| ------------------ | --------------------- | ------ | -------- | ------------------ |
| 事件 / `flushSync` | `SyncLane`            | 最高   | 否       | 点击、受控输入     |
| 连续输入           | `InputContinuousLane` | 高     | 否       | 拖拽、滚动、输入   |
| 普通 `setState`    | `DefaultLane`         | 中     | 是       | 数据请求返回       |
| `startTransition`  | `TransitionLane`      | 低     | 是       | 搜索建议、路由切换 |
| 空闲任务           | `IdleLane`            | 最低   | 是       | 预渲染、日志上报   |

### 1.3 从 Lane 到调度决策

更新入队后，Lane 会沿 Fiber 的 `return` 路径**向上冒泡**，逐级合并到祖先节点的 `childLanes`，最终汇总到根节点。`ensureRootIsScheduled` 从根节点的 `pendingLanes` 中选出最高优先级，决定本次渲染走「**同步**」还是「**并发**」路径：

```javascript
// ensureRootIsScheduled —— 根据最高优先级 Lane 选择执行方式（简化）
function ensureRootIsScheduled(root, currentTime) {
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  )

  if (nextLanes === NoLanes) return // 无待处理更新

  const newCallbackPriority = getHighestPriorityLane(nextLanes)

  if (includesSyncLane(newCallbackPriority)) {
    // SyncLane：立即同步执行，不可中断、不可时间切片
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
  } else {
    // 非同步：交给 Scheduler，以时间切片方式调度
    const schedulerPriorityLevel = lanesToEventPriority(nextLanes)
    scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    )
  }
}
```

## 2. [React：Scheduler 与时间切片](../source-code/scheduler.md)

Scheduler 是**独立于 React 协调器**的通用任务调度库。它维护一个按 `expirationTime` 排序的**最小堆**，并借助宿主平台（`MessageChannel` / `setImmediate`）驱动工作循环，在时间片内执行任务、在时间片耗尽时让出主线程。

### 2.1 优先级 → 超时映射

每个调度优先级都对应一个「**超时时间**」：任务入队时的 `expirationTime = currentTime + timeout`。超时越短，任务越早「过期」，一旦过期就**强制同步执行、不再被时间切片打断**，从而避免低优先级任务被饿死：

```javascript
// Scheduler 优先级 → 超时时间映射
// 超时越短，任务越快"过期"从而强制同步执行，不会被时间切片打断
IMMEDIATE_PRIORITY_TIMEOUT = -1 // 立即过期（同步，等价于 SyncLane）
USER_BLOCKING_PRIORITY_TIMEOUT = 250 // 250ms（用户交互）
NORMAL_PRIORITY_TIMEOUT = 5000 // 5s（默认）
LOW_PRIORITY_TIMEOUT = 10000 // 10s（低优先级）
IDLE_PRIORITY_TIMEOUT = 1073741823 // 2^31-1，永不过期（仅空闲时执行）
```

### 2.2 工作循环与时间切片

```javascript
// Scheduler 的工作循环——每个时间片约 5ms（简化）
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime
  currentTask = peek(taskQueue) // 从最小堆取最高优先级任务

  while (currentTask !== null) {
    // 任务未过期 且 时间片用完 → 暂停，归还主线程
    if (currentTask.expirationTime > currentTime && !hasTimeRemaining) {
      break
    }

    const callback = currentTask.callback
    if (typeof callback === 'function') {
      currentTask.callback = null
      const didTimeout = currentTask.expirationTime <= currentTime

      // 执行任务，continuationCallback 不为 null 表示任务未完
      const continuationCallback = callback(didTimeout)
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback // 保留 continue 回调
      } else {
        if (currentTask === peek(taskQueue)) pop(taskQueue)
      }
    } else {
      pop(taskQueue)
    }

    currentTask = peek(taskQueue)
  }

  // true = 还有工作 → 需要再次调度
  return currentTask !== null
}
```

「**时间切片**」的本质是：React 的并发渲染函数 `performConcurrentWorkOnRoot` 在每次处理完一个 Fiber 工作单元后检查 `shouldYield()`，一旦用尽约 5ms 的时间片，就返回一个 `continuationCallback`，把「**还没做完的工作**」交还给 Scheduler，主线程得以在下一次宏任务中响应更高优先级输入。

```javascript
// shouldYield —— 时间片用尽即让出主线程，workInProgress 保存现场待下一帧恢复
function shouldYield() {
  const timeElapsed = getCurrentTime() - startTime
  return timeElapsed > frameInterval // 约 5ms
}
```

### 2.3 宿主驱动：MessageChannel

Scheduler 需要一种「**把控制权交还给事件循环、待下一宏任务再取回**」的手段。浏览器端首选 `MessageChannel`（比 `setTimeout(0)` 精度更高、不被节流），Node 端退回 `setImmediate`：

```javascript
// Scheduler 的宿主调度（简化）
const channel = new MessageChannel()
const port = channel.port2

channel.port1.onmessage = () => {
  performWorkUntilDeadline() // 下一次宏任务开始时继续工作循环
}

function requestHostCallback() {
  port.postMessage(null) // 触发一次异步消息，调度下一次执行
}
```

### 2.4 自动批处理与 flushSync

React 的批处理与 Scheduler 协同工作：同一批 `setState` 产生的多次更新被合并到同一 Lane 集合，只触发一次渲染。**React 18 起实现了「自动批处理」**——不再局限于 React 事件处理器，`Promise`、`setTimeout`、原生事件监听器中的多次 `setState` 同样会被合并：

```jsx
// React 18 自动批处理：异步回调中也能合并
async function handleSubmit() {
  const data = await fetch('/api')
  setLoading(false) // 与下方合并为 1 次渲染
  setData(data) // ← 不再需要手动 unstable_batchedUpdates
}

// flushSync：显式逃逸批处理，强制同步刷新
import { flushSync } from 'react-dom'
flushSync(() => setCount(c => c + 1)) // 立即同步渲染，跳过批处理
```

## 3. [Vue 3：微任务批量调度](../../../vue/advanced/source-code/scheduler/scheduler.md)

Vue 3 的调度器不关心「时间切片」，它关心的是「**去重、排序与时序**」。当响应式数据变化触发组件更新 Effect 的 `scheduler` 时，组件更新任务被压入队列，并在**当前事件循环末尾的微任务**中统一执行。

### 3.1 任务队列与去重

```javascript
// Vue 3 Scheduler — 基于微任务的批量更新（简化）
const queue: SchedulerJob[] = []       // 待执行的组件更新任务
let isFlushing = false                 // 是否正在刷新
let isFlushPending = false             // 是否已安排刷新

function queueJob(job: SchedulerJob) {
  // 1. 去重：同一个 job 不在队列中则加入
  if (!queue.includes(job)) {
    queue.push(job)
  }

  // 2. 如果还没安排刷新，安排一个微任务
  if (!isFlushPending && !isFlushing) {
    isFlushPending = true
    Promise.resolve().then(flushJobs)  // 微任务——在当前事件循环末尾执行
  }
}

function flushJobs() {
  isFlushPending = false
  isFlushing = true

  // 3. 按 id（组件创建顺序，父→子）排序
  queue.sort((a, b) => a.id - b.id)

  // 4. 依次执行每个 job
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i]
    job()  // 实际执行组件的 componentUpdateFn
  }

  // 5. 重置队列
  queue.length = 0
  isFlushing = false
}
```

关键点在于 `queue.sort((a, b) => a.id - b.id)`：`id` 是组件实例的 `uid`，按**创建顺序递增**，因此父组件先于子组件更新，保证了更新结果从父到子依次传播。

### 3.2 pre / 组件 job / post 三段时序

真实的 Vue 3 调度器在「组件更新 job」的前后还各有一个回调队列，形成「**pre → 组件渲染 → post**」的稳定时序：

```javascript
// 三段时序：pre 回调 → 组件更新 job → post 回调（简化）
const pendingPreFlushCbs = [] // watch flush:'pre'、组件更新前回调
const pendingPostFlushCbs = [] // nextTick、watch flush:'post'、onUpdated

function flushJobs() {
  isFlushPending = false
  isFlushing = true

  flushPreFlushCbs() // ① pre：DOM 更新前（可读旧 DOM）
  queue.sort((a, b) => a.id - b.id)
  for (let i = 0; i < queue.length; i++) queue[i]() // ② 组件渲染 → patch 更新 DOM
  flushPostFlushCbs() // ③ post：DOM 更新后、绘制前

  queue.length = 0
  isFlushing = false
}
```

```javascript
// 组件更新过程：同步多次修改 → 1 次 patch
const state = reactive({ count: 0, name: 'A' })

// 在同一个同步代码块中修改多次
state.count = 1
state.count = 2 // ← 前一次还未 flush，job 已去重，不会调两次
state.name = 'B'

// Promise.resolve().then(() => {
//   // 此时才真正执行 1 次 patch——两次 count 变更和 1 次 name 变更合并
//   // render 函数只执行 1 次，生成 1 个新 VNode，patch 1 次
// })
```

### 3.3 nextTick

`nextTick` 直接复用当前正在挂起的刷新 Promise：若已有刷新待执行，就「**搭车**」到它上面；否则退化为一个已 resolved 的 Promise。它保证回调在**本次 DOM 更新完成之后**执行：

```javascript
// nextTick —— 返回一个在 DOM 更新后 resolve 的 Promise（简化）
function nextTick(fn) {
  const p = currentFlushPromise || Promise.resolve()
  return fn ? p.then(fn) : p
}

// 用法：修改数据后等待 DOM 更新
count.value++
await nextTick()
console.log(document.querySelector('div').textContent) // 已是最新值
```

### 3.4 两者批处理的对比示例

```jsx
// React：同一事件处理函数中的多次 setState 自动批处理
function handleClick() {
  setCount(c => c + 1) // Update 1
  setCount(c => c + 1) // Update 2（与 1 在同一事件中批次处理）
  setName('new') // Update 3
}
// → 1 次 Render + 1 次 Commit（React 18 自动批处理）

// Vue 3：同一同步代码块中的多次响应式修改在微任务中合并
function handleClick() {
  count.value++ // 触发依赖通知
  count.value++ // 同上（Scheduler 去重）
  name.value = 'new' // 触发依赖通知
}
// → 1 次组件的 componentUpdateFn 执行 + 1 次 patch
```

## 4. 对比总结

| 维度           | React                                                          | Vue 3                                                   |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| **核心目标**   | 优先级选择、可中断 Render、避免低优先级任务饿死                | 合并同步数据变更、任务去重、保证刷新顺序                |
| **更新优先级** | Lane 位掩码（31 位，按事件来源自动分配）                       | 无等价优先级概念，靠任务 flags 与队列顺序区分           |
| **任务载体**   | Scheduler 通过 `MessageChannel` / `setImmediate` 驱动工作循环  | `Promise.resolve().then()` 驱动微任务刷新               |
| **时间切片**   | 并发 Render 支持，约 5ms 让出主线程                            | 组件更新默认同步完成，不可中断                          |
| **主要队列**   | Scheduler 就绪任务与延时任务两个最小堆；React 内部多类回调队列 | 主 job 队列 + pre / post flush callbacks                |
| **排序依据**   | 按 `expirationTime`（优先级 + 入队时间）                       | 按组件 `id`（创建顺序，父 → 子）                        |
| **延续执行**   | 回调可返回 continuation callback 保存现场、下次恢复            | 一个 job 执行结束后再处理下一个 job，无中断续跑         |
| **饥饿防止**   | 超时机制：过期任务强制同步执行                                 | 不适用——单次更新很快完成，无长期占用                    |
| **逃逸出口**   | `flushSync` 强制同步刷新，跳过批处理                           | `nextTick` 在批处理完成后回调，`flush: 'sync'` 即时执行 |

**关键差异要点：**

- **解决的问题不同**：React 的时间切片控制「**长时间工作的执行权**」——把大任务拆碎、可抢占、可恢复，避免卡顿主线程；Vue 的微任务批处理合并「**同一轮事件循环内的重复更新**」——去重后只渲染一次，避免重复计算。
- **优先级模型的有无**：React 有显式的 Lane 位掩码优先级体系，不同事件来源分配不同优先级；Vue 3 没有面向开发者的优先级概念，更新一视同仁地进队列，只靠 `id` 排序保证父子顺序。
- **可中断性相反**：React 的并发渲染可被更高优先级任务抢占、可中断重放（基于 `baseState` / `baseQueue`）；Vue 3 的单个组件 `patch` 在微任务内同步完成，一旦开始就不会中断。
- **复杂度分布相反**：React 把复杂度留给运行时（Lane 位运算、纠缠、超时、时间切片、任务续跑）；Vue 3 把复杂度压到最低（去重 + 排序 + 三段时序），换来更轻量、更易理解的调度器。
- **各自的代价**：React 需维护 Scheduler 的堆、超时与重放逻辑，心智与运行时开销更高；Vue 3 放弃并发能力，长时间同步更新仍可能阻塞主线程，但换来了确定性与更低的复杂度。
