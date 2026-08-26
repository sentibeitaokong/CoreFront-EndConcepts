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

## 6. Hooks、响应式系统与 Context

### 6.1 React：Hooks

React 用「调用顺序」而非「名字」定位状态：所有 Hooks 都挂在 Fiber 的 `memoizedState` 单向链表上，渲染时逐个取用。

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

**顺序为什么不能变**：链表里没有任何 key/名字，每次 `useState`/`useMemo`/`useEffect` 都按「取当前节点 → 指针前进一格」定位。某次渲染一旦跳过某个 Hook，后续所有 Hook 整体错位——`count` 可能读到 `useEffect` 的 `deps`，`setState` 的更新可能写进 `useRef`，这正是 `eslint-plugin-react-hooks` 必须静态检查调用顺序的原因。`useState` 本质是 `useReducer` 的特例（reducer 固定为「覆盖或应用 updater」），两者共享同一套 `updateQueue` 环形链表。

### 6.2 Vue 3：响应式系统

Vue 3 的响应式基于 `Proxy` + `ReactiveEffect`：`get` 时收集依赖、`set` 时触发更新，形成一张精确的依赖图——数据变了只通知依赖它的 Effect，而非整棵树重跑。

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

**ref 与 reactive**：`reactive` 只接受对象、靠 Proxy 拦截；`ref` 可包任意值、靠 `.value` 的 getter/setter。解构 `reactive` 会丢失响应性（需 `toRefs`），解构 `ref` 无碍；二者底层共享同一套 `track`/`trigger`。

### 6.3 computed 与 useMemo

:::code-group

```javascript [Vue computed]
// 惰性求值 + dirty 缓存：没人读就不算，依赖变了只标脏
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

```javascript [React useMemo]
// 渲染期同步执行：比较 deps，变了才重算
function useMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook()
  const prev = hook.memoizedState
  if (prev !== null && deps.every((d, i) => Object.is(d, prev[1][i])))
    return prev[0] // 缓存命中
  const value = nextCreate()
  hook.memoizedState = [value, deps]
  return value
}
```

:::

两者都缓存派生值，但失效与求值机制截然不同：

| 维度         | Vue 3 `computed`                                     | React `useMemo`                                 |
| ------------ | ---------------------------------------------------- | ----------------------------------------------- |
| **依赖声明** | 无需手动声明，读取响应式数据时自动 `track` 收集依赖  | 必须显式传入 `deps` 数组，靠 `Object.is` 浅比较 |
| **求值时机** | 惰性求值——被读取时才计算，依赖变化只标记 `dirty`     | 渲染时同步求值——每次渲染都检查 deps 并重算      |
| **失效粒度** | 精确到具体响应式属性，只依赖真正读过的属性           | 整个 deps 数组任一引用变化即整体失效            |
| **失效传播** | 天然级联，computed 可依赖 computed，外层感知内层失效 | 依赖链需手动在 deps 中逐层声明                  |

**关键区别**：`computed` 把「何时重算」交给响应式依赖图——自动、惰性、按属性粒度失效；`useMemo` 把「何时重算」交给开发者手写的 `deps` 数组——手动、同步、按数组整体失效。前者省心但仅限响应式数据，后者通用但更易写出遗漏依赖或过度失效的代码。

### 6.4 Context 与 provide/inject

:::code-group

```jsx [React Context]
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

