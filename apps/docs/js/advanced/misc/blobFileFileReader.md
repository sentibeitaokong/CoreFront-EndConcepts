# Blob、File 与 FileReader

浏览器的文件与二进制数据分两层：底层 [ArrayBuffer](/js/advanced/misc/arrayBuffer)（纯字节），应用层 `Blob` / `File` / `FileReader`——负责文件的表示、读取与下载。

**一句话理解**：**「`Blob` 是不可变二进制数据块，`File` 是带名字与元信息的 `Blob`，`FileReader` 读出字符串或 Data URL。」**

## 1. 为什么需要 `Blob` / `File`

`ArrayBuffer` 做业务有两处不便：

- **没有类型、也没有名字**。浏览器不知道那块字节是 PNG 还是 CSV，也没法交给 `<img>`、`<a download>` 或 [FormData](/js/advanced/misc/urlAndFormData)。
- **必须整个待在内存里**。先 `readAsArrayBuffer` 读进一个 2 GB 的视频，页面就崩了。

`Blob` 给**不可变**字节打上 MIME 类型，数据可放在 JS 堆之外（内存或磁盘），还支持**切片**。`File` 再补**文件名**与**最后修改时间**，让 `input[type=file]` 选中的文件可描述、可校验、可上传。

**因此**：“**用户给的**”“**要下载的**”“**要交给 `<img>`/`<video>` 的**”二进制都走 `Blob` / `File`；只有**逐字节加工**（加密、编解码、协议解析）才落到 `ArrayBuffer` / `TypedArray`。

## 2. 二进制数据家族关系

```markdown
ArrayBuffer（纯字节）
├── TypedArray / DataView（操作字节的视图）
└── Blob（二进制数据块，面向应用层）
└── File（带 name/lastModified 的 Blob）
```

**互相转换**：

```javascript
// Blob → ArrayBuffer
const buf = await blob.arrayBuffer()

// ArrayBuffer → Blob
const blob = new Blob([arrayBuffer])

// File → Blob（File 本身就是 Blob，可直接用）
const blob = file.slice(0, 1024) // 继承自 Blob.slice
```

### 2.1 家族成员速查

[width(23,13,38,26)]

| 对象                      | 层次            | 关键能力                                                  | 典型来源                             |
| ------------------------- | --------------- | --------------------------------------------------------- | ------------------------------------ |
| `ArrayBuffer`             | 内存字节        | 定长、可读写、没有类型信息                                | `fetch` 响应、`blob.arrayBuffer()`   |
| `TypedArray` / `DataView` | 字节视图        | 按 `Int32` / `Float64` 等类型读写同一块内存               | `new Uint8Array(buffer)`             |
| `Blob`                    | 数据块          | 不可变、带 `type`、可 `slice` / `stream`                  | `new Blob([...])`、`canvas.toBlob()` |
| `File`                    | 数据块 + 元信息 | 在 `Blob` 之上多出 `name` / `lastModified`                | `input[type=file]`、拖拽 `drop`      |
| `FileReader`              | 读取器          | 事件驱动的异步读取，产出字符串 / Data URL / `ArrayBuffer` | `new FileReader()`                   |

### 2.2 转换路径的代价

- `blob.slice()` **不复制数据**，只新建一个指向同一份底层数据的 Blob（规范如此）。
- `blob.arrayBuffer()` / `blob.text()` 把**整块内容复制进 JS 堆**，这是内存峰值的主要来源。
- `new Blob([arrayBuffer])` 同样会复制一份。

```javascript
// 1. Blob → 字节：复制到内存（大文件慎用）
const buf = await blob.arrayBuffer()
const bytes = new Uint8Array(buf)

// 2. 字节 → Blob：复制
const packed = new Blob([bytes], { type: 'application/octet-stream' })

// 3. Blob → Blob：不复制，只是重新划定范围
const head = blob.slice(0, 1024)
```

## 3. `Blob`：不可变二进制数据

`Blob`（Binary Large Object）是不可变的原始二进制数据块，可被 `slice` 切分。

```javascript
// 从字符串创建
const blob = new Blob(['Hello World'], { type: 'text/plain' })

blob.size // 11（字节数）
blob.type // "text/plain"
blob.slice(0, 5) // 切出前 5 字节
```

### 3.1 从多种数据构造

