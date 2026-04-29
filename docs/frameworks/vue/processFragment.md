# `processFragment`

在 `Vue 2` 的时代，每个组件的 `<template>` 必须被一个唯一的根元素（如 `<div>`）包裹，这常常导致页面中出现多余的嵌套和无意义的 DOM 节点。
`Vue 3` 彻底打破了这一限制，引入了 **Fragment（片段）** 的概念。它允许组件返回多个平级的根节点，也作为 `v-for` 列表和插槽（Slots）的底层容器。当渲染器遇到类型为 `Fragment` 的虚拟节点时，就会调用 `processFragment` 来处理它。

## 1. `processFragment` 的设计动机

### 1.1 什么是 Fragment？

Fragment 是一个虚拟的容器，它在物理 DOM 树中是**不存在真实标签**的。它的作用仅仅是在 VNode 树层面将一组节点“打包”在一起。

* **多根节点组件**：`<template> <h1>标题</h1> <p>内容</p> </template>`
* **列表渲染**：`v-for="item in list"` 编译后就是一个包含了多个元素的 Fragment。
* **插槽渲染**：`<slot>` 默认会被编译成一个 Fragment。

### 1.2 为什么需要锚点（Anchor）？

试想一下，如果一个 Fragment 包含了 3 个平级的 `<li>`，当我们需要把它整体移动到另一个位置，或者把它从 DOM 中卸载时，渲染器怎么知道从哪里开始、到哪里结束呢？

为了解决这个问题，Vue 引入了 **边界锚点（Boundary Anchors）**：
* **开始锚点 (`n2.el`)**：标志着 Fragment 的起始位置。
* **结束锚点 (`n2.anchor`)**：标志着 Fragment 的结束位置。

在真实 DOM 中，这两个锚点通常是极其轻量的**空文本节点（`""`）**或**注释节点（``）**。

## 2. `processFragment`函数入口

:::code-group
```typescript [renderer.ts]
import {
    normalizeVNode,
} from './componentRenderUtils'

const processFragment = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
) => {
    // 1. 获取或创建 Fragment 的物理边界（开始锚点和结束锚点）
    // 现代 Vue 3 版本为了极致性能，默认使用空文本节点 (hostCreateText('')) 作为锚点
    const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''))!
    const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''))!
    //patchFlag:patch标识 dynamicChildren：动态子节点
    let {patchFlag, dynamicChildren} = n2
    //mount
    if (n1 == null) {
        // 1. 将开始锚点和结束锚点插入到父容器中
        hostInsert(fragmentStartAnchor, container, anchor)
        hostInsert(fragmentEndAnchor, container, anchor)
        // 2. 挂载子节点：注意这里的挂载目标不仅是 container，还指定了 fragmentEndAnchor 作为插入参考点
        // 这样所有的子节点都会被有序地插入到 start 和 end 这两个锚点之间
        mountChildren(
            n2.children as VNodeArrayChildren,
            container,
            fragmentEndAnchor, // <--- 关键参数：结束锚点
        )
    }
    //patch
    else {
        // 靶向更新优化 (Fast Path)：
        // 如果这是一个稳定的 Fragment (如无 v-if/v-for 干扰的多根组件模板)，
        // 它的子节点顺序永远不会变，只需直接遍历更新内部收集到的 dynamicChildren 即可！
        if (
            patchFlag > 0 &&
            patchFlag & PatchFlags.STABLE_FRAGMENT &&
            dynamicChildren &&
            n1.dynamicChildren
        ) {
            patchBlockChildren(
                n1.dynamicChildren,
                dynamicChildren,
                container,
            )
        }
            // 慢速/全量更新路径 (Full Path)：
        // 处理带 Key 列表 (KEYED_FRAGMENT)、无 Key 列表 (UNKEYED_FRAGMENT) 或是手写 h() 函数的 Fragment
        else {
            patchChildren(
                n1,
                n2,
                container,
                fragmentEndAnchor, // <--- 更新时依然需要结束锚点来限制范围
            )
        }
    }
}

const mountChildren = (children, container, anchor) => {
    // 处理 Cannot assign to read only property '0' of string 'xxx'
    if (isString(children)) {
        children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
        const child = (children[i] = normalizeVNode(children[i]))
        patch(null, child, container, anchor)
    }
}
//靶向更新 只更新动态子节点
//如果在编译阶段使用了 Vue 的 `<template>`，编译器会将动态节点展平并收集。此时子节点的更新将无视真实的 DOM 层级深度，直接遍历动态数组。
export function patchBlockChildren(
    oldChildren: VNode[],
    newChildren: VNode[],
    fallbackContainer: RendererElement,
    // ...
) {
    for (let i = 0; i < newChildren.length; i++) {
        const oldVNode = oldChildren[i]
        const newVNode = newChildren[i]
        // 直接精准 Patch 动态节点，跳过所有静态节点的比对！
        patch(
            oldVNode,
            newVNode,
            // ...
        )
    }
}
//对比children
export function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any,
) {
    //新旧的vnode类型
    const prevShapeFlag = n1.ShapeFlag
    const nextShapeFlag = n2.ShapeFlag
    //获取老新vnode的子节点信息
    const c1: any = n1.children
    const c2: any = n2.children
    //vnode节点有文本和数组两种类型，因此比对节点有四种情况
    //1.当新vnode节点是文本类型
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //老vnode节点是数组类型
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //1.把老vnode节点的children清空  2.将新节点设置成c2
            unmountChildren(n1.children)
            //直接设置新vnode节点为c2
            hostSetElementText(container, c2)
        } else {
            //老节点是文本类型,直接将新节点设置成c2
            if (c1 !== c2) {
                //直接设置新vnode节点为c2
                hostSetElementText(container, c2)
            }
        }
    } else {
        //新节点是个文本节点
        //1.直接清空旧节点的值
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(container, '')
            mountChildren(c2, container, parentComponent, anchor)
        } else {
            //新老节点都是数组类型 diff算法 双端对比
            patchKeyedChildren(c1, c2, container, parentComponent, anchor)
        }
    }
}

```

