---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 组件通信

React 极度推崇**单向数据流 (One-Way Data Flow)**：数据永远只能自上而下地流动。一切通信方案的底层基座，都是对这一哲学的坚守或巧妙的变通。

## 1. 物理层级相邻的通信 (基础)

### 1.1 父传子：Props 向下传递
这是最基础、最符合 React 理念的单向通信方式。父组件将数据或回调函数作为属性（Properties）传给子组件。

**代码实现：**
```jsx
// 父组件 (Parent.jsx)
import Child from './Child';

export default function Parent() {
  const userName = "Alice";
  const userAge = 25;

  return (
    <div style={{ border: '2px solid blue', padding: '10px' }}>
      <h2>我是父组件</h2>
      {/* 通过属性向子组件传递数据 */}
      <Child name={userName} age={userAge} />
    </div>
  );
}

// 子组件 (Child.jsx)
// 🚨 铁律：子组件绝对不能修改 props！
export default function Child({ name, age }) {
  return (
    <div style={{ border: '2px solid red', margin: '10px' }}>
      <p>收到父组件的数据：</p>
      <p>姓名: {name}, 年龄: {age}</p>
    </div>
  );
}
```

### 1.2 子传父：Callback Props (回调函数)
由于数据流只能向下，子组件无法直接把数据推给父亲。

**解决方案是：父组件传一个“遥控器（函数引用）”给子组件，子组件通过调用这个函数，并把数据作为参数传进去，从而触发父组件内部的状态更新。**

**代码实现：**
```jsx
import { useState } from 'react';

// 父组件
export default function Parent() {
  const [childMsg, setChildMsg] = useState('等待子组件回复...');

  // 定义一个接收数据的回调函数
  const handleReceiveMsg = (msg) => {
    setChildMsg(msg);
  };

  return (
    <div>
      <h2>父组件状态：{childMsg}</h2>
      {/* 将回调函数作为 prop 传给子组件 */}
      <Child onMsgSend={handleReceiveMsg} />
    </div>
  );
}

// 子组件
function Child({ onMsgSend }) {
  return (
    <button onClick={() => onMsgSend('爸爸，我饿了！')}>
      向父亲发送消息
    </button>
  );
}
```

### 1.3 兄弟组件：状态提升 (Lifting State Up)
两个平级的组件（A 和 B）不能直接对话。如果 A 里的按钮需要控制 B 里的文字，必须**把这个共享的状态剥离出来，提升到它们共同的最小父组件中管理**。

**代码实现：**
```jsx
import { useState } from 'react';

// 共同的父组件 (大管家)
export default function Parent() {
  // 1. 状态被提升到了这里！
  const [sharedText, setSharedText] = useState('初始文字');

  return (
    <div>
      {/* 2. 把修改状态的方法传给兄弟 A */}
      <BrotherA onTextChange={setSharedText} />
      {/* 3. 把最新的状态数据传给兄弟 B */}
      <BrotherB text={sharedText} />
    </div>
  );
}

function BrotherA({ onTextChange }) {
  return (
    <input 
      placeholder="输入内容同步给隔壁..." 
      onChange={(e) => onTextChange(e.target.value)} 
    />
  );
}

function BrotherB({ text }) {
  return <p>隔壁传来的内容：{text}</p>;
}
```

### 1.4  父传子：默认插槽
这是最常见的基础插槽。当你将内容写在自定义组件的**开闭标签之间**时，React 会极其智能地将这些内容打包，作为一个名为 **`children`** 的特殊 prop 传递给组件。

**父组件 (发货方)：**
```jsx
function App() {
  return (
    // 这些乱七八糟的 DOM 都会被塞进 Card 的 children 属性里
    <Card>
      <h1 className="title">这是一个通知</h1>
      <p>您的余额不足，请及时充值。</p>
      <button>前往充值</button>
    </Card>
  );
}
```

**子组件 (接收与渲染方)：**
```jsx
// 1. 在参数列表里解构出 children
function Card({ children }) {
  return (
    <div className="card-wrapper shadow-lg p-4 border-radius">
      {/* 2. 在你需要的地方挖个坑，把它填进去 */}
      {children} 
    </div>
  );
}
```

### 1.5 父传子：具名插槽
当你的组件是一个复杂布局（如一个拥有左侧边栏、右侧主内容区、底部栏的整体 Layout），只有一个 `children` 坑位显然不够用了。

