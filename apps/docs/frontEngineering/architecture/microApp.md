---
outline: [2, 3]
---

# Micro-app 微前端方案

`Micro-app` 是京东零售开源的、基于 **Web Components** 的微前端框架。其核心设计理念是 **"零侵入接入"** —— 子应用不需要暴露
`bootstrap`、`mount`、`unmount` 生命周期即可运行，主应用像使用普通 HTML 标签一样嵌入子应用。相比 qiankun 的 `single-spa`
体系，Micro-app 更强调"**把复杂度封装在自定义元素内部**"。

## 1. 核心架构原理

Micro-app 的运行链路本质是以 `CustomElement` 为中心的资源加载与沙箱调度器：

```markdown
注册自定义元素 <micro-app>
↓
connectedCallback 触发 → 拉取子应用 HTML
↓
HTML 解析 → <head> → <micro-app-head>, <body> → <micro-app-body>
↓
提取 <script> / <link> → Script 源码 fetch → 沙箱执行
↓
样式 Scoped CSS (micro-app[name=xxx] 前缀)
↓
DOM 挂载到 <micro-app> 容器（Shadow DOM 可选）
↓
路由切换 → disconnectedCallback → 卸载或保活
```

## 2. 框架启动与注册

### 2.1 启动

`microApp.start()` 是框架的唯一切入点。核心逻辑是：初始化全局运行环境 → 注册自定义元素 → 处理预加载与全局插件配置。

```ts
import microApp from '@micro-zoe/micro-app'

microApp.start({
  iframe: false, // 是否使用 iframe 沙箱，默认 false
  'disable-sandbox': false, // 是否禁用 JS 沙箱
  'disable-scopecss': false, // 是否禁用 CSS 样式隔离
  inline: false, // 是否使用内联 script 模式执行 JS
  shadowDOM: false, // 是否使用 Shadow DOM（强隔离，但弹窗易逃逸）
  prefetchDelay: 3000, // 预加载延迟时间（ms）
  preFetchApps: [
    // 空闲时预加载的子应用
    { name: 'order', url: 'http://localhost:7101/' },
  ],
  globalAssets: {
    // 全局公共资源缓存
    js: ['https://cdn.example.com/react.js'],
    css: ['https://cdn.example.com/antd.css'],
  },
  plugins: {
    // 插件：处理 HTML / JS / CSS
    global: [],
    modules: {},
  },
})
```

:::details start() 简化源码

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
    // 防止重复启动
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

    // 初始化全局环境（补丁原生 API，如 fetch、EventSource、MutationObserver 等）
    initGlobalEnv()

    // 自定义元素已存在则告警
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
      // 空闲时预加载子应用资源
      options.preFetchApps && preFetch(options.preFetchApps)
      // 加载全局公共资源到缓存
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

### 2.2 主应用页面中使用

```vue
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

也可以通过 JS API 命令式渲染：

```ts
import { renderApp } from '@micro-zoe/micro-app'

