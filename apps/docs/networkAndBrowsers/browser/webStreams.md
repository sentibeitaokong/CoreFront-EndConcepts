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

**先建立一个心智模型**：一条可读流 = **数据源**（你写的 `underlyingSource`）+ **内部队列**（生产出来但还没被取走的数据）+ **消费者**（`reader`）。三者的节奏是「**拉**」不是「推」：

- 消费者调 `reader.read()` 取一块；
- 队列空了，流回头调用你的 `pull()` 再生产一批；
- 队列满了（达到水位 `highWaterMark`），`pull()` **就不再被调用**——这就是背压。

所以生产者**不会在你没要的时候硬塞数据**（唯一例外是你在 `start` 里主动 `enqueue`）。

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

**`desiredSize` 怎么读**：它的值就是 `highWaterMark - 队列中已有的块数`，含义很直接：

[width(11,34,55)]

| 取值   | 含义                          | 生产者该怎么做                   |
| ------ | ----------------------------- | -------------------------------- |
| `> 0`  | 队列还有空间                  | 可以继续 `enqueue`               |
| `<= 0` | 队列已满 / 超了，消费者跟不上 | **停下来**，等下次 `pull` 再生产 |

```javascript
// 典型写法：pull 里按需生产，生产到队列满就自然停下
let id = 0
const stream = new ReadableStream({
  pull(controller) {
    if (id >= 5) {
      controller.close() // 生产完了：正常结束
      return
    }
    id += 1
    controller.enqueue(`第 ${id} 块`) // 每 enqueue 一次，desiredSize 就减小
  },
})

// 消费端只会拿到这 5 块，然后收到 { done: true }
const reader = stream.getReader()
console.log((await reader.read()).value) // '第 1 块'
```

**第二个构造参数 `queuingStrategy`** 的形状是 `{ highWaterMark, size }`——水位，以及「一块算多大」：

```javascript
// 省略时等价于 { highWaterMark: 1, size: () => 1 }：按「块数」计，缓冲 1 块
const stream = new ReadableStream(source, {
  highWaterMark: 64 * 1024, // 缓冲区上限：64KB
  size: chunk => chunk.byteLength, // 每块按字节算（默认每块算作 1）
})
// 按字节计水位很常见，用内置策略类更直观：
// new ByteLengthQueuingStrategy({ highWaterMark: 64 * 1024 })
```

> `highWaterMark` 是**生产者侧的缓冲上限**，不是「一次读多少块」。调大 = 吞吐更高但更吃内存，调小 = 更省内存但更频繁地暂停生产。详见第 6 节。

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

这段循环里有三个必须理解的点：

[width(22,78)]

| 细节                              | 说明                                                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ done, value }` 是两态          | `done: false` 时 `value` 是一块 `Uint8Array`；`done: true` 表示流结束（此时 `value` 为 `undefined`），**之后再 `read()` 依然返回 `done: true`** |
| `read()` 是**异步**的             | 队列里没数据时它会一直 pending，直到有数据或流结束——「边下载边处理」正是建立在这上面                                                            |
| `decode(value, { stream: true })` | 一块可能切在**多字节字符中间**（UTF-8 一个汉字 3 字节），`stream: true` 让解码器把不完整的字节留到下一块，避免乱码                              |

> 一句话：`reader.read()` 拿到的永远是**字节**，要文本就得解码；解码必须用 `{ stream: true }` 或 `TextDecoderStream`。

### 3.3 异步迭代

`ReadableStream` 实现了异步可迭代协议，可直接使用 `for await...of`：

```javascript
const res = await fetch('/data.json')
let result = ''
for await (const chunk of res.body) {
  result += new TextDecoder().decode(chunk)
}
```

`for await...of` 只是 `getReader()` + 循环 + 清理的语法糖，但它多做了两件贴心的事：

- **中途 `break` 或抛错时，会自动 `cancel()` 掉这条流**——不用手动清理，也不会把上游资源挂在那里；
- 循环结束后自动释放锁，不会出现「流被锁住」的问题。

代价是**不够灵活**：拿不到 `reader` 就没法用 `releaseLock()`、`cancel(reason)`，也读不到每次的 `{ done, value }` 状态。所以：

[width(54,46)]

| 场景                                             | 用哪个                             |
| ------------------------------------------------ | ---------------------------------- |
| 把整条流读到底、边读边处理                       | `for await...of`（简洁、自动清理） |
| 只读几块就停、要传具体的取消原因、要复用手动循环 | `getReader()` + `while`            |

> 注意 `for await...of` 循环期间这条流是**加锁**的，循环内再 `getReader()` 会抛 `TypeError`。

### 3.4 自定义可读流

**三个回调的调用顺序（理解了就懂了整条流）：**

```markdown
new ReadableStream(source)
└─ ① 立刻调用 start(controller)，只调一次
reader.read()
└─ ② 队列为空 → 调用 pull(controller)
└─ ③ pull 返回的 Promise resolve 之后，才可能再次调用 pull
（所以 pull 里 await 网络请求是安全的，不会并发重入）
reader.cancel()
└─ ④ 调用 cancel(reason)，在这里清定时器 / 断请求 / 释放连接
```

最简形态——数据已经就绪，在 `start` 里一次性塞完：

```javascript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('第一块')
    controller.enqueue('第二块')
    controller.close() // 不 close 的话消费者会一直等下去
  },
})

