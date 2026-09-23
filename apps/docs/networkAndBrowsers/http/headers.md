# HTTP 请求头与响应头常见类型

在 HTTP 协议中，Header（头部）是以键值对 `Key: Value` 形式存在的元数据，它们负责在客户端（如浏览器）和服务器之间传递控制信息、状态信息以及对数据的描述。

**一句话理解**：如果 HTTP 的**起始行**说的是“**我要对哪个资源做什么**”，**正文**说的是“**具体的数据长什么样**”，那么**头部就是这次请求/响应的全部“附加说明”**——我是谁、我想要什么格式、我带了什么凭证、这个响应能不能缓存、允许谁跨域读它。**前端遇到的绝大多数“玄学问题”（跨域被拦、缓存不生效、Cookie 没带上、下载变成预览），答案都在某个头部字段里。**

> [!TIP] 相关阅读
> 头部的宿主——报文结构与协议本身见 [HTTP 协议](/networkAndBrowsers/http/http)；加密后多出来的部分见 [HTTPS 协议](/networkAndBrowsers/http/https)；缓存相关头部（`Cache-Control` / `ETag` / `Vary`）的完整机制见 [浏览器缓存](/networkAndBrowsers/caching/browserCache) 与 [前端缓存策略](/networkAndBrowsers/caching/frontendCacheStrategy)；跨域头部的完整流程见 [跨域 CORS](/webSecurity/cors)；安全头部（CSP / HSTS / X-Frame-Options）见 [CSP、SRI 与 HSTS](/webSecurity/cspSriHsts)；Cookie 的读写与属性见 [Cookie 与浏览器存储](/networkAndBrowsers/browser/cookieAndStorage)；前端怎么设置这些头见 [fetch](/networkAndBrowsers/api/fetch)。

## 1. 头部字段的基本规则

### 1.1 语法

```http
字段名: 字段值
```

- 字段名和冒号之间**不能有空格**（`Host: example.com` 合法，`Host : example.com` 不合法）。
- 冒号后面的空格是**可选的**，但惯例会写一个。
- 一个字段占一行，行尾是 `\r\n`；整个头部以**一个空行**结束。

### 1.2 五条通用规则

- **字段名大小写不敏感**。`Content-Type`、`content-type`、`CONTENT-TYPE` 是同一个字段。但**值**是否大小写敏感由各字段自己规定（如 `Content-Type` 的 MIME 类型不敏感，而 URL、Cookie 值敏感）。
- **同一个字段可以出现多次**。语义由字段自己定义：要么等价于用逗号合并（`Accept: text/html` + `Accept: application/json` 等价于 `Accept: text/html, application/json`），要么各次都有独立语义（典型是 `Set-Cookie`，**绝对不能合并**）。
- **字段顺序在语义上无关**（HTTP/2 明确要求不依赖顺序）。但出于调试习惯，通常 `Host` 在最前。
- **传输中可能被中间层改写或追加**。代理会加上 `Via`、`X-Forwarded-For`；Nginx 会改写 `Host`；CDN 会插入缓存相关字段。所以你在浏览器看到的请求头，**未必和服务器收到的一模一样**。
- **头部有大小限制**。协议没规定上限，但服务器实现普遍只留 **4～8 KB**（Nginx `large_client_header_buffers` 默认 4×8K，Tomcat `maxHttpHeaderSize` 默认 8KB）。超了直接返回 `431 Request Header Fields Too Large` 或 `400`。**所以别把大块数据塞进头部。**

### 1.3 两种分类视角

**按流向和作用分类**：

- **请求头 (Request Headers)**：客户端 → 服务器，表达“**我是谁、我要什么、我的约束是什么**”。
- **响应头 (Response Headers)**：服务器 → 客户端，表达“**我给的是什么、你该怎么处理它**”。
- **实体头 / 表示头 (Entity / Representation Headers)**：**两边都能用**，描述正文本身（类型、长度、编码）。这是最容易和上面两类混在一起的一类。
- **通用头 (General Headers)**：两边都能用的控制类字段，如 `Date`、`Connection`、`Cache-Control`。

