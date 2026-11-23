import type { WorkTag } from './ReactWorkTags'
import type { Flags } from './ReactFiberFlags'
import type { ReactContext } from 'shared/ReactTypes'

/**
 * ContextDependency —— Context 依赖链表节点
 *
 * 当一个组件（函数组件 / 类组件 / Consumer）在渲染期间调用 readContext 读取某个
 * Context 时，就会往自己的 Fiber.dependencies 上追加一个 ContextDependency 节点，
 * 记录「我依赖了这个 Context，以及读到时的快照值」。
 *
 * 字段含义：
 * - context       ：被依赖的 Context 对象（用于后续判断 Provider 变化是否影响本组件）
 * - memoizedValue ：读取时快照到的 _currentValue，可据此判断依赖值是否真正发生了变化
 * - next          ：指向同一个 Fiber 的下一个依赖节点，构成单向链表
 *
 * 整个依赖链表通过 Dependencies.firstContext 作为头指针串联。
 */
export type ContextDependency = {
  context: ReactContext<any>
  memoizedValue: any
  next: ContextDependency | null
}

/**
 * Dependencies —— Fiber 上的 Context 依赖集合
 *
 * 每个 Fiber 在「单次渲染」期间用到的 Context 依赖都汇总在这里，
 * 以 firstContext 为头指针构成单向链表。本次渲染开始时会被 prepareToReadContext
 * 重置为 { firstContext: null }，随后每 readContext 一次就头插一个新节点。
 *
 * 作用：为「Context 精确更新」提供依据——当某个 Provider 的 value 变化时，
 * 可以沿 Fiber 树遍历、通过 dependencies 判断哪些消费者真正依赖了该 Context，
 * 从而只重渲染受影响的部分（本仓库当前仍在简化调度，见 propagateContextChange）。
 */
export type Dependencies = {
  firstContext: ContextDependency | null
}

/**
 * Fiber 节点类型定义
 *
 * Fiber 是 React 16+ 的核心数据结构，它是一个可中断的工作单元。
 * 每个 React 元素对应一个 Fiber 节点，所有 Fiber 节点构成一个链表树。
 *
 * Fiber 的设计目标：
 * 1. 可中断的异步渲染——每个 Fiber 是一个工作单元，可以随时暂停和恢复
 * 2. 优先级调度——不同类型的更新有不同的优先级
 * 3. 双缓冲——通过 current 和 workInProgress 两棵树避免渲染过程中的闪烁
 * 4. 错误边界——通过 return 指针回溯找到最近的错误边界
 */
