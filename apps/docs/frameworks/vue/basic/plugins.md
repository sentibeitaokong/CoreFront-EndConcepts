---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 插件系统(Plugins)

## 1. 核心概念与应用场景

在 Vue 的生态系统中，组件（Components）负责局部的 UI 构建，组合式函数（Composables）负责局部的逻辑复用，而**插件 (Plugins) 则是负责为 Vue 应用程序添加“全局级”功能的终极武器**。

当你发现某项功能需要在整个应用的无数个组件中被调用，或者你需要深度修改 Vue 实例的行为时，就需要编写一个插件。著名的 `Vue Router`、`Pinia`、`Element Plus` 等，在底层都是一个 Vue 插件。

[width(31,69)]

| 插件的典型能力                            | 具体应用场景                                                                                                            |
| :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **注册全局组件 / 指令**                   | 将公司的基础 UI 组件库（如 `<MyButton>`）或全局权限指令 (`v-permission`) 批量注册，让每个页面都能免 `import` 直接使用。 |
| **提供应用级数据 (`provide`)**            | 注入全局的配置对象、主题管理器、国际化 (i18n) 语言字典，让极其深层的组件也能通过 `inject` 拿到。                        |
| **挂载全局实例属性 (`globalProperties`)** | 替代 Vue 2 的 `Vue.prototype.$xxx`。比如挂载一个全局的弹窗消息方法 `$message`，或 HTTP 请求工具 `$http`。               |
| **整合第三方非 Vue 库**                   | 将那些没有专为 Vue 设计的第三方库（如日志上报 SDK、分析工具）优雅地包裹一层并植入 Vue 体系。                            |

## 2. 插件的核心机制与编写实战

**一个插件可以是一个拥有 `install()` 方法的对象，也可以直接是一个作为 `install` 函数的普通函数。**

当你调用 `app.use(myPlugin)` 时，Vue 实际上就是去寻找并执行了这个 `install` 函数。

### 2.1 `install` 方法的签名

它会接收两个参数：

- **`app`**：由 `createApp()` 生成的当前 Vue 应用实例。你拥有在这个实例上为所欲为的最高权限。
- **`options`**：用户在调用 `app.use(plugin, options)` 时传进来的自定义配置选项。

### 2.2 实战：编写一个极简的多语言国际化 (i18n) 插件

这个案例涵盖了插件最常用的三大能力：提供全局方法、提供 `Provide` 注入、处理配置选项。

:::code-group

```js [src/plugins/i18n.js]
// 一个用于翻译文本的极其简易的字典
const defaultDictionary = {
  en: { hello: 'Hello!', login: 'Login' },
  zh: { hello: '你好！', login: '登录' },
}

export default {
  // 插件必须暴露 install 方法
  install: (app, options) => {
    // 1. 获取传入的配置字典，如果没有则用默认的
    const dictionary = options?.dictionary || defaultDictionary
    const currentLang = options?.lang || 'zh'

    // 2. 核心功能函数：根据 key 取出对应语言的文本
    const translate = key => {
      // 简单的点路径解析 (如 'hello')
      return dictionary[currentLang]?.[key] || key
    }

    // --- 能力 1：挂载到全局属性上 ---
    // 允许在任何组件的 <template> 里直接使用 $t('hello')
    app.config.globalProperties.$t = translate

    // --- 能力 2：使用 provide 提供给 setup 语法 ---
    // 允许在任何组件的 <script setup> 里通过 inject 拿到翻译函数
    app.provide('i18n', {
      t: translate,
      currentLang,
    })

    // --- 能力 3：附带注册一个全局的辅助组件 ---
    app.component('TranslateText', {
      props: ['path'],
      // 渲染函数写法
      render() {
        return translate(this.path)
      },
    })
  },
}
```

```js [src/main.js]
import { createApp } from 'vue'
import App from './App.vue'
import i18nPlugin from './plugins/i18n'

const app = createApp(App)

// 注入插件，并传入选项
app.use(i18nPlugin, {
  lang: 'zh',
  dictionary: {
    zh: { hello: '你好啊，Vue 插件！' },
    en: { hello: 'Hello, Vue Plugin!' },
  },
})

app.mount('#app')
```

```vue [MyComponent.vue]
<script setup>
import { inject } from 'vue'

// 方式 1：通过 inject 获取 (推荐，更利于 TS 推导和解耦)
const i18n = inject('i18n')
console.log('在 JS 中获取翻译：', i18n.t('hello'))
</script>

<template>
  <div>
    <!-- 方式 2：在模板中直接使用挂载的全局属性 $t -->
    <h1>{{ $t('hello') }}</h1>

    <!-- 方式 3：使用插件附带注册的全局组件 -->
    <TranslateText path="hello" />
  </div>
</template>
```

