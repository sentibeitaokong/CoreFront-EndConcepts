# 请求取消、重试、幂等与并发控制

前端请求治理的核心目标不是“**把请求发出去**”，而是在面对**极度不可靠的物理网络、用户不可预测的连续交互、以及服务端严苛的限流策略**时，让应用的网络行为保持**可控、可恢复、可解释**。

**一句话理解**：**网络不可靠，而业务要求正确。** 取消是“**用户不等了**”的止损，重试是“**瞬时故障**”的补偿，幂等是“**补偿不闯祸**”的承诺，并发控制则保证前面三件事不会把本地与服务端一起拖垮。

> [!TIP] 相关阅读
> 协议层面对“**幂等 / 安全方法**”的规定见 [HTTP 协议](/networkAndBrowsers/http/http)；请求 API 本身的能力边界（`signal`、无超时、流式 body）见 [fetch](/networkAndBrowsers/api/fetch)。

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

### 1.3 超时本质上也是取消：别把 `TimeoutError` 漏成未知异常

`AbortSignal.timeout(ms)` 到点后会替你调一次 `abort()`，所以**超时也是一种取消**。但它拒绝时的 `reason` 是 `TimeoutError`，**不是 `AbortError`** 。

两者的处理策略恰好相反：**用户或路由主动取消要静默忽略、绝不重试**；**超时属于「可以再试一次」的瞬时故障**（交给下文的重试函数）。所以要在同一个 `catch` 里把几种取消源分开：

[width(32,37,31)]

| 取消源                    | `error.name`（或 `error.code`） | 推荐处理                       |
| ------------------------- | ------------------------------- | ------------------------------ |
| 手动 `abort()`            | `AbortError`                    | 静默忽略，**不要重试**         |
| `AbortSignal.timeout(ms)` | `TimeoutError`                  | 可重试，或降级到缓存           |
| axios 旧版 `CancelToken`  | `ERR_CANCELED`（`error.code`）  | 静默忽略，与 `AbortError` 同级 |

```javascript
async function request(url, signal, timeoutMs = 3000) {
  // 取消源合并：外部 signal（用户 / 路由）有就带上，超时信号始终在场
  const signals = signal
    ? [signal, AbortSignal.timeout(timeoutMs)]
    : [AbortSignal.timeout(timeoutMs)]

  try {
    const res = await fetch(url, { signal: AbortSignal.any(signals) })
    return await res.json()
  } catch (error) {
    // 超时：可以再试一次（交给下文的重试函数）
    if (error.name === 'TimeoutError') throw new Error('请求超时，请稍后重试')
    // 用户取消 / 路由跳转：静默忽略，且不要重试
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      return null
    }
    throw error
  }
}
```

### 1.4 取消的粒度：把一批请求绑到一个「取消域」上

`currentController` 适合「一个输入框对应一个请求」；但一个弹窗、一个页面往往同时挂着五六个请求，逐个记 controller 一定会漏。可以把**作用域内发出的所有请求**收进一个取消域，关闭或卸载时一次性全取消：

```javascript
// 取消域：作用域内发出的请求可以被一次性全部取消
function createCancelScope() {
  const controllers = new Set()

  return {
    async request(url, init = {}) {
      const controller = new AbortController()
      controllers.add(controller)

      try {
        const res = await fetch(url, {
          ...init,
          // 外部还传了 signal 就合并，保证「谁能取消」都不丢
          signal: init.signal
            ? AbortSignal.any([init.signal, controller.signal])
            : controller.signal,
        })
        return await res.json()
      } finally {
        controllers.delete(controller) // 已结束的请求不再持有，避免集合越滚越大
      }
    },

    cancelAll() {
      for (const controller of controllers) controller.abort()
      controllers.clear()
    },
  }
}
```

三种典型的取消域边界：**路由**（离开即取消）、**组件**（卸载即取消，React 在 `useEffect` 的 cleanup、Vue 在 `onUnmounted` 里调 `cancelAll()`）、**交互**（新输入、新 Tab 立即取消上一批）。`cancelAll()` 本身也是幂等的：重复调用、或对已经结束（已从集合中移除）的请求再调一次，都没有副作用。

> [!NOTE] 高频场景
> 搜索联想、Tab / 筛选项切换、路由跳转、组件卸载。落地时要同时处理两件事：**竞态**（旧响应后到，覆盖了新数据）与**卸载后更新状态**（请求回来了，但组件已经没了）。

## 2. 请求重试 (Retry Strategy)

重试用于应对 502/503/504 等网关瞬时错误、DNS 解析超时或移动端网络切换引起的断流。

### 2.1 读写隔离：重试的红线法则

盲目的全局拦截器自动重试，是引发服务端**雪崩效应 (Thundering Herd)** 的元凶。

[width(21,29,50)]

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

### 2.3 先看服务端的 `Retry-After`

`429` / `503` 的响应经常带 `Retry-After`：服务端在明确告诉你「多久之后再来」。这比自己猜的退避更可靠 —— 有它就用它，没有才退回指数退避 + 抖动：

