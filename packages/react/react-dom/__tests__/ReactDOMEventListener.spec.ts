/**
 * 事件系统测试（不依赖 jsdom）
 *
 * ReactDOMEventListener 只依赖 EventTarget 的 addEventListener 接口，
 * 以及 DOM 节点上的 nodeType/parentNode 和「节点 → Fiber」内部缓存。
 * 因此这里用最小假 DOM（普通对象）即可验证：
 * - 事件委托是否注册到根容器
 * - 捕获阶段「祖先 → 目标」、冒泡阶段「目标 → 祖先」的执行顺序
 * - currentTarget 是否正确切换
 * - preventDefault / stopPropagation 是否生效
 * - 非委托事件是否注册在元素本身
 */

import { describe, it, expect, vi } from 'vitest'
import { HostComponent } from 'react-reconciler/src/ReactWorkTags'
import {
  precacheFiberNode,
  updateFiberProps,
} from '../client/ReactDOMComponentTree'
import {
  registrationNameDependencies,
  nonDelegatedEvents,
} from '../client/DOMEventProperties'
import {
  listenToAllSupportedEvents,
  listenToNonDelegatedEvent,
} from '../client/ReactDOMEventListener'

type FakeListener = (event: any) => void

/** 创建一个只实现事件系统所需接口的假 DOM 元素 */
function createFakeElement() {
  const listeners = new Map<string, Array<FakeListener>>()

  const keyOf = (type: string, capture: boolean) =>
    type + (capture ? ':capture' : ':bubble')

  return {
    nodeType: 1,
    parentNode: null as any,
    tagName: 'DIV',
    addEventListener(type: string, listener: FakeListener, capture?: boolean) {
      const key = keyOf(type, capture === true)
      const list = listeners.get(key) || []
      list.push(listener)
      listeners.set(key, list)
    },
    removeEventListener() {
      // 本实现不会解绑监听器，留空即可
    },
    /** 手动触发某个阶段的所有监听器，模拟浏览器派发原生事件 */
    fire(type: string, capture: boolean, event: any) {
      const list = listeners.get(keyOf(type, capture)) || []
      for (const listener of list) {
        listener(event)
      }
    },
    hasListener(type: string, capture: boolean): boolean {
      return (listeners.get(keyOf(type, capture)) || []).length > 0
    },
  }
}

/** 构造一个只含事件分发所需字段的 Fiber */
function createHostFiber(node: any, props: any, parent: any = null) {
  return {
    tag: HostComponent,
    stateNode: node,
    memoizedProps: props,
    pendingProps: props,
    return: parent,
  } as any
}

/** 构造一个原生事件对象 */
function createNativeEvent(type: string, target: any) {
  return {
    type,
    target,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault(this: any) {
      this.defaultPrevented = true
    },
    stopPropagation(this: any) {
      this.propagationStopped = true
    },
  }
}

describe('DOMEventProperties 注册表', () => {
  it('把 React 属性名映射到正确的原生事件', () => {
    expect(registrationNameDependencies.onClick).toEqual(['click'])
    expect(registrationNameDependencies.onDoubleClick).toEqual(['dblclick'])
    expect(registrationNameDependencies.onMouseDown).toEqual(['mousedown'])
    expect(registrationNameDependencies.onFocus).toEqual(['focusin'])
    expect(registrationNameDependencies.onBlur).toEqual(['focusout'])
    expect(registrationNameDependencies.onChange).toEqual(['input', 'change'])
  })

  it('捕获版本与冒泡版本共享同一依赖数组', () => {
    expect(registrationNameDependencies.onClickCapture).toBe(
      registrationNameDependencies.onClick,
    )
    expect(registrationNameDependencies.onScrollCapture).toBe(
      registrationNameDependencies.onScroll,
    )
  })

  it('正确区分委托事件与非委托事件', () => {
    expect(nonDelegatedEvents.has('scroll')).toBe(true)
    expect(nonDelegatedEvents.has('mouseenter')).toBe(true)
    expect(nonDelegatedEvents.has('load')).toBe(true)
    expect(nonDelegatedEvents.has('click')).toBe(false)
    expect(nonDelegatedEvents.has('keydown')).toBe(false)
  })
})

