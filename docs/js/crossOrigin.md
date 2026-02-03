# JavaScript **跨域 (Cross-Origin)**

跨域问题源于浏览器的**同源策略 (Same-Origin Policy, SOP)**。理解同源策略，是理解所有跨域解决方案的基石。

## **1. 什么是同源策略 (Same-Origin Policy)？**

**定义**: 同源策略是浏览器的一个核心安全功能，它限制了一个**源 (Origin)** 的文档或脚本，如何能与另一个**源**的资源进行交互。

**什么是“源” (Origin)？**
一个“源”由三个部分组成：**协议 (Protocol)**、**域名 (Host)** 和 **端口 (Port)**。

只有当这三个部分**完全相同**时，两个 URL 才被认为是“同源”的。

**同源判断示例**:
假设当前页面的 URL 是 `http://www.example.com/dir/page.html`。

| 要请求的 URL | 是否同源？ | 原因 |
| :--- | :--- | :--- |
| `http://www.example.com/dir2/other.html` | **是** | 协议、域名、端口都相同 |
| `http://www.example.com/dir/inner/` | **是** | 协议、域名、端口都相同 |
| `https://www.example.com/` | **否** | **协议**不同 (`http` vs `https`) |
| `http://en.example.com/` | **否** | **域名**不同 (子域名不同) |
| `http://example.com/` | **否** | **域名**不同 (`www.` vs 无) |
| `http://www.example.com:81/` | **否** | **端口**不同 (80 vs 81) |

**同源策略限制了什么？**
同源策略主要限制了以下两种行为：
1.  **DOM 访问**: 一个源的页面无法获取或操作另一个源的页面的 DOM。
2.  **数据交互**: 一个源的页面无法读取另一个源的 Cookie、LocalStorage、IndexedDB 等数据。
3.  **网络请求**: 一个源的页面**不能**通过 `XMLHttpRequest` 或 `Fetch API` 发送**跨域请求**并**读取**其响应。**这是“跨域”问题的最常见表现形式**。

**注意**: 同源策略**并不阻止**你发送请求。请求实际上已经发送到了服务器。它阻止的是**浏览器端的 JavaScript 读取响应**。

## **2. 为什么会产生跨域问题？**

跨域问题的本质是，浏览器为了安全，默认不允许你用 `AJAX`/`Fetch` 读取不同源的服务器返回的数据。

**一个典型的错误**:
当你尝试用 `Fetch` 从 `http://localhost:3000` 请求 `http://localhost:4000/api/data` 时，你会在浏览器控制台看到类似这样的错误：
> Access to fetch at `http://localhost:4000/api/data` from origin `http://localhost:3000` has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

这个错误明确告诉你，请求被 **CORS 策略**阻止了。CORS 是解决跨域问题的**主要方案**。


## **3. 跨域解决方案**
解决跨域问题的方法很多，我们可以总结为以下八大方案。

其中，**CORS** 和 **Proxy（代理）** 是现代开发中最常用、最推荐的方案。

### **1. CORS (Cross-Origin Resource Sharing) - 最推荐**

*   **原理**: W3C 标准。服务器在响应头中设置 `Access-Control-Allow-Origin` 等字段，明确告知浏览器允许哪些源进行访问。
*   **适用场景**: 所有常规的 AJAX / Fetch 请求。
*   **优点**: 官方标准，支持所有 HTTP 方法，安全可靠。
*   **缺点**: 需要后端支持。

### **2. 代理服务器 (Proxy) - 开发环境首选**

*   **原理**: 同源策略是浏览器的限制，服务器之间通信没有限制。前端请求同源的代理服务器，代理服务器转发请求给目标服务器，再将结果返回给前端。
*   **实现**:
    *   **开发环境**: Webpack Dev Server, Vite proxy, Nginx。
    *   **Node.js 中间件**: http-proxy-middleware。
*   **优点**: 前端代码无感，无需修改跨域逻辑。
*   **缺点**: 需要额外部署或配置中间件。

### **3. Nginx 反向代理 - 生产环境常用**

*   **原理**: 与开发环境代理类似，但在服务器端（Nginx）配置。将特定路径（如 `/api`）的请求转发到后端服务，前端静态资源和接口请求在浏览器看来都是同一个域名。
*   **优点**: 性能高，配置灵活，生产环境标准解法。

### **4. JSONP (JSON with Padding) - 经典但过时**

*   **原理**: 利用 `<script>` 标签不受同源策略限制的特性。前端定义回调函数，后端返回调用该函数的 JS 代码。
*   **适用场景**: 兼容老旧浏览器，或某些只支持 JSONP 的第三方公共 API。
*   **缺点**: **只支持 GET 请求**；不安全（XSS 风险）。

### **5. `postMessage` - 跨窗口通信**

*   **原理**: HTML5 API。允许不同源的窗口（如页面与 iframe，或两个标签页）之间发送数据。
*   **用法**: `window.postMessage()` 发送，`window.addEventListener('message', ...)` 接收。
*   **适用场景**: 多窗口协作，iframe 通信。

### **6. WebSocket - 实时通信**

*   **原理**: WebSocket 协议本身**不受同源策略限制**。建立连接后，客户端和服务端可以双向自由通信。
*   **适用场景**: 聊天室、即时游戏、股票行情。

### **7. `document.domain` - 仅限主域相同**

*   **原理**: 两个页面如果**主域名相同，子域名不同**（如 `a.test.com` 和 `b.test.com`），可以将两者的 `document.domain` 都设置为 `test.com` 来实现通信。
*   **现状**: **已废弃/不推荐**。现代浏览器出于安全考虑正在禁用此功能。

### **8. `window.name` - 极少使用**

*   **原理**: 浏览器窗口的 `name` 属性在页面跳转（甚至跨域跳转）后依然保持不变，且可以存储较长的数据。
*   **实现**: 通过 iframe 加载跨域页面，跨域页面将数据写入 `window.name`，然后 iframe 跳转回同源页面，主页面即可读取 iframe 的 `window.name`。
*   **缺点**: 操作繁琐，数据暴露在 `window.name` 中不安全。

---

**总结建议**:

*   **日常 API 开发**: 只要能控制后端，首选 **CORS**。
*   **解决开发环境跨域**: 用 **Proxy** (Webpack/Vite)。
*   **Iframe 通信**: 用 **postMessage**。
*   **其他的**: 了解即可，大多已过时。