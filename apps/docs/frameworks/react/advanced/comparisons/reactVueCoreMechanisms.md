# React 与 Vue 3 核心机制对比

## 1. 总体架构

React 和 Vue 3 都将声明式 UI 转换为宿主平台节点，但两者分配运行时职责的方式不同：

```markdown
React：JSX → React Element → Fiber 协调 → Commit → 宿主节点
Vue 3：Template/JSX → VNode → 组件更新与 patch → 宿主节点
```

### 1.1 运行时入口流程对比

**React 的启动流程：**

```javascript
// React 18 应用的启动入口
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// 内部执行链（简化）：
// createRoot → createFiberRoot (创建 root Fiber + FiberRootNode)
// root.render → updateContainer → scheduleUpdateOnFiber
//   → ensureRootIsScheduled (根据 Lane 选择同步/并发执行)
//   → renderRootSync (同步) 或 renderRootConcurrent (并发)
//   → workLoopSync / workLoopConcurrent (遍历 Fiber 树)
//   → commitRoot (统一提交宿主变更)
```

**Vue 3 的启动流程：**

```javascript
// Vue 3 应用的启动入口
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// 内部执行链（简化）：
// createApp → ensureRenderer → createAppAPI (传入平台 nodeOps + patchProp)
//   → app.mount → createVNode(App) (将根组件包装为 VNode)
//   → render → patch(container, vnode) (首次挂载)
//   → processComponent → mountComponent
//   → createComponentInstance (创建组件实例)
//   → setupComponent (执行 setup，初始化响应式)
//   → setupRenderEffect (建立渲染 Effect——组件更新的核心)
//   → patch 生成的子树 VNode → 递归挂载 DOM
```

| 维度             | React                                        | Vue 3                                     |
| ---------------- | -------------------------------------------- | ----------------------------------------- |
| **UI 描述**      | React Element                                | VNode                                     |
| **运行时树**     | Fiber 树承载拓扑、状态、更新与调度信息       | VNode 树描述 UI，组件实例保存组件运行状态 |
| **更新定位**     | 从更新 Fiber 向根标记，再协调相关子树        | 响应式依赖触发对应组件的渲染 Effect       |
| **更新执行**     | Lane 选择更新，Scheduler 安排并发工作        | Scheduler 使用微任务批量执行组件任务      |
| **宿主更新**     | Render 阶段生成 flags，Commit 阶段统一提交   | `patch` 过程调用渲染器宿主操作            |
| **主要优化方向** | 可中断协调、优先级调度、运行时与编译器记忆化 | 响应式依赖追踪、模板编译优化、靶向更新    |

两套机制不存在严格的一一对应关系。尤其是 Fiber 同时承担多种运行时职责，不能简单等同于 Vue 的 VNode 或组件实例。

## 2. React Element 与 Vue VNode

### 2.1 React Element

React Element 是 `createElement` 或 JSX 编译后的产物，是一个描述 UI 的轻量对象：

```jsx
// 源码：JSX
function Welcome({ name }) {
  return <h1 className="greeting">Hello, {name}!</h1>
}

// 编译后：React 17+ 的自动 runtime
import { jsx as _jsx } from 'react/jsx-runtime'
function Welcome({ name }) {
  return _jsx('h1', {
    className: 'greeting',
    children: `Hello, ${name}!`,
  })
}
```

```javascript
// jsx() 实际输出的 React Element 对象结构
{
  $$typeof: Symbol.for('react.element'),  // 防止 XSS—JSON 无法序列化 Symbol
  type: 'h1',                              // 原生标签字符串 或 组件函数/类
  key: null,                               // 列表 key
  ref: null,                               // ref
  props: {
    className: 'greeting',
    children: 'Hello, World!',
  },
  _owner: null,  // 开发模式下记录哪个组件创建了该 Element
}
```

React Element 是一个**不可变快照**，每次渲染都会重新创建，Fiber 协调阶段通过比较新旧 Element 决定复用或重建。

### 2.2 Vue 3 VNode

Vue 3 的 VNode 除了描述 UI 结构外，还携带编译器生成的优化信息：

```javascript
// 模板: <div :class="cls" :id="id">{{ text }}</div>
// Vue 编译器输出的渲染函数（简化）
import { openBlock, createBlock, createVNode, toDisplayString } from 'vue'

export function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock('div', null, [
      createVNode(
        'div',
        {
          class: _ctx.cls,
          id: _ctx.id,
        },
        toDisplayString(_ctx.text),
        1 /* TEXT */,
      ),
    ])
  )
}
```

