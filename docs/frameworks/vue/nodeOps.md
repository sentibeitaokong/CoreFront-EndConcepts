# `nodeOps` (节点操作)

`nodeOps` 是 **Vue 3渲染器**（`createRenderer`）中用于**抽象平台特定节点操作**的核心对象。它将与平台相关的 DOM
操作（如创建元素、插入节点、设置属性等）封装成一组统一接口，使得渲染器本身可以完全独立于目标平台。通过替换 `nodeOps` 中的实现，Vue
可以将虚拟节点渲染到浏览器 `DOM`、`Canvas`、原生应用甚至任何自定义环境中。

## 1. `nodeOps` 的作用与设计动机

### 1.1 为什么需要抽离 `nodeOps`？

- **环境隔离**：渲染器不再直接依赖浏览器的 `DOM API`，所有节点操作都通过 `nodeOps` 间接调用
- **职责单一**：`nodeOps` 只负责“原汁原味”地调用底层 API,针对不同目标环境（`Web、Canvas、WebGL、移动端`等）实现各自的
  `nodeOps`，即可复用相同的渲染逻辑。
- **平滑抹平差异**：在浏览器环境下，SVG 元素和普通 HTML 元素的创建方式不同（`createElementNS` vs `createElement`），`nodeOps`
  将这些底层差异抹平，向上层暴露出统一的接口。

### 1.2 `nodeOps` 包含哪些核心接口？

```typescript [renderer.ts]
//核心接口api
//必需方法：createElement、createText、insert、remove、parentNode、nextSibling、patchProp 是渲染器能够正常工作的最低要求。
export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement,
> {
  // 创建元素
  createElement(
    type: string,
    isSVG?: boolean,
    isCustomizedBuiltIn?: string,
  ): HostElement

  // 创建文本节点
  createText(text: string): HostNode

  // 创建注释节点
  createComment(text: string): HostNode

  // 插入节点
  insert(child: HostNode, parent: HostElement, anchor?: HostNode | null): void

  // 移除节点
  remove(child: HostNode): void

  // 设置元素文本内容
  setElementText(el: HostElement, text: string): void

  // 设置文本节点内容
  setText(node: HostNode, text: string): void

  // 获取父节点
  parentNode(node: HostNode): HostElement | null

  // 获取下一个兄弟节点
  nextSibling(node: HostNode): HostNode | null

  // 查询元素是否匹配选择器（主要用于 SSR hydrate）
  querySelector?(selector: string): HostElement | null

  // 获取元素作用域 ID（用于 CSS scope）
  getElementId?(el: HostElement): string | null

  // 插入静态内容（SSR 优化）
  insertStaticContent?(
    content: string,
    parent: HostElement,
    anchor: HostNode | null,
    isSVG: boolean,
  ): [HostNode, HostNode]

  // 更新属性（核心方法之一）
  patchProp(
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode[],
    parentComponent?: ComponentInternalInstance | null,
    parentSuspense?: SuspenseBoundary | null,
    unmountChildren?: (children: VNode[]) => void,
  ): void
}
```

## 2. 核心实现：浏览器环境的 `nodeOps`

### 2.1 节点的插入与删除 (增/删)

:::code-group

```typescript [nodeOps.ts (增删操作)]
export const nodeOps = {
  // 插入节点：原生 DOM API parent.insertBefore() 完美契合 Vue 的需求
  // 如果 anchor 为 null，insertBefore 的行为等同于 appendChild
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },

  // 删除节点：通过找到父节点，调用 parent.removeChild() 删除自身
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  // ... 其他操作
}
```

:::

### 2.2 节点的创建 (处理命名空间)

`createElement` 是最常用的 API，它需要处理 SVG 等特殊标签的命名空间问题。

:::code-group

```typescript [nodeOps.ts (创建操作)]
const doc = document
export const nodeOps = {
  // ... 其他操作
  // 创建普通元素或 SVG/MathML 元素
  createElement: (tag, isSVG, is, props): Element => {
    const el = isSVG
      ? doc.createElementNS(svgNS, tag)
      : doc.createElement(tag, is ? { is } : undefined)

    // 如果是特殊的 select 标签且为 multiple 模式，需要提前挂载属性
    if (tag === 'select' && props && props.multiple != null) {
      ;(el as HTMLSelectElement).setAttribute('multiple', props.multiple)
    }
    return el
  },

  // 创建文本节点
  createText: text => doc.createTextNode(text),

  // 创建注释节点
  createComment: text => doc.createComment(text),
}
```

:::

### 2.3 节点的修改与查询 (改/查)

:::code-group

