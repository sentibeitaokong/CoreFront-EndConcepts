# 前端缓存策略：HTTP Cache、Memory Cache、IndexedDB、SWR

前端缓存并非单一的技术节点，而是一套贯穿**网络层、内存层、持久层与架构层**的多维状态治理体系。其核心挑战永远是计算机科学的两大难题之一：**缓存失效（Cache Invalidation）**。现代前端工程不仅追求“**加载快**”，更追求“**弱网可用**”、“**多端状态同步**”以及“**UI 响应的无缝衔接**”。

## 1. 缓存分层架构矩阵

| 层级                              | 存储位置         | 生命周期                  | 容量限制          | 适用载荷                                  | 核心优势与致命风险                                                                            |
| --------------------------------- | ---------------- | ------------------------- | ----------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| **HTTP Cache**                    | 浏览器底层       | 强依赖 `Cache-Control`    | 动态分配          | 静态资源 (JS/CSS/Image)、纯读 API         | **优势**：零 JS 成本，CDN 完美契合。<br/>**风险**：配置错误导致线上发版事故。                 |
| **Service Worker (CacheStorage)** | 独立 Worker 线程 | 永久 (需手动清理)         | 极大约 50MB+      | 离线 HTML、构建产物、API 拦截             | **优势**：离线可用，完全接管网络请求。<br/>**风险**：接管范围过大易导致“**永远更新不下来**”。 |
| **Memory Cache**                  | JS 堆内存        | 随 Tab 页签销毁           | 极小 (受 V8 限制) | 请求 Promise (防重)、全局字典、状态库     | **优势**：I/O 速度极快，读取无延迟。<br/>**风险**：SPA 长期运行易内存泄漏，刷新即丢。         |
| **IndexedDB**                     | 磁盘数据库       | 永久 (清缓存/手动卸载)    | 极大 (GB级)       | 大数据列表、富文本草稿、Blob 文件         | **优势**：支持异步事务、游标索引。<br/>**风险**：API 反人类，Schema 升级/迁移极易报错。       |
| **SWR (策略层)**                  | 内存 + 持久层    | 由库调度 (如 `staleTime`) | 动态控制          | 极度依赖实时性的服务端状态 (Server State) | **优势**：极致的 UX，消灭白屏与 Loading。<br/>**风险**：脏数据闪烁，竞态条件治理成本高。      |

## 2. HTTP Cache

HTTP 缓存是性能优化的第一道门槛，完全受控于服务端响应头，但前端在打包配置和运维部署中起决定性作用。

### 2.1 静态资源：强缓存与 Hash 命名的终极解法

```http
Cache-Control: public, max-age=31536000, immutable

```

- **深度解析**：前端打包工具（Webpack/Vite）基于文件内容生成 Hash（如 `app.8f3a91.js`）。只要内容不变，URL 就不变，浏览器直接读取本地磁盘缓存。`immutable` 属性更是明确告诉浏览器（主要针对 Safari/Firefox）：即使在有效期内用户按了刷新，也**绝对不要**发起协商请求。

### 2.2 宿主 HTML：协商缓存的入口守护

```http
Cache-Control: no-cache

```

- **深度解析**：`no-cache` **绝不是“不缓存”**，而是“**每次使用前必须通过 `ETag` 或 `Last-Modified` 向服务器验证**”。HTML 文件绝对不能走强缓存，否则哪怕你发布了带有新 Hash 的 JS，用户也永远加载旧 HTML 从而请求旧 JS。
- _注：真正完全禁止缓存的指令是 `Cache-Control: no-store`，常用于极其敏感的金融数据接口。_

### 2.3 `Vary` 头的隐形陷阱

当使用 HTTP 缓存存储 API 响应时，务必注意 `Vary: Accept-Encoding, Origin`,如果不配置 `Vary: Origin`，跨域资源共享（CORS）时极易因为命中其他域的缓存而导致 CORS 拦截报错。

```http request
//不能只看 URL！你必须比对发起请求时的 Accept-Encoding 和 Origin 这两个字段。
Vary: Accept-Encoding, Origin
```

## 3. Memory Cache

内存缓存不仅是存数据，更高级的用法是**控制并发和消除重复计算**。

### 3.1 终极防线：请求防重 (Request Deduping)

当一个页面有 5 个组件同时需要加载 `字典配置` 时，如果不加控制，会瞬间发出 5 个相同的 HTTP 请求。通过缓存 Promise 可以完美解决：

```javascript
const pendingRequests = new Map()

async function fetchDictOnce(type) {
  // 1. 如果有正在进行中的相同请求，直接返回同一个 Promise
  if (pendingRequests.has(type)) {
    return pendingRequests.get(type)
  }

  // 2. 否则发起真实请求，并将 Promise 存入 Map
  const promise = fetch(`/api/dict/${type}`)
    .then(res => res.json())
    .finally(() => {
      // 3. 关键：无论成功失败，结束后必须释放内存引用，防止内存泄漏
      // 下次再调时才会发起新请求
      pendingRequests.delete(type)
    })

  pendingRequests.set(type, promise)
  return promise
}
```

