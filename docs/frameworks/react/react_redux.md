---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Redux 与中间件

## 1. 核心概念与“单向数据流”哲学

**Redux** 是 React 社区最正统、最老牌、架构最严密的全局状态管理工具。它的核心设计哲学是：**严格限制状态的修改路径，使一切状态的变更都绝对可预测、可追溯（Time Travel Debugging）。**

| 核心构造块 | 架构角色与职责 |
| :--- | :--- |
| **Store (金库)** | 整个应用的唯一的、全局的数据中心。所有共享数据都存在这一个巨大的对象树里。 |
| **State (钞票)** | Store 里面的具体数据。**它是只读的 (Read-only)**，组件绝对不能直接修改它。 |
| **Action (申请单)** | 一个普通的 JS 对象，必须包含 `type` 字段（“我想干什么”），可选包含 `payload` 字段（“我要传的数据”）。 |
| **Dispatch (提交)** | 组件用来把 Action (申请单) 发送给 Store 的唯一方法。 |
| **Reducer (审批员)** | **一个绝对纯净的函数 (Pure Function)**。它接收当前的 State 和传来的 Action，根据 Action 计算并返回一个**全新的 State**。 |

## 2. Redux Toolkit (RTK) 核心 API
*这是现代业务开发中 95% 以上时间你会用到的 API，它极大地减少了模板代码（Boilerplate）。*

### 2.1 `configureStore(options)`
**取代了传统的 `createStore`，用于创建一个 Redux 全局仓库。它在底层自动为你配置好了 Redux DevTools 并且内置了 redux-thunk 中间件。**

```javascript
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import loggerMiddleware from './middlewares/logger';

const store = configureStore({
  // 1. 核心：可以是一个单一的 reducer 函数，也可以是一个对象（底层会自动调用 combineReducers）
  reducer: {
    users: usersReducer,
    posts: postsReducer
  },
  // 2. 中间件配置 (可选)：RTK 默认带有 thunk，如果想追加自定义中间件，必须保留默认的
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(loggerMiddleware),
  // 3. 是否开启浏览器 DevTools (默认 true)
  devTools: process.env.NODE_ENV !== 'production' 
});
```

### 2.2 `createSlice(options)`
**RTK 的灵魂 API。它接收一个初始状态和包含 reducer 函数的对象，并自动生成同名的 Action Creator 和 Action Types。彻底消灭了繁琐的 Switch/Case。**

```javascript
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter', // 作为 Action Type 的前缀，如 'counter/increment'
  initialState: { value: 0 },
  
  // 普通的同步 reducers
  reducers: {
    // 因为底层集成了 Immer，你可以直接“突变” state
    increment: (state) => { state.value += 1; },
    incrementByAmount: (state, action) => { state.value += action.payload; }
  },

  // 用于响应外部的、或者异步 thunk 触发的 Action
  extraReducers: (builder) => {
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      state.userName = action.payload.name;
    });
  }
});

// 自动生成 action creator 并导出
export const { increment, incrementByAmount } = counterSlice.actions;
// 导出 reducer 给 configureStore 使用
export default counterSlice.reducer;
```

### 2.3 `createAsyncThunk(typePrefix, payloadCreator)`
**官方标准处理异步请求的方案。它会根据 Promise 的生命周期，自动 dispatch 三个不同的 Action：`pending`（等待中）、`fulfilled`（成功）、`rejected`（失败）。**

