# 垃圾回收与内存泄漏

JavaScript 有自动垃圾回收（GC），无需手动 `free`；但不当的引用会让对象无法回收，最终内存泄漏、卡顿甚至崩溃。

**一句话理解**：**「GC 回收『不可达』的对象；内存泄漏的根源，是让该死的对象还留着一条可达引用链。」**

**为什么需要理解它**：

- **长驻页面不刷新**。单页应用、大屏、IM 一开一整天，泄漏持续累积：几小时后内存翻倍、掉帧甚至崩溃（Chrome 的“Aw, Snap!”）。
- **服务端同样中招**。进程级缓存、未清理的监听器让 `rss` 缓慢上涨，最终被容器 OOM Kill，且常在流量高峰才暴露。
- **自动 GC 只解决“能不能回收”，不解决“该不该还活着”**——后者由开发者负责：`WeakMap` 用不用、定时器与监听器是否配对清理，都得自己管。

本文路线：**可达性 → V8 分代回收 → 泄漏场景 → 排查手法 → 弱引用与最佳实践 → FAQ**。没时间通读可先看第 3 章速查表、第 4 章定位步骤。

## 1. 可达性：GC 判断对象是否该回收的依据

GC 的核心是「**可达性 (Reachability)**」：从根（Root）沿引用链走得到的对象会被保留，走不到的成为「垃圾」。

### 1.1 根（Root）包括哪些？

- 全局变量、当前调用栈上的局部变量与参数。
- 事件监听器、定时器、闭包捕获的变量。

```javascript
let user = { name: 'xunbei' }
user = null // 原对象不再被任何引用，变为不可达，可被回收
```

### 1.2 引用链示例

```javascript
let a = { b: { c: 'data' } } // a → b → c 整条链可达
a.b = null // c 失去引用，成为垃圾
```

### 1.3 不可达 ≠ 立即释放

“不可达”只意味着**对象可以回收了**，何时回收由引擎决定。变量离开作用域、被赋 `null`、DOM 被移除，都只是**断开引用链**，内存要等下一次 GC 才归还。

```javascript
function scope() {
  const big = new Array(1000000).fill(0) // 分配在堆上
  return big.length
}
scope()
// 函数返回后 big 已经不可达，但内存不一定立刻归还
// “已分配”与“已回收”之间存在滞后，看内存曲线要留出这段时间
```

这解释了两个常见现象：

- **置 `null` 后内存没降**：正常，GC 还没跑。
- **`WeakRef` / `FinalizationRegistry` 的回调不确定**：触发条件挂在“对象何时被回收”上，而回收时机由引擎决定。

### 1.4 为什么最终选择了可达性：几种判定方案对比

[width(16,21,23,40)]

| 方案                 | 判定依据                           | 能否处理循环引用                               | 说明                                                                   |
| -------------------- | ---------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 手动管理（C / C++）  | 程序员显式 `free` / `delete`       | 不涉及                                         | 零 GC 开销，但悬垂指针、二次释放、忘记释放全靠人，出错成本极高         |
| 引用计数             | 引用数归零就回收                   | **不能**，需要额外手段（弱引用、手动断环）打破 | 回收即时、开销分散到每次赋值；维护计数本身有成本，且实现复杂（如 ARC） |
| 可达性 GC（现代 JS） | 从根出发不可达                     | 能，整条不可达的环一起回收                     | 有停顿、堆占用偏高（要留出回收前的空间），但不会因为环而误判           |
| 弱引用 + 可达性 GC   | 弱引用不计入可达链，键被回收即消失 | 能                                             | 让“缓存”这类辅助结构不干扰主对象的生命周期，是 JS 里最实用的补充手段   |

**引用计数把“回收”分散到每次赋值，可达性 GC 把它集中到一次“扫描”**——现代引擎都选后者，再用增量、并发与弱引用压住“集中扫描”的停顿。

## 2. V8 垃圾回收机制

V8（Chrome / Node 的 JS 引擎）采用**分代回收**：

[width(13,17,27,43)]

| 代     | 名称      | 特点               | 回收策略                          |
| ------ | --------- | ------------------ | --------------------------------- |
| 新生代 | Young Gen | 存活时间短、对象小 | Scavenge（复制算法），频繁、快速  |
| 老生代 | Old Gen   | 存活时间长、对象大 | 标记-清除 + 标记-整理，偶尔、耗时 |

依据是**弱分代假说**：绝大多数对象很快就死。因此把“刚分配的”与“活很久的”分开，新生代复制、老生代标记。

### 2.1 新生代：Scavenge（复制算法）

新生代空间一分为二（From / To）：

存活对象在两者间来回搬运，角色互换后清空 From；**经过多次回收仍存活的对象「晋升」到老生代**。

取舍：**只复制活着的对象，死得越多越快**；代价是只能用一半空间（From / To 各半）。

### 2.2 老生代：标记-清除 + 标记-整理

- **标记-清除 (Mark-Sweep)**：标记可达对象，清除未标记对象；缺点是内存碎片。
- **标记-整理 (Mark-Compact)**：清除后把存活对象向一端移动，解决碎片。
- **增量标记 (Incremental Marking)**：标记拆成小步，与 JS 交替执行，减少主线程卡顿。
- **引用计数**：早期算法，无法处理循环引用，现代浏览器已弃用。

“清除”还是“整理”由引擎取舍：整理要移动对象并修正所有引用，停顿更长但能消除碎片，老生代部分区域只“清除”不整理。

### 2.3 为什么循环引用曾是问题？

