# WebSocket vs SSE vs WebRTC：现代 Web 实时通信

**实时通信** (Realtime Communication) 指数据在产生后**立刻送达对端**、而不是等对端下次来问的一类通信方式。它和普通 HTTP 请求最根本的差别不在速度，而在**方向**：HTTP 只能“**客户端问、服务器答**”，而实时通信允许**服务器主动把数据推给客户端**。浏览器为此提供了三套彼此不重叠的机制，本文对比它们在协议栈、连接状态管理、协议开销与适用业务模型上的差异。

**一句话理解**：**WebSocket** 侧重低延迟的高频双工交互；**SSE** 是极简的单向状态同步利器；**WebRTC** 则是绕过服务端带宽瓶颈的端到端流媒体与高并发数据通道。**三者不是同一件事的三代版本，而是三条并行的路线**——选型依据是“**业务需要哪个方向、多大频率、能接受多少复杂度**”，而不是谁更先进。

> [!TIP] 相关阅读
> [HTML5 WebSocket API](/html/advanced/webSockets) 提供 WebSocket 的 API 级实战用法（构造、事件、心跳与重连）；[HTTP 协议](/networkAndBrowsers/http/http) 是这三者共同的起点（SSE 与 WebSocket 都由一次 HTTP 握手开始）；[UDP 协议](/networkAndBrowsers/transport/udp) 是 WebRTC 与 QUIC 的底座；[Web Streams](/networkAndBrowsers/browser/webStreams) 中的可读流是“用 Fetch 平替 SSE”的关键。

## 1. 核心技术选型全景矩阵

[width(16,13,19,13,17,22)]

| 技术规范      | 通信方向         | 底层协议模型                               | 协议开销                      | 典型数据流                        | 致命缺陷与限制                                              |
| ------------- | ---------------- | ------------------------------------------ | ----------------------------- | --------------------------------- | ----------------------------------------------------------- |
| **WebSocket** | 全双工           | HTTP 握手 + 自定义 TCP 帧                  | 中 (需维持心跳，帧头小)       | 文本 (JSON)、二进制 (ArrayBuffer) | 扩容困难 (需依赖 Redis Pub/Sub 广播)，需处理 CSWSH 安全问题 |
| **SSE**       | 服务端 -> 客户端 | HTTP 长响应 (`Transfer-Encoding: chunked`) | 低 (纯 HTTP)                  | UTF-8 文本流 (流式大模型输出)     | HTTP/1.1 下单域名最多并发 6 个连接，原生不支持二进制        |
| **WebRTC**    | 端到端全双工     | UDP + ICE/STUN/TURN + DTLS/SRTP            | 高 (复杂的连接协商与加密协商) | 实时音视频 (RTP)、任意数据 (SCTP) | 信令服务极度复杂，Symmetric NAT 穿透率低，需部署中继服务器  |

> [!NOTE] 高频场景
> 业务里真正要做的判断通常只有三句：**只要服务端推、且载荷是文本**（通知、行情、进度、AI 输出）→ SSE；**要双向高频交互**（聊天、协同编辑、游戏指令）→ WebSocket；**音视频或端到端传数据** → WebRTC。反向判断同样重要：实时性只要**分钟级**（报表刷新、定时同步）就别上长连接，短轮询或长轮询更省事，也少一份要维护的状态。

## 2. WebSocket：高频双工通信的工业标准

WebSocket 在 HTTP 握手阶段通过 `Connection: Upgrade` 和 `Upgrade: websocket` 请求头完成协议切换。服务端返回 `101 Switching Protocols` 后，TCP 连接被接管，完全脱离 HTTP 语义。

### 2.1 协议深度解析

- **基于帧 (Frame) 的传输**：WebSocket 规范定义了严格的 Opcode 帧类型。数据帧（`0x1` 文本帧、`0x2` 二进制帧）与控制帧（`0x8` 关闭帧、`0x9` Ping 帧、`0xA` Pong 帧）分离，有效载荷边界清晰，彻底解决了 TCP 粘包问题。
- **协议状态机**：拥有明确的 `CONNECTING`、`OPEN`、`CLOSING`、`CLOSED` 生命周期。
- **开销极低**：建立连接后，数据帧头部最小仅 2 Bytes，相比 HTTP 动辄数百 Bytes 的 Header，带宽利用率呈指数级跃升。

