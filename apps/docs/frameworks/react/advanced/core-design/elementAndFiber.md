# React Element、Fiber 与 DOM 节点

## 1. 概念辨析：从 JSX 到 DOM

React 应用中存在三个容易混淆的核心概念：**React Element**、**Fiber 节点**和 **DOM 节点**。理解它们的区别和关系是深入 React 内部机制的基础。

```text
JSX 源码 → React Element（不可变 UI 描述）→ Fiber 树（工作节点）→ 渲染器 → DOM 节点
```

|              | React Element                | Fiber 节点                     | DOM 节点                     |
| ------------ | ---------------------------- | ------------------------------ | ---------------------------- |
| **是什么**   | 不可变的 UI 描述对象         | React 运行时的可变工作单元     | 浏览器渲染的真实节点         |
| **创建方式** | `createElement()` / JSX      | `createFiberFromElement()`     | `document.createElement()`   |
| **可变性**   | 不可变（每次渲染创建新对象） | 可复用更新                     | 可变（直接修改属性和子节点） |
| **生命周期** | 一次渲染的瞬间               | 跨渲染持久化（通过 alternate） | 持久化，由 React 管理        |
| **作用**     | 描述"要渲染什么"             | 保存状态、调度工作、记录副作用 | 实际渲染到屏幕               |

## 2. React Element

### 2.1 结构

React Element 是一个**轻量、不可变的纯对象**，描述界面上应该显示什么：

```javascript
// 一个 React Element 的结构
{
  $$typeof: Symbol(react.element),   // 标识为 React Element
  type: 'h1',                        // 宿主元素标签名 / 函数组件 / Class 组件
  key: null,                         // 列表 diff 的 key
  ref: null,                         // ref 引用
  props: {                           // 属性（含 children）
    className: 'title',
    children: 'Hello World'
  },
  _owner: null                       // 创建此 Element 的 Fiber（开发模式）
}
```

### 2.2 不可变性

React Element 的每个字段都是**不可变的**。一旦创建，你不应该修改它：

```jsx
const element = <h1>Hello</h1>
// ❌ 不要这样做
element.props.className = 'changed'

// ✅ 如果要变化，创建新的 Element
const newElement = <h1 className="changed">Hello</h1>
```

这种不可变性是 React 能够安全地在并发模式下**丢弃和重试渲染**的基础。

### 2.3 JSX 到 Element 的编译

```jsx
// 源码
function Greeting({ name }) {
  return <h1 className="title">Hello, {name}!</h1>
}

// 编译后（Automatic Runtime）
import { jsx as _jsx } from 'react/jsx-runtime'

function Greeting({ name }) {
  return _jsx('h1', {
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

### 3.1 Fiber 是什么

Fiber 是 React 为**持续更新和调度**维护的工作节点。与 Element 不同，Fiber 在整个组件生命周期中**持久存在并不断更新**。

可以把 Element 理解为"设计图纸"，Fiber 理解为"施工现场的工作台"——设计图纸每次渲染都可能不同，但工作台跨渲染持久化。

### 3.2 Fiber 节点的核心字段

```javascript
type Fiber = {
  // === 节点标识 ===
  tag: WorkTag,          // 节点类型：FunctionComponent(0)、ClassComponent(1)、
                          // HostComponent(5 原生DOM)、HostText(6 文本)等
  type: any,             // 对应 Element.type（函数组件本身 / 'div' 等字符串）
  key: null | string,    // 子节点 diff 的 key
  elementType: any,      // 原始 type（处理 lazy 后可能与 type 不同）

  // === 链表树结构（可中断遍历的基础） ===
  return: Fiber | null,  // 父 Fiber
  child: Fiber | null,   // 第一个子 Fiber
  sibling: Fiber | null, // 下一个兄弟 Fiber
  index: number,         // 在父节点子列表中的位置索引

  // === 状态与工作信息 ===
  pendingProps: any,     // 新传入的 props（等待处理）
  memoizedProps: any,    // 上次渲染生效的 props
  memoizedState: any,    // Hooks 链表头部 / Class 组件 state
  updateQueue: mixed,    // 待处理的更新队列

  // === 副作用标记 ===
  flags: Flags,          // 自身副作用（Placement、Update、Deletion 等）
  subtreeFlags: Flags,   // 子树中累积的副作用（用于快速跳过干净子树）
  deletions: Array<Fiber> | null, // 待删除的子节点列表

  // === 调度相关 ===
  lanes: Lanes,          // 自身更新优先级
  childLanes: Lanes,     // 子树中存在的更新优先级

  // === 双缓冲 ===
  alternate: Fiber | null, // 指向另一棵树中对应的 Fiber

  // === 输出 ===
  stateNode: any,        // 对应真实 DOM（HostComponent）/ 组件实例（ClassComponent）
  ref: any,              // ref 引用
}
```

### 3.3 链表树结构

Fiber 放弃了传统的"children 数组"树结构，改用**"第一个子节点 + 兄弟节点"链表**：

```javascript
// 传统的树
//   A
//  / \
// B   C

