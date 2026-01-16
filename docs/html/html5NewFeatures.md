# HTML5新特性
HTML5 为 Web 开发带来了革命性的变革，使得网页更加语义化、交互性更强，功能也更加强大。

## 语义化元素 (Semantic Elements)

**特性概述:** 引入了新的语义化标签，用于更好地描述页面结构，使内容更具含义，利于搜索引擎优化（SEO）和可访问性（Accessibility）。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 语义化布局示例</title>
</head>
<body>
    <!-- 页眉部分，通常包含网站Logo、标题、导航等 -->
    <header>
        <h1>我的个人博客</h1>
        <nav>
            <ul>
                <li><a href="/">首页</a></li>
                <li><a href="/articles">文章</a></li>
                <li><a href="/about">关于</a></li>
            </ul>
        </nav>
    </header>

    <!-- 页面主要内容区域 -->
    <main>
        <!-- 一个独立的文章内容 -->
        <article>
            <h2>HTML5 新特性解读</h2>
            <p>作者：张三，发布日期：2023-10-26</p>
            <section>
                <h3>Canvas API</h3>
                <p>Canvas 元素允许通过 JavaScript 绘制图形...</p>
            </section>
            <section>
                <h3>语义化标签的好处</h3>
                <p>这些标签让网页结构更清晰...</p>
            </section>
        </article>

        <!-- 侧边栏内容，与主要内容相关但可独立存在 -->
        <aside>
            <h3>相关链接</h3>
            <ul>
                <li><a href="#">WebSockets 介绍</a></li>
                <li><a href="#">Web Storage 用法</a></li>
            </ul>
        </aside>
    </main>

    <!-- 页脚部分，通常包含版权信息、联系方式等 -->
    <footer>
        <p>&copy; 2023 我的博客. All rights reserved.</p>
    </footer>
</body>
</html>
```

## 多媒体元素 (Multimedia Elements)
**特性概述:** 允许直接在 HTML 中嵌入音频和视频，无需第三方插件（如 Flash）。

**属性:** `controls` (显示播放控件), `autoplay` (自动播放), `loop` (循环播放), `muted` (静音), `poster` (视频封面图)。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 多媒体示例</title>
</head>
<body>
    <h2>视频播放</h2>
    <video width="640" height="360" controls autoplay muted poster="poster.jpg">
        <!-- 提供多种视频格式以提高兼容性 -->
        <source src="video.mp4" type="video/mp4">
        <source src="video.webm" type="video/webm">
        <p>您的浏览器不支持 HTML5 视频。</p>
    </video>

    <h2>音频播放</h2>
    <audio controls loop>
        <source src="audio.mp3" type="audio/mpeg">
        <source src="audio.ogg" type="audio/ogg">
        <p>您的浏览器不支持 HTML5 音频。</p>
    </audio>
</body>
</html>

```

## 增强的表单特性 (Enhanced Form Features)
**特性概述:** 引入了新的输入类型和属性，改善了用户体验，并提供了客户端数据验证。

**新属性:** `placeholder`, `required`, `autofocus`, `pattern`, `min`, `max`, `step`, `formnovalidate(对form表单数据不验证)`。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 表单增强示例</title>
</head>
<body>
    <form action="/submit" method="post">
        <label for="email">邮箱:</label>
        <input type="email" id="email" name="email" required placeholder="请输入邮箱地址" autofocus><br><br>

        <label for="url">个人网站:</label>
        <input type="url" id="url" name="url" placeholder="请输入您的网址"><br><br>

        <label for="tel">电话:</label>
        <input type="tel" id="tel" name="tel" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" placeholder="格式: 123-456-7890"><br><br>

        <label for="num">数量 (1-10):</label>
        <input type="number" id="num" name="num" min="1" max="10" value="1"><br><br>

        <label for="date">选择日期:</label>
        <input type="date" id="date" name="date"><br><br>

        <label for="color">选择颜色:</label>
        <input type="color" id="color" name="color"><br><br>
        
        <input type="submit" value="提交表单">
        <!-- 不进行验证的提交按钮 -->
        <input type="submit" value="跳过验证提交" formnovalidate>
    </form>
</body>
</html>

```
## Canvas 和 SVG (Canvas and SVG)
**特性概述:**

- `<canvas>`: 提供一个基于 JavaScript 的 API，用于在网页上绘制位图图形。非常适合游戏、图表和复杂动画。
- `SVG`: 允许直接在 HTML 中嵌入可伸缩的矢量图形，不失真地缩放。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 Canvas 和 SVG 示例</title>
    <style>
        canvas { border: 1px solid black; }
    </style>
</head>
<body>
    <h2>Canvas 绘图</h2>
    <canvas id="myCanvas" width="200" height="100"></canvas>
    <script>
        const canvas = document.getElementById('myCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 10, 150, 75); // 绘制一个蓝色矩形
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Hello Canvas', 20, 50); // 绘制文本
    </script>

    <h2>SVG 图形</h2>
    <svg width="200" height="100">
        <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
        <rect x="110" y="10" width="80" height="80" stroke="purple" stroke-width="3" fill="orange" />
    </svg>
</body>
</html>
```



