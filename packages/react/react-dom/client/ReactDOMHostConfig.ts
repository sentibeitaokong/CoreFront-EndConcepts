/**
 * ReactDOMHostConfig.ts —— DOM 宿主环境配置
 *
 * reconciler 不直接操作 DOM，而是通过这里的一组函数完成：
 * - 创建/更新真实 DOM 元素
 * - 同步 DOM 属性（className、style、value……）
 * - 处理事件属性（这里只负责「登记」，真正的监听与分发在
 *   ReactDOMEventListener.ts）
 *
 * 事件处理的关键变化：
 * 旧实现直接在元素上 addEventListener('click', handler)，会有两个问题：
 * 1. 每个元素都要挂监听器，节点多时内存开销大；
 * 2. props 变化时需要手动解绑旧函数，否则会残留旧闭包。
 *
 * 新实现采用事件委托：
 * - onClick 这类冒泡事件：不在这里注册，统一由根容器上的监听器分发；
 * - onScroll / onLoad / onMouseEnter 这类非冒泡事件：在这里为当前元素
 *   注册一次监听器（listenToNonDelegatedEvent），之后处理器从 Fiber props 读取。
 *
 * 无论哪种事件，props 都会通过 updateFiberProps 缓存到 DOM 节点上，
 * 事件系统据此找到最新处理器。
 */

import type { Fiber } from 'react-reconciler/src/ReactInternalTypes'
import { isNum, isStr } from 'shared/utils'
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree'
import {
  nonDelegatedEvents,
  registrationNameDependencies,
} from './DOMEventProperties'
import { listenToNonDelegatedEvent } from './ReactDOMEventListener'

/**
 * 判断子节点是否应该直接设置为 textContent
 *
 * 当 children 是字符串/数字时，不需要为它创建 HostText Fiber，
 * 直接在父元素上设置 textContent 即可（性能优化）。
 *
 * @param type  - 标签名
 * @param props - 元素属性
 */
export function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  )
}

/**
 * 创建一个真实的 DOM 元素（HostComponent 首次挂载）
 *
 * 步骤：
 * 1. document.createElement 创建元素；
 * 2. 把「DOM 节点 → Fiber」的映射缓存到节点上，供事件系统使用；
 * 3. 缓存本次 props（事件处理器从这里读取）；
 * 4. 初始化 DOM 属性与非委托事件监听器。
 *
 * @param type                  - 标签名（div / span / input ...）
 * @param props                 - 本次渲染的 props
 * @param internalInstanceHandle - 对应的 HostComponent Fiber
 * @returns 创建好的真实 DOM 元素
 */
export function createInstance(
  type: string,
  props: any,
  internalInstanceHandle: Fiber,
): Element {
  const domElement = document.createElement(type)

  // 事件委托依赖这两个内部缓存：节点 → Fiber、节点 → props
  precacheFiberNode(internalInstanceHandle, domElement)
  updateFiberProps(domElement, props)

  setInitialProperties(domElement, type, props)

  return domElement
}

/**
 * 更新一个已存在的 DOM 元素（HostComponent 更新）
 *
 * 只做两件事：
 * 1. 刷新节点上的 props 缓存（事件处理器立即读取到新函数）；
 * 2. 对比新旧 props，把差异写入 DOM。
 *
 * @param domElement             - 需要更新的真实 DOM 元素
 * @param type                   - 标签名
 * @param prevProps              - 上一次渲染的 props
 * @param nextProps              - 本次渲染的 props
 * @param internalInstanceHandle - 对应的 HostComponent Fiber
 */
export function commitUpdate(
  domElement: Element,
  type: string,
  prevProps: any,
  nextProps: any,
  internalInstanceHandle: Fiber,
): void {
  updateFiberProps(domElement, nextProps)
  diffProperties(domElement, type, prevProps, nextProps)
}

// ==============================
// 属性初始化 / diff
// ==============================

/**
 * 首次挂载：把 props 写入 DOM
 */
function setInitialProperties(
  domElement: Element,
  type: string,
  props: any,
): void {
  for (const propKey in props) {
    const value = props[propKey]

    if (propKey === 'children') {
      // children 是文本时直接设置为 textContent
      if (isStr(value) || isNum(value)) {
        domElement.textContent = String(value)
      }
      // 复杂 children 会由 reconciler 创建成子 Fiber，在 commit 阶段插入
      continue
    }

    if (propKey === 'style') {
      applyStyle(domElement as HTMLElement, undefined, value)
      continue
    }

    if (propKey === 'dangerouslySetInnerHTML') {
      const html = value && value.__html
      if (html != null) {
        domElement.innerHTML = html
      }
      continue
    }

    // 已知事件属性：委托事件无需绑定；非委托事件在此登记监听器
    if (registerEventProp(domElement, propKey)) {
      continue
    }

    setProp(domElement, propKey, value)
  }
}

/**
 * 更新阶段：对比新旧 props，只应用变化
 *
 * 分两轮：
 * 1. 遍历旧 props：处理文本清空、style 差异、被移除的属性；
 * 2. 遍历新 props：处理文本设置、style 新增、新增/变化的属性。
 */
