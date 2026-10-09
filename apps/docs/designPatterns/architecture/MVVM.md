---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# MVVM 架构模式 (Model-View-ViewModel)

## 1. 核心概念与特性

**MVVM (Model-View-ViewModel)** 是现代前端开发（尤其是单页应用 SPA）中最具统治力的架构模式。它是对经典 MVC 和 MVP 模式的革命性演进。

它诞生的核心使命只有一个：**彻底消灭繁琐的、命令式的 DOM 操作代码，让开发者只需关注“**数据（状态）的逻辑**”，而无需关心“**数据是如何渲染到页面上的**”。**

Vue.js 就是在设计上深受 MVVM 启发（虽然没有完全死板地遵守其所有教条）的典型代表。

[width(16,17,67)]

| 核心模块      | 中文名称                 | 职责与特性                                                                                                                                                                                                                                |
| :------------ | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model**     | **模型 (数据层)**        | 纯粹的业务数据与逻辑（如从后端 API 获取的 JSON 对象、本地的状态数据）。在 Vue 中对应 `data` / `state`。                                                                                                                                   |
| **View**      | **视图 (表现层)**        | 用户看到的 HTML 结构界面。它是数据模型的一种视觉呈现。在 Vue 中对应 `<template>`。                                                                                                                                                        |
| **ViewModel** | **视图模型 (桥梁/引擎)** | **MVVM 的灵魂。** 它是连接 View 和 Model 的自动化引擎。它负责将 Model 的数据转化为 View 能显示的格式，并监听 View 的用户交互以自动更新 Model。在 Vue 3 中对应组件实例：`<script setup>` 里的响应式状态，加上这个组件自己的渲染 `effect`。 |

一句话定义：MVVM 把“**数据与视图的同步**”交给 ViewModel 自动完成，开发者只描述“**数据是什么**”，不再手写“**怎么改 DOM**”。

[width(13,87)]

| 维度        | 具体表现                                                                                                            |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| ✅ **优点** | 声明式渲染，几乎告别手工 DOM 操作；数据与视图解耦，UI 逻辑可测试；双向绑定让表单开发效率极高。                      |
| ❌ **缺点** | 双向绑定的“**魔法**”让数据流向不直观，出 bug 难定位；响应式系统有内存与性能开销；只适用于有明确 View 层的 UI 场景。 |

**该用 / 不该用**

[width(41,15,44)]

| 场景                                   | 建议      | 原因                                                      |
| :------------------------------------- | :-------- | :-------------------------------------------------------- |
| 表单密集型后台、CRUD 中后台系统        | ✅ 该用   | 双向绑定能大幅减少样板代码。                              |
| 数据频繁变化、需要状态驱动 UI 的界面   | ✅ 该用   | 响应式自动更新，无需手动同步。                            |
| 以计算/算法为主、几乎没有 UI 的模块    | ❌ 不必用 | 没有 View 可绑定，MVVM 的价值为零。                       |
| 要求极致可控、可预测数据流的超大型应用 | ⚠️ 需配合 | 单靠双向绑定易失控，通常再叠加单向数据流（Redux/Pinia）。 |

### 1.1 MVVM 的核心魔法：数据绑定 (Data Binding)

MVVM 与 MVC/MVP 的**本质区别**在于 ViewModel 内部包含了一个强大的**数据绑定器 (Binder)**。

- **声明式渲染**：在 View 中，我们只需要通过特殊的模板语法（如 `{{ message }}` 或 `v-bind`）声明“**这里需要显示什么数据**”。
- **自动化同步**：
  - **Data -> View（响应式）**：当 Model 里的数据被修改时，ViewModel 会自动侦测到，并**自动**修改 DOM（不需要你写 `document.getElementById`）。
  - **View -> Data（双向绑定）**：当用户在界面上的输入框（如 `v-model`）打字时，ViewModel 会自动捕获事件，并**自动**把用户输入的新值写回 Model 里。

## 2. 深入理解 MVVM 的底层实现原理 (以 Vue 3 为例)

Vue 3 把这件事拆成四块，串起来是一条完整的链路：

**`Proxy` 拦截读写（数据劫持）→ `effect` + `track` / `trigger` 收集并触发依赖 → 调度器微任务批量排队 → 组件的渲染 `effect` 重跑 → `patch` 按标记只改变化的 DOM。**

### 2.1 数据劫持：`reactive` 与 `Proxy`

把普通的 JS 对象变成“**响应式**”的，靠的是 `reactive()` 里的 `Proxy`。