引用计数无法回收互相引用但外部不可达的对象：

```javascript
function cycle() {
  const a = {}
  const b = {}
  a.b = b
  b.a = a // 循环引用：a 和 b 互相引用
  // 函数返回后，外部无法访问 a、b，但引用计数认为它们「被引用」而不回收
}
```

现代浏览器用「可达性」判断，循环引用的对象在函数返回后即不可达，能被正常回收。

### 2.4 一次完整的回收：从分配到晋升

串起来看，一个对象的一生：

1. **分配**：新对象先进新生代 From 区（semi-space），超阈值的**大对象**直接进老生代。
2. **第一次 Scavenge**：From 区写满触发，存活对象复制到 To 区，From 清空。
3. **晋升**：经历两轮 Scavenge 仍存活，或 Scavenge 后 To 区占用超 25% 时被“晋升”到老生代（保证 To 区有余量）。
4. **老生代回收**：占用达到动态阈值时触发标记-清除-整理，配合增量 / 并发标记降停顿。

```javascript
// 短命对象：分配后立刻不可达，随下一次 Scavenge 一起消失，代价极低
function makeTemp() {
  return new Array(1000).fill(0)
}
for (let i = 0; i < 1e4; i++) makeTemp()

// 长命对象：被全局（根）持续引用，几轮 Scavenge 后晋升老生代，回收成本高得多
const kept = []
for (let i = 0; i < 1e4; i++) kept.push({ id: i })
```

结论：**少留长命对象比快删短命对象更值得优化**——被长期引用、晋升、又在老生代活到最后的对象回收成本高得多。

### 2.5 三色标记法与写屏障

老生代标记用**三色抽象**，它能解释“为什么增量标记不会漏标”：

- **白**：尚未访问。标记结束仍是白色 → 垃圾。
- **灰**：已发现，但它引用的对象还没扫描完。
- **黑**：自己和所有出边都已扫描完。

增量标记会**暂停标记、执行一段 JS 再回来**：这期间若 JS 把白色对象挂到黑色对象上、又删掉原来指向它的灰指针，它就再也扫不到，会被误回收。

```javascript
// 写屏障 (Write Barrier)：当 JS 修改了已经扫描完的对象的引用时，
// 引擎会把新引用到的对象重新染灰、记入待扫描队列，避免漏标。
const black = { name: '已经扫描完的对象' }
// black.newRef = { value: 1 } 这样一行赋值会触发写屏障，
// 把新对象重新染灰，留到下一轮增量标记继续扫描
```

反过来，“删掉引用”不需要写屏障：最坏只是**多留它一轮**（浮动垃圾），下一轮 GC 清掉，不会误回收。

### 2.6 增量、并发与并行标记

Orinoco 是 V8 这几代 GC 优化的代号，目标只有一个：**把主线程停顿从“几百毫秒”压到“几毫秒”**。

[width(22,40,38)]

| 技术                   | 做法                                                    | 效果                                   |
| ---------------------- | ------------------------------------------------------- | -------------------------------------- |
| 并行 (Parallel)        | 多个辅助线程同时做回收的一部分工作                      | 缩短总回收时间，但主线程仍要等         |
| 增量 (Incremental)     | 把标记拆成小步，与 JS 交替执行                          | 单次停顿变短，总量略增                 |
| 并发 (Concurrent)      | 标记、清除放到后台线程，主线程继续跑 JS                 | 主线程几乎不停顿，需要写屏障保证正确性 |
| 空闲时回收 (Idle-time) | 在浏览器空闲时段（如 `requestIdleCallback` 时机）做回收 | 复用本来浪费的时间，进一步降低感知延迟 |

Scavenge 也会并行化（多线程搬运存活对象），但新生代很小，停顿通常只有亚毫秒级。

### 2.7 GC 什么时候触发？

触发点是**分配压力**，不是时间：

- **新生代**：From 区写满 → Scavenge。
- **老生代**：占用超过**动态阈值** → 主 GC。阈值按存活对象增长速度与分配速率动态调整（涨得越快放得越宽）。
- **显式触发**：浏览器不提供接口；Node 需要启动时加 `--expose-gc`。

```javascript
// node --expose-gc app.js
if (global.gc) {
  global.gc() // 只用于压测和排查，不要写进业务代码
}
```

**没有分配就没有回收**：页面放着不动内存不降；Node 空转时 `heapUsed` 也一直挂着。

打开 GC 日志可看到真实的回收节奏：

```bash
node --trace-gc app.js
```

### 2.8 堆内存上限与 `--max-old-space-size`

GC 管“回收”，**上限**管“能用到多少”，两者是两道防线。

- **浏览器**：单标签页 JS 堆上限由 V8 与设备内存决定（64 位常见 1.5 GB ~ 4 GB），超限直接崩溃（报错、内容丢失）。
- **Node.js**：老生代上限默认由系统内存推导（64 位常见约 2 GB），超限抛 `JavaScript heap out of memory` 退出。

```bash
# 把老生代上限调到 4 GB（单位 MB）
node --max-old-space-size=4096 server.js

# 查看当前生效的上限
node -e "console.log(require('v8').getHeapStatistics().heap_size_limit / 1048576, 'MB')"
```

```javascript
const v8 = require('v8')
const stats = v8.getHeapStatistics()
console.log('上限:', (stats.heap_size_limit / 1048576).toFixed(0), 'MB')
console.log('已用:', (stats.used_heap_size / 1048576).toFixed(1), 'MB')
```

