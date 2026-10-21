---
outline: [2, 3]
---

# qiankun 微前端方案

`qiankun` 是蚂蚁金服基于 `single-spa` 封装的企业级微前端框架。它把微前端落地最麻烦的三件事做成了开箱即用：**HTML Entry** 让子应用无须改造构建产物，**运行时沙箱**隔离 JS/CSS 污染，**生命周期调度**保证路由切换时挂载与卸载有序。

**一句话理解**：主应用只负责注册与路由分发，子应用仍然是独立仓库、独立构建、独立部署的普通 SPA。

## 1. 整体架构

### 1.1 设计定位与能力边界

[width(24,76)]

| 问题               | qiankun 的解法                                               |
| ------------------ | ------------------------------------------------------------ |
| 子应用怎么接入     | 注册 `entry`（HTML 地址）+ `container` + `activeRule` 三件套 |
| 子应用资源怎么加载 | `fetch` 入口 HTML，解析 `<script>` / `<link>` 后按顺序执行   |
| 全局变量互相污染   | Proxy / 快照沙箱，子应用卸载时清理写入的全局变量             |
| 样式互相污染       | 选择器作用域前缀（scoped）或 Shadow DOM 物理隔离             |
| 切换后的残留状态   | 标准生命周期 + 全局钩子 + 事件、定时器等副作用的自动回收     |

**qiankun 的沙箱是“防误写”的工程隔离，不是安全边界**。它无法阻止子应用通过 `document`、`iframe`、`postMessage` 等方式绕过限制。对安全隔离有硬性要求的场景，应使用 iframe 级方案。

### 1.2 架构分层

```tree
主应用（基座）
├─ 注册层  registerMicroApps / loadMicroApp
│           维护子应用注册表，声明 entry / container / activeRule / props
├─ 调度层  start + reroute
│           监听路由，匹配 activeRule，串行执行卸载与挂载
├─ 加载层  HTML Entry
│           fetch HTML → 解析 script/style → 解析相对路径 → 执行脚本
└─ 隔离层  JS 沙箱（Proxy / 快照）+ CSS 隔离（scoped / Shadow DOM）
                     ↓
子应用（独立仓库 / 独立构建 / 独立部署）
  暴露 bootstrap / mount / unmount，也可以脱离基座独立运行
```

### 1.3 核心概念

[width(18,82)]

| 概念             | 说明                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| **主应用**       | 也叫基座，负责布局、菜单、登录态、路由分发和子应用注册                |
| **子应用**       | 一个普通 SPA，额外导出 `bootstrap` / `mount` / `unmount` 三个生命周期 |
| **HTML Entry**   | 子应用的入口 HTML 地址，qiankun 从它里面解析出真正的 JS / CSS 资源    |
| **`activeRule`** | 子应用的激活规则，路由命中时才加载或挂载                              |
| **`container`**  | 子应用 DOM 的渲染目标，通常是一个布局区域而不是整个页面               |
| **沙箱**         | JS 全局变量隔离 + CSS 样式隔离，保证多个子应用互不干扰                |
| **生命周期**     | 基座调度子应用的标准接口，也是子应用清理副作用的唯一时机              |

### 1.4 启动与调度全流程

```tree
registerMicroApps(...)   写入子应用注册表
        ↓
start(options)           监听 hashchange / popstate，触发首次 reroute
        ↓
reroute()                匹配 activeRule
        ├─ 先卸载不再命中的子应用（unmount + 停用沙箱）
        └─ 再加载并挂载新命中的子应用（loadApp → mount）
        ↓
loadApp()                beforeLoad → 激活沙箱 → fetch HTML
                         → 解析并执行 JS / CSS → 读取生命周期
        ↓
mount(props)             渲染进 container
```

- **先卸载、后挂载**：同一容器内不会出现 DOM 堆叠；切换目标与当前应用相同时，qiankun 不会重复挂载。
- **`reroute` 串行执行**：用户快速点击菜单会连续触发路由变化，qiankun 用一条 Promise 队列把调度串起来，避免同一个子应用被并发加载或卸载。
- **资源只加载一次**：子应用首次加载后，入口 HTML、CSS 和 JS 会保留在内存中；再次切回时只重新执行 `mount`，不会重复请求入口资源。因此 `bootstrap` 只执行一次，而 `mount` / `unmount` 可以执行多次。

### 1.5 HTML Entry 资源加载

`single-spa` 要求子应用暴露一个 JS 入口，qiankun 则直接接收 HTML 地址。这样做的好处是子应用不需要为微前端改造打包入口，`index.html` 里怎么写，qiankun 就怎么解析。

整体流程是：`fetch` HTML → 用 `DOMParser` 解析 → 摘出 `<script>` 和 `<link rel="stylesheet">` → 解析相对路径 → 执行脚本并读取生命周期 → 把 `body` 内容塞进容器。

#### 1.5.1 入口 HTML 解析

```js
// 加载子应用：生命周期 → 沙箱 → HTML Entry → 读取生命周期（极简源码）
async function loadApp(app) {
  try {
    // ----- 步骤 0：触发 beforeLoad 全局钩子 -----
    await execHooks(app.lifeCycles?.beforeLoad, app)

    // ----- 步骤 1：创建或复用沙箱 -----
    const sandboxOptions = normalizeSandboxOptions(frameworkOptions.sandbox)

    let sandbox = null
    if (sandboxOptions.enabled) {
      // 同一个子应用切出再切回时，复用已有沙箱
      sandbox = sandboxInstances.get(app.name)
      if (!sandbox) {
        sandbox = new ProxySandbox(app.name, sandboxOptions)
        sandboxInstances.set(app.name, sandbox)
      }
      sandbox.active()
    }

    // ----- 步骤 2：拉取子应用 HTML（允许注入自定义 fetch） -----
    const request = frameworkOptions.fetch || fetch
    const html = await request(app.entry).then(res => res.text())
    const tpl = frameworkOptions.getTemplate
      ? frameworkOptions.getTemplate(html)
      : html

    // ----- 步骤 3：解析 HTML，摘出 script 和外部样式 -----
    const doc = new DOMParser().parseFromString(tpl, 'text/html')
    const scripts = [...doc.querySelectorAll('script')]
    const styles = [...doc.querySelectorAll("link[rel='stylesheet']")]
    scripts.forEach(script => script.remove())
    styles.forEach(style => style.remove())

    // ----- 步骤 4：加载外部样式 -----
    await Promise.all(
      styles.map(style =>
        loadStyle(
          resolveAssetUrl(
            app.entry,
            style.getAttribute('href'),
            frameworkOptions,
          ),
        ),
      ),
    )

    // ----- 步骤 5：把 body 内容插入容器 -----
    const container = document.querySelector(app.container)
    if (!container) {
      throw new Error('container ' + app.container + ' not found')
    }
    container.innerHTML = doc.body.innerHTML

    // ----- 步骤 6：写入运行环境标记与资源基址 -----
    const runtimeGlobal = sandbox ? sandbox.proxy : window
    runtimeGlobal.__POWERED_BY_QIANKUN__ = true
    runtimeGlobal.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ =
      frameworkOptions.getPublicPath
        ? frameworkOptions.getPublicPath(app.entry)
        : new URL('.', app.entry).toString()

    // ----- 步骤 7：按顺序执行子应用脚本 -----
    for (const script of scripts) {
      const src = script.getAttribute('src')
      if (src) {
        const scriptUrl = resolveAssetUrl(app.entry, src, frameworkOptions)
        await execScript(scriptUrl, sandbox)
      } else {
        execInlineScript(script.textContent, sandbox)
      }
    }

    // ----- 步骤 8：从沙箱或 window 上读取生命周期 -----
    const sandboxGlobal = sandbox ? sandbox.proxy : window
    const lifecycles = sandboxGlobal[app.name] || window[app.name]

    if (!lifecycles?.bootstrap || !lifecycles?.mount || !lifecycles?.unmount) {
      throw new Error(
        'micro app ' + app.name + ' must expose bootstrap, mount and unmount',
      )
    }

    return {
      ...app,
      lifecycles,
      container,
      sandbox, // 挂到应用实例上，供 unmount 时停用和清理
    }
  } catch (error) {
    callErrorHandlers(error)
    throw error
  }
}
```

