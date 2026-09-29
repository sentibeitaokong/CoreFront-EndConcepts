# 从输入 URL 到页面渲染：渲染机制与回流重绘

「在地址栏输入一个 URL 并回车，到页面最终呈现，中间发生了什么？」——这是前端面试的经典压轴题，考察的是对**网络、浏览器进程、渲染机制**的全链路理解。

**一句话理解**：**「这一过程 = 网络层『找到服务器、建立连接、拿到数据』 + 浏览器层『解析 HTML、构建渲染树、绘制合成』两大段旅程。」**

## 1. 全链路总览

```markdown
输入 URL
→ DNS 解析（域名 → IP）
→ 建立 TCP 连接（三次握手）
→ TLS 握手（HTTPS）
→ 发送 HTTP 请求
→ 服务器处理并返回响应
→ 浏览器接收 HTML
→ 解析 HTML → DOM 树 / 解析 CSS → CSSOM 树
→ 合成渲染树 → 布局 → 绘制 → 合成
```

## 2. 网络阶段

### 2.1 DNS 解析：域名 → IP

浏览器把域名（`example.com`）解析成 IP 地址。查找顺序（**有缓存先走缓存**）：

- **浏览器 DNS 缓存**
- **系统 hosts 文件**
- **本地 DNS 服务器缓存**
- **递归查询**：本地 DNS 服务器替客户端逐级向上查询根域名服务器 → 顶级域 → 权威服务器，直到拿到 IP。

> `dns-prefetch` 可在空闲时预解析域名，减少真正请求时的 DNS 等待。详见 [DNS 解析](/networkAndBrowsers/fundamentals/dns)。

### 2.2 建立 TCP 连接（三次握手）

拿到 IP 后，客户端与服务器通过**三次握手**建立可靠连接：

```markdown
客户端 ──SYN──▶ 服务器
客户端 ◀─SYN+ACK─ 服务器
客户端 ──ACK──▶ 服务器 （连接建立）
```

**为什么是三次而不是两次？** 为了防止「已失效的历史连接请求」突然到达服务器导致错误建立连接。三次握手让双方都确认「我方发送、对方接收」双向畅通。详见 [TCP 协议](/networkAndBrowsers/transport/tcp)。

### 2.3 TLS 握手（HTTPS）

HTTPS 在 TCP 之上再走 TLS 握手，协商加密算法、交换证书、生成对称密钥，之后所有数据用对称密钥加密传输。详见 [HTTPS](/networkAndBrowsers/http/https)。

### 2.4 发送 HTTP 请求并接收响应

建立连接后，浏览器发送 HTTP **请求行 + 请求头 + 请求体**；服务器返回**状态行 + 响应头 + 响应体**。状态码、缓存头等见 [HTTP](/networkAndBrowsers/http/http) 与 [HTTP 头](/networkAndBrowsers/http/headers)。

## 3. 浏览器的渲染流程 (Rendering Process)

拿到 HTML 后，浏览器交给渲染进程处理（多进程架构见 [进程与线程](/networkAndBrowsers/process-model/processAndThread)）。浏览器将 HTML、CSS 和 JavaScript 转换为屏幕像素的核心链路如下：

```markdown
HTML/JS -> DOM -> CSSOM -> Render Tree -> Layout -> Paint -> Composite
```

### 3.1 解析 HTML，构建 DOM 树 (DOM Tree)

浏览器接收 HTML 后，会由 HTML 解析器**逐字节解析**，经过词法分析（token）→ 语法分析（节点）→ 逐步生成 DOM Tree。DOM 树描述的是网页的**内容和骨架**，包含所有节点，哪怕是被 `display: none` 隐藏的节点。

```html
<body>
  <h1>Title</h1>
  <p>Hello</p>
</body>
```

会形成类似结构：

```markdown
Document
└── html
└── body
├── h1
└── p
```

DOM 关注的是节点结构，不关心最终样式和视觉位置。

