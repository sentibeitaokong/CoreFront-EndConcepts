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

- **内联 Critical CSS**：提取首屏可见区域的绝对核心样式,直接内联到 HTML`<head>`中，省去一次网络往返。
- **按需与媒体查询拦截**：利用`media`属性，让非首屏、非当前设备的样式文件在后台静默下载，不阻塞渲染。
- **严禁滥用 `@import`**：在 CSS 文件中使用 `@import` 会导致极其致命的 **串行请求**（必须等当前 CSS 下载解析完，才去请求下级 CSS），破坏浏览器的并发下载机制。

```html
<head>
  <!-- ① 内联首屏关键 CSS：省掉一次网络往返，FCP 直接受益。
       内容应由构建工具自动提取（critters、vite-plugin-critical 等），不要手工维护 -->
  <style>
    /* 只放首屏可见区域真正用到的样式：布局骨架、首屏区块、字体度量 */
    .header {
      height: 56px;
    }
    .hero {
      min-height: 420px;
      display: grid;
    }
  </style>

  <!-- ② 其余样式异步加载：media="print" 让浏览器判定「当前设备用不到」，
       于是以低优先级下载、不阻塞渲染树构建；下载完成触发 onload，
       把 media 改回 all，样式立即生效（不重排、无闪烁） -->
  <link
    rel="stylesheet"
    href="/assets/rest.css"
    media="print"
    onload="this.media='all'"
  />

  <!-- ③ 兜底：禁用 JS 时 onload 不会执行，用 noscript 补一次正常加载 -->
  <noscript>
    <link rel="stylesheet" href="/assets/rest.css" />
  </noscript>
</head>
```

> 把 `media` 换成 `rel`：`<link rel="preload" as="style" href="..." onload="this.rel='stylesheet'">`——它让样式走 preload 的高优先级通道，**下载更快但会抢占带宽**。首屏关键样式用内联,其余样式二选一即可;两种写法都必须配 `<noscript>` 兜底。

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

**特异性 (Specificity) 速查**——它决定“**谁的规则赢**”，也决定你会不会被逼着写 `!important`：

[width(22,18,60)]

| 选择器              | 权重 (a,b,c) | 例子                            |
| ------------------- | ------------ | ------------------------------- |
| 通配符 / 组合子     | 0,0,0        | `*`、`>`、`+`（不加权）         |
| 标签 / 伪元素       | 0,0,1        | `div`、`::before`               |
| class / 属性 / 伪类 | 0,1,0        | `.btn`、`[type=text]`、`:hover` |
| id                  | 1,0,0        | `#app`                          |
| 行内 `style`        | 高于以上所有 | 只能被 `!important` 覆盖        |

**两个降特异性的高频伪类**（现代 CSS 的救命工具）：

- `:is(a, b, c)`：匹配任一分支，**权重取参数中最高的那个**；
- `:where(a, b, c)`：功能与 `:is()` 相同，但**权重恒为 0**——专治“**组件库样式太霸道、我又不想加 `!important`**”。

```css
/* ❌ 传统写法：特异性堆到 0,3,0，后面想覆盖只能上 !important */
.page .card .title a:hover {
  color: red;
}

/* ✅ 现代写法：用 :where() 把外层权重清零，整条规则只剩 0,1,0，随时可覆盖 */
:where(.page .card .title) a:hover {
  color: red;
}
```

**`@layer` 级联层**：层的先后由**首次声明顺序**决定，与选择器权重无关——这让「框架样式 < 业务样式 < 工具类」这种分层约束不再靠权重硬拼：

