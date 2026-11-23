/**
 * ReactDOMEventListener.ts —— DOM 事件的「注册」与「触发」
 *
 * 整体架构（与 React 18 的 DOMPluginEventSystem 简化版一致）：
 *
 *   ┌─ 注册阶段 ─────────────────────────────────────────────┐
 *   │ createRoot(container)                                  │
 *   │   └─ listenToAllSupportedEvents(container)             │
 *   │        ├─ 在 container 上为每个冒泡事件注册 capture 监听 │
 *   │        └─ 在 container 上为每个冒泡事件注册 bubble 监听  │
 *   │                                                         │
 *   │ 元素上出现非委托事件属性（onScroll 等）时              │
 *   │   └─ listenToNonDelegatedEvent(event, element)          │
 *   └─────────────────────────────────────────────────────────┘
 *
 *   ┌─ 触发阶段 ─────────────────────────────────────────────┐
 *   │ 浏览器触发原生事件                                     │
 *   │   └─ 根容器上的监听器（或元素的非委托监听器）          │
 *   │        └─ dispatchEvent(domEventName, flags, ...)      │
 *   │             ├─ getClosestInstanceFromNode(target)      │
 *   │             ├─ 设置事件优先级                          │
 *   │             ├─ extractEvents：沿 fiber.return 收集      │
 *   │             │   onClick / onClickCapture 处理器        │
 *   │             └─ processDispatchQueue：按捕获→冒泡顺序执行│
 *   └─────────────────────────────────────────────────────────┘
 *
 * 为什么事件要委托到根容器？
 * 1. 内存：一个页面只注册「事件种类数 × 2」个监听器，而不是每个元素都挂；
 * 2. 动态节点：新插入的元素天然拥有事件能力，无需在 commit 阶段补挂监听器；
 * 3. 更新：事件处理器始终从 fiber.memoizedProps 读取，函数变化自动生效，
 *    不需要像 addEventListener 那样先解绑旧的再绑定新的。
 */

import type { Fiber } from 'react-reconciler/src/ReactInternalTypes'
import { HostComponent } from 'react-reconciler/src/ReactWorkTags'
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from 'react-reconciler/src/ReactEventPriorities'
import type { EventPriority } from 'react-reconciler/src/ReactEventPriorities'
import {
  getClosestInstanceFromNode,
  getFiberCurrentPropsFromNode,
} from './ReactDOMComponentTree'
import { createSyntheticEvent } from './SyntheticEvent'
import type { SyntheticEvent } from './SyntheticEvent'
import type { EventInterface } from './SyntheticEvent'
import {
  allNativeEvents,
  getReactEventNameFromNative,
  nonDelegatedEvents,
} from './DOMEventProperties'
import { updateValueIfChanged } from './ReactDOMInputValueTracking'

// ==============================
// 事件系统标记（位掩码）
// ==============================

/** 捕获阶段：监听器注册在捕获阶段，分发时只执行 onXxxCapture 处理器 */
export const IS_CAPTURE_PHASE = /*  */ 0b001

/** 非委托事件：监听器直接注册在元素上，而不是根容器 */
export const IS_NON_DELEGATED = /* */ 0b010

export type EventSystemFlags = number

// ==============================
// 合成事件属性接口
// ==============================

/**
 * 合成事件暴露给用户的属性白名单
 *
 * 只挑选常用、跨浏览器稳定的字段；其余字段可通过 event.nativeEvent 访问。
 * 值为原生事件缺少该属性时的兜底值。
 */
