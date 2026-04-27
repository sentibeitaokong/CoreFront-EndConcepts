# `computed`

`computed` 是 Vue 3 中基于响应式依赖进行缓存的派生状态 API。它根据依赖的响应式数据自动计算值，并提供**懒计算**和**缓存**
能力：只有在访问 `computed` 的值，或其依赖发生变化时才重新计算；否则直接返回缓存。

## 1. `computed` 的作用与设计动机

### 1.1 为什么需要 `computed`？

- 避免在模板中编写复杂表达式，提高可读性与可维护性。
- **缓存机制**：只有当依赖的响应式数据变化时，才会重新计算，否则返回上一次的结果，避免不必要的重复计算。
- 与普通函数的区别：普通函数每次访问都会重新执行，而 `computed` 会缓存结果，性能更优。

### 1.2 核心特性

| 特性         | 说明                                              |
|------------|-------------------------------------------------|
| **懒计算**    | 仅在值被读取的时候才执行计算函数，如果没有被使用，即使依赖变化也不会计算。           |
| **缓存**     | 依赖不变时，多次访问 `computed.value` 只会返回缓存值，不会重复执行计算函数。 |
| **响应式**    | 内部依赖的响应式数据变化时，`computed` 会标记为脏值，下一次访问时重新计算。     |
| **可写（可选）** | 通过传入 `get` 和 `set` 方法创建可写计算属性。                  |

### 1.3 与普通 `effect` / `watch` 的对比

| 特性  | `computed` | `effect`           | `watch`            |
|-----|------------|--------------------|--------------------|
| 返回值 | 计算结果       | 无（或 `runner`）      | 无                  |
| 缓存  | 有          | 无                  | 无                  |
| 懒计算 | 是（仅访问时计算）  | 否（立即执行，可配置 `lazy`） | 是（可配置 `immediate`） |
| 用途  | 派生状态       | 响应式副作用             | 监听特定数据变化           |

## 2. 核心实现：`ComputedRefImpl` 类

### 2.1 `computed` 函数入口

:::code-group
```typescript [computed.ts]
export function computed<T>(
    getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
    let getter: ComputedGetter<T>
    let setter: ComputedSetter<T> | undefined
    if (isFunction(getterOrOptions)) {
        //如果参数是函数，则视为只读 `computed`（只有 `getter`）
        getter = getterOrOptions
        setter = undefined
    } else {
        //如果参数是对象（包含 `get` 和可选的 `set`），则视为可写 `computed`。
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    return new ComputedRefImpl(getter, setter)
}
//是否为一个 function
const isFunction = (val: unknown): val is Function =>
    typeof val === 'function'
```
:::

### 2.2 `ComputedRefImpl` 类定义

:::code-group
```typescript [computed.ts]
import { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'
//计算属性类
export class ComputedRefImpl<T> {
    public dep?: Dep = undefined                //依赖存储
    private _value!: T                          //computed返回值
    public readonly effect: ReactiveEffect<T>   //依赖
    public readonly __v_isRef = true            //ref类型标识
    //脏：为 false 时，表示需要触发依赖。为 true 时表示需要重新执行 run 方法，获取数据。即：数据脏了
    public _dirty = true
    constructor(getter: ComputedGetter<T>,
                private readonly _setter: ComputedSetter<T> | undefined) {
        //第二个函数是scheduler函数，当有这个函数时，触发依赖时先执行这个函数，但不更新依赖，否则执行run方法触发依赖更新
        this.effect = new ReactiveEffect(getter, () => {
            // 判断当前脏的状态，如果为 false，表示需要触发依赖
            if (!this._dirty) {
                // 将脏置为 true，表示
                this._dirty = true
                //触发依赖
                triggerRefValue(this)
            }
        })
        this.effect.computed = this
    }

    get value() {
        // 收集依赖
        trackRefValue(this)
        // 判断当前脏的状态，如果为 true ，则表示需要重新执行 run，获取最新数据
        if (this._dirty) {
            this._dirty = false
            // 执行 run 函数
            this._value = this.effect.run()!
        }

        // 返回计算之后的真实值
        return this._value
    }
    //调用手动传入的自定义set方法
    set value(newValue: T) {
        if (this._setter) {
            this._setter(newValue)
        } else {
            console.warn('Write operation failed: computed value is readonly')
        }
    }
}
```

