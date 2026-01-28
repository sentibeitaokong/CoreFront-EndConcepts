# HTML Web Storage (Web 存储)

HTML5 提供了两种在客户端存储数据的机制，旨在取代传统的 Cookies 存储方案（对于非敏感数据）。它们是：
1.  **`localStorage`**: **永久存储**。除非用户手动清理或代码删除，否则数据永远存在。
2.  **`sessionStorage`**: **会话存储**。浏览器窗口（Tab）关闭后，数据自动销毁。

## 1. 核心 API 速查

`localStorage` 和 `sessionStorage` 拥有**完全相同**的方法和属性。

| 方法/属性 | 语法示例 | 描述 |
| :--- | :--- | :--- |
| **`setItem()`** | `localStorage.setItem('key', 'value')` | **存入数据**。如果 key 已存在，则更新 value。 |
| **`getItem()`** | `localStorage.getItem('key')` | **读取数据**。如果 key 不存在，返回 `null`。 |
| **`removeItem()`**| `localStorage.removeItem('key')` | **删除数据**。删除指定的 key。 |
| **`clear()`** | `localStorage.clear()` | **清空所有**。删除当前域名下该存储对象的所有数据。 |
| **`key()`** | `localStorage.key(0)` | **按索引取 Key**。获取第 n 个键名（不常用，用于遍历）。 |
| **`length`** | `localStorage.length` | **数据条数**。返回当前存储了多少个键值对。 |

**简便写法 (不推荐，但可用)：**
Web Storage 对象可以像普通 JS 对象一样操作（但不建议这样用，因为可能与原生原型方法冲突）。
```js
localStorage.username = "John"; // 存
console.log(localStorage.username); // 取
delete localStorage.username; // 删
```

## 2. 详细使用指南

### 2.1 存储数据 (String Only!)
**最核心的坑点**：Web Storage **只能存储字符串**。
如果你直接存对象或数组，它会强行调用 `.toString()`，变成 `"[object Object]"`，导致数据丢失。

**✅ 正确做法：使用 JSON 序列化**
```js
const user = { name: "张三", age: 18 };

// 存：对象 -> JSON 字符串
localStorage.setItem('userInfo', JSON.stringify(user));

// 取：JSON 字符串 -> 对象
const storedData = localStorage.getItem('userInfo');
if (storedData) {
  const userData = JSON.parse(storedData);
  console.log(userData.name); // "张三"
}
```

### 2.2 localStorage vs sessionStorage

| 特性 | localStorage | sessionStorage |
| :--- | :--- | :--- |
| **生命周期** | **永久有效**。关闭浏览器、重启电脑都在。 | **会话级**。**关闭标签页**就没了。刷新页面还在。 |
| **作用域** | **同源窗口共享**。只要是同一个域名，开多少个 Tab 都能读到同一份数据。 | **单窗口独享**。Tab A 和 Tab B 即使是同域，数据也是**隔离**的（互不可见）。 |
| **典型场景** | 长期登录 Token、用户偏好设置（主题色）、购物车（未登录）。 | 表单分步填写临时数据、一次性敏感数据。 |

### 2.3 `storage` 事件 (多窗口同步)
当 `localStorage` 的数据在**其他标签页**被修改时，当前标签页会触发 `storage` 事件。
*   *注意：在当前修改数据的页面，不会触发自己的 storage 事件。*

```js
// 监听数据变化
window.addEventListener('storage', (event) => {
  console.log("哪个Key变了:", event.key);
  console.log("旧值:", event.oldValue);
  console.log("新值:", event.newValue);
  console.log("触发变化的URL:", event.url);
});
```
**应用场景**：用户在 Tab A 退出了登录，Tab B 需要自动跳转到登录页或刷新状态。

## 3. 常见问题 (FAQ) 与 避坑指南

### Q1: Web Storage 有多大容量限制？
通常是 **5MB** (每个域名)。
*   相比之下，Cookies 只有 4KB。
*   注意：这是 UTF-16 字符数限制，不是字节数。如果存纯中文，实际能存的字符数会减半。
*   超过限制时，`setItem` 会抛出 `QuotaExceededError` 异常。**建议在 setItem 外面包一层 try-catch。**

### Q2: 为什么 `sessionStorage` 在新标签页里是空的？
很多开发者误以为 `sessionStorage` 像 Cookie 一样在同域下共享。
**错！** `sessionStorage` 是绑定到 **Window (标签页)** 的。
*   你在 Tab A 存了数据。
*   你在浏览器里新建 Tab B 打开同一个网址 -> **数据为空**。
*   *特例*：如果你在 Tab A 通过 `window.open` 或右键“在新标签页打开”链接，Tab B 会**复制**一份 Tab A 的 sessionStorage（之后两者独立）。

### Q3: 如何给 localStorage 设置过期时间？
原生 API 不支持过期时间（它是永久的）。必须手动封装。
**实现思路**：存数据时，把当前时间戳也存进去。取数据时，判断时间是否超时。

```js
const myStorage = {
  set(key, value, ttl) { // ttl: 有效期(毫秒)
    const data = {
      value: value,
      expires: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(data));
  },
  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() > data.expires) {
      localStorage.removeItem(key); // 过期了，删掉
      return null;
    }
    return data.value;
  }
};
```

### Q4: 隐私模式 (Incognito) 下能用吗？
*   在**隐身模式**下，`localStorage` 和 `sessionStorage` 依然**可以使用**。
*   但是，当用户**关闭隐身窗口**时，所有存储的数据（包括 localStorage）都会被**立即清除**。
*   *注：极少数旧版浏览器（如老 Safari）在隐身模式下调用 `setItem` 会直接报错，建议 try-catch。*

### Q5: Web Storage 和 Cookie 有什么区别？(面试必问)
1.  **大小**: Storage 5MB vs Cookie 4KB。
2.  **传输**: Cookie 会自动随每个 HTTP 请求**发送到服务器**（浪费带宽）；Storage 数据仅存在浏览器本地，**不与服务器通信**。
3.  **操作**: Storage API 简单 (`setItem`)；Cookie 原生 API 很难用（需要解析字符串 `document.cookie`）。

### Q6: 为什么 `localStorage` 存布尔值 `false` 取出来变成了 `"false"` (字符串)？
因为 Web Storage 只能存字符串。
```js
localStorage.setItem('isLogin', false);
const isLogin = localStorage.getItem('isLogin'); // 结果是字符串 "false"
if (isLogin) { ... } // 字符串 "false" 在 if 中是 true！这是惊天大坑！
```
**解法**：`JSON.parse(localStorage.getItem('isLogin'))` 或者手动判断字符串 `'true'`.