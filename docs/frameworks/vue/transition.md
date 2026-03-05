---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 过渡与动画(`<Transition>`)

## 1. 核心概念与应用边界

在现代前端交互设计中，生硬的 DOM 元素的出现和消失（如弹窗瞬间弹出、路由瞬间切换）会极大地破坏用户体验。

Vue 提供了一个内置的魔法组件 **`<Transition>`**（以及处理列表的 `<TransitionGroup>`）。它的核心使命是：**在 DOM 元素被插入（Enter）或移除（Leave）的过程中，极其优雅地为你自动挂载/卸载 CSS 类名或触发 JavaScript 钩子函数。**

| 核心触发时机 | 详细说明 |
| :--- | :--- |
| **`v-if` / `v-show`** | 元素的条件渲染与显示隐藏的切换。这是 `<Transition>` 最常见的使用场景。 |
| **动态组件切换** | 使用 `<component :is="activeComponent">` 切换不同组件时的转场动画。 |
| **路由切换** | 配合 Vue Router 的 `<router-view>`，实现页面级别平滑的过渡效果。 |
| **特殊的 `key` 改变** | 当元素的 `key` 属性发生变化时，Vue 会认为旧元素被移除了，新元素被插入了，从而触发完整的离开和进入动画。 |

## 2. 核心机制：CSS 过渡类名生命周期

当一个元素被 `<Transition>` 包裹并触发显示/隐藏时，Vue 会在**特定并且极其精确的物理帧 (Frame)** 上，自动为该 DOM 元素添加或移除以下 6 个 CSS 类名。

![Logo](/transition.png)

假设你没有给 `<Transition>` 起名字（即没有设置 `name` 属性），默认的类名前缀是 `v-`：

### 2.1 进入 (Enter) 阶段的三个状态

1.  **`v-enter-from`**：**进入动画的起点**。在元素被插入之前生效，在元素被插入之后的下一帧移除。*(通常在这里写透明度为 0，或者偏移出屏幕)*。
2.  **`v-enter-active`**：**进入动画的生效状态**。在整个进入过渡的阶段中应用。*(这是最关键的类，在这里写 `transition: all 0.5s ease`，定义动画的持续时间和缓动曲线)*。
3.  **`v-enter-to`**：**进入动画的终点**。在 `v-enter-from` 被移除的同时生效，在过渡/动画完成之后移除。*(通常在这里写目标状态，如透明度 1，这其实是元素默认的原始状态，很多时候可以省略不写)*。

### 2.2 离开 (Leave) 阶段的三个状态

与进入阶段完全对称：
1.  **`v-leave-from`**：**离开动画的起点**。在离开过渡触发时立刻生效，下一帧移除。
2.  **`v-leave-active`**：**离开动画的生效状态**。定义离开的过程和持续时间。
3.  **`v-leave-to`**：**离开动画的终点**。在离开过渡触发之后下一帧生效。*(通常在这里写元素最终消失的样子，比如透明度变 0，高度变 0)*。

*(💡 **命名提示**：如果你写了 `<Transition name="fade">`，上面所有的 `v-` 前缀都会被替换为 `fade-`。)*

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

## 3. 实战范例与高级控制

### 3.1 基础的 CSS 过渡 (Fade 渐隐渐显)

```vue
<script setup>
import { ref } from 'vue'
const show = ref(true)
</script>

<template>
  <button @click="show = !show">Toggle</button>

  <!-- 1. 使用 name 属性定义前缀 -->
  <Transition name="fade">
    <p v-if="show">我会优雅地出现和消失</p>
  </Transition>
</template>

<style>
/* 2. 定义进入和离开时的过渡时间和曲线 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

/* 3. 定义进入的起点和离开的终点状态 (完全透明) */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 3.2 基础的 animation过渡

```vue
<script setup>
import { ref } from 'vue'
const show = ref(true)
</script>

<template>
  <button @click="show = !show">Toggle</button>

  <!-- 1. 使用 name 属性定义前缀 -->
  <Transition name="bounce">
    <p v-if="show" style="text-align: center;">
      Hello here is some bouncy text!
    </p>
  </Transition>
</template>

<style>
  .bounce-enter-active {
    animation: bounce-in 0.5s;
  }
  .bounce-leave-active {
    animation: bounce-in 0.5s reverse;
  }
  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.25);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
```

### 3.3 进阶控制：自定义过渡类名 (结合 Animate.css 等第三方库)

如果你不想手写 CSS，想直接使用类似 `Animate.css` 这样强大的第三方动画库，`<Transition>` 允许你**直接指定具体的类名**，彻底覆盖默认的 `v-xxx` 规则。

```vue
<!-- 引入 Animate.css -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>

<!-- 使用 enter-active-class 和 leave-active-class 强行注入第三方类名 -->
<Transition
  enter-active-class="animate__animated animate__tada"
  leave-active-class="animate__animated animate__bounceOutRight"
>
  <p v-if="show">我是一个带有浮夸动画的元素</p>
