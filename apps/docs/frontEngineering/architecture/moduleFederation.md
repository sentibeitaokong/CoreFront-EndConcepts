---
outline: [2, 3]
---

# Module Federation 微前端方案

Module Federation 是 Webpack 5 引入的运行时模块共享能力，后来也被 Rspack、Vite 插件生态实现。它的核心不是沙箱隔离，而是让多个独立构建产物在运行时互相加载模块、共享依赖和组合页面。

## 1. 核心定位

传统打包把模块依赖固定在构建时；Module Federation 把一部分模块依赖推迟到运行时解析。

```markdown
Host 应用
↓ 动态加载 remoteEntry.js
Remote 应用暴露模块
↓
import('order/App')
↓
运行时渲染远程页面或组件
```

它更像“运行时模块化”，适合技术栈统一、工程规范强、追求依赖复用和组件级组合的大型前端系统。

## 2. 核心概念

| 概念             | 说明                                  |
| ---------------- | ------------------------------------- |
| Host             | 消费远程模块的主应用                  |
| Remote           | 暴露模块给其他应用使用的远程应用      |
| `remoteEntry.js` | 远程模块清单和加载入口                |
| `exposes`        | Remote 对外暴露的模块                 |
| `remotes`        | Host 声明可消费的远程应用             |
| `shared`         | 多应用共享依赖，如 Vue、React、组件库 |

## 3. Remote 配置

Webpack 示例：

```js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'order',
      filename: 'remoteEntry.js',
      exposes: {
        './OrderApp': './src/OrderApp',
        './routes': './src/routes',
      },
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.5.0',
        },
      },
    }),
  ],
}
```

Remote 需要独立部署，并保证 `remoteEntry.js` 可被 Host 访问。

## 4. Host 配置

```js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'container',
      remotes: {
        order: 'order@https://cdn.example.com/order/remoteEntry.js',
      },
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.5.0',
        },
      },
    }),
  ],
}
```

Host 中动态加载远程模块：

```ts
const OrderApp = defineAsyncComponent(() => import('order/OrderApp'))
```

## 5. 依赖共享

`shared` 是 Module Federation 的核心收益，也是最容易踩坑的部分。

```js
shared: {
  vue: {
    singleton: true,
    eager: false,
    requiredVersion: '^3.5.0',
  },
  pinia: {
    singleton: true,
  },
}
```

| 配置              | 作用                   |
| ----------------- | ---------------------- |
| `singleton`       | 保证依赖只保留一个实例 |
| `requiredVersion` | 声明版本兼容范围       |
| `eager`           | 是否立即加载共享依赖   |
| `strictVersion`   | 版本不满足时直接报错   |

Vue、React、状态管理库和设计系统通常应设为单例。业务工具函数不一定需要共享，过度共享会导致版本耦合。

## 6. 与传统微前端的差异

| 维度     | Module Federation        | qiankun / Wujie / Micro-app  |
| -------- | ------------------------ | ---------------------------- |
| 组合粒度 | 模块、组件、路由、页面   | 通常是应用级                 |
| 隔离能力 | 弱，默认同一 JS 上下文   | 中到强，取决于沙箱方案       |
| 依赖复用 | 强，运行时共享依赖       | 需要 external 或额外共享机制 |
| 改造要求 | 构建配置和版本治理要求高 | 更偏运行时接入               |
| 适合场景 | 统一技术栈的大型工程     | 异构系统和存量系统整合       |

Module Federation 不解决 CSS 污染、全局变量污染和应用卸载清理问题。这些仍需要团队规范或额外隔离方案。

## 7. 路由级组合

Host 可以把远程页面挂到自己的路由表中：

```ts
const routes = [
  {
    path: '/order',
    component: () => import('order/OrderApp'),
  },
]
```

也可以让 Remote 暴露路由配置：

```ts
const remoteRoutes = await import('order/routes')

router.addRoute({
  path: '/order',
  component: Layout,
  children: remoteRoutes.default,
})
```

路由级组合要约定权限、菜单、面包屑、错误页和 fallback 逻辑，否则 Host 很容易变成强耦合中心。

## 8. 发布与版本治理

Module Federation 的最大工程风险是“运行时版本不一致”。Host 部署时消费的是某个远程入口 URL，而 Remote 可能随时发布新版本。

稳定方案通常包括：

- `remoteEntry.js` 短缓存，具体 chunk 使用 hash 长缓存。
- 远程入口按环境和版本区分，例如 `/order/1.8.0/remoteEntry.js`。
- Host 配置中心下发 remote 地址，支持灰度和回滚。
- 共享依赖版本统一治理，避免多份 Vue/React 实例。
- 远程模块加载失败时提供本地 fallback 或错误兜底页。

## 9. 常见问题

| 问题             | 处理方式                                       |
| ---------------- | ---------------------------------------------- |
| 远程模块加载失败 | 加载重试、降级页面、监控告警                   |
| shared 版本冲突  | 统一依赖版本，启用版本约束                     |
| 样式污染         | CSS Modules、应用前缀、Shadow DOM 或构建时前缀 |
| 类型缺失         | Remote 产出 `.d.ts`，通过包或 CI 同步          |
| 本地联调复杂     | 固定端口、联调注册表、mock remote 地址         |

## 10. 适用场景

- 技术栈统一，例如全线 React 或全线 Vue。
- 多团队共享页面、组件、路由和业务模块。
- 对依赖复用和首屏性能有明确要求。
- 团队具备较强构建、发布、版本治理能力。

## 11. 不适用场景

- 子应用技术栈差异大，且需要强隔离。
- 存量系统很难改造构建配置。
- 团队缺少统一依赖版本和发布治理。
- 只是简单嵌入第三方系统或老后台。

## 12. 落地建议

Module Federation 适合把微前端做成“运行时模块平台”，但它不是沙箱框架。若业务目标是异构系统整合，优先考虑 qiankun、Wujie、Micro-app 或 iframe；若业务目标是统一技术栈下的模块共享和独立发版，Module Federation 才是更强方案。
