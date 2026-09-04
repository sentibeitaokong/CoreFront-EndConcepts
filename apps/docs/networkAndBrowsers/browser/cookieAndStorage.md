# Cookie 与浏览器存储全景

浏览器提供了多种「把数据留在客户端」的手段：`Cookie`、`sessionStorage`、`localStorage`、`IndexedDB`、`Cache Storage`。它们各有边界与适用场景，选错方案轻则浪费性能，重则埋下安全隐患。

**一句话理解**：**「Cookie 是随请求自动携带的『小纸条』，Web Storage 是键值对『抽屉』，IndexedDB 是异步的『本地数据库』，Cache Storage 是请求级别的『缓存仓库』。」**

## 1. Cookie：会「搭顺风车」的小数据

Cookie 最大的特点：**每次 HTTP 请求都会自动携带**（同域下），因此它天生适合做「身份凭证」，也正因为随请求发送，才要求它**小而少**。

### 1.1 关键属性

| 属性              | 说明                                                |
| ----------------- | --------------------------------------------------- |
| `Name/Value`      | 键值对，Value 需编码                                |
| `Domain`          | 生效域名，可限定子域                                |
| `Path`            | 生效路径，默认当前路径                              |
| `Expires/Max-Age` | 过期时间；不设则是「会话 Cookie」，浏览器关闭即失效 |
| `HttpOnly`        | **禁止 JS 读取**，只随请求发送，防 XSS 窃取         |
| `Secure`          | 仅在 HTTPS 下发送                                   |
| `SameSite`        | 防 CSRF：`Strict` / `Lax` / `None`                  |

### 1.2 读写

```javascript
// 写（服务端一般通过 Set-Cookie 设置）
document.cookie = 'theme=dark; path=/; max-age=31536000'

// 读（只能拿到所有 cookie 拼接的字符串，需手动解析）
console.log(document.cookie)

// 删（把过期时间设为过去）
document.cookie = 'theme=; max-age=0; path=/'
```

### 1.3 编码与边界

Cookie 的 `name`/`value` 不允许出现分号、逗号、空格、中文等字符，需用 `encodeURIComponent` 编码：

```javascript
document.cookie = `${encodeURIComponent('用户名')}=${encodeURIComponent('小明')}`
// 读取时再 decodeURIComponent 解码
```

### 1.4 使用限制

- **大小**：约 4KB。
- **数量**：每个域名约 20~50 个。
- **每次请求自动携带**，过多 Cookie 会拖慢请求。

> 安全提醒：用于鉴权的 Cookie 务必加 `HttpOnly` + `Secure` + `SameSite`，详见 [认证存储取舍](/webSecurity/authStorageTradeoff)。

## 2. `SameSite` 与 CSRF 防护

`SameSite` 决定「跨站请求是否携带 Cookie」，是 CSRF 的第一道防线：

| 取值     | 跨站请求带不带 Cookie                   | 典型场景                                   |
| -------- | --------------------------------------- | ------------------------------------------ |
| `Strict` | **完全不带**                            | 最严格；但第三方链接首次进入会「未登录」   |
| `Lax`    | 仅顶级导航（如点链接跳转）的 GET 携带   | 平衡体验与安全，多数站点的默认选择         |
| `None`   | **所有跨站请求都带**（必须配 `Secure`） | 跨站 iframe 嵌入、第三方支付、SSO 单点登录 |

```javascript
// 三种典型设置
document.cookie = 's=1; SameSite=Strict'
document.cookie = 's=1; SameSite=Lax'
document.cookie = 's=1; SameSite=None; Secure' // None 必须 Secure
```

> `SameSite=Lax` 能防住「表单伪造提交」，但挡不住「顶级导航 GET 携带」；金融类场景仍建议叠加 CSRF Token。

## 3. Web Storage：`sessionStorage` 与 `localStorage`

| 维度       | `localStorage`         | `sessionStorage`                     |
| ---------- | ---------------------- | ------------------------------------ |
| 生命周期   | **永久**，除非手动清除 | **会话级**，标签页关闭即清除         |
| 作用域     | 同源所有标签页共享     | 仅当前标签页（复制标签页会复制一份） |
| 容量       | 约 5MB                 | 约 5MB                               |
| 存储类型   | 字符串键值对           | 字符串键值对                         |
| 随请求发送 | 否                     | 否                                   |

```javascript
// 两者 API 完全一致
localStorage.setItem('key', JSON.stringify({ a: 1 }))
localStorage.getItem('key')
localStorage.removeItem('key')
localStorage.clear()
```

### 3.1 `storage` 事件：跨标签页同步

`localStorage` 变化时，**其他**标签页会收到 `storage` 事件（注意：**发起写入的标签页自身不会触发**），可用于多标签页通信：

```javascript
window.addEventListener('storage', e => {
  console.log(e.key) // 变化的 key
  console.log(e.oldValue) // 旧值
  console.log(e.newValue) // 新值
})
```

### 3.2 容量与异常

超过约 5MB 会抛出 `QuotaExceededError`，隐私模式下可能完全禁用：

```javascript
try {
  localStorage.setItem('big', hugeString)
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    console.log('存储空间已满')
  }
}
```

**适用场景**：非敏感的、无需随请求发送的小数据——主题偏好、表单草稿、轻量缓存。

## 4. IndexedDB：浏览器里的「数据库」

IndexedDB 是**异步、支持索引、可存大量结构化数据**（含 Blob）的本地数据库，适合缓存大列表、离线数据、图片等。

### 4.1 核心概念