```typescript [nodeOps.ts (修改与遍历)]
export const nodeOps = {
  // ... 其他操作

  // 快捷设置元素的纯文本内容
  setElementText: (el, text) => {
    el.textContent = text
  },

  // 更新独立的文本节点内容
  setText: (node, text) => {
    node.nodeValue = text
  },

  // 获取父节点（在 Diff 过程中处理节点移动时非常重要）
  parentNode: node => node.parentNode as Element | null,

  // 获取下一个兄弟节点（作为 insert 操作的 anchor 锚点）
  nextSibling: node => node.nextSibling,
}
```

:::

### 2.4 patchProp

`patchProp` 是最复杂的方法，负责处理属性的添加、更新、删除以及事件绑定。其内部区分了不同的属性类型（`class、style、event、普通属性`
等）。

:::code-group

```typescript [patchProp.ts]
import { patchAttr } from './modules/attrs'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/events'
import { patchStyle } from './modules/style'

//是否 on 开头
const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

export function patchProp(
  el: Element,
  key: string,
  prevValue: any,
  nextValue: any,
) {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    // 事件处理
    patchEvent(el, key, prevValue, nextValue)
  } else if (shouldSetAsProp(el, key)) {
    // 通过 DOM Properties 指定
    patchDOMProp(el, key, nextValue)
  } else {
    // 普通属性
    patchAttr(el, key, nextValue)
  }
}

//判断指定元素的指定属性是否可以通过 DOM Properties 指定
function shouldSetAsProp(el: Element, key: string) {
  // 各种边缘情况处理
  if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
    return false
  }

  // #1787, #2840 表单元素的表单属性是只读的，必须设置为属性 attribute
  if (key === 'form') {
    return false
  }

  // #1526 <input list> 必须设置为属性 attribute
  if (key === 'list' && el.tagName === 'INPUT') {
    return false
  }

  // #2766 <textarea type> 必须设置为属性 attribute
  if (key === 'type' && el.tagName === 'TEXTAREA') {
    return false
  }

  return key in el
}
```

```typescript [class.ts]
// 简化的 patchClass 实现
export function patchClass(el, value) {
  // 1. 如果新绑定的值是 null 或 undefined
  if (value == null) {
    el.removeAttribute('class')
  }
  // 2. 常规的 HTML 元素（核心性能优化点）
  else {
    // 检查元素身上是否挂载了 _vtc (说明当前正在执行动画) 过渡动画
    const transitionClasses = (el as any)._vtc
    if (transitionClasses) {
      // 【拦截与合并】
      // 将 Vue 计算出来的响应式 class，和存储在 _vtc 中的动画 class 强行合并
      value = (
        value ? [value, ...transitionClasses] : [...transitionClasses]
      ).join(' ')
    }
    el.className = value
  }
}
```

```typescript [style.ts]
/**
 * 比较并更新 DOM 元素的内联样式
 * @param {HTMLElement} el - 目标 DOM 元素
 * @param {Object|string|null} prev - 旧的样式对象
 * @param {Object|string|null} next - 新的样式对象
 */
export function patchStyle(el, prev, next) {
  const style = el.style
  const isCssString = typeof next === 'string'

  // 1. 如果新样式是一个对象 (Vue 最常见的场景)
  if (next && !isCssString) {
    // 🟢 步骤 A：遍历新样式，添加或更新属性
    for (const key in next) {
      setStyle(style, key, next[key])
    }

    // 🟢 步骤 B：遍历旧样式，清理掉新样式中没有的属性
    if (prev && typeof prev !== 'string') {
      for (const key in prev) {
        if (next[key] == null) {
          setStyle(style, key, '') // 赋值为空字符串即可移除该样式
        }
      }
    }
  }
  // 2. 如果新样式是一个字符串，或者被完全清空了
  else {
    if (isCssString) {
      // 如果是纯字符串格式（如 style="color: red;"）且发生变化，直接全量替换
      if (prev !== next) {
        style.cssText = next
      }
    } else if (prev) {
      // 🟢 步骤 C：如果新样式为空 (next === null)，直接移除整个 style 属性
      el.removeAttribute('style')
    }
  }
}

/**
 * 设置具体的 CSS 属性（处理了各种边界情况）
 */
function setStyle(style, name, val) {
  // 如果值为空，转换为 '' 以便清除样式
  if (val == null) {
    val = ''
  }

  // 处理 CSS 变量 (Custom Properties，例如 --theme-color)
  // CSS 变量不能直接用 style['--color'] = 'red' 赋值，必须调用 setProperty
  if (name.startsWith('--')) {
    style.setProperty(name, val)
  } else {
    // 【简化版】标准 CSS 属性直接赋值
    // 真实源码在这里还会处理 auto-prefixer (浏览器前缀) 以及 !important 的解析
    style[name] = val
  }
}
```

