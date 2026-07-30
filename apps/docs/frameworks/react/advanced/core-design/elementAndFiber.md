# React Element、Fiber 与 DOM 节点

## 1. 从 JSX 到 DOM

React 应用中存在三个容易混淆的核心概念：**React Element**、**Fiber 节点**和 **DOM 节点**。理解它们的区别和关系是深入 React 内部机制（尤其是并发模式）的基石。

```markdown
JSX 源码 → React Element（不可变 UI 描述）→ Fiber 树（工作节点）→ 渲染器 → DOM 节点
```

| 维度         | React Element (元素)               | Fiber Node (纤程/节点)              | DOM Node (宿主节点)          |
| ------------ | ---------------------------------- | ----------------------------------- | ---------------------------- |
| **存在形态** | 纯粹的轻量级 JavaScript 对象       | 复杂的运行状态机（包含指针与状态）  | 沉重的浏览器原生对象         |
| **创建时机** | 每次 Render 阶段（组件函数执行时） | 首次渲染时创建，后续更新时复用/克隆 | Commit 阶段按需增删改        |
| **可变性**   | **绝对不可变 (Immutable)**         | **高度可变 (Mutable)**              | **可变 (Mutable)**           |
| **生命周期** | 极短，单次渲染周期结束即被 GC 回收 | 跨渲染周期持久存在（伴随组件一生）  | 挂载到文档后持久存在         |
| **核心职责** | 描述当前时刻 "**UI 应该长什么样**" | 调度工作、存储 Hook 状态、计算 Diff | 响应交互、触发浏览器重绘重排 |

## 2. React Element

### 2.1 内部结构与安全屏障

React Element 是一个**轻量、不可变的纯对象**，它是对 UI 的声明式描述：

```javascript
// 一个 React Element 的标准结构
{
  $$typeof: Symbol.for('react.element'), // 安全标记：防御 JSON 注入型 XSS 攻击
  type: 'h1',                            // 节点类型：字符串(DOM) / 函数引用(FC) / Class引用
  key: null,                             // 列表 Diff 的唯一标识，用于同层复用
  ref: null,                             // 获取底层 DOM 或类实例的引用
  props: {                               // 属性集合（包含 children）
    className: 'title',
    children: 'Hello World'
  },
  _owner: null                           // 记录负责创建此 Element 的 Fiber（开发模式）
}

```

> [!NOTE]
> `$$typeof` 的设计极为巧妙：由于 JSON 无法序列化 `Symbol`，如果攻击者试图通过服务器返回一个伪造的 React Element 对象注入脚本，React 会因为找不到合法的 `Symbol.for('react.element')` 而拒绝渲染，从根源上阻断了 XSS。

### 2.2 极致的不可变性 (Immutability)

React Element 的每个字段都是被冻结的。这种不可变性是 React 能够安全地在并发模式下**丢弃、暂停和重试渲染**的基础。

```jsx
const element = <h1>Hello</h1>
// ❌ 绝对禁止：这会破坏 React 的假设，导致不可预期的渲染错误
element.props.className = 'changed'

// ✅ 正确做法：状态驱动产生全新的 Element
const newElement = <h1 className="changed">Hello</h1>
```

### 2.3 编译转化 (JSX Transform)

JSX 只是语法糖，在编译期（Babel / SWC / Vite）会被抹平为函数调用：

```jsx
// 源码
function Greeting({ name }) {
  return <h1 className="title">Hello, {name}!</h1>
}

// React 17+ 引入的 Automatic Runtime 编译后：
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'

function Greeting({ name }) {
  return _jsxs('h1', {
    className: 'title',
    children: ['Hello, ', name, '!'],
  })
}

// _jsx 的返回值就是一个 React Element：
// { $$typeof: Symbol(react.element), type: 'h1', props: { className: 'title', children: [...] }, ... }
```

### 2.4 Element 的类型判断

