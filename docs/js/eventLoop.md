---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# **事件循环 (Event Loop) 和任务队列 (Task Queue)**

**JavaScript 是一门单线程语言**。这意味着在任意时刻，JS 引擎只能执行一个任务。然而，**`浏览器`**和 **`Node.js`** 环境却能高效地处理 **`I/O`**、定时器等耗时操作而不会“卡死”，这背后的核心机制就是**事件循环**。

## **1. 为什么JavaScript是单线程？**
* JavaScript 是单线程的，主要是为了简化作为浏览器脚本语言的复杂性，特别是为了避免在多线程并发操作 `DOM`时可能出现的各种同步问题（如竞态条件、死锁）。
* 为了弥补单线程可能带来的**阻塞**问题，浏览器通过事件循环**`(Event Loop)`**+**`异步`**的机制，实现了**异步非阻塞**的 **`I/O`** 模型，从而在保证简单性和安全性的同时，也获得了处理高并发任务的能力。

## **2. 核心概念**

* **调用栈 (`Call Stack`)**：这是一个**后进先出** `(LIFO)` 的数据结构，用于存储和管理所有正在执行的**执行上下文**`(Execution Contexts)`,当一个函数被调用时，它会被推入调用栈，当函数执行完毕后，它会从调用栈中弹出，JavaScript代码的同步执行过程就是在这个栈中进行的。

    ![Logo](/stack.png)

* **`Web API` (或 `Node.js API`)**：这些是浏览器(或 `Node.js`)提供的、独立于 JS 引擎的**多线程**环境，用于处理**异步、耗时**的操作,当 JS 引擎遇到一个**异步**任务时，它不会等待，而是将这个任务移交给 `Web APIs`，并为其注册一个**回调函数**，然后继续执行调用栈中的**同步代码**，从而**不会阻塞** JavaScript 主线程。例如：
  * `setTimeout()` 和 `setInterval()` 用于定时器
  * `fetch()` 和 `XMLHttpRequest` 用于网络请求
  * DOM 事件监听器（如 `addEventListener`）
  
    ![Logo](/eventLoopFirst.png)

* **同步任务(Synchronous Tasks)和异步任务(Asynchronous Tasks)：**同步任务是指那些在主线程上按顺序执行的任务,异步任务是指那些耗时性的任务。它们不会阻塞主线程。
* **任务队列 (`Task Queue / Callback Queue`)**：任务队列是一个先进先出 (`FIFO`) 的数据结构，用于存放所有已经完成的异步任务所对应的回调函数，当 `Web API`（或 `Node.js API`）处理完**异步任务**后，它不会立即执行**回调函数**，而是将**回调函数**放入**任务队列**中**排队等待**。这个队列通常被称为**宏任务队列** (`MacroTask Queue`)和**微任务队列** (`MicroTask Queue`),**微任务队列** (`MicroTask Queue`)是一个**优先级更高**的队列，用于存放**微任务** (`MicroTasks`),微任务在宏任务执行完之后、下一个宏任务开始之前执行。

    ![Logo](/queue.png)