```javascript
// createVNode 实际输出的 VNode 对象结构
{
  __v_isVNode: true,          // VNode 标识
  type: 'div',                // 标签名或组件对象
  props: {                    // 属性
    class: 'container',
    id: 'app',
  },
  children: [ /* ... */ ],    // 子节点数组
  key: null,                  // 列表 key
  ref: null,                  // ref

  // --- 编译器优化标记 ---
  shapeFlag: 17,              // 组合标志：ELEMENT(1) + ARRAY_CHILDREN(16)
  patchFlag: 1,               // PatchFlags.TEXT — 只需比较文本内容
  dynamicProps: null,         // 动态属性列表（如 ["class", "id"]）
  dynamicChildren: null,      // Block 中收集的动态子节点

  // --- 运行时状态 ---
  el: null,                   // 对应的真实 DOM 引用
  component: null,            // 组件实例（如果是组件 VNode）
}
```

### 2.3 关键区别

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

## 3. Fiber 与 Vue 运行时结构

### 3.1 React Fiber 节点

React 将工作单元、树拓扑、组件状态、更新信息和调度优先级集中在 Fiber 节点上：

```javascript
// Fiber 节点的核心结构（简化版）
type Fiber = {
  // === 节点身份 ===
  tag: WorkTag,            // FunctionComponent(0)、HostComponent(5)、HostText(6) 等
  type: any,               // 函数组件本身 或 原生标签字符串 'div'
  key: null | string,      // diff 用的 key
  elementType: any,        // 原始 type（被 memo/lazy 包裹前的类型）

  // === 树结构（链表） ===
  return: Fiber | null,    // 父 Fiber — 完成当前节点后回到这里
  child: Fiber | null,     // 第一个子 Fiber
  sibling: Fiber | null,   // 下一个兄弟 Fiber

  // === 状态与 Props ===
  pendingProps: any,       // 本次渲染的新 props
  memoizedProps: any,      // 上次渲染的已生效 props
  memoizedState: any,      // Hooks 链表头部（函数组件）或 state（类组件）
  updateQueue: any,        // 更新的队列（类组件的 setState / 函数组件的 dispatch）

  // === 副作用标记 ===
  flags: Flags,            // 自身副作用：Placement | Update | Deletion | ...
  subtreeFlags: Flags,     // 子树中的副作用聚合（优化：快速跳过干净子树）
  deletions: Fiber[] | null, // 待删除的子 Fiber 列表

  // === 调度优先级 ===
  lanes: Lanes,            // 自身更新的优先级（位掩码）
  childLanes: Lanes,       // 子树中的更新优先级（用于向上冒泡）

  // === 双缓冲 ===
  alternate: Fiber | null, // 指向另一棵树中对应的 Fiber（current ↔ WIP）

  // === 渲染输出 ===
  stateNode: any,          // 真实 DOM 节点（HostComponent）或组件实例（ClassComponent）
}
```

**双缓冲机制**是 Fiber 架构的核心设计之一——内存中同时存在两棵 Fiber 树：

```markdown
current 树（当前屏幕） workInProgress 树（后台构建中）
A ←─── alternate ────→ A'
/ \ / \
 B C ←→ B' C'
│ │
D D'
↑ 正在构建到这里

构建完成后：workInProgress 变成新的 current（指针交换），旧 current 等待回收
```

```javascript
// createWorkInProgress — React 源码中创建/复用 WIP Fiber 的核心逻辑（简化）
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate

  if (workInProgress === null) {
    // 首次挂载：为 current 创建对应的 WIP Fiber
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 更新：复用已有的 WIP Fiber，重置关键字段
    workInProgress.pendingProps = pendingProps
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
    workInProgress.deletions = null
    // 保留 memoizedState、updateQueue 等用于恢复
  }

  workInProgress.type = current.type
  workInProgress.lanes = current.lanes
  workInProgress.childLanes = current.childLanes
  // ... 复制其他字段

  return workInProgress
}
```

### 3.2 Vue 3 运行时结构

