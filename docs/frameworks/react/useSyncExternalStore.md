# React useSyncExternalStore

## 1. 概览：什么是 useSyncExternalStore？

`useSyncExternalStore` 是 React 18 引入的一个 Hook，它提供了一种标准化的方式，让 React 组件能够**订阅外部数据源**，并保证在 React 并发渲染特性（如 `startTransition`、`useDeferredValue` 等）下，组件读取的数据始终是**一致的**，避免出现 UI 撕裂（tearing）的问题。

### 1.1 核心作用
- **安全地读取外部存储**：使 React 组件能够订阅任何遵循特定接口的外部数据源（例如 Redux store、Zustand store、浏览器 API 如 `navigator.onLine`、`window.innerWidth` 等）。
- **解决并发渲染下的撕裂（tearing）**：在并发渲染中，一个组件可能在多次渲染中看到不同版本的外部状态，导致 UI 不一致。`useSyncExternalStore` 通过强制在渲染期间使用一致的状态快照来解决这个问题。
- **替代 `useSubscription`**：官方推荐的用于替代第三方库（如 `use-subscription`）和手动在 `useEffect` 中订阅外部源的模式。

### 1.2 什么是“撕裂（tearing）”？
撕裂是指在同一渲染周期内，UI 的不同部分基于不同时刻的状态渲染，导致显示不一致的现象。例如：
- 一个组件在渲染开始时读取了 store 的值 `x = 1`，但在渲染过程中 store 更新为 `x = 2`，后续组件可能读取到 `x = 2`。
- 最终结果：页面一部分显示基于旧状态，另一部分显示基于新状态，UI 出现“撕裂”。

React 并发渲染允许渲染可中断，如果没有 `useSyncExternalStore`，撕裂问题会更易出现。这个 Hook 确保在单次渲染中，所有组件都看到**相同版本**的 store 快照。

## 2. API 语法与基本使用

### 2.1 基本语法

```jsx
import { useSyncExternalStore } from 'react';

function MyComponent() {
  const state = useSyncExternalStore(
    subscribe,   // 订阅函数
    getSnapshot, // 获取当前快照的函数
    getServerSnapshot? // 可选的服务器端快照（用于 SSR）
  );
}
```

### 2.2 API 速览

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| **`subscribe`** | `(callback) => () => void` | 接收一个 `callback` 函数，当外部存储发生变化时调用该 `callback`。返回一个清除订阅的函数。 |
| **`getSnapshot`** | `() => State` | 返回外部存储当前状态的快照。该函数会被 React 缓存，并在每次存储变化时调用以比较状态是否真的变化。 |
| **`getServerSnapshot`** | `() => State` | （可选）用于 SSR 时获取初始快照的函数，确保服务端和客户端初始渲染一致。在客户端初次渲染时也会被调用（如果提供）。 |

| 返回值 | 类型 | 说明 |
| :--- | :--- | :--- |
| **`state`** | `State` | 当前外部存储的快照值，可用于组件的渲染。 |

### 2.3 基础使用示例：订阅浏览器网络状态

```jsx
import { useSyncExternalStore } from 'react';

// 订阅浏览器在线状态
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    // 订阅函数
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    // 获取当前快照
    () => navigator.onLine,
    // 服务器端快照（可选），可假设初始为 true
    () => true
  );
  return isOnline;
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? '✅ 在线' : '❌ 离线'}</div>;
}
```

### 2.4 订阅自定义 Store

假设有一个简单的状态管理库：

```jsx
// 外部 store
const myStore = {
  state: { count: 0 },
  listeners: new Set(),
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  getState() {
    return this.state;
  },
  setState(newState) {
    this.state = newState;
    this.listeners.forEach(l => l());
  }
};

// 在组件中使用
function Counter() {
  const state = useSyncExternalStore(
    myStore.subscribe.bind(myStore),
    myStore.getState.bind(myStore)
  );

  return <div>计数：{state.count}</div>;
}
```