> 解析过程中，遇到 `<script>` 会**阻塞解析**并立即执行（除非 `async`/`defer`，详见 [异步脚本](/html/basic/asyncScript)）。现代浏览器有**预加载扫描器（Preload Scanner）**：解析器被脚本阻塞时，它会继续扫描后续 HTML，提前发现并下载外部资源，缩短加载时间。

### 3.2 解析 CSS，构建 CSSOM 树 (CSSOM Tree)

浏览器将 CSS 样式表解析成 CSSOM Tree，并计算出每个节点的最终样式（Computed Style）。

CSSOM 构建过程中会处理： 选择器匹配，继承规则，层叠优先级，默认样式，计算值转换。

```css
p {
  color: red;
  font-size: 16px;
}
```

CSSOM 构建会阻塞渲染，因为浏览器必须知道最终样式后，才能计算页面布局和绘制。但它**不阻塞 DOM 构建**。

### 3.3 合并，构建渲染树 (Render Tree)

Render Tree 由 DOM 和 CSSOM 合并而来，只包含需要显示在屏幕上的节点，以及这些节点的计算样式。**它和 DOM 树不是一一对应**：DOM 树保留全部节点，渲染树只保留「要显示的」那一份。

[width(37,22,41)]

| 节点                              | 是否进入渲染树    | 原因                                           |
| --------------------------------- | ----------------- | ---------------------------------------------- |
| 普通可见元素（`div`、`p`…）       | ✅ 进入           | 既要显示，也占布局空间                         |
| `::before` / `::after` 伪元素     | ✅ 进入           | 有内容和盒模型，同样是渲染树节点               |
| `<head>` / `<script>` / `<style>` | ❌ 不进入         | 非视觉内容，没有对应的盒                       |
| `display: none` 的元素            | ❌ 不进入         | 完全脱离布局，不占空间（**子元素也一并消失**） |
| `visibility: hidden` 的元素       | ✅ 进入（不可见） | 仍占据布局空间，只是不绘制                     |
| `opacity: 0` 的元素               | ✅ 进入（不可见） | 仍参与布局与合成，只是全透明                   |

> **一句话记法**：**「进不进渲染树看 `display`，可不可见看 `visibility` / `opacity`。」** 前三者是「不在树上」，后两者是「在树上但不画」——这正是`display: none` 触发回流、`visibility: hidden` 只触发重绘的根源。

### 3.4 布局 / 回流 (Layout / Reflow)

有了渲染树（知道了有哪些元素以及它们的样式），浏览器要算出每个节点在屏幕上的**确切几何信息**。这些信息正好对应我们平时读的那些 API：

[width(20,43,37)]

| 算出的几何信息 | 含义                                   | 对应的读取接口                                            |
| -------------- | -------------------------------------- | --------------------------------------------------------- |
| 尺寸           | 内容盒 / 边框盒的宽高                  | `offsetWidth` / `clientWidth` / `getBoundingClientRect()` |
| 位置           | 相对包含块、相对视口的 x / y           | `offsetTop` / `offsetLeft` / `getBoundingClientRect()`    |
| 行盒位置       | 文本如何换行、每一行的高度与位置       | `getClientRects()`（**多行内联元素会返回多个矩形**）      |
| 滚动区域       | 内容的总尺寸，决定是否出现滚动条       | `scrollWidth` / `scrollHeight`                            |
| 溢出情况       | 内容是否超出容器（配合上面的尺寸判断） | `scrollWidth > clientWidth`                               |

这个过程就叫布局，也叫回流或重排。

> **这解释了「读取几何属性为什么贵」**：这些值都必须等布局算完才有答案，所以在改完样式后立刻读，会迫使浏览器立刻结算布局——即**强制同步布局**。

### 3.5 绘制 / 重绘 (Paint / Repaint)

知道了元素的位置和大小后，浏览器会把元素的视觉属性转换成**绘制指令**：

