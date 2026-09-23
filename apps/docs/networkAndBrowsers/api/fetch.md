# Fetch API

`fetch` 是现代浏览器原生的请求接口，基于 **Promise**，取代了冗长且基于回调的 XHR。它把请求与响应都抽象为 `Request` / `Response` 对象，并原生支持**流式读取、请求取消、跨域凭证、keepalive**等能力。

**一句话理解**：**「`fetch` 用 Promise 统一了异步请求，但它的『异常处理』『取消请求』『响应体一次性消费』有反直觉的坑，必须单独掌握。」**

> [!TIP] 相关阅读
> `fetch` 的报文格式与协议语义见 [HTTP 协议](/networkAndBrowsers/http/http)、[HTTP 请求头与响应头](/networkAndBrowsers/http/headers)；跨域与预检见 [跨域 CORS](/webSecurity/cors)；响应体作为流的上层玩法见 [Web Streams API](/networkAndBrowsers/browser/webStreams)；发出去之后的取消、重试、并发与幂等治理见 [请求治理](/networkAndBrowsers/api/requestGovernance)。

## 1. 基本用法

```javascript
const response = await fetch('/api/users', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
})
const data = await response.json()
```

`fetch(url, init)` 的 `init` 常用配置：

[width(19,81)]

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

> [!NOTE] 高频场景
> 日常写得最多的就是这一句 —— 增删改查。三个字段几乎必配：`method`、`headers`、`body`；其中 `Content-Type` 决定**后端怎么解析请求体**，`Authorization: Bearer <token>` 决定**你是谁**。

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

## 4. `fetch` 不会对非 2xx 自动 reject

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

[width(24,15,61)]

| 错误来源           | 是否 reject | `err.name` / 类型   |
| ------------------ | ----------- | ------------------- |
| 网络断开、DNS 失败 | ✅ reject   | `TypeError`         |
| CORS 拦截          | ✅ reject   | `TypeError`         |
| 手动 `abort()`     | ✅ reject   | `AbortError`        |
| 404 / 500 状态码   | ❌ resolve  | 需手动判断 `res.ok` |

> [!NOTE] 高频场景
> 所有项目都会把它包进统一请求函数：`401` 跳登录、`403` 提示无权限、`5xx` 走兜底提示。**漏掉 `res.ok` 判断的后果，是业务代码把错误响应当成成功数据继续处理** —— 这类问题在线上事故里占比很高。

## 5. 请求体的类型与序列化

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

> [!NOTE] 高频场景
> JSON 提交占日常开发的绝大多数（配 `Content-Type: application/json`）；老后端要 `application/x-www-form-urlencoded` 时用 `URLSearchParams`；只要带文件，就一定用 `FormData`，且**不要手写 `Content-Type`**。

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

### 6.1 **批量取消请求**

同一个 `signal` 传给多个 `fetch`

```javascript
const controller = new AbortController()
const urls = ['/api/a', '/api/b', '/api/c']

// 三个请求共享同一个 signal —— abort() 调一次，三个请求同时被取消
const tasks = urls.map(url =>
  fetch(url, { signal: controller.signal }).then(res => res.json()),
)

// 用户点“取消” / 离开页面时调一次（这里假设 1 秒后触发）
setTimeout(() => controller.abort(), 1000)

// 用 allSettled 而非 all：被取消的请求不会让整批结果一起丢失，已完成的部分仍能拿到
const results = await Promise.allSettled(tasks)
// results[i]: { status: 'fulfilled', value } | { status: 'rejected', reason: AbortError }
```

注意 `controller` **用后即废**：一旦 `abort()`，它的 `signal` 永久处于已取消状态，要再发请求必须新建一个 `AbortController`。

### 6.2 **自动超时**：`AbortSignal.timeout(ms)`

```javascript
async function fetchWithTimeout(url, ms = 5000) {
  try {
    const res = await fetch(url, {
      // 5 秒内没完成就自动 abort，不用自己 setTimeout + clearTimeout
      signal: AbortSignal.timeout(ms),
    })
    return await res.json()
  } catch (err) {
    // 超时抛的是 TimeoutError，不是 AbortError
    if (err.name === 'TimeoutError') throw new Error('请求超时，请重试')
    throw err
  }
}
```

### 6.3 **两者叠加：`AbortSignal.any([...])`**