:::

### 2.3 插件能力速查

#### 2.3.1 **高频属性速查（`app` 实例常用能力）**

[width(20,27,19,34)]

| API                           | 常用写法                                   | 适用场景                        | 注意点                                                     |
| ----------------------------- | ------------------------------------------ | ------------------------------- | ---------------------------------------------------------- |
| `app.config.globalProperties` | `app.config.globalProperties.$http = http` | 给 Options API / 模板挂全局方法 | setup 里拿不到，优先用 `app.provide`；SSR 下防止跨请求污染 |
| `app.provide(key, value)`     | `app.provide('http', http)`                | 组合式 API 全局注入             | 注入 key 建议用 `Symbol` 或 `InjectionKey`                 |
| `app.component(name, comp)`   | `app.component('XButton', Button)`         | 全局注册基础组件                | 全量注册会影响 tree-shaking 与首屏体积                     |
| `app.directive(name, dir)`    | `app.directive('focus', focus)`            | 全局注册高频指令                | 指令名不要带 `v-` 前缀                                     |
| `app.config.errorHandler`     | `app.config.errorHandler = (err) => {}`    | 全局错误上报、兜底 UI           | 只捕获 Vue 渲染 / 生命周期等错误，不替代 `window.onerror`  |
| `app.use(plugin, options)`    | `app.use(i18n, { lang: 'zh' })`            | 安装插件并传配置                | 同一插件重复 `use` 不会重复安装                            |
| `app.runWithContext(fn)`      | `app.runWithContext(() => inject(key))`    | 在 app 上下文内执行函数         | 3.3+；插件里安全使用 `inject`                              |
| `app.config.idPrefix`         | `app.config.idPrefix = 'app-'`             | 统一 `useId()` 前缀             | 3.5+；SSR 下保证 ID 稳定                                   |
| `app.config.warnHandler`      | `(msg, instance, trace) => {}`             | 自定义开发期警告                | 仅开发环境有效                                             |
| `app.config.compilerOptions`  | `{ isCustomElement, delimiters }`          | 运行时编译器配置                | 仅完整版（含编译器）生效                                   |
| `app.version`                 | `app.version`                              | 读取 Vue 版本                   | 用于兼容判断与日志                                         |
| `install(app, options)`       | `export default { install }`               | 自定义插件入口                  | 也可以直接导出一个函数作为插件                             |

#### 2.3.2 **高频场景**

[width(20,41,39)]

| 业务场景       | 推荐写法                                                 | 为什么                                        |
| -------------- | -------------------------------------------------------- | --------------------------------------------- |
| 全局请求封装   | `app.provide('http', http)` + `inject('http')`           | setup 中类型清晰，避免污染 `globalProperties` |
| 国际化         | `app.config.globalProperties.$t` + `app.provide('i18n')` | 模板和 setup 都能使用                         |
| 权限指令       | `app.directive('permission', ...)`                       | 一次注册，全局复用                            |
| 全局错误上报   | `app.config.errorHandler` + Sentry                       | 统一收集组件内异常                            |
| 组件库按需注册 | 只 `app.component` 高频组件                              | 全量注册会让首屏包变大                        |

#### 2.3.3 **高频补充**

- **`install` 保持同步**：`app.use` 不会等待 `install` 返回的 Promise；异步资源用 `provide` + 响应式状态，或显式初始化函数。

```js
import { shallowRef } from 'vue'

export default {
  install(app) {
    // install 保持同步：先把响应式状态提供出去，异步数据稍后再填充
    const messages = shallowRef(null)
    app.provide('i18n', messages)

    fetch('/locales/zh.json')
      .then(res => res.json())
      .then(data => (messages.value = data))
  },
}
```

- **插件选项类型**：用 `Plugin<[Options]>` 标注 `install` 的第二个参数，调用方获得类型提示。

```ts
import type { App, Plugin } from 'vue'

interface Options {
  lang: string
}

export const i18n: Plugin<[Options]> = {
  install(app: App, options: Options) {
    app.provide('lang', options.lang)
  },
}

// 调用方 app.use(i18n, { lang: 'zh' }) 时能拿到选项的类型提示
```

- **插件 vs Composable**：插件面向整个 app（路由、i18n、请求封装）；Composable 面向组件内逻辑复用。

```ts
import { inject, onMounted, ref } from 'vue'

// 插件：面向整个 app，只注册一次
export const httpPlugin = {
  install(app) {
    app.provide('http', createHttp())
  },
}

// Composable：面向组件内逻辑复用，随组件生命周期创建与销毁
export function useUser() {
  const http = inject('http')
  const user = ref(null)

  onMounted(async () => {
    user.value = await http.get('/user')
  })

  return { user }
}
```

