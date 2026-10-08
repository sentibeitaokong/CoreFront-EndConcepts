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

**高频场景：这些业务迟早会撞上虚拟化**

[width(25,20,55)]

| 业务                 | 数据量级        | 为什么必须虚拟化                               |
| -------------------- | --------------- | ---------------------------------------------- |
| 聊天记录 / 消息流    | 上万条          | 动态高度 + 持续追加，DOM 线性增长直接拖垮内存  |
| 商品瀑布流 / 信息流  | 几百 ~ 数万     | 每项都含图片，节点一多，内存与重排成本同时爆炸 |
| 数据表格 / 监控大屏  | 几千行 × 几十列 | 单元格数量 = 行 × 列，普通渲染直接卡死         |
| 日志 / 实时监控列表  | 持续滚动追加    | 长期挂着不释放，必须主动回收离屏节点           |
| 下拉选择器（大字典） | 几千 ~ 十万条   | 用户只选一条，却渲染了整个字典                 |
| 组织架构 / 文件树    | 数百 ~ 数千     | 层级叠加，深层展开时节点数会暴涨               |

## 2. 固定高度虚拟化

定高列表是性能最优解。核心逻辑：依据 `scrollTop` 计算可视起止索引，利用 `transform` 的绝对偏移量将少量 DOM “**推**”入当前视口。

```javascript
// 核心计算抽象：整条公式都是「滚动位置 → 索引区间」的整除运算，不依赖任何 DOM 测量
const visibleCount = Math.ceil(containerHeight / itemHeight) // 一屏能装几项：向上取整，宁可多算一项也不露白
const start = Math.floor(scrollTop / itemHeight) // 视口顶部落在第几项：向下取整
const end = start + visibleCount + overscan // 末项索引 = 可见项 + 下缓冲区
// 渲染层位移：必须是 itemHeight 的整数倍，才能和 spacer 撑出的总高度严丝合缝
const offsetY = start * itemHeight // 通过 transform: translateY(offsetY) 控制位移
// 注：上面是「最简形态」，只留了下缓冲区；把 start 也减去 overscan，就是上下对称缓冲（见 10.2 的实现）
```

