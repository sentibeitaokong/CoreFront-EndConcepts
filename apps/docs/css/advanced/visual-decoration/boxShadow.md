# CSS 阴影 (Shadows)

CSS 阴影不仅能增加页面的立体感（Z 轴层级），还是实现现代 UI 风格（如拟态、卡片悬浮）的核心属性。本文将涵盖 `box-shadow`、`text-shadow` 以及更智能的 `drop-shadow` 滤镜。

## 1. 盒子阴影 (`box-shadow`)

用于给块级元素（div, button, card 等）添加阴影。

### 1.1 完整语法

```css
/* x偏移 y偏移 模糊半径 扩展半径 颜色 (内阴影) */
box-shadow: 10px 10px 20px 5px rgba(0, 0, 0, 0.5) inset;
```

### 1.2 参数详解

| 参数         | 必填? | 描述                                   | 负值表现                        |
| :----------- | :---- | :------------------------------------- | :------------------------------ |
| **Offset-X** | ✅    | 水平偏移量。                           | 阴影向**左**移。                |
| **Offset-Y** | ✅    | 垂直偏移量。                           | 阴影向**上**移。                |
| **Blur**     | ❌    | **模糊半径**。0 为实边，值越大越模糊。 | **不支持负值**。                |
| **Spread**   | ❌    | **扩展半径**。阴影变得比物体大多少。   | 阴影**缩小** (常用于单边阴影)。 |
| **Color**    | ❌    | 阴影颜色。推荐使用 `rgba` 控制透明度。 | -                               |
| **Inset**    | ❌    | 关键字。将外部阴影转为**内部阴影**。   | -                               |

### 1.3 常用实战代码

**1. 基础卡片阴影 (柔和)**

