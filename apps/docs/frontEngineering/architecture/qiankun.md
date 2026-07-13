---
outline: [2, 3]
---

# qiankun 微前端方案

`qiankun` 是基于 `single-spa` 封装的微前端框架，核心能力是应用注册、HTML Entry 加载、生命周期调度、JS 沙箱和样式隔离。它更适合存量 Webpack 体系下的企业后台系统改造。

## 1. 核心原理

qiankun 的运行链路可以概括为：

```text
主应用注册子应用
    ↓
监听路由变化
    ↓
命中 activeRule
    ↓
加载子应用 HTML Entry
    ↓
解析并执行 JS/CSS 资源
    ↓
调用 bootstrap / mount / unmount
```

子应用不是通过 iframe 运行，而是把资源加载到主应用页面中执行。因此它的体验更接近原生 SPA，但隔离能力依赖框架沙箱。

## 2. 主应用接入

```ts
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'order',
    entry: '//localhost:7101',
    container: '#subapp-container',
    activeRule: '/order',
    props: {
      baseRoute: '/order',
      getToken: () => localStorage.getItem('token'),
    },
  },
])

start({
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true,
  },
  prefetch: 'all',
})
```

主应用通常负责布局、菜单、登录态、权限、路由分发和异常兜底，不应承载子应用业务逻辑。

## 3. 子应用生命周期

子应用必须导出标准生命周期。以 Vue 3 为例：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  const container = props.container
  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {
  console.log('order app bootstrap')
}

export async function mount(props: any) {
  render(props)
}

export async function unmount() {
  app?.unmount()
  app = null
}
```

## 4. 子应用构建配置

Webpack 子应用需要输出 `umd` 格式，并保证 `jsonpFunction` 或 `chunkLoadingGlobal` 唯一。

```js
module.exports = {
  output: {
    library: 'order',
    libraryTarget: 'umd',
    chunkLoadingGlobal: 'webpackJsonp_order',
    publicPath: '//localhost:7101/',
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
}
```

Vite 子应用接 qiankun 时需要额外插件或适配层，因为 Vite 原生 ESM 产物和 qiankun 传统 HTML Entry 执行模型并不完全契合。新项目若已经全量 Vite 化，应谨慎评估 qiankun 的改造成本。

## 5. 沙箱机制

### 5.1 JS 沙箱

qiankun 主要通过 `Proxy` 代理全局对象。子应用访问 `window` 时会被导向一个代理对象，挂载阶段记录变更，卸载阶段恢复环境。

| 沙箱       | 适用场景           | 特点                            |
| ---------- | ------------------ | ------------------------------- |
| Proxy 沙箱 | 现代浏览器、多实例 | 性能较好，隔离常规全局变量      |
| 快照沙箱   | 旧浏览器兼容       | 挂载前后对比 `window`，性能较差 |

JS 沙箱不能解决所有问题。直接操作全局 DOM、污染原型链、挂载全局事件、创建未清理定时器，仍然需要子应用自己治理。

### 5.2 CSS 隔离

| 配置                         | 原理                       | 注意点                                       |
| ---------------------------- | -------------------------- | -------------------------------------------- |
| `experimentalStyleIsolation` | 给样式选择器追加作用域前缀 | 对复杂选择器和第三方库样式要测试             |
| `strictStyleIsolation`       | 使用 Shadow DOM            | 弹窗、Tooltip、Teleport 容易出现挂载边界问题 |

企业项目更常用“应用级 class 前缀 + CSS Modules + 组件库命名空间”组合，减少运行时隔离的不确定性。

## 6. 通信方式

### 6.1 Props 透传

适合传认证、权限、环境变量、埋点方法等低频公共能力。

```ts
registerMicroApps([
  {
    name: 'order',
    entry: '//localhost:7101',
    container: '#container',
    activeRule: '/order',
    props: {
      user: currentUser,
      track: reportEvent,
    },
  },
])
```

### 6.2 全局状态

qiankun 提供 `initGlobalState`，但建议只用于主题、语言、登录用户这类公共状态。复杂业务状态应通过后端 API 或 URL 解耦。

```ts
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({ theme: 'light' })

actions.onGlobalStateChange(state => {
  console.log(state.theme)
})

actions.setGlobalState({ theme: 'dark' })
```

## 7. 常见问题

| 问题                | 处理方式                                                     |
| ------------------- | ------------------------------------------------------------ |
| 子应用资源 404      | 检查 `publicPath` 和部署路径                                 |
| 切换后事件重复触发  | 在 `unmount` 清理事件、订阅、定时器                          |
| 样式串扰            | 应用前缀、CSS Modules、样式隔离配置组合使用                  |
| 弹窗位置异常        | 统一弹窗挂载容器，不要默认挂到 `document.body`               |
| Vite 子应用加载异常 | 使用适配插件，或优先评估 Wujie、Micro-app、Module Federation |

## 8. 适用场景

- 主应用和多数子应用是 Webpack 体系。
- 存量后台系统希望低成本拆分并独立部署。
- 团队需要成熟案例、社区经验和可搜索的避坑方案。
- 对 iframe 的体验割裂不能接受，但又需要一定运行时隔离。

## 9. 不适用场景

- 全新 Vite/ESM 项目，并且希望少做构建适配。
- 对安全隔离要求接近浏览器物理隔离。
- 多个子应用需要同时高频并行运行。
- 团队不能严格执行生命周期清理和样式规范。

## 10. 落地建议

qiankun 的优势是“存量改造友好”，不是“零成本隔离”。真正落地时要把子应用生命周期、路由前缀、样式命名、公共依赖、错误监控和发布回滚一起纳入规范。
