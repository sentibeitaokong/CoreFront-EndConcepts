# **事件循环 (Event Loop) 和任务队列 (Task Queue)**

**JavaScript 是一门单线程语言**。这意味着在任意时刻，JS 引擎只能执行一个任务。然而，**`浏览器`**和 **`Node.js`** 环境却能高效地处理 **`I/O`**、定时器等耗时操作而不会“卡死”，这背后的核心机制就是**事件循环**。

## **1. 为什么JavaScript是单线程？**
* JavaScript 是单线程的，主要是为了简化作为浏览器脚本语言的复杂性，特别是为了避免在多线程并发操作 `DOM`时可能出现的各种同步问题（如竞态条件、死锁）。
* 为了弥补单线程可能带来的**阻塞**问题，JavaScript 通过事件循环**`(Event Loop)`**+**`异步`**的机制，实现了**异步非阻塞**的 **`I/O`** 模型，从而在保证简单性和安全性的同时，也获得了处理高并发任务的能力。

## **2. 核心概念**

* **调用栈 (`Call Stack`)**：这是一个**后进先出** `(LIFO)` 的数据结构，用于存储和管理所有正在执行的**执行上下文**`(Execution Contexts)`,当一个函数被调用时，它会被推入调用栈，当函数执行完毕后，它会从调用栈中弹出，JavaScript代码的同步执行过程就是在这个栈中进行的。
* **`Web API` (或 `Node.js API`)**：这些是浏览器(或 `Node.js`)提供的、独立于 JS 引擎的**多线程**环境，用于处理**异步、耗时**的操作,当 JS 引擎遇到一个**异步**任务时，它不会等待，而是将这个任务移交给 `Web APIs`，并为其注册一个**回调函数**，然后继续执行调用栈中的**同步代码**，从而**不会阻塞** JavaScript 主线程。例如：
  * `setTimeout()` 和 `setInterval()` 用于定时器
  * `fetch()` 和 `XMLHttpRequest` 用于网络请求
  * DOM 事件监听器（如 `addEventListener`）

* **同步任务(Synchronous Tasks)和异步任务(Asynchronous Tasks)：**同步任务是指那些在主线程上按顺序执行的任务,异步任务是指那些耗时性的任务。它们不会阻塞主线程。
* **任务队列 (`Task Queue / Callback Queue`)**：任务队列是一个先进先出 (`FIFO`) 的数据结构，用于存放所有已经完成的异步任务所对应的回调函数，当 `Web API`（或 `Node.js API`）处理完**异步任务**后，它不会立即执行**回调函数**，而是将**回调函数**放入**任务队列**中**排队等待**。这个队列通常被称为**宏任务队列** (`MacroTask Queue`)和**微任务队列** (`MicroTask Queue`),**微任务队列** (`MicroTask Queue`)是一个**优先级更高**的队列，用于存放**微任务** (`MicroTasks`),微任务在宏任务执行完之后、下一个宏任务开始之前执行。

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


## **2. 为什么需要任务队列？**
JavaScript 是单线程的，但它需要处理大量的异步操作（如用户交互、网络请求、定时器）。任务队列是**存放异步任务回调函数**的“等候区”，是连接**异步 API** 和 **JS 主线程**的关键枢纽。

### **Part 2: 任务队列的分类：宏任务与微任务**

这是理解现代 JavaScript 异步行为的**最关键部分**。任务队列并非只有一个，而是被精细地分为了两种主要类型：

#### **2.1 宏任务队列 (Macrotask Queue / Task Queue)**

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

#### **2.2 微任务队列 (Microtask Queue)**

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

### **Part 3: 任务队列在事件循环中的协作流程**

理解了宏任务和微任务，我们现在可以描绘出事件循环的精确工作流程：

1.  **选择并执行一个宏任务**:
    *   从**宏任务队列**中取出一个最老的任务（初始时是 `<script>` 任务）。
    *   将这个任务（通常是一个函数）压入**调用栈**并执行。