function diffProperties(
  domElement: Element,
  type: string,
  prevProps: any,
  nextProps: any,
): void {
  const prev = prevProps || {}
  const next = nextProps || {}

  // ---------- 第一轮：旧 props ----------
  for (const propKey in prev) {
    const prevProp = prev[propKey]

    if (propKey === 'children') {
      // 旧 children 是文本、新 children 不是文本 → 清空 textContent
      const nextChildren = next.children
      if (
        (isStr(prevProp) || isNum(prevProp)) &&
        !(isStr(nextChildren) || isNum(nextChildren))
      ) {
        domElement.textContent = ''
      }
      continue
    }

    if (propKey === 'style') {
      // style 需要逐项对比：清掉被移除的项，写入新增/变化的项
      applyStyle(domElement as HTMLElement, prevProp, next.style)
      continue
    }

    if (propKey === 'dangerouslySetInnerHTML') {
      if (!('dangerouslySetInnerHTML' in next)) {
        domElement.innerHTML = ''
      }
      continue
    }

    // 事件属性：可能会新增非委托监听器（若新 props 仍有该属性，
    // registerEventProp 内部有去重，不会重复绑定）
    if (registerEventProp(domElement, propKey)) {
      continue
    }

    // 旧属性在新 props 中不存在 → 从 DOM 上移除
    if (!(propKey in next)) {
      removeProp(domElement, propKey)
    }
  }

  // ---------- 第二轮：新 props ----------
  for (const propKey in next) {
    const nextProp = next[propKey]

    if (propKey === 'children') {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = String(nextProp)
      }
      continue
    }

    if (propKey === 'style') {
      // 旧 props 里没有 style 时，第一轮不会处理，这里补上新 style；
      // 有 style 时第一轮已用 applyStyle(prev, next) 处理过
      if (!('style' in prev)) {
        applyStyle(domElement as HTMLElement, undefined, nextProp)
      }
      continue
    }

    if (propKey === 'dangerouslySetInnerHTML') {
      const html = nextProp && nextProp.__html
      if (
        html != null &&
        html !==
          (prev.dangerouslySetInnerHTML && prev.dangerouslySetInnerHTML.__html)
      ) {
        domElement.innerHTML = html
      }
      continue
    }

    if (registerEventProp(domElement, propKey)) {
      continue
    }

    if (prev[propKey] !== nextProp) {
      setProp(domElement, propKey, nextProp)
    }
  }
}

/**
 * 处理事件属性
 *
 * - 是已知事件属性时返回 true，调用方不再把它当作普通 DOM 属性处理；
 * - 若该事件属于非委托事件，则在当前元素上注册一次原生监听器；
 * - 委托事件由根容器统一监听，这里不需要做任何绑定。
 *
 * @param domElement - 当前宿主元素
 * @param propKey    - props 的键（onClick / onScroll / onMouseEnter ...）
 * @returns 该键是否为事件属性
 */
function registerEventProp(domElement: Element, propKey: string): boolean {
  const dependencies = registrationNameDependencies[propKey]
  if (dependencies === undefined) {
    // 不是已知事件属性：交给普通属性逻辑（例如自定义 onFoo）
    return false
  }

  for (const domEventName of dependencies) {
    if (nonDelegatedEvents.has(domEventName)) {
      listenToNonDelegatedEvent(domEventName, domElement)
    }
  }
  return true
}

// ==============================
// 普通 DOM 属性读写
// ==============================

/**
 * 写入一个 DOM 属性
 *
 * 优先走 DOM 属性（property），因为：
 * - className、value、checked 等属性赋值会同步反映到 DOM；
 * - 属性不存在时（data-*、aria-*、自定义属性）回退到 setAttribute。
 *
 * @param domElement - 目标元素
 * @param propKey    - 属性名
 * @param value      - 属性值
 */
function setProp(domElement: Element, propKey: string, value: any): void {
  if (value === null || value === undefined) {
    removeProp(domElement, propKey)
    return
  }

  if (value === false) {
    // 布尔属性（disabled、checked 等）：属性赋值 false
    // 无对应 property 的属性（aria-hidden 等）：写成字符串 "false"
    if (propKey in domElement) {
      ;(domElement as any)[propKey] = false
    } else {
      domElement.setAttribute(propKey, 'false')
    }
    return
  }

  if (propKey in domElement) {
    // 简化处理：真实 React 会区分 className / htmlFor / value 等特殊属性
    ;(domElement as any)[propKey] = value
  } else {
    domElement.setAttribute(propKey, String(value))
  }
}

/**
 * 移除一个 DOM 属性
 *
 * 属性存在时尽量赋空值（保持 property 与 attribute 一致），
 * 否则直接 removeAttribute。
 */
function removeProp(domElement: Element, propKey: string): void {
  if (propKey in domElement) {
    const current = (domElement as any)[propKey]
    if (typeof current === 'boolean') {
      ;(domElement as any)[propKey] = false
    } else {
      ;(domElement as any)[propKey] = ''
    }
  } else {
    domElement.removeAttribute(propKey)
  }
}

/**
 * 将 style 对象逐项写入 CSSStyleDeclaration
 *
 * 不能直接给 element.style 赋对象，必须逐项设置。
 * 同时处理旧 style 中被删除的键，避免样式残留。
 *
 * @param domElement - 目标元素
 * @param prevStyle  - 上一次的 style（字符串或对象）
 * @param nextStyle  - 本次的 style（字符串或对象）
 */
function applyStyle(
  domElement: HTMLElement,
  prevStyle: any,
  nextStyle: any,
): void {
  const style = domElement.style

  if (prevStyle && typeof prevStyle === 'object') {
    for (const key in prevStyle) {
      if (!nextStyle || !(key in nextStyle)) {
        ;(style as any)[key] = ''
      }
    }
  }

  if (nextStyle && typeof nextStyle === 'object') {
    for (const key in nextStyle) {
      const value = nextStyle[key]
      ;(style as any)[key] = value == null ? '' : String(value)
    }
  } else if (typeof nextStyle === 'string') {
    style.cssText = nextStyle
  }
}
