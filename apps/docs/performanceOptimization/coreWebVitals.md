# Core Web Vitals 性能工程基准指南

**核心本质**：Core Web Vitals (CWV) 是 Google 定义的用于衡量真实用户体验（UX）与页面健康度的三大黄金指标。它标志着性能优化从“**实验室里的 `window.onload`**”正式迈向了“**以用户为中心的真实体感**”时代，并直接与 SEO 搜索排名权重挂钩。

**度量准则**：永远不要拿自己本地的高配电脑跑分自欺欺人。企业级度量的铁律是看 **线上真实用户分布的 P75 分位值（75th percentile）**。

## 1. LCP (最大内容绘制)：视觉加载的终极考验

**定义**：Largest Contentful Paint，指视口内“**最大可见内容元素**”（通常是首屏主图、Hero 视频封面、或最大的 H1 文本块）完成渲染的绝对时间。

### 1.1 指标阈值

[width(20,36,44)]

| 🟢 良好 (Good) | 🟡 待改进 (Needs Improvement) | 🔴 较差 (Poor) |
| -------------- | ----------------------------- | -------------- |
| **≤ 2.5s**     | 2.5s ~ 4.0s                   | **> 4.0s**     |

### 1.2 深度瓶颈解构 (LCP 的 4 个子阶段)

LCP 的延迟并非单一原因，它由四个串行阶段叠加而成：

- **TTFB (首字节时间)**：DNS 解析慢、服务端查询慢或缺乏 CDN 边缘缓存。
- **资源加载延迟 (Load Delay)**：LCP 图片在 HTML 中没有被及时发现（例如背景图在 CSS 里，或由 JS 动态生成 DOM 后才发起请求）。
- **资源加载耗时 (Load Time)**：图片本身体积过大，未使用 WebP/AVIF 等现代格式。
- **元素渲染延迟 (Render Delay)**：JS 或 CSS 阻塞了浏览器的渲染主线程，导致图片下载完了却画不出来。纯 CSR（客户端渲染）架构极易在此阶段严重失分。

**定位到 API：LCP entry 的高频字段**（用 `PerformanceObserver` 监听 `largest-contentful-paint` 能拿到）：

[width(29,71)]

| 字段                                    | 含义                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `element`                               | **到底是哪个元素成了 LCP**——排查第一步永远是先看它                       |
| `url`                                   | 该元素的资源地址（图片 / 视频才有，纯文本元素为 `undefined`）            |
| `size`                                  | 元素可见面积，决定“**谁最大**”                                           |
| `startTime` / `loadTime` / `renderTime` | 三个时间戳，`web-vitals` 的 attribution 版本正是拿它们拆出上面四个子阶段 |
| `id` / `className`                      | 元素标识，便于在 DOM 里精确定位                                          |

```javascript
// 先弄清“LCP 是谁、卡在哪一段”，再谈优化
new PerformanceObserver(list => {
  const entry = list.getEntries().at(-1) // 取最后一次：页面可能多次刷新 LCP
  const { element, url, loadTime, renderTime } = entry
  console.log('LCP 元素', element, '资源', url)
  console.log('资源加载耗时', renderTime - loadTime) // 越大说明图越重
}).observe({ type: 'largest-contentful-paint', buffered: true })
```

> `buffered: true`不能省:LCP 往往在你注册观察者之前就已经发生，不加它就只能等下一次。

[width(15,20,65)]

| 页面类型              | LCP 元素通常是              | 优先动作                                                                           |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| 电商详情 / 商品列表   | 主图（常在懒加载轮播里）    | 首图 `fetchpriority="high"` 且**禁止 lazy**；轮播只预载第一张                      |
| 资讯 / 博客详情       | 头图，或最大的 H1 文本块    | 头图走 `<picture>` + `preload`；若是文本块，问题在“**渲染延迟**”，去砍 CSS/JS 阻塞 |
| 营销活动 / 落地页     | Hero 背景大图（CSS 背景图） | 背景图必须 `preload`，否则要等 CSSOM 构建完才被发现                                |
| 后台工作台 / CSR 应用 | 骨架屏或首个数据区块        | 推进流式 SSR 或首屏数据内联，否则 LCP 会一直卡在渲染延迟段                         |

### 1.3 极速优化策略

- **网络与架构提速**：全面接入 CDN，高优接口开启聚合；针对 CSR 应用，推进流式 SSR（服务端渲染）或 SSG（静态站点生成）改造。
- **资源优先级抢占**：通过 `fetchpriority="high"` 强行提升首屏核心资源的获取优先级。
- **阻塞剔除**：内联首屏关键 CSS（Critical CSS），将非首屏的 JS 与第三方统计脚本打上 `defer` 或 `async` 标签。

