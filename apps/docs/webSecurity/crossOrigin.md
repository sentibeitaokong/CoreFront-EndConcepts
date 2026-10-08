# **跨域 (Cross-Origin)**

跨域问题源于浏览器的**同源策略 (Same-Origin Policy, SOP)**。理解同源策略，是理解所有跨域解决方案的基石。

## **1. 什么是同源策略 (Same-Origin Policy)？**

**定义**: 同源策略是浏览器的一个核心安全功能，它限制了一个**源 (Origin)** 的文档或脚本，如何能与另一个**源**的资源进行交互。

**什么是“**源**” (Origin)？**
一个“**源**”由三个部分组成：**协议 (Protocol)**、**域名 (Host)** 和 **端口 (Port)**。

只有当这三个部分**完全相同**时，两个 URL 才被认为是“**同源**”的。

**同源判断示例**:
假设当前页面的 URL 是 `http://www.example.com/dir/page.html`。

[width(48,15,37)]

| 要请求的 URL                             | 是否同源？ | 原因                             |
| :--------------------------------------- | :--------- | :------------------------------- |
| `http://www.example.com/dir2/other.html` | **是**     | 协议、域名、端口都相同           |
| `http://www.example.com/dir/inner/`      | **是**     | 协议、域名、端口都相同           |
| `https://www.example.com/`               | **否**     | **协议**不同 (`http` vs `https`) |
| `http://en.example.com/`                 | **否**     | **域名**不同 (子域名不同)        |
| `http://example.com/`                    | **否**     | **域名**不同 (`www.` vs 无)      |
| `http://www.example.com:81/`             | **否**     | **端口**不同 (80 vs 81)          |

**同源策略限制了什么？**
同源策略主要限制了以下两种行为：

- **DOM 访问**: 一个源的页面无法获取或操作另一个源的页面的 DOM。
- **数据交互**: 一个源的页面无法读取另一个源的 Cookie、LocalStorage、IndexedDB 等数据。
- **网络请求**: 一个源的页面**不能**通过 `XMLHttpRequest` 或 `Fetch API` 发送**跨域请求**并**读取**其响应。这是“**跨域**”问题的最常见表现形式。

**注意**: 同源策略**并不阻止**你发送请求。请求实际上已经发送到了服务器。它阻止的是**浏览器端的 JavaScript 读取响应**。

## **2. 跨域的本质**

关于跨域，前端界存在一个最普遍的误解：**以为是服务器拦截了请求。**

**真相是：服务器根本不在乎同源策略，是浏览器在“多管闲事”。**

当你用 Axios 向跨域服务器发送一个普通的 GET 请求时：

- 请求确实发出了，并且成功到达了目标服务器。
- 服务器正常处理了请求，并把数据返回给了浏览器。
- **浏览器接收到数据后，发现这是跨域请求且没有授权许可，于是立刻“撕毁”了数据，并在控制台抛出报错。**

同源策略是**浏览器**的自律行为，脱离了浏览器（比如你用 Postman、CURL 或者 Node.js 发请求），跨域限制根本不存在。

**一个典型的错误**:
当你尝试用 `Fetch` 从 `http://localhost:3000` 请求 `http://localhost:4000/api/data` 时，你会在浏览器控制台看到类似这样的错误：

> Access to fetch at `http://localhost:4000/api/data` from origin `http://localhost:3000` has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

这个错误明确告诉你，请求被 **CORS 策略**阻止了。CORS 是解决跨域问题的**主要方案**。

## **3. 跨域解决方案**

解决跨域问题的方法很多，我们可以总结为以下八大方案。

其中，**CORS** 和 **Proxy（代理）** 是现代开发中最常用、最推荐的方案。

**高频场景：遇到这些情况直接用哪个方案**

[width(32,25,43)]