const EventInterface: EventInterface = {
  // 基础事件属性
  eventPhase: 0,
  bubbles: 0,
  cancelable: 0,
  timeStamp: 0,
  defaultPrevented: 0,
  isTrusted: 0,

  // 鼠标事件
  altKey: 0,
  button: 0,
  buttons: 0,
  clientX: 0,
  clientY: 0,
  ctrlKey: 0,
  metaKey: 0,
  shiftKey: 0,
  pageX: 0,
  pageY: 0,
  screenX: 0,
  screenY: 0,
  detail: 0,
  relatedTarget: null,
  movementX: 0,
  movementY: 0,
  which: 0,

  // 键盘事件
  key: null,
  code: null,
  keyCode: 0,
  charCode: 0,
  location: 0,
  repeat: 0,
  isComposing: 0,

  // 指针事件
  pointerId: 0,
  pointerType: null,
  isPrimary: 0,
  pressure: 0,
  width: 0,
  height: 0,
  tangentialPressure: 0,
  tiltX: 0,
  tiltY: 0,
  twist: 0,

  // 滚轮事件
  deltaX: 0,
  deltaY: 0,
  deltaZ: 0,
  deltaMode: 0,

  // 输入 / 组合输入
  data: null,
  inputType: null,

  // 剪贴板 / 拖放
  clipboardData: null,
  dataTransfer: null,

  // 触摸事件
  touches: null,
  targetTouches: null,
  changedTouches: null,
}

/** 所有合成事件共享的构造函数 */
const SyntheticBaseEvent = createSyntheticEvent(EventInterface)

// ==============================
// 分发队列类型
// ==============================

/** 一个待执行的处理器及其绑定元素 */
type DispatchListener = {
  /** 处理器所在的 Fiber（用于调试） */
  instance: Fiber | null
  /** 用户传入的事件处理函数 */
  listener: (event: SyntheticEvent) => void
  /** 执行该处理器时的 event.currentTarget */
  currentTarget: EventTarget
}

/** 一个阶段的合成事件 + 处理器列表 */
type DispatchEntry = {
  event: SyntheticEvent
  listeners: Array<DispatchListener>
}

// ==============================
// 第一部分：事件注册
// ==============================

/** 标记「该容器已经注册过委托事件」，防止重复注册 */
const listeningMarker =
  '__reactListening$' + Math.random().toString(36).slice(2)

/** 标记「该元素已经注册过某个非委托事件」 */
const nonDelegatedMarker =
  '__reactNonDelegated$' + Math.random().toString(36).slice(2)

/**
 * 在根容器上注册所有支持的委托事件（createRoot 时调用一次）
 *
 * 对每个需要委托的原生事件：
 * - 注册一个「捕获阶段」监听器 → 分发 onClickCapture / onScrollCapture 等；
 * - 注册一个「冒泡阶段」监听器 → 分发 onClick / onScroll 等。
 *
 * 非委托事件不会在这里注册，而是在元素出现对应属性时由
 * listenToNonDelegatedEvent 单独处理。
 *
 * @param rootContainerElement - React 应用的根 DOM 容器
 */
export function listenToAllSupportedEvents(
  rootContainerElement: EventTarget,
): void {
  const container = rootContainerElement as any
  if (container[listeningMarker]) {
    return
  }
  container[listeningMarker] = true

  allNativeEvents.forEach(domEventName => {
    if (nonDelegatedEvents.has(domEventName)) {
      return
    }
    listenToNativeEvent(domEventName, false, rootContainerElement)
    listenToNativeEvent(domEventName, true, rootContainerElement)
  })
}

/**
 * 在目标（根容器）上注册一个原生事件监听器
 *
 * @param domEventName          - 原生事件名（click）
 * @param isCapturePhaseListener - 是否注册在捕获阶段
 * @param target                - 监听器挂载的目标
 */
function listenToNativeEvent(
  domEventName: string,
  isCapturePhaseListener: boolean,
  target: EventTarget,
): void {
  const eventSystemFlags = isCapturePhaseListener ? IS_CAPTURE_PHASE : 0
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
  )
}

