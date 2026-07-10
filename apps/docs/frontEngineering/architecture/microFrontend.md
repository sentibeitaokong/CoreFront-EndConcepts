# 微前端架构

微前端（Micro Frontends）是将大型前端应用拆分为多个可独立开发、独立构建、独立部署和独立运行的小型应用，再由主应用统一组合为完整用户体验的架构模式，借鉴了微服务的思想。

## 1. 什么是微前端？

**微前端**是指将前端应用分解为多个更小的子应用，每个子应用独立开发、独立测试、独立部署，由**主应用（基座/容器）** 统一编排和整合。

> **💡 举个例子：**
> 一个电商平台包含：商品列表、购物车、个人中心、订单管理等功能模块。
>
> - **传统巨石应用：** 整个电商是一个项目，所有功能耦合在一起。10 人团队在同一仓库开发，合并冲突频繁，回归测试范围大，发布窗口长。
> - **微前端模式：** 商品团队维护"**商品子应用**"，订单团队维护"**订单子应用**"……每个子应用有独立仓库和 CI/CD，通过主应用路由整合，用户看到的仍是一个整体。

### 1.1 起源

微前端概念由 ThoughtWorks 在 2016 年提出，灵感来自后端微服务。传统 SPA 单体架构面临以下困境：

- **代码膨胀**：仓库代码量达数十万行，构建时间从几分钟增至几十分钟
- **团队耦合**：多团队在同一仓库修改，发布相互牵制
- **技术锁定**：新框架无法引入，技术栈更新困难
- **回归恐惧**：细微改动可能影响整个应用

## 2. 微前端的优势与挑战

### 2.1 优势

- **独立开发与部署**：子应用有独立仓库和 CI/CD，可独立上线
- **技术栈无关**：子应用可使用不同框架（Vue、React、Angular 等），便于渐进式迁移
- **团队自治**：各团队自主决定技术选型和迭代节奏，降低沟通成本
- **按需加载**：首屏仅加载当前子应用，其他延迟加载
- **独立回滚**：单个子应用出问题可单独回滚，不影响其他子应用
- **并行开发**：多个团队可并行开发不同功能，加速交付

### 2.2 挑战

| 挑战             | 说明                             | 常见解决方案                            |
| ---------------- | -------------------------------- | --------------------------------------- |
| **样式隔离**     | 不同子应用的 CSS 可能互相污染    | CSS Modules、Shadow DOM、CSS-in-JS、BEM |
| **JS 沙箱**      | 子应用的全局变量和副作用需要隔离 | Proxy 沙箱、iframe、快照沙箱            |
| **公共依赖管理** | 公共库需避免重复加载             | Module Federation shared、CDN externals |
| **通信复杂**     | 子应用间或与主应用的数据传递     | 自定义事件、Shared Store、Props 透传    |
| **路由冲突**     | 子应用路径可能覆盖               | 主应用统一分发，子应用添加路由前缀      |
| **首屏性能**     | 额外通信和加载开销               | 预加载、骨架屏、缓存、按需加载          |
| **调试困难**     | 跨应用调用链难以追踪             | 统一日志系统、分布式追踪                |

> 微前端不是为了"**拆得越细越好**"，而是为了解决大型应用和多团队协作中的复杂度问题。小团队、小项目通常不需要引入。

## 3. 主流实现方案

### 3.1 方案对比

| 方案                               | 特点                                         | 优点                                    | 局限                                      | 适用场景                     |
| ---------------------------------- | -------------------------------------------- | --------------------------------------- | ----------------------------------------- | ---------------------------- |
| **iframe**                         | 浏览器原生隔离                               | 隔离最强、接入简单                      | 体验割裂、通信复杂、性能开销大            | 第三方系统嵌入、遗留系统集成 |
| **Web Components**                 | Custom Elements + Shadow DOM                 | 标准化、框架无关、CSS 隔离好            | 生态不成熟、复杂组件开发吃力              | 跨框架组件库、UI 组件复用    |
| **single-spa**                     | 路由分发 + 生命周期管理                      | 框架无关、成熟稳定                      | 需手动处理隔离和沙箱，配置较繁琐          | 需要基础框架、自定义需求多   |
| **qiankun**                        | 基于 single-spa，HTML 入口 + 沙箱 + 样式隔离 | 开箱即用、国内生态成熟、接入成本低      | 对子应用构建有要求、不支持 Vite 完美接入  | 企业微前端快速落地、国内主流 |
| **Micro-app**（京东）              | 基于 Web Component + Shadow DOM 模拟 iframe  | 接入最简单、天然 JS/CSS 隔离、支持 Vite | 较新、社区较小、Shadow DOM 弹窗需额外处理 | 快速接入已有项目、中小团队   |
| **Module Federation**（Webpack 5） | 运行时模块共享与动态加载                     | 依赖共享能力强、无额外运行时            | 配置复杂、仅 Webpack 5+、学习曲线陡峭     | 大型 SPA 拆分、组件级共享    |
| **Vite Module Federation**         | 基于 Vite 的 MF 插件                         | 开发体验好、配置简单                    | 成熟度不如 Webpack 版                     | 新项目、Vite 技术栈团队      |