```javascript
// 服务端给了 Retry-After 就听它的，否则退回指数退避 + 抖动
function retryDelay(error, attempt, baseDelay = 300) {
  const header = error.response?.headers?.get?.('retry-after')

  if (header) {
    const seconds = Number(header)
    const ms = Number.isInteger(seconds)
      ? seconds * 1000 // 纯数字：秒数
      : Date.parse(header) - Date.now() // 另一种格式是 HTTP 日期
    if (Number.isFinite(ms) && ms > 0) return ms
  }

  return baseDelay * 2 ** attempt + Math.random() * 200
}
```

但 `Retry-After` 也要**受重试预算约束**：它写 `120` 秒时，傻等两分钟和直接失败一次没有区别 —— 超出总预算（比如 10 秒）就立刻失败，把「稍后重试」交还给用户。

### 2.4 重试的五条红线

[width(24,31,45)]

| 红线                     | 原因                                               | 落地写法                                        |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| 已取消的请求不重试       | 用户或路由已经放弃，重试等于把它拉回执行           | 拦截器最前面排除 `AbortError` 与 `ERR_CANCELED` |
| 没有幂等键的写操作不重试 | 重试就是第二次业务动作（重复扣款）                 | 见 2.1 与「幂等性保障」一节                     |
| 确定性失败不重试         | `400` / `401` / `403` / `422` 重试多少次结果都一样 | 只放行 `408` / `429` / `502` / `503` / `504`    |
| 不设上限与总预算就不重试 | 无限重试会卡死 UI、把网关打垮                      | 上限 2~3 次 + 总时长预算（如 10 秒）            |
| 重试过程不告知用户       | 用户只看到「卡住」，不知道正在重试                 | 显示「正在重试 (2/3)」，超预算后给手动重试入口  |

> [!IMPORTANT] 写在拦截器里最容易漏掉的是第一条
> **用户已经取消的请求，又被拦截器重试了一遍** —— 现象是「点了取消，请求还在飞」，排查时表现为取消不生效。拦截器必须把 `AbortError` / `ERR_CANCELED` 放在最前面排除。

> [!NOTE] 高频场景
> 移动端弱网、网关 `502` / `503`、DNS 抖动。生产里的三条纪律：只重试**可重试的状态码**、只重试**读操作**（写操作要有幂等键）、重试间隔必须带**退避 + 抖动**（否则弱网恢复的瞬间所有客户端同时重试，把服务端二次打垮，即惊群）。

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

### 3.3 幂等的三条实现路径

幂等键不是唯一手段，生产系统通常是几层叠加：

[width(33,35,32)]

| 路径                            | 做法                                                  | 挡得住 / 挡不住                                      |
| ------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| **幂等键**（`Idempotency-Key`） | 前端为一次业务意图生成 UUID，服务端用它加锁并缓存结果 | 挡重试、挡抓包重放；挡不住「换个键再点一次」         |
| **状态机前置校验**              | 只允许合法状态转移，如订单「待支付 → 已支付」         | 挡重复支付；并发下仍需行锁或乐观锁                   |
| **数据库唯一约束**              | 唯一索引兜底（订单号、业务流水号）                    | 最后一道防线；冲突要转成友好提示，不能直接返回 `500` |
| **前端置灰 / 防抖**             | 体验层拦截                                            | 只挡误操作                                           |

### 3.4 幂等键的并发窗口与生命周期

前端最容易忽略的不是「要不要加键」，而是**键的生命周期**：

- **同一个键并发到达**：服务端只有三种正确姿势 —— 阻塞等前一个的结果、直接返回 `409`、或返回「处理中」让前端轮询。**绝不能让两条请求同时落库**。
- **有效期与「同键不同参」**：键通常存 24 小时。用户改了金额或数量后**复用旧键**，会直接命中上一次的缓存结果 —— 表现为「钱付对了，商品错了」，是最隐蔽的一类事故。
- **一次业务意图 = 一个键**：点「提交订单」时生成键，自动重试必须复用同一个键；用户改了购物车重新下单，则生成新键。

```javascript
// 一次业务意图 = 一个幂等键：重试复用，重新下单换新
function createPaymentIntent({ orderId, amount }) {
  return {
    key: crypto.randomUUID(), // 需要安全上下文（https / localhost）
    body: { orderId, amount },
  }
}
```

> [!NOTE] 高频场景
> 下单、支付、退款、发帖这类“**重复一次就出事**”的接口。落地要点：幂等键由**前端生成**并在整条链路透传；服务端用 Redis 做「加锁 + 结果缓存」；**同一幂等键并发进来时，要么阻塞等待、要么直接返回 `409`**，绝不能让两个请求同时落库。

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
- **前端降级**：前端捕获 `412`，弹出提示：“**数据已被他人修改，请刷新后重试**”。

:::details

```http request
PATCH /api/articles/1
If-Match: "article-version-7"
```

:::

### 4.4 请求去重：同时刻的相同请求只发一次

