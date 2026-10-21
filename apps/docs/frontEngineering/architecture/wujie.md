---
outline: [2, 3]
---

# Wujie 微前端方案

Wujie（无界）是腾讯出品的微前端框架，核心采用 **WebComponent + iframe** 架构。iframe 负责提供独立的 JS 运行环境，WebComponent 的 Shadow DOM 承载子应用 DOM 并实现样式隔离。

**一句话理解**：iframe 提供原生 JS 隔离，Shadow DOM 提供原生 CSS 隔离，Wujie 用三层 Proxy 把两者桥接起来。

## 1. 整体架构

### 1.1 设计定位与能力边界

[width(28,72)]

| 问题                   | Wujie 的解法                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| 子应用怎么接入         | `<WujieVue name url>` 组件，或 `startApp` 命令式渲染                |
| JS 运行环境怎么隔离    | 同源隐藏 iframe，提供独立的 `window` / `document` / `location`      |
| 样式怎么隔离           | Shadow DOM 物理隔离，子应用样式不会外泄                             |
| 主子应用环境怎么桥接   | 三层 Proxy：`proxyWindow` / `proxyDocument` / `proxyLocation`       |
| 路由怎么同步           | 劫持 iframe 的 `history.pushState` / `replaceState`，写回主应用 URL |
| 切换后状态怎么保留     | `alive` 保活，缓存 WebComponent 与 iframe                           |
| 主应用与子应用怎么通信 | `props` / EventBus / 同源 `window` 访问                             |

- **iframe 必须同源**：Wujie 把 iframe 的 `src` 指向主应用域名，才能读写 `contentWindow`；子应用的 HTML、JS、CSS 仍然要开启 CORS。
- **Shadow DOM 是物理隔离**：好处是样式绝不互相污染；代价是弹窗、`Teleport`、全局字体和 CSS 变量需要额外处理。
- **ESM 代码无法被 IIFE 包装**：ESM 子应用的 `location` 可能指向 iframe 的真实地址，而不是 `proxyLocation`。

### 1.2 架构分层

```tree
主应用（基座）
├─ 接入层  <WujieVue> / startApp / preloadApp
│           声明 name / url / alive / sync / props
├─ 桥接层  三层 Proxy（proxyWindow / proxyDocument / proxyLocation）
│           把 iframe 的执行环境映射到主应用的 Shadow DOM
├─ 运行层  隐藏 iframe（同源）
│           提供独立 window / document / location，执行子应用 JS
└─ 渲染层  <wujie-app> Web Component + Shadow DOM
            承载子应用 DOM，提供原生 CSS 隔离
                     ↓
子应用（独立仓库 / 独立构建 / 独立部署）
  可独立运行，也可通过 window.$wujie 感知宿主环境
```

### 1.3 核心概念

[width(21,79)]

| 概念                | 说明                                                    |
| ------------------- | ------------------------------------------------------- |
| **`<wujie-app>`**   | Web Component 容器，Shadow DOM 承载子应用 DOM           |
| **隐藏 iframe**     | 同源 iframe，为子应用提供独立的 JS 执行环境             |
| **`proxyWindow`**   | 代理 iframe 的 `window`，决定全局变量读写和 `this` 指向 |
| **`proxyDocument`** | 把 `document` 的查询与操作重定向到 ShadowRoot           |
| **`proxyLocation`** | 让子应用看到自己的 URL，同时禁用会加载主应用的 `reload` |
| **`$wujie`**        | 注入 iframe 的宿主对象，包含 `props`、`bus` 等能力      |
| **`alive`**         | 保活模式，路由切走时保留 WebComponent 与 iframe         |
| **EventBus**        | 跨应用事件总线，通过全局 `appEventObjMap` 派发事件      |

### 1.4 启动与渲染全流程

```tree
startApp(config) / <WujieVue>
        ↓
new Wujie() 创建沙箱实例
├─ iframeGenerator() → 创建同源隐藏 iframe
├─ stopIframeLoading() → 中断主应用加载，获得纯净沙箱
├─ proxyGenerator() → 创建 proxyWindow / proxyDocument / proxyLocation
├─ initIframeDom() → 重建 iframe document 结构，注入 <base>
└─ patchIframeHistory() → 劫持 history.pushState / replaceState
        ↓
importHTML(url) 拉取并解析子应用入口
├─ fetch HTML（需 CORS）
├─ processTpl() → 分离 template / scripts / styles
└─ processCssLoader() → 处理样式，替换为内联 <style>
        ↓
sandbox.active() 创建 <wujie-app> + Shadow DOM
        ↓
sandbox.start() 在 iframe 中按 sync → defer → async 执行 JS
```

- **iframe 只负责执行 JS**：它被设置为 `display: none`，不承载可见 DOM；子应用 DOM 实际渲染在主应用的 Shadow DOM 中。
- **Proxy 是桥接层**：`proxyDocument` 把 `querySelector`、`createElement`、`body` 等访问重定向到 ShadowRoot，让子应用“以为”自己操作的是独立 document。
- **ESM 是例外**：非 ESM 脚本会被 IIFE 包装，`window` / `document` / `location` 都替换成 Proxy；ESM 脚本无法包装，只能依赖 `Object.defineProperty` 做有限修正。

### 1.5 资源加载与脚本执行

#### 1.5.1 HTML 解析

Wujie 使用 HTML Entry 加载子应用：先 `fetch` 入口 HTML，再把模板、脚本、样式拆开。

```js
// 拉取并解析子应用入口
async function importHTML(url) {
  const html = await fetch(url).then(res => res.text())

  // 分离 template / scripts / styles
  const { template, scripts, styles } = processTpl(html, url)

  return {
    template,
    scripts,
    styles,
  }
}
```

`processTpl` 会把 `<script>`、`<link rel="stylesheet">` 和 `<style>` 从 HTML 中摘出来，同时解析相对路径；剩下的 `template` 才是要渲染进 Shadow DOM 的结构。

