# OAuth2 / OIDC 登录与授权流程

OAuth2 和 OIDC 经常一起出现，但它们不是同一个东西：**OAuth2 解决授权问题，OIDC 在 OAuth2 之上补充身份认证能力**。

## 1. 核心概念

| 概念    | 解决的问题                 | 典型结果                           |
| :------ | :------------------------- | :--------------------------------- |
| OAuth2  | 第三方应用能否访问用户资源 | `access_token`                     |
| OIDC    | 当前登录用户是谁           | `id_token`                         |
| PKCE    | 授权码被截获后能否被滥用   | `code_verifier` / `code_challenge` |
| Session | 应用自己的登录态           | `HttpOnly Cookie`                  |

一句话区分：

- OAuth2：我允许这个应用访问我的部分数据，但不用把密码给它。
- OIDC：在授权基础上，应用还能确认当前登录用户是谁。
- PKCE：即使授权码被截获，攻击者也无法单独拿它换 Token。

## 2. OAuth2 与 OIDC 的关系

OAuth2 只关心“**能不能访问资源**”，例如读取 GitHub 仓库、访问 Google Calendar、调用云盘 API。

OIDC 在 OAuth2 之上增加身份层，最关键的是 `id_token`：

| 令牌            | 主要用途            | 给谁用                |
| :-------------- | :------------------ | :-------------------- |
| `access_token`  | 调资源服务器 API    | API 网关 / 资源服务器 |
| `refresh_token` | 换新的 access token | 授权服务器            |
| `id_token`      | 表示登录用户身份    | 客户端 / 应用后端     |

前端登录场景中，不建议把第三方 `access_token` 直接当成本系统登录态。更稳妥的做法是：后端完成 code 换 token、验证 `id_token`，然后建立本系统自己的 Session 或业务 Token。

## 3. 核心角色

| 角色                 | 说明                                 |
| :------------------- | :----------------------------------- |
| Resource Owner       | 资源拥有者，通常是用户               |
| Client               | 发起登录或授权的应用                 |
| Authorization Server | 授权服务器，负责登录、授权、发 Token |
| Resource Server      | 资源服务器，提供受保护 API           |
| User Agent           | 浏览器或系统 WebView                 |

在“**使用 GitHub 登录网站**”这个场景中：用户是 Resource Owner；你的网站是 Client；GitHub 登录服务是 Authorization Server；GitHub API 是 Resource Server；浏览器是 User Agent。

## 4. Authorization Code + PKCE

现代 Web 登录优先使用授权码模式。SPA、移动端、桌面端这类公开客户端必须配合 PKCE；传统 Web 应用也可以使用 PKCE 增强安全性。

### 4.1 基础流程

```text
Browser -> App: 点击登录
App -> Authorization Server: 跳转授权地址
Authorization Server -> Browser: 登录并授权
Authorization Server -> App Callback: 返回 code 和 state
App Server -> Authorization Server: code 换 token
App Server -> Browser: 建立本系统登录态
```

步骤拆解：

1. 用户点击“使用 GitHub 登录”。
2. 应用生成 `state`，OIDC 场景再生成 `nonce`。
3. 使用 PKCE 时，应用生成 `code_verifier` 和 `code_challenge`。
4. 浏览器跳转到授权服务器登录页。
5. 用户完成登录和授权。
6. 授权服务器重定向回 `redirect_uri`，带上 `code` 和 `state`。
7. 应用校验 `state`，再用 `code` 换 Token。
8. OIDC 场景校验 `id_token`，然后建立本系统登录态。

### 4.2 为什么不推荐 Implicit Flow？

早期 Implicit Flow 会把 Token 直接放在 URL 片段中返回给前端，现在不推荐。

主要原因：

- Token 暴露在浏览器环境中，更容易被 XSS、浏览器插件、调试工具窃取。
- 前端无法安全保存 `client_secret`。
- Token 可能进入历史记录、日志、错误上报或第三方脚本可见范围。
- Authorization Code + PKCE 已经能覆盖 SPA 登录场景。

### 4.3 PKCE 如何防护授权码被截获？

PKCE 的核心是“**授权请求和换 Token 请求必须由同一个客户端完成**”。

流程：

1. 客户端生成随机字符串 `code_verifier`。
2. 对它做哈希得到 `code_challenge`。
3. 跳转授权服务器时带上 `code_challenge` 和 `code_challenge_method=S256`。
4. 换 Token 时提交原始 `code_verifier`。
5. 授权服务器验证二者是否匹配。

即使攻击者截获了 `code`，没有 `code_verifier` 也无法换取 Token。

## 5. 关键参数

| 参数                         | 作用                 | 安全要求               |
| :--------------------------- | :------------------- | :--------------------- |
| `client_id`                  | 应用标识             | 可公开，不是密钥       |
| `redirect_uri`               | 登录完成后的回调地址 | 必须严格白名单匹配     |
| `response_type=code`         | 使用授权码模式       | 现代 Web 登录首选      |
| `scope=openid profile email` | OIDC 授权范围        | OIDC 必须包含 `openid` |
| `state`                      | 防登录 CSRF          | 发起和回调必须一致     |
| `nonce`                      | 防 ID Token 重放     | OIDC 中必须校验        |
| `code_challenge`             | PKCE 挑战值          | 使用 S256              |
| `code_verifier`              | PKCE 原始随机值      | 只在换 Token 时提交    |