```javascript
new Blob(['hello']) // 字符串
new Blob([new Uint8Array([1, 2, 3])]) // TypedArray
new Blob([arrayBuffer]) // ArrayBuffer
new Blob([blob1, blob2]) // 多个 Blob 拼接
```

构造签名 `new Blob(parts, options)`，`options` 只有 `type` 与 `endings`。

```javascript
// 第二个参数只有 type 和 endings
const csv = new Blob(['a,b\r\n1,2'], {
  type: 'text/csv',
  endings: 'native', // 保留 \r\n；默认 'transparent' 会把 \r\n 规范化成 \n
})

// BlobPart 可以是字符串、Blob、ArrayBuffer、TypedArray、DataView
const mixed = new Blob(['id,', new Uint8Array([0x31]), file1], {
  type: 'text/csv',
})

// 不传 type，得到的是空字符串，不是 'text/plain'
const bare = new Blob(['x'])
bare.type // ""
```

> 字符串先按 UTF-8 编码成字节，所以 `new Blob(['你好']).size` 是 6 而不是 2。`type` 只接受 ASCII，且自动转小写。

### 3.2 Blob 的现代读取方法

```javascript
await blob.text() // 读成字符串
await blob.arrayBuffer() // 读成 ArrayBuffer
blob.stream() // 读成 ReadableStream
```

```javascript
// 想直接要 Uint8Array，最常见的写法是包一层
const bytes = new Uint8Array(await blob.arrayBuffer())

// 较新的浏览器提供 bytes()，省掉这一步
if (typeof blob.bytes === 'function') {
  const view = await blob.bytes()
  console.log(view.byteLength)
}
```

> `blob.text()` **固定按 UTF-8 解码**，无法指定编码；读 GBK 文件只能回到 `FileReader.readAsText(file, 'gbk')` 或 `new TextDecoder('gbk')`。

### 3.3 `slice()`：切分，而不复制

```javascript
const blob = new Blob(['0123456789'])

const tail = await blob.slice(3).text() // "3456789"
const two = blob.slice(3, 5) // 只切 "34"

// 第三个参数可以覆盖新 Blob 的 type
const part = blob.slice(3, 5, 'text/plain')
part.type // "text/plain"
```

`slice(start, end, contentType)` 与字符串 / 数组的 `slice` 行为一致：

- 支持**负数**索引，`blob.slice(-3)` 表示最后 3 字节。
- `start` / `end` 自动收敛（clamp）到 `[0, size]`；`start` 超过末尾或 `start > end` 时得到 `size` 为 0 的空 Blob。
- **不复制数据**：“**切 100 个分片**”内存里仍只有 1 份，分片上传因此成立。
- 原 Blob 不可变，`slice` 只返回新 Blob，不改动原对象。

### 3.4 Blob 与 `ReadableStream` 的互转

`blob.stream()` 返回 `ReadableStream`；反过来可用 `Response` 把流“**收**”回 Blob：

```javascript
// Blob → ReadableStream
const readable = blob.stream()

// ReadableStream → Blob：借 Response 当转换器
const merged = await new Response(readable).blob()

// Response 也能一步完成 Blob → 文本 / 对象的解析
const data = await new Response(blob).json()
```

`Response` 与 `fetch` 共用 body 解析器，`text()` / `json()` / `formData()` / `arrayBuffer()` 都能用。**但 `new Response(stream).blob()` 会把流收进内存**，边读边处理要用 reader：

```javascript
const reader = blob.stream().getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // value 是 Uint8Array，可以喂给 TextDecoder 做增量解码
  console.log(value.byteLength)
}
```

### 3.5 Blob URL：在内存中「落地」为可访问地址

```javascript
const url = URL.createObjectURL(blob)
// "blob:http://localhost/xxxx-xxxx"

const img = document.querySelector('img')
img.src = url

// 用完后务必释放，避免内存泄漏
URL.revokeObjectURL(url)
```

> 用途：本地预览图片/视频、生成临时下载链接。**用完必须 `revokeObjectURL`**。

- **同一个 `Blob` 调两次 `createObjectURL` 得到两个不同 URL**，两个都要 revoke；复用同一个只需管一份。
- Blob URL 是**同源**的（源即创建它的页面），别的窗口拿不到，但能被 `fetch(url)` 取回。
- 页面卸载时浏览器会兜底回收，但 SPA 不会真正卸载页面，**别指望它**。
- 释放时机：图片/视频 `onload` 后、下载触发后、或组件卸载时——放在**用不到的那一刻**而非“**立刻**”：同步 revoke 刚设给 `img.src` 的 URL，个别浏览器会取消加载。