const reader = stream.getReader()
console.log((await reader.read()).value) // '第一块'
```

真正体现价值的是 **`pull` 按需生产**——把分页接口包装成流，消费端读一块才去拉一页：

```javascript
// 场景：分页接口 → 可读流。消费端处理得慢，请求就发得慢（背压自然生效）
let page = 0
const stream = new ReadableStream({
  async pull(controller) {
    page += 1
    const res = await fetch(`/api/users?page=${page}`)
    const { items, hasMore } = await res.json()

    if (!items.length) {
      controller.close() // 没有更多数据：正常结束
      return
    }
    controller.enqueue(items) // 一次 enqueue 一组，就是「一块」
    if (!hasMore) controller.close()
  },
  cancel(reason) {
    console.log('消费者不要了，停止拉取', reason) // 这里该断掉进行中的请求
  },
})

for await (const pageItems of stream) {
  await saveToIndexedDB(pageItems) // 存得慢，上游就不会急着拉下一页
}
```

> **别在 `start` 里做无限生产**：`start` 只执行一次且不受背压约束，往里面塞海量数据会直接吃满内存。**要多少给多少的逻辑一律放 `pull`**。

### 3.5 `tee()` 分流

将一条可读流复制成两条，供两个消费者独立读取（如：一份用于预览、一份用于缓存）：

```javascript
const [stream1, stream2] = res.body.tee()

// 两个消费者各读各的，互不干扰
renderToPage(stream1)
saveToCache(stream2)
```

[width(22,78)]

| 行为                                 | 说明                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| **上游只被读一次**                   | 源数据被分发到两个**各自独立**的内部队列，两个消费者看到的是同一份内容                     |
| **消费速度互不影响接口，但互相拖累** | 慢的那条会把快的那条一起拖住（上游要等两边都跟上），而且慢的一侧会**积压数据占内存**       |
| **取消要两边都取消**                 | 只有 `stream1` 和 `stream2` **都被取消**时，才会真正取消上游；只取消一条，另一条照常拿数据 |

> 所以 `tee()` 适合「两个消费者速度相近」的场景（页面渲染 + 同时写缓存）；如果两者速度差一个数量级，慢的那侧会持续积压——这种场景更适合先落地存储，再从存储里分别读。

流的分流是 Streams 的通用能力，同一套 API 也存在于 `TransformStream`产生的流上。

## 4. 可写流 (WritableStream)

可写流是**数据汇**，结构上和可读流镜像对称：**写入者**（`writer`）+ **内部队列** + **你的处理逻辑**（`underlyingSink`）。区别在于背压的方向——

- 可读流的背压表现为「**`pull()` 不再被调用**」；
- 可写流的背压表现为「**`writer.write()` 返回的 Promise 迟迟不 resolve**」。

写入者只管 `write()`，**处理得太慢时压力会自动回传到写入者身上**，不用你手写限流。

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

**回调的时序规则（同样重要）：**

```markdown
writer.write(a) → sink.write(a) 被调用，返回 Promise P
writer.write(b) → 排队等待，直到 P resolve 才会调用 sink.write(b)
```

- 也就是说 **`sink.write` 永远不会并发执行**——你返回的 Promise 就是「这一块处理完了」的信号，也是背压的开关。处理逻辑是异步的（写库、上传），**一定要把 Promise `return` 出去**，忘了 return 等于放弃背压。
- `sink.start` 也可以返回 Promise，流会等它 settle 后再处理第一块。
- **`close()` 与 `abort()` 的分工**：`close` 是正常收尾（写完最后一块、刷缓冲、提交事务）；`abort` 是异常清理（回滚、删临时文件）。`writer.close()` 触发前者，`writer.abort(reason)` / `stream.abort(reason)` 触发后者，**二者只会有一个被调用**。

> **`controller.error(reason)`**：在 `write` 里发现数据有问题时调用它，流会立刻进入错误态，后续 `write()` 全部 reject，且**不会**再调用 `close()`。

**`queuingStrategy` 同样适用于可写流**（第二个构造参数），含义与可读流一致：内部缓冲的水位，决定什么时候让 `write()` 的 Promise 挂着不 resolve。

### 4.2 基本用法

最小骨架——四个回调各司其职：

```javascript
const writable = new WritableStream({
  start() {
    // 初始化：开文件、开事务、建连接
  },
  write(chunk) {
    // 处理每一块；返回 Promise 表示「这块处理完了」
    console.log('写入', chunk)
  },
  close() {
    // 正常收尾：关文件、提交事务
  },
  abort(reason) {
    // 异常清理：回滚、删临时数据
  },
})

