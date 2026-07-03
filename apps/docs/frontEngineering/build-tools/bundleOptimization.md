# 产物构建优化：Tree Shaking 与代码分割

前端构建优化的核心并非单纯压缩物理体积，而是在**首屏加载 (FCP)、浏览器缓存命中率、按需加载机制与构建复杂度**之间寻找极致的平衡点。Tree Shaking 负责在 AST 层面剔除死代码，代码分割 (Code Splitting) 负责规划物理文件的物理分布，而 Chunk 策略则决定了这些资源如何通过 HTTP 协议长期稳定地服务于真实流量。

## 1. Tree Shaking 的底层原理与局限

Tree Shaking 依赖基于 ES Modules (ESM) 的静态模块分析。打包器（如 Rollup/Vite）通过构建全局依赖图，追踪 `import` 和 `export` 的精确绑定，最终在代码生成阶段丢弃未被访问的节点。

**ESM 与 CommonJS 的根本差异：**

* **ESM（强静态）**：依赖关系在编译期确立。`import { Button } from '@acme/ui'` 使得打包器明确知道只需保留 `Button` 的相关逻辑。

```ts
import { Button } from '@acme/ui'

export function render() {
  return Button
}
```

* **CommonJS（弱静态/动态）**：依赖关系在运行期确立。`require('./components/' + name)` 存在路径拼接与条件分支，打包器为保证运行时安全，只能实施保守策略，将整个目录或全量代码打入产物。

```js
const name = process.env.COMPONENT
const component = require(`./components/${name}`)
```

## 2. Tree Shaking 触发与生效的铁律

### 2.1 强制发布与消费 ESM 产物

现代 npm 包必须提供纯正的 ESM 产物，并在 `package.json` 中通过 `exports` 字段显式声明入口路由，以获得最优的静态分析收益：

```json
{
  "name": "@acme/utils",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}

```

### 2.2 精确圈定 `sideEffects` (副作用)

`sideEffects`用来告诉打包器哪些文件即使没有显式导出被使用，也不能删除。若错误配置为 `false`，会导致按需引入时丢失全局 CSS、Polyfill 或原型链扩展机制。

* **最佳实践**：提供精确的白名单数组，而非简单的布尔值。

```json
{ "sideEffects": ["*.css", "src/polyfills.ts"] }

```

### 2.3 隔离顶层副作用污染

若模块在顶层作用域包含立即执行逻辑（如修改 `window` 对象、打点初始化），即使该模块的 `export` 未被任何文件导入，其代码仍会被打包器强行保留：

```ts
// ❌ 顶层污染：代码必被打包
window.__APP_READY__ = true
export const add = (a, b) => a + b

// ✅ 惰性初始化：按需触发，安全 Shaking
export const init = () => { window.__APP_READY__ = true }

```

## 3. Code Splitting 的触发边界

代码分割解决的是“**关键渲染路径上的资源优先级**”问题。

### 3.1 静态分包

通过静态 `import` 引入。模块进入主依赖图，参与首屏加载（适合基础框架、全局路由、状态管理）。

```ts
import App from './App.vue'
import router from './router'
```

### 3.2 动态分包

通过 `import()` 动态引入。打包器会生成独立 Chunk，按需下载（适合路由页面、重型弹窗、图表或富文本编辑器）。

```ts
const UserCenter = () => import('./views/UserCenter.vue')
```

## 4. Chunk 拆包策略与架构设计

Chunk 并非越碎越好。文件过大导致单次下载阻塞（尤其是低带宽环境），过碎则引发 HTTP 并发瓶颈、压缩算法效率断崖式下跌及复杂的缓存失效链。

### 4.1 生产级基础拆分模型

| Chunk 类型 | 内容特征 | 优化目标 |
| --- | --- | --- |
| **`runtime`** | 模块加载映射、运行时补丁 | 极小且变动频繁，防止业务更新导致 Vendor 缓存失效。 |
| **`vendor`** | 核心第三方库 (Vue, 路由, 状态库) | 极少变动，最大化压榨浏览器长时间强缓存收益。 |
| **`common`** | 跨页面公共业务组件/工具函数 | 提取交集，避免在多个异步页面中重复打包相同的业务逻辑。 |
| **`async`** | 路由页面、按需懒加载的重型功能 | 隔离业务，大幅降低首屏 Initial JS 体积。 |

