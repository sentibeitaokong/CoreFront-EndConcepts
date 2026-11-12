# React Reconciler 与 Vue 3 渲染器：宿主抽象与跨平台渲染的分野

前端框架要实现「**一套核心逻辑、多端渲染**」，就必须把「**UI 如何计算**」与「**UI 如何落到宿主**」拆开。React 和 Vue 3 都做到了这一点，但抽象的形状和控制方向截然不同：React 把 **协调器（Reconciler）** 与 **渲染器（Renderer）** 彻底分离，协调器只负责「**记账**」——算出哪些节点要增、删、改，打上 `flags` 标记，然后通过一份 **Host Config** 接口在 Commit 阶段「**统一施工**」；Vue 3 则把渲染逻辑集中在 `runtime-core`，通过 **`nodeOps` + `patchProp`** 一组可插拔的宿主操作，在 `patch` 过程中「**边比较、边施工**」。前者是被动的、声明式的宿主接口，后者是主动的、内联的宿主调用。

## 1. [React Reconciler：协调器与渲染器的分离](../core-design/rendererArchitecture.md)

### 1.1 分层架构：协调器驱动，宿主被动响应

React 的核心是 `react-reconciler`，它**不依赖任何具体平台**，只负责遍历 Fiber 树、执行协调算法、产出副作用清单。真正的 DOM / Native / 终端操作被抽象成一份 **Host Config**——一组函数，由 `react-dom`、`react-native` 等渲染器按宿主能力各自实现。

```javascript
// React 分层：协调器（平台无关） + 渲染器（平台相关）
react (组件模型)
  └─ react-reconciler (协调器：diff + 调度 + 记账，平台无关)
       └─ react-dom / react-native / ink / react-pdf ... (渲染器：实现 Host Config)
```

这种「**协调器驱动、宿主被动响应**」的模型意味着：Render 阶段由协调器决定改什么，并调用 `createInstance`、`prepareUpdate` 等**不产生可见 DOM 变更**的 Host Config 能力，把结果记到 `flags`；真正的插入、更新、删除集中在 Commit 阶段，由协调器逐条交给 Host Config 执行。宿主对协调器是「**只提供能力、不参与决策**」的从属角色。

### 1.2 Host Config：宿主配置接口

Host Config 是 React 渲染器的「**能力清单**」，涵盖节点操作、属性操作、事件、调度与文本处理等方方面面：

```javascript
// React Host Config — 渲染器的配置接口（部分，简化）
// react-dom 和 react-native 通过这些接口接入 React 协调器
const HostConfig = {
  // === 节点操作 ===
  createInstance(type, props, rootContainer, hostContext) {
    return document.createElement(type) // DOM 平台
    // React Native: return new ReactNativeComponent(type)
  },
  createTextInstance(text, rootContainer, hostContext) {
    return document.createTextNode(text)
  },
  appendChild(parent, child) {
    parent.appendChild(child)
  },
  removeChild(parent, child) {
    parent.removeChild(child)
  },
  insertBefore(parent, child, beforeChild) {
    parent.insertBefore(child, beforeChild)
  },
  appendInitialChild(parent, child) {
    parent.appendChild(child) // 初次挂载用
  },

  // === 属性操作 ===
  prepareUpdate(instance, type, oldProps, newProps) {
    // 返回属性差异（updatePayload），供 commitUpdate 使用
    return diffProperties(instance, type, oldProps, newProps)
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // 应用属性变更到真实 DOM
    updateProperties(instance, updatePayload, type, oldProps, newProps)
  },
  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText
  },
  resetTextContent(instance) {
    instance.textContent = ''
  },
  shouldSetTextContent(type, props) {
    // 判断子节点是否纯文本，决定能否走文本快速路径
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    )
  },

  // === 事件系统 ===
  // DOM 平台使用合成事件（SyntheticEvent）委托到根节点
  // React Native 直接绑定原生事件

  // === 调度（供协调器的时间切片使用） ===
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  shouldYield: shouldYieldToHost, // 时间切片判断
  getCurrentTime: () => performance.now(),

  // === 能力开关 ===
  supportsMutation: true, // 是否支持直接修改 DOM（web 为 true）
  supportsPersistence: false, // 是否走持久化（React Native 为 true）
  supportsHydration: true, // 是否支持水合（SSR）
  isPrimaryRenderer: true, // 是否为主渲染器（一个页面可挂多个）
}
```

