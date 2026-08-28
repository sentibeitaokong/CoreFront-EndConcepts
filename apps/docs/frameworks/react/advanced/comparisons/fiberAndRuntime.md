# Fiber 架构与 Vue 3 运行时：状态机的不同归宿

前端框架的运行时机制决定了其性能上限与开发体验。React 通过 **Fiber 架构** 将渲染过程打造成可中断、可优先级的协程模型，而 Vue 3 则依靠 **响应式系统 + 模块化运行时** 实现精确的依赖追踪与批量更新。

## 1. React Fiber：用户态协程与全功能节点

### 1.1 Fiber 节点的多重身份

一个 Fiber 节点不仅仅是虚拟 DOM 的映射，它身兼数职：

- **作为工作单元**：每个 Fiber 代表一个需要处理的“**任务**”，携带优先级（`lanes`）和副作用标记（`flags`）。
- **作为状态容器**：存储组件实例、Hooks 链表、更新队列等运行时状态。
- **作为链表节点**：通过 `child`、`sibling`、`return` 指针形成可遍历的树结构，支持深度优先遍历的暂停与恢复。

### 1.2 Fiber数据结构

Fiber 架构是 React 为了实现并发渲染（Concurrent Mode）而发明的用户态协程。一个 Fiber 节点是一个非常庞大的数据结构，它不仅是 DOM 树的映射，更是组件状态的容器、更新任务的载体。

:::code-group

```javascript [Fiber 核心结构分类]
type Fiber = {
  // === 1. 实例与身份 (Identity) ===
  tag: WorkTag,            // 标识节点类型 (如 0 代表函数组件, 5 代表原生DOM)
  type: any,               // 函数/类引用 或 标签字符串

  // === 2. 协程树拓扑 (Linked List Tree) ===
  return: Fiber | null,    // 父亲指针 (执行完毕后的返回目标)
  child: Fiber | null,     // 大儿子指针
  sibling: Fiber | null,   // 二弟指针
  // 这种结构使得深度优先遍历变成了一个可以随时暂停并利用 return 恢复的线性 while 循环

  // === 3. 状态与数据闭环 (State) ===
  pendingProps: any,       // 本次渲染即将应用的 props
  memoizedProps: any,      // 上次渲染生效的 props
  memoizedState: any,      // Hooks 链表头部 (单向链表，挂载 useState/useEffect 等)
  updateQueue: any,        // 状态更新环形队列 (收集所有 dispatch)

  // === 4. 副作用与并发标记 (Effects & Scheduling) ===
  flags: Flags,            // 自身的副作用标记 (Placement, Update, Deletion)
  subtreeFlags: Flags,     // 子树副作用冒泡合集 (用于 Commit 阶段 $O(1)$ 跳过干净子树)
  lanes: Lanes,            // 当前节点的任务优先级

  // === 5. 双缓冲架构 (Double Buffering) ===
  alternate: Fiber | null, // 指向对应树的替身 (current ↔ workInProgress)

  // --- 调度相关 ---
  index: number,             // 在兄弟节点中的位置
  ref: any,                  // ref 对象或函数
  _debugOwner: Fiber | null, // 调试用
}
```

:::

### 1.3 遍历与中断机制

Fiber 的遍历不再是递归，而是循环驱动的”**工作循环（Work Loop）**”。每个 Fiber 节点被视为一个原子工作单元，执行 `beginWork`（递）和 `completeWork`（归）。在并发模式下，每次处理完一个节点后，都会检查时间切片是否用尽（`shouldYield()`），如果主线程需要响应更高优先级任务（如用户输入），则暂停当前工作，保存现场（`workInProgress` 指针），待下一帧恢复。

```javascript
// workLoopConcurrent —— 可中断的工作循环（简化）
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress) // 每次处理一个 Fiber 原子工作单元
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  let next = beginWork(current, unitOfWork) // 「递」：进入子节点
  if (next === null) {
    completeUnitOfWork(unitOfWork) // 「归」：子节点处理完毕，回溯
  } else {
    workInProgress = next // 指针下移，继续向下遍历
  }
}

// shouldYield —— 时间片用尽即让出主线程，workInProgress 保存现场待下一帧恢复
function shouldYield() {
  return getCurrentTime() - startTime > frameInterval // 约 5ms
}
```

### 1.4 双缓冲与提交

React 维护两棵 Fiber 树：**当前树（current）** 反映屏幕上的 UI，**工作树（workInProgress）** 在内存中构建新的 UI 状态。两者通过 `alternate` 指针互相引用。当工作树构建完成，一次性地切换 `root.current = finishedWork`，完成”**提交（Commit）**”，实现原子性更新。

```javascript
// 双缓冲：current 与 workInProgress 通过 alternate 互指（简化）
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate
  if (workInProgress === null) {
    // 首次渲染：新建 WIP，与 current 互设 alternate
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 复用上次 WIP，重置动态字段（flags / lanes 等）
    workInProgress.pendingProps = pendingProps
  }
  return workInProgress
}

// 提交：一次性切换指针，完成原子性更新（简化）
function commitRoot(root) {
  const finishedWork = root.finishedWork // 已构建完成的 WIP 树
  commitMutationEffects(root, finishedWork) // 应用真实 DOM 变更
  root.current = finishedWork // ← 原子切换：WIP 变为 current
}
```

