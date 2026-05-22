# `createRenderer`(自定义渲染器)

`createRenderer` 是 Vue 3 渲染器（Renderer）体系的核心入口。它采用了一种极为优雅的**依赖注入（Dependency Injection）** 与**闭包**架构，将 Vue 的核心算法（虚拟 DOM、Diff 算法、组件生命周期）与具体的平台 API（如浏览器的 DOM 操作）彻底解耦，从而实现了真正的跨平台渲染能力。

## 1. `createRenderer` 的作用与设计动机

### 1.1 为什么需要 `createRenderer`？

- **平台无关性**：Vue 核心逻辑不应该绑定在 `document` 或 `window` 上。通过 `createRenderer`，我们可以传入自定义的节点操作方法，让
  Vue 运行在 Canvas、WebGL、Weex、小程序甚至 Node.js 终端。
- **依赖注入**：将“如何创建元素”、“如何插入节点”等具体实现作为 `options` 传入，渲染器内部只负责调用这些接口。
- **闭包封装**：通过闭包缓存平台特有的操作 API，并在内部定义 `patch` 等核心逻辑，避免了全局变量污染和上下文传递的开销。

### 1.2 与默认 DOM 渲染器的关系

| 特性     | 默认 DOM 渲染器                    | 自定义渲染器                                                                |
| -------- | ---------------------------------- | --------------------------------------------------------------------------- |
| 节点操作 | 基于浏览器 DOM API                 | 用户提供（如 Canvas 绘图命令）                                              |
| 创建方式 | 内部调用 `createRenderer(nodeOps)` | 显式调用 `createRenderer` 并传入**自定义平台相关的节点操作接口**(`nodeOps`) |
| 应用入口 | `createApp()` (从 `vue` 导入)      | `createRenderer(...).createApp()`                                           |
| 适用场景 | 浏览器 Web 应用                    | 非浏览器环境、特殊渲染需求                                                  |

## 2. 核心实现：渲染器工厂函数

### 2.1 `createRenderer` 函数入口

:::code-group

```typescript [renderer.ts]
// 核心入口：接收外部传入的渲染选项
export function createRenderer(options: RendererOptions) {
  // 本质上是调用 baseCreateRenderer
  return baseCreateRenderer(options)
}

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

:::

### 2.2 `baseCreateRenderer` 核心骨架

:::code-group

```typescript [renderer.ts]
import { createAppAPI } from './apiCreateApp'
import { Comment, Fragment, isSameVNodeType, Text } from './vnode'
function baseCreateRenderer(options: RendererOptions): any {
  // 1. 从传入的 options 中解构出特定平台的操作 API（重命名以防止冲突）
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment,
  } = options

  // 2. 核心调度：patch 函数 (对比新旧 VNode)  （n1旧节点,n2新节点,container容器,anchor锚地）
  const patch = (oldVNode, newVNode, container, anchor = null) => {
    //如果新老节点相同直接返回
    if (oldVNode === newVNode) {
      return
    }
    //判断是否为相同类型节点
    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      //卸载旧节点
      unmount(oldVNode)
      oldVNode = null
    }
    //提取新节点的类型和标识
    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        // Text
        processText(oldVNode, newVNode, container, anchor)
        break
      case Comment:
        // Comment
        processCommentNode(oldVNode, newVNode, container, anchor)
        break
      case Fragment:
        // Fragment
        processFragment(oldVNode, newVNode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //文本
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 组件
          processComponent(oldVNode, newVNode, container, anchor)
        }
    }
  }

  // 3. 对外暴露的 render 函数
  const render: RootRenderFunction = (vnode, container, isSVG) => {
    if (vnode == null) {
      // 如果新 vnode 为空且有旧 vnode，执行卸载
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      // 触发 patch 挂载或更新
      patch(container._vnode || null, vnode, container, null, null, null, isSVG)
    }
    // 缓存当前的 vnode
    container._vnode = vnode
  }
  //卸载
  const unmount = vnode => {
    hostRemove(vnode.el!)
  }
  //将渲染器的核心api全部暴露出去供keepAlive和teleport组件使用，且只有内置组件有访问这个对象的权限
  //使得这些内置组件具备操纵底层的能力，包括控制dom
  const internals: RendererInternals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options, // 把最初传进来的原生 DOM API 也塞了进去
  }
  // 4. 返回渲染器对象，包含 render 和 createApp
  return {
    render,
    createApp: createAppAPI(render),
  }
}
```

```typescript [apiCreateApp.ts]
import { createVNode } from './vnode'
// 通过 createAppAPI 将 render 函数与应用实例绑定,创建 app 实例
//app.mount 的兼容性处理魔法：函数重写
//1. 在 runtime-core 中，暴露了一个 createAppAPI 工厂函数。它创建出来的 app 实例包含一个最基础的 mount 方法。
// 这个基础版的 mount 只接受真正的节点对象,例：app.mount(document.querySelector('#app'))，根本不认识 #app 这种 CSS 字符串选择器。
//2.为了让 Web 开发者能像以前一样方便地传入 #app 字符串，runtime-dom 包在导出 createApp 时，做了一次经典的方法重写（AOP 思想）。
// 使得开发者依旧可以使用app.mount('#app')去挂载应用。
export function createAppAPI<HostElement>(render) {
  return function createApp(rootComponent, rootProps = null) {
    const app = {
      _component: rootComponent,
      _container: null,
      // 挂载方法
      mount(rootContainer: HostElement): any {
        // 直接通过 createVNode 方法构建 vnode
        const vnode = createVNode(rootComponent, rootProps)
        // 通过 render 函数进行挂载
        render(vnode, rootContainer)
      },
    }
    return app
  }
}
```

```typescript [runtime-dom/index.ts]
//runtime-dom 重写 createApp 的本质，就是一个适配器模式（Adapter Pattern）的应用
// 在浏览器 Web 平台开发者依旧可以使用app.mount('#app')去挂载应用。
//懒加载渲染器 (单例模式)
let renderer
//获取自定义渲染器的返回值
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}
//创建并生成 app 实例
export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)
  // 获取到 mount 挂载方法
  const { mount } = app
  // 对该方法进行重构，标准化 container，在重新触发 mount 进行挂载
  app.mount = (containerOrSelector: Element | string) => {
    // 1. 字符串选择器转真实 DOM ('#app' -> HTMLDivElement)
    const container = normalizeContainer(containerOrSelector)
    if (!container) return
    // 2. 将传入的组件保存下来
    const component = app._component
    // 3. 【编译器版本特有逻辑】：如果组件没有 render 函数，也没有 template，
    // 就直接把挂载点容器内部的 HTML 当作模板提取出来！
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML
    }
    // 4. 清空容器内容 (挂载前清理 DOM)
    container.innerHTML = ''
    // 5. 拿着真正的 DOM 对象，回掉底层核心的 mount
    const proxy = mount(container)
    return proxy
  }
  return app
}
//标准化 container 容器
function normalizeContainer(container: Element | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    return res
  }
  return container
}
```

```typescript [vnode.ts]
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

