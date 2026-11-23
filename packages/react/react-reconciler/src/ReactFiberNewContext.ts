/**
 * ReactFiberNewContext.ts —— Context 在 Fiber 遍历过程中的「压栈/出栈」逻辑
 *
 * Context 的值在整棵 Fiber 树中是「动态」的：同一个 Context 对象，
 * 在不同子树的消费者眼里可能读到不同的值，取决于它被哪些 Provider 包裹。
 *
 * 实现思路（栈式覆盖）：
 * - 进入 <Context.Provider value={v}> 时，把 context._currentValue 的旧值
 *   压入 valueCursor（配合 ReactFiberStack 的值栈），再把 _currentValue 覆盖为 v。
 * - 离开 Provider（completeWork 阶段）时，从 valueCursor 读回旧值，恢复 _currentValue。
 *
 * 由于 beginWork 是深度优先「递」、completeWork 是自底向上「归」，
 * Provider 的 push 一定先于其子树内所有消费者的 readContext，
 * 而 pop 一定晚于它们 —— 所以消费者读到的始终是「离它最近的 Provider」的值。
 *
 * 本文件导出的函数：
 * - pushProvide             ：进入 Provider，覆盖并压栈
 * - popProvide              ：离开 Provider，恢复旧值
 * - prepareToReadContext    ：消费者开始执行前，重置并准备收集其 Context 依赖
 * - resetContextDependencies：消费者执行结束后，清空当前「正在读取」的标记
 * - readContext             ：消费者读取当前值（useContext / 类组件 contextType / Consumer 都用它）
 *                              ，并把该 Context 记录进当前 Fiber 的依赖链表
 * - propagateContextChange  ：Provider value 变化时，沿子树更新依赖该 Context 的消费者快照
 */

import type { ReactContext } from 'shared/ReactTypes'
import type { Fiber, ContextDependency } from './ReactInternalTypes'
import { createCursor, push, pop } from './ReactFiberStack'
import type { StackCursor } from './ReactFiberStack'

/**
 * 全局 valueCursor —— 所有 Context 共用的一个游标。
 *
 * 它的 current 值始终保存「当前最内层 Provider 覆盖前的旧值」。
 * 因为 beginWork/completeWork 保证 push/pop 严格成对、按栈序执行，
 * 所以一个全局游标就足以在所有 Context 之间复用。
 */
const valueCursor: StackCursor<any> = createCursor(null)

/**
 * currentlyReadingFiber —— 当前正在执行、需要收集 Context 依赖的 Fiber
 *
 * 为什么需要这个全局变量？readContext 可能被两类消费者调用：
 * 1. useContext / Consumer：调用发生在「某个组件渲染过程中」，依赖应归属该组件；
 * 2. 类组件 contextType：由 beginWork 直接调用，此时需要显式传入 fiber 归属依赖。
 *
 * readContext 接收可选的 fiber 参数，取 `fiber || currentlyReadingFiber` 作为依赖归属者，
 * 因此这里把「正在渲染的消费者」记录下来，readContext 无需到处显式传参。
 * 它与 ReactFiberHooks 中的 currentlyRenderingFiber 配合：函数组件在 renderWithHooks
 * 开头调用 prepareToReadContext 写入，结束时由 resetContextDependencies 清空。
 */
let currentlyReadingFiber: Fiber | null = null

/**
 * prepareToReadContext —— 开始执行一个消费者，准备收集其 Context 依赖
 *
 * 在消费者（函数组件 render、类组件 render、Consumer 的 render props）真正执行前调用，
 * 完成两件事：
 * 1. 把当前 Fiber 记为 currentlyReadingFiber，供后续 readContext 隐式归属依赖；
 * 2. 重置 fiber.dependencies = { firstContext: null }，清空上一次渲染遗留的依赖，
 *    本次渲染重新从头收集。
 *
 * @param fiber - 即将开始执行、需要收集 Context 依赖的消费者 Fiber
 */
export function prepareToReadContext(fiber: Fiber): void {
  currentlyReadingFiber = fiber
  fiber.dependencies = { firstContext: null }
}

/**
 * resetContextDependencies —— 结束消费者执行，清空「正在读取」标记
 *
 * 在消费者执行完毕后调用，把 currentlyReadingFiber 置回 null，
 * 避免后续节点（如紧接着遍历到的兄弟节点）误把依赖归到上一个消费者名下。
 * 注意：它只清全局标记，不清 fiber.dependencies —— 依赖链表需要保留，
 * 供 Provider value 变化时（propagateContextChange）或下一次 diff 使用。
 */
export function resetContextDependencies(): void {
  currentlyReadingFiber = null
}

/**
 * 进入 Provider：保存旧值并覆盖为新值
 *
 * 执行两步：
 * 1. push(valueCursor, context._currentValue)
 *    —— 把游标当前的 current 值压栈（用于嵌套时逐层恢复），
 *       同时让 valueCursor.current = context._currentValue（即「本次覆盖前的旧值」）。
 * 2. context._currentValue = nextValue
 *    —— 把 Context 的当前值覆盖为 Provider 提供的 nextValue。
 *
 * 覆盖之后，该 Provider 子树内的所有 readContext 都会读到 nextValue。
 *
 * @param context   - 要覆盖的 Context 对象
 * @param nextValue - Provider 提供的新值
 */
