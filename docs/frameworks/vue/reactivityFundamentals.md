---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 响应式基础与 Composition API (Reactivity Fundamentals)

## 1. 核心概念与特性

在 Vue 3 的 `setup` 模式下，主要通过两个极其重要的核心 API 来定义响应式数据：**`ref()`** 和 **`reactive()`**。

| 核心 API | 接收类型 | 底层实现 | 使用特征 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **`ref`** | **任何类型** (包含基本类型如 `string`/`number` 和对象类型) | 借助对象 getter/setter 拦截 `.value` 属性。如果是对象，底层还会调用 `reactive`。 | 在 JS 代码中必须通过 `.value` 访问和修改。但在模板 (Template) 中使用会自动解包，无需加 `.value`。 | **万金油，官方推荐的默认选择。** 适合处理基本类型、需要整体替换的对象/数组。 |
| **`reactive`** | **仅限对象类型** (`Object`, `Array`, `Map`, `Set`) | 纯粹的 ES6 `Proxy` 代理整个对象。 | 在 JS 代码和模板中都不需要 `.value`，直接使用属性点语法访问。 | 适合具有固定嵌套结构的表单状态，或不需要被解构的复杂状态树。 |

## 2. 响应式基础 API 实战

### 2.1 `ref()`：最通用的响应式引用

`ref` 的本质是将一个值包装进一个带有 `.value` 属性的对象中。

```JS
// 伪代码，不是真正的实现
function ref(value) {
    const refObject = {
        get value() {
            track(refObject, 'value')
            return value
        },
        set value(newValue) {
            value = newValue
            trigger(refObject, 'value')
        }
    }
    return refObject
}
```

`ref` 可以持有任何类型的值，包括深层嵌套的对象、数组或者 `JavaScript` 内置的数据结构，比如 `Map`,`ref`会使它的值具有深层响应性。这意味着即使改变嵌套对象或数组时，变化也会被检测到：

```vue
<script setup>
import { ref } from 'vue'

// 1. 声明基本类型
const count = ref(0)
const message = ref('Hello')

// 2. 声明对象/数组类型(底层会自动包装成 reactive)
const user = ref({ name: 'Alice', age: 25 })
const list = ref()

function increment() {
  // 🚨 在 JS 逻辑中，必须加上 .value 才能操作真实的数据！
  count.value++
  message.value += '!'
  
  // 整体替换对象，响应式绝对不会丢失
  user.value = { name: 'Bob', age: 30 } 
  list.value = [] // 清空数组的安全写法
}
</script>

<template>
  <!-- 在模板中，Vue 会自动解包(Unwrap)，千万别写 count.value -->
  <button @click="increment">{{ count }} - {{ message }}</button>
<!-- 深层响应性  修改user.name会被监测到 -->
  <p>{{ user.name }}</p>
</template>
```

### 2.2 `reactive()`：对象属性的深层代理

`reactive()` 使一个对象本身具有响应性。它是深层代理的：当对象的嵌套属性发生变化时，也会触发更新。

```js
// 伪代码，不是真正的实现
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key)
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      trigger(target, key)
    }
  })
}
```

**示例**

```vue
<script setup>
  import { reactive } from 'vue'

  const state = reactive({
    count: 0,
    nested: {
      msg: 'Hello'
    }
  })

  function mutate() {
    // 直接操作属性，不需要 .value，非常符合直觉
    state.count++
    state.nested.msg += ' World'
  }
</script>

<template>
  <button @click="mutate">{{ state.count }} - {{ state.nested.msg }}</button>
</template>
```
* 缺陷:
  *  **有限的值类型:** 它只能用于对象类型 (对象、数组和如 `Map`、`Set` 这样的集合类型)。它不能持有如 `string`、`number` 或 `boolean` 这样的原始类型。
  *  **不能替换整个对象:** 由于 `Vue` 的响应式跟踪是通过属性访问实现的，因此我们必须始终保持对响应式对象的相同引用。
  *  **对解构操作不友好:**  当我们将响应式对象的原始类型属性解构为本地变量时，或者将该属性传递给函数时，我们将丢失响应性连接：

## 3. 响应式高级API实战

`Vue 3` 的响应式系统不仅提供了最基础的 `ref` 和 `reactive` 来定义状态，还为了应对各种复杂的业务和性能场景，暴露了一套极具深度的“高级 `API`”。


| API 分类 | 核心 API | 核心作用与使用场景 |
| :--- | :--- | :--- |
| **响应式转换** | `toRef`, `toRefs`, `unref` | 在不丢失响应式的前提下，解构对象，或者安全剥离 `ref` 包装。 |
| **只读与保护** | `readonly`, `shallowReadonly` | 锁定数据，防止被子组件或外部非法修改（强制单向数据流）。 |
| **浅层代理 (性能)** | `shallowRef`, `shallowReactive` | 放弃深层代理，只代理第一层。用于处理如图表实例、庞大的数据报表等不需要深层响应式监听的场景，极大提升性能。 |
| **依赖注入脱离** | `markRaw`, `toRaw` | 彻底屏蔽 Vue 的响应式劫持，把对象当成纯净的 JS 对象处理（如整合第三方非 Vue 库时使用）。 |

