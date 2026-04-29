# `nodeOps` (节点操作)

`nodeOps` 是 **Vue 3渲染器**（`createRenderer`）中用于**抽象平台特定节点操作**的核心对象。它将与平台相关的 DOM 操作（如创建元素、插入节点、设置属性等）封装成一组统一接口，使得渲染器本身可以完全独立于目标平台。通过替换 `nodeOps` 中的实现，Vue 可以将虚拟节点渲染到浏览器 `DOM`、`Canvas`、原生应用甚至任何自定义环境中。

## 1. `nodeOps` 的作用与设计动机

### 1.1 为什么需要抽离 `nodeOps`？

- **环境隔离**：渲染器不再直接依赖浏览器的 `DOM API`，所有节点操作都通过 `nodeOps` 间接调用
- **职责单一**：`nodeOps` 只负责“原汁原味”地调用底层 API,针对不同目标环境（`Web、Canvas、WebGL、移动端`等）实现各自的 `nodeOps`，即可复用相同的渲染逻辑。
- **平滑抹平差异**：在浏览器环境下，SVG 元素和普通 HTML 元素的创建方式不同（`createElementNS` vs `createElement`），`nodeOps` 将这些底层差异抹平，向上层暴露出统一的接口。

### 1.2 `nodeOps` 包含哪些核心接口？

```typescript [renderer.ts]
//核心接口api   
//必需方法：createElement、createText、insert、remove、parentNode、nextSibling、patchProp 是渲染器能够正常工作的最低要求。
export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  // 创建元素
  createElement(type: string, isSVG?: boolean, isCustomizedBuiltIn?: string): HostElement
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
    isSVG: boolean
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
    unmountChildren?: (children: VNode[]) => void
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
  nextSibling: node => node.nextSibling
}
```
:::

### 2.4  patchProp

`patchProp` 是最复杂的方法，负责处理属性的添加、更新、删除以及事件绑定。其内部区分了不同的属性类型（`class、style、event、普通属性`等）。

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

```typescript [patchClass.ts]
export function patchClass(el: Element, value: string | null) {
    if (value == null) {
        el.removeAttribute('class')
    } else {
        el.className = value
    }
}
```
```typescript [patchStyle.ts]
//为 style 属性进行打补丁
export function patchStyle(el: Element, prev, next) {
    // 获取 style 对象
    const style = (el as HTMLElement).style
    // 判断新的样式是否为纯字符串
    const isCssString = isString(next)
    if (next && !isCssString) {
        // 赋值新样式
        for (const key in next) {
            setStyle(style, key, next[key])
        }
        // 清理旧样式
        if (prev && !isString(prev)) {
            for (const key in prev) {
                if (next[key] == null) {
                    setStyle(style, key, '')
                }
            }
        }
    }
}

//赋值样式
function setStyle(
    style: CSSStyleDeclaration,
    name: string,
    val: string | string[]
) {
    style[name] = val
}
```
```typescript [patchEvent.ts]
export function patchEvent(
    el: Element & { _vei?: object },
    rawName: string,
    prevValue,
    nextValue
) {
    // vei = vue event invokers
    const invokers = el._vei || (el._vei = {})
    // 是否存在缓存事件
    const existingInvoker = invokers[rawName]
    // 如果当前事件存在缓存，并且存在新的事件行为，则判定为更新操作。直接更新 invoker 的 value 即可
    if (nextValue && existingInvoker) {
        // patch
        existingInvoker.value = nextValue
    } else {
        // 获取用于 addEventListener || removeEventListener 的事件名
        const name = parseName(rawName)
        if (nextValue) {
            // add
            const invoker = (invokers[rawName] = createInvoker(nextValue))
            el.addEventListener(name, invoker)
        } else if (existingInvoker) {
            // remove
            el.removeEventListener(name, existingInvoker)
            // 删除缓存
            invokers[rawName] = undefined
        }
    }
}

//直接返回剔除 on，其余转化为小写的事件名即可
function parseName(name: string) {
    return name.slice(2).toLowerCase()
}

//生成 invoker 函数
function createInvoker(initialValue) {
    const invoker = (e: Event) => {
        invoker.value && invoker.value()
    }
    // value 为真实的事件行为
    invoker.value = initialValue
    return invoker
}
```

```typescript [props.ts]
//通过 DOM Properties 指定属性
export function patchDOMProp(el: any, key: string, value: any) {
    try {
        el[key] = value
    } catch (e: any) {}
}
```

```typescript [patchAttr.ts]
//通过 setAttribute 设置属性
export function patchAttr(el: Element, key: string, value: any) {
    if (value == null) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(key, value)
    }
}
```
:::

## 3. 组合使用：注入到 `createRenderer`

在浏览器运行时环境 (`runtime-dom`) 中，`nodeOps` 会与 `patchProp` 组合在一起，合并成 `rendererOptions`，然后按需或者全量传入 `createRenderer`。

:::code-group
```typescript [runtime-dom/src/index.ts]
import {createRenderer} from '@vue/runtime-core'
import {nodeOps} from './nodeOps'
import {patchProp} from './patchProp'

// 1. 合并浏览器平台的节点操作和属性处理机制
const rendererOptions = Object.assign({patchProp}, nodeOps)

// 2. 惰性单例模式缓存 Renderer 实例
let renderer: Renderer<Element | ShadowRoot> | HydrationRenderer

function ensureRenderer() {
    // 当首次调用 createApp 时，才真正创建 Renderer
    return (
        renderer ||
        (renderer = createRenderer(rendererOptions))
    )
}

// 3. 对外暴露特定于浏览器的 createApp
export const createApp = ((...args) => {
    const app = ensureRenderer().createApp(...args)
    // 获取到 mount 挂载方法
    const {mount} = app
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

在 `baseCreateRenderer` 中，所有 `nodeOps` 方法被解构成内部函数（如 `hostInsert、hostCreateElement`）。渲染器内部不会再直接调用 `nodeOps.xxx`，而是通过闭包捕获的方法调用。

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

| 接口名 | 浏览器 (`runtime-dom`) | 自定义 Canvas 渲染器 (示例) |
|---|---|---|
| `createElement` | `document.createElement(tag)` | `new Pixi.Sprite()` 或 `new CanvasNode(tag)` |
| `insert` | `parent.insertBefore(child, anchor)` | `parent.addChildAt(child, index)` |
| `remove` | `parent.removeChild(child)` | `parent.removeChild(child)` |
| `setElementText` | `el.textContent = text` | `el.text = text` (修改图形文字属性) |
| `parentNode` | `node.parentNode` | `node.parent` |

## 7. 总结

`nodeOps` 是一组极其底层的薄封装。它的核心价值在于确立了**宿主环境操作 API 的标准契约**。

- **隔离性**：通过抽离 `nodeOps`，Vue 团队可以在不接触真实 DOM API 的情况下，对 `runtime-core`（如虚拟 DOM 和 Diff 算法）进行极致的单元测试。
- **指导意义**：如果你想要基于 Vue 3 语法糖去驱动硬件（比如控制 LED 阵列）、渲染 3D 场景（Three.js），或者是写一个 CLI 命令行界面应用，你只需要照着这几个基础 API，实现一套你自己的 `nodeOps`，Vue 的响应式魔法就能在你的平台上流转。