### 3.2 适合缓存什么？

- 字典数据、枚举配置。
- 当前页面列表查询结果。
- 用户权限、菜单、特性开关。
- 图片尺寸、计算结果、格式化结果。

### 3.3 LRU缓存淘汰机制

在重型 SPA 中，单纯使用 `Map` 会导致内存无限膨胀。企业级应用必须引入 LRU 算法：设定容量上限（如 100 条），当缓存满时，自动删除最久未被访问的数据。

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity // 最大容量 (对应 KeepAlive 的 max)
    this.cache = new Map() // 缓存字典。Key=组件的唯一标识，Value=组件的VNode
  }

  // 模拟：用户试图打开一个组件
  get(key) {
    if (!this.cache.has(key)) {
      return null // 没缓存过，返回空，让 Vue 去重新创建这个组件
    }

    // 如果缓存里有，拿到这个组件的虚拟节点 (VNode)
    const vnode = this.cache.get(key)

    // 🚨 LRU 的核心动作 1：【刷新鲜度】
    // 既然你刚刚用了它，我就先把它从字典里删掉，然后再重新塞进去。
    // 在 JS 的 Map 中，最新 set 进去的键值对会被排在队伍的最末尾！
    this.cache.delete(key)
    this.cache.set(key, vnode)

    return vnode
  }

  // 模拟：用户刚看完一个新组件，Vue 准备把它塞进内存
  put(key, vnode) {
    // 如果本来就有，直接删掉旧的，为下面重新插到队尾做准备
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 塞入新的组件（由于是最新插入，排在 Map 的最后面）
    this.cache.set(key, vnode)

    // 🚨 LRU 的核心动作 2：【容量超载淘汰】
    // 检查桌子是不是放满了
    if (this.cache.size > this.capacity) {
      // Map.prototype.keys() 会返回一个迭代器，按照插入顺序排列
      // 所以 keys().next().value 永远能拿到队伍最开头、最久没被碰过的那个 key！
      const oldestKey = this.cache.keys().next().value

      // 无情地把它从缓存中抹杀
      this.cache.delete(oldestKey)
      console.log(`容量爆炸！已淘汰最旧的组件: ${oldestKey}`)
    }
  }
}

// --- 测试我们的 LRU 算法 ---
const keepAlive = new LRUCache(3) // 只能存 3 个页面
keepAlive.put('首页', 'VNode_Home')
keepAlive.put('列表页', 'VNode_List')
keepAlive.put('详情页', 'VNode_Detail')

console.log(keepAlive.cache.keys()) // 顺序: [首页, 列表页, 详情页]

// 用户又点回了“首页”！
keepAlive.get('首页')
console.log(keepAlive.cache.keys()) // 顺序被刷新: [列表页, 详情页, 首页]

// 用户点开了一个全新的“设置页”，容量炸了！
keepAlive.put('设置页', 'VNode_Setting')
// 触发淘汰：最久没用的“列表页”被踢出去了！
console.log(keepAlive.cache.keys()) // 结果: [详情页, 首页, 设置页]
```

## 4. IndexedDB 与 CacheStorage

### 4.1 IndexedDB 深度实践

原生 API 基于回调和事件，极度痛苦。生产环境绝对应该使用 `localforage` 或 `idb` 库将其封装为 Promise。

- **业务落地**：企微文档/飞书文档的离线编辑。用户敲击键盘时，数据首先写入 IndexedDB；网络恢复后，利用后台同步队列（Background Sync）将本地差异合并到云端。

### 4.2 CacheStorage (Service Worker)

它不仅用于 PWA，更是前端精细化拦截缓存的利器。配合 `Workbox`，前端可以定义复杂的路由策略：

- **NetworkFirst**：高频变动的数据接口。
- **CacheFirst**：大体积外部字体库、第三方不变 JS 库。
- **StaleWhileRevalidate**：头像、非核心配置接口。

## 5. SWR

SWR 既是一个 HTTP `Cache-Control` 的扩展指令，更是一个被前端社区（React Query, SWR, Vue Query）发扬光大的**数据获取策略**。

### 5.1 核心哲学：先快后新

传统的交互是：点击 -> Loading -> 渲染。这阻断了用户心流。
SWR 的交互是：点击 -> **瞬间显示缓存旧数据** -> 默默发请求 -> 对比差异 -> **局部静默更新**。

### 5.2 复杂场景：乐观更新 (Optimistic Updates)

SWR 库提供的最强杀器。当用户点赞时：

- **阻断默认等待**：不等待服务器响应，立刻在本地缓存中将点赞数 +1 并渲染。
- **发起后台 Mutation**：静默向服务器发送点赞请求。
- **容错回滚**：如果网络请求失败（400/500），自动将本地点赞数 -1 恢复原状，并弹出报错框。

```js
const cache = new Map()

