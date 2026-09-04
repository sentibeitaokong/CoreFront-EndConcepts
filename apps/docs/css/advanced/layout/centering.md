# 居中方案 (Centering)

「居中」是 CSS 面试和日常开发中出镜率最高的问题之一。它没有「唯一正解」，而是根据**元素是否已知宽高、是否脱离文档流、使用哪种布局系统**，衍生出一整套方法论。

**一句话理解**：**「居中 = 把元素放到容器的『几何中心』，方案取决于容器用 block / flex / grid / table / 定位系统。」**

## 1. 水平居中

### 1.1 行内/文本内容：`text-align`

适用于行内元素、文字、`inline-block`：

```css
.parent {
  text-align: center;
}
```

**原理**：`text-align` 控制的是**行内内容**在行框内的对齐。它只对 `inline`/`inline-block`/文本生效，**对块级子元素无效**。

### 1.2 定宽块级元素：`margin: auto`

适用于有固定宽度的块级元素（`width` 必须小于父容器）：

```css
.box {
  width: 300px;
  margin: 0 auto; /* 左右 margin 均分剩余空间 */
}
```

**原理**：块级元素在「可用空间」内，`margin-left/right: auto` 会均分剩余空间，从而居中。**前提是元素有确定的 `width`**，否则 `width` 撑满容器，无剩余空间可分。

### 1.3 不定宽块级元素：`fit-content` + `margin: auto`

若元素宽度由内容决定（不定宽），可用 `fit-content`：

```css
.box {
  width: fit-content; /* 宽度收缩到内容 */
  margin: 0 auto;
}
```

### 1.4 Flexbox

```css
.parent {
  display: flex;
  justify-content: center;
}
```

### 1.5 Grid

```css
.parent {
  display: grid;
  justify-content: center;
}
/* 或： */
.parent {
  display: grid;
  justify-items: center;
}
```

### 1.6 定位 + Transform（适用于绝对定位元素）

```css
.box {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
```

## 2. 垂直居中

### 2.1 单行文本：`line-height`

让行高等于容器高度，文字自动垂直居中（依赖 IFC 的行框机制）：

```css
.box {
  height: 40px;
  line-height: 40px;
}
```

**原理**：文字在行框中默认基于中轴线对称分布，`line-height` 等于 `height` 时，行框撑满容器，文字自然居中。**仅适用于单行文本**。

### 2.2 表格单元格：`vertical-align` + `display: table-cell`

```css
.parent {
  display: table-cell;
  vertical-align: middle;
  height: 200px;
}
```

`vertical-align` 只对 `table-cell` 和 `inline`/`inline-block` 元素生效，是「老牌」垂直居中方案。

### 2.3 Flexbox（现代首选）

```css
.parent {
  display: flex;
  align-items: center;
}
```

### 2.4 Grid

```css
.parent {
  display: grid;
  align-items: center;
}
/* 或： */
.parent {
  display: grid;
  align-content: center;
}
```

### 2.5 定位 + Transform

```css
.box {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```

## 3. 水平垂直居中（汇总）

这是面试最常问的组合拳，核心方案如下：

| 方案                         | 代码核心                                                                | 适用场景                               |
| ---------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| **Flexbox**                  | `display:flex; justify-content:center; align-items:center;`             | 现代首选，无需知道子元素尺寸           |
| **Grid**                     | `display:grid; place-items:center;`                                     | 现代首选，一行搞定                     |
| **绝对定位 + Transform**     | `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);` | 子元素脱离文档流、需覆盖在其他元素之上 |
| **绝对定位 + margin:auto**   | `position:absolute; inset:0; margin:auto; width/height 固定`            | 已知子元素宽高，希望更「原生」         |
| **line-height + text-align** | `line-height = height; text-align:center;`                              | 仅单行文本                             |
| **table-cell**               | `display:table-cell; vertical-align:middle; text-align:center;`         | 兼容老浏览器（IE8+）                   |

### 3.1 Flexbox 方案

```css
.parent {
  display: flex;
  justify-content: center; /* 主轴（水平）居中 */
  align-items: center; /* 交叉轴（垂直）居中 */
}
```

