# IntersectionObserver

监听目标元素与祖先元素或视口（viewport）的**交叉情况**，是懒加载与曝光埋点的首选方案。

## 1. 方法与构造选项

```js
const observer = new IntersectionObserver(callback, options) // 构造（options 可选）
observer.observe(target) // 开始观察某个元素
observer.unobserve(target) // 停止观察某个元素
observer.takeRecords() // 取回未处理条目
observer.disconnect() // 停止全部观察
```

[width(28,16,17,39)]

| 方法                                           | 参数                          | 返回值                        | 说明                                                                |
| :--------------------------------------------- | :---------------------------- | :---------------------------- | :------------------------------------------------------------------ |
| `new IntersectionObserver(callback, options?)` | `callback(entries, observer)` | 实例                          | 只注册回调，此时还没有观察任何元素                                  |
| `observe(target)`                              | 目标元素                      | `undefined`                   | 开始观察；会先派发一次**初始回调**，所以「回调被触发」≠「元素可见」 |
| `unobserve(target)`                            | 目标元素                      | `undefined`                   | 只停止这一个目标，其余目标继续生效                                  |
| `takeRecords()`                                | -                             | `IntersectionObserverEntry[]` | 取回未派发的条目并清空内部队列（`disconnect()` 会直接丢弃它们）     |
| `disconnect()`                                 | -                             | `undefined`                   | 停止全部观察并清空队列，之后要重新 `observe` 才能继续               |

- `callback(entries, observer)`：交叉状态变化回调，`entries` 为 `IntersectionObserverEntry` 数组。**一个实例观察多个元素时回调是共享的**，必须靠 `entry.target` 区分是谁变了。
- 回调**异步**触发（渲染帧前的空闲时刻）：`observe()` 之后的同步代码拿不到结果；需要「此刻是否可见」时，把初始回调的结果缓存下来。
- `observe()` **不接受 options**：阈值与根区域配置只在构造时一次性传入，想改配置只能新建实例。

[width(18,28,18,36)]

| 选项         | 类型                            | 默认值              | 说明                                                         |
| ------------ | ------------------------------- | ------------------- | ------------------------------------------------------------ |
| `root`       | `Element` / `Document` / `null` | `null`              | 判定基准的滚动容器，`null` 表示视口                          |
| `rootMargin` | `string`                        | `'0px 0px 0px 0px'` | 扩展 / 收缩根区域，语法同 CSS `margin`（正值提前，负值收缩） |
| `threshold`  | `number` / `number[]`           | `0`                 | 触发阈值，可数组（如 `[0, 0.5, 1]`）在多个比例点分别触发     |

- **`threshold` 只在「跨越」阈值时触发**：`threshold: 0.5` 时，可见比例从 0.3 涨到 0.6 触发一次，随后 0.6 → 0.8 不再触发。要按可见比例持续更新，就把阈值拆成数组（见第 4 节）。
- **`rootMargin` 的百分比相对 `root` 的尺寸计算**，与目标元素自身大小无关。正值把根区域向外扩张（提前预加载），负值向内收缩（要求元素**完全进入**才触发，常用于吸顶判断）。
- **`root` 必须是目标的祖先节点**（或传 `null` 用视口）：若指定了一个与目标没有祖先关系的元素，交叉矩形会退化为空、`isIntersecting` 恒为 `false`，表现为「配置写了却从不触发」。要监听某个内部滚动容器，就把该容器本身作为 `root`。

## 2. 基本用法

```js
const images = document.querySelectorAll('img[data-src]')

const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src // 进入视口才真正加载
        img.onload = () => img.classList.add('loaded')
        observer.unobserve(img) // 加载后不再观察
      }
    })
  },
  {
    root: null, // null 表示视口
    rootMargin: '0px 0px 200px 0px', // 底部提前 200px 触发预加载
    threshold: 0.1, // 交叉比例达到 10% 时触发
  },
)

images.forEach(img => observer.observe(img))
```

- 回调里要先判 `isIntersecting` 再处理——`observe()` 后的初始回调同样会被执行，未做判断会把首屏之外的图片也立刻加载。
- 处理完记得 `unobserve`，否则同一元素每次进出视口都会再触发；需要重复处理时（如二次曝光）则要重新 `observe`。

