---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **性能优化(`memo`, `useMemo`, `useCallback`)**

## 1. 核心概念与性能陷阱

在现代 React 开发中（函数组件时代），有一个最为核心但也最容易导致性能灾难的设定：**“父组件的任何一次重新渲染（`Re-render`），都会无条件地导致其内部所有子孙组件连带重新渲染！”**

为了打破这个“连坐”机制，React 提供了三大性能优化神器。它们的核心思想只有一个：**缓存 (`Cache/Memoization`)**。

| API 名称 | 拦截对象 | 核心作用与使用场景 |
| :--- | :--- | :--- |
| **`React.memo`** | **组件 (Component)** | 阻断没必要的组件渲染。只有当传给子组件的 `props` 发生物理改变时，子组件才会重新渲染。 |
| **`useMemo`** | **值 (Value / Object / Array)** | 缓存一个极其耗时的计算结果，或者缓存一个对象/数组的**内存地址**，防止它在每次渲染时被重新创建。 |
| **`useCallback`**| **函数 (Function)** | 缓存一个函数的**内存地址**。本质上是 `useMemo` 专门用来缓存函数的语法糖。 |

## 2. 核心 API 实战解析

### 2.1 阻断渲染：`React.memo`
如果一个组件的渲染成本极高，你可以用 `React.memo` 把这个组件包裹起来。它会在底层为你做一层关于 `props` 的**浅比较 (`Shallow Compare`)**。

```jsx
import { useState, memo } from 'react';

// 1. 使用 memo 包裹子组件
const ExpensiveChild = memo(function ExpensiveChild({ title }) {
  console.log('--- 极其昂贵的子组件渲染了 ---');
  return <div>{title}</div>;
});

export default function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>父组件打字/计数: {count}</button>
      
      {/* 2. 父组件重新渲染时，因为 title 是个死字符串没变，
          memo 发现 props 没变，直接拦截了这次渲染，子组件不会打印 log！*/}
      <ExpensiveChild title="我是不会变的标题" />
    </div>
  );
}

// 默认情况下其只会对复杂对象做浅层对比，如果你想要控制对比过程，那么请将自定义的比较函数通过第二个参数传入来实现。
/*function MyComponent(props) {
    /!* 使用 props 渲染 *!/
}
function areEqual(prevProps, nextProps) {
    /!*
    如果把 nextProps 传入 render 方法的返回结果与
    将 prevProps 传入 render 方法的返回结果一致则返回 true，
    否则返回 false
    true就缓存，false则不缓存
    *!/
}
export default React.memo(MyComponent, areEqual);*/
```

### 2.2 拯救引用陷阱：`useCallback`
**痛点**：在上面的例子中，如果你传给 `ExpensiveChild` 的不是一个死字符串，而是一个**函数**（比如 `onClick` 回调），`React.memo` 就会**瞬间失效**！

因为父组件每次重新执行时，内部声明的普通函数 `const handleClick = () => {}` 都会在内存中**分配一个全新的地址**。`memo` 一对比发现内存地址变了，以为是新函数，于是乖乖去渲染了子组件。

**解法**：使用 `useCallback` 锁死函数的内存地址！

```jsx
import { useState, useCallback, memo } from 'react';

const ExpensiveChild = memo(({ onAction }) => {
  console.log('--- 子组件渲染了 ---');
  return <button onClick={onAction}>执行动作</button>;
});

export default function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // 🚨 极其关键：用 useCallback 包裹这个函数！
  // 第二个参数是依赖数组。只有当 text 发生改变时，这个函数才会换一个新的内存地址。
  // 如果只是 count 变了，handleClick 永远返回第一次创建的那个老地址。
  const handleClick = useCallback(() => {
    console.log('携带的文字是:', text);
  }, [text]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>加数 (不会触发子组件)</button>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="打字 (会触发子组件)" />
      
      {/* 此时传进去的 handleClick 地址被死死锁住了，memo 完美生效！ */}
      <ExpensiveChild onAction={handleClick} />
    </div>
  );
}
```