并发控制解决的是「一次发太多」，但很多时候根因是**同一份数据被多个组件同时各要了一次**。in-flight 去重把同时刻的相同请求合并成一次网络往返：

```javascript
// in-flight 去重：key 相同的并发请求合并成一次网络往返
const inflight = new Map()

async function dedupedFetch(key, requestFn) {
  if (inflight.has(key)) return inflight.get(key) // 后来者直接搭车

  const promise = requestFn().finally(() => inflight.delete(key)) // 成败都要清理
  inflight.set(key, promise)
  return promise
}

// 三个组件同时要同一个用户详情 → 只发一次 GET /api/users/123
const [a, b, c] = await Promise.all([
  dedupedFetch('/api/users/123', () =>
    fetch('/api/users/123').then(r => r.json()),
  ),
  dedupedFetch('/api/users/123', () =>
    fetch('/api/users/123').then(r => r.json()),
  ),
  dedupedFetch('/api/users/123', () =>
    fetch('/api/users/123').then(r => r.json()),
  ),
])
```

### 4.5 优先级：别让后台预取挡住用户正在等的请求

浏览器**同域名 6 条连接是整个页面共享的**。长列表预取、图片预热、埋点上报一旦占满，首屏接口和点击后的请求只能排队 —— 现象是「页面能开，但点了没反应」。

三个成本很低的做法：**分池**（预取、埋点单独走一个并发池，甚至单独域名）、**让路**（用户触发的请求插到预取之前，预取任务主动退让）、**降级**（页面不可见时暂停预取，`document.visibilityState` 回到 `visible` 再继续）。

### 4.6 竞态治理的三个武器

[width(34,28,38)]

| 武器                         | 解决什么                     | 代价与边界                                   |
| ---------------------------- | ---------------------------- | -------------------------------------------- |
| `AbortController` 取消旧请求 | 省流量、省连接、省服务端算力 | 服务端可能仍在执行，写操作无法撤销           |
| 时序锁 / 版本号丢弃脏响应    | 兜住「取消晚了」的响应       | 请求已经发出，流量省不掉，只保证状态不被污染 |
| in-flight 去重               | 合并同时刻的重复请求         | 只覆盖并发窗口，请求返回后失效               |

一句话取舍：**能取消就取消（省资源），取消不了就丢弃（保正确），并发相同就合并（省请求）**。

> [!NOTE] 高频场景
> 批量上传图片、批量导出、长列表预取。要记住两个上限：**浏览器同域名 6 条连接**（不控并发会让普通接口排在批量任务后面，整页发涩）与**服务端的限流阈值**（`429` 往往就是被自己的批量请求触发的）。并发池还必须能返回**部分失败**并给出重试入口。

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

### 6.3 `AbortController` 为什么说是「一次性」的？

一次性的不是 controller 本身，而是**它签发的 signal**：`abort()` 之后 `signal.aborted` 永久为 `true`，再拿它去 `fetch` 会被立即拒绝。所以要取消下一批请求，必须新建 `AbortController`（取消域里每个请求都新建 controller 就是这个原因）。反过来，**一个 signal 可以同时传给多个请求**（批量取消），也可能被多方共享；需要「多个取消源合成一个」时用 `AbortSignal.any`，而不是复用已经 abort 过的旧 controller。

### 6.4 自动重试和用户手动点「重试」会撞车吗？

会，所以两者必须一起设计：**自动重试期间，按钮要禁用或显示「正在重试 (2/3)」**，否则用户手点一次加上拦截器自动重试一次，就是两次真实提交；**写操作的重试必须复用同一个幂等键**，否则「重试」在一次业务语义上就是第二次下单；**自动重试耗尽后要把手动重试入口交还给用户**，而不是让他只能刷新页面。

### 6.5 并发池设多大合适？

取两个上限里更小的那个：**客户端上限**（同域名 6 条连接，还要给普通接口留余量，所以批量任务一般 4~6，且与首屏请求分池）、**服务端上限**（限流阈值 —— 自己发出的 `429` 就是它）。另外三条工程约束：并发池要能**分优先级**、要**返回部分失败**而不是一个 reject 全丢、失败项要带**重试入口**。

### 6.6 幂等键放在 Header 还是 Body？

都可以，但建议放 Header：`Idempotency-Key` 不污染业务字段，网关和中间件可以统一拦截，也是 Stripe 等开放平台的通行做法；放 Body 则要服务端在业务层自己解析。真正决定成败的是三条纪律，而不是位置：**键由前端生成且全局唯一**、**同一业务意图复用同一个键**、**服务端拿它做加锁与结果缓存、冲突时明确返回**。

### 6.7 「乐观更新」能替代幂等吗？

不能，两者不在一个层次：乐观更新解决**体验**（先渲染、失败再回滚），幂等解决**状态正确性**。而且乐观更新会让重复提交更隐蔽 —— 在「已渲染、尚未确认」的窗口里，用户完全可能再点一次。所以乐观更新必须配上两样东西才成立：**失败回滚**与**幂等键**。