//根据 key || type 判断是否为相同类型节点
export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}
```

:::

## 3. 完整流程示例

### 3.1 基础使用示例 (自定义 Canvas 渲染器简写)

```ts
import { createRenderer, h } from '@vue/runtime-core'
const app = new PIXI.Application()
// 异步初始化
await app.init({
  width: 800,
  height: 600,
})
// 添加到页面
document.body.appendChild(app.canvas)

// 1. 自定义平台操作 API
const nodeOps = {
  createElement(type) {
    if (type === 'rect') {
      const rect = new PIXI.Graphics()
      rect.fill(0xff0000)
      rect.rect(0, 0, 100, 100)
      rect.fill()
      return rect
    }
  },
  patchProp(el, key, val) {
    el[key] = val
  },
  insert(el, parent) {
    parent.addChild(el)
  },
  //...其他必选接口
}
// 2. 创建自定义渲染器
const { createApp } = createRenderer(nodeOps)

// 3. 挂载应用
export const App = {
  setup() {
    return {
      x: 100,
      y: 100,
    }
  },
  render() {
    return h('rect', { x: this.x, y: this.y })
  },
}

createApp(App).mount(app.stage)
```

### 3.2 完整流程图

![Logo](/createRenderer.png)

## 4. 总结

`createRenderer` 是 Vue 3 渲染系统的心脏，它体现了极其优秀的框架抽象能力。通过**将“变化检测与比对（Diff）”保留在核心，将“节点增删改（DOM
Ops）”开放给外部**，`createRenderer` 造就了 Vue 的繁荣生态。

- **设计亮点**：闭包配合依赖注入，让长达数千行的 VDOM 渲染逻辑变得纯粹且可复用。
- **性能优化**：在 `createBaseRenderer` 内部结合了块级树（Block Tree）和静态提升（Static Hoisting）的快速路径逻辑。
- **扩展性**：提供了 `createApp` 工厂，使得基于 Vue 语法的各种跨平台框架（如 Taro、UniApp 等基于 Vue 3
  的版本）能够轻松接入，极大地降低了框架底层的开发成本。