### 3.6 Data URL 与 Base64

`readAsDataURL` 产出 `data:...;base64,...` 字符串，可直接内联到 `<img>` 或 CSS：

```javascript
const reader = new FileReader()
reader.onload = e => {
  const dataUrl = e.target.result // "data:image/png;base64,iVBORw0..."
  img.src = dataUrl
}
reader.readAsDataURL(file)
```

```javascript
// 字符串 → Base64
btoa('hello') // "aGVsbG8="
// Base64 → 字符串
atob('aGVsbG8=') // "hello"

// 注意：btoa/atob 只支持 Latin1，中文需先 encodeURIComponent
btoa(encodeURIComponent('你好')) // 正确姿势
```

**对比**：Blob URL 更省内存（不复制数据）；Data URL 是字符串（约 +33%），适合小图。

**二进制数据**（如 `Uint8Array`）不能直接丢给 `btoa`，得先转成 Latin1 字符串：

```javascript
const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
const binary = Array.from(bytes, b => String.fromCharCode(b)).join('')

btoa(binary) // 注意：大数组这样转既慢又占内存，优先用 FileReader.readAsDataURL
```

### 3.7 Blob 的内存与性能

- 浏览器**不会**把 Blob 数据一直压在 JS 堆里：以 Chromium 为例，超过阈值后数据落到磁盘 blob storage（单进程上限约 2 GB），“创建大 Blob”通常比“创建等长字符串”便宜。
- 内存峰值来自**读取**：`blob.text()`、`blob.arrayBuffer()`、`new Response(blob).blob()` 都把全部内容复制进 JS 堆。
- `blob.slice()` 与 `URL.createObjectURL()` 都很廉价，可放心循环使用；不要为了“省内存”先把大文件读成 `ArrayBuffer`。
- 忘记 `revokeObjectURL` 属于典型的[内存泄漏](/js/advanced/misc/gcMemoryLeak)：Blob 数据因 URL 引用无法回收，DevTools 里搜 `blob:` 能找到。

## 4. `File`：带元信息的 Blob

`File` 继承自 `Blob`，额外携带**文件名、最后修改时间**等元信息，来自文件选择框或拖拽。

### 4.1 从文件选择框获取

```javascript
const input = document.querySelector('input[type=file]')
input.addEventListener('change', () => {
  const file = input.files[0]
  console.log(file.name) // "avatar.png"
  console.log(file.size) // 字节数
  console.log(file.type) // "image/png"
  console.log(file.lastModified) // 时间戳
})
```

- `input.files` 是 `FileList`（类数组，**没有 `map` / `filter`**），转数组用 `[...input.files]`；它是**实时**的，`input.value = ''` 后同一引用变空。
- `accept="image/*"` 只是选择框的**过滤器**，用户能切到 “**All Files**”，类型和大小**必须在代码里再校验一次**。
- 连续两次选同一个文件**不会**触发 `change`，需先清空 `input.value`。
- 给 `input.files` 赋值只能用 `DataTransfer`：`const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files`。

```javascript
input.addEventListener('change', () => {
  const files = Array.from(input.files) // FileList 不是数组

  for (const item of files) {
    if (!item.type.startsWith('image/')) continue // 不要只信 accept
    if (item.size > 5 * 1024 * 1024) continue // 超大文件另走分片
  }

  input.value = '' // 允许连续两次选同一个文件
})
```

### 4.2 通过拖拽获取文件

```javascript
dropZone.addEventListener('drop', e => {
  e.preventDefault()
  const files = e.dataTransfer.files // FileList
  console.log(files[0])
})
```

- **`dragover` 也要 `preventDefault()`**，否则 `drop` 根本不触发。
- **`drop` 也要 `preventDefault()`**，否则浏览器会直接打开文件、顶掉页面。

```javascript
// 必须同时阻止 dragover 的默认行为，否则 drop 不会触发
dropZone.addEventListener('dragover', e => e.preventDefault())

dropZone.addEventListener('drop', e => {
  e.preventDefault() // 否则浏览器会直接打开这个文件
  const files = [...e.dataTransfer.files]
  handle(files)
})
```

> 拖拽文件夹时 `dataTransfer.files` 只有最外层一项，要目录结构得用 `dataTransfer.items` 上非标准的 `webkitGetAsEntry()` 递归展开；`<input type="file" webkitdirectory>` 更省事。

