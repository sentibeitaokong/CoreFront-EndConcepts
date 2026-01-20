# HTML5 WebSocket API

传统的 HTTP 协议是“请求-响应”模式，客户端不问，服务器就不答。
**WebSocket** 的出现打破了这一限制。它建立了一条**全双工 (Full-duplex)** 的持久连接，服务器可以主动向客户端推送数据。这使得实时聊天、股票行情、在线游戏成为可能。

## 1. 核心 API 速查

WebSocket 的 API 设计非常简洁，核心只有一个 `WebSocket` 对象。

### 1.1 构造函数

```javascript
// url: 必须以 ws:// (非加密) 或 wss:// (加密, 推荐) 开头
// protocols: (可选) 子协议字符串或数组
const ws = new WebSocket(url, [protocols]);
```

### 1.2 核心事件 (Events)

| 事件名 | 触发时机 | 回调参数 (`event`) |
| :--- | :--- | :--- |
| **`onopen`** | 连接**成功建立**时触发。 | `Event` 对象。 |
| **`onmessage`**| **收到服务器数据**时触发。 | `MessageEvent` 对象。<br>`event.data` 包含实际数据。 |
| **`onclose`** | 连接**关闭**时触发 (无论正常关闭还是异常断开)。 | `CloseEvent` 对象。<br>`event.code`: 关闭状态码。<br>`event.reason`: 关闭原因。 |
| **`onerror`** | 发生**错误**时触发。 | `Event` 对象。 |

### 1.3 核心方法 (Methods)

| 方法名 | 语法 | 描述 |
| :--- | :--- | :--- |
| **`send()`** | `ws.send(data)` | **发送数据**。<br>支持类型：`String` (文本), `Blob`, `ArrayBuffer` (二进制)。 |
| **`close()`** | `ws.close([code], [reason])` | **关闭连接**。<br>`code`: 默认 1000 (正常关闭)。 |

### 1.4 核心属性 (Properties)

| 属性名 | 类型 | 描述 |
| :--- | :--- | :--- |
| **`readyState`** | Number | **当前状态** (只读)。<br>`0` (CONNECTING): 连接中<br>`1` (OPEN): 已连接<br>`2` (CLOSING): 关闭中<br>`3` (CLOSED): 已关闭 |
| **`bufferedAmount`**| Number | **缓冲队列大小**。已调用 `send()` 但尚未发送到网络的数据字节数。用于流控。 |
| **`binaryType`** | String | **二进制数据类型**。默认为 `"blob"`，可设为 `"arraybuffer"`。 |

## 2. 完整实战示例
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 WebSocket 示例</title>
</head>
<body>
    <h2>WebSocket 实时聊天</h2>
    <div id="messages" style="border: 1px solid #ccc; height: 200px; overflow-y: scroll; padding: 10px;"></div>
    <input type="text" id="messageInput" placeholder="输入消息">
    <button onclick="sendMessage()">发送</button>

    <script>
        let ws;
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');

        function connectWebSocket() {
            // 请替换为您的 WebSocket 服务器地址
            // 例如：const ws = new WebSocket('ws://localhost:3000');
            // 1. 创建连接 (建议使用 wss:// 安全协议)
            ws = new WebSocket('wss://echo.websocket.org'); // 使用公共测试服务器
            // 2. 设置二进制数据类型 (如果你传输的是文件/音视频)
            ws.binaryType = "arraybuffer";
            // 3. 监听连接打开
            ws.onopen = function() {
                messagesDiv.innerHTML += '<p><strong>连接已建立。</strong></p>';
            };
            // 4. 监听收到消息
            ws.onmessage = function(event) {
                messagesDiv.innerHTML += `<p><strong>接收:</strong> ${event.data}</p>`;
                messagesDiv.scrollTop = messagesDiv.scrollHeight; // 滚动到底部
            };
            // 5. 监听连接关闭
            ws.onclose = function() {
                messagesDiv.innerHTML += '<p><strong>连接已关闭。</strong></p>';
            };
            // 6. 监听错误
            ws.onerror = function(error) {
                messagesDiv.innerHTML += `<p style="color: red;"><strong>错误:</strong> ${error.message}</p>`;
            };
        }
        function sendMessage() {
            const message = messageInput.value;
            if (message && ws && ws.readyState === WebSocket.OPEN) {
                //发送消息
                ws.send(message);
                messagesDiv.innerHTML += `<p><strong>发送:</strong> ${message}</p>`;
                messageInput.value = '';
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else if (ws.readyState !== WebSocket.OPEN) {
                alert('WebSocket 连接未打开，请稍候或重试。');
            }
        }

        // 页面加载时连接 WebSocket
        window.onload = connectWebSocket;
    </script>
</body>
</html>
```

##  3. 进阶：心跳与重连 (Heartbeat & Reconnect)

原生 WebSocket 最大的坑在于：**它不会自动重连，且容易被防火墙静默断开。** 生产环境必须实现这两个机制。

### 3.1 心跳机制 (Keep-Alive)
防止连接因长时间没有数据传输而被路由器/防火墙切断。

```javascript
let heartbeatInterval;

function startHeartbeat(ws) {
  heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' })); // 发送心跳包
    }
  }, 30000); // 每30秒一次
}

