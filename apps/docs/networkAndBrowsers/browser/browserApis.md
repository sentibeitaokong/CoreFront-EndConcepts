# 常用浏览器 API：Clipboard、Notifications、Web Share

现代浏览器提供了一批与用户系统深度交互的能力接口，覆盖剪贴板、系统通知、原生分享等场景。这些 API 大多遵循「**权限申请 → 用户手势触发 → 异步调用**」的安全模型，且大多要求页面处于**安全上下文**（HTTPS 或 localhost）。

## 1. Clipboard API：剪贴板读写

Clipboard API 提供了**异步**读写系统剪贴板的接口，取代了过时且受限的 `document.execCommand('copy')`。

**核心接口：**

[width(52,48)]

| 方法                                         | 说明                            |
| -------------------------------------------- | ------------------------------- |
| `navigator.clipboard.writeText(text)`        | 写入纯文本                      |
| `navigator.clipboard.readText()`             | 读取纯文本                      |
| `navigator.clipboard.write(ClipboardItem[])` | 写入多类型内容（富文本 / 图片） |
| `navigator.clipboard.read()`                 | 读取多类型内容                  |

**`ClipboardItem` 高频成员：**

[width(31,69)]

| 成员                          | 说明                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| `new ClipboardItem(typesMap)` | 键为 MIME 类型，值为 `Blob` / 字符串 / `Promise`（延迟生成）    |
| `types`                       | 该条目包含的 MIME 类型数组，如 `['text/html', 'text/plain']`    |
| `getType(type)`               | 按类型取出对应的 `Blob`（异步）                                 |
| `presentationStyle`           | `'unspecified'` / `'inline'` / `'attachment'`，仅 Chromium 支持 |

### 1.1 权限与安全

- 写入文本通常**无需显式授权**，但需在**用户手势**（点击等）中触发。
- 读取文本、写入/读取二进制（如图片）需申请 `clipboard-read` / `clipboard-write` 权限。
- 必须运行于安全上下文（HTTPS）。
- **iframe 里要额外放行**：宿主页面须写 `allow="clipboard-read; clipboard-write"`，否则子框架内 `navigator.clipboard` 直接不可用（控制台表现为 `NotAllowedError`）。

### 1.2 写入剪贴板

```javascript
// 写入纯文本
await navigator.clipboard.writeText('复制的内容')

// 写入多类型内容（富文本 + 纯文本）
const htmlBlob = new Blob(['<b>加粗文本</b>'], { type: 'text/html' })
const textBlob = new Blob(['加粗文本'], { type: 'text/plain' })
await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  }),
])
```

### 1.3 读取剪贴板

```javascript
const text = await navigator.clipboard.readText()

// 读取二进制（如图片）
const items = await navigator.clipboard.read()
for (const item of items) {
  if (item.types.includes('image/png')) {
    const blob = await item.getType('image/png')
    const img = document.createElement('img')
    img.src = URL.createObjectURL(blob)
    document.body.appendChild(img)
  }
}
```

### 1.4 兼容性降级

```javascript
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
    return true
  } catch {
    return false
  }
}
```

### 1.5 高频场景与 `copy` / `paste` 事件

[width(21,79)]

| 场景                     | 做法                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| 一键复制（短链、邀请码） | `writeText()`                                                                    |
| 复制到 Excel / Word      | `write()` 同时给 `text/html` 与 `text/plain`：Excel 读 HTML 表格，记事本读纯文本 |
| 复制图片 / 富文本        | `new ClipboardItem({ 'image/png': blob })`，需 `clipboard-write` 权限            |
| 粘贴时清洗格式           | 监听 `paste` 事件，读 `e.clipboardData` 只取纯文本再插入                         |

除了异步的 `navigator.clipboard`，还有一条**同步兜底通道**：`copy` / `paste` 事件对象上自带的 `e.clipboardData`。它随事件一起给出快照，读写都不走 Promise、不弹权限，适合「用户自己发起复制粘贴」这种天然带手势的场景：

