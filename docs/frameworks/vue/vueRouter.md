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

*   **`<router-link>`**: 相当于超级 `<a>` 标签。它用于创建导航链接。相比原生的 `<a>` 标签，`<router-link>` 能够正确地被 Vue Router 拦截，**防止页面重新加载**，并在对应的路由处于激活状态时，自动为其添加 active 的 CSS 类名。
*   **`<router-view>`**: 这是一个占位符组件。当 URL 发生变化时，Vue Router 会查找路由配置，找到与当前 URL 匹配的组件，并**将其渲染在这个坑位中**。

### 2.1 基础路由配置

在 Vue 3 中，我们使用 `createRouter` 函数来创建一个 router 实例，并使用 `createWebHistory` 或 `createWebHashHistory` 来指定历史记录模式。

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// 1. 定义路由表 (Routes)
const routes = [
  {
    path: '/',
    name: 'home',      // 命名路由：推荐使用 name 进行跳转，避免硬编码路径
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // 🚀 路由级代码分割 (懒加载)
    // 这将生成一个单独的 chunk (如 about.[hash].js)，仅在访问该路由时加载
    component: () => import('../views/AboutView.vue')
  }
]

// 2. 创建 router 实例
const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
```

### 2.2 动态路由与路由参数

很多时候，我们需要将匹配特定模式的 URL 映射到同一个组件。例如，一个用于展示用户资料的组件 `User.vue`，应该能同时处理 `/user/alice` 和 `/user/bob`。

**定义动态参数**

在路由的 `path` 中，使用冒号 `:` 开头的片段来定义动态参数。

```javascript
const routes = [
  // 动态段以冒号开始
  { path: '/user/:id', component: () => import('../views/User.vue') }
]
```

**获取动态参数**

当路由被匹配时，URL 中对应动态参数的值会被存储在 `$route.params` (或组合式 API 中的 `route.params`) 对象中。

```vue
<!-- User.vue -->
<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()

// 访问 /user/123 时，route.params.id 的值为 '123'
console.log('当前用户 ID:', route.params.id)
</script>

<template>
  <div>User ID: {{ route.params.id }}</div>
</template>
```

### 2.3 嵌套路由 (Nested Routes)

真实的应用程序通常由多层嵌套的组件组合而成。URL 中各段动态路径也往往对应着某种嵌套的组件结构。

例如，在一个后台管理系统中，你可能有一个包含侧边栏的主布局，而右侧的内容区域需要根据 URL 动态切换。

```javascript
const routes = [
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'), // 外层布局组件
    children: [ // 子路由
      {
        // 匹配 /admin/dashboard
        // 注意：子路由的 path 不要以 '/' 开头
        path: 'dashboard', 
        component: () => import('../views/Dashboard.vue')
      },
      {
        // 匹配 /admin/settings
        path: 'settings',
        component: () => import('../views/Settings.vue')
      }
    ]
  }
]
```

**关键：** 外层组件（如 `AdminLayout.vue`）的模板中必须包含自己的 `<router-view>`，用于渲染匹配到的子组件。

```vue
<!-- AdminLayout.vue -->
<template>
  <div class="admin-container">
    <aside>侧边栏导航</aside>
    <main>
      <!-- 子路由对应的组件将渲染在这里 -->
      <router-view></router-view> 
    </main>
  </div>
</template>
```

### 2.4 命名路由

当创建一个路由时，我们可以选择给路由一个 `name`：

```js{4}
const routes = [
  {
    path: '/user/:username',
    name: 'profile', 
    component: User,
  },
]
```

然后我们可以使用 `name` 而不是 `path` 来传递 `to` 属性给 `<router-link>`：

```vue
<router-link :to="{ name: 'profile', params: { username: 'erina' } }">
  User profile
