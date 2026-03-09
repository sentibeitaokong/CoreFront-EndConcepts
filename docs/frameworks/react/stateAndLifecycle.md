---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React State 与全生命周期(State & Lifecycle)

## 1. 核心概念与范式演进

在 React 的世界里，**State (状态)** 是驱动 UI 变化的唯一引擎。如果说 **Props** 是组件的“基因”（由外部决定，不可改变），那么 State 就是组件的“记忆”与“心情”（由组件内部自我管理，随交互而改变）。

React 的组件开发范式经历了从 **Class 组件 (面向对象)** 到 **Function 组件 + Hooks (函数式)** 的历史性跨越。

## 2. 状态管理的核心铁律 (State)

无论你使用哪种范式，操作 React State 都必须遵守两条最高级别的军规：

### 2.1 绝对不能直接修改 State (Immutability)
在 Vue 中你可以直接 `this.x = 1`。但在 React 中，**直接修改 State 是一项死罪，它不会触发重新渲染。**

*   **Class 组件**：必须使用 `this.setState()`。
*   **函数组件**：必须使用 `useState` 返回的 `setXxx()` 函数。
*   **对象与数组**：必须使用展开运算符 `...` 或数组原生方法（如 `map`, `filter`）生成一个**内存地址完全不同的新副本**去覆盖旧数据。

### 2.2 State 的更新是异步与批处理的 (Batching)
为了压榨极致的性能，当你连续调用三次 `setState` 时，React **不会**立刻傻傻地去渲染三次页面。它会把这些请求打包（合并），等同步代码全部执行完后，再统一进行一次精准的渲染。

**致命陷阱：依赖旧状态计算新状态**
```jsx
// ❌ 错误做法：如果连续调用三次，结果往往还是只加了 1。因为在同一批次中，this.state.count 都是那个旧值。
this.setState({ count: this.state.count + 1 });

// ✅ 正确做法：给 setState 传入一个回调函数！
// React 保证会把最新的、上一轮计算完的状态 (prev) 传给这个函数。
this.setState((prevState) => ({ count: prevState.count + 1 }));
// 在 Hooks 中：setCount(prev => prev + 1);
```

## 3. Class 组件：经典的生命周期图谱

Class 组件的生命周期就像人的生老病死，有着极其严格的物理执行顺序。React 16.3 之后，官方对部分钩子打上了 `UNSAFE_` 标记并准备废弃，这里我们只讲**现代标准的 Class 生命周期**。

### 3.1 挂载阶段 (Mounting) - 出生
当组件实例被创建并插入 DOM 时，其生命周期调用顺序如下：

1.  **`constructor(props)`**：第一步。唯一可以直接 `this.state = {}` 赋值的地方。用于初始化内部状态或绑定 `this`。
2.  `static getDerivedStateFromProps(props, state)`：(极少使用) 在调用 render 方法之前调用。用于让 state 依赖于 props 发生变化。
3.  **`render()`**：**绝对核心。必须实现。** 它只做一件事：检查 `this.props` 和 `this.state` 并返回纯粹的 JSX。**绝不能在这里使用 `setState` 或发请求，否则光速死循环！**
4.  **`componentDidMount()`**：**挂载完毕。** 此时真实的 DOM 已经存在。**发起网络请求、绑定全局事件 (`window.addEventListener`)、操作 D3.js/ECharts 原生 DOM 的唯一合法位置。**

### 3.2 更新阶段 (Updating) - 成长
当组件的 props 或 state 发生改变时，会触发更新：

1.  `static getDerivedStateFromProps`：同上。
2.  **`shouldComponentUpdate(nextProps, nextState)`**：**性能优化的核武器。** 返回 `true` 或 `false`。如果返回 false，React 会直接中止本次渲染流程，后面的生命周期全部取消。常用于极度耗性能的巨型组件比对。
3.  **`render()`**：再次执行，生成新的虚拟 DOM。
4.  `getSnapshotBeforeUpdate(prevProps, prevState)`：在真实 DOM 更新前一刹那被调用。常用于截取旧的 DOM 状态（比如用户滚动到了哪里）。
5.  **`componentDidUpdate(prevProps, prevState, snapshot)`**：**更新完毕。** 此时 DOM 已经是最新的。**常用于根据新的 props 或 state 继续发起请求（注意：必须包裹在 if 语句中检查新旧值，否则死循环！）**。

### 3.3 卸载阶段 (Unmounting) - 死亡

1.  **`componentWillUnmount()`**：在组件从 DOM 中被移除之前调用。**极其重要：取消网络请求、清除定时器、解绑通过 `addEventListener` 绑定的全局事件。如果忘了写，会导致严重的内存泄漏！**

## 4. Function 组件 + Hooks：一统天下的 `useEffect`

随着 Hooks 的到来，Class 那些碎步般的生命周期被一个无所不能的神器彻底统一：**`useEffect`**。

