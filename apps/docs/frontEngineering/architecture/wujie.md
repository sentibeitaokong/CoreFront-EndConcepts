# Wujie 微前端方案

Wujie（无界）是腾讯出品的微前端框架，核心采用 **WebComponent + iframe** 架构。iframe 负责提供独立的 JS 运行环境，WebComponent 的 Shadow DOM 承载子应用 DOM 并实现样式隔离，两者之间通过三层 Proxy 代理系统桥接——这是理解 Wujie 全部设计的关键。

## 1. 整体架构

```markdown
主应用页面
↓
<wujie-app> Web Component 容器（Shadow DOM 承载子应用 DOM + CSS 隔离）
↓
隐藏 iframe（提供独立 window/document/location，执行子应用 JS）
↓
三层 Proxy（proxyWindow / proxyDocument / proxyLocation）桥接 iframe → Shadow DOM
```

## 2. 渲染流程

```markdown
startApp(config)
│
├─ 1. new Wujie() — 创建沙箱实例
│ ├─ iframeGenerator() → 创建隐藏 iframe，src 指向主应用域名（同源）
│ ├─ stopIframeLoading() → 阻止 iframe 加载主应用 JS，获得纯净沙箱
│ ├─ proxyGenerator() → 创建 proxyWindow/Document/Location 三层代理
│ ├─ initIframeDom() → 重建 iframe document 结构，注入 <base> 标签
│ └─ patchIframeHistory() → 劫持 history.pushState/replaceState
│
├─ 2. importHTML(url) — 获取并解析子应用入口
│ ├─ fetch(entry) → 请求子应用 HTML（需 CORS）
│ ├─ processTpl() → 分离 template / scripts / styles
│ ├─ getExternalScripts() → 收集所有 <script>（区分 sync/defer/async）
│ └─ getExternalStyleSheets() → 收集所有 <link> 和 <style>
│
├─ 3. processCssLoader() — CSS 预处理
│ └─ 外部样式 fetch 回来 → 经 cssLoader 插件处理 → 替换为内联 <style>
│
├─ 4. sandbox.active() — 激活并渲染 DOM
│ ├─ createWujieWebComponent() → 创建 <wujie-app> 元素插入容器
│ ├─ connectedCallback() → attachShadow({ mode: "open" }) 创建 Shadow DOM
│ ├─ patchElementEffect() → 劫持 DOM 操作方法，重定向到 Shadow DOM
│ └─ renderTemplateToShadowRoot() → 将处理后的 HTML 渲染到 Shadow DOM
│
└─ 5. sandbox.start() — 执行 JS
├─ 按 sync → defer → async 排序构建执行队列
├─ 非 ESM 代码包装为 IIFE 闭包：其中 window/self/location 绑定到 Proxy 对象
└─ insertScriptToIframe() → 逐个注入到 iframe 中执行
```

## 3. JS 沙箱机制

### 3.1 iframe VS Proxy 沙箱

| 对比维度 | iframe 沙箱（Wujie）                                          | Proxy 沙箱（qiankun）                  |
| -------- | ------------------------------------------------------------- | -------------------------------------- |
| 隔离原理 | 浏览器原生隔离，独立 `window`/`document`/`history`/`location` | Proxy 劫持全局变量读写，快照/恢复      |
| 隔离强度 | 物理级，天然完备                                              | 逻辑级，需穷举全部全局变量             |
| 多实例   | 天然支持，无额外成本                                          | 快照沙箱不支持多实例；Proxy 沙箱需多份 |
| 性能     | 无 `with`/`eval`，应用切换无清理开销                          | `with` 包裹有性能损耗                  |
| ESM 兼容 | 原生支持                                                      | 需借助构建工具或额外转换               |

iframe 的核心代价是：每个子应用需要额外的 iframe 内存开销，且跨上下文调试比单页面复杂。

### 3.2 iframe 创建

