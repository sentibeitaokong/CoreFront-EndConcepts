# qiankun 微前端方案全景解析

`qiankun` 是蚂蚁金服基于 `single-spa` 封装的企业级微前端框架。其核心贡献在于引入了 **HTML Entry** 加载机制与**完备的运行时沙箱（JS/CSS 隔离）**，将微前端的接入成本降至接近原生 SPA，尤其契合存量大型中后台系统的平滑重构与模块拆分。

## 1. 核心架构原理

qiankun 的运行链路本质是一个受控的路由调度状态机与资源加载器的结合：

```markdown
注册应用表(register) → 监听路由(hash/popstate) → 匹配规则(activeRule) →
拉取资源(HTML Entry) → 构建沙箱(Proxy/ShadowDOM) → 运行时调度(bootstrap/mount/unmount)
```

## 2. 应用注册机制

### 2.1 注册子应用

`registerMicroApps` 是 qiankun 的入口，核心逻辑是将子应用配置存入内部注册表 `appRegistry`（一个数组），并为每个应用关联全局生命周期钩子。

```ts
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'app-order', // 唯一标识，也是子应用挂载生命周期时的全局命名空间
    entry: '//localhost:7101', // HTML Entry 地址，也可直接传入解析后的资源列表
    container: '#micro-container', // 子应用 DOM 渲染的目标容器
    activeRule: '/order', // 路由匹配规则，支持字符串前缀或自定义函数
    props: { token: 'xxx' }, // 主应用向子应用传递的自定义数据
  },
])
```

:::details registerMicroApps简化源码

```js
// 所有已注册的子应用配置列表
const appRegistry = []
/**
 * 注册微应用
 * @param {Array} apps           子应用配置数组
 * @param {Object} lifeCycles    全局生命周期钩子
 */
export function registerMicroApps(apps, lifeCycles = {}) {
  apps.forEach(app => {
    appRegistry.push({
      ...app,
      lifeCycles,
    })
  })
}
```

:::

### 2.2 启动框架

`start` 负责初始化路由监听、触发首次匹配、配置沙箱和预加载策略。启动后 qiankun 监听 `hashchange` 和 `popstate`
事件，每次路由变化都会重新匹配子应用。

```ts
start({
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true,
  },
  prefetch: 'all',
})
```

:::details start简化源码

```js
/** 框架启动配置，由 start(options) 写入，loadApp() 读取 */
let frameworkOptions = {
  sandbox: false,
}
/** 框架是否已启动（防止重复 start） */
let started = false
/**
 * 启动微前端框架
 * @param {Object} options  启动配置
 * @param {boolean|Object} options.sandbox  JS 沙箱配置（默认 false）
 *  true  — 使用默认 ProxySandbox, false — 子应用脚本直接运行在 window 上, Object — 启用沙箱并传入高级配置
 * @param {Array<string>} options.sandbox.globalWhiteList  沙箱白名单，白名单属性写入真实 window
 */
export function start(options = {}) {
  // 防止重复启动
  if (started) {
    return
  }
  started = true
  // 保存启动配置，供 loadApp 中创建子应用沙箱使用
  frameworkOptions = {
    ...options,
  }
  // 保留到 window 上方便调试，也模拟 qiankun 运行时的全局配置感知
  window.__QIANKUN_OPTIONS__ = frameworkOptions
  window.addEventListener('hashchange', reroute)
  window.addEventListener('popstate', reroute)
  reroute()
}
```

:::

### 2.3 路由调度核心

每次 URL 变化触发底层 `reroute` 机制。qiankun 会计算应用的活跃状态，严格按照 **“先卸载失效应用 (unmount) ->
再挂载命中应用 (mount)”** 的流水线执行，确保同一容器内不会发生 DOM 堆叠或内存态冲突。

```js
async function reroute() {
  if (!started) {
    return
  }
  // 找出当前 URL 下应激活的所有子应用
  const activeApps = appRegistry.filter(app => matchActiveRule(app.activeRule))
  const activeNames = new Set(activeApps.map(app => app.name))
  // 卸载已挂载但不再激活的子应用
  for (const mountedApp of mountedApps.values()) {
    if (!activeNames.has(mountedApp.name)) {
      await unmountApp(mountedApp)
    }
  }
  // 挂载新匹配且尚未挂载的子应用
  for (const app of activeApps) {
    if (!mountedApps.has(app.name)) {
      const loadedApp = await loadApp(app)
      await mountApp(loadedApp)
    }
  }
}
```

