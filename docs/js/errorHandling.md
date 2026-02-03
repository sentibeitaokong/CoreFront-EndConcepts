# JavaScript **错误处理 (Error Handling)**

错误处理是任何健壮应用不可或缺的一部分。在 JavaScript 中，错误处理旨在**捕获、识别、响应和恢复**代码执行中遇到的异常情况，从而防止程序崩溃、提供友好的用户体验，并帮助开发者进行调试。

## **1. 核心概念**

### **1.1 什么是错误 (Error)？**

在 JavaScript 中，错误是一个特殊的对象，它表示在程序执行期间发生了非预期的事件。当错误发生时，正常的程序流程会被中断。

### **1.2 错误的类型 (`Error` 对象)**

所有 JavaScript 错误对象都继承自内置的 `Error` 对象。`Error` 对象通常包含以下属性：

*   **`name`**: 错误的类型（如 `TypeError`, `ReferenceError`）。
*   **`message`**: 错误的详细描述信息。
*   **`stack`**: (非标准，但广泛实现) 错误发生时的调用栈信息，对于调试非常有用。

**常见的内置错误类型**:

| 错误类型 | 描述 | 示例 |
| :--- | :--- | :--- |
| **`Error`** | 所有错误对象的基类。通常用于自定义错误。 | `throw new Error('Something went wrong');` |
| **`TypeError`** | 变量或参数不是预期类型，或函数被调用时类型不正确。 | `null.method()` (`null` 不是对象); `new 123()` |
| **`ReferenceError`** | 引用了一个不存在的变量。 | `console.log(nonExistentVar);` |
| **`SyntaxError`** | JavaScript 引擎在解析代码时遇到的语法错误。 | `eval('const a =;');` |
| **`RangeError`** | 数值变量或参数超出合法范围。 | `new Array(-1);` |
| **`URIError`** | `encodeURI()` 或 `decodeURI()` 等函数参数不合法。 | `decodeURI('%');` |
| **`EvalError`** | `eval()` 函数相关错误（不推荐使用 `eval`）。 | `new EvalError('Eval error');` |

### **1.3 同步错误 vs. 异步错误**

*   **同步错误**: 发生在代码的**主执行流**中，可以使用 `try...catch` 语句直接捕获。
*   **异步错误**: 发生在**异步操作**的回调函数中。由于异步操作通常在主线程的代码执行完毕后才执行，`try...catch` 无法直接捕获，需要特殊的异步错误处理机制（如 `.catch()`，`async/await` 中的 `try...catch`）。

## **2. 同步错误处理**

### **2.1 `try...catch` 语句**

这是 JavaScript 处理同步错误的最基本方式。

*   **`try` 块**: 包含可能抛出错误的代码。
*   **`catch` 块**: 包含当 `try` 块中发生错误时要执行的代码。它接收一个错误对象作为参数。
*   **`finally` 块**: (可选) 无论 `try` 块中是否发生错误，`finally` 块中的代码**总会执行**。通常用于资源清理（如关闭文件、释放锁）。

**语法**:
```js
try {
  // 可能会抛出错误的代码
} catch (error) {
  // 错误处理逻辑
  console.error('An error occurred:', error.name, error.message);
  // error.stack 提供了调用栈信息
} finally {
  // 无论是否发生错误，都会执行的代码
  console.log('Execution finished (finally block)');
}
```

**示例**:
```js
function divide(a, b) {
  try {
    if (b === 0) {
      throw new Error("Division by zero is not allowed."); // 手动抛出错误
    }
    return a / b;
  } catch (err) {
    console.error("Error in divide function:", err.message);
    return null; // 返回一个默认值或null表示操作失败
  } finally {
    console.log("Divide operation attempted.");
  }
}

console.log(divide(10, 2));   // 5, "Divide operation attempted."
console.log(divide(10, 0));   // "Error in divide function: Division by zero is not allowed.", "Divide operation attempted.", null
```

### **2.2 `throw` 语句**

`throw` 语句用于**手动抛出**一个错误。你可以抛出任何 JavaScript 值，但通常抛出 `Error` 对象或其子类实例是最佳实践。

