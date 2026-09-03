# Performance API 与 PerformanceObserver

`performance` 全局对象上挂载了一整套用于**测量**页面性能的接口，统称为 **Performance API**；而 `PerformanceObserver` 是其中的**观察器**，用来**异步监听**这些接口产生的性能条目。二者是「数据产生」与「数据监听」的关系——前者回答「怎么量」，后者回答「怎么拿到量出来的结果」。

## 1. 两者的关系

**一句话概括：Performance API 负责产生性能数据，PerformanceObserver 负责「异步监听」这些数据。**

它们操作的都是同一种东西——`PerformanceEntry`（性能条目），区别只在于**获取方式**：

| 维度     | Performance API（主动拉取）                         | PerformanceObserver（事件监听）         |
| -------- | --------------------------------------------------- | --------------------------------------- |
| 定位     | 数据层 / 测量接口                                   | 观察层 / 监听器                         |
| 调用方式 | `performance.now()`、`mark()`、`getEntriesByType()` | `new PerformanceObserver(cb).observe()` |
| 返回时机 | 调用时一次性返回                                    | 条目产生时异步回调                      |
| 遗漏风险 | 一次性指标（如 LCP）可能在查询前就已产生            | `buffered: true` 可补抓历史             |
| 性能开销 | 轮询浪费 CPU                                        | 事件驱动，低开销                        |

```javascript
// 主动拉取：手动查询
const paints = performance.getEntriesByType('paint')

// 事件监听：订阅通知
new PerformanceObserver(list => {
  const paints = list.getEntriesByType('paint')
}).observe({ type: 'paint', buffered: true })
```

> **类比：** `getEntriesByType()` 是「去仓库查一次账」，`PerformanceObserver` 是「订阅新到账通知」。前者简单但容易错过一次性数据，后者实时且不遗漏。

## 2. 数据的产生

Performance API 本质就是挂在 `window.performance` 上的一批**属性**和**方法**。

### 2.1 属性

| 属性         | 类型     | 说明                                                         |
| ------------ | -------- | ------------------------------------------------------------ |
| `timeOrigin` | `number` | 时间原点（Unix 毫秒时间戳），`now()` 的参照点                |
| `memory`     | `object` | Chrome 专有，JS 堆内存占用                                   |
| `navigation` | `object` | ⚠️ 已废弃，旧导航信息，改用 `getEntriesByType('navigation')` |
| `timing`     | `object` | ⚠️ 已废弃，旧时间戳集合，改用 Navigation Timing 条目         |

#### 2.1.1 timeOrigin

`timeOrigin` 是「时间原点」，即页面导航开始那一刻的 Unix 时间戳（毫秒），是 `now()` 的参照点：

```javascript
// timeOrigin：只读属性
console.log(performance.timeOrigin) // 如 1725350400000.123
// 三者关系：performance.now() ≈ Date.now() - performance.timeOrigin
```

#### 2.1.2 Server Timing

服务端可在响应头中返回 `Server-Timing: db;dur=53, cache;dur=12`，前端通过 `serverTiming` 读取各后端环节耗时：

```javascript
const [nav] = performance.getEntriesByType('navigation')
nav.serverTiming.forEach(({ name, duration, description }) => {
  console.log(`服务端耗时 ${name}: ${duration}ms`)
})
```

#### 2.1.3 performance.memory（Chrome）

Chrome 专有，用于粗略观察页面 JS 堆内存占用：

