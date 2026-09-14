---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# **事件循环 (Event Loop) 和任务队列 (Task Queue)**

**JavaScript 是单线程语言**，任意时刻只能执行一个任务；**`浏览器`** 和 **`Node.js`** 却能高效处理 **`I/O`**、定时器等耗时操作而不“**卡死**”，靠的就是**事件循环**。

## **1. 为什么 JavaScript 是单线程？**

- 单线程是为了简化浏览器脚本语言的复杂性，避免多线程并发操作 `DOM` 时出现竞态条件、死锁等问题。
- 为弥补单线程的**阻塞**问题，浏览器用事件循环 **`(Event Loop)`** + **`异步`**实现了**异步非阻塞**的 **`I/O`** 模型，兼顾简单性、安全性与高并发处理能力。

## **2. 核心概念**

- **调用栈 (`Call Stack`)**：一个**后进先出** `(LIFO)` 的结构，存储正在执行的**执行上下文** `(Execution Contexts)`：函数被调用时推入，执行完毕弹出，同步代码就在这个栈中执行。

  ![Logo](/img/stack.png)

- **`Web API` (或 `Node.js API`)**：浏览器（或 `Node.js`）提供的、独立于 JS 引擎的**多线程**环境，负责处理**异步、耗时**的操作。JS 引擎遇到**异步**任务不会等待，而是交给 `Web APIs` 并注册**回调函数**，然后继续执行调用栈里的**同步代码**，因而**不阻塞**主线程。例如：
  - `setTimeout()` 和 `setInterval()` 用于定时器
  - `fetch()` 和 `XMLHttpRequest` 用于网络请求
  - DOM 事件监听器（如 `addEventListener`）

    ![Logo](/img/eventLoopFirst.png)

- **同步任务(Synchronous Tasks)和异步任务(Asynchronous Tasks)：** 前者在主线程上按顺序执行，后者指耗时性的任务，不会阻塞主线程。
- **任务队列 (`Task Queue / Callback Queue`)**：一个先进先出 (`FIFO`) 的结构，存放已完成异步任务对应的回调函数。`Web API`（或 `Node.js API`）处理完**异步任务**后不会立即执行**回调函数**，而是把它放入**任务队列**中**排队等待**。队列按优先级分为**宏任务队列** (`MacroTask Queue`) 和**微任务队列** (`MicroTask Queue`)，后者**优先级更高**，存放**微任务** (`MicroTasks`)，在宏任务执行完之后、下一个宏任务开始之前执行。

  ![Logo](/img/queue.png)

- **事件循环(`Event Loop`)**：一个持续运行的机制，负责“**监视**”调用栈和任务队列：一旦调用栈为空，就取出任务队列中的一个任务压入调用栈执行。

  ![Logo](/img/eventLoopSecond.png)

## **3. 为什么需要任务队列？**

JavaScript 是单线程的，却要处理大量异步操作（用户交互、网络请求、定时器）。任务队列就是**存放异步回调**的“**等候区**”，是连接**异步 API** 与 **JS 主线程**的枢纽。

## **4. 任务队列的分类：宏任务与微任务**

任务队列并非只有一个，而是分成了两种主要类型，这是理解现代 JavaScript 异步行为**最关键的部分**。

### **4.1 宏任务队列 (Macrotask Queue / Task Queue)**

- **定义**: 存放宏任务回调的队列。
- **常见的宏任务源**:
  - **`<script>` (整体代码)**: 整个 JS 文件的执行就是第一个宏任务。
  - **`setTimeout()`**
  - **`setInterval()`**
  - **`setImmediate()`** (仅 Node.js)
  - **I/O 操作**: 文件读写、网络请求 (`fetch`, `AJAX`) 等。
  - **UI 渲染**: 两次宏任务之间浏览器可能重绘和回流。
  - **用户交互事件**: `click`, `scroll`, `input` 等。

- **特点**:
  - 每个宏任务都在一个独立的事件循环“**滴答**”(tick) 中执行，之间可能穿插 UI 渲染。

### **4.2 微任务队列 (Microtask Queue)**

- **定义**: 存放微任务回调的队列，**执行优先级更高**。
- **常见的微任务源**:
  - **`Promise.then()`**
  - **`Promise.catch()`**
  - **`Promise.finally()`**
  - **`async/await`** (`await` 后面的代码)
  - **`MutationObserver`**: 监听 DOM 树的变化。
  - **`process.nextTick()`** (仅 Node.js)：严格说它不属于微任务，而是优先级更高的独立 `nextTick` 队列。

