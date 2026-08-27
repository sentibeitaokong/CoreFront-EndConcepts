# React 与 Vue 3 核心机制

## 1. 总体架构

React 和 Vue 3 的终极目标高度一致：将声明式的 UI 描述高效地映射到宿主平台（如 DOM）。然而，两者在实现这一目标时，采取了截然不同的架构哲学：**React 走向了“重度运行时调度”的拉（Pull）模型，而 Vue 3 走向了“编译期优化 + 细粒度响应式”的推（Push）模型。**

```markdown
React：JSX → React Element (不可变快照) → Fiber 协调 (多优先级、可中断) → Commit (统一同步提交) → 宿主节点
Vue 3：Template/JSX → 附带编译标记的 VNode → 细粒度响应式更新与靶向 patch (同步或微任务批处理) → 宿主节点
```

### 1.1 React运行时入口

**React 的启动流程（Concurrent Mode）：**
React 18 引入的 `createRoot` 不仅仅是 API 的变更，更是底层调度的分水岭。它在内存中初始化了支撑并发特性的全局根基：`FiberRootNode`。

```javascript
// React 18 应用的启动入口
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// 内部执行链核心溯源：
// 1. createRoot → 实例化 FiberRootNode (全局大管家) 和 HostRootFiber (状态树的顶点)
// 2. root.render → 创建更新对象 (Update)，为其分配默认 Lane，挂载到 HostRootFiber 的更新队列
// 3. scheduleUpdateOnFiber → 触发向上冒泡，将优先级(Lanes)通知给根节点
// 4. ensureRootIsScheduled → 调度中枢：比较当前任务与最高优先级任务，决定交由微任务(同步)还是 MessageChannel(并发时间切片) 调度
// 5. performConcurrentWorkOnRoot → 进入可中断的 workLoopConcurrent (遍历 Fiber 树)
// 6. commitRoot → 进入不可中断的突变阶段，将双缓冲树(WIP)整体替换并应用真实 DOM 操作
```

### 1.2 Vue3运行时入口

**Vue 3 的启动流程（应用实例与上下文隔离）：**
Vue 3 抛弃了 Vue 2 的全局 Vue 构造函数，转而采用 `createApp`，这在架构上实现了多实例间的应用上下文（Context、插件、全局组件）的彻底隔离。

```javascript
// Vue 3 应用的启动入口
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// 内部执行链核心溯源：
// 1. createApp → 调用 ensureRenderer 创建具有特定宿主操作(nodeOps)的渲染器
// 2. app.mount → 创建根组件的初始 VNode (createVNode)
// 3. render → 触发初次 patch(null, vnode, container)
// 4. processComponent → 实例化 ComponentInternalInstance，创建独立的作用域
// 5. setupComponent → 执行 setup()，在此过程中触发 Proxy getter，建立初步的依赖追踪
// 6. setupRenderEffect → 【核心】将组件的渲染逻辑包装为一个 ReactiveEffect，并绑定到微任务 Scheduler
// 7. effect.run() → 执行渲染函数，产出子树 VNode，深度递归进行 mount
```

| 维度             | React (并发与调度驱动)                                           | Vue 3 (响应式与编译驱动)                                                 |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **UI 描述抽象**  | React Element，纯粹的运行时不可变对象。                          | VNode，不仅描述 UI，还承载编译器注入的静态标记。                         |
| **运行时载体**   | Fiber 树。集成了拓扑指针、状态、Hooks 链表、副作用标记与优先级。 | VNode 树描述 UI 拓扑，`ComponentInternalInstance` 保存组件闭包状态。     |
| **更新触发源**   | `setState` 等 API 显式触发，通过树形结构自顶向下协调。           | Proxy 拦截数据变化，通过 ReactiveEffect 自动推导并触发最小组件范围。     |
| **工作执行模型** | 基于 `MessageChannel` 和时间切片的并发调度，可中断、可废弃。     | 基于 `Promise.resolve().then()` 的微任务批处理，单组件渲染过程不可中断。 |
| **突变宿主机制** | Render 阶段（纯计算）与 Commit 阶段（突变）严格分离。            | `patch` 过程一边计算差异，一边直接调用宿主操作进行深度突变。             |

## 2. React Element 与 Vue VNode：蓝图的构造与安全

### 2.1 React Element：极致的轻量与不可变性

React Element 是一个极简的不可变（Immutable）快照。它不承载任何运行时的状态逻辑，一旦生成便无法更改。

:::code-group

```jsx [JSX源码与编译产物]
function Welcome({ name }) {
  return <h1 className="greeting">Hello, {name}!</h1>
}

// 编译后的自动 runtime (React 17+)
import { jsx as _jsx } from 'react/jsx-runtime'
// Element 结构
{
  $$typeof: Symbol.for('react.element'), // 核心安全机制
  type: 'h1',
  key: null,
  ref: null,
  props: { className: 'greeting', children: 'Hello, World!' },
}

```

:::

> **深度洞察：为什么需要 `$$typeof`？**
> 这是一个巧妙的防 XSS 设计。如果服务器返回一段恶意的 JSON 数据（如 `{ type: 'script', props: { src: '...' } }`），React 试图渲染它时，由于 JSON 无法序列化 `Symbol` 类型，伪造的节点将缺少或拥有非法的 `$$typeof`，React 会直接拒绝渲染，从根源上阻断了注入攻击。

### 2.2 Vue 3 VNode：携带编译信息的智能节点

Vue 3 的 VNode 突破了传统虚拟 DOM “**纯运行时比较**”的性能瓶颈。它允许编译器（Compiler）在编译模板时，提前将静态信息、动态特征等预判逻辑“**刻**”在 VNode 上，指导运行时的 Diff 算法。

:::code-group

```javascript [携带 PatchFlags 的 VNode]
// createVNode 输出的底层结构
{
  __v_isVNode: true,
  type: 'div',
  props: { class: 'container' },
  children: [ /* ... */ ],

  // === 编译器注入的超能力 ===
  shapeFlag: 17,         // 位运算标记：1(ELEMENT) | 16(ARRAY_CHILDREN) 快速断言节点特征
  patchFlag: 2,          // PatchFlags.CLASS (仅有 class 是动态绑定的)
  dynamicProps: ['class'], // 记录具体哪个属性是动态的，跳过全量 props 遍历
  dynamicChildren: [],   // Block Tree 的核心：拍平的所有子代动态节点
}

```

:::

### 2.3 对比总结

```jsx
// React：动态样式每次创建新对象，依赖 memo/props 比较跳过更新
<div style={{ color: 'red', fontSize: `${size}px` }}>
  {children}
</div>

// Vue 3：编译器分析出只有 fontSize 是动态的，运行时只检查该属性
<div :style="{ color: 'red', fontSize: `${size}px` }">
// → patchFlag 标记为 STYLE，diff 时只对 style 做浅比较
```

