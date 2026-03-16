---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useRef`](https://zh-hans.react.dev/reference/react/useRef)：跨越渲染的秘密通道**

## 1. 核心概念与“叛逆”哲学

在 React 的声明式哲学中，视图（UI）必须是状态（State）的绝对映射，数据必须单向流动。
但现实世界是复杂的。有时候，你需要**打破声明式的紧箍咒，直接伸手去触摸底层的物理世界（原生 DOM），或者在组件中秘密地保存一些“见不得光”的数据（不希望触发页面重新渲染）。**

**Ref (Reference 的简写)**，就是 React 官方为你留下的合法“后门”。

```js
const ref = useRef(initialValue)
```

### 1.1 `useRef` 的双重人格
在函数组件中，我们使用 `useRef` Hook。它有两个截然不同、却又殊途同归的用法：

```js
// React 内部  用useState实现的useRef伪代码
function useRef(initialValue) {
  const [ref, unused] = useState({ current: initialValue });
  return ref;
}
```

| 用法面相 | 核心职责 | 特性比喻 |
| :--- | :--- | :--- |
| **1. 获取真实 DOM** | 直接操作原生 DOM 节点（如使输入框获取焦点、获取滚动条位置、操作 Video 播放、接入 ECharts 等第三方库）。 | 像是一根**机械抓手**，直接探入页面抓取物理节点。 |
| **2. 跨渲染保存死数据** | 保存一个在组件整个生命周期内都不会丢失的变量，**且修改这个变量绝对不会触发组件重新渲染。** | 像是一个**秘密保险箱**，每次渲染时你都能打开箱子拿到里面的东西，但往里存东西不会惊动任何人。 |

*(注：`useRef` 返回的是一个极其简单的普通对象 `{ current: initialValue }`，这个对象的内存地址在组件的整个生命周期中永远不变。)*


### 1.2 ref和state的区别

| 特性             | state                                  | ref                                    |
| ---------------- | -------------------------------------- | -------------------------------------- |
| **是否触发渲染** | ✅ 是。setState 或 useState 更新会触发重绘 | ❌ 否。修改 `.current` 属性不会导致重新渲染 |
| **可变性**       | 不可变更新（需通过 setter 替换新值）   | 可变（直接修改 `.current` 属性）       |
| **读写时机**     | 只能在组件渲染过程中读取（或通过 effect） | 随时可以读写（包括渲染过程，但不推荐在渲染中读写导致不一致） |
| **存储内容**     | 与 UI 直接相关的数据                   | DOM 元素、组件实例、任何可变值（对象、数字等） |
| **生命周期**     | 随组件创建而存在，销毁而消失           | 同样随组件存在，但可跨渲染周期保持不变 |


## 2. 核心操作实战

### 2.1 物理抓手：获取和操作 DOM

这是前端开发者最熟悉的场景。

```jsx
import { useRef, useEffect } from 'react';

function FormInput() {
  // 1. 创建一根空抓手，初始值为 null
  const inputRef = useRef(null);

  // 3. 在 useEffect 中（此时真实 DOM 已经画在页面上了），操作它！
  useEffect(() => {
    // inputRef.current 就是那个真实的 <input> 物理节点
    inputRef.current.focus(); 
    inputRef.current.style.borderColor = 'red';
  }, []);

  return (
    <div>
      {/* 2. 把抓手绑定到你要抓的 React 元素上 */}
      <input ref={inputRef} type="text" placeholder="我会自动被聚焦" />
    </div>
  );
}
```

### 2.2 秘密保险箱：保存跨渲染的数据

假设你要实现一个秒表。你需要保存定时器的 ID (`intervalId`) 以便后续清除它。
如果你把 `intervalId` 存成普通的 `let` 变量，每次组件重渲染，它都会被重置。如果你把它存进 `useState`，每次修改 `intervalId` 都会导致无意义的页面重渲染，这太荒谬了。

**`useRef` 是保存这种幕后数据的完美容器。**

```jsx
import { useState, useRef } from 'react';

function Stopwatch() {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  
  // 1. 创建保险箱来存定时器 ID。修改它不会触发渲染！
  const intervalRef = useRef(null);

  function handleStart() {
    setStartTime(Date.now());
    setNow(Date.now());

    // 2. 将定时器 ID 存入保险箱的 current 属性中
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setNow(Date.now()); // 只有这个 setState 会导致页面每秒重渲染
    }, 10);
  }

  function handleStop() {
    // 3. 任何时候想用，打开箱子拿出来就能用
    clearInterval(intervalRef.current);
  }

  let secondsPassed = 0;
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000;
  }

  return (
    <div>
      <h1>时间: {secondsPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>开始</button>
      <button onClick={handleStop}>停止</button>
    </div>
  );
}
```

## 3. 高阶进阶：转发与动态收集

### 3.1 捕获子组件的 DOM (`forwardRef`)
**默认情况下，React 的自定义函数组件是不允许接收 `ref` 的。** 如果父组件想拿到子组件最里层的那个 DOM 节点，必须让子组件配合“转发”。

```jsx
import { forwardRef, useRef } from 'react';

