# 多列布局 (CSS Multi-column Layout)

CSS Multi-column 模块的核心逻辑是将一个容器内的内容（文本、图片等）自动拆分到多列中，就像报纸排版一样。

## 一. 容器属性 API (Container Properties)

这些属性必须设置在**父容器**上。

### 1.1 定义列的核心属性

| 属性 | 语法 / 示例 | 详细逻辑 |
| :--- | :--- | :--- |
| **`column-count`** | `<integer> \| auto`<br>`column-count: 3;` | **强制分列数**。<br>浏览器会根据容器宽度自动计算每一列的宽度。<br>如果不指定宽度，列宽会随容器伸缩。 |
| **`column-width`** | `<length> \| auto`<br>`column-width: 200px;` | **理想（最小）列宽**。<br>浏览器会计算：`容器宽 / 200px` 能放下几列？<br>例如容器 500px，设为 200px，则显示 2 列（每列 250px），剩余空间均分。 |
| **`columns`** | `[width] \|\| [count]`<br>`columns: 3 200px;` | **简写属性**。<br>表示：**“最多 3 列，且每一列不能小于 200px”**。<br>这是一个非常灵活的响应式写法。 |

![Logo](/multiColumnFirst.png)

### 1.2 样式与间距

| 属性 | 语法 / 示例 | 详细逻辑 |
| :--- | :--- | :--- |
| **`column-gap`** | `<length> \| normal`<br>`column-gap: 20px;` | **列间距**。<br>默认值 `normal` 通常等于 `1em`。<br>支持 `px`, `%`, `em` 等。 |
| **`column-rule`** | `width style color`<br>`column-rule: 1px solid #ccc;` | **列分割线**。<br>语法完全等同于 `border`。<br>**注意**：分割线绘制在 Gap 中间，**不占据任何布局空间**。 |

![Logo](/multiColumnSecond.png)

### 1.3 填充模式 (高级)

| 属性 | 值 | 描述 |
| :--- | :--- | :--- |
| **`column-fill`** | **`balance`** (默认) | **平衡填充**。<br>浏览器会尽力保证所有列的高度一致。适合文章阅读。 |
| | `auto` | **顺序填充**。<br>先填满第一列（需容器有高度限制），再填第二列。**适合做瀑布流**。 |

## 二. 子元素属性 API (Item Properties)

这些属性设置在多列容器内部的**子元素**（如 `h2`, `p`, `.card`）上。

### 2.1 跨列 (Spanning)

| 属性 | 值 | 描述 |
| :--- | :--- | :--- |
| **`column-span`** | `none` (默认) | 元素仅在自己的列宽内显示。 |
| | **`all`** | **横跨所有列**。<br>通常用于标题。元素会截断内容流，该元素之前的内容在上方平衡分列，之后的内容在下方重新分列。 |

![Logo](/multiColumnThird.png)

### 2.2 断裂控制 (Fragmentation)

控制元素如何在列之间分割（防止图片被切成两半）。

| 属性 | 值 | 描述 |
| :--- | :--- | :--- |
| **`break-inside`** | `auto` (默认) | 允许在元素内部断开。 |
| | **`avoid`** | **禁止断开**。<br>保持元素完整性。做瀑布流卡片时**必加**。 |
| `break-before` | `column` | 强制该元素位于新的一列的顶端。 |
| `break-after` | `column` | 强制该元素之后开启新的一列。 |

> **兼容性提示**：为了兼容旧版浏览器（如老 Webkit），建议同时加上 `-webkit-column-break-inside: avoid;` 和 `page-break-inside: avoid;`。

## 三. 常见问题 (FAQ) 与 故障排除

### Q1: 瀑布流的卡片被“腰斩”（切成两半）怎么办？
**现象**：一张卡片的上半部分在第一列底部，下半部分在第二列顶部。

**原因**：浏览器默认允许内容为了填满列而在任意位置断开。

**解决方案**：
```css
.card {
  break-inside: avoid; /* 标准 */
  -webkit-column-break-inside: avoid; /* Chrome/Safari 旧版 */
  page-break-inside: avoid; /* Firefox 旧版 */
  
  /* 有时候加上这个能解决极个别渲染 bug */
  display: inline-block; 
  width: 100%;
}
```

### Q2: 瀑布流顶部有莫名其妙的空白？
**现象**：第一列或某一列的第一个元素，并没有顶格对齐，而是往下掉了一点。

**原因**：**Margin Collapse (外边距合并)**。子元素的 `margin-top` 穿透了父容器，或者因为分列计算导致基线对齐异常。

**解决方案**：
1.  **推荐**：给父容器触发 BFC。
    ```css
    .container { overflow: hidden; }
    ```
2.  将子元素的 `margin` 改为 `padding`。

### Q3: `column-span: all` 导致下面的内容错乱？
**限制**：`column-span: all` 的元素必须是**块级元素**，且它是文档流的一部分。
如果在该元素之前的列填充高度计算出现小数点误差，可能会导致视觉上的错位。

**注意**：`column-span` 不能被包含在另一个块级上下文中（例如，如果父容器是 `display: flex`，里面的子元素再用 `column-span` 可能会失效）。

### Q4: 为什么设置了 `column-count: 3` 但只显示了 1 列？
**原因**：容器宽度太窄了。
如果你同时设置了 `column-width` 和 `column-count`（或者使用了 `columns` 简写），`column-width` 的优先级其实是作为一个“下限”存在的。

**逻辑**：如果 `容器宽度 / 3` 小于 `column-width` 设定的最小值，浏览器就会减少列数，以保证每列的宽度足够。

### Q5: 怎么给每一列添加背景色？
**做不到**。
CSS Multi-column 无法直接给“列”这个概念添加背景。内容是流动的，并没有物理上的“第一列 DOM 元素”。

**替代方案**：只能给**子元素**添加背景，或者给父容器加一个条纹背景图 (`linear-gradient`) 来模拟列背景。

### Q6: 阴影 (`box-shadow`) 被切断了？
**现象**：卡片右侧有阴影，但在列的边缘被切掉了。

**原因**：多列容器默认的裁剪行为。

**解决方案**：给卡片留出 margin，不要让阴影紧贴列的边缘；或者给容器加 `padding`。

---

# 4. 代码速查表：最佳实践配置

如果要实现一个**兼容性好、不切图、不留白**的瀑布流布局，请直接复制以下代码：

```css
/* 父容器 */
.masonry-container {
  /* 响应式设置：每列至少 250px，最多分 4 列 */
  columns: 4 250px; 
  
  /* 列间距 */
  column-gap: 20px;
  
  /* 可选：防止顶部空白 Bug */
  overflow: hidden; 
}

/* 子元素 (卡片) */
.item {
  /* 必须占满列宽 */
  width: 100%;
  
  /* 关键：防止被切断 */
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  
  /* 间距：只能用 bottom，不要用 margin-top 以免塌陷 */
  margin-bottom: 20px;
}
```