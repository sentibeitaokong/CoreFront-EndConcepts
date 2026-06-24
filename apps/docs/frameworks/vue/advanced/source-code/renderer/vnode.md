# `VNode`

`VNode`（Virtual Node，虚拟节点）是 Vue 3 渲染管线和框架底层的核心基本单元。与直接操作原生 DOM 不同，Vue 通过构建一棵由 `VNode` 组成的虚拟 DOM 树来描述视图状态，并利用渲染器（Renderer）将虚拟节点映射为真实的 DOM 元素。

## 1. `VNode` 的作用与设计动机

### 1.1 为什么需要 `VNode`？

- **跨平台抽象**：`VNode` 是纯净的 JavaScript 对象，不耦合具体的浏览器 API。这使得同一份 `VNode` 可以被不同的渲染器解析，渲染到 Web、移动端（Weex/Native）、小程序甚至终端。
- **性能优化**：直接频繁操作原生 DOM 代价极其昂贵。`VNode` 结合 Diff 算法，可以在内存中比对新旧状态，计算出最小的 DOM 操作集合（Patch），从而减少重绘与回流。
- **承载编译期优化**：Vue 3 的编译器会在生成的 `VNode` 上打上静态标记（`PatchFlags`）和结构标记（`ShapeFlags`），指导运行时进行靶向更新。

### 1.2 `VNode` 与真实 DOM 的简单对比

| 特性     | `VNode` (虚拟节点)             | 真实 DOM 节点                             |
| -------- | ------------------------------ | ----------------------------------------- |
| 数据结构 | 轻量级原生 JavaScript 对象     | 庞大且复杂的 C++ 对象（包含大量无用属性） |
| 环境依赖 | 跨平台，无环境依赖             | 强绑定浏览器环境                          |
| 更新成本 | 内存计算，极快                 | 触发浏览器渲染引擎重绘/回流，昂贵         |
| 扩展性   | 高（可自定义属性和组件实例）   | 低（受限于 W3C 标准）                     |
| 框架角色 | Compiler 和 Runtime 沟通的桥梁 | 最终的渲染产物                            |

## 2. 核心实现：`VNode` 结构与创建

### 2.2 `h` 函数入口

开发者常用的 `h()` 函数其实是对 `createVNode` 的封装。

:::code-group

```typescript [h.ts]
import { isArray, isObject } from '@vue/shared'
import { createVNode, isVNode, VNode } from './vnode'

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  // 获取用户传递的参数数量
  const l = arguments.length
  // 如果用户只传递了两个参数，那么证明第二个参数可能是 props , 也可能是 children
  if (l === 2) {
    // 如果 第二个参数是对象，但不是数组。则第二个参数只有两种可能性：1. VNode 2.普通的 props
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 如果是 VNode，则 第二个参数代表了 children
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      // 如果不是 VNode， 则第二个参数代表了 props
      return createVNode(type, propsOrChildren)
    }
    // 如果第二个参数不是单纯的 object，则 第二个参数代表了 props
    else {
      return createVNode(type, null, propsOrChildren)
    }
  }
  // 如果用户传递了三个或以上的参数，那么证明第二个参数一定代表了 props
  else {
    // 如果参数在三个以上，则从第二个参数开始，把后续所有参数都作为 children
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    }
    // 如果传递的参数只有三个，则 children 是单纯的 children
    else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    // 触发 createVNode 方法，创建 VNode 实例
    return createVNode(type, propsOrChildren, children)
  }
}

//判断是否为vnode
export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}
```

```typescript [shared/index.ts]
//判断是否为一个数组
export const isArray = Array.isArray

//判断是否为一个对象
export const isObject = (val: unknown) =>
  val !== null && typeof val === 'object'
```

:::

### 2.2 `createVNode` 函数入口

Vue 3 内部通过 `createBaseVNode` 完成节点的实例化与优化标识的组合。

:::code-group

