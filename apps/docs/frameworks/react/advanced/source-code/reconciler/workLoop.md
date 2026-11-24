---
outline: [2, 4]
---

# 工作循环

`ReactFiberWorkLoop.old.js` 是 React 18.3.1 运行时的“**心跳**”。它把一次更新拆成两个阶段：

- **Render 阶段**：可计算、可中断，负责构建 `workInProgress` 树。
- **Commit 阶段**：不可中断、同步执行，负责把变更写入真实 DOM 并执行布局副作用。

## 1. 工作循环是什么

工作循环是整个渲染过程的驱动器：它把“**什么时候算、算到哪里、什么时候停**”收敛成一个循环。循环每一轮取出一个 Fiber 作为工作单元，交给 `beginWork` 继续向下，或交给 `completeWork` 收尾向上，直到 `workInProgress === null`，整棵新树构建完成。

### 1.1 一次更新的三个阶段

- **触发**：`setState` / `dispatchSetState` 这类更新函数最终都会调用 `scheduleUpdateOnFiber`，把本次更新的 Lane 合并到根上。
- **Render**：`ensureRootIsScheduled` 选出本轮要处理的Lane，由根任务回调启动渲染——同步走 `renderRootSync`，并发走 `renderRootConcurrent`；这个阶段只计算 `workInProgress` 树，不修改真实 DOM。
- **Commit**：整棵树完成后，`commitRoot` 同步应用变更，并执行布局副作用。

```tree
setState → scheduleUpdateOnFiber → ensureRootIsScheduled
        → Render（可中断）: renderRootSync / renderRootConcurrent
        → Commit（同步）: BeforeMutation → Mutation → Layout
```

Render 可以被更高优先级的更新打断、放弃甚至重来，Commit 一旦开始就必须一次做完。这条边界决定了工作循环与普通递归的差别：它必须能在任意工作单元之间暂停，并在下一轮从断点继续。

### 1.2 递与归：深度优先遍历

每个 Fiber 都会经过两次：向下时执行 `beginWork`，向上返回时执行 `completeWork`。

- **递**：`beginWork`按Fiber类型执行组件逻辑、协调子节点,返回第一个子Fiber；返回`null`表示没有子节点。
- **归**：`completeWork`创建或更新DOM、汇总flags,把控制权交给兄弟节点;没有兄弟就回到父节点继续“**归**”。

### 1.3 可中断与恢复

同步循环 `workLoopSync` 不考虑让出，一直执行到整棵树完成；并发循环 `workLoopConcurrent` 每处理完一个工作单元就调用一次 `shouldYield()`，时间片耗尽时退出函数，把主线程还给浏览器。

React 能“**停在这里、下次接着算**”，靠的是三个支点：

[width(31,69)]

| 机制                      | 作用                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `workInProgress` 全局指针 | 指向下一个待处理的工作单元，让出后可以从断点恢复             |
| `shouldYield()`           | 每个工作单元后检查时间片是否用尽                             |
| `lanes` / `childLanes`    | 记录每个节点和子树上的待处理优先级，恢复时知道该处理哪些子树 |

### 1.4 执行上下文

React 用位掩码记录“**当前正在做什么**”，避免在 Render 或 Commit 中错误地触发新的调度：

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 四类执行上下文，用位掩码表示当前处于哪个阶段。
export const NoContext = /*             */ 0b000
const BatchedContext = /*               */ 0b001 // 事件批处理
const RenderContext = /*                */ 0b010 // Render 阶段
const CommitContext = /*                */ 0b100 // Commit 阶段

// 描述当前处于 React 执行栈的哪一层。
let executionContext = NoContext
```

:::

进入某个阶段时用位或添加标记，退出时恢复旧值：

```js
// 进入 Render 阶段前保存旧上下文。
const prevExecutionContext = executionContext
// 位或：在旧标记上叠加 RenderContext。
executionContext |= RenderContext

// ... 执行 Render