async function swr(key, fetcher, onUpdate) {
  const cached = cache.get(key)

  if (cached) {
    onUpdate(cached)
  }

  const fresh = await fetcher()
  cache.set(key, fresh)
  onUpdate(fresh)

  return fresh
}
```

## 6. 企业级缓存失效与隔离策略

缓存最大的灾难是“**脏数据引发业务故障**”与“**内存无限制膨胀**”。必须建立严格的隔离、清理与前置规范：

| 策略模式                              | 执行逻辑                                                                                       | 适用场景                          | 风险规避与核心收益                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| **主动驱逐 (Mutation Invalidation)**  | 表单提交 (POST/PUT) 成功后，调用 `invalidateQueries('userList')` 强制标记缓存过期。            | 增删改查 (CRUD) 强关联页面。      | **防脏写**：必须精准匹配 Query Key，避免误杀全站缓存导致接口洪峰。                                |
| **租户/用户隔离 (Key Namespace)**     | 将 `[tenantId, userId, resourceId]` 作为复合 Cache Key。                                       | SaaS 系统、多账号切换。           | **极其关键**：若漏掉 userId，A 登出后 B 登录，会瞬间看到 A 的私密缓存数据，引发**严重越权事故**。 |
| **页面可见性验证 (Refetch on Focus)** | 当用户切换 Tab 返回应用，或从后台唤醒 App 时，自动触发后台比对。                               | 股票行情、协作文档、库存状态。    | **防断层**：在长连接断开或移动端锁屏唤醒时，无缝恢复最新状态。                                    |
| **悬停预取 (Hover Prefetching)**      | 当用户鼠标悬停在“下一页”或“详情”按钮上时，提前 300ms 发起请求并存入缓存。                      | 分页列表、高确定性的用户路径。    | **极致体验**：利用人类反应的物理延迟，消除点击后的 Loading 白屏，实现“零延迟”错觉。               |
| **内存垃圾回收 (Garbage Collection)** | 设置 `gcTime`（如 5 分钟）。当使用某缓存的所有组件卸载后，开启倒计时，超时则彻底销毁该内存块。 | 极其庞大的 SPA 应用、富媒体列表。 | **防 OOM**：拒绝把前端当数据库用，规避浏览器 V8 引擎内存泄漏导致的页面崩溃。                      |

## 7. 常见面试深度剖析

### 7.1 Service Worker (Cache Storage) 与 HTTP Cache 的执行优先级是怎样的？

**Service Worker 拥有绝对优先权。**
当浏览器发起一个请求时，完整的穿透模型如下：

- **SW 拦截层**：请求首先被 Service Worker 的 `fetch` 事件拦截。如果在 Cache Storage 中匹配到数据，直接返回，**连 HTTP 缓存模块都不会触发**。
- **HTTP 缓存层**：如果 Service Worker 决定放行（或未命中），请求才会流转到浏览器的 HTTP 缓存模块（检查 `Cache-Control` 的 `max-age` 和强缓存状态）。
- **网络协商层**：如果强缓存失效，浏览器带上 `ETag` / `Last-Modified` 真正发起网络请求，与服务器协商。

### 7.2 SWR 如何解决多组件同时拉取同源数据的竞态问题？

传统的 Redux/Axios 模式下，如果头部导航栏和侧边栏同时在 `onMounted` 发请求获取 `User Profile`，会向服务器发出两次一模一样的 HTTP 请求。
而使用 SWR / TanStack Query 时，底层引擎会利用**单例模式与 Promise 缓存池**进行**去重 (Deduplication)**。
同一时间段内（如 2 秒内），无论多少个组件调用 `useSWR('/api/user')`，只要 Query Key 相同，物理层只会发出 **1 个 HTTP 请求**。响应返回后，底层的发布订阅机制 (Pub/Sub) 会同时通知所有挂载了该 Key 的组件触发 Re-render。

### 7.3 深度拷问：SWR / React Query 中的 `staleTime` 和 `cacheTime` (gcTime) 有什么本质区别？

- **`staleTime` (保鲜期)**：决定了数据什么时候“**变质**”。如果数据在保鲜期内，组件重复挂载或窗口重新聚焦时，**绝对不会**在后台发起新的请求。它控制的是“**要不要发网络请求**”。（默认通常是 0，即永远默认陈旧，永远试图在后台获取最新数据）。
- **`cacheTime` (垃圾回收期)**：决定了数据在内存里“**活多久**”。当且仅当**所有使用该缓存的组件都被卸载（Unmount）后**，计时器才开始运转。时间一到，这块数据就会被当作垃圾从内存中彻底清除。它控制的是“**浏览器的内存水位**”。

### 7.4 如果用户处于断网（离线）状态，Service Worker 和 SWR 会如何发生化学反应？

它们会形成完美的降级互补链路：

- **SWR 发起请求**：SWR 不知道断网，依旧去拉取最新数据。
- **SW 兜底拦截**：Service Worker 拦截到请求，检测到无网络连接（或请求超时），立刻将之前缓存在 Cache Storage 中的**离线备份数据**作为 Response 返回给 SWR。
- **UI 无感渲染**：SWR 拿到数据，以为是服务器给的，正常渲染到页面上。用户依然可以浏览之前看过的文章或列表，完全感知不到断网的发生（前端可辅以“**当前处于离线模式**”的轻提示）。
