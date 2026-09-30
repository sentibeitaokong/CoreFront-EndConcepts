# JavaScript 执行性能与主线程架构优化

**核心本质**：JavaScript 性能优化的根本，早已超越了“**少写几行代码**”或“用 `for` 还是 `forEach`”的语法之争。现代前端工程中，JS 优化的核心战役是**捍卫主线程的绝对控制权**。下载只是第一关，真正决定用户体感（如 INP 交互延迟）的，是解析、AST 编译、执行、框架虚拟 DOM 调度、垃圾回收（GC）与浏览器渲染流水线之间的残酷博弈。

**战术纪律**：交互关键路径上只做纯粹的必要计算；所有超过 50ms 的任务必须被无情拆解；能离开主线程的重度逻辑，坚决流放至后台线程。

## 1. JS 阻塞的生命周期

一段 JavaScript 从网络到达设备，直至影响用户体感，需要经历一条极其昂贵的流水线。了解 V8 引擎的工作机制，是破局的关键：

- **网络与解压 (Network & Decode)**：包体越大，网络传输越久。Gzip/Brotli 解压同样需要消耗 CPU 时间。
- **解析与 AST 构建 (Parse)**：浏览器必须将纯文本源码转换为抽象语法树（AST）。如果首屏一次性加载了 2MB 的 JS，仅解析耗时就可能高达数百毫秒。
- **JIT 编译 (Compile)**：V8 引擎的 Ignition 解释器将 AST 转为字节码执行，随后 TurboFan 会将高频执行的“**热点代码**”优化编译为极速的机器码，但这要求你的数据结构必须稳定，否则会触发极其昂贵的 Deoptimize（去优化）。
- **同步执行阻塞 (Execute)**：JS 是单线程的，同步任务会像路障一样死死堵住主线程，导致用户的点击事件无法分发，CSS 动画随之卡顿。
- **框架调度 (Framework Overhead)**：React 的 Fiber 协调、Vue 的响应式依赖收集与 VNode Diff，本质上都是庞大的 JS 密集型运算。
- **GC (垃圾回收)**：内存分配无度会导致新生代/老生代频繁清理，强行挂起主线程。

## 2. 长任务治理与调度

任何在主线程连续执行超过 **50ms** 的 JavaScript 代码，都被定义为“**长任务**”。它是导致 INP（交互到下一次绘制延迟）不达标的头号元凶。

- **时间分片 (Time Slicing)**：对于十万级大数组遍历、极其复杂的嵌套对象深拷贝或批量 DOM 更新，必须将其打散为多个宏任务（MacroTask），在任务间隙主动把主线程“**还给**”浏览器。
- **微任务与宏任务的分流**：不要把沉重的计算全塞进 `Promise.then`（微任务队列）。微任务会在当前事件循环末尾强制清空，依然会阻塞渲染。应合理使用 `setTimeout`、`MessageChannel` 或 `requestIdleCallback`。
- **拥抱现代调度 API**：利用最新的 `scheduler.yield()` 或 `scheduler.postTask()` 规范，实现更加细粒度的任务优先级控制。
- **交互即时反馈**：在 `onClick` 事件中，永远优先通过极少量的代码更新 UI 状态（如按钮变为 Loading），然后再去执行沉重的数据组装或接口请求。

```javascript
// 现代企业级时间分片封装 (结合 requestIdleCallback 思想)
function runInChunks(items, handler) {
  let index = 0

  function next() {
    // 限制单次执行切片为 8ms，确保不阻碍 16.6ms 的屏幕刷新帧
    const deadline = performance.now() + 8

    while (index < items.length && performance.now() < deadline) {
      handler(items[index++])
    }

    if (index < items.length) {
      // 让出主线程，将剩余任务放入下一个事件循环
      setTimeout(next, 0)
    }
  }

  next()
}
```

**调度 API 优先级对照**（先知道该用哪个，再谈怎么拆）：

[width(25,41,34)]

