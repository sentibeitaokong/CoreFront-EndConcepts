# Web Streams API

Streams API 提供了一套浏览器原生的**流式数据处理**接口，允许我们分块（chunk）地读取、写入和转换数据，而无需一次性将完整内容加载到内存。它在处理大文件、流式响应、实时数据、压缩解压等场景中意义重大，也是 `fetch` 响应体、`Response.body` 底层所依赖的机制。

## 1. 为什么需要流

传统做法需要等待完整数据到达后才能处理：

```javascript
// ❌ 一次性读入，内存占用高、首字节等待久
const res = await fetch('/large-video.mp4')
const blob = await res.blob() // 全部下载完才拿到
```

流式做法可以边接收边处理：

```javascript
// ✅ 分块读取，边下载边消费
const res = await fetch('/large-video.mp4')
const reader = res.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log('收到一块数据', value.byteLength, '字节')
}
```

## 2. 核心概念：三种流

Streams API 定义了三种标准流，通过**链式管道**（pipe）连接：

[width(22,32,46)]

| 类型                | 描述                                | 关键接口                                     |
| ------------------- | ----------------------------------- | -------------------------------------------- |
| **ReadableStream**  | 可读流，数据源，提供 `read()` 消费  | `getReader()` / `pipeThrough()` / `pipeTo()` |
| **WritableStream**  | 可写流，数据汇，提供 `write()` 写入 | `getWriter()`                                |
| **TransformStream** | 变换流，读入 → 转换 → 写出          | `new TransformStream({transform})`           |

三者关系：`ReadableStream → TransformStream → WritableStream`。

## 3. 可读流 (ReadableStream)

### 3.1 API 签名

```javascript
const stream = new ReadableStream(underlyingSource?, queuingStrategy?)
const reader = stream.getReader({ mode }) // mode: 'default' | 'byob'
await reader.read()                        // → { value, done }
await reader.cancel(reason?)               // 取消读取并释放锁
await stream.pipeThrough(transform, options?)
await stream.pipeTo(writable, options?)
stream.tee()                               // → [ReadableStream, ReadableStream]
stream.cancel(reason?)
stream.locked                              // boolean：是否已绑定 reader
```

**Reader 的高频成员：**

[width(23,77)]

| 成员              | 说明                                                        |
| ----------------- | ----------------------------------------------------------- |
| `read()`          | 取一块，返回 `{ value, done }`；流置错后**持续 reject**     |
| `cancel(reason?)` | 取消读取并释放锁（通知生产者清理资源）                      |
| `releaseLock()`   | **只释放锁、不取消流**，之后可以再 `getReader()` 换消费方式 |
| `closed`          | Promise：流被关闭或被取消后才 settle                        |

**`pipeTo()` / `pipeThrough()` 的 `options`：**

[width(21,10,69)]

| 选项            | 默认  | 说明                              |
| --------------- | ----- | --------------------------------- |
| `preventClose`  | false | `true` 时不自动关闭目标流         |
| `preventAbort`  | false | `true` 时源出错也不中止目标流     |
| `preventCancel` | false | `true` 时目标出错也不取消源流     |
| `signal`        | -     | 传入 `AbortSignal` 可中止整条管道 |

> **高频坑：一个流同时只能有一个 reader（writer）。** 已 `getReader()` 的流 `stream.locked` 为 `true`，此时再 `getReader()` 或直接 `pipeTo()` 会抛 `TypeError`。要换消费者，先 `reader.releaseLock()`；要彻底放弃，用 `reader.cancel()`。

**底层源 `underlyingSource` 回调（配置项）：**

[width(25,24,51)]

| 回调                | 触发时机           | 作用                                     |
| ------------------- | ------------------ | ---------------------------------------- |
| `start(controller)` | 构造时立即执行一次 | 初始化，可 `enqueue` / `close` / `error` |
| `pull(controller)`  | 消费者「要更多」时 | 按需生产数据（背压关键）                 |
| `cancel(reason)`    | 消费者取消时       | 清理资源                                 |

**控制器 `controller` 方法：**

[width(22,78)]

| 成员             | 作用                                         |
| ---------------- | -------------------------------------------- |
| `enqueue(chunk)` | 生产一块数据                                 |
| `close()`        | 正常结束流                                   |
| `error(reason)`  | 让流进入错误状态                             |
| `desiredSize`    | 内部缓冲期望大小（背压信号，供 `pull` 判断） |