### 2.4 路由匹配

路由匹配支持字符串前缀和函数两种方式。日常最常用的是路径前缀匹配。

```js
function matchActiveRule(activeRule) {
  if (typeof activeRule === 'function') {
    return activeRule(location)
  }
  return (
    location.pathname.startsWith(activeRule) ||
    location.hash.startsWith(activeRule)
  )
}
```

## 3. 资源加载机制

### 3.1 HTML Entry 原理

qiankun 的核心创新之一是 **HTML Entry** —— 子应用不需要像 single-spa 那样暴露 JS 入口文件，而是直接提供一个 HTML
地址。qiankun 通过 fetch 拉取 HTML，解析后提取 JS 和 CSS 资源动态加载。

```js
async function loadApp(app) {
  try {
    // ----- 步骤 0：触发 beforeLoad 生命周期钩子 -----
    await callLifeCycle(app.lifeCycles?.beforeLoad, app)

    // ----- 步骤 1：判断是否启用沙箱，创建或复用 ProxySandbox 实例 -----
    const sandboxOptions = normalizeSandboxOptions(frameworkOptions.sandbox)

    let sandbox = null
    if (sandboxOptions.enabled) {
      // 复用已存在的沙箱实例（同一个子应用切出再切回时）
      sandbox = sandboxInstances.get(app.name)
      if (!sandbox) {
        sandbox = new ProxySandbox(app.name, sandboxOptions)
        sandboxInstances.set(app.name, sandbox)
        console.log('[sandbox] ' + app.name + ' sandbox created')
      }
      sandbox.active()
    }

    // ----- 步骤 2：通过 fetch 获取子应用的 HTML 源码 -----
    const html = await fetch(app.entry).then(res => res.text())

    // ----- 步骤 3：将 HTML 解析为 DOM 文档，提取并移除 <script> -----
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const scripts = [...doc.querySelectorAll('script')]
    scripts.forEach(script => script.remove())

    // ----- 步骤 4：提取 <link rel="stylesheet">，动态加载到主文档 -----
    const styles = [...doc.querySelectorAll("link[rel='stylesheet']")]
    await Promise.all(
      styles.map(style =>
        loadStyle(resolveAssetUrl(app.entry, style.getAttribute('href'))),
      ),
    )
    styles.forEach(style => style.remove())

    // ----- 步骤 5：将子应用的 body 内容插入到主应用的容器中 -----
    const container = document.querySelector(app.container)
    if (!container) {
      throw new Error('container ' + app.container + ' not found')
    }
    container.innerHTML = doc.body.innerHTML

    // ----- 步骤 6：设置 __POWERED_BY_QIANKUN__ 标记 -----
    // 沙箱开启时写入 fakeWindow；未开启时写入真实 window
    const runtimeGlobal = sandbox ? sandbox.proxy : window
    runtimeGlobal.__POWERED_BY_QIANKUN__ = true

    // ----- 步骤 7：依次执行子应用的 JavaScript 脚本 -----
    for (const script of scripts) {
      await execScript(
        resolveAssetUrl(app.entry, script.getAttribute('src')),
        sandbox,
      )
    }

    // ----- 步骤 8：从沙箱（或 window）上读取子应用暴露的生命周期钩子 -----
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
      sandbox, // 将沙箱引用挂在应用实例上，供 unmount 时清理
    }
  } catch (error) {
    callErrorHandlers(error)
    throw error
  }
}
```

### 3.2 资源路径解析

HTML Entry 中的资源路径通常是相对路径，qiankun 需要用子应用的 entry URL 作为基址进行解析：

```js
//将相对路径的静态资源解析为基于入口 URL 的绝对路径
function resolveAssetUrl(entry, assetPath) {
  if (!assetPath) {
    return ''
  }
  return new URL(assetPath, entry).toString()
}
```

### 3.3 脚本执行方式

对于 `<script>` 标签，qiankun 不会直接用 `<script>` 插入 DOM，而是通过 `fetch` 获取源码后，使用 `new Function` 在沙箱中执行：

