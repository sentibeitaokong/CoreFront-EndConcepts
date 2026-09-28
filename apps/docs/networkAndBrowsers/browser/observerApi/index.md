# Observer API 观察器

Observer API 是浏览器提供的一组**事件驱动**的异步观察接口。它们摒弃了传统 `setInterval` 轮询与高频事件监听的低效方案，改为**在被观察对象发生变化时**由浏览器主动回调，是构建现代前端基础设施（懒加载、虚拟列表、曝光埋点、性能监控、DOM 水合）的基石。

## 1. 为什么需要 Observer？

[width(24,28,48)]

| 方案               | 机制                              | 缺陷                                                  |
| ------------------ | --------------------------------- | ----------------------------------------------------- |
| `setInterval` 轮询 | 定时主动查询状态                  | 浪费 CPU、有空窗期、无法精确感知变化瞬间              |
| 高频事件监听       | `scroll` / `resize` / `mousemove` | 触发过于频繁，需要手动节流/防抖，且部分变化无对应事件 |
| **Observer**       | 变化时由浏览器主动回调            | 精确、异步、批处理、零轮询开销                        |

## 2. 统一范式与生命周期

所有 Observer 都遵循同一套 API 形状，掌握一个即可迁移到其余：

```javascript
const observer = new XxxObserver(callback) // 1. 构造：传入变化回调
observer.observe(target, options) // 2. 开始观察（可对多个目标重复调用）
observer.unobserve(target) // 3. 停止观察某个目标（保留观察器）
observer.disconnect() // 4. 断开全部观察，彻底释放资源
```

**但 `observe` 的入参形态并不统一**，迁移到另一个成员时最容易踩的就是这里：

[width(29,17,12,13,29)]

| Observer               | `observe` 的入参       | `unobserve` | `takeRecords` | 说明                                              |
| :--------------------- | :--------------------- | :---------- | :------------ | :------------------------------------------------ |
| `MutationObserver`     | `(target, options)`    | ❌ 无       | ✅            | 停单个目标只能 `disconnect` 后重新观察            |
| `IntersectionObserver` | `(target)`             | ✅          | ✅            | 阈值 / 根区域在**构造时**传入，`observe` 不收配置 |
| `ResizeObserver`       | `(target, options?)`   | ✅          | ❌ 无         | `box` 可按目标分别指定                            |
| `PerformanceObserver`  | `(options)`，无 target | ❌ 无       | ✅            | 观察的是「条目类型」而不是元素                    |
| `ReportingObserver`    | `()`，不接收参数       | ❌ 无       | ✅            | 必须显式调用 `observe()` 才开始收集               |

- **一个实例观察多个目标时，回调是共享的**：`entries` 里混着不同目标的变化，处理时必须靠 `entry.target` 判断「是谁变了」，不能假设「一次回调 = 一个元素」。
- **对已在观察中的目标再次 `observe`，是覆盖配置而不是重复注册**：旧 options 被新 options 替换，回调依旧只触发一次。
- **`unobserve(target)` 只摘掉单个目标**，观察器与回调继续存活；**`disconnect()` 才是彻底重置**——清空全部目标，之后想继续观察必须重新 `observe`，并重新传 options。

**回调时机：** 各 Observer 的回调均**异步**触发，不会阻塞当前同步逻辑；区别在于触发粒度的不同：

[width(29,71)]

| Observer               | 回调时机                     |
| ---------------------- | ---------------------------- |
| `MutationObserver`     | 微任务（当前任务结束后立即） |
| `IntersectionObserver` | 渲染帧前的空闲时刻           |
| `ResizeObserver`       | 布局后、绘制前               |
| `PerformanceObserver`  | 性能条目产生的异步队列       |
| `ReportingObserver`    | 浏览器生成报告后的异步队列   |

## 3. 观察器总览

[width(27,22,51)]

| Observer                 | 观察目标         | 典型场景                                       |
| ------------------------ | ---------------- | ---------------------------------------------- |
| **MutationObserver**     | DOM 结构与属性   | 监听节点增删改、替代废弃的 DOM Mutation Events |
| **IntersectionObserver** | 元素与视口交叉   | 懒加载图片、曝光埋点、无限滚动、吸顶           |
| **ResizeObserver**       | 元素尺寸变化     | 响应式组件、图表自适应、监听内容撑高           |
| **PerformanceObserver**  | 性能数据条目     | 采集 LCP / 长任务 / 资源耗时                   |
| **ReportingObserver**    | 浏览器生成的报告 | 收集弃用 API、干预（intervention）报告         |

