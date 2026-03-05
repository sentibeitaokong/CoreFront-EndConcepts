---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 自定义指令(Custom Directives)

## 1. 核心概念与应用边界

自定义指令的核心使命只有一个：**对普通的 DOM 元素进行底层的、直接的、可复用的微观操作。**

当你发现你需要反复获取 DOM 节点去执行如 `el.focus()`、操作 Canvas、强制重绘特定样式、或者拦截底层键盘事件时，不要把这些恶心的 DOM 操作散落在各个组件的 `onMounted` 里，把它们封装成指令！

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **微观交互行为** | 自动获取焦点 (`v-focus`)、点击元素外部触发关闭 (`v-click-outside`)。 |
| **底层功能侵入** | 按钮防抖节流限制 (`v-debounce`)、图片懒加载 (`v-lazy`)、一键复制到剪贴板 (`v-copy`)。 |
| **系统级控制** | 细粒度的按钮级别权限控制 (`v-permission`)、自动上报埋点 (`v-track`)。 |
| **第三方原生库整合** | 将纯 DOM 驱动的库（如 jQuery 插件、视频播放器、某些图表库）极其优雅地集成进 Vue。 |

## 2. 核心 API 与钩子函数生命周期

一个自定义指令本质上是一个包含几个特定**生命周期钩子函数**的普通 JavaScript 对象。

这些钩子函数的命名与 Vue 3 组件的生命周期极其相似，它们都会接收被绑定的**真实 DOM 元素 (`el`)** 作为第一个参数。

```js
const myDirective = {
  // 1. 在绑定元素的 attribute 前，或事件监听器应用前调用
  created(el, binding, vnode, prevVnode) {},
  
  // 2. 在元素被插入到 DOM 前调用
  beforeMount(el, binding, vnode, prevVnode) {},
  
  // 3. 在绑定元素的父组件及他自己的所有子节点都挂载完成后调用 (最常用 🌟)
  mounted(el, binding, vnode, prevVnode) {},
  
  // 4. 绑定元素的父组件更新前调用
  beforeUpdate(el, binding, vnode, prevVnode) {},
  
  // 5. 在绑定元素的父组件及他自己的所有子节点都更新后调用 (常用 🌟)
  updated(el, binding, vnode, prevVnode) {},
  
  // 6. 绑定元素的父组件卸载前调用
  beforeUnmount(el, binding, vnode, prevVnode) {},
  
  // 7. 绑定元素的父组件卸载后调用 (极其重要，用于清理事件监听 🌟)
  unmounted(el, binding, vnode, prevVnode) {}
}
```

### 2.1 钩子函数参数详解 (`binding`)
每个钩子函数都会接收一个非常重要的 `binding` 对象，它包含了指令传递过来的所有动态信息：
指令的钩子会传递以下几种参数：

* `el`：指令绑定到的元素。这可以用于直接操作 DOM。
* `binding`：一个对象，包含以下属性。
  * `value`：传递给指令的值。例如在 `v-my-directive`="1 + 1" 中，值是 2。
  * `oldValue`：之前的值，仅在 `beforeUpdate` 和 `updated` 中可用。无论值是否更改，它都可用。
  * `arg`：传递给指令的参数 (如果有的话)。例如在 `v-my-directive:foo` 中，参数是 `"foo"`。
  * `modifiers`：一个包含修饰符的对象 (如果有的话)。例如在 `v-my-directive.foo.bar` 中，修饰符对象是 `{ foo: true, bar: true }`。
  * `instance`：使用该指令的组件实例。
  * `dir`：指令的定义对象。
* `vnode`：代表绑定元素的底层 `VNode`。
* `prevVnode`：代表之前的渲染中指令所绑定元素的 `VNode`。仅在 `beforeUpdate` 和 `updated` 钩子中可用。

比如你写了 `<div v-color:background.fast="'red'"></div>`
*   `binding.value`: 传递给指令的值（此例为 `'red'`）。
*   `binding.arg`: 传递的参数（此例为 `'background'`）。
*   `binding.modifiers`: 包含修饰符的对象（此例为 `{ fast: true }`）。


## 3. 企业级自定义指令实战

### 3.1 极简级：自动获取焦点 (`v-focus`)
在 Vue 中，如果你只是想在 `mounted` 钩子里简单做一件事，可以直接**传一个函数**（它等同于在 `mounted` 和 `updated` 中触发）。

```vue
<script setup>
// 在 <script setup> 中，任何以 'v' 开头的驼峰命名变量，都会自动被注册为局部自定义指令！
const vFocus = {
  mounted: (el) => el.focus()
}
</script>

<template>
  <input v-focus />
</template>
```

### 3.2 交互级：点击外部关闭 (`v-click-outside`)
这是写各种 Dropdown 下拉菜单、弹窗组件时必备的神器。