2.  **执行所有微任务**:
    *   当上一步的宏任务执行完毕（即调用栈变空）时，**立即**检查**微任务队列**。
    *   **循环执行**微任务队列中的所有任务，直到**微任务队列变空**。这个过程是“霸道”的，它会一直执行，直到没有微任务为止。

3.  **（可选）UI 渲染**:
    *   在清空微任务队列后，浏览器可能会（但不一定）进行页面的重绘和回流。

4.  **开始下一次循环**:
    *   返回第一步，从宏任务队列中取出下一个任务。

**流程图**:
```mermaid
graph TD
    A[事件循环开始] --> B{宏任务队列是否为空?};
    B -- 否 --> C[从宏任务队列取出一个任务];
    C --> D[执行该宏任务];
    D --> E{微任务队列是否为空?};
    E -- 否 --> F[循环执行所有微任务，直到队列变空];
    F --> G[UI 渲染 (可选)];
    G --> B;
    B -- 是 --> H[等待新的宏任务...];
    E -- 是 --> G;
```

**示例分析**:
```javascript
console.log('Sync 1');

setTimeout(() => console.log('Macro 1'), 0);

Promise.resolve().then(() => {
  console.log('Micro 1');
  setTimeout(() => console.log('Macro 2'), 0);
}).then(() => {
  console.log('Micro 2');
});

console.log('Sync 2');
```
**执行顺序**:

1.  **宏任务1 (`<script>`)**:
    *   打印 `Sync 1`。
    *   `setTimeout` -> 将 `Macro 1` 的回调放入**宏任务队列**。 `[Macro 1]`
    *   `Promise.then` -> 将 `Micro 1` 的回调放入**微任务队列**。 `[Micro 1]`
    *   打印 `Sync 2`。
    *   **宏任务1 结束**。

2.  **清空微任务队列**:
    *   执行 `Micro 1` -> 打印 `Micro 1`。
    *   在执行 `Micro 1` 时，遇到 `setTimeout` -> 将 `Macro 2` 的回调放入**宏任务队列**。 `[Macro 1, Macro 2]`
    *   `Micro 1` 的 `.then` 链式调用 -> 将 `Micro 2` 的回调放入**微任务队列**。 `[Micro 2]`
    *   微任务队列还不空，继续执行。
    *   执行 `Micro 2` -> 打印 `Micro 2`。
    *   **微任务队列已清空**。

3.  **（可能进行 UI 渲染）**

4.  **宏任务2 (`Macro 1`)**:
    *   从宏任务队列取出 `Macro 1` 并执行。
    *   打印 `Macro 1`。
    *   **宏任务2 结束**。

5.  **清空微任务队列** (当前为空)。

6.  **宏任务3 (`Macro 2`)**:
    *   从宏任务队列取出 `Macro 2` 并执行。
    *   打印 `Macro 2`。
    *   **宏任务3 结束**。

**最终输出**:
```
Sync 1
Sync 2
Micro 1
Micro 2
Macro 1
Macro 2
```

---

### **Part 4: 常见问题 (FAQ)**

*   **Q1: 为什么要有微任务？**
    *   **A**: 微任务提供了一种“插队”的能力。它允许我们在当前宏任务结束后、下一次 UI 渲染或下一个宏任务开始前，立即执行一些高优先级的、与状态更新相关的逻辑（如 `Promise` 的决议）。这确保了操作的**原子性**和**及时性**，避免了在等待下一个宏任务期间可能出现的 UI 状态不一致。

*   **Q2: Node.js 的任务队列和浏览器有什么区别？**
    *   **A**: 核心思想一致，但具体实现和 API 不同。Node.js 的事件循环分为多个阶段（timers, I/O, check, close 等）。
        *   **`process.nextTick()`**: 它有自己独立的队列，优先级**高于**所有其他微任务。`nextTick` 队列会在**每个阶段**结束后、进入下一个阶段前被清空。
        *   **`setImmediate()`**: 它的回调被放入 `check` 阶段的队列，执行时机在 I/O 回调之后。

