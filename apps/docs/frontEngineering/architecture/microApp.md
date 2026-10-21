---
outline: [2, 3]
---

# Micro-app 微前端方案

`Micro-app` 是京东零售开源的、基于 **Web Components** 的微前端框架。它的核心设计是“**零侵入接入**”：主应用像写普通 HTML 标签一样嵌入子应用，子应用不需要暴露 `bootstrap` / `mount` / `unmount` 也能运行。相比 qiankun 的 `single-spa` 体系，Micro-app 更强调“**把复杂度封装在自定义元素内部**”：加载、沙箱、样式隔离和路由都由 `<micro-app>` 这个自定义元素接管。

**一句话理解**：主应用写一个 `<micro-app name url>` 标签，剩下的资源加载、沙箱执行、样式隔离、路由同步都由框架接管。

## 1. 整体架构

### 1.1 设计定位与能力边界

Micro-app 解决的问题可以拆成七件事：

[width(28,72)]

| 问题                   | Micro-app 的解法                                                           |
| ---------------------- | -------------------------------------------------------------------------- |
| 子应用怎么接入         | 模板里写 `<micro-app name url baseroute>`，或用 `renderApp` 命令式渲染     |
| 子应用资源怎么加载     | 元素插入 DOM 时 fetch HTML，拆出 `script` / `style` 后交给沙箱执行         |
| 全局变量互相污染       | Proxy 沙箱（默认）或 iframe 沙箱（`iframe` 属性）                          |
| 样式互相污染           | Scoped CSS 前缀重写（默认）或 Shadow DOM（`shadowDOM` 属性）               |
| 主应用与子应用路由冲突 | 虚拟路由系统，支持 `search` / `state` / `native` / `native-scope` / `pure` |
| 切换后子应用状态丢失   | `keep-alive` 隐藏保活，配合副作用快照恢复                                  |
| 主应用与子应用数据通信 | `setData` / `dispatch` + 内置 `EventCenter`                                |

### 1.2 架构分层

```tree
主应用（基座）
├─ 接入层  <micro-app> 自定义元素 / renderApp
│           声明 name / url / baseroute / data / keep-alive
├─ 调度层  MicroAppElement
│           observedAttributes → connectedCallback → handleConnected
├─ 加载层  HTMLLoader + sourceCenter
│           fetch HTML → 改写 head/body → 提取 script/style → 缓存
└─ 隔离层  Proxy 沙箱 / iframe 沙箱 + Scoped CSS / Shadow DOM
                     ↓
子应用（独立仓库 / 独立构建 / 独立部署）
  可通过 window.__MICRO_APP_*__ 感知环境，也可以独立运行
```

### 1.3 核心概念

[width(19,81)]

| 概念              | 说明                                                            |
| ----------------- | --------------------------------------------------------------- |
| **`<micro-app>`** | 自定义元素，微前端接入的声明式入口，也是实例的生命周期载体      |
| **`name`**        | 应用唯一标识，同时是沙箱、数据通信和实例表的命名空间            |
| **`url`**         | 子应用的 HTML 入口地址，框架从它里面解析真正的 JS / CSS 资源    |
| **`baseroute`**   | 子应用路由前缀，子应用通过 `__MICRO_APP_BASE_ROUTE__` 读取      |
| **`keep-alive`**  | 元素移出 DOM 时隐藏而不销毁实例，适合多 Tab / 菜单常驻场景      |
| **Scoped CSS**    | 给子应用所有选择器加 `micro-app[name=xxx]` 前缀，实现样式作用域 |
| **虚拟路由**      | Micro-app 自己维护的路由隔离层，不要求子应用改造成独立域名      |
| **`EventCenter`** | 主应用与子应用之间的数据通信事件中心，负责缓存、合并和异步派发  |

### 1.4 启动与渲染全流程

```tree
microApp.start(options)
        ↓
注册 <micro-app> 自定义元素，初始化全局环境与补丁
        ↓
<micro-app> 插入 DOM → connectedCallback
        ↓
handleConnected：复用保活实例 / 挂载预加载实例 / 新建实例
        ↓
HTMLLoader：fetch HTML → <head>/<body> 改写为
            <micro-app-head>/<micro-app-body>
        ↓
extractSourceDom：提取 link / style / script
        ↓
沙箱执行 JS → Scoped CSS 处理样式 → DOM 渲染到容器
        ↓
元素移出 DOM → disconnectedCallback → 卸载或 keep-alive 隐藏
```

- **`connectedCallback` 做了异步防抖**：Vue 的 `keep-alive` 等机制可能让元素瞬时插入再删除，Micro-app 用 `connectStateMap` + `defer` 避免重复加载。
- **`handleConnected`** 是渲染的“**调度中心**”：隐藏且 URL 未变的实例直接唤醒；已卸载或预加载的实例直接挂载；其余情况才新建实例。
- **状态机驱动生命周期**：实例从 `CREATED` 进入 `LOADING`，加载成功后依次经过 `BEFORE_MOUNT`、`MOUNTING`、`MOUNTED`，卸载后进入 `UNMOUNT`；加载失败则走 `LOAD_FAILED`。

### 1.5 资源加载机制

Micro-app 同样使用 HTML Entry，但它会把子应用的 `<head>` / `<body>` 改写成 `<micro-app-head>` / `<micro-app-body>`，避免与主应用的原生标签冲突。

#### 1.5.1 HTML 拉取与改写

```js
// HTML Loader：拉取入口 HTML 并改写 head / body
class HTMLLoader {
  run(app, successCb) {
    const htmlUrl = app.ssrUrl || app.url

    // 如果入口是 JS 地址，直接包装成最小 HTML
    const isJsResource = isTargetExtension(htmlUrl, 'js')
    const htmlPromise = isJsResource
      ? Promise.resolve(
          `<micro-app-head><script src='${htmlUrl}'></script></micro-app-head><micro-app-body></micro-app-body>`,
        )
      : fetchSource(htmlUrl, app.name, { cache: 'no-cache' })

    htmlPromise
      .then(htmlStr => {
        if (!htmlStr) {
          app.onerror(new Error('html is empty'))
          return
        }

        // 关键步骤：<head> → <micro-app-head>，<body> → <micro-app-body>
        htmlStr = this.formatHTML(htmlUrl, htmlStr, app.name)
        successCb(htmlStr, app)
      })
      .catch(error => app.onLoadError(error))
  }

  formatHTML(htmlUrl, htmlStr, appName) {
    return this.processHtml(htmlUrl, htmlStr, appName, microApp.options.plugins)
      .replace(/<head[^>]*>[\s\S]*?<\/head>/i, match => {
        return match
          .replace(/<head/i, '<micro-app-head')
          .replace(/<\/head>/i, '</micro-app-head>')
      })
      .replace(/<body[^>]*>[\s\S]*?<\/body>/i, match => {
        return match
          .replace(/<body/i, '<micro-app-body')
          .replace(/<\/body>/i, '</micro-app-body>')
      })
  }
}
```

#### 1.5.2 资源提取

