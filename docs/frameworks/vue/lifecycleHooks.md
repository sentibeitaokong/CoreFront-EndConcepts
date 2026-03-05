---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 生命周期钩子 (Lifecycle Hooks)

## 1. 核心概念与生命周期全景图

在 Vue 的世界里，每个组件实例从“出生”（被创建）到“死亡”（被销毁）都要经历一个漫长且严谨的过程。这个过程涵盖了数据初始化、模板编译、DOM 挂载、数据更新重新渲染、以及最终的卸载清理。

![Logo](/lifecycle.png)

### 1.1 Vue 3 (`Composition API`) 生命周期总览


| 执行阶段 | Vue 3 Hook 函数 | 核心意义与最佳实践 |
| :--- | :--- | :--- |
| **创建** | **`setup()` 执行期** | (替代 created) 组件实例被创建，响应式状态 (`ref/reactive`) 已就绪，但 DOM 还未生成。**发起首屏异步数据请求的最佳时机**。 |
| **挂载前** | `onBeforeMount()` | 模板已被编译成渲染函数，但真实的 DOM 节点还未被插入到页面中。极少使用。 |
| **挂载完毕** | **`onMounted()`** | **极其重要！** 真实的 DOM 节点已经插入页面。这是**获取模板引用 (`ref` DOM)、初始化基于 DOM 的第三方库 (如 ECharts, Swiper)、绑定全局事件监听**的唯一安全时机。 |
| **更新前** | `onBeforeUpdate()` | 响应式数据已经发生改变，但虚拟 DOM 还没开始 Diff 打补丁，真实 DOM 还是旧的。可用于在 DOM 更新前手动保存滚动位置等旧状态。 |
| **更新完毕** | `onUpdated()` | 真实 DOM 已经根据新数据更新完毕。（🚨 警告：**绝对不能在这里修改导致再次渲染的响应式状态，否则会引发无限死循环卡死浏览器**）。 |
| **卸载前** | **`onBeforeUnmount()`** | **极其重要！** 组件即将从页面上被移除并销毁。这是**进行物理级“擦屁股”的最后时机**。必须在这里清除 `setInterval` 定时器、销毁第三方库实例、解绑全局 `window.addEventListener`，否则会导致严重的内存泄漏。 |
| **卸载完毕** | `onUnmounted()` | 组件已被彻底销毁，所有的事件监听器、子组件都已被移除。 |

*(此外还有处理 `<keep-alive>` 缓存组件的专用钩子 `onActivated` / `onDeactivated`，以及用于处理异步组件和错误的 `onErrorCaptured`)*

## 2. 生命周期实战应用

在实际业务中，我们通常把业务逻辑拆分到不同的生命周期钩子中执行。

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, onUpdated } from 'vue'
import * as echarts from 'echarts'

const userData = ref(null)
const chartRef = ref(null) // 用于捕获 DOM
let chartInstance = null
let timer = null

// --- 阶段 1: setup (创建期) ---
// 组件刚开始解析，DOM 还不存在。直接发请求，让数据尽早回来。
fetch('/api/user/1').then(res => res.json()).then(data => {
  userData.value = data
})

// --- 阶段 2: onMounted (挂载完毕) ---
onMounted(() => {
  console.log('组件已被挂载，真实 DOM 已经存在！')
  
  // 1. 安全地拿到 DOM 节点，初始化图表
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({ /* ... */ })
  
  // 2. 绑定全局事件监听
  window.addEventListener('resize', handleResize)
  
  // 3. 开启一个轮询定时器
  timer = setInterval(() => {
    console.log('轮询拉取最新消息...')
  }, 5000)
})

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

// --- 阶段 3: onUpdated (更新完毕) ---
onUpdated(() => {
  console.log('数据变化导致 DOM 更新完成了。')
  // 比如列表数据更新后，你可能需要重新计算某个复杂元素的高度
})

// --- 阶段 4: onBeforeUnmount (卸载前，清理战场) ---
onBeforeUnmount(() => {
  console.log('组件即将销毁，开始执行清理工作。')
  
  // 🚨 致命关键：必须清理掉这些依附在全局的东西！
  clearInterval(timer) // 清理定时器
  window.removeEventListener('resize', handleResize) // 解绑全局事件
  if (chartInstance) {
    chartInstance.dispose() // 销毁图表实例释放内存
  }
})
</script>

