# requestAnimationFrame 与 requestIdleCallback

动画与高性能渲染的核心是「**和浏览器刷新节奏对齐**」：`requestAnimationFrame`（rAF）让回调在下一次重绘前执行，`requestIdleCallback` 利用帧间空闲执行低优先级任务。

**一句话理解**：**「rAF 把动画『焊』在 60fps 的刷新帧上，requestIdleCallback 把杂活塞进每帧的空闲缝隙。」**

两者都不是「更快的定时器」，而是浏览器**渲染流水线**暴露的两个挂钩点：一个在「帧开始、布局之前」，一个在「帧收尾、还有余粮时」。挂错了再快的代码也会掉帧；挂对了，浏览器自动对齐刷新率、节流、切后台暂停。

## 1. 为什么动画要用 rAF 而不是 `setTimeout` / `setInterval`

[width(16,41,43)]

| 维度       | `setTimeout(16)` / `setInterval` | `requestAnimationFrame`              |
| ---------- | -------------------------------- | ------------------------------------ |
| 执行时机   | 定时器触发，与屏幕刷新**不同步** | 浏览器**下次重绘之前**，与刷新帧同步 |
| 帧率       | 可能丢帧、跳帧、撕裂             | 自动匹配显示器刷新率（通常 60fps）   |
| 后台标签页 | 仍可能执行（浪费性能）           | 自动暂停，切回后恢复                 |
| 节流       | 需手动处理                       | 浏览器自动节流                       |
| 精度       | 受 4ms 钳制、可能堆积            | 回调参数 `timestamp` 高精度          |

**结论**：凡是「逐帧更新视觉」的场景（动画、滚动、拖拽），一律用 rAF。

### 1.1 定时器驱动动画，问题到底出在哪

`setTimeout(fn, 16)` 只保证「**至少** 16ms 后入队」，不保证「16ms 后、屏幕刷新前执行」——与刷新节奏**没有任何同步关系**：

- 写早了，两次改动被合并，中间那帧被吃掉（**跳帧**）；写晚了，本帧样式已采样，只能等下帧（**稳定迟一帧**）。
- 定时器还要和队列里其他任务排队，帧间隔忽长忽短（**忽快忽慢**）。
- 16ms 是「魔数」：只在 60Hz 屏勉强对齐，120Hz 上相当于隔帧更新，144Hz 上更错位。
- 后台标签页里定时器仍被节流着跑（主流浏览器最少约 1s 一次），白白耗电；rAF 随页面隐藏暂停。

rAF 只承诺**「在下一次重绘之前执行」**：不承诺频率，但时机恰好是「改样式最合适」的那一刻，频率由刷新率决定。

## 2. 一帧的完整渲染流程

先看浏览器一帧内做了什么：

```
每一帧（约 16.7ms @60fps）：
  → 输入事件处理（input）
  → requestAnimationFrame 回调
  → 布局 (Layout / Reflow)
  → 绘制 (Paint)
  → 合成 (Composite)
  → [空闲时间] → requestIdleCallback
```

rAF 回调在**布局之前**执行，「读样式 → 写样式」因此能**避免强制同步布局**（读写分离）。

### 2.1 帧预算：16.7ms 是「上限」，不是「配额」

- 一帧预算：60Hz **16.7ms**、120Hz **8.3ms**、144Hz **6.9ms**。
- 帧内**输入处理、rAF 回调、布局、绘制、合成共享这一份预算**：rAF 里跑 20ms 同步计算，本帧就超时，画面被推到下一帧——掉帧。
- 单帧超过 **50ms** 的是**长任务**（long task），既卡动画也拖慢输入响应（INP），在 Performance 面板里显示为红色三角。

### 2.2 帧内的时间语义

帧开始处理渲染的时刻被记为时间戳，原样传给本帧所有 rAF 回调。三条实用结论：

- 同一帧内**所有** rAF 回调拿到**同一个** `timestamp`，哪怕执行时间差几毫秒。
- 它是**帧开始的时刻**而非「回调真正执行的时刻」，故 `performance.now() - timestamp` 即本帧已花掉的时间，可做帧预算自检。
- Web Animations API 的 `document.timeline.currentTime` 与它同源，两套 API 可互相对齐。

## 3. `requestAnimationFrame` 用法

### 3.1 基本循环

