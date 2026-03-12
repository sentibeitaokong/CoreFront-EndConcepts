---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **`useDebugValue`：自定义 Hook 的专属“透视眼”**

## 1. 核心概念与痛点背景

> **痛点场景：迷失在 React DevTools 中的状态**
> 假设你写了一个强大的自定义 Hook `useOnlineStatus` 来检测用户的网络是否在线，它的底层是由两个 `useState` 组成的。
> 当你在业务组件里调用了 `const isOnline = useOnlineStatus()`，然后打开浏览器 F12 的 React DevTools 插件去检查这个组件时。
> 你在右侧面板只会看到极其冰冷的：
> `Hooks`
> ├── `State: true`
> └── `State: false`
> 
> **你根本不知道这俩毫不相干的布尔值，到底代表着哪一个具体的底层状态！**

**`useDebugValue` 就是为了撕开这个黑盒而诞生的。** 
它的唯一使命是：**在 React DevTools 插件中，为你自己手写的 Custom Hook 添加一个清晰、具有高可读性的自定义标签（Label），让你在调试时一目了然。**

## 2. 核心 API 实战

`useDebugValue` 的用法极其简单，但它**只能在自定义 Hook 的顶层调用**。如果在普通的函数组件里调用它，React 会直接无视它。

### 2.1 基础实战：给 Hook 贴上明确的标签

```jsx
import { useState, useEffect, useDebugValue } from 'react';

// 这是一个极其典型的自定义 Hook
export function useOnlineStatus() {
  // 此时浏览器是联网的
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🚀 核心魔法：使用 useDebugValue 暴露当前状态！
  // 这个字符串/变量，将会在 React DevTools 中紧紧跟在 useOnlineStatus 的名字后面显示。
  useDebugValue(isOnline ? '🟢 在线' : '🔴 断网');

  return isOnline;
}
```

**效果震撼对比**：
当你在 `App` 组件里使用了这个 Hook，打开 React DevTools 选中 `App` 时：
*   **没加 `useDebugValue` 前**：面板只显示 `State: true`，鬼知道它是谁。
*   **加了 `useDebugValue` 后**：面板会极其醒目地显示一条专属数据：**`OnlineStatus: "🟢 在线"`**。排查 Bug 的效率瞬间拉满！

### 2.2 高阶实战：延迟格式化 (防性能反噬)

有些时候，你想在 DevTools 里展示的信息需要经过极其复杂的计算（比如遍历一个包含一万个节点的深层对象，把它格式化成一段漂亮的字符串）。

如果你直接写 `useDebugValue(formatSuperBigData(date))`。
**灾难发生了**：即使你根本没有打开 React DevTools 面板，只要组件一重渲染，这个巨耗时的 `formatSuperBigData` 函数依然会被老老实实地执行一遍，白白榨干用户的 CPU！

为了防止这种悲剧，`useDebugValue` 提供了**极其聪明的第二个参数（格式化函数）**。

```jsx
import { useState, useDebugValue } from 'react';

// 这是一个极度耗时的格式化函数
function formatSuperBigDateToHumanReadable(dateObj) {
  console.log('执行了极其耗时的日期格式化计算...');
  // 假设这里有一万行非常复杂的各种时区、历法转换逻辑
  return dateObj.toISOString(); 
}

export function useSpecialDate() {
  const [date, setDate] = useState(new Date());

  // 🚀 核心魔法 2：传入第二个回调参数！
  // React 极其聪明：只有当你按下 F12，真正打开了 React DevTools 面板去盯着这个组件看时，
  // 它才会把你传入的 date 喂给第二个函数，执行这个耗时的格式化计算并展示！
  // 在普通用户的浏览器里（没开调试工具），这段耗时计算绝对不会被执行，性能完美保障！
  useDebugValue(date, dateObj => formatSuperBigDateToHumanReadable(dateObj));

  return date;
}
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么我在代码里写了 `useDebugValue`，页面上却什么都没变？
*   **答**：这是一个经典的“表错情”误区。
    *   `useDebugValue` 绝对没有任何操纵真实 DOM、改变业务逻辑、或者在页面上打印日志的能力。
    *   它的数据**唯一且只显示在浏览器开发者工具（F12）的 `React DevTools` 插件的 Components 审查面板中**。如果你没装这个插件，或者没打开控制台，这个 Hook 等同于空气。

### 3.2 我应该在每一个自定义 Hook 里都加上 `useDebugValue` 吗？
*   **答**：**官方极其不推荐这种“脱裤子放屁”的做法。**
    *   如果你的自定义 Hook 极其简单，比如 `useCounter`，里面只是包装了一个普通的数字 `count`。React DevTools 本来就能很清晰地把这个数字显示在 State 栏里，你再加个 `useDebugValue` 纯属画蛇添足。
    *   **黄金准则**：`useDebugValue` **仅且只适用于**作为那些“共享的、高度封装的、内部状态极其复杂的开源基础 Hook 库”（比如你写了一个给全公司 100 个人用的 `useForm` 或者开源了像 `react-use` 这样的库）提供友好的底层探查接口时使用。对于纯业务级别的简单 Hook，无需劳神去写。

### 3.3 我把 `useDebugValue` 写在了普通的函数组件（如 `<App />`）里，为什么报错了？
*   **答**：**这是严格的领地限制。**
    *   `useDebugValue` 只能被调用在**顶层作用域的自定义 Hook 内部**（也就是函数名以 `use` 开头的函数中）。
    *   如果在普通组件（返回 JSX 的函数）中调用，React Linter 会直接报警，并且由于它并没有“附着”在某个具体的抽象概念（Custom Hook）上，即便你强行运行，DevTools 也不知道该把它挂在谁的名下展示，毫无意义。

### 3.4 它可以接收多个值吗？
*   **答**：**不能直接在一个调用里传多个值，但可以多次调用。**
    *   如果你想在一个 Hook 里同时展示“请求状态”和“当前网络状态”两个维度的调试信息。
    *   你可以合法地写两个：
        ```jsx
        useDebugValue(isFetching ? '加载中' : '已完成');
        useDebugValue(isOnline ? '联网' : '断网');
        ```
    *   在 DevTools 里，它们会被组织成一个数组清晰地并列展示出来。