**按作用范围分类**：

- **端到端 (End-to-End)**：只对最终的发送方和接收方有意义，**代理必须原样转发**。绝大多数头部属于这一类（`Content-Type`、`Authorization`…）。
- **逐跳 (Hop-by-Hop)**：**只对相邻的两个节点有意义**，代理收到后要处理掉，不能继续往后传。属于这一类的只有几个：`Connection`、`Keep-Alive`、`Proxy-Authenticate`、`Proxy-Authorization`、`TE`、`Trailer`、`Transfer-Encoding`、`Upgrade`。这也解释了 `Connection` 头的特殊用法：`Connection: close` 和 `Connection: Upgrade` 是它的两个标准指令。

### 1.4 哪些头部前端改不了？

用 `fetch` / `XHR` 时，有一批字段叫 **forbidden header names（禁设头部）**，写进去会被**静默忽略**（不报错，也不生效，这是最坑的地方）：

- **由浏览器统一管理的**：`Host`、`Cookie`、`Content-Length`、`Connection`、`Transfer-Encoding`、`TE`、`Upgrade`、`Trailer`、`Date`、`Expect`、`Via`、`Keep-Alive`。
- **由安全策略决定的**：`Origin`、`Referer`（浏览器按当前页面和 `Referrer-Policy` 自动计算）、`Proxy-*`、`Sec-*`。

所以：**Cookie 要靠 `credentials` 选项或 `document.cookie` 来带，不能靠手写 `Cookie` 头；跨域身份要靠 `Origin` 自动携带，不能自己伪造。** 反过来说，这也是一种保护：如果 JS 能随便伪造 `Origin`，同源策略就形同虚设了。

## 2. 常见请求头 (Request Headers)

**流向：客户端 → 服务器。**
用于向服务器传递客户端的自身属性、用户的偏好设置以及请求的上下文信息。

### 2.1 客户端信息与内容协商（告诉服务器“我是谁，我要什么”）

[width(23,44,33)]

| 字段名                | 说明                                                                                                        | 常见值 / 示例                                  |
| :-------------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **`User-Agent`**      | 包含了发出请求的客户端（浏览器、操作系统）的详细信息。常用于服务器进行设备判断（PC 还是移动端）或数据统计。 | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...` |
| **`Accept`**          | 告诉服务器客户端**期望接收**的数据格式（MIME 类型）。                                                       | `application/json`, `text/html`, `image/webp`  |
| **`Accept-Encoding`** | 告诉服务器客户端支持的**内容压缩格式**，服务器可据此压缩响应体积。                                          | `gzip, deflate, br` (Brotli)                   |
| **`Accept-Language`** | 告诉服务器客户端偏好的语言，用于国际化（i18n）多语言支持。                                                  | `zh-CN, zh;q=0.9, en;q=0.8`                    |
| **`Accept-Charset`**  | 告诉服务器客户端接受的字符集。现代浏览器基本只用 UTF-8，这个字段已很少出现。                                | `utf-8`                                        |

> [!NOTE] `q` 值：带权重的偏好
> `Accept-Language: zh-CN, zh;q=0.9, en;q=0.8` 里的 `q`（quality）取值 `0~1`，表示相对优先级，默认是 `1`。它表达的是“**有中文用中文，没有的话英文也能凑合**”。服务端内容协商时按 `q` 排序挑选。

### 2.2 身份验证与状态维持

[width(21,41,38)]

| 字段名              | 说明                                                                                              | 常见值 / 示例                                              |
| :------------------ | :------------------------------------------------------------------------------------------------ | :--------------------------------------------------------- |
| **`Authorization`** | 携带身份验证凭证（如 Token 或账号密码），证明客户端有权访问该 API 接口。                          | `Bearer eyJhbGciOiJIUzI1Ni...`<br>`Basic YWRtaW46MTIzNDU2` |
| **`Cookie`**        | 将浏览器本地存储的、属于该域名的 Cookie 数据发送给服务器，用于维持登录状态（Session）或用户追踪。 | `sessionId=123abc456def; theme=dark`                       |

`Authorization` 后面跟的是**认证方案 (Scheme)**，最常见的两种：

- `Basic`：把 `用户名:密码` 做 Base64（**注意：只是编码不是加密**，必须配合 HTTPS 使用）。
- `Bearer`：持有一个令牌（JWT、OAuth Token）。“Bearer” 的含义是“**持有者即有权**”，所以**令牌泄露就等于身份泄露**，绝不能放进 URL。

### 2.3 路由、来源与安全 (CORS)

[width(11,59,30)]

| 字段名        | 说明                                                                                                                                              | 常见值 / 示例                               |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------ |
| **`Host`**    | **(HTTP/1.1 唯一必填字段)** 指定请求的服务器域名和端口号。用于物理服务器区分不同的虚拟主机（同一 IP 下的不同网站）。                              | `www.example.com`<br>`api.example.com:8080` |
| **`Referer`** | 记录了当前请求是**从哪个页面的 URL 跳转或发起**的。常用于防盗链（防止别人引用你的图片）和流量分析。（注：历史上拼写错误，少了一个 r，沿用至今）。 | `https://www.google.com/`                   |
| **`Origin`**  | 发起**跨域请求 (CORS)** 时由浏览器自动携带，只包含协议+域名+端口，不包含路径。用于服务器判断是否允许跨域。                                        | `https://www.myfrontend.com`                |

