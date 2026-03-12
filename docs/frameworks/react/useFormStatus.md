# useFormStatus

## 1. 概览：什么是 useFormStatus？

`useFormStatus` 是 React 19 中引入的一个 Hook，它提供了一种简单的方式来获取**父级表单的提交状态信息**。这个 Hook 解决了表单开发中长期存在的一个痛点：如何在表单提交期间优雅地显示加载状态、禁用按钮，防止重复提交。

### 1.1 核心价值：让表单反馈更友好

当用户提交表单后，如果操作需要一些时间（例如网络请求），用户应该立即得到反馈：
- 提交按钮应显示加载状态，防止用户重复点击
- 表单输入应暂时禁用，避免用户在提交过程中修改数据
- 可以显示正在提交的数据内容，增强用户体验

`useFormStatus` 让这些常见的表单交互变得极其简单，无需手动管理 loading state 或编写复杂的逻辑。

### 1.2 为什么需要这个 Hook？

在 `useFormStatus` 出现之前，开发者通常这样做：

```jsx
// ❌ 传统方式：需要手动管理 loading 状态
function Form() {
  const [pending, setPending] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      await submitForm();
    } finally {
      setPending(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button disabled={pending}>
        {pending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

这种方式虽然可行，但存在几个问题：
- 需要为每个表单手动管理 `pending` 状态
- 与 React 19 的 Server Actions 和表单 Action 集成不够自然
- 无法方便地获取表单提交中的数据

## 2. API 语法与基本使用

### 2.1 基本语法

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  // ...
}
```

**重要提示**：`useFormStatus` 必须从 `react-dom` 中导入，而不是 `react`。

### 2.2 API 速览

| 特性 | 说明 |
| :--- | :--- |
| **导入路径** | `import { useFormStatus } from 'react-dom'` |
| **参数** | 无 |
| **返回值** | 包含表单状态信息的对象 |
| **调用位置** | 必须在 `<form>` 元素的**子组件**中调用 |
| **适用场景** | 显示提交中的加载状态、禁用表单元素、预览提交数据 |

### 2.3 返回值详解

`useFormStatus` 返回一个包含以下属性的 `status` 对象：

| 属性 | 类型 | 描述 |
| :--- | :--- | :--- |
| **`pending`** | `boolean` | 如果为 `true`，表示父级 `<form>` 正在等待提交；否则为 `false` |
| **`data`** | `FormData \| null` | 包含父级 `<form>` 正在提交的数据；如果没有正在进行的提交或没有父级 `<form>`，则为 `null` |
| **`method`** | `string` | 表示父级 `<form>` 使用的 HTTP 方法，可以是 `'get'` 或 `'post'`。默认为 `'get'` |
| **`action`** | `function \| null` | 父级 `<form>` 的 `action` 属性传入的函数引用；如果 `action` 属性是 URI 值或未指定，则为 `null` |

### 2.4 最简示例：提交按钮的加载状态

```jsx
import { useFormStatus } from 'react-dom';
import { submitForm } from './actions';

// 子组件：提交按钮
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// 父组件：表单
function ContactForm() {
  return (
    <form action={submitForm}>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="message" placeholder="留言" />
      <SubmitButton />
    </form>
  );
}
```

## 3. 实战案例：从简单到复杂

### 3.1 提交时禁用所有表单元素

有时我们需要在提交时禁用整个表单，防止用户在提交过程中修改数据。

```jsx
import { useFormStatus } from 'react-dom';

// 封装输入框组件
function FormInput({ name, placeholder, type = 'text' }) {
  const { pending } = useFormStatus();
  
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      disabled={pending}
      className={pending ? 'opacity-50' : ''}
    />
  );
}

// 提交按钮组件
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// 主表单组件
function RegistrationForm() {
  async function registerAction(formData) {
    'use server';
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟
    console.log('注册信息:', Object.fromEntries(formData));
  }

  return (
    <form action={registerAction}>
      <FormInput name="username" placeholder="用户名" />
      <FormInput name="email" placeholder="邮箱" type="email" />
      <FormInput name="password" placeholder="密码" type="password" />
      <SubmitButton />
    </form>
  );
}
```

