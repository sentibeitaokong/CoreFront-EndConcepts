# 产物构建优化

前端构建优化的核心目标不是单纯把文件压到最小，而是在**首屏加载、缓存命中、按需加载、构建复杂度**之间取得平衡。Tree Shaking 负责删掉没用的代码，Code Splitting 负责把剩余代码拆到合适的位置，Chunk 策略则决定这些文件如何长期稳定地服务线上流量。

## 1. Tree Shaking 的底层原理

Tree Shaking 本质是基于静态模块图的死代码删除。打包器从入口文件出发，分析所有 `import` 和 `export`，标记真正被引用的绑定，然后在生成阶段移除未被使用的声明。

它强依赖 ESM 的静态结构：

```ts
import { Button } from '@acme/ui'

export function render() {
  return Button
}
```

上面的依赖关系在运行前就能确定，打包器可以知道 `@acme/ui` 中哪些导出被使用。CommonJS 的 `require()` 则更难分析，因为它允许动态路径、条件加载和运行时对象变形。

```js
const name = process.env.COMPONENT
const component = require(`./components/${name}`)
```

这种写法会让构建器很难判断最终依赖哪个模块，通常只能保守保留更多代码。

## 2. Tree Shaking 生效条件

### 2.1 优先发布 ESM 产物

npm 包应提供 ESM 入口，并在 `package.json` 中明确声明：

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

应用侧使用 Vite、Rollup、Webpack 5、Rspack 时，ESM 入口通常能获得更好的静态分析效果。

### 2.2 正确声明副作用

`sideEffects` 用来告诉打包器哪些文件即使没有显式导出被使用，也不能删除。

```json
{
  "sideEffects": ["*.css", "src/polyfills.ts"]
}
```

如果一个库把 `sideEffects` 错误写成 `false`，但入口里实际引入了全局 CSS、polyfill、注册逻辑，就可能导致生产环境样式丢失或运行时能力缺失。

### 2.3 避免顶层副作用污染

下面的代码即使导出未被使用，也可能因为顶层执行逻辑被保留：

```ts
console.log('init analytics')
window.__APP_READY__ = true

export function add(a: number, b: number) {
  return a + b
}
```

工具函数包应尽量保持纯函数导出，把注册、打点、polyfill 等副作用放进显式调用的初始化函数。

## 3. Code Splitting 的触发方式

Code Splitting 解决的是“代码应该什么时候下载”的问题。

### 3.1 静态分包

静态 `import` 会进入同步依赖图，默认参与首屏 bundle：

```ts
import App from './App.vue'
import router from './router'
```

这类模块适合放置首屏必须执行的代码，例如根组件、路由基础设施、状态管理入口。

### 3.2 动态分包

动态 `import()` 会形成异步边界，打包器会为其生成独立 chunk：

```ts
const UserCenter = () => import('./views/UserCenter.vue')
```

它适合用于路由页面、重型弹窗、图表编辑器、富文本编辑器、低频后台模块等场景。用户不进入对应路径时，这些代码不会进入首屏下载链路。

## 4. Chunk 策略设计

Chunk 策略不是越碎越好。文件过大导致首屏慢，文件过碎会制造请求瀑布、压缩率下降、缓存管理复杂。

### 4.1 基础拆分模型

常见的生产拆分可以分为四类：

| Chunk 类型 | 内容                               | 策略目标     |
| ---------- | ---------------------------------- | ------------ |
| `runtime`  | 模块加载器、chunk 映射、运行时代码 | 保持小且稳定 |
| `vendor`   | 第三方依赖                         | 利用长期缓存 |
| `common`   | 多页面共享业务代码                 | 减少重复打包 |
| `async`    | 路由级或功能级懒加载代码           | 降低首屏体积 |

### 4.2 Vite / Rollup 手动分包

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('vue') ||
              id.includes('pinia') ||
              id.includes('vue-router')
            ) {
              return 'vue-vendor'
            }
            if (id.includes('echarts') || id.includes('chart.js')) {
              return 'charts-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
```

这类策略适合中大型应用。把框架、图表、编辑器等变化频率低且体积大的依赖拆开，可以显著提高浏览器缓存命中率。

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

## 5. 企业级拆包判断标准

### 5.1 应该拆出去的代码

- 体积大且首屏不一定需要的模块，例如图表、地图、富文本、PDF 预览。
- 变化频率低的第三方框架，例如 Vue、React、路由、状态管理。
- 路由级页面，特别是后台系统的低频管理页面。
- 多入口应用中重复出现的公共业务模块。

### 5.2 不应该过度拆分的代码

- 首屏必需的小模块。拆出去只会增加一次网络往返。
- 强耦合且总是一起更新的业务代码。强行拆分会降低缓存收益。
- 几 KB 的工具函数。单独成 chunk 的收益通常小于请求成本。

## 6. 排查与度量

优化前后必须看数据，而不是只看配置是否“高级”。

```bash
pnpm build
```

常见观察指标：

- 首屏 JS 总体积和 gzip / brotli 体积。
- Initial chunks 数量。
- 最大异步 chunk 体积。
- 关键路由的瀑布图请求数量。
- 发版后 vendor chunk 的缓存命中率。

如果使用 Vite，可以接入 `rollup-plugin-visualizer` 查看每个 chunk 中包含了哪些模块；如果使用 Webpack/Rspack，可以使用 `webpack-bundle-analyzer` 或官方 stats 数据进行分析。

## 7. 常见问题

### 7.1 为什么明明只引入一个函数，整个库都被打进来了？

常见原因是库只提供 CommonJS 入口、包内存在顶层副作用、`sideEffects` 声明不准确，或业务代码使用了命名空间导入后进行动态访问。

```ts
import * as utils from '@acme/utils'

const fn = utils[dynamicName]
```

这种动态访问会迫使打包器保留更多导出。

### 7.2 为什么拆了 vendor 后首屏反而慢了？

可能是首屏请求数量增加、HTTP/1.1 并发受限、拆包边界过碎，或者 vendor 中包含首屏必需代码但被拆成多个串行依赖。拆包需要结合实际瀑布图调整，而不是固定套用配置。

### 7.3 为什么异步页面仍然出现在首屏包里？

通常是因为该页面被某个同步入口静态导入了。例如路由懒加载写对了，但侧边栏、权限表、预加载逻辑又静态引用了页面模块，最终会把它重新拉回首屏依赖图。
