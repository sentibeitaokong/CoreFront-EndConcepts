# CSS 渐变 (Gradients)

CSS 渐变是网页视觉设计中不可或缺的一部分，它允许我们在两个或多个颜色之间平滑过渡。**CSS 渐变本质上是一种“背景图像” (`<image>`)，而不是“背景颜色” (`<color>`)**。


CSS 提供了三种类型的渐变：线性 (Linear)、径向 (Radial) 和 锥形 (Conic)。

## 1. 线性渐变 (`linear-gradient`)

沿着一条直线（从上到下、从左到右或对角线）进行颜色过渡。

### 1.1 基础语法
```css
background-image: linear-gradient(direction, color-stop1, color-stop2, ...);
```

### 1.2 方向控制
*   **关键字**: `to bottom` (默认), `to right`, `to bottom right` (对角线)。
*   **角度 (deg)**: `0deg` (从下往上), `90deg` (从左往右), `180deg` (从上往下), `45deg`.
*   *记忆技巧：0度在 12 点钟方向，顺时针旋转。*

```css
/* 从左上角 到 右下角 */
background: linear-gradient(to bottom right, red, blue);

/* 指定 45 度角 */
background: linear-gradient(45deg, orange, yellow);
```

### 1.3 颜色节点 (Color Stops)
你可以指定颜色开始的位置（百分比或像素）。如果不指定，颜色会均匀分布。

```css
/* 红色占前 30%，蓝色从 30% 开始过渡到 100% */
background: linear-gradient(to right, red 30%, blue 100%);

/* 硬切变 (Hard Stop)：瞬间变色，没有过渡 */
/* 制作条纹效果 */
background: linear-gradient(to right, red 50%, blue 50%);
```

## 2. 径向渐变 (`radial-gradient`)

从中心点向四周呈圆形或椭圆形扩散。

### 2.1 基础语法
```css
background-image: radial-gradient(shape size at position, start-color, ..., last-color);
```

### 2.2 形状与尺寸
*   **Shape (形状)**: `circle` (正圆), `ellipse` (默认，椭圆，适应容器宽高比例)。
*   **Size (扩散范围)**:
    *   `farthest-corner` (默认): 扩散到最远的角（完全覆盖）。
    *   `closest-side`: 扩散到最近的边。
*   **At Position (圆心位置)**: 默认为 `center`。也可以是 `at top left` 或 `at 50% 50%`。

```css
/* 在左上角画一个正圆渐变 */
background: radial-gradient(circle at top left, white, black);
```

## 3. 锥形渐变 (`conic-gradient`)

围绕中心点旋转颜色（像饼图或色轮）。这是 CSS3 较晚加入的特性，非常适合做饼图或金属光泽。

### 3.1 语法
```css
background-image: conic-gradient(from angle at position, color1, color2, ...);
```

### 3.2 实战应用：饼图
```css
/* 红色占 25%，蓝色占剩余部分 */
background: conic-gradient(red 0% 25%, blue 25% 100%);
```

## 4. 重复渐变 (Repeating Gradients)

普通渐变只会渲染一次。如果想做**条纹背景**或**稿纸纹理**，需要使用 `repeating-` 前缀。

*   `repeating-linear-gradient(...)`
*   `repeating-radial-gradient(...)`

**关键点**：必须显式指定颜色的**终点位置**（长度），否则浏览器不知道该多久重复一次。

```css
/* 斜向警示条纹 */
background: repeating-linear-gradient(
  45deg,
  yellow,
  yellow 10px, /* 黄色带宽度 10px */
  black 10px,
  black 20px   /* 黑色带宽度 10px (20-10) */
);
```

## 5. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么 `background-color` 和 `gradient` 一起写会失效？
**错误写法**：
```css
background: linear-gradient(red, blue);
background-color: green; /* 这句覆盖了上一句 */
```
**原因**：`background` 是简写属性。后写的属性会覆盖先写的。而且渐变属于 `background-image`。
**正确写法**：
1.  只用简写属性，把 color 写在最后（作为回退）：
    `background: linear-gradient(red, blue), green;` (注意语法不支持直接这样混写，通常是分开)。
2.  **推荐**：分开写，且注意顺序。
    ```css
    background-color: green; /* 兜底颜色 (如果浏览器不支持渐变) */
    background-image: linear-gradient(red, blue);
    ```

### Q2: 渐变色出现明显的“波纹”或“色带” (Color Banding)？
**现象**：在大屏幕上，颜色过渡不平滑，有一条条的横纹。

**原因**：屏幕能显示的颜色数量是有限的（8-bit）。当两个颜色太接近且过渡距离太长时，中间就没有足够的颜色级数来填充了。

**解法**：
1.  **缩短过渡距离**。
2.  **添加噪点**：给背景叠加一张透明的噪点图片，打破规则的条纹感。
3.  **不规则角度**：使用 `linear-gradient(133deg, ...)` 而不是标准的 90 度，有助于视觉欺骗。

### Q3: 如何做“文字渐变色”？
这是一个经典技巧，结合 `background-clip`。

```css
.gradient-text {
  /* 1. 设置背景渐变 */
  background-image: linear-gradient(to right, #f00, #00f);
  
  /* 2. 核心：按文字裁剪背景 (WebKit 私有属性，但兼容性极好) */
  -webkit-background-clip: text;
  background-clip: text;
  
  /* 3. 核心：把文字本身变透明，透出背景 */
  color: transparent;
}
```

### Q4: 渐变边框怎么做？
`border-color` 不支持渐变。
**解法 A：使用 `border-image`** (不支持圆角 `border-radius`)。
```css
border: 5px solid;
border-image: linear-gradient(red, blue) 1;
```

**解法 B：双层盒子模拟 (支持圆角 - 推荐)**
父容器是渐变背景，子容器是白色背景，中间留出的 `padding` 就是“边框”。
```css
.gradient-border-box {
  background: linear-gradient(red, blue);
  padding: 2px; /* 边框宽度 */
  border-radius: 10px;
}
.content {
  background: white;
  border-radius: 8px; /* 略小于父容器 */
}
```

### Q5: 为什么在 Safari 上透明渐变会变黑？
**现象**：`linear-gradient(white, transparent)` 在旧版 Safari 中，中间过渡区会变得灰黑。

**原因**：`transparent` 本质是 `rgba(0,0,0,0)`（黑色透明）。所以它是从白色过渡到黑色透明。

**解法**：显式指定透明的颜色。
`linear-gradient(white, rgba(255,255,255, 0))`。

## 6. 总结

*   渐变是 **Image**，不是 Color。
*   **线性渐变** (`linear`) 最常用，注意 `to direction` 和 `deg` 的区别。
*   **硬切变** (两个颜色位置相同) 可以用来画条纹。
*   **文字渐变**需配合 `-webkit-background-clip: text`。
*   **透明过渡**要小心 `transparent` 陷阱，最好用 `rgba`。