## 地理定位 API (Geolocation API)
**特性概述:** 允许网页应用在用户授权后获取用户设备的地理位置信息。

**新 API:** `navigator.geolocation` 对象。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 地理定位示例</title>
</head>
<body>
    <h2>您的当前位置</h2>
    <p id="location-display">正在获取位置信息...</p>
    <script>
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    document.getElementById('location-display').textContent = `纬度: ${lat}, 经度: ${lon}`;
                },
                (error) => {
                    let errorMessage;
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "用户拒绝了位置共享请求。";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "位置信息不可用。";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "获取位置信息超时。";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = "未知错误。";
                            break;
                    }
                    document.getElementById('location-display').textContent = `错误: ${errorMessage}`;
                }
            );
        } else {
            document.getElementById('location-display').textContent = "您的浏览器不支持地理定位。";
        }
    </script>
</body>
</html>
```


## Web 存储 (Web Storage)
**特性概述:** 提供比 Cookies 更大的客户端数据存储空间，且数据不会随每次 HTTP 请求发送到服务器。分为 localStorage (持久存储) 和 sessionStorage (会话存储)。
**新 API:** `localStorage`, `sessionStorage` 对象。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 Web 存储示例</title>
</head>
<body>
    <h2>Web Storage</h2>
    <input type="text" id="username" placeholder="请输入您的名字">
    <button onclick="saveName()">保存名字 (localStorage)</button>
    <button onclick="loadName()">加载名字 (localStorage)</button>
    <p id="display-name"></p>

    <script>
        function saveName() {
            const username = document.getElementById('username').value;
            localStorage.setItem('user_name', username);
            sessionStorage.setItem('session_data', 'This is session data.');
            alert('名字已保存到 localStorage！');
        }

        function loadName() {
            const storedName = localStorage.getItem('user_name');
            document.getElementById('display-name').textContent = storedName ? `您好，${storedName}！` : '未找到保存的名字。';
            console.log('Session Data:', sessionStorage.getItem('session_data'));
        }

        // 页面加载时尝试加载
        window.onload = loadName;
    </script>
</body>
</html>
```

## Web Workers (Web Worker)
**特性概述:** 允许 JavaScript 脚本在后台独立于主线程运行，避免长时间运行的脚本阻塞 UI，提高页面响应性。

**新 API:** `Worker` 构造函数。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 Web Worker 示例</title>
</head>
<body>
    <h2>Web Worker (计算复杂任务)</h2>
    <button onclick="startWorker()">开始计算 (Worker)</button>
    <button onclick="alert('UI 线程依然响应!')">点击我 (验证 UI 响应)</button>
    <p>计算结果: <span id="result"></span></p>

    <script>
        let worker;
        function startWorker() {
            if (typeof Worker !== "undefined") {
                if (worker) {
                    worker.terminate(); // 终止旧的 worker
                }
                worker = new Worker('worker.js'); // 创建一个新的 Web Worker

                worker.onmessage = function(event) {
                    document.getElementById('result').textContent = event.data;
                };

                worker.onerror = function(error) {
                    console.error('Worker error:', error);
                };

                worker.postMessage(10000000000); // 发送一个大数字给 worker 计算
            } else {
                document.getElementById('result').textContent = "您的浏览器不支持 Web Workers。";
            }
        }
    </script>
</body>
</html>
```
:::code-group
```js[worker.js]
onmessage = function(event) {
    let sum = 0;
    for (let i = 0; i < event.data; i++) {
        sum += i;
    }
    postMessage(sum); // 将结果发送回主线程
};

