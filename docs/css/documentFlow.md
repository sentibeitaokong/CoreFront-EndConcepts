# 文档流
文档流是浏览器默认的排版引擎。理解文档流的物理规则，是解决所有 CSS 布局 Bug 的前提。当你觉得“CSS 不听话”时，通常是因为你不小心破坏了文档流，或者不理解它的隐形规则（如外边距合并、行高机制等）。


## 1. 布局基础：文档流与 Display 详解
理解文档流和 display 属性是掌握 CSS 布局的基石。
### 1.1 什么是“标准文档流” (Normal Document Flow)?

标准文档流（Normal Flow）是浏览器默认排列 HTML 元素的规则。如果你不写任何 CSS 布局代码（如 `float`, `position`, `flex`, `grid`），元素就会按照文档流进行排列。

**核心规则：**
1.  **从上到下**：块级元素（Block）会在垂直方向上一个接一个地排列。
2.  **从左到右**：行内元素（Inline）会在水平方向上从左向右排列，直到一行排满，自动换行到下一行。

###  1.2 Display 属性的核心模式

`display` 属性决定了元素在文档流中的行为方式（它是“块”还是“行内”？），以及它的子元素如何布局。

#### A. `display: block` (块级元素)

块级元素是页面结构的骨架。

*   **默认元素**：`<div>`, `<p>`, `<h1>`~`<h6>`, `<ul>`, `<li>`, `<section>`, `<article>` 等。
*   **行为特征**：
    1.  **独占一行**：无论内容多少，它总是强制换行，左右两边不允许有其他元素（除非使用浮动或 Flex）。
    2.  **填满容器**：默认宽度（`width`）自动填满父容器的 100%。
    3.  **支持盒模型**：你可以自由设置 `width`, `height`, `margin`, `padding`，它们都会生效并占据空间。

**代码示例：**
```css
.box {
  display: block;
  width: 50%; /* 可以设置宽度 */
  height: 100px;
  margin: 20px auto; /* 上下边距生效，auto 可实现水平居中 */
  background: lightblue;
}
```

#### B. `display: inline` (行内元素)

行内元素主要用于包裹文本内容。

*   **默认元素**：`<span>`, `<a>`, `<em>`, `<strong>`, `<label>` 等。
*   **行为特征**：
    1.  **并排显示**：和其他行内元素在同一行显示，不会自动换行。
    2.  **宽度随内容**：宽度仅由其包含的内容决定，**无法**手动设置 `width` 和 `height`（设置了也无效）。
    3.  **盒模型受限**：
        *   **水平方向**：`margin-left`, `margin-right`, `padding-left`, `padding-right` **有效**，会推开其他元素。
        *   **垂直方向**：`margin-top`, `margin-bottom` **无效**。`padding-top`, `padding-bottom` 视觉上会有背景色延伸，但**不会推开**上下方的其他元素（不会影响文档流的高度）。

**代码示例：**
```css
.text-highlight {
  display: inline;
  width: 200px; /* 无效，被忽略 */
  height: 100px; /* 无效，被忽略 */
  margin-top: 50px; /* 无效 */
  padding: 10px; /* 背景变大，但不会改变行高，可能遮挡上一行文字 */
  background: yellow;
}
```

#### C. `display: inline-block` (行内块元素)

这是结合了前两者优点的混合模式。在 Flexbox 流行之前，常用于制作导航栏或并排排列的卡片。

*   **默认元素**：`<img>`, `<input>`, `<button>`, `<textarea>`。
*   **行为特征**：
    1.  **对外像 Inline**：可以和其他元素并排在一行。
    2.  **对内像 Block**：可以完整支持盒模型，设置 `width`, `height`, `margin`, `padding` 均有效。
*   **常见坑**：行内块元素之间会有微小的**空白间隙**（约 4px）。这是因为 HTML 代码中的换行符被浏览器渲染成了一个空格字符。

**代码示例：**
```css
.card {
  display: inline-block;
  width: 100px; /* 有效 */
  height: 100px; /* 有效 */
  margin: 10px; /* 四周边距都有效 */
}
```