#### 1.5.2 CSS 预处理

外部样式会先 `fetch` 回来，再经过 `cssLoader` 插件处理，最后替换为内联 `<style>` 插入 Shadow DOM：

```js
// 把外链样式转换为内联样式
async function processCssLoader(styles, baseUrl) {
  return Promise.all(
    styles.map(async style => {
      const css = await fetch(new URL(style.href, baseUrl)).then(res =>
        res.text(),
      )

      // 处理 url() 相对路径、:root → :host 等
      return cssLoader(css, baseUrl)
    }),
  )
}
```

#### 1.5.3 脚本执行

子应用 JS 在 iframe 中执行时，通过 IIFE 闭包把 `window` / `self` / `location` 等全局对象替换为 Proxy：

```js
// 将子应用脚本包装成 IIFE，绑定到 Proxy 沙箱对象
const code = `
  (function(window, self, global, location, history, document, eval) {
    ${scriptContent}
  }).bind(window.__WUJIE.proxy)(
    window.__WUJIE.proxy,         // window → proxyWindow
    window.__WUJIE.proxy,         // self  → proxyWindow
    window.__WUJIE.proxy,         // global → proxyWindow
    window.__WUJIE.proxyLocation, // location → proxyLocation
    window.__WUJIE.proxyLocation, // history（部分代理到 proxyLocation）
    window.__WUJIE.proxyDocument, // document → proxyDocument
    window.__WUJIE.proxyEval      // eval    → proxyEval
  );
`

// 创建 script 标签注入 iframe 执行
const script = iframeWindow.document.createElement('script')
script.textContent = code
iframeWindow.document.head.appendChild(script)
```

**为什么用闭包传参而不是 Proxy 全局劫持：**

- `window.location` 的 `configurable = false`，无法被 Proxy 的 `set` 拦截。
- 闭包内的 `window` 变量指向传入的 `proxyWindow` 实参，天然绕开了这个限制。
- ESM 代码不能包装（`import` 必须在模块顶层），因此 ESM 子应用的 `location` 仍指向真实 iframe `window`，只能靠 `Object.defineProperty` 做额外修正。

## 2. 核心 API 与配置项

对外入口可以归成四类：`startApp` 负责命令式渲染，`<WujieVue>` 负责声明式接入，`preloadApp` / `destroyApp` 负责预加载与回收，`props` / EventBus 负责数据通信。

### 2.1 手动渲染

#### 2.1.1 基本用法

`startApp` 不依赖 Vue 组件，适合原生页面、非 Vue 基座或弹窗场景：

```ts
import { startApp } from 'wujie'

const destroy = startApp({
  name: 'order',
  url: 'http://localhost:7101/',
  el: '#micro-container',
  sync: true,
  alive: true,
  props: { token: 'xxx' },
})

// 需要时手动销毁
destroy()
```

:::details startApp(极简源码)

```js
export function startApp(options) {
  const sandbox = new WuJie(options)
  sandbox.active()
  return () => sandbox.destroy()
}

class WuJie {
  active() {
    // 1. 创建同源隐藏 iframe
    this.iframe = iframeGenerator(this)

    // 2. 重建 iframe document，劫持 history
    initIframeDom(this, this.iframe)
    patchIframeHistory(this)

    // 3. 创建 <wujie-app> 与 Shadow DOM
    this.shadowRoot = createWujieWebComponent(this)

    // 4. 拉取 HTML、执行 JS
    this.start()
  }

  destroy() {
    this.unmount()
    this.iframe.remove()
    wujieMap.delete(this.id)
  }
}
```

:::

#### 2.1.2 常用选项

[width(15,18,67)]

| 选项      | 类型                    | 说明                                                      |
| --------- | ----------------------- | --------------------------------------------------------- |
| `name`    | `string`                | 子应用唯一标识，也是 props、EventBus、保活缓存的 key      |
| `url`     | `string`                | 子应用入口地址，需与预加载 / 保活实例保持一致             |
| `el`      | `string \| HTMLElement` | 挂载点，命令式渲染时必填                                  |
| `alive`   | `boolean`               | 保活模式：切换时保留 DOM 与 iframe，只做显隐              |
| `sync`    | `boolean`               | 路由同步：子应用路由变化写回主应用 URL                    |
| `props`   | `object`                | 下发给子应用的数据，子应用通过 `window.$wujie.props` 读取 |
| `attrs`   | `object`                | 透传到 `<wujie-app>` 元素上的自定义属性                   |
| `degrade` | `boolean`               | 降级模式：不走 Shadow DOM，子应用直接渲染在 iframe 内     |
| `fiber`   | `boolean`               | 在 `requestIdleCallback` 中分片执行子应用 JS              |
| `plugins` | `Array`                 | 插件数组，可在样式 / JS 加载前后注入或改写内容            |
| `fetch`   | `Function`              | 自定义资源请求实现，需与预加载时保持一致                  |

### 2.2 声明式接入

#### 2.2.1 基本用法

```vue
<!-- 主应用中嵌入子应用，开启路由同步、保活并下发 props -->
<template>
  <WujieVue
    width="100%"
    height="100%"
    name="order"
    url="http://localhost:7101/"
    :sync="true"
    :alive="true"
    :props="{ token, theme }"
    @beforeLoad="handleBeforeLoad"
    @afterMount="handleAfterMount"
  />
</template>
```

:::details wujie-app 自定义元素(极简源码)

```ts
// 注册 <wujie-app> 自定义元素
class WujieApp extends HTMLElement {
  connectedCallback() {
    // 创建 Shadow DOM：CSS 隔离的基石
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const sandbox = getWujieById(this.getAttribute('data-wujie-id'))

    // 将 ShadowRoot 关联到沙箱实例
    sandbox.shadowRoot = shadowRoot

    // 劫持 DOM 操作，让子应用的操作重定向到此处
    patchElementEffect(shadowRoot, sandbox.iframe.contentWindow)
  }

  disconnectedCallback() {
    // <wujie-app> 从 DOM 移除 → 卸载子应用
    const sandbox = getWujieById(this.getAttribute('data-wujie-id'))
    sandbox?.unmount()
  }
}

customElements.define('wujie-app', WujieApp)
```