// 退出时恢复，避免影响外层调用。
executionContext = prevExecutionContext
```

这样可以嵌套判断，例如：

```js
if ((executionContext & RenderContext) !== NoContext) {
  // 当前处于 Render 阶段
}
```

`BatchedContext` 用于事件批处理，`RenderContext` 与 `CommitContext` 则保护两个不可重入的阶段。`renderRootSync`、`renderRootConcurrent` 和 `commitRootImpl` 都遵循“**保存旧值 → 设置标记 → 执行 → 恢复旧值**”的模式。

## 2. 从入口开始：更新如何进入工作循环

### 2.1 模块职责

[width(36,64)]

| 函数                            | 职责                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `scheduleUpdateOnFiber`         | 更新入口：标记根上的 Lane，请求根调度                         |
| `ensureRootIsScheduled`         | 选出下一批 Lane，把根任务注册到 Scheduler                     |
| `performConcurrentWorkOnRoot`   | Scheduler 回调：决定时间切片还是同步渲染，完成后进入 Commit   |
| `renderRootSync`                | 同步 Render 主入口：准备 WIP 树，启动同步工作循环             |
| `renderRootConcurrent`          | 并发 Render 主入口：启动可让出的工作循环                      |
| `prepareFreshStack`             | 清理上一轮状态，从 HostRoot 创建新的 WIP                      |
| `workLoopSync`                  | 同步循环：一直执行到 `workInProgress === null`                |
| `workLoopConcurrent`            | 并发循环：每个工作单元后检查 `shouldYield()`                  |
| `performUnitOfWork`             | 单个工作单元：调用 `beginWork`，决定“**向下**”还是“**向上**”  |
| `completeUnitOfWork`            | 回溯逻辑：`completeWork` 后找兄弟，找不到就回父节点           |
| `commitRoot` / `commitRootImpl` | Commit 主入口：BeforeMutation、Mutation、切换 current、Layout |

### 2.2 `scheduleUpdateOnFiber`

`scheduleUpdateOnFiber`不再直接持有**下一个工作单元**,它负责两件事:把更新标记到根上，然后请求根调度。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 更新入口：把本次更新标记到根上，再请求一次根调度。
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  // 省略嵌套更新的 invariant 校验

  // 标记根上有待处理更新,本次更新的优先级会合并进 `root.pendingLanes`
  markRootUpdated(root, lane, eventTime)

  // 省略 Render 阶段更新、Profiler、Transition Tracing 等分支

  //`eventTime`：用于计算 Lane 的过期时间，避免低优先级任务被无限推迟。
  ensureRootIsScheduled(root, eventTime)
  // 省略 legacy 模式下的同步刷新
}
```

:::

### 2.3 `ensureRootIsScheduled`