**调大上限只是把崩溃推迟，不是修复**——真正的修复是断掉不该留的引用，调上限只是“先扛住线上流量”的止血手段。

## 3. 常见内存泄漏场景

每条泄漏的共性：**某个长生命周期的根（全局变量、定时器、监听器、闭包、缓存）间接持有了本该释放的数据**。

### 3.1 全局变量泄漏

未声明变量会成为全局属性，永不回收：

```javascript
function fn() {
  name = 'xunbei' // 漏写 let/const，name 挂到 window 上
}
```

严格模式（`'use strict'` 或 ES 模块）下会抛 `ReferenceError`，这也是建议开严格模式的原因之一。另有两种变相全局：

- `window.xxx = 大对象` 作为“模块间通信”的土办法。
- 全局单例（store、EventBus、缓存 Map）里的键**只增不减**。

### 3.2 被遗忘的定时器与回调

```javascript
const timer = setInterval(() => {
  /* ... */
}, 1000)
// 组件销毁时忘记 clearInterval，回调被持有，相关对象无法回收
clearInterval(timer) // 必须清理
```

`setInterval` 与 `setTimeout` 都持有回调，回调又通过闭包持有它引用的一切——只要捕获了大对象，它就活到定时器被清掉为止。

### 3.3 事件监听器未移除

```javascript
// 组件挂载时监听，卸载时必须移除
window.addEventListener('resize', handler)
// 卸载时：
window.removeEventListener('resize', handler)
```

两个常见失效点：

- **不是同一个函数引用**：`addEventListener` 传匿名函数后，`removeEventListener` 再传一个新的删不掉——要保留引用，或用 `AbortController`。
- **只删了自己挂的，没删绑在全局的**：挂在 `window`、`document`、`body` 上的监听比组件活得久得多。

```javascript
// 用 AbortController 一次性移除同一批监听器（现代浏览器的推荐写法）
const controller = new AbortController()
const { signal } = controller

window.addEventListener('resize', () => {
  /* ... */
})
window.addEventListener(
  'scroll',
  () => {
    /* ... */
  },
  { signal },
)

// 组件卸载时一行搞定
controller.abort()
```

### 3.4 闭包捕获大对象

```javascript
let cache = null
function init() {
  const big = new Array(1000000).fill('x') // 大对象
  cache = function () {
    return big
  } // 闭包引用 big
}
init() // big 被闭包永久持有，即使不再使用
```

### 3.5 DOM 引用未清理

```javascript
let el = document.getElementById('box')
document.body.removeChild(el) // 移除 DOM
// 但 el 变量仍持有引用，元素无法被回收
el = null // 解除引用
```

### 3.6 未释放的 Blob URL

```javascript
const url = URL.createObjectURL(blob)
img.src = url
// 未调用 URL.revokeObjectURL(url)，内存常驻
```

`createObjectURL` 创建的 URL 会让浏览器一直持有对应的 `Blob`（几百 MB 的视频很常见），即使 `img` 已删掉。规则：**用完就 `revokeObjectURL`**——图片在 `onload` 之后、下载在触发之后。

### 3.7 框架中的「异步后置状态更新」

```javascript
// React 组件卸载后，异步请求回来仍 setState，可能引用已卸载组件的状态
useEffect(() => {
  let cancelled = false
  fetch('/api').then(res => {
    if (!cancelled) setData(res) // 用标志位避免卸载后更新
  })
  return () => {
    cancelled = true
  }
}, [])
```

更彻底的做法是用 `AbortController` 取消请求本身：请求进行中，它的 Promise、响应数据、回调链都还活着。

```javascript
useEffect(() => {
  const controller = new AbortController()
  fetch('/api', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setData(data))
    .catch(err => {
      if (err.name === 'AbortError') return // 主动取消，忽略
      console.error(err)
    })
  return () => controller.abort()
}, [])
```

### 3.8 闭包泄漏的原理与识别

闭包本身**不是**泄漏，泄漏发生在**闭包活得比它需要的数据更久**时。V8 只把被内层函数引用的变量放进上下文（Context）。

```javascript
// 反例：闭包被长期持有，且捕获了整个大对象
function createHandler() {
  const hugeData = new Array(1000000).fill('payload')
  return function () {
    return hugeData.length // 只用到了长度，却让整个 hugeData 一直活着
  }
}
const handler = createHandler() // handler 活着 → hugeData 活着
```

```javascript
// 正例：只捕获真正需要的最小值
function createHandler() {
  const hugeData = new Array(1000000).fill('payload')
  const size = hugeData.length // 先把要用的值取出来
  return function () {
    return size // 闭包只持有数字，hugeData 可以正常回收
  }
}
const handler = createHandler()
```

识别方法：堆快照里看 **Retainers**，持有链上出现 `Context`（V8 闭包上下文）就说明被闭包捕获了，顺链往上就能找到“谁一直拿着这个闭包”。

### 3.9 缓存不设上限：用 LRU 兜底

进程内缓存最容易失控：它天生“把数据留住”，键无限增长就是稳定的泄漏源。

```javascript
const cache = new Map()

function getData(key) {
  if (cache.has(key)) return cache.get(key)
  const value = loadFromServer(key)
  cache.set(key, value) // 只增不减：key 有多少种，内存就涨到多大
  return value
}
```

应用层缓存的底线是**必须有上限**，常见做法是 LRU（最近最少使用）：

```javascript
class LRUCache {
  constructor(limit = 100) {
    this.limit = limit
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)
    this.map.delete(key) // 先删再插，把最近使用的挪到队尾
    this.map.set(key, value)
    return value
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.limit) {
      // Map 的迭代顺序就是插入顺序，第一个即最久未使用的键
      this.map.delete(this.map.keys().next().value)
    }
  }
}
```

