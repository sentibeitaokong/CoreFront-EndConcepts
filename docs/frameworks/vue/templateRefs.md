---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 模板引用 (Template Refs)

## 1. 核心概念与使用场景

Vue 的核心哲学是**数据驱动视图 (Data-Driven View)**，我们绝大多数时间都在通过操作 `ref` 和 `reactive` 中的数据，让 Vue 在底层通过虚拟 DOM 自动帮我们更新页面。

但在真实的业务场景中，我们经常会遇到必须要**打破这个黑盒，直接伸手去触摸真实的物理 DOM 节点，或者去调用子组件实例内部的方法**的情况。这就是**模板引用 (Template Refs)** 存在的意义。

| 典型应用场景 | 具体需求示例 |
| :--- | :--- |
| **获取原生 DOM 属性** | 获取某个 `div` 渲染后的实际高度/宽度 (`clientHeight`, `offsetWidth`)，或者获取其在页面中的绝对坐标 (`getBoundingClientRect`)。 |
| **执行原生 DOM 方法** | 让某个 `<input>` 元素自动获得光标焦点 (`focus()`)，或者控制一段 `<video>` 视频的播放/暂停 (`play()`)。 |
| **接入第三方非 Vue 库** | 使用 ECharts 画图、使用 Three.js 渲染 3D 场景，它们都需要你传入一个真实的 `<div id="canvas">` DOM 节点作为挂载容器。 |
| **调用子组件的方法** | 父组件点击“清空”按钮，强制调用子组件 `Form.vue` 内部封装的 `resetFormData()` 方法。 |

## 2. 核心操作实战 (`<script setup>` 视角)

在 Vue 3 的 `<script setup>` 语法糖中，获取引用的方式与 Vue 2 的 `this.$refs` 有了翻天覆地的变化。它变得更加函数式，也更契合 TypeScript 的类型推导。

### 2.1 捕获单个原生 DOM 元素

这是最基础也是最常用的操作。

```vue
// Vue 3.5版本前的用法
<script setup>
import { ref, onMounted } from 'vue'

// 1. 声明一个响应式的 ref，初始值必须是 null。
// 【极其重要】：这个变量的名字，必须和下面模板里 ref="..." 的名字一模一样！
const myInputRef = ref(null)

// 2. DOM 只有在组件挂载完成后才会被渲染出来
onMounted(() => {
  // 此时 myInputRef.value 已经被 Vue 悄悄塞入了真实的 HTMLInputElement 节点
  console.log('获取到的 DOM:', myInputRef.value)
  
  // 安全地调用原生方法
  if (myInputRef.value) {
    myInputRef.value.focus()
    myInputRef.value.style.border = '2px solid red'
  }
})
</script>

<template>
  <!-- 3. 在模板中打上 ref 标记，名字是 "myInputRef" -->
  <input ref="myInputRef" placeholder="我会自动获得焦点" />
</template>

// Vue 3.5+  我们可以使用辅助函数 `useTemplateRef()` 获取引用
<script setup>
  import { useTemplateRef, onMounted } from 'vue'

  // 第一个参数必须与模板中的 ref 值匹配
  const input = useTemplateRef('my-input')

  onMounted(() => {
    input.value.focus()
  })
</script>

<template>
  <input ref="my-input" />
</template> 
```

### 2.2 捕获由 `v-for` 循环生成的多个 DOM 元素

在 Vue 2 中，如果你给 `v-for` 里的元素加了 `ref="items"`，Vue 会自动把 `this.$refs.items` 变成一个包含所有 DOM 的数组。但在 Vue 3 中，由于渲染机制的改变，这种自动收集的“魔法”被取消了，我们需要显式地声明一个数组。

```vue
<script setup>
import { ref, onMounted,useTemplateRef } from 'vue'

const list = ref(['Apple', 'Banana', 'Cherry'])

// 1. 声明一个空数组的 ref
// Vue 3.5以前
const itemRefs = ref([])
// Vue 3.5+
// const itemRefs = useTemplateRef('itemRefs')

onMounted(() => {
  // 此时 itemRefs.value 是一个包含了 3 个 <li> 元素的真实 DOM 数组
  console.log(itemRefs.value) 
  
  // 可以遍历操作它们
  itemRefs.value.forEach((el, index) => {
    el.style.color = index === 0 ? 'red' : 'black'
  })
})
</script>

<template>
  <ul>
    <!-- 2. 直接将 ref 绑定到上面声明的那个数组变量名上，Vue 会自动将每次循环生成的 DOM push 进去 -->
    <li v-for="item in list" :key="item" ref="itemRefs">
      {{ item }}
    </li>
  </ul>
</template>
```

### 2.3 函数型 Ref (终极灵活方案)

如果你想对拿到的 DOM 进行更细粒度的控制，或者想要规避 `v-for` 数组收集顺序不确定的问题，你可以直接往 `ref` 里传一个**回调函数**。每次组件更新、该 DOM 元素被创建或销毁时，这个函数都会被触发。

```vue
<script setup>
import { ref } from 'vue'

const dynamicRef = ref(null)

// 当元素被挂载时，el 是真实 DOM；当元素被卸载(如 v-if=false)时，el 是 null。
const setRef = (el) => {
  console.log('DOM 节点状态改变了:', el)
  dynamicRef.value = el
}
</script>

<template>
  <!-- 直接绑定一个函数 -->
  <div :ref="setRef">我是动态的 DOM</div>
</template>
```