```html
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />
<img
  src="/hero.avif"
  width="1200"
  height="640"
  fetchpriority="high"
  alt="首屏主图"
/>
```

## 2. INP (交互到下一次绘制)：主线程的调度艺术

**定义**：Interaction to Next Paint，全面取代了老旧的 FID（首次输入延迟）。它监控页面生命周期内**最慢的一次**交互（点击、按键、触摸）从触发到浏览器真正把下一帧画面画出来的全链路延迟。

### 2.1 指标阈值

[width(20,36,44)]

| 🟢 良好 (Good) | 🟡 待改进 (Needs Improvement) | 🔴 较差 (Poor) |
| -------------- | ----------------------------- | -------------- |
| **≤ 200ms**    | 200ms ~ 500ms                 | **> 500ms**    |

### 2.2 核心瓶颈：Long Tasks (长任务)

当主线程被超过 50ms 的 JavaScript 任务霸占时，用户的任何点击都会感觉“**卡死**”。

- **运行时开销**：在处理庞大数据的响应式状态变更时，如果触发了极为深层或复杂的虚拟 DOM 比对（VNode Patching）与副作用收集，极易打爆主线程。
- **同步计算**：在 onClick 回调中执行沉重的 JSON 解析、复杂的正则或阻塞型 DOM 操作。

**INP的三段拆解（决定你该往哪儿优化）**：一次交互的延迟由三段串行叠加,`event` 类型的 entry 正好能拆出来：

[width(26,22,24,28)]

| 阶段                              | 从哪读                                   | 这段慢说明什么                                         | 优化方向                                              |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| **输入延迟 (Input Delay)**        | `processingStart - startTime`            | 主线程**在用户点击前就被长任务占着**，回调还没轮到执行 | 拆长任务、让出主线程，这才是最常见的元凶              |
| **处理时间 (Processing Time)**    | `processingEnd - processingStart`        | 你的事件回调自身跑太久                                 | 减少同步计算、避免强制同步布局、状态更新降级          |
| **呈现延迟 (Presentation Delay)** | `duration - (processingEnd - startTime)` | 回调结束了，但下一帧迟迟画不出来                       | 缩小 DOM 变更范围、避免大面积重排、动画走 `transform` |

```javascript
// 只上报“有感知”的交互：durationThreshold 最低 16ms，能过滤掉高频噪音
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration, entry.interactionId)
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 200 })
```

> `interactionId` 是聚合的关键：一次「点击」往往同时产生 `pointerdown`、`pointerup`、`click` 多个 entry，它们的 `interactionId` 相同——**按它分组后取最大 `duration`，才是一次真实交互的 INP**。

[width(20,80)]

| 场景            | 为什么容易超标                               |
| --------------- | -------------------------------------------- |
| 搜索框联想输入  | 每次按键都触发全量过滤 + 渲染整个结果列表    |
| 表单提交        | 提交回调里同步做校验、序列化大对象、埋点组装 |
| 打开弹窗 / 抽屉 | 首次挂载重型组件（图表、富文本、地图）       |
| 表格排序 / 筛选 | 十万行数据在主线程同步排序                   |
| 主题 / 语言切换 | 一次性重渲染整棵组件树                       |

### 2.3 调度优化策略

- **任务切片 (Task Yielding)**：不要一口气吃成胖子。将处理几万条数据的同步循环，利用 `setTimeout` 或 `requestIdleCallback`(榨干浏览器的剩余算力，同时绝对不阻塞主线程) 拆解为多个宏任务，主动向浏览器主线程“**交出控制权**”（Yielding），让其有机会响应用户的点击。
- **渲染降维**：长列表必须使用虚拟列表（Virtual Scroll）；合理设计响应式数据的颗粒度，避免牵一发而动全身的无效 Render。
- **Worker 隔离**：将纯计算密集型任务（如大文件哈希计算、树形结构深层遍历）转移至 Web Worker。

```javascript
// 实践：时间分片（Time Slicing）执行大批量任务
function runInChunksWithIdle(items, handler) {
  let index = 0

  // 这里的 deadline 是浏览器传入的 IdleDeadline 对象
  function next(deadline) {
    // 核心逻辑：只要还有未处理的数据，并且当前帧还有大于 1ms 的空闲时间，就继续执行
    // (留 1ms 的 buffer 是为了防止微小的函数执行超时)
    while (index < items.length && deadline.timeRemaining() > 1) {
      handler(items[index++])
    }

    // 如果执行完上述循环后，还有数据没处理完，说明当前帧的空闲时间耗尽了
    // 那么就把剩余的任务继续挂起到下一个空闲帧
    if (index < items.length) {
      // 传入 { timeout: 2000 } 作为兜底：如果主线程持续繁忙超过 2 秒，强制唤醒执行，防止任务彻底饿死
      requestIdleCallback(next, { timeout: 2000 })
    }
  }

  // 启动第一次调度
  requestIdleCallback(next, { timeout: 2000 })
}
// 使用示例：
// runInChunksWithIdle(hugeDataArray, (item) => {
//   console.log('处理复杂数据:', item);
// });
```