```ts
// 核心流程（iframe.ts）
function iframeGenerator(sandbox: WuJie) {
  const iframe = document.createElement('iframe')

  // ★ 关键设计1: src 设置为主应用域名，实现同源
  // 同源意味着：主应用可读写 iframe.contentWindow/document
  // 同时也意味着：子应用资源必须配置 CORS（资源域名 ≠ 主应用域名）
  const url = sandbox.mainHostPath || window.location.origin
  iframe.setAttribute('src', url)

  // 隐藏 iframe — 用户看不到它，它只负责执行 JS
  iframe.style.cssText = 'display: none; width: 0; height: 0;'

  document.body.appendChild(iframe)

  // ★ 关键设计2: 停止 iframe 自动加载
  // iframe.src 指向主应用域名 → 浏览器会加载主应用的 HTML/JS
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
// 核心 get 拦截逻辑
get(target, propKey) {
  // 逃生通道：子应用可通过 __WUJIE_RAW_WINDOW__ 访问原始 iframe window
  if (propKey === "__WUJIE_RAW_WINDOW__") return target

  // 访问 window/self/top → 返回 proxy 自身（形成闭环）
  if (propKey === "window" || propKey === "self") return proxy

  // 事件处理器（onclick 等）→ 返回 iframe 原始值
  if (isOnEvent(propKey)) return target[propKey]

  // 默认：从 iframe.contentWindow 原型链上查找并修正 this 指向
  return getTargetValue(target, propKey)
}

set(target, propKey, value) {
  // 直接设置到原始 iframe.contentWindow
  target[propKey] = value
  return true
}
```

`getTargetValue()` 的核心逻辑：从 `iframe.contentWindow` 及其原型链上查找属性值。如果找到的是函数，用 `Function.prototype.bind` 将 `this` 绑定到原始 `iframe.contentWindow`，确保函数在正确的上下文中执行。

#### 3.3.2 proxyDocument

**这是最核心的代理**——对 `document` 的查询和操作方法进行劫持，将 DOM 操作从 iframe 上下文**重定向到 WebComponent 的 ShadowRoot**：

```ts
// 对空对象做 Proxy — 所有属性访问都走 get 拦截
const proxyDocument = new Proxy(
  {},
  {
    get(_, propKey) {
      // createElement/createTextNode → 在 iframe 内创建，再 patch 关联到 Shadow DOM
      if (propKey === 'createElement' || propKey === 'createTextNode') {
        return new Proxy(rawCreateElement, {
          apply(target, ctx, args) {
            const el = target.apply(iframeDoc, args) // iframe 内创建
            patchElementEffect(el, iframeWindow) // patch：将后续 DOM 操作重定向
            return el
          },
        })
      }

      // querySelector/querySelectorAll → ★ 查询重定向到 Shadow DOM
      if (propKey === 'querySelector' || propKey === 'querySelectorAll') {
        return new Proxy(shadowRoot[propKey], {
          apply(target, ctx, args) {
            return target.apply(shadowRoot, args) // 从 shadowRoot 查询
          },
        })
      }

      // getElementById → 先查 shadowRoot，再 fallback 到 iframe document
      if (propKey === 'getElementById') {
        /* ... */
      }

      // getElementsByClassName/getElementsByTagName/getElementsByName → 重定向到 shadowRoot
      // document.body/head → 返回 shadowRoot 中的对应节点
      // document.cookie/domain/referrer → 返回主应用 document 的原生属性
    },
  },
)
```

**重定向决策表：**

| 属性/方法类别                                                                                                                     | 重定向到                                       | 原因                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `querySelector` / `querySelectorAll` / `getElementById` / `getElementsByClassName` / `getElementsByTagName` / `getElementsByName` | **ShadowRoot**                                 | 子应用查询 DOM 应找到自己渲染的节点     |
| `createElement` / `createTextNode`                                                                                                | **iframe document** 创建 → patch 到 ShadowRoot | 创建在 iframe 上下文，渲染在 Shadow DOM |
| `body` / `head` / `activeElement` / `documentElement`                                                                             | **ShadowRoot**                                 | 反映子应用实际的 DOM 结构               |
| `cookie` / `domain` / `referrer` / `title`                                                                                        | **主应用 document**                            | 应反映主应用状态，而非 iframe           |
| `addEventListener` / `removeEventListener`                                                                                        | **主应用 document**                            | 事件冒泡在主应用 DOM 树中               |

#### 3.3.3 proxyLocation

劫持 `location` 对象，让子应用感知到的是自己的 URL 而非 iframe 的主应用 URL：