### 3.2 显示正在提交的数据

`useFormStatus` 的 `data` 属性让我们可以实时显示用户正在提交的内容，这特别适合需要即时反馈的场景。

```jsx
import { useFormStatus } from 'react-dom';

function StatusPreview() {
  const { pending, data } = useFormStatus();
  
  if (!pending || !data) return null;
  
  const username = data.get('username');
  
  return (
    <div className="status-preview">
      ⏳ 正在为用户 "{username}" 创建账号...
    </div>
  );
}

function SignupForm() {
  return (
    <form action={signupAction}>
      <input name="username" placeholder="用户名" />
      <input name="email" placeholder="邮箱" type="email" />
      <button type="submit">注册</button>
      <StatusPreview />
    </form>
  );
}
```

### 3.3 与 useFormState 结合使用

`useFormStatus` 和 `useFormState`（在 React 19 中更名为 `useActionState`）经常一起使用：`useFormStatus` 处理**进行中**的状态，`useFormState` 处理**已完成**的状态（如错误信息、成功提示）。

```jsx
import { useFormStatus } from 'react-dom';
import { useFormState } from 'react-dom';

// 提交按钮组件
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '登录中...' : '登录'}
    </button>
  );
}

// 登录表单
function LoginForm() {
  const [state, formAction] = useFormState(loginAction, {
    error: null,
    success: false
  });

  return (
    <form action={formAction}>
      <input name="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      <SubmitButton />
      
      {state.error && (
        <p className="error">❌ {state.error}</p>
      )}
      {state.success && (
        <p className="success">✅ 登录成功！</p>
      )}
    </form>
  );
}

// 服务器 Action
async function loginAction(prevState, formData) {
  'use server';
  
  const email = formData.get('email');
  const password = formData.get('password');
  
  // 模拟 API 调用
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (email === 'user@example.com' && password === 'password') {
    return { error: null, success: true };
  }
  
  return { error: '邮箱或密码错误', success: false };
}
```

### 3.4 与 React Hook Form 和 Zod 集成

`useFormStatus` 也可以与流行的表单库如 React Hook Form 和验证库如 Zod 无缝集成。

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStatus } from 'react-dom';

// 定义 Zod 验证 schema
const userSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  age: z.number().min(18, '必须年满18岁')
});

// 提交按钮组件
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '保存中...' : '保存'}
    </button>
  );
}

// 表单组件
function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema)
  });
  
  const formAction = async (formData) => {
    'use server';
    // 处理表单提交
    await saveUser(formData);
  };
  
  return (
    <form action={formAction}>
      <div>
        <input {...register('name')} placeholder="姓名" />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      
      <div>
        <input {...register('email')} placeholder="邮箱" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <div>
        <input {...register('age', { valueAsNumber: true })} type="number" placeholder="年龄" />
        {errors.age && <span>{errors.age.message}</span>}
      </div>
      
      <SubmitButton />
    </form>
  );
}
```

## 4. 深度对比：useFormStatus vs 传统方案

### 4.1 useFormStatus vs 手动状态管理

| 维度 | 手动状态管理 | useFormStatus |
| :--- | :--- | :--- |
| **代码量** | 需要为每个表单定义 state 和 handler | 极简，只需在子组件中调用 Hook |
| **与 Action 集成** | 需要手动调用 API 并处理 loading | 自动感知 Action 的进行状态 |
| **多个表单元素** | 需要为每个禁用元素传递 pending 状态 | 任何子组件都可以独立获取状态 |
| **提交数据访问** | 需要手动收集表单数据 | 直接通过 `data` 属性访问 FormData |
| **防重复提交** | 需要手动实现 | 内置支持 |

### 4.2 useFormStatus vs useFormState (useActionState)

这两个 Hook 经常被混淆，但它们有明确的职责分工：

| Hook | 作用 | 典型用途 |
| :--- | :--- | :--- |
| **`useFormStatus`** | 获取表单**当前**的提交状态（进行中） | 显示加载指示器、禁用按钮、预览提交数据 |
| **`useFormState`** (React 19 中更名为 `useActionState`) | 获取表单**已完成**的提交结果（过去时） | 显示错误信息、成功提示、处理返回值 |

**简单记忆**：`useFormStatus` 告诉你"正在发生什么"，`useFormState` 告诉你"发生了什么"。

## 5. 常见问题 (FAQ)

### 5.1 为什么我的 pending 永远是 false？

**问**：我在组件中调用了 `useFormStatus`，但 `pending` 始终是 `false`，即使表单正在提交也不改变。

**答**：这是 `useFormStatus` 最常见的误用。原因通常是：

1. **调用位置错误**：`useFormStatus` 必须在 `<form>` 的**子组件**中调用，不能在渲染 `<form>` 的同一组件中调用。

```jsx
// ❌ 错误：与 form 在同一组件
function Form() {
  const { pending } = useFormStatus(); // pending 永远为 false
  return <form action={action}>...</form>;
}