## 3. 深入理解：为什么需要 useSyncExternalStore？

### 3.1 传统订阅方式的缺陷

在 `useSyncExternalStore` 出现之前，开发者通常这样订阅外部数据：

```jsx
// ❌ 有缺陷的方式
function Component() {
  const [state, setState] = useState(myStore.getState());
  
  useEffect(() => {
    return myStore.subscribe(() => {
      setState(myStore.getState());
    });
  }, []);
  
  return <div>{state.count}</div>;
}
```

**问题：**
1. **撕裂风险**：在并发渲染中，组件可能在渲染期间看到多个不同的 store 版本。
2. **内存泄漏**：如果订阅函数未正确清理，可能造成内存泄漏。
3. **无法处理服务端渲染**：没有服务端快照的支持。
4. **不必要的重新渲染**：即使 store 变化后状态未变（如引用相等），也可能触发重渲染。

### 3.2 useSyncExternalStore 的解决方案

- **保证一致性**：React 在渲染期间会调用 `getSnapshot` 两次，确保返回相同的值（通过 `Object.is` 比较），如果不相同则触发错误或重新渲染。
- **自动管理订阅**：当组件卸载或依赖变化时，React 会自动调用取消订阅函数。
- **SSR 支持**：通过第三个参数提供服务器端快照，避免水合不匹配。
- **内置优化**：仅当快照值真正变化时才触发组件重新渲染。

## 4. 实战案例：更复杂的场景

### 4.1 订阅多个 store

```jsx
function useMultipleStores(storeA, storeB) {
  const a = useSyncExternalStore(storeA.subscribe, storeA.getState);
  const b = useSyncExternalStore(storeB.subscribe, storeB.getState);
  return { a, b };
}
```

### 4.2 带选择器的 store 订阅

为避免不必要的重渲染，可以传入选择器函数：

```jsx
function useStoreSelector(store, selector) {
  const state = useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  return state;
}

// 使用
const count = useStoreSelector(myStore, state => state.count);
```

但要注意：选择器应在 `getSnapshot` 中应用，以便 React 可以比较选择后的值。如果选择器返回新对象，会导致每次重渲染。推荐使用 `useCallback` 或 memoized 选择器。

### 4.3 结合 useDebugValue 增强开发体验

```jsx
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(/* ... */);
  useDebugValue(isOnline ? 'Online' : 'Offline');
  return isOnline;
}
```

## 5. 深度对比：useSyncExternalStore vs 其他方案

| 方案 | 优点 | 缺点 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **`useSyncExternalStore`** | 并发安全、SSR 支持、内置优化 | 需要手动实现订阅逻辑 | 连接任何外部存储（包括浏览器 API） |
| **`useState` + `useEffect`** | 简单直观 | 并发不安全、SSR 问题 | 仅内部状态或一次性读取 |
| **第三方库（如 Redux）** | 封装完善、自带选择器优化 | 增加了依赖和复杂度 | 大型应用状态管理 |
| **`useSubscription`（社区库）** | 专为订阅设计 | 不再官方维护，未完全处理并发 | 旧项目迁移 |

## 6. 常见问题 (FAQ)

### 6.1 我应该在什么时候使用 useSyncExternalStore？

**答**：当你需要从 **React 外部的数据源**读取状态并实时更新时，就应该考虑 `useSyncExternalStore`。典型场景包括：
- 连接第三方状态管理库（如 Redux、Zustand、MobX）。
- 订阅浏览器全局对象（`window.innerWidth`、`navigator.onLine`、`document.hidden` 等）。
- 连接 WebSocket、事件总线或任何非 React 的数据流。

如果你只需要组件内部状态，请继续使用 `useState` 或 `useReducer`。

### 6.2 useSyncExternalStore 和 useSubscription 有什么区别？

