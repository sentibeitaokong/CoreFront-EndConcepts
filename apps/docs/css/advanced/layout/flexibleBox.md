# Flex 布局教程

Flexbox（弹性盒子布局）的核心在于“**弹性**”二字：它可以让容器内的子元素自动调整宽度、高度和顺序，以最好地填充可用空间。

## 1. Flex 布局是什么？

Flex 是 **Flexible Box** 的缩写，意为"**弹性布局**"，用来为盒状模型提供最大的灵活性。

任何一个容器都可以指定为 Flex 布局。

```css
.box {
  display: flex;
}
```

行内元素也可以使用 Flex 布局。

```css
.box {
  display: inline-flex;
}
```

Webkit 内核的浏览器，必须加上`-webkit`前缀。

```css
.box {
  display: -webkit-flex; /* Safari */
  display: flex;
}
```

> **注意**：设为 Flex 布局以后，子元素的`float`、`clear`和`vertical-align`属性将失效。

## 2. 基本概念

采用 Flex 布局的元素，称为 **Flex 容器（flex container）**，简称"**容器**"。它的所有子元素自动成为容器成员，称为 **Flex 项目（flex item）**，简称"**项目**"。

![Logo](/img/flexBase.png)

- **轴线**：容器默认存在两根轴。
  - **主轴（main axis）**：水平方向。
  - **交叉轴（cross axis）**：垂直方向。
- **位置**：
  - 主轴的开始位置叫做 `main start`，结束位置叫做 `main end`。
  - 交叉轴的开始位置叫做 `cross start`，结束位置叫做 `cross end`。
- **排列**：项目默认沿主轴排列。
- **尺寸**：单个项目占据的主轴空间叫做 `main size`，占据的交叉轴空间叫做 `cross size`。

## 3. 容器的属性

### 3.1 flex-direction 属性

`flex-direction`属性决定主轴的方向（即项目的排列方向）。

```css
.box {
  flex-direction: row | row-reverse | column | column-reverse;
}
```

![Logo](/img/flexDirection.png)

- `row`（默认值）：主轴为水平方向，起点在左端。
- `row-reverse`：主轴为水平方向，起点在右端。
- `column`：主轴为垂直方向，起点在上沿。
- `column-reverse`：主轴为垂直方向，起点在下沿。

### 3.2 flex-wrap 属性

默认情况下，项目都排在一条线（又称"**轴线**"）上。`flex-wrap`属性定义，如果一条轴线排不下，如何换行。

```css
.box {
  flex-wrap: nowrap | wrap | wrap-reverse;
}
```

![Logo](/img/flexWrap.png)

- `nowrap`（默认）：不换行。

  ![Logo](/img/nowrap.png)

- `wrap`：换行，第一行在上方。

  ![Logo](/img/wrap.jpg)

- `wrap-reverse`：换行，第一行在下方。

  ![Logo](/img/wrapReverse.jpg)

### 3.3 flex-flow 属性

`flex-flow`属性是`flex-direction`属性和`flex-wrap`属性的简写形式，默认值为`row nowrap`。

```css
.box {
  flex-flow: <flex-direction> || <flex-wrap>;
}
```

### 3.4 justify-content 属性

`justify-content`属性定义了项目在**主轴**上的对齐方式。

```css
.box {
  justify-content: flex-start | flex-end | center | space-between | space-around;
}
```

![Logo](/img/justifyContent.png)

### 3.5 align-items 属性

`align-items`属性定义项目在**交叉轴**上如何对齐。

```css
.box {
  align-items: flex-start | flex-end | center | baseline | stretch;
}
```

![Logo](/img/alignItems.png)

### 3.6 align-content 属性

`align-content`属性定义了**多根轴线**的对齐方式。如果项目只有一根轴线，该属性不起作用。

```css
.box {
  align-content: flex-start | flex-end | center | space-between | space-around |
    stretch;
}
```

![Logo](/img/alignContent.png)

### 3.7 容器属性速查表

| 属性                  | 作用                                | 默认值       | 可选值                                                                                   |
| :-------------------- | :---------------------------------- | :----------- | :--------------------------------------------------------------------------------------- |
| **`flex-direction`**  | 决定**主轴方向**（项目排列方向）    | `row`        | `row` \| `row-reverse` \| `column` \| `column-reverse`                                   |
| **`flex-wrap`**       | 一条轴线排不下时是否**换行**        | `nowrap`     | `nowrap` \| `wrap` \| `wrap-reverse`                                                     |
| **`flex-flow`**       | `flex-direction` + `flex-wrap` 简写 | `row nowrap` | `<flex-direction> \|\| <flex-wrap>`                                                      |
| **`justify-content`** | 项目在**主轴**上的对齐方式          | `flex-start` | `flex-start` \| `flex-end` \| `center` \| `space-between` \| `space-around`              |
| **`align-items`**     | 项目在**交叉轴**上的对齐方式        | `stretch`    | `flex-start` \| `flex-end` \| `center` \| `baseline` \| `stretch`                        |
| **`align-content`**   | **多根轴线**的对齐方式（多行时）    | `stretch`    | `flex-start` \| `flex-end` \| `center` \| `space-between` \| `space-around` \| `stretch` |

## 4. 项目的属性

### 4.1 order 属性

`order`属性定义项目的排列顺序。数值越小，排列越靠前，默认为 0。

```css
.item {
  order: <integer>;
}
```

![Logo](/img/order.png)