`Map` 的迭代顺序等于插入顺序，LRU 只需十几行。若键是对象、希望“对象没了缓存自动清掉”，换成 `WeakMap`（见 5.3）。

### 3.10 观察者 / 发布订阅未取消订阅

“订阅”比“事件监听”更隐蔽：回调不挂在 DOM 上，而挂在某个全局单例里。

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map()
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(fn)
    return () => this.off(event, fn) // 返回取消订阅的函数
  }
  off(event, fn) {
    this.listeners.get(event)?.delete(fn)
  }
  emit(event, payload) {
    this.listeners.get(event)?.forEach(fn => fn(payload))
  }
}

const bus = new EventBus()
const unsubscribe = bus.on('tick', () => {
  /* ... */
})
unsubscribe() // 组件销毁时必须调用，否则回调及其闭包一直被 bus 持有
```

`IntersectionObserver` / `MutationObserver` / `ResizeObserver` 同理，回调由浏览器持有：

```javascript
const observer = new IntersectionObserver(entries => {
  /* ... */
})
observer.observe(document.querySelector('#target'))
// 组件卸载时：停止观察并释放回调
observer.disconnect()
```

### 3.11 `console.log` 持有引用

DevTools 打开时，**被打印过的对象会被控制台持有**，直到清空控制台或关闭 DevTools——打印大响应体、组件实例或 DOM 子树都会让内存曲线不降。

```javascript
function handleResponse(payload) {
  console.log('debug:', payload) // 控制台一直持有 payload
}
handleResponse({ items: new Array(100000).fill(0) })
// 排查时应先清空控制台（Ctrl+L）再观察内存
```

这是“本地怎么测都有泄漏、线上却没问题”最常见的误报来源。发布前应剔除调试日志，构建工具通常能按环境去掉 `console`。

### 3.12 游离 DOM 节点（Detached DOM）

节点从文档树摘掉但 JS 还留着引用，这棵子树就成了“游离节点”，整棵树都回收不了。

```javascript
let dialogEl = null

function openDialog() {
  dialogEl = document.createElement('div')
  dialogEl.innerHTML = '<p>hello</p>'
  document.body.appendChild(dialogEl)
}

function closeDialog() {
  dialogEl.remove() // 从文档树移除，但 dialogEl 仍指向它
  // dialogEl = null // 不解引用 → 游离 DOM，连同全部子节点一起常驻
}
```

游离节点在堆快照里很好认：类名带 `Detached`（如 `Detached HTMLDivElement`），筛选框搜 `Detached` 即可列出。常见成因：把节点存进数组 / `Set` 做“已处理”标记、挂在全局对象上当模板缓存。

### 3.13 Node.js 侧的 Buffer 与流泄漏

服务端泄漏形态不同：不是 DOM，而是 Buffer、流、连接和进程级缓存。

```javascript
const http = require('http')

const server = http.createServer((req, res) => {
  const chunks = []
  req.on('data', chunk => chunks.push(chunk)) // 请求体全量堆在内存里
  req.on('end', () => {
    const body = Buffer.concat(chunks)
    res.end(String(body.length))
  })
})

server.listen(3000)
```

上传或返回大文件时内存随请求体线性增长——**并发几个请求就可能 OOM**；正确做法是用流，内存只与缓冲区大小相关：

```javascript
const fs = require('fs')
const http = require('http')

http
  .createServer((req, res) => {
    // 管道流式转发，不会把整个文件读进内存
    fs.createReadStream('./big-file.zip').pipe(res)
  })
  .listen(3000)