```javascript
function animate(timestamp) {
  // timestamp：回调触发时刻的高精度时间戳（毫秒）
  box.style.transform = `translateX(${timestamp % 1000}px)`

  requestAnimationFrame(animate) // 递归调度下一帧
}
requestAnimationFrame(animate)
```

### 3.2 停止动画

```javascript
let rafId
function animate(t) {
  rafId = requestAnimationFrame(animate)
}
rafId = requestAnimationFrame(animate)

// 停止
cancelAnimationFrame(rafId)
```

几个易踩的细节：

- `requestAnimationFrame` **每次调用都返回新的 id**（非 0 整数），一个 id 只对应「这一次排队」。要停必须取消**最新**那个 id，所以赋值要写在回调**内部**。
- 取消已执行过、或已被取消过的 id 是**静默无操作**，不抛异常，清理函数里可放心调用。
- **忘记取消是内存泄漏和耗电的高发区**：rAF 链只要还在跑，闭包引用的 DOM、状态、数组都不会被回收，且每帧都在做无用功。
- 对同一个函数调用两次 `requestAnimationFrame` 会**排两个回调**，产生两条并行循环——「动画越跑越快」的经典成因。启动前先判断是否已在跑。

封成不会重复启动的小对象即可躲开后两个坑：

```js
function createLoop(update) {
  let rafId = 0
  let running = false

  function frame(now) {
    if (!running) return
    update(now)
    rafId = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (running) return // 已经在跑就不再排队，避免两条循环并行
      running = true
      rafId = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(rafId)
    },
  }
}
```

框架里「取消」就是组件的清理函数：

```js
// React：useEffect 的返回值就是清理函数
useEffect(() => {
  let id = requestAnimationFrame(function step(now) {
    update(now)
    id = requestAnimationFrame(step)
  })
  return () => cancelAnimationFrame(id)
}, [])
```

```js
// Vue 组合式 API：在 onBeforeUnmount 里停掉
let rafId = 0

onMounted(() => {
  const step = now => {
    update(now)
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
})

onBeforeUnmount(() => cancelAnimationFrame(rafId))
```

### 3.3 基于时间增量做平滑动画

用 `timestamp` 直接累加会在 120fps 高刷屏上「变快」，应按**时间增量**算：

```javascript
let start = null
function move(timestamp) {
  if (start === null) start = timestamp
  const progress = (timestamp - start) / 1000 // 秒

  box.style.left = Math.min(progress * 200, 200) + 'px' // 每秒移动 200px

  if (progress < 1) requestAnimationFrame(move)
}
requestAnimationFrame(move)
```

### 3.4 实现一个通用补间动画

```javascript
function tween({ duration, from, to, onUpdate }) {
  const start = performance.now()
  function step(now) {
    const t = Math.min((now - start) / duration, 1)
    const eased = t * (2 - t) // easeOut
    onUpdate(from + (to - from) * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

tween({
  duration: 1000,
  from: 0,
  to: 200,
  onUpdate: v => (box.style.left = v + 'px'),
})
```

### 3.5 回调参数：高精度时间戳

`timestamp` 是 `DOMHighResTimeStamp`，单位毫秒、可能带小数。四件最易误解的事：

- **时间原点是导航开始的那一刻**，与 `performance.now()` 同源，**不是** `Date.now()` 那种 Unix 时间戳；显示「真实时间」得另取。
- **同一帧所有 rAF 回调收到同一个值**，它表示这一帧**开始处理渲染**的时刻，不是回调执行时刻。
- **精度被故意降低**：防侧信道攻击，浏览器会归整到 0.1ms 甚至 1ms 以上，别用它测极短耗时。
- **不受系统时钟调整影响**，`Date.now()` 会（改时区、系统校时）。动画计时一律用它或 `performance.now()`。

```js
function step(timestamp) {
  const spent = performance.now() - timestamp
  if (spent > 8) {
    // 本帧已经花掉 8ms 以上，留给布局和绘制的时间不多了
    console.warn('帧预算告急', spent.toFixed(2))
  }
  requestAnimationFrame(step)
}
requestAnimationFrame(step)
```

### 3.6 delta 钳制与固定步长

§3.3 避开了「高刷屏上变快」，但还有两个隐蔽问题：

- **掉帧时动画会「变慢」**：基于 `elapsed` 算位置的写法能自动追上；「每帧加一点」的写法会少走一段。
- **切回标签页时会「瞬移」**：页面隐藏期间 rAF 不触发，切回来的第一帧 `now - last` 可能是几秒，物体直接跳到终点，物理参数甚至会炸开。

