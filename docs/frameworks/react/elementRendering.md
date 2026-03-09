---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React 元素渲染与重绘机制 (Element Rendering)

## 1. 核心概念与本质

在 React 的世界里，**“元素 (Elements)”是构成 React 应用的最小拼图块**。很多初学者会将“React 元素”和“DOM 元素”或“React 组件”混为一谈，这是理解 React 底层原理的最大障碍。

| 概念辨析 | 深度描述 | 物理形态 |
| :--- | :--- | :--- |
| **原生 DOM 元素** | 浏览器引擎管理的物理存在。操作它们极其消耗性能（涉及重排、重绘）。 | `<div>`, `<span>` |
| **React 元素 (Element)** | 它是**纯粹的 JavaScript 对象**（Virtual DOM 的基本单位），用来描述你想在屏幕上看到的内容。创建它的开销极其低廉。 | `{ type: 'div', props: { children: 'Hello' } }` |
| **React 组件 (Component)** | 它是**生成 React 元素的“工厂”或“模具”**。通常是一个函数或类，接收参数并返回一个 React 元素。 | `function App() { return <div /> }` |

**核心渲染哲学**：你通过编写 JSX 生成轻量级的 React 元素，React 的底层引擎负责将这些虚拟元素“翻译”并“挂载”为浏览器中真实沉重的 DOM 元素。

## 2. 根节点的挂载与初始渲染 (Mounting)

在每一个由 React 构建的单页应用 (SPA) 中，通常都会在 `index.html` 里有一个单一的、空荡荡的 `<div>` 坑位（通常叫 `root`）。这就是 React 掌控世界的“入口”。

在 React 18+ 的现代版本中，我们使用 `createRoot` API 来接管这个 DOM 节点，并首次渲染 React 元素。

```html
<!-- public/index.html -->
<body>
  <!-- React DOM 树将被插入到这个 div 内部，其原有的内容将被无情地全部替换 -->
  <div id="root"></div> 
</body>
```

```jsx
// src/main.jsx 或 src/index.js
import { createRoot } from 'react-dom/client';

// 1. 定义一个 React 元素 (JSX 本质就是元素)
const element = <h1>Hello, world</h1>;

// 2. 找到原生 DOM 里的那个“坑位”
const domContainer = document.getElementById('root');

// 3. 让 React 接管这个坑位 (创建根节点)
const root = createRoot(domContainer);

// 4. 将 React 元素渲染进坑位中！
root.render(element);
```

## 3. 元素的不可变性 (Immutability) 与更新渲染

这是理解 React 工作原理的最关键一步：**React 元素是极其固执的不可变对象 (Immutable)**。

一旦一个 React 元素被创建出来，你**绝对不能修改它的任何属性或子元素**。它就像是电影胶片里定格的一帧画面，代表了 UI 在某个特定时间点的绝对快照。

### 3.1 “伪更新”：每秒换一帧新画面

如果元素不能被修改，那页面是怎么做到动态更新（比如时钟秒针在走）的呢？
**答案极其暴力但有效：不断地生成全新的元素，然后把旧元素整个换掉！**

下面是一个最经典的“时钟”例子（不使用 State，纯靠强制重新渲染）：

```jsx
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));

function tick() {
  // 1. 每隔一秒，我们都用最新的时间，生成一个【完完全全全新】的 element 对象！
  const element = (
    <div>
      <h1>当前时间是：</h1>
      <h2>{new Date().toLocaleTimeString()}</h2>
    </div>
  );
  
  // 2. 强制 React 将这个新生成的 element 覆盖掉之前的画面
  root.render(element);
}

setInterval(tick, 1000);
```

### 3.2 性能救星：React 只更新它需要更新的部分 (Diffing)

看到上面的 `setInterval`，很多人的第一反应是：**“每秒钟把整个页面推倒重来？这性能不得爆炸？浏览器不得卡死？”**

这就是 React 底层引擎最伟大的魔法：**虚拟 DOM 的 Diff 算法**。

虽然你通过 `root.render()` 给 React 塞了一个全新的大对象，要求它替换旧画面，但 React 非常聪明。它会在内存中把“新元素树”和“旧元素树”进行极速的属性比对（Diff）。
它发现：`<div>` 没变，`<h1>` 没变，只有 `<h2>` 里面的文本节点（那个时间字符串）从 `"10:00:00"` 变成了 `"10:00:01"`。