renderApp({
  name: 'order',
  url: 'http://localhost:7101/',
  container: '#micro-container',
  baseroute: '/order',
  data: { token: 'xxx' },
})
```

## 3. 自定义元素

Micro-app 的核心是继承 `HTMLElement` 的 `MicroAppElement` 类。子应用的加载、渲染、保活、卸载全部由这个 Custom Element
的三个生命周期回调驱动。

### 3.1 监听元素属性

Micro-app 只监听 `name` 和 `url` 两个属性：

```js
class MicroAppElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'url']
  }

  //监听属性变化
  attributeChangedCallback(attr, _oldVal, newVal) {
    // 首次：name 或 url 还未设置 → 记录属性值 → handleInitialNameAndUrl
    // 更新：name 或 url 变化 → 异步卸载旧应用 → 重新渲染新应用
    if (attr === 'name' && !this.appName) {
      this.appName = formatAppName(newVal)
      this.handleInitialNameAndUrl()
    } else if (attr === 'url' && !this.appUrl) {
      this.appUrl = formatAppURL(newVal, this.appName)
      this.handleInitialNameAndUrl()
    } else if (!this.isWaiting) {
      this.isWaiting = true
      defer(this.handleAttributeUpdate) // 异步防抖处理属性更新
    }
  }
}
```

### 3.2 加载触发点

元素插入 DOM 时触发。为防止框架内部短暂 insert/remove（如 Vue 的 keep-alive 机制），使用了 `connectStateMap` + `defer` 异步防抖：

```js
class MicroAppElement extends HTMLElement {
  //元素插入文档
  connectedCallback() {
    // Firefox 的 iframe Node.prototype 在插入后可能指向原生而非 MicroAppElement
    if (Object.getPrototypeOf(this) !== MicroAppElement.prototype) {
      Object.setPrototypeOf(this, MicroAppElement.prototype)
    }
    const cacheCount = ++this.connectedCount
    this.connectStateMap.set(cacheCount, true)

    // 异步执行，防止 Vue keep-alive 瞬时插入删除导致的重复渲染
    defer(() => {
      if (this.connectStateMap.get(cacheCount)) {
        dispatchLifecyclesEvent(this, this.appName, lifeCycles.CREATED)
        this.appName && this.appUrl && this.handleConnected()
      }
    })
  }
}
```

### 3.3 卸载触发点

元素从 DOM 移除时触发。根据 `keep-alive` 属性决定是隐藏保活还是彻底卸载：

```js
class MicroAppElement extends HTMLElement {
  //元素从文档移除
  disconnectedCallback() {
    this.connectStateMap.set(this.connectedCount, false)
    this.handleDisconnected()
  }

  handleDisconnected(destroy = false) {
    const app = appInstanceMap.get(this.appName)
    if (app && !app.isUnmounted() && !app.isHidden()) {
      if (this.getKeepAliveModeResult() && !destroy) {
        this.handleHiddenKeepAliveApp() // 保活模式：隐藏但不销毁
      } else {
        this.unmount(destroy) // 彻底卸载
      }
    }
  }
}
```

### 3.4 应用渲染调度

`handleConnected` 是 Micro-app 的"**路由分发中心**"。它判断当前 appName 是否已存在实例，根据实例状态决定复用、唤醒还是重新创建：

```js
class MicroAppElement extends HTMLElement {
  handleConnected() {
    if (!this.appName || !this.appUrl) return

    // 配置了 shadowDOM → 创建 Shadow Root
    if (this.getDisposeResult('shadowDOM') && !this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }
    if (appInstanceMap.has(this.appName)) {
      const oldApp = appInstanceMap.get(this.appName)
      if (oldApp.isHidden() && oldApp.url === this.appUrl) {
        this.handleShowKeepAliveApp(oldApp) // 唤醒保活应用
      } else if (
        oldAppUrl === targetUrl &&
        (oldApp.isUnmounted() || oldApp.isPrefetch)
      ) {
        this.handleMount(oldApp) // 挂载已预加载的实例
      } else {
        this.handleCreateApp() // 新建实例
      }
    } else {
      this.handleCreateApp() // 首次新建
    }
  }
}
```

## 4. 资源加载机制

### 4.1 资源拉取与解析

Micro-app 同样使用 HTML Entry 方式加载子应用。`HTMLLoader` 负责 fetch HTML 并做初步处理：

```js
class HTMLLoader {
  run(app, successCb) {
    const htmlUrl = app.ssrUrl || app.url
    // 如果是 JS 后缀地址 → 包裹为 HTML 格式
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
        // 关键步骤：将 <head> → <micro-app-head>, <body> → <micro-app-body>
        htmlStr = this.formatHTML(htmlUrl, htmlStr, app.name)
        successCb(htmlStr, app)
      })
      .catch(e => {
        app.onLoadError(e)
      })
  }

  formatHTML(htmlUrl, htmlStr, appName) {
    // 1. 经过插件链处理 HTML
    return (
      this.processHtml(htmlUrl, htmlStr, appName, microApp.options.plugins)
        // 2. 替换 <head> → <micro-app-head>
        .replace(/<head[^>]*>[\s\S]*?<\/head>/i, match => {
          return match
            .replace(/<head/i, '<micro-app-head')
            .replace(/<\/head>/i, '</micro-app-head>')
        })
        // 3. 替换 <body> → <micro-app-body>
        .replace(/<body[^>]*>[\s\S]*?<\/body>/i, match => {
          return match
            .replace(/<body/i, '<micro-app-body')
            .replace(/<\/body>/i, '</micro-app-body>')
        })
    )
  }
}
```

**设计意图**：将 `<head>` / `<body>` 替换为自定义标签 `<micro-app-head>` / `<micro-app-body>`，使得子应用 DOM
能被解析为普通元素而非原生 `<head>` / `<body>`，避免与主应用的 `<head>` / `<body>` 冲突。

### 4.2 资源提取流程

`extractSourceDom` 是 HTML 解析后的下一步：将解析后的 DOM 拆解为 link、style、script 三类资源，并行加载。

```js
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