```vue [Vue provide/inject]
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

:::

> **深度洞察：Context 的“广播式”重渲染 vs provide/inject 的“查找式”注入**
> React 的 Context 一旦 `Provider.value` 变化，所有读取该 Context 的 Consumer 都会重新渲染（除非用 `memo` 或 React Compiler 拦截），哪怕它们只用到了其中一小部分字段。这是“自上而下广播”的代价，也是拆分多个 Context、用 `useMemo` 稳定 value 的动机。
> Vue 的 `provide`/`inject` 本身只是沿着组件实例的 `parent` 链向上查找一次，**不建立订阅关系**。真正让跨层数据响应化的是被注入的 `ref`/`reactive` 对象——子组件读取 `inject('theme').value` 时，依赖被收集到子组件自己的 Effect 上，因此更新时只有真正用到的子组件重新执行，粒度天然更细。

| 维度           | React Context                                           | Vue 3 provide/inject                                    |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| **订阅关系**   | `useContext` 读取即订阅，Provider value 变化触发重渲染  | `provide`/`inject` 本身不订阅，只沿 `parent` 链查找一次 |
| **更新传播**   | 广播式：所有 Consumer 重渲染（除非 memo/Compiler 拦截） | 点对点：注入 ref/reactive 后，仅真正读取的组件更新      |
| **响应性来源** | Provider 的 `value` 本身，由 React 渲染机制驱动         | 被注入对象自身的响应式，由 Proxy/ref 依赖收集驱动       |
| **粒度**       | 粗：按 Context 维度，只用到一小部分字段也会整体重渲染   | 细：按具体响应式属性，读哪个属性就订阅哪个              |
| **默认值**     | `createContext(defaultValue)` 提供                      | `inject(key, defaultValue)` 提供                        |

### 6.5 对比总结

```markdown
React（顺序链表 + 显式声明）：
状态挂在 Fiber.memoizedState 单向链表，靠调用顺序定位
派生值靠 useMemo 手动声明 deps，跨层靠 Context 自上而下广播
更新是"整棵树重新执行函数"，再由 memo / Compiler 尽量跳过

Vue 3（依赖图 + 自动推导）：
状态是 Proxy/ref 包裹的响应式对象，靠 track/trigger 建立精确依赖
派生值靠 computed 自动失效 + 惰性缓存，跨层靠 provide/inject 沿链查找
更新是"数据 → 依赖它的 Effect"点对点触发，天然最小化
```

| 维度         | React                                               | Vue 3                                                           |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| **状态读取** | 组件执行时按 Hooks 顺序读取状态                     | 访问 `ref.value` 或响应式代理属性                               |
| **依赖关系** | Hook 调用顺序、依赖数组、组件树传播                 | ReactiveEffect 与响应式属性之间的依赖集合                       |
| **派生缓存** | `useMemo`，依赖数组变化后重新计算                   | `computed`，根据响应式依赖失效并惰性求值                        |
| **跨层注入** | Context Provider / `useContext`                     | `provide()` / `inject()`                                        |
| **注入更新** | Provider value 改变后标记订阅该 Context 的 Consumer | 注入普通值本身不响应；注入 `ref` 或响应式对象时沿响应式依赖更新 |

**对比总结**：`useMemo` 与 `computed`、Context 与 provide/inject 的用途确有交集，但触发模型与生命周期并不相同——React 依赖显式声明（deps 数组、Context 订阅）配合整树重算 + 跳过优化；Vue 依赖自动依赖图与点对点失效。二者不能简单视为等价 API，迁移时需重新审视数据流如何组织、依赖如何建立。

## 7. 副作用时序

### 7.1 React：副作用时序

React 强制区分可重试的 Render 与不可中断的 Commit。不同 Effect 位于不同的提交时机：

:::code-group

```markdown [执行顺序]
执行顺序（单次渲染）：
Render 阶段（可中断、可重试，纯计算，无副作用）
→ 计算新 Fiber 树
→ 标记 flags
↓
Commit 阶段（不可中断，宿主操作提交）
→ mutation 子阶段：应用 DOM 变更
→ useInsertionEffect 执行（CSS-in-JS 注入用，极少数场景）
→ layout 子阶段：useLayoutEffect setup 执行（同步，阻塞绘制）
↓
浏览器绘制
↓
useEffect setup 执行（异步，不阻塞绘制）
```

```jsx [时序验证示例]
function TimingDemo() {
  const ref = useRef(null)

  useInsertionEffect(() =>
    console.log('1. useInsertionEffect — DOM 更新后，绘制前'),
  )
  useLayoutEffect(() => {
    console.log('2. useLayoutEffect — 可同步读取/修改 DOM，阻塞绘制')
    console.log('   DOM 尺寸:', ref.current.getBoundingClientRect().width)
  })
  useEffect(() => console.log('4. useEffect — 浏览器绘制之后，异步执行'))

  console.log('0. Render — 纯计算，无副作用')
  return <div ref={ref}>Hello</div>
}
// 控制台输出：
// 0. Render — 纯计算，无副作用
// 1. useInsertionEffect — DOM 更新后，绘制前
// 2. useLayoutEffect — 可同步读取/修改 DOM，阻塞绘制（浏览器在此时绘制）
// 4. useEffect — 浏览器绘制之后，异步执行
```

:::

### 7.2 Vue 3：副作用时序

Vue 3 使用组件更新 Effect、生命周期钩子以及 `watch` / `watchEffect` 表达副作用，并通过 `flush` 控制回调相对组件更新的时机：

:::code-group

```markdown [执行顺序]
执行顺序（单次组件更新）：
组件 Effect 触发（响应式数据变化）
↓
pre flush callbacks 执行（flush: 'pre' 的 watcher）
↓
组件 render 函数执行 → patch DOM
↓
post flush callbacks 执行（flush: 'post' 的 watcher + onUpdated）
↓
浏览器绘制
```

```vue [watch flush 示例]
<script setup>
import { ref, watch, onUpdated, nextTick } from 'vue'
const count = ref(0)

