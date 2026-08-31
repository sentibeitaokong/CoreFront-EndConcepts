# React Element 与 Vue VNode：蓝图的构造与安全

在 React 与 Vue 的运行时体系中，`Element` 与 `VNode` 是描述 UI 结构的最小单元。它们就像是建筑蓝图，精确地记录了“**页面应该长什么样**”。然而，两大框架在蓝图的构造方式、携带的信息以及设计目标上却有着截然不同的考量。React 追求极致的轻量与不可变性，而 Vue 则选择在编译阶段就将优化情报“**刻**”入节点。

## 1. React Element：纯粹的、不可变的 UI 快照

### 1.1 定义与本质

React Element 是一个 **不可变(Immutable)** 的普通 JavaScript 对象。它只是组件树在某一时刻的“**快照**”，一旦创建就无法修改。任何对 UI 的更新都需要生成全新的 Element 树，并由 React 的协调（Reconciliation）算法进行差异比较。

### 1.2 内部结构

React Element 是一个极简的不可变（Immutable）快照。它不承载任何运行时的状态逻辑，一旦生成便无法更改。

:::code-group

```jsx [JSX源码与编译产物]
function Welcome({ name }) {
  return <h1 className="greeting">Hello, {name}!</h1>
}

// 编译后的自动 runtime (React 17+)
import { jsx as _jsx } from 'react/jsx-runtime'

// Element 结构
{
  $$typeof: Symbol.for('react.element'), // 核心安全机制
  type: 'h1',
  key: null,
  ref: null,
  props: { className: 'greeting', children: 'Hello, World!' },
}
```

:::

### 1.3 不可变性带来的好处

- **安全**：不可变对象降低了副作用扩散的风险，使得状态追踪更加可靠。
- **可预测性**：相同的 props 与 type 总是产生相同的 Element。
- **并发渲染**：由于 Element 不会变化，React 可以在并发模式下中断和恢复渲染，无需担心状态被意外修改。

### 1.4 安全机制

React 之所以使用 `Symbol.for('react.element')` 作为标识符，是为了**防止 JSON 注入攻击**。如果服务器返回一个伪造的 JSON 对象（如 `{ type: 'script', props: { src: 'evil.js' } }`），由于 JSON 无法序列化 `Symbol` 类型，该对象将缺少合法的 `$$typeof` 属性。React 在渲染时会检查该字段，一旦发现缺失或类型不匹配，就会拒绝渲染，从而在根源上阻止了恶意脚本的执行。

## 2. Vue 3 VNode：携带编译优化信息的智能节点

Vue 3 的 VNode 同样是一个描述 UI 的 JavaScript 对象，但它不仅承载了结构信息，还**嵌入了编译器生成的优化提示**，它允许编译器（Compiler）在编译模板时，提前将静态信息、动态特征等预判逻辑“**刻**”在 VNode 上，指导运行时的 Diff 算法。

### 2.1 基本结构

Vue 通过 `h()` 函数或模板编译生成 VNode，其典型结构如下：

:::code-group

```javascript [携带 PatchFlags 的 VNode]
// createVNode 输出的底层结构
{
  __v_isVNode: true,
  type: 'div',
  props: { class: 'container' },
  children: [ /* ... */ ],

  // === 编译器注入的超能力 ===
  shapeFlag: 17,         // 位运算标记：1(ELEMENT) | 16(ARRAY_CHILDREN) 快速断言节点特征
  patchFlag: 2,          // PatchFlags.CLASS (仅有 class 是动态绑定的)
  dynamicProps: ['class'], // 记录具体哪个属性是动态的，跳过全量 props 遍历
  dynamicChildren: [],   // Block Tree 的核心：拍平的所有子代动态节点

  // 其他内部字段...
  key: null,
  ref: null,
  el: null,                    // 对应的真实 DOM 元素（挂载后）
}
```

:::

### 2.2 快速类型断言

`shapeFlag` 是一个位掩码，通过按位与操作可以在极短时间内判断 VNode 的种类，避免繁琐的类型检查。

| 位值                       | 含义               |
| -------------------------- | ------------------ |
| 1 (`ELEMENT`)              | 宿主元素（如 div） |
| 2 (`FUNCTIONAL_COMPONENT`) | 函数式组件         |
| 4 (`STATEFUL_COMPONENT`)   | 有状态组件         |
| 8 (`TEXT_CHILDREN`)        | 子节点是文本       |
| 16 (`ARRAY_CHILDREN`)      | 子节点是数组       |
| 32 (`SLOTS_CHILDREN`)      | 子节点是插槽       |

例如 `shapeFlag = 17` 表示 `1 (ELEMENT) | 16 (ARRAY_CHILDREN)`，即这是一个宿主元素且拥有数组子节点。