### 3.1 `unref`：安全解包
当你不知道传入的 `val` 到底是一个 `ref` 还是一个普通字符串时：
```javascript
import { ref, unref } from 'vue'

const countRef = ref(10)
const normalCount = 20

// unref 是 val = isRef(val) ? val.value : val 的语法糖
console.log(unref(countRef))   // 10
console.log(unref(normalCount))// 20
```

### 3.2 `toRefs` 与 `toRef`：解构不丢失响应式
在组件通信中，如果你把 `props`（它本质上是一个 reactive 对象）直接解构，就会失去响应式。

```javascript
import { toRefs, toRef } from 'vue'

// 假设传入的 props 为 { title: 'Hello', count: 1 }
export default {
  setup(props) {
    // ❌ 错误：title 变成了普通的字符串 'Hello'，父组件怎么改，这里都不会变了
    // const { title } = props 
    
    // ✅ 正确 1：把 props 里的所有属性都安全地转成 ref
    const { title, count } = toRefs(props)
    
    // ✅ 正确 2：如果你只需要提其中某一个属性
    const titleRef = toRef(props, 'title')
    
    return { titleRef }
  }
}
```

### 3.3 `shallowRef`：应对巨型数据的性能大杀器
如果你的后台返回了一个包含 10 万个元素的巨大 JSON 数组用来渲染一个 Table 表格，而且你**绝不会去单独修改数组里某一个元素的某个属性**（只会重新请求接口把整个数组替换掉）。
如果用 `ref`，Vue 会非常吃力地递归遍历这 10 万个元素去加上 Proxy。

```javascript
import { shallowRef } from 'vue'

// 浅层 ref：只有 .value 被重新赋值时才会触发视图更新
// 它完全放弃了内部深层数据的 Proxy 劫持，初始化速度起飞！
const massiveData = shallowRef([])

// 模拟请求
setTimeout(() => {
  // 整体替换，会触发更新 ✅
  massiveData.value = [{ id: 1, text: '...' }, /* ... 10万条 */]
}, 1000)

// 🚨 注意：修改内部深层属性，绝不会触发视图更新！
// massiveData.value.text = 'changed' // 视图不更新 ❌
```

### 3.4 `markRaw`：彻底屏蔽响应式劫持
当你在 Vue 组件里引入了一个极其复杂的第三方库实例（比如 ECharts 的 `myChart` 实例，或者 Three.js 的 `Scene` 对象）。
你绝对不希望 Vue 用 Proxy 去劫持这个庞大且内部逻辑错综复杂的第三方对象，这会导致严重的性能崩溃甚至库报错。

```javascript
import { markRaw, reactive } from 'vue'
import * as echarts from 'echarts'

const state = reactive({
  chartInstance: null
})

// 初始化图表
const chart = echarts.init(document.getElementById('main'))

// ❌ 错误：如果直接赋值，Vue 会试图去把这个庞大的图表实例变成响应式的
// state.chartInstance = chart 

// ✅ 正确：给它打上 "Raw" (原始) 标记，告诉 Vue "不要碰它！"
state.chartInstance = markRaw(chart)
```

### 3.5 `toRaw`：返回代理的原始对象。
这是一个可以用于临时读取而不引起代理访问/跟踪开销，或是写入而不触发更改的特殊方法。不建议保存对原始对象的持久引用，请谨慎使用。

```javascript
const foo = {}
const reactiveFoo = reactive(foo)

console.log(toRaw(reactiveFoo) === foo) // true
```

### 3.6 `readonly`：单向数据流的钢铁卫士
当你想把顶层组件的内部状态通过 `provide` 传递给极其深层的子组件时，为了防止子组件不守规矩直接乱改你的状态，你需要给它穿上“防弹衣”。