[width(20,80)]

| 绘制内容       | 典型来源属性                                        |
| -------------- | --------------------------------------------------- |
| 文字           | `color`、`font-*`、`text-shadow`、`text-decoration` |
| 背景           | `background-color`、`background-image`、渐变        |
| 边框与圆角     | `border`、`border-radius`、`outline`                |
| 阴影           | `box-shadow`                                        |
| 图片与替换内容 | `<img>` / `<canvas>` / `<video>` 的画面             |
| 裁剪与特效     | `clip-path`、`filter`、`mask`、`mix-blend-mode`     |

Paint 不一定直接把像素画到屏幕上。现代浏览器通常会先生成**绘制记录**（显示列表），再交给合成流程处理——这也是为什么「重绘」之后往往还有「合成」这一步。

**什么时候会重绘**：元素的**外观**变了，但**几何属性没变**（尺寸、位置不动）。一旦几何属性也变了，就会先回流，再重绘。

### 3.6 合成 (Compositing)

现代浏览器为了提高效率，会将页面分成多个图层（Layers）分别绘制，最后再由合成线程把这些图层按照正确的层叠顺序合并到一起，显示在屏幕上。

合成层的优势是：某些变化只需要 Composite，不需要重新 Layout 或 Paint。

```css
.box {
  transform: translateX(100px);
  opacity: 0.8;
}
```

`transform` 和 `opacity` 常被用于高性能动画，因为它们通常可以只走合成阶段。

**高频合成属性与提升手段：**

[width(48,52)]

| 属性 / 手段                                | 说明                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `transform` / `opacity`                    | 唯二**保证只走合成**的两个属性，动画首选                 |
| `will-change: transform`                   | 提前声明要变化，让浏览器**预先**分配图层（最推荐的做法） |
| `transform: translateZ(0)` / `translate3d` | 老式「硬件加速」hack，本质是强制 3D 上下文提升图层       |
| `backface-visibility: hidden`              | 同为老式提升手段，新项目基本不再使用                     |
| `filter` / `backdrop-filter`               | 通常也会提升为合成层，但绘制成本高                       |
| `position: fixed` / `<video>` / `<canvas>` | 常见的天然独立层                                         |

> **代价**：每个合成层都要单独占显存、单独绘制，图层过多会显著增加内存并拖慢合成。所以**别给一堆元素无脑加 `will-change`**——它只该出现在「确实要频繁动画的元素」上，且动画结束后最好移除。

## 4. 什么是回流 (Reflow) 与重绘 (Repaint)？

在网页首次加载完成后，如果我们通过 JavaScript 操作 DOM 或者改变了 CSS 样式，浏览器可能需要重新执行上述的部分渲染步骤。

### 4.1 回流 (Reflow) —— “牵一发而动全身”

- **定义**：当渲染树 (Render Tree) 中的部分或全部元素的**几何属性（尺寸、位置、结构）**发生改变时，浏览器必须**重新计算**这些元素及其受影响的父节点、子节点甚至兄弟节点的几何信息。这个重新计算布局的过程就是回流（也叫重排 Relayout）。
- **代价**：回流是**非常昂贵**的性能操作。因为元素的尺寸和位置变化，往往会导致整个页面的文档流发生错位，浏览器不得不重新计算大半个甚至整个页面的布局。
- **触发回流的操作**：
  - 添加或删除可见的 DOM 元素。
  - 元素的位置发生变化（如 `top`, `left`, `margin`, `padding`）。
  - 元素的尺寸发生变化（如 `width`, `height`, `border`）。
  - 内容发生变化（如文本数量增加导致高度撑开，或者替换了不同尺寸的图片）。
  - 字体加载完成后尺寸变化。
  - 浏览器窗口尺寸改变（resize）。
  - **读取某些特定的布局属性（极其重要）**。

**高频属性速查：改一下会走到哪一步？**

[width(54,15,31)]

