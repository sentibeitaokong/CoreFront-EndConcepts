# React useOptimistic 

## 1. 概览：什么是 useOptimistic？

`useOptimistic` 是 React 19 引入的一个革命性 Hook，它让实现**乐观更新（Optimistic UI）**变得前所未有的简单。乐观更新是一种用户体验模式：**假设操作一定会成功，立即在界面上反馈结果，同时在后台悄悄地与服务器同步**。

### 1.1 核心价值：让应用“感觉”飞快

当用户点击“点赞”按钮时，是应该转圈等待服务器响应，还是让爱心立刻变红？前者符合逻辑，后者符合人性。`useOptimistic` 正是为了实现后者而生。

-   **传统模式**：用户操作 → 等待服务器 → 更新 UI（用户能感知到延迟）
-   **乐观模式**：用户操作 → **立即更新 UI** → 同步服务器（用户感觉“秒响应”）

### 1.2 为什么需要这个 Hook？

在 `useOptimistic` 出现之前，开发者也可以手动实现乐观更新，但需要处理很多棘手的问题：

-   在请求发出去之前手动更新 UI
-   如果请求失败，需要回滚到之前的状态
-   处理并发请求时的状态混乱
-   确保与 React 并发渲染机制兼容

`useOptimistic` 将这些复杂性封装起来，提供了一个优雅的声明式 API。

## 2. API 语法与基本使用

### 2.1 基本语法

```jsx
import { useOptimistic } from 'react';

function MyComponent() {
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    actualState,        // 真实的、来自服务器的状态
    (currentState, optimisticValue) => {
      // 更新函数：定义如何将乐观值合并到当前状态
      // 必须是一个纯函数
      return mergedState;
    }
  );
}
```

### 2.2 API 速览

| 特性 | 说明 |
| :--- | :--- |
| **参数** | `actualState`：真实的源数据；`updateFn`：定义如何合并乐观更新的纯函数 |
| **返回值** | `[optimisticState, addOptimistic]`：当前要显示的乐观状态，以及触发乐观更新的函数 |
| **调用位置** | 必须在组件顶层或自定义 Hook 中调用 |
| **核心机制** | 当调用 `addOptimistic` 时，立即用 `updateFn` 计算新状态并展示；操作完成后自动恢复为真实状态 |

### 2.3 最简示例：点赞按钮

```jsx
import { useOptimistic, useState, startTransition } from 'react';

function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (currentLikes, delta) => currentLikes + delta
  );

  async function handleLike() {
    // 1. 立即乐观更新：数字+1
    addOptimisticLike(1);
    
    // 2. 在后台执行真正的 API 调用
    startTransition(async () => {
      try {
        await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        // 成功：更新真实状态（乐观状态会自动与其同步）
        setLikes(l => l + 1);
      } catch (error) {
        // 失败：不需要手动回滚，真实状态不变，乐观状态自动恢复
        console.error('点赞失败', error);
      }
    });
  }

  return (
    <button onClick={handleLike}>
      👍 {optimisticLikes}
    </button>
  );
}
```

## 3. 实战案例：从简单到复杂

### 3.1 评论列表的乐观添加

这是最经典的场景——用户提交评论，希望它立刻出现在列表中。

```jsx
import { useOptimistic, useState, useRef, startTransition } from 'react';

function CommentSection({ initialComments, submitComment }) {
  const [comments, setComments] = useState(initialComments);
  const formRef = useRef();
  
  // 定义乐观更新：将新评论临时添加到列表顶部，并标记为“发送中”
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (currentComments, newComment) => [
      { ...newComment, id: Date.now(), sending: true },
      ...currentComments,
    ]
  );

  async function handleSubmit(formData) {
    const text = formData.get('comment');
    if (!text.trim()) return;

    // 1. 立即显示乐观评论
    addOptimisticComment({ text, author: '当前用户' });
    formRef.current.reset();

    // 2. 后台发送到服务器
    startTransition(async () => {
      const savedComment = await submitComment(text);
      setComments(prev => [{ ...savedComment }, ...prev]);
    });
  }

  return (
    <div>
      <form ref={formRef} action={handleSubmit}>
        <input name="comment" placeholder="写评论..." />
        <button type="submit">发送</button>
      </form>
      <ul>
        {optimisticComments.map(comment => (
          <li key={comment.id} className={comment.sending ? 'opacity-50' : ''}>
            {comment.text} {comment.sending && <small>（发送中...）</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.2 多步骤操作的进度反馈

有时候一个操作需要多个步骤，`useOptimistic` 可以优雅地展示阶段性进度。

```jsx
import { useOptimistic, startTransition } from 'react';