```typescript [dep.ts]
import { ReactiveEffect } from './effect'
export type Dep = Set<ReactiveEffect>
//依据 effects 生成 dep 实例
export const createDep = (effects?: ReactiveEffect[]): Dep => {
    //创建一个里面放有ReactiveEffect类的set数据类型，使用set是为了保证依赖的唯一性，dep保存所有依赖项
    const dep = new Set<ReactiveEffect>(effects) as Dep
    return dep
}
```

```typescript [effect.ts]
//响应性触发依赖时的执行类
let activeEffect: any
let shouldTrack: any
//依赖类
export class ReactiveEffect {
    private _fn: any
    //存在该属性，则表示当前的 effect 为计算属性的 effect
    computed?: ComputedRefImpl<T>
    //依赖数组
    deps = []
    //是否可用 响应式
    active = true
    //清空依赖执行的副作用函数
    onStop?: () => void
    public scheduler: Function | undefined
    constructor(fn: any, scheduler: any) {
        this._fn = fn
        this.scheduler = scheduler
    }
    run() {
        //1.会收集依赖，利用shouldTrack来区别  stop以后不让收集依赖
        if (!this.active) {
            return this._fn()
        }
        shouldTrack = true
        //将这个单例依赖类赋值给activeEffect
        activeEffect = this
        //执行fn方法时会收集依赖，收集完依赖再把shouldTrack置为false，防止依赖再次重复收集
        const result = this._fn()
        //reset
        shouldTrack = false
        return result
    }
    stop() {
        if (this.active) {
            cleanupEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}
//清除依赖
function cleanupEffect(effect: any) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}

//停止收集依赖
export function stop(runner: Runner): void {
    //执行依赖类的stop方法
    runner.effect?.stop()
}
```
:::

## 3. 依赖收集与触发更新

`ref` 的依赖收集和触发复用 `effect` 系统

### 3.1 `trackRefValue`

:::code-group
```typescript [ref.ts]
import { createDep, Dep } from './dep'
import { activeEffect, trackEffects} from './effect'
//收集依赖
export function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep || (ref.dep = createDep()))
    }
}
//是否可以收集依赖
export function isTracking() {
    //触发get操作还在收集依赖阶段 activeEffect为undefined时不收集依赖
    //不需要收集依赖的时候shouldTrack为false
    return shouldTrack && activeEffect !== undefined
}
```

```typescript [dep.ts]
import { ReactiveEffect } from './effect'
export type Dep = Set<ReactiveEffect>
//依据 effects 生成 dep 实例
export const createDep = (effects?: ReactiveEffect[]): Dep => {
    //创建一个里面放有ReactiveEffect类的set数据类型，使用set是为了保证依赖的唯一性，dep保存所有依赖项
    const dep = new Set<ReactiveEffect>(effects) as Dep
    return dep
}
```

```typescript [effect.ts]
//单例的，当前的 effect
let activeEffect: ReactiveEffect | undefined

//利用 dep 依次跟踪指定 key 的所有 effect
export function trackEffects(dep: Dep) {
    //添加单例依赖  
    //避免重复收集依赖
    if (dep.has(activeEffect)) return
    dep.add(activeEffect)
    //单例依赖项下面的deps数组中存储当前收集的依赖，用于清除依赖时使用
    activeEffect.deps.push(dep)
}
```
:::

### 3.2 `triggerRefValue`

:::code-group
```typescript [ref.ts]
import { triggerEffects} from './effect'
//触发依赖
export function triggerRefValue(ref) {
    if (ref.dep) {
        triggerEffects(ref.dep)
    }
}
```