### 4.3 `lastModified` 与 `webkitRelativePath`

```javascript
const file = input.files[0]

file.lastModified // 毫秒时间戳，来自文件系统
new Date(file.lastModified).toLocaleString() // "2024/6/1 10:20:30"

// 选择目录（webkitdirectory）或拖入文件夹时才有值，普通选择是空字符串
file.webkitRelativePath // "my-project/src/index.js"
```

`lastModified` 可用于增量上传或提示“**文件太旧**”；`webkitRelativePath` 虽带 webkit 前缀，但三大浏览器都支持。

### 4.4 用 `new File()` 手工构造

构造签名 `new File(fileBits, fileName, options)`：

```javascript
const made = new File(['hello'], 'hello.txt', {
  type: 'text/plain',
  lastModified: Date.now(),
})

// 常用于：给 Blob “补”一个文件名，再塞进 FormData
const renamed = new File([blob], 'avatar.png', { type: 'image/png' })

const fd = new FormData()
fd.append('file', renamed)
// 等价于 fd.append('file', blob, 'avatar.png')
```

## 5. `FileReader`：读取文件内容

`FileReader` 是异步读取 `Blob`/`File` 的接口，有四种方式：

[width(37,35,28)]

| 方法                       | 结果类型                  | 典型用途             |
| -------------------------- | ------------------------- | -------------------- |
| `readAsText(blob)`         | 字符串（文本）            | 读取 txt/csv/json    |
| `readAsDataURL(blob)`      | Data URL 字符串（base64） | 图片预览、上传前展示 |
| `readAsArrayBuffer(blob)`  | ArrayBuffer               | 读取二进制、分片上传 |
| `readAsBinaryString(blob)` | 二进制字符串（已废弃）    | 不建议使用           |

```javascript
const reader = new FileReader()

reader.onload = e => console.log(e.target.result)
reader.onerror = () => console.error('读取失败')
reader.onprogress = e => console.log(e.loaded, e.total)

reader.readAsText(file)
```

### 5.1 `readAsText` 的编码问题

`readAsText` 第二个参数指定编码，默认 `utf-8`：

```javascript
const reader = new FileReader()
reader.readAsText(file) // 默认按 utf-8 解码

// 读取 Excel 导出的 GBK 编码 CSV 时，必须显式指定
const gbkReader = new FileReader()
gbkReader.readAsText(file, 'gbk')
```

**编码猜错就会得到乱码**（常表现为一片 `���`），这是读 CSV / 老 txt 最常见的故障。相比之下：

- `FileReader.readAsText(blob, encoding)` 支持指定编码。
- `blob.text()` **只能 UTF-8**，不给第二次机会。
- 更现代的做法是 `new TextDecoder('gbk').decode(await blob.arrayBuffer())`，支持多编码，还能配合 `stream: true` 增量解码。

### 5.2 事件模型与状态机

`FileReader` 纯事件驱动，事件顺序固定：`loadstart` → `progress`（0 到多次）→ `load` / `error` / `abort` → `loadend`。

```javascript
const reader = new FileReader()

reader.onloadstart = () => console.log('开始读取')
reader.onprogress = e => {
  // e.loaded 已读字节数，e.total 总字节数
  console.log(`${((e.loaded / e.total) * 100).toFixed(1)}%`)
}
reader.onload = () => console.log(reader.readyState) // 2（DONE）
reader.onerror = () => console.error(reader.error) // DOMException
reader.onabort = () => console.log('已取消')
reader.onloadend = () => console.log('无论成功失败都会执行')

reader.readAsArrayBuffer(file)
```

配合三个只读属性使用：

- `reader.readyState`：`0` `EMPTY` / `1` `LOADING` / `2` `DONE`。
- `reader.result`：只有 `DONE` 之后才有值，类型取决于调用的方法。
- `reader.error`：失败时是 `DOMException`；`onerror` 回调收到的是**事件对象**，要拿错误本身得读 `reader.error`。

```javascript
// 中途取消读取，会触发 abort 事件
reader.abort()
```

> `progress` 上报的是“**已经读进内存多少字节**”，**不是上传进度**；小文件几乎瞬间读完，可能不触发或只触发一次，别把进度条做死在它上面。
>
> `FileReader` 可复用：进入 `DONE` 后可再调 `read*`；但 `LOADING` 状态下再调会抛 `InvalidStateError`。

