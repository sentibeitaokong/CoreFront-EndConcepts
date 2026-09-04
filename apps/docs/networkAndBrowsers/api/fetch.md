# Fetch API

`fetch` 是现代浏览器原生的请求接口，基于 **Promise**，取代了冗长且基于回调的 XHR。它把请求与响应都抽象为 `Request` / `Response` 对象，并原生支持**流式读取、请求取消、跨域凭证、keepalive**等能力。

**一句话理解**：**「`fetch` 用 Promise 统一了异步请求，但它的『异常处理』『取消请求』『响应体一次性消费』有反直觉的坑，必须单独掌握。」**

## 1. 基本用法

```javascript
const response = await fetch('/api/users', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
})
const data = await response.json()
```

`fetch(url, init)` 的 `init` 常用配置：

| 字段          | 说明                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| `method`      | 请求方法：GET / POST / PUT / DELETE ...                                                     |
| `headers`     | 请求头对象（`Headers` 实例或普通对象）                                                      |
| `body`        | 请求体，支持字符串、`FormData`、`Blob`、`URLSearchParams`、流                               |
| `credentials` | 凭证策略：`omit` / `same-origin` / `include`                                                |
| `signal`      | 关联 `AbortController`，用于取消请求                                                        |
| `mode`        | 请求模式：`cors` / `no-cors` / `same-origin` / `navigate`                                   |
| `cache`       | 缓存模式：`default` / `no-store` / `reload` / `no-cache` / `force-cache` / `only-if-cached` |
| `redirect`    | 重定向策略：`follow` / `error` / `manual`                                                   |
| `keepalive`   | 页面卸载后请求是否继续存活（用于埋点/心跳）                                                 |
| `integrity`   | 子资源完整性校验（SRI）哈希，不匹配则拒绝                                                   |
| `referrer`    | 请求的 `Referer` 来源策略                                                                   |

## 2. `Request` 与 `Headers` 对象

`fetch` 的第一个参数既可以是字符串 URL，也可以是 `Request` 对象：

```javascript
const req = new Request('/api/users', {
  method: 'POST',
  headers: new Headers({ 'Content-Type': 'application/json' }),
  body: JSON.stringify({ name: 'xunbei' }),
})
const res = await fetch(req) // Request 可直接复用
```

`Headers` 对象常用操作：

```javascript
const headers = new Headers({ 'X-Token': 'abc' })
headers.append('X-Tag', 'a') // 追加（同名保留多个）
headers.set('X-Token', 'new') // 覆盖
headers.get('X-Token') // 读取
headers.has('X-Token') // 是否存在
headers.delete('X-Tag') // 删除

for (const [k, v] of headers) console.log(k, v) // 可迭代
```

> 自定义请求头会触发 [CORS 预检请求](/webSecurity/cors)，后端需在 `Access-Control-Allow-Headers` 中放行。详见 [HTTP 请求头](/networkAndBrowsers/http/headers)。

## 3. `Response` 对象

```javascript
const res = await fetch('/api/data')

res.ok // 状态码 200-299 时为 true
res.status // 200 / 404 ...
res.statusText // "OK"
res.headers // 响应头（Headers 对象）
res.url // 最终请求的 URL（重定向后的最终地址）
res.type // "basic" / "cors" / "opaque" / "opaqueredirect"
res.redirected // 是否发生过重定向
res.bodyUsed // 响应体是否已被消费
res.body // ReadableStream

// 按不同格式读取响应体（只能读一次）
await res.json()
await res.text()
await res.blob()
await res.arrayBuffer()
await res.formData()
```

## 4. 关键陷阱：`fetch` 不会对非 2xx 自动 reject

`fetch` 只有在**网络错误**（断网、DNS 失败、CORS 拦截）时才 reject；**HTTP 错误状态码（404、500）会正常 resolve**。因此必须手动检查 `res.ok`：

```javascript
const res = await fetch('/api/users')

if (!res.ok) {
  // 手动抛出，进入 catch 统一处理
  throw new Error(`请求失败：${res.status}`)
}
const data = await res.json()
```

