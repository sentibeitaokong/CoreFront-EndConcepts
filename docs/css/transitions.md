#  过渡 (Transitions)

CSS 过渡是网页动效的入门基石。它允许元素从一种样式状态**平滑地**改变为另一种样式状态，而不是瞬间突变。


## 1. 核心概念

过渡必须满足两个条件才能触发：
1.  **初始状态** 和 **结束状态** 必须明确（例如 `width: 100px` 变为 `width: 200px`）。
2.  必须由一个 **触发源** 激活（如 `:hover`、`:focus`、`:active`、媒体查询断点变化、或者 JS 修改了 class/style）。

**注意**：`display: none` 到 `display: block` **无法**产生过渡（因为 `none` 状态下元素不存在渲染树中）。

## 2. 属性详解

### 2.1 简写属性 (`transition`)

这是最常用的写法。
**语法**：`transition: [property] [duration] [timing-function] [delay];`

```css
/* 让宽度在 1秒内 匀速变化，延迟 0.5秒开始 */
transition: width 1s linear 0.5s;

/* 多个属性同时过渡 (逗号分隔) */
transition: width 0.5s ease, background-color 1s linear;

/* 所有支持动画的属性都过渡 (最省事，但性能稍差) */
transition: all 0.3s ease-in-out;
```

### 2.2 拆分属性

| 属性 (Property)              | 描述                                                   | 语法 / 示例                                                                                                                          |
|----------------------------|------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `transition`                 | 简写属性 (推荐)。顺序：Property -> Duration -> Timing -> Delay | transition: width 0.5s ease-in 1s;支持多组：transition: opacity 0.3s, transform 0.5s;                                                 |
| `transition-property`        | 过渡属性名称。指定哪些 CSS 属性需要动效。                              | all (默认，所有能动的都动)none (禁用过渡)width, background-color, transform 等具体属性名。                                                            |
| `transition-duration`        | 持续时间 (必填)。过渡完成需要多久。                                  | 0.5s (秒)500ms (毫秒)默认 0s (无动画)。                                                                                                   |
| `transition-timing-function` | 缓动函数 (速度曲线)。定义动画过程中的快慢节奏。                            | ease (默认，慢-快-慢)linear (匀速)ease-in (加速启动)ease-out (减速刹车)ease-in-out (平滑起止)cubic-bezier(n,n,n,n) (自定义贝塞尔曲线)steps(n) (阶梯式跳变，适合逐帧动画) |
| `transition-delay`           | 延迟时间。等待多久后才开始动。                                      | 1s, 200ms。默认 0s (立即开始)。负值 (-0.5s)：立即开始，但跳过前 0.5s 的动画过程。                                                                          |


## 3. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么 `display: none` 变 `block` 没有过渡效果？
**原因**：`display` 属性不是一个可动画的属性。当元素从 `none` 变为 `block` 时，浏览器会立即绘制它，过渡系统来不及捕捉起始状态。

**解法**：
1.  使用 **`opacity`** (透明度) + `visibility` (可见性)。
    ```css
    .box {
      opacity: 0;
      visibility: hidden; /* 占位但不可见，且不响应点击 */
      transition: all 0.3s;
    }
    .box.show {
      opacity: 1;
      visibility: visible;
    }
    ```
2.  使用 JS 配合 `requestAnimationFrame` 强制重绘（较复杂）。

### Q2: `height: 0` 变 `height: auto` 为什么没动画？
**原因**：CSS 动画引擎无法计算 `auto` 的具体高度值，所以无法建立从 0 到 auto 的补间动画。

**解法**：
1.  **使用 `max-height`** (经典 Hack)。
    *   初始: `max-height: 0; overflow: hidden;`
    *   结束: `max-height: 1000px;` (设置一个肯定比实际内容大的值)。
    *   *缺点*：如果预设值太大，收起动画会有延迟感。
2.  **使用 `grid-template-rows`** (现代方案)。
    *   `0fr` -> `1fr`. (需父容器是 Grid 布局)。

### Q3: 为什么过渡结束后 `z-index` 突然跳变？
**原因**：`z-index` 是离散的整数，它支持过渡，但不是平滑的。它会在过渡时间的中点或者终点直接突变。

**解法**：如果需要层级动效，通常配合 `opacity` 或 `transform` 来视觉欺骗。

### Q4: 怎么让过渡只在“移入”时生效，“移出”时立即恢复？
**技巧**：将 `transition` 属性写在**触发状态**（如 `:hover`）里，而不是默认状态里。

```css
/* 默认状态：没有 transition，变化瞬间完成 */
.box { 
  background: red; 
}

/* Hover状态：定义 transition */
.box:hover {
  background: blue;
  transition: background 1s; /* 只在变成蓝色时有动画 */
}
/* 当鼠标移开，回到默认状态，因为默认状态没写 transition，所以瞬间变回红色 */
```
*反之，如果想“移入”快，“移出”慢，可以在默认状态和 hover 状态分别写不同的 `transition-duration`。*

### Q5: 性能优化？
尽量只过渡 **`transform`** 和 **`opacity`**。
*   `width`, `height`, `top`, `left`, `margin`: 会触发 **Layout (回流)**，每帧都要重排版，CPU 压力大，容易掉帧。
*   `transform`, `opacity`: 仅触发 **Composite (合成)**，由 GPU 处理，极度流畅。

## 4. 高级技巧：硬件加速

如果你发现移动端过渡有卡顿或闪烁。

```css
.box {
  /* 开启 GPU 加速的黑魔法 */
  transform: translateZ(0); 
  /* 或者 */
  will-change: transform;
}
```

## 5. 调试技巧

在 Chrome DevTools 中，有一个 **Animations** 面板。它可以录制页面上的所有过渡和动画，允许你慢速回放 (10% 速度) 来检查细节。