```js
// 从入口 HTML 中提取 style / link / script 资源
function extractSourceDom(htmlStr, app) {
  const wrapElement = app.parseHtmlString(htmlStr)
  const microAppHead = wrapElement.querySelector('micro-app-head')
  const microAppBody = wrapElement.querySelector('micro-app-body')

  if (!microAppHead || !microAppBody) {
    return logError(
      `element ${microAppHead ? 'body' : 'head'} is missing`,
      app.name,
    )
  }

  // 1. 扁平化 body 子节点，收集 style 和 link
  flatBodyChildren(wrapElement, app, fiberStyleTasks)

  // 2. 并行加载 link（CSS）资源
  if (app.source.links.size) {
    fetchLinksFromHtml(wrapElement, app, microAppHead)
  }

  // 3. 加载 script 资源
  if (app.source.scripts.size) {
    fetchScriptsFromHtml(wrapElement, app)
  }
}
```

#### 1.5.3 资源路径解析

HTML Entry 里的相对路径必须用子应用入口地址作为基址：

```js
// 将相对路径转为基于 entry URL 的绝对路径
function CompletionPath(path, baseURI) {
  return new URL(path, baseURI).toString()
}

// 将 https://domain/xx/xx.html 转为 https://domain/xx/
function getEffectivePath(url) {
  const urlObj = new URL(url)
  const pathArr = urlObj.pathname.split('/')
  pathArr.pop()
  urlObj.pathname = pathArr.join('/')
  return urlObj.toString()
}
```

子应用运行时可以通过 `window.__MICRO_APP_PUBLIC_PATH__` 拿到这个根路径，用来动态设置 `publicPath`。

#### 1.5.4 资源缓存

```js
// 资源中心：缓存 CSS / JS 源码，供各子应用复用
function createSourceCenter() {
  const linkList = new Map() // CSS 地址 → { code, appSpace: {} }
  const scriptList = new Map() // JS 地址 → { code, isExternal, appSpace: {} }

  return {
    link: {
      setInfo(address, info) {
        linkList.set(address, info)
      },
      getInfo(address) {
        return linkList.get(address)
      },
      hasInfo(address) {
        return linkList.has(address)
      },
    },
    script: {
      setInfo(address, info) {
        scriptList.set(address, info)
      },
      getInfo(address) {
        return scriptList.get(address)
      },
      hasInfo(address) {
        return scriptList.has(address)
      },
    },
  }
}
```

同一个资源被多个子应用引用时只请求一次，源码缓存在 `sourceCenter`；每个应用自己的解析结果则独立存放在 `appSpace[appName]` 里。

#### 1.5.5 脚本执行

Micro-app 会区分同步脚本和 `defer` / `async` 脚本，同步脚本立即执行，异步脚本先全部拉取，再按声明顺序执行：

```js
// 执行脚本：同步立即执行，defer/async 先加载后按序执行
function execScripts(app, initHook) {
  const scriptList = Array.from(app.source.scripts)
  const deferScriptPromise = []
  const deferScriptInfo = []

  for (const address of scriptList) {
    const scriptInfo = sourceCenter.script.getInfo(address)
    const appSpaceData = scriptInfo.appSpace[app.name]

    if (appSpaceData.defer || appSpaceData.async) {
      deferScriptPromise.push(
        scriptInfo.isExternal
          ? fetchSource(address, app.name)
          : scriptInfo.code,
      )
      deferScriptInfo.push([address, scriptInfo])
    } else {
      runScript(address, app, scriptInfo)
      initHook(false)
    }
  }

  if (deferScriptPromise.length) {
    promiseStream(
      deferScriptPromise,
      result => {
        deferScriptInfo[result.index][1].code = result.data
      },
      error => logError(error, app.name),
      () => {
        deferScriptInfo.forEach(([address, scriptInfo]) => {
          runScript(address, app, scriptInfo, initHook)
        })
        initHook(true)
      },
    )
  }
}
```

脚本执行前会通过 `bindScope` 包一层 `with(window)`，让裸全局变量走进沙箱：

```js
// 脚本作用域绑定：with(window) + IIFE
function bindScope(address, app, code, scriptInfo) {
  if (scriptInfo.isGlobal) {
    return code
  }

  return `
    ;with(window){
    ;(function(proxyWindow){
    ;${code}
    }).call(window, window);
    }
    //# sourceURL=${address}
  `
}
```

执行模式有两种：`inline` 模式创建真实的 `<script>` 元素，方便 DevTools 定位源码；默认模式用 `new Function` 执行，便于沙箱接管全局变量。

```js
// 执行脚本：内联模式或 new Function 模式
function runScript(address, app, scriptInfo, callback) {
  const sandboxType = getSandboxType(app, scriptInfo)

  // 首次执行或沙箱类型变化时重新 bindScope
  if (
    !scriptInfo.appSpace[app.name].parsedCode ||
    scriptInfo.appSpace[app.name].sandboxType !== sandboxType
  ) {
    scriptInfo.appSpace[app.name].parsedCode = bindScope(
      address,
      app,
      scriptInfo.code,
      scriptInfo,
    )
    scriptInfo.appSpace[app.name].sandboxType = sandboxType
  }

  if (isInlineMode(app, scriptInfo)) {
    const scriptElement = document.createElement('script')
    runCode2InlineScript(
      address,
      scriptInfo.appSpace[app.name].parsedCode,
      isModule,
      scriptElement,
    )
    parent.appendChild(scriptElement)
  } else {
    runParsedFunction(app, scriptInfo)
  }
}
```

大体积子应用可以开启 `fiber`，把脚本拆成任务，在 `requestIdleCallback` 的空闲时段串行执行，避免长时间阻塞主线程：

```js
// 将 runScript 包装为 fiber 任务
injectFiberTask(fiberScriptTasks, () => {
  runScript(address, app, scriptInfo)
  initHook(false)
})

// 串行执行 fiber 链表，保证脚本顺序
function serialExecFiberTasks(tasks) {
  // 每个任务在 requestIdleCallback 中执行
  // 形成一条 Promise 链，前一个完成后再调度下一个
}
```

## 2. 核心 API 与配置项

对外入口可以归成四类：`microApp.start()` 负责全局初始化，`<micro-app>` 负责声明式接入，`renderApp` / `unmountApp` / `reload` 负责命令式控制，`setData` / `dispatch` 负责数据通信。

### 2.1 全局启动

#### 2.1.1 基本用法

```ts
import microApp from '@micro-zoe/micro-app'

microApp.start({
  iframe: false, // 是否使用 iframe 沙箱，默认 false
  'disable-sandbox': false, // 是否禁用 JS 沙箱
  'disable-scopecss': false, // 是否禁用 CSS 样式隔离
  inline: false, // 是否用内联 script 执行 JS
  shadowDOM: false, // 是否使用 Shadow DOM
  prefetchDelay: 3000, // 预加载延迟（ms）
  preFetchApps: [{ name: 'order', url: 'http://localhost:7101/' }],
  globalAssets: {
    js: ['https://cdn.example.com/react.js'],
    css: ['https://cdn.example.com/antd.css'],
  },
})
```

:::details start(极简源码)