真实业务往往要**同时**满足“**用户能取消**”和“**到点必须超时**”，用 `AbortSignal.any` 把两个信号合成一个：

```javascript
const controller = new AbortController()

const res = await fetch('/api/search?kw=vue', {
  signal: AbortSignal.any([
    controller.signal, // 用户主动取消
    AbortSignal.timeout(5000), // 兜底超时
  ]),
})
```

合成后的信号**哪个先触发就以哪个的 reason 拒绝**，于是可以在 `catch` 里把两种取消区分开：

```javascript
try {
  await fetch('/api/slow', {
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(3000)]),
  })
} catch (err) {
  if (err.name === 'TimeoutError') console.warn('超时，可提示用户重试')
  else if (err.name === 'AbortError') console.log('用户取消，静默忽略')
  else throw err // 真正的网络或业务异常
}
```

> [!NOTE] 三个容易踩的细节
>
> - **超时抛的是 `TimeoutError`，不是 `AbortError`**。不少旧文章写成 AbortError，照抄就会漏判超时分支。
> - **`abort(reason)` 传入字符串时，`fetch` 拒绝的值就是那个字符串本身**，`err.name` 是 `undefined`，上面那句 `err.name === 'AbortError'` 会静默失效。想带自定义原因又保持类型统一，就传 `new DOMException('页面切换', 'AbortError')`；不需要原因就别传参数。
> - **`AbortSignal.any` 是新 API**（Chrome 116+ / Safari 17.4+ / Firefox 124+ / Node 20.3+，2024-03 才进入 Baseline）。要兼容更旧的环境，就退回手写 `setTimeout(() => controller.abort(), ms)`，并记得在 `finally` 里 `clearTimeout` —— 这也正是下一节要自己封装超时的原因。

### 6.4 实战:竞态请求

输入框搜索时，新请求发出即取消上一个：

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

> [!NOTE] 高频场景
> 四个最常见的触发点：**搜索框联想**（每次输入取消上一次）、**Tab / 筛选项快速切换**、**路由跳转**、**组件卸载**（React `useEffect` 的 cleanup 里 `abort()`）。
>
> 配套两个概念：**竞态 (Race Condition)** —— 响应的到达顺序与请求的发出顺序不一致，旧数据覆盖新状态；**时序锁** —— 给每次请求编号、返回时比对，比取消更彻底，能挡住“**取消来不及**”的漏网响应。
>
> 还有一个坑：取消抛出的 `AbortError` **不是业务异常**，必须单独吞掉，否则会被全局错误上报记成一次“**接口报错**”。

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

> [!NOTE] 高频场景
> 现在最典型的是 **AI 打字机输出**（大模型流式响应）、**大文件下载**、**实时日志**。要注意 `chunk` 的切分点**不保证落在事件边界上** —— 服务端下发 SSE 时，必须自己按 `\n\n` 攒缓冲再解析，这是流式接入最常见的 bug（机制见 [实时通信](/networkAndBrowsers/realtime/realtimeCommunication)）。

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

> [!NOTE] 高频场景
> 导出报表、下载资源包这类“**用户愿意等**”的操作，进度条能明显降低中途放弃率。**前提是服务端返回 `Content-Length`** —— 响应被 gzip 压缩或走 chunked 时通常拿不到，此时只能退化成“**已下载 N MB**”。

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

> [!NOTE] 高频场景
> 头像、图片、附件上传都想要进度条。业务里的常见取舍是：**小文件走 `FormData`、不看进度；大文件退 XHR 或用流式 body**。流式 body 必须显式写 `duplex: 'half'`，并且要接受它在部分浏览器上兼容性一般。

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

> [!NOTE] 高频场景
> 三个经典用途：**停留时长与曝光埋点**、**崩溃与错误上报**、**离开前保存草稿**。触发时机建议绑 `visibilitychange`（切到后台）而不是 `beforeunload` —— 移动端上 `beforeunload` 经常不触发。

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

> [!NOTE] 高频场景
> 每个项目都会写这个函数：超时 + 重试 + 统一错误 + 统一鉴权头。但**重试有红线 —— 只有读操作能无脑重试**，写操作必须先确认服务端幂等（见 [请求治理](/networkAndBrowsers/api/requestGovernance)）；而且重试要加退避与抖动，否则弱网恢复的瞬间会把服务端二次打垮。

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
