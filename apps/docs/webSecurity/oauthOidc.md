# OAuth2 / OIDC 身份认证与授权

OAuth2 和 OIDC 经常被混为一谈，但其架构分工极其明确：**OAuth2 负责解决“授权”（能否访问资源），OIDC 则在 OAuth2 基础上补充“认证”（当前登录者是谁）**。

## 1. 核心概念与凭证矩阵

| 概念/凭证   | 核心职责与本质                                                   | 架构产出物与流转定位                                             |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **OAuth2**  | **授权协议**。允许应用在不获取密码的前提下访问受保护资源。       | 产出 **`access_token`**。用于调用资源服务器 API。                |
| **OIDC**    | **认证协议** (OpenID Connect)。建立在 OAuth2 之上的身份层。      | 产出 **`id_token`** (JWT)。用于向客户端证明用户身份。            |
| **PKCE**    | **安全扩展**。通过动态哈希挑战，防止授权码 (`code`) 被截获滥用。 | 产出 **`code_verifier`** (明文) 与 **`code_challenge`** (哈希)。 |
| **Session** | **应用自身登录态**。第三方凭证交换后的最终归宿。                 | 产出 **`HttpOnly Cookie`** 或业务 Token。                        |

> **架构红线**：前端绝对不应直接将第三方的 `access_token` 当作本系统的长期登录态。标准做法：后端完成 Token 交换与验证后，建立本系统自己的 Session 会话。

## 2. 现代标准登录流：Authorization Code + PKCE

过去将 Token 直接暴露在 URL 里的 **隐式模式 (Implicit Flow) 已被彻底废弃**。现代 SPA、移动端及传统 Web 必须统一采用带 PKCE 扩展的授权码模式。

### 2.1 核心数据流转链路

1. **防伪造生成**：应用后端（或前端）生成 `state` (防 CSRF)、`nonce` (防重放)、`code_verifier` (原始码) 及 `code_challenge` (哈希值)。
2. **重定向授权**：浏览器携 `client_id`、`state`、`code_challenge` 跳转至授权服务器 (IdP)。
3. **用户鉴权**：用户在 IdP 完成登录及授权确认。
4. **回调授权码**：IdP 携临时授权码 `code` 与原始 `state` 重定向回应用的 `redirect_uri`。
5. **内网换凭证 (核心)**：应用前端将 `code` 移交后端。后端携 `code`、`client_secret` 及原始 `code_verifier`，在内网向 IdP 发起 Token 交换请求。
6. **核对与下发**：IdP 校验 `code_verifier` 与步骤 2 的挑战值一致后，下发 `access_token` 与 `id_token`。
7. **建立会话**：后端校验 `id_token` 无误后，下发本系统的 `HttpOnly Cookie` 登录态。

### 2.2 完整流程图

![Logo](/img/codeAndPkce.webp)

## 3. 安全参数字典与校验红线

安全漏洞往往源于对这些关键参数的校验缺失。必须严格死守以下防线：

| 参数名称            | 核心安全机制                                     | 强制校验红线 (不满足直接熔断)                                                              |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **`state`**         | **防登录 CSRF**。随回调原样返回的随机码。        | 回调时**必须比对**本地保存的 `state`，防止黑客将自己的账号强行绑定给受害者。               |
| **`nonce`**         | **防 ID Token 重放**。会被 IdP 写入 `id_token`。 | 解析 `id_token` 后，**必须比对** Payload 中的 `nonce` 与发起时一致。                       |
| **`redirect_uri`**  | 接收 `code` 的回调物理地址。                     | 必须在 IdP 后台配置**精准绝对的 URL 白名单**，严禁使用通配符或动态 Query（防开放重定向）。 |
| **`code_verifier`** | PKCE 原始随机明文。                              | **仅在后端换 Token 时提交**，绝对禁止暴露在浏览器 URL 中。                                 |
| **`client_secret`** | 客户端请求密钥。                                 | **严禁硬编码在前端**。SPA 等公开客户端无法安全保存，必须依赖后端或纯 PKCE。                |

