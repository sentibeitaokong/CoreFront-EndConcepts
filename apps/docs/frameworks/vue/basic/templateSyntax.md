---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 模板语法(Template Syntax)

## 1. 核心概念与特性

`Vue` 使用一种基于 `HTML` 的模板语法，允许你以声明式的方式将组件实例的响应式状态（`Data`）绑定到呈现的 `DOM` 上。

在底层，`Vue` 并不是直接把这段 `HTML` 塞给浏览器，而是会经历一个**编译过程 (`Compilation`)**：将模板字符串解析、优化，最终生成高度优化的 JavaScript `render` 渲染函数。当状态发生改变时，结合响应式系统，`Vue` 能极其智能地计算出需要重新渲染的最小成本，并应用到 `DOM` 上。

## 2. 数据绑定与插值表达式 (Interpolation)

### 2.1 文本插值 (Mustache 语法)

最基本的数据绑定形式是文本插值，它使用的是“**Mustache**”语法 (即双大括号)。

```vue
<!-- 基础绑定 -->
<span>Message: {{ msg }}</span>

<!-- 绑定时可以使用单一的 JavaScript 表达式 -->
<p>{{ number + 1 }}</p>
<p>{{ ok ? 'YES' : 'NO' }}</p>
<p>{{ message.split('').reverse().join('') }}</p>

<!--可以在绑定的表达式中使用一个组件暴露的方法：-->
<time :title="toTitleDate(date)" :datetime="date">
  {{ formatDate(date) }}
</time>
```

**特性**：双大括号会将数据解释为**纯文本**，而非 HTML。无论 `msg` 里是否包含 `<script>` 标签，都会被安全地转义显示，天然防范 XSS 攻击。

### 2.2 原始 HTML 插入 (`v-html`)

如果你确实想输出真正的 HTML 结构，必须使用 `v-html` 指令。

```vue
<!-- 如果 rawHtml 的值是 "<span style='color: red'>This should be red.</span>" -->
<p>Using text interpolation: {{ rawHtml }}</p>
<!-- 上面会直接输出带尖括号的纯文本 -->

<p>Using v-html directive: <span v-html="rawHtml"></span></p>
<!-- 上面的 span 内部会被真实渲染成红色的字 -->
```

**高危警告**：绝对不要把用户输入的内容（如评论区的留言）作为 `v-html` 的值，否则会导致极其严重的 XSS (跨站脚本攻击) 漏洞。

## 3. 核心指令系统 (Directives)

指令是带有 `v-` 前缀的特殊 HTML 属性。它们的作用是：当其绑定的表达式的值改变时，将某些特殊行为响应式地作用于 DOM。

### 3.1 属性绑定 (`v-bind`)

<span v-pre>{{ msg }}</span>不能在 HTML 属性 (attributes) 中使用。想要响应式地绑定一个属性，应该使用 `v-bind`。

```vue
<!-- 完整写法 -->
<div v-bind:id="dynamicId"></div>

<!-- 缩写语法 (最常用) -->
<div :id="dynamicId"></div>

<!-- 布尔型属性的特殊处理 (如 disabled, checked) -->
<!-- 如果 isButtonDisabled 为 null, undefined, 或 false，该属性甚至不会被渲染出来 -->
<button :disabled="isButtonDisabled">Button</button>

<!-- 批量绑定一个对象里的所有属性 -->
<div v-bind="objectOfAttrs"></div>
<!-- 如果 objectOfAttrs = { id: 'container', class: 'wrapper' } -->
```

Vue 对 `class` 和 `style` 做了专门的增强，支持传入对象或数组。

```vue
<!-- Class 对象语法：根据 isActive 和 hasError 的真假来决定是否挂载 active 和 text-danger 类名 -->
<div :class="{ active: isActive, 'text-danger': hasError }"></div>

<!-- Class 数组语法：可以混用静态类名和动态变量 -->
<div :class="[activeClass, errorClass]"></div>

<!-- Style 对象语法 -->
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```

### 3.2 条件渲染 (`v-if` / `v-else` / `v-show`)

用于根据条件的真假来控制 DOM 元素的显示与隐藏。

```vue
<h1 v-if="awesome">Vue is awesome!</h1>
<h1 v-else>Oh no</h1>

<template v-if="ok">
  <h1>Title</h1>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</template>

<!-- v-show 的作用相同，但机制完全不同 -->
<h1 v-show="ok">Hello!</h1>
```

**机制区别**：`v-if` 是“**真实的**”按条件渲染，切换时会触发挥发和重建；`v-show` 只是简单地切换 CSS 的 `display` 属性，元素始终存在于 DOM 中。

### 3.3 列表渲染 (`v-for`)

