# Observer API 观察器

Observer API 是浏览器提供的一组**事件驱动**的异步观察接口。它们摒弃了传统 `setInterval` 轮询与高频事件监听的低效方案，改为**在被观察对象发生变化时**由浏览器主动回调，是构建现代前端基础设施（懒加载、虚拟列表、曝光埋点、性能监控、DOM 水合）的基石。

## 1. 为什么需要 Observer？

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

**回调时机：** 各 Observer 的回调均**异步**触发，不会阻塞当前同步逻辑；区别在于触发粒度的不同：

| Observer               | 回调时机                     |
| ---------------------- | ---------------------------- |
| `MutationObserver`     | 微任务（当前任务结束后立即） |
| `IntersectionObserver` | 渲染帧前的空闲时刻           |
| `ResizeObserver`       | 布局后、绘制前               |
| `PerformanceObserver`  | 性能条目产生的异步队列       |
| `ReportingObserver`    | 浏览器生成报告后的异步队列   |

## 3. 观察器总览

| Observer                 | 观察目标         | 典型场景                                       |
| ------------------------ | ---------------- | ---------------------------------------------- |
| **MutationObserver**     | DOM 结构与属性   | 监听节点增删改、替代废弃的 DOM Mutation Events |
| **IntersectionObserver** | 元素与视口交叉   | 懒加载图片、曝光埋点、无限滚动、吸顶           |
| **ResizeObserver**       | 元素尺寸变化     | 响应式组件、图表自适应、监听内容撑高           |
| **PerformanceObserver**  | 性能数据条目     | 采集 LCP / 长任务 / 资源耗时                   |
| **ReportingObserver**    | 浏览器生成的报告 | 收集弃用 API、干预（intervention）报告         |

> **共性：** 所有 Observer 天然具备**批量合并**能力——同一帧内的多次变化会被合并为一次回调，内部无需再自行节流/防抖。

## 4. 对比总结

| 维度     | 传统方案             | Observer                        |
| -------- | -------------------- | ------------------------------- |
| 触发方式 | 主动轮询 / 高频事件  | 变化时异步回调                  |
| 性能开销 | 空转浪费、需手动节流 | 零轮询、原生批处理              |
| 精确度   | 有空窗期、易漏检     | 精确到每一次变化                |
| 内存管理 | 事件监听易遗漏解绑   | `disconnect` / `unobserve` 清晰 |

## 5. 最佳实践

- **批量处理**：所有 Observer 回调都已合并，内部无需再自行节流 / 防抖。
- **及时 `disconnect` / `unobserve`**：尤其是 SPA 路由切换、组件卸载时，避免内存泄漏；可在框架卸载钩子中统一清理。
- **用 `buffered: true` 补抓历史**：对 LCP、paint、deprecation 等一次性数据尤其重要。
- **懒加载务必 `unobserve`**：图片加载完成后移除观察，避免持续占用。
- **注意性能**：`MutationObserver` 监听 `subtree` 且回调做重活时，会显著拖慢 DOM 操作，需谨慎；尺寸相关渲染应放入 `requestAnimationFrame`。
