# ResizeObserver

监听元素的**内容盒**（content box）或边框盒尺寸变化，弥补了 `window.resize` 只能监听窗口、无法优雅监听单个元素尺寸的缺陷。

## 1. 方法与构造选项

```js
const observer = new ResizeObserver(callback) // 构造
observer.observe(target, { box: 'border-box' }) // 开始观察某个元素（第二个参数可选）
observer.unobserve(target) // 停止观察某个元素
observer.disconnect() // 停止全部观察
```

[width(37,21,13,29)]

| 方法                           | 参数                          | 返回值      | 说明                                            |
| :----------------------------- | :---------------------------- | :---------- | :---------------------------------------------- |
| `new ResizeObserver(callback)` | `callback(entries, observer)` | 实例        | 只注册回调；回调在**布局后、绘制前**触发        |
| `observe(target, options?)`    | 目标元素、`{ box }`           | `undefined` | 开始观察；初始 `observe` 后一定会先触发一次回调 |
| `unobserve(target)`            | 目标元素                      | `undefined` | 只停止这一个目标，其余目标继续生效              |
| `disconnect()`                 | -                             | `undefined` | 停止全部观察，之后要重新 `observe`              |

- **没有 `takeRecords()` 方法**：尺寸变化不会积压，也不会像 `MutationObserver` 那样合并成批量快照，变化直接由回调派发。
- `options` 是**按目标**指定的，同一个实例可以让不同元素观察不同的盒子。

**`observe(target, options)` 配置项：**

[width(13,13,23,51)]

| 选项  | 类型     | 默认值          | 说明                                                                    |
| ----- | -------- | --------------- | ----------------------------------------------------------------------- |
| `box` | `string` | `'content-box'` | 观察的盒模型：`content-box` / `border-box` / `device-pixel-content-box` |

### 1.1 `box` 三种取值怎么选

[width(35,26,39)]

| `box` 取值                   | 观察的盒子                         | 典型用途                                          |
| :--------------------------- | :--------------------------------- | :------------------------------------------------ |
| `'content-box'`（默认）      | 内容盒：不含 `padding` 与 `border` | 通用自适应（图表、组件内部布局）                  |
| `'border-box'`               | 边框盒：含 `padding` 与 `border`   | 与 `offsetWidth` 对齐、判断元素整体占位是否变化   |
| `'device-pixel-content-box'` | 内容盒在**设备像素**下的物理尺寸   | Canvas 高清渲染：按物理像素设置画布尺寸，避免模糊 |

```js
// Canvas 高清渲染：CSS 像素 × devicePixelRatio 未必是整数，
// 直接读 device-pixel-content-box 才能拿到精确的物理像素值
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    //用 inlineSize / blockSize 而不是宽高,可无视横竖排的影响
    const { inlineSize, blockSize } = entry.devicePixelContentBoxSize[0]
    canvas.width = inlineSize // 画布尺寸：物理像素
    canvas.height = blockSize
    // 绘制仍按 CSS 像素坐标来，所以再设一次缩放变换（用 setTransform 避免重复叠加）
    ctx.setTransform(
      inlineSize / entry.contentRect.width,
      0,
      0,
      blockSize / entry.contentRect.height,
      0,
      0,
    )
  }
})

observer.observe(canvas, { box: 'device-pixel-content-box' })
```

> **注意：** `'device-pixel-content-box'` 主要由 Chrome 支持，Safari / Firefox 尚未实现。传入浏览器不认识的 `box` 取值时，`observe()` 会**同步抛出 `TypeError`**（拼错值也一样），所以生产代码要先做能力检测再决定用哪个盒子：

```js
// 能力检测：探测失败时 observe 会抛错，记得 disconnect 掉探测用的实例
function supportsDevicePixelBox() {
  const probe = new ResizeObserver(() => {})
  try {
    probe.observe(document.body, { box: 'device-pixel-content-box' })
    return true
  } catch {
    return false
  } finally {
    probe.disconnect()
  }
}
```

## 2. 基本用法

```js
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

`entries` 里只会包含**本次发生变化的目标**，所以观察多个元素时要靠 `entry.target` 区分；只观察一个元素时可以直接读 `entries[0]`。

## 3. 字段速查

[width(34,66)]

| 字段                        | 含义                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `target`                    | 被观察的元素                                                     |
| `contentRect`               | 内容盒的 DOMRect（`x` / `y` / `width` / `height`）               |
| `contentBoxSize`            | 内容盒尺寸数组（`inlineSize` / `blockSize`）                     |
| `borderBoxSize`             | 边框盒尺寸数组                                                   |
| `devicePixelContentBoxSize` | 按设备像素计算的物理尺寸（需 `box: 'device-pixel-content-box'`） |

> **注意：** `contentBoxSize` / `borderBoxSize` 是**数组**。对普通块级元素通常是单元素数组；但对于跨多行的内联元素，每个行盒对应一个尺寸项，数组会包含多个元素。取值用 `[0]`，多行内联场景需遍历数组。

## 4. 关键点

- 监听的是**布局尺寸**（受 CSS、内容撑高等影响），无需像 `getBoundingClientRect` 那样手动轮询。
- 回调在**布局后、绘制前**触发，读到的都是最终布局值，适合做与尺寸绑定的渲染。
- 初始 `observe` 后**一定会触发一次回调**，可用于首屏初始化；此后只有尺寸真的变化才会再触发。
- 元素被移除、或设为 `display: none` 时会带着 0 尺寸触发，可据此暂停渲染、销毁图表实例、取消动画。
- 回调只表示「被观察的盒子**可能**变了」，并不保证读到的数值与上次不同（同一帧可能收到多条通知）。要做重活（重绘、请求）时，先和上次的尺寸比对：

```js
let lastWidth = 0
const observer = new ResizeObserver(entries => {
  const { inlineSize } = entries[0].contentBoxSize[0]
  if (inlineSize === lastWidth) return // 数值没变，跳过重绘
  lastWidth = inlineSize
  render(inlineSize)
})
```

- **CSS 过渡 / 动画期间尺寸每帧都在变**，回调会逐帧触发，这类场景必须配合 `rAF` 去重，否则动画明显卡顿。
- 它**不提供「变化原因」**：视口变化只是间接引发了元素尺寸变化。要监听视口本身，观察 `document.documentElement` 比监听 `window.resize` 更可靠（能避开移动端地址栏收起的场景）。

## 5. 示例：图表自适应

```js
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