`ensureRootIsScheduled` 负责把“**根上有哪些 Lane 待处理**”翻译成“**Scheduler 里要不要有一个任务**”。如果已有同优先级的回调，它会直接复用，而不是重复注册。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 把本轮要处理的 Lane 翻译成一次 Scheduler 任务；同优先级的回调直接复用。
function ensureRootIsScheduled(root, currentTime) {
  const existingCallbackNode = root.callbackNode

  // 长时间得不到执行的 Lane 标记为过期，避免饿死。
  markStarvedLanesAsExpired(root, currentTime)

  // 选出本轮要处理的 Lane。
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  )

  if (nextLanes === NoLanes) {
    // 没有待处理工作：取消已有回调并复位状态。
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode)
    }
    root.callbackNode = null
    root.callbackPriority = NoLane
    return
  }

  // 用最高优先级的 Lane 代表本次回调的优先级。
  const newCallbackPriority = getHighestPriorityLane(nextLanes)

  // 省略 act 队列的特判；优先级相同则复用已有任务
  if (root.callbackPriority === newCallbackPriority) {
    return
  }

  if (existingCallbackNode != null) {
    // 新优先级与旧任务不同，先取消旧回调。
    cancelCallback(existingCallbackNode)
  }

  // 把根任务注册到 Scheduler：同步 Lane 走微任务，其余按事件优先级映射。
  let newCallbackNode
  if (newCallbackPriority === SyncLane) {
    // 同步任务不经过 Scheduler，改为在微任务中刷新。
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    if (supportsMicrotasks) {
      scheduleMicrotask(() => {
        if (
          (executionContext & (RenderContext | CommitContext)) ===
          NoContext
        ) {
          flushSyncCallbacks()
        }
      })
    } else {
      scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks)
    }
    newCallbackNode = null
  } else {
    let schedulerPriorityLevel
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority: // 点击、按键
        schedulerPriorityLevel = ImmediateSchedulerPriority
        break
      case ContinuousEventPriority: // 拖拽、滚动
        schedulerPriorityLevel = UserBlockingSchedulerPriority
        break
      case DefaultEventPriority: // 常规更新
        schedulerPriorityLevel = NormalSchedulerPriority
        break
      case IdleEventPriority: // 空闲任务
        schedulerPriorityLevel = IdleSchedulerPriority
        break
      default:
        schedulerPriorityLevel = NormalSchedulerPriority
        break
    }
    // 注册并发渲染回调，由 Scheduler 按时间片执行。
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    )
  }

  root.callbackPriority = newCallbackPriority
  root.callbackNode = newCallbackNode
}
```

:::

### 2.4 两条渲染路径

[width(13,43,44)]

| 维度     | 同步路径                               | 并发路径                                |
| -------- | -------------------------------------- | --------------------------------------- |
| 入口     | `renderRootSync(root, lanes)`          | `renderRootConcurrent(root, lanes)`     |
| 工作循环 | `workLoopSync`                         | `workLoopConcurrent`                    |
| 是否让出 | 否，一直执行到整棵树完成               | 每个工作单元后检查 `shouldYield()`      |
| 触发条件 | 阻塞 Lane、已过期 Lane、Scheduler 超时 | 普通并发更新                            |
| 返回值   | `RootCompleted` 或错误状态             | `RootInProgress` 表示还需要下一轮时间片 |
| 中断恢复 | 不适用                                 | 保留 `workInProgress`，下次从断点继续   |

`performConcurrentWorkOnRoot` 会根据 `includesBlockingLane`、`includesExpiredLane` 和 `didTimeout` 决定走哪条路径：

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 只有非阻塞、未过期且未超时，才走可中断的并发渲染。
const shouldTimeSlice =
  !includesBlockingLane(root, lanes) &&
  !includesExpiredLane(root, lanes) &&
  (disableSchedulerTimeoutInWorkLoop || !didTimeout)

let exitStatus = shouldTimeSlice
  ? renderRootConcurrent(root, lanes) // 可中断的时间切片渲染
  : renderRootSync(root, lanes) // 一口气渲染完整棵树
```

:::

## 3. Render 阶段

### 3.1 入口：`performConcurrentWorkOnRoot`

