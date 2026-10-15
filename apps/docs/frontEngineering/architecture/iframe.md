# iframe 微前端方案

`iframe` 是浏览器原生提供的页面嵌入能力。作为微前端领域最早且物理隔离性最强的实现方式，它利用完全独立的浏览上下文（Browsing Context）承载子应用，实现了纯粹的“**系统级黑盒集成**”。在面对庞大且历史包袱沉重的企业级架构时，iframe 依然是降本增效的终极防线。

## 1. 核心定位与架构特点

iframe 并非一个应用层面的“**框架**”，而是一种底层原生隔离策略。它天然隔绝 JS 上下文与 CSS 作用域，完全规避了现代微前端框架在处理底层构建产物（尤其是 Vite 基于 ESM 的模块机制）时的各种兼容性灾难。

[width(13,87)]

| 维度         | 表现特征                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| **物理隔离** | **极强**。原生浏览器级沙箱，DOM 树、JS 运行时、CSS 作用域、全局对象彻底隔离。                                      |
| **构建兼容** | **完美**。无视底层打包工具，Vite 的纯 ESM 产物、Rollup 的闭包产物或老旧的 Webpack 产物均可直接运行，无需特殊改造。 |
| **接入成本** | **极低**。主应用仅需维护容器 DOM 与 URL 分发，子应用基本实现真正的“**零改造**”。                                   |
| **通信链路** | **受限**。无法直接共享内存指针，强依赖 `postMessage` 序列化传输或 URL Query 传参。                                 |
| **用户体验** | **存在割裂风险**。极易出现局部双滚动条，子应用内部弹窗默认无法跳出 iframe 覆盖全局。                               |
| **性能开销** | **较高**。每个实例初始化等同于开启全新的浏览器页签，内存占用大，频繁销毁重建易导致卡顿。                           |

## 2. 主应用接入与生命周期管理 (Vue 3 实战)

主应用作为宿主基座，负责 URL 拼接、鉴权票据下发、加载骨架屏管控，以及极其重要的**内存回收**。

```vue
<template>
  <section class="micro-container" v-loading="isLoading">
    <div v-if="hasError" class="error-fallback">
      子应用加载失败，请检查网络或联系管理员。
    </div>

    <iframe
      v-show="!isLoading && !hasError"
      ref="frameRef"
      class="micro-frame"
      :src="entryUrl"
      sandbox="allow-scripts allow-forms allow-same-origin allow-downloads allow-popups"
      @load="handleIframeLoad"
      @error="handleIframeError"
    />
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const frameRef = ref(null)
const isLoading = ref(true)
const hasError = ref(false)

// 动态拼接鉴权参数或路由下发，避免直接传递明文 Token
const entryUrl = computed(() => {
  const ticket = generateTempAuthTicket()
  return `https://legacy.example.com/credit-approval?ticket=${ticket}&theme=dark`
})

const handleIframeLoad = () => {
  isLoading.value = false
}

const handleIframeError = () => {
  isLoading.value = false
  hasError.value = true
}

// 关键实战防线：销毁时的内存回收
onBeforeUnmount(() => {
  if (frameRef.value) {
    // 强行清空 src 并移除 DOM，防止 iframe 内部闭包和定时器导致的内存泄漏
    frameRef.value.src = 'about:blank'
    frameRef.value.onload = null
    frameRef.value.onerror = null
  }
})
</script>

<style scoped>
.micro-container {
  height: calc(100vh - 64px);
  overflow: hidden;
  position: relative;
}