```markdown
Vue 组件运行时
├── VNode：描述节点和子树
├── ComponentInternalInstance：保存组件状态与上下文
├── ReactiveEffect：收集响应式依赖并触发组件更新
└── Scheduler：批量安排组件任务和回调
```

Vue 3 将这些职责拆分到不同结构：

```javascript
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

```javascript
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

### 3.3 对比总结

```markdown
React：单一 Fiber 节点 = 状态容器 + 更新队列 + 副作用记录 + 调度信息 + 树拓扑
所有信息集中在一个节点上，通过 alternate 实现双缓冲

Vue 3：将职责按关注点分离
组件实例存状态、VNode 存 UI 描述、Effect 管理依赖追踪、Scheduler 管理更新时序
无需双缓冲——直接通过新旧 VNode 比较
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

**React 和 Vue 3 子节点 diff 的核心区别：**

```javascript
// React：单轮遍历 + Map 查找
// 1. 第一轮：从头开始按序比对（key 相同 → 复用，不同 → 跳出）
// 2. 第二轮：将旧子节点放入 Map<key, Fiber>，用新子节点 key 查找和移动
// 3. 第三轮：处理无法匹配的剩余节点（删除旧节点，创建新节点)

// Vue 3：双端比较 + 最长递增子序列
// 1. 从头部、尾部同时向中间扫描（synced from start / synced from end）
// 2. 中间无法匹配的部分才建立 key → index Map 进行查找
// 3. 通过最长递增子序列算法最小化移动操作

// 示例：旧 [A B C D E F] → 新 [A C D B G F]
// Vue 双端 diff：
//   头部同步：A = A ✓（复用）
//   尾部同步：F = F ✓（复用）
//   剩余 [B C D E] vs [C D B G] → 建 Map，逐个查找
// React diff：
//   首轮：A=A, B≠C → 跳出
//   建 Map: {A, B, C, D, E, F}，遍历新列表查找
```

| 维度             | React                                       | Vue 3                                                 |
| ---------------- | ------------------------------------------- | ----------------------------------------------------- |
| **更新来源**     | `setState`、Hook dispatch、外部 Store 等    | `ref`、`reactive` 等响应式数据触发依赖                |
| **比较输入**     | 新 React Element 与 current Fiber           | 新旧 VNode                                            |
| **列表复用依据** | `type` 与 `key`                             | `type` 与 `key`                                       |
| **变更提交**     | Commit 阶段处理 Placement、Update、Deletion | patch 过程中调用 insert、patchProp、remove 等宿主操作 |
| **跳过工作**     | Bailout、`memo`、稳定引用、编译器缓存       | 响应式依赖、PatchFlags、Block Tree、静态提升          |

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

### 6.1 React Hooks

React Hooks 按调用顺序存储在 Fiber 的 `memoizedState` 单向链表上：

```javascript
// 组件渲染时，Hooks 在 Fiber 上的存储结构
fiber.memoizedState = {
  // 第一个 useState(0)
  memoizedState: 0, // 当前值
  queue: {
    // dispatch 的更新队列（环形链表）
    pending: {
      action: 1, // setState 传入的值或函数
      lane: SyncLane,
      next: {
        /* 下一个 update 或自身 */
      },
    },
  },
  next: {
    // 链表指针 → 第二个 Hook
    // useEffect
    memoizedState: {
      create: () => {
        /* 副作用函数 */
      },
      destroy: () => {
        /* cleanup 函数 */
      },
      deps: [count], // 依赖数组
      next: null, // 同组件多个 useEffect 组成链表
    },
    next: {
      // useRef
      memoizedState: { current: divElement },
      next: null,
    },
  },
}
```

```javascript
// useState 的简化实现——展示为什么 Hook 调用顺序不能变
let workInProgressHook = null // 当前正在处理的 Hook 节点

function mountState(initialState) {
  const hook = {
    memoizedState:
      typeof initialState === 'function' ? initialState() : initialState,
    queue: { pending: null },
    next: null,
  }
  // 将 hook 追加到当前 Fiber 的 Hooks 链表尾部
  if (workInProgressHook === null) {
    // 第一个 Hook → 设置链表头
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    // 后续 Hook → 追加到尾部
    workInProgressHook = workInProgressHook.next = hook
  }

  const dispatch = action => {
    // 将 update 加入环形链表 → 标记 fiber lanes → scheduleUpdateOnFiber
    enqueueRenderPhaseUpdate(hook.queue, action)
    scheduleUpdateOnFiber(root, currentlyRenderingFiber, SyncLane)
  }

  return [hook.memoizedState, dispatch]
}

