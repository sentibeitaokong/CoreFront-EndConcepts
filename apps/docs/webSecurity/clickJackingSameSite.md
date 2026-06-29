# ClickJacking 与 SameSite Cookie

ClickJacking 关注的是**页面被恶意嵌入后诱导用户点击**，SameSite Cookie 关注的是**跨站请求是否自动携带 Cookie**。二者经常和 CSRF、iframe 安全一起出现。

## 1. ClickJacking 点击劫持

**核心本质**：攻击者把目标网站放进透明或伪装的 iframe 中，诱导用户点击攻击者页面上的按钮，实际点击的却是目标网站中的敏感按钮。

**一句话理解**：**“用户以为点的是 A，浏览器实际点的是被盖住的 B。”**

### 1.1 攻击流程

1. 用户已经登录目标网站，例如 `bank.com`。
2. 攻击者搭建页面 `evil.com`。
3. `evil.com` 通过 iframe 嵌入 `bank.com/transfer`。
4. 攻击者用 CSS 把 iframe 设置为透明，并把诱导按钮放在视觉上相同的位置。
5. 用户点击诱导按钮，实际触发了 iframe 中的转账或授权操作。

```html
<iframe
  src="https://bank.com/transfer"
  style="opacity: 0; position: absolute; inset: 0;"
></iframe>
```

### 1.2 防御手段

| 防线              | 说明                                     |
| :---------------- | :--------------------------------------- |
| `frame-ancestors` | CSP 指令，控制谁能嵌入当前页面           |
| `X-Frame-Options` | 旧响应头，控制是否允许 iframe 嵌入       |
| 关键操作二次确认  | 高风险动作要求输入密码、验证码或硬件验证 |
| SameSite Cookie   | 降低跨站嵌入时自动带 Cookie 的风险       |

### 1.3 推荐配置

```http
Content-Security-Policy: frame-ancestors 'self'
```

表示当前页面只能被同源页面嵌入。如果完全不允许被嵌入：

```http
Content-Security-Policy: frame-ancestors 'none'
```

兼容旧浏览器时可以同时设置：

```http
X-Frame-Options: DENY
```

或：

```http
X-Frame-Options: SAMEORIGIN
```

注意：`frame-ancestors` 是现代首选方案，表达能力更强；`X-Frame-Options` 不能精细配置多个允许来源。

## 2. SameSite Cookie

**核心本质**：限制浏览器在跨站请求中是否自动携带 Cookie。

**一句话理解**：**“不是所有从别的网站发起的请求，都应该带上我的登录态。”**

### 2.1 SameSite 的三个值

| 值       | 行为                                   | 适用场景                            |
| :------- | :------------------------------------- | :---------------------------------- |
| `Strict` | 完全同站时才带 Cookie                  | 银行、后台管理、高敏感操作          |
| `Lax`    | 同站请求带；跨站顶级导航的安全方法可带 | 普通登录站点的默认选择              |
| `None`   | 跨站也带 Cookie                        | 第三方登录、跨站 iframe、嵌入式服务 |

### 2.2 `Lax` 的关键细节

`SameSite=Lax` 会阻止大多数 CSRF 场景，但不是完全禁止跨站带 Cookie。

一般情况下：

- 跨站 `<img>`、`<script>`、`iframe` 子资源请求不会带 Cookie。
- 跨站 `POST` 表单通常不会带 Cookie。
- 用户点击外站链接跳转到当前站点的顶级 `GET` 导航，可能会带 Cookie。

这就是为什么 `Lax` 适合作为多数站点的默认值，但敏感操作仍然不能依赖 GET。

### 2.3 `None` 必须配合 `Secure`

现代浏览器要求：

```http
Set-Cookie: session=abc; SameSite=None; Secure; HttpOnly
```

如果设置 `SameSite=None` 却没有 `Secure`，浏览器会拒绝或忽略该 Cookie。原因是跨站 Cookie 风险更高，必须只允许 HTTPS 传输。

## 3. SameSite 与 CSRF 的关系

CSRF 成功依赖浏览器在跨站请求中自动携带 Cookie。SameSite 正是从这个自动携带机制上做限制。

| 防御方式         | 解决的问题                  |
| :--------------- | :-------------------------- |
| SameSite         | 阻止跨站请求自动携带 Cookie |
| CSRF Token       | 验证请求是否来自真实页面    |
| Origin / Referer | 校验请求来源                |

更稳妥的做法是组合使用：

- 登录态 Cookie 设置 `HttpOnly; Secure; SameSite=Lax`。
- 高风险接口使用 CSRF Token。
- 服务端校验 `Origin` 或 `Referer`。
- 所有变更操作使用 `POST/PUT/PATCH/DELETE`，不要用 GET。

## 4. ClickJacking 与 SameSite 的组合防护

| 风险                       | 主要防线                              |
| :------------------------- | :------------------------------------ |
| 页面被 iframe 嵌入诱导点击 | `frame-ancestors` / `X-Frame-Options` |
| iframe 中自动携带登录态    | `SameSite=Lax/Strict`                 |
| 用户真实点击了敏感按钮     | 二次确认、重新认证                    |
| 请求被伪造                 | CSRF Token、Origin 校验               |

## 5. 实战建议

- 后台管理、支付、账号设置页面默认配置 `frame-ancestors 'none'`。
- 登录态 Cookie 默认使用 `HttpOnly; Secure; SameSite=Lax`。
- 只有明确需要第三方嵌入或跨站登录时，才使用 `SameSite=None; Secure`。
- 不要把防 ClickJacking 只交给前端 JS 判断 `top !== self`，这类 frame busting 脚本容易被绕过。
- 敏感操作必须服务端二次确认，不能只依赖页面按钮状态。
