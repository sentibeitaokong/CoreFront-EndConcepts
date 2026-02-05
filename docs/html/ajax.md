# HTML/JavaScript AJAX (Asynchronous JavaScript and XML)

虽然名字里有 XML，但现代 AJAX 主要使用 **JSON** 数据格式。在 HTML 开发中，实现 AJAX 主要有两种原生方式：
1.  **`Fetch API`** (现代标准，推荐，基于 Promise)。
2.  **`XMLHttpRequest` (XHR)** (老标准，兼容性极好，基于回调)。

## 第一部分：Fetch API (现代标准)

`fetch()` 是浏览器原生提供的 API，语法简洁，基于 **Promise**，完美配合 `async/await`。

### 1. 基础语法

```js
fetch(url, [options])
  .then(response => response.json()) // 解析响应
  .then(data => console.log(data))   // 处理数据
  .catch(error => console.error(error)); // 捕获网络错误
```

### 2. API 参数详解 (`options` 对象)

| 属性 | 描述 | 常用值 |
| :--- | :--- | :--- |
| **`method`** | 请求方法 | `'GET'` (默认), `'POST'`, `'PUT'`, `'DELETE'` |
| **`headers`** | 请求头对象 | `{'Content-Type': 'application/json'}` |
| **`body`** | 请求体 (仅限 POST/PUT) | 必须是字符串 (`JSON.stringify(data)`), `FormData`, 或 `Blob` |
| **`mode`** | 跨域模式 | `'cors'` (默认), `'no-cors'`, `'same-origin'` |
| **`credentials`**| **Cookie 策略** | `'omit'` (默认，不带Cookie), `'include'` (跨域带Cookie), `'same-origin'` |
| **`cache`** | 缓存策略 | `'default'`, `'no-store'`, `'reload'`, `'force-cache'` |

### 3. Response 对象方法

`fetch` 返回的 Promise 解析后是一个 `Response` 对象，需要调用特定方法才能拿到内容。

| 方法 | 描述 |
| :--- | :--- |
| **`.json()`** | 将响应体解析为 **JSON 对象** (最常用)。 |
| **`.text()`** | 将响应体解析为 **纯文本字符串**。 |
| **`.blob()`** | 将响应体解析为 **二进制大对象** (图片/文件)。 |
| **`.formData()`**| 解析为表单数据。 |
| **`.ok`** | **Boolean 属性**。如果状态码在 200-299 之间，则为 `true`。 |
| **`.status`** | HTTP 状态码 (如 200, 404, 500)。 |

## 第二部分：XMLHttpRequest (传统标准)

虽然 `fetch` 是主流，但了解 XHR 对维护旧项目或实现特定功能（如**上传进度监控**）依然很有必要。

### 1. 核心属性和方法
| 属性/方法 | 描述 |
| :--- | :--- |
| **`open(method, url, async)`** | 初始化。`async` 默认为 `true`。 |
| **`setRequestHeader(key, val)`** | 设置请求头。**必须在 open() 之后，send() 之前调用**。 |
| **`send(data)`** | 发送请求。GET 请求传 `null`，POST 请求传数据。 |
| **`readyState`** | **0**: 未初始化, **1**: 打开, **2**: 发送, **3**: 接收中, **4**: 完成。 |
| **`status`** | HTTP 状态码 (200, 403, 500)。 |
| **`responseText`** | 服务器返回的文本数据。 |
| **`upload.onprogress`** | **独有功能**。监听文件上传进度。 |

```js
// 1. 创建对象
const xhr = new XMLHttpRequest();

// 2. 初始化请求 (Method, URL, Async)
xhr.open('GET', '/api/data', true);

// 3. 监听状态变化
xhr.onreadystatechange = function() {
  // readyState 4: 完成, status 200: 成功
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText); // 手动解析 JSON
    console.log(data);
  }
};

// 4. 发送请求
xhr.send();
```

### 2. 异常处理事件

| 事件名 | 触发时机 |
| :--- | :--- |
| **`error`** | 网络错误 (断网、DNS失败) 时触发。**注意：404/500 不会触发此事件**。 |
| **`timeout`** | 请求超时触发 (需先设置 `xhr.timeout` 属性)。 |
| **`abort`** | 调用 `xhr.abort()` 主动取消请求时触发。 |

