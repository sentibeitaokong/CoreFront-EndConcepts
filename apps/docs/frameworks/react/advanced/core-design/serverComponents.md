# React Server Components (RSC)

React Server Components（RSC）是 React 19 引入的**新渲染范式**，它让组件可以在**服务端渲染**并直接与数据库、文件系统等后端资源交互，同时把交互所需的最小 JS 只发给客户端。RSC 是 Next.js App Router 的核心底层，代表着 React 从「纯客户端渲染」向「服务端优先」的重大演进。

## 1. 背景与动机

传统 CSR 与 SSR 的痛点：

| 方案         | 问题                                              |
| ------------ | ------------------------------------------------- |
| **CSR**      | 首屏需等待 JS 加载执行，SEO 差，数据请求需往返    |
| **传统 SSR** | 首屏 HTML 快，但**所有组件**仍需下载并水合完整 JS |
| **RSC**      | 服务端组件**零 JS** 下发，仅交互组件携带 JS       |

RSC 的核心价值：

- **减少客户端 Bundle**：服务端组件的代码与依赖不下发到浏览器。
- **直接访问后端**：组件内可直接查询数据库、读文件，无需 API 往返。
- **天然流式渲染**：配合 Suspense 边渲染边传输。

## 2. 服务端组件 vs 客户端组件

RSC 将组件明确划分为两类：

| 维度               | Server Component                | Client Component           |
| ------------------ | ------------------------------- | -------------------------- |
| **运行位置**       | 服务端（或构建时）              | 浏览器                     |
| **JS 下发**        | 不发送 JS                       | 发送 JS                    |
| **能力**           | 可访问数据库/文件系统、`async`  | 有 state、effect、事件处理 |
| **标记**           | 默认即为服务端组件              | 文件顶部加 `'use client'`  |
| **能否使用 Hooks** | ❌（无 `useState`/`useEffect`） | ✅ 全部 Hooks              |
| **能否绑定事件**   | ❌ 无事件处理                   | ✅ `onClick` 等            |

```jsx
// app/page.jsx —— 默认是服务端组件，可以 async
export default async function Page() {
  const posts = await db.query('SELECT * FROM posts') // 直接访问数据库
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

```jsx
// app/Counter.jsx —— 客户端组件
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## 3. `'use client'` 与 `'use server'` 指令

| 指令           | 作用                               | 位置               |
| -------------- | ---------------------------------- | ------------------ |
| `'use client'` | 声明该文件及其依赖为客户端组件边界 | 文件顶部第一行     |
| `'use server'` | 声明 Server Action（服务端函数）   | 函数顶部或文件顶部 |

- **`'use client'` 是边界**：一旦某组件标记为客户端组件，它导入的所有子组件默认也运行在客户端。
- 服务端组件可以**导入客户端组件**（作为叶子交互节点），但客户端组件**不能导入服务端组件**（只能通过 `children` 或 props 传递）。

```jsx
// ✅ 服务端组件导入客户端组件
import ClientCounter from './ClientCounter'

export default function Page() {
  return <ClientCounter />
}
```

```jsx
// ❌ 客户端组件不能导入服务端组件
'use client'
import ServerComponent from './ServerComponent' // 会导致其降级为客户端组件
```

## 4. 渲染与传输机制

### 4.1 RSC 序列化载荷 (Payload)

服务端组件**不发送 HTML 字符串**，而是发送一个**序列化的 React 元素树**（RSC Payload）。其中：

- 原生标签 → 序列化为对象。
- 客户端组件引用 → 序列化为对该 chunk 的引用（占位符）。
- 数据 → 作为 props 直接内联进载荷。

客户端收到 Payload 后，与客户端组件 chunk **合并**，形成完整组件树并渲染。

以如下服务端组件为例：

```jsx
export default async function Page() {
  const post = await db.query('SELECT * FROM posts WHERE id = 1')
  return (
    <div>
      <h1>{post.title}</h1>
      <LikeButton postId={post.id} />
    </div>
  )
}
```

序列化后的载荷大致结构（示意，非真实字节）：

```text
// 原生元素 + 内联数据 + 客户端引用占位符
M1: { "div", props: { children: [...] } }        // 原生标签 → 对象
J2: "Hello World"                                 // 查询结果 → 内联进 props
I3: { "chunk": "/LikeButton.js" }                 // 客户端组件 → chunk 引用
```

- 原生标签与文本被序列化为**对象 / 字面量**，直接内联进载荷。
- 客户端组件（`LikeButton`）只序列化为对**该 chunk 的引用**，代码本身不下发进载荷。
- 客户端收到后加载 `LikeButton.js` 的 chunk，与内联数据合并，最终「拼」出完整 UI。