ws.onopen = () => {
  startHeartbeat(ws);
};

ws.onclose = () => {
  clearInterval(heartbeatInterval); // 断开时停止心跳
};
```

### 3.2 断线重连
```javascript
function connect() {
  const ws = new WebSocket(url);
  
  ws.onclose = (e) => {
    console.log('连接断开，3秒后重连...');
    setTimeout(() => {
      connect(); // 递归调用重连
    }, 3000);
  };
  
  // ... 其他绑定
}
```

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: 可以在 HTTP 页面连接 `wss://` 吗？可以在 HTTPS 页面连接 `ws://` 吗？
*   **HTTP 页面** -> 连接 `ws://` (可行) 或 `wss://` (可行)。
*   **HTTPS 页面** -> **必须连接 `wss://`**。连接 `ws://` 会被浏览器作为“混合内容 (Mixed Content)”拦截并报错。

### Q2: 怎么在建立连接时添加自定义 Headers（如 Token）？
**WebSocket 标准 API 不支持自定义 Headers。**
这是 WebSocket API 设计的一大痛点。你不能像 Ajax 那样设置 `Authorization` 头。
**替代方案**：
1.  **URL 参数** (最常用): `ws://api.com?token=xyz`
2.  **子协议数组**: `new WebSocket(url, ["access_token", "xyz"])` (需要服务端配合解析)。
3.  **握手后发送**: 连接成功后，第一条消息发送 Token 进行认证。

### Q3: 为什么连接过一会就自动断开了？
**原因**: 网络设备（Nginx, 负载均衡, 防火墙）通常有超时设置（如 60秒无数据传输自动切断 TCP 连接）。

**解法**: 必须实现 **心跳机制 (Ping/Pong)**，每隔 30-50 秒发送一个空包保持连接活跃。

### Q4: 怎么发送图片或文件？
不要把文件转成 Base64 字符串发送（体积会变大 33%）。
请直接发送 `Blob` 或 `ArrayBuffer`。
```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
ws.send(file); // 浏览器会自动处理二进制流
```

### Q5: WebSocket 会跨域吗 (CORS)？
**会，但机制不同**。
WebSocket 没有浏览器的同源策略限制（你可以随便连别人的 WebSocket 服务）。
**但是**，浏览器会在握手请求中自动带上 `Origin` 头。服务端通常会检查这个 `Origin` 决定是否允许连接。如果服务端返回 403，连接就会失败。

### Q6: `bufferedAmount` 有什么用？
**场景**: 当你上传大文件时，如果不加限制地 `while` 循环调用 `ws.send()`，浏览器的内存会被撑爆，因为数据发不出去全堆在缓冲区。
    
**用法**:
```javascript
if (ws.bufferedAmount === 0) {
  // 缓冲区空了，发送下一块数据
  ws.send(nextChunk);
} else {
  // 等一会再发
  setTimeout(checkBuffer, 100);
}
```