## 3. 跨组件引用：获取子组件实例与防线 (`defineExpose`)

在大型表单或者复杂的父子联动场景中，父组件常常需要直接去拿到子组件的内部数据，或者命令子组件执行某个函数。

在 Vue 2 中，父组件可以通过 `this.$refs.child.xxx` 畅通无阻地访问子组件的所有数据和方法。但**在 Vue 3 的 `<script setup>` 中，组件默认是“绝对封闭”的黑盒。** 这是一项极其重要的架构改进，旨在防止父组件过度干涉子组件的内部状态，从而导致代码严重耦合。

如果父组件一定要访问，**子组件必须显式地“开后门”**。

**子组件 (ChildComponent.vue)**：
```vue
<script setup>
import { ref } from 'vue'

const privateCount = ref(0) // 这是我的私有财产，外部休想碰到

const publicTitle = ref('Hello Public') // 我打算公开这个
function resetStatus() {                // 我也打算公开这个方法
  privateCount.value = 0
  console.log('状态已重置')
}

// 🚨 极其重要：使用 defineExpose 明确声明向父组件暴露哪些资产
defineExpose({
  publicTitle,
  resetStatus
})
</script>
```

**父组件 (ParentComponent.vue)**：
```vue
<script setup>
import { ref, onMounted,useTemplateRef } from 'vue'
import ChildComponent from './ChildComponent.vue'

// 1. 声明一个与模板 ref 同名的变量 
//Vue 3.5以前
const myChildRef = ref(null)
// Vue 3.5+
// const myChildRef = useTemplateRef('myChildRef')

onMounted(() => {
  // 2. 拿到子组件实例
  const childInstance = myChildRef.value
  
  if (childInstance) {
    // 3. 只能访问被 defineExpose 暴露出来的东西
    console.log(childInstance.publicTitle) // 'Hello Public'
    childInstance.resetStatus()            // 成功调用方法
    
    // 4. 尝试访问没暴露的东西，拿到的是 undefined，起到了极好的保护作用
    console.log(childInstance.privateCount) // undefined 
  }
})
</script>

<template>
  <ChildComponent ref="myChildRef" />
</template>
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我的 `ref` 在 `<script setup>` 里打印出来总是 `null`？
*   **答**：这是新手踩坑率 100% 的问题。原因通常有三个：
    1.  **时机不对 (最常见)**：DOM 节点只有在组件挂载完成后（也就是执行过 `render` 函数生成页面后）才会存在。如果你直接在 `<script setup>` 顶层去 `console.log(myRef.value)`，此时页面还没开始画，当然是 `null`。**必须将其放在 `onMounted` 钩子里，或者在用户的交互事件（如 `@click`）中去获取。**
    2.  **名字没对上**：你定义的 `const myBox = ref(null)` 名字，和模板里 `<div ref="myBoxx">` 差了一个字母。
    3.  **被 `v-if` 隐藏了**：如果你要获取的元素上带有 `v-if="false"`，那么这个 DOM 在物理上根本就没有被创建出来，你自然拿不到。必须等 `v-if` 变成 `true` 且等待一次 `nextTick` 之后才能拿到。

### 4.2 数据更新了，为什么我通过 `ref` 拿到的 DOM 节点的高度/内容还是旧的？
*   **答**：这涉及 Vue 核心的**异步更新队列**机制。
    *   **原理**：当你执行 `list.push(newItem)` 修改了响应式数据时，Vue **并没有立刻去更新真实 DOM**。它把这次更新放进了一个微任务队列里，等当前这段 JS 代码全部跑完后，再去统一批量打补丁更新 DOM，以追求极致性能。
    *   **避坑指南**：如果你修改了数据，且立刻需要基于更新后的真实 DOM 来计算高度或者执行动画，**必须包裹在 `nextTick` 中**。
    ```javascript
    import { nextTick } from 'vue'

    list.value.push('New Item');
    
    // ❌ 此时 DOM 还没更新，拿到的是旧高度
    // const h = listContainerRef.value.clientHeight; 
    
    // ✅ 告诉 Vue：等 DOM 真正更新画完之后，再执行我的回调
    await nextTick();
    const h = listContainerRef.value.clientHeight; // 拿到了真实的新高度
    ```

### 4.3 我用 `v-for` 循环拿到的 `itemRefs` 数组，顺序怎么跟我源数据的顺序不一样？
*   **答**：
    *   **历史变迁**：在 Vue 2 中，`v-for` 绑定的 ref 数组是被官方承诺能保持与数据源完全一致的顺序的。
    *   **Vue 3 的改变**：由于 Vue 3 底层更新机制（尤其是异步补丁机制）的重构，**官方明确表示：不再保证 `v-for` 生成的 ref 数组顺序与源数组顺序一致。**
    *   **解决方案**：绝不能依赖 ref 数组的索引 `itemRefs.value[i]` 去对应源数据的第 `i` 项。如果你需要精准对应，**请在数据源中携带一个唯一的 id**，然后在 DOM 上绑定 `data-id="xxx"`，获取时通过 `find` 查找，或者改用**函数型 ref** 自己手动按顺序控制收集。