## 3. CLS (累积布局偏移)：视觉稳定性的守护者

**定义**：Cumulative Layout Shift，衡量页面生命周期内，所有意外发生的元素位置移动的总得分（移动距离 × 影响面积）。排版突然跳动会导致用户误触，是体验的毁灭者。

### 3.1 指标阈值

[width(20,36,44)]

| 🟢 良好 (Good) | 🟡 待改进 (Needs Improvement) | 🔴 较差 (Poor) |
| -------------- | ----------------------------- | -------------- |
| **≤ 0.1**      | 0.1 ~ 0.25                    | **> 0.25**     |

### 3.2 计分规则与常见场景

先记住 CLS 的**计分规则**，否则你会为「明明在动却不扣分」而困惑（高频属性）：

[width(28,72)]

| 规则                          | 说明                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 单个偏移的得分                | **影响比例 × 移动距离比例**——被挤动的元素越多、移动得越远，扣分越狠                                          |
| **用户输入后的偏移不计分**    | `hadRecentInput` 为 `true` 时不算，即用户操作后约 **500ms 内**的位移视为“**预期内**”（点击展开菜单不算 CLS） |
| **会话窗口 (Session Window)** | CLS 不是全程偏移的简单累加，而是取**最大的那一个会话窗口**：窗口内相邻偏移间隔 < 1s 且总时长 ≤ 5s            |
| 只在视口内计分                | 元素移出视口后的位移不计                                                                                     |
| 元素自身移动但视觉无感        | 例如纯 `transform` 动画、用户可见的连续过渡，不计分                                                          |

**常见引发场景与对策：**

[width(32,68)]

| 场景                                    | 对策                                                                 |
| --------------------------------------- | -------------------------------------------------------------------- |
| 图片 / 视频没声明宽高比，加载完撑开页面 | 写 `width`/`height` 或 CSS `aspect-ratio`，让浏览器提前占位          |
| 顶部 Banner 广告、通知条异步插入        | 预留固定高度；或 `position: absolute/fixed` 覆盖，不改动文档流       |
| 自定义字体切换导致行高变化（FOUT/FOIT） | `font-display: swap` 争取不白屏，再用 `size-adjust` 对齐后备字体度量 |
| 骨架屏与真实内容尺寸不一致              | 骨架屏必须是真实内容的**1:1 尺寸**，否则数据回来时会二次坍塌或膨胀   |
| 懒加载图片用 1px 透明图占位             | 占位图要与真图同尺寸，`aspect-ratio` 锁死比例                        |

### 3.3 布局固化策略

- **空间预留**：严格使用 CSS `aspect-ratio` 或显式的 `width/height` 占位。
- **骨架屏对齐**：骨架屏（Skeleton）的物理尺寸必须与最终真实数据的渲染尺寸保持绝对一致，避免数据填充后的二次坍塌或膨胀。
- **绝对定位注入**：如果非要在顶部插入横幅，尽量使用 `position: absolute/fixed` 覆盖在现有流之上，而不是改变正常文档流（若需推开，应伴随平滑的 Transform 动画）。

```css
/* 最佳实践：利用 CSS 限制动态图片加载过程中的布局跳动 */
.banner-image {
  width: 100%;
  aspect-ratio: 16 / 9; /* 提前锁定容器比例 */
  object-fit: cover;
  background-color: #f0f2f5; /* 占位底色 */
}
```

## 4. 性能度量与诊断矩阵

构建企业级性能闭环，必须打通从本地开发到线上监控的全链路：

- **Lab Data (实验室数据 - 定位瓶颈)**
  - **Lighthouse / Unlighthouse**：本地运行，在统一的基准网络节流（Throttling）下评估改动是否引发了性能退化。
  - **Chrome DevTools (Performance 面板)**：深挖火焰图，精准揪出造成 INP 飙升的元凶（哪一行的函数执行超过了 50ms），分析重排（Reflow）的触发堆栈。

- **Field Data (线上真实数据 - 结果导向)**
  - **RUM (真实用户监控)**：依赖如 Sentry、Datadog 等企业级监控 SDK 的 Performance 模块，捕获不同设备、不同网络环境下真实用户的 P75 Core Web Vitals 数据，并将其与发版记录（Release IDs）挂钩。
  - **CrUX (Chrome UX Report)**：Google 官方收集的宏观聚合数据，是对比竞品性能水位线的最强参考系。

## 5. 常见问题 (FAQ)

