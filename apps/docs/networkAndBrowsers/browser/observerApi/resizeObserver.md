# ResizeObserver

监听元素的**内容盒**（content box）或边框盒尺寸变化，弥补了 `window.resize` 只能监听窗口、无法优雅监听单个元素尺寸的缺陷。

## 1. API 签名

```javascript
const observer = new ResizeObserver(callback) // 构造
observer.observe(target, options?)            // 开始观察某个元素
observer.unobserve(target)                    // 停止观察某个元素
observer.disconnect()                         // 停止全部观察
```

- `callback(entries, observer)`：尺寸变化回调，`entries` 为 `ResizeObserverEntry` 数组。
- **没有 `takeRecords()` 方法**：尺寸变化不会积压，直接由回调触发。

**`observe(target, options)` 配置项：**

| 选项  | 类型     | 默认值          | 说明                                                                    |
| ----- | -------- | --------------- | ----------------------------------------------------------------------- |
| `box` | `string` | `'content-box'` | 观察的盒模型：`content-box` / `border-box` / `device-pixel-content-box` |

## 2. 基本用法

```javascript
const box = document.querySelector('#chart-container')

const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { inlineSize, blockSize } = entry.contentBoxSize[0]
    console.log(`尺寸变化：${inlineSize} × ${blockSize}`)
    renderChart(inlineSize, blockSize) // 图表随容器自适应
  }
})

observer.observe(box, { box: 'border-box' }) // 默认 'content-box'，还支持 'device-pixel-content-box'
```

## 3. 字段速查

| 字段                        | 含义                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `target`                    | 被观察的元素                                                     |
| `contentRect`               | 内容盒的 DOMRect（`x` / `y` / `width` / `height`）               |
| `contentBoxSize`            | 内容盒尺寸数组（`inlineSize` / `blockSize`）                     |
| `borderBoxSize`             | 边框盒尺寸数组                                                   |
| `devicePixelContentBoxSize` | 按设备像素计算的物理尺寸（需 `box: 'device-pixel-content-box'`） |

> **注意：** `contentBoxSize` / `borderBoxSize` 是**数组**。对普通块级元素通常是单元素数组；但对于跨多行的内联元素，每个行盒对应一个尺寸项，数组会包含多个元素。

## 4. 关键点

- 监听的是**布局尺寸**（受 CSS、内容撑高等影响），无需像 `getBoundingClientRect` 那样手动轮询。
- 回调在**布局后、绘制前**触发，适合做与尺寸绑定的渲染。
- 元素被移除、或设为 `display: none` 时也会触发（尺寸变为 0），可据此释放资源。
- 初始 `observe` 时即会触发一次回调，可用于首屏初始化。

> **注意：** 若回调内同步修改了观察元素的尺寸，可能引发「`ResizeObserver loop completed with undelivered notifications`」警告。原因是循环触发了无限回环——此时应把尺寸相关渲染放到 `requestAnimationFrame` 中执行。

## 5. 示例：图表自适应

```javascript
// 场景：ECharts 图表容器尺寸变化时自动重绘，解决 window.resize 监听不到布局变化的问题
import * as echarts from 'echarts'

const container = document.querySelector('#chart')
const chart = echarts.init(container)

let rafId = null
const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    // 尺寸渲染放入 rAF，避免回调内同步改尺寸引发 loop 警告
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      chart.resize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
  }
})

observer.observe(container)
```

## 6. 典型场景

- 图表（ECharts / Canvas）随容器自适应重绘。
- 响应式组件：根据容器宽度切换布局（容器查询的 JS 兜底）。
- 文本溢出、多行省略的精确计算。
- 监听 iframe 或自定义元素的内部尺寸变化。
- 监听根元素（`document.documentElement`）以近似获取视口尺寸变化（配合移动端地址栏收起）。