### 3.2 选型建议

| 场景                         | 推荐方案                           |
| ---------------------------- | ---------------------------------- |
| 新建大型项目，Webpack 技术栈 | Module Federation                  |
| 新建大型项目，Vite 技术栈    | Vite Module Federation / Micro-app |
| 存量系统快速改造             | qiankun / Micro-app                |
| 需要最大灵活性和自定义       | single-spa                         |
| 只需组件级共享               | Module Federation                  |
| 强隔离或第三方页面嵌入       | iframe                             |

## 4. 核心设计

### 4.1 整体架构

```
用户访问 URL
    ↓
主应用（基座）：布局、菜单、认证、权限、路由分发
    ↓
子应用 A（Vue）  子应用 B（React）  子应用 C（Angular）
    ↓
基础设施：JS 沙箱、CSS 隔离、通信、预加载、监控、错误兜底
```

主应用应保持轻量，不承载过多业务逻辑，避免重新变为"**巨石基座**"。

### 4.2 路由分发

主应用作为路由**总控制器**，根据 URL 前缀激活对应子应用：

```
URL: /app-order/list     → 订单子应用处理 /list
URL: /app-goods/detail/1 → 商品子应用处理 /detail/1
```

**关键实践：**

- 为每个子应用分配稳定的一级路由前缀
- 子应用内部路由设置正确的 `base`
- 服务端配置 history fallback，避免刷新 404
- 跨应用跳转使用主应用提供的导航方法

### 4.3 生命周期

子应用暴露标准生命周期钩子供主应用调度：

```javascript
export async function bootstrap() {
  // 初始化：加载公共资源
}

export async function mount(props) {
  // 挂载：渲染应用，props 包含用户信息、token、路由等
  render(props.container)
}

export async function unmount(props) {
  // 卸载：销毁应用，清理事件、定时器、全局副作用
  app?.unmount()
}
```

**核心原则：** mount 只负责渲染，unmount 必须清理干净，避免事件重复绑定和内存泄漏。

### 4.4 通信机制

| 方式            | 适用场景                         | 注意事项                 |
| --------------- | -------------------------------- | ------------------------ |
| **Props 透传**  | 主应用向子应用传用户、权限、配置 | 简单可靠，适合单向传递   |
| **CustomEvent** | 低频事件通知                     | 需统一命名约定，及时解绑 |
| **共享 Store**  | 登录态、主题、语言等全局状态     | 避免业务状态过度共享     |
| **URL 参数**    | 筛选条件、详情 ID 等可序列化数据 | 适合可分享、可刷新的场景 |
| **接口通信**    | 业务数据交互                     | 优先通过后端 API 解耦    |

**推荐原则：** 能用 URL 和后端 API 解耦的，不强行做前端全局通信。

### 4.5 样式与 JS 隔离

**CSS 隔离方案：**

| 方案                        | 原理               | 优点         | 局限                 |
| --------------------------- | ------------------ | ------------ | -------------------- |
| **CSS Modules**             | 构建时生成唯一类名 | 无运行时开销 | 第三方库样式难控制   |
| **BEM 命名**                | 规范类名前缀       | 零开销、简单 | 靠人为约束           |
| **postcss-prefix-selector** | 构建时自动加前缀   | 自动化、透明 | 可能影响选择器优先级 |
| **Shadow DOM**              | 浏览器原生隔离     | 最强隔离     | 弹窗/浮层会逃逸      |

**JS 沙箱方案：**

| 方案                         | 优点               | 局限                     |
| ---------------------------- | ------------------ | ------------------------ |
| **Proxy 沙箱**（如 qiankun） | 高性能、支持多实例 | 不兼容 IE                |
| **快照沙箱**                 | 兼容性好           | 性能开销大、不支持多实例 |
| **iframe**                   | 最强隔离           | 通信复杂、性能开销大     |

**子应用卸载必须清理：** window 事件、定时器、全局变量、订阅、WebSocket、未完成请求。

## 5. 快速接入示例

### 5.1 qiankun 主应用

```tsx
// container/src/index.tsx
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'app-order',
    entry: '//localhost:3001',
    container: '#micro-app-container',
    activeRule: '/app-order',
    props: {
      getToken: () => localStorage.getItem('token'),
    },
  },
])

start({
  prefetch: true,
  sandbox: { experimentalStyleIsolation: true },
})
```

