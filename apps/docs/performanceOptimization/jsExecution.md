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

## 5. 多线程的终极隔离

前端性能优化的天花板，在于单线程的物理极限。唯一的破局之道是将纯计算任务彻底流放。

- **适用边界**：大文件切片上传哈希计算 (MD5/SHA)、前端 Excel 导出、音视频解码、极其复杂的 WebGL 数据预处理。
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

## 6. 内存泄漏与垃圾回收

V8 的垃圾回收并非毫无代价，老生代（Old Generation）的标记-清除（Mark-Sweep）过程会导致全停顿（Stop-The-World）。频繁的 GC 停顿在视觉上就是无法容忍的“**掉帧**”。

- **斩断游离的 DOM 引用 (Detached DOM)**：组件被销毁后，如果其内部的 DOM 节点依然被全局变量、Redux Store 或闭包所持有，这部分 DOM 及其关联的 JS 对象将永远无法被回收。
- **弱引用的巧妙运用**：在实现 DOM 节点与数据模型的映射缓存时，全面采用 `WeakMap` 和 `WeakSet`。一旦 DOM 被移除，缓存会自动被 GC 清理，无需手动抹除。
- **生命周期清理铁律**：在 React 的 `useEffect` 清理函数或 Vue 的 `onUnmounted` 中，必须且绝对要清除：`setInterval` 定时器、`window/document` 绑定的事件监听、`ResizeObserver` 与 `IntersectionObserver`。
- **规避对象抖动 (Object Churn)**：在 `requestAnimationFrame` 或 `onScroll` 这种每秒执行 60 次的高频热点代码中，绝对禁止声明新的对象字面量或闭包函数。应尽可能在外部提前声明并复用。

## 7. 性能监控

优化不能盲人摸象，必须建立起严密的监控数据防线。利用 Chrome DevTools 的 Performance 面板与 Memory 火焰图，死磕以下指标：

| 核心度量指标               | 观测目标与深度含义                                                             | 优化达标红线                        |
| -------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| **INP (交互到下一次绘制)** | 取代 FID。衡量最差的一次点击、按键事件，直到屏幕画面更新的真实物理延迟。       | **< 200ms** (P75 线上分位值)        |
| **Long Task (长任务次数)** | Performance 面板中标记为红色的任务区块。代表主线程被强行劫持的次数。           | 首屏加载期间 **0 个**               |
| **TBT (总阻塞时间)**       | 从 FCP 到 TTI 之间，所有超过 50ms 的长任务耗时总和的累加。                     | **< 200ms** (Lighthouse 实验室数据) |
| **JS Parse & Compile**     | 脚本下载后，浏览器将其转换为机器码的耗时。体积直接决定此项开销。               | 持续压缩，精简无用 Polyfill         |
| **JS Heap Size (堆内存)**  | 页面闲置并手动触发 GC 后，内存占用是否回落。若呈持续阶梯式上涨，必有内存泄漏。 | 保持平稳，无长期泄露缺口            |