```js
/** 框架是否已启动（防止重复 start） */
let hasInit = false

class MicroApp extends EventCenterForBaseApp {
  tagName = 'micro-app'
  options = {}

  start(options) {
    if (!isBrowser || !window.customElements) {
      return logError('micro-app is not supported in this environment')
    }
    if (this.hasInit) {
      return logError('microApp.start executed repeatedly')
    }
    this.hasInit = true

    // 允许自定义标签名，如 <micro-app-order>
    if (options?.tagName) {
      if (/^micro-app(-\S+)?/.test(options.tagName)) {
        this.tagName = options.tagName
      } else {
        return logError(`${options.tagName} is invalid tagName`)
      }
    }

    // 初始化全局环境（patch fetch、EventSource、MutationObserver 等）
    initGlobalEnv()

    if (window.customElements.get(this.tagName)) {
      return logWarn(`element ${this.tagName} is already defined`)
    }

    if (isPlainObject(options)) {
      this.options = options

      // 兼容驼峰和中划线两种配置方式
      options['disable-scopecss'] =
        options['disable-scopecss'] ?? options.disableScopecss
      options['disable-sandbox'] =
        options['disable-sandbox'] ?? options.disableSandbox

      options.preFetchApps && preFetch(options.preFetchApps)
      options.globalAssets && getGlobalAssets(options.globalAssets)

      // 格式化插件中的 appName（去空格、转小写）
      if (isPlainObject(options.plugins?.modules)) {
        for (const appName in options.plugins.modules) {
          const formatted = formatAppName(appName)
          if (formatted && appName !== formatted) {
            options.plugins.modules[formatted] =
              options.plugins.modules[appName]
            delete options.plugins.modules[appName]
          }
        }
      }
    }

    // 注册自定义元素
    defineElement(this.tagName)
  }
}

const microApp = new MicroApp()
export default microApp
```

:::

#### 2.1.2 启动选项

[width(28,18,13,41)]

| 选项               | 类型      | 默认值        | 说明                                                      |
| ------------------ | --------- | ------------- | --------------------------------------------------------- |
| `iframe`           | `boolean` | `false`       | 是否使用 iframe 沙箱；跨域或强隔离场景开启                |
| `disable-sandbox`  | `boolean` | `false`       | 关闭 JS 沙箱，子应用直接操作真实 `window`                 |
| `disable-scopecss` | `boolean` | `false`       | 关闭 Scoped CSS 前缀重写                                  |
| `inline`           | `boolean` | `false`       | 用内联 `<script>` 执行 JS，源码可定位，但沙箱能力受限     |
| `shadowDOM`        | `boolean` | `false`       | 使用 Shadow DOM 做样式强隔离                              |
| `prefetchDelay`    | `number`  | `3000`        | 预加载延迟时间，单位毫秒                                  |
| `preFetchApps`     | `Array`   | —             | 空闲时预加载的子应用列表，支持 `level` 指定预加载深度     |
| `prefetchLevel`    | `number`  | `2`           | 全局默认预加载级别：1 只拉 HTML，2 解析资源，3 预渲染     |
| `globalAssets`     | `object`  | —             | 全局公共资源缓存，`{ js, css }`                           |
| `plugins`          | `object`  | —             | 插件配置，`{ global, modules }`，用于处理 HTML / JS / CSS |
| `tagName`          | `string`  | `'micro-app'` | 自定义元素标签名，必须以 `micro-app` 开头                 |
| `iframeSrc`        | `string`  | —             | iframe 沙箱的初始地址，默认使用主应用同源地址             |

#### 2.1.3 选项使用细节

- **`iframe` 与 `disable-sandbox`**：`iframe: true` 是物理隔离，适合跨域或不受控的第三方系统；`disable-sandbox: true` 则是完全不隔离，只适合同域可信、且子应用自己保证不污染全局的老系统。
- **`disable-scopecss` 与 `shadowDOM`**：默认 Scoped CSS；`shadowDOM: true` 隔离更强，但弹窗、`Teleport`、全局字体和 CSS 变量需要额外处理。两者不要同时开。
- **`inline`**：内联模式会创建真实 `<script>`，断点调试更自然；但它会绕过部分 `new Function` 沙箱逻辑，安全性要求高的场景不要用。
- **`preFetchApps` / `prefetchLevel`**：预加载会和首屏抢带宽。核心高频应用用 `level=2`，需要秒开体感的才用 `level=3`，其余保持默认或关闭。
- **`globalAssets`**：适合 React、Vue、组件库这类所有子应用共享的 CDN 依赖。框架会在空闲时把资源拉取到 `sourceCenter`，子应用引用相同 URL 时直接命中缓存，配合 `externals` 还能避免重复打包。
- **`tagName`**：多套微前端实例或需要避免标签冲突时，可以改成 `micro-app-order` 这类名字。

### 2.2 自定义元素

#### 2.2.1 基本用法

```vue
<!-- 主应用模板中嵌入子应用，并监听完整生命周期 -->
<template>
  <micro-app
    name="order"
    url="http://localhost:7101/"
    baseroute="/order"
    :data="microData"
    keep-alive
    @created="onCreated"
    @mounted="onMounted"
    @unmount="onUnmount"
    @error="onError"
  />
</template>

<script setup>
const microData = { token: 'access-token', theme: 'light' }
</script>
```

:::details 自定义元素(极简源码)

Micro-app 只监听 `name` 和 `url` 两个属性，任一就绪后进入 `handleInitialNameAndUrl`；后续变更会异步防抖处理：

```js
// 自定义元素：监听 name / url 属性变化
class MicroAppElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'url']
  }

  attributeChangedCallback(attr, _oldVal, newVal) {
    // 首次：name 或 url 还未设置 → 记录属性值并尝试初始化
    if (attr === 'name' && !this.appName) {
      this.appName = formatAppName(newVal)
      this.handleInitialNameAndUrl()
    } else if (attr === 'url' && !this.appUrl) {
      this.appUrl = formatAppURL(newVal, this.appName)
      this.handleInitialNameAndUrl()
    } else if (!this.isWaiting) {
      // 更新：异步卸载旧应用，再按新属性重新渲染
      this.isWaiting = true
      defer(this.handleAttributeUpdate)
    }
  }
}
```

元素插入 DOM 时触发加载。`connectStateMap` + `defer` 的作用是防止框架内部瞬时插入删除导致重复渲染：

```js
// 自定义元素：插入文档时触发加载
class MicroAppElement extends HTMLElement {
  connectedCallback() {
    // Firefox 的 iframe Node.prototype 插入后可能指向原生原型
    if (Object.getPrototypeOf(this) !== MicroAppElement.prototype) {
      Object.setPrototypeOf(this, MicroAppElement.prototype)
    }

    const cacheCount = ++this.connectedCount
    this.connectStateMap.set(cacheCount, true)

    defer(() => {
      if (this.connectStateMap.get(cacheCount)) {
        dispatchLifecyclesEvent(this, this.appName, lifeCycles.CREATED)
        this.appName && this.appUrl && this.handleConnected()
      }
    })
  }

  // 元素从文档移除：保活或卸载
  disconnectedCallback() {
    this.connectStateMap.set(this.connectedCount, false)
    this.handleDisconnected()
  }

  handleDisconnected(destroy = false) {
    const app = appInstanceMap.get(this.appName)
    if (app && !app.isUnmounted() && !app.isHidden()) {
      if (this.getKeepAliveModeResult() && !destroy) {
        this.handleHiddenKeepAliveApp()
      } else {
        this.unmount(destroy)
      }
    }
  }

  // 渲染调度中心：复用、唤醒还是新建
  handleConnected() {
    if (!this.appName || !this.appUrl) return

    if (this.getDisposeResult('shadowDOM') && !this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }

    const oldApp = appInstanceMap.get(this.appName)
    if (!oldApp) {
      this.handleCreateApp()
      return
    }

    if (oldApp.isHidden() && oldApp.url === this.appUrl) {
      this.handleShowKeepAliveApp(oldApp) // 唤醒保活实例
    } else if (
      oldApp.url === this.appUrl &&
      (oldApp.isUnmounted() || oldApp.isPrefetch)
    ) {
      this.handleMount(oldApp) // 挂载已预加载或已卸载的实例
    } else {
      this.handleCreateApp() // URL 变化或实例状态不匹配，新建
    }
  }
}
```

