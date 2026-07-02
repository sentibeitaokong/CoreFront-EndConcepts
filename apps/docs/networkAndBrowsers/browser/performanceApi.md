# Performance API 性能观测

Performance API 提供了浏览器原生的性能数据测量手段。相较于手动使用 `Date.now()`，它的精度更高，且不受系统时钟调整的影响，能更准确地量化页面加载、资源请求、长任务及用户体验的核心指标。

## 1. 基础测量

返回相对于页面 `timeOrigin` 的高精度时间戳（毫秒级），非常适合用于精确衡量代码块的执行耗时。

```javascript
const start = performance.now()
doSomething()
console.log(`执行耗时: ${(performance.now() - start).toFixed(2)}ms`)
```

## 2. 自定义指标

通过打标记（Mark）和计算耗时（Measure），可用于分析组件挂载、路由切换等关键业务链路。

```javascript
performance.mark('render-start')
renderApp()
performance.mark('render-end')

performance.measure('render-duration', 'render-start', 'render-end')

const [entry] = performance.getEntriesByName('render-duration')
console.log(`渲染耗时: ${entry.duration}ms`)
```

## 3. 导航计时

用于洞察整个页面的加载生命周期（从网络建立到 DOM 解析）。

```javascript
const [nav] = performance.getEntriesByType('navigation')

// 计算关键阶段耗时
const dnsLookupTime = nav.domainLookupEnd - nav.domainLookupStart
const tcpConnectTime = nav.connectEnd - nav.connectStart
const domReadyTime = nav.domContentLoadedEventEnd - nav.startTime
const pageLoadTime = nav.loadEventEnd - nav.startTime
```

**关键属性速查表：**

| 属性名                            | 含义说明                   | 性能定位方向     |
| --------------------------------- | -------------------------- | ---------------- |
| `domainLookupStart/End`           | DNS 查询耗时               | DNS 解析过慢     |
| `connectStart/End`                | TCP 握手耗时               | 网络连接问题     |
| `requestStart` -> `responseStart` | TTFB（首字节到达）         | 服务端处理过慢   |
| `domContentLoadedEventEnd`        | DOM 树解析且无样式阻塞完成 | 首屏渲染进度     |
| `loadEventEnd`                    | load 事件完成              | 脚本执行时间过长 |

## 4. 资源加载分析

用于监控页面内静态资源（Script, CSS, Image, XHR/Fetch）的加载详情。

```javascript
const resources = performance.getEntriesByType('resource')

resources.forEach(entry => {
  console.log(`[${entry.initiatorType}] ${entry.name}: ${entry.duration}ms`)
})
```

> **注意：** 跨域资源的详细时间默认隐藏，需要服务端配合设置 HTTP 头 `Timing-Allow-Origin: *`。

## 5. 持续监听

相较于主动拉取，`PerformanceObserver` 采用异步回调的方式监听性能事件，是构建非阻塞性能监控 SDK 的核心。

```javascript
const observer = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.log(`${entry.entryType}: ${entry.name} - ${entry.duration}ms`)
  })
})

observer.observe({ entryTypes: ['resource', 'measure', 'paint'] })
```

## 6. 捕获页面卡顿

浏览器主线程上执行时间**超过 50ms** 的任务被称为长任务，它们是造成页面无响应和卡顿（影响 INP 指标）的元凶。

```javascript
const longTaskObserver = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.log(`[警告] 发现长任务，耗时: ${entry.duration}ms`)
  })
})
longTaskObserver.observe({ type: 'longtask', buffered: true })
```

**长任务常见场景及优化：**

- **场景**：大量 DOM 一次性渲染、复杂正则计算、大 JSON 解析。
- **优化**：任务切片（`setTimeout`, `requestIdleCallback`）、Web Worker 离线计算、虚拟列表渲染。

## 7. 现代核心性能指标

Google 提出的 Core Web Vitals 是衡量用户体验的三大核心支柱。这些指标可以直接通过底层的 Performance API 或 `web-vitals` 库进行采集。

### 7.1 FCP (First Contentful Paint) - 首次内容绘制

衡量**感知加载速度**。记录浏览器从开始加载页面到渲染出**第一个**内容（如文本、图像、非空白的 `<canvas>` 或带有背景的元素）的时间。它是用户感知“页面开始加载”的第一个关键里程碑。

- **优良标准**：$\le$ 1.8 秒。
- **采集示例**：

```javascript
new PerformanceObserver(entryList => {
  const entries = entryList.getEntriesByName('first-contentful-paint')
  if (entries.length > 0) {
    console.log('FCP:', entries[0].startTime)
  }
}).observe({ type: 'paint', buffered: true })
```

- **优化核心**：优化服务器 TTFB（响应时间）、压缩关键资源、延迟非关键资源加载，确保浏览器能尽快完成首次 DOM 渲染。

### 7.2 LCP (Largest Contentful Paint) - 最大内容绘制

衡量**加载性能**。代表视口内最大的图像或文本块完成渲染的时间。

- **优良标准**：$\le$ 2.5 秒。
- **采集示例**：

```javascript
new PerformanceObserver(entryList => {
  const entries = entryList.getEntries()
  const lastEntry = entries[entries.length - 1] // 取最后一个即为最新的 LCP
  console.log('LCP:', lastEntry.startTime)
}).observe({ type: 'largest-contentful-paint', buffered: true })
```

### 7.3 INP (Interaction to Next Paint) - 交互至下一次绘制

衡量**响应速度**。记录页面生命周期内所有点击、按键等用户交互的最长延迟（替代了旧的 FID 指标）。

- **优良标准**：$\le$ 200 毫秒。
- **优化核心**：减少主线程阻塞，避免执行冗长的同步 JavaScript 任务（Long Tasks）。

### 7.4 CLS (Cumulative Layout Shift) - 累积布局偏移

衡量**视觉稳定性**。统计页面加载期间所有意外的布局位移分数总和。

- **优良标准**：$\le$ 0.1。
- **采集机制**：底层依赖 Layout Instability API (`type: 'layout-shift'`)。
- **优化核心**：为图片/广告预留明确的宽高等比空间，避免动态插入内容把现有元素顶飞。

## 8. 监控实践与落地建议

- **组合上报，控制体积**：避免在 `PerformanceObserver` 触发时频繁发请求。应采用**内存聚合缓冲** + `requestIdleCallback` 或 `navigator.sendBeacon` 在页面卸载时批量上报。
- **结合业务打点**：将性能指标与具体的业务场景绑定（例如：统计“**加入购物车**”整个链路的 measure 耗时）。
- **警惕观察者效应**：监控代码本身也会消耗性能。在生产环境中可以对用户进行采样监控（例如仅抓取 10% 用户的性能数据），并配合开源库 `web-vitals` 简化核心指标的采集难度。
