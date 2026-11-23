/**
 * ReactEventPriorities.ts —— 事件优先级（Event Priority）
 *
 * 作用：在「DOM 事件分发」与「Fiber 更新调度」之间搭一座桥。
 *
 * 为什么要区分事件优先级？
 * - 点击、按键、输入这类「离散事件」必须尽快响应，否则用户会感到卡顿；
 * - 鼠标移动、滚动、拖拽这类「连续事件」可以由浏览器合并，稍微延后无妨；
 * - 网络回调、定时器这类「默认事件」按普通优先级处理。
 *
 * 工作方式：
 * 1. ReactDOMEventListener 在开始分发某个原生事件前，调用
 *    setCurrentUpdatePriority() 写入该事件的优先级；
 * 2. 事件处理器里调用 setState / dispatch 时，更新调度器可以通过
 *    getCurrentUpdatePriority() 读到它，从而决定这次更新落在哪条 lane 上；
 * 3. 分发结束后再把优先级恢复为之前的值（支持嵌套分发）。
 *
 * 关于取值：
 * 当前仓库尚未实现完整的 lane 模型（ReactFiberLane），但这里直接采用
 * React 18 中对应 lane 的位值，保证后续接入 lane 模型时「零迁移成本」：
 * - DiscreteEventPriority   = SyncLane              (0b...0001)
 * - ContinuousEventPriority = InputContinuousLane   (0b...0100)
 * - DefaultEventPriority    = DefaultLane           (0b...1_0000)
 * - IdleEventPriority       = IdleLane              (0b1_0000...0000)
 */

/** 事件优先级类型：本质是一个 lane 位掩码（一个二进制位） */
export type EventPriority = number

/** 没有事件优先级：表示当前不在任何事件处理器的上下文中 */
export const NoEventPriority: EventPriority = 0b0000000000000000000000000000000

/** 离散事件（点击、按键、输入等）—— 最高优先级，对应 SyncLane */
export const DiscreteEventPriority: EventPriority = 0b0000000000000000000000000000001

/** 连续事件（滚动、鼠标移动、拖拽等）—— 对应 InputContinuousLane */
export const ContinuousEventPriority: EventPriority = 0b0000000000000000000000000000100

/** 默认优先级（网络回调、定时器等）—— 对应 DefaultLane */
export const DefaultEventPriority: EventPriority = 0b0000000000000000000000000010000

/** 空闲优先级（预渲染、分析埋点等）—— 对应 IdleLane */
export const IdleEventPriority: EventPriority = 0b0010000000000000000000000000000

/**
 * 当前正在处理的事件优先级
 *
 * 事件分发是同步的，但可能嵌套（例如在事件处理器里手动触发另一个事件），
 * 因此分发前后需要像栈一样保存/恢复，见 setCurrentUpdatePriority 的调用方。
 */
let currentUpdatePriority: EventPriority = NoEventPriority

/** 读取当前事件优先级 */
export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority
}

/**
 * 设置当前事件优先级
 *
 * 注意：调用方必须在分发结束后恢复旧值，否则优先级会「泄漏」到
 * 后续无关的更新中。
 */
export function setCurrentUpdatePriority(newPriority: EventPriority): void {
  currentUpdatePriority = newPriority
}

/**
 * 解析本次更新应使用的优先级
 *
 * - 如果正处于某个事件处理器中（currentUpdatePriority !== NoEventPriority），
 *   直接采用事件优先级；
 * - 否则说明更新来自事件外部（如 setTimeout、Promise），使用默认优先级。
 *
 * 后续 lane 模型实现 requestUpdateLane 时，可直接调用此函数。
 */
export function resolveUpdatePriority(): EventPriority {
  if (currentUpdatePriority !== NoEventPriority) {
    return currentUpdatePriority
  }
  return DefaultEventPriority
}
