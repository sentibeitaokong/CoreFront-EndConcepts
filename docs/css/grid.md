# Grid 网格布局教程
Grid 布局是目前 CSS 中最强大的二维布局系统。
## 一、概述

网格布局（Grid）是最强大的 CSS 布局方案。

它将网页划分成一个个网格，可以任意组合不同的网格，做出各种各样的布局。以前，只能通过复杂的 CSS 框架达到的效果，现在浏览器内置了。


Grid 布局与 **Flex 布局** 有一定的相似性，都可以指定容器内部多个项目的位置。但是，它们也存在重大区别。

| 特性   | Flexbox (一维布局)                       | Grid (二维布局)                        |
|------|--------------------------------------|------------------------------------|
| 核心思想 | 内容驱动 (Content-First)。让布局去适应内容的大小。    | 布局驱动 (Layout-First)。先画好格子，再把内容填进去。 |
| 维度   | 处理一行或一列。虽然可以换行，但换行后的每一行是独立的。         | 同时处理行和列。可以轻松实现“跨行跨列”。              |
| 对齐   | 很难实现“二维对齐”（比如让第二行的某个元素严格对齐第一行的某个元素）。 | 天生就是为了二维对齐设计的。                     |
| 适用场景 | 导航栏、按钮组、卡片列表（单行）、简单的居中。              | 整个页面的宏观骨架、复杂的仪表盘、图片画廊、非规则网格。       |


## 二、基本概念

学习 Grid 布局之前，需要了解一些基本概念。

### 2.1 容器和项目

采用网格布局的区域，称为**"容器"（container）**。容器内部采用网格定位的子元素，称为**"项目"（item）**。

```html
<div>
  <div><p>1</p></div>
  <div><p>2</p></div>
  <div><p>3</p></div>
</div>
```

上面代码中，最外层的`<div>`元素就是容器，内层的三个`<div>`元素就是项目。

> **注意**：项目只能是容器的顶层子元素，不包含项目的子元素，比如上面代码的`<p>`元素就不是项目。Grid 布局只对项目生效。

### 2.2 行和列

容器里面的水平区域称为**"行"（row）**，垂直区域称为**"列"（column）**。

![Logo](/gridContainer.png)

上图中，水平的深色区域就是"行"，垂直的深色区域就是"列"。

### 2.3 单元格

行和列的交叉区域，称为**"单元格"（cell）**。

正常情况下，`n`行和`m`列会产生`n x m`个单元格。比如，3行3列会产生9个单元格。

### 2.4 网格线

划分网格的线，称为**"网格线"（grid line）**。水平网格线划分出行，垂直网格线划分出列。

正常情况下，`n`行有`n + 1`根水平网格线，`m`列有`m + 1`根垂直网格线，比如三行就有四根水平网格线。

上图是一个 4 x 4 的网格，共有5根水平网格线和5根垂直网格线。

![Logo](/gridLine.png)

## 三、容器属性

Grid 布局的属性分成两类。一类定义在容器上面，称为容器属性；另一类定义在项目上面，称为项目属性。这部分先介绍容器属性。

### 3.1 display 属性

`display: grid`指定一个容器采用网格布局。

```css
div {
  display: grid;
}
```
![Logo](/grid.png)
默认情况下，容器元素都是块级元素，但也可以设成行内元素。

```css
div {
  display: inline-grid;
}
```
![Logo](/inlineGrid.png)

> **注意**：设为网格布局以后，容器子元素（项目）的`float`、`display: inline-block`、`display: table-cell`、`vertical-align`和`column-*`等设置都将失效。

### 3.2 grid-template-columns 属性， grid-template-rows 属性

容器指定了网格布局以后，接着就要划分行和列。
*   `grid-template-columns`属性定义每一列的列宽。
*   `grid-template-rows`属性定义每一行的行高。

```css
.container {
  display: grid;
  grid-template-columns: 100px 100px 100px;
  grid-template-rows: 100px 100px 100px;
}
```
![Logo](/gridTemplate.png)
上面代码指定了一个三行三列的网格，列宽和行高都是`100px`。

除了使用绝对单位，也可以使用百分比。

```css
.container {
  display: grid;
  grid-template-columns: 33.33% 33.33% 33.33%;
  grid-template-rows: 33.33% 33.33% 33.33%;
}
```

**（1）repeat()**

有时候，重复写同样的值非常麻烦，尤其网格很多时。这时，可以使用`repeat()`函数，简化重复的值。

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 33.33%);
  grid-template-rows: repeat(3, 33.33%);
}
```

`repeat()`接受两个参数，第一个参数是重复的次数（上例是3），第二个参数是所要重复的值。

`repeat()`重复某种模式也是可以的。

```css
grid-template-columns: repeat(2, 100px 20px 80px);
```

上面代码定义了6列，第一列和第四列的宽度为`100px`，第二列和第五列为`20px`，第三列和第六列为`80px`。

![Logo](/repeat.png)

**（2）auto-fill 关键字**

有时，单元格的大小是固定的，但是容器的大小不确定。如果希望每一行（或每一列）容纳尽可能多的单元格，这时可以使用`auto-fill`关键字表示自动填充。

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
}
```

