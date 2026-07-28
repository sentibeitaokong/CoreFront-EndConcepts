# 更新批处理（Batching）

## 1. 状态更新的生命周期

在 React 中，`setState` 或 `dispatch` 调用**不会直接修改当前渲染中的状态变量**。相反，它创建一个 Update 对象放入 Fiber 的更新队列，由协调器在下一次 Render 中处理：

```text
setState / dispatch
  → 创建 Update 对象
  → 推入 Fiber.updateQueue
  → 标记 Fiber 的 Lane（确定优先级）
  → 沿树向上标记 childLanes
  → 调度根节点
  → Render 阶段消费队列
  → 计算新的 memoizedState
  → Commit 新 UI
```

## 2. Update 对象

### 2.1 Update 的结构

```typescript
// 一个 Update 对象（简化）
type Update<State> = {
  lane: Lane // 此更新的优先级
  tag: 0 | 1 | 2 // UpdateState | ReplaceState | ForceUpdate
  payload: State | ((prev: State) => State) // 新值 或 更新函数
  callback: (() => mixed) | null // setState 的第二个参数（回调）
  next: Update<State> | null // 指向下一个 Update（链表）
}
```

### 2.2 两种更新方式

```jsx
// 方式 1：直接传值
setCount(5)
// → payload: 5

// 方式 2：函数式更新
setCount(prev => prev + 1)
// → payload: (prev) => prev + 1
```

**函数式更新的优势**：基于前一个 Update 的结果计算，适合连续更新：

```jsx
function handleClick() {
  setCount(c => c + 1) // prev = 0 → 结果为 1
  setCount(c => c + 1) // prev = 1 → 结果为 2
  setCount(c => c + 1) // prev = 2 → 结果为 3
}
// 三次函数式更新：最终 count = 3 ✅

function handleClick() {
  setCount(count + 1) // 0 + 1 = 1
  setCount(count + 1) // 0 + 1 = 1（基于闭包中捕获的值）
  setCount(count + 1) // 0 + 1 = 1
}
// 三次直接传值：最终 count = 1 ❌
```

## 3. 更新队列（Update Queue）

### 3.1 队列结构

```typescript
// Hook 的更新队列结构
type UpdateQueue<State> = {
  pending: Update<State> | null // 环形链表的尾节点
  lanes: Lanes // 队列中所有 Update 的 Lane 合集
  lastRenderedState: State // 上次渲染的 State
}
```

### 3.2 环形链表设计

Update 使用**环形单向链表**存储，`pending` 指向最后一个加入的节点：

```javascript
// 空队列
pending = null

// 添加 Update A
// A → A（自环）
// pending → A

// 添加 Update B
// A → B → A
// pending → B

// 添加 Update C
// A → B → C → A
// pending → C
```

环形链表的好处：

- 可以从任意位置开始遍历。
- 插入到尾部是 O(1)。
- 不需要额外的头尾指针。

### 3.3 队列消费

在 Render 阶段，React 遍历 Update 链表，按优先级处理：

```javascript
// 消费更新队列（简化）
function processUpdateQueue(workInProgress, queue, renderLanes) {
  let newState = queue.lastRenderedState
  let update = queue.pending

  if (update !== null) {
    // 从环形链表的头部开始
    let first = update.next
    let current = first

    do {
      const updateLane = current.lane

      // 此 Update 的优先级是否包含在本次渲染的 Lane 中？
      if (isSubsetOfLanes(renderLanes, updateLane)) {
        // 包含 → 处理此 Update
        newState =
          typeof current.payload === 'function'
            ? current.payload(newState)
            : current.payload
      } else {
        // 不包含 → 跳过（留给更高或更低优先级的渲染）
        // 此 Update 留在队列中，等待下次 Render
      }

      current = current.next
    } while (current !== first)
  }

  queue.lastRenderedState = newState
  return newState
}
```

关键点：

- **高优先级 Lane 先处理**，低优先级 Update 被跳过。
- 被跳过的 Update **保留在队列中**，不会丢失。
- 这就是为什么低优先级更新（如 Transition）可以在被打断后正确恢复。

## 4. 批量更新（Batching）

### 4.1 什么是批量更新

批量更新是指 React 将**同一上下文中的多个 `setState` 调用合并为一次 Render 和 Commit**：

```jsx
function handleClick() {
  setCount(c => c + 1) // Update A
  setName('Alice') // Update B
  setAge(25) // Update C
}
// React 不会执行三次 Render
// 而是将 A、B、C 合并 → 一次 Render + 一次 Commit
```

### 4.2 React 18 的自动批量更新

React 18 之前（React 17），批量更新只在 React 事件处理函数中生效。Promise、`setTimeout`、原生事件监听器中的更新**不会自动批量处理**：

