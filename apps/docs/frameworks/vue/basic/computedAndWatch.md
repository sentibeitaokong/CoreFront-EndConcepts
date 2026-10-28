---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 响应式状态派生与副作用 (Computed & Watch)

## 1. 核心概念与应用场景

在 Vue 中，我们通常会在 `data` (Vue 2) 或 `ref/reactive` (Vue 3) 中定义最基础的“**源状态**”。但在实际业务中，我们往往需要基于这些源状态进行复杂的数学计算、数组过滤，或者在状态改变时触发网络请求。

为了优雅地解决这些问题，Vue 提供了两大核心利器：**派生计算 (`computed`)** 和 **状态监听 (`watch` / `watchEffect`)**。

[width(19,36,45)]

| 特性对比            | `computed` (计算属性)                             | `watch` / `watchEffect` (侦听器)              |
| :------------------ | :------------------------------------------------ | :-------------------------------------------- |
| **核心职责**        | 解决模板中复杂的**数据派生逻辑**。                | 处理状态变化后的“**副作用 (Side Effects)**”。 |
| **是否有返回值**    | **必须有** `return` 结果。                        | 无需返回值。                                  |
| **是否支持异步**    | **绝对禁止**在内部执行异步请求！                  | **天生支持**，常用于发送 Ajax、设置定时器。   |
| **缓存机制 (核心)** | **有强大的缓存。** 依赖不变，多次访问不重新计算。 | 无缓存，状态改变一次，回调就执行一次。        |

## 2. 计算属性 (Computed) 深度解析

计算属性的设计初衷是用于替代模板中冗长的表达式，保持模板的整洁。

### 2.1 基础用法与缓存验证

```vue
<!-- 模板：不推荐在模板里写复杂的逻辑 -->
<p>{{ author.books.length > 0 ? 'Yes' : 'No' }}</p>

<!-- 推荐：使用计算属性 -->
<p>{{ publishedBooksMessage }}</p>
```

```js
// Vue 3 Composition API 示例
import { ref, computed } from 'vue'

const author = ref({
  name: 'John Doe',
  books: [
    'Vue 2 - Advanced Guide',
    'Vue 3 - Basic Guide',
    'Vue 4 - The Mystery',
  ],
})

// 一个计算属性 ref
const publishedBooksMessage = computed(() => {
  // 这段代码只有在 author.value.books 发生改变时才会重新执行
  console.log('重新计算了！')
  return author.value.books.length > 0 ? 'Yes' : 'No'
})

// 当你访问它 10 次：
publishedBooksMessage.value
publishedBooksMessage.value
// 控制台只会打印一次 "重新计算了！"。因为它的依赖(author.books)没有发生变化，直接返回缓存。
```

### 2.2 可写计算属性 (Writable)

计算属性默认是**只读**的。当你尝试修改一个计算属性时，Vue 会在控制台发出警告。但在某些极端场景（如与表单 `v-model` 结合使用时），你需要同时提供 getter 和 setter。

- **Getter 不应有副作用**：计算属性的 getter 应只做计算而没有任何其他的副作用，不要改变其他状态、在 `getter` 中做异步请求或者更改 `DOM`！
- **避免直接修改计算属性值**：计算属性的返回值应该被视为只读的，并且永远不应该被更改——应该更新它所依赖的源状态(**形参**)以触发新的计算。

```js
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  // getter：依赖别的状态计算出当前状态
  get() {
    return firstName.value + ' ' + lastName.value
  },
  // setter：当给 fullName 赋值时触发，反向更新底层的依赖状态
  set(newValue) {
    // 解构赋值，更新源状态
    ;[firstName.value, lastName.value] = newValue.split(' ')
  },
})

// 赋值操作触发 setter，自动把 firstName 变为 'Jane'，lastName 变为 'Smith'
fullName.value = 'Jane Smith'
```

### 2.3 高频场景

[width(22,43,35)]

| 业务场景          | 推荐写法                                            | 为什么                                 |
| ----------------- | --------------------------------------------------- | -------------------------------------- |
| 价格 / 数量格式化 | `computed(() => price.value * count.value)`         | 依赖不变时命中缓存，不在模板里重复计算 |
| 列表搜索 / 排序   | `computed(() => list.value.filter(...).sort(...))`  | 派生数据只读，源数组不被修改           |
| 全选 / 半选状态   | `computed(() => items.value.every(i => i.checked))` | 多字段联动，避免在模板里写复杂表达式   |
| 表单字段双向绑定  | `computed({ get, set })`                            | `set` 里拆分、校验后写回源状态         |

