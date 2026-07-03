# 首屏体验优化

**核心本质**：首屏优化（First Contentful Paint & LCP Optimization）是一场“**时间争夺战**”。它的目标并非无脑压缩一切，而是通过精准的关键渲染路径（Critical Rendering Path）编排，让用户以最快速度看到主体内容，并完成核心交互。

**战术纪律**：优先砍掉最长的网络瀑布流，优先打散主线程最长的阻塞任务。

## 1. 首屏渲染的生命周期链路

一次典型的首屏加载，本质上是浏览器资源的获取与解析接力。理解链路是寻找瓶颈的前提：

* **网络建立**：DNS 解析 -> TCP 握手 -> TLS 协商 -> 获取并下载 HTML。
* **DOM 解析**：浏览器单线程从上到下解析 HTML，遇到 `<script>` 或 `<link>` 触发资源请求。
* **渲染树构建**：下载并解析 CSS（CSSOM 构建会阻塞渲染）。
* **执行与激活**：下载并执行首屏强依赖的 JS 脚本（CSR 应用此时才开始生成 DOM）。
* **绘制上屏**：Layout（布局计算） -> Paint（绘制像素） -> Composite（图层合并），首屏内容最终呈现。

## 2. 服务端与网络提速

首屏慢，很多时候是底座慢（TTFB 过高）。

* **边缘交付**：全量静态资源与不常变的 HTML 必须挂载 CDN。对半动态页面探索 Edge Rendering（边缘渲染）或流式传输。
* **架构升级**：内容型（如资讯、电商详情页）或重度依赖 SEO 的系统，必须采用 SSR（服务端渲染）或 SSG（静态生成），彻底消灭 CSR 的“**千禧白屏**”。
* **接口前置聚合**：如果首屏需要串行调取 3 个以上 API，强烈建议在服务端或 BFF（Backend For Frontend）层进行接口聚合，一次性吐出，或直接将首屏数据内联（Inline）在 HTML 的 `<script>` 标签中。

## 3. 关键资源调度与抢占

浏览器的默认并发下载能力是有限的，必须手动指挥它“**先加载什么，后加载什么**”。

* **首屏主图特权**：对首屏最具视觉冲击力的元素（Banner、Hero 视频图），给予最高优先级 `fetchpriority="high"`。
* **阻塞剔除 (Critical CSS)**：首屏渲染极其依赖 CSS。建议内联“**首屏关键样式**”，并将其余不重要的 CSS 设为异步加载，防止其阻塞渲染树的构建。
* **非关键资源延后**：非首屏图片（Lazyload）、底部评论区组件、第三方统计脚本（如 Google Analytics、Sentry），一律延后到 `requestIdleCallback` 或 `window.onload` 之后执行。

```html
<head>
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  
  <link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />
  
  <link rel="stylesheet" href="/assets/home.css" />
  
  <script defer src="https://analytics.com/script.js"></script>
</head>
```

## 4. 客户端运行时剥离

现代前端最沉重的负担在于：**庞大的 JavaScript 包不仅需要下载，更需要极其耗时的单线程解析与执行**。

* **极致的路由拆分**：首屏 JS 强行锁定在仅包含当前路由页面的逻辑。
* **超重组件“放逐”**：首屏如果存在 Echarts、PDF.js、Three.js 或富文本编辑器，必须使用动态引入 `import()` 进行物理隔离。
* **砍掉初始化冗余**：检查全局的 `main.ts` 或 `App.vue`。如果启动时去扫描了全量的持久化数据（如几千条 IndexedDB 记录），或是全量执行了不必要的鉴权运算，请将其推迟。

```javascript
// Vue 3 异步组件隔离法
import { defineAsyncComponent } from 'vue';

// 只有当用户真的点开了图表弹窗，这个重型文件才会被拉取并解析
const HeavyChartPanel = defineAsyncComponent({
  loader: () => import('./components/HeavyChartPanel.vue'),
  delay: 200 // 防闪烁延迟
});

```

## 5. DOM 复杂度与视觉维稳

渲染引擎的压力同样不可忽视。

* **控制 DOM 深度**：首屏 DOM 节点总数建议控制在 1500 个以内，最大嵌套深度不超过 32 层。深不可测的 DOM 树会几何级增加 Layout 的计算时间。
* **严打强制同步布局 (Layout Thrashing)**：绝不要在 JS 的循环中交替进行 DOM 的“读”操作（如 `offsetHeight`）和“写”操作（如 `style.height`）。
* **防御 CLS (累积布局偏移)**：骨架屏不仅是为了好看，更是为了“**占坑**”。骨架屏的物理尺寸必须与真实数据加载后的尺寸 1:1 对齐，绝不能让真实内容上屏时把别的元素挤飞。

## 6. 核心度量指标

优化没有玄学，一切看真实数据的 P75 分位值表现：

| 核心指标 | 观测目标与含义 | 优化达标线 |
| --- | --- | --- |
| **TTFB** (首字节) | 服务器响应是否拖了后腿。 | < 800ms |
| **FCP** (首次内容绘制) | 用户何时打破了令人焦虑的纯白屏。 | < 1.8s |
| **LCP** (最大内容绘制) | 首屏主体内容是否已完整呈现。 | < 2.5s |
| **INP** (交互到下次绘制) | 首屏期间，JS 是否把主线程卡死，导致点击无响应。 | < 200ms |
| **CLS** (累积布局偏移) | 首屏加载全程，画面是否出现了令人不悦的抖动和错位。 | < 0.1 |