# 浏览器渲染机制：重绘与回流及性能观测

## 1. 浏览器的渲染流程 (Rendering Process)

浏览器将 HTML、CSS 和 JavaScript 转换为屏幕像素的核心链路如下：

```txt
HTML/JS -> DOM -> CSSOM -> Render Tree -> Layout -> Paint -> Composite
```

### 1.1 解析 HTML，构建 DOM 树 (DOM Tree)

浏览器接收 HTML 后，会由 HTML 解析器逐步生成 DOM Tree。DOM 树描述的是网页的**内容和骨架**，包含所有节点，哪怕是被 `display: none` 隐藏的节点。

```html
<body>
  <h1>Title</h1>
  <p>Hello</p>
</body>
```

会形成类似结构：

```txt
Document
└── html
    └── body
        ├── h1
        └── p
```

DOM 关注的是节点结构，不关心最终样式和视觉位置。

### 1.2 解析 CSS，构建 CSSOM 树 (CSSOM Tree)

浏览器将 CSS 样式表解析成 CSSOM Tree，并计算出每个节点的最终样式（Computed Style）。

CSSOM 构建过程中会处理： 选择器匹配，继承规则，层叠优先级，默认样式，计算值转换。

```css
p {
  color: red;
  font-size: 16px;
}
```

CSSOM 构建会阻塞渲染，因为浏览器必须知道最终样式后，才能计算页面布局和绘制。

### 1.3 合并，构建渲染树 (Render Tree)

Render Tree 由 DOM 和 CSSOM 合并而来，只包含需要显示在屏幕上的节点，以及这些节点的计算样式。

不会进入 Render Tree 的节点：

- `<head>`、`<script>`、`<style>`。
- `display: none` 的元素。

会进入 Render Tree 但不可见的节点：

- `visibility: hidden` 的元素，因为它仍然占据布局空间。
- `opacity: 0` 的元素，因为它仍然参与布局和合成。

Render Tree 关注的是：哪些节点要显示，以及它们的最终样式是什么。

### 1.4 布局 / 回流 (Layout / Reflow)

有了渲染树（知道了有哪些元素以及它们的样式），浏览器需要计算出每个节点在屏幕上的**确切几何信息**：

- 宽高。
- 坐标。
- 行盒位置。
- 滚动区域。
- 相对父容器和视口的位置。

这个过程就叫布局，也叫回流或重排。

### 1.5 绘制 / 重绘 (Paint / Repaint)

知道了元素的位置和大小后，浏览器会把元素的视觉属性转换成绘制指令，例如：

- 文字。
- 背景。
- 边框。
- 阴影。
- 图片。
- 裁剪区域。

Paint 不一定直接把像素画到屏幕上。现代浏览器通常会先生成绘制记录，再交给合成流程处理。

### 1.6 合成 (Compositing)

现代浏览器为了提高效率，会将页面分成多个图层（Layers）分别绘制，最后再由合成线程把这些图层按照正确的层叠顺序合并到一起，显示在屏幕上。

容易产生独立合成层的情况：

- `transform: translateZ(0)` 或 3D transform。
- `will-change: transform`。
- `position: fixed`。
- `<video>`、`<canvas>`。
- CSS 动画中的 `transform`、`opacity`。

合成层的优势是：某些变化只需要 Composite，不需要重新 Layout 或 Paint。

```css
.box {
  transform: translateX(100px);
  opacity: 0.8;
}
```

`transform` 和 `opacity` 常被用于高性能动画，因为它们通常可以只走合成阶段。

## 2. 什么是回流 (Reflow) 与重绘 (Repaint)？

在网页首次加载完成后，如果我们通过 JavaScript 操作 DOM 或者改变了 CSS 样式，浏览器可能需要重新执行上述的部分渲染步骤。

### 2.1 回流 (Reflow) —— “牵一发而动全身”

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

### 2.2 重绘 (Repaint) —— “换个马甲”

- **定义**：当元素的**外观、视觉属性**发生改变，但 **完全没有改变它的几何属性（没有改变它在文档流中的位置和大小）** 时，浏览器只需要把这个元素重新画一遍。这个过程就是重绘。
- **代价**：重绘的代价比回流**小得多**，因为它不需要重新计算布局。
- **触发重绘的操作**：
  - 改变 `color`, `background-color`。
  - 改变 `visibility: hidden` (注意：`display: none` 会触发回流，因为元素消失且不再占位；而 `visibility: hidden` 只是不可见，仍占位，所以只触发重绘)。
  - 改变 `box-shadow`, `border-radius`, `outline`。

**核心定律：回流必定会引起重绘，但重绘不一定会引起回流。**

## 3. 渲染成本阶梯与合成层优化

不同属性变化的性能开销呈阶梯状递减。性能优化的核心目标是**尽可能让更新操作降级到开销最小的阶段**。

| 修改类型             | 触发阶段                   | 典型 CSS 属性                       | 性能评价               |
| -------------------- | -------------------------- | ----------------------------------- | ---------------------- |
| **改变几何物理空间** | Layout + Paint + Composite | `width`, `height`, `top`, `display` | 🛑 最差 (避免频繁触发) |
| **改变表面视觉**     | Paint + Composite          | `color`, `background`, `shadow`     | ⚠️ 一般 (可接受)       |
| **改变独立合成属性** | Composite                  | `transform`, `opacity`              | ✅ 极佳 (GPU 加速)     |

