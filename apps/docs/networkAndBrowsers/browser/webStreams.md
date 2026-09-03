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

**底层源 `underlyingSource` 回调（配置项）：**

| 回调                | 触发时机           | 作用                                     |
| ------------------- | ------------------ | ---------------------------------------- |
| `start(controller)` | 构造时立即执行一次 | 初始化，可 `enqueue` / `close` / `error` |
| `pull(controller)`  | 消费者「要更多」时 | 按需生产数据（背压关键）                 |
| `cancel(reason)`    | 消费者取消时       | 清理资源                                 |

**控制器 `controller` 方法：**

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

**底层汇 `underlyingSink` 回调（配置项）：**

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

## 9. 与其他 API 的关系

| API                  | 关联点                                |
| -------------------- | ------------------------------------- |
| **fetch / Response** | `Response.body` 即 `ReadableStream`   |
| **File / Blob**      | `blob.stream()` 返回 `ReadableStream` |
| **WebSocket**        | 早期无流式接口，现可配合流做背压      |
| **Service Worker**   | 流式合成响应，实现「边缓存边返回」    |
| **WebRTC**           | `ReadableStream` 作为底层传输抽象     |

## 10. 最佳实践总结

- **优先管道**：能用 `pipeThrough()` / `pipeTo()` 就别手写 `read/write` 循环，背压由引擎自动处理。
- **注意背压**：手动消费时，务必 `await` 每次 `write()`，否则会失去背压保护。
- **及时关闭/取消**：处理完成后 `close()`，不再需要时 `reader.cancel()` 释放资源。
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