// ✅ 正确：在子组件中调用
function SubmitButton() {
  const { pending } = useFormStatus(); // ✅ 可以正常工作
  return <button disabled={pending}>提交</button>;
}

function Form() {
  return (
    <form action={action}>
      <SubmitButton />
    </form>
  );
}
```

2. **没有父级 `<form>`**：如果组件没有被包裹在 `<form>` 元素中，`pending` 也会始终为 `false`。

### 5.2 如何在 Next.js 中使用 useFormStatus？

**问**：我在 Next.js 项目中尝试使用 `useFormStatus`，但遇到了错误。

**答**：在 Next.js 中使用 `useFormStatus` 需要注意几点：

1. **确保使用正确的 React 版本**：`useFormStatus` 需要 React 19 或最新的 Canary 版本。
2. **必须是客户端组件**：由于 `useFormStatus` 是 Hook，使用它的组件必须标记为 `"use client"`。
3. **在 Next.js 13.4+ 中启用 Server Actions**：需要在 `next.config.js` 中启用实验性功能。

```jsx
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
  },
};

// app/components/SubmitButton.tsx
"use client";  // 必须标记为客户端组件

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// app/page.tsx (服务器组件)
import { SubmitButton } from './components/SubmitButton';

async function handleSubmit(formData) {
  'use server';
  // 处理表单提交
}

export default function Page() {
  return (
    <form action={handleSubmit}>
      <input name="name" />
      <SubmitButton />
    </form>
  );
}
```

### 5.3 如何访问表单中特定字段的值？

**问**：我想在提交时显示用户输入的具体内容（比如"正在为 username 创建账号"），该怎么做？

**答**：使用 `data` 属性和 `FormData` 的 `get` 方法：

```jsx
function StatusDisplay() {
  const { pending, data } = useFormStatus();
  
  if (!pending || !data) return null;
  
  const username = data.get('username');
  const email = data.get('email');
  
  return (
    <div>
      正在为 {username} ({email}) 创建账号...
    </div>
  );
}
```

### 5.4 useFormStatus 可以与 onSubmit 事件一起使用吗？

**问**：我既想用 `useFormStatus` 的便捷性，又需要 `onSubmit` 事件来做一些客户端处理，可以同时使用吗？

**答**：可以同时使用，但要注意**执行顺序**：`onSubmit` 会优先于 `action` 执行。如果在 `onSubmit` 中调用了 `preventDefault()`，`action` 将不会执行，`useFormStatus` 也就不会更新。

```jsx
function Form() {
  function handleSubmit(e) {
    e.preventDefault(); // ❌ 这会阻止 action 执行
    // 客户端逻辑...
  }
  
  return (
    <form onSubmit={handleSubmit} action={serverAction}>
      <SubmitButton />
    </form>
  );
}
```

如果需要在提交前做客户端验证，更好的做法是在 Action 内部进行验证，或使用 `useFormState` 返回验证错误。

### 5.5 可以在一个组件中多次调用 useFormStatus 吗？

**问**：我的表单有多个需要知道提交状态的组件，每个组件都可以独立调用 `useFormStatus` 吗？

**答**：**是的**，可以在任意多个子组件中调用 `useFormStatus`，它们都会获取到相同的父级表单状态。这是 `useFormStatus` 的一个优势：任何深层的子组件都可以获取表单状态，无需通过 props 层层传递。

```jsx
function Form() {
  return (
    <form action={action}>
      <DeeplyNestedComponent />
      <AnotherComponent />
    </form>
  );
}

