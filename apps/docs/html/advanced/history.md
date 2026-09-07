# HTML5 History API（历史记录 API）

History API 允许开发者在**不刷新页面**的情况下修改浏览器地址栏的 URL，并管理浏览器的历史记录栈（Session History）。它是现代单页应用（SPA）实现前端路由（如 Vue Router、React Router）的**核心底层技术**。

简单说：**URL 变了，页面没刷新，但历史栈、前进/后退按钮都正常工作。**

## 1. 核心属性与方法

所有 API 都挂载在 **`window.history`** 对象上。

### 1.1 修改历史记录（不刷新页面）

这两个方法是 SPA 路由的核心。它们**只改变 URL 和历史栈**，**绝不会**触发页面刷新或跳转。

| 方法                 | 语法                                      | 描述                                                                              |
| :------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------- |
| **`pushState()`**    | `history.pushState(state, title, url)`    | **新增一条记录**。地址栏 URL 改变，历史栈长度 +1，「前进/后退」按钮可用。         |
| **`replaceState()`** | `history.replaceState(state, title, url)` | **替换当前记录**。地址栏 URL 改变，但历史栈长度不变（后退无法回到刚才那个 URL）。 |

**参数详解：**

| 参数        | 类型             | 说明                                                                                           |
| :---------- | :--------------- | :--------------------------------------------------------------------------------------------- |
| **`state`** | 任意可序列化对象 | 与新历史记录绑定的状态对象。用户点后退/前进时，可通过 `event.state` 取回。                     |
| **`title`** | String           | 页面标题。**目前所有主流浏览器（Chrome/Firefox/Safari）都忽略此参数**，建议传 `""` 或 `null`。 |
| **`url`**   | String           | 新的 URL。**必须与当前页面同源**（同协议、同域名、同端口），否则抛 `SecurityError`。           |

**URL 的取值规则：**

```js
history.pushState({}, '', '/home') // ✅ 绝对路径（同源）
history.pushState({}, '', 'about') // ✅ 相对路径（基于当前路径解析）
history.pushState({}, '', '?page=2') // ✅ 修改查询参数
history.pushState({}, '', '#section') // ✅ 仅修改 hash

history.pushState({}, '', 'https://evil.com') // ❌ 跨域，抛 SecurityError
```

> **关键约束**：`url` 的**源（协议+域名+端口）必须与当前页面一致**，但**路径、查询参数、hash 可以任意修改**。跨域会直接抛出异常。

### 1.2 导航与移动（Navigation）

这些方法等同于用户点击了浏览器的前进/后退按钮。

| 方法            | 语法                | 描述                                             | 等价操作                 |
| :-------------- | :------------------ | :----------------------------------------------- | :----------------------- |
| **`back()`**    | `history.back()`    | 后退一页。                                       | 点击浏览器「后退」按钮。 |
| **`forward()`** | `history.forward()` | 前进一页。                                       | 点击浏览器「前进」按钮。 |
| **`go()`**      | `history.go(n)`     | 移动 n 页：`-1` 后退、`1` 前进、`0` 刷新当前页。 | `go(-1)` = `back()`      |

### 1.3 属性（Properties）

| 属性                    | 描述                                                                                                       |
| :---------------------- | :--------------------------------------------------------------------------------------------------------- |
| **`length`**            | 历史栈中的记录数量（只读，无法重置）。                                                                     |
| **`state`**             | 当前历史记录绑定的状态对象（即 `pushState` 第一个参数存入的值）。初始加载时（未 pushState）为 `null`。     |
| **`scrollRestoration`** | 滚动恢复行为：`auto`（默认，浏览器自动恢复滚动位置）/ `manual`（开发者手动控制，常用于无限滚动列表优化）。 |

## 2. 核心事件

### 2.1 `popstate` 事件

当「活动的历史记录条目发生变化」时触发，典型场景是用户**在历史栈中前进/后退**。

**触发时机：**

