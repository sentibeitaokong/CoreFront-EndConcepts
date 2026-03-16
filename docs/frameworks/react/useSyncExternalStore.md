---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useSyncExternalStore`](https://zh-hans.react.dev/reference/react/useSyncExternalStore): 彻底终结并发渲染“撕裂”的外部状态订阅**

在 React 18 引入并发渲染（Concurrent Rendering）之后，React 获得了暂停、恢复和放弃渲染的能力。然而，这也带来了一个致命的副作用：如果组件依赖于 React 外部的状态（如 Redux、Zustand Store、甚至浏览器的 `window` 对象），在 React 暂停渲染的间隙，外部状态发生了改变，就会导致同一个页面上渲染出新旧不一致的 UI，这种现象被称为**“UI 撕裂（Tearing）”**。

`useSyncExternalStore` 正是 React 官方为了拯救各大状态管理库、安全订阅外部数据源而量身定制的终极解决方案。

## 1. 核心概念与基础语法

```js
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

* `subscribe`：一个函数，接收一个单独的 callback 参数并把它订阅到 store 上。当 store 发生改变时应该调用提供的 callback，这将使 React 重新调用 getSnapshot 并在需要的时候重新渲染组件。subscribe 函数会返回清除订阅的函数。
* `getSnapshot`：一个函数，返回组件需要的 store 中的数据快照。在 store 不变的情况下，重复调用 getSnapshot 必须返回同一个值。如果 store 改变，并且返回值也不同了（用 Object.is 比较），React 就会重新渲染组件。
* `getServerSnapshot`(**可选**)：一个函数，返回 store 中数据的初始快照。它只会在服务端渲染时，以及在客户端进行服务端渲染内容的激活时被用到。快照在服务端与客户端之间必须相同，它通常是从服务端序列化并传到客户端的。如果你忽略此参数，在服务端渲染这个组件会抛出一个错误。

### 1.1 基本定义与应用场景

`useSyncExternalStore` 是一个让你完美订阅外部 store 的 Hook。它接受三个参数，并返回该 store 的当前快照（Snapshot）。

**核心应用场景**：订阅第三方状态管理库（Zustand、Redux）、订阅浏览器全局 API（如网络状态、窗口尺寸、媒体查询等）、跨组件的非 React 状态共享。

```jsx
import { useSyncExternalStore } from 'react';

// 1. 订阅函数：当外部状态变化时，调用 callback 通知 React 重新渲染
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// 2. 获取快照函数：返回当前的状态值
function getSnapshot() {
  return navigator.onLine;
}

function NetworkStatus() {
  // 3. 将外部的浏览器网络状态，安全地同步到 React 组件中
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  return <div>当前网络状态: {isOnline ? '🟢 在线' : '🔴 离线'}</div>;
}
```

## 2. 核心进阶：解决并发渲染下的“UI 撕裂（Tearing）”难题

在 `useSyncExternalStore` 出现之前，开发者通常使用 `useEffect` 配合 `useState` 来订阅外部状态。在传统的同步渲染中这没有问题，但在并发模式下，这会引发灾难。

### 2.1 痛点场景：Concurrent React 的副作用

**痛点场景**：假设有一个外部的全局变量 `let count = 0`。React 正在并发渲染一个包含 100 个列表项的长列表。渲染到第 50 项时，React 暂停了渲染去处理用户高优先级的点击事件；此时点击事件修改了 `count = 1`。当 React 恢复渲染剩下的 50 项时，下半部分的组件读取到了 `1`，而上半部分渲染的还是 `0`。这就造成了同一时刻 UI 的精神分裂（撕裂）。

**解决原则**：**将读取外部状态的动作变为“强制同步”。**
`useSyncExternalStore` 底层做了一件非常霸道的事情：如果在并发渲染期间，它检测到 `getSnapshot` 返回的值发生了变化，它会立刻**放弃当前的并发渲染，强制以同步（Synchronous）的方式从头重新渲染整个树**。这虽然损失了一点并发的性能，但绝对保证了 UI 的一致性和正确性。