这个函数是 Scheduler 回调的实际入口。它先冲刷 Passive Effect，再选出本轮 Lane，执行 Render，最后把完成树交给 Commit。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// Scheduler 回调：执行本轮 Render，完成后把结果交给 Commit。
function performConcurrentWorkOnRoot(root, didTimeout) {
  // 清理上一轮遗留的事件时间与 Transition 信息。
  currentEventTime = NoTimestamp
  currentEventTransitionLane = NoLanes

  // 记住原回调，用来判断本轮是否注册了新任务。
  const originalCallbackNode = root.callbackNode

  // Passive Effect 可能产生新的工作，先冲刷
  const didFlushPassiveEffects = flushPassiveEffects()
  if (didFlushPassiveEffects) {
    if (root.callbackNode !== originalCallbackNode) {
      return null
    }
  }

  // 选出本轮要处理的 Lane。
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  )
  if (lanes === NoLanes) {
    return null
  }

  // 阻塞 Lane、过期 Lane 或 Scheduler 超时都必须同步渲染。
  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    (disableSchedulerTimeoutInWorkLoop || !didTimeout)

  let exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes) // 可中断的时间切片渲染
    : renderRootSync(root, lanes) // 一口气渲染完整棵树

  if (exitStatus !== RootInProgress) {
    if (exitStatus === RootErrored) {
      // 出错后先尝试同步重试一次。
      const errorRetryLanes = getLanesToRetrySynchronouslyOnError(root)
      if (errorRetryLanes !== NoLanes) {
        lanes = errorRetryLanes
        exitStatus = recoverFromConcurrentError(root, errorRetryLanes)
      }
    }
    if (exitStatus === RootFatalErrored) {
      // 致命错误：丢弃本轮 WIP，挂起根，再把异常抛给上层。
      const fatalError = workInProgressRootFatalError
      prepareFreshStack(root, NoLanes)
      markRootSuspended(root, lanes)
      ensureRootIsScheduled(root, now())
      throw fatalError
    }
    if (exitStatus === RootDidNotComplete) {
      // 未完成整棵树：先挂起根，等待下一轮继续。
      markRootSuspended(root, lanes)
    } else {
      // 省略与外部 store 的一致性检查
      // 正常完成：把 WIP 树挂到根上，交给 Commit。
      const finishedWork = root.current.alternate
      root.finishedWork = finishedWork
      root.finishedLanes = lanes
      finishConcurrentRender(root, exitStatus, lanes)
    }
  }

  // 为剩余工作重新注册根任务。
  ensureRootIsScheduled(root, now())
  if (root.callbackNode === originalCallbackNode) {
    // 当前任务仍是同一个，返回续体让 Scheduler 继续调用
    return performConcurrentWorkOnRoot.bind(null, root)
  }
  // 根已被新任务接管，结束当前回调。
  return null
}
```

:::

`finishConcurrentRender` 根据 `RootExitStatus` 决定提交、挂起还是延迟提交。正常完成时，它调用 `commitRoot`。

### 3.2 `renderRootSync`

同步Render会用`try/catch`包住工作循环,捕获的异常交给`handleError`沿`return`回溯到最近的错误边界。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 同步 Render 入口：准备 WIP，跑完整个工作循环。
function renderRootSync(root, lanes) {
  const prevExecutionContext = executionContext
  executionContext |= RenderContext
  // 保存并切换 Hooks dispatcher。
  const prevDispatcher = pushDispatcher()

  // 根或 Lane 变化时，丢弃旧栈并准备新的 WIP
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    workInProgressTransitions = getTransitionsForLanes(root, lanes)
    prepareFreshStack(root, lanes)
  }

  // 异常交给 handleError 处理后重试，直到工作循环正常结束。
  do {
    try {
      workLoopSync()
      break
    } catch (thrownValue) {
      handleError(root, thrownValue)
    }
  } while (true)

  // 清空本轮收集的 Context 依赖，恢复执行上下文与 dispatcher。
  resetContextDependencies()
  executionContext = prevExecutionContext
  popDispatcher(prevDispatcher)

  // 省略“同步渲染必须完成整棵树”的 invariant

  // 本轮渲染结束，释放全局的 WIP 根与 Lane 记录。
  workInProgressRoot = null
  workInProgressRootRenderLanes = NoLanes

  return workInProgressRootExitStatus
}
```

:::

### 3.3 `prepareFreshStack`

