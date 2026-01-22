# CSS 2D / 3D 转换 (Transforms)

`transform` 属性允许你修改坐标空间，从而对元素进行旋转、缩放、倾斜或平移。

## 1.1 `transform` (转换函数集合)

这是应用转换的主属性。你可以组合多个函数，**空格分隔**，执行顺序**从左到右**。

### 2D 转换函数
| 函数 | 语法 | 描述                                                                                                  |
| :--- | :--- |:----------------------------------------------------------------------------------------------------|
| **`translate()`** | `translate(x, y)` | **平移**。<br>`translate(50px, 100px)`。<br>支持 `%` (相对于**自身**尺寸)。                                       |
| `translateX()` | `translateX(50px)` | 仅水平移动。                                                                                              |
| `translateY()` | `translateY(50px)` | 仅垂直移动。                                                                                              |
| **`scale()`** | `scale(x, y)` | **缩放**。<br>`scale(1.5)` (等比放大) 或 `scale(2, 1)` (拉伸)。<br>**负值** (如 `-1`) 会导致镜像翻转。                    |
| `scaleX()` | `scaleX(0.5)` | 仅水平缩放。                                                                                              |
| `scaleY()` | `scaleY(0.5)` | 仅垂直缩放。                                                                                              |
| **`rotate()`** | `rotate(angle)` | **旋转**。<br>`rotate(45deg)` (顺时针) 或 `rotate(-90deg)` (逆时针)。<br>支持 `deg` (度), `turn` (圈), `rad` (弧度)。 |
| **`skew()`** | `skew(x-angle, y-angle)` | **倾斜/斜切**。<br>`skew(30deg, 0)`。改变矩形角度变成平行四边形。                                                       |
| `matrix()` | `matrix(a, b, c, d, tx, ty)` | 2D 变换矩阵,参数(Y轴放大倍数，绕Y轴旋转，绕X轴旋转，X轴放大倍数，X轴平移， Y轴平移)。                                                   |

```css
transform: translate(x, y);
```

![Logo](/translate.png)

```css
transform: scale(x, y);
```

![Logo](/scale.png)

```css
transform: rotate(angle);
```

![Logo](/rotate.png)

```css
transform: skew(x-angle, y-angle);
```

![Logo](/skew.png)

### 3D 转换函数 (需配合 perspective)
| 函数 | 语法 | 描述 |
| :--- | :--- | :--- |
| **`translate3d()`**| `translate3d(x, y, z)` | 3D 平移。常用于开启 GPU 加速 (`translate3d(0,0,0)`)。 |
| `translateZ()` | `translateZ(100px)` | **Z轴平移**。正值离视线更近（变大），负值更远。 |
| **`rotate3d()`** | `rotate3d(x, y, z, a)` | 3D 旋转。`(1, 1, 0, 45deg)` 表示绕 X/Y 轴向量旋转。 |
| `rotateX()` | `rotateX(45deg)` | 绕 X 轴（横轴）旋转。类似体操单杠。 |
| `rotateY()` | `rotateY(45deg)` | 绕 Y 轴（纵轴）旋转。类似旋转门。 |
| `rotateZ()` | `rotateZ(45deg)` | 绕 Z 轴旋转。视觉效果等同于 2D `rotate()`。 |
| `scaleZ()` | `scaleZ(2)` | Z轴方向缩放。仅在元素有厚度（立方体）时有意义。 |
| `perspective()` | `perspective(n)` | **函数版透视**。为**当前元素**设置透视点。通常用于给单个元素做 3D 效果。 |

```css
transform: translate3d(x, y, z);
```

![Logo](/translate3d.png)

```css
transform: rotate3d(x, y, z, a);
```

![Logo](/rotate3d.png)

```css
transform: perspective(n);
```

![Logo](/perspective.png)


## 1.2 辅助属性 API (环境设置)

这些属性决定了转换的基准点、3D 空间的构建方式等。

