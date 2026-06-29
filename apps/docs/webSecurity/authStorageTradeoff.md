# JWT / Cookie / Session 的前端安全取舍

前端登录态方案没有绝对最优，只有取舍。真正要判断的是：**凭证放在哪里、是否会被浏览器自动发送、能否主动失效、如何抵御 XSS 和 CSRF**。

## 1. 基础概念

| 概念         | 本质                           | 常见存储位置                   | 验证方式                       |
| :----------- | :----------------------------- | :----------------------------- | :----------------------------- |
| Cookie       | 浏览器的键值存储和自动携带机制 | 浏览器 Cookie Jar              | 服务端从请求 Cookie 中读取     |
| Session      | 服务端保存的会话状态           | 服务端内存 / Redis / DB        | 服务端根据 `session_id` 查会话 |
| JWT          | 自包含的签名令牌格式           | Cookie / localStorage / 内存等 | 服务端校验签名和声明           |
| Access Token | 访问受保护资源的业务凭证       | Header / Cookie / 内存等       | 服务端校验凭证和权限           |
| CSRF Token   | 防止跨站请求伪造的随机令牌     | 页面 / JS 变量 / Header        | 服务端比对随机令牌             |

### 1.1 Cookie 常用安全属性

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

几个关键点：

- `HttpOnly` 只能防止 JS 读取 Cookie，不能阻止 XSS 脚本借用当前页面身份调用接口。
- `Secure` 依赖 HTTPS，不能替代 HSTS；HSTS 负责让浏览器以后强制走 HTTPS。
- `SameSite=Lax` 能挡住很多 CSRF，但不能替代 CSRF Token 和服务端来源校验。
- `SameSite=None` 必须配合 `Secure`，常见于第三方登录、跨站 iframe、跨站前后端分离。

## 2. Session + Cookie

典型流程：

1. 用户提交账号密码。
2. 服务端验证成功，生成 `session_id`。
3. 服务端把会话数据保存在 Redis 或数据库。
4. 通过 `Set-Cookie` 把 `session_id` 下发给浏览器。
5. 后续请求浏览器自动携带 Cookie。
6. 服务端根据 `session_id` 查询会话。

```http
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```

### 2.1 优点

- 服务端可主动失效会话，适合强管控系统。
- Cookie 设置 `HttpOnly` 后，JS 无法读取登录凭证。
- 浏览器自动携带 Cookie，对前端请求代码侵入小。
- 服务端只暴露随机 `session_id`，真正的用户信息、权限、登录状态保存在服务端。

### 2.2 风险

- Cookie 自动携带，天然需要防 CSRF。
- 服务端需要保存会话状态，横向扩展依赖共享存储。
- 跨域前后端分离时，需要正确配置 CORS credentials。
- 如果 `session_id` 泄露，攻击者可以在会话有效期内冒用身份。
- 如果 Session 存储没有统一失效机制，多端登出、封禁用户、权限变更会变复杂。

### 2.3 适用场景

- 后台管理系统、企业内部系统、金融支付等需要服务端强控制的系统。
- 页面和 API 在同一个站点下的传统 Web 应用。
- 需要支持主动踢下线、修改密码后全端失效、管理员封禁等能力的业务。

### 2.4 常见防护组合

- 登录态 Cookie 使用 `HttpOnly; Secure; SameSite=Lax`。
- 高风险操作使用 CSRF Token，并校验 `Origin` / `Referer`。
- Session 服务端设置空闲过期时间和绝对过期时间。
- 修改密码、重置 MFA、管理员封禁后，服务端主动失效相关 Session。

## 3. JWT

**核心本质**：JWT 是一个带签名的字符串，通常包含用户 ID、过期时间、权限范围等声明。服务端验证签名即可判断令牌是否可信。

JWT 常见结构：

```text
header.payload.signature
```

JWT 的重点不是“放在哪里都安全”，而是：

- 签名只能证明 Token 没被篡改，不能防止 Token 被偷后复用。
- JWT 默认无状态，服务端不保存会话，所以主动注销和权限立即回收更麻烦。
- JWT 一旦发出，在过期前通常都有效，除非服务端额外维护黑名单、令牌版本号或会话版本。

### 3.1 JWT 放在 localStorage

前端登录后保存 Token：

```js
localStorage.setItem('access_token', token)
```

请求时手动放入 Header：

