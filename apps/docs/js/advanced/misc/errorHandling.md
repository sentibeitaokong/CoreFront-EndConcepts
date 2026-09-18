# **错误处理 (Error Handling)**

错误处理旨在**捕获、识别、响应和恢复**代码执行中的异常，防止程序崩溃并辅助调试。

真正的问题不是“**会不会出错**”，而是“**出错之后代码会怎样**”。缺少错误处理的代码，失败通常以三种方式暴露：

- **静默失败**：捕获后什么也不做，程序带着错误状态继续跑，最初的原因早已丢失。
- **错误扩散**：局部失败沿调用链蔓延，拖垮整片功能（一次接口失败导致整页白屏）。
- **无法定位**：错误只发生在用户浏览器里，缺少调用栈与上下文。

错误处理的目标不是“**让错误消失**”，而是**把不可控的失败转化成可控的分支**。

## **1. 核心概念**

### **1.1 什么是错误 (Error)？**

在 JavaScript 中，错误是一个表示非预期事件的对象；错误发生时，正常的程序流程会被中断。

### **1.2 为什么需要错误处理？**

JavaScript 的默认策略是“**出错就中断**”：未捕获的异常会终止当前执行流，只留下一条控制台报错。

错误处理要解决三件事：**收敛影响范围**（失败限制在一个组件、一个请求内）、**保住执行流**（可预期的失败有返回值与降级路径）、**保住现场信息**（栈、`cause` 等上下文在传播中保留）。

好的错误处理是“**在最合适的那一层处理错误**”，而不是每层都处理一遍。

### **1.3 错误的类型 (`Error` 对象)**

所有错误对象都继承自内置的 `Error`，它通常包含以下属性：

- **`name`**: 错误的类型（如 `TypeError`, `ReferenceError`）。
- **`message`**: 错误的详细描述信息。
- **`stack`**: (非标准，但广泛实现) 错误发生时的调用栈，对调试非常有用。

此外还有几个成员值得了解：

[width(30,52,18)]

| 成员                                    | 含义                                           | 引入    |
| :-------------------------------------- | :--------------------------------------------- | :------ |
| `cause`                                 | 导致当前错误的“**原始错误**”，用于保留错误链   | ES2022  |
| `errors`                                | 聚合的子错误数组，仅 `AggregateError` 实例拥有 | ES2021  |
| `Error.stackTraceLimit`                 | 调用栈帧的采集上限（默认 10）                  | V8 专有 |
| `Error.captureStackTrace(target, ctor)` | 手动为对象安装 `stack` 属性                    | V8 专有 |

`cause` 是 ES2022 新增的构造选项，让“**把底层错误包一层再抛出**”不再丢原始信息：

```js
const err = new Error('配置加载失败', {
  cause: new Error('ENOENT: no such file or directory'),
})

console.log(err.name) // "Error"
console.log(err.message) // "配置加载失败"
console.log(err.cause.message) // "ENOENT: no such file or directory"
console.log(String(err)) // "Error: 配置加载失败"
```

几个容易被忽略的细节：

- **`name` 在原型上**：`name` 定义于 `Error.prototype`，实例不拥有它，因此改写实例的 `name` 合法且常见。
- **属性不可枚举**：`message`、`stack`、`cause` 都不可枚举，`Object.keys(err)` 返回 `[]`，`JSON.stringify(err)` 得到 `{}`；上报前必须手动挑字段。
- **`stack` 是惰性的**：它不属于 ECMAScript 标准但主流引擎都实现，V8 中采集与格式化**惰性**发生，首次访问 `.stack` 时才付出代价——“**构造 `Error` 很便宜，打印或上报它才贵**”。
- **`toString()` 的格式**：返回 `name` 与 `message` 的拼接；`message` 为空字符串时只返回 `name`。

```js
console.log(new Error().message) // ""（未传 message 时是空字符串）
console.log(new Error('出错了').toString()) // "Error: 出错了"
```

**常见的内置错误类型**:

[width(22,40,38)]

| 错误类型             | 描述                                                | 示例                                              |
| :------------------- | :-------------------------------------------------- | :------------------------------------------------ |
| **`Error`**          | 所有错误对象的基类。通常用于自定义错误。            | `throw new Error('Something went wrong');`        |
| **`TypeError`**      | 变量或参数不是预期类型，或函数被调用时类型不正确。  | `null.method()` (`null` 不是对象); `new 123()`    |
| **`ReferenceError`** | 引用了一个不存在的变量。                            | `console.log(nonExistentVar);`                    |
| **`SyntaxError`**    | JavaScript 引擎在解析代码时遇到的语法错误。         | `eval('const a =;');`                             |
| **`RangeError`**     | 数值变量或参数超出合法范围。                        | `new Array(-1);`                                  |
| **`URIError`**       | `encodeURI()` 或 `decodeURI()` 等函数参数不合法。   | `decodeURI('%');`                                 |
| **`EvalError`**      | `eval()` 函数相关错误（不推荐使用 `eval`）。        | `new EvalError('Eval error');`                    |
| **`AggregateError`** | 把多个错误聚合成一个（如 `Promise.any` 全部失败）。 | `new AggregateError([err1, err2], 'All failed');` |

### **1.4 同步错误 vs. 异步错误**

- **同步错误**: 发生在**主执行流**中，可用 `try...catch` 直接捕获。
- **异步错误**：发生在**异步操作的回调**中。回调在主线程代码执行完之后才运行，`try...catch` 无法捕获，需要 `.catch()` 或 `async/await` 里的 `try...catch`。

判断错误属于哪一类，**看的不是类型，而是它在哪里被抛出**：同一个 `TypeError`，同步代码里抛出是同步错误，`setTimeout` 回调里抛出就是异步错误。

[width(30,28,42)]

| 维度                      | 同步错误                                  | 异步错误                                       |
| :------------------------ | :---------------------------------------- | :--------------------------------------------- |
| 发生时机                  | 当前调用栈内，立即发生                    | 当前任务（或之后的某个任务）中，`try` 早已结束 |
| 传播方式                  | 沿调用栈向上抛，直到被 `catch` 或到达顶层 | 不沿调用栈传播，靠回调参数 / Promise 状态传递  |
| 能否被 `try...catch` 捕获 | 能                                        | 不能（回调执行时已不在原来的栈上）             |
| 全局兜底                  | `window.onerror` / `uncaughtException`    | `unhandledrejection` / `unhandledRejection`    |
| 典型来源                  | 类型错误、解析错误、手动 `throw`          | 网络失败、定时器回调、事件处理器、Promise 拒绝 |

