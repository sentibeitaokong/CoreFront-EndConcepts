# 前端线上质量与效能监控

在现代前端工程的生命周期中，将代码打包并部署上线（CI/CD）绝不是终点，而是漫长战役的开端。

如果缺乏线上监控体系，整个前端团队就像是在“**蒙眼狂奔**”：用户遇到了白屏报错只能通过客服投诉，开发者排查问题时只能祈祷能“**在本地复现**”，系统变慢了也没有任何数据支撑来指引优化方向。

## 1. 核心痛点与时代背景

在没有体系化监控的时代，前端排查线上问题面临着三大架构级灾难：

- **沉默的崩溃（Silent Failures）：** JS 是单线程弱类型语言，一个未捕获的 `undefined` 错误足以让整个单页应用（SPA）瞬间白屏。由于前端代码跑在用户的设备上，如果报错不主动上报，服务器端根本无从知晓。
- **定位如大海捞针：** 线上跑的都是经过 Vite/Webpack 极限压缩混淆后的代码（如 `app.js` 只有一行）。控制台报错 `a.b is undefined`，开发者完全不知道这是哪个组件的哪行源码。
- **性能评估的玄学化：** 过去用 `window.onload` 来衡量速度，但这根本无法代表用户的真实体感。页面可能早就刷出来了，但底层接口还在请求，或者页面已经完全加载，但由于 JS 阻塞，用户点击按钮毫无反应。

## 2. 异常追踪体系：构筑全维度的错误捕获网

要在极其复杂的浏览器环境中捕获所有错误，SDK 必须在各个可能的崩溃节点布下天罗地网。

### 2.1 同步与异步的全局防线

这是监控 SDK 的底层基石，主要依赖操作系统的原生 API 劫持。

- **`window.onerror`：** 捕获绝大多数的 JS 运行时同步错误和部分异步错误。它能拿到出错的行号、列号和错误堆栈（Stack Trace）。
- **`unhandledrejection`：** 专门填补 Promise 的盲区。当一个 Promise 失败（reject）且没有写 `.catch()` 时，错误会漏掉，必须通过监听操作系统的这个事件来兜底。

:::code-group

```js [src/monitor/error.js]
// 统一上报入口，具体传输策略（sendBeacon / 1x1 GIF）见第 5 节
function report(payload) {
  console.warn('[monitor]', payload)
}

// 1. 同步错误与普通异步错误
window.onerror = (message, source, lineno, colno, error) => {
  report({
    type: 'js-error',
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  })

  // 不要返回 true：否则浏览器控制台不再打印原始错误，本地排查会更困难
}

// 2. Promise 未捕获的拒绝
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason

  report({
    type: 'unhandledrejection',
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  })
})
```

:::

> 跨域脚本报错只会拿到 `Script error.`，需要给 `<script>` 加上 `crossorigin` 属性，并让 CDN 返回 `Access-Control-Allow-Origin` 响应头。

### 2.2 静态资源加载异常

当图片、CSS 或远程 JS 加载失败时（比如 CDN 节点挂了），`window.onerror` 是捕获不到的，因为这类错误不会冒泡。

**架构解法：** 使用事件捕获机制。在 SDK 初始化时，最先注册 `window.addEventListener('error', handler, true)`（注意第三个参数 `true` 开启捕获阶段），就能精准拦截到 `<img src="404.png">` 的崩溃。

### 2.3 框架层面的隔离区 (Error Boundaries)

现代框架（Vue/React）都有自己的运行时调度机制。如果组件渲染时报错，框架会把错误吞掉，导致全局的 `window.onerror` 无法触发。

- **Vue 3 防线：** 必须覆写全局配置：`app.config.errorHandler = (err, instance, info) => { ... }`。
- **React 防线：** 必须在组件树顶层包裹自定义的 `<ErrorBoundary>` 组件，利用生命周期 `componentDidCatch` 进行上报。

### 2.4 行为回溯记录 (Breadcrumbs)

单独一个错误堆栈往往不够。优秀的监控 SDK（如 Sentry）会劫持 `console.log`、`XMLHttpRequest`、`fetch` 以及用户的 `click` 事件。
当发生报错时，SDK 会把报错前 10 秒内用户的所有“**点击动作**”、“**接口请求头**”和“**打印日志**”像面包屑一样串起来一起上报，完美还原案发现场。

:::code-group