| 改动                                                          | 结果      | 原因                                             |
| ------------------------------------------------------------- | --------- | ------------------------------------------------ |
| `width` / `height` / `padding` / `margin` / `border`          | 🛑 回流   | 几何属性变化                                     |
| `top` / `left`（元素在文档流中时）                            | 🛑 回流   | 位移改变，兄弟节点跟着挪                         |
| `display`（`none` ↔ 其他）                                    | 🛑 回流   | 节点进出布局树                                   |
| `font-size` / `font-family`、**字体加载完成**                 | 🛑 回流   | 文字尺寸变了，行盒要重算                         |
| `flex` / `grid` / `position` 相关属性                         | 🛑 回流   | 影响整个容器的排布规则                           |
| `color` / `background-color` / `box-shadow` / `border-radius` | ⚠️ 只重绘 | 外观变化，不动几何                               |
| `visibility`（`hidden` ↔ `visible`）                          | ⚠️ 只重绘 | 仍占位，不重算布局                               |
| `transform` / `opacity`                                       | ✅ 只合成 | 交 GPU 处理，跳过回流重绘                        |
| **CSS 变量**（`--x`）                                         | ❓ 看用途 | 用在 `width` 上就是回流，用在 `color` 上就是重绘 |

> 最后一行是高频误区：CSS 变量本身**不是**合成属性，它的开销取决于最终被哪个属性消费。用变量切换主题色几乎免费，但用变量控制尺寸、间距，照样是完整回流。

### 4.2 重绘 (Repaint) —— “换个马甲”

- **定义**：当元素的**外观、视觉属性**发生改变，但 **完全没有改变它的几何属性（没有改变它在文档流中的位置和大小）** 时，浏览器只需要把这个元素重新画一遍。这个过程就是重绘。
- **代价**：重绘的代价比回流**小得多**，因为它不需要重新计算布局。
- **触发重绘的操作**：
  - 改变 `color`, `background-color`。
  - 改变 `visibility: hidden` (注意：`display: none` 会触发回流，因为元素消失且不再占位；而 `visibility: hidden` 只是不可见，仍占位，所以只触发重绘)。
  - 改变 `box-shadow`, `border-radius`, `outline`。

**核心定律：回流必定会引起重绘，但重绘不一定会引起回流。**

## 5. 渲染成本阶梯与合成层优化

不同属性变化的性能开销呈阶梯状递减。性能优化的核心目标是**尽可能让更新操作降级到开销最小的阶段**。

[width(18,23,38,21)]

| 修改类型             | 触发阶段                   | 典型 CSS 属性                       | 性能评价               |
| -------------------- | -------------------------- | ----------------------------------- | ---------------------- |
| **改变几何物理空间** | Layout + Paint + Composite | `width`, `height`, `top`, `display` | 🛑 最差 (避免频繁触发) |
| **改变表面视觉**     | Paint + Composite          | `color`, `background`, `shadow`     | ⚠️ 一般 (可接受)       |
| **改变独立合成属性** | Composite                  | `transform`, `opacity`              | ✅ 极佳 (GPU 加速)     |

**合成层提升 (Layer Promotion)**：
使用 `will-change: transform` 或 3D 变换（`translateZ(0)`）可强制元素提升为独立合成层，其变化由 GPU 直接处理，彻底跳过回流与重绘。但它**有代价**——图层要单独占显存、单独绘制，滥用会换来内存暴涨和合成变慢。

### 5.1 `contain` 与 `content-visibility`：主动划定隔离边界

前面的优化都在**减少触发的次数**，这一组属性的思路不同：**告诉浏览器这棵子树的渲染是内政，别牵连外面**。

[width(23,46,31)]