```js
async function execScript(url, sandbox = null) {
  if (!url) {
    return
  }
  // ----- 步骤 A：通过网络请求拉取远程脚本源码 -----
  const code = await fetch(url).then(res => res.text())
  if (sandbox && sandbox.isActive) {
    // ----- 沙箱模式 -----
    const sandboxGlobal = sandbox.proxy
    const run = new Function(
      'window',
      'self',
      'globalThis',
      'with(window){\n;(function(){\n' +
        code +
        '\n}).call(window);\n}\n//# sourceURL=' +
        url,
    )
    run.call(sandboxGlobal, sandboxGlobal, sandboxGlobal, sandboxGlobal)
  } else {
    // ----- 非沙箱模式：直接在真实 window 上执行（原有逻辑）-----
    const run = new Function('window', code + '\n//# sourceURL=' + url)
    run(window)
  }
}
```

### 3.4 样式加载

qiankun 动态创建 `<link>` 标签插入到 `document.head` 来加载样式，并通过 CSS 隔离机制（选择器前缀或 Shadow DOM）防止样式污染。

```js
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

### 3.5 预加载策略

`prefetch` 配置项可以让 qiankun 在空闲时提前拉取子应用资源，加快后续切换速度。

```ts
start({
  prefetch: 'all', // 预加载所有注册的子应用
  // prefetch: 'lazy' // 只在空闲时预加载
  // prefetch: ['app1', 'app2'] // 指定预加载的子应用
})
```

:::details 预加载策略

```js
export function prefetchApps(apps) {
  apps.forEach(app => fetch(app.entry).catch(callErrorHandlers))
}
```

:::

## 4. 子应用生命周期

### 4.1 标准生命周期

子应用必须导出三个生命周期函数：

```ts
let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  const container = props.container
  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
}
/** 判断是否在 qiankun 环境中运行 */
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}
/** 1. bootstrap —— 初始化，只调用一次 */
export async function bootstrap() {
  console.log('order app bootstrap')
}
/** 2. mount —— 挂载/渲染 */
export async function mount(props: any) {
  render(props)
}
/** 3. unmount —— 卸载/清理副作用 */
export async function unmount() {
  app?.unmount()
  app = null
}
```

### 4.2 全局生命周期钩子

qiankun 允许在 `registerMicroApps` 时传入全局生命周期钩子，所有子应用的加载/挂载/卸载都会触发：

```ts
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

### 4.3 独立运行判断

子应用通过 `__POWERED_BY_QIANKUN__` 标记判断是否运行在 qiankun 中。独立开发时不启动主应用也能直接访问子应用：

```ts
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}
```

### 4.5 手动挂载

除了基于路由的自动挂载，qiankun 还提供 `loadMicroApp` 用于手动控制子应用的加载和卸载，适合在非路由场景下使用：

```ts
export async function loadMicroApp(app, lifeCycles = {}) {
  // 不走路由匹配，直接加载并挂载
  const microApp = await loadApp({
    ...app,
    lifeCycles,
  })
  await mountApp(microApp)
  // 返回控制句柄，调用者可通过 .getStatus() / .unmount() 管理
  return {
    getStatus() {
      return mountedApps.has(app.name) ? 'MOUNTED' : 'NOT_MOUNTED'
    },
    unmount() {
      return unmountApp(microApp)
    },
  }
}
```

## 5. 沙箱隔离机制

### 5.1 JS 沙箱总览

qiankun 的 JS 沙箱核心目标：**子应用的全局变量不污染主应用和其他子应用，子应用卸载时能完整恢复环境。**

| 沙箱类型               | 适用场景              | 原理                                              | 特点                                       |
| ---------------------- | --------------------- | ------------------------------------------------- | ------------------------------------------ |
| **Proxy 沙箱**（默认） | 现代浏览器、多实例    | 通过 `Proxy` 代理 `window`，写入落到 `fakeWindow` | 性能好、支持多实例、不兼容 IE              |
| **快照沙箱**           | 旧浏览器兼容          | 挂载前快照 `window`，卸载时对比恢复               | 兼容性好、性能开销大、不支持多实例同时激活 |
| **Legacy 沙箱**        | 不支持 Proxy 的旧环境 | 克隆 `window` 到 `fakeWindow`                     | 已被 Proxy 沙箱替代                        |