```

服务端还要留意这几个信号：

- `MaxListenersExceededWarning: Possible EventEmitter memory leak detected` —— 监听器只加不减的典型症状。
- 进程级缓存（`const cache = new Map()` / 全局数组）没有 TTL 或上限。
- 未关闭的 WebSocket / 数据库连接、未清理的 `setInterval`、未 `destroy()` 的流。
- 多进程 / 多实例部署下，缓存被每个 worker 各存一份，内存放大 n 倍。

### 3.14 泄漏场景速查表

[width(21,40,39)]

| 场景                     | 典型信号                                 | 修复方向                                                 |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| 全局变量 / 漏写声明      | 快照里对象被 `Window` 直接持有           | 开严格模式、避免挂 `window`、给全局容器设上限            |
| 定时器未清理             | 回调中的对象在 Retainers 里指向定时器    | `clearInterval` / `clearTimeout`，在卸载钩子里统一清     |
| 事件监听未移除           | Listeners 计数只增不减                   | `removeEventListener` 传同一引用，或用 `AbortController` |
| 闭包捕获大对象           | Retainers 出现 `Context` 节点            | 只捕获所需的最小值，别把大对象带进闭包                   |
| 游离 DOM 节点            | 快照里类名带 `Detached`                  | 移除节点后同步清空 JS 引用                               |
| Blob URL 未释放          | `Blob` / `MediaSource` 占用居高不下      | 用完调用 `URL.revokeObjectURL`                           |
| 缓存不设上限             | 缓存对象条目数随操作次数线性增长         | LRU / TTL / 换 `WeakMap`                                 |
| 订阅（EventBus / store） | 同一事件的处理函数数量持续增长           | 保存 `on()` 的返回值并在卸载时调用                       |
| `console.log` 持有       | 关了 DevTools 内存就正常，本地却一直涨   | 排查前清空控制台，发布前剔除日志                         |
| Node 端 Buffer / 流      | `external` / `arrayBuffers` 数值持续上涨 | 用流式处理替代全量读入，及时 `destroy()`                 |

## 4. 排查内存泄漏

排查的核心是**对比**：找出“本该消失却没消失”的对象，再顺持有链找到那条不该存在的引用。

### 4.1 观察现象

- 页面越用越卡、响应变慢。
- 任务管理器 / Chrome 任务管理器内存持续上涨。
- 长时间运行后标签页崩溃。

### 4.2 Chrome DevTools Memory 面板

1. **Heap Snapshot（堆快照）**：在不同时间点拍快照并对比，找出未被回收的对象。
2. **Allocation on timeline（时间轴分配）**：录制分配过程，定位反复分配不释放的对象。
3. **Performance 面板**：观察 JS Heap 曲线是否「锯齿状」（有回收）还是「持续上升」（泄漏）。

### 4.3 快速定位步骤

1. 打开 DevTools → Memory → 选 **Heap snapshot**。
2. 操作前拍一次快照，重复操作（如反复开关弹窗）后再拍一次。
3. 在第二次快照顶部切换对比视图，按 **Shallow Size / Retained Size** 排序。
4. 找到「新增且未释放」的对象，看 **Retainers**（持有链）追溯谁引用了它。

### 4.4 关键指标

[width(33,67)]

| 指标          | 含义                           |
| ------------- | ------------------------------ |
| Shallow Size  | 对象自身占用的内存             |
| Retained Size | 对象及其「独占」的引用链总内存 |

区分两者是定位泄漏的关键：**Shallow Size 大的是“大对象”，Retained Size 大的是“拽着一大串东西不放的对象”**——泄漏常表现为某个不起眼的小对象 Retained Size 出奇地大。

### 4.5 堆快照三步对比法

两张快照容易误判，很多对象只是“还没来得及回收”。稳妥做法是拍**三张**：

1. 打开 DevTools → Memory → Heap snapshot，点垃圾桶图标**手动 GC**，拍“基线”快照。
2. **完整操作一次**（如打开弹窗再关闭），手动 GC，拍第二张。
3. **重复操作 N 次**（N 取 10 以上），手动 GC，拍第三张。

然后在第三张快照顶部把视图切到 **Comparison**（对比），基准选第二张：

- **`# New`**：新增对象数。第 2、3 张之间仍增长才是真泄漏；只有第 1、2 张之间增长，多半是懒加载 / 首次初始化。
- **`# Deleted`**：已回收对象数。新增多、回收少 → 泄漏。
- **`Size Delta`**：内存增量，按它排序最快找到大头。

定位时配合三个操作：

- **筛选框**：输入类名（如组件名、`Detached`、`Context`、`EventListener`）快速缩小范围。
- **Retainers 面板**：从下往上读，找到第一条**属于自己代码**的引用，那就是要修的地方。常见节点含义见下表。
- **`Distance`**：从根到对象的引用层数。值突然变大的同类对象，往往被一条新链路挂住了。

[width(41,59)]

| Retainers 里的节点                 | 意味着什么                                     |
| ---------------------------------- | ---------------------------------------------- |
| `Window / global`                  | 被全局变量、`window` 上的属性持有              |
| `Context`                          | 被闭包捕获                                     |
| `Detached HTMLxxxElement`          | 游离 DOM 节点，JS 侧还留着引用                 |
| `EventListener` / `Bound Function` | 事件监听器持有的回调                           |
| `WeakMap` / `WeakSet`              | 弱引用，**不会**阻止回收（出现在链上可以忽略） |
| `system / Context`、`InternalNode` | 引擎内部结构，通常不用管                       |

### 4.6 Allocation instrumentation on timeline

堆快照是“某一时刻的静态切片”，时间轴分配记录的是“谁在持续分配”：

1. Memory 面板选择 **Allocation instrumentation on timeline** → 点开始。
2. 反复执行可疑操作（如路由来回切换、反复打开关闭弹窗）。
3. 观察时间轴上的长条：**蓝色 = 这段时间分配且仍存活**，灰色 = 已回收。
4. 如果每次操作都留下一条新的蓝条、且越堆越多，就是泄漏。
5. 点开蓝条展开调用栈，看到是哪一行代码分配的。

它的优势是**带分配栈**，能一步定位到源码；代价是录制有开销，只适合复现步骤明确时使用。

### 4.7 Performance 面板看内存曲线

录制 Performance 时勾选 **Memory**，可以得到 JS Heap 与 DOM 节点数的时间曲线：

- **锯齿形**（上升 → 回收 → 回落）：正常。
- **阶梯形 / 持续上升**：可疑，尤其每一轮操作都比上一轮高一个台阶。
- **手动 GC 后仍不回落到基线**：基本可以确认是泄漏。
- 同时关注 **Nodes**（DOM 节点数）与 **Listeners**（监听器数）两条计数线：它们持续上涨通常对应游离节点与未移除的监听器。

### 4.8 `performance.memory` 与 `process.memoryUsage()`

需要**把内存变成可观测指标**（打点、上报、趋势告警）时用这两个接口：它们量级粗、受 GC 时机影响大，只适合看趋势，不能做断言。

```javascript
// Chrome 专有：performance.memory（其他浏览器没有这个属性）
if (performance.memory) {
  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } =
    performance.memory
  console.log('已用:', (usedJSHeapSize / 1048576).toFixed(1), 'MB')
  console.log('已分配:', (totalJSHeapSize / 1048576).toFixed(1), 'MB')
  console.log('上限:', (jsHeapSizeLimit / 1048576).toFixed(1), 'MB')
}
```