:::

#### 2.2.2 组件属性

[width(18,18,13,51)]

| 属性      | 类型       | 默认值  | 说明                                                                   |
| --------- | ---------- | ------- | ---------------------------------------------------------------------- |
| `name`    | `string`   | —       | 子应用唯一标识，也是 `$wujie.props`、EventBus 与保活缓存的 key         |
| `url`     | `string`   | —       | 子应用入口地址，需与预加载 / 保活实例保持一致                          |
| `alive`   | `boolean`  | `false` | 保活模式：切换时保留 DOM 与 iframe，只做显隐                           |
| `sync`    | `boolean`  | `false` | 路由同步：子应用路由变化写回主应用 URL，刷新后可恢复当前位置           |
| `props`   | `object`   | `{}`    | 下发给子应用的数据，子应用通过 `window.$wujie.props` 读取              |
| `attrs`   | `object`   | `{}`    | 透传到 `<wujie-app>` 元素上的自定义属性，适合传少量静态配置            |
| `plugins` | `Array`    | `[]`    | 插件数组，可在子应用样式 / JS 加载前后注入或改写内容（埋点、SDK 注入） |
| `degrade` | `boolean`  | `false` | 降级模式：不走 Shadow DOM，子应用直接渲染在 iframe 内                  |
| `fiber`   | `boolean`  | `true`  | 在 `requestIdleCallback` 中分片执行子应用 JS，避免阻塞主应用渲染线程   |
| `fetch`   | `Function` | —       | 自定义资源请求实现（如带鉴权的 fetch），需与预加载时保持一致           |

#### 2.2.3 属性使用细节

- **`name` / `url`**：必须与 `preloadApp`、`startApp` 中使用的值完全一致，否则预加载缓存不命中，保活实例也可能被重复创建。
- **`alive`**：开启后切换路由不会销毁实例，适合多 Tab 和菜单常驻页面；但会保留子应用的全局变量、事件订阅和定时器，必须给保活实例设上限。
- **`sync`**：开启后子应用路由会写回主应用 URL，刷新页面能恢复当前位置；不开启时刷新会回到主应用默认路由。
- **`props`**：只适合传 Token、用户、主题这类低频配置。运行期频繁变化的数据应通过 EventBus 或后端 API 传递。
- **`degrade`**：浏览器不支持 Shadow DOM，或子应用必须在 iframe 内直接渲染时启用。
- **`fiber`**：大体积子应用保持开启，避免 JS 执行长时间占用主线程；如果子应用依赖 `requestIdleCallback` 的时序，可以关闭。

### 2.3 应用处理方法

#### 2.3.1 基本用法

组件方式只覆盖“**用到才加载**”，Wujie 还提供一组命令式 API，用于提前预热和彻底回收：

```ts
import { preloadApp, destroyApp } from 'wujie'

// 登录完成后空闲预热，首次打开几乎无白屏
preloadApp({
  name: 'order',
  url: 'http://localhost:7101/',
  exec: true,
})

// 退出登录、或保活实例超限时回收
destroyApp('order')
```

:::details 预加载与销毁(极简源码)

```js
export function preloadApp(options) {
  const sandbox = new WuJie({
    ...options,
    preload: true,
  })

  // exec=true 时连 JS 一起预执行
  return sandbox.preload()
}

export function destroyApp(name) {
  const sandbox = getWujieById(name)
  if (sandbox) {
    sandbox.destroy()
  }
}
```

:::

#### 2.3.2 API 速查

[width(27,40,33)]

| API                   | 作用                                                     | 高频使用时机                                 |
| --------------------- | -------------------------------------------------------- | -------------------------------------------- |
| `setupApp(options)`   | 缓存子应用默认配置，`startApp` / `preloadApp` 继承并覆盖 | 把 `url`、`props` 等公共配置抽到一处统一维护 |
| `preloadApp(options)` | 预加载子应用资源，`exec: true` 时连 JS 一起预执行        | 登录后空闲预热高频子应用，缩短首次打开白屏   |
| `startApp(options)`   | 手动渲染子应用，返回 `destroy` 函数                      | 非组件场景（原生页面、非 Vue 基座）接入      |
| `destroyApp(name)`    | 彻底销毁子应用，清空 iframe、ShadowRoot 与实例缓存       | 保活实例超上限、退出登录需要回收全部子应用时 |
| `refreshApp(name)`    | 刷新子应用，等价于销毁后重建                             | 子应用发了新版本，需要强制拉取最新资源       |

#### 2.3.3 使用注意

`preloadApp` 与 `startApp`（或 `<WujieVue>`）的 `name`、`alive`、`degrade`、`fetch`、`replace` 必须完全一致，否则预加载的缓存无法命中，甚至导致渲染异常。

### 2.4 通信 API

#### 2.4.1 Props 下发

主应用通过 `props` 向子应用注入数据，Wujie 将 props 挂载到 `window.$wujie.props`：

```ts
// 主应用
startApp({
  name: 'order',
  url: 'http://localhost:7101/',
  props: { token: 'xxx', theme: 'dark', user: { id: 1 } },
})

// 子应用
const { token, theme, user } = window.$wujie?.props || {}
```

:::details Props 注入(极简源码)

```js
// Wujie.active() 中把宿主能力注入 iframe
iframeWindow.$wujie = {
  props: sandbox.options.props || {},
  bus: sandbox.bus,
  shadowRoot: sandbox.shadowRoot,
  // 其他宿主能力
}
```

:::

#### 2.4.2 EventBus

```ts
// 主应用
import WujieVue from 'wujie-vue3'

const { bus } = WujieVue

bus.$on('user-login', user => {
  /* ... */
})
bus.$emit('theme-change', 'dark')

// 子应用
window.$wujie?.bus.$on('theme-change', theme => {
  applyTheme(theme)
})

// 组件销毁时必须手动解绑
window.$wujie?.bus.$off('theme-change', themeHandler)
```

