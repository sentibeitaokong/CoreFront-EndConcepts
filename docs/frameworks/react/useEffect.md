---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useEffect`](https://zh-hans.react.dev/reference/react/useEffect):驾驭组件的副作用**

## 1. 核心概念与“副作用”哲学

如果你把网络请求 (`fetch`)、直接操作原生 DOM (`document.title = 'xxx'`)、或者开启一个定时器 (`setInterval`) 这些代码直接写在组件函数体里，每一次组件重渲染（可能一秒钟几十次），这些代码都会被疯狂执行，导致整个应用瞬间崩溃。

**这些游离于 React 纯粹渲染计算之外的“脏活累活”，统统被称为“副作用 (Side Effects)”。**
**`useEffect` 就是 React 专门为你开辟的处理这些副作用的合法隔离区。**

> **底层执行时机 🚀**：
> `useEffect` 包裹的代码，**永远是在浏览器完成真实 DOM 的绘制（Paint）之后，被异步、延迟调用的。** 这保证了你的复杂的副作用逻辑绝对不会阻塞用户看到页面的第一眼。

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

## 3. 企业级实战与闭包清理 (Cleanup)

`useEffect` 的 `return` 函数被称为**清理函数 (Cleanup Function)**，它是防范内存泄漏的最后一道钢铁防线。

### 3.1 实战：防内存泄漏的定时器

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

### 3.2 实战：解决极其致命的竞态条件 (Race Condition)

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

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我的 `useEffect` 导致了疯狂的无限死循环？
*   **答**：这绝对是由于你**不仅违反了依赖数组规则，还触发了状态突变。**
    *   **死状一（忘写依赖）**：你在 Effect 里 `setCount(c=>c+1)`，但忘了写 `[]`。每次 set 导致组件重渲染，重渲染又无脑触发 Effect，接着又 set，光速死机。
    *   **死状二（自己卷自己）**：你把 `obj` 放入了依赖数组 `[obj]`，然后在 Effect 里面又去 `setObj({...obj, a: 1})`。因为每次 set 生成的都是**全新内存地址**的对象，Effect 一比对发现 `obj` 地址变了！大喊“依赖更新了！”，又去执行一遍，死循环爆发。
    *   **破局**：尽量不要把会发生改变的对象/数组作为依赖。如果非要作为依赖，**请把对象拆解成具体的字符串/数字属性塞进依赖数组（如 `[obj.id]`）**。

### 4.2 为什么组件每次挂载时，`useEffect` 里的网络请求会被发送两次？
*   **答**：在 React 18+ 的**仅本地开发环境**下，这是绝对正常的官方设定。
    *   **元凶**：你使用了 `<React.StrictMode>` (严格模式) 标签包裹了应用。
    *   **机制**：React 18 为了未来支持“组件状态可以被随时挂起和恢复”的新特性，强制在开发环境下模拟了一次 **Mount -> 立刻执行 return 卸载 -> 再次 Mount** 的演习。
    *   **目的**：它就是故意用来恶心你的，逼迫你去检查你的代码是不是忘了写 `return` 清理函数。如果你的接口发了两次导致出 Bug，这说明你的代码非常脆弱，不具备幂等性。
    *   **上线表现**：当你打包上线 (`npm run build`) 到生产环境后，这个双重调用的机制会自动彻底剥离，恢复为只会发送一次。

### 4.3 我把一个函数（比如 `fetchData`）写在了组件里，并在 `useEffect` 里调用它。React Linter 插件疯狂报错要求我把函数加进依赖数组，我加进去后却引发了死循环？
*   **答**：这是使用 Hooks 时最让人抓狂的困境。
    *   **原因剖析**：每次组件重渲染，内部定义的普通函数 `const fetchData = () => {}` 都会被**重新分配一个新的内存地址**。如果你听了插件的话把它加进依赖数组 `[fetchData]`，那么每次渲染都会导致依赖数组发生改变，Effect 被无脑触发，死循环！
    *   **完美解法 A (推荐)**：如果这个函数**不需要读取任何组件内的 State/Props**，把它**直接提到组件函数的外面去定义**！这样它在整个 JS 模块里只有一份，永远不变，甚至不需要写进依赖数组。
    *   **完美解法 B**：把这个函数的声明**直接挪进 `useEffect` 的内部**！这样既不用加依赖，逻辑又极度内聚。
    *   **终极解法 C**：如果这个函数确实要在很多个 Effect 或者 onClick 里复用，你必须使用 **`useCallback`** 把它包裹起来，死死锁住它的内存地址，然后再把它塞进依赖数组里。

### 4.4 为什么官方现在越来越不推荐在 `useEffect` 里手动发请求了？
*   **答**：这是现代前端架构理念的觉醒。
    *   虽然上文教了你怎么在 `useEffect` 里发请求和防竞态，但在真实的巨型业务中，你还要处理 loading 状态骨架屏、接口抛错的 Error Boundary、相同接口的缓存去重（SWR）、服务端渲染（SSR）的水合等无数个深坑。
    *   如果纯靠手写 `useEffect`，你会写出极其庞大且恶心的“面条代码”。
    *   **官方钦定方向**：对于单纯的数据拉取，现代 React 极其推崇将这些脏活全部下放给专业的**数据请求框架（如 React Query, SWR）**，或者交由**全栈框架的数据层（如 React Router v6.4+ 的 Loader, Next.js 的 Server Components）**来处理。让你的组件彻底回归纯粹的 UI 渲染本质。
