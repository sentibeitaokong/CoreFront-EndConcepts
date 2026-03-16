---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useEffect`](https://zh-hans.react.dev/reference/react/useEffect):驾驭组件的副作用**


## 1. 核心定位：useEffect 到底是什么？

**Effect 不是生命周期，而是“同步机制”。**

如果你把网络请求 (`fetch`)、直接操作原生 DOM (`document.title = 'xxx'`)、或者开启一个定时器 (`setInterval`) 这些代码直接写在组件函数体里，每一次组件重渲染（可能一秒钟几十次），这些代码都会被疯狂执行，导致整个应用瞬间崩溃。

**这些游离于 React 纯粹渲染计算之外的“脏活累活”，统统被称为“副作用 (Side Effects)”。**
**`useEffect` 就是 React 专门为你开辟的处理这些副作用的合法隔离区。**

> **底层执行时机 🚀**：
> `useEffect` 包裹的代码，**永远是在浏览器完成真实 DOM 的绘制（Paint）之后，被异步、延迟调用的。** 这保证了你的复杂的副作用逻辑绝对不会阻塞用户看到页面的第一眼。

### 1.1 标准语法与执行时机
```javascript
useEffect(() => {
  // Setup (挂载/更新逻辑)：连接到外部系统
  const connection = createConnection();
  connection.connect();

  return () => {
    // Cleanup (清理逻辑)：断开连接（组件卸载或下次 Effect 运行前执行）
    connection.disconnect();
  };
}, [/* Dependencies (依赖数组) */]);
```
*   **执行时机**：绝大多数情况下，`useEffect` 会在浏览器完成布局与绘制**之后**延迟执行（异步），以避免阻塞视觉更新。（如果需要阻塞绘制的高级场景，应使用 `useLayoutEffect`）。

## 2. 核心语法与依赖数组的三种形态

`useEffect` 接收两个参数：
* **Setup 函数 (包含执行逻辑与清理逻辑)**
* **依赖数组 (Dependencies Array, 可选)**

依赖数组是 `useEffect` 真正的灵魂，它决定了这个 Effect 到底在什么时候该执行。

### 2.1 不传依赖数组 (无脑执行，极度危险)

**行为**：每次组件重渲染（无论因为什么状态改变），它都会无条件执行一次。

**场景**：极少使用，仅用于封装全局的、必须时刻与所有状态保持同步的特殊底层 Hook。

```jsx
useEffect(() => {
  console.log('只要有任何风吹草动引发了重新渲染，我就会跑出来！');
});
```

### 2.2 空数组 `[]` (只活一次的挂载期)

**行为**：告诉 React“我的副作用不依赖你组件里的任何数据”。因此，它**只在组件初次挂载到屏幕上时执行唯一的一次。**

**场景**：初始化各种只需要跑一次的东西（如：绑定全局 `window` 事件、发起不需要参数的首屏核心 Ajax 请求、初始化图表库）。

```jsx
useEffect(() => {
  console.log('组件第一次出现在屏幕上了！我只执行这一次。');
  
  // 必须返回一个清理函数 (Cleanup)
  return () => {
    console.log('组件即将被销毁了，我来打扫战场。');
  };
}, []); 
```

### 2.3 有具体的依赖项 `[a, b]` (精确制导)

**行为**：只有当数组里的 `a` 或 `b`，在本次渲染时的值与上一次渲染时的值**发生了物理变化（`Object.is` 浅比对）**时，这个 Effect 才会被触发。

**场景**：响应特定数据的变化（如：用户在左侧列表切换了文章 ID，右侧详情区监听到 ID 变化去发起新的内容请求）。

```jsx
const [userId, setUserId] = useState(1);

