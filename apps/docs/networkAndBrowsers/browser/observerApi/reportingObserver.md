# ReportingObserver

收集浏览器主动生成的**报告**（如使用了即将弃用的 API、浏览器干预行为等），用于在开发与生产环境发现隐患。

## 1. 方法与构造选项

```javascript
const observer = new ReportingObserver(callback, options?) // 构造
observer.observe()            // 开始收集（无 target 参数）
observer.takeRecords()        // 取回未处理的报告并清空队列
observer.disconnect()         // 停止收集
```

- `callback(reports, observer)`：报告回调，`reports` 为 `Report` 数组（一次可能派发多条）。
- `observe()` **不接受任何参数**，但**必须显式调用一次**：只 `new` 不 `observe`，一条报告也收不到——这是它与其它 Observer 最大的不同。
- 没有 `unobserve`：想改收集的类型，只能 `disconnect()` 后新建实例。
- `takeRecords()` 取回尚未派发的报告并清空队列；`disconnect()` 会一并丢弃它们。

**构造选项：**

[width(18,18,13,51)]

| 选项       | 类型       | 默认值  | 说明                                     |
| ---------- | ---------- | ------- | ---------------------------------------- |
| `types`    | `string[]` | `[]`    | 要收集的报告类型，空数组表示收集全部类型 |
| `buffered` | `boolean`  | `false` | 是否补抓观察开始前已生成的报告           |

## 2. 基本用法

```javascript
const observer = new ReportingObserver(
  (reports, observer) => {
    reports.forEach(report => {
      console.log(report.type, report.url, report.body)
      // 可上报到监控平台
    })
  },
  { types: ['deprecation', 'intervention'], buffered: true },
)

observer.observe()

// 主动取回未处理的报告并清空队列
const pending = observer.takeRecords()
observer.disconnect()
```

## 3. 常见报告类型

[width(23,30,47)]

| 类型                           | 含义                                  | 高频触发来源                                                       |
| :----------------------------- | :------------------------------------ | :----------------------------------------------------------------- |
| `deprecation`                  | 页面使用了即将弃用的 API              | 同步 `XMLHttpRequest`、`document.domain` 赋值、第三方 SDK 的旧写法 |
| `intervention`                 | 浏览器主动干预（如阻止自动播放）      | 自动播放被拦截、`AudioContext` 未授权启动、广告过重被移除          |
| `crash`                        | 页面崩溃（`body.crashId` 可用于定位） | 内存耗尽（OOM）、渲染进程崩溃                                      |
| `csp-violation`                | 内容安全策略违规                      | 漏配 CDN / 统计 / 字体的来源域名                                   |
| `permissions-policy-violation` | 权限策略违规                          | iframe 未授权就调用摄像头、麦克风、地理位置                        |
| `document-policy-violation`    | 文档策略违规                          | `sync-xhr`、`document-write` 等文档策略被触发                      |

> **`deprecation` 是排查成本最低、也最容易刷屏的一类**：`body.id` + `body.sourceFile` / `lineNumber` 直接指向自家代码（线上压缩产物需配 sourcemap 还原）。但弃用报告会随第三方脚本一起涌入，同一条提示可能被重复上报成千上万次——客户端务必先按 `id` 聚合去重再上报。

## 4. `Report` 与 `report.body` 的字段结构

写监控代码前先分清两层：**`Report` 是外壳，`body` 才是各类型独有的细节**。

**`Report` 的三个通用字段：**

[width(14,18,68)]

| 字段   | 类型     | 含义                                                           |
| :----- | :------- | :------------------------------------------------------------- |
| `type` | `string` | 报告类型（`deprecation` / `intervention` / `csp-violation` …） |
| `url`  | `string` | 产生报告的**文档**地址（不是触发违规的资源地址）               |
| `body` | `object` | 具体报告内容，字段随 `type` 变化                               |

### 4.1 `deprecation` / `intervention`

