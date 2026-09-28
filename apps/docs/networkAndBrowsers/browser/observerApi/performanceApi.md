# Performance API 与 PerformanceObserver

`performance` 全局对象上挂载了一整套用于**测量**页面性能的接口，统称为 **Performance API**；而 `PerformanceObserver` 是其中的**观察器**，用来**异步监听**这些接口产生的性能条目。二者是「数据产生」与「数据监听」的关系——前者回答「怎么量」，后者回答「怎么拿到量出来的结果」。

## 1. 两者的关系

**一句话概括：Performance API 负责产生性能数据，PerformanceObserver 负责「异步监听」这些数据。**

它们操作的都是同一种东西——`PerformanceEntry`（性能条目），区别只在于**获取方式**：

[width(13,37,50)]

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

[width(18,13,69)]

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

[width(46,25,29)]

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

**`performance.now()` 与 `Date.now()` 的区别：**

[width(18,38,44)]

| 维度 | `performance.now()`                | `Date.now()`                   |
| :--- | :--------------------------------- | :----------------------------- |
| 基准 | 相对 `timeOrigin` 的毫秒数         | Unix 时间戳（绝对时间）        |
| 精度 | 亚毫秒级（受浏览器精度限制）       | 毫秒级                         |
| 时钟 | **单调时钟**，不受系统时间调整影响 | 会被 NTP 校时、用户改时间影响  |
| 用途 | 测耗时、性能打点                   | 记录「什么时候发生」、展示时间 |

结论：**测耗时一律用 `performance.now()`**——`Date.now()` 在系统时间被校正时可能倒退，会把一段耗时算成负数（同一台机器上跑也会复现）。需要在监控里同时标注绝对时间时，用 `timeOrigin + startTime` 换算：

```js
// 条目里的 startTime 是相对时间，换算成绝对时间戳再上报
const absoluteTime = performance.timeOrigin + entry.startTime
```

#### 2.2.2 mark()

在当前时间点打一个**标记**，返回 `PerformanceMark`：

[width(33,13,13,41)]

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

[width(44,56)]

| 调用形式                             | 含义                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `measure(name)`                      | 从 `timeOrigin` 到当前时刻                           |
| `measure(name, startMark, endMark?)` | 从 `startMark` 到 `endMark`（省略 end 则到当前时刻） |
| `measure(name, options)`             | 对象形式，见下表                                     |

**对象形式 `options`：**

[width(16,23,61)]

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

[width(17,83)]

| 字段        | 说明                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| `name`      | 条目名称（资源 URL、标记名、`first-contentful-paint` 等）                                     |
| `entryType` | 条目类型（`navigation` / `resource` / `mark` / `measure` / `paint` / `longtask` / `event` …） |
| `startTime` | 相对 `timeOrigin` 的开始时间                                                                  |
| `duration`  | 耗时（`mark` 为 0，`measure` 为 end - start）                                                 |

**高频条目类型与专属字段：** 通用字段只是骨架，真正有用的问题（「是谁慢的」「慢在哪一步」）都要靠子类的专属字段回答——排查时先按 `entryType` 找到对应的一行：

[width(23,43,34)]

| `entryType`                | 专属字段                                                              | 能回答什么问题                                      |
| :------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------- |
| `navigation`               | `type`、`redirectCount`、`activationStart`                            | 加载链路耗时、回退 / 预渲染命中情况                 |
| `resource`                 | `initiatorType`、`nextHopProtocol`、`renderBlockingStatus`            | 哪个资源慢、是否阻塞渲染、走的是 HTTP/2 还是 HTTP/3 |
| `paint`                    | `name`（`first-paint` / `first-contentful-paint`）                    | 首次绘制与首次内容绘制的时间点                      |
| `largest-contentful-paint` | `element`、`url`、`renderTime`、`loadTime`、`size`                    | 是哪个元素拖慢了 LCP                                |
| `layout-shift`             | `value`、`hadRecentInput`、`sources`                                  | 是谁把页面顶飞了                                    |
| `longtask`                 | `attribution[]`（`containerType` / `containerName` / `containerSrc`） | 长任务来自哪个脚本或 iframe                         |
| `event`                    | `interactionId`、`processingStart`、`processingEnd`、`target`         | 交互慢在输入延迟、处理还是呈现                      |
| `element`                  | `identifier`、`element`、`renderTime`、`loadTime`                     | 指定元素的渲染时间（Element Timing）                |
| `mark` / `measure`         | `detail`                                                              | 业务自定义打点携带的上下文                          |

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