## **2. 同步错误处理**

### **2.1 `try...catch` 语句**

JavaScript 处理同步错误最基本的方式。

- **`try` 块**: 包含可能抛出错误的代码。
- **`catch` 块**: 包含 `try` 块出错时要执行的代码，接收错误对象。
- **`finally` 块**: (可选) 无论 `try` 块是否出错，`finally` 中的代码**总会执行**，通常用于资源清理。

**语法**:

```js
try {
  // 可能会抛出错误的代码
} catch (error) {
  // 错误处理逻辑
  console.error('An error occurred:', error.name, error.message)
  // error.stack 提供了调用栈信息
} finally {
  // 无论是否发生错误，都会执行的代码
  console.log('Execution finished (finally block)')
}
```

**示例**:

```js
function divide(a, b) {
  try {
    if (b === 0) {
      throw new Error('Division by zero is not allowed.') // 手动抛出错误
    }
    return a / b
  } catch (err) {
    console.error('Error in divide function:', err.message)
    return null // 返回一个默认值或null表示操作失败
  } finally {
    console.log('Divide operation attempted.')
  }
}

console.log(divide(10, 2)) // 5, "Divide operation attempted."
console.log(divide(10, 0)) // "Error in divide function: Division by zero is not allowed.", "Divide operation attempted.", null
```

**省略 `catch` 参数**：ES2019 起 `catch` 的参数可省略。当“**失败**”本身就是预期结果时，`catch {}` 更诚实，也不会触发 lint 的“**变量未使用**”提示。

```js
function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    // 只关心成功还是失败，不需要错误对象
    return null
  }
}
```

还有两个容易忽略的规则：

- **`catch` 的参数是块级作用域**：`err` 只在 `catch` 块内可见，要带出去得提前赋值给外部变量。
- **`try` 块里的 `return` / `throw` / `break` / `continue` 都不会“跳过” `finally`**：控制权离开 `try...catch` 前 `finally` 一定执行，这正是下一节陷阱的根源。

```js
function run() {
  try {
    console.log('1: try')
    return '返回值'
  } finally {
    console.log('2: finally')
  }
}

console.log('3:', run())
// 1: try
// 2: finally
// 3: 返回值
```

### **2.2 `finally` 的执行顺序与返回值覆盖**

`finally` 最容易写出隐蔽 bug：它**总会执行**，而“**离开**”时的行为又会**覆盖**之前的一切。执行顺序固定为 `try` →（出错时）`catch` → `finally`，之后 `return` / `throw` 才生效：

```js
function order() {
  try {
    console.log('try')
    throw new Error('出错了')
  } catch (err) {
    console.log('catch:', err.message)
  } finally {
    console.log('finally')
  }
}

order()
// try
// catch: 出错了
// finally
```

**陷阱一：`finally` 里的 `return` 会覆盖 `try` / `catch` 的返回值。**

```js
function overrideReturn() {
  try {
    return 'from try'
  } finally {
    return 'from finally' // 覆盖了 try 的返回值
  }
}

console.log(overrideReturn()) // "from finally"
```

**陷阱二：`finally` 里抛出的错误会覆盖原始错误**，原始错误直接消失，这是最难排查的一类 bug。

```js
function overrideError() {
  try {
    throw new Error('原始错误')
  } finally {
    throw new Error('finally 中的错误') // 原始错误被丢弃
  }
}
```

**陷阱三：`finally` 中的 `return` 会吞掉 Promise 的 rejection。** 在 `async` 函数里，`await` 的失败同样被 `finally` 的 `return` 顶掉，函数变成 `resolved`。

```js
async function swallowRejection() {
  try {
    await Promise.reject(new Error('请求失败'))
  } finally {
    return 'finally 的返回值' // 错误消失，函数返回 resolved 的字符串
  }
}
```

> 结论：`finally` 只做**清理**（关连接、清定时器、释放锁、复位 loading），**永远不要在里面写 `return` 或 `throw`**；`break` / `continue` 同样会覆盖 `try` 中的控制流。

[width(53,47)]

| 代码结构                                           | 最终结果                               |
| :------------------------------------------------- | :------------------------------------- |
| `try` 正常结束，无 `finally`                       | 返回 `try` 的值                        |
| `try` 抛错且 `catch` 处理                          | 返回 `catch` 的值                      |
| `try` / `catch` 中 `return`，`finally` 无 `return` | 先执行 `finally`，再返回原来的值       |
| `finally` 中 `return`                              | `finally` 的返回值覆盖一切，错误被吞掉 |
| `finally` 中 `throw`                               | `finally` 的错误覆盖一切，原始错误丢失 |

### **2.3 `throw` 语句**

`throw` 用于**手动抛出**错误；可以抛出任何值，但抛 `Error` 或其子类实例是最佳实践。

```js
function validateInput(value) {
  if (typeof value !== 'number' || value < 0) {
    throw new TypeError('Input must be a non-negative number.') // 抛出 TypeError
  }
  return value
}

try {
  const result = validateInput(-5) // 抛出错误
  console.log(result)
} catch (err) {
  console.error('Validation error:', err.name, err.message)
}
// Output: Validation error: TypeError Input must be a non-negative number.
```

- `throw` 之后的语句**不会执行**——立即中断执行流，沿调用栈向上找最近的 `catch`。
- `throw` 是**语句而不是表达式**，不能直接写在箭头函数简写体、`??` 右侧或三元表达式里；需要时包一层立即执行函数，如 `const name = input ?? (() => { throw new Error('缺少 name') })()`。
- 抛出 `Error` 是成本最低的“**补栈**”方式：构造时引擎自动记录调用栈；抛字符串、数字、`null` 都没有栈。
- 抛出前把上下文写进 `message` 或 `cause`；等 `catch` 里才发现“**信息不够**”，已经不在现场了。

### **2.4 抛出任意值的陷阱**

语法上 `throw` 可以跟任何值，但只有 `Error` 及其子类实例才带 `name`、`message`、`stack`；抛字符串，接收方拿到的就只是一个字符串。

```js
try {
  throw '用户名不能为空' // 语法合法，但接收方拿不到任何结构化信息
} catch (err) {
  console.log(typeof err) // "string"
  console.log(err instanceof Error) // false
  console.log(err.message) // undefined
  console.log(err.stack) // undefined
}
```

`throw null` / `throw undefined` 更危险：`catch (err)` 里访问 `err.message` 会再抛一次 `TypeError`，错误处理代码自己成了新的错误源。

收到非 `Error` 值的第一步是**归一化**成 `Error` 再处理：

