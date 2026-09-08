---
outline: [2, 3]
---

# 表格布局 (Table Layout)

在 CSS 领域，“**表格布局**”通常指两个截然不同的概念：

- **原生表格样式化**：如何美化 HTML `<table>` 标签，用于展示数据。
- **模拟表格布局**：使用 `display: table` 系列属性，让 `div` 等元素像表格一样排版（在 Flexbox/Grid 诞生前，这是实现等高列和垂直居中的主要手段）。

## 1. 原生表格布局与样式化 (`<table>`)

处理数据报表、财务清单时必用。

### 1.1 核心属性：表格布局算法 (`table-layout`)

这是决定表格渲染性能和列宽表现的最关键属性。

| 属性值      | 描述            | 渲染机制                                                           | 优缺点                                                                             |
| :---------- | :-------------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **`auto`**  | **自动 (默认)** | 浏览器读取完**整个表格**内容后，计算每一列最宽的内容，再确定列宽。 | **优**: 内容不会溢出。<br>**缺**: 数据量大时**渲染极慢**；列宽会随内容跳动。       |
| **`fixed`** | **固定**        | 浏览器只看表格总宽度和**第一行**的宽度来决定列宽，无视后续内容。   | **优**: **渲染极快**；列宽可控；支持文本省略号。<br>**缺**: 内容过长会溢出单元格。 |

**最佳实践**：
在生产环境中，为了性能和可控性，**强烈建议**使用 `fixed`。

```css
table {
  width: 100%;
  table-layout: fixed;
}
```

![Logo](/img/tableFixed.png)

> `table-layout: fixed` 需要一个明确的表格宽度（如 `width: 100%`）才能体现「固定」的意义；否则浏览器无从分配列宽。列宽的来源依次是 `<col>` / `<colgroup>` 的声明、第一行单元格的宽度，最后才是均分。

### 1.2 边框模型 (`border-collapse`)

控制单元格边框的合并方式。

- **`separate` (默认)**: 单元格是分离的，有双线边框效果。
- **`collapse` (推荐)**: 单元格边框合并为一条线（类似 Excel）。

```css
table {
  /* 现代表格标配 */
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ccc;
}
```

![Logo](/img/tableCollapse.png)

```css
table {
  border-collapse: separate;
}
th,
td {
  border: 1px solid #ccc;
}
```

![Logo](/img/tableSeparate.png)

> 一旦用 `collapse`，`border-spacing` 和 `empty-cells` 这两个属性就**完全失效**了——它们只在 `separate` 下生效。

### 1.3 间距与位置

- **`border-spacing`**: 单元格之间的距离。**仅在** `border-collapse: separate` 时有效。
  - `border-spacing: 10px;` (水平垂直均为 10px)
  - `border-spacing: 10px 20px;` (水平 10px，垂直 20px)
- **`caption-side`**: 表格标题 `<caption>` 的位置。
  - `top` (默认)
  - `bottom` (置于表格下方)
- **`empty-cells`**: 是否显示空单元格的边框。**仅在** `border-collapse: separate` 时有效。
  - `show` (默认)
  - `hide` (隐藏，表格会出现“缺牙”)

```css
table {
  border-collapse: separate;
  border-spacing: 2px;
}

th,
td {
  border: 1px solid #ccc;
}
```

![Logo](/img/tableSpacing.png)

```css
table {
  border-collapse: collapse;
  caption-side: top;
}

th,
td {
  border: 1px solid #ccc;
}
```

![Logo](/img/tableCaption.png)

> `td` / `th` 天然支持 `vertical-align`（`top` / `middle` / `bottom` / `baseline`），用来做单元格内容的垂直对齐——这是普通块级元素做不到的。

### 1.4 列宽控制 (`<col>` / `<colgroup>`)

想精确控制每一列的宽度，可以用 `<colgroup>` + `<col>` 声明列宽，再配合 `table-layout: fixed` 让浏览器**严格遵循**：

```html
<table>
  <colgroup>
    <col style="width: 30%;" />
    <!-- 第一列 30% -->
    <col style="width: 120px;" />
    <!-- 第二列固定 120px -->
    <col />
    <!-- 剩余空间均分 -->
  </colgroup>
  <tr>
    <td>姓名</td>
    <td>分数</td>
    <td>备注</td>
  </tr>
</table>
```

```css
table {
  width: 100%;
  table-layout: fixed; /* 关键：配合 fixed，<col> 的宽度才会被严格遵循 */
}
```

