---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useReducer`](https://zh-hans.react.dev/reference/react/useReducer) :驾驭复杂状态逻辑**

## 1. 核心概念与痛点背景


> **痛点场景：为什么有了 `useState` 还要 `useReducer`？**
> 假设你在做一个复杂的表单购物车页面。你的状态里有：`items` (商品列表), `total` (总价), `discount` (折扣), `isLoading` (加载状态), `error` (报错信息)。
> 当用户点击“结账”按钮时，你需要同时：
> `setItems([])`
> `setTotal(0)`
> `setLoading(true)`
> `setError(null)`
> 如果页面里有 10 个这样的交互按钮，你的组件里就会散落着无数坨这种**牵一发而动全身、互相耦合的 `setState` 代码块**。这不仅极其难看，而且极容易漏改某个状态导致 Bug。

**`useReducer` 的破局之道：状态的集中管理与逻辑剥离。**
它强迫你把“怎么改数据”的具体计算逻辑，**从组件的点击事件里抽离出来，集中放到组件外部的一个“纯函数 (Reducer)”里**。组件里只负责“下达指令 (Dispatch Action)”。

| 核心术语 | 职责比喻 | 具体说明 |
| :--- | :--- | :--- |
| **State** | **账本** | 存储所有状态的单一对象。 |
| **Action** | **指令单** | 一个普通的 JS 对象，必须包含 `type`（你要干嘛），通常包含 `payload`（干这件事需要的数据参数）。 |
| **Reducer** | **老会计** | 一个**绝对纯净**的函数。接收旧账本 (oldState) 和指令单 (action)，算出一本新账本 (newState) 交回去。 |
| **Dispatch** | **提交动作** | 组件把指令单丢给老会计的唯一方法。 |

## 2. 核心 API 实战：从零手写状态机

`useReducer` 接收一个 `reducer` 函数和一个初始状态 `initialArg`（可选传入第三个参数`init`作为惰性初始化函数），并返回一个包含两个元素的数组：
* **当前的状态 (`State`)**
* **触发状态更新的派发函数 (`Dispatch`)**

```js
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

### 2.1 编写纯洁无瑕的 Reducer 函数

Reducer 必须是一个**纯函数 (Pure Function)**。也就是说：相同的输入必须永远得到相同的输出。里面绝对不能有异步请求 (Ajax)、不能生成随机数、**更绝对不能直接修改旧状态 (Mutate)**！必须返回一个全新的对象引用。

```jsx
// 1. 通常把 Reducer 定义在组件的外面！这样它就不会在每次渲染时被重新创建。
const initialState = {
  count: 0,
  username: ''
};

// reducer 函数签名：(当前状态, 命令对象) => 新状态
function myReducer(state, action) {
  // 按照业内不成文的规定，永远使用 switch 语句来匹配 action.type
  switch (action.type) {
    case 'INCREMENT':
      // 🚨 铁律：不要写 state.count++，必须展开旧对象返回新对象！
      return { ...state, count: state.count + 1 };
      
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
      
    case 'UPDATE_NAME':
      // 利用 action 携带的 payload 来更新状态
      return { ...state, username: action.payload };
      
    case 'RESET':
      return initialState; // 一键重置极其方便
      
    default:
      // 如果收到不认识的命令，不要报错，原封不动地把老账本退回去
      return state; 
  }
}
```

### 2.2 在组件中挂载与下达指令

组件的代码变得极其干净，它不再关心“数据具体是怎么加减乘除的”，它只负责喊口号：“给我加一！”

```jsx
import { useReducer } from 'react';

export default function CounterApp() {
  // 2. 挂载引擎，拿到状态数据和遥控器
  const [state, dispatch] = useReducer(myReducer, initialState);

  return (
    <div className="card">
      <h2>你好, {state.username || '匿名用户'}</h2>
      <p>当前计数: {state.count}</p>

      <div className="btn-group">
        {/* 3. 提交不带参数的命令 */}
        <button onClick={() => dispatch({ type: 'INCREMENT' })}>加 1</button>
        <button onClick={() => dispatch({ type: 'DECREMENT' })}>减 1</button>
        
        {/* 4. 提交带有数据 (payload) 的命令 */}
        <button onClick={() => dispatch({ type: 'UPDATE_NAME', payload: '大魔法师' })}>
          改名
        </button>
        
        <button onClick={() => dispatch({ type: 'RESET' })}>归零重置</button>
      </div>
    </div>
  );
}
```

## 3. 高阶进阶：惰性初始化与 Context 联姻

### 3.1 惰性初始化 (Lazy Initialization)
`useReducer` 其实可以接收**第三个参数**：一个初始化函数 `init`。
如果你需要从 `localStorage` 中极其耗时地读取缓存数据来作为初始值，传入第三个参数可以保证这笔巨额开销**只在组件挂载时发生一次**。