```typescript [events.ts]
/**
 * 比较并更新 DOM 元素的事件监听器
 * @param {HTMLElement} el - 目标 DOM 元素
 * @param {string} rawName - 原始事件名，例如 "onClick"
 * @param {Function|null} prevValue - 旧的事件回调
 * @param {Function|null} nextValue - 新的事件回调
 */
export function patchEvent(el, rawName, prevValue, nextValue) {
  // 1. 获取或初始化元素的事件缓存对象 _vei (vue event invokers)
  // 这是直接挂载在 DOM 元素身上的一个私有属性
  const invokers = el._vei || (el._vei = {})

  // 2. 查看这个事件是否已经绑定过伪装者 (invoker)
  const existingInvoker = invokers[rawName]

  if (nextValue && existingInvoker) {
    // 🟢 场景 A：事件发生了更新
    // 最爽的情况：直接修改伪装者内部的 value，完全不需要调用底层的 DOM API！
    existingInvoker.value = nextValue
  } else {
    // 处理原生事件名，例如将 "onClick" 转换为 "click"
    const name = rawName.slice(2).toLowerCase()

    if (nextValue) {
      // 🟢 场景 B：全新绑定事件
      // 创建一个新的伪装者，并把它存到缓存里
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      // 将伪装者绑定到真实的 DOM 事件上（这是唯一一次调用 addEventListener）
      el.addEventListener(name, invoker)
    } else if (existingInvoker) {
      // 🟢 场景 C：移除事件绑定 (nextValue 为空，说明用户删除了事件)
      el.removeEventListener(name, existingInvoker)
      // 清空缓存
      invokers[rawName] = undefined
    }
  }
}

/**
 * 创建事件伪装者 (Invoker)
 * @param {Function} initialValue - 初始的真正回调函数
 */
function createInvoker(initialValue) {
  // 这是一个包裹函数，真实绑定给 DOM 的就是它
  const invoker = e => {
    // 当事件触发时，它去调用自己身上挂载的真正回调
    invoker.value(e)
  }

  // 将真正的回调函数存到 invoker 的 value 属性上
  invoker.value = initialValue

  return invoker
}
```

```typescript [props.ts]
// 简化的 patchDOMProp 实现
export function patchDOMProp(
  el, // DOM 元素本身
  key, // 属性名
  value, // 新值
  prevValue, // 旧值
) {
  // 1. 特殊处理：innerHTML 和 textContent
  // Vue 允许通过 v-html 或 v-text 绑定这两个原生属性
  if (key === 'innerHTML' || key === 'textContent') {
    // 如果之前有子节点，Vue 的虚拟 DOM 会先卸载子节点，然后再设置文本
    if (value != null) {
      el[key] = value
    } else {
      el[key] = '' // 如果绑定的值为 null/undefined，清空内容
    }
    return
  }
  // 2. 特殊处理：表单元素的 value 属性
  // 表单元素的 value 是非常特殊的，频繁无脑赋值会导致光标跳动（Cursor Jump）
  if (key === 'value' && el.tagName !== 'PROGRESS') {
    // 缓存原始值到 _value 上，用于 v-model 等指令的比对
    el._value = value
    const newValue = value == null ? '' : value

    // 🚨 核心优化：只有当新旧值真的不相等时，才去操作 DOM 的 value 属性
    // 这避免了用户正在输入时，框架强行重写 value 导致光标移到末尾的 Bug
    if (el.value !== newValue) {
      el.value = newValue
    }
    return
  }
  // 3. 处理 Boolean 类型的 property (比如 disabled, checked)
  // 在 HTML 中，<input disabled> 哪怕没有值也是 true。Vue 需要模拟这种行为
  if (typeof value === 'boolean' || value === '') {
    if (value === true || value === '') {
      el[key] = true
    } else {
      // 设为 false 时，不仅要改 property，还要确保没有残留的 boolean attribute
      el[key] = false
    }
    return
  }
  // 4. 常规 Property 赋值兜底
  // 大部分普通属性（如 id, title, className 等）都会走到这里
  try {
    el[key] = value
  } catch (e) {
    // 🚨 为什么要 try-catch？
    // 因为 DOM API 是一个黑盒，有些元素在某些特定状态下，某些 property 是只读的。
    // 例如某些浏览器不允许动态修改 input.type，或者给只读属性强行赋值会抛出异常。
    // Vue 的策略是：遇到报错直接吞掉并静默失败（开发环境下会打印警告），防止整个应用崩溃。
    if (__DEV__) {
      console.warn(
        `Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
          `value ${value} is invalid.`,
        e,
      )
    }
  }
}
```

```typescript [attrs.ts]
// 一些辅助判断函数 (模拟源码中的共享工具函数)
// 判断是否是特殊的布尔值 attribute (没有对应的同名 DOM property，例如 itemScope)
const isSpecialBooleanAttr = key =>
  key === 'itemscope' || key === 'allowfullscreen'