### 4.2 flex-grow 属性

`flex-grow`属性定义项目的放大比例，默认为`0`，即如果存在剩余空间，也不放大。

```css
.item {
  flex-grow: <number>; /* default 0 */
}
```

![Logo](/img/flexGrow.png)

- 如果所有项目的`flex-grow`属性都为 1，则它们将等分剩余空间（如果有的话）。
- 如果一个项目的`flex-grow`属性为 2，其他项目都为 1，则前者占据的剩余空间将比其他项多一倍。

### 4.3 flex-shrink 属性(不换行才有效)

`flex-shrink`属性定义了项目的缩小比例，默认为 1，即如果空间不足，该项目将缩小。

```css
.item {
  flex-shrink: <number>; /* default 1 */
}
```

![Logo](/img/flexShrink.jpg)

- 如果所有项目的`flex-shrink`属性都为 1，当空间不足时，都将等比例缩小。
- 如果一个项目的`flex-shrink`属性为 0，其他项目都为 1，则空间不足时，前者不缩小。
- 负值对该属性无效。

### 4.4 flex-basis 属性

`flex-basis`属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为`auto`，即项目的本来大小。

```css
.item {
  flex-basis: <length> | auto; /* default auto */
}
```

它可以设为跟`width`或`height`属性一样的值（比如 350px），则项目将占据固定空间。

### 4.5 flex 属性

`flex`属性是`flex-grow`, `flex-shrink` 和 `flex-basis`的简写，默认值为`0 1 auto`。后两个属性可选。

```css
.item {
  flex: none | [ < 'flex-grow' > < 'flex-shrink' >? || < 'flex-basis' >];
}
```

该属性有两个快捷值：

- **`flex: 1:`** 代表 1 1 0%。含义：自动填满剩余空间。

- **`flex: auto:`** 代表 1 1 auto。含义：根据内容自动调整，且会放大缩小。

- **`flex: none:`** 代表 0 0 auto。含义：固定大小，不放大也不缩小。

> **建议**：优先使用这个属性，而不是单独写三个分离的属性，因为浏览器会推算相关值。

### 4.6 align-self 属性

`align-self`属性允许单个项目有与其他项目不一样的对齐方式，可覆盖`align-items`属性。默认值为`auto`，表示继承父元素的`align-items`属性，如果没有父元素，则等同于`stretch`。

```css
.item {
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
```

![Logo](/img/alignSelf.png)

### 4.7 项目属性速查表

| 属性              | 作用                             | 默认值     | 可选值                                                                      |
| :---------------- | :------------------------------- | :--------- | :-------------------------------------------------------------------------- |
| **`order`**       | 项目排列顺序（数值越小越靠前）   | `0`        | `<integer>`                                                                 |
| **`flex-grow`**   | 放大比例（有剩余空间时）         | `0`        | `<number>`                                                                  |
| **`flex-shrink`** | 缩小比例（空间不足时）           | `1`        | `<number>`                                                                  |
| **`flex-basis`**  | 分配多余空间前的主轴尺寸         | `auto`     | `<length>` \| `auto`                                                        |
| **`flex`**        | `grow` + `shrink` + `basis` 简写 | `0 1 auto` | `none` \| `<flex-grow> <flex-shrink>? \|\| <flex-basis>`                    |
| **`align-self`**  | 单个项目覆盖 `align-items`       | `auto`     | `auto` \| `flex-start` \| `flex-end` \| `center` \| `baseline` \| `stretch` |

## 5. 常见问题 (FAQ) 与 故障排除

### 5.1 `justify-content` 和 `align-items` 有什么区别？

**一句话**：`justify-content` 管**主轴**，`align-items` 管**交叉轴**。

- 默认（`flex-direction: row`）下，主轴是水平方向：`justify-content` 控制左右分布，`align-items` 控制上下对齐。
- 一旦改成 `flex-direction: column`，主轴变成垂直方向，两者的作用方向**互换**。

### 5.2 为什么 `flex-grow` 设置了却不见元素变大？

**原因**：`flex-grow` 只分配**剩余空间**。如果父容器没有多余空间（内容已撑满，或项目 `flex-basis` / 宽度已占满），自然没有可分配的空间。

**排查**：

- 确认父容器宽度大于所有项目 `flex-basis` 之和。
- 确认项目没有被 `width` 或 `flex-basis` 写死。

### 5.3 为什么设置了 `align-content` 却看不到任何效果？

**原因**：`align-content` 只对**多根轴线**（即发生了换行）起作用。只有一根轴线时，该属性完全无效。

**解决**：确认同时设置了 `flex-wrap: wrap`，并且项目确实换成了多行。

### 5.4 图片 / 长文本把 Flex 布局撑爆了怎么办？

**现象**：图片或超长英文单词溢出容器，出现横向滚动条。

**原因**：Flex 项目的默认 `min-width` 是 `auto`，内容再宽也不会缩小到内容宽度以下。

```css
.item {
  min-width: 0; /* 关键：允许项目缩小到内容宽度以下 */
}
/* 或对图片 */
img {
  max-width: 100%;
}
```

### 5.5 为什么子元素 `float`、`clear`、`vertical-align` 失效了？

**原因**：容器设为 `display: flex` 后，子元素都变成了 Flex 项目，这些传统排版属性对 Flex 项目**不再生效**。

**解决**：改用 Flex 自己的对齐属性（`justify-content`、`align-items`、`align-self`、`order` 等）。