watch(count, () => console.log('1. watch(pre) — DOM 更新前，可访问旧 DOM')) // 默认 pre
watch(count, () => console.log('3. watch(post) — DOM 更新后，可访问新 DOM'), {
  flush: 'post',
})
watch(count, () => console.log('0. watch(sync) — 立即同步执行'), {
  flush: 'sync',
}) // 慎用
onUpdated(() => console.log('2. onUpdated — 组件 DOM 更新后执行'))

async function increment() {
  count.value++ // 依次触发 sync → pre → render/patch → post
  await nextTick() // post 全部完成，DOM 已更新
}
</script>
```

:::

### 7.3 对比总结

```markdown
React（有 useLayoutEffect 时）:
Render → 计算 DOM 变更 → useInsertionEffect → useLayoutEffect
→ 浏览器绘制 → useEffect

Vue 3:
组件 Effect → pre flush watchers → render + patch DOM
→ post flush (onUpdated + post watchers → nextTick resolve)
→ 浏览器绘制

关键差异：

- React useLayoutEffect 在绘制前同步执行，可阻塞绘制
- Vue 3 没有等价于 useLayoutEffect 的钩子，DOM patch 后自动进入绘制
- 如果需要在 Vue 3 中同步读取 DOM，需在 onUpdated 中用 nextTick 或直接操作
```

| 需求                       | React                                       | Vue 3                                                                   |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| **渲染后异步副作用**       | `useEffect`                                 | `watch` / `watchEffect` 的默认 pre 时序并不等同；需要根据需求选择 flush |
| **DOM 更新后同步读取布局** | `useLayoutEffect`                           | `onUpdated`、`nextTick` 或 `flush: 'post'`                              |
| **副作用清理**             | Effect 返回 cleanup                         | `onCleanup` / `onWatcherCleanup`、生命周期钩子                          |
| **开发期重复检查**         | Strict Mode 会额外执行 Effect setup/cleanup | 开发模式采用不同的告警与检查策略                                        |

**对比总结**：React 用「Effect 类型」划分执行窗口（`useInsertionEffect` → `useLayoutEffect` → `useEffect`），由 Fiber 的 Commit 阶段统一编排，副作用相对 DOM 提交的位置非常精确；Vue 用「flush 时机」划分（`pre` → 组件 render → `post`），本质是把回调挂到同一个微任务刷新队列的不同阶段。二者都解决了“**副作用应在 DOM 更新的哪个点执行**”的问题，区别在于：React 提供了绘制前同步执行的能力（`useLayoutEffect`），而 Vue 默认把这类需求交给 `onUpdated` + `nextTick` 处理。

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
