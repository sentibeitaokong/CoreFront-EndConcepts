# CSS 渲染性能与优化

**核心本质**：CSS 优化的终极目标并非单纯的“**压缩文件体积**”，而是深度掌控浏览器从 **CSSOM 构建 -> 样式计算 -> 布局 (Layout) -> 绘制 (Paint) -> 合成 (Composite)** 的整条渲染流水线。失控的 CSS 会死锁首屏渲染、导致滚动掉帧，并制造难以追踪的 CLS（布局偏移）。

**战术纪律**：首屏关键样式必须极速就位，选择器匹配规则必须扁平，高频动画必须降维至 GPU 合成层，巨型 DOM 树的布局变化必须被严格隔离。

## 1. CSS 在渲染链路中的位置

浏览器渲染页面是一场接力赛，CSS 参与了最吃性能的几个阶段：

- **CSSOM 构建 (阻塞点)**：浏览器遇到 `<link>` 时会暂停渲染树构建。没有 CSSOM，页面就是一片白板。
- **样式计算 (Recalculate Style)**：DOM 节点与 CSS 规则进行结合。规则越复杂，DOM 树越大，耗时呈指数级上升。
- **布局计算 (Layout/Reflow)**：极其昂贵。改变 `width`、`height`、`margin`、`top` 会迫使浏览器重新计算整个文档流的几何信息。
- **绘制上屏 (Paint/Repaint)**：改变 `color`、`background`、`box-shadow` 会触发重绘，逐像素重新填充屏幕。
- **图层合成 (Composite)**：最廉价的阶段。仅改变 `transform` 和 `opacity` 时，GPU 会直接对现有图层进行位移和透明度变换，完全跳过布局和绘制。

## 2. 关键 CSS 与阻塞控制

首屏 CSS 是渲染路径上的绝对硬依赖。哪怕 JS 优化得再好，CSS 慢了，FCP 和 LCP 都会全盘崩溃。

- **内联 Critical CSS**：提取首屏可见区域的绝对核心样式，直接内联到 HTML `<head>` 中，省去一次网络往返。
- **按需与媒体查询拦截**：利用 `media` 属性，让非首屏、非当前设备的样式文件在后台静默下载，不阻塞渲染。
- **严禁滥用 `@import`**：在 CSS 文件中使用 `@import` 会导致极其致命的 **串行请求**（必须等当前 CSS 下载解析完，才去请求下级 CSS），破坏浏览器的并发下载机制。

```html
<style>
  .hero {
    min-height: 420px;
    display: grid;
  }
</style>

<link
  rel="stylesheet"
  href="print.css"
  media="print"
  onload="this.media='all'"
/>
<link rel="stylesheet" href="dark.css" media="(prefers-color-scheme: dark)" />
```

## 3. 选择器解析机制与作用域治理

必须牢记：**浏览器的 CSS 选择器是从右向左 (Right-to-Left) 匹配的**。

- **扁平化原则**：`.list .item span` 会让浏览器先查找页面上**所有**的 `span`，再去匹配它们的父级，极其低效。应尽量将嵌套深度控制在 2 层以内。
- **依赖 class 而非标签**：使用 BEM 命名法、CSS Modules 或 Tailwind 等原子化方案，直接用确定的 class 锚定目标，避免 `.container > div > p:nth-child(2)` 这种脆弱且昂贵的路径查找。
- **降低样式穿透**：严禁在组件内部使用深度作用域选择器（如 `::v-deep *`）进行大面积样式重写，这会击穿框架的作用域隔离，污染全局样式树。

```css
/* ❌ 灾难写法：浏览器先找全站所有 span，再找 title，再找 item... 性能极差 */
.list .item .title span {
  color: #222;
}

/* ✅ 架构师写法：直接命中目标，解析复杂度 O(1) */
.list-item-title {
  color: #222;
}
```

## 4. 布局 (Layout) 与绘制 (Paint) 的物理隔离

卡顿往往不是因为 JS 算得慢，而是 JS 触发了大规模的 Layout。

- **动画降维**：位移、缩放、旋转动画**必须且只能**使用 `transform`，显隐动画只能使用 `opacity`。绝不能用 `margin-top` 或 `left` 做动画。
- **启用 `content-visibility`**：这是现代 CSS 最强的性能属性。对于处于视口外的长列表或复杂区块，设置为 `auto`，浏览器将直接跳过其内部的渲染和布局计算。