这里省略了 `async` / `defer` 脚本的调度细节。真实实现会按 `import-html-entry` 的规则记录脚本属性，再决定执行顺序；内联 `<style>` 会随 `body` 一起插入，外部样式则单独走 `loadStyle`。

#### 1.5.2 资源路径解析

HTML Entry 里通常是相对路径，必须用子应用的入口地址作为基址：

```js
// 把相对路径的静态资源解析为基于入口 URL 的绝对路径
function resolveAssetUrl(entry, assetPath, options = {}) {
  if (!assetPath) {
    return ''
  }

  // 命中 excludeAssetFilter 的资源保持原样，交给浏览器原生加载
  if (options.excludeAssetFilter?.(assetPath)) {
    return assetPath
  }

  return new URL(assetPath, entry).toString()
}
```

#### 1.5.3 脚本执行

qiankun 不会直接向 DOM 插入 `<script>`，而是先 `fetch` 源码，再用 `new Function` 在沙箱里执行。原因有两个：一是能控制全局变量指向 `fakeWindow`，二是能保证多个脚本严格按顺序执行。

```js
// 在沙箱或真实 window 上执行子应用脚本
async function execScript(url, sandbox = null) {
  if (!url) {
    return
  }
  const code = await fetch(url).then(res => res.text())
  execCode(code, url, sandbox)
}

function execCode(code, sourceUrl, sandbox = null) {
  if (sandbox?.isActive) {
    const sandboxGlobal = sandbox.proxy
    // with(window) 让代码里的裸全局变量都走 Proxy 的 get / set
    const run = new Function(
      'window',
      'self',
      'globalThis',
      'with(window){\n;(function(){\n' +
        code +
        '\n}).call(window);\n}\n//# sourceURL=' +
        sourceUrl,
    )
    run.call(sandboxGlobal, sandboxGlobal, sandboxGlobal, sandboxGlobal)
    return
  }

  // 非沙箱模式：直接在真实 window 上执行
  const run = new Function('window', code + '\n//# sourceURL=' + sourceUrl)
  run(window)
}

// 内联脚本没有 src，直接执行其源码
function execInlineScript(code, sandbox = null) {
  execCode(code, 'inline-script', sandbox)
}
```

#### 1.5.4 样式加载

外部样式通过动态创建 `<link>` 插入主文档的 `document.head`：

```js
// 动态插入 <link> 加载样式表
function loadStyle(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.onload = resolve
    link.onerror = reject
    document.head.appendChild(link)
  })
}
```

样式进入的是**主文档的 head**，所以天然会和其他应用互相影响，这正是需要 CSS 隔离的原因。

## 2. 核心 API 与配置项

对外常用的 API 只有四个：`registerMicroApps`、`start`、`loadMicroApp`、`initGlobalState`。其余配置项都挂在前两个上面。

### 2.1 registerMicroApps：注册子应用

#### 2.1.1 基本用法

```ts
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'app-order', // 唯一标识，也是子应用生命周期的全局命名空间
    entry: '//localhost:7101', // HTML Entry 地址
    container: '#micro-container', // 子应用渲染的目标容器
    activeRule: '/order', // 路由匹配规则
    props: { token: 'xxx' }, // 主应用下发给子应用的数据
  },
])

start()
```

:::details 注册子应用(极简源码)

```js
//真实实现会把每个应用转换成 single-spa 的 registerApplication 调用，把 activeRule
//作为 activeWhen ，把 loadApp 作为应用加载函数。注册表本身只负责保存配置，不负责加载。

/** 所有已注册的子应用 */
const microApps = []

/**
 * 注册微应用
 * @param {Array} apps         子应用配置数组
 * @param {Object} lifeCycles  全局生命周期钩子
 */
export function registerMicroApps(apps, lifeCycles = {}) {
  apps.forEach(app => {
    // 同名应用只保留一份，避免重复注册导致重复挂载
    if (microApps.some(item => item.name === app.name)) {
      console.warn('[qiankun] 子应用 ' + app.name + ' 已注册')
      return
    }

    microApps.push({
      ...app,
      lifeCycles,
    })
  })
}
```

:::

#### 2.1.2 注册项字段

[width(18,36,10,36)]

| 字段         | 类型                                  | 必填 | 说明                                                        |
| ------------ | ------------------------------------- | ---- | ----------------------------------------------------------- |
| `name`       | `string`                              | 是   | 子应用唯一标识，也是挂载生命周期时的全局命名空间            |
| `entry`      | `string \| { scripts, styles, html }` | 是   | HTML Entry 地址，也可直接传入解析后的资源列表               |
| `container`  | `string \| HTMLElement`               | 是   | 子应用渲染的目标容器选择器或元素实例                        |
| `activeRule` | `string \| Function \| Array`         | 是   | 激活规则，日常用路径前缀，也可用函数自定义匹配              |
| `props`      | `object`                              | 否   | 主应用下发、`mount` 时接收的数据（用户、Token、埋点方法等） |
| `loader`     | `(loading: boolean) => void`          | 否   | 加载态回调，用于切换子应用时显示 / 隐藏 loading             |
| `sandbox`    | `boolean \| object`                   | 否   | 按子应用粒度覆盖全局沙箱配置（样式隔离等）                  |