```js
fetch('/api/user', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

优点：

- 不依赖 Cookie 自动携带，传统 CSRF 风险低。
- 跨域 API 使用简单，不需要 Cookie credentials。
- 适合纯 API、移动端、多端统一鉴权。

风险：

- 一旦 XSS 成功，攻击脚本可以直接读取 localStorage。
- Token 失窃后，在过期前可能被攻击者复用。
- 前端需要处理刷新、失效、并发请求等复杂逻辑。
- localStorage 是长期持久化存储，关闭页面后仍然存在，不适合保存长期高权限令牌。
- 浏览器插件、供应链脚本、第三方 SDK 一旦被滥用，也可能扩大暴露面。

适合场景：

- 纯 API 服务、多端统一鉴权、非浏览器客户端复用同一套 `Authorization` 机制。
- Token 生命周期很短，并且站点已经有较强的 XSS 防护和 CSP 约束。

### 3.2 JWT 放在 HttpOnly Cookie

```http
Set-Cookie: access_token=jwt; HttpOnly; Secure; SameSite=Lax; Path=/
```

优点：

- JS 无法读取 Token，降低 XSS 窃取凭证的风险。
- 浏览器自动携带 Cookie，请求代码更简单。

风险：

- 因为 Cookie 自动携带，仍然需要防 CSRF。
- 跨域场景需要 `SameSite=None; Secure` 和 CORS credentials，复杂度上升。
- JWT 仍然有注销和主动失效难题，需要黑名单、版本号或短时效配合。
- 如果把长期 JWT 放进 Cookie，虽然 JS 读不到，但被 CSRF 借用的时间窗口会变长。

适合场景：

- 浏览器 Web 应用优先考虑保护令牌不被 JS 直接读取。
- 后端能配合 CSRF Token、SameSite、Origin 校验。

### 3.3 JWT 放在内存

把 access token 只存在 JS 内存变量中，刷新页面即丢失。

优点：

- 不依赖 localStorage，降低持久化泄露风险。
- XSS 仍然危险，但攻击者更难长期窃取静态凭证。

风险：

- 页面刷新后需要依赖 refresh token 恢复登录。
- 多标签页共享状态更麻烦。
- 实现复杂度更高。
- XSS 仍然可以在当前页面生命周期内读取内存变量或直接调用接口。

适合场景：

- 对持久化泄露敏感，但又希望使用 Bearer Token 调 API。
- 可以接受刷新页面后通过刷新接口重新获取 access token 的应用。

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

常见浏览器方案：

- `access token`：短时效，例如 5 到 15 分钟，放在内存中，用于调用业务 API。
- `refresh token`：长时效，放在 `HttpOnly; Secure; SameSite=Lax` Cookie 中，只发送给刷新接口。
- 刷新接口：只接受 `POST`，校验 CSRF Token 或 `Origin`，成功后轮换 refresh token。
- 服务端保存 refresh token 的哈希、设备信息、过期时间、是否已吊销。

这种设计的目标是：access token 被偷后的可用窗口很短；refresh token 不暴露给 JS；refresh token 一旦被使用就轮换，降低重放风险。

### 4.3 刷新令牌轮换

刷新令牌轮换的流程：

1. 客户端携带 refresh token 调用刷新接口。
2. 服务端验证旧 refresh token 是否存在、未过期、未被吊销。
3. 验证通过后，服务端签发新的 access token 和新的 refresh token。
4. 旧 refresh token 立即失效。
5. 如果旧 refresh token 被重复使用，说明可能发生泄露，服务端可以吊销该设备或该用户的所有刷新令牌。

刷新接口本身是高风险接口，因为它能换出新的登录态，所以不能只因为 refresh token 在 HttpOnly Cookie 中就忽略 CSRF。

### 4.4 Cookie JWT 与 CSRF Token 如何协同

在高安全级别的浏览器应用中，常见组合是：

1. 用户登录成功后，后端生成 JWT。
2. 后端将 JWT 作为 Access Token 写入 `HttpOnly Cookie`，降低 XSS 直接窃取风险。
3. 因为 Cookie 会自动携带，系统需要考虑 CSRF。
4. 后端额外生成 CSRF Token，返回给前端页面。
5. 用户发起敏感操作时，请求自动带上 JWT Cookie，同时前端手动在 Header 中带上 CSRF Token。
6. 服务端先验证 CSRF Token，再验证 JWT 身份和权限。

## 5. 不同存储位置的攻击面

认证信息放在哪里，本质上是在 XSS、CSRF、持久化泄露、实现复杂度之间做取舍。

| 存储方式                           | XSS 窃取风险 | CSRF 风险 | 典型防护                          |
| :--------------------------------- | :----------- | :-------- | :-------------------------------- |
| localStorage + Authorization       | 高           | 低        | CSP、输入转义、短时效 Token       |
| HttpOnly Cookie + Session          | 低           | 高        | SameSite、CSRF Token、Origin 校验 |
| HttpOnly Cookie + JWT              | 低           | 高        | SameSite、CSRF Token、短时效 JWT  |
| 内存 Access Token + Refresh Cookie | 中           | 中        | 短时效、刷新轮换、CSRF 防护       |

重点：`HttpOnly` 防的是“被 JS 读取”，不是防止 XSS 执行操作。只要页面发生 XSS，攻击脚本仍然可以调用接口，浏览器会自动带上 Cookie。

### 5.1 为什么 localStorage 的 CSRF 风险低？

CSRF 的关键是“**浏览器自动带凭证**”。localStorage 里的 Token 不会自动出现在请求里，必须由前端 JS 读取后写入 `Authorization` Header。

攻击者页面可以诱导浏览器发 `<img>`、`form`、`script` 请求，但不能跨站读取你站点的 localStorage，也不能让你的业务 JS 帮它加上 `Authorization` Header。所以 localStorage + Authorization Header 通常不容易被传统 CSRF 利用。

但是这不代表它更安全：一旦发生 XSS，攻击脚本可以直接读取 localStorage 里的 Token，然后发给攻击者服务器。

### 5.2 为什么 HttpOnly Cookie 的 XSS 窃取风险低但 CSRF 风险高？

`HttpOnly` 让 JS 不能读取 Cookie，因此攻击脚本无法直接 `document.cookie` 拿走登录态。

但 Cookie 的另一个特点是自动携带。只要请求目标匹配 Cookie 的 `Domain`、`Path`、`SameSite` 规则，浏览器就会自动带上它。攻击者虽然看不到 Cookie 内容，但可以诱导浏览器“**带着 Cookie 去请求目标站点**”，这就是 CSRF 的基础。

### 5.3 XSS 和 CSRF 的优先级

从破坏力看，XSS 通常比 CSRF 更危险：

- XSS 可以读取非 HttpOnly 存储，如 localStorage、sessionStorage、DOM 中的 CSRF Token。
- XSS 可以直接在用户页面里发请求，绕过很多 CSRF Token 设计。
- XSS 可以篡改页面、钓鱼、记录输入、修改用户操作。

所以认证存储的取舍不能只看“**是否防 CSRF**”，还要看 XSS 成功后的影响面。

## 6. 选型建议

| 场景                 | 推荐方案                                    |
| :------------------- | :------------------------------------------ |
| 传统同域 Web 应用    | Session + HttpOnly Cookie                   |
| 前后端分离但同主站   | HttpOnly Cookie + SameSite + CSRF Token     |
| 纯 API、多端统一鉴权 | JWT + Authorization Header                  |
| 高安全后台系统       | Session + 短过期 + 二次验证                 |
| 需要兼顾体验和安全   | 内存 Access Token + HttpOnly Refresh Cookie |

更具体的判断方式：

- 如果你最需要“**服务端可控、可踢下线、权限立即生效**”，优先 Session。
- 如果你最需要“**多端统一、API 网关统一验签、减少服务端会话状态**”，可以用 JWT，但要接受主动失效成本。
- 如果是浏览器 Web 应用，不要只因为“**JWT 流行**”就把长期 Token 放 localStorage。
- 如果使用 Cookie 鉴权，默认把 CSRF 防护当作必做项。
- 如果使用 Authorization Header，默认把 XSS 防护和短时效当作必做项。

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

JWT 证明“**请求者有合法身份**”，CSRF Token 证明“**请求来自真实页面的主动提交**”，二者解决的问题不同。

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

## 8. 前端必须避免的做法

- 不要把长期有效 Token 放在 localStorage。
- 不要把密钥、私钥、JWT 签名 secret 放进前端代码。
- 不要用 GET 接口做转账、删除、改密码等变更操作。
- 不要认为用了 JWT 就一定没有 CSRF，关键看 JWT 是否放在 Cookie。
- 不要只依赖前端路由守卫做权限控制，服务端必须重新鉴权。
- 不要把 access token、refresh token、用户权限长期塞进普通 JS 可读变量后又持久化。
- 不要在多个子域名之间随意共享认证 Cookie，`Domain=.example.com` 会扩大攻击面。
- 不要把刷新接口设计成 GET，也不要让刷新接口缺少来源校验。
