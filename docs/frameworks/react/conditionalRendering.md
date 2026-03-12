---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 条件渲染(Conditional Rendering)

## 1. 核心概念与思维转换

在 Vue 中，我们习惯了使用 `v-if` 和 `v-show` 这种框架独有的“黑魔法”指令来控制元素的显示与隐藏。
而在 React 的哲学中：**“框架不应该创造新的语法来替代 JavaScript 原本就有的能力。”**

因此，React **没有任何条件渲染的内置指令**。在 React 中做条件渲染，你就是在写最纯正的 JavaScript 条件控制逻辑（如 `if` 语句、`&&` 运算符、三元运算符 `? :`）。

## 2. 核心语法与四大实战场景

### 2.1 非此即彼 (if/else 语句)
当你需要根据条件，在整个组件层面返回完全不同的两套 UI 结构时。

```jsx
function ItemList({ items }) {
  // 1. 在 return 之前使用原生的 if 语句
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <img src="empty.png" />
        <p>抱歉，列表空空如也~</p>
      </div>
    );
  }

  // 2. 如果上面的 if 没命中，就会执行这里的正常渲染逻辑
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

### 2.2 二选一的行内切换 (三元运算符 `? :`)
当你只是一小块局部的 UI 需要根据状态在两种形态之间来回切换时。这是 JSX 中最常用的语法。

```jsx
function LoginButton({ isLoggedIn }) {
  return (
    <div className="nav-bar">
      <span>Logo</span>
      
      {/* 语法：条件 ? 为真时渲染的JSX : 为假时渲染的JSX */}
      {isLoggedIn ? (
        <button className="btn-logout">退出登录</button>
      ) : (
        <button className="btn-login">点击登录</button>
      )}
      
    </div>
  );
}
```

### 2.3 存在即显示，不存在即毁灭 (逻辑与 `&&`)
当你只想在条件为真时渲染某些内容，而条件为假时**什么都不渲染**（即原生 DOM 完全不生成该节点，类似于 Vue 的 `v-if`）。

```jsx
function Mailbox({ unreadMessages }) {
  return (
    <div>
      <h1>Hello!</h1>
      
      {/* 语法：条件 && 为真时渲染的JSX */}
      {/* 只有当 unreadMessages.length > 0 时，后面的 <h2> 才会出现在页面上 */}
      {unreadMessages.length > 0 && (
        <h2>
          您有 {unreadMessages.length} 条未读消息。
        </h2>
      )}
      
    </div>
  );
}
```

### 2.4 极其复杂的局部逻辑 (阻止渲染返回 `null`)
如果你想在极个别情况下让一个已经被父组件调用的子组件“隐身”，或者有一段非常复杂的逻辑不好写在 JSX 大括号里。

```jsx
function WarningBanner({ warn }) {
  // 核心技巧：返回 null，告诉 React "我什么都不想渲染"，DOM 树中不会有任何痕迹
  if (!warn) {
    return null;
  }

  return (
    <div className="warning">
      警告！系统检测到异常行为！
    </div>
  );
}

// 进阶技巧：利用变量提前存储 JSX
function Page({ isVIP, isAdmin }) {
  // 提前把复杂的 JSX 存进普通变量里
  let adminPanel = null;
  if (isVIP && isAdmin) {
    adminPanel = <AdminDashboard />;
  }

  return (
    <div>
      <h1>用户主页</h1>
      {/* 在这里直接渲染变量，代码极其清爽 */}
      {adminPanel} 
    </div>
  );
}
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 致命陷阱：为什么我用 `&&` 判断数组长度为 0，页面上却赫然印出了一个数字 `0`？
*   **答**：这是 React 新手（尤其是从 Vue 转过来的前端）踩坑率第一的超级神坑！
    *   **错误代码**：`{ array.length && <List /> }`
    *   **原理解析**：在 JavaScript 的短路求值中，如果 `&&` 左侧的表达式求值为**假值 (falsy)**（比如 `0`, `NaN`, `""`, `null`, `undefined`），它会立刻停止向右执行，并**直接返回这个假值本身**！
    *   React 在渲染时，遇到 `true`, `false`, `null`, `undefined` 时会选择默默忽略（不渲染任何东西）。**但是，遇到数字 `0` 或 `NaN` 时，React 会认为你就是想在页面上打印这个数字！**
    *   所以，当 `array.length` 为 `0` 时，整个表达式的返回值就是 `0`，页面上就会多出一个诡异的 `0`。
    *   **终极避坑指南**：**永远确保 `&&` 左边的条件是一个绝对纯正的 Boolean（布尔值）！**
        *   ✅ 写法一：`{ array.length > 0 && <List /> }` (强行制造大于运算，返回 true/false)
        *   ✅ 写法二：`{ !!array.length && <List /> }` (双非运算符强转为布尔值)

### 3.2 React 里面有类似 Vue 的 `v-show` 吗（只切换 CSS `display: none`）？
*   **答**：**没有原生语法支持。因为这属于 CSS 的范畴，不属于组件渲染的范畴。**
    *   我们上面讲的 `if`, `&&`, `? :` 改变的都是**真实 DOM 的物理存在与否**（等同于 Vue 的 `v-if`）。元素消失时，它的 DOM 节点会被彻底拔除，组件生命周期会被卸载。
    *   **如何实现 `v-show`？** 如果你需要极其频繁地切换显示隐藏（比如一个在鼠标 hover 时疯狂闪烁的 tooltip），为了避免昂贵的 DOM 重建开销，你必须**手动控制 `style` 或 `className`**。
    ```jsx
    // 伪 v-show 实现：利用 style 的 display 属性
    function Tooltip({ isVisible }) {
      return (
        <div style={{ display: isVisible ? 'block' : 'none' }}>
          我是频繁闪烁的提示框
        </div>
      );
    }
    ```

### 3.3 我可以在 JSX 的大括号 `{}` 里面写 `if/else` 或者 `switch` 语句吗？
*   **答**：**绝对不可以！会导致编译错误。**
    *   **原因**：在 JSX 的大括号 `{}` 内部，**只能包含“表达式 (Expression)”**。表达式是指那种“执行完之后一定会返回一个具体的值”的代码（比如 `1+1`, `a?b:c`, `arr.map()`）。
    *   而 `if` 语句和 `switch` 语句属于**“语句 (Statement)”**，它们只是用来控制代码走向的流程，本身是**没有返回值**的。你不能把一个没有返回值的东西塞进本该渲染内容的 JSX 坑位里。
    *   **解决方案**：
        1. 使用**三元运算符**或**逻辑与**替代。
        2. 如果逻辑确实极其复杂（比如有五六种 switch 分支），**请将这坨逻辑抽离到一个单独的组件里**，或者在 `return` JSX 的上面，**提前用一个立即执行函数 (IIFE)** 或普通函数把它算好返回。
        ```jsx
        // 复杂条件渲染的终极绝招：立即执行函数 (IIFE)
        return (
          <div>
            {(() => {
              switch (status) {
                case 'success': return <SuccessIcon />;
                case 'error': return <ErrorIcon />;
                case 'loading': return <Spinner />;
                default: return null;
              }
            })()}
          </div>
        );
        ```

### 3.4 我如果 `return undefined` 会发生什么？
*   **答**：**会引发灾难性的崩溃报错！**
    *   如果你不想渲染任何东西，**唯一合法的姿势是 `return null;`**。
    *   在 React 中，一个组件函数如果执行到最后，因为忘记写 `return` 而隐式返回了 `undefined`，或者你显式 `return undefined;`。React 引擎会认为这是一个不可原谅的代码错误，并直接抛出极其严厉的红屏报错：`Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.`
