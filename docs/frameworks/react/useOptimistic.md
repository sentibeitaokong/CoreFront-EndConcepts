---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useOptimistic`](https://zh-hans.react.dev/reference/react/useOptimistic): 打造极致流畅的“乐观 UI”交互体验**

在现代 Web 应用中，用户体验的最高境界之一就是“零延迟”的错觉。当用户点赞、发送消息或提交表单时，如果每次都要等待服务器响应（转圈圈）后才更新 UI，会让人感到卡顿和割裂。

“乐观 UI（Optimistic UI）”是一种设计模式：我们“乐观”地假设网络请求一定会成功，并在发起请求的瞬间立刻更新 UI；如果请求最终失败，再将 UI 回滚到之前的状态。`useOptimistic` 是 React 19（及实验性版本）中专门为了原生支持这一模式而推出的强大 Hook。

## 1. 核心概念与基础语法

```js
const [optimisticState, setOptimistic] = useOptimistic(value, reducer?);
```

### 1.1 基本定义与应用场景

`useOptimistic` 允许你在执行异步操作（如网络请求）期间，展示一个与当前真实状态不同的“乐观状态”。一旦异步操作完成（或失败），它会自动丢弃乐观状态，恢复并同步为真实的服务器状态。

**核心应用场景**：点赞按钮、评论提交、购物车数量增减、待办事项状态切换等需要即时视觉反馈的交互。

```jsx
import { useOptimistic } from 'react';

function MessageList({ messages, sendMessage }) {
  // 1. 接收真实状态 (messages) 和一个更新函数
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    // 当调用 addOptimisticMessage 时，这个纯函数决定了乐观状态该长什么样
    (state, newMessage) => [...state, { text: newMessage, sending: true }]
  );

  async function formAction(formData) {
    const text = formData.get('message');
    // 2. 立即触发乐观更新，UI 瞬间改变
    addOptimisticMessage(text);
    // 3. 执行真正的异步网络请求（必须在 Action 或 Transition 中）
    await sendMessage(text); 
  }

  return (
    <>
      <ul>
        {optimisticMessages.map((msg, index) => (
          <li key={index}>
            {msg.text} {msg.sending && <small>(发送中...)</small>}
          </li>
        ))}
      </ul>
      <form action={formAction}>
        <input name="message" type="text" />
        <button type="submit">发送</button>
      </form>
    </>
  );
}
```

## 2. 核心进阶：解决异步网络延迟带来的“交互卡顿”难题

在 `useOptimistic` 出现之前，开发者为了实现乐观更新，通常需要手动维护多套状态（如 `isPending`、`tempData` 等），并在 `try...catch` 中手动编写繁琐的回滚逻辑。这不仅容易写出 Bug，还难以应对并发请求。

### 2.1 痛点场景：手动维护乐观状态导致的代码面条化

**痛点场景**：传统的乐观更新通常需要你先 `setMessages(乐观数据)`，然后发请求。如果请求失败，你必须在 `catch` 块里再 `setMessages(把之前的数据塞回去)`。如果有多个请求并发发生，手动回滚极易导致数据彻底错乱。

**解决原则**：**将状态的管理权交还给 React 的并发渲染机制（Concurrent Features）。`useOptimistic` 创建的状态只存活在“异步 Action 执行期间”。只要 Action 结束，乐观状态就会自动消亡，UI 会自然地回退到由 Props 或外部 State 传入的“真实真理（Single Source of Truth）”。**

```jsx
// ❌ 错误/过时的示范 (手动维护回滚)：极易在并发时出错
async function handleLikeOld() {
  setLikes(likes + 1); // 乐观更新
  try {
    await api.likePost();
  } catch (e) {
    setLikes(likes - 1); // 手动回滚（如果连续点多次，这里会出大 bug）
  }
}

// ✅ 正确示范 (使用 useOptimistic)：无需手动回滚
async function handleLikeNew() {
  // 1. 触发乐观状态
  addOptimisticLike(1); 
  // 2. 发起请求
  await api.likePost(); 
  // 请求结束后，React 会自动根据真实的外部状态重新渲染，无需任何回滚代码！
}
```

## 3. 高阶进阶：与 Actions 和表单的深度结合

### 3.1 突破死穴：乐观更新的生命周期绑定

**痛点场景**：很多开发者调用了 `addOptimistic(...)` 却发现 UI 并没有自动回滚，或者状态变得非常奇怪。这是因为他们没有在正确的上下文中触发异步请求。

**解决原则**：**`useOptimistic` 必须与 React 的 `Transition` 或 `Action`（如 `<form action>` 或 `startTransition`）绑定使用！**
React 通过跟踪 Transition 的 pending 状态来决定乐观状态的生命周期。当 Transition 处于 pending（进行中）时，显示乐观状态；当 Transition 结束（settled）时，丢弃乐观状态。

```jsx
import { useOptimistic, startTransition } from 'react';

function LikeButton({ initialLikes, updateServer }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (currentLikes, amount) => currentLikes + amount
  );

  const onClick = () => {
    // ✅ 必须包裹在 Transition 中！
    // 这样 React 才知道 addOptimisticLike 属于这个特定的异步任务
    startTransition(async () => {
      addOptimisticLike(1); // 立即更新 UI (+1)
      await updateServer(); // 等待服务器响应
      // 任务结束，乐观状态失效，UI 同步为 updateServer 带来的最新 initialLikes
    });
  };

  return <button onClick={onClick}>👍 {optimisticLikes}</button>;
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我可以不在表单 `<form action>` 或 `startTransition` 中使用它吗？
*   **答**：**强烈不建议，且通常无法正常工作。**
    *   如果你在普通的同步 `onClick` 处理函数（没有使用 `startTransition`）中调用 `addOptimistic`，React 无法追踪你的异步网络请求何时结束。
    *   这就意味着 React 不知道什么时候该“丢弃”这个乐观状态，导致 UI 无法正确回滚或与服务器状态同步。
    *   **避坑方案**：始终将网络请求和 `addOptimistic` 的调用放在 `startTransition` 回调中，或者使用 React 19 的 `<form action={...}>` 属性（它底层自动被处理为 Transition）。

### 4.2 如果网络请求失败了，我需要手动写代码恢复原本的数据吗？
*   **答**：**完全不需要。**
    *   这正是 `useOptimistic` 最强大的魔法。当你的异步 Transition 函数抛出错误或执行完毕时，React 会自动“卸载”通过 `addOptimistic` 应用的更新。
    *   UI 会立刻回退到你传入 `useOptimistic` 的第一个参数（即真实的 `state`）。你只需要在外部处理好真实数据的获取即可。

### 4.3 为什么我调用 `addOptimistic` 后，控制台打印出的状态还是旧的？
*   **答**：**因为状态更新在 React 中是排队的，且乐观状态也是不可变的（Immutable）。**
    *   和普通的 `setState` 一样，调用 `addOptimistic` 不会立即改变当前渲染闭包中的变量。它只是触发了一次新的渲染，在下一次渲染中，`optimisticState` 才会变成新的值。
    *   **避坑方案**：永远只在 JSX 渲染（Return 语句）中使用返回的乐观状态变量。不要在事件处理函数中试图去读取它刚刚被修改后的值。