#### 2.1.3 字段使用细节

- **`entry`**：必须是可跨域访问的 HTML 地址。基座与子应用分域部署时，子应用的静态资源服务要返回 `Access-Control-Allow-Origin`，否则 `fetch` 会被浏览器拦截。也可以传 `{ scripts, styles, html }`，适合资源清单由后端下发的场景。
- **`container`**：只在子应用挂载时查找，因此容器元素必须在挂载前已经存在。多 Tab 场景下，每个 Tab 要准备独立的容器，不能复用同一个 DOM 节点。
- **`activeRule`**：字符串按**路径段前缀**匹配，`/order` 能命中 `/order/list`，但不会误命中 `/order-detail`。Hash 路由下 `pathname` 不变，建议改成函数，基于 `location.hash` 自行判断；需要多个前缀命中同一个应用时，传数组。
- **`props`**：注册时是静态的，适合用户信息、权限、埋点方法这类低频数据。运行期间要更新，应使用 `initGlobalState`，或改用 `loadMicroApp` 手动管理并用 `update` 更新。
- **`loader`**：只在资源加载阶段触发，不等同于业务请求的 loading。切换子应用时用它控制顶部进度条即可，不要在 `mount` 里重复实现一套。
- **`sandbox`**：应用级覆盖，例如只给某个老应用开启 `strictStyleIsolation`，其余应用沿用全局配置。

### 2.2 start：启动框架

#### 2.2.1 基本用法

```ts
// 启动配置：实验性样式隔离 + 全量预加载
start({
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true,
  },
  prefetch: 'all',
})
```

:::details start(极简源码)

```js
/** 框架启动配置，由 start(options) 写入，loadApp() 读取 */
let frameworkOptions = {
  sandbox: true,
}
/** 防止重复 start */
let started = false

/**
 * 启动微前端框架
 * @param {Object} options  启动配置
 */
export function start(options = {}) {
  if (started) {
    return
  }
  started = true

  // 保存启动配置，供 loadApp 创建沙箱、选择预加载策略时读取
  frameworkOptions = {
    sandbox: true,
    ...options,
  }

  // 监听浏览器前进后退与 hash 变化
  window.addEventListener('hashchange', reroute)
  window.addEventListener('popstate', reroute)

  // 触发首次匹配
  reroute()

  // 首次挂载后再按配置预加载
  prefetchApps(microApps, frameworkOptions)
}
```

:::

#### 2.2.2 启动选项

[width(21,27,11,41)]

| 选项                 | 类型                           | 默认值 | 说明                                                               |
| -------------------- | ------------------------------ | ------ | ------------------------------------------------------------------ |
| `prefetch`           | `boolean \| 'all' \| string[]` | `true` | 空闲时预加载资源；`'all'` 预加载全部，传数组可按名指定高频子应用   |
| `sandbox`            | `boolean \| object`            | `true` | JS 沙箱与 CSS 隔离的统一开关                                       |
| `singular`           | `boolean \| Function`          | `true` | 单实例模式，同一时刻只允许一个子应用挂载；多 Tab 并存时要关掉      |
| `excludeAssetFilter` | `(url: string) => boolean`     | —      | 返回 `true` 的资源绕过 qiankun 的加载劫持，常用于第三方 SDK、JSONP |
| `fetch`              | `typeof window.fetch`          | —      | 自定义资源请求方法，用于加签名、走网关代理                         |
| `getPublicPath`      | `(entry: string) => string`    | —      | 自定义子应用静态资源路径的解析规则                                 |
| `getTemplate`        | `(tpl: string) => string`      | —      | 拉取 HTML 后二次加工模板，可剔除异常脚本                           |

#### 2.2.3 选项使用细节

- **`sandbox`**：默认开启，等价于 `{ sandbox: true }`。传对象时可以配置 `strictStyleIsolation`、`experimentalStyleIsolation`、`globalWhiteList`（需要写回真实 `window` 的全局变量）。两种样式隔离不要同时开，`strictStyleIsolation` 优先生效。
- **`singular`**：默认为 `true`，路由切换时 qiankun 会先卸载上一个子应用再挂载下一个。要在一个页面里同时保留多个子应用实例（例如多 Tab 页签），需要 `start({ singular: false })`，并改用 `loadMicroApp` 手动管理每个实例。
- **`prefetch`**：`true` 表示首个子应用挂载后再预加载其余应用；`'all'` 表示 `start` 后立即预加载全部；传数组只预加载指定 name。预加载会和首屏抢带宽，首屏敏感的后台建议用数组圈定高频应用。
- **`excludeAssetFilter`**：有些第三方脚本不希望经过 qiankun 的 `fetch` + `new Function` 执行（例如自带 JSONP、依赖 `document.currentScript` 的 SDK），命中后 qiankun 会按原生方式加载。
- **`fetch`**：适合给资源请求统一加签名、鉴权头，或让资源请求走内部网关。它只影响 qiankun 拉取子应用资源的请求，不影响子应用自己的业务请求。
- **`getPublicPath`**：用于修正 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`。子应用产物部署在 CDN 或非入口目录时，靠它告诉子应用“静态资源的真实基址”。
- **`getTemplate`**：拿到的是入口 HTML 字符串，可以在解析前做替换，例如剔除不需要的埋点脚本、注入环境变量。

:::details 部分配置项(源码位置)

```js
// qiankun 拉取并预处理入口 HTML
async function fetchHtml(entry, options) {
  const request = options.fetch || window.fetch
  const html = await request(entry).then(res => res.text())

  // getTemplate：解析前二次加工模板
  return options.getTemplate ? options.getTemplate(html) : html
}

// 资源 URL 解析：excludeAssetFilter 命中时不改写，交给浏览器原生加载
function resolveAssetUrl(entry, assetPath, options) {
  if (options.excludeAssetFilter?.(assetPath)) {
    return assetPath
  }
  return new URL(assetPath, entry).toString()
}

// 子应用执行前注入资源基址
function injectPublicPath(sandbox, entry, options) {
  const publicPath = options.getPublicPath
    ? options.getPublicPath(entry)
    : new URL('.', entry).toString()

  sandbox.proxy.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = publicPath
}
```

:::

#### 2.2.4 路由调度 reroute

每次 URL 变化都会触发 `reroute`。qiankun 会计算应用的活跃状态，严格按照 **“先卸载失效应用，再挂载命中应用”** 的顺序执行：

```js
// 所有 reroute 串行执行，避免快速切换时并发加载或卸载
let rerouteQueue = Promise.resolve()