```typescript [vnode.ts]
// 核心暴露的创建 VNode 方法
export function createVNode(type, props, children?): VNode {
  // 通过 bit 位处理 shapeFlag 类型

  // 1. 如果 type 本身就是 VNode，则克隆并合并 props
  if (isVNode(type)) {
    const cloned = cloneVNode(type, props, true /* mergeRef */)
    if (children) {
      normalizeChildren(cloned, children)
    }
    return cloned
  }

  // 2. Class 和 Style 的规范化 (将数组/对象转为标准字符串或对象)
  if (props) {
    props = guardReactiveProps(props)
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
    if (isObject(style)) {
      props.style = normalizeStyle(style)
    }
  }

  // 3. 根据 type 确定 shapeFlag 的基础类型
  let shapeFlag = 0
  if (isString(type)) {
    //文本
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isSuspense(type)) {
    shapeFlag = ShapeFlags.SUSPENSE
  } else if (isTeleport(type)) {
    shapeFlag = ShapeFlags.TELEPORT
  } else if (isObject(type)) {
    //有状态的组件
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
  } else if (isFunction(type)) {
    //函数组件
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT
  } else {
    shapeFlag = 0
  }

  return createBaseVNode(type, props, children, shapeFlag)
}

function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    shapeFlag,
    key: props?.key || null,
  } as VNode

  // 2. 规范化子节点，并将子节点的 shapeFlag 合并进来
  // needFullChildrenNormalization是createBaseVNode函数的参数，默认为false
  //动态运行时入口（h -> createVNode）：主动传 true，触发 normalizeChildren 兜底。
  //静态编译期入口（Compiler -> createElementVNode）：不传此参数（走默认值 false），利用编译期的确定性跳过规范化，提升渲染性能。
  if (needFullChildrenNormalization) {
    // 开发者手写的 h 函数走到这里
    normalizeChildren(vnode, children)
  } else if (children) {
    // 编译器生成的代码由于已经在编译期知道了类型，直接处理
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}
//规范化不同格式的子节点（children）
function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  const { shapeFlag } = vnode

  // 1. 处理空节点
  if (children == null) {
    children = null
  }
  // 2. 处理数组类型的子节点
  else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  }
  // 3. 处理对象类型的子节点 (通常代表插槽 Slots)
  else if (typeof children === 'object') {
    // 如果当前节点是一个普通 DOM 元素，但子节点却是对象
    // 这通常发生在手写 render 函数时，错误地将插槽对象传给了普通元素
    if (shapeFlag & (ShapeFlags.ELEMENT | ShapeFlags.TELEPORT)) {
      // 提取 default 插槽并递归规范化
      const slot = (children as any).default
      if (slot) {
        normalizeChildren(vnode, slot())
      }
      return
    } else {
      // 正常情况：这是一个组件，子节点对象就是插槽 (Slots)
      type = ShapeFlags.SLOTS_CHILDREN
    }
  }
  // 4. 处理函数类型的子节点 (通常是默认插槽的简写)
  else if (isFunction(children)) {
    // 将函数包装为标准插槽对象的 default 属性
    children = { default: children, _ctx: currentRenderingInstance }
    type = ShapeFlags.SLOTS_CHILDREN
  }
  // 5. 处理基础数据类型 (字符串、数字等)
  else {
    children = String(children)
    // 标记子节点为纯文本
    type = ShapeFlags.TEXT_CHILDREN
  }
  // 6. 重新赋值规范化后的 children
  vnode.children = children
  // 7. 【核心】按位或 (|=) 合并 shapeFlag
  vnode.shapeFlag |= type
}
```

```typescript [shared/index.ts]
//是否为一个 function
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

//判断是否为一个数组
export const isArray = Array.isArray

//判断是否为一个对象
export const isObject = (val: unknown) =>
  val !== null && typeof val === 'object'

//判断是否为一个 string
export const isString = (val: unknown): val is string => typeof val === 'string'
```