function FlightBooking({ onBook }) {
  const [message, setMessage] = useOptimistic('准备就绪');

  async function handleBooking(formData) {
    startTransition(async () => {
      // 步骤1：预订座位
      setMessage('正在预订座位...');
      await reserveSeat(formData.get('flight'));
      
      // 步骤2：处理支付
      setMessage('正在处理支付...');
      await processPayment(formData.get('passenger'));
      
      // 步骤3：发送确认
      setMessage('正在发送确认邮件...');
      await sendConfirmation();
      
      // 完成
      setMessage('预订成功！');
    });
  }

  return (
    <form action={handleBooking}>
      {/* 表单内容 */}
      <div>状态：{message}</div>
    </form>
  );
}
```

### 3.3 与复杂状态的集成

当真实状态在乐观更新期间发生变化时，`useOptimistic` 的 `updateFn` 会重新执行，确保乐观状态始终基于最新的真实数据。

```jsx
const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  todos, // 真实状态可能在其他地方被更新
  (currentTodos, newTodo) => [
    { ...newTodo, id: 'temp-' + Date.now(), optimistic: true },
    ...currentTodos,
  ]
);
```

## 4. 深度对比：useOptimistic vs 传统方案

### 4.1 useOptimistic vs 手动状态管理

| 维度 | 手动实现 | useOptimistic |
| :--- | :--- | :--- |
| **代码复杂度** | 需要手动管理临时状态、回滚逻辑 | 内置机制，代码简洁 |
| **并发安全** | 容易在快速连续操作时出错 | 专为并发设计，自动处理竞态 |
| **与 React 集成** | 可能破坏并发渲染 | 无缝集成 Transition 和 Action |
| **错误处理** | 需要手动回滚 | 操作失败时自动恢复 |

### 4.2 useOptimistic vs React Query 的乐观更新

这是一个常见的疑问：既然 React Query 也支持乐观更新，为什么还需要 `useOptimistic`？

-   **React Query**：适用于**全局的、服务端状态**的乐观更新，通过缓存操作实现。
-   **useOptimistic**：适用于**局部的、组件内状态**的乐观更新，更轻量、更与 React 的并发特性紧密结合。

**最佳实践**：两者可以共存。React Query 管理服务端缓存，`useOptimistic` 处理 UI 层的即时反馈。在复杂的应用中，它们可以协同工作。

## 5. 常见问题 (FAQ)

### 5.1 为什么我调用 addOptimistic 后 UI 没有立即更新？

**答**：最可能的原因是**没有将 `addOptimistic` 的调用放在 `startTransition` 或 Action 中**。

```jsx
// ❌ 错误：会触发警告，可能无法正常工作
function handleClick() {
  addOptimisticLike(1);
  await saveToServer();
}

// ✅ 正确：包裹在 startTransition 中
function handleClick() {
  startTransition(async () => {
    addOptimisticLike(1);
    await saveToServer();
  });
}

// ✅ 更简洁：如果使用表单的 action 属性，会自动处理
async function formAction(formData) {
  addOptimisticLike(1);
  await saveToServer();
}
```

### 5.2 连续快速点击时，为什么乐观状态会混乱？

**答**：这可能是由于**竞态条件**导致的。`useOptimistic` 虽然设计用于处理并发，但如果 `updateFn` 的实现不当，仍然可能出现问题。

**解决方案**：确保 `updateFn` 是纯函数，并且**基于当前状态进行合并**，而不是简单覆盖。同时，为乐观条目生成稳定的临时 ID（如 `crypto.randomUUID()`）可以帮助 React 正确区分不同的条目。

```jsx
// ✅ 安全的 updateFn
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,
  (current, newItem) => [
    { ...newItem, id: crypto.randomUUID(), temp: true },
    ...current,
  ]
);
```

### 5.3 错误处理的最佳实践是什么？

**答**：`useOptimistic` 在操作失败时会**自动回滚**到真实状态，所以你只需要专注于错误提示。

```jsx
const [error, setError] = useState(null);