```js
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.timeout = 5000; // 设置超时时间 5秒

// 1. 请求完成 (无论成功还是 HTTP 错误)
xhr.onload = function() {
  if (xhr.status >= 200 && xhr.status < 300) {
    // HTTP 成功
    try {
      const data = JSON.parse(xhr.responseText);
      console.log('成功:', data);
    } catch (e) {
      console.error('数据格式错误 (非 JSON)');
    }
  } else {
    // HTTP 错误 (404, 500 等)
    console.error(`服务器错误: ${xhr.status} ${xhr.statusText}`);
  }
};

// 2. 网络错误 (断网, DNS失败)
xhr.onerror = function() {
  console.error('网络连接失败');
};

// 3. 超时错误
xhr.ontimeout = function() {
  console.error('请求超时，请检查网络');
};
//设置请求头
xhr.setRequestHeader('Content-Type','application/json')
xhr.send();

```

### 3. 进度监控事件 (Progress)

XHR 将进度分为 **下载 (Download)** 和 **上传 (Upload)** 两个对象。

*   **下载进度**: 绑定在 `xhr` 本身。
*   **上传进度**: 绑定在 `xhr.upload` 对象上。

| 事件名 | 触发时机 | 回调参数 (`event`) |
| :--- | :--- | :--- |
| **`progress`** | 数据传输过程中**持续触发** (约每 50ms 一次)。 | `e.loaded`: 已传输字节。<br>`e.total`: 总字节。<br>`e.lengthComputable`: 是否知道总大小。 |

**实战：文件上传进度条**
```js
const xhr = new XMLHttpRequest();
xhr.open('POST', '/upload');

// 监听上传进度 (关键!)
xhr.upload.onprogress = function(event) {
  if (event.lengthComputable) {
    const percent = (event.loaded / event.total) * 100;
    console.log(`上传进度: ${percent.toFixed(2)}%`);
  }
};

xhr.send(formData);
```

## 第三部分：实战代码示例

### 1.使用 `async/await` 发送 POST 请求 (推荐)

这是目前最优雅的写法。

```js
async function postUser() {
  const url = 'https://api.example.com/users';
  const userData = { name: "Gemini", role: "AI" };

  try {
    const response = await fetch(url, {
      method: 'POST', // 1. 指定方法
      headers: {
        'Content-Type': 'application/json' // 2. 告诉后端我发的是 JSON
      },
      body: JSON.stringify(userData) // 3. 将对象转为字符串
    });

    // 4. Fetch 不会把 404/500 视为报错，需要手动检查
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Success:", result);

  } catch (error) {
    console.error("Network Error:", error);
  }
}
```

### 2.文件上传 (`FormData`)

利用 `FormData` 对象，浏览器会自动设置 `Content-Type: multipart/form-data`，**千万不要手动设置 Content-Type**。

```js
const input = document.querySelector('input[type="file"]');
const formData = new FormData();
formData.append('file', input.files[0]);

fetch('/upload', {
  method: 'POST',
  body: formData // 直接传 FormData 对象
});
```

### 3. 取消重复请求处理

取消重复请求是对于减少HTTP请求的一个处理、相比于防抖节流来说是更加自动化的、这篇文章会从`xhr`、`fetch`、`axios`三个方向来实现这个需求、并会基于原生的`xhr`实现取消重复请求

#### 3.1 `xhr`的取消原理

`xhr`也就是`XMLHttpRequest`类的实例、提供了一个`api abort`取消请求

```js
const xhr = new XMLHttpRequest()
var method = "GET",
    url = '/getStr'
xhr.open(method, url, true);
xhr.onreadystatechange = (state) => {
    if (xhr.readyState === 4 && (xhr.status === 200)) {
        console.log(xhr.responseText);
     }
}
xhr.abort()
```

#### 3.2 `Fetch`的取消原理

与上面类似、提供了一个`AbortController`类、并且具有`abort api`

```js
const controller = new AbortController();
const signal = controller.signal;
signal.addEventListener("abort", function (e) {
    console.log(signal, "signal的中断状态");
});


fetch("/getStr", { signal })
     .then((res) => {
        console.log(res, "请求成功");
      }).catch(function (thrown) {
        console.log(thrown);
      });
// 增加部分结束
controller.abort({
   name: "CondorHero",
   age: 19
});
```



#### 3.3 `Axios`的取消原理

`Axios`库利用`axios.CancelToken`来取消请求