.micro-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
```

## 3. 跨应用通信规范与架构封装

在企业级应用中，严禁通过 `window.parent` 这种强耦合且极易触发跨域异常的方式进行调用。必须建立基于 `postMessage` 的标准化通信总线，并封装 Promise 化调用。

**通信协议设计原则**：报文必须包含 `MessageID`（用于请求/响应匹配）、`ActionType`（行为类型）、`Payload`（数据负载），并严格校验 `Origin`。

:::details 跨端通信总线 (MessageBridge) 封装实战

```javascript
// 主应用侧封装：MessageBridge.js
export class MessageBridge {
  constructor(iframeWindow, targetOrigin) {
    this.iframeWindow = iframeWindow
    this.targetOrigin = targetOrigin
    this.callbacks = new Map()

    // 监听子应用回传的消息
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  // 发送消息并返回 Promise，彻底告别回调地狱
  request(action, payload, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const messageId = crypto.randomUUID()

      const timer = setTimeout(() => {
        this.callbacks.delete(messageId)
        reject(new Error(`iframe 通信超时: ${action}`))
      }, timeout)

      this.callbacks.set(messageId, { resolve, reject, timer })

      this.iframeWindow.postMessage(
        {
          messageId,
          action,
          payload,
        },
        this.targetOrigin,
      )
    })
  }

  handleMessage(event) {
    if (event.origin !== this.targetOrigin) return

    const { messageId, action, payload, error } = event.data
    if (messageId && this.callbacks.has(messageId)) {
      const { resolve, reject, timer } = this.callbacks.get(messageId)
      clearTimeout(timer)
      this.callbacks.delete(messageId)

      if (error) reject(new Error(error))
      else resolve(payload)
    }
  }
}
```

:::

### 3.1 高频通信 API 速查

跨应用调用的所有能力都收敛在这几个原生 API 上，日常排查问题也基本围绕它们：

[width(35,16,49)]

| API / 事件                                     | 所属对象              | 高频用途与注意事项                                                             |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `postMessage(message, targetOrigin)`           | `Window`              | 跨文档通信的唯一标准入口，第二参数必须写明确 origin，禁止图省事写 `'*'`。      |
| `iframe.contentWindow`                         | `HTMLIFrameElement`   | 获取子文档的 window 引用，是主应用向子应用发消息的起点。                       |
| `iframe.contentDocument`                       | `HTMLIFrameElement`   | 同源时可直接读写子文档 DOM；跨域时返回 `null`，只能退回 `postMessage`。        |
| `window.parent` / `window.top`                 | 子应用侧              | 向上访问宿主窗口；跨域下只能调用 `postMessage`，不能读写对方属性。             |
| `MessageChannel`                               | 构造器                | 创建 `port1` / `port2` 一对专用通道，避免所有报文都挤在全局 `message` 事件上。 |
| `MessagePort`（`start` / `close`）             | `MessageChannel` 产物 | 显式启动与销毁端口，在 iframe 卸载时同步释放，防止监听泄漏。                   |
| `message` 事件（`MessageEvent`）               | `window`              | 由 `event.data` / `event.origin` / `event.source` 取报文，必须校验 `origin`。  |
| `postMessage(message, targetOrigin, transfer)` | `Window`              | 第三参数可转移 `ArrayBuffer`、`MessagePort` 等所有权，实现零拷贝与通道交接。   |

## 4. 核心痛点与攻克方案

iframe 的物理隔离是一把双刃剑，它带来了极致的安全性，也制造了强烈的体验割裂。以下是四大核心痛点的实战解法：

[width(13,87)]

| 痛点场景             | 架构级攻克方案                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **鉴权与登录态割裂** | **拒绝 URL 明文 Token**。在银行业务等高安全场景下，采用 SSO（单点登录）+ Ticket 票据交换机制。主应用通过 URL 传递短期有效、一次性的 Ticket，子应用拦截路由并在自身服务端用 Ticket 换取真正 Session，实现鉴权闭环。                   |
| **路由刷新状态丢失** | **双向拦截与静默同步机制**。子应用内部 `vue-router` 发生变化时，通过通信总线通知基座；基座捕获后，使用 `history.replaceState` 悄悄修改主浏览器 URL 的 Hash 或 Query。当用户 F5 刷新时，基座解析 URL 并精准还原 iframe 的初始 `src`。 |
| **全局弹窗被遮挡**   | **组件渲染权上移**。iframe 内部无法突破物理边界渲染全屏 Dialog。解法：在基座维护一个全局弹窗组件池，子应用遇到需要全屏覆盖的场景时，通过 `postMessage` 将渲染参数委托给基座，由基座代为触发渲染。                                    |
| **白屏与性能损耗**   | **iframe 线程池与预热预建**。不要在每次切换菜单时销毁重建。在内存允许的情况下，使用 `display: none` 或 `v-show` 缓存高频访问的子应用 DOM；对于重型页面，可利用浏览器空闲时间悄悄加载 `about:blank` 的 iframe 进行网络 TCP 预热。     |

:::details 高度自适应与动态布局推平

```javascript
// 子应用侧：利用 ResizeObserver 实时上报内部文档高度，防止出现局部滚动条
const observer = new ResizeObserver(() => {
  window.parent.postMessage(
    {
      action: 'UI_RESIZE',
      payload: {
        // 获取最真实的文档物理高度
        height: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        ),
      },
    },
    'https://main-base.example.com',
  )
})