:::details EventBus(极简源码)

```ts
type callback = (...args: any[]) => void

// EventBus 应用实例容器
const appEventObjMap = new Map<string, Record<string, callback[]>>()

class EventBus {
  id: string
  eventObj: Record<string, callback[]> = {}

  $on(event: string, fn: callback) {
    // 往 this.eventObj[event] 数组中追加回调
    if (!this.eventObj[event]) this.eventObj[event] = []
    this.eventObj[event].push(fn)
    return this
  }

  $emit(event: string, ...args: any[]) {
    // 核心：遍历全局 appEventObjMap 中所有应用的 eventObj
    // 而非仅遍历当前实例的 eventObj
    for (const eventObj of appEventObjMap.values()) {
      const fns = eventObj[event]
      if (fns) fns.forEach(fn => fn(...args))

      // 同时触发 $onAll 注册的全局监听器
      const allFns = eventObj.__ALL__
      if (allFns) allFns.forEach(fn => fn(event, ...args))
    }
    return this
  }

  $off(event: string, fn: callback) {
    // 从 this.eventObj[event] 中移除指定回调
    const fns = this.eventObj[event]
    if (fns) {
      const idx = fns.indexOf(fn)
      if (idx > -1) fns.splice(idx, 1)
    }
    return this
  }

  $clear() {
    // 清空当前实例的全部事件和回调
    this.eventObj = {}
  }
}
```

:::

#### 2.4.3 同源 window 通信

由于 iframe 的 `src` 设置为主应用域名，主应用和子应用的 iframe 处于**同源**状态，可以直接互相访问：

```ts
// 主应用 → 子应用
const iframe = document.querySelector('iframe[name="子应用id"]')
iframe.contentWindow.xxx // 直接读写子应用 iframe 的 window

// 子应用 → 主应用
window.parent.xxx // 直接读写主应用的 window
```

#### 2.4.4 通信方式怎么选

[width(22,40,38)]

| 方式                | 适用场景                              | 实现基础                         |
| ------------------- | ------------------------------------- | -------------------------------- |
| **Props**           | 主 → 子 单向传递配置、Token、用户信息 | `window.$wujie.props`            |
| **EventBus**        | 双向、跨应用、去中心化的事件通知      | `event.ts` 全局 `appEventObjMap` |
| **window 直接访问** | 极少数需要直接操作对方上下文的场景    | iframe 同源                      |

**推荐原则**：优先用 Props 传配置、EventBus 传事件、URL 传可序列化状态。尽量避免直接 `window.parent.xxx` 的访问方式。

### 2.5 路由同步

#### 2.5.1 基本用法

给组件或 `startApp` 开启 `sync`，子应用路由变化就会写回主应用 URL：

```vue
<WujieVue name="order" url="http://localhost:7101/" :sync="true" />
```

```ts
startApp({
  name: 'order',
  url: 'http://localhost:7101/',
  el: '#micro-container',
  sync: true,
})
```

:::details 路由同步(极简源码)

```ts
// 路由劫持
function patchIframeHistory(sandbox) {
  const iframeWindow = sandbox.iframe.contentWindow
  const rawPushState = iframeWindow.history.pushState
  const rawReplaceState = iframeWindow.history.replaceState

  iframeWindow.history.pushState = function (state, title, url) {
    rawPushState.call(this, state, title, url)
    syncUrlToWindow(sandbox) // 子应用路由变化 → 同步到主应用 URL query
  }

  iframeWindow.history.replaceState = function (state, title, url) {
    rawReplaceState.call(this, state, title, url)
    syncUrlToWindow(sandbox) // 同上
  }
}
```

:::

#### 2.5.2 同步链路

```tree
子应用内调用 history.pushState("/detail")
        ↓ patchIframeHistory 拦截
syncUrlToWindow() → 主应用 URL 变为 /order?wujie=...（含子应用路径）
        ↓ 用户刷新页面
主应用读取 URL query 参数
        ↓ syncUrlToIframe()
子应用通过 history.replaceState 恢复到 /detail

浏览器前进 / 后退按钮
        ↓ popstate / hashchange 事件
joint session history 自动作用
        ↓ 监听后同步主子应用 URL
```

#### 2.5.3 使用注意

- 路由同步依赖主应用 URL query，刷新后要能从 query 中恢复子应用路径。
- 主应用和子应用的一级路径前缀要错开，例如主应用 `/order`、子应用 `/order/detail`，避免路由抢占。
- iframe 内的 `location.reload` 会加载主应用页面，Wujie 已经禁用它；子应用需要刷新时调用 `refreshApp`。

### 2.6 保活模式

#### 2.6.1 基本用法

```vue
<!-- 最简用法：name + url，:alive 开启保活 -->
<WujieVue name="order" url="http://localhost:7101/" :alive="true" />
```

:::details 保活(极简源码)

```js
// 路由切走时的处理
function handleRouteLeave(sandbox) {
  if (sandbox.options.alive) {
    // 保活：隐藏 WebComponent 与 iframe，保留实例和状态
    sandbox.cache()
  } else {
    // 非保活：卸载 DOM，销毁实例
    sandbox.unmount()
  }
}
```

:::

#### 2.6.2 模式对比

[width(32,44,24)]

| 模式                           | 行为                                                            | 适用场景           |
| ------------------------------ | --------------------------------------------------------------- | ------------------ |
| **保活模式**（`alive: true`）  | 切换时保留 WebComponent + iframe，只做隐藏 / 显示               | 高频切换的 Tab 页  |
| **单例模式**（`alive: false`） | 保留 iframe，切换时销毁 / 重建子应用实例                        | 一般页面切换       |
| **重建模式**                   | 每次彻底销毁 iframe 和 WebComponent，重新走完整 `startApp` 流程 | 低频页面、内存敏感 |