所以基于增量的动画必须**钳制 delta**：

```js
let lastTime = 0
function step(now) {
  if (lastTime === 0) lastTime = now
  // 切回前台时 delta 可能是好几秒，钳制到 100ms 以内，避免位置瞬移
  const delta = Math.min(now - lastTime, 100)
  lastTime = now

  x += speed * (delta / 1000) // speed 的单位是 px/秒，与帧率无关
  box.style.transform = `translateX(${x}px)`

  if (x < limit) requestAnimationFrame(step)
}
requestAnimationFrame(step)
```

每帧做**物理模拟**（弹球、刚体、碰撞）则固定步长更合适：用累加器把时间切成恒定 1/60 秒，结果与刷新率、偶发掉帧无关，也更易复现。

```js
const STEP = 1000 / 60 // 恒定步长：模拟每秒推进 60 次
let lastFrame = 0
let accumulator = 0

function frame(now) {
  const delta = Math.min(now - lastFrame, 250) // 钳制，避免切回前台时补算上千帧
  lastFrame = now
  accumulator += delta

  while (accumulator >= STEP) {
    simulate(STEP / 1000) // 每次固定推进 1/60 秒
    accumulator -= STEP
  }

  render(accumulator / STEP) // 用剩余比例做插值，画面才不会一顿一顿
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```

`while` 配 delta 钳制还挡住了**「死亡螺旋」**：单帧耗时超过步长后补算会越补越多、越补越慢；钳住单帧最大补算量等于给循环设了下限。

### 3.7 缓动函数（easing）

§3.4 的 `const eased = t * (2 - t)` 就是缓动函数：把线性进度 `t ∈ [0, 1]` 映射成非线性进度。现实里没有东西会瞬间加速又瞬间刹停，匀速动画看着总是很「塑料」。

缓动函数满足 `f(0) = 0`、`f(1) = 1`，中间怎么弯都行：

- `linear`：匀速，最机械；
- `easeOutQuad`：`t * (2 - t)`，起步快、收尾慢，最常见的位移曲线；
- `easeInQuad`：`t * t`，起步慢，适合「离场」；
- `easeInOutQuad`：两头慢、中间快，适合位置切换；
- `easeOutCubic`：`1 - (1 - t) ** 3`，收尾比 Quad 更顺滑；
- `easeOutBack`：会冲过头一点再弹回来，用于强调。

收进一个查找对象，动画代码里只换名字：

```js
const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeOutBack: t =>
    1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
}

const ease = easing.easeOutCubic
const progress = ease(Math.min((now - start) / duration, 1)) // 0 → 1
```

CSS 里也有同一套：`ease-out` 约等于 `cubic-bezier(0, 0, 0.58, 1)`，只是 CSS 用贝塞尔描述、JS 用函数——**CSS 能表达的曲线 rAF 都能复现，反之不成立**，JS 缓动可任意弯曲甚至带弹性。

**缓动作用在「进度」上，不作用在「时间」上**：把时间乘个系数只会让动画变快，不会让它变顺。

### 3.8 rAF 的兼容性与降级

rAF 兼容性极好：各现代浏览器与 IE10+ 原生支持，无需前缀；本章真正需要垫片的是后面的 `requestIdleCallback`。

非要覆盖更老的环境可用 `setTimeout` 粗略模拟，但它**做不到**「与刷新对齐」，只是「大概每 16ms 跑一次」：

```js
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  function (cb) {
    return setTimeout(() => cb(performance.now()), 16)
  }

window.cancelAnimationFrame =
  window.cancelAnimationFrame ||
  function (id) {
    clearTimeout(id)
  }
```

`requestAnimationFrame` 是**浏览器专属**的：Node.js（SSR、单测）里不存在，调用即抛 `ReferenceError`。启动循环要放在「确定跑在浏览器里」处——React `useEffect`、Vue `onMounted` 或 `typeof window !== 'undefined'` 守卫，别写在模块顶层。

### 3.9 rAF 的常见误用