```html
<div class="viewport">
  <!-- spacer 只有一个职责：用「总高度」撑出真实滚动条，让滚动条比例与内容量相符 -->
  <div class="spacer">
    <!-- content 里只放当前视口需要的少量节点，靠 translateY 一路跟住视口 -->
    <div class="content"></div>
  </div>
</div>
<style>
  .viewport {
    height: 480px; /* 视口层必须定高，它是滚动条的唯一来源 */
    overflow: auto;
  }

  .spacer {
    /* = 数据总条数 × 单项高度，模拟出完整的滚动空间 */
    height: var(--total-height);
    position: relative; /* 作为 content 绝对定位的参照物 */
  }

  .content {
    /* 必须绝对定位：脱离文档流，才不会把自己的高度叠加进滚动区域 */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    /* 用 transform 而非 top 做位移：只走 GPU 合成，不触发重排与重绘 */
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

**两种主流实现路线（先选路线，再谈细节）：**

[width(15,38,20,27)]

| 路线                | 做法                                                          | 优点                     | 代价                                       |
| ------------------- | ------------------------------------------------------------- | ------------------------ | ------------------------------------------ |
| **预估 + 实测修正** | 先用 `estimatedItemHeight` 排布，节点渲染后再测量并回填高度表 | 首屏快、实现相对简单     | 滚动过程中位置会“**跳**”，必须配合锚点修正 |
| **两阶段测量**      | 先在离屏容器里渲染全部内容、量完所有高度，再进入正常滚动      | 位置绝对准确、全程不跳动 | 首屏要等测量完成，**数据量大时不可行**     |

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

## 9. 工业级基建选型

核心本质：除非为了学习原理或应对极其特殊的业务定制（如时间轴、甘特图），生产环境中不要轻易手写虚拟列表。各种边缘场景（如动态高度测量偏差、设备滚动惯性差异）深不可测。

- **React 生态**：`react-window`（轻量定高标配）、`react-virtuoso`（动态高度自动测量的最强方案）。
- **Vue 生态**：`vue-virtual-scroller`（老牌稳定），或基于 Vue 3 组合式 API 重构的现代虚拟化库。
- **Headless 无头方案**：`TanStack Virtual`（提供纯粹的逻辑 Hook，UI 与状态完全解耦，现代全栈及跨框架基建的首选）。

**按场景选型：**

[width(27,73)]

| 场景                                     | 推荐                                                     |
| ---------------------------------------- | -------------------------------------------------------- |
| 纯定高、性能优先                         | `react-window`，或 `vue-virtual-scroller` 的定高模式     |
| 动态高度、聊天 / 评论流                  | `react-virtuoso`；Vue 侧用 `@tanstack/vue-virtual`       |
| 跨框架、UI 完全自控                      | `TanStack Virtual`（headless，只给逻辑）                 |
| 二维表格（Excel 式）                     | 用专门的表格库（AG Grid、vxe-table），别自己拼二维虚拟化 |
| 只要“**跳过视口外渲染**”、不追求回收 DOM | 原生 `content-visibility`（见第 6 节，零 JS 成本）       |

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

## 11. 常见问题 (FAQ)

### 11.1 虚拟列表里 `Ctrl+F` 搜不到内容怎么办？

这是虚拟化的**固有代价**：没渲染的节点不在 DOM 里，浏览器的页内查找自然找不到。三种处理：

- **提供应用内的搜索**：在数据层过滤（而不是依赖浏览器查找），这是绝大多数产品的做法；
- **降低虚拟化范围**：对可搜索的短列表（几百条以内）干脆不虚拟化；
- **原生 `content-visibility`**：它只是跳过离屏渲染，DOM 节点**仍在文档中**，因此页内查找依然有效——如果你的场景既要性能又要可搜索，优先考虑它。

### 11.2 为什么快速滚动会白屏 / 露白？

典型的 **overscan 太小**：滚动速度超过了渲染速度，缓冲区被“**跑穿**”了。对策：

- 调大 `overscan`（代价是常驻 DOM 变多）；
- 采用自适应策略：**根据滚动速度动态放大缓冲区**，快速滚动时多渲染几屏，慢下来再收回去；
- 检查是否有其他开销拖慢了每帧：滚动回调里有没有读 `offsetHeight`、子项有没有复杂计算。

### 11.3 聊天记录往上加载历史消息，为什么视口会跳动？

因为**新内容插入到了顶部**，把原有内容整体向下推了。虚拟列表的标准解法是**滚动锚定 (Scroll Anchoring)**：

- 加载前记录当前 `scrollTop` 与内容总高度；
- 数据插入、重排完成后，用「新增的高度差」修正 `scrollTop`：`newScrollTop = oldScrollTop + addedHeight`；
- 更稳妥的做法是以**当前可见的第一个 item 为锚点**，修正后保证这个 item 仍在原来的屏幕位置。

注意这一步要在 **DOM 更新之后、浏览器绘制之前**（`nextTick` / `useLayoutEffect`）完成，否则会看到一次明显的跳动。

### 11.4 `key` 用数组下标到底有什么问题？

下标是**位置标识**,不是**数据标识**。数据一变，同一个 `key` 会指向不同的数据，`patch` 机制于是做出错误复用：

- **删除中间项**：后面的内容整体“**串位**”，输入框内容、展开状态全部错乱；
- **排序 / 筛选后**：组件状态跟着位置走，而不是跟着数据走；
- **虚拟列表里更致命**：节点本来就在高频复用，用下标容易造成「看起来更新了、其实复用了旧状态」。

所以一律用**业务 ID**。真没有 ID 时，也要在数据进入列表前生成并随数据一起持久化。

### 11.5 动态高度估不准怎么办？

- **提高预估精度**：按内容类型分档预估（纯文本一行、带图卡片一行），而不是全局一个值；
- **实测回填 + 缓存**：测量到真实高度后写入缓存表，同一个 ID 下次直接命中；
- **接受误差并做锚点修正**：滚动中位置小范围跳动不可避免，关键是**用户当前看的那一项不能跳**。

### 11.6 虚拟列表配合无限滚动怎么做？

两者分工明确：**虚拟列表管「渲染多少」，无限滚动管「数据加载多少」**。落地要点：

- **触发点用 sentinel + `IntersectionObserver`**：在列表底部放一个哨兵元素，进入视口就请求下一页，不要监听 `scroll` 事件自己算；
- **加载状态要占位**：请求中的 loading 行也要计入总高度，否则数据回来时会跳；
- **提前量**：在距离底部还有一两屏时就发起请求，让用户感觉不到等待；
- **别忘了「已到底」**：没有更多数据时要停止观察，否则会无限触发。

### 11.7 虚拟列表对 SEO 有影响吗？

有。搜索引擎抓取的是**渲染后的 DOM**，虚拟列表里绝大部分内容压根不在 DOM 中，抓取不到。

所以判断标准很简单：**这个页面需要被搜索到吗？**

- **需要**（商品详情、文章列表页）：首屏内容老老实实服务端渲染，虚拟化只用于「加载更多之后」的交互区域；
- **不需要**（后台系统、聊天应用、监控大屏）：放心用虚拟列表，SEO 不是你的目标。

真要两者兼得，可以走「**SSR 输出前 N 条 + 客户端仅对后续数据虚拟化**」的混合方案。