| 操作                                          |   是否触发 `popstate`   |
| :-------------------------------------------- | :---------------------: |
| 点击浏览器「后退 / 前进」按钮                 |           ✅            |
| 调用 `history.back()` / `forward()` / `go()`  |           ✅            |
| 调用 `history.pushState()` / `replaceState()` |      ❌ **不触发**      |
| 修改 `location.hash` / 点击 `#` 链接          | ❌（触发 `hashchange`） |

```js
window.addEventListener('popstate', event => {
  console.log('URL 变了！用户点击了前进/后退')
  console.log('之前存的状态数据:', event.state) // 即 pushState 时传入的 state

  // 在这里编写路由逻辑：根据 location.pathname 渲染对应组件
})
```

> **兼容性坑**：部分浏览器（尤其是旧版 Firefox）在**页面加载时也会触发一次 `popstate`**，可能导致首次进入就误执行路由逻辑。建议在初始化时用一个标志位过滤掉这次「虚假触发」。

### 2.2 `hashchange` 事件

当 URL 中 `#` 后面的部分（fragment）发生变化时触发。这是 **Hash 模式路由**的核心事件。

```js
window.addEventListener('hashchange', event => {
  console.log('旧 URL:', event.oldURL)
  console.log('新 URL:', event.newURL)
  console.log('当前 hash:', location.hash)
})
```

## 3. 深入理解

### 3.1 修改 URL 的几种方式对比

| 方式                                          | 是否刷新页面 | 历史栈变化 | 能否后退 | 触发事件                  |
| :-------------------------------------------- | :----------: | :--------: | :------: | :------------------------ |
| `history.pushState(...)`                      |  ❌ 不刷新   |  新增一条  |    ✅    | 无（需手动更新视图）      |
| `history.replaceState(...)`                   |  ❌ 不刷新   | 替换当前条 |    ❌    | 无（需手动更新视图）      |
| `location.href = '...'` / `location.assign()` |   ✅ 刷新    |  新增一条  |    ✅    | `beforeunload` / `unload` |
| `location.replace('...')`                     |   ✅ 刷新    | 替换当前条 |    ❌    | `beforeunload` / `unload` |
| `location.hash = '...'`                       |  ❌ 不刷新   |  新增一条  |    ✅    | `hashchange`              |

> 记忆口诀：**带 `State` 的不刷新、要手动渲染；带 `location.` 的会真跳转。**

### 3.2 `state` 对象与结构化克隆

`pushState` 的 `state` 参数会被浏览器用**结构化克隆（Structured Clone）算法**序列化后存在磁盘上（随会话历史持久化），因此：

- **支持**：普通对象/数组、`Date`、`Map`、`Set`、`ArrayBuffer`、TypedArray 等。
- **不支持**：函数、`Symbol`、DOM 节点、含循环引用的对象（会抛 `DataCloneError`）。
- **跨刷新保留**：`pushState` 后即使 F5 刷新，浏览器也会**自动恢复** `history.state`，因此 `history.state` 刷新后仍然有值。

```js
history.pushState({ id: 1, from: 'list' }, '', '/detail/1')
// 用户点击后退后，在 popstate 里取回：
window.addEventListener('popstate', e => {
  console.log(e.state) // { id: 1, from: 'list' }
})
```

### 3.3 `scrollRestoration` 详解

**场景**：用户在无限滚动列表页往下滚了很久 → 点进详情页 → 点「后退」。浏览器默认（`auto`）会自动滚动回之前的位置。但如果列表是 **JS 动态渲染**的，数据还没加载回来，浏览器滚动就会失败或乱跳。

```js
// 关闭自动恢复，完全由 JS 接管
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

// 在 popstate 中，等数据加载完再手动滚动
window.addEventListener('popstate', async () => {
  await loadListData() // 先渲染出完整列表
  window.scrollTo(0, savedPosition) // 再滚回目标位置
})
```

## 4. 实战：实现前端路由（SPA）

