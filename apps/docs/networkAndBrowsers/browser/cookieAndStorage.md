# Cookie 与浏览器存储全景

浏览器提供了多种「把数据留在客户端」的手段：`Cookie`、`sessionStorage`、`localStorage`、`IndexedDB`、`Cache Storage`。它们各有边界与适用场景，选错方案轻则浪费性能，重则埋下安全隐患。

**一句话理解**：**「Cookie 是随请求自动携带的『小纸条』，Web Storage 是键值对『抽屉』，IndexedDB 是异步的『本地数据库』，Cache Storage 是请求级别的『缓存仓库』。」**

## 1. Cookie：会「搭顺风车」的小数据

Cookie 最大的特点：**每次 HTTP 请求都会自动携带**（同域下），因此它天生适合做「身份凭证」，也正因为随请求发送，才要求它**小而少**。

### 1.1 关键属性

[width(32,68)]

| 属性                         | 说明                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `Name/Value`                 | 键值对，Value 需编码                                                                 |
| `Domain`                     | 生效域名，可限定子域；**不写则是主机域**（不包含子域）                               |
| `Path`                       | 生效路径，默认当前路径                                                               |
| `Expires/Max-Age`            | 过期时间；不设则是「会话 Cookie」，浏览器关闭即失效                                  |
| `Max-Age` 优先于 `Expires`   | 两者同时存在时以 `Max-Age`（相对秒数）为准                                           |
| `HttpOnly`                   | **禁止 JS 读取**，只随请求发送，防 XSS 窃取                                          |
| `Secure`                     | 仅在 HTTPS 下发送                                                                    |
| `SameSite`                   | 防 CSRF：`Strict` / `Lax` / `None`                                                   |
| `Partitioned`                | 按**顶级站点**隔离（CHIPS），第三方嵌入场景专用，须配 `Secure`                       |
| `__Host-` / `__Secure-` 前缀 | 名称前缀即约束：`__Secure-` 要求 `Secure`；`__Host-` 还要求 `Path=/` 且禁止 `Domain` |

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

### 1.5 高频场景

[width(26,74)]

| 场景                      | 为什么用 Cookie 而不是 Web Storage                                   |
| ------------------------- | -------------------------------------------------------------------- |
| **登录态 / 会话 ID**      | 服务端每个请求都要校验，靠自动携带才不用手写请求头                   |
| **SSR 首屏需要的偏好**    | 主题、语言在服务端渲染时就得出结果，localStorage 要等 JS 跑完        |
| **A/B 实验分流**          | 分流结果服务端也要读，且必须首屏就生效，否则页面会「闪一下」         |
| **来源追踪（utm、渠道）** | 后续所有请求（含接口、埋点）都要带上，天然跟着请求走                 |
| **CSRF Token**            | 需要 JS 读取后再写进请求头，所以这一条**不能**加 `HttpOnly`          |
| **第三方嵌入 / 跨站登录** | 必须 `SameSite=None; Secure`，iOS/新版 Chrome 还建议加 `Partitioned` |

- **`HttpOnly` 只能由服务端设置**：`document.cookie` 写不了它，前端也无法读回。
- **同名 Cookie 可能有多条**：`Path` 或 `Domain` 不同就是不同的 Cookie，`document.cookie` 里会同时出现，读取时容易拿到旧值。清理时要在**相同的 `Path` / `Domain`** 下再写一次空值 + 过期时间。
- **`Max-Age` 是相对秒数、`Expires` 是绝对时间**：两者并存时 `Max-Age` 生效；设成 `0` 或负数即删除。

## 2. `SameSite` 与 CSRF 防护

`SameSite` 决定「跨站请求是否携带 Cookie」，是 CSRF 的第一道防线：

[width(13,43,44)]

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

[width(15,24,61)]

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

### 3.3 高频场景与坑

[width(30,70)]