```javascript
const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
console.log(`已用堆内存: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
```

> **注意：** 默认是**非精确**值，需启动参数 `--enable-precise-memory-info` 才精确；且仅 Chrome 支持，生产环境需做能力检测。

### 2.2 方法

| 方法                                   | 作用                 | 返回值               |
| -------------------------------------- | -------------------- | -------------------- |
| `now()`                                | 取高精度时间戳       | `number`             |
| `mark(name, options?)`                 | 打标记               | `PerformanceMark`    |
| `measure(name, startOrOptions?, end?)` | 测量耗时             | `PerformanceMeasure` |
| `getEntries()`                         | 查询全部条目         | `PerformanceEntry[]` |
| `getEntriesByType(type)`               | 按类型查询           | `PerformanceEntry[]` |
| `getEntriesByName(name, type?)`        | 按名称查询           | `PerformanceEntry[]` |
| `clearMarks(name?)`                    | 清除标记             | `void`               |
| `clearMeasures(name?)`                 | 清除 measure         | `void`               |
| `clearResourceTimings()`               | 清除资源条目         | `void`               |
| `setResourceTimingBufferSize(n)`       | 设置资源缓冲上限     | `void`               |
| `toJSON()`                             | 序列化摘要           | `object`             |
| `measureUserAgentSpecificMemory()`     | 精确内存明细（异步） | `Promise`            |

#### 2.2.1 now()

无参数，返回相对 `timeOrigin` 的高精度毫秒时间戳（`number`）：

```javascript
const start = performance.now()
doSomething()
console.log(`执行耗时: ${(performance.now() - start).toFixed(2)}ms`)
```

#### 2.2.2 mark()

在当前时间点打一个**标记**，返回 `PerformanceMark`：

| 参数                    | 类型     | 必填 | 说明                           |
| ----------------------- | -------- | ---- | ------------------------------ |
| `name`                  | `string` | 是   | 标记名，唯一，后续靠它引用     |
| `markOptions.startTime` | `number` | 否   | 自定义开始时间（默认当前时刻） |
| `markOptions.detail`    | `any`    | 否   | 自定义元数据                   |

```javascript
performance.mark('start', { detail: { component: 'Home' } })
const m = performance.mark('t') // 返回值本身是 PerformanceMark
console.log(m.startTime, m.duration) // mark 的 duration 恒为 0
```

#### 2.2.3 measure()

计算两个标记（或时间点）之间的**耗时**，返回 `PerformanceMeasure`，有三种调用形式（重载）：

| 调用形式                             | 含义                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `measure(name)`                      | 从 `timeOrigin` 到当前时刻                           |
| `measure(name, startMark, endMark?)` | 从 `startMark` 到 `endMark`（省略 end 则到当前时刻） |
| `measure(name, options)`             | 对象形式，见下表                                     |

**对象形式 `options`：**

| 选项       | 类型               | 说明                                       |
| ---------- | ------------------ | ------------------------------------------ |
| `start`    | `string \| number` | 起点：标记名，或相对 `timeOrigin` 的时间戳 |
| `end`      | `string \| number` | 终点：标记名或时间戳（省略则用当前时刻）   |
| `duration` | `number`           | 直接指定时长（与 `start`/`end` 互斥）      |
| `detail`   | `any`              | 自定义元数据                               |

```javascript
performance.measure('render', 'start', 'end') // 两个标记名
performance.measure('render-obj', {
  // 对象形式
  start: 'start',
  end: 'end',
  detail: { scene: '首页渲染' },
})

const [entry] = performance.getEntriesByName('render')
console.log(`渲染耗时: ${entry.duration}ms`)
```

#### 2.2.4 getEntries()

查询**全部**性能条目，返回 `PerformanceEntry[]`：

```javascript
const entries = performance.getEntries()
```

#### 2.2.5 getEntriesByType()

按**类型**过滤，返回 `PerformanceEntry[]`：

```javascript
performance.getEntriesByType('resource') // 只查资源条目
performance.getEntriesByType('measure') // 只查 measure
```

- `type` 可选值：`navigation` / `resource` / `mark` / `measure` / `paint` / `longtask` / `event` / `largest-contentful-paint` / `layout-shift` 等。

#### 2.2.6 getEntriesByName()

按**名称**过滤，可再叠一层类型过滤，返回 `PerformanceEntry[]`：

```javascript
performance.getEntriesByName('render') // 只查该名称
performance.getEntriesByName('render', 'measure') // 名称 + 类型双过滤
```

#### 2.2.7 clearMarks()

清除标记，**不传参则清空全部**：

```javascript
performance.clearMarks('start') // 清除指定标记
performance.clearMarks() // 清空全部标记
```

#### 2.2.8 clearMeasures()

清除 measure 条目，**不传参则清空全部**：

```javascript
performance.clearMeasures('render') // 清除指定 measure
performance.clearMeasures() // 清空全部 measure
```

#### 2.2.9 clearResourceTimings()

清除全部资源计时条目，用于释放缓冲区：

```javascript
performance.clearResourceTimings()
```

#### 2.2.10 setResourceTimingBufferSize()

设置资源计时缓冲区上限（**默认 250 条**，超出后新条目被丢弃）：

```javascript
performance.setResourceTimingBufferSize(1000) // 扩容到 1000 条
```

> 缓冲区满时浏览器会触发 `resourcetimingbufferfull` 事件，可监听它并调用 `clearResourceTimings()` 释放。

#### 2.2.11 toJSON()

返回可序列化的性能摘要对象，便于直接 `JSON.stringify` 上报：

```javascript
const snapshot = performance.toJSON()
console.log(snapshot.timeOrigin, snapshot.navigation, snapshot.memory)
```

#### 2.2.12 measureUserAgentSpecificMemory()

在 **cross-origin isolated** 环境下，可获取按来源细分的内存占用，用于定位内存泄漏：

```javascript
if (performance.measureUserAgentSpecificMemory) {
  const memory = await performance.measureUserAgentSpecificMemory()
  memory.breakdown.forEach(b => {
    console.log(`${b.types.join('/')}: ${(b.bytes / 1024).toFixed(2)}KB`)
  })
}
```

### 2.3 PerformanceEntry 通用字段

所有性能条目都继承自 `PerformanceEntry`，拥有以下通用字段：

| 字段        | 说明                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| `name`      | 条目名称（资源 URL、标记名、`first-contentful-paint` 等）                                     |
| `entryType` | 条目类型（`navigation` / `resource` / `mark` / `measure` / `paint` / `longtask` / `event` …） |
| `startTime` | 相对 `timeOrigin` 的开始时间                                                                  |
| `duration`  | 耗时（`mark` 为 0，`measure` 为 end - start）                                                 |

### 2.4 导航计时

用于洞察整个页面的加载生命周期（从网络建立到 DOM 解析）。

```javascript
const [nav] = performance.getEntriesByType('navigation')

