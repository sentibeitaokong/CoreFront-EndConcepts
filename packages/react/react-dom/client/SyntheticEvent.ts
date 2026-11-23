/**
 * SyntheticEvent.ts —— 合成事件对象
 *
 * 为什么需要合成事件？
 * 1. 抹平浏览器差异：原生事件在不同浏览器中的属性、默认行为、取消方式不一致；
 * 2. 提供跨浏览器一致的 preventDefault / stopPropagation；
 * 3. 一个原生事件可能触发多个 React 事件处理器（捕获 + 冒泡），
 *    每个阶段使用独立的合成事件对象，互不污染。
 *
 * 与原生事件的关系：
 * - nativeEvent：原始的原生事件对象，可通过它访问浏览器特有字段；
 * - target：原生事件的 target（已处理文本节点 → 父元素）；
 * - currentTarget：当前正在执行的处理器所对应的 DOM 元素（由分发器逐个设置）；
 * - _targetInst：事件发生时最深的 Fiber 节点，分发器沿 return 指针向上收集处理器。
 *
 * 注意：React 17 起事件对象不再池化，persist() 保留为空实现以兼容旧代码。
 */

import type { Fiber } from 'react-reconciler/src/ReactInternalTypes'

/**
 * 事件属性接口
 *
 * 合成事件只会复制接口中声明的属性，避免把原生事件上的所有字段
 * （包括不规范/内部字段）都暴露给用户。值为该属性在原生事件缺失时的兜底值。
 */
export type EventInterface = {
  [propName: string]: number | string | boolean | null | undefined
}

/** 合成事件对象的类型 */
export type SyntheticEvent = {
  /** 原始原生事件 */
  nativeEvent: any
  /** 事件类型（如 'click'、'input'） */
  type: string
  /** 事件目标（触发事件的最深层 DOM 元素） */
  target: EventTarget | null
  /** 当前处理器绑定的 DOM 元素，随处理器执行而切换 */
  currentTarget: EventTarget | null
  /** React 注册名（如 onClick / onClickCapture），用于识别当前阶段 */
  _reactName: string
  /** 事件发生时最深的 Fiber 节点 */
  _targetInst: Fiber | null
  /** 本次事件是否已调用 preventDefault */
  isDefaultPrevented: () => boolean
  /** 本次事件是否已调用 stopPropagation */
  isPropagationStopped: () => boolean
  /** 阻止浏览器默认行为（如链接跳转、表单提交） */
  preventDefault: () => void
  /** 阻止事件继续在 React 处理器链中传播 */
  stopPropagation: () => void
  /** 兼容 React 16 的事件池 API，此处为空实现 */
  persist: () => void
  [key: string]: any
}

/** 合成事件的构造函数类型 */
export type SyntheticEventCtor = new (
  reactName: string,
  reactEventType: string,
  targetInst: Fiber | null,
  nativeEvent: any,
  nativeEventTarget: EventTarget | null,
) => SyntheticEvent

function functionThatReturnsTrue(): boolean {
  return true
}

function functionThatReturnsFalse(): boolean {
  return false
}

/**
 * 创建一个「合成事件类」
 *
 * 使用工厂函数而不是 class，原因与 FiberNode 相同：
 * 1. 不同事件类型（鼠标、键盘、输入……）可以共享同一套原型方法；
 * 2. 避免 class 带来的原型链查找与实例化开销；
 * 3. 与真实 React 的实现结构保持一致，便于对照源码。
 *
 * @param Interface - 需要从原生事件复制到合成事件的属性表
 * @returns 合成事件的构造函数
 */
export function createSyntheticEvent(
  Interface: EventInterface,
): SyntheticEventCtor {
  /**
   * 合成事件构造函数
   *
   * @param reactName         - React 事件名（onClick / onClickCapture）
   * @param reactEventType    - 原生事件类型（click / input）
   * @param targetInst        - 事件目标对应的 Fiber
   * @param nativeEvent       - 原生事件对象
   * @param nativeEventTarget - 事件目标 DOM 节点
   */
  function SyntheticBaseEvent(
    this: any,
    reactName: string,
    reactEventType: string,
    targetInst: Fiber | null,
    nativeEvent: any,
    nativeEventTarget: EventTarget | null,
  ) {
    this._reactName = reactName
    this._targetInst = targetInst
    this.type = reactEventType
    this.nativeEvent = nativeEvent
    this.target = nativeEventTarget
    this.currentTarget = null

    // 只拷贝接口白名单里的属性；原生事件没有该属性时使用兜底值
    for (const propName in Interface) {
      if (!Object.prototype.hasOwnProperty.call(Interface, propName)) {
        continue
      }
      const interfaceValue = Interface[propName]
      this[propName] =
        nativeEvent[propName] !== undefined
          ? nativeEvent[propName]
          : interfaceValue
    }

    // 原生事件可能已经被其他监听器阻止了默认行为，这里同步初始状态
    const defaultPrevented =
      nativeEvent.defaultPrevented != null
        ? nativeEvent.defaultPrevented === true
        : nativeEvent.returnValue === false

    this.isDefaultPrevented = defaultPrevented
      ? functionThatReturnsTrue
      : functionThatReturnsFalse
    this.isPropagationStopped = functionThatReturnsFalse
    this.isPersistent = functionThatReturnsTrue
  }

  Object.assign(SyntheticBaseEvent.prototype, {
    /**
     * 阻止默认行为
     *
     * 同时设置合成事件标记与原生事件默认行为，保证：
     * - 同一个合成事件的后续处理器能读到 isDefaultPrevented() === true；
     * - 浏览器真正执行默认动作（跳转、提交）前会检查原生事件状态。
     */
    preventDefault(this: any) {
      this.defaultPrevented = true
      const event = this.nativeEvent
      if (!event) {
        return
      }
      if (event.preventDefault) {
        event.preventDefault()
      } else if (typeof event.returnValue !== 'undefined') {
        // 兼容旧版 IE
        event.returnValue = false
      }
      this.isDefaultPrevented = functionThatReturnsTrue
    },

    /**
     * 阻止事件继续传播
     *
     * React 的冒泡是在一个原生监听器里循环完成的，
     * 因此既要设置合成事件的停止标记（让分发循环提前退出），
     * 也要调用原生 stopPropagation（阻止事件到达其他原生监听器）。
     */
    stopPropagation(this: any) {
      const event = this.nativeEvent
      if (!event) {
        return
      }
      if (event.stopPropagation) {
        event.stopPropagation()
      } else if (typeof event.cancelBubble !== 'undefined') {
        // 兼容旧版 IE
        event.cancelBubble = true
      }
      this.isPropagationStopped = functionThatReturnsTrue
    },

    /** React 17+ 不再池化事件对象，保留空实现以兼容 */
    persist() {
      // no-op
    },
  })

  return SyntheticBaseEvent as unknown as SyntheticEventCtor
}