```typescript [normalizeProp.ts]
//规范化 class 类，处理 class 的增强
export function normalizeClass(value: unknown): string {
  let res = ''
  // 判断是否为 string，如果是 string 就不需要专门处理
  if (isString(value)) {
    res = value
  }
  // 额外的数组增强。官方案例：https://cn.vuejs.org/guide/essentials/class-and-style.html#binding-to-arrays
  else if (isArray(value)) {
    // 循环得到数组中的每个元素，通过 normalizeClass 方法进行迭代处理
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
  }
  // 额外的对象增强。官方案例：https://cn.vuejs.org/guide/essentials/class-and-style.html#binding-html-classes
  else if (isObject(value)) {
    // for in 获取到所有的 key，这里的 key（name） 即为 类名。value 为 boolean 值
    for (const name in value as object) {
      // 把 value 当做 boolean 来看，拼接 name
      if ((value as object)[name]) {
        res += name + ' '
      }
    }
  }
  // 去左右空格
  return res.trim()
}

//规范化 style 属性
export function normalizeStyle(value) {
  // 1. 处理数组情况（最复杂，需要展平和合并）
  if (Array.isArray(value)) {
    const res = {}

    // 遍历数组元素
    for (let i = 0; i < value.length; i++) {
      const item = value[i]

      // 根据 item 的类型进行不同处理
      const normalized =
        typeof item === 'string'
          ? parseStringStyle(item) // 将 'color: red' 解析为 { color: 'red' }
          : normalizeStyle(item) // 递归调用，处理嵌套数组或普通对象

      // 将处理后的结果合并到结果对象 res 中
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key]
        }
      }
    }
    return res
  }
  // 2. 如果直接是字符串或对象，运行时可以直接处理，原样返回
  else if (typeof value === 'string' || typeof value === 'object') {
    return value
  }
}

// 匹配分号，但忽略括号内的分号 (例如 base64 图片里的分号)
const listDelimiterRE = /;(?![^(]*\))/g
// 匹配冒号分隔的键值对
const propertyDelimiterRE = /:(.+)/
//解析纯字符串样式
function parseStringStyle(cssText) {
  const ret = {}
  cssText.split(listDelimiterRE).forEach(item => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE)
      if (tmp.length > 1) {
        // 去除空格并存入对象，如 ' font-size ' -> 'font-size'
        ret[tmp[0].trim()] = tmp[1].trim()
      }
    }
  })
  return ret
}
```

:::

### 2.3 `VNode` 接口定义

:::code-group

```typescript [vnode.ts]
export interface VNode<
  HostNode = any,
  HostElement = any,
  ExtraProps = { [key: string]: any },
> {
  // --- 内部标识 ---
  __v_isVNode: true
  [ReactiveFlags.SKIP]: true

  // --- 节点基础信息 ---
  type: VNodeTypes
  props: (VNodeProps & ExtraProps) | null
  key: string | number | symbol | null
  ref: VNodeNormalizedRef | null

  // --- 视图与子节点 ---
  children: VNodeNormalizedChildren

  // --- 运行时状态 (宿主环境) ---
  el: HostNode | null // 挂载后的真实 DOM
  component: ComponentInternalInstance | null // 组件实例

  // --- 编译器优化标识 ---
  shapeFlag: number // 描述当前节点及子节点类型的位图
  patchFlag: number // 描述节点动态内容的位图
}
```

:::

## 3. 核心优化机制：Flags 系统

`VNode` 中最核心的性能优化在于利用位运算（Bitwise operations）实现的 `ShapeFlags` 和 `PatchFlags`。

### 3.1 `ShapeFlags` (描述静态结构)

用于在渲染时极速判断当前节点的类型以及它包含哪种类型的子节点。

:::code-group

```typescript [shapeFlags.ts]
export const enum ShapeFlags {
  ELEMENT = 1, // 1: 普通 DOM 元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 2: 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 4: 有状态组件
  TEXT_CHILDREN = 1 << 3, // 8: 子节点是文本
  ARRAY_CHILDREN = 1 << 4, // 16: 子节点是数组
  SLOTS_CHILDREN = 1 << 5, // 32: 子节点是插槽
  TELEPORT = 1 << 6, // 64: Teleport 组件
  SUSPENSE = 1 << 7, // 128: Suspense 组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 6: 统称组件
}
```

```typescript [判断示例]
// 验证一个 VNode 是否是普通元素且包含数组子节点
if (
  vnode.shapeFlag & ShapeFlags.ELEMENT &&
  vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN
) {
  // 执行挂载元素的逻辑，并遍历挂载子节点
}
```

:::

### 3.2 `PatchFlags` (描述动态变化)

由 Vue 编译器静态分析后注入，指导运行时 Diff 算法进行靶向更新（例如只更新 `class`，跳过全量属性对比）。

:::code-group

