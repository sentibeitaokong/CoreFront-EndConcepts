# HTML5 History API

History API 允许开发者在**不刷新页面**的情况下修改浏览器地址栏的 URL，并管理浏览器的历史记录栈。这是现代单页应用 (SPA) 实现前端路由（如 Vue Router, React Router）的核心底层技术。

## 1. 核心属性与方法 API

这些 API 全部挂载在 `window.history` 对象上。

### 1.1 修改历史记录 (不刷新页面)

这两个方法是 SPA 路由的核心。它们**只改变 URL 和历史栈**，**绝对不会**触发页面刷新或跳转。

| 方法 | 语法 | 描述 |
| :--- | :--- | :--- |
| **`pushState()`** | `history.pushState(state, title, url)` | **新增一条记录**。地址栏 URL 改变，浏览器“前进/后退”按钮可用。 |
| **`replaceState()`**| `history.replaceState(state, title, url)` | **替换当前记录**。地址栏 URL 改变，但历史栈长度不变（不能后退到刚才那个 URL）。 |

**参数详解**：
1.  **`state`** (Object): 一个与新历史记录绑定的状态对象。当用户点击后退/前进时，可以通过 `event.state` 获取这个对象。
2.  **`title`** (String): 页面标题。目前大多数浏览器（包括 Chrome/Firefox）都**忽略**此参数，建议传 `""` 或 `null`。
3.  **`url`** (String): 新的 URL 地址。必须与当前页面**同源**（同协议、同域名、同端口）。可以是绝对路径 (`/home`) 或相对路径 (`home`)。

### 1.2 导航与移动 (Navigation)

这些方法等同于用户点击了浏览器的前进/后退按钮。

| 方法 | 语法 | 描述 | 等价操作 |
| :--- | :--- | :--- | :--- |
| **`back()`** | `history.back()` | 后退一页。 | 点击浏览器“后退”按钮。 |
| **`forward()`** | `history.forward()` | 前进一页。 | 点击浏览器“前进”按钮。 |
| **`go()`** | `history.go(n)` | 移动 n 页。<br>`-1` (后退), `1` (前进), `0` (刷新当前页)。 | - |

### 1.3 属性 (Properties)

| 属性 | 描述 |
| :--- | :--- |
| **`length`** | 历史栈中的记录数量。 |
| **`state`** | 当前历史记录绑定的状态对象（即 `pushState` 第一个参数存进去的值）。 |
| **`scrollRestoration`**| **滚动恢复行为**。<br>`auto` (默认): 浏览器自动恢复滚动位置。<br>`manual`: 开发者手动控制（常用于无限滚动列表的优化）。 |

## 2. 核心事件 (Event)

### `popstate` 事件

当活动的历史记录条目发生变化时触发。
**触发时机（重要！）**：
*   ✅ 用户点击浏览器的 **后退** 或 **前进** 按钮。
*   ✅ 调用 `history.back()`, `history.forward()`, `history.go()`。
*   ❌ 调用 `pushState()` 或 `replaceState()` **不会触发**此事件。

```javascript
window.addEventListener('popstate', (event) => {
  console.log("URL 变了！用户点击了前进/后退");
  console.log("之前存的状态数据:", event.state);
  
  // 在这里编写路由逻辑：根据 location.pathname 渲染不同的组件
});
```

## 3. 实战代码

实现前端路由(SPA)的核心原理在于：**改变 URL，不刷新页面，同时根据 URL 渲染对应的视图**。

下面我将分别用原生 JavaScript 手写实现 **Hash 模式** 和 **History 模式** 的路由。


### 3.1 Hash 模式路由实现

**原理**：
*   URL 中 `#` 后面的内容被称为 Hash。
*   修改 Hash 不会触发页面刷新。
*   浏览器提供了 `hashchange` 事件，当 Hash 变化时会触发该事件。
*   页面加载时会触发 `load` 事件。

**实现代码**：

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

### 3.2 History 模式路由实现

**原理**：
*   利用 HTML5 的 `history.pushState()` 和 `history.replaceState()` 修改 URL，这两个 API **不会**触发页面刷新。
*   浏览器前进/后退会触发 `popstate` 事件。
*   **难点**：`pushState` 和 `replaceState` **不会**触发 `popstate` 事件，所以我们需要手动拦截链接点击或创建自定义方法来更新视图。

**实现代码**：

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

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么 `pushState` 后页面没有变化？
**正常现象**。
`pushState` 和 `replaceState` 仅仅是修改了地址栏的字符串和历史栈，**它们不会加载新页面，也不会触发 `popstate` 事件**。
你需要手动编写代码（如调用 `renderPage()`）来更新页面内容。

### Q2: 刷新页面报 404 错误？
**场景**：你用 `pushState` 到了 `/user/123`，一切正常。但如果你按 F5 刷新，或者把这个链接发给朋友打开，服务器报 404 Not Found。

**原因**：这是**单页应用 (SPA)** 的通病。刷新时，浏览器真的向服务器请求了 `/user/123` 这个文件，但服务器上只有 `index.html`，没有 `user/123` 目录。

**解法**：**后端配置 (Nginx/Apache)**。
告诉服务器：凡是找不到文件的请求，统一返回 `index.html`。让前端 JS 去解析 URL 并渲染。
```nginx
# Nginx 配置示例
location / {
  try_files $uri $uri/ /index.html;
}
```

### Q3: `state` 对象有多大限制？
*   `state` 对象被序列化存储在用户的磁盘上。
*   大多数浏览器限制在 **640k** 或 **2MB** 以内。
*   不要存太大的数据，只存 ID 或简单的页面状态。

### Q4: 怎么监听 `pushState` 事件？
原生没有监听 `pushstate` 事件。如果你想在 `pushState` 被调用时收到通知（比如为了做埋点统计），你需要**重写 (Monkey Patch)** 原生方法。

```javascript
// 拦截并重写 pushState
const originalPushState = history.pushState;
history.pushState = function(state, title, url) {
  // 1. 执行原生逻辑
  originalPushState.apply(this, arguments);
  
  // 2. 派发自定义事件
  const event = new Event('pushstate');
  event.state = state;
  event.url = url;
  window.dispatchEvent(event);
};

// 现在可以监听了
window.addEventListener('pushstate', (e) => {
  console.log('路由跳转了:', e.url);
});
```

### Q5: Hash 模式 (`#`) 和 History 模式的区别？
*   **Hash 模式** (`example.com/#/home`):
    *   利用 `window.onhashchange` 监听。
    *   **优点**: 兼容性极好 (IE8+)，**不需要后端配置**（因为 `#` 后面的内容不会发给服务器）。
    *   **缺点**: URL 丑陋。
*   **History 模式** (`example.com/home`):
    *   利用 History API。
    *   **优点**: URL 美观，符合标准。
    *   **缺点**: **必须后端配置**支持（否则刷新 404）。

### Q6: `history.scrollRestoration` 怎么用？
**场景**：用户在一个无限滚动的列表页浏览，点击详情页，然后点“后退”。浏览器默认会自动滚动回之前的位置。但如果你是 JS 动态渲染的列表，数据还没加载回来，浏览器滚动就会失败或乱跳。

**解法**：关闭自动滚动，完全由 JS 接管。
```javascript
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'; // 关闭自动恢复
}
// 在 popstate 事件中，等数据加载完，再 window.scrollTo(...)
```