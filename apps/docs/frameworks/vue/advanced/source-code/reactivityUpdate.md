# 响应式系统演进

Vue 2 和 Vue 3 在响应式系统的实现上有着根本性的差异。Vue 2 基于 `Object.defineProperty`，而 Vue 3 基于 `Proxy`。下面从源码实现角度详细分析两者的区别。

## 1. 核心实现机制

### 1.1 Vue 2：`Object.defineProperty`

Vue 2 在初始化数据时，会递归遍历对象的每一个属性，使用 `Object.defineProperty` 将它们转换为 `getter`/`setter`。

```javascript
// 简化版 defineReactive
function defineReactive(obj, key, val) {
  const dep = new Dep() // 每个属性有自己的依赖收集器
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      if (Dep.target) {
        dep.depend() // 依赖收集
      }
      return val
    },
    set: function reactiveSetter(newVal) {
      if (newVal === val) return
      val = newVal
      dep.notify() // 触发更新
    },
  })
}
```

- 每个属性对应一个 `Dep` 实例（依赖收集器）。
- 每个组件或 `watch` 对应一个 `Watcher` 实例。
- 依赖收集：当 `getter` 被访问时，将当前活跃的 `Watcher`（`Dep.target`）添加到 `dep` 中。
- 触发更新：当 `setter` 被调用时，调用 `dep.notify()` 通知所有 `Watcher` 重新执行。

### 1.2 Vue 3：`Proxy`

Vue 3 使用 `Proxy` 代理整个对象，而不是遍历属性。`Proxy` 可以拦截对象上的多种操作（读取、设置、删除、`in` 操作等）。

```typescript
// 简化版 reactive
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key) // 依赖收集
      const res = Reflect.get(target, key, receiver)
      if (isObject(res)) {
        return reactive(res) // 深度代理（懒代理）
      }
      return res
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      if (oldValue !== value) {
        trigger(target, key, value, oldValue) // 触发更新
      }
      return result
    },
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result) {
        trigger(target, key, undefined, undefined) // 删除也触发更新
      }
      return result
    },
  })
}
```

- 依赖收集和触发更新不再使用 `Dep` 类，而是通过全局的 `track` 和 `trigger` 函数。
- `track` 函数内部会建立 `target -> key -> effect` 的映射关系（`WeakMap` 存储）。
- `effect` 替代了 `Watcher`，更加轻量且支持调度器。

## 2. 对数组的响应式处理

### 2.1 Vue 2 数组响应式缺陷及解决

`Object.defineProperty` 无法拦截数组索引赋值和 `length` 变化，因此 Vue 2 通过**重写数组原型方法**来实现响应式。

```javascript
// 源码中 array.js
const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)[
  ('push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse')
].forEach(method => {
  const original = arrayProto[method]
  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      const result = original.apply(this, args)
      const ob = this.__ob__
      // 新增的元素也需要变成响应式
      let inserted
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          inserted = args.slice(2)
          break
      }
      if (inserted) ob.observeArray(inserted)
      ob.dep.notify() // 手动触发更新
      return result
    },
  })
})
```

- 通过将数组的 `__proto__` 指向 `arrayMethods`，拦截数组变异方法。
- 无法拦截直接通过索引赋值（如 `arr[0] = xxx`）或修改 `length`（如 `arr.length = 0`），需要借助 `Vue.set` / `delete` 或 `$set`。

### 2.2 Vue 3 数组响应式完美支持

`Proxy` 可以拦截所有对数组的操作，包括索引赋值、`length` 修改、以及 `push`、`pop` 等变异方法（因为变异方法内部会触发 `set` 拦截）。

```typescript
// 拦截 arr[0] = 1  → 触发 set
// 拦截 arr.length = 0 → 触发 set
// 拦截 arr.push(1) → 内部会调用 set 设置新索引和修改 length
```

因此 Vue 3 不需要重写数组原型，完全依靠 `Proxy` 的通用拦截。

## 3. 新增/删除属性的响应式

### 3.1 Vue 2：必须使用 `Vue.set` / `$set`

由于 `Object.defineProperty` 在初始化时已经遍历了已有属性，新增属性不会被拦截。Vue 2 提供了 `Vue.set` 方法，内部手动调用 `defineReactive` 并触发更新。

