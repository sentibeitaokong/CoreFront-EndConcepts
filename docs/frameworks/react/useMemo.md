---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useMemo`](https://zh-hans.react.dev/reference/react/useMemo)：计算缓存与引用锁**

## 1. 核心概念与痛点背景

在 React 的函数组件中，每一次状态 (State) 改变导致重新渲染时，**组件函数内部的所有代码都会从头到尾被重新执行一遍。**

**`useMemo`的核心作用是：**在多次渲染之间，缓存（Memoize）一个昂贵计算的结果，或者锁死一个引用类型（对象/数组）的内存地址。**

## 2. 核心 API 实战：计算缓存与引用锁定

`useMemo` 接收两个参数：
* **一个工厂函数（必须有 `return` 返回值）**，React 会在渲染期间执行它，并把返回值缓存起来。
* **依赖数组 (Dependencies Array)**。逻辑与 `useEffect` 相同，只有当数组里的依赖项发生物理改变时，工厂函数才会重新执行。

### 2.1 跳过昂贵的重新计算 (Expensive Calculations)

这是最符合 `useMemo` 字面意思的用法。

```jsx
import { useState, useMemo } from 'react';

// 模拟一个极度消耗 CPU 的计算函数
function filterAndSortData(data, searchKeyword) {
  console.log('--- 极其耗时的全量过滤排序执行了 ---');
  // 假设这里有一万条数据要处理
  return data
    .filter(item => item.name.includes(searchKeyword))
    .sort((a, b) => a.id - b.id);
}

export default function DataDashboard({ rawData }) {
  const [keyword, setKeyword] = useState('');
  const [theme, setTheme] = useState('light');

  // 🚨 核心魔法：使用 useMemo 缓存计算结果！
  const processedData = useMemo(() => {
    return filterAndSortData(rawData, keyword);
  }, [rawData, keyword]); // 只有当 rawData 或 keyword 变了，才重新计算！

  return (
    <div className={`theme-${theme}`}>
      {/* 这里的点击会导致组件重渲染。但因为 theme 不在依赖数组里，
          processedData 会直接返回上一次的缓存结果，绝不重新执行耗时计算！ */}
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换毫无相关的主题 (瞬间完成)
      </button>

      <input 
        value={keyword} 
        onChange={e => setKeyword(e.target.value)} 
        placeholder="搜索数据" 
      />

      <Chart data={processedData} />
    </div>
  );
}
```

### 2.2 跳过组件重渲染 (锁死对象指针) 🌟 最常用！

这往往是初级向高级进阶的必修课。配合 `React.memo` 阻断子组件的渲染击穿。

```jsx
import { useState, useMemo, memo } from 'react';

// 1. 子组件被 memo 包裹，拥有了"属性浅比较"的防御能力
const HeavyChart = memo(({ config }) => {
  console.log('--- ECharts 重新初始化了 ---');
  return <div>复杂的图表</div>;
});

export default function App() {
  const [count, setCount] = useState(0);

  // ❌ 灾难写法：每次 App 渲染，这都是一个【全新内存地址】的对象！
  // HeavyChart 的 memo 护盾会被瞬间击穿！
  // const chartConfig = { color: 'red', type: 'pie' };

  // ✅ 黄金写法：用 useMemo 死死锁住这个对象的内存地址！
  const chartConfig = useMemo(() => {
    return { color: 'red', type: 'pie' };
  }, []); // 依赖为空，该对象指针在整个组件生命周期内永远不死

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>加数: {count}</button>
      
      {/* 此时随便点加数，HeavyChart 绝对稳如泰山，不会重渲染！ */}
      <HeavyChart config={chartConfig} />
    </div>
  );
}
```

### 2.3 作为其他 Hook 的安全依赖

如果你的 `useEffect` 需要依赖一个组件内部生成的对象或数组，不加 `useMemo` 会直接导致无限死循环。

```jsx
function UserProfile({ userId }) {
  // 如果不用 useMemo，每次渲染 queryParams 都是新地址，
  // 会导致下方的 useEffect 陷入光速死循环的重渲染泥潭！
  const queryParams = useMemo(() => {
    return { id: userId, includeAvatar: true, _t: Date.now() };
  }, [userId]); 

  useEffect(() => {
    fetchUserData(queryParams);
  }, [queryParams]); // 安全作为依赖传入

  return <div>...</div>;
}
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 既然 `useMemo` 能让性能变好，我是不是该把所有定义的变量全包起来？
*   **答**：**这是被官方严厉点名批评的“反模式 (Anti-pattern)”！**
    *   **性能账本**：`useMemo` 本身是要花钱（消耗性能）的。它需要在每次渲染时开辟闭包空间，并且要循环遍历你的依赖数组，去用 `Object.is()` 做比对。
    *   **亏本买卖**：如果你只是计算 `const total = a + b` 或者定义一个极小的普通数组 `const arr = [1, 2, 3]`。你为了省下这 `0.01ms` 的执行时间，却让 React 花了 `0.05ms` 去执行 `useMemo` 的底层调度，你的应用反而变得更卡了！
    *   **黄金准则**：只有满足以下两个条件**之一**时才用：
        1. 内部的计算函数确实极度耗时（比如循环一万次、极复杂的正则匹配等）。
        2. 它返回的对象/数组，被作为一个 Prop 传给了被 `React.memo` 保护的子组件，或者被当作了 `useEffect` 的依赖。

### 3.2 为什么我用了 `useMemo`，但数据好像没有被缓存，每次还是重新执行了？
*   **答**：通常是因为你的依赖数组里，混入了**“每次渲染都会换地址”的引用类型**。
    *   **案发现场**：
        ```jsx
        // options 每次都会换新地址
        const options = { filter: 'active' }; 
        
        // useMemo 一查依赖，发现 options 变了，于是大喊“缓存失效”，重新执行了耗时函数！
        const data = useMemo(() => compute(options), [options]); 
        ```
    *   **解法**：你要么把 `options` 也用一个外层的 `useMemo` 包起来，要么直接把它解构，把基本数据类型放进依赖里：`[options.filter]`。

### 3.3 我可以在 `useMemo` 的回调函数里去调用 `setState` 吗？
*   **答**：**绝对不可以！这是极其危险的灾难行为。**
    *   **原理机制**：`useMemo` 传入的回调函数，是在**组件的“渲染期间 (Render Phase)”同步执行的**。
    *   React 严格禁止在渲染期间直接执行副作用（如发请求、修改 DOM、甚至调用 `setState` 引发二次渲染）。
    *   如果你在里面写了 `setState`，会立刻触发又一次渲染，进而再次触发 `useMemo` 的回调，进而再次 `setState`，瞬间引发 **Maximum update depth exceeded (爆栈死循环)**。所有的状态修改（副作用）必须老老实实去 `useEffect` 里做。

### 3.4 Vue 里有个 `computed`，React 的 `useMemo` 和它是一回事吗？
*   **答**：思想上高度相似，但**易用性和底层机制天差地别**。
    *   **Vue 的 `computed`**：是自动挡的魔法。你不需要写恶心的依赖数组，Vue 会借助响应式 Proxy 系统，自动精确侦测到你在计算函数里用到了哪些变量，自动完成依赖收集和缓存刷新。
    *   **React 的 `useMemo`**：是手动挡的拖拉机。因为 React 是靠“反复执行函数组件”来重绘的，它没有劫持数据。你必须像签署合同一样，手动、精确地把你用到的每一个依赖项手写进 `[a, b, c]` 数组里。一旦你漏写了一个，就会导致经典的**闭包陷阱（Stale Closure）**，页面上的数据永远停留在旧版本死活不更新。