| API                     | 时机与优先级                                                       | 适用场景                                        |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| 微任务 (`Promise.then`) | 当前宏任务**末尾强制清空**，一样会阻塞渲染                         | 只放轻量逻辑，**绝不能塞重计算**                |
| `setTimeout(fn, 0)`     | 宏任务，**嵌套 5 层后被钳制到最少 4ms**                            | 简单让出主线程，精度要求不高                    |
| `MessageChannel`        | 宏任务，**没有最小延迟钳制**                                       | 需要“**尽快让出**”又不想要 4ms 延迟             |
| `requestIdleCallback`   | 只在**空闲帧**执行，并提供 `deadline.timeRemaining()`              | 可推迟的批处理；**必须配 `timeout` 兜底**       |
| `scheduler.postTask()`  | 可指定 `priority`：`user-blocking` / `user-visible` / `background` | 需要精细优先级控制的现代方案                    |
| `scheduler.yield()`     | **主动让出后仍保持当前优先级**，不会被排到队尾                     | 长任务内部的“**礼让点**”，体验优于 `setTimeout` |

```javascript
// 现代写法：每处理一批就礼让一次，且不会像 setTimeout 那样掉到队伍最后
async function processInBatches(items, handler) {
  for (let i = 0; i < items.length; i++) {
    handler(items[i])
    if (i % 100 === 0) {
      await (self.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0))) // 兼容不支持的环境
    }
  }
}
```

> **框架层同样在做这件事**：React 的并发特性（`startTransition`、`useDeferredValue`）本质就是把「不急的渲染」标成低优先级、切成小片执行。理解了调度 API，再看这些 Hook 就不再是黑盒。

## 3. 数据结构与时间复杂度

在海量数据流转的现代 Web 应用中，算法复杂度和引擎的底层优化特性会成倍放大性能差异。

- **O(1) 查找替代 O(n) 遍历**：在处理列表比对、权限校验时，坚决避免在 `for` 循环中嵌套 `Array.prototype.find` 或 `includes`。必须优先转换为 `Map` 或 `Set`。

:::details Map遍历

```javascript
// 反面模式：O(n^2) 的高昂代价
const isAuthorized = users.find(u => u.id === targetId)

// 最佳实践：构建 O(1) 的 Map 映射表
const userMap = new Map(users.map(user => [user.id, user]))
const currentUser = userMap.get(targetId)
```

:::

- **维持对象形状 (Object Shapes) 稳定**：V8 引擎依赖隐藏类（Hidden Classes）来加速属性访问。在初始化对象时，尽量保持属性的声明顺序一致，避免在运行时随意 `delete` 属性或动态添加新属性，以防止 JIT 优化失效（代码退化为慢速的字典查找）。
- **空间换时间 (Memoization)**：对于复杂的树形解构、纯函数计算，利用缓存闭包将入参和结果保存起来。

:::details 空间换时间

```js
//极简版 Memoize 实现
function memoize(fn) {
  // 1. 在闭包中开辟一个缓存字典
  const cache = {}
  return function (...args) {
    // 2. 将入参序列化为唯一的字符串 Key
    const key = JSON.stringify(args)
    // 3. 检查缓存：如果命中，直接返回
    if (cache[key] !== undefined) {
      return cache[key]
    }
    // 4. 首次执行：调用原函数，并将结果存入缓存
    const result = fn.apply(this, args)
    cache[key] = result
    return result
  }
}
//测试用例：斐波那契数列 (计算极其耗时)
const fibonacci = n => {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}
// 包装成带缓存的函数
const fastFibonacci = memoize(fibonacci)
// 第一次调用：需要真实计算
console.time('第一次耗时')
console.log(fastFibonacci(35))
console.timeEnd('第一次耗时') // 🐌 首次计算，大概耗时 50-100ms

// 第二次调用：入参相同，直接走缓存
console.time('第二次耗时')
console.log(fastFibonacci(35))
console.timeEnd('第二次耗时') // ⚡ 命中缓存，耗时 0ms (甚至不到 1 毫秒)
```

:::

- **警惕链式调用陷阱**：`array.filter().map().reduce()` 看似优雅，但在处理十万级数据时，会产生多次全量遍历和多个巨大的中间临时数组，造成严重的内存分配与 GC 压力。

:::details 循环融合

```javascript
// 反面模式：O(M*n) 的高昂代价
const topActiveNames = users
  .filter(user => user.isActive) // 遍历 100,000 次，开辟内存生成临时数组 A
  .map(user => user.name) // 遍历临时数组 A，开辟内存生成临时数组 B
  .slice(0, 100) // 截取生成最终数组，A 和 B 变成内存垃圾等待 GC

// 最佳实践：O(n)
const topActiveNames = users
  .reduce((acc, user) => {
    if (user.isActive) {
      acc.push(user.name)
    }
    return acc
  }, [])
  .slice(0, 100)
```

