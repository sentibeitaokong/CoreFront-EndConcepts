---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useDeferredValue`](https://zh-hans.react.dev/reference/react/useDeferredValue)：响应式性能防线**

## 1. 核心概念：让慢速组件“慢下来”

> **痛点场景：**
> 如果让耗时组件同步接收输入框的每一个字母，由于 JS 是单线程的，浏览器会忙于渲染那个巨型列表，导致你的输入框瞬间变得极其卡顿，字母敲半天出不来。

**`useDeferredValue` 的绝杀招：**
它允许你基于一个“高优值”创建一个**“低优副本”**（延迟值）。
* **第一优先级**：React 会立即响应高优值的变化，渲染输入框，保证打字丝滑。
* **第二优先级**：React 会在后台**偷偷、异步**地去尝试更新那个“低优副本”。
* **中断机制**：如果在这个偷偷计算的过程中，你又敲了一个新字母，React 会**果断丢弃**刚才还没算完的中间状态，直接开启新一轮的后台计算。

## 2. 核心 API 实战

### 2.1 基础实战：拯救搜索过滤卡顿

这是 `useDeferredValue` 最经典的实战案例。

```jsx
import { useState, useDeferredValue, memo } from 'react';

// 1. 必须使用 memo 包裹昂贵的子组件！(详见下方 FAQ)
const SlowList = memo(({ text }) => {
  console.log('--- 极其沉重的列表渲染执行了 ---');
  const items = [];
  for (let i = 0; i < 5000; i++) {
    items.push(<li key={i}>ID: {i} - 搜素内容: {text}</li>);
  }
  return <ul>{items}</ul>;
});

export default function SearchPage() {
  // 核心状态：绑定输入框，必须最高优先级响应
  const [query, setQuery] = useState('');

  // 🚀 核心魔法：创建 query 的低优副本！
  // deferredQuery 的更新会被 React 自动延后到 CPU 空闲时执行
  const deferredQuery = useDeferredValue(query);

  return (
    <div className="container">
      {/* 这里的打字体验永远保持 100% 的丝滑，因为 setQuery 是紧急的 */}
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="快速输入测试性能..." 
      />

      {/* 2. 🚨 重点：慢速组件吃的是延迟过后的值 deferredQuery */}
      {/* 这样 SlowList 就不会卡死 input 了 */}
      <div style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
        <SlowList text={deferredQuery} />
      </div>
    </div>
  );
}
```

**运行效果：**
当你疯狂敲击键盘时，输入框的内容会飞速更新。你会发现底下的列表变得**半透明（因为 `query !== deferredQuery`）**且内容暂时没有变。当你停手几百毫秒后，列表会突然刷新成最新的内容。

## 3. `useDeferredValue` 与 `useTransition` 的终极对比

这两个 Hook 都在解决卡顿，但应用层面有本质区别：

| 对比维度 | `useTransition` (控制动作) | `useDeferredValue` (控制数据) |
| :--- | :--- | :--- |
| **你手里有什么？** | 你手里攥着修改状态的**遥控器 (`setXxx`)**。 | 你手里只接到了父组件传给你的**那个值 (`props.value`)**。 |
| **逻辑形态** | 包裹的是一个**函数闭包**。 | 包裹的是一个**具体的变量**。 |
| **使用场景** | 当你有权限控制 `onChange` 事件内部如何触发状态更新时。 | 当你封装一个第三方组件，无法控制别人传给你什么数据，只能在内部被动自救时。 |
| **指示器** | 自带 `isPending` 状态位。 | 只能通过手动比对 `value !== deferredValue` 来判断是否在延迟中。 |

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我用了 `useDeferredValue`，列表还是把输入框卡死了？
*   **答**：这是新手 90% 都会掉进去的陷阱：**你忘记给耗时子组件加 `React.memo` 了！**
    *   **原理剖析**：当 React 尝试处理“低优副本”的更新时，它会触发组件的重渲染。
    *   如果你没有给子组件包 `memo`，那么在**第一阶段（高优渲染）**，虽然你传的是老值 `deferredQuery`，但由于父组件函数重新执行了，子组件还是会被**无条件连带渲染一遍**！
    *   这次连带渲染是**同步且高优的**，它会瞬间把你的 CPU 占满，导致 `useDeferredValue` 彻底失去作用。
    *   **铁律**：使用 `useDeferredValue` 时，接收该值的子组件**必须配套使用 `React.memo`！**

### 4.2 这个 Hook 本质上就是前端防抖 (Debounce) 或节流 (Throttle) 吗？
*   **答**：**绝对不是。它的设计比防抖高级得多。**
    *   **防抖的缺陷**：防抖是硬编码的死等（比如固定等 300ms）。不管你的电脑是超级顶配还是 10 年前的破电脑，它都得等 300ms。且防抖在执行的那一刻，依然是同步阻塞的。
    *   **useDeferredValue 的神级逻辑**：它是**自适应的**。
        *   如果用户的电脑配置极高，计算很快，延迟值会几乎同步更新，没有任何等待感。
        *   如果电脑很破，延迟会自动拉长。
        *   最重要的是，它是**可中断的**。如果在渲染中途用户又打了新字，React 会立刻掐断当前的计算，不浪费一丁点无意义的性能。这是传统防抖绝对做不到的。

### 4.3 我能在一个组件里同时给 10 个变量都套上 `useDeferredValue` 吗？
*   **答**：**极度不推荐。**
    *   每一个 `useDeferredValue` 都会产生一轮额外的并发调度开销。
    *   如果页面上有大量的变量都在排队等待“延迟更新”，这会把 React 的任务调度引擎搞得极其混乱，甚至可能导致逻辑上的顺序错误（撕裂感）。
    *   **最佳实践**：只针对那个**真正引发严重性能瓶颈的数据点**进行延迟处理。

### 4.4 为什么我不直接在 `useEffect` 里用 `setTimeout` 来延迟更新呢？
*   **答**：这就是“刀耕火种”与“工业革命”的区别。
    *   `setTimeout` 属于外部副作用，它完全游离在 React 的并发渲染架构之外。
    *   它无法感知到渲染是否还有效，无法在中途撤回任务，更无法实现“时间切片”让主线程喘息。
    *   `useDeferredValue` 是**深度集成在 React Fiber 引擎内部的优先级策略**，它能保证 UI 的一致性和最高的调度效率。