**合成层提升 (Layer Promotion)**：
使用 `will-change: transform` 或 3D 变换（`translateZ(0)`）可强制元素提升为独立合成层，其变化由 GPU 直接处理，彻底跳过回流与重绘。

## 4. 浏览器的“批量优化”与“强制同步布局”

### 4.1 渲染队列机制

浏览器为了避免频繁的回流，内置了**渲染队列**。**连续的多次 JS 样式修改**会被推入队列，浏览器**不会**立刻执行 3 次回流。

```js
div.style.width = '100px'
div.style.height = '100px'
div.style.marginTop = '10px'
```

它会把这些修改操作放入一个队列中。当队列达到一定数量，或者过了一小段时间（通常是下一帧，约 16.6ms）后，浏览器会清空队列，**将这多次修改合并成一次回流和重绘**。

### 4.2 强制同步布局 (Layout Thrashing) —— 性能杀手

如果你在修改样式后，**立刻通过 JS 读取几何属性**，浏览器为了返回最新的准确值，必须**强行清空队列并立即执行一次同步回流**，彻底打破批量优化机制。

- **致命读取操作**：`offsetWidth / Height`、`scrollTop`、`getBoundingClientRect()`、`getComputedStyle()`。
- **解决方案**：读写分离。在循环外缓存读取值，避免在循环体内交错执行 DOM 读写操作。

## 5. 性能优化实战清单

### 5.1 JavaScript 层面

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

### 5.2 CSS 层面

- **合并样式修改**：优先通过切换 `class` 类名统一修改样式，而非频繁操作 `element.style`。
- **动画脱离文档流**：对复杂动画元素使用 `position: absolute / fixed`。
- **CSS 容器隔离**：使用最新的 `contain: strict / layout` 属性，明确告诉浏览器该区域的变化不会影响外部，限制回流的爆炸半径。

### 5.3 资源加载与阻塞

- HTML 遇 `<script>` 即挂起，非首屏关键 JS 务必加 `defer` 或 `async`。
- 内联首屏关键 CSS，因为 CSSOM 不就绪，Render Tree 就无法构建，页面白屏。

### 5.4 DevTools 性能排查

- **Performance**：核心面板，观察火焰图中的紫条 (Layout) 和绿条 (Paint)。
- **Layers**：排查独立图层是否过多导致内存溢出（切忌滥用 `will-change`）。
- **Rendering 面板**：开启 `Paint flashing`，肉眼观察页面中哪些区域发生了不必要的闪烁重绘。

## 6. 完整流程图

![Logo](/img/render.png)

## 7. 常见问题 (FAQ) 与性能优化实战

### 7.1 为什么“读取”某些属性会导致浏览器强制回流（性能杀手）？

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

### 7.2 如何尽量避免或减少回流与重绘？

这是前端性能优化的重头戏：

- **CSS 层面**：
  - **合并样式修改**：不要逐条修改 `style`，而是通过改变 `className` 或使用 `cssText` 一次性修改。
  - **避免使用 `table` 布局**：表格中哪怕一个单元格的内容改变，都可能导致整个表格的重新计算。
  - **CSS3 硬件加速 (GPU 加速)**：对于需要频繁做动画的元素，使用 `transform` (如 `translate`, `scale`) 和 `opacity`。这两个属性通常不会触发布局和绘制，它们是在最后的“合成 (Compositing)”阶段处理的，性能很高。
  - 使用 `will-change: transform` 提前告诉浏览器该元素要做动画，浏览器会为其分配独立的图层（Layer），避免它的变化影响到其他节点。

- **JavaScript (DOM 操作) 层面**：
  - **离线操作 DOM**：如果需要对 DOM 节点进行大量复杂的修改（如插入 1000 个 `<li>`）：
    - 先用 `display: none` 隐藏元素（1次回流）。
    - 在内存中进行 1000 次修改（0次回流）。
    - 再把 `display` 改回来（1次回流）。总共只发生 2 次回流。
  - **使用 DocumentFragment**：利用文档碎片 `document.createDocumentFragment()`，在内存中组装好一堆节点后，再用 `appendChild` 一次性插入到真实的 DOM 树中，这样只引发一次回流。
  - **脱离文档流**：对于复杂的动画元素，将其设置为绝对定位 `position: absolute` 或 `fixed`，使其脱离文档流。这样它的变化就不会影响周围其他元素的布局了。

### 7.3 如何排查渲染性能问题？

DevTools 中常看的指标：

- **Performance 面板**：查看 Scripting、Rendering、Painting 的耗时。
- **Layout Shift**：查看布局偏移。
- **Layers 面板**：查看图层数量是否异常。
- **Rendering 面板**：开启 Paint flashing 观察重绘区域。

常见问题：

- Layout 频繁出现：检查 DOM 读写交错和几何属性动画。
- Paint 面积过大：检查阴影、滤镜、复杂背景。
- Layers 过多：检查滥用 `will-change`、3D transform。