```js [src/monitor/breadcrumbs.js]
const MAX_BREADCRUMBS = 20 // 环形缓冲区上限，避免内存无限增长
const MAX_AGE = 10_000 // 只保留报错前 10 秒内的记录

const breadcrumbs = []

function addBreadcrumb(category, message, data = {}) {
  breadcrumbs.push({ category, message, data, timestamp: Date.now() })

  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift()
  }
}

// 1. 劫持 console：先记录再调用原始方法，不破坏本地调试
for (const level of ['log', 'warn', 'error']) {
  const original = console[level]

  console[level] = (...args) => {
    addBreadcrumb('console', level, { args: args.map(String) })
    original.apply(console, args)
  }
}

// 2. 劫持 fetch：只记录方法、URL、状态码，不要记录请求体与鉴权头
const originalFetch = window.fetch

window.fetch = async (...args) => {
  const [input, init] = args
  const url = typeof input === 'string' ? input : input.url
  const method = init?.method ?? 'GET'

  try {
    const response = await originalFetch(...args)
    addBreadcrumb('fetch', `${method} ${url}`, { status: response.status })
    return response
  } catch (error) {
    addBreadcrumb('fetch', `${method} ${url}`, { error: String(error) })
    throw error // 别吞掉原始错误，交给全局防线继续处理
  }
}

// 3. 记录用户点击：用捕获阶段，即使业务代码 stopPropagation 也能收到
window.addEventListener(
  'click',
  event => {
    const target = event.target

    addBreadcrumb('ui.click', target?.tagName?.toLowerCase(), {
      text: target?.textContent?.trim().slice(0, 50),
    })
  },
  true,
)

// 4. 上报错误时取出时间窗口内的面包屑，拼进 2.1 的 report 里
export function getBreadcrumbs() {
  const since = Date.now() - MAX_AGE

  return breadcrumbs.filter(item => item.timestamp >= since)
}
```

:::

> 面包屑很容易无意中收集敏感信息。请求体、`Cookie`、`Authorization` 头和表单值都不应进入上报内容；必要时在 `addBreadcrumb` 里统一做脱敏。

## 3. SourceMap：加密代码的反向破译引擎

线上上报的错误堆栈是高度混淆的：`at app.8f3a.js:1:4532`。如何将其还原为人类可读的源码？

### 3.1 SourceMap 的底层构成

在执行 `pnpm run build` 时，如果你开启了 sourcemap，构建工具会生成一个额外的 `.map` 文件。这个文件本质上是一个庞大的 JSON，其核心是 `mappings` 字段。
`mappings` 使用了 **VLQ (Variable-length quantity) 编码**，它记录了混淆代码的行/列与原始 `xxx.vue` 文件行/列的绝对映射关系。

:::code-group

```json [dist/app.8f3a.js.map]
{
  "version": 3,
  "file": "app.8f3a.js",
  "sources": ["webpack:///./src/views/Login.vue"],
  "sourcesContent": ["const handleSubmit = () => {}"],
  "names": ["handleSubmit"],
  "mappings": "AAAA,SAASA,GAAG,CAACC,QAAQ,CAACC,YAAY"
}
```

```js [scripts/resolve-sourcemap.js]
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping'
import { readFileSync } from 'node:fs'

const rawMap = JSON.parse(readFileSync('dist/app.8f3a.js.map', 'utf8'))
const map = new TraceMap(rawMap)

// 线上堆栈：at app.8f3a.js:1:4532
const position = originalPositionFor(map, {
  line: 1,
  // 堆栈列号从 1 开始，source map 的列号从 0 开始
  column: 4532 - 1,
})

console.log(position)
// { source: 'webpack:///./src/views/Login.vue', line: 42, column: 8, name: 'handleSubmit' }
```

:::

### 3.2 企业级架构的 SourceMap 运作流转

**绝对不能将`.map`文件部署到线上的公网CDN！** 否则竞争对手可以直接反编译出你公司的所有前端核心源码。

**正确的工程化闭环架构：**

- **编译期上传：** 在 CI/CD 流水线中，`pnpm build` 产出 `.js` 和 `.map` 文件。
- **分离与分发：** 自动化脚本将 `.js` 推送到公网 CDN。同时，将 `.map` 文件通过内网 API 秘密推送到你们的异常监控服务器（如自建的 Sentry Server），随后立即删除服务器上的 `.map` 文件。
- **运行时反解：** 用户在线上遇到报错，SDK将混淆的堆栈上报给监控服务器。监控服务器拿出私密存储的`.map`文件,在服务端进行AST解析和映射定位,最终在后台面板向开发者展示出带有上下文的真实源码行。

## 4. 性能度量体系：从 Load 到 Core Web Vitals

性能监控经历了从“**面向机器**”到“**面向人类体感**”的彻底范式转变。Google 提出的 **Core Web Vitals（核心网页指标）** 是目前前端性能度量的绝对金标准。