// 在 Vue 3 mounted 阶段启动监听，在 unmount 阶段销毁
observer.observe(document.body)
```

:::

## 5. 安全防线与权限管控

在金融和企业服务领域，直接暴露 iframe 等同于打开了被黑客点击劫持（Clickjacking）的后门。必须在 Nginx 或 Node.js 接入层配置严格的 HTTP 响应头。

- **`sandbox` 属性沙箱**：在宿主 HTML 标签上严格执行最小权限原则。例如不需要表单提交的报表页，直接移除 `allow-forms`。
- **`CSP (Content-Security-Policy)`**：主应用服务端下发 `Content-Security-Policy: frame-src 'self' https://trusted-sub.com;`，强制浏览器拒绝渲染白名单之外的危险域名。
- **`X-Frame-Options`**：子应用必须具备自我保护意识，在服务端配置 `X-Frame-Options: SAMEORIGIN`（仅允许同域嵌套）或通过 CSP 的 `frame-ancestors` 指定允许嵌套自己的基座域名，防止子系统被非法钓鱼网站恶意嵌入。

### 5.1 `<iframe>` 高频属性速查

下面这些属性决定了隔离强度与交互体验，接入时几乎天天要调：

[width(15,46,39)]

| 属性              | 常用取值                                                                     | 高频用途                                                          |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `src`             | URL                                                                          | 子应用入口地址，变更即触发重新加载，是驱动切换的主开关。          |
| `srcdoc`          | HTML 字符串                                                                  | 内联渲染一段 HTML，常用于低代码预览、邮件模板预览等一次性内容。   |
| `name`            | 字符串                                                                       | 指定浏览上下文名称，供 `<a target="...">` 与 `window.open` 定位。 |
| `sandbox`         | `allow-scripts`、`allow-forms`、`allow-popups`、`allow-same-origin` 等 token | 逐项白名单开放权限，默认全关，是防点击劫持的第一道闸。            |
| `allow`           | `camera; microphone; geolocation` 等                                         | 以权限策略精细开放设备能力，仅按需声明。                          |
| `allowfullscreen` | 布尔                                                                         | 允许内部元素进入全屏，播放器、大屏可视化场景必备。                |
| `loading`         | `eager` / `lazy`                                                             | `lazy` 让非首屏 iframe 延迟加载，缓解首屏性能压力。               |
| `referrerpolicy`  | `no-referrer` / `origin` / `strict-origin-when-cross-origin`                 | 控制 Referer 泄露，跨域嵌入第三方时通常需要收敛。                 |
| `csp`             | 策略字符串                                                                   | 为被嵌入文档追加一层内容安全策略（实验性，需评估浏览器支持）。    |
| `importance`      | `high` / `low` / `auto`                                                      | 提示浏览器加载优先级，旁路模块可置 `low` 让位给核心内容。         |

`sandbox` 的 token 是权限管控的核心，逐个理解才能做到最小授权：

- **`allow-scripts`**：允许执行脚本，现代子应用基本必备。
- **`allow-same-origin`**：保留子文档的同源身份，**与 `allow-scripts` 同时出现时会失去沙箱保护**，仅对完全可信的同源内容开放。
- **`allow-forms` / `allow-modals`**：分别放行表单提交与 `alert` / `confirm` / `prompt`，用不到就一律移除。
- **`allow-popups` / `allow-popups-to-escape-sandbox`**：允许弹窗及其逃逸沙箱，涉及第三方登录跳转时才开放。
- **`allow-downloads`**：允许文件下载，否则子应用的导出功能会被浏览器静默拦截。
- **`allow-top-navigation`**：允许改变顶层地址，默认关闭，防止子应用劫持宿主页面。