### 4.2 流式渲染 (Streaming)

RSC 配合 Suspense 实现**逐块流式传输**，不必等整个页面数据就绪：

```jsx
import { Suspense } from 'react'
import { SlowComponent, Loading } from './components'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <SlowComponent /> {/* 先展示 fallback，数据就绪后流式补上 */}
      </Suspense>
    </div>
  )
}
```

## 5. Server Actions

`'use server'` 声明的函数可以直接从客户端调用，由 React 在服务端执行，用于数据变更（表单提交等），省去手写 API 路由。

```jsx
// app/actions.js
'use server'

import { db } from './db'

export async function createPost(formData) {
  const title = formData.get('title')
  await db.insert({ title })
  // 服务端可做鉴权、校验
  revalidatePath('/posts')
}
```

```jsx
// app/form.jsx —— 客户端组件中调用 Server Action
'use client'
import { createPost } from './actions'

export default function Form() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">提交</button>
    </form>
  )
}
```

**特性：**

- 支持渐进增强：无 JS 时表单也能通过普通 POST 提交。
- 可结合 `useActionState`、`useOptimistic` 做乐观更新与 pending 状态。
- 函数参数与返回值需**可序列化**（不能传函数、类实例等）。

## 6. 服务端组件的限制

- ❌ 不能使用 `useState`、`useEffect`、`useContext` 等客户端 Hooks。
- ❌ 不能绑定事件处理器（`onClick` 等）。
- ❌ 不能使用浏览器专属 API（`window`、`document`、`localStorage`）。
- ✅ 可以是 `async` 函数，直接 `await` 数据。

> **注意：** 违反这些限制会导致组件被强制转为客户端组件，或在构建/运行时报错。判断依据：**「这段逻辑是否只在浏览器里才成立」**，是则必须放客户端组件。

## 7. 与现有概念的关系

| 概念             | 关系                                                 |
| ---------------- | ---------------------------------------------------- |
| **Suspense**     | RSC 流式渲染的边界，异步数据就绪的标记               |
| **Hydration**    | 客户端组件在浏览器「激活」的过程，RSC 无此过程       |
| **`React.lazy`** | 客户端代码分割；RSC 下由框架自动按路由/chunk 分割    |
| **SSR**          | RSC 是 SSR 的扩展：传统 SSR 全量水合，RSC 选择性水合 |

## 8. 最佳实践总结

- **默认服务端**：能放服务端的组件尽量放服务端，只有需要交互时才加 `'use client'`。
- **叶子交互化**：把交互下沉到最小的客户端叶子组件，减少下发 JS。
- **数据就近**：服务端组件内直接取数据，减少客户端请求与瀑布。
- **注意序列化**：传给客户端组件的 props 必须可序列化（不含函数、Class 实例）。
- **`'use client'` 是边界而非位置**：它标记的是「进入客户端的入口」，理解这一点是正确拆分组件树的关键。

## 9. 使用示例：一个完整的 RSC 应用

```jsx
// app/layout.jsx —— 服务端布局，直接读数据
export default async function Layout({ children }) {
  const user = await getCurrentUser()
  return (
    <html>
      <body>
        <header>{user.name}</header>
        {children}
      </body>
    </html>
  )
}
```

```jsx
// app/page.jsx —— 服务端组件，组合服务端/客户端子组件
import { Suspense } from 'react'
import PostList from './PostList'
import LikeButton from './LikeButton'

export default function Page() {
  return (
    <main>
      <Suspense fallback={<p>加载中…</p>}>
        <PostList /> {/* 服务端组件：直接查库 */}
      </Suspense>
      <LikeButton postId={1} /> {/* 客户端组件：交互叶子 */}
    </main>
  )
}
```

```jsx
// app/PostList.jsx —— 服务端组件，async 查库
export default async function PostList() {
  const posts = await db.query('SELECT * FROM posts LIMIT 20')
  return (
    <ul>
      {posts.map(p => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
```

```jsx
// app/LikeButton.jsx —— 客户端组件（唯一的交互叶子）
'use client'
import { useState } from 'react'

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false)
  return (
    <button onClick={() => setLiked(!liked)}>{liked ? '已赞' : '点赞'}</button>
  )
}
```

**关键点：** 只有 `LikeButton` 这一小段交互逻辑会下发 JS；`PostList` 的数据库查询与渲染全部在服务端完成，浏览器拿不到任何 SQL 语句或后端依赖。