在 Vue 中你会用 `<slot name="sidebar">`。但在 React 中，**你只需要自己定义几个普通的 `props`，然后要求父组件传 JSX 进来即可！**

**子组件 (定义三个坑位)：**
```jsx
// 接收三个自定义的 props，它们预期将被传入 JSX 对象
function PageLayout({ header, sidebar, mainContent }) {
  return (
    <div className="layout-container">
      {/* 坑位 1 */}
      <header className="top-nav">
        {header}
      </header>
      
      <div className="layout-body">
        {/* 坑位 2 */}
        <aside className="left-sidebar">
          {sidebar}
        </aside>
        
        {/* 坑位 3 */}
        <main className="content">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
```

**父组件 (填坑)：**
```jsx
function App() {
  return (
    <PageLayout
      // 像传普通字符串一样，把一段段 JSX 塞进对应的 props 里！
      header={<h1>后台管理系统</h1>}
      sidebar={
        <ul>
          <li>用户管理</li>
          <li>权限设置</li>
        </ul>
      }
      mainContent={<DashboardPanel />}
    />
  );
}
```

### 1.6 子传父：作用域插槽

**业务痛点**：子组件负责极其复杂的底层逻辑计算（比如追踪鼠标当前坐标、处理极其复杂的表格数据过滤），但**它不知道该怎么展示这些数据**，展示的决定权在父组件手里。

在 Vue 中这叫“作用域插槽”（子传数据给父模板）。在 React 中，这被称为 **Render Props 模式**：**父组件传一个“函数”给子组件，子组件执行这个函数，并把自己的内部数据作为参数传进去，最后渲染这个函数的执行结果。**

**子组件 (只做逻辑，不决定 UI)：**
```jsx
import { useState } from 'react';

// 这个组件是一台没有屏幕的发动机。它接收一个叫 render 的函数作为 prop
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div style={{ height: '100vh' }} onMouseMove={handleMouseMove}>
      {/* 核心魔法：执行父组件传来的函数，并把自己的私有坐标数据喂给它！ */}
      {render(position)}
    </div>
  );
}
```

**父组件 (决定 UI)：**
```jsx
function App() {
  return (
    <div>
      <h2>鼠标追踪演示</h2>
      
      <MouseTracker 
        // 传一个函数进去！这个函数接收子组件吐出来的数据 (mousePos)，并返回 JSX
        render={(mousePos) => (
          <p style={{ color: 'red', fontWeight: 'bold' }}>
            鼠标当前坐标： X: {mousePos.x}, Y: {mousePos.y}
          </p>
        )}
      />
    </div>
  );
}
```

### 1.7 父传子： Portals（传送门）
它允许你将子组件的**真实物理 DOM 节点**，直接“传送”并插入到 HTML 文档中**任意一个独立于 React 根节点之外的真实 DOM 容器中**（通常是 `<body>` 的最底层）。

`createPortal` 是 `react-dom` 包提供的一个极其轻量、却又拥有降维打击能力的 API。

```javascript
// 核心签名
import { createPortal } from 'react-dom';
createPortal(child, container)
```
*   **`child`**: 任何可渲染的 React 子元素（一段 JSX，字符串或数组）。
*   **`container`**: 一个存在于真实浏览器 HTML 中的**原生 DOM 节点**（它就是传送的目的地）。

#### **工业级实战：编写一个绝对无敌的 Modal 组件**

**在 `public/index.html` 准备降落点**
为了防止把乱七八糟的东西全丢进 `body`，我们通常在 React 应用的根节点 `div#root` 旁边，开辟一个专属的弹窗降落场。

```html
<body>
  <div id="root"></div> <!-- 你所有的普通 React 组件都在这儿 -->
  
  <!-- 🕳️ 专属降落点：所有的全屏弹窗都会被传送到这里 -->
  <div id="modal-root"></div>
</body>
```

**封装 `<Modal>` 传送门组件**

```jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css'; // 弹窗的 fixed 全屏遮罩样式写在这里

export default function Modal({ isOpen, onClose, children }) {
  // 1. 如果控制开关为 false，连渲染都不要做
  if (!isOpen) return null;

  // 2. 核心：使用 createPortal 将 UI 传送到 #modal-root
  return createPortal(
    // 遮罩层，点击遮罩触发关闭
    <div className="modal-overlay" onClick={onClose}>
      {/* 内容弹窗：🚨 极其重要！阻止点击冒泡，防止点击弹窗内容时触发遮罩关闭！ */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    // 3. 传送的目的地 (强行获取 HTML 里的真实节点)
    document.getElementById('modal-root')
  );
}
```