```js
function toError(value) {
  if (value instanceof Error) return value
  const text =
    typeof value === 'string' ? value : '非 Error 抛出值: ' + String(value)
  return new Error(text)
}

try {
  riskyCall() // 可能抛出任意值的老代码
} catch (err) {
  const error = toError(err)
  console.error(error.name, error.message, error.stack)
}
```

## **3. 异步错误处理**

异步错误处理是 JS 错误处理中最复杂的部分，因为 `try...catch` 无法直接捕获异步回调中的错误。

### **3.1 回调函数模式 (Callback Pattern)**

回调式异步代码通常约定**回调的第一个参数是错误对象 `err`**。

```js
function fetchData(url, callback) {
  // 模拟异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5
    if (success) {
      callback(null, 'Data from ' + url) // 成功，第一个参数为 null
    } else {
      callback(new Error('Failed to fetch data from ' + url)) // 失败，第一个参数为错误
    }
  }, 1000)
}

fetchData('api/users', (err, data) => {
  if (err) {
    // 检查错误
    console.error('Error fetching data:', err.message)
    return
  }
  console.log('Received data:', data)
})
```

**缺点**: 嵌套回调导致“**回调地狱**”，错误处理分散且复杂。

回调模式的几个坑：

- **回调里的 `throw` 不会回到调用方**：定时器回调、事件监听器都在**另一个调用栈**上执行，外层的 `try...catch` 早已结束。
- **约定必须一致**：Node 的“**错误优先回调**”是 `callback(err, data)`，成功时 `err` 为 `null`，失败时 `data` 不可用，调用方必须先判 `if (err)` 再用。
- **要么处理，要么传递**：回调里忘记 `return` 会让错误分支继续往下执行。

```js
try {
  setTimeout(() => {
    throw new Error('定时器里的错误')
  }, 0)
} catch (err) {
  console.log('永远不会执行')
}
```

`try...catch` 只覆盖“**注册定时器**”这一步；回调在定时器到期后执行，处在全新的调用栈上，错误只能落到全局兜底。

### **3.2 Promise 模式**

`Promise` 提供了统一的异步错误处理机制。

- **`reject(reason)`**: 异步操作失败时调用，将 Promise 状态变为 `rejected`。
- **`.catch(onRejected)`**: 捕获 Promise 链中任何位置产生的 `rejected`。
- **`.then(onFulfilled, onRejected)`**: `onRejected` 也能捕获错误，但推荐把 `.catch` 放在链末尾，这样能捕获链中任一 `then` 块抛出的错误。

```js
function asyncOperation() {
  return new Promise((resolve, reject) => {
    const success = Math.random() > 0.5
    setTimeout(() => {
      if (success) {
        resolve('Async operation successful!')
      } else {
        reject(new Error('Async operation failed!'))
      }
    }, 1000)
  })
}

asyncOperation()
  .then(data => {
    console.log(data)
    throw new Error('Error in .then chain') // 链中抛出的错误也会被捕获
  })
  .catch(error => {
    // 捕获 asyncOperation() 的错误或 .then 链中的错误
    console.error('Caught in Promise catch:', error.message)
  })
  .finally(() => {
    console.log('Promise chain completed.')
  })
```

**错误在 Promise 链中的传播规则**有三条：

- **跳过 `.then`，直到遇到 `.catch`**：Promise 变为 rejected 后，后面所有 `.then(onFulfilled)` 都被跳过，直到某个 `.catch`（或 `then` 的第二个参数）处理它。
- **每个 `.then` 返回的都是新 Promise**：回调里 `throw`、或返回 rejected 的 Promise，都会让新 Promise 也 rejected，错误一路“**冒泡**”到链尾。
- **`.catch` 会“消化”错误**：`catch` 正常返回后链恢复为 fulfilled，后续 `.then` 继续执行；`catch` 里再次 `throw` 则继续下传。

```js
Promise.reject(new Error('原始错误'))
  .then(() => console.log('被跳过'))
  .catch(err => {
    console.log('处理:', err.message)
    return '恢复值' // 消化错误，链恢复为 fulfilled
  })
  .then(value => console.log('继续执行:', value))
  .finally(() => console.log('无论成功失败都会执行'))
```

`.finally` 与 `try...finally` 语义一致：**不接收参数、不改变状态**；例外是它自己返回 rejected 的 Promise 或抛错，那会覆盖原状态。

**组合多个 Promise 时失败语义各不相同**，先想清楚“**一个任务失败要不要毁掉全部结果**”：

[width(26,51,23)]

| 方法                 | 有任务失败时                                      | 何时 settle          |
| :------------------- | :------------------------------------------------ | :------------------- |
| `Promise.all`        | **立即 reject**，只带第一个错误，其余结果被丢弃   | 全部成功，或任一失败 |
| `Promise.allSettled` | **不会 reject**，返回 `{ status, value, reason }` | 全部 settle          |
| `Promise.race`       | 失败者是最快的那个时，就 reject                   | 最快的那个 settle    |
| `Promise.any`        | 全部失败才 reject，错误类型是 `AggregateError`    | 任一成功             |

```js
async function loadDashboard() {
  const tasks = [loadUser(), loadOrders(), loadNotices()]

  // all：一个失败就整体失败，适合“缺一不可”的数据
  try {
    const [user, orders, notices] = await Promise.all(tasks)
    render(user, orders, notices)
  } catch (err) {
    console.error('关键数据加载失败：', err.message)
    renderFallback()
  }

  // allSettled：部分失败也要展示其余数据，适合“可降级”的模块
  const results = await Promise.allSettled(tasks)
  const failed = results.filter(item => item.status === 'rejected')
  console.warn(`仪表盘有 ${failed.length} 个模块加载失败`)
}

loadDashboard()
```

> `Promise.all` 的“**立即 reject**”只代表**它自己**放弃等待，其余 Promise 不会被取消，回调仍会执行，只是结果没人接收；取消请求要靠 `AbortController`。

### **3.3 `async/await` 模式**

`async/await` 是 `Promise` 的语法糖，让异步代码能用同步的 `try...catch` 处理错误。

```js
async function performAsyncAction() {
  try {
    console.log('Starting async action...')
    const result = await asyncOperation() // 等待 Promise 解决
    console.log('Result:', result)

    // 模拟 await 后面代码的错误
    if (result.includes('successful')) {
      throw new Error('Further processing error!')
    }
  } catch (error) {
    // 捕获 asyncOperation() 的 reject 或 try 块中抛出的任何错误
    console.error('Caught in async/await try...catch:', error.message)
  } finally {
    console.log('Async action finished.')
  }
}

performAsyncAction()
```