### 4.1 LCP (Largest Contentful Paint) - 加载性能的真实体感

- **定义：** 视口内“**最大**”的可见内容元素（通常是头图、大段文字或视频封面）完成渲染的时间。
- **架构意义：** 抛弃了无意义的 `DOMContentLoaded`。LCP 直接反映了用户什么时候觉得这个网页“**看起来加载完了**”。优秀标准：**< 2.5 秒**。

### 4.2 INP (Interaction to Next Paint) - 交互流畅度的照妖镜

- **定义：** 测量页面生命周期内所有用户交互（点击、敲击键盘）到浏览器真正绘制出下一帧的延迟时间。这是 2024 年正式取代 FID（首次输入延迟）的新指标。
- **架构意义：** 揪出长任务（Long Tasks）。如果你的 React 组件在点击后进行了极其复杂的 Diff 计算堵塞了主线程，INP 就会飙高，用户体感就是“**这破网页卡死了**”。优秀标准：**< 200 毫秒**。

### 4.3 CLS (Cumulative Layout Shift) - 视觉稳定性的终极考验

- **定义：** 页面生命周期内发生的所有意外布局偏移分数的总和。
- **架构意义：** 你肯定遇到过正准备点击一个按钮，结果上面突然加载出一张广告图，把按钮挤下去了，导致你点错了。这就是严重的 CLS 灾难。通过给 `<img>` 预设 `width` 和 `height`，或保留骨架屏可以根治此问题。优秀标准：**< 0.1**。

### 4.4 底层采集引擎：PerformanceObserver API

现代监控 SDK 绝对不会用笨重的定时器去计算时间。而是利用浏览器底层的 `PerformanceObserver` 接口，它允许应用**异步且非阻塞**地订阅这些性能事件，不会对页面原本的性能造成任何负担。

```js
// 示例：监听 LCP 并打印
new PerformanceObserver(entryList => {
  for (const entry of entryList.getEntries()) {
    console.log('最大内容渲染时间 (LCP):', entry.startTime)
  }
}).observe({ type: 'largest-contentful-paint', buffered: true })
```

### 4.5 高频指标与采集 API 速查

生产环境极少手写 `PerformanceObserver`，通常直接引入 `web-vitals` 库，它抹平了各浏览器的差异，并提供统一的回调：

```js
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'

// 五个核心回调，统一拿到 { name, value, rating, delta, id }
onLCP(metric => report('LCP', metric))
onINP(metric => report('INP', metric))
onCLS(metric => report('CLS', metric))
onFCP(metric => report('FCP', metric))
onTTFB(metric => report('TTFB', metric))
```

[width(15,46,39)]

| 指标 / 事件 | 采集方式                                        | 说明                                   |
| ----------- | ----------------------------------------------- | -------------------------------------- |
| LCP         | 监听 `largest-contentful-paint` / `onLCP`       | 视口内最大内容元素渲染完成的时间       |
| INP         | 监听 `event`（含 `first-input`）/ `onINP`       | 交互到浏览器绘制下一帧的延迟           |
| CLS         | 监听 `layout-shift` / `onCLS`                   | 意外布局偏移分数累计                   |
| FCP         | 监听 `paint` / `onFCP`                          | 首次内容绘制                           |
| TTFB        | `navigation` 时序 / `onTTFB`                    | 首字节时间，反映后端与网络             |
| 长任务      | 监听 `longtask`                                 | 主线程被阻塞超过 50ms 的任务           |
| 资源瀑布    | 监听 `resource`                                 | 静态资源的加载时序与体积               |
| 导航时序    | `performance.getEntriesByType('navigation')[0]` | 一次导航内 DNS/TCP/TTFB/DOM 各阶段耗时 |
| 自定义打点  | `performance.mark()` / `performance.measure()`  | 业务侧自定义的耗时区间                 |

> 兼容性提醒：`longtask`、`first-input` 目前主要是 Chromium 系浏览器支持，Safari/Firefox 下拿不到，采集时需做能力检测与降级；跨域的 `resource` 条目只有配上 `Timing-Allow-Origin` 响应头，才能拿到细粒度耗时。

## 5. 数据上报的底层策略 (Transport Architecture)

拿到了错误和性能数据，怎么把它们发送给后端的统计服务器？这就涉及到了前端的“**网络工程学**”。

### 5.1 为什么不用普通的 AJAX / Fetch？

如果用户在关闭页面或跳转网页的那一瞬间发生报错，如果使用 `Fetch` 或 `XMLHttpRequest`，浏览器会立刻销毁当前页面的所有网络连接，导致**上报请求在半路被强制掐断**，数据永久丢失。