### 3.2 Grid 方案（最简洁）

```css
.parent {
  display: grid;
  place-items: center; /* align-items + justify-items 的简写 */
}
```

### 3.3 绝对定位 + Transform（最通用）

```css
.box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 回移自身宽高的一半 */
}
```

### 3.4 绝对定位 + margin:auto

```css
.box {
  position: absolute;
  inset: 0; /* top/right/bottom/left 全设为 0 */
  margin: auto; /* 浏览器自动均分剩余空间 */
  width: 300px;
  height: 200px; /* 必须显式指定宽高 */
}
```

### 3.5 table-cell（兼容方案）

```css
.parent {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  width: 400px;
  height: 300px;
}
```

## 4. 各方案优缺点对比

| 方案                     | 需知子元素尺寸 | 兼容性 | 是否脱离文档流 | 备注             |
| ------------------------ | -------------- | ------ | -------------- | ---------------- |
| Flexbox                  | ❌ 否          | 现代   | ❌ 否          | 最推荐，语义清晰 |
| Grid                     | ❌ 否          | 现代   | ❌ 否          | 代码最短         |
| 绝对定位 + Transform     | ❌ 否          | 现代   | ✅ 是          | 覆盖型弹窗首选   |
| 绝对定位 + margin:auto   | ✅ 是          | 现代   | ✅ 是          | 需固定宽高       |
| line-height + text-align | ✅ 是（单行）  | 全兼容 | ❌ 否          | 仅文本           |
| table-cell               | ❌ 否          | 全兼容 | ❌ 否          | 老项目兼容       |

## 5. 方案选型建议

| 场景                             | 推荐方案                                 |
| -------------------------------- | ---------------------------------------- |
| 子元素尺寸未知、常规布局         | **Flexbox** 或 **Grid**                  |
| 弹窗/遮罩层，需覆盖内容之上      | **绝对定位 + Transform**（配合 `fixed`） |
| 已知宽高、希望代码更「老派」可读 | **绝对定位 + margin:auto**               |
| 单行文本                         | **line-height**                          |
| 需要兼容 IE8                     | **table-cell**                           |

## 6. 常见问题 (FAQ)

### 6.1 `transform: translate(-50%, -50%)` 为什么能精确居中？

因为 `translate` 的百分比是**相对于元素自身尺寸**计算的，而 `top/left: 50%` 是相对于包含块。先用 `50%` 把元素左上角对齐到中心，再用 `translate(-50%,-50%)` 把元素自身的一半宽高往回拉，两者叠加即「几何中心重合」。

### 6.2 为什么 `margin: auto` 在垂直方向不生效？

在**普通文档流**中，块级元素的垂直 `margin: auto` 会被计算为 `0`，只有水平方向才生效。要让它垂直也生效，元素必须是 `flex`/`grid` 子项，或绝对定位（`position: absolute`）。

### 6.3 内联元素用 `text-align` 为什么有时不居中？

`text-align` 只能控制**父容器内**的行内内容。若子元素是块级元素，`text-align` 不会让它居中，需用 `margin: auto` 或 flex/grid 方案。

### 6.4 `align-items` 和 `align-content` 有什么区别？

- `align-items`：控制**单行**内子项在交叉轴上的对齐。
- `align-content`：控制**多行**（flex 换行、grid 多轨）时，行与行之间在交叉轴的分布。
- 只有一行时 `align-content` 往往看不出效果，多行时才体现。

### 6.5 `place-items` 和 `place-content` 是什么？

`place-*` 是 `align-*` 与 `justify-*` 的简写：

- `place-items: center` = `align-items: center; justify-items: center;`
- `place-content: center` = `align-content: center; justify-content: center;`

## 7. 总结

- 常规布局用 **Flex/Grid**，覆盖型弹窗用 **绝对定位 + Transform**。
- 记住两个「百分比」铁律：`top/left` 相对包含块，`translate` 相对自身。
- `margin: auto` 垂直居中只对 flex/grid/绝对定位生效。
- 选方案看三点：是否已知尺寸、是否要脱离文档流、兼容性要求。