### 5.1 本地 Lighthouse 打分很高，线上 CWV 却不达标？

因为两者**根本不是一件事**：Lighthouse 是 **Lab Data**（固定设备、固定节流、无缓存冷启动），而你线上的用户可能是三年前的中端安卓机、地铁里的 4G、并且带着一堆浏览器插件。**CWV 的裁决权在 Field Data 的 P75 上**，Lighthouse 只用来「改动前后是否有退化」。

正确姿势：**用 Field Data 找问题指标，用 Lab Data 复现并验证修复**。

### 5.2 为什么每次测，LCP 元素都不一样？

这是正常现象，因为 LCP 是**动态判定**的：谁“**可见面积最大**”谁就是 LCP，而面积会随视口尺寸、内容加载顺序、字体回流而变化。移动端和桌面端的 LCP 元素经常完全不同。

所以要建立习惯：**先按设备类型分别统计 LCP 元素分布**（`entry.element` 上报时带上标签名/类名），再决定优化谁。盲目优化“**以为的那张主图**”是常见浪费。

### 5.3 页面没什么交互，INP 是空的 / 该怎么算？

INP **只在有交互的页面产生**。纯展示型落地页、只滚动不点击的文章页，可能压根没有 INP 数据——此时它**不参与 CWV 达标判定**，Google 只会评估有数据的指标。

但要注意反过来的坑：**交互极少的页面**，INP 取的是“**最慢的那一次**”，样本少意味着一次偶发的长耗时会把 P75 拉爆。所以“**页面简单**”不等于“**INP 一定好**”。

### 5.4 CLS 数据明明是 0，用户却反馈页面在跳？

先确认三件事：

- **跳的是不是视口外的内容**——只有视口内的位移才计分；
- **跳的是不是用户操作引发的**——点击后 500ms 内的位移被 `hadRecentInput` 过滤，属于“**预期内**”；
- **是不是没产生布局偏移但视觉变了**——比如 `transform` 动画、`opacity` 渐显，用户看着在动，但规范不计分。

如果你的跳动确实属于「用户没操作、视口内、位置变了」，那 CLS 数据不可能为 0——大概率是采集代码没上报（比如 `layout-shift` 的 `buffered` 没开、或 SPA 路由切换后重新注册了观察者）。

### 5.5 三个指标只有 LCP 不达标，该从哪里下手？

- **先看 LCP 到底是哪个元素**（`entry.element`）——是图、是视频，还是文本块？
- **是图/视频** → 查它是否被 `loading="lazy"` 拖后、是否有 `fetchpriority="high"`、体积是否超了当前展示尺寸（Image CDN 是否按需出图）。
- **是背景图** → 检查有没有在 `<head>` 里 `preload`，否则发现时机太晚。
- **是文本块** → 瓶颈在渲染延迟，去查 CSS 阻塞与主线程长任务，而不是继续压缩图片。
- **都做完了还不达标** → 看 TTFB，可能是服务端/无 CDN 的底座问题。

### 5.6 用户点了按钮没反应，但 INP 显示正常，为什么？

因为 INP 只统计**浏览器能感知的交互事件**（click / keydown / pointerdown 等）。以下情况它抓不到：

- 事件被 `pointer-events: none`、遮罩层、或 disabled 状态吃掉了；
- 点击确实触发了回调，但**业务逻辑上没做任何反馈**（没 loading、没 toast），用户以为“**没反应**”；
- 交互发生在 iframe / shadow DOM 内，跨边界的上报缺失。

所以 INP 是**性能指标**，不是**体验指标**。它衡量“**引擎转得够不够快**”，不衡量“**产品反馈够不够清楚**”。交互反馈要做到「100ms 内给出视觉变化」，这属于产品与交互设计的职责（可用 `useTransition` 把重渲染降级，先让按钮进入 loading）。

### 5.7 怎么在业务代码里采集并上报 CWV？

不要自己手写 `PerformanceObserver` 拼四个指标——用 `web-vitals` 库，它已经把指标算法、会话窗口、`buffered`、SPA 路由切换等脏活都处理好了：

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals'

function report(metric) {
  const body = JSON.stringify({
    name: metric.name, // LCP / INP / CLS
    value: metric.value,
    rating: metric.rating, // good / needs-improvement / poor
    id: metric.id, // 同一次页面加载内稳定，用于去重
    navigationType: metric.navigationType,
  })
  // 用 sendBeacon：不阻塞卸载，页面关闭也能发出去
  navigator.sendBeacon('/api/vitals', body)
}

onLCP(report)
onINP(report)
onCLS(report)
```

> 上报时务必带上**设备类型、路由、版本号、是否新用户**，否则拿到一堆 P75 数字也不知道该优化哪一类用户。