上面代码表示每列宽度`100px`，然后自动填充，直到容器不能放置更多的列。

![Logo](/autoFill.png)

> 除了`auto-fill`，还有一个关键字`auto-fit`，两者的行为基本是相同的。差异在于：`auto-fill`会用空格子填满剩余宽度，`auto-fit`则会尽量扩大单元格的宽度。

**（3）fr 关键字**

为了方便表示比例关系，网格布局提供了`fr`关键字（fraction 的缩写，意为"片段"）。如果两列的宽度分别为`1fr`和`2fr`，就表示后者是前者的两倍。

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

上面代码表示两个相同宽度的列。

![Logo](/fr.png)

`fr`可以与绝对长度的单位结合使用，这时会非常方便。

```css
.container {
  display: grid;
  grid-template-columns: 150px 1fr 2fr;
}
```

上面代码表示，第一列的宽度为150像素，第二列的宽度是第三列的一半。

![Logo](/frSecond.png)

**（4）minmax()**

`minmax()`函数产生一个长度范围，表示长度就在这个范围之中。它接受两个参数，分别为最小值和最大值。

```css
grid-template-columns: 1fr 1fr minmax(100px, 1fr);
```

上面代码中，`minmax(100px, 1fr)`表示列宽不小于`100px`，不大于`1fr`。

**（5）auto 关键字**

`auto`关键字表示由浏览器自己决定长度。

```css
grid-template-columns: 100px auto 100px;
```

上面代码中，第二列的宽度，基本上等于该列单元格的最大宽度。

**（6）网格线的名称**

`grid-template-columns`属性和`grid-template-rows`属性里面，还可以使用方括号，指定每一根网格线的名字，方便以后的引用。

```css
.container {
  display: grid;
  grid-template-columns: [c1] 100px [c2] 100px [c3] auto [c4];
  grid-template-rows: [r1] 100px [r2] 100px [r3] auto [r4];
}
```

上面代码指定网格布局为3行 x 3列，因此有4根垂直网格线和4根水平网格线。方括号里面依次是这八根线的名字。

**（7）布局实例**

两栏式布局只需要一行代码：

```css
.wrapper {
  display: grid;
  grid-template-columns: 70% 30%;
}
```

传统的十二网格布局：

```css
grid-template-columns: repeat(12, 1fr);
```

### 3.3 gap 属性

`row-gap`属性设置行与行的间隔（行间距），`column-gap`属性设置列与列的间隔（列间距）。

```css
.container {
  row-gap: 20px;
  column-gap: 20px;
}
```
![Logo](/gridGap.png)
`gap`属性是`column-gap`和`row-gap`的合并简写形式。

```css
gap: <row-gap> <column-gap>;
```

例如：

```css
.container {
  gap: 20px 20px;
}
```

如果`gap`省略了第二个值，浏览器认为第二个值等于第一个值。

### 3.4 grid-template-areas 属性

网格布局允许指定"区域"（area），一个区域由单个或多个单元格组成。`grid-template-areas`属性用于定义区域。

```css
.container {
  display: grid;
  grid-template-columns: 100px 100px 100px;
  grid-template-rows: 100px 100px 100px;
  grid-template-areas: 'a b c'
                       'd e f'
                       'g h i';
}
```

多个单元格合并成一个区域的写法如下。

```css
grid-template-areas: 'a a a'
                     'b b b'
                     'c c c';
```

如果某些区域不需要利用，则使用"点"（`.`）表示。

```css
grid-template-areas: 'a . c'
                     'd . f'
                     'g . i';
```

### 3.5 grid-auto-flow 属性

划分网格以后，容器的子元素会按照顺序，自动放置在每一个网格。默认的放置顺序是"先行后列"。
![Logo](/gridAutoFlow.png)

这个顺序由`grid-auto-flow`属性决定，默认值是`row`。 也可以将它设成`column`，变成"先列后行"。

```css
grid-auto-flow: column;
```

![Logo](/gridAutoFlowColumn.png)

`grid-auto-flow`属性还可以设成`row dense`和`column dense`。这两个值主要用于，某些项目指定位置以后，剩下的项目怎么自动放置，表示"尽可能紧密填满，尽量不出现空格"。

```css
grid-auto-flow: row dense;
```

![Logo](/gridAutoFlowRowDense.png)

```css
grid-auto-flow: column dense;
```

