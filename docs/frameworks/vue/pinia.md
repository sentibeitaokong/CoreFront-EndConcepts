---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 全局状态管理：从 [Vuex](https://vuex.vuejs.org/zh/) 到 [Pinia](https://pinia.vuejs.org/zh/introduction.html)

## 1. 核心概念与应用边界

在 Vue 中，当应用规模变得复杂时，如果有**数十个毫不相干的页面组件（非父子关系）需要共享同一个数据（例如：当前登录的用户信息、全局的主题偏好、购物车里的商品列表）**，继续使用 `Provide/Inject` 或乱飞的事件总线 (EventBus) 将会导致代码逻辑像意大利面条一样难以追踪。

**全局状态管理库 (State Management)** 相当于在整个 Vue 应用的顶部，建立了一个“公共数据仓库”。任何组件都可以直接去仓库里拿数据（读），或者向仓库发送修改数据的请求（写）。

### 1.1 架构演进：Vuex 的没落与 Pinia 的登基

长期以来，**Vuex** 都是 Vue 官方的标配。但由于其架构较老，在 Vue 3 (Composition API 和 TS) 时代显得格格不入。
**Pinia** 最初是作为 Vuex 5 的实验性项目孵化的，因为其设计极其优雅，最终被官方“扶正”，成为现在 Vue 的官方默认状态管理库。

| 对比维度 | Vuex 3/4 | Pinia (现代标准 🌟) |
| :--- | :--- | :--- |
| **API 风格** | Options API 风格 (厚重) | Composition API 风格 (极简，天然贴合 Vue 3) |
| **TypeScript 支持** | **极差**。需要写大量恶心的类型推导，且容易丢失提示。 | **完美**。无需任何额外配置，天生支持极其精确的代码提示。 |
| **模块化架构** | **嵌套树形架构**。只有一个根 Store，下面挂载 moduleA, moduleB，命名空间 (`namespaced: true`) 极其繁琐。 | **扁平化架构**。没有根 Store 的概念，可以直接定义无数个独立的 Store (如 `userStore`, `cartStore`)，互相调用极其简单。 |
| **Mutations 机制** | **强制包含**。同步操作必须用 `mutations`，异步操作必须用 `actions`，心智负担极重。 | **彻底废弃 `mutations`**！只有 `state`, `getters`, `actions`。`actions` 内部既可以写同步，也可以写异步代码，极其爽快。 |


## 2. Pinia 核心实战 (Setup 风格)

### 2.1 定义一个 Store
把 `Store` 想象成一个普通的组合式函数 (`Composable`)。

```javascript
// src/store/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 1. 定义并导出 Store (命名规范：useXxxStore)
// 第一个参数 'counter' 是该 store 的全局唯一 ID
export const useCounterStore = defineStore('counter', () => {
  
  // 🍎 State (状态)：用 ref 或 reactive 定义
  const count = ref(0)
  const name = ref('Eduardo')

  // 🍏 Getters (计算属性)：用 computed 定义
  const doubleCount = computed(() => count.value * 2)

  // 🍉 Actions (动作/方法)：定义普通的 function，支持同步和异步 (async)
  function increment() {
    count.value++
  }
  
  async function fetchUser() {
    const res = await api.getUser()
    name.value = res.name
  }

  // 🚨 必须暴露出去，组件才能使用
  return { count, name, doubleCount, increment, fetchUser }
})
```

### 2.2 在组件中使用 Store

```vue
<script setup>
import { useCounterStore } from '@/store/counter'
import { storeToRefs } from 'pinia'

// 1. 实例化 Store
const counterStore = useCounterStore()

// ❌ 错误：直接解构会失去响应式！
// const { count } = counterStore 

// ✅ 正确 1：如果一定要解构，必须使用 storeToRefs (只针对 state 和 getter)
const { count, doubleCount } = storeToRefs(counterStore)

// ✅ 正确 2：Action 函数可以直接解构，不受影响
const { increment } = counterStore

function add() {
  // 可以直接调用 action
  increment()
  // 也可以非常暴力地直接修改 state！(Pinia 允许这种操作)
  // counterStore.count++ 
}
</script>

<template>
  <div>
    <!-- 在模板中直接使用 store 对象 -->
    <p>计数: {{ counterStore.count }}</p>
    <p>双倍: {{ doubleCount }}</p>
    <button @click="add">增加</button>
  </div>
</template>
```

### 2.3 Store 之间的相互调用

因为 Pinia 是扁平化架构，A Store 想用 B Store 的数据，简直像喝水一样简单。

```javascript
// src/store/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user' // 直接引入另一个 Store

export const useCartStore = defineStore('cart', () => {
  function checkout() {
    // 实例化另一个 Store
    const userStore = useUserStore()
    
    // 直接拿着它的数据用
    if (userStore.isLoggedIn) {
      console.log(`${userStore.name} 结算成功！`)
    } else {
      console.log('请先登录！')
    }
  }
  return { checkout }
})
```

## 3. 终极扩展：Plugins (插件系统) 深度定制

插件系统是 Pinia 提供给高级工程师的一把“手术刀”。通过编写插件，你可以在**每一个 Store 被创建的那一刻**进行拦截，往里面动态挂载全局属性、改写方法、甚至重构底层逻辑。

### 3.1 编写插件的核心 API (`context`)

当你向 `pinia.use(plugin)` 传入一个函数时，这个函数会在每个 Store 初始化时执行，并收到一个极其强大的 `context` 对象。

```javascript
// MyPiniaPlugin.js
export function myPiniaPlugin(context) {
  // 你可以从 context 中剥离出四个核心对象：
  const { 
    pinia,   // 整个 pinia 根实例
    app,     // 当前 Vue app 的实例 (能拿到 app.config.globalProperties)
    store,   // 🚨 此时正在被创建的那个目标 Store 实例！
    options  // 这个 Store 原始的配置选项 (包括你自定义的各种参数)
  } = context
  
  // 你可以根据 options 判断是否要对这个 store 动刀
  // 或者直接返回一个对象，里面的属性会被合并到所有 store 中！
}
```

### 3.2 动态挂载全局工具 (如 Router)

为了避免在 Store 的业务代码里写恶心的 `import router from '@/router'` 从而导致循环依赖，我们可以在最顶层用插件把 router “硬塞”进每一个 Store 里。

```javascript
// main.js
import { createApp, markRaw } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const pinia = createPinia()

// 注入路由插件
pinia.use(({ store }) => {
  // 🚨 致命防坑：因为 router 内部逻辑极其复杂且对象庞大，
  // 绝不能让 Pinia 的响应式系统去深度劫持它 (会导致死循环爆炸)！
  // 必须使用 markRaw 给它穿上绝缘服，告诉 Vue 不要代理它。
  store.router = markRaw(router)
})

const app = createApp(App)
app.use(router) // 注意挂载顺序，通常先 router 后 pinia
app.use(pinia)
app.mount('#app')
```
*现在，在任意的 Options Store 中你就可以直接 `this.router.push` 了。(注：在 Setup Store 中无法通过 `this` 访问，通常直接 `import router` 更符合现代 ESM 规范)。*

### 3.3  状态持久化 (Pinia Plugin Persistedstate)
这是真实业务中最刚性的需求：**用户一刷新页面，存在 Pinia 内存里的状态全没了（比如登录 token 丢失）**。
以前我们需要手动写 `localStorage.setItem`。现在只需要装一个官方推荐的插件即可。

**1. 安装与注册：**
```bash
npm i pinia-plugin-persistedstate
```
```javascript
// main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // 注入插件
app.use(pinia)
```

**2. 在 Store 中一键开启：**
```javascript
// store/user.js
export const useUserStore = defineStore('user', () => {
  const token = ref('xxxxx')
  return { token }
}, {
  // 🔥 魔法开启！这个 Store 的数据会自动同步到 localStorage
  persist: true 
})
```

**基于 `$subscribe` 实现终极持久化**

```javascript
// 自定义持久化插件 (简易版原理)
export function persistPlugin({ store }) {
  // 1. Store 刚创建时，先去 localStorage 翻一翻有没有它的“前世记忆”
  const savedState = localStorage.getItem(store.$id)
  if (savedState) {
    // 如果有，使用 $patch 强行把记忆覆盖到现在的 state 里
    store.$patch(JSON.parse(savedState))
  }

  // 2. 在它未来的生命中，利用内置的 $subscribe 挂载一个"幽灵监听器"
  // 只要它的 state 发生了哪怕一丝一毫的改变，就会立刻触发这个回调
  store.$subscribe((mutation, state) => {
    // mutation 对象里包含了：是哪个变量变了、怎么变的、新值是多少
    // 立刻将最新的 state 序列化后存入硬盘
    localStorage.setItem(store.$id, JSON.stringify(state))
  }, { detached: true }) // detached: true 保证即使注册插件的组件被销毁了，监听器依然在后台全天候运行！
}
```


## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然能在 Pinia 里随意 `store.count++` 暴改状态，那还要 Actions 甚至架构纪律干嘛？
*   **答**：这是一个极具争议的话题。
    *   **Vuex 时代**：有着极其严格的物理纪律，强迫你必须走 `commit(mutation)` 才能改状态，这为了配合 DevTools 记录时间旅行。
    *   **Pinia 时代**：抛弃了这种物理限制，直接赋值 `store.token = '123'` 是合法的，Vue DevTools 依然能完美追踪。
    *   **架构建议**：虽然 Pinia 不拦你，但在团队协作中，**强烈建议把所有修改状态的逻辑封装在 Actions 函数里**。如果在组件的各个角落里散落着直接修改 State 的代码，排查 Bug 时你依然会绝望。封装在 Actions 里，逻辑高内聚，更利于测试和维护。

### 4.2 为什么我对 Store 里的数据进行了解构赋值，页面就不更新了？
*   **答**：这也是高频新手坑。
    *   **原理**：`Store` 本质上是一个包裹在 `reactive` 里的对象。正如我们在响应式基础章节讲过的，对 reactive 对象进行结构，提取出的基本数据类型会变成死值，彻底脱离底层的 Proxy 代理网。
    *   **避坑方案**：如果你嫌每次写 `userStore.name` 太长，非要解构出 `name`。你**绝对不能用原生解构**，必须包裹一层 **`storeToRefs`**。
    ```javascript
    import { storeToRefs } from 'pinia'
    // 把里面的属性一个个扒出来，变成安全的 ref
    const { count, name } = storeToRefs(counterStore)
    // 此时想改它，必须加 .value 了！
    count.value++ 
    ```

### 4.3 我在路由守卫 (`router.beforeEach`) 里面调用 Store 报错了，提示“Pinia 还未安装”？
*   **答**：这是初始化时序问题。
    *   **原因**：在 `main.js` 中，通常你初始化路由 (`app.use(router)`) 和初始化 Pinia (`app.use(pinia)`) 都在一起。如果在 router 文件的最顶部去 `import` 并实例化 Store，此时 Vue 实例可能还没把 Pinia 挂载进去。
    *   **解决方案**：不要在文件的顶部全局实例化 Store，**必须把 Store 的实例化推迟到路由守卫的回调函数内部**！
    ```javascript
    // ❌ 错误写法：此时 Pinia 可能还没 ready
    // const userStore = useUserStore() 

    router.beforeEach((to, from) => {
      // ✅ 正确写法：在函数执行时，整个 Vue 宇宙早就初始化完毕了，绝对安全
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) return '/login'
    })
    ```

### 4.4 把普通逻辑抽离成 Composable（组合式函数）和写成 Pinia Store 有什么本质区别？我该怎么选？
*   **答**：这是一个非常高级的架构问题。
    *   两者在代码长相上确实极其相似（都是 `import` 后调用函数返回状态）。
    *   **Composable (如 `useMouse`)**：是**局部状态**。你在组件 A 调用一次，组件 B 调用一次，它们会在内存里创建**两份相互独立的**状态副本，互不干扰。
    *   **Pinia Store (如 `useUserStore`)**：是**全局单例 (Singleton) 状态**。不管你在 100 个组件里调用了多少次，Pinia 底层都会保证它们指向的是**内存里同一份数据**。
    *   **选型结论**：如果是可复用的纯逻辑（比如防抖、获取滚动位置），用 Composable；如果是必须跨页面共享的业务数据（比如购物车商品列表），用 Pinia。



