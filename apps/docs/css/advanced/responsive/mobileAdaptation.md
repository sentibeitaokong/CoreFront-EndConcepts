# 移动端适配

移动端适配的核心矛盾是：**设计稿像素、设备物理像素、CSS 逻辑像素三者并不一致**。理解并驾驭这三者，是做出「在手机上不糊、不变形、不错位」页面的前提。

**一句话理解**：**移动端适配 = 用 viewport 锁定视口 + 用 rem/vw 做弹性缩放 + 用 DPR 处理高清与 1px 细节。**

## 1. 三大像素概念

| 概念              | 说明                                                          | 举例                                  |
| ----------------- | ------------------------------------------------------------- | ------------------------------------- |
| 物理像素          | 屏幕真实的发光点，硬件参数，出厂固定。                        | iPhone 14 横向 1170 个发光点          |
| 逻辑像素 (CSS px) | CSS 中使用的抽象单位，是布局的基准。                          | 设计稿 375px 宽的手机，逻辑宽 375px   |
| DPR（设备像素比） | `DPR = 物理像素 / 逻辑像素`，一个 CSS px 由几个物理像素渲染。 | iPhone 14 DPR=3，即 1px 用 3 个发光点 |

### 1.1 三者的换算

```markdown
物理像素 = 逻辑像素 × DPR

例：iPhone 14（DPR=3，逻辑宽 390px）
物理像素 = 390 × 3 = 1170
```

**核心结论**：DPR 越高的屏幕，一个 CSS 像素对应的物理像素越多，画面越细腻；但也正是它，导致「1px 边框看起来变粗」。

### 1.2 如何获取 DPR

```javascript
window.devicePixelRatio // 如 2、3
```

```css
/* CSS 中通过媒体查询判断 */
@media (-webkit-min-device-pixel-ratio: 2) {
  /* DPR ≥ 2 */
}
@media (min-resolution: 2dppx) {
  /* 标准写法 */
}
```

## 2. viewport：锁定的「视口」

`<meta name="viewport">` 是移动端适配的第一行代码，缺了它手机浏览器会以桌面宽度（通常 980px）渲染页面，导致整个页面被缩小成「蚂蚁字」。

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

### 2.1 属性详解

| 属性            | 说明                                            | 推荐值         |
| --------------- | ----------------------------------------------- | -------------- |
| `width`         | 视口宽度，`device-width` 表示等于设备逻辑宽度。 | `device-width` |
| `initial-scale` | 初始缩放比例。                                  | `1.0`          |
| `maximum-scale` | 最大缩放比例。                                  | 视业务         |
| `minimum-scale` | 最小缩放比例。                                  | 视业务         |
| `user-scalable` | 是否允许用户缩放。                              | 视业务         |
| `viewport-fit`  | 是否延伸到安全区（刘海屏）。                    | `cover`        |

### 2.2 三种视口概念

| 视口     | 说明                                           |
| -------- | ---------------------------------------------- |
| 布局视口 | 页面布局的容器，未设 viewport 时默认 980px。   |
| 视觉视口 | 用户当前看到的区域（可缩放）。                 |
| 理想视口 | 设备逻辑宽度，即 `width=device-width` 的结果。 |

## 3. rem 适配方案

`rem` 是相对于 **html 根元素字体大小** 的单位。通过动态设置根字体，可实现「整站按比例缩放」。

### 3.1 动态设置根字体

```javascript
// 假设设计稿宽度 375px，基准 font-size 设为 100px（方便换算）
const setRootFontSize = () => {
  const designWidth = 375
  const baseFontSize = 100
  const scale = document.documentElement.clientWidth / designWidth
  document.documentElement.style.fontSize = baseFontSize * scale + 'px'
}
window.addEventListener('resize', setRootFontSize)
setRootFontSize()
```

### 3.2 换算规则

设计稿上元素宽度为 `W px`，则 CSS 写成 `W / 100 rem`。例如设计稿 200px 宽 → `2rem`。