:::

## 4. 强制同步布局的毁灭性打击

DOM 操作本身并不慢，慢的是打破了浏览器的渲染流水线。当你交替进行“**写入样式**”和“**读取几何信息**”时，浏览器为了给你返回最准确的值，会被迫提前进行全页面的重排（Reflow）。

- **致命属性清单**：在 JS 循环中读取 `offsetHeight`、`clientWidth`、`scrollTop`、`getComputedStyle()` 等属性，极易触发强制同步布局。
- **读写分离架构**：使用 FastDOM 等思想，先在循环中集中批量读取所有需要的几何信息，然后再集中批量写入样式。
- **合并 DOM 更新**：大量创建节点时，必须先在内存中使用 `DocumentFragment` 组装完毕，最后一次性挂载到真实 DOM 树上。

:::details 合并更新

```javascript
// 高效的 DOM 批量插入
const fragment = document.createDocumentFragment()

for (const item of list) {
  const li = document.createElement('li')
  li.className = 'list-item'
  li.textContent = item.name
  fragment.appendChild(li)
}

// 仅触发一次重排重绘
container.appendChild(fragment)
```

:::

- **利用 rAF 挂载视觉更新**：将那些涉及频繁样式改动的逻辑，包裹进 `requestAnimationFrame` 中，确保在浏览器下一次真正准备绘制前执行。

:::details rAF+FastDOM思想

```js
//FastDOM思想：统一处理
const boxes = document.querySelectorAll('.box')
const widths = []

// 阶段一：纯粹的【批量读取】
// 连续读取不会触发重复重排，浏览器会直接返回缓存的布局结果
for (let i = 0; i < boxes.length; i++) {
  widths.push(boxes[i].offsetWidth)
}

// 阶段二：利用 rAF 挂载纯粹的【批量写入】
// 把写操作推迟到当前帧的最后时刻，确保下一帧只需重排 1 次
requestAnimationFrame(() => {
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].style.width = widths[i] * 2 + 'px'
  }
})
```

:::

**高频场景：读写交错最常发生在这几个地方**

[width(23,34,43)]

| 场景                    | 交错点                                         | 解法                                                                                 |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| 卡片瀑布流 / 网格自适应 | 循环里 `appendChild` 之后立刻读 `offsetHeight` | 先用 `DocumentFragment` 批量插入，再统一读                                           |
| 表格自适应列宽          | 读 `scrollWidth` → 设 `width` → 再读           | 先收集全部需要的值，再集中写样式                                                     |
| 元素定位 / 居中计算     | 读 `getBoundingClientRect()` → 改 `style.top`  | 全部读进数组，写操作统一放进 `rAF`                                                   |
| 虚拟列表算偏移          | 每次滚动都读 `offsetTop`                       | 缓存高度表 + 前缀和，不读 DOM（见 [虚拟列表](/performanceOptimization/virtualList)） |
| 动画库做布局插值        | 每帧里读写混在一起                             | 进入动画前读一次并缓存，动画期间只写                                                 |

> 判断口诀：**循环里同时出现「读几何属性」和「改样式」，就一定有强制同步布局**。看到这种代码，第一反应应该是拆成两个循环。

## 5. 多线程的终极隔离

前端性能优化的天花板，在于单线程的物理极限。唯一的破局之道是将纯计算任务彻底流放。

- **适用边界**：大文件切片上传哈希计算 (MD5/SHA)、前端 Excel 导出、音视频解码、极其复杂的 WebGL 数据预处理。

:::details 大文件切片哈希（秒传 / 分片上传的前置计算）
:::code-group

```js [hash.worker.js]
import SparkMD5 from 'spark-md5' // 支持 append 的增量哈希（WebCrypto 的 digest 不支持增量）

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB 一片：兼顾读取次数与单次内存峰值

self.onmessage = async e => {
  const { file, chunkSize = CHUNK_SIZE } = e.data
  const spark = new SparkMD5.ArrayBuffer()
  const total = Math.ceil(file.size / chunkSize)

  try {
    for (let i = 0; i < total; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)

      // 关键：一次只把一个分片读进内存，整个大文件永不驻留
      spark.append(await file.slice(start, end).arrayBuffer())

      self.postMessage({ type: 'progress', progress: (i + 1) / total })
    }
    self.postMessage({ type: 'done', hash: spark.end() })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message })
  }
}
```

