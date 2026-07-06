# 虚拟列表与大数据渲染

**核心本质**：虚拟列表并非单纯的 UI 技巧，而是针对浏览器渲染引擎的“**降维打击**”。通过预判完整滚动空间，仅将视口及缓冲区（Overscan）的数据映射为真实 DOM，从而彻底阻断大规模数据对布局（Layout）、绘制（Paint）及 VNode Diff 的指数级性能消耗。

**战术纪律**：**数据量不设限，但 DOM 节点需锁死。** 滚动表现必须稳定，尺寸测量要求绝对可控，组件级别的交互状态必须与频繁挂载/卸载的 DOM 节点生命周期完全解耦。

## 1. 长列表的性能灾难链路

海量数据强行渲染，将击穿现代前端架构的整条渲染管线：

- **响应式劫持瘫痪**：海量数据进入 Proxy 或 Getter/Setter 响应式系统，深度依赖收集（如 Vue3 的 `effect.ts` 追踪）会导致极高的初始化内存和 CPU 耗时。
- **DOM & 样式雪崩**：上万节点的样式重算与布局成本呈非线性飙升。
- **渲染管线拥堵**：首屏被迫创建超量真实节点，引发主线程长任务（Long Tasks），直接拉低 Lighthouse 性能评分（尤其是 TBT 和 INP 指标）。
- **Diff 算法过载**：状态微调即触发巨型 VNode 树对比，`patchAttr` 等底层更新逻辑不堪重负。
- **内存与 GC 震荡**：废弃节点、游离闭包和未解绑的事件监听器引发内存泄漏，频繁触发垃圾回收（GC）导致滚动卡顿掉帧。

## 2. 固定高度虚拟化

定高列表是性能最优解。核心逻辑：依据 `scrollTop` 计算可视起止索引，利用 `transform` 的绝对偏移量将少量 DOM “**推**”入当前视口。

```javascript
// 核心计算抽象
const visibleCount = Math.ceil(containerHeight / itemHeight)
const start = Math.floor(scrollTop / itemHeight)
const end = start + visibleCount + overscan
const offsetY = start * itemHeight // 通过 transform: translateY(offsetY) 控制位移
```

```html
<div class="viewport">
  <div class="spacer">
    <div class="content"></div>
  </div>
</div>
<style>
  .viewport {
    height: 480px;
    overflow: auto;
  }

  .spacer {
    height: var(--total-height);
    position: relative;
  }

  .content {
    transform: translateY(var(--offset-y));
  }
</style>
```

## 3. 动态高度虚拟化

消息流、瀑布流等业务必须直面动态高度。核心难点在于**滚动稳定**与**实时测量**：

- **预估先行**：采用 `estimatedItemHeight` 撑开初始滚动条，保障基础交互。
- **后置真实测量**：DOM 挂载后通过 `ResizeObserver` 或直接读取 `offsetHeight` 捕捉真实高度。
- **前缀和（Prefix Sum）缓存**：维护累计高度数组，利用二分查找（O(log n)）根据 `scrollTop` 极速定位起始索引。
- **锚点稳定（Scroll Anchoring）**：向上方插入高度大于预估值的元素时，必须动态修正 `scrollTop`，避免视口内容发生剧烈跳动（CLS 恶化）。

## 4. Overscan与滚动体验

`overscan` 是视口外的冗余渲染量，用于平衡“**滚动露白**”与“**渲染开销**”的矛盾：

- **动态博弈**：数值过小（如 0-2）在快速滑动时极易闪烁白屏；数值过大则稀释了虚拟化的性能红利。
- **自适应策略**：企业级组件可根据设备的滚动速度（Velocity）及硬件性能动态调节缓冲区大小，优先保证滚动不露白。

## 5. 交互与状态陷阱

DOM 节点在滚动中被高频复用与销毁，常规的组件状态管理极易失效：

