# 常用浏览器 API：Clipboard、Notifications、Web Share

现代浏览器提供了一批与用户系统深度交互的能力接口，覆盖剪贴板、系统通知、原生分享等场景。这些 API 大多遵循「**权限申请 → 用户手势触发 → 异步调用**」的安全模型，且大多要求页面处于**安全上下文**（HTTPS 或 localhost）。

## 1. Clipboard API：剪贴板读写

Clipboard API 提供了**异步**读写系统剪贴板的接口，取代了过时且受限的 `document.execCommand('copy')`。

**核心接口：**

| 方法                                         | 说明                            |
| -------------------------------------------- | ------------------------------- |
| `navigator.clipboard.writeText(text)`        | 写入纯文本                      |
| `navigator.clipboard.readText()`             | 读取纯文本                      |
| `navigator.clipboard.write(ClipboardItem[])` | 写入多类型内容（富文本 / 图片） |
| `navigator.clipboard.read()`                 | 读取多类型内容                  |

### 1.1 权限与安全

- 写入文本通常**无需显式授权**，但需在**用户手势**（点击等）中触发。
- 读取文本、写入/读取二进制（如图片）需申请 `clipboard-read` / `clipboard-write` 权限。
- 必须运行于安全上下文（HTTPS）。

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

## 2. Notifications API：系统通知

用于向用户展示系统级桌面通知，即使页面未聚焦也能触达。

**核心接口：**

| 成员                                | 说明                                       |
| ----------------------------------- | ------------------------------------------ |
| `Notification.permission`           | 权限状态：`granted` / `denied` / `default` |
| `Notification.requestPermission()`  | 请求授权（返回 Promise）                   |
| `new Notification(title, options?)` | 页面内创建通知                             |

**构造选项 `options`：**

| 选项     | 说明                                |
| -------- | ----------------------------------- |
| `body`   | 通知正文                            |
| `icon`   | 图标 URL                            |
| `tag`    | 相同 `tag` 替换旧通知（防重复堆积） |
| `data`   | 自定义数据，点击通知时可读取        |
| `silent` | 静默（不震动 / 不响铃）             |

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

## 3. Web Share API：原生分享

调用操作系统**原生分享面板**，将文本、链接、文件分享给其他应用，避免第三方 SDK 的集成成本。

**核心接口：**

| 成员                        | 说明                             |
| --------------------------- | -------------------------------- |
| `navigator.share(data)`     | 调起系统分享面板（返回 Promise） |
| `navigator.canShare(data?)` | 检测是否支持分享指定数据         |

**分享数据 `data` 字段：**

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

**关键点：**

- 必须由**用户手势**触发。
- 返回的 Promise 在用户完成分享后 resolve，用户取消则 reject 且 `name === 'AbortError'`。
- `navigator.canShare()` 可提前检测能力，避免直接抛错。
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

## 4. 其他常用浏览器 API 速览

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

## 5. 权限模型与最佳实践

- **安全上下文**：上述 API 几乎都要求 HTTPS（或 localhost 例外）。
- **用户手势**：通知授权、分享、剪贴板写入等敏感操作需在点击/键盘事件中触发。
- **渐进增强**：先检测 `'api' in navigator` 或 `navigator.canShare()`，不可用时优雅降级。
- **尊重用户选择**：权限被拒绝后不要反复弹窗骚扰，应引导用户去系统设置开启。
- **AbortError 不是失败**：分享、通知等场景中用户主动取消是正常交互，应静默处理。

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