```js [main.js]
const worker = new Worker(new URL('./hash.worker.js', import.meta.url), {
  type: 'module',
})

// 主线程只负责调度与 UI：算哈希期间页面照样能滚动、能响应点击
function hashFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') onProgress(data.progress)
      else if (data.type === 'done') resolve(data.hash)
      else reject(new Error(data.message))
    }
    worker.onerror = reject
    // File / Blob 的结构化克隆成本极低（只是拿到一份底层数据的引用），直接传不心疼
    worker.postMessage({ file })
  })
}

async function onFileSelected(file) {
  const hash = await hashFile(file, p => {
    progressEl.style.width = `${p * 100}%`
  })

  // 秒传：先问服务端这个哈希是否已存在，命中就一个字节都不用传
  const { uploaded } = await fetch(`/api/exists?hash=${hash}`).then(r =>
    r.json(),
  )
  if (!uploaded) uploadInChunks(file, hash) // 未命中 → 带哈希走分片上传（可断点续传）
}
```

:::

- **通信成本控制**：主线程与 Worker 的 `postMessage` 依赖结构化克隆算法（Structured Clone），传输巨大的 JSON 会带来严重的序列化开销。对于大体积的二进制数据（ArrayBuffer），必须使用**可转移对象 (Transferable Objects)**，实现内存的瞬间转移（零拷贝）。

:::details postMessage

```js
const worker = new Worker('/workers/parser.js')

worker.postMessage(fileBuffer, [fileBuffer])
worker.onmessage = event => {
  renderResult(event.data)
}
```

:::

- **UI 渲染外包**：利用最新的 `OffscreenCanvas`，甚至可以将繁重的 Canvas 图表绘制或 3D 渲染逻辑直接移交到 Web Worker 中执行，彻底解放主线程。

:::details OffscreenCanvas
:::code-group

```js [main.js]
// main.js (主线程)
const canvas = document.getElementById('my-canvas')
// 1. 将普通 Canvas 转换为 OffscreenCanvas (移交控制权)
const offscreen = canvas.transferControlToOffscreen()
// 2. 创建 Web Worker
const worker = new Worker('render-worker.js')
// 3. 将 OffscreenCanvas 作为 Transferable 对象传递给 Worker
// 注意：移交后，主线程将无法再调用 ctx.fillRect 等 API
worker.postMessage({ canvas: offscreen }, [offscreen])
```

```js [render-worker.js]
let ctx
// 监听主线程发来的消息
self.onmessage = function (evt) {
  const offscreenCanvas = evt.data.canvas
  // 1. 获取上下文 (完全在后台线程进行)
  ctx = offscreenCanvas.getContext('2d')
  // 2. 启动渲染循环
  requestAnimationFrame(renderLoop)
}

function renderLoop() {
  // 进行极其复杂的数学运算和绘制
  heavyMathCalculation()
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, 100, 100)
  // 循环调用
  requestAnimationFrame(renderLoop)
}
```

:::

- **工程化提效**：在实际业务中，推荐引入 Google 的 `Comlink` 库，将繁琐的 `postMessage` 封装为优雅的 RPC 异步函数调用。

**高频场景：哪些任务值得被流放**

[width(30,19,51)]

| 任务                      | 典型耗时       | 落地要点                                       |
| ------------------------- | -------------- | ---------------------------------------------- |
| 大文件哈希（秒传、校验）  | 数百 ms ~ 数秒 | 配合 Transferable 传 `ArrayBuffer`，零拷贝     |
| 前端 Excel / CSV 导出     | 数百 ms        | SheetJS 处理大表极易打爆主线程，非常适合放走   |
| 大 JSON 解析 / 序列化     | 数十 ~ 数百 ms | `JSON.parse` 无法切片，只能整体挪走            |
| 图片压缩 / 滤镜 / 水印    | 数百 ms        | `OffscreenCanvas` + `createImageBitmap`        |
| 音视频解码 / 音频波形计算 | 持续占用       | WebAudio + Worker，避免动画掉帧                |
| 复杂图算法 / 地图路径计算 | 不定           | 先评估数据结构化克隆的传输成本，再决定是否值得 |