### 5.2 Proxy 沙箱实现原理

```js
//沙箱白名单：这些全局变量需要写回真实 window，供框架和主子应用共享
const DEFAULT_GLOBAL_WHITE_LIST = ['__POWERED_BY_QIANKUN__']
//沙箱类
class ProxySandbox {
  constructor(appName, options = {}) {
    this.appName = appName
    this.isActive = false
    //白名单
    this.globalWhiteList = new Set([
      ...DEFAULT_GLOBAL_WHITE_LIST,
      ...(options.globalWhiteList || []),
    ])

    // 子应用运行的“假 window”容器，存储子应用自己的全局变量
    this.fakeWindow = Object.create(null)
    // 记录沙箱运行期间新增/修改过的属性，用于卸载时清理
    this.modifiedProps = new Set()
    // 记录子应用注册的事件监听和异步任务，卸载时统一清理
    this.eventListeners = new Set()
    this.timeoutIds = new Set()
    this.intervalIds = new Set()
    this.animationFrameIds = new Set()
    //代理
    this.proxy = new Proxy(this.fakeWindow, {
      get: (target, key) => this.get(target, key),
      set: (target, key, value) => this.set(target, key, value),
      has: () => true,
      deleteProperty: (target, key) => this.deleteProperty(target, key),
      defineProperty: (target, key, descriptor) =>
        this.defineProperty(target, key, descriptor),
      getOwnPropertyDescriptor: (target, key) =>
        this.getOwnPropertyDescriptor(target, key),
      ownKeys: target => Reflect.ownKeys(target),
    })
  }
  get(target, key) {
    //...边界情况处理
    return value
  }
  set(target, key, value) {
    // 白名单属性直接写回真实 window，供框架或主子应用共享
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
    // 仅删除 fakeWindow 上的属性，不操作真实 window
    if (key in target) {
      delete target[key]
      this.modifiedProps.delete(key)
    }
    return true
  }
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
    // 从真实 window 获取描述符时需标记 configurable
    // 因为 Proxy 的 getOwnPropertyDescriptor 必须返回 configurable
    // 否则可能触发 Proxy 不变量（Invariant）异常
    const descriptor = Object.getOwnPropertyDescriptor(window, key)
    if (descriptor) {
      return {
        ...descriptor,
        configurable: true,
      }
    }
    return undefined
  }
  //副作用
  createSideEffectProxy(key) {
    //处理副作用
  }
  //从记录中移除指定的事件监听
  removeRecordedEventListener(type, listener, options) {
    for (const record of this.eventListeners) {
      if (
        record.type === type &&
        record.listener === listener &&
        record.options === options
      ) {
        this.eventListeners.delete(record)
        return
      }
    }
  }
  //清理所有已记录的副作用，包括：事件监听、setTimeout、setInterval、requestAnimationFrame
  clearSideEffects() {
    // 移除所有通过沙箱注册的事件监听
  }
  //激活沙箱
  active() {
    if (this.isActive) {
      return
    }
    this.isActive = true
    console.log('[sandbox] ' + this.appName + ' activated')
  }
  //停用沙箱
  inactive() {
    if (!this.isActive) {
      return
    }
    // 清理事件监听、定时器、requestAnimationFrame 等运行时副作用
    this.clearSideEffects()
    // 清空子应用在沙箱中设置的所有非白名单属性
    this.modifiedProps.forEach(key => {
      delete this.fakeWindow[key]
    })
    this.modifiedProps.clear()
    this.isActive = false
    console.log('[sandbox] ' + this.appName + ' inactivated')
  }
}
```

### 5.3 副作用自动清理

子应用在运行时注册的事件监听、定时器等需要在卸载时清理，否则会造成内存泄漏和事件重复绑定。