/**
 * 创建并挂载真正的原生监听器
 *
 * 监听器本身不包含任何业务逻辑，只做两件事：
 * 1. 把「事件名 + 阶段标记 + 容器」这三个不会变化的信息闭包进回调；
 * 2. 把原生事件交给 dispatchEvent 统一处理。
 *
 * @param target                - 监听器挂载目标
 * @param domEventName          - 原生事件名
 * @param eventSystemFlags      - 事件系统标记（捕获/非委托）
 * @param isCapturePhaseListener - 是否捕获阶段
 */
function addTrappedEventListener(
  target: EventTarget,
  domEventName: string,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
): void {
  const listener = (nativeEvent: Event) => {
    dispatchEvent(domEventName, eventSystemFlags, target, nativeEvent)
  }
  // 第三个参数 true 表示在捕获阶段触发（事件到达目标之前）
  target.addEventListener(
    domEventName,
    listener as EventListener,
    isCapturePhaseListener,
  )
}

/**
 * 在具体元素上注册非委托事件
 *
 * 适用于 scroll、load、error、mouseenter 等不会冒泡（或不应该委托）的事件。
 * 同一个元素的同一个事件只会注册一次，之后即使处理器被移除也不会解绑：
 * 分发时会从 props 中读取处理器，读不到就自然跳过。
 *
 * 捕获 + 冒泡两套都注册，以支持 onScroll 与 onScrollCapture 两种写法。
 *
 * @param domEventName  - 原生事件名
 * @param targetElement - 拥有该事件属性的宿主元素
 */
export function listenToNonDelegatedEvent(
  domEventName: string,
  targetElement: EventTarget,
): void {
  if (!nonDelegatedEvents.has(domEventName)) {
    return
  }

  const element = targetElement as any
  let listened: Set<string> | undefined = element[nonDelegatedMarker]
  if (listened === undefined) {
    listened = new Set<string>()
    element[nonDelegatedMarker] = listened
  }
  if (listened.has(domEventName)) {
    return
  }
  listened.add(domEventName)

  addTrappedEventListener(targetElement, domEventName, IS_NON_DELEGATED, false)
  addTrappedEventListener(
    targetElement,
    domEventName,
    IS_NON_DELEGATED | IS_CAPTURE_PHASE,
    true,
  )
}

// ==============================
// 第二部分：事件触发
// ==============================

/**
 * 事件分发入口
 *
 * 由根容器（或元素上的非委托监听器）调用，完成：
 * 1. 从 event.target 找到最深的 Fiber；
 * 2. 对 onChange 依赖的 input/change 做值去重；
 * 3. 设置本次事件对应的更新优先级；
 * 4. 收集并执行处理器链。
 *
 * @param domEventName    - 原生事件名
 * @param eventSystemFlags - 事件系统标记
 * @param targetContainer - 监听器所在的容器（根或元素）
 * @param nativeEvent     - 原生事件对象
 */
export function dispatchEvent(
  domEventName: string,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: Event,
): void {
  const nativeEventTarget = getEventTarget(nativeEvent)
  if (nativeEventTarget === null) {
    return
  }

  // 委托事件：从原生事件目标出发，沿 Fiber 树向上收集处理器；
  // 非委托事件：监听器挂在「拥有属性的元素」上，因此以该元素为起点，
  // 且只分发它自己（否则子元素滚动会误触发祖先的 onScroll）。
  const isNonDelegated = (eventSystemFlags & IS_NON_DELEGATED) !== 0
  const eventTargetNode = isNonDelegated
    ? (targetContainer as Node)
    : (nativeEventTarget as Node)

  // 从 DOM 节点找回 Fiber；找不到说明事件来自 React 未管理的节点
  let targetInst = getClosestInstanceFromNode(eventTargetNode)
  if (targetInst === null && !isNonDelegated) {
    targetInst = getClosestInstanceFromNode(targetContainer as Node)
  }
  if (targetInst === null) {
    return
  }

  // input 与 change 都可能映射到 onChange：值没变化时跳过重复通知
  if (domEventName === 'input' || domEventName === 'change') {
    if (!updateValueIfChanged(nativeEventTarget)) {
      return
    }
  }

  // 事件处理器执行期间的更新应继承该事件的优先级。
  // 保存旧值以支持嵌套分发，分发结束后恢复。
  const previousUpdatePriority = getCurrentUpdatePriority()
  try {
    setCurrentUpdatePriority(getEventPriority(domEventName))
    dispatchEventForPluginEventSystem(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      targetInst,
    )
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority)
  }
}