`Referer` 和 `Origin` 都表示“**请求是从哪来的**”，但**用途和内容都不同**：

[width(13,34,53)]

| 维度         | `Referer`                                               | `Origin`                                      |
| :----------- | :------------------------------------------------------ | :-------------------------------------------- |
| **内容**     | 完整 URL，**含路径和查询参数**。                        | 只有 `协议://域名:端口`，没有路径。           |
| **何时发送** | 同源、跨域请求都可能带（受 `Referrer-Policy` 控制）。   | **仅在跨域请求**时携带；同源 `GET` 通常没有。 |
| **主要用途** | 防盗链、来源统计、风控。                                | **CORS 判定**、服务端来源校验。               |
| **隐私**     | 可能泄露 URL 里的敏感信息，所以有了 `Referrer-Policy`。 | 信息量小，相对安全。                          |

> [!NOTE] 什么时候会触发预检请求 (Preflight)
> 跨域请求不是“**非简单请求**”就会被浏览器先发一个 `OPTIONS` 探路。判定为**简单请求**（不触发预检）需要同时满足：方法是 `GET`/`HEAD`/`POST` 之一；**且**头部只用了 `Accept`、`Accept-Language`、`Content-Language`、`Content-Type` 这几个安全字段；**且** `Content-Type` 只能是 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded`。**所以“跨域传 JSON”必然触发预检**——因为 `application/json` 不在白名单里。完整流程见 [跨域 CORS](/webSecurity/cors)。

### 2.4 条件请求与范围请求（省流量、续传的两套机制）

[width(21,44,35)]

| 字段名                    | 说明                                                                           | 常见值 / 示例                   |
| :------------------------ | :----------------------------------------------------------------------------- | :------------------------------ |
| **`If-None-Match`**       | 将上次服务器给的 `ETag` 值发回，询问服务器资源变了没。没变则服务器返回 304。   | `"33a64df551425fcc..."`         |
| **`If-Modified-Since`**   | 将上次服务器给的 `Last-Modified` 值发回，询问自该时间后资源修改了没。          | `Wed, 21 Oct 2026 07:28:00 GMT` |
| **`If-Match`**            | 把 `ETag` 发回，**不匹配就拒绝操作**。用于乐观并发控制（防止覆盖别人的修改）。 | `"33a64df551425fcc..."`         |
| **`If-Unmodified-Since`** | 同上，用时间做条件。                                                           | `Wed, 21 Oct 2026 07:28:00 GMT` |
| **`Range`**               | 只要资源的某一段字节。                                                         | `bytes=0-1023`、`bytes=500-`    |
| **`If-Range`**            | 配合 `Range` 使用：资源没变才返回那一段，变了则返回完整资源（而不是 `206`）。  | `"33a64df551425fcc..."`         |

### 2.5 连接与协议协商（排查 WebSocket、代理问题时才会碰）

[width(18,43,39)]

| 字段名                  | 说明                                                                                                        | 常见值 / 示例                    |
| :---------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------- |
| **`Connection`**        | 控制**本跳**连接行为的逐跳头部。                                                                            | `keep-alive`、`close`、`Upgrade` |
| **`Upgrade`**           | 请求把连接升级成别的协议。**WebSocket 握手靠的就是它**。                                                    | `websocket`、`h2c`               |
| **`Sec-WebSocket-Key`** | WebSocket 握手时浏览器生成的随机值，服务器要把它和固定 GUID 拼接后做 SHA-1，回填到 `Sec-WebSocket-Accept`。 | `dGhlIHNhbXBsZSBub25jZQ==`       |
| **`Expect`**            | 请求服务器先表态再传正文。                                                                                  | `100-continue`                   |
| **`TE`**                | 告诉服务器本跳接受哪些传输编码。                                                                            | `trailers`                       |

- **`Connection: Upgrade` + `Upgrade: websocket`** 是 WebSocket “**借 HTTP 上位**”的方式：先用一个标准的 HTTP `GET` 请求握手，协商成功（响应 `101 Switching Protocols`）后，**同一条 TCP 连接**就不再走 HTTP 了（见 [实时通信](/networkAndBrowsers/realtime/realtimeCommunication)）。
- **`Expect: 100-continue`** 用于大文件上传：客户端先只发头部，问一句“**我这几百兆能传吗**”，服务器回 `100 Continue` 才开始传正文，否则直接回 `413`——省得白传一遍。
- **`X-Forwarded-For` / `X-Real-IP`**：**不是标准头部**，是代理约定的扩展字段，用来把客户端的真实 IP 透传给后端。之所以需要它，是因为经过 Nginx 之后，后端 socket 看到的源 IP 是 Nginx 的（见 [CDN](/networkAndBrowsers/fundamentals/cdn)）。注意它**可以被客户端伪造**，只能信任第一层可信代理追加的那一段。

## 3. 常见响应头 (Response Headers)

**流向：服务器 → 客户端。**
用于向客户端传递服务器自身信息、指示客户端进行特定操作（如重定向、存 Cookie）以及跨域权限配置。

### 3.1 状态指示与控制

[width(24,49,27)]

| 字段名                    | 说明                                                                                                                             | 常见值 / 示例                                |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **`Server`**              | 包含了处理请求的服务器软件及其版本信息（出于安全考虑，常被隐藏或修改）。                                                         | `nginx/1.20.1`, `Apache`, `Tengine`          |
| **`Date`**                | 响应生成的 GMT 时间（服务器时钟）。                                                                                              | `Mon, 23 Feb 2026 12:00:00 GMT`              |
| **`Set-Cookie`**          | 服务器通过此字段**命令浏览器保存 Cookie**。可以设置过期时间 (`Expires`)、生效路径 (`Path`)、仅限 HTTP 访问 (`HttpOnly`) 等属性。 | `sessionid=xyz123; HttpOnly; Secure; Path=/` |
| **`Location`**            | 通常与 `3xx`（如 301, 302）状态码配合使用，**命令浏览器跳转（重定向）**到新的 URL 地址。也用于 `201 Created` 指明新资源的地址。  | `https://www.new-domain.com/login`           |
| **`Content-Disposition`** | 指示浏览器应当如何处理响应内容。是直接在页面内展示（`inline`），还是当作**附件下载**（`attachment`）。                           | `attachment; filename="report.xlsx"`         |
| **`WWW-Authenticate`**    | 与 `401` 配合，告诉客户端该用什么认证方案。                                                                                      | `Bearer realm="api"`                         |
| **`Retry-After`**         | 与 `429` / `503` 配合，告诉客户端多久之后再来试（秒数或时间点）。**前端做限流退避时应该读它，而不是拍脑袋定一个延迟。**          | `120`                                        |
| **`Allow`**               | 与 `405` 配合，列出该资源支持的方法。                                                                                            | `GET, HEAD, OPTIONS`                         |
| **`Vary`**                | 声明**这份响应是按哪些请求头变化的**，缓存必须把这些头也纳入缓存键。                                                             | `Accept-Encoding, Origin`                    |