```typescript [effect.ts]
//依次触发 dep 中保存的依赖
export function triggerEffects(dep: Dep) {
    // 把 dep 构建为一个数组
    const effects = isArray(dep) ? dep : [...dep]
    // 依次触发
    // for (const effect of effects) {
    // 	triggerEffect(effect)
    // }

    // 不在依次触发，而是先触发所有的计算属性依赖，再触发所有的非计算属性依赖
    for (const effect of effects) {
        if (effect.computed) {
            triggerEffect(effect)
        }
    }
    for (const effect of effects) {
        if (!effect.computed) {
            triggerEffect(effect)
        }
    }
}

//触发指定的依赖
export function triggerEffect(effect: ReactiveEffect) {
    if (effect.scheduler) {
        effect.scheduler()
    } else {
        effect.run()
    }
}
```
:::

## 4. 可写 `computed` 的实现

当传入的配置对象包含 `set` 方法时，`computed` 变为可写。用户在外部可以通过 `computed.value = newValue` 触发 `setter`。

```typescript
const writableComputed = computed({
    get: () => state.a + state.b,
    set: (val) => {
        state.a = val / 2
        state.b = val / 2
    }
})
```

## 5. 完整流程示例

### 5.1 基础使用示例

```ts
import {ref, computed, effect} from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

effect(() => {
    console.log(double.value)
})
// 立即输出: 0

count.value = 3   // 触发 computed 脏标记，然后 effect 重新执行，输出: 6
```

### 5.2 完整流程图

![Logo](/computed.png)

## 6. 特殊场景与边界处理

### 6.1 嵌套 `computed`

`computed` 可以依赖另一个 `computed`。依赖链上的任一个变化都会导致最终值重新计算，并且只会计算一次（因为缓存机制避免重复计算）。

- 内部 `effect` 嵌套时会形成依赖树，`scheduler` 会沿着依赖链向上传递脏标记。

### 6.2 多处读取同一 `computed`

由于 `computed` 依赖其 `dep` 收集所有依赖者，多个地方（如多个组件或 `watch`）访问同一个 `computed` 时，所有依赖者都会被正确触发更新。

### 6.3 `computed` 中抛出错误

如果在 `computed` 的 `getter` 中抛出异常，异常会被捕获并作为下一次 `.value` 访问时的返回值（实际上是 Re-throw）。需要确保
`getter` 是纯函数且稳定。

### 6.4 可写 `computed` 与 `v-model`

可写 `computed` 可以配合 `v-model` 使用，例如：

```vue
<input v-model="writableComputed"/>
```

- 输入变化时会自动触发 `computed.set`，更新依赖的数据。

## 7. 性能优化与注意事项

### 7.1 优化措施

- **缓存**：极大减少不必要的重复计算。
- **懒执行**：未被使用的 `computed` 永远不会计算，节省资源。
- **通过 `scheduler` 异步标记脏**：依赖变化时不立即计算，避免过多中间状态。

### 7.2 注意事项

- **不要在 `computed` 中修改依赖之外的状态**：`computed` 应该是纯函数，避免副作用（如修改其他响应式数据、发起请求等）。
- **避免创建非常耗时的 `computed`**：虽然缓存能减少计算次数，但如果依赖频繁变化，每次重新计算仍可能耗时，应考虑使用 `async`
  或 `watch` 替代。
- **访问 `computed.value` 时才会重新计算**：如果依赖变化后没有访问 `computed`，则不会重新计算，这可能导致 UI 上显示过时数据（但通常
  UI 会因组件渲染而访问 `computed`）。

## 8. 总结

| 模块            | 核心实现                            | 关键优化                  |
|---------------|---------------------------------|-----------------------|
| `computed` 入口 | `ComputedRefImpl` 类             | 支持只读/可写两种模式           |
| `_dirty` 标志   | 控制是否需要重新计算                      | 避免重复计算                |
| 内部 `effect`   | 使用 `ReactiveEffect` 包装 `getter` | 依赖自动收集，提供 `scheduler` |
| `scheduler`   | 仅标记脏值并触发依赖                      | 延迟计算，避免中间计算           |
| 依赖收集          | `trackRefValue`                 | 与 `ref` 共享依赖机制        |
| 可写 `computed` | 提供 `setter`                     | 兼容 `v-model` 等双向绑定场景  |