`prepareFreshStack` 负责清理上一轮渲染的残留状态。它不会无条件覆盖 `workInProgress`，而是先对中断的节点执行 `unwindInterruptedWork`，再从 HostRoot 创建新的 WIP。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 丢弃上一轮的渲染栈，从 HostRoot 创建一个新的 WIP 根。
function prepareFreshStack(root, lanes) {
  // 清空上一轮的完成结果。
  root.finishedWork = null
  root.finishedLanes = NoLanes

  const timeoutHandle = root.timeoutHandle
  if (timeoutHandle !== noTimeout) {
    // 上一轮 Suspense 安排的超时提交不再需要
    root.timeoutHandle = noTimeout
    cancelTimeout(timeoutHandle)
  }

  if (workInProgress !== null) {
    // 中断恢复：沿 return 逐个回溯，弹出未完成节点的上下文
    let interruptedWork = workInProgress.return
    while (interruptedWork !== null) {
      const current = interruptedWork.alternate
      unwindInterruptedWork(
        current,
        interruptedWork,
        workInProgressRootRenderLanes,
      )
      interruptedWork = interruptedWork.return
    }
  }

  workInProgressRoot = root
  // 从 HostRoot 重新创建 WIP 根节点。
  const rootWorkInProgress = createWorkInProgress(root.current, null)
  workInProgress = rootWorkInProgress
  workInProgressRootRenderLanes =
    subtreeRenderLanes =
    workInProgressRootIncludedLanes =
      lanes
  // 新一轮开始，退出状态重置为进行中。
  workInProgressRootExitStatus = RootInProgress

  // 省略错误、ping、跳过 Lane 等状态重置

  // 把并发更新队列里尚未入队的更新补进对应 Hook。
  finishQueueingConcurrentUpdates()

  return rootWorkInProgress
}
```

:::

> [!IMPORTANT]
> 这里是 `workInProgress = rootWorkInProgress`，而不是“**有旧指针就保留**”。真正需要续跑时，`workInProgressRoot` 和 `workInProgressRootRenderLanes` 没有变化，`renderRootConcurrent` 会跳过 `prepareFreshStack`，直接从上次保存的 `workInProgress` 继续。

### 3.4 工作循环

同步循环和并发循环只差一个 `shouldYield()` 条件：

:::code-group

```ts [ReactFiberWorkLoop.old.js]
/** @noinline */
function workLoopSync() {
  // 已超时，持续执行到整棵树完成，不再检查是否让出。
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

/** @noinline */
function workLoopConcurrent() {
  // 每个工作单元后检查是否该让出，直到 Scheduler 要求暂停。
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}
```

```ts [Scheduler.js]
// 本次时间切片的起点；默认帧间隔为 5ms。
let startTime = -1
let frameInterval = 5

function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime
  if (timeElapsed < frameInterval) {
    // 阻塞不足一帧，继续执行当前工作单元。
    return false
  }
  // 省略 enableIsInputPending 下针对绘制与输入的分支。
  return true
}

// React 侧通过 unstable_shouldYield 引用，并别名为 shouldYield。
export { shouldYieldToHost as unstable_shouldYield }
```

```ts [Scheduler.js]
// 官方 18.3.1 的时间源：优先 performance.now()，不可用时退回 Date.now()。
const localDate = Date
const initialTime = localDate.now()
let getCurrentTime
const hasPerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function'
if (hasPerformanceNow) {
  const localPerformance = performance
  getCurrentTime = () => localPerformance.now()
} else {
  getCurrentTime = () => localDate.now() - initialTime
}
```

:::

`shouldYield()` 就是 Scheduler 导出的 `unstable_shouldYield`。它让 React 在时间片用尽后主动让出主线程，浏览器就有机会处理输入、布局和绘制。由于 `workInProgress` 是模块级变量，让出后下一次回调可以直接从断点继续。

### 3.5 `performUnitOfWork`：向下“**递**”

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 处理一个工作单元：向下递，递到底再向上归。
function performUnitOfWork(unitOfWork) {
  // current 是已经提交的版本，也是 diff 的基准
  const current = unitOfWork.alternate

  // 执行当前 Fiber，返回第一个子 Fiber；返回 null 说明该回溯。
  let next = beginWork(current, unitOfWork, subtreeRenderLanes)

  // 本次 pendingProps 已经应用，同步为 memoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps

  if (next === null) {
    // 没有子节点 → 转入“归”
    completeUnitOfWork(unitOfWork)
  } else {
    // 有子节点 → 继续向下
    workInProgress = next
  }
}
```

:::

