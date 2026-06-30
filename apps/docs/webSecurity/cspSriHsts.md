# CSP、SRI 与 HSTS

CSP、SRI、HSTS 共同构成了现代 Web 架构的底层安全防线。其核心分工极其明确：**CSP 管控资源来源（防注入/外传），SRI 校验资源完整性（防第三方投毒），HSTS 强制加密链路（防降级劫持）。**

## 1. CSP (Content Security Policy) 内容安全策略

**核心本质**：通过 HTTP 响应头配置严格的资源白名单。即使页面存在 XSS 漏洞，也能在浏览器底层阻断恶意代码的执行与数据外传。

### 1.1 核心指令与防御矩阵

| 指令类别      | 核心指令                   | 作用对象与防御重点                         | 缺省回退逻辑                                           |
| ------------- | -------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| **兜底基线**  | `default-src`              | 全局资源的默认加载策略。                   | 作为所有未显式声明指令的兜底规则。                     |
| **脚本/样式** | `script-src` / `style-src` | 控制 JS/CSS 来源，防御 XSS 注入的核心。    | 缺省回退至 `default-src`。                             |
| **网络请求**  | `connect-src`              | 控制 Fetch、XHR、WebSocket 请求目标。      | 阻断 XSS 窃取数据外传；回退至 `default-src`。          |
| **静态资源**  | `img-src` / `font-src`     | 控制图片、字体等加载源。                   | 缺省回退至 `default-src`。                             |
| **嵌套管控**  | `frame-ancestors`          | **控制当前页面允许被谁作为 iframe 嵌入。** | **不继承** `default-src`；彻底替代 `X-Frame-Options`。 |
| **表单/基建** | `form-action` / `base-uri` | 限制表单提交目标与 `<base>` 标签相对路径。 | **不继承** `default-src`；防范表单与路径劫持。         |
| **审计告警**  | `report-uri` / `report-to` | 指定违规日志的后端收集端点。               | 仅上报不拦截（配合 `Report-Only` 模式极佳）。          |

### 1.2 内联代码放行机制：`nonce` vs `hash`

在禁止 `'unsafe-inline'` 的极严苛模式下，必须通过以下机制精准放行合法的内联脚本/样式。**警告：一旦配置了 `nonce` 或 `hash`，现代浏览器将自动忽略同级指令中的 `'unsafe-inline'` 放行效果。**

| 放行机制               | 运行逻辑                                                                    | 适用核心场景                                             |
| ---------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| **`nonce` (动态令牌)** | 服务端每次响应生成随机 UUID，响应头与 `<script nonce="...">` 标签精准匹配。 | **动态渲染页面 (SSR)**，需注入少量运行时配置数据。       |
| **`hash` (静态指纹)**  | 将固定内联代码的 SHA 系列哈希值写入 CSP 响应头，浏览器比对文本一致性。      | **纯静态页面 (SSG)**，内联代码完全写死，无任何字符变动。 |

### 1.3 配置层级与部署策略

- **标准 HTTP 响应头 (`Content-Security-Policy`)**：全能力解锁，支持全部高阶指令，生产环境绝对首选。

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

- **审计观察模式 (`Content-Security-Policy-Report-Only`)**：只报警不拦截，上线初期排查误伤的必经阶段。

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