```jsx
function init(initialCount) {
  // 比如这里可以执行从本地读取数据的繁重操作
  return { count: initialCount, logs: [] };
}

function reducer(state, action) { /*...*/ }

function Counter({ initialCount = 0 }) {
  // 第三个参数 init 函数会被自动执行，并把第二个参数 initialCount 作为入参喂给它
  const [state, dispatch] = useReducer(reducer, initialCount, init);
  // ...
}
```

### 3.2 终极架构：`useReducer` + `useContext`

我们将 `state`（只读）和 `dispatch`（写操作）物理拆分为两个独立的 Context 广播出去，实现绝对的性能读写分离。

```jsx
// src/context/ThemeContext.jsx
import { createContext, useReducer, useContext } from 'react';

// 1. 拆分双 Context，阻断连带重渲染
const ThemeStateContext = createContext(null);
const ThemeDispatchContext = createContext(null);

const themeReducer = (state, action) => {
  switch(action.type) {
    case 'TOGGLE': return state === 'dark' ? 'light' : 'dark';
    default: return state;
  }
};

// 2. 封装专属的 Provider 壳子
export function ThemeProvider({ children }) {
  const [theme, dispatch] = useReducer(themeReducer, 'light');

  return (
    <ThemeStateContext.Provider value={theme}>
      {/* 由于 dispatch 是 useReducer 提供的，React 官方保证它的内存地址永远不变！ */}
      {/* 这是一个极其伟大的特性，这意味着底下所有只用 Dispatch 的按钮，永远不会被连累重渲染！ */}
      <ThemeDispatchContext.Provider value={dispatch}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeStateContext.Provider>
  );
}

// 3. 封装配套的 Custom Hooks，对外隐藏底层实现
export const useThemeState = () => useContext(ThemeStateContext);
export const useThemeDispatch = () => useContext(ThemeDispatchContext);
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 到底什么时候用 `useState`，什么时候上 `useReducer`？
*   **答**：这是关于架构“杀鸡焉用牛刀”的哲学。
    *   **用 `useState`**：绝大多数场景（90%以上）。只要状态是相互独立的基本类型，或者只是简单的表单双向绑定，不要折腾自己去写一堆繁琐的 switch case 样板代码。
    *   **必须用 `useReducer` 的三大信号**：
        1.  **下一个 state 严重依赖前一个 state 的复杂计算**（不仅依赖自己，还依赖别的状态的逻辑纠缠）。
        2.  **一个交互动作会同时触发多个关联状态的改变**（比如“拉取成功”要同时改 loading 为 false，存入 data，清空 error 三个状态）。
        3.  你需要将复杂的业务更新逻辑提取到组件之外，方便进行高覆盖率的**单元测试 (Unit Test)**（因为 Reducer 是纯函数，丢个对象进去立马能测出结果，不需要渲染 DOM）。

### 4.2 为什么在 Reducer 里面不能执行异步请求 (Ajax)？如果非要发请求怎么办？
*   **答**：**纯函数的尊严不容侵犯。**
    *   **原因**：Reducer 的使命是根据历史和命令计算未来。它必须是极其稳定的状态机。如果你在里面 `fetch`，网络抖动会导致状态计算无法瞬间同步完成，极易引发不可预知的时序 Bug。这也是为什么 Redux 必须搞一个恶心的 Thunk 中间件的原因。
    *   **原生 React 的正规解法**：在组件内部署异步防线。在发指令 (`dispatch`) 之前，先执行异步操作。
    ```jsx
    // 组件内
    const handleLogin = async () => {
      dispatch({ type: 'LOGIN_START' }); // 1. 先让页面转圈
      try {
        const user = await api.login(username, pwd); // 2. 组件去干脏活发请求
        dispatch({ type: 'LOGIN_SUCCESS', payload: user }); // 3. 数据回来了再报告给老会计入账
      } catch (err) {
        dispatch({ type: 'LOGIN_FAILED', payload: err.message });
      }
    };
    ```

### 4.3 我把 `state.list.push()` 写在了 Reducer 里，为什么页面死活不更新？
*   **答**：这和 `useState` 的死穴一模一样：**你违背了不可变性 (Immutability)。**
    *   React 拿到 Reducer 吐出的新状态后，也是用 `Object.is` 浅比对的。如果老账本和新账本的物理指针没变，它就会当场拒收。
    *   **铁律**：在 Reducer 里修改对象或数组，必须 `return { ...state }` 或 `return [...state.list]`。或者果断在项目里引入 **`Immer.js`** 的 `useImmerReducer`，这样你就可以在 Reducer 里面极其狂野地直接 `draft.list.push()` 了。