const writer = writable.getWriter()
await writer.write('hello')
await writer.write(' world') // 等上一块的 Promise resolve 后才会执行
await writer.close()
```

放到真实场景里，可写流最常干的两件事是**分片上传**和**批量落库**：

```javascript
// 场景：分片上传——每写一块发一次请求，服务端处理慢时自动背压
const uploadSink = new WritableStream({
  async write(chunk) {
    // 关键：把 Promise return 出去，服务端慢时 write() 就不会 resolve
    await fetch('/api/upload', { method: 'POST', body: chunk })
  },
  async close() {
    await fetch('/api/upload/finish', { method: 'POST' }) // 通知服务端合并分片
  },
  abort(reason) {
    console.warn('上传中止，需清理服务端已收的临时分片', reason)
  },
})

// 最常见的是直接把它接到可读流后面，写多少、什么时候结束都不用你管
await readableStream.pipeTo(uploadSink) // 背压由 pipeTo 自动管理

// 也可以手动控制每一块的时机
const writer = uploadSink.getWriter()
await writer.write(chunkA)
await writer.abort('用户取消了上传') // 中断：走 abort 分支，close 不会再触发
```

## 5. 变换流 (TransformStream)

变换流就是**一条流的两面**：它内部同时持有一条可读流和一条可写流——写进去、转换后读出来。

[width(19,81)]

| 属性          | 说明                                                     |
| ------------- | -------------------------------------------------------- |
| `ts.writable` | 变换的**输入**端（WritableStream），可以 `getWriter()`   |
| `ts.readable` | 变换后的**输出**端（ReadableStream），可以 `getReader()` |

`pipeThrough(ts)` 做的事就是「把上游接到 `ts.writable`，再把 `ts.readable` 交给你」——正因为它是「一进一出」，才能无缝串进管道。

**底层 `transformer` 回调（配置项）：**

[width(25,24,51)]

| 回调                           | 触发时机           | 作用                                     |
| ------------------------------ | ------------------ | ---------------------------------------- |
| `start(controller)`            | 构造时立即执行一次 | 初始化                                   |
| `transform(chunk, controller)` | 每进来一块数据时   | 转换并用 `controller.enqueue` 输出       |
| `flush(controller)`            | 输入流结束时       | 输出尾部数据（如压缩流写尾、缓冲 flush） |

**`transform` 里能做什么**——不只是「一变一」：

[width(13,51,36)]

| 产出情况     | 怎么写                                         | 典型用途                      |
| ------------ | ---------------------------------------------- | ----------------------------- |
| **不产出**   | 直接 `return`，不调 `enqueue`                  | 过滤、丢弃心跳包              |
| **一进一出** | `controller.enqueue(处理后的块)`               | 大小写转换、解压、解密        |
| **一进多出** | 循环调多次 `enqueue`                           | 按行 / 按分隔符切分（见下例） |
| **攒着不出** | 先存进闭包变量，满足条件再输出                 | 攒够一批再发、按帧对齐        |
| **异步处理** | `transform` 写成 `async`，`await` 完再 enqueue | 调接口、写数据库              |

**`flush` 是收尾用的**：输入流结束后调用一次，用来吐出缓冲区里的残留——压缩流要在这里写完尾部标记，按行切分要在这里吐出没有换行符结尾的最后一行。**只要 `transform` 里存了状态，几乎都需要 `flush`。**

```javascript
// 场景：把字节流按行切开。§8.3 处理大 CSV 用的就是这个 splitByLine
function splitByLine() {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() // 最后一段可能是半行，留到下一块再拼
      lines.forEach(line => controller.enqueue(line)) // 一进多出
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer) // 收尾：吐出没有换行符的最后一行
    },
  })
}
```

`pipeThrough()` 返回的是**变换后的可读流**，所以可以一路链式串下去：

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

// pipeThrough 返回新的可读流，后续还能继续 .pipeThrough(...)
const result = await readable.pipeThrough(uppercase).getReader().read()

console.log(result.value) // 'HELLO'
```