</router-link>
```

### 2.5 编程式导航

除了使用 `<router-link>` 进行声明式导航外，我们还可以使用 JavaScript 编程式地进行跳转。

在 Vue 3 (Composition API) 中，使用 `useRouter`：

```vue
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goToProfile(userId) {
  // 1. 字符串路径
  // router.push(`/user/${userId}`)

  // 2. 带有路径的对象
  // router.push({ path: `/user/${userId}` })

  // 3. 命名路由 + params (推荐做法！更加健壮)
  router.push({ name: 'user', params: { id: userId } })

  // 4. 带查询参数，变成 /user/123?plan=premium
  // router.push({ name: 'user', params: { id: userId }, query: { plan: 'premium' } })

  // 5. 替换当前位置 它的作用类似于 router.push，唯一不同的是，它在导航时不会向 history 添加新记录
  router.push({ path: '/home', replace: true })
  // 相当于
  router.replace({ path: '/home' })
}
</script>
```

**横跨历史**

````js
// 向前移动一条记录，与 router.forward() 相同
router.go(1)

// 返回一条记录，与 router.back() 相同
router.go(-1)

// 前进 3 条记录
router.go(3)

// 如果没有那么多记录，静默失败
router.go(-100)
router.go(100)
````

### 2.6 重定向和别名

重定向也是通过 `routes` 配置来完成，下面例子是从 `/home` 重定向到 `/`：

```js
const routes = [{ path: '/home', redirect: '/' }]
```

重定向的目标也可以是一个命名的路由：

```js
const routes = [{ path: '/home', redirect: { name: 'homepage' } }]
```

甚至是一个方法，动态返回重定向目标：

```js
const routes = [
  {
    // /search/screens -> /search?q=screens
    path: '/search/:searchText',
    redirect: to => {
      // 方法接收目标路由作为参数
      // return 重定向的字符串路径/路径对象
      return { path: '/search', query: { q: to.params.searchText } }
    },
  },
  {
    path: '/search',
    // ...
  },
]
```

**相对重定向**

```js
const routes = [
  {
    // 将总是把/users/123/posts重定向到/users/123/profile。
    path: '/users/:id/posts',
    redirect: to => {
      // 该函数接收目标路由作为参数
      return to.path.replace(/posts$/, 'profile')
    },
  },
]
```

**别名**

将 `/` 别名为 `/home`，意味着当用户访问 `/home` 时，`URL` 仍然是 `/home`，但会被匹配为用户正在访问 `/`。

```js
const routes = [{ path: '/', component: Homepage, alias: '/home' }]
```

通过别名，你可以自由地将 `UI` 结构映射到一个任意的 `URL`，而不受配置的嵌套结构的限制。使别名以 / 开头，以使嵌套路径中的路径成为绝对路径。你甚至可以将两者结合起来，用一个数组提供多个别名：

```js
const routes = [
  {
    path: '/users',
    component: UsersLayout,
    children: [
      // 为这 3 个 URL 呈现 UserList
      // - /users
      // - /users/list
      // - /people
      { path: '', component: UserList, alias: ['/people', 'list'] },
    ],
  },
]
```

如果你的路由有参数，请确保在任何绝对别名中包含它们：

```js
const routes = [
  {
    path: '/users/:id',
    component: UsersByIdLayout,
    children: [
      // 为这 3 个 URL 呈现 UserDetails
      // - /users/24
      // - /users/24/profile
      // - /24
      { path: 'profile', component: UserDetails, alias: ['/:id', ''] },
    ],
  },
]
```

### 2.7 **将 `props` 传递给路由组件**

通过设置 `props: true` 来配置路由将 `id` 参数作为 `prop` 传递给组件,当 `props` 设置为 `true` 时，`route.params` 将被设置为组件的 `props`。

```js
const routes = [{ path: '/user/:id', component: User, props: true }]
```

**命名视图**

对于有命名视图的路由，你必须为每个命名视图定义 `props` 配置：

```js   
const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false },
  },
]
```

**对象模式**

当 `props` 是一个对象时，它将原样设置为组件 `props`。当 `props` 是静态的时候很有用。

```js
const routes = [
  {
    path: '/promotion/from-newsletter',
    component: Promotion,
    props: { newsletterPopup: false },
  },
]
```

**函数模式**

你可以创建一个返回 `props` 的函数。这允许你将参数转换为其他类型，将静态值与基于路由的值相结合等等。

```js
const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q }),
  },
]
```

`URL /search?q=vue` 将传递 `{query: 'vue'}` 作为 `props` 传给 `SearchUser` 组件。

### 2.8 路由元信息

```js
const routes = [
  {
    path: '/posts',
    component: PostsLayout,
    children: [
      {
        path: 'new',
        component: PostsNew,
        // 只有经过身份验证的用户才能创建帖子
        meta: { requiresAuth: true },
      },
      {
        path: ':id',
        component: PostsDetail,
        // 任何人都可以阅读文章
        meta: { requiresAuth: false },
      },
    ],
  },
]
```

一个路由匹配到的所有路由记录会暴露为 `route` 对象(还有在导航守卫中的路由对象)的`route.matched` 数组。

```js
router.beforeEach((to, from) => {
  // 而不是去检查每条路由记录
  // to.matched.some(record => record.meta.requiresAuth)
  if (to.meta.requiresAuth && !auth.isLoggedIn()) {
    // 此路由需要授权，请检查是否已登录
    // 如果没有，则重定向到登录页面
    return {
      path: '/login',
      // 保存我们所在的位置，以便以后再来
      query: { redirect: to.fullPath },
    }
  }
})
```

### 2.9  **`RouterView` 插槽**

`RouterView` 组件暴露了一个插槽，可以用来渲染路由组件：

```vue
<router-view v-slot="{ Component }">
  <component :is="Component" />