### 2.3 缓存计算结果与对象：`useMemo`
`useMemo` 与 `useCallback` 极其相似，但它不仅能缓存函数，它还能缓存**任何复杂计算返回的值**（特别是数组和对象）。

**缓存极度耗时的数学计算**
```jsx
import { useState, useMemo } from 'react';

function App({ list }) {
  const [count, setCount] = useState(0);

  // 如果不加 useMemo，每次点击 count 按钮，这个循环一万次的函数都会被执行一遍！
  const sortedList = useMemo(() => {
    console.log('执行了极度耗时的排序逻辑...');
    return list.sort((a, b) => a - b);
  }, [list]); // 只有当传入的 list 物理改变时，才重新排序

  return <div>...</div>;
}
```

**锁死对象的内存地址（极其常见）**
如果要把一个对象作为 `props` 传给 `memo` 子组件，或者作为 `useEffect` 的依赖项，为了防止每次渲染生成新对象导致无限死循环，必须用 `useMemo` 锁住它。

```jsx
// 每次组件渲染，这个 options 都是同一块内存
const options = useMemo(() => {
  return { color: 'red', size: 10 };
}, []);

// 传给 memo 组件绝对安全
<ChartComponent config={options} />
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 既然 `memo`、`useCallback` 这么好，我是不是应该把项目里所有的组件和函数全部用它们包裹起来？
*   **答**：**这是彻头彻尾的灾难！官方极其严厉地反对“过早优化”和“无脑包裹”。**
    *   **性能反噬**：你以为你在优化性能，实际上 `memo` 的浅比较对象属性、`useCallback` 收集和追踪依赖数组，这些**底层动作本身就是极其消耗 CPU 性能的**。
    *   **何时是负优化**：如果一个子组件非常轻量（只是个普通的 div 结构），或者你传给它的 props 每次 100% 都会变。你给它加了 `memo`，React 不仅要重新渲染它，还要在渲染前多做一次毫无意义的浅比较，性能反而更差！
    *   **【黄金使用准则】**：
        1. **绝不单独使用**：`useCallback` 和 `useMemo` 存在的唯一意义，就是为了**配合 `React.memo` 或者作为 `useEffect` 的依赖项**。如果子组件没有包 `memo`，你父组件里写一万个 `useCallback` 都是脱裤子放屁，因为子组件依然会无条件渲染！
        2. **只给重型组件加护盾**：只有当子组件极其昂贵（如图表、上百行的表格、富文本编辑器），且你能明确感觉到页面输入卡顿时，才祭出这三件套。

### 3.3 我把函数写在组件外面（全局作用域）算是一种优化吗？
*   **答**：**算，而且是最高级的优化！**
    *   如果你有一个纯粹的处理函数，它**完全不依赖**组件内部的任何 `State` 或 `Props`。
    *   千万不要把它写在组件里面然后用 `useCallback` 包裹。你应该**直接把它提取到组件函数定义的外面！**
    *   这样这个函数在整个 JS 模块加载时只会被创建一次，内存地址永生不变，连 `useCallback` 计算依赖的性能都省了，是真正的极致优雅。
    ```jsx
    // ✅ 完美的性能优化：不依赖内部状态的函数直接踢出组件外！
    const formatDate = (date) => date.toISOString();

    function App() {
      // ... 
    }
    ```

### 3.4 React 19 马上要出的 React Compiler 会淘汰这三个 API 吗？
*   **答**：**很大程度上会！这也是 React 演进的历史性节点。**
    *   过去的几年里，React 开发者苦于手动添加 `useMemo` 和 `useCallback`，代码里充满了为了底层机制妥协的“噪音”。
    *   React 团队正在研发的 **React Compiler (Forget)** 能够通过强大的底层静态分析引擎，在编译阶段**自动**为你所有的组件、对象和函数打上缓存标记。
    *   这意味着在未来的 React 版本中，你只需要写最纯粹的 JavaScript 逻辑，不再需要手动写这三个 API，编译器会在底层自动帮你完成一切极限性能优化。但在那一天完全普及之前，熟练掌握它们依然是目前的硬性要求。