</Transition>
```

### 3.4 终极控制：JavaScript 钩子函数 (处理极其复杂的动画)

CSS 动画有其局限性。如果动画包含复杂的数学轨迹计算、物理碰撞模拟，或者你需要整合 GSAP、Anime.js 等专业的 JS 动画引擎，`<Transition>` 提供了纯 JS 触发的生命周期钩子。

```vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @after-enter="onAfterEnter"
  @enter-cancelled="onEnterCancelled"
  @before-leave="onBeforeLeave"
  @leave="onLeave"
  @after-leave="onAfterLeave"
  @leave-cancelled="onLeaveCancelled"
>
  <!-- ... -->
</Transition>
```

```js
// 在元素被插入到 DOM 之前被调用
// 用这个来设置元素的 "enter-from" 状态
function onBeforeEnter(el) {}

// 在元素被插入到 DOM 之后的下一帧被调用
// 用这个来开始进入动画
function onEnter(el, done) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  done()
}

// 当进入过渡完成时调用。
function onAfterEnter(el) {}

// 当进入过渡在完成之前被取消时调用
function onEnterCancelled(el) {}

// 在 leave 钩子之前调用
// 大多数时候，你应该只会用到 leave 钩子
function onBeforeLeave(el) {}

// 在离开过渡开始时调用
// 用这个来开始离开动画
function onLeave(el, done) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  done()
}

// 在离开过渡完成、
// 且元素已从 DOM 中移除时调用
function onAfterLeave(el) {}

// 仅在 v-show 过渡中可用
function onLeaveCancelled(el) {}
```

**示例**

```vue
<script setup>
import { ref } from 'vue'
// 假设你引入了专业的 JS 动画库 anime.js
import anime from 'animejs/lib/anime.es.js';

const show = ref(false)

// 🚨 极其重要：done 回调函数
// 在 JS 过渡中，你必须在动画结束时手动调用 done()，告诉 Vue：“我的动画跑完了，你可以进行下一步（比如销毁真实的 DOM 节点）了”。
const onEnter = (el, done) => {
  anime({
    targets: el,
    translateX: 250,
    duration: 800,
    complete: done // 动画完成时调用 Vue 的 done
  });
}

const onLeave = (el, done) => {
  anime({
    targets: el,
    translateX: 0,
    duration: 800,
    complete: done
  });
}
</script>

<template>
  <button @click="show = !show">Toggle</button>
  
  <!-- 必须加上 :css="false"，告诉 Vue 彻底跳过低效的 CSS 类名嗅探检测 -->
  <Transition
    @enter="onEnter"
    @leave="onLeave"
    :css="false"
  >
    <div v-if="show" class="box"></div>
  </Transition>
</template>
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我的 `<Transition>` 动画有时生效，有时像瞬移一样失效，且控制台毫无报错？
*   **答**：这往往是因为你的组件内部**包含多个根节点 (Fragment)** 或者是**内部直接就是一个注释节点**。
    *   **Vue 的物理限制**：`<Transition>` 能够施展魔法的前提是，它必须能够精确地找到**一个单一的、明确的真实原生 DOM 节点**去挂载 CSS 类名或触发事件。
    *   **避坑指南**：被 `<Transition>` 直接包裹的内容，**必须是一个绝对单一的根元素**。如果你包裹了一个自定义组件 `<MyComponent />`，请确保该组件内部最外层只有一个普通的 `<div>`，而不是好平级的元素。

### 4.2 路由切换时，两个页面的内容重叠在一起卡住了，导致动画极其难看！
*   **答**：这是因为默认情况下，进入动画和离开动画是**同时发生**的。
    *   **场景重现**：新页面在进入（透明度 0变1），旧页面在离开（透明度 1变0），这会导致两套完整的 DOM 树在页面上同时存在，把页面排版瞬间撑爆。
    *   **解决方案**：使用 `mode` 属性，强制改变两套动画的执行顺序。
    ```vue
    <!-- out-in：旧元素先执行离开动画，它完全消失且 DOM 被销毁后，新元素再开始进入。这是最常用的模式！ -->
    <!-- in-out：新元素先进入，完成后旧元素再离开（很少用）。 -->
    <Transition name="fade" mode="out-in">
      <component :is="activeComponent"></component>
    </Transition>
    ```

### 4.3 为什么元素的 `display: none` (`v-show`) 切换时，我的动画不起作用了？
*   **答**：这可能与 CSS 浏览器引擎底层的渲染机制有关。
    *   如果你的动画涉及 `height` (从 0 到 auto) 这种无法做线性计算的属性，CSS transition 原生是不支持的，只能瞬间突变。
    *   对于这种特殊场景，要么改用 `max-height` 做折中处理，要么放弃 CSS 动画，老老实实在 `<Transition>` 的 `@enter` / `@leave` 钩子里用 JS 去动态获取实际高度并执行动画。

### 4.4 初始化页面时，那个包裹在 `v-if="true"` 里的元素为什么直接生硬地出现了，没有触发动画？
*   **答**：这是 Vue 的默认性能策略。
    *   `<Transition>` 默认只在节点被**后续动态插入或移除**时才会触发。页面初次加载渲染（Initial Render）时，Vue 为了最快把页面画出来，直接跳过了动画计算。
    *   **解决方案**：如果你希望页面刚一打开，某个标题就执行极其炫酷的入场动画，请给 `<Transition>` 加上 **`appear`** 属性。
    ```vue
    <Transition name="slide-up" appear>
      <h1>我是拥有首屏登场特效的超级标题</h1>
    </Transition>
    ```