基于一个数组或对象渲染一个列表。

```vue
<ul>
  <!-- 遍历数组 -->
  <li v-for="(item, index) in items" :key="item.id">
    {{ index }} - {{ item.message }}
  </li>
  
  <!-- 遍历对象 -->
  <li v-for="(value, key, index) in myObject" :key="key">
    {{ index }}. {{ key }}: {{ value }}
  </li>
  
  <!-- 遍历数字 (从 1 迭代到 10) -->
  <span v-for="n in 10" :key="n">{{ n }}</span>
</ul>
```

### 3.4 事件监听 (`v-on`)

用于监听 `DOM` 事件并在事件触发时执行 `JavaScript` 代码。

```vue
<!-- 完整写法 -->
<button v-on:click="counter += 1">Add 1</button>

<!-- 缩写语法 (最常用) -->
<button @click="handleClick">Click Me</button>

<!-- 传递参数与原始 DOM 事件对象 $event -->
<button @click="warn('Form cannot be submitted yet.', $event)">
  Submit
</button>
```

事件修饰符是 `Vue` 极度好用的语法糖，让你不再需要在 `JS` 函数里写恶心的 `event.preventDefault()`。

```vue
<!-- 阻止事件冒泡 -->
<a @click.stop="doThis"></a>

<!-- 阻止默认行为 (如表单提交刷新页面) -->
<form @submit.prevent="onSubmit"></form>

<!-- 可以链式调用 -->
<a @click.stop.prevent="doThat"></a>

<!-- 键盘修饰符：只有在敲击回车键时才调用 submit -->
<input @keyup.enter="submit" />
```

![Logo](/img/directiveFirst.png)

### 3.5 双向数据绑定 (`v-model`)

在表单元素（`<input>`, `<textarea>`, `<select>`）上创建双向数据绑定。
它本质上是一个**语法糖**：背后是监听用户的 `input` 事件，并把获得的新值赋给你的 `value` 变量。

```vue
<input v-model="message" placeholder="edit me" />
<p>Message is: {{ message }}</p>

<!-- 修饰符：.lazy (改为监听 change 事件而不是 input，失去焦点才同步数据) -->
<!-- 修饰符：.number (自动将用户输入通过 parseFloat 转换为数字) -->
<!-- 修饰符：.trim (自动过滤用户输入的首尾空白字符) -->
<input v-model.number="age" />
```

### 3.6 指令与修饰符

[width(16,32,19,33)]

| 属性 / 选项                     | 常用取值                                                         | 适用场景                      | 注意点                                                                                 |
| ------------------------------- | ---------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `v-bind` / `:`                  | `:id="id"`、`:disabled="bool"`、`v-bind="obj"`                   | 动态绑定属性、批量透传        | `null` / `undefined` / `false` 时布尔属性不会被渲染                                    |
| `v-on` / `@`（含事件修饰符）    | `@click="fn"`、`@keyup.enter`、`.stop.prevent.self.once.passive` | 事件监听、阻止冒泡 / 默认行为 | 需要原生事件对象时显式传 `$event`；`.passive` 与 `.prevent` 同用时 `.prevent` 会被忽略 |
| `v-model`（含表单修饰符）       | `v-model="msg"`、`.lazy`、`.number`、`.trim`                     | 表单双向绑定                  | 组件上对应 `modelValue` + `update:modelValue`；`.lazy` 改为监听 `change`               |
| `v-if` / `v-else-if` / `v-else` | 布尔表达式                                                       | 权限分支、条件渲染            | 切换会销毁并重建，不适合高频显隐                                                       |
| `v-show`                        | 布尔表达式                                                       | Tab、弹窗等频繁切换           | 元素始终在 DOM 中，只切换 `display`                                                    |
| `v-for`                         | `(item, index) in list`、`(value, key) in obj`                   | 列表 / 对象遍历               | 必须用稳定唯一的 `:key`，禁止用 `index`                                                |
| `v-once` / `v-pre`              | 无值                                                             | 静态内容只渲染一次 / 跳过编译 | `v-once` 之后不再响应更新；`v-pre` 用于展示原始 `{{ }}`                                |
| `v-memo`                        | `v-memo="[depA, depB]"`                                          | 大列表局部跳过更新            | 依赖数组不变时整块复用；空数组等价于 `v-once`                                          |

**高频场景：**

[width(23,33,44)]

