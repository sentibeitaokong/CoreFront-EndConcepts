# overflow 溢出处理

`overflow` 决定当元素内容超出其「盒子」边界时，浏览器如何处理「多出来的那一部分」。它是滚动容器、省略号截断、隐藏溢出等日常布局场景背后的底层功臣。

**一句话理解**：**「`overflow` 就是给元素画一条『内容越界后的处置规则』——是藏起来、滚起来、还是任由它越界。」**

## 1. `overflow` 的取值

| 取值      | 表现                                                                   | 是否产生滚动条                    |
| --------- | ---------------------------------------------------------------------- | --------------------------------- |
| `visible` | **默认值**。内容超出边界时依然可见，直接溢出到盒子外。                 | ❌ 否                             |
| `hidden`  | 超出部分被**裁剪**，不可见，也无法滚动。                               | ❌ 否（内容被裁掉，不能滚动查看） |
| `scroll`  | 超出部分被裁剪，但**始终显示滚动条**（即便内容没溢出也占位）。         | ✅ 是（始终显示）                 |
| `auto`    | 超出部分被裁剪，**只在内容真正溢出时**才显示滚动条。                   | ✅ 是（按需显示）                 |
| `clip`    | 类似 `hidden`，但**完全不支持程序化滚动**（如 `scrollTo`），彻底冻结。 | ❌ 否                             |

### 1.1 逐值深度解析

**`visible`（默认）**：内容可以「越界展示」。这也是为什么一个没有设置高度的父元素，其子元素的 `margin`、绝对定位子元素能浮出父容器边界。

**`hidden`**：最常用的「裁边」手段，但有两个容易被忽视的副作用（见第 5 节）：触发 BFC、成为滚动容器。

**`scroll` vs `auto`**：`scroll` 无论是否溢出都**占用滚动条空间**（在 Windows 上尤其明显），`auto` 则按需显示。日常做可滚动区域，**优先 `auto`**。

**`clip`**：与 `hidden` 的区别在于「能否程序化滚动」。`overflow: clip` 的元素，即使你用 `element.scrollTop = 100` 也纹丝不动，彻底禁滚；`hidden` 虽不显示滚动条，但**仍可被 JS 程序化滚动**。

```css
.box {
  overflow: clip; /* 彻底禁止滚动（含 JS 滚动） */
}
```

## 2. `overflow-x` 与 `overflow-y`

`overflow` 其实是 `overflow-x`（横向）和 `overflow-y`（纵向）的简写：

```css
.box {
  overflow-x: hidden; /* 横向溢出隐藏 */
  overflow-y: auto; /* 纵向按需滚动 */
}
```

### 2.1 关键坑点：不能「一个 visible 一个非 visible」

当 `overflow-x` 和 `overflow-y` 之一不是 `visible` 时，另一个也不能是 `visible`——浏览器会把它**自动提升为 `auto`**。

```css
/* 你以为：纵向可见、横向隐藏 */
/* 实际：浏览器把 overflow-y 强制改成 auto，纵向也可能出现滚动条 */
.box {
  overflow-x: hidden;
  overflow-y: visible; /* 被强制提升为 auto，写 visible 无效 */
}
```

## 3. 单行文本省略 (`text-overflow`)

`text-overflow` 是溢出文本的「省略号」专属处理，但它**必须配合** `overflow: hidden` 和 `white-space: nowrap` 才能工作：

```css
.ellipsis {
  white-space: nowrap; /* 强制单行，不换行 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 溢出部分显示 ... */
}
```

### 3.1 `text-overflow` 的取值

| 取值       | 说明                                  | 兼容性     |
| ---------- | ------------------------------------- | ---------- |
| `clip`     | 默认值，直接裁剪，无省略号。          | 全部       |
| `ellipsis` | 溢出处显示 `...`。                    | 全部       |
| `"字符串"` | 自定义省略字符（如 `"..."`、`"~"`）。 | 仅 Firefox |

### 3.2 为什么三个属性缺一不可？

- `white-space: nowrap`：让文字**不换行**，否则内容会换行而非「溢出」。
- `overflow: hidden`：让溢出的部分**被裁剪**，为省略号腾出位置。
- `text-overflow: ellipsis`：在裁剪处**画省略号**。

三者是「防止换行 → 裁掉溢出 → 标记裁断点」的递进关系。

## 4. 多行文本省略 (`-webkit-line-clamp`)

