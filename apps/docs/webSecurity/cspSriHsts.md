# CSP、SRI 与 HSTS

CSP、SRI、HSTS 都属于浏览器安全能力，但它们解决的问题不同：**CSP 控制页面能加载什么资源，SRI 校验第三方资源有没有被篡改，HSTS 强制浏览器只走 HTTPS**。

## 1. CSP (Content Security Policy)

**核心本质**：通过 HTTP 响应头声明资源白名单，限制脚本、样式、图片、字体、接口等资源的加载来源。

**一句话理解**：**“即使页面被注入了恶意代码，浏览器也不允许它随便执行或外连。”**

### 1.1 CSP 能防什么？

| 风险            | CSP 的作用                                     |
| :-------------- | :--------------------------------------------- |
| XSS 注入脚本    | 禁止内联脚本、限制脚本来源                     |
| 数据外传        | 限制 `connect-src`，阻止脚本把数据发到陌生域名 |
| 第三方资源污染  | 只允许可信 CDN、静态资源域名                   |
| iframe 嵌套风险 | 通过 `frame-ancestors` 控制谁能嵌入当前页面    |

### 1.2 常见指令

| 指令              | 作用                                     |
| :---------------- | :--------------------------------------- |
| `default-src`     | 默认资源加载策略，其他指令未声明时使用它 |
| `script-src`      | 控制 JavaScript 来源                     |
| `style-src`       | 控制 CSS 来源                            |
| `img-src`         | 控制图片来源                             |
| `connect-src`     | 控制 Fetch、XHR、WebSocket 请求目标      |
| `font-src`        | 控制字体来源                             |
| `frame-src`       | 控制当前页面能嵌入哪些 iframe            |
| `frame-ancestors` | 控制当前页面能被哪些页面嵌入             |
| `base-uri`        | 限制 `<base>` 标签，防止相对路径被劫持   |
| `form-action`     | 限制表单提交目标                         |

### 1.3 CSP 配置层级

CSP 不是一条简单的“总开关”，而是一组按资源类型拆分的策略。浏览器判断某个资源能不能加载时，会先找更具体的指令；如果没有，再回退到 `default-src`。

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  img-src 'self' data: https:;
```

上面的配置可以理解为：

- JS 看 `script-src`：只允许同源脚本和 `https://cdn.example.com`。
- 图片看 `img-src`：允许同源、`data:` 图片和任意 HTTPS 图片。
- 其他没有单独声明的资源，例如字体、媒体、Worker，会回退到 `default-src 'self'`。

常见层级关系：

| 层级     | 例子                                                                     | 说明                                                     |
| :------- | :----------------------------------------------------------------------- | :------------------------------------------------------- |
| 默认策略 | `default-src 'self'`                                                     | 兜底规则，不等于所有资源都只能写这里                     |
| 类型策略 | `script-src`、`style-src`、`img-src`                                     | 覆盖对应资源类型的默认策略                               |
| 细分策略 | `script-src-elem`、`script-src-attr`、`style-src-elem`、`style-src-attr` | 更精细地区分标签资源和属性内联代码                       |
| 行为策略 | `frame-ancestors`、`base-uri`、`form-action`                             | 不控制普通资源加载，控制页面嵌入、`base`、表单提交等行为 |
| 上报策略 | `report-uri`、`report-to`                                                | 控制违规上报，不决定是否放行资源                         |

几个容易混淆的点：

- `default-src` 只在具体指令缺失时兜底；一旦写了 `script-src`，脚本就按 `script-src` 判断，不再合并 `default-src`。
- `frame-src` 控制“**当前页面能嵌入哪些 iframe**”，`frame-ancestors` 控制“**当前页面能被谁嵌入**”，方向相反。
- `connect-src` 控制 `fetch`、XHR、WebSocket、EventSource 等连接目标，不能用 `script-src` 代替。
- `base-uri` 和 `form-action` 最好显式配置，因为它们不只是静态资源加载问题。

### 1.4 推荐基础配置

#### 1.4.1 **HTTP 响应头 (标准使用方式)**

这是最稳妥、最安全的方式。服务器在返回任何 HTML 页面时，在 HTTP Header 中加入：

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://cdn.example.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

#### 1.4.2 **HTML Meta 标签 (静态站点补救方式)**

