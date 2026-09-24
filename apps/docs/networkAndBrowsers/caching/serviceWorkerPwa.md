# PWA 与 Service Worker 缓存

Service Worker 是运行在浏览器后台的独立脚本，充当 Web 页面与网络之间的代理层。它是实现离线访问、性能优化及 PWA（Progressive Web App）特性的底层基石。

## 1. Service Worker 核心属性

- **异步执行**：运行在 Worker 线程，不阻塞主线程，无法直接操作 DOM。
- **安全性**：仅支持 HTTPS 或 `localhost` 环境。
- **生命周期**：由浏览器托管，即使页面关闭也可在后台存活（用于推送或同步）。
- **代理能力**：拦截作用域内所有的 `fetch` 请求，实现网络请求的灵活调度。
- **用途**：离线访问，静态资源缓存，请求兜底，后台同步，Web Push 推送。

## 2. 生命周期与注册流程

### 2.1 注册

```javascript
// 页面注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(reg => console.log('Scope:', reg.scope))
}
```

`/sw.js` 的路径决定了默认作用域。放在根路径时，通常可以控制整个站点。

### 2.2 生命周期

Service Worker 遵循严格的状态跃迁：

- **install**：初次安装，预缓存核心静态资源。
- **waiting**：安装完成，等待旧版本 SW 页面关闭。
- **activate**：旧版本完全卸载后激活，清理过期缓存。
- **fetch**：进入就绪状态，响应网络请求。

#### 2.2.1 install

```js
const CACHE_NAME = 'app-v1'
const ASSETS = ['/', '/index.html', '/main.css', '/main.js']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
})
```

#### 2.2.2 activate

```js
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)),
        ),
      ),
  )
})
```

#### 2.2.3 fetch

```js
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
    }),
  )
})
```

### 2.3 强制接管机制

Service Worker 更新有一个常见坑：新 SW 安装完成后，默认不会立即接管已有页面，而是进入 waiting 状态。

```javascript
// 在 sw.js 中
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
```

### 2.4 作用域 (Scope)：它能管到哪些页面

SW 只能接管「**脚本所在目录及其子目录**」下的页面，且 `register()` 的 `scope` 参数只能**收窄**、不能放大：

```js
// 放在 /sw.js：默认作用域是 /，可以接管全站
navigator.serviceWorker.register('/sw.js')

// 放在 /static/sw.js：默认作用域是 /static/，管不到 /index.html
// 想放大到全站，脚本必须放在根路径，或由服务端返回 Service-Worker-Allowed: /
navigator.serviceWorker.register('/static/sw.js', { scope: '/' })
```

- **同一个作用域同时只能由一个 SW 控制**：重复注册不会叠加，后注册的走更新流程。
- **作用域内的所有请求都会被拦截**，包括你没在意的第三方脚本与埋点请求——所以策略要写细，别一刀切。

### 2.5 页面侧的三件套：`ready` / `controller` / `controllerchange`

[width(29,34,37)]

| API                                  | 含义                                                        | 常见用途                                    |
| :----------------------------------- | :---------------------------------------------------------- | :------------------------------------------ |
| `navigator.serviceWorker.ready`      | 一个 promise，拿到「已激活且可用」的注册对象。              | 页面启动后要主动往 Cache Storage 写数据时。 |
| `navigator.serviceWorker.controller` | 当前**控制本页**的 SW 实例，首次注册或强刷后可能是 `null`。 | 判断「这次请求会不会走 SW」。               |
| `controllerchange` 事件              | SW 控制权发生切换（通常发生在新版 `skipWaiting` 之后）。    | 提示用户刷新，或自动 `location.reload()`。  |