### 1.3 Commit 阶段：变更型宿主操作的唯一出口

协调器在 Render 阶段产出 `flags` 副作用标记，真正的插入、更新、删除等**变更型宿主操作只发生在 Commit 阶段**，且严格按「**Before Mutation → Mutation → Layout**」三个子阶段依次执行。注意 Render 阶段并非完全不调用 Host Config：`createInstance`、`prepareUpdate` 等非变更接口会在协调过程中执行，但节点尚未插入文档。

```javascript
// React DOM commit 阶段的简化流程
function commitRoot(root) {
  const finishedWork = root.finishedWork // WIP 树的根（已完成协调）

  // ① Before Mutation 子阶段：读取旧 DOM（如 getSnapshotBeforeUpdate）
  commitBeforeMutationEffects(root, finishedWork)

  // ② Mutation 子阶段：应用 DOM 变更（增删改、插入、移动）
  commitMutationEffects(root, finishedWork)

  // 切换 Fiber 树指针：WIP 变为 current
  root.current = finishedWork

  // ③ Layout 子阶段：执行 useLayoutEffect（DOM 已更新、绘制前）
  commitLayoutEffects(finishedWork, root)
}
```

这种「**先记账、后施工、一次性批量落盘**」的模型，让 DOM 变更具备原子性：要么全部应用，要么（在并发模式下）整棵树被打断重来，宿主永远只看到**已经确定的结果**，不会出现半成品的中间态。

### 1.4 事件系统：合成事件与根节点委托

React 的事件系统独立于原生 DOM 事件。它通过**事件委托**把监听器挂到根容器上，用 **SyntheticEvent** 统一包装原生事件，并为不同事件分配优先级：

```javascript
// React 合成事件与事件优先级（简化）
// React 17+：事件委托到根容器（而非 document），便于多 React 实例共存
function listenToAllSupportedEvents(rootContainer) {
  allNativeEvents.forEach(eventName => {
    rootContainer.addEventListener(eventName, dispatchEvent)
  })
}

// 事件优先级 → Lane 的映射：不同事件触发不同优先级的更新
const discreteEventPriorityToLaneMap = {
  // 离散事件（click / keydown）
  [DiscreteEventPriority]: SyncLane, // → 同步、不可中断
}
const continuousEventPriorityToLaneMap = {
  // 连续事件（mousemove / scroll）
  [ContinuousEventPriority]: InputContinuousLane,
}
const defaultEventPriorityToLaneMap = {
  // 默认事件
  [DefaultEventPriority]: DefaultLane,
}
```

合成事件带来的好处是**跨浏览器一致性**：抹平了 `event.target`、阻止冒泡等 API 的浏览器差异。代价则是与原生事件体系解耦，需要额外的心智去理解「**合成事件与原生事件监听器之间的执行顺序**」。

### 1.5 特殊跨容器节点：Portal

`createPortal` 允许把子节点渲染到**组件树之外**的 DOM 容器中，是突破「**层级 = 位置**」约束的逃生舱：

```jsx
import { createPortal } from 'react-dom'

function Modal({ children }) {
  // 把 modal 内容渲染到 body 下，脱离当前组件的 DOM 层级
  return createPortal(children, document.body)
}
```

在协调器中，Portal 对应一个特殊类型的 Fiber，其子树的 `flags` 与状态计算仍挂在原组件树上，但 Commit 阶段的宿主插入操作指向了**目标容器**，从而做到「**逻辑归属与 DOM 归属分离**」。

### 1.6 自定义渲染器

因为 Host Config 与协调器完全解耦，任何人都可以基于 `react-reconciler` 实现一套新宿主：

