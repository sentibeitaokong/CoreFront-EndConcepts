# Vue 3 良好的 TypeScript 支持

Vue 3 从底层架构上对 TypeScript 提供了**一等公民**支持。整个框架的源码由 TypeScript 编写，并提供了完善的类型定义文件。这使得 Vue 3 能够与 TypeScript 无缝集成，为开发者提供强大的类型检查、智能提示和重构能力。

## 1. 设计目标与核心优势

- **完整的类型推导**：组件的 props、data、computed、methods 等选项都能自动推导类型，减少手动标注。
- **组合式 API 的完美支持**：`ref`、`reactive`、`computed`、`watch` 等 API 均具备精确的泛型类型。
- **IDE 友好**：配合 VSCode 的 Volar 插件，提供模板中的类型检查、自动补全和跳转定义。
- **类型安全**：在编译时捕获常见错误（如访问不存在的属性、类型不匹配）。

## 2. 基础用法：类型标注

### 2.1 `defineComponent` 辅助函数

使用 `defineComponent` 包装组件可以获得类型推导：

```typescript
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    message: String,
    count: { type: Number, required: true }
  },
  data() {
    return {
      localValue: 0
    }
  },
  computed: {
    double(): number {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.localValue++
    }
  }
})
```

`defineComponent` 会自动推断 `this` 上下文中的 props、data、computed、methods 的类型。

### 2.2 `<script setup>` 中的类型

使用 `<script setup>` 时，TypeScript 支持更加简洁：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 自动推导类型
const count = ref(0)          // Ref<number>
const msg = ref<string>('hello')  // 显式泛型

// props 类型声明
const props = defineProps<{
  title: string
  userId?: number
}>()

// emits 类型声明
const emit = defineEmits<{
  (e: 'change', value: string): void
  (e: 'submit'): void
}>()

// 计算属性
const double = computed(() => count.value * 2)
</script>
```

## 3. 响应式 API 的类型

### 3.1 `ref`

```typescript
import { ref, Ref } from 'vue'

// 自动推导
const count = ref(0)          // Ref<number>

// 显式指定类型
const user = ref<User | null>(null)

// 只读 ref
const readonlyCount = readonly(count)  // Readonly<Ref<number>>
```

### 3.2 `reactive`

```typescript
interface State {
  name: string
  age: number
}

const state = reactive<State>({
  name: 'John',
  age: 30
})
```

注意：`reactive` 无法直接为泛型参数推导，通常需要显式声明接口。

### 3.3 `computed`

```typescript
const double = computed<number>(() => count.value * 2)  // 显式返回类型
const triple = computed(() => count.value * 3)          // 自动推导
```

### 3.4 `watch` / `watchEffect`

```typescript
watch(count, (newVal, oldVal) => {
  // newVal 和 oldVal 自动推导为 number
})

watchEffect(() => {
  console.log(count.value)   // count 类型已知
})
```

## 4. 组件 Props 与 Emits 的高级类型

### 4.1 运行时声明 + 类型

```typescript
export default defineComponent({
  props: {
    // 类型通过 `type` 定义，TypeScript 会自动推导
    name: String,
    age: {
      type: Number,
      required: true
    }
  }
})
```

### 4.2 基于泛型的纯类型声明（推荐）

```vue
<script setup lang="ts">
interface Props {
  title: string
  items: string[]
  visible?: boolean
}

const props = defineProps<Props>()

// 设置默认值
const { visible = true } = defineProps<Props>()
</script>
```

### 4.3 复杂 Emits 类型

```typescript
const emit = defineEmits<{
  (e: 'update', id: number, data: Record<string, any>): void
  (e: 'close'): void
}>()
```

## 5. 组合式函数 (Composables) 的类型

编写可复用的组合式函数时，明确定义参数和返回值类型：

```typescript
import { ref, Ref } from 'vue'

export function useCounter(initialValue: number = 0): { count: Ref<number>; inc: () => void } {
  const count = ref(initialValue)
  const inc = () => count.value++
  return { count, inc }
}
```

使用时自动获得类型提示：

```vue
<script setup lang="ts">
const { count, inc } = useCounter(10)
// count 类型为 Ref<number>
</script>
```

## 6. 模板中的 TypeScript

借助 **Volar** 插件，Vue 单文件组件的模板也能获得类型检查：

- 识别 `v-bind`、`v-on` 表达式的类型
- 检查 props 传入是否正确
- 对 `ref` 模板引用的类型推导

示例：

```vue
<template>
  <input ref="inputEl" />
  <button @click="handleClick(123)">Click</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const inputEl = ref<HTMLInputElement | null>(null)

const handleClick = (value: number) => {
  console.log(value)
}
</script>
```

## 7. 扩展全局类型

有时需要为 Vue 的全局属性或组件添加类型声明。

### 7.1 扩展组件实例类型

在 `env.d.ts` 或 `shims-vue.d.ts` 中：

```typescript
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $http: typeof import('axios').default
  }
}
```

### 7.2 扩展全局组件

```typescript
// global-components.d.ts
import MyButton from './components/MyButton.vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MyButton: typeof MyButton
  }
}
```

## 8. 常见类型工具

Vue 3 导出了一些辅助类型，用于提取组件或 API 的类型。

| 类型                | 作用                               |
| ------------------- | ---------------------------------- |
| `ComponentProps`    | 提取组件的 props 类型              |
| `ComponentEmits`    | 提取组件的 emits 类型              |
| `PropType`          | 用于复杂 props 类型标注            |
| `MaybeRef` / `MaybeRefOrGetter` | 表示可能是 ref 或普通值的联合类型 |

示例：使用 `PropType`

```typescript
import { PropType } from 'vue'

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    }
  }
})
```

## 9. 与构建工具的集成

- **Vite**：开箱即用，直接支持 `.vue` 文件 + TypeScript。
- **Webpack**：配合 `vue-loader` 和 `ts-loader` 或 `babel-loader`（需配置）。
- **推荐使用 `vite-plugin-vue` 或 `@vitejs/plugin-vue`**。

## 10. 总结

| 方面                   | Vue 3 的 TypeScript 支持                                       |
| ---------------------- | -------------------------------------------------------------- |
| **源码**               | 完全使用 TypeScript 编写，类型定义精确                         |
| **组件类型**           | `defineComponent` 和 `<script setup lang="ts">` 提供完整推导   |
| **响应式 API**         | `ref`、`reactive` 等支持泛型，类型安全                         |
| **模板类型检查**       | 通过 Volar 插件实现，接近 TS 体验                              |
| **扩展性**             | 支持扩展全局类型和组件实例类型                                 |
| **工具链**             | Vite / Webpack 均可良好配合                                    |

