# `processElement`

`processElement` 是 Vue 3 渲染器（Renderer）体系中处理**普通 DOM 元素**（`ShapeFlags.ELEMENT`）的核心路由函数。当虚拟 DOM 的 `patch` 过程遇到 HTML 或 SVG 标签时，会将执行权交接给它。它负责调度元素的**初次挂载（Mount）**与**响应式更新（Patch/Diff）**。

## 1. `processElement` 的作用与设计动机

### 1.1 为什么需要 `processElement`？

- **职责单一与分发**：`patch` 函数是一个庞大的入口，`processElement` 将“普通元素”的处理逻辑单独抽离，使代码结构更清晰。
- **生命周期调度**：负责在正确的时机触发 `beforeMount`、`mounted`、`beforeUpdate`、`updated` 等 VNode 钩子和自定义指令钩子。
- **跨平台桥梁**：内部大量调用 `hostCreateElement`、`hostPatchProp`、`hostInsert` 等外部注入的 API，真正实现了虚拟 DOM 与宿主平台（如浏览器 DOM）的解耦。

### 1.2 挂载（Mount）与更新（Patch）的简单对比

| 特性 | `mountElement` (初次挂载) | `patchElement` (更新比对)               |
|------|-------------------------|-------------------------------------|
| 触发条件 | 旧节点 `oldVNode` 为 `null` | 旧节点 `oldVNode` 存在且类型与 `newVNode` 一致 |
| 核心目标 | 创建真实节点，处理属性，插入文档 | 复用真实节点，最小化比对和更新属性/子节点               |
| 性能开销 | 较高（涉及 DOM 创建和布局绘制） | 较低（利用 PatchFlag 和 Block Tree 靶向更新）  |
| 依赖底层操作 | `createElement`, `insert`, `setElementText` | `patchProp`, `setElementText`       |

## 2. 核心实现：路由分发

### 2.1 `processElement` 函数入口

`processElement` 的实现非常精简，本质上是一个基于旧节点存在与否的 `if-else` 分支路由器。

:::code-group
```typescript [renderer.ts]
//oldVNode：旧节点, newVNode：新节点, container：容器, anchor：锚点
const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
        // 挂载操作
        mountElement(newVNode, container, anchor)
    } else {
        // 更新操作
        patchElement(oldVNode, newVNode)
    }
}
```
:::

## 3. 挂载与更新的核心逻辑

### 3.1 初次挂载：`mountElement`

`mountElement` 负责将虚拟节点无中生有变为真实的物理节点。

:::code-group
```typescript [renderer.ts]
const mountElement = (
    vnode, container, anchor
    // ... 其他参数
) => {
    const {type, props, shapeFlag, dirs} = vnode
    
    //1. 创建真实 DOM 节点 (调用注入的 nodeOps)
    const el = (vnode.el = hostCreateElement(type))
    
    // 2. 处理子节点 (Children)
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 设置 文本子节点
        hostSetElementText(el, vnode.children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 设置 Array 子节点
        mountChildren(vnode.children, el, anchor)
    }
    
    // 3. 处理 Props (如 class, style, event)
    if (props) {
        // 遍历 props 对象
        for (const key in props) {
            hostPatchProp(el, key, null, props[key])
        }
    }

    // 触发 beforeMount 钩子
    if (dirs) invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount')

    // 4. 将生成的真实节点插入到父容器中
    hostInsert(el, container, anchor)

    // 触发 mounted 钩子 (推入后置调度队列)
    if (dirs || props?.onVnodeMounted) {
        queuePostRenderEffect(() => {
            // 执行 mounted 逻辑...
        }, parentSuspense)
    }
}
//挂载子节点
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
```
:::

### 3.2 节点更新：`patchElement`

当数据发生变化引发重渲染时，`patchElement` 负责高效地比对新旧节点，并应用最小化更新。