### 3.2 创建与消费

```javascript
// 通过 fetch 获得可读流
const res = await fetch('/data.json')
const reader = res.body.getReader()

const decoder = new TextDecoder()
let result = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  result += decoder.decode(value, { stream: true })
}
console.log(result)
```

### 3.3 异步迭代

`ReadableStream` 实现了异步可迭代协议，可直接使用 `for await...of`：

```javascript
const res = await fetch('/data.json')
let result = ''
for await (const chunk of res.body) {
  result += new TextDecoder().decode(chunk)
}
```

### 3.4 自定义可读流

```javascript
const stream = new ReadableStream({
  start(controller) {
    // 初始化，可用 controller.enqueue / close / error
    controller.enqueue('第一块')
    controller.enqueue('第二块')
    controller.close()
  },
  pull(controller) {
    // 可选：消费者请求更多数据时触发，用于按需拉取
  },
  cancel(reason) {
    // 可选：消费者取消时触发
  },
})

const reader = stream.getReader()
console.log((await reader.read()).value) // '第一块'
```

### 3.5 `tee()` 分流

将一条可读流复制成两条，供两个消费者独立读取（如：一份用于预览、一份用于缓存）：

```javascript
const [stream1, stream2] = res.body.tee()
```

## 4. 可写流 (WritableStream)

### 4.1 API 签名

```javascript
const stream = new WritableStream(underlyingSink?, queuingStrategy?)
const writer = stream.getWriter()
await writer.write(chunk)   // 写入一块，返回 Promise 在背压解除后 resolve
await writer.close()        // 正常关闭
await writer.abort(reason?) // 中止写入
stream.abort(reason?)
stream.locked               // boolean：是否已绑定 writer
```

**Writer 的高频成员：**

[width(21,79)]

| 成员            | 说明                                                   |
| --------------- | ------------------------------------------------------ |
| `write(chunk)`  | 返回的 Promise 在**背压解除**时 resolve，必须 `await`  |
| `ready`         | Promise：可继续写入时 resolve（与 `write()` 互为补充） |
| `closed`        | Promise：流关闭或被中止后 settle                       |
| `releaseLock()` | 只释放锁，不关闭流，之后可再 `getWriter()`             |

> `writer.write()` 返回的 Promise **必须 `await`**：它 resolve 的时机就是「背压解除、可以再写下一块」。忽略它等于关掉背压保护，内存会一路涨上去。

**底层汇 `underlyingSink` 回调（配置项）：**

[width(33,29,38)]

| 回调                       | 触发时机                 | 作用                                |
| -------------------------- | ------------------------ | ----------------------------------- |
| `start(controller)`        | 构造时立即执行一次       | 初始化                              |
| `write(chunk, controller)` | 每次 `writer.write()` 时 | 处理一块数据，返回 Promise 表示完成 |
| `close()`                  | 流关闭时                 | 收尾                                |
| `abort(reason)`            | 流被中止时               | 清理                                |

### 4.2 基本用法

```javascript
const writable = new WritableStream({
  write(chunk) {
    // 处理每一块数据，返回 Promise 表示写入完成
    console.log('写入', chunk)
  },
  close() {
    console.log('流关闭')
  },
  abort(reason) {
    console.log('流被中止', reason)
  },
})

const writer = writable.getWriter()
await writer.write('hello')
await writer.write(' world')
await writer.close()
```

## 5. 变换流 (TransformStream)

用于在管道中间转换数据，例如解压 gzip、编解码文本。

**底层 `transformer` 回调（配置项）：**

[width(25,24,51)]

| 回调                           | 触发时机           | 作用                                     |
| ------------------------------ | ------------------ | ---------------------------------------- |
| `start(controller)`            | 构造时立即执行一次 | 初始化                                   |
| `transform(chunk, controller)` | 每进来一块数据时   | 转换并用 `controller.enqueue` 输出       |
| `flush(controller)`            | 输入流结束时       | 输出尾部数据（如压缩流写尾、缓冲 flush） |

```javascript
const uppercase = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk.toUpperCase())
  },
})

// 通过管道连接
const readable = new ReadableStream({
  start(c) {
    c.enqueue('hello')
    c.close()
  },
})

const result = await readable.pipeThrough(uppercase).getReader().read()

console.log(result.value) // 'HELLO'
```

