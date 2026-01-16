# CSS继承(Inheritance)
CSS 继承是 CSS 中一个非常重要但常被忽视的机制。

它的核心概念很简单：有些属性，如果你不显式地给子元素设置，子元素会自动“继承”父元素的这个属性值。
但这并不是全部。为了让你彻底搞懂继承，我们需要明确两个关键点：哪些属性会继承 以及 如何强制控制继承。

##  哪些属性会继承？ (The "Inherited" Properties)
并不是所有 CSS 属性都会继承。CSS 属性大致可以分为两类：

### 可继承属性 (Inherited Properties)
这些属性通常与 文本内容 和 排版 相关。逻辑是：如果你设置了整个段落的字体颜色，通常你也希望段落里的强调文本 `<em>` 也是这个颜色。

**文本系列:**

- **`color`** (颜色)

- **`direction`** (文本方向)

- **`line-height`** (行高)

- **`text-align`** (文本对齐)

- **`text-indent`** (首行缩进)

- **`text-transform`** (文本大小写转换)

- **`letter-spacing`** (字间距)

- **`word-spacing`** (词间距)

- **`white-space`** (空白处理)**
  
**字体系列:**

- **`font`** (简写)

- **`font-family`** (字体族)

- **`font-size`** (字体大小)

- **`font-style`** (字体样式)

- **`font-weight`** (字体粗细)

**其他:**

- **`visibility`** (可见性 - 注意：opacity 不继承)

- **`cursor`** (鼠标光标)

- **`list-style`** (列表样式)

### 不可继承属性 (Non-inherited Properties)
这些属性通常与 盒模型、布局 和 背景 相关。逻辑是：如果你给父元素加了一个红色的边框，你肯定不希望里面的所有子元素也都自动带上红色边框。

- 盒模型: **`width`**, **`height`**, **`margin`**, **`padding`**, **`border`**

- 背景: **`background`** (背景色、背景图等)

- 定位: **`position`**, **`top`**, **`left`**, **`right`**, **`bottom`**, **`z-index`**, **`float`**

- 显示: **`display`**, **`overflow`**, **`vertical-align`**

## 如何控制继承？ (Controlling Inheritance)
CSS 提供了四个特殊的关键字，允许你强制改变任何属性的继承行为。这些关键字可以用在任何 CSS 属性上。

### `inherit` (强制继承)
**作用:** 强制让子元素的某个属性值等于父元素的该属性值（即使这个属性默认是不继承的）。

**场景:** 你想让子元素的边框颜色和父元素完全一致。

```css
/* 子元素也会有 1px solid red 的边框 */
.parent { border: 1px solid red; }
.child {
border: inherit; 
}
```
### `initial` (重置为默认值)
**作用:** 将属性重置为 CSS 规范中定义的初始默认值（浏览器的默认样式），完全忽略继承。

**场景:** 父元素设置了红色字体，但你希望某个子元素恢复为浏览器默认的黑色字体。

```css
/* 变回黑色 (浏览器默认值) */
.parent { color: red; }
.child {
color: initial; 
}
```

### `unset` (恢复自然状态)
**作用:** 这是一个智能的关键字。

   - 如果该属性是可继承的（如 color），它就表现得像 `inherit`。

   - 如果该属性是不可继承的（如 border），它就表现得像 `initial`。

**场景:** 当你清理样式时，`unset` 是最安全的“重置”方式。

### `revert` (回归浏览器/用户样式)
**作用:** 将样式回滚到浏览器默认样式表（User Agent Stylesheet）中定义的值。它比 `initial` 更温和，因为它保留了浏览器默认的样式（比如 h1 的默认粗体和大字号），而 `initial` 可能会把 h1 变成普通文本大小。

## 常见误区与注意点
`<a>` 标签的颜色:

**很多人问：**“为什么我给 body 设置了 color: red，链接 `<a>` 却还是蓝色的？”

**原因:** 浏览器默认样式表（User Agent Stylesheet）给 a 标签明确设置了 color: -webkit-link（蓝色）。因为具体选择器的优先级高于继承，所以继承下来的红色被浏览器的默认蓝色覆盖了。

**解决:** 
```css
a { color: inherit; }
```

**`height: 100%` 不是继承:**

给子元素设置 `height: 100%` 并不是继承，而是计算。它是基于包含块（containing block）的高度来计算自己的高度。如果父元素高度是 auto，子元素的 100% 可能无效。

**`opacity` 的“伪继承”:**

`opacity` 属性本身是不继承的。但是，如果你给父元素设置了 `opacity: 0.5`，子元素看起来也会变透明。这不是继承，而是因为子元素是渲染在父元素这个“半透明层”之上的。你无法通过在子元素上设置 `opacity: 1` 来抵消父元素的透明度。

**总结**
- 文字排版类属性（color, font...）大多会继承。

- 盒子模型类属性（border, padding...）大多不会继承。

- 使用 `inherit` 关键字可以强制开启继承。

- 使用 `initial` 或 `unset` 可以切断继承。