| 维度         | React Element                        | Vue 3 VNode                                        |
| ------------ | ------------------------------------ | -------------------------------------------------- |
| **本质**     | 描述 UI 的轻量 JavaScript 对象       | 描述 UI 的轻量 JavaScript 对象                     |
| **创建方式** | JSX 编译为 `jsx()` / `jsxs()`        | 模板编译为渲染函数，也可以调用 `h()`               |
| **节点类型** | `type` 表示宿主标签、组件或特殊类型  | `type` 表示宿主标签、组件或特殊类型                |
| **身份标识** | `$$typeof`                           | `__v_isVNode`                                      |
| **列表身份** | `key`                                | `key`                                              |
| **编译标记** | Element 本身不承载 Vue 式 PatchFlags | `shapeFlag`、`patchFlag`、动态子节点等信息辅助更新 |

React Element 更接近一次渲染产生的输入快照；Vue VNode 除了描述 UI，还可能携带模板编译阶段生成的更新提示。

## 3. Fiber 架构与 Vue 3 运行时：状态机的不同归宿

### 3.1 React Fiber：包揽一切的全能节点

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
}

```

:::

### 3.2 Vue 3：各司其职的模块化设计

Vue 3 并没有类似于 Fiber 的大一统数据结构，而是采用了**高内聚、低耦合**的多重抽象：

- **`VNode`**：只负责描述 UI。
- **`ComponentInternalInstance`**：作为组件的上下文，保存 `setupState`、生命周期钩子、提供给 `provide/inject` 的作用域。
- **`ReactiveEffect`**：连接响应式数据与组件更新逻辑的桥梁。

:::code-group

```markdown [整体架构]
Vue 组件运行时
├── VNode：描述节点和子树
├── ComponentInternalInstance：保存组件状态与上下文
├── ReactiveEffect：收集响应式依赖并触发组件更新
└── Scheduler：批量安排组件任务和回调
```

```javascript [携带 PatchFlags 的 VNode]
// createVNode 输出的底层结构
{
  __v_isVNode: true,
  type: 'div',
  props: { class: 'container' },
  children: [ /* ... */ ],

  // === 编译器注入的超能力 ===
  shapeFlag: 17,         // 位运算标记：1(ELEMENT) | 16(ARRAY_CHILDREN) 快速断言节点特征
  patchFlag: 2,          // PatchFlags.CLASS (仅有 class 是动态绑定的)
  dynamicProps: ['class'], // 记录具体哪个属性是动态的，跳过全量 props 遍历
  dynamicChildren: [],   // Block Tree 的核心：拍平的所有子代动态节点
}

```

```javascript [vue组件运行时上下文]
// ComponentInternalInstance — Vue 3 组件的运行时实例（简化）
type ComponentInternalInstance = {
  uid: number,                    // 唯一 ID
  type: ConcreteComponent,        // 组件定义（setup 函数所在对象）
  parent: ComponentInternalInstance | null,  // 父组件实例

  vnode: VNode,                   // 当前组件对应的 VNode
  subTree: VNode,                 // 组件渲染产生的子 VNode 树（上次渲染结果）

  // 组件状态
  setupState: Data,               // setup() 返回值
  props: Data,                    // 组件 props
  attrs: Data,                    // 非 prop 属性（fallthrough attributes）
  slots: InternalSlots,           // 插槽

  // 响应式
  update: ReactiveEffect,         // 组件的渲染 Effect
  isMounted: boolean,             // 是否已挂载
  isUnmounted: boolean,

  // 调度
  next: ComponentInternalInstance | null,  // 更新队列链表中的下一个

  // 编译器优化
  bm: number | null,              // Block Tree 的根节点索引

  // 生命周期
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook[],
  [LifecycleHooks.MOUNTED]: LifecycleHook[],
  // ... 其他生命周期钩子数组
}
```

```javascript [响应式effect]
// ReactiveEffect — Vue 3 响应式系统的执行单元（简化）
class ReactiveEffect {
  fn: () => any              // 要执行的函数（组件更新函数 / watch 回调 / computed getter）
  scheduler?: () => void     // 自定义调度器（如组件更新走 Scheduler 队列）
  deps: Dep[]                // 该 Effect 订阅的所有 Dep（响应式依赖集合）
  active: boolean            // 是否激活
  parent: ReactiveEffect | undefined  // 嵌套 Effect 链（用于 effectStack）

  run() {
    // 1. 将当前 Effect 推入 effectStack
    // 2. 执行 fn()，期间读取响应式数据时触发 track() 收集依赖
    // 3. 弹出 effectStack，恢复父 Effect
  }

  stop() {
    // 清理所有依赖，停止响应
  }
}
```

:::

### 3.3 对比总结

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

## 4. 协调与更新

### 4.1 React：Fiber 协调流程

React 的状态更新会创建 Update、分配 Lane，并在 Render 阶段根据新 Element 和 current Fiber 构建 work-in-progress Fiber：

```javascript
// React setState 触发更新的简化流程
function dispatchSetState(fiber, queue, action) {
  // 1. 创建 Update 对象
  const update = {
    lane, // 本次更新的优先级
    action, // 新值 或 updater 函数
    hasEagerState, // 是否已预先计算新状态
    eagerState, // 预先计算的状态（优化）
    next: null, // 链表指针
  }

  // 2. 将 Update 加入 Fiber 的 updateQueue 链表
  enqueueUpdate(fiber, queue, update)

  // 3. 从当前 Fiber 向上标记，直到 FiberRoot
  //    沿途将 lane 合并到各祖先的 childLanes
  markUpdateLaneFromFiberToRoot(fiber, lane)

  // 4. 调度更新——确保根节点进入 Scheduler
  scheduleUpdateOnFiber(root, fiber, lane)
}
```

Render 阶段关键工作——`beginWork` 的简化实现：

```javascript
// beginWork — 对每个 Fiber 执行的核心协调逻辑（简化）
function beginWork(current, workInProgress, renderLanes) {
  // 1. 检查是否可以 bailout（跳过）
  if (current !== null) {
    const oldProps = current.memoizedProps
    const newProps = workInProgress.pendingProps

    if (oldProps === newProps &&       // props 引用相同
        !hasContextChanged() &&        // context 未变化
        !includesSomeLane(renderLanes, workInProgress.lanes)) { // 无待处理更新
      return bailoutOnAlreadyFinishedWork(current, workInProgress)
    }
  }

  // 2. 根据 Fiber.tag 分发处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      // 执行函数组件 → 获取 Hooks 状态 → 执行返回的 Element
      return updateFunctionComponent(current, workInProgress, ...)
    case HostComponent:
      // 原生 DOM：对比新旧 props，标记 flags
      return updateHostComponent(current, workInProgress, ...)
    case ClassComponent:
      return updateClassComponent(current, workInProgress, ...)
    // ... 其他类型
  }
}