:::

#### 2.2.2 元素属性

[width(30,15,55)]

| 属性                    | 取值      | 说明                                               |
| ----------------------- | --------- | -------------------------------------------------- |
| `name`                  | `string`  | 必填，应用唯一标识，会先经 `formatAppName` 归一化  |
| `url`                   | `string`  | 必填，子应用 HTML 入口地址                         |
| `baseroute`             | `string`  | 子应用路由前缀，与 `__MICRO_APP_BASE_ROUTE__` 对齐 |
| `data`                  | `object`  | 首次下发数据，等价于挂载前先调用 `setData`         |
| `keep-alive`            | `boolean` | 卸载转隐藏保活；与 `destroy` 同时存在时失效        |
| `destroy`               | `boolean` | 卸载时彻底销毁实例并清空数据缓存                   |
| `clear-data`            | `boolean` | 只清空数据通信缓存，不销毁实例                     |
| `shadowDOM`             | `boolean` | 开启 Shadow DOM 强样式隔离                         |
| `inline`                | `boolean` | 用内联 `<script>` 执行 JS，源码可定位              |
| `disable-scopecss`      | `boolean` | 关闭 Scoped CSS 前缀重写                           |
| `disable-sandbox`       | `boolean` | 关闭 JS 沙箱，子应用直接操作真实 `window`          |
| `ssr`                   | `string`  | 声明子应用是 SSR 应用，按 SSR 模式加载             |
| `router-mode`           | `string`  | 虚拟路由模式                                       |
| `fiber`                 | `boolean` | 异步执行子应用 JS，减少对主应用渲染的阻塞          |
| `iframe`                | `boolean` | 只为当前子应用启用 iframe 沙箱                     |
| `disable-patch-request` | `boolean` | 关闭请求代理，子应用直接使用原生 `fetch`           |

### 2.3 生命周期

#### 2.3.1 元素生命周期事件

Micro-app 通过自定义事件在 `<micro-app>` 元素上派发通知：

```html
<!-- 监听子应用生命周期事件 -->
<micro-app
  name="order"
  url="http://localhost:7101/"
  @created="onCreated"
  @beforemount="onBeforeMount"
  @mounted="onMounted"
  @unmount="onUnmount"
  @error="onError"
/>
```

[width(19,34,47)]

| 事件          | 触发时机                     | 常见用途                   |
| ------------- | ---------------------------- | -------------------------- |
| `created`     | 元素完成初始化，开始加载前   | 埋点、登记应用             |
| `beforemount` | 子应用资源加载完成，即将挂载 | 显示 loading、重置滚动位置 |
| `mounted`     | 子应用挂载完成               | 隐藏 loading、记录当前应用 |
| `unmount`     | 子应用卸载或进入隐藏保活     | 清理主应用侧资源           |
| `error`       | 资源加载或生命周期执行失败   | 错误兜底、降级页面         |
| `aftershow`   | 保活实例从隐藏状态恢复       | 恢复定时器、刷新数据       |
| `afterhidden` | 保活实例进入隐藏状态         | 暂停轮询、释放非必要资源   |

#### 2.3.2 子应用全局钩子

子应用可以注册全局生命周期回调：

```ts
// 子应用全局钩子：挂载 / 卸载完成时触发
window.onmount = () => {
  console.log('子应用挂载完成')
}

window.onunmount = () => {
  console.log('子应用卸载')
}
```

也可以监听 `appstate-change` 自定义事件，感知内部状态变化：

```ts
window.addEventListener('appstate-change', event => {
  console.log('state:', event.detail.appState)
})
```

#### 2.3.3 应用内部状态机

```js
const appStates = {
  CREATED: 'CREATED', // 应用实例创建
  LOADING: 'LOADING', // 加载 HTML 资源中
  LOAD_FAILED: 'LOAD_FAILED', // 加载 HTML 失败
  BEFORE_MOUNT: 'BEFORE_MOUNT', // 挂载前
  MOUNTING: 'MOUNTING', // 执行 JS / 渲染中
  MOUNTED: 'MOUNTED', // 挂载完成
  UNMOUNT: 'UNMOUNT', // 已卸载
}

// 状态流转
// CREATED → LOADING → BEFORE_MOUNT → MOUNTING → MOUNTED → UNMOUNT
//           LOADING → LOAD_FAILED → UNMOUNT
```

### 2.4 命令式 API

除声明式标签外，Micro-app 还提供 `renderApp`、`unmountApp`、`reload` 等命令式接口，适合弹窗、抽屉、动态页签等场景。

#### 2.4.1 renderApp：动态渲染

```ts
import { renderApp } from '@micro-zoe/micro-app'

const element = renderApp({
  name: 'order',
  url: 'http://localhost:7101/',
  container: '#micro-container',
  baseroute: '/order',
  data: { token: 'xxx' },
})
```

#### 2.4.2 unmountApp / reload：卸载与重新渲染

```ts
import microApp, { unmountApp } from '@micro-zoe/micro-app'

// 精确卸载单个子应用
await unmountApp('order', { destroy: true, clearData: true })

// 版本切换、灰度回滚：重新渲染
microApp.reload('order', true)

// 只清理数据缓存，不卸载实例
microApp.clearData('order')
```

:::details 命令式 API(极简源码)

```js
// renderApp：创建一个 <micro-app> 元素并挂到容器
export function renderApp(options) {
  const { name, url, container, data, ...rest } = options
  const element = document.createElement(microApp.tagName)

  element.setAttribute('name', name)
  element.setAttribute('url', url)

  // data 是对象属性，不能走 setAttribute
  if (data) {
    element.data = data
  }

  Object.keys(rest).forEach(key => {
    if (rest[key] !== undefined) {
      element.setAttribute(key, rest[key])
    }
  })

  const target =
    typeof container === 'string'
      ? document.querySelector(container)
      : container

  target.appendChild(element)
  return element
}

// unmountApp：按名称找到实例并卸载
export function unmountApp(name, options = {}) {
  const app = appInstanceMap.get(name)
  if (app) {
    return app.unmount(options)
  }
}

// reload：销毁旧实例后按原配置重新创建
class MicroApp {
  reload(name, destroy = false) {
    const app = appInstanceMap.get(name)
    if (app) {
      app.reload(destroy)
    }
  }
}
```