// SVG 的 xlink 命名空间 URI

/**
 * 更新普通的 HTML/SVG Attribute
 * @param {Element} el 真实 DOM 元素
 * @param {string} key 属性名
 * @param {any} value 新的属性值
 */
function patchAttr(el, key, value) {
  // 1. 处理 SVG 元素的带有 xlink: 前缀的命名空间属性
  if (key.startsWith('xlink:')) {
    if (value == null) {
      // 截取 'xlink:' 后面的真实属性名进行移除
      el.removeAttributeNS(xlinkNS, key.slice(6))
    } else {
      el.setAttributeNS(xlinkNS, key, value)
    }
  }
  // 2. 处理普通的 HTML 属性
  else {
    // 检查是否是布尔类型的 attribute
    const isBoolean = isSpecialBooleanAttr(key)

    // 场景 A: 值为 null/undefined，或者布尔属性的值为 false
    // 比如 <div :id="null"> 或 <div :itemscope="false">
    if (value == null || (isBoolean && value === false)) {
      el.removeAttribute(key)
    }
    // 场景 B: 正常设置属性
    else {
      // 如果是布尔属性且值为 true，应该设置为 "" (例如 allowfullscreen="")
      // 否则直接转为字符串设置
      el.setAttribute(key, isBoolean ? '' : value)
    }
  }
}
```

:::

## 3. 组合使用：注入到 `createRenderer`

在浏览器运行时环境 (`runtime-dom`) 中，`nodeOps` 会与 `patchProp` 组合在一起，合并成 `rendererOptions`，然后按需或者全量传入
`createRenderer`。

:::code-group

```typescript [runtime-dom/src/index.ts]
import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

// 1. 合并浏览器平台的节点操作和属性处理机制
const rendererOptions = Object.assign({ patchProp }, nodeOps)

// 2. 惰性单例模式缓存 Renderer 实例
let renderer: Renderer<Element | ShadowRoot> | HydrationRenderer

function ensureRenderer() {
  // 当首次调用 createApp 时，才真正创建 Renderer
  return renderer || (renderer = createRenderer(rendererOptions))
}

// 3. 对外暴露特定于浏览器的 createApp
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)
  // 获取到 mount 挂载方法
  const { mount } = app
  // 对该方法进行重构，标准化 container，在重新触发 mount 进行挂载
  app.mount = (containerOrSelector: Element | string) => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return
    mount(container)
  }
  return app
}) as CreateAppFunction<Element>

//规范化容器
function normalizeContainer(container: Element | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    return res
  }
  return container
}
```

:::

## 4. `nodeOps` 与渲染器的协作方式

在 `baseCreateRenderer` 中，所有 `nodeOps` 方法被解构成内部函数（如 `hostInsert、hostCreateElement`）。渲染器内部不会再直接调用
`nodeOps.xxx`，而是通过闭包捕获的方法调用。

```typescript [renderer.ts]
function baseCreateRenderer(options: RendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
    // ...
  } = options

  // 定义 patch 相关函数...
}
```

## 5. 完整流程图

展示一个简单的元素挂载流程中 `nodeOps` 方法的调用顺序。

![Logo](/nodeOps.png)

## 6. `nodeOps` 跨平台实现对比

为了更直观地理解 `nodeOps` 的抽象意义，我们可以对比一下 Vue 官方的浏览器实现与第三方（例如 Canvas）渲染器的理论实现差异：

| 接口名           | 浏览器 (`runtime-dom`)               | 自定义 Canvas 渲染器 (示例)                  |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| `createElement`  | `document.createElement(tag)`        | `new Pixi.Sprite()` 或 `new CanvasNode(tag)` |
| `insert`         | `parent.insertBefore(child, anchor)` | `parent.addChildAt(child, index)`            |
| `remove`         | `parent.removeChild(child)`          | `parent.removeChild(child)`                  |
| `setElementText` | `el.textContent = text`              | `el.text = text` (修改图形文字属性)          |
| `parentNode`     | `node.parentNode`                    | `node.parent`                                |

## 7. 总结

`nodeOps` 是一组极其底层的薄封装。它的核心价值在于确立了**宿主环境操作 API 的标准契约**。

- **隔离性**：通过抽离 `nodeOps`，Vue 团队可以在不接触真实 DOM API 的情况下，对 `runtime-core`（如虚拟 DOM 和 Diff
  算法）进行极致的单元测试。
- **指导意义**：如果你想要基于 Vue 3 语法糖去驱动硬件（比如控制 LED 阵列）、渲染 3D 场景（Three.js），或者是写一个 CLI
  命令行界面应用，你只需要照着这几个基础 API，实现一套你自己的 `nodeOps`，Vue 的响应式魔法就能在你的平台上流转。