// Fiber 的链表结构：
A.child = B // A 的第一个子节点是 B
B.sibling = C // B 的下一个兄弟是 C
B.return = A // B 的父节点是 A
C.return = A // C 的父节点是 A
```

这使得：

- 使用 `while` 循环即可**深度优先遍历**整棵树。
- 每个节点处理完后可以**随时暂停**，保存当前进度。
- 不需要系统调用栈，避免了递归深度限制。

## 4. 从 Element 到 Fiber 的转换

```mermaid
flowchart LR
    JSX[JSX 源码] -->|编译| Element[React Element<br/>不可变描述]
    Element -->|协调阶段| Fiber[Fiber 节点<br/>可变工作单元]
    Fiber -->|Commit 阶段| DOM[真实 DOM<br/>宿主平台输出]
```

### 4.1 首次渲染（Mount）

1. React 执行组件函数，返回 React Element 树。
2. 协调器为每个 Element **创建新的 Fiber 节点**。
3. 构建完整的 work-in-progress Fiber 树。
4. Commit 阶段创建对应的 DOM 节点。

### 4.2 更新渲染（Update）

1. React 重新执行组件函数，返回**新的** React Element 树。
2. 协调器对比新 Element 和旧 Fiber（通过 `alternate` 访问 current 树）。
3. **复用**类型相同的 Fiber 节点，只更新 `memoizedProps`/`memoizedState`。
4. 标记 `flags` 记录需要执行的 DOM 操作。
5. Commit 阶段应用变更。

### 4.3 复用 vs 重建

```jsx
// 类型相同 → 复用 Fiber，更新属性
// 旧：<div className="old" />
// 新：<div className="new" />
// → Fiber 复用，flags 标记 Update

// 类型不同 → 销毁旧 Fiber，创建新 Fiber
// 旧：<div />
// 新：<span />
// → 旧 Fiber 标记 Deletion，新 Fiber 创建并标记 Placement
```

## 5. 双缓冲（Double Buffering）

React 同时维护两棵 Fiber 树，通过 `alternate` 指针互相引用：

| 树                 | 角色                   | 说明                     |
| ------------------ | ---------------------- | ------------------------ |
| **current**        | 当前屏幕上 UI 对应的树 | 稳定状态，不可修改       |
| **workInProgress** | 正在构建的下一版 UI    | 构建中可修改，完成后切换 |

```javascript
// 双缓冲的切换流程
function commitRoot(root) {
  // Commit 完成后
  root.current = finishedWork // workInProgress 成为新的 current
  // 旧的 current 在下次更新时被复用为 workInProgress
}

// 获取 workInProgress
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate
  if (workInProgress === null) {
    // 首次渲染，创建新 Fiber
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 复用已有 Fiber，重置相关字段
    workInProgress.pendingProps = pendingProps
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
  }
  return workInProgress
}
```

**双缓冲的好处**：

- 构建过程不影响屏幕上的 UI。
- 中断或丢弃的渲染不会影响 current 树。
- Fiber 节点复用，减少 GC 压力。

## 6. Fiber 作为工作单元

Fiber 不仅仅是一个数据结构，还是**调度和渲染的工作单元**。每个 Fiber 节点在 Render 阶段被依次处理：

```javascript
// Fiber 的工作循环（简化）
function workLoop(deadline) {
  let shouldYield = false

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    // 检查是否需要让出主线程
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork) {
    // 所有工作完成 → Commit
    commitRoot()
  }
}

function performUnitOfWork(fiber) {
  // 1. beginWork：处理当前节点
  beginWork(fiber)
  // 2. 有子节点 → 深入
  if (fiber.child) return fiber.child
  // 3. 无子节点 → 完成当前节点
  while (fiber) {
    completeWork(fiber)
    // 4. 有兄弟节点 → 横向移动
    if (fiber.sibling) return fiber.sibling
    // 5. 无兄弟 → 回到父节点
    fiber = fiber.return
  }
}
```

## 7. 总结

- **React Element 是一次渲染的不可变 UI 描述**，每次函数组件调用返回新的 Element 对象。
- **Fiber 是 React 为持续更新维护的可变工作节点**，在整个组件生命周期中持久化和复用。
- **Element 是输入，Fiber 是协调器的执行和状态存储结构，DOM 是最终输出**。
- **链表树结构（child/sibling/return）使协程遍历和可中断渲染成为可能**。
- **双缓冲（current/alternate）保证了 UI 一致性和内存复用**。
- **Fiber ≠ "虚拟 DOM 的另一种叫法"**——它是一个更广的概念，涵盖调度、优先级、副作用标记和工作循环。
