# 前端身份凭证与安全取舍

前端登录态方案没有绝对的最优解，本质是在 **持久化安全 (防 XSS)、传输安全 (防 CSRF) 与架构复杂度** 之间做权衡。

## 1. 基础概念与凭证载体

| 概念             | 本质定义                           | 常见存储位置                 | 验证逻辑                               |
| ---------------- | ---------------------------------- | ---------------------------- | -------------------------------------- |
| **Cookie**       | 浏览器的 KV 存储与跨站自动携带机制 | 浏览器 Cookie Jar            | 服务端从 HTTP 请求头中提取并读取       |
| **Session**      | 服务端强状态化的会话标识           | 服务端内存 / Redis / DB      | 依据前端传入的 `session_id` 查库核对   |
| **JWT**          | 无状态、自包含的加密签名令牌格式   | Cookie / localStorage / 内存 | 服务端仅靠 CPU 校验签名与过期声明      |
| **Access Token** | 访问受保护资源的短效业务通行证     | Header / Cookie / 内存       | 验证身份与具体 API 权限                |
| **CSRF Token**   | 防御跨站请求伪造的强随机暗号       | 页面 DOM / JS 变量 / Header  | 服务端比对暗号一致性，证明请求来源合法 |

### 1.1 Cookie 核心安全属性配置矩阵

认证 Cookie 的安全性很大程度取决于属性配置。

```http
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```

| 属性                  | 作用                                | 认证场景建议                     |
| :-------------------- | :---------------------------------- | :------------------------------- |
| `HttpOnly`            | 禁止 JS 通过 `document.cookie` 读取 | 登录态 Cookie 必加               |
| `Secure`              | 只允许 HTTPS 传输                   | 生产环境必加                     |
| `SameSite`            | 控制跨站请求是否自动带 Cookie       | 默认 `Lax`，高敏感可用 `Strict`  |
| `Path`                | 限制 Cookie 发送路径                | 通常设为 `/` 或更小范围          |
| `Domain`              | 限制 Cookie 发送域名                | 能不设置就不设置，避免扩大作用域 |
| `Max-Age` / `Expires` | 控制 Cookie 过期时间                | 根据会话类型设置短期或长期       |

- **HttpOnly**：物理隔绝 JS 通过 `document.cookie` 读取凭证。**建议：登录态 Cookie 必加。**
- **Secure**：强制仅在 HTTPS 下传输。**建议：生产环境必加。**
- **SameSite**：限制跨站请求携带。`Strict` (全拦截) / `Lax` (部分放行) / `None` (全放行)。**建议：默认 `Lax`。**

## 2. Session + Cookie

### 2.1 流转逻辑

校验账号密码 ➔ 服务端生成 `session_id` 并存入 Redis ➔ 通过 `Set-Cookie` 下发 ➔ 后续请求自动携带 ➔ 服务端查库鉴权。

| 优势                                                                                                   | 风险                                                                           | 最佳实践                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **强管控**：服务端可随时吊销会话。**防 XSS**：配合 `HttpOnly` 可防窃取。**零侵入**：前端无需手动处理。 | **需防 CSRF**：自动携带机制暴露于伪造风险。**扩展性**：需依赖 Redis 共享状态。 | Cookie 设为 `HttpOnly; Secure; SameSite=Lax`。写操作校验 CSRF Token 与 `Origin`。吊销权限后服务端即刻删除对应 Session。 |

### 2.2 完整流程图

![Logo](/img/sessionAndCookie.webp)

## 3. JWT 存储策略

JWT 核心在于无状态，其防御重点取决于前端的存储位置：

| 存储位置            | 优势                                   | 核心风险                             | 适用场景                |
| ------------------- | -------------------------------------- | ------------------------------------ | ----------------------- |
| **localStorage**    | 免疫传统 CSRF；多端鉴权统一。          | **XSS 极高危**：凭证易被持久盗取。   | 纯 API 服务、多端架构。 |
| **HttpOnly Cookie** | **XSS 低危**：JS 无法读取 Token 实体。 | **复活 CSRF**：需引入 CSRF 防御。    | 高安全 Web 后台。       |
| **JS 内存变量**     | 防持久化泄露，刷新页面即销毁。         | 实现复杂度高，需配合 Refresh Token。 | 极度敏感的金融系统。    |