```typescript [patchFlags.ts]
export const enum PatchFlags {
  TEXT = 1, // 1: 动态的文本节点
  CLASS = 1 << 1, // 2: 动态的 class
  STYLE = 1 << 2, // 4: 动态的 style
  PROPS = 1 << 3, // 8: 除了 class/style 外的动态属性
  FULL_PROPS = 1 << 4, // 16: 带有动态 key 的 props (需全量比对)
  HYDRATE_EVENTS = 1 << 5, // 32: 带有监听事件的节点
  STABLE_FRAGMENT = 1 << 6, // 64: 子节点顺序不会变的 Fragment
  KEYED_FRAGMENT = 1 << 7, // 128: 带有 key 的 Fragment
  UNKEYED_FRAGMENT = 1 << 8, // 256: 不带 key 的 Fragment
  NEED_PATCH = 1 << 9, // 512: 非 props 改变，但需要被强制 patch 的节点
  DYNAMIC_SLOTS = 1 << 10, // 1024: 动态插槽

  // 负数标志：表示纯静态节点或退出优化模式
  HOISTED = -1, // 静态提升节点
  BAIL = -2, // 退出优化模式
}
```

:::

## 4. 完整流程示例

### 4.1 基础使用示例

```ts
import { h, render } from 'vue'

// 使用 h 函数 (内部调用 createVNode) 创建 VNode
const vnode = h('div', { id: 'app', class: 'container' }, [
  h('span', null, 'Hello'),
  h('span', null, 'Vue 3'),
])

console.log(vnode.type) // "div"
console.log(vnode.shapeFlag) // 17 (ELEMENT: 1 | ARRAY_CHILDREN: 16)

// 渲染器将其挂载到真实的 DOM 容器中
render(vnode, document.body)
```

### 4.2 完整流程图

![Logo](/img/vnode.png)

## 5. 工具函数实现

### `isVNode`

判断传入的值是否是一个真实的 `VNode` 对象。

```typescript
export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}
```

### `cloneVNode`

克隆一个现有的 `VNode`。常用于静态节点提升（Hoisting）和处理插槽复用，避免同一个 VNode 引用在不同的地方挂载产生冲突。

```typescript
export function cloneVNode<T, U>(
  vnode: VNode<T, U>,
  extraProps?: (Data & VNodeProps) | null,
  mergeRef = false,
): VNode<T, U> {
  const cloned = {
    ...vnode,
    props: extraProps ? mergeProps(vnode.props, extraProps) : vnode.props,
    ref:
      extraProps && extraProps.ref
        ? mergeRef
          ? [vnode.ref, extraProps.ref]
          : extraProps.ref
        : vnode.ref,
  } as VNode<T, U>
  return cloned
}
```

## 6. `ShapeFlags` 与 `PatchFlags` 对比

| 对比维度 | `ShapeFlags` (形状标志)                         | `PatchFlags` (补丁标志)                    |
| -------- | ----------------------------------------------- | ------------------------------------------ |
| 核心作用 | 标识节点的**结构类型**                          | 标识节点的**动态内容**                     |
| 关注焦点 | 节点是什么？子节点是什么结构？                  | 节点有哪些部分会发生变化？                 |
| 生成时机 | 运行时创建 VNode 时实时计算组合                 | 编译期模板静态分析时预先注入               |
| 消费场景 | `mount` (初次挂载) 和 `patch` (更新) 的分支路由 | 仅在 `patch` (更新阶段) 的 Diff 优化中使用 |
| 典型枚举 | `ELEMENT`, `COMPONENT`, `TEXT_CHILDREN`         | `TEXT`, `CLASS`, `STYLE`, `PROPS`          |

## 7. 总结

`VNode` 是 Vue 3 将声明式模板映射到真实宿主环境的核心载体。它不仅极大地提升了框架的跨平台灵活性，也是 Vue 3 极速渲染的底层基石。

- **设计亮点**：内部使用 `__v_isVNode` 严格鉴权，结合 `[ReactiveFlags.SKIP]` 避免了响应式系统对庞大渲染树的错误代理，节省内存。
- **性能优化**：通过 `ShapeFlags` 彻底告别了 Vue 2 时代冗长的布尔值判断逻辑；通过 `PatchFlags` 和 `dynamicChildren`（Block Tree 机制）实现了靶向级、扁平化的极速 Diff。
- **规范容错**：提供了 `normalizeVNode` 机制，允许开发者在 `render` 函数中随意传入字符串或数组，框架会自动将其兜底转换为标准的 VNode 结构。