## 6. 场景决策架构

[width(49,51)]

| ✅ 绝佳适用场景 (系统级黑盒嵌入)                                                          | ❌ 严禁使用场景 (组件级深度融合)                                                            |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **异构历史系统集成**：零预算重构老旧后台，只需在统一门户展示。                            | **强数据联动业务**：主子应用需要共享海量 Vue/React 响应式状态或频繁跨应用触发底层框架逻辑。 |
| **第三方外部 SaaS 接入**：嵌入独立的 BI 数据大屏、外购客服工作台面板。                    | **首屏极致性能诉求**：ToC 业务或单页面需要同时组合挂载 5 个以上的微型模块。                 |
| **低信任度代码运行**：需要执行不受信任的用户级动态脚本或第三方插件，必须依赖原生沙箱。    | **要求极致沉浸体验**：要求全局单页路由丝滑过渡、跨模块元素拖拽交互（Drag & Drop）。         |
| **第三方能力嵌入**：支付收银台、地图、BI 大屏、客服工单等官方页面直接复用，免去重写 SDK。 | **主子应用需共享响应式数据流**：例如共同编辑一份富文本、实时协同光标、跨模块拖拽联动。      |
| **低代码与代码沙箱预览**：运行用户自写的 HTML / JS，必须靠原生沙箱兜底而非自研隔离。      | **对 SEO 与首屏指标有硬要求**：即便加了 `loading="lazy"`，多个 iframe 仍会拖累 LCP 与 CLS。 |
| **存量系统渐进迁移过渡期**：新老系统长期并存，用 iframe 兜底灰度发布与流量回切。          | **要求移动端手势与滚动统一**：iframe 内部的滚动手感、手势事件无法与宿主合流接管。           |

## 7. 常见问题 (FAQ)

### 7.1 `sandbox` 里同时写 `allow-scripts` 和 `allow-same-origin` 安全吗？

不安全。二者并存时，子文档既能执行脚本又保有同源身份，可以反向操作父级 DOM，甚至移除自身的 `sandbox` 属性，等同于没加沙箱。只有内容完全可信（同源且自研）时才适合这样配置。

### 7.2 跨域 iframe 能直接读父页面的 DOM 吗？

不能。跨域时 `iframe.contentDocument` 返回 `null`，访问 `contentWindow.document` 会抛 `SecurityError`。唯一合规的通道是 `postMessage`，且收发两端都必须校验 `event.origin`。

### 7.3 `postMessage` 的 `targetOrigin` 写 `'*'` 有什么风险？

任何来源的窗口都能收到报文。一旦报文里带票据、Token 或用户信息，就可能被恶意页面窃取。生产代码必须写明确定来源，例如 `https://legacy.example.com`。

### 7.4 为什么 iframe 里的 `alert`、文件下载、全屏都失效了？

这些都是 `sandbox` 默认关闭的能力。`alert` / `confirm` 需要 `allow-modals`，下载需要 `allow-downloads`，全屏需要 `allowfullscreen` 以及内部的 `allow="fullscreen"`。应按需逐项开放，而不是整包放开。

### 7.5 子应用加载成功却看不到内容、高度为 0 怎么办？

先确认宿主是否给 iframe 设了显式高度——iframe 默认是行内元素，高度只有 150px 左右；再排查 CSP 的 `frame-src` 是否把目标域名拦截。跨域下无法测量子文档高度，需要子应用用 `ResizeObserver` 把真实高度 `postMessage` 上报给宿主。

### 7.6 iframe 里的链接为什么把整个宿主页面顶掉了？

多半是给 `sandbox` 开了 `allow-top-navigation`。移除该 token 后，子应用内的跳转只发生在 iframe 内部，不会影响宿主地址栏。

### 7.7 iframe 会造成内存泄漏吗？该怎么回收？

会。子文档里的定时器、事件监听与闭包不会随 DOM 隐藏而释放。销毁时应先把 `src` 置为 `about:blank`、解绑 `onload` / `onerror`，再移除节点，并清理 `message` 事件监听与 `MessagePort`。
