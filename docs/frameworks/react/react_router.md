---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Router 全景 API(v6+)

在现代单页应用 (SPA) 中，路由系统不仅是“改变 URL 并显示不同组件”的工具，它更是**掌控应用数据流、页面状态和代码分割的顶级架构层**。

React Router v6 是 React 生态中最主流的路由解决方案，它全面拥抱了 Hooks 范式。

## 1. 核心架构与路由配置 API

### 1.1 `createBrowserRouter` 与 `RouterProvider` (Data API 时代核心)
这是 v6.4+ 引入的极其强大的 Data Router 架构。它不仅配置路由，还与底层的数据预加载 (Loader) 和表单提交 (Action) 深度绑定。

```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import ErrorPage from './pages/ErrorPage';
import Dashboard from './pages/Dashboard';

// 1. 创建路由表
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />, // 页面骨架
    errorElement: <ErrorPage />, // 🚨 极其优雅的全局错误边界处理
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
        // 🚀 Data API 的灵魂：在渲染组件前，先去拉取数据！
        loader: async () => {
          return fetch('https://api.example.com/dashboard-data');
        }
      }
    ]
  }
]);

// 2. 注入应用
function App() {
  return <RouterProvider router={router} />;
}
```

### 1.2 `BrowserRouter` 与 `<Routes>` (传统组件式声明)
如果你不喜欢 JS 对象配置，依然可以使用经典的 JSX 组件式声明。

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // 指定底层使用 HTML5 History API
    <BrowserRouter>
      {/* Routes 代替了 v5 的 Switch，拥有更智能的相对路径和最佳匹配算法 */}
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} /> {/* index 代表默认的子路由 */}
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## 2. 导航与传参 API (Components)

### 2.1 `<Link>` 与 `<NavLink>`
取代原生的 `<a>` 标签，实现无刷新跳转。

```jsx
import { Link, NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      {/* 基础跳转 */}
      <Link to="/about">关于我们</Link>
      
      {/* NavLink 自带魔法：如果当前 URL 匹配它，它会自动加上 class="active" */}
      <NavLink 
        to="/dashboard"
        className={({ isActive }) => (isActive ? 'nav-active' : 'nav-normal')}
      >
        控制台
      </NavLink>
    </nav>
  );
}
```

### 2.2 `<Navigate>` (重定向组件)
在渲染阶段强制执行跳转（通常用于权限拦截）。

```jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, children }) {
  if (!user) {
    // replace 属性表示替换当前历史记录，按返回键不会再跳回这个非法页面
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

### 2.3 `<Outlet>` (子路由占位符)
类似于 Vue Router 的 `<router-view>`。在嵌套路由的父组件中，挖一个坑让子组件渲染。

```jsx
// layouts/RootLayout.jsx
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div>
      <Header />
      <main>
        {/* 当访问 /about 时，About 组件会被塞进这个 Outlet 里 */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

## 3. 核心 Hooks API (编程式导航与数据提取)

### 3.1 `useNavigate` (动作执行者)
```jsx
import { useNavigate } from 'react-router-dom';

function Form() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // 1. 绝对路径跳转
    navigate('/success');
    
    // 2. 传递隐式状态 (state 存在内存里，URL 上看不见，刷新会丢失！)
    navigate('/profile', { state: { fromPage: 'form', userId: 123 } });
    
    // 3. 历史穿梭
    navigate(-1); // 后退
  };
}
```

### 3.2 提取 URL 参数：`useParams` 与 `useSearchParams`

```jsx
// 假设 URL 是 /users/9527?sort=asc&tab=profile
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

function UserPage() {
  // 1. 提取动态路径参数 (:id)
  const { id } = useParams(); // id === '9527'

  // 2. 提取问号后面的查询参数 (?sort=asc)
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort'); // 'asc'
  
  // 修改查询参数并自动推入 URL
  const changeTab = () => setSearchParams({ tab: 'settings' });

  // 3. 获取完整的路由上下文与隐式 State
  const location = useLocation();
  console.log(location.pathname); // '/users/9527'
  console.log(location.state);    // 获取 navigate 传过来的隐藏 state
}
```

### 3.3 Data API 专属 Hooks：`useLoaderData`
配合 `createBrowserRouter` 的极强杀招，彻底消灭 `useEffect` 里的拉数据逻辑。

```jsx
import { useLoaderData, useNavigation } from 'react-router-dom';

function Dashboard() {
  // 瞬间拿到外层 loader 提前去后端 fetch 回来的数据！
  const data = useLoaderData(); 
  
  // 监听整个应用的全局路由加载状态，非常适合做顶部的蓝条进度条
  const navigation = useNavigation();
  if (navigation.state === 'loading') return <Spinner />;

  return <div>{data.title}</div>;
}
```

## 4. 路由懒加载核心 API 实战：`React.lazy` 与 `Suspense`

> **性能灾难**：如果你的系统有 50 个页面，用户仅仅是为了看一眼“首页”，浏览器也必须被迫下载包含剩下 49 个页面代码的、高达数兆（MB）的 JS 文件。这会导致极其严重的**首屏白屏**。

**路由懒加载 (Route Lazy Loading)** 就是拯救首屏性能的最强武器。
它的核心理念是：**“按需切割，按需下载”**。也就是俗称的代码分割 (Code Splitting)。只有当用户真正点击跳转到“设置页”时，浏览器才会发起网络请求，去下载“设置页”对应的那个 JS 小代码块 (Chunk)。

### 4.1 基础实现公式

*   **`React.lazy()`**：一个高阶函数。它接收一个返回 `Promise` 的工厂函数，这个 `Promise` 必须 resolve 一个使用 `export default` 导出的 React 组件。
*   **`<Suspense>`**：一个占位边界组件。因为懒加载的组件需要通过网络下载，在下载的这几百毫秒内，React 必须知道页面上该显示什么。`<Suspense>` 的 `fallback` 属性就是用来展示这个“菊花图”或者“骨架屏”的。

```jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. 🚨 抛弃静态导入！不要写 import Dashboard from './pages/Dashboard'
// 2. 采用懒加载导入！Webpack/Vite 会自动将这些文件单独打成小的 chunk 包
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      {/* 3. 必须在懒加载组件的外层包裹 <Suspense>，通常包在最外层的 Routes 外面即可统管全局 */}
      <Suspense fallback={<div className="global-spinner">页面加载中，请稍候...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

### 4.2 高阶进阶：预加载魔法 (Preload / Prefetch)

懒加载虽然解决了首屏慢的问题，但也带来了新问题：**点击跳转时会卡顿一下（因为要现下代码）**。
我们可以结合 Webpack 的魔法注释（Magic Comments），让浏览器在首屏空闲时，**偷偷把别的页面代码下载好**。

```jsx
// Webpack 专属高级写法
const Dashboard = React.lazy(() => import(
  /* webpackChunkName: "dashboard" */ // 给打包出来的文件起个好听的名字，而不是 1.js
  /* webpackPrefetch: true */         // 告诉浏览器：在主线程空闲时，偷偷去下载这个文件
  './pages/Dashboard'
));
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 既然能在 `useNavigate` 里用 `state` 传庞大的对象，为什么大家还说它危险？
*   **答**：**极其脆弱的隐式传递。**
    *   `navigate('/detail', { state: { bigData: {...} } })` 这种写法，数据是交给浏览器的 History API 保存在内存里的。
    *   **致命缺陷**：如果用户在这个 `/detail` 页面**把 URL 复制给另一个人**打开，或者在**隐身模式下打开**，`location.state` 瞬间变成 `null`。如果你页面里写了 `state.bigData.id`，页面会立刻爆出白屏红错。
    *   **架构规范**：**绝对不要用路由 state 传递业务核心数据**。跨页面传核心数据，请上 Zustand/Redux；如果只是传个 ID，必须老老实实写在 URL 的 `:id` 或 `?id=xxx` 里，保证 URL 的可分享性。

### 5.2 Vue Router 有极其强大的全局 `beforeEach` 路由守卫来做登录拦截，React Router v6 为什么没有？该怎么做权限拦截？
*   **答**：React Router 的设计哲学是**“组件化一切 (Declarative)”**，它刻意废弃了全局的 API 钩子。
    *   在 React 中，你不需要在路由配置的外层拦截。你要写一个**权限包裹组件 (AuthWrapper)**。
    ```jsx
    // src/components/RequireAuth.jsx
    import { Navigate, useLocation } from 'react-router-dom';

    export function RequireAuth({ children }) {
      const isLogin = checkAuthStatus();
      const location = useLocation();

      if (!isLogin) {
        // 没登录，用 Navigate 强行把原本该渲染的 children 替换成重定向！
        // 顺便把想去的地址藏在 state 里带给登录页
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
      return children; // 绿灯放行
    }
    ```
    *   在路由表中极度优雅地使用：
    ```jsx
    <Route path="/admin" element={
      <RequireAuth><AdminDashboard /></RequireAuth>
    } />
    ```

### 5.3 我把 React Router 部署到 Nginx 上，点击跳转好好的，一按 F5 刷新就报 404？
*   **答**：这是使用 `BrowserRouter` (History 模式) 的千古名坑。
    *   **原理**：前端跳转没发请求，但 F5 刷新是**真实的 HTTP 请求**。浏览器向 Nginx 索要 `/admin/dashboard` 这个文件夹，Nginx 找遍硬盘没找到，必然报 404。
    *   **终极兜底配置**：必须在 Nginx 配置中加上 `try_files`，它的意思是：“如果找不到这个物理文件，**请无脑把前端打包的那个 `index.html` 塞给浏览器**，让 React 的 JS 加载完后，由前端路由接管去解析这个 URL！”
    ```nginx
    location / {
      root /var/www/html;
      index index.html;
      try_files $uri $uri/ /index.html;  # 🚨 救命稻草
    }
    ```

### 5.4 从 `/user/1` 跳转到 `/user/2`，页面 URL 变了，但是组件内的 `useEffect` 初始化请求没有重新触发？
*   **答**：这是 React 极致压榨性能导致的**组件复用假死**。
    *   **原因**：从 `/user/1` 到 `/user/2`，React 发现渲染的都是 `<UserPage>` 这个组件，它**坚决不会把组件销毁再重建**。因此，没有任何 `mount` 生命周期的钩子会被触发，你的 `useEffect(fn, [])` 当然装死。
    *   **解法 A**：老老实实监听 `id`。在 `UserPage` 里写 `useEffect(() => { fetch() }, [id])`。
    *   **解法 B (暴力拆毁 🌟)**：在 `RootLayout` 的 `<Outlet />` 坑位上，强行绑上当前路由全路径作为唯一身份 ID (`key`)。只要路径变一丁点，React 就会认为这是两个完全不同的组件，残忍销毁并重新走全套生命周期！
    ```jsx
    import { Outlet, useLocation } from 'react-router-dom';
    // ...
    const location = useLocation();
    return <Outlet key={location.pathname} />; // 完美解决假死问题
    ```
    
### 5.5 为什么我的页面崩溃了，报了红屏错误："A component suspended while responding to synchronous input..."？
*   **答**：这是使用 `React.lazy` 时 100% 会遇到的新手死穴：**忘记包裹 `<Suspense>`**。
    *   **原理**：`React.lazy` 加载组件本质上是抛出了一个未完成的 Promise 给 React 底层引擎。React 引擎接住这个 Promise 后，会往组件树的上方去寻找 `<Suspense>` 边界来接管状态。
    *   **后果**：如果你没写 `<Suspense>`，或者你把 `<Suspense>` 写在了被懒加载组件的里面，React 一路向上找一直找到应用根节点都没找到可以接盘的人，它就会直接绝望崩溃。
    *   **解法**：永远确保 `React.lazy` 生成的组件，在其渲染路径的上方，**必定**有一个 `<Suspense>` 在罩着它。

### 5.6 为什么用了 `React.lazy` 之后，报错说 "Element type is invalid..."，找不到组件？
*   **答**：**`React.lazy` 有一个极其刻板的硬性规定：它只支持 `export default` (默认导出)。**
    *   **错误场景**：如果你的组件文件是具名导出的（如 `export function MyComponent() {}`），你写了 `React.lazy(() => import('./MyComponent'))`，解析出来就没有 `.default` 属性，直接报错。
    *   **解法 A**：老老实实把组件改成 `export default MyComponent`。
    *   **解法 B (保留具名导出)**：如果你有代码洁癖，坚持要用具名导出，你必须在 `import().then()` 里面手动做一层桥接映射：
    ```jsx
    // 强行把具名导出的 MyComponent 塞给 default 属性
    const MyComponent = React.lazy(() => 
      import('./components').then(module => ({ default: module.MyComponent }))
    );
    ```

### 5.7 我把所有的按钮、小模块全都用 `React.lazy` 拆开了，为什么页面变得非常卡？
*   **答**：**过度优化是万恶之源 (Over-splitting)。**
    *   **拆分代价**：浏览器每发起一次 HTTP 请求去下载一个 chunk 文件，都会产生建立 TCP 连接、HTTP 头部解析等物理开销。
    *   如果你把一个页面切成了 50 个极其细碎的几十 KB 的懒加载包。页面渲染时会瞬间发起 50 个请求，导致浏览器网络通道严重堵塞（哪怕是 HTTP/2 也有极限），用户看到的就是满屏幕的 `<Suspense>` 菊花图在闪烁。
    *   **黄金准则**：`React.lazy` **仅且只应被用于“页面/路由级别 (Route-based)”的拆分**，或者那些极其庞大且初始不显示的组件（如巨型 ECharts 图表、富文本编辑器弹窗）。常规的 UI 小组件，绝对要打在主包里！

### 5.8 弱网环境下，用户点击跳转但代码下载失败（断网了），页面直接白屏死机怎么办？
*   **答**：这是使用异步加载必须考虑的生产级健壮性问题。网络一旦断开，`import()` 返回的 Promise 会 `reject`，`<Suspense>` 救不了你，整个 React 组件树会当场崩盘。
    *   **终极解法：必须套一层 ErrorBoundary (错误边界)。**
    *   在 `<Suspense>` 的外面，再套一个 ErrorBoundary。当下载失败时，捕获异常，并展示给用户一个友好的“网络不佳，点击重试”的按钮（重试本质上就是强制刷新页面 `window.location.reload()` 重新请求 JS 文件）。
    ```jsx
    <ErrorBoundary fallback={<h2>网络开小差了，请刷新重试~</h2>}>
      <Suspense fallback={<Spinner />}>
        <Routes>...</Routes>
      </Suspense>
    </ErrorBoundary>
    ```