[width(26,15,59)]

| 字段                 | 类型      | 含义                                                           |
| :------------------- | :-------- | :------------------------------------------------------------- |
| `id`                 | `string`  | 弃用特性的标识（如 `NavigatorGetUserMedia`），**用它聚合去重** |
| `message`            | `string`  | 人类可读的描述，通常与 DevTools 控制台提示一致                 |
| `sourceFile`         | `string?` | 触发位置所在文件，未知时为 `null`                              |
| `lineNumber`         | `number?` | 触发位置行号，未知时为 `null`                                  |
| `columnNumber`       | `number?` | 触发位置列号，未知时为 `null`                                  |
| `anticipatedRemoval` | `Date?`   | 预计移除日期；为 `null` 表示未知，可按低优先级处理             |

`sourceFile` + `lineNumber` 是排查弃用问题最值钱的字段——直接指向自己代码里的位置（线上压缩产物需配合 sourcemap 还原）。

### 4.2 `csp-violation`（内容安全策略违规）

[width(26,13,61)]

| 字段                 | 类型     | 含义                                              |
| :------------------- | :------- | :------------------------------------------------ |
| `blockedURL`         | `string` | 被拦截的资源地址                                  |
| `effectiveDirective` | `string` | 实际生效的 CSP 指令（如 `script-src`、`img-src`） |
| `originalPolicy`     | `string` | 命中时页面生效的完整策略原文                      |
| `disposition`        | `string` | `enforce`（已拦截）或 `report`（仅上报）          |
| `documentURL`        | `string` | 违规发生的文档地址                                |
| `sample`             | `string` | 内联脚本 / 样式的采样片段，便于定位来源           |
| `statusCode`         | `number` | 触发违规时的响应状态码                            |

CSP 违规最常见的原因是**漏配来源域名**（CDN、第三方统计、字体）。拿到 `effectiveDirective` + `blockedURL` 就能直接定位该补哪一条指令，比逐条读策略快得多。

**上线 CSP 的标准姿势是先用 `Content-Security-Policy-Report-Only`**：新策略以「只上报不拦截」的模式跑一到两周，靠 `csp-violation` 报告（此时 `disposition` 为 `report`）补齐所有来源，再切换成强制模式——否则一次上线就可能直接白屏。

### 4.3 `crash`

[width(24,16,60)]

| 字段      | 类型     | 含义                               |
| :-------- | :------- | :--------------------------------- |
| `crashId` | `string` | 崩溃标识，可在服务端关联同一批崩溃 |
| `reason`  | `string` | 崩溃原因（如内存耗尽、页面无响应） |
| `stack`   | `string` | 崩溃时的调用栈（可用时）           |

> **别猜字段名。** 各类型的 `body` 字段**因浏览器与版本而异**，`permissions-policy-violation` / `document-policy-violation` 也各有差异。开发阶段直接打印实际结构最可靠——`ReportBody` 提供了 `toJSON()`：

```js
new ReportingObserver(reports => {
  reports.forEach(report => {
    // JSON.stringify 会调用 body.toJSON()，能完整看到真实字段
    console.log(report.type, JSON.stringify(report.body))
  })
}).observe()
```

## 5. 示例：弃用 API 监控

```javascript
// 场景：开发/生产环境采集弃用 API 与浏览器干预报告，页面卸载时批量上报
const reports = []

const observer = new ReportingObserver(
  list => {
    list.forEach(report => {
      reports.push({
        type: report.type,
        url: report.url,
        body: report.body,
      })
    })
  },
  { types: ['deprecation', 'intervention'], buffered: true },
)

observer.observe()

// 页面卸载前批量上报，避免阻塞卸载
window.addEventListener('pagehide', () => {
  if (reports.length) {
    navigator.sendBeacon('/api/reports', JSON.stringify(reports))
  }
})
```

## 6. 关键点

