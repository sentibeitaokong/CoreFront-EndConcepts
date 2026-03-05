---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 列表过渡(`<TransitionGroup>`)

## 1. 核心概念与应用边界

`<Transition>`有一个致命的物理限制：**它一次只能处理一个单一元素的进入或离开。**

当有一个可以动态增删的任务列表（Todo List）、一个可以拖拽重新排序的图片画廊、或者一个不断有新消息顶上去的聊天窗口时，你面临的是**由 `v-for` 生成的一整组 DOM 元素同时发生状态改变**,这时就需要**`<TransitionGroup>`**

| 与 `<Transition>` 的核心区别 | `<TransitionGroup>` 的独有特性 |
| :--- | :--- |
| **渲染物理实体** | `<Transition>` 本身不渲染任何额外的 DOM 节点（它只是一个抽象的幽灵包裹器）；而 **`<TransitionGroup>` 默认会在 DOM 中渲染出一个真实的标签**（在 Vue 3 中默认没有，但强烈建议通过 `tag` 属性指定，如 `tag="ul"`）。 |
| **多元素并行支持** | 专为配合 `v-for` 设计，可以同时处理列表中成百上千个元素的插入、移除和**位置移动**。 |
| **无法使用 `mode`** | 因为列表里的元素通常是此消彼长的，不存在绝对的“先出后进”顺序，所以不支持 `mode="out-in"` 这种属性。 |
| **强制要求 `:key` 🌟** | **极其严格的底线要求！** 内部被 `v-for` 循环出来的每一个元素，**必须提供绝对唯一的 `key` 属性**，绝不能用 `index`。 |

## 2. 核心机制与实战运用

`<TransitionGroup>` 完全继承了 `<Transition>` 的所有 CSS 类名生命周期(如`.fade-enter-active`)但它最伟大的魔法在于独创的**移动过渡 (Move Transitions)**。

### 2.1 移动过渡引擎 (`v-move`) 揭秘

当你删除了列表中的第 2 项时，第 3 项和第 4 项会由于 DOM 结构的塌陷，“瞬间”填补到上面去，显得极其生硬。
`<TransitionGroup>` 为了解决这个问题，在底层巧妙地运用了 **FLIP 动画架构 (First, Last, Invert, Play)**。

当它检测到元素因为兄弟节点的增删而**发生了物理位置的偏移**时，它会自动给正在移动的元素加上一个特殊的 CSS 类：**`v-move`**（或者你自定义前缀的 `xxx-move`）。

```html
<TransitionGroup name="list" tag="ul">
  <li v-for="item in items" :key="item">
    {{ item }}
  </li>
</TransitionGroup>

```
```css
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

/* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
.list-leave-active {
    position: absolute;
}
```

### 2.2 终极实战：一个带有完美动画的增删改查列表

要实现一个看起来极具“高级感”的列表（新增元素有动画、删除元素有动画、**周围的其他元素平滑地滑动过去填补空缺**），你需要编写以下标准模板：

```vue
<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, text: '苹果' },
  { id: 2, text: '香蕉' },
  { id: 3, text: '樱桃' }
])
let nextId = 4

const addItem = () => {
  const randomIndex = Math.floor(Math.random() * items.value.length)
  items.value.splice(randomIndex, 0, { id: nextId++, text: '新水果' })
}

const removeItem = (id) => {
  items.value = items.value.filter(item => item.id !== id)
}
</script>

<template>
  <button @click="addItem">随机插入</button>
  
  <!-- 1. tag="ul" 意味着 TransitionGroup 会在页面上渲染成一个 <ul> 标签 -->
  <!-- 2. name="list" 定义了后续 CSS 的前缀 -->
  <TransitionGroup name="list" tag="ul" class="fruit-list">
    <!-- 🚨 必须有唯一的 key，绝对不能用 index！ -->
    <li v-for="item in items" :key="item.id" class="fruit-item">
      {{ item.text }}
      <button @click="removeItem(item.id)">X</button>
    </li>
  </TransitionGroup>
</template>

<style>
/* --- 基础布局 --- */
.fruit-list { position: relative; padding: 0; }
.fruit-item { 
  display: flex; justify-content: space-between; 
  padding: 10px; border: 1px solid #ddd; margin-bottom: 5px; 
  background: white;
}

/* --- 动画核心配置 --- */

/* 1. 声明进入和离开的过程 (持续时间和缓动函数) */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

/* 2. 声明进入的起点和离开的终点 (透明度为0，并向右偏移) */
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 🔥 3. 施展平滑移动魔法的绝对关键！ */
/* .list-move 会在元素改变位置时被自动添加 */
.list-move {
  transition: transform 0.5s ease;
}

/* 🚨 4. 解决离场元素占位导致周围元素无法平滑滑动的 Bug！ */
/* 离开状态的元素必须脱离标准文档流，否则下面的元素要等它完全消失后才会“瞬间”跳上来 */
.list-leave-active {
  position: absolute; /* 脱离文档流 */
  width: 100%;        /* 防止绝对定位后元素宽度塌陷 */
}
</style>
```

