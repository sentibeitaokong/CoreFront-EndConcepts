---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useFormStatus`](https://zh-hans.react.dev/reference/react-dom/hooks/useFormStatus): 表单提交状态的终极自动化方案**

在传统 React 开发中，处理表单提交通常伴随着极其繁琐的样板代码：声明 `isSubmitting` 状态、在提交开始时设为 `true`、在 `try/finally` 块中设为 `false`，还要手动将其通过 Props 一层层传递给深层的“提交按钮”组件以禁用点击。

随着 React 19（及 React Server Components/Actions 生态）的到来，`useFormStatus` 作为 `react-dom` 专属的 Hook 横空出世。它像魔法一样，自动为你提供最近的父级 `<form>` 的提交状态，彻底消灭了手动维护表单 Loading 状态的痛苦。

## 1. 核心概念与基础语法

```js
const { pending, data, method, action } = useFormStatus();
```

### 1.1 基本定义与应用场景

`useFormStatus` 不需要传入任何参数。调用它会返回一个包含四个属性的对象，实时反映其**父级** `<form>` 元素的当前状态。

**⚠️ 特别注意导入路径**：它是 DOM 环境特有的 Hook，必须从 **`react-dom`** 导入，而不是 `react`！

**核心应用场景**：在表单提交期间禁用“提交按钮”、显示加载动画（Spinner）、或者读取正在提交的表单数据。

```jsx
import { useFormStatus } from 'react-dom';

// 1. 将提交按钮抽离为一个独立的子组件
function SubmitButton() {
  // 2. 调用 Hook 获取父级表单的状态
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '确认提交'}
    </button>
  );
}

// 3. 在父组件中使用这个按钮
function MyForm({ submitAction }) {
  return (
    <form action={submitAction}>
      <input type="text" name="username" />
      <SubmitButton />
    </form>
  );
}
```

### 1.2 返回值对象解析

*   **`pending`** (boolean): 如果表单正在提交中，则为 `true`，否则为 `false`。
*   **`data`** (FormData | null): 一个 `FormData` 实例，包含当前正在提交的表单数据。未提交时为 `null`。
*   **`method`** (string): 提交使用的方法（通常是 `'get'` 或 `'post'`）。
*   **`action`** (function | string | null): 传递给 `<form action={...}>` 属性的函数或 URL。

## 2. 核心进阶：告别繁琐的表单状态管理

在引入 React Actions 之前，我们处理异步表单提交的代码往往充斥着各种 `useState`。

### 2.1 痛点场景：手动维护 `isLoading` 的样板代码灾难

**痛点场景**：为了防止用户在弱网环境下疯狂连击“提交”按钮导致重复发请求，我们必须手动接管 `onSubmit` 事件，并小心翼翼地在 `try/catch/finally` 中维护一个 Loading 状态。

**解决原则**：**拥抱原生 `<form action>` 属性。当我们将异步函数传递给 `action` 时，React 会在底层自动接管整个提交流程，并将状态下发给 `useFormStatus`。**

```jsx
// ❌ 错误/过时的示范 (手动管理状态：繁琐且容易漏写 finally)
function OldForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // 手动开启
    try {
      await api.submit(new FormData(e.target));
    } finally {
      setIsLoading(false); // 手动关闭
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isLoading}>{isLoading ? 'Loading' : 'Submit'}</button>
    </form>
  );
}

// ✅ 正确示范 (使用 Actions + useFormStatus：极致简洁)
function NewForm({ submitAction }) {
  // 状态管理完全消失了！全部交由底层和 SubmitButton 子组件处理
  return (
    <form action={submitAction}>
      <SubmitButton /> 
    </form>
  );
}
```

## 3. 高阶进阶：Context 机制与组件层级限制

### 3.1 突破死穴：为什么我调用了 `pending` 却永远是 `false`？

**痛点场景**：这是新手使用 `useFormStatus` 时**最容易踩的坑（没有之一）**。很多人为了图省事，直接在渲染 `<form>` 的同一个组件里调用了 `useFormStatus`。结果无论怎么提交，`pending` 始终是 `false`。

**解决原则**：**`useFormStatus` 底层的工作原理类似于 React Context。它只能读取位于其“组件树上方”的 `<form>` 的状态。** 它无法读取调用它的同一个组件内渲染的表单状态。

```jsx
import { useFormStatus } from 'react-dom';

// ❌ 致命错误示范 (同级调用)：这绝对无法工作！
function BrokenForm({ submitAction }) {
  // 这里的 useFormStatus 找不到包裹它的父级 <form>，因此 pending 永远是 false
  const { pending } = useFormStatus(); 

  return (
    <form action={submitAction}>
      {/* 由于 pending 永远是 false，按钮永远不会被禁用 */}
      <button disabled={pending}>提交</button> 
    </form>
  );
}

// ✅ 正确示范 (子组件调用)：必须将需要读取状态的部分抽离为子组件
function SubmitBtn() {
  const { pending } = useFormStatus(); // 这里能正确找到父级的 form
  return <button disabled={pending}>提交</button>;
}

function WorkingForm({ submitAction }) {
  return (
    <form action={submitAction}>
      <SubmitBtn /> {/* 完美运行 */}
    </form>
  );
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 它可以和传统的 `<form onSubmit={...}>` 事件一起工作吗？
*   **答**：**不可以。**
    *   `useFormStatus` 是专门为 React 19 的 `<form action={...}>` 特性设计的。
    *   如果你依然使用传统的 `onSubmit` 加上 `e.preventDefault()` 并手动发起 Fetch 请求，React 底层不会触发 Action 机制，`useFormStatus` 也就无法捕获到 `pending` 状态。
    *   **避坑方案**：必须将你的异步提交逻辑重构为 Action 函数，并赋值给 `<form>` 的 `action` 属性。

### 4.2 我可以用它生成的 `data` 做什么？
*   **答**：**用于实现局部的乐观 UI 或在提交期间展示信息。**
    *   当表单处于 `pending: true` 状态时，`data` 属性会包含用户刚刚填写的 `FormData`。
    *   你可以通过 `data.get('username')` 读取出用户输入的值，并在按钮旁边显示类似 “正在为 ${username} 创建账号...” 的提示，从而极大地提升交互体验。

### 4.3 为什么我的编辑器提示找不到 `useFormStatus`？
*   **答**：**检查你的导入路径和 React 版本。**
    *   第一，记住它是 `import { useFormStatus } from 'react-dom'`，而不是 `react`。
    *   第二，它需要 React 19（或 React 18.3 的某些实验性 Canary 版本）。如果你在一个较老的 React 18 稳定版项目中使用它，会抛出未定义的错误。