`async/await` 让错误处理写起来像同步代码，但**边界没有消失**：`try...catch` 只覆盖 `await` 表达式与函数体内的同步代码，覆盖不到“**回调里**”的错误。

```js
async function loadAll(ids) {
  // 错误写法：forEach 不等待 async 回调，回调里的错误也逃出了 try...catch
  ids.forEach(async id => {
    const data = await load(id)
    console.log(data)
  })
  console.log('这行会在所有请求完成之前打印')
}

async function loadAllFixed(ids) {
  // 正确写法一：并发 + 统一捕获
  const concurrent = await Promise.all(ids.map(id => load(id)))

  // 正确写法二：串行
  const serial = []
  for (const id of ids) {
    serial.push(await load(id))
  }
  return [concurrent, serial]
}
```

**`return await` 与 `return` 的区别**是 `async` 函数里最隐蔽的边界：`return await p` 在**当前函数内**等待 `p`，失败能被本函数的 `try...catch` 捕获；`return p` 直接把 `p` 交给调用方，本函数的 `catch` 捕获不到。

```js
async function withAwait() {
  try {
    return await Promise.reject(new Error('失败'))
  } catch (err) {
    return '被当前函数捕获：' + err.message // 会执行
  }
}

async function withoutAwait() {
  try {
    return Promise.reject(new Error('失败'))
  } catch (err) {
    return '不会执行到这里'
  }
}
```

需要在本函数内兜底、打日志、做降级时用 `return await`；单纯传结果时 `return p` 更省一次微任务。

`async` 函数返回的 Promise 若没被 `await`、也没接 `.catch()`，其 rejection 会变成**未处理的 rejection**；内部 `try...catch` 的 `catch` 里再 `throw` 同样落到全局。

### **3.4 `AbortController` 与 `AbortError`**

“**用户主动取消**”语义上不是错误，实现上却是 rejected 的 Promise。不加区分地把 `AbortError` 当失败上报，监控里会充满噪声。

`fetch` 通过 `signal` 支持取消：

```js
async function fetchWithTimeout(url, timeout = 3000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    return await response.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      // 主动取消：超时、路由切换、组件卸载，通常静默处理或走降级
      console.warn('请求已取消')
      return null
    }
    throw err // 其它错误继续向上抛
  } finally {
    clearTimeout(timer) // 无论成功失败都清理定时器
  }
}
```

- `controller.abort(reason)` 可以带上取消原因（默认是 `name` 为 `AbortError` 的 `DOMException`），原因可通过 `signal.reason` 读取。
- 更简洁的写法是 `AbortSignal.timeout(ms)`，抛出的错误 `name` 是 `TimeoutError`，可与“**手动取消**”区分开。
- 取消是**幂等**的：多次 `abort()` 不会重复触发事件，`signal.aborted` 一直为 `true`。
- 判断取消不要只用 `err instanceof DOMException`，`err.name === 'AbortError'` 更通用，也可以直接查 `signal.aborted`。

```js
const controller = new AbortController()
const { signal } = controller

signal.addEventListener('abort', () => {
  console.log('取消原因:', signal.reason?.message ?? signal.reason)
})

controller.abort(new Error('用户离开了页面'))
console.log(signal.aborted) // true
```

### **3.5 重试与退避 (Retry & Backoff)**

并非所有失败都值得重试：**只有“瞬时失败”适合重试**（网络抖动、5xx、限流），参数错误（4xx）、校验失败、`AbortError` 重试多少次都没用。重试还要配合退避，否则会把本已过载的服务打得更惨。

```js
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function isRetryable(err) {
  if (err.name === 'AbortError') return false
  if (typeof err.status === 'number') return RETRYABLE_STATUS.has(err.status)
  return err.name === 'TypeError' // fetch 的网络层失败
}

async function retry(fn, { retries = 3, baseDelay = 300, signal } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === retries || !isRetryable(err)) throw err
      // 指数退避 + 随机抖动，避免大量客户端在同一时刻重试
      const delay = baseDelay * 2 ** attempt + Math.random() * 100
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay)
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            reject(signal.reason)
          },
          { once: true },
        )
      })
    }
  }
  throw lastError
}
```

> 重试的三个前提：**幂等**（重复执行无副作用）、**有上限**（次数与总时长都设限）、**能被打断**（路由切换时能取消）。非幂等的写操作（下单、支付）要靠服务端幂等键，而不是客户端盲目重试。

## **4. 全局错误捕获**

设置全局错误监听，可以防止未捕获的错误拖垮程序。

### **4.1 浏览器环境**

#### 4.1.1 **`window.onerror`**

捕获所有未被 `try...catch` 捕获的**同步**运行时错误（包括来自外部脚本的错误）。

```js
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global Error Caught:', {
    message,
    source,
    lineno,
    colno,
    error,
  })
  // 通常用于上报错误信息到监控系统
  return true // 返回 true 可以阻止浏览器默认的错误处理（即不再控制台打印错误）
}

// 示例：一个未捕获的同步错误
// nonExistentFunction();
```

参数依次是「错误信息、脚本地址、行号、列号、错误对象」；**跨域脚本**出错时第五个参数是 `null`。能用 `error` 对象就优先用它，不要解析字符串化的 `message`。

需要更细的控制，可以用 `addEventListener` 监听 `error` 事件：

```js
window.addEventListener('error', event => {
  if (event instanceof ErrorEvent) {
    console.error('脚本错误:', event.error ?? event.message)
    return
  }
  // 资源（img / script / link）加载失败也走 error 事件，此时 event.target 是那个元素
  console.error('资源加载失败:', event.target)
})
```

两者的差别：`onerror` 是单值属性，重复赋值**互相覆盖**；`addEventListener` 可叠加监听器，用 `event.preventDefault()` 代替 `return true`。**资源加载错误不会冒泡**，必须在捕获阶段监听。

**跨域脚本的错误信息会被浏览器吞掉**：`<script>` 来自其它源又没开 CORS 时，出于安全考虑只会把 `"Script error."` 交给 `window.onerror`，`source`、行号、列号全是 0，`error` 也是 `null`。

```html
<!-- 加上 crossorigin，并让 CDN 返回 Access-Control-Allow-Origin，才能拿到真实错误信息 -->
<script src="https://cdn.example.com/app.js" crossorigin="anonymous"></script>
```