describe('Event delegation', () => {
  it('根容器上同时注册捕获和冒泡监听器', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    expect(container.hasListener('click', true)).toBe(true)
    expect(container.hasListener('click', false)).toBe(true)
    expect(container.hasListener('keydown', true)).toBe(true)
    expect(container.hasListener('keydown', false)).toBe(true)

    // 非委托事件不应注册在根容器上
    expect(container.hasListener('scroll', true)).toBe(false)
    expect(container.hasListener('scroll', false)).toBe(false)
  })

  it('按「捕获：祖先→目标」「冒泡：目标→祖先」的顺序执行', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const outerNode = createFakeElement()
    const innerNode = createFakeElement()
    const calls: Array<string> = []

    const outerFiber = createHostFiber(outerNode, {
      onClickCapture: () => calls.push('outer:capture'),
      onClick: () => calls.push('outer:bubble'),
    })
    const innerFiber = createHostFiber(
      innerNode,
      {
        onClickCapture: () => calls.push('inner:capture'),
        onClick: () => calls.push('inner:bubble'),
      },
      outerFiber,
    )

    precacheFiberNode(outerFiber, outerNode as any)
    precacheFiberNode(innerFiber, innerNode as any)

    const nativeEvent = createNativeEvent('click', innerNode)
    container.fire('click', true, nativeEvent)
    container.fire('click', false, nativeEvent)

    expect(calls).toEqual([
      'outer:capture',
      'inner:capture',
      'inner:bubble',
      'outer:bubble',
    ])
  })

  it('currentTarget 指向处理器所属的 DOM 元素', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const outerNode = createFakeElement()
    const innerNode = createFakeElement()
    const seen: Array<any> = []

    const outerFiber = createHostFiber(outerNode, {
      onClick: (event: any) => seen.push(event.currentTarget),
    })
    const innerFiber = createHostFiber(
      innerNode,
      {
        onClick: (event: any) => seen.push(event.currentTarget),
      },
      outerFiber,
    )

    precacheFiberNode(outerFiber, outerNode as any)
    precacheFiberNode(innerFiber, innerNode as any)

    const nativeEvent = createNativeEvent('click', innerNode)
    container.fire('click', false, nativeEvent)

    expect(seen).toEqual([innerNode, outerNode])
  })

  it('preventDefault 同时阻止合成事件与原生事件的默认行为', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const node = createFakeElement()
    const fiber = createHostFiber(node, {
      onClick: (event: any) => {
        event.preventDefault()
        expect(event.isDefaultPrevented()).toBe(true)
      },
    })
    precacheFiberNode(fiber, node as any)

    const nativeEvent = createNativeEvent('click', node)
    container.fire('click', false, nativeEvent)

    expect(nativeEvent.defaultPrevented).toBe(true)
  })

  it('stopPropagation 终止后续处理器（包括祖先）', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const outerNode = createFakeElement()
    const innerNode = createFakeElement()
    const outerHandler = vi.fn()

    const outerFiber = createHostFiber(outerNode, { onClick: outerHandler })
    const innerFiber = createHostFiber(
      innerNode,
      {
        onClick: (event: any) => event.stopPropagation(),
      },
      outerFiber,
    )

    precacheFiberNode(outerFiber, outerNode as any)
    precacheFiberNode(innerFiber, innerNode as any)

    const nativeEvent = createNativeEvent('click', innerNode)
    container.fire('click', false, nativeEvent)

    expect(outerHandler).not.toHaveBeenCalled()
    expect(nativeEvent.propagationStopped).toBe(true)
  })

  it('优先使用 DOM 节点上的 props 缓存（避免双缓冲下的旧处理器）', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const node = createFakeElement()
    const oldHandler = vi.fn()
    const newHandler = vi.fn()

    const fiber = createHostFiber(node, { onClick: oldHandler })
    precacheFiberNode(fiber, node as any)
    // 模拟一次提交：props 缓存被刷新为新处理器，但 fiber 上的 memoizedProps 还是旧的
    updateFiberProps(node as any, { onClick: newHandler })

    container.fire('click', false, createNativeEvent('click', node))

    expect(newHandler).toHaveBeenCalledTimes(1)
    expect(oldHandler).not.toHaveBeenCalled()
  })

  it('onChange 对 input/change 做值去重', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const inputNode = {
      ...createFakeElement(),
      tagName: 'INPUT',
      type: 'text',
      value: 'a',
    }
    const handler = vi.fn()
    const fiber = createHostFiber(inputNode, { onChange: handler })
    precacheFiberNode(fiber, inputNode as any)

    // 值从 undefined → 'a'：分发
    container.fire('input', false, createNativeEvent('input', inputNode))
    // 值未变化（change 紧跟在 input 之后）：跳过
    container.fire('change', false, createNativeEvent('change', inputNode))
    // 值变化：分发
    inputNode.value = 'ab'
    container.fire('input', false, createNativeEvent('input', inputNode))

    expect(handler).toHaveBeenCalledTimes(2)
  })
})