- **HTML Meta 标签补救**：`<meta http-equiv="Content-Security-Policy" ...>`，仅作纯静态托管的补救手段，**绝对不支持** `frame-ancestors` 和 `report-uri`。

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self';"
/>
```

## 2. SRI (Subresource Integrity) 子资源完整性

**核心本质**：通过前置声明外部静态文件的强哈希指纹，将第三方 CDN 节点被黑客篡改（投毒）的破坏力降为零。

- **基础语法**：`<script src="https://cdn..." integrity="sha384-BASE64_HASH" crossorigin="anonymous"></script>`
- **运行逻辑**：浏览器下载文件后在内存中计算哈希，若与 `integrity` 属性不匹配，**直接拒绝执行该文件**。
- **跨域要求**：跨域校验必须开启 `crossorigin="anonymous"`，否则浏览器将因隐私安全策略阻断加载。

### 2.1 适用性排查矩阵

| 业务场景                  | SRI 适用性   | 架构师建议                                                 |
| ------------------------- | ------------ | ---------------------------------------------------------- |
| **版本锁死的公共 CDN 库** | **极度推荐** | 引入 Vue/React 等稳定版依赖时必须配置。                    |
| **本地构建的静态产物**    | **推荐**     | 通过 Vite/Webpack 插件在构建流水线中自动注入哈希。         |
| **动态更新的第三方 SDK**  | **严禁使用** | 统计代码、广告脚本等。供应商一旦静默更新，页面将瞬间崩溃。 |
| **动态返回的接口数据**    | **严禁使用** | 接口数据实时变化，无法预判哈希。                           |

### 2.2 SRI 注意点

- SRI 只校验资源内容，不决定资源来源；来源控制仍然需要 CSP。
- 对跨域资源使用 SRI 时，通常要加 crossorigin="anonymous"。
- 如果第三方 CDN 自动更新文件，而页面里的 hash 没同步更新，会导致资源加载失败。

## 3. HSTS (HTTP Strict Transport Security) 严格传输安全

**核心本质**：打破“**先 HTTP 握手再 301/302 跳转 HTTPS**”的传统链路，将安全防线硬编码进浏览器内核，彻底堵死中间人明文嗅探和降级劫持。

### 3.1 核心配置与参数解析

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

```

| 参数                | 核心说明与落地风险                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `max-age`           | 强制内部 307 重定向到 HTTPS 的有效期（秒）。基准通常设为 1 年 (`31536000`)。                                  |
| `includeSubDomains` | 强制策略向下渗透至所有子域名。**高危操作**：必须确保企业内网、测试环境等所有边缘子域名已 100% 部署 SSL 证书。 |
| `preload`           | 申请写入浏览器内核的全球预载入列表（HSTS Preload List），彻底消灭用户首次访问时的明文窗口风险。回滚成本极高。 |

### 3.2 HSTS 防御什么？

- 防止用户手动输入 http://example.com 时被中间人劫持。
- 防止攻击者把 HTTPS 链接降级成 HTTP。
- 减少首次跳转到 HTTPS 前的明文窗口。

### 3.3 HSTS 风险

HSTS 是强约束，配置前必须确认 HTTPS 覆盖完整。

- 如果加了 includeSubDomains，所有子域名都必须支持 HTTPS。
- 如果加入 preload 列表，回滚成本很高。
- 第一次访问前仍可能存在明文风险，preload 可以缓解这个问题。

## 4. 核心对比与生产环境最佳实践

### 4.1 能力全景对比

| 维度         | CSP (内容白名单)                 | SRI (内容防篡改)                     | HSTS (强制加密)                   |
| ------------ | -------------------------------- | ------------------------------------ | --------------------------------- |
| **主要防范** | XSS 执行、数据暗站外传、点击劫持 | 供应链投毒、CDN 静态文件被篡改       | 中间人流量劫持、HTTP 协议降级攻击 |
| **控制核心** | 资源**从哪里来** (来源合法性)    | 资源**有没有变** (内容完整性)        | 链路**如何加密** (传输协议强约束) |
| **配置位置** | HTTP 响应头 / HTML Meta 标签     | HTML 标签属性 (`<script>`, `<link>`) | 仅 HTTP 响应头生效                |

### 4.2 生产环境落地

- **全站加密先行**：全域开启 HTTPS。HSTS 灰度测试时 `max-age` 先从 1 周起步，确认无子域名证书报错后再拉满至 1 年并提报 `preload`。
- **CSP 平滑过渡**：禁止直接上线强制拦截模式。首发必须通过 `Report-Only` 模式配合企业监控大盘收集误伤日志，清洗规则后再无缝切换为物理拦截。
- **基建锁死注入**：构建流水线应当强制为所有外部依赖生成并自动注入 `integrity` 哈希，消除人为遗漏。
- **收敛前端暴露**：彻底淘汰陈旧的 `X-Frame-Options` 改用 CSP 的 `frame-ancestors`。
- **规范内联代码**：严禁在工程代码中通过 `<script>` 内联编写业务逻辑，统一改用外链引入或 SSR 配合 `nonce` 动态分发。

## 5. 实战建议

- 所有生产站点默认启用 HTTPS 和 HSTS。
- CSP 先用 `Report-Only` 跑一段时间，再切换到拦截模式。
- 第三方 CDN 脚本必须固定版本，并配合 SRI。
- 尽量减少内联脚本，确实需要时使用 `nonce`。
- `frame-ancestors` 优先替代旧的 `X-Frame-Options`。