```javascript
// 场景：富文本编辑器粘贴纯文本——剥掉外部样式，只留文字
editor.addEventListener('paste', e => {
  e.preventDefault()
  const text = e.clipboardData.getData('text/plain') // 事件自带的剪贴板快照
  editor.textContent += text.trim()
})

// 场景：复制页面表格，粘贴进 Excel 能自动分列
table.addEventListener('copy', e => {
  e.clipboardData.setData('text/plain', toTsv(selection)) // TSV：\t 分列、\n 换行
  e.clipboardData.setData('text/html', selection.outerHTML) // Excel / Word 优先读这份
  e.preventDefault() // 拦掉默认复制，写入我们准备的两种格式
})
```

> 二者取舍：**能拿到用户手势就用 `navigator.clipboard`**（异步、不会阻塞、能写二进制）；**需要同步拦截粘贴、或不想弹权限提示时用事件里的 `clipboardData`**。注意 `e.clipboardData` 只在事件回调同步执行期间有效，`await` 之后再读就没了。

## 2. Notifications API：系统通知

用于向用户展示系统级桌面通知，即使页面未聚焦也能触达。

**核心接口：**

[width(42,58)]

| 成员                                | 说明                                       |
| ----------------------------------- | ------------------------------------------ |
| `Notification.permission`           | 权限状态：`granted` / `denied` / `default` |
| `Notification.requestPermission()`  | 请求授权（返回 Promise）                   |
| `new Notification(title, options?)` | 页面内创建通知                             |

**构造选项 `options`（高频项）：**

[width(26,74)]

| 选项                 | 说明                                                     |
| -------------------- | -------------------------------------------------------- |
| `body`               | 通知正文                                                 |
| `icon`               | 图标 URL                                                 |
| `image`              | 大图，展示在正文下方（桌面端 Chromium 支持较好）         |
| `badge`              | 移动端状态栏 / 通知中心的单色小图标                      |
| `tag`                | 相同 `tag` 替换旧通知（防重复堆积）                      |
| `data`               | 自定义数据，点击通知时可读取                             |
| `requireInteraction` | `true` 则**不自动消失**，等用户处理（重要提醒必设）      |
| `actions`            | 通知内的操作按钮数组（Chromium 桌面端），见 2.4          |
| `silent`             | 静默（不震动 / 不响铃）                                  |
| `renotify`           | 配 `tag` 使用：替换旧通知时**是否再次提醒**（震动/响铃） |
| `timestamp`          | 通知时间戳，用于按时间排序                               |
| `dir` / `lang`       | 文本方向 / 语言，多语言站点用                            |

**实例成员（拿到 `Notification` 后）：**

[width(49,51)]

| 成员                                           | 说明                               |
| ---------------------------------------------- | ---------------------------------- |
| `close()`                                      | 主动关闭这条通知                   |
| `onclick`                                      | 点击通知（最常用：聚焦并跳转页面） |
| `onclose` / `onshow` / `onerror`               | 关闭 / 展示 / 出错                 |
| `notification.data` / `title` / `body` / `tag` | 回读构造时传入的内容               |

### 2.1 申请权限

```javascript
// 检查权限状态
const permission = Notification.permission // 'granted' | 'denied' | 'default'

// 请求授权（必须在用户手势中触发）
const result = await Notification.requestPermission()
```

### 2.2 页面内通知

```javascript
if (Notification.permission === 'granted') {
  const notification = new Notification('新消息', {
    body: '你收到一条新的评论',
    icon: '/img/logo.svg',
    tag: 'msg-1', // 相同 tag 会替换旧通知
    data: { url: '/messages/1' },
  })

  notification.onclick = () => {
    window.focus()
    window.location.href = notification.data.url
    notification.close()
  }
}
```

### 2.3 Service Worker 通知（后台推送）

配合 Push API，可在页面关闭后仍接收通知：

```javascript
// sw.js
self.addEventListener('push', event => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url },
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
```

> **注意：** 移动端浏览器的通知支持有限（iOS Safari 需添加到主屏幕后才有推送能力），桌面端支持较好。通知是否展示还受系统「勿扰模式」等影响。

