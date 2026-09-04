# `<head>`：文档元数据与 SEO

`<head>` 是 HTML 文档的「**司令部**」——它不直接渲染可见内容，却承载着字符编码、视口设置、SEO 元数据、外链资源、图标等影响整个页面的关键信息。浏览器、搜索引擎、社交平台都会优先读取这里。

**一句话理解**：**「`<head>` 里装的不是页面内容，而是告诉浏览器和搜索引擎『这个页面是谁、该怎么渲染、给谁看』的元信息。」**

## 1. 基本骨架

一个规范页面的 `<head>` 至少应包含：

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>页面标题 - 站点名</title>
  <meta name="description" content="页面描述，用于搜索结果摘要" />
  <link rel="stylesheet" href="/style.css" />
</head>
```

## 2. `<title>`：页面标题

- 是 SEO 权重**最高**的标签，直接显示在搜索结果和浏览器标签页。
- 建议格式：`核心关键词 - 品牌名`，长度控制在 **50~60 字符**内，避免被搜索引擎截断。

```html
<title>CSS 层叠与特异性 - CoreFront-EndConcepts</title>
```

## 3. `<meta>` 元数据

### 3.1 字符编码（必须放在最前面）

```html
<meta charset="UTF-8" />
```

> `charset` 应出现在 `<head>` 的**前 1024 字节**内，否则浏览器可能先用错误编码解析，导致乱码。

### 3.2 viewport（移动端适配核心）

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

详见 [移动端适配](/css/advanced/responsive/mobileAdaptation#2-viewport)。

### 3.3 SEO 相关

| 标签                                          | 作用                                   |
| --------------------------------------------- | -------------------------------------- |
| `<meta name="description" content="...">`     | 搜索结果的摘要描述，50~160 字符。      |
| `<meta name="keywords" content="...">`        | 历史遗留，现代搜索引擎基本忽略。       |
| `<meta name="robots" content="index,follow">` | 控制搜索引擎是否收录、是否跟踪链接。   |
| `<link rel="canonical" href="...">`           | 声明「权威 URL」，避免重复内容被降权。 |

**`robots` 的取值组合：**

| 值          | 含义                 |
| ----------- | -------------------- |
| `index`     | 允许收录（默认）     |
| `noindex`   | 禁止收录             |
| `follow`    | 允许跟踪链接（默认） |
| `nofollow`  | 禁止跟踪链接         |
| `noarchive` | 禁止快照             |

```html
<meta name="robots" content="noindex, nofollow" />
```

### 3.4 移动端特殊 meta

```html
<!-- 控制地址栏/状态栏颜色（iOS Safari） -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>

<!-- 禁止自动识别电话号码/邮箱（iOS） -->
<meta name="format-detection" content="telephone=no, email=no" />

<!-- 浏览器主题色（Android Chrome 地址栏） -->
<meta name="theme-color" content="#ffffff" />
```

### 3.5 社交分享（Open Graph / Twitter Card）

用于控制链接分享到微信、微博、Twitter 等平台时显示的卡片：

```html
<!-- Open Graph（Facebook、微信、Line 等） -->
<meta property="og:title" content="页面标题" />
<meta property="og:description" content="分享描述" />
<meta property="og:image" content="https://example.com/cover.png" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="站点名" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="页面标题" />
<meta name="twitter:description" content="分享描述" />
<meta name="twitter:image" content="https://example.com/cover.png" />
```

**Open Graph 关键属性：**

| 属性             | 说明                       | 推荐值                |
| ---------------- | -------------------------- | --------------------- |
| `og:title`       | 分享卡片标题               | 与页面标题一致        |
| `og:description` | 分享卡片描述               | 1~2 句摘要            |
| `og:image`       | 缩略图（**必须绝对 URL**） | 建议 1200×630px       |
| `og:type`        | 内容类型                   | `website` / `article` |

### 3.6 结构化数据（JSON-LD）

用 JSON-LD 告诉搜索引擎页面的结构化信息（面包屑、评分、FAQ 等），有助于富摘要展示：

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "CSS 层叠与特异性",
    "author": { "@type": "Person", "name": "xunbei" }
  }
</script>
```