```ts
const proxyLocation = new Proxy(
  {},
  {
    get(_, propKey) {
      if (propKey === 'href') {
        // 把主应用域名替换回子应用域名
        return location.href.replace(mainHostPath, appHostPath)
      }
      if (propKey === 'host' || propKey === 'hostname') {
        return urlElement[propKey] // 返回子应用的 host/hostname
      }
      if (propKey === 'reload') {
        // ★ 禁止 reload — iframe 内 reload 会加载主应用页面
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

**proxyLocation 设计要点：** 利用 `location.configurable = false`（无法通过 `Object.defineProperty` 劫持）这一限制，通过函数闭包传参来实现对 `location` 的劫持——在 IIFE 执行时将 `proxyLocation` 作为参数传入。

### 3.4 JS 脚本执行

子应用的 JS 在 iframe 中执行时，通过 IIFE 闭包将 `window`/`self`/`location` 等全局对象替换为 Proxy 对象：

```js
// sandbox.ts 中 execScript 的核心逻辑
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

**为什么用闭包传参而非 Proxy 全局劫持：**

- `window.location` 的 `configurable = false`，无法被 Proxy 的 `set` 拦截
- 闭包内的 `window` 变量指向传入的 `proxyWindow` 实参，自然就绕开了这个限制
- ESM 代码无法包装（`import` 必须在模块顶层），因此 ESM 模块中 `window` 仍指向真实 iframe `window`，但 `document` 和 `location` 在 `sandbox.start()` 期间通过 `Object.defineProperty` 做了额外处理

### 3.5 DOM 副作用修正

`initIframeDom()` 和 `patchElementEffect()` 中还做了大量 DOM 操作劫持，确保子应用的 DOM 操作正确路由到 Shadow DOM：

| 劫持方法                                          | 处理逻辑                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `appendChild` / `insertBefore`                    | 若目标为 `document.head` 或 `document.body`，重定向到 Shadow DOM 对应节点 |
| `removeChild`                                     | 同时在 iframe document 和 Shadow DOM 中移除                               |
| `<script>` 元素插入                               | 提取脚本内容，注入到 iframe 中执行（而非在 Shadow DOM 中执行）            |
| `<style>` / `<link>` 元素插入                     | 将样式挂载到 Shadow DOM                                                   |
| `baseURI` / `ownerDocument`                       | 修正为子应用 URL / Shadow DOM 所属 document                               |
| 相对路径资源（`img`/`link`/`script` 的 src/href） | 修正为子应用的绝对路径                                                    |

## 4. CSS 沙箱与 WebComponent

### 4.1 WebComponent 定义

```ts
// shadow.ts — 注册 <wujie-app> 自定义元素
class WujieApp extends HTMLElement {
  connectedCallback() {
    // 创建 Shadow DOM — 这是 CSS 隔离的基石
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const sandbox = getWujieById(this.getAttribute('data-wujie-id'))

    // 将 ShadowRoot 关联到沙箱实例
    sandbox.shadowRoot = shadowRoot

    // 劫持 DOM 操作方法，使后续子应用的 DOM 操作重定向到此处
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

`connectedCallback` 和 `disconnectedCallback` 是 WebComponent 的生命周期钩子——前者在元素插入 DOM 时触发（创建 Shadow DOM + 关联沙箱），后者在元素移除时触发（卸载子应用）。

### 4.2 CSS 处理流程

```markdown
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

### 4.3 CSS 隔离的特殊处理

| 处理场景                           | 方式                                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| `:root` 选择器                     | 转换为 `:host`（Shadow DOM 的根选择器）                          |
| `@font-face`                       | 单独提取注入，确保字体在 Shadow DOM 中生效                       |
| 样式中的 `url()` 相对路径          | 修正为子应用的绝对路径                                           |
| UI 弹窗组件（如 Ant Design Modal） | `document.body.appendChild` 被劫持，弹窗实际挂载到 Shadow DOM 内 |

### 4.4 降级模式

当浏览器不支持 `Proxy` 或不支持 `Shadow DOM` 时，Wujie 降级为 `Object.defineProperties` 方案：

- `proxyWindow`/`proxyDocument`/`proxyLocation` 改用 `Object.defineProperties` 实现
- 子应用 DOM 直接渲染在 iframe 内部，而非 Shadow DOM
- 通过 `{ degrade: true }` 也可主动启用降级模式

## 5. 通信机制