它不再按时间线去切割生命周期，而是按照**“业务逻辑的副作用”**去组织代码。

### 4.1 模拟 `componentDidMount` (只执行一次)
**秘诀：传入一个空的依赖数组 `[]`。**
```jsx
import { useEffect } from 'react';

function UserList() {
  useEffect(() => {
    // 这里的代码只会在组件第一次出现在屏幕上时，执行唯一的一次！
    fetchData();
  }, []); // 👈 灵魂空数组

  return <div>...</div>;
}
```

### 4.2 模拟 `componentDidUpdate` (响应特定数据变化)
**秘诀：在数组中填入你需要监听的具体状态。**
```jsx
const [userId, setUserId] = useState(1);

useEffect(() => {
  // 当且仅当 userId 的值发生变化时，才会执行这里的重新请求逻辑
  fetchUserData(userId);
}, [userId]); // 👈 精准打击的依赖项
```

### 4.3 模拟 `componentWillUnmount` (擦屁股/清理工作)
**秘诀：在 `useEffect` 中 `return` 一个清理函数。**
```jsx
useEffect(() => {
  // 挂载时开启定时器
  const timer = setInterval(() => console.log('Tick'), 1000);

  // 👈 return 的这个函数，会在组件被销毁前，由 React 自动调用！
  return () => {
    clearInterval(timer);
    console.log('定时器已被安全销毁');
  };
}, []);
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么我的 `setState` 在 `for` 循环或者异步的 `setTimeout` 里表现得不一样？(React 17 vs 18 的惊天差异)
*   **答**：这是关于**批处理 (Batching)** 的高阶问题。
    *   **React 17 及以前**：批处理只有在 React 掌管的合成事件（如 `onClick`）中才有效。如果你把 `setState` 写在了 `setTimeout`、`Promise.then` 或者原生的 `addEventListener` 里，React 管不到它们。此时你连续写 3 个 `setState`，会引发**3次极其卡顿的重复渲染**！
    *   **React 18 伟大革新**：引入了 **Automatic Batching (自动批处理)** 机制。现在，无论你把 `setState` 写在宇宙的哪个角落（定时器、Fetch 回调里），React 都能极其智能地把它们打包拦截，合并成**1次渲染**。性能得到了史诗级提升。

### 5.2 为什么组件每次挂载时，`useEffect` 里的 `console.log` 会打印两次？
*   **答**：这绝对是 React 18 新手踩坑率第一的问题，并非 Bug。
    *   **原因**：你在入口文件使用了 `<React.StrictMode>` (严格模式) 标签。
    *   **机制**：在**开发环境 (Development)** 中，严格模式会故意强制执行一遍：`挂载 -> 立即卸载(执行 return 函数) -> 再次挂载`。
    *   **目的**：逼迫你暴露并修复代码里潜藏的副作用 Bug（比如你如果忘了在 return 里清定时器，就会发现定时器疯狂翻倍）。
    *   **影响**：上线生产环境 (`npm run build`) 后，此行为会自动彻底消失，恢复为执行一次。

### 5.3 为什么 `useEffect` 会导致疯狂的无限死循环 (Maximum update depth exceeded)？
*   **答**：这是由于违背了单向数据流与依赖更新机制。
    *   **致命罪魁祸首 1**：忘了写依赖数组 `[]`。导致每次渲染都会触发 Effect，Effect 里又 `setState` 导致新渲染，光速死循环。
    *   **致命罪魁祸首 2**：在 Effect 里更新了 A，但又把 A 写进了依赖数组。
    *   **致命罪魁祸首 3**：依赖了每次渲染都会被重新创建的对象或函数。
        ```jsx
        // ❌ 错误示范：每次组件重新渲染，options 都会被重新分配一个全新的内存地址！
        // React 浅比对发现 options 地址变了，又去执行 useEffect，死循环！
        const options = { id: 1 }; 
        useEffect(() => { fetch(options) }, [options]); 
        ```
    *   **解法**：把不需要响应式的对象移到组件外部定义，或者使用 `useMemo` / `useCallback` 强行锁死它们的内存地址。

### 5.4 Class 组件的 `this.setState` 和 Hooks 的 `useState` 在合并机制上有什么不同？
*   **答**：
    *   **Class 组件**：`this.setState({ a: 1 })` 是**浅合并 (Merge)**。如果你原本的 state 是 `{ a: 0, b: 2 }`，更新后变成 `{ a: 1, b: 2 }`，`b` 会被自动保留。
    *   **Hooks (`useState`)**：`setObj({ a: 1 })` 是**全量覆盖 (Replace)**。原本的 `b` 会瞬间灰飞烟灭！如果你用 `useState` 管理对象，更新时必须自己手动写展开运算符把旧数据拉过来：`setObj(prev => ({ ...prev, a: 1 }))`。因此在 Hooks 中，更推荐把复杂的对象打散成多个独立的 `useState` 来管理。
