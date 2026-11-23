/**
 * ReactFiberCompleteWork.ts —— Fiber 树构建的"归"阶段
 *
 * 在深度优先遍历 Fiber 树的过程中，beginWork 负责"递"（向下深入），
 * completeWork 负责"归"（向上回溯）。
 *
 * completeWork 的主要职责：
 * 1. 为 HostComponent（原生 DOM 标签）创建真实的 DOM 节点
 * 2. 初始化 DOM 属性（props → DOM attributes）
 * 3. 将子 DOM 节点挂载到父 DOM 节点上，构建真实 DOM 树
 * 4. 处理组件实例的生命周期和 ref
 *
 * 执行时机：当一个 Fiber 的所有子节点都已处理完毕后，开始处理该 Fiber 自身
 * 执行顺序：子节点 → 兄弟节点 → 父节点（自底向上）
 */

import type { Fiber } from './ReactInternalTypes'
import {
  HostComponent,
  HostRoot,
  HostText,
  Fragment,
  ClassComponent,
  FunctionComponent,
  ContextProvider,
  ContextConsumer,
} from './ReactWorkTags'
import { popProvide } from './ReactFiberNewContext'
import {
  createInstance,
  commitUpdate,
} from '../../react-dom/client/ReactDOMHostConfig'

/**
 * 完成一个 Fiber 节点的工作（"归"阶段的核心函数）
 *
 * 根据 Fiber 的 tag 类型执行不同的处理逻辑：
 * - HostRoot：根节点无需创建 DOM，直接返回
 * - HostComponent：原生 DOM 标签，创建真实 DOM 并初始化属性
 *
 * 对于 HostComponent，需要完成三件事：
 * 1. 创建真实的 DOM 元素（document.createElement）
 * 2. 初始化 DOM 属性（设置 children/textContent 及其他 attributes）
 * 3. 将子 DOM 挂载到当前 DOM 上（appendChild），构建完整的 DOM 子树
 *
 * @param current        - current 树中对应的 Fiber 节点（可能为 null，首次渲染时）
 * @param workInProgress - 当前正在处理的 workInProgress Fiber
 * @returns 下一个需要处理的 Fiber，或 null 表示当前子树已处理完毕
 */
export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  const newProps = workInProgress.pendingProps
  switch (workInProgress.tag) {
    case Fragment:
    case ClassComponent:
    case FunctionComponent:
    case ContextConsumer:
    case HostRoot: {
      // 根 Fiber 没有对应的 DOM 节点，直接返回 null 继续向上回溯
      return null
    }
    case ContextProvider: {
      popProvide(workInProgress.type._context)
      return null
    }
    case HostComponent: {
      // 原生 DOM 标签（如 div、span、p），type 就是标签名字符串
      const { type } = workInProgress
      if (current !== null && workInProgress.stateNode != null) {
        //update
        updateHostComponent(current, workInProgress, newProps)
      } else {
        //mount
        // 1. 创建真实的 DOM 节点（document.createElement），同时缓存
        //    「DOM → Fiber / props」映射并初始化属性（含非委托事件监听）
        const instance = createInstance(type, newProps, workInProgress)
        // 2. 将所有子 Fiber 对应的真实 DOM 挂载到当前 DOM 上
        //    通过递归遍历 child → sibling 链表，收集所有后代 DOM 节点
        appendAllChildren(instance, workInProgress)
        // 将创建好的 DOM 节点关联到 Fiber.stateNode，供 commit 阶段使用
        workInProgress.stateNode = instance
      }
      return null
    }
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps)
      return null
    }
  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.',
  )
}
/**
 * updateHostComponent —— 更新原生 DOM 元素的属性（Update 分支）
 *
 * 复用已有 DOM 节点（workInProgress.stateNode），由宿主配置
 * （ReactDOMHostConfig.commitUpdate）完成：
 * - 刷新 DOM 节点上的 props 缓存（事件系统据此读取最新处理器）
 * - 对比 prevProps（current.memoizedProps）与 newProps
 *   （workInProgress.pendingProps），只把差异写入 DOM
 */
function updateHostComponent(
  current: Fiber,
  workInProgress: Fiber,
  newProps: any,
) {
  commitUpdate(
    workInProgress.stateNode as Element,
    workInProgress.type as string,
    current.memoizedProps,
    newProps,
    workInProgress,
  )
}

/**
 * 将所有子 Fiber 对应的真实 DOM 节点挂载到父 DOM 下
 *
 * 遍历 workInProgress 的 child 链表，将每个子 Fiber.stateNode（真实 DOM）
 * 通过 appendChild 挂载到父 DOM 元素上，构建完整的 DOM 树。
 *
 * 注意：此处仅挂载第一个子节点。完整的实现需要递归收集所有后代
 * HostComponent 的 stateNode，因为中间可能有非 DOM 的 Fiber（如 FunctionComponent）。
 *
 * @param parent       - 父 DOM 元素（已创建的真实 DOM）
 * @param workInProgress - 当前 Fiber 节点（需要将其子 DOM 挂载到 parent 下）
 */
function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child //链表结构
  while (nodeFiber !== null) {
    if (isHost(nodeFiber)) {
      parent.appendChild(nodeFiber.stateNode)
    } else if (nodeFiber.child !== null) {
      nodeFiber = nodeFiber.child
      continue
    }
    if (nodeFiber === workInProgress) {
      return
    }
    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return
      }
      nodeFiber = nodeFiber.return
    }
    nodeFiber = nodeFiber.sibling
  }
}

export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText
}
