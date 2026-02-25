# HTTP 请求头与响应头常见类型

在 HTTP 协议中，Header（头部）是以键值对 `Key: Value` 形式存在的元数据，它们负责在客户端（如浏览器）和服务器之间传递控制信息、状态信息以及对数据的描述。

为了便于理解，我们将最常用的 HTTP 头部按**流向**和**功能**分为三大类：请求头、响应头和实体头（描述正文数据的头，两者皆可使用）。

## 1. 常见请求头 (Request Headers)
**流向：客户端 -> 服务器。**
用于向服务器传递客户端的自身属性、用户的偏好设置以及请求的上下文信息。

### 1.1 客户端信息与内容协商 (告诉服务器“我是谁，我要什么”)
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`User-Agent`** | 包含了发出请求的客户端（浏览器、操作系统）的详细信息。常用于服务器进行设备判断（PC 还是移动端）或数据统计。 | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...` |
| **`Accept`** | 告诉服务器客户端**期望接收**的数据格式（MIME 类型）。 | `application/json`, `text/html`, `image/webp` |
| **`Accept-Encoding`** | 告诉服务器客户端支持的**内容压缩格式**，服务器可据此压缩响应体积。 | `gzip, deflate, br` (Brotli) |
| **`Accept-Language`** | 告诉服务器客户端偏好的语言，用于国际化（i18n）多语言支持。 | `zh-CN, zh;q=0.9, en;q=0.8` |

### 1.2 身份验证与状态维持
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Authorization`** | 携带身份验证凭证（如 Token 或账号密码），证明客户端有权访问该 API 接口。 | `Bearer eyJhbGciOiJIUzI1Ni...`<br>`Basic YWRtaW46MTIzNDU2` |
| **`Cookie`** | 将浏览器本地存储的、属于该域名的 Cookie 数据发送给服务器，用于维持登录状态（Session）或用户追踪。 | `sessionId=123abc456def; theme=dark` |

### 1.3 路由、来源与安全 (CORS)
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Host`** | **(HTTP/1.1 唯一必填字段)** 指定请求的服务器域名和端口号。用于物理服务器区分不同的虚拟主机（同一 IP 下的不同网站）。 | `www.example.com`<br>`api.example.com:8080` |
| **`Referer`** | 记录了当前请求是**从哪个页面的 URL 跳转或发起**的。常用于防盗链（防止别人引用你的图片）和流量分析。（注：历史上拼写错误，少了一个 r，沿用至今）。 | `https://www.google.com/` |
| **`Origin`** | 发起**跨域请求 (CORS)** 时由浏览器自动携带，只包含协议+域名+端口，不包含路径。用于服务器判断是否允许跨域。 | `https://www.myfrontend.com` |

### 1.4 协商缓存验证 (配合响应头使用)
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`If-None-Match`** | 将上次服务器给的 `ETag` 值发回，询问服务器资源变了没。没变则服务器返回 304。 | `"33a64df551425fcc..."` |
| **`If-Modified-Since`**| 将上次服务器给的 `Last-Modified` 值发回，询问自该时间后资源修改了没。 | `Wed, 21 Oct 2026 07:28:00 GMT` |

## 2. 常见响应头 (Response Headers)
**流向：服务器 -> 客户端。**
用于向客户端传递服务器自身信息、指示客户端进行特定操作（如重定向、存 Cookie）以及跨域权限配置。

### 2.1 状态指示与控制
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Server`** | 包含了处理请求的服务器软件及其版本信息（出于安全考虑，常被隐藏或修改）。 | `nginx/1.20.1`, `Apache`, `Tengine` |
| **`Set-Cookie`** | 服务器通过此字段**命令浏览器保存 Cookie**。可以设置过期时间 (`Expires`)、生效路径 (`Path`)、仅限 HTTP 访问 (`HttpOnly`) 等属性。 | `sessionid=xyz123; HttpOnly; Secure; Path=/` |
| **`Location`** | 通常与 `3xx`（如 301, 302）状态码配合使用，**命令浏览器跳转（重定向）**到新的 URL 地址。 | `https://www.new-domain.com/login` |
| **`Content-Disposition`**| 指示浏览器应当如何处理响应内容。是直接在页面内展示（`inline`），还是当作**附件下载**（`attachment`）。 | `attachment; filename="report.xlsx"` |

### 2.2 缓存控制 (强缓存与协商缓存)
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Cache-Control`** | **最核心的缓存控制指令**。规定了资源在客户端可以缓存多久，或者是否需要每次都验证。 | `max-age=3600`<br>`no-cache` (需协商验证)<br>`no-store` (绝对不缓存) |
| **`ETag`** | 资源内容的唯一标识符（类似于哈希/指纹）。资源内容改变，ETag 就会改变。 | `"W/123456789"` |
| **`Last-Modified`** | 资源在服务器上的最后修改时间。 | `Mon, 23 Feb 2026 12:00:00 GMT` |

### 2.3 跨域资源共享 (CORS 核心)
| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Access-Control-Allow-Origin`** | 服务器明确宣告：**允许哪些来源（Origin）的前端代码跨域访问我的资源**。 | `*` (允许所有，极度危险)<br>`https://www.myfrontend.com` |
| **`Access-Control-Allow-Methods`**| 在预检请求（OPTIONS）中返回，告知前端跨域请求被允许使用哪些 HTTP 方法。 | `GET, POST, PUT, DELETE` |
| **`Access-Control-Allow-Credentials`**| 是否允许前端跨域请求携带 Cookie。如果设为 `true`，`Allow-Origin` 绝对不能设为 `*`。 | `true` |

