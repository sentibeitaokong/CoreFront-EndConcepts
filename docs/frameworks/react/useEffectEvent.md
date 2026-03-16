---
outline: [2,3]
---

# **[useEffectEvent](https://zh-hans.react.dev/reference/react/useEffectEvent):`Effect`专属的“事件处理函数”**

::: warning 实验性特性
`useEffectEvent` 目前仍处于 React 的 **Experimental（实验性）** 频道中。在稳定版 React（如 18.2.0）中尚不可用，预计将在未来版本中正式发布。
:::

## 1. 核心背景：Effect 的“反应性”困境

在 React 的 `useEffect` 中，我们经常面临一个两难的境地：某个逻辑需要用到最新的 Props 或 State，但我们**不希望**当这些值变化时重新触发 Effect 的执行。

> **痛点场景:**
> 假设你有一个聊天室,当用户进入时发送一个日志.日志需要包含当前的“主题”。
> *   如果你把 `theme` 放入 `useEffect` 的依赖数组，那么用户每切换一次主题，就会触发一次“进入聊天室”的日志，这显然是错误的。
> *   如果你不把 `theme` 放入依赖数组，那么日志里记录的将永远是初始值，这又是过时的。

**`useEffectEvent` 的使命**：它允许你将逻辑从 Effect 中提取出来，使其能够读取最新的状态，但**不再具有反应性**（即它的变化不会导致 Effect 重新运行）。

## 2. API 语法与使用规范

`useEffectEvent` 接受一个函数作为参数，并返回一个该函数的增强版本。

```js
const onSomething = useEffectEvent(callback)
```

| 特性 | 说明 |
| :--- | :--- |
| **定义位置** | 必须在组件函数的顶层定义。 |
| **执行时机** | 只能在 `useEffect` 或 `useLayoutEffect` 内部被调用。 |
| **反应性** | **非反应性**。它永远不会出现在 `useEffect` 的依赖数组中。 |
| **状态获取** | 内部永远能获取到调用那一刻的 **最新** Props 和 State。 |

**基础代码对比**

```jsx
// ❌ 传统写法：逻辑耦合
useEffect(() => {
  logVisit(roomId, theme); // theme 变了，这里会重新运行，导致逻辑错误
}, [roomId, theme]);

// ✅ useEffectEvent 写法：逻辑解耦
const onVisit = useEffectEvent((roomId) => {
  logVisit(roomId, theme); // 永远能拿到最新的 theme，但 theme 变了不会触发 Effect
});

useEffect(() => {
  onVisit(roomId);
}, [roomId]); // 只有 roomId 变了才会触发，theme 被排除在依赖之外
```

## 3. 实战案例：非阻塞式的日志记录

让我们通过一个完整的例子来看它如何优雅地解决复杂的依赖问题。

```jsx
import { useEffect } from 'react';
import { experimental_useEffectEvent as useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  // 定义一个 Effect Event
  // 它像是一个“黑洞”，能吸纳最新的环境数据，但不对外发出引力信号
  const onConnected = useEffectEvent(() => {
    console.log(`✅ 已连接到 ${roomId}`);
    console.log(`当前使用的 UI 主题是: ${theme}`); // 读取最新值
    showNotification("欢迎回来", theme);
  });

  useEffect(() => {
    // 建立连接
    const connection = createConnection(roomId);
    
    connection.on('connected', () => {
      // 在 Effect 内部调用 Event
      onConnected();
    });

    connection.connect();

    return () => connection.disconnect();
  }, [roomId]); // 注意：依赖数组里【不准】写 onConnected，也不用写 theme

  return <h1>欢迎来到 {roomId}</h1>;
}
```

## 4. 深度对比：useEffectEvent vs useCallback

这是最容易混淆的两个 Hook，它们的本质区别在于“身份（Identity）”的变化。

| 维度 | useCallback | useEffectEvent |
| :--- | :--- | :--- |
| **核心意图** | 缓存函数引用，减少子组件无效渲染。 | 提取非反应性逻辑，精简 Effect 依赖。 |
| **依赖数组** | **必须显式写依赖**。依赖变了，函数引用必变。 | **没有依赖数组**。函数引用在组件生命周期内永远不变。 |
| **调用位置** | 任何地方（子组件、事件处理函数等）。 | **仅限 Effect 内部调用**。 |
| **反应性** | 如果传给子组件或放入 Effect 依赖，具有反应性。 | 彻底切断反应性。 |

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么不能把 `useEffectEvent` 返回的函数传给子组件？
*   **答**：这是该 Hook 的安全限制。
    *   `useEffectEvent` 的设计初衷是处理“副作用中的非反应逻辑”。它在 React 内部的执行时机是与渲染周期绑定的。
    *   如果你把它传给子组件并在 `onClick` 中调用，由于它没有闭包快照保护，可能会引发难以调试的竞态条件。
    *   **准则**：它只能被 `useEffect` 消费。

### 5.2 我可以用 `useRef` 来模拟 `useEffectEvent` 吗？
*   **答**：**可以模拟，但不完美。**
    *   在 `useEffectEvent` 出现前，高级开发者常用 `useRef` 存储最新的函数来避开依赖检查。
    *   **缺点**：你需要手动在每次渲染时更新 `ref.current`，代码冗余且容易在 Concurrent（并发）模式下出现撕裂问题。
    *   `useEffectEvent` 是 React 官方提供的原生方案，底层处理了并发安全性。

### 5.3 为什么我的 Linter（插件）没报错让我把它加进依赖？
*   **答**：React 团队专门为 `useEffectEvent` 修改了 `eslint-plugin-react-hooks` 规则。
    *   Linter 能够识别 `useEffectEvent` 的特殊身份，并**禁止**你将其加入 `useEffect` 的依赖数组。这与 `useRef` 产生的 `ref` 对象行为一致。

### 5.4 什么时候该用它，什么时候该直接写在 Effect 里？
*   **答**：判断标准只有一条：**“这个值变化时，我希望副作用重新执行吗？”**
    *   **希望**：直接写在 Effect 内部，并把值加入依赖数组。
    *   **不希望，但我需要读取它的最新值**：使用 `useEffectEvent` 提取出来。

### 5.5 它可以像普通函数一样传参吗？
*   **答**：**是的。**
    *   它非常适合接收参数。最佳实践是在 `useEffect` 内部计算好一些即时变量，作为参数传给 `useEffectEvent`，而将那些长期存在的配置（如 `theme`, `url`）放在内部直接读取。