function reroute() {
  // 单次失败不能让整条队列进入 rejected 状态，否则后续路由变化都不再调度
  rerouteQueue = rerouteQueue.then(doReroute).catch(error => {
    console.error('[qiankun] reroute failed', error)
  })
  return rerouteQueue
}

async function doReroute() {
  // 1. 找出当前 URL 下应激活的所有子应用
  const activeApps = microApps.filter(app => matchActiveRule(app.activeRule))
  const activeNames = new Set(activeApps.map(app => app.name))

  // 2. 卸载已挂载但不再激活的子应用
  for (const mountedApp of mountedApps.values()) {
    if (!activeNames.has(mountedApp.name)) {
      await unmountApp(mountedApp)
    }
  }

  // 3. 挂载新匹配且尚未挂载的子应用
  for (const app of activeApps) {
    if (!mountedApps.has(app.name)) {
      const loadedApp = await loadApp(app)
      await mountApp(loadedApp)
    }
  }
}
```

路由匹配本身支持字符串前缀、数组和函数：

```js
function matchActiveRule(activeRule, location = window.location) {
  if (typeof activeRule === 'function') {
    return activeRule(location)
  }
  if (Array.isArray(activeRule)) {
    return activeRule.some(rule => matchActiveRule(rule, location))
  }

  // history 路由看 pathname，hash 路由看 # 后面的路径
  const path = location.hash ? location.hash.slice(1) : location.pathname
  return path === activeRule || path.startsWith(activeRule + '/')
}
```

#### 2.2.5 prefetch 预加载

预加载的目标是在用户真正切换之前，把入口 HTML 和资源提前拉取并缓存，减少切换时的白屏时间。

```ts
// 预加载策略：all / 默认（首屏后）/ 指定子应用列表
start({
  prefetch: 'all', // start 后立即预加载全部
  // prefetch: true // 首个子应用挂载后再预加载
  // prefetch: ['app-order', 'app-user'] // 只预加载指定子应用
})
```

:::details 预加载(极简源码)

```js
// 预加载实现：请求入口 HTML，并预解析、缓存资源
function prefetchApps(apps, options) {
  const run = () => {
    apps.forEach(app => {
      fetch(app.entry)
        .then(res => res.text())
        .then(html => prefetchAssetsFromHtml(app.entry, html))
        .catch(callErrorHandlers)
    })
  }

  if (options.prefetch === 'all') {
    run()
    return
  }

  if (!options.prefetch) {
    return
  }

  // 默认策略：首个应用挂载后，在空闲时间预加载，避免和首屏抢带宽
  afterFirstMounted(() => {
    const idle =
      window.requestIdleCallback || (callback => setTimeout(callback, 1))
    idle(run)
  })
}
```

:::

### 2.3 loadMicroApp：手动加载

#### 2.3.1 基本用法

`loadMicroApp` 不走路由匹配，调用后直接加载并挂载，适合弹窗、抽屉、多 Tab 这类由业务代码控制生命周期的场景。

```ts
import { loadMicroApp } from 'qiankun'

const microApp = loadMicroApp({
  name: 'app-order-detail',
  entry: '//localhost:7101',
  container: '#order-detail-container',
  props: { orderId: 123 },
})

// 返回值是控制句柄
microApp.getStatus() // 'NOT_BOOTSTRAPPED' | 'MOUNTING' | 'MOUNTED' | ...
microApp.update({ orderId: 456 }) // 更新 props，触发子应用 update 生命周期
await microApp.unmount() // 卸载并释放容器
```

:::details 手动加载(源码实现)

```js
/**
 * 手动加载微应用
 * @param {Object} app            子应用配置
 * @param {Object} configuration  本次加载的框架配置
 * @param {Object} lifeCycles     全局生命周期钩子
 */
export async function loadMicroApp(app, configuration = {}, lifeCycles = {}) {
  // 不走路由匹配，直接加载并挂载
  const microApp = await loadApp({
    ...app,
    lifeCycles,
  })

  await mountApp(microApp)

  // 返回控制句柄，业务侧据此更新、卸载和查询状态
  return {
    getStatus() {
      return mountedApps.has(app.name) ? 'MOUNTED' : 'NOT_MOUNTED'
    },
    update(props) {
      return updateApp(microApp, props)
    },
    unmount() {
      return unmountApp(microApp)
    },
  }
}
```

:::

#### 2.3.2 多 Tab 场景

多 Tab 后台需要同一个子应用同时存在多个实例，每个实例绑定独立容器：

```ts
start({ singular: false })

const tabInstances = new Map()

function openTab(tab) {
  const instance = loadMicroApp({
    name: 'app-order',
    entry: '//localhost:7101',
    container: tab.container,
    props: { tabId: tab.id },
  })

  tabInstances.set(tab.id, instance)
}

async function closeTab(tabId) {
  const instance = tabInstances.get(tabId)
  await instance?.unmount()
  tabInstances.delete(tabId)
}
```

此时状态管理必须由业务侧负责：切 Tab 不要调用 `unmount`，而是隐藏 DOM；关闭 Tab 时才卸载，并确保子应用在 `unmount` 里清理自己的订阅和定时器。

### 2.4 生命周期 API

#### 2.4.1 子应用标准生命周期

子应用必须导出 `bootstrap`、`mount`、`unmount` 三个函数：

```ts
// 子应用需暴露的标准生命周期
let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  const container = props.container
  app = createApp(App)
  app.use(router)

  // 在 qiankun 中挂到基座分配的容器上，独立运行时挂到自己的 #app
  app.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时直接渲染
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

/** 1. bootstrap —— 初始化，只调用一次 */
export async function bootstrap(props: any) {
  console.log('order app bootstrap', props)
}

/** 2. mount —— 挂载 / 渲染，可重复调用 */
export async function mount(props: any) {
  render(props)
}