```javascript
import { reactive, readonly, provide } from 'vue'

const state = reactive({ count: 0 })

// 暴露一个只读版本的 state 出去
const readonlyState = readonly(state)

provide('sharedState', readonlyState)

// 在深层子组件中：
// const state = inject('sharedState')
// state.count++ // ❌ 此时会报警告：Set operation on key "count" failed: target is readonly.
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 致命陷阱一：对 `reactive` 对象进行解构赋值会怎样？
*   **答**：**会瞬间永久失去响应式！**
    *   **原理**：`reactive` 的响应式依赖于外部的那个 `Proxy` 壳子。当你执行 `let { count } = state` 时，这相当于把一个普通的数字 `0` 复制给了局部变量 `count`。它已经和原来的 Proxy 壳子物理断开了连接。你再修改 `count`，视图绝对不会更新。
    *   **避坑方案 (toRefs)**：如果你非要解构，必须使用 Vue 提供的 `toRefs` 工具函数。它会把对象里的每个属性都变成一个独立的 `ref`。
    ```javascript
    import { reactive, toRefs } from 'vue'
    const state = reactive({ count: 0, name: 'Alice' })
    
    // 正确的解构方式：
    const { count, name } = toRefs(state)
    // 此时 count 是一个 ref，需要用 count.value 修改
    ```

### 4.2 致命陷阱二：将 `reactive` 对象整体重新赋值会怎样？
*   **答**：**同样会失去响应式！**
    *   **原因**：这和上一个坑类似。如果你写了 `let state = reactive({ a: 1 }); state = { a: 2 }` 或者从接口拿到数据 `state = await getData()`。你实际上是把 `state` 变量指向了一个全新的、**没有任何 Proxy 包装的普通内存地址**。原来的代理对象被抛弃了，响应式链条断裂。
    *   **避坑方案**：
        1. 使用 `Object.assign(state, newData)` 来合并新数据，保持原有的 Proxy 壳子不变。
        2. 把数组包裹在属性里：`const state = reactive({ list: [] }); state.list = newData;`
        3. **终极建议：只要你涉及向接口拉取数据覆盖原有数据，一律无脑使用 `ref()`。** 比如 `const list = ref([]); list.value = newData;` 这样绝对安全。

### 4.3 为什么官方现在越来越推荐优先使用 `ref` 而不是 `reactive`？
*   **答**：
    *   早期的 Vue 3 教程为了照顾 Vue 2 开发者的习惯（类似 `data` 返回的对象），推荐把所有状态塞进一个巨大的 `state = reactive({})` 中。
    *   但随着实践深入，大家发现 `reactive` 的限制太多（不能处理基本类型、不能解构、不能覆盖重新赋值）。
    *   而 `ref` 虽然需要写烦人的 `.value`，但它的行为是**高度一致且绝对安全的**。你永远不用担心它因为覆盖赋值而失去响应式。为了减少心智负担，目前的社区共识是：**默认首选 `ref`**。

### 4.4 什么时候模板里解包 `ref` 会失效？
*   **答**：这是一个冷门但容易卡住的边界情况。
    *   Vue 模板的自动解包机制**仅适用于顶层属性**。
    *   **失败场景**：如果你把一个 `ref` 放进了一个普通的 JS 对象里，在模板中直接渲染它是不会解包的。
    ```vue
    <script setup>
    const count = ref(0)
    // 注意：wrapper 本身是一个普通对象，不是 reactive 的
    const wrapper = { countRef: count } 
    </script>
    <template>
      <!-- ❌ 错误：页面会显示 [object Object] -->
      {{ wrapper.countRef }} 
      
      <!-- ✅ 必须手动加 .value 或者修改业务逻辑 -->
      {{ wrapper.countRef.value }}
    </template>
    ```

### 4.5 既然 `shallowRef` 这么快，我全用 `shallowRef` 代替 `ref` 可以吗？
*   **答**：**绝对不行。这是典型的过度优化。**
    *   绝大多数的表单双向绑定、对象的局部属性修改，都必须依赖深层代理。如果你用了 `shallowRef`，当你执行 `user.value.name = 'Bob'` 时，Vue 根本不知道数据变了，页面永远不会刷新。
    *   **边界守则**：只有当你明确知道这个数据是**只读展示**的庞大列表、或者你永远只会对它进行**整体重新赋值覆盖**时，才考虑使用 `shallowRef`。

### 4.6 我不小心修改了 `shallowRef` 内部的属性，页面没更新，有没有办法强制刷新一下？
*   **答**：**有，但不推荐作为常规手段。**
    *   Vue 提供了一个底层的应急 API 叫 **`triggerRef()`**。
    *   当你执行 `triggerRef(massiveData)` 时，相当于你手动拿着大喇叭通知 Vue：“喂！我偷偷改了 `shallowRef` 里面的深层数据，请你立刻强制把依赖它的视图全部刷新一遍！”
    *   这是在极端性能优化场景下，牺牲自动化换取控制权的手段。

### 4.7 `toRaw` 和 `markRaw` 有什么区别？
*   **答**：一句话总结：`toRaw` 是去伪存真，`markRaw` 是防患于未然。
    *   **`toRaw(proxyObj)`**：你已经有了一个被 Vue 代理过的响应式对象，但由于某种原因（比如要传给一个不支持 Proxy 的第三方老旧 JS 库），你需要临时拿到它**最原始的、没有任何劫持的纯 JS 对象**，可以用它扒掉 Proxy 外衣。
    *   **`markRaw(obj)`**：你手里是一个干净的原始对象，你准备把它塞进 Vue 的 `reactive` 数据里。为了防止它“待会儿被 Vue 玷污”，你提前给它盖个章，Vue 看到章就会绕着走。

### 4.8 `readonly` 包裹的对象，如果内部的原始 `reactive` 数据变了，它会跟着变吗？
*   **答**：**会跟着变！**
    *   `readonly(state)` 本质上是给 `state` 套了一层“只准读不准写”的单向滤镜。
    *   它阻断的仅仅是你**试图通过 `readonlyState` 去修改数据**的行为。如果顶层组件通过**原始的 `state`** 把数据修改了，由于引用地址一致，拿到 `readonlyState` 的深层子组件依然会立刻响应式地更新视图。这就是完美的单向数据流闭环。