:::

#### 2.4.3 调试 API

```ts
import { getAllApps, getActiveApps } from '@micro-zoe/micro-app'

// 当前注册的所有子应用
console.log(getAllApps())

// 当前活跃（已挂载）的子应用
console.log(getActiveApps())
```

### 2.5 数据通信 API

Micro-app 的通信基于内置 `EventCenter`，提供**主 → 子**的 `setData` 和**子 → 主**的 `dispatch` 两条数据流。

#### 2.5.1 主应用下发数据

```html
<!-- 模板方式：data 会在挂载前写入子应用 -->
<micro-app name="order" url="http://localhost:7101/" :data="microData" />
```

```ts
// 动态更新数据
microApp.setData('order', { theme: 'dark' })

// 强制更新（跳过差异对比，适合时间戳类字段）
microApp.forceSetData('order', { timestamp: Date.now() })

// 读取主应用侧缓存
const data = microApp.getData('order')
```

#### 2.5.2 子应用接收与上报

```ts
// 获取当前数据（缓存数据在绑定监听前也存在）
const data = window.microApp?.getData()

// 监听数据变化，第二个参数 autoTrigger 为 true 时立即用缓存触发一次
const listener = (nextData: unknown) => {
  console.log('data from base app:', nextData)
}
window.microApp?.addDataListener(listener, true)
window.microApp?.removeDataListener(listener)

// 子应用向主应用发送数据
window.microApp?.dispatch({
  type: 'ORDER_CREATED',
  payload: { id: '10001' },
})

// 主应用监听子应用数据
microApp.addDataListener('order', data => {
  console.log('data from child app order:', data)
})
```

#### 2.5.3 全局数据

```ts
// 主应用写入全局数据
microApp.setGlobalData({ env: 'production', version: '1.0.0' })

// 主应用监听全局数据
microApp.addGlobalDataListener(data => {
  console.log('global data:', data)
})

// 子应用监听全局数据
window.microApp?.addGlobalDataListener(data => {
  console.log('global data:', data)
})
```

:::details EventCenter(极简源码)

`EventCenter` 不会在 `setData` / `dispatch` 时立即同步触发回调，而是先把数据合并进事件队列，用 `defer` 在微任务里统一派发：

```js
// EventCenter：事件入队 + 异步批量派发
class EventCenter {
  dispatch(name, data, nextStep, force) {
    let eventInfo = this.eventList.get(name)

    if (eventInfo) {
      // 浅合并到 tempData，下一次派发时一次性通知
      eventInfo.tempData = assign(
        {},
        eventInfo.tempData || eventInfo.data,
        data,
      )
    } else {
      eventInfo = { data, callbacks: new Set() }
      this.eventList.set(name, eventInfo)
      // 初次监听方尚未绑定，标记为强制触发
      eventInfo.force = true
    }

    this.enqueue(name, nextStep)
  }

  enqueue(name, nextStep) {
    // 第一个入队时才安排一次异步处理
    !this.queue.includes(name) &&
      this.queue.push(name) === 1 &&
      defer(this.process)
  }

  process() {
    let name
    while ((name = this.queue.shift())) {
      const eventInfo = this.eventList.get(name)
      const nextData = eventInfo.tempData || eventInfo.data
      if (eventInfo.force || !isEqual(eventInfo.data, nextData)) {
        eventInfo.callbacks.forEach(callback => callback(nextData))
      }
    }
  }
}
```

:::

#### 2.5.4 通信方式怎么选

[width(22,36,42)]

| 方式               | 典型数据                     | 特点                                                           |
| ------------------ | ---------------------------- | -------------------------------------------------------------- |
| `data` / `setData` | Token、用户、主题、权限      | 主 → 子，浅合并；子应用通过 `getData` / `addDataListener` 接收 |
| `dispatch`         | 订单创建、表单提交等业务事件 | 子 → 主，主应用按 `appName` 订阅                               |
| `setGlobalData`    | 环境、版本号、地区、语言     | 主 → 所有子应用，适合真正的全局配置                            |
| URL / 后端 API     | 列表筛选、详情 ID、业务数据  | 可分享、可刷新、天然解耦                                       |
| `localStorage`     | 非敏感偏好                   | 同域共享；必须加应用级命名空间                                 |

选择原则：**能通过 URL 或后端 API 传的业务数据，不要塞进 `setData`**。`setData` 适合低频、体积小的公共能力。

### 2.6 路由机制

`router-mode` 共五个取值，默认 `search`（1.0 正式版起将改为 `state`）：

[width(12,88)]

| 模式             | 说明                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **search**       | 默认模式。子应用路由以 `?` 参数同步到浏览器地址，如 `/?/order/list`                        |
| **state**        | 子应用路由信息同步到 `history.state`，不污染地址栏，1.0 起接替 `search` 成为默认           |
| **native**       | 不做路由隔离，主、子应用同用浏览器 URL；子应用的 `location.origin` / `href` 指向主应用     |
| **native-scope** | 与 `native` 唯一的差别：子应用 `location.origin` / `href` 指向子应用自己，取原始域名更自然 |
| **pure**         | 纯模式。子应用像组件一样使用，内部路由独立管理，既不写浏览器 URL 也不影响主应用路由        |

只有 `native` / `native-scope` 需要配合 `baseroute`，其余模式由 Micro-app 自行维护路由前缀：

```ts
// 虚拟路由系统注入到子应用的全局变量
microAppWindow.__MICRO_APP_BASE_ROUTE__ = '/order'
microAppWindow.__MICRO_APP_BASE_URL__ = '/order'
microAppWindow.__MICRO_APP_PUBLIC_PATH__ = 'http://localhost:7101/'
```

子应用路由配置：

```ts
// Vue Router
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/'),
  routes,
})
```

```jsx
// React Router
<BrowserRouter basename={window.__MICRO_APP_BASE_ROUTE__ || '/'}>
  <App />
</BrowserRouter>
```

### 2.7 预加载与 keep-alive

#### 2.7.1 预加载

```ts
// start() 时全局配置
// level 1：只预加载 HTML，不解析 JS/CSS
// level 2：预加载并解析 JS/CSS（默认）
// level 3：预渲染，在后台完整渲染子应用
microApp.start({
  preFetchApps: [
    { name: 'order', url: 'http://localhost:7101/', level: 2 },
    { name: 'goods', url: 'http://localhost:7102/', level: 3 },
  ],
})

// 或动态调用
import { preFetch } from '@micro-zoe/micro-app'

preFetch([{ name: 'order', url: 'http://localhost:7101/' }])
```

:::details 预加载(极简源码)