- `reactive(obj)` 返回一个 `Proxy` 代理，拦截 `get`、`set`、`has`、`deleteProperty`、`ownKeys` 等操作：读属性时在 `get` 里收集依赖，写属性时在 `set` 里触发更新。
- 相比 Vue 2 用 `Object.defineProperty()` **递归改写每一个属性**，`Proxy` 代理的是**整个对象**：
  - 新增 / 删除属性、`arr[0] = x`、`arr.length = 0`、`Map` / `Set` 的读写都能侦测到，不再是 `Vue.set` / `Vue.delete` 的天下；
  - 嵌套对象**访问到才递归代理**（惰性），初始化时不必一次走完整棵数据。
- `ref(x)` 走另一条路：返回带 `value` 存取器的 `RefImpl` 实例（不是 `Proxy`），读写 `value` 时手动调用同一套 `track` / `trigger`，所以模板外必须写 `.value`；传进去的是对象时，内部会再用 `reactive` 包一层。
- `Reflect` 是 `Proxy` 的搭档：统一用 `Reflect.get(target, key, receiver)` / `Reflect.set(...)` 执行默认行为，保证 `this` 仍指向代理对象，避免依赖收集错位。

### 2.2 依赖收集：`effect` 与 `track` / `trigger`

剥掉模板和 DOM，Vue 3 的响应式内核小到可以手写出来：

```js
// 极简版 Vue 3 响应式内核：effect + track + trigger
let activeEffect = null
const targetMap = new WeakMap() // WeakMap<目标对象, Map<属性名, Set<effect>>>

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let deps = depsMap.get(key)
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect) // 正在执行的 effect 就是这份数据的依赖
}

function trigger(target, key) {
  const deps = targetMap.get(target)?.get(key)
  deps?.forEach(fn => fn())
}

function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key) // 读的时候顺手登记依赖
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const ok = Reflect.set(obj, key, value, receiver)
      trigger(obj, key) // 写的时候通知依赖
      return ok
    },
  })
}

function effect(fn) {
  activeEffect = fn
  fn() // 先跑一次，读到的属性都会被 track 收集
  activeEffect = null
}

const state = reactive({ count: 0 })
effect(() => console.log('count 变了：', state.count))
state.count++ // 触发 set -> trigger -> 重新执行上面的 effect
```

- **`effect(fn)`**：把 `fn` 包成一个 `ReactiveEffect` 实例并立即执行一次，执行期间 `activeEffect` 指向它自己。
- **`track(target, key)`**：`fn` 里每读到一个响应式属性，`Proxy` 的 `get` 就会调用它，把当前的 `activeEffect` 记进那张全局表——“**哪个对象的哪个属性，被哪些 effect 依赖**”。
- **`trigger(target, key)`**：`Proxy` 的 `set` 里调用它，从表里取出对应的 `Set<effect>` 逐个执行。
- 表用 `WeakMap` 打头，目标对象被回收时整条依赖记录会自动释放，不会造成内存泄漏。

### 2.3 模板编译：从 `<template>` 到渲染函数

Vue 3 把带 `{{ }}` / `v-` 指令的模板在**构建时**编译成一个 `render` 函数（返回虚拟 DOM / VNode），而不是像 Vue 2 那样在运行时解析 DOM 字符串。真正的性能差别在编译器顺手做的这几件事：

- **`PatchFlags`**：给动态节点打上标记（如 `TEXT`、`PROPS`、`CLASS`），更新时直接按标记比对对应字段，不必逐层递归整棵树。
- **静态提升 (hoistStatic)**：纯静态节点只创建一次 VNode 并复用；**事件缓存 (cacheHandlers)** 让 `@click` 的回调不被反复重建。
- **Block Tree**：动态节点被收集进 block，更新时只遍历这些动态节点。

也就是“**编译时优化 + 运行时按标记更新**”。Vue 2 的编译产物只有 render 函数，运行时只能全量 diff，这正是 Vue 3 渲染性能提升的主要来源。

### 2.4 触发更新：调度器与渲染 `effect`

数据变了之后，Vue 3 并不会立刻同步地改 DOM：

- 每个组件实例都有一个**渲染 effect**（内部是 `componentUpdateFn`），它读到的响应式数据都会被 `track` 收集。
- 这个渲染 effect 带一个 `scheduler`（`queueJob`）：`trigger` 不直接执行 effect，而是把 `instance.update` 推进微任务队列、去重后统一执行——同步连着改 10 次数据，也只会重新渲染一次。
- 队列在 `Promise.then` 里冲刷，`nextTick()` 返回的正是这次冲刷的 Promise。这就是“**改完数据立刻读 DOM 读不到最新值，得 `await nextTick()`**”的原因。
- 渲染 effect 重跑得到新 VNode 后，交给 `patch()` 与旧 VNode 对比，结合 `PatchFlags` 只更新真正变化的属性与文本，而不是重绘整棵 DOM。