```js
class proxySandbox{
    createSideEffectProxy(key) {
        // 为每个副作用 API 创建一个代理函数，记录执行痕迹
        // 这样子应用卸载时可以自动清理，防止内存泄漏
        const sideEffectHandlers = {
            addEventListener: (type, listener, options) => {
                // 真实注册到 window，同时记录以便卸载时移除
                window.addEventListener(type, listener, options);
                this.eventListeners.add({ type, listener, options });
            },
            removeEventListener: (type, listener, options) => {
                // 移除真实监听，同时删除记录
                window.removeEventListener(type, listener, options);
                this.removeRecordedEventListener(type, listener, options);
            },
            setTimeout: (handler, timeout, ...args) => {
                // 包装回调，执行时自动从记录中移除已完成的任务
                const timerId = window.setTimeout(() => {
                    this.timeoutIds.delete(timerId);
                    if (typeof handler === "function") {
                        handler(...args);
                    } else {
                        // setTimeout 也支持字符串代码
                        new Function(String(handler))();
                    }
                }, timeout);
                this.timeoutIds.add(timerId);
                return timerId;
            },
            clearTimeout: (timerId) => {
                window.clearTimeout(timerId);
                this.timeoutIds.delete(timerId);
            },
            setInterval: (handler, timeout, ...args) => {
                const timerId = window.setInterval(handler, timeout, ...args);
                this.intervalIds.add(timerId);
                return timerId;
            },
            clearInterval: (timerId) => {
                window.clearInterval(timerId);
                this.intervalIds.delete(timerId);
            },
            requestAnimationFrame: (callback) => {
                // 包装回调，执行时自动从记录中移除已完成的帧
                const frameId = window.requestAnimationFrame((time) => {
                    this.animationFrameIds.delete(frameId);
                    callback(time);
                });
                this.animationFrameIds.add(frameId);
                return frameId;
            },
            cancelAnimationFrame: (frameId) => {
                window.cancelAnimationFrame(frameId);
                this.animationFrameIds.delete(frameId);
            },
        };
        return sideEffectHandlers[key];
    },
    clearSideEffects() {
        // 移除所有通过沙箱注册的事件监听
        this.eventListeners.forEach(({ type, listener, options }) => {
            window.removeEventListener(type, listener, options);
        });
        this.eventListeners.clear();

        // 清除所有尚未执行的定时器
        this.timeoutIds.forEach((timerId) => window.clearTimeout(timerId));
        this.timeoutIds.clear();

        this.intervalIds.forEach((timerId) => window.clearInterval(timerId));
        this.intervalIds.clear();

        this.animationFrameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
        this.animationFrameIds.clear();
    }
}
```

### 5.4 沙箱生命周期

```js
class proxySandbox {
  //激活沙箱
  active() {
    if (this.isActive) {
      return
    }
    this.isActive = true
    console.log('[sandbox] ' + this.appName + ' activated')
  }
  //停用沙箱
  inactive() {
    if (!this.isActive) {
      return
    }
    // 清理事件监听、定时器、requestAnimationFrame 等运行时副作用
    this.clearSideEffects()
    // 清空子应用在沙箱中设置的所有非白名单属性
    this.modifiedProps.forEach(key => {
      delete this.fakeWindow[key]
    })
    this.modifiedProps.clear()
    this.isActive = false
    console.log('[sandbox] ' + this.appName + ' inactivated')
  }
}
```

### 5.5 CSS 隔离

| 配置                         | 原理                         | 注意点                                           |
| ---------------------------- | ---------------------------- | ------------------------------------------------ |
| `experimentalStyleIsolation` | 给样式选择器追加作用域前缀   | 对复杂选择器和第三方库样式需充分测试             |
| `strictStyleIsolation`       | 使用 Shadow DOM 实现物理隔离 | 弹窗、Tooltip、Teleport 容易逃逸 Shadow DOM 边界 |

:::details 企业级css隔离