> [!TIP] Content-Disposition 的一个常见坑
> 前端做“b”时，如果接口返回的是 `Content-Disposition: inline`（或不带这个头），浏览器会**直接打开**（PDF 预览、图片显示）而不是下载。想要强制下载，要么让后端返回 `attachment`，要么前端用 `Blob` + `a[download]` 自己触发。

### 3.2 缓存控制（强缓存与协商缓存）

[width(21,46,33)]

| 字段名              | 说明                                                                                | 常见值 / 示例                                                        |
| :------------------ | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **`Cache-Control`** | **最核心的缓存控制指令**。规定了资源在客户端可以缓存多久，或者是否需要每次都验证。  | `max-age=3600`<br>`no-cache` (需协商验证)<br>`no-store` (绝对不缓存) |
| **`ETag`**          | 资源内容的唯一标识符（类似于哈希/指纹）。资源内容改变，ETag 就会改变。              | `"W/123456789"`                                                      |
| **`Expires`**       | HTTP/1.0 的过期时间，**优先读 `Cache-Control`**，它只在兼容老客户端时有意义。       | `Mon, 23 Feb 2026 12:00:00 GMT`                                      |
| **`Last-Modified`** | 资源在服务器上的最后修改时间。                                                      | `Mon, 23 Feb 2026 12:00:00 GMT`                                      |
| **`Age`**           | 这份响应在**中间缓存（CDN / 代理）里已经待了多少秒**，配合 `max-age` 判断还剩多久。 | `3600`                                                               |