> **共性：** 所有 Observer 天然具备**批量合并**能力——同一帧内的多次变化会被合并为一次回调，内部无需再自行节流/防抖。

[width(24,25,51)]

| 业务场景                    | 首选观察器             | 关键配置 / 要点                                               |
| :-------------------------- | :--------------------- | :------------------------------------------------------------ |
| 图片 / 组件懒加载           | `IntersectionObserver` | `rootMargin` 提前若干像素预加载，加载完立刻 `unobserve`       |
| 曝光埋点                    | `IntersectionObserver` | `threshold: [0.5]` + 停留计时，上报后 `unobserve`             |
| 无限滚动                    | `IntersectionObserver` | 底部哨兵元素 + 「加载中」标志位，防止并发重复请求             |
| 吸顶 / 锚点导航高亮         | `IntersectionObserver` | 等高哨兵元素，或比较 `boundingClientRect.top` 与 `rootBounds` |
| 离屏视频 / 动画暂停         | `IntersectionObserver` | `isIntersecting === false` 时暂停播放、停掉 rAF 循环          |
| 图表 / 编辑器容器自适应     | `ResizeObserver`       | 重绘放进 `requestAnimationFrame`，避免 loop 警告              |
| 虚拟列表动态行高            | `ResizeObserver`       | 按 `entry.target` 更新行高缓存并重算偏移，替代固定行高估算    |
| 瀑布流 / 网格重排           | `ResizeObserver`       | 容器尺寸变化后重新分配位置，实际布局放 `rAF`                  |
| 屏蔽第三方广告 / 弹窗       | `MutationObserver`     | `childList + subtree`，回调里只删不写，避免回环               |
| 富文本协同 / 撤销重做       | `MutationObserver`     | 按 `record.type` 分流，变更集作为协同与历史栈的输入           |
| 检测「自己被移出文档」      | `MutationObserver`     | 观察**父节点**的 `childList`，比对 `removedNodes`             |
| 框架挂载点 / 微前端容器管理 | `MutationObserver`     | 监听容器子节点增删，驱动子应用挂载与清理                      |
| LCP / FCP / INP / CLS       | `PerformanceObserver`  | `buffered: true`，`visibilitychange` 时 `sendBeacon` 上报     |
| 长任务 / 卡顿定位           | `PerformanceObserver`  | `type: 'longtask'`，读 `attribution` 定位到具体来源           |
| 弃用 API / CSP 巡检         | `ReportingObserver`    | `buffered: true`，按 `body.id` 聚合去重后上报                 |

## 4. 对比总结

[width(13,26,61)]

| 维度     | 传统方案             | Observer                        |
| -------- | -------------------- | ------------------------------- |
| 触发方式 | 主动轮询 / 高频事件  | 变化时异步回调                  |
| 性能开销 | 空转浪费、需手动节流 | 零轮询、原生批处理              |
| 精确度   | 有空窗期、易漏检     | 精确到每一次变化                |
| 内存管理 | 事件监听易遗漏解绑   | `disconnect` / `unobserve` 清晰 |

## 5. 最佳实践

- **批量处理**：所有 Observer 回调都已合并，内部无需再自行节流 / 防抖。
- **及时 `disconnect` / `unobserve`**：观察器持有目标节点的强引用，节点即使已从 DOM 移除也不会被回收——SPA 路由切换、组件卸载时务必清理，可在框架卸载钩子中统一处理。
- **用 `buffered: true` 补抓历史**：对 LCP、paint、deprecation 等一次性数据尤其重要。
- **懒加载务必 `unobserve`**：图片加载完成后移除观察，避免持续占用。
- **注意性能**：`MutationObserver` 监听 `subtree` 且回调做重活时，会显著拖慢 DOM 操作，需谨慎；尺寸相关渲染应放入 `requestAnimationFrame`。
- **从最小观察范围起步**：先只观察必要的目标与属性（`attributeFilter` 收窄属性、`root` 精确到容器、`type` 只订阅需要的类型），确认需求后再放宽——一上手就 `subtree: true` 或全类型监听，是后期性能问题的根源。
- **把观测点前置到业务侧**：业务代码只负责 `mark` / `measure` 打点，采集与上报统一交给监控 SDK 消费，避免上报逻辑散落在各处、也无法统一采样。

