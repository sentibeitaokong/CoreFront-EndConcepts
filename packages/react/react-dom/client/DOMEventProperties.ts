/**
 * DOMEventProperties.ts —— DOM 事件注册表
 *
 * 本文件只维护「名字映射」和「支持哪些事件」这类静态数据，不接触 DOM。
 * 真正的监听器注册在 ReactDOMEventListener.ts，事件触发后的分发也在那里。
 *
 * 三个关键概念：
 *
 * 1. 原生事件名（domEventName）
 *    浏览器 addEventListener 使用的名字，如 'click'、'keydown'、'input'。
 *
 * 2. React 注册名（registrationName）
 *    JSX 里写的属性名，如 onClick、onKeyDown、onChange。
 *    捕获阶段使用同名 + 'Capture' 后缀，如 onClickCapture。
 *
 * 3. 依赖关系（dependencies）
 *    一个 React 注册名可能依赖多个原生事件。最典型的是 onChange：
 *    文本输入需要监听 input（每次输入）和 change（失焦/文件选择）。
 *
 * 事件委托：绝大多数事件只在根容器上注册一次，利用事件冒泡统一分发；
 * 少数不会冒泡的事件（滚动、媒体事件等）必须直接注册在出现该属性的元素上，
 * 这些事件记录在 nonDelegatedEvents 中。
 */

/** 原生事件名 → React 注册名 */
const reactNameOverrides: Record<string, string> = {
  // 鼠标
  dblclick: 'onDoubleClick',
  contextmenu: 'onContextMenu',
  auxclick: 'onAuxClick',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mousemove: 'onMouseMove',
  mouseover: 'onMouseOver',
  mouseout: 'onMouseOut',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',

  // 指针
  pointerover: 'onPointerOver',
  pointerenter: 'onPointerEnter',
  pointerdown: 'onPointerDown',
  pointermove: 'onPointerMove',
  pointerup: 'onPointerUp',
  pointercancel: 'onPointerCancel',
  pointerout: 'onPointerOut',
  pointerleave: 'onPointerLeave',
  gotpointercapture: 'onGotPointerCapture',
  lostpointercapture: 'onLostPointerCapture',

  // 触摸
  touchstart: 'onTouchStart',
  touchmove: 'onTouchMove',
  touchend: 'onTouchEnd',
  touchcancel: 'onTouchCancel',

  // 键盘
  keydown: 'onKeyDown',
  keyup: 'onKeyUp',
  keypress: 'onKeyPress',

  // 焦点：使用会冒泡的 focusin/focusout 实现委托，
  // 所以 React 的 onFocus/onBlur 在 JSX 上仍然可用
  focusin: 'onFocus',
  focusout: 'onBlur',

  // 表单输入：input 与 change 都映射到 onChange（分发时按值去重）
  input: 'onChange',
  change: 'onChange',
  beforeinput: 'onBeforeInput',

  // 组合输入
  compositionstart: 'onCompositionStart',
  compositionupdate: 'onCompositionUpdate',
  compositionend: 'onCompositionEnd',

  // 动画 / 过渡
  animationstart: 'onAnimationStart',
  animationend: 'onAnimationEnd',
  animationiteration: 'onAnimationIteration',
  transitionend: 'onTransitionEnd',

  // 拖拽
  dragenter: 'onDragEnter',
  dragleave: 'onDragLeave',
  dragover: 'onDragOver',
  dragstart: 'onDragStart',
  dragend: 'onDragEnd',

  // 媒体
  canplay: 'onCanPlay',
  canplaythrough: 'onCanPlayThrough',
  durationchange: 'onDurationChange',
  loadeddata: 'onLoadedData',
  loadedmetadata: 'onLoadedMetadata',
  loadstart: 'onLoadStart',
  ratechange: 'onRateChange',
  timeupdate: 'onTimeUpdate',
  volumechange: 'onVolumeChange',
}

/**
 * 所有需要注册的原生事件名
 *
 * 单词语事件（click、submit、scroll……）走默认命名规则：on + 首字母大写；
 * 多词事件在 reactNameOverrides 中给出准确名称。
 */