### 2.3 动态属性标记

`patchFlag` 通过位运算精确指出**哪些属性是动态绑定的**，使运行时渲染器只需关注这些属性，而跳过静态属性的比较。

| PatchFlags 常量     | 值   | 含义                                     |
| ------------------- | ---- | ---------------------------------------- |
| `TEXT`              | 1    | 文本内容动态（如 `{{ msg }}`）           |
| `CLASS`             | 2    | `class` 动态绑定                         |
| `STYLE`             | 4    | `style` 动态绑定                         |
| `PROPS`             | 8    | 其他 props 动态（需结合 `dynamicProps`） |
| `FULL_PROPS`        | 16   | 所有 props 都可能变（非编译优化）        |
| `HYDRATE_EVENTS`    | 32   | 水合时的事件监听                         |
| `STABLE_FRAGMENT`   | 64   | 子节点顺序不会变化                       |
| `KEYED_FRAGMENT`    | 128  | 带 key 的列表片段                        |
| `UNKEYED_FRAGMENT`  | 256  | 不带 key 的列表片段                      |
| `NEED_PATCH`        | 512  | 强制更新标记                             |
| `DEV_ROOT_FRAGMENT` | 1024 | 开发环境根片段                           |

例如，一个 `<div :class="cls" :id="id">` 的 VNode 的 `patchFlag` 可能为 2 (`CLASS`) | 8 (`PROPS`)，而 `dynamicProps` 会记录 `['class', 'id']`。

### 2.4 动态子节点 与 Block Tree

在 Block 节点中，编译器会收集所有动态后代节点，形成 `dynamicChildren` 数组。在更新时，渲染器只需遍历这个数组而无需遍历整棵子树，实现了**靶向更新（Targeted Updates）**，大幅减少 diff 开销。

```javascript
// Block Tree 核心：openBlock 开启收集器，createBlock 固化 dynamicChildren（简化）
let currentBlock = null

function openBlock() {
  currentBlock = [] // 开启一个新的动态节点收集器
}

function createBlock(type, props, children, patchFlag) {
  const vnode = createVNode(type, props, children, patchFlag)
  vnode.dynamicChildren = currentBlock // 编译期已把动态子节点 push 进收集器
  currentBlock = null
  return vnode
}

// 更新时只需遍历 dynamicChildren，跳过静态节点（简化）
function patchBlockChildren(oldVNode, newVNode, ...args) {
  for (let i = 0; i < newVNode.dynamicChildren.length; i++) {
    patch(oldVNode.dynamicChildren[i], newVNode.dynamicChildren[i], ...args)
  }
}
```

## 3. 对比总结

| 维度               | React Element                                       | Vue 3 VNode                                                      |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| **核心定位**       | 纯粹的描述对象，只定义“**是什么**”                  | 描述对象 + 编译优化载荷，同时指导“**怎么更新**”                  |
| **可变性**         | **不可变**（Immutable）                             | **不可变**（但内部 `el` 等可变字段会在挂载后填充）               |
| **创建方式**       | JSX 编译为 `jsx()`/`jsxs()`                         | 模板编译为渲染函数，也可手动 `h()`                               |
| **身份标识**       | `$$typeof` (Symbol) 用于防 XSS                      | `__v_isVNode` (布尔) 用于调试                                    |
| **安全机制**       | `Symbol` 防止 JSON 伪造                             | 无显式防伪造，但依赖内部检查                                     |
| **优化信息**       | 无（全靠 Fiber 调度与运行时协调）                   | 携带 `shapeFlag`、`patchFlag`、`dynamicProps`、`dynamicChildren` |
| **与渲染器的交互** | 每次更新时，Element 树被传入 Fiber，执行完整的 diff | 渲染器利用 VNode 上的标记跳过静态属性，靶向更新动态内容          |
| **是否可挂载**     | 否，Element 本身不挂载 DOM，由 Fiber 负责           | 是，VNode 可挂载到真实 DOM（`el` 属性）                          |
| **典型使用场景**   | 描述任何 UI 结构，适用于 React 全平台（Web/Native） | 主要面向 Web，但也可扩展至其他平台                               |

- **React Element** 是极致的“**设计图纸**”，它只负责“**画出来**”，而将所有的“**如何施工**”交给 **Fiber 架构** 和 **协调算法**。这种分层设计使 React 能够实现跨平台渲染（React Native 等），并将性能优化的重点放在了运行时。
- **Vue 3 VNode** 则更像是一张“**智能工程图**”，它在编译阶段就已经标注好了哪些墙壁需要“**开槽**”（动态属性），哪些是“**承重墙**”（静态节点）。这种设计使得 Vue 在运行时能够精准地“**打孔**”，从而以最小代价完成 DOM 更新。