### 2.2 生产级工程实践与避坑

```javascript
// 现代 WebSocket 封装通常需具备指数退避重连与心跳保活机制
class WSClient {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.init()
  }
  init() {
    this.ws.onopen = () => this.startHeartbeat()
    this.ws.onclose = () => this.reconnectWithExponentialBackoff()
    this.ws.onmessage = e => this.handleMessage(e.data)
  }
  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN)
        this.ws.send(JSON.stringify({ type: 'ping' }))
    }, 30000) // 突破 Nginx 等网关默认的 proxy_read_timeout (通常 60s)
  }
}
```

- **集群扩容 (Horizontal Scaling)**：由于 WS 是有状态的长连接，传统的轮询负载均衡会导致消息路由失败。必须引入外部消息总线（如 Redis Pub/Sub、Kafka 或 RabbitMQ）在 Server 节点间广播消息，或在负载均衡层配置 IP Hash/Sticky Session。
- **安全防范 (CSWSH)**：WebSocket 握手不受同源策略 (SOP) 限制，浏览器会自动携带 Cookie。服务端**必须**强校验握手请求的 `Origin` 头，并使用 Token (如 JWT) 在连接建立时进行鉴权。

> [!NOTE] 高频场景
> 最典型的落地是 **IM 聊天、协同编辑、实时大屏、游戏指令下发**。几乎必然会遇到这五件事：**心跳**（挡 Nginx 等网关的 `proxy_read_timeout`，默认 60s 就掐）、**指数退避重连**（弱网恢复时别让全量客户端一起重连）、**鉴权**（握手阶段带 Token，不能只依赖会自动携带的 Cookie）、**消息可靠性与顺序**（重连后补拉历史，业务层自带序号）、**多端同步**（同一用户多设备在线要广播）。协同编辑还要额外引入 **OT / CRDT** 处理并发编辑冲突 —— WebSocket 只负责把操作送到，冲突合并是业务层的事。

## 3. SSE (Server-Sent Events)：单向信息流的极简哲学

SSE 利用了 HTTP 协议中的 Chunked 传输机制，服务端设置 `Content-Type: text/event-stream` 并保持连接不关闭，向 TCP 流中持续灌入特定格式的文本字符串。

### 3.1 协议规范与数据边界

SSE 强制要求使用 UTF-8 编码，事件之间以双换行符 `\n\n` 作为隔离边界。包含四个可选字段：

```markdown
id: 1a2b3c # 用于断线重连时，客户端自动通过 Last-Event-ID 请求头带回
event: price_update # 自定义事件类型，前端可通过 addEventListener('price_update') 监听
data: {"symbol": "AAPL"} # 核心载荷，多行数据以换行符分隔
retry: 5000 # 指示浏览器在连接断开后，等待 5 秒重连
\n # 强制双换行结束当前事件
```

### 3.2 现代替代方案：Fetch + ReadableStream

原生的 `EventSource` API 存在两个致命缺陷：**只能发 GET 请求**，且**无法自定义请求头（无法传递 Bearer Token）**。在现代 AI 流式输出或安全要求高的业务中，前端通常使用 Fetch API 结合可读流来平替 SSE：

```javascript
// 现代工程中替代 EventSource 的标准范式
async function fetchStream() {
  const response = await fetch('/api/ai/stream', {
    method: 'POST', // 突破 GET 限制，可传复杂大参数
    headers: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: '分析最新财报' }),
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // 需自行解析 SSE 的 data: 边界
    const chunk = decoder.decode(value, { stream: true })
    console.log('Received chunk:', chunk)
  }
}
```

> [!NOTE] 高频场景
> 现在最高频的是 **AI 流式输出**，其次是**行情推送、任务进度、站内通知**。落地常配四件事：用 **fetch + ReadableStream 替代 `EventSource`**（否则既不能 POST、也带不上 `Bearer` Token）；**服务端关掉代理缓冲**（Nginx 的 `proxy_buffering off` 或 `X-Accel-Buffering: no`，否则消息会被攒成一大块一次吐出，流式效果直接消失）；用 **`Last-Event-ID` 做断点续传**；有条件就**上 HTTP/2**，解除同域名 6 连接的上限。