当无法控制服务器响应头时（例如 GitHub Pages），开发者通常使用 Meta 标签。

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self';"
/>
```

Meta 方式适合静态页面补救，但能力不如响应头完整，例如不能配置 `frame-ancestors`、`report-uri`、`sandbox` 等部分指令。因此生产环境优先使用 HTTP 响应头。

### 1.5 `nonce` 与 `hash`

`nonce` 和 `hash` 都是给“**内联代码**”发通行证的方式。它们解决的是同一个问题：在不打开 `'unsafe-inline'` 的前提下，让少量可信内联脚本或样式可以执行。

默认情况下，下面这种内联脚本会被严格 CSP 拦截：

```http
Content-Security-Policy: script-src 'self'
```

```html
<script>
  window.__APP_CONFIG__ = {}
</script>
```

原因是 `script-src 'self'` 允许的是“**从本站 URL 加载的外部脚本**”，不等于允许 HTML 里直接写的内联脚本。

#### 1.5.1 `nonce`：服务端为本次响应生成一次性随机值

```html
<script nonce="random-value-from-server">
  window.__APP_CONFIG__ = {}
</script>
```

```http
Content-Security-Policy: script-src 'self' 'nonce-random-value-from-server'
```

`nonce` 的工作方式是：

1. 服务端为每一次 HTML 响应生成不可预测的随机值。
2. 响应头里声明 `script-src 'nonce-xxx'`。
3. 同一份 HTML 中，被允许执行的内联 `<script>` 标签也带上 `nonce="xxx"`。
4. 浏览器比对响应头和标签属性，匹配才执行，不匹配就拦截。

适合使用 `nonce` 的场景：

- `nonce` 必须由服务端每次响应动态生成，不能写死。
- 使用 `nonce` 后，只有带正确 `nonce` 的内联脚本能执行。
- 适合 SSR 页面、模板直出页面、需要注入运行时配置的页面。
- 不适合纯静态 HTML，因为静态文件无法为每次响应生成新 `nonce`。

#### 1.5.2 `hash`：把固定内联代码的内容加入白名单

如果内联脚本内容是固定的，也可以把这段代码的哈希写入 CSP：

```html
<script>
  window.__APP_VERSION__ = '1.0.0'
</script>
```

```http
Content-Security-Policy: script-src 'self' 'sha256-BASE64_HASH'
```

浏览器会对内联脚本的完整文本计算哈希，和 CSP 中声明的 `sha256-...`、`sha384-...` 或 `sha512-...` 比对。内容完全一致才允许执行。

适合使用 `hash` 的场景：

- 静态站点中少量固定内联脚本。
- 构建产物中可预先计算内容哈希的内联片段。
- 不适合经常变动的运行时配置，因为任何字符变化都会导致 hash 失效，包括空格、换行和注释。

#### 1.5.3 `nonce`、`hash`、`SRI` 的区别

| 能力            | 配置位置                       | 主要对象            | 用途                                     |
| :-------------- | :----------------------------- | :------------------ | :--------------------------------------- |
| CSP `nonce`     | CSP 响应头 + HTML 标签属性     | 内联脚本 / 内联样式 | 允许本次响应中带正确随机值的内联代码执行 |
| CSP `hash`      | CSP 响应头                     | 内联脚本 / 内联样式 | 允许内容完全匹配哈希的内联代码执行       |
| SRI `integrity` | `<script>` / `<link>` 标签属性 | 外部脚本 / 外部样式 | 校验外部资源内容有没有被篡改             |

关键区别：

- `nonce` 和 CSP `hash` 是 CSP 的脚本执行授权机制，主要用来替代 `'unsafe-inline'`。
- SRI 是外部资源完整性校验机制，不能授权内联脚本执行，也不能控制资源来源。
- 外链脚本通常用 `script-src` 控制来源，用 SRI 校验内容；内联脚本通常用 `nonce` 或 CSP `hash` 授权执行。
- 如果 `script-src` 中同时存在 `nonce` 或 `hash`，现代浏览器会忽略 `'unsafe-inline'` 对内联脚本的放行效果，因此不要指望二者混用来放宽策略。

#### 1.5.4 如何选择？

| 场景                                  | 推荐方式                                 |
| :------------------------------------ | :--------------------------------------- |
| SSR 每次返回 HTML，并需要注入少量配置 | `nonce`                                  |
| 完全静态页面，内联代码固定            | CSP `hash`                               |
| 引入固定版本 CDN 脚本                 | `script-src` 限来源 + SRI 校验内容       |
| 业务代码可以打包成外链文件            | 去掉内联脚本，只保留 `script-src 'self'` |
| 为了省事允许所有内联脚本              | 不推荐 `'unsafe-inline'`                 |

需要注意：`nonce` 或 `hash` 只负责“**这段内联代码能不能执行**”，不代表这段代码本身一定安全。如果被授权的内联脚本读取了未转义的用户输入并写入 `innerHTML`，仍然可能制造 DOM 型 XSS。

### 1.6 Report-Only 模式

上线 CSP 前，建议先使用只上报不拦截的模式观察影响。

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

这能避免直接阻断线上资源加载。确认没有误伤后，再切换为 `Content-Security-Policy`。

## 2. SRI (Subresource Integrity)

**核心本质**：浏览器加载外部脚本或样式时，校验文件内容的哈希值是否与页面声明一致。

**一句话理解**：**“CDN 文件可以从别人那里加载，但内容必须和我预期的一模一样。”**

### 2.1 使用方式

```html
<script
  src="https://cdn.example.com/lib.min.js"
  integrity="sha384-BASE64_HASH"
  crossorigin="anonymous"