注意：`crossorigin` 会让请求带上 `Origin` 头，服务端必须返回 `Access-Control-Allow-Origin`，否则脚本直接加载失败；同源与内联脚本不受此限制。

**`reportError()` 手动触发一次“全局错误”**：把错误交给浏览器既有的全局错误管线（`error` 事件 / `window.onerror`），但**不中断执行流**，也不会被外层 `try...catch` 捕获。

```js
// 事件总线、SDK 里最常用的写法：
// 自己已经捕获了错误（不能让一个回调失败影响其它回调），但仍希望它被全局监控收走
callbacks.forEach(callback => {
  try {
    callback()
  } catch (err) {
    reportError(err) // 交给全局错误管线继续处理
  }
})
```

其支持为Chrome 95+ /Edge 95+ /Firefox 93+ /Safari 15.4+;Node.js 中**没有**这个全局函数，需要自己封装上报。

#### 4.1.2 **`window.onunhandledrejection`**

捕获所有未被 `.catch()` 捕获的 Promise rejection。

```js
window.onunhandledrejection = function (event) {
  console.error('Unhandled Promise Rejection:', event.reason)
  // event.promise 是被拒绝的 Promise 对象
  // event.reason 是拒绝的原因
  // 通常用于上报 Promise 拒绝信息
  // return true; // 阻止浏览器默认行为
}

// 示例：一个未处理的 Promise 拒绝
// new Promise((resolve, reject) => reject('Whoops!'));
```

触发时机：**当前任务（宏任务）中产生的 rejection，若在这一轮微任务全部清空后仍未被处理，就会触发 `unhandledrejection`**；所以下面这种“**稍后再 catch**”无效，事件已经触发过了。

```js
const pending = Promise.reject(new Error('失败'))

// 太晚了：这一行执行时，unhandledrejection 已经触发
setTimeout(() => pending.catch(() => {}), 0)
```

反过来，补上处理函数后浏览器会再触发一次 `rejectionhandled`。`event.promise` 是被拒绝的 Promise，`event.reason` 是拒绝原因；`event.preventDefault()`（在 `onunhandledrejection` 里是 `return true`）可阻止默认输出。

### **4.2 Node.js 环境**

#### 4.2.1 **`process.on('uncaughtException', handler)`**

捕获所有未被 `try...catch` 捕获的**同步**运行时错误。

- **注意**：捕获 `uncaughtException` 后进程状态不确定，**不建议继续正常运行**，应执行清理（如关闭数据库连接）后优雅退出。

```js
process.on('uncaughtException', err => {
  console.error('Caught exception (sync):', err)
  // 执行清理，然后退出
  process.exit(1)
})
// nonExistentFunction();
```

#### 4.2.2 **`process.on('unhandledRejection', handler)`**

捕获所有未被 `.catch()` 捕获的 Promise rejection。

```js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // 记录错误，但不强制退出，除非错误非常严重
})
// new Promise((resolve, reject) => reject('Whoops Node!'));
```

- **默认行为**：Node.js 15 起未处理的 rejection 默认按 `--unhandled-rejections=throw` 处理，即当作未捕获异常退出进程；注册 `unhandledRejection` 监听器会**接管**该行为。
- **`uncaughtException` 之后进程状态不可信**：异常可能发生在写文件、改状态的中途，继续服务会产生脏数据。正确做法是记录日志、清理后 `process.exit(1)` 退出，由进程管理器（PM2、K8s）拉起。
- **退出码要正确**：可以用 `process.exitCode = 1` 代替 `process.exit(1)`，让已排队的日志写完。
- **`rejectionHandled`**：与浏览器侧的 `rejectionhandled` 对应，处理“**事后才补上 `catch`**”的情况。
- **`EventEmitter` 的 `error` 事件是特例**：没有监听器时，`emit('error')` 会直接抛出，变成未捕获异常。
- **Worker 的错误不会自动冒泡到主线程**：`worker.on('error')` 需要单独监听。

```js
process.on('unhandledRejection', reason => {
  console.error('未处理的 rejection:', reason)
  process.exitCode = 1 // 记录失败状态，但仍让日志刷完
})

process.on('uncaughtException', err => {
  console.error('未捕获异常:', err)
  // 执行清理（关闭连接池、刷盘），然后退出
  process.exit(1)
})
```

### **4.3 UI 框架的错误边界**

React、Vue 这类框架里，渲染阶段的错误冒泡到全局会导致整棵组件树被卸载、页面白屏，比“**局部坏掉**”糟糕得多。**错误边界（Error Boundary）** 把错误限制在组件子树内并渲染兜底 UI。

React 的错误边界是实现 `getDerivedStateFromError` / `componentDidCatch` 的类组件：

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true } // 触发兜底 UI 的渲染
  }

  componentDidCatch(error, info) {
    // 这里有 error 与组件栈，适合上报
    reportErrorToServer(error, { componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return <Fallback />
    }
    return this.props.children
  }
}
```

Vue 3 通过应用级配置和组件级钩子处理：

```js
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  // info 标识错误来源，如 "render function"、"native event handler"
  console.error('Vue 错误:', info, err)
  reportErrorToServer(err, { info })
}
```

**错误边界的能力边界必须记清**，否则会出现“**包了 ErrorBoundary 还是白屏**”：

[width(26,74)]

| 错误边界能捕获       | 错误边界捕获不到                                        |
| :------------------- | :------------------------------------------------------ |
| 子组件渲染阶段的错误 | 事件处理器中的错误（React；Vue 的 `errorHandler` 例外） |
| 生命周期方法中的错误 | `setTimeout` / `Promise` / 回调里的错误                 |
| 构造函数中的错误     | 服务端渲染（SSR）过程中的错误                           |
|                      | 错误边界组件**自身**抛出的错误                          |

捕获不到的部分仍要交给 `window.onerror`、`unhandledrejection` 和异步代码自己的 `try...catch`。较新的 React 在 `createRoot` 上提供了 `onUncaughtError`、`onCaughtError`、`onRecoverableError` 等回调。

### **4.4 各种捕获手段的定位差异**

[width(17,10,20,20,33)]

| 手段                     | 环境      | 能捕获                                 | 捕获不到                        | 主要限制                                     |
| :----------------------- | :-------- | :------------------------------------- | :------------------------------ | :------------------------------------------- |
| `window.onerror`         | 浏览器    | 未捕获的同步错误、未捕获的异步回调错误 | Promise rejection、资源加载失败 | 单值属性，多次赋值互相覆盖                   |
| `error` 事件（捕获阶段） | 浏览器    | 同上 + 资源加载失败                    | Promise rejection               | 资源错误不是 `ErrorEvent`，没有 `error` 对象 |
| `unhandledrejection`     | 浏览器    | 未处理的 Promise rejection             | 已经 `.catch()` 的错误          | 触发时机在微任务清空之后，补 catch 来不及    |
| `reportError()`          | 浏览器    | 主动上报的错误                         | ——                              | 只是把错误送进全局管线，不中断流程           |
| `uncaughtException`      | Node.js   | 未捕获的同步错误                       | ——                              | 触发后进程状态不可信，应尽快退出             |
| `unhandledRejection`     | Node.js   | 未处理的 rejection                     | 已处理的 rejection              | 注册监听器即接管默认退出行为                 |
| ErrorBoundary            | React/Vue | 渲染、生命周期阶段的错误               | 事件处理器、异步回调            | 框架层能力，需与全局监听配合                 |
| `crossorigin` + CORS     | 浏览器    | 让跨域脚本的错误可读                   | 未配置 CORS 的第三方脚本        | 服务端必须返回 `Access-Control-Allow-Origin` |

## **5. 自定义错误类型**

继承 `Error` 类可以创建自定义错误，提供更具体的错误信息。

```js
class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message) // 调用父类 Error 的构造函数
    this.name = 'NetworkError' // 设置错误名称
    this.statusCode = statusCode
    // V8 专有：把栈顶截断到调用处，去掉构造函数那一帧
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError)
    }
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}