Wujie 提供三种通信方式，它们分别利用了 iframe 同源特性和 EventBus 全局调度：

### 5.1 同源通信

由于 iframe 的 `src` 设置为主应用域名，主应用和子应用的 iframe 处于**同源**状态，可直接互相访问：

```ts
// 主应用 → 子应用
const iframe = document.querySelector('iframe[name="子应用id"]')
iframe.contentWindow.xxx // 直接读写子应用 iframe 的 window

// 子应用 → 主应用
window.parent.xxx // 直接读写主应用的 window
```

这是 Wujie 通信的**底层能力基础**，Props 和 EventBus 都是在它的基础上封装而来。但这种直接访问耦合度高，日常开发应优先使用 Props 或 EventBus。

### 5.2 Props 通信

主应用通过 `props` 参数向子应用注入数据，Wujie 将 props 挂载到 `window.$wujie.props`：

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

**源码实现路径：** `sandbox.ts` 中 `Wujie` 类在 `active()` 阶段将 `props` 注入 iframe 的 `window.$wujie` 对象。

Props 适合主→子的单向数据流。如果子应用用 Vue，可以在 `bootstrap` 中将 props 注入全局（如 `provide`），避免在每个组件中重复访问 `window.$wujie.props`。

### 5.3 EventBus 通信

实现位置：`packages/wujie-core/src/event.ts`

```ts
class EventBus {
  id: string
  eventObj: Record<string, callback[]>

  $on(event: string, fn: callback) {
    // 往 this.eventObj[event] 数组中追加回调
    if (!this.eventObj[event]) this.eventObj[event] = []
    this.eventObj[event].push(fn)
    return this
  }

  $emit(event: string, ...args: any[]) {
    // ★ 核心：遍历全局 appEventObjMap 中所有应用的 eventObj
    // 而非仅遍历当前实例的 eventObj
    for (const [id, eventObj] of appEventObjMap) {
      const fns = eventObj[event]
      if (fns) fns.forEach(fn => fn(...args))
      // 同时触发 $onAll 注册的全局监听器
      const allFns = eventObj['__ALL__']
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

**EventBus 的设计精髓：**

- **全局 `appEventObjMap`**：一个模块级 Map，key 是应用 id，value 是 `eventObj`。所有子应用和主应用的 EventBus 实例都将自己的回调注册到这个全局 Map 中。
- **`$emit` 遍历全局**：`$emit` 会遍历 `appEventObjMap` 中**所有**应用的 `eventObj`，而非仅遍历当前实例的。这就是"去中心化"的含义——主应用 emit 的事件，子应用能收到；子应用 A emit 的事件，子应用 B 也能收到。
- **链式调用**：所有方法都 `return this`，支持 `bus.$on("a", fn1).$on("b", fn2)` 写法。
- **自动清理**：子应用销毁（`unmount`）时，Wujie 自动调用 `$clear()` 清空该应用的所有事件订阅。但组件级订阅仍需开发者在 `unmount` 中手动 `$off`。

**使用示例：**

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

// ★ 组件销毁时必须手动解绑
window.$wujie?.bus.$off('theme-change', themeHandler)
```

**Vue 组件封装中的事件转发：** `wujie-vue3` 内部利用 `$onAll` 将子应用 `$emit` 的事件自动转发为 Vue 组件事件，因此主应用可以直接在 `<WujieVue>` 上通过 `@event-name` 监听子应用发出的任何事件。

### 5.4 通信方式选型

| 方式                | 适用场景                            | 实现基础                         |
| ------------------- | ----------------------------------- | -------------------------------- |
| **Props**           | 主→子 单向传递配置、Token、用户信息 | `window.$wujie.props`            |
| **EventBus**        | 双向、跨应用、去中心化的事件通知    | `event.ts` 全局 `appEventObjMap` |
| **window 直接访问** | 极少数需要直接操作对方上下文的场景  | iframe 同源                      |

**推荐原则：** 优先 Props 传配置 + EventBus 传事件 + URL 传可序列化状态。尽量避免直接 `window.parent.xxx` 的访问方式。

## 6. 路由同步

Wujie 通过劫持 iframe 的 `history.pushState` 和 `history.replaceState` 实现主子应用路由双向同步：