[width(43,31,26)]

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
| `activationStart`                     | 预渲染页面的**激活时刻**（非预渲染页面为 0）             | 预渲染命中情况   |
| `type`                                | 导航类型（navigate / reload / back_forward / prerender） | 区分缓存/回退    |
| `redirectCount`                       | 重定向次数                                               | 重定向链过长     |
| `transferSize`                        | 传输总大小（含响应头）                                   | 带宽占用         |
| `encodedBodySize` / `decodedBodySize` | 压缩前 / 后文档体积                                      | 压缩是否生效     |

> **`activationStart` 是预渲染场景的关键字段**：页面若由 Speculation Rules 预渲染后再激活，`navigationStart` → `activationStart` 这段时间里用户**还停留在上一个页面**，根本没有看到这一页。算用户感知耗时时要把这段时间剔掉（所有时间戳都减去 `activationStart`），否则预渲染会把指标算得虚高或虚低。SPA 的软导航同理——它不产生新的 `navigation` 条目，只能自己用 `mark` / `measure` 打点（见 3.6、6.5）。

### 2.5 资源加载分析

用于监控页面内静态资源（Script, CSS, Image, XHR/Fetch）的加载详情。

```javascript
const resources = performance.getEntriesByType('resource')

resources.forEach(entry => {
  console.log(`[${entry.initiatorType}] ${entry.name}: ${entry.duration}ms`)
})
```

**`PerformanceResourceTiming` 关键字段：**

[width(29,71)]

| 字段                   | 含义                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| `initiatorType`        | 发起类型（`img` / `css` / `script` / `fetch` / `xmlhttprequest` …） |
| `nextHopProtocol`      | 网络协议（`h2` / `h3` / `http/1.1`）                                |
| `workerStart`          | Service Worker 开始处理时间                                         |
| `transferSize`         | 传输总大小（含响应头）                                              |
| `encodedBodySize`      | 压缩后的体积                                                        |
| `decodedBodySize`      | 解压后的体积                                                        |
| `renderBlockingStatus` | `blocking` / `non-blocking`，是否阻塞渲染（Chrome 107+）            |
| `responseStatus`       | HTTP 响应状态码（Chrome 109+）                                      |
| `serverTiming`         | 服务端耗时                                                          |

> **排查优先级：** 先筛 `duration` 大且 `renderBlockingStatus === 'blocking'` 的资源——它们会直接卡住首屏渲染；再按 `initiatorType` 归类，看是图片、脚本还是接口（`fetch` / `xmlhttprequest`）在拖后腿。`nextHopProtocol` 出现 `http/1.1` 说明有资源绕过了 HTTP/2 复用（常见于第三方域名），值得单独拉出来看。

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

[width(28,28,16,28)]

| 成员                                      | 入参                                  | 返回值               | 说明                                               |
| :---------------------------------------- | :------------------------------------ | :------------------- | :------------------------------------------------- |
| `new PerformanceObserver(callback)`       | `callback(list, observer)`            | 实例                 | 只注册回调                                         |
| `observe(options)`                        | `{ type \| entryTypes, buffered, … }` | `undefined`          | 没有 target，观察的是「条目类型」而不是元素        |
| `takeRecords()`                           | -                                     | `PerformanceEntry[]` | 取回尚未派发的条目并清空队列                       |
| `disconnect()`                            | -                                     | `undefined`          | 停止监听；**没有 `unobserve`**，换类型要新建实例   |
| `PerformanceObserver.supportedEntryTypes` | -                                     | `string[]`           | **静态属性**：当前浏览器支持的条目类型（能力检测） |

- `observe()` 的 options 里**至少要有 `type` 或 `entryTypes` 之一**，两者同时给会直接抛 `TypeError`。
- 观察器实例没有「停止某一种类型」的手段：要换监听目标只能 `disconnect()` 后新建实例。

### 3.2 配置项

**`observe(options)` 配置项：**

[width(25,16,59)]

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

只知道「有长任务」还不够，`attribution` 能进一步指出它来自哪个容器或哪个脚本：

```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    entry.attribution.forEach(
      ({ containerType, containerName, containerSrc }) => {
        // containerType 为 'iframe' 时，containerSrc 直接给出是哪个第三方脚本
        console.log(
          `长任务来源: ${containerType} ${containerName} ${containerSrc}`,
        )
      },
    )
  })
}).observe({ type: 'longtask', buffered: true })
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

### 3.5 能力检测：`supportedEntryTypes`

`PerformanceObserver.supportedEntryTypes` 是**静态属性**，返回当前浏览器支持的全部条目类型，用来在监听前做能力检测——因为传入不支持的 `type` 时观察不会生效，部分浏览器还会直接抛 `TypeError`，未兜住的异常会中断整个监控脚本的初始化：

```js
console.log(PerformanceObserver.supportedEntryTypes)
// 例如 ['element', 'event', 'first-input', 'largest-contentful-paint', 'layout-shift', 'longtask', 'mark', 'measure', 'navigation', 'paint', 'resource', ...]