function updateState() {
  // 按链表顺序取下一个 Hook——跳过就是错位
  const hook = workInProgressHook
  workInProgressHook = hook.next

  // 执行更新队列中的所有 action，计算最新状态
  const queue = hook.queue
  if (queue.pending !== null) {
    let newState = hook.memoizedState
    let update = queue.pending.next // 从最早的 update 开始
    do {
      newState =
        typeof update.action === 'function'
          ? update.action(newState)
          : update.action
      update = update.next
    } while (update !== queue.pending.next)
    hook.memoizedState = newState
  }

  return [hook.memoizedState, dispatch]
}
```

### 6.2 Vue 3 响应式系统

Vue 3 的响应式基于 `Proxy` + `ReactiveEffect` 依赖追踪：

```javascript
// reactive 的简化实现
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      // 依赖收集：将当前活跃的 Effect 记录为该 key 的依赖
      track(target, key)
      // 深度响应式：如果值是对象，递归包装
      return isObject(value) ? reactive(value) : value
    },

    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      // 触发更新：通知所有依赖该 key 的 Effect 重新执行
      if (oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
  })
}

// ref 的简化实现
function ref(value) {
  const r = {
    _value: toReactive(value), // 对象走 reactive，原始值直接存
    get value() {
      track(r, 'value') // 读取时收集依赖
      return this._value
    },
    set value(newValue) {
      if (newValue !== this._value) {
        this._value = toReactive(newValue)
        trigger(r, 'value') // 写入时触发更新
      }
    },
  }
  return r
}
```

```javascript
// track 和 trigger — 响应式系统的连接枢纽（简化）
const targetMap = new WeakMap() // target → Map<key, Set<Effect>>

function track(target, key) {
  if (!activeEffect) return // 不在 Effect 上下文中，不收集

  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))

  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))

  dep.add(activeEffect) // 记录：这个 Effect 依赖 target.key
  activeEffect.deps.push(dep) // Effect 也反向记录自己订阅了哪些 dep（用于 cleanup）
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (dep) {
    // 通知所有依赖该 key 的 Effect
    dep.forEach(effect => {
      if (effect.scheduler) {
        effect.scheduler() // 组件更新走 scheduler → queueJob
      } else {
        effect.run() // computed 直接执行
      }
    })
  }
}
```

### 6.3 computed vs useMemo

```javascript
// Vue 3 computed 的简化实现——惰性求值 + 缓存
function computed(getter) {
  let dirty = true // 是否需要重新计算
  let cachedValue // 缓存的计算结果

  const effect = new ReactiveEffect(getter, () => {
    // scheduler：依赖变化时只标记 dirty，不立即计算
    dirty = true
  })

  return {
    get value() {
      if (dirty) {
        cachedValue = effect.run() // 重新计算
        dirty = false
      }
      track(this, 'value') // 让外层 Effect 收集到 computed 的依赖
      return cachedValue
    },
  }
}
```

```javascript
// React useMemo — 依赖数组变化后重新计算
// 实现非常直接：比较 deps，不同则重新执行
function useMemo(nextCreate, deps) {
  const hook = workInProgressHook
  workInProgressHook = hook.next

  const prevDeps = hook.memoizedState?.[1]
  // 浅比较依赖数组
  if (
    prevDeps !== null &&
    deps.every((dep, i) => Object.is(dep, prevDeps[i]))
  ) {
    return hook.memoizedState[0] // 缓存命中，返回旧值
  }

  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, deps]
  return nextValue
}
```

**关键区别**：`computed` 通过响应式依赖自动决定何时重新计算，无需手动声明依赖数组；`useMemo` 需要开发者显式列出所有依赖。

### 6.4 Context vs provide/inject

```jsx
// React Context：Provider value 变化 → 标记所有 Consumer Fiber
const ThemeContext = createContext('light')

function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

// Consumer 通过 useContext 读取，内部走 beginWork 中的 propagateContextChange
function Toolbar() {
  const theme = useContext(ThemeContext) // Provider value 变化 → 该组件重新渲染
  return <div className={theme}>...</div>
}
```

```vue
<!-- Vue 3 provide/inject -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', theme) // 注入响应式 ref
// 注意：provide 普通值不具备响应性——修改不会触发子组件更新
</script>