```js
//应用级 class 前缀 + CSS Modules + 组件库命名空间
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

:::

## 6. 子应用构建配置

### 6.1 Webpack 构建

Webpack 子应用需要输出 `umd` 格式，并保证 `jsonpFunction` 或 `chunkLoadingGlobal` 唯一，避免多个子应用冲突：

```js
module.exports = {
  output: {
    library: 'order', // 全局命名空间，与子应用 name 一致
    libraryTarget: 'umd', // qiankun 通过 umd 格式读取生命周期
    chunkLoadingGlobal: 'webpackJsonp_order', // 唯一，避免多子应用 Webpack 异步加载冲突
    publicPath: '//localhost:7101/',
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*', // 允许跨域访问子应用资源
    },
  },
}
```

### 6.2 Vite 构建

Vite 子应用接 qiankun 时需要额外插件或适配层，因为 Vite 原生 ESM 产物和 qiankun 传统 HTML Entry 执行模型并不完全契合。常用方案：

- 使用 `vite-plugin-qiankun` 插件自动完成适配

:::details vite构建
:::code-group

```js [vite.config.ts]
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// 注意：这里的 name 必须与主应用 registerMicroApps 中配置的 name 绝对一致！
const qiankunName = 'app-vue3-vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    // 生产环境需配置为绝对路径或由主应用动态下发，避免静态资源 404
    base: isDev ? '/' : 'http://localhost:7100/',

    plugins: [
      vue(),
      // 注入 qiankun 适配插件
      qiankun(qiankunName, {
        // 微前端环境下，开发模式必须开启此选项，用于在底层抹平 ESM 语法差异
        useDevMode: true,
      }),
    ],

    server: {
      port: 7100,
      // 极其关键：必须允许跨域，因为主应用底层是通过 fetch 拉取子应用资源的
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

```js [src/main.ts]
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';
import router from './router';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

let app: VueApp<Element> | null = null;

// 1. 抽离独立的渲染函数
function render(props: any = {}) {
  const { container } = props;

  app = createApp(App);
  app.use(router);

  // 智能寻找挂载点：如果作为子应用运行，挂载到基座分配的 DOM 内；否则挂载到自身的 #app
  const targetNode = container ? container.querySelector('#app') : '#app';
  app.mount(targetNode);
}

// 2. 注入 qiankun 标准生命周期
renderWithQiankun({
  bootstrap() {
    console.log(`[${qiankunWindow.__POWERED_BY_QIANKUN__ ? 'qiankun' : '独立运行'}] bootstrap`);
  },

  mount(props) {
    console.log('[vite-app] 成功挂载', props);
    render(props);
  },

  update(props: any) {
    console.log('[vite-app] 接收到新的 props', props);
  },

  unmount(props: any) {
    console.log('[vite-app] 开始卸载');
    // 极其关键的内存回收：切断 Vue 3 effectScope 依赖树，清理所有事件监听
    if (app) {
      app.unmount();
      app._container.innerHTML = '';
      app = null;
    }
  }
});

// 3. 独立运行态判断
// qiankunWindow 取代了传统的 window，提供更安全的运行环境探测
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

```js [router/index.ts]
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import Home from '../views/Home.vue'

const router = createRouter({
  // 动态配置 base
  // 如果在 qiankun 中运行，base 必须与主应用中配置的 activeRule 保持一致 (例如 '/app-vue3')
  // 如果独立运行，则使用默认的 '/'
  history: createWebHistory(
    qiankunWindow.__POWERED_BY_QIANKUN__ ? '/app-vue3' : '/',
  ),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    // 其他路由...
  ],
})
export default router
```

:::

- 或通过 Rollup 插件将 ESM 强转为 UMD/IIFE 格式

## 7. 通信方式

### 7.1 Props 透传

主应用在注册时将自定义数据通过 `props` 传入，子应用在 `mount` 时接收。适合传认证、权限、环境变量、埋点方法等低频公共能力。

```ts
// 主应用
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

// 子应用
export async function mount(props: any) {
  console.log(props.user, props.track) // 接收主应用传入的数据
  render(props)
}
```

### 7.2 全局状态

qiankun 提供 `initGlobalState`，设计上只适用于主题色、语言、登录用户这类少量公共状态。复杂业务状态应通过后端 API 或 URL 解耦。

```ts
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({ theme: 'light' })

// 监听状态变化
actions.onGlobalStateChange((state, prev) => {
  console.log('state changed from', prev, 'to', state)
})

// 更新状态（浅合并）
actions.setGlobalState({ theme: 'dark' })
```

:::details 全局状态

```js
/** 全局共享状态对象 */
let globalState = {}
/** 全局状态变更监听器集合 */
const globalStateListeners = new Set()

