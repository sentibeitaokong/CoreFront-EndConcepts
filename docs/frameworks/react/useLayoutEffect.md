---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **`useLayoutEffect`：同步阻塞与视觉闪烁的终结者**

## 1. 核心概念与底层时序

> **使用 `useEffect` 会发生什么灾难？**
> 1. 浏览器第一帧：先按旧样式把页面画到屏幕上（用户看到了画面）。
> 2. `useEffect` 异步触发：量取了 DOM 尺寸，计算出新样式，调用 `setState`。
> 3. 浏览器第二帧：拿着新样式，重新把页面画一遍到屏幕上。
> **结果：用户肉眼会看到元素明显地“闪烁”或“跳动”了一下！体验极差。**

为了解决这个物理级的问题，React 提供了 **`useLayoutEffect`**。

| 对比维度 | `useEffect` (异步非阻塞) | `useLayoutEffect` (同步阻塞) |
| :--- | :--- | :--- |
| **触发时机** | 浏览器**完成**屏幕绘制 (Paint) **之后**。 | React 将 DOM 变动写进内存后，**但在浏览器把像素真正画到屏幕上之前！** |
| **是否阻塞渲染** | **否**。不会卡住画面展示。 | **是**。浏览器必须等它里面的代码彻底跑完，才会展示画面。 |
| **解决的核心痛点**| 绝大多数常规副作用（网络请求、绑事件）。 | **终结视觉闪烁 (FOUC)**，专治需要基于真实 DOM 尺寸进行二次排版的绝症。 |


## 2. 核心实战：终结 Tooltip 的位置闪烁

这是一个极其经典的实战场景。你做了一个带有箭头的 Tooltip（提示框），当鼠标悬浮在某个按钮上时，提示框要刚好出现在按钮的正上方。

但是，因为提示框里的文字长短不一，你必须先让它挂载到 DOM 里，量出它的实际高度，然后才能算出它准确的 `top` 坐标值。

### 2.1 失败案例：`useEffect` 导致的疯狂闪烁

```jsx
import { useState, useRef, useEffect } from 'react';

export default function BadTooltip({ targetRect }) {
  const tooltipRef = useRef(null);
  // 初始 top 为 0，这意味着它会先在屏幕最左上角(0,0)出现
  const [tooltipHeight, setTooltipHeight] = useState(0); 

  useEffect(() => {
    // 此时浏览器已经把 (0,0) 的提示框画在屏幕上了！用户已经看到了！
    const { height } = tooltipRef.current.getBoundingClientRect();
    // 量出高度后，再去更新 state。这会导致页面再次重绘，提示框瞬间瞬移到正确位置。
    // 肉眼会明显感觉到：提示框从左上角“飞”到了按钮上面！
    setTooltipHeight(height);
  }, []);

  let top = 0;
  if (targetRect !== null) {
    top = targetRect.top - tooltipHeight; // 计算正确的 Y 坐标
  }

  return (
    <div ref={tooltipRef} style={{ position: 'absolute', top: `${top}px`, left: '100px' }}>
      我是提示框内容，长短不一
    </div>
  );
}
```

### 2.2 完美解法：`useLayoutEffect` 锁定屏幕

```jsx
import { useState, useRef, useLayoutEffect } from 'react';

export default function GoodTooltip({ targetRect }) {
  const tooltipRef = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);

  // 🚀 仅仅是换了一个 Hook 名字！
  useLayoutEffect(() => {
    // 此时 React 刚刚把带文字的 <div> 塞进真实的 DOM 树内存里，但浏览器还没画屏幕。
    // 我们在这个极其关键的时间空隙，量出高度。
    const { height } = tooltipRef.current.getBoundingClientRect();
    
    // 触发 setState！
    // React 发现你还要改样式，它会把这个更新和上一次的 DOM 变更合并打包！
    // 然后指挥浏览器："现在，用最终算好的最新 top 值，一口气画到屏幕上！"
    // 用户第一眼看到的，就是完美定位在目标上方的提示框，毫无闪烁！
    setTooltipHeight(height);
  }, []);

  let top = 0;
  if (targetRect !== null) {
    top = targetRect.top - tooltipHeight;
  }

  return (
    <div ref={tooltipRef} style={{ position: 'absolute', top: `${top}px`, left: '100px' }}>
      我是提示框内容，长短不一
    </div>
  );
}
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 既然 `useLayoutEffect` 能防闪烁，我能不能把所有 `useEffect` 全换成它？
*   **答**：**绝对、立刻、马上打消这个念头！这是性能自杀行为。**
    *   **原因**：`useLayoutEffect` 是**同步阻塞**的。如果你在里面写了极其复杂的循环计算，或者某个操作耗时了 100 毫秒。那么浏览器在这 100 毫秒内，屏幕是**彻底死机白屏**的，什么也画不出来。
    *   而 `useEffect` 则是异步的，无论里面的计算多慢，浏览器都会优先把基础 UI 呈现给用户，用户至少知道页面没死。
    *   **架构铁律**：99.9% 的场景（发 Ajax、绑全局事件、甚至大部分不需要读真实尺寸的 DOM 操作）**永远首选 `useEffect`**。只有当你肉眼真切地看到了由于尺寸计算时差导致的元素“闪烁错位”时，才将那极个别的 Hook 替换为 `useLayoutEffect` 作为急救药。

### 3.2 为什么服务端渲染 (SSR, 如 Next.js) 时，控制台疯狂报 `useLayoutEffect` 的黄字警告？
*   **答**：这是使用该 Hook 最著名的坑。
    *   **警告内容**：`Warning: useLayoutEffect does nothing on the server...`
    *   **底层原因**：服务端渲染 (SSR) 是在 Node.js 环境里把 React 组件拼接成 HTML 字符串。Node.js 里**根本没有 DOM 树，更没有 getBoundingClientRect 这种测量 API**，也没有所谓的“浏览器 Paint 绘制”。
    *   因此，`useLayoutEffect` 在服务端是彻底废掉的，这会导致服务端吐出的 HTML 和客户端首次激活 (Hydration) 时算出的布局不一致。
    *   **终极避坑指南**：如果你在写会被 SSR 渲染的组件或开源库，并且必须使用它，业内标准的 Hack 做法是：判断当前运行环境，只在浏览器端使用 `useLayoutEffect`，在服务端降级为普通的 `useEffect`。

    ```jsx
    import { useLayoutEffect, useEffect } from 'react';

    // 判断当前是否是浏览器环境
    const canUseDOM = typeof window !== 'undefined' && typeof window.document !== 'undefined';

    // 封装一个极其安全的同构 Hook (Isomorphic Effect)
    export const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;

    // 在你的组件里统一使用这个安全的 Hook
    useIsomorphicLayoutEffect(() => {
      // 测量 DOM 尺寸...
    }, []);
    ```

### 3.3 我能在 `useLayoutEffect` 里发起 Axios 请求吗？
*   **答**：**可以，但这不仅毫无意义，且极其愚蠢。**
    *   `useLayoutEffect` 的初衷是阻塞浏览器的初次重绘以计算 DOM 布局。
    *   而 Axios 等网络请求是**异步**的。你即使在 `useLayoutEffect` 同步块里发了请求，代码执行也早就越过了请求往下走了，浏览器早就把屏幕画完了。
    *   等几十毫秒后请求回来，触发了 `setState`，依然是一次全新的渲染周期。你不仅没享受到防闪烁的好处，反而违背了 API 的设计初衷。
    *   **铁律**：**所有网络数据拉取，坚决放在 `useEffect` 里（或使用专门的 Data Fetching 库）。**
