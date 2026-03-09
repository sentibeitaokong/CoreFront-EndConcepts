---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React JSX 语法

## 1. 核心概念与本质

在 React 中，我们用来描述 UI 结构的语法叫做 **JSX (JavaScript XML)**。它看起来很像 HTML，但**它本质上完完全全是 JavaScript**。

### 1.1 为什么要有 JSX？
传统的 Web 开发提崇“关注点分离”（HTML 管结构、CSS 管样式、JS 管逻辑），物理文件是分开的。
但 React 认为：**渲染逻辑本质上与其他 UI 逻辑内在耦合**。比如，在 UI 中绑定处理事件、在某些时刻状态发生变化时 UI 需要做出响应。因此，React 并没有把标记语言和逻辑分离到不同的文件里，而是将它们共同存放在称之为“**组件 (Component)**”的松散耦合单元之中。JSX 就是让这种结合变得优雅的利器。

### 1.2 JSX 的编译本质
浏览器是不认识 JSX 的。在项目打包（如使用 Vite/Webpack + Babel）时，所有的 JSX 代码都会被编译器转换成标准的 JavaScript 函数调用。

**现代 React (17+) 编译模式 (New JSX Transform)：**
```jsx
// 你写的 JSX
const element = <h1 className="title">Hello World</h1>;

// 编译器转换后的纯 JS（由编译器自动引入 jsx-runtime，你不再需要手动 import React）
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx("h1", { className: "title", children: "Hello World" });
```

## 2. JSX 核心语法规则与实战

写好 JSX，只需要牢记三大铁律以及几个与 HTML 不同的细微习惯。

### 2.1 只能返回一个根元素
JSX 最终会被编译成一个普通的 JavaScript 对象。如果一个函数 `return` 了两个并列的对象，语法上是不允许的。

**❌ 错误示范：**
```jsx
return (
  <h1>Title</h1>
  <p>Content</p> // 报错！两个并列的兄弟节点
);
```

**✅ 正确做法 (使用 Fragment 幽灵标签)：**
`<></>`（或者写全 `<React.Fragment></React.Fragment>`）可以在不向真实 DOM 树添加任何额外节点（如多余的 `<div>`）的情况下，将多个子元素包裹起来。
```jsx
return (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);
```

### 2.2 所有标签必须闭合
HTML 经常容忍那些没有闭合标签的代码，但 JSX 像 XML 一样极其严格。

*   原本的 `<img>` 必须写成 `<img />`。
*   原本的 `<input>` 必须写成 `<input />`。
*   包裹内容的标签（如 `<li>苹果</li>`）也必须完美闭合。

### 2.3 驼峰命名法 (CamelCase)
由于 JSX 本质上转成了 JavaScript 对象，而 JS 的变量名限制较多（比如 `class` 是 JS 关键字），因此 JSX 中的属性名必须采用**驼峰命名法**。

*   `class` 变成了 **`className`** (最常错点)。
*   `onclick` 变成了 **`onClick`**。
*   `tabindex` 变成了 **`tabIndex`**。
*   原生 SVG 属性如 `stroke-width` 变成了 `strokeWidth`。

*(🚨 例外：`aria-*` 和 `data-*` 属性依然使用短横线写法，如 `data-id="1"`。)*

## 3. 在 JSX 中玩转 JavaScript 魔法 (大括号 `{}`)

如果只写静态标记，JSX 就没有意义了。JSX 的强大在于**只要用大括号 `{}` 包裹，你就可以在 HTML 结构中嵌入任何有返回值的 JavaScript 表达式**。

### 3.1 渲染动态变量与调用函数
```jsx
const user = { name: 'Alice', role: 'admin' };
const formatName = (user) => user.name.toUpperCase();

return (
  <div className="card">
    {/* 渲染变量 */}
    <h2>用户名：{user.name}</h2>
    {/* 调用函数 */}
    <p>格式化名称：{formatName(user)}</p>
    {/* 执行数学/字符串运算 */}
    <p>当前时间：{new Date().toLocaleTimeString()}</p>
  </div>
);
```

### 3.2 动态绑定属性
大括号不仅能放在标签内部当内容，还能放在标签上面当属性的值。

```jsx
const avatarUrl = 'https://imgur.com/xxx.png';
const imageClass = 'rounded-circle';

// 🚨 注意：当把大括号作为属性值时，外面千万不要加双引号！
// 错误：src="{avatarUrl}" （这会去找一个名字叫 "{avatarUrl}" 的相对路径图片）
// 正确如下：
return <img className={imageClass} src={avatarUrl} alt="User Avatar" />;
```