```javascript
Vue.set(obj, key, val) {
  defineReactive(obj, key, val)
  obj.__ob__.dep.notify()
}
```

删除属性需要使用 `Vue.delete`，因为 `delete` 操作无法被 `Object.defineProperty` 拦截。

### 3.2 Vue 3：原生支持

`Proxy` 可以拦截 `deleteProperty` 和 `set`（新增属性也是 `set` 操作）。所以直接添加或删除属性都是响应式的：

```javascript
const state = reactive({})
state.newProp = 'hello' // 自动触发依赖更新
delete state.newProp // 自动触发更新
```

## 4. 嵌套对象的响应式

### 4.1 Vue 2：递归遍历（一次性）

在初始化时，Vue 2 会深度遍历整个对象，对所有层级的属性都调用 `defineReactive`。这导致：

- 性能开销较大（尤其是深层嵌套大数据）。
- 但之后访问深层属性时，不需要再进行代理。

### 4.2 Vue 3：懒代理（按需）

Vue 3 只在访问到某个属性时，如果该属性的值是一个对象，才会将其转换为响应式（递归代理）。这样：

- 初始化性能更好，尤其是深层嵌套对象。
- 但访问深层属性时会动态创建代理，稍微增加运行时开销（通常可忽略）。

```typescript
// get 拦截中
const res = Reflect.get(target, key, receiver)
if (isObject(res)) {
  return reactive(res) // 懒代理
}
```

## 5. 依赖收集与触发更新的数据结构

### 5.1 Vue 2：Dep + Watcher（观察者模式）

- `Dep` 类：存储 `Watcher` 列表。
- `Watcher` 类：封装更新操作（组件渲染、用户 `watch`、`computed` 等）。
- 全局 `Dep.target` 指向当前正在执行的 `Watcher`。
- 依赖收集路径：`getter` → `dep.depend()` → `Dep.target.addDep(dep)` → `dep.addSub(Dep.target)`。

### 5.2 Vue 3：`targetMap` (WeakMap) + `effect`

- `targetMap`：`WeakMap<target, Map<key, Set<effect>>>`。
- 不再有 `Dep` 和 `Watcher` 类，取而代之的是 `effect` 函数和 `ReactiveEffect` 类（内部实现）。
- 依赖收集：`track(target, key)` 从 `targetMap` 中获取 `depsMap`，再将当前活跃的 `activeEffect` 添加到对应的 `Set` 中。
- 触发更新：`trigger(target, key)` 找到所有关联的 `effect`，调用其 `scheduler` 或直接执行。

## 6. 性能差异

| 方面           | Vue 2                            | Vue 3                    |
| -------------- | -------------------------------- | ------------------------ |
| 初始化大型对象 | 递归遍历所有属性，较慢           | 懒代理，初始化快         |
| 访问深层属性   | 无额外代理开销                   | 动态创建代理，有微小开销 |
| 数组操作       | 需要拦截原型方法，索引赋值无响应 | Proxy 完美拦截，性能更好 |
| 新增属性       | 需要 `$set`，性能较差            | 直接赋值，性能好         |
| 内存占用       | 每个属性一个 `Dep` 实例，较大    | `targetMap` 结构更轻量   |

## 7. 总结对比表

| 特性                 | Vue 2                                | Vue 3                                                                |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| 底层 API             | `Object.defineProperty`              | `Proxy`                                                              |
| 监听对象操作         | 只能 `get`/`set`                     | 13 种拦截操作（`get`、`set`、`deleteProperty`、`has`、`ownKeys` 等） |
| 数组监听             | 重写数组原型方法，索引/length 不响应 | 完美支持                                                             |
| 新增/删除属性        | 需 `Vue.set`/`delete`                | 原生支持                                                             |
| 嵌套对象响应式       | 初始化递归遍历（深）                 | 懒代理（按需深度）                                                   |
| 依赖收集器           | `Dep` + `Watcher`                    | `targetMap` + `effect`                                               |
| 代码体积             | 响应式模块较大                       | 响应式模块更轻（可 tree-shaking）                                    |
| 支持 Map/Set/WeakMap | 不支持（需额外处理）                 | 原生支持（通过 `reactive` 代理）                                     |