```javascript
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUserById = createAsyncThunk(
  'users/fetchByIdStatus', // 这是 action type 的前缀
  async (userId, thunkAPI) => {
    // thunkAPI 提供了很多极高权限的方法，如 thunkAPI.getState(), thunkAPI.dispatch()
    const response = await fetch(`https://api.com/users/${userId}`);
    // return 的数据会自动作为 fulfilled action 的 payload
    return response.json(); 
  }
);
// 使用：dispatch(fetchUserById(123))
```

## 3. 现代 Redux (RTK) 核心实战

使用 Redux Toolkit，我们可以用极其精简的代码构建企业级的状态流转。

### 3.1 切片 (CreateSlice) - 统一 State, Reducers 和 Actions

RTK 创造了 `Slice` 的概念，它把你对某一个业务域（如 `user`）的状态、操作方法全部打包在一个文件里。

```javascript
// src/store/slices/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter', // 这个 Slice 的命名空间
  initialState: { value: 0 },
  
  // 核心：Reducers 对象！
  reducers: {
    // 这里你看到的虽然是"直接修改"代码，但 RTK 底层使用了 Immer.js！
    // 它会拦截你的突变操作，自动生成不可变的 (Immutable) 新状态，极其爽快！
    increment: (state) => {
      state.value += 1; 
    },
    // action.payload 就是组件传过来的参数
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    }
  }
});

// 极其伟大的一步：RTK 自动帮你生成了与 Reducer 同名的 Action Creator 函数！
export const { increment, incrementByAmount } = counterSlice.actions;

export default counterSlice.reducer;
```

### 3.2 组装 Store (ConfigureStore)

把分散在各个文件里的 Slice 拼装成一个全局的 Store 金库。

```javascript
// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';

export const store = configureStore({
  reducer: {
    // 这里的 key 就是你未来在组件里拿数据时用的命名空间
    counter: counterReducer,
    // user: userReducer,
  }
});
```

### 3.3 提供与消费 (Provider & Hooks)

通过 `react-redux` 库将 Store 注入 React 宇宙，并在组件中消费。

```jsx
// src/main.jsx (入口文件)
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

```jsx
// src/components/Counter.jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment, incrementByAmount } from '../store/slices/counterSlice';

export default function Counter() {
  // 1. 读取数据 (useSelector)：精确订阅，只有 state.counter.value 变了才重渲染
  const count = useSelector((state) => state.counter.value);
  
  // 2. 获取 Dispatch 遥控器
  const dispatch = useDispatch();

  return (
    <div>
      <p>当前数字: {count}</p>
      {/* 3. 提交申请单！ */}
      <button onClick={() => dispatch(increment())}>加 1</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>加 5</button>
    </div>
  );
}
```

## 4. RTK中间件架构 (Middleware) 与异步处理

**核心痛点**：Reducer 必须是一个**纯函数**。它里面绝对不能包含任何 `setTimeout`、`fetch/axios` 异步请求或者修改 DOM 等副作用。
那么，如果我点击按钮，需要先发一个 Ajax 请求拿到数据后，再去修改 State，这该怎么写？

**这就是 Redux 中间件 (Middleware) 的存在意义。** 它在 Action 被 `dispatch` 出去，到达 `Reducer` 之前的这段半空中，把 Action 拦截下来做手脚。

### 41 异步王者：Redux Thunk (RTK 默认内置)

`redux-thunk` 中间件的逻辑极其简单粗暴：它允许你 dispatch 的不再是一个普通的 `{ type: '...' }` 对象，而是**允许你 dispatch 一个函数！**
只要它发现你 dispatch 了一个函数，它就在半空中把它拦截下来并执行这个函数。

```javascript
// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 🚀 核心：定义异步 Thunk
// 参数1：Action 的 type 前缀
// 参数2：一个包含异步请求的回调函数
export const fetchUserById = createAsyncThunk(
  'user/fetchById',
  async (userId, thunkAPI) => {
    // 可以在这里发请求
    const response = await axios.get(`/api/users/${userId}`);
    return response.data; // 返回的数据会自动成为 fulfilled 状态时的 action.payload
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, status: 'idle', error: null },
  reducers: {}, // 普通的同步 reducer 写这里
  
  // 🚨 异步的 reducer 必须写在 extraReducers 里！
  // 因为异步过程被明确划分为了三个阶段：等待中、成功、失败
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.status = 'loading'; // 展示 Loading 动画
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload; // 拿到请求结果，存入 state
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message; // 记录报错信息
      });
  },
});

export default userSlice.reducer;
```