**错误类型的区分**：

| 错误来源           | 是否 reject | `err.name` / 类型   |
| ------------------ | ----------- | ------------------- |
| 网络断开、DNS 失败 | ✅ reject   | `TypeError`         |
| CORS 拦截          | ✅ reject   | `TypeError`         |
| 手动 `abort()`     | ✅ reject   | `AbortError`        |
| 404 / 500 状态码   | ❌ resolve  | 需手动判断 `res.ok` |

## 5. 请求体（body）的类型与序列化

`fetch` 不会自动帮你序列化 `body`，**传对象前必须手动转字符串**：

```javascript
// ❌ 错误：直接传对象，会被转成 "[object Object]"
fetch('/api', { method: 'POST', body: { a: 1 } })

// ✅ JSON 对象需手动 stringify，并配 Content-Type
fetch('/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ a: 1 }),
})

// ✅ 表单/文件用 FormData，浏览器自动设置 Content-Type 与 boundary
const fd = new FormData()
fd.append('avatar', file)
fetch('/api/upload', { method: 'POST', body: fd })

// ✅ 查询串用 URLSearchParams
fetch('/api', {
  method: 'POST',
  body: new URLSearchParams({ a: '1', b: '2' }),
})
```

> 传 `FormData` 时**不要手动设置 `Content-Type`**，否则会丢失浏览器自动生成的 `boundary` 导致后端无法解析。详见 [URL、URLSearchParams 与 FormData](/js/advanced/misc/urlAndFormData)。

## 6. 取消请求：`AbortController`

`fetch` 本身没有 `.cancel()`，取消依赖 `AbortController`：

```javascript
const controller = new AbortController()

fetch('/api/slow', { signal: controller.signal }).catch(err => {
  if (err.name === 'AbortError') {
    console.log('请求已被取消')
  }
})

// 3 秒后取消
setTimeout(() => controller.abort(), 3000)
```

一个 `AbortController` 的 `signal` 可以同时传给多个 `fetch`，实现「一键取消一批请求」。`AbortSignal.timeout(ms)` 可快捷生成自动超时的 signal：

```javascript
const res = await fetch('/api', { signal: AbortSignal.timeout(5000) })
// 超过 5 秒自动 abort，抛出 AbortError
```

**实战：竞态请求只保留最新**——输入框搜索时，新请求发出即取消上一个：

```javascript
let controller = null
async function search(keyword) {
  controller?.abort() // 取消上一个请求
  controller = new AbortController()
  const res = await fetch(`/api/search?kw=${keyword}`, {
    signal: controller.signal,
  })
  return res.json()
}
```

## 7. 流式读取响应

`res.body` 是 `ReadableStream`，可边接收边处理（如大文件下载进度、SSE 流式输出、AI 打字机效果）：

```javascript
const res = await fetch('/api/stream')
const reader = res.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(decoder.decode(value, { stream: true })) // 逐步输出
}
```

> `stream: true` 避免多字节字符（中文）被分块截断导致乱码。流的更多玩法（背压、`tee`、`TransformStream`）见 [Web Streams API](/networkAndBrowsers/browser/webStreams)。

## 8. 下载进度

`fetch` 下载进度可借助「`Content-Length` + 流式读取」实现：

```javascript
const res = await fetch('/api/download')
const total = Number(res.headers.get('Content-Length'))
const reader = res.body.getReader()
let received = 0

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  received += value.length
  console.log(`进度：${((received / total) * 100).toFixed(1)}%`)
}
```

## 9. 上传进度（fetch 的短板）

XHR 有 `upload.onprogress`，`fetch` **没有原生的上传进度事件**。需要上传进度时有三条路：

1. **退回 XHR**（最简单，直接用 `xhr.upload.onprogress`）。
2. **构造 `ReadableStream` 作为请求体**，流式读文件边读边上报进度：