## 4. Access Token、Refresh Token 与 CSRF Token

### 4.1 基础属性对比

| 对比维度           | Access Token           | Refresh Token              | CSRF Token                |
| :----------------- | :--------------------- | :------------------------- | :------------------------ |
| 核心职责           | 调用业务接口           | 换取新的 Access Token      | 证明请求来自真实页面      |
| 生命周期           | 短                     | 长                         | 通常与页面或 Session 绑定 |
| 是否代表用户权限   | 是                     | 间接代表                   | 否                        |
| 是否应包含业务数据 | 视实现而定             | 不建议暴露给前端 JS        | 否                        |
| 常见位置           | Header / 内存 / Cookie | HttpOnly Cookie / 安全存储 | Header / 表单隐藏字段     |
| 主要风险           | 被偷后可直接调用接口   | 被偷后可长期续期           | 被 XSS 读取后失效         |

Access Token 可以是 JWT，也可以是不透明随机字符串。CSRF Token 不是登录凭证，它只用于证明“这个请求不是攻击者跨站伪造出来的”。

### 4.2 推荐刷新模型

现代高安全鉴权的标配，旨在平衡“短暴露窗口”与“长体验”。

- **短效 Access Token (5-15分钟)**：放入内存或 Header，专门调用业务 API。
- **长效 Refresh Token (7-30天)**：强制存入 HttpOnly; Secure Cookie，仅用于刷新接口，不暴露给 JS。
- **强制轮换 (Rotation)**：每次刷新产生新对 Token，作废旧 Token。若旧 Token 被二次使用，系统判定为重放攻击，直接吊销该用户全端会话。

## 5. 选型建议

| 场景                 | 推荐方案                                    |
| :------------------- | :------------------------------------------ |
| 传统同域 Web 应用    | Session + HttpOnly Cookie                   |
| 前后端分离但同主站   | HttpOnly Cookie + SameSite + CSRF Token     |
| 纯 API、多端统一鉴权 | JWT + Authorization Header                  |
| 高安全后台系统       | Session + 短过期 + 二次验证                 |
| 需要兼顾体验和安全   | 内存 Access Token + HttpOnly Refresh Cookie |

更具体的判断方式：

- 如果你最需要“**服务端可控、可踢下线、权限立即生效**”，优先 Session。
- 如果你最需要“多端统一、API 网关统一验签、减少服务端会话状态”，可以用 JWT，但要接受主动失效成本。
- 如果是浏览器 Web 应用，不要只因为“**JWT 流行**”就把长期 Token 放 localStorage。
- 如果使用 Cookie 鉴权，默认把 CSRF 防护当作必做项。
- 如果使用 Authorization Header，默认把 XSS 防护和短时效当作必做项。

## 6. 实战建议

- **严禁**将长期有效的 Access Token 直接存入 `localStorage`。
- **严禁**将任何敏感密钥或 Client Secret 写入前端代码。
- **严禁**使用 `GET` 接口执行转账、删除等变更操作。
- **严禁**前端路由守卫替代服务端的权限校验。
- **必须**区分 `401` (登录失效) 与 `403` (无权限) 并实施不同的拦截流。
- **必须**对所有敏感写操作记录审计日志，并由服务端完成数据权限过滤。

## 7. 常见问题 (FAQ)

### 7.1 JWT 一定比 Session 更安全吗？

不一定。JWT 和 Session 解决的是架构问题，不是天然安全等级问题。

- JWT 的优势是无状态、跨服务校验方便、适合多端 API。
- Session 的优势是服务端可控、容易主动失效、适合强管控 Web 系统。
- JWT 如果长期有效且存在 localStorage，被 XSS 偷走后风险很高。
- Session 如果 Cookie 缺少 `SameSite`、CSRF Token、Origin 校验，也容易被 CSRF 利用。

