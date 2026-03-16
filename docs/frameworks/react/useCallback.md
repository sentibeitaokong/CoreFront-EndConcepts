---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useCallback`](https://zh-hans.react.dev/reference/react/useCallback)：函数引用的终极锁**

## 1. 核心概念与痛点背景

在 React 函数组件中，每一次状态 (State) 改变导致重新渲染时，**组件函数内部声明的所有普通函数，都会被重新分配一个全新的内存地址（即被重新创建一次）。**

**`useCallback` 就是为了拯救这个痛点而生的。** 它的唯一作用是：**在多次渲染之间，缓存同一个函数的内存引用（指针）。**

## 2. 核心 API 实战

`useCallback` 接收两个参数：
* **要缓存的函数体**。
* **依赖数组 (Dependencies Array)**：和 `useEffect` 的逻辑一模一样。

```js
const cachedFn = useCallback(fn, dependencies)
```

### 2.1 基础实战：保护 `React.memo` 护城河

```jsx
import { useState, useCallback, memo } from 'react';

// 1. 子组件必须用 React.memo 包裹！这是使用 useCallback 的大前提！
const ExpensiveChild = memo(({ onClick }) => {
  console.log('--- 极其昂贵的子组件重新渲染了 ---');
  return <button onClick={onClick}>执行操作</button>;
});

export default function Parent() {
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);

  // 2. 🚨 核心魔法：使用 useCallback 锁死函数的内存地址
  const handleAction = useCallback(() => {
    console.log(`执行了操作，当前的 count 是: ${count}`);
  }, [count]); // 只有当 count 发生改变时，这个函数才会获得一个新的内存地址

  return (
    <div>
      {/* 这里的打字会导致 Parent 重渲染。
          但是，因为 text 没在 useCallback 的依赖数组里，
          所以 handleAction 的指针没变。
          ExpensiveChild 的 memo 完美拦截了渲染！*/}
      <input 
        value={text} 
        onChange={e => setText(e.target.value)} 
        placeholder="疯狂打字，子组件绝对不会卡顿"
      />
      
      <button onClick={() => setCount(c => c + 1)}>加数</button>

      <ExpensiveChild onClick={handleAction} />
    </div>
  );
}
```

### 2.2 作为 `useEffect` 的安全依赖

如果你的 `useEffect` 需要调用一个在组件内部定义的函数，Linter 插件会强制要求你把这个函数加入依赖数组。如果不用 `useCallback` 包裹，会引发光速死循环。

```jsx
import { useState, useEffect, useCallback } from 'react';

function UserProfile({ userId }) {
  const [data, setData] = useState(null);

  // 使用 useCallback 缓存 fetchData
  const fetchData = useCallback(async () => {
    const res = await api.get(`/user/${userId}`);
    setData(res);
  }, [userId]); // 只有 userId 变了，fetchData 的指针才会变

  useEffect(() => {
    fetchData();
  }, [fetchData]); // 安全地将函数作为依赖传入，不会引发无限重渲染

  return <div>{data?.name}</div>;
}
```

## 3. 高阶进阶：闭包陷阱与极致破局

### 3.1 致命的闭包陷阱 (Stale Closure)
当你为了性能，把 `useCallback` 的依赖数组写成空数组 `[]` 时，极易踩坑。

```jsx
const [count, setCount] = useState(0);

