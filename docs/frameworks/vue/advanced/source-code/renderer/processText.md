# `processText`

在 Vue 3 的渲染系统中，虚拟 DOM 的处理是非常精细化的。当我们处理的节点不是普通的 HTML 元素（`processElement`），也不是组件（`processComponent`），而是**纯文本节点**（对应的 VNode type 为 `Text` 符号）时，`patch` 函数就会把工作转交给 `processText`。

## 1. `processText` 的作用与设计动机

### 1.1 为什么需要独立的文本节点处理？

在 Vue 2 中，由于组件必须有一个唯一的根节点，纯文本通常会被包裹在一个 `<span>` 或 `<div>` 中。但在 Vue 3 中，引入了 `Fragment`（片段）的概念，允许组件直接返回纯文本，或者返回平级的多个文本/元素组合。

例如：

```html
<template> Hello, {{ name }}! </template>
```

在这个模板中，`Hello, ` 和 `name` 都会被编译为独立的 `Text` 类型的 VNode。`processText` 就是专门用来处理这种“没有任何标签包裹的纯净文本”的挂载与更新。

### 1.2 文本节点的极简生命周期

文本节点是最底层的“叶子节点”，它**没有属性 (Props)**，**没有子节点 (Children)**，**没有生命周期钩子**。因此，它的处理只包含两个极端简单的动作：

- **挂载**：创建一个原生的 Text Node 并插入 DOM。
- **更新**：比对字符串内容，如果变了，直接修改底层 Text Node 的值。

## 2. `processText` 函数入口

:::code-group

```typescript [renderer.ts]
const processText: ProcessFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
) => {
  // 阶段一：初次挂载 (n1 为空)
  if (n1 == null) {
    // 1. 调用 hostCreateText 创建原生文本节点
    // 2. 将生成的原生节点挂载到新 VNode 的 el 属性上 (n2.el = ...)
    // 3. 调用 hostInsert 将节点插入到父容器中
    hostInsert(
      (n2.el = hostCreateText(n2.children as string)),
      container,
      anchor,
    )
  }
  // 阶段二：响应式更新 (n1 存在)
  else {
    // 1. 物理层面的节点复用：新节点直接继承旧节点的原生 DOM 引用
    const el = (n2.el = n1.el!)

    // 2. 内容比对：仅仅只需比较新旧字符串是否相等
    if (n2.children !== n1.children) {
      // 3. 如果发生了改变，调用 hostSetText 更新底层文本
      hostSetText(el, n2.children as string)
    }
  }
}
```

:::

## 3. 核心机制拆解

### 3.1 挂载阶段的连环操作

```typescript
hostInsert((n2.el = hostCreateText(n2.children as string)), container, anchor)
```

- `hostCreateText(...)`：在浏览器环境下，它对应的是 `document.createTextNode(text)`，在内存中凭空捏造一段文本片段。
- `n2.el = ...`：将这个真实的 DOM 文本片段绑定到 VNode 上，这至关重要，因为后续的更新（Patch）必须依赖这个引用找到真实的物理节点。
- `hostInsert(el, ...)`：在浏览器环境下，它对应的是 `parent.insertBefore(el, anchor)`，正式把文本片段挂到页面上。

### 3.2 更新阶段的极致复用

```typescript
const el = (n2.el = n1.el!)
if (n2.children !== n1.children) {
  hostSetText(el, n2.children as string)
}
```

- Vue 发现这是一个旧文本节点的更新，它做的第一件事就是把 `n1.el` 抢过来给 `n2.el` 用。
- 比较内容，如果 `Hello` 变成了 `World`，才会去调接口。
- `hostSetText` 底层调用的到底是什么？在浏览器 `nodeOps` 中，它调用的是 `node.nodeValue = text`（而不是 `innerHTML` 或 `textContent`），这是浏览器操作纯文本节点内容性能最高的方式。

## 4. 性能与优化

- **节点复用**：更新时直接复用已有的真实文本节点，避免创建和插入开销。
- **内容比较**：使用 !== 严格比较字符串，变化时才调用 hostSetText。
- **无嵌套**：文本节点无子节点，无需递归 diff。

## 5. 完整流程图

![Logo](/img/processText.png)

## 6. 总结

`processText` 是 Vue 3 渲染器中最简单，也是最纯粹的处理函数。它没有递归，没有 `PatchFlag` 判定，甚至没有属性的遍历。它忠实地扮演着文本搬运工的角色，通过原生的 `createTextNode` 和 `nodeValue`，保障了 Vue 在处理细碎的文本片段时能够保持极低的性能损耗。