:::code-group
```typescript [renderer.ts]
const EMPTY_OBJ={}
const patchElement = (
    n1: VNode,
    n2: VNode,
    parentComponent: ComponentInternalInstance | null,
    // ... 其他参数  
    //optimized:是否使用编译优化
) => {
    // 1. 物理层面的节点复用！这是 VDOM Diff 的基石
    const el = (n2.el = n1.el!)

    //patchFlag：标记动态属性类型，运行时仅更新变化的属性。
    //dynamicChildren：Block 树收集的动态子节点列表，更新时直接遍历该数组，完全跳过静态部分。
    let {patchFlag, dynamicChildren} = n2
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    // 2. 更新子节点 (Children) 
    if (dynamicChildren) {
        // 【快速路径】：由编译器生成的 Block Tree，只更新收集到的动态子节点
        patchBlockChildren(n1.dynamicChildren!, dynamicChildren, el, ...)
    } else if (!optimized) {
        // 【慢速路径】：全量 Diff 算法
        patchChildren(n1, n2, el, null, ...)
    }

    // 3. 更新属性 (Props)
    if (patchFlag > 0) {
        // 利用 patchFlag 进行靶向更新
        if (patchFlag & PatchFlags.FULL_PROPS) {
            // 包含动态 key 的属性，全量更新
            patchProps(el, n2, oldProps, newProps, ...)
        } else {
            // 精准更新 class
            if (patchFlag & PatchFlags.CLASS) {
                if (oldProps.class !== newProps.class) {
                    hostPatchProp(el, 'class', null, newProps.class, isSVG)
                }
            }
            // 精准更新 style
            if (patchFlag & PatchFlags.STYLE) {
                hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG)
            }
            // 精准更新其它动态属性 (如 :id="dynamicId")
            if (patchFlag & PatchFlags.PROPS) {
                const propsToUpdate = n2.dynamicProps!
                for (let i = 0; i < propsToUpdate.length; i++) {
                    const key = propsToUpdate[i]
                    const prev = oldProps[key]
                    const next = newProps[key]
                    if (next !== prev || key === 'value') {
                        hostPatchProp(el, key, prev, next, ...)
                    }
                }
            }
        }
        // 精准更新文本内容
        if (patchFlag & PatchFlags.TEXT) {
            if (n1.children !== n2.children) {
                hostSetElementText(el, n2.children as string)
            }
        }
    } else if (!optimized && dynamicChildren == null) {
        // 手写 h() 函数创建的节点，没有编译优化，只能全量比对属性
        patchProps(el, n2, oldProps, newProps, ...)
    }
}
//比对新旧props
//1.新老props不相同且都有值，直接更新props
//2.新props为null和undefined，直接删除老的props
//3.新props里面没有老props的某个值，直接把这个值从props里面删除
function patchProps(el: any, oldProps: any, newProps: any) {
    //老的props和新的props相等不需要去比对
    if (oldProps !== newProps) {
        //遍历新的props，当新旧props不一致就调用hostPatchprop方法更新props
        for (const key in newProps) {
            const prevProp = oldProps[key]
            const nextProp = newProps[key]
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp)
            }
        }
        //老的props不是空对象才需要遍历老的props
        if (oldProps !== EMPTY_OBJ) {
            //遍历老的props，当老props的值不在新的props中，说明这个props需要被删除
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null)
                }
            }
        }
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
//挂载children
export function mountChildren(
    children: any,
    container: any,
    parentComponent: any,
    anchor: any,
) {
    //vnode  多个虚拟节点需要判断子节点是否是组件还是element
    children.forEach((vnode: any) => {
        //再次判断子节点是否是组件还是element
        patch(null, vnode, container, parentComponent, anchor)
    })
}

//卸载children节点
function unmountChildren(children: any) {
    //遍历children获取每个子节点的根节点，然后调用hostRemove方法删除这些节点
    for (let i = 0; i < children.length; i++) {
        const el = children[i].el
        //remove
        hostRemove(el)
    }
}

//diff算法 后续讲解
export function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    parentAnchor: any,
){
    ...
}
```
:::

## 4. 完整流程示例

### 4.1 基础运行流程

```ts
import { h, render } from 'vue'

const container = document.getElementById('app')

// 1. 初次挂载 (Trigger mountElement)
const vnode1 = h('div', { id: 'box' }, 'Hello Vue')
render(vnode1, container)
// 发生：hostCreateElement -> hostSetElementText -> hostPatchProp -> hostInsert

// 2. 响应式更新 (Trigger patchElement)
const vnode2 = h('div', { id: 'box', class: 'active' }, 'Hello Vue 3')
// render 内部比较 vnode1 和 vnode2 类型相同，进入 patchElement
render(vnode2, container) 
// 发生：复用 div 引用 -> patchChildren (更新文本) -> patchProps (新增 class)
```

### 4.2 完整流程图

![Logo](/processElement.png)

## 5. 更新策略对比：快速路径 vs 慢速路径

在 `patchElement` 中，Vue 3 的性能护城河体现在针对编译优化的分支判断上：

| 维度 | 无编译优化 (手写 `h` 函数 / JSX) | 有编译优化 (Vue 模板 `<template>`) |
|----------|-------|-------------|
| **子节点比对 (`children`)** | 调用 `patchChildren` 执行全量树遍历或复杂的双端/快速 Diff 算法 | 命中 `dynamicChildren`，调用 `patchBlockChildren`，直接以 $O(1)$ 数组遍历方式更新动态节点 |
| **属性比对 (`props`)** | 调用 `patchProps` 遍历比对 `oldProps` 和 `newProps` 的每一个键值对 | 根据 `patchFlag` 位运算命中（如 `PatchFlags.CLASS`），直接调用 `hostPatchProp` 操作特定属性 |
| **静态节点处理** | 每次渲染都参与比对 | 编译器自动提升，跳过比对阶段 |


## 6. 性能优化要点

* **静态提升 + Block 树**：`dynamicChildren` 使得更新时只遍历动态节点，极大减少 diff 范围。
* **靶向属性更新**：`patchFlag` 精确指示哪些属性需要检查，避免了无意义的属性对比。
* **复用 DOM 元素**：更新时直接使用旧元素的 `el`，避免重新创建和插入，开销最小。
* **事件缓存**：内联事件处理函数被缓存后，传递给子组件的 `props` 引用稳定，减少子组件重渲染。

## 7. 总结

| 模块/函数 | 职责 | 关键优化 |
|-----------|------|----------|
| `processElement` | 根据是否有旧 VNode 分流挂载或更新 | 类型分流，逻辑清晰 |
| `mountElement` | 创建真实元素、挂载子节点、设置属性、插入容器 | 利用 `shapeFlag` 快速判断子节点类型 |
| `patchElement` | 复用 DOM 元素，更新属性和子节点 | `patchFlag` + `dynamicChildren` 实现靶向更新 |
| `patchChildren` | 处理子节点数组的 diff | 快速 Diff 算法 |
| `nodeOps` 协作 | 调用平台相关的节点操作方法 | 解耦平台实现 |
