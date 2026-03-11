---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **`useContext`：跨越层级的状态广播**

## 1. 核心概念与痛点背景

在 React 严格的单向数据流机制下，数据总是像瀑布一样，从顶层父组件通过 `props` 一层层流向下方的子组件。

**Context API (上下文)**的核心思想是：**在组件树上方开启一个无形的“广播站” (Provider)，任何深藏在底层的“收音机”组件都可以直接使用 `useContext` 调频接收广播数据，瞬间跳过所有中间层。**

## 2. 核心 API 实战：建立与消费 Context

使用 Context 只需要极其模式化的三个步骤：创建、提供、消费。

### 2.1 创建上下文 (`createContext`)

最佳实践：将 Context 放在一个单独的文件中，以便于在全局任意地方导入。

```jsx
// src/context/ThemeContext.js
import { createContext } from 'react';

// createContext 接收一个默认值。
// 🚨 注意：这个默认值【只有】在底层组件试图消费 Context，但它头顶上根本没有任何 Provider 包裹它时，才会作为最后的兜底生效！
export const ThemeContext = createContext('light');
```

### 2.2 提供数据 (`Context.Provider`)

在组件树尽可能高的位置（通常是 `App.jsx` 或模块容器层），用 `<Context.Provider>` 包裹需要收到广播的所有子孙组件，并通过 `value` 属性下发数据。

```jsx
// src/App.jsx
import { useState } from 'react';
import { ThemeContext } from './context/ThemeContext';
import Layout from './components/Layout';

export default function App() {
  // 这里的数据通常是响应式的 useState，这样当状态改变时，底层的组件会自动刷新
  const [theme, setTheme] = useState('dark');

  return (
    // 1. 使用 Provider 包裹组件树
    // 2. 将当前的状态 theme 作为 value 广播出去
    <ThemeContext.Provider value={theme}>
      <div className="app-container">
        <h1>后台管理系统</h1>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          切换深色/浅色模式
        </button>
        
        {/* Layout 以及其内部成百上千个子组件，统统都能听到这个主题颜色的广播了！ */}
        <Layout /> 
      </div>
    </ThemeContext.Provider>
  );
}
```

### 2.3 消费数据 (`useContext`)

在底层的任意函数组件中，使用 `useContext` Hook，像魔法一样凭空抓取顶层的数据。

```jsx
// src/components/ThemeButton.jsx
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // 引入我们在第一步创建的 Context 牌照

export default function ThemeButton() {
  // 核心魔法：向 React 索要 ThemeContext 的最新 value
  // React 会自动沿着组件树往上找，找到离它最近的那个 ThemeContext.Provider，并读取它的 value
  const currentTheme = useContext(ThemeContext);

  // 一旦顶层 App.jsx 中的 setTheme 触发导致 theme 改变，
  // 这个 ThemeButton 会被强制瞬间重新渲染，应用最新的样式！
  return (
    <button className={`btn btn-${currentTheme}`}>
      当前系统正在使用 {currentTheme} 主题
    </button>
  );
}
```

## 3. 高阶架构：封装自定义 Provider 与 Context Hook

在真实的企业级项目中，把杂乱的 `useState` 和 `<Provider>` 标签堆砌在 `App.jsx` 里显得极度不专业。我们需要利用高阶组件思想将 Context 彻底封装为一个**绝对黑盒**。

### 3.1 终极企业级写法 (以管理用户权限为例)

```jsx
// src/context/AuthProvider.jsx
import { createContext, useContext, useState, useMemo } from 'react';

// 1. 创建 Context，但不直接默认 export 它，保护底层实现
const AuthContext = createContext(null);

// 2. 编写一个专属的 Provider 包装组件 (负责管理所有的核心状态和相关业务函数)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 业务逻辑：登录
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 业务逻辑：登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // 🚨 绝对致命的性能护城河：必须使用 useMemo 锁住传给 value 的对象！(详见下方 FAQ)
  const contextValue = useMemo(() => {
    return { user, login, logout };
  }, [user]); // 只有 user 变了，这个对象的内存地址才会变

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. 编写专属的 Custom Hook，彻底对外屏蔽 useContext 和 AuthContext 实体
export function useAuth() {
  const context = useContext(AuthContext);
  // 防呆设计：如果有人在 AuthProvider 外部试图调用这个 Hook，立刻抛出致命红错提醒他
  if (context === null) {
    throw new Error('警告：useAuth 必须在 AuthProvider 内部使用！');
  }
  return context;
}
```

**极其清爽的使用体验：**