- **用 id 判断「循环是否在跑」**：id 每次排队都会变，`if (rafId)` 第二轮就失效。要判断状态就自己维护 `running` 标志（见 §3.2 的 `createLoop`）。
- **一帧里反复排队**：在回调里对同一个函数调用两次 `requestAnimationFrame`，回调数量每帧翻倍，几百帧后页面直接卡死。
- **拿 rAF 当 `setInterval` 用**：用它轮询接口、做倒计时，页面切到后台循环就停摆，逻辑「少算一段时间」。非视觉的定时任务该用定时器。
- **在回调里做重活**：排序大数组、解析大 JSON、同步读写 `localStorage` 都会变成掉帧的长任务。计算挪到 Web Worker 或 `requestIdleCallback`，rAF 里只留「把结果写进样式」，参见 [JS 执行与长任务](/performanceOptimization/jsExecution)。
- **读写交替**：先 `getBoundingClientRect()` 再改样式、再读、再改——每次「写后读」都强制一次同步布局。正确姿势是「先集中读完，再集中写」。
- **改了会触发重排的属性**：`left` / `top` / `width` / `height` 每帧都要重新布局，而 `transform` / `opacity` 只走合成。

本节例子里 `left` 只为一目了然，`transform` 才是生产写法。

## 4. `requestIdleCallback`：利用空闲时间

一帧流程：事件处理 → rAF → 布局 → 绘制 → 合成。这些工作若提前完成，到下一帧之间就是「空闲时间」，`requestIdleCallback` 用来执行**不紧急的**任务。

```javascript
requestIdleCallback(
  deadline => {
    // deadline.timeRemaining()：本帧剩余空闲时间
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift()
      task()
    }
  },
  { timeout: 1000 },
) // 若一直空闲，最多等 1000ms 强制执行
```

`requestIdleCallback` 的回调**不保证被执行**：这一帧忙得连喘气的空都没有时，浏览器可以整帧跳过，一直拖到 `timeout` 到点才强制执行。所以它只适合「可有可无、晚一点也没关系」的工作。

### 4.1 `deadline` 对象

[width(44,56)]

| 属性              | 说明                     |
| ----------------- | ------------------------ |
| `timeRemaining()` | 本帧剩余空闲时间（毫秒） |
| `didTimeout`      | 是否因超时被强制执行     |

两个值都只是**估算**，用的时候守住两条底线：

- `timeRemaining()` 随回调执行而减少，循环条件里必须**重新调用**，不能先存进变量。
- 回调一旦开始就**不会被抢占**，浏览器无法中途打断。某个任务跑了 100ms，这一帧照样掉帧——所以每个任务都要足够小（理想 1ms）。

### 4.2 `timeout` 选项与 `didTimeout`

不传 `timeout` 时，页面一直很忙的话回调**可能永远不执行**。`timeout` 即「最长等待时间」：到期后不管有无空闲都强制执行，代价是可能插在帧中间**造成掉帧**。

`timeout` 是「确定性」与「不打扰渲染」的取舍：必须做完的清理、上报给 `timeout` 兜底，锦上添花可以不给。

```js
requestIdleCallback(
  deadline => {
    if (deadline.didTimeout) {
      // 超时强制执行：只做最关键的一件事，剩下的重新排队
      flushCriticalReport()
      return
    }
    while (deadline.timeRemaining() > 0 && queue.length > 0) {
      queue.shift()()
    }
  },
  { timeout: 2000 },
)
```

`didTimeout` 为 `true` 时 `timeRemaining()` 通常只剩 0：不要再假设有空闲，把这次回调当作「最后一次机会」，只做最关键那件。

### 4.3 适用场景

预加载、数据上报、埋点、非关键初始化、[虚拟列表](/performanceOptimization/virtualList) 的懒计算。

反过来这些**不适合**放进 idle 回调：要立刻上屏的样式改动（用 rAF）、必须按时执行的逻辑（用定时器或 `timeout`）、一跑几百毫秒的大任务（拆片或丢给 Web Worker）。

大任务拆成小片则是典型用法：

```js
function chunkedProcess(items, handle, done) {
  const run = deadline => {
    while (deadline.timeRemaining() > 0 && items.length > 0) {
      handle(items.shift())
    }
    if (items.length > 0) {
      requestIdleCallback(run) // 还有剩，等下一个空闲时段
    } else if (done) {
      done()
    }
  }
  requestIdleCallback(run)
}
```

### 4.4 兼容性垫片

`requestIdleCallback` 目前**只有 Chrome 支持**，Firefox/Safari 需用 `setTimeout` 降级：