## 3. 字段速查

[width(26,74)]

| 字段                 | 含义                                                          |
| -------------------- | ------------------------------------------------------------- |
| `target`             | 被观察的元素                                                  |
| `isIntersecting`     | 是否与根区域相交（纯几何判断）                                |
| `isVisible`          | 是否**真正可见**（额外排除被遮挡、`opacity: 0`），Chrome 115+ |
| `intersectionRatio`  | 可见部分占自身面积的比例（0 ~ 1）                             |
| `boundingClientRect` | 目标元素自身的边界矩形                                        |
| `intersectionRect`   | 目标与根区域**交叉部分**的矩形                                |
| `rootBounds`         | 根区域的边界矩形（`root` 为 null 时为视口）                   |
| `time`               | 触发回调的时间戳（相对 `timeOrigin`）                         |

**判断「是否可见」一律用 `isIntersecting`**，只有在需要「可见多少」时才读 `intersectionRatio`：

```js
entries.forEach(entry => {
  // ✅ 布尔值：几何上是否与根区域相交
  // ❌ 不要写成 entry.intersectionRatio > 0：threshold: 0 时元素刚贴边会出现
  //    isIntersecting === true 但 intersectionRatio === 0 的条目，会被漏掉
  if (!entry.isIntersecting) return

  // 需要比例时才用它：进度条、视频播放、有效曝光
  progressBar.style.width = `${entry.intersectionRatio * 100}%`
})
```

> **注意：** `intersectionRect` 是「交叉部分」的矩形，元素完全不可见时是一个全 0 的矩形；`rootBounds` 在 `root` 与目标不构成祖先关系时可能为 `null`，取值前先判空。

## 4. 多阈值：按可见比例更新进度

`threshold: 0`（默认）只在「相交 / 不相交」两种状态间切换，元素刚接触根区域边缘就会出现 `isIntersecting === true` 而 `intersectionRatio === 0` 的条目。要按可见比例做连续反馈，就把阈值拆成数组：

```js
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      const percent = Math.round(entry.intersectionRatio * 100)
      console.log(`${entry.target.id} 可见 ${percent}%`)
      // 未相交时 isIntersecting 为 false，可用于触发离开视口逻辑
    })
  },
  { threshold: [0, 0.25, 0.5, 0.75, 1] },
)

observer.observe(document.querySelector('#video'))
```

数组阈值适合进度条式的连续反馈：**每次跨越一个阈值都会派发一次回调**，`entry.intersectionRatio` 给出当前比例。

## 5. 无限滚动（哨兵元素）

```js
const sentinel = document.querySelector('#sentinel')

const observer = new IntersectionObserver(
  async entries => {
    if (entries[0].isIntersecting) {
      const hasMore = await loadNextPage() // 加载下一页
      if (!hasMore) observer.disconnect()
    }
  },
  { rootMargin: '100px' },
)

observer.observe(sentinel)
```

哨兵只要还在视口里，每次滚动都可能再次触发，因此要自己加「加载中」标志位避免并发重复请求；`loadNextPage` 返回「没有更多」时用 `disconnect()` 收工。

## 6. 示例：曝光埋点

```js
// 场景：商品卡片曝光埋点——可见比例 ≥ 50% 且停留 1 秒才上报，每个卡片只报一次
// 上报函数：实际项目中替换为埋点 SDK（sendBeacon / fetch）
function track(event, data) {
  console.log(`[埋点] ${event}`, data)
  // navigator.sendBeacon('/api/track', JSON.stringify({ event, data }))
}

const exposureObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      const card = entry.target

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // 首次进入计时
        if (card._showAt == null) {
          card._showAt = Date.now()
          card._timer = setTimeout(() => {
            track('exposure', {
              id: card.dataset.id,
              stay: Date.now() - card._showAt, // 停留时长
            })
            exposureObserver.unobserve(card) // 上报一次后停止观察
          }, 1000)
        }
      } else {
        // 提前离开视口则取消计时
        clearTimeout(card._timer)
        card._timer = null
        card._showAt = null
      }
    })
  },
  { threshold: [0.5] },
)

document
  .querySelectorAll('.card')
  .forEach(card => exposureObserver.observe(card))
```