export function pushProvide<T>(context: ReactContext<T>, nextValue: T): void {
  // 注意：必须先 push 旧值，再覆盖。push 内部会把「本次覆盖前的旧值」
  // 记录到 valueCursor.current，供 popProvide 恢复时读取。
  push(valueCursor, context._currentValue)
  context._currentValue = nextValue
}

/**
 * 读取 Context 的当前值，并把依赖记录到所属 Fiber
 *
 * 除了返回 context._currentValue（因为 Provider 在 beginWork 中已把
 * _currentValue 覆盖为「离消费者最近」的值，所以这里无需遍历，直接读取即可），
 * 还会把「本次读取用到了哪个 Context + 读到时的快照值」头插进 owner.dependencies，
 * 为 Provider value 变化时的精确更新提供依据。
 *
 * 依赖归属者（owner）的确定：
 * - 若显式传入 fiber 参数，则归该 fiber（类组件 contextType 场景）；
 * - 否则取 currentlyReadingFiber（函数组件 / Consumer 渲染期间由
 *   prepareToReadContext 写入的「正在渲染的消费者」）。
 *
 * 调用方：useContext、类组件的 this.context（static contextType）、
 * 以及 <Context.Consumer> 的 render 函数入参。
 *
 * @param context - 要读取的 Context 对象
 * @param fiber   - 可选：依赖归属的 Fiber；省略时使用 currentlyReadingFiber
 * @returns 当前生效的 Context 值
 */
export function readContext<T>(context: ReactContext<T>, fiber?: Fiber): T {
  const owner = fiber || currentlyReadingFiber
  if (owner) {
    // 先确保依赖容器存在，再以当前头节点作为 next。
    // 这样每次 readContext 都会稳定地把依赖头插进同一条链表，
    // 即使调用方没有先执行 prepareToReadContext 也不会丢失既有节点。
    const dependencies =
      owner.dependencies || (owner.dependencies = { firstContext: null })
    const dependency: ContextDependency = {
      context,
      memoizedValue: context._currentValue,
      // 头插法：新节点指向旧头节点
      next: dependencies.firstContext,
    }
    dependencies.firstContext = dependency
  }
  return context._currentValue
}

/**
 * propagateContextChange —— 在 Provider value 变化时，沿子树更新依赖快照
 *
 * 当某个 Provider 的 value 与上一轮不同（Object.is 比较）时调用，
 * 对该 Provider 子树做一次深度优先遍历，找到所有「依赖了这个 Context」的消费者，
 * 把它们的 dependency.memoizedValue 更新为新值。
 *
 * 遍历方式：
 * - 从 provider.child 出发，横向沿 sibling 扫描、纵向沿 child 递归；
 * - 对每个节点，遍历其 dependencies.firstContext 依赖链表，
 *   命中 dep.context === context 时更新 dep.memoizedValue。
 *
 * 说明：本仓库当前的调度仍是「整树重渲染」，这里暂未据此做精确的子树更新；
 * 但依赖链 + 快照值已就位，可作为后续实现「仅重渲染受影响消费者」的基础。
 *
 * @param provider - 值发生变化的 Provider Fiber（遍历从其子节点开始）
 * @param context  - 值发生变化的 Context 对象
 * @param value    - 新的 Context 值
 */
export function propagateContextChange(
  provider: Fiber,
  context: ReactContext<any>,
  value: any,
): void {
  let node = provider.child
  while (node) {
    // 拿到当前节点本轮渲染收集到的 Context 依赖链表
    const deps = node.dependencies?.firstContext
    let dep = deps
    while (dep) {
      // 命中依赖了这个 Context 的消费者 → 刷新其快照值
      if (dep.context === context) dep.memoizedValue = value
      dep = dep.next
    }
    // 深度优先：先递归处理子树，再横向移动到兄弟节点
    if (node.child) propagateContextChange(node, context, value)
    node = node.sibling
  }
}

/**
 * 离开 Provider：恢复被覆盖前的旧值
 *
 * 执行两步：
 * 1. 读取 valueCursor.current（即 pushProvide 时记录的旧值）
 * 2. pop(valueCursor) 把游标恢复到「上一层 Provider 的旧值」（或初始 null）
 * 3. context._currentValue = 旧值，完成恢复
 *
 * 之所以要先读 valueCursor.current 再 pop，是因为 pop 会立刻改变游标的 current 值，
 * 必须在 pop 之前把旧值取出来。
 *
 * @param context - 要恢复的 Context 对象
 */
export function popProvide(context: any) {
  // 取回 pushProvide 时记录的旧值（覆盖前的那一个）
  const currentValue = valueCursor.current
  // 恢复游标到上一层状态
  pop(valueCursor)
  // 把 Context 的当前值还原为旧值
  context._currentValue = currentValue
}
