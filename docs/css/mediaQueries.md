# CSS 媒体查询 (Media Queries)

媒体查询是 **响应式网页设计 (Responsive Web Design)** 的核心引擎。它允许我们根据设备的特性（如屏幕宽度、分辨率、深色模式等）应用不同的 CSS 样式。

## 1. 基础语法

```css
@media media-type and (media-feature-rule) {
  /* 当条件满足时，这里的 CSS 才会生效 */
  .box {
    background: red;
  }
}
```

### 1.1 媒体类型 (Media Types)
虽然有很多类型，但在现代开发中常用的只有三个：
*   **`all`** (默认): 适用于所有设备。
*   **`screen`**: 适用于电脑屏幕、平板、手机等有屏幕的设备。
*   **`print`**: 适用于**打印机**或打印预览模式（常用于去掉背景色、导航栏）。

### 1.2 逻辑操作符
*   **`and`**: 必须同时满足多个条件。
*   **`,` (逗号)**: 代表 **OR (或)**。只要满足其中一个条件就生效。
*   **`not`**: 取反。
*   **`only`**: 仅在支持媒体查询的浏览器中生效（现代开发已很少刻意使用）。

## 2. 核心检测特性 (Media Features)

### 2.1 视口尺寸 (最常用)
用于实现响应式布局。
*   **`min-width`**: “大于等于”。适用于 **移动优先 (Mobile First)** 策略。
*   **`max-width`**: “小于等于”。适用于 **桌面优先 (Desktop First)** 策略。

```css
/* 屏幕宽度 >= 768px 时生效 */
@media screen and (min-width: 768px) { ... }

/* 屏幕宽度 <= 600px 时生效 */
@media screen and (max-width: 600px) { ... }
```

### 2.2 屏幕方向
*   **`orientation: portrait`**: 竖屏（高 > 宽）。
*   **`orientation: landscape`**: 横屏（宽 > 高）。

### 2.3 用户偏好 (现代必备)
*   **`prefers-color-scheme`**: 检测用户系统是否开启了**深色模式**。
    ```css
    @media (prefers-color-scheme: dark) {
      body { background: #000; color: #fff; }
    }
    ```
*   **`prefers-reduced-motion`**: 检测用户是否开启了“减弱动态效果”（无障碍设计）。

## 3. 断点策略 (Breakpoints)

在实际开发中，我们通常设定几个标准的“断点”来适配不同设备。

### 3.1 移动优先 (Mobile First) —— **强烈推荐**
先写手机端的默认样式，然后用 `min-width` 一层层往大屏幕覆盖。

```css
/* 1. 默认样式 (手机端 < 576px) */
.container { width: 100%; }

/* 2. 平板 (>= 576px) */
@media (min-width: 576px) {
  .container { width: 540px; }
}

/* 3. 桌面显示器 (>= 768px) */
@media (min-width: 768px) {
  .container { width: 720px; }
}

/* 4. 大屏桌面 (>= 992px) */
@media (min-width: 992px) {
  .container { width: 960px; }
}
```

### 3.2 桌面优先 (Desktop First)
先写大屏幕样式，用 `max-width` 往小屏幕覆盖。
*   *缺点：CSS 代码通常会比移动优先更冗余，且覆盖逻辑较复杂。*

## 4. 现代语法：范围查询 (Range Context)

**CSS Media Queries Level 4** 引入了更直观的数学符号（`<`, `>`, `=`)，目前主流现代浏览器（Chrome 104+, Safari 16.4+, Firefox 63+）已支持。

**旧写法**:
```css
@media (min-width: 300px) and (max-width: 500px) { ... }
```

**新写法 (更易读)**:
```css
@media (300px <= width <= 500px) { ... }

@media (width >= 768px) { ... }
```

## 5. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么我的媒体查询在手机上完全无效？
**现象**: 模拟器里正常，真机上网页看起来像缩小版的桌面网页，字很小。

**原因**: 99.9% 是因为忘记加 **Viewport Meta 标签**。如果没有这行代码，手机浏览器会默认模拟 980px 的桌面宽度。

**解法**: 在 HTML `<head>` 中必须加上：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Q2: 为什么 `min-width` 和 `max-width` 样式冲突了？
**原因**: **CSS 书写顺序错误**。
在 CSS 中，如果优先级权重相同，**后写的覆盖先写的**。
*   **移动优先 (min-width)**: 必须**从小到大**写。
    *   (base) -> (min: 576) -> (min: 768) -> (min: 992)
*   **桌面优先 (max-width)**: 必须**从大到小**写。
    *   (base) -> (max: 992) -> (max: 768) -> (max: 576)

### Q3: 断点处的“1px 冲突”怎么处理？
**现象**: `max-width: 768px` 和 `min-width: 768px` 在刚好 768px 的设备上会同时生效，导致冲突。
**解法**:
1.  **错开 1px**: 使用 `max-width: 767px` 和 `min-width: 768px`。
2.  **小数精度**: `max-width: 767.98px` (Bootstrap 的做法)。
3.  **使用新语法**: `@media (width < 768px)` (小于，不包含等于)。

### Q4: 如何针对“高清屏/视网膜屏”写样式？
**场景**: 为了让 Logo 在 2x/3x 屏上更清晰。
```css
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .logo {
    background-image: url('logo@2x.png');
  }
}
```

### Q5: 能不能在 HTML 链接 CSS 时就用媒体查询？
**可以**。这是一种性能优化手段。如果条件不满足，浏览器依然会下载该 CSS 文件，但**不会阻塞渲染**，优先级非常低。
```html
<link rel="stylesheet" href="mobile.css" media="screen and (max-width: 600px)">
<link rel="stylesheet" href="print.css" media="print">
```