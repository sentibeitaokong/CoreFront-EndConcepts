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

[//]: # '## 5. 调度 (Scheduling) 与批处理：并发时代的控场逻辑'
[//]: #
[//]: # '### 5.1 React Lane 模型与微秒级时间切片'
[//]: #
[//]: # 'React 从 16 版本的 `ExpirationTime` 模型升级为 18 版本的 `Lane` 算法。Lane 使用 31 位二进制整数表示优先级，这带来了极其优雅的位运算能力。'
[//]: #
[//]: # '```javascript'
[//]: # '// Lane 模型，高位优先级低，低位优先级高'
[//]: # 'const SyncLane = 0b0000000000000000000000000000001; // 1'
[//]: # 'const InputContinuousLane = 0b0000000000000000000000000000100; // 4'
[//]: # 'const TransitionLane = 0b0000000000000000000001000000000; // 512'
[//]: #
[//]: # '// 为什么使用位运算？'
[//]: # '// 合并两批任务：lanes = lane1 | lane2'
[//]: # '// 剔除已完成任务：lanes &= ~completedLanes'
[//]: # '// 判断是否包含特定优先级：(lanes & subsetLanes) !== NoLanes'
[//]: #
[//]: # '```'
[//]: #
[//]: # '**时间切片（Time Slicing）核心原理：**'
[//]: # '在并发模式下，React 会调用全局的 `Scheduler` 包。Scheduler 维护了一个任务最小堆（Min-Heap），并利用 `MessageChannel` （一种宏任务机制）在浏览器重绘后获取执行权。它将执行权切割为约 `5ms` 的时间片。当执行一个 Fiber 单元后，如果 `performance.now() - startTime > 5ms`，React 就会强制中断 `workLoop`，交出主线程，并在下一个宏任务中恢复。这种精密的控制彻底消灭了大型 React 应用的输入框卡顿。'
[//]: #
[//]: # '### 5.2 Vue 3：基于 Event Loop 的微任务批处理去重'
[//]: #
[//]: # 'Vue 3 的调度策略相对更加平面化。它的首要目标不是打断，而是**合并同一事件循环内的状态突变**。'
[//]: #
[//]: # '```javascript'
[//]: # '// Vue 3 内部的调度器队列去重逻辑'
[//]: # 'const queue = [];'
[//]: # 'let isFlushPending = false;'
[//]: #
[//]: # 'function queueJob(job) {'
[//]: # '  // 利用 Array.includes 或 Set 确保同一个组件的渲染函数在一轮微任务中只被推入一次'
[//]: # '  if (!queue.includes(job)) {'
[//]: # '    queue.push(job);'
[//]: # '  }'
[//]: # '  // 启动微任务 (Promise.resolve)'
[//]: # '  if (!isFlushPending) {'
[//]: # '    isFlushPending = true;'
[//]: # '    Promise.resolve().then(flushJobs);'
[//]: # '  }'
[//]: # '}'
[//]: #
[//]: # '// flushJobs 会对 queue 按照组件深度 (父到子) 进行排序，确保父组件总是先于子组件更新'
[//]: #
[//]: # '```'
[//]: #
[//]: # '如果开发者在同一段同步代码中执行了 `count.value++` 100次，由于响应式系统触发 `queueJob` 的去重特性，微任务队列里始终只有一个更新任务，因此只会触发一次 `patch` 树重绘。这提供了非常直观和可预测的心智模型。'
[//]: #
[//]: # '---'
[//]: #
[//]: # '## 6. Hooks 与响应式系统：代数效应 vs 数据劫持'
[//]: #
[//]: # '### 6.1 React Hooks：基于调用链的代数效应'
[//]: #
[//]: # 'Hooks 的本质是在函数式组件中，将状态持久化到了组件对应的 Fiber 节点上。'
[//]: #
[//]: # '```javascript'
[//]: # '// React Hooks 强依赖调用顺序的底层原因'
[//]: # '// Fiber 节点上维护着一个单向链表'
[//]: # 'fiber.memoizedState = {'
[//]: # '  memoizedState: 0, // 第一个 useState 的值'
[//]: # '  next: {'
[//]: # '    memoizedState: /* useEffect 的闭包 */, '
[//]: # '    next: {'
[//]: # '      // useRef 等其他 hook'
[//]: # '    }'
[//]: # '  }'
[//]: # '}'
[//]: #
[//]: # '```'
[//]: #
[//]: # '因为 React 在执行组件函数时，纯粹依靠内部一个名为 `workInProgressHook` 的全局指针来按顺序取出对应的状态。如果使用了 `if` 语句包裹 Hook，会导致指针错位，取出错误的状态，这也是 `eslint-plugin-react-hooks` 强制要求 Hook 不能放在条件语句中的根本原因。'
[//]: #
[//]: # '### 6.2 Vue 3 Reactivity：基于 Proxy 的透明劫持'
[//]: #
[//]: # 'Vue 3 抛弃了 `Object.defineProperty`，利用 ES6 的 `Proxy` 和 `Reflect` 构建了彻底的响应式依赖图。'
[//]: #
[//]: # '```javascript'
[//]: # '// 响应式追踪的灵魂枢纽：targetMap'
[//]: # '// targetMap 是一个 WeakMap，避免内存泄漏'
[//]: # '// 结构：WeakMap<Target, Map<Key, Set<ReactiveEffect>>>'
[//]: # 'const targetMap = new WeakMap()'
[//]: #
[//]: # 'function track(target, key) {'
[//]: # '  if (activeEffect) {'
[//]: # '    let depsMap = targetMap.get(target)'
[//]: # '    let dep = depsMap.get(key)'
[//]: # '    dep.add(activeEffect) // 将当前执行的渲染函数或 watcher 闭包记录到这个具体属性的订阅者列表中'
[//]: # '  }'
[//]: # '}'
[//]: #
[//]: # '```'
[//]: #
[//]: # '当开发者修改 `reactive` 代理对象的属性时，`set` 夹层被触发，直接从 `targetMap` 中提取出所有依赖于该属性的 `ReactiveEffect` 并放入微任务队列执行。这种机制完全摆脱了调用顺序的限制，允许在条件分支、循环甚至普通 JS 文件中自由使用响应式 API。'
[//]: #
[//]: # '---'
[//]: #
[//]: # '## 7. 副作用时序与浏览器渲染管道集成'
[//]: #
[//]: # 'React 和 Vue 对于副作用的处理时机都深刻绑定了浏览器的渲染流水线（DOM 树构建 → 样式计算 → 布局 Layout → 绘制 Paint）。'
[//]: #
[//]: # '### 7.1 React 的三段式副作用'
[//]: #
[//]: # '在 Commit 阶段，React 区分了三种 Effect 的触发时机：'
[//]: #
[//]: # '1. **`useInsertionEffect`**：DOM 突变发生之前。主要用于 CSS-in-JS 库注入样式标签，防止出现样式重算闪烁。'
[//]: # '2. **`useLayoutEffect`**：DOM 突变刚完成，但**浏览器尚未开始绘制（Paint）**。它是同步执行的，会阻塞浏览器的渲染流水线。非常适合在此处读取 DOM 的最新尺寸（如 `getBoundingClientRect`）并同步触发重渲染，用户不会看到闪烁。'
[//]: # '3. **`useEffect`**：浏览器已经完成绘制，将控制权交回给 JS 引擎后。它是异步执行的，不会阻塞屏幕更新，用于网络请求、非视觉关键的事件绑定等。'
[//]: #
[//]: # '### 7.2 Vue 3 的 flush 机制'
[//]: #
[//]: # 'Vue 3 不强调阻塞渲染，而是通过微任务中队列的前后排序来控制执行时机：'
[//]: #
[//]: # "1. **`watch(..., { flush: 'pre' })`**（默认）：组件 DOM 树更新前执行，此时可以访问到旧的 DOM 状态。"
[//]: # "2. **`onUpdated` / `watch(..., { flush: 'post' })**`：在当前组件及所有子孙组件完成 patch 更新之后执行。"
[//]: # '   若要达到类似 React `useLayoutEffect` 确保不闪屏的同步重绘效果，在 Vue 3 中通常需要在 `onUpdated` 中或紧跟响应式变更后使用 `nextTick()`，但其本质依然是在微任务阶段，在浏览器 Paint 前完成。'
[//]: #
[//]: # '---'
[//]: #
[//]: # '## 8. 编译器优化：两条不同的进化路线'
[//]: #
[//]: # '### 8.1 React Compiler (React Forget)'
[//]: #
[//]: # 'React 的哲学是“UI 是状态的函数”，但在复杂的函数体内部，不可避免地会发生冗余的重新计算和子组件不必要的重渲染。传统的解法是让开发者手动编写铺天盖地的 `useMemo` 和 `useCallback`。'
[//]: # 'React Compiler 通过 AST 抽象语法树分析和 SSA（静态单赋值）算法，在编译期自动推断依赖关系，将函数体改写为自动缓存的版本：'
[//]: #
[//]: # '```javascript'
[//]: # '// 编译后的自动注入逻辑 (简化思路)'
[//]: # 'function Component(props) {'
[//]: # '  const $ = useRenderCache(2);'
[//]: # '  '
[//]: # '  let computedValue;'
[//]: # '  if ($[0] !== props.data) {'
[//]: # '    computedValue = heavyComputation(props.data);'
[//]: # '    $[0] = props.data;'
[//]: # '    $[1] = computedValue;'
[//]: # '  } else {'
[//]: # '    computedValue = $[1]; // 完全命中缓存，不执行运算'
[//]: # '  }'
[//]: # '}'
[//]: #
[//]: # '```'
[//]: #
[//]: # '**特点**：没有改变 React 的运行时架构，只是使得 Fiber 在 `beginWork` 时更容易触发 bailout（因为传入子组件的 props 引用被自动固化了）。'
[//]: #
[//]: # '### 8.2 Vue 3 Compiler 与 Block Tree'
[//]: #
[//]: # 'Vue 的模板由于语法受限，天生具备良好的静态可分析性。Vue 3 编译器不仅进行了静态提升（Hoisting），还引入了革命性的 **Block Tree 架构**。'
[//]: #
[//]: # '由于 `v-if` 和 `v-for` 会改变 DOM 树的结构，Vue 将这些指令所在的节点以及根节点视作一个 "Block"。在生成 VNode 树时，Block 节点除了拥有 `children` 数组外，还会多维护一个 `dynamicChildren` 数组，这个数组会**扁平化地收集该 Block 内部所有层级的动态节点**。'
[//]: #
[//]: # '这使得 Vue 3 在运行时进行 `patch` 时，能够完全忽略数千个静态的包装节点（如无状态的 `<div>`），直接对 `dynamicChildren` 数组进行一维线性遍历比对。UI 的更新复杂度从与**模板整体大小相关**，降维成了与**动态节点数量相关**。'
[//]: #
[//]: # '---'
[//]: #
[//]: # '## 9. 渲染器与宿主平台：跨端抽象的实现'
[//]: #
[//]: # '两套框架都将核心算法（协调、响应式）与宿主平台的底层 API（DOM 操作）进行了优雅的分离。'
[//]: #
[//]: # '### 9.1 React 的 Host Config'
[//]: #
[//]: # 'React 独立维护了 `react-reconciler` 包。无论是 `react-dom`（Web）、`react-native`（移动端）还是 `react-three-fiber`（WebGL），都是通过实现一个名为 `HostConfig` 的巨大配置对象来驱动。'
[//]: # '它要求宿主提供极其细致的 API，如 `createInstance`、`appendChild`、甚至用于并发渲染的 `shouldYieldToHost`（判断时间片是否耗尽的宿主感知函数）。'
[//]: #
[//]: # '### 9.2 Vue 3 的 Renderer Options'
[//]: #
[//]: # 'Vue 3 导出了 `@vue/runtime-core`，通过 `createRenderer(options)` 函数接受特定的 `nodeOps` 和 `patchProp`。'
[//]: # '相比于 React，Vue 的自定义渲染器 API 更加精简。比如针对微信小程序或 Canvas 的渲染器，开发者只需实现极少量的增删改查函数即可。同时，Vue 提供了更为原生的跨容器处理节点 `<Teleport>`（对应 React 的 `Portal`），其内部逻辑也是完全在核心渲染器中抽象，对宿主透明。'
[//]: #
[//]: # '---'
[//]: #
[//]: # '## 10. 设计取舍总结：工程复杂度的守恒定律'
[//]: #
[//]: # '软件工程的复杂度不会消失，只会被转移。'
[//]: #
[//]: # '* **React 选择了“保持开发者心智模型的纯粹（函数即组件），将极其庞大的工程复杂度沉淀在框架底层”。**'
[//]: # '  为了应对纯函数无差别重渲染的开销，React 被迫发明了 Fiber，发明了 Lane，发明了 Scheduler，并最终造出了 React Compiler。React 更适合重型复杂业务流、极高频次的交互应用，以及高度动态化的架构设计。'
[//]: # '* **Vue 3 选择了“通过智能的编译器和代理机制（Proxy），将复杂度分散在编译时阶段和响应式依赖收集中”。**'
[//]: # '  利用明确的模板边界，Vue 把 VDOM 变成了智能地图；利用 Proxy，它让开发者免于思考依赖数组。Vue 在绝大多数中后台系统、数据大屏和标准 C 端应用中，提供了更低的心智负担和几乎不需要手动调优就能获得的高效更新性能。'

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
