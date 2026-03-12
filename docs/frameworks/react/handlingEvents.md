---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 事件处理(Handling Events)

## 1. 核心概念与本质区别

React 元素的事件处理和处理 DOM 原生事件极其相似，但在语法层面和底层运行机制上，有着天壤之别。

| 概念维度 | 原生 HTML DOM 事件 | React 合成事件 (SyntheticEvent) |
| :--- | :--- | :--- |
| **命名规范** | 全小写 (如 `onclick`) | **小驼峰命名 (camelCase)** (如 `onClick`) |
| **传值形式** | 传递一个被执行的字符串 `onclick="handleClick()"` | 传递一个**真正的函数引用** `onClick={handleClick}` |
| **阻止默认行为** | `return false` 即可阻止（比如阻止 `<a>` 跳转） | **必须显式调用** `e.preventDefault()` |
| **事件代理(底层)**| 绑定在具体的 DOM 节点上 | **事件委托 (Event Delegation)**。无论你写了多少个 `onClick`，React 底层只在根节点 (Root) 上挂载了唯一一个事件监听器。当点击发生时，事件冒泡到根节点，React 再在内部通过精确的模拟路由，把事件派发给你的具体组件回调。极大地节省了内存！ |

## 2. 核心语法与实战应用

### 2.1 基础绑定与传参

在 React 中绑定事件，最核心的原则就是：**你传给事件属性的必须是一个函数本身，而不是函数的执行结果。**

```jsx
function ActionButton() {
  // 1. 定义事件处理函数 (通常命名以 handle 开头)
  const handleClick = () => {
    alert('按钮被点击了！');
  };

  const handleDelete = (id) => {
    alert(`准备删除 ID 为 ${id} 的数据`);
  };

  return (
    <div>
      {/* 2. 基础绑定：传递函数引用 (千万别加括号写成 handleClick()！) */}
      <button onClick={handleClick}>点击我</button>

      {/* 3. 传参绑定：如果函数需要参数，必须包裹一层箭头函数！ */}
      {/* 错误写法：onClick={handleDelete(123)} -> 会导致组件一渲染就立刻执行，且由于返回值可能是 undefined，导致点击无效 */}
      <button onClick={() => handleDelete(123)}>删除数据</button>
    </div>
  );
}
```

### 2.2 事件对象 (Event Object)

当事件触发时，React 会自动将一个**合成事件对象 (SyntheticEvent)** 作为第一个参数传递给你的回调函数。它完全兼容了原生 DOM 事件对象的所有接口（如 `e.target`, `e.stopPropagation()`），并且抹平了所有浏览器的兼容性差异。

```jsx
function Form() {
  const handleSubmit = (e) => {
    // 阻止表单提交导致页面刷新的默认行为
    e.preventDefault(); 
    console.log('表单提交了！');
  };

  const handleInput = (e) => {
    // e.target 指向触发事件的那个真实 DOM 节点 (此处为 input)
    console.log('用户正在输入：', e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" onChange={handleInput} />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 2.3 父子组件事件通信 (状态提升)

在 React 的单向数据流中，子组件绝对不能直接修改父组件的 state。如果子组件里的按钮被点击，要如何通知父组件刷新页面呢？

**方案：父组件把自己的函数当作 props 传给子组件，子组件去调用它。**

```jsx
// 子组件
function PlayButton({ movieName, onPlay }) {
  return (
    // 子组件发生点击时，调用父组件传进来的 onPlay 函数，并把数据带出去
    <button onClick={() => onPlay(movieName)}>
      播放 {movieName}
    </button>
  );
}