useEffect(() => {
  // 当且仅当 userId 真的发生变化时，才会执行！
  console.log(`去获取 ID 为 ${userId} 的用户详情...`);

  return () => {
    // 💡 神奇的时序：
    // 当 userId 从 1 变成 2 时，React 会先执行旧 userId=1 闭包里的这个清理函数！
    // 然后再去执行上面那个新 userId=2 的拉取逻辑。
    console.log(`在拉取新数据前，或者组件销毁时，先清理旧的 ID: ${userId} 相关的残留物`);
  };
}, [userId]); 
```

## 3. 核心思想：你可能不需要 Effect (You Might Not Need an Effect)

这是 React 官方目前最为强调的工程化原则。**如果你能用在渲染期间计算的值（衍生状态）或者在事件处理函数中解决问题，就绝对不要使用 `useEffect`。**

### 3.1 突破闭包：在 Effect 中根据先前 state 更新 state

**痛点场景**：当你需要在 Effect 中设置一个定时器（如 `setInterval`），每秒让 `count` 加 1 时。如果你直接读取组件作用域的 `count`，Linter 会要求你把 `count` 加入依赖数组。但这会导致**每次 `count` 改变时，定时器都被清理并重新创建**，这不仅性能极差，甚至可能导致定时器节律错乱。

**解决原则**：**如果你只需要用旧 state 来计算新 state，请使用状态的“函数式更新”！这能让你从依赖项中安全地移除该 state。**

```jsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // ❌ 错误示范：依赖了 count。
    // 每次 setCount 后，组件重渲染，Effect 重新执行 -> 销毁旧定时器 -> 创建新定时器。
    // const id = setInterval(() => { setCount(count + 1); }, 1000);
    // return () => clearInterval(id);
    
    // ✅ 正确示范 (传递状态更新函数)：
    // 你向 setCount 传递了 c => c + 1。
    // 你的 Effect 不再需要读取外层的 count，因此 count 被移出依赖项。定时器永远只创建一次！
    const id = setInterval(() => {
      setCount(c => c + 1); 
    }, 1000);
    return () => clearInterval(id);
  }, []); // 🟢 完美的空依赖数组

  return <h1>{count}</h1>;
}
```

### 3.2 引用陷阱：删除不必要的对象依赖项

**痛点场景**：在 React 中，组件每次重渲染时，内部的所有对象字面量（`{}`）都会分配一个**全新的内存地址**。如果你的 Effect 依赖了这个对象，尽管对象的内容一模一样，React 也会认为“依赖项变了”，从而强行重新运行 Effect。

**解决原则**：**避免将每次渲染都会新建的对象作为依赖项。你可以将其移到 Effect 内部，或者只提取对象中的基础类型值（字符串、数字、布尔值）作为依赖。**

```jsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  // ❌ 错误示范：options 每次渲染都是一个全新对象！
  // 哪怕只是输入框打字改变了 message，options 也会重生，导致 WebSocket 疯狂重连！
  // const options = { serverUrl: 'https://localhost:1234', roomId };

  useEffect(() => {
    // ✅ 黄金法则 1 (移入 Effect 内部)：
    // 如果这个对象只在 Effect 里用，直接把它写在 Effect 里面。
    // 此时依赖项只需要 roomId 即可。
    const options = { serverUrl: 'https://localhost:1234', roomId };
    const connection = createConnection(options);
    connection.connect();
    
    return () => connection.disconnect();
  }, [roomId]); // 🟢 options 不再是依赖项
}
```

### 3.3 函数重现：删除不必要的函数依赖项

**痛点场景**：与对象同理，在组件内部定义的函数，每次重渲染时都会是一个**全新的函数实例**。如果你在 Effect 中调用了它，Linter 会逼你把它加入依赖数组，这同样会导致 Effect 毫无意义地频繁重跑。

**解决原则**：**如果一个函数不依赖组件内的任何状态，请把它移到组件外部！如果它依赖了，请把它直接写在 Effect 内部！**

```jsx
// ✅ 黄金法则 1 (移到组件外)：
// 这个函数不依赖 props 或 state，移到顶层，它永远只会创建一次。
function createOptions() {
  return { serverUrl: 'https://localhost:1234' };
}

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  // ❌ 错误示范：在组件内定义的函数，每次渲染都会重新创建。
  // function createOptions() { return { serverUrl: 'https://localhost:1234', roomId }; }

  useEffect(() => {
    // ✅ 黄金法则 2 (移入 Effect 内部)：
    // 如果函数必须依赖 roomId，那就把它定义在 Effect 内部。
    // 这样不仅不用把函数加进依赖，还能清楚看到 Effect 到底依赖了什么具体数据。
    function createOptions() {
      return { serverUrl: 'https://localhost:1234', roomId };
    }

    const connection = createConnection(createOptions());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // 🟢 只需要依赖实际的数据 roomId
}
```

### 3.4 响应隔离：从 Effect 读取最新的 props 和 state

**痛点场景**：有时候你想在 Effect 中读取一个最新的 state（比如当前的 `theme` 颜色，用于打印日志），但你**绝对不想**因为这个 state 的改变而导致 Effect 重新运行（比如你不想因为切了个暗黑模式，就导致聊天室断开重连）。

**解决原则**：在传统的 React 中，我们经常会遇到“想读最新值，又不想被它触发”的尴尬境地。React 官方正在引入（目前为实验性 API）**`useEffectEvent`** 来将非响应式逻辑从响应式的 Effect 中抽离出来。

```jsx
import { useEffect, useState } from 'react';
// 注意：useEffectEvent 目前是实验性 API，需在支持的环境中使用
import { experimental_useEffectEvent as useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  // ✅ 使用 useEffectEvent 封装备忘逻辑
  // 这个 Hook 返回的函数永远能读到最新的 theme，但它本身的引用永远不变
  const onConnected = useEffectEvent(() => {
    showNotification('已连接！当前主题是：' + theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      // ❌ 如果你直接在这里读 theme，就必须把 theme 加进底部的依赖数组。
      // 这会导致切换主题时，聊天室断开重连。
      
      // ✅ 正确示范：调用 Event 函数。
      // onConnected 函数并非响应式依赖，不需要加入依赖数组。
      onConnected();
    });
    connection.connect();
    
    return () => connection.disconnect();
  }, [roomId]); // 🟢 完美：只有 roomId 改变才会重连，theme 改变不会触发。
}
```

## 4. 清理函数 (Cleanup) 的绝对重要性

`useEffect` 的返回值是一个函数，它负责“擦屁股”。如果忘记清理，会导致极其严重的**内存泄漏**或**竞态条件 (Race Conditions)**。

### 4.1 避免内存泄漏

如果你在组件挂载时开启了定时器，当用户跳到别的页面（组件卸载）时，定时器如果你不杀掉，它会像僵尸一样永远在后台疯狂空转，直到把浏览器卡死。

```jsx
import { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // 挂载时开启
    const intervalId = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    // 🚨 铁律：凡是开启持续性监听/轮询，必须在 return 里关闭它！
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <div>页面停留: {seconds} 秒</div>;
}
```

### 4.2 解决网络请求的“竞态条件”

**案发现场**：你在一个复杂的后台系统，快速点击了用户列表的 "Alice" 和 "Bob"。
系统发出了两个请求：`fetch('Alice')` 和 `fetch('Bob')`。
由于网络抖动，按理说后发的 "Bob" 的数据先回来了，页面显示了 Bob。但是 2 秒后，"Alice" 那慢吞吞的数据才回来，强行把页面覆盖成了 Alice！**你明明点的是 Bob，最后页面上却显示了 Alice！这就是极其恐怖的竞态条件。**

**利用清理函数进行完美斩杀：**

```jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // 1. 设置一个标记，代表当前这次 Effect 依然"存活"
    let isActive = true; 

    async function fetchData() {
      const response = await api.getUser(userId);
      // 2. 只有当前 Effect 还存活时，才允许修改 state
      if (isActive) {
        setUserData(response.data);
      }
    }

    fetchData();

    // 3. 核心魔法：当 userId 改变，触发新的请求前
    // React 会执行上一次旧请求的清理函数，把旧请求的 isActive 瞬间设为 false！
    // 这样旧请求即使晚了 100 年才回来，它也永远无法迈过上面那道 if 的门槛！
    return () => {
      isActive = false; 
    };
  }, [userId]);

  return <div>...</div>;
}
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么我的 `useEffect` 导致了疯狂的无限死循环？
*   **答**：这绝对是由于你**不仅违反了依赖数组规则，还触发了状态突变。**
    *   **死状一（忘写依赖）**：你在 Effect 里 `setCount(c=>c+1)`，但忘了写 `[]`。每次 set 导致组件重渲染，重渲染又无脑触发 Effect，接着又 set，光速死机。
    *   **死状二（自己卷自己）**：你把 `obj` 放入了依赖数组 `[obj]`，然后在 Effect 里面又去 `setObj({...obj, a: 1})`。因为每次 set 生成的都是**全新内存地址**的对象，Effect 一比对发现 `obj` 地址变了！大喊“依赖更新了！”，又去执行一遍，死循环爆发。
    *   **破局**：尽量不要把会发生改变的对象/数组作为依赖。如果非要作为依赖，**请把对象拆解成具体的字符串/数字属性塞进依赖数组（如 `[obj.id]`）**。