[//]: # (    * **常见的宏任务包括：**)

[//]: # (      * `setTimeout`、`setInterval`)

[//]: # (      * `DOM` 事件)

[//]: # (      * `I/O` 操作)

[//]: # (      * `MessageChannel`)

[//]: # (      * `setImmediate` &#40;`Node.js` 专属&#41;)

[//]: # (    * **常见的微任务包括：**)

[//]: # (      * `Promise` 的 `then&#40;&#41;`、`catch&#40;&#41;`、`finally&#40;&#41;`方法)

[//]: # (      * `MutationObserver`)

[//]: # (      * `queueMicrotask`)

*  **事件循环(`Event Loop`)**:这是一个持续不断的进程，它的唯一工作就是“监视”调用栈和任务队列，当调用栈为空时，从任务队列中取出一个任务（回调函数），并将其压入调用栈中执行。

   ![Logo](/eventLoopSecond.png)

## **3. 为什么需要任务队列？**
JavaScript 是单线程的，但它需要处理大量的异步操作（如用户交互、网络请求、定时器）。任务队列是**存放异步任务回调函数**的“等候区”，是连接**异步 API** 和 **JS 主线程**的关键枢纽。

## **4.任务队列的分类：宏任务与微任务**

这是理解现代 JavaScript 异步行为的**最关键部分**。任务队列并非只有一个，而是被精细地分为了两种主要类型：

### **4.1 宏任务队列 (Macrotask Queue / Task Queue)**

*   **定义**: 存放宏任务回调的队列。
*   **常见的宏任务源**:
    *   **`<script>` (整体代码)**: 整个 JS 文件的执行可以被看作是第一个宏任务。
    *   **`setTimeout()`**
    *   **`setInterval()`**
    *   **`setImmediate()`** (仅 Node.js)
    *   **I/O 操作**: 文件读写、网络请求 (`fetch`, `AJAX`) 等。
    *   **UI 渲染**: 浏览器在两次宏任务之间可能会进行页面重绘和回流。
    *   **用户交互事件**: `click`, `scroll`, `input` 等。

*   **特点**:
    *   每个宏任务都在一个独立的事件循环“滴答”(tick) 中执行。
    *   宏任务之间可能会穿插 UI 渲染。

### **4.2 微任务队列 (Microtask Queue)**

*   **定义**: 存放微任务回调的队列，它拥有**更高的执行优先级**。
*   **常见的微任务源**:
    *   **`Promise.then()`**
    *   **`Promise.catch()`**
    *   **`Promise.finally()`**
    *   **`async/await`** (其 `await` 后面的代码部分)
    *   **`MutationObserver`**: 用于监听 DOM 树的变化。
    *   **`process.nextTick()`** (仅 Node.js, 优先级甚至高于其他微任务)。

*   **特点**:
    *   微任务在**当前宏任务执行结束后、下一个宏任务开始前**被立即执行。
    *   事件循环会**一次性清空**整个微任务队列。如果在执行微任务的过程中又产生了新的微任务，这些新任务也会被添加到队列末尾，并在**同一轮**事件循环中被执行完毕。
    *   微任务的执行**不会**被 UI 渲染打断。


## **5. 事件循环(`EventLoop`)**

### **5.1 浏览器的事件循环**
* 所有同步任务都在主线程(宏任务队列中**最老**的任务)上（初始时是 `<script>` 标签里）执行，形成一个**执行栈**(`Execution Context Stack`)。
* 而异步任务会被放置到 `Task Table`，也就是异步处理模块，当异步任务有了运行结果，就将该异步回调函数移入任务队列
* 一旦执行栈中的所有同步任务执行完毕，引擎就会读取微任务队列，然后将微任务队列中的第一个任务压入执行栈中运行。
* 循环执行微任务队列中的所有任务，直到微任务队列变空。这个过程是“霸道”的，如果在执行微任务的过程中又产生了新的微任务，这些新任务也会被添加到队列末尾，并在这一轮中被全部执行完毕。
* 在微任务队列被清空后，浏览器会进行判断，是否需要进行 UI 渲染（重绘/回流）。这个步骤不是每次循环都必然发生，浏览器会根据屏幕刷新率、页面性能等因素来决定。
* 最后从宏任务队列中取出下一个任务，开始新一轮的循环 (tick)，该过程不断重复，这就是所谓的**事件循环**。

**总结：**执行一个宏任务 -> 清空整个微任务队列 -> （可能进行渲染）-> 执行下一个宏任务
![Logo](/eventLoopThird.png)

```js
console.log(1);
setTimeout(() => {
    console.log(2);
    Promise.resolve().then(() => {
        console.log(3)
    });
});

new Promise((resolve, reject) => {
    console.log(4)
    resolve(5)
}).then((data) => {
    console.log(data);
})

setTimeout(() => {
    console.log(6);
})

console.log(7);
// 1 4 7  5 2 3 6
```
### **5.2 Node.js的事件循环**
浏览器一样，Node.js 也是单线程的，并使用事件驱动、非阻塞 I/O模型。事件循环是实现这一模型的核心。Node.js 的事件循环由 libuv 库提供，其模型比浏览器更为复杂和结构化。

[//]: # (![Logo]&#40;/libuv.png&#41;)

#### **1. Node.js 事件循环的六个阶段**

Node.js 事件循环可以被看作一个**分阶段**的、循环往复的过程。每次循环（称为一个 "tick"）都会按顺序经过以下六个主要阶段：

![Logo](/nodejs.png)

1.  **timers (定时器)**: 执行 `setTimeout()` 和 `setInterval()` 的回调。
2.  **I/O callbacks (待定回调)**: 执行某些系统操作（如 TCP 错误）的回调。
3.  **idle, prepare (空闲、准备)**: 内部使用。
4.  **poll (轮询)**:
    *   检查新的 I/O 事件。
    *   执行 I/O 相关的回调（例如，文件读写、网络请求的回调）。
    *   如果存在 `setImmediate()` 的回调，并且 `poll` 阶段为空，则事件循环可能会直接跳到 `check` 阶段。
5.  **check (检查)**: 执行 `setImmediate()` 的回调。
6.  **close callbacks (关闭回调)**: 执行 `socket.on('close', ...)` 等关闭事件的回调。
**在每个阶段的执行前后，都会处理微任务队列。**

---

#### **Node.js中的宏任务 (Macrotasks) 和 微任务 (Microtasks)**

在 Node.js 中，宏任务和微任务是处理异步操作的两种不同队列。

##### **微任务 (Microtasks)**

微任务的优先级**高于宏任务**。在 Node.js 的事件循环中，**每个阶段结束后，都会清空微任务队列，然后再进入下一个阶段。**

*   **常见的微任务来源**:
    *   **`Promise.prototype.then()`**, **`.catch()`**, **`.finally()`**: Promise 回调。
    *   **`process.nextTick()`**: 这是一个 Node.js 特有的微任务，**优先级最高**，它会在当前操作结束之后、下一个事件循环阶段开始之前立即执行，甚至比 Promise 回调还要早。
    *   **`async/await`**: `await` 后面的代码以及 `async` 函数返回的 Promise 也是微任务。
    *   **`queueMicrotask()`**: ES 标准提供的显式创建微任务的方法。

**微任务的特点**:
*   **高优先级**: 在当前宏任务执行完毕后，所有待处理的微任务会立即执行，直到微任务队列清空。
*   **阻塞性**: 如果微任务队列中的任务过多或执行时间过长，会阻塞下一个宏任务阶段的进入，导致事件循环停滞。

##### **宏任务 (Macrotasks)**

宏任务是构成事件循环的各个阶段的主要任务单元。事件循环的每个阶段都处理一个或多个宏任务。

*   **常见的宏任务来源**:
    *   **`setTimeout()`**: 定时器回调。
    *   **`setInterval()`**: 定时器回调。
    *   **`setImmediate()`**: `check` 阶段的回调 (Node.js 特有)。
    *   **I/O 操作的回调**: 例如文件读写、网络请求 (`fs.readFile`, `http.get` 等) 的回调。
    *   **`script` (整体代码)**: 整个 JS 文件的执行也算作一个宏任务。

**宏任务的特点**:
*   **阶段性执行**: 每个宏任务会在事件循环的不同阶段被处理。
*   **不会无限期阻塞**: 即使一个阶段有多个宏任务，它们也会轮流执行，允许事件循环进入下一个阶段。

#### **Node.js 中的执行顺序示例**

我们通过一个经典的例子来理解它们在 Node.js 中的执行顺序。

```javascript
console.log('Start'); // 同步任务

setTimeout(() => {
  console.log('setTimeout 0'); // 宏任务 (timers 阶段)
}, 0);

setImmediate(() => {
  console.log('setImmediate'); // 宏任务 (check 阶段)
});

process.nextTick(() => {
  console.log('process.nextTick 1'); // 微任务 (优先级最高)
});

Promise.resolve().then(() => {
  console.log('Promise 1'); // 微任务
});

process.nextTick(() => {
  console.log('process.nextTick 2'); // 微任务 (优先级最高)
});

Promise.resolve().then(() => {
  console.log('Promise 2'); // 微任务
});

console.log('End'); // 同步任务
```

**理论输出顺序 (Node.js 环境)**:

1.  **`Start`** (同步代码)
2.  **`End`** (同步代码)
3.  **`process.nextTick 1`** (所有同步代码执行完后，立即清空 `process.nextTick` 队列)
4.  **`process.nextTick 2`**
5.  **`Promise 1`** (然后清空 `Promise` 微任务队列)
6.  **`Promise 2`**
    *   **至此，所有微任务已被清空，事件循环进入 `timers` 阶段**
7.  **`setTimeout 0`** (timers 阶段的宏任务)
    *   **在 `setTimeout` 回调执行后，再次检查并清空微任务队列 (本例中没有新的微任务)**
    *   **事件循环进入 `poll` 阶段 (可能为空，也可能有 I/O)**
    *   **事件循环进入 `check` 阶段**
8.  **`setImmediate`** (check 阶段的宏任务)

**实际运行结果（通常情况下）**:

```
Start
End
process.nextTick 1
process.nextTick 2
Promise 1
Promise 2
setTimeout 0
setImmediate
```

**关于 `setTimeout(..., 0)` 和 `setImmediate()`**:

*   `setTimeout(..., 0)` 会在 `timers` 阶段执行。
*   `setImmediate()` 会在 `check` 阶段执行。
*   **它们的执行顺序依赖于当前事件循环的状态**。如果在 `timers` 阶段执行前 `poll` 阶段已经有任务，或者 `setTimeout` 实际延迟大于 0，那么 `setImmediate` 可能先执行。但在大部分常见场景下（如上例），`setTimeout(0)` 往往会先触发，因为 `timers` 阶段在 `check` 阶段之前。**但在纯粹的 I/O 回调内部，`setImmediate` 总是优先于 `setTimeout(0)`。**

例如：
```javascript
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log('readFile callback'); // I/O 相关的宏任务

  setTimeout(() => {
    console.log('setTimeout in readFile'); // 宏任务
  }, 0);

  setImmediate(() => {
    console.log('setImmediate in readFile'); // 宏任务
  });

  process.nextTick(() => {
    console.log('process.nextTick in readFile'); // 微任务
  });
});

console.log('Start');
```

**此例的输出**:

```
Start
readFile callback
process.nextTick in readFile // 在 I/O 回调执行后，立即清空微任务
setImmediate in readFile   // 在 I/O 回调内部，setImmediate 优先于 setTimeout(0)
setTimeout in readFile
```

**总结**:

*   **`process.nextTick()` 具有最高的优先级**，在当前宏任务执行完毕后，所有微任务（包括 `nextTick` 和 `Promise`）被清空，其中 `nextTick` 又优先于 `Promise`。
*   **微任务 (Microtasks)** 会在每个事件循环阶段结束时被清空。
*   **宏任务 (Macrotasks)** 分散在事件循环的不同阶段，每个阶段只处理该阶段的宏任务。
*   `setTimeout(0)` 和 `setImmediate()` 的相对顺序，在没有 I/O 操作时，`setTimeout` 可能会稍早或同时执行；但在 I/O 回调内部，`setImmediate` 会在 `setTimeout(0)` 之前执行。


### **5.3 浏览器 vs. Node.js 事件循环 - 关键差异**

| 特性 | 浏览器事件循环 | Node.js 事件循环 |
| :--- | :--- | :--- |
| **底层实现** | 由浏览器内核（如 V8 + libevent）实现 | **libuv** |
| **结构** | 宏任务队列 + 微任务队列 | **六个阶段的循环**，每个阶段有自己的队列 |
| **`process.nextTick()`** | **无** | **有**，拥有最高优先级，不属于任何阶段 |
| **`setImmediate()`** | **无** | **有**，在 `check` 阶段执行 |
| **宏任务执行** | 每次只执行一个宏任务 | 在 `poll` 阶段，可能会**执行队列中的多个**回调 |
| **与渲染的关系**| 宏任务与微任务之间可能穿插 UI 渲染 | **无 UI 渲染**概念 |

## **6. 常见问题 (FAQ)**
*   **Q1: 为什么要有微任务？**
    *   微任务提供了一种“插队”的能力。它允许我们在当前宏任务结束后、下一次 UI 渲染或下一个宏任务开始前，立即执行一些高优先级的、与状态更新相关的逻辑（如 `Promise` 的决议）。这确保了操作的**原子性**和**及时性**，避免了在等待下一个宏任务期间可能出现的 UI 状态不一致。
*   **Q2: 如果微任务队列一直有新任务加入，会发生什么？**
    *  会导致**主线程阻塞**，因为事件循环会一直“卡”在清空微任务队列的阶段，无法进入下一个宏任务或 UI 渲染。这被称为“微任务饥饿”(Microtask starvation)。
    ```javascript
    // 危险！不要在生产环境运行
    Promise.resolve().then(function microtask() {
      console.log('Microtask running...');
      Promise.resolve().then(microtask); // 无限地添加新的微任务
    });
    ```
    这个页面将永远无法执行任何 `setTimeout` 或响应用户点击。
*   **Q3: `setTimeout(fn, 0)` 是不是立即执行？**
    *   **不是**。`0` 毫秒的含义是“尽快执行”，而不是“立即执行”。它仍然会将回调函数 `fn` 放入**宏任务队列**。它必须等待**当前调用栈**中的所有同步代码和**所有微任务**都执行完毕后，才有机会被事件循环选中并执行。

*   **Q4: `async/await` 在事件循环中是如何工作的？**
    *  `async/await` 是 `Promise` 的语法糖，其行为与 `Promise` 完全一致。
        *   `async` 函数在被调用时，其内部的代码会**同步执行**，直到遇到第一个 `await`。
        *   `await` 后面的表达式会立即执行。
        *   `await` 会“暂停” `async` 函数的执行，并将 `await` **之后的所有代码**封装成一个 `.then()` 回调，放入**微任务队列**。
        *   `async` 函数本身会立即返回一个 `Promise` 对象。

    **示例**:
    ```javascript
    async function async1() {
      console.log('2. async1 start');
      await async2(); // await 后面的代码会进入微任务队列
      console.log('6. async1 end');
    }
    async function async2() {
      console.log('3. async2');
    }

    console.log('1. script start');
    async1();
    console.log('4. script end');

    // 输出: 1, 2, 3, 4, 6
    // 5. then's log is missing in the example
    ```

*   **Q5: 如何理解“JS是单线程的，但浏览器是多线程的”？**
    *   **JS 主线程 (单线程)**: 负责执行 JavaScript 代码、解析 HTML、计算 CSS、渲染页面。所有这些都在一个线程上完成。
    *   **浏览器其他线程 (多线程)**:
        *   **定时器线程**: 负责 `setTimeout` 和 `setInterval` 的计时。
        *   **HTTP 请求线程**: 负责处理网络请求。
        *   **事件触发线程**: 负责管理和触发 DOM 事件。
        *   **Web Worker 线程**: 允许你在后台运行 JS 代码。
            JavaScript 通过事件循环机制，巧妙地利用了这些浏览器提供的多线程能力，实现了非阻塞的异步操作。
*   **Q6: 为什么 Node.js 需要这么复杂的阶段模型？**
    *    这种分阶段的模型是为了**优化 I/O 性能**和**区分不同类型的异步任务**。例如，将 `timers` 和 I/O 操作分开处理，可以更高效地管理系统资源。`check` 阶段的存在为 `setImmediate` 提供了一个可预测的执行时机，专门用于在 I/O 操作后立即执行代码。
*   **Q7: Node.js 的事件循环和浏览器有什么不同？**
    *    总体架构相似，但细节和 API 不同。
        *   **API**: Node.js 有 `process.nextTick()` 和 `setImmediate()`。
        *   **`process.nextTick()`**: 拥有**最高优先级**，它的队列会在**所有其他微任务**（如 `Promise.then`）执行前被清空。
        *   **`setImmediate()`**: 它的回调被放入一个特殊的“check”阶段的队列，其执行时机在 I/O 事件回调之后、`setTimeout` 之前（在某些边界情况下）。`setTimeout(fn, 0)` 和 `setImmediate` 的执行顺序在某些情况下是不确定的。

*   **Q8: `setTimeout(fn, 0)` 和 `setImmediate(fn)` 哪个先执行？**
    *    **不确定**。这取决于 Node.js 进程的性能和事件循环启动时所花费的时间。
        *   如果事件循环进入 `timers` 阶段时，`0ms` 已经过去，那么 `setTimeout` 会先执行。
        *   如果事件循环准备 `timers` 阶段花费了超过 `0ms`，那么可能会先跳过 `timers`，进入 `poll` -> `check`，导致 `setImmediate` 先执行。
        *   **但是**，如果它们是在一个 **I/O 回调**中被调用的，那么 `setImmediate` **总是**先于 `setTimeout(fn, 0)` 执行，因为 I/O 所在的 `poll` 阶段之后紧接着就是 `check` 阶段。

*   **Q9: 为什么 `process.nextTick` 不是事件循环的一部分，但优先级这么高？**
    *   `nextTick` 的设计初衷是提供一个“尽快”执行异步操作的机制，允许开发者在当前操作完成后、事件循环继续进行之前，执行一些“紧急”任务。它的高优先级可以用来确保某些状态在 I/O 操作前被正确设置，或者在事件触发器返回前处理错误。但滥用它会导致 I/O “饥饿”，因为 `nextTick` 队列会阻塞事件循环进入 `poll` 阶段。