// 计算关键阶段耗时
const dnsLookupTime = nav.domainLookupEnd - nav.domainLookupStart
const tcpConnectTime = nav.connectEnd - nav.connectStart
const tlsTime =
  nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0
const ttfb = nav.responseStart - nav.requestStart
const domReadyTime = nav.domContentLoadedEventEnd - nav.startTime
const pageLoadTime = nav.loadEventEnd - nav.startTime
```

| 属性名                                | 含义说明                                                 | 性能定位方向     |
| ------------------------------------- | -------------------------------------------------------- | ---------------- |
| `domainLookupStart/End`               | DNS 查询耗时                                             | DNS 解析过慢     |
| `connectStart/End`                    | TCP 握手耗时                                             | 网络连接问题     |
| `secureConnectionStart`               | TLS 握手开始（HTTP 为 0）                                | HTTPS 加密开销   |
| `requestStart` -> `responseStart`     | TTFB（首字节到达）                                       | 服务端处理过慢   |
| `responseStart` -> `responseEnd`      | 内容下载耗时                                             | 带宽 / 资源过大  |
| `domInteractive`                      | DOM 解析完成、可交互                                     | 脚本阻塞程度     |
| `domContentLoadedEventEnd`            | DOMContentLoaded 完成                                    | 首屏渲染进度     |
| `loadEventEnd`                        | load 事件完成                                            | 脚本执行时间过长 |
| `type`                                | 导航类型（navigate / reload / back_forward / prerender） | 区分缓存/回退    |
| `redirectCount`                       | 重定向次数                                               | 重定向链过长     |
| `transferSize`                        | 传输总大小（含响应头）                                   | 带宽占用         |
| `encodedBodySize` / `decodedBodySize` | 压缩前 / 后文档体积                                      | 压缩是否生效     |

### 2.5 资源加载分析

用于监控页面内静态资源（Script, CSS, Image, XHR/Fetch）的加载详情。

```javascript
const resources = performance.getEntriesByType('resource')

resources.forEach(entry => {
  console.log(`[${entry.initiatorType}] ${entry.name}: ${entry.duration}ms`)
})
```

**`PerformanceResourceTiming` 关键字段：**

| 字段              | 含义                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `initiatorType`   | 发起类型（`img` / `css` / `script` / `fetch` / `xmlhttprequest` …） |
| `nextHopProtocol` | 网络协议（`h2` / `h3` / `http/1.1`）                                |
| `workerStart`     | Service Worker 开始处理时间                                         |
| `transferSize`    | 传输总大小（含响应头）                                              |
| `encodedBodySize` | 压缩后的体积                                                        |
| `decodedBodySize` | 解压后的体积                                                        |
| `serverTiming`    | 服务端耗时                                                          |

## 3. PerformanceObserver：数据的监听

相较于主动拉取，`PerformanceObserver` 采用异步回调的方式监听性能事件，是构建非阻塞性能监控 SDK 的核心。

### 3.1 API 签名

```javascript
const observer = new PerformanceObserver(callback) // 构造
observer.observe(options) // 开始监听（参数为 options，无 target）
observer.takeRecords() // 取回未处理条目
observer.disconnect() // 停止监听
```

- `callback(list, observer)`：回调中通过 `list.getEntries()` 获取性能条目。

### 3.2 配置项

**`observe(options)` 配置项：**

| 选项                | 类型       | 说明                                                            |
| ------------------- | ---------- | --------------------------------------------------------------- |
| `type`              | `string`   | 监听单一类型（如 `'longtask'`）                                 |
| `entryTypes`        | `string[]` | 监听多个类型（与 `type` 互斥，二者选一）                        |
| `buffered`          | `boolean`  | 是否补抓监听开始前已缓冲的条目                                  |
| `durationThreshold` | `number`   | 仅 `type: 'event'` 有效，过滤低于该延迟的交互事件（默认 104ms） |

### 3.3 基础用法

```javascript
const observer = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.log(`${entry.entryType}: ${entry.name} - ${entry.duration}ms`)
  })
})