/**
 * 分发事件并执行收集到的处理器
 *
 * 对应 React 中的插件系统：这里只有一个 SimpleEventPlugin，
 * 因此直接调用 extractEvents。真正的插件系统会依次询问每个插件是否
 * 需要为该事件产生合成事件。
 */
function dispatchEventForPluginEventSystem(
  domEventName: string,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: Event,
  targetInst: Fiber,
): void {
  const dispatchQueue: Array<DispatchEntry> = []

  extractEvents(
    domEventName,
    targetInst,
    nativeEvent,
    getEventTarget(nativeEvent),
    eventSystemFlags,
    dispatchQueue,
  )

  processDispatchQueue(dispatchQueue)
}

/**
 * 从目标 Fiber 出发，收集当前阶段的所有事件处理器
 *
 * 遍历方向：target → return → return → ... → 根
 * - 冒泡阶段：按「目标 → 祖先」的顺序 push，天然就是冒泡顺序；
 * - 捕获阶段：每遇到一个处理器就 unshift 到队首，最终变成「祖先 → 目标」。
 *
 * @param targetFiber         - 事件目标对应的 Fiber
 * @param reactName           - React 注册名（onClick）
 * @param inCapturePhase      - 是否捕获阶段
 * @param accumulateTargetOnly - 只收集目标自身的处理器（非委托事件使用）
 * @returns 按执行顺序排列的处理器列表
 */
function accumulateSinglePhaseListeners(
  targetFiber: Fiber | null,
  reactName: string,
  inCapturePhase: boolean,
  accumulateTargetOnly: boolean,
): Array<DispatchListener> {
  const listeners: Array<DispatchListener> = []
  let fiber: Fiber | null = targetFiber

  while (fiber !== null) {
    // 只有宿主组件（真实 DOM 节点）才可能持有事件处理器
    if (fiber.tag === HostComponent && fiber.stateNode !== null) {
      const currentTarget = fiber.stateNode as EventTarget

      if (inCapturePhase) {
        const captureListener = getListener(fiber, reactName + 'Capture')
        if (captureListener !== null) {
          // 捕获阶段是「从外到内」，因此头插
          listeners.unshift({
            instance: fiber,
            listener: captureListener,
            currentTarget,
          })
        }
      } else {
        const listener = getListener(fiber, reactName)
        if (listener !== null) {
          // 冒泡阶段是「从内到外」，因此尾插
          listeners.push({
            instance: fiber,
            listener,
            currentTarget,
          })
        }
      }
    }

    // 非委托事件：只处理监听器所在元素自身，不向上冒泡
    if (accumulateTargetOnly) {
      break
    }

    fiber = fiber.return
  }

  return listeners
}

/**
 * 从 Fiber 的 props 中读取某个注册名对应的处理器
 *
 * 优先读取 DOM 节点上的 props 缓存：双缓冲机制会复用 Fiber 对象，
 * DOM 节点上缓存的 Fiber 可能指向旧的 alternate 树，而 props 缓存
 * 每次更新（commitUpdate）都会刷新，因此它才是「当前生效」的 props。
 * 缓存不存在时（如测试或首次挂载）回退到 memoizedProps / pendingProps。
 *
 * @param fiber            - 宿主组件 Fiber
 * @param registrationName - onClick / onClickCapture / onScroll ...
 * @returns 处理器函数，或 null（不是函数时视为没有处理器）
 */