### 3.3 跨域资源共享 (CORS 核心)

跨域要成功，**响应头必须由服务器给出**，前端改不了（改了就成伪造了）。这组字段分两类：预检请求的应答，和实际请求的应答。

[width(24,47,29)]

| 字段名                                 | 说明                                                                                            | 常见值 / 示例                                            |
| :------------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **`Access-Control-Allow-Origin`**      | 服务器明确宣告：**允许哪些来源（Origin）的前端代码跨域访问我的资源**。                          | `*` (允许所有，极度危险)<br>`https://www.myfrontend.com` |
| **`Access-Control-Allow-Methods`**     | 在预检请求（OPTIONS）中返回，告知前端跨域请求被允许使用哪些 HTTP 方法。                         | `GET, POST, PUT, DELETE`                                 |
| **`Access-Control-Allow-Headers`**     | 在预检请求中返回，告知前端允许携带哪些**自定义请求头**。                                        | `Content-Type, Authorization, App-Device-Id`             |
| **`Access-Control-Allow-Credentials`** | 是否允许前端跨域请求携带 Cookie。如果设为 `true`，`Allow-Origin` 绝对不能设为 `*`。             | `true`                                                   |
| **`Access-Control-Max-Age`**           | 预检结果可以缓存多少秒，**避免每次跨域请求都多一次 `OPTIONS` 往返**。                           | `86400`                                                  |
| **`Access-Control-Expose-Headers`**    | 默认前端只能读到少数几个“**安全**”响应头，想读到 `X-Total-Count` 之类的自定义头必须在这里声明。 | `X-Total-Count, Content-Disposition`                     |

> [!NOTE] 跨域读不到自定义响应头，是最常见的“跨域明明成功了却拿不到数据”的原因
> CORS 通过只代表“**请求发出去并且响应能被 JS 读到**”。但**响应头默认只有 `Cache-Control`、`Content-Language`、`Content-Length`、`Content-Type`、`Expires`、`Last-Modified`、`Pragma` 这几个能被 JS 读到**，其它（包括 `Content-Disposition`、`X-Total-Count`）必须由服务端用 `Access-Control-Expose-Headers` 显式暴露。做“**导出文件**”功能时如果拿不到文件名，多半是这个原因。