```jsx
// ❌ 错误/过时的示范 (极易导致 UI 撕裂)：
function BadStoreReader() {
  const [state, setState] = useState(store.getState());
  useEffect(() => {
    return store.subscribe(() => setState(store.getState()));
  }, []);
  return <div>{state}</div>;
}

// ✅ 正确示范 (防止撕裂)：
function GoodStoreReader() {
  // 交由 React 内部机制接管，保证渲染期间状态绝对一致
  const state = useSyncExternalStore(store.subscribe, store.getState);
  return <div>{state}</div>;
}
```

## 3. 高阶进阶：自定义状态管理库的核心基石

### 3.1 突破死穴：如何正确编写 `getSnapshot` 函数？

**痛点场景**：很多开发者在使用 `useSyncExternalStore` 订阅复杂对象时，发现应用陷入了无限重渲染（Infinite Loop），甚至控制台报错 `Maximum update depth exceeded`。这是因为他们没有理解 React 对“快照（Snapshot）”的不可变性（Immutability）要求。

**解决原则**：**`getSnapshot` 必须返回一个缓存的值。如果底层数据没有发生突变，`getSnapshot` 多次调用必须返回严格相等（`Object.is`）的同一个引用。绝对不能在 `getSnapshot` 中动态生成新对象或新数组！**

```jsx
// 假设这是一个我们手写的全局 Store
let globalData = { todos: ['学习 React'] };
let listeners = new Set();

const store = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  
  // ❌ 致命错误：每次都返回一个新数组！React 会认为状态一直在变，导致无限渲染。
  getBadSnapshot() {
    return [...globalData.todos]; 
  },

  // ✅ 正确做法：直接返回原有引用。只有在执行更新操作时，才去改变引用。
  getGoodSnapshot() {
    return globalData.todos; 
  },

  addTodo(text) {
    // 更新时，创建新的引用（Immutable 更新）
    globalData = { todos: [...globalData.todos, text] };
    listeners.forEach(l => l()); // 通知所有组件
  }
};
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我可以把它完全当作 `useState` 的替代品来做全局状态管理吗？
*   **答**：**不建议本末倒置。**
    *   `useSyncExternalStore` 是为了连接“已经存在于 React 外部的状态”（比如浏览器 API、现有的 Redux 逻辑）而设计的。
    *   如果你的状态本身就是为 React UI 服务的，首选方案永远是 React 原生的 `useState`、`useReducer` 和 `Context`，因为它们能够完美享受并发渲染带来的性能红利，而 `useSyncExternalStore` 在状态变化时会强制同步渲染（De-opt to synchronous），可能会引发卡顿。

### 4.2 在 Next.js / Remix 等 SSR (服务器端渲染) 框架中报错 "Hydration Mismatch" 怎么解决？
*   **答**：**你需要提供第三个参数 `getServerSnapshot`。**
    *   在 SSR 环境中，服务器上没有 `window` 对象，也无法订阅浏览器的网络状态。如果服务器渲染出的 HTML 和客户端初次接管（Hydration）时的状态不一致，就会报错。
    *   **避坑方案**：传入第三个参数，为服务器和客户端初次渲染提供一个**绝对一致的静态初始值**。
    ```jsx
    // 在服务器端和客户端水合阶段，统一假定为 true
    function getServerSnapshot() {
      return true; 
    }
    const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    ```

### 4.3 为什么我必须把 `subscribe` 函数定义在组件外部或使用 `useCallback` 包裹？
*   **答**：**为了防止重新订阅引发的性能问题。**
    *   如果每次组件渲染时你都传入一个全新的 `subscribe` 函数引用，React 会在每次渲染后先执行清理函数（unsubscribe），然后再重新订阅（subscribe）。这不仅消耗性能，还可能丢失期间发生的状态变更。
    *   **避坑方案**：始终将 `subscribe` 和 `getSnapshot` 函数提取到组件外部（模块级别作用域）；如果必须依赖组件内部的 props，请务必使用 `useCallback` 将其缓存起来。