至此链路闭合：`state.count++` → `Proxy.set` → `trigger` → 调度器排队 → 组件渲染 effect 重跑 → `patch` 改 DOM。而所谓“**双向绑定**”的另一半 `v-model`，只是 `:value` 加 `@input` 的语法糖——把用户输入写回数据，再走同一条链路。

### 2.5 关键 API 与高频易错点

MVVM 的“**魔法**”完全是靠 JS 原生 API 拼出来的，理解它们比背结论更重要：

- **`Proxy`（Vue 3 的引擎）**：可拦截 `get` / `set` / `deleteProperty` 等 13 种操作，天然支持新增属性与数组下标赋值，且能懒代理、按需递归，性能更好。
- **`Reflect`**：`Proxy` 的黄金搭档，用 `Reflect.get/set` 执行默认行为，保证 `this` 指向正确。
- **解构会丢响应式**：`const { count } = reactive(state)`、或把响应式属性当普通值传出去，拿到的都是快照；要拆解请用 `toRefs`（Pinia 里用 `storeToRefs`），或者干脆保持对象引用。
- **`reactive` 只认对象**：传基本类型无效，基本类型一律用 `ref`；`ref` 在模板里自动解包，在 JS 里必须写 `.value`。
- **`shallowRef` / `markRaw`**：`shallowRef` 只对 `.value` 整体替换响应，`markRaw` 直接跳过代理；图表实例、第三方类对象、纯展示的大数据量用它们，能省掉大量依赖收集开销。
- **`Object.freeze` 仍然有效**：被冻结的对象不会被 `reactive` 代理，同样能拿来做纯展示的大数据量。
- **`v-model`**：本质是 `:value` 加 `@input` 的语法糖，Vue 3 中由 `modelValue` / `update:modelValue` 组成，还支持 `v-model:foo` 一次绑定多个；弄懂它，自定义组件里才不会绑错事件名。

> 易错点：选项式 API 里，组件的 `data` 必须是函数而不是对象，否则多个组件实例会共享同一份状态——这是面试与线上事故的双重高发点。改用 `<script setup>` 后每个实例各自执行一次 `setup`，这个问题就自然消失了。

## 3. 手写极简版 MVVM (实现双向绑定)

为了加深理解，我们只保留响应式内核，再补上一个极简的“**组件**”，就能跑通一条完整的双向绑定链路。

```html
<!-- View 视图层 -->
<div id="app">
  <input type="text" id="inputBox" />
  <p>您输入的是：<span id="textDisplay"></span></p>
</div>
```

```js
// ===== 1. 响应式内核：与 2.2 完全一致，为了本节能独立阅读再贴一遍 =====
let activeEffect = null
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let deps = depsMap.get(key)
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect)
}

function trigger(target, key) {
  targetMap
    .get(target)
    ?.get(key)
    ?.forEach(fn => fn())
}

function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      Reflect.set(obj, key, value, receiver)
      trigger(obj, key)
      return true
    },
  })
}

function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = null
}

// ===== 2. Model 数据层 =====
const state = reactive({ message: 'Hello MVVM' })

// ===== 3. View 视图层 =====
const inputEl = document.getElementById('inputBox')
const spanEl = document.getElementById('textDisplay')

// ===== 4. ViewModel：一个把数据写进 DOM 的渲染 effect =====
// 它读到了 state.message，于是自动成为这份数据的依赖；
// 之后 message 一变，trigger 就会让它重跑，DOM 随之刷新。
effect(() => {
  inputEl.value = state.message
  spanEl.textContent = state.message
})

// ===== 5. 双向绑定的另一半：View -> Data =====
// 这就是 v-model 的真相——`:value` 加 `@input`
inputEl.addEventListener('input', e => {
  state.message = e.target.value // 赋值触发 trigger，上面的渲染 effect 自动重跑
})
```

> 对照真实 Vue 3：这里的 `effect` 相当于**组件的渲染 effect**，`trigger` 之后的排队与批量刷新交给**调度器**，而把“**重跑渲染函数**”变成“**只改变化的 DOM**”的是 **`patch`**。

## 4. 典型应用场景