| 场景                         | 选哪个 / 怎么写                                                            |
| ---------------------------- | -------------------------------------------------------------------------- |
| 主题、语言、字号偏好         | `localStorage`，首屏由内联脚本读取，避免白屏后再切主题（闪烁）             |
| 表单草稿、编辑器自动保存     | 页面级用 `localStorage`；多步骤向导、临时状态用 `sessionStorage`           |
| 「引导已看过 / 弹窗已关闭」  | `localStorage` 存标记位，配版本号（`guide_v2`）便于改版后重弹              |
| 接口数据轻量缓存             | `localStorage` 存 `{ data, expireAt }`，读时手动判断 TTL，别指望它自己过期 |
| 列表滚动位置、筛选条件       | `sessionStorage`，刷新保留、关闭标签页即清理                               |
| 多标签页同步（登录态、主题） | `localStorage` + `storage` 事件                                            |

- API 只有四个：`setItem` / `getItem` / `removeItem` / `clear`，加 `key(i)` 与 `length` 用于遍历；**存进去的一定是字符串**，对象要 `JSON.stringify`。
- **判断「有没有」要用 `getItem(k) !== null`**：`undefined` 经 `JSON.stringify` 会变字符串 `"undefined"`，直接判断真假值容易踩空。
- **同步阻塞主线程**：读写大字符串会卡住渲染，几百 KB 以上就该换 `IndexedDB`。
- **`clear()` 是清空整个源的**，只删自己的 key 请用 `removeItem`；`localStorage` 只按**源**隔离，同一站点不同路径/项目会互相看见，键名要加业务前缀（如 `app:user`）。

## 4. IndexedDB：浏览器里的「数据库」

IndexedDB 是**异步、支持索引、可存大量结构化数据**（含 Blob）的本地数据库，适合缓存大列表、离线数据、图片等。

### 4.1 核心概念

[width(17,83)]

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

### 4.4 高频 API 速查

[width(62,38)]

| API                                                        | 说明                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `indexedDB.open(name, version)` / `deleteDatabase(name)`   | 打开（触发 `onupgradeneeded`）/ 删除整个库                              |
| `db.close()` / `db.onversionchange`                        | 关闭；**多标签页同时开库时**，旧页面收到该事件必须关闭并提示刷新        |
| `db.transaction(stores, mode)`                             | `mode` 取 `readonly`（默认）/ `readwrite`；`tx.oncomplete` 才是真正提交 |
| `store.add` / `put` / `get` / `delete` / `clear` / `count` | 基础增删改查；`add` 主键重复会报错，`put` 则覆盖                        |
| `store.getAll(query?, count?)` / `getAllKeys()`            | 一次取回多条（比开游标省事），注意大结果集会占内存                      |
| `index.get` / `getAll` / `openCursor`                      | 走索引查询，不建索引就只能全表扫                                        |
| `IDBKeyRange.only` / `bound` / `lowerBound` / `upperBound` | 构造范围条件，配合游标或 `getAll` 使用                                  |
| `cursor.update` / `delete` / `continue` / `advance(n)`     | 游标内改、删、跳步                                                      |

> **高频坑：`store.add()` 的 `onsuccess` 只代表这条请求成功，不代表事务已提交。** 要确认数据真正落库（比如随后要刷新 UI 或跳转），应监听 `tx.oncomplete`：

```javascript
const tx = db.transaction('users', 'readwrite')
tx.objectStore('users').put({ id: 1, name: 'xunbei' })
tx.oncomplete = () => console.log('事务已提交') // ← 以这里为准
tx.onerror = () => console.error('事务失败', tx.error)
tx.onabort = () => console.warn('事务被中止')
```

### 4.5 高频场景

[width(31,69)]

| 场景                        | 为什么非 IndexedDB 不可                                         |
| --------------------------- | --------------------------------------------------------------- |
| 离线优先的 IM / 邮件        | 数据量大 + 需要按会话、时间建索引分页查，localStorage 撑不住    |
| 图片 / 音视频离线包         | 能直接存 `Blob` / `ArrayBuffer`，不必转成 base64（省 33% 体积） |
| 埋点、日志的离线队列        | 断网时先写本地，恢复后批量上报，事务保证不丢不重                |
| 大文档编辑器草稿            | 自动保存频率高，异步写入不阻塞输入                              |
| 本地数据仓库（表格 / 报表） | 支持游标与范围查询，能实现「本地分页」                          |