```js
function validateInput(value) {
  if (typeof value !== 'number' || value < 0) {
    throw new TypeError("Input must be a non-negative number."); // 抛出 TypeError
  }
  return value;
}

try {
  const result = validateInput(-5); // 抛出错误
  console.log(result);
} catch (err) {
  console.error("Validation error:", err.name, err.message);
}
// Output: Validation error: TypeError Input must be a non-negative number.
```

## **3. 异步错误处理**

异步操作的错误处理是 JS 错误处理中最复杂的部分，因为 `try...catch` 无法直接捕获异步回调中发生的错误。

### **3.1 回调函数模式 (Callback Pattern)**

在基于回调的异步代码中，通常约定**回调函数的第一个参数是错误对象 `err`**。

```js
function fetchData(url, callback) {
  // 模拟异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      callback(null, "Data from " + url); // 成功，第一个参数为 null
    } else {
      callback(new Error("Failed to fetch data from " + url)); // 失败，第一个参数为错误
    }
  }, 1000);
}

fetchData("api/users", (err, data) => {
  if (err) { // 检查错误
    console.error("Error fetching data:", err.message);
    return;
  }
  console.log("Received data:", data);
});
```
**缺点**: 嵌套回调会导致“回调地狱”，错误处理分散且复杂。

### **3.2 Promise 模式**

`Promise` 提供了统一且强大的异步错误处理机制。

*   **`reject(reason)`**: 异步操作失败时调用，将 Promise 状态变为 `rejected`。
*   **`.catch(onRejected)`**: 专门用于捕获 Promise 链中任何地方发生的 `rejected` 状态。
*   **`.then(onFulfilled, onRejected)`**: `onRejected` 参数也能捕获错误，但通常推荐将 `.catch` 放在链的末尾，这样可以捕获到链中任何一个 `then` 块抛出的错误。

```js
function asyncOperation() {
  return new Promise((resolve, reject) => {
    const success = Math.random() > 0.5;
    setTimeout(() => {
      if (success) {
        resolve("Async operation successful!");
      } else {
        reject(new Error("Async operation failed!"));
      }
    }, 1000);
  });
}

asyncOperation()
  .then(data => {
    console.log(data);
    throw new Error("Error in .then chain"); // 链中抛出的错误也会被捕获
  })
  .catch(error => { // 捕获 asyncOperation() 的错误或 .then 链中的错误
    console.error("Caught in Promise catch:", error.message);
  })
  .finally(() => {
    console.log("Promise chain completed.");
  });
```

### **3.3 `async/await` 模式**

`async/await` 是 `Promise` 的语法糖，它使得异步代码的错误处理可以像同步代码一样使用 `try...catch`。

```js
async function performAsyncAction() {
  try {
    console.log("Starting async action...");
    const result = await asyncOperation(); // 等待 Promise 解决
    console.log("Result:", result);
    
    // 模拟 await 后面代码的错误
    if (result.includes("successful")) {
        throw new Error("Further processing error!");
    }
    
  } catch (error) { // 捕获 asyncOperation() 的 reject 或 try 块中抛出的任何错误
    console.error("Caught in async/await try...catch:", error.message);
  } finally {
    console.log("Async action finished.");
  }
}

performAsyncAction();
```

## **4. 全局错误捕获**

为了防止未捕获的错误导致程序崩溃，可以设置全局的错误监听。

### **4.1 浏览器环境**

*   **`window.onerror`**: 捕获所有未被 `try...catch` 捕获的**同步** JavaScript 运行时错误（包括来自外部脚本的错误）。
    ```js
    window.onerror = function(message, source, lineno, colno, error) {
      console.error("Global Error Caught:", { message, source, lineno, colno, error });
      // 通常用于上报错误信息到监控系统
      return true; // 返回 true 可以阻止浏览器默认的错误处理（即不再控制台打印错误）
    };

    // 示例：一个未捕获的同步错误
    // nonExistentFunction(); 
    ```

*   **`window.onunhandledrejection`**: 捕获所有未被 `.catch()` 捕获的 Promise `rejected` 错误。
    ```js
    window.onunhandledrejection = function(event) {
      console.error("Unhandled Promise Rejection:", event.reason);
      // event.promise 是被拒绝的 Promise 对象
      // event.reason 是拒绝的原因
      // 通常用于上报 Promise 拒绝信息
      // return true; // 阻止浏览器默认行为
    };

    // 示例：一个未处理的 Promise 拒绝
    // new Promise((resolve, reject) => reject('Whoops!'));
    ```

