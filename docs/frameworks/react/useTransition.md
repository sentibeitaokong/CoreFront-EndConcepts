---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useTransition`](https://zh-hans.react.dev/reference/react/useTransition):非阻塞 UI 与并发渲染的钥匙**

在 `React 18` 引入并发模式（`Concurrent Mode`）之前，React 的渲染是“单车道”且不可中断的。一旦开始渲染一个包含成千上万个节点的复杂组件，主线程就会被死死锁住，导致用户的输入、点击等操作毫无反应（页面卡死）。

`useTransition` 正是 React 赋予开发者调度“渲染优先级”的终极武器，它允许你将某些状态更新标记为“非紧急（过渡）”，从而保证用户交互的绝对流畅。

## 1. 核心概念与基础语法

```js
const [isPending, startTransition] = useTransition()
```

### 1.1 基本定义与返回值

`useTransition` 不需要传递任何参数。它返回一个包含两个元素的数组：
* **`isPending` (布尔值)**：告诉你这个被标记为过渡的任务**是否还在后台处理中**。常用于显示 Loading 提示。
* **`startTransition` (函数)**：这是一个包裹函数。把你的状态更新函数（`setState`）放进它的回调里，React 就会把这次更新降级为“非紧急”。

```jsx
import { useState, useTransition } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab) {
    // 告诉 React：“切换 Tab 是一个可以慢慢来的过渡任务，不要阻塞页面”
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div>
      <button onClick={() => selectTab('heavy-chart')}>查看复杂图表</button>
      {/* isPending 为 true 时，说明复杂图表正在后台疯狂渲染，此时可以给按钮加个菊花图 */}
      {isPending && <span> 正在加载庞大的视图...</span>}
    </div>
  );
}
```

## 2. 核心进阶：打断卡顿，保持 UI 响应

### 2.1 痛点场景：输入框连击导致的页面主线程阻塞

**痛点场景**：你有一个搜索框，下方是一个包含 10,000 条数据的列表。每次在搜索框打字，都要根据输入内容重新过滤并渲染这 10,000 条数据。如果你不使用并发特性，你在搜索框连续快速打字时，输入框会严重卡顿，甚至掉帧，因为每次按键都在等待下面 10,000 个 DOM 节点渲染完。

**解决原则**：**将状态一分为二。控制输入框显示的状态（紧急），和控制大列表渲染的状态（非紧急）。用 `startTransition` 包裹大列表的更新！**

```jsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [isPending, startTransition] = useTransition();
  
  // 1. 紧急状态：负责输入框的瞬间回显，绝不能卡顿
  const [inputValue, setInputValue] = useState('');
  // 2. 过渡状态：负责庞大列表的渲染，可以被打断和延后
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    const text = e.target.value;
    
    // ❌ 错误示范：把两个更新混在一起，React 会认为它们一样紧急。
    // 输入法打字会卡到怀疑人生，因为要等万条列表渲染完才能显示输入的字母。
    // setInputValue(text);
    // setSearchQuery(text); 

    // ✅ 黄金法则：分离优先级。
    // 第一步：立刻更新输入框状态（最高优先级）
    setInputValue(text);
    
    // 第二步：将列表的过滤查询标记为过渡（低优先级）
    startTransition(() => {
      setSearchQuery(text);
    });
  };

  return (
    <div>
      <input value={inputValue} onChange={handleChange} />
      {isPending ? <p>正在拼命搜索中...</p> : <HugeList query={searchQuery} />}
    </div>
  );
}
```

## 3. 高阶进阶：并发渲染的底层逻辑与禁区

### 3.1 为什么它能保持流畅？(Interruptible Rendering)

当你调用 `startTransition` 时，React 会在内存中开启一个“后台分支”去渲染那个庞大的 `<HugeList />`。

在这期间，如果用户在输入框里又敲了一个字母（触发了紧急的 `setInputValue`），**React 会立刻极其无情地直接丢弃后台正在渲染了一半的旧列表，马上回过头来处理输入框的显示，等输入框渲染完了，再用最新的搜索词重新开始渲染列表。** 这就是“可中断渲染”的魅力。

### 3.2 突破死穴：不能用于控制输入框的值 (Controlled Inputs)

**铁律：绝不能将控制表单输入框（`<input>`、`<textarea>`、`<select>`）的状态更新放进 `startTransition` 中！**

```jsx
const [text, setText] = useState('');

function handleChange(e) {
  // ❌ 致命错误：这会让你的输入框彻底坏掉！
  // 因为输入框期望你按键后立刻且同步地更新它的 value。如果被降级为过渡，
  // 用户的按键事件会和 React 的延迟更新发生严重的竞态冲突，导致光标乱跳或吞字。
  startTransition(() => {
    setText(e.target.value);
  });
}

return <input value={text} onChange={handleChange} />
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 `useTransition` 和我以前用的防抖 (Debounce) / 节流 (Throttle) 有什么区别？哪个好？
*   **答**：**这是维度的降维打击，`useTransition` 在渲染层面完胜防抖。**
    *   **防抖 (Debounce)**：本质是“死等”。设置了 500ms 防抖，用户打完字必须傻等 500ms 后才**开始**渲染列表。如果列表渲染本身需要 1 秒，那这 1 秒内页面依然是死机状态。
    *   **`useTransition`**：没有人为等待。用户打完字，React **立刻**开始在后台渲染列表。更强的是，渲染过程中如果用户继续打字，React 不会死机，而是打断渲染响应打字。它榨干了 CPU 的空闲性能，而不是强行让用户等待。

### 4.2 为什么我用了 `startTransition`，页面还是卡死了？
*   **答**：**React 的并发只能中断“组件的渲染”，无法中断“同步的 JavaScript 繁重计算”。**
    *   如果你在组件里写了一个耗时 3 秒的 `for` 循环（纯 CPU 原生计算，比如极其复杂的 `Array.sort` 或正则匹配），JavaScript 的主线程照样被锁死，React 毫无办法。
    *   **避坑方案**：`startTransition` 解决的是 **React 虚拟 DOM 计算和 DOM 挂载** 导致的卡顿。对于原生的重度 CPU 运算，你需要使用 Web Worker 将计算移出主线程。

### 4.3 可以把异步请求 (`await fetch`) 放在 `startTransition` 的回调里吗？
*   **答**：**在 React 18 中不行，在 React 19 中可以。**
    *   **React 18**：`startTransition` 的回调必须是**同步**的。你必须先把 `await fetch` 拿到的数据存下来，然后只把 `setState(data)` 这一步包在 `startTransition` 里。
    *   **React 19 (最新)**：官方全面引入了异步转换（Async Transitions）。你可以直接把完整的 `async` 操作放进去，`isPending` 会极其智能地等待你的网络请求完成，并且等待后续的组件渲染也完成，在此期间一直保持 `true` 状态，极大简化了全链路的 Loading 状态管理。

### 4.4 我想把路由跳转做成过渡效果，可以用它吗？
*   **答**：**可以，但这通常不需要你手动写。**
    *   现代的 React 路由库（如 React Router v6.4+、Next.js App Router）内部已经深度集成了并发特性。当你在这些框架中调用 `navigate()` 切换页面时，它们底层默认就是包裹在 `startTransition` 中的，这意味着路由跳转天生不会阻塞当前页面的交互。