```javascript
// 场景：大图离线缓存——命中就秒开，未命中再下载并写库
async function getImage(url) {
  const cache = await openDB('media', 1, db =>
    db.createObjectStore('images', { keyPath: 'url' }),
  )

  const cached = await cache.get('images', url)
  if (cached) return URL.createObjectURL(cached.blob)

  const blob = await fetch(url).then(r => r.blob())
  await cache.put('images', { url, blob }) // 存原始 Blob，取出即可直接用
  return URL.createObjectURL(blob)
}
```

## 5. Cache Storage：请求级缓存

`Cache Storage`（配合 Service Worker）按「**Request → Response**」缓存整个 HTTP 响应，是 PWA 离线能力的底层：

```javascript
const cache = await caches.open('my-cache')
await cache.add('/api/data') // 缓存请求结果
const res = await cache.match('/api/data')
```

### 5.1 高频 API 与场景

[width(45,55)]

| API                                       | 说明                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| `caches.open(name)`                       | 打开（不存在则创建）一个具名缓存                             |
| `cache.add(url)` / `addAll(urls)`         | 请求并缓存；任一失败则整体失败（`addAll` 是原子的）          |
| `cache.put(request, response)`            | 手动写入，可缓存自定义响应（如把接口结果拼成 `Response`）    |
| `cache.match(req, options?)` / `matchAll` | 命中查询，`ignoreSearch` / `ignoreVary` 等选项控制匹配宽松度 |
| `caches.keys()` / `caches.delete(name)`   | 列出 / 删除整个缓存，**版本升级后清理旧缓存靠这两个**        |

**高频场景：**

- **PWA 离线壳**：预缓存 HTML/CSS/JS，断网时回退到缓存版本。
- **静态资源长期缓存**：配合构建产物 hash 做「缓存优先」策略。
- **接口降级**：网络失败时 `match('/api/xxx')` 返回上一次的响应，页面不至于空白。
- **边缓存边返回**：Service Worker 里 `fetch` 拿到响应用 `tee()` 分流，一份回页面、一份写缓存。

> 两个易错点：`cache.put()` 只接受**同源**响应（跨源资源需 `mode: 'no-cors'` 的不透明响应，且读不出内容、无法判断状态码）；`cache.add()` 只认 GET，带 `POST` 的请求会直接抛错。

详见 [Service Worker 与 PWA](/networkAndBrowsers/caching/serviceWorkerPwa)。

## 6. 全景对比与选型

[width(19,13,16,14,18,20)]

| 存储           | 容量    | 是否随请求 | 同步/异步 | 数据类型           | 典型场景               |
| -------------- | ------- | ---------- | --------- | ------------------ | ---------------------- |
| Cookie         | ~4KB    | ✅ 是      | 同步      | 字符串             | 身份凭证、跨请求状态   |
| sessionStorage | ~5MB    | ❌ 否      | 同步      | 字符串键值对       | 会话内临时数据         |
| localStorage   | ~5MB    | ❌ 否      | 同步      | 字符串键值对       | 主题、偏好、轻量缓存   |
| IndexedDB      | 数百 MB | ❌ 否      | 异步      | 对象、Blob、二进制 | 大列表、离线数据、文件 |
| Cache Storage  | 较大    | ❌ 否      | 异步      | Request/Response   | PWA 离线、资源缓存     |

### 6.1 选型决策