## 6. 常见问题 (FAQ)

### 6.1 回调是同步执行的吗？在回调里改 DOM 会不会死循环？

**异步**。所有 Observer 的回调都不在当前同步代码里执行，区别只是「排在哪条队列」：`MutationObserver` 排微任务，`ResizeObserver` 排在布局后、绘制前，`IntersectionObserver` 排在渲染帧前的空闲时刻。所以 `observe()` 之后紧跟的同步代码永远看不到结果。

至于死循环：**在回调里再次修改被观察的对象，确实会触发新一轮回调**，浏览器不会替你做重入保护。是否变成死循环，取决于你的修改是否再次满足触发条件：

- **会死循环**：观察 `attributes` 全部属性，回调里再改一次 `class`；`ResizeObserver` 回调里同步改回被观察元素的尺寸；`MutationObserver` 回调里 `appendChild` 一个同样命中筛选条件的节点。表现是标签页直接冻结。
- **安全做法**：用 `attributeFilter` 把观察范围收窄到必要的属性；在回调里先判断「这个变化是不是我自己造成的」再决定是否处理；把副作用推到下一个任务（`requestAnimationFrame` / `setTimeout`），避免在同一轮里连续反馈。

### 6.2 `unobserve` 和 `disconnect` 该怎么选？忘记清理真的会内存泄漏吗？

[width(23,28,18,31)]

| 方法           | 范围                       | 观察器状态           | 何时用                           |
| -------------- | -------------------------- | -------------------- | -------------------------------- |
| `unobserve(t)` | 仅停止一个目标             | 实例存活，可继续观察 | 单张图片加载完、单个卡片已上报   |
| `disconnect()` | 停止**全部**目标并清空队列 | 实例存活，需重新配置 | SPA 路由离开、组件卸载、整批收工 |

- **`MutationObserver` 没有 `unobserve()`**，想停止观察个别目标只能 `disconnect()` 后重新 `observe`。
- **忘记清理确实会泄漏**：观察器持有目标节点的强引用，节点即使已从 DOM 移除也不会被回收；`PerformanceObserver` 长期不 `disconnect` 还会持续写入条目。**结论**：把 `disconnect()` 写进组件卸载钩子或路由钩子里，是使用 Observer 的固定动作。

### 6.3 既然 Observer 自带批量合并，我还需要自己加节流 / 防抖吗？

**不需要对观察器本身再包一层 `throttle` / `debounce`。** 同一帧内的多次变化已经被浏览器合并成一次回调，再套节流只是把回调延迟得更久，并掩盖真实的变化节奏。

真正需要控制的是**回调里的开销**，而不是回调的次数：

- 只做「收集 + 缓存」，把渲染 / 上报推迟到 `requestAnimationFrame` 或 `requestIdleCallback`。
- 用更精确的观察配置减少无效触发：`attributeFilter`、`threshold`、`durationThreshold`。
- 高频场景做**采样**（例如只处理 10% 的变化），而不是节流。

### 6.4 老浏览器不支持怎么办？需要引入 polyfill 吗？

[width(25,40,35)]

| Observer               | 支持情况                             | 建议                                                |
| ---------------------- | ------------------------------------ | --------------------------------------------------- |
| `MutationObserver`     | 全浏览器支持，IE11 也可用            | 直接使用                                            |
| `IntersectionObserver` | Chrome 51+ / Safari 12.1+，IE 不支持 | 需要兼容 IE 时引入官方 `intersection-observer` 补丁 |
| `ResizeObserver`       | Chrome 64+ / Safari 13.1+，IE 不支持 | 现代浏览器直接使用，无需补丁                        |
| `PerformanceObserver`  | Chrome 52+ / Safari 11+，IE 不支持   | 监控代码做**能力检测**，不支持时静默降级（不上报）  |
| `ReportingObserver`    | 仅 Chromium 系支持                   | 当作增强能力，配合服务端 `Reporting-Endpoints` 使用 |

判断原则：**能观测则增强，不能观测则降级**，不要在缺失能力时抛错阻塞主流程。统一写法是先做能力检测，再走降级分支：

```js
if (typeof IntersectionObserver === 'function') {
  startLazyLoad()
} else {
  // 降级：一次性全部加载，牺牲性能但不影响功能
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src
  })
}
```