```jsx
// React 17 行为
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1) // → 触发 Render
    setName('Alice') // → 触发另一个 Render
    // 两次 Render，而非一次！
  }, 0)
}
```

**React 18 统一了批量更新行为**——无论在什么上下文中，多次 `setState` 都会被自动合并：

```jsx
// React 18 行为（使用 createRoot）
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1) // }
    setName('Alice') // } → 一次 Render
    // Promise、setTimeout、原生事件中都自动批量
  }, 0)
}
```

这是因为 React 18 使用**微任务级别的调度**来收集同一 tick 内的所有更新。

### 4.3 flushSync：退出批量更新

有时需要**立即同步应用更新**并读取更新后的 DOM：

```jsx
import { flushSync } from 'react-dom'

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1)
  })
  // 此时 count 已经更新，DOM 已经同步变更

  console.log(ref.current.textContent) // 可以读到最新值

  // 注意：flushSync 会破坏批量更新的优化
  // 应尽量避免使用，仅在迫不得已时（如需要同步读取 DOM）
}
```

|              | 正常批量更新       | `flushSync`                |
| ------------ | ------------------ | -------------------------- |
| **执行方式** | 异步调度，合并更新 | 同步执行，立即渲染         |
| **性能**     | 高（合并 Render）  | 低（每次都单独 Render）    |
| **调度能力** | 支持优先级和中断   | 绕过调度器                 |
| **适用场景** | 99% 的场景         | 同步读取 DOM、第三方库集成 |

### 4.4 批量更新的实现原理

```javascript
// 简化版批量更新的执行上下文
let isBatchingUpdates = false
let batchUpdates = []

function batchedUpdates(fn) {
  isBatchingUpdates = true
  fn() // 执行事件处理函数
  isBatchingUpdates = false

  // 所有 setState 都收集完毕，开始一次 Render
  flushBatchUpdates()
}

function scheduleUpdate(fiber) {
  if (isBatchingUpdates) {
    // 当前处于批量上下文，只收集不执行
    batchUpdates.push(fiber)
  } else {
    // 不在批量上下文中，直接调度
    scheduleWork(fiber)
  }
}
```

## 5. 不同更新来源的批量行为

| 更新来源                     | React 17  | React 18（createRoot） |
| ---------------------------- | --------- | ---------------------- |
| React 事件处理（onClick）    | ✅ 批量   | ✅ 批量                |
| `setTimeout` / `setInterval` | ❌ 不批量 | ✅ 批量                |
| Promise `.then()`            | ❌ 不批量 | ✅ 批量                |
| 原生事件监听                 | ❌ 不批量 | ✅ 批量                |
| `async/await`                | ❌ 不批量 | ✅ 批量                |
| `flushSync`                  | —         | ❌ 显式退出批量        |

```jsx
// React 18 中，以下所有场景都自动批量更新
async function handleSave() {
  const data = await fetch('/api')
  setLoading(false) // }
  setData(data) // } → 一次 Render
  setError(null) // }
}
```

## 6. Class 组件的 setState 与 Hooks 的对比

|                | Class `setState`              | Hooks `useState`           |
| -------------- | ----------------------------- | -------------------------- |
| **合并策略**   | 自动浅合并对象                | 替换整个值（不合并）       |
| **回调**       | `setState(partial, callback)` | 无回调（用 `useEffect`）   |
| **函数式更新** | ✅ `setState(prev => ...)`    | ✅ `setState(prev => ...)` |
| **批量更新**   | ✅ React 事件中自动           | ✅ React 18 所有上下文自动 |

```jsx
// Class setState：自动浅合并
this.setState({ name: 'Alice' }) // 合并到现有 state 对象
// state = { ...oldState, name: 'Alice' }

// Hooks useState：替换整个值
const [state, setState] = useState({ name: '', age: 0 })
setState({ name: 'Alice' }) // { name: 'Alice' } —— age 丢失了！
setState(prev => ({ ...prev, name: 'Alice' })) // ✅ 正确
```

## 7. 总结

- **状态更新不直接修改变量**，而是创建 Update 推入队列，由协调器在下一轮 Render 中消费。
- **Update 构成环形链表**，O(1) 插入，从任意位置遍历。
- **队列消费对 Lane 敏感**：高优先级跳过，低优先级保留，保证更新不丢失。
- **函数式更新（`prev => prev + 1`）基于前一个 Update 结果**，适合连续更新。
- **React 18 实现了全局自动批量更新**：无论在什么上下文中，setState 都会合并到一次 Render。
- **`flushSync` 强制同步执行，退出批量模式**，应用场景极少，会牺牲调度能力。
- **Class setState 自动浅合并对象，useState 替换整个值**，这是两者在 API 语义上的关键差异。