- **图表 / Canvas 自适应**：容器尺寸变化时重绘（ECharts、自定义 Canvas），渲染放进 `requestAnimationFrame`。
- **虚拟列表的动态行高**：测量每一项的真实高度写入缓存，再重算总高度与可见区间——比固定行高估算准确得多，是长列表滚动精度的关键。
- **瀑布流 / 网格重排**：卡片或容器尺寸变化后重新分配列位置，回调里只记录待重排项，实际布局放 `rAF`。
- **响应式组件的 JS 兜底**：CSS 容器查询覆盖不到、或需要 JS 分支时，按容器宽度切换布局。
- **文本溢出与多行省略的计算**：拿到精确的内容盒尺寸判断是否溢出、要不要显示「展开」按钮。
- **拖拽面板（SplitPane / 侧边栏折叠）**：拖动过程中实时重排内容，回调里配合 `rAF` 去重，否则每帧会布局多次。
- **iframe / 自定义元素的内部尺寸**：跨文档拿不到 `window.resize`，直接观察 `iframe` 元素本身；自定义元素则观察 `shadowRoot` 内的根节点。
- **近似监听视口变化**：观察 `document.documentElement`，能覆盖移动端地址栏收起等 `window.resize` 漏报的场景。

## 7. 常见问题 (FAQ)

### 7.1 ResizeObserver、`window.resize`、CSS 容器查询，该用哪个？

[width(18,32,50)]

| 方案             | 能观察到                                       | 适用判断                                         |
| :--------------- | :--------------------------------------------- | :----------------------------------------------- |
| `window.resize`  | 只有**视口**尺寸变化                           | 布局级重算，但移动端地址栏收起等场景可能不触发   |
| `ResizeObserver` | **任意元素**的尺寸变化（含被内容撑高、被挤压） | 需要在 JS 里拿到尺寸才能干活（图表重绘、Canvas） |
| CSS 容器查询     | 元素尺寸变化时的**纯样式**响应                 | 能用 CSS 表达就不用 JS，性能与可维护性都更好     |

选择顺序：**能用容器查询解决就交给 CSS**；必须拿到数值参与 JS 计算时才用 ResizeObserver；`window.resize` 只在确实只关心视口时使用。

### 7.2 控制台一直打印 `ResizeObserver loop completed with undelivered notifications`，怎么根治？

**成因**：回调在**同一轮布局**里同步修改了被观察元素的尺寸，浏览器只能重新布局并再派发一次通知，如此回环；本轮预算用尽后打印这条警告。它**不是报错，页面也不会崩**，但意味着每帧都在重复布局，表现为滚动 / 拖动时持续抖动、掉帧。

先定位**是谁在回调里改了尺寸**：把回调内容临时清空，警告消失则问题就在回调里。然后按下面的顺序处理：

- **把渲染推到下一帧**：在 `requestAnimationFrame` 里再动手，让「读尺寸」与「写尺寸」分属两轮布局（图表 / Canvas 重绘的常规做法，见第 5 节示例）。
- **避免读写交错**：回调里只读尺寸、只写样式，不要让「读尺寸 → 改尺寸 → 再读尺寸」发生在同一个任务里——这与**强制同步布局**是同一类问题。
- **换观察对象**：观察外层不会因自己而变化的容器，而不是被自己改动的元素本身。

> **`debounce` 治不了这个警告。** 它控制的是回调频率，而回环的根源是「同一帧内写入尺寸」；真正生效的是把写入推迟到下一帧或下一个任务。

### 7.3 为什么尺寸字段是数组？`contentRect` 还能不能用？

- `contentBoxSize` / `borderBoxSize` / `devicePixelContentBoxSize` 都是**数组**：对普通块级元素通常是单元素数组；而**跨多行的内联元素**每个行盒各有一个尺寸项，数组会包含多项。所以取值必须写 `[0]`，多行内联场景需要遍历数组或改用 `contentRect`。
- `contentRect` 是早期的 DOMRect，**仍然可用但已被规范标记为兼容保留**：它固定描述内容盒，无法反映 `border-box` 观察结果。新代码推荐用 `contentBoxSize[0]`，并注意用 `inlineSize` / `blockSize`（**与书写方向无关**）而不是 `width` / `height`。

### 7.4 为什么 `observe` 了却从来不触发回调？

- **元素没有参与布局**：还没挂载进文档、或一直处在 `display: none` 的祖先里，就没有布局盒，也就没有尺寸变化可报。
- **`box` 取值不被支持**：`device-pixel-content-box` 在 Safari / Firefox 上会让 `observe()` **同步抛错**，观察根本没建立起来——这种失败会在控制台直接看到 `TypeError`，别被「没回调」误导。
- **观察的是被移除后又新建的元素**：SPA 或虚拟列表里 DOM 被替换（同一个逻辑组件的**新节点**）后，旧实例观察的是已脱离文档的旧节点，必须重新 `observe`。
- **`disconnect()` 被提前调用**：组件卸载钩子或路由切换的清理逻辑误伤，重新挂载后忘记再次 `observe`。