</router-view>
```

**`KeepAlive & Transition`**

当在处理 `KeepAlive` 组件时，我们通常想要保持路由组件活跃，而不是 `RouterView` 本身

```vue
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
```

插槽允许我们使用一个 `Transition` 组件来实现在路由组件之间切换时实现过渡效果：

```vue
<router-view v-slot="{ Component }">
  <transition>
    <component :is="Component" />
  </transition>
</router-view>
```

我们也可以在 `Transition` 组件内使用 `KeepAlive` 组件：

```vue
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

**传递 `props` 和插槽**

```vue
<router-view v-slot="{ Component }">
    <component :is="Component" some-prop="a value">
    <p>Some slotted content</p>
</component>
</router-view>
```

**模板引用**

使用插槽可以让我们直接将模板引用放置在路由组件上：

```vue
<router-view v-slot="{ Component }">
  <component :is="Component" ref="mainContent" />
</router-view>
```

### 2.10 滚动行为

当创建一个 `Router` 实例，你可以提供一个 `scrollBehavior` 方法。

`scrollBehavior` 函数接收 `to`和`from` 路由对象，如 `Navigation Guards`。第三个参数 `savedPosition`，只有当这是一个 `popstate` 导航时才可用（由浏览器的后退/前进按钮触发）。

```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
  scrollBehavior (to, from, savedPosition) {
      // 始终滚动到顶部
      return { top: 0 }
  }
})
```

### 2.11 路由懒加载

当打包构建应用时，`JavaScript` 包会变得非常大，影响页面加载。如果我们能把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件，这样就会更加高效。

```js
// import UserDetails from './views/UserDetails.vue'
// 替换成
const UserDetails = () => import('./views/UserDetails.vue')

const router = createRouter({
  // ...
  routes: [
    { path: '/users/:id', component: UserDetails }
    // 或在路由定义里直接使用它
    { path: '/users/:id', component: () => import('./views/UserDetails.vue') },
  ],
})
```

## 3. 导航守卫 (Navigation Guards)