### 2.4 高频场景

[width(26,74)]

| 场景                 | 关键选项                                                |
| -------------------- | ------------------------------------------------------- |
| 新消息 / 评论提醒    | 固定 `tag`（如 `'unread'`）顶掉旧通知，避免刷屏         |
| 长任务完成、下载结束 | 配 `image` / `badge` 提升辨识度；切到其他标签页也能收到 |
| 待办到期、会议提醒   | `requireInteraction: true`，不处理就不消失              |
| 带操作的通知         | `actions: [{ action: 'snooze', title: '稍后提醒' }]`    |
| 权限被拒后的降级     | 页内 toast、标题栏角标改为 `(3) 新消息`，不再弹窗骚扰   |

```javascript
// 场景：同一条业务只保留一条通知，点击后聚焦窗口并跳到消息页
if (Notification.permission === 'granted') {
  const notification = new Notification('新消息', {
    body: '你有 3 条未读评论',
    tag: 'unread', // 相同 tag：新通知顶掉旧的，不会堆积
    requireInteraction: true, // 不自动消失，等用户处理
    badge: '/img/badge.png', // 移动端状态栏小图标
    data: { url: '/messages' },
  })
  notification.onclick = () => {
    window.focus()
    window.location.href = notification.data.url
    notification.close()
  }
}
```

> 通知**不保证被展示**：系统「勿扰模式」、专注助手、用户手动关闭渠道都会吞掉它。所以它只能当**锦上添花**，关键信息仍要在页面内留痕（消息中心、角标）。

## 3. Web Share API：原生分享

调用操作系统**原生分享面板**，将文本、链接、文件分享给其他应用，避免第三方 SDK 的集成成本。

**核心接口：**

[width(34,66)]

| 成员                        | 说明                             |
| --------------------------- | -------------------------------- |
| `navigator.share(data)`     | 调起系统分享面板（返回 Promise） |
| `navigator.canShare(data?)` | 检测是否支持分享指定数据         |

**分享数据 `data` 字段：**

[width(12,88)]

| 字段    | 说明                           |
| ------- | ------------------------------ |
| `title` | 标题                           |
| `text`  | 分享文本                       |
| `url`   | 分享链接                       |
| `files` | 文件数组（需 `canShare` 检测） |

### 3.1 分享文本与链接

```javascript
const shareBtn = document.querySelector('#share')

shareBtn.addEventListener('click', async () => {
  try {
    await navigator.share({
      title: 'CoreFront-EndConcepts',
      text: '一套前端核心概念知识库',
      url: 'https://sentibeitaokong.github.io/CoreFront-EndConcepts/',
    })
    console.log('分享成功')
  } catch (err) {
    if (err.name !== 'AbortError') {
      // 用户取消不算错误
      console.error('分享失败', err)
    }
  }
})
```

### 3.2 分享文件

```javascript
const file = new File(['hello world'], 'hello.txt', { type: 'text/plain' })

if (navigator.canShare && navigator.canShare({ files: [file] })) {
  await navigator.share({
    title: '分享文件',
    files: [file],
  })
}
```

- 必须由**用户手势**触发，且是**瞬时激活（transient activation）**：放到 `setTimeout`、`await` 之后（耗时超过约 5 秒）再调用会抛 `NotAllowedError`。
- 返回的 Promise 在用户完成分享后 resolve，用户取消则 reject 且 `name === 'AbortError'`。
- `navigator.canShare()` 可提前检测能力，避免直接抛错；但它**只对 `files` 有意义**——不传 `files` 时基本恒为 `true`，别拿它判断「桌面端能不能分享」。
- `files` 与 `url` / `text` **不要同时给**：部分实现（尤其 Safari）会直接报错，分享文件时只给 `title` + `files`。
- 仅支持 HTTPS，且主要受移动端（Android / iOS Safari）支持，桌面端 Chrome 支持有限。

### 3.3 Web Share Target（接收分享）