### 4.3 资源路径解析

和 qiankun 类似，HTML Entry 中的相对路径需要用子应用 URL 作为基址：

```js
// 将相对路径转为基于 entry URL 的绝对路径
function CompletionPath(path, baseURI) {
  return new URL(path, baseURI).toString()
}

// 获取子应用的根路径：将 https://domain/xx/xx.html 转为 https://domain/xx/
function getEffectivePath(url) {
  const urlObj = new URL(url)
  const pathArr = urlObj.pathname.split('/')
  pathArr.pop() // 去掉最后一段（文件名）
  urlObj.pathname = pathArr.join('/')
  return urlObj.toString()
}
```

子应用在运行时可通过 `window.__MICRO_APP_PUBLIC_PATH__` 获取这个根路径。

### 4.4 资源管理中心

Micro-app 使用全局的 `sourceCenter` 管理所有 HTML、JS、CSS 资源的缓存和共享：

```js
function createSourceCenter() {
  const linkList = new Map() // CSS 地址 → { code, appSpace: {} }
  const scriptList = new Map() // JS 地址  → { code, isExternal, appSpace: {} }

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

同一个资源被多个子应用引用时，只请求一次，缓存在 `sourceCenter`。每个应用的解析结果独立存储在 `appSpace[appName]` 中。

## 5. 脚本执行机制

### 5.1 同步 vs 异步脚本

Micro-app 区分同步脚本和 `defer/async` 脚本，保证执行顺序：

```js
function execScripts(app, initHook) {
  const scriptList = Array.from(app.source.scripts)
  const deferScriptPromise = [] // defer/async 脚本的 fetch 队列
  const deferScriptInfo = [] // defer/async 脚本的元信息

  for (const address of scriptList) {
    const scriptInfo = sourceCenter.script.getInfo(address)
    const appSpaceData = scriptInfo.appSpace[app.name]

    if (appSpaceData.defer || appSpaceData.async) {
      // defer/async 脚本：先全部 fetch，再按序执行
      deferScriptPromise.push(
        scriptInfo.isExternal
          ? fetchSource(address, app.name)
          : scriptInfo.code,
      )
      deferScriptInfo.push([address, scriptInfo])
    } else {
      // 同步脚本：立即执行
      runScript(address, app, scriptInfo)
      initHook(false)
    }
  }

  // 等待所有 defer/async 脚本 loaded 后按序执行
  if (deferScriptPromise.length) {
    promiseStream(
      deferScriptPromise,
      res => {
        deferScriptInfo[res.index][1].code = res.data
      },
      err => {
        logError(err, app.name)
      },
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

### 5.2 脚本作用域绑定

每个脚本在沙箱中执行前，都会通过 `bindScope` 包裹一层 `with(window)` 作用域：

```js
function bindScope(address, app, code, scriptInfo) {
  // 如果禁用了沙箱 → 直接返回原始代码
  if (scriptInfo.isGlobal) return code

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

### 5.3 执行模式

```js
function runScript(address, app, scriptInfo, callback) {
  const sandboxType = getSandboxType(app, scriptInfo)

  // 首次执行或沙箱类型发生变化时，重新 bindScope
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
    // 内联模式：创建 <script> 元素，通过 textContent / src 执行
    const scriptElement = document.createElement('script')
    runCode2InlineScript(address, parsedCode, isModule, scriptElement)
    parent.appendChild(scriptElement)
  } else {
    // 默认模式：new Function 执行
    runParsedFunction(app, scriptInfo)
  }
}
```

### 5.4 Fiber 模式

通过 `requestIdleCallback` 将脚本分割为 fiber 任务，避免长时间阻塞主线程：

```js
// 将 runScript 包装为 fiber 任务
injectFiberTask(fiberScriptTasks, () => {
  runScript(address, app, scriptInfo)
  initHook(false)
})

// 串行执行 fiber 链表
function serialExecFiberTasks(tasks) {
  // 每个 task 在 requestIdleCallback 中执行
  // 形成一条 Promise 链，保证顺序
}
```

## 6. JS 沙箱隔离

Micro-app 提供两套沙箱方案，通过 `iframe` 配置切换：

| 沙箱类型                                | 适用场景         | 原理                                             | 特点                           |
| --------------------------------------- | ---------------- | ------------------------------------------------ | ------------------------------ |
| **Proxy 沙箱**（默认，`iframe: false`） | 同域子应用       | `Proxy` 代理 `window`，写入落到 `microAppWindow` | 性能好、通信便捷、配置灵活     |
| **iframe 沙箱**（可选，`iframe: true`） | 跨域或高安全要求 | 隐藏 iframe 提供独立 JS 执行环境                 | 物理级隔离、更强但通信成本更高 |

### 6.1 Proxy 沙箱

核心逻辑：创建一个 `microAppWindow` 作为子应用的"**假 window**"，通过 `new Proxy(microAppWindow, handler)` 拦截所有读写。

```js
function createProxyWindow(appName, microAppWindow, sandbox) {
  const rawWindow = globalEnv.rawWindow
  const descriptorTargetMap = new Map()

  sandbox.proxyWindow = new Proxy(microAppWindow, {
    get: (target, key) => {
      // 自动打标当前 appName
      throttleDeferForSetAppName(appName)

      // Worker → WorkerProxy（拦截 Workers 创建）
      if (key === 'Worker') return WorkerProxy

      // 沙箱自有属性 或 __MICRO_APP_ 前缀的注入变量 → 直接返回
      if (
        Reflect.has(target, key) ||
        /^__MICRO_APP_/.test(key) ||
        sandbox.scopeProperties.includes(key)
      ) {
        return Reflect.get(target, key)
      }

      // 其他属性 → 兜底从真实 window 读取，并 bind 函数上下文
      return bindFunctionToRawTarget(Reflect.get(rawWindow, key), rawWindow)
    },

    set: (target, key, value) => {
      // 白名单 → 直接写回真实 window
      if (sandbox.rawWindowScopeKeyList.includes(key)) {
        Reflect.set(rawWindow, key, value)
      }
      // 子应用 window 上不存在的属性但真实 window 存在 → 先 defineProperty 到 microAppWindow
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

    // other traps: getOwnPropertyDescriptor, defineProperty, ownKeys, deleteProperty ...
  })
}
```

### 6.2 iframe 沙箱

iframe 沙箱为每个子应用创建一个隐藏的 `<iframe id="appName">`，在 iframe 内部执行子应用代码：

```js
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

    // 4. Patch iframe 内的 window, document, Element
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
    // 记录副作用快照（umd 模式/keep-alive 保活时记录后清除）
    // 或重置副作用（默认模式直接清除）
    this.recordAndReleaseEffect({ clearData }, !umdMode || destroy)
    // 保活模式下保留路由状态
    this.clearRouteState(keepRouteState)
    // 默认模式/销毁 → 移除 iframe
    if (!umdMode || destroy) {
      this.deleteIframeElement()
    }
  }
}
```

### 6.3 副作用自动清理

无论哪种沙箱模式，都会拦截子应用的副作用调用，在卸载时自动清理：

```js
function patchWindowEffect(microAppWindow, appName) {
  // 拦截 addEventListener → 记录 (type, listener, options)
  // 拦截 removeEventListener → 移除记录
  // 拦截 setTimeout → 包装回调，完成后从记录中删除
  // 拦截 setInterval → 记录 ID
  // 拦截 requestAnimationFrame → 记录 ID
  // 卸载时统一调用 clearSideEffects() 清理
}
```

## 7. CSS 样式隔离

Micro-app 的 CSS 隔离采用 **"样式前缀重写"** 方案（Scoped CSS），而非 Shadow DOM。默认将子应用所有 CSS 选择器加上
`micro-app[name=xxx]` 前缀，实现样式作用域约束。

### 7.1 Scoped CSS 原理

```js
function scopedCSS(styleElement, app, linkPath) {
  if (!app.scopecss) return styleElement

  const prefix = `micro-app[name=${app.name}]`
  const parser = new CSSParser()

  // 对所有 CSS 选择器增加前缀
  // .title { ... } → micro-app[name=order] .title { ... }
  commonAction(styleElement, app.name, prefix, app.url, linkPath)

  // 使用 MutationObserver 监听后续动态注入的样式
  const observer = new MutationObserver(() => {
    if (!styleElement.__MICRO_APP_HAS_SCOPED__) {
      scopedCSS(styleElement, app, linkPath)
    }
  })
  observer.observe(styleElement, { childList: true, characterData: true })
}
```

CSSParser 处理的关键环节：

```js
class CSSParser {
  // 处理 CSS Rule，在根选择器前插入前缀
  // body → micro-app[name=order] body
  // #app → micro-app[name=order] #app
  // .container .header → micro-app[name=order] .container .header
  // 支持 @media / @supports / @document / @host 中的嵌套规则
  // 处理 url() —— 将相对路径转为绝对路径
  // 支持禁用语法：
  // /* scopecss-disable */          — 禁用整个文件的 scoped
  // /* scopecss-enable */           — 重新启用
  // /* scopecss-disable-next-line */— 禁用下一行
  // /* scopecss-disable .ant- */    — 禁用特定选择器
}
```

### 7.2 样式隔离方案对比

| 方案                             | 原理                                        | 优点                   | 局限                          |
| -------------------------------- | ------------------------------------------- | ---------------------- | ----------------------------- |
| **Scoped CSS**（micro-app 默认） | 重写选择器为 `micro-app[name=xxx] selector` | 无 Shadow DOM 边界问题 | 需要处理复杂选择器、第三方库  |
| **Shadow DOM**（可选）           | 浏览器原生样式隔离                          | 最强隔离               | 弹窗/浮层逃逸、组件库兼容性差 |
| 应用前缀 + CSS Modules           | 工程化手段                                  | 零运行时开销           | 无法约束第三方组件库内部样式  |

**推荐策略**：Scoped CSS 为主 + 应用级前缀 + 组件库弹窗统一挂载容器。对于确定会突破边界的第三方 UI 库样式，用
`/* scopecss-disable */` 注释局部关闭隔离。

## 8. 路由机制

Micro-app 提供三套路由模式：

| 模式       | 说明                                                           |
| ---------- | -------------------------------------------------------------- |
| **search** | 默认模式。子应用路由通过 `?` 参数传递，如 `/?/order/list`      |
| **native** | 原生模式。子应用路由直接拼接在主应用路径后面，如 `/order/list` |
| **pure**   | 纯模式。子应用内部路由独立管理，不影响浏览器 URL               |
| **custom** | 自定义模式。完全由开发者控制路由同步逻辑                       |

```ts
// 虚拟路由系统（iframe 沙箱内）
microAppWindow.__MICRO_APP_BASE_ROUTE__ = '/order' // 路由前缀
microAppWindow.__MICRO_APP_BASE_URL__ = '/order' // 基础 URL
microAppWindow.__MICRO_APP_PUBLIC_PATH__ = 'http://localhost:7101/' // 资源路径
```

子应用路由配置：

```ts
// Vue Router
const router = createRouter({
        history: createWebHistory(
            (window as any).__MICRO_APP_BASE_ROUTE__ || '/'
        ),
        routes,
    })

// React Router
< BrowserRouter basename = {window.__MICRO_APP_BASE_ROUTE__ || '/'} >
    <App / >
</BrowserRouter>
```

## 9. 通信机制

Micro-app 的通信基于内置的 `EventCenter`，提供**主→子(setData)** 和 **子→主(dispatch)** 两种数据流。

### 9.1 主应用下发数据

```html
<micro-app name="order" url="http://localhost:7101/" :data="microData" />
```

```ts
// 动态更新数据
microApp.setData('order', { theme: 'dark' })
// 强制更新（跳过差异对比）
microApp.forceSetData('order', { timestamp: Date.now() })
```

### 9.2 子应用接收数据

```ts
// 获取当前数据（缓存数据在绑定监听前也存在）
const data = window.microApp?.getData()

// 监听数据变化
window.microApp?.addDataListener(data => {
  console.log('data from base app:', data)
}, true) // 第二个参数 autoTrigger: 立即用缓存数据触发回调

// 取消监听
window.microApp?.removeDataListener(cb)
```

### 9.3 子应用向主应用发送数据

```ts
window.microApp?.dispatch({ type: 'ORDER_CREATED', payload: { id: '10001' } })
```

### 9.4 主应用接收子应用数据

```ts
microApp.addDataListener('order', data => {
  console.log('data from child app order:', data)
})
```

### 9.5 全局数据通信

```ts
// 主应用设置全局数据
microApp.setGlobalData({ env: 'production', version: '1.0.0' })

// 子应用监听全局数据
window.microApp?.addGlobalDataListener(data => {
  console.log('global data:', data)
})
```

### 9.6 EventCenter 实现原理

```js
class EventCenter {
  // dispatch 时不直接触发回调，而是入队 + defer 异步统一执行
  dispatch(name, data, nextStep, force) {
    let eventInfo = this.eventList.get(name)
    if (eventInfo) {
      // 浅合并到 tempData
      eventInfo.tempData = assign(
        {},
        eventInfo.tempData || eventInfo.data,
        data,
      )
    } else {
      eventInfo = { data, callbacks: new Set() }
      this.eventList.set(name, eventInfo)
      eventInfo.force = true // 初次监听方尚未绑定时强制触发
    }
    this.enqueue(name, nextStep) // 入队
  }

  enqueue(name, nextStep) {
    // 第一个入队时 defer(process)
    !this.queue.includes(name) &&
      this.queue.push(name) === 1 &&
      defer(this.process)
  }

  process() {
    // 微任务中执行所有回调
    while ((name = this.queue.shift())) {
      const eventInfo = this.eventList.get(name)
      if (force || !isEqual(eventInfo.data, tempData)) {
        eventInfo.callbacks.forEach(f => f(eventInfo.data))
      }
    }
  }
}
```

## 10. 生命周期

### 10.1 自定义事件

Micro-app 通过自定义事件在 `<micro-app>` 元素上派发生命周期通知：

```html
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

### 10.2 子应用全局钩子

子应用也可以注册全局生命周期回调：

```ts
// 挂载完成时
window.addEventListener('unmount', () => {
  console.log('微应用卸载了')
})
```

或通过 window 上的钩子函数：

```ts
window.onmount = () => {
  console.log('子应用挂载完成')
}
window.onunmount = () => {
  console.log('子应用卸载')
}
```

### 10.3 子应用内部状态感知

子应用可通过自定义事件监听内部状态变化：

```ts
window.addEventListener('appstate-change', e => {
  console.log('state:', e.detail.appState) // LOADING / MOUNTING / MOUNTED / UNMOUNT
})
```

### 10.4 应用内部状态机

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
// CREATED → LOADING → BEFORE_MOUNT → MOUNTING → MOUNTED
//                                              → UNMOUNT
//           LOADING → LOAD_FAILED → UNMOUNT
```

## 11. Keep-alive 与预加载

### 11.1 Keep-alive 保活

```html
<micro-app name="order" url="http://localhost:7101/" keep-alive />
```

实现原理：`disconnectedCallback` 时不执行 `unmount`，而是调用 `handleHiddenKeepAliveApp`：

```js
// 隐藏保活应用
handleHiddenKeepAliveApp()
{
  // 1. 记录并释放副作用（事件、定时器等）
  sandbox.recordAndReleaseEffect({ keepAlive: true })
  // 2. 标记为隐藏状态，不销毁实例
  // 3. 下次 connectedCallback → handleShowKeepAliveApp → 恢复副作用快照
}

// 唤醒保活应用
handleShowKeepAliveApp(oldApp)
{
  // 1. 恢复副作用快照 (rebuildEffectSnapshot)
  // 2. 重新挂载 DOM
  // 3. 派发 aftershow 事件
}
```

### 11.2 预加载

```ts
// start() 时全局配置
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

预加载层级：

| level | 说明                             |
| ----- | -------------------------------- |
| 1     | 只预加载 HTML，不解析 JS/CSS     |
| 2     | 预加载并解析 JS/CSS（默认）      |
| 3     | **预渲染**：在后台完整渲染子应用 |

```js
function preFetch(apps, delay) {
  if (!isBrowser) return
  requestIdleCallback(() => {
    // delay 默认 3000ms，可在 start({ prefetchDelay }) 中自定义
    const delayTime = isNumber(delay) ? delay : microApp.options.prefetchDelay
    setTimeout(() => {
      preFetchInSerial(apps) // 串行预加载，避免同时占用过多带宽
    }, delayTime ?? 3000)
  })
}

function preFetchInSerial(apps) {
  if (isArray(apps)) {
    // 串行 Promise 链
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
      // 创建预加载实例
      const app = new CreateApp({
        name: options.name,
        url: options.url,
        isPrefetch: true,
        useSandbox: !options['disable-sandbox'],
        scopecss: !options['disable-scopecss'],
        prefetchLevel: options.level ?? microApp.options.prefetchLevel ?? 2,
      })
      // 预渲染（level=3）：完整渲染到独立 container
      if (app.isPrerender) {
        // 创建 <div prerender="true">，在其中完整渲染，但不派发生命周期事件
      }
    }
  })
}
```

### 11.3 全局公共资源预缓存

```ts
microApp.start({
  globalAssets: {
    js: ['https://cdn.example.com/react.umd.js'],
    css: ['https://cdn.example.com/antd.css'],
  },
})
```

内部在 `requestIdleCallback` 中 fetch 这些资源并存入 `sourceCenter`，子应用引用相同 URL 时直接命中缓存。

## 12. 子应用适配

### 12.1 Vite 子应用

Vite 子应用对 Micro-app 最友好，几乎零改造：

```ts
// vite.config.ts
export default defineConfig({
  server: {
    port: 7101,
    headers: { 'Access-Control-Allow-Origin': '*' }, // 跨域 fetch 必须
  },
})
```

```ts
// router
const router = createRouter({
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/'),
  routes,
})
```

### 12.2 Webpack 子应用

```js
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

### 12.3 环境感知

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

### 12.4 UMD 模式（可选）

Micro-app 兼容 qiankun 风格的 UMD 导出，子应用可以导出 `mount`/`unmount`：

```ts
// 子应用入口
let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  app = createApp(App)
  app.use(router)
  app.mount(props.container?.querySelector('#app') ?? '#app')
}