### 5.3 用 Promise 包装

`FileReader` 基于事件回调，可包装成 `async/await`：

```javascript
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const dataUrl = await readAsDataURL(file)
```

> `reader.onerror = reject` 传下去的是**事件对象**而非错误本身；要真正的错误得写 `reject(reader.error)`。

```javascript
const text = await file.text() // 等同于 readAsText 的 utf-8 情况
const buffer = await file.arrayBuffer()
```

**只有当需要 `progress`、需要取消、或需要指定编码时，才值得回到 `FileReader`。**

### 5.4 各种读取 / 上传方案的取舍

[width(26,24,26,24)]

| 方案                                 | 一句话                              | 适合                                     | 不适合                         |
| ------------------------------------ | ----------------------------------- | ---------------------------------------- | ------------------------------ |
| `FileReader`                         | 事件驱动，可指定编码、有 `progress` | 需要进度 / 取消 / 编码，或要兼容老浏览器 | 新代码里的大多数场景，写法冗长 |
| `blob.text()` / `blob.arrayBuffer()` | Promise 化，最简洁                  | 一次性读取整个文件内容                   | 需要进度；`text()` 只能 UTF-8  |
| `new Response(blob).text()/json()`   | 复用 `fetch` 的 body 解析器         | 要 JSON / FormData 等内建解析            | 只是想读文本时绕了一层         |
| `fetch(blobUrl)`                     | 把 Blob 当 URL 取，可套 HTTP 语义   | 已有 Blob URL，或想让下游按 URL 处理     | 多一份 URL 生命周期要管        |
| `blob.stream()` / `getReader()`      | 流式、可背压、内存恒定              | 大文件、边读边算（哈希、解密）           | 需要自己拼装分块与解码逻辑     |
| `FormData` + `fetch`                 | 不读进 JS，浏览器直接写请求体       | **上传**（永远是首选）                   | 前端本地处理内容               |

## 6. 实战场景

### 6.1 图片上传前预览

```javascript
input.addEventListener('change', e => {
  const file = e.target.files[0]
  const url = URL.createObjectURL(file)
  preview.src = url
  preview.onload = () => URL.revokeObjectURL(url) // 图片加载完即可释放
})
```

### 6.2 前端生成文件并下载

```javascript
function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

> `download` 只在**同源**（或 `blob:` / `data:`）时生效，跨域链接会被忽略并直接跳转。个别旧版 Safari 会在同步 `revokeObjectURL` 时取消下载，稳妥起见放进 `setTimeout(() => URL.revokeObjectURL(url), 0)`。

### 6.3 大文件分片上传

```javascript
const CHUNK_SIZE = 1024 * 1024 // 1MB
const chunks = []
for (let i = 0; i < file.size; i += CHUNK_SIZE) {
  chunks.push(file.slice(i, i + CHUNK_SIZE)) // File 继承 Blob.slice
}