```jsx
// 在 App.jsx 中：只需套一个极其干净的壳子
import { AuthProvider } from './context/AuthProvider';
function App() {
  return <AuthProvider><Layout /></AuthProvider>;
}

// 在极其深层的 Login 组件中：直接一行代码调用自己封装的 Hook
import { useAuth } from '../context/AuthProvider';
function LoginForm() {
  const { login } = useAuth(); // 爽！什么多余的 import 都没了
  return <button onClick={() => login({ name: 'Admin' })}>登录</button>;
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然 Context 这么好用，我是不是该把所有数据都放进 Context，彻底抛弃 Props？
*   **答**：**这是极其危险的架构灾难！官方文档极力反对滥用 Context。**
    *   **性能核爆**：Context 有一个非常原始且致命的缺陷：**只要 Provider 的 `value` 发生变化，它内部所有消费了这个 Context (调用了 `useContext`) 的组件，无论藏得多深，都会被强制无差别重新渲染！** 甚至连 `React.memo` 都拦不住这股“穿透伤害”。如果你把频繁变化的表单输入或者秒表数据扔进全局 Context，整个应用会卡到爆炸。
    *   **组件复用性丧失**：你的子组件一旦内部写了 `useContext`，它就被死死地绑在了这个特定的 Provider 运行环境中。你把它抽离到别的没有任何 Provider 包裹的页面里，它立刻就报错瘫痪了，变成了一个高度耦合的“废组件”。
    *   **架构准则**：Context **仅限于**那些真正属于“全局的、低频变动”的数据（如：主题色、多语言偏好、User 登录 Session、路由信息）。普通的业务数据传递依然必须首选 Props，如果嫌嵌套深，首选**组件组合 (Component Composition / 插槽 children)** 技术来解决。

### 4.2 我把一个包含方法和状态的对象传给 Provider，为什么导致整个应用卡爆了？
*   **答**：这是使用 Context 的绝对雷区：**对象引用类型导致的内存地址刷新陷阱。**
    *   **案发现场**：
        ```jsx
        function App() {
          const [theme, setTheme] = useState('dark'); 
          // 假设应用里有个不相干的计数器
          const [count, setCount] = useState(0); 

          // ❌ 灾难写法：每次 count 改变导致 App 重新渲染时，
          // { theme, setTheme } 都会在内存中新建一个一模一样的全新对象！
          return (
            <ThemeContext.Provider value={{ theme, setTheme }}>
               <button onClick={() => setCount(c => c+1)}>点我加数: {count}</button>
               <DeepComponents />
            </ThemeContext.Provider>
          );
        }
        ```
    *   **真相**：Provider 的更新比对逻辑是 `Object.is` (浅比较)。由于每次渲染抛进来的 `{ theme, setTheme }` 对象指针地址不一样，Provider 会惊恐地向全宇宙广播：“不好了！Theme 的值发生变异了！所有消费这个 Context 的人，立刻给我重新渲染！” 导致了无数无辜组件的陪葬。
    *   **终极解法**：如果你传给 `value` 的是一个对象或数组，**必须使用 `useMemo` 把它在内存里死死“冻住”！** 

### 4.3 既然 Context 的渲染连坐这么可怕，我是不是该把读 (State) 和 写 (Dispatch) 分开？
*   **答**：**极其正确！这是高级 React 架构非常推崇的“读写分离”最佳实践。**
    *   如果你把 `{ state, setState }` 塞在同一个 Context 里。哪怕底层的 `Button` 组件只需要拿 `setState` 去触发个动作（根本不需要展示 state），当 `state` 变了的时候，这个 `Button` 也被迫跟着重新渲染一遍！
    *   **拆分法**：创建两个完全独立的 Context。
        ```jsx
        <ThemeStateContext.Provider value={themeState}>
          <ThemeDispatchContext.Provider value={setTheme}>
             {children}
          </ThemeDispatchContext.Provider>
        </ThemeStateContext.Provider>
        ```
    *   此时底层的 `Button` 只去 `useContext(ThemeDispatchContext)`。因为 `setTheme` 函数的内存地址永远不变，所以即使外面的主题翻天覆地地变，这个按钮稳如泰山，绝对不触发重新渲染！

### 4.4 Context 能完全替代 Redux/Zustand 吗？
*   **答**：**绝不能。它们解决的根本不是同一个维度的问题。**
    *   **Context 的真面目**：React 官方明确定义，Context 仅仅是一种**“依赖注入系统”**，它是一个“数据传输管道”，它本身**并不是状态管理工具**！
    *   **Redux / Zustand 的降维打击**：像 Redux 或 Zustand 这样的现代状态库，底层通常利用了类似于 `useSyncExternalStore` 的机制。当状态改变时，它们能精确知道屏幕上到底是哪一个组件绑定了这个细碎的数据，然后**点对点精确重绘那个具体的组件**，绝不波及他人。
    *   **选型结论**：极低频修改的全局配置用 Context；高频修改的复杂业务状态网络，果断上 Zustand/Redux。