```javascript
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    const start = Date.now()
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      })
    }, 1)
  }
```

垫片只是**用一个 1ms 的宏任务假装「有空闲」**，`timeRemaining()` 返回「离 50ms 预算还剩多少」，并非真实帧空闲时间。`50` 是约定值，实际项目通常调小到 5~16ms，否则一次「空闲任务」就能跑满 50ms，反而把帧撑爆。

更新的替代方案是 Chrome 的 `scheduler.postTask` / `scheduler.yield`（主动让出主线程），或 `MessageChannel` 切成多个宏任务。使用前先做能力判断，不行再降级：

```js
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(doWork, { timeout: 2000 })
} else {
  setTimeout(doWork, 0) // 降级：至少保证会执行
}
```

### 4.5 与 rAF 的分工：先渲染，再算账

同一帧里三件事先后固定：rAF 回调（改样式）→ 布局 / 绘制 / 合成 → 空闲时间（idle 回调）。由此得到很稳的分工：

- **要让人看见的**放在 rAF 里——改样式、画 Canvas；
- **不看见也要跑的**丢给 idle——上报、打点、预计算、缓存预热；
- 两者协作时，rAF 只做动画本身，把这一帧的统计数据攒起来，等空闲时段批量处理：

```js
const stats = []

function frame(now) {
  render(now)
  stats.push(now) // 只记录，不做重活
  requestAnimationFrame(frame)
}

requestIdleCallback(deadline => {
  if (stats.length === 0) return
  report(stats.splice(0, stats.length)) // 空闲时批量上报
})

requestAnimationFrame(frame)
```

反过来不行：在 idle 回调里改样式，改动要等下一帧才被绘制，视觉上「慢半拍」。

## 5. 帧调度三兄弟的定位

[width(42,23,35)]

| API                      | 时机         | 用途                 |
| ------------------------ | ------------ | -------------------- |
| `setTimeout/setInterval` | 定时器队列   | 普通异步、延迟任务   |
| `requestAnimationFrame`  | 下次重绘前   | 动画、视觉更新       |
| `requestIdleCallback`    | 帧的空闲时间 | 非紧急、可延后的杂活 |

三者放在一起，选型问题也就浮出来了：什么时候用谁、与 CSS 动画怎么分工、在滚动 / 拖拽 / 尺寸变化场景里怎么落地。

### 5.1 选型：问自己四个问题

1. 这件事**必须**在下一次重绘前完成吗？（要改视觉）→ `requestAnimationFrame`
2. 这件事**最好尽快**完成，但改了 DOM 也不需要立刻看到吗？→ 微任务（`Promise.then` / `queueMicrotask`）
3. 这件事**可以慢慢做**、晚几百毫秒也无所谓吗？→ `requestIdleCallback`
4. 这件事**要在未来的某个时间点**发生吗？→ `setTimeout` / `setInterval`

第 2 条要强调：微任务优先级高于所有宏任务（包括 rAF），但**不适合做视觉更新**——它跑在布局与绘制之前，样式尚未提交，频繁改动只会让你和浏览器白忙一场。

### 5.2 与其他动画方案的对比

rAF 只是「逐帧自己算、自己画」这一类的代表。

[width(21,21,33,25)]

| 方案                                      | 谁在推进每一帧                                    | 能做的事                                                                                    | 主要限制                                       |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| CSS `transition` / `animation`            | 浏览器（`transform`、`opacity` 可交给合成器线程） | 声明式地描述「从 A 到 B」、循环、延迟                                                       | 只能改有限属性；难以做依赖运行时数据的逐帧计算 |
| Web Animations API（`element.animate()`） | 浏览器                                            | 拿到 `Animation` 对象，可 `play` / `pause` / `reverse`、改 `currentTime`、调 `playbackRate` | 仍是「关键帧模型」，复杂逐帧逻辑要配合 rAF     |
| `requestAnimationFrame`                   | 你的代码，跑在主线程                              | 每一帧想做什么都行：改样式、画 Canvas、算物理                                               | 一帧只有十几毫秒，写多了就掉帧                 |
| `setTimeout` / `setInterval`              | 定时器队列                                        | 同样能逐帧改写样式                                                                          | 与刷新不同步、后台不暂停、精度受钳制           |
| Canvas / WebGL 绘制循环                   | 通常由 rAF 驱动                                   | 完全自绘，元素数量再多也不怕                                                                | 失去 DOM 的可访问性、事件与 CSS 能力           |