async function handleSubmit(formData) {
  startTransition(async () => {
    try {
      setError(null);
      addOptimisticMessage(formData.get('text'));
      await sendToServer(formData);
    } catch (err) {
      setError('发送失败，请重试');
      // 不需要手动回滚状态
    }
  });
}
```

### 5.4 useOptimistic 和 useTransition 是什么关系？

**答**：它们是**协作关系**：

-   **`useTransition`** 提供 `startTransition` 函数，用于标记非紧急更新，让 React 知道这个更新可以被中断。
-   **`useOptimistic`** 的 `addOptimistic` 函数**必须**在 `startTransition` 或 React 19 的 Action 上下文中调用。

如果你使用 React 19 的 `<form action={...}>` 或服务器函数（Server Functions），它们会自动运行在 Transition 中，无需手动包裹 `startTransition`。

### 5.5 我可以对同一个组件中的多个值使用 useOptimistic 吗？

**答**：**可以**。与 `useState` 类似，你可以在一个组件中多次调用 `useOptimistic` 来管理不同的状态片段。

```jsx
function EditPost({ post }) {
  const [optimisticTitle, setOptimisticTitle] = useOptimistic(post.title);
  const [optimisticContent, setOptimisticContent] = useOptimistic(post.content);
  // ...
}
```

### 5.6 在服务器端渲染（SSR）中，useOptimistic 会执行吗？

**答**：`useOptimistic` 只会在**客户端**的初始挂载时执行一次，返回初始状态。在服务器端，它不会执行任何乐观更新逻辑，因为服务器上没有“等待中的操作”。在服务端，它只是简单返回传入的 `actualState`。这符合 SSR 的需求：确保服务端和客户端初始渲染的 HTML 一致。

### 5.7 如何处理复杂的嵌套对象更新？

**答**：`updateFn` 应该是纯函数，并且**不可变地更新状态**。对于嵌套对象，使用展开运算符或 Immer 等工具库。

```jsx
// 使用展开运算符处理嵌套
const [optimisticUser, addOptimisticUserUpdate] = useOptimistic(
  user,
  (currentUser, update) => ({
    ...currentUser,
    profile: {
      ...currentUser.profile,
      ...update.profile,
    },
    lastUpdated: Date.now(),
  })
);
```

### 5.8 如果我的 API 返回的数据结构与乐观状态不同怎么办？

**答**：当 API 成功返回后，你通常会用真实数据更新状态（如 `setItems(apiData)`）。此时，由于真实状态中不包含 `isSending` 字段，乐观状态会自动与真实状态同步，临时字段会消失。

如果你希望在真实数据到来时保留某些临时状态，可以在 `setItems` 时进行数据合并。

```jsx
startTransition(async () => {
  const savedItem = await saveToServer(newItem);
  // 合并：用服务器返回的真实数据替换乐观条目
  setItems(prev => prev.map(item => 
    item.id === tempId ? savedItem : item
  ));
});
```

### 5.9 我可以用 useOptimistic 实现撤销（Undo）功能吗？

**答**：可以，但需要一些额外的工作。你可以在乐观更新时保存一个“快照”，并提供一个撤销函数。

```jsx
function TodoItem({ todo, onToggle }) {
  const [optimisticCompleted, addOptimisticToggle] = useOptimistic(
    todo.completed
  );

  function handleToggle() {
    // 保存原始状态用于可能的撤销
    const originalCompleted = todo.completed;
    
    addOptimisticToggle(!originalCompleted);
    
    startTransition(async () => {
      try {
        await onToggle(todo.id, !originalCompleted);
      } catch (error) {
        // 自动回滚
        // 同时可以显示撤销选项
        showUndoOption(() => {
          // 手动触发另一次乐观更新来回滚
          addOptimisticToggle(originalCompleted);
        });
      }
    });
  }
  // ...
}
```