// UMD 模式下暴露给 micro-app 的钩子
;(window as any).mount = (data: any) => {
  console.log('received data from base app:', data)
  return new Promise(resolve => {
    render()
    resolve()
  })
}
;(window as any).unmount = () => {
  app?.unmount()
  app = null
}

// 独立运行
if (!(window as any).__MICRO_APP_ENVIRONMENT__) {
  render()
}
```

## 13. 常见问题

| 问题                     | 处理方式                                                                     |
| ------------------------ | ---------------------------------------------------------------------------- |
| 子应用静态资源路径错误   | 检查 Vite `base` 或 Webpack `publicPath`，或使用 `__MICRO_APP_PUBLIC_PATH__` |
| 刷新后 404               | 主应用 Nginx 配置 `try_files` fallback 到 `index.html`                       |
| 样式污染                 | 确认 `disable-scopecss` 未设为 true；使用应用级 class 前缀                   |
| 弹窗/浮层挂载异常        | 组件库 Portal/Teleport 指向子应用根容器，不要挂到 `document.body`            |
| 第三方库样式被误加前缀   | 使用 `/* scopecss-disable */` / `/* scopecss-disable-next-line */`           |
| 子应用切换后事件重复触发 | 确认 `keep-alive` 场景下保活策略正确；卸载时手动清理监听器                   |
| 预加载应用内存占用高     | 非核心子应用使用 level=1/2 而非 level=3（预渲染）                            |
| iframe 沙箱弹窗层级异常  | iframe 默认为 `display:none`，DOM 代理到主文档后弹窗需配置容器               |
| 多个子应用共享相同依赖   | 通过 `globalAssets` 预缓存公共 CDN 资源，减少重复请求                        |
| Vite 子应用 HMR 失效     | 在 `micro-app` 环境中禁用 HMR，或使用 `inline` 模式执行 JS                   |

## 14. 落地建议

| 架构维度         | 关键实践规范                                                                                       | 核心目的                                             |
| ---------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **路由规范**     | 为每个子应用分配**稳定一级路径前缀**（如 `/order`、`/goods`），子应用路由与该前缀对齐              | 避免主子应用路由抢占，保证刷新恢复和链接分享的确定性 |
| **样式隔离**     | Scoped CSS（默认） + 应用级 class 前缀 + 组件库弹窗统一挂载容器，必要时用 `/* scopecss-disable */` | 多层级防御，既隔离全局污染又不破坏第三方库样式       |
| **沙箱策略**     | 同域子应用用 Proxy 沙箱，跨域或高安全需求用 iframe 沙箱                                            | 在隔离强度与通信便捷性之间取得平衡                   |
| **内存与副作用** | 不使用 `keep-alive` 的子应用必须在卸载时清理事件、定时器、WebSocket；沙箱的副作用自动清理是兜底    | 防止频繁切换导致内存泄漏和事件重复触发               |
| **通信规范**     | 仅传递认证、权限、主题、语言等公共状态，业务数据优先通过后端 API 或 URL 解耦                       | 避免子应用与主应用形成"意大利面条"式耦合             |
| **预加载策略**   | 核心高频子应用配置 `level=2` 预加载；需要秒开体感的配置 `level=3` 预渲染并严格评估内存成本         | 在首屏性能和内存占用之间取得平衡                     |
| **公共依赖**     | React、Vue、组件库等通过 `globalAssets` 全局预缓存 + CDN Externals                                 | 避免公共库被重复打包下载，减少子应用体积和切换耗时   |
| **性能优化**     | 大体积子应用启用 `fiber` 模式；非首屏应用使用预加载                                                | 避免 JS 执行阻塞主线程                               |
| **工程化部署**   | 子应用独立仓库、独立 CI/CD、独立部署与回滚                                                         | 真正发挥微前端"**独立部署、独立容灾**"的架构优势     |
| **监控与排查**   | 接入错误监控系统，通过 `window.__MICRO_APP_NAME__` 区分主子应用的错误来源                          | 在分布式前端架构中快速定位线上问题                   |