// React 协调子节点的核心函数（简化）
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // 首次挂载：直接创建新的子 Fiber（不做 diff）
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    // 更新：对比新旧子节点，标记删除/新增/移动
    workInProgress.child = reconcileChildFibers(
      workInProgress, current.child, nextChildren
    )
  }
}
```

React 的多节点协调（`reconcileChildrenArray`）受 Fiber 单向链表拓扑约束，只能**单向扫描**，用 `lastPlacedIndex` 贪心检测移动：

```javascript
// reconcileChildrenArray — React 多节点协调（简化）
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
  let oldFiber = currentFirstChild
  let lastPlacedIndex = 0 // 已复用旧节点在旧列表中的最大 index
  let newIdx = 0

  // 第一轮：顺序比对，key + type 相同 → 复用，遇到不同立即跳出
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx]
    if (oldFiber.key !== newChild.key || oldFiber.type !== newChild.type) break
    lastPlacedIndex = placeChild(
      useFiber(oldFiber, newChild),
      lastPlacedIndex,
      newIdx,
    )
    oldFiber = oldFiber.sibling
  }

  // 第二轮：剩余旧节点按 key 建 Map，遍历新节点查找复用或新建
  const existingChildren = mapRemainingChildren(oldFiber)
  for (; newIdx < newChildren.length; newIdx++) {
    const matched = existingChildren.get(newChildren[newIdx].key)
    const newFiber = matched
      ? updateFromMap(
          existingChildren,
          returnFiber,
          newIdx,
          newChildren[newIdx],
        )
      : createChild(returnFiber, newChildren[newIdx], null)
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
  }

  // 第三轮：Map 中仍剩余的旧节点 → 标记 ChildDeletion
  existingChildren.forEach(child => deleteChild(returnFiber, child))
}

// placeChild — lastPlacedIndex 贪心：旧 index < lastPlacedIndex 即相对顺序改变
function placeChild(newFiber, lastPlacedIndex, newIndex) {
  newFiber.index = newIndex
  const oldIndex = newFiber.alternate?.index
  if (oldIndex === undefined) {
    newFiber.flags |= Placement // 全新节点 → 插入
    return lastPlacedIndex
  }
  if (oldIndex < lastPlacedIndex) {
    newFiber.flags |= Placement // 相对顺序改变 → 移动
    return lastPlacedIndex
  }
  return oldIndex // 顺序不变 → 原地复用
}
```

### 4.2 Vue 3：响应式驱动的 patch 流程

Vue 3 的响应式数据变化会触发订阅它的 ReactiveEffect。组件更新任务进入 Scheduler 队列，执行时生成新 VNode 并与旧 VNode 进行 patch：

```javascript
// Vue 3 组件挂载时的 setupRenderEffect（简化）
function setupRenderEffect(instance, initialVNode, container, ...) {
  const componentUpdateFn = () => {
    // 首次挂载
    if (!instance.isMounted) {
      const subTree = (instance.subTree = renderComponentRoot(instance))
      patch(null, subTree, container, ...)          // 首次挂载→全量递归
      initialVNode.el = subTree.el
      instance.isMounted = true
    }
    // 组件更新
    else {
      const prevTree = instance.subTree
      const nextTree = renderComponentRoot(instance) // 重新执行 render，生成新 VNode
      instance.subTree = nextTree
      patch(prevTree, nextTree, container, ...)     // 比较新旧 VNode
    }
  }

  // 创建 ReactiveEffect 并绑定到组件实例
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    () => queueJob(instance.update),  // scheduler：更新走微任务队列
  ))
  // 首次执行 componentUpdateFn 完成挂载
  effect.run()
}
```

```javascript
// Vue 3 patch 函数的核心逻辑（简化）
function patch(oldVNode, newVNode, container, ...) {
  // 1. 类型不同 → 直接卸载旧节点，挂载新节点
  if (oldVNode.type !== newVNode.type) {
    unmount(oldVNode)
    oldVNode = null  // 使后续逻辑走挂载分支
  }

  const { type, shapeFlag } = newVNode
  switch (type) {
    case Text:         // 文本节点
      processText(oldVNode, newVNode, ...)
      break
    case Comment:      // 注释节点
      processCommentNode(oldVNode, newVNode, ...)
      break
    case Fragment:     // Fragment
      processFragment(oldVNode, newVNode, ...)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 普通元素（div、span 等）
        processElement(oldVNode, newVNode, ...)
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 组件
        processComponent(oldVNode, newVNode, ...)
      }
  }
}

// patchElement — 仅当新旧 type 相同时调用（简化）
function patchElement(oldVNode, newVNode, ...) {
  const el = (newVNode.el = oldVNode.el)

  // 1. 根据 patchFlag 靶向更新属性
  const { patchFlag } = newVNode
  if (patchFlag & PatchFlags.TEXT) {
    // 只更新文本内容，跳过所有属性比较
    setElementText(el, newVNode.children)
    return  // ← 提前退出，不进入子节点 patch！
  }
  if (patchFlag & PatchFlags.CLASS) {
    // 只更新 class
    hostPatchProp(el, 'class', null, newVNode.props.class)
  }
  // ... 其他靶向 flag

  // 2. 无 patchFlag 或 需要全量属性 diff
  patchProps(el, oldVNode.props, newVNode.props)

  // 3. 更新子节点
  patchChildren(oldVNode.children, newVNode.children, el, ...)
}
```

Vue 3 的多节点 patch（`patchKeyedChildren`）的 VNode 是数组，支持**双端扫描与索引随机访问**，用最长递增子序列（LIS）把移动次数压到最优：

```javascript
// patchKeyedChildren — Vue 3 多节点 patch（简化）
function patchKeyedChildren(c1, c2, container) {
  let i = 0,
    e1 = c1.length - 1,
    e2 = c2.length - 1

  // 1. 头部同步：从前往后，type + key 相同 → 复用
  while (i <= e1 && i <= e2 && isSameVNodeType(c1[i], c2[i])) {
    patch(c1[i], c2[i])
    i++
  }
  // 2. 尾部同步：从后往前，type + key 相同 → 复用
  while (i <= e1 && i <= e2 && isSameVNodeType(c1[e1], c2[e2])) {
    patch(c1[e1], c2[e2])
    e1--
    e2--
  }

  // 3. 中间乱序部分：建立 新 key → index 映射
  const keyToNewIndexMap = new Map()
  for (let j = i; j <= e2; j++) keyToNewIndexMap.set(c2[j].key, j)

  // 4. 遍历旧中间节点：命中 → 复用并记录新旧位置；未命中 → 卸载
  // 5. 计算最长递增子序列(LIS)：LIS 内的节点相对顺序未变，保持原位
  const seq = getSequence(newIndexToOldIndexMap)
  // 6. 从尾到头移动/插入非 LIS 节点，最小化真实 DOM 操作
}
```

### 4.3 对比总结

```markdown
React（单向链表约束）：单次遍历 + lastPlacedIndex
第一轮顺序比对 → 第二轮 Map 查找 → 第三轮删除剩余
用"旧 index < lastPlacedIndex"判断移动，只能单向扫描