## 3. 常见问题 (FAQ) 与避坑指南

`<TransitionGroup>` 虽然效果拔群，但它堪称 Vue 中“坑点最密集”的组件之一。无数开发者在这里被样式折磨得死去活来。

### 3.1 为什么我删除了一个列表项，它下面的兄弟节点是“瞬间”跳上去填补空缺的，没有那种顺滑的 `v-move` 滑动效果？
*   **答**：这是使用 `<TransitionGroup>` 最臭名昭著的经典 Bug！
    *   **原理真相**：被删除的元素在执行离开动画（如 `.list-leave-active` 中定义了 0.5 秒变透明）的这 0.5 秒内，**它在物理上依然占据着 DOM 的高度坑位！**
    *   此时，Vue 其实已经给它下面的元素加上了 `.list-move`，准备让它们往上滑。但是因为那个半透明的“尸体”还占着位置，下面的元素被死死挡住了，根本滑不动。等 0.5 秒后“尸体”真正被从 DOM 树中拔除，下面的元素就会失去阻挡，“瞬间”闪现到上面去。
    *   **终极解法**：在 CSS 中，给离开生效阶段的类名加上 **`position: absolute;`**。
    ```css
    .list-leave-active {
      position: absolute; /* 让它悬浮起来，把坑位让给下面的兄弟节点 */
    }
    ```
    *(注：加了绝对定位后，通常需要配合设置确定的 `width` 和 `box-sizing`，否则正在离开的元素会因为脱离文档流而瞬间变窄，导致动画抽搐。)*

### 3.2 为什么加了动画之后，有些元素的排版全乱了？或者动画一直在疯狂抽搐？
*   **答**：这绝对是你犯了**大忌：用 `index` 作为 `:key` 的值。**
    *   **致命连锁反应**：`<TransitionGroup>` 的底层 FLIP 动画算法，极其依赖 `:key` 来记录元素在移动前后的屏幕绝对坐标（BoundingClientRect）。
    *   如果你用 `index` 作为 key。当你在数组头部 `unshift` 插入一条新数据时，原本 index 为 0 的元素，其 index 瞬间变成了 1。在 Vue 的底层看来，这相当于**所有旧元素全军覆没被销毁了，然后又瞬间原地生成了一批新元素**。
    *   算法的坐标记录彻底崩溃，导致你的动画群魔乱舞。**永远、绝对、必须使用具有业务唯一标识的 ID 作为 key！**

### 3.3 `<TransitionGroup>` 可以配合第三方拖拽库（如 Sortable.js / Vue.Draggable）使用吗？
*   **答**：**需要极度谨慎。**
    *   **控制权冲突**：Vue 的 `<TransitionGroup>` 试图掌控 DOM 元素的位置和排序动画。而第三方的物理拖拽库（如 Sortable.js）也是通过直接操作底层 DOM 节点来实现拖拽换位的。
    *   当 Vue 准备去移动一个 DOM 时，发现这个 DOM 已经被 Sortable.js 强行移动过了，或者被挂载了无法解析的行内 `style="transform:..."`，两者的状态机会发生灾难性的冲突。
    *   **最佳实践**：如果业务重度依赖复杂的拖拽排序，建议直接放弃 `<TransitionGroup>`，转而使用专门为 Vue 封装且内部处理好状态同步的专用库（如 `vuedraggable`）。如果只是极其简单的内部排序，自己写数据交换逻辑配合 `v-move` 即可。

### 3.4 为什么页面刚加载时，`<TransitionGroup>` 渲染出来的列表结构不对，还报了 Hydration Mismatch (水合不匹配) 错误？
*   **答**：这通常发生在你使用了服务端渲染 (SSR) 或 Nuxt.js 的项目中。
    *   在 Vue 3 中，`<TransitionGroup>` **默认不再渲染任何包裹元素**（即变成了一个 Fragment 碎片）。
    *   如果在服务端渲染时没有包裹元素，到了客户端接管时，极易发生 DOM 节点对不上的水合错误。
    *   **避坑规范**：永远养成好习惯，给它明确指定一个 `tag` 属性（如 `tag="ul"` 或 `tag="div"`），为你的列表提供一个坚实的物理父容器。