function fetchUser(userId) {
  if (typeof userId !== 'number' || userId <= 0) {
    throw new ValidationError('Invalid user ID', [
      { field: 'userId', message: 'must be a positive number' },
    ])
  }
  // 模拟网络请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve({ id: userId, name: `User ${userId}` })
      } else {
        reject(new NetworkError(`Failed to fetch user ${userId}`, 500))
      }
    }, 1000)
  })
}

async function getUserInfo(id) {
  try {
    const user = await fetchUser(id)
    console.log('User:', user)
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Client input validation failed:', error.errors)
    } else if (error instanceof NetworkError) {
      console.error(
        'Network error fetching user:',
        error.message,
        'Status:',
        error.statusCode,
      )
    } else {
      console.error('An unexpected error occurred:', error)
    }
  }
}

getUserInfo(0) // ValidationError
getUserInfo(123) // NetworkError or User data
```

三个关键点：

- **`super(message)` 必须在访问 `this` 之前调用**，引擎已为 `this` 准备好 `stack`。
- **`this.name = 'NetworkError'`**：让 `err.name`、`err.toString()` 和监控平台的错误分组都能识别出类型；不改的话所有自定义错误都显示成 `"Error"`。
- **`Error.captureStackTrace(this, NetworkError)` 是 V8 专有 API**（Chrome、Node.js），把栈顶“**截断**”到 `NetworkError` 的调用处，去掉构造函数那一帧；Firefox、Safari 没有它，用前先判断是否存在。

### **5.1 保留原始错误：`cause` 与错误链**

跨层调用（UI → 状态 → 请求 → 底层）时，“**就地抛出一个新错误**”会丢掉原始信息。ES2022 的 `cause` 选项把底层错误挂在 `error.cause` 上，形成错误链。

```js
class DataSourceError extends Error {
  constructor(message, options) {
    super(message, options) // 透传 cause
    this.name = 'DataSourceError'
  }
}

async function loadConfig() {
  try {
    return await readFile('config.json')
  } catch (err) {
    throw new DataSourceError('配置加载失败', { cause: err }) // 保留底层错误
  }
}
```

注意 `cause` **不会自动出现在 `stack` 里**，打印或上报时必须显式读取，否则丢掉的正是最有价值的一层；递归序列化整条错误链最稳妥。

### **5.2 错误对象的序列化与上报**

`Error` 的 `message`、`stack`、`cause` 都是**不可枚举**属性，`JSON.stringify(new Error('出错了'))` 得到 `{}`——这就是“**上报到监控平台却发现错误是空的**”最常见原因。

```js
console.log(JSON.stringify(new Error('出错了'))) // "{}"

function serializeError(error) {
  if (!(error instanceof Error)) {
    return { name: 'NonError', message: String(error) }
  }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause ? serializeError(error.cause) : undefined,
  }
}

console.log(JSON.stringify(serializeError(new Error('出错了'))))
```

还有几个与上报相关的现实问题：

- **跨 realm 后 `instanceof` 失效**：`iframe`、`Worker`、`vm` 里创建的错误与本页面的 `Error` 不是同一个构造函数，`err instanceof Error` 返回 `false`；用 `Object.prototype.toString.call(err) === '[object Error]'` 或 `err?.name` / `err?.stack` 这类鸭子类型更稳。
- **上报请求可能来不及发出**：页面卸载时的上报要用 `navigator.sendBeacon()` 或 `fetch(url, { keepalive: true })`，普通 `fetch` 可能在请求发出前页面就被销毁。
- **`stack` 是压缩后的**：生产环境栈里的位置形如 `app.4f3c.js:1:23841`，必须在监控平台上传 sourcemap 才能还原成源码位置。

### **5.3 `AggregateError`：把多个错误合并成一个**

一个操作可能同时产生多个错误（批量任务、`Promise.any` 全部失败），拆成多次上报会丢上下文。ES2021 的 `AggregateError` 提供了标准的聚合容器。

```js
const failures = [new Error('A 失败'), new Error('B 失败')]
const aggregated = new AggregateError(failures, '批量任务失败')

console.log(aggregated.name) // "AggregateError"
console.log(aggregated.message) // "批量任务失败"
console.log(aggregated.errors.length) // 2
console.log(aggregated instanceof Error) // true（它同样继承自 Error）
```

`Promise.any` 在全部失败时抛出的正是它：

```js
async function firstAvailable(urls) {
  try {
    return await Promise.any(urls.map(url => fetch(url)))
  } catch (err) {
    // err 是 AggregateError，err.errors 里保存着每个源失败的原因
    const reasons = err.errors.map(item => item.message)
    throw new Error('所有数据源都不可用: ' + reasons.join('; '))
  }
}
```

`err.errors` 是**数组**，且只有 `AggregateError` 拥有；判断时用 `Array.isArray(err.errors)` 做鸭子类型，比死抠构造函数更可靠。

### **5.4 判断错误类型的几种方式**

[width(13,34,20,33)]

| 方式         | 写法                             | 适用场景                  | 风险                                                    |
| :----------- | :------------------------------- | :------------------------ | :------------------------------------------------------ |
| `instanceof` | `err instanceof NetworkError`    | 同一 realm 内的自定义错误 | 跨 iframe / Worker / 序列化后失效；ES5 编译产物可能失效 |
| `name`       | `err.name === 'AbortError'`      | 内置错误、`DOMException`  | 名字可以被随意改写                                      |
| 自定义字段   | `err.code === 'ENOENT'`          | Node 系统错误、业务错误码 | 需要约定，且要防 `err` 不是对象                         |
| 鸭子类型     | `typeof err.status === 'number'` | 跨包、跨版本的错误对象    | 判断条件过多时语义会变模糊                              |

推荐**组合判断**，并在入口处把不认识的错误归一化：

```js
function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError'
}

