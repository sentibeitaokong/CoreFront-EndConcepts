---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **`useState`:状态快照与驱动引擎**

在 React 函数组件中，`useState` 是最核心、最基础的 Hook。它是组件的“记忆引擎”，负责记录并在组件的整个生命周期中维护数据的状态，更是驱动 React 视图重新渲染（Re-render）的唯一内建触发器。

## 1. 核心概念与基础语法

### 1.1 基本定义与数组解构

`useState` 函数接收一个参数作为状态的**初始值**，并返回一个包含两个元素的数组：
* **当前的状态值 (State)**
* **更新该状态的函数 (Setter)**

```jsx
import { useState } from 'react';

function Counter() {
  // 使用 ES6 数组解构赋值，名字可以随便起，但规范约定 setter 以 set 开头
  // 这里的 0 只在组件【第一次挂载】时作为初始值生效
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>当前计数: {count}</p>
      {/* 调用 setter 传入新值，会通知 React 重新执行整个 Counter 函数以更新页面 */}
      <button onClick={() => setCount(count + 1)}>加一</button>
    </div>
  );
}
```

### 1.2 多个状态的物理隔离

在 Class 组件时代，所有的状态必须挤在一个巨大的 `this.state` 对象里。但在 Hooks 时代，**官方强烈推荐将无关的状态拆分为多个独立的 `useState`**，这让状态的逻辑更新更清晰。

```jsx
function UserProfile() {
  // 物理拆分，各自安好
  const [age, setAge] = useState(25);
  const [name, setName] = useState('Alice');
  const [isVIP, setIsVIP] = useState(false);

  return <button onClick={() => setAge(26)}>过生日</button>;
}
```

## 2. 核心进阶：状态更新的两大模式

你传递给 `setXxx` 的参数，决定了状态是如何被计算和更新的。这是必须跨过的第一道门槛。

### 2.1 替换式更新 (直接传值)

这是最符合直觉的用法，直接用传入的新值去**彻底覆盖**旧值。

```jsx
const [text, setText] = useState('Hello');

const updateText = () => {
  setText('World'); // 旧的 Hello 彻底被丢弃，变成 World
};
```

### 2.2 函数式更新 (传入回调) 

**痛点场景**：由于 React 存在“状态快照”机制，如果你在一个方法中连续三次调用 `setCount(count + 1)`，最终结果只会加 1。因为这三行代码读取的 `count` 都是同一个旧值。

**解决原则**：**如果你下一个状态的计算，必须依赖于上一个状态的值，你必须给 setter 传入一个回调函数！**

```jsx
function ScoreBoard() {
  const [score, setScore] = useState(0);

  const addThreePoints = () => {
    // ❌ 错误示范 (依赖了闭包中旧的 score 快照)：
    // setScore(score + 1);
    // setScore(score + 1);
    // setScore(score + 1); // 最终只加了 1

    // ✅ 正确示范 (依赖底层的最新鲜的 prev 状态)：
    // React 会把上一轮结算后的最新值 (prev) 喂给这个函数
    setScore(prev => prev + 1); // 0 -> 1
    setScore(prev => prev + 1); // 1 -> 2
    setScore(prev => prev + 1); // 2 -> 3 (最终完美加 3)
  };

  return <button onClick={addThreePoints}>进一个三分球</button>;
}
```

## 3. 高阶进阶：对象的不可变性与惰性初始化

### 3.1 突破死穴：更新对象和数组 (Immutability)

`useState` 在底层是用 `Object.is()` 进行**浅比较**的。如果你直接修改了原对象内部的属性，对象的**内存地址（指针）根本没变**。React 一对比发现指针一样，直接拒绝更新页面！

**铁律：必须开辟新内存地址，创建一个全新对象/数组去覆盖旧的！**

```jsx
const [user, setUser] = useState({ name: 'Bob', age: 20 });
const [list, setList] = useState(['A', 'B']);

const handleUpdate = () => {
  // ❌ 毁灭性错误：直接改原内存，页面绝对死机不更新！
  // user.age = 21; 
  // setUser(user); 
  
  // ✅ 黄金法则 1 (对象)：用展开运算符 {...obj} 拷贝所有旧属性，并覆盖目标属性
  setUser(prevUser => ({
    ...prevUser, 
    age: 21 
  }));

  // ✅ 黄金法则 2 (数组新增)：不准用 push，用 [...arr, new] 展开
  setList(prevList => [...prevList, 'C']);

  // ✅ 黄金法则 3 (数组删除)：不准用 splice，用 filter 过滤生成新数组
  setList(prevList => prevList.filter(item => item !== 'A'));
};
```

