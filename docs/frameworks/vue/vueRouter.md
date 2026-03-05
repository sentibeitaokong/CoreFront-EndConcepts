---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue Router 架构

Vue Router 是 Vue 官方的路由管理器。在大型单页应用（SPA）中，它不仅仅负责“页面跳转”，更是**掌控整个应用状态机、权限边界和渲染性能的指挥中枢**。

## 1. 底层路由模式：Hash vs History

SPA 的核心诉求是：**改变浏览器 URL，但不向服务器发起请求（不刷新页面），由前端 JavaScript 接管渲染。** 
Vue Router 提供了两种截然不同的底层物理实现来实现这一诉求。

### 1.1 Hash 模式 (`createWebHashHistory`)
*   **外观表现**：URL 中必定带有一个井号 `#`。例如 `https://www.app.com/#/user/profile`。
*   **底层原理**：
    1.  依赖浏览器原生的 `window.onhashchange` 事件。
    2.  根据 HTTP 协议规范，**URL 中 `#` 号及其后面的内容，浏览器绝对不会发送给服务器！**
    3.  因此，当你改变 `#` 后的内容时，只会触发前端事件，完全纯静态闭环。
*   **优点**：前端完全独立，兼容性极好（甚至支持 IE8），部署极其简单（丢到任何静态服务器或 CDN 都能直接跑）。
*   **缺点**：太丑了！且在做微信分享、第三方回调（如 OAuth 登录）时，某些平台会自动过滤掉 `#` 号后面的内容，导致业务阻断。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hash Router Demo</title>
</head>
<body>
    <h1>Hash 模式路由</h1>
    <nav>
        <!-- 核心：链接使用 # 开头 -->
        <a href="#/home">首页</a>
        <a href="#/about">关于</a>
    </nav>
    <div id="app"></div>

    <script>
        class HashRouter {
            constructor() {
                // 存储路由配置：path -> callback
                this.routes = {};
                // 当前路由 URL
                this.currentUrl = '';
                
                // 绑定 this，确保回调中 this 指向实例
                this.refresh = this.refresh.bind(this);

                // 监听页面加载（首次进入）
                window.addEventListener('load', this.refresh);
                // 监听 Hash 变化
                window.addEventListener('hashchange', this.refresh);
            }

            // 注册路由
            route(path, callback) {
                this.routes[path] = callback || function() {};
            }

            // 刷新页面（核心逻辑）
            refresh() {
                // 获取当前 hash，去掉 # 号。如果没有 hash 默认为 /
                this.currentUrl = location.hash.slice(1) || '/';
                
                // 执行对应的回调函数渲染视图
                if(this.routes[this.currentUrl]) {
                    this.routes[this.currentUrl]();
                } else {
                    console.log('404 Not Found');
                    document.getElementById('app').innerHTML = '404';
                }
            }
        }

        // --- 使用示例 ---
        const router = new HashRouter();
        const app = document.getElementById('app');

        router.route('/home', () => {
            app.innerHTML = '<h2>我是首页内容</h2>';
        });

        router.route('/about', () => {
            app.innerHTML = '<h2>我是关于页面</h2>';
        });
    </script>
</body>
</html>
```

### 1.2 History 模式 (`createWebHistory`)
*   **外观表现**：URL 干净漂亮，和传统的后端路由一模一样。例如 `https://www.app.com/user/profile`。
*   **底层原理**：
    1.  依赖 HTML5 提供的高级 API：`history.pushState()` 和 `history.replaceState()`。
    2.  这两个 API 可以在不刷新浏览器的情况下，强行修改地址栏的 URL 并产生历史记录。
*   **致命痛点 (404 危机)**：
    *   虽然前端点击跳转时没有发请求，但如果用户在该页面**按下了 F5 手动刷新**，或者直接复制链接发给别人打开。
    *   浏览器此时会老老实实地拿着 `https://www.app.com/user/profile` 这个完整路径去向服务器（Nginx）发起真正的 GET 请求。
    *   服务器上只有前端打包出来的一个 `index.html`，根本没有 `/user/profile` 这个文件夹！服务器必然无情地抛出 **404 Not Found** 报错页面。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>History Router Demo</title>