```css
/* 设计稿 375px，基准 100px */
.box {
  width: 2rem; /* 200px */
  height: 0.44rem; /* 44px */
  font-size: 0.14rem; /* 14px */
}
```

### 3.3 配合 PostCSS 自动转换

手写 rem 换算繁琐且易错，`postcss-pxtorem` 可自动完成 `px → rem`：

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 100, // 基准 100px
      propList: ['*'], // 所有属性都转换
      selectorBlackList: [], // 排除的类
    },
  },
}
```

## 4. vw / vh 适配方案

`vw`/`vh` 直接相对视口，无需 JS 参与：

| 单位   | 含义                    |
| ------ | ----------------------- |
| `vw`   | 视口宽度的 1%           |
| `vh`   | 视口高度的 1%           |
| `vmin` | `vw` 与 `vh` 中的较小值 |
| `vmax` | `vw` 与 `vh` 中的较大值 |

```css
/* 设计稿 375px 宽下，元素 200px → 200/375 ≈ 53.33vw */
.box {
  width: 53.33vw;
}
```

### 4.1 vw 方案的边界问题

- **大屏放大过度**：iPad 横屏等大视口下，`vw` 会等比放大，元素可能过大。
- **解决**：给根容器设 `max-width` 兜底，或「`vw` + `rem` 混合」。

```css
.page {
  width: 100vw;
  max-width: 750px; /* 超过 750px 不再放大，居中 */
  margin: 0 auto;
}
```

### 4.2 用 vw 实现 rem 效果（无需 JS）

```css
/* 把根字体设为视口宽度的比例，rem 即可随视口缩放 */
html {
  font-size: calc(100vw / 3.75);
} /* 375px 设计稿，100px 基准 */
```

## 5. 适配方案对比与选型

| 方案     | 优点             | 缺点                   | 适用场景               |
| -------- | ---------------- | ---------------------- | ---------------------- |
| rem + JS | 可控性强、兼容好 | 需 JS、有闪动风险      | 需要精细控制的整站     |
| vw/vh    | 纯 CSS、无 JS    | 大屏放大过度、兼容略差 | 新项目、配合 max-width |
| 媒体查询 | 精确断点、灵活   | 代码量随断点增多       | 复杂响应式布局         |
| 百分比   | 简单             | 依赖父元素、难精确     | 基础流式布局           |

## 6. 响应式图片

不同 DPR 屏幕加载不同分辨率的图片，兼顾清晰度与流量：

### 6.1 按 DPR 选择

```html
<img
  srcset="img@1x.png 1x, img@2x.png 2x, img@3x.png 3x"
  src="img@1x.png"
  alt="示例图"
/>
```

### 6.2 按宽度选择

```html
<img
  srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 480px, 800px"
  src="medium.jpg"
/>
```

### 6.3 用 `<picture>` 按条件切换

```html
<picture>
  <source srcset="dark.png" media="(prefers-color-scheme: dark)" />
  <img src="light.png" alt="主题图" />
</picture>
```

## 7. 常见问题 (FAQ)与 故障排除

### 7.1 为什么设计稿 750px 宽，手机却是 375px？

设计稿通常以 **2 倍图** 出图（750px），对应逻辑宽度 375px。适配时要把设计稿尺寸**除以 2**（或 DPR）再换算成 CSS 值，或直接在 rem 换算中处理这个比例。

### 7.2 rem 方案下页面为什么会「闪一下」？

根字体由 JS 设置，若放在 `<body>` 底部或延迟执行，首屏会先按默认 16px 渲染再跳变。

**解决**：把设置脚本放在 `<head>` 中**同步执行**，或使用 CSS 的 `vw` 方案彻底避免。

### 7.3 `100vh` 在移动端为什么比视口高？

移动端浏览器地址栏收起/展开会改变可视高度，`100vh` 取的是「包含被地址栏遮挡区域」的高度。可用 `100dvh`（动态视口高度）或 `window.innerHeight` 兜底。