| 场景                         | 首选方案             | 理由                                        |
| ---------------------------- | -------------------- | ------------------------------------------- |
| 开发环境前后端分端口联调     | Vite / Webpack Proxy | 前端零改动，只在本地中间件转发              |
| 生产环境 API 与页面同域部署  | Nginx 反向代理       | 浏览器看不到跨域，最省心                    |
| 前后端分离、跨域调用 API     | CORS                 | 官方标准，能精确授权到源、方法、头          |
| 页面与 iframe / 多标签页通信 | `postMessage`        | 跨窗口通信的唯一安全通道                    |
| 聊天、行情等实时双向通信     | WebSocket            | 协议本身不受同源策略限制                    |
| 只能拿到第三方 JSONP 接口    | JSONP（仅兜底）      | 只支持 GET、有 XSS 风险，能用 CORS 就别用它 |

### **3.1 CORS (Cross-Origin Resource Sharing) - 最推荐**

- **原理**: W3C 标准。服务器在响应头中设置 `Access-Control-Allow-Origin` 等字段，明确告知浏览器允许哪些源进行访问。其中出现频率最高的是 `Allow-Origin`、`Allow-Methods`、`Allow-Headers`、`Allow-Credentials`、`Max-Age`（**高频属性**）。
- **适用场景**: 所有常规的 AJAX / Fetch 请求。
- **优点**: 官方标准，支持所有 HTTP 方法，安全可靠。
- **缺点**: 需要后端支持。

```js
// 前端：跨域携带 Cookie 时必须显式声明
fetch('https://api.example.com/user', { credentials: 'include' })
```

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

### **3.2 代理服务器 (Proxy) - 开发环境首选**

- **原理**: 同源策略是浏览器的限制，服务器之间通信没有限制。前端请求同源的代理服务器，代理服务器转发请求给目标服务器，再将结果返回给前端。
- **实现**:
  - **开发环境**: Webpack Dev Server, Vite proxy, Nginx。
  - **Node.js 中间件**: http-proxy-middleware。
- **优点**: 前端代码无感，无需修改跨域逻辑。
- **缺点**: 需要额外部署或配置中间件。

```js
// vite.config.js：把 /api 前缀的请求转发到后端
export default {
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
}
```

### **3.3 Nginx 反向代理 - 生产环境常用**

- **原理**: 与开发环境代理类似，但在服务器端（Nginx）配置。将特定路径（如 `/api`）的请求转发到后端服务，前端静态资源和接口请求在浏览器看来都是同一个域名。
- **优点**: 性能高，配置灵活，生产环境标准解法。

```nginx
location /api/ {
  proxy_pass http://backend:4000/;
}
```

### **3.4 JSONP (JSON with Padding) - 经典但过时**

- **原理**: 利用 `<script>` 标签不受同源策略限制的特性。前端定义回调函数，后端返回调用该函数的 JS 代码。
- **适用场景**: 兼容老旧浏览器，或某些只支持 JSONP 的第三方公共 API。
- **缺点**: **只支持 GET 请求**；不安全（XSS 风险）。

```js
// 前端：动态插入 <script>，由页面上的全局回调接收数据
function handleJsonp(data) {
  console.log(data)
}

const script = document.createElement('script')
script.src = 'https://api.example.com/data?callback=handleJsonp'
document.body.appendChild(script)
```

### **3.5 `postMessage` - 跨窗口通信**

- **原理**: HTML5 API。允许不同源的窗口（如页面与 iframe，或两个标签页）之间发送数据。
- **用法**: `window.postMessage()` 发送，`window.addEventListener('message', ...)` 接收。
- **适用场景**: 多窗口协作，iframe 通信。

```js
// 子窗口向父窗口发送
window.parent.postMessage('hello', 'https://parent.example.com')

// 父窗口接收（务必校验 origin）
window.addEventListener('message', event => {
  if (event.origin === 'https://child.example.com') {
    console.log(event.data)
  }
})
```

### **3.6 WebSocket - 实时通信**

- **原理**: WebSocket 协议本身**不受同源策略限制**。建立连接后，客户端和服务端可以双向自由通信。
- **适用场景**: 聊天室、即时游戏、股票行情。

```js
const ws = new WebSocket('wss://api.example.com/chat')
ws.onopen = () => ws.send('hello')
ws.onmessage = event => console.log(event.data)
```

### **3.7 `document.domain` - 仅限主域相同**

- **原理**: 两个页面如果**主域名相同，子域名不同**（如 `a.test.com` 和 `b.test.com`），可以将两者的 `document.domain` 都设置为 `test.com` 来实现通信。
- **现状**: **已废弃/不推荐**。现代浏览器出于安全考虑正在禁用此功能。