MVVM 是 Vue、Angular、小程序以及部分 React 生态库的共同底色，落地场景遍地都是。

[width(23,39,38)]

| 场景                | 代表实现                                         | 用到的 MVVM 能力               |
| :------------------ | :----------------------------------------------- | :----------------------------- |
| 中后台表单与列表    | Vue + Element Plus / Ant Design Vue              | `v-model` 双向绑定、响应式渲染 |
| 数据看板 / 实时大屏 | Vue + ECharts，数据由 WebSocket 推送             | 数据一变视图自动刷新           |
| 移动端 / 小程序     | uni-app、微信小程序、Vue 3                       | 模板声明式渲染 + 响应式        |
| 桌面端 / 跨平台     | Electron + Vue、Angular                          | ViewModel 与原生渲染层解耦     |
| 组件库的受控组件    | 表单组件对外暴露 `v-model` 或 `value`+`onChange` | Data ↔ View 自动同步的对外接口 |
| 可视化编辑器        | 拖拽库内部的状态同步                             | 状态驱动 UI，避免直接操作 DOM  |

> 记忆锚点：只要“**状态**”和“**界面**”需要频繁、细粒度地互相同步（尤其是表单），MVVM 就是最省心的选择。

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 经典面试题：MVC 和 MVVM 到底有什么本质区别？

- **控制权的反转**：在 MVC 中，Controller 掌握着生杀大权，它必须**手动**去监听各种事件，然后**手动**调用修改 DOM 的方法，充满了命令式代码。在 MVVM 中，ViewModel 是一个自动化的黑盒，通过**双向数据绑定**机制，实现了数据和视图的自动同步，开发者完全从 DOM 操作中解放出来，写的是声明式代码。
- **耦合度**：MVC 中的 View 和 Model 之间往往存在错综复杂的相互调用（尤其前端）。而 MVVM 中的 View 和 Model 是绝对物理隔离的，它们完全不知道对方的存在，全靠 ViewModel 在中间暗中搬运。

### 5.2 双向数据绑定（Two-way Binding）和单向数据流（One-way Data Flow）矛盾吗？

**这是理解前端架构极易混淆的概念，它们并不矛盾，因为它们作用的层级不同。**

- **双向数据绑定（如 Vue 的 `v-model`）**：这通常指的是在**单一组件内部**，表单输入框 (View) 与其绑定的变量 (Model) 之间的便捷通信机制。它本质上是 `value` 绑定和 `input` 事件监听的语法糖。
- **单向数据流**：这指的是在 **组件与组件之间（父子通信）** 或 **全局状态管理（Vuex/Redux）** 时的架构纪律。数据永远只能从父组件流向子组件，子组件绝对禁止直接修改父组件传来的 Props 数据；或者全局状态只能通过提交特定的 Action/Mutation 来修改。
- **总结**：在宏观架构和组件通信上坚持单向数据流以保证数据变更可追溯；在微观的表单处理上使用双向绑定提升开发体验。

### 5.3 为什么 React 社区经常声称自己不是 MVVM 框架？

- React 官方确实将自己定义为构建 UI 的库（即 MVC 中的 V）。
- **理念差异**：MVVM（Vue/Angular）推崇的是**响应式机制**（数据是被拦截和监听的，改了哪就精确更新哪）；而 React 推崇的是**不可变数据 (Immutable)** 和**状态机机制**。在 React 中，你不能直接 `this.state.name = 'x'`（这不会触发任何拦截），必须显式调用 `setState` 或 `dispatch` 产生一个全新的数据对象，然后 React 拿着新对象和旧对象去粗暴地从头开始对比（Diff），找出不同后再更新 DOM。
- React 没有内置类似 Vue 那种“**魔法般**”的双向数据绑定拦截引擎，因此通常不被严格归类为 MVVM 架构。

### 5.4 既然 MVVM 的双向绑定这么爽，为什么大型应用里经常会导致性能问题？

- **依赖收集的内存开销**：响应式为“**精准更新**”付出的代价，是**整棵数据都要被代理、每一对“属性 → effect”都要常驻内存**。Vue 2 的做法更重——递归给每个属性装 getter/setter，并为每个依赖创建 `Watcher`，一万条复杂数据就是上万个 `Watcher`。
- **规避指南**：对纯粹用于展示、绝不会再修改的海量数据，就别让它进响应式系统——用 `markRaw` / `shallowRef` 标一下，或者直接 `Object.freeze(data)` 冻结（`reactive` 遇到不可扩展的对象会原样返回，不建代理），省掉整棵数据的依赖收集开销。