选型顺序可以概括成一句话：**能用 CSS 表达就用 CSS，需要程序化控制就上 Web Animations API，只有需要逐帧计算或逐帧绘制时才用 rAF。**

两点补充：

- Web Animations API 和 rAF **并不对立**：`Animation.currentTime` 与 rAF 的 `timestamp` 同源（`document.timeline`），可以用 WAAPI 跑动画、rAF 读进度去驱动 Canvas。
- 滚动驱动动画可用 `ScrollTimeline` / `ViewTimeline` 交给合成器（Chrome 115+），绕开主线程；不支持时退回 rAF + `scroll`（见 §5.3）。

### 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流

**（1）滚动**

`scroll` 的触发频率**可以高于帧率**（一次快速滚动一帧可能派发好几次），其中大量重复计算根本看不到。用 rAF 做「一帧最多执行一次」的节流，是最高频的 rAF 用法：

```js
let scheduled = false

function onScroll() {
  if (scheduled) return // 本帧已经排过了，直接忽略
  scheduled = true
  requestAnimationFrame(() => {
    update() // 一帧最多执行一次
    scheduled = false
  })
}

// passive: true 表示这个监听器不会调用 preventDefault，
// 浏览器可以立刻开始滚动，不必等监听器执行完
window.addEventListener('scroll', onScroll, { passive: true })
```

`{ passive: true }` 很关键：对 `touchstart`、`touchmove`、`wheel` 这类**可取消**的高频事件，非 passive 监听器会让浏览器先等你执行完（它不知道你会不会 `preventDefault()`），滚动因此变「钝」。`scroll` 本身不可取消，`passive` 对它无影响，但写上无害，也能避免复制到别的事件上时漏掉。

**（2）拖拽**

`pointermove` / `mousemove` 同理：坐标**先记下来**，「算 + 写」放进 rAF，一帧最多更新一次；拖拽手感几乎取决于此。

**（3）ResizeObserver**

[ResizeObserver](/networkAndBrowsers/browser/observerApi/resizeObserver) 的回调在**布局之后、绘制之前**执行，是「已经能读到新尺寸」的最佳时机；但在回调里立刻改样式会触发新一轮布局，浏览器直接报 `ResizeObserver loop completed with undelivered notifications`。稳妥做法：回调里只记录数值，改样式交给 rAF。

```js
const sizes = new Map()
let dirty = false

const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    sizes.set(entry.target, entry.contentRect) // 只记录，不写样式
  }
  if (!dirty) {
    dirty = true
    requestAnimationFrame(() => {
      applySizes(sizes) // 下一帧统一写入
      dirty = false
    })
  }
})

ro.observe(box)
```

**（4）IntersectionObserver**

[IntersectionObserver](/networkAndBrowsers/browser/observerApi/intersectionObserver) 解决「看不见的动画还在烧 CPU」：元素离开视口时停掉 rAF 循环，回到视口再启动。配合 §3.2 的 `createLoop` 只要几行：

```js
const io = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) loop.start()
    else loop.stop()
  }
})

io.observe(canvas)
```

### 5.4 性能与调试清单

- **优先改 `transform` 和 `opacity`**：它们只走合成，不触发布局与重绘；`left` / `top` / `width` / `height` / `margin` 每帧都要重新布局。
- **读写分离**：一帧里先集中读（`offsetWidth`、`getBoundingClientRect`、`getComputedStyle`），再集中写。
- **单帧别超预算**：60Hz 16.7ms，120Hz 8.3ms。rAF 回调里的同步计算一超预算就必然掉帧，大计算要拆到 `requestIdleCallback` 或 Web Worker。
- **`will-change` 不要滥用**：它提示浏览器提前提升图层，但每个图层都占显存，用多了反而更慢。只在动画开始时加、结束后移除。
- **用工具验证，而不是靠猜**：Performance 面板看 Frames 轨道有无红块（掉帧）、Main 轨道有无长任务；Rendering 面板勾上 Paint flashing 和 Layer borders，就能看出改的属性是否触发重绘。
- **不动的时候就停**：元素不可见（`IntersectionObserver`）、页面不可见（`visibilitychange`）、动画已经结束（`t >= 1`）时都要 `cancelAnimationFrame`。

### 5.5 兼容性与运行环境