></script>
```

当 CDN 返回的文件内容被篡改时，浏览器计算出的哈希值会和 `integrity` 不一致，资源会被拒绝执行。

### 2.2 SRI 适用场景

| 场景                    | 是否适合                |
| :---------------------- | :---------------------- |
| 固定版本的 CDN 库       | 适合                    |
| 第三方统计 SDK          | 适合，但要注意 SDK 更新 |
| 每次构建都会变的业务 JS | 通常由构建工具自动处理  |
| 动态返回的接口数据      | 不适合                  |

### 2.3 SRI 注意点

- SRI 只校验资源内容，不决定资源来源；来源控制仍然需要 CSP。
- 对跨域资源使用 SRI 时，通常要加 `crossorigin="anonymous"`。
- 如果第三方 CDN 自动更新文件，而页面里的 hash 没同步更新，会导致资源加载失败。

## 3. HSTS (HTTP Strict Transport Security)

**核心本质**：服务端告诉浏览器，以后访问本站时必须使用 HTTPS，不能降级到 HTTP。

**一句话理解**：**“浏览器记住这个站点只能走 HTTPS。”**

### 3.1 配置方式

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| 参数                | 说明                         |
| :------------------ | :--------------------------- |
| `max-age`           | HSTS 生效秒数                |
| `includeSubDomains` | 子域名也强制 HTTPS           |
| `preload`           | 申请加入浏览器内置 HSTS 列表 |

### 3.2 HSTS 防御什么？

- 防止用户手动输入 `http://example.com` 时被中间人劫持。
- 防止攻击者把 HTTPS 链接降级成 HTTP。
- 减少首次跳转到 HTTPS 前的明文窗口。

### 3.3 HSTS 风险

HSTS 是强约束，配置前必须确认 HTTPS 覆盖完整。

- 如果加了 `includeSubDomains`，所有子域名都必须支持 HTTPS。
- 如果加入 preload 列表，回滚成本很高。
- 第一次访问前仍可能存在明文风险，preload 可以缓解这个问题。

## 4. 三者对比

| 能力 | 防御重点                | 配置位置      | 前端关注点                    |
| :--- | :---------------------- | :------------ | :---------------------------- |
| CSP  | XSS、资源加载、数据外传 | 响应头 / meta | 脚本、样式、接口、iframe 来源 |
| SRI  | CDN 资源被篡改          | HTML 标签属性 | 第三方脚本和样式 hash         |
| HSTS | HTTPS 降级攻击          | 响应头        | 全站 HTTPS、子域名覆盖        |

## 5. 实战建议

- 所有生产站点默认启用 HTTPS 和 HSTS。
- CSP 先用 `Report-Only` 跑一段时间，再切换到拦截模式。
- 第三方 CDN 脚本必须固定版本，并配合 SRI。
- 尽量减少内联脚本，确实需要时使用 `nonce`。
- `frame-ancestors` 优先替代旧的 `X-Frame-Options`。