| 概念         | 说明                           |
| ------------ | ------------------------------ |
| Database     | 一个数据库实例                 |
| Object Store | 类似「表」，存放记录           |
| Index        | 为字段建立索引，加速查询       |
| Transaction  | 所有读写都在事务中，保证一致性 |
| Cursor       | 游标遍历查询结果               |

### 4.2 基本流程

```javascript
// 打开/创建数据库
const req = indexedDB.open('MyDB', 1)

req.onupgradeneeded = e => {
  const db = e.target.result
  // 建「表」和「索引」
  const store = db.createObjectStore('users', { keyPath: 'id' })
  store.createIndex('name', 'name', { unique: false })
}

req.onsuccess = e => {
  const db = e.target.result
  // 写
  const tx = db.transaction('users', 'readwrite')
  tx.objectStore('users').add({ id: 1, name: 'xunbei' })
  // 读
  const getReq = db.transaction('users').objectStore('users').get(1)
  getReq.onsuccess = () => console.log(getReq.result)
}
```

### 4.3 索引查询与范围遍历

```javascript
// 通过索引按 name 查询
const index = tx.objectStore('users').index('name')
const range = IDBKeyRange.bound('a', 'z') // 范围查询
const cursorReq = index.openCursor(range)

cursorReq.onsuccess = e => {
  const cursor = e.target.result
  if (cursor) {
    console.log(cursor.value) // 逐条处理
    cursor.continue() // 继续下一条
  }
}
```

> IndexedDB 是事件回调风格的异步 API，社区库如 `idb` / `localforage` 提供了 Promise 封装，推荐使用。

## 5. Cache Storage：请求级缓存

`Cache Storage`（配合 Service Worker）按「**Request → Response**」缓存整个 HTTP 响应，是 PWA 离线能力的底层：

```javascript
const cache = await caches.open('my-cache')
await cache.add('/api/data') // 缓存请求结果
const res = await cache.match('/api/data')
```

详见 [Service Worker 与 PWA](/networkAndBrowsers/caching/serviceWorkerPwa)。

## 6. 全景对比与选型

| 存储           | 容量    | 是否随请求 | 同步/异步 | 数据类型           | 典型场景               |
| -------------- | ------- | ---------- | --------- | ------------------ | ---------------------- |
| Cookie         | ~4KB    | ✅ 是      | 同步      | 字符串             | 身份凭证、跨请求状态   |
| sessionStorage | ~5MB    | ❌ 否      | 同步      | 字符串键值对       | 会话内临时数据         |
| localStorage   | ~5MB    | ❌ 否      | 同步      | 字符串键值对       | 主题、偏好、轻量缓存   |
| IndexedDB      | 数百 MB | ❌ 否      | 异步      | 对象、Blob、二进制 | 大列表、离线数据、文件 |
| Cache Storage  | 较大    | ❌ 否      | 异步      | Request/Response   | PWA 离线、资源缓存     |

### 6.1 选型决策

```
需要随请求自动发送（身份凭证）？ ──是──▶ Cookie（HttpOnly + Secure + SameSite）
        │ 否
需要跨标签页实时同步？ ──是──▶ localStorage + storage 事件
        │ 否
数据 > 5MB 或含文件/二进制？ ──是──▶ IndexedDB
        │ 否
需要离线缓存 HTTP 响应？ ──是──▶ Cache Storage + Service Worker
        │ 否
会话级临时数据？ ──是──▶ sessionStorage，否则 localStorage
```

## 7. 常见问题 (FAQ)

### 7.1 token 应该放 Cookie 还是 localStorage？

- 放 **HttpOnly Cookie**：防 XSS 窃取，但需配 CSRF 防护（SameSite、CSRF token）。
- 放 **localStorage**：无 CSRF 问题，但一旦发生 XSS，token 会被直接读走。
- 折中：内存中保存 + 刷新用 refresh token。权衡取决于安全模型，详见 [认证存储取舍](/webSecurity/authStorageTradeoff)。

### 7.2 `localStorage` 存大数据为什么会导致卡顿？

`localStorage` 是**同步** API，读写会阻塞主线程，且每次序列化/反序列化有开销。大数据应用 `IndexedDB`（异步）。

### 7.3 为什么我的 Cookie 在 `document.cookie` 里读不到？

大概率该 Cookie 设了 `HttpOnly`，这是**设计如此**——`HttpOnly` 正是为了禁止 JS 读取、防止 XSS 窃取。

### 7.4 为什么「复制标签页」后 `sessionStorage` 也被复制了？

复制标签页（`Duplicate Tab`）会克隆原页面的会话，因此 `sessionStorage` 也被复制一份，但两者此后**相互独立**，互不影响。而新开标签页则不会继承。

### 7.5 `Cookie` 和 `localStorage` 都能存数据，性能有差别吗？

有。Cookie 会**随每次请求发送**，体积再小也会增加网络开销，且受 4KB 上限约束；`localStorage` 不随请求发送，读写更快。所以「非凭证类」数据一律别放 Cookie。

## 8. 总结

- Cookie：随请求走、4KB、管凭证，加 `HttpOnly/Secure/SameSite` 防 XSS/CSRF。
- Web Storage：同步键值对、5MB、管轻量数据；`storage` 事件可跨标签页同步。
- IndexedDB：异步、大容量、支持索引，管大数据与离线。
- Cache Storage：请求级缓存，管 PWA 离线资源。
- 选型口诀：**凭证 Cookie，轻量 Storage，大数据 IndexedDB，离线 Cache Storage。**