**在组件中调用极其优雅：**
```jsx
// 就像普通的同步方法一样，直接 dispatch 这个异步函数！
<button onClick={() => dispatch(fetchUserById(9527))}>
  拉取用户信息
</button>
```

## 5. React-Redux 核心 API (绑定 React)
*Redux 本身和 React 没有任何关系。`react-redux` 库负责把这俩强行缝合在一起。*

### 5.1 `<Provider store={store}>`
必须包裹在 React 应用的最外层。它利用 Context API，将 Redux 的 Store 实体像自来水网一样铺设到整个组件树。

```jsx
import { Provider } from 'react-redux';
import { store } from './store';

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

### 5.2 `useSelector(selectorFn, [equalityFn])`
**用于从 Redux Store 状态树中提取你需要的数据。这是你最应该精通的 API。**

*   **特性**：它不仅负责取数据，还负责**订阅 (Subscribe)**。只要从这里提取的数据发生了变化，包含它的组件就会被强制重新渲染。

```jsx
import { useSelector, shallowEqual } from 'react-redux';

function UserList() {
  // 1. 基础读取
  const users = useSelector((state) => state.users.list);

  // 2. 高阶：如果必须返回一个新对象，使用 shallowEqual 防止无限重渲染 (详见 FAQ)
  const stats = useSelector((state) => ({
    count: state.users.list.length,
    isLoading: state.users.loading
  }), shallowEqual); 

  return <div>...</div>;
}
```

### 5.3 `useDispatch()`
返回 Redux Store 的 `dispatch` 函数。用于在组件中发射 Action 以修改状态。

```jsx
import { useDispatch } from 'react-redux';
import { increment } from './counterSlice';

function Button() {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(increment())}>点我</button>;
}
```

## 6. 传统 Redux 核心底层 API (了解即可)
*虽然有了 RTK，你很少直接写它们，但在阅读源码或老项目时必须认识。*

| 底层 API | 作用描述 | 对应 RTK 高阶 API |
| :--- | :--- | :--- |
| **`createStore(reducer, [preloadedState], [enhancer])`** | 纯净地创建一个 store 实例。（已被官方标记为 `deprecated`，但不影响使用）。 | `configureStore` |
| **`combineReducers(reducers)`** | 把多个分散的 reducer 函数合并成一个巨大的 rootReducer 树。 | `configureStore` 的 `reducer` 对象参数自带此功能 |
| **`applyMiddleware(...middlewares)`** | 将中间件增强器挂载到 store 上，拦截 dispatch 流程。 | `configureStore` 的 `middleware` 回调函数 |
| **`bindActionCreators(actionCreators, dispatch)`** | 将一个包含很多 action 构造函数的对象，全部用 `dispatch` 包裹起来，方便直接调用。（在现代 Hooks 写法中极少使用）。 | 无，通常直接手写 `dispatch(action())` |

### 6.1 核心大管家：`createStore(reducer, [preloadedState], [enhancer])`
*   **`reducer` (Function)**：一个纯函数，接收当前 state 和 action，返回新的 state。
*   **`preloadedState` (Any)**：可选。初始状态快照。通常用于服务端渲染 (SSR) 水合，或者从 `localStorage` 中恢复用户的持久化状态。
*   **`enhancer` (Function)**：可选。Store 的增强器。最常用的是通过 `applyMiddleware` 注入中间件。

```javascript
import { createStore, applyMiddleware } from 'redux';
import rootReducer from './reducers';
import thunk from 'redux-thunk';