| 业务场景            | 推荐写法                                          | 为什么                                  |
| ------------------- | ------------------------------------------------- | --------------------------------------- |
| 表单提交            | `@submit.prevent="onSubmit"` + `v-model.trim`     | 阻止页面刷新，顺手去掉首尾空格          |
| 列表增删 / 排序     | `v-for` + `:key="item.id"`                        | Diff 能正确复用和移动节点，避免状态错乱 |
| 事件委托 / 阻止冒泡 | 父级 `@click` + 子级 `.stop`，或 `.self` 只认自身 | 减少监听器数量，避免误触父级逻辑        |
| Tab / 弹窗频繁显隐  | `v-show`                                          | 只切 `display`，不销毁组件和 DOM        |

### 3.7 静态优化指令与动态参数

- **`v-once`**：只渲染一次，之后跳过更新；适合纯静态内容，不要用在会变化的数据上。
- **`v-memo`**：`v-memo="[depA, depB]"`，依赖数组不变时整块复用；`v-memo="[]"` 等价于 `v-once`。
- **`v-pre`**：跳过编译，原样输出 `{{ }}`；用于文档示例或展示模板源码。
- **`v-cloak`**：配合 CSS `[v-cloak] { display: none }`，在编译完成前隐藏未渲染的模板，避免闪屏。
- **`v-text`**：设置 `textContent`，不会解析 HTML；比 `v-html` 安全，适合纯文本。
- **动态参数**：`:[attrName]="value"`、`@[eventName]="handler"`，参数名必须是字符串或 `null`。

### 3.8 动态组件与插槽语法

```vue
<component :is="currentView" />
<component :is="isEdit ? EditForm : ReadonlyForm" />
```

- `:is` 可以接组件对象、组件名或异步组件；配合 `<KeepAlive>` 缓存切换过的组件。
- 默认插槽：`<slot />`；具名插槽：`<slot name="header" />`，父级用 `<template #header>`。
- 作用域插槽：`<slot :row="row" />`，父级用 `<template #default="{ row }">` 读取子组件数据。
- 动态插槽名：`<template #[slotName]>`；`$slots` / `useSlots()` 可判断插槽是否存在。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么用 `index` 作为 `v-for` 的 `:key` 是极其危险的行为？

- **原理机制**：`Vue` 利用 `:key` (身份证) 来执行底层的 Diff 算法。当列表更新时，它通过比对 key 来决定是复用、移动还是销毁这个节点。
- **灾难重现**：假设你渲染了 `A(idx:0), B(idx:1), C(idx:2)`，并在 B 组件的输入框里打了字。如果此时你把 A 删除了，数组变成了 `B, C`。此时 B 的 index 从 1 变成了 0。Vue 的 Diff 算法比对发现，key=0 的节点还在，只是内容从 A 变成了 B，于是它**强行复用**了那个节点。结果就是：B 抢占了原本 A 的 DOM，但输入框里留下的却是 A 的残影，状态彻底错乱！
- **正确规范**：永远使用数据中具有唯一性的 `id`（如数据库的主键）作为 key。除非这个列表是绝对静态的（只渲染，永远不会被增删、重排序），才可以勉强使用 index。

### 4.2 `v-if` 和 `v-show` 到底怎么选？

- **频繁切换选 `v-show`**：如果你做的是一个弹窗组件或者 Tab 切换，用户点来点去。`v-show` 只是修改 CSS 的 `display` 属性，性能极好。如果用 `v-if`，会疯狂地执行组件的销毁和重建（触发大量生命周期），导致卡顿。
- **几乎不切换选 `v-if`**：比如根据用户的权限（Admin 或 User）决定是否显示管理按钮。因为加载后权限基本不变，用 `v-if` 可以避免在首屏加载时去渲染那些原本就不该展示的 DOM 树，减轻初始渲染压力。

### 4.3 可以在自定义组件上使用 `v-model` 吗？

**完全可以，这是封装高级组件的必备技能。**

- 在 Vue 2 中，在子组件上写 `<MyComponent v-model="myVal" />`，等同于向子组件传递了一个名为 `value` 的 prop，并且监听了一个名为 `input` 的自定义事件。你只需要在子组件里 `$emit('input', newValue)` 即可。
- 在 Vue 3 中，该语法糖被统一重构为传递名为 `modelValue` 的 prop，并监听 `update:modelValue` 事件。

:::code-group

```vue [MyInput.vue]
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input :value="props.modelValue" @input="onInput" />
</template>
```

```vue [parent.vue]
<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './MyInput.vue'

const text = ref('')
</script>

<template>
  <MyInput v-model="text" />
</template>
```

:::

Vue 3.4+ 可以直接用 `defineModel()` 简化子组件：

```vue
<script setup lang="ts">
const model = defineModel<string>({ required: true })
</script>

<template>
  <input v-model="model" />
</template>
```

多个 `v-model` 用 `v-model:title="title"`，子组件对应 `defineModel('title')`。