- **数据降维解绑**：列表源数据务必剥离深度响应式（例如使用 Vue3 的 `shallowRef` 或 `Object.freeze`），规避不必要的深层代理拦截。
- **唯一且稳定的 Key**：严禁使用 `index`。必须绑定业务 ID 协助底层 `patch` 机制精准复用 VNode。
- **状态外置与事件代理**：
- **选中/展开态**：剥离出组件内部的 `ref` 或 `state`，统一收拢到外部的全局状态表（Set 或 Map）中。
- **弹窗与气泡**：Tooltip 或 Dropdown 必须挂载至 `body`（Teleport/Portal），避免随宿主 DOM 回收而异常消失。
- **事件委托**：在父容器拦截点击等高频事件，避免给不断重绘的子节点反复绑定监听器。

## 6. 现代浏览器原生降维：`content-visibility`

对于非极端海量数据场景，可采用零 JS 成本的 CSS 方案：

- **开启懒渲染**：`content-visibility: auto;` 强制浏览器跳过视口外元素的布局与绘制工作。
- **占位防御**：必须绑定 `contain-intrinsic-size` 声明预估尺寸，否则滚动条将发生毁灭性跳动。
- **局限性**： DOM 节点并未真正销毁，框架层的 VNode Diff 压力依然存在，无法应对真正十万级以上的极限数据量。

## 7. 2D 虚拟化（复杂网格/数据表）

面对类似 Web Excel 或大型监控看板的二维数据，单轴虚拟化失效：

- **双轴矩阵裁剪**：同时监听 `scrollTop` 和 `scrollLeft`，计算行区间 `[startRow, endRow]` 与列区间 `[startCol, endCol]`。
- **绝对定位接管**：单元格全面采用 `position: absolute` 配合矩阵运算输出的 `top` / `left` 精确落位。
- **强同步风险**：固定表头/冻结列需拆分多个虚拟化容器并用 JS 强行同步滚动事件，极考验防抖节流与 `requestAnimationFrame` 的调优功力。

## 8. 何时不要引入虚拟化？

- **低量级数据**：百条以内数据引入虚拟化纯属过度设计。
- **SEO 强依赖**：虚拟节点会导致爬虫抓取不到完整 DOM 树结构。
- **原生页内搜索（Ctrl+F）**：浏览器无法匹配被销毁或未渲染的文本节点。
- **超高频极端变动布局**：节点高度随时发生不可测的形变，维护位置缓存的计算成本将反超渲染成本。

## 9. 工业级基建选型参考

核心本质：除非为了学习原理或应对极其特殊的业务定制（如时间轴、甘特图），生产环境中不要轻易手写虚拟列表。各种边缘场景（如动态高度测量偏差、设备滚动惯性差异）深不可测。

- **React 生态**：`react-window`（轻量定高标配）、`react-virtuoso`（动态高度自动测量的最强方案）。
- **Vue 生态**：`vue-virtual-scroller`（老牌稳定），或基于 Vue 3 组合式 API 重构的现代虚拟化库。
- **Headless 无头方案**：`TanStack Virtual`（提供纯粹的逻辑 Hook，UI 与状态完全解耦，现代全栈及跨框架基建的首选）。

## 10. 基于 Vue 3 的十万级定高虚拟列表

### 10.1 核心 DOM 架构图谱

虚拟列表的 DOM 结构必须严守三层原则，各司其职：

- **`Viewport` (视口层)**：定高定宽，设置 `overflow-y: auto`，是唯一的物理滚动条来源。
- **`Spacer` (占位层)**：绝对定位，高度等于“**总数据量 × 单项高度**”，唯一作用是撑满视口，模拟真实滚动高度。
- **`Content` (渲染层)**：绝对定位，内部仅包含当前视口需要的极少量 DOM 节点。通过修改其 Y 轴偏移量，使其永远尾随用户的视口。

### 10.2 组件源码

:::code-group

