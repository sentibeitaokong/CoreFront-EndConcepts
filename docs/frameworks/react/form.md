---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React 表单处理(Forms: Controlled vs Uncontrolled)

## 1. 核心概念与理念

在 React 的世界里，**组件的状态（State）是整个应用“唯一的可信数据源”（Single Source of Truth）。**

为了解决原生 DOM 状态和 React 组件状态的割裂，React 提出了处理表单的两种截然不同的架构模式：**受控组件（Controlled Components）** 和 **非受控组件（Uncontrolled Components）**。

## 2. 受控组件 (Controlled Components) - 绝对的王者

**受控组件是 React 官方极其强烈推荐的标准表单处理方式。**
它的核心思想是：**剥夺原生 DOM 表单自己管理状态的权利，强行用 React 的 State 接管它的 `value`，并用 `onChange` 监听它的每一次击键。**

### 2.1 受控组件的基础实现

```jsx
import { useState } from 'react';

function ControlledForm() {
  // 1. React State 是唯一的数据源
  const [username, setUsername] = useState('');

  // 2. 状态更新拦截器
  const handleChange = (e) => {
    // 可以在这里做极其严苛的实时校验或格式化
    // 比如：强制转为大写、过滤掉特殊字符等
    const formattedValue = e.target.value.toUpperCase();
    setUsername(formattedValue); 
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // 极其重要：阻止浏览器默认的表单提交刷新页面行为！
    console.log('最终提交的数据：', username);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        用户名：
        {/* 3. 剥夺权利：强行将 value 绑定为 State。 */}
        {/* 如果不写 onChange，这个输入框将成为彻底的"死框"，你按烂键盘也输不进一个字！ */}
        <input 
          type="text" 
          value={username} 
          onChange={handleChange} 
        />
      </label>
      <button type="submit">提交</button>
    </form>
  );
}
```

### 2.2 处理多个输入框 (状态对象的终极收敛)

如果一个表单有 10 个输入框，写 10 个 `useState` 和 10 个 `onChange` 处理函数会让人抓狂。我们可以利用**`name` 属性和计算属性名（ES6）**来实现一个万能的 `handleChange`。

```jsx
import { useState } from 'react';

function ComplexForm() {
  // 用一个对象统一收敛所有的表单字段
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    isVIP: false // checkbox 是特殊的
  });

  const handleInputChange = (event) => {
    // 核心技巧：从 event.target 中解构出我们需要的属性
    const { name, value, type, checked } = event.target;
    
    // checkbox 用 checked 取值，其他用 value 取值
    const finalValue = type === 'checkbox' ? checked : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: finalValue // ES6 动态计算属性名，根据输入框的 name 动态更新对应的 key
    }));
  };

  return (
    <form>
      <input
        type="text"
        name="firstName" // 必须和 state 里的 key 绝对一致！
        value={formData.firstName}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
      />
      <label>
        <input
          type="checkbox"
          name="isVIP"
          checked={formData.isVIP} // checkbox 绑定的是 checked 而不是 value
          onChange={handleInputChange}
        /> 开通 VIP
      </label>
    </form>
  );
}
```

## 3. 非受控组件 (Uncontrolled Components) - 实用主义的妥协

虽然受控组件很完美，但它要求你为每一次击键都触发一次完整的组件重渲染（`setState`）。如果是一个包含了 500 个复杂节点的巨型表单，每次打字都会导致极其严重的卡顿。

**非受控组件**的思想是：**把状态的管辖权还给原生 DOM 本身。我不去用 State 绑定你的 value 了，我只在用户点击“提交”按钮的那一刻，用 `ref` 冲进 DOM 里把你最后的值“捞”出来。**

### 3.1 非受控组件的基础实现 (`useRef`)

```jsx
import { useRef } from 'react';

function UncontrolledForm() {
  // 1. 创建一个 ref 容器
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 2. 在提交的瞬间，直接通过原生 DOM 节点获取最新值！
    // 这种方式在打字的过程中，完全不会触发组件的重新渲染，性能极致。
    console.log('提交的数据是：', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        用户名：
        {/* 3. 没有 value，没有 onChange。只需挂载 ref。 */}
        {/* 如果需要默认值，必须使用 defaultValue，而不是 value！ */}
        <input 
          type="text" 
          ref={inputRef} 
          defaultValue="Bob" 
        />
      </label>
      <button type="submit">提交</button>
    </form>
  );
}
```

