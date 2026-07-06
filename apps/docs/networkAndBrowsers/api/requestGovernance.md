# 请求取消、重试、幂等与并发控制

前端请求治理的核心目标不是“**把请求发出去**”，而是在面对**极度不可靠的物理网络、用户不可预测的连续交互、以及服务端严苛的限流策略**时，让应用的网络行为保持**可控、可恢复、可解释**。

## 1. 请求取消 (Cancellation)

请求取消主要用于处理路由跳转、组件卸载、频繁搜索输入等场景。其核心价值在于**阻断过期回调的执行**，避免“**竞态条件**”导致旧数据覆盖新状态，同时释放浏览器的并发连接数。

### 1.1 现代标准：`AbortController`

在 Axios 旧版本中常使用 `CancelToken`，但在现代 Fetch API 和 Axios (v0.22+) 中，`AbortController` 已成为绝对的规范标准。

```javascript
// 在 React Hooks / Vue Composition API 中的典型防御性写法
let currentController

async function fetchSearchResults(keyword) {
  // 1. 如果上一个请求还在 pending，立即将其绞杀
  if (currentController) {
    currentController.abort()
  }

  // 2. 签发新的控制令牌
  currentController = new AbortController()

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
      signal: currentController.signal,
    })
    return await res.json()
  } catch (error) {
    // 3. 必须精准拦截 AbortError，它不是真正的业务异常
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('请求被业务主动拦截，忽略')
      return null
    }
    // 其他网络或业务错误继续向上抛出
    throw error
  }
}
```

### 1.2 取消的本质：客户端单方面的“**挂断**”

> **高危认知盲区**：前端调用 `.abort()` 仅仅是关闭了客户端接收响应的套接字句柄，**服务端的计算或数据库写入通常不会因此停止**。
> 对于 `POST`、`PUT` 等写操作，绝不能指望通过“**取消请求**”来撤销操作。写操作的安全性必须由“**幂等机制**”来保障。

## 2. 请求重试 (Retry Strategy)

重试用于应对 502/503/504 等网关瞬时错误、DNS 解析超时或移动端网络切换引起的断流。

### 2.1 读写隔离：重试的红线法则

盲目的全局拦截器自动重试，是引发服务端**雪崩效应 (Thundering Herd)** 的元凶。

| HTTP 动作             | 自动重试策略              | 核心依据                                               |
| --------------------- | ------------------------- | ------------------------------------------------------ |
| **`GET` / `HEAD`**    | ✅ 推荐开启 (最多 2-3 次) | 语义规定必须安全且幂等，不改变服务器状态。             |
| **`PUT` / `DELETE`**  | ⚠️ 谨慎开启               | 语义幂等（多次覆盖结果一致），但需防范后端的非标实现。 |
| **`POST` (无幂等键)** | ❌ 绝对禁止               | 可能导致重复扣款、重复发帖等致命业务灾难。             |
| **`POST` (有幂等键)** | ✅ 可以开启               | 服务端具备识别重放攻击和重复提交的防线。               |

### 2.2 指数退避与全抖动

当服务端过载时，如果十万个客户端同时在 1 秒后重试，服务端会瞬间再次宕机。必须引入**指数递增的延迟**和**随机抖动**，打散请求洪峰。

```javascript
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function fetchWithRetry(
  requestFn,
  { maxAttempts = 3, baseDelay = 300 } = {},
) {
  let lastError

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      // 拦截过滤：只重试特定的状态码 (如 429 限流, 503 不可用, 或网络断开)
      const status = error.response?.status
      if (status !== 429 && status !== 503 && status !== 504) {
        throw error // 非临时性错误 (如 400, 401, 500) 立即熔断放弃
      }

      // 核心算法：2^attempt * baseDelay + Jitter(0~200ms)
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200
      console.warn(
        `请求失败，${delay.toFixed(0)}ms 后进行第 ${attempt + 1} 次重试...`,
      )

      await sleep(delay)
    }
  }
  throw lastError // 耗尽次数，抛出最终异常
}
```

## 3. 幂等性保障 (Idempotency)

幂等（Idempotency）是分布式系统的基石：**无论该请求被执行多少次，系统状态和返回结果都与只执行一次完全相同。**

### 3.1 前端防抖 ≠ 服务端幂等

前端的“**按钮置灰（Disable）**”或“**防抖节流（Debounce/Throttle）**”只是**防君子不防小人**的体验优化。面对网络超时导致的自动重试、用户的恶意抓包重放，只有服务端幂等能彻底兜底。

### 3.2 幂等键协议 (Idempotency-Key)

在电商下单、支付扣款等极高敏感场景，前端应在发起 `POST` 动作前，主动生成全局唯一的 UUID 作为幂等凭证。