<!-- 子组件 -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme') // 获得 ref 对象本身，读取 .value 触发依赖收集
</script>
```

| 维度         | React                                               | Vue 3                                                           |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| **状态读取** | 组件执行时按 Hooks 顺序读取状态                     | 访问 `ref.value` 或响应式代理属性                               |
| **依赖关系** | Hook 调用顺序、依赖数组、组件树传播                 | ReactiveEffect 与响应式属性之间的依赖集合                       |
| **派生缓存** | `useMemo`，依赖数组变化后重新计算                   | `computed`，根据响应式依赖失效并惰性求值                        |
| **跨层注入** | Context Provider / `useContext`                     | `provide()` / `inject()`                                        |
| **注入更新** | Provider value 改变后标记订阅该 Context 的 Consumer | 注入普通值本身不响应；注入 `ref` 或响应式对象时沿响应式依赖更新 |

`useMemo` 与 `computed`、Context 与 provide/inject 的用途存在交集，但触发模型和生命周期并不相同，不能视为完全等价的 API。

## 7. 副作用时序

### 7.1 React 副作用时序

React 强制区分可重试的 Render 与不可中断的 Commit。不同 Effect 位于不同的提交时机：

```markdown
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

```jsx
// React 副作用时序验证示例
function TimingDemo() {
  const ref = useRef(null)

  useInsertionEffect(() => {
    console.log('1. useInsertionEffect — DOM 更新后，绘制前')
  })

  useLayoutEffect(() => {
    console.log('2. useLayoutEffect — 可同步读取/修改 DOM，阻塞绘制')
    const rect = ref.current.getBoundingClientRect()
    console.log('   DOM 尺寸:', rect.width)
  })

  useEffect(() => {
    console.log('4. useEffect — 浏览器绘制之后，异步执行')
  })

  console.log('0. Render — 纯计算，无副作用')
  return <div ref={ref}>Hello</div>
}

// 控制台输出：
// 0. Render — 纯计算，无副作用
// 1. useInsertionEffect — DOM 更新后，绘制前
// 2. useLayoutEffect — 可同步读取/修改 DOM，阻塞绘制
//       （浏览器在此时绘制）
// 4. useEffect — 浏览器绘制之后，异步执行
```

### 7.2 Vue 3 副作用时序

Vue 3 使用组件更新 Effect、生命周期钩子以及 `watch` / `watchEffect` 表达副作用，并通过 `flush` 控制回调相对组件更新的时机：

```markdown
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

```vue
<script setup>
import { ref, watch, watchEffect, onUpdated, nextTick } from 'vue'

const count = ref(0)

// flush: 'pre'（默认）— DOM 更新前执行
watch(count, (newVal, oldVal) => {
  console.log('1. watch(pre) — DOM 更新前，可访问旧 DOM 状态')
})

// flush: 'post' — DOM 更新后执行
watch(
  count,
  (newVal, oldVal) => {
    console.log('3. watch(post) — DOM 已更新，可访问新 DOM 状态')
  },
  { flush: 'post' },
)

onUpdated(() => {
  console.log('2. onUpdated — 组件 DOM 更新后执行')
})

// flush: 'sync' — 同步执行（每次变更立即触发，慎用）
watch(
  count,
  () => {
    console.log('0. watch(sync) — 状态变更时立即同步执行')
  },
  { flush: 'sync' },
)

function increment() {
  count.value++ // 触发以上所有 watch + onUpdated 按 flush 时序执行
}