| 属性 | 作用对象 | 描述 | 常用值 |
| :--- | :--- | :--- | :--- |
| **`transform-origin`** | **自身** | **变换原点**。<br>默认是中心点 `50% 50%`。 | `top left` (左上角)<br>`bottom center`<br>`50% 50% 0` (3D原点) |
| **`perspective`** | **父容器** | **景深/透视距离**。<br>定义“摄像机”离舞台有多远。值越小，透视越夸张；值越大，越接近平面。 | `1000px` (标准)<br>`500px` (夸张)<br>`none` (无透视) |
| **`perspective-origin`**| **父容器** | **视点位置**。<br>你看向舞台的角度。 | `50% 50%` (正中心 - 默认)<br>`50% 0` (从上方俯视) |
| **`transform-style`** | **父容器** | **3D 空间保留**。<br>决定子元素是压扁在平面上，还是保持 3D 结构。 | `flat` (默认 - 2D)<br>**`preserve-3d`** (保留 3D 空间，做立方体必开) |
| **`backface-visibility`**| **自身** | **背面可见性**。<br>当元素旋转 180 度背面朝人时，是否显示。 | `visible` (默认 - 镜像显示)<br>**`hidden`** (隐藏 - 做翻转卡片必用) |

## 2. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么我的 `transform` 不生效？
**原因**: `transform` 属性对 **行内元素 (`display: inline`)** 无效（如 `<span>`, `<a>`）。

**解法**: 将其改为 `display: inline-block` 或 `display: block`。

### Q2: `position: fixed` 在 `transform` 元素内部失效（降级为 absolute）？
**现象**: 设置了固定定位的弹窗，如果它的父级有 `transform` (非 none)，它会跟着父级滚动，而不是固定在屏幕上。

**原因**: 规范规定，任何非 `none` 的 `transform` 值都会为该元素及其子元素创建一个新的**包含块 (Containing Block)**。`fixed` 子元素会相对于这个变换的父元素定位，而不是视口 (Viewport)。

**解法**: **将 fixed 元素移出 transform 容器**，直接放在 `<body>` 下层。

### Q3: 为什么 3D 旋转看起来像 2D 压扁的？
**原因**: 缺少 **透视 (`perspective`)**。
如果没有设置透视，Z 轴的变化只是简单的数学投影，看起来就像是宽/高变小了，没有“近大远小”的效果。

**解法**: 在父容器上添加 `perspective: 1000px;`。

### Q4: 变换后的文字/图片边缘模糊？
**原因**:
1.  **非整数像素**: `translate` 用了百分比或小数，导致元素落在 0.5px 的位置，屏幕渲染时产生抗锯齿模糊。
2.  **缩放失真**: 放大图片或文字。

**解法**:
1.  使用 `calc()` 配合像素凑整。
2.  尝试开启 GPU 加速: `transform: translateZ(0);` 或 `will-change: transform;`。
3.  如果是缩小模糊，可以尝试先放大 2 倍再 `scale(0.5)`。

### Q5: `z-index` 失效？
**原因**: `transform` 会创建一个新的 **层叠上下文 (Stacking Context)**。
这意味着该元素内部的 `z-index` 无论多大，都无法超越该元素**外部**的兄弟元素（如果兄弟元素的层级比该元素高）。

### Q6: 先旋转再平移，还是先平移再旋转？(顺序问题)
`transform` 的执行顺序是从左到右，且坐标系会跟随变换。
*   `translateX(100px) rotate(90deg)`: 先向右移 100px，然后在**新位置**旋转。
*   `rotate(90deg) translateX(100px)`: 先旋转坐标轴，X轴现在指向下方。然后沿 X 轴移动（视觉上是**向下**移了）。

**结论**: 顺序极其重要，结果完全不同。

### Q7: 为什么我的 3D 立方体散架了？
**原因**: 嵌套层级中，中间层的父元素没有开启 `transform-style: preserve-3d`。
默认是 `flat`，这意味着中间层把子元素的 3D 变换“拍扁”在自己的 2D 平面上，导致 Z 轴信息丢失。

**解法**: 确保所有参与 3D 结构的父容器都加上 `transform-style: preserve-3d`。

---

# 3. 经典应用场景代码

### 3.1 绝对居中 (万能方案)
利用 `translate` 的百分比是相对于自身的特性。
```css
.center-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### 3.2 翻转卡片 (Card Flip)
```css
.scene { perspective: 1000px; }
.card {
  transition: transform 0.6s;
  transform-style: preserve-3d; /* 关键 */
  position: relative;
}
.scene:hover .card { transform: rotateY(180deg); }
.face {
  position: absolute; width: 100%; height: 100%;
  backface-visibility: hidden; /* 关键：隐藏背面 */
}
.back { transform: rotateY(180deg); }
```