- **特点**:
  - 微任务在**当前宏任务执行结束后、下一个宏任务开始前**被立即执行。
  - 事件循环会**一次性清空**整个微任务队列：执行中产生的新微任务会排到队列末尾，并在**同一轮**中执行完毕。
  - 微任务的执行**不会**被 UI 渲染打断。

## **5. 事件循环(`Event Loop`)**

### **5.1 浏览器的事件循环**

- 所有同步任务都在主线程上执行（初始时是 `<script>` 里的代码，即宏任务队列中**最老**的任务），形成**执行栈** (`Execution Context Stack`)。
- 异步任务被交给 `Task Table`（异步处理模块），有了结果后其回调被移入任务队列。
- 同步任务执行完毕后，引擎读取微任务队列，把其中的任务依次压入执行栈，直到队列变空。这个过程是“**霸道**”的：执行中产生的新微任务会被添加到队列末尾，并在这一轮中全部执行完毕。
- 微任务队列清空后，浏览器判断是否需要进行 UI 渲染（重绘/回流）——这一步不是每次循环都发生，取决于屏幕刷新率、页面性能等。
- 最后从宏任务队列中取出下一个任务，开始新一轮循环 (tick)，如此往复就是**事件循环**。

**总结：** 执行一个宏任务 -> 清空整个微任务队列 -> （可能进行渲染）-> 执行下一个宏任务

![Logo](/img/eventLoopThird.png)

```js
console.log(1)
setTimeout(() => {
  console.log(2)
  Promise.resolve().then(() => {
    console.log(3)
  })
})

new Promise((resolve, reject) => {
  console.log(4)
  resolve(5)
}).then(data => {
  console.log(data)
})

setTimeout(() => {
  console.log(6)
})

console.log(7)
// 1 4 7  5 2 3 6
```

### **5.2 Node.js 的事件循环**

和浏览器一样，Node.js 也是单线程的，同样采用事件驱动、非阻塞 I/O 模型，事件循环是其核心，由 libuv 库提供，模型比浏览器更复杂、更结构化。

#### 5.2.1 **Node.js 事件循环的六个阶段**

Node.js 事件循环是一个**分阶段**的循环过程，每轮循环（一个 "**tick**"）按顺序经过以下六个主要阶段：

![Logo](/img/nodejs.png)

- **timers (定时器)**: 执行 `setTimeout()` 和 `setInterval()` 的回调。
- **I/O callbacks (待定回调)**: 某些系统操作（如 TCP 错误）的回调。
- **idle, prepare (空闲、准备)**: 内部使用。
- **poll (轮询)**:
  - 检查新的 I/O 事件。
  - 执行 I/O 相关的回调（文件读写、网络请求等）。
  - 存在 `setImmediate()` 回调且 `poll` 阶段为空时，事件循环会直接跳到 `check` 阶段。
- **check (检查)**: 执行 `setImmediate()` 的回调。
- **close callbacks (关闭回调)**: 执行 `socket.on('close', ...)` 等回调。

#### 5.2.2 **Node.js 中的微任务 (Microtasks)**

微任务的优先级**高于宏任务**，因此每个阶段结束、进入下一个阶段前都会先清空微任务队列。

- **常见的微任务来源**:
  - **`Promise.prototype.then()`**, **`.catch()`**, **`.finally()`**: Promise 回调。
  - **`process.nextTick()`**: 这是一个 Node.js 特有的微任务，**优先级最高**，它会在当前操作结束之后、下一个事件循环阶段开始之前立即执行，甚至比 Promise 回调还要早。
  - **`async/await`**: `await` 后面的代码以及 `async` 函数返回的 Promise 也是微任务。
  - **`queueMicrotask()`**: ES 标准提供的显式创建微任务的方法。

* **微任务的特点**:
  - **高优先级**: 当前宏任务执行完毕后，待处理的微任务会立即执行，直到微任务队列清空。
  - **阻塞性**: 微任务过多或执行时间过长，会阻塞下一个宏任务阶段的进入，导致事件循环停滞。

#### 5.2.3 **Node.js 中的宏任务 (Macrotasks)**

宏任务是构成事件循环各阶段的主要任务单元，每个阶段都处理一个或多个宏任务。

