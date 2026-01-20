# HTML5 Web Workers

**Web Workers** 的作用就是为 JavaScript 创造多线程环境。它允许主线程创建 Worker 线程，将计算密集型任务剥离到后台运行，**保证主线程（UI 线程）永远流畅**。

## 1. 核心 API 速查表

Web Worker 的通信机制基于 **消息传递 (Message Passing)**。

### 1.1 `Worker` 构造函数

用于创建一个新的 Worker 线程。

```javascript
const myWorker = new Worker(aURL, options);
```

*   **`aURL`** (String): Worker 脚本文件的路径。必须遵守同源策略（除非配置了 CORS）。
*   **`options`** (Object, 可选):
    *   **`type`**: `"classic"` (默认) 或 `"module"`。如果 Worker 内部使用了 ES6 `import`/`export`，必须设为 `"module"`。
    *   `name`: 为 Worker 指定一个名字，用于调试。
    *   `credentials`: 凭证模式（如 `"omit"`, `"same-origin"`, `"include"`）。

### 1.2 方法 (Methods)

| 方法名 | 语法 | 描述 |
| :--- | :--- | :--- |
| **`postMessage()`** | `worker.postMessage(message, [transfer])` | **发送消息给 Worker**。<br>**`message`**: 任何 JS 对象（数字、字符串、JSON、Blob、ArrayBuffer）。<br>**`transfer`**: (可选) **转移对象**列表。用于高性能转移二进制数据的所有权（如 ArrayBuffer），避免拷贝。 |
| **`terminate()`** | `worker.terminate()` | **立即终止 Worker**。不做任何清理操作，直接杀死线程。 |

### 1.3 事件 (Events)

| 事件名 | 触发时机 | 回调参数 |
| :--- | :--- | :--- |
| **`onmessage`** | 当收到 Worker 发回的消息时。 | `MessageEvent` 对象。<br>`event.data`: 实际数据。 |
| **`onerror`** | 当 Worker 内部抛出未捕获错误时。 | `ErrorEvent` 对象。<br>`message`, `filename`, `lineno`。 |
| **`onmessageerror`**| 当发送的消息无法反序列化时。 | `MessageEvent` 对象。 |


### 1.4 主线程 API
:::code-group
```js[main.js]
// 1. 创建 Worker
// 参数：worker 脚本的路径
const worker = new Worker('worker.js');

// 2. 发送数据给 Worker
// 数据可以是数字、字符串、JSON对象、数组等
worker.postMessage({ type: 'start', value: 10000 });

// 3. 接收 Worker 返回的数据
worker.onmessage = function(event) {
  const result = event.data;
  console.log('主线程收到计算结果:', result);
};

// 4. 监听 Worker 内部错误
worker.onerror = function(error) {
  console.error('Worker 报错:', error.message, '行号:', error.lineno);
};

// 5. 立即终止 Worker (释放资源)
worker.terminate();
```
:::

## 2. Worker 线程 API

这些 API 只能在 Worker 脚本文件（如 `worker.js`）内部使用。在 Worker 中，全局对象是 `self` (DedicatedWorkerGlobalScope)。

### 2.1 全局方法

| 方法名 | 语法 | 描述 |
| :--- | :--- | :--- |
| **`postMessage()`** | `self.postMessage(message, [transfer])` | **发送消息回主线程**。用法同主线程。 |
| **`importScripts()`**| `importScripts('a.js', 'b.js')` | **同步加载外部脚本**。会暂停 Worker 执行直到脚本下载并运行完毕。*(注: 在 Module Worker 中应使用 `import`)* |
| **`close()`** | `self.close()` | **自我关闭**。Worker 完成任务后自我销毁。 |

### 2.2 事件

| 事件名 | 触发时机 | 回调参数 |
| :--- | :--- | :--- |
| **`onmessage`** | 当收到主线程发来的消息时。 | `MessageEvent`。<br>`event.data` 是核心数据。 |
| **`onmessageerror`**| 当消息无法反序列化时。 | - |

### 2.3 Worker 线程 API

在 Worker 内部，`self` 或 `this` 代表全局作用域（`DedicatedWorkerGlobalScope`）。

:::code-group
```js[worker.js]
// 1. 接收主线程的数据
self.onmessage = function(event) {
  const data = event.data;
  
  // 执行耗时计算...
  const result = doHeavyMath(data.value);
  
  // 2. 发送结果回主线程
  self.postMessage(result);
  
  // 3. (可选) Worker 自我关闭
  // self.close();
};

// 4. 加载其他 JS 脚本 (同步加载)
importScripts('utils.js', 'math-lib.js');
```
:::

##  3. 进阶特性：数据传输方式