Vue 3（数组随机访问）：双端比较 + 最长递增子序列
头尾同步剥离 → 中间建 key Map → LIS 求不动的子序列
可双向扫描，LIS 内节点保持原位，移动次数接近最优
```

| 维度             | React                                           | Vue 3                                                   |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| **更新来源**     | `setState`、Hook dispatch、外部 Store 等        | `ref`、`reactive` 等响应式数据触发依赖                  |
| **比较输入**     | 新 React Element 与 current Fiber               | 新旧 VNode                                              |
| **列表复用依据** | `type` 与 `key`                                 | `type` 与 `key`                                         |
| **移动检测**     | `lastPlacedIndex` 贪心（单次遍历）              | 最长递增子序列 LIS（移动次数最优）                      |
| **变更提交**     | Commit 阶段统一处理 Placement、Update、Deletion | patch 过程直接调用 insert、patchProp、remove 等宿主操作 |
| **跳过工作**     | Bailout、`memo`、稳定引用、编译器缓存           | 响应式依赖、PatchFlags、Block Tree、静态提升            |

React 的协调受 Fiber 单向链表拓扑约束，只能单向扫描；Vue 3 的 VNode 是数组，天然支持双端与索引随机访问，因而能把 DOM 移动次数压得更低。二者最终都把真实 DOM 操作降到"**必须变化**"的最小集合，只是算法起点不同。

## 5. 调度与批处理

React 的 Lane 和 Scheduler 是两套协作机制：Lane 表示更新优先级和更新集合，Scheduler 决定任务何时获得主线程时间。并发 Render 可以在时间片结束时让出主线程，也可以被更高优先级更新打断。

Vue 3 Scheduler 的重点是异步批处理和执行顺序。响应式更新进入微任务队列，同一组件任务会被去重，并按 pre、组件 job、post 的时序执行；单个组件更新任务本身通常不会被时间切片打断。

### 5.1 React：Lane 模型

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

### 5.2 React：Scheduler 时间切片

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

### 5.3 Vue 3：微任务批量调度

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

## 6. 更新机制

### 6.1 状态存储与定位机制

#### 6.1.1 React：Hooks 顺序链表

React 用**调用顺序**而非名称来定位状态：所有 Hooks 都挂在 Fiber 节点的 `memoizedState` 单向链表上，每次渲染时按顺序逐个取用。

:::code-group

```javascript [Hooks 链表结构]
// fiber.memoizedState 是一条单向链表，每个节点是一个 Hook
{
  memoizedState: 0,      // 当前值：useState 存值，useEffect 存 { create, destroy, deps }
  baseState: 0,          // 本次更新的基准状态（重放 update 的起点）
  queue: {
    pending: { action, lane, next },  // 待处理 update 的环形链表
    dispatch: setCount,               // 对应的 setState 引用
  },
  next: {                 // → 下一个 Hook，按组件内书写顺序串联
    memoizedState: { create, destroy, deps },  // 第二个 Hook：useEffect
    next: { memoizedState: { current: el }, next: null },  // 第三个：useRef
  },
}
```

```javascript [useState 核心实现]
// mount 时追加节点，update 时按顺序取节点——没有 key 可查，跳过即错位
function mountState(initialState) {
  const hook = mountWorkInProgressHook() // 链表尾追加新 hook
  hook.memoizedState =
    typeof initialState === 'function' ? initialState() : initialState
  hook.queue = { pending: null, dispatch: null }
  const dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    hook.queue,
  )
  hook.queue.dispatch = dispatch
  return [hook.memoizedState, dispatch]
}

function updateState() {
  const hook = updateWorkInProgressHook() // 按顺序取下一个 hook
  const update = hook.queue.pending?.next // 环形链表中最早的 update
  if (update != null) {
    let newState = hook.baseState // 从基准状态重放所有 update
    do {
      newState =
        typeof update.action === 'function'
          ? update.action(newState)
          : update.action
      update = update.next
    } while (update !== hook.queue.pending.next)
    hook.memoizedState = newState
  }
  return [hook.memoizedState, hook.queue.dispatch]
}
```

:::

**顺序为何不能变**：链表里没有任何 key/名字，每次 `useState`/`useMemo`/`useEffect` 都按"**取当前节点 → 指针前进一格**"定位。某次渲染一旦跳过某个 Hook，后续所有 Hook 整体错位——`count` 可能读到 `useEffect` 的 `deps`，`setState` 的更新可能写进 `useRef`。这正是 `eslint-plugin-react-hooks` 必须静态检查调用顺序的原因。

#### 6.1.2 Vue 3：响应式对象代理

Vue 3 的状态存储在 **响应式对象** 中，通过 `Proxy` 拦截属性的读写操作，不依赖任何调用顺序。

:::code-group

```javascript [reactive 与 ref]
// reactive：Proxy 拦截 get/set，深层对象惰性递归代理
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key) // 读即收集依赖
      const res = Reflect.get(target, key, receiver)
      return isObject(res)
        ? reactive(res) // 深层对象再次代理（惰性）
        : res
    },
    set(target, key, value, receiver) {
      const old = target[key]
      const res = Reflect.set(target, key, value, receiver)
      if (old !== value) trigger(target, key) // 值变了才触发
      return res
    },
  })
}

// ref：把任意值包成对象，用 .value 的 get/set 做 track/trigger
function ref(value) {
  return {
    _value: toReactive(value), // 对象走 reactive，原始值直接存
    get value() {
      track(this, 'value')
      return this._value
    },
    set value(v) {
      if (v !== this._value) {
        this._value = toReactive(v)
        trigger(this, 'value')
      }
    },
  }
}
```

```javascript [track 与 trigger]
// 依赖图连接枢纽：target → key → 依赖它的 effect 集合
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return // 不在 effect 内，不收集
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect) // 记录「谁依赖了这个 key」
  activeEffect.deps.push(dep) // effect 反向记录，便于 stop/cleanup
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => (effect.scheduler ? effect.scheduler() : effect.run())) // 组件更新走 scheduler（微任务），computed 直接 run
}
```

:::

**ref 与 reactive 的差异**：`reactive` 只接受对象，靠 `Proxy` 拦截；`ref` 可包任意值，靠 `.value` 的 getter/setter。解构 `reactive` 会丢失响应性（需 `toRefs`），解构 `ref` 无碍；二者底层共享同一套 `track`/`trigger` 机制。

### 6.2 更新触发与依赖追踪

#### 6.2.1 React：自上而下的"执行-跳过"模型

React 的更新从触发更新的组件开始，**默认整棵子树重新执行函数**，然后通过 `memo`、`useMemo`、`useCallback` 或 React Compiler 来跳过不必要的执行。

```javascript
// useState 的更新触发
function dispatchSetState(fiber, queue, action) {
  const update = createUpdate(action) // 创建 Update 对象
  enqueueUpdate(fiber, queue, update) // 入队
  scheduleUpdateOnFiber(fiber) // 调度更新
}