#### 2.6.3 使用注意

保活会保留子应用的全局变量、事件订阅和定时器。如果子应用的 `unmount` 中未清理全局副作用，保活后重新挂载可能出现重复监听、定时器叠加等问题。建议给保活实例设置上限（3–5 个），超出后配合路由守卫按 LRU 策略回收。

## 3. 沙箱与隔离

### 3.1 JS 沙箱类型

Wujie 使用 iframe 提供 JS 隔离，这一点和 qiankun 的 Proxy 沙箱有本质区别：

[width(14,42,44)]

| 对比维度 | iframe 沙箱（Wujie）                                                | Proxy 沙箱（qiankun）                  |
| -------- | ------------------------------------------------------------------- | -------------------------------------- |
| 隔离原理 | 浏览器原生隔离，独立 `window` / `document` / `history` / `location` | Proxy 劫持全局变量读写，快照 / 恢复    |
| 隔离强度 | 物理级，天然完备                                                    | 逻辑级，需穷举全部全局变量             |
| 多实例   | 天然支持，无额外成本                                                | 快照沙箱不支持多实例；Proxy 沙箱需多份 |
| 性能     | 无 `with` / `eval`，应用切换无清理开销                              | `with` 包裹有性能损耗                  |
| ESM 兼容 | 原生支持                                                            | 需借助构建工具或额外转换               |

### 3.2 iframe 创建

```ts
// 创建隐藏 iframe：同源沙箱 + 独立执行环境
function iframeGenerator(sandbox: WuJie) {
  const iframe = document.createElement('iframe')

  // 关键设计 1：src 设置为主应用域名，实现同源
  // 同源意味着主应用可读写 iframe.contentWindow / document
  // 也意味着子应用资源必须配置 CORS（资源域名 ≠ 主应用域名）
  const url = sandbox.mainHostPath || window.location.origin
  iframe.setAttribute('src', url)

  // 隐藏 iframe：用户看不到它，它只负责执行 JS
  iframe.style.cssText = 'display: none; width: 0; height: 0;'
  document.body.appendChild(iframe)

  const iframeWindow = iframe.contentWindow as any

  // 关键设计 2：停止 iframe 自动加载
  // iframe.src 指向主应用域名 → 浏览器会加载主应用的 HTML / JS
  // stopIframeLoading 调用 iframeWindow.stop() 中断加载
  // 避免主应用全局变量污染 iframe 沙箱
  stopIframeLoading(iframeWindow)

  // 注入无界标识变量
  iframeWindow.__WUJIE = sandbox.id
  iframeWindow.__POWERED_BY_WUJIE__ = true

  // 初始化 iframe DOM 结构、劫持 history、修正副作用
  initIframeDom(sandbox, iframeWindow)

  return iframeWindow
}
```

### 3.3 Proxy 三层代理

`proxy.ts` 导出 `proxyGenerator()`，在 `Wujie` 类实例化时调用，返回 `{ proxyWindow, proxyDocument, proxyLocation }`。这三层 Proxy 是整个沙箱的神经中枢——它将 iframe 的 JS 执行环境与主应用 Shadow DOM 的渲染环境连接起来。

#### 3.3.1 proxyWindow

对 `iframe.contentWindow` 做 `new Proxy(target, { get, set, ownKeys })`：

```ts
let proxyWindow: Window

proxyWindow = new Proxy(iframeWindow, {
  get(target, propKey) {
    // 逃生通道：子应用可通过 __WUJIE_RAW_WINDOW__ 访问原始 iframe window
    if (propKey === '__WUJIE_RAW_WINDOW__') return target

    // 访问 window / self / top → 返回 proxy 自身（形成闭环）
    if (propKey === 'window' || propKey === 'self') return proxyWindow

    // 事件处理器（onclick 等）→ 返回 iframe 原始值
    if (isOnEvent(propKey)) return target[propKey]

    // 默认：从 iframe.contentWindow 原型链上查找并修正 this 指向
    return getTargetValue(target, propKey)
  },

  set(target, propKey, value) {
    // 直接设置到原始 iframe.contentWindow
    target[propKey] = value
    return true
  },
})
```

`getTargetValue()` 的核心逻辑：从 `iframe.contentWindow` 及其原型链上查找属性值。如果找到的是函数，用 `Function.prototype.bind` 把 `this` 绑定到原始 `iframe.contentWindow`，确保函数在正确的上下文中执行。

#### 3.3.2 proxyDocument

对 `document` 的查询和操作方法进行劫持，把 DOM 操作从 iframe 上下文**重定向到 WebComponent 的 ShadowRoot**：

```ts
// 对空对象做 Proxy — 所有属性访问都走 get 拦截
const proxyDocument = new Proxy(
  {},
  {
    get(_, propKey) {
      // createElement / createTextNode → 在 iframe 内创建，再 patch 关联到 Shadow DOM
      if (propKey === 'createElement' || propKey === 'createTextNode') {
        return new Proxy(rawCreateElement, {
          apply(target, ctx, args) {
            const el = target.apply(iframeDoc, args)
            patchElementEffect(el, iframeWindow)
            return el
          },
        })
      }

      // querySelector / querySelectorAll → 查询重定向到 Shadow DOM
      if (propKey === 'querySelector' || propKey === 'querySelectorAll') {
        return new Proxy(shadowRoot[propKey], {
          apply(target, ctx, args) {
            return target.apply(shadowRoot, args)
          },
        })
      }

      // getElementById → 先查 shadowRoot，再 fallback 到 iframe document
      if (propKey === 'getElementById') {
        /* ... */
      }

      // getElementsByClassName / getElementsByTagName / getElementsByName → 重定向到 shadowRoot
      // document.body / head → 返回 shadowRoot 中的对应节点
      // document.cookie / domain / referrer → 返回主应用 document 的原生属性
    },
  },
)
```

[width(56,22,22)]