### 3.2 绝对的死穴：文件上传 `<input type="file">`
在 React 中，`<input type="file" />` **永远且只能**是一个非受控组件。因为由于浏览器的安全物理隔离机制，JavaScript 代码绝对不可能通过代码去动态设置一个文件路径的 `value`（防黑客窃取本地文件）。你只能通过 `ref` 或 `onChange` 去被动地读取用户选中的文件对象。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 到底该选受控还是非受控组件？
*   **答**：行业内的绝对共识是：**95% 的场景请无脑使用受控组件**。
    *   **必须用受控组件的场景**：你需要表单实时校验（密码太短边打字边标红）、需要实时禁用提交按钮、需要对输入格式化（比如信用卡号自动加空格）、多个输入框之间有联动。
    *   **可以考虑非受控组件的场景**：极度追求性能的超大型表单、你想将 React 轻松集成到一些依赖直接操作原生 DOM 的老旧 jQuery 插件代码中。

### 4.2 为什么我的 `<select>` 标签写了 `selected` 属性却报错/不生效？
*   **答**：React 对 `<select>` 和 `<textarea>` 进行了极具人性化的底层魔改。
    *   **原生 HTML**：要在 `<select>` 里选中某一项，你得去那个具体的 `<option>` 标签上写 `selected` 属性。
    *   **React 受控组件**：抛弃这种反人类做法。你只需要**直接在最外层的 `<select>` 标签上绑定 `value={state}` 即可！** React 底层会自动帮你去匹配并高亮对应的 option。
    ```jsx
    <select value={selectedFruit} onChange={e => setSelectedFruit(e.target.value)}>
      <option value="apple">苹果</option>
      <option value="banana">香蕉</option>
    </select>
    ```
    *   同样，原生的 `<textarea>内容写在中间</textarea>`，在 React 里也被统一改造成了单标签闭合的形式：`<textarea value={state} onChange={...} />`。

### 4.3 为什么控制台疯狂报警告："A component is changing an uncontrolled input to be controlled"？
*   **答**：这是新手踩坑榜 Top 3 的终极神坑，极其隐蔽！
    *   **错误重现**：
        ```jsx
        // 初始值定义为 null 或 undefined
        const [text, setText] = useState(); 
        // 渲染时: <input value={text} onChange={...} />
        ```
    *   **原理解析**：React 在第一次渲染时，发现你的 `<input>` 绑定的 `value` 是 `undefined`。它以为：“哦，这家伙没有传明确的值，所以他想搞一个**非受控组件**”。
    *   然后用户在输入框打了一个字母 'A'，触发 `setText('A')`。组件重新渲染，这次 `value` 变成了 `'A'`。
    *   React 瞬间崩溃大怒：“你小子第一帧告诉我是非受控的，第二帧突然塞个明确的字符串强行把它变成了受控的！你的状态失控了！”
    *   **终极避坑指南**：在定义表单相关的 State 时，**初始值绝对、千万、永远不能是 `undefined` 或 `null`，必须是一个明确的空字符串 `''`！** 即 `useState('')`。

### 4.4 写受控组件每次打字都要 re-render（重渲染），会不会导致页面极其卡顿？
*   **答**：通常完全不用担心。
    *   React 的虚拟 DOM 比对速度在处理普通的文本输入重绘时是极其惊人的，用户肉眼绝对察觉不到几十毫秒的重渲染。
    *   **真正的危机**：如果你的 `<input>` 只是一个巨大且极其昂贵的组件（比如一个渲染了 1000 行复杂 Table 的页面）的最外层的一部分。你在 input 里打字，导致整个页面连同那 1000 行 Table 一起重渲染，那一定会卡得痛不欲生。
    *   **性能优化解法**：
        1. **组件下沉拆分**：把这个 `input` 和它专属的 `state` 拆分成一个极其微小的、独立的子组件。这样输入时的状态更新就被死死锁在这个子组件内部，根本不会波及外面的大 Table。
        2. **使用非受控组件**：如果不想拆组件，直接上 `useRef`。