```javascript
// React：直接使用 react-reconciler 包构建自定义渲染器
import Reconciler from 'react-reconciler'

const MyRenderer = Reconciler({
  createInstance(type, props) {
    /* 创建宿主节点 */
  },
  createTextInstance(text) {
    /* 创建文本节点 */
  },
  appendChild(parent, child) {
    /* 插入子节点 */
  },
  removeChild(parent, child) {
    /* 移除子节点 */
  },
  prepareUpdate(instance, type, oldProps, newProps) {
    /* 属性 diff */
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    /* 应用属性 */
  },
  // ... 其余 Host Config 方法
})

// 现实中的宿主：react-native（原生）、ink（终端 CLI）、
// react-three-fiber（WebGL）、react-pdf（PDF）、react-email（邮件）
```

## 2. [Vue 3 渲染器：runtime-core 与 runtime-dom 的分层](../../../vue/advanced/source-code/renderer/createRenderer.md)

### 2.1 分层架构：核心渲染器 + 可插拔宿主操作

Vue 3 同样把**核心渲染逻辑**与**宿主操作**分层，但抽象方式不同：`runtime-core` 内含完整的渲染器（`patch`、`diff`、组件生命周期），它不直接操作 DOM，而是通过 **`nodeOps`（节点操作）+ `patchProp`（属性操作）** 两组可插拔函数接入宿主。

```javascript
// Vue 3 分层：核心渲染器（平台无关） + 宿主操作（平台相关）
@vue/reactivity (响应式)
@vue/runtime-core (渲染器：patch/diff/组件实例，平台无关)
  └─ @vue/runtime-dom (提供 nodeOps + patchProp，面向浏览器)
       └─ 自定义渲染器：createRenderer({ nodeOps, patchProp })
```

与 React「**记账后统一施工**」不同，Vue 3 的 `patch` 是**边比较边调用宿主 API**——`nodeOps.insert`、`patchProp` 在 diff 过程中即时执行，DOM 变更即刻落盘，不存在一个独立的「提交」阶段。

### 2.2 nodeOps：DOM 节点操作

`nodeOps` 是 Vue 3 对「**宿主节点基本操作**」的抽象，`runtime-dom` 用它封装浏览器 DOM API：

```javascript
// Vue 3 DOM 平台的 nodeOps（简化）
const nodeOps = {
  createElement: tag => document.createElement(tag),
  createText: text => document.createTextNode(text),
  createComment: text => document.createComment(text),

  setElementText: (el, text) => {
    el.textContent = text
  },
  setText: (node, text) => {
    node.nodeValue = text
  },

  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) parent.removeChild(child)
  },

  parentNode: node => node.parentNode,
  nextSibling: node => node.nextSibling,
  querySelector: selector => document.querySelector(selector),
  cloneNode: el => el.cloneNode(true),
}
```

### 2.3 patchProp：属性与事件的打补丁

`patchProp` 负责「**给宿主节点打补丁**」——根据属性 key 的类型分发到 class、style、事件或普通属性的专门处理分支：

```javascript
// Vue 3 DOM 平台的 patchProp（简化）
const patchProp = (el, key, prevValue, nextValue) => {
  // 事件处理
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase()
    // 使用 invoker 缓存机制减少 addEventListener 调用
    patchEvent(el, eventName, prevValue, nextValue)
    return
  }
  // class 特殊处理
  if (key === 'class') {
    el.className = nextValue || ''
    return
  }
  // style 特殊处理
  if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
    return
  }
  // 普通属性
  if (nextValue == null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, nextValue)
  }
}
```

事件处理的巧妙之处在 `patchEvent`：它把监听器包装成**稳定的 invoker**，事件回调更新时只替换 `invoker.value`，而非反复 `removeEventListener` / `addEventListener`：

```javascript
// patchEvent — invoker 缓存：回调变了只改 value，不重新绑定（简化）
/**
 * 比较并更新 DOM 元素的事件监听器
 * @param {HTMLElement} el - 目标 DOM 元素
 * @param {string} name - 原始事件名，例如 "onClick"
 * @param {Function|null} prevValue - 旧的事件回调
 * @param {Function|null} nextValue - 新的事件回调
 */
function patchEvent(el, name, prevValue, nextValue) {
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[name]

  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue // 复用：只替换回调引用
  } else {
    if (nextValue) {
      const invoker = (invokers[name] = createInvoker(nextValue))
      el.addEventListener(name, invoker) // 首次绑定
    } else if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[name] = undefined
    }
  }
}
```