### 3.4 安全相关响应头

这些头部前端**设置不了**（要由服务器下发），但前端排查安全问题时会经常遇到，值得认识：

[width(24,48,28)]

| 字段名                             | 作用                                                                                     | 常见值 / 示例                           |
| :--------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------- |
| **`Strict-Transport-Security`**    | HSTS：命令浏览器**在指定时间内只能用 HTTPS 访问本站**，连第一次的 `http://` 跳转都省掉。 | `max-age=31536000; includeSubDomains`   |
| **`Content-Security-Policy`**      | CSP：限制页面能加载/执行哪些来源的资源，是防 XSS 的最后一道防线。                        | `default-src 'self'; script-src 'self'` |
| **`X-Content-Type-Options`**       | 设为 `nosniff` 时，禁止浏览器“猜”资源类型（防止把用户上传的 `.txt` 当脚本执行）。        | `nosniff`                               |
| **`X-Frame-Options`**              | 是否允许本页面被 `<iframe>` 嵌套，防点击劫持。已被 CSP 的 `frame-ancestors` 部分取代。   | `DENY`、`SAMEORIGIN`                    |
| **`Referrer-Policy`**              | 控制 `Referer` 头带多少信息出去。                                                        | `strict-origin-when-cross-origin`       |
| **`Permissions-Policy`**           | 声明本页可以用哪些浏览器能力（摄像头、定位）。                                           | `geolocation=(), camera=()`             |
| **`Cross-Origin-Resource-Policy`** | 声明本资源可以被谁 `<script>` / `<img>` 等标签引用，是 COEP 时代的补充防护。             | `same-origin`、`cross-origin`           |

### 3.5 内容分发与范围

[width(24,59,17)]

| 字段名                 | 说明                                                  | 常见值 / 示例       |
| :--------------------- | :---------------------------------------------------- | :------------------ |
| **`Accept-Ranges`**    | 声明本资源支持按字节范围请求。                        | `bytes`             |
| **`Content-Range`**    | 与 `206` 配合，说明本次返回的是完整资源的哪一段。     | `bytes 0-1023/2000` |
| **`Content-Language`** | 响应正文的自然语言，与请求的 `Accept-Language` 对应。 | `zh-CN`             |

## 4. 实体头 (Entity Headers)

**既可用于请求，也可用于响应。** 专门用来描述请求正文（Request Body）或响应正文（Response Body）的数据特征。这一组是最容易混的，值得单独看清楚。

### 4.1 `Content-Type`：正文到底是什么

`Content-Type` 由两部分组成：**MIME 类型** + 可选的 **`charset` 参数**。格式是 `type/subtype; 参数`。

```http
Content-Type: application/json; charset=utf-8
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
```

[width(45,55)]

| MIME 类型                              | 用途                                                                                |
| :------------------------------------- | :---------------------------------------------------------------------------------- |
| `text/html`                            | HTML 页面。                                                                         |
| `text/css` / `text/javascript`         | 样式与脚本。                                                                        |
| `application/json`                     | JSON 数据（前后端分离时代的主流）。                                                 |
| `application/x-www-form-urlencoded`    | 传统的表单提交，键值对用 `&` 连接。                                                 |
| `multipart/form-data`                  | 带文件的表单提交，各字段用 `boundary` 分隔。                                        |
| `text/event-stream`                    | SSE 流式推送（见 [实时通信](/networkAndBrowsers/realtime/realtimeCommunication)）。 |
| `image/png`、`video/mp4`、`font/woff2` | 各类二进制资源。                                                                    |

**三种“表单”格式的区别**：

[width(27,23,16,18,16)]