```css
.card {
  /* 0偏移，让阴影向四周扩散 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

![Logo](/img/boxShadowFirst.png)

**2. 单边阴影 (只在底部)**
利用**负的 spread** 抵消阴影的尺寸，只让它在 Y 轴偏移时露出来。

```css
.bottom-only {
  /* x=0, y=10, blur=10, spread=-5 */
  box-shadow: 0 10px 10px -5px rgba(0, 0, 0, 0.5);
}
```

![Logo](/img/boxShadowSecond.png)

**3. 内阴影 (输入框凹陷感)**

```css
.input-field {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

![Logo](/img/boxShadowThird.png)

**4. 多重阴影 (逼真效果)**
使用逗号分隔，可以叠加多层阴影。越写在前面的层级越高。

```css
.realistic {
  box-shadow:
    0 1px 2px rgba(0, 0, 255, 0.6),
    /* 第一层：紧贴的深色 */ 0 4px 8px rgba(0, 255, 0, 0.7),
    /* 第二层：中距离 */ 0 8px 16px rgba(255, 0, 0, 0.8); /* 第三层：远距离扩散 */
}
```

![Logo](/img/boxShadowFourth.png)

## 2. 文字阴影 (`text-shadow`)

用于给文本内容添加阴影。它**不支持** `spread` (扩展) 和 `inset` (内阴影)。

### 2.1 语法

```css
/* x偏移 y偏移 模糊半径 颜色 */
text-shadow: 2px 2px 4px #000;
```

![Logo](/img/textShadow.png)

### 2.2 常见效果

**1. 发光文字 (Glow)**

```css
.neon {
  color: #fff;
  /* 多层叠加增加亮度 */
  text-shadow:
    0 0 5px #fff,
    0 0 10px #ff00de,
    0 0 20px #ff00de;
}
```

![Logo](/img/glow.png)

**2. 浮雕效果 (Letterpress)**

```css
.emboss {
  color: #888;
  background: #eee;
  /* 下方给白光，看起来像刻进去的 */
  text-shadow: 0 1px 0 #fff;
}
```

![Logo](/img/emboss.png)

## 3. 智能阴影：`filter: drop-shadow()`

`box-shadow` 虽然强大，但有个先天限制——它只认**盒子模型**，不认元素**真正的样子**。当元素不是矩形（透明 PNG、SVG 图标、CSS 画的图形）时，`box-shadow` 就会“**露馅**”：阴影变成了一个方框。

`filter: drop-shadow()` 正是为此而生。它是 CSS `filter` 滤镜家族的一员，会先拿到元素**渲染后的像素**，再按**像素的透明度（alpha 通道）** 去描边，让阴影**贴合元素的真实轮廓**——这也是它被称为“**智能阴影**”的原因。

### 3.1 语法与参数

```css
/* offset-x offset-y [blur-radius] [color] */
filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.5));
```

| 参数         | 必填? | 描述                                  | 负值表现         |
| :----------- | :---- | :------------------------------------ | :--------------- |
| **Offset-X** | ✅    | 水平偏移量。                          | 阴影向**左**移。 |
| **Offset-Y** | ✅    | 垂直偏移量。                          | 阴影向**上**移。 |
| **Blur**     | ❌    | 模糊半径，省略时为 `0`（锐利边缘）。  | **不支持负值**。 |
| **Color**    | ❌    | 阴影颜色，省略时用当前 `color` 的值。 | -                |

> 和 `box-shadow` 不同，`drop-shadow()` **没有 `spread`（扩展）和 `inset`（内阴影）**。另外，**颜色和长度可以交换顺序**（如 `drop-shadow(rgba(0,0,0,.5) 4px 4px 8px)`），但习惯上先写偏移、再写颜色。

### 3.2 核心原理：按像素 alpha 通道取轮廓

- **`box-shadow`**：在布局阶段，直接拿元素的**盒模型边界**（矩形或 `border-radius`）画阴影，**不关心里面是什么**。
- **`drop-shadow()`**：在渲染阶段，先等元素**完整画出来**（背景、内容、透明区域都算），再对**最终像素**做一次“**描边**”——凡是**不透明（alpha > 0）** 的区域，都作为轮廓向外投影。

所以哪怕是中间镂空的图形、透明的文字、不规则的曲线，`drop-shadow` 都能 1:1 还原轮廓。代价是它要做一次**像素级计算**，因此比 `box-shadow` **更费性能**。

### 3.3 与 `box-shadow` 的本质区别

| 特性               | `box-shadow`                             | `filter: drop-shadow()`           |
| :----------------- | :--------------------------------------- | :-------------------------------- |
| **形状依据**       | **盒子模型**（矩形或 `border-radius`）。 | **像素 alpha 通道**（真实轮廓）。 |
| **透明图片**       | 阴影是一个方框。                         | 阴影贴合图片内容边缘。            |
| **虚线边框**       | 阴影是实心的。                           | 阴影也是虚线的。                  |
| **三角形**         | （用 border 画时）阴影是方框。           | 阴影是三角形。                    |
| **spread / inset** | ✅ 支持。                                | ❌ 不支持。                       |
| **多个阴影叠加**   | 逗号 `,` 分隔。                          | 空格链接多个 `drop-shadow()`。    |
| **性能**           | 较好（GPU 加速）。                       | 较差（像素级计算，慎用大模糊）。  |

### 3.4 适用场景

**1. 透明 PNG 图片**

Logo、图标等透明背景的 PNG，用 `box-shadow` 会画出难看的方框，`drop-shadow` 则贴合内容轮廓。

```css
.logo {
  /* 只给图片的不透明部分加阴影 */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}
```

**2. SVG 图标**

SVG 是矢量描述，本身没有“**盒子**”概念，`drop-shadow` 对任意 `<path>` 都能精确投影。

```html
<svg class="icon" width="80" height="80" viewBox="0 0 80 80">
  <path d="M40 8 L72 72 L40 52 L8 72 Z" fill="#f5222d" />
</svg>
```

```css
.icon {
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.4));
}
```

**3. CSS 绘制的三角形**

用 `border` 技巧画的三角形没有真正的“**盒子内容**”，`box-shadow` 只能画方框，`drop-shadow` 却能得到三角形的影子。

```css
.triangle {
  filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.9));
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 50px solid red; /* 形成向上的三角形 */
  border-left: 50px solid transparent;
}
```

![Logo](/img/dropShadow.png)

**4. `clip-path` 裁剪的图形**

`box-shadow` 会被 `clip-path` 直接裁掉（阴影整个消失），所以**不能**用它给裁剪图形加阴影。`drop-shadow` 能按裁剪后的形状投影，但有个关键前提：**`filter` 要写在裁剪元素的父容器上**——因为 `clip-path` 会把元素本身连同它的滤镜输出一起裁掉。

```css
.wrapper {
  /* 关键：加在父容器，而不是被裁剪的元素上 */
  filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.35));
}
.clipped {
  width: 80px;
  height: 80px;
  background: #f5222d;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
```

```html
<div class="wrapper">
  <div class="clipped"></div>
</div>
```

### 3.5 多个阴影叠加

`drop-shadow` **不支持像 `box-shadow` 那样用逗号叠加**，而是用**空格链接多个函数**，每个函数独立投影、逐层叠加：

```css
.multi {
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.4)) /* 紧贴的深阴影 */
    drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2)); /* 远处的柔和阴影 */
}
```

### 3.6 注意事项与坑

**1. 性能开销更大**

`filter` 属于像素级滤镜，`drop-shadow` 的模糊半径越大、元素越多，重绘成本越高。滚动列表、频繁动画的元素上要慎用；静态图标可放心使用，必要时把结果“烤”成图片。

**2. 无法做“单边阴影”**

因为没有 `spread`，也就无法用“**负扩展**”抵消偏移（`box-shadow` 的 `0 10px 10px -5px` 技巧在这里行不通）。只能通过**减小偏移 + 减小 blur** 来近似“**只露一边**”的效果。

**3. 非 `none` 的 `filter` 会创建层叠上下文**

只要 `filter` 的值不是 `none`，该元素就会成为新的**层叠上下文**，并成为 `position: fixed` 后代的**包含块**。这意味着加个阴影可能悄悄改变子元素的定位和 `z-index` 层级——排查层级问题时别忘了这一层。

**4. 与其它滤镜函数混用要留意顺序**

`filter` 里的多个函数是**从左到右依次作用**的，后一个函数作用在前一个的**输出**上：

```css
/* 先加阴影、再整体变灰 → 阴影也被变灰了 */
filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5)) grayscale(1);
/* 先变灰、再加阴影 → 阴影仍是黑色 */
filter: grayscale(1) drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5));
```

**5. 浏览器兼容性**

`filter`（含 `drop-shadow`）已被所有现代浏览器支持（Chrome / Edge / Firefox / Safari）。只有老版 IE 完全不支持，需要时给它补一个 `box-shadow` 作为降级即可：

```css
.fallback {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* 老浏览器降级 */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)); /* 现代浏览器 */
}
```

## 4. 常见问题 (FAQ) 与 避坑指南

### 4.1 阴影被两边的元素挡住了 (被切断)？

**现象**：给元素加了 `box-shadow`，但上下左右被邻居元素盖住了。

**原因**：阴影默认不占据布局空间，且层级 (z-index) 较低。如果邻居元素有背景色，就会盖住你的阴影。

**解法**：

- 给当前元素加 `position: relative; z-index: 1;` 提高层级。
- 或者给当前元素加 `margin`，留出显示阴影的空间。

### 4.2 为什么我的阴影会导致页面出现横向滚动条？

**原因**：虽然阴影不占布局空间，但它算作“**视觉溢出 (Visual Overflow)**”。如果右侧阴影延伸出了屏幕宽度，浏览器会显示滚动条。

**解法**：

- 减小阴影尺寸。
- 在父容器（或 body）上设置 `overflow-x: hidden`。

### 4.3 `box-shadow` 只能做外阴影吗？

**技巧**：不，它不仅能做内阴影 (`inset`)，甚至能用来做**多重边框**。
`border` 只能设一次，但 `box-shadow` 可以无限叠加。

```css
.rainbow-border {
  box-shadow:
    0 0 0 5px red,
    0 0 0 10px orange,
    0 0 0 15px yellow;
  /* 注意：spread 必须是累加的 */
}
```

### 4.4 移动端页面滚动卡顿？

**原因**：过大的 `blur` 半径（如 `50px` 以上）或者过多的 `box-shadow` 会消耗大量 GPU/CPU 资源，导致重绘性能下降。

**优化**：

- 尽量减少 blur 值。
- 对于静态背景的大阴影，可以用一张半透明 PNG 图片代替 CSS 阴影。

### 4.5 怎么去掉 iOS 按钮自带的阴影？

iOS Safari 有时候会给 input 或 button 加上默认的系统样式。

```css
button,
input {
  appearance: none; /* 清除系统默认外观 */
  -webkit-appearance: none;
  box-shadow: none; /* 显式清除 */
}
```

### 4.6 为什么给透明背景的盒子加 `box-shadow`，阴影会透过盒子显示出来？

**现象**：`background-color: transparent`，加了阴影后，盒子里面看起来灰灰的。

**机制**：`box-shadow` 默认是在元素**背面**绘制的，但不会被元素的 `background` 裁剪（除非是 inset）。如果元素没背景色，自然能看到背后的阴影。

**解法**：如果这是你不想要的效果，你必须给元素一个不透明的 `background-color`。