for (const [index, chunk] of chunks.entries()) {
  const fd = new FormData()
  fd.append('chunk', chunk)
  fd.append('index', String(index))
  await fetch('/api/upload', { method: 'POST', body: fd })
}
```

- **分片要带上文件名、总分片数、文件哈希**，后端才能合并回一个文件、重传时去重。
- 分片大小常见经验值是 **1–5 MB**：太小请求数暴涨，太大单片失败的重传成本高。
- 上面是**串行**上传。并发时 HTTP/1.1 同域连接数上限约 6，超出只会排队；HTTP/2 可放宽到 4–8 并发。
- 分片哈希用 `crypto.subtle.digest('SHA-256', await chunk.arrayBuffer())`，但它**仍要把单个分片读进内存**，粒度是分片而非整个文件。

### 6.4 图片压缩（结合 Canvas）

```javascript
async function compressImage(file, maxWidth = 800, quality = 0.8) {
  const dataUrl = await readAsDataURL(file)
  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const scale = Math.min(1, maxWidth / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = img.width * scale
  canvas.height = img.height * scale
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

  return new Promise(
    resolve => canvas.toBlob(resolve, 'image/jpeg', quality), // 返回 Blob
  )
}
```

`img.src = URL.createObjectURL(file)` 比走 Data URL 省内存（少一次 base64 编解码），或 `await createImageBitmap(file)` 拿位图直接 `drawImage`，省掉 `<img>`。`toBlob` 产物是 Blob，可继续塞进 `FormData` 上传。

### 6.5 拖拽上传整个列表

```javascript
dropZone.addEventListener('drop', async e => {
  e.preventDefault()
  const files = [...e.dataTransfer.files].filter(f =>
    f.type.startsWith('image/'),
  )

  const fd = new FormData()
  for (const item of files) {
    fd.append('files', item) // 同名多次 append，后端会收到一个数组
  }

  await fetch('/api/upload', { method: 'POST', body: fd })
})
```

`FormData.append` 直接接受 `Blob` / `File`，浏览器把数据**直接从 Blob 写进请求体**，不复制进 JS 堆。

### 6.6 大文件分片读取（不整块进内存）

读取本地文件做校验时，最容易犯的错是先 `readAsArrayBuffer` 读整个文件；正确姿势是按分片循环：

```javascript
async function* readChunks(file, chunkSize = 1024 * 1024) {
  for (let start = 0; start < file.size; start += chunkSize) {
    yield await file.slice(start, start + chunkSize).arrayBuffer()
  }
}

async function scanFile(file) {
  // 读一块处理一块，内存峰值只有一个分片
  for await (const chunk of readChunks(file)) {
    consume(new Uint8Array(chunk))
  }
}
```

内存峰值是**分片大小**而非文件大小：2 GB 的文件用 1 MB 分片读，峰值只有 1 MB。

### 6.7 性能与内存清单

- **能流式就读流式**，`blob.stream()` + `getReader()` 的内存占用与文件大小无关。
- **能传 Blob 就别转字符串**：`FormData` + `Blob` 直接上传，比 `readAsDataURL` 塞进 JSON 少一次 base64 膨胀（约 +33%）与字符串常驻。
- **及时 revoke**：Blob URL 是被动泄漏，DevTools 里搜 `blob:` 就能看到漏掉的那些。
- **避免无谓的复制**：`arrayBuffer()` → `new Blob([...])` → `text()` 每一步都复制整块数据。
- **上传进度用 XHR**：`fetch` 至今没有上传进度事件。

```javascript
function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => resolve(xhr.response)
    xhr.onerror = () => reject(new Error('上传失败'))
    xhr.send(formData)
  })
}
```

`fetch` 可以用 `AbortController` 取消：

```javascript
const controller = new AbortController()

fetch('/api/upload', { method: 'POST', body: fd, signal: controller.signal })