| 格式                                | 编码方式                                     | 能传文件            | 触发跨域预检 | 典型场景                 |
| :---------------------------------- | :------------------------------------------- | :------------------ | :----------- | :----------------------- |
| `application/x-www-form-urlencoded` | 键值对做 URL 编码，`a=1&b=2`                 | ❌                  | 否           | 传统表单提交             |
| `multipart/form-data`               | 每段自带 `Content-Disposition`，二进制原样传 | ✅                  | 否           | **文件上传**、`FormData` |
| `application/json`                  | JSON 字符串，可嵌套                          | ❌（要自己 Base64） | **是**       | 现代前后端接口           |

### 4.2 四个容易混的正文头

[width(25,49,26)]

| 字段名                  | 说明                                                                                                                   | 常见值 / 示例                                                                           |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **`Content-Type`**      | **极其重要！** 明确告知接收方：**Body 里的数据到底是什么格式**，以及采用了什么字符编码。接收方靠它来决定如何解析数据。 | `application/json; charset=utf-8`<br>`application/x-www-form-urlencoded`<br>`image/png` |
| **`Content-Encoding`**  | 表明 Body 数据在网络传输前**实际采用了哪种压缩算法**。接收方收到后必须用同种算法解压。                                 | `gzip`, `br`                                                                            |
| **`Content-Length`**    | 明确指出 Body 数据的大小（字节数）。让接收方知道何时接收完毕。**注意这是压缩后的长度。**                               | `1024`                                                                                  |
| **`Transfer-Encoding`** | 说明 Body 是以什么方式**分块传输**的。与 `Content-Length` **互斥**，同时出现是协议错误。                               | `chunked`                                                                               |

## 5. 常见问题 (FAQ) 与经典面试题

### 5.1 `Accept` 和 `Content-Type` 到底有什么区别？

- **`Accept` (只在请求头里)**：是**接收方**的期望。客户端对服务器说：“我**希望**你给我返回 `application/json` 格式的数据”。
- **`Content-Type` (请求和响应都有)**：是**发送方**的声明。
  - 在请求里：客户端对服务器说：“我塞在 Body 传给你的数据**实际是** `application/json`”。
  - 在响应里：服务器对客户端说：“我查完数据库了，现在返回给你的 Body 数据**实际是** `application/json`”。

### 5.2 前后端分离跨域时，请求头和响应头是如何配合的？

跨域（CORS）是一场前端浏览器与后端服务器之间的“**安全握手**”：

- **请求头出击**：浏览器发现你在跨域，会自动在请求头加上 `Origin: http://前端域名.com`。
- **响应头裁决**：后端服务器收到请求，检查这个 `Origin`。如果同意，就在响应头里加上 `Access-Control-Allow-Origin: http://前端域名.com`。
- **浏览器放行**：浏览器收到响应，核对请求的 `Origin` 和响应的 `Allow-Origin` 是否匹配。匹配则把数据交给 JavaScript；不匹配则在控制台抛出著名的 CORS 跨域红字报错。

如果是**非简单请求**（比如带自定义头、或 `Content-Type: application/json`），浏览器会先发一次 `OPTIONS` 预检，等服务器用 `Access-Control-Allow-Methods` / `Access-Control-Allow-Headers` 明确点头，才发真正的请求。**这就是“明明是一个请求，Network 面板里却出现两条”的原因。**

### 5.3 `Cookie` 和 `Set-Cookie` 是如何实现状态保持的？

HTTP 本身不记仇（无状态），它们俩配合实现了“**记忆**”：

1.  你输入账号密码登录，服务器验证成功。
2.  服务器在**响应头**中下发：`Set-Cookie: session_id=888; HttpOnly`。
3.  浏览器看到 `Set-Cookie`，默默把它存到本地硬盘或内存里。
4.  之后你点开网站的任何其他页面，浏览器会自动在**请求头**中携带：`Cookie: session_id=888`。
5.  服务器读取请求头里的 `Cookie`，一看是 `888`，就知道是你，直接放行。