## 4. WebRTC：突破浏览器边界的 P2P 巨兽

WebRTC (Web Real-Time Communication) 不是一个单一协议，而是一整套庞大且复杂的网络与媒体栈规范。其核心价值在于降低核心服务器带宽成本，将流量压力下放至客户端网络。

### 4.1 核心网络拓扑与架构演进

WebRTC 的落地绝非简单的“**无服务器 P2P**”。在真实生产环境中，必须根据业务规模选择路由拓扑：

- **Mesh 架构 (纯 P2P)**：N 个端互连，需要 $N(N-1)/2$ 条连接。仅适用于 3-4 人的小型会议，否则客户端上行带宽和 CPU 会瞬间崩溃。
- **MCU 架构 (Multipoint Control Unit)**：服务端接收所有人的音视频，混合编码成一路流下发。客户端压力最小，但服务端 CPU 计算压力极大（常用于传统硬件视频会议）。
- **SFU 架构 (Selective Forwarding Unit)**：**现代 WebRTC 的绝对主流（如 mediasoup, pion）**。服务端只负责无脑路由转发包，不进行编解码操作。客户端上传 1 路流，接收 N-1 路流。平衡了服务器计算压力与客户端带宽负担。

### 4.2 穿透与信令模型

- **信令 (Signaling)**：WebRTC 规范故意未定义信令通道，开发者必须自行利用 WebSocket 或 SSE 构建信令服务器，用于交换 **SDP (Session Description Protocol，媒体能力协商)** 和 **ICE Candidate (网络候选地址)**。
- **NAT 穿透黑洞**：在企业级对称 NAT 环境下，STUN 服务（获取公网 IP）会失效，必须回退到 TURN 服务（在服务器上中继全部 UDP 流量）。**生产环境中，约 15%-20% 的 WebRTC 流量最终依赖 TURN 中继，这直接决定了服务器成本。**

> [!NOTE] 高频场景
> 舞台基本就四块：**1v1 通话（在线问诊、客服）**、**多人会议与在线课堂**、**屏幕共享 / 远程协助**、**云游戏与云桌面**。除拓扑选择与 TURN 成本外，工程上最容易卡住的是两件常被忽略的事：**权限与安全上下文**（`getUserMedia` 只在 HTTPS 或 `localhost` 下可用，权限弹窗通常还要由用户手势触发）与**房间管理**（谁在房间里、谁能推流、拉流鉴权 —— WebRTC 规范完全不管，得由信令服务自己维护）。

## 5. 常见进阶面试题解析

### 5.1 HTTP/1.1 与 HTTP/2 对 SSE 有何影响？

**决定性影响。** 浏览器对 HTTP/1.1 协议下的同一域名强制实施最大 6 个并发连接的限制。如果用户在浏览器中打开了 6 个标签页且都在使用 SSE，第 7 个标签页的所有 HTTP 请求（包括普通的 API 和静态资源）将被完全阻塞。
**解决方案**：必须将 SSE 服务升级到 HTTP/2。HTTP/2 的多路复用特性允许在一条 TCP 连接上并发处理成百上千个 Stream，彻底解除了 SSE 的浏览器并发数灾难。

### 5.2 为什么 WebRTC 数据通道 (`RTCDataChannel`) 比 WebSocket 传输文件更快？

WebSocket 构建在 TCP 之上，TCP 的拥塞控制和丢包重传机制（Head-of-Line Blocking）在弱网下会导致严重延迟。而 `RTCDataChannel` 构建在 **SCTP over DTLS over UDP** 之上。它允许开发者配置 `maxRetransmits`（最大重传次数）或 `maxPacketLifeTime`（包存活时间），甚至允许**无序传输**。这意味着对于丢帧可容忍的游戏同步数据或实时协作指针，WebRTC 可以在丢包时直接丢弃过期数据，保证最新的坐标数据即时到达。
