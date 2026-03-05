---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 3 组合式 API 的 TypeScript 核心用法

## 1. 为 `ref()` 标注类型

默认情况下，`ref` 会根据初始值**自动推导**类型，这是最推荐的做法。但当你遇到初始值为 `null` 或者是一个复杂对象时，需要显式标注。

```typescript
import { ref } from 'vue'
import type { Ref } from 'vue' // 可选：导入内置的 Ref 类型

// 1. 简单泛型约束
const year = ref<string | number>('2020')

// 2. 复杂对象约束（尤其是初始值为 null 时必须写！）
interface User { id: number; name: string }
const currentUser = ref<User | null>(null)

// 3. 显式指定类型接口 (较少用)
const count: Ref<number> = ref(0)
```

## 2. 为 `reactive()` 标注类型

`reactive` 同样会隐式地从它的参数中推导类型。如果不满足自动推导，**官方推荐使用接口显式标注变量类型**。

```typescript
import { reactive } from 'vue'

interface Book {
  title: string
  year?: number
}

// 推荐写法：给变量指定类型
const book: Book = reactive({ title: 'Vue 3 Guide' })

// 不推荐写法：使用泛型（因为底层实现的一些边缘限制）
// const book = reactive<Book>({ title: 'Vue 3 Guide' }) ❌
```

## 3. 为 `defineProps` 标注类型

在 `<script setup>` 中，`defineProps` 是一个**编译宏**。标注它的类型有两种截然不同的风格，**绝对不要混用**。

### 3.1 基于类型的声明 (Type-based declaration 🌟)
这是 TS 环境下**最强大、最推荐**的写法。纯靠 TS 接口来定义，没有运行时开销。

```vue
<script setup lang="ts">
// 甚至可以将 Props 接口提取到外部 .ts 文件中 import 进来 (Vue 3.3+ 支持)
export interface Props {
  msg: string
  labels?: string[] // 可选属性
}

// 泛型传入接口
const props = defineProps<Props>()
</script>
```

**Props 解构默认值**

```typescript
// 现代优雅写法 (Vue 3.5+)
const { msg = 'hello', labels = ['default'] } = defineProps<Props>()
```

::: details Vue 3.4 版本以前
```ts
interface Props {
  msg?: string
  labels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  labels: () => ['one', 'two']
})
```
:::

**复杂的 `prop` 类型**

```vue
<script setup lang="ts">
interface Book {
  title: string
  author: string
  year: number
}

const props = defineProps<{
  book: Book
}>()
</script>
```


### 3.2 基于运行时的声明 (Runtime declaration)
如果你是从 Vue 2 迁移过来的，或者没开 TS，这是老写法：
```ts
const props = defineProps({
  msg: { type: String, required: true },
  labels: { type: Array, default: () => [] }
})
```

**复杂的`prop`类型**
```ts
import type { PropType } from 'vue'

const props = defineProps({
  book: Object as PropType<Book>
})
```

## 4. 为 `defineEmits` 标注类型

同样，`defineEmits` 也有运行时和类型两种声明方式。

### 4.1 基于类型的声明 (Type-based)
你可以极其精准地约束抛出事件的名字，以及附带参数的类型。

```typescript
// 基础写法：利用元组
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()

// 🚀 Vue 3.3+ 更简洁的新语法：
const emit = defineEmits<{
  change: [id: number]      // 键名就是事件名，值就是参数元组
  update: [value: string]
}>()
```

## 5. 为 `computed()` 标注类型

`computed` 会自动推导其返回值的类型。但在某些复杂场景下（如联合类型或防止内部逻辑写错导致返回错误类型），你可以显式指定泛型。

```typescript
import { ref, computed } from 'vue'

const count = ref(0)

// 显式指定计算属性的返回值必须是 number
const double = computed<number>(() => {
  // 如果这里写错了，return 'abc'，TS 就会立刻报错拦截
  return count.value * 2
})
```

## 6. 为 `provide` / `inject` 标注类型

`provide` 和 `inject` 通常会在不同的组件中运行。`Vue` 提供了一个 `InjectionKey` 接口，它是一个继承自 `Symbol` 的泛型类型，可以用来在提供者和消费者之间同步注入值的类型：

```ts
import { provide, inject } from 'vue'
import type { InjectionKey } from 'vue'

const key = Symbol() as InjectionKey<string>

provide(key, 'foo') // 若提供的是非字符串值会导致错误

const foo = inject(key) // foo 的类型：string | undefined
```

当使用字符串注入 `key` 时，注入值的类型是 `unknown`，需要通过泛型参数显式声明：
```ts
const foo = inject<string>('foo') // 类型：string | undefined
```

注意注入的值仍然可以是 `undefined`，因为无法保证提供者一定会在运行时 `provide` 这个值。