## 3. 侦听器 (Watch & watchEffect) 深度解析

如果你需要在状态变化时执行“**副作用**”——例如更改 DOM、发送 API 请求，或者把数据存入 LocalStorage，就应该使用侦听器。

### 3.1 基础 `watch` 与深层监听 (`deep`)

`watch` 的第一个参数可以是不同形式的“**数据源**”：它可以是一个 `ref` (包括计算属性)、一个响应式对象、一个 `getter` 函数、或多个数据源组成的数组：

```js
import { ref, watch, reactive } from 'vue'

const question = ref('')
const state = reactive({ user: { name: 'Alice', age: 20 } })

// 1. 基础监听一个 ref
watch(question, async (newQuestion, oldQuestion) => {
  if (newQuestion.includes('?')) {
    // 触发网络请求等副作用
    const answer = await fetch('/api/answer')
  }
})

// 2. 监听 Reactive 对象时的深度陷阱 (Deep)
// 默认情况下，watch 直接监听 reactive 对象时是【隐式深层监听】的
watch(state, (newValue, oldValue) => {
  // 当 state.user.age 被修改时触发。
  // 注意：此时 newValue 和 oldValue 是同一个对象引用！它们长得一模一样。
})

// 3. 精准监听对象上的某个特定属性 (最佳实践)
watch(
  () => state.user.age, // 提供一个 getter 函数
  (newAge, oldAge) => {
    // 只有 age 变了才触发，性能更好，且能精准拿到新老值
  },
)

// 4. 多个来源组成的数组
watch([question, () => state.user.age], ([newX, newY]) => {
  console.log(`x is ${newX} and y is ${newY}`)
})
```

### 3.2 立即执行 (`immediate`)

默认情况下，`watch` 是**懒执行**的：只有当数据发生第一次改变时，回调才会执行。如果希望组件一加载（数据初始化时）就立刻执行一次回调，需要开启 `immediate`。

```js
watch(
  source,
  (newValue, oldValue) => {
    // 立即执行一次，此时 oldValue 为 undefined
  },
  { immediate: true },
)
```

### 3.3 `watchEffect`：更聪明的全自动侦听器

如果你觉得 `watch` 每次都要手动指定依赖太麻烦了，Vue 3 提供了一个杀手级 API：`watchEffect`。
它会**立即执行一遍传入的函数，并自动追踪函数内部用到了哪些响应式状态**。只要里面用到的状态变了，它就重新执行。

```js
import { ref, watchEffect } from 'vue'

const todoId = ref(1)
const data = ref(null)

// 组件加载时立即执行一次 fetch。
// 因为代码内部读取了 `todoId.value`，Vue 会自动把 todoId 收集为依赖。
// 以后每当 todoId 改变，这个函数就会自动重新执行，再次发起请求。
watchEffect(async () => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/todos/${todoId.value}`,
  )
  data.value = await response.json()
})
```

### 3.4 一次性侦听器

每当被侦听源发生变化时，侦听器的回调就会执行。如果希望回调只在源变化时触发一次，请使用 once: true 选项。(仅支持 3.4 及以上版本)

```js
watch(
  source,
  (newValue, oldValue) => {
    // 当 `source` 变化时，仅触发一次
  },
  { once: true },
)
```

### 3.5 副作用清理

但是如果在请求完成之前 id 发生了变化怎么办？当上一个请求完成时，它仍会使用已经过时的 ID 值触发回调。理想情况下，我们希望能够在 id 变为新值时取消过时的请求。
我们可以使用 `onWatcherCleanup()`(`Vue 3.5+` 中支持) 来注册一个清理函数，当侦听器失效并准备重新运行时会被调用，并且必须在 `watchEffect` 效果函数或 `watch` 回调函数的**同步**执行期间调用：你不能在异步函数的 `await` 语句之后调用它。

```js
import { watch, onWatcherCleanup } from 'vue'

