# iframe 微前端方案

`iframe` 是浏览器原生提供的页面嵌入能力。作为微前端领域最早且物理隔离性最强的实现方式，它利用完全独立的浏览上下文（Browsing Context）承载子应用，实现了纯粹的“**系统级黑盒集成**”。在面对庞大且历史包袱沉重的企业级架构时，iframe 依然是降本增效的终极防线。

## 1. 核心定位与架构特点

iframe 并非一个应用层面的“**框架**”，而是一种底层原生隔离策略。它天然隔绝 JS 上下文与 CSS 作用域，完全规避了现代微前端框架在处理底层构建产物（尤其是 Vite 基于 ESM 的模块机制）时的各种兼容性灾难。

| 维度         | 表现特征                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| **物理隔离** | **极强**。原生浏览器级沙箱，DOM 树、JS 运行时、CSS 作用域、全局对象彻底隔离。                                      |
| **构建兼容** | **完美**。无视底层打包工具，Vite 的纯 ESM 产物、Rollup 的闭包产物或老旧的 Webpack 产物均可直接运行，无需特殊改造。 |
| **接入成本** | **极低**。主应用仅需维护容器 DOM 与 URL 分发，子应用基本实现真正的“零改造”。                                       |
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

## 4. 核心痛点与攻克方案

iframe 的物理隔离是一把双刃剑，它带来了极致的安全性，也制造了强烈的体验割裂。以下是四大核心痛点的实战解法：

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

## 6. 场景决策架构

| ✅ 绝佳适用场景 (系统级黑盒嵌入)                                                       | ❌ 严禁使用场景 (组件级深度融合)                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **异构历史系统集成**：零预算重构老旧后台，只需在统一门户展示。                         | **强数据联动业务**：主子应用需要共享海量 Vue/React 响应式状态或频繁跨应用触发底层框架逻辑。 |
| **第三方外部 SaaS 接入**：嵌入独立的 BI 数据大屏、外购客服工作台面板。                 | **首屏极致性能诉求**：ToC 业务或单页面需要同时组合挂载 5 个以上的微型模块。                 |
| **低信任度代码运行**：需要执行不受信任的用户级动态脚本或第三方插件，必须依赖原生沙箱。 | **要求极致沉浸体验**：要求全局单页路由丝滑过渡、跨模块元素拖拽交互（Drag & Drop）。         |