当提供了一个默认值后，这个 `undefined` 类型就可以被移除：

```ts
const foo = inject<string>('foo', 'bar') // 类型：string
```

## 7. 为模板引用 (Template Refs) 标注类型

当你想要通过 `ref` 获取一个 DOM 节点或子组件实例时，这是最容易踩坑的地方，因为它的初始值永远是 `null`。

### 7.1 标注原生 DOM 元素
在无法自动推断的情况下，仍然可以通过泛型参数将模板 ref 转换为显式类型。
 
```ts
const el = useTemplateRef<HTMLInputElement>('el')
```

模板引用需要通过一个显式指定的泛型参数和一个初始值 null 来创建：
::: details Vue 3.4 版本以前
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 必须标注类型，且联合 null，并初始化为 null
const el = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // 使用前必须加 ?. 或 if 判断，因为挂载前它是 null
  el.value?.focus()
})
</script>

<template>
  <input ref="el" />
</template>
```
:::

### 7.2 标注子组件实例 (`InstanceType`)
如果你想调用子组件通过 `defineExpose` 暴露出来的方法，你需要拿到极其精准的子组件类型。

```vue
<!-- MyModal.vue (子组件) -->
<script setup lang="ts">
const open = () => { /* 打开弹窗逻辑 */ }
defineExpose({ open })
</script>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import MyModal from './MyModal.vue'

// 🚀 核心魔法：使用 InstanceType 提取导入进来的组件类型
const modalRef = ref<InstanceType<typeof MyModal> | null>(null)

const openModal = () => {
  modalRef.value?.open() // 这里会有完美的代码提示和类型安全！
}
</script>
```

## 8. 为事件处理函数标注类型

```ts
function handleChange(event: Event) {
  console.log((event.target as HTMLInputElement).value)
}
```

## 9. 为自定义全局指令添加类型

```ts
import type { Directive } from 'vue'

export type HighlightDirective = Directive<HTMLElement, string>

declare module 'vue' {
  export interface ComponentCustomProperties {
    // 使用 v 作为前缀 (v-highlight)
    vHighlight: HighlightDirective
  }
}

export default {
  mounted: (el, binding) => {
    el.style.backgroundColor = binding.value
  }
} satisfies HighlightDirective
```

## 10. 常见问题 (FAQ) 与避坑指南

### 10.1 为什么我的 `defineProps` 报错 `missing semicolon` 或者提示语法错误？
*   **答**：**这是因为你忘记在 `<script setup>` 上加 `lang="ts"` 了！**
    *   `defineProps<{ msg: string }>()` 里面的 `<>` 是纯正的 TypeScript 泛型语法。如果你没告诉 Vue 编译器这是一段 TS 代码，它会按照纯 JS 的规范去解析，看到 `<` 就直接崩溃了。
    *   **解决**：永远确保写的是 `<script setup lang="ts">`。

### 10.2 为什么用 TS 接口声明的 `defineProps`，在子组件里如果只传了部分可选属性，控制台会报警告？
*   **答**：这是关于“响应式解构默认值”的坑。
    *   在 Vue 3.5 之前，如果你写了 `defineProps<{ msg?: string }>()` 且没有用 `withDefaults` 赋默认值。当父组件没传 `msg` 时，子组件模板里读到的实际上是个真实的 `undefined`。
    *   **现代最佳实践 (Vue 3.5+)**：直接使用解构并赋予默认值，这是官方目前最推崇的写法。
    ```typescript
    // TS 会完美推导，且底层响应式不会丢失
    const { msg = 'hello' } = defineProps<{ msg?: string }>()
    ```

### 10.3 `reactive` 能用泛型吗？为什么官方文档说不推荐？
*   **答**：
    *   你可以写 `const state = reactive<User>({ name: 'Alice' })`。
    *   **但不推荐的原因是**：`reactive` 的泛型底层实现有一些深奥的“深层解包（Deep Unwrapping）”逻辑。如果你传进去的接口 `User` 里面本身又包含了其他 `ref` 对象，TS 泛型有时无法完美推导出正确的解包后类型，导致你在写代码时没有提示甚至报错。
    *   **官方铁律**：给 `reactive` 标类型，**永远优先使用接口类型断言** `const state: User = reactive({ ... })`。

### 10.4 我能在外部的 `.ts` 文件里定义 Props 接口，然后 `import` 进 `defineProps` 吗？
*   **答**：**Vue 3.3+ 完美支持！**
    *   在以前的版本这是个大痛点（会报错由于宏编译限制无法解析外部引入）。
    *   现在你可以放心地建一个 `types.ts`，导出 `export interface MyProps { ... }`，然后在组件里 `import { type MyProps } from './types'`，最后 `defineProps<MyProps>()`。这极大方便了企业级应用中组件 API 契约的集中管理与复用。