前端路由的核心原理：**改变 URL，不刷新页面，同时根据 URL 渲染对应视图**。下面分别用原生 JS 手写 **Hash 模式** 和 **History 模式** 路由。

### 4.1 Hash 模式路由实现

**原理：**

- URL 中 `#` 后面的内容称为 Hash。
- 修改 Hash **不会**触发页面刷新，且 `#` 后的内容**不会发送给服务器**。
- 浏览器提供 `hashchange` 事件，Hash 变化时触发。
- 页面加载时触发 `load` 事件，用于首次渲染。

**实现代码：**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
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
          this.routes = {} // 路由配置：path -> callback
          this.currentUrl = '' // 当前路由 URL

          this.refresh = this.refresh.bind(this)

          window.addEventListener('load', this.refresh) // 首次进入
          window.addEventListener('hashchange', this.refresh) // Hash 变化
        }

        // 注册路由
        route(path, callback) {
          this.routes[path] = callback || function () {}
        }

        // 刷新视图（核心逻辑）
        refresh() {
          // 获取当前 hash，去掉 #；没有 hash 默认为 /
          this.currentUrl = location.hash.slice(1) || '/'

          if (this.routes[this.currentUrl]) {
            this.routes[this.currentUrl]()
          } else {
            document.getElementById('app').innerHTML = '404'
          }
        }
      }

      const router = new HashRouter()
      const app = document.getElementById('app')

      router.route('/home', () => (app.innerHTML = '<h2>我是首页内容</h2>'))
      router.route('/about', () => (app.innerHTML = '<h2>我是关于页面</h2>'))
    </script>
  </body>
</html>
```

### 4.2 History 模式路由实现

**原理：**

- 利用 `history.pushState()` / `replaceState()` 修改 URL，这两个 API **不会**触发页面刷新。
- 浏览器前进/后退触发 `popstate` 事件。
- **难点**：`pushState` / `replaceState` **不会**触发 `popstate`，所以需要**手动拦截链接点击**，或封装自定义的跳转方法来更新视图。

**实现代码：**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
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
          this.routes = {}
          this.bindPopState() // 监听前进/后退
          this.bindLinkClick() // 拦截 a 标签点击
        }

        route(path, callback) {
          this.routes[path] = callback || function () {}
        }

        // 核心：路由跳转
        push(path) {
          // 1. 改地址栏，但不刷新页面
          window.history.pushState({}, null, path)
          // 2. 手动更新视图
          this.render(path)
        }

        // 监听浏览器前进/后退
        bindPopState() {
          window.addEventListener('popstate', () => {
            this.render(location.pathname)
          })
        }

        // 拦截 a 标签点击（阻止默认刷新跳转）
        bindLinkClick() {
          window.addEventListener('click', e => {
            if (
              e.target.tagName === 'A' &&
              e.target.classList.contains('link')
            ) {
              e.preventDefault() // 阻止 a 标签默认跳转
              const path = e.target.getAttribute('href')
              this.push(path) // 走 pushState
            }
          })
        }

        render(path) {
          if (this.routes[path]) {
            this.routes[path]()
          } else {
            document.getElementById('app').innerHTML = '404'
          }
        }
      }

      const router = new HistoryRouter()
      const app = document.getElementById('app')

      router.route('/home', () => (app.innerHTML = '<h2>Home Page</h2>'))
      router.route('/about', () => (app.innerHTML = '<h2>About Page</h2>'))

      // 初始化渲染（处理页面刚加载时的情况）
      window.addEventListener('load', () => router.render(location.pathname))
    </script>
  </body>
</html>
```

## 5. 常见问题（FAQ）与避坑指南

### 5.1 为什么 `pushState` 后页面没有变化？

**正常现象。** `pushState` / `replaceState` 只是修改了地址栏字符串和历史栈，**既不加载新页面，也不触发 `popstate`**。你必须手动调用渲染函数更新页面内容。

```js
function navigate(path) {
  history.pushState({}, '', path) // 只改 URL
  render(path) // 必须手动渲染！
}
```