Vue Router 提供了极其细粒度的守卫拦截点，按照“管辖范围”可以分为三大类：**全局守卫、路由独享守卫、组件内守卫**。

### 3.1 全局守卫 (Global Guards)
挂载在 `router` 实例上，**只要发生任何路由跳转，都必定会触发。**

*  **`router.beforeEach(to, from)`**：**全局前置守卫**。绝大多数的登录拦截、权限校验都在这里完成。
```js
router.beforeEach(async (to, from) => {
  // canUserAccess() 返回 `true` 或 `false`
  const canAccess = await canUserAccess(to)
  if (!canAccess) return '/login'
})
```

*  **`router.beforeResolve(to, from)`**：**全局解析守卫**。和 `beforeEach` 类似，区别在于它是在所有组件内守卫和异步路由组件被解析完之后，导航被确认之前触发。（常用于确保页面所有异步依赖都拉取完毕）。

```js
router.beforeResolve(async to => {
  if (to.meta.requiresCamera) {
    try {
      await askForCameraPermission()
    } catch (error) {
      if (error instanceof NotAllowedError) {
        // ... 处理错误，然后取消导航
        return false
      } else {
        // 意料之外的错误，取消导航并把错误传给全局处理器
        throw error
      }
    }
  }
})
```

*  **`router.afterEach(to, from)`**：**全局后置钩子**。**这里没有 `next` 或 `return false` 拦截权限**，因为跳转此时已经成为既定事实。常用于关闭全局 Loading、发送页面浏览埋点 (PV)。

```js
//failure导航故障 
// Navigation Failure 是带有一些额外属性的 Error 实例，
// 这些属性为我们提供了足够的信息，让我们知道哪些导航被阻止了以及为什么被阻止了。
router.afterEach((to, from, failure) => {
    if (!failure) sendToAnalytics(to.fullPath)
})
```

### 3.2 路由独享守卫 (Per-Route Guard)
直接配置在路由表 (`routes` 数组) 某个特定的路由对象内部。

*   **`beforeEnter: (to, from) => {}`**：**只在进入该特定路由时触发一次**。如果你的应用极其庞大，不想把所有拦截逻辑都塞进臃肿的全局 `beforeEach` 中，就可以把它下放到单独的路由配置里。

```js
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: (to, from) => {
      // reject the navigation
      return false
    },
  },
]
```

### 3.3 组件内守卫 (In-Component Guards)
写在 Vue 组件文件内部的守卫，用于处理与该组件强相关的跳转逻辑。在 `<script setup>` 中，需要通过特定 API 引入。

1.  **`onBeforeRouteLeave`**：**离开守卫**。用户准备离开当前组件页面时触发。**防手抖神器**，常用于阻断用户意外离开未保存的表单。
2.  **`onBeforeRouteUpdate`**：**更新守卫**。在当前路由改变，但**该组件被复用时触发**。比如从 `/user/1` 跳转到 `/user/2`，由于组件没被销毁重建，你需要在这个守卫里监听变化并重新发起请求。

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { ref } from 'vue'

// 与 beforeRouteLeave 相同，无法访问 `this`
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm(
    'Do you really want to leave? you have unsaved changes!'
  )
  // 取消导航并停留在同一页面上
  if (!answer) return false
})

const userData = ref()