### 4.2 Vite / Rollup 手动分包实战

利用 `manualChunks` 将高频共用的底层框架与超大体积的独立库进行物理隔离：

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 核心视图框架独立打包，缓存周期极长
            if (/[\\/](vue|vue-router|pinia)[\\/]/.test(id)) return 'framework'
            // 超大且独立的图表库单独隔离
            if (/[\\/](echarts|chart\.js)[\\/]/.test(id)) return 'charts'
            // 剩余第三方依赖
            return 'vendor'
          }
        }
      }
    }
  }
})
```

### 4.3 Webpack / Rspack 分包

```js
module.exports = {
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vueVendor: {
          test: /[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/,
          name: 'vue-vendor',
          priority: 30,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10,
        },
        common: {
          minChunks: 2,
          name: 'common',
          priority: 0,
        },
      },
    },
  },
}
```

Webpack/Rspack 的 `splitChunks` 更偏规则驱动，可以通过 `minSize`、`maxSize`、`minChunks`、`priority` 精细控制拆包边界。

## 5. 企业级分包决策基准

### 5.1 必须隔离的场景 (To Split)

* **首屏非必须的重载模块**：如 ECharts 渲染引擎、PDF.js 预览核心、Three.js 场景库。
* **长效缓存库**：Vue/React 及其核心生态链（通常数月甚至数年不升级）。
* **多实例业务复用模块**：在复杂 Monorepo 或多入口工程中，被 3 个以上 Entry 共同依赖的庞大业务组件。

### 5.2 严禁过度拆分的场景 (Not To Split)

* **高内聚的细碎逻辑**：将仅有几 KB 的工具函数强行独立成 Chunk，其 HTTP 握手与请求头开销远超文件自身的传输成本。
* **首屏强依赖链路**：将首屏必须立刻执行的代码拆解为多个存在时序依赖的 Vendor，会人为制造串行请求瀑布。

## 6. 度量与链路排查

任何缺乏数据支撑的优化配置都是盲目的。在构建流水线与线上监控中，需建立闭环的数据观测体系：

* **静态体积探查**：通过 `rollup-plugin-visualizer` (Vite) 或 `webpack-bundle-analyzer` 精确穿透每个 Chunk 的模块构成，寻找异常膨胀点。
* **线上瀑布流观测**：结合真实用户的网络环境，观察 Initial Chunks 的并发数量与最大异步 Chunk 的加载耗时。
* **企业级 APM 联动**：将构建产物的 Sourcemap 稳定对接至 Sentry 等监控中枢，确保代码分割后不仅能加速首屏，还能在报错时精准还原源码链路。

## 7. 常见问题 (FAQ) 与高级避坑指南

### 7.1 仅引入了一个纯函数，为何导致整个工具库被打包?

* 该包缺乏 ESM 规范支持（仅导出 CJS），或在其入口文件存在隐式的顶层副作用。另一常见原因是业务代码采用了命名空间动态访问：`import * as utils from 'utils'; utils[dynamicMethod]()`，迫使打包器保留全量代码以防运行时报错。

### 7.2 拆分 Vendor 后，Lighthouse 首屏评分反而下降？

* 过度拆分导致首屏并发请求数量突破浏览器限制（特别是 HTTP/1.1 环境），引发头部阻塞 (HOL blocking)；或者错误地将首屏关键渲染路径上的模块拆分到了异步加载链条的末端。

### 7.3 明确配置了路由懒加载，但该异步页面依然被打入首屏 Main Chunk？

* 存在**隐式的同步依赖逃逸**。检查侧边栏菜单配置、全局路由守卫拦截器或前置权限表中，是否不小心使用了 `import UserCenter from './UserCenter.vue'` 进行了静态导入，从而破坏了懒加载的异步边界。