function getErrorCode(error) {
  if (!error || typeof error !== 'object') return 'NON_OBJECT'
  if (typeof error.code === 'string') return error.code // Node: ENOENT / ECONNRESET
  if (error.name) return error.name // 浏览器: AbortError / TypeError
  return 'UNKNOWN'
}
```

> TypeScript 中 `catch (err)` 的 `err` 是 `unknown`（4.4 起为默认行为），必须先收窄再访问属性——这与运行时“先判断再取值”一致。

## **6. 最佳实践**

### 6.1 不要“吞噬”错误 (Don't Swallow Errors)

- 捕获后什么都不做是最糟的处理，问题难以发现和调试。

  ```js
  try {
    /* ... */
  } catch (e) {
    /* 什么都不做 */
  } // Bad!
  ```

### 6.2 区分可恢复错误与不可恢复错误

- **可恢复**：日志记录、提示用户、重试、返回默认值；**不可恢复**：记录错误、执行清理，然后优雅关闭或重启。

### 6.3 错误上报 (Error Reporting)

- 生产环境应把捕获到的错误（含 `window.onerror`、`onunhandledrejection` 捕获的）上报到专业监控服务（Sentry、Bugsnag、Datadog）。

### 6.4 错误边界 (Error Boundaries - 针对 UI 框架)

- React 等框架中用错误边界捕获子组件树渲染阶段的错误，防止整个应用崩溃并展示兜底 UI。

### 6.5 避免使用 `try...catch` 进行控制流

- 不要用 `try...catch` 处理预期内、可用条件判断解决的“**异常**”情况（`try` 块本身几乎无开销，成本在“**抛出**”）。

### 6.6 总是使用 `Promise.catch()` 链式处理错误

- 把 `.catch()` 放在链的末尾，而不是每个 `.then()` 后面都跟一个。

### 6.7 区分 `throw new Error()` 和 `Promise.reject()`

- `throw new Error()` 立即中断当前同步执行流；`Promise.reject()` 只把 Promise 置为 rejected，不中断同步执行流。

### 6.8 性能开销与兼容性

- **`try...catch` 本身几乎不要钱**：现代 V8 不会因为函数里出现 `try` 就放弃优化，“**不要用 `try...catch` 做控制流**”的真正理由是**可读性**与**抛出成本**。
- **贵的是“抛出”**：构造错误、采集调用栈才是主要成本；V8 中 `Error.stack` 的采集是**惰性**的，所以“**构造但不打印**”很便宜，`console.error(err)` 或上报 `err.stack` 才付出代价。
- **用 `Error.stackTraceLimit` 控制栈深**：默认只采集 10 帧，热路径上频繁构造错误时可调小（如 `Error.stackTraceLimit = 5`），但排障时又希望它够用。
- **不要用抛错实现流程控制**：每秒上万次的循环里用 `throw` / `catch` 处理预期分支，会明显拖慢主线程。
- **Promise 的 rejection 也不便宜**：每次 reject 都要创建错误对象并调度微任务，高频失败场景（如轮询）应先判状态码。
- **上报要有采样与限流**：同一个错误一次会话可能触发上千次，采样、去重、批量合并是必须的。

### 6.9 实战场景：把错误收敛成统一模型

真实项目里错误来源很杂：`fetch` 抛 `TypeError`、接口返回业务错误码、用户取消抛 `AbortError`、组件渲染抛 `TypeError`。直接抛给 UI 层会得到一地的 `if`，常见做法是在**数据层边界**统一归一化成 `AppError`：

```js
class AppError extends Error {
  constructor(message, { code, cause, retryable = false } = {}) {
    super(message, { cause })
    this.name = 'AppError'
    this.code = code
    this.retryable = retryable
  }
}

function normalizeError(error) {
  if (error instanceof AppError) return error
  if (error.name === 'AbortError') {
    return new AppError('请求已取消', { code: 'ABORTED' })
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new AppError('网络不可用', {
      code: 'OFFLINE',
      retryable: true,
      cause: error,
    })
  }
  return new AppError('未知错误', { code: 'UNKNOWN', cause: error })
}
```

归一化之后，UI 层只面对少量 `code`，重试只看 `retryable`，上报也天然带上业务语义。完整链路：

- **请求层**：`try...catch` 包住 `await`，用 `AbortController` 处理取消与超时，按 `isRetryable` 决定是否退避重试。
- **状态层**：把错误归一化成 `AppError` 写入状态，而不是继续向上冒泡。
- **视图层**：按 `code` 渲染兜底 UI；无法恢复的交给 ErrorBoundary 和全局监听。
- **上报层**：序列化 `name` / `message` / `stack` / `cause` 与业务上下文，采样后上报，必要时配合 sourcemap。

## **7. 总结**

- 错误是对象：抛 `Error` 及其子类才有 `name` / `message` / `stack`；`cause` 保留错误链，`AggregateError` 合并多个错误。
- **`finally` 总会执行**，它里面的 `return` / `throw` 会覆盖之前的结果，所以只写清理逻辑。
- 同步错误沿调用栈冒泡，异步错误不会：回调靠错误优先约定，Promise 靠 `.catch()`，`async/await` 靠 `try...catch` 包住 `await`。
- 全局兜底分工：`window.onerror` / `error` 事件管脚本错误，`unhandledrejection` 管未处理的 Promise，`uncaughtException` / `unhandledRejection` 管 Node 进程，ErrorBoundary 管渲染层。
- 目标不是“**让它别报错**”，而是**就地恢复、全局兜底、上报可查**三步合一。

## **8. 常见陷阱与常见问题 (FAQ)**

### 8.1 `catch` 住错误之后，还要不要重新 `throw`？

- **能就地恢复或降级就别再抛**：给默认值、提示重试、渲染兜底文案，在 `catch` 里正常返回即可；**错误就此被消化**，调用方不会知道曾经失败过。
- **处理不了、或要让上层知道失败，必须重新抛**：直接 `throw err`（保留原始栈），或 `throw new Error('...', { cause: err })`（补上下文并保留原始错误）。
- **最怕的是“半吞”**：只打一行 `console.log` 就继续往下走，调用方还以为拿到的是合法数据。

```js
async function loadUser(id) {
  try {
    return await api.getUser(id)
  } catch (err) {
    if (err.status === 404) return null // 预期内的失败 → 就地降级
    throw err // 处理不了的失败 → 原样上抛，保留栈
  }
}
```

### 8.2 `finally` 里的 `return` 为什么会吞掉错误？

- `finally` 是**总会执行**的收尾块，它的“**突然结束**”（`return`、`throw`、`break`、`continue`）会**替换掉** `try` / `catch` 已有的完成记录，异常也在其中。
- 所以 `try { throw err } finally { return 1 }` 不会抛出，而是返回 `1`；`async` 函数里 `await` 的 rejection 也会被同样吞掉，Promise 变成 `resolved`。
- 同一条规则对返回值和异常都成立：`finally` 里的 `return` 覆盖 `try` / `catch` 的返回值，`finally` 里抛出的错误覆盖 `try` / `catch` 抛出的错误。
- **结论**：`finally` 里只写清理逻辑（`clearTimeout`、`close()`、复位状态），不要写 `return`。

```js
function pick() {
  try {
    return 'try'
  } finally {
    return 'finally' // 覆盖 try 的返回值
  }
}