/** 3. unmount —— 卸载 / 清理副作用，可重复调用 */
export async function unmount(props: any) {
  app?.unmount()
  app = null
}
```

#### 2.4.2 全局生命周期钩子

注册时可以传入全局钩子，所有子应用的加载、挂载、卸载都会触发：

```ts
// 全局生命周期钩子：统一处理 loading 与资源清理
registerMicroApps(apps, {
  beforeLoad: [
    async app => {
      console.log('beforeLoad', app.name)
    },
  ],
  beforeMount: [
    async app => {
      /* 显示 loading */
    },
  ],
  afterMount: [
    async app => {
      /* 隐藏 loading */
    },
  ],
  beforeUnmount: [
    async app => {
      /* 确认可卸载 */
    },
  ],
  afterUnmount: [
    async app => {
      /* 清理资源 */
    },
  ],
})
```

[width(21,24,55)]

| 钩子            | 触发时机            | 常见用途                         |
| --------------- | ------------------- | -------------------------------- |
| `beforeLoad`    | 拉取入口资源之前    | 显示全局 loading、埋点开始       |
| `beforeMount`   | 子应用 `mount` 前   | 显示切换动画、重置滚动位置       |
| `afterMount`    | 子应用 `mount` 后   | 隐藏 loading、记录当前应用       |
| `beforeUnmount` | 子应用 `unmount` 前 | 确认弹窗、保存草稿               |
| `afterUnmount`  | 子应用 `unmount` 后 | 清理主应用侧为该子应用创建的资源 |

#### 2.4.3 生命周期调用源码

全局钩子拿到的是**应用配置**，子应用生命周期拿到的是**合并后的 props**，两者参数不同：

```js
/** 依次执行钩子，支持单个函数或数组 */
async function execHooks(hooks, app) {
  const list = Array.isArray(hooks) ? hooks : hooks ? [hooks] : []
  for (const hook of list) {
    // 全局钩子参数：应用配置 + 框架配置
    await hook(app, frameworkOptions)
  }
}

async function mountApp(app) {
  const props = {
    ...app.props,
    name: app.name,
    container: app.container, // mount 额外注入的挂载点
  }

  // 1. 全局钩子：拿到应用配置
  await execHooks(app.lifeCycles?.beforeMount, app)

  // 2. 子应用生命周期：拿到合并后的 props
  await app.lifecycles.mount(props)

  // 3. 全局钩子：拿到应用配置
  await execHooks(app.lifeCycles?.afterMount, app)
}
```

#### 2.4.4 独立运行判断

子应用通过 `__POWERED_BY_QIANKUN__` 判断是否运行在 qiankun 中。独立开发时不启动主应用也能直接访问子应用：

```ts
// 独立运行（非 qiankun 环境）时才渲染
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}
```

使用 `vite-plugin-qiankun` 时，改用插件导出的 `qiankunWindow.__POWERED_BY_QIANKUN__`，它在开发模式下做过兼容处理：

```ts
// Vite 子应用入口：用 qiankunWindow 判断运行环境
import { createApp, App as VueApp } from 'vue'
import {
  renderWithQiankun,
  qiankunWindow,
} from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import router from './router'

let app: VueApp<Element> | null = null

function render(props: any = {}) {
  const { container } = props

  app = createApp(App)
  app.use(router)

  // qiankun 环境挂到基座容器，独立运行挂到自己的 #app
  app.mount(container ? container.querySelector('#app') : '#app')
}

// 1. 独立运行：不走 qiankun 生命周期，直接渲染
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}

// 2. qiankun 环境：注册生命周期，由基座决定何时渲染
renderWithQiankun({
  bootstrap() {
    console.log('[vite-app] bootstrap')
  },
  mount(props) {
    render(props)
  },
  update(props) {
    console.log('[vite-app] 接收到新的 props', props)
  },
  unmount() {
    app?.unmount()
    app = null
  },
})
```

### 2.5 initGlobalState：全局状态

#### 2.5.1 基本用法

`initGlobalState` 由主应用调用一次，子应用从 `props` 里拿到 `onGlobalStateChange`、`setGlobalState`、`offGlobalStateChange` 三个方法：

:::code-group

```ts [主应用]
// 主应用：初始化 → 监听 → 更新
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({ theme: 'light' })

actions.onGlobalStateChange((state, prev) => {
  console.log('state changed from', prev, 'to', state)
})

actions.setGlobalState({ theme: 'dark' })
```

```ts [子应用]
export async function mount(props: any) {
  props.onGlobalStateChange((state: any, prev: any) => {
    console.log('子应用收到状态变化', prev, state)
  }, true)

  props.setGlobalState({ theme: 'dark' })
}

export async function unmount(props: any) {
  // 只清理当前子应用的监听，避免反复挂载后监听器叠加
  props.offGlobalStateChange()
}
```

:::

:::details 全局状态(极简源码)

```js
/** 全局共享状态 */
let globalState = {}
/** 每个应用各自持有一组监听器，便于单独清理 */
const actionsMap = new Map()

function emitGlobal(state, prevState) {
  actionsMap.forEach(record => {
    record.listeners.forEach(listener => listener(state, prevState))
  })
}

function getActions(key) {
  if (!actionsMap.has(key)) {
    actionsMap.set(key, { listeners: new Set() })
  }

  const record = actionsMap.get(key)

  return {
    /**
     * 监听全局状态变化
     * @param {Function} listener          (state, prevState) => void
     * @param {boolean}  fireImmediately   是否立即触发一次
     */
    onGlobalStateChange(listener, fireImmediately = false) {
      record.listeners.add(listener)

      if (fireImmediately) {
        // 首次触发时 prevState 与 state 内容相同
        listener(globalState, { ...globalState })
      }
    },

    /** 浅合并并通知所有应用 */
    setGlobalState(nextState) {
      const prev = globalState
      globalState = {
        ...globalState,
        ...nextState,
      }
      emitGlobal(globalState, prev)
      return true
    },

    /** 只清理当前应用注册的监听器 */
    offGlobalStateChange() {
      record.listeners.clear()
      return true
    },
  }
}

/** 主应用初始化，返回主应用自己的 actions */
export function initGlobalState(initialState = {}) {
  globalState = { ...initialState }
  return getActions('global-master')
}