[width(36,32,32)]

| API                                       | 支持情况                                  | 备注                         |
| ----------------------------------------- | ----------------------------------------- | ---------------------------- |
| `requestAnimationFrame`                   | 所有现代浏览器，IE10 及以上               | 无需前缀，可以直接用         |
| `cancelAnimationFrame`                    | 与 rAF 同步                               | 取消无效 id 是静默无操作     |
| `requestIdleCallback`                     | Chrome / Edge 47+；Firefox、Safari 未实现 | 必须准备垫片或降级方案       |
| `setTimeout` / `setInterval`              | 全平台                                    | 后台标签页被节流到约 1s 一次 |
| `element.animate()`（WAAPI）              | 现代浏览器全支持                          | IE 不支持                    |
| `ResizeObserver` / `IntersectionObserver` | 现代浏览器全支持                          | IE 不支持，老项目需要垫片    |

还有两个容易忽略的运行环境问题：

- **SSR / Node.js 里没有 `requestAnimationFrame`**（见 §3.8），模块顶层调用会抛 `ReferenceError`，必须放进「只在浏览器执行」的生命周期或环境守卫。
- **`requestIdleCallback` 只在浏览器主线程存在**，Web Worker 里没有；Worker 里分片要用 `setTimeout` 或 `MessageChannel`。

### 5.6 后台标签页、首帧与 `document.hidden`