- **SSR 安全**：不要用模块级可变单例保存请求状态；每次请求创建 app，插件状态挂在 app 或 `provide` 上。

```ts
import { reactive } from 'vue'

// 错误：模块级可变单例会跨请求共享，SSR 下互相污染
const sharedState = reactive({ user: null })

// 正确：每次请求新建 app 时各自 provide 一份状态
export default {
  install(app) {
    app.provide('requestState', reactive({ user: null }))
  },
}
```

- **按需加载**：全局注册会增大首屏包；组件库优先用 `unplugin-vue-components` 自动按需引入。

:::code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    Components({
      // 模板里写 <el-button>，只有被用到时才自动引入
      resolvers: [ElementPlusResolver()],
    }),
  ],
})
```

:::

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 Vue 3 废弃了 `Vue.prototype.$xxx`，我想挂载全局方法该怎么做？

- **Vue 3 的新解法**：由于 Vue 3 不再有全局统一的 `Vue` 构造函数，而是每个应用拥有独立的 `app` 实例。你必须使用 **`app.config.globalProperties.$http = axios`** 来实现相同的效果。
- **在 `<script setup>` 中如何访问**：这又是一个巨大的坑。由于 `<script setup>` 里**没有 `this`**，所以你不能再 `this.$http` 了！
- **终极避坑指南**：如果你在 Vue 3 中开发，**极其不推荐**继续使用 `globalProperties` 这种“**魔术方法**”。官方强烈建议使用 **`Provide / Inject`** 机制。在插件中 `app.provide('http', axios)`，然后在组件中显式地 `const http = inject('http')`，这才是符合现代架构和 TS 类型推导的正道。

### 3.2 为什么我写的插件，有时候它内部报错了，整个 Vue 应用就白屏崩溃了？

插件通常拥有极其高的执行权限，如果插件逻辑中存在未捕获的异常，会直接炸毁`createApp`的初始化流程。

- **异常捕获边界**：Vue 3 提供了全局错误处理钩子。如果你在编写一个给整个团队使用的核心插件，建议利用 **`app.config.errorHandler`**。
- 在插件的 `install` 方法中，你可以注入或者劫持这个 errorHandler，专门用来收集因为你的插件而导致的奇葩崩溃信息，并做静默处理（如上报给错误监控平台 Sentry），而不是任由页面白屏。

```ts
export default {
  install(app, options) {
    // 安装期间的同步异常不会被 errorHandler 捕获，必须自己兜底
    try {
      app.provide('i18n', createI18n(options))
    } catch (err) {
      reportToSentry(err, { plugin: 'i18n' })
      throw err // 或者降级 provide 一份空实现，避免整个应用白屏
    }

    // 运行期间（渲染 / 生命周期 / watcher）的异常交给全局钩子
    const userHandler = app.config.errorHandler
    app.config.errorHandler = (err, instance, info) => {
      reportToSentry(err, { info, plugin: 'i18n' })
      userHandler?.(err, instance, info) // 保留业务方原有的处理逻辑
    }
  },
}
```

### 3.3 插件的安装顺序重要吗？

**极其重要，尤其是相互依赖的插件。**

- `app.use()` 的执行是**严格按照同步顺序**进行的。
- 如果你写了一个需要调用路由信息的鉴权插件 `AuthPlugin`，并且你在代码里写了：

  ```js
  app.use(AuthPlugin) // 报错，此时 Router 还没安装，拿不到当前路由！
  app.use(router)
  ```

- **设计原则**：好的插件设计应当是**防御性**的。如果你的插件强依赖于另一个核心库（如 Pinia 或 Router），在 `install` 函数中，应该先去探测该依赖是否已挂载到 `app` 实例上，如果没有，应当主动抛出带有明确提示的 Error（如 `[AuthPlugin Error]: Please install Vue Router first.`）。

### 3.4 全局注册了 100 个公共组件，会导致首屏加载极慢吗？

**会！这是初学者极易犯的架构错误。**

- 在插件中使用 `app.component()` 全局注册的组件，即使你在某个页面根本没用到它们，Webpack 或 Vite 在打包时也会认定它们是**应用启动的强依赖**，从而把这 100 个组件全部硬生生地塞进首屏加载的主 JS 文件 (`app.js`) 中，导致严重的体积膨胀和白屏。
- **最佳实践**：不要在入口的插件里傻乎乎地全量加载。对于 UI 组件库，应该使用构建工具的插件（如 `unplugin-vue-components`）来实现**真正的按需自动引入 (Auto Import)**。它能在你写下 `<el-button>` 时，偷偷帮你补上局部的 `import`，彻底抛弃臃肿的全局注册插件模式。