## 6. 内存泄漏与垃圾回收

V8 的垃圾回收并非毫无代价，老生代（Old Generation）的标记-清除（Mark-Sweep）过程会导致全停顿（Stop-The-World）。频繁的 GC 停顿在视觉上就是无法容忍的“**掉帧**”。

- **斩断游离的 DOM 引用 (Detached DOM)**：组件被销毁后，如果其内部的 DOM 节点依然被全局变量、Redux Store 或闭包所持有，这部分 DOM 及其关联的 JS 对象将永远无法被回收。
- **弱引用的巧妙运用**：在实现 DOM 节点与数据模型的映射缓存时，全面采用 `WeakMap` 和 `WeakSet`。一旦 DOM 被移除，缓存会自动被 GC 清理，无需手动抹除。
- **生命周期清理铁律**：在 React 的 `useEffect` 清理函数或 Vue 的 `onUnmounted` 中，必须且绝对要清除：`setInterval` 定时器、`window/document` 绑定的事件监听、`ResizeObserver` 与 `IntersectionObserver`。
- **规避对象抖动 (Object Churn)**：在 `requestAnimationFrame` 或 `onScroll` 这种每秒执行 60 次的高频热点代码中，绝对禁止声明新的对象字面量或闭包函数。应尽可能在外部提前声明并复用。

**高频泄漏场景速查：**

[width(15,56,29)]

| 场景                    | 为什么会泄漏                                                   | 对策                                              |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| 定时器没清              | `setInterval` 捕获了组件闭包，组件卸载后仍在跑                 | 卸载时 `clearInterval`                            |
| 全局事件没解绑          | `window` / `document` 上的监听持有组件引用                     | `removeEventListener`，且必须传**同一个函数引用** |
| Observer 没断开         | `ResizeObserver` / `IntersectionObserver` 还在观察已卸载的节点 | 卸载时 `disconnect()`                             |
| 游离 DOM (Detached DOM) | 节点已从文档移除，却被全局变量 / 闭包 / 普通 `Map` 持有        | 改用 `WeakMap`，强引用容器要定时清理              |
| 第三方实例没销毁        | 图表、地图、富文本编辑器未调 `dispose()` / `destroy()`         | 卸载时显式销毁，并解绑它挂载的 DOM                |
| 闭包持有大对象          | 回调里顺手引用了整个列表或大 buffer                            | 只捕获真正需要的字段，必要时用 `WeakRef`          |
| 事件监听器反复叠加      | 每次渲染都 `addEventListener` 却不移除（`onScroll` 最典型）    | 用事件委托，或在绑定前先移除                      |

## 7. 性能监控

优化不能盲人摸象，必须建立起严密的监控数据防线。利用 Chrome DevTools 的 Performance 面板与 Memory 火焰图，死磕以下指标：

[width(27,46,27)]

| 核心度量指标               | 观测目标与深度含义                                                             | 优化达标红线                        |
| -------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| **INP (交互到下一次绘制)** | 取代 FID。衡量最差的一次点击、按键事件，直到屏幕画面更新的真实物理延迟。       | **< 200ms** (P75 线上分位值)        |
| **Long Task (长任务次数)** | Performance 面板中标记为红色的任务区块。代表主线程被强行劫持的次数。           | 首屏加载期间 **0 个**               |
| **TBT (总阻塞时间)**       | 从 FCP 到 TTI 之间，所有超过 50ms 的长任务耗时总和的累加。                     | **< 200ms** (Lighthouse 实验室数据) |
| **JS Parse & Compile**     | 脚本下载后，浏览器将其转换为机器码的耗时。体积直接决定此项开销。               | 持续压缩，精简无用 Polyfill         |
| **JS Heap Size (堆内存)**  | 页面闲置并手动触发 GC 后，内存占用是否回落。若呈持续阶梯式上涨，必有内存泄漏。 | 保持平稳，无长期泄露缺口            |

## 8. 常见问题 (FAQ)

### 8.1 为什么 `requestIdleCallback` 一直不执行？