## 6. 背压 (Backpressure)

背压是 Streams API 的核心特性：当消费者处理速度**慢于**生产者时，系统会向生产者**反向施加压力**，避免数据在内存中无限堆积。

- `ReadableStream` 的 `pull()` 只在消费者「要得更多」时才被调用。
- `WritableStream` 的 `write()` 返回的 Promise 会在背压解除时才 resolve。
- `pipeTo()` / `pipeThrough()` 会自动管理背压，手动用 `read()/write()` 时则需自行遵守。

**水位（`highWaterMark`）与队列策略：**

[width(34,66)]

| 配置 / 成员                 | 说明                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `highWaterMark`             | 内部缓冲区「水位」：Readable / Writable 默认都是 **1 块**，达到水位即向生产者施压 |
| `CountQueuingStrategy`      | 内置策略：按**块数**计算（默认行为）                                              |
| `ByteLengthQueuingStrategy` | 内置策略：按**字节数**计算，处理二进制流时更接近真实内存占用                      |
| `controller.desiredSize`    | 还能再收多少：正数表示空间充足，负数表示已超出水位                                |
| `writer.ready`              | Promise：缓冲降到水位以下（可以继续写）时 resolve                                 |

```javascript
// 按字节设水位：缓冲超过 64KB 就触发背压，比「按块数」更贴合真实内存
const stream = new ReadableStream(source, {
  highWaterMark: 64 * 1024,
  size: chunk => chunk.byteLength, // 自定义每块的大小
})
// 等价写法：new ByteLengthQueuingStrategy({ highWaterMark: 64 * 1024 })
```

> **注意：** 水位是**生产者侧的缓冲上限**，不是「一次读多少」。调大它能减少往返、提升吞吐，代价是内存占用变高；调小则更省内存但更频繁地暂停生产。默认的「1 块」对绝大多数场景都偏保守，处理大文件时按字节设水位通常更划算。

```javascript
// 手动实现时，应等待 write 返回的 Promise
async function copy(readable, writable) {
  const reader = readable.getReader()
  const writer = writable.getWriter()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    await writer.write(value) // 等待背压解除再继续读
  }
  await writer.close()
}
```

## 7. 字节流与二进制处理

需要高效处理二进制（如分块校验、流式解析）时，使用字节流读器：

```javascript
const res = await fetch('/file.bin')
const reader = res.body.getReader({ mode: 'byob' }) // Bring Your Own Buffer

const buffer = new ArrayBuffer(1024)
while (true) {
  const { done, value } = await reader.read(new Uint8Array(buffer))
  if (done) break
  console.log('读取了', value.byteLength, '字节')
}
```

`ReadableStream` 还提供 `ReadableStream.from()` 静态方法，将异步迭代器快速转为流：

```javascript
async function* generate() {
  yield '第一行\n'
  yield '第二行\n'
}
const stream = ReadableStream.from(generate())
```

## 8. 实战：流式解析大文件 / SSE

### 8.1 流式读取服务端推送（配合 fetch 分块）

```javascript
const res = await fetch('/api/chat', { method: 'POST' })
const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  processChunk(value) // 逐段渲染，实现打字机效果
}
```

> **提示：** `TextDecoderStream` / `TextEncoderStream` 是内置的变换流，能简化字符串编解码。

### 8.2 使用 CompressionStream 压缩数据

```javascript
const compressed = await new Response(
  readable.pipeThrough(new CompressionStream('gzip')),
).arrayBuffer()
```

### 8.3 流式读取 CSV 并按行处理

```javascript
const res = await fetch('/large.csv')
const lines = res.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(splitByLine()) // 自定义：按 \n 切块

for await (const line of lines) {
  console.log('处理行:', line)
}
```

### 8.4 流式上传请求体（`duplex: 'half'`）

`fetch` 的**请求体也能是流**——大文件上传不必先读进内存，还能顺路统计进度：