## 4. `<link>` 外链资源

| 用途               | 写法                                                            | 说明                         |
| ------------------ | --------------------------------------------------------------- | ---------------------------- |
| 样式表             | `<link rel="stylesheet" href="/a.css">`                         | 阻塞渲染，一般放 `<head>`    |
| 预加载（关键资源） | `<link rel="preload" href="/font.woff2" as="font" crossorigin>` | 提前加载当前页必需资源       |
| 预连接（加速跨域） | `<link rel="preconnect" href="https://api.example.com">`        | 提前建立 DNS/TCP/TLS 连接    |
| 预解析（加速 DNS） | `<link rel="dns-prefetch" href="https://api.example.com">`      | 仅提前 DNS 解析              |
| 预取（下一跳资源） | `<link rel="prefetch" href="/next-page.js">`                    | 空闲时预取未来可能访问的资源 |
| 站点图标           | `<link rel="icon" href="/favicon.ico" type="image/x-icon">`     | 浏览器标签页图标             |
| iOS 主屏图标       | `<link rel="apple-touch-icon" href="/icon-180.png">`            | 添加到主屏幕时的图标         |
| 权威 URL           | `<link rel="canonical" href="https://example.com/page">`        | 指定首选 URL                 |

### 4.1 preload 的 `as` 与 `crossorigin`

`preload` 必须用 `as` 声明资源类型，且跨域字体需加 `crossorigin`：

```html
<!-- 字体预加载必须加 crossorigin -->
<link
  rel="preload"
  href="/font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<!-- 脚本预加载 -->
<link rel="preload" href="/app.js" as="script" />
```

## 5. `<script>` 与 `<style>`

- `<script src="...">` 默认**同步阻塞**解析，常用 `defer` 或 `async` 优化（详见 [async/defer 脚本](/html/basic/asyncScript)）。
- 内联 `<style>` 会立即生效，但不利于缓存与维护，一般由构建工具抽取为外部文件。

| 属性    | 下载时机 | 执行时机           | 是否阻塞解析 |
| ------- | -------- | ------------------ | ------------ |
| 无      | 同步阻塞 | 下载后立即执行     | ✅ 是        |
| `defer` | 异步并行 | HTML 解析完成后    | ❌ 否        |
| `async` | 异步并行 | 下载完成后立即执行 | 执行时阻塞   |

## 6. 常见问题 (FAQ)

### 6.1 `<title>` 和 `<meta description>` 有什么区别？

`<title>` 是搜索结果的**标题**（权重最高），`description` 是标题下方的**摘要文字**（影响点击率，不直接影响排名）。两者都要写，且应包含页面核心关键词。

### 6.2 为什么中文页面乱码？

几乎都是**字符编码不一致**导致。确保 `<meta charset="UTF-8">` 存在、文件本身以 UTF-8 保存、服务器响应头也声明 UTF-8（`Content-Type: text/html; charset=utf-8`）。

### 6.3 为什么分享链接时没有缩略图？

社交平台依赖 `og:image` 抓取缩略图，需提供**绝对 URL**、保证图片可公开访问，且平台有缓存机制（首次抓取后不会立即更新）。

### 6.4 `preconnect` 和 `dns-prefetch` 有什么区别？

`dns-prefetch` 只做 **DNS 解析**；`preconnect` 更进一步，同时完成 **DNS + TCP + TLS** 连接建立。前者成本低、适合「可能访问」的域名，后者成本高、适合「确定要访问」的关键域名。

## 7. 总结

- `<head>` 承载：编码、viewport、title、SEO meta、社交分享、外链资源。
- 必写三件套：`charset`、`viewport`、`title`。
- SEO 核心：`title` + `description` + `canonical`；社交核心：Open Graph。
- 性能相关：`preload` / `preconnect` / `dns-prefetch` / `prefetch` 各司其职。