- **页面隐藏时 rAF 会停**：页面不可见（切标签页、最小化、被完全遮挡）时浏览器不再产出新渲染帧，回调随之暂停，切回前台自动恢复。这是它相对定时器最大的优势——省电不用你操心。
- **但「恢复」有代价**：暂停期间真实时间照常流逝，恢复后第一帧时间戳会跳一大截。基于 `start` 的进度公式天然安全，基于 delta 累加的**必须钳制**（见 §3.6）。
- **`document.hidden` 与 `visibilitychange`**：rAF 会自动暂停，但你自己的状态不会——「按住方向键移动」的按键状态、用 `setInterval` 跑的计时器。要在这些时机主动暂停与校准：

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    loop.stop() // 顺便停掉配套的定时器、轮询、音频
  } else {
    loop.start()
  }
})
```

- **首帧的时间戳不是 0**：可能是几百毫秒甚至几秒（首屏渲染优先），所以 §3.3 里用 `if (start === null) start = timestamp` 记起点，而不是假设第一帧是 t=0。
- **「等布局稳定」可以用 rAF**：`requestAnimationFrame(() => { ... })` 常用来「让浏览器先消化掉刚才的 DOM 改动」，回调触发时本帧样式已提交，读到的尺寸是新的。但读之前若还有未处理的样式改动，浏览器仍会插入一次同步布局，「集中读、再集中写」的纪律不能丢。
- **确实要在后台继续跑的工作**（同步、心跳、音频）不要用 rAF 或短定时器硬顶——它们要么被暂停、要么被节流，应交给 Web Worker，或接受节流规则。

## 6. 总结

- 动画用 rAF：与刷新帧同步、自动暂停、高精度时间戳。
- 动画逻辑基于**时间增量**，避免不同刷新率下速度不一致；切回前台的 delta 要**钳制**，物理模拟更适合**固定步长 + 累加器**。
- `requestAnimationFrame` 每次调用都返回**新的 id**，要停必须取消最新那个；组件卸载、元素不可见、动画结束时都别忘 `cancelAnimationFrame`，重复启动会并行出多条循环。
- 缓动函数把线性进度映射成非线性进度（`f(0) = 0`、`f(1) = 1`），动画「顺不顺」多半取决于它，而不是帧率。
- 非紧急任务用 `requestIdleCallback`，注意兼容性垫片；`deadline` 只是估算、回调不会被抢占，所以每个任务都要足够小，必要时用 `timeout` 保底。
- 方案选择顺序：**CSS 能表达的用 CSS → 需要程序化控制用 Web Animations API → 需要逐帧计算或绘制才用 rAF**。
- 三兄弟分工明确：定时器管异步、rAF 管动画、idleCallback 管杂活；微任务排在它们之前，但不适合做视觉更新。

## 7. 常见问题 (FAQ)

### 7.1 rAF 的回调一定每秒执行 60 次吗？

**不一定**。rAF 匹配**显示器的刷新率**：60Hz 屏约 60 次/秒，120Hz 屏约 120 次/秒，且后台标签页会暂停。所以动画逻辑必须**基于时间增量**而非固定步长。

- 换算：60Hz 约 16.7ms/帧，120Hz 约 8.3ms/帧，144Hz 约 6.9ms/帧。
- 掉帧、长任务、页面隐藏，都会让「每秒执行次数」低于刷新率。
- 想验证实际频率，应在回调里统计相邻两次 `timestamp` 的差值，而不是数一秒里执行了多少次。

### 7.2 多个 rAF 回调会在同一帧执行吗？

会。浏览器在一帧内**合并**所有 rAF 回调一起执行（在布局/绘制之前），这也是它流畅的原因之一。

- 同一帧里所有回调拿到的是**同一个 `timestamp`**，哪怕执行时刻相隔几毫秒。
- 「合并」的只是执行时机，不是回调本身：对同一个函数调用两次 `requestAnimationFrame` 会排两个回调，两个都执行。

### 7.3 为什么 `setInterval(fn, 0)` 实际不是 0ms？

浏览器对 `setTimeout/setInterval` 有 **4ms 最小间隔钳制**（嵌套层级越深越大），且受事件循环调度影响，无法保证精确。要「尽快」或「跟帧」用 rAF，要「空闲」用 requestIdleCallback。

- 后台标签页里定时器会被进一步节流（主流浏览器最少约 1s 一次），而 rAF 直接暂停。
- 要「当前任务结束后立刻执行」用微任务 `queueMicrotask` / `Promise.resolve().then()`——比定时器和 rAF 都早，但正因为早，不适合做视觉更新。

### 7.4 rAF 里读样式再写样式为什么能避免强制回流？

rAF 回调在**布局之前**执行，本帧内所有 rAF 的「读」都读到上一帧的结果，「写」都累积到本帧布局一次性计算，避免了「读-写-读-写」触发的多次强制同步布局。

- 前提是**读和写都在 rAF 里**：只要有一次「写完之后立刻读」落在同一帧内，浏览器就必须同步布局一次。
- 自查：在 Performance 面板里搜 `Layout`，一帧里出现多次就是读写交替了。

### 7.5 `cancelAnimationFrame` 传入无效的 id 会报错吗？

- **不会**。取消已执行过、或已被取消过的 id 是**静默无操作**，清理函数里可以无条件调用。
- 但「不报错」不等于「可以忘记取消」：rAF 链只要还在跑，闭包、DOM 引用、每帧的计算就都还在，是内存泄漏和耗电的高发区。
- 判断循环有没有在跑，要维护自己的 `running` 标志，而不是检查 id——id 每次排队都会变。

### 7.6 从后台切回前台，动画为什么会「跳一下」？

- 页面隐藏期间 rAF 完全暂停，但**真实时间照常流逝**，恢复后第一帧的 `now - last` 可能是几百毫秒甚至几秒。
- 基于 delta 累加的动画会一次性补上这段距离，表现为「瞬移」；物理模拟还可能因为补算太多帧而卡死（死亡螺旋）。
- 解决办法是**钳制 delta**（如 `Math.min(delta, 100)`），再配合 `visibilitychange` 决定暂停还是校准。

### 7.7 后台标签页里 rAF 和 `setInterval` 分别会怎样？

- **rAF：暂停**。页面不可见时不产生新的渲染帧，回调不再执行，切回前台自动恢复——这正是「用 rAF 做动画更省电」的原因。
- **`setInterval` / `setTimeout`：继续执行，但被节流**。主流浏览器把后台标签页的定时器限制到最少约 1s 一次，逻辑仍在悄悄消耗 CPU 和电量，精度也很差。
- 所以「后台也要跑」的逻辑应该明确交给 Web Worker，或接受被节流的事实，不要指望 rAF。

### 7.8 `requestIdleCallback` 的 `timeout` 到点了会怎样？

- 回调会被**强制执行**，此时 `deadline.didTimeout` 为 `true`，而 `timeRemaining()` 通常只剩 0。
- 它可能被插在帧中间执行，因此**可能造成掉帧**——这正是 `timeout` 的代价：用一点流畅度换「一定会执行」。
- 实践建议：`timeout` 只给到「最晚什么时候必须做」的量级（比如上报 2000ms），并在 `didTimeout` 分支里只做最关键的那件事，其余重新排队。