#### D. `display: none` vs `visibility: hidden`

虽然它们都用于隐藏元素，但对文档流的影响完全不同。

| 属性 | 描述 | 对文档流的影响 | 重绘/回流 |
| :--- | :--- | :--- | :--- |
| **`display: none`** | **完全移除** | 元素从文档流中消失，**不占据任何空间**。就像它从未存在过一样。 | 触发**回流 (Reflow)** 和重绘。 |
| **`visibility: hidden`** | **视觉隐藏** | 元素不可见，但在文档流中**依然占据原来的空间**（变成透明的）。 | 只触发**重绘 (Repaint)**。 |

### 1.3 总结图表

| 特性         | Block (块)   | Inline (行内)   | Inline-Block (行内块) |
|------------|-------------|---------------|--------------------|
| 换行行为       | 强制换行        | 不换行           | 不换行                |
| 宽高设置       | ✅ 生效        | ❌ 无效 (由内容决定)  | ✅ 生效               |
| 垂直 Margin  | ✅ 生效        | ❌ 无效          | ✅ 生效               |
| 垂直 Padding | ✅ 生效 (撑开容器) | ⚠️ 视觉生效但不撑开容器 | ✅ 生效               |
| 典型场景       | 布局容器、文章段落   | 文字修饰、链接       | 按钮、图标、小组件          |

## 2. 核心概念：BFC (块级格式化上下文)

这是理解文档流最重要的高级概念。你可能听过“触发 BFC 来修复 Bug”，但它到底是什么？

**定义**：**BFC (Block Formatting Context)** 是页面上的一个独立的渲染区域。
**形象理解**：BFC 就像是一个**密封的箱子**。
*   箱子里的元素怎么乱跑（比如浮动），都不会影响到箱子外面的元素。
*   箱子外面的元素（比如 Margin），也穿透不进箱子内部。

### 2.1 如何触发 BFC？
只要给元素添加以下任意一个属性，就会创建 BFC：
*   `overflow`: `hidden`、`auto` 或 `scroll` (最常用的方式)。
*   `display`: `flex`、`grid`、`inline-block` 或 `flow-root` (现代标准推荐)。
*   `position`: `absolute` 或 `fixed`。
*   `float`: `left` 或 `right`。

### 2.2 BFC 的三大“超能力” (用途)
1.  **包含浮动元素** (解决高度塌陷)。
2.  **阻止外边距折叠** (解决 Margin Collapse)。
3.  **防止被浮动元素覆盖** (两栏自适应布局)。

## 3. 文档流中的常见“怪异”问题与解决方案

以下是开发者经常遇到的布局“灵异现象”，它们都源于文档流的机制。

### 问题一：外边距合并 (Margin Collapse)

**现象**：
1.  **兄弟之间**：上面的 div 有 `margin-bottom: 30px`，下面的 div 有 `margin-top: 20px`。你以为间距是 50px，结果只有 **30px** (取最大值)。
2.  **父子之间**：给子元素设置 `margin-top: 20px`，结果子元素没下来，**父元素跟着掉下来了**（父元素的顶部空白被顶开了）。

**原因**：
这是 CSS 的一种设计规范，旨在让文章段落之间的间距保持整洁，但在构建 UI 组件时往往是麻烦。

**解决方案**：

| 场景 | 解决方案 | 备注 |
| :--- | :--- | :--- |
| **兄弟合并** | 无法通过自身属性消除 | 通常不解决，接受这个设定，或者只给一个方向设 Margin。 |
| **父子合并** (最常见) | 1. **给父元素触发 BFC** (如 `overflow: hidden` 或 `display: flow-root`)<br>2. **给父元素加边框/Padding** (如 `padding-top: 1px`) | 只要父子之间有“阻隔”(边框/padding) 或父元素是“密封箱子”(BFC)，合并就会取消。 |

**代码演示 (父子合并修复)**：
```css
.parent {
  background: #ccc;
  /* 修复方案：创建 BFC */
  overflow: hidden; 
  /* 或者使用现代方案 */
  /* display: flow-root; */
}
.child {
  margin-top: 50px; /* 现在 child 会相对于 parent 顶部下移，而不会带着 parent 一起下移 */
}
```