安全性主要取决于存储位置、过期时间、撤销机制、XSS/CSRF 防护，而不是 JWT 或 Session 这个名字。

### 7.2 把 JWT 放 Cookie 里，还算 JWT 吗？

算。JWT 是令牌格式，Cookie 是浏览器存储和发送机制，二者不是互斥关系。

`JWT + Cookie` 的意思是：令牌内容是 JWT，但浏览器通过 Cookie 保存和自动发送它。这样可以用 `HttpOnly` 防止 JS 直接读取 JWT，但也会引入 Cookie 自动携带带来的 CSRF 风险。

### 7.3 JWT 能替代 CSRF Token 吗？

取决于 JWT 存在哪里。

- 如果 JWT 存在 localStorage，并由前端手动放入 `Authorization` Header，传统 CSRF 风险较低，通常不需要 CSRF Token。
- 如果 JWT 存在 Cookie 中，浏览器会自动携带它，仍然需要 `SameSite`、CSRF Token 或 `Origin` 校验。

JWT 证明“请求者有合法身份”，CSRF Token 证明“请求来自真实页面的主动提交”，二者解决的问题不同。

### 7.4 用了 HttpOnly Cookie，是不是就不用管 XSS？

不是。`HttpOnly` 只能防止 JS 读取 Cookie，不能阻止恶意脚本在当前页面里发请求。

如果页面发生 XSS，攻击脚本仍然可以：

- 调用转账、修改资料、删除数据等接口。
- 读取页面中的非敏感但有业务价值的数据。
- 篡改页面内容，诱导用户输入密码或验证码。
- 读取 localStorage、sessionStorage、DOM 中的 CSRF Token。

所以 `HttpOnly` 是降低凭证被偷的风险，不是 XSS 的完整防线。

### 7.5 localStorage + Authorization Header 是不是就不用防 CSRF？

传统 CSRF 风险确实低很多，因为浏览器不会自动把 localStorage 里的 Token 加到跨站请求中。

但仍然要注意两点：

- 如果有 XSS，攻击脚本可以读取 Token 并主动加 `Authorization` Header。
- 如果服务端同时还依赖 Cookie 登录态，那么 Cookie 那部分仍然需要 CSRF 防护。

所以可以说“localStorage + Authorization Header 通常不依赖 CSRF Token”，但不能说“它整体更安全”。

### 7.6 Refresh Token 放 HttpOnly Cookie，刷新接口还需要 CSRF 防护吗？

需要。刷新接口会发放新的 access token，本质上是延长登录态的入口。

如果 refresh token 会被浏览器自动携带，攻击者就可能诱导用户浏览器请求刷新接口。即使攻击者不一定能读取响应内容，也可能造成令牌轮换异常、会话保持、审计干扰等问题。更稳妥的做法是刷新接口使用 `POST`，配合 `SameSite`、CSRF Token 或 `Origin` 校验。

### 7.7 退出登录时，前端删除 Token 就够了吗？

不够，尤其是 refresh token 或 Session 仍然有效时。

- localStorage / 内存中的 access token 可以由前端删除。
- Cookie 需要服务端通过 `Set-Cookie` 设置过期来清除。
- Session 需要服务端删除会话记录。
- Refresh token 需要服务端吊销或标记失效。
- JWT 如果没有服务端状态，退出登录只能清掉客户端副本，已泄露的 JWT 在过期前仍可能可用。

### 7.8 Token 过期时间应该设置多久？

没有固定答案，取决于业务风险和体验要求。

常见做法：

- access token 设置短时效，通常几分钟到十几分钟。
- refresh token 设置较长时效，例如几天到几周，但必须支持轮换和吊销。
- 后台、支付、账号安全等高风险场景，使用更短过期时间和二次验证。
- 长期免登录要和设备管理、异常登录检测、主动吊销配合。