```javascript
// 场景：大文件上传 + 进度条——边读边传，内存占用恒定
let uploaded = 0
const file = fileInput.files[0]

const progress = new TransformStream({
  transform(chunk, controller) {
    uploaded += chunk.byteLength
    updateProgress(uploaded / file.size)
    controller.enqueue(chunk) // 原样放行，只为计数
  },
})

await fetch('/api/upload', {
  method: 'POST',
  body: file.stream().pipeThrough(progress), // File / Blob 自带 stream()
  duplex: 'half', // ⚠️ 必填：声明「请求体是流」，漏了会直接抛 TypeError
  headers: { 'Content-Type': 'application/octet-stream' },
})
```

> **两个细节：** `duplex: 'half'` 是 Chrome 系对「流式请求体」的硬性要求（HTTP/2 实际上全双工，但 fetch 目前只实现半双工）；这个进度统计的是**已交给网络层**的字节，不代表服务端已收全，要精确进度得靠服务端返回或 `xhr.upload.onprogress`。

## 9. 与其他 API 的关系

[width(49,51)]

| API                                         | 关联点                                 |
| ------------------------------------------- | -------------------------------------- |
| **fetch / Response**                        | `Response.body` 即 `ReadableStream`    |
| **File / Blob**                             | `blob.stream()` 返回 `ReadableStream`  |
| **TextDecoderStream / TextEncoderStream**   | 内置变换流，省掉手动 `TextDecoder`     |
| **CompressionStream / DecompressionStream** | 内置变换流，gzip / deflate 压缩解压    |
| **Service Worker**                          | 流式合成响应，实现「边缓存边返回」     |
| **MediaSource**                             | 流分片喂给播放器，实现视频「边下边播」 |
| **WebSocket**                               | 早期无流式接口，现可配合流做背压       |
| **WebRTC**                                  | `ReadableStream` 作为底层传输抽象      |

### 9.1 高频场景速览

[width(24,76)]

| 场景                 | 用什么                                                        |
| -------------------- | ------------------------------------------------------------- |
| AI 对话 / 打字机效果 | `Response.body` + `TextDecoderStream`，逐块解析 SSE（见 8.1） |
| 大文件下载 + 进度    | `getReader()` 累加 `byteLength`（见第 11 节）                 |
| 大文件上传 + 进度    | `file.stream()` + `duplex: 'half'`（见 8.4）                  |
| 接口压缩传输         | `CompressionStream` / `DecompressionStream`（见 8.2）         |
| 超大数据量导出       | 服务端流式返回，前端边收边写 `Blob`，避免拼超长字符串         |
| 一份数据两处用       | `tee()` 分流：一份渲染、一份缓存或上传（见 3.5）              |
| 首字节更快的页面     | Service Worker 里先返回响应头，内容边取边拼                   |

## 10. 最佳实践总结

- **优先管道**：能用 `pipeThrough()` / `pipeTo()` 就别手写 `read/write` 循环，背压由引擎自动处理。
- **注意背压**：手动消费时，务必 `await` 每次 `write()`，否则会失去背压保护。
- **及时关闭/取消**：处理完成后 `close()`，不再需要时 `reader.cancel()` 释放资源。
- **注意「锁」**：一个流同一时刻只能有一个 reader / writer，用 `releaseLock()` 释放或 `cancel()` 丢弃，否则后续消费会抛 `TypeError`。
- **上传流式请求体必须写 `duplex: 'half'`**：漏掉直接报错（见 8.4）。
- **用 `TextDecoderStream` 处理文本**：避免手动拼接 `TextDecoder` 造成多字节字符被截断。
- **兼容性降级**：老浏览器可通过 `web-streams-polyfill` 提供支持。

## 11. 使用示例：流式下载进度 + 分块写入

综合运用可读流、变换流、可写流与背压，实现「下载大文件实时展示进度 + 边下边写」：

```javascript
// 场景：下载大文件，实时展示进度，边下边写，避免一次性读入内存
async function downloadWithProgress(url) {
  const res = await fetch(url)
  const total = Number(res.headers.get('content-length')) || 0

  const reader = res.body.getReader()
  let received = 0
  const chunks = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    received += value.length
    chunks.push(value)
    updateProgress(received / total) // 更新进度条

    // 目标写入较慢时，await 写入即可获得背压，避免读得过快撑爆内存
    await fakeWrite(value)
  }

  const blob = new Blob(chunks)
  console.log('下载完成', blob.size, '字节')
}
```

**错误与取消处理：**

