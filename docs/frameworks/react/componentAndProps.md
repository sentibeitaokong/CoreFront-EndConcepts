---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React 组件与 Props(Components and Props)

## 1. 核心概念与本质

在 React 的世界里，**组件（Components）**是拼装出宏大 UI 界面的独立砖块。组件允许你将 UI 拆分为独立可复用的代码片段，并对每个片段进行隔离构思。

而 **Props (Properties 的简写)**，则是这些砖块之间互相传递“基因信息”和“指挥指令”的唯一血液。

| 核心概念 | 深度解析 | 物理形态 |
| :--- | :--- | :--- |
| **组件 (Component)** | 从概念上讲，组件就像是 JavaScript 的函数。它接收任意的输入（即 `props`），并返回用于描述页面展示内容的 React 元素（JSX）。 | 本质是一个首字母**大写**的 JavaScript 函数。 |
| **Props (属性)** | 父组件传递给子组件的“数据包裹”。它是组件对外的接口。 | 传递时是像 HTML 属性一样的键值对；接收时是一个普通的 JS 对象。 |
| **纯函数铁律 (Pure)** | 无论组件多么复杂，它都**绝对禁止修改其自身的 props**。React 强制要求组件对待 `props` 必须像纯函数一样严格。 | `props.name = 'X'` 会直接报错并引发架构灾难。 |

## 2. 组件的定义与渲染

现代 React 开发已经全面抛弃了老旧的类组件 (Class Components)，这里我们完全聚焦于**函数组件 (Function Components)**。

### 2.1 定义组件
定义一个组件非常简单：写一个普通 JavaScript 函数，**函数名首字母必须大写**，并 `return` 一段 JSX。

```jsx
// src/components/Welcome.jsx
// 这个函数接收了一个叫做 props 的对象作为唯一参数
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

export default Welcome;
```

### 2.2 渲染组件
当 React 元素为用户自定义组件时，它会将 JSX 所接收的属性 (attributes) 以及子组件 (children) 全部打包转换为一个独立的对象传递给该组件。这个对象就是 `props`。

```jsx
// src/App.jsx
import Welcome from './components/Welcome';

function App() {
  // 1. React 看到 <Welcome /> 标签，知道这是一个自定义组件
  // 2. 它把 { name: 'Sara', age: 25 } 打包成 props 对象，传给 Welcome 函数
  // 3. Welcome 函数返回 <h1>Hello, Sara!</h1> 元素交由 React 去渲染
  return (
    <div>
      <Welcome name="Sara" age={25} />
      <Welcome name="Cahal" age={30} />
    </div>
  );
}
```

## 3. Props 的高阶应用技巧

在企业级实战中，我们通常不会干巴巴地写 `props.xxx`，而是会运用现代 JavaScript 特性将 Props 玩出花。

### 3.1 极其优雅的“解构赋值”与“默认值”
这是目前行业里绝对标准的规范写法。不要再用 `props.` 点来点去了！

```jsx
// ❌ 啰嗦的老写法
// function UserProfile(props) {
//   return <div>{props.user.name} - {props.size ? props.size : 50}</div>
// }

// ✅ 现代优雅写法：直接在参数列表里解构，并赋予默认值
function UserProfile({ user, size = 50, showBorder = false }) {
  return (
    <div className={showBorder ? 'bordered' : ''}>
      <img src={user.avatar} width={size} alt={user.name} />
      <p>{user.name}</p>
    </div>
  );
}

// 父组件可以很随意地调用，没传的属性会自动走默认值
// <UserProfile user={myUser} />
```

### 3.2 神奇的黑洞坑位：`children` Prop
如果你的组件是一个“容器”（比如一个带阴影的卡片、一个左右分栏的布局），你事先根本不知道别人会在这个容器里塞什么东西。这时候，`children` 是唯一的救星。

当你把内容嵌套在组件的开闭标签之间时，这些内容会自动被收集到一个名为 `children` 的特殊 prop 中。

```jsx
// 1. 定义容器组件：开辟一个名为 children 的黑洞坑位
function Card({ title, children }) {
  return (
    <div className="card-wrapper shadow-lg p-4">
      <h2 className="card-header">{title}</h2>
      
      {/* 父组件塞进来的任何乱七八糟的 DOM 都会被原封不动地倒在这个 div 里 */}
      <div className="card-body">
        {children} 
      </div>
    </div>
  );
}

// 2. 使用容器组件
function App() {
  return (
    <Card title="今日新闻">
      {/* 这里的 p 标签和 button 标签，全部会被打包成 props.children 传进去！ */}
      <p>这是一条非常震撼的爆炸性新闻内容...</p>
      <button>点击阅读全文</button>
    </Card>
  );
}
```

### 3.3 暴力透传：扩展运算符 `{...props}`
当你封装极其底层的 UI 组件时（比如自己封一个按钮），你可能希望父组件传过来的几十个原生 HTML 属性（`id`, `className`, `disabled`, `aria-label` 等）全部原封不动地砸在最底层的 `<button>` 标签上。

