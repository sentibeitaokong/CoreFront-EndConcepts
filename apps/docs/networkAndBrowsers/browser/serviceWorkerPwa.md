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

页面中注册：

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

## 3. 经典缓存策略模型

| 策略                       | 机制描述                               | 适用场景                            |
| -------------------------- | -------------------------------------- | ----------------------------------- |
| **Cache First**            | 优先查缓存，缓存缺位才走网络。         | 带 Hash 的 JS/CSS、字体、稳定图片。 |
| **Network First**          | 优先请求网络，失败则 fallback 到缓存。 | HTML 页面、关键业务数据。           |
| **Stale-While-Revalidate** | 立即返回缓存，后台异步更新缓存。       | 允许短暂过期的接口、配置信息。      |

```javascript
// Stale-While-Revalidate 示例
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request)
      const fetching = fetch(event.request).then(res => {
        cache.put(event.request, res.clone())
        return res
      })
      return cached || fetching
    }),
  )
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

## 6. 总结

Service Worker 的本质是**浏览器端的代理中间件**。通过它，开发者将网络请求控制权从服务端下沉到客户端。在设计离线方案时，请始终遵循“**渐进式增强**”原则：优先确保核心资源可访问，再通过策略逐步优化离线数据的实时性与交互体验。
