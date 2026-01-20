# CSS 文字效果 (Text Effects)

CSS 不仅能控制字体的大小和颜色，还能通过阴影、描边、渐变和排版控制，实现类似 Photoshop 的艺术字效果。

## 1. 基础排版 API

控制文字的基本显示形态。

| 属性 | 常用值 / 示例 | 描述 |
| :--- | :--- | :--- |
| **`font-family`** | `'Roboto', sans-serif` | 字体家族。通常写一个备选列表（字体栈）。 |
| **`font-size`** | `16px`, `1.2rem`, `1em` | 字号。**推荐使用 `rem`** 以适应用户设置。 |
| **`font-weight`** | `400` (Normal), `700` (Bold) | 字重。支持 100-900 的数值。 |
| **`line-height`** | `1.5`, `24px` | 行高。**推荐使用无单位数值**（如 `1.5`），它是相对于当前字号的倍数。 |
| **`letter-spacing`** | `0.05em`, `1px` | 字间距（字母之间的距离）。 |
| **`text-align`** | `left`, `center`, `right`, `justify` | 对齐方式。`justify` 为两端对齐。 |

## 2. 视觉装饰 API

让文字“变好看”的核心属性。

### 2.1 文本修饰 (`text-decoration`)
不仅仅是下划线，现在支持改变线型和颜色。
*   **简写**: `text-decoration: line style color thickness;`
*   **示例**:
    ```css
    /* 红色波浪删除线 */
    text-decoration: line-through wavy red 2px;
    ```
*   **常用值**: `underline` (下划线), `line-through` (删除线), `none` (去掉链接下划线)。

### 2.2 文本转换 (`text-transform`)
控制大小写。
*   `uppercase`: 全部大写。
*   `lowercase`: 全部小写。
*   `capitalize`: 首字母大写。

### 2.3 文字阴影 (`text-shadow`)
不需要滤镜，直接生成投影。
*   **语法**: `x偏移 y偏移 模糊半径 颜色`
*   **实战**:
    ```css
    /* 发光效果 */
    text-shadow: 0 0 10px #00e6e6, 0 0 20px #00e6e6;
    
    /* 3D 浮雕效果 */
    text-shadow: 1px 1px 0 #ddd, 2px 2px 0 #bbb;
    ```

## 3. 进阶特效 (Advanced Effects)

### 3.1 文字渐变色 (Gradient Text)
CSS 没有直接的 `text-gradient` 属性，需要结合背景裁剪来实现。

```css
.gradient-text {
  /* 1. 设置渐变背景 */
  background: linear-gradient(to right, #ff00cc, #333399);
  
  /* 2. 核心：将背景裁剪为文字形状 */
  -webkit-background-clip: text;
  background-clip: text;
  
  /* 3. 核心：将文字本身设为透明，透出背景 */
  color: transparent;
  
  /* 可选：防止低版本浏览器看不见文字 */
  /* 如果不支持 background-clip，文字会消失。通常不用太担心，现代浏览器都支持。 */
}
```

### 3.2 文字描边 (Text Stroke)
这是一个非标准但广泛支持 (`-webkit-`) 的属性。

```css
.stroked-text {
  color: transparent; /* 镂空效果 */
  -webkit-text-stroke: 1px black; /* 1px 宽的黑色描边 */
}
```

### 3.3 多行省略号 (Multi-line Truncation)
单行省略号很容易，多行省略号需要特定的 Webkit 属性。

```css
.line-clamp {
  display: -webkit-box;           /* 必须结合的属性 */
  -webkit-box-orient: vertical;   /* 垂直排列 */
  -webkit-line-clamp: 3;          /* 限制显示 3 行 */
  overflow: hidden;               /* 超出隐藏 */
}
```

## 4. 换行与空白控制 (Breaking & Spacing)

处理长单词、URL 或预格式化文本。

| 属性 | 场景 | 常用值 |
| :--- | :--- | :--- |
| **`white-space`** | 控制**空格**和**换行符** | `nowrap` (强制不换行), `pre-wrap` (保留空格和回车) |
| **`word-break`** | 单词如何断开 | `break-all` (暴力断开，适合纯英文), `keep-all` (CJK 不断开) |
| **`overflow-wrap`** | 单词太长怎么办 | `break-word` (推荐。只有当单词太长放不下时才断开) |


## 5. 常见问题 (FAQ)

### Q1: 怎么让单行文字垂直居中？
**方案 A (行高法)**:
如果文字只有一行，且高度固定。设置 `line-height` 等于 `height`。
```css
.btn {
  height: 40px;
  line-height: 40px;
}
```
**方案 B (Flexbox - 推荐)**:
```css
.parent {
  display: flex;
  align-items: center; /* 垂直居中 */
}
```

### Q2: 为什么 `line-height` 设置了 1.5，文字还是挤在一起？
**原因**: 可能父元素的字号太大了，或者你在子元素用了固定的 px 行高。

**建议**: `line-height` 尽量使用**无单位数值**（如 `1.5`）。这样子元素继承的是比例，而不是固定的 px 值。

### Q3: 长串的 URL 地址撑破了容器？
**现象**: 有一行很长的链接 `https://very-long-url...`，导致容器出现横向滚动条。

**解法**:
```css
.link {
  overflow-wrap: break-word; /* 允许在长单词内部换行 */
  word-break: break-all;     /* 暴力换行 (备选) */
}
```

### Q4: 苹果/Mac 上的字体看起来比 Windows 细？
**原因**: 渲染引擎不同。macOS 的字体渲染偏细。

**微调技巧**:
```css
body {
  -webkit-font-smoothing: antialiased; /* 让字体在 Mac 上看起来更清晰、略细 */
  -moz-osx-font-smoothing: grayscale;
}
```

### Q5: `text-align: justify` (两端对齐) 最后一行乱了？
`justify` 对最后一行默认是左对齐的。如果你想强制最后一行也分散对齐：
```css
.justify-all {
  text-align: justify;
  text-align-last: justify; /* 强制最后一行也两端对齐 */
}
```

### Q6: 为什么用了 `font-weight: 600` 看起来和 `700` 一样？
**原因**: 你引用的字体文件可能**缺失**了 600 这个字重。
如果字体文件里只有 Regular (400) 和 Bold (700)，浏览器会由近匹配。设置 600 会自动跳到 700。确保你引入了对应的 Webfont 字重。