标准化的替代品 `performance.measureUserAgentSpecificMemory()` 要求页面**跨源隔离**（响应头带 `Cross-Origin-Opener-Policy` 与 `Cross-Origin-Embedder-Policy`），粒度更粗，返回各来源的内存拆分，适合汇总上报：

```javascript
// 返回 Promise，需要 crossOriginIsolated 为 true 才能用
if (self.crossOriginIsolated) {
  performance.measureUserAgentSpecificMemory().then(result => {
    console.log((result.bytes / 1048576).toFixed(1), 'MB')
    console.log(result.breakdown)
  })
}
```

Node 侧看 `process.memoryUsage()`：

```javascript
const usage = process.memoryUsage()
// rss: 进程占用的物理内存；heapTotal / heapUsed: V8 堆；
// external / arrayBuffers: Buffer、TypedArray 等堆外内存
for (const [key, value] of Object.entries(usage)) {
  console.log(key.padEnd(12), (value / 1048576).toFixed(1), 'MB')
}
```

注意 `external` / `arrayBuffers`：**Node 里缓存的图片、视频、文件 Buffer 都记在这里，不体现在 `heapUsed`**，只盯 `heapUsed` 会误判“堆很健康”。

### 4.9 Node.js 侧的排查手法

服务端没法“打开 DevTools”，但有等价甚至更强的手段：

```bash
# 1. 启动调试端口，再用 Chrome 打开 chrome://inspect 连上去
node --inspect=0.0.0.0:9229 app.js

# 2. 让进程在收到 SIGUSR2 时自动生成堆快照（生产环境安全采样）
node --heapsnapshot-signal=SIGUSR2 app.js
kill -USR2 <pid>   # 触发快照，落地为 .heapsnapshot 文件

# 3. 打印 GC 轨迹，确认回收频率与停顿
node --trace-gc app.js
```

拿到 `.heapsnapshot` 后用 DevTools Memory 面板 **Load** 载入，对比分析与浏览器端一致（Retainers、Comparison 等都可用）。

排查顺序建议：

1. `process.memoryUsage()` 定期打点，确认涨的是 `heapUsed` 还是 `external`（前者查对象，后者查 Buffer / 流）。
2. 稳定复现后采样堆快照，对比两次快照定位增长最多的类。
3. 看增长对象的 Retainers，确认是业务缓存、监听器还是流。
4. 修复后重新采样验证——**没有第二次快照的验证，等于没修**。

## 5. 最佳实践

- **及时清理**：定时器 `clearInterval`、事件 `removeEventListener`、Blob URL `revokeObjectURL`。
- **组件卸载钩子**：Vue `onUnmounted` / React `useEffect` 清理函数中统一清理副作用。
- **慎用全局与闭包**：避免把大对象长期留在全局作用域或被闭包捕获。
- **`WeakMap` / `WeakSet`**：作为缓存时用弱引用，键被回收后条目自动消失。

```javascript
const cache = new WeakMap() // 键是对象，对象被回收后条目自动清除
function getVal(key) {
  if (!cache.has(key)) cache.set(key, compute(key))
  return cache.get(key)
}
```

### 5.1 弱引用的三种武器

[width(20,80)]

| 特性      | 说明                                                 |
| --------- | ---------------------------------------------------- |
| `WeakMap` | 键必须是对象，键被回收后条目自动消失，**不可遍历**。 |
| `WeakSet` | 值必须是对象，弱引用，**不可遍历**。                 |
| `WeakRef` | 持有对象的弱引用，用 `.deref()` 读取（可能已回收）。 |

### 5.2 弱引用工具全景

ES2021 还补上了 `FinalizationRegistry`，四种工具的能力边界如下：

[width(18,18,13,51)]

| 工具                   | 键 / 值要求        | 能否遍历 | 典型用途                                     |
| ---------------------- | ------------------ | -------- | -------------------------------------------- |
| `WeakMap`              | 键必须是对象       | 不可遍历 | 给对象挂附属数据、以对象为键的缓存、私有字段 |
| `WeakSet`              | 值必须是对象       | 不可遍历 | 标记“已处理”的对象，不干扰其回收             |
| `WeakRef`              | —                  | —        | 大对象的“可选缓存”，允许随时被回收           |
| `FinalizationRegistry` | 注册目标必须是对象 | —        | 对象被回收后的兜底清理（如释放外部资源）     |

```javascript
// FinalizationRegistry：对象被回收后触发回调
const registry = new FinalizationRegistry(heldValue => {
  console.log('已回收:', heldValue)
})

let target = { id: 1 }
registry.register(target, 'target-1') // 第二个参数是回调时拿到的“替代值”
target = null // 之后的某次 GC 会（可能）触发回调

// 回调时机不确定：可能几秒后，也可能整场会话都不执行
// 因此只能用来做兜底清理，不能用来做业务逻辑
```

> `FinalizationRegistry` 的回调里**不要重新引用被回收的对象**（比如把 `heldValue` 存进全局缓存），否则等于把它又救回来了。

### 5.3 弱引用的适用边界

弱引用不是“免费的缓存”，用错场景反而更糟：

