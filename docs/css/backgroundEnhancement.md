# CSS 背景增强 (Background Enhancement)
CSS 的 `background` 属性远不止“铺一张图”那么简单。通过组合使用 `size`、`position`、`origin` 和 `clip` 等属性，我们可以实现响应式背景、多重背景叠加、甚至用 CSS 代替 PS 进行图像合成。

## 1. 核心增强属性

### 1.1 背景尺寸 (`background-size`)

这是响应式设计的核心属性，决定了图片如何适应容器大小。

| 属性值 | 描述 | 场景 | 缺陷 |
| :--- | :--- | :--- | :--- |
| **`cover`** | **覆盖**。等比例缩放图片，确保**完全覆盖**容器。 | 全屏背景、Hero Banner。 | 图片的边缘部分可能会被裁切掉（看不见）。 |
| **`contain`** | **包含**。等比例缩放图片，确保图片**完整显示**。 | Logo 展示、不想被裁切的产品图。 | 容器内可能会留出空白区域。 |
| `auto` | **默认**。保持图片原始尺寸。 | 小图标、平铺纹理。 | 大图会溢出，小图会留白。 |
| `100% 100%` | **拉伸**。强制填满容器。 | 渐变背景。 | **图片会变形**（变扁或变瘦）。 |

### 1.2 背景定位 (`background-position`)

决定图片在容器中的位置。支持像素、百分比和关键字。

*   **关键字**: `top`, `bottom`, `left`, `right`, `center`.
*   **百分比**: `50% 50%` (居中)。
*   **混合写法**: `right 20px bottom 20px` (距离右下角各 20px，现代浏览器支持)。

**Sprite (雪碧图) 原理**：
利用负值定位（如 `background-position: -50px -100px`）来显示大图中的某一个小图标。

### 1.3 背景原点 (`background-origin`)

决定背景图片从哪里开始绘制（(0,0) 坐标在哪里）。

*   **`padding-box` (默认)**: 从 Padding 左上角开始绘制（不会被 border 遮挡，但也不会延伸到 border 下面）。
*   **`border-box`**: 从 Border 左上角开始绘制（背景图会延伸到边框底下）。
*   **`content-box`**: 从内容区域开始绘制（背景图只在内容区显示，Padding 区域是空的）。

### 1.4 背景裁剪 (`background-clip`)

决定背景（颜色或图片）显示在哪个区域，超出区域的部分被剪掉。

*   **`border-box` (默认)**: 背景延伸到边框最外侧。
*   **`padding-box`**: 背景延伸到 padding 外侧，不包括边框。
*   **`content-box`**: 背景只在内容区显示。
*   **`text`**: **黑科技**。背景被裁剪成文字的形状（实现**文字渐变**的核心）。

## 2. 高级技巧：多重背景 (Multiple Backgrounds)

CSS 允许在一个元素上设置多层背景。越前面的层级越高（类似 Photoshop 图层：第一张图在最上面）。

**语法**：用逗号分隔每组属性。

```css
.card {
  background-image: 
    linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), /* 第一层：半透明遮罩 */
    url('icon.png'),                                   /* 第二层：小图标 */
    url('photo.jpg');                                  /* 第三层：底图 */
    
  background-position: 
    0 0,               /* 遮罩位置 */
    center center,     /* 图标居中 */
    center;            /* 底图居中 */
    
  background-repeat: no-repeat;
}
```

**简写技巧**：
```css
background: 
  url(icon.png) center / 50px no-repeat, /* 这一层的所有属性写在一起 */
  url(photo.jpg) center / cover no-repeat;
```

---

## 3. 常见问题 (FAQ) 与 避坑指南

### Q1: 怎么实现背景图片的“视差滚动”效果 (Parallax)？
**传统方案**：`background-attachment: fixed;`
这会让背景图片固定在视口（浏览器窗口）上，而不是随元素滚动。
```css
.parallax {
  background-image: url('bg.jpg');
  background-attachment: fixed; /* 核心 */
  background-size: cover;
}
```
**⚠️ 移动端大坑**：iOS Safari 对 `background-attachment: fixed` 的支持非常差（可能会失效，或导致严重的滚动卡顿）。

**现代推荐方案**：使用 `position: fixed` 的伪元素或 `transform: translateZ` 硬件加速来实现视差。

### Q2: 为什么我的背景图片在手机上模糊了？
**原因**：这是“Retina 屏幕（高分屏）”的问题。如果你的图片只有 100px 宽，但在 2x 屏上显示为 100px（实际物理像素是 200px），就会被拉伸模糊。

**解法**：准备一张 **2倍大** 的图片（如 200px），然后通过 CSS 把它压缩回去。
```css
.icon {
  width: 100px;
  background-image: url('icon@2x.png'); /* 这张图实际宽 200px */
  background-size: 100px auto; /* 强制压缩显示为 100px */
}
```

### Q3: 如何让背景图适应容器高度，而不是宽度？
通常 `background-size: cover` 会优先保证铺满，可能会裁掉上下或左右。
如果你想**基于高度**缩放（比如做一个横向滚动的画廊）：
```css
background-size: auto 100%; /* 宽度自动，高度撑满 */
```

### Q4: 边框是虚线，为什么看不到背景色透出来？
**原因**：默认 `background-clip` 是 `border-box`。背景色会一直延伸到边框下面。如果是实线边框你看不见，但如果是虚线边框，你会发现虚线之间的空隙是背景色，而不是父容器的颜色。

**解法**：将背景裁剪到 padding 区域。
```css
.dashed-box {
  border: 5px dashed #000;
  background-color: yellow;
  background-clip: padding-box; /* 关键：背景不延伸到边框 */
}
```

### Q5: `background-blend-mode` 是什么？
这是 CSS 的**图层混合模式**（类似 PS）。允许背景图片和背景颜色进行混合。
```css
.tinted-image {
  background-image: url('bw-photo.jpg');
  background-color: red;
  background-blend-mode: multiply; /* 正片叠底：给黑白照片染上红色 */
}
```

### Q6: 为什么多重背景写在前面的反而看不见？
**检查顺序**。
多重背景中，**第一个**定义的图片在**最顶层**。
如果你把一张不透明的大图（底图）写在了第一个，它就会盖住后面所有的图。

**正确顺序**：`小图标/纹理` -> `遮罩渐变` -> `大底图`。