```js
// 预加载：空闲时串行拉取子应用资源
function preFetch(apps, delay) {
  if (!isBrowser) return

  requestIdleCallback(() => {
    // delay 默认 3000ms，可在 start({ prefetchDelay }) 中自定义
    const delayTime = isNumber(delay) ? delay : microApp.options.prefetchDelay

    setTimeout(() => {
      preFetchInSerial(apps)
    }, delayTime ?? 3000)
  })
}

// 串行预加载，避免同时占用过多带宽
function preFetchInSerial(apps) {
  if (isArray(apps)) {
    apps.reduce(
      (pre, next) => pre.then(() => preFetchAction(next)),
      Promise.resolve(),
    )
  }
}

function preFetchAction(options) {
  return promiseRequestIdle(resolve => {
    if (isPlainObject(options) && navigator.onLine) {
      options.name = formatAppName(options.name)
      options.url = formatAppURL(options.url, options.name)

      const app = new CreateApp({
        name: options.name,
        url: options.url,
        isPrefetch: true,
        useSandbox: !options['disable-sandbox'],
        scopecss: !options['disable-scopecss'],
        prefetchLevel: options.level ?? microApp.options.prefetchLevel ?? 2,
      })

      // level=3：创建独立容器完整渲染，但不派发生命周期事件
      if (app.isPrerender) {
        // 预渲染逻辑
      }
    }
  })
}
```

:::

#### 2.7.2 keep-alive

```html
<!-- 保活：切换路由时不销毁子应用 -->
<micro-app name="order" url="http://localhost:7101/" keep-alive />
```

实现原理：`disconnectedCallback`时不执行 `unmount`,而是隐藏实例并释放副作用;下次插入 DOM 时恢复：

```js
// 隐藏保活应用
function handleHiddenKeepAliveApp() {
  // 1. 记录并释放副作用（事件、定时器、动画帧等）
  sandbox.recordAndReleaseEffect({ keepAlive: true })
  // 2. 标记为隐藏状态，不销毁实例
  // 3. 下次 connectedCallback → handleShowKeepAliveApp → 恢复副作用快照
}

// 唤醒保活应用
function handleShowKeepAliveApp(oldApp) {
  // 1. 恢复副作用快照（rebuildEffectSnapshot）
  // 2. 重新挂载 DOM
  // 3. 派发 aftershow 事件
}
```

## 3. 沙箱与隔离

### 3.1 JS 沙箱类型

Micro-app 提供两套沙箱方案，通过 `iframe` 配置切换：

[width(24,15,37,24)]

| 沙箱类型                                | 适用场景         | 原理                                             | 特点                           |
| --------------------------------------- | ---------------- | ------------------------------------------------ | ------------------------------ |
| **Proxy 沙箱**（默认，`iframe: false`） | 同域子应用       | `Proxy` 代理 `window`，写入落到 `microAppWindow` | 性能好、通信便捷、配置灵活     |
| **iframe 沙箱**（可选，`iframe: true`） | 跨域或高安全要求 | 隐藏 iframe 提供独立 JS 执行环境                 | 物理级隔离、更强但通信成本更高 |

### 3.2 Proxy 沙箱实现

核心逻辑：创建一个 `microAppWindow` 作为子应用的“**假 window**”，通过 `new Proxy(microAppWindow, handler)` 拦截所有读写。

```js
// Proxy 沙箱：get / set / has 拦截，隔离全局变量
function createProxyWindow(appName, microAppWindow, sandbox) {
  const rawWindow = globalEnv.rawWindow
  const descriptorTargetMap = new Map()

  sandbox.proxyWindow = new Proxy(microAppWindow, {
    get: (target, key) => {
      // 自动打标当前 appName
      throttleDeferForSetAppName(appName)

      // Worker → WorkerProxy（拦截 Workers 创建）
      if (key === 'Worker') return WorkerProxy

      // 沙箱自有属性或 __MICRO_APP_ 注入变量 → 直接返回
      if (
        Reflect.has(target, key) ||
        /^__MICRO_APP_/.test(key) ||
        sandbox.scopeProperties.includes(key)
      ) {
        return Reflect.get(target, key)
      }

      // 其余属性兜底从真实 window 读取，并绑定函数上下文
      return bindFunctionToRawTarget(Reflect.get(rawWindow, key), rawWindow)
    },

    set: (target, key, value) => {
      // 白名单 → 直接写回真实 window
      if (sandbox.rawWindowScopeKeyList.includes(key)) {
        Reflect.set(rawWindow, key, value)
      }
      // 真实 window 有、假 window 没有 → 先补描述符再写
      else if (
        !rawHasOwnProperty.call(target, key) &&
        rawHasOwnProperty.call(rawWindow, key) &&
        !sandbox.scopeProperties.includes(key)
      ) {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key)
        rawDefineProperty(target, key, {
          value,
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          writable: descriptor.writable ?? !!descriptor.set,
        })
        sandbox.injectedKeys.add(key)
      }
      // 默认 → 写入 microAppWindow
      else {
        if (
          !Reflect.has(target, key) ||
          sandbox.scopeProperties.includes(key)
        ) {
          sandbox.injectedKeys.add(key)
        }
        Reflect.set(target, key, value)
      }

      // escapeProperties 中的属性 → 同步写回真实 window
      if (
        sandbox.escapeProperties.includes(key) &&
        !sandbox.scopeProperties.includes(key)
      ) {
        sandbox.escapeKeys.add(key)
        Reflect.set(rawWindow, key, value)
      }
      return true
    },

    has: (target, key) => {
      // scopeProperties 需要由 injectedKeys 和实际值双重判断
      if (sandbox.scopeProperties.includes(key)) {
        if (sandbox.injectedKeys.has(key)) return Reflect.has(target, key)
        return !!target[key]
      }
      return Reflect.has(target, key) || Reflect.has(rawWindow, key)
    },

    // 其余陷阱：getOwnPropertyDescriptor / defineProperty / ownKeys / deleteProperty
  })
}
```

### 3.3 iframe 沙箱

iframe 沙箱为每个子应用创建一个隐藏的 `<iframe id="appName">`，在 iframe 内部执行子应用代码：

```js
// iframe 沙箱：创建隐藏 iframe 并 patch window / document
class IframeSandbox {
  constructor(appName, url, options) {
    // 1. 创建隐藏 iframe → 插入 body
    this.iframe = pureCreateElement('iframe')
    this.iframe.setAttribute(
      'src',
      microApp.options.iframeSrc || browserHost + rawLocation.pathname,
    )
    this.iframe.setAttribute('style', 'display: none')
    globalEnv.rawDocument.body.appendChild(this.iframe)

    this.microAppWindow = this.iframe.contentWindow

    // 2. 在 iframe 内部创建 DOM 模板
    this.createIframeTemplate(this.microAppWindow)

    // 3. 注入全局常量
    this.initStaticGlobalKeys(appName, url, this.microAppWindow)
    //    __MICRO_APP_ENVIRONMENT__   = true
    //    __MICRO_APP_NAME__         = appName
    //    __MICRO_APP_URL__          = url
    //    __MICRO_APP_PUBLIC_PATH__  = getEffectivePath(url)
    //    __MICRO_APP_BASE_ROUTE__   = ''
    //    __MICRO_APP_SANDBOX_TYPE__ = 'iframe'

    // 4. patch iframe 内的 window、document、Element
    this.proxyLocation = patchRouter(
      appName,
      url,
      this.microAppWindow,
      browserHost,
    )
    this.windowEffect = patchWindow(appName, this.microAppWindow, this)
    this.documentEffect = patchDocument(appName, this.microAppWindow, this)
    patchElement(appName, url, this.microAppWindow, this)
  }

  start({ baseroute, defaultPage, disablePatchRequest }) {
    // 同步路由状态到 iframe
    this.initRouteState(defaultPage)

    // 创建 <base> 元素统一 iframe 内的相对路径
    if (!disablePatchRequest) {
      this.createIframeBase()
    }
  }

  stop({ umdMode, keepRouteState, destroy, clearData }) {
    // 记录或重置副作用
    this.recordAndReleaseEffect({ clearData }, !umdMode || destroy)
    // 保活模式下保留路由状态
    this.clearRouteState(keepRouteState)
    // 默认模式或销毁 → 移除 iframe
    if (!umdMode || destroy) {
      this.deleteIframeElement()
    }
  }
}
```