```css
@layer reset, base, components, utilities; /* 声明顺序即优先级顺序 */

@layer components {
  .btn {
    color: #fff;
  } /* 即使这里写成 #id，也压不过 utilities 层 */
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

**高频场景：遇到这类需求，直接对号入座**

[width(23,16,61)]

| 场景                            | 应该走哪个阶段 | 关键手段                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------ |
| 抽屉 / 弹窗的进出场             | 合成           | `transform` + `opacity`，**绝不用 `top` / `height` 做位移**        |
| 骨架屏 → 真实内容切换           | 绘制           | 尺寸 1:1 对齐，只改 `background-color` 之类的视觉属性              |
| 长列表 / 长文档滚动             | 隔离           | `content-visibility: auto` + `contain-intrinsic-size`              |
| 卡片内部状态变化（hover、点赞） | 隔离           | `contain: layout paint`，把重排半径锁死在卡片内部                  |
| 主题 / 暗色模式切换             | 绘制           | 用 CSS 变量换**颜色**，别用变量换尺寸、间距                        |
| 拖拽排序 / 面板拖拽             | 合成 + 节流    | `transform` + `requestAnimationFrame` 节流，禁止每帧读 `offsetTop` |

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

**高频误用与平替：**

[width(34,28,38)]

| 写法                              | 问题                                | 更好的做法                                         |
| --------------------------------- | ----------------------------------- | -------------------------------------------------- |
| `will-change: all` 或一长串属性   | 浏览器无法聚焦优化，等于没写        | 只写真正会变的那个：`will-change: transform`       |
| 给全站列表项都加上                | 图层爆炸，移动端显存直接 OOM        | 只在**动画期间**用 JS 动态加，结束立刻移除         |
| 拿 `will-change` 当“**加速开关**” | 它不改变渲染路径，只是**提前提示**  | `transform` / `opacity` 才是唯二保证走合成的属性   |
| 长期常驻不清理                    | 图层一直占着显存不释放              | 动画结束切回 `will-change: auto`                   |
| 动画属性本身就不是合成属性        | 提升图层也没用，照样 Layout + Paint | 先把动画属性换成 `transform`，再考虑 `will-change` |

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

[width(21,61,18)]

| 核心指标              | 观测目标与架构含义                                              | 极客级达标线        |
| --------------------- | --------------------------------------------------------------- | ------------------- |
| **Render Blocking**   | `<head>` 中的 CSS 下载与解析耗时，直接决定页面白屏时间。        | **< 200ms**         |
| **Recalculate Style** | 样式树的重新计算耗时。选择器越深、DOM 越庞大，耗时越长。        | 单次帧内 **< 10ms** |
| **Layout (重排)**     | 几何属性变更引发的全局/局部重新排版，是掉帧的核心元凶。         | **避免连续出现**    |
| **Paint (重绘)**      | GPU 绘制像素的耗时。应避免超大面积的复杂渐变或 `filter: blur`。 | 单次帧内 **< 5ms**  |
| **Unused Bytes**      | 被下载但未被当前页面使用的 CSS 占比。                           | **< 20%**           |

## 8. 常见问题 (FAQ)

### 8.1 为什么我只改了一个 class，整个页面都在重排？

大概率改到的属性**属于几何类**（`width` / `height` / `margin` / `padding` / `font-size` / `display`），而不是视觉类。几何属性一变，受影响范围内的元素都要重新计算位置，元素如果在正常文档流里，影响会一路传导出去。

排查顺序：**先确认改的是哪一类属性**，**再看这个元素的容器有没有做隔离**（`contain` / `content-visibility`）。有隔离的话，重排半径就会被锁在小范围内。

### 8.2 `content-visibility: auto` 用了之后滚动条乱跳，甚至找不到内容？

- **滚动条跳动**：浏览器不知道视口外区域有多高，会用默认值估算 → 必须配 `contain-intrinsic-size` 声明预估尺寸；
- **`Ctrl+F` 找不到内容 / 锚点跳转错位**：视口外内容根本没渲染，浏览器的页内查找与锚点定位会失准。这类页面（长文档、需要精确检索的列表）就不该上 `content-visibility`。

### 8.3 明明用了 `transform` 做动画，为什么还是卡？

- **同时改了非合成属性**：`transform` 和 `box-shadow` / `filter` / `width` 一起变，照样要绘制；
- **父级或祖先有频繁重排**：子元素再快，也救不了被父级拖着走的布局；
- **一次动画的元素太多**：几百个元素同时动，GPU 和合成线程也会饱和；
- **触发了 `will-change` 滥用**：图层过多反而让合成变慢。

### 8.4 `:is()` 和 `:where()` 该用哪个？

只看一件事——**你要不要保留特异性**：

[width(36,64)]

| 目标                             | 用哪个     |
| -------------------------------- | ---------- |
| 想简化选择器，但保持原有优先级   | `:is()`    |
| 想**降低**优先级，方便被后续覆盖 | `:where()` |
| 写重置样式 / 基础库默认样式      | `:where()` |

所以组件库的默认样式适合用 `:where()` 包一层，让业务方无需 `!important` 就能覆盖。

### 8.5 改 CSS 变量会触发重排吗？

**完全取决于这个变量最终被哪个属性消费**。CSS 变量本身不参与渲染，它只是个占位符：

- 用于 `color`、`background` → 只重绘；
- 用于 `width`、`height`、`gap`、`font-size` → 完整重排；
- 用于 `transform`、`opacity` → 只合成。

### 8.6 Tailwind 这种「一个元素几十个 class」会不会拖慢样式计算？

**通常不会，反而常常更快**。样式计算的成本主要不在「class 数量」，而在**选择器匹配的复杂度**：原子化 CSS 全是 `.mt-4` 这种单类选择器，浏览器只需要按 class 查哈希表，远比 `.list .item .title span` 这类多级匹配便宜。

真正的成本在别处：**产物体积**（几万个没用到的类）和**样式表体积**。所以原子化方案的重点是做好 content 配置与裁剪，而不是担心类名多。

### 8.7 怎么量化「CSS 优化」到底有没有收益？

- **Coverage 面板**：看 Unused Bytes，先确定“**有没有白下载的 CSS**”；
- **Performance 面板**：录制一次首屏，看 `Recalculate Style` 与 `Layout` 的耗时条（目标：单帧分别 < 10ms / 尽量不连续出现）；
- **Rendering 面板**：勾选 `Paint flashing`，肉眼验证动画元素是否真的只走合成（不再闪绿）。
