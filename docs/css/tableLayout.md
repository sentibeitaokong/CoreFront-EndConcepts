# 表格布局 (Table Layout)

在 CSS 领域，“表格布局”通常指两个截然不同的概念：
1.  **原生表格样式化**：如何美化 HTML `<table`> 标签，用于展示数据。
2.  **模拟表格布局**：使用 `display: table` 系列属性，让 `div` 等元素像表格一样排版（在 Flexbox/Grid 诞生前，这是实现等高列和垂直居中的主要手段）。


## 一、原生表格布局与样式化 (`<table>`)

处理数据报表、财务清单时必用。

### 1. 核心属性：表格布局算法 (`table-layout`)

这是决定表格渲染性能和列宽表现的最关键属性。

| 属性值 | 描述 | 渲染机制 | 优缺点 |
| :--- | :--- | :--- | :--- |
| **`auto`** | **自动 (默认)** | 浏览器读取完**整个表格**内容后，计算每一列最宽的内容，再确定列宽。 | **优**: 内容不会溢出。<br>**缺**: 数据量大时**渲染极慢**；列宽会随内容跳动。 |
| **`fixed`** | **固定** | 浏览器只看表格总宽度和**第一行**的宽度来决定列宽，无视后续内容。 | **优**: **渲染极快**；列宽可控；支持文本省略号。<br>**缺**: 内容过长会溢出单元格。 |

**🚀 最佳实践**：
在生产环境中，为了性能和可控性，**强烈建议**使用 `fixed`。
```css
table {
  width: 100%;
  table-layout: fixed;
}
```

### 2. 边框模型 (`border-collapse`)

控制单元格边框的合并方式。

*   **`separate` (默认)**: 单元格是分离的，有双线边框效果。
*   **`collapse` (推荐)**: 单元格边框合并为一条线（类似 Excel）。

```css
table {
  /* 现代表格标配 */
  border-collapse: collapse; 
}
th, td {
  border: 1px solid #ccc;
}
```

### 3. 间距与位置

*   **`border-spacing`**: 单元格之间的距离。**仅在** `border-collapse: separate` 时有效。
    *   `border-spacing: 10px;` (水平垂直均为 10px)
    *   `border-spacing: 10px 20px;` (水平 10px，垂直 20px)
*   **`caption-side`**: 表格标题 `<caption>` 的位置。
    *   `top` (默认)
    *   `bottom` (置于表格下方)
*   **`empty-cells`**: 是否显示空单元格的边框。
    *   `show` (默认)
    *   `hide` (隐藏，表格会出现“缺牙”)

## 二、CSS 模拟表格布局 (`display: table`)

利用 CSS 属性让非表格元素（如 `div`）拥有表格的特性。

### 1. 属性映射表

| HTML 标签 | CSS 对应属性 | 作用 |
| :--- | :--- | :--- |
| `<table>` | **`display: table`** | 定义块级表格容器 |
| `<tr>` | **`display: table-row`** | 定义表格行 |
| `<td>` / `<th>` | **`display: table-cell`** | 定义单元格 |
| `<thead>` | `display: table-header-group`| 表头组 |
| `<tfoot>` | `display: table-footer-group`| 表脚组 |
| `<caption>` | `display: table-caption` | 表格标题 |

### 2. 经典应用场景

虽然 Flexbox 是主流，但在某些场景（如**HTML 邮件模板**、**兼容极老旧浏览器**、**动态内容等高**）下，`display: table` 依然有用。

### A. 垂直居中 (Vertical Centering)
`table-cell` 是唯一支持 `vertical-align: middle` 真正生效的块级环境。
```css
.parent {
  display: table;
  height: 300px;
}
.child {
  display: table-cell;
  vertical-align: middle; /* 内容完美垂直居中 */
  text-align: center;     /* 水平居中 */
}
```

### B. 多列等高布局 (Equal Height Columns)
同一行内的 `table-cell` 无论内容多少，高度永远自动保持一致。
```css
.row {
  display: table;
  width: 100%;
}
.col-left, .col-right {
  display: table-cell;
  /* 不需要写 height: 100%，它们自动等高 */
}
```

## 三、常见问题 (FAQ) 与 解决方案

### Q1: 表格里的文字怎么实现“单行省略号” (`...`)？
**这是表格布局最常见的大坑**。如果只写 `text-overflow: ellipsis` 是无效的。
**必须满足 4 个条件**：
1.  表格必须是 `table-layout: fixed`。
2.  单元格要有宽度（或继承宽度）。
3.  `white-space: nowrap` (不换行)。
4.  `overflow: hidden`。

```css
table {
  width: 100%;
  table-layout: fixed; /* 1. 关键 */
}

td.truncate {
  white-space: nowrap;      /* 2 */
  overflow: hidden;         /* 3 */
  text-overflow: ellipsis;  /* 4 */
}
```

### Q2: 如何做响应式表格 (适配手机端)？
表格天生抗拒变窄。常用的两种方案：

**方案 A：容器横向滚动 (Scroll)**
简单粗暴，保留表格结构。
```css
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* iOS 顺滑滚动 */
}
```

**方案 B：卡片式重排 (Stacking)**
利用 Media Query 强制把 `td` 变成 `block`，像卡片一样堆叠。
```css
@media (max-width: 600px) {
  table, thead, tbody, th, td, tr {
    display: block; /* 强制破坏表格结构 */
  }
  thead { display: none; /* 隐藏表头 */ }
  td {
    position: relative;
    padding-left: 50%; /* 留出位置给标题 */
  }
  /* 利用伪元素显示标题 (需 HTML: <td data-label="姓名">) */
  td::before {
    content: attr(data-label);
    position: absolute;
    left: 10px;
    font-weight: bold;
  }
}
```

### Q3: `margin` 对 `tr` 和 `td` 无效？
是的。
*   表格行 (`tr`) 和单元格 (`td`) **不支持** `margin` 属性。
*   如果想增加单元格内容的间距，请使用 `padding`。
*   如果想增加单元格之间的间距，请使用 `border-spacing` (需 `border-collapse: separate`)。

### Q4: 如何固定表头 (Sticky Header)？
让表格滚动时表头吸顶。
```css
th {
  position: sticky;
  top: 0;
  z-index: 2; /* 防止被内容遮挡 */
  background-color: #fff; /* 必须给表头加背景色，否则是透明的 */
}
```
*注意：如果表格的父容器设置了 `overflow: hidden`，`sticky` 可能会失效。*

### Q5: `visibility: collapse` 在表格里的特殊表现？
*   `display: none`: 彻底移除，不占空间，后面的行会补上来（表格结构可能重算）。
*   `visibility: hidden`: 隐藏内容，但保留空白占位。
*   **`visibility: collapse`**: 专为表格设计。隐藏该行，且**不保留**高度（像 display: none），但**不触发**表格列宽的重新计算（性能更好）。