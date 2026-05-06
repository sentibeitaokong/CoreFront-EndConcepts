# Vue 3 `provide` / `inject` 源码级解析

`provide` 和 `inject` 是 Vue 3 中实现**依赖注入**的核心 API，用于解决组件树中跨层级的数据传递问题。与 `props` 逐层传递相比，`provide` / `inject` 允许祖先组件向所有后代组件（无论层级多深）注入数据，而无需手动逐级传递。

## 1. 设计动机与作用

### 1.1 为什么需要 `provide` / `inject`？

- **跨层级传递**：避免深层组件链上重复传递 `props`（“`prop drilling`”）。
- **组件库设计**：为组件库内部通信提供便利（如 `el-form` 与 `el-form-item`）。
- **响应式数据共享**：可以注入响应式数据（`ref` / `reactive`），实现数据联动。

### 1.2 与 props / 事件 / 全局状态管理的对比

| 方式 | 适用场景 | 实现复杂度 | 响应式支持 |
|------|----------|------------|------------|
| `props` | 直接父子关系 | 低 | 是 |
| 事件 | 子传父 | 低 | 否 |
| `provide` / `inject` | 跨层级祖先-后代 | 中 | 是（可注入 ref） |
| `Vuex` / `Pinia` | 全局共享 | 高 | 是 |

## 2. 核心数据结构

`provide` 和 `inject` 的实现依赖于组件实例上的 `provides` 对象。每个组件实例（`ComponentInternalInstance`）都有一个 `provides` 属性，指向一个对象，该对象包含该组件及其祖先组件提供的所有数据。

**组件实例中的 `provides`**

:::code-group
```typescript [component.ts]
const instance = {
    // ...
    // 默认直接引用父级的 provides 对象
    provides: parent ? parent.provides : Object.create(appContext.provides)
}
```
:::

## 3. `provide` API 实现

`provide` 可以在 `setup()` 函数或选项式 API 的 `provide` 选项中使用。组合式 API 中，`provide` 函数定义在 `packages/runtime-core/src/apiInject.ts`。

:::code-group
```typescript [apiInject.ts]
export function provide(key, value) {
    if (!currentInstance) {
        // 只能在 setup() 中调用
        return
    }
    //存当前组件实例
    const currentInstance:any = getCurrentInstance()
    let provides = currentInstance.provides
    const parentProvides = currentInstance.parent && currentInstance.parent.provides
    // 当自身 provides 等于父级 provides 时，说明这是当前组件【第一次】调用 provide。
    // 必须切断引用关系，否则赋值会直接污染父组件的 provides。
    if (parentProvides === provides) {
        // 魔法在此：创建一个新对象，并将其原型(__proto__)指向父组件的 provides
        provides = currentInstance.provides = Object.create(parentProvides)
    }
    // 挂载数据到自身的 provides 上
    provides[key] = value
}
//组件当前实例
export function getCurrentInstance() {
    return currentInstance
}
```
:::

## 4. `inject` API 实现

`inject` 用于在后代组件中获取祖先提供的数据。

:::code-group
```typescript [apiInject.ts]
export function inject(key, defaultValue) {
    // 获取当前组件或全局 App 实例
    const currentInstance:any = getCurrentInstance()

    if (instance) {
        // 注入的数据来源：直接指向【父组件】的 provides
        // (如果当前是根组件，则指向全局 appContext 的 provides)
        const provides = instance.parent == null
            ? instance.vnode.appContext && instance.vnode.appContext.provides
            : instance.parent.provides

        // 'key in provides' 会自动顺着 Object.create 建立的原型链向上查找
        if (provides && key in provides) {
            return provides[key]
        }
        // 找不到则返回默认值
        else if (arguments.length > 1) {
            return typeof defaultValue === 'function' ? defaultValue() : defaultValue
        }
    }
}

//组件当前实例
export function getCurrentInstance() {
    return currentInstance
}
```
:::

## 5. 响应式支持与最佳实践

### 5.1 注入响应式数据

`provide` 可以注入 `ref` / `reactive` 对象，这样后代组件修改响应式数据时，祖先也能感知变化。

```typescript
// 祖先组件
const count = ref(0)
provide('count', count)

// 后代组件
const count = inject('count')
count.value++  // 更改会反映到祖先
```

如果希望数据只读，可以使用 `readonly` 包装：`provide('count', readonly(count))`。

### 5.2 避免直接修改注入的数据

注入的数据最好由提供者管理变更方法，避免随意修改造成状态混乱。推荐模式：

```typescript
// 祖先提供数据和修改方法
provide('state', { count, increment: () => count.value++ })
```

## 6. TypeScript 支持：`InjectionKey`

为了类型安全，Vue 提供了 `InjectionKey<T>` 接口，可以定义带类型的 key。

```typescript
import { InjectionKey } from 'vue'

const myKey: InjectionKey<number> = Symbol('myKey')
provide(myKey, 123)
const value = inject(myKey) // value 类型为 number | undefined
```

## 7. 完整流程图 

![Logo](/provide_inject.png)

## 8. 总结

`provide` / `inject` 通过原型链实现轻量级的依赖注入，适合中大型组件树的跨层级通信，同时保持数据的响应式和类型安全。