**在深渊地狱中召唤弹窗**

```jsx
import { useState } from 'react';
import Modal from './Modal';

export default function DeepWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    // 这是一个充满恶意 CSS 限制的容器
    <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1, transform: 'scale(1)' }}>
      <button onClick={() => setIsModalOpen(true)}>打开无敌弹窗</button>

      {/* 逻辑上，它作为子组件写在这里，方便接收 state 传值和控制 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>我成功逃出来了！</h2>
        <button onClick={() => setIsModalOpen(false)}>确认</button>
      </Modal>
    </div>
  );
}
```


## 2. 跨越层级的深度通信 (进阶)

### 2.1 跨多层级：Context API (官方原生)

####  1. Context 实战与代码实现
当数据需要从第 1 层传到第 10 层时，一层层写 props 会导致极其痛苦的 **Prop Drilling (属性透传地狱)**。Context 允许你在组件树的高处建立一个“广播站”，底层的任何组件可以直接接收广播。

**代码实现：**
```jsx
import { useState, createContext, useContext } from 'react';

// 1. 创建 Context (广播站频段)
const ThemeContext = createContext('light'); // 'light' 是找不到 Provider 时的兜底默认值

export default function App() {
  const [theme, setTheme] = useState('dark');

  return (
    // 2. 使用 Provider 提供数据 (建立广播站)
    // 被它包裹的所有子孙组件，都能听到这个 value
    <ThemeContext.Provider value={theme}>
      <div style={{ padding: 20 }}>
        <h1>最顶层 App</h1>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          切换主题
        </button>
        <MiddleLayer />
      </div>
    </ThemeContext.Provider>
  );
}

// 中间层 (无需充当数据的搬运工)
function MiddleLayer() {
  return <BottomLayer />;
}

// 最底层组件 (接收广播)
function BottomLayer() {
  // 3. 消费数据：直接拿到顶层提供的 theme 值！
  const currentTheme = useContext(ThemeContext);
  
  const style = {
    background: currentTheme === 'dark' ? '#333' : '#fff',
    color: currentTheme === 'dark' ? '#fff' : '#000',
    padding: '20px'
  };

  return <div style={style}>我是底层组件，当前主题是：{currentTheme}</div>;
}
```

#### 2. 多 Context 实战与代码实现

核心思想：**将不同职责、更新频率不同的状态，物理拆分到独立的 Context 中。**

**创建多个独立的 Context**

```jsx
// src/context/ThemeContext.js
import { createContext } from 'react';
export const ThemeContext = createContext('light');

// src/context/UserContext.js
import { createContext } from 'react';
export const UserContext = createContext(null);
```

**顶层嵌套提供数据 (Provider Hell)**

在应用的根组件（如 `App.jsx`）中，你需要将这些 Provider 层层嵌套起来包裹整个应用。

```jsx
import { useState } from 'react';
import { ThemeContext } from './context/ThemeContext';
import { UserContext } from './context/UserContext';
import Layout from './components/Layout';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState({ name: 'Alice' });

  return (
    // 像俄罗斯套娃一样层层嵌套
    // 💡 最佳实践：更新频率越低、越稳定的 Provider 放在越外层 (如 Theme)
    // 频繁变动的 Provider 放在越内层 (如 User)
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <Layout />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
```

**底层组件消费多 Context**

底层组件极其自由，它缺什么就引入哪个 Context，绝不多引。

```jsx
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { UserContext } from '../context/UserContext';

export default function ProfileHeader() {
  // 同时消费两个 Context
  const theme = useContext(ThemeContext);
  const user = useContext(UserContext);

  return (
    <div className={`header bg-${theme}`}>
      <img src={user.avatar} alt="Avatar" />
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}
```

#### 3. 高阶优化：如何解决“嵌套地狱 (Provider Hell)”？

当你的项目拆分了 10 个 Context 时，`App.jsx` 里会出现 10 层极度恶心的代码缩进，也就是著名的 **Provider Hell**。

为了保持代码的优雅，我们可以自己编写一个**组合高阶组件 (Compose Component)** 将它们拍平。

**编写 `AppProvider` 统一收口组件**