// 更新阶段：beginWork 从根节点或触发点开始遍历整棵树
function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress)
    case ClassComponent:
      return updateClassComponent(current, workInProgress)
    // ... 其他类型
  }
}
```

**核心特征**：

- 更新从触发点向上冒泡到根，再从根向下遍历所有子节点
- 每个组件是否重新执行，取决于 `memo`/`shouldComponentUpdate` 的判断
- 依赖追踪靠的是"**执行时读到了什么**"——但 React 不会自动记录，需要开发者用 `useMemo`/`useCallback` 显式声明依赖数组

#### 6.2.2 Vue 3：自下而上的"依赖-触发"模型

Vue 3 的更新基于 **依赖图（Dependency Graph）**：数据变化时，只有直接或间接依赖了该数据的 Effect 才会被触发。

```javascript
// 依赖图枢纽：target → key → 依赖它的 effect 集合
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect) // 记录"谁依赖了这个 key"
  activeEffect.deps.push(dep) // effect 反向记录，便于 cleanup
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => {
    effect.scheduler ? effect.scheduler() : effect.run()
  })
}
```

**核心特征**：

- 依赖在**读取时自动收集**，无需开发者手动声明
- 更新是**点对点触发**——数据变了，直接通知依赖它的 Effect
- 组件渲染本身也是一个 Effect，因此只有用到了变化数据的组件才会重新执行

### 6.3 派生状态与缓存机制

#### 6.3.1 React `useMemo`：渲染期同步求值

```javascript
function useMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook()
  const prev = hook.memoizedState
  if (prev !== null && deps.every((d, i) => Object.is(d, prev[1][i]))) {
    return prev[0] // 缓存命中
  }
  const value = nextCreate()
  hook.memoizedState = [value, deps]
  return value
}
```

- **求值时机**：每次渲染时同步求值（检查 deps 是否变化）
- **依赖声明**：必须显式传入 `deps` 数组，靠 `Object.is` 浅比较
- **失效粒度**：整个 deps 数组任一引用变化即整体失效

#### 6.3.2 Vue `computed`：惰性求值 + 自动失效

```javascript
function computed(getter) {
  let dirty = true
  let value
  const effect = new ReactiveEffect(getter, () => (dirty = true))
  return {
    get value() {
      if (dirty) {
        value = effect.run()
        dirty = false
      } // 首次或失效才重算
      track(this, 'value') // 让外层 effect 也能收集到 computed 的依赖
      return value
    },
  }
}
```

- **求值时机**：惰性求值——被读取时才计算，依赖变化只标记 `dirty`
- **依赖声明**：无需手动声明，读取响应式数据时自动 `track` 收集
- **失效粒度**：精确到具体响应式属性，只依赖真正读过的属性

#### 6.3.3 对比总结

| 维度     | Vue `computed`                     | React `useMemo`          |
| -------- | ---------------------------------- | ------------------------ |
| 依赖声明 | 自动收集（读取时 track）           | 手动传入 deps 数组       |
| 求值时机 | 惰性——被读取时才计算               | 同步——每次渲染检查并重算 |
| 失效粒度 | 精确到具体属性                     | 整个 deps 数组整体失效   |
| 级联传播 | 天然级联，computed 可依赖 computed | 需手动在 deps 中逐层声明 |

### 6.4 跨层数据传递

#### 6.4.1 React Context：广播式订阅

```jsx
// Provider value 变化 → 所有读取该 Context 的 Consumer 重渲染（广播式）
const ThemeContext = createContext('light')

function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

function Toolbar() {
  const theme = useContext(ThemeContext) // 订阅：value 变则重渲染
  return <div className={theme}>...</div>
}
```

**核心特征**：

- `useContext` 读取即订阅，Provider value 变化触发所有 Consumer 重渲染
- 广播式传播：除非用 `memo`/React Compiler 拦截，否则所有 Consumer 都会执行
- 粗粒度：只用到一小部分字段也会整体重渲染

#### 6.4.2 Vue `provide/inject`：查找式注入

```vue
<!-- provide/inject 只沿 parent 链查找一次，响应式靠被注入的 ref 本身 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', theme) // 注入 ref 本身（注入普通值不响应）
</script>

<!-- 子组件 -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme') // 读 theme.value 才触发依赖收集
</script>
```

**核心特征**：

- `provide`/`inject` 本身只沿 parent 链查找一次，**不建立订阅关系**
- 真正让跨层数据响应化的是被注入的 `ref`/`reactive` 对象
- 细粒度：子组件读取 `inject('theme').value` 时，依赖被收集到子组件自己的 Effect 上

#### 6.4.3 对比总结

| 维度       | React Context                | Vue provide/inject           |
| ---------- | ---------------------------- | ---------------------------- |
| 订阅关系   | `useContext` 即订阅          | 本身不订阅，只查找一次       |
| 更新传播   | 广播式：所有 Consumer 重渲染 | 点对点：仅真正读取的组件更新 |
| 响应性来源 | Provider 的 value 本身       | 被注入对象自身的响应式       |
| 粒度       | 粗：按 Context 整体          | 细：按具体响应式属性         |

### 6.5 设计哲学的根本差异

```markdown
React（顺序链表 + 显式声明 + 自上而下执行）：

状态挂在 Fiber.memoizedState 单向链表 → 靠调用顺序定位
派生值靠 useMemo 手动声明 deps，跨层靠 Context 自上而下广播
更新是"整棵树重新执行函数" → 再靠 memo/Compiler 尽量跳过
依赖追踪靠"开发者告诉我"（deps 数组）

Vue 3（依赖图 + 自动收集 + 点对点触发）：

状态是 Proxy/ref 包裹的响应式对象 → 靠 track/trigger 建立精确依赖
派生值靠 computed 自动失效 + 惰性缓存，跨层靠 provide/inject 沿链查找
更新是"数据 → 依赖它的 Effect"点对点触发 → 天然最小化
依赖追踪靠"运行时自动收集"（Proxy get 拦截）
```

| 维度         | React                                 | Vue 3                             |
| ------------ | ------------------------------------- | --------------------------------- |
| **状态存储** | Fiber 链表 + Hook 顺序                | Proxy/ref 响应式对象              |
| **状态读取** | 组件执行时按 Hooks 顺序取             | 访问 `.value` 或代理属性          |
| **依赖建立** | 开发者手动声明（deps 数组）           | 运行时自动收集（track）           |
| **依赖比较** | `Object.is` 浅比较 deps               | 响应式属性精确比较                |
| **更新起点** | 触发点 → 根 → 整棵子树                | 数据变化 → 直接通知依赖 Effect    |
| **更新传播** | 自上而下执行 + 跳过优化               | 自下而上点对点触发                |
| **派生缓存** | `useMemo`，渲染期同步求值             | `computed`，惰性求值 + dirty 标记 |
| **跨层注入** | Context Provider + useContext         | provide + inject                  |
| **注入更新** | Provider value 变 → 广播所有 Consumer | 注入 ref 本身 → 响应式依赖驱动    |

## 7. 副作用时序与清理机制

副作用（Side Effects）是前端框架连接“**状态驱动 UI**”与“**外部世界**”的桥梁——无论是操作 DOM、发起网络请求、订阅外部数据源，还是操作计时器。然而，副作用在组件生命周期中的**执行时机**直接决定了应用的性能、一致性和用户体验。React 和 Vue 3 分别基于各自的渲染机制，设计了不同的副作用调度模型。

### 7.1 React 的副作用时序模型

React 将渲染过程严格划分为**Render 阶段（可中断、可重试）** 和 **Commit 阶段（不可中断、同步执行）**。副作用（Effect）的执行完全锚定在 Commit 阶段的不同子阶段，从而提供了精确的控制。

#### 7.1.1 渲染流水线概览

```markdown
触发更新（setState/useReducer/context 变化）
↓
Render 阶段（beginWork → completeWork）