watch(id, newId => {
  const controller = new AbortController()

  fetch(`/api/${newId}`, { signal: controller.signal }).then(() => {
    // 回调逻辑
  })

  onWatcherCleanup(() => {
    // 终止过期请求
    controller.abort()
  })
})
```

作为替代，`onCleanup`(`Vue 3.5`之前版本都支持) 函数还作为第三个参数传递给侦听器回调，以及 `watchEffect` 作用函数的第一个参数：

```js
watch(id, (newId, oldId, onCleanup) => {
  // ...
  onCleanup(() => {
    // 清理逻辑
  })
})

watchEffect(onCleanup => {
  // ...
  onCleanup(() => {
    // 清理逻辑
  })
})
```

### 3.6 异步侦听器(Post Watchers)

如果想在侦听器回调中能访问被 Vue 更新之后的所属组件的 DOM，你需要指明 `flush: 'post'` 选项：

```js
watch(source, callback, {
  flush: 'post',
})

watchEffect(callback, {
  flush: 'post',
})

//简写
import { watchPostEffect } from 'vue'

watchPostEffect(() => {
  /* 在 Vue 更新后执行 */
})
```

### 3.7 同步侦听器(sync Watchers)

```js
watch(source, callback, {
  flush: 'sync',
})

watchEffect(callback, {
  flush: 'sync',
})

//简写
import { watchSyncEffect } from 'vue'

watchSyncEffect(() => {
  /* 在响应式数据变化时同步执行 */
})
```

### 3.8 停止侦听器

一个关键点是，侦听器必须用同步语句创建：如果用异步回调创建一个侦听器，那么它不会绑定到当前组件上，你必须手动停止它，以防内存泄漏。如下方这个例子：

```js
<script setup>
import { watchEffect } from 'vue'

// 它会自动停止
watchEffect(() => {})

// ...这个则不会！
setTimeout(() => {
  watchEffect(() => {})
}, 100)
</script>
```

要手动停止一个侦听器，请调用 `watch` 或 `watchEffect` 返回的函数：

```js
const unwatch = watchEffect(() => {})

// ...当该侦听器不再需要时
unwatch()
```

### 3.9 侦听器选项速查

[width(20,24,24,32)]

| 属性 / 选项                | 常用取值                             | 适用场景                       | 注意点                                               |
| -------------------------- | ------------------------------------ | ------------------------------ | ---------------------------------------------------- |
| `deep`                     | `true` / `false`                     | 监听对象、数组内部字段变化     | 直接监听 `reactive` 对象时隐式开启；新旧值是同一引用 |
| `immediate`                | `true`                               | 初始化时立刻拉取数据           | 首次回调的 `oldValue` 为 `undefined`                 |
| `flush`                    | `'pre'`（默认）/ `'post'` / `'sync'` | 需要读取更新后的 DOM 用 `post` | `post` / `sync` 都有对应的简写函数                   |
| `once`                     | `true`                               | 只处理第一次变化               | Vue 3.4+，触发后侦听器自动停止                       |
| `onCleanup`                | watch 第三参 / watchEffect 第一参    | 取消过期请求、清理定时器       | `onWatcherCleanup`（3.5+）必须在同步阶段调用         |
| `onTrack`                  | `(e) => {}`                          | 调试依赖是否收集正确           | 开发环境排查多余依赖                                 |
| `onTrigger`                | `(e) => {}`                          | 调试回调为何被触发             | 开发环境排查重复触发                                 |
| `watchEffect(fn, options)` | `{ flush, onTrack, onTrigger }`      | 自动追踪依赖的副作用           | 默认立即执行；不支持 `immediate` / `deep` / `once`   |

[width(23,55,22)]

| 业务场景                           | 推荐写法                                                         | 为什么                           |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| 路由参数变化后重新拉取详情         | `watch(() => route.params.id, fetchDetail, { immediate: true })` | 首次进入与参数变化共用一套逻辑   |
| 搜索框输入后请求建议               | `watch(keyword, fn)` + `onCleanup` 取消上一次请求                | 旧响应不会覆盖新结果，避免竞态   |
| 列表更新后测量 DOM 高度            | `watch(list, measure, { flush: 'post' })`                        | 回调执行时真实 DOM 已更新完毕    |
| 把筛选条件持久化到 localStorage    | `watch(state, save, { deep: true })`                             | 深层字段变化也能同步落盘         |
| 只响应第一次变化（如首次曝光埋点） | `watch(source, fn, { once: true })`                              | Vue 3.4+，不用手动调用 `unwatch` |

### 3.10 多源侦听与 `effectScope`

- **同时监听多个源**：`watch([a, b], ([newA, newB], [oldA, oldB]) => {})`，适合表单联动、组合筛选。
- **只监听一层**：Vue 3.5+ 支持 `deep: 1`，只追踪对象第一层属性，避免大对象全量递归。
- **手动管理作用域**：在组件外创建的 `watch` / `watchEffect` 不会自动停止，用 `effectScope()` 统一收集和释放。

```ts
import { effectScope, watch, watchEffect } from 'vue'