```typescript [componentRenderUtils.ts]
//规范化vnode
export function normalizeVNode(child) {
    if (typeof child === 'object') {
        return cloneIfMounted(child)
    } else {
        return createVNode(Text, null, String(child))
    }
}

//clone VNode
export function cloneIfMounted(child) {
    return child
}
```
:::

## 3. 核心机制深度拆解

### 3.1 物理边界：锚点的魔法

```typescript
const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''))!
const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''))!
```
**为什么要用 `hostCreateText('')` 制造空文本？**
在早期的 Vue 3 或开发环境（DEV）下，Vue 会使用 ``（注释节点）作为锚点以方便开发者调试。但在生产环境（PROD），Vue 3 改用了没有任何内容的文本节点 `createText('')`。因为对于浏览器渲染引擎来说，空文本节点的创建和内存开销比注释节点更小，是名副其实的“零成本占位符”。

### 3.2 挂载阶段的沙盘推演

当执行以下代码时：
```typescript
hostInsert(fragmentStartAnchor, container, anchor)
hostInsert(fragmentEndAnchor, container, anchor)
```
DOM 树里会变成这样（假设插入到 `#app` 中）：
```html
<div id="app">
  [空文本节点] [空文本节点] </div>
```

紧接着执行 `mountChildren`，并且传入了 `fragmentEndAnchor` 作为原生 `insertBefore` 操作的基准点：
```html
<div id="app">
  [空文本节点] <li>第一项</li> <li>第二项</li> [空文本节点] </div>
```
这样，所有的子节点都被完美地“锁”在了两个锚点之间。

### 3.3 卸载（Unmount）如何处理？

虽然 `processFragment` 里没有写卸载逻辑，但我们可以去看看底层的 `unmount` 函数是如何对待 Fragment 的：

```typescript [renderer.ts]
if (shapeFlag & ShapeFlags.SUSPENSE || type === Fragment) {
  // 1. 调用 unmountChildren 卸载两个锚点之间的所有真实节点
  unmountChildren(vnode.children, parentComponent, ...)
  // 2. 移除开始锚点
  hostRemove(vnode.el)
  // 3. 移除结束锚点
  hostRemove(vnode.anchor)
}
```
你看，有始有终。锚点就像一个括号 `( )`，清空括号里面的内容后，再把括号本身删掉，干净利落。

### 3.4 靶向更新：`STABLE_FRAGMENT` 的威力

在 `else` 更新分支中，有一个非常耀眼的条件判断：`patchFlag & PatchFlags.STABLE_FRAGMENT`。

什么是**稳定片段（Stable Fragment）**？
比如你的组件模板长这样：
```html
<template>
  <header>头部</header>
  <main :class="theme">主内容</main>
  <footer>底部</footer>
</template>
```
这个模板编译后是一个 `Fragment`。由于它没有用 `v-if` 或 `v-for` 来改变结构的顺序或数量，它的 DOM 结构是**绝对稳定**的。
对于稳定的 `Fragment`，Vue **绝不会**去调用昂贵的 `patchChildren` 对比新旧节点顺序。它会直接调用 `patchBlockChildren`，精准地跳过 `<header>` 和 `<footer>`，以 $O(1)$ 的速度直接去更新 `<main>` 身上的 `theme` 属性。这就是 Vue 3 能够做到按需更新的底层基石。

## 4. 性能与优化

* **轻量占位**：使用空文本节点作为锚点，开销极小。
* **批量子节点 diff**：直接复用 `patchChildren`，无需特殊 diff 逻辑。
* **无属性开销**：`Fragment` 不需要处理 `props`、`class`、`style` 等，更新成本极低。

## 5. 完整流程图

![Logo](/processFragment.png)

## 6. 总结

`processFragment` 是 Vue 3 渲染器为了突破“单根节点限制”而创造的杰作。

* **化无形为有形**：通过引入 `start` 和 `end` 两个空文本节点作为物理锚点，成功地在无边无际的 DOM 树中为虚拟的 Fragment 划定了明确的势力范围。
* **基石作用**：它是 Vue 3 新特性（多根组件、Teleport 底层基础、v-for 编译器优化）的承载体。
* **极致优化**：结合编译器的 `PatchFlags.STABLE_FRAGMENT`，它让复杂的平级节点树在更新时可以直接绕过 Diff 算法，直达靶向更新的快车道。