- 构建/更新 Fiber 树
- 纯计算，无 DOM 操作，可被更高优先级中断
- 标记副作用 flags（Placement、Update、Deletion、Passive 等）
  ↓
  Commit 阶段（同步执行，不可中断）
  ├── 1. Before Mutation：执行 getSnapshotBeforeUpdate（类组件）
  ├── 2. Mutation：应用 DOM 变更（增删改）
  │ └── 执行 useInsertionEffect 的 setup（仅限此阶段）
  ├── 3. Layout：执行 useLayoutEffect 的 setup（同步阻塞）
  ↓
  浏览器绘制（Paint）
  ↓
  调度执行 useEffect 的 setup（异步，不阻塞绘制）
```

#### 7.1.2 Effect解析

| Effect 类型          | 执行时机                                  | 典型用途                                                    | 注意事项                                                                  |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useInsertionEffect` | Mutation 阶段完成、Layout 之前            | CSS-in-JS 动态插入样式（如 `styled-components`、`emotion`） | 极少数场景使用，通常应使用 `useLayoutEffect` 或 `useEffect`               |
| `useLayoutEffect`    | Layout 子阶段，**同步阻塞**在浏览器绘制前 | 测量 DOM 尺寸、同步修改 DOM（如滚动到某位置）、避免闪烁     | 会阻塞页面绘制，避免执行耗时操作；服务端渲染需跳过（用 `useEffect` 替代） |
| `useEffect`          | 浏览器绘制**完成之后异步执行**            | 数据获取、订阅外部事件、操作非 DOM 的第三方库               | 默认在每轮渲染后异步执行，依赖数组控制执行频率                            |

#### 7.1.3 清理机制

React 的 `useEffect`、`useLayoutEffect`、`useInsertionEffect` 都通过 **Effect 回调返回一个 cleanup 函数** 来注册清理：

- **首次挂载**：只执行 setup，不执行 cleanup。
- **更新时**：先执行上一次的 cleanup，再执行新的 setup。
- **卸载时**：只执行 cleanup，不再执行 setup。
- **执行窗口与 Effect 类型一致**：`useEffect` 的 cleanup 在浏览器绘制后异步执行；`useLayoutEffect` 的 cleanup 在 DOM 变更后、绘制前同步执行。

```jsx
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(timer) // 下一次 setup 前 / 卸载时执行
}, [])
```

### 7.2 Vue 3 的副作用时序模型

Vue 3 的响应式系统基于 `ReactiveEffect` 和调度器（Scheduler）。组件自身的渲染也是一个 Effect，而 `watch`/`watchEffect` 则是独立于渲染流程的副作用，其执行时机通过 `flush` 选项控制。

#### 7.2.1 组件更新流水线

```markdown
响应式数据变化（如 count.value++）
↓
触发组件更新的 Effect（scheduler 将更新任务入队）
↓
（微任务队列）flush 队列处理开始
├── 1. flush: 'pre' 队列（默认）
│ - 执行所有 `watch`（默认 flush: 'pre'）的回调
│ - 执行 `watchEffect`（默认）的回调
│ - 此时 DOM 尚未更新，可访问旧 DOM，但不应修改数据（避免循环）
├── 2. 组件渲染：执行 render 函数 → 生成新的 VNode 树 → patch（更新 DOM）
├── 3. flush: 'post' 队列
│ - 执行 flush: 'post' 的 `watch` 回调
│ - 执行 `onUpdated` 钩子（所有子组件更新后）
│ - 此时 DOM 已更新，可安全访问新 DOM
↓
浏览器绘制
```

#### 7.2.2 `flush` 选项详解

| `flush` 值      | 执行时机                                                   | 典型用途                                                 | 注意事项                                            |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `'pre'`（默认） | 组件更新**之前**，即 DOM 更新前                            | 在数据变化后、DOM 更新前执行逻辑（如取消请求、记录旧值） | 在此回调中修改数据可能触发无限循环（需小心）        |
| `'post'`        | 组件更新**之后**，DOM 已更新，但在浏览器绘制前（同微任务） | 访问/操作已更新的 DOM（类似 `onUpdated`）                | 与 `onUpdated` 相比，`watch` 可更精确地监听特定数据 |
| `'sync'`        | 数据变化后**立即同步**执行（在当前宏任务中）               | 需要立即响应数据变化，不等待批处理或渲染                 | 性能开销大，可能导致频繁执行，仅用于极少数场景      |

Vue 3 没有直接等价于 `useLayoutEffect` 的 API，因为渲染流程是同步的（数据变化 → 组件 Effect 重新执行 → patch DOM），且 DOM 更新发生在当前微任务完成之前。若需要在 DOM 更新后、浏览器绘制前**同步读取布局**，通常使用：

- `onUpdated` 钩子
- `watch` 配合 `flush: 'post'` + `nextTick`（确保 DOM 已应用）

```vue
<script setup>
import { ref, watch, onUpdated, nextTick } from 'vue'

const count = ref(0)
const el = ref(null)

watch(
  count,
  newVal => {
    // flush: 'pre'（默认） → DOM 尚未更新，el.value 仍为旧 DOM
    console.log('pre flush:', el.value.textContent)
  },
  { flush: 'pre' },
)

watch(
  count,
  async newVal => {
    // flush: 'post' → DOM 已更新，但尚未绘制
    await nextTick() // 确保所有 DOM 更新已应用
    console.log('post flush:', el.value.textContent)
  },
  { flush: 'post' },
)

onUpdated(() => {
  // DOM 更新后执行，等价于 flush: 'post'
  console.log('onUpdated:', el.value.textContent)
})
</script>

<template>
  <div ref="el">{{ count }}</div>
  <button @click="count++">Increment</button>
</template>
```

#### 7.2.3 清理机制

Vue 的 `watch` 和 `watchEffect` 也支持清理回调：

- **`watch`**：通过回调函数的第三个参数 `onCleanup` 注册清理。
- **`watchEffect`**：通过 `onCleanup` 注册，在下次 effect 执行前或组件卸载时调用。

```javascript
watchEffect(onCleanup => {
  const timer = setInterval(() => console.log('tick'), 1000)
  onCleanup(() => clearInterval(timer))
})
```

### 7.3 核心差异对比