// 父组件
function App() {
  const handlePlayClick = (name) => {
    alert(`正在缓冲电影: ${name}`);
  };

  return (
    <div>
      {/* 父组件把 handlePlayClick 函数作为 onPlay 属性传递 */}
      <PlayButton movieName="《星际穿越》" onPlay={handlePlayClick} />
      <PlayButton movieName="《盗梦空间》" onPlay={handlePlayClick} />
    </div>
  );
}
```

### 2.4 总结

* 你可以通过将函数作为 `prop` 传递给元素如 `<button>` 来处理事件。
* 必须传递事件处理函数，而非函数调用！ `onClick={handleClick}` ，不是 `onClick={handleClick()}`。
* 你可以单独或者内联定义事件处理函数。
* 事件处理函数在组件内部定义，所以它们可以访问 `props`。
* 你可以在父组件中定义一个事件处理函数，并将其作为 `prop` 传递给子组件。
* 你可以根据特定于应用程序的名称定义事件处理函数的 `prop`。
* 事件会向上传播。通过事件的第一个参数调用 `e.stopPropagation()` 来防止这种情况。
* 事件可能具有不需要的浏览器默认行为。调用 `e.preventDefault()` 来阻止这种情况。
* 从子组件显式调用事件处理函数 `prop` 是事件传播的另一种优秀替代方案。

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么我写了 `onClick={handleClick()}`，页面一刷新它就自己触发了，点击反而没反应？
*   **答**：这是 React 新手犯错率排名第一的雷区。
    *   **原因剖析**：当你在 JSX 里写 `{handleClick()}`（带了括号）时，你并不是在“绑定事件”，而是在告诉 JavaScript 引擎：“**请立刻、马上执行这个函数**，并把它的返回值绑给 `onClick`”。
    *   **后果**：因为函数在组件渲染的一瞬间就被强行执行了，所以页面一刷新就弹出了 alert。而通常你的 `handleClick` 是没有 `return` 值的，所以它默认返回了 `undefined`。最终，真实的绑定变成了 `onClick={undefined}`，当你真的去点击按钮时，自然毫无反应。
    *   **铁律**：传给事件的一定要是**函数的引用**（也就是函数的名字 `onClick={handleClick}`）或者是**一个箭头函数包裹体**（`onClick={() => handleClick(id)}`）。

### 3.2 `onChange` 事件在 React 和原生 HTML 里有什么区别？
*   **答**：这是一个非常巨大的认知差异。
    *   **原生 HTML 的 `onchange`**：对于 `<input type="text">`，它只在用户输入完毕并**光标失去焦点 (blur)** 时，或者敲击回车时才触发。体验非常迟钝。
    *   **React 的 `onChange`**：React 极其激进地重写了这个行为。在 React 中，只要输入框的内容发生了**哪怕一个字符的改变（即按键按下的瞬间）**，`onChange` 就会立刻触发。
    *   **最佳实践**：正是由于 React 的这个设定，我们才能实现极其丝滑的**“受控组件 (Controlled Components)”**表单——用户每敲一个字，立刻更新 State，State 立刻更新 Input 的 value，实现完美的双向绑定错觉。

### 3.3 什么是“受控组件”？为什么我的输入框连字都打不进去了？
*   **答**：这也是表单处理的绝对核心。
    *   **现象**：如果你写了 `<input type="text" value={text} />`。你会惊恐地发现，无论你怎么按键盘，输入框里什么字母都打不出来！它像死机了一样卡在初始值上。
    *   **原因**：在 React 中，如果一个表单元素被绑定了 `value` 属性（被 State 强行接管了），它就成了一个**受控组件**。在这个体系下，**React 的 State 是唯一的数据源 (Single Source of Truth)**。原生 DOM 自己的输入行为被无情剥夺了，它只能乖乖显示 State 里的值。
    *   **解法**：必须配合 `onChange` 事件。当用户输入时，触发 `onChange`，在回调里拿到 `e.target.value`，然后调用 `setText(e.target.value)` 更新 State。State 更新了，React 重新渲染，输入框里才会有新字出现。

### 3.4 我在异步请求 (如 setTimeout 或 Promise) 里访问了 `e.target.value`，为什么报错说它是 null？ (React 16 独占神坑)
*   **答**：如果你还在维护老旧的 React 16 项目，这是个致命的坑（叫作 **事件池 Event Pooling**）。
    *   **原因 (React 16)**：为了节省内存，React 16 会复用合成事件对象 `e`。当你的同步函数执行完后，React 会瞬间把 `e` 里面的属性全部清空回收。所以等你的 `setTimeout` 异步回调执行时，去拿 `e.target` 早就变成了 `null`，引发程序崩溃。解决办法是调用 `e.persist()` 强制保留事件，或者在外面用 `const val = e.target.value` 先存起来。
    *   **解放 (React 17+)**：如果你用的是现代 React 17 及以上版本，**这个恶心的事件池机制已经被官方彻底废弃并移除了！** 你现在可以随意在任何异步代码里安全地访问 `e` 对象。