```js
// 取消请求
  function send() {
    let cancel = null;
    return function () {
      if(cancel !== null) {
        cancel();
      }
      axios.request({
        method: 'GET',
        url: '/xxxx',
        cancelToken: new axios.CancelToken((c)=> {
          cancel = c;
        })
      }).then((respone)=> {
        console.log(respone)
        // 处理完成 初始化null
        cancel = null;
      })
    }
  }
```

#### 3.4 手动实现取消重复请求

重复请求的特点肯定是`url`是一样的、参数是一样的、所以我们只需要判断这两样东西是不是相等即可

- 定义一个全局的对象存储`url`
- 判断对象是否具有`url`、有的话取消请求

```js
const urlMap = {}
function getHttp(url) {
    const xhr = new XMLHttpRequest()
    var method = "GET"
    if (urlMap[url]) {
        urlMap[url] = urlMap[url] + 1
    } else {
        urlMap[url] = 1
    }
    xhr.open(method, url, true);

    xhr.send({ age: 90 });
    xhr.onreadystatechange = (state) => {
        if (xhr.readyState === 4 && (xhr.status === 200)) {
            // 请求成功了就删除记录
            delete urlMap[url]
            console.log(xhr.responseText);
        }
    }
    if (urlMap[url] !== 1) {
        // 说明之前已经请求了、无需再请求
        xhr.abort()
    }
}

getHttp('http://localhost:8000/getStr')
getHttp('http://localhost:8000/getStr')
getHttp('http://localhost:8000/getStr')
getHttp('http://localhost:8000/getStr')
getHttp('http://localhost:8000/getStr')
getHttp('http://localhost:8000/getStr?id=2')

setTimeout(() => {
    getHttp('http://localhost:8000/getStr')
}, 3000);
```

## 第四部分：常见问题 (FAQ) 与 避坑指南

### Q1: 什么是 CORS (跨域) 错误？
**现象**: 控制台报错 `Access to fetch at '...' from origin '...' has been blocked by CORS policy`.

**原因**: 浏览器的安全策略。你的网页 (`a.com`) 试图请求另一个域名 (`b.com`) 的接口，但 `b.com` 没有明确许可你访问。

**解法**:
1.  **正解**: 联系后端开发，在服务端响应头中添加 `Access-Control-Allow-Origin: *` (或你的域名)。
2.  **开发期**: 使用 Webpack/Vite 的 Proxy 代理，或者 Nginx 反向代理。**前端代码里设置 `mode: 'no-cors'` 是没用的**（那只能发请求，拿不到响应）。

### Q2: 为什么 `fetch` 没有自动带上 Cookie？
**原因**: 为了隐私，Fetch 默认不发送 Cookie。

**解法**: 添加配置 `credentials: 'include'`。
```js
fetch(url, { credentials: 'include' });
```

### Q3: 为什么请求成功了，但后端收到的 Body 是空的？
**原因**: 90% 是因为请求头和数据格式不匹配。

**检查**:
1.  如果发送 JSON，必须设置 header: `'Content-Type': 'application/json'`。
2.  **且** `body` 必须用 `JSON.stringify()` 包裹，不能直接传 JS 对象。

### Q4: 为什么 `fetch` 遇到 404 或 500 不走 `catch`？
**机制**: `fetch` 的 Promise 只有在**网络断开**或**DNS 解析失败**时才会 Reject (走 catch)。HTTP 状态码错误（如 404 Not Found）被认为是请求“成功”完成了。

**解法**: 必须在 `then` 或 `await` 之后手动判断 `if (!response.ok)`.

### Q5: 怎么获取上传进度？
**Fetch API**: 目前原生 Fetch 获取上传进度非常麻烦（需要读流）。

**XMLHttpRequest**: 原生支持。

**Axios**: 推荐使用 Axios 库，它封装了 XHR，获取进度很简单 (`onUploadProgress`)。

### Q6: 异步陷阱：为什么变量是 `undefined`？
```js
let data;
fetch(url).then(res => res.json()).then(res => {
    data = res; // 2. 后执行
});
console.log(data); // 1. 先执行 -> undefined
```
**原因**: AJAX 是异步的，JS 不会等请求结束就继续往下执行了。

**解法**: 所有依赖数据的逻辑，都必须写在 `then` 内部，或者使用 `await` 等待。