```http
POST /api/v1/payments
Idempotency-Key: a3b9-4d8e-88fc-11e2
Content-Type: application/json

{ "order_id": "8848", "amount": 100 }

```

**服务端处理逻辑约束：**

1. 拦截该 Key，尝试去 Redis 查找。
2. 若不存在，加锁并执行支付，执行完毕将结果存入 Redis，Key 为该 UUID。
3. 若存在且状态为“**处理中**”，阻塞请求并等待结果，或直接返回 409 冲突。
4. 若存在且状态为“**已完成**”，**不执行业务逻辑，直接将 Redis 中缓存的上一次成功结果原样返回**给前端。

## 4. 并发控制与竞态治理 (Concurrency Control)

并发控制用于防止瞬间发出的海量请求打爆浏览器的 TCP 连接池（同一域名通常限制 6 个）或压垮后端服务。

### 4.1 异步任务并发池 (Promise Pool)

经典场景：前端需要批量上传 50 张高清图片，或批量拉取 100 个用户的详情。

```javascript
/**
 * 限制并发的 Promise 执行器
 * @param {Array} tasks - 返回 Promise 的工厂函数数组
 * @param {number} limit - 最大并发数
 */
async function runWithConcurrencyLimit(tasks, limit) {
  const results = []
  const executing = new Set()

  for (const task of tasks) {
    // 将函数包装为 Promise
    const p = Promise.resolve().then(task)
    results.push(p)
    executing.add(p)

    // 任务执行完毕后，将其从执行队列中移除
    const clean = () => executing.delete(p)
    p.then(clean).catch(clean)

    // 核心阻塞逻辑：如果当前执行池已满，利用 Promise.race 等待最快的一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  // 等待所有任务彻底结束，推荐使用 allSettled 避免单点失败导致全盘崩溃
  return Promise.allSettled(results)
}
```

### 4.2 竞态废弃 (Race Condition & Latest Only)

在快速筛选、Tab 切换时，旧请求耗时可能大于新请求，导致**后发先至**的反直觉 Bug。
除了使用 `AbortController` 斩断旧请求，在数据状态层也必须引入**版本号/时序锁**。

```javascript
let currentRequestId = 0 // 局部单调递增时序锁

async function handleTabChange(tabId) {
  const reqId = ++currentRequestId

  showLoading()
  const data = await fetchCategoryData(tabId)

  // 核心校验：如果返回时，全局时序锁已经被后续操作更新，则彻底丢弃这批脏数据
  if (reqId !== currentRequestId) {
    console.warn('捕获到竞态废弃响应，已被拦截')
    return
  }

  render(data)
}
```

### 4.3 乐观锁并发 (Optimistic Concurrency Control)

在多人协同编辑或库存扣减的场景中，防止 A 的提交无意间覆盖了 B 的最新修改。

- **下发标识**：获取表单时，服务端下发当前数据版本号（如 `ETag` 或 `version: 3`）。
- **带参比对**：前端在保存时，将版本号通过 Header (`If-Match: "3"`) 或 Body 发回。
- **服务端校验**：服务端比对数据库最新版本，如果已经是 `4`，则拦截操作，返回 `412 Precondition Failed`。
- **前端降级**：前端捕获 `412`，弹出提示：“数据已被他人修改，请刷新后重试”。

:::details

```http request
PATCH /api/articles/1
If-Match: "article-version-7"
```

:::

## 5. 请求治理清单

- 查询请求：可取消、可重试、可缓存。
- 写入请求：默认不自动重试，除非有幂等键。
- 页面切换：取消无用请求，避免过期响应更新已卸载组件。
- 搜索输入：防抖 + 取消 + 只接收最后一次响应。
- 批量任务：限制并发，展示部分失败和重试入口。
- 关键业务：服务端幂等、事务、状态机兜底。

## 6. 常见面试深度剖析

### 6.1 `Promise.all` 和并发控制函数有什么本质区别？

`Promise.all(tasks)` 是一次性将所有任务同时推入执行栈，它**无法控制并发数**，如果传 1000 个请求，就会瞬间向浏览器发起 1000 次连接申请，极易触发网络阻塞。而并发控制函数使用队列和池化的思想，确保在途请求始终不超过设定阈值，平滑地泄洪。

### 6.2 为什么服务端已经实现了幂等，前端还需要做防重复点击？

**防御深度不同。**
前端防抖和置灰是第一道防线，它能挡住 90% 的普通用户的误操作，**极大地减轻了服务端的无效流量压力**，并提供了即时的 UI 反馈。服务端幂等是最后一道防线，用于应对重试机制、网络延迟导致的重放和恶意脚本攻击，两者缺一不可。
