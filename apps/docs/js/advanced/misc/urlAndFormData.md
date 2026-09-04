# URL、URLSearchParams 与 FormData

处理 URL 参数和表单数据是前端高频场景：从「解析查询字符串」到「构造带参请求」再到「上传文件」，这三者构成了浏览器原生的「地址与数据」工具箱。

**一句话理解**：**「`URL` 解析地址、`URLSearchParams` 操作查询串、`FormData` 组装表单/文件数据，三者无缝配合，替代手写字符串拼接。」**

## 1. `URL`：解析与构造地址

```javascript
const url = new URL('https://example.com:8080/path?page=2&kw=vue#top')

url.protocol // "https:"
url.host // "example.com:8080"
url.hostname // "example.com"
url.port // "8080"
url.pathname // "/path"
url.search // "?page=2&kw=vue"
url.hash // "#top"
url.origin // "https://example.com:8080"
```

### 1.1 设置参数

```javascript
const url = new URL('https://example.com/path')
url.searchParams.set('page', '2') // 覆盖
url.searchParams.append('tag', 'a') // 追加
url.searchParams.append('tag', 'b') // 同名参数保留多个
url.toString() // "https://example.com/path?page=2&tag=a&tag=b"
```

### 1.2 拼接相对路径

```javascript
new URL('/detail', 'https://example.com/list')
// "https://example.com/detail"  —— 自动解析相对路径

new URL('../a', 'https://example.com/x/y')
// "https://example.com/a"
```

> 优势：相比手写 `+` 拼接字符串，`URL` 会自动处理编码、协议、相对路径，避免「漏了 `?` 或 `&`」的 bug。

## 2. `URLSearchParams`：操作查询字符串

### 2.1 基本用法

```javascript
const params = new URLSearchParams('page=2&kw=vue')

params.get('page') // "2"
params.set('kw', 'react') // 覆盖
params.append('tag', 'x') // 追加
params.has('page') // true
params.delete('page') // 删除
params.toString() // "kw=react&tag=x"
```

### 2.2 遍历与迭代器

```javascript
const params = new URLSearchParams('a=1&b=2')

for (const [key, value] of params) {
  console.log(key, value)
}

params.keys() // 迭代器
params.values() // 迭代器
params.entries() // 迭代器

params.sort() // 按 key 字母序排序
```

### 2.3 与对象互转

```javascript
// 对象 -> 查询串
const params = new URLSearchParams({ a: '1', b: '2' })
params.toString() // "a=1&b=2"

// 查询串 -> 对象
const obj = Object.fromEntries(new URLSearchParams('a=1&b=2'))
// { a: "1", b: "2" }
```

### 2.4 获取当前页面参数

```javascript
const params = new URLSearchParams(location.search)
const page = params.get('page')
```

## 3. URL 编码

### 3.1 `encodeURIComponent` vs `encodeURI`

| 函数                   | 编码范围                            | 用途               |
| ---------------------- | ----------------------------------- | ------------------ |
| `encodeURIComponent()` | 除字母数字及 `-_.!~*'()` 外全部编码 | 编码**单个参数值** |
| `encodeURI()`          | 保留 `:/?#[]@!$&'()*+,;=`           | 编码**完整 URL**   |

```javascript
encodeURIComponent('a b&c') // "a%20b%26c"
encodeURI('https://x.com/a b') // "https://x.com/a%20b"
```

> `URLSearchParams` 内部自动用 `encodeURIComponent`，所以**无需手动编码**。

## 4. `FormData`：组装表单与文件数据

`FormData` 表示 `multipart/form-data` 格式的键值对，可同时携带文本字段和文件，是 `fetch`/XHR 上传的标准载体。

### 4.1 手动构造

```javascript
const fd = new FormData()
fd.append('username', 'xunbei')
fd.append('avatar', fileInput.files[0]) // 直接放 File 对象
fd.append('tags', 'a')
fd.append('tags', 'b') // 同名多值
```

### 4.2 从表单元素直接构建

```javascript
const form = document.querySelector('form')
const fd = new FormData(form) // 自动收集表单内所有带 name 的字段
```

### 4.3 上传文件

```javascript
const fd = new FormData()
fd.append('file', fileInput.files[0])

await fetch('/api/upload', {
  method: 'POST',
  body: fd, // 无需手动设置 Content-Type，浏览器会自动带上 boundary
})
```

### 4.4 读取内容

```javascript
fd.get('username') // 第一个值
fd.getAll('tags') // 所有值组成的数组
fd.has('avatar') // 是否存在
fd.delete('tags') // 删除
fd.set('username', 'new') // 覆盖（清除同名旧值后设置）

for (const [key, value] of fd) {
  console.log(key, value) // value 可能是 File
}
```

### 4.5 与对象互转

```javascript
// FormData -> 对象
const obj = Object.fromEntries(fd.entries())

// 对象 -> FormData
const fd = new FormData()
Object.entries(obj).forEach(([k, v]) => fd.append(k, v))
```

## 5. 三者配合的典型场景

```javascript
// 场景：带查询参数的 GET 请求
const url = new URL('/api/search', location.origin)
url.searchParams.set('kw', keyword)
url.searchParams.set('page', '1')

fetch(url) // 自动编码中文与特殊字符

// 场景：混合文本 + 文件的表单提交
const fd = new FormData()
fd.append('title', title)
fd.append('cover', coverFile)
await fetch('/api/publish', { method: 'POST', body: fd })
```

## 6. 常见问题 (FAQ)

### 6.1 手写 `?a=1&b=2` 和用 `URLSearchParams` 有什么区别？

`URLSearchParams` 会**自动 encodeURIComponent** 处理中文、空格、`&` 等特殊字符，手写拼接极易漏编码导致参数解析错乱。

### 6.2 `FormData` 上传时要不要手动设置 `Content-Type`？

**不要**。`fetch`/XHR 会自动设置 `multipart/form-data` 并生成随机 `boundary` 分隔符，手动设置反而会导致后端无法解析。

### 6.3 `URLSearchParams` 能处理数组吗？

它本身没有数组约定，常见做法是「同名多值」`?tag=a&tag=b`，配合 `getAll('tag')` 读取；或与后端约定 JSON 字符串序列化后放入单个参数。

### 6.4 `append` 和 `set` 有什么区别？

- `append`：**追加**，保留已有同名值。
- `set`：**覆盖**，先清除该 key 的所有旧值再设置。

## 7. 总结

- `URL` 负责完整地址的解析与构造。
- `URLSearchParams` 负责查询串的读写，自动编码。
- `FormData` 负责表单/文件数据，上传时别手动设 `Content-Type`。
- 三者可无缝组合，彻底告别手写字符串拼接。