`state` 和 `nonce` 都是随机值，但用途不同：`state` 绑定一次登录请求，防止登录 CSRF；`nonce` 绑定 `id_token`，防止身份令牌被重放。

## 6. 前端与后端职责

| 职责         | 前端                           | 后端                                   |
| :----------- | :----------------------------- | :------------------------------------- |
| 发起登录跳转 | 生成或请求 `state`、PKCE 参数  | 可统一生成授权 URL                     |
| 回调处理     | 读取 `code`、`state`，交给后端 | 校验 `state`，换 Token                 |
| Token 校验   | 不信任前端自行判断             | 校验签名、`iss`、`aud`、`exp`、`nonce` |
| 登录态建立   | 接收应用登录态                 | 下发 HttpOnly Cookie 或业务 Token      |
| 续期与退出   | 调刷新或退出接口               | 轮换 / 吊销 Token，清除 Session        |

更推荐的 Web 架构是后端参与换 Token，并给前端下发本系统的 `HttpOnly; Secure; SameSite=Lax` Session Cookie。这样第三方 Token 不直接暴露给浏览器 JS，业务权限也由本系统统一管理。

## 7. 安全校验重点

### 7.1 必须校验 `state`

`state` 是登录流程里的 CSRF Token。发起登录前生成随机值并保存，回调时必须确认返回的 `state` 与本地一致。

如果不校验，攻击者可能把自己的授权结果绑定到受害者浏览器中，造成登录 CSRF。

### 7.2 回调地址必须严格匹配

授权服务器应该只允许预先登记的 `redirect_uri`，不能使用任意回调地址。

错误示例：

```text
https://app.example.com/callback?next=https://evil.com
```

如果回调后的跳转逻辑没有校验 `next`，可能形成开放重定向，进而泄露授权码或登录结果。

### 7.3 不要把客户端密钥放前端

SPA、移动端、桌面端都属于公开客户端，无法安全保存 `client_secret`。任何放进前端包里的密钥都等于公开。

前端可以保存 `client_id`，但不能保存 `client_secret`、私钥、长期 API Token。

### 7.4 ID Token 必须验证

如果后端接收 `id_token`，必须验证：

- 签名是否可信，公钥是否来自授权服务器 JWKS。
- `iss` 是否是预期授权服务器。
- `aud` 是否是当前应用的 `client_id`。
- `exp`、`iat` 是否在合理时间范围。
- `nonce` 是否与本次登录请求匹配。
- 用户状态是否符合业务要求，例如邮箱是否已验证、账号是否被禁用。

### 7.5 Token 不要放进 URL

URL 容易进入浏览器历史、服务端日志、代理日志、Referer、错误上报。业务系统不要把 access token、refresh token、登录票据放进 URL Query。

授权码 `code` 本身也应短时效、一次性使用，并且必须配合 `state` 和 PKCE。

## 8. 常见落地方案

| 场景                | 推荐方案                                                |
| :------------------ | :------------------------------------------------------ |
| 传统服务端渲染 Web  | Authorization Code，后端换 Token，Session Cookie 登录   |
| SPA + 自家后端      | Authorization Code + PKCE，后端换 Token，前端拿应用会话 |
| 纯静态 SPA 直连 IdP | Authorization Code + PKCE，Token 短时效，严格 CSP       |
| 企业 SSO            | OIDC / SAML 接入统一身份平台，应用只消费统一身份        |
| 多端 API            | Access Token 调 API，Refresh Token 轮换，服务端统一吊销 |

对普通 Web 应用，优先选择“**后端换 Token + 应用自己的 HttpOnly Cookie 会话**”。不要让前端长期保存第三方 refresh token。

## 9. 常见误区

| 误区                           | 正解                                         |
| :----------------------------- | :------------------------------------------- |
| OAuth2 就是登录协议            | OAuth2 是授权，OIDC 才补齐登录身份           |
| access token 就是用户身份      | access token 主要用于访问 API                |
| 前端可以安全保存 client secret | 不可以，前端代码天然公开                     |
| 回调拿到 code 就算登录成功     | 还要换 Token、验证 Token、建立业务会话       |
| state 可有可无                 | state 是登录 CSRF 的关键防线                 |
| 有 PKCE 就不用校验 state       | PKCE 防 code 被盗用，state 防登录 CSRF       |
| id_token 可以直接信任          | 必须验证签名、签发方、受众、过期时间和 nonce |

## 10. 实战建议

- Web 应用优先使用 Authorization Code Flow。
- SPA 使用 Authorization Code + PKCE，不再使用 Implicit Flow。
- 登录回调必须校验 `state`，OIDC 场景还要校验 `nonce`。
- 后端参与换 Token，并给前端下发本系统的 HttpOnly Session Cookie。
- Token 生命周期要短，Refresh Token 要轮换和可吊销。
- `redirect_uri` 使用精确白名单，不允许通配开放跳转。
- 第三方身份只解决“**用户是谁**”，本系统权限仍然要由业务后端判断。