```js
// a.test.com 与 b.test.com 各自设置同一个主域，即可互相访问
document.domain = 'test.com'
```

### **3.8 `window.name` - 极少使用**

- **原理**: 浏览器窗口的 `name` 属性在页面跳转（甚至跨域跳转）后依然保持不变，且可以存储较长的数据。
- **实现**: 通过 iframe 加载跨域页面，跨域页面将数据写入 `window.name`，然后 iframe 跳转回同源页面，主页面即可读取 iframe 的 `window.name`。
- **缺点**: 操作繁琐，数据暴露在 `window.name` 中不安全。

```js
// iframe 内的跨域页：写入数据后跳回同源页
window.name = JSON.stringify({ token: 'xxx' })
window.location.href = 'https://app.example.com/blank.html'
```

```js
// 主页面：iframe 跳回同源后即可读取
iframe.contentWindow.name
```

## **4. 常见问题 (FAQ)**

### **4.1 跨域到底是浏览器拦的，还是服务器拦的？**

是**浏览器**拦的。同源策略是浏览器独有的安全边界，服务器根本不在乎请求来自哪个源。请求通常已经成功到达服务器并被处理，只是浏览器在拿到响应后，因为没有合法的跨域许可，拒绝把结果交给页面 JS。

### **4.2 为什么 Postman / curl / Node.js 请求同样的接口就不报跨域？**

因为它们**不是浏览器**，不执行同源策略。跨域限制只存在于浏览器的 JS 运行环境中；脱离浏览器（Postman、curl、服务端之间的调用）根本没有这层检查。

### **4.3 请求明明发出去了，为什么控制台还报 CORS 错误？**

这正说明是“**事后拦截**”而不是“**请求被拦下**”。对于简单请求，浏览器会先把真实请求发出去，服务器也真的执行了业务逻辑，但响应头里缺少 `Access-Control-Allow-Origin`，于是响应被浏览器扣留——请求生效了，数据却拿不到。

### **4.4 后端已经加了 CORS 头，为什么还是被拦？**

- **带了 Cookie 却用了 `*`**：开启凭证（`withCredentials` / `credentials: 'include'`）时，`Access-Control-Allow-Origin` 不能是通配符，必须回显具体源。
- **预检（OPTIONS）没放行**：复杂请求需要后端对 `OPTIONS` 返回 204/200 并带上跨域头，否则真实请求根本不会发出。
- **头没配全**：用了自定义头（如 `Authorization`）或非简单方法，却漏配 `Allow-Headers` / `Allow-Methods`。
- **前面还有一层网关/Nginx**：跨域头被前端网关吞掉或覆盖，得逐层确认。

### **4.5 `Access-Control-Allow-Origin: *` 什么时候能用？**

只适用于**匿名、不需要携带 Cookie / 凭证**的公开接口（如公开的统计、图片、开放 API）。一旦请求需要带登录态，`*` 会被浏览器直接拒绝——此时必须根据请求的 `Origin` 动态回显精确源。

### **4.6 开发环境用的 proxy，能直接搬到生产吗？**

不能照搬。开发期用的是 Vite / Webpack Dev Server 这类只存在于本地的中间件；生产环境对应的做法是 **Nginx 反向代理**或**同域部署**，把静态资源和 `/api` 收敛到同一域名下。两者思路一致（服务器之间转发），但载体和配置完全不同。

### **4.7 跨域请求默认会带上 Cookie 吗？**

不会。跨域请求默认是**完全匿名**的，浏览器不会自动附加目标域的 Cookie。要携带凭证需要前后端双向显式开启：前端设置 `credentials: 'include'`（或 Axios 的 `withCredentials: true`），后端返回 `Access-Control-Allow-Credentials: true`。

### **4.8 JSONP 现在还能用吗？**

**能用但不推荐**。它只支持 `GET`，且把远端返回的内容当脚本执行，天然带 XSS 风险，也无法携带自定义头或凭证。只有在对接“**只提供 JSONP**”的老旧第三方接口时才作为兜底手段，自有接口一律用 CORS。
