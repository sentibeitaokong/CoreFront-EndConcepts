# Bundle 体积与依赖治理工程

**核心本质**：Bundle 优化并非盲目追求“**字节最小化**”，而是系统级的**资源负荷管理**。真正的性能瓶颈往往不是网络带宽限制，而是**主线程在解析、编译、执行 JavaScript 时引发的严重阻塞**。优化目标应当是：在保证业务功能完整性的前提下，尽可能降低首屏必须的 JavaScript 执行成本，并最大化浏览器缓存的复用效率。

**治理准则**：先通过自动化审计定位“**最大、最繁琐**”的代码，再通过拆分、替换、懒加载或删除进行针对性治理。**切忌为了实现“完美分包”而将 Chunk 拆得极其细碎**，这会导致 HTTP 请求瀑布流失控，反而抵消缓存收益。

## 1. 多维度的 Bundle 审计链路

有效的 Bundle 治理必须依赖严谨的数据支撑，而非凭感觉优化。

* **静态体积审计**：利用 `rollup-plugin-visualizer` (Vite) 或 `webpack-bundle-analyzer` 生成直观的面积图。重点观察各模块的占比是否符合其业务价值。

:::details rollup-plugin-visualizer
```typescript
// vite.config.ts：自动化 Bundle 审计门禁
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'stats.html',
      gzipSize: true, // 开启 Gzip 预算，更真实反映传输体积
      brotliSize: true,
      open: false
    })
  ]
};
```
:::

* **动态覆盖率审计 (Coverage)**：利用 Chrome DevTools 的 **Coverage** 面板，查看首屏下载的 `main.js` 中，到底有多少代码是“**下载了但从未被执行**”的死代码。如果该比例超过 50%，说明你的路由拆分或按需加载策略严重失效。
* **执行成本监控 (Flame Graph)**：在 Performance 面板观测 `Evaluate Script` 耗时。体积大不一定卡，但如果你的包里包含了复杂的正则表达式、巨大的 JSON 数据块或极其深层的递归函数，其 JS 解析执行成本将成倍增长。

## 2. 首屏入口瘦身与代码调度策略

首屏入口 Chunk 是所有性能预算的重中之重，它既是网络下载的优先级最高资源，又是主线程启动时的“阻塞源”。

* **路由级异步化 (Route-based Splitting)**：必须严格执行按路由拆包。确保 `App.vue` 或 `router/index.ts` 中不包含任何非首屏组件的静态引用。

:::details 路由级异步化
```js
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  }
];

const RichEditor = () => import('./components/RichEditor.vue');
const ChartPanel = () => import('./components/ChartPanel.vue');
```
:::

* **重型组件“放逐”机制**：对于图表 (Echarts)、富文本 (Quill/Monaco)、地图 (Mapbox) 等重型资产，必须通过动态 `import()` 进行物理隔离。
* **全局初始化削减**：仔细审查 `main.ts` 入口文件。如果启动时全量初始化了 SDK、扫描了 IndexedDB、或配置了庞大的全局状态，必须通过延迟调用（如 `requestIdleCallback`）将这些操作推后到渲染完成后。
* **数据内联预取**：如果首屏强依赖某几条核心 API 数据，不要让页面渲染后发起请求，而应将其通过 SSR 注入到 HTML 的 `<script id="data">` 中。

## 3. 依赖引入纪律与副作用清理

“**一行 import 拖进半个 npm 库**”是导致 Bundle 爆炸的根源。

* **优先 ESM 消费**：强制配置构建工具优先消费 `module` 或 `esnext` 入口的包。
* **函数级按需导入**：严禁 `import { ... } from 'xxx-library'` 如果该库导出方式不支持 Tree Shaking。对于 Lodash 等库，必须严格使用 `import debounce from 'lodash-es/debounce'`。
* **Tree Shaking 守护**：利用 `sideEffects` 配置告知打包器哪些文件即使被显式 import 也不能删除（例如全局样式、Polyfill）。**严禁将所有第三方库写进 `sideEffects: false`，除非你确保该库确实无任何副作用。**
* **多版本锁定与收敛**：通过 `pnpm list` 定期扫描依赖树。如果发现项目里同时存在 `lodash@3` 和 `lodash@4`，必须强制通过 `resolutions` 或 `pnpm.overrides` 进行版本对齐。

:::details pnpm.overrides
:::code-group
```json [package.json]
{
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.21",
      "**/axios": "1.6.0" 
    }
  }
}
```
:::


## 4. Chunk 分层与缓存策略

合理拆包的目标不是 chunk 越多越好，而是让“**高复用、低变更**”的代码稳定缓存，让“**高变更、低复用**”的业务代码独立更新。

* **runtime 独立**：运行时代码独立后，减少业务改动导致 vendor hash 变化。
* **vendor 分层**：框架核心、UI 库、图表库等可按稳定性和使用频率拆分。
* **避免碎片化**：过多小 chunk 会增加请求排队、HTTP 头部和调度成本。
* **按页面聚合**：只被一个路由使用的组件，不要强行抽成公共包。

```ts
// Rollup / Vite 手动分包示例
manualChunks(id) {
  if (id.includes('node_modules/vue')) return 'vendor-vue';
  if (id.includes('node_modules/echarts')) return 'vendor-echarts';
  if (id.includes('node_modules')) return 'vendor';
}
```

## 5. 核心度量指标与发布门禁

Bundle 治理必须工程化，建立“**体积预算 (Size Budget)**”准入机制。

| 核心指标 | 观测目标与架构含义 | 建议控制线 |
| --- | --- | --- |
| **Initial JS Size** | 首屏交互前必须下载的 JS 总量。 | < 170KB (Gzip) |
| **Unused JS Ratio** | 首屏加载后，下载了却没执行的代码比例。 | < 30% |
| **Long Tasks Count** | JS 解析与编译过程造成的长任务数量。 | 越少越好 |
| **Chunk Request Waterfalls** | 首屏关键路径并发下载的 chunk 数量，观察是否有不必要的串行请求。 | < 10 个 |
| **Hash Stability** | vendor 等公共 chunk 因业务改动而失效的频率。 | 接近 0% |

## 6. 进阶排查手段

* **依赖循环分析**：检查是否存在循环引用（Circular Dependency），循环引用会迫使打包器产生意外的 Chunk，干扰 Tree Shaking 效率。
* **副作用审计**：如果发现 `lodash` 或 `dayjs` 完整包进去了，检查该库的 `package.json`，如果它没有导出 `sideEffects: false`，你需要手动在 `vite.config.ts` 中通过 `optimizeDeps` 或 `resolve.alias` 进行强制干预。
* **SourceMap 还原验证**：如果你优化了体积却发现定位报错变难了，检查 `sourcemap` 配置是否包含 `sourcesContent`。极致的体积优化应在 CI 上传 SourceMap 到监控平台后，将产物目录中的 `.map` 文件彻底物理销毁。