export type Fiber = {
  /**
   * Fiber 节点的类型标签
   * 0 = FunctionComponent, 1 = ClassComponent, 3 = HostRoot, 5 = HostComponent, ...
   * 不同的 tag 决定了 reconcile 和 commit 阶段的处理逻辑
   */
  tag: WorkTag

  /**
   * React 元素的 key 属性
   * 在列表中用于标识节点的身份，帮助 diff 算法判断节点是可复用的还是需要重新创建
   */
  key: null | string

  /**
   * 元素类型标识
   * 通常情况下等于 type，但在某些高阶组件场景下（如 memo、lazy）可能与 type 不同
   */
  elementType: any

  /**
   * 组件的具体类型
   * - 函数组件：函数本身
   * - 类组件：类本身
   * - 原生组件：字符串如 'div', 'span'
   * - HostRoot：null
   * - HostText：null
   * 在 React DevTools 中显示为组件的名称
   */
  type: any

  /**
   * 关联的真实节点或实例
   * - HostComponent：真实 DOM 节点
   * - ClassComponent：类组件的实例（this）
   * - FunctionComponent：null（函数组件没有实例）
   * - HostRoot：FiberRoot 实例
   * - HostText：真实文本 DOM 节点
   */
  stateNode: any

  // ========== Fiber 树链表结构 ==========
  // 以下三个指针构成了 Fiber 树的链表遍历结构
  // 遍历顺序：child → 深度优先 → sibling → 同级 → return → 父级

  /**
   * 指向父 Fiber 节点
   * "return" 这个名字来自于"完成该 Fiber 的工作后返回到哪个节点"
   * 同时也用于错误边界——当子树抛出异常时，沿着 return 指针向上找到错误边界
   */
  return: Fiber | null

  /**
   * 指向第一个子 Fiber 节点
   * 在 beginWork 阶段，优先深度遍历子节点
   */
  child: Fiber | null

  /**
   * 指向下一个兄弟 Fiber 节点
   * 当前层级的节点处理完毕且没有子节点时，横向移动到兄弟节点
   */
  sibling: Fiber | null

  /**
   * 当前节点在父节点的子节点列表中的索引位置
   * diff 算法用于判断节点是否需要移动（key 相同但 index 不同 → 需要移动）
   */
  index: number

  // ========== Props 和 State ==========

  /**
   * 等待处理的新 props
   * 在 beginWork 阶段，React 会比较 pendingProps 和 memoizedProps 来判断是否需要更新
   */
  pendingProps: any

  /**
   * 上一次渲染时使用的 props
   * 与 pendingProps 对比判断组件是否需要重新渲染
   */
  memoizedProps: any

  /**
   * 更新队列
   * 存储待处理的更新（如 setState 调用产生的 update 对象），是一个环形链表
   */
  updateQueue: any

  /**
   * 本次/上次渲染读取到的 Context 依赖链表（头指针见 Dependencies.firstContext）
   *
   * - 函数组件 / 类组件 / Consumer 在渲染期间每次 readContext 都会头插一个节点，
   *   记录「依赖了哪个 Context + 读到时的快照值」。
   * - 值为 null 表示该 Fiber 没有消费任何 Context（或其依赖尚未被收集）。
   * - Provider value 变化时，可通过此链表定位受影响消费者（见 propagateContextChange）。
   */
  dependencies: Dependencies | null

  /**
   * 上一次渲染后的状态
   * - 类组件：{...this.state}
   * - 函数组件：第一个 Hook 节点（hook 链表头）
   * - HostRoot：RootState
   */
  memoizedState: any

  // ========== Effect 副作用系统 ==========

  /**
   * 当前 Fiber 节点的副作用标记
   * 使用位掩码（bitmask）存储，可以同时标记多种操作：
   * - Placement (0b...010): 需要插入 DOM
   * - Update (0b...100): 需要更新 DOM
   * - ChildDeletion (0b...1000): 需要删除子节点
   */
  flags: Flags

  /**
   * 指向 effect 链表中的下一个有副作用的 Fiber
   * React 通过这个指针遍历所有需要执行 DOM 操作的 Fiber 节点
   */
  nextEffect: Fiber | null

  // 以下字段暂未启用，后续功能实现时使用：
  // subtreeFlags: Flags;          // 子树中所有节点的副作用标记汇总（冒泡机制）
  deletions: Array<Fiber> | null // 需要被删除的子节点列表
  // lanes: Lanes;                 // 当前 Fiber 的优先级车道
  // childLanes: Lanes;            // 子树中存在的优先级车道

  // ========== 双缓冲 ==========

  /**
   * 指向另一棵 Fiber 树中对应的节点
   *
   * React 维护两棵 Fiber 树实现双缓冲：
   * 1. current 树：当前显示在屏幕上的树
   * 2. workInProgress 树：正在内存中构建的新树
   *
   * 两棵树通过 alternate 互相引用：
   * - current.alternate → workInProgress
   * - workInProgress.alternate → current
   *
   * 好处：避免每次更新都重新创建 Fiber，复用现有对象，减少 GC 压力
   */
  alternate: Fiber | null
}

/**
 * 容器类型——Fiber 树挂载的目标 DOM 节点
 * 可以是普通的 Element、Document 或 DocumentFragment
 */
export type Container = Element | Document | DocumentFragment

/**
 * FiberRoot 类型——整个 Fiber 架构的根容器
 *
 * FiberRoot 是整个应用的最顶层数据结构，它直接持有对真实 DOM 的引用。
 * 注意区分 FiberRoot 和 RootFiber（HostRoot Fiber）：
 * - FiberRoot：应用的容器，持有 container DOM 引用，每个应用只有一个
 * - RootFiber（HostRoot Fiber）：Fiber 树的根节点，tag=3，通过 FiberRoot.current 访问
 */
export type FiberRoot = {
  /** 真实的 DOM 容器节点（通常是 <div id="root"></div>） */
  containerInfo: Container
  /** 指向当前 Fiber 树的根节点（HostRoot Fiber，tag=3） */
  current: Fiber
  /**
   * 指向已完成构建、等待提交（commit）的新 Fiber 树
   * commit 阶段会将这棵树渲染到真实 DOM 中
   * 提交完成后，finishedWork 成为新的 current 树
   */
  finishedWork: Fiber | null
}