/** 子应用加载时，qiankun 调用它生成 props 中的 actions */
export function getMicroAppStateActions(appName) {
  return getActions(appName)
}
```

:::

#### 2.5.2 使用注意

- `onGlobalStateChange` **不返回取消函数**，清理要调用 `offGlobalStateChange()`。它清掉的是当前应用这一组监听器，不会影响其他应用。
- `setGlobalState` 是**浅合并**，嵌套对象需要整体替换；也没有按 key 细粒度订阅的能力。
- 全局状态只适合主题色、语言、登录用户这类**少量公共状态**。列表数据、表单草稿等业务状态应通过后端 API 或 URL 解耦，否则两个子应用会隐式耦合在一起。
- 子应用必须在 `unmount` 里调用 `offGlobalStateChange()`，否则反复挂载会让同一个监听器叠加执行多次。

### 2.6 通信方式怎么选

[width(23,32,45)]

| 方式              | 典型数据                    | 特点                                                             |
| ----------------- | --------------------------- | ---------------------------------------------------------------- |
| `props`           | 用户、权限、埋点方法        | 注册时下发，`mount` 接收；运行期要更新需配合 `update` 或全局状态 |
| `initGlobalState` | 主题、语言、登录用户        | 主应用初始化，子应用从 props 拿 actions；浅合并、全局广播        |
| URL 参数          | 列表筛选、详情 ID、来源标记 | 可分享、可刷新，适合跨应用跳转                                   |
| 后端 API          | 业务数据                    | 子应用自己拉取，天然解耦，不依赖基座                             |
| `localStorage`    | 非敏感的偏好配置            | 同域共享；必须加应用级命名空间，避免键名冲突                     |

选择原则：**能通过 URL 或 API 传的，不要放进全局状态**。全局状态是同步通道，不是数据中心。

## 3. 沙箱与隔离

### 3.1 JS 沙箱类型

qiankun 的 JS 沙箱核心目标：**子应用的全局变量不污染主应用和其他子应用，子应用卸载时能完整恢复环境。**

[width(17,18,34,31)]

| 沙箱类型               | 适用场景              | 原理                                              | 特点                                       |
| ---------------------- | --------------------- | ------------------------------------------------- | ------------------------------------------ |
| **Proxy 沙箱**（默认） | 现代浏览器、多实例    | 通过 `Proxy` 代理 `window`，写入落到 `fakeWindow` | 性能好、支持多实例、不兼容 IE              |
| **快照沙箱**           | 旧浏览器兼容          | 挂载前快照 `window`，卸载时对比恢复               | 兼容性好、性能开销大、不支持多实例同时激活 |
| **Legacy 沙箱**        | 不支持 Proxy 的旧环境 | 克隆 `window` 到 `fakeWindow`                     | 已被 Proxy 沙箱替代                        |

快照沙箱的实现思路很直接：`mount` 前遍历 `window`，记下所有属性的值；`unmount` 时再遍历一遍，把变化的属性恢复，并删除新增的属性。代价是每次切换都要全量 diff，而且同一时刻只能有一个实例。

### 3.2 Proxy 沙箱实现

```js
/** 沙箱白名单：这些全局变量需要写回真实 window，供框架和主子应用共享 */
const DEFAULT_GLOBAL_WHITE_LIST = ['__POWERED_BY_QIANKUN__']

class ProxySandbox {
  constructor(appName, options = {}) {
    this.appName = appName
    this.isActive = false
    this.globalWhiteList = new Set([
      ...DEFAULT_GLOBAL_WHITE_LIST,
      ...(options.globalWhiteList || []),
    ])

    // 子应用自己的“假 window”，存储它的全局变量
    this.fakeWindow = Object.create(null)
    // 记录写过的属性，卸载时统一删除
    this.modifiedProps = new Set()

    this.patchSideEffects()

    this.proxy = new Proxy(this.fakeWindow, {
      get: (target, key) => this.get(target, key),
      set: (target, key, value) => this.set(target, key, value),
      has: () => true,
      deleteProperty: (target, key) => this.deleteProperty(target, key),
    })
  }

  get(target, key) {
    // 让 window / self / globalThis 指向沙箱自身，防止绕过代理
    if (key === 'window' || key === 'self' || key === 'globalThis') {
      return this.proxy
    }

    // 子应用自己写过的属性优先
    if (key in target) {
      return target[key]
    }

    // 其余属性回退到真实 window（setTimeout、location、Promise 等）
    return window[key]
  }

  set(target, key, value) {
    // 白名单属性直接写回真实 window
    if (this.globalWhiteList.has(key)) {
      window[key] = value
      return true
    }

    // 非白名单属性写入 fakeWindow，不污染真实 window
    target[key] = value
    this.modifiedProps.add(key)
    return true
  }

  deleteProperty(target, key) {
    delete target[key]
    this.modifiedProps.delete(key)
    return true
  }

  active() {
    this.isActive = true
  }

  inactive() {
    this.clearSideEffects()

    // 清空子应用在沙箱中设置的所有非白名单属性
    this.modifiedProps.forEach(key => {
      delete this.fakeWindow[key]
    })
    this.modifiedProps.clear()
    this.isActive = false
  }
}
```

:::details defineProperty 与 getOwnPropertyDescriptor 的代理不变量

```js
class ProxySandbox {
  // 接上面的 get / set / deleteProperty
  defineProperty(target, key, descriptor) {
    // 白名单属性定义到真实 window 上
    if (this.globalWhiteList.has(key)) {
      Object.defineProperty(window, key, descriptor)
      return true
    }
    // 非白名单属性定义到 fakeWindow 上
    this.modifiedProps.add(key)
    return Reflect.defineProperty(target, key, descriptor)
  }

  getOwnPropertyDescriptor(target, key) {
    // 优先返回 fakeWindow 上的属性描述符
    if (key in target) {
      return Object.getOwnPropertyDescriptor(target, key)
    }

    // 从真实 window 获取描述符时必须标记 configurable
    // 否则会触发 Proxy 的不变量（Invariant）异常
    const descriptor = Object.getOwnPropertyDescriptor(window, key)
    if (descriptor) {
      return {
        ...descriptor,
        configurable: true,
      }
    }
    return undefined
  }
}
```

:::

### 3.3 副作用自动清理

子应用在运行时注册的事件监听、定时器、动画帧，需要在卸载时清理，否则会造成内存泄漏和事件重复绑定。沙箱在提供这些 API 时顺手记录，停用时统一回收：

```js
class ProxySandbox {
  patchSideEffects() {
    const sandbox = this
    this.eventListeners = new Set()
    this.timeoutIds = new Set()
    this.intervalIds = new Set()
    this.animationFrameIds = new Set()

    // 子应用调用 window.addEventListener 时，实际走这里
    this.fakeWindow.addEventListener = (type, listener, options) => {
      window.addEventListener(type, listener, options)
      sandbox.eventListeners.add({ type, listener, options })
    }

    this.fakeWindow.removeEventListener = (type, listener, options) => {
      window.removeEventListener(type, listener, options)
      sandbox.eventListeners.forEach(record => {
        if (record.type === type && record.listener === listener) {
          sandbox.eventListeners.delete(record)
        }
      })
    }

    this.fakeWindow.setTimeout = (handler, timeout, ...args) => {
      const timerId = window.setTimeout(() => {
        // 已执行的任务从记录中移除，停用时不再重复清理
        sandbox.timeoutIds.delete(timerId)
        if (typeof handler === 'function') {
          handler(...args)
        } else {
          new Function(String(handler))()
        }
      }, timeout)

      sandbox.timeoutIds.add(timerId)
      return timerId
    }

    this.fakeWindow.clearTimeout = timerId => {
      window.clearTimeout(timerId)
      sandbox.timeoutIds.delete(timerId)
    }

    this.fakeWindow.setInterval = (handler, timeout, ...args) => {
      const timerId = window.setInterval(handler, timeout, ...args)
      sandbox.intervalIds.add(timerId)
      return timerId
    }

    this.fakeWindow.clearInterval = timerId => {
      window.clearInterval(timerId)
      sandbox.intervalIds.delete(timerId)
    }

    this.fakeWindow.requestAnimationFrame = callback => {
      const frameId = window.requestAnimationFrame(time => {
        sandbox.animationFrameIds.delete(frameId)
        callback(time)
      })
      sandbox.animationFrameIds.add(frameId)
      return frameId
    }

    this.fakeWindow.cancelAnimationFrame = frameId => {
      window.cancelAnimationFrame(frameId)
      sandbox.animationFrameIds.delete(frameId)
    }
  }