> 在 `table-layout: auto` 下，`<col>` 的宽度只是「参考值」，某列内容更宽时仍会被撑开；只有 `fixed` 才会**严格按声明**来。

## 2. CSS 模拟表格布局 (`display: table`)

利用 CSS 属性让非表格元素（如 `div`）拥有表格的特性。

### 2.1 属性映射表

| HTML 标签       | CSS 对应属性                  | 作用             |
| :-------------- | :---------------------------- | :--------------- |
| `<table>`       | **`display: table`**          | 定义块级表格容器 |
| `<tr>`          | **`display: table-row`**      | 定义表格行       |
| `<td>` / `<th>` | **`display: table-cell`**     | 定义单元格       |
| `<thead>`       | `display: table-header-group` | 表头组           |
| `<tbody>`       | `display: table-row-group`    | 表体组           |
| `<tfoot>`       | `display: table-footer-group` | 表脚组           |
| `<colgroup>`    | `display: table-column-group` | 列组             |
| `<col>`         | `display: table-column`       | 列               |
| `<caption>`     | `display: table-caption`      | 表格标题         |

### 2.2 经典应用场景

虽然 Flexbox 是主流，但在某些场景（如**HTML 邮件模板**、**兼容极老旧浏览器**、**动态内容等高**）下，`display: table` 依然有用。

#### 2.2.1 垂直居中 (Vertical Centering)

`table-cell` 是唯一支持 `vertical-align: middle` 真正生效的块级环境。

```css
.parent {
  display: table;
  height: 300px;
}
.child {
  display: table-cell;
  vertical-align: middle; /* 内容完美垂直居中 */
  text-align: center; /* 水平居中 */
}
```

#### 2.2.2 多列等高布局 (Equal Height Columns)

同一行内的 `table-cell` 无论内容多少，高度永远自动保持一致。

```css
.row {
  display: table;
  width: 100%;
}
.col-left,
.col-right {
  display: table-cell;
  /* 不需要写 height: 100%，它们自动等高 */
}
```

## 3. 常见问题 (FAQ) 与 解决方案

### 3.1 表格里的文字怎么实现“单行省略号” (`...`)？

**这是表格布局最常见的大坑**。如果只写 `text-overflow: ellipsis` 是无效的。
**必须满足 4 个条件**：

```css
table {
  width: 100%;
  table-layout: fixed; /* 1. 关键 */
}

td.truncate {
  white-space: nowrap; /* 2 */
  overflow: hidden; /* 3 */
  text-overflow: ellipsis; /* 4 */
}
```

### 3.2 `margin` 对 `tr` 和 `td` 无效？

是的。

- 表格行 (`tr`) 和单元格 (`td`) **不支持** `margin` 属性。
- 如果想增加单元格内容的间距，请使用 `padding`。
- 如果想增加单元格之间的间距，请使用 `border-spacing` (需 `border-collapse: separate`)。

### 3.3 如何固定表头 (Sticky Header)？

让表格滚动时表头吸顶。

```css
th {
  position: sticky;
  top: 0;
  z-index: 2; /* 防止被内容遮挡 */
  background-color: #fff; /* 必须给表头加背景色，否则是透明的 */
}
```

### 3.4 `visibility: collapse` 在表格里的特殊表现？

- `display: none`: 彻底移除，不占空间，后面的行会补上来（表格结构可能重算）。
- `visibility: hidden`: 隐藏内容，但保留空白占位。
- **`visibility: collapse`**: 专为表格设计。隐藏该行，且**不保留**高度（像 display: none），但**不触发**表格列宽的重新计算（性能更好）。

### 3.5 如何给表格做斑马纹 (Zebra Striping)？

用 `nth-child` 给奇偶行上不同背景色，提升可读性。注意要配合 `table-layout: fixed` 或把背景加在 `tr` 上，避免 `border-collapse` 影响：

```css
tbody tr:nth-child(even) {
  background-color: #f7f8fa;
}
/* 悬停高亮 */
tbody tr:hover {
  background-color: #eef1f6;
}
```

### 3.6 什么时候用 `display: table`？

`display: table` 是「历史遗留的布局技巧」，如今多数场景已被 Flex/Grid 取代。它仅在这几类场景仍占优势：

- **HTML 邮件模板**：邮件客户端对 Flex/Grid 支持差，`table` 兼容性最好。
- **等高列 + 垂直居中**：`table-cell` 一行代码天然实现，无需额外处理。
- **语义数据**：本身就是表格数据时，直接用 `<table>`，不要硬套 Flex/Grid。
