# 调度与批处理

React 的 Lane 和 Scheduler 是两套协作机制：Lane 表示更新优先级和更新集合，Scheduler 决定任务何时获得主线程时间。并发 Render 可以在时间片结束时让出主线程，也可以被更高优先级更新打断。

Vue 3 Scheduler 的重点是异步批处理和执行顺序。响应式更新进入微任务队列，同一组件任务会被去重，并按 pre、组件 job、post 的时序执行；单个组件更新任务本身通常不会被时间切片打断。

## 1. React：Lane 模型

```javascript
// Lane 使用 31 位二进制表示——每种更新来源占用不同位
const SyncLane: Lane =            0b0000000000000000000000000000001  // 1
const InputContinuousLane: Lane = 0b0000000000000000000000000000100  // 4
const DefaultLane: Lane =         0b0000000000000000000000000010000  // 16
const TransitionLane1: Lane =     0b0000000000000000000001000000000  // 512
const IdleLane: Lane =            0b0100000000000000000000000000000  // 2^30
```

```javascript
// Lane 位运算——用单次 CPU 指令实现高效优先级操作
fiber.lanes |= updateLane // 合并更新
const isSync = (lanes & SyncLane) !== NoLanes // 判断类型
const highest = getHighestPriorityLane(lanes) // 取最高优先级
lanes &= ~completedLane // 移除已完成的
const remaining = lanes & ~entangledLanes // 跳过纠缠 Lane
```

不同更新来源自动分配不同的 Lane：

```jsx
// 点击事件 → SyncLane（最高优先级，同步执行）
<button onClick={() => setCount(c => c + 1)}>+1</button>

// 输入事件 → InputContinuousLane（高优先级，连续交互）
<input onChange={e => setQuery(e.target.value)} />

// startTransition → TransitionLane（低优先级，可被高优先级打断）
startTransition(() => {
  setSearchResults(search(query))
})
```

## 2. React：Scheduler 时间切片

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

```javascript
// Scheduler 优先级 → 超时时间映射
// 超时越短，任务越快"过期"从而强制同步执行，不会被时间切片打断
IMMEDIATE_PRIORITY_TIMEOUT = -1 // 立即过期（同步）
USER_BLOCKING_PRIORITY_TIMEOUT = 250 // 250ms
NORMAL_PRIORITY_TIMEOUT = 5000 // 5s
LOW_PRIORITY_TIMEOUT = 10000 // 10s
IDLE_PRIORITY_TIMEOUT = 1073741823 // 永不过期（仅空闲时执行）
```

## 3. Vue 3：微任务批量调度

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

**两者批处理的对比示例：**

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

| 维度           | React                                                    | Vue 3                                             |
| -------------- | -------------------------------------------------------- | ------------------------------------------------- |
| **核心目标**   | 优先级选择、可中断 Render、避免低优先级任务饿死          | 合并同步数据变更、任务去重、保证刷新顺序          |
| **更新优先级** | Lane 位掩码                                              | 任务 flags、队列顺序与组件层级排序，不等价于 Lane |
| **任务载体**   | Scheduler 通常通过 `MessageChannel` 驱动工作循环         | `Promise.resolve().then()` 驱动微任务刷新         |
| **时间切片**   | 并发 Render 支持                                         | 组件更新默认同步完成                              |
| **主要队列**   | Scheduler 就绪任务和延时任务；React 内部还有多类回调队列 | 主 job 队列以及 pre/post flush callbacks          |
| **延续执行**   | 回调可以返回 continuation callback                       | 一个 job 执行结束后再处理下一个 job               |

React 的时间切片和 Vue 的微任务批处理解决的是不同问题：前者控制长时间工作的执行权，后者合并同一轮事件循环内的重复更新。