| 属性 / 方法类别                                                                                                                   | 重定向到                                       | 原因                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `querySelector` / `querySelectorAll` / `getElementById` / `getElementsByClassName` / `getElementsByTagName` / `getElementsByName` | **ShadowRoot**                                 | 子应用查询 DOM 应找到自己渲染的节点     |
| `createElement` / `createTextNode`                                                                                                | **iframe document** 创建 → patch 到 ShadowRoot | 创建在 iframe 上下文，渲染在 Shadow DOM |
| `body` / `head` / `activeElement` / `documentElement`                                                                             | **ShadowRoot**                                 | 反映子应用实际的 DOM 结构               |
| `cookie` / `domain` / `referrer` / `title`                                                                                        | **主应用 document**                            | 应反映主应用状态，而非 iframe           |
| `addEventListener` / `removeEventListener`                                                                                        | **主应用 document**                            | 事件冒泡在主应用 DOM 树中               |

#### 3.3.3 proxyLocation

劫持 `location` 对象，让子应用感知到的是自己的 URL，而不是 iframe 的主应用 URL：

```ts
// proxyLocation：把 iframe 的真实 location 映射为子应用域名
const proxyLocation = new Proxy(
  {},
  {
    get(_, propKey) {
      if (propKey === 'href') {
        // 把主应用域名替换回子应用域名
        return location.href.replace(mainHostPath, appHostPath)
      }
      if (propKey === 'host' || propKey === 'hostname') {
        return urlElement[propKey]
      }
      if (propKey === 'reload') {
        // 禁止 reload — iframe 内 reload 会加载主应用页面
        console.warn('WUJIE: location.reload is disabled')
        return () => null
      }
      if (propKey === 'replace') {
        // 代理 replace：将子应用域名还原为主应用域名后执行
        return new Proxy(location.replace, {
          apply(_, __, args) {
            args[0] = args[0]?.replace(appHostPath, mainHostPath)
            return location.replace(args[0])
          },
        })
      }
      // 其他属性 → 从真实 location 查找
      return getTargetValue(location, propKey)
    },
  },
)
```

**proxyLocation 设计要点：** 利用 `location.configurable = false`（无法通过 `Object.defineProperty` 劫持）这一限制，通过函数闭包传参来实现对 `location` 的劫持——在 IIFE 执行时把 `proxyLocation` 作为参数传入。

### 3.4 DOM 副作用修正

`initIframeDom()` 和 `patchElementEffect()` 中还做了大量 DOM 操作劫持，确保子应用的 DOM 操作正确路由到 Shadow DOM：

[width(42,58)]

| 劫持方法                                              | 处理逻辑                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `appendChild` / `insertBefore`                        | 若目标为 `document.head` 或 `document.body`，重定向到 Shadow DOM 对应节点 |
| `removeChild`                                         | 同时在 iframe document 和 Shadow DOM 中移除                               |
| `<script>` 元素插入                                   | 提取脚本内容，注入到 iframe 中执行（而非在 Shadow DOM 中执行）            |
| `<style>` / `<link>` 元素插入                         | 将样式挂载到 Shadow DOM                                                   |
| `baseURI` / `ownerDocument`                           | 修正为子应用 URL / Shadow DOM 所属 document                               |
| 相对路径资源（`img` / `link` / `script` 的 src/href） | 修正为子应用的绝对路径                                                    |

### 3.5 CSS 隔离

#### 3.5.1 CSS 处理流程

```tree
子应用 HTML 入口
        ↓ importHTML() — fetch + 解析
分离出 <link> 和 <style>
        ↓ processCssLoader()
外部样式表 → fetch → cssLoader 插件处理
        ↓
替换为内联 <style> 标签
        ↓ renderTemplateToShadowRoot()
内联样式插入 Shadow DOM
        ↓
Shadow DOM 原生样式隔离
子应用样式 ✅ 不影响主应用，也不受主应用影响
```

#### 3.5.2 CSS 特殊处理

[width(38,62)]

| 处理场景                           | 方式                                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| `:root` 选择器                     | 转换为 `:host`（Shadow DOM 的根选择器）                          |
| `@font-face`                       | 单独提取注入，确保字体在 Shadow DOM 中生效                       |
| 样式中的 `url()` 相对路径          | 修正为子应用的绝对路径                                           |
| UI 弹窗组件（如 Ant Design Modal） | `document.body.appendChild` 被劫持，弹窗实际挂载到 Shadow DOM 内 |

#### 3.5.3 降级模式

当浏览器不支持 `Proxy` 或不支持 `Shadow DOM` 时，Wujie 降级为 `Object.defineProperties` 方案：

- `proxyWindow` / `proxyDocument` / `proxyLocation` 改用 `Object.defineProperties` 实现。
- 子应用 DOM 直接渲染在 iframe 内部，而非 Shadow DOM。
- 通过 `{ degrade: true }` 也可以主动启用降级模式。

## 4. 子应用构建与接入

### 4.1 主应用接入

```ts
// main.ts：注册 wujie-vue3 插件
import { createApp } from 'vue'
import WujieVue from 'wujie-vue3'
import App from './App.vue'

createApp(App).use(WujieVue).mount('#app')
```

### 4.2 CORS 配置

子应用的 HTML、JS、CSS 都要允许主应用跨域拉取：

```js
// Vite 开发环境
export default defineConfig({
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
```

```nginx
# 生产环境 Nginx
location /order/ {
  add_header Access-Control-Allow-Origin "https://main.example.com";
}
```

### 4.3 子应用环境感知

多数情况下子应用无需改造，能独立访问即可。如需感知 Wujie 环境：

```ts
// 子应用内：判断是否由无界加载，并读取主应用 props
const isInWujie = Boolean(window.__POWERED_BY_WUJIE__)

if (isInWujie) {
  const props = window.$wujie?.props
  console.log(props?.token)
}
```

### 4.4 接入与落地检查清单

[width(16,15,69)]

