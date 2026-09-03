# IntersectionObserver

监听目标元素与祖先元素或视口（viewport）的**交叉情况**，是懒加载与曝光埋点的首选方案。

## 1. API 签名

```javascript
const observer = new IntersectionObserver(callback, options?) // 构造
observer.observe(target)            // 开始观察某个元素
observer.unobserve(target)          // 停止观察某个元素
observer.takeRecords()              // 取回未处理条目
observer.disconnect()               // 停止全部观察
```

- `callback(entries, observer)`：交叉状态变化回调，`entries` 为 `IntersectionObserverEntry` 数组。

**构造选项：**

| 选项         | 类型                            | 默认值              | 说明                                                         |
| ------------ | ------------------------------- | ------------------- | ------------------------------------------------------------ |
| `root`       | `Element` / `Document` / `null` | `null`              | 判定基准的滚动容器，`null` 表示视口                          |
| `rootMargin` | `string`                        | `'0px 0px 0px 0px'` | 扩展 / 收缩根区域，语法同 CSS `margin`（正值提前，负值收缩） |
| `threshold`  | `number` / `number[]`           | `0`                 | 触发阈值，可数组（如 `[0, 0.5, 1]`）在多个比例点分别触发     |

## 2. 基本用法

```javascript
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

## 3. 字段速查

| 字段                 | 含义                                        |
| -------------------- | ------------------------------------------- |
| `target`             | 被观察的元素                                |
| `isIntersecting`     | 是否与根区域相交                            |
| `intersectionRatio`  | 可见部分占自身面积的比例（0 ~ 1）           |
| `boundingClientRect` | 目标元素自身的边界矩形                      |
| `intersectionRect`   | 目标与根区域**交叉部分**的矩形              |
| `rootBounds`         | 根区域的边界矩形（`root` 为 null 时为视口） |
| `time`               | 触发回调的时间戳（相对 `timeOrigin`）       |

## 4. 多阈值：按可见比例更新进度

```javascript
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

## 5. 无限滚动（哨兵元素）

```javascript
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

## 6. 示例：曝光埋点

```javascript
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

- **图片 / 组件懒加载**：进入视口才渲染，显著降低首屏开销。
- **曝光埋点**：商品卡片进入视口并停留一定时长后上报曝光（可结合 `threshold: 0.5` 保证「有效曝光」）。
- **无限滚动**：哨兵元素出现时加载下一页。
- **吸顶 / 粘性**：元素即将滚出视口时切换 `fixed` 定位。
- **视频自动播放 / 暂停**：进入视口播放、离开视口暂停（`isIntersecting === false`）。
