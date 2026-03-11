---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 自定义 Hooks(Custom Hooks)

## 1. 核心概念与演进哲学

> **官方定义**：
> 自定义 Hook 是一个普通的 JavaScript 函数，它的名称必须以 **`use`** 开头，并且它的函数内部**调用了其他的 React Hooks（如 useState, useEffect）**。

### 1.1 自定义 Hook 的本质特征
*   **状态隔离**：你在组件 A 和组件 B 里都调用了 `useCounter()`，它们在内存中生成的是**两份完全独立的 State 和 Effect**。它们只复用“逻辑行为”，绝不共享“数据状态”。
*   **高度内聚**：把与某一个功能相关的所有数据、定时器、事件监听全部打包在一个闭包里，组件代码瞬间变得极度清爽。
*   **黑盒测试**：它就是一个带副作用的 JS 函数，你可以脱离 UI，极其方便地对它进行单元测试。

## 2. 核心实战：从编写到高阶封装

### 2.1 基础实战：提取窗口宽高追踪 (useWindowSize)
这是一个最经典的新手案例，用于封装对原生 DOM 事件的监听，并处理组件卸载时的清理。

```jsx
// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

// 1. 命名必须以 use 开头
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // 2. 将原本散落在组件里的逻辑集中起来
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 3. 🚨 必须负责任地清理副作用！
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. 返回你想暴露给外部的数据 (推荐返回对象或数组，方便解构)
  return size;
}
```

在组件中的使用极其优雅：
```jsx
import { useWindowSize } from './hooks/useWindowSize';

export default function App() {
  const { width, height } = useWindowSize();
  return <div>当前窗口：{width} x {height}</div>;
}
```

### 2.2 进阶实战：支持响应式依赖的数据拉取 (useFetch)
业务中最常写的就是封装 `fetch` 请求。一个优秀的 Hook，必须能够响应外部参数的变化而自动重新请求。

```jsx
// src/hooks/useFetch.js
import { useState, useEffect } from 'react';

// 接收外部传来的依赖项 (如 userId)
export function useFetch(url, dependency) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // 防竞态与防泄漏标志

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // 组件卸载或依赖改变前，切断旧请求的 set 权限
    };
  }, [url, dependency]); // 🚨 依赖项极其关键：当 userId 改变时，自动重新执行请求！

  return { data, loading, error };
}
```

使用示例：
```jsx
function UserProfile({ userId }) {
  // 当 props 里的 userId 改变时，Hook 内部会自动重新发请求！
  const { data, loading } = useFetch(`/api/user/${userId}`, userId);
  
  if (loading) return <p>加载中...</p>;
  return <div>{data?.name}</div>;
}
```

## 3. 架构级实战：如何优雅地暴露 API

当你封装一个复杂的 Hook（比如 `useForm` 或 `useModal`）时，通常需要向外部暴露一堆操作方法。**如何防止这些方法导致使用者的页面疯狂重渲染？**

**黄金法则：在 Hook 内部 `return` 出去的所有函数，必须用 `useCallback` 严密包裹！**

```jsx
import { useState, useCallback } from 'react';

export function useModal(initialVisible = false) {
  const [isVisible, setIsVisible] = useState(initialVisible);

  // 🚨 必须使用 useCallback 锁死函数内存地址！
  // 否则这个 hook 每当 isVisible 改变重新执行时，这俩函数都会生成新指针，
  // 传给外部组件后，极易引发大面积的 React.memo 性能护盾崩溃。
  const open = useCallback(() => setIsVisible(true), []);
  const close = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);

  return {
    isVisible,
    open,
    close,
    toggle
  };
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么官方强行规定命名必须以 `use` 开头？写成 `get` 或 `create` 不行吗？
*   **答**：**绝对不行。这是 React Linter 的底线。**
    *   因为普通的工具函数（Utils）和 Hooks 在行为上有致命差异：**Hooks 是有状态的，且受限于 React 的底层链表调用顺序机制（Rules of Hooks）。**
    *   如果你写成 `myCustomHook()`。React 的代码扫描工具（Eslint Plugin）看到它，会以为它是普通函数，就不会去检查你是不是把它写在了 `if/else` 里面，也不会检查你是不是在普通 JS 函数里调用了它。
    *   一旦你起了 `useXxx` 的名字，Linter 就会立刻启动“最高警报级别”扫描，为你排除一切可能导致 React 底层链表错乱的违规调用。

### 4.2 我在一个页面里调用了两次 `useWindowSize()`，它会给 `window` 绑定两次 `resize` 事件吗？性能会不会很差？
*   **答**：**会绑定两次！**
    *   我们在前面提过，Hook 是物理隔离的。你调两次，就相当于在组件里原模原样写了两次 `useEffect`。它们各自维护自己的 state，各自去绑了一次原生事件。
    *   **架构优化**：如果某个底层全局资源极其昂贵（比如建立一个复杂的 WebSocket 链接对象），**绝不要在普通 Hook 里直接初始化**。
    *   你应该将这个昂贵资源用 **Context API** 提到应用最顶层作为单例 (Singleton) 管理，然后在自定义 Hook 内部使用 `useContext()` 去安全地共享它，而不是重复创建它。

### 4.3 我的 Hook 里使用了一个外部传进来的对象作为 `useEffect` 的依赖，结果疯狂死循环了！
*   **答**：这是使用自定义 Hook 最容易踩的陷阱，因为你无法控制别人传给你什么。
    *   **案发现场**：
        ```jsx
        // 你的组件：每次渲染都新建了一个 options 对象！
        const options = { id: 1 };
        useFetch('/api', options); 
        ```
        此时在你的 Hook 内部，`useEffect(fn, [options])` 会发现新旧指针不一样，疯狂重发请求，陷入光速死循环。
    *   **防坑指南 (作为 Hook 开发者)**：你永远不要信任外部传入的引用类型（对象/数组）。
        1. 可以在 Hook 内部使用 `JSON.stringify` 对其进行扁平化降维，拿字符串作为内部 Effect 的依赖。
        2. 强制要求使用者传入基本数据类型的依赖，或者要求他自己在外层用 `useMemo` 包好再传给你。
        3. 利用 `useRef` 保存旧值，手写深度比较（Deep Compare）逻辑（如知名开源库 `ahooks` 里的 `useDeepCompareEffect`）。

### 4.4 把逻辑封装成 Custom Hook 和写成 Pinia/Zustand 全局 Store 有什么本质区别？我该怎么选？
*   **答**：这个面试高级题直指核心架构能力。
    *   **Custom Hook (局部/多例模式)**：你每次在不同的组件里调用 `useMouse()`，它都会在内存里开辟一块**全新的、相互独立**的数据空间。组件 A 的坐标和组件 B 的坐标互不干扰。这适用于**纯逻辑复用**。
    *   **全局 Store (全局/单例模式)**：不管你在 100 个组件里调用了多少次 `useStore()`，底层都只会实例化一次，返回给你的永远是**指向内存中同一块地址的同一个对象**。这确保了只要一个人改了数据，100 个页面瞬间全部同步。这适用于**业务状态共享**（如购物车数据）。
