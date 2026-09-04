# requestAnimationFrame 与 requestIdleCallback

动画与高性能渲染的核心是「**和浏览器刷新节奏对齐**」。`requestAnimationFrame`（rAF）让回调在浏览器下一次重绘前执行，`requestIdleCallback` 则利用帧与帧之间的空闲时间执行低优先级任务。

**一句话理解**：**「rAF 把动画『焊』在 60fps 的刷新帧上，requestIdleCallback 把杂活塞进每帧的空闲缝隙。」**

## 1. 为什么动画要用 rAF 而不是 `setTimeout` / `setInterval`

| 维度       | `setTimeout(16)` / `setInterval` | `requestAnimationFrame`              |
| ---------- | -------------------------------- | ------------------------------------ |
| 执行时机   | 定时器触发，与屏幕刷新**不同步** | 浏览器**下次重绘之前**，与刷新帧同步 |
| 帧率       | 可能丢帧、跳帧、撕裂             | 自动匹配显示器刷新率（通常 60fps）   |
| 后台标签页 | 仍可能执行（浪费性能）           | 自动暂停，切回后恢复                 |
| 节流       | 需手动处理                       | 浏览器自动节流                       |
| 精度       | 受 4ms 钳制、可能堆积            | 回调参数 `timestamp` 高精度          |

**结论**：凡是「逐帧更新视觉」的场景（动画、滚动、拖拽），一律用 rAF。

## 2. 一帧的完整渲染流程

理解 rAF 的时机，需要先了解浏览器一帧内做了什么：

```
每一帧（约 16.7ms @60fps）：
  → 输入事件处理（input）
  → requestAnimationFrame 回调
  → 布局 (Layout / Reflow)
  → 绘制 (Paint)
  → 合成 (Composite)
  → [空闲时间] → requestIdleCallback
```

rAF 回调在**布局之前**执行，所以「读样式 → 写样式」在 rAF 里能**避免强制同步布局**（读写分离）。

## 3. `requestAnimationFrame` 用法

### 3.1 基本循环

```javascript
function animate(timestamp) {
  // timestamp：回调触发时刻的高精度时间戳（毫秒）
  box.style.transform = `translateX(${timestamp % 1000}px)`

  requestAnimationFrame(animate) // 递归调度下一帧
}
requestAnimationFrame(animate)
```

### 3.2 停止动画

```javascript
let rafId
function animate(t) {
  rafId = requestAnimationFrame(animate)
}
rafId = requestAnimationFrame(animate)

// 停止
cancelAnimationFrame(rafId)
```

### 3.3 基于时间增量做平滑动画

直接用 `timestamp` 累加会在高刷屏（120fps）下「变快」，应基于**时间增量**计算：

```javascript
let start = null
function move(timestamp) {
  if (start === null) start = timestamp
  const progress = (timestamp - start) / 1000 // 秒

  box.style.left = Math.min(progress * 200, 200) + 'px' // 每秒移动 200px

  if (progress < 1) requestAnimationFrame(move)
}
requestAnimationFrame(move)
```

### 3.4 实现一个通用补间动画

```javascript
function tween({ duration, from, to, onUpdate }) {
  const start = performance.now()
  function step(now) {
    const t = Math.min((now - start) / duration, 1)
    const eased = t * (2 - t) // easeOut
    onUpdate(from + (to - from) * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

tween({
  duration: 1000,
  from: 0,
  to: 200,
  onUpdate: v => (box.style.left = v + 'px'),
})
```

## 4. `requestIdleCallback`：利用空闲时间

一帧的渲染流程是：事件处理 → rAF → 布局 → 绘制 → 合成。若一帧内这些工作提前完成，到下一帧之间就有「空闲时间」，`requestIdleCallback` 用于执行**不紧急的**任务。

```javascript
requestIdleCallback(
  deadline => {
    // deadline.timeRemaining()：本帧剩余空闲时间
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift()
      task()
    }
  },
  { timeout: 1000 },
) // 若一直空闲，最多等 1000ms 强制执行
```

### 4.1 `deadline` 对象

| 属性              | 说明                     |
| ----------------- | ------------------------ |
| `timeRemaining()` | 本帧剩余空闲时间（毫秒） |
| `didTimeout`      | 是否因超时被强制执行     |

### 4.2 适用场景

预加载、数据上报、埋点、非关键初始化、[虚拟列表](/performanceOptimization/virtualList) 的懒计算。

### 4.3 兼容性垫片

`requestIdleCallback` 目前**只有 Chrome 支持**，Firefox/Safari 需用 `setTimeout` 降级：

```javascript
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    const start = Date.now()
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      })
    }, 1)
  }
```

## 5. 帧调度三兄弟的定位

| API                      | 时机         | 用途                 |
| ------------------------ | ------------ | -------------------- |
| `setTimeout/setInterval` | 定时器队列   | 普通异步、延迟任务   |
| `requestAnimationFrame`  | 下次重绘前   | 动画、视觉更新       |
| `requestIdleCallback`    | 帧的空闲时间 | 非紧急、可延后的杂活 |

## 6. 常见问题 (FAQ)

### 6.1 rAF 的回调一定每秒执行 60 次吗？

**不一定**。rAF 匹配**显示器的刷新率**：60Hz 屏约 60 次/秒，120Hz 屏约 120 次/秒，且后台标签页会暂停。因此动画逻辑必须**基于时间增量**而非固定步长。

### 6.2 多个 rAF 回调会在同一帧执行吗？

会。浏览器在一帧内会**合并**所有 rAF 回调一起执行（在布局/绘制之前），这也是它能保持流畅的原因之一。

### 6.3 为什么 `setInterval(fn, 0)` 实际不是 0ms？

浏览器对 `setTimeout/setInterval` 有 **4ms 的最小间隔钳制**（嵌套层级越深钳制越大），且它们受事件循环调度影响，无法保证精确。需要「尽快」或「跟帧」用 rAF，需要「空闲」用 requestIdleCallback。

### 6.4 rAF 里读样式再写样式为什么能避免强制回流？

rAF 回调在**布局之前**执行，本帧内所有 rAF 的「读」都读到上一帧的结果，「写」都累积到本帧的布局一次性计算，避免了「读-写-读-写」触发的多次强制同步布局。

## 7. 总结

- 动画用 rAF：与刷新帧同步、自动暂停、高精度时间戳。
- 动画逻辑基于**时间增量**，避免不同刷新率下速度不一致。
- 非紧急任务用 `requestIdleCallback`，注意兼容性垫片。
- 三兄弟分工明确：定时器管异步、rAF 管动画、idleCallback 管杂活。
