# ReportingObserver

收集浏览器主动生成的**报告**（如使用了即将弃用的 API、浏览器干预行为等），用于在开发与生产环境发现隐患。

## 1. API 签名

```javascript
const observer = new ReportingObserver(callback, options?) // 构造
observer.observe()            // 开始收集（无 target 参数）
observer.takeRecords()        // 取回未处理的报告并清空队列
observer.disconnect()         // 停止收集
```

- `callback(reports, observer)`：报告回调，`reports` 为 `Report` 数组。

**构造选项：**

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

| 类型                           | 含义                                  |
| ------------------------------ | ------------------------------------- |
| `deprecation`                  | 页面使用了即将弃用的 API              |
| `intervention`                 | 浏览器主动干预（如阻止自动播放）      |
| `crash`                        | 页面崩溃（`body.crashId` 可用于定位） |
| `csp-violation`                | 内容安全策略违规                      |
| `permissions-policy-violation` | 权限策略违规                          |
| `document-policy-violation`    | 文档策略违规                          |

## 4. 示例：弃用 API 监控

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

## 5. 关键点

- 相比 `console.warn` 的弃用提示，ReportingObserver 可编程、可上报。
- `buffered: true` 可收集页面加载早期产生的报告。
- `crash` 报告通常无法与页面内代码一起上报（页面已崩溃），需借助 Service Worker 或下一次会话补报。

> **服务端报告：** ReportingObserver 是**客户端**侧的收集方式；浏览器还支持通过 HTTP 头（`Reporting-Endpoints`）把报告直接上报到服务端端点，二者可配合使用——客户端用于开发排查，服务端用于生产监控。