controller.abort() // 取消这次上传
```

### 6.8 兼容性

[width(36,28,36)]

| 能力                            | 起点                                    | 回退方案                                   |
| ------------------------------- | --------------------------------------- | ------------------------------------------ |
| `Blob` / `File` / `FileReader`  | 很早即广泛支持（IE10+）                 | 无                                         |
| `blob.slice()`                  | 现代浏览器均支持，无需前缀版本          | 旧的 `webkitSlice` / `mozSlice` 已无必要   |
| `blob.text()` / `arrayBuffer()` | Chrome 76 / Firefox 69 / Safari 14 起   | `FileReader` + Promise 包装                |
| `blob.stream()`                 | Chrome 76 / Firefox 69 / Safari 14.1 起 | 整块读成 `ArrayBuffer`                     |
| `blob.bytes()`                  | 2026 年初起（Baseline 2026）            | `new Uint8Array(await blob.arrayBuffer())` |
| `URL.createObjectURL`           | 广泛支持                                | `FileReader.readAsDataURL`                 |
| `FileReaderSync`                | **仅 Web Worker**                       | 主线程用异步的 `FileReader`                |

## 7. 总结

- `Blob` 是不可变二进制块，`File` 是带名字/类型的 `Blob`。
- `FileReader` 异步读取：文本 `readAsText`、预览 `readAsDataURL`、二进制 `readAsArrayBuffer`。
- Blob URL 用完要 `revokeObjectURL`，上传优先 `FormData`。
- 分片上传依赖 `File.slice`（继承自 `Blob.slice`），现代读取可用 `blob.text()/arrayBuffer()`。
- `slice()` 不复制数据、`arrayBuffer()` / `text()` 会复制整块内容——**内存峰值几乎总是来自“读”，而不是“建”**。
- 大文件优先 `blob.stream()`，读一块算一块；只有需要进度、取消或指定编码时才回到 `FileReader`。
- 记住三条底线：**上传走 `FormData`，预览走 Blob URL，URL 用完就 revoke**。

## 8. 常见问题 (FAQ)

### 8.1 `URL.createObjectURL` 后要释放吗？

- **必须释放**。Blob URL 指向内存中的对象，不释放会一直占着，直到页面关闭。
- 释放时机：图片/视频 `onload` 后、下载触发后、或组件卸载时，调 `URL.revokeObjectURL(url)`。
- **同一个 `Blob` 调两次 `createObjectURL` 得到两个 URL**，两个都要 revoke；复用同一个可以少管一半。
- 页面卸载时浏览器会兜底回收，但 SPA 不会真正卸载页面，所以别指望它。

### 8.2 Blob 和 ArrayBuffer 是什么关系？

- `ArrayBuffer` 是「裸字节」的底层表示，`Blob` 是更高层的「二进制数据块」抽象。
- 二者可通过 `blob.arrayBuffer()` 或 `new Blob([arrayBuffer])` 互相转换，**两个方向都会复制数据**。
- `Blob` 额外提供 `type`、`slice()`、`stream()`，可直接交给 `<img>`、`<a download>`、`FormData`；`ArrayBuffer` 不能。

### 8.3 为什么用 `fetch` 上传文件比 `FileReader` 读成 base64 更推荐？

- `FileReader.readAsDataURL` 把文件转成 base64 字符串，**体积膨胀约 33%**，且整份数据以字符串常驻 JS 堆。
- `FormData` + `Blob` 上传是**流式**的、零额外副本，浏览器直接把 Blob 写进请求体。
- **上传走 `FormData`，预览才用 `FileReader` / Blob URL。**

### 8.4 `btoa` 处理中文为什么报错？

- `btoa` 只支持 Latin1 字符，码点大于 255 的中文会直接抛 `InvalidCharacterError`。
- 先 `encodeURIComponent` 转成 ASCII 再 `btoa`，解码时 `atob` 后 `decodeURIComponent`。

```javascript
// 编码
const encoded = btoa(encodeURIComponent('你好'))
// 解码
const decoded = decodeURIComponent(atob(encoded)) // "你好"
```

- 要编码的是**二进制**（`Uint8Array`）而非字符串时，这条链路不适用，直接用 `readAsDataURL`。

### 8.5 `blob.slice()` 会复制数据吗？分片上传会不会把内存撑爆？

- **不会复制**。规范上 `slice()` 只新建一个引用同一份底层数据的 `Blob`，切 100 个 1 MB 分片，内存里仍只有 1 份。
- 撑爆内存的是 `arrayBuffer()` / `text()`：它们把**整块**内容复制进 JS 堆。
- 正确顺序是先 `slice()`，再对**单个分片**调 `arrayBuffer()`。
- `start` / `end` 会自动收敛到 `[0, size]`；`start > end` 或超出末尾时得到 `size` 为 0 的空 Blob。

### 8.6 `FileReader` 的 `result` 为什么是 `null`？

- 读取是**异步**的：`readAsText()` 返回后立刻读 `reader.result`，此时 `readyState` 还是 `LOADING`，自然是 `null`。
- 必须在 `onload`（或 `await`）之后再取 `reader.result`，此时 `readyState === 2`（`DONE`）。
- `result` 类型取决于方法：`readAsText` → 字符串，`readAsDataURL` → Data URL，`readAsArrayBuffer` → `ArrayBuffer`。

```javascript
const reader = new FileReader()

reader.readAsText(file)
console.log(reader.result) // null：还没读完

reader.onload = () => console.log(reader.result) // 这里有值
```

### 8.7 上传进度怎么做？`fetch` 有上传进度吗？

- **`fetch` 没有上传进度**，只有下载进度；上传进度要用 `XMLHttpRequest` 的 `xhr.upload.onprogress`。
- `fetch` 能做的是**取消**：传一个 `AbortController` 的 `signal`，需要时调 `abort()`。
- `FileReader.onprogress` 是**本地读取**进度，不是网络上传进度，别拿它当上传进度条。

### 8.8 Blob URL 和 Data URL 该选哪个？

- **Blob URL**：不复制数据、内存友好、同源可 `fetch`，适合**本地预览**（图片/视频/PDF）与**触发下载**；代价是要管 `revoke`。
- **Data URL**：是字符串，可**直接内联**进 HTML/CSS 或存进 JSON、数据库，但体积约 **+33%**，且整份数据以字符串常驻内存；只适合小图标、小图片。
- 经验法则：**运行时预览用 Blob URL，静态小资源内联用 Data URL。**