### 5.2 刷新页面报 404 错误？

**场景**：用 `pushState` 跳到了 `/user/123`，一切正常。但按 F5 刷新、或把链接发给朋友直接打开，服务器返回 **404 Not Found**。

**原因**：刷新时浏览器真的向服务器请求了 `/user/123` 这个路径，但服务器上只有 `index.html`，没有 `user/123` 这个目录或文件。

**解法**：后端配置（Nginx / Apache）——凡找不到文件的请求，统一返回 `index.html`，交给前端 JS 解析 URL 并渲染。

```nginx
# Nginx 配置示例
location / {
  try_files $uri $uri/ /index.html;
}
```

```apache
# Apache (.htaccess) 配置示例
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

> **子路径部署注意**：若应用部署在子路径下（如 `example.com/app/`，Vite 的 `base` 或 Webpack 的 `publicPath` 设为 `/app/`），上面的 fallback 路径也要相应改为 `/app/index.html`，否则刷新依旧 404。

### 5.3 `state` 对象有多大限制？

- `state` 对象会被**序列化**存储在用户磁盘上（随会话历史持久化）。
- 多数浏览器限制在 **640KB ~ 数 MB** 之间（各浏览器不同，Safari 约为 640KB 更严格）。
- **不要存大数据**，只存 ID 或简单的页面状态（如 `{ id: 1, from: 'list' }`），否则可能抛异常或拖慢性能。

### 5.4 怎么监听 `pushState` 事件？

原生**没有** `pushstate` 事件。若想在 `pushState` 被调用时收到通知（如埋点统计），需要**重写（Monkey Patch）原生方法**：

```js
const originalPushState = history.pushState
history.pushState = function (state, title, url) {
  // 1. 先执行原生逻辑
  const result = originalPushState.apply(this, arguments)

  // 2. 派发自定义事件
  const event = new Event('pushstate')
  event.state = state
  event.url = url
  window.dispatchEvent(event)

  return result
}

// 现在可以监听了
window.addEventListener('pushstate', e => {
  console.log('路由跳转了:', e.url)
})
```

### 5.5 Hash 模式（`#`）和 History 模式的区别？

| 维度         | Hash 模式（`example.com/#/home`）       | History 模式（`example.com/home`）     |
| :----------- | :-------------------------------------- | :------------------------------------- |
| **实现方式** | 监听 `hashchange`                       | 使用 History API + 监听 `popstate`     |
| **URL 美观** | ❌ 带 `#`，较丑                         | ✅ 干净美观，符合标准                  |
| **后端配置** | ✅ **不需要**（`#` 后内容不发往服务器） | ❌ **必须配置** fallback，否则刷新 404 |
| **兼容性**   | ✅ 极好（IE8+，甚至老浏览器）           | ✅ 现代浏览器均支持                    |
| **SEO**      | ❌ `#` 内容通常不被搜索引擎收录         | ✅ 更利于 SEO（配合 SSR / 预渲染）     |

### 5.6 `popstate` 会在页面加载时触发吗？

**大部分现代浏览器不会**，但**部分浏览器（尤其旧版 Firefox）会**在页面加载时触发一次 `popstate`，`event.state` 为 `null`，这会导致首次进入页面就误执行一次路由渲染。

**解法**：初始化时加标志位过滤：

```js
let isInit = true
window.addEventListener('popstate', e => {
  if (isInit) {
    isInit = false
    return // 跳过加载时的那次虚假触发
  }
  render(location.pathname)
})
```

### 5.7 为什么 `history.state` 首次加载是 `null`，刷新后却有值？

- **首次进入页面**（还没调用过 `pushState`）时，当前历史条目没有绑定 state，所以 `history.state === null`。
- 一旦 `pushState` 存了 state，浏览器会**随历史记录持久化**这个对象，F5 刷新后 `history.state` 依然能读回。

利用这一点，可在刷新后通过 `history.state` 恢复页面状态（如「用户来自列表第几页」）。