// ❌ 错误做法：依赖为空，函数指针永远不死
const handleClick = useCallback(() => {
  console.log(count); // 灾难：因为闭包被锁死在第一次渲染，这里打印的永远是 0！
  setCount(count + 1); // 怎么点都只能变成 1
}, []); 
```

### 3.2 破局方案 A：函数式更新 (Updater Function)
如果你的函数仅仅是为了更新 State，不需要读取旧 State 来做别的逻辑判断，**完美解法是使用 `setCount(prev => ...)`，同时保持依赖数组为空**。

```jsx
// ✅ 完美做法：依赖为空，指针不死，且能正确更新！
const handleClick = useCallback(() => {
  setCount(prevCount => prevCount + 1); // 把拿最新值的权利交给 React 底层去处理
}, []);
```

### 3.3 破局方案 B：`useRef` 逃生舱 (The Latest Ref Pattern)
如果你的函数里不仅要 `set`，还要读各种复杂的 State 发给后端，加一堆依赖又会导致 `useCallback` 频繁换地址（失去优化的意义）。此时可以祭出终极大招。

```jsx
const [text, setText] = useState('');
const [count, setCount] = useState(0);

// 1. 创建一个 useRef 保险箱
const stateRef = useRef({ text, count });
// 2. 每次渲染都更新保险箱里的内容
stateRef.current = { text, count };

// 3. 依赖为空，函数地址永远不变！
const handleSubmit = useCallback(() => {
  // 4. 从保险箱里拿数据，永远是最新鲜的！
  const { text: latestText, count: latestCount } = stateRef.current;
  api.post({ latestText, latestCount });
}, []); 
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么官方文档严厉警告：“不要把所有的函数都包上 `useCallback`”？
*   **答**：这是新手最容易犯的“负优化”错误。
    *   **性能账本**：`useCallback` 的执行本身是需要消耗内存和 CPU 的（它要在内存里开辟空间存你的函数，每次渲染还要去遍历比对那个依赖数组）。
    *   **亏本买卖**：如果你把函数传给了一个原生的 `<button onClick={handleClick}>` 标签，或者传给了一个**没有被 `React.memo` 包裹的普通自定义组件**。这些组件根本就不具备拦截渲染的能力！你包了 `useCallback`，不仅没有阻止重新渲染，反而还白白浪费了比对依赖数组的时间。
    *   **黄金铁律**：`useCallback` **仅且只在**以下两种情况使用：
        1. 作为一个 Prop 传递给一个由 `React.memo` 严密保护的昂贵子组件。
        2. 作为另一个 `useEffect` / `useMemo` / `useCallback` 的内部依赖项。

### 4.2 我把函数写在组件外部（全局作用域），能替代 `useCallback` 吗？
*   **答**：**能，而且是最高级的优化！**
    *   如果你的函数**完全不依赖**组件内部的任何 State 或 Props（比如一个纯粹的日期格式化函数 `formatDate`）。
    *   **坚决不要**把它写在组件里面用 `useCallback` 包裹。你应该直接把它丢到组件函数定义的外面。
    *   这样它在整个 JS 文件被加载时只创建一次，内存地址永生不死，连 `useCallback` 计算依赖的性能都省了。

### 4.3 `useMemo` 和 `useCallback` 到底有什么区别？
*   **答**：底层原理一模一样，纯粹是语法糖的区别。
    *   `useMemo` 缓存的是**回调函数执行后返回的结果**。
    *   `useCallback` 缓存的是**回调函数本身**。
    *   下面两行代码在底层是 100% 完全等价的：
    ```jsx
    const myFunc = useCallback(() => { console.log('a') }, []);
    
    // 如果用 useMemo 来缓存函数，你必须写极其别扭的"返回函数的函数"
    const myFunc = useMemo(() => () => { console.log('a') }, []);
    ```

### 4.4 依赖数组里可以不写全警告里要求的依赖吗？（`eslint-plugin-react-hooks` 报黄）
*   **答**：**强烈建议不要骗 Lint 插件。**
    *   如果你强行忽略警告，少写了依赖，一旦该依赖在外部变了，你的 `useCallback` 里的闭包还是旧的，这会导致极其诡异且难以排查的“数据不更新” Bug。
    *   如果你发现加了依赖导致 `useCallback` 频繁失效，你应该去**重构你的状态依赖逻辑**（比如使用前文提到的 `setState(prev => ...)` 或者 `useRef` 逃生舱模式），而不是去掩耳盗铃地删除依赖项。