export function initGlobalState(initialState = {}) {
  globalState = { ...initialState }
  return {
    /**
     * 监听全局状态变化
     * @param {Function}  listener         监听回调 (state, prevState) => void
     * @param {boolean}   fireImmediately  是否立即触发一次回调
     * @returns {Function}  取消监听的函数
     */
    onGlobalStateChange(listener, fireImmediately = false) {
      // 注册监听器
      globalStateListeners.add(listener)
      if (fireImmediately) {
        // (state, prevState) — 首次触发时 prevState 等于 state
        listener(globalState, globalState)
      }
      // 返回取消监听的函数
      return () => globalStateListeners.delete(listener)
    },
    /**
     * 设置全局状态（浅合并），并通知所有监听器
     * @param {Object} nextState  要更新的状态
     */
    setGlobalState(nextState) {
      const prev = globalState
      // 浅合并：保留旧状态中未变更的字段，用新值覆盖
      globalState = {
        ...globalState,
        ...nextState,
      }
      // 逐个通知监听器：listener(newState, prevState)
      globalStateListeners.forEach(listener => listener(globalState, prev))
    },
    /**
     * 获取当前全局状态
     * @returns {Object} 返回 globalState 的引用，可直接读取
     */
    getGlobalState() {
      return globalState
    },
  }
}
```

:::

### 7.3 通过 URL 和 API 通信

对于复杂的业务状态传递，推荐通过 URL 参数或后端 API 进行解耦，而不是依赖 qiankun 的全局状态：

- 路由参数：`/order?userId=123`
- 后端 API：子应用直接调用接口获取数据
- localStorage / sessionStorage：适合不敏感的非安全数据

## 8. 常见问题

| 问题                   | 处理方式                                                     |
| ---------------------- | ------------------------------------------------------------ |
| 子应用资源 404         | 检查 `publicPath` 和部署路径                                 |
| 切换后事件重复触发     | 在 `unmount` 清理事件、订阅、定时器；启用沙箱副作用自动清理  |
| 样式串扰               | 应用前缀 + CSS Modules + 样式隔离配置组合使用                |
| 弹窗位置异常           | 统一弹窗挂载容器，不要默认挂到 `document.body`               |
| Vite 子应用加载异常    | 使用适配插件，或优先评估 Wujie、Micro-app、Module Federation |
| 子应用间全局变量污染   | 启用 Proxy 沙箱，检查是否有白名单遗漏                        |
| 卸载后定时器仍在执行   | 在 unmount 中手动清理或依赖沙箱副作用回收                    |
| 子应用切换后路由未同步 | 确保子应用路由加了前缀 base，与 activeRule 保持一致          |
| 子应用生命周期未导出   | 检查构建输出格式是否为 umd，`library` 名称是否与 `name` 一致 |

## 9. 落地建议

| 架构维度         | 关键实践规范                                                                    | 核心目的                                                                     |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **生命周期**     | 子应用必须实现完整的 `bootstrap` / `mount` / `unmount` 生命周期。               | 确保基座（主应用）能够精准调度子应用的初始化、渲染与销毁。                   |
| **内存与副作用** | 必须在 `unmount` 中清理所有**事件监听**、**定时器**、**全局订阅**。             | 彻底防止子应用频繁切换导致的**内存泄漏**和事件重复触发。                     |
| **路由规范**     | 子应用路由必须**加前缀**（如 `/order/xxx`）。                                   | 划定绝对的路由结界，避免与主应用或其他子应用发生路由抢占和冲突。             |
| **样式隔离**     | 样式使用**应用级前缀 + CSS Modules**（编译期隔离），qiankun 运行时隔离做兜底。  | 完美解决运行时的 CSS 全局污染，并规避 UI 组件库弹窗的“样式逃逸”问题。        |
| **性能优化**     | 公共核心依赖（Vue、React、Ant Design 等）通过 Webpack `externals` 或 UMD 共享。 | 避免基础库被重复打包下载，大幅缩减子应用体积，提升首屏与切换性能。           |
| **质量监控**     | 接入错误监控系统（如 Sentry），并精准打标**区分主/子应用错误来源**。            | 在多团队协同的分布式前端环境中，实现线上 Bug 的极速溯源，定责明确。          |
| **工程化部署**   | CI/CD 发布流程必须支持子应用的**独立部署**与**独立回滚**。                      | 将发版风险降至最低。某一子应用崩溃可单点回滚，真正发挥微前端“高可用”的优势。 |