<template>
  <div>
    <h2>用户信息</h2>
    <p v-if="userData">{{ userData.name }}</p>
    <!-- 图表挂载点 -->
    <div ref="chartRef" style="width: 100%; height: 300px;"></div>
  </div>
</template>
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 经典面试题：Vue 的父子组件生命周期执行顺序是怎样的？
*   **答**：这是一个高频考点，其底层逻辑是“由外向内创建，由内向外挂载”。
    *   **挂载阶段 (Mounting)**：
        1. 父组件 `setup()` / `beforeCreate` / `created`
        2. 父组件 `onBeforeMount` (开始编译父模板，发现里面有个子组件)
        3. 子组件 `setup()` / `beforeCreate` / `created`
        4. 子组件 `onBeforeMount`
        5. **子组件 `onMounted`** (子组件先挂载完成！)
        6. **父组件 `onMounted`** (父组件等所有孩子都挂载好了，自己才算挂载完成)
    *   **更新阶段 (Updating)**：
        *   如果是父组件向子组件传了 props 导致更新：父 `onBeforeUpdate` -> 子 `onBeforeUpdate` -> **子 `onUpdated`** -> **父 `onUpdated`**。
    *   **销毁阶段 (Unmounting)**：
        *   父 `onBeforeUnmount` -> 子 `onBeforeUnmount` -> **子 `onUnmounted`** -> **父 `onUnmounted`**。
    *   **规律总结**：创建时总是先父后子（必须有爸爸才有儿子）；而**完成动作（Mounted, Updated, Unmounted）总是先子后父**（只有小零件都组装/销毁完了，大机器才算组装/销毁完）。

### 3.2 为什么强烈建议在 `setup` (或 Vue2 的 `created`) 里发请求，而不是在 `onMounted` 里？
*   **答**：为了**尽早触发网络请求，减少白屏时间**。
    *   从 `setup` 执行，到经过模板编译、生成虚拟 DOM、再到最终渲染出真实 DOM 触发 `onMounted`，这中间是有一段明显的时间差的。
    *   如果你把 Ajax 请求放在 `onMounted` 里，意味着浏览器必须等整个笨重的 DOM 树全部画完之后，才开始向服务器发请求，这就白白浪费了前期构建 DOM 时的那段时间。
    *   放在 `setup` 里，发请求和渲染 DOM 可以**并行执行**，显著提升首屏业务数据的呈现速度。

### 3.3 为什么在 `onUpdated` 里面执行了修改数据的操作，浏览器直接卡死了？
*   **答**：**触发了无限死循环。**
    *   `onUpdated` 触发的前提是：响应式数据发生了改变，导致 DOM 更新。
    *   如果你在这个钩子里，**又去修改了一个响应式数据**，Vue 就会认为：“又有数据变了！我得重新渲染 DOM”。
    *   渲染完后，再次触发 `onUpdated`，你又修改数据，再次触发渲染……瞬间就把浏览器的调用栈撑爆了。
    *   **避坑指南**：绝对不要在 `onUpdated` 中无条件地修改状态。如果你非要改，必须包裹在一个非常严苛的 `if` 条件判断中，确保它只会执行一次。

### 3.4 为什么我的组件被 `<keep-alive>` 包裹后，来回切换不触发 `onMounted` 和 `onUnmounted` 了？
*   **答**：这正是 `<keep-alive>` 的核心机制——**缓存组件实例，避免重复创建销毁带来的性能损耗**。
    *   被 `<keep-alive>` 包裹的组件，除了第一次进入时会触发 `onMounted` 之外，后续即使离开页面，也不会被销毁（不触发 `onUnmounted`），而是被静静地存放在内存中。
    *   **解决方案**：为了处理这种组件“休眠”和“唤醒”的状态，Vue 提供了两个专门的生命周期钩子：
        1. **`onActivated()`**：每次组件被从缓存中唤醒（进入该页面）时触发。**适合在这里重新拉取最新数据。**
        2. **`onDeactivated()`**：每次组件进入休眠（离开该页面）时触发。**适合在这里暂停视频播放、清除轮询定时器。**
