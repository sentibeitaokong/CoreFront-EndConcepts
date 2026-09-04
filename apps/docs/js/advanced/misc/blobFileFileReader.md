# Blob、File 与 FileReader

浏览器处理「文件与二进制数据」有两条主线：底层是 [ArrayBuffer](/js/advanced/misc/arrayBuffer)（纯字节），而面向应用层的是 `Blob` / `File` / `FileReader`——它们负责文件的表示、读取与下载，是图片上传预览、大文件分片、前端下载等场景的基石。

**一句话理解**：**「`Blob` 是不可变的二进制数据块，`File` 是带名字和元信息的 `Blob`，`FileReader` 把它们的二进制内容读成字符串或 Data URL。」**

## 1. 二进制数据家族关系

```
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

## 2. `Blob`：不可变二进制数据

`Blob`（Binary Large Object）表示一段原始二进制数据，不可变、可被 `slice` 切分。

```javascript
// 从字符串创建
const blob = new Blob(['Hello World'], { type: 'text/plain' })

blob.size // 11（字节数）
blob.type // "text/plain"
blob.slice(0, 5) // 切出前 5 字节
```

### 2.1 从多种数据构造

```javascript
new Blob(['hello']) // 字符串
new Blob([new Uint8Array([1, 2, 3])]) // TypedArray
new Blob([arrayBuffer]) // ArrayBuffer
new Blob([blob1, blob2]) // 多个 Blob 拼接
```

### 2.2 Blob 的现代读取方法

除了 `FileReader`，`Blob` 本身也提供 Promise 化的读取方法：

```javascript
await blob.text() // 读成字符串
await blob.arrayBuffer() // 读成 ArrayBuffer
blob.stream() // 读成 ReadableStream
```

### 2.3 Blob URL：在内存中「落地」为可访问地址

```javascript
const url = URL.createObjectURL(blob)
// "blob:http://localhost/xxxx-xxxx"

const img = document.querySelector('img')
img.src = url

// 用完后务必释放，避免内存泄漏
URL.revokeObjectURL(url)
```

> 用途：本地预览图片/视频、生成临时下载链接。**用完必须 `revokeObjectURL`**。

### 2.4 Data URL 与 Base64

`FileReader.readAsDataURL` 可把内容转成 `data:...;base64,...` 字符串，可直接内联到 `<img>` 或 CSS：

```javascript
const reader = new FileReader()
reader.onload = e => {
  const dataUrl = e.target.result // "data:image/png;base64,iVBORw0..."
  img.src = dataUrl
}
reader.readAsDataURL(file)
```

**Base64 编解码**：

```javascript
// 字符串 → Base64
btoa('hello') // "aGVsbG8="
// Base64 → 字符串
atob('aGVsbG8=') // "hello"

// 注意：btoa/atob 只支持 Latin1，中文需先 encodeURIComponent
btoa(encodeURIComponent('你好')) // 正确姿势
```

**对比**：Blob URL 更省内存（不复制数据），Data URL 是字符串（体积约 +33%），适合小图内联。

## 3. `File`：带元信息的 Blob

`File` 继承自 `Blob`，额外携带**文件名、最后修改时间**等元信息，通常来自文件选择框或拖拽。

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

### 3.1 通过拖拽获取文件

```javascript
dropZone.addEventListener('drop', e => {
  e.preventDefault()
  const files = e.dataTransfer.files // FileList
  console.log(files[0])
})
```

## 4. `FileReader`：读取文件内容

`FileReader` 是异步读取 `Blob`/`File` 的接口，有四种读取方式：

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

### 4.1 用 Promise 包装

`FileReader` 是基于事件回调的异步 API，可包装成 `async/await`：

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

## 5. 实战场景

### 5.1 图片上传前预览

```javascript
input.addEventListener('change', e => {
  const file = e.target.files[0]
  const url = URL.createObjectURL(file)
  preview.src = url
  preview.onload = () => URL.revokeObjectURL(url) // 图片加载完即可释放
})
```

### 5.2 前端生成文件并下载

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

### 5.3 大文件分片上传

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

### 5.4 图片压缩（结合 Canvas）

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

## 6. 常见问题 (FAQ)

### 6.1 `URL.createObjectURL` 后要释放吗？

**必须释放**。Blob URL 指向内存中的对象，不释放会一直占用内存直到页面关闭。在图片/视频 `onload` 后或下载完成后调用 `URL.revokeObjectURL`。

### 6.2 Blob 和 ArrayBuffer 是什么关系？

`ArrayBuffer` 是「裸字节」的底层表示，`Blob` 是更高层的「二进制数据块」抽象。二者可通过 `blob.arrayBuffer()` 或 `new Blob([arrayBuffer])` 互相转换。

### 6.3 为什么用 `fetch` 上传文件比 `FileReader` 读成 base64 更推荐？

`FileReader.readAsDataURL` 会把文件转成 base64 字符串，体积膨胀约 33% 且占用内存；直接用 `FormData` + `Blob` 上传是流式、零额外开销的。**上传走 `FormData`，预览才用 `FileReader`/Blob URL。**

### 6.4 `btoa` 处理中文为什么报错？

`btoa` 只支持 Latin1 字符，中文会抛异常。先 `encodeURIComponent` 转成 ASCII 再 `btoa`，解码时 `atob` 后 `decodeURIComponent`。

## 7. 总结

- `Blob` 是不可变二进制块，`File` 是带名字/类型的 `Blob`。
- `FileReader` 异步读取：文本用 `readAsText`，预览用 `readAsDataURL`，二进制用 `readAsArrayBuffer`。
- Blob URL 用完要 `revokeObjectURL`，上传优先 `FormData`。
- 分片上传依赖 `File.slice`（继承自 `Blob.slice`），现代读取可用 `blob.text()/arrayBuffer()`。