## 3. 实体头 (Entity Headers)
**既可用于请求，也可用于响应。** 专门用来描述请求正文（Request Body）或响应正文（Response Body）的数据特征。

| 字段名 | 说明 | 常见值 / 示例 |
| :--- | :--- | :--- |
| **`Content-Type`** | **极其重要！** 明确告知接收方：**Body 里的数据到底是什么格式**，以及采用了什么字符编码。接收方靠它来决定如何解析数据。 | `application/json; charset=utf-8`<br>`application/x-www-form-urlencoded`<br>`image/png` |
| **`Content-Length`** | 明确指出 Body 数据的大小（字节数）。让接收方知道何时接收完毕。 | `1024` |
| **`Content-Encoding`** | 表明 Body 数据在网络传输前**实际采用了哪种压缩算法**。接收方收到后必须用同种算法解压。 | `gzip`, `br` |

## 4. 常见问题 (FAQ) 与经典面试题

### 4.1 `Accept` 和 `Content-Type` 到底有什么区别？
这是一个极度容易混淆的概念：
*   **`Accept` (只在请求头里)**：是**接收方**的期望。客户端对服务器说：“我**希望**你给我返回 `application/json` 格式的数据”。
*   **`Content-Type` (请求和响应都有)**：是**发送方**的声明。
    *   在请求里：客户端对服务器说：“我塞在 Body 传给你的数据**实际是** `application/json`”。
    *   在响应里：服务器对客户端说：“我查完数据库了，现在返回给你的 Body 数据**实际是** `application/json`”。

### 4.2 前后端分离跨域时，请求头和响应头是如何配合的？
跨域（CORS）是一场前端浏览器与后端服务器之间的“安全握手”：
1.  **请求头出击**：浏览器发现你在跨域，会自动在请求头加上 `Origin: http://前端域名.com`。
2.  **响应头裁决**：后端服务器收到请求，检查这个 `Origin`。如果同意，就在响应头里加上 `Access-Control-Allow-Origin: http://前端域名.com`。
3.  **浏览器放行**：浏览器收到响应，核对请求的 `Origin` 和响应的 `Allow-Origin` 是否匹配。匹配则把数据交给 JavaScript；不匹配则在控制台抛出著名的 CORS 跨域红字报错。

### 4.3 `Cookie` 和 `Set-Cookie` 是如何实现状态保持的？
HTTP 本身不记仇（无状态），它们俩配合实现了“记忆”：
1.  你输入账号密码登录，服务器验证成功。
2.  服务器在**响应头**中下发：`Set-Cookie: session_id=888; HttpOnly`。
3.  浏览器看到 `Set-Cookie`，默默把它存到本地硬盘或内存里。
4.  之后你点开网站的任何其他页面，浏览器会自动在**请求头**中携带：`Cookie: session_id=888`。
5.  服务器读取请求头里的 `Cookie`，一看是 `888`，就知道是你，直接放行。

### 4.4 什么是自定义请求头？如何设置？
业务开发中，我们经常需要传递标准协议之外的信息（如 Token、设备 ID 等）。
*   **旧规范**：过去习惯加 `X-` 前缀（如 `X-Requested-With`, `X-Token`），但这已被 IETF 官方废弃，因为容易造成命名混乱。
*   **新规范**：直接使用清晰达意的英文单词连字符命名即可，比如 `Api-Version`, `App-Device-Id`。
*   **注意（跨域陷阱）**：如果前端跨域发送了**自定义请求头**，会触发浏览器的“预检请求（OPTIONS）”。后端必须在响应头 `Access-Control-Allow-Headers` 中明确允许这个自定义头（例如 `Access-Control-Allow-Headers: Content-Type, App-Device-Id`），否则跨域会失败。

### 4.5 `Accept-Encoding` 和 `Content-Encoding` 的配合机制？
1.  浏览器在请求头带上 `Accept-Encoding: gzip, br`，表示：“我支持解压 gzip 和 brotli”。
2.  服务器看到后，挑一个自己支持且压缩率最高的（比如 gzip），把响应 Body 压缩。
3.  服务器在响应头带上 `Content-Encoding: gzip` 发给浏览器，表示：“我用 gzip 压缩过了”。
4.  浏览器收到后，看到 `gzip` 标记，就用 gzip 算法解压 Body，然后渲染页面。如果两边不一致，页面就会显示乱码。