- **键必须是对象**：`wm.set('key', value)` 直接抛 `TypeError`，字符串 / 数字不能做 `WeakMap` 键；这类缓存用 `Map` + LRU + TTL。
- **不可遍历、没有 `size`**。不能 `forEach` / 取 `keys()` / 清空，也统计不了命中率——想做“可观测的缓存”，`WeakMap` 做不到。
- **命中依赖同一个对象引用**。每次都新建对象作键（如每次都 `fetch` 出新对象），缓存永远不命中，只是白占开销。
- **弱引用只保住“键”**。值是大对象而键长期存活时，内存一样不降——`WeakMap` 不等于自动限流。
- **`WeakRef.deref()` 随时可能返回 `undefined`**，每次读取都要判空，不能让业务逻辑依赖“它一定还在”。
- **`FinalizationRegistry` 的时机不确定**，只能兜底，不能当业务逻辑的一环。

```javascript
const cache = new WeakMap()
let key = { id: 1 }
cache.set(key, 'cached')
console.log(cache.get(key)) // 'cached'
key = null // 键在外部不可达后，这条记录会在下一次 GC 时自动消失
```

### 5.4 内存与缓存方案对比

[width(18,22,13,9,38)]

| 方案                  | 回收依据                       | 循环引用 | 是否自动 | 适用场景与代价                                                  |
| --------------------- | ------------------------------ | -------- | -------- | --------------------------------------------------------------- |
| 手动管理（C / C++）   | 程序员显式释放                 | 不涉及   | 否       | 零 GC 开销，但忘记释放 / 重复释放 / 悬垂指针全靠人保证          |
| 引用计数              | 引用数归零                     | **不能** | 是       | 回收即时、开销分散，但要额外手段打破环，维护计数也有成本        |
| 强引用缓存（`Map`）   | 缓存自身是根，条目永不自动释放 | 能       | 否       | 实现最简单，**必须自己设上限 / TTL**，否则就是稳定的泄漏源      |
| `WeakMap` / `WeakSet` | 键（值）不可达即自动移除       | 能       | 是       | 适合对象附属数据；不可遍历、不可设上限、不能统计                |
| 手动置 `null`         | 主动断开引用链                 | 能       | 半自动   | 只是让对象“提前不可达”，回收仍由 GC 决定；适合长生命周期的容器  |
| 换数据结构降峰值      | 不减少对象数，但压缩表示       | 不涉及   | —        | `TypedArray` / `ArrayBuffer` 替代对象数组，虚拟滚动替代全量渲染 |

结论：**能用弱引用就用（对象为键的附属数据），不能用就给强引用容器配上限；必须长期保存且有界的数据就接受它，并计入内存预算**。

### 5.5 实战场景

**（1）路由 / 组件切换**：把清理写成配对的两半放在同一个地方，别指望“以后统一治理”。

```javascript
// Vue 3：挂载与卸载写在一起，一眼能看出是否配对
import { onMounted, onUnmounted } from 'vue'

function handleScroll() {
  /* ... */
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
```

**（2）长列表与无限滚动**：虚拟滚动只渲染可视区域，DOM 节点数恒定；同时“已加载数据数组”别无限增长，按页淘汰旧页。

**（3）第三方实例**：图表、地图、编辑器、播放器持有大量非 JS 资源，销毁必须调用各自接口（`chart.dispose()`、`map.remove()`、`editor.destroy()`）再解除引用。

**（4）大文件上传 / 下载**：用流替代 `FileReader.readAsDataURL`（后者把整个文件变成 base64，内存翻约 1.33 倍）；上传完成及时 `revokeObjectURL`。

**（5）Node SSR / BFF**：请求级缓存不要放进程级；进程级缓存必须有 TTL 与容量上限，且多 worker 各存一份。

**（6）实时通信**：WebSocket 重连时清理旧连接的监听器与定时器，否则每断线重连一次就多留一套回调。

### 5.6 清理清单

把这张表当成 code review 检查项：**“创建”了左列的东西，就必须在卸载 / 结束时执行右列的动作**。

[width(13,35,52)]

| 资源              | 创建                                 | 对应清理                                      |
| ----------------- | ------------------------------------ | --------------------------------------------- |
| 定时器            | `setInterval` / `setTimeout`         | `clearInterval` / `clearTimeout`              |
| 事件监听          | `addEventListener`                   | `removeEventListener`（同一引用）或 `abort()` |
| 观察者            | `new IntersectionObserver` 等        | `disconnect()` / `unobserve()`                |
| 订阅              | `bus.on` / `store.subscribe`         | 调用其返回的取消订阅函数                      |
| 网络请求          | `fetch` / `XMLHttpRequest`           | `AbortController.abort()` / `xhr.abort()`     |
| Blob / 媒体       | `URL.createObjectURL`、`MediaStream` | `URL.revokeObjectURL`、`track.stop()`         |
| 第三方实例        | `new Chart` / `new Map` 等           | 实例的 `dispose()` / `destroy()` / `remove()` |
| 流 / 句柄（Node） | `createReadStream`、连接、`Worker`   | `destroy()` / `close()` / `terminate()`       |
| 缓存              | `new Map()` 做进程内缓存             | 设上限 / TTL，或改用 `WeakMap`                |
| 全局挂载          | `window.xxx = ...`                   | 卸载时 `delete window.xxx` 或根本别挂         |

## 6. 总结