允许 PWA 成为系统的**分享目标**，在 Web App Manifest 中声明：

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 3.4 高频场景

[width(28,72)]

| 场景                         | 做法                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| 分享文章 / 落地页            | `{ title, text, url }`，失败静默（用户取消是常态）                |
| 分享生成的内容（海报、账单） | Canvas → `toBlob()` → `new File()`，配 `canShare({ files })` 检测 |
| 分享用户选中的本地文件       | 直接把 `input[type=file].files[0]` 放进 `files`                   |
| 桌面端 / 不支持时降级        | 回退为「复制链接 + 提示已复制」，见 1.4 与第 6 节                 |

```javascript
// 场景：把 canvas 生成的海报分享出去，不支持分享文件的设备降级为下载
async function sharePoster(canvas) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  const file = new File([blob], 'poster.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: '我的海报', files: [file] })
  } else {
    downloadFile(file) // 降级：直接下载
  }
}
```

## 4. 其他常用浏览器 API 速览

[width(25,23,52)]

| API                     | 用途                               | 关键接口                                                    |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------- |
| **Fullscreen API**      | 全屏展示                           | `element.requestFullscreen()` / `document.exitFullscreen()` |
| **Screen Wake Lock**    | 保持屏幕常亮（如视频播放）         | `navigator.wakeLock.request('screen')`                      |
| **Page Visibility API** | 判断页面可见性、后台暂停任务       | `document.visibilityState` / `visibilitychange`             |
| **Vibration API**       | 触发设备震动                       | `navigator.vibrate(200)`                                    |
| **Battery Status API**  | 读取电池信息（已受限，需谨慎使用） | `navigator.getBattery()`                                    |
| **Geolocation API**     | 获取地理位置                       | `navigator.geolocation.getCurrentPosition()`                |
| **Screen Orientation**  | 控制/监听屏幕方向                  | `screen.orientation.lock('portrait')`                       |
| **Permissions API**     | 查询/请求权限状态                  | `navigator.permissions.query({ name: 'geolocation' })`      |
| **StorageManager**      | 查询存储配额、申请持久化           | `navigator.storage.estimate()` / `persist()`                |
| **View Transitions**    | 视图切换的原生过渡动画             | `document.startViewTransition(() => update())`              |
| **Network Information** | 读取网络类型 / 有效带宽            | `navigator.connection.effectiveType` / `change` 事件        |

### 4.1 保持屏幕常亮

```javascript
let wakeLock = null
async function keepAwake() {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      console.log('屏幕锁已释放')
    })
  } catch (err) {
    console.error('无法保持常亮', err)
  }
}
// 不再需要时
await wakeLock?.release()
```

### 4.2 页面可见性感知

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseAnimation() // 页面隐藏时暂停动画/轮询
  } else {
    resumeAnimation()
  }
})
```

### 4.3 全屏展示

```javascript
const el = document.querySelector('#video')
await el.requestFullscreen() // 进入全屏
await document.exitFullscreen() // 退出全屏

document.addEventListener('fullscreenchange', () => {
  console.log(document.fullscreenElement ? '已全屏' : '已退出全屏')
})
```

### 4.4 地理位置

```javascript
navigator.geolocation.getCurrentPosition(
  pos => console.log(pos.coords.latitude, pos.coords.longitude),
  err => console.error(err.code, err.message),
  { enableHighAccuracy: true, timeout: 5000 },
)
```

### 4.5 权限查询

```javascript
const status = await navigator.permissions.query({ name: 'geolocation' })
status.addEventListener('change', () => {
  console.log('权限状态变为', status.state) // 'granted' | 'denied' | 'prompt'
})
```

### 4.6 设备震动与屏幕方向

```javascript
navigator.vibrate(200) // 震动 200ms
navigator.vibrate([100, 50, 100]) // 节奏：震 100 → 停 50 → 震 100