## 7. 典型场景

- **图片 / 组件懒加载**：进入视口（或即将进入）才渲染，显著降低首屏开销；`rootMargin: '0px 0px 200px 0px'` 提前一屏预加载，加载完立刻 `unobserve`。
- **曝光埋点**：`threshold: [0.5]` 保证「有效曝光」，再叠加停留时长过滤快速划过，上报后 `unobserve`。
- **无限滚动**：底部哨兵元素出现时加载下一页；务必用「加载中」标志位挡住并发触发。
- **吸顶 / 锚点导航高亮**：在目标前放一个等高哨兵，哨兵离开视口即切换 `fixed` 定位或激活对应导航项。
- **视频 / 动画的可见性控制**：`isIntersecting === false` 时暂停视频、停掉 `requestAnimationFrame` 循环或 CSS 动画，避免离屏元素白耗 CPU。
- **首屏之外的内容预取**：提前 1~2 屏触发路由 chunk 预加载或 `link rel="prefetch"`，让跳转「秒开」。
- **重量级组件的按需初始化**：富文本、地图、画布等进入视口才初始化，避免一次性创建全部实例。

## 8. 常见问题 (FAQ)

### 8.1 元素明明已经在视口里了，为什么回调不触发？

- **`root` 是否真的是目标的祖先节点**——配错容器是最常见的原因，此时 `isIntersecting` 恒为 `false`。
- **目标是否 `display: none` 或尺寸为 0**——不参与布局就没有有效的交叉矩形。
- **`threshold` 是否设成了当前不可能达到的值**——例如元素比视口还高时，`threshold: 1` 需要整个元素可见才会触发，实际永远达不到。
- **是否已经被 `unobserve` 过**——回调里加载完就 `unobserve` 的写法，第二次进入视口不会再有通知，需要重新 `observe`。
- **`disconnect()` 是否被提前调用**——SPA 路由切换或组件卸载的清理逻辑可能误伤。

### 8.2 `isIntersecting` 和 `intersectionRatio` 有什么区别？该用哪个？

[width(22,36,42)]

| 字段                | 含义                                | 用途                                    |
| :------------------ | :---------------------------------- | :-------------------------------------- |
| `isIntersecting`    | 布尔值：几何上是否与根区域相交      | 判断**有没有可见**（懒加载、播放/暂停） |
| `intersectionRatio` | 0 ~ 1：可见部分占目标自身面积的比例 | 判断**可见了多少**（进度、有效曝光）    |

结论：**判断可见用 `isIntersecting`，需要比例时才读 `intersectionRatio`**。另外注意元素比根区域还大时，`intersectionRatio` 永远达不到 1。

### 8.3 曝光埋点为什么会重复上报？怎么做到「只报一次」？

- **只报一次**：上报后立刻 `unobserve`，再用标记位（`dataset` / `WeakSet`）做二次防护。
- **避免误报**：先用 `threshold: 0.5` 保证「有效曝光」，再叠加停留时长——进入时 `setTimeout`，离开视口立刻 `clearTimeout`，快速划过不计数。
- **SPA 与虚拟列表要重置状态**：列表复用 DOM 时旧的标记位会残留，要在复用 / 卸载时重置元素状态，并在组件卸载钩子里 `disconnect()`。

### 8.4 能用 IntersectionObserver 判断滚动方向或做吸顶吗？

能，但它是「**某一时刻的交叉快照**」，不提供方向这一信息本身：

- **吸顶**：在目标元素前放一个等高的哨兵，哨兵离开视口（`isIntersecting === false`）即表示目标即将吸顶。
- **判断越过上边缘**：比较 `entry.boundingClientRect.top` 与 `entry.rootBounds.top`（`rootBounds` 可能为 `null`，先判空）——元素顶部小于根区域顶部，说明已经滚过边界。
- **需要精确的滚动方向 / 速度**：用 `scroll` 事件或 `scrollend` 配合 `getBoundingClientRect` 更直接，IO 更适合「状态跨越」而不是「连续过程」。