</head>
<body>
    <h1>History 模式路由</h1>
    <nav>
        <!-- 链接是正常的路径 -->
        <a href="/home" class="link">首页</a>
        <a href="/about" class="link">关于</a>
    </nav>
    <div id="app"></div>

    <script>
        class HistoryRouter {
            constructor() {
                this.routes = {};
                this.bindPopState();
                this.bindLinkClick(); // 拦截 a 标签点击
            }

            // 注册路由
            route(path, callback) {
                this.routes[path] = callback || function() {};
            }

            // 核心：处理路由跳转
            push(path) {
                // 1. 修改浏览器地址栏，但不刷新页面
                window.history.pushState({}, null, path);
                // 2. 手动更新视图
                this.render(path);
            }

            // 监听浏览器的前进/后退
            bindPopState() {
                window.addEventListener('popstate', (e) => {
                    const path = location.pathname;
                    this.render(path);
                });
            }

            // 拦截全局 A 标签点击事件 (为了阻止默认刷新行为)
            bindLinkClick() {
                window.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A' && e.target.classList.contains('link')) {
                        e.preventDefault(); // 阻止 A 标签默认跳转刷新
                        const path = e.target.getAttribute('href');
                        this.push(path); // 使用 API 跳转
                    }
                });
            }

            // 渲染视图
            render(path) {
                if (this.routes[path]) {
                    this.routes[path]();
                } else {
                    document.getElementById('app').innerHTML = '404';
                }
            }
        }

        // --- 使用示例 ---
        const router = new HistoryRouter();
        const app = document.getElementById('app');

        router.route('/home', () => {
            app.innerHTML = '<h2>Home Page (History Mode)</h2>';
        });

        router.route('/about', () => {
            app.innerHTML = '<h2>About Page (History Mode)</h2>';
        });
        
        // 初始化渲染（处理页面刚加载时的情况）
        window.addEventListener('load', () => {
             router.render(location.pathname);
        });
    </script>
</body>
</html>
```

### 1.3 Nginx 兜底配置 (History 模式必配)

为了拯救 History 模式的 404 危机，我们必须赋予 Nginx（或其他服务器）一种“耍赖”的能力：

```nginx
server {
    listen 80;
    server_name www.app.com;

    # 指定前端打包后的 dist 目录
    root /usr/share/nginx/html/dist;
    index index.html;

    location / {
        # 核心魔法在这里！try_files 指令
        # 执行顺序：
        # 1. $uri：先试着找物理硬盘上有没有这个文件（比如你请求 .js 或 .png）
        # 2. $uri/：如果没有文件，找有没有同名文件夹
        # 3. /index.html：如果上面全都没有，耍赖机制启动！不管你请求什么路径，我统统把根目录的 index.html 扔给你！
        try_files $uri $uri/ /index.html;
    }
}
```
**运行机制**：Nginx 把 `index.html` 塞给用户浏览器 -> 浏览器加载里面的 JS -> Vue Router 初始化接管兵权 -> Router 读取当前地址栏的 `/user/profile` -> 在前端映射表中查到对应组件 -> 瞬间渲染出该页面！完美地骗过了浏览器。

## 2. 路由的高阶排兵布阵

### 2.1 动态路由 (Dynamic Routing)
当我们需要渲染同一类型但数据不同的页面时（比如成千上万个用户的详情页），不可能写一万个路由配置。我们需要使用“动态路径参数”。

```js
const routes = [
  // 路径中的冒号 ':' 表示这是一个动态参数，它会被映射到组件内部
  { path: '/user/:id', component: UserDetail },
  // 可以叠加多个参数
  { path: '/article/:category/:articleId', component: ArticleDetail }
]

// --------------------------------------------------
// 在 UserDetail.vue 中获取参数：
import { useRoute } from 'vue-router'
const route = useRoute()

// 访问 /user/9527 时
console.log(route.params.id) // 输出: '9527'
```

### 2.2 嵌套路由 (Nested Routes)
现代企业级应用（如后台管理系统）普遍采用“母子嵌套”结构。外层是一个永远不变的骨架（Header + 侧边栏 Menu），内部是一个巨大的画框，随着左侧菜单点击不断切换内容。

```js
const routes = [
  {
    path: '/dashboard',
    // 1. 父组件 (必须在它的 template 里写一个 <router-view /> 作为画框)
    component: () => import('../layout/MainLayout.vue'),
    // 2. 子路由数组
    children: [
      {
        // 绝对路径：渲染 /dashboard/analytics 时，把 Analytics 组件塞进父组件的画框里
        path: 'analytics', 
        component: () => import('../views/Analytics.vue')
      },
      {
        // 空路径：如果用户只访问了 /dashboard，默认在这个画框里展示 Welcome 组件
        path: '', 
        component: () => import('../views/Welcome.vue')
      }
    ]
  }
]
```

---

## 3. 路由守卫 (Navigation Guards) - 权限校验的核心

路由守卫是构建前端安全防线的最后一道关卡。每一次 URL 发生变化（甚至还没变化），都会严密经过这些保安的检查。

应用中最具含金量、面试中最常被问到的场景就是**基于路由守卫实现的登录拦截与动态权限校验**。

### 3.1 全局前置守卫 (`beforeEach`) 实战：登录拦截模型

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user' // 假设使用了 Pinia

const router = createRouter({ /* ... */ })

/**
 * to: 即将要进入的目标路由对象
 * from: 当前导航正要离开的路由对象
 */
router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  const hasToken = localStorage.getItem('token')

  // 1. 拦截未登录用户
  // to.meta.requiresAuth 是我们在路由表里自定义的标记，表示该页面必须登录才能看
  if (to.meta.requiresAuth && !hasToken) {
    // 强行打回登录页，并用 query 带上它原来想去的地方，方便登录后跳回去
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 2. 拦截已登录用户 (防呆设计)
  // 如果用户已经有 token 了，他还手贱去手动输 URL 访问登录页，直接把他踢回后台首页
  if (to.name === 'login' && hasToken) {
    return { path: '/dashboard' }
  }

  // 3. 高阶权限：动态拉取用户角色与路由表挂载 (略写)
  // if (hasToken && !userStore.hasRoles) {
  //   await userStore.fetchUserInfo();
  //   const asyncRoutes = generateRoutes(userStore.roles);
  //   asyncRoutes.forEach(r => router.addRoute(r)); // 动态挂载权限路由
  //   return { ...to, replace: true }; // 必须中断当前导航重新走一遍，确保新路由生效
  // }

  // 4. 全部绿灯，隐式放行 (相当于调用 next())
  return true 
})
```