### 问题二：Inline-Block 元素之间的“幽灵空白”

**现象**：
当你把几个 `display: inline-block` 的元素（或图片）横向排列时，即使 margin 设为 0，它们之间也总有 **4px 左右的间隙**。

**原因**：
因为它们是“行内”元素，浏览器把 HTML 代码中的**换行符**（回车）当成了一个**空格字符**渲染出来了。就像单词之间的空格一样。

**解决方案**：

1.  **方案 A (推荐 - 抛弃 inline-block)**：改用 **Flexbox** 布局。
    ```css
    .parent { display: flex; } /* 间隙彻底消失 */
    ```
2.  **方案 B (Hack)**：父元素字体设为 0。
    ```css
    .parent { font-size: 0; }
    .child { font-size: 16px; /* 子元素需要重新恢复字体大小 */ }
    ```
3.  **方案 C (丑陋)**：HTML 标签不换行。
    ```html
    <div>Item1</div><div>Item2</div>
    ```

### 问题三：图片底部多出的“下巴” (3px 空隙)

**现象**：
在一个 div 里放一张 img，你会发现 div 的高度比 img 高出一点点（大约 3-5px），导致图片底部有条缝隙。

**原因**：
图片默认是 `inline` 元素，它遵循文字排版规则。文字为了给像 `j`, `g`, `y` 这样的字母留出“下伸部分 (descender)”，基线（baseline）并不是底线。图片默认对齐基线，所以下面留出了给字母“尾巴”的空间。

**解决方案**：

1.  **方案 A (推荐)**：将图片转为块级。
    ```css
    img { display: block; }
    ```
2.  **方案 B**：改变对齐方式。
    ```css
    img { vertical-align: bottom; /* 或 middle */ }
    ```

### 问题四：高度塌陷 (Height Collapse)

**现象**：
父容器没有设置高度，里面的子元素全部 `float: left`。结果父容器**高度变成了 0**，背景色不见了，下面的布局跑上来了。

**原因**：
浮动元素（Float）会**脱离标准文档流**。父容器在计算高度时，忽略了浮动的子元素，因为它觉得里面是空的。

**解决方案**：

1.  **现代方案**：
    ```css
    .parent {
      display: flow-root; /* 专门为创建 BFC 设计的属性，无副作用 */
    }
    ```
2.  **经典 Clearfix (兼容老旧项目)**：
    ```css
    .clearfix::after {
      content: "";
      display: table;
      clear: both;
    }
    ```

### 问题五：文字溢出与断行 (Overflow & Wrap)

**现象**：
当一行连续的长英文字符（如 URL）或者过长的单词出现时，它会撑破容器，而不会自动换行。

**原因**：
浏览器默认只在空格或连字符处换行。如果一长串字符没有空格，浏览器不敢贸然打断它。

**解决方案**：

```css
.text-box {
  width: 200px;
  border: 1px solid red;
  
  /* 强制打断长单词换行 */
  overflow-wrap: break-word; /* 标准属性 */
  /* 或者使用更暴力的 */
  word-break: break-all; /* 任意字符间都可断行，适合中英混排 */
}

/* 扩展：单行文本溢出显示省略号 (...) 的标准三件套 */
.truncate {
  white-space: nowrap;      /* 1. 禁止换行 */
  overflow: hidden;         /* 2. 隐藏溢出部分 */
  text-overflow: ellipsis;  /* 3. 显示省略号 */
}
```

## 4.总结：如何避免 90% 的文档流问题？

1.  **能用 Flex/Grid 就别用 Float/Inline-Block**：现代布局系统规避了几乎所有传统文档流的坑（如清除浮动、空白间隙）。
2.  **理解盒模型**：始终使用 `box-sizing: border-box`。
3.  **警惕 Margin**：当父子元素边缘重合时，优先想到 BFC 或使用 Padding 代替 Margin。
4.  **图片处理**：习惯性把布局用的图片设为 `display: block`。