console.log(pick()) // "finally"
```

```js
async function bad() {
  try {
    await Promise.reject(new Error('请求失败'))
  } finally {
    return 'ok' // 错误消失，bad() 返回 resolved 的 'ok'
  }
}
```

### 8.3 明明写了 `try...catch`，为什么异步错误还是没被捕获？

- `try...catch` 只能捕获**同一个调用栈上同步发生**的错误；异步回调执行时那个 `try` 早已结束。
- 最常见的三种漏网场景：`setTimeout` 回调、事件监听器、`forEach` 里的 `async` 回调（`forEach` 不会等待它们）。
- 对应写法：回调遵循错误优先约定，Promise 用 `.catch()`，`async` 函数用 `try...catch` 包住 `await`，其余交给全局兜底。

```js
try {
  setTimeout(() => {
    throw new Error('定时器里的错误')
  }, 0)
} catch (err) {
  console.log('不会执行')
}
```

### 8.4 `unhandledrejection` 什么时候触发？

- 触发点是「**当前任务（宏任务）结束、微任务队列清空之后，某个 rejected 的 Promise 仍然没有任何处理函数**」——不是 reject 的那一刻，也不是“**永远没人管**”的时候。
- 因此“**稍后再 catch**”来不及：`setTimeout(() => p.catch(fn), 0)` 补上的处理会触发 `rejectionhandled`，但 `unhandledrejection` 已经报过了。
- `p.then(onFulfilled)` **不算**处理 rejection（`then` 的第二个参数才算），链末端依然 rejected，照样会触发。
- 已触发的事件不会因为补了 `catch` 而“**撤回**”，上报时要去重，避免同一次失败被全局和业务各报一遍。

```js
const p = Promise.reject(new Error('失败'))

// 浏览器触发 unhandledrejection / Node 触发 unhandledRejection
setTimeout(() => p.catch(() => {}), 0) // 太晚了
```

### 8.5 自定义错误怎么保留 `stack` 和原始错误？

- `super(message)` 已让引擎记录栈，多数情况无需额外操作；`this.name = 'CustomError'` 决定它在控制台和监控里显示成什么。
- `Error.captureStackTrace(this, CustomError)` 是 V8 专有（Chrome / Node.js），把栈顶截断到调用处、去掉构造函数那一帧，用前要先判断方法是否存在。
- 原始错误用 `super(message, { cause })`（ES2022）放进 `cause`，不要靠字符串拼接；打印与上报时要主动读取 `cause`。
- 用 ES5 目标编译（老 Babel 配置）时 `class extends Error` 的原型链会断，`instanceof` 可能失效，需在构造函数里补 `Object.setPrototypeOf(this, new.target.prototype)`。

```js
class TimeoutError extends Error {
  constructor(message, options) {
    super(message, options)
    this.name = 'TimeoutError'
    if (Error.captureStackTrace) Error.captureStackTrace(this, TimeoutError)
  }
}
```

### 8.6 跨域脚本出错为什么只看到 “Script error.”？

- 这是浏览器的**安全策略**：不同源脚本的内部错误可能含敏感信息（如 URL 里的 token），默认只把 `"Script error."` 交给 `window.onerror`，行号、列号与 `error` 全被抹掉。
- 解决办法是给 `<script>` 加 `crossorigin="anonymous"`，并让 CDN / 静态服务器返回 `Access-Control-Allow-Origin`；两个条件缺一不可，缺了 CORS 头脚本直接加载失败。
- 只有**跨域外链脚本**受影响，同源与内联脚本的错误信息是完整的。

```html
<script src="https://cdn.example.com/app.js" crossorigin="anonymous"></script>
```

### 8.7 `throw` 一个字符串（或对象）有什么问题？

- 接收方拿到的是那个值本身，没有 `name`、`message`、`stack`，监控平台无法分类，也定位不到源码。
- `throw null` / `throw undefined` 更危险：`catch (err)` 里访问 `err.message` 会再抛一个 `TypeError`，错误处理代码自己变成了错误源。
- 老代码或第三方库抛出的非 `Error` 值，应该在入口处**归一化**成 `Error` 再处理。

```js
function toError(value) {
  if (value instanceof Error) return value
  const text =
    typeof value === 'string' ? value : '非 Error 抛出值: ' + String(value)
  return new Error(text)
}
```

### 8.8 上报到监控平台的错误为什么是空的？

- `Error` 的 `name`、`message`、`stack`、`cause` 大多是**不可枚举**属性，`JSON.stringify(new Error('出错了'))` 得到 `{}`；请求库封装还常把错误包成普通对象。
- 上报前要显式序列化：挑出 `name` / `message` / `stack` / `cause`（`cause` 递归），再补上业务上下文（用户 ID、路由、接口、重试次数）。
- 页面卸载时的上报要用 `navigator.sendBeacon()` 或 `fetch(..., { keepalive: true })`，普通请求会在页面销毁时被中断。
- `stack` 记录的是**压缩后**的行列号，需在监控平台上传 sourcemap 才能还原成源码位置，否则栈里全是 `app.4f3c.js:1:23841`。