*🔥 **Vue 3 守卫演进革命**：在 Vue Router 4 中，官方强烈建议**彻底废弃丑陋且极易引发卡死 BUG 的 `next()` 方法调用**。现在，你只需要返回一个对象（代表重定向）或 `true`/`undefined`（代表放行）或 `false`（代表彻底中止跳转）即可！逻辑极其清爽。*

---

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 动态路由切换时（比如从 `/user/1` 跳转到 `/user/2`），页面为什么毫无反应，生命周期也不执行？
*   **答**：这是 Vue 极其聪明的“组件复用机制”导致的新手大坑。
    *   **原因**：Vue 发现你从 A 页面跳到 B 页面，用的居然是**同一个 Vue 组件文件**（`UserDetail.vue`）。为了榨干性能，它决定**不销毁也不重新创建这个组件**，仅仅在内部更新一下 `route.params.id` 的值。既然不创建，那 `onMounted` 等钩子自然就成了死人。
    *   **终极解法 A (监听)**：在组件内部使用 `watch` 监听参数变化。
        ```js
        import { watch } from 'vue'
        import { useRoute } from 'vue-router'
        const route = useRoute()
        
        watch(() => route.params.id, (newId) => {
          // 在这里重新发起请求获取 id=2 的用户数据
          fetchUserData(newId) 
        }, { immediate: true }) // immediate 保证初次挂载也能执行
        ```
    *   **终极解法 B (暴力拆毁 🌟推荐)**：直接在 `App.vue`（或者嵌套层）的 `<router-view>` 上绑一个跟全路径强相关的 `:key`。
        ```vue
        <!-- 只要路径变了哪怕一丁点，Vue 就会认为它是全新的组件，残忍销毁旧的，重新执行完整的生命周期！ -->
        <router-view :key="$route.fullPath" />
        ```

### 4.2 路由表中 `path` 开头带不带斜杠 `/` 有什么区别？
*   **答**：这在嵌套路由中是致命的细节。
    *   **带斜杠 (`/child`)**：会被当作**绝对路径**。无论你嵌套了多少层，访问它永远是 `app.com/child`。
    *   **不带斜杠 (`child`)**：会被当作**相对路径**。它会自动把所有父级的 path 拼接起来。比如父级是 `/admin`，访问它就是 `app.com/admin/child`。
    *   **避坑指南**：在 `children` 数组里的所有子路由，**强烈建议永远不要带开头的斜杠 `/`**，保持相对嵌套关系，这是最符合直觉的工程规范。

### 4.3 `history` 模式下，Nginx 除了配置 `try_files`，如果是部署在子目录下该怎么办？
*   **答**：如果你的前端项目不是部署在域名的根目录，而是部署在 `https://www.app.com/my-project/` 下，你必须在两处同时动刀：
    1.  **Vue Router 配置修改**：传入基础路径给 History 引擎。
        ```js
        const router = createRouter({
          // 传入基础路径！
          history: createWebHistory('/my-project/'),
          routes
        })
        ```
    2.  **Nginx 配置修改**：`try_files` 的兜底路径必须精准指向子目录里的 html。
        ```nginx
        location /my-project {
            alias /usr/share/nginx/html; # 或者用 root 根据实际物理路径搭配
            index index.html;
            # 核心：找不到时扔给这个子目录的 index.html
            try_files $uri $uri/ /my-project/index.html; 
        }
        ```