几个关键点：**跨域携带 Cookie 需要 `fetch` 的 `credentials: 'include'` + 服务端 `Access-Control-Allow-Credentials: true`，而且此时 `Allow-Origin` 不能是 `*`**；`HttpOnly` 的 Cookie JS 读不到（防 XSS 偷取）；`SameSite` 决定跨站请求带不带它（防 CSRF）。完整属性见 [Cookie 与浏览器存储](/networkAndBrowsers/browser/cookieAndStorage)。

### 5.4 什么是自定义请求头？如何设置？

业务开发中，我们经常需要传递标准协议之外的信息（如 Token、设备 ID 等）。

- **旧规范**：过去习惯加 `X-` 前缀（如 `X-Requested-With`, `X-Token`），但这已被 IETF 官方废弃，因为容易造成命名混乱。
- **新规范**：直接使用清晰达意的英文单词连字符命名即可，比如 `Api-Version`, `App-Device-Id`。
- **注意（跨域陷阱）**：如果前端跨域发送了**自定义请求头**，会触发浏览器的“**预检请求（OPTIONS）**”。后端必须在响应头 `Access-Control-Allow-Headers` 中明确允许这个自定义头（例如 `Access-Control-Allow-Headers: Content-Type, App-Device-Id`），否则跨域会失败。
- **注意（读响应）**：反向的坑同样存在——前端想读**自定义响应头**，服务端必须用 `Access-Control-Expose-Headers` 暴露它。

### 5.5 `Accept-Encoding`、`Content-Encoding`、`Content-Length`、`Transfer-Encoding` 和 `Vary` 是怎么配合的？

一个响应正文从服务器到浏览器，要过三道约定：**能不能压 → 怎么切块 → 缓存怎么不串味**。

- **压缩协商**：浏览器在请求头带上 `Accept-Encoding: gzip, br`（我支持解压 gzip 和 brotli）；服务器挑一个自己支持的（比如 gzip）压缩 Body，并在响应头带 `Content-Encoding: gzip` 告知；浏览器据此解压。**两边不一致，页面就是乱码。**
  - 代价一：图片、视频本身就是压缩格式，再压一遍通常更大，所以静态资源服务器一般只对文本类资源开 gzip。
  - 代价二：压缩会放大压缩侧信道攻击（BREACH 之类），敏感页面要慎用。
- **长度与分块二选一**：`Content-Length` **提前声明**总长度，读完就算结束；`Transfer-Encoding: chunked` **边生成边发**，每块前面标注本块长度，以长度为 `0` 的块收尾。**两者互斥，同时出现是协议错误**；两者都没有时，接收方只能读到**连接关闭**为止（HTTP/1.0 的行为），连接无法复用。做流式接口（SSE、流式输出大模型回复）时看到的正是 chunked——HTTP/2 里对应的概念是流，不再用 chunked。
- **缓存键靠 `Vary` 分开**：响应带了 `Content-Encoding`，就**必须同时带 `Vary: Accept-Encoding`**，否则 CDN 会把压缩版返回给不支持 gzip 的老客户端，对方拿到一堆乱码。同理，多语言接口没写 `Vary: Accept-Language`，就会出现“**中文用户看到英文页面**”的串味现象。
  - 规则：**只要响应内容随某个请求头变化，就必须把它写进 `Vary`**。
  - 但也要克制：`Vary: *`、或把 `User-Agent` 写进 `Vary`，会让缓存几乎完全失效（UA 的种类太多了）。详见 [前端缓存策略](/networkAndBrowsers/caching/frontendCacheStrategy)。

### 5.6 为什么我在前端设置 `Host`、`Cookie`、`Origin` 都不生效？

因为这些都属于**禁设头部 (Forbidden Header Name)**：它们由浏览器统一管理或按安全策略计算，JS 写进去会被**静默忽略**（多半不报错，所以特别难排查）。

这也解释了几类常见困惑：

- 想改 `Origin` 绕过跨域校验 → 不可能，否则同源策略就没有意义了。
- 想手写 `Cookie` 头 → 不行，得用 `credentials` 或 `document.cookie`。
- 想自定义 `Content-Length` → 不行，长度由你实际传的 body 决定。