| 设计维度      | 核心目标                 | 落地关键点与建议                                                                                                                                                                                                                 |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **保活策略**  | 极致性能与状态还原       | **定义 `alive` 列表**：避免全局保活导致内存溢出；**设置保活上限**：建议单次不超过 3–5 个实例，超出后配合路由守卫采用 LRU（最近最少使用）策略自动销毁最旧的实例。                                                                 |
| **路由同步**  | 主子应用路由解耦         | **一级前缀分配**：基座与子应用路由划分明确的命名空间（如 `/erp/*`）；**Query 同步**：在子应用的 Vue 3 `setup` 顶层或状态管理中监听 `window.$wujie.props` 变化，实现基座 Query 参数到子应用内部状态的双向同步。                   |
| **弹窗挂载**  | 避免 UI 组件遮罩层异常   | **Portal 容器化**：配置 UI 组件库（如 Vue 3 的 Element Plus 提供的 `append-to` 或 Ant Design Vue 的 `getPopupContainer`），强制将弹窗挂载到 `document.body` 或指定的 `wujie-app` 内部，打破 Shadow DOM 的物理隔离边界限制。      |
| **事件解绑**  | 防止内存泄漏与副作用残留 | **生命周期清理**：在子应用组件的 `onBeforeUnmount` 阶段，必须显式调用 `window.$wujie.bus.$off` 清理绑定的事件总线，同时清理全局 `document` 上的定时器与事件监听，避免在重复唤醒时引发多次执行。                                  |
| **CORS 配置** | 确保跨域资源加载成功     | **开发环境**：子应用的 `vite.config.ts` 中务必开启 `server.cors: true`；**生产环境**：Nginx 服务器或 CDN 的响应头需严格配置 `Access-Control-Allow-Origin: <基座域名>`，杜绝使用 `*` 以保证安全，并确保多环境的配置策略完全一致。 |

## 5. 应用场景

### 5.1 典型接入场景

[width(20,42,38)]

| 场景                            | 为什么适合 Wujie                                                    | 关键配置                                             |
| ------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| **React 基座 + Vue 子应用混用** | iframe 提供独立 JS 运行时，两套框架的全局变量与路由互不干扰         | `alive: true` 保留子应用状态；`props` 传用户与主题   |
| **老 jQuery / 多页应用接入**    | 子应用无需改造，能独立打开就能接入；Shadow DOM 兜住老页面的全局样式 | `degrade: true` 兼容不支持 Shadow DOM 的环境         |
| **Vite / 原生 ESM 子应用**      | iframe 原生支持 ESM，不需要构建期适配插件                           | 子应用只需开启 CORS：`server.cors: true`             |
| **多 Tab 中后台**               | 每个 Tab 一个 `<WujieVue>`，配合保活避免切回时重新加载              | 保活实例设上限（3–5 个），超出时用 `destroyApp` 回收 |
| **要求极致样式隔离的系统**      | Shadow DOM 天生隔绝主子应用 CSS，老系统的全局样式也污染不到基座     | 弹窗统一配 `getPopupContainer`，注意穿透 Shadow DOM  |

### 5.2 Wujie vs Micro-app

Wujie 和 Micro-app 都支持“子应用零改造 + iframe 运行时”，但两者对 DOM 的桥接方式、样式隔离策略和路由模型的选择不同。下面的对比以 Micro-app v1.0+ 的 iframe 模式为参照。

#### 5.2.1 能力对比

[width(14,47,39)]

| 对比维度         | 无界（Wujie）                                                                        | micro-app（v1.0+ iframe 模式）                                                             |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **运行时载体**   | 隐藏 iframe 执行 JS；`<wujie-app>` 的 Shadow DOM 承载 DOM                            | 隐藏 iframe 执行 JS；`<micro-app>` 容器承载 DOM（可选 Shadow DOM）                         |
| **DOM 归属**     | 主文档中的 ShadowRoot                                                                | 主文档中的 micro-app 容器；开启 `shadowDOM` 时才是 ShadowRoot                              |
| **DOM 查询**     | `proxyDocument` 把 `querySelector` / `querySelectorAll` 等直接指向 ShadowRoot        | `patchDocument` 把查询范围限定在 micro-app 容器内                                          |
| **节点创建**     | 在 iframe document 创建节点，再由 `patchElementEffect` 把后续操作重定向到 ShadowRoot | 节点创建和挂载都落到主文档的 micro-app 容器                                                |
| **DOM 方法劫持** | 原型重写 + `bind` + `patchElementEffect`                                             | Element Patch（重写 Element 原型方法）+ 容器查询范围                                       |
| **事件流**       | 事件在主文档的 Shadow DOM 树中冒泡，存在 Shadow DOM 事件重定向                       | 事件在主文档的普通容器中冒泡，边界更接近原生                                               |
| **样式隔离**     | 默认 Shadow DOM（物理级隔离）；`degrade` 时退回 iframe 内渲染                        | 默认 Scoped CSS 前缀（逻辑级隔离）；可选 Shadow DOM                                        |
| **UI 弹窗兼容**  | **较差**：`document.body.appendChild` 被重定向进 ShadowRoot，需手动配置挂载容器      | **较好**：默认没有物理边界，弹窗可自然挂到 `document.body`；开启 Shadow DOM 后同样需要处理 |
| **路由实现**     | 拦截 iframe 的 `history.pushState` / `replaceState`，与主应用 URL 双向同步           | 虚拟路由系统，按 `router-mode` 管理每个应用的路由状态                                      |
| **路由模式**     | 无显式模式，核心是 `sync` 开关                                                       | `search` / `state` / `native` / `native-scope` / `pure`                                    |
| **多实例路由**   | 每个 iframe 有独立 history，天然隔离；主 URL 只能镜像当前激活实例                    | 虚拟路由按 `appName` 管理，多实例并存更自然                                                |
| **刷新恢复**     | 主应用从 URL 读取子应用路径，再同步回 iframe                                         | 按 `router-mode` 解码；`search` / `state` / `native` 各有恢复方式                          |
| **ESM 支持**     | iframe 原生支持 ESM，但 ESM 代码无法被 IIFE 包装，`location` 代理不完整              | iframe 模式下原生支持 ESM；Vite 子应用接入成本较低                                         |
| **接入成本**     | 子应用零改造，开启 CORS 即可                                                         | 子应用零侵入，开启 CORS 即可                                                               |
| **设计哲学**     | 物理隔离优先，边界清晰、规则明确                                                     | 兼容与工程化优先，在旧有沙箱体系上渐进增强                                                 |