await screen.orientation.lock('portrait') // 锁定竖屏
screen.orientation.addEventListener('change', () => {
  console.log(screen.orientation.type)
})
```

### 4.7 低网速与视图切换

```javascript
// 场景：弱网下降级——2G/3G 时不预加载大图、不自动播放视频
const connection = navigator.connection
if (connection?.effectiveType.includes('2g')) {
  document.body.classList.add('low-bandwidth')
}
connection?.addEventListener('change', () => {
  console.log('网络类型变为', connection.effectiveType) // '4g' / '3g' / 'slow-2g'
})

// 场景：主题切换、路由切换的原生过渡动画（不支持时回调照常执行）
if (document.startViewTransition) {
  document.startViewTransition(() => {
    document.documentElement.classList.toggle('dark')
  })
} else {
  document.documentElement.classList.toggle('dark')
}
```

> **注意：** `navigator.connection` 在 Safari / Firefox 上缺失，只能做**渐进增强**，不能作为功能开关；判断弱网更通用的兜底是「请求耗时 + `saveData`」。`startViewTransition()` 的回调**同步执行**，DOM 变更要在回调内部完成，异步操作需先 `await` 好再进回调。

### 4.8 存储配额与持久化

浏览器在磁盘紧张时会**自动清理** IndexedDB、Cache Storage 等「尽力而为」的存储。要避免离线数据、大文件缓存被清掉，需要主动查询配额并申请持久化：

```javascript
// 查询已用 / 可用配额（字节）
const { usage, quota } = await navigator.storage.estimate()
console.log(
  `已用 ${(usage / 1024 / 1024).toFixed(1)}MB，配额约 ${(quota / 1024 / 1024).toFixed(0)}MB`,
)

// 申请持久化：授予后浏览器不会自动清除本源的存储
const granted = await navigator.storage.persist() // → true 表示已授予
await navigator.storage.persisted() // 查询当前是否处于持久化状态
```

> 是否授予由浏览器按**站点参与度**（是否安装为 PWA、是否加入书签、访问频率）自动决定，无法用代码强求；被拒时不要反复调用。

## 5. 权限模型与最佳实践

- **安全上下文**：上述 API 几乎都要求 HTTPS（或 localhost 例外）。
- **用户手势**：通知授权、分享、剪贴板写入等敏感操作需在点击/键盘事件中触发。
- **渐进增强**：先检测 `'api' in navigator` 或 `navigator.canShare()`，不可用时优雅降级。
- **尊重用户选择**：权限被拒绝后不要反复弹窗骚扰，应引导用户去系统设置开启。
- **AbortError 不是失败**：分享、通知等场景中用户主动取消是正常交互，应静默处理。
- **iframe 要显式放行**：跨源 iframe 内使用这些能力，需宿主页面在 `allow` 属性或响应头 `Permissions-Policy` 中开白名单，否则子框架里 API 直接不可用。
- **`denied` 不可逆**：代码无法把已拒绝的权限改回来，`navigator.permissions.query()` 只能**读**状态并监听 `change`（`request()` 至今只有 Firefox 实现），所以「什么时候弹窗」比「怎么弹」更重要。

## 6. 使用示例：复制 + 分享 + 通知组合

```javascript
// 场景：文章页的「分享」按钮——优先原生分享，降级复制链接，再发系统通知反馈
async function shareArticle() {
  const shareData = {
    title: document.title,
    text: '推荐一篇文章给你',
    url: location.href,
  }

  // 1) 优先走原生分享
  if (
    navigator.share &&
    (!navigator.canShare || navigator.canShare(shareData))
  ) {
    try {
      await navigator.share(shareData)
      return
    } catch (err) {
      if (err.name !== 'AbortError') console.error('分享失败', err)
    }
  }

  // 2) 降级：复制链接
  await navigator.clipboard.writeText(location.href)

  // 3) 反馈：系统通知
  if (Notification.permission === 'granted') {
    new Notification('已复制链接', { body: location.href })
  }
}
```

> 分享被用户取消（`AbortError`）属于正常交互，应静默处理；复制与通知则需前置能力/权限检测。

## 7. 常见问题 (FAQ)

### 7.1 为什么 `navigator.clipboard` 是 `undefined`？

- **不在安全上下文**：`http://` 的线上域名下整个 `navigator.clipboard` 都不存在，必须 HTTPS（`localhost` 是例外）。
- **在跨源 iframe 里**：宿主页面没写 `allow="clipboard-read; clipboard-write"`，能力被策略拦掉。
- **页面失去焦点**：部分浏览器只在文档聚焦时暴露剪贴板 API，切换标签页后调用会失败。

