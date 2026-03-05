---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 传送门(`<Teleport>`)

## 1. 核心概念与应用边界

在现代前端开发中，组件化极大提升了代码的复用性。但有些时候，组件的**逻辑层级**与**物理 DOM 层级**会发生极其尴尬的冲突。

> **痛点场景：**
> 你在一个极其深层、内部嵌套了十几个 `<div>` 的子组件里，写了一个 `<MyModal>` 全屏弹窗。
> 按照常理，弹窗的 DOM 会被渲染在这个深层 `<div>` 内部。如果这个深层 `<div>` 或者它的某个祖先元素设置了 `overflow: hidden`、`z-index` 或者特殊的 `transform`，你的弹窗就会被无情地**截断、遮挡、或者定位错乱**，根本无法做到真正的“全屏居中覆盖”。

**`<Teleport>`** 就是 Vue 3 为了彻底解决这个 CSS 物理层级冲突而发明的内置组件。
它的核心魔法是：**在逻辑上，组件依然存在于原来的组件树中（共享状态、接收 Props）；但在物理 DOM 上，它能瞬间将自身的 DOM 节点“传送”到 HTML 文档的任意其他位置（比如直接塞进 `<body>` 里）。**

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **全局弹窗 (Modal / Dialog)** | 强制将弹窗 DOM 渲染到 `<body>` 底部，彻底摆脱所有父级 CSS 的层叠上下文束缚，确保 `z-index` 最高。 |
| **全局提示 (Toast / Notification)** | 与弹窗同理，通常会传送到一个专门预留的 `<div id="toast-container">` 中统一管理。 |
| **跟随式悬浮框 (Tooltip / Popover)** | 尤其是当触发元素在滚动区域内时，将悬浮框传送到外部可以避免被裁切。 |

## 2. 核心 API 与实战用法

`<Teleport>` 的用法极其简单直观，它的核心属性只有一个：**`to`**。

### 2.1 基础传送 (传送到 body)

这是最常见的写法，直接把内容传送到 HTML 的 `<body>` 标签作为其最后一个子元素。

```vue
<script setup>
import { ref } from 'vue'
const isOpen = ref(false)
</script>

<template>
  <div class="very-deep-nested-component">
    <button @click="isOpen = true">打开弹窗</button>

    <!-- 这里的 to 接收一个 CSS 选择器 -->
    <Teleport to="body">
      <!-- 这个 div 会在物理 DOM 上出现在 </body> 闭合标签之前 -->
      <div v-if="isOpen" class="modal-mask">
        <div class="modal-content">
          <p>我是一个弹窗！我虽然写在这里，但我人在 body 里！</p>
          <button @click="isOpen = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* 因为传到了 body，这里的绝对定位是相对于整个浏览器的 */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.modal-content { background: white; padding: 20px; border-radius: 8px; }
</style>
```

### 2.2 传送到自定义容器

除了 `body`，你可以传送到页面上任何一个已经存在的 DOM 节点。这在搭建复杂的应用布局（如把侧边栏的某个操作按钮直接传送到顶部 Header 栏中）时极其有用。

```html
<!-- public/index.html (或者你的基础模板) -->
<body>
  <div id="app"></div>
  <!-- 提前预留一个专门放 Toast 消息的坑位 -->
  <div id="toast-container" class="fixed top-5 right-5 z-50"></div>
</body>
```

```vue
<!-- 在你的任意深层业务组件中 -->
<template>
  <!-- 使用 CSS ID 选择器精确定位 -->
  <Teleport to="#toast-container">
    <div class="toast-message">操作成功！</div>
  </Teleport>
</template>
```

### 2.3 禁用传送 (`disabled`)

有时候你可能希望在桌面端宽屏时让组件正常渲染在父容器里，而在移动端窄屏时把它传送到外面作为全屏弹窗。你可以使用动态的 `disabled` 属性来随时开关传送门。