| 维度                   | React                                                          | Vue 3                                                                             |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **副作用载体**         | `useEffect`、`useLayoutEffect`、`useInsertionEffect`           | `watch`、`watchEffect`、`onUpdated` 等生命周期钩子                                |
| **执行时机的控制方式** | 通过选择不同的 Effect 类型（`useEffect` vs `useLayoutEffect`） | 通过 `flush` 选项（`'pre'` / `'post'` / `'sync'`）                                |
| **清理函数**           | Effect 返回 cleanup 函数                                       | 通过 `onCleanup` 注册（watch/watchEffect）                                        |
| **阻塞绘制**           | `useLayoutEffect` 同步阻塞                                     | 无直接等价，但 `flush: 'sync'` 会阻塞当前宏任务（但那是同步执行，不涉及绘制时机） |
| **依赖管理**           | 显式传入依赖数组（或依赖变化检测）                             | 自动追踪响应式依赖（watchEffect）或显式指定源（watch）                            |
| **严格模式**           | 开发环境额外执行 setup+cleanup 循环                            | 无类似机制，但存在提示（如 `watch` 重复执行）                                     |

- **React** 通过“**Effect 类型 + Commit 阶段划分**”提供强时序保障，尤其适合需要精确控制绘制前后行为的复杂场景，代价是开发者需要理解不同 Effect 的区别。
- **Vue 3** 通过“**flush 队列 + 微任务调度**”提供足够的灵活性，将副作用纳入统一的响应式任务调度系统，学习曲线更平缓，且自动依赖追踪减少了手动管理负担。

## 8. 编译器优化

### 8.1 React Compiler

React Compiler 面向 JavaScript 和 JSX 进行数据流与依赖分析，自动插入记忆化缓存：

:::code-group

```jsx [编译前]
// 开发者手写组件的常见非优化模式：每次渲染都重算 + 重建引用
function ProductList({ products, category }) {
  const filtered = products.filter(p => p.category === category)
  const sorted = [...filtered].sort((a, b) => b.price - a.price)
  const handleAdd = id => addToCart(id)

  return (
    <ul>
      {sorted.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={handleAdd}
          style={{ border: '1px solid #eee' }}
        />
      ))}
    </ul>
  )
}
```

```jsx [编译后]
// React Compiler 自动注入缓存槽与稳定引用
function ProductList(t0) {
  const { products, category } = t0
  const $ = _c(5) // 分配 5 个缓存槽

  // 自动 useMemo：filtered 仅在 products/category 变化时重算
  let filtered
  if ($[0] !== products || $[1] !== category) {
    filtered = products.filter(p => p.category === category)
    $[0] = products
    $[1] = category
    $[2] = filtered
  } else {
    filtered = $[2]
  }

  // 自动 useMemo：sorted 仅在 filtered 变化时重算
  let sorted
  if ($[3] !== filtered) {
    sorted = [...filtered].sort((a, b) => b.price - a.price)
    $[3] = filtered
    $[4] = sorted
  } else {
    sorted = $[4]
  }

  const handleAdd = _cached(0, () => id => addToCart(id)) // 稳定回调引用
  const style = _cached(1, () => ({ border: '1px solid #eee' })) // 提取不变对象

  return (
    <ul>
      {sorted.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={handleAdd}
          style={style}
        />
      ))}
    </ul>
  )
}
```

:::

React Compiler 的核心思路是：在编译时分析 JavaScript 的 SSA（Static Single Assignment）和控制流，找出哪些表达式在哪些条件下会重新计算，然后插入记忆化逻辑。它不改变 React 的运行时模型，只帮助运行时更早地 bailout。

### 8.2 Vue 3 Compiler

Vue 编译器利用模板语法的结构化约束生成带优化提示的渲染函数：

:::code-group

```vue [编译前模板]
<template>
  <div class="container">
    <h1 class="title">商品列表</h1>
    <p class="hint-static">共 100 件商品</p>

    <ul>
      <li
        v-for="item in list"
        :key="item.id"
        :class="{ active: item.isActive }"
      >
        <span>{{ item.name }}</span>
        <span class="price">¥{{ item.price }}</span>
      </li>
    </ul>

    <footer class="static-footer"><p>底部信息</p></footer>
  </div>
</template>
```

```javascript [编译后渲染函数]
import {
  createVNode as _createVNode,
  createBlock as _createBlock,
  openBlock as _openBlock,
  Fragment as _Fragment,
  toDisplayString as _toDisplayString,
  normalizeClass as _normalizeClass,
  renderList as _renderList,
} from 'vue'

// 静态提升：不变节点只创建一次，跨渲染复用
const _hoisted_1 = _createVNode(
  'h1',
  { class: 'title' },
  '商品列表',
  -1 /* HOISTED */,
)
const _hoisted_2 = _createVNode(
  'footer',
  { class: 'static-footer' },
  [_createVNode('p', null, '底部信息', -1)],
  -1,
)

export function render(_ctx) {
  return (
    _openBlock(),
    _createBlock('div', { class: 'container' }, [
      _hoisted_1, // 静态节点：永远不参与 diff
      // 动态列表：renderList 生成，每个 li 带 patchFlag
      (_openBlock(true),
      _createBlock(
        _Fragment,
        null,
        _renderList(
          _ctx.list,
          item => (
            _openBlock(),
            _createBlock(
              'li',
              {
                key: item.id, // 列表 diff 依据
                class: _normalizeClass({ active: item.isActive }), // 2 /* CLASS */
              },
              [
                _createVNode(
                  'span',
                  null,
                  _toDisplayString(item.name),
                  1 /* TEXT */,
                ),
                _createVNode(
                  'span',
                  { class: 'price' },
                  '¥' + _toDisplayString(item.price),
                  1 /* TEXT */,
                ),
              ],
            )
          ),
        ),
        256 /* UNKEYED_FRAGMENT */,
      )),
      _hoisted_2, // 静态节点
    ])
  )
}
```

```markdown [编译优化项]
-1 /_ HOISTED _/ → 静态提升：VNode 只创建 1 次，永远复用
1 /_ TEXT _/ → PatchFlags.TEXT：只比较文本内容
2 /_ CLASS _/ → PatchFlags.CLASS：只比较 class
patch 时只检查标志位，跳过其它属性的比较

\_openBlock / \_createBlock → Block 树：
动态子节点收集进 dynamicChildren，更新时只遍历该数组做靶向 diff，跳过静态节点
```

:::

除静态提升、PatchFlags、Block Tree 外，Vue 编译器还利用模板的结构化信息做进一步优化：

- **v-once**：标记只渲染一次的子树，后续更新直接复用缓存的 VNode 与 DOM，跳过整个 diff。
- **v-memo**：给定依赖数组，只有依赖变化才更新该元素及其子树（模板级的 `memo`）。
- **缓存事件处理函数（cacheHandlers）**：内联 `@click="..."` 会被缓存，避免每次渲染生成新函数引发子组件多余更新。
- **静态 props 提升**：完全静态的 props 对象被提升复用，避免重复创建。
- **class/style 静态前缀拆分**：把静态前缀与动态后缀拆开，运行时只处理动态部分。

### 8.3 对比总结