```ts
// iframe.ts — patchIframeHistory
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

**同步链路：**

```markdown
子应用内调用 history.pushState("/detail")
↓ patchIframeHistory 拦截
syncUrlToWindow() → 主应用 URL 变为 /order?wujie=...（含子应用路径）
↓ 用户刷新页面
主应用读取 URL query 参数
↓ syncUrlToIframe()
子应用通过 history.replaceState 恢复到 /detail

浏览器前进/后退按钮
↓ popstate / hashchange 事件
joint session history 自动作用
↓ 监听后同步主子应用 URL
```

## 7. 保活与预加载

```vue
<WujieVue name="order" url="http://localhost:7101/" :alive="true" />
```

**保活模式的实现：** `alive: true` 时，路由切走不会销毁 `<wujie-app>` 和 iframe，而是将它们缓存到内存中。重新激活时直接取出挂载，跳过 `importHTML` 和 JS 重新执行的流程，恢复速度快。

三种运行模式：

| 模式                           | 行为                                                            | 适用场景           |
| ------------------------------ | --------------------------------------------------------------- | ------------------ |
| **保活模式**（`alive: true`）  | 切换时保留 WebComponent + iframe，只做隐藏/显示                 | 高频切换的 Tab 页  |
| **单例模式**（`alive: false`） | 保留 iframe，切换时销毁/重建子应用实例                          | 一般页面切换       |
| **重建模式**                   | 每次彻底销毁 iframe 和 WebComponent，重新走完整 `startApp` 流程 | 低频页面、内存敏感 |

**注意事项：** 保活会保留子应用的全局变量、事件订阅和定时器。如果子应用的 `unmount` 中未清理全局副作用，保活后重新挂载可能出现重复监听、定时器叠加等问题。

## 8. 主应用接入

```ts
import { createApp } from 'vue'
import WujieVue from 'wujie-vue3'
import App from './App.vue'

createApp(App).use(WujieVue).mount('#app')
```

```vue
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

**子应用必须配置 CORS：**

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

## 9. 子应用适配

多数情况下子应用无需改造，能独立访问即可。如需感知 Wujie 环境：

```ts
const isInWujie = Boolean(window.__POWERED_BY_WUJIE__)

if (isInWujie) {
  const props = window.$wujie?.props
  console.log(props?.token)
}
```

子应用仍需做好卸载清理——全局事件、定时器、WebSocket 和未完成请求在 `unmount` 中清理，保活场景下尤其重要。

## 10. 优势与边界

| 维度      | 表现                                                             |
| --------- | ---------------------------------------------------------------- |
| JS 隔离   | iframe 物理级隔离，强于纯 Proxy 沙箱                             |
| CSS 隔离  | Shadow DOM 原生隔离，无需构建时 prefix                           |
| Vite 兼容 | 原生支持 ESM，无需改造构建产物                                   |
| 多实例    | iframe 天然支持多子应用同时激活                                  |
| 性能      | 无 `with`/`eval` 性能损耗；保活模式切换快；iframe 有额外内存开销 |
| 调试      | 跨 iframe 上下文调试比单页面 SPA 复杂                            |

## 11. 常见问题

| 问题                         | 原因与处理                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| 弹窗层级不符合预期           | 弹窗挂载到 Shadow DOM 内部而非 `document.body`；检查 UI 库的 `getPopupContainer` 配置 |
| 页面内存持续增长             | 保活模式下未清理全局副作用；检查定时器、事件订阅、WebSocket                           |
| 子应用刷新丢状态             | 未配置路由同步（`:sync="true"`）；关键状态放 URL 或后端                               |
| 跨域资源加载失败             | 子应用服务未配置 CORS                                                                 |
| ESM 模块中 `location` 不正确 | ESM 代码无法包装 IIFE；`location` 指向 iframe 真实 location，非 proxyLocation         |
| `requestIdleCallback` 不触发 | iframe 中浏览器可能延迟/不触发；可在 iframe 嵌套场景关闭 fiber 模式                   |

## 12. 落地建议

Wujie 适合作为 Vite 时代的运行时隔离方案。选型时重点设计：保活策略（哪些页面保活、保活上限）、路由同步（一级前缀分配、query 参数同步）、弹窗挂载（UI 库 `getPopupContainer` 配置）、事件解绑（保活场景下的 `$off`）、CORS 配置（开发与生产环境一致）。