`beginWork` 返回第一个子 Fiber，或者返回 `null` 表示当前节点没有需要继续处理的子节点。它不负责创建 DOM，只负责“**算出下一层应该有什么**”，详见 [beginWork](/frameworks/react/advanced/source-code/reconciler/beginWork)。

### 3.6 `completeUnitOfWork`：向上“**归**”

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 从当前节点向上回溯，直到遇到兄弟节点或回到根。
function completeUnitOfWork(unitOfWork) {
  // 先完成当前工作单元，再转去下一个兄弟；没有兄弟时回到父节点。
  let completedWork = unitOfWork
  do {
    const current = completedWork.alternate
    // 父节点：没有兄弟时作为下一轮 complete 的目标。
    const returnFiber = completedWork.return

    // 省略 flags & Incomplete 的错误回溯分支
    // 完成当前节点；返回非 null 表示产生了需要优先处理的新工作。
    const next = completeWork(current, completedWork, subtreeRenderLanes)

    if (next !== null) {
      // 完成当前节点时产生了新的工作，优先处理它
      workInProgress = next
      return
    }

    const siblingFiber = completedWork.sibling
    if (siblingFiber !== null) {
      // 有兄弟节点 → 兄弟成为下一个工作单元
      workInProgress = siblingFiber
      return
    }

    // 没有兄弟节点 → 回到父节点继续 complete
    completedWork = returnFiber
    workInProgress = completedWork
  } while (completedWork !== null)

  // 已经回溯到根之上，整棵树完成
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted
  }
}
```

:::

当 `completedWork` 变成 `null` 时，说明已经回溯到 HostRoot 之上，整棵树处理完毕。`completeWork` 负责创建 DOM、初始化属性、挂载子节点并汇总 `subtreeFlags`，详见 [completeWork](/frameworks/react/advanced/source-code/reconciler/completeWork)。

### 3.7 `handleError`

`renderRootSync` 和 `renderRootConcurrent` 都用 `try/catch` 包住工作循环。异常不会直接冒泡给调用方，而是交给 `handleError`：

- 从当前 `workInProgress` 沿 `return` 向上查找最近的有错误处理能力的 Fiber。
- 找到错误边界后，给它打上 `ShouldCapture` / `DidCapture`，并安排一次重新渲染。
- 找不到边界时，回退到 `HostRoot` 捕获：给它打上 `ShouldCapture`、入队一条 root error update，重新渲染时卸载整棵树。`RootFatalErrored` 只在 `handleError` 遇到 `erroredWork === null`（错误发生在根自身、没有可回退的 Fiber）时设置。
- 中途失败的节点会带上 `Incomplete`，`completeUnitOfWork` 通过 `unwindWork` 弹出上下文而不是执行正常的完成逻辑。

### 3.8 `RootExitStatus`

[width(31,8,61)]

| 常量                     | 值  | 含义                            |
| ------------------------ | --- | ------------------------------- |
| `RootInProgress`         | 0   | 尚未完成，需要继续工作          |
| `RootFatalErrored`       | 1   | 致命错误，没有错误边界可以捕获  |
| `RootErrored`            | 2   | 渲染出错，已尝试同步重试        |
| `RootSuspended`          | 3   | 挂起，但有可接受的 loading 状态 |
| `RootSuspendedWithDelay` | 4   | 挂起，并延迟提交 fallback       |
| `RootCompleted`          | 5   | 完成，可以提交                  |
| `RootDidNotComplete`     | 6   | 未完成整棵树，不能提交          |

### 3.9 完整流程图

```mermaid
flowchart TD
    A[scheduleUpdateOnFiber] --> B[markRootUpdated]
    B --> C[ensureRootIsScheduled]
    C --> D[nextLanes 非空?]
    D -- 否 --> E[取消旧任务]
    D -- 是 --> F{shouldTimeSlice?}
    F -- 是 --> G[renderRootConcurrent]
    F -- 否 --> H[renderRootSync]
    G --> I[prepareFreshStack]
    H --> I
    I --> J[workLoopConcurrent / workLoopSync]
    J --> K[performUnitOfWork]
    K --> L[beginWork]
    L -->|返回 child| M[workInProgress = child]
    M --> K
    L -->|返回 null| N[completeUnitOfWork]
    N --> O[completeWork]
    O --> P{有 sibling?}
    P -- 是 --> Q[workInProgress = sibling]
    Q --> K
    P -- 否 --> R{回到父节点}
    R --> O
    R -->|到根之上| S[RootCompleted]
    S --> T[finishConcurrentRender]
    T --> U[commitRoot]