  clearSideEffects() {
    // 移除所有通过沙箱注册的事件监听
    this.eventListeners.forEach(({ type, listener, options }) => {
      window.removeEventListener(type, listener, options)
    })
    this.eventListeners.clear()

    // 清除所有尚未执行的定时器
    this.timeoutIds.forEach(timerId => window.clearTimeout(timerId))
    this.timeoutIds.clear()

    this.intervalIds.forEach(timerId => window.clearInterval(timerId))
    this.intervalIds.clear()

    this.animationFrameIds.forEach(frameId =>
      window.cancelAnimationFrame(frameId),
    )
    this.animationFrameIds.clear()
  }
}
```

### 3.4 CSS 隔离

[width(35,36,29)]

| 配置                         | 原理                         | 注意点                                           |
| ---------------------------- | ---------------------------- | ------------------------------------------------ |
| `experimentalStyleIsolation` | 给样式选择器追加作用域前缀   | 对复杂选择器和第三方库样式需充分测试             |
| `strictStyleIsolation`       | 使用 Shadow DOM 实现物理隔离 | 弹窗、Tooltip、Teleport 容易逃逸 Shadow DOM 边界 |

### 3.5 企业级 CSS 隔离组合

运行时隔离只能兜底，真正稳定的做法是编译期就把作用域做进去：

```html
<div id="micro-container">
  <div id="app-order-root" class="micro-app-order-wrapper">
    <div class="_container_83xza_5">
      <h1 class="_title_83xza_12">订单列表</h1>
      <button class="ord-button ord-button--primary">
        <span>加载数据</span>
      </button>
    </div>
  </div>
</div>
```

组合策略通常是三层：

- **应用级 class 前缀**：子应用根节点统一挂 `micro-app-order-wrapper`，所有重置样式和布局样式都限制在这个前缀下。
- **CSS Modules / scoped**：组件级样式由构建工具生成唯一类名，避免组件之间互相覆盖。
- **组件库命名空间**：给组件库配置独立的 `prefixCls`（如 `ord-button`），避免多个子应用使用不同版本的同一组件库时样式冲突。

## 4. 子应用构建

### 4.1 Webpack 构建

Webpack 子应用需要输出 `umd` 格式，并保证 `chunkLoadingGlobal` 唯一，避免多个子应用的异步 chunk 互相干扰：

```js
// 子应用 Webpack 配置：UMD 输出 + 允许跨域
module.exports = {
  output: {
    library: 'app-order', // 全局命名空间，与子应用注册时的 name 保持一致
    libraryTarget: 'umd', // qiankun 通过 umd 产物读取生命周期
    chunkLoadingGlobal: 'webpackJsonp_appOrder', // 唯一，避免多子应用冲突
    publicPath: '//localhost:7101/',
    globalObject: 'window',
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*', // 允许基座跨域拉取子应用资源
    },
  },
}
```

如果子应用部署在 CDN 或独立域名下，还需要在入口处动态修正 `publicPath`：

```js
// 入口文件顶部：qiankun 会注入子应用的真实资源基址
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

这样基座无论从哪个地址加载子应用，子应用运行时都能找到自己的 chunk 和图片资源。

### 4.2 Vite 构建

Vite 子应用接 qiankun 时需要额外插件或适配层，因为 Vite 原生 ESM 产物和 qiankun 传统 HTML Entry 执行模型并不完全契合。常用方案是 `vite-plugin-qiankun`。

:::details Vite 构建完整配置

:::code-group

```ts [vite.config.ts]
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// 注意：这里的 name 必须与主应用 registerMicroApps 中配置的 name 绝对一致
const qiankunName = 'app-vue3-vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    // 生产环境配成绝对路径或由主应用动态下发，避免静态资源 404
    base: isDev ? '/' : 'http://localhost:7100/',

    plugins: [
      vue(),
      // 注入 qiankun 适配插件
      qiankun(qiankunName, {
        // 微前端环境下，开发模式必须开启，用于抹平 ESM 语法差异
        useDevMode: true,
      }),
    ],

    server: {
      port: 7100,
      // 必须允许跨域，因为基座是通过 fetch 拉取子应用资源的
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      // 防止 Vite 默认的 HMR WebSocket 端口在微前端环境下乱跑
      origin: 'http://localhost:7100',
    },
  }
})
```

```ts [src/main.ts]
// Vite 子应用接入 qiankun 的完整入口
import { createApp, App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
import {
  renderWithQiankun,
  qiankunWindow,
} from 'vite-plugin-qiankun/dist/helper'

let app: VueApp<Element> | null = null

// 1. 抽离独立的渲染函数
function render(props: any = {}) {
  const { container } = props

  app = createApp(App)
  app.use(router)

  // 作为子应用时挂到基座分配的 DOM 内，独立运行时挂到自己的 #app
  const targetNode = container ? container.querySelector('#app') : '#app'
  app.mount(targetNode)
}

// 2. 注入 qiankun 标准生命周期
renderWithQiankun({
  bootstrap() {
    console.log(
      `[${qiankunWindow.__POWERED_BY_QIANKUN__ ? 'qiankun' : '独立运行'}] bootstrap`,
    )
  },

  mount(props) {
    console.log('[vite-app] 成功挂载', props)
    render(props)
  },

  update(props: any) {
    console.log('[vite-app] 接收到新的 props', props)
  },

  unmount(props: any) {
    console.log('[vite-app] 开始卸载')
    // 切断 Vue 3 effectScope 依赖树，清理所有事件监听
    if (app) {
      app.unmount()
      app._container.innerHTML = ''
      app = null
    }
  },
})

// 3. 独立运行态判断
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
```