### 7.2 复制 / 读取剪贴板为什么报 `NotAllowedError`？

最常见的原因是**脱离用户手势**：`fetch` 回数据后再复制，手势的「有效期」已经过了。稳妥写法是**先 `await` 数据、再进点击回调**，或把数据提前备好：

```javascript
// ❌ 点击 → 请求 → 复制：手势已失效
btn.onclick = async () => {
  await navigator.clipboard.writeText(await fetchText())
}

// ✅ 请求 → 点击 → 复制：手势内只做同步到微任务的一步
const text = await fetchText()
btn.onclick = () => navigator.clipboard.writeText(text)
```

读取（`readText` / `read`）还多一层：需要 `clipboard-read` 权限，Chrome 会弹授权框，被拒后就是 `NotAllowedError`——这类场景更适合用`paste` 事件方案。

### 7.3 `Notification.requestPermission()` 被拒绝后还能再弹吗？

不能。`denied` 之后代码**无法再次触发授权弹窗**(重复调用直接返回 `denied`，不弹框),只能引导用户到浏览器**站点设置 / 地址栏图标**里手动改回。所以别在页面加载时就弹，应该在用户点了「开启提醒」按钮时再申请。

### 7.4 为什么 iOS 上通知和分享都不灵？

- **通知**：iOS Safari 只对**已添加到主屏幕的 PWA**（`display: standalone`）开放 Web Push，普通网页里 `Notification` 直接不可用；且必须通过 Service Worker 的 `showNotification()` 触发，不能 `new Notification()`。
- **分享**：`navigator.share` 在 iOS Safari 可用，但**必须由用户手势触发**，且 `files` 需要 iOS 15+。

移动端整体原则：**先能力检测，再决定按钮是否渲染**，不要假设桌面端的行为一致。

### 7.5 用户点了取消，为什么 `navigator.share()` 是 reject？

这是规范设计：`AbortError` 表示「用户主动放弃」，属于**正常交互**而非故障。所以只对非 `AbortError` 的错误做上报，取消分支要么静默、要么给个中性提示（如「已取消分享」），不要报错弹窗。

### 7.6 `document.execCommand('copy')` 还能用吗？

**已废弃但仍可作降级兜底**：所有主流浏览器仍保留实现，因为老环境没有 `navigator.clipboard`。它需要页面里有可选中元素（临时的 `textarea`）、且要同步执行。新代码一律优先 `navigator.clipboard`，把 `execCommand` 留在 `catch` / 能力检测失败的分支里。

### 7.7 通知已经发出，但用户说没看到，怎么排查？

按可能性从高到低：

- **权限是 `default` 而非 `granted`**：`new Notification()` 会直接抛错，先读 `Notification.permission`。
- **被系统吞了**：勿扰模式、专注助手、系统通知中心折叠都会影响展示——页面内的消息中心才是可靠落点。
- **被自己的 `tag` 顶掉了**：同一 `tag` 的新通知会替换旧的，若业务把 `tag` 写死且频繁触发，用户只会看到最新一条。
- **iOS 上压根没走 PWA**

### 7.8 这些 API 在本地开发能用吗？

**大部分能**：`localhost` 被视作安全上下文，剪贴板、通知、权限查询都能正常调试。例外是两类——**依赖 HTTPS 的能力**（如 Service Worker 推送在部分浏览器仍要求可信证书）和**依赖设备的能力**（分享面板、震动、屏幕方向锁在桌面浏览器上本身就是空实现）。调试移动端能力建议用真机 + `chrome://inspect` 远程调试，而不是桌面端模拟。