- GC 依据「可达性」回收不可达对象。
- V8 分代回收：新生代复制（Scavenge），老生代标记-清除 + 标记-整理。
- 泄漏根源 = 忘清理定时器/监听器/闭包引用/全局变量/Blob URL。
- 排查靠 DevTools 堆快照 + 时间轴，最佳实践是「谁创建谁清理」。
- **少留长命对象**比快删短命对象更值钱——晋升老生代后回收成本高得多。
- “不可达”不等于“已释放”，GC 触发靠分配压力：**手动 GC 后仍不回落才叫泄漏**。
- 弱引用（`WeakMap` / `WeakSet` / `WeakRef`）让缓存随对象生命周期自动失效，但不可遍历、不可设上限，只适合对象附属数据。
- 排查是一条闭环：现象 → 快照对比 → Retainers 定位 → 修复 → **再拍一次快照验证**。

## 7. 常见问题 (FAQ)

### 7.1 闭包一定会造成内存泄漏吗？

- **不会**。闭包只是“函数 + 它能访问的外层变量”，是语言的基本能力；只有**闭包活得比它需要的数据更久**时才泄漏。
- 判据是**闭包被谁持有**：挂在 `window`、全局单例、长生命周期的 `Map` 上 → 泄漏；随组件一起销毁 → 正常。
- 优化手法：只捕获需要的最小值（先算好 `length`，别把大对象带进闭包）；Retainers 里出现 `Context` 就说明持有链来自闭包。

### 7.2 `WeakMap` 为什么能避免泄漏？它和 `Map` 有什么区别？

- `Map` 的键是**强引用**，键对象被一直拽住，不清空就永远回收不了；`WeakMap` 的键是**弱引用**，键在别处不可达时记录自动消失，无需 `delete`。
- 代价是两条硬约束：键**必须是对象**（字符串 / 数字键抛 `TypeError`），**不可遍历**（没有 `size`、`forEach`、`keys()`）。
- 因此适合“给对象挂附属数据”，不适合需要统计、过期、限容量的业务缓存——那种场景用 `Map` + LRU（见 3.9）。
- 弱引用只保证“键不被缓存拽住”：值是大对象、键又长期存活时，内存照样不降。

```javascript
const wm = new WeakMap()
let key = { id: 1 }
wm.set(key, 'cached')
console.log(wm.get(key)) // 'cached'
key = null // 断开外部引用后，条目会在下一次 GC 时自动消失
```

### 7.3 手动把变量赋成 `null` 就一定释放内存吗？

- **不等于立即释放**。`xxx = null` 只是**断开引用链**、让对象变为不可达，真正回收要等下一次 GC。
- 置 `null` 后内存没降是正常现象——在 DevTools 点垃圾桶手动 GC 再观察才是有效验证。
- 现代引擎对“函数返回后不再使用的变量”能自行处理，多数场景不必手动置 `null`；真正需要的是**长生命周期容器**：全局数组、进程内缓存、留存的 DOM 引用、闭包外层变量。

```javascript
let data = new Array(1000000).fill(0)
data = null // 只是让对象不可达，内存要等下一次 GC 才真正释放
```

### 7.4 为什么内存不降反升？GC 到底什么时候跑？

- 触发点是**分配压力**而非时间：新生代 semi-space 写满 → Scavenge；老生代超动态阈值 → 主 GC。没有分配就没有回收。
- “页面放着不动、内存不降”是正常的；“反复操作后阶梯式上升、手动 GC 也不回落”才是泄漏。
- 老生代阈值随分配速率**动态放宽**，内存会“先涨一截再回落”，属正常波动，别只看单点数值。
- Node 上限由 `--max-old-space-size` 决定（64 位默认约 2 GB），超限即 OOM 退出；**调大只是推迟崩溃，不是修复**。

### 7.5 单页应用路由切换后内存一直涨，应该先查什么？

- 先查**跨路由共享的全局东西**：`window` / `document` 上的事件、EventBus 或 store 订阅、`setInterval`、WebSocket——它们比组件活得久，最易被漏掉。
- 再查**卸载钩子是否覆盖全**：Vue `onUnmounted`、React `useEffect` 清理函数、第三方实例的 `dispose()`、未 `abort()` 的请求。
- 最后查**缓存**是否设了上限：`keep-alive`、全局 `Map`、`sessionStorage` 镜像对象。
- 验证：路由间切换 10 次以上，每次手动 GC 并拍快照对比；新增对象里出现组件实例、DOM 节点或监听器就是没清干净。

### 7.6 DevTools 里怎么确认是“泄漏”而不是“还没回收”？

- 先点 Memory 面板的**垃圾桶图标手动 GC**：仍不回落才叫泄漏，回落到基线附近只是“还没轮到它被回收”。
- 快照对比用**三张**：基线 → 操作 1 次 → 再操作 N 次。只看第 2、3 张之间仍增长的对象；第 1、2 张之间的增长常只是首次初始化。
- 看对象计数而非只看字节数：Comparison 的 `# New` / `# Deleted`，或 Performance 的 `Nodes` / `Listeners` 曲线。
- Retainers 里出现 `Window`、`Context`（闭包）、`Detached HTMLDivElement`、`EventListener`，基本可确认持有链没断开。
- DevTools 自身会持有 `console.log` 打印过的对象：**排查前先清空控制台**，否则会得到假阳性。

### 7.7 内存泄漏和“内存膨胀”是一回事吗？

- 不是。**泄漏**是对象本该被回收却一直可达，内存随时间单调上升；**膨胀 (Bloat)** 是对象都能回收，但峰值占用远超必要（如一次把 10 万条数据全渲染成 DOM）。
- 处理方式不同：泄漏要**断持有链**；膨胀要**降峰值**——虚拟滚动、分页 / 分片加载、流式处理、把对象数组换成 `TypedArray`。
- 两者内存曲线很像，区分办法还是那一条：手动 GC 后回落的是膨胀，不回落的是泄漏。
