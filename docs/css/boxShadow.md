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

| 参数 | 必填? | 描述 | 负值表现 |
| :--- | :--- | :--- | :--- |
| **Offset-X** | ✅ | 水平偏移量。 | 阴影向**左**移。 |
| **Offset-Y** | ✅ | 垂直偏移量。 | 阴影向**上**移。 |
| **Blur** | ❌ | **模糊半径**。0 为实边，值越大越模糊。 | **不支持负值**。 |
| **Spread** | ❌ | **扩展半径**。阴影变得比物体大多少。 | 阴影**缩小** (常用于单边阴影)。 |
| **Color** | ❌ | 阴影颜色。推荐使用 `rgba` 控制透明度。 | - |
| **Inset** | ❌ | 关键字。将外部阴影转为**内部阴影**。 | - |

### 1.3 常用实战代码

**1. 基础卡片阴影 (柔和)**
```css
.card {
  /* 0偏移，让阴影向四周扩散 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

![Logo](/boxShadowFirst.png)

**2. 单边阴影 (只在底部)**
利用**负的 spread** 抵消阴影的尺寸，只让它在 Y 轴偏移时露出来。
```css
.bottom-only {
  /* x=0, y=10, blur=10, spread=-5 */
  box-shadow: 0 10px 10px -5px rgba(0, 0, 0, 0.5);
}
```

![Logo](/boxShadowSecond.png)

**3. 内阴影 (输入框凹陷感)**
```css
.input-field {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

![Logo](/boxShadowThird.png)

**4. 多重阴影 (逼真效果)**
使用逗号分隔，可以叠加多层阴影。越写在前面的层级越高。
```css
.realistic {
  box-shadow: 
    0 1px 2px rgba(0,0,255,0.6),  /* 第一层：紧贴的深色 */
    0 4px 8px rgba(0,255,0,0.7),  /* 第二层：中距离 */
    0 8px 16px rgba(255,0,0,0.8); /* 第三层：远距离扩散 */
}
```

![Logo](/boxShadowFourth.png)

## 2. 文字阴影 (`text-shadow`)

用于给文本内容添加阴影。它**不支持** `spread` (扩展) 和 `inset` (内阴影)。

### 2.1 语法
```css
/* x偏移 y偏移 模糊半径 颜色 */
text-shadow: 2px 2px 4px #000;
```

![Logo](/textShadow.png)

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

![Logo](/glow.png)

**2. 浮雕效果 (Letterpress)**
```css
.emboss {
  color: #888;
  background: #eee;
  /* 下方给白光，看起来像刻进去的 */
  text-shadow: 0 1px 0 #fff; 
}
```

![Logo](/emboss.png)

## 3. 智能阴影：`filter: drop-shadow`

这是 CSS3 滤镜的一部分，它和 `box-shadow` 有着本质的区别。

| 特性 | `box-shadow` | `filter: drop-shadow()` |
| :--- | :--- | :--- |
| **形状依据** | **盒子模型** (矩形或 border-radius)。 | **像素点 alpha 通道** (真实轮廓)。 |
| **透明图片** | 阴影是一个方框。 | 阴影贴合图片内容边缘。 |
| **虚线边框** | 阴影是实心的。 | 阴影也是虚线的。 |
| **三角形** | (如果是用 border 画的) 阴影是方框。 | 阴影是三角形。 |
| **性能** | 较好 (GPU 加速)。 | 较差 (计算量大，慎用大模糊)。 |

**适用场景**：PNG 透明图标、SVG 图标、CSS 绘制的三角形。

```css
/* 给一个红色三角形 加阴影 */
.triangle {
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.9));
    width: 0;
    height: 0;
    /* 四个边框都很粗，但内容区是 0 */
    border-top: 50px solid transparent;    /* 上边框透明 */
    border-right: 50px solid transparent;  /* 右边框透明 */
    border-bottom: 50px solid red;         /* 下边框红色 -> 形成向上的三角形 */
    border-left: 50px solid transparent;   /* 左边框透明 */
}
```

![Logo](/dropShadow.png)

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: 阴影被两边的元素挡住了 (被切断)？
**现象**：给元素加了 `box-shadow`，但上下左右被邻居元素盖住了。

**原因**：阴影默认不占据布局空间，且层级 (z-index) 较低。如果邻居元素有背景色，就会盖住你的阴影。

**解法**：
1.  给当前元素加 `position: relative; z-index: 1;` 提高层级。
2.  或者给当前元素加 `margin`，留出显示阴影的空间。

### Q2: 为什么我的阴影会导致页面出现横向滚动条？
**原因**：虽然阴影不占布局空间，但它算作“视觉溢出 (Visual Overflow)”。如果右侧阴影延伸出了屏幕宽度，浏览器会显示滚动条。

**解法**：
1.  减小阴影尺寸。
2.  在父容器（或 body）上设置 `overflow-x: hidden`。

### Q3: `box-shadow` 只能做外阴影吗？
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

### Q4: 移动端页面滚动卡顿？
**原因**：过大的 `blur` 半径（如 `50px` 以上）或者过多的 `box-shadow` 会消耗大量 GPU/CPU 资源，导致重绘性能下降。

**优化**：
1.  尽量减少 blur 值。
2.  对于静态背景的大阴影，可以用一张半透明 PNG 图片代替 CSS 阴影。

### Q5: 怎么去掉 iOS 按钮自带的阴影？
iOS Safari 有时候会给 input 或 button 加上默认的系统样式。
```css
button, input {
  appearance: none; /* 清除系统默认外观 */
  -webkit-appearance: none;
  box-shadow: none; /* 显式清除 */
}
```

### Q6: 为什么给透明背景的盒子加 `box-shadow`，阴影会透过盒子显示出来？
**现象**：`background-color: transparent`，加了阴影后，盒子里面看起来灰灰的。

**机制**：`box-shadow` 默认是在元素**背面**绘制的，但不会被元素的 `background` 裁剪（除非是 inset）。如果元素没背景色，自然能看到背后的阴影。

**解法**：如果这是你不想要的效果，你必须给元素一个不透明的 `background-color`。