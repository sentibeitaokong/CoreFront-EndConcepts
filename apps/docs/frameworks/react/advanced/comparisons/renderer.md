# 渲染器与宿主平台

## 1. React Reconciler

React Reconciler 与宿主渲染器分离，`react-dom`、React Native 等渲染器通过宿主配置完成节点操作：

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

  // === 属性操作 ===
  prepareUpdate(instance, type, oldProps, newProps) {
    // 返回属性差异（用于 updatePayload）
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // 应用属性变更到真实 DOM
  },

  // === 事件系统 ===
  // DOM 平台使用合成事件（SyntheticEvent）委托到根节点
  // React Native 直接绑定原生事件

  // === 调度 ===
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  shouldYield: shouldYieldToHost, // 时间切片判断
}
```

```javascript
// React DOM commit 阶段的简化流程
function commitRoot(root) {
  const finishedWork = root.finishedWork // WIP 树的根（已完成协调）

  // mutation 子阶段：应用 DOM 变更
  // 遍历 finishedWork 及其子树，根据 flags 执行操作
  commitMutationEffects(root, finishedWork)

  // 切换 Fiber 树指针：WIP 变为 current
  root.current = finishedWork

  // layout 子阶段：执行 useLayoutEffect
  commitLayoutEffects(finishedWork, root)
}
```

## 2. Vue 3 渲染器

Vue 的 `runtime-core` 同样保持平台无关，`runtime-dom` 通过 `nodeOps` 和 `patchProp` 提供 DOM 操作：

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
}

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

## 3. 自定义渲染器对比

```javascript
// React：直接使用 react-reconciler 包构建自定义渲染器
import Reconciler from 'react-reconciler'

const MyRenderer = Reconciler(HostConfig) // 实现 Host Config 接口

// Vue 3：使用 createRenderer 构建自定义渲染器
import { createRenderer } from '@vue/runtime-core'

const { render, createApp } = createRenderer({
  createElement(type) {
    /* ... */
  },
  insert(child, parent, anchor) {
    /* ... */
  },
  patchProp(el, key, prevValue, nextValue) {
    /* ... */
  },
  // ... 其他 nodeOps
})
```

| 维度               | React                        | Vue 3                                    |
| ------------------ | ---------------------------- | ---------------------------------------- |
| **平台无关核心**   | `react-reconciler`           | `@vue/runtime-core`                      |
| **DOM 渲染器**     | `react-dom`                  | `@vue/runtime-dom`                       |
| **宿主操作抽象**   | Host Config                  | Renderer Options、`nodeOps`、`patchProp` |
| **特殊跨容器节点** | Portal                       | Teleport                                 |
| **自定义渲染器**   | 使用 `react-reconciler` 构建 | 使用 `createRenderer()` 构建             |