### 2.4 patch 流水线：按 VNode 类型分发

Vue 3 渲染器的核心是 `patch` 函数，它按 VNode 的 `type` 与 `shapeFlag` 分发到不同的处理分支：

```javascript
// Vue 3 patch 函数的核心逻辑（简化）
function patch(oldVNode, newVNode, container) {
  // 1. 类型或 key 不同 → 直接卸载旧节点，挂载新节点
  if (
    oldVNode &&
    (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key)
  ) {
    unmount(oldVNode)
    oldVNode = null // 使后续逻辑走挂载分支
  }

  const { type, shapeFlag } = newVNode
  switch (type) {
    case Text: // 文本节点
      processText(oldVNode, newVNode)
      break
    case Comment: // 注释节点
      processCommentNode(oldVNode, newVNode)
      break
    case Fragment: // Fragment
      processFragment(oldVNode, newVNode)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(oldVNode, newVNode) // 普通元素
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(oldVNode, newVNode) // 组件
      }
  }
}
```

### 2.5 特殊跨容器节点：Teleport

`Teleport` 是 Vue 3 内置的「**传送**」组件，能把内容渲染到指定的目标容器，与 React 的 Portal 对应：

```vue
<template>
  <Teleport to="body">
    <div class="modal">这是一个弹窗</div>
  </Teleport>
</template>
```

渲染器在 `processTeleport` 分支中处理它：组件的响应式逻辑仍留在原组件树上，但 DOM 挂载被重定向到 `to` 指向的目标节点。

### 2.6 自定义渲染器

Vue 3 提供 `createRenderer`，传入自定义的 `nodeOps` 与 `patchProp` 即可得到一套新宿主渲染器：

```javascript
// Vue 3：使用 createRenderer 构建自定义渲染器
import { createRenderer } from '@vue/runtime-core'

const { render, createApp } = createRenderer({
  patchProp(el, key, prevValue, nextValue) {
    /* 属性补丁 */
  },
  insert(child, parent, anchor) {
    /* 插入 */
  },
  remove(child) {
    /* 移除 */
  },
  createElement(type) {
    /* 创建元素 */
  },
  createText(text) {
    /* 创建文本 */
  },
  createComment(text) {
    /* 创建注释 */
  },
  setText(node, text) {
    /* 设置文本 */
  },
  setElementText(el, text) {
    /* 设置元素文本 */
  },
  parentNode(node) {
    /* 父节点 */
  },
  nextSibling(node) {
    /* 兄弟节点 */
  },
  // ... 其余 RendererOptions
})

// 现实中的宿主：@vue/runtime-test（测试）、uni-app（小程序）、
// weex（原生）、canvas 渲染器等
```

## 3. 对比总结

### 3.1 共同的抽象原则

核心渲染逻辑只声明“**我需要哪些宿主能力**”，平台包负责实现并注入；核心不 import 任何 DOM API，也不假设宿主节点一定是 `Element`。节点句柄对核心是**不透明**的，核心只通过 `create` / `insert` / `remove` / `parentNode` 等原语操作它。

[width(15,40,45)]

| 抽象原则           | React 的体现                                                      | Vue 3 的体现                                                        |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| **依赖倒置**       | `react-reconciler` 只依赖 Host Config，由 `react-dom` 提供实现    | `runtime-core` 只依赖 RendererOptions，由 `runtime-dom` 注入        |
| **宿主节点不透明** | HostInstance 由渲染器定义，协调器不直接访问 DOM                   | `nodeOps` 返回宿主节点，渲染器通过 `el` 持有，不关心具体类型        |
| **操作原语化**     | `createInstance`、`appendChild`、`insertBefore`、`removeChild` 等 | `createElement`、`insert`、`remove`、`parentNode`、`nextSibling` 等 |
| **属性更新接口**   | `prepareUpdate` 计算差异，`commitUpdate` 应用差异                 | `patchProp` 按 class / style / 事件 / 普通属性分支处理              |
| **自定义宿主**     | 基于 `react-reconciler` + Host Config 构建                        | 基于 `createRenderer({ nodeOps, patchProp })` 构建                  |
| **可选能力**       | `supportsMutation` / `supportsPersistence` / `supportsHydration`  | `createHydrationRenderer`、`insertStaticContent`、`setScopeId`      |
| **跨容器节点**     | Portal 是特殊 Fiber，逻辑归属不变                                 | Teleport 是内置组件，`processTeleport` 重定向挂载                   |