```jsx
// 接收你关心的 customType 属性，剩下的所有属性用 ...rest 收集起来
function PrimaryButton({ customType, ...rest }) {
  const isDanger = customType === 'danger';
  
  return (
    <button 
      className={isDanger ? 'bg-red-500' : 'bg-blue-500'} 
      {...rest} // 将收集到的几十个剩余属性，暴力平铺/展开在这个 button 上
    >
      {rest.children}
    </button>
  );
}

// 父组件使用时：
// <PrimaryButton customType="danger" id="submit-btn" disabled onClick={submit}>
//   提交表单
// </PrimaryButton>
```

### 3.4 总结

* 要传递 `props`，请将它们添加到 `JSX`，就像使用 `HTML` 属性一样。
* 要读取 `props`，请使用 `function Avatar({ person, size })` 解构语法。
* 你可以指定一个默认值，如 `size = 100`，用于缺少值或值为 `undefined` 的 `props` 。
* 你可以使用 `<Avatar {...props} />` `JSX` 展开语法转发所有 `props`，但不要过度使用它！
* 像 `<Card><Avatar /></Card>` 这样的嵌套 `JSX`，将被视为 `Card` 组件的 `children prop`。
* `Props` 是只读的时间快照：每次渲染都会收到新版本的 `props`。
* 你不能改变 `props`。当你需要交互性时，你可以设置 `state`。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我的组件名字非得首字母大写？小写到底会怎样？
*   **答**：这是 React 解析 JSX 时的**硬性底层规则**。
    *   **小写开头**：当 Babel 编译器看到 `<div />` 或 `<welcome />` 时，它会认为你写的是一个**原生的 HTML 标签**。它会把它编译成 `React.createElement('welcome')`（注意是个字符串），浏览器渲染时会直接报无效标签的警告。
    *   **大写开头**：当看到 `<Welcome />` 时，编译器知道这是一个**用户自定义的组件引用**。它会把它编译成 `React.createElement(Welcome)`（注意这里传的是指向那个组件函数的指针引用！）。
    *   **避坑法则**：组件文件命名和函数命名，**必须永远使用大驼峰 (PascalCase)**。

### 4.2 父组件传了数据过来，我能在子组件里修改它吗？
*   **答**：**绝对、立刻、马上打消这个念头！这是 React 中最不可饶恕的重罪。**
    *   **纯函数铁律**：React 规定所有组件都必须像纯函数一样，绝不能修改传入的参数 (`props`)。如果你写了 `props.age = 20`，在严格模式下程序会直接崩溃（因为 props 对象底层被 `Object.freeze` 物理冻结了）。
    *   **架构原因**：如果子组件能偷偷改父组件的数据，整个应用的数据流向就会变成一团乱麻，一旦出现 Bug，你根本不知道是谁改了数据。
    *   **正解**：遵循**单向数据流**。只能“父传子数据，子传父函数”。父组件通过 props 传一个修改数据的函数给子组件（如 `onAgeChange`）。子组件如果想改数据，必须调用这个函数，求着父组件自己去修改自己的 State！

### 4.3 什么是 PropTypes？现在开发中还需要写吗？
*   **答**：
    *   **过去**：在 JavaScript 这门弱类型语言里，父组件传了个字符串 `"100"` 过来，子组件以为是数字去加减乘除了，导致灾难。为了防御这种情况，以前通常需要引入 `prop-types` 库，在组件底部写一大串 `Welcome.propTypes = { age: PropTypes.number.isRequired }` 进行运行时的类型校验警告。
    *   **现在**：在现代企业级开发中，**TypeScript 已经彻底取代了 PropTypes 的历史地位**。如果你使用 TS 编写 React，在编译写代码的阶段就会因为类型不匹配被红线拦截，根本不需要等到运行时再去报警告了。如果你正在新启动一个项目，请直接拥抱 TypeScript，无情抛弃 PropTypes。

### 4.4 父组件的一个 State 变了，为什么那些根本没用到这个 State 的子组件也跟着被重新渲染了？这难道不是性能灾难吗？
*   **答**：这是新手最震惊的 React 默认渲染机制，也是高级面试的重灾区！
    *   **默认机制**：在 React 中，**只要父组件重新渲染（函数重新执行），其内部包裹的所有子组件，无论 props 变没变，都会被无差别、连带性地重新执行渲染！**
    *   **为什么这么设计**：React 认为比对“props 到底变没变”本身也是需要耗费 CPU 的。在绝大多数日常场景下，直接重新执行一遍这些轻量级的纯函数的开销，比“深层比对所有对象属性”的开销要小得多。
    *   **如何拯救极度昂贵的子组件**：如果某个子组件极其庞大，它的非必要重渲染导致了页面卡顿。你必须请出性能优化终极护盾：**`React.memo`**。
        ```jsx
        // 使用 memo 包裹后，只有当传给子组件的 props 发生物理变化时，它才会重新渲染！
        const ExpensiveChild = React.memo(function Child(props) {
          // 这个组件里画了一万个图表...
        });
        ```