| 属性                       | 作用                                         | 高频用法           |
| -------------------------- | -------------------------------------------- | ------------------ |
| `contain: layout`          | 内部布局变化不外溢，外部变化不影响内部       | 卡片、列表项       |
| `contain: paint`           | 出界内容不绘制（子元素被裁剪）               | 轮播、溢出隐藏容器 |
| `contain: size`            | 声明尺寸**不受内容影响**（必须自己给死尺寸） | 虚拟列表的占位行   |
| `contain: strict`          | 等于 `size layout paint style`               | 尺寸已知的大区块   |
| `content-visibility: auto` | **视口外跳过整棵子树**的布局与绘制           | 长文档、超长列表   |

```css
/* 长文档：视口外的章节直接不渲染，但滚动高度仍然正确 */
.chapter {
  content-visibility: auto;
  contain-intrinsic-size: auto 800px; /* 占位高度，避免滚动条乱跳、跳转错位 */
}

/* 卡片：内部变化惊动不了外部，回流的爆炸半径被限死在卡片内 */
.card {
  contain: layout paint;
}
```

> **两个高频坑：**
>
> - `contain: layout/paint/strict` 会让元素成为**包含块**（类似 `position: relative`），原本相对视口定位的 `position: absolute` 子元素会被它「抓」住，定位结果和之前不一样。
> - `content-visibility: auto` 的元素在**视口外时不参与渲染**，因此「用 JS 测量还没滚动到的元素尺寸」会拿到 `0`；依赖精确高度的逻辑（如拖拽排序、锚点跳转）必须配 `contain-intrinsic-size`，或先滚动到可视区再测。

## 6. 浏览器的“批量优化”与“强制同步布局”

### 6.1 渲染队列机制

浏览器为了避免频繁的回流，内置了**渲染队列**。**连续的多次 JS 样式修改**会被推入队列，浏览器**不会**立刻执行 3 次回流。

```js
div.style.width = '100px'
div.style.height = '100px'
div.style.marginTop = '10px'
```

它会把这些修改操作放入一个队列中。当队列达到一定数量，或者过了一小段时间（通常是下一帧，约 16.6ms）后，浏览器会清空队列，**将这多次修改合并成一次回流和重绘**。

### 6.2 强制同步布局 (Layout Thrashing) —— 性能杀手

如果你在修改样式后，**立刻通过 JS 读取几何属性**，浏览器为了返回最新的准确值，必须**强行清空队列并立即执行一次同步回流**，彻底打破批量优化机制。

- **致命读取操作**：`offsetWidth / Height`、`scrollTop`、`getBoundingClientRect()`、`getComputedStyle()`。
- **解决方案**：读写分离。在循环外缓存读取值，避免在循环体内交错执行 DOM 读写操作。

## 7. 关键渲染路径与性能优化实战

### 7.1 关键渲染路径 (Critical Rendering Path)

「从 HTML 到首屏渲染」的最短依赖链称为**关键渲染路径**：

```markdown
HTML → DOM
CSS → CSSOM
DOM + CSSOM → 渲染树 → 布局 → 绘制 → 合成 → 首屏
```

**优化核心**：缩短这条链上每一步的耗时——

- **减少关键资源数量**：`defer` 非关键脚本、内联首屏关键 CSS。
- **减少关键字节**：压缩、Tree-Shaking、按需加载。
- **缩短依赖链长度**：避免 CSS 依赖 CSS（`@import` 串行加载），优先并行加载。

### 7.2 各阶段可优化的点

[width(14,52,34)]

| 阶段     | 优化手段                                       | 对应 Hint                   |
| -------- | ---------------------------------------------- | --------------------------- |
| DNS      | `dns-prefetch` 预解析                          | `<link rel="dns-prefetch">` |
| TCP/TLS  | `preconnect` 预连接，减少往返                  | `<link rel="preconnect">`   |
| HTTP     | HTTP/2 多路复用、开启缓存、压缩、CDN           | 服务器/构建配置             |
| 资源加载 | `preload` 关键资源、`defer/async` 脚本、懒加载 | `<link rel="preload">`      |
| 解析渲染 | 减少重排重绘、用 `transform`/`opacity` 动画    | 代码层优化                  |