### 5.2 Vue 子应用适配

```typescript
// app-order/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'

let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  const container = props.container?.querySelector('#app') || '#app'
  app = createApp(App)
  app.mount(container)
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {}
export async function mount(props: any) {
  render(props)
}
export async function unmount() {
  app?.unmount()
  app = null
}
```

### 5.3 Module Federation 主应用配置

```javascript
// container/webpack.config.js
new ModuleFederationPlugin({
  name: 'container',
  remotes: {
    appOrder: 'appOrder@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})
```

### 5.4 Module Federation 子应用配置

```javascript
// app-order/webpack.config.js
new ModuleFederationPlugin({
  name: 'appOrder',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})
```

## 6. 适用场景

### 6.1 适合使用

- 多团队共同维护同一大型前端产品
- 不同业务模块需要独立发布和回滚
- 存量系统需要渐进式迁移到新技术栈
- 平台型产品存在多个可插拔业务模块
- 已具备较成熟的 CI/CD、监控和前端工程化能力

### 6.2 不适合使用

- 项目规模小、团队人少，普通 SPA 已满足需求
- 缺少自动化发布、测试和监控基础设施
- 团队对微前端不熟悉，维护成本不可控
- 对首屏性能极端敏感，又无法做好预加载
- 仅为"技术先进"而拆分，没有真实业务或组织诉求

## 7. 常见问题与最佳实践

| 问题               | 建议                                                      |
| ------------------ | --------------------------------------------------------- |
| **样式污染**       | 统一应用前缀，使用 CSS Modules 或构建时前缀               |
| **弹窗层级异常**   | 统一 Modal 挂载容器，注意 Shadow DOM 下的 Portal/Teleport |
| **依赖重复加载**   | 对 React、Vue、组件库等配置 shared 或 external            |
| **刷新 404**       | 服务端 fallback 到主应用入口                              |
| **跨应用跳转混乱** | 主应用提供统一导航 API                                    |
| **全局状态滥用**   | 只共享认证、权限、主题和语言等公共状态                    |
| **卸载不干净**     | unmount 中清理事件、定时器、订阅和全局副作用              |
| **线上排查困难**   | 统一日志、错误监控、性能监控和版本标识                    |

## 8. 性能优化

- **按需加载**：仅加载当前路由命中的子应用
- **预加载**：空闲时或悬停时预加载高频子应用
- **依赖共享**：核心框架和公共库避免重复打包
- **缓存策略**：静态资源使用 CDN 和长期缓存，入口文件短缓存
- **加载兜底**：骨架屏、错误边界和重试机制，避免白屏
- **减少通信**：避免高频跨应用事件，复杂数据通过接口解耦

## 9. 微前端 vs. Monorepo

微前端关注**运行时组合**，Monorepo 关注**代码仓库组织**，两者互补而非对立。

| 维度           | Monorepo                    | 微前端                     |
| -------------- | --------------------------- | -------------------------- |
| **关注阶段**   | 开发期、构建期              | 运行期、部署期             |
| **核心目标**   | 统一代码管理和依赖复用      | 独立运行部署和运行时组合   |
| **技术栈**     | 通常统一                    | 可以不同                   |
| **代码共享**   | workspace 协议天然支持      | 需额外设计 shared 机制     |
| **运行时隔离** | 无                          | 需要沙箱和样式隔离         |
| **常用工具**   | pnpm、Turborepo、Changesets | qiankun、Module Federation |

> **实践建议：** Monorepo 管理子应用仓库和公共包，微前端方案负责运行时的组合与隔离，两者结合能充分发挥各自优势。

```
micro-frontend-monorepo/
├── apps/
│   ├── container/        # 主应用 (Monorepo 管理)
│   ├── app-order/        # 订单子应用 (Monorepo 管理 + 微前端暴露)
│   └── app-goods/        # 商品子应用
├── packages/
│   ├── shared-ui/        # 公共 UI 组件库
│   ├── shared-utils/     # 公共工具函数
│   └── eslint-config/    # 共享 ESLint 配置
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 10. 落地检查清单

引入微前端前建议确认以下事项：

1. 是否有清晰的业务边界和团队边界
2. 是否需要独立发布、独立回滚和渐进式迁移
3. 是否制定了子应用接入规范、路由规范和通信规范
4. 是否具备统一登录、权限、监控、日志和错误兜底能力
5. 是否规划了依赖共享、样式隔离、沙箱和缓存策略
6. 是否有自动化测试、CI/CD 和灰度发布能力

> 如果以上问题大多没有答案，建议优先完善工程化基础设施，再考虑微前端拆分。
