---
outline: [2,3]
---

# **`useTransition`:并发特性**

## 1. 核心概念：紧急与非紧急更新

在 React 18 之前，所有的状态更新都被视为“紧急更新”。这意味着，如果你在一个复杂的页面中同时更新了搜索框的文字和数万条数据的列表过滤，耗时的列表渲染会直接“锁死”主线程，导致搜索框打字出现明显的卡顿。

**`useTransition`** 的引入，正式在 React 引擎中建立了一套**优先级调度机制**。它允许开发者显式地告诉 React：“某些状态更新是不紧急的，你可以先让位给高优先级的交互（如输入、点击），在后台空闲时再去处理这些慢更新。”

## 2. API 语法与返回值铁律

`useTransition` 返回一个包含两个成员的数组，每个成员都承担着特定的并发控制职责。

| 返回成员 | 类型 | 核心职责 |
| :--- | :--- | :--- |
| **`isPending`** | `boolean` | **视觉状态指示器**。当过渡更新正在后台进行（尚未完成渲染）时，其值为 `true`。你可以利用它给用户展示 Loading 状态或降低旧界面的透明度。 |
| **`startTransition`** | `Function` | **执行器**。接受一个回调函数，你需要在该回调中调用耗时的 `setState`。被包裹的更新会被标记为“过渡更新”。 |

### 2.1 startTransition 的执行机制
使用 `startTransition` 时，必须理解它的调度逻辑，否则会导致优化失效：

```javascript
const [isPending, startTransition] = useTransition();

const handleChange = (e) => {
  // 1. 紧急更新：必须立即反馈在 UI 上
  setInputValue(e.target.value);

  // 2. 非紧急更新：告诉 React 这个更新可以稍后处理，且过程可被中断
  startTransition(() => {
    setFilterTerm(e.target.value); 
  });
};
```

## 3. 实战案例：极致流畅的万级列表过滤

在处理复杂大数据展示时，`useTransition` 配合 `useMemo` 是解决掉帧的终极方案。

```jsx
import React, { useState, useTransition, useMemo } from 'react';

// 模拟一个包含 20,000 条数据的巨大列表
const hugeData = Array.from({ length: 20000 }, (_, i) => `Product - ${i}`);

function PerformanceDemo() {
  const [query, setQuery] = useState('');       // 紧急状态
  const [deferredQuery, setDeferredQuery] = useState(''); // 过渡状态
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e) => {
    // 立即反馈输入框
    setQuery(e.target.value);

    // 将耗时的过滤操作降级
    startTransition(() => {
      setDeferredQuery(e.target.value);
    });
  };

  // 只有当非紧急状态 deferredQuery 变化时，才会重新计算过滤
  const filteredList = useMemo(() => {
    return hugeData.filter(item => item.includes(deferredQuery));
  }, [deferredQuery]);

  return (
    <div style={{ padding: '20px' }}>
      <input 
        value={query} 
        onChange={handleSearch} 
        placeholder="搜索万级列表..."
        style={{ padding: '8px', width: '300px' }}
      />

      {/* 使用 isPending 提供反馈 */}
      {isPending && <span style={{ marginLeft: '10px', color: '#666' }}>正在后台计算...</span>}

      <ul style={{ 
        opacity: isPending ? 0.4 : 1, 
        transition: 'opacity 0.2s', // 平滑过渡
        maxHeight: '400px', 
        overflowY: 'auto' 
      }}>
        {filteredList.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
```

## 4. 技术方案对比：useTransition vs useDeferredValue

两者都服务于并发渲染，但应用的角度完全对称。

| 特性 | useTransition | useDeferredValue |
| :--- | :--- | :--- |
| **控制对象** | **控制“写” (Setter)**。你控制何时触发状态更新。 | **控制“读” (Value)**。你接收一个值，并希望得到它的延迟版本。 |
| **适用场景** | 你有权限访问 `setCount` 这种更新函数时。 | 你只拿到了 `props` 或计算结果，无法控制源头更新时。 |
| **状态反馈** | 自带 `isPending`，无需额外逻辑。 | 不带状态，需手动比对 `value !== deferredValue` 来判断。 |

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么我把 `fetch` 或 `setTimeout` 放在 `startTransition` 里没效果？
*   **答**：这是一个极其普遍的认知误区。
    *   **真相**：`startTransition` **只能包裹状态更新函数 (setXxx)**。它无法将异步请求本身标记为低优先级。
    *   如果你在里面写了异步代码，React 将无法同步捕获到其中的状态更新，导致优化完全失效。
    *   **错误写法**：`startTransition(() => { setTimeout(() => setX(1), 100) })` —— 无效。

### 5.2 `useTransition` 与防抖 (Debounce) 相比，优势在哪里？
*   **答**：防抖是“死等”，`useTransition` 是“智能调度”。
    *   **防抖/节流**：无论用户设备多快，都必须强行等待 300ms 才能执行。这是一种对高性能设备的性能浪费。
    *   **useTransition**：它是**响应式**的。如果用户设备快，React 会立即处理；如果设备慢或正在处理高优任务，它会自动延后。更重要的是，它是**可中断的**——如果后台渲染到一半用户又输入了新字符，React 会丢弃旧任务直接开始新任务，而防抖无法取消已经发出的计算。

### 5.3 为什么标记了 Transition 后，页面渲染次数好像变多了？
*   **答**：这是正常现象。
    *   为了实现 `isPending` 的反馈，React 必须进行**两次渲染**。
    *   **第一次渲染**：同步触发。React 将 `isPending` 设为 `true`，并渲染当前紧急状态下的 UI（此时耗时的状态还没变）。
    *   **第二次渲染**：在后台异步触发。React 处理被包裹的耗时状态更新，完成后将 `isPending` 设为 `false`。

### 5.4 我可以把所有的 `setState` 都包在 `startTransition` 里吗？
*   **答**：**绝对不可以！**
    *   如果你把像“输入框回显”、“下拉框展开”、“点赞按钮高亮”这种基础交互都降级，用户会感觉到明显的“软件不跟手”或操作滞后感。
    *   **准则**：只对那些**确实会导致 UI 阻塞超过 100ms** 的重度计算或大规模 DOM 渲染使用该 Hook。

### 5.5 `startTransition` 的回调函数是异步的吗？
*   **答**：**不是，它是同步执行的。**
    *   React 会立即执行 `startTransition` 里的回调函数。在执行期间，所有被触发的 `setXxx` 都会被贴上一个“Transition”标签。等回调执行完后，React 才会根据这些标签去调度后台渲染。不要试图在里面写 `async/await`。