### **4.2 Node.js 环境**

*   **`process.on('uncaughtException', handler)`**: 捕获所有未被 `try...catch` 捕获的**同步** JavaScript 运行时错误。
    *   **注意**: 捕获 `uncaughtException` 后，Node.js 进程通常处于不确定的状态，**不建议继续正常运行**。最佳实践是执行清理工作（如关闭数据库连接），然后优雅地退出进程。
    ```js
    process.on('uncaughtException', (err) => {
      console.error('Caught exception (sync):', err);
      // 执行清理，然后退出
      process.exit(1); 
    });
    // nonExistentFunction();
    ```

*   **`process.on('unhandledRejection', handler)`**: 捕获所有未被 `.catch()` 捕获的 Promise `rejected` 错误。
    ```js
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // 记录错误，但不强制退出，除非错误非常严重
    });
    // new Promise((resolve, reject) => reject('Whoops Node!'));
    ```

## **5. 自定义错误类型**

为了提供更具体的错误信息，可以通过继承 `Error` 类来创建自定义错误。

```js
class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message); // 调用父类 Error 的构造函数
    this.name = "NetworkError"; // 设置错误名称
    this.statusCode = statusCode;
    // 确保栈追踪正确 (对于 Babel/TypeScript 编译后的代码可能需要)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

function fetchUser(userId) {
  if (typeof userId !== 'number' || userId <= 0) {
    throw new ValidationError("Invalid user ID", [{ field: "userId", message: "must be a positive number" }]);
  }
  // 模拟网络请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve({ id: userId, name: `User ${userId}` });
      } else {
        reject(new NetworkError(`Failed to fetch user ${userId}`, 500));
      }
    }, 1000);
  });
}

async function getUserInfo(id) {
  try {
    const user = await fetchUser(id);
    console.log("User:", user);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Client input validation failed:", error.errors);
    } else if (error instanceof NetworkError) {
      console.error("Network error fetching user:", error.message, "Status:", error.statusCode);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

getUserInfo(0);     // ValidationError
getUserInfo(123);   // NetworkError or User data
```

## **6. 最佳实践与常见陷阱**

*   **1. 不要“吞噬”错误 (Don't Swallow Errors)**:
    *   最糟糕的错误处理是捕获错误后什么也不做。这使得问题难以发现和调试。
    *   ```js
        try { /* ... */ } catch (e) { /* 什么都不做 */ } // Bad!
        ```

*   **2. 区分可恢复错误与不可恢复错误**:
    *   **可恢复**: 尝试日志记录、向用户提示、提供重试选项、返回默认值。
    *   **不可恢复**: 记录错误，执行清理，然后考虑优雅地关闭应用或重新启动。

*   **3. 错误上报 (Error Reporting)**:
    *   在生产环境中，将捕获到的错误（包括 `window.onerror` 和 `onunhandledrejection` 捕获的）上报到专业的错误监控服务（如 Sentry, Bugsnag, Datadog）非常重要。

*   **4. 错误边界 (Error Boundaries - 针对 UI 框架)**:
    *   在 React 等 UI 框架中，使用错误边界组件可以捕获子组件树中渲染阶段的错误，防止整个应用崩溃，并展示备用 UI。

*   **5. 避免使用 `try...catch` 进行控制流**:
    *   `try...catch` 的开销相对较高，不应将其用于处理预期内的、可以通过条件判断解决的“异常”情况。

*   **6. 总是使用 `Promise.catch()` 链式处理错误**:
    *   避免在每个 `.then()` 后面都写一个 `.catch()`，这会导致错误处理过于分散。通常将 `.catch()` 放在链的末尾。

*   **7. 区分 `throw new Error()` 和 `Promise.reject()`**:
    *   `throw new Error()`: 立即中断当前同步执行流。
    *   `Promise.reject()`: 将 Promise 状态置为 rejected，但不会中断当前同步执行流。

*   **8. `finally` 块的返回值**:
    *   `finally` 块中的 `return` 语句会**覆盖** `try` 块或 `catch` 块中的 `return` 语句。
    *   `finally` 块中抛出的错误会**覆盖** `try` 块或 `catch` 块中抛出的错误。