*   **Q3: 如果微任务队列一直有新任务加入，会发生什么？**
    *   **A**: 会导致**主线程阻塞**，因为事件循环会一直“卡”在清空微任务队列的阶段，无法进入下一个宏任务或 UI 渲染。这被称为“微任务饥饿”(Microtask starvation)。
    ```javascript
    // 危险！不要在生产环境运行
    Promise.resolve().then(function microtask() {
      console.log('Microtask running...');
      Promise.resolve().then(microtask); // 无限地添加新的微任务
    });
    ```
    这个页面将永远无法执行任何 `setTimeout` 或响应用户点击。
### **Part 2: 事件循环的完整流程**

让我们通过一个经典的 `setTimeout` 例子来走一遍完整的流程：

```javascript
console.log('Start'); // 1

setTimeout(function cb() { // 2
  console.log('Callback');
}, 1000);

console.log('End'); // 3
```

1.  **`console.log('Start')`** 被压入**调用栈**，执行，打印 "Start"，然后出栈。
2.  **`setTimeout`** 被压入**调用栈**。JS 引擎识别出它是一个异步任务，于是：
    *   将 `setTimeout` 本身从调用栈中弹出。
    *   将计时任务（1000ms）和其回调函数 `cb` **移交**给**Web APIs**。
3.  **`console.log('End')`** 被压入**调用栈**，执行，打印 "End"，然后出栈。
    *   此时，调用栈变空了。
4.  在 **Web APIs** 中，定时器开始计时。JS 引擎的主线程**完全不受影响**，可以继续处理其他任务。
5.  **1000 毫秒后**，定时器完成。Web APIs 将回调函数 `cb` **放入任务队列**中。
6.  **事件循环**发现**调用栈是空的**，并且**任务队列中有任务 (`cb`)**。
7.  事件循环将 `cb` 从任务队列中取出，并将其**压入调用栈**。
8.  `cb` 函数被执行，其内部的 **`console.log('Callback')`** 被压入调用栈，执行，打印 "Callback"，然后出栈。
9.  `cb` 函数执行完毕，从调用栈中出栈。
10. 调用栈再次变空，事件循环继续它的监视工作。

**可视化流程**:


---

### **Part 3: 宏任务 (Macrotask) vs. 微任务 (Microtask)**

上面的模型是简化的。实际上，任务队列被分成了两种：**宏任务队列**和**微任务队列**。这是面试中最常考察的点。

*   **宏任务 (Macrotask)**:
    *   **来源**: `script` (整体代码)、`setTimeout`, `setInterval`, `setImmediate` (Node.js), `I/O`, `UI rendering`。
    *   **特点**: 宏任务之间可能会穿插 UI 渲染。

*   **微任务 (Microtask)**:
    *   **来源**: `Promise.then()`, `Promise.catch()`, `Promise.finally()`, `MutationObserver`, `process.nextTick` (Node.js)。
    *   **特点**: 微任务通常在当前宏任务执行结束后、下一个宏任务开始前执行，并且**不会**被 UI 渲染打断。它们拥有更高的优先级。

**事件循环的精细化流程**:

1.  执行一个**宏任务**（通常是 `<script>` 标签中的所有同步代码）。
2.  当这个宏任务执行完毕后（即调用栈为空时），**立即**检查**微任务队列**。
3.  **循环执行**微任务队列中的所有任务，直到**微任务队列变空**。如果在执行微任务的过程中，又产生了新的微任务，那么这些新的微任务也会被添加到队列的末尾，并在这一轮中被执行完毕。
4.  （可选）执行 UI 渲染。
5.  从**宏任务队列**中取出一个任务，返回第 1 步，开始下一个循环。

**一句话总结优先级**: **执行一个宏任务 -> 清空整个微任务队列 -> （可能进行渲染）-> 执行下一个宏任务**