### 5.2 终极解法：`navigator.sendBeacon()`

**底层机制：** 它将数据交给操作系统的底层网络队列去发送。即使页面已经被关闭（Unload），操作系统依然会在后台默默把这条请求发完。**它是页面卸载时数据绝对不丢失的唯一保障。**

### 5.3 优雅降级：1x1 像素 GIF 魔法

如果用户的浏览器太老不支持 `sendBeacon` 怎么办？业界标准的 Fallback 方案是动态创建一个 `Image` 对象：

```javascript
const img = new Image()
img.src = `https://monitor.com/report?data=${encodeURIComponent(JSON.stringify(errorData))}`
```

- **为什么是 GIF？** 体积最小，不会引发跨域警告（图片天生支持跨域），而且不需要挂载到 DOM 树上就能悄无声息地发出 GET 请求。

## 6. 企业级性能测试实战

在现代前端工程（尤其是基于 Vite 的开发模式）中，`Unlighthouse` 的接入体验可以说是极其丝滑。

在企业级落地中，我们通常会把它分为**本地开发时的伴生雷达**和**流水线上的全站质检**两个阶段。

### 6.1 本地极速集成 (Vite 插件模式)

在日常开发中，我们希望每改一行组件代码，就能实时看到全站性能的波动。直接将其作为 Vite 插件侵入到构建流程中，是目前 DX（开发者体验）最好的方式。

**安装核心依赖**
在项目根目录执行：

```bash
pnpm add -D @unlighthouse/vite @unlighthouse/cli puppeteer
```

_(注：显式安装 `puppeteer` 是为了确保无头浏览器的底层依赖在你的 Mac 或后续的 CI 环境中都能稳定获取。)_

:::code-group

```typescript [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unlighthouse from '@unlighthouse/vite'

export default defineConfig({
  plugins: [
    vue(),
    // 仅在本地开发模式下启动 Unlighthouse 仪表盘，防止污染生产构建
    process.env.NODE_ENV !== 'production'
      ? Unlighthouse({
          // 我们将在下一步分离具体配置
        })
      : undefined,
  ],
})
```

:::

配置好后，只需像平时一样运行 `pnpm run dev`，你的终端就会额外输出一个本地 URL（通常是 `http://localhost:5678`）。打开它，这就是你的全站性能仪表盘。

### 6.2 企业级独立配置 (unlighthouse.config.ts)

当你的组件库或应用规模变大，有上百个路由时，我们需要精准控制扫描器的行为，防止扫描耗时过长或占用过多 CPU。

在项目根目录新建一个 `unlighthouse.config.ts` 文件。这是企业级配置的心脏：

:::code-group

```typescript [unlighthouse.config.ts]
import { defineConfig } from 'unlighthouse'

export default defineConfig({
  // 1. 目标站点：通常在 CI/CD 中会通过环境变量覆盖这里
  site: 'http://localhost:3000',

  // 2. 扫描器策略 (核心调优)
  scanner: {
    // 模拟移动端还是 PC 端？通常企业要求两端都跑，这里先设为 mobile
    device: 'mobile',
    // 🚦 企业级核心防坑：动态路由采样
    // 如果你有 /user/1, /user/2 等上千个动态路由，开启此项。它会自动通过 URL 模式匹配，同类路由只抽样扫 1-2 个，极大缩短全站扫描时间。
    dynamicSampling: true,
  },

  // 3. 断言与卡点 (Performance Budget)
  // 如果这里的分数不达标，在 CI/CD 环境下执行 unlighthouse --ci 时会返回 Exit Code 1，强制阻断流水线
  ci: {
    budget: 85, // 全站页面的性能中位数必须大于 85 分
    buildStatic: false, // 是否在本地打包一份静态的 HTML 报告
  },

  // 4. 钩子系统 (用于复杂业务鉴权)
  hooks: {
    // 如果你的后台系统需要登录才能看到具体页面，必须在这里写脚本
    'puppeteer:before-goto': async page => {
      // 这里的 page 就是 Puppeteer 的 Page 实例
      // 方案 A: 注入 Cookie/Token
      await page.setExtraHTTPHeaders({
        Authorization: 'Bearer YOUR_TEST_TOKEN',
      })

      // 方案 B: 让浏览器自动去输入账号密码
      // 检查当前无头浏览器是否已经有我们业务逻辑里的鉴权 Token
      const cookies = await page.cookies()
      const hasToken = cookies.some(c => c.name === 'admin_token')

      // 如果没登录，先执行一波黑客式的“自动填表”
      if (!hasToken) {
        console.log('🔒 正在突破登录网关...')
        await page.goto('http://localhost:3000/login', {
          waitUntil: 'networkidle0',
        })

        // 这里的选择器必须和你们 Vue 组件里的 id/class 严丝合缝
        await page.type('input[name="username"]', 'admin_test')
        await page.type('input[name="password"]', 'System@2026!')

        // 点击登录按钮，并死等页面发生路由跳转
        await Promise.all([
          page.click('.el-button--primary'), // 假设使用了类似 Element Plus 的类名
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ])
        console.log('🔓 登录成功，开始全站深网扫描...')
      }
    },
  },
})
```

:::

### 6.3 自动化流水线接入 (CI/CD 质检)

本地调优完成后，我们要把它搬到远端。因为 `Unlighthouse` 跑起来需要拉起多个无头浏览器实例，对机器性能要求较高。

:::code-group

```json [package.json]
"scripts": {
  "build": "vite build",
  "test:perf": "unlighthouse --ci --site https://your-staging-env.com"
}
```

```yaml [.github/workflows/perf.yml]
name: Unlighthouse Site Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install

      # 启动一个本地的预览服务器，或者直接指向你们内部的测试服
      - name: Start Preview Server
        run: pnpm run preview &

      # 等待服务启动并执行自动化扫描
      - name: Run Unlighthouse
        run: pnpm run test:perf
```

:::

## 7. 企业级性能监控实战

在企业级前端工程化体系中，将 Sentry 性能监控与 CI/CD（持续集成/持续部署）流水线深度融合，是实现“**从代码提交到线上报警**”全链路闭环的终极形态。

这套架构的核心诉求有三个：**安全（SourceMap 绝不泄露到公网）**、**精准（报警直接关联到具体的 Git Commit 和代码行）**、**可控（精细化管理海量并发下的 API 额度和采样率）**。

### 7.1 应用层基座封装与动态采样配置

在代码层面，不能简单地调用初始化方法。必须封装一个独立的监控基座，根据环境变量实行严格的隔离，并针对 `Performance`（性能）和 `Session Replay`（录屏）制定动态采样策略。

:::code-group

```typescript [src/utils/sentry.ts]
import * as Sentry from '@sentry/vue'
import type { App } from 'vue'

export function initPerformanceMonitoring(app: App) {
  const env = import.meta.env.MODE

  // 坚决阻断本地开发环境的数据上报，防止污染生产大盘数据
  if (env === 'development') {
    console.info('[Monitor] 本地开发环境，Sentry 已禁用')
    return
  }

  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: env,
    // 从环境变量注入当前构建版本的 Hash，这是关联 CI/CD 的核心钥匙
    release: import.meta.env.VITE_RELEASE_VERSION || 'unknown',

    // --- 流量与成本管控矩阵 ---
    // 生产环境全量采集会导致资源枯竭，通常性能数据采样率控制在 5% - 10%
    tracesSampleRate: env === 'production' ? 0.05 : 1.0,
    // 正常用户的会话不录屏（节省海量存储），仅当发生 Error 时 100% 录制错误发生前 30 秒的回放
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration({
        // 全链路打通：当前端请求发往以下白名单域名时，自动在 Header 中注入 trace-id
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.yourcompany\.com/,
        ],
      }),
      Sentry.replayIntegration({
        // 隐私合规 (GDPR/PII)：强制脱敏页面上的所有输入框内容和媒体资源
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // --- 降噪与数据清洗 ---
    beforeSend(event, hint) {
      const error = hint.originalException
      // 过滤常见的无害浏览器插件报错或底层断网异常
      if (
        error &&
        typeof error === 'string' &&
        error.includes('ResizeObserver loop limit')
      ) {
        return null
      }
      return event
    },
    beforeSendTransaction(transaction) {
      // 聚合动态路由，防止 Sentry 面板被 /user/1, /user/2 等散列路由淹没
      if (transaction.transaction) {
        transaction.transaction = transaction.transaction.replace(
          /\/user\/\d+/g,
          '/user/:id',
        )
      }
      return transaction
    },
  })
}
```

:::

### 7.2 构建流入侵与 SourceMap 安全管控

这是企业级基建的安全生命线。我们需要利用 Vite 插件，在打包阶段生成 `.map` 文件，**将其私密上传给 Sentry 服务器，随后在推送到远端服务器前将其彻底删除**。

:::code-group

```typescript [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    // 必须开启，否则无法生成供 Sentry 解析的映射文件
    sourcemap: true,
  },
  plugins: [
    vue(),
    sentryVitePlugin({
      org: 'your-enterprise-org',
      project: 'vue-admin-system',
      // 鉴权 Token 必须通过 CI/CD 环境变量注入，严禁硬编码
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      release: {
        // 与 SDK 初始化的 VITE_RELEASE_VERSION 保持绝对一致
        name: process.env.VITE_RELEASE_VERSION,
        setCommits: {
          auto: true, // 极其关键：自动抓取当前的 Git Commits 记录绑定到此版本
        },
      },
      sourcemaps: {
        assets: './dist/**',
        // 安全红线：上传成功后，立刻销毁本地 dist 目录下的所有 .map 文件
        filesToDeleteAfterUpload: './dist/**/*.map',
      },
    }),
  ],
})
```

:::

### 7.3 CI/CD 流水线编排 (GitHub Actions 示例)

真正的自动化体现在流水线脚本中。流水线承担着环境注入、打包编译、产物推送以及向 Sentry 发送“**上线通知**”的职责。

:::code-group

```yaml [.github/workflows/deploy.yml]
name: Enterprise Production Deploy

on:
  push:
    branches:
      - main # 仅响应主分支的合并发布

env:
  # 获取当前 Git Commit 的 SHA 前 7 位作为唯一版本号
  RELEASE_VERSION: ${{ github.sha }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  SENTRY_ORG: 'your-enterprise-org'
  SENTRY_PROJECT: 'vue-admin-system'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码 (必须 fetch 完整历史以提取 Commit 信息)
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 设置 Node 与 pnpm 缓存
        uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      # --- 1. 编译与安全处理环节 ---
      - name: 执行生产构建 (自动触发 Sentry 插件上传并删除 SourceMap)
        run: VITE_RELEASE_VERSION=${{ env.RELEASE_VERSION }} pnpm run build

      # --- 2. 部署环节 ---
      - name: 部署至生产服务器 (此处替换为实际的 CDN/Nginx/OSS 部署命令)
        run: |
          echo "Syncing ./dist/ to production servers..."
          # 例如：aws s3 sync ./dist s3://your-production-bucket

      # --- 3. 监控闭环环节 ---
      - name: 安装 Sentry CLI
        run: curl -sL https://sentry.io/get-cli/ | bash

      - name: 通知 Sentry 部署成功并激活版本监控
        run: |
          # 告诉 Sentry 该版本已正式部署到 production 环境，开始计算崩溃率等核心指标
          sentry-cli releases deploys "$RELEASE_VERSION" new -e production
```

:::

### 7.4 大盘监控与嫌疑人追踪 (Suspect Commits)

当这套 CI/CD 流程跑通后，你的团队将获得堪比“**上帝视角**”的研发体验：

- **源码级报错还原：** 线上用户触发了一个报错，Sentry 面板不仅能展示具体的 `App.vue:142` 行代码，还会直接高亮出那行代码的内容。
- **精准责任落实 (Suspect Commits)：** 因为我们在 CI 中注入了 Git 信息，Sentry 会自动分析报错行对应的 `git blame`。面板会醒目地提示：“**此错误极有可能是由 [开发者A] 在 4小时前的 Commit `refactor: 重构权限计算钩子` 引发的**”，并直接附带跳转到代码托管平台的 PR 链接。
- **版本性能劣盘 (Release Health)：** 在 Sentry 的 Releases 面板中，你可以对比本次 `main` 分支发布与上个版本的指标差异。如果新版本的 INP（交互延迟）从平均 120ms 暴增到 400ms，或者无崩溃会话率（Crash Free Sessions）跌破 99%，团队可以立刻决定启动自动化回滚策略。

## 8. 性能治理闭环：预算、异动排查与告警降噪

性能监控不止于「采集与上报」，更要形成「预算卡点 → 异动排查 → 告警降噪」的持续治理闭环，以机制对抗性能的慢性劣化。

### 8.1 监控指标的立体分层

将海量监控数据按决策生命周期分层，过滤信息噪音：

- **核心体验层 (Core Web Vitals)**：LCP、INP、CLS，直接反映终端用户的真实体感。
- **工程诊断层 (Diagnostics)**：Long Task 长任务、Resource 瀑布流、JS Error Rate、Bundle 产物核心包体积，提供精确到代码行的排障线索。
- **链路追踪层 (Tracing)**：首屏 TTFB、BFF/微服务 API 响应时长、CDN 命中率,横跨前后端定位全链路瓶颈。
- **业务水位层 (Business Impact)**：跳出率、核心路径转化率，用以向业务方量化性能优化的商业 ROI。
- **发布溯源指标**：Release 版本号、构建批次、灰度标签，精准定界。

### 8.2 性能预算与流水线集成

缺乏预算机制的优化必然面临退化。预算规则必须以`JSON/YAML`形式沉淀为代码库的一部分,并与 PR 强绑定：

```json
{
  "ci": {
    "budgets": [
      {
        "path": "/*",
        "metrics": { "lcp": 2500, "inp": 200, "cls": 0.1 },
        "resourceSizes": [
          { "resourceType": "script", "budget": 150 },
          { "resourceType": "third-party", "budget": 50 }
        ]
      }
    ]
  }
}
```

- **红线阻断 (Hard Blocking)**：核心主干合并时，一旦核心 JS 产物超标或关键页面 LCP 退化超过 10%，直接 Fail Pipeline。
- **温和告警 (Soft Warning)**：非核心指标的轻微退化，通过企业微信或 Slack 推送，并自动生成优化排期 Issue。
- **版本基线 (Baseline Diff)**：不看绝对值，强制对比`Current Release`与`Previous Stable`的 P75 差距。

### 8.3 性能异动排查

面对大盘监控异动，严禁盲目「试错式优化」，需严格遵循降维拆解流程：

- **圈定影响爆炸半径**：先确认是全局基建恶化（CDN 节点故障、基础库发版），还是单一业务路由慢，亦或特定设备系统兼容异常。
- **切片拆解核心指标**：例如 LCP 飙高，需拆解为 `TTFB` → `Load Delay` → `Load Time` → `Render Delay`，锁定具体耗时黑洞。
- **关联追踪异常**：性能暴跌往往伴随运行时崩溃，将 INP 卡顿数据与同时段的 JS Error 或接口 5xx/4xx 报错率联合排查。
- **灰度桶验证 (A/B Testing)**：底层引擎或构建层面的重大性能重构，必须严格分桶验证，通过统计学显著性确认优化成果，而非只看均值。

### 8.4 告警治理与降噪哲学

无效告警是对团队心智的消耗，必须构建高信噪比的报警策略：

- **废弃均值，死守 P-分位**：绝对不要看平均值（会被极好或极差数据稀释），核心盯防 **P75**（大盘及格线）与 **P90**（长尾体验）。
- **持续性窗口阈值**：避免短时网络抖动触发「狼来了」，设定如「连续 3 个 5 分钟窗口 P75 LCP > 3000ms」才触发 P1 级电话告警。
- **优先级矩阵**：按业务核心链路分配权重，交易链路红线告警直达高管，周边支持型页面仅作日报汇总。

### 8.5 高频落地场景

- **首屏劣化归因**：把 LCP 拆成 `TTFB → 资源加载延迟 → 资源加载耗时 → 渲染延迟` 四段，与上一版本对比，快速判断是后端接口慢、CDN 资源慢，还是首屏 JS 阻塞了主线程。
- **慢接口定位**：用 `resource` 条目或 `performance.measure` 给关键请求打点，把前端 `duration` 与后端 trace-id 关联，区分“**网络慢**”还是“**服务端慢**”。
- **线上白屏告警**：同时监听 `window.onerror`、`unhandledrejection`、资源加载失败与 Sentry 的 Crash Free Sessions，任一指标突变即告警，而不是等客服反馈。
- **交互卡顿排查**：用 `longtask` 采集主线程阻塞，定位到具体的长任务及其触发组件，指导拆包、惰性渲染或用 `requestIdleCallback` 分片。
- **第三方脚本审计**：单独统计第三方域名的 `resource` 耗时与体积，揪出拖后腿的广告/统计脚本并做异步化或延迟加载。
- **发布回归对比**：每次Release绑定版本号,对比新旧版本的Core Web Vitals P75,超过阈值自动触发回滚评估。

## 9. 常见问题 (FAQ) 与架构级避坑指南

### 9.1 报错日志里全都是神秘的 `Script error.`，完全没有堆栈，怎么办？

- **根因：** 这是浏览器的同源安全策略（CORS）防线。如果你的前端 HTML 部署在 `www.a.com`，而你的 JS 文件部署在 CDN 域名 `cdn.b.com` 下。一旦 JS 发生报错，浏览器为了防止隐私泄露，会故意隐藏真实错误，只抛出一个没有任何参考价值的 `Script error.`。
- **架构解法（缺一不可）：**
  - 前端：在引入 JS 资源的 `<script>` 标签上增加 `crossorigin="anonymous"` 属性。
  - 运维端：确保 CDN 服务器对该 JS 文件响应 `Access-Control-Allow-Origin: *` 的 HTTP 头。

### 9.2 引入监控 SDK 后，大促期间 PV 暴涨，监控服务器直接被打挂了？

- **根因：** 巨量用户的每一次点击、每一个微小的性能事件都发起网络请求，这相当于对你自己的监控服务器发起了 DDoS 攻击。
- **架构解法（采样率与合并上报）：**
  - **采样率 (Sample Rate)：** 在 SDK 初始化时配置 `sampleRate: 0.1`，意味着只有 10% 的用户开启上报。在庞大的基数下，10% 的数据足以反映宏观趋势。
  - **批量合并 (Batching)：** 不要在发生错误时立刻发请求。将数据存入内存队列（利用 `requestIdleCallback` 等待浏览器空闲），每攒够 10 条，或经过 3 秒钟，合并成一个大型 JSON 请求发送。

### 9.3 性能测试在本地跑分 100 分，为什么线上真实数据一塌糊涂？

- **认知的鸿沟：Lighthouse 不是银弹。** 开发者在本地用 Lighthouse 跑出的叫**实验室数据 (Lab Data)**（千兆网速、顶配 MacBook）。而线上收集回来的叫**真实用户数据 (RUM - Real User Monitoring)**。
- 真实用户可能在坐地铁信号极差，可能用的是 5 年前的千元安卓机。**RUM 数据才是衡量系统架构质量的唯一真理。** 监控系统的核心使命，就是去捕获那真实世界中 90 分位（P90）长尾用户的痛点，并指导架构师进行极致的性能重构。

### 9.4 为什么 `window.onerror` 抓不到图片、JS 加载失败这类错误？

- **根因：** 资源加载错误不会冒泡到 `window`，所以常规（冒泡阶段）的 `window.onerror` 收不到。
- **解法：** 用事件捕获阶段监听——`window.addEventListener('error', handler, true)`，第三个参数 `true` 是关键；同时配合 `window.addEventListener('unhandledrejection', handler)` 兜住未处理的 Promise。

:::code-group

```js [src/monitor/resource-error.js]
// report() 沿用 2.1 的统一上报入口

window.addEventListener(
  'error',
  event => {
    const target = event.target

    // 只处理资源错误。JS 运行时错误继续交给 2.1 的 window.onerror，
    // 否则同一个错误会被上报两次
    if (!(target instanceof HTMLElement)) return

    report({
      type: 'resource-error',
      tag: target.tagName.toLowerCase(),
      url: target.src || target.href || target.currentSrc || 'unknown',
    })
  },
  true, // 关键：资源错误不冒泡，只有捕获阶段能收到
)

// Promise 未处理拒绝：error 事件收不到，必须单独监听
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason

  report({
    type: 'unhandledrejection',
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  })
})
```

:::

资源错误和 JS 错误都会触发 `error` 事件，用 `event.target` 就能区分：前者是具体的元素，后者是 `window`。如果团队不用 `window.onerror`，也可以在这个捕获监听里统一处理两类错误，但**只能选一种**，否则会重复上报。

### 9.5 FID 为什么被 INP 取代？采集上要注意什么？

- **区别：** FID 只测量**第一次**交互的输入延迟，且只算到“**浏览器开始响应**”为止；INP 测量**整个生命周期内所有交互**，并一直算到“**下一帧真正绘制出来**”。因此 INP 更能反映用户全程的卡顿体感，也能揪出“**第一次点击很快、后面越用越卡**”的性能劣化。
- **采集：** 用 `web-vitals` 的 `onINP` 即可，它内部会处理交互筛选与 P98 取值；自研 SDK 则需监听 `event` 条目并按交互分组取高分位，不要用平均值。

### 9.6 Sentry 的 `tracesSampleRate` 设成多少合适？

- **原则：** 采样率不是越高越好，要在**数据代表性**与**费用/性能开销**之间权衡。
- **推荐值：** 生产环境性能数据通常控制在 5% - 10%（如 `tracesSampleRate: 0.05`），既能反映宏观趋势又不会压垮 Sentry 配额；预发/测试环境可设 `1.0` 全量采集。
- **降低成本：** 会话录屏用 `replaysSessionSampleRate: 0.0` 平时不录、`replaysOnErrorSampleRate: 1.0` 只在报错时录制，能在保留排障能力的同时省下大量存储。

### 9.7 线上突然大面积白屏，如何第一时间告警而不是等客诉？

- **告警信号：** 组合监控几个信号——JS 错误率突增、`unhandledrejection` 飙升、Sentry 的 Crash Free Sessions 跌破阈值、以及关键资源（入口 `index.html`、主 JS）加载失败率上升。
- **关联发布：** 把告警与 `release` 版本绑定，出现异常时立刻能判断“**是不是刚刚这次发布引起的**”，从而果断回滚。
- **窗口与降噪：** 用“**连续 N 个时间窗口错误率超阈值**”触发 P1，避免偶发抖动误报；同时用 SourceMap 反解出首错堆栈，直接定位到源码行。