```markdown
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

## 7. 总结

- Cookie：随请求走、4KB、管凭证，加 `HttpOnly/Secure/SameSite` 防 XSS/CSRF。
- Web Storage：同步键值对、5MB、管轻量数据；`storage` 事件可跨标签页同步。
- IndexedDB：异步、大容量、支持索引，管大数据与离线。
- Cache Storage：请求级缓存，管 PWA 离线资源。
- 选型口诀：**凭证 Cookie，轻量 Storage，大数据 IndexedDB，离线 Cache Storage。**

## 8. 常见问题 (FAQ)

### 8.1 token 应该放 Cookie 还是 localStorage？

- 放 **HttpOnly Cookie**：防 XSS 窃取，但需配 CSRF 防护（SameSite、CSRF token）。
- 放 **localStorage**：无 CSRF 问题，但一旦发生 XSS，token 会被直接读走。
- 折中：内存中保存 + 刷新用 refresh token。权衡取决于安全模型，详见 [认证存储取舍](/webSecurity/authStorageTradeoff)。

### 8.2 `Cookie` 和 `localStorage` 都能存数据，性能上各有什么坑？

- **`localStorage` 是同步 API**：读写都会**阻塞主线程**，每次序列化 / 反序列化还有额外开销。存几十 KB 就足以在高频操作（滚动、输入）里造成掉帧，大数据应改用异步的 `IndexedDB`。
- **Cookie 会随每次请求发送**：体积再小也要占请求头，且受约 4KB 上限约束。放大了等于每个请求都白背一份数据，非凭证类数据一律别放 Cookie。

一句话：**`localStorage` 的代价在「读写那一刻」，Cookie 的代价在「每一次请求」。**

### 8.3 为什么我的 Cookie 在 `document.cookie` 里读不到？

大概率该 Cookie 设了 `HttpOnly`，这是**设计如此**——`HttpOnly` 正是为了禁止 JS 读取、防止 XSS 窃取。

### 8.4 为什么「复制标签页」后 `sessionStorage` 也被复制了？

复制标签页（`Duplicate Tab`）会克隆原页面的会话，因此 `sessionStorage` 也被复制一份，但两者此后**相互独立**，互不影响。而新开标签页则不会继承。

### 8.5 为什么设置了 `SameSite=None` 却还是不带 Cookie？

`SameSite=None` 必须**同时满足 `Secure`**，否则浏览器直接丢弃这条 Cookie。另外跨站 iframe 场景下，如果请求是「跨站且非顶层导航」，Chrome 还需要第三方 Cookie 未被用户策略禁用——现在更稳的做法是给 Cookie 加 `Partitioned`（按顶级站点隔离），而不是依赖无隔离的第三方 Cookie。

### 8.6 `IndexedDB.open()` 升级版本后卡住不回调，怎么回事？

典型的**多标签页版本冲突**：旧标签页仍持有该库的连接，新标签页请求更高版本时，旧连接必须关闭才能升级，否则新请求会一直停在 `onblocked`。修法是让旧页面监听 `db.onversionchange` 并主动 `db.close()`，同时提示用户刷新：

```javascript
db.onversionchange = () => {
  db.close()
  alert('应用已更新，请刷新页面') // 否则新页面永远打不开库
}
```

### 8.7 无痕模式（隐私模式）下这些存储还能用吗？

- `localStorage` / `sessionStorage`：多数浏览器**可用**，但要当作「关闭窗口即清空」来设计。
- `IndexedDB` / `Cache Storage`：同样可用但会在会话结束时清掉，且配额远小于正常模式。
- Safari 的 ITP 还会主动清理**跨站**存储。

所以别把「存储一定还在」当前提，读取失败或为空时要能兜底重建；`navigator.storage.persist()`（见 [常用浏览器 API](/networkAndBrowsers/browser/browserApis)）在无痕模式下基本不会授予。

### 8.8 为什么 Cache Storage 里明明缓存了，页面拿到的还是旧内容？

因为缓存**不会自动失效**——Service Worker 的 fetch 事件里命中缓存就直接返回，服务端更新了也感知不到。标准做法是**给缓存名带版本号**，在 `activate` 阶段清掉旧版本：

```javascript
const CACHE = 'app-v2' // 发版时改这里

// activate 阶段清理所有非当前版本的缓存
const keys = await caches.keys()
await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
```

对内容会变的接口，改用「网络优先、失败回退缓存」策略，而不是无脑缓存优先。