Worker 通信有两种数据传输方式，性能差异巨大。

### 3.1 结构化克隆 (Structured Clone) —— 默认
当你传递对象或数组时，浏览器会**拷贝**一份副本给 Worker。
*   **特点**：主线程和 Worker 数据互不影响。
*   **缺点**：如果数据量极大（如 100MB 的图像数据），拷贝过程本身就会消耗 CPU，导致主线程卡顿。

### 3.2 转移所有权 (Transferable Objects) —— 高性能
对于二进制数据（`ArrayBuffer`, `MessagePort`, `ImageBitmap`），可以使用“零拷贝”转移。
*   **特点**：数据的所有权瞬间转移给 Worker。
*   **后果**：**主线程里的这个变量会瞬间变成空（不可用）**。

```javascript
// 主线程
const hugeBuffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
// 第二个参数是转移列表
worker.postMessage(hugeBuffer, [hugeBuffer]); 

console.log(hugeBuffer.byteLength); // 0 (主线程已经失去了它)
```

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: Worker 里能操作 DOM 吗？
**绝对不能**。这是 Worker 最大的限制。
*   **❌ 不可用**: `window`, `document`, `parent`, alert(), confirm(), DOM 元素操作。
*   **✅ 可用**:
    *   `navigator` (获取浏览器信息)
    *   `location` (只读)
    *   `XMLHttpRequest` / `fetch` (发送网络请求)
    *   `setTimeout` / `setInterval`
    *   `importScripts`
    *   `Cache` / `IndexedDB`

### Q2: 为什么本地运行报错 "SecurityError"？
**现象**: 双击打开 html 文件 (`file://...`)，控制台报错 `SecurityError` 或 `Script at '...' cannot be accessed from origin 'null'`.

**原因**: 浏览器的同源策略限制。Worker 脚本必须通过 **HTTP/HTTPS** 协议加载。

**解法**: 使用本地服务器运行（如 VS Code 的 Live Server 插件，或 `npm install -g http-server`）。

### Q3: 如何在 Vue / React / Webpack 中使用 Worker？
现代构建工具（Webpack 5+, Vite）不再需要 `worker-loader`，直接使用原生 URL 构造函数即可。

**Vite / Webpack 5 标准写法**:
```javascript
// 这里的 import.meta.url 指向当前文件的路径
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module' // 如果 worker 内部用了 import/export，需要加这个
});
```

### Q4: 怎么调试 Worker 代码？
Worker 是独立的线程，不在常规的 Console 里。
1.  打开 Chrome DevTools。
2.  点击 **Sources** (源代码) 面板。
3.  在左侧列表中，你会看到一个 **Threads** (线程) 区域，或者在 `top` 下方看到你的 worker 文件。
4.  你可以像调试普通 JS 一样在里面打断点。
5.  *提示*：Worker 内部的 `console.log` 会输出到主线程的控制台。

### Q5: Worker 越多越好吗？
**不是**。
*   每个 Worker 都会消耗系统内存和 CPU 资源。
*   通常建议 Worker 的数量不要超过 **CPU 核心数** (`navigator.hardwareConcurrency`)。
*   对于 IO 密集型任务（如下载），数量可以稍多；对于计算密集型任务，保持与核心数一致最佳。

### Q6: `importScripts` 和 `import` 的区别？
*   **`importScripts('a.js')`**: 老式 Worker 加载脚本的方法，是**同步**阻塞的，加载完才继续执行下面代码。
*   **`import { func } from './a.js'`**: ES Module 写法。需要创建 Worker 时指定 `type: 'module'`。现代开发推荐用这个。

## 5. 实战代码：图片滤镜处理

这是一个典型场景：主线程负责显示 UI，Worker 负责处理像素级计算。

:::code-group
```js[main.js]
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const worker = new Worker('filter-worker.js');

// 1. 获取图片数据
const imageData = ctx.getImageData(0, 0, width, height);

// 2. 发送给 Worker (使用 Transferable 优化性能)
worker.postMessage(imageData, [imageData.data.buffer]);

// 3. 接收处理好的数据
worker.onmessage = (e) => {
  const newImageData = e.data;
  ctx.putImageData(newImageData, 0, 0);
  console.log('滤镜处理完成');
};
```
:::

:::code-group
```js[filter-worker.js]
self.onmessage = (e) => {
  const imageData = e.data;
  const data = imageData.data; // 像素数组 [r, g, b, a, r, g, b, a...]

  // 模拟耗时计算：反色滤镜
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = 255 - data[i];     // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }

  // 传回主线程
  self.postMessage(imageData, [imageData.data.buffer]);
};
```
:::