function DeeplyNestedComponent() {
  const { pending } = useFormStatus(); // ✅ 可以获取状态
  return <div>{pending && '提交中...'}</div>;
}

function AnotherComponent() {
  const { pending } = useFormStatus(); // ✅ 也可以获取状态
  return <input disabled={pending} />;
}
```

### 5.6 在测试环境中如何模拟 useFormStatus？

**问**：我需要在单元测试中测试使用了 `useFormStatus` 的组件，该怎么做？

**答**：可以模拟 `useFormStatus` 的返回值。以下是一个使用 Jest 的示例：

```jsx
import { useFormStatus } from 'react-dom';

// 模拟 useFormStatus
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}));

describe('SubmitButton', () => {
  it('当 pending 为 true 时显示加载状态', () => {
    // 模拟 pending 状态
    useFormStatus.mockReturnValue({
      pending: true,
      data: null,
      method: 'post',
      action: null,
    });
    
    render(<SubmitButton />);
    expect(screen.getByText('提交中...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('当 pending 为 false 时显示正常状态', () => {
    useFormStatus.mockReturnValue({
      pending: false,
      data: null,
      method: 'post',
      action: null,
    });
    
    render(<SubmitButton />);
    expect(screen.getByText('提交')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
```

### 5.7 可以获取 method 和 action 属性吗？有什么用？

**问**：`useFormStatus` 返回的 `method` 和 `action` 属性有什么实际用途？

**答**：虽然 `pending` 是最常用的属性，但 `method` 和 `action` 在某些场景下也很有用：

- **`method`**：可以用来在 UI 中显示表单的提交方式，或在需要根据方法类型做不同处理时使用。
- **`action`**：可以获取到父级表单的 action 函数引用，在一些高级场景中可能需要用到。

```jsx
function FormDebugger() {
  const { pending, method, action } = useFormStatus();
  
  return (
    <div className="debug-info">
      <p>提交中: {pending ? '是' : '否'}</p>
      <p>HTTP 方法: {method}</p>
      <p>Action 类型: {typeof action}</p>
    </div>
  );
}
```

### 5.8 如何结合 useOptimistic 实现乐观更新？

**问**：我想在表单提交时立即显示预期结果，同时用 `useFormStatus` 显示提交状态，这两者如何结合？

**答**：`useFormStatus` 和 `useOptimistic` 是 React 19 表单处理的"黄金搭档"：`useFormStatus` 处理 UI 的等待状态，`useOptimistic` 处理数据的乐观更新。

```jsx
import { useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

function CommentList({ comments, addComment }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [...state, { ...newComment, sending: true }]
  );
  
  return (
    <div>
      <CommentForm addComment={addComment} addOptimistic={addOptimisticComment} />
      <ul>
        {optimisticComments.map(comment => (
          <li key={comment.id} className={comment.sending ? 'opacity-50' : ''}>
            {comment.text}
            {comment.sending && ' (发送中...)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentForm({ addComment, addOptimistic }) {
  const { pending } = useFormStatus();
  
  async function formAction(formData) {
    const text = formData.get('comment');
    // 乐观更新
    addOptimistic({ text, id: Date.now() });
    // 实际提交
    await addComment(text);
  }
  
  return (
    <form action={formAction}>
      <input name="comment" placeholder="写评论..." disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? '发送中...' : '发送'}
      </button>
    </form>
  );
}
```