// 经典老项目的标准创建模式
const store = createStore(
  rootReducer,
  // 如果需要同时加载中间件和 Redux DevTools，需要借助 redux 提供的 compose 函数，或工具包里的 composeWithDevTools
  applyMiddleware(thunk)
);
```

**`Store` 实例的四大方法**

`createStore` 返回的 `store` 对象暴露出四个极其底层的方法，**它们甚至可以完全脱离 React 运行在任何 JS 环境中**。

| 方法 | 职责深度解析 |
| :--- | :--- |
| **`store.getState()`** | 获取当前状态树的当前快照。注意：它是只读的，不能通过它直接修改数据。 |
| **`store.dispatch(action)`** | **触发状态改变的唯一合法途径**。将一个普通的 action 对象发送给 Reducer。 |
| **`store.subscribe(listener)`** | 添加一个变化监听器。每当 dispatch action 且状态可能发生变化时，它就会被调用。通常在这个回调里去执行 `store.getState()` 获取新视图。（**注意：`react-redux` 在底层其实就是深度利用了这个 API 来实现组件的自动重渲染**）。 |
| **`store.replaceReducer(nextReducer)`** | 极少使用的高阶 API。强行替换当前用来计算 state 的 reducer 函数。通常用于实现**代码分割（Code Splitting）时的动态加载 Reducer**，或者在 Webpack 的热模块替换 (HMR) 逻辑中。 |


### 6.2 状态树组装：`combineReducers(reducers)`

```javascript
import { combineReducers } from 'redux';

// 拆分出细粒度的 Reducer
function usersReducer(state = [], action) { /*...*/ }
function postsReducer(state = {}, action) { /*...*/ }

// 组合！这里的 Key 决定了最终 State 树长什么样
const rootReducer = combineReducers({
  usersArea: usersReducer, // 最终通过 store.getState().usersArea 访问
  postsArea: postsReducer
});

export default rootReducer;
```

**底层暴力广播机制揭秘：**
当你 `dispatch({ type: 'ADD_POST' })` 时，`combineReducers` 并不是智能地只发给 `postsReducer`。
**它会使用一个 `for` 循环，将这个 action 强制广播给它底下的每一个子 Reducer！**
这就引出了极其严格的代码纪律：**你的每个子 Reducer 的 `switch` 语句中，必须包含一个 `default: return state;` 分支。** 如果它不认识这个 action，它必须老老实实把旧状态还回去，否则对应的状态块会瞬间变成 `undefined`，导致页面崩溃！

### 6.3 中间件洋葱模型：`applyMiddleware(...middlewares)`

```javascript
import { createStore, applyMiddleware } from 'redux';

// 中间件的底层签名：一个三层柯里化 (Currying) 的洋葱模型函数
const customLogger = (storeAPI) => (next) => (action) => {
  // 1. 拦截层：Action 刚刚被发出，还没有到达 Reducer
  console.log('发出动作:', action.type);
  console.log('当前老状态:', storeAPI.getState());

  // 2. 核心流转：将 action 交给下一个中间件，或者最终进入 Reducer 计算
  const result = next(action); 

  // 3. 回调层：Reducer 计算完毕，新状态已经生成
  console.log('计算后的新状态:', storeAPI.getState());
  
  return result; // 必须返回 result，维持 dispatch 的执行链
};

const store = createStore(rootReducer, applyMiddleware(customLogger));

// 封装applyMiddlewares伪代码，底层实现
// function applyMiddlewares(...middlewares) {
//     const newMiddleware = [...middlewares];
//     middlewares.forEach(middleware => {
//         store.dispatch = middleware(store);
//     })
// }
```

### 6.4 辅助胶水：`bindActionCreators(actionCreators, dispatch)`
它的作用是：把你写的一堆原本只能返回对象的 Action 函数，**自动套上一层 `dispatch` 的外壳**，让你可以在组件里像调用普通函数一样直接触发它。

```javascript
import { bindActionCreators } from 'redux';

// 假设你有一个单纯返回对象的函数
const addTodo = (text) => ({ type: 'ADD', payload: text });

// 原始调用方式极其繁琐：
// dispatch(addTodo('学 React'))

// 使用胶水包装后：
const boundAddTodo = bindActionCreators(addTodo, store.dispatch);