const simpleEventNames: string[] = [
  // 鼠标
  'click',
  'contextmenu',
  'dblclick',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave',
  'auxclick',

  // 指针
  'pointerover',
  'pointerenter',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerout',
  'pointerleave',
  'gotpointercapture',
  'lostpointercapture',

  // 触摸
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',

  // 键盘
  'keydown',
  'keyup',
  'keypress',

  // 焦点
  'focusin',
  'focusout',

  // 表单
  'input',
  'change',
  'beforeinput',
  'submit',
  'reset',
  'invalid',
  'select',

  // 组合输入
  'compositionstart',
  'compositionupdate',
  'compositionend',

  // 剪贴板
  'copy',
  'cut',
  'paste',

  // 拖拽
  'drag',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'dragend',

  // 滚动 / 滚轮
  'wheel',
  'scroll',

  // 动画 / 过渡
  'animationstart',
  'animationend',
  'animationiteration',
  'transitionend',

  // 弹层
  'toggle',
  'cancel',
  'close',

  // 资源 / 媒体
  'load',
  'error',
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
]

/**
 * 不能依赖冒泡委托的原生事件
 *
 * 这些事件要么根本不冒泡（scroll、load、error、mouseenter……），
 * 要么 React 选择直接在目标元素上监听。它们会在宿主元素
 * 出现对应 onXxx 属性时，由 ReactDOMHostConfig 注册到该元素本身。
 */
export const nonDelegatedEvents: Set<string> = new Set<string>([
  // 非冒泡的基础事件
  'cancel',
  'close',
  'invalid',
  'load',
  'error',
  'scroll',
  'toggle',
  // select 在部分浏览器中不冒泡，直接挂在元素上更可靠
  'select',

  // 进入/离开：原生事件不冒泡，注册在元素上才能正确触发
  'mouseenter',
  'mouseleave',
  'pointerenter',
  'pointerleave',

  // 媒体事件：不会冒泡
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
])

/**
 * React 注册名 → 原生事件依赖列表
 *
 * 例如：
 * - onClick        → ['click']
 * - onChange       → ['input', 'change']
 * - onClickCapture → ['click']（与 onClick 共享同一依赖数组）
 */
export const registrationNameDependencies: Record<string, string[]> = {}

/**
 * 所有需要监听的原生事件名集合
 *
 * ReactDOMEventListener 会遍历它，在根容器上注册捕获 + 冒泡两套委托监听器。
 */
export const allNativeEvents: Set<string> = new Set<string>()

/**
 * 注册一个 React 事件名及其捕获版本
 *
 * onChange 的 input/change 两个依赖会分两次调用 registerTwoPhaseEvent，
 * 因此这里需要把依赖「合并」到同一个数组，而不是直接覆盖。
 *
 * @param registrationName - React 事件名（onClick）
 * @param dependencies     - 该事件依赖的原生事件名（['click']）
 */
function registerTwoPhaseEvent(
  registrationName: string,
  dependencies: string[],
): void {
  const existing = registrationNameDependencies[registrationName]

  if (existing !== undefined) {
    // 例如 input → onChange 已注册，再次注册 change → onChange 时合并依赖
    for (const dependency of dependencies) {
      if (existing.indexOf(dependency) === -1) {
        existing.push(dependency)
      }
      allNativeEvents.add(dependency)
    }
    return
  }

  // 注册名与捕获名共享同一个依赖数组，避免维护两份数据
  registrationNameDependencies[registrationName] = dependencies
  registrationNameDependencies[registrationName + 'Capture'] = dependencies

  for (const dependency of dependencies) {
    allNativeEvents.add(dependency)
  }
}

// 初始化事件注册表
for (const domEventName of simpleEventNames) {
  const reactName =
    reactNameOverrides[domEventName] ||
    'on' + domEventName.charAt(0).toUpperCase() + domEventName.slice(1)
  registerTwoPhaseEvent(reactName, [domEventName])
}

/** 将原生事件名转换成 React 注册名（不区分捕获/冒泡） */
export function getReactEventNameFromNative(
  domEventName: string,
): string | undefined {
  if (reactNameOverrides[domEventName] !== undefined) {
    return reactNameOverrides[domEventName]
  }
  if (allNativeEvents.has(domEventName)) {
    return 'on' + domEventName.charAt(0).toUpperCase() + domEventName.slice(1)
  }
  return undefined
}

/** 判断一个 props key 是否是已知的 React 事件属性（如 onClick / onScrollCapture） */
export function isKnownEventProp(propKey: string): boolean {
  return registrationNameDependencies[propKey] !== undefined
}