```javascript
const controller = new AbortController()

try {
  const res = await fetch(url, { signal: controller.signal })
  for await (const chunk of res.body) {
    process(chunk)
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('已取消下载')
  } else {
    console.error('读取失败', err)
  }
}

controller.abort() // 触发取消
```

> **补充：** 流被 `controller.error(reason)` 置错后，后续 `read()` 会持续 reject；用 `for await` 时错误会在循环处抛出，需用 `try...catch` 包裹。

## 12. 常见问题 (FAQ)

### 12.1 为什么 `res.body` 是 `null`？

三类原因：

- **响应本来就没有响应体**：状态码 `204` / `304`，或 `HEAD` / `OPTIONS` 请求，规范规定此时 `body` 为 `null`。
- **跨源不透明响应**：`mode: 'no-cors'` 拿到的不透明响应读不出内容。
- **已经被读过了**：见 12.2。

另外 `fetch` 失败（网络错误）是直接 reject，不会走到读流这一步。

### 12.2 报 `TypeError: body stream already read`，怎么办？

因为 `Response.body` 是**一次性**的：`res.json()` / `res.text()` / `getReader()` 只有第一次调用能拿到数据。两种解法：

- **确定要用多种形式**：提前克隆 —— `const copy = res.clone()`，一份读 JSON、一份读原始流。
- **想同时给两个消费者**：用 `res.body.tee()` 分流（代价见 12.6）。

### 12.3 `Cannot get a reader ... stream is locked` 是什么问题？

`stream.locked === true` 说明这个流已经绑定了 reader（或正在被 `pipeTo` 消费）。一个流**同时只能有一个 reader**。修法：

- 只是要换消费方式：`reader.releaseLock()` 之后再 `getReader()`（流本身没被取消）。
- 不打算再读了：`reader.cancel()` 释放掉。
- 需要两路消费：用 `tee()` 而不是抢锁。

### 12.4 为什么上传流式请求体一定要写 `duplex: 'half'`？

因为 fetch 需要知道「请求体是流式发送的」。规范要求流式请求体必须显式声明半双工（HTTP/2 虽然本质全双工，但 fetch 目前只实现 `half`），漏写会直接抛 `TypeError: RequestInit: duplex option is required when sending a body`。这是纯配置项，补上即可（见 8.4）。

### 12.5 分块解码后中文为什么变乱码？

UTF-8 的一个汉字占 3 字节，**可能被切在块的边界上**，单独解码就会得到乱码。两种正确写法：

- 用 `TextDecoderStream` 走管道（推荐，见 8.1）；
- 手动解码时传 `{ stream: true }`，让解码器把不完整的字节留到下一块：`decoder.decode(chunk, { stream: true })`。

### 12.6 `tee()` 有什么代价？

两点：

- **内存**：两个分支各自缓冲，慢的那个会一直攒数据，内存占用比单路读翻倍甚至更多。
- **背压**：上游速度由**较慢的那个分支**决定，快的分支也会被拖住。

所以 `tee()` 适合「两个消费者速度相近」的场景（页面渲染 + 同时写进 Cache Storage），不要拿它当「无限制复制」。

### 12.7 流里出错，异常会从哪里抛出来？

取决于消费方式：

- `for await (const chunk of stream)`：在循环处抛，用 `try...catch` 包住。
- `reader.read()`：返回的 Promise reject，且**此后每次 `read()` 都会持续 reject**。
- `pipeTo()` / `pipeThrough()`：返回的 Promise reject（除非传了 `preventAbort` 等选项改变了默认行为）。

流一旦被 `controller.error(reason)` 置错就**不可恢复**，只能重建一条新流。

### 12.8 `close()`、`abort()`、`cancel()` 有什么区别，该用哪个？

[width(45,11,44)]

| 方法                                    | 用于   | 含义                                                |
| --------------------------------------- | ------ | --------------------------------------------------- |
| `controller.close()` / `writer.close()` | 生产者 | **正常结束**：数据发完了，消费者会收到 `done: true` |
| `controller.error()` / `stream.abort()` | 生产者 | **异常中止**：后续读取全部 reject                   |
| `reader.cancel(reason)`                 | 消费者 | **主动不要了**：通知生产者清理资源                  |

一句话：**正常收尾用 `close`，出错了用 `error`，用户提前放弃用 `cancel`**。三者都别忘了一并清理定时器、网络请求等外部资源。