### 5.2 为什么组件每次挂载时，`useEffect` 里的网络请求会被发送两次？
*   **答**：在 React 18+ 的**仅本地开发环境**下，这是绝对正常的官方设定。
    *   **元凶**：你使用了 `<React.StrictMode>` (严格模式) 标签包裹了应用。
    *   **机制**：React 18 为了未来支持“组件状态可以被随时挂起和恢复”的新特性，强制在开发环境下模拟了一次 **Mount -> 立刻执行 return 卸载 -> 再次 Mount** 的演习。
    *   **目的**：它就是故意用来恶心你的，逼迫你去检查你的代码是不是忘了写 `return` 清理函数。如果你的接口发了两次导致出 Bug，这说明你的代码非常脆弱，不具备幂等性。
    *   **上线表现**：当你打包上线 (`npm run build`) 到生产环境后，这个双重调用的机制会自动彻底剥离，恢复为只会发送一次。

### 5.3 我把一个函数（比如 `fetchData`）写在了组件里，并在 `useEffect` 里调用它。React Linter 插件疯狂报错要求我把函数加进依赖数组，我加进去后却引发了死循环？
*   **答**：这是使用 Hooks 时最让人抓狂的困境。
    *   **原因剖析**：每次组件重渲染，内部定义的普通函数 `const fetchData = () => {}` 都会被**重新分配一个新的内存地址**。如果你听了插件的话把它加进依赖数组 `[fetchData]`，那么每次渲染都会导致依赖数组发生改变，Effect 被无脑触发，死循环！
    *   **完美解法 A (推荐)**：如果这个函数**不需要读取任何组件内的 State/Props**，把它**直接提到组件函数的外面去定义**！这样它在整个 JS 模块里只有一份，永远不变，甚至不需要写进依赖数组。
    *   **完美解法 B**：把这个函数的声明**直接挪进 `useEffect` 的内部**！这样既不用加依赖，逻辑又极度内聚。
    *   **终极解法 C**：如果这个函数确实要在很多个 Effect 或者 onClick 里复用，你必须使用 **`useCallback`** 把它包裹起来，死死锁住它的内存地址，然后再把它塞进依赖数组里。

### 5.4 为什么官方现在越来越不推荐在 `useEffect` 里手动发请求了？
*   **答**：这是现代前端架构理念的觉醒。
    *   虽然上文教了你怎么在 `useEffect` 里发请求和防竞态，但在真实的巨型业务中，你还要处理 loading 状态骨架屏、接口抛错的 Error Boundary、相同接口的缓存去重（SWR）、服务端渲染（SSR）的水合等无数个深坑。
    *   如果纯靠手写 `useEffect`，你会写出极其庞大且恶心的“面条代码”。
    *   **官方钦定方向**：对于单纯的数据拉取，现代 React 极其推崇将这些脏活全部下放给专业的**数据请求框架（如 React Query, SWR）**，或者交由**全栈框架的数据层（如 React Router v6.4+ 的 Loader, Next.js 的 Server Components）**来处理。让你的组件彻底回归纯粹的 UI 渲染本质。

    