## 2. Vue 3 运行时：分层协作的响应式引擎

Vue 3 并未采用类似 Fiber 的单一大结构，而是将职责拆分到多个独立模块，各司其职，协同完成高效的 UI 更新。

### 2.1 核心协作模块

- **`VNode`**：描述 UI 结构的轻量对象，可携带编译期优化标记（如 `patchFlag`）。
- **`ComponentInternalInstance`**：组件实例的运行时上下文，包含状态、props、slots、生命周期等。
- **`ReactiveEffect`**：响应式系统的执行单元，负责收集依赖并在数据变化时触发回调（如组件重新渲染）。
- **`Scheduler`**：任务调度器，管理异步更新队列，实现批量处理和微任务时序控制。

### 2.2 组件实例的结构

```javascript
type ComponentInternalInstance = {
  uid: number,
  type: ConcreteComponent,
  parent: ComponentInternalInstance | null,
  root: ComponentInternalInstance,          // 根组件实例
  vnode: VNode,                             // 当前实例的 VNode
  subTree: VNode | null,                    // 组件渲染的子树（上次结果）
  next: ComponentInternalInstance | null,   // 更新队列链表

  // 状态
  setupState: Data,                         // setup() 返回的响应式状态
  props: Data,                              // 外部传入的 props
  attrs: Data,                              // 非 prop 属性
  slots: InternalSlots,                     // 插槽内容
  refs: Data,                               // ref 集合

  // 响应式更新
  update: ReactiveEffect,                   // 组件的渲染 Effect
  isMounted: boolean,
  isUnmounted: boolean,

  // 生命周期钩子数组
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook[],
  [LifecycleHooks.MOUNTED]: LifecycleHook[],
  // ... 等
};
```

### 2.3 响应式更新流程

- **数据变化**：响应式对象（`reactive` 或 `ref`）的 setter 触发 `trigger`。
- **收集依赖**：`trigger` 查找该属性对应的 `Dep`（依赖集合），取出所有订阅的 `ReactiveEffect`。
- **调度执行**：每个 `ReactiveEffect` 可能绑定 `scheduler`（如组件的更新 Effect 会走 `scheduler` 入队到微任务）。
- **批量更新**：`Scheduler` 将多个更新任务合并到同一个微任务中，避免重复渲染。
- **组件渲染**：执行组件的 `render` 函数生成新的 VNode 树，调用 `patch` 进行 DOM 更新。

### 2.4 组件更新 Effect 的特殊性

每个组件的渲染函数被包装成一个 `ReactiveEffect`，在挂载时执行一次并自动收集依赖。当依赖数据变化时，该 Effect 的 `scheduler` 被触发，将组件更新任务加入调度队列。这种设计使得 Vue 能够精细地知道”**哪个组件依赖了哪些数据**”，从而只更新需要更新的组件，实现点对点的精准更新。

```javascript
// 组件渲染 Effect 的特殊性：绑定 scheduler，依赖变化走队列而非立即执行（简化）
const instance = {
  update: new ReactiveEffect(
    componentUpdateFn, // 重新执行 render → 生成新 VNode → patch
    () => queueJob(instance.update), // scheduler：数据变化时入队去重，而非立即 run
  ),
}

// trigger 的统一分支：普通 effect 立即 run，组件更新 effect 交给 scheduler（简化）
function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => {
    effect.scheduler ? effect.scheduler() : effect.run()
  })
}
```

## 3. 对比总结

```markdown
React(双缓冲)：单一 Fiber 节点 = 状态容器 + 更新队列 + 副作用记录 + 调度信息 + 树拓扑
所有信息集中在一个节点上，通过 alternate 实现双缓冲

Vue 3（树比对）：将职责按关注点分离
组件实例存状态、VNode 存 UI 描述、Effect 管理依赖追踪、Scheduler 管理更新时序
直接通过新旧 VNode 比较
```

| 职责           | React                                                     | Vue 3                                        |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| **树遍历**     | Fiber 的 `child` / `sibling` / `return` 指针              | VNode 的 `children` 与组件实例关系           |
| **组件状态**   | Fiber 的 Hooks 链表或 Class 实例                          | 组件实例中的 `setupState`、`props`、`ctx` 等 |
| **副作用记录** | `flags` / `subtreeFlags`                                  | VNode 标记、组件更新 Effect 与 patch 分支    |
| **双缓冲**     | `current` 与 `workInProgress` Fiber 通过 `alternate` 连接 | 没有直接等价结构，更新时比较前后 VNode       |
| **可中断工作** | Fiber 是可暂停和恢复的工作单元                            | 单个组件的 patch 默认同步完成                |

- React 选择将渲染、调度、状态全部注入 Fiber 节点，构建了一套精密的协程系统，为并发渲染提供了坚实支撑；
- Vue 3 则保持了响应式系统的简洁性，将优化集中在编译时与依赖追踪上，以更轻量的方式实现高性能更新。