- **常见的宏任务来源**:
  - **`setTimeout()`**: 定时器回调。
  - **`setInterval()`**: 定时器回调。
  - **`setImmediate()`**: `check` 阶段的回调 (Node.js 特有)。
  - **I/O 操作的回调**: 例如文件读写、网络请求 (`fs.readFile`, `http.get` 等) 的回调。
  - **`script` (整体代码)**: 整个 JS 文件的执行也算作一个宏任务。

* **宏任务的特点**:
  - **阶段性执行**: 每个宏任务会在事件循环的不同阶段被处理。
  - **不会无限期阻塞**: 一个阶段有多个宏任务时它们会轮流执行，事件循环得以进入下一个阶段。

#### 5.2.4 **Node.js 中的执行顺序示例**

下面这个经典例子覆盖了同步代码、两种微任务和两种宏任务，执行顺序如下。

```js
console.log('Start') // 同步任务

setTimeout(() => {
  console.log('setTimeout 0') // 宏任务 (timers 阶段)
}, 0)

setImmediate(() => {
  console.log('setImmediate') // 宏任务 (check 阶段)
})

process.nextTick(() => {
  console.log('process.nextTick 1') // 微任务 (优先级最高)
})

Promise.resolve().then(() => {
  console.log('Promise 1') // 微任务
})

process.nextTick(() => {
  console.log('process.nextTick 2') // 微任务 (优先级最高)
})

Promise.resolve().then(() => {
  console.log('Promise 2') // 微任务
})

console.log('End') // 同步任务

// Start
// End
// process.nextTick 1
// process.nextTick 2
// Promise 1
// Promise 2
// setTimeout 0
// setImmediate
```

**关于 `setTimeout(..., 0)` 和 `setImmediate()`**:

- `setTimeout(..., 0)` 在 `timers` 阶段执行，`setImmediate()` 在 `check` 阶段执行。
- **两者的先后顺序取决于事件循环当前的状态**：`setTimeout(fn, 0)` 的延时按 `1ms` 处理——若进入 `timers` 阶段时这 1ms 已过去，定时器回调就先执行；否则会跳过 `timers`，走 `poll` → `check`，让 `setImmediate` 先执行。**但在纯粹的 I/O 回调内部，`setImmediate` 总是优先于 `setTimeout(0)`。**

```js
const fs = require('fs')

fs.readFile(__filename, () => {
  console.log('readFile callback') // I/O 相关的宏任务

  setTimeout(() => {
    console.log('setTimeout in readFile') // 宏任务
  }, 0)

  setImmediate(() => {
    console.log('setImmediate in readFile') // 宏任务
  })

  process.nextTick(() => {
    console.log('process.nextTick in readFile') // 微任务
  })
})

console.log('Start')

// Start
// readFile callback
// process.nextTick in readFile // 在 I/O 回调执行后，立即清空微任务
// setImmediate in readFile   // 在 I/O 回调内部，setImmediate 优先于 setTimeout(0)
// setTimeout in readFile
```

**总结**:

- **`process.nextTick()` 优先级最高**：当前宏任务执行完毕后清空微任务队列，其中 `nextTick` 又优先于 `Promise`。
- **微任务 (Microtasks)** 在每个事件循环阶段结束时被清空。
- **宏任务 (Macrotasks)** 分散在不同阶段，每个阶段只处理本阶段的宏任务。
- `setTimeout(0)` 与 `setImmediate()` 在没有 I/O 时的相对顺序不确定；但在 I/O 回调内部，`setImmediate` 一定先于 `setTimeout(0)`。

### **5.3 浏览器 vs. Node.js 事件循环 - 关键差异**

[width(26,31,43)]

| 特性                     | 浏览器事件循环                       | Node.js 事件循环                               |
| :----------------------- | :----------------------------------- | :--------------------------------------------- |
| **底层实现**             | 由浏览器内核（如 V8 + libevent）实现 | **libuv**                                      |
| **结构**                 | 宏任务队列 + 微任务队列              | **六个阶段的循环**，每个阶段有自己的队列       |
| **`process.nextTick()`** | **无**                               | **有**，拥有最高优先级，不属于任何阶段         |
| **`setImmediate()`**     | **无**                               | **有**，在 `check` 阶段执行                    |
| **宏任务执行**           | 每次只执行一个宏任务                 | 在 `poll` 阶段，可能会**执行队列中的多个**回调 |
| **与渲染的关系**         | 宏任务之间可能穿插 UI 渲染           | **无 UI 渲染**概念                             |

## **6. 常见问题 (FAQ)**

### 6.1 为什么要有微任务？