// 与 beforeRouteUpdate 相同，无法访问 `this`
onBeforeRouteUpdate(async (to, from) => {
  //仅当 id 更改时才获取用户，例如仅 query 或 hash 值已更改
  if (to.params.id !== from.params.id) {
    userData.value = await fetchUser(to.params.id)
  }
})
</script>
```

### 3.4 完整的导航解析解析流程 (面试必背)

当用户点击一个链接，试图从 A 页面跳到 B 页面时，Vue Router 的内部校验就像一台精密的齿轮，严格按照以下 10 步顺序执行。掌握它，你就能解决 99% 的时序 Bug。

1.  导航被触发。
2.  在失活的组件（页面 A）里调用 **`beforeRouteLeave`** 守卫。
3.  调用全局的 **`router.beforeEach`** 守卫。
4.  在重用的组件里调用 **`beforeRouteUpdate`** 守卫 (如果组件是复用的)。
5.  在路由配置里调用独享的 **`beforeEnter`**。
6.  解析异步路由组件 (利用 Webpack/Vite 动态下载代码包)。
7.  在被激活的组件（页面 B）里调用 **`beforeRouteEnter`**。*(注：在 script setup 中无法直接使用，因为它触发时组件实例还没创建，只能使用 Options API)*。
8.  调用全局的 **`router.beforeResolve`** 守卫。
9.  **导航正式被确认 (此时 URL 物理变化)。**
10. 调用全局的 **`router.afterEach`** 钩子。
11. 触发 DOM 更新。

### 3.5 现代返回值控制法 (Vue 3 范式)

在早期的 Vue Router 中，我们极度依赖第三个参数 `next` 函数。**在 Vue Router 4 中，官方极其严厉地建议：抛弃 `next`，全面拥抱基于 `return` 的声明式控制。**

守卫函数可以返回以下四种结果：

*   **`return false`**：物理阻断。取消当前的导航。如果浏览器的 URL 变了（比如用户手动修改了地址），URL 会重置到 `from` 路由对应的地址。
*   **`return { name: 'Login' }` 或 `return '/login'`**：重定向。阻断当前导航，强行将用户踢往另一个指定的地址。
*   **`return true` 或 `return undefined` (什么都不写自然结束)**：绿灯放行。允许进入目标页面。
*   **`throw new Error(...)`**：如果抛出一个异常，导航会被取消并抛出该错误，可由 `router.onError()` 统一捕获处理。

### 3.6 全局拦截：动态权限与登录校验

```javascript
import router from './router'
import { useUserStore } from '@/store/user'

