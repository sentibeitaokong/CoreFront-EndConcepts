# React 与 Vue 3 核心机制对比

## 1. 总体架构

React 和 Vue 3 都将声明式 UI 转换为宿主平台节点，但两者分配运行时职责的方式不同：

```text
React：JSX → React Element → Fiber 协调 → Commit → 宿主节点
Vue 3：Template/JSX → VNode → 组件更新与 patch → 宿主节点
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

React 将工作单元、树拓扑、组件状态、更新信息和调度优先级集中在 Fiber 节点上：

```text
Fiber
├── child / sibling / return
├── memoizedState / updateQueue
├── flags / subtreeFlags
├── lanes / childLanes
└── alternate / stateNode
```

Vue 3 将这些职责拆分到不同结构：

```text
Vue 组件运行时
├── VNode：描述节点和子树
├── ComponentInternalInstance：保存组件状态与上下文
├── ReactiveEffect：收集响应式依赖并触发组件更新
└── Scheduler：批量安排组件任务和回调
```

| 职责           | React                                                     | Vue 3                                        |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| **树遍历**     | Fiber 的 `child` / `sibling` / `return` 指针              | VNode 的 `children` 与组件实例关系           |
| **组件状态**   | Fiber 的 Hooks 链表或 Class 实例                          | 组件实例中的 `setupState`、`props`、`ctx` 等 |
| **副作用记录** | `flags` / `subtreeFlags`                                  | VNode 标记、组件更新 Effect 与 patch 分支    |
| **双缓冲**     | `current` 与 `workInProgress` Fiber 通过 `alternate` 连接 | 没有直接等价结构，更新时比较前后 VNode       |
| **可中断工作** | Fiber 是可暂停和恢复的工作单元                            | 单个组件的 patch 默认同步完成                |

## 4. 协调与更新

React 的状态更新会创建 Update、分配 Lane，并在 Render 阶段根据新 Element 和 current Fiber 构建 work-in-progress Fiber。宿主变更记录为 flags，随后在 Commit 阶段应用。

Vue 3 的响应式数据变化会触发订阅它的 ReactiveEffect。组件更新任务进入 Scheduler 队列，执行时生成新 VNode 并与旧 VNode 进行 patch。模板编译器生成的静态提升、Block Tree 和 PatchFlags 可以缩小运行时需要检查的范围。

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

React Hooks 按调用顺序存储在 Fiber 上。状态更新显式通过 setter 或 dispatch 发起，组件重新执行后获得新的 Element。Vue Composition API 中的 `ref`、`reactive` 和 `computed` 建立响应式依赖，读取发生依赖收集，写入触发相关 Effect。

| 维度         | React                                               | Vue 3                                                           |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| **状态读取** | 组件执行时按 Hooks 顺序读取状态                     | 访问 `ref.value` 或响应式代理属性                               |
| **依赖关系** | Hook 调用顺序、依赖数组、组件树传播                 | ReactiveEffect 与响应式属性之间的依赖集合                       |
| **派生缓存** | `useMemo`，依赖数组变化后重新计算                   | `computed`，根据响应式依赖失效并惰性求值                        |
| **跨层注入** | Context Provider / `useContext`                     | `provide()` / `inject()`                                        |
| **注入更新** | Provider value 改变后标记订阅该 Context 的 Consumer | 注入普通值本身不响应；注入 `ref` 或响应式对象时沿响应式依赖更新 |

`useMemo` 与 `computed`、Context 与 provide/inject 的用途存在交集，但触发模型和生命周期并不相同，不能视为完全等价的 API。

## 7. 副作用时序

React 强制区分可重试的 Render 与不可中断的 Commit。`useInsertionEffect`、`useLayoutEffect` 和 `useEffect` 分别位于不同提交时机。

Vue 3 使用组件更新 Effect、生命周期钩子以及 `watch` / `watchEffect` 表达副作用，并通过 `flush: 'sync' | 'pre' | 'post'` 控制回调相对组件更新的时机。

| 需求                       | React                                       | Vue 3                                                                   |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| **渲染后异步副作用**       | `useEffect`                                 | `watch` / `watchEffect` 的默认 pre 时序并不等同；需要根据需求选择 flush |
| **DOM 更新后同步读取布局** | `useLayoutEffect`                           | `onUpdated`、`nextTick` 或 `flush: 'post'`                              |
| **副作用清理**             | Effect 返回 cleanup                         | `onCleanup` / `onWatcherCleanup`、生命周期钩子                          |
| **开发期重复检查**         | Strict Mode 会额外执行 Effect setup/cleanup | 开发模式采用不同的告警与检查策略                                        |

## 8. 编译器优化

React Compiler 面向 JavaScript 和 JSX 进行数据流与依赖分析，自动插入记忆化缓存，减少组件和表达式的重复计算。它保留 React 的运行时模型，并在编译阶段帮助运行时 Bailout。

Vue 编译器利用模板语法的结构化约束生成渲染函数，同时产生静态提升、PatchFlags、Block Tree、事件缓存等信息，让运行时集中处理动态节点和动态属性。

| 维度           | React Compiler                              | Vue 3 Compiler                              |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| **主要输入**   | JavaScript / JSX 中的组件和 Hook 代码       | Vue Template，也支持 JSX 但模板优化能力不同 |
| **主要目标**   | 自动记忆化，减少重复计算和不必要的子树更新  | 生成渲染函数并标记动态部分，减少 patch 范围 |
| **分析难点**   | JavaScript 控制流、别名、可变性和副作用分析 | 模板 AST 转换、指令语义和静态/动态节点分析  |
| **运行时配合** | 缓存槽与 Fiber Bailout                      | PatchFlags、Block Tree 与渲染器 patch       |

## 9. 渲染器与宿主平台

React Reconciler 与宿主渲染器分离，`react-dom`、React Native 等渲染器通过宿主配置完成节点操作。Vue 的 `runtime-core` 同样保持平台无关，`runtime-dom` 通过 `nodeOps` 和 `patchProp` 提供 DOM 操作，也可以使用 `createRenderer()` 构建自定义渲染器。

| 维度               | React                        | Vue 3                                    |
| ------------------ | ---------------------------- | ---------------------------------------- |
| **平台无关核心**   | `react-reconciler`           | `@vue/runtime-core`                      |
| **DOM 渲染器**     | `react-dom`                  | `@vue/runtime-dom`                       |
| **宿主操作抽象**   | Host Config                  | Renderer Options、`nodeOps`、`patchProp` |
| **特殊跨容器节点** | Portal                       | Teleport                                 |
| **自定义渲染器**   | 使用 `react-reconciler` 构建 | 使用 `createRenderer()` 构建             |

## 10. 设计取舍总结

| React 更强调                                         | Vue 3 更强调                                     |
| ---------------------------------------------------- | ------------------------------------------------ |
| 组件是普通 JavaScript 函数，运行时协调具有高度动态性 | 模板提供更多静态信息，响应式系统精确建立数据依赖 |
| Fiber 将渲染拆成可调度的工作单元                     | 组件更新任务通过微任务批量执行                   |
| Lane 表达更新优先级、组合、跳过与重放                | Scheduler 保证任务去重、父子顺序和 pre/post 时序 |
| React Compiler 在不改变组件模型的前提下自动记忆化    | Vue Compiler 将动态信息编码进渲染函数和 VNode    |

两者的差异主要是复杂性放置位置不同。React 将更多复杂性放在 Fiber、协调和调度层；Vue 3 将更多复杂性放在响应式依赖、模板编译和靶向 patch 层。实际性能仍取决于组件结构、数据流、编译方式和具体工作负载，不能只根据某个单独机制判断。