observer.observe({ entryTypes: ['resource', 'measure', 'paint'] })
```

### 3.4 长任务与交互延迟

浏览器主线程上执行时间**超过 50ms** 的任务被称为长任务，它们是造成页面无响应和卡顿（影响 INP 指标）的元凶。

```javascript
const longTaskObserver = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.log(`[警告] 发现长任务，耗时: ${entry.duration}ms`)
  })
})
longTaskObserver.observe({ type: 'longtask', buffered: true })
```

配合 `event` 条目可精确测量用户交互（点击、按键）的响应延迟：

```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    // entry.duration 为从用户输入到下一次绘制的时间
    console.log(`[交互] ${entry.name} 延迟 ${entry.duration}ms`)
  })
}).observe({ type: 'event', buffered: true, durationThreshold: 16 })
```

- **场景**：大量 DOM 一次性渲染、复杂正则计算、大 JSON 解析。
- **优化**：任务切片（`setTimeout`, `requestIdleCallback`）、Web Worker 离线计算、虚拟列表渲染。

## 4. Core Web Vitals 采集

Google 提出的 Core Web Vitals 是衡量用户体验的三大核心支柱。这些指标的数据由 Performance API 产生，通过 `PerformanceObserver`（或 `web-vitals` 库）采集。

### 4.1 FCP (First Contentful Paint) - 首次内容绘制

衡量**感知加载速度**。记录浏览器从开始加载页面到渲染出**第一个**内容的时间。

- **优良标准**：1.8 秒。

```javascript
new PerformanceObserver(entryList => {
  const entries = entryList.getEntriesByName('first-contentful-paint')
  if (entries.length > 0) {
    console.log('FCP:', entries[0].startTime)
  }
}).observe({ type: 'paint', buffered: true })
```

- **优化核心**：优化服务器 TTFB（响应时间）、压缩关键资源、延迟非关键资源加载。

### 4.2 LCP (Largest Contentful Paint) - 最大内容绘制

衡量**加载性能**。代表视口内最大的图像或文本块完成渲染的时间。

- **优良标准**：2.5 秒。

```javascript
new PerformanceObserver(entryList => {
  const entries = entryList.getEntries()
  const lastEntry = entries[entries.length - 1] // 取最后一个即为最新的 LCP
  console.log('LCP:', lastEntry.startTime)
}).observe({ type: 'largest-contentful-paint', buffered: true })
```

### 4.3 INP (Interaction to Next Paint) - 交互至下一次绘制

衡量**响应速度**。记录页面生命周期内所有点击、按键等用户交互的最长延迟。

- **优良标准**：200 毫秒。

```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    // entry.interactionId 标识同一次交互，entry.duration 即该次交互延迟
    console.log(`[交互] ${entry.name}: ${entry.duration}ms`)
  })
}).observe({ type: 'event', buffered: true, durationThreshold: 16 })
```

- **优化核心**：减少主线程阻塞，避免执行冗长的同步 JavaScript 任务（Long Tasks）。

### 4.4 CLS (Cumulative Layout Shift) - 累积布局偏移

衡量**视觉稳定性**。统计页面加载期间所有意外的布局位移分数总和。

- **优良标准**：0.1。

```javascript
let clsValue = 0
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value // 累加每次位移分数
    }
  })
}).observe({ type: 'layout-shift', buffered: true })
```

- **优化核心**：为图片/广告预留明确的宽高等比空间，避免动态插入内容把现有元素顶飞。

## 5. 监控实践与落地建议

- **组合上报，控制体积**：避免在 `PerformanceObserver` 触发时频繁发请求。应采用**内存聚合缓冲** + `requestIdleCallback` 或 `navigator.sendBeacon` 在页面卸载时批量上报。
- **结合业务打点**：将性能指标与具体的业务场景绑定（例如：统计“**加入购物车**”整个链路的 measure 耗时）。
- **警惕观察者效应**：监控代码本身也会消耗性能。在生产环境中可以对用户进行采样监控（例如仅抓取 10% 用户的性能数据），并配合开源库 `web-vitals` 简化核心指标的采集难度。
- **及时清理条目**：`mark` / `measure` / `resource` 条目会常驻内存，长期运行的 SPA 应定期 `clearMarks` / `clearMeasures` / `clearResourceTimings`。