:::details content-visibility

```css
/* 针对极长列表的终极性能优化 */
.heavy-list-section {
  content-visibility: auto;
  contain-intrinsic-size: 1000px; /* 预留占位高度，防止滚动条抖动 */
}

/* 动画必须留在合成层 */
.drawer-enter {
  transform: translate3d(16px, 0, 0); /* 开启 GPU 硬件加速 */
  opacity: 0;
}
```

:::

- **利用 `contain` 打造护城河**：明确告诉浏览器，当前 DOM 内部的变化不会影响外部布局（`contain: strict`），从而将重排的爆炸半径限制在局部。

:::details contain

```css
.list-item {
  /* strict 包含 layout, paint, style。相当于给内部建立了一个独立的小王国 */
  /* layout: 限制内部布局变化的影响范围 */
  /* paint: 防止内部绘制越界 */
  /* size: 显式告诉浏览器此区域大小固定，无需随内容调整 */
  contain: layout paint size;
  height: 80px; /* size 限制下必须给高度 */
  width: 100%;
}
```

:::

## 5. 图层爆炸与 will-change

`will-change` 相当于给元素提前颁发了“**VIP 通行证**”，让其拥有独立的 GPU 渲染图层，但它是把双刃剑。

- **只给即将变化的元素使用**：如果给全站 1000 个列表项都加上 `will-change: transform`，会导致**图层爆炸 (Layer Explosion)**，疯狂榨干移动端设备的 GPU 显存，导致浏览器直接崩溃 (OOM)。
- **动画结束后必须销毁**：通过 JS 在动画开始前添加该属性，动画结束后立刻移除 (`will-change: auto`)。

```js
const drawer = document.querySelector('.drawer')

// 1. 监听到点击按钮（用户即将触发动画）
document.querySelector('.toggle-btn').addEventListener('mouseenter', () => {
  // 提前 100-200ms 开启，让浏览器有足够时间完成图层提升
  drawer.style.willChange = 'transform'
})

// 2. 动画结束（或者 mouseleave）后，必须移除！！！
drawer.addEventListener('transitionend', () => {
  drawer.style.willChange = 'auto'
})
```

## 6. 自定义字体与 FOIT/FOUT 治理

字体的加载缝隙不仅影响视觉体验，更是 CLS 飙升的重灾区。

- **`font-display: swap`**：绝不让用户看白屏。先用系统默认字体展示，下载完毕后无缝替换。
- **精细化按需加载**：如果是中文字体，必须使用 Fontmin 等工具进行子集化裁剪（Subsetting），或依赖 Google Fonts 的 API 按需返回切片。
- **利用 `size-adjust` 消除 CLS**：当后备字体被真实字体替换时，往往会因为字重和行高不一致导致文本块高度突变。通过调整后备字体的度量指标，可以完美抹平这种位移。

```css
@font-face {
  font-family: 'Fallback Font';
  src: local('Arial');
  /* 调整系统后备字体的尺寸比例，使其与即将加载的自定义字体完美贴合，消灭 CLS */
  size-adjust: 98.5%;
  ascent-override: 95%;
}
```

## 7. 核心渲染度量指标

优化不能靠直觉，必须深入 Chrome DevTools 的 Performance 和 Coverage 面板进行数据论证。

| 核心指标              | 观测目标与架构含义                                              | 极客级达标线        |
| --------------------- | --------------------------------------------------------------- | ------------------- |
| **Render Blocking**   | `<head>` 中的 CSS 下载与解析耗时，直接决定页面白屏时间。        | **< 200ms**         |
| **Recalculate Style** | 样式树的重新计算耗时。选择器越深、DOM 越庞大，耗时越长。        | 单次帧内 **< 10ms** |
| **Layout (重排)**     | 几何属性变更引发的全局/局部重新排版，是掉帧的核心元凶。         | **避免连续出现**    |
| **Paint (重绘)**      | GPU 绘制像素的耗时。应避免超大面积的复杂渐变或 `filter: blur`。 | 单次帧内 **< 5ms**  |
| **Unused Bytes**      | 被下载但未被当前页面使用的 CSS 占比。                           | **< 20%**           |