router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  
  // 1. 检查目标路由是否标记了需要鉴权
  // to.meta.requiresAuth 是在路由表中自定义的字段
  if (to.meta.requiresAuth) {
    
    // 2. 检查用户是否已登录 (例如内存中是否有 token 或用户信息)
    if (!userStore.isAuthenticated) {
      
      // 3. 拦截！踢回登录页，并使用 query 带上他原本想去的路径
      // 这样他登录成功后，系统就能智能地帮他跳回这个页面
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }
  }
  
  // 全部校验通过，隐式 return undefined，绿灯放行
})
```

### 3.7 组件内离开拦截：防丢失表单

```vue
<!-- UserEditForm.vue -->
<script setup>
import { ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const isDataSaved = ref(false)
const hasUnsavedChanges = ref(true)

// 当用户填了一半表单，手贱点击了顶部的其他菜单时触发
onBeforeRouteLeave((to, from) => {
  // 如果数据没保存，且确实有改动
  if (!isDataSaved.value && hasUnsavedChanges.value) {
    const answer = window.confirm('您的表单尚未保存，确定要离开吗？更改将会丢失。')
    
    if (!answer) {
      // 用户点击了取消，阻断导航，把它留在当前页面
      return false
    }
  }
  // 用户点击了确定，或者数据已经保存了，允许离开
  return true
})
</script>
```


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
    *   **终极解法C**:在组件内部引入并使用 onBeforeRouteUpdate 守卫，在这个钩子里获取最新的 to.params.id 并重新发起请求。
            
        ```vue
        <script setup>
        import { onBeforeRouteUpdate } from 'vue-router'
        // 与 beforeRouteUpdate 相同，无法访问 `this`
        onBeforeRouteUpdate(async (to, from) => {
          //仅当 id 更改时才获取用户，例如仅 query 或 hash 值已更改
          if (to.params.id !== from.params.id) {
            userData.value = await fetchUser(to.params.id)
          }
        })
        </script>
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
### 4.4 为什么我使用 `router.push({ name: 'user', params: { data: myData } })` 传递非路径参数，刷新页面后参数就变成了 `undefined`？
*   **原因**: 从 Vue Router 4.1.4 开始，**官方正式废弃并移除了未在 `path` 中明确定义的隐式 `params` 传递**。也就是说，如果你的路由是 `path: '/user'`，你不能指望把一个对象隐藏在 `params` 里通过路由传给下一个页面。这种数据存储在内存中，一旦刷新页面内存清空，数据立刻丢失。
*   **正确做法**:
    1.  如果参数应该出现在 URL 中（可分享、刷新不丢），请配置动态路径参数（`path: '/user/:id'`）或者使用 URL 查询参数（`query: { id: 123 }`）。
    2.  如果传递的是不需要展示在 URL 中的大型对象或敏感状态，**必须使用全局状态管理（如 Pinia / Vuex）**。

### 4.5 `router-link` 的 `active-class` 是怎么匹配的？
*   **原理**: 当你浏览当前页面时，如果该页面的路径与 `<router-link>` 指定的 `to` 路径**部分匹配或完全匹配**，Vue Router 会自动为该链接添加 CSS 类名。默认类名是 `router-link-active`（部分匹配）和 `router-link-exact-active`（完全精确匹配）。
*   **坑点**: 如果你有一个回到首页的链接 `<router-link to="/">`，因为所有的路径（如 `/about`）都以 `/` 开头，它会导致首页链接永远处于 active 高亮状态。
*   **解决**: 你可以通过添加 `exact` 属性（Vue Router 3）或在 CSS 中严格针对 `router-link-exact-active` 类编写样式，或者在代码中精确控制，使其仅在绝对匹配根路径时才高亮。
```js
<RouterLink
  activeClass="router-link-exact-active"
  exactActiveClass="border-indigo-700"
>
```

默认的类名也可以通过传递 `linkActiveClass` 和 `linkExactActiveClass` 选项给 `createRouter()` 来全局更改：

```js
const router = createRouter({
  linkActiveClass: 'border-indigo-500',
  linkExactActiveClass: 'border-indigo-700',
  // ...
})
```


### 4.6 为什么我的 `beforeEach` 陷入了无限死循环 (Maximum call stack size exceeded)？
*   **答**：这是新手配置路由守卫时 100% 会遇到的坑。
    *   **原因**：你写了 `if (!token) return '/login'`。当用户没有 token 时，系统将其重定向到 `/login`。**但是，去往 `/login` 的这个跳转动作，又会重新触发一次全局的 `beforeEach`！**
    *   此时系统再次检查，发现还是没有 token，于是再次重定向到 `/login`…… 从而引发光速的无限死循环。
    *   **避坑指南**：**在重定向时，必须对“目标页面本身就是免鉴权页面”做排除处理！**
    ```javascript
    router.beforeEach((to) => {
      // 🚨 防呆设计：如果他没登录，且他去的本来就是登录页，绝对要放行！
      if (!token && to.name !== 'login') {
        return { name: 'login' }
      }
    })
    ```

### 4.7 在 `<script setup>` 中怎么使用 `beforeRouteEnter`？
*   **答**：**不能使用。这是物理限制。**
    *   `beforeRouteEnter` 守卫在导航确认前被调用，因此**它执行时，即将登场的新组件连实例化（生成 `this` 和执行 `setup`）都还没开始！**
    *   既然 `setup` 还没执行，你自然无法在 `<script setup>` 的代码块里去声明这个钩子。
    *   **替代方案**：如果你实在需要在进入组件前发请求，请将请求逻辑前置到**路由独享守卫 `beforeEnter`** 或全局的 `beforeResolve` 中。如果纯粹为了拿数据，不如直接在 `setup()` 同步代码里尽早发请求，或者拥抱 `<Suspense>` 顶层 `await` 架构。