```javascript
const file = input.files[0]
let uploaded = 0

// 把 File 转成可读流，边读边统计进度
const fileStream = file.stream()
const progressStream = new ReadableStream({
  async start(controller) {
    const reader = fileStream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      uploaded += value.byteLength
      updateProgress(uploaded / file.size) // 更新进度条
      controller.enqueue(value)
    }
    controller.close()
  },
})

await fetch('/api/upload', {
  method: 'POST',
  body: progressStream, // 流式请求体
  duplex: 'half', // 必须显式声明，否则报错
  headers: { 'Content-Type': 'application/octet-stream' },
})
```

## 10. `keepalive`：页面卸载后仍要送达的请求

页面关闭/跳转时，普通请求会被中断。埋点、心跳、崩溃上报这类「最后一刻」数据需要 `keepalive: true`：

```javascript
// 页面卸载时上报埋点
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    fetch('/api/report', {
      method: 'POST',
      keepalive: true, // 允许请求在页面卸载后继续存活
      body: JSON.stringify({ event: 'leave' }),
    })
  }
})
```

> 限制：`keepalive` 请求体总和有上限（约 64KB），且 `keepalive` 与 `FormData` 等流式 body 兼容性有限，更适合小体积 JSON。

## 11. 封装一个健壮的请求函数（超时 + 重试）

```javascript
async function request(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeout ?? 10000,
    )

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body:
          options.body && typeof options.body !== 'string'
            ? JSON.stringify(options.body)
            : options.body,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (err.name === 'AbortError') {
        if (attempt === retries) throw new Error('请求超时')
        // 超时则重试
      } else if (attempt === retries) {
        throw err
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
```

## 12. 常见问题 (FAQ)

### 12.1 `fetch` 和 XHR 有什么区别？

`fetch` 基于 Promise、语法更简洁、原生支持流和 `keepalive`；XHR 基于事件回调，但支持**上传进度**和 `abort()`（老版本）。新项目优先 `fetch`，需要上传进度时可退回 XHR 或使用流式 body。

### 12.2 `credentials` 什么时候设 `include`？

默认 `same-origin` 只在同源请求带 Cookie。**跨域且需带 Cookie**（如跨域鉴权接口）时，需设 `credentials: 'include'`，且后端配合 CORS 的 `Access-Control-Allow-Credentials: true`（且 `Allow-Origin` 不能用 `*`）。详见 [CORS](/webSecurity/cors)。

### 12.3 响应体能读多次吗？

**不能**。`res.json()` / `res.text()` 是「一次性」消费，读完后流就关闭了（`bodyUsed` 变 `true`）。若需多次读取，先用 `res.clone()` 复制一份：

```javascript
const res = await fetch('/api')
const clone = res.clone() // 复制，两个响应体可独立消费
const a = await res.json()
const b = await clone.text()
```

### 12.4 为什么 `fetch` 请求体传对象会变 `[object Object]`？

`fetch` 不会自动 JSON 序列化，传对象会被隐式 `String()` 成 `"[object Object]"`。必须 `JSON.stringify` 并配 `Content-Type: application/json`。

### 12.5 `mode: 'no-cors'` 是什么？

`no-cors` 模式请求会成功，但响应类型是 `opaque`（不透明），JS **读不到任何内容**，只能用于「能发出去、不关心响应」的场景（如埋点、灯塔）。正常业务一律用默认的 `cors` 模式。

## 13. 总结

- `fetch` 基于 Promise，抽象为 `Request` / `Response` / `Headers`。
- 非 2xx **不会自动 reject**，必须检查 `res.ok`；只有网络错误 / `abort()` 才 reject。
- 取消用 `AbortController`（`AbortSignal.timeout` 快捷超时），响应体只能消费一次（`res.clone()`）。
- 上传进度是短板（退 XHR 或流式 body），下载进度靠「`Content-Length` + 流式读取」。
- 埋点上报用 `keepalive`，传对象记得 `JSON.stringify`，`FormData` 别手动设 `Content-Type`。