```javascript
// 宿主元素（原生 HTML 标签）
<div />          // type: 'div'（字符串）

// 函数组件
<MyComponent />  // type: MyComponent（函数引用）

// Class 组件
<MyClass />      // type: MyClass（Class 引用）

// Fragment
<>text</>        // type: Symbol(react.fragment)

// Portal
createPortal()   // type: Symbol(react.portal)
```

## 3. Fiber 节点

### 3.1 为什么需要 Fiber？

在 React 15 时代，Element 树的 Diff 是通过**原生调用栈递归**完成的。一旦树变大，递归无法中断，会导致主线程阻塞（掉帧）。
Fiber 架构的核心使命是：**将不可中断的深层递归，扁平化为基于堆内存的、可中断的单链表循环**。Fiber 就是这个调度过程中的**工作单元**。

### 3.2 核心字段域解剖

一个 Fiber 节点（`FiberNode`）是一个极其庞大的对象，按职责可划分为四大场域：

```javascript
type Fiber = {
  // === 1. 实例与身份域 (Identity) ===
  tag: WorkTag,          // 节点标识（如 0: FC, 1: Class, 3: HostRoot, 5: HostComponent）
  type: any,             // 对应 Element.type
  key: null | string,    // 对应 Element.key

  // === 2. 拓扑结构域 (Tree Structure) - 单链表树 ===
  return: Fiber | null,  // 指向父节点（工作完成后的返回地）
  child: Fiber | null,   // 指向第一个子节点
  sibling: Fiber | null, // 指向右侧第一个兄弟节点
  index: number,         // 在父节点的 children 中的索引

  // === 3. 状态与数据域 (State & Data) ===
  pendingProps: any,     // 新进入的 props，等待本次 Render 消费
  memoizedProps: any,    // 上一次 Render 成功后的 props
  memoizedState: any,    // 核心！FC 这里挂载 Hooks 单向链表；Class 挂载 state
  updateQueue: mixed,    // 状态更新队列（如 setState 产生的 Update 对象）

  // === 4. 副作用与调度域 (Effects & Scheduling) ===
  flags: Flags,          // 自身发生的副作用（如 Placement 插入、Update 更新）
  subtreeFlags: Flags,   // 子树累积的副作用（用于 Commit 阶段快速跳过干净的子树）
  deletions: Array<Fiber> | null, // 待移除的子节点数组
  lanes: Lanes,          // 当前节点拥有的更新优先级（31位二进制位运算）
  childLanes: Lanes,     // 子树中拥有的更新优先级

  // === 5. 架构指针与输出 (Architecture & Output) ===
  alternate: Fiber | null, // 指向另一棵树（current <-> workInProgress）中的对应节点
  stateNode: any,        // 物理映射：对应真实的 DOM 节点 或 Class 实例
}

```

### 3.3 拓扑优势：从树到链表

Fiber 放弃了 `children: []` 数组结构，改用 **Child-Sibling-Return** 链表：

```javascript
// 假设结构：
//   父 (A)
//  /     \
// 子(B) - 子(C)

A.child = B // 父找大儿子
B.sibling = C // 大儿子找二儿子
B.return = A // 儿子随时能找到父亲
C.return = A
```

## 4. 总结

- **React Element (蓝图)** 是每次渲染产生的一次性指令快照，告诉 React "**界面应该是怎样的**"。
- **Fiber (引擎/工作台)** 是跨越渲染周期长存的状态机。它接住了 Element 的蓝图，通过比对计算出差异（Flags），并维护了所有的 Hooks 状态、调度优先级和链表拓扑。
- **DOM (产物)** 是底层宿主环境的物理实体。Fiber 的 `stateNode` 引用了它，并在最终的 Commit 阶段对其进行极简的靶向手术。
- **整体架构**：不可变的数据流（Element）驱动了可变的状态机（Fiber），最终通过双缓冲安全、高效地投射为物理像素（DOM）。
- **Fiber ≠ "虚拟 DOM 的另一种叫法"**——它是一个更广的概念，涵盖调度、优先级、副作用标记和工作循环。