**答**：`useSubscription` 是一个第三方库，主要用于 React 16/17 中订阅外部源。`useSyncExternalStore` 是 React 18 内置的官方解决方案，它专门针对并发渲染做了优化，避免了撕裂问题，并且支持 SSR。**新应用应优先使用 `useSyncExternalStore`**。

### 6.3 在 useSyncExternalStore 中如何处理服务器端渲染（SSR）？

**答**：需要提供第三个参数 `getServerSnapshot`。这个函数在服务器端和客户端初次渲染时调用，用于获取初始快照。它必须返回与客户端初始状态一致的序列化值，以避免水合不匹配。

```jsx
function useWindowWidth() {
  const width = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,
    // 服务器端快照：因为服务器上没有 window，可以返回一个默认值（如 1024）
    () => 1024
  );
  return width;
}
```

### 6.4 getSnapshot 应该返回一个值还是引用？如何避免不必要的重渲染？

**答**：`getSnapshot` 应返回一个**不可变**的快照（通常是一个值或一个稳定的对象引用）。React 使用 `Object.is` 比较前后两次快照来决定是否重渲染。因此，如果 store 更新但快照值未变，组件不会重渲染。

如果你的 store 状态是可变对象，应该在 `getSnapshot` 中返回一个新拷贝（例如通过 selector 选择值），以确保只有数据变化时才触发更新。

### 6.5 为什么我的组件在 store 更新后没有重新渲染？

**答**：可能原因：
- `subscribe` 函数没有正确调用 `callback`。检查是否在 store 变化时调用了传入的 `callback`。
- `getSnapshot` 返回的值与之前相同（`Object.is` 为 `true`），React 认为状态未变。
- 忘记在 `subscribe` 返回的函数中取消订阅，导致组件重新渲染时订阅未正确重置。

### 6.6 如何测试使用了 useSyncExternalStore 的组件？

**答**：可以采用模拟（mock）外部 store 的方式：

```jsx
// 测试示例
let mockState = { count: 0 };
const mockStore = {
  subscribe: jest.fn(cb => {
    // 存储回调以便手动触发
    mockStore.callback = cb;
    return () => {};
  }),
  getState: jest.fn(() => mockState),
};

function TestComponent() {
  const state = useSyncExternalStore(mockStore.subscribe, mockStore.getState);
  return <div>{state.count}</div>;
}

// 在测试中更新 mockState 并触发回调
mockState = { count: 1 };
mockStore.callback(); // 触发重新渲染
```

### 6.7 我可以用 useSyncExternalStore 订阅 Redux store 吗？

**答**：可以，但通常你不需要直接这样做。Redux 已经通过 `react-redux` 库封装了 `useSyncExternalStore` 在其 `useSelector` 内部。如果你在使用 Redux，请继续使用 `useSelector`；如果你在编写自定义 store，或者需要直接集成 Redux 但不使用 `react-redux`，可以手动调用。

### 6.8 如何处理 getSnapshot 中抛出错误的情况？

**答**：`getSnapshot` 应该是一个纯函数，不应抛出异常。如果外部 store 尚未初始化，可以在 `getSnapshot` 中返回一个初始状态（例如 `null` 或默认值），并在组件中处理该状态。如果必须抛错，可以使用错误边界来捕获。

### 6.9 可以在一个组件中使用多个 useSyncExternalStore 吗？

**答**：当然可以，就像使用多个 `useState` 一样。React 会为每个调用独立管理订阅和更新。

### 6.10 useSyncExternalStore 和 useTransition 一起用会冲突吗？

**答**：不会冲突。`useSyncExternalStore` 专为并发特性设计，与 `useTransition` 等配合良好。当过渡更新发生时，组件会基于一致的 store 快照渲染，而不会撕裂。如果 store 在过渡期间更新，React 会采用新的快照，但过渡仍然可以保持之前的 UI 状态（如果使用 `useDeferredValue` 等）。