iframe 沙箱的代价是 DOM 和 `window` 都被代理，弹窗、`Teleport`、依赖 `document.currentScript` 的三方库更容易出问题，接入前要单独评估。

### 3.4 副作用自动清理

无论哪种沙箱，都会拦截子应用的副作用调用，在卸载时统一清理：

```js
// 记录 window 副作用，卸载时统一清理
function patchWindowEffect(microAppWindow, appName) {
  const effect = {
    listeners: new Set(),
    timers: new Set(),
  }

  // 拦截 addEventListener → 记录 (type, listener, options)
  microAppWindow.addEventListener = (type, listener, options) => {
    window.addEventListener(type, listener, options)
    effect.listeners.add({ type, listener, options })
  }

  // 拦截 setTimeout → 包装回调，执行后从记录中删除
  microAppWindow.setTimeout = (handler, timeout, ...args) => {
    const timerId = window.setTimeout(() => {
      effect.timers.delete(timerId)
      if (typeof handler === 'function') {
        handler(...args)
      }
    }, timeout)
    effect.timers.add(timerId)
    return timerId
  }

  // 卸载时统一清理
  return function clearSideEffects() {
    effect.listeners.forEach(({ type, listener, options }) => {
      window.removeEventListener(type, listener, options)
    })
    effect.timers.forEach(timerId => window.clearTimeout(timerId))
    effect.listeners.clear()
    effect.timers.clear()
  }
}
```

`setInterval`、`requestAnimationFrame` 的处理方式相同。副作用回收只是兜底，WebSocket、`IntersectionObserver` 和第三方库内部的订阅仍要在子应用卸载时自行清理。

### 3.5 CSS 隔离

Micro-app 默认采用“**样式前缀重写**”方案（Scoped CSS），而不是 Shadow DOM。默认把子应用所有 CSS 选择器加上 `micro-app[name=xxx]` 前缀，实现样式作用域约束。

#### 3.5.1 Scoped CSS 原理

```js
// Scoped CSS：为所有选择器加上 micro-app[name=xxx] 前缀
function scopedCSS(styleElement, app, linkPath) {
  if (!app.scopecss) return styleElement

  const prefix = `micro-app[name=${app.name}]`
  const parser = new CSSParser()

  // .title { ... } → micro-app[name=order] .title { ... }
  commonAction(styleElement, app.name, prefix, app.url, linkPath)

  // 监听后续动态注入的样式
  const observer = new MutationObserver(() => {
    if (!styleElement.__MICRO_APP_HAS_SCOPED__) {
      scopedCSS(styleElement, app, linkPath)
    }
  })
  observer.observe(styleElement, { childList: true, characterData: true })
}
```

`CSSParser` 处理的关键环节：

```js
class CSSParser {
  // body → micro-app[name=order] body
  // #app → micro-app[name=order] #app
  // .container .header → micro-app[name=order] .container .header
  // 支持 @media / @supports / @document / @host 中的嵌套规则
  // 处理 url()：把相对路径转为绝对路径
  // 支持禁用语法：
  // /* scopecss-disable */           — 禁用整个文件的 scoped
  // /* scopecss-enable */            — 重新启用
  // /* scopecss-disable-next-line */ — 禁用下一行
  // /* scopecss-disable .ant- */     — 禁用特定选择器
}
```

#### 3.5.2 样式隔离方案对比

[width(23,33,23,21)]

| 方案                             | 原理                                        | 优点                   | 局限                            |
| -------------------------------- | ------------------------------------------- | ---------------------- | ------------------------------- |
| **Scoped CSS**（Micro-app 默认） | 重写选择器为 `micro-app[name=xxx] selector` | 无 Shadow DOM 边界问题 | 需要处理复杂选择器、第三方库    |
| **Shadow DOM**（可选）           | 浏览器原生样式隔离                          | 最强隔离               | 弹窗 / 浮层逃逸、组件库兼容性差 |
| 应用前缀 + CSS Modules           | 工程化手段                                  | 零运行时开销           | 无法约束第三方组件库内部样式    |

**推荐策略**：Scoped CSS 为主 + 应用级前缀 + 组件库弹窗统一挂载容器。对于确定会突破边界的第三方 UI 库样式，用 `/* scopecss-disable */` 局部关闭隔离。

#### 3.5.3 企业级 CSS 隔离组合

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

- **应用级 class 前缀**：子应用根节点统一挂 `micro-app-order-wrapper`，重置样式和布局样式都限制在这个前缀下。
- **CSS Modules / scoped**：组件级样式由构建工具生成唯一类名，避免组件之间互相覆盖。
- **组件库命名空间**：给组件库配置独立的 `prefixCls`（如 `ord-button`），避免多个子应用使用不同版本的同一组件库时样式冲突。

## 4. 子应用构建

### 4.1 Vite 构建

Vite 子应用对 Micro-app 最友好，几乎零改造：

:::code-group

```ts [vite.config.ts]
export default defineConfig({
  server: {
    port: 7101,
    headers: { 'Access-Control-Allow-Origin': '*' }, // 跨域 fetch 必须
  },
})
```

```ts [router.ts]
const router = createRouter({
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/'),
  routes,
})
```

:::

### 4.2 Webpack 构建

```js
// 子应用 Webpack 配置：资源路径 + 允许跨域
module.exports = {
  output: {
    publicPath: 'http://localhost:7101/', // 或由 __MICRO_APP_PUBLIC_PATH__ 动态设置
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
}
```

### 4.3 环境感知与 UMD 模式

子应用可以通过一组全局变量判断运行环境：

```ts
// 是否运行在 micro-app 环境中
const isInMicroApp = Boolean(window.__MICRO_APP_ENVIRONMENT__)

// 子应用名称
const appName = window.__MICRO_APP_NAME__

// 公共路径（用于动态设置资源路径）
const publicPath = window.__MICRO_APP_PUBLIC_PATH__

// 基础路由
const baseRoute = window.__MICRO_APP_BASE_ROUTE__

// 沙箱类型
const sandboxType = window.__MICRO_APP_SANDBOX_TYPE__ // 'with' | 'iframe'
```

Micro-app 也兼容 qiankun 风格的 UMD 导出，子应用可以导出 `mount` / `unmount`：

```ts
// 子应用入口
let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  app = createApp(App)
  app.use(router)
  app.mount(props.container?.querySelector('#app') ?? '#app')
}

const microAppWindow = window as any

// UMD 模式下暴露给 micro-app 的钩子
microAppWindow.mount = (data: any) => {
  console.log('received data from base app:', data)
  return new Promise(resolve => {
    render()
    resolve()
  })
}

microAppWindow.unmount = () => {
  app?.unmount()
  app = null
}

// 独立运行
if (!microAppWindow.__MICRO_APP_ENVIRONMENT__) {
  render()
}
```

