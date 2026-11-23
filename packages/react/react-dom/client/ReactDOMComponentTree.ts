/**
 * ReactDOMComponentTree.ts —— 真实 DOM 节点与 Fiber 的双向索引
 *
 * 事件委托的核心难点：原生事件触发时我们只能拿到 event.target（一个 DOM 节点），
 * 但事件处理器（onClick 等）挂在 Fiber 的 props 上。因此需要一张
 * 「DOM 节点 → Fiber」的映射表，从 target 出发一路上溯找到 Fiber 树。
 *
 * 实现方式（与真实 React 一致）：在 DOM 节点上挂两个非枚举约定的内部属性：
 * - internalInstanceKey：指向该节点对应的 HostComponent Fiber
 * - internalPropsKey   ：指向该节点最近一次渲染的 props（供事件系统/属性更新读取）
 *
 * 为什么不使用 Map？
 * - DOM 节点被删除后，Map 会阻止节点被 GC；直接挂在节点上，随节点一起回收；
 * - 读取是 O(1)，不需要额外的全局表。
 *
 * key 使用随机后缀：避免与用户自定义属性或页面上的其他库冲突，
 * 也避免多个 React 副本之间互相覆盖。
 */

import type { Fiber } from 'react-reconciler/src/ReactInternalTypes'

/** 随机后缀，保证同一个页面中多份 React 实例的 key 不冲突 */
const randomKey = Math.random().toString(36).slice(2)

/** DOM 节点 → 对应的 Fiber 节点 */
const internalInstanceKey = '__reactFiber$' + randomKey

/** DOM 节点 → 最近一次渲染的 props */
const internalPropsKey = '__reactProps$' + randomKey

/**
 * 在创建 DOM 节点时缓存它对应的 Fiber
 *
 * 调用时机：completeWork 的 HostComponent mount 分支，调用 createInstance 之后。
 *
 * @param hostInst - 对应的 HostComponent Fiber
 * @param node     - 新建的真实 DOM 节点
 */
export function precacheFiberNode(hostInst: Fiber, node: Node): void {
  ;(node as any)[internalInstanceKey] = hostInst
}

/**
 * 更新 DOM 节点上缓存的 props
 *
 * 每次宿主组件更新时调用，保证事件系统读取到的是最新 props，
 * 而不是首次挂载时的旧闭包。
 *
 * @param node  - 真实 DOM 节点
 * @param props - 本次渲染的 props
 */
export function updateFiberProps(node: Node, props: any): void {
  ;(node as any)[internalPropsKey] = props
}

/**
 * 从 DOM 节点找到最近的 Fiber
 *
 * 正常情况：event.target 就是某个宿主组件的 DOM 节点，直接命中缓存。
 * 兜底情况：target 是文本节点、或用户手动插入的子节点，此时沿 parentNode
 * 向上查找，直到遇到一个由 React 创建的节点。
 *
 * @param node - 起始 DOM 节点（通常是 event.target）
 * @returns 对应的 Fiber；找不到返回 null
 */
export function getClosestInstanceFromNode(node: Node): Fiber | null {
  const inst = (node as any)[internalInstanceKey]
  if (inst) {
    return inst as Fiber
  }
  let parent = node.parentNode
  while (parent !== null) {
    const parentInst = (parent as any)[internalInstanceKey]
    if (parentInst) {
      return parentInst as Fiber
    }
    parent = parent.parentNode
  }
  return null
}

/**
 * 读取 DOM 节点上缓存的 props
 *
 * 事件系统一般优先从 fiber.memoizedProps 读取；这个函数保留给
 * 「只有 DOM 节点、拿不到 Fiber」的场景（如未来的表单受控组件）。
 */
export function getFiberCurrentPropsFromNode(node: Node): any {
  return (node as any)[internalPropsKey] || null
}