#### 5.2.2 DOM 桥接原理

两者的 JS 都跑在隐藏 iframe 里，差别在于 DOM 最终落在哪里，以及 `document` 的查询和写操作怎么被重定向。

[width(20,47,33)]

| 桥接环节            | Wujie                                                                         | micro-app                                         |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| **JS 执行环境**     | 隐藏 iframe                                                                   | 隐藏 iframe                                       |
| **DOM 承载位置**    | `<wujie-app>` 的 ShadowRoot                                                   | `<micro-app>` 容器（可选 ShadowRoot）             |
| **document 查询**   | `proxyDocument` 把 `querySelector` / `querySelectorAll` 等直接指向 ShadowRoot | `patchDocument` 把查询范围限定在 micro-app 容器内 |
| **节点创建**        | 在 iframe document 创建节点，`patchElementEffect` 给节点打补丁                | 在主文档的 micro-app 容器中创建节点               |
| **DOM 写操作**      | `appendChild` / `insertBefore` 等重定向到 ShadowRoot                          | Element Patch 重写 Element 原型方法，落到容器     |
| **`body` / `head`** | 返回 ShadowRoot 中的对应节点                                                  | 映射到 micro-app 容器内的对应节点                 |
| **事件流**          | 主文档 Shadow DOM 树，存在 Shadow DOM 事件重定向                              | 主文档普通 DOM 树，边界接近原生                   |
| **最终效果**        | 物理隔离强，弹窗需要适配                                                      | 兼容性好，默认逻辑隔离                            |

#### 5.2.3 影响面

[width(11,44,45)]

| 影响面         | Wujie                                                                                       | micro-app                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **隔离强度**   | 默认用 Shadow DOM 形成物理边界，主/子应用样式互不穿透                                       | 默认 Scoped CSS 前缀，逻辑隔离；第三方样式可能需要 `scopecss-disable` 放行      |
| **弹窗与浮层** | `document.body.appendChild` 被重定向进 ShadowRoot，需配置 `getPopupContainer` / `append-to` | 默认无物理边界，弹窗可自然挂到 `document.body`；开启 `shadowDOM` 后同样需要处理 |
| **UI 库共存**  | 原型重写更激进，依赖 `document` / `body` 的库需要逐个验证                                   | Element Patch 范围更收敛，普通 UI 库通常可以直接运行                            |

#### 5.2.4 路由系统

路由是两者差异最大的部分：Wujie 让子应用继续用自己的 router，只做 URL 同步；Micro-app 则在框架层维护一套虚拟路由。

[width(15,43,42)]

| 对比维度       | Wujie                                                                      | micro-app                                                            |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **设计模型**   | 子应用原生 history + 主应用 URL 镜像                                       | 框架层虚拟路由 + 可配置的状态位置                                    |
| **路由状态**   | iframe 自己的 history；主应用 URL 保存镜像                                 | 按 `appName` 维护，位置由 `router-mode` 决定                         |
| **URL 同步**   | `patchIframeHistory` 拦截 `pushState` / `replaceState` → `syncUrlToWindow` | 虚拟路由统一处理，子应用通过 `__MICRO_APP_BASE_ROUTE__` 对齐基础路径 |
| **刷新恢复**   | 主应用读取 URL → `syncUrlToIframe` 恢复                                    | 按 `router-mode` 解码；`search` / `state` / `native` 各有恢复方式    |
| **多实例**     | 每个 iframe 独立 history；主 URL 只能镜像当前激活实例                      | 按 `appName` 管理，多实例并存更自然                                  |
| **子应用改造** | 几乎不用改，继续使用自己的 router                                          | 基本不用改，配置基础路径即可                                         |
| **主要风险**   | URL 编码约定；ESM `location` 代理不完整；`reload` 被禁用                   | 模式选择影响分享 / 刷新；`search` 模式的 URL 会有 `?/` 前缀          |
| **适用场景**   | 单实例、路由简单、追求接近原生                                             | 多实例、需要可配置的 URL 策略、Vite / ESM 子应用                     |

## 6. 常见问题（FAQ）

### 6.1 弹窗层级不符合预期怎么办？

弹窗被挂载到了 Shadow DOM 内部，而不是 `document.body`。检查 UI 组件库的 `getPopupContainer`（或 `append-to`）配置，把弹层挂到约定容器上。

### 6.2 页面内存持续增长怎么办？

多半是保活模式下没有清理全局副作用。检查定时器、事件订阅与 WebSocket，在子应用失活或销毁时释放。

### 6.3 子应用刷新后状态丢失怎么办？

没有配置路由同步。给`<WujieVue>`加上`:sync="true"`,并把需要跨刷新保留的关键状态放进 URL 或后端。

### 6.4 跨域资源加载失败怎么办？

子应用服务没有配置 CORS。开发环境在 Vite 中开启 `server.cors: true`，生产环境由 Nginx 或 CDN 返回正确的 `Access-Control-Allow-Origin`。

### 6.5 预加载没有生效、首次打开仍然白屏怎么办？

`preloadApp` 与 `startApp` 的 `name` / `alive` / `degrade` / `fetch` 必须完全一致，否则缓存不命中；需要立即执行时再加 `exec: true`。

### 6.6 iframe 环境下 `location` 不正确、空闲回调不触发怎么办？

ESM 代码无法被包装成 IIFE，`location` 指向 iframe 的真实 location 而非 `proxyLocation`；`requestIdleCallback` 在 iframe 中可能延迟或不触发，嵌套场景可以关闭 `fiber`。
