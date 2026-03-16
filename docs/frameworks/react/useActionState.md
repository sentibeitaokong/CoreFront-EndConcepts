---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useActionState`](https://zh-hans.react.dev/reference/react/useActionState)：现代表单状态处理的终极解法**

*(⚠️ 注意：`useActionState` 是 React 19 引入的全新核心 Hook。在 React 18 的早期实验版本中，它曾被称为 `useFormState`。本文基于 React 19 最新标准编写。)*

## 1. 核心概念与时代背景

> **核心使命**：
> `useActionState` 专门用于**优雅地管理和追踪一个“异步动作（Action）”的生命周期和返回值**。它将表单提交的等待状态、报错信息、成功结果，全部收敛到一个极其清爽的 Hook 中，并**在底层自动处理了并发提交的竞态冲突和防抖**。

## 2. 核心 API 实战：彻底告别冗余 State

`useActionState` 接收三个参数，返回一个包含三个元素的数组。

**函数签名：**
```javascript
const [state, formAction, isPending] = useActionState(fn, initialState, permalink?);
```

| 返回值 | 核心职责 |
| :--- | :--- |
| **`state`** | 那个执行函数 (`fn`) 上一次**`return` 回来的最新结果**。如果函数还没执行过，它的值就是你传进去的 `initialState`。 |
| **`formAction`** | **用来绑定在 `<form action={}>` 上的新动作函数**。当你触发表单提交时，就是通过调用它来启动整个异步流程。 |
| **`isPending`** | 一个布尔值。当内部的异步函数正在执行 (Promise 尚未 resovle) 时，它为 `true`。极其适合用来做 Loading 动画。 |

| 参数                            | 核心职责                                                                                |
|:------------------------------|:------------------------------------------------------------------------------------|
| **`fn`**                      | **真正干活的业务逻辑函数。** 它可以是异步的。它会接收两个参数：一个是当前的 `state`，另一个是表单提交传过来的 `formData`（或你手动传的参数）。 |
| **`initialState`**            | 初始状态（比如 `null` 或者 `{ error: null }`）。                                               |
| **`permalink(可选)`**           | 一个包含了在特定情况下（后述）表单提交后将跳转到的独立 `URL` 的字符串。                                               |

### 2.1 工业级实战：重构一个极简登录表单

在没有 `useActionState` 之前，你要写三个 `useState` 和复杂的 `try/catch/finally`。现在，代码变得极其纯粹。

```jsx
import { useActionState } from 'react';

// 1. 抽离纯粹的异步业务逻辑 (通常可以放在组件外部，甚至结合 Server Actions)
// 它接收两个参数：上一轮的 state，以及本次提交的表单数据 formData
async function submitLoginAction(previousState, formData) {
  const email = formData.get('email'); // 原生 FormData API 获取输入框的值
  const password = formData.get('password');

  try {
    // 模拟网络请求
    const res = await fakeApiLogin(email, password);
    // 成功：返回带有成功标志和用户信息的 state
    return { success: true, user: res.user, error: null };
  } catch (error) {
    // 失败：返回报错信息的 state
    return { success: false, user: null, error: error.message };
  }
}

export default function LoginForm() {
  // 2. 绑定 Hook，初始状态设定为 { success: false, error: null }
  const [loginState, loginAction, isPending] = useActionState(
    submitLoginAction, 
    { success: false, error: null }
  );

  // 3. 如果成功，直接渲染成功界面
  if (loginState.success) {
    return <h2>欢迎回来，{loginState.user.name}！</h2>;
  }

  return (
    // 4. 将 Hook 返回的 loginAction 绑定到表单的 action 属性上！
    <form action={loginAction} className="login-form">
      {/* 5. 注意：输入框必须有 name 属性，formData 才能抓取到它的值 */}
      <input type="email" name="email" placeholder="邮箱" required />
      <input type="password" name="password" placeholder="密码" required />
      
      {/* 6. 利用 isPending 极其优雅地控制按钮的 Loading 状态和防抖 */}
      <button type="submit" disabled={isPending}>
        {isPending ? '正在疯狂登录中...' : '立即登录'}
      </button>

      {/* 7. 渲染从 Action 返回的报错信息 */}
      {loginState.error && <p style={{ color: 'red' }}>{loginState.error}</p>}
    </form>
  );
}
```

## 3. 高阶进阶：超越 `<form>` 的局限

虽然 `useActionState` 的名字里带个 Action，而且最常和 `<form>` 连用，但**它绝对不仅限于表单提交！**
你可以把它当成一个“自带防抖和 Loading 状态的无敌异步函数包装器”，应用在任何点击按钮发请求的场景。

### 3.1 绑定在普通的 `<button>` 或非表单交互上

假设你有一个点赞按钮，点击后要发网络请求，你需要防抖和 Loading。

```jsx
import { useActionState } from 'react';