所以两者都能做到“**核心算法不改，换一套宿主实现就能跑在 DOM / Native / 测试 / Canvas 上**”。

### 3.2 具体区别

[width(13,43,44)]

| 区别点           | React Reconciler                                                                        | Vue 3 渲染器                                                           |
| ---------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **解耦边界**     | 协调器与渲染器之间：reconciler 产出 `flags`，renderer 执行 Host Config                  | 渲染器内部：`patch` / diff 与 `nodeOps` / `patchProp` 之间             |
| **谁负责 diff**  | 协调器负责 Fiber 树 diff，渲染器只提供节点和属性原语                                    | `runtime-core` 的 `patch` 负责 VNode diff，宿主只提供操作原语          |
| **接口形状**     | Host Config 是完整能力契约：创建、插入、删除、属性 diff、文本、水合、调度、渲染模式开关 | RendererOptions 是精简操作集合：`nodeOps` + `patchProp` + 少量可选钩子 |
| **调用方向**     | 宿主被动：Render 阶段只做非变更型调用，变更操作集中在 Commit                            | 渲染器主动：`patch` 过程中直接调用 `insert` / `patchProp`              |
| **落盘与原子性** | Commit 三子阶段集中应用；WIP 可丢弃，正常路径下一次性落盘                               | 边比较边修改，无独立 Commit；出错时缺少 WIP 式回滚                     |
| **属性 diff**    | `prepareUpdate` 先算 payload，`commitUpdate` 再应用                                     | `patchProp` 直接比较新旧值并应用，class / style / 事件内联分支         |
| **文本处理**     | 独立文本实例：`createTextInstance`、`commitTextUpdate`                                  | `createText` / `setText` / `setElementText`，文本也是宿主节点          |
| **事件系统**     | DOM 渲染器单独实现合成事件与根节点委托，不放进 Host Config                              | `patchProp` 处理 `on*`，用 invoker 缓存复用监听器                      |
| **自定义门槛**   | 需要实现完整 Host Config，方法多且带渲染模式开关                                        | 只需提供 `nodeOps` + `patchProp`，接入面更小                           |
| **扩展能力**     | `supportsHydration`、`supportsPersistence`、`isPrimaryRenderer` 等                      | `createHydrationRenderer`、`insertStaticContent`、`setScopeId`         |

**边界如何体现**

- **React**：Render 阶段调用 `createInstance` / `prepareUpdate` 等非变更接口，变更型操作（如 `appendChild` / `commitUpdate`）集中在 Commit 阶段；DOM 实现由 `react-dom` 提供。边界在**协调器 / 渲染器**之间。
- **Vue**：`patch` 在 diff 过程中主动调用 `runtime-dom` 通过 `createRenderer(options)` 传入的 `insert` / `patchProp`。边界在**渲染算法 / 宿主操作**之间。
- 换宿主时，React 替换 renderer / Host Config，Vue 替换 `nodeOps` + `patchProp`。

从接口厚度看：

- **React 的抽象更“厚”**：Host Config 覆盖节点、文本、属性、水合、持久化、调度和渲染模式，核心对宿主的假设最少，但渲染器实现成本最高。
- **Vue 的抽象更“薄”**：核心接口是节点原语和属性补丁，另有少量可选钩子；接入快、核心更主动。代价是它默认采用可变节点模型，`patch` 直接落盘，所以没有 React 那样的 WIP 回滚空间。
- **一句话总结**：两者都做了**核心与宿主解耦**，但 React 把边界放在**协调器 / 渲染器**之间，Vue 把边界放在**渲染算法 / 宿主操作**之间；React 用一份厚接口和 Render / Commit 两阶段换原子性，Vue 用一份薄接口换接入成本和直接性。