// nextTick — 等待 DOM 更新完成
async function demo() {
  count.value++
  await nextTick()
  console.log('DOM 已更新完毕')
}
</script>
```

### 7.3 时序对比

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

## 8. 编译器优化

### 8.1 React Compiler

React Compiler 面向 JavaScript 和 JSX 进行数据流与依赖分析，自动插入记忆化缓存：

```jsx
// 编译前：开发者手写组件的常见非优化模式
function ProductList({ products, category }) {
  const filtered = products.filter(p => p.category === category)
  const sorted = [...filtered].sort((a, b) => b.price - a.price)

  const handleAdd = id => {
    addToCart(id)
  }

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

```jsx
// React Compiler 编译后：自动注入缓存和稳定引用
function ProductList(t0) {
  const { products, category } = t0
  const $ = _c(5) // 分配 5 个缓存槽

  // 自动 useMemo：filtered 仅在 products 或 category 变化时重新计算
  let filtered
  if ($[0] !== products || $[1] !== category) {
    filtered = products.filter(p => p.category === category)
    $[0] = products
    $[1] = category
    $[2] = filtered
  } else {
    filtered = $[2]
  }

  // 自动 useMemo：sorted 仅在 filtered 变化时重新计算
  let sorted
  if ($[3] !== filtered) {
    sorted = [...filtered].sort((a, b) => b.price - a.price)
    $[3] = filtered
    $[4] = sorted
  } else {
    sorted = $[4]
  }

  // 自动 useCallback：handleAdd 引用稳定
  const handleAdd = _cached(0, () => id => {
    addToCart(id)
  })

  // 自动提取不变的对象引用
  const style = _cached(1, () => ({ border: '1px solid #eee' }))

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

React Compiler 的核心思路是：在编译时分析 JavaScript 的 SSA（Static Single Assignment）和控制流，找出哪些表达式在哪些条件下会重新计算，然后插入记忆化逻辑。它不改变 React 的运行时模型，只帮助运行时更早地 bailout。

### 8.2 Vue 3 Compiler

Vue 编译器利用模板语法的结构化约束生成带优化提示的渲染函数：

```vue
<!-- 编译前：标准 Vue 模板 -->
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

    <footer class="static-footer">
      <p>底部信息</p>
    </footer>
  </div>
</template>
```

```javascript
// Vue 3 Compiler 编译后的渲染函数（简化且附加注释）
import {
  createVNode as _createVNode,
  createBlock as _createBlock,
  openBlock as _openBlock,
  Fragment as _Fragment,
  toDisplayString as _toDisplayString,
  normalizeClass as _normalizeClass,
  renderList as _renderList,
} from 'vue'

// 静态提升：不变的 VNode 提升到 render 外部，多次渲染复用
const _hoisted_1 = _createVNode(
  'h1',
  { class: 'title' },
  '商品列表',
  -1 /* HOISTED */,
)
const _hoisted_2 = _createVNode(
  'p',
  { class: 'hint-static' },
  '共 100 件商品',
  -1,
)
const _hoisted_3 = _createVNode('p', null, '底部信息', -1)
const _hoisted_4 = _createVNode(
  'footer',
  { class: 'static-footer' },
  [_hoisted_3],
  -1,
)

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createBlock('div', { class: 'container' }, [
      _hoisted_1, // 静态节点：永远不参与 diff
      _hoisted_2, // 静态节点

      // 动态列表：通过 renderList 创建，每个 li 标记为动态
      (_openBlock(true),
      _createBlock(
        _Fragment,
        null,
        _renderList(_ctx.list, item => {
          return (
            _openBlock(),
            _createBlock(
              'li',
              {
                key: item.id, // key 用于列表 diff
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
          )
        }),
        256 /* UNKEYED_FRAGMENT */, // Fragment 的 patchFlag
      )),

      _hoisted_4, // 静态节点
    ])
  )
}
```

```markdown
编译优化项详解：
-1 /_ HOISTED _/ → 静态提升：VNode 只创建 1 次，永远复用
1 /_ TEXT _/ → PatchFlags.TEXT：只需比较文本内容
2 /_ CLASS _/ → PatchFlags.CLASS：只需比较 class
patch 时只检查标志位，跳过所有其他属性的比较
\_openBlock / \_createBlock → Block 树：
\_createBlock 内部将动态子节点收集到 dynamicChildren 数组
更新时直接遍历该数组做靶向 diff，跳过静态节点
```

| 维度           | React Compiler                              | Vue 3 Compiler                              |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| **主要输入**   | JavaScript / JSX 中的组件和 Hook 代码       | Vue Template，也支持 JSX 但模板优化能力不同 |
| **主要目标**   | 自动记忆化，减少重复计算和不必要的子树更新  | 生成渲染函数并标记动态部分，减少 patch 范围 |
| **分析难点**   | JavaScript 控制流、别名、可变性和副作用分析 | 模板 AST 转换、指令语义和静态/动态节点分析  |
| **运行时配合** | 缓存槽与 Fiber Bailout                      | PatchFlags、Block Tree 与渲染器 patch       |

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