### 4.4 接入与落地检查清单

[width(13,57,30)]

| 架构维度         | 关键实践规范                                                                                       | 核心目的                                             |
| ---------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **路由规范**     | 为每个子应用分配**稳定一级路径前缀**（如 `/order`、`/goods`），子应用路由与该前缀对齐              | 避免主子应用路由抢占，保证刷新恢复和链接分享的确定性 |
| **样式隔离**     | Scoped CSS（默认） + 应用级 class 前缀 + 组件库弹窗统一挂载容器，必要时用 `/* scopecss-disable */` | 多层级防御，既隔离全局污染又不破坏第三方库样式       |
| **沙箱策略**     | 同域子应用用 Proxy 沙箱，跨域或高安全需求用 iframe 沙箱                                            | 在隔离强度与通信便捷性之间取得平衡                   |
| **内存与副作用** | 不使用 `keep-alive` 的子应用必须在卸载时清理事件、定时器、WebSocket；沙箱的副作用自动清理是兜底    | 防止频繁切换导致内存泄漏和事件重复触发               |
| **通信规范**     | 仅传递认证、权限、主题、语言等公共状态，业务数据优先通过后端 API 或 URL 解耦                       | 避免子应用与主应用形成“**意大利面条**”式耦合         |
| **预加载策略**   | 核心高频子应用配置 `level=2` 预加载；需要秒开体感的配置 `level=3` 预渲染并严格评估内存成本         | 在首屏性能和内存占用之间取得平衡                     |
| **公共依赖**     | React、Vue、组件库等通过 `globalAssets` 全局预缓存 + CDN Externals                                 | 避免公共库被重复打包下载，减少子应用体积和切换耗时   |
| **性能优化**     | 大体积子应用启用 `fiber` 模式；非首屏应用使用预加载                                                | 避免 JS 执行阻塞主线程                               |
| **工程化部署**   | 子应用独立仓库、独立 CI/CD、独立部署与回滚                                                         | 真正发挥微前端“**独立部署、独立容灾**”的架构优势     |
| **监控与排查**   | 接入错误监控系统，通过 `window.__MICRO_APP_NAME__` 区分主子应用的错误来源                          | 在分布式前端架构中快速定位线上问题                   |

## 5. 应用场景

### 5.1 典型应用场景

[width(15,30,55)]

| 场景                    | 典型诉求                                       | 关键配置                                                                                          |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **中后台聚合门户**      | 一个基座收纳多个业务子系统，菜单统一、切换要快 | 每个子应用分配 `baseroute` 前缀；高频子应用 `preFetch` level=2；菜单常驻项加 `keep-alive`         |
| **老系统渐进式接入**    | jQuery / Vue2 老页面零改造嵌入，随用随删       | 老页面直接用 `<micro-app>` 包一层；同域可信时按需 `disable-sandbox`；先用 level=1 预加载          |
| **多团队独立发版**      | 子应用独立仓库、独立 CI/CD、独立回滚           | 子应用独立部署；`globalAssets` 收敛 React/Vue 等公共依赖；错误按 `window.__MICRO_APP_NAME__` 打标 |
| **多品牌 / 多地区站点** | 同一基座按地区裁剪子应用                       | `router-mode='pure'` 隔离子应用内部路由；用 `setGlobalData` 下发地域与语言                        |
| **灰度发布**            | 只对部分用户切到新版本子应用                   | 基座按灰度规则改写 `url` 指向新版本，改写后调用 `microApp.reload(appName)` 重新渲染               |
| **嵌入第三方黑盒系统**  | 页面里塞一个不受控的外部系统                   | 只为该应用打开 `iframe` 沙箱；按需用 `disable-patch-request` 关闭请求代理                         |

### 5.2 微前端方案对比

[width(50,50)]

| 诉求                                        | 优先选择                                                             |
| ------------------------------------------- | -------------------------------------------------------------------- |
| 零侵入接入、Vite / ESM 友好、Web Components | **Micro-app**                                                        |
| 存量 Webpack 中后台、生态成熟与避坑         | [qiankun](/frontEngineering/architecture/qiankun)                    |
| 需要 iframe 级强隔离、跨域黑盒系统          | [Wujie](/frontEngineering/architecture/wujie)                        |
| 同技术栈、模块级共享依赖                    | [Module Federation](/frontEngineering/architecture/moduleFederation) |

Micro-app 的优势在**接入成本低**：子应用不需要导出生命周期，Vite 产物也能直接跑。如果核心诉求是运行时共享依赖，Module Federation 更合适；如果核心诉求是物理级隔离，Wujie 或 iframe 沙箱更稳。

## 6. 常见问题（FAQ）

### 6.1 子应用静态资源路径错误、刷新后 404 怎么办？

检查 Vite 的 `base` 或 Webpack 的 `publicPath` 是否与真实部署路径一致，也可以在运行时用 `__MICRO_APP_PUBLIC_PATH__` 指定；主应用的 Nginx 要配置 `try_files`，把非静态资源请求 fallback 到 `index.html`。

### 6.2 样式污染、第三方库样式被误加前缀怎么办？

先确认 `disable-scopecss` 没有被设为 `true`，再给子应用的全局 class 加上应用级前缀；确实不能改类名的第三方库或特定文件，用 `/* scopecss-disable */` / `/* scopecss-disable-next-line */` 局部关闭 Scoped CSS。

### 6.3 弹窗、浮层挂载位置和层级异常怎么办？

让组件库的 Portal / Teleport 指向子应用的根容器，不要挂到 `document.body`；iframe 沙箱默认为 `display:none`，DOM 被代理到主文档后，弹窗还需要单独配置挂载容器。

### 6.4 子应用切换后事件被重复触发怎么办？

先确认 `keep-alive` 场景下的保活策略是否正确；不使用保活时，必须在卸载阶段手动清理事件监听、定时器与全局订阅。

### 6.5 预加载不生效、内存占用高怎么办？

预加载只在 `requestIdleCallback` 的空闲时段串行执行，`navigator.onLine` 为 `false` 时会跳过；非核心子应用用 `level=1` / `level=2`，不要用 `level=3`（预渲染），否则内存占用会明显上升。

### 6.6 多个子应用依赖同一份库，怎么避免重复加载？

通过 `globalAssets` 预缓存公共 CDN 资源，让各子应用共用同一份 React / Vue / 组件库，减少重复请求。

### 6.7 子应用首次渲染拿不到主应用下发的数据怎么办？

子应用在挂载前先用 `window.microApp.getData()` 读取缓存；`addDataListener(cb, true)` 的 `autoTrigger` 参数会用缓存数据立即触发一次回调；同时确认卸载时没有设置 `clear-data`，否则缓存会被清空。

### 6.8 Vite 子应用的 HMR 为什么失效了？

`micro-app` 接管子应用后，HMR 的模块更新通道会失效；可以在 `micro-app` 环境中禁用 HMR，或改用 `inline` 模式执行 JS。