// 模拟极其复杂的异步点赞动作
async function toggleLikeAction(previousState, articleId) {
  await fetch(`/api/like/${articleId}`, { method: 'POST' });
  // 返回新的点赞状态和点赞数
  return { liked: !previousState.liked, count: previousState.liked ? previousState.count - 1 : previousState.count + 1 };
}

function ArticleCard({ article }) {
  // 初始状态传入文章当前的点赞信息
  const [likeState, executeLike, isLiking] = useActionState(
    toggleLikeAction, 
    { liked: article.isLiked, count: article.likeCount }
  );

  return (
    <div className="card">
      <h3>{article.title}</h3>
      
      {/* 核心魔法：因为这里没有 <form>，我们通过箭头函数手动调用 executeLike，并把文章 ID 传进去 */}
      {/* React 依然会在底层完美地接管异步状态、算出 isLiking */}
      <button 
        onClick={() => executeLike(article.id)} 
        disabled={isLiking}
      >
        {isLiking ? '处理中...' : (likeState.liked ? '💔 取消点赞' : '❤️ 点赞')}
        ({likeState.count})
      </button>
    </div>
  );
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然它能处理异步状态，那它和 `useEffect` 发请求有什么区别？
*   **答**：这是最核心的架构理念差异。
    *   **触发机制**：`useEffect` 是**“被动防御”**。它是生命周期钩子，只要组件挂载了或者某个依赖变量（如 `userId`）变了，它就自动触发去发请求拉数据（通常用于页面初次加载获取展示数据）。
    *   **触发机制**：`useActionState` 是**“主动出击”**。它包裹的是一个因为**用户进行了某种特定交互动作（如点击提交、点击点赞）**而触发的副作用。
    *   **总结**：页面加载要看的数据用 `useEffect`（或 React Query），用户点击按钮要发的数据/命令用 `useActionState`。

### 4.2 为什么我连续狂点提交按钮 10 次，并没有看到发出去 10 个网络请求？是不是出 Bug 了？
*   **答**：这正是 `useActionState` 最强大的杀手级底层优化：**内置防抖与竞态取消。**
    *   在以前手写 `useState` 的时代，如果你没写 `disabled={loading}`，狂点 10 次按钮就会老老实实地打出 10 个乱序的 API 请求。
    *   React 19 在底层处理 Action 时，一旦发现当前这个 `loginAction` 正在执行（`isPending` 为 `true`），如果你再次触发它，React 会**非常聪明地将后续的重复提交排队或者拦截**。这就彻底从框架底层消灭了前端最头疼的按钮连点导致的“多重订单”、“脏数据”等并发安全隐患！

### 4.3 我必须要用原生的 `formData.get('email')` 来拿表单数据吗？我用受控组件（`useState` 绑在 `value` 上）不行吗？
*   **答**：**完全可以混用，但官方在强推原生 `FormData`。**
    *   如果你依然在每一个 `<input>` 上挂着 `value={email} onChange={...}`，你在 `useActionState` 的执行函数里，完全可以无视传过来的 `formData`，直接去读你组件里的 `email` state。
    *   **趋势背景**：React 19 在大力推行**非受控组件表单 (Uncontrolled Forms)** 的复兴。因为在 Server Actions（服务端执行 Action）的宏大愿景下，表单的提交应该越原生越好。利用原生 HTML 的 `name` 属性和原生的 `FormData` 对象，你可以省去写十几个 `useState` 的痛苦，极大减轻运行时的内存和重渲染负担。除非你需要极其复杂的实时校验，否则建议拥抱原生表单取值法。

### 4.4 它能在 React 18 里用吗？为什么我 import 不到？
*   **答**：
    *   `useActionState` 是 **React 19 的正式核心特性**。
    *   如果你在用 React 18 的最新版本（比如 18.3），你可能会在 `react-dom` 包里找到一个叫 **`useFormState`** 的 Hook，那正是它的早期实验版（前身）。但在 React 19 正式发布时，官方把它重命名并移入了核心的 `react` 包中，使其能力不再仅限于 Form 表单。如果要使用最新形态，必须升级项目到 React 19。