多行省略依赖 `-webkit-line-clamp`，需要四个属性配合：

```css
.multi-line-ellipsis {
  display: -webkit-box; /* 必须：弹性盒子容器 */
  -webkit-box-orient: vertical; /* 必须：垂直排列 */
  -webkit-line-clamp: 2; /* 核心：限制显示 2 行 */
  overflow: hidden; /* 必须：隐藏第 2 行之后的内容 */
}
```

> 该方案虽带 `-webkit-` 前缀，但现代浏览器（含 Firefox 68+）均已支持，是生产环境的主流做法。

### 4.1 兼容性兜底：用 `max-height` 近似

老浏览器不支持 `-webkit-line-clamp` 时，可用「行高 × 行数」限制高度 + 隐藏溢出：

```css
.fallback-ellipsis {
  line-height: 1.5;
  max-height: 3em; /* 1.5 × 2 行 */
  overflow: hidden;
}
```

缺点是**不会显示省略号**，只能纯裁剪。

## 5. `overflow` 与格式化上下文的联动

`overflow` 为非 `visible` 时（`hidden`/`auto`/`scroll`/`clip`），会顺带触发两件「隐藏效果」：

1. **创建 BFC（块级格式化上下文）**：`overflow: hidden` 是经典的「清除浮动/包裹浮动子元素」手段，可解决父容器高度塌陷。详见 [文档流](/css/basic/documentFlow#bfc)。
2. **成为滚动容器**：`overflow: auto/scroll` 的元素会成为其子元素的滚动边界，`position: sticky` 也会以它为参照物。

### 5.1 为什么 `overflow: hidden` 能清除浮动？

浮动元素脱离文档流，父容器算高度时会忽略它们（高度塌陷）。而 BFC 会**把浮动子元素也纳入高度计算**，`overflow: hidden` 恰好触发了 BFC，于是父容器重新「包住」了浮动子元素。

```css
.parent {
  overflow: hidden; /* 触发 BFC，解决子元素浮动导致的高度塌陷 */
}
```

## 6. 滚动容器与平滑滚动

### 6.1 平滑滚动

```css
.scroll-box {
  overflow-y: auto;
  scroll-behavior: smooth; /* 点击锚点/scrollTo 时平滑滚动 */
}
```

### 6.2 滚动吸附 (`scroll-snap`)

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory; /* 横向强制吸附 */
}
.carousel > .slide {
  scroll-snap-align: start;
}
```

### 6.3 隐藏滚动条但保留滚动

```css
.hide-scrollbar {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

## 7. 常见问题 (FAQ)

### 7.1 为什么我设了 `overflow: hidden`，里面的 `position: sticky` 失效了？

因为 `overflow: hidden/auto/scroll` 的祖先元素会成为 sticky 的滚动容器参照物，改变了它的「吸顶」行为。若想让 sticky 生效，需确保其父级没有 `overflow` 裁剪。

### 7.2 横向溢出出现了白边怎么办？

通常是某个子元素宽度超出了容器。定位到越界元素后，可用 `overflow-x: hidden` 兜底，但更推荐从根源修正宽度（如 `max-width: 100%`、`box-sizing: border-box`、给图片加 `display: block`）。

### 7.3 `overflow: hidden` 会裁剪阴影/定位吗？

`overflow: hidden` 会裁剪**所有超出内容盒边界的内容**，包括 `box-shadow` 和 `position: absolute` 的子元素（若其定位参照物在这个容器内）。所以弹窗、下拉菜单等「需要浮出父容器」的元素，不要放进 `overflow: hidden` 的祖先里。

### 7.4 `overflow: hidden` 和 `overflow: clip` 到底差在哪？

- `hidden`：隐藏溢出，但仍**可被 JS 程序化滚动**，且**不裁剪「溢出到 padding 区」的内容**。
- `clip`：彻底禁止任何滚动（含 JS），并按 `overflow-clip-margin` 严格裁剪边界。

## 8. 总结

- 溢出处理三件套：`overflow`（滚动/裁剪）、`text-overflow`（省略号）、`-webkit-line-clamp`（多行省略）。
- 滚动容器优先用 `auto`，冻结滚动用 `clip`，解决高度塌陷用 `hidden`。
- 记住两个「副作用」：非 `visible` 会触发 BFC，也会成为滚动容器并影响 `sticky`。
- 单行省略三件套缺一不可：`nowrap + hidden + ellipsis`。