```js [router/index.ts]
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import Home from '../views/Home.vue'

const router = createRouter({
  // 作为子应用运行时，base 必须与主应用的 activeRule 保持一致（如 '/app-vue3'）
  // 独立运行时使用默认的 '/'
  history: createWebHistory(
    qiankunWindow.__POWERED_BY_QIANKUN__ ? '/app-vue3' : '/',
  ),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
  ],
})

export default router
```

:::

### 4.3 接入与落地检查清单

[width(13,46,41)]

| 架构维度         | 关键实践规范                                                                    | 核心目的                                                              |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **生命周期**     | 子应用必须实现完整的 `bootstrap` / `mount` / `unmount` 生命周期。               | 确保基座能够精准调度子应用的初始化、渲染与销毁。                      |
| **内存与副作用** | 必须在 `unmount` 中清理所有**事件监听**、**定时器**、**全局订阅**。             | 彻底防止子应用频繁切换导致的**内存泄漏**和事件重复触发。              |
| **路由规范**     | 子应用路由必须**加前缀**（如 `/order/xxx`）。                                   | 划定绝对的路由边界，避免与主应用或其他子应用发生路由抢占和冲突。      |
| **样式隔离**     | 样式使用**应用级前缀 + CSS Modules**（编译期隔离），qiankun 运行时隔离做兜底。  | 解决运行时的 CSS 全局污染，并规避 UI 组件库弹窗的“**样式逃逸**”问题。 |
| **性能优化**     | 公共核心依赖（Vue、React、Ant Design 等）通过 Webpack `externals` 或 UMD 共享。 | 避免基础库被重复打包下载，大幅缩减子应用体积，提升首屏与切换性能。    |
| **质量监控**     | 接入错误监控系统（如 Sentry），并精准打标**区分主 / 子应用错误来源**。          | 在多团队协同的分布式前端环境中，实现线上 Bug 的极速溯源，定责明确。   |
| **工程化部署**   | CI/CD 发布流程必须支持子应用的**独立部署**与**独立回滚**。                      | 某一子应用崩溃可单点回滚，真正发挥微前端“**高可用**”的优势。          |

## 5. 应用场景

### 5.1 典型应用场景

[width(15,46,39)]

| 场景                     | 常见做法                                                                         | 关键配置                                                    |
| ------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **中后台系统聚合**       | 基座只负责布局、菜单与登录态，各业务域拆成子应用按一级路由挂载，团队各自独立发版 | `activeRule` 分配一级前缀；`props` 下发用户与权限           |
| **多 Tab 页签后台**      | 每个 Tab 绑定一个 `container`，用 `loadMicroApp` 手动挂载，切页签不丢状态        | 关闭 `singular`，由业务侧维护各 Tab 的 `mount` / `unmount`  |
| **老系统渐进式迁移**     | 新功能用现代框架写成子应用接进来，旧页面保持原样，按前缀逐个替换                 | `entry` 指向旧应用；样式用应用级前缀兜底                    |
| **子应用独立部署与回滚** | 子应用独占仓库与 CI/CD，产物发布到独立域名或 CDN，基座只持有 `entry` 地址        | `entry` 按环境变量注入；`getPublicPath` 修正资源路径        |
| **切换性能敏感的后台**   | 登录后空闲预加载高频子应用，切换时只做挂载，避免白屏                             | `prefetch: ['order', 'user']`；`beforeMount` 里显示 loading |

### 5.2 微前端方案对比

[width(46,54)]

| 诉求                                      | 优先选择                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| 存量 Webpack 中后台、追求生态成熟与避坑   | **qiankun**                                                          |
| 需要 iframe 级强隔离、Vite / ESM 原生支持 | [Wujie](/frontEngineering/architecture/wujie)                        |
| 类 Web Component 用法、Vite 优先          | [Micro-app](/frontEngineering/architecture/microApp)                 |
| 同技术栈、模块级共享依赖                  | [Module Federation](/frontEngineering/architecture/moduleFederation) |

qiankun 的优势在**应用级整合**：它不要求子应用统一技术栈，也不要求统一构建工具（Vite 需要适配）。如果核心诉求是运行时共享依赖、减少重复打包，Module Federation 更合适；如果核心诉求是彻底隔离，iframe 类方案更稳。

## 6. 常见问题（FAQ）

### 6.1 子应用资源 404 怎么办？

检查子应用的 `publicPath`（Webpack 的 `output.publicPath` 或 Vite 的 `base`）是否与真实部署路径一致；基座与子应用分域部署、或子应用挂在非根路径下时最容易漏掉。也可以在入口处用 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 动态修正。

### 6.2 切换后事件重复触发、卸载后定时器仍在执行怎么办？

在子应用的 `unmount` 中清理事件监听、全局订阅与定时器；同时启用沙箱的副作用自动回收作为兜底。注意沙箱只能回收通过 `window.addEventListener` / `setTimeout` 等标准 API 注册的副作用，WebSocket、Observer 和第三方库内部订阅仍需自行清理。

### 6.3 样式互相串扰、弹窗位置异常怎么办？

应用级前缀 + CSS Modules 负责编译期隔离，再配合 qiankun 的样式隔离配置兜底；弹窗统一挂载到约定容器，不要默认挂到 `document.body`，否则在 Shadow DOM 模式下会直接逃逸。

### 6.4 子应用之间的全局变量互相污染怎么办？

启用 Proxy 沙箱，并检查 `sandbox` 配置里是否有白名单遗漏，导致某些变量被直接写回 `window`。同时注意子应用通过 `document`、`location` 等对象上的属性做共享，也会绕过沙箱。

### 6.5 Vite 子应用加载异常怎么办？

使用 `vite-plugin-qiankun` 适配插件，并确认 `base`、`cors`、`origin` 和 `useDevMode` 配置正确。如果改造收益不大，优先评估 [Wujie](/frontEngineering/architecture/wujie)、[Micro-app](/frontEngineering/architecture/microApp) 或 [Module Federation](/frontEngineering/architecture/moduleFederation)。

### 6.6 路由没有同步、生命周期没有导出怎么办？

确保子应用路由加了前缀 `base`、并与基座的 `activeRule` 对齐；构建输出必须是 umd，`library` 名称要与注册时的 `name` 一致。若使用 Vite，确认生命周期是通过 `renderWithQiankun` 注册的，而不是只写了普通的 `export function mount`。