// 统一封装：不支持就返回 null，让调用方静默降级
function observeIfSupported(type, callback) {
  if (!PerformanceObserver.supportedEntryTypes.includes(type)) return null

  const observer = new PerformanceObserver(callback)
  observer.observe({ type, buffered: true })
  return observer
}

observeIfSupported('largest-contentful-paint', list => {
  report({ name: 'LCP', value: list.getEntries().at(-1).startTime })
})
```

### 3.6 监听自定义 `mark` / `measure`

`mark` / `measure` 产生的条目同样可以被观察——这是把「业务打点」接入统一监控管道的标准做法：**业务代码只负责打标记，采集与上报由 SDK 一处完成**，两端解耦。

```js
// 业务侧：只打标记，不关心谁在消费
performance.mark('checkout-start', { detail: { orderId: 1024 } })
// ... 用户操作
performance.mark('checkout-end')
performance.measure('checkout-duration', {
  start: 'checkout-start',
  end: 'checkout-end',
  detail: { scene: '结算页' },
})

// 监控 SDK：统一消费所有自定义 measure
const observer = new PerformanceObserver(list => {
  list.getEntriesByType('measure').forEach(entry => {
    report({
      name: entry.name,
      duration: entry.duration, // 耗时
      detail: entry.detail, // mark / measure 时写入的元数据
      startTime: performance.timeOrigin + entry.startTime, // 换算成绝对时间
    })
  })
})
observer.observe({ type: 'measure', buffered: true })
```

> - 自定义名称**不要与浏览器内置名重名**（如 `first-contentful-paint`），否则按名字查询时会混在一起。
> - `entry.detail` 只存在于你亲手创建的 `mark` / `measure` 上；`paint`、`resource` 等内置条目没有这个字段。

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
- **定位手法**：`entry.name` 只会告诉你 `first-paint` 还是 `first-contentful-paint`，想知道「到底画了什么」，得配合 LCP 的 `element` 字段或 Element Timing。

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

- **定位「是谁拖慢了 LCP」**：`entry.element` 是那个最大元素（节点已被移除时为 `null`），`entry.url` 在图片型 LCP 时给出资源地址，`entry.size` 是它的面积。
- **`renderTime` 还是 `loadTime`**：文本块看 `renderTime`，图片 / 视频这类需要等资源加载的元素看 `loadTime`——后者往往是网络耗时而不是渲染耗时，优化方向完全不同。

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
- **延迟三段拆解**：`entry.duration` 可以拆成「输入延迟（`processingStart - startTime`）+ 事件处理（`processingEnd - processingStart`）+ 呈现延迟（`duration - processingEnd`）」——分别对应主线程被别的任务占住、回调自身太重、渲染排队。先定位是哪一段超了，优化方向才明确。

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
- **定位「是谁位移了」**：`entry.sources` 数组给出被影响的元素及其位移前后的矩形（`node` 在节点已被移除时为 `null`），直接指名道姓：

```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    if (entry.hadRecentInput) return // 用户操作引起的位移不计入 CLS
    entry.sources.forEach(({ node, previousRect, currentRect }) => {
      console.log('位移来源:', node, previousRect, currentRect)
    })
  })
}).observe({ type: 'layout-shift', buffered: true })
```

### 4.5 Element Timing：单个元素的渲染时间

想回答「这张主图 / 这个模块到底什么时候渲染完」，给元素加上 `elementtiming` 属性，再用 `element` 条目取值即可。它由浏览器按真实渲染时机记录，比手工 `mark` / `measure` 框定更准：

```html
<img src="hero.jpg" elementtiming="hero" />
```

```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(({ identifier, renderTime, loadTime, element }) => {
    console.log(
      `${identifier}: 渲染 ${renderTime}ms，加载 ${loadTime}ms`,
      element,
    )
  })
}).observe({ type: 'element', buffered: true })
```

- 只对**图片类元素**（`<img>`、`<video>` 的 poster、`background-image`）与**文本块**生效，普通 `div` 加了属性也不会有条目。
- 元素被移出文档后 `element` 为 `null`，但 `identifier` 仍可用于聚合统计。
- 采集前先做能力检测：`PerformanceObserver.supportedEntryTypes.includes('element')`。

## 5. 监控实践与落地建议

- **组合上报，控制体积**：避免在 `PerformanceObserver` 触发时频繁发请求。应采用**内存聚合缓冲** + `requestIdleCallback` 或 `navigator.sendBeacon` 在页面卸载时批量上报。
- **结合业务打点**：将性能指标与具体的业务场景绑定（例如：统计“**加入购物车**”整个链路的 measure 耗时）。
- **警惕观察者效应**：监控代码本身也会消耗性能。在生产环境中可以对用户进行采样监控（例如仅抓取 10% 用户的性能数据），并配合开源库 `web-vitals` 简化核心指标的采集难度。
- **及时清理条目**：`mark` / `measure` / `resource` 条目会常驻内存，长期运行的 SPA 应定期 `clearMarks` / `clearMeasures` / `clearResourceTimings`。
- **按 p75 看数据，不看平均值**：Core Web Vitals 的达标口径是**第 75 百分位**，平均值会被长尾与极快样本一起拉平、掩盖真实问题——看板至少要有 p50 / p75 / p95。
- **区分导航类型与软导航**：`navigation` 条目只覆盖文档级加载，用 `nav.type` 分出前进 / 后退 / 预渲染；SPA 的路由切换不产生新条目，必须自己在路由钩子里打点，否则从第二个页面起就没有数据可看。

## 6. 常见问题 (FAQ)

### 6.1 测耗时为什么不能直接用 `Date.now()`？

因为 `Date.now()` 是**系统时钟**，会被 NTP 校时、用户手动改时间影响，可能「倒退」，导致一段耗时算成负数或明显偏小；精度也只有毫秒级。`performance.now()` 是相对 `timeOrigin` 的**单调时钟**，天生适合测耗时。

需要在监控里同时保留绝对时间时，用 `performance.timeOrigin + entry.startTime` 换算，而不要额外调一次 `Date.now()`——两次取值之间已经有偏差了。

### 6.2 `type` 和 `entryTypes` 有什么区别？能一起写吗？

**不能一起写**：同时传 `type` 与 `entryTypes` 会直接抛 `TypeError`，一条数据也收不到。

[width(30,42,28)]

| 写法                    | 特点                                 | 适用                       |
| :---------------------- | :----------------------------------- | :------------------------- |
| `{ type: 'longtask' }`  | 单一类型，可使用 `durationThreshold` | 只关心一种类型（推荐）     |
| `{ entryTypes: [...] }` | 一次监听多种类型                     | 快速起量，回调里再自行分流 |

`durationThreshold` **只在 `type: 'event'` 时有效**（默认 104ms），监听交互延迟必须用 `type` 形式。

### 6.3 `buffered: true` 什么时候必须加？

- **必须加**：一次性、发生后不再重复的条目——`paint`（FCP）、`largest-contentful-paint`、`navigation`。等监控脚本执行时它们早已产生，不加 `buffered` 就**永久错过**。
- **可加可不加**：持续产生的条目——`resource`、`longtask`、`event`。加了会顺带补一批历史数据，上报体积略增，但不影响正确性。
- **别忘了缓冲上限**：资源条目的内部缓冲默认 **250 条**，超出即丢弃，长会话要提前 `setResourceTimingBufferSize()` 扩容，或监听 `resourcetimingbufferfull` 及时清理。

### 6.4 为什么 LCP / CLS 要等页面「隐藏」之后才上报？

因为 FCP 之外的核心指标都是 **「到目前为止」的值，不是最终值**：

- **LCP 会被后续更大的元素不断刷新**——所以取值要用「最后一个条目」，且在页面稳定前不能定稿。
- **CLS 是累加的**——用户停留期间继续滚动，位移分数还会增加，提前上报分数偏小。
- **INP 取的是整段生命周期内的交互最大值**——页面关闭前才能收口。

标准做法（`web-vitals` 库内部同样如此）：监听 `visibilitychange`，在 `document.visibilityState === 'hidden'` 时用 `navigator.sendBeacon` 上报；`pagehide` 作为兜底（部分移动端场景不触发 `visibilitychange`）。这类上报要避免用 `fetch` + 同步逻辑，容易在卸载过程中被浏览器中断。

### 6.5 SPA 的路由切换怎么采集性能数据？

`navigation` 条目**只在文档级导航时产生一次**，SPA 切换路由不刷新文档，因此不会产生新条目：

- **路由耗时**：在路由守卫 / 路由钩子里 `performance.mark()` 打点，切换完成时 `measure()`，交给统一采集。这也顺带把「路由级 LCP」变成了可比较的数据。
- **首屏之外的 LCP / CLS**：LCP 只上报页面的首次最大内容绘制，软导航后的内容变化不在其中；想衡量某个页面模块何时可见，用 `element` 条目更实用。
- **预渲染命中**：用了Speculation Rules时,记得用 `activationStart`把预渲染阶段剔除,否则指标会失真。