```

## 4. Commit 阶段

### 4.1 `commitRoot`

`commitRoot` 只是对 `commitRootImpl` 的薄包装，用来临时切换到 `DiscreteEventPriority`，并保存/恢复 Transition 配置。

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// Commit 入口：切到离散事件优先级，结束后恢复原配置。
function commitRoot(root, recoverableErrors, transitions) {
  const previousUpdateLanePriority = getCurrentUpdatePriority()
  const prevTransition = ReactCurrentBatchConfig.transition

  try {
    // Commit 期间使用离散事件优先级，并暂时清空 Transition 配置。
    ReactCurrentBatchConfig.transition = null
    setCurrentUpdatePriority(DiscreteEventPriority)
    commitRootImpl(
      root,
      recoverableErrors,
      transitions,
      previousUpdateLanePriority,
    )
  } finally {
    // 结束后恢复进入前的优先级与 Transition 配置。
    ReactCurrentBatchConfig.transition = prevTransition
    setCurrentUpdatePriority(previousUpdateLanePriority)
  }

  return null
}
```

:::

### 4.2 `commitRootImpl`：四个关键动作

:::code-group

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// Commit 主流程：冲刷 Passive Effect，依次执行三个同步子阶段，最后切换 current。
function commitRootImpl(
  root,
  recoverableErrors,
  transitions,
  renderPriorityLevel,
) {
  do {
    // Passive Effect 可能会产生新的 Passive Effect，循环冲刷干净
    flushPassiveEffects()
  } while (rootWithPendingPassiveEffects !== null)

  // 取出 Render 阶段产出的 WIP 树与本轮对应的 Lane。
  const finishedWork = root.finishedWork
  const lanes = root.finishedLanes

  if (finishedWork === null) {
    // 没有完成的树，说明本轮没有可提交的工作。
    return null
  }

  // 清空完成状态，避免同一棵树被重复提交。
  root.finishedWork = null
  root.finishedLanes = NoLanes

  // 清空本轮回调，允许 Commit 期间注册新的任务
  root.callbackNode = null
  root.callbackPriority = NoLane

  // 标记本轮 Lane 已完成，剩余 Lane 继续留在根上等待下一轮。
  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes)
  markRootFinished(root, remainingLanes)

  if (root === workInProgressRoot) {
    // 释放本轮渲染的全局 WIP 引用。
    workInProgressRoot = null
    workInProgress = null
    workInProgressRootRenderLanes = NoLanes
  }

  // 如果整棵树存在 Passive Effect，先注册异步回调
  if (
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
    (finishedWork.flags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true
      // 记录本轮剩余 Lane 与 Transition，供 flushPassiveEffects 使用。
      pendingPassiveEffectsRemainingLanes = remainingLanes
      pendingPassiveTransitions = transitions
      // 用 Normal 优先级调度，回调在浏览器绘制后执行。
      scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects()
        return null
      })
    }
  }

  // 先判断整棵树是否存在需要提交的副作用；没有就只切换 current。
  const subtreeHasEffects =
    (finishedWork.subtreeFlags &
      (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags
  const rootHasEffect =
    (finishedWork.flags &
      (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags

  if (subtreeHasEffects || rootHasEffect) {
    // 保存并切换执行上下文、优先级与 Transition 配置。
    const prevExecutionContext = executionContext
    const prevTransition = ReactCurrentBatchConfig.transition
    const previousPriority = getCurrentUpdatePriority()
    executionContext |= CommitContext

    // Commit 期间统一按离散事件优先级执行，并暂时关闭 Transition。
    ReactCurrentBatchConfig.transition = null
    setCurrentUpdatePriority(DiscreteEventPriority)

    // 1. BeforeMutation：读取 DOM 变更前的快照
    commitBeforeMutationEffects(root, finishedWork)

    // 2. Mutation：插入、删除、更新 DOM
    commitMutationEffects(root, finishedWork, lanes)
    // 交给宿主环境做 Mutation 后的收尾（如恢复选择与事件监听）。
    resetAfterCommit(root.containerInfo)

    // 3. 切换 current：WIP 树正式成为当前树
    root.current = finishedWork

    // 4. Layout：同步执行 useLayoutEffect / componentDidMount
    commitLayoutEffects(finishedWork, root, lanes)
    // 通知宿主尽快绘制，让布局阶段的变更出现在下一帧。
    requestPaint()

    // 恢复执行上下文、更新优先级与 Transition 配置。
    executionContext = prevExecutionContext
    setCurrentUpdatePriority(previousPriority)
    ReactCurrentBatchConfig.transition = prevTransition
  } else {
    // 没有副作用，只需要切换 current
    root.current = finishedWork
  }

  // 省略 root.pendingLanes 剩余工作检查与 Passive Effect 收尾
}
```

:::

### 4.3 Commit 子阶段

[width(13,23,18,46)]

| 子阶段         | 入口函数                      | 执行时机                        | 典型工作                                                                               |
| -------------- | ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| BeforeMutation | `commitBeforeMutationEffects` | 同步，DOM 变更前                | `getSnapshotBeforeUpdate`、读取 DOM 变更前的快照                                       |
| Mutation       | `commitMutationEffects`       | 同步，DOM 变更中                | 插入/删除/更新 DOM、解绑 ref、执行 `useLayoutEffect` 的清理函数                        |
| Layout         | `commitLayoutEffects`         | 同步，切换 `current` 后、绘制前 | 执行 `useLayoutEffect` 的 create、`componentDidMount` / `componentDidUpdate`、绑定 ref |
| Passive        | `flushPassiveEffects`         | 异步，浏览器绘制后              | 执行 `useEffect` 的 create 与清理函数；由 `scheduleCallback` 调度，不阻塞首屏          |

BeforeMutation、Mutation、Layout 在`commitRootImpl`中同步、按序执行，中间不会让出主线程；任一阶段抛出的异常都会交给 `captureCommitPhaseError`，由最近的错误边界处理。Passive只注册`scheduleCallback(NormalSchedulerPriority,flushPassiveEffects)`，执行发生在当前帧的绘制之后。

`flushPassiveEffects` 会检查 `rootWithPendingPassiveEffects`，避免同一个根上的 Passive Effect 被重复执行；如果在执行过程中又产生了新的 Passive Effect，`commitRootImpl` 开头的 `do...while` 会继续冲刷，直到队列为空。

## 5. 总结

[width(13,87)]

| 维度     | React 18.3.1 的实现                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 更新入口 | `scheduleUpdateOnFiber` 标记根 Lane，`ensureRootIsScheduled` 用 `lane` + `eventTime` 选出本轮工作并映射成 Scheduler 优先级 |
| Render   | `beginWork` “**递**”、`completeWork` “**归**”，从 HostRoot 创建 WIP，依靠 `childLanes` 决定这次处理哪些子树                |
| 并发     | `workLoopConcurrent` + `shouldYield()` 中断，靠全局 `workInProgress` 从断点恢复                                            |
| Commit   | 严格按 BeforeMutation → Mutation → 切换 `current` → Layout 执行，Passive Effect 通过 `scheduleCallback` 推迟到绘制之后     |
| 错误处理 | `handleError` 交给错误边界；失败节点带 `Incomplete` 回溯，没有边界时整棵树标记为 `RootFatalErrored`                        |