function getListener(
  fiber: Fiber,
  registrationName: string,
): ((event: SyntheticEvent) => void) | null {
  const cachedProps =
    fiber.stateNode !== null
      ? getFiberCurrentPropsFromNode(fiber.stateNode as Node)
      : null
  const props = cachedProps || fiber.memoizedProps || fiber.pendingProps
  if (props === null || props === undefined) {
    return null
  }
  const listener = props[registrationName]
  return typeof listener === 'function' ? listener : null
}

/**
 * 抽取事件处理器并生成合成事件
 *
 * 捕获和冒泡是两个独立的分发阶段，各自使用一个独立的合成事件对象。
 * 如果当前阶段没有任何处理器，就不创建事件对象（避免无谓分配）。
 */
function extractEvents(
  domEventName: string,
  targetInst: Fiber | null,
  nativeEvent: Event,
  nativeEventTarget: EventTarget | null,
  eventSystemFlags: EventSystemFlags,
  dispatchQueue: Array<DispatchEntry>,
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0

  // 原生事件名 → React 注册名（input/change 都映射到 onChange）
  const reactName = getReactEventNameFromNative(domEventName)
  if (reactName === undefined) {
    return
  }

  const isNonDelegated = (eventSystemFlags & IS_NON_DELEGATED) !== 0
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    inCapturePhase,
    isNonDelegated,
  )
  if (listeners.length === 0) {
    return
  }

  const syntheticEvent = new SyntheticBaseEvent(
    inCapturePhase ? reactName + 'Capture' : reactName,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  )

  dispatchQueue.push({
    event: syntheticEvent,
    listeners,
  })
}

// ==============================
// 错误守卫：invokeGuardedCallbackAndCatchFirstError
// ==============================

/** 本次分发中是否已经有处理器抛出异常 */
let hasCaughtError = false

/** 本次分发中捕获到的第一个异常 */
let firstCaughtError: any = null

/**
 * 受保护地执行一个用户事件处理器
 *
 * 为什么需要错误守卫？
 * 事件分发是在一个原生监听器里循环调用多个用户处理器的。如果某个处理器
 * 直接抛错，异常会立刻中断循环，导致目标之后的其他处理器（例如祖先上的
 * onClick）不再执行，而且 currentTarget 也可能来不及复位。
 *
 * 真实 React 的做法与这里一致：
 * 1. 用 try/catch 包住每个处理器，把异常「暂存」起来；
 * 2. 同一次分发中的其他处理器继续执行；
 * 3. 整个分发队列处理完后，由 rethrowCaughtError 抛出第一个异常，
 *    既保证错误不会被吞掉，又不会破坏同一事件内的兄弟处理器。
 *
 * @param name    - 事件类型（用于错误上下文，与 React 的签名保持一致）
 * @param func    - 用户事件处理器
 * @param context - 执行上下文（React 传入 undefined，由处理器自行绑定 this）
 * @param event   - 合成事件对象
 */
export function invokeGuardedCallbackAndCatchFirstError(
  name: string,
  func: (event: SyntheticEvent) => void,
  context: any,
  event: SyntheticEvent,
): void {
  try {
    func.call(context, event)
  } catch (error) {
    // 只记录第一个错误；后续错误不再覆盖，保证「首错优先」
    if (!hasCaughtError) {
      hasCaughtError = true
      firstCaughtError = error
    }
  }
}

/**
 * 分发结束后重新抛出第一个被捕获的错误
 *
 * 先清理状态再抛出：否则下一次事件分发会误抛上一次的旧错误。
 * 没有错误时什么也不做。
 */
function rethrowCaughtError(): void {
  if (hasCaughtError) {
    const error = firstCaughtError
    hasCaughtError = false
    firstCaughtError = null
    throw error
  }
}