// 子组件：使用 forwardRef 包裹，接住从天上掉下来的 ref，并绑在自己的原生节点上
const MyInput = forwardRef((props, ref) => {
  return <input ref={ref} className="super-input" {...props} />;
});

// 父组件
function App() {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current.focus(); // 完美穿透子组件，操作到了深层的 input
  };

  return (
    <div>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>聚焦子组件输入框</button>
    </div>
  );
}
```

### 3.2 动态收集由 `.map` 渲染的多个 Ref
这是极其常见的高阶需求：我循环渲染了 10 个 `<li id="...">`，我想点击谁，谁就滚动到可视区域，我怎么动态拿到这 10 个 DOM 节点的 ref？

**秘诀：传给 `ref` 属性的不仅仅可以是一个由 `useRef` 创建的对象，还可以是一个回调函数 (Callback Ref)！**

```jsx
import { useRef } from 'react';

function ItemList({ items }) {
  // 1. 创建一个 Map 保险箱，用来装所有的 DOM 节点
  const itemsRef = useRef(new Map());

  const scrollToId = (itemId) => {
    // 从 Map 箱子里精准抽出对应的 DOM 节点并调用原生滚动 API
    const node = itemsRef.current.get(itemId);
    node.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <nav>
        {items.map(item => (
          <button key={item.id} onClick={() => scrollToId(item.id)}>
            滚向 {item.id}
          </button>
        ))}
      </nav>
      <ul>
        {items.map(item => (
          <li
            key={item.id}
            // 2. 🚨 Callback Ref 的魔法！
            // 当 DOM 挂载时，React 会调用这个函数，把真实的 DOM 节点 node 传进来
            // 当 DOM 卸载时，React 会传一个 null 进来
            ref={(node) => {
              const map = itemsRef.current;
              if (node) {
                map.set(item.id, node); // 存入
              } else {
                map.delete(item.id);    // 拔除
              }
            }}
          >
            这是内容区: {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我在 `console.log(myRef.current)` 时，打印出来的总是 `null`？
*   **答**：这是新手踩坑榜 Top 1，绝对的时序错误。
    *   **原理**：`useRef(null)` 在组件函数刚刚执行时，真实 DOM 还是一片虚无（尚未进行挂载 Commit）。
    *   如果你把 `console.log` 写在组件函数的顶层，或者写在 `useMemo` 里，此时 React 还没把物理 DOM 交给你，你拿到的当然是初始值 `null`。
    *   **避坑指南**：**永远、必须在 `useEffect` 或者事件处理函数 (如 `onClick`) 内部，去访问 `ref.current`**。因为这些代码执行时，页面绝对已经画好了。

### 4.2 我通过 `ref.current.innerHTML = 'xxx'` 强行改了页面，为什么后来页面又变回去了或者崩溃了？
*   **答**：**你在挑战 React 的底线。**
    *   React 维护着一棵极其精密的虚拟 DOM 树。你通过 Ref 绕过 React，直接粗暴地修改了真实 DOM 的结构。
    *   当 React 后来因为 State 变化去更新页面时，它拿着它脑子里的虚拟 DOM 去对比现实世界，发现现实世界被人动过手脚（比如你删了一个节点），算法会瞬间崩溃，抛出极其恐怖的红屏报错。
    *   **铁律**：**永远不要用 Ref 去做非破坏性的破坏（如增删节点、修改由 React 掌管的类名和内容）！** Ref 的安全区仅限于：调用浏览器底层方法（如 `focus()`, `play()`, `getBoundingClientRect()`）。

### 4.3 我把一个普通的变量用 `let` 写在组件函数外边，不也能存数据且不引起渲染吗？干嘛非得用 `useRef`？
*   **答**：这涉及到了变量作用域和组件复用性的骨灰级考点。
    ```jsx
    let myTimer = null; // 写在外面

    function TimerComponent() {
       // ... 操作 myTimer
    }
    ```
    *   **致命缺陷**：如果你在页面上把这个 `<TimerComponent />` 渲染了两次（比如你在两个不同的地方都放了一个计时器）。因为 `let myTimer` 在模块顶层，是全局唯一的，**这两个组件实例将共享同一个变量！** A 开启了定时器，会把 B 的定时器覆盖掉，彻底乱套。
    *   **useRef 的伟大之处**：`useRef` 是挂载在当前这个具体的组件实例（Fiber 节点）上的。无论你在页面上复用渲染多少次该组件，它们内部都有自己私有的、互不干扰的“保险箱”。

### 4.4 `useRef` 保存的值改变时，既然不触发渲染，那我的页面怎么才能同步它的变化？
*   **答**：这是一个逻辑悖论。
    *   如果你希望页面上能显示出这个值的变化（比如你把定时器的秒数存在了 Ref 里），那你就**选错工具了**！
    *   **必须渲染在屏幕上的数据，必须用 `useState`。**
    *   `useRef` 是设计用来存那些**绝对不需要展示在屏幕上，只有逻辑层暗中需要**的数据的（如定时器 ID、上一次渲染的老数据、坐标值快照）。