- 相比 `console.warn` 的弃用提示，ReportingObserver 可编程、可上报。
- `buffered: true` 可收集页面加载早期产生的报告。
- `crash` 报告通常无法与页面内代码一起上报（页面已崩溃），需借助 Service Worker 或下一次会话补报。
- **先按 `body.id` 聚合去重再上报**：同一条弃用 / 干预报告会随调用次数反复产生，第三方脚本尤其频繁；客户端用 `Set` 去重并计数，能避免打爆监控配额。
- **自己补业务上下文**：`report.url` 只是产生报告的**文档**地址，排查时还需要版本号、路由、UA 等信息，这些得由上报方附加。

> **服务端报告：** ReportingObserver 是**客户端**侧的收集方式；浏览器还支持通过 HTTP 头（`Reporting-Endpoints`）把报告直接上报到服务端端点，二者可配合使用——客户端用于开发排查，服务端用于生产监控。

## 7. 常见问题 (FAQ)

### 7.1 一个报告都收不到，怎么排查？

- **浏览器是否支持**：`ReportingObserver` 目前**主要是 Chromium 系支持**，Safari / Firefox 上没有这个接口，代码会直接走到 `typeof ReportingObserver === 'undefined'`。生产环境要把它当**增强能力**，并配合服务端方案兜底。
- **是否忘了 `observe()`**：`ReportingObserver` 的 `observe()` **不接收目标**，构造完必须显式调用一次才会开始收集——这是与其它 Observer 最不一样的地方，很容易漏。
- **报告是否在 `observe()` 之前产生**：漏加 `buffered: true` 就永远收不到早期的报告。
- **`types` 是否把类型过滤掉了**：只写了 `['deprecation']` 却期待拿到 CSP 违规。
- **报告是否根本不产生**：弃用与干预报告本身就是低频事件——本地验证时可在控制台手动调用一个已废弃 API（如旧的同步 `XMLHttpRequest` 用法）来触发。

### 7.2 客户端 `ReportingObserver` 和服务端 `Reporting-Endpoints` 该用哪个？

[width(22,38,40)]

| 维度     | 客户端 ReportingObserver         | 服务端 `Reporting-Endpoints`         |
| :------- | :------------------------------- | :----------------------------------- |
| 支持面   | 仅 Chromium                      | 支持面更广（含浏览器内部错误）       |
| 上报时机 | 页面存活期间，由 JS 决定何时上报 | 浏览器**自己**上报，页面崩溃也能送达 |
| 灵活性   | 可加工、采样、与业务数据关联     | 只能接收，前端无法预处理             |
| 适用     | 开发排查、需要过滤与聚合的监控   | 生产环境的兜底监控（尤其 crash 类）  |

**推荐组合**：服务端 `Reporting-Endpoints` 负责「不漏」，客户端负责「加工与关联业务上下文」。

### 7.3 页面卸载或崩溃时的报告会不会丢？

会，需要专门处理：

- **正常卸载**：在 `pagehide` 里用 `navigator.sendBeacon` 批量上报，不要用普通 `fetch`——卸载过程中发起的请求可能被浏览器中断。
- **页面崩溃**：崩溃时页面内的代码已经不执行了，`crash` 报告**无法靠自身代码上报**。要么交给服务端的 `Reporting-Endpoints` 接收，要么由 **Service Worker** 或下一次会话的客户端补报。
- **别把上报放在 `unload`**：`unload` 在现代浏览器里不可靠（受 BFCache 影响），`pagehide` + `visibilitychange` 才是推荐时机。

### 7.4 `types: []` 和显式列出类型有什么区别？

- **`types: []`（默认）等于「不过滤」，收集全部类型**：省事，但噪音大——CSP 违规、第三方脚本的弃用提示量可能非常大，喂给监控平台会稀释真正要关注的报告。
- **显式列出类型更可控**：只订阅自己关心的 `['deprecation', 'intervention']`，能在回调里做更干净的聚合（例如按 `body.id` 归并弃用项）。
