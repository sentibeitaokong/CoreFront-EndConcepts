# 过渡 (Transitions)

CSS 过渡是网页动效的入门基石。它允许元素从一种样式状态**平滑地**改变为另一种样式状态，而不是瞬间突变。

## 1. 核心概念

过渡必须满足两个条件才能触发：

- **初始状态** 和 **结束状态** 必须明确（例如 `width: 100px` 变为 `width: 200px`）。
- 必须由一个 **触发源** 激活（如 `:hover`、`:focus`、`:active`、媒体查询断点变化、或者 JS 修改了 class/style）。

**注意**：`display: none` 到 `display: block` **无法**产生过渡（因为 `none` 状态下元素不存在渲染树中）。

**哪些属性可以过渡？** 关键区别在于属性是**数值型**（能算出中间值）还是**离散型**（只有固定的几个状态）：

| ✅ 可以过渡（数值型，能算出中间值）             | ❌ 不可以过渡（离散型，无中间值） |
| :---------------------------------------------- | :-------------------------------- |
| `width`、`height`、`margin`、`padding`          | `display`（block ↔ none）         |
| `opacity`、`color`、`background-color`          | `position`（static ↔ absolute）   |
| `transform`（`translate` / `scale` / `rotate`） | `background-image`（url 切换）    |
| `border-radius`、`box-shadow`、`filter`         | `font-family`、`font-style`       |
| `font-size`、`letter-spacing`、`line-height`    | `float`、`clear`                  |

## 2. 属性详解

### 2.1 简写属性 (`transition`)

这是最常用的写法。
**语法**：`transition: [property] [duration] [timing-function] [delay];`

```css
/* 让宽度在 1秒内 匀速变化，延迟 0.5秒开始 */
transition: width 1s linear 0.5s;

/* 多个属性同时过渡 (逗号分隔) */
transition:
  width 0.5s ease,
  background-color 1s linear;

/* 所有支持动画的属性都过渡 (最省事，但性能稍差) */
transition: all 0.3s ease-in-out;
```

### 2.2 拆分属性

| 属性 (Property)              | 描述                                                           | 语法 / 示例                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transition`                 | 简写属性 (推荐)。顺序：Property -> Duration -> Timing -> Delay | transition: width 0.5s ease-in 1s;支持多组：transition: opacity 0.3s, transform 0.5s;                                                                                    |
| `transition-property`        | 过渡属性名称。指定哪些 CSS 属性需要动效。                      | all (默认，所有能动的都动)none (禁用过渡)width, background-color, transform 等具体属性名。                                                                               |
| `transition-duration`        | 持续时间 (必填)。过渡完成需要多久。                            | 0.5s (秒)500ms (毫秒)默认 0s (无动画)。                                                                                                                                  |
| `transition-timing-function` | 缓动函数 (速度曲线)。定义动画过程中的快慢节奏。                | ease (默认，慢-快-慢)linear (匀速)ease-in (加速启动)ease-out (减速刹车)ease-in-out (平滑起止)cubic-bezier(n,n,n,n) (自定义贝塞尔曲线)steps(n) (阶梯式跳变，适合逐帧动画) |
| `transition-delay`           | 延迟时间。等待多久后才开始动。                                 | 1s, 200ms。默认 0s (立即开始)。负值 (-0.5s)：立即开始，但跳过前 0.5s 的动画过程。                                                                                        |

### 2.3 缓动函数 (timing-function) 详解

缓动函数决定过渡的速度曲线，即"**快慢节奏**"。

| 值                      | 速度曲线                 | 适用场景                   |
| :---------------------- | :----------------------- | :------------------------- |
| `linear`                | 匀速                     | 旋转、进度条等恒定速度     |
| `ease`                  | 慢 → 快 → 慢（默认值）   | 大多数通用场景             |
| `ease-in`               | 慢 → 快（加速启动）      | 元素进入 / 加速            |
| `ease-out`              | 快 → 慢（减速刹车）      | 元素退出 / 停下            |
| `ease-in-out`           | 慢 → 快 → 慢（平滑起止） | 往返运动                   |
| `cubic-bezier(n,n,n,n)` | 自定义贝塞尔曲线         | 精确控制节奏（如回弹效果） |
| `steps(n)`              | 阶梯式跳变               | 逐帧动画、打字机           |

**`cubic-bezier` 自定义曲线**：`cubic-bezier(x1, y1, x2, y2)`，其中 `x` 取值在 `0~1` 之间，`y` 可以超出范围做出回弹。

```css
transition: width 1s cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 回弹效果 */
```

**`steps` 阶梯式跳变**（适合逐帧动画）：

```css
transition: background-position 1s steps(10);
```

## 3. 经典应用场景代码

### 3.1 按钮 hover 效果

```css
.btn {
  background: #3498db;
  transition:
    background 0.3s ease,
    transform 0.2s ease;
}
.btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}
```

### 3.2 卡片悬浮上浮

```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
}
.card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px);
}
```

### 3.3 淡入淡出（配合 `visibility`）

```css
.tooltip {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s ease,
    visibility 0.3s;
}
.wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
```

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

## 5. 常见问题 (FAQ) 与 故障排除

### 5.1 为什么 `display: none` 变 `block` 没有过渡效果？

**原因**：`display` 属性不是一个可动画的属性。当元素从 `none` 变为 `block` 时，浏览器会立即绘制它，过渡系统来不及捕捉起始状态。

**解决**：使用 **`opacity`** (透明度) + `visibility` (可见性)。

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

### 5.2 `height: 0` 变 `height: auto` 为什么没动画？

**原因**：CSS 动画引擎无法计算 `auto` 的具体高度值，所以无法建立从 0 到 auto 的补间动画。

**解决**：**使用 `max-height`** (经典 Hack)。

- 初始: `max-height: 0; overflow: hidden;`
- 结束: `max-height: 1000px;` (设置一个肯定比实际内容大的值)。
- _缺点_：如果预设值太大，收起动画会有延迟感。

### 5.3 为什么过渡结束后 `z-index` 突然跳变？

**原因**：`z-index` 是离散的整数，它支持过渡，但不是平滑的。它会在过渡时间的中点或者终点直接突变。

**解决**：如果需要层级动效，通常配合 `opacity` 或 `transform` 来视觉欺骗。

### 5.4 怎么让过渡只在“移入”时生效，“移出”时立即恢复？

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

_反之，如果想“移入”快，“移出”慢，可以在默认状态和 hover 状态分别写不同的 `transition-duration`。_

### 5.5 性能优化？

尽量只过渡 **`transform`** 和 **`opacity`**。

- `width`, `height`, `top`, `left`, `margin`: 会触发 **Layout (回流)**，每帧都要重排版，CPU 压力大，容易掉帧。
- `transform`, `opacity`: 仅触发 **Composite (合成)**，由 GPU 处理，极度流畅。