### 7.3 JavaScript 层面

- **离线操作 DOM**：对于大批量修改，先 `display: none`（1次回流），内存中修改完后再显示（1次回流）。
- **使用 DocumentFragment**：在内存中拼装完整的 DOM 片段，最后一次性 `appendChild`。
- **控制动画时机**：使用 `requestAnimationFrame` (rAF) 统领视觉更新，确保 JS 执行与浏览器的帧刷新频率同步。

```js
let rafId = null
function animate(timestamp) {
  // timestamp 是一个高精度时间戳，表示回调触发的精确时间
  const progress = timestamp / 1000
  document.getElementById('box').style.transform =
    `translateX(${progress * 100}px)`
  // 核心：在函数底部重新调度下一帧
  rafId = requestAnimationFrame(animate)
}
// 启动动画
rafId = requestAnimationFrame(animate)

// 停止动画（必须配合 cancelAnimationFrame）
// cancelAnimationFrame(rafId);
```

### 7.4 CSS 层面

- **合并样式修改**：优先通过切换 `class` 类名统一修改样式，而非频繁操作 `element.style`。
- **动画脱离文档流**：对复杂动画元素使用 `position: absolute / fixed`。
- **CSS 容器隔离**：使用最新的 `contain: strict / layout` 属性，明确告诉浏览器该区域的变化不会影响外部，限制回流的爆炸半径。

### 7.5 资源加载与阻塞

- HTML 遇 `<script>` 即挂起，非首屏关键 JS 务必加 `defer` 或 `async`。
- 内联首屏关键 CSS，因为 CSSOM 不就绪，Render Tree 就无法构建，页面白屏。

### 7.6 DevTools 性能排查

- **Performance**：核心面板，观察火焰图中的紫条 (Layout) 和绿条 (Paint)。
- **Layers**：排查独立图层是否过多导致内存溢出（切忌滥用 `will-change`）。
- **Rendering 面板**：开启 `Paint flashing`，肉眼观察页面中哪些区域发生了不必要的闪烁重绘。

### 7.7 高频场景：从症状找到手段

[width(31,27,42)]

| 症状                                | 常见原因                                   | 手段                                                                                   |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| 长列表滚动掉帧                      | 每帧渲染全部行，且循环里反复读 `offsetTop` | 虚拟列表 + `contain: layout paint` + 读写分离                                          |
| 动画明显卡顿                        | 用 `left` / `top` / `width` 做位移与缩放   | 换成 `transform` / `opacity`，必要时加 `will-change`                                   |
| 页面加载中「跳一下」(CLS)           | 图片、广告位、异步组件没预留高度           | 图片给 `width`/`height` 或 `aspect-ratio`，占位骨架屏                                  |
| 文字先显示再整体重排 (FOUT)         | 自定义字体加载完成触发行盒重算             | `font-display: swap` + `size-adjust` 对齐回退字体度量                                  |
| 输入、拖拽时掉帧                    | 回调里「读尺寸 → 改尺寸 → 再读」交错       | 先批量读、再批量写；或整段更新推入 `requestAnimationFrame`                             |
| 切换主题整页闪烁                    | 逐个元素改颜色，或改到了几何类属性         | 只改根节点的 CSS 变量，且确保变量只被颜色类属性消费                                    |
| 拖拽面板 / 侧边栏抖动               | 拖动过程中每帧同步改尺寸                   | `rAF` 节流 + 给容器 `contain: strict`                                                  |
| 控制台刷 `ResizeObserver loop` 警告 | 回调内同步改了被观察元素的尺寸             | 见 [ResizeObserver](/networkAndBrowsers/browser/observerApi/resizeObserver) 的常见问题 |

> 排查顺序永远是：**先用 Performance 面板确认瓶颈在哪个阶段（紫条 Layout / 绿条 Paint），再挑手段**。不看火焰图就上来加 `will-change`、加 `contain`，多半是把问题挪个地方，甚至换来图层爆炸。