```markdown
React Compiler（通用 JavaScript 上的记忆化）：
输入是任意 JS/JSX，靠 SSA 与控制流分析推断"何时需要重算"
产物是插入 \_c 缓存槽的组件函数，不改变 React 运行时模型
收益是自动 useMemo/useCallback/稳定引用 → 更早 bailout，减少不必要更新

Vue 3 Compiler（结构化模板上的静态分析）：
输入是约束严格的 Template，靠 AST 转换判断"何处动态"
产物是携带 PatchFlags/Block Tree/静态提升的渲染函数
收益是运行时靶向 diff → 跳过静态节点，DOM 操作最小化
```

| 维度           | React Compiler                              | Vue 3 Compiler                              |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| **主要输入**   | JavaScript / JSX 中的组件和 Hook 代码       | Vue Template，也支持 JSX 但模板优化能力不同 |
| **主要目标**   | 自动记忆化，减少重复计算和不必要的子树更新  | 生成渲染函数并标记动态部分，减少 patch 范围 |
| **分析难点**   | JavaScript 控制流、别名、可变性和副作用分析 | 模板 AST 转换、指令语义和静态/动态节点分析  |
| **运行时配合** | 缓存槽与 Fiber Bailout                      | PatchFlags、Block Tree 与渲染器 patch       |

**对比总结**：两者都把「本由开发者手动完成的事」下沉到编译器，但方向相反——React Compiler 在**图灵完备的 JavaScript** 上做数据流分析，目标是让运行时“**少算、少更新**”；Vue Compiler 在**结构化模板**上做静态分析，目标是让运行时“**精准、跳过**”。因此 React Compiler 更难但更通用，Vue Compiler 更简单但受限于模板 DSL 的表达能力。二者最终都服务于同一个目标：让运行时用更少的判断到达「必须变化」的最小 DOM 操作集合。

## 9. 渲染器与宿主平台

### 9.1 React Reconciler

React Reconciler 与宿主渲染器分离，`react-dom`、React Native 等渲染器通过宿主配置完成节点操作：

```javascript
// React Host Config — 渲染器的配置接口（部分，简化）
// react-dom 和 react-native 通过这些接口接入 React 协调器
const HostConfig = {
  // === 节点操作 ===
  createInstance(type, props, rootContainer, hostContext) {
    return document.createElement(type) // DOM 平台
    // React Native: return new ReactNativeComponent(type)
  },
  createTextInstance(text, rootContainer, hostContext) {
    return document.createTextNode(text)
  },
  appendChild(parent, child) {
    parent.appendChild(child)
  },
  removeChild(parent, child) {
    parent.removeChild(child)
  },
  insertBefore(parent, child, beforeChild) {
    parent.insertBefore(child, beforeChild)
  },

  // === 属性操作 ===
  prepareUpdate(instance, type, oldProps, newProps) {
    // 返回属性差异（用于 updatePayload）
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // 应用属性变更到真实 DOM
  },

  // === 事件系统 ===
  // DOM 平台使用合成事件（SyntheticEvent）委托到根节点
  // React Native 直接绑定原生事件

  // === 调度 ===
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  shouldYield: shouldYieldToHost, // 时间切片判断
}
```

```javascript
// React DOM commit 阶段的简化流程
function commitRoot(root) {
  const finishedWork = root.finishedWork // WIP 树的根（已完成协调）

  // mutation 子阶段：应用 DOM 变更
  // 遍历 finishedWork 及其子树，根据 flags 执行操作
  commitMutationEffects(root, finishedWork)

  // 切换 Fiber 树指针：WIP 变为 current
  root.current = finishedWork

  // layout 子阶段：执行 useLayoutEffect
  commitLayoutEffects(finishedWork, root)
}
```

### 9.2 Vue 3 渲染器

Vue 的 `runtime-core` 同样保持平台无关，`runtime-dom` 通过 `nodeOps` 和 `patchProp` 提供 DOM 操作：

```javascript
// Vue 3 DOM 平台的 nodeOps（简化）
const nodeOps = {
  createElement: tag => document.createElement(tag),
  createText: text => document.createTextNode(text),
  createComment: text => document.createComment(text),

  setElementText: (el, text) => {
    el.textContent = text
  },
  setText: (node, text) => {
    node.nodeValue = text
  },

  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) parent.removeChild(child)
  },

  parentNode: node => node.parentNode,
  nextSibling: node => node.nextSibling,
  querySelector: selector => document.querySelector(selector),
}

// Vue 3 DOM 平台的 patchProp（简化）
const patchProp = (el, key, prevValue, nextValue) => {
  // 事件处理
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase()
    // 使用 invoker 缓存机制减少 addEventListener 调用
    patchEvent(el, eventName, prevValue, nextValue)
    return
  }
  // class 特殊处理
  if (key === 'class') {
    el.className = nextValue || ''
    return
  }
  // style 特殊处理
  if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
    return
  }
  // 普通属性
  if (nextValue == null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, nextValue)
  }
}
```

### 9.3 自定义渲染器对比

```javascript
// React：直接使用 react-reconciler 包构建自定义渲染器
import Reconciler from 'react-reconciler'

const MyRenderer = Reconciler(HostConfig) // 实现 Host Config 接口

// Vue 3：使用 createRenderer 构建自定义渲染器
import { createRenderer } from '@vue/runtime-core'

const { render, createApp } = createRenderer({
  createElement(type) {
    /* ... */
  },
  insert(child, parent, anchor) {
    /* ... */
  },
  patchProp(el, key, prevValue, nextValue) {
    /* ... */
  },
  // ... 其他 nodeOps
})
```

| 维度               | React                        | Vue 3                                    |
| ------------------ | ---------------------------- | ---------------------------------------- |
| **平台无关核心**   | `react-reconciler`           | `@vue/runtime-core`                      |
| **DOM 渲染器**     | `react-dom`                  | `@vue/runtime-dom`                       |
| **宿主操作抽象**   | Host Config                  | Renderer Options、`nodeOps`、`patchProp` |
| **特殊跨容器节点** | Portal                       | Teleport                                 |
| **自定义渲染器**   | 使用 `react-reconciler` 构建 | 使用 `createRenderer()` 构建             |

## 10. 设计取舍总结

React 和 Vue 3 在核心理念上的一致性——都追求声明式 UI、组件化、跨平台——使得它们在"**做什么**"上高度趋同。差异主要体现在"**怎么做**"以及"**复杂性放在哪里**"：

| React 更强调                                         | Vue 3 更强调                                     |
| ---------------------------------------------------- | ------------------------------------------------ |
| 组件是普通 JavaScript 函数，运行时协调具有高度动态性 | 模板提供更多静态信息，响应式系统精确建立数据依赖 |
| Fiber 将渲染拆成可调度的工作单元                     | 组件更新任务通过微任务批量执行                   |
| Lane 表达更新优先级、组合、跳过与重放                | Scheduler 保证任务去重、父子顺序和 pre/post 时序 |
| React Compiler 在不改变组件模型的前提下自动记忆化    | Vue Compiler 将动态信息编码进渲染函数和 VNode    |

两者的差异主要是复杂性放置位置不同。React 将更多复杂性放在 Fiber、协调和调度层；Vue 3 将更多复杂性放在响应式依赖、模板编译和靶向 patch 层。