/**
 * 执行分发队列
 *
 * 处理器按 accumulateSinglePhaseListeners 已经排好的顺序执行：
 * 捕获阶段「祖先 → 目标」，冒泡阶段「目标 → 祖先」。
 *
 * 一旦某个处理器调用 stopPropagation，后续处理器（包括后续阶段）全部跳过。
 *
 * 用 try/finally 保证：即使 stopPropagation 让循环提前 return，
 * 或者执行过程中出现需要重抛的错误，分发结束后的错误重抛逻辑都会执行。
 */
function processDispatchQueue(dispatchQueue: Array<DispatchEntry>): void {
  try {
    for (const { event, listeners } of dispatchQueue) {
      for (const { listener, currentTarget } of listeners) {
        if (event.isPropagationStopped()) {
          return
        }
        executeDispatch(event, listener, currentTarget)
      }
    }
  } finally {
    // 所有处理器执行完毕后，再把第一个错误抛给浏览器/上层调用者
    rethrowCaughtError()
  }
}

/**
 * 执行单个处理器
 *
 * 执行期间把 event.currentTarget 指向处理器所属的 DOM 元素，
 * 执行完毕后清空，避免处理器把 currentTarget 带到异步回调里误用。
 *
 * 注意：真正的调用经过 invokeGuardedCallbackAndCatchFirstError，
 * 所以处理器抛错不会跳过 finally 中的 currentTarget 复位。
 */
function executeDispatch(
  event: SyntheticEvent,
  listener: (event: SyntheticEvent) => void,
  currentTarget: EventTarget,
): void {
  const type = event.type || 'unknown-event'
  event.currentTarget = currentTarget
  try {
    invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event)
  } finally {
    event.currentTarget = null
  }
}

/**
 * 还原原生事件的目标节点
 *
 * 处理两种浏览器差异：
 * - 老 IE 使用 srcElement；
 * - 某些事件的 target 可能是文本节点，需要换成它的父元素
 *   （文本节点没有对应的 Fiber，无法直接参与事件分发）。
 */
function getEventTarget(nativeEvent: Event): EventTarget | null {
  const target =
    (nativeEvent as any).target || (nativeEvent as any).srcElement || null

  if (target !== null && (target as Node).nodeType === 3) {
    return (target as Node).parentNode
  }
  return target
}

// ==============================
// 第三部分：事件优先级
// ==============================

/**
 * 原生事件 → 更新优先级
 *
 * 离散事件（点击、按键、输入）优先级最高，连续事件（移动、滚动、拖拽）
 * 次之，其余使用默认优先级。后续 lane 模型会把这些值直接当作 lane 使用，
 * 决定本次 setState 触发的是同步更新还是可中断更新。
 *
 * @param domEventName - 原生事件名
 */
export function getEventPriority(domEventName: string): EventPriority {
  switch (domEventName) {
    // 离散事件：必须立即响应
    case 'click':
    case 'dblclick':
    case 'mousedown':
    case 'mouseup':
    case 'pointerdown':
    case 'pointerup':
    case 'touchstart':
    case 'touchend':
    case 'keydown':
    case 'keyup':
    case 'input':
    case 'change':
    case 'beforeinput':
    case 'focusin':
    case 'focusout':
    case 'compositionstart':
    case 'compositionend':
    case 'submit':
    case 'reset':
    case 'invalid':
      return DiscreteEventPriority

    // 连续事件：允许被浏览器合并/延后
    case 'mousemove':
    case 'mouseover':
    case 'mouseout':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointermove':
    case 'pointerover':
    case 'pointerout':
    case 'pointerenter':
    case 'pointerleave':
    case 'touchmove':
    case 'wheel':
    case 'scroll':
    case 'drag':
    case 'dragenter':
    case 'dragleave':
    case 'dragover':
      return ContinuousEventPriority

    // 其余（load、error、动画结束等）使用默认优先级
    default:
      return DefaultEventPriority
  }
}