**示例**:
```javascript
console.log('1. Script Start');

setTimeout(function() {
  console.log('4. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(function() {
  console.log('3. Promise.then (Microtask)');
});

console.log('2. Script End');
```

**执行顺序与分析**:
1.  **宏任务1 (script)** 开始执行。
2.  `console.log('1. Script Start')` -> 打印 "1. Script Start"。
3.  遇到 `setTimeout`，将其回调函数放入**宏任务队列**。
4.  遇到 `Promise.resolve().then()`，将其 `.then()` 回调函数放入**微任务队列**。
5.  `console.log('2. Script End')` -> 打印 "2. Script End"。
6.  **宏任务1 (script) 执行完毕**。
7.  **事件循环检查微任务队列**。发现有一个任务。
8.  执行微任务：`console.log('3. Promise.then (Microtask)')` -> 打印 "3. Promise.then (Microtask)"。
9.  **微任务队列已清空**。
10. **事件循环检查宏任务队列**。发现有一个 `setTimeout` 的回调。
11. **执行宏任务2 (setTimeout callback)**：`console.log('4. setTimeout (Macrotask)')` -> 打印 "4. setTimeout (Macrotask)"。
12. 结束。

**最终输出**:
```
1. Script Start
2. Script End
3. Promise.then (Microtask)
4. setTimeout (Macrotask)
```

---

### **Part 4: 常见问题与陷阱 (FAQ)**

*   **Q1: `setTimeout(fn, 0)` 是不是立即执行？**
    *   **A**: **不是**。`0` 毫秒的含义是“尽快执行”，而不是“立即执行”。它仍然会将回调函数 `fn` 放入**宏任务队列**。它必须等待**当前调用栈**中的所有同步代码和**所有微任务**都执行完毕后，才有机会被事件循环选中并执行。

*   **Q2: `async/await` 在事件循环中是如何工作的？**
    *   **A**: `async/await` 是 `Promise` 的语法糖，其行为与 `Promise` 完全一致。
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
    (Note: The example in the user's prompt was slightly adjusted to be self-contained and clear)

*   **Q3: 为什么微任务要优先于宏任务？**
    *   **A**: 这是 ECMA 规范的设计。微任务的设计初衷是为了处理一些需要**在当前任务结束后、UI 渲染前立即执行**的高优先级任务，例如对 `Promise` 状态变化的响应。这保证了状态更新的及时性和一致性，避免了在两次宏任务之间因 UI 渲染而可能产生的状态不一致问题。

*   **Q4: Node.js 的事件循环和浏览器有什么不同？**
    *   **A**: 总体架构相似，但细节和 API 不同。
        *   **API**: Node.js 有 `process.nextTick()` 和 `setImmediate()`。
        *   **`process.nextTick()`**: 拥有**最高优先级**，它的队列会在**所有其他微任务**（如 `Promise.then`）执行前被清空。
        *   **`setImmediate()`**: 它的回调被放入一个特殊的“check”阶段的队列，其执行时机在 I/O 事件回调之后、`setTimeout` 之前（在某些边界情况下）。`setTimeout(fn, 0)` 和 `setImmediate` 的执行顺序在某些情况下是不确定的。

*   **Q5: 如何理解“JS是单线程的，但浏览器是多线程的”？**
    *   **A**:
        *   **JS 主线程 (单线程)**: 负责执行 JavaScript 代码、解析 HTML、计算 CSS、渲染页面。所有这些都在一个线程上完成。
        *   **浏览器其他线程 (多线程)**:
            *   **定时器线程**: 负责 `setTimeout` 和 `setInterval` 的计时。
            *   **HTTP 请求线程**: 负责处理网络请求。
            *   **事件触发线程**: 负责管理和触发 DOM 事件。
            *   **Web Worker 线程**: 允许你在后台运行 JS 代码。
                JavaScript 通过事件循环机制，巧妙地利用了这些浏览器提供的多线程能力，实现了非阻塞的异步操作。