注册时机建议放在 `load` 之后，避免与首屏关键资源抢带宽：

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Scope:', reg.scope)
    })
  })
}
```

### 2.6 更新流程：`waiting` 的成因与 `skipWaiting` 的代价

浏览器判断 SW 是否更新，靠的是**逐字节对比 `sw.js` 的内容**——哪怕只改了一行注释，也算一次更新。完整的更新链路是：

1. 拉取 `sw.js` → 内容有变化 → 新 SW 进入 `install`。
2. `install` 成功 → 新 SW 进入 **`waiting`**：此时**旧 SW 仍在控制页面**。
3. 关闭全部受控页面（或刷新）→ 旧 SW 释放 → 新 SW 进入 `activate`。
4. `activate` 完成、且调用了 `clients.claim()` 之后，控制权才真正移交。

这个「保守」设计的初衷是避免新旧代码同时运行，但它会带来一个线上高频事故：

> [!WARNING] 无条件 `skipWaiting()` 的代价：新旧版本混用
> 加上 `self.skipWaiting()` 能让新 SW **立即接管**，但页面上跑的仍是**旧版 HTML / JS 已经加载进内存的副本**，而后续按需加载的 chunk 请求会被**新 SW 按新版本的缓存策略处理**。一旦新版本删掉或改名了某个 chunk，用户点一下就是 `Loading chunk 5 failed` 白屏。
> 结论：**不要无条件 `skipWaiting`**。常规做法是「检测到新版本 → 提示用户『有新版本，点击刷新』→ 用户确认后再 `skipWaiting` + reload」，让「刷新页面」和「切换 SW」发生在同一刻。

```js
import { Workbox } from 'workbox-window'

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js')

  // 有新版本在 waiting：交给用户决定，而不是偷偷接管
  wb.addEventListener('waiting', () => {
    // 这里换成你自己的 UI 提示组件（弹窗 / 顶部横幅）
    showUpdateBanner({
      onConfirm: () => {
        // 控制权交接完成的瞬间再刷新，保证页面与 SW 同版本
        wb.addEventListener('controlling', () => window.location.reload())
        wb.messageSkipWaiting()
      },
    })
  })

  wb.register()
}
```

## 3. 经典缓存策略模型

[width(18,42,40)]

| 策略                       | 机制描述                               | 适用场景                            |
| -------------------------- | -------------------------------------- | ----------------------------------- |
| **Cache First**            | 优先查缓存，缓存缺位才走网络。         | 带 Hash 的 JS/CSS、字体、稳定图片。 |
| **Network First**          | 优先请求网络，失败则 fallback 到缓存。 | HTML 页面、关键业务数据。           |
| **Stale-While-Revalidate** | 立即返回缓存，后台异步更新缓存。       | 允许短暂过期的接口、配置信息。      |

### 3.1 Network First

优先走网络，失败（离线、超时、服务端挂了）再退回缓存。HTML 页面与关键业务数据用它：

```js
// Network First：先网络，失败再兜底缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // 只在拿到有效响应时写缓存，避免把 500 错误页存成「最新版本」
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
        }
        return res
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(cached => cached || caches.match('/offline.html')),
      ),
  )
})
```

### 3.2 Cache First

优先查缓存，没有才走网络。只适合「URL 变了内容才会变」的资源（带 Hash 的 JS / CSS、字体、图标）：

```js
// Cache First：先查缓存，未命中才回源并写入
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached

      return fetch(event.request).then(res => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
        return res
      })
    }),
  )
})
```

> [!WARNING] Cache First 不能用在 HTML 或接口上
> 一旦把入口 HTML 或业务接口做成 Cache First，用户就会**永远停在旧版本**：请求根本到不了服务器，缓存也就永远没有机会被更新。这是 SW 最常见的事故形态。

### 3.3 Stale-While-Revalidate

立即返回缓存（如果有），同时后台发请求更新缓存。适合允许短暂过期的接口与配置：

```js
// Stale-While-Revalidate：先给旧数据，再悄悄更新缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request)

      const fetching = fetch(event.request)
        .then(res => {
          if (res.ok) cache.put(event.request, res.clone())
          return res
        })
        // 后台更新失败不应该让整次请求失败，否则会污染浏览器的网络错误统计
        .catch(() => cached)

      return cached || fetching
    }),
  )
})
```

### 3.4 用 Workbox 落地这些策略

手写 `fetch` 事件在真实项目里很快会失控：要处理超时、写缓存失败、跨域与 `opaque` 响应、范围请求、只读请求……生产环境推荐用 [Workbox](https://developer.chrome.com/docs/workbox) 或 `vite-plugin-pwa` 把上面的策略声明化：

```js
// vite.config.js —— vite-plugin-pwa 负责生成 SW 与预缓存清单
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    VitePWA({
      // 'prompt'：等用户确认后再更新；'autoUpdate'：静默换新
      registerType: 'prompt',
      workbox: {
        // 构建产物进预缓存清单，策略按 URL 规则分配
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: /\.(?:png|jpe?g|svg|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
})
```

## 4. PWA 关键组成要素

PWA 是一套标准集合，旨在让 Web 具备原生 App 体验：

- **Manifest (Web App Manifest)**：定义应用名称、图标、启动页及显示模式 (`standalone`)。
- **Service Worker**：支撑离线访问与后台代理。
- **HTTPS**：安全性前提。
- **可安装性**：支持通过浏览器菜单添加到系统桌面，实现应用级的启动入口。

**Manifest 核心配置：**

```json
{
  "name": "Demo App",
  "short_name": "Demo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1677ff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**HTML 中引入：**

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

## 5. 架构级最佳实践

### 5.1 离线兜底逻辑

针对导航请求 (Navigation Request)，提供离线兜底页面是提升健壮性的关键：

```javascript
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    )
  }
})
```

### 5.2 调试与排查建议

- **Application 面板**：Chrome DevTools 的 `Application` 选项卡是检查缓存空间、Worker 状态及清理数据的唯一入口。
- **版本更新陷阱**：生产环境严禁在 `activate` 阶段随意清理非本项目缓存；建议采用版本号归档（如 `app-v1`, `app-v2`）。
- **接口缓存治理**：务必区分静态资源与动态 API，防止 API 响应被错误地持久化缓存导致数据陈旧。
- **更新策略**：生产环境建议在 UI 层增加版本检测，通过 `controllerchange` 事件主动提示用户刷新页面以加载最新版本。

### 5.3 容量与配额治理

- Cache Storage 属于**随时可能被浏览器清理**的存储：配额取决于磁盘剩余空间，写满时浏览器甚至可以直接删掉整个源站的缓存。所以 SW 缓存永远只是**加速手段，不是本地数据库**。
- 给每个 `cacheName` 配淘汰策略（Workbox 的 `ExpirationPlugin`：`maxEntries` / `maxAgeSeconds`），并坚持**一个版本一个 `cacheName`**：`app-v1` → `app-v2`，在 `activate` 里删旧版本，回滚时也只是换回名字。
- **不要把「不变的」和「善变的」塞进同一个 `cacheName`**：它们会被一起淘汰，也会一起失效。

### 5.4 跨域资源与 `opaque` 响应

- `fetch` 一个没带 CORS 头的第三方资源（图片、CDN 字体）拿到的是 **`opaque` 响应**：`status` 是 `0`、`ok` 是 `false`，内容也读不到。
- 它**可以**被 `cache.put()` 存下来并正常返回给页面（浏览器对这个场景有例外），但你**无法判断它是不是一个错误响应**——一张 404 的空白图片同样会被忠实地缓存下来。
- 因此不要在 Cache First 里用 `res.ok` 去过滤跨域资源（它们会永远进不了缓存）。更稳妥的取舍是：**跨域资源交给浏览器的 HTTP 缓存去管，SW 只接管同源请求**。

### 5.5 平台差异与兼容性

- **必须 HTTPS 或 `localhost`**：`http://` 环境下 `navigator.serviceWorker` 直接不存在，这也是本地调试必须走 localhost 的原因。
- **iOS Safari**：从 iOS 11.3 起支持 SW，但可安装性与后台推送能力弱于 Android Chrome；`beforeinstallprompt` 事件在 iOS 上**不存在**，只能引导用户手动「分享 → 添加到主屏幕」。
- **浏览器会回收 SW**：长期不用的 SW 可能被回收，需要重新安装。所以别依赖 SW 保活，真正要保证的是**重新安装后能自愈**。
- **用户清缓存 / 清除网站数据**会连 Cache Storage 一起清掉：页面必须能在无 SW、无缓存的状态下完整工作。

## 6. 常见问题 (FAQ)

### 6.1 上线了新版本，用户看到的还是旧页面，怎么排查？

按链路顺序排：SW 是否停在 `waiting`（旧页面一直没关）→ 有没有无条件 `skipWaiting` 导致新旧混用 → HTML 或接口是否被 Cache First 接管 → `cacheName` 没换版本，旧缓存一直命中。

### 6.2 SW 和 HTTP 缓存，谁先谁后？

**SW 在前。** 请求先被 `fetch` 事件拦截，命中 Cache Storage 就直接返回，HTTP 缓存模块根本不会触发；SW 放行之后，才轮到强缓存与协商缓存。所以调「改了代码不生效」时，**先确认是不是 SW 在兜底**（DevTools 里可以勾 `Bypass for network`）。分层顺序详见 [前端缓存策略](/networkAndBrowsers/caching/frontendCacheStrategy)。

### 6.3 SW 的缓存会影响首屏速度吗？

- **变快**：HTML 与关键资源已预缓存，等于跳过网络。
- **变慢**：首次访问要 `install` 并下载全部预缓存清单，会与首屏资源抢带宽；预缓存清单几十 MB 时，首访反而明显变慢。

所以**预缓存只放首屏必需资源**，其余交给运行时缓存。

### 6.4 为什么 `respondWith` 里出错会导致页面白屏？

`respondWith(promise)` 的 promise 一旦 reject，浏览器就把这次请求当作**网络错误**（`ERR_FAILED`）处理，页面直接拿到失败结果。所以 `fetch` 事件里必须自己兜底：

```js
event.respondWith(
  caches.match(event.request).then(cached => {
    return (
      cached || fetch(event.request).catch(() => caches.match('/offline.html'))
    )
  }),
)
```

### 6.5 为什么 `caches.match` 找不到我刚存进去的请求？

- **请求本身不匹配**：`Request` 的匹配依据是 URL + method（以及 `Vary` 声明的头），POST 请求、query 不同的 URL、`no-cors` 的跨域请求经常对不上。
- **写入还是异步的**：`cache.put()` 没有 `await` 就立刻 `match`，可能还没写完。
- **查错了缓存名**：一个作用域下可以有多个 `cacheName`，写进了 `app-v2` 却在查 `app-v1`。先用 `caches.keys()` 列出全部缓存名再排查。

### 6.6 用户清了浏览器数据会怎样？

登录态、Cache Storage、IndexedDB 会被一起清掉：SW 被注销并在下次访问时重新安装，页面退回「无缓存」状态。所以**页面必须能在无 SW、无缓存时完整可用**——这正是「渐进式增强」的含义，也是写 SW 之前要先验证的前提。