## 4. 前后端架构职责边界

| 职责         | 前端                           | 后端                                   |
| :----------- | :----------------------------- | :------------------------------------- |
| 发起登录跳转 | 生成或请求 `state`、PKCE 参数  | 可统一生成授权 URL                     |
| 回调处理     | 读取 `code`、`state`，交给后端 | 校验 `state`，换 Token                 |
| Token 校验   | 不信任前端自行判断             | 校验签名、`iss`、`aud`、`exp`、`nonce` |
| 登录态建立   | 接收应用登录态                 | 下发 HttpOnly Cookie 或业务 Token      |
| 续期与退出   | 调刷新或退出接口               | 轮换 / 吊销 Token，清除 Session        |

更推荐的 Web 架构是后端参与换 Token，并给前端下发本系统的 `HttpOnly; Secure; SameSite=Lax` Session Cookie。这样第三方 Token 不直接暴露给浏览器 JS，业务权限也由本系统统一管理。

## 5. 生产环境最佳实践

- **`id_token` 验签闭环**：后端收到 `id_token`，必须严格验证：① 签名可信 (匹配 JWKS)；② `iss` (签发方一致)；③ `aud` (受众为当前 client_id)；④ `exp` (未过期)。
- **URL 洁癖**：严禁将 Access Token、Refresh Token 或任何敏感票据放入 URL Query 中，防止在浏览器历史、代理日志与 Referer 中裸奔。
- **权限解耦**：第三方身份（OIDC）只解决“**当前用户是谁**”，本系统的具体操作权限（RBAC/ABAC）仍然必须由业务后端统一把控与拦截。

## 6. 常见落地方案

| 场景                | 推荐方案                                                |
| :------------------ | :------------------------------------------------------ |
| 传统服务端渲染 Web  | Authorization Code，后端换 Token，Session Cookie 登录   |
| SPA + 自家后端      | Authorization Code + PKCE，后端换 Token，前端拿应用会话 |
| 纯静态 SPA 直连 IdP | Authorization Code + PKCE，Token 短时效，严格 CSP       |
| 企业 SSO            | OIDC / SAML 接入统一身份平台，应用只消费统一身份        |
| 多端 API            | Access Token 调 API，Refresh Token 轮换，服务端统一吊销 |

对普通 Web 应用，优先选择“**后端换 Token + 应用自己的 HttpOnly Cookie 会话**”。不要让前端长期保存第三方 refresh token。

## 7. 常见误区

| 误区                           | 正解                                         |
| :----------------------------- | :------------------------------------------- |
| OAuth2 就是登录协议            | OAuth2 是授权，OIDC 才补齐登录身份           |
| access token 就是用户身份      | access token 主要用于访问 API                |
| 前端可以安全保存 client secret | 不可以，前端代码天然公开                     |
| 回调拿到 code 就算登录成功     | 还要换 Token、验证 Token、建立业务会话       |
| state 可有可无                 | state 是登录 CSRF 的关键防线                 |
| 有 PKCE 就不用校验 state       | PKCE 防 code 被盗用，state 防登录 CSRF       |
| id_token 可以直接信任          | 必须验证签名、签发方、受众、过期时间和 nonce |

## 8. 实战建议

- Web 应用优先使用 Authorization Code Flow。
- SPA 使用 Authorization Code + PKCE，不再使用 Implicit Flow。
- 登录回调必须校验 `state`，OIDC 场景还要校验 `nonce`。
- 后端参与换 Token，并给前端下发本系统的 HttpOnly Session Cookie。
- Token 生命周期要短，Refresh Token 要轮换和可吊销。
- `redirect_uri` 使用精确白名单，不允许通配开放跳转。
- 第三方身份只解决“**用户是谁**”，本系统权限仍然要由业务后端判断。