**最终结果**：React **仅仅**指挥浏览器操作了那个 `<h2>` 的文本原生 DOM 节点。其他所有的真实 DOM 节点都没有发生任何物理级别的重绘！这就是 React 极速性能的秘密武器。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然元素是不可变的，那我日常开发中用的 `setState` 或 `useState` 是怎么改变页面的？
*   **答**：这是一个认知升级的问题。
    *   `setState` **并没有去修改现有的 React 元素**。
    *   当你调用 `setCount(1)` 时，React 会将你整个函数组件**从头到尾重新执行一遍**。
    *   因为作用域里的 `count` 变成了 1，你的函数这次 `return` 出来的是一个**全新的 JSX 结构（即全新的 React 元素）**。
    *   然后 React 拿着你 `return` 的这套新元素，去和上一次渲染留下的旧元素做 Diff，最后精准更新真实 DOM。
    *   结论：**组件的状态 (State) 变了，导致组件生成了新的元素 (Element)，从而实现了界面的刷新。元素本身至始至终都没有被修改，它只是被丢弃并被新的快照取代了。**

### 4.2 为什么每次我的 React 项目启动时，组件的 `console.log` 会打印两次？是不是渲染了两次？
*   **答**：这在 React 18+ 是绝对的高频疑问！
    *   **原因**：这 100% 是因为你在 `index.js` 中使用了 `<React.StrictMode>` (严格模式) 标签包裹了 `<App />`。
    *   **机制**：在**仅限开发环境 (Development)** 下，React 的严格模式会故意、强制地将所有组件的渲染函数、`useState` 以及 `useEffect` 执行**两次**！
    *   **目的**：它在模拟“组件被卸载又立刻重新挂载”的情况，以此来帮你找出代码中潜藏的副作用 Bug（比如你没有在 `useEffect` 中正确清除定时器，执行两次你就会发现定时器疯狂翻倍）。
    *   **影响**：这不仅正常，而且是官方强烈推荐的防御性编程手段。打包上线到生产环境时，这个双次执行机制会自动彻底失效，绝对不会影响用户体验。如果你嫌烦，可以把 `main.jsx` 里的 `<React.StrictMode>` 删掉，但这并不明智。

### 4.3 我把一个 DOM 对象直接传给 React 去渲染，为什么报错了？
*   **答**：React 的渲染引擎极其“洁癖”。
    *   **错误做法**：`const myDiv = document.createElement('div'); root.render(myDiv);`
    *   **原因**：`root.render()` 这个函数的胃口极其刁钻，它**只吃“纯正的 React 元素对象 (Virtual DOM)”**。原生 DOM 对象包含几百个底层宿主环境的属性，React 不认识它，也无法对它进行 Diff 对比，会直接拒绝并报错。
    *   **正确做法**：永远使用 JSX 去描述你的结构，把生成和操作真实 DOM 的脏活累活全权交给 React 底层的 `react-dom` 包去处理。

### 4.4 为什么强烈要求在列表渲染 `.map()` 中加上独一无二的 `key`？如果不加会怎样破坏元素的渲染？
*   **答**：这直击 Diff 算法的死穴。
    *   如前文所述，React 每次更新都是拿“新元素树”和“旧元素树”做对比。
    *   如果是单节点（比如标签名从 `<h1>` 变成 `<p>`），React 一眼就能看出来，直接销毁重建。
    *   **但是遇到同级并列的多个兄弟节点（列表）时，React 就成了瞎子**。如果数组原本是 `[A, B, C]`，你往头部插入了一个 `X` 变成了 `[X, A, B, C]`。
    *   如果没有 `key` 做身份证，React 傻傻地逐个位置比对：发现第一个位置从 A 变成了 X，它以为你把 A 改成了 X；第二个位置从 B 变成了 A，它以为你把 B 改成了 A。以此类推，它会把**所有的 DOM 节点内容全盘修改一遍**，最后在末尾新建一个 C。这是极端的性能灾难，且极易导致输入框等内部状态发生错位漂移。
    *   **加上唯一 `key` 后**：React 在比对时一看身份证，发现 A、B、C 的身份证都还在，于是它**完美保留了原有的真实 DOM 节点**，仅仅在最前面生成了一个 X 并插入。性能得到绝对拯救！