```js
// src/directives/clickOutside.js
export const clickOutside = {
  mounted(el, binding) {
    // 1. 创建一个处理函数，判断点击的靶点是否在当前 el 元素内部
    el._clickOutsideHandler = (event) => {
      // 如果点击的是自身内部，直接退出
      if (el.contains(event.target)) return;
      
      // 如果点击了外部，且使用者传了回调函数进来，则执行它
      if (typeof binding.value === 'function') {
        binding.value(event);
      }
    };
    // 2. 将事件挂载到 document 上
    document.addEventListener('click', el._clickOutsideHandler);
  },
  
  // 🚨 极其重要：物理卸载防内存泄漏
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler);
    delete el._clickOutsideHandler;
  }
}
```

```vue
<!-- 使用方式 -->
<template>
  <div class="dropdown" v-click-outside="closeMenu">
    点击我外面我会关闭
  </div>
</template>
```

### 3.3 系统级：按钮权限控制 (`v-permission`)
在后台管理系统中，通过角色控制某个按钮是否显示，是极其常见的高频需求。

```js
// src/directives/permission.js
export const permission = {
  mounted(el, binding) {
    const { value: requiredRole } = binding; // 获取指令绑定的角色要求
    
    // 模拟从 Pinia 或 LocalStorage 获取当前用户的角色
    const currentUserRole = 'editor'; // 假设当前是普通编辑

    if (requiredRole && Array.isArray(requiredRole)) {
      const hasPermission = requiredRole.includes(currentUserRole);

      // 如果没有权限，直接暴力的从 DOM 树中将其彻底铲除
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(`请指定角色权限，如 v-permission="['admin', 'editor']"`);
    }
  }
}
```

```vue
<!-- 全局注册后使用 -->
<button v-permission="['admin']">只有超级管理员能看到这个按钮</button>
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么官方文档说“能用组件解决的，绝不用自定义指令”？
*   **答**：这是设计哲学的边界。
    *   **职责越界**：如果你的指令开始去创建大量新的 DOM 节点、或者往目标元素内部强行 `innerHTML` 插入一大堆 HTML 结构，这说明你走偏了。这种与视图渲染强相关的操作，组件和插槽 (`Slot`) 是更好、更具有响应式安全保障的手段。
    *   **可维护性差**：指令里的逻辑是“黑盒”操作原生 DOM 的。如果过度滥用，会破坏 Vue 数据驱动视图的直觉，导致日后重构时 Bug 频发。
    *   **核心准则**：指令**只做辅助性、外挂性的底层 DOM API 操作**。

### 4.2 我把自定义指令绑在一个封装好的 Vue 组件上，为什么不生效？
*   **答**：在 Vue 3 中，指令绑定到组件上的行为发生了一个巨大的“破坏性变更”。
    *   在 Vue 2 中，指令默认会穿透并作用在组件的**根元素 (Root Node)** 上。
    *   在 Vue 3 中，如果你绑定的子组件**有多个根元素（Fragments 碎片机制）**，Vue 将会彻底懵逼，不知道这个指令到底该绑在哪个根节点上，于是**直接抛出警告，指令完全失效**。
    *   **避坑指南**：官方强烈建议：**不要把自定义指令直接绑定在 Vue 组件标签上！** 始终将指令绑定在最底层的原生的 HTML 标签（如 `<div>`, `<input>`）上，以保证绝对的安全和确定性。

### 4.3 `v-show` 也是指令，我自己写的 `v-permission` 删除了元素，这俩有什么区别？
*   **答**：区别在于控制层级和恢复机制。
    *   `v-show` 是 Vue 官方深度集成的，它仅仅是修改了 DOM 的 `style.display` 属性，并且通过闭包保留了它原来的 `display` 状态，随时可以改回来。
    *   我们在 `v-permission` 中使用的是 `el.parentNode.removeChild(el)` 物理拔除节点。这种做法在权限控制中非常安全，因为权限在一次会话中通常不改变。但如果你试图用这种拔除操作去实现一个高频开关的功能，拔掉之后你是很难再用指令把它“插”回原位的（因为 `parentNode` 里已经没它的坑位了），此时应该使用原生的 `v-if` 让 Vue 的编译器去接管销毁与重建。

### 4.4 为什么有时我的指令里的 `el` 拿到的样式高度/宽度不正确？
*   **答**：**执行时机的时差问题**。
    *   `mounted` 钩子虽然保证了该元素已经被插入了真实的 DOM 树中，但如果该元素的子节点包含大量需要去远端拉取的网络图片，或者该元素受到页面中某些复杂 CSS 动画的牵连，此时你获取的高度可能是不准确的。
    *   **解决方案**：遇到与物理渲染强相关的操作，在指令内也要包裹一次 `nextTick` 或者使用 `setTimeout(fn, 0)` 强制把计算延后。如果在监听复杂的尺寸变化，建议引入更现代的 `ResizeObserver` API，并在 `unmounted` 中销毁它。