## 8. 用性能指标量化这段旅程

浏览器通过 `PerformanceTiming` / `PerformanceNavigationTiming` 暴露了各阶段时间戳，可量化每一跳：

[width(24,45,31)]

| 指标               | 含义                                    | 对应阶段       |
| ------------------ | --------------------------------------- | -------------- |
| `DNS 查询`         | `domainLookupEnd - domainLookupStart`   | DNS 解析       |
| `TCP 连接`         | `connectEnd - connectStart`             | 三次握手       |
| `TLS 握手`         | `secureConnectionStart` 到 `connectEnd` | HTTPS 加密协商 |
| `TTFB`             | `responseStart - requestStart`          | 服务器首字节   |
| `DOMContentLoaded` | `domContentLoadedEventEnd`              | DOM 就绪       |
| `Load`             | `loadEventEnd`                          | 资源加载完成   |

```javascript
const [entry] = performance.getEntriesByType('navigation')
console.log('DNS 耗时', entry.domainLookupEnd - entry.domainLookupStart)
console.log('TCP 耗时', entry.connectEnd - entry.connectStart)
console.log('TTFB   ', entry.responseStart - entry.requestStart)
```

用户感知的性能指标（FP/FCP/LCP 等）见 [Performance API](/networkAndBrowsers/browser/observerApi/performanceApi)。

## 9. 完整流程图

![Logo](/img/render.png)

## 10. 总结

- 网络段：DNS → TCP → TLS → HTTP，每一跳都有对应优化手段与 Hint。
- 渲染段：DOM 树 + CSSOM 树 → 渲染树 → 布局 → 绘制 → 合成。
- 记住两条铁律：**CSS 阻塞渲染、JS 阻塞解析**；**transform/opacity 只走合成，性能最优**。
- 回流必触发重绘，重绘不一定回流；用 `will-change`、`transform` 做动画可跳过回流重绘。
- 用 `contain` / `content-visibility` 把渲染关进「隔离区」，用读写分离避开强制同步布局。
- 用 Navigation Timing 量化每一跳，用关键渲染路径思路优化首屏。

## 11. 常见问题 (FAQ)

### 11.1 为什么说「CSS 阻塞渲染」而「JS 阻塞解析」？

CSSOM 是渲染树的前置条件，CSS 未就绪就无法渲染，所以**阻塞渲染**（不阻塞 DOM 构建）；而 JS 可能修改 DOM/CSSOM，浏览器必须停下 HTML 解析去执行脚本，所以**阻塞解析**（可用 `defer`/`async` 缓解）。

### 11.2 为什么“读取”某些属性会导致浏览器强制回流（性能杀手）？

浏览器有队列优化机制。但如果你在修改样式的同时，**立刻去读取了元素的几何属性**：

```js
div.style.width = '100px' // 放入队列
console.log(div.offsetWidth) // 致命操作！
div.style.height = '100px'
```

当执行到第二行 `div.offsetWidth` 时，浏览器为了给你返回最**精确、最新**的宽度值，它**不得不立刻清空渲染队列，强行触发一次同步回流（Forced Synchronous Layout）**，然后再把值给你。这直接打破了浏览器的优化机制。

**会触发强制同步回流的常见属性/方法**：

- `offsetTop`, `offsetLeft`, `offsetWidth`, `offsetHeight`
- `scrollTop`, `scrollLeft`, `scrollWidth`, `scrollHeight`
- `clientTop`, `clientLeft`, `clientWidth`, `clientHeight`
- `getComputedStyle()`
- `getBoundingClientRect()`

**优化建议**：如果要在循环中读取这些值，**一定要把它们缓存到局部变量中**，不要在循环体内反复读取和写入。

### 11.3 重排（reflow）和重绘（repaint）有什么区别？

