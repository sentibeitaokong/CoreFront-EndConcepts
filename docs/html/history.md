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

## 3. 实战代码：手写一个简单的路由

```javascript
// 1. 路由跳转函数
function navigateTo(url, data) {
  // 修改 URL，不刷新页面
  history.pushState(data, "", url);
  // 手动触发渲染（因为 pushState 不会触发 popstate）
  renderPage(url);
}

// 2. 监听浏览器的前进/后退
window.addEventListener('popstate', (event) => {
  // event.state 包含了我们之前存的数据
  renderPage(location.pathname);
});

// 3. 页面渲染逻辑
function renderPage(path) {
  const content = document.getElementById('app');
  if (path === '/home') {
    content.innerHTML = '<h1>首页</h1>';
  } else if (path === '/about') {
    content.innerHTML = '<h1>关于</h1>';
  } else {
    content.innerHTML = '<h1>404</h1>';
  }
}

// 绑定点击事件
document.querySelector('#link-home').onclick = () => navigateTo('/home', { id: 1 });
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