```jsx
// src/context/AppProvider.jsx
import { ThemeContext } from './ThemeContext';
import { UserContext } from './UserContext';
import { AuthContext } from './AuthContext';

// 假设这些状态是从自定义 Hook 中拉取的
function AppProvider({ children }) {
  const themeValue = 'dark'; // 实际应为 useState
  const userValue = { name: 'Bob' };
  const authValue = { token: '123' };

  // 1. 常规嵌套写法（虽然缩进多，但在独立文件里可接受）
  return (
    <ThemeContext.Provider value={themeValue}>
      <UserContext.Provider value={userValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

export default AppProvider;
```

**(极致高阶) 借助数组 Reduce 动态拍平 Providers**

如果追求极致的装逼和整洁，可以手写一个组合函数：

```jsx
// src/utils/composeProviders.jsx
import React from 'react';

// 接收一个 [Provider, value] 的数组，将它们 reduce 组装起来
export const ComposeProviders = ({ providers, children }) => {
  return providers.reduceRight((acc, [Provider, value]) => {
    return <Provider value={value}>{acc}</Provider>;
  }, children);
};

// ===================================
// 使用时的 App.jsx 会变成极其优雅的扁平化结构：
import { ComposeProviders } from './utils/composeProviders';
// ... 引入 Contexts 和 Values

export default function App() {
  const providerList = [
    [ThemeContext, themeValue],
    [UserContext, userValue],
    [AuthContext, authValue]
  ];

  return (
    <ComposeProviders providers={providerList}>
      <Layout />
    </ComposeProviders>
  );
}
```

### 2.2 **打破禁忌：父调子内部方法 (`forwardRef` +`useImperativeHandle`)**
React 极力反对父组件命令式地去操作子组件（比如：父组件想强行让子组件里的一个 `<input>` 获取焦点，或者重置子组件内部的表单数据）。但如果非要这么做，需要暴露特定接口。

**代码实现：**
```jsx
import { useRef, forwardRef, useImperativeHandle } from 'react';

// 子组件：必须用 forwardRef 包裹，才能合法接收父组件传来的 ref
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  // 核心：拦截父组件的 ref 绑定，只暴露出你想暴露的方法给父组件！
  useImperativeHandle(ref, () => ({
    // 暴露给父组件的名字叫 focusAndClear
    focusAndClear: () => {
      inputRef.current.focus();
      inputRef.current.value = '';
    }
  }));

  return <input ref={inputRef} type="text" defaultValue="我是子组件的输入框" />;
});

// 父组件
export default function App() {
  const childRef = useRef(); // 创建一根"钩子"

  return (
    <div>
      {/* 把钩子甩给子组件 */}
      <FancyInput ref={childRef} />
      <button onClick={() => childRef.current.focusAndClear()}>
        强行让子组件清空并聚焦
      </button>
    </div>
  );
}
```

## 3. 全局任意组件通信 (架构级)

### 3.1 全局状态管理库 (Zustand / Redux / Mobx)
当应用极为庞大，或者两个处于完全不同路由分支的组件需要共享数据（比如用户登录态、购物车数量）时，必须跳出组件树的束缚，在外部建立一个全局金库。

*(以目前极简、极受欢迎的 `Zustand` 为例)*

**代码实现：**
```bash
# 安装 zustand
npm install zustand
```

```jsx
// 1. store.js (在组件外部独立创建一个 Store)
import { create } from 'zustand';

export const useStore = create((set) => ({
  bears: 0,
  // 修改状态的方法
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// ============================================

// 2. ComponentA.jsx (在任意组件读取数据)
import { useStore } from './store';

function ComponentA() {
  const bears = useStore((state) => state.bears);
  return <h1>发现 {bears} 只熊</h1>;
}

// 3. ComponentB.jsx (在相隔十万八千里的另一个组件修改数据)
import { useStore } from './store';

function ComponentB() {
  const increasePopulation = useStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>增加一只熊</button>;
}
```

### 3.2 EventBus事件总线 


#### 1. 引入并创建全局 Bus (`mitt` 方案)

```bash
npm install mitt
```

```javascript
// src/utils/eventBus.js
import mitt from 'mitt';

// 导出一个全局单例的 bus 对象
export const bus = mitt();

// (可选) 规范化你的事件名称，防止拼写错误
export const EVENTS = {
  SHOW_GLOBAL_TOAST: 'SHOW_GLOBAL_TOAST',
  FORCE_LOGOUT: 'FORCE_LOGOUT'
};
```

#### 2.  接收方：严格的挂载与卸载 (监听事件)

接收方组件**必须极其严谨地**在 `useEffect` 中处理监听的挂载和卸载。

```jsx
// src/components/GlobalToast.jsx
import { useState, useEffect } from 'react';
import { bus, EVENTS } from '../utils/eventBus';

export default function GlobalToast() {
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // 1. 定义事件处理函数
    const handleShowToast = (payload) => {
      setToastMsg(payload.message);
      setTimeout(() => setToastMsg(''), 3000);
    };

    // 2. 组件挂载时，注册监听 (on)
    bus.on(EVENTS.SHOW_GLOBAL_TOAST, handleShowToast);

    // 3. 🚨 极其致命的一步：组件卸载前，必须注销监听 (off)！
    // 否则这个组件被销毁后，只要有人触发事件，它依然会在内存里默默执行 setState，导致 React 红屏报错！
    return () => {
      bus.off(EVENTS.SHOW_GLOBAL_TOAST, handleShowToast);
    };
  }, []);

  if (!toastMsg) return null;
  return <div className="fixed-toast">{toastMsg}</div>;
}
```

#### 3. 发送方：在非 React 环境中呼叫 (触发事件)

Event Bus 最有价值的地方在于：它是一个纯 JS 对象，它**可以脱离 React 组件树运行**。

```javascript
// src/utils/request.js (比如这是你的 Axios 封装文件)
import axios from 'axios';
import { bus, EVENTS } from './eventBus';

const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 500) {
      // 🌟 核心场景：在纯粹的 JS 逻辑文件里，没办法用 useContext 或 Props
      // 这时只能用 Event Bus 去隔空呼叫顶层的 Toast 组件弹错！
      bus.emit(EVENTS.SHOW_GLOBAL_TOAST, { 
        message: '服务器爆炸了，快跑！' 
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然 Context 这么好用，我是不是该把所有数据都放进 Context，彻底抛弃 Props？
*   **答**：**这是极其危险的架构灾难！官方文档极力反对滥用 Context。**
    *   **性能核爆**：Context 有一个致命缺陷。**只要 Provider 的 `value` 发生变化，它内部所有消费了这个 Context (调用了 useContext) 的组件，无论藏得多深，都会被强制重新渲染！**
    *   如果你把频繁变化的表单输入或者秒表数据扔进全局 Context，整个应用会卡到爆炸。
    *   **组件复用性丧失**：子组件一旦写了 `useContext`，就被死死绑在了这个特定的 Provider 环境中，无法再被单独抽离到其他项目使用。
    *   **正解**：Context **仅限于**全局的、低频变动的数据（如：当前登录账号、主题色、语言偏好）。业务数据传递依然必须首选 Props 和状态提升。

### 4.2 我把一个对象传给 Context Provider 的 `value`，为什么会导致子组件疯狂重渲染？
*   **答**：这是一个经典的内存地址对比陷阱。
    ```jsx
    function App() {
      // 假设由于别的不相干状态变化引起了 App 重渲染
      const [count, setCount] = useState(0); 
      
      // ❌ 灾难：每次 App 重渲染，{ theme: 'dark', lang: 'zh' } 都是在内存里现造出来的一个全新对象！
      // Provider 浅比较发现内存地址变了，大喊一声"数据变了！"，强迫底下所有用 Context 的组件全部重渲染一次！
      return (
        <ThemeContext.Provider value={{ theme: 'dark', lang: 'zh' }}>
           ...
        </ThemeContext.Provider>
      );
    }
    ```
    *   **终极解法**：如果 Provider 的 `value` 是一个对象或函数，**必须使用 `useMemo` 或 `useCallback` 把它在内存里死死“冻住”**。
    ```jsx
    // ✅ 正确做法：只要依赖项 [] 不变，这个对象的内存地址永远不变
    const contextValue = useMemo(() => ({ theme: 'dark', lang: 'zh' }), []);
    return <ThemeContext.Provider value={contextValue}>...</ThemeContext.Provider>;
    ```

### 4.3 兄弟组件通信，我是用“状态提升”好，还是弄个“事件总线 (EventBus / PubSub)”好？
*   **答**：在 React 中，**坚决抵制使用 EventBus。**
    *   在 Vue 2 时代，EventBus `$on/$emit` 很流行，但在大型项目中它是一场维护噩梦。你根本不知道一个事件是在哪里发出的，又是在宇宙的哪个角落被接收的，数据流完全是个无法溯源的黑盒，且极易引发忘记解绑导致的内存泄漏。
    *   React 社区有极强的代码洁癖，推崇绝对可预测的**显式数据流**。
    *   **正解**：老老实实把状态提升到共同的父组件。如果实在嫌太远或者性能吃不消，直接引入 Zustand 或 Redux 等现代状态管理库，它们有极其严密的追踪体系。

### 4.4 状态提升后，父组件变得极其臃肿，长达 1000 行，如何优化这种“巨型父组件”？
*   **答**：状态提升确实容易导致父组件承担过多的业务逻辑。
    *   **优化方案（自定义 Hook 🌟）**：这是现代 React 开发的最优解。你可以把相关的多个 `useState` 和操作这些 state 的回调函数，打包封装进一个单独的外部文件（比如 `useTemperature.js`）中。
    *   然后在父组件中 `const { celsius, fahrenheit, setC, setF } = useTemperature()` 一行代码引入。这既保证了状态的集中提升管理，又让父组件的 UI 结构清爽无比。


### 4.5 对于同一个状态，我是应该拆分成 `StateContext` 和 `DispatchContext` 两个吗？
*   **答**：**这是高级前端架构非常推荐的最佳实践！**
    *   **痛点**：如果你把 `{ state, dispatch }` 放进同一个 Context。底层的 `Header` 组件只需要读 `state`，底层的 `Button` 组件只需要用 `dispatch` 去触发修改。当 `state` 变了的时候，`Button` 也会因为 Context 变化而被连累重渲染（哪怕它只需要执行函数）。
    *   **极致优化拆分法**：
        ```jsx
        // 物理切断读与写的重渲染连带关系
        <ThemeStateContext.Provider value={theme}>
          <ThemeDispatchContext.Provider value={setTheme}>
             {children}
          </ThemeDispatchContext.Provider>
        </ThemeStateContext.Provider>
        ```
        底层 `Button` 只 `useContext(ThemeDispatchContext)`。因为 `setTheme` 函数的内存地址永远不变，所以即使 `theme` 变了，`Button` 绝对不会重渲染！这叫**读写分离**。

### 4.6 既然拆分 Context 这么麻烦，还要考虑那么多性能优化，我直接上 Zustand / Redux 不好吗？
*   **答**：**非常好！这也是业界目前的绝对共识。**
    *   **Context 的真实定位**：React 官方明确表示，Context 的设计初衷是**“依赖注入”**（比如穿透传递表单实例、UI 库的主题配置），它**并不是一个全局状态管理工具**！
    *   如果你的状态**变动非常频繁**（比如秒表、滚动位置、多页面高频交互的数据），强行使用 Context 拆分不仅心智负担极重，而且性能极难调优。
    *   **选型结论**：
        *   低频变动的全局配置（Theme、I18n 语言、User Session） => **用 Context**。
        *   高频变动的复杂业务状态流转 => **果断上 Zustand 或 Redux Toolkit**，它们在底层利用了类似于 `useSyncExternalStore` 的机制，能够实现真正意义上的**订阅级精准细粒度更新**（不渲染任何不相关的组件）。
        
### 4.7  为什么有的时候 `props.children` 是个数组，有的时候是个对象，有的时候报错？我怎么安全地遍历它？
*   **答**：这是 React 底层对于 `children` 的诡异处理。
    *   **现象**：
        *   如果你传了 `<Card><A /><B /></Card>`，`children` 是一个**数组**。
        *   如果你只传了一个 `<Card><A /></Card>`，`children` 突然变成了**一个单独的对象**！
        *   如果你没传任何东西，`children` 是 `undefined`。
    *   **灾难**：如果你在子组件里天真地写了 `children.map(...)`，当用户只传了一个节点或者没传时，程序会直接报错崩溃 (`children.map is not a function`)！
    *   **终极避坑方案**：**永远不要直接操作原生的 `children` 变量！** React 官方提供了一套专门的 API 来安全处理它：**`React.Children`**。
    ```jsx
    import React from 'react';

    function TabList({ children }) {
      // ✅ 极其安全的遍历方式，不管传了几个都不会报错！
      return (
        <ul className="tabs">
          {React.Children.map(children, (child, index) => {
            // 你甚至可以在这里劫持每一个传进来的虚拟 DOM，给它们强行注入新的 props 属性！
            return React.cloneElement(child, { 
              key: index, 
              className: 'tab-item-active' 
            });
          })}
        </ul>
      );
    }
    ```