const scope = effectScope()
scope.run(() => {
  watch(source, () => {})
  watchEffect(() => {})
})
// 组件卸载或模块销毁时统一停止
scope.stop()
```

- **`watch` 与 `computed` 的边界**：需要“**派生一个值**”用 `computed`；需要“**值变化后做副作用**”用 `watch`。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 计算属性 (Computed) 里可以发起 Axios 请求吗？

**绝对、强烈、坚决禁止！** 这是一个致命的架构错误。

- **原因**：计算属性的职责是基于现有数据推导出一个同步的新数据以供模板渲染。它的执行是同步的，要求立即 `return` 结果。如果你在里面发起异步请求，它不仅返回不了结果，还会因为模板频繁重渲染导致发送无数个垃圾请求，甚至造成无限死循环。
- **避坑指南**：处理异步请求、操作 DOM、修改外部状态等所有被称为“**副作用 (Side Effects)**”的操作，**必须写在 `watch` 或组件的生命周期钩子（如 `onMounted`）中**。

### 4.2 为什么我用了 `watch` 监听一个对象，当对象内部属性改变时，新值 (newValue) 和旧值 (oldValue) 长得一模一样？

这是 JavaScript 引用类型的物理限制导致的新手巨坑。

- **原因**：当你直接监听一个对象（如 `reactive` 包装的对象）时，对象的内存地址（引用）并没有发生改变。Vue 直接把这个引用同时传给了 `newValue` 和 `oldValue`，所以它们指向内存中的同一个对象，里面的值自然也是被修改后的最新值。
- **解决方案**：如果你确实需要对比对象改变前后的具体快照，**必须深度克隆这个对象进行监听**。

```js
watch(
  () => JSON.parse(JSON.stringify(state.obj)), // 返回一个深度拷贝的全新对象
  (newVal, oldVal) => {
    // 此时 newVal 和 oldVal 的引用是断开的，你能明确对比出谁改变了
  },
  { deep: true },
)
```

### 4.3 `watch` 和 `watchEffect` 到底该怎么选？

- 选 **`watchEffect`**：如果你需要“**组件一加载就立刻执行一次（比如初始拉取数据）**”，并且你的副作用逻辑依赖了好几个响应式变量，懒得挨个在数组里声明依赖，用它最爽，代码最简洁。
- 选 **`watch`**：如果你需要：1. 精确获取状态改变前后的**新旧值**；2. 你想**懒执行**（刚进页面不执行，只有用户操作导致数据改变了才执行）；3. 明确知道副作用是由**哪一个具体的状态改变**引发的（职责单一），必须用 `watch`。

### 4.4 给 `v-for` 循环出的 DOM 列表加 `ref` 时，如何监听 DOM 的变化？

- 由于 Vue 更新 DOM 是**异步**的（批量放入微任务队列）。当响应式数据更新导致 Watcher 回调触发时，此时的真实 DOM 还没有开始渲染！
- 如果你需要在 `watch` 里去获取最新被渲染出来的 DOM 节点高度或数量，必须加上配置项 **`flush: 'post'`**。这告诉 Vue：“**请等组件的 DOM 完全渲染并更新完毕后，再执行我的 watch 回调**”。

```js
watch(
  listData,
  newList => {
    // 此时去拿 DOM 绝对是最新渲染出的 DOM 节点
    console.log(myListRef.value.children.length)
  },
  { flush: 'post' },
)
```