```vue
<script setup>
import { ref, onMounted } from 'vue'

const isMobile = ref(false)

onMounted(() => {
  // 简单的屏幕宽度检测
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>

<template>
  <!-- 如果 disabled 为 true，DOM 就留在原地不传送；为 false 时才传送到 body -->
  <Teleport to="body" :disabled="!isMobile">
    <div class="responsive-panel">
      无论我在哪里，我的状态都是同步的。
    </div>
  </Teleport>
</template>
```

### 2.4 **多个 `Teleport` 共享目标**

一个可重用的 `<Modal>` 组件可能同时存在多个实例,对于此类场景，多个 `<Teleport>` 组件可以将其内容挂载在同一个目标元素上，而顺序就是简单的顺次追加，后挂载的将排在目标元素下更后面的位置上，但都在目标元素中。

```vue
<Teleport to="#modals">
  <div>A</div>
</Teleport>
<Teleport to="#modals">
  <div>B</div>
</Teleport>

<!--渲染结果-->
<div id="modals">
  <div>A</div>
  <div>B</div>
</div>
```

### 2.5 **延迟解析的 `Teleport`**

在 `Vue 3.5` 及更高版本中，我们可以使用 `defer`推迟 `Teleport` 的目标解析，直到应用的其他部分挂载。这允许 `Teleport` 将由 `Vue` 渲染且位于组件树之后部分的容器元素作为目标：

```vue
<!--延迟解析的 Teleport  Vue3.5+-->
<Teleport defer to="#late-div">...</Teleport>

<!-- 稍后出现于模板中的某处 -->
<div id="late-div"></div>
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 既然 DOM 被传送到外面的 `<body>` 里了，那我原来组件里的 `<style scoped>` 还能控制它的样式吗？
*   **答**：**完美支持！这正是 `<Teleport>` 最优雅的地方。**
    *   `<Teleport>` 改变的**仅仅是真实 DOM 挂载的物理位置**，它丝毫没有改变 Vue 组件树的**逻辑层级**。
    *   在 Vue 编译模板时，只要你的代码写在当前组件的 `<template>` 里，Vue 就会给它打上当前组件特有的属性标记（比如 `data-v-1a2b3c`）。因此，你写在这个组件底部的 `<style scoped>` 依然能精确命中传送到外面去的元素。

### 3.2 传送到外面的组件，还能通过 `Provide` / `Inject` 拿到爷爷组件的数据吗？
*   **答**：**完全可以。**
    *   理由同上。逻辑上，这个被传送的组件依然是那个爷爷组件的孙子。Vue 的虚拟 DOM 树（VNode Tree）并没有因为 `<Teleport>` 而发生断裂。因此所有的组件通信机制（`Props`, `Emits`, `Provide/Inject`, `$refs` 甚至 Vue Router 的上下文）统统照常工作，没有任何阻碍。

### 3.3 为什么页面报错 `[Vue warn]: Invalid Teleport target: #toast-container`？
*   **答**：这是使用 `<Teleport>` 时最容易踩的坑：**目标容器必须先于传送动作存在,可以使用`defer`属性延迟解析**
    *   **原因**：当 Vue 试图将你的组件挂载到 `#toast-container` 时，如果这个容器是在当前组件之后才被渲染出来的（或者是由另一个被 `v-if` 控制的组件异步生成的），Vue 去查 DOM 树发现“查无此坑”，就会抛出这个警告，并且你的内容将不会被渲染。
    *   **避坑指南**：必须确保 `to="xxx"` 所指向的目标 DOM 节点，在当前 `<Teleport>` 组件**挂载 (`mounted`) 之前就已经真实存在于页面的 HTML 中**。（这也是为什么大家最喜欢传送到 `body`，因为 `body` 永远在最开始就存在）。


### 3.4 多个不同的组件同时往同一个 `to="body"` 目标发送 `<Teleport>`，会覆盖吗？
*   **答**：**不会覆盖，而是会优雅地追加 (Append)。**
    *   Vue 允许极其多个 `<Teleport>` 实例瞄准同一个目标容器。
    *   它们的 DOM 节点会按照组件的**挂载顺序**，依次被追加 (append) 到目标容器的内部。这就是为什么你可以放心地在多个组件里同时呼出 Toast 提示，它们会自动在 `#toast-container` 内部按照先后顺序排成一列。