**内置变换流**（不必自己写，直接 new 来用）：

[width(49,20,31)]

| 内置类                                    | 作用                                    | 常见搭配                                        |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| `TextDecoderStream`                       | 字节 → 字符串，自动处理多字节字符被切断 | `res.body.pipeThrough(new TextDecoderStream())` |
| `TextEncoderStream`                       | 字符串 → 字节                           | 流式上传文本                                    |
| `CompressionStream('gzip' / 'deflate')`   | 压缩                                    | 上传前压缩（见 8.2）                            |
| `DecompressionStream('gzip' / 'deflate')` | 解压                                    | 处理服务端返回的压缩数据                        |

> 为什么推荐 `TextDecoderStream` 而不是手写 `TextDecoder`？它就是「用 `flush` 帮你兜住半截多字节字符」的标准实现——自己写容易漏掉 `{ stream: true }`，于是中文被切出乱码（见 12.5）。

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
  .pipeThrough(splitByLine()) // 自定义：按 \n 切块，实现见第 5 节

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

| 场景                 | 用什么                                                |
| -------------------- | ----------------------------------------------------- |
| AI 对话 / 打字机效果 | `Response.body` + `TextDecoderStream`，逐块解析 SSE   |
| 大文件下载 + 进度    | `getReader()` 累加 `byteLength`                       |
| 大文件上传 + 进度    | `file.stream()` + `duplex: 'half'`                    |
| 接口压缩传输         | `CompressionStream` / `DecompressionStream`           |
| 超大数据量导出       | 服务端流式返回，前端边收边写 `Blob`，避免拼超长字符串 |
| 一份数据两处用       | `tee()` 分流：一份渲染、一份缓存或上传                |
| 首字节更快的页面     | Service Worker 里先返回响应头，内容边取边拼           |

## 10. 最佳实践总结

- **优先管道**：能用 `pipeThrough()` / `pipeTo()` 就别手写 `read/write` 循环，背压由引擎自动处理。
- **注意背压**：手动消费时，务必 `await` 每次 `write()`，否则会失去背压保护。
- **及时关闭/取消**：处理完成后 `close()`，不再需要时 `reader.cancel()` 释放资源。
- **注意「锁」**：一个流同一时刻只能有一个 reader / writer，用 `releaseLock()` 释放或 `cancel()` 丢弃，否则后续消费会抛 `TypeError`。
- **上传流式请求体必须写 `duplex: 'half'`**：漏掉直接报错。
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

- **响应本来就没有响应体**：状态码 `204` / `304`，或 `HEAD` / `OPTIONS` 请求，规范规定此时 `body` 为 `null`。
- **跨源不透明响应**：`mode: 'no-cors'` 拿到的不透明响应读不出内容。
- **已经被读过了**

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

因为 fetch 需要知道「请求体是流式发送的」。规范要求流式请求体必须显式声明半双工（HTTP/2 虽然本质全双工，但 fetch 目前只实现 `half`），漏写会直接抛 `TypeError: RequestInit: duplex option is required when sending a body`。

### 12.5 分块解码后中文为什么变乱码？

UTF-8 的一个汉字占 3 字节，**可能被切在块的边界上**，单独解码就会得到乱码。两种正确写法：

- 用 `TextDecoderStream` 走管道；
- 手动解码时传 `{ stream: true }`，让解码器把不完整的字节留到下一块：`decoder.decode(chunk, { stream: true })`。

### 12.6 `tee()` 有什么代价？

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