### 3.2 性能救星：惰性初始化 (Lazy Initialization)

**痛点场景**：`useState(initialValue)` 里的初始值只有在第一次渲染时有用，之后的每次重渲染都会忽略它。但是，如果你的 `initialValue` 是一个极度耗费 CPU 的计算函数（比如 `calculateHugeData()`），**每次组件重渲染，这个巨耗时的函数都会被强行执行一次（虽然执行结果最后被丢弃了）！** 导致页面奇卡无比。

**解决方案：向 `useState` 传入一个函数,只会在组件第一次挂载时执行它一次**

```jsx
// ❌ 糟糕性能：每次输入框打字导致组件渲染，这个循环 100 万次的函数都会陪跑执行一遍
// const [data, setData] = useState(computeHeavyData());

// ✅ 完美性能：传入函数名（或箭头函数）。React 只在挂载时执行一次。
const [data, setData] = useState(() => {
  console.log('极度昂贵的计算只执行了一次！');
  return computeHeavyData();
});
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我刚调完 `setCount(1)`，下一行 `console.log(count)` 打印出来的还是 0？
*   **答**：这是 React 最核心的机制之一：**状态快照 (Snapshot)**。
    *   在 React 中，每一次渲染（每一次执行这个组件函数）都有自己**独立、固定**的 `count` 变量。
    *   当你调用 `setCount(1)` 时，你是在告诉 React：“在**下一次**渲染时，请把 count 变成 1”。
    *   但当前这轮代码执行并没有结束，它处于当前渲染的“快照”中，这个快照里的 `count` 依然被定格在旧值 `0`。
    *   **避坑方案**：如果你在接下来的逻辑中马上要用到新算出来的值，不要去读 State，而是直接把它存到一个普通变量里去用：`const nextCount = count + 1; setCount(nextCount); api.post(nextCount);`。

### 4.2 如果我给 `setState` 传了一个和当前一模一样的值，React 会重新渲染吗？
*   **答**：**不会。这是 React 的内部优化（Bailing out of a state update）。**
    *   如果你写了 `setCount(0)`，而当前的 `count` 刚好也是 `0`。React 会进行 `Object.is(0, 0)` 比较，发现结果为 `true`。
    *   此时，React 认为数据没有发生变化，会**直接中断并抛弃这次更新请求**，组件函数不会重新执行，它的子组件也绝对不会被连带渲染。这也是为什么要严格遵守“不可变性（换新内存地址）”的物理依据。

### 4.3 我把一个极复杂的深度嵌套对象放在了一个 `useState` 里，每次更新都得写好几层 `...prev` 展开，快吐了怎么办？
*   **答**：你有两条出路。
    *   **出路 A (官方推荐架构)**：这是典型的设计不合理。在 Hooks 时代，除非这几个属性在业务上具有极强的“原子级绑定关系”（比如鼠标的 x 坐标和 y 坐标），否则**强烈建议将复杂对象拆解为多个扁平的、独立的 `useState`**。这样更新时极其轻松。
    *   **出路 B (借助神器)**：如果你必须维护这个极其复杂的深度树（比如一个拥有几十个节点的复杂后台表单），坚决引入 **`Immer.js`**！配合它的 `useImmer` hook，你可以用原生 JS 最爽的 `state.a.b.c = 1` 直接突变语法去写代码，它在底层自动帮你用 Proxy 拦截并生成完美的不可变副本。

### 4.4 为什么有时候连续调用好几次 `setState` 页面只闪了一下，有时候在 `setTimeout` 里调又闪了好几下？
*   **答**：这是 React 版本更迭造成的**自动批处理 (Automatic Batching)** 差异。
    *   在 **React 17 及更早版本**，批处理（把多次 setState 合并成一次渲染）**只对 React 原生的合成事件（如 onClick）生效**。如果你的 setState 位于 `setTimeout`、原生 Promise、或原生 DOM 事件监听器里，由于脱离了 React 的管辖，它会老老实实地调用一次就重新渲染一次，导致疯狂掉帧。
    *   在现代的 **React 18** 中，底层渲染引擎全面重构。现在，**无论你在天涯海角（定时器、Ajax、原生事件）**，只要你在同一个同步任务块中连续调用了 `setState`，React 18 都会极其智能地把它们全部打包，只执行**唯一一次**屏幕重绘！