- **重排**：布局几何属性变化（宽高、位置、字体），需重新计算布局，开销大。
- **重绘**：仅外观变化（颜色、背景），无需重算布局，开销较小。
- **重排必然触发重绘，重绘不一定触发重排**。详见 [CSS 性能](/performanceOptimization/cssPerformance)。

一个典型例子就能看出这条分界线：**`display: none` 完全脱离布局、不占空间，所以不进渲染树，改它会重排；而 `visibility: hidden` 仍占据位置、只是不可见，所以留在渲染树里，改它只重绘**。`opacity: 0` 同理——仍然参与布局与合成，只重绘不重排。

### 11.4 为什么 `transform` 动画比 `left` 动画流畅？`will-change` 该怎么用？

`left/top` 会触发**重排**（重新计算布局）→ 重绘 → 合成,全程跑在主线程；`transform` 是**合成属性**，只触发合成，且由**合成线程**独立处理，即便主线程繁忙也不掉帧。这就是能用 `transform` 就别用 `left`的原因。

想进一步让浏览器**提前**把元素提升为独立合成层，可以加 `will-change: transform`。但它不是免费开关：加多了会吃掉显存、让合成阶段要合并更多层，某些属性被提升后还会**触发一次额外的重绘**。正确用法是只给确实要频繁动画的元素加、动画结束后就移除，属性写具体名而不是一大串；多数情况下「换成 `transform` / `opacity`」本身就已经够了。

### 11.5 输入 URL 后，为什么浏览器要先看缓存？

命中**强缓存**时，浏览器可直接从本地磁盘/内存取资源，**跳过整个网络阶段**（DNS → TCP → TLS → HTTP），是最快的加载路径。缓存机制见 [浏览器缓存](/networkAndBrowsers/caching/browserCache)。

### 11.6 如何排查渲染性能问题？

DevTools 中常看的指标：

- **Performance 面板**：查看 Scripting、Rendering、Painting 的耗时。
- **Layout Shift**：查看布局偏移。
- **Layers 面板**：查看图层数量是否异常。
- **Rendering 面板**：开启 Paint flashing 观察重绘区域。

常见症状对应的方向：

- **Layout 频繁出现**：检查 DOM 读写交错和几何属性动画。
- **Paint 面积过大**：检查阴影、滤镜、复杂背景。
- **Layers 过多**：检查滥用 `will-change`、3D transform。

如果 **Layout 条很少、滚动却依然卡**，说明瓶颈不在布局，换方向看：

- **看 Scripting（黄色）**：主线程被长任务占满，滚动的合成工作抢不到时间片。定位长任务，考虑分片、`requestIdleCallback`、Web Worker。
- **看 Painting（绿色）**：绘制区域过大或过复杂（大阴影、模糊、滤镜），优化路径是缩小重绘面积、把动画元素提升为合成层。
- **看 Compositing / Layers**：图层过多导致合成开销高，检查 `will-change` 是否滥用。
- **找碎片化的 Layout**：`offsetTop` / `getBoundingClientRect()` 在循环里反复读，会切出一堆锯齿状的小 Layout，即使总时长不长也很伤帧率。

一句话：**卡顿不等于回流**，先用火焰图确认是谁在占主线程，再谈优化手段。

### 11.7 图片不写宽高就一定会造成布局抖动吗？

会——只要图片的**加载完成尺寸与占位尺寸不一致**，就会在加载完成的瞬间把下方内容整体推一下，这正是 CLS（累计布局偏移）的主要来源。三种修法按推荐度排序：

- **给容器定 `aspect-ratio`**：最省事，图片自适应不变形，加载前后高度一致。
- **写 `width` + `height` 属性**：现代浏览器会自动换算成 `aspect-ratio`，同时保留响应式。
- **给 `min-height` 骨架位**：适用于尺寸确实未知的场景，先占住高度再回填。

广告位、异步插入的列表、动态字体同理：**凡是「先空着、后出现」的内容，都要预留尺寸**。