// 包装后的组件调用体验极佳：
// boundAddTodo('学 React') -> 内部自动完成了 dispatch 操作
```

## 7. 常见问题 (FAQ) 与避坑指南

### 7.1 传统 Redux 和 Redux Toolkit (RTK) 的关系是什么？老项目怎么维护？
*   **答**：RTK 是 Redux 官方为了拯救被全网吐槽“配置反人类、样板代码太多”而推出的官方终极封装。
    *   **老项目 (传统 Redux)**：你需要手写 action 常量、手写复杂的 switch-case reducer、自己配 thunk 中间件、极其痛苦地用展开运算符 `...state` 维持不可变性，还得用 `connect(mapStateToProps)` 这种恶心的 HOC 去包裹组件。
    *   **新项目 (RTK + Hooks)**：全面拥抱 `createSlice`（内置了 Immer.js 消灭展开运算符）和 `useSelector`。如果你接手老项目，可以逐个文件将旧的 Reducer 迁移成 Slice 格式，它们在底层是 100% 兼容混用的。

### 7.2 既然在 RTK 的 reducers 里面可以直接 `state.value += 1`，它违背了不可变性铁律吗？
*   **答**：**绝对没有违背，这是 RTK 底层施展的魔法。**
    *   RTK 在 `createSlice` 内部深度集成了极其强大的 **Immer.js** 库。
    *   当你执行 `state.value += 1` 时，你操作的其实不是真正的原状态，而是 Immer 提供的一个 **Proxy 草稿 (Draft)**。等你的函数执行完，Immer 会自动帮你把草稿转化为一个符合不可变性原则的、全新的、包含新指针地址的 State 对象返回给 Redux。
    *   **🚨 避坑死穴**：这种“直接突变”的魔法**仅且仅在 `createSlice` 的 reducer 内部有效**！如果你在 React 的 `useState` 或者自己手写的普通 Reducer 里这么干，页面还是会瞬间暴毙。

### 7.3 为什么我的 `useSelector` 导致组件疯狂重复渲染？
*   **答**：这是使用 Redux 时最最最经典的性能灾难。
    *   **原因**：`useSelector` 在底层使用了严格的全等比较 (`===`) 来决定是否通知组件重渲染。
    *   **灾难写法**：
        ```jsx
        // ❌ 每次 Redux 里的任何一点风吹草动引发全局 state 更新时，
        // 这里的 map/filter 都会立刻执行并返回一个【全新内存地址】的数组！
        // useSelector 发现新旧地址 !==，大喊一声“数据变了”，强行逼迫组件重渲染！
        const activeUsers = useSelector(state => state.users.filter(u => u.active));
        ```
    *   **最佳实践 (Reselect)**：如果你需要从 state 中提取衍生数据（类似 Vue 的 computed），绝对不能在组件里现算。你必须使用 RTK 提供的 **`createSelector`** 编写一个带缓存 (Memoized) 的选择器。
        ```javascript
        import { createSelector } from '@reduxjs/toolkit';
        
        // 它会缓存上一次的结果，只要 users 数组不变，它永远返回同一个内存地址！
        const selectActiveUsers = createSelector(
          [(state) => state.users],
          (users) => users.filter(u => u.active)
        );
        ```

### 7.4 Zustand 这么火，Redux 是不是要被淘汰了？
*   **答**：**中小型项目确实在抛弃 Redux，但中大型/巨型项目依然是它的主场。**
    *   Zustand 以其极简的配置、无需 Provider 嵌套、无模板代码的优势，目前是海外独立开发者和小微团队的绝对宠儿。
    *   但 Redux 的优势在于：**极其严苛的架构纪律**（强制的 Action 溯源）、无敌的**中间件生态**（例如可以拦截 Action 来做离线同步、做请求队列）、以及无可替代的 **Time-Travel Devtools（时光机调试体验）**。在一个有几十个前端同时协作的金融或政企级巨型系统里，这套纪律是防崩溃的底线。