```vue [VirtualList.vue]
<template>
  <div class="virtual-viewport" ref="viewportRef" @scroll="handleScroll">
    <div class="virtual-spacer" :style="{ height: totalHeight + 'px' }"></div>

    <div
      class="virtual-content"
      :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }"
    >
      <div
        v-for="item in visibleData"
        :key="item.id"
        class="virtual-item"
        :style="{ height: itemHeight + 'px', lineHeight: itemHeight + 'px' }"
      >
        <span class="item-text">ID: {{ item.id }} - {{ item.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from 'vue'

const props = defineProps({
  listData: { type: Array, default: () => [] },
  itemHeight: { type: Number, default: 40 },
  overscan: { type: Number, default: 5 }, // 缓冲区大小
})

const viewportRef = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

// 【核心防线】阻断深层响应式追踪
const optimizedList = shallowRef(props.listData)

// 1. 撑开总高度
const totalHeight = computed(
  () => optimizedList.value.length * props.itemHeight,
)

// 2. 计算视口容量
const visibleCount = computed(() =>
  Math.ceil(containerHeight.value / props.itemHeight),
)

// 3. 计算可视区起始索引 (包含上缓冲区)
const startIndex = computed(() => {
  let start = Math.floor(scrollTop.value / props.itemHeight) - props.overscan
  return Math.max(0, start) // 边界防御：规避负数
})

// 4. 计算可视区结束索引 (包含下缓冲区)
const endIndex = computed(() => {
  let end = startIndex.value + visibleCount.value + props.overscan * 2
  return Math.min(optimizedList.value.length, end) // 边界防御：规避溢出
})

// 5. 计算渲染层偏移量 (必须是 itemHeight 的整数倍)
const offsetY = computed(() => {
  return startIndex.value * props.itemHeight
})

// 6. 截取最终渲染数据
const visibleData = computed(() => {
  return optimizedList.value.slice(startIndex.value, endIndex.value)
})

// 7. 滚动事件收集
const handleScroll = e => {
  scrollTop.value = e.target.scrollTop
}

onMounted(() => {
  if (viewportRef.value) {
    containerHeight.value = viewportRef.value.clientHeight
  }
})
</script>

<style scoped>
.virtual-viewport {
  width: 100%;
  height: 500px; /* 需有明确高度 */
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
}

.virtual-spacer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}

.virtual-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* 强制开启 GPU 加速，规避重排 */
  will-change: transform;
}

.virtual-item {
  box-sizing: border-box;
  border-bottom: 1px solid #f3f4f6;
  padding: 0 16px;
}
</style>
```

:::

### 10.3 性能基建解析

- **响应式降维与追踪剥离**：
  在处理海量数据时，将十万条复杂对象直接塞入 `ref()` 或 `reactive()` 是致命的。Vue 内部的 `effect.ts` 机制会递归遍历每一个对象节点进行代理（Proxy）拦截和依赖收集。这会在组件挂载瞬间引发 CPU 峰值，并造成巨大的内存浪费。实战中，强制使用 `shallowRef` 是第一军规，它阻断了深层劫持，将时间复杂度从 O(n) 降维至 O(1)。
- **GPU 合成层接管**：
  计算偏移量时，使用 `translate3d` 配合 CSS `will-change: transform`。若使用传统的 `top` 属性，每一帧的偏移都会触发主线程的 Layout（重排）和 Paint（重绘）。而 `transform` 能将渲染层提升为独立的合成层（Compositing Layer），彻底交由 GPU 处理，确保在高频触发 `scroll` 事件时帧率死锁在 60 FPS。
- **双向缓冲池（Symmetrical Overscan）**：
  在 `endIndex` 的计算中，使用了 `+ (props.overscan * 2)`。由于 `startIndex` 已经提前向后偏移了一个 `overscan` 的距离，因此底部必须加上双倍的冗余量，以保证列表无论是急剧上划还是下划，预渲染的 DOM 节点都在视口边缘严阵以待。
