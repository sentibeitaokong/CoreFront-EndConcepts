# CSS 动画 (Animations)

与 `transition`（过渡）不同，`transition` 只能处理“从 A 到 B”的简单变化，且需要外部触发（如 hover）。而 **`animation`** 配合 **`@keyframes`** 可以实现**多步骤、自动运行、循环播放**的复杂动效。

## 1. 核心剧本：`@keyframes`

关键帧 (`@keyframes`) 是动画的灵魂，它定义了动画在不同时间节点上的样式。

### 1.1 基础语法
```css
@keyframes my-move {
  /* 起始 (0%) */
  from { left: 0; }
  
  /* 中间过程 */
  50%  { left: 100px; transform: rotate(180deg); }
  
  /* 结束 (100%) */
  to   { left: 0; transform: rotate(360deg); }
}
```
*   **百分比**: `0%` 到 `100%`。你可以定义任意多个百分比节点。
*   **补间**: 浏览器会自动计算两个百分比之间的样式过渡（Tweening）。

## 2. 导演指令：`animation` 属性

定义好剧本后，需要通过 `animation` 属性将其应用到元素上。

### 2.1 简写属性 (Shorthand)
**语法顺序**：
`name duration timing-function delay iteration-count direction fill-mode play-state`

**⚠️ 关键规则**：
CSS 依靠数值的位置来区分时间。
*   **第 1 个时间值** = **持续时间** (`duration`)
*   **第 2 个时间值** = **延迟时间** (`delay`)

```css
/* 执行 move 动画，耗时2s，延迟1s，匀速，无限循环，往返播放 */
animation: move 2s 1s linear infinite alternate;
```

### 2.2 属性拆解 API

| 属性 | 描述 | 常用值 / 技巧 |
| :--- | :--- | :--- |
| **`animation-name`** | 对应 `@keyframes` 的名字。 | `bounce`, `fade-in` |
| **`animation-duration`** | **必填**。动画时长。 | `0.5s`, `200ms`. 默认为 `0s` (不动)。 |
| **`animation-timing-function`** | 速度曲线。 | `ease` (默认), `linear` (匀速), `steps(n)` (逐帧)。 |
| **`animation-delay`** | 延迟多久开始。 | **负值技巧**: `-1s` 表示立即开始，但直接从动画的第 1s 处开始播放。 |
| **`animation-iteration-count`** | 播放次数。 | `1` (默认), `3`, **`infinite`** (无限循环)。 |
| **`animation-direction`** | 播放方向。 | `normal` (每次重头播), `reverse` (倒着播), **`alternate`** (往返/乒乓球效果)。 |
| **`animation-fill-mode`** | **填充模式 (状态停留)**。 | `none` (回到初始), **`forwards`** (停在最后一帧), `backwards` (等待时应用第一帧)。 |
| **`animation-play-state`** | 播放/暂停。 | `running`, **`paused`** (常用于 JS 控制或 Hover 暂停)。 |

## 3. 常见问题 (FAQ) 与 避坑指南

### Q1: 动画结束后，元素为什么“闪”回了原地？
**现象**: 一个方块从左移到右，动画一结束，它瞬间跳回了左边。

**原因**: 默认情况下 (`fill-mode: none`)，动画结束后，元素会移除所有动画样式，恢复到 CSS 初始定义的状态。

**解法**: 设置 **`animation-fill-mode: forwards;`**。这会让元素在动画结束后，**保持**在最后一帧（100%）的状态。

### Q2: 如何实现“逐帧动画” (像 GIF 一样)？
**场景**: 雪碧图动画、打字机效果。

**问题**: 默认的 `linear` 或 `ease` 会让图片位置平滑移动，导致看到图片滑动的过程，而不是切换。

**解法**: 使用 **`steps()`** 函数。
```css
/* 假设雪碧图有 10 个动作，总宽 500px */
.sprite {
  width: 50px;
  background: url(sprite.png);
  animation: walk 1s steps(10) infinite; /* 硬切成 10 份 */
}
@keyframes walk {
  to { background-position: -500px 0; }
}
```

### Q3: 动画太卡顿，CPU 占用高？
**原因**: 你可能在 `@keyframes` 里改变了 `margin`, `top`, `left`, `width`, `box-shadow` 等属性。这些会触发 **重排 (Reflow)**，每一帧都要重新计算布局。

**解法**: **只做 `transform` 和 `opacity` 的动画**。
*   用 `transform: translate(x, y)` 代替 `top/left`。
*   用 `transform: scale()` 代替 `width/height`。
*   这些属性由 GPU 处理 (Composite)，性能极高。

### Q4: 如何用 JS 重新触发动画 (Replay)？
**痛点**: 简单的 `classList.add` 和 `remove` 如果在同一帧执行，浏览器会合并操作，导致动画不重播。

**解法**: **强制重绘 (Force Reflow)**。
```javascript
const box = document.querySelector('.box');

// 1. 移除 class
box.classList.remove('anim');

// 2. 触发重绘 (读取 offsetWidth 会强制浏览器计算布局)
void box.offsetWidth; 

// 3. 重新添加 class
box.classList.add('anim');
```

### Q5: `display: none` 的元素显示时没有动画？
**原因**: 元素从 `none` 变 `block` 时，浏览器没有“之前的状态”来做过渡。

**解法**: 使用关键帧控制 `opacity` 从 0 到 1。

## 4. 实战代码：加载动画 (Loading Spinner)

这是最经典的 CSS 动画应用。

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;      /* 浅灰底环 */
  border-top: 4px solid #3498db;  /* 蓝色进度条 */
  border-radius: 50%;             /* 变圆 */
  
  /* 核心：1秒，匀速，无限循环 */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { 
    transform: rotate(0deg); 
  }
  100% { 
    transform: rotate(360deg); 
  }
}
```

## 5. 高级技巧：多重动画

你可以给一个元素同时应用多个动画，用逗号分隔。

```css
/* 同时执行：旋转 + 淡入 */
.box {
    animation:
            spin 2s linear infinite,  /* 旋转是无限的 */
            fade-in 1s ease forwards; /* 淡入只执行一次 */
}
```