![Logo](/gridAutoFlowColumnDense.png)
### 3.6 justify-items 属性， align-items 属性， place-items 属性

`justify-items`属性设置单元格内容的水平位置（左中右），`align-items`属性设置单元格内容的垂直位置（上中下）。

```css
.container {
  justify-items: start | end | center | stretch;
  align-items: start | end | center | stretch;
}
```

*   `start`：对齐单元格的起始边缘。
*   `end`：对齐单元格的结束边缘。
*   `center`：单元格内部居中。
*   `stretch`：拉伸，占满单元格的整个宽度（默认值）。
```css
.container {
    justify-items: start;
}
```
![Logo](/justifyItemsStart.png)

```css
.container {
    align-items: start;
}
```
![Logo](/alignItemsStart.png)
`place-items`属性是`align-items`属性和`justify-items`属性的合并简写形式。

```css
place-items: <align-items> <justify-items>;
```

如果省略第二个值，则浏览器认为与第一个值相等。

### 3.7 justify-content 属性， align-content 属性， place-content 属性

`justify-content`属性是整个内容区域在容器里面的水平位置（左中右），`align-content`属性是整个内容区域的垂直位置（上中下）。

```css
.container {
  justify-content: start | end | center | stretch | space-around | space-between | space-evenly;
  align-content: start | end | center | stretch | space-around | space-between | space-evenly;  
}
```

*   `start` - 对齐容器的起始边框。
*   `end` - 对齐容器的结束边框。
*   `center` - 容器内部居中。
*   `space-around` - 每个项目两侧的间隔相等。
*   `space-between` - 项目与项目的间隔相等，项目与容器边框之间没有间隔。
*   `space-evenly` - 项目与项目的间隔相等，项目与容器边框之间也是同样长度的间隔。

```css
.container {
  justify-content: start;
}
```
![Logo](/justifyContentStart.png)
`place-content`属性是`align-content`属性和`justify-content`属性的合并简写形式。

```css
place-content: <align-content> <justify-content>
```

如果省略第二个值，浏览器就会假定第二个值等于第一个值。
### 3.8 grid-auto-columns 属性， grid-auto-rows 属性

有时候，一些项目的指定位置，在现有网格的外部。这时，浏览器会自动生成多余的网格。

`grid-auto-columns`属性和`grid-auto-rows`属性用来设置，浏览器自动创建的多余网格的列宽和行高。

```css
.container {
  display: grid;
  grid-template-columns: 100px 100px 100px;
  grid-template-rows: 100px 100px 100px;
  grid-auto-rows: 50px; 
}
```



## 四、项目属性

下面这些属性定义在项目（子元素）上面。

### 4.1 grid-column-start / end, grid-row-start / end

项目的位置是可以指定的，具体方法就是指定项目的四个边框，分别定位在哪根网格线。

*   `grid-column-start`属性：左边框所在的垂直网格线
*   `grid-column-end`属性：右边框所在的垂直网格线
*   `grid-row-start`属性：上边框所在的水平网格线
*   `grid-row-end`属性：下边框所在的水平网格线

```css
.item-1 {
  grid-column-start: 2;
  grid-column-end: 4;
}
```
![Logo](/gridColumnFirst.png)
这四个属性的值还可以使用`span`关键字，表示"跨越"，即左右边框（上下边框）之间跨越多少个网格。

```css
.item-1 {
  grid-column-start: span 2;
}
```
![Logo](/gridColumnSecond.png)
### 4.2 grid-column 属性， grid-row 属性

`grid-column`属性是`grid-column-start`和`grid-column-end`的合并简写形式，`grid-row`属性是`grid-row-start`属性和`grid-row-end`的合并简写形式。

```css
.item {
  grid-column: <start-line> / <end-line>;
  grid-row: <start-line> / <end-line>;
}
```

例如：

```css
.item-1 {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
}
```

斜杠以及后面的部分可以省略，默认跨越一个网格。

### 4.3 grid-area 属性

`grid-area`属性指定项目放在哪一个区域。

```css
.item-1 {
  grid-area: e;
}
```
1号项目位于e区域，效果如下图。
![Logo](/gridArea.png)

`grid-area`属性还可用作`grid-row-start`、`grid-column-start`、`grid-row-end`、`grid-column-end`的合并简写形式。

```css
.item {
  grid-area: <row-start> / <column-start> / <row-end> / <column-end>;
}
```

### 4.4 justify-self 属性， align-self 属性， place-self 属性

`justify-self`属性设置单元格内容的水平位置，`align-self`属性设置单元格内容的垂直位置。只作用于单个项目。

```css
.item {
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
}
```

`place-self`属性是`align-self`属性和`justify-self`属性的合并简写形式。

```css
place-self: <align-self> <justify-self>;
```