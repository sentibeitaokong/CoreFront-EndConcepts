# React Error Boundary（错误边界）

Error Boundary 是 React 中用于**捕获渲染阶段子组件错误**、避免整棵组件树崩溃白屏的机制。它通过在类组件中实现 `static getDerivedStateFromError` 与 `componentDidCatch` 两个生命周期，将错误「兜」在局部并渲染降级 UI。

## 1. 为什么需要错误边界

默认情况下，组件树中**任何一处渲染出错**都会导致 React **卸载整棵树**，呈现白屏。错误边界把故障隔离在边界之内，让其余部分继续可用，并有机会上报错误。

```javascript
// ❌ 无边界：某处抛错 → 整棵树崩溃
function App() {
  return (
    <div>
      <Header />
      <BuggyComponent /> {/* 抛错 */}
      <Footer /> {/* 也跟着没了 */}
    </div>
  )
}

// ✅ 有边界：仅降级边界内的 UI
function App() {
  return (
    <div>
      <Header />
      <ErrorBoundary fallback={<p>该模块加载失败，请刷新</p>}>
        <BuggyComponent />
      </ErrorBoundary>
      <Footer /> {/* 正常渲染 */}
    </div>
  )
}
```

## 2. 实现一个错误边界

错误边界**必须**是类组件（React 目前没有等价的函数组件 API）：

```javascript
import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  // 渲染阶段触发：用于切换降级 UI（必须是纯函数）
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // 提交阶段触发：用于副作用（上报错误、打日志）
  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到异常:', error, errorInfo.componentStack)
    // 上报到监控平台
    reportError(error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      // 可渲染自定义降级 UI，或调用 props.fallback
      return this.props.fallback ?? <h1>出错了，请重试</h1>
    }
    return this.props.children
  }
}

export default ErrorBoundary
```

### 2.1 两个生命周期方法的区别

| 方法                       | 触发阶段 | 用途                       | 限制                     |
| -------------------------- | -------- | -------------------------- | ------------------------ |
| `getDerivedStateFromError` | 渲染阶段 | 返回新 state，切换降级 UI  | 必须是纯函数，禁止副作用 |
| `componentDidCatch`        | 提交阶段 | 记录日志、上报错误等副作用 | 可自由执行副作用         |

## 3. 错误边界的局限性

错误边界**无法**捕获以下错误：

| 场景                 | 说明                                       | 处理方式               |
| -------------------- | ------------------------------------------ | ---------------------- |
| **事件处理器**       | `onClick` 等回调中的错误（不属于渲染阶段） | 在回调内 `try...catch` |
| **异步代码**         | `setTimeout` / `Promise` 回调中的错误      | 在回调内 `try...catch` |
| **服务端渲染 (SSR)** | 服务端渲染阶段错误                         | 在服务端做错误处理     |
| **错误边界自身**     | 边界组件自己的错误                         | 由更上层的边界捕获     |

```javascript
// 事件处理器中的错误边界捕获不到，需自行处理
function SaveButton() {
  const handleClick = () => {
    try {
      riskyOperation()
    } catch (err) {
      console.error(err)
      // 弹提示或上报
    }
  }
  return <button onClick={handleClick}>保存</button>
}
```

## 4. 函数式错误边界

由于函数组件无法直接实现 `componentDidCatch`，社区普遍使用 **`react-error-boundary`** 库，以更符合 Hooks 习惯的方式使用：

```javascript
import { ErrorBoundary } from 'react-error-boundary'

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>出错了：{error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error, info) => reportError(error, info)}
      onReset={() => {
        /* 清理状态 */
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

**`react-error-boundary` 的优势：**

- 提供 `resetErrorBoundary` 支持「重试」。
- `onReset` 钩子可在重试前重置相关状态。
- 支持 `resetKeys` 数组，当其变化时自动重置错误状态。

## 5. 异步错误如何「交给」边界

异步错误（事件、`setTimeout`、`Promise`、数据请求）默认**不会被错误边界捕获**，需要手动把它「抛回」渲染流程。有两种方式：

### 5.1 用 `useErrorBoundary` 手动抛出

`react-error-boundary` 提供 `useErrorBoundary`，返回 `showBoundary`，在异步回调里调用即可把错误交给最近的边界：

```javascript
import { useErrorBoundary } from 'react-error-boundary'

function SaveButton() {
  const { showBoundary } = useErrorBoundary()

  const handleSave = async () => {
    try {
      await saveData()
    } catch (err) {
      showBoundary(err) // 交给错误边界：渲染降级 + 统一上报
    }
  }

  return <button onClick={handleSave}>保存</button>
}
```

### 5.2 配合 Suspense「抛」异步错误

在数据层使用 `useSuspenseQuery` 等 Suspense 风格的 hook，请求失败时会自动 `throw`，由外层 Suspense + 错误边界协同捕获：

```javascript
function Profile() {
  // 失败时 useSuspenseQuery 内部 throw，外层 ErrorBoundary 捕获
  const { data } = useSuspenseQuery({ queryKey: ['user'], queryFn: fetchUser })
  return <div>{data.name}</div>
}

// 外层：ErrorBoundary + Suspense 成对出现
;<ErrorBoundary fallback={<p>加载用户失败</p>}>
  <Suspense fallback={<p>加载中…</p>}>
    <Profile />
  </Suspense>
</ErrorBoundary>
```

React 官方推荐的模式：**Error Boundary 捕获同步渲染错误，Suspense 捕获异步加载错误**，两者常成对出现。

## 6. 错误边界的放置策略

- **粒度分层**：顶层一个兜底边界 + 关键模块（如聊天窗、表单）各自独立的边界。
- **路由级边界**：每个路由包裹边界，单页崩溃不影响整体导航。
- **第三方组件**：为不稳定/依赖外部资源的第三方组件单独套边界。
- **懒加载组件**：`React.lazy` 的组件务必用边界兜底，防止 chunk 加载失败白屏。

```javascript
import { lazy, Suspense } from 'react'

const Editor = lazy(() => import('./Editor'))

function EditorPage() {
  return (
    <ErrorBoundary fallback={<p>编辑器加载失败</p>}>
      <Suspense fallback={<p>加载中…</p>}>
        <Editor />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## 7. 错误上报集成

错误边界的 `componentDidCatch` 是接入监控平台（Sentry、Bugsnag）的**最佳入口**：

```javascript
import * as Sentry from '@sentry/react'

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.withScope(scope => {
      scope.setExtras(errorInfo) // 携带 componentStack
      Sentry.captureException(error)
    })
  }
  // ...
}
```

> **注意：** 错误边界捕获错误后，React 的 `onUncaughtError` / `window.onerror` 默认**不再触发**，因此上报逻辑必须写在 `componentDidCatch` 内，避免遗漏。

### 7.1 React 19 的 root 错误钩子

React 19 为 `createRoot` 新增了 `onCaughtError` 与 `onUncaughtError` 两个选项，可替代全局 `window.onerror` 做统一兜底：

```javascript
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root'), {
  // 有错误边界捕获时触发
  onCaughtError(error, errorInfo) {
    reportToSentry(error, errorInfo)
  },
  // 无任何边界捕获、错误泄漏到根时触发（替代 window.onerror）
  onUncaughtError(error, errorInfo) {
    reportToSentry(error, errorInfo)
  },
}).render(<App />)
```

| 钩子              | 触发时机                                                  |
| ----------------- | --------------------------------------------------------- |
| `onCaughtError`   | 错误被某个 Error Boundary 的 `componentDidCatch` 捕获时   |
| `onUncaughtError` | 错误未被任何边界捕获、最终泄漏时（替代 `window.onerror`） |

## 8. 最佳实践总结

- **只兜渲染错误**：事件、异步错误在源头 `try...catch`。
- **提供可操作降级**：降级 UI 应包含「重试」入口，而非仅一句报错文案。
- **分层设置边界**：顶层兜底 + 局部隔离，避免「一处崩、处处崩」。
- **成对使用 Suspense**：异步加载错误交给 Suspense + 边界协同处理。
- **务必上报**：`componentDidCatch` 是连接监控平台的关键钩子。

## 9. 使用示例：分层边界 + 重试 + 上报

```javascript
import { ErrorBoundary } from 'react-error-boundary'
import { lazy, Suspense } from 'react'

// 降级 UI：展示错误 + 重试按钮
function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>模块加载失败：{error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

const Editor = lazy(() => import('./Editor'))

export default function App() {
  return (
    // 顶层兜底边界：任何子组件崩溃都不会白屏
    <ErrorBoundary
      FallbackComponent={Fallback}
      onReset={() => {
        /* 清理脏状态 */
      }}
      onError={(error, info) => reportError(error, info)}
    >
      <Header />
      {/* 局部边界：编辑器加载失败只影响该区域 */}
      <ErrorBoundary fallback={<p>编辑器加载失败</p>}>
        <Suspense fallback={<p>加载中…</p>}>
          <Editor />
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  )
}
```

> 结构：顶层兜底 + 局部隔离，配合 `resetErrorBoundary` 提供「重试」，`onError` 统一上报。