### 3.3 内联样式 (Style) 绑定的特殊陷阱
在普通 HTML 中，`style` 接收一个字符串。但在 JSX 中，**`style` 必须接收一个 JavaScript 对象**。
这意味着你需要用到**两层大括号** `{{ }}`：外层代表进入 JS 环境，内层代表这是一个普通 JS 对象。且所有的 CSS 属性名都必须变成驼峰式！

```jsx
// ❌ 错误：style 接收到了一个字符串，会报错
// <div style="background-color: red; font-size: 16px"></div>

// ✅ 正确：外层 {} 是 JSX 语法，内层 {} 是对象字面量
return (
  <div style={{ backgroundColor: 'red', fontSize: '16px', marginTop: 20 }}>
    内联样式演示
  </div>
);

// 或者先在外面定义好对象，再传进去，看起来更清晰：
const boxStyle = {
  backgroundColor: 'blue',
  color: '#fff'
};
return <div style={boxStyle}>...</div>;
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我写了 `<div class="card">` 页面能渲染，但控制台疯狂报红字警告？
*   **答**：这是新手从 HTML 刚切到 React 时 100% 会犯的错。
    *   在 JavaScript 中，`class` 是一个保留关键字（用于声明类 `class App extends...`）。
    *   因为 JSX 底层会被转译成 JS 对象属性，为了避开关键字冲突，React 强制规定必须使用 DOM 原生的 API 属性名 `className` 来代替 `class`。
    *   虽然部分现代 React 版本在底层能“宽容”地帮你偷偷映射成 `className` 并渲染出来，但它会在 F12 控制台打印极其醒目的 Error 警告。**永远养成好习惯，写 `className`**。同理，`for` 属性（如 label 的 for）必须写成 `htmlFor`。

### 4.2 大括号 `{}` 里可以写 `if...else` 语句吗？
*   **答**：**绝对不行！这是一个极其核心的底层机制问题。**
    *   **原因**：大括号 `{}` 里只能放**“表达式 (Expression)”**，不能放**“语句 (Statement)”**。
    *   **表达式**：像 `1 + 1`、`a ? b : c`、`arr.map()` 这种**计算完一定会返回一个具体值**的代码。这个值最后会被 React 拿去塞进生成的那个 JS 对象的属性里。
    *   **语句**：像 `if...else`、`for` 循环、`switch` 这种仅仅是**控制程序走向**，它们本身是**没有返回值**的。你不可能写出 `const a = if(true){ 1 }` 这种代码。
    *   **避坑指南**：如果你在 JSX 结构中需要条件判断，必须使用**三元运算符 (`? :`)** 或**逻辑与 (`&&`)**。如果你非要写 `if`，你必须在 `return` (即 JSX) 的**外部**提前算好，存到一个变量里，再把变量放进 JSX 中。

### 4.3 `&&` 逻辑与做条件渲染时，页面上为什么突然多出了一个数字 `0`？
*   **答**：这是 `&&` 运算符的一个致命物理陷阱。
    ```jsx
    const messages = []; // 长度为 0
    // 你的初衷：如果数组有数据，就渲染 <ul>，没数据就不渲染
    return (
      <div>
        {messages.length && <ul>...</ul>} 
      </div>
    );
    ```
    *   **真相**：JavaScript 里的 `&&` 运算符在判断左侧 `messages.length` (结果为 0) 时，发现是假值 (Falsy)，就会**发生短路，直接把左边的值 (数字 0) 返回回去**。React 拿到返回值 `0`，以为你想展示它，就老老实实地把它印在了页面上！
    *   **终极解法**：永远确保 `&&` 左边的值是一个**极其纯正的布尔值 (Boolean)**。
    ```jsx
    // 解法 A：强转布尔值
    {messages.length > 0 && <ul>...</ul>}
    // 解法 B：双非强转
    {!!messages.length && <ul>...</ul>}
    ```

### 4.4 为什么我在大括号里直接放了一个对象 `{ user }`，整个应用瞬间崩溃并抛出红屏错误？
*   **答**：**Objects are not valid as a React child（对象作为 React 的子节点是无效的）。**
    *   React 在遍历渲染你传给它的内容时，它可以渲染字符串、数字、数组（比如通过 `.map` 生成的 JSX 数组）。
    *   但是，如果你直接在 JSX 中写 `<div>{ {a: 1} }</div>`，React 拿到这个对象后会一脸懵逼，它不知道你想让它怎么把一个键值对展示在屏幕上（难道打印 `[object Object]` 吗？），于是它选择了直接报错崩溃。
    *   **解决方案**：永远精确地获取对象里面的基本类型属性进行渲染（如 `{user.name}`），或者如果你只是想在页面上调试看数据，请使用 `{JSON.stringify(user)}` 将其转化为字符串。