因为它**只在浏览器真正空闲时才调度**：页面有高频动画、持续滚动、或一直有长任务时，空闲帧可能长时间不出现，回调就被无限推迟。

两条对策：

- **必须传 `timeout`**：`requestIdleCallback(fn, { timeout: 2000 })`，超时后浏览器会强制执行一次，防止任务被饿死；
- **区分任务性质**：不能推迟的任务（首屏渲染、用户刚触发的交互）根本不该用它，那是 `scheduler.postTask()` / 直接执行的活。

### 8.2 `requestIdleCallback` 在 Safari 上不可用怎么办？

它至今在 Safari 上仍需前缀或不可用，所以生产代码要有兜底：

```javascript
const idle =
  self.requestIdleCallback ??
  (fn => setTimeout(() => fn({ timeRemaining: () => 0 }), 1))
```

注意兜底版的 `timeRemaining()` 恒为 0——如果你的切片逻辑依赖 `timeRemaining() > 1` 来循环，兜底时就必须换一套「按数量切片」的策略，否则会一行都不执行。更现代的选择是 `scheduler.postTask()`（Chrome 系支持）或直接按固定条数分片。

### 8.3 微任务（`Promise.then`）会把页面卡住吗？

**会**。微任务在当前宏任务结束后、**渲染之前**被强制清空——你往里塞多少，浏览器就得连着跑完才开始渲染。

所以常见误区是「把重计算挪进 `Promise.resolve().then()` 就等于异步了」——其实它比同步执行只晚了一点点，照样阻塞渲染。要让出主线程，必须用**宏任务**（`setTimeout` / `MessageChannel` / `scheduler.yield()`）。

### 8.4 `setTimeout(fn, 0)` 为什么不是 0ms？

规范规定存在**最小延迟钳制**：嵌套层级超过 5 层后，最小间隔被强制拉到 **4ms**；页面处于后台时还会被进一步节流到秒级。

这就是「用 `setTimeout(fn, 0)` 做时间分片」在高频场景下不够快的原因——碎片之间的 4ms 空档会让总耗时明显变长。要更快，用 `MessageChannel` 或 `scheduler.yield()`。

### 8.5 十万条大 JSON 解析卡顿，怎么破？

`JSON.parse` 是**同步且不可切片**的，主线程一旦进去就出不来。三种思路：

- **不解析**：让服务端以流式返回，前端用流式解析（见 [Web Streams](/networkAndBrowsers/browser/webStreams)）边收边处理；
- **挪走**：把字符串丢给 Web Worker 解析，只把结果传回来（大对象记得用 Transferable）；
- **不传**：十万条数据本身就不该一次性给到前端——分页、按需查询、服务端过滤才是根治。

### 8.6 `postMessage` 传大对象很慢，怎么办？

因为默认走**结构化克隆**，等于把整个对象递归复制一遍，对象越大越慢，还会在两边各占一份内存。对策：

[width(39,61)]

| 数据类型                         | 做法                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `ArrayBuffer` / `TypedArray`     | 用 **Transferable**：`postMessage(buf, [buf])`，**零拷贝**，移交后主线程失去所有权 |
| `OffscreenCanvas`、`ImageBitmap` | 同样支持转移，绘制类任务首选                                                       |
| `SharedArrayBuffer`              | 真正共享内存（需跨源隔离响应头），适合高频读写                                     |
| 大型纯数据对象                   | 考虑让 Worker 直接持有数据源，主线程只传「怎么做」的指令                           |

### 8.7 怎么确认页面到底有没有内存泄漏？

- 打开 DevTools → Memory 面板，做一次 Heap snapshot（基线）；
- 反复执行可疑操作（打开/关闭弹窗、切换路由、滚动列表）**10 次左右**；
- 手动点垃圾桶图标触发 GC，再拍第二、第三次快照，用 **Comparison** 视图对比。

判断标准：**次数增加后，同类对象数量是否持续阶梯式上涨**。若每次都涨且不回落，基本可判定泄漏。再顺着 retained size 最大的对象，看是谁（全局变量、闭包、事件监听、`Map`）还持有引用。

> 排查顺序建议：**先看 Detached DOM 节点数**——前端泄漏里有相当一部分都是「DOM 没了，引用还在」。