describe('invokeGuardedCallbackAndCatchFirstError', () => {
  it('处理器抛错不会中断其余处理器，分发结束后抛出第一个错误', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const outerNode = createFakeElement()
    const innerNode = createFakeElement()
    const outerHandler = vi.fn()
    let seenEvent: any = null

    const outerFiber = createHostFiber(outerNode, { onClick: outerHandler })
    const innerFiber = createHostFiber(
      innerNode,
      {
        onClick: (event: any) => {
          seenEvent = event
          // 模拟用户处理器篡改 currentTarget 后抛错
          event.currentTarget = 'tampered'
          throw new Error('boom')
        },
      },
      outerFiber,
    )

    precacheFiberNode(outerFiber, outerNode as any)
    precacheFiberNode(innerFiber, innerNode as any)

    const nativeEvent = createNativeEvent('click', innerNode)

    // 错误在整轮分发结束后才被抛出
    expect(() => container.fire('click', false, nativeEvent)).toThrow('boom')

    // 祖先上的处理器仍然执行了
    expect(outerHandler).toHaveBeenCalledTimes(1)
    // 抛错处理器的 currentTarget 也被正确复位
    expect(seenEvent.currentTarget).toBe(null)
  })

  it('多个处理器抛错时只重新抛出第一个错误', () => {
    const container = createFakeElement()
    listenToAllSupportedEvents(container as any)

    const outerNode = createFakeElement()
    const innerNode = createFakeElement()

    const outerFiber = createHostFiber(outerNode, {
      onClick: () => {
        throw new Error('second')
      },
    })
    const innerFiber = createHostFiber(
      innerNode,
      {
        onClick: () => {
          throw new Error('first')
        },
      },
      outerFiber,
    )

    precacheFiberNode(outerFiber, outerNode as any)
    precacheFiberNode(innerFiber, innerNode as any)

    const nativeEvent = createNativeEvent('click', innerNode)
    expect(() => container.fire('click', false, nativeEvent)).toThrow('first')
  })
})

describe('Non-delegated events', () => {
  it('scroll 监听器注册在拥有该属性的元素上', () => {
    const node = createFakeElement()
    listenToNonDelegatedEvent('scroll', node as any)

    expect(node.hasListener('scroll', true)).toBe(true)
    expect(node.hasListener('scroll', false)).toBe(true)
  })

  it('元素上的非委托事件能正确触发处理器', () => {
    const node = createFakeElement()
    // currentTarget 在处理器执行完毕后会被重置为 null，
    // 因此在处理器内部记录它（与浏览器中的使用方式一致）
    let seenCurrentTarget: any = null
    const handler = vi.fn((event: any) => {
      seenCurrentTarget = event.currentTarget
    })
    const fiber = createHostFiber(node, { onScroll: handler })
    precacheFiberNode(fiber, node as any)

    listenToNonDelegatedEvent('scroll', node as any)

    const nativeEvent = createNativeEvent('scroll', node)
    node.fire('scroll', false, nativeEvent)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(seenCurrentTarget).toBe(node)
  })

  it('非委托事件只触发监听器所在元素，不误触祖先处理器', () => {
    const parentNode = createFakeElement()
    const childNode = createFakeElement()
    const parentHandler = vi.fn()
    const childHandler = vi.fn()

    const parentFiber = createHostFiber(parentNode, { onScroll: parentHandler })
    const childFiber = createHostFiber(
      childNode,
      { onScroll: childHandler },
      parentFiber,
    )
    precacheFiberNode(parentFiber, parentNode as any)
    precacheFiberNode(childFiber, childNode as any)

    // 子元素拥有 onScroll 属性 → 监听器挂在子元素上
    listenToNonDelegatedEvent('scroll', childNode as any)

    childNode.fire('scroll', false, createNativeEvent('scroll', childNode))

    expect(childHandler).toHaveBeenCalledTimes(1)
    // 父元素的 onScroll 不应因为子元素滚动而被调用
    expect(parentHandler).not.toHaveBeenCalled()
  })
})