```
:::


## WebSockets (WebSockets)
**特性概述:** 提供在单个 TCP 连接上进行全双工（双向）通信的通道，实现客户端和服务器之间的实时通信，非常适合聊天应用、实时数据仪表盘。

**新 API:** `WebSocket` 构造函数。
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
            ws = new WebSocket('wss://echo.websocket.org'); // 使用公共测试服务器

            ws.onopen = function() {
                messagesDiv.innerHTML += '<p><strong>连接已建立。</strong></p>';
            };

            ws.onmessage = function(event) {
                messagesDiv.innerHTML += `<p><strong>接收:</strong> ${event.data}</p>`;
                messagesDiv.scrollTop = messagesDiv.scrollHeight; // 滚动到底部
            };

            ws.onclose = function() {
                messagesDiv.innerHTML += '<p><strong>连接已关闭。</strong></p>';
            };

            ws.onerror = function(error) {
                messagesDiv.innerHTML += `<p style="color: red;"><strong>错误:</strong> ${error.message}</p>`;
            };
        }

        function sendMessage() {
            const message = messageInput.value;
            if (message && ws && ws.readyState === WebSocket.OPEN) {
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


## History API (历史记录 API)
**特性概述:** 允许网页应用在不进行页面刷新的情况下操作浏览器历史记录，这对于单页应用（SPA）创建干净 URL 和管理导航状态至关重要。

**新 API:** `history.pushState()`, `history.replaceState()`, `window.onpopstate` 事件。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 History API 示例</title>
    <style>
        #content { border: 1px solid #ccc; padding: 20px; min-height: 100px; }
    </style>
</head>
<body>
    <h2>History API</h2>
    <button onclick="changePage('page1', 'Page One Title', '/page1')">加载 Page 1</button>
    <button onclick="changePage('page2', 'Page Two Title', '/page2')">加载 Page 2</button>
    <div id="content"></div>

    <script>
        function loadContent(pageName) {
            document.getElementById('content').textContent = `这是 ${pageName} 的内容。`;
        }

        function changePage(pageName, title, url) {
            loadContent(pageName);
            // ⭐ 使用 pushState 修改 URL 和浏览器历史记录，但不重新加载页面
            history.pushState({ page: pageName }, title, url);
            document.title = title; // 改变页面标题
        }

        // 监听浏览器历史记录变化（例如点击前进/后退按钮）
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.page) {
                loadContent(event.state.page);
                document.title = event.state.title || 'HTML5 History API 示例';
            } else {
                // 处理初始加载或没有 state 的情况
                loadContent('主页');
                document.title = 'HTML5 History API 示例';
            }
        });

        // 初始加载页面内容
        loadContent('主页');
        history.replaceState({ page: '主页' }, 'HTML5 History API 示例', '/'); // 设置初始状态
    </script>
</body>
</html>
```


## Drag and Drop API (拖放 API)
**特性概述:** 提供了原生的拖放功能支持，允许用户通过拖拽来移动元素或上传文件。

**新属性:** `draggable="true"`。

**新 API:** `dragstart`, `dragover`, `dragleave`, `drop` 等事件，`DataTransfer` 对象。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 Drag and Drop 示例</title>
    <style>
        #draggable {
            width: 100px; height: 100px; background-color: #f00; color: white;
            text-align: center; line-height: 100px; cursor: grab; margin-bottom: 20px;
        }
        #dropzone {
            width: 200px; height: 150px; border: 2px dashed #00f;
            text-align: center; line-height: 150px; background-color: #e0e0ff;
        }
    </style>
</head>
<body>
    <h2>拖放示例</h2>
    <div id="draggable" draggable="true">拖我!</div>
    <div id="dropzone">放到这里</div>

    <script>
        const draggable = document.getElementById('draggable');
        const dropzone = document.getElementById('dropzone');

        // 1. 设置可拖动元素
        draggable.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', event.target.id); // 存储数据
            event.dataTransfer.effectAllowed = 'move'; // 允许的拖放效果
            console.log('拖动开始');
        });

        // 2. 设置放置区
        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault(); // 阻止默认行为（允许放置）
            event.dataTransfer.dropEffect = 'move'; // 放置时显示移动图标
            dropzone.style.backgroundColor = '#c0c0ff'; // 放置区高亮
            console.log('拖动经过');
        });

        dropzone.addEventListener('dragleave', (event) => {
            dropzone.style.backgroundColor = '#e0e0ff'; // 恢复背景色
            console.log('拖动离开');
        });

        dropzone.addEventListener('drop', (event) => {
            event.preventDefault(); // 阻止默认行为（例如文件打开）
            const data = event.dataTransfer.getData('text/plain'); // 获取数据
            const draggedElement = document.getElementById(data);
            if (draggedElement) {
                dropzone.appendChild(draggedElement); // 将元素添加到放置区
            }
            dropzone.style.backgroundColor = '#e0e0ff'; // 恢复背景色
            console.log('放置完成');
        });
    </script>
</body>
</html>
```


## 自定义数据属性 (data-* attributes)
**特性概述:** 允许开发者在 HTML 标签上嵌入自定义的、语义化数据，这些数据可以通过 JavaScript 轻松访问，而不会影响页面的布局或样式。

**新属性:** 任何以 `data-` 开头，后跟自定义名称的属性。

**JavaScript 访问:** 通过元素的 `dataset` 属性访问（例如 element.dataset.productId）。
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>HTML5 data-* 属性示例</title>
</head>
<body>
    <h2>自定义数据属性</h2>
    <div id="product-card" data-product-id="12345" data-category="electronics" data-price="99.99">
        <h3>智能手表</h3>
        <p>型号: Watch-Pro-X</p>
    </div>
    <button onclick="getProductInfo()">获取产品信息</button>
    <p id="product-info"></p>

    <script>
        function getProductInfo() {
            const productCard = document.getElementById('product-card');
            const productId = productCard.dataset.productId;     // 注意这里是 camelCase
            const category = productCard.dataset.category;
            const price = productCard.dataset.price;

            document.getElementById('product-info').textContent =
                `产品ID: ${productId}, 分类: ${category}, 价格: $${price}`;
        }
    </script>
</body>
</html>
```