- 微任务提供了“**插队**”的能力：在当前宏任务结束后、下一次 UI 渲染或下一个宏任务开始前，立即执行与状态更新相关的高优先级逻辑（如 `Promise` 的决议），保证操作的**原子性**与**及时性**。

### 6.2 如果微任务队列一直有新任务加入，会发生什么？

- 会导致**主线程阻塞**：事件循环一直“**卡**”在清空微任务队列的阶段，无法进入下一个宏任务或 UI 渲染，即“**微任务饥饿**”(Microtask starvation)。

```js
// 危险！不要在生产环境运行
Promise.resolve().then(function microtask() {
  console.log('Microtask running...')
  Promise.resolve().then(microtask) // 无限地添加新的微任务
})
```

此时页面将永远无法执行任何 `setTimeout`，也无法响应用户点击。

### 6.3 `setTimeout(fn, 0)` 是不是立即执行？

- **不是**。`0` 毫秒的含义是“**尽快执行**”而非“**立即执行**”：回调仍会被放入**宏任务队列**，必须等**当前调用栈**的同步代码和**所有微任务**执行完毕，才会被事件循环选中。

### 6.4 `async/await` 在事件循环中是如何工作的？

- `async` 函数被调用时，内部代码会**同步执行**，直到遇到第一个 `await`。
- `await` 后面的表达式会立即执行。
- `await` 会“**暂停**”函数执行，并把 `await` **之后的所有代码**封装成 `.then()` 回调，放入**微任务队列**。
- `async` 函数立即返回一个 `Promise` 对象。

```js
async function async1() {
  console.log('2. async1 start')
  await async2() // await 后面的代码会进入微任务队列
  console.log('5. async1 end')
}
async function async2() {
  console.log('3. async2')
}

console.log('1. script start')
async1()
console.log('4. script end')

// 输出: 1, 2, 3, 4, 5
```

### 6.5 如何理解“JS是单线程的，但浏览器是多线程的”？

- **JS 主线程 (单线程)**: 执行 JavaScript 代码、解析 HTML、计算 CSS、渲染页面，都在同一线程上完成。
- **浏览器其他线程 (多线程)**:
  - **定时器线程**: 负责 `setTimeout` 和 `setInterval` 的计时。
  - **HTTP 请求线程**: 负责处理网络请求。
  - **事件触发线程**: 负责管理和触发 DOM 事件。
  - **Web Worker 线程**: 允许你在后台运行 JS 代码。

JavaScript 通过事件循环利用这些多线程能力实现了非阻塞的异步操作。

### 6.6 为什么 Node.js 需要这么复杂的阶段模型？

- 分阶段的模型是为了**优化 I/O 性能**和**区分不同类型的异步任务**：`timers` 与 I/O 分开处理能更高效地管理系统资源；`check` 阶段则为 `setImmediate` 提供了可预测的执行时机。

### 6.7 Node.js 的事件循环和浏览器有什么不同？

- 总体架构相似，但细节和 API 不同：Node.js 额外有 `process.nextTick()`（**最高优先级**，其队列在**所有其他微任务**如 `Promise.then` 之前被清空）和 `setImmediate()`（回调被放入特殊的 `check` 阶段队列，执行时机在 I/O 回调之后；它与 `setTimeout(fn, 0)` 的先后顺序并不确定）。

### 6.8 `setTimeout(fn, 0)` 和 `setImmediate(fn)` 哪个先执行？

- **不确定**，取决于 Node.js 进程的性能以及事件循环启动所花费的时间。
- `setTimeout(fn, 0)` 的延时会按 `1ms` 处理：如果进入 `timers` 阶段时这 1ms 已经过去，`setTimeout` 会先执行。
- 否则事件循环可能会先跳过 `timers`，进入 `poll` → `check`，导致 `setImmediate` 先执行。
- **但是**，如果它们是在 **I/O 回调**中被调用的，`setImmediate` **总是**先于 `setTimeout(fn, 0)` 执行，因为 I/O 所在的 `poll` 阶段之后紧接着就是 `check` 阶段。

### 6.9 为什么 `process.nextTick` 不是事件循环的一部分，但优先级这么高？

- `nextTick` 的设计初衷是提供一种“**尽快**”执行异步操作的机制，让开发者在当前操作完成后、事件循环继续之前执行“**紧急**”任务，例如在 I/O 操作前设置好状态，或在事件触发器返回前处理错误。但滥用它会导致 I/O “**饥饿**”，因为 `nextTick` 队列会阻塞